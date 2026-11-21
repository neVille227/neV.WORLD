# neV.ID — Application de compte

Cette application constitue le premier socle frontend + backend du module neV.ID intégré à neV.WORLD.

## Prérequis

- Node.js 22.13 ou version ultérieure.
- npm.
- Une instance Clerk de développement pour tester réellement l'authentification.

## Installation locale

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

Renseigner ensuite les variables dans le fichier local `.env` :

- `VITE_CLERK_PUBLISHABLE_KEY` : clé publique Clerk.
- `CLERK_SECRET_KEY` : clé secrète Clerk, utilisée uniquement par le serveur Node.
- `NEV_ID_AUTHORIZED_PARTIES` : liste séparée par des virgules des origines exactes autorisées.

Ne jamais transmettre la clé secrète dans une conversation, la placer dans le code frontend ou la committer sur GitHub. Le fichier `.env` est ignoré par Git.

## Démarrage en développement

Ouvrir deux terminaux dans ce dossier.

Terminal 1 — backend :

```bash
npm run dev:api
```

Terminal 2 — frontend :

```bash
npm run dev
```

Ouvrir ensuite l'adresse locale affichée par Vite, généralement `http://localhost:5173`.

Le proxy Vite transmet les appels `/api` au serveur Node local sur le port 3000.

## Routes disponibles

- `/sign-in` — connexion.
- `/sign-up` — inscription.
- `/profile` — gestion du profil, réservée à une session connectée.
- `/api/health` — état du serveur.
- `/api/me` — vérification de la session côté serveur avec Clerk.

Le endpoint `/api/me` ne renvoie que l'identifiant Clerk et l'identifiant de session vérifiés. Il ne renvoie pas de clé ni de donnée sensible de compte.

## Compilation et exécution de production

```bash
npm run build
npm start
```

Le serveur Node sert le dossier `dist` et traite les routes API. Render devra utiliser, lors d'un futur déploiement :

- Root Directory : `modules/neV.ID/app`
- Build Command : `npm install && npm run build`
- Start Command : `npm start`

Il s'agira d'un nouveau service Render interne à l'écosystème neV.WORLD, sans remplacer le Static Site du portail principal.

## Configuration de production non effectuée

Avant le déploiement, il faudra :

1. Acquérir et configurer le domaine neV.WORLD.
2. Créer l'instance Clerk de développement puis valider les essais.
3. Configurer les vraies variables d'environnement dans Render.
4. Remplacer la liste locale `NEV_ID_AUTHORIZED_PARTIES` par les origines de production strictement nécessaires.
5. Tester la connexion, l'inscription, le profil, la déconnexion et la vérification serveur.
6. Étudier séparément le raccordement des applications existantes.

Les sous-domaines et le SSO inter-applications ne sont pas encore actifs. Ne pas utiliser de vraies données de comptes tant que ces validations ne sont pas terminées.
