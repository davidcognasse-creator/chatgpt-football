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
    """Trie les issues ; renvoie coverage pour simple/double/triple."""
    order = sorted(("1", "N", "2"), key=lambda k: -p[k])
    cov = {1: p[order[0]], 2: p[order[0]] + p[order[1]], 3: 1.0}
    return order, cov


def optimize(matchs, maxcombos):
    infos = [picks_info(m["p"]) for m in matchs]
    # DP sur le nombre de combinaisons (produit des picks) ≤ maxcombos.
    dp = {1: (0.0, [])}  # produit -> (somme log-coverage, choix[])
    for (order, cov) in infos:
        nd = {}
        for prod, (val, ch) in dp.items():
            for k in (1, 2, 3):
                np_ = prod * k
                if np_ > maxcombos:
                    continue
                v = val + math.log(max(1e-9, cov[k]))
                if np_ not in nd or v > nd[np_][0]:
                    nd[np_] = (v, ch + [k])
        dp = nd
    # meilleure valeur sous budget
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
        for i, (m, (order, cov), k) in enumerate(zip(matchs, infos, choices), 1):
            nb[k] += 1
            typ = {1: "simple", 2: "DOUBLE", 3: "TRIPLE"}[k]
            covs.append(cov[k])
            say(f"| {i} | {m['dom']}–{m['ext']} | {typ} | {' / '.join(order[:k])} | {cov[k]*100:.0f}% |")
        say(f"\nRépartition : {nb[1]} simples · **{nb[2]} doubles** · **{nb[3]} triples**")
        d = poisson_binomial(covs)
        say(f"- **≥ {n-2}** (rang gagnant) : **{(d[n]+d[n-1]+d[n-2])*100:.2f} %** "
            f"· espérance **{sum(i*d[i] for i in range(n+1)):.1f}/{n}**\n")

    grids = []
    for bud in BUDGETS:
        ch, cb, inf = optimize(matchs, int(bud / UNIT))
        render(bud, ch, cb, inf)
        grids.append((bud, ch, cb, inf))

    say("---\n_Doubles/triples sur les matchs les plus incertains. Probas = "
        + src + " (via moteur-cotes → probas.json)._")
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
        for i, ((order, cov), k) in enumerate(zip(infos, choices), 1):
            nb[k] += 1
            covs.append(cov[k])
            picks.append({"i": i, "type": {1: "simple", 2: "double", 3: "triple"}[k],
                          "picks": order[:k], "coverage": cov[k]})
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
