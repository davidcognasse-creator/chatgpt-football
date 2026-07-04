# Algo Ligue 1 — clé de répartition optimisée (avec cotes)

Backtest sur 3245 matchs (entraînement) + 306 matchs (test, saison 2024-25).
Poids optimisés pour minimiser le log-loss (juge correct des probabilités).

## Clé de répartition
| Critère | Poids |
|---|---|
| elo | 0.3 % |
| forme | 0.0 % |
| terrain | 0.0 % |
| poisson | 0.1 % |
| h2h | 0.0 % |
| cotes | 99.6 % |

## Performance (saison test)
| Modèle | log-loss | Brier | exactitude |
|---|---|---|---|
| **Clé optimisée** | **0.9494** | 0.5609 | 54.9 % |
| elo seul | 0.9790 | 0.5801 | 54.6 % |
| forme seul | 1.0871 | 0.6092 | 53.3 % |
| terrain seul | 1.0219 | 0.6115 | 52.9 % |
| poisson seul | 0.9961 | 0.5929 | 53.9 % |
| h2h seul | 1.0642 | 0.6509 | 45.6 % |
| cotes seul | 0.9814 | 0.5832 | 52.1 % |

_Repère : hasard = log-loss 1.0986. Plus c'est bas, mieux c'est._
