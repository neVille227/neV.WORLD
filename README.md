# neV.WORLD

Portail central de l’écosystème neV.

## Projets

- **neV.BOOSTER** — bien-être et habitudes : https://nevbooster.onrender.com/
- **neV.MANGA** — studio de création et univers narratifs.
- **neV.NEXUS** — mise en relation et création d’opportunités (pilote privé, accès restreint).
- **NEHODO.22** — architecture et conception.

## Architecture

neV.WORLD est l’écosystème principal. **neV.ID est un module interne** chargé de l’identité et de l’authentification communes ; ce n’est pas un projet indépendant.

- `index.html` — portail public.
- `style.css` — identité visuelle et mise en page responsive.
- `script.js` — navigation mobile et mise à jour de l’année.
- `compte.html` — page publique qui présente neV.ID et son état d’avancement.
- `modules/neV.ID/` — documentation et application du module d’identité.

Les applications restent autonomes pour leurs fonctionnalités et leurs données métier. Le partage d’identité sera ajouté progressivement, après validation de l’architecture et des migrations.

## Espace commercial\n\nneV.COMMERCE est le futur espace commercial de l’écosystème. Il réunira les marques issues des projets neV, chacune conservant son identité et ses collections. La page de présentation est `commerce.html`. À ce stade, il s’agit d’une fondation éditoriale : aucun catalogue réel, panier, paiement ou traitement de commande n’est activé.\n\n## Documentation

- [Guide : à quoi sert le site et comment l'utiliser](GUIDE.md)
- [Architecture globale](ARCHITECTURE.md)\n- [Fondation neV.COMMERCE](COMMERCE.md)
- [Module neV.ID](modules/neV.ID/README.md)

## Adresse unique (portail + neV.ID)

Le serveur Node de `modules/neV.ID/app` sert à la fois le portail (`/`, `/compte.html`) et le compte neV.ID (`/sign-in`, `/sign-up`, `/profile`, `/api`) sur **une même adresse** (service Render `nev-id-preview`). Après inscription ou connexion, la personne revient sur `/`.

## Déploiement actuel sur Render

Le portail est un **Static Site** :

- Branch : `main`
- Root Directory : laisser vide
- Build Command : laisser vide
- Publish Directory : `.`

Le portail ne nécessite actuellement aucune compilation. Ne pas modifier ces paramètres pour la simple présence de la documentation neV.ID.

## État du projet

Le portail public existe déjà. Le module neV.ID est en phase de conception : aucun fournisseur d’identité n’est encore configuré dans le dépôt, aucun compte commun n’est actif et aucune application n’a été migrée.
