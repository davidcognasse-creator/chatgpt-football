#!/usr/bin/env python3
"""
Backtest & calibration du modèle Loto Foot (#4).

Joint les probas archivées (lotofoot-*.json : matchs[].p) aux résultats réels
figés (bilan.reels) et mesure la QUALITÉ des probabilités :
  - log-loss (cross-entropy) et score de Brier — le modèle est-il précis ?
  - courbe de fiabilité (reliability) — les 70 % annoncés arrivent-ils 70 % du temps ?
  - température T de recalibrage (p^(1/T) renormalisé) minimisant la log-loss :
      T>1 ⇒ modèle SUR-confiant (à aplatir) ; T<1 ⇒ sous-confiant.
  - comparaison MODÈLE vs PUBLIC (foule) vs uniforme — bat-on vraiment la foule ?

C'est ce qui rend l'espérance en € (#3) digne de confiance : une E[€] n'a de sens
que si les P(rang) sont calibrées. Écrit CALIBRATION.md + calibration.json (T
recommandé, exposé au moteur/optimiseur quand l'échantillon sera suffisant).

Sans clé ni réseau : lit uniquement des fichiers du repo.
"""
import glob
import json
import math
import os

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, "..")
OUT = ["1", "N", "2"]
EPS = 1e-12

L = []
def say(s): L.append(s); print(s)


def load_samples():
    """[(probs_modele, foule_norm, reel, meta), ...] sur toutes les grilles réglées."""
    samples = []
    for f in sorted(glob.glob(os.path.join(ROOT, "lotofoot*.json"))):
        try:
            d = json.load(open(f, encoding="utf-8"))
        except Exception:
            continue
        reels = {r["i"]: r.get("reel") for r in ((d.get("bilan") or {}).get("reels") or [])}
        if not reels or not d.get("matchs"):
            continue
        for m in d["matchs"]:
            a = reels.get(m.get("i"))
            if a not in OUT or "p" not in m:
                continue
            p = {k: float(m["p"].get(k, 0)) for k in OUT}
            fo = m.get("foule") or {}
            ft = sum(fo.get(k, 0) for k in OUT) or 1
            foule = {k: fo.get(k, 0) / ft for k in OUT}
            samples.append((p, foule, a, {"grille": d.get("nom", f), "match": f"{m.get('dom')}-{m.get('ext')}"}))
    return samples


def temper(p, T):
    """Recalibrage par température : p^(1/T) renormalisé."""
    if T == 1:
        return p
    q = {k: max(EPS, p[k]) ** (1.0 / T) for k in OUT}
    s = sum(q.values()) or 1
    return {k: q[k] / s for k in OUT}


def logloss(samples, pick, T=1.0):
    return sum(-math.log(max(EPS, temper(pick(s), T)[s[2]])) for s in samples) / len(samples)


def brier(samples, pick):
    tot = 0.0
    for s in samples:
        p = pick(s)
        tot += sum((p[k] - (1.0 if k == s[2] else 0.0)) ** 2 for k in OUT)
    return tot / len(samples)


def accuracy(samples, pick):
    return sum(1 for s in samples if max(OUT, key=lambda k: pick(s)[k]) == s[2]) / len(samples)


def best_temperature(samples, pick):
    """T ∈ [0.5, 3.0] minimisant la log-loss (pas de 0.05)."""
    best = (1.0, logloss(samples, pick, 1.0))
    T = 0.5
    while T <= 3.0001:
        ll = logloss(samples, pick, T)
        if ll < best[1]:
            best = (round(T, 2), ll)
        T += 0.05
    return best


def reliability(samples, pick, bins=5):
    """Bacs one-vs-all : (borne, proba moyenne annoncée, fréquence observée, n)."""
    buckets = [[] for _ in range(bins)]
    for s in samples:
        p = pick(s)
        for k in OUT:
            b = min(bins - 1, int(p[k] * bins))
            buckets[b].append((p[k], 1.0 if k == s[2] else 0.0))
    rows = []
    for b, pts in enumerate(buckets):
        if not pts:
            continue
        avg_p = sum(x for x, _ in pts) / len(pts)
        obs = sum(y for _, y in pts) / len(pts)
        rows.append((f"{b/bins:.0%}–{(b+1)/bins:.0%}", avg_p, obs, len(pts)))
    return rows


def main():
    say("# Calibration & backtest du modèle Loto Foot (#4)\n")
    samples = load_samples()
    n = len(samples)
    if not n:
        say("_Aucune grille réglée avec probas + résultats. Le backtest s'enrichira à mesure "
            "que les grilles se terminent (bilan.reels dans lotofoot-*.json)._")
        return finish({"n": 0})

    grilles = sorted({s[3]["grille"] for s in samples})
    say(f"Échantillon : **{n} matchs** sur {len(grilles)} grille(s) réglée(s) — {', '.join(grilles)}.\n")
    if n < 30:
        say(f"_⚠️ Échantillon faible ({n}) : indicatif. Le recalibrage ne sera appliqué qu'à ≥ 30 matchs._\n")

    model = lambda s: s[0]
    crowd = lambda s: s[1]
    unif = lambda s: {"1": 1/3, "N": 1/3, "2": 1/3}

    say("## 📏 Scores (plus c'est bas, mieux c'est — sauf précision)")
    say("| Source | Log-loss | Brier | Précision (argmax) |")
    say("|---|---|---|---|")
    for name, pk in (("**Modèle** (cotes+compo)", model), ("Public (foule)", crowd), ("Uniforme 1/3", unif)):
        say(f"| {name} | {logloss(samples, pk):.3f} | {brier(samples, pk):.3f} | {accuracy(samples, pk)*100:.0f} % |")
    say("")

    T, llT = best_temperature(samples, model)
    ll1 = logloss(samples, model)
    verdict = ("SUR-confiant (probas à aplatir)" if T > 1.05
               else "sous-confiant (probas à durcir)" if T < 0.95
               else "déjà bien calibré")
    say("## 🌡️ Recalibrage par température")
    say(f"- T optimal = **{T}** ({verdict}) · log-loss {ll1:.3f} → **{llT:.3f}** après recalibrage.")
    say(f"- Règle : probas ajustées = p^(1/{T}) renormalisées, appliquées au moteur quand l'échantillon ≥ 30.\n")

    say("## 🎯 Fiabilité (les X % annoncés arrivent-ils X % du temps ?)")
    say("| Proba annoncée | Moyenne annoncée | Fréquence réelle | n |")
    say("|---|---|---|---|")
    for lab, ap, obs, cnt in reliability(samples, model):
        say(f"| {lab} | {ap*100:.0f} % | {obs*100:.0f} % | {cnt} |")

    say("\n## 🥊 Modèle vs public")
    dm, dc = logloss(samples, model), logloss(samples, crowd)
    if dm < dc:
        say(f"✅ Le modèle bat le public en log-loss ({dm:.3f} < {dc:.3f}) — meilleure info que la foule.")
    else:
        say(f"⚠️ Le modèle ne bat pas encore le public en log-loss ({dm:.3f} ≥ {dc:.3f}) sur cet échantillon.")
    say(f"Précision : modèle {accuracy(samples, model)*100:.0f} % vs public {accuracy(samples, crowd)*100:.0f} %.")

    say("\n---\n_Calibration recalculée à chaque grille réglée. Une E[€] (#3) n'est fiable "
        "que si ces probas le sont : c'est le garde-fou du système._")
    finish({
        "n": n, "grilles": grilles,
        "logloss": {"model": ll1, "crowd": dc, "uniform": logloss(samples, unif)},
        "brier": {"model": brier(samples, model), "crowd": brier(samples, crowd)},
        "accuracy": {"model": accuracy(samples, model), "crowd": accuracy(samples, crowd)},
        "temperature": {"T": T, "logloss_before": ll1, "logloss_after": llT,
                        "apply": n >= 30},
    })


def finish(summary):
    open(os.path.join(HERE, "CALIBRATION.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
    # calibration.json à la racine (page publique) ET dans analyse-ligue1 (moteur/optimiseur).
    for path in (os.path.join(ROOT, "calibration.json"), os.path.join(HERE, "calibration.json")):
        json.dump(summary, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
