#!/usr/bin/env python3
"""
Chasseur de biais du marché — Ligue 1, 10+ saisons AVEC cotes.

Objectif : trouver un motif où les cotes des bookmakers se trompent de façon
systématique, exploitable via la forme / les séries de victoires — c.-à-d. un
moyen de faire MIEUX qu'eux en probabilité.

Méthode honnête : tout est mesuré vs la probabilité IMPLICITE du marché (marge
retirée). Un vrai biais = l'écart « réel − implicite » significatif et stable,
+ un ROI positif aux cotes réelles sur des règles simples.

Nécessite le réseau ouvert (cotes football-data.co.uk) → GitHub Actions.
"""
import importlib.util
import os
from collections import defaultdict, deque

spec = importlib.util.spec_from_file_location("algo", os.path.join(os.path.dirname(__file__), "algo-ligue1.py"))
algo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(algo)


def build():
    matches = algo.load_openfootball()
    algo.enrich_with_odds(matches)
    ms = [m for m in sorted(matches, key=lambda x: (x["date"], x["home"])) if m.get("odds")]

    ws = defaultdict(int)          # série de victoires en cours
    form = defaultdict(lambda: deque(maxlen=5))  # points 5 derniers
    rows = []
    # NB : on reconstitue les séries sur TOUS les matchs (pas seulement ceux avec cotes)
    allm = sorted(matches, key=lambda x: (x["date"], x["home"]))
    have = set(id(m) for m in ms)
    for m in allm:
        h, a, fh, fa = m["home"], m["away"], m["fh"], m["fa"]
        if id(m) in have:
            rows.append({
                "imp": m["odds"], "dec": m.get("dec"),
                "ws_h": ws[h], "ws_a": ws[a],
                "pts_h": sum(form[h]), "pts_a": sum(form[a]),
                "y": "home" if fh > fa else "draw" if fh == fa else "away",
            })
        ws[h] = ws[h] + 1 if fh > fa else 0
        ws[a] = ws[a] + 1 if fa > fh else 0
        form[h].append(3 if fh > fa else 1 if fh == fa else 0)
        form[a].append(3 if fa > fh else 1 if fh == fa else 0)
    return rows


def calibration(rows):
    """Favori-outsider : proba implicite vs fréquence réelle, par tranche."""
    bins = [(0, .10), (.10, .20), (.20, .35), (.35, .50), (.50, .65), (.65, .80), (.80, 1.01)]
    agg = {b: [0.0, 0] for b in bins}  # somme implicite, nb ; et hits
    hits = {b: 0 for b in bins}
    for r in rows:
        for o in ("home", "draw", "away"):
            p = r["imp"][o]
            for b in bins:
                if b[0] <= p < b[1]:
                    agg[b][0] += p; agg[b][1] += 1
                    hits[b] += (r["y"] == o)
                    break
    out = []
    for b in bins:
        s, n = agg[b]
        if n < 30:
            continue
        implied = s / n * 100
        real = hits[b] / n * 100
        out.append((f"{int(b[0]*100)}-{int(b[1]*100)}%", n, implied, real, real - implied))
    return out


def streak_effect(rows, side):
    """Une équipe en série de victoires sur/sous-performe-t-elle son implicite ?"""
    key_ws = "ws_h" if side == "home" else "ws_a"
    groups = {"0": [], "1-2": [], "3+": []}
    for r in rows:
        n = r[key_ws]
        g = "0" if n == 0 else "1-2" if n <= 2 else "3+"
        implied = r["imp"][side]
        won = 1.0 if r["y"] == side else 0.0
        groups[g].append((implied, won))
    out = []
    for g, arr in groups.items():
        if len(arr) < 40:
            continue
        implied = sum(x[0] for x in arr) / len(arr) * 100
        real = sum(x[1] for x in arr) / len(arr) * 100
        out.append((g, len(arr), implied, real, real - implied))
    return out


def roi_rule(rows, pick, cond, stake=1.0):
    """ROI d'une règle : pick(r)->'home'/'away'/'draw'/None, cond(r)->bool."""
    staked = ret = n = wins = 0
    for r in rows:
        if not cond(r) or not r.get("dec"):
            continue
        o = pick(r)
        if not o:
            continue
        staked += stake; n += 1
        if r["y"] == o:
            ret += stake * r["dec"][o]; wins += 1
    if not staked:
        return None
    return (n, wins, (ret - staked) / staked * 100)


def fav(r):
    return max(("home", "draw", "away"), key=lambda o: r["imp"][o])


def main():
    rows = build()
    L = [f"# Ligue 1 — chasse aux biais du marché ({len(rows)} matchs avec cotes)\n",
         "Tout est mesuré vs la proba IMPLICITE (marge retirée). Écart = réel − implicite.\n"]
    if not rows:
        L.append("⚠️ Aucune cote récupérée (réseau ?). Relancer sur GitHub Actions.")
        open("RESULTATS-BIAIS.md", "w", encoding="utf-8").write("\n".join(L))
        print("\n".join(L)); return

    L += ["## 1. Calibration (biais favori-outsider)",
          "| Tranche implicite | n | implicite | réel | écart |", "|---|---|---|---|---|"]
    for lab, n, imp, real, d in calibration(rows):
        L.append(f"| {lab} | {n} | {imp:.1f}% | {real:.1f}% | {d:+.1f} pts |")
    L.append("\n_Écart négatif sur les petites probas = outsiders surcotés (biais classique)._\n")

    for side, name in (("home", "à domicile"), ("away", "à l'extérieur")):
        L += [f"## 2. Effet des séries de victoires ({name})",
              "| Série en cours | n | implicite | réel | écart |", "|---|---|---|---|---|"]
        for g, n, imp, real, d in streak_effect(rows, side):
            L.append(f"| {g} victoires | {n} | {imp:.1f}% | {real:.1f}% | {d:+.1f} pts |")
        L.append("")

    L += ["## 3. ROI de règles simples (aux cotes réelles)",
          "| Règle | n paris | gagnés | ROI |", "|---|---|---|---|"]
    rules = [
        ("Toujours le favori", lambda r: fav(r), lambda r: True),
        ("Favori net (implicite > 60%)", lambda r: fav(r), lambda r: max(r["imp"].values()) > .60),
        ("Fader l'équipe dom. en série 3+", lambda r: "away" if r["ws_h"] >= 3 else None, lambda r: r["ws_h"] >= 3),
        ("Fader l'équipe ext. en série 3+", lambda r: "home" if r["ws_a"] >= 3 else None, lambda r: r["ws_a"] >= 3),
        ("Toujours le nul", lambda r: "draw", lambda r: True),
        ("Outsider dom. (implicite < 25%)", lambda r: "home", lambda r: r["imp"]["home"] < .25),
    ]
    for name, pick, cond in rules:
        res = roi_rule(rows, pick, cond)
        if res:
            n, wins, roi = res
            L.append(f"| {name} | {n} | {wins} | {roi:+.1f}% |")
    L += ["", "_ROI ≈ 0 attendu si le marché est efficace ; un ROI nettement > 0, stable, "
          "serait un vrai edge (rare, à confirmer hors échantillon)._"]

    report = "\n".join(L) + "\n"
    open("RESULTATS-BIAIS.md", "w", encoding="utf-8").write(report)
    print(report)
    print("→ RESULTATS-BIAIS.md écrit")


if __name__ == "__main__":
    main()
