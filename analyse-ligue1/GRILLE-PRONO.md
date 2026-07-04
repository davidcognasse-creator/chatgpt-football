# Prédicteur de grille Loto Foot — modèle vs foule

Grille : **Loto Foot 15 N°51** · 15 matchs

Dataset Transfermarkt : 793 clubs.

| # | Match | Modèle 1·N·2 | Foule 1·N·2 | Prono modèle | Foule | Écart |
|---|---|---|---|---|---|---|
| 1 | Paraguay–France | — | 8/9/82 | _non couvert_ (Paraguay) | 2 | — |
| 2 | Canada–Maroc | — | 16/22/62 | _non couvert_ (Canada) | 2 | — |
| 3 | Bresil–Norvege | — | 68/20/12 | _non couvert_ (Bresil) | 1 | — |
| 4 | Qingdao Hainiu–Chengdu Rongcheng | — | 16/14/70 | _non couvert_ (Qingdao Hainiu) | 2 | — |
| 5 | Shanghai Shenhua–Zhejiang | — | 73/19/8 | _non couvert_ (Shanghai Shenhua) | 1 | — |
| 6 | Gimcheon Sangmu–Jeju | 40/26/34 | 48/37/15 | **1** | 1 |  |
| 7 | FC Seoul–Incheon | 47/26/27 | 87/7/6 | **1** | 1 |  |
| 8 | Gwangju–Ulsan | 30/26/44 | 12/11/77 | **2** | 2 |  |
| 9 | Elfsborg–Hammarby | 35/26/39 | 44/34/22 | **2** | 1 | **+17%** |
| 10 | IFK Goteborg–AIK | — | 47/35/18 | _non couvert_ (AIK) | 1 | — |
| 11 | Kalmar–Orgryte | 45/26/29 | 88/7/5 | **1** | 1 |  |
| 12 | Vancouver–Inter Toronto | — | 73/15/12 | _non couvert_ (Inter Toronto) | 1 | — |
| 13 | Atletico Ottawa–Cavalry | — | 51/25/24 | _non couvert_ (Atletico Ottawa) | 1 | — |
| 14 | Supra Quebec–Forge | — | 12/11/76 | _non couvert_ (Supra Quebec) | 2 | — |
| 15 | Barcelona SC–Deportivo Cuenca | — | 76/19/5 | _non couvert_ (Deportivo Cuenca) | 1 | — |

## 🎯 Divergences modèle vs foule (value potentielle)
- **Match 9 · Elfsborg–Hammarby** : le modèle penche **2** (39%) alors que la foule joue **1** (44%). → value si le modèle a raison.

---
_v1 : note d'équipe = valeur d'effectif (pas encore la compo ni les absents). Sélections nationales + ligues hors dataset = non couvertes → cascade cotes/API-Football à venir._
