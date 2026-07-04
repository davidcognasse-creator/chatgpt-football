# Ligue 1 — chasse aux biais du marché (3093 matchs avec cotes)

Tout est mesuré vs la proba IMPLICITE (marge retirée). Écart = réel − implicite.

## 1. Calibration (biais favori-outsider)
| Tranche implicite | n | implicite | réel | écart |
|---|---|---|---|---|
| 0-10% | 276 | 7.3% | 5.8% | -1.6 pts |
| 10-20% | 1206 | 15.8% | 15.4% | -0.4 pts |
| 20-35% | 4681 | 27.4% | 27.1% | -0.4 pts |
| 35-50% | 1722 | 42.1% | 43.5% | +1.4 pts |
| 50-65% | 886 | 56.4% | 55.3% | -1.1 pts |
| 65-80% | 414 | 71.0% | 73.7% | +2.7 pts |
| 80-101% | 94 | 84.0% | 85.1% | +1.1 pts |

_Écart négatif sur les petites probas = outsiders surcotés (biais classique)._

## 2. Effet des séries de victoires (à domicile)
| Série en cours | n | implicite | réel | écart |
|---|---|---|---|---|
| 0 victoires | 2080 | 41.6% | 41.3% | -0.3 pts |
| 1-2 victoires | 815 | 46.1% | 45.5% | -0.6 pts |
| 3+ victoires | 198 | 61.1% | 56.6% | -4.6 pts |

## 2. Effet des séries de victoires (à l'extérieur)
| Série en cours | n | implicite | réel | écart |
|---|---|---|---|---|
| 0 victoires | 1797 | 27.6% | 29.0% | +1.4 pts |
| 1-2 victoires | 1064 | 31.2% | 31.1% | -0.1 pts |
| 3+ victoires | 232 | 45.4% | 43.5% | -1.9 pts |

## 3. ROI de règles simples (aux cotes réelles)
| Règle | n paris | gagnés | ROI |
|---|---|---|---|
| Toujours le favori | 3093 | 1620 | -2.8% |
| Favori net (implicite > 60%) | 711 | 513 | -2.4% |
| Fader l'équipe dom. en série 3+ | 198 | 33 | -23.7% |
| Fader l'équipe ext. en série 3+ | 232 | 74 | +5.7% |
| Toujours le nul | 3093 | 798 | -5.5% |
| Outsider dom. (implicite < 25%) | 406 | 66 | -11.5% |

_ROI ≈ 0 attendu si le marché est efficace ; un ROI nettement > 0, stable, serait un vrai edge (rare, à confirmer hors échantillon)._
