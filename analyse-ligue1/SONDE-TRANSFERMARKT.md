# Sonde Transfermarkt — valeur marchande par joueur → note d'équipe

✅ Dataset chargé : 48380 joueurs.

## Ligue 1 (FR1) : 36 clubs, 1969 joueurs valorisés

## Couverture par compétition (top 12) — utile pour les grilles multi-ligues
| Compétition | joueurs valorisés |
|---|---|
| TR1 | 2994 |
| IT1 | 2985 |
| GR1 | 2504 |
| PO1 | 2399 |
| RU1 | 2121 |
| ES1 | 2047 |
| NL1 | 2029 |
| GB1 | 1973 |
| FR1 | 1969 |
| BE1 | 1931 |
| UKR1 | 1895 |
| SC1 | 1843 |

## Exemple de NOTE D'ÉQUIPE (somme du top-11 par valeur)
- **Paris Saint-Germain Football Club** : note d'équipe (top-11) = **1070 M€**
    - Vitinha (Midfield) : 140 M€
    - Khvicha Kvaratskhelia (Attack) : 140 M€
    - João Neves (Midfield) : 140 M€
    - Désiré Doué (Attack) : 120 M€
    - Ousmane Dembélé (Attack) : 100 M€
    - Achraf Hakimi (Defender) : 80 M€
    - … Retirer la star (‑140 M€) ferait chuter la note → c'est l'edge compo.

---
Verdict : si ✅, la valeur marchande sert de note par joueur ; on somme le XI annoncé (API-Football).
