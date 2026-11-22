# neV.COMMERCE — fondation du projet

## Vision
neV.COMMERCE est l’espace commercial central de l’écosystème neV. Il a vocation à réunir les marques créées à partir des différents projets, sans effacer leurs identités propres.

## Modèle de marque
Chaque marque doit être définie à partir de son projet source :
- projet d’origine et raison d’être ;
- nom commercial et emblème validés ;
- univers visuel et clientèle visée ;
- catégories de produits cohérentes ;
- règles d’utilisation de l’identité ;
- responsable, approvisionnement et qualité.

Les noms « univers neV.NEXUS », « univers neV.MANGA », « univers neV.BOOSTER » et « univers NEHODO.22 » utilisés dans la page de présentation désignent des pistes de travail, pas des marques finales déjà déposées ou validées.

## Parcours cible
1. La personne découvre les marques depuis neV.COMMERCE.
2. Elle consulte une marque et ses collections.
3. Elle consulte les fiches produits (description, variantes, prix, disponibilité et informations de livraison).
4. Elle ajoute des articles au panier.
5. Elle confirme les informations nécessaires et choisit un moyen de paiement disponible.
6. Elle reçoit une confirmation et peut suivre sa commande.

Le panier commun à plusieurs marques est une orientation envisagée, à confirmer après étude des stocks, de la livraison, des retours et de la gestion commerciale.

## Architecture cible — à concevoir
- **Vitrine** : pages des marques, collections et fiches produits.
- **Catalogue** : données structurées pour les marques, produits, variantes, prix et disponibilité.
- **Panier et commandes** : calculs et validation côté serveur ; aucune confiance accordée aux montants envoyés par le navigateur.
- **Paiements** : prestataire conforme aux règles applicables ; ne jamais stocker les données de carte bancaire.
- **Administration** : accès restreint, journalisation et séparation des rôles.
- **Livraison et retours** : règles transparentes avant l’ouverture des ventes.

## État actuel
- Page de présentation conceptuelle : en cours d’intégration dans neV.WORLD.
- Marques définitives : à valider.
- Produits et fournisseurs : non définis.
- Catalogue réel : non créé.
- Panier et commandes : non implémentés.
- Paiements et livraison : non activés.
- Ouverture commerciale : non planifiée.

## Ordre de réalisation
1. Valider la structure de marque pour chaque projet.
2. Choisir une première marque pilote et définir une petite collection réaliste.
3. Étudier les coûts, la fabrication, les stocks, la qualité et la livraison.
4. Concevoir le modèle de données du catalogue.
5. Développer les fiches produits et le panier en environnement de test.
6. Valider les exigences légales et le prestataire de paiement avec un représentant légal/adulte responsable si nécessaire.
7. Tester les commandes, remboursements, annulations et protections.
8. Ouvrir progressivement après validation complète.

## Principes non négociables
- Ne pas inventer de produits, prix, avis, stocks ou délais.
- Ne pas afficher un bouton d’achat fonctionnel tant que le traitement de commande n’existe pas.
- Ne jamais exposer de secret ou de clé privée dans le frontend ou le dépôt.
- Ne pas activer de paiement sans validation juridique, opérationnelle et technique.
