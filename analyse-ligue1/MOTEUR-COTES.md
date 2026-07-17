# Moteur cotes → probas Loto Foot (marché vs foule)

Grille : **Loto Foot 15 N°55** · 15 matchs · source **API-Football**

| # | Match | Marché 1·N·2 | Foule 1·N·2 | Prono marché | Foule | Books | Écart |
|---|---|---|---|---|---|---|---|
| 1 | Espagne–Argentine | 38/32/30 | 38/32/30 | **1** | 1 | 12 |  |
| 2 | Pet.Ploiesti–DinamoBucarest | — | 18/22/60 | _non coté_ | 2 | — | — |
| 3 | Universit Cluj–FC Constanta | — | 59/21/20 | _non coté_ | 1 | — | — |
| 4 | Aluminij–NK Maribor | 26/27/46 | 24/28/48 | **2** | 2 | 11 |  |
  _(résolution Halmstads–Häcken : API errors: {'rateLimit': 'Too many requests. You have exceeded the limit of requests per minute of your subscription.'})_
| 5 | Halmstads–Häcken | — | 31/25/44 | _non coté_ | 2 | — | — |
| 6 | Hammarby–Degerfors IF | 42/42/17 | 74/15/11 | **1** | 1 | préd. |  |
| 7 | Elfsborg–IK Sirius FK | 17/42/42 | 49/21/30 | **N** | 1 | préd. | **+21%** |
  _(résolution FF Jaro–Inter Turku : API errors: {'rateLimit': 'Too many requests. You have exceeded the limit of requests per minute of your subscription.'})_
| 8 | FF Jaro–Inter Turku | — | 24/25/51 | _non coté_ | 2 | — | — |
  _(résolution FC Anyang–Gwangju FC : API errors: {'rateLimit': 'Too many requests. You have exceeded the limit of requests per minute of your subscription.'})_
| 9 | FC Anyang–Gwangju FC | — | 48/25/27 | _non coté_ | 1 | — | — |
| 10 | Bucheon FC–FC Seoul | 17/42/42 | 21/27/52 | **N** | 2 | préd. | **+15%** |
  _(résolution Queretaro FC–Club America : API errors: {'rateLimit': 'Too many requests. You have exceeded the limit of requests per minute of your subscription.'})_
| 11 | Queretaro FC–Club America | — | 37/28/35 | _non coté_ | 1 | — | — |
| 12 | Monterrey–Santos Laguna | 50/50/0 | 74/15/11 | **1** | 1 | préd. |  |
| 13 | UNAM Pumas–CF Pachuca | 0/50/50 | 55/25/20 | **N** | 1 | préd. | **+25%** |
  _(résolution LDU Quito–FC Leones : API errors: {'rateLimit': 'Too many requests. You have exceeded the limit of requests per minute of your subscription.'})_
| 14 | LDU Quito–FC Leones | — | 64/21/15 | _non coté_ | 1 | — | — |
| 15 | France–Angleterre | 43/28/29 | 42/29/29 | **1** | 1 | 13 |  |

**Couverture marché : 8/15 matchs cotés.**
_Aucun absent renseigné (absences.json) — probas = marché brut._

## 🎯 Divergences marché vs foule (value de pool)
- **Match 7 · Elfsborg–IK Sirius FK** : le marché voit **N** (42%) alors que la foule joue **1** (49%). → la foule sur/sous-estime, value si le marché a raison.
- **Match 10 · Bucheon FC–FC Seoul** : le marché voit **N** (42%) alors que la foule joue **2** (52%). → la foule sur/sous-estime, value si le marché a raison.
- **Match 13 · UNAM Pumas–CF Pachuca** : le marché voit **N** (50%) alors que la foule joue **1** (55%). → la foule sur/sous-estime, value si le marché a raison.

---
_Cotes API-Football (dévignées, moyenne multi-books) = signal primaire ; repli sur la prédiction maison. Couche compo (🧬 XI annoncé valorisé Transfermarkt, dispo ~40 min avant) — à défaut absences presse/manuel (✎) — appliquée AVANT que le marché ne bouge : c'est l'edge du système._
