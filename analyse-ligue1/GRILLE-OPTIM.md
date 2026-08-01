# Optimiseur de grille Loto Foot

Probas : **prédiction API** · 8 matchs · mise unitaire 1 € · budgets 12, 24, 48 €

**Objectif : espérance de gain (€), pas seulement la probabilité de grille parfaite.**
Rapports FDJ ESTIMÉS (modèle rareté-public, calibré sur du réel) :
| Rang | Rapport estimé | P(public l'atteint) |
|---|---|---|
| 8/8 | ~1 700 € | 0.454 % |
| 7/8 | ~107 € | 3.614 % |
| 6/8 | ~16 € | 12.364 % |

## 🎯 Grille ≤ 12 €
Combinaisons : **12** → coût **12 €** (≤ 12 €) · _plafond atteint_

| # | Match | Type | Pronostic(s) | Couverture |
|---|---|---|---|---|
| 1 | Rosenborg–Fredrikstad | DOUBLE | 1 / N | 83% |
| 2 | Randers FC–Silkeborg | simple | 1 | 47% |
| 3 | Häcken–AIK Solna | simple | 1 | 50% |
| 4 | Breidablik–Vestmannaeyjar | simple | 1 | 70% |
| 5 | KA Akureyri–Thor Akureyri | simple | 1 | 60% |
| 6 | MTK Budapest–Zalaegerszeg | simple | 1 | 60% |
| 7 | Zaglebie Lubin–Piast Gliwice | DOUBLE | 1 / N | 78% |
| 8 | FC Botosani–Rapid Bucarest | TRIPLE | 2 / N / 1 | 100% |

Répartition : 5 simples · **2 doubles** · **1 triples**
- **P(profit)** (gain ≥ coût) : **50.8 %** → rembourse dès **6/8** (rapport ~16 €)
- P(atteindre un rang, ≥ 6/8) : 50.8 % · espérance de gain (si modèle calibré) : ~88 €

## 🎯 Grille ≤ 24 €
Combinaisons : **24** → coût **24 €** (≤ 24 €) · _plafond atteint_

| # | Match | Type | Pronostic(s) | Couverture |
|---|---|---|---|---|
| 1 | Rosenborg–Fredrikstad | DOUBLE | 1 / N | 83% |
| 2 | Randers FC–Silkeborg | DOUBLE | 1 / N | 78% |
| 3 | Häcken–AIK Solna | simple | 1 | 50% |
| 4 | Breidablik–Vestmannaeyjar | simple | 1 | 70% |
| 5 | KA Akureyri–Thor Akureyri | simple | 1 | 60% |
| 6 | MTK Budapest–Zalaegerszeg | simple | 1 | 60% |
| 7 | Zaglebie Lubin–Piast Gliwice | DOUBLE | 1 / N | 78% |
| 8 | FC Botosani–Rapid Bucarest | TRIPLE | 2 / N / 1 | 100% |

Répartition : 4 simples · **3 doubles** · **1 triples**
- **P(profit)** (gain ≥ coût) : **28.9 %** → rembourse dès **7/8** (rapport ~107 €)
- P(atteindre un rang, ≥ 6/8) : 61.3 % · espérance de gain (si modèle calibré) : ~138 €

## 🎯 Grille ≤ 48 €
Combinaisons : **48** → coût **48 €** (≤ 48 €) · _plafond atteint_

| # | Match | Type | Pronostic(s) | Couverture |
|---|---|---|---|---|
| 1 | Rosenborg–Fredrikstad | DOUBLE | 1 / N | 83% |
| 2 | Randers FC–Silkeborg | DOUBLE | 1 / N | 78% |
| 3 | Häcken–AIK Solna | DOUBLE | 1 / N | 79% |
| 4 | Breidablik–Vestmannaeyjar | simple | 1 | 70% |
| 5 | KA Akureyri–Thor Akureyri | simple | 1 | 60% |
| 6 | MTK Budapest–Zalaegerszeg | simple | 1 | 60% |
| 7 | Zaglebie Lubin–Piast Gliwice | DOUBLE | 1 / N | 78% |
| 8 | FC Botosani–Rapid Bucarest | TRIPLE | 2 / N / 1 | 100% |

Répartition : 3 simples · **4 doubles** · **1 triples**
- **P(profit)** (gain ≥ coût) : **38.3 %** → rembourse dès **7/8** (rapport ~107 €)
- P(atteindre un rang, ≥ 6/8) : 70.8 % · espérance de gain (si modèle calibré) : ~207 €

---
_Répartition doubles/triples pour MAXIMISER l'espérance de gain (Σ P(rang)×rapport − coût), avec conscience du nul (🅽). Rapports estimés par le modèle rareté-public. **P(profit)** est la mesure fiable ; l'espérance € dépend de la calibration (#4). Probas = prédiction API (via moteur-cotes → probas.json)._
