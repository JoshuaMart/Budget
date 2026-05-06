# Budget — Spécifications fonctionnelles

> Application de suivi de dépenses et de budgets personnels basée sur la méthode **50/30/20** (configurable).

---

## 1. Vue d'ensemble

**Budget** permet à un utilisateur de :

- Suivre ses revenus et dépenses sur un ou plusieurs comptes.
- Catégoriser automatiquement chaque transaction dans une **enveloppe** (Nécessités / Envies / Investissements) et une **sous-catégorie**.
- Visualiser en temps réel la conformité de son budget par rapport à la répartition cible (par défaut 50/30/20).
- Automatiser les paiements récurrents (loyer, abonnements, virements DCA, salaire…).
- Analyser ses habitudes financières via des statistiques mensuelles.

La langue par défaut est le **français**, la devise par défaut est l'**euro (€)**.

---

## 2. Concepts métier

### 2.1 Méthode 50/30/20

Le revenu mensuel net est réparti en trois enveloppes dont le pourcentage est paramétrable :

| Enveloppe           | Ratio par défaut | Couleur | Description                  |
| ------------------- | ---------------- | ------- | ---------------------------- |
| **Nécessités**      | 50 %             | Vert    | Dépenses incompressibles     |
| **Envies**          | 30 %             | Orange  | Dépenses de confort / loisir |
| **Investissements** | 20 %             | Bleu    | Épargne et placements        |

**Contraintes :**

- La somme des trois ratios doit toujours faire **100 %**.
- Les ratios sont modifiables dans les réglages (Tweaks).

### 2.2 Sous-catégories par défaut

À la création du compte utilisateur, chaque enveloppe est pré-remplie :

**Nécessités**

- Logement
- Transports
- Alimentation et boissons
- Emprunts
- Dépenses professionnelles
- Frais
- Impôts
- Scolarité

**Envies**

- Abonnements
- Sorties et Restaurants
- Shopping

**Investissements**

- Actions
- Obligations
- Immobilier
- Matelas de sécurité
- Crypto

**Règles :**

- L'utilisateur peut **ajouter** une sous-catégorie à n'importe quelle enveloppe.
- L'utilisateur peut **supprimer** une sous-catégorie. Les transactions qui y étaient rattachées sont reclassées en **« Non catégorisé »** (catégorie virtuelle, présente dans chaque enveloppe, ni supprimable ni renommable).
- Les enveloppes elles-mêmes ne sont **pas** supprimables ni renommables (structure fixe imposée par la méthode).

### 2.3 Comptes

À la création du compte utilisateur, deux comptes existent par défaut :

- **Compte courant** (type : `checking`)
- **Épargne** (type : `savings`)

**Règles :**

- L'utilisateur peut **ajouter** un compte (libellé, solde initial, type).
- L'utilisateur peut **supprimer** un compte (avec confirmation si transactions associées).
- L'utilisateur peut **renommer** un compte.
- L'utilisateur peut **modifier le solde initial**. Le solde courant est recalculé : `solde initial + somme des transactions`.

### 2.4 Transactions

Une transaction représente un mouvement d'argent. Trois natures (`kind`) :

| Nature                     | Effet                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Dépense** (`expense`)    | Débite un compte, attribuée à une enveloppe + sous-catégorie                                                                          |
| **Revenu** (`income`)      | Crédite un compte, sans enveloppe. Peut porter une **catégorie de revenu** (ex. `salary`, `freelance`, `autre`)                       |
| **Transfert** (`transfer`) | Débite le compte source et crédite le compte cible. Peut être attribué à une enveloppe (ex. virement vers Livret A → Investissements) |

**Champs d'une transaction :**

- `id` (généré)
- `date` (ISO `YYYY-MM-DD`)
- `merchant` (libellé du commerçant ou de la description)
- `amount` (montant, négatif pour les dépenses, positif pour les revenus)
- `account` (compte source)
- `toAccount` (compte cible, transferts uniquement)
- `envelope` (`necessities` | `wants` | `investments` | `null` pour les revenus)
- `category` (id de la sous-catégorie, `null` pour les revenus)
- `incomeCategory` (revenus uniquement : `salary` | `freelance` | `autre` | …, extensible par l'utilisateur)
- `kind` (`expense` | `income` | `transfer`, défaut `expense`)
- `recurringId` (lien vers un paiement récurrent, optionnel)

### 2.5 Paiements récurrents

Modèle pour automatiser les transactions répétitives.

**Champs :**

- `id`, `merchant`, `amount`, `account`
- `frequency` : `weekly` | `monthly` | `yearly`
- `dayOfMonth` (pour `monthly`)
- `envelope`, `category` (sauf revenus)
- `kind` : `expense` | `income` | `transfer`
- `toAccount` (transferts)
- `nextDate` : prochaine date de déclenchement
- `active` : activable/désactivable sans suppression

**Comportement :**

- À la date prévue, génère automatiquement une transaction et reporte `nextDate` à la prochaine occurrence.
- Désactiver suspend les déclenchements futurs sans supprimer les historiques.

---

## 3. Vues / Écrans

L'application repose sur une **sidebar** de navigation persistante et une zone principale qui change selon la vue active.

### 3.1 Sidebar

- En-tête : logo + nom « Budget ».
- Navigation : Tableau de bord · Transactions · Récurrents · Statistiques.
- Section « Comptes » : liste de chaque compte avec son solde courant + bouton « modifier » (ouvre la modale Comptes).
- Ligne « Total tous comptes ».
- Pied : rappel de la méthode active (`50/30/20`).

### 3.2 Tableau de bord

Aperçu mensuel :

1. **Topbar** : salutation utilisateur, mois affiché (avec navigation `<` / `>`), bouton « Ajouter une transaction ».
2. **Hero metrics** (4 cartes) :
   - Reste à allouer ce mois-ci
   - Revenus du mois
   - Dépensé du mois (+ % du revenu)
   - Jours restants dans le mois (+ budget journalier disponible)
3. **Enveloppes** : 3 cartes (Nécessités / Envies / Investissements) avec :
   - Ratio cible
   - Dépensé / Budget
   - Barre de progression (rouge si dépassement)
   - Reste ou dépassement
4. **Détail des catégories** : onglets (une enveloppe à la fois), grille de tuiles avec dépense par sous-catégorie, barre relative, % de l'enveloppe consommé, bouton « Supprimer » et tuile « + Ajouter une catégorie ».

### 3.3 Transactions

- Topbar avec compteur et bouton « Ajouter ».
- Barre d'outils : recherche par commerçant + filtres pills par enveloppe (« Tout » + une par enveloppe).
- Liste **groupée par jour**, avec total de chaque jour. Chaque ligne :
  - Avatar (initiale du commerçant ou flèche pour transferts)
  - Libellé + badge « Récurrent » si applicable
  - Sous-catégorie (ou flèche `compte source → compte cible` pour les transferts)
  - Tag de l'enveloppe
  - Compte
  - Montant signé (vert si revenu)

### 3.4 Récurrents

- Topbar : nombre d'actifs + total des charges fixes mensuelles.
- Bloc résumé : engagements mensuels par enveloppe + total.
- Bloc « Solde net mensuel » : `salaire mensuel − charges fixes` (le salaire est identifié comme un revenu récurrent dont `incomeCategory == "salary"`).
- Liste : tous les récurrents (triés par montant décroissant), avec libellé, fréquence, prochaine date, compte, montant signé, **toggle actif/inactif**.

### 3.5 Statistiques

- Hero (4 cartes) : Dépensé du mois, Moyenne mensuelle, Épargné cumulé, Score de conformité 50/30/20.
- **Évolution mensuelle** (6 mois) : barres empilées (Nécessités + Envies + Investissements) par mois.
- **Donut de répartition du mois** : part de chaque enveloppe sur les dépenses du mois + légende détaillée (montant, %, budget cible).
- **Top catégories** : 6 sous-catégories les plus dépensières du mois, triées.

### 3.6 Modales

**AddTxModal** — Ajouter une transaction

- Onglets : Dépense / Transfert / Revenu.
- Champs adaptatifs selon l'onglet (montant, libellé, depuis/vers, enveloppe, catégorie, compte, date).
- Toggle « Paiement récurrent » → sélecteur de fréquence.
- Boutons : Annuler / Ajouter (label change selon le mode).

**AccountsModal** — Gérer les comptes

- Liste éditable : libellé, solde, suppression.
- Bouton « Ajouter un compte ».
- Boutons : Annuler / Enregistrer.

---

## 4. Règles de calcul

- **Revenu du mois (`monthlyIncome`)** = somme des transactions `kind == "income"` du mois courant. Le revenu est **variable d'un mois à l'autre** ; il n'y a pas de revenu de référence figé.
- **Budget d'une enveloppe** = `monthlyIncome × ratio / 100` (recalculé dès qu'un revenu est ajouté/modifié sur le mois).
- **Dépensé d'une enveloppe (mois courant)** = somme des `|amount|` des transactions du mois où `envelope == enveloppe.id` et `kind != "income"`.
- **Reste d'une enveloppe** = `budget − dépensé`. Si négatif → dépassement (UI rouge).
- **Reste à allouer** = `monthlyIncome − totalSpent`.
- **Solde courant d'un compte** = `initial + Σ(transactions du compte)` (les transferts débitent le compte source et créditent le compte cible).
- **Score de conformité 50/30/20** : à définir précisément. Indication actuelle : ratio entre l'écart effectif et l'écart cible.

---

## 5. Modèle de données

### 5.1 Entités

```
User
  id, email, name
  ratios { necessities, wants, investments }   // somme = 100

Envelope (fixe : 3 enveloppes, non supprimables)
  id (necessities|wants|investments)
  label, pct, color
  categories[]

Category
  id, label, icon
  envelopeId

Account
  id, label, balance, initial
  type (checking|savings)

Transaction
  id, date, merchant, amount
  account, toAccount?
  envelope?, category?
  incomeCategory?            // revenus uniquement (salary|freelance|autre|…)
  kind (expense|income|transfer)
  recurringId?

Recurring
  id, merchant, amount
  frequency, dayOfMonth
  account, toAccount?
  envelope?, category?
  kind, nextDate, active
```

### 5.2 Initialisation à la création d'un utilisateur

1. Créer les 3 enveloppes avec les ratios par défaut (50/30/20) et les sous-catégories par défaut (cf. §2.2), plus la catégorie virtuelle « Non catégorisé » dans chacune.
2. Créer 2 comptes : « Compte courant » (checking) et « Épargne » (savings), solde initial 0.
3. Aucun revenu n'est saisi : tant qu'aucune transaction `income` n'existe sur le mois, les budgets d'enveloppes valent 0.

---

## 6. Stack technique

La maquette actuelle utilise React 18 via UMD + Babel standalone (prototype navigateur uniquement, état en mémoire) — elle sert de **référence visuelle et fonctionnelle uniquement**, le code de production est réécrit.

### 6.1 Choix retenus

| Couche                      | Choix                           | Rôle                                                                                                          |
| --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Framework full-stack**    | **SvelteKit**                   | UI + endpoints serveur dans un seul process (`+page.svelte`, `+page.server.ts`, `+server.ts`, _form actions_) |
| **Base de données**         | **SQLite** via **`bun:sqlite`** | Fichier local, accès synchrone natif au runtime                                                               |
| **ORM / requêtes**          | **Drizzle ORM**                 | Schéma typé, migrations (`drizzle-kit`), requêtes SQL-like en TS                                              |
| **Authentification**        | **better-auth**                 | Email + mot de passe uniquement. Sessions persistées en SQLite. Modules OAuth/2FA non activés.                |
| **Langage**                 | **TypeScript strict**           | Types partagés entre client et serveur via les `load`/`actions` de SvelteKit                                  |
| **Runtime**                 | **Bun**                         | Exécution serveur (Vite dev + prod via `@sveltejs/adapter-bun` ou `adapter-node` exécuté avec Bun)            |
| **Gestionnaire de paquets** | **pnpm**                        | Aucune commande `npm` / `yarn` / `bun install` dans le projet                                                 |
| **Build / dev**             | **Vite** (intégré à SvelteKit)  | —                                                                                                             |

### 6.2 Tests

- **Vitest** : tests unitaires sur les calculs de budget (purs, sans dépendance UI).
- **Playwright** : tests end-to-end sur les flux critiques (création de transaction, déclenchement d'un récurrent, calcul du reste à allouer).

### 6.3 Internationalisation

- Langue : **FR** uniquement en V1.
- Devise : **EUR** uniquement en V1, formatage via `Intl.NumberFormat`.

### 6.4 Déploiement

- Cible : un process Bun + un fichier SQLite à côté.
- Adapter SvelteKit : **`@sveltejs/adapter-bun`** privilégié. `adapter-node` exécuté sous Bun reste un fallback si besoin. Les adapters serverless (Vercel/CF) ne conviennent pas à un SQLite fichier.

---

## 7. Glossaire

- **Enveloppe** : l'une des trois grandes catégories budgétaires (Nécessités, Envies, Investissements).
- **Sous-catégorie** (ou catégorie) : subdivision d'une enveloppe (ex. Logement, Transports…).
- **Récurrent** : modèle de transaction qui se déclenche périodiquement.
- **DCA** : Dollar Cost Averaging — investissement programmé.
