# Calibration & backtest du modèle Loto Foot (#4)

Échantillon : **45 matchs** sur 3 grille(s) réglée(s) — Loto Foot 15 N°51, Loto Foot 15 N°52, Loto Foot 15 N°53.

## 📏 Scores (plus c'est bas, mieux c'est — sauf précision)
| Source | Log-loss | Brier | Précision (argmax) |
|---|---|---|---|
| **Modèle** (cotes+compo) | 0.962 | 0.594 | 53 % |
| Public (foule) | 0.950 | 0.568 | 51 % |
| Uniforme 1/3 | 1.099 | 0.667 | 44 % |

## 🌡️ Recalibrage par température
- T optimal = **1.4** (SUR-confiant (probas à aplatir)) · log-loss 0.962 → **0.951** après recalibrage.
- Règle : probas ajustées = p^(1/1.4) renormalisées, appliquées au moteur quand l'échantillon ≥ 30.

## 🎯 Fiabilité (les X % annoncés arrivent-ils X % du temps ?)
| Proba annoncée | Moyenne annoncée | Fréquence réelle | n |
|---|---|---|---|
| 0%–20% | 11 % | 16 % | 43 |
| 20%–40% | 27 % | 31 % | 36 |
| 40%–60% | 49 % | 43 % | 42 |
| 60%–80% | 70 % | 55 % | 11 |
| 80%–100% | 81 % | 100 % | 3 |

## 🥊 Modèle vs public
⚠️ Le modèle ne bat pas encore le public en log-loss (0.962 ≥ 0.950) sur cet échantillon.
Précision : modèle 53 % vs public 51 %.

---
_Calibration recalculée à chaque grille réglée. Une E[€] (#3) n'est fiable que si ces probas le sont : c'est le garde-fou du système._
