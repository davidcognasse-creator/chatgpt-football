# Ligue 1 — patterns domicile / extérieur (11 saisons, 2014‑15 → 2024‑25)

**Source :** [openfootball/football.json](https://github.com/openfootball/football.json) (données ouvertes, gratuites).
**Échantillon :** 3 931 matchs joués sur 11 saisons.
**Reproductible :** `python3 analyse-ligue1.py`

---

## 1. L'avantage du terrain est réel et stable

| Issue | Fréquence |
|---|---|
| Victoire **à domicile** | **44,0 %** |
| Match nul | 25,4 % |
| Victoire **à l'extérieur** | 30,6 % |

- Une équipe gagne **13,3 points de %** de matchs en plus à domicile qu'à l'extérieur.
- Les équipes marquent **1,49 but/match à domicile** contre **1,19 à l'extérieur** (+0,30 but).

## 2. L'effet « huis clos » COVID est visible

% de victoires à domicile par saison :

| Saison | % dom | Note |
|---|---|---|
| 2014‑15 | 47,6 % | |
| 2016‑17 | 48,9 % | pic |
| 2019‑20 | 48,0 % | saison écourtée COVID |
| **2020‑21** | **37,4 %** | **stades vides toute la saison → avantage domicile qui s'effondre** |
| 2023‑24 | 39,2 % | |
| 2024‑25 | 46,7 % | retour à la normale |

👉 **2020‑21 (huis clos généralisé) est la seule saison sous 38 %** : sans public, l'avantage du terrain chute d'environ **10 points**. C'est l'une des démonstrations « grandeur nature » les plus nettes de l'effet du public sur la performance.

## 3. Les forteresses (meilleur % à domicile)

| Club | % victoires domicile |
|---|---|
| Paris Saint‑Germain | **78,9 %** (131/166) |
| Olympique Lyonnais | 58,8 % |
| AS Monaco | 57,2 % |
| Lille OSC | 54,2 % |
| Olympique Marseille | 53,6 % |
| Stade Rennais | 52,4 % |

## 4. Les meilleurs voyageurs (meilleur % à l'extérieur)

| Club | % victoires extérieur |
|---|---|
| Paris Saint‑Germain | **66,1 %** |
| AS Monaco | 47,0 % |
| Olympique Marseille | 44,6 % |
| Olympique Lyonnais | 44,3 % |

Le PSG est le seul club à gagner **plus souvent à l'extérieur (66 %)** que la plupart des autres à domicile — un niveau de domination atypique.

## 5. Les plus dépendants de leur stade (écart dom − ext le plus grand)

| Club | Domicile | Extérieur | Écart |
|---|---|---|---|
| Dijon FCO | 34,4 % | 11,1 % | **+23,3 pts** |
| Stade Rennais | 52,4 % | 31,3 % | +21,1 pts |
| EA Guingamp | 40,0 % | 20,0 % | +20,0 pts |
| FC Lorient | 37,4 % | 19,1 % | +18,3 pts |
| Lille OSC | 54,2 % | 36,2 % | +18,0 pts |

Ces clubs (souvent des équipes de milieu/bas de tableau avec un stade « chaud ») tirent une part énorme de leurs points à domicile → **value potentielle sur leurs matchs à domicile, prudence à l'extérieur**.

## 6. Les plus réguliers (petit écart dom − ext)

| Club | Domicile | Extérieur | Écart |
|---|---|---|---|
| ESTAC Troyes | 18,4 % | 14,5 % | +3,9 pts |
| FC Metz | 25,4 % | 20,6 % | +4,8 pts |
| Olympique Marseille | 53,6 % | 44,6 % | +9,0 pts |

---

## Pistes d'exploitation (à backtester, pas un conseil de pari)

1. **Effet public** : intégrer « stade plein vs huis clos / affluence » comme variable — l'impact vaut ~10 pts.
2. **Clubs à fort écart dom‑ext** (Dijon, Rennes, Lorient…) : leurs cotes à domicile pourraient être sous‑évaluées, à l'extérieur sur‑évaluées.
3. **Le nul reste à ~25 %** : rarement rentable en value sauf marché spécifique.

> ⚠️ Analyse descriptive sur données passées. Le passé ne garantit pas le futur, et un pattern connu est souvent déjà intégré dans les cotes.
