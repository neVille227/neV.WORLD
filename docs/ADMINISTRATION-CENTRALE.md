# Direction centrale neV.WORLD — administration et cybersécurité

Cadre fixé par neVill_e (note de cadrage du 2026-11-22). La direction centrale supervise l'ensemble de l'écosystème, respecte l'indépendance fonctionnelle de chaque projet et **rend compte à neVill_e**. Coordination technique : Claude (Doto). Décideur final : neVill_e.

> **Principe fondamental : aucun site n'est considéré comme sécurisé sans vérification technique effective.** Chaque affirmation ci-dessous est classée **Vérifié** (testé, avec la date) ou **Non vérifié**.

## 1. Périmètre

| Projet | Hébergement actuel | Dynamique ? | Visibilité de la direction centrale |
|---|---|---|---|
| neV.WORLD (portail) + neV.ID | Render `nev-id-preview` | Oui | Code lu et testé |
| neV.MANGA | Render `nevmanga` | Oui (converti le 2026-11-22) | Code lu et testé |
| neV.BOOSTER | Render `nevbooster` (Docker, disque 1 Go) | Oui | Services vus, **code non audité** |
| neV.NEXUS | Render `nevnexus` | Oui | Service vu, **code non audité** |
| neV.COMMERCE | Branche `feat/nev-commerce-foundation` + service statique `nev-world-commerce-preview` | **Non** (statique) | Branche ne contient pas encore de code commerce |
| neV.GAME | Aucun dépôt ni service trouvé | — | Rien à auditer |
| NEHODO.22 | Dépôt existant, aucun service Render | — | **Non audité** |

## 2. Socle de sécurité exigé pour tout site
1. Application dynamique côté serveur (aucun site statique).
2. Aucun secret dans le code ni dans l'historique ; clés dans les variables d'environnement Render.
3. Authentification via neV.ID (Clerk) ; vérification **côté serveur**, jamais seulement dans le navigateur.
4. En-têtes : `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, puis `Content-Security-Policy` et `Strict-Transport-Security`.
5. Limitation de débit sur les routes sensibles (connexion, API).
6. Dépendances sans vulnérabilité connue (`npm audit` sans alerte élevée).
7. Sauvegardes testées pour tout projet qui conserve des données.
8. Double authentification activée sur GitHub, Render et Clerk.
9. Journalisation sans données personnelles.

## 3. Procédure de réponse aux incidents
1. **Détecter** et noter l'heure, la source et les systèmes touchés.
2. **Contenir** : couper l'accès (suspendre le service, révoquer la clé ou le compte).
3. **Régénérer** tout secret possiblement exposé (Clerk, Render, GitHub).
4. **Corriger** la cause, puis redéployer et vérifier.
5. **Rendre compte** à neVill_e dans le rapport suivant, avec les leçons retenues.

## 4. Audits et rapports
- Audit de sécurité : à chaque mise en production d'un projet, puis au moins une fois par mois.
- Rapport : au moins hebdomadaire, avec ces rubriques : état de chaque plateforme, incidents, niveau de sécurité **vérifié**, améliorations réalisées, problèmes non résolus, prochaines interventions.

---

# Rapport n°1 — 2026-11-22

## État des plateformes
| Plateforme | État |
|---|---|
| neV.WORLD + neV.ID | Déployé (Render indique « live »). Connexion testée par neVill_e : fonctionne. Clerk en **mode développement**. |
| neV.MANGA | Déployé, converti en application Node. |
| neV.BOOSTER, neV.NEXUS | Services actifs sur Render ; **sécurité non auditée**. |
| neV.COMMERCE, neV.GAME, NEHODO.22 | Pas d'application dynamique en ligne. |

## Niveau de sécurité — Vérifié aujourd'hui
- `npm audit` sur neV.ID : **0 vulnérabilité** (dépendances de production).
- neV.MANGA : **aucune dépendance externe**, donc pas de risque lié aux paquets.
- Recherche de clés secrètes dans les 30 derniers commits de neV.WORLD et neV.MANGA : **aucune trouvée**. Aucun fichier `.env` suivi par git.
- neV.ID vérifie les sessions **côté serveur** avec la liste d'origines autorisées, et ne renvoie pas les détails internes d'erreur.
- En-têtes présents sur neV.ID : `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`.
- neV.MANGA : `X-Frame-Options` et `Permissions-Policy` **ajoutés aujourd'hui** et testés en local (ils manquaient).

## Améliorations réalisées
- Conversion de neV.MANGA et du portail en applications dynamiques.
- Mise en place de la clé secrète Clerk dans Render (hors du code).
- En-têtes de sécurité complétés sur neV.MANGA.

## Incidents et écarts
1. **Service statique créé sans validation** : `nev-world-commerce-preview` (10 h 09, branche commerce). Contraire à la règle « aucun site statique ». Origine non confirmée.
2. **Clé secrète Clerk de test visible dans les échanges techniques** de la session de configuration. Risque faible (clé de développement), mais à régénérer par précaution.

## Problèmes non résolus
- 3 services Render statiques : `nev-world`, `nev-manga`, `nev-world-commerce-preview`.
- Absence de `Content-Security-Policy`, de `Strict-Transport-Security` (non vérifié si Render l'ajoute) et de limitation de débit sur neV.ID et neV.MANGA.
- Les sites en ligne n'ont **pas** pu être testés depuis l'environnement de l'assistant (accès réseau bloqué) : en-têtes réels, certificats HTTPS et temps de réponse restent **non vérifiés**.
- Sauvegardes de neV.BOOSTER (disque de données) : existence et test **non vérifiés**.
- Double authentification sur GitHub, Render et Clerk : **non vérifiée** (à confirmer par neVill_e).
- Clerk toujours en développement ; la production exige un domaine (`nev.world` non vérifié).

## Prochaines interventions (par priorité)
1. Décision de neVill_e sur les 3 services statiques (suppression ou conversion).
2. Régénérer la clé secrète Clerk, puis la remettre dans Render.
3. Ajouter CSP, HSTS et limitation de débit sur neV.ID et neV.MANGA.
4. Audit de neV.BOOSTER et neV.NEXUS (exige l'accès à leurs dépôts) et vérification de la sauvegarde de BOOSTER.
5. Acheter et vérifier le domaine, puis passer Clerk en production.
6. Définir le cadre technique de neV.COMMERCE et neV.GAME avant tout développement.
