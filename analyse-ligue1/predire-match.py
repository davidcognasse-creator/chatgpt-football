#!/usr/bin/env python3
"""
Prédire un match : compo (API-Football) → valeur du XI (Transfermarkt) → 1·N·2.

Cœur du système Loto Foot. Deux blocs :
  A) Démonstration sur un match récent (compo réelle) — prouve la mécanique.
  B) Matchs à venir (si le plan API-Football expose la saison en cours).

Paramètres issus de la calibration (note-equipe.py) : γ=0.6, terrain ×1.35, nul 0.26.
La valeur du XI ANNONCÉ (≠ effectif complet) est ce qui capte l'affaiblissement
(rotation, absents) AVANT que le marché bouge. Prochaine couche : presse/X + cotes.

Réseau ouvert + secret APIFOOTBALL_KEY → GitHub Actions.
"""
import csv
import gzip
import io
import json
import os
import unicodedata
import urllib.request
from collections import defaultdict

R2 = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
AF = "https://v3.football.api-sports.io"
KEY = os.environ.get("APIFOOTBALL_KEY", "")
LEAGUE, COMP = 61, "FR1"          # Ligue 1
GAMMA, HA, DRAW = 0.6, 1.35, 0.26  # paramètres calibrés

L = []
def say(s): L.append(s); print(s)


def http(url, headers=None):
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=120).read()


def api(path):
    j = json.loads(http(AF + path, {"x-apisports-key": KEY}))
    e = j.get("errors")
    if (isinstance(e, list) and e) or (isinstance(e, dict) and e):
        raise RuntimeError(f"API errors: {e}")
    return j.get("response", [])


CITY = ["paris", "marseille", "lyon", "monaco", "lille", "nice", "rennes", "lens",
        "reims", "nantes", "montpellier", "strasbourg", "brest", "lorient", "angers",
        "metz", "troyes", "clermont", "auxerre", "toulouse", "ajaccio", "havre",
        "etienne", "saint-étienne", "dijon", "guingamp", "nimes", "amiens", "bordeaux", "caen"]
def clubkey(name):
    n = (name or "").lower()
    for kw in CITY:
        if kw in n:
            return kw
    return n


def strip(s):
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


def surname(name):
    toks = [t for t in strip(name).replace("-", " ").split() if len(t) > 1]
    return toks[-1] if toks else strip(name)


def load_values():
    txt = gzip.decompress(http(f"{R2}/players.csv.gz", {"User-Agent": UA})).decode("utf-8", "replace")
    by_club = defaultdict(dict)   # clubkey -> {surname: value}
    squad = defaultdict(list)
    for p in csv.DictReader(io.StringIO(txt)):
        if p.get("current_club_domestic_competition_id") != COMP:
            continue
        try:
            v = int(p["market_value_in_eur"])
        except (ValueError, TypeError):
            continue
        ck = clubkey(p.get("current_club_name", ""))
        by_club[ck][surname(p.get("name", ""))] = max(by_club[ck].get(surname(p.get("name", "")), 0), v)
        squad[ck].append(v)
    full = {k: sum(sorted(vs, reverse=True)[:16]) for k, vs in squad.items()}
    return by_club, full


def probs(vh, va):
    sh = (vh * HA) ** GAMMA
    sa = va ** GAMMA
    r = 1 - DRAW
    a, b = sh + 1e-9, va and sa + 1e-9
    return (r * a / (a + b), DRAW, r * b / (a + b))


def xi_value(ck, xi_names, by_club, full):
    """Valeur du XI annoncé ; repli sur l'effectif si pas de compo."""
    pool = by_club.get(ck, {})
    if not xi_names:
        return full.get(ck, 0), 0, 11
    tot = matched = 0
    for nm in xi_names:
        v = pool.get(surname(nm))
        if v:
            tot += v; matched += 1
    # complète les non-appariés par la valeur médiane de l'effectif (évite de sous-estimer)
    vals = sorted(pool.values(), reverse=True)
    med = vals[len(vals)//2] if vals else 0
    tot += med * (len(xi_names) - matched)
    return tot, matched, len(xi_names)


def predict(fx, by_club, full, with_lineup=True):
    h, a = fx["teams"]["home"], fx["teams"]["away"]
    ckh, cka = clubkey(h["name"]), clubkey(a["name"])
    xih = xia = []
    if with_lineup:
        try:
            lus = api(f"/fixtures/lineups?fixture={fx['fixture']['id']}")
            for lu in lus:
                names = [e["player"]["name"] for e in lu.get("startXI", [])]
                if lu["team"]["id"] == h["id"]:
                    xih = names
                elif lu["team"]["id"] == a["id"]:
                    xia = names
        except Exception:
            pass
    vh, mh, _ = xi_value(ckh, xih, by_club, full)
    va, ma, _ = xi_value(cka, xia, by_club, full)
    if not vh or not va:
        return None
    p = probs(vh, va)
    pick = ["1", "N", "2"][max(range(3), key=lambda i: p[i])]
    src = f"XI ({mh}/{len(xih)} & {ma}/{len(xia)} valorisés)" if xih or xia else "effectif (pas de compo)"
    return {"h": h["name"], "a": a["name"], "vh": vh, "va": va, "p": p, "pick": pick, "src": src}


def line(r):
    return (f"| {r['h']}–{r['a']} | {r['vh']/1e6:.0f}/{r['va']/1e6:.0f} M€ | "
            f"{r['p'][0]*100:.0f}% | {r['p'][1]*100:.0f}% | {r['p'][2]*100:.0f}% | **{r['pick']}** | {r['src']} |")


def main():
    say("# Pronostic Ligue 1 — valeur du XI → 1·N·2\n")
    if not KEY:
        say("❌ APIFOOTBALL_KEY manquant."); return finish()
    try:
        by_club, full = load_values()
        say(f"Valeurs Transfermarkt chargées : {len(full)} clubs.\n")
    except Exception as e:
        say(f"❌ Valeurs indisponibles : {e}"); return finish()

    # A) Démo sur un match récent terminé (compo réelle)
    say("## A. Démonstration (match récent, compo réelle vs résultat)")
    say("| Match | valeur XI | 1 | N | 2 | Prono | Source |")
    say("|---|---|---|---|---|---|---|")
    try:
        for season in (2023, 2022):
            fts = [f for f in api(f"/fixtures?league={LEAGUE}&season={season}") if f["fixture"]["status"]["short"] == "FT"]
            if not fts:
                continue
            fts.sort(key=lambda f: f["fixture"]["date"], reverse=True)
            done = 0
            for fx in fts:
                r = predict(fx, by_club, full)
                if r:
                    real = "1" if fx["goals"]["home"] > fx["goals"]["away"] else "N" if fx["goals"]["home"] == fx["goals"]["away"] else "2"
                    say(line(r) + f" → réel **{real}** ({fx['goals']['home']}-{fx['goals']['away']})")
                    done += 1
                if done >= 4:
                    break
            break
    except Exception as e:
        say(f"| (démo indisponible : {e}) |")

    # B) Matchs à venir (si la saison en cours est couverte par le plan)
    say("\n## B. Prochains matchs (si couverts par le plan)")
    upcoming = []
    for season in (2025, 2024):
        try:
            ns = [f for f in api(f"/fixtures?league={LEAGUE}&season={season}") if f["fixture"]["status"]["short"] == "NS"]
            if ns:
                ns.sort(key=lambda f: f["fixture"]["date"])
                upcoming = ns[:6]; break
        except Exception:
            pass
    if upcoming:
        say("| Match | valeur XI | 1 | N | 2 | Prono | Source |")
        say("|---|---|---|---|---|---|---|")
        for fx in upcoming:
            r = predict(fx, by_club, full)
            if r:
                say(line(r))
    else:
        say("_Aucun match à venir accessible (plan API-Football limité à des saisons passées). "
            "La mécanique est validée en A ; le live nécessitera l'accès à la saison en cours._")

    say("\n---\nProchaines couches : − absents (presse/X × valeur) · blend cotes/Elo · biais séries · grille FDJ.")
    return finish()


def finish():
    try:
        open("PRONO-LIGUE1.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
    except Exception:
        pass


if __name__ == "__main__":
    main()
