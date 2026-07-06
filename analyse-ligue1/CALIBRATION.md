# Calibration & backtest du modèle Loto Foot (#4)

Échantillon : **15 matchs** sur 1 grille(s) réglée(s) — Loto Foot 15 N°51.

_⚠️ Échantillon faible (15) : indicatif. Le recalibrage ne sera appliqué qu'à ≥ 30 matchs._

## 📏 Scores (plus c'est bas, mieux c'est — sauf précision)
| Source | Log-loss | Brier | Précision (argmax) |
|---|---|---|---|
| **Modèle** (cotes+compo) | 0.839 | 0.485 | 67 % |
| Public (foule) | 0.937 | 0.542 | 53 % |
| Uniforme 1/3 | 1.099 | 0.667 | 33 % |

## 🌡️ Recalibrage par température
- T optimal = **0.7** (sous-confiant (probas à durcir)) · log-loss 0.839 → **0.820** après recalibrage.
- Règle : probas ajustées = p^(1/0.7) renormalisées, appliquées au moteur quand l'échantillon ≥ 30.

## 🎯 Fiabilité (les X % annoncés arrivent-ils X % du temps ?)
| Proba annoncée | Moyenne annoncée | Fréquence réelle | n |
|---|---|---|---|
| 0%–20% | 14 % | 8 % | 12 |
| 20%–40% | 26 % | 21 % | 19 |
| 40%–60% | 51 % | 75 % | 8 |
| 60%–80% | 68 % | 60 % | 5 |
| 80%–100% | 80 % | 100 % | 1 |

## 🥊 Modèle vs public
✅ Le modèle bat le public en log-loss (0.839 < 0.937) — meilleure info que la foule.
Précision : modèle 67 % vs public 53 %.

---
_Calibration recalculée à chaque grille réglée. Une E[€] (#3) n'est fiable que si ces probas le sont : c'est le garde-fou du système._
