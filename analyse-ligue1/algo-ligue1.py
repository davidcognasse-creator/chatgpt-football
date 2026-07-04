#!/usr/bin/env python3
"""
Algo de probabilités Ligue 1 — recherche de la MEILLEURE clé de répartition.

Principe (comme la CDM) : chaque sous-critère produit un vecteur
{domicile, nul, extérieur} ; on les combine par moyenne pondérée. Mais ici,
on a 10+ ans de résultats → on OPTIMISE les poids par backtest au lieu de les
deviner (minimisation du log-loss, juge correct des probabilités).

Sous-critères :
  - elo      : Elo dynamique (force réelle, MAJ après chaque match, bonus domicile)
  - forme    : points/match récents, séparés domicile / extérieur
  - terrain  : avantage du terrain propre à chaque club (dom vs ext historique)
  - poisson  : attaque/défense (buts) -> probas via loi de Poisson
  - h2h      : face-à-face récents
  - cotes    : probas implicites du marché (football-data.co.uk) — si dispo
  - meteo    : ajustement pluie/froid/vent (Open-Meteo) — si activé

Données gratuites : openfootball (résultats), football-data.co.uk (cotes),
Open-Meteo (météo). Réseau ouvert requis pour cotes/météo (OK sur GitHub Actions).
"""
import csv
import io
import json
import math
import urllib.request
from collections import defaultdict, deque

OF_BASE = "https://raw.githubusercontent.com/openfootball/football.json/master"
FD_BASE = "https://www.football-data.co.uk/mmz4281"
SEASONS = ["2014-15", "2015-16", "2016-17", "2017-18", "2018-19",
           "2019-20", "2020-21", "2021-22", "2022-23", "2023-24", "2024-25"]
FD_CODES = {  # football-data.co.uk : saison -> code de dossier
    "2014-15": "1415", "2015-16": "1516", "2016-17": "1617", "2017-18": "1718",
    "2018-19": "1819", "2019-20": "1920", "2020-21": "2021", "2021-22": "2122",
    "2022-23": "2223", "2023-24": "2324", "2024-25": "2425",
}
OUTCOMES = ["home", "draw", "away"]


def get(url, timeout=45):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.read()


# ---------------------------------------------------------------- chargement
def load_openfootball():
    matches = []
    for s in SEASONS:
        try:
            d = json.loads(get(f"{OF_BASE}/{s}/fr.1.json"))
        except Exception as e:
            print(f"  (openfootball {s} indispo : {e})")
            continue
        for m in d.get("matches", []):
            ft = (m.get("score") or {}).get("ft")
            if not ft or ft[0] is None or not m.get("date"):
                continue
            matches.append({"season": s, "date": m["date"], "home": m["team1"],
                            "away": m["team2"], "fh": ft[0], "fa": ft[1], "odds": None})
    return matches


def key(name):
    """Clé de rapprochement de noms d'équipes entre sources (mots-clés villes)."""
    n = name.lower()
    for kw in ["paris", "marseille", "lyon", "monaco", "lille", "nice", "rennes",
               "lens", "reims", "nantes", "montpellier", "strasbourg", "brest",
               "lorient", "angers", "metz", "troyes", "clermont", "auxerre",
               "toulouse", "ajaccio", "havre", "etienne", "dijon", "guingamp",
               "nimes", "amiens", "bordeaux", "caen", "nancy", "bastia", "evian"]:
        if kw in n:
            return kw
    return n


def enrich_with_odds(matches):
    """Ajoute les probas implicites du marché (moyenne bookmakers) si joignable."""
    by_key = defaultdict(list)
    for m in matches:
        by_key[(m["date"], key(m["home"]), key(m["away"]))].append(m)
    added = 0
    for s in SEASONS:
        try:
            raw = get(f"{FD_BASE}/{FD_CODES[s]}/F1.csv").decode("latin-1")
        except Exception as e:
            print(f"  (cotes {s} indispo : {e})")
            continue
        for row in csv.DictReader(io.StringIO(raw)):
            d = (row.get("Date") or "").strip()
            # football-data : dd/mm/yy ou dd/mm/yyyy -> yyyy-mm-dd
            try:
                dd, mm, yy = d.split("/")
                yy = ("20" + yy) if len(yy) == 2 else yy
                iso = f"{yy}-{mm}-{dd}"
            except Exception:
                continue
            oh = row.get("AvgH") or row.get("BbAvgH") or row.get("B365H")
            od = row.get("AvgD") or row.get("BbAvgD") or row.get("B365D")
            oa = row.get("AvgA") or row.get("BbAvgA") or row.get("B365A")
            if not (oh and od and oa):
                continue
            try:
                ih, idr, ia = 1 / float(oh), 1 / float(od), 1 / float(oa)
            except (ValueError, ZeroDivisionError):
                continue
            tot = ih + idr + ia  # retire la marge (overround)
            probs = {"home": ih / tot, "draw": idr / tot, "away": ia / tot}
            for m in by_key.get((iso, key(row.get("HomeTeam", "")), key(row.get("AwayTeam", ""))), []):
                m["odds"] = probs
                added += 1
    print(f"  Cotes rattachées : {added}/{len(matches)} matchs")


# ------------------------------------------------------------------ features
def normalize(p):
    s = p["home"] + p["draw"] + p["away"]
    return {k: (p[k] / s if s else 1 / 3) for k in OUTCOMES}


def two_sided(sh, sa, draw=0.26):
    a, b = sh + 1e-6, sa + 1e-6
    r = 1 - draw
    return normalize({"home": r * a / (a + b), "draw": draw, "away": r * b / (a + b)})


def poisson_pmf(k, lam):
    return math.exp(-lam) * lam ** k / math.factorial(k)


def poisson_probs(lh, la, maxg=8):
    ph = pd = pa = 0.0
    for i in range(maxg + 1):
        for j in range(maxg + 1):
            p = poisson_pmf(i, lh) * poisson_pmf(j, la)
            if i > j:
                ph += p
            elif i == j:
                pd += p
            else:
                pa += p
    return normalize({"home": ph, "draw": pd, "away": pa})


class Engine:
    """État roulant (Elo, forme, buts, h2h) mis à jour chronologiquement."""

    def __init__(self, k=20, ha=65, dmax=0.34):
        self.k, self.ha, self.dmax = k, ha, dmax
        self.elo = defaultdict(lambda: 1500.0)
        self.hform = defaultdict(lambda: deque(maxlen=6))  # pts à domicile
        self.aform = defaultdict(lambda: deque(maxlen=6))  # pts à l'extérieur
        self.hres = defaultdict(lambda: deque(maxlen=19))  # 1/0 victoire dom
        self.ares = defaultdict(lambda: deque(maxlen=19))  # 1/0 victoire ext
        self.gf_h = defaultdict(lambda: deque(maxlen=10))
        self.ga_h = defaultdict(lambda: deque(maxlen=10))
        self.gf_a = defaultdict(lambda: deque(maxlen=10))
        self.ga_a = defaultdict(lambda: deque(maxlen=10))
        self.h2h = defaultdict(lambda: deque(maxlen=6))    # (home_win,draw,away_win) vus
        self.lg_h = deque(maxlen=200)  # buts domicile ligue
        self.lg_a = deque(maxlen=200)

    # -- chaque feature renvoie un dict de probas ou None si pas assez de data --
    def f_elo(self, h, a):
        d = (self.elo[h] + self.ha) - self.elo[a]
        e = 1 / (1 + 10 ** (-d / 400))
        pdraw = max(0.06, min(0.32, self.dmax * (1 - abs(2 * e - 1))))
        return normalize({"home": max(0, e - pdraw / 2), "draw": pdraw,
                          "away": max(0, (1 - e) - pdraw / 2)})

    def f_forme(self, h, a):
        if len(self.hform[h]) < 3 or len(self.aform[a]) < 3:
            return None
        sh = sum(self.hform[h]) / len(self.hform[h]) / 3  # ppg normalisé 0..1
        sa = sum(self.aform[a]) / len(self.aform[a]) / 3
        return two_sided(sh, sa)

    def f_terrain(self, h, a):
        if len(self.hres[h]) < 5 or len(self.ares[a]) < 5:
            return None
        sh = sum(self.hres[h]) / len(self.hres[h])  # taux vict. dom du club h
        sa = sum(self.ares[a]) / len(self.ares[a])  # taux vict. ext du club a
        return two_sided(sh + 0.05, sa + 0.05)

    def f_poisson(self, h, a):
        if len(self.gf_h[h]) < 4 or len(self.gf_a[a]) < 4:
            return None
        avh = (sum(self.lg_h) / len(self.lg_h)) if self.lg_h else 1.5
        ava = (sum(self.lg_a) / len(self.lg_a)) if self.lg_a else 1.1
        att_h = (sum(self.gf_h[h]) / len(self.gf_h[h])) / max(0.1, avh)
        def_a = (sum(self.ga_a[a]) / len(self.ga_a[a])) / max(0.1, avh)
        att_a = (sum(self.gf_a[a]) / len(self.gf_a[a])) / max(0.1, ava)
        def_h = (sum(self.ga_h[h]) / len(self.ga_h[h])) / max(0.1, ava)
        lh = max(0.2, avh * att_h * def_a)
        la = max(0.2, ava * att_a * def_h)
        return poisson_probs(lh, la)

    def f_h2h(self, h, a):
        seen = self.h2h[(h, a)]
        if len(seen) < 2:
            return None
        c = {"home": 0.0, "draw": 0.0, "away": 0.0}
        for hw, dr, aw in seen:
            c["home"] += hw
            c["draw"] += dr
            c["away"] += aw
        for k in c:
            c[k] += 0.5  # lissage
        return normalize(c)

    def features(self, h, a, odds):
        f = {"elo": self.f_elo(h, a), "forme": self.f_forme(h, a),
             "terrain": self.f_terrain(h, a), "poisson": self.f_poisson(h, a),
             "h2h": self.f_h2h(h, a)}
        if odds:
            f["cotes"] = odds
        return f

    def update(self, h, a, fh, fa):
        res_h = 1.0 if fh > fa else 0.5 if fh == fa else 0.0
        # Elo
        d = (self.elo[h] + self.ha) - self.elo[a]
        e = 1 / (1 + 10 ** (-d / 400))
        gd = abs(fh - fa)
        mult = 1.0 if gd <= 1 else (1.5 if gd == 2 else 1.75 + (gd - 3) / 8)
        delta = self.k * mult * (res_h - e)
        self.elo[h] += delta
        self.elo[a] -= delta
        # forme (points)
        self.hform[h].append(3 if fh > fa else 1 if fh == fa else 0)
        self.aform[a].append(3 if fa > fh else 1 if fh == fa else 0)
        # terrain (victoires)
        self.hres[h].append(1 if fh > fa else 0)
        self.ares[a].append(1 if fa > fh else 0)
        # buts
        self.gf_h[h].append(fh); self.ga_h[h].append(fa)
        self.gf_a[a].append(fa); self.ga_a[a].append(fh)
        self.lg_h.append(fh); self.lg_a.append(fa)
        # h2h (du point de vue de l'équipe à domicile de CE match)
        self.h2h[(h, a)].append((1 if fh > fa else 0, 1 if fh == fa else 0, 1 if fh < fa else 0))


# ------------------------------------------------------------ backtest + opt
def build_rows(matches):
    """Passe chronologique : stocke les probas de chaque feature + l'issue réelle."""
    eng = Engine()
    rows = []
    for m in sorted(matches, key=lambda x: (x["date"], x["home"])):
        h, a, fh, fa = m["home"], m["away"], m["fh"], m["fa"]
        feats = eng.features(h, a, m.get("odds"))
        y = "home" if fh > fa else "draw" if fh == fa else "away"
        rows.append({"season": m["season"], "feats": feats, "y": y})
        eng.update(h, a, fh, fa)
    return rows


def mix(feats, w):
    """Moyenne pondérée des features disponibles (renormalise les poids)."""
    acc = {"home": 0.0, "draw": 0.0, "away": 0.0}
    tot = 0.0
    for k, p in feats.items():
        if p is None or k not in w:
            continue
        tot += w[k]
        for o in OUTCOMES:
            acc[o] += w[k] * p[o]
    if tot == 0:
        return None
    return normalize({o: acc[o] / tot for o in OUTCOMES})


def logloss(rows, w):
    s = n = 0
    for r in rows:
        p = mix(r["feats"], w)
        if not p:
            continue
        s += -math.log(max(1e-9, p[r["y"]]))
        n += 1
    return s / n if n else 99.0


def brier(rows, w):
    s = n = 0
    for r in rows:
        p = mix(r["feats"], w)
        if not p:
            continue
        s += sum((p[o] - (1.0 if o == r["y"] else 0.0)) ** 2 for o in OUTCOMES)
        n += 1
    return s / n if n else 9.0


def accuracy(rows, w):
    ok = n = 0
    for r in rows:
        p = mix(r["feats"], w)
        if not p:
            continue
        pred = max(OUTCOMES, key=lambda o: p[o])
        ok += (pred == r["y"])
        n += 1
    return ok / n if n else 0.0


def optimize(rows, feats_list):
    """Descente de coordonnées sur le simplexe (log-loss convexe en les poids)."""
    w = {k: 1.0 / len(feats_list) for k in feats_list}

    def renorm(d):
        s = sum(d.values()) or 1
        return {k: v / s for k, v in d.items()}

    best = logloss(rows, w)
    for _ in range(60):
        improved = False
        for k in feats_list:
            for step in (0.08, -0.08, 0.03, -0.03):
                cand = dict(w)
                cand[k] = max(0.0, cand[k] + step)
                cand = renorm(cand)
                ll = logloss(rows, cand)
                if ll < best - 1e-6:
                    w, best = cand, ll
                    improved = True
        if not improved:
            break
    return renorm(w), best


def main():
    print("Chargement des résultats (openfootball)…")
    matches = load_openfootball()
    print(f"  {len(matches)} matchs.")
    print("Rattachement des cotes (football-data.co.uk)…")
    enrich_with_odds(matches)

    rows = build_rows(matches)
    # warmup : on ignore la 1re saison (le temps que les notes se stabilisent)
    warm = SEASONS[0]
    rows = [r for r in rows if r["season"] != warm]
    test_season = SEASONS[-1]
    train = [r for r in rows if r["season"] != test_season]
    test = [r for r in rows if r["season"] == test_season]

    has_odds = any("cotes" in r["feats"] and r["feats"]["cotes"] for r in rows)
    feats_list = ["elo", "forme", "terrain", "poisson", "h2h"] + (["cotes"] if has_odds else [])

    w, ll_train = optimize(train, feats_list)
    print("\n=== CLÉ DE RÉPARTITION OPTIMISÉE (Ligue 1) ===")
    for k in feats_list:
        print(f"  {k:9} {w[k]*100:5.1f}%")
    print(f"\nEntraînement : {len(train)} matchs (saisons hors {test_season})")
    print(f"Test         : {len(test)} matchs (saison {test_season})\n")

    def line(name, rr, ww):
        print(f"  {name:22} log-loss {logloss(rr, ww):.4f} · Brier {brier(rr, ww):.4f} · exact {accuracy(rr, ww)*100:.1f}%")

    print("Sur la saison de TEST :")
    line("Clé optimisée", test, w)
    for k in feats_list:
        line(f"{k} seul", test, {k: 1.0})
    if has_odds:
        line("Cotes seules (marché)", test, {"cotes": 1.0})

    out = {"weights": w, "train_logloss": ll_train, "features": feats_list,
           "test_season": test_season,
           "test": {"logloss": logloss(test, w), "brier": brier(test, w),
                    "accuracy": accuracy(test, w)}}
    with open("algo-ligue1.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    # Rapport markdown
    L = [f"# Algo Ligue 1 — clé de répartition optimisée ({'avec' if has_odds else 'sans'} cotes)\n",
         f"Backtest sur {len(train)} matchs (entraînement) + {len(test)} matchs (test, saison {test_season}).",
         "Poids optimisés pour minimiser le log-loss (juge correct des probabilités).\n",
         "## Clé de répartition", "| Critère | Poids |", "|---|---|"]
    for k in feats_list:
        L.append(f"| {k} | {w[k]*100:.1f} % |")
    L += ["", "## Performance (saison test)", "| Modèle | log-loss | Brier | exactitude |", "|---|---|---|---|"]
    L.append(f"| **Clé optimisée** | **{logloss(test, w):.4f}** | {brier(test, w):.4f} | {accuracy(test, w)*100:.1f} % |")
    for k in feats_list:
        L.append(f"| {k} seul | {logloss(test, {k:1.0}):.4f} | {brier(test, {k:1.0}):.4f} | {accuracy(test, {k:1.0})*100:.1f} % |")
    L += ["", f"_Repère : hasard = log-loss 1.0986. Plus c'est bas, mieux c'est._", ""]
    with open("RESULTATS-ALGO.md", "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    print("\n→ algo-ligue1.json + RESULTATS-ALGO.md écrits")


if __name__ == "__main__":
    main()
