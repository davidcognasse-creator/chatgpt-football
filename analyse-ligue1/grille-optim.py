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

# Remplir le budget : la grille utilise TOUT le plafond choisi (12/24/48 €) au lieu
# de s'arrêter dès que l'EV net baisse. Le placement reste guidé par l'EV (on ajoute
# toujours le meilleur upgrade d'abord) → coût = budget affiché SANS dégrader la
# qualité (mêmes bons qu'en EV-optimal sur le backtest). FILL_BUDGET=0 pour revenir
# à l'arrêt EV-optimal (coût potentiellement < plafond).
FILL_BUDGET = os.environ.get("FILL_BUDGET", "1") not in ("0", "false", "False")


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


# ── Espérance de gain en € (#3) ────────────────────────────────────────────
# Objectif : maximiser E[€] = Σ P(rang)·rapport − coût, au lieu de P(parfait).
# Rapports (pari-mutuel, inconnus) ESTIMÉS par un modèle « rareté-foule » :
#   rapport_k ≈ C · F_k / Pc_k
# où Pc_k = proba qu'une grille-FOULE type (favori du public à chaque match)
# atteigne EXACTEMENT le rang k, F_k = part du rang (les rangs rares payent plus),
# C = richesse du pool. Calibré sur le N°51 réel : C≈13 (quasi constant sur les
# trois rangs observés → le modèle tient). Réglable via env pour la calibration #4.
LF_RICHNESS = float(os.environ.get("LF_RICHNESS", "13.5"))


def paying_tiers(n):
    """Rangs qui payent : {n, n-1, n-2} et n-3 en plus pour le LF15."""
    lo = n - 3 if n >= 15 else n - 2
    return list(range(lo, n + 1))


def crowd_correct_probs(matchs):
    """Par match : proba (modèle) que le pari du PUBLIC (son favori) soit juste."""
    c = []
    for m in matchs:
        p = m["p"]
        f = m.get("foule") or p
        fav = max(("1", "N", "2"), key=lambda k: f.get(k, 0))
        c.append(p.get(fav, 0.0))
    return c


def estimate_rapports(matchs, n):
    """Rapports ESTIMÉS par rang (modèle rareté-foule). Renvoie ({rang: €}, Pc)."""
    tiers = paying_tiers(n)
    Pc = poisson_binomial(crowd_correct_probs(matchs))
    lo = tiers[0]
    w = {k: 2 ** (k - lo) for k in tiers}
    W = sum(w.values())
    rap = {}
    for k in tiers:
        pc = Pc[k] if k < len(Pc) else 0.0
        rap[k] = LF_RICHNESS * (w[k] / W) / pc if pc > 1e-9 else 0.0
    return rap, Pc


def expected_gain(dist, rapports):
    """E[€ gagnés] d'une grille = Σ P(meilleure combinaison = k)·rapport_k
    (modèle rang unique, cohérent avec le bilan affiché)."""
    return sum(dist[k] * rapports.get(k, 0.0) for k in range(len(dist)))


def optimize_ev(matchs, maxcombos, rapports):
    """Répartit doubles/triples pour MAXIMISER E[€] = gain espéré − coût, sous
    le plafond de combinaisons. Glouton : à chaque pas on applique l'upgrade
    (simple→double→triple) au meilleur gain net, et on S'ARRÊTE dès qu'aucun
    upgrade n'augmente l'espérance nette — donc le coût optimal peut être < plafond
    (l'enseignement du N°51 : au-delà d'un point, ajouter des combinaisons perd de l'argent)."""
    infos = [picks_info(m["p"]) for m in matchs]
    cov = [info["cov"] for info in infos]
    N = len(matchs)
    k = [1] * N

    def combos(kk):
        pr = 1
        for x in kk:
            pr *= x
        return pr

    def net(kk, cb):
        d = poisson_binomial([cov[i][kk[i]] for i in range(N)])
        return expected_gain(d, rapports) - cb * UNIT

    cur_combos = 1
    cur_net = net(k, cur_combos)
    while True:
        best = None
        for i in range(N):
            if k[i] >= 3:
                continue
            nk = k[i] + 1
            nc = cur_combos // k[i] * nk
            if nc > maxcombos:
                continue
            k[i] = nk
            e = net(k, nc)
            k[i] -= 1
            # FILL_BUDGET : on continue à remplir même si l'EV net baisse (coût =
            # budget). Sinon on ne garde que les upgrades qui augmentent l'EV net.
            gate = True if FILL_BUDGET else (e > cur_net + 1e-9)
            if gate and (best is None or e > best[0]):
                best = (e, i, nk, nc)
        if not best:
            break
        cur_net, i, nk, cur_combos = best[0], best[1], best[2], best[3]
        k[i] = nk
    return list(k), combos(k), infos


def grid_metrics(covs, combos, rapports, n):
    """Métriques €/proba d'une grille. P(profit)=P(gain ≥ coût) est la mesure
    HONNÊTE (le rang requis pour rembourser monte avec le budget), robuste même
    si les probas des rangs rares sont sur-estimées. E[€] dépend, lui, de la
    calibration du modèle (→ #4) — affiché mais à prendre avec des pincettes."""
    dist = poisson_binomial(covs)
    cost = combos * UNIT
    eg = expected_gain(dist, rapports)
    tiers = paying_tiers(n)
    pge = sum(dist[k] for k in tiers)                                   # P(atteindre un rang)
    breakeven = min([k for k in tiers if rapports.get(k, 0) >= cost], default=None)
    pprofit = sum(dist[k] for k in range(len(dist)) if rapports.get(k, 0) >= cost)
    return {"dist": dist, "cost": cost, "eg": eg, "pge": pge,
            "breakeven": breakeven, "pprofit": pprofit}


BUDGETS = [12, 24, 48]   # trois plafonds proposés


def main():
    matchs, src = load()
    n = len(matchs)
    rapports, Pc = estimate_rapports(matchs, n)
    tiers = paying_tiers(n)
    say("# Optimiseur de grille Loto Foot\n")
    say(f"Probas : **{src}** · {n} matchs · mise unitaire {UNIT:.0f} € · "
        f"budgets {', '.join(str(b) for b in BUDGETS)} €\n")
    say("**Objectif : espérance de gain (€), pas seulement la probabilité de grille parfaite.**")
    say("Rapports FDJ ESTIMÉS (modèle rareté-public, calibré sur du réel) :")
    say("| Rang | Rapport estimé | P(public l'atteint) |")
    say("|---|---|---|")
    for k in sorted(tiers, reverse=True):
        pc = Pc[k] if k < len(Pc) else 0
        say(f"| {k}/{n} | ~{rapports[k]:,.0f} € | {pc*100:.3f} % |".replace(",", " "))
    say("")

    def render(bud, choices, combos, infos):
        m_ = grid_metrics([infos[i]["cov"][choices[i]] for i in range(n)], combos, rapports, n)
        say(f"## 🎯 Grille ≤ {bud} €")
        stop = " · _plafond atteint_" if combos >= int(bud / UNIT) else " · _coût optimal < plafond_"
        say(f"Combinaisons : **{combos}** → coût **{m_['cost']:.0f} €** (≤ {bud} €){stop}\n")
        say("| # | Match | Type | Pronostic(s) | Couverture |")
        say("|---|---|---|---|---|")
        nb = {1: 0, 2: 0, 3: 0}
        for i, (m, info, k) in enumerate(zip(matchs, infos, choices), 1):
            nb[k] += 1
            signs = info["signs"]
            typ = {1: "simple", 2: "DOUBLE", 3: "TRIPLE"}[k]
            hedge = " 🅽" if k == 2 and "N" in signs[k] and info["order"][2] == "N" else ""
            say(f"| {i} | {m['dom']}–{m['ext']} | {typ}{hedge} | {' / '.join(signs[k])} | {info['cov'][k]*100:.0f}% |")
        say(f"\nRépartition : {nb[1]} simples · **{nb[2]} doubles** · **{nb[3]} triples**")
        be = m_["breakeven"]
        say(f"- **P(profit)** (gain ≥ coût) : **{m_['pprofit']*100:.1f} %** "
            f"→ rembourse dès **{be}/{n}** (rapport ~{rapports.get(be,0):.0f} €)" if be
            else f"- **P(profit)** : le budget dépasse le plus gros rapport estimé")
        say(f"- P(atteindre un rang, ≥ {tiers[0]}/{n}) : {m_['pge']*100:.1f} % "
            f"· espérance de gain (si modèle calibré) : ~{m_['eg']:.0f} €\n")

    grids = []
    for bud in BUDGETS:
        ch, cb, inf = optimize_ev(matchs, int(bud / UNIT), rapports)
        render(bud, ch, cb, inf)
        grids.append((bud, ch, cb, inf))

    say("---\n_Répartition doubles/triples pour MAXIMISER l'espérance de gain (Σ P(rang)×rapport − coût), "
        "avec conscience du nul (🅽). Rapports estimés par le modèle rareté-public. "
        "**P(profit)** est la mesure fiable ; l'espérance € dépend de la calibration (#4). "
        "Probas = " + src + " (via moteur-cotes → probas.json)._")
    open(os.path.join(HERE, "GRILLE-OPTIM.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")

    export_json(matchs, src, grids, rapports)


def export_json(matchs, src, grids, rapports=None):
    """Écrit lotofoot.json (racine du repo) pour la page publique lotofoot.html :
    l'analyse par match (marché vs foule) + une grille par budget."""
    n = len(matchs)
    if rapports is None:
        rapports, _ = estimate_rapports(matchs, n)
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
        mtr = grid_metrics(covs, combos, rapports, n)
        d = mtr["dist"]
        grids_json.append({
            "budget": bud, "combos": combos, "cost": combos * UNIT,
            "repartition": {"simples": nb[1], "doubles": nb[2], "triples": nb[3]},
            "stats": {"p15": d[n], "p14": d[n - 1], "p13": d[n - 2],
                      "pge13": d[n] + d[n - 1] + d[n - 2],  # P(≥ n-2), attendu par la page
                      "pReach": mtr["pge"],                # P(atteindre un rang payant, ≥ tier bas)
                      "esperance": sum(i * d[i] for i in range(n + 1)),  # espérance de bons /n
                      "pProfit": mtr["pprofit"],           # P(gain ≥ coût) — métrique honnête
                      "breakeven": mtr["breakeven"],       # rang minimal pour rembourser
                      "expectedGain": mtr["eg"]},          # E[€] (dépend de la calibration)
            "picks": picks,
        })

    tiers = paying_tiers(n)
    data = {
        "nom": json.load(open(os.path.join(HERE, "grille.json"), encoding="utf-8")).get("nom", ""),
        "source": src, "matchs": rows, "divergences": divergences, "grids": grids_json,
        "estRapports": {str(k): rapports.get(k, 0.0) for k in tiers},
    }
    json.dump(data, open(os.path.join(HERE, "..", "lotofoot.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
