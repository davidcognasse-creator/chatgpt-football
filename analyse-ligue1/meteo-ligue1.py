#!/usr/bin/env python3
"""
Impact de la météo sur les résultats de Ligue 1 (5 dernières saisons).

Sources GRATUITES, sans clé :
  - Résultats : openfootball/football.json (GitHub raw)
  - Météo     : Open-Meteo Archive API (météo historique par lat/lon + date)

Conçu pour tourner sur GitHub Actions (réseau ouvert). En local derrière un
proxy restrictif, Open-Meteo peut être bloqué.

Usage : python3 meteo-ligue1.py
Produit : RESULTATS-METEO.md + meteo-ligue1.json
"""
import json
import time
import urllib.request
import urllib.parse
from collections import defaultdict

OF_BASE = "https://raw.githubusercontent.com/openfootball/football.json/master"
SEASONS = ["2020-21", "2021-22", "2022-23", "2023-24", "2024-25"]
ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"

# Ville du stade (lat, lon) repérée par MOT-CLÉ dans le nom du club domicile.
# Robuste aux variantes de nom (openfootball : « Paris Saint-Germain », etc.).
CITY = [
    ("paris", 48.841, 2.253), ("marseille", 43.270, 5.396), ("lyon", 45.765, 4.982),
    ("monaco", 43.727, 7.415), ("lille", 50.612, 3.130), ("nice", 43.705, 7.193),
    ("rennes", 48.107, -1.713), ("lens", 50.432, 2.814), ("reims", 49.246, 4.025),
    ("nantes", 47.256, -1.525), ("montpellier", 43.622, 3.812), ("strasbourg", 48.560, 7.755),
    ("brest", 48.402, -4.462), ("lorient", 47.749, -3.371), ("angers", 47.461, -0.531),
    ("metz", 49.110, 6.159), ("troyes", 48.298, 4.099), ("clermont", 45.784, 3.130),
    ("auxerre", 47.786, 3.589), ("toulouse", 43.583, 1.434), ("ajaccio", 41.938, 8.774),
    ("havre", 49.499, 0.169), ("etienne", 45.461, 4.390), ("saint-étienne", 45.461, 4.390),
    ("dijon", 47.324, 5.068), ("guingamp", 48.557, -3.161), ("nîmes", 43.834, 4.360),
    ("nimes", 43.834, 4.360), ("amiens", 49.894, 2.296), ("bordeaux", 44.831, -0.550),
    ("caen", 49.179, -0.342),
]


def geturl(url):
    with urllib.request.urlopen(url, timeout=45) as r:
        return json.load(r)


def coords(team):
    t = team.lower()
    for kw, la, lo in CITY:
        if kw in t:
            return (la, lo)
    return None


def load_matches():
    out = []
    for s in SEASONS:
        try:
            d = geturl(f"{OF_BASE}/{s}/fr.1.json")
        except Exception as e:
            print(f"  (saison {s} indispo : {e})")
            continue
        for m in d.get("matches", []):
            ft = (m.get("score") or {}).get("ft")
            if not ft or ft[0] is None or not m.get("date"):
                continue
            out.append({"date": m["date"], "home": m["team1"], "away": m["team2"],
                        "h": ft[0], "a": ft[1]})
    return out


def weather_index(matches):
    """Une requête Open-Meteo par club (plage complète) → {club: {date: (t,p,w)}}."""
    by_club = defaultdict(list)
    for m in matches:
        by_club[m["home"]].append(m["date"])
    idx = {}
    unknown = set()
    for club, dates in by_club.items():
        c = coords(club)
        if not c:
            unknown.add(club)
            continue
        qs = urllib.parse.urlencode({
            "latitude": c[0], "longitude": c[1],
            "start_date": min(dates), "end_date": max(dates),
            "daily": "temperature_2m_max,precipitation_sum,wind_speed_10m_max",
            "timezone": "Europe/Paris",
        })
        try:
            d = geturl(f"{ARCHIVE}?{qs}")
            dd = d["daily"]
            idx[club] = {dt: (dd["temperature_2m_max"][i], dd["precipitation_sum"][i],
                              dd["wind_speed_10m_max"][i]) for i, dt in enumerate(dd["time"])}
        except Exception as e:
            print(f"  (météo {club} indispo : {e})")
        time.sleep(1.2)  # courtoisie envers l'API
    if unknown:
        print(f"  Clubs sans coordonnées (ignorés) : {', '.join(sorted(unknown))}")
    return idx


def bucket_stats(rows):
    n = len(rows)
    if not n:
        return "—"
    hw = sum(1 for r in rows if r["h"] > r["a"]) / n * 100
    dr = sum(1 for r in rows if r["h"] == r["a"]) / n * 100
    aw = sum(1 for r in rows if r["h"] < r["a"]) / n * 100
    g = sum(r["h"] + r["a"] for r in rows) / n
    return f"{n:4d} matchs · dom {hw:4.1f}% · nul {dr:4.1f}% · ext {aw:4.1f}% · {g:.2f} buts"


def main():
    matches = load_matches()
    print(f"{len(matches)} matchs chargés.")
    idx = weather_index(matches)

    rows = []
    for m in matches:
        w = idx.get(m["home"], {}).get(m["date"])
        if not w:
            continue
        t, p, wind = w
        m2 = dict(m, t=t, p=p, wind=wind)
        rows.append(m2)
    print(f"{len(rows)} matchs avec météo.")

    def sub(f):
        return [r for r in rows if f(r)]

    lines = []
    lines.append(f"# Ligue 1 — impact de la météo (5 saisons, {len(rows)} matchs)\n")
    lines.append("Météo du stade le jour du match (Open-Meteo). Descriptif, pas un conseil de pari.\n")

    lines.append("## Pluie (précipitations du jour)")
    lines.append("| Condition | Bilan |")
    lines.append("|---|---|")
    lines.append(f"| Sec (< 1 mm) | {bucket_stats(sub(lambda r: r['p'] < 1))} |")
    lines.append(f"| Pluie légère (1–5 mm) | {bucket_stats(sub(lambda r: 1 <= r['p'] < 5))} |")
    lines.append(f"| Pluie forte (≥ 5 mm) | {bucket_stats(sub(lambda r: r['p'] >= 5))} |\n")

    lines.append("## Température (max du jour)")
    lines.append("| Condition | Bilan |")
    lines.append("|---|---|")
    lines.append(f"| Froid (< 8 °C) | {bucket_stats(sub(lambda r: r['t'] < 8))} |")
    lines.append(f"| Doux (8–18 °C) | {bucket_stats(sub(lambda r: 8 <= r['t'] < 18))} |")
    lines.append(f"| Chaud (≥ 18 °C) | {bucket_stats(sub(lambda r: r['t'] >= 18))} |\n")

    lines.append("## Vent (rafales max)")
    lines.append("| Condition | Bilan |")
    lines.append("|---|---|")
    lines.append(f"| Calme (< 20 km/h) | {bucket_stats(sub(lambda r: r['wind'] < 20))} |")
    lines.append(f"| Venteux (≥ 30 km/h) | {bucket_stats(sub(lambda r: r['wind'] >= 30))} |\n")

    # Clubs les plus « sensibles à la pluie » à domicile (≥ 8 matchs pluvieux)
    per = defaultdict(lambda: {"dry": [], "wet": []})
    for r in rows:
        (per[r["home"]]["wet" if r["p"] >= 3 else "dry"]).append(1 if r["h"] > r["a"] else 0)
    sens = []
    for club, d in per.items():
        if len(d["wet"]) >= 8 and len(d["dry"]) >= 8:
            wet = sum(d["wet"]) / len(d["wet"]) * 100
            dry = sum(d["dry"]) / len(d["dry"]) * 100
            sens.append((club, dry, wet, wet - dry))
    lines.append("## Clubs les plus affectés par la pluie à domicile (≥ 8 matchs pluvieux)")
    lines.append("| Club | % vict. sec | % vict. pluie | Écart |")
    lines.append("|---|---|---|---|")
    for club, dry, wet, delta in sorted(sens, key=lambda x: x[3])[:6]:
        lines.append(f"| {club} | {dry:.0f}% | {wet:.0f}% | {delta:+.0f} pts |")

    report = "\n".join(lines) + "\n"
    with open("RESULTATS-METEO.md", "w", encoding="utf-8") as f:
        f.write(report)
    with open("meteo-ligue1.json", "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False)
    print("\n" + report)
    print("→ RESULTATS-METEO.md écrit")


if __name__ == "__main__":
    main()
