# Algo Ligue 1 — clé de répartition optimisée (sans cotes)

Backtest sur 3245 matchs (entraînement) + 306 matchs (test, saison 2024-25).
Poids optimisés pour minimiser le log-loss (juge correct des probabilités).

## Clé de répartition
| Critère | Poids |
|---|---|
| elo | 60.7 % |
| forme | 0.0 % |
| terrain | 25.1 % |
| poisson | 8.1 % |
| h2h | 6.1 % |

## Performance (saison test)
| Modèle | log-loss | Brier | exactitude |
|---|---|---|---|
| **Clé optimisée** | **0.9739** | 0.5776 | 53.6 % |
| elo seul | 0.9790 | 0.5801 | 54.6 % |
| forme seul | 1.0871 | 0.6092 | 53.3 % |
| terrain seul | 1.0219 | 0.6115 | 52.9 % |
| poisson seul | 0.9961 | 0.5929 | 53.9 % |
| h2h seul | 1.0642 | 0.6509 | 45.6 % |

_Repère : hasard = log-loss 1.0986. Plus c'est bas, mieux c'est._
