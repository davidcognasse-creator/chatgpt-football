# Note d'équipe (valeur Transfermarkt) → probas 1·N·2

Clubs valorisés : 34 · matchs d'historique : 992

## Paramètres calibrés
- élasticité valeur γ = **0.6** · avantage terrain × **1.35** · prior nul = **0.26**
- Performance : log-loss **1.0135** · exactitude **51.3%** · sur 818 matchs
- Repère : hasard = 1.0986. (L'algo Ligue 1 « cotes » faisait ~0.95.)

## Exemple — 8 derniers matchs (proba modèle vs réel)
| Match | 1 | N | 2 | Réel |
|---|---|---|---|---|
| AS Monaco FC–Olympique Lyonnais | 43% | 26% | 31% | 2-0 (1) |
| Olympique Lyonnais–Angers SCO | 53% | 26% | 21% | 2-0 (1) |
| OGC Nice–Stade Brestois 29 | 47% | 26% | 27% | 6-0 (1) |
| AS Saint-Étienne–Toulouse FC | 29% | 26% | 45% | 2-3 (2) |
| Lille OSC–Stade de Reims | 57% | 26% | 17% | 2-1 (1) |
| RC Strasbourg Alsace–Le Havre AC | 56% | 26% | 18% | 2-3 (2) |
| FC Nantes–Montpellier HSC | 52% | 26% | 22% | 3-0 (1) |
| Racing Club de Lens–AS Monaco FC | 35% | 26% | 39% | 4-0 (1) |

---
Prochaines étapes : valeur sur le XI annoncé (API-Football) − absents (presse/X), puis blend cotes/Elo + biais séries.
