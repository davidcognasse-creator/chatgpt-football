# IA Pronostics · Coupe du Monde 2026

Site statique au design moderne affichant les **pronostics IA** des matchs à venir
du Mondial 2026. Les prédictions proviennent d'un **fichier de données (`data.json`)**
qu'un **robot actualise** en agrégeant **5 sources** pondérées.

```
 sources  ──►  robot/update.mjs  ──►  data.json + data.js  ──►  site (index.html)
              (agrégation pondérée)    (fichier canonique)        (affichage)
```

## Les 5 sources agrégées

| Source | Signal | Poids | Données (mode live) | Clé |
|--------|--------|:-----:|---------------------|-----|
| **Paris** | cotes des bookmakers (dévignées, consensus) | 0.42 | The Odds API | `ODDS_API_KEY` (gratuit) |
| **Forme** | 5 derniers résultats de chaque équipe | 0.18 | football-data.org | `FOOTBALL_DATA_KEY` (gratuit) |
| **Face-à-face** | historique des confrontations | 0.12 | football-data.org | `FOOTBALL_DATA_KEY` (gratuit) |
| **Presse** | volume + tonalité des articles | 0.16 | GDELT | aucune |
| **Public** | buzz / intérêt par équipe | 0.12 | API X *ou* pages vues Wikipédia | `X_BEARER_TOKEN` (option) |

Les 5 vecteurs `{victoire, nul, défaite}` sont combinés par **moyenne pondérée**
(poids dans `robot/config.json`). Les poids se **renormalisent** sur les sources
réellement disponibles : si une source manque (pas de clé, API en erreur), elle est
simplement ignorée. La **confiance** mesure la concentration de la prédiction et
l'**accord entre sources** ; le **score** vient des *expected goals* (ou, à défaut,
des probabilités).

## Fonctionnalités du site

- 🎯 Probabilités **Victoire / Nul / Défaite**, score IA et confiance par match
- 🧩 **Détail des 5 sources** dépliable (ce que dit chacune + sa pondération)
- 🏆 Toutes les phases : **huitièmes → quarts → demies → finale** (« Projeté » si à venir)
- 🔎 Filtrage par phase + recherche par équipe
- 📱 Responsive, thème sombre, sans dépendance front (HTML/CSS/JS pur)

## Lancer le site en local

```bash
python3 -m http.server 8000   # puis http://localhost:8000
```

## Le robot

```bash
node robot/update.mjs              # mode démo (fixtures) — données d'exemple
node robot/update.mjs --mode live  # vraies données (voir clés ci-dessous)
```

- **Mode `fixtures`** (par défaut) : les entrées brutes (cotes, forme, h2h, presse,
  buzz) viennent de `robot/fixtures.json`. Tout le calcul est réel ; seules les
  entrées sont des exemples.
- **Mode `live`** : la liste des matchs et les cotes viennent de The Odds API ; la
  forme et le face-à-face de football-data.org ; la presse de GDELT ; le buzz de
  l'API X (si `X_BEARER_TOKEN` valide) sinon des pages vues Wikipédia.

### Clés API (mode live)

| Variable d'env | Service | Coût | Effet si absente |
|---|---|---|---|
| `ODDS_API_KEY` | the-odds-api.com | gratuit (~500 req/mois) | **requis** (pas de matchs ni de cotes) |
| `FOOTBALL_DATA_KEY` | football-data.org | gratuit | sources Forme + Face-à-face ignorées |
| `X_BEARER_TOKEN` | API X (Twitter) v2 | — | repli automatique sur Wikipédia |

> ℹ️ **À propos de X** : le *Bearer token* du palier **gratuit** de l'API X ne donne
> généralement **pas** accès à la recherche/au comptage de tweets (réservé aux
> paliers payants). Le robot tente l'appel et, en cas de refus, **se replie
> automatiquement** sur les pages vues Wikipédia — aucun abonnement requis.

## Automatisation (GitHub Actions)

- **`update-predictions.yml`** — lance le robot toutes les 3 h et committe
  `data.json` / `data.js` si changement. Ajoute les clés dans
  *Settings → Secrets and variables → Actions*.
- **`deploy-pages.yml`** — publie le site sur **GitHub Pages** à chaque mise à jour.

## Format des données (`data.json`)

```jsonc
{
  "updatedAt": "2026-06-26T12:09:45Z",
  "weights": { "betting": 0.42, "form": 0.18, "h2h": 0.12, "press": 0.16, "social": 0.12 },
  "matches": [{
    "id": "r16-1", "stage": "Huitièmes", "projected": false,
    "datetime": "2026-06-28T19:00:00Z", "venue": "MetLife Stadium, New York",
    "home": { "name": "France", "flag": "🇫🇷", "code": "FRA" },
    "away": { "name": "Sénégal", "flag": "🇸🇳", "code": "SEN" },
    "probs": { "home": 54, "draw": 25, "away": 21 },
    "predictedScore": { "home": 2, "away": 1 },
    "confidence": 69,
    "analysis": "…",
    "sources": {
      "betting": { "label": "Paris", "weight": 0.42, "probs": {…}, "favored": "home", "detail": "3 bookmakers" },
      "form":    { "label": "Forme", "weight": 0.18, "probs": {…}, "favored": "home", "detail": "WWDWW vs WDWLW" },
      "h2h":     { "label": "Face-à-face", "weight": 0.12, "probs": {…}, "favored": "home", "detail": "2V 1N 0D" },
      "press":   { "label": "Presse", "weight": 0.16, "probs": {…}, "favored": "home", "detail": "18 articles" },
      "social":  { "label": "Public", "weight": 0.12, "probs": {…}, "favored": "home", "detail": "Wikipédia · …" }
    }
  }]
}
```

> Ne modifiez pas `data.json` / `data.js` à la main : ils sont régénérés par le robot.
> Les entrées brutes de démo vivent dans `robot/fixtures.json`.

## Avertissement

Les pronostics sont **générés à des fins d'illustration et de divertissement**.
Ils ne constituent pas un conseil de pari.
