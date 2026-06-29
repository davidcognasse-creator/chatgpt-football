# Activer la « Version IA » de la carte (maillot réaliste via Gemini)

La page **Ma Carte Panini** peut transformer la photo avec l'IA **Gemini 2.5 Flash
Image** pour habiller la personne d'un vrai maillot aux couleurs du pays.

La clé Gemini est **secrète** : elle ne doit JAMAIS être dans le site (repo public).
On la met donc dans un petit **Cloudflare Worker** (hébergement gratuit) qui sert
de proxy. Le navigateur appelle le Worker, le Worker appelle Gemini.

## 1. Clé Gemini (gratuite)
1. Va sur **https://aistudio.google.com/apikey** (compte Google).
2. **Create API key** → copie la clé (commence par `AIza…`).
   > Gemini 2.5 Flash Image a un **palier gratuit** (limité) puis ~0,04 $/image.

## 2. Déployer le Worker (≈ 5 min, gratuit)
Pré-requis : Node installé.

```bash
npm install -g wrangler        # outil Cloudflare
cd worker
wrangler login                 # ouvre le navigateur, connecte ton compte Cloudflare (gratuit)
wrangler secret put GEMINI_API_KEY   # colle ta clé Gemini quand demandé
wrangler deploy                # déploie → affiche l'URL, ex. https://gemini-card.TONCOMPTE.workers.dev
```

Copie l'**URL** affichée à la fin (`https://gemini-card.….workers.dev`).

## 3. Brancher le site
1. Ouvre **`carte-config.js`** (racine du repo) et colle l'URL :
   ```js
   window.CARTE_CONFIG = {
     geminiWorkerUrl: "https://gemini-card.TONCOMPTE.workers.dev",
   };
   ```
2. Committe / pousse → le déploiement met à jour le site.

## C'est prêt 🎉
Sur **chatgpt.football/carte.html** : ajoute ta photo → bouton **« ✨ Version IA »**.
La photo part au Worker, Gemini renvoie l'image avec le maillot, elle s'affiche sur
la carte. Tant que `geminiWorkerUrl` est vide, seul le **maillot dessiné** (gratuit)
est disponible.

> 🔒 La clé reste dans Cloudflare (secret), jamais dans le repo.
> Le Worker n'accepte que les requêtes venant de **chatgpt.football** (anti-abus).
