#!/usr/bin/env python3
"""
Optimiseur de grille Loto Foot sous budget (ex. 50 €).

Prend les probas 1·N·2 du modèle par match et répartit des DOUBLES / TRIPLES
là où c'est le plus rentable, pour maximiser la probabilité de grille gagnante
sous la contrainte : nb de combinaisons ≤ budget / mise unitaire.

Entrée : probas.json = {"matchs":[{"dom","ext","p":{"1","N","2"}}, ...]}
(produit par le moteur cotes/actualité). À défaut, se rabat sur la répartition
de la foule de grille.json — PLACEHOLDER pour tester la mécanique.
"""
import json
import math
import os

UNIT = 1.0      # € par combinaison
HERE = os.path.dirname(__file__)

# ── Conscience du nul (#2) ─────────────────────────────────────────────────
# Faiblesse #1 du N°51 : sur les matchs équilibrés, le modèle jouait le favori
# en simple et le nul tombait (Qingdao 1-1, Gwangju 1-1). L'indice de propension
# au nul (dpi) repère ces matchs (équilibrés, P(N) non négligeable) pour :
#  (a) inciter l'optimiseur à y placer un double/triple (bonus de valeur), et
#  (b) faire couvrir le NUL par ce double plutôt que le 2e favori.
# Réglable via env pour la calibration (#4). Coverage recalculée honnêtement.
DRAW_MIN = float(os.environ.get("DRAW_MIN", "0.72"))     # dpi mini pour couvrir N dans un double
DRAW_BONUS = float(os.environ.get("DRAW_BONUS", "0.10"))  # bonus de valeur (log) × dpi si N couvert
DRAW_MAXCOST = float(os.environ.get("DRAW_MAXCOST", "0.06"))  # coût de coverage max pour couvrir N au lieu du 2e favori


def draw_propensity(p):
    """Indice 0..~1.3 : élevé quand le match est ÉQUILIBRÉ (P(1)≈P(2)) et que le
    nul n'est pas négligeable. C'est là que le nul est le piège classique du pool."""
    p1, pN, p2 = p["1"], p["N"], p["2"]
    balance = 1 - abs(p1 - p2) / (p1 + p2 + 1e-9)   # 1 = parfaitement équilibré
    return balance * pN / 0.33                       # 0.33 = nul « neutre » de référence


def get_budget():
    """Budget € : priorité à BUDGET_EUR (env), sinon "budget" de grille.json, sinon 50."""
    env = os.environ.get("BUDGET_EUR")
    if env:
        try:
            return float(env)
        except ValueError:
            pass
    try:
        g = json.load(open(os.path.join(HERE, "grille.json"), encoding="utf-8"))
        if g.get("budget"):
            return float(g["budget"])
    except Exception:
        pass
    return 50.0


BUDGET = get_budget()

L = []
def say(s): L.append(s); print(s)


def load():
    p = os.path.join(HERE, "probas.json")
    if os.path.exists(p):
        d = json.load(open(p, encoding="utf-8"))
        src = (d["matchs"][0].get("source") if d.get("matchs") else None) or "modèle (cotes/actualité)"
        return d["matchs"], src
    # placeholder : la foule (juste pour valider l'optimiseur)
    g = json.load(open(os.path.join(HERE, "grille.json"), encoding="utf-8"))
    ms = []
    for m in g["matchs"]:
        f = m["foule"]; t = f["1"] + f["N"] + f["2"] or 1
        ms.append({"dom": m["dom"], "ext": m["ext"],
                   "p": {k: f[k] / t for k in ("1", "N", "2")}})
    return ms, "FOULE (placeholder — à remplacer par le modèle)"


def picks_info(p):
    """Trie les issues ; renvoie les SIGNES couverts et la coverage réelle pour
    simple/double/triple. Le double est « conscient du nul » : sur un match
    équilibré (dpi élevé) où le nul serait exclu, il couvre {favori, N} au lieu
    des deux favoris — au prix d'un peu de coverage, pour ne plus rater les nuls."""
    order = sorted(("1", "N", "2"), key=lambda k: -p[k])
    dpi = draw_propensity(p)
    signs = {1: [order[0]], 3: list(order)}
    swap_cost = p[order[1]] - p["N"]         # coverage perdue en couvrant N au lieu du 2e favori
    if "N" in order[:2]:
        signs[2] = order[:2]                 # nul déjà dans le top-2 : rien à faire
    elif dpi >= DRAW_MIN and swap_cost <= DRAW_MAXCOST:
        signs[2] = [order[0], "N"]           # match équilibré + nul quasi aussi probable : on couvre le NUL
    else:
        signs[2] = order[:2]                 # match tranché ou nul trop coûteux : top-2 classique
    cov = {k: sum(p[s] for s in signs[k]) for k in (1, 2, 3)}
    return {"order": order, "cov": cov, "signs": signs, "dpi": dpi}


def optimize(matchs, maxcombos):
    infos = [picks_info(m["p"]) for m in matchs]
    # DP sur le nombre de combinaisons (produit des picks) ≤ maxcombos.
    dp = {1: (0.0, [])}  # produit -> (valeur, choix[])
    for info in infos:
        cov, signs, dpi = info["cov"], info["signs"], info["dpi"]
        nd = {}
        for prod, (val, ch) in dp.items():
            for k in (1, 2, 3):
                np_ = prod * k
                if np_ > maxcombos:
                    continue
                # valeur = log-coverage + bonus si le pick couvre le nul sur un
                # match à forte propension au nul (oriente le budget vers ces matchs).
                bonus = DRAW_BONUS * dpi if "N" in signs[k] else 0.0
                v = val + math.log(max(1e-9, cov[k])) + bonus
                if np_ not in nd or v > nd[np_][0]:
                    nd[np_] = (v, ch + [k])
        dp = nd
    best_prod = max(dp, key=lambda pr: dp[pr][0])
    return dp[best_prod][1], best_prod, infos


def poisson_binomial(covs):
    """Distribution du nombre de matchs corrects (issues indépendantes)."""
    dist = [1.0]
    for c in covs:
        nd = [0.0] * (len(dist) + 1)
        for i, v in enumerate(dist):
            nd[i] += v * (1 - c)
            nd[i + 1] += v * c
        dist = nd
    return dist


BUDGETS = [12, 24, 48]   # trois grilles proposées


def main():
    matchs, src = load()
    n = len(matchs)
    say("# Optimiseur de grille Loto Foot\n")
    say(f"Probas : **{src}** · {n} matchs · mise unitaire {UNIT:.0f} € · "
        f"budgets {', '.join(str(b) for b in BUDGETS)} €\n")

    def render(bud, choices, combos, infos):
        say(f"## 🎯 Grille ≤ {bud} €")
        say(f"Combinaisons : **{combos}** → coût **{combos*UNIT:.0f} €** (≤ {bud} €)\n")
        say("| # | Match | Type | Pronostic(s) | Couverture |")
        say("|---|---|---|---|---|")
        covs, nb = [], {1: 0, 2: 0, 3: 0}
        for i, (m, info, k) in enumerate(zip(matchs, infos, choices), 1):
            nb[k] += 1
            signs, cov = info["signs"], info["cov"]
            typ = {1: "simple", 2: "DOUBLE", 3: "TRIPLE"}[k]
            hedge = " 🅽" if k == 2 and "N" in signs[k] and info["order"][2] == "N" else ""
            covs.append(cov[k])
            say(f"| {i} | {m['dom']}–{m['ext']} | {typ}{hedge} | {' / '.join(signs[k])} | {cov[k]*100:.0f}% |")
        say(f"\nRépartition : {nb[1]} simples · **{nb[2]} doubles** · **{nb[3]} triples**")
        d = poisson_binomial(covs)
        say(f"- **≥ {n-2}** (rang gagnant) : **{(d[n]+d[n-1]+d[n-2])*100:.2f} %** "
            f"· espérance **{sum(i*d[i] for i in range(n+1)):.1f}/{n}**\n")

    grids = []
    for bud in BUDGETS:
        ch, cb, inf = optimize(matchs, int(bud / UNIT))
        render(bud, ch, cb, inf)
        grids.append((bud, ch, cb, inf))

    say("---\n_Doubles/triples sur les matchs les plus incertains, avec conscience du "
        "nul (🅽 = double couvrant le nul sur un match équilibré, pour ne plus rater les "
        "1-1 type Qingdao/Gwangju du N°51). Probas = " + src + " (via moteur-cotes → probas.json)._")
    open(os.path.join(HERE, "GRILLE-OPTIM.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")

    export_json(matchs, src, grids)


def export_json(matchs, src, grids):
    """Écrit lotofoot.json (racine du repo) pour la page publique lotofoot.html :
    l'analyse par match (marché vs foule) + une grille par budget."""
    n = len(matchs)
    rows, divergences = [], []
    for i, m in enumerate(matchs, 1):
        f = m.get("foule") or {}
        ft = (f.get("1", 0) + f.get("N", 0) + f.get("2", 0)) or 1
        foule = {kk: f.get(kk, 0) / ft for kk in ("1", "N", "2")}
        p = m["p"]
        market_pick = max(("1", "N", "2"), key=lambda kk: p[kk])
        crowd_pick = max(("1", "N", "2"), key=lambda kk: foule[kk])
        source = m.get("source", "")
        coted = source.startswith("cotes") or source.startswith("prédiction")
        div = coted and market_pick != crowd_pick
        if div:
            divergences.append({"i": i, "dom": m["dom"], "ext": m["ext"],
                                "marketPick": market_pick, "crowdPick": crowd_pick,
                                "p": p, "foule": foule})
        rows.append({"i": i, "dom": m["dom"], "ext": m["ext"], "p": p, "foule": foule,
                     "source": source, "coted": coted, "marketPick": market_pick,
                     "crowdPick": crowd_pick, "divergence": div})

    grids_json = []
    for bud, choices, combos, infos in grids:
        covs, nb, picks = [], {1: 0, 2: 0, 3: 0}, []
        for i, (info, k) in enumerate(zip(infos, choices), 1):
            nb[k] += 1
            signs, cov = info["signs"], info["cov"]
            covs.append(cov[k])
            picks.append({"i": i, "type": {1: "simple", 2: "double", 3: "triple"}[k],
                          "picks": signs[k], "coverage": cov[k]})
        d = poisson_binomial(covs)
        grids_json.append({
            "budget": bud, "combos": combos, "cost": combos * UNIT,
            "repartition": {"simples": nb[1], "doubles": nb[2], "triples": nb[3]},
            "stats": {"p15": d[n], "p14": d[n - 1], "p13": d[n - 2],
                      "pge13": d[n] + d[n - 1] + d[n - 2],
                      "esperance": sum(i * d[i] for i in range(n + 1))},
            "picks": picks,
        })

    data = {
        "nom": json.load(open(os.path.join(HERE, "grille.json"), encoding="utf-8")).get("nom", ""),
        "source": src, "matchs": rows, "divergences": divergences, "grids": grids_json,
    }
    json.dump(data, open(os.path.join(HERE, "..", "lotofoot.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
