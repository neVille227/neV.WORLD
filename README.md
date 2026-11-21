# neV.WORLD

Portail central de l’écosystème neV.

## Projets

- **neV.BOOSTER** — bien-être et habitudes : https://nevbooster.onrender.com/
- **neV.MANGA** — studio de création et univers narratifs.
- **neV.NEXUS** — mise en relation et création d’opportunités.
- **NEHODO.22** — architecture et conception.

## Structure actuelle

Le portail est une application statique composée de :

- `index.html` — structure et contenu.
- `style.css` — identité visuelle et mise en page responsive.
- `script.js` — navigation mobile et mise à jour de l’année.

Les applications restent indépendantes. Les services partagés (compte neV, profil et API) seront ajoutés dans une phase ultérieure.

## Déploiement sur Render

Créer un service **Static Site** relié à ce dépôt :

- Branch : `main`
- Root Directory : laisser vide
- Build Command : laisser vide
- Publish Directory : `.`

Le portail ne nécessite aucune compilation.

## État du projet

Version initiale du portail. L’authentification commune et les sous-domaines personnalisés ne sont pas encore configurés.
