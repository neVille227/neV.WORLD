# neV.WORLD — Architecture cible

## 1. Vision générale

neV.WORLD est l’écosystème principal qui rassemble plusieurs applications. Les projets conservent leurs fonctionnalités et leurs données métier propres, tandis que certains services transversaux sont mutualisés.

**neV.ID est un module interne de neV.WORLD**, et non un projet indépendant. Il fournit le service commun d’identité et d’authentification aux applications autorisées.

## 2. État actuel

- Portail central : `https://nev-world.onrender.com`, hébergé comme Static Site sur Render.
- Dépôt du portail : `neVille227/neV.WORLD`, branche `main`.
- neV.BOOSTER : application distincte, dépôt et service d’hébergement propres.
- neV.NEXUS : application distincte ; son éventuelle migration doit être étudiée séparément.
- Domaine personnalisé : pas encore acquis.
- Authentification commune : pas encore déployée.
- Prévisualisation neV.ID : https://nev-id-preview.onrender.com, service Render gratuit distinct, suivi de la branche de travail. Le build et le démarrage du serveur ont été confirmés ; Clerk reste non configuré.

Le portail actuel est un site statique composé de `index.html`, `style.css` et `script.js`. Il ne possède pas de backend de comptes.

## 3. Organisation logique

```text
neV.WORLD/
├── index.html
├── style.css
├── script.js
├── ARCHITECTURE.md
└── modules/
    └── neV.ID/
        └── README.md
```

Le portail central reste statique. Le module neV.ID possède son propre frontend et son backend Node, rangés dans le dépôt principal et déployés séparément.

## 4. Responsabilités de neV.ID

### Interface (frontend)
- Connexion et inscription.
- Consultation et modification des informations de profil autorisées.
- Gestion des paramètres de compte et des sessions.

### Service (backend / logique serveur)
- Vérification des sessions ou jetons.
- Identification du membre.
- Contrôle des autorisations côté serveur.
- Gestion sécurisée des opérations de compte et, si nécessaire, synchronisation des événements.

Le navigateur ne doit jamais décider seul qu'un utilisateur est autorisé à accéder à une ressource privée.

## 5. Fournisseur d'identité retenu

**Clerk est le fournisseur retenu**, mais aucune instance neV.WORLD n'a encore été créée. Les essais doivent se faire dans un environnement Development avant toute mise en production.

Les clés secrètes resteront dans les variables d'environnement des services concernés ; elles ne seront jamais enregistrées dans Git ni exposées au navigateur.

## 6. Domaines envisagés

Après acquisition du domaine et configuration DNS :

| Hôte envisagé | Rôle |
|---|---|
| `nev.world` | Portail central |
| `accounts.nev.world` | Interface de compte neV.ID |
| `booster.nev.world` | neV.BOOSTER |
| `manga.nev.world` | neV.MANGA |
| `nexus.nev.world` | neV.NEXUS |
| `nehodo.nev.world` | NEHODO.22 |

Ces adresses sont des objectifs, pas des services actuellement actifs. La possibilité de partager une session entre sous-domaines devra être validée avec la configuration réelle du fournisseur d'identité.

## 7. Principes de séparation

1. neV.ID centralise l'identité de connexion ; il ne centralise pas automatiquement toutes les données métier.
2. Chaque application conserve son stockage et ses données propres.
3. Chaque backend vérifie l'identité et les autorisations avant de servir des données privées.
4. Les rôles privilégiés sont contrôlés côté serveur.
5. La liaison d'un ancien compte à une identité centrale exige une preuve fiable de contrôle du compte ; une adresse électronique non vérifiée ne suffit pas.
6. Les migrations commencent par des sauvegardes vérifiées et des essais sur un environnement de test.

## 8. Ordre de réalisation

1. Valider la structure et la documentation du module neV.ID.
2. Préparer l'interface et le flux de connexion en environnement de développement.
3. Configurer Clerk en mode développement et vérifier les sessions.
4. Définir le contrat d'intégration entre neV.ID et les applications.
5. Tester une application pilote sans interrompre son authentification existante.
6. Préparer une migration progressive après sauvegarde et tests de restauration.
7. Raccorder les autres applications une par une.

## 9. Hors périmètre à ce stade

- Aucun achat de domaine ou abonnement.
- Aucune instance Clerk créée ou configurée par ce dépôt.
- Aucune base d'utilisateurs commune créée.
- Aucun compte existant fusionné ou supprimé.
- Aucun changement apporté aux dépôts ou services neV.BOOSTER, neV.MANGA, neV.NEXUS ou NEHODO.22.
- Aucun déploiement de production ni aucun déploiement sur un domaine personnalisé. La prévisualisation Render est isolée du portail principal.

## 10. Critères de validation avant mise en production

- Connexion et déconnexion cohérentes entre les applications autorisées.
- Vérification des jetons côté serveur.
- Isolation des données métier entre applications.
- Protection des secrets et des rôles privilégiés.
- Sauvegardes et restauration testées.
- Procédure documentée pour les comptes existants et la désactivation d'un compte.
