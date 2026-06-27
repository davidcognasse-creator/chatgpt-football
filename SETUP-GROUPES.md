# Configurer les comptes + groupes (Firebase)

La page **Groupes** (`groupes.html`) utilise **Firebase** (gratuit) pour les comptes
et le stockage des pronostics. Voici la mise en place (~10 min, une seule fois).

## 1. Créer le projet Firebase
1. Va sur **https://console.firebase.google.com** → **Ajouter un projet**.
2. Donne un nom (ex. `chatgpt-football`), désactive Google Analytics (optionnel), crée.

## 2. Activer l'authentification
1. Menu **Build → Authentication → Get started**.
2. Onglet **Sign-in method** → active :
   - **E-mail/Mot de passe**
   - **Google** (choisis un e-mail d'assistance, enregistre).
3. Onglet **Settings → Authorized domains** → ajoute **`chatgpt.football`**
   (et `localhost` pour tester en local).

## 3. Créer la base Firestore
1. Menu **Build → Firestore Database → Create database**.
2. Mode **Production**, choisis une région, crée.
3. Onglet **Rules** → colle **tout** le contenu de `firestore.rules` (à la racine du repo) → **Publish**.

## 4. Récupérer la config et la coller
1. ⚙️ **Paramètres du projet** → section **Tes applications** → icône **Web `</>`**.
2. Donne un surnom, enregistre. Copie l'objet `firebaseConfig`.
3. Ouvre **`firebase-config.js`** (racine du repo) et remplace les valeurs :
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "…",
     authDomain: "ton-projet.firebaseapp.com",
     projectId: "ton-projet",
     appId: "…",
   };
   ```
4. Committe / pousse → le déploiement met à jour le site.

> 🔓 Ces valeurs sont **publiques** (clé côté client) : c'est normal et sans risque,
> la sécurité vient des **règles Firestore** (étape 3).

## C'est prêt 🎉
Sur **https://chatgpt.football/groupes.html** :
- crée un compte (e-mail ou Google),
- crée un groupe, copie le **lien d'invitation** et envoie-le à tes amis,
- chacun pronostique les matchs à venir (1N2 + score),
- le **classement** se met à jour avec les vrais résultats — le **🤖 bot du site** y est aussi !

**Barème :** score exact = **3 pts**, bon résultat (1N2) = **1 pt**.
