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

BUDGET = 50.0   # €
UNIT = 1.0      # € par combinaison
HERE = os.path.dirname(__file__)

L = []
def say(s): L.append(s); print(s)


def load():
    p = os.path.join(HERE, "probas.json")
    if os.path.exists(p):
        d = json.load(open(p, encoding="utf-8"))
        return d["matchs"], "modèle (cotes/actualité)"
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


def main():
    matchs, src = load()
    say(f"# Optimiseur de grille Loto Foot — budget {BUDGET:.0f} €\n")
    say(f"Probas : **{src}** · {len(matchs)} matchs · mise unitaire {UNIT:.0f} €\n")

    maxcombos = int(BUDGET / UNIT)
    choices, combos, infos = optimize(matchs, maxcombos)

    say(f"Combinaisons jouées : **{combos}** → coût **{combos*UNIT:.0f} €** (≤ {BUDGET:.0f} €)\n")
    say("| # | Match | Type | Pronostic(s) | Couverture |")
    say("|---|---|---|---|---|")
    covs = []
    nb = {1: 0, 2: 0, 3: 0}
    for m, (order, cov), k in zip(matchs, infos, choices):
        nb[k] += 1
        picks = order[:k]
        typ = {1: "simple", 2: "DOUBLE", 3: "TRIPLE"}[k]
        covs.append(cov[k])
        say(f"| — | {m['dom']}–{m['ext']} | {typ} | {' / '.join(picks)} | {cov[k]*100:.0f}% |")

    say(f"\nRépartition : {nb[1]} simples · **{nb[2]} doubles** · **{nb[3]} triples**")

    dist = poisson_binomial(covs)
    n = len(matchs)
    p_all = dist[n]
    say("\n## Probabilité de résultat (matchs corrects)")
    say(f"- **{n}/{n}** (grille parfaite) : {p_all*100:.2f} %")
    if n >= 14:
        say(f"- **{n-1}/{n}** : {dist[n-1]*100:.2f} %")
    if n >= 15:
        say(f"- **{n-2}/{n}** : {dist[n-2]*100:.2f} %")
        say(f"- **≥ {n-2}** : {(dist[n]+dist[n-1]+dist[n-2])*100:.2f} %")
    esp = sum(i * dist[i] for i in range(n + 1))
    say(f"- Espérance de bons résultats : **{esp:.1f} / {n}**")

    say("\n---\n_Les doubles/triples sont placés sur les matchs les plus incertains "
        "(meilleur gain de couverture par € dépensé). Remplace la FOULE par le modèle "
        "cotes/actualité (probas.json) pour un vrai edge._")
    open(os.path.join(HERE, "GRILLE-OPTIM.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
