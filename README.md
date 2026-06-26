# IA Pronostics · Coupe du Monde 2026

Un site statique au design moderne qui affiche les **pronostics générés par IA**
pour les prochains matchs de la Coupe du Monde 2026 : probabilités de victoire,
score attendu, indice de confiance et une courte analyse pour chaque rencontre.

## Aperçu des fonctionnalités

- 🎯 Carte par match avec probabilités **Victoire / Nul / Défaite** (barre visuelle)
- 🔢 Score prédit par le modèle et indice de confiance
- 🧠 Analyse textuelle courte pour chaque rencontre
- 🔎 Filtrage par phase + recherche par équipe
- 📱 Design responsive, sombre, sans dépendance (HTML/CSS/JS pur)

## Lancer le site

Aucune installation. Ouvrez simplement `index.html` dans un navigateur, ou
servez le dossier :

```bash
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

## Mettre à jour les pronostics

Toutes les données vivent dans **`data.js`** (`window.WC_DATA`). Chaque match a la
forme suivante :

```js
{
  id: "m1",
  stage: "Huitièmes",
  datetime: "2026-06-28T19:00:00Z",   // ISO 8601 (UTC)
  venue: "MetLife Stadium, New York",
  home: { name: "France", flag: "🇫🇷", code: "FRA" },
  away: { name: "Sénégal", flag: "🇸🇳", code: "SEN" },
  probs: { home: 56, draw: 24, away: 20 }, // somme = 100
  predictedScore: { home: 2, away: 1 },
  confidence: 72,                          // 0–100
  analysis: "…"
}
```

Pour brancher de vraies prédictions, remplacez le tableau `matches` par la sortie
de votre modèle ou d'une API, en conservant le même format.

## Avertissement

Les pronostics sont **générés à des fins d'illustration et de divertissement**.
Ils ne constituent pas un conseil de pari.
