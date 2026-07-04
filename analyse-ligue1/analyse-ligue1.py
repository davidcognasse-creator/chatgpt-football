#!/usr/bin/env python3
"""
Analyse des patterns domicile / extérieur en Ligue 1 sur ~10 ans.

Source : openfootball/football.json (données ouvertes, gratuites) via GitHub raw.
Aucune clé API nécessaire.

Usage :
    python3 analyse-ligue1.py

Produit : un résumé console + un fichier l1_analysis.json (agrégats par club).
"""
import json
import urllib.request
from collections import defaultdict

BASE = "https://raw.githubusercontent.com/openfootball/football.json/master"
SEASONS = [
    "2014-15", "2015-16", "2016-17", "2017-18", "2018-19", "2019-20",
    "2020-21", "2021-22", "2022-23", "2023-24", "2024-25",
]


def fetch_season(season):
    url = f"{BASE}/{season}/fr.1.json"
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def main():
    clubs = defaultdict(lambda: dict(hp=0, hw=0, hd=0, hl=0, hgf=0, hga=0,
                                     ap=0, aw=0, ad=0, al=0, agf=0, aga=0))
    season_home = {}
    tot = [0, 0, 0]  # dom / nul / ext
    ghome = gaway = nmatch = 0

    for s in SEASONS:
        try:
            d = fetch_season(s)
        except Exception as e:
            print(f"  (saison {s} indisponible : {e})")
            continue
        sh = [0, 0, 0]
        for m in d.get("matches", []):
            ft = (m.get("score") or {}).get("ft")
            if not ft or ft[0] is None:
                continue
            h, a = ft
            nmatch += 1
            ghome += h
            gaway += a
            H, A = clubs[m["team1"]], clubs[m["team2"]]
            H["hp"] += 1; H["hgf"] += h; H["hga"] += a
            A["ap"] += 1; A["agf"] += a; A["aga"] += h
            if h > a:
                H["hw"] += 1; A["al"] += 1; tot[0] += 1; sh[0] += 1
            elif h < a:
                H["hl"] += 1; A["aw"] += 1; tot[2] += 1; sh[2] += 1
            else:
                H["hd"] += 1; A["ad"] += 1; tot[1] += 1; sh[1] += 1
        season_home[s] = sh

    N = sum(tot) or 1
    hw = lambda v: v["hw"] / v["hp"] * 100 if v["hp"] else 0
    aw = lambda v: v["aw"] / v["ap"] * 100 if v["ap"] else 0

    print(f"\n=== LIGUE 1 · {nmatch} matchs ===")
    print(f"Domicile {tot[0]/N*100:.1f}% · Nul {tot[1]/N*100:.1f}% · Extérieur {tot[2]/N*100:.1f}%")
    print(f"Buts/match : {ghome/nmatch:.2f} (dom) vs {gaway/nmatch:.2f} (ext)")
    print(f"Avantage du terrain : +{(tot[0]-tot[2])/N*100:.1f} pts de victoires\n")

    print("% victoires à domicile par saison :")
    for s in SEASONS:
        if s not in season_home:
            continue
        w, dd, l = season_home[s]
        n = w + dd + l or 1
        print(f"  {s}: {w/n*100:4.1f}%")

    big = {k: v for k, v in clubs.items() if v["hp"] >= 75}
    print("\nForteresses (meilleur % dom) :")
    for k, v in sorted(big.items(), key=lambda x: -hw(x[1]))[:8]:
        print(f"  {k:24} {hw(v):4.1f}%")
    print("\nMeilleurs à l'extérieur :")
    for k, v in sorted(big.items(), key=lambda x: -aw(x[1]))[:8]:
        print(f"  {k:24} {aw(v):4.1f}%")
    print("\nPlus dépendants du stade (écart dom-ext) :")
    for k, v in sorted(big.items(), key=lambda x: -(hw(x[1]) - aw(x[1])))[:8]:
        print(f"  {k:24} +{hw(v)-aw(v):.1f} pts")

    out = {k: {**v, "home_win_pct": round(hw(v), 1), "away_win_pct": round(aw(v), 1)}
           for k, v in clubs.items()}
    with open("l1_analysis.json", "w", encoding="utf-8") as f:
        json.dump({"matches": nmatch,
                   "league": {"home": tot[0], "draw": tot[1], "away": tot[2]},
                   "clubs": out}, f, ensure_ascii=False, indent=1)
    print("\n→ l1_analysis.json écrit")


if __name__ == "__main__":
    main()
