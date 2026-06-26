# IA Pronostics · Coupe du Monde 2026

Site statique au design moderne affichant les **pronostics IA** des matchs à venir
du Mondial 2026. Les prédictions proviennent d'un **fichier de données (`data.json`)**
qu'un **robot actualise** en agrégeant trois signaux : les **cotes des plateformes
de paris**, le **sentiment de la presse** et celui de **X**.

```
 fixtures / API  ──►  robot/update.mjs  ──►  data.json + data.js  ──►  site (index.html)
 (paris·presse·X)     (agrégation pondérée)   (fichier canonique)       (affichage)
```

## Fonctionnalités

- 🎯 Carte par match : probabilités **Victoire / Nul / Défaite**, score IA, confiance
- 🧩 **Détail des sources** dépliable : ce que disent les paris, la presse et X + leur pondération
- 🏆 Toutes les phases : **huitièmes → quarts → demies → finale** (tours futurs marqués « Projeté »)
- 🔎 Filtrage par phase + recherche par équipe
- 📱 Responsive, thème sombre, sans dépendance front (HTML/CSS/JS pur)

## Lancer le site en local

`data.json` est chargé via `fetch`, donc servez le dossier (l'ouverture directe en
`file://` fonctionne aussi grâce au miroir `data.js`) :

```bash
python3 -m http.server 8000   # puis http://localhost:8000
```

## Le robot d'actualisation

Le robot lit les sources, agrège une prédiction par match et écrit `data.json`
(canonique) + `data.js` (miroir pour `file://`).

```bash
node robot/update.mjs              # mode démo (fixtures)
node robot/update.mjs --mode live  # vraies API (voir ci-dessous)
```

### Comment fonctionne l'agrégation

1. **Paris** (`robot/sources/betting.mjs`) — convertit les cotes décimales de
   plusieurs bookmakers en probabilités, retire la marge ("de-vig") et fait le consensus.
2. **Presse** (`robot/sources/press.mjs`) — transforme les penchants éditoriaux
   (nb d'analyses par issue) en probabilités lissées.
3. **X** (`robot/sources/social.mjs`) — transforme le volume de mentions par issue
   en probabilités lissées.

Les trois vecteurs sont combinés par **moyenne pondérée** (poids dans
`robot/config.json`, par défaut paris 60 % / presse 20 % / X 20 %). La **confiance**
mesure la concentration de la prédiction et l'**accord entre sources** ; le **score**
est dérivé des *expected goals*.

### Passer en mode « live » (vraies données)

Les adaptateurs `robot/sources/*.mjs` contiennent des emplacements `TODO live`.
Branchez vos API et fournissez les clés via variables d'environnement :

| Source | Variable d'env  | Exemple d'API           |
|--------|-----------------|-------------------------|
| Paris  | `ODDS_API_KEY`  | The Odds API            |
| Presse | `NEWS_API_KEY`  | NewsAPI / GDELT / RSS   |
| X      | `X_BEARER_TOKEN`| API X (recherche récente) |

Le format de sortie reste identique : seul l'intérieur des adaptateurs change.

## Automatisation (GitHub Actions)

- **`.github/workflows/update-predictions.yml`** — exécute le robot toutes les 3 h
  (et à la demande), puis committe `data.json` / `data.js` si changement. En mode
  live, ajoutez les secrets `ODDS_API_KEY`, `NEWS_API_KEY`, `X_BEARER_TOKEN`.
- **`.github/workflows/deploy-pages.yml`** — déploie le site sur **GitHub Pages**
  à chaque mise à jour.

### Activer GitHub Pages

Le workflow tente d'activer Pages automatiquement (`enablement: true`). Si besoin,
dans **Settings → Pages**, choisissez **Source : GitHub Actions**. L'URL publique
apparaît ensuite dans l'onglet *Actions* (job « Déployer ») et dans Settings → Pages.

## Format des données (`data.json`)

```jsonc
{
  "updatedAt": "2026-06-26T10:57:30Z",
  "weights": { "betting": 0.6, "press": 0.2, "social": 0.2 },
  "matches": [{
    "id": "r16-1", "stage": "Huitièmes", "projected": false,
    "datetime": "2026-06-28T19:00:00Z", "venue": "MetLife Stadium, New York",
    "home": { "name": "France", "flag": "🇫🇷", "code": "FRA" },
    "away": { "name": "Sénégal", "flag": "🇸🇳", "code": "SEN" },
    "probs": { "home": 56, "draw": 24, "away": 20 },
    "predictedScore": { "home": 2, "away": 1 },
    "confidence": 72,
    "analysis": "…",
    "sources": {
      "betting": { "label": "Paris", "weight": 0.6, "probs": {…}, "favored": "home", "detail": "3 bookmakers" },
      "press":   { "label": "Presse", "weight": 0.2, "probs": {…}, "favored": "home", "detail": "18 médias" },
      "social":  { "label": "X", "weight": 0.2, "probs": {…}, "favored": "home", "detail": "8.7k mentions" }
    }
  }]
}
```

> Ne modifiez pas `data.json` / `data.js` à la main : ils sont régénérés par le robot.
> Les entrées brutes (cotes, presse, X) vivent dans `robot/fixtures.json`.

## Avertissement

Les pronostics sont **générés à des fins d'illustration et de divertissement**.
Ils ne constituent pas un conseil de pari.
