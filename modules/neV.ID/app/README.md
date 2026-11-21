# neV.ID — Application de compte

Cette application constitue le premier socle frontend + backend du module neV.ID intégré à neV.WORLD.

## Prérequis

- Node.js 22.13 ou version ultérieure.
- npm.
- Une instance Clerk de développement.

## 1. Créer l'application Clerk de développement

1. Ouvrir le [tableau de bord Clerk](https://dashboard.clerk.com/).
2. Se connecter ou créer un compte fournisseur avec l'aide d'un adulte responsable pour la gestion du compte et des éventuelles obligations de paiement.
3. Créer une application nommée **neV.WORLD**.
4. Conserver l'instance **Development** pour ces essais.
5. Pour le premier essai, activer l'adresse e-mail avec code de vérification. Les fournisseurs sociaux pourront être ajoutés plus tard.
6. Dans **API keys**, récupérer la clé publique et la clé secrète de l'instance Development.

La création de l'application Clerk se fait dans le compte du propriétaire : ne partage jamais ton mot de passe ni ta clé secrète dans une conversation.

## 2. Installer localement

Depuis ce dossier :

```bash
npm install
```

Copier le fichier d'exemple :

```bash
cp .env.example .env
```

Sous Windows PowerShell :

```powershell
Copy-Item .env.example .env
```

Renseigner les variables dans le fichier local `.env` :

- `VITE_CLERK_PUBLISHABLE_KEY` : clé publique Development.
- `CLERK_SECRET_KEY` : clé secrète Development, exclusivement côté serveur.
- `NEV_ID_AUTHORIZED_PARTIES` : liste séparée par des virgules des origines exactes autorisées.

Exemple d'origine locale :

```text
NEV_ID_AUTHORIZED_PARTIES=http://localhost:5173
```

Ne jamais publier le fichier `.env`, la clé secrète, un jeton ou des données personnelles. Le fichier `.env` est ignoré par Git. Les clés ne doivent pas être ajoutées à GitHub ni envoyées ici.

## 3. Démarrer en développement

Ouvrir deux terminaux dans le dossier `modules/neV.ID/app`.

Terminal 1 — backend :

```bash
npm run dev:api
```

Terminal 2 — frontend :

```bash
npm run dev
```

Ouvrir ensuite l'adresse Vite affichée dans le terminal, généralement `http://localhost:5173`.

Le proxy Vite transmet les appels `/api` au serveur Node local sur le port 3000.

## 4. Vérifications

```bash
npm run check
npm run build
```

Puis tester dans le navigateur :

- `/sign-up` — création d'un compte de test.
- `/sign-in` — connexion.
- `/profile` — profil et paramètres du compte.
- Déconnexion depuis la barre supérieure du profil.
- `/api/health` — état du serveur.
- `/api/me` — vérification du jeton par le backend après connexion.

Le navigateur récupère le jeton à partir de la session Clerk et le transmet au backend dans l'en-tête `Authorization: Bearer`. Le backend le vérifie avec `authenticateRequest()` et la liste `authorizedParties`.

## 5. Déploiement ultérieur sur Render

Après compilation et tests locaux, un nouveau service Render pourra être créé sans remplacer le portail principal :

- Type : Web Service.
- Root Directory : `modules/neV.ID/app`.
- Build Command : `npm install && npm run build`.
- Start Command : `npm start`.

Les variables `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` et `NEV_ID_AUTHORIZED_PARTIES` devront être définies séparément dans les variables d'environnement Render. La clé secrète ne doit jamais être préfixée par `VITE_`.

Ce service ne doit pas être déployé sur les domaines définitifs tant que le domaine neV.WORLD et les règles d'authentification entre sous-domaines ne sont pas configurés.

## État actuel

Le code est présent sur la branche de travail GitHub. L'installation des dépendances, le contrôle syntaxique et la compilation de production ont réussi dans GitHub Actions. La création de l'application Clerk, la configuration locale des clés, les essais réels d'inscription/connexion/profil et le déploiement Render restent à faire. Aucun compte Clerk, aucune clé réelle et aucun compte d'utilisateur n'ont été créés dans le dépôt.
