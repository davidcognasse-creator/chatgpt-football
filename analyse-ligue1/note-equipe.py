#!/usr/bin/env python3
"""
Socle du pronostic : VALEUR D'ÉQUIPE (Transfermarkt) → probas 1·N·2.

Étape 2 du système Loto Foot. Ici on calibre le lien « rapport de valeurs
marchandes → issue » sur l'historique récent. Ensuite (étapes suivantes) :
la valeur sera calculée sur le XI annoncé (API-Football) et ajustée par les
absents (presse/X).

Données : valeurs Transfermarkt (dataset public R2) + résultats (openfootball).
Réseau ouvert requis → GitHub Actions.
"""
import csv
import gzip
import io
import json
import math
import urllib.request
from collections import defaultdict

R2 = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
OF = "https://raw.githubusercontent.com/openfootball/football.json/master"
SEASONS = ["2022-23", "2023-24", "2024-25"]  # récentes : valeurs actuelles ~ valides
LEAGUE_FILE = "fr.1.json"
COMP = "FR1"

L = []
def say(s): L.append(s); print(s)


def fetch(url, ua=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA} if ua else {})
    return urllib.request.urlopen(req, timeout=120).read()


CITY = ["paris", "marseille", "lyon", "monaco", "lille", "nice", "rennes", "lens",
        "reims", "nantes", "montpellier", "strasbourg", "brest", "lorient", "angers",
        "metz", "troyes", "clermont", "auxerre", "toulouse", "ajaccio", "havre",
        "etienne", "saint-étienne", "dijon", "guingamp", "nimes", "amiens", "bordeaux", "caen"]
def key(name):
    n = (name or "").lower()
    for kw in CITY:
        if kw in n:
            return kw
    return n


def club_values():
    txt = gzip.decompress(fetch(f"{R2}/players.csv.gz", ua=True)).decode("utf-8", "replace")
    vals = defaultdict(list)
    for p in csv.DictReader(io.StringIO(txt)):
        if p.get("current_club_domestic_competition_id") != COMP:
            continue
        try:
            v = int(p["market_value_in_eur"])
        except (ValueError, TypeError):
            continue
        vals[key(p.get("current_club_name", ""))].append(v)
    # force d'un club = somme des 16 valeurs les plus hautes (approx. de l'effectif utile)
    return {k: sum(sorted(vs, reverse=True)[:16]) for k, vs in vals.items() if vs}


def load_results():
    ms = []
    for s in SEASONS:
        try:
            d = json.loads(fetch(f"{OF}/{s}/{LEAGUE_FILE}"))
        except Exception:
            continue
        for m in d.get("matches", []):
            ft = (m.get("score") or {}).get("ft")
            if not ft or ft[0] is None:
                continue
            ms.append((m["date"], key(m["team1"]), key(m["team2"]),
                       m["team1"], m["team2"], ft[0], ft[1]))
    return ms


def probs(vh, va, gamma, ha, draw):
    sh = (vh * ha) ** gamma
    sa = va ** gamma
    r = 1 - draw
    a, b = sh + 1e-9, sa + 1e-9
    return (r * a / (a + b), draw, r * b / (a + b))


def evaluate(ms, vals, gamma, ha, draw):
    s = n = ok = 0
    for _, h, a, _, _, fh, fa in ms:
        if h not in vals or a not in vals:
            continue
        p = probs(vals[h], vals[a], gamma, ha, draw)
        y = 0 if fh > fa else 1 if fh == fa else 2
        s += -math.log(max(1e-9, p[y]))
        ok += (max(range(3), key=lambda i: p[i]) == y)
        n += 1
    return (s / n if n else 9.0, ok / n if n else 0.0, n)


def main():
    say("# Note d'équipe (valeur Transfermarkt) → probas 1·N·2\n")
    try:
        vals = club_values()
        ms = load_results()
    except Exception as e:
        say(f"❌ Données indisponibles : {e}")
        return finish()
    say(f"Clubs valorisés : {len(vals)} · matchs d'historique : {len(ms)}\n")

    # Calibration : grid search (élasticité valeur, avantage terrain, prior nul)
    best = None
    for gamma in [0.3, 0.4, 0.5, 0.6, 0.7, 0.9]:
        for ha in [1.2, 1.35, 1.5, 1.7]:
            for draw in [0.22, 0.26, 0.30]:
                ll, acc, n = evaluate(ms, vals, gamma, ha, draw)
                if best is None or ll < best[0]:
                    best = (ll, acc, n, gamma, ha, draw)
    ll, acc, n, gamma, ha, draw = best
    say("## Paramètres calibrés")
    say(f"- élasticité valeur γ = **{gamma}** · avantage terrain × **{ha}** · prior nul = **{draw}**")
    say(f"- Performance : log-loss **{ll:.4f}** · exactitude **{acc*100:.1f}%** · sur {n} matchs")
    say(f"- Repère : hasard = 1.0986. (L'algo Ligue 1 « cotes » faisait ~0.95.)\n")

    # Exemple : derniers matchs prédits vs réel
    ms_sorted = sorted([m for m in ms if m[1] in vals and m[2] in vals], key=lambda x: x[0])
    say("## Exemple — 8 derniers matchs (proba modèle vs réel)")
    say("| Match | 1 | N | 2 | Réel |")
    say("|---|---|---|---|---|")
    for _, h, a, hn, an, fh, fa in ms_sorted[-8:]:
        p = probs(vals[h], vals[a], gamma, ha, draw)
        real = "1" if fh > fa else "N" if fh == fa else "2"
        say(f"| {hn}–{an} | {p[0]*100:.0f}% | {p[1]*100:.0f}% | {p[2]*100:.0f}% | {fh}-{fa} ({real}) |")

    say("\n---\nProchaines étapes : valeur sur le XI annoncé (API-Football) − absents (presse/X), "
        "puis blend cotes/Elo + biais séries.")
    return finish()


def finish():
    try:
        open("NOTE-EQUIPE.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
    except Exception:
        pass


if __name__ == "__main__":
    main()
