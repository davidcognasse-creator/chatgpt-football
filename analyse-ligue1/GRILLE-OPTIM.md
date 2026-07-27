# Optimiseur de grille Loto Foot

Probas : **foule (non coté)** · 8 matchs · mise unitaire 1 € · budgets 12, 24, 48 €

**Objectif : espérance de gain (€), pas seulement la probabilité de grille parfaite.**
Rapports FDJ ESTIMÉS (modèle rareté-public, calibré sur du réel) :
| Rang | Rapport estimé | P(public l'atteint) |
|---|---|---|
| 8/8 | ~1 824 € | 0.423 % |
| 7/8 | ~111 € | 3.483 % |
| 6/8 | ~16 € | 12.258 % |

## 🎯 Grille ≤ 12 €
Combinaisons : **12** → coût **12 €** (≤ 12 €) · _plafond atteint_

| # | Match | Type | Pronostic(s) | Couverture |
|---|---|---|---|---|
| 1 | Rosenborg–Fredrikstad | simple | 1 | 85% |
| 2 | Randers FC–Silkeborg | DOUBLE | 1 / N | 78% |
| 3 | Häcken–AIK Solna | simple | 1 | 50% |
| 4 | Breidablik–Vestmannaeyjar | simple | 1 | 45% |
| 5 | KA Akureyri–Thor Akureyri | simple | 1 | 45% |
| 6 | MTK Budapest–Zalaegerszeg | simple | 1 | 60% |
| 7 | Zaglebie Lubin–Piast Gliwice | DOUBLE | 1 / N | 78% |
| 8 | FC Botosani–Rapid Bucarest | TRIPLE | 2 / 1 / N | 100% |

Répartition : 5 simples · **2 doubles** · **1 triples**
- **P(profit)** (gain ≥ coût) : **48.3 %** → rembourse dès **6/8** (rapport ~16 €)
- P(atteindre un rang, ≥ 6/8) : 48.3 % · espérance de gain (si modèle calibré) : ~80 €

## 🎯 Grille ≤ 24 €
Combinaisons : **24** → coût **24 €** (≤ 24 €) · _plafond atteint_

| # | Match | Type | Pronostic(s) | Couverture |
|---|---|---|---|---|
| 1 | Rosenborg–Fredrikstad | simple | 1 | 85% |
| 2 | Randers FC–Silkeborg | DOUBLE | 1 / N | 78% |
| 3 | Häcken–AIK Solna | simple | 1 | 50% |
| 4 | Breidablik–Vestmannaeyjar | simple | 1 | 45% |
| 5 | KA Akureyri–Thor Akureyri | DOUBLE | 1 / 2 | 73% |
| 6 | MTK Budapest–Zalaegerszeg | simple | 1 | 60% |
| 7 | Zaglebie Lubin–Piast Gliwice | DOUBLE | 1 / N | 78% |
| 8 | FC Botosani–Rapid Bucarest | TRIPLE | 2 / 1 / N | 100% |

Répartition : 4 simples · **3 doubles** · **1 triples**
- **P(profit)** (gain ≥ coût) : **25.6 %** → rembourse dès **7/8** (rapport ~111 €)
- P(atteindre un rang, ≥ 6/8) : 58.0 % · espérance de gain (si modèle calibré) : ~121 €

## 🎯 Grille ≤ 48 €
Combinaisons : **48** → coût **48 €** (≤ 48 €) · _plafond atteint_

| # | Match | Type | Pronostic(s) | Couverture |
|---|---|---|---|---|
| 1 | Rosenborg–Fredrikstad | simple | 1 | 85% |
| 2 | Randers FC–Silkeborg | DOUBLE | 1 / N | 78% |
| 3 | Häcken–AIK Solna | simple | 1 | 50% |
| 4 | Breidablik–Vestmannaeyjar | DOUBLE | 1 / 2 | 73% |
| 5 | KA Akureyri–Thor Akureyri | DOUBLE | 1 / 2 | 73% |
| 6 | MTK Budapest–Zalaegerszeg | simple | 1 | 60% |
| 7 | Zaglebie Lubin–Piast Gliwice | DOUBLE | 1 / N | 78% |
| 8 | FC Botosani–Rapid Bucarest | TRIPLE | 2 / 1 / N | 100% |

Répartition : 3 simples · **4 doubles** · **1 triples**
- **P(profit)** (gain ≥ coût) : **34.3 %** → rembourse dès **7/8** (rapport ~111 €)
- P(atteindre un rang, ≥ 6/8) : 67.3 % · espérance de gain (si modèle calibré) : ~185 €

---
_Répartition doubles/triples pour MAXIMISER l'espérance de gain (Σ P(rang)×rapport − coût), avec conscience du nul (🅽). Rapports estimés par le modèle rareté-public. **P(profit)** est la mesure fiable ; l'espérance € dépend de la calibration (#4). Probas = foule (non coté) (via moteur-cotes → probas.json)._
