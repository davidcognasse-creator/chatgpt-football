#!/usr/bin/env python3
"""
Moteur COTES → probas.json : le signal PRIMAIRE du système Loto Foot.

Les cotes des bookmakers sont l'entrée la plus forte (comme pour la CDM).
Pour chaque match de grille.json, on résout le fixture sur API-Football, on
récupère les cotes "Match Winner" (multi-books), on retire la marge (« de-vig »)
et on moyenne → proba 1·N·2 du MARCHÉ. On COMPARE à la foule (mises FDJ) →
l'edge d'un jeu de pool = là où la foule s'écarte du marché sharp. La prédiction
maison d'API-Football sert de repli/cross-check.

Sortie :
  - probas.json   → consommé par grille-optim.py (grille sous budget 50 €)
  - MOTEUR-COTES.md → rapport marché vs foule + divergences

Couche `ajust_actualite` : corriger la proba avec les absents (star out, turnover)
AVANT que le marché bouge — le vrai edge. Alimentée par la compo API-Football
(à venir, ~40 min avant le coup d'envoi) + presse/manuel, pondérée par la note.

Secret APIFOOTBALL_KEY requis → GitHub Actions (plan Pro : cotes+compo+prédictions).
"""
import csv
import gzip
import io
import json
import os
import re
import unicodedata
import urllib.request
import urllib.parse

KEY = os.environ.get("APIFOOTBALL_KEY", "")
BASE = "https://v3.football.api-sports.io"
HERE = os.path.dirname(__file__)

# Note par joueur = valeur marchande Transfermarkt (dataset public R2).
R2 = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data"
TM_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
SCALE = 9e8   # valeur ~ d'un très bon XI ; poids d'un absent = sa note / SCALE
PCAP = 0.25   # une seule absence ne retire jamais plus de 25 % de la force

L = []
def say(s): L.append(s); print(s)

# Uniquement des formes juridiques/mots génériques — JAMAIS un nom d'équipe.
# (AIK, AFC, CSKA, United, City sont des noms réels → retirés.)
STOP = {"fc", "cf", "sc", "if", "sk", "ac", "as", "sd", "cd", "club", "de", "the",
        "football", "association", "calcio", "ff", "bk", "sv", "se", "ec", "ca"}


def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return [t for t in s.split() if t and t not in STOP]


def af(path):
    """GET API-Football (v3). Renvoie la liste `response` (lève sur erreurs API)."""
    req = urllib.request.Request(BASE + path, headers={"x-apisports-key": KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.loads(r.read().decode("utf-8", "replace"))
    e = j.get("errors")
    if (isinstance(e, list) and e) or (isinstance(e, dict) and e):
        raise RuntimeError(f"API errors: {e}")
    return j.get("response", [])


def devig(home, draw, away):
    ih, idr, ia = 1 / home, 1 / draw, 1 / away
    s = ih + idr + ia
    return {"1": ih / s, "N": idr / s, "2": ia / s}


def side_match(query_tokens, ev_tokens):
    """Score d'appariement d'un côté : tokens significatifs partagés."""
    q = set(t for t in query_tokens if len(t) >= 4)
    if not q:                       # nom court (AIK, PSG…) : garde tous les tokens
        q = set(query_tokens)
    if not q:
        return 0.0
    shared = q & ev_tokens
    minlen = 3 if all(len(t) <= 3 for t in q) else 4
    if not shared or max((len(t) for t in shared), default=0) < minlen:
        return 0.0
    return len(shared) / len(q)


_TEAM = {}
def team_id(name):
    """Résout un nom d'équipe → (id, nom officiel) via /teams?search, avec cache."""
    key = " ".join(norm(name))
    if key in _TEAM:
        return _TEAM[key]
    res = af(f"/teams?search={urllib.parse.quote(name)}")
    best = None
    nt = set(norm(name))
    for r in res:
        t = r.get("team") or {}
        score = side_match(list(nt), set(norm(t.get("name", ""))))
        if score > 0 and (not best or score > best[0]):
            best = (score, t.get("id"), t.get("name"))
    _TEAM[key] = (best[1], best[2]) if best else (None, None)
    return _TEAM[key]


def _find_fx(tid, other):
    """Dans les 10 prochains matchs de `tid`, trouve celui contre `other` (quel
    que soit le sens). Renvoie (fid, league, tid_is_home) ou None."""
    ot = set(norm(other))
    for r in af(f"/fixtures?team={tid}&next=10"):
        h = r["teams"]["home"]; a = r["teams"]["away"]
        opp = a if h["id"] == tid else h
        if side_match(list(ot), set(norm(opp["name"]))) > 0:
            return r["fixture"]["id"], r["league"]["name"], h["id"] == tid
    return None


def resolve_fixture(dom, ext):
    """Trouve le fixture dom–ext ; renvoie (fid, flip, league) ou None.
    flip=True si l'API a le match dans l'ordre inverse (API domicile = ext)."""
    hid, _ = team_id(dom)
    if hid:
        r = _find_fx(hid, ext)
        if r:
            return r[0], (not r[2]), r[1]        # flip si dom n'est PAS à domicile côté API
    aid, _ = team_id(ext)
    if aid:
        r = _find_fx(aid, dom)                    # tid=ext ; r[2]=ext_à_domicile
        if r:
            return r[0], r[2], r[1]               # flip si ext est à domicile côté API
    return None


def fixture_odds(fid, flip):
    """Cotes "Match Winner" multi-books dévignées → proba 1·N·2 (côté grille)."""
    res = af(f"/odds?fixture={fid}")
    if not res:
        return None
    acc = {"1": 0.0, "N": 0.0, "2": 0.0}
    n = 0
    for bk in res[0].get("bookmakers", []):
        bet = next((b for b in bk.get("bets", []) if b.get("id") == 1
                    or b.get("name") == "Match Winner"), None)
        if not bet:
            continue
        px = {}
        for v in bet.get("values", []):
            px[str(v.get("value")).lower()] = float(v.get("odd"))
        home, draw, away = px.get("home"), px.get("draw"), px.get("away")
        if not (home and draw and away):
            continue
        p = devig(home, draw, away)
        for k in acc:
            acc[k] += p[k]
        n += 1
    if not n:
        return None
    p = {k: acc[k] / n for k in acc}
    if flip:
        p = {"1": p["2"], "N": p["N"], "2": p["1"]}
    return p, n


def fixture_prediction(fid, flip):
    """Prédiction maison API-Football (repli/cross-check) → proba 1·N·2."""
    res = af(f"/predictions?fixture={fid}")
    if not res:
        return None
    pc = (res[0].get("predictions") or {}).get("percent") or {}
    try:
        h = float(str(pc.get("home", "")).rstrip("%"))
        d = float(str(pc.get("draw", "")).rstrip("%"))
        a = float(str(pc.get("away", "")).rstrip("%"))
    except ValueError:
        return None
    s = h + d + a or 1
    p = {"1": h / s, "N": d / s, "2": a / s}
    if flip:
        p = {"1": p["2"], "N": p["N"], "2": p["1"]}
    return p


_ABS = None
def load_absences():
    """[(token_set, [absences]), ...] fusionnant absences-auto.json (presse, auto) et
    absences.json (manuel, PRIORITAIRE). Clés '_...' ignorées. Le moteur trouve donc
    les absents tout seul via la sonde ; s'il n'y a rien, aucune correction."""
    global _ABS
    if _ABS is not None:
        return _ABS
    merged = {}   # team -> list (chaque absent tagué _auto=True/False)
    for fname, auto in (("absences-auto.json", True), ("absences.json", False)):
        p = os.path.join(HERE, fname)                       # manuel écrase auto
        if not os.path.exists(p):
            continue
        try:
            d = json.load(open(p, encoding="utf-8"))
        except Exception:
            continue
        for team, lst in (d.get("equipes") or {}).items():
            if team.startswith("_") or not lst:
                continue
            merged[team] = [{**a, "_auto": auto} for a in lst]
    _ABS = [(set(norm(team)), team, lst) for team, lst in merged.items()]
    return _ABS


def nkey(name):
    return " ".join(norm(name))


def _surname(name):
    toks = [t for t in norm(name) if len(t) > 1]
    return toks[-1] if toks else nkey(name)


_NOTES = None
def load_notes():
    """Note par joueur = valeur marchande Transfermarkt. Renvoie (full, last, club) :
    {nom:val}, {nom_de_famille:val_max}, {nom:club} pour vérifier l'effectif."""
    global _NOTES
    if _NOTES is not None:
        return _NOTES
    full, last, club = {}, {}, {}
    try:
        txt = gzip.decompress(urllib.request.urlopen(
            urllib.request.Request(f"{R2}/players.csv.gz", headers={"User-Agent": TM_UA}),
            timeout=120).read()).decode("utf-8", "replace")
        for p in csv.DictReader(io.StringIO(txt)):
            try:
                v = int(p["market_value_in_eur"])
            except (ValueError, TypeError):
                continue
            nm = nkey(p.get("name", ""))
            if nm:
                if v >= full.get(nm, -1):        # garde le club du record de + forte valeur
                    club[nm] = p.get("current_club_name", "")
                full[nm] = max(full.get(nm, 0), v)
            sn = _surname(p.get("name", ""))
            if sn:
                last[sn] = max(last.get(sn, 0), v)
    except Exception as e:
        say(f"_⚠️ Notes joueurs indisponibles ({e}) — poids manuels uniquement._")
    _NOTES = (full, last, club)
    return _NOTES


def player_note(name):
    """Valeur marchande du joueur : match nom complet, sinon nom de famille (max)."""
    full, last, _ = load_notes()
    n = nkey(name)
    if n in full:
        return full[n]
    return last.get(_surname(name), 0)


def squad_ok(name, team):
    """Vrai si le joueur appartient au CLUB `team` (Transfermarkt) — garde-fou
    anti-bruit pour les absences auto. Faux si le club ne correspond pas ou si
    l'équipe n'est pas un club (sélection nationale : non vérifiable → manuel only)."""
    full, _, club = load_notes()
    cn = club.get(nkey(name))
    if not cn:
        return False
    ct, tt = set(norm(cn)), set(norm(team))
    shared = ct & tt
    return bool(shared) and max((len(t) for t in shared), default=0) >= 5


def entry_poids(a):
    """Poids d'un absent : soit fourni à la main, soit dérivé de la NOTE du joueur
    (valeur Transfermarkt / SCALE), plafonné. C'est la « note par joueur » qui
    fixe l'impact ; pour une sélection, ce sont les mieux notés qui pèsent."""
    if a.get("poids"):
        return float(a["poids"]), None
    v = player_note(a.get("joueur", ""))
    return (min(PCAP, v / SCALE), v) if v else (0.0, 0)


def team_impact(name):
    """Impact total (part de force perdue, plafonné) + absents annotés (poids/note)."""
    q = set(norm(name))
    if not q:
        return 0.0, []
    for toks, team, lst in load_absences():
        if not toks:
            continue
        shared = q & toks
        if shared and len(shared) / len(toks) >= 0.6:
            annotated, tot = [], 0.0
            for a in lst:
                # garde-fou : une absence AUTO n'est retenue que si le joueur est
                # bien dans l'effectif du club (sinon bruit presse / sélection).
                if a.get("_auto") and not squad_ok(a.get("joueur", ""), team):
                    annotated.append({**a, "_poids": 0.0, "_note": None, "_rejete": True})
                    continue
                w, note = entry_poids(a)
                tot += w
                annotated.append({**a, "_poids": w, "_note": note})
            return min(0.6, tot), annotated
    return 0.0, []


def ajust_actualite(dom, ext, p):
    """Corrige les probas marché avec les absents connus (absences.json), pondérés
    par leur poids. La force perdue par une équipe profite au nul ET à l'adversaire.
    Renvoie (probas_ajustées, info) — c'est l'edge : le marché n'a pas encore bougé."""
    ih, absh = team_impact(dom)
    ia, absa = team_impact(ext)
    if ih <= 0 and ia <= 0:
        return p, None
    rem_h, rem_a = p["1"] * ih, p["2"] * ia          # proba de victoire perdue
    r1 = p["1"] - rem_h + rem_a * 0.5                 # l'adversaire affaibli me profite (moitié)
    r2 = p["2"] - rem_a + rem_h * 0.5
    rN = p["N"] + (rem_h + rem_a) * 0.5              # l'autre moitié va au nul
    s = r1 + r2 + rN
    adj = {"1": r1 / s, "N": rN / s, "2": r2 / s}
    return adj, {"h": (ih, absh), "a": (ia, absa)}


def market_probs(dom, ext):
    """Proba 1·N·2 du marché pour dom–ext via API-Football : cotes multi-books,
    repli sur la prédiction maison. Renvoie (p, nbooks, source, league) ou None."""
    try:
        fx = resolve_fixture(dom, ext)
    except Exception as e:
        say(f"  _(résolution {dom}–{ext} : {e})_"); return None
    if not fx:
        return None
    fid, flip, league = fx
    try:
        o = fixture_odds(fid, flip)
        if o:
            p, nb = o
            return p, nb, f"cotes ({nb} books)", league
    except Exception:
        pass
    try:
        pr = fixture_prediction(fid, flip)
        if pr:
            return pr, 0, "prédiction API", league
    except Exception:
        pass
    return None


def main():
    say("# Moteur cotes → probas Loto Foot (marché vs foule)\n")
    grid = json.load(open(os.path.join(HERE, "grille.json"), encoding="utf-8"))
    say(f"Grille : **{grid.get('nom','?')}** · {len(grid['matchs'])} matchs · source **API-Football**\n")
    if not KEY:
        say("❌ APIFOOTBALL_KEY manquant — impossible d'interroger le marché.")
        return finish(grid, [])

    say("| # | Match | Marché 1·N·2 | Foule 1·N·2 | Prono marché | Foule | Books | Écart |")
    say("|---|---|---|---|---|---|---|---|")
    out, divergences, couverts, ajustes = [], [], 0, []
    for i, m in enumerate(grid["matchs"], 1):
        f = m["foule"]; ft = f["1"] + f["N"] + f["2"] or 1
        foule = {k: f[k] / ft for k in ("1", "N", "2")}
        cp = max(("1", "N", "2"), key=lambda k: foule[k])
        mk = market_probs(m["dom"], m["ext"])
        if not mk:
            say(f"| {i} | {m['dom']}–{m['ext']} | — | "
                f"{foule['1']*100:.0f}/{foule['N']*100:.0f}/{foule['2']*100:.0f} | "
                f"_non coté_ | {cp} | — | — |")
            out.append({"dom": m["dom"], "ext": m["ext"], "foule": f,
                        "p": foule, "source": "foule (non coté)"})
            continue
        raw_p, nbooks, msrc, _league = mk
        couverts += 1
        p, info = ajust_actualite(m["dom"], m["ext"], raw_p)
        mp = max(("1", "N", "2"), key=lambda k: p[k])
        flag = ""
        if mp != cp:
            flag = f"**{p[mp]-foule[mp]:+.0%}**"
            divergences.append((i, m, mp, cp, p, foule))
        note = " ✎" if info else ""
        if info:
            ajustes.append((i, m, info, raw_p, p))
        books = str(nbooks) if nbooks else "préd."
        say(f"| {i} | {m['dom']}–{m['ext']} | "
            f"{p['1']*100:.0f}/{p['N']*100:.0f}/{p['2']*100:.0f}{note} | "
            f"{foule['1']*100:.0f}/{foule['N']*100:.0f}/{foule['2']*100:.0f} | "
            f"**{mp}** | {cp} | {books} | {flag} |")
        out.append({"dom": m["dom"], "ext": m["ext"], "foule": f,
                    "p": p, "source": msrc + (" + absents" if info else "")})

    say(f"\n**Couverture marché : {couverts}/{len(grid['matchs'])} matchs cotés.**")
    say(f"_{len(ajustes)} match(s) corrigé(s) par les absents (✎)._\n" if ajustes
        else "_Aucun absent renseigné (absences.json) — probas = marché brut._\n")

    if ajustes:
        say("## 🩹 Ajustements absences (edge : le marché n'a pas encore bougé)")
        for i, m, info, praw, padj in ajustes:
            for side, key in (("h", "dom"), ("a", "ext")):
                imp, lst = info[side]
                if imp <= 0:
                    continue
                parts = []
                for a in lst:
                    if a.get("_rejete") or a.get("_poids", 0) <= 0:
                        continue   # bruit presse rejeté / joueur sans note : ignoré
                    tag = f"{a.get('joueur','?')} ({a.get('raison','')})".strip()
                    note = a.get("_note")
                    if note:
                        tag += f" · note {note/1e6:.0f} M€ → −{a.get('_poids',0)*100:.0f}%"
                    parts.append(tag)
                if parts:
                    say(f"- **{m[key]}** −{imp*100:.0f}% de force : " + " ; ".join(parts))
            say(f"  → marché {praw['1']*100:.0f}/{praw['N']*100:.0f}/{praw['2']*100:.0f} "
                f"⇒ ajusté **{padj['1']*100:.0f}/{padj['N']*100:.0f}/{padj['2']*100:.0f}** "
                f"(match {i})")
        say("")

    say("## 🎯 Divergences marché vs foule (value de pool)")
    if divergences:
        for i, m, mp, cp, p, foule in divergences:
            say(f"- **Match {i} · {m['dom']}–{m['ext']}** : le marché voit **{mp}** "
                f"({p[mp]*100:.0f}%) alors que la foule joue **{cp}** ({foule[cp]*100:.0f}%). "
                f"→ la foule sur/sous-estime, value si le marché a raison.")
    else:
        say("_Aucune divergence de pronostic sur les matchs cotés._")

    say("\n---\n_Cotes API-Football (dévignées, moyenne multi-books) = signal primaire ; "
        "repli sur la prédiction maison. Couche absences (compo J-40min + presse/manuel, "
        "pondérée par la note) appliquée AVANT que le marché ne bouge._")
    return finish(grid, out)


def finish(grid, out):
    if out:
        json.dump({"nom": grid.get("nom"), "matchs": out},
                  open(os.path.join(HERE, "probas.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
    open(os.path.join(HERE, "MOTEUR-COTES.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
