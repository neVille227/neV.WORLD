# neV.WORLD — Architecture cible

## Objectif

Fournir un point d'entrée unique aux projets neV tout en conservant leur indépendance technique. Un membre doit pouvoir s'authentifier une seule fois et retrouver sa session dans les applications rattachées à neV.WORLD.

## État actuel vérifié

- Portail central : `https://nev-world.onrender.com`, hébergé comme Static Site sur Render.
- Dépôt du portail : `neVille227/neV.WORLD`, branche `main`.
- neV.BOOSTER : service Render indépendant, dépôt `neVille227/neV.BOOSTER`.
- neV.NEXUS : service Render indépendant, dépôt `neVille227/neV.NEXUS`. Son README décrit un pilote sur invitation, avec des contrôles juridiques et de sécurité à achever avant toute ouverture publique. Son système de comptes et de sessions lui est propre à ce stade.
- Domaine personnalisé : pas encore acquis.

## Noms d'hôtes visés

Après acquisition et vérification du domaine :

| Hôte | Rôle |
|---|---|
| `nev.world` | Portail central |
| `auth.nev.world` | Connexion et gestion du compte, si un hôte dédié est nécessaire |
| `booster.nev.world` | neV.BOOSTER |
| `manga.nev.world` | neV.MANGA |
| `nexus.nev.world` | neV.NEXUS |
| `nehodo.nev.world` | NEHODO.22 |
| `api.nev.world` | API commune éventuelle, uniquement si un besoin réel le justifie |

Les hôtes ne seront activés qu'après configuration DNS et rattachement de chaque service à son domaine personnalisé dans Render.

## Authentification commune

**Option de travail : Clerk**, à confirmer avant toute mise en production.

La stratégie privilégiée est d'utiliser un domaine racine unique et des sous-domaines. Clerk documente le partage de sessions entre sous-domaines d'un même domaine racine. Les sous-domaines autorisés devront être explicitement limités afin de réduire la surface d'exposition.

Les domaines `onrender.com` actuels ne constituent pas le domaine commun de neV.WORLD. Le compte unique de production ne doit donc pas être déclaré opérationnel avant la configuration du domaine personnalisé.

## Règles de séparation des données

1. Le fournisseur d'identité gère l'identité de connexion et fournit un identifiant stable.
2. Chaque application conserve ses données métier dans son propre stockage.
3. Les applications vérifient les jetons ou sessions côté serveur avant d'autoriser l'accès aux données privées.
4. Les secrets d'API restent dans les variables d'environnement des services ; ils ne sont jamais enregistrés dans Git.
5. La suppression ou la désactivation d'un compte doit être coordonnée avec les applications concernées et documentée.

## Migration particulière de neV.NEXUS

neV.NEXUS dispose déjà de son propre système de comptes et de sessions. Il ne faut ni remplacer ce système ni fusionner ses données automatiquement.

Avant toute migration :
- sauvegarder la base de données et vérifier la procédure de restauration ;
- documenter les rôles et permissions existants ;
- définir une correspondance entre les identifiants actuels et le nouvel identifiant central ;
- tester sur une copie ou un environnement de préproduction ;
- conserver le mode pilote restreint tant que les validations opérationnelles, juridiques, de confidentialité et de sécurité décrites dans son dépôt ne sont pas achevées.

## Ordre de réalisation

1. Acquérir le domaine neV.WORLD avec l'aide d'un adulte responsable pour la gestion du compte et du paiement.
2. Configurer le domaine racine et les sous-domaines dans DNS et Render.
3. Créer et configurer l'instance d'authentification de développement.
4. Intégrer la connexion au portail central.
5. Tester la propagation de session entre deux applications de test.
6. Intégrer neV.BOOSTER après sauvegarde et revue de son fonctionnement actuel.
7. Étudier séparément la migration de neV.NEXUS ; ne pas l'ouvrir au public par cette seule intégration.
8. Intégrer les autres projets à mesure qu'ils disposent d'une application prête.

## Critères de validation

- Une connexion au portail est reconnue dans chaque sous-domaine autorisé.
- Une déconnexion invalide la session sur les applications concernées.
- Les API vérifient l'identité et les autorisations côté serveur.
- Les données privées restent isolées entre projets.
- Aucun secret n'est exposé dans le dépôt, le navigateur ou les journaux.
- Les sauvegardes et procédures de restauration sont testées avant les migrations.

## Hors périmètre pour le moment

- Aucun achat de domaine ou abonnement n'est effectué par ce dépôt.
- Aucune base utilisateur commune n'est créée.
- Aucun compte existant n'est fusionné ou supprimé.
- Aucun changement n'est apporté aux services neV.BOOSTER ou neV.NEXUS dans le cadre de ce document.
