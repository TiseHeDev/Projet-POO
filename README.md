# 📊 Gestionnaire de Budget (Angular)

Application moderne de gestion de finances personnelles développée avec **Angular 16+**. Ce projet permet de suivre les revenus et dépenses, de visualiser les flux d'argent via des graphiques interactifs et de gérer un budget personnalisé avec un système de catégories et sous-catégories.

## ✨ Fonctionnalités Principales

### 🏠 Tableau de Bord (Dashboard)
<img width="1201" height="736" alt="image" src="https://github.com/user-attachments/assets/0b3d8ca4-1582-4b85-b6da-dd7826cf0d32" />

* **Vue d'ensemble en temps réel** : Calcul automatique du solde total, des entrées et des sorties.
* **Indicateurs Visuels** : Alertes visuelles (Vert/Rouge) selon l'état du solde.
* **Top 3** : Affichage automatique des 3 plus gros postes de dépenses et de revenus, incluant les sous-catégories.
* **Filtres dynamiques** : Filtrage global par mois et par catégorie principale.

### 📈 Visualisation de Données

* **Diagramme de Sankey** : Visualisation unique des flux de trésorerie (Source → Destination) pour comprendre exactement où va l'argent.
<img width="1172" height="598" alt="image" src="https://github.com/user-attachments/assets/ed416db7-8434-4372-9864-e71c0b2ab612" />


* **Graphique d'Évolution** : Courbe de suivi du solde cumulé dans le temps.
<img width="1175" height="328" alt="image" src="https://github.com/user-attachments/assets/4d064dc6-cd4d-4f5e-b385-fac5bc13e505" />
### 📝 Gestion des Transactions

* **CRUD Complet** : Ajouter, modifier et supprimer des transactions.
* **Détails** : Gestion par date, montant, type (Revenu/Dépense), moyen de paiement, catégorie et sous-catégorie.
* **Tableau de données** : Liste triable par colonne (Date, Montant, Catégorie, etc.).

### ⚙️ Gestion Avancée des Catégories

* **Hiérarchie** : Création de catégories principales et de sous-catégories (ex: Logement > Loyer, Logement > Électricité).
* **Édition** : Interface dédiée pour ajouter ou supprimer des catégories et leurs enfants.

### 💾 Persistance des Données

* **Import / Export JSON** : Sauvegardez vos données localement via un fichier JSON et restaurez-les à tout moment.

---

## 🛠️ Stack Technique

Ce projet utilise les dernières fonctionnalités du framework Angular :

* **Framework** : Angular (Standalone Components).
* **State Management** : **Angular Signals** (`signal`, `computed`, `update`) pour une réactivité optimale et sans `RxJS` complexe dans les vues.
* **Graphiques** : `Chart.js` avec `ng2-charts` et le plugin `chartjs-chart-sankey`.
* **Style** : CSS3 natif, Flexbox et Grid Layout, Responsive Design.

---

## 📂 Structure du Projet

```text
src/
├── app/
│   ├── components/
│   │   ├── dashboard/           # Vue principale et graphiques
│   │   ├── transaction-form/    # Formulaire d'ajout/modif (Reactive Forms)
|   |   ├── label-manager/       # Arborescence pour la gestion des labels
│   │   └── category-manager/    # Gestion des catégories/sous-catégories
│   ├── features/
│   │   └── dashboard/           # Composants spécifiques (Sankey Chart)
│   ├── models/                  # Interfaces (Transaction, etc.)
│   ├── services/                # Logique métier (BudgetService avec Signals)
│   ├── app.ts                   # Composant racine
│   └── app.config.ts            # Configuration Angular
└── index.html

```

---

## 📸 Aperçu

* **Flux de Trésorerie (Sankey)** : Permet de voir la répartition du budget global vers les catégories puis les dépenses réelles.
* **Mode "Signals"** : Le code a été refactorisé pour utiliser les Signals, garantissant que la mise à jour du solde ou des graphiques est instantanée lors de l'ajout d'une transaction, sans rechargement de page.

---

## 👤 Auteurs

* **Sandri Mattéo**
* **Marquis-Favre Anton**

---

> Projet réalisé dans le cadre d'un module de développement Web Angular en LP Sarii.
