#!/usr/bin/env python3
"""
Moteur COTES → probas.json : le signal PRIMAIRE du système Loto Foot.

Les cotes des bookmakers sont l'entrée la plus forte (comme pour la CDM).
Pour chaque match de grille.json, on récupère les cotes h2h (The Odds API),
on retire la marge (« de-vig »), on moyenne les books → proba 1·N·2 du MARCHÉ.
On COMPARE à la foule (répartition des mises FDJ) → l'edge d'un jeu de pool =
là où la foule s'écarte du marché sharp.

Sortie :
  - probas.json   → consommé par grille-optim.py (grille sous budget 50 €)
  - MOTEUR-COTES.md → rapport marché vs foule + divergences

Couche suivante (hook `ajust_actualite`) : corriger la proba avec les absents
détectés presse/X (star out, turnover) AVANT que le marché bouge — c'est là
qu'est le vrai edge, mais seulement quand le marché n'a pas encore intégré l'info.

Secret ODDS_API_KEY requis → GitHub Actions.
"""
import json
import os
import re
import unicodedata
import urllib.request
import urllib.parse

KEY = os.environ.get("ODDS_API_KEY", "")
BASE = "https://api.the-odds-api.com/v4"
REGIONS = "eu,uk"
HERE = os.path.dirname(__file__)
MAX_LEAGUES = 60  # garde-fou quota

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


def http(url):
    req = urllib.request.Request(url, headers={"User-Agent": "lotofoot-cotes/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8", "replace")), dict(r.headers)


def active_soccer_keys():
    sports, _ = http(f"{BASE}/sports/?apiKey={urllib.parse.quote(KEY)}")
    keys = [s["key"] for s in sports
            if s.get("group") == "Soccer" and s.get("active") and not s.get("has_outrights")]
    return keys


def devig(home, draw, away):
    ih, idr, ia = 1 / home, 1 / draw, 1 / away
    s = ih + idr + ia
    return {"1": ih / s, "N": idr / s, "2": ia / s}


def event_probs(ev):
    """Moyenne dévignée des books d'un event The Odds API."""
    acc = {"1": 0.0, "N": 0.0, "2": 0.0}
    n = 0
    for b in ev.get("bookmakers", []):
        h2h = next((m for m in b.get("markets", []) if m["key"] == "h2h"), None)
        if not h2h:
            continue
        px = {o["name"]: o["price"] for o in h2h.get("outcomes", [])}
        home = px.get(ev["home_team"]); away = px.get(ev["away_team"]); draw = px.get("Draw")
        if not (home and draw and away):
            continue
        p = devig(home, draw, away)
        for k in acc:
            acc[k] += p[k]
        n += 1
    if not n:
        return None
    return {k: acc[k] / n for k in acc}, n


def build_pool(keys):
    """Récupère les events + cotes de chaque ligue active ; renvoie une liste
    d'events enrichis (home/away normalisés + proba dévignée)."""
    pool = []
    used = 0
    for k in keys[:MAX_LEAGUES]:
        try:
            evs, hdr = http(f"{BASE}/sports/{k}/odds/?regions={REGIONS}"
                            f"&markets=h2h&oddsFormat=decimal&apiKey={urllib.parse.quote(KEY)}")
        except Exception as e:
            say(f"- ⚠️ {k} : {e}")
            continue
        used += 1
        for ev in evs:
            r = event_probs(ev)
            if not r:
                continue
            p, nbooks = r
            pool.append({
                "home": ev["home_team"], "away": ev["away_team"],
                "hn": set(norm(ev["home_team"])), "an": set(norm(ev["away_team"])),
                "p": p, "nbooks": nbooks, "league": k,
            })
    say(f"\n_{used} ligues interrogées · {len(pool)} matchs cotés récupérés._\n")
    return pool


def side_match(query_tokens, ev_tokens):
    """Score d'appariement d'un côté (dom ou ext) : tokens significatifs partagés."""
    q = set(t for t in query_tokens if len(t) >= 4)
    if not q:                       # nom court (AIK, PSG…) : garde tous les tokens
        q = set(query_tokens)
    if not q:
        return 0.0
    shared = q & ev_tokens
    # exige un token distinctif partagé : ≥4 lettres, OU ≥3 si c'est TOUT le nom
    minlen = 3 if all(len(t) <= 3 for t in q) else 4
    if not shared or max((len(t) for t in shared), default=0) < minlen:
        return 0.0
    return len(shared) / len(q)


def find_event(dom, ext, pool):
    """Meilleur event du pool pour (dom, ext), en respectant l'ordre domicile."""
    dt, et = norm(dom), norm(ext)
    best = None
    for ev in pool:
        sh = side_match(dt, ev["hn"]) * side_match(et, ev["an"])
        sr = side_match(dt, ev["an"]) * side_match(et, ev["hn"])  # inversé
        if sh >= sr:
            score, flip = sh, False
        else:
            score, flip = sr, True
        if score <= 0:
            continue
        if not best or score > best[0]:
            best = (score, ev, flip)
    if not best or best[0] < 0.5:
        return None
    _, ev, flip = best
    p = ev["p"]
    if flip:  # l'event a dom/ext inversés par rapport à la grille
        p = {"1": p["2"], "N": p["N"], "2": p["1"]}
    return {"p": p, "nbooks": ev["nbooks"], "league": ev["league"],
            "ev": f"{ev['home']}–{ev['away']}", "flip": flip}


def ajust_actualite(dom, ext, p):
    """Hook absences presse/X. Neutre pour l'instant (le moteur Node press/social
    alimentera un absences.json ; on l'appliquera ici, pondéré par valeur joueur)."""
    return p


def main():
    say("# Moteur cotes → probas Loto Foot (marché vs foule)\n")
    grid = json.load(open(os.path.join(HERE, "grille.json"), encoding="utf-8"))
    say(f"Grille : **{grid.get('nom','?')}** · {len(grid['matchs'])} matchs\n")
    if not KEY:
        say("❌ ODDS_API_KEY manquant — impossible d'interroger le marché.")
        return finish(grid, [])

    try:
        keys = active_soccer_keys()
        say(f"Ligues foot actives sur le marché : {len(keys)}.")
    except Exception as e:
        say(f"❌ Liste des sports indisponible : {e}")
        return finish(grid, [])
    pool = build_pool(keys)

    say("| # | Match | Marché 1·N·2 | Foule 1·N·2 | Prono marché | Foule | Books | Écart |")
    say("|---|---|---|---|---|---|---|---|")
    out, divergences, couverts = [], [], 0
    for i, m in enumerate(grid["matchs"], 1):
        f = m["foule"]; ft = f["1"] + f["N"] + f["2"] or 1
        foule = {k: f[k] / ft for k in ("1", "N", "2")}
        cp = max(("1", "N", "2"), key=lambda k: foule[k])
        e = find_event(m["dom"], m["ext"], pool)
        if not e:
            say(f"| {i} | {m['dom']}–{m['ext']} | — | "
                f"{foule['1']*100:.0f}/{foule['N']*100:.0f}/{foule['2']*100:.0f} | "
                f"_non coté_ | {cp} | — | — |")
            out.append({"dom": m["dom"], "ext": m["ext"], "foule": f,
                        "p": foule, "source": "foule (non coté)"})
            continue
        couverts += 1
        p = ajust_actualite(m["dom"], m["ext"], e["p"])
        mp = max(("1", "N", "2"), key=lambda k: p[k])
        flag = ""
        if mp != cp:
            flag = f"**{p[mp]-foule[mp]:+.0%}**"
            divergences.append((i, m, mp, cp, p, foule))
        say(f"| {i} | {m['dom']}–{m['ext']} | "
            f"{p['1']*100:.0f}/{p['N']*100:.0f}/{p['2']*100:.0f} | "
            f"{foule['1']*100:.0f}/{foule['N']*100:.0f}/{foule['2']*100:.0f} | "
            f"**{mp}** | {cp} | {e['nbooks']} | {flag} |")
        out.append({"dom": m["dom"], "ext": m["ext"], "foule": f,
                    "p": p, "source": f"cotes ({e['nbooks']} books)"})

    say(f"\n**Couverture marché : {couverts}/{len(grid['matchs'])} matchs cotés.**\n")

    say("## 🎯 Divergences marché vs foule (value de pool)")
    if divergences:
        for i, m, mp, cp, p, foule in divergences:
            say(f"- **Match {i} · {m['dom']}–{m['ext']}** : le marché voit **{mp}** "
                f"({p[mp]*100:.0f}%) alors que la foule joue **{cp}** ({foule[cp]*100:.0f}%). "
                f"→ la foule sur/sous-estime, value si le marché a raison.")
    else:
        say("_Aucune divergence de pronostic sur les matchs cotés._")

    say("\n---\n_Le marché (cotes dévignées, moyenne multi-books) est le signal primaire. "
        "Prochaine couche : corriger avec les absents détectés presse/X, pondérés par "
        "la valeur du joueur, AVANT que le marché ne bouge._")
    return finish(grid, out)


def finish(grid, out):
    if out:
        json.dump({"nom": grid.get("nom"), "matchs": out},
                  open(os.path.join(HERE, "probas.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
    open(os.path.join(HERE, "MOTEUR-COTES.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
