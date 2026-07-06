# Moteur cotes → probas Loto Foot (marché vs foule)

Grille : **Loto Foot 8 N°87** · 8 matchs · source **API-Football**

| # | Match | Marché 1·N·2 | Foule 1·N·2 | Prono marché | Foule | Books | Écart |
|---|---|---|---|---|---|---|---|
| 1 | Portugal–Espagne | 24/27/49 | 35/30/35 | **2** | 1 | 12 | **+14%** |
| 2 | Etats-Unis–Belgique | 37/28/35 | 34/28/38 | **1** | 2 | 12 | **+3%** |
| 3 | Hacken–Djurgardens | 38/26/36 | 45/28/27 | **1** | 1 | 13 |  |
| 4 | Brommapojkarna–GAIS Goteborg | 30/28/42 | 42/29/29 | **2** | 1 | 13 | **+13%** |
| 5 | FK Suduva–FK Transinvest | — | 64/22/14 | _non coté_ | 1 | — | — |
| 6 | SK Super Nova–Ogre United | 56/24/20 | 55/25/20 | **1** | 1 | 13 |  |
| 7 | CDUC Ecuador–Mushuc Runa | — | 38/28/34 | _non coté_ | 1 | — | — |
| 8 | Keflavik–Fram Reykjavik | 29/24/48 | 45/28/27 | **2** | 1 | 13 | **+21%** |

**Couverture marché : 6/8 matchs cotés.**
_Aucun absent renseigné (absences.json) — probas = marché brut._

## 🎯 Divergences marché vs foule (value de pool)
- **Match 1 · Portugal–Espagne** : le marché voit **2** (49%) alors que la foule joue **1** (35%). → la foule sur/sous-estime, value si le marché a raison.
- **Match 2 · Etats-Unis–Belgique** : le marché voit **1** (37%) alors que la foule joue **2** (38%). → la foule sur/sous-estime, value si le marché a raison.
- **Match 4 · Brommapojkarna–GAIS Goteborg** : le marché voit **2** (42%) alors que la foule joue **1** (42%). → la foule sur/sous-estime, value si le marché a raison.
- **Match 8 · Keflavik–Fram Reykjavik** : le marché voit **2** (48%) alors que la foule joue **1** (45%). → la foule sur/sous-estime, value si le marché a raison.

---
_Cotes API-Football (dévignées, moyenne multi-books) = signal primaire ; repli sur la prédiction maison. Couche compo (🧬 XI annoncé valorisé Transfermarkt, dispo ~40 min avant) — à défaut absences presse/manuel (✎) — appliquée AVANT que le marché ne bouge : c'est l'edge du système._
