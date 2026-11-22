# Collaboration autour de neV.WORLD

Document de coordination entre le fondateur et les assistants IA qui travaillent sur l'écosystème (Claude, Tokuru, et tout autre assistant futur). Il est tenu à jour à chaque décision.

## Rôles
- **neVill_e** : fondateur, directeur et **décideur final** de tout neV.WORLD. Aucune décision validée n'est modifiée sans lui.
- **Claude (Doto)** : coordinateur technique, désigné par neVill_e le 2026-11-22 : il veille à la cohérence entre les assistants, tient ce document à jour et signale les conflits. Ce rôle ne donne aucun pouvoir de décision sur le fond.
- **Tokuru (GPT-6)** et autres assistants : partenaires de réflexion, qui confrontent leurs analyses et signalent les incohérences.

## Principes
1. Respect des décisions validées.
2. Distinction claire entre **faits**, **hypothèses**, **propositions** et **décisions en attente**.
3. Continuité : chaque projet garde son identité, ses objectifs, son architecture et son historique.
4. Esprit critique : on peut remettre en question les propositions de chacun.
5. Collaboration sans concurrence.

## Décisions validées par neVill_e
- **Aucun site ou plateforme statique**, dans aucun projet : tout est une application dynamique (serveur).
- neV.ID est le compte unique de neV.WORLD, intégré à neV.WORLD (module `modules/neV.ID`), pas un dépôt séparé.
- Portail et neV.ID servis sur **une même adresse** ; retour sur le portail après création de compte.
- Authentification confiée à Clerk (instance de développement pour l'instant).
- Règle neV.NEXUS : aucun partenaire n'est présenté comme confirmé sans accord écrit formel.

## Faits établis (état au 2026-11-22)
- Services Render dynamiques : `nev-id-preview` (portail + neV.ID), `nevmanga`, `nevnexus`, `nevbooster`.
- Le portail génère ses cartes projets côté serveur (`projects.json`, API `/api/projects`).
- Services Render **encore statiques** à supprimer ou convertir : `nev-world`, `nev-manga`, `nev-world-commerce-preview`.
- La clé secrète Clerk est enregistrée dans Render (jamais dans le code).

## Hypothèses et points en attente
- Domaine `nev.world` : existence et disponibilité non vérifiées ; achat à faire par neVill_e. Dès qu'il est disponible : domaine personnalisé sur Render puis production Clerk.
- Session partagée entre projets : impossible tant que les sites sont sur des adresses `onrender.com` différentes (hypothèse : possible avec un domaine commun).
- NEHODO.22 : pas encore de site ; devra être dynamique.
- Pilote d'intégration de neV.ID : neV.BOOSTER d'abord (à confirmer, après sauvegarde des données).

## Journal des décisions
| Date | Décision | Source |
|---|---|---|
| 2026-11-22 | Aucun site statique dans les projets | neVill_e |
| 2026-11-22 | neV.ID fusionné dans neV.WORLD, adresse unique | neVill_e |
| 2026-11-22 | Claude coordinateur technique ; neVill_e décideur final | neVill_e |
| 2026-11-22 | Direction centrale d'administration et de cybersécurité (voir `docs/ADMINISTRATION-CENTRALE.md`) | neVill_e |
