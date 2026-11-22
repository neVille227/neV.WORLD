# Audit technique initial — neV.WORLD
**Date :** 22 novembre 2026  
**Périmètre :** dépôts GitHub accessibles, services Render du workspace « My Workspace », code source consulté et journaux d'erreurs disponibles.  
**Nature :** audit documentaire et lecture seule. Aucun secret, contenu privé d'utilisateur, variable d'environnement ou donnée métier n'a été extrait.

## 1. Résumé exécutif

Les sept services Render recensés ont un dernier déploiement visible avec le statut `live` et ne sont pas suspendus. Les journaux Render de niveau `error` consultés pour les sept derniers jours sont vides pour ces services. Cela ne prouve pas l'absence de vulnérabilité ni d'incident.

Cinq dépôts GitHub sont accessibles et publics : `neV.WORLD`, `neV.BOOSTER`, `neV.NEXUS`, `neV.MANGA` et `NEHODO.22`. Le dépôt NEHODO.22 ne présente pas de code applicatif significatif dans l'état consulté. Aucun dépôt ni service Render nommé neV.GAME n'a été trouvé.

Aucune configuration de production n'a été modifiée pendant cet audit.

## 2. Inventaire constaté

| Projet / module | GitHub | Render | Situation observée |
|---|---|---|---|
| neV.WORLD | Dépôt public | `nev-world` (Static Site) | Portail statique encore actif |
| neV.ID | Module dans neV.WORLD | `nev-id-preview` (Web Service) | Prévisualisation Node, Clerk et origines autorisées côté serveur dans le code |
| neV.MANGA | Dépôt public | `nevmanga` (Web Service) et `nev-manga` (Static Site) | Deux services actifs associés au même dépôt et à la branche main |
| neV.NEXUS | Dépôt public | `nevnexus` (Web Service) | Application Node et PostgreSQL |
| neV.BOOSTER | Dépôt public | `nevbooster` (Web Service Docker) | Disque persistant de 1 Go monté sur `/var/data` |
| neV.COMMERCE | Fondation sur une branche de neV.WORLD | `nev-world-commerce-preview` (Static Site) | Page éditoriale de fondation ; aucun catalogue, panier, paiement ou traitement de commande confirmé |
| neV.GAME | Aucun dépôt trouvé | Aucun service trouvé | À cadrer avant création |
| NEHODO.22 | Dépôt public, sans code applicatif significatif repéré | Aucun service trouvé | Audit applicatif impossible à ce stade |

Un service PostgreSQL Render nommé `nevnexus-db` est présent, disponible, sur une offre gratuite dont l'expiration annoncée est le **19 décembre 2026**. Aucun service Key Value n'a été recensé. Les métriques consultées montrent zéro connexion active à deux points horaires pour la base ; cela ne constitue pas un audit des données.

## 3. Résultats par application

### neV.ID — priorité élevée avant ouverture réelle
**Éléments positifs observés dans le code :**
- Le backend vérifie la session avec Clerk via `authenticateRequest()`.
- Les origines autorisées sont définies côté serveur.
- Les routes API non prévues sont refusées.
- Les réponses d'erreur ne divulguent pas les détails internes de Clerk.
- Les chemins statiques sont normalisés et contrôlés contre les sorties du répertoire de build.

**À compléter :**
- Les en-têtes présents dans le serveur comprennent `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` et `Permissions-Policy`. Une CSP et HSTS ne sont pas configurées dans ce serveur.
- Aucun limiteur de débit applicatif n'est visible dans le serveur personnalisé ; prévoir une protection des routes sensibles.
- Le contrôle réel de Clerk, des origines autorisées et des cookies en production n'a pas été vérifié depuis les variables Render, volontairement non consultées.
- Le service actuellement recensé est une prévisualisation. Le domaine de production et la propagation de session entre applications restent à valider.

### neV.MANGA — priorité moyenne
**Éléments positifs observés :**
- Serveur Node sans dépendance externe déclarée dans `package.json`.
- Le serveur n'accepte que GET et HEAD ; aucune route de modification ou d'administration n'est exposée dans le code consulté.
- Les réponses ajoutent `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY` et `Permissions-Policy`.

**À compléter :**
- Ajouter une CSP adaptée au contenu réellement servi et HSTS après validation du domaine HTTPS.
- Les deux services Render (`nevmanga` et `nev-manga`) servent le même dépôt et la même branche. Confirmer lequel est canonique, puis planifier la consolidation sans supprimer de service avant vérification des liens et usages.
- Les tests HTTP publics et les en-têtes réellement reçus n'ont pas pu être vérifiés depuis cet environnement.

### neV.NEXUS — priorité élevée
**Éléments positifs observés dans le code :**
- Helmet avec CSP, limitation de débit globale et limiteurs dédiés à l'authentification et aux écritures.
- Contrôle CSRF par en-tête personnalisé pour les méthodes de modification.
- Mots de passe hachés avec bcrypt ; jetons de session hachés en base.
- Cookie de session HttpOnly, SameSite=Lax et Secure en production.
- Validation des entrées avec Zod, requêtes SQL paramétrées, contrôles de rôles côté serveur et journal d'audit.
- Les inscriptions sont décrites comme limitées par invitation dans le README.

**À corriger / vérifier :**
- Dans `src/server.js`, si `PGSSL=true`, le client PostgreSQL active TLS avec `rejectUnauthorized: false`. Cela désactive la validation du certificat serveur. Vérifier le mode de connexion réellement utilisé et adopter une validation de certificat correcte lorsque TLS est requis.
- La base gratuite expire le 19 décembre 2026 : planifier une migration ou un renouvellement et une sauvegarde vérifiée avant cette date.
- Vérifier les sauvegardes, la restauration, la politique de conservation et le fonctionnement des variables de production sans exposer leurs valeurs.
- Effectuer `npm audit` et les tests automatisés dans un environnement de test isolé ; ils n'ont pas été exécutés pendant cet audit.

### neV.BOOSTER — priorité élevée en raison des données persistantes
**Éléments positifs observés dans le code :**
- Données SQLite séparées des fichiers publics ; le Dockerfile cible le disque Render `/var/data`.
- Mots de passe hachés avec scrypt, sessions stockées séparément, cookies HttpOnly et SameSite=Strict.
- Limitation de débit sur plusieurs routes, vérification d'origine pour les écritures, CSP et rôles administratifs contrôlés côté serveur.
- Journal d'audit des actions administratives et fonctions de sauvegarde présentes dans le code.
- Le fichier `.gitignore` exclut notamment `.env`, bases SQLite/DB et `server/data/`.

**À corriger / vérifier :**
- Les gestionnaires `uncaughtException` et `unhandledRejection` consignent l'erreur sans arrêter le processus. Prévoir un arrêt contrôlé et un redémarrage supervisé après une erreur fatale, plutôt que de continuer dans un état potentiellement incohérent.
- La présence effective de `NEV_SECURE=1` ou d'une configuration proxy équivalente dans Render n'a pas été vérifiée. Cette condition influence les cookies Secure et HSTS.
- Les sauvegardes automatiques annoncées dans la documentation n'ont pas été vérifiées sur le disque et aucune restauration n'a été testée.
- Vérifier les tests automatisés et les dépendances dans un environnement local ou de test avant toute mise à jour.

### neV.COMMERCE, neV.GAME et NEHODO.22
- neV.COMMERCE est une fondation éditoriale sur une branche de neV.WORLD, pas encore une boutique fonctionnelle. Le service Render associé est statique, ce qui ne respecte pas la règle d'architecture dynamique consignée dans la charte centrale.
- Aucun dépôt ou service neV.GAME n'a été trouvé. Ne rien créer avant validation de son périmètre et de son architecture.
- Le dépôt NEHODO.22 ne contient pas de code applicatif significatif dans l'état consulté ; son audit de sécurité applicative est donc en attente.

## 4. État Render et observations opérationnelles

- Sept services recensés : les derniers déploiements visibles sont `live`, les services ne sont pas suspendus.
- Journaux de niveau `error` : aucune entrée renvoyée pour les sept derniers jours, sur les sept services.
- `neV.BOOSTER` : métriques disponibles ; mémoire observée autour de 82 Mio sur les deux échantillons horaires consultés. Les métriques de latence n'ont pas fourni de données.
- `neV.NEXUS` : aucune série de métriques renvoyée sur la période consultée.
- Base PostgreSQL `nevnexus-db` : état `available`, expiration annoncée le 19 décembre 2026.
- Les tentatives d'ouverture HTTP des URL publiques depuis l'environnement d'audit ont échoué. Les certificats, en-têtes réellement servis, réponses des endpoints de santé et performances publiques restent donc **non vérifiés**.

## 5. Contrôles non vérifiés

Les accès actuels ne permettent pas de certifier :
- l'authentification multifacteur sur GitHub, Render et Clerk ;
- les règles de protection des branches et les permissions exactes des collaborateurs ;
- l'état des alertes Dependabot, du secret scanning et du code scanning pour tous les dépôts ;
- l'absence de secrets dans l'intégralité de l'historique Git de tous les dépôts ;
- les valeurs et la présence des variables d'environnement Render ;
- les sauvegardes effectives et la restauration de neV.BOOSTER et neV.NEXUS ;
- les en-têtes HTTP et certificats réellement servis aux visiteurs.

Les dépôts GitHub étant publics, le code source est visible. Aucune valeur secrète ne doit être ajoutée aux fichiers, commits, tickets ou rapports.

## 6. Plan d'action priorisé

### P0 — continuité et secrets
1. Planifier avant le 19 décembre 2026 la continuité de la base PostgreSQL neV.NEXUS : sauvegarde, restauration testée, choix du plan cible et migration contrôlée.
2. Vérifier dans Render les paramètres de sécurité de neV.ID et neV.BOOSTER sans afficher ni copier les secrets.
3. Régénérer la clé Clerk de développement signalée dans le rapport n°1, si elle a effectivement été exposée, puis mettre à jour le secret dans Render et vérifier la connexion. Ne jamais coller la clé dans un dépôt ou un échange.

### P1 — protections applicatives
4. Ajouter CSP, HSTS et limitation de débit adaptée sur neV.ID et neV.MANGA, après tests de compatibilité.
5. Corriger la validation du certificat TLS PostgreSQL dans neV.NEXUS lorsque TLS est utilisé.
6. Corriger l'arrêt du processus après erreur fatale dans neV.BOOSTER.
7. Vérifier les sauvegardes de neV.BOOSTER et effectuer un exercice de restauration isolé.

### P2 — gouvernance de l'infrastructure
8. Décider du service canonique pour neV.MANGA et du sort des services statiques `nev-world`, `nev-manga` et `nev-world-commerce-preview`. Ne supprimer ni convertir un service sans inventaire des URL, validation de la configuration et plan de retour arrière.
9. Confirmer le domaine de production et l'environnement Clerk avant de raccorder les applications à neV.ID.
10. Mettre en place la vérification régulière des dépendances, des secrets, des permissions GitHub, de la MFA et des protections de branche.
11. Définir les architectures de neV.COMMERCE et neV.GAME avant leur mise en production.
12. Planifier l'audit de NEHODO.22 dès que son code applicatif sera disponible.

## 7. Limites de cet audit

Cet audit est une revue initiale en lecture seule, fondée sur les métadonnées Render, les dépôts et les fichiers consultés. Il ne s'agit ni d'un test d'intrusion, ni d'une certification, ni d'une garantie d'absence de vulnérabilité. Aucun test destructif, aucune exploitation, aucune modification de production et aucun accès aux données personnelles n'ont été réalisés.

**Décision :** les points P0 doivent être traités en premier. Les changements applicatifs et les changements d'infrastructure doivent être préparés sur une branche de travail, testés, puis soumis à revue avant déploiement.
