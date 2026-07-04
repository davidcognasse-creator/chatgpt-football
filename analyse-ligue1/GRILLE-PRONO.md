# Prédicteur de grille Loto Foot — modèle vs foule

Grille : **Loto Foot 15 N°51** · 15 matchs

Dataset Transfermarkt : 793 clubs.

| # | Match | Modèle 1·N·2 | Foule 1·N·2 | Prono modèle | Foule | Écart |
|---|---|---|---|---|---|---|
| 1 | Paraguay–France | 40/26/34 | 8/9/82 | **1** | 2 | **+32%** |
| 2 | Canada–Maroc | 40/26/34 | 16/22/62 | **1** | 2 | **+24%** |
| 3 | Bresil–Norvege | 40/26/34 | 68/20/12 | **1** | 1 |  |
| 4 | Qingdao Hainiu–Chengdu Rongcheng | 40/26/34 | 16/14/70 | **1** | 2 | **+24%** |
| 5 | Shanghai Shenhua–Zhejiang | 40/26/34 | 73/19/8 | **1** | 1 |  |
| 6 | Gimcheon Sangmu–Jeju | 40/26/34 | 48/37/15 | **1** | 1 |  |
| 7 | FC Seoul–Incheon | 47/26/27 | 87/7/6 | **1** | 1 |  |
| 8 | Gwangju–Ulsan | 30/26/44 | 12/11/77 | **2** | 2 |  |
| 9 | Elfsborg–Hammarby | 35/26/39 | 44/30/26 | **2** | 1 | **+13%** |
| 10 | IFK Goteborg–AIK | — | 47/29/24 | _non couvert_ (AIK) | 1 | — |
| 11 | Kalmar–Orgryte | 45/26/29 | 87/7/6 | **1** | 1 |  |
| 12 | Vancouver–Inter Toronto | 43/26/31 | 72/16/12 | **1** | 1 |  |
| 13 | Atletico Ottawa–Cavalry | 40/26/34 | 51/25/24 | **1** | 1 |  |
| 14 | Supra Quebec–Forge | 40/26/34 | 12/11/76 | **1** | 2 | **+28%** |
| 15 | Barcelona SC–Deportivo Cuenca | 37/26/37 | 76/19/5 | **2** | 1 | **+32%** |

## 🎯 Divergences modèle vs foule (value potentielle)
- **Match 1 · Paraguay–France** : le modèle penche **1** (40%) alors que la foule joue **2** (82%). → value si le modèle a raison.
- **Match 2 · Canada–Maroc** : le modèle penche **1** (40%) alors que la foule joue **2** (62%). → value si le modèle a raison.
- **Match 4 · Qingdao Hainiu–Chengdu Rongcheng** : le modèle penche **1** (40%) alors que la foule joue **2** (70%). → value si le modèle a raison.
- **Match 9 · Elfsborg–Hammarby** : le modèle penche **2** (39%) alors que la foule joue **1** (44%). → value si le modèle a raison.
- **Match 14 · Supra Quebec–Forge** : le modèle penche **1** (40%) alors que la foule joue **2** (76%). → value si le modèle a raison.
- **Match 15 · Barcelona SC–Deportivo Cuenca** : le modèle penche **2** (37%) alors que la foule joue **1** (76%). → value si le modèle a raison.

---
_v1 : note d'équipe = valeur d'effectif (pas encore la compo ni les absents). Sélections nationales + ligues hors dataset = non couvertes → cascade cotes/API-Football à venir._
