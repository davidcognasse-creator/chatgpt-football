# Calibration & backtest du modèle Loto Foot (#4)

Échantillon : **30 matchs** sur 2 grille(s) réglée(s) — Loto Foot 15 N°51, Loto Foot 15 N°52.

## 📏 Scores (plus c'est bas, mieux c'est — sauf précision)
| Source | Log-loss | Brier | Précision (argmax) |
|---|---|---|---|
| **Modèle** (cotes+compo) | 0.888 | 0.552 | 57 % |
| Public (foule) | 0.963 | 0.571 | 50 % |
| Uniforme 1/3 | 1.099 | 0.667 | 43 % |

## 🌡️ Recalibrage par température
- T optimal = **1.1** (SUR-confiant (probas à aplatir)) · log-loss 0.888 → **0.887** après recalibrage.
- Règle : probas ajustées = p^(1/1.1) renormalisées, appliquées au moteur quand l'échantillon ≥ 30.

## 🎯 Fiabilité (les X % annoncés arrivent-ils X % du temps ?)
| Proba annoncée | Moyenne annoncée | Fréquence réelle | n |
|---|---|---|---|
| 0%–20% | 10 % | 11 % | 27 |
| 20%–40% | 27 % | 29 % | 28 |
| 40%–60% | 51 % | 50 % | 26 |
| 60%–80% | 71 % | 57 % | 7 |
| 80%–100% | 81 % | 100 % | 2 |

## 🥊 Modèle vs public
✅ Le modèle bat le public en log-loss (0.888 < 0.963) — meilleure info que la foule.
Précision : modèle 57 % vs public 50 %.

---
_Calibration recalculée à chaque grille réglée. Une E[€] (#3) n'est fiable que si ces probas le sont : c'est le garde-fou du système._
