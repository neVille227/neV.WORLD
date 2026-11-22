# neV.ID — Module interne de neV.WORLD

**Statut :** application de prévisualisation déployée — configuration Clerk et tests réels à effectuer  
**Nature :** module transversal intégré au dépôt principal  
**Fournisseur d'identité retenu :** Clerk

## Mission

neV.ID fournit une identité de connexion commune aux applications de neV.WORLD. Un membre pourra utiliser le même compte dans les applications raccordées, sous réserve des droits accordés par chacune.

## Architecture du module

- **Frontend :** connexion, inscription, profil et paramètres de compte.
- **Backend :** vérification côté serveur des sessions Clerk et identification stable du membre.
- **Fournisseur :** Clerk, à configurer dans une instance de développement.
- **Application :** `app/`, construite avec Vite, JavaScript natif et un serveur HTTP Node.js.
- **Dépôt :** ce module reste dans `neV.WORLD`, il ne constitue pas un dépôt ou projet indépendant.

## Fichiers

- `app/src/main.js` — initialisation Clerk, navigation et composants.
- `app/src/style.css` — interface responsive, thème sombre et accent rouge.
- `app/server.js` — service HTTP Node et endpoint protégé `POST /api/me`.
- `app/vite.config.js` — proxy local du frontend vers le backend.
- `app/.env.example` — variables nécessaires, sans véritables secrets.
- `app/README.md` — installation et lancement local.

## Relation avec les applications

- neV.WORLD : portail central et point d'entrée.
- neV.BOOSTER, neV.MANGA, neV.NEXUS et NEHODO.22 : applications à raccorder progressivement.
- Chaque application conserve ses données métier et ses règles d'accès.
- La création d'un compte commun ne donne pas automatiquement tous les droits sur chaque application.

## État réel

- L'interface et les points d'entrée de connexion, inscription et profil sont codés.
- Le backend vérifie les sessions avec `authenticateRequest()` et une liste d'origines autorisées.
- L'application affiche une page de configuration tant que la clé publique Clerk n'est pas fournie.
- Aucun compte Clerk n'a été créé ou configuré.
- Aucune clé réelle n'est enregistrée dans Git.
- L'installation des dépendances, la vérification de syntaxe JavaScript et la compilation de production ont réussi dans GitHub Actions sur une première révision. Le test HTTP de fumée est désormais ajouté au contrôle continu et doit encore passer sur la dernière révision.
- La connexion réelle avec Clerk, le test du profil, la déconnexion réelle et la propagation de session entre applications restent à vérifier.
- Prévisualisation Render : https://nev-id-preview.onrender.com (service gratuit isolé, sans clés Clerk).
- Le service Render a réussi le build et démarre le serveur Node. La page reste en mode configuration tant que Clerk n'est pas configuré.

## Lancement local

Voir [app/README.md](app/README.md).

## Sécurité

Ne jamais committer de clé secrète Clerk, jeton ou donnée personnelle. Les clés secrètes restent exclusivement côté serveur et dans les variables d'environnement de l'hébergement. Toute migration de comptes existants doit commencer par une sauvegarde vérifiée et un plan de liaison sécurisé.
