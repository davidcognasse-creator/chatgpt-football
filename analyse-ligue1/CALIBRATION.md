# Calibration & backtest du modèle Loto Foot (#4)

Échantillon : **53 matchs** sur 4 grille(s) réglée(s) — Loto Foot 15 N°51, Loto Foot 15 N°52, Loto Foot 15 N°53, Loto Foot 8 N°87.

## 📏 Scores (plus c'est bas, mieux c'est — sauf précision)
| Source | Log-loss | Brier | Précision (argmax) |
|---|---|---|---|
| **Modèle** (cotes+compo) | 1.011 | 0.622 | 47 % |
| Public (foule) | 0.996 | 0.601 | 45 % |
| Uniforme 1/3 | 1.099 | 0.667 | 38 % |

## 🌡️ Recalibrage par température
- T optimal = **1.65** (SUR-confiant (probas à aplatir)) · log-loss 1.011 → **0.988** après recalibrage.
- Règle : probas ajustées = p^(1/1.65) renormalisées, appliquées au moteur quand l'échantillon ≥ 30.

## 🎯 Fiabilité (les X % annoncés arrivent-ils X % du temps ?)
| Proba annoncée | Moyenne annoncée | Fréquence réelle | n |
|---|---|---|---|
| 0%–20% | 11 % | 17 % | 46 |
| 20%–40% | 28 % | 33 % | 49 |
| 40%–60% | 48 % | 41 % | 49 |
| 60%–80% | 69 % | 50 % | 12 |
| 80%–100% | 81 % | 100 % | 3 |

## 🥊 Modèle vs public
⚠️ Le modèle ne bat pas encore le public en log-loss (1.011 ≥ 0.996) sur cet échantillon.
Précision : modèle 47 % vs public 45 %.

---
_Calibration recalculée à chaque grille réglée. Une E[€] (#3) n'est fiable que si ces probas le sont : c'est le garde-fou du système._
