# neV.ID — Module interne de neV.WORLD

**Statut :** conception — non implémenté  
**Nature :** module transversal, pas un projet indépendant  
**Fournisseur d'identité envisagé :** Clerk

## Mission

neV.ID fournit une identité de connexion commune aux applications de neV.WORLD. Un membre doit pouvoir utiliser le même compte dans les applications raccordées, sous réserve des droits accordés par chacune.

## Ce que le module comprend

### Frontend
- Interface de connexion et d'inscription.
- Profil et paramètres de compte.
- Gestion de l'état de connexion et redirections contrôlées.

### Backend / vérification
- Vérification serveur des sessions ou jetons.
- Identification stable du membre.
- Contrôle des autorisations et des rôles.
- Traitement sécurisé des opérations de compte.

Le portail neV.WORLD actuel est statique. L'interface de neV.ID et sa logique serveur seront donc développées comme composants distincts du portail public, tout en restant dans l'écosystème et le dépôt principal.

## Relation avec les applications

- neV.WORLD : portail central et point d'entrée.
- neV.BOOSTER, neV.MANGA, neV.NEXUS et NEHODO.22 : applications raccordées progressivement.
- Chaque application garde ses propres données métier et ses règles d'accès.
- neV.ID ne donne pas automatiquement accès à toutes les fonctionnalités : chaque application conserve ses autorisations.

## Décisions de conception

- Clerk est le fournisseur retenu pour les essais, pas encore configuré.
- Le futur hôte de compte envisagé est `accounts.nev.world`.
- Le domaine personnalisé n'est pas encore acquis.
- La première intégration pilote sera neV.BOOSTER, après sauvegarde et préparation d'une migration progressive.
- Les identifiants internes existants des applications ne seront pas remplacés sans plan de migration vérifié.

## Prochaines étapes

1. Valider cette structure.
2. Concevoir les écrans frontend et le flux de connexion.
3. Préparer un environnement Clerk de développement.
4. Définir et tester la vérification serveur.
5. Raccorder une application pilote sans interrompre son système actuel.

## Sécurité

Ne jamais committer de clés Clerk, secrets, jetons ou données personnelles. Les secrets seront configurés dans les variables d'environnement de l'hébergement. Toute migration doit être précédée d'une sauvegarde et d'un test de restauration.
