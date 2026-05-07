# Budget — Roadmap d'implémentation

> Plan d'attaque détaillé pour porter la maquette en application SvelteKit fullstack. Chaque tâche est cochable au fur et à mesure.

---

## 0. Mise en place du projet

### 0.1 Tooling de base

- [x] Installer Bun (`curl -fsSL https://bun.sh/install | bash`) et vérifier `bun --version`.
- [x] Installer pnpm (`npm i -g pnpm` ou via Corepack).
- [x] Initialiser le projet SvelteKit via `pnpm dlx sv create . --template minimal --types ts --add prettier --add eslint --add vitest=usages:unit --add playwright --install pnpm`.
- [x] Pin `"packageManager": "pnpm@10.33.0"` dans `package.json`.
- [x] Ajouter `engines` (`bun >=1.3.0`, `node >=20.0.0`) dans `package.json`.
- [x] Lockfile `pnpm-lock.yaml` généré par le scaffolding.
- [x] `pnpm dev` démarre Vite, la page d'accueil SvelteKit répond en HTTP 200.

### 0.2 Configuration SvelteKit

- [x] Adapter Bun activé dans `svelte.config.js` via `svelte-adapter-bun` (l'officiel `@sveltejs/adapter-bun` n'existe pas — `svelte-adapter-bun` est le package communautaire de référence). `@sveltejs/adapter-auto` retiré.
- [x] TypeScript strict + `noUncheckedIndexedAccess: true` dans `tsconfig.json` (`pnpm check` passe).
- [x] Dossiers `src/lib/{db,server,domain,ui}` créés avec `.gitkeep` — accessibles via `$lib/db/...`, `$lib/server/...`, etc. (résolution `$lib` par défaut de SvelteKit).
- [x] ESLint + `eslint-plugin-svelte` déjà actifs ; ajout de `eslint-plugin-simple-import-sort` (règles `simple-import-sort/imports` + `/exports`). Prettier + `.prettierignore` étendu (`Maquette/`, `.claude/`, `.svelte-kit/`, `build/`).

### 0.3 Hygiène du dépôt

- [x] `.gitignore` enrichi (SQLite : `/data/`, `*.db`, `*.sqlite*`, `*-journal/wal/shm`). Le `.gitignore` scaffoldé couvrait déjà `node_modules`, `.svelte-kit`, `build`, `.env*`.
- [x] `.env.example` créé (`ORIGIN`, `DATABASE_URL`, `BETTER_AUTH_SECRET`).
- [x] `README.md` réécrit (Budget-spécifique, table des commandes pnpm, lien vers SPECIFICATIONS/TODO).
- [x] Husky 9 + lint-staged installés. `.husky/pre-commit` lance `pnpm exec lint-staged` ; config `lint-staged` dans `package.json` (eslint --fix + prettier --write sur JS/TS/Svelte, prettier seul sur md/json/yml/css/html). Script `prepare` étendu pour brancher husky.
- [x] GitHub Actions `.github/workflows/ci.yml` : checkout → setup-bun → setup-pnpm → setup-node (cache pnpm) → `pnpm install --frozen-lockfile` → `check` → `lint` → `test:unit` → `build`.

---

## 1. Base de données (SQLite + Drizzle)

### 1.1 Setup

- [x] `drizzle-orm` (runtime) + `drizzle-kit` (dev) installés. `@types/bun` ajouté pour la résolution TS du builtin `bun:sqlite`.
- [x] `src/lib/server/db/client.ts` créé : instancie `bun:sqlite` (création auto de `data/`), pose les pragmas, expose `db` (Drizzle) et `sqlite` (handle brut). Lit `process.env.DATABASE_URL` pour rester importable depuis des scripts standalones.
- [x] `drizzle.config.ts` créé (dialect `sqlite`, schéma `src/lib/server/db/schema.ts`, migrations dans `./drizzle/`, `strict + verbose`). `schema.ts` est un placeholder vide en attendant 1.2.
- [x] `PRAGMA journal_mode = WAL` + `PRAGMA foreign_keys = ON` activés au démarrage. Smoke test sous Bun confirmé (`journal_mode=wal`, `foreign_keys=1`, `SELECT 1` OK, instance Drizzle valide).
- [x] **Bonus** : scripts `dev`/`build`/`preview` passés à `bun --bun vite ...` pour que `bun:sqlite` soit disponible dans le runtime SvelteKit. Scripts `db:generate` / `db:migrate` / `db:studio` exposés. `/drizzle/` ajouté à `.prettierignore` (géré par drizzle-kit).

### 1.2 Schéma Drizzle (`src/lib/server/db/schema.ts`)

- [x] Tables `user`, `session`, `account_auth`, `verification` (better-auth). Renommage `account` → `account_auth` pour éviter le conflit avec la table comptes bancaires (sera mappé via la config better-auth en 2.1).
- [x] Table `account` (bancaire) : `id`, `userId`, `label`, `initialBalanceCents`, `type` (`checking`|`savings`), `createdAt`.
- [x] Table `envelope` : `id`, `userId`, `key`, `label`, `ratio`, `color`, `position`. **Unique (`userId`, `key`)**.
- [x] Table `category` : `id`, `userId`, `envelopeId`, `label`, `icon`, `position`, `isVirtual`.
- [x] Table `transaction` : tous les champs spécifiés, `kind` enum, `recurringId` FK auto-référencée (recurring déclaré avant transaction pour éviter le forward-ref).
- [x] Table `recurring` : tous les champs spécifiés.
- [x] Index : `tx_user_date_idx`, `tx_user_envelope_date_idx`, `rec_user_active_next_idx`, plus uniques générés par les `.unique()` (email, token, envelope key).
- [x] FKs : `ON DELETE cascade` sur user→toutes-tables, account→transaction/recurring (côté `accountId`), envelope→category. `SET NULL` sur `toAccountId`, `envelopeId`, `categoryId`, `recurringId` (transactions historiques préservées).
- [x] Tous les montants en **centimes (integer signé)** : `initialBalanceCents`, `amountCents`.
- [x] **Bonus** : runner de migrations custom `src/lib/server/db/migrate.ts` (drizzle-kit ne supporte pas `bun:sqlite` — on utilise `drizzle-orm/bun-sqlite/migrator` qui réutilise notre `client.ts`). Migration `0000_*.sql` générée et validée sur DB jetable (FKs enforced, cascade OK, booleans OK).

### 1.3 Migrations + seed

- [x] Première migration générée et committée en 1.2 (`drizzle/0000_slippery_apocalypse.sql`).
- [x] `src/hooks.server.ts` applique les migrations au boot du serveur SvelteKit (`drizzle-orm/bun-sqlite/migrator`, idempotent). Vérifié : `data/budget.db` créée + journal `__drizzle_migrations` rempli au premier hit HTTP.
- [x] `src/lib/server/db/seed.ts` + script `pnpm db:seed` : crée le user `demo@budget.local`, appelle `initUserData`, insère **25 transactions** + **9 récurrents** portés depuis `Maquette/data.jsx` (montants en centimes, dates conservées, liens `recurringId` rétablis). Idempotent (drop + recreate).
- [x] `src/lib/server/initUserData.ts` : helper transactionnel qui provisionne 3 enveloppes (50/30/20, couleurs OKLCH de la maquette), leurs sous-catégories par défaut, la catégorie virtuelle `Non catégorisé` (`isVirtual=true`, position 9999) dans chaque enveloppe, et les 2 comptes par défaut.
- Validation end-to-end : migrate → seed → 25 tx, 9 rec, 16 catégories réelles, 3 virtuelles, 1 income tagué `salary`, 1 transfert, 7 tx liées à un récurrent. Re-seed → toujours 25 tx (pas de duplication).

---

## 2. Authentification (better-auth)

### 2.1 Setup

- [ ] `pnpm add better-auth`.
- [ ] Créer `src/lib/server/auth.ts` : config `betterAuth({ database, emailAndPassword: { enabled: true } })`.
- [ ] Connecter l'adapter Drizzle de better-auth au schéma SQLite.
- [ ] Générer/synchroniser les tables d'auth via `better-auth` CLI ou migrations Drizzle.
- [ ] Définir `BETTER_AUTH_SECRET` dans `.env` (32+ octets aléatoires).

### 2.2 Routes & UI

- [ ] Endpoint catch-all `src/routes/api/auth/[...auth]/+server.ts` qui délègue à better-auth.
- [ ] Hook `src/hooks.server.ts` : injecte `event.locals.user` et `event.locals.session` à partir du cookie de session.
- [ ] Page `/login` (form action, errors visibles).
- [ ] Page `/register` (form action, validation côté serveur, déclenche `initUserData`).
- [ ] Bouton/route `/logout`.
- [ ] Garde de routes : middleware qui redirige vers `/login` si pas de session pour toutes les routes hors `/login`, `/register`, `/api/auth/*`.

### 2.3 Sécurité

- [ ] Cookies `httpOnly`, `secure` en prod, `sameSite=lax`.
- [ ] Rate-limit basique sur `/login` (ex. 5 essais / 10 min / IP).
- [ ] Validation des entrées avec **Zod** (`pnpm add zod`).

---

## 3. Couche domaine (logique métier pure)

> But : isoler les calculs de budget dans des fonctions pures, faciles à tester unitairement.

### 3.1 Modules `src/lib/domain/`

- [ ] `money.ts` : conversions cents ↔ euros, formatage `Intl.NumberFormat('fr-FR', { currency: 'EUR' })`.
- [ ] `dates.ts` : helpers mois courant, début/fin de mois, libellés FR (`Janvier`, `Lun 12 Mai`…).
- [ ] `budget.ts` :
  - [ ] `monthIncome(transactions, year, month)` → somme des `kind == 'income'`.
  - [ ] `envelopeBudget(income, ratio)` → `income * ratio / 100`.
  - [ ] `envelopeSpent(transactions, envelopeId, year, month)`.
  - [ ] `envelopeRemaining(budget, spent)`.
  - [ ] `monthSummary(transactions, ratios, year, month)` → tout en un seul passage (perf).
- [ ] `accounts.ts` :
  - [ ] `accountBalance(account, transactions)` (gère transferts).
- [ ] `recurring.ts` :
  - [ ] `nextOccurrence(recurring, fromDate)`.
  - [ ] `dueRecurrings(recurrings, today)` → liste à matérialiser.
  - [ ] `materialize(recurring, date)` → produit une `Transaction`.
- [ ] `compliance.ts` : score de conformité 50/30/20 (formule à arrêter — voir §7).

### 3.2 Tests unitaires (Vitest)

- [ ] Test `money` (arrondis, format FR).
- [ ] Test `monthIncome` avec transactions multi-mois et incomes mixtes.
- [ ] Test `envelopeBudget` quand income = 0.
- [ ] Test `envelopeRemaining` négatif (dépassement).
- [ ] Test transferts dans `accountBalance` (débit source + crédit cible).
- [ ] Test `nextOccurrence` pour `weekly`, `monthly` (avec `dayOfMonth` sur fin de mois — gérer février), `yearly`.
- [ ] Test `materialize` : transaction générée a bien `recurringId`.

---

## 4. Couche serveur (services + endpoints)

### 4.1 Services `src/lib/server/services/`

- [ ] `accounts.service.ts` : CRUD comptes + recalcul du solde.
- [ ] `envelopes.service.ts` : lecture des enveloppes + mise à jour des ratios (validation : somme = 100).
- [ ] `categories.service.ts` : CRUD sous-catégories + reclassement vers « Non catégorisé » à la suppression.
- [ ] `transactions.service.ts` : CRUD transactions, filtre par mois/enveloppe/recherche, gestion des transferts.
- [ ] `recurring.service.ts` : CRUD récurrents, toggle, déclenchement.
- [ ] `stats.service.ts` : agrégations (6 mois de tendance, top catégories du mois, donut).

### 4.2 Schémas Zod (`src/lib/server/schemas/`)

- [ ] Schéma `transactionInput` (3 variantes : expense, transfer, income).
- [ ] Schéma `recurringInput`.
- [ ] Schéma `accountInput`.
- [ ] Schéma `categoryInput`.
- [ ] Schéma `ratiosInput` (refine : somme = 100).

### 4.3 Cron / déclencheur de récurrents

- [ ] Au démarrage du serveur : matérialiser les récurrents `active` dont `nextDate <= today` (rattrapage).
- [ ] Hook quotidien (setInterval simple ou job Bun) qui rejoue le check à minuit.
- [ ] Idempotence : ne pas créer deux fois la transaction d'un même `recurringId` pour la même `nextDate`.

---

## 5. UI — composants partagés

### 5.1 Design system

- [ ] Porter `Maquette/styles.css` dans `src/app.css` + tokens (variables CSS) en `src/lib/ui/tokens.css`.
- [ ] Composant `Icon.svelte` (porter `Maquette/icons.jsx`).
- [ ] Composants atomiques : `Button.svelte`, `Input.svelte`, `Select.svelte`, `Switch.svelte`, `Modal.svelte`, `Tabs.svelte`, `Pill.svelte`.
- [ ] Composant `Money.svelte` (formatage + signe).
- [ ] Composant `EnvelopeTag.svelte`.

### 5.2 Layout

- [ ] `src/routes/+layout.svelte` : sidebar + main, charge l'utilisateur depuis `locals`.
- [ ] `src/routes/+layout.server.ts` : précharge comptes + enveloppes pour la sidebar.
- [ ] `Sidebar.svelte` (port de `Maquette/sidebar.jsx`) : navigation + liste des comptes + total + bouton « modifier ».

---

## 6. Vues métier

### 6.1 Tableau de bord (`/`)

- [ ] `+page.server.ts` : charge transactions du mois, comptes, enveloppes, ratios.
- [ ] `Dashboard.svelte` : topbar (salutation, mois, navigation, bouton ajouter), 4 hero metrics, 3 cartes enveloppes.
- [ ] `CategoriesGrid.svelte` : onglets par enveloppe + grille de tuiles.
- [ ] Form action : `addCategory`, `removeCategory`.
- [ ] Navigation `<` / `>` mois (URL param `?m=YYYY-MM`).

### 6.2 Transactions (`/transactions`)

- [ ] `+page.server.ts` : recherche + filtre enveloppe en query params, pagination si nécessaire.
- [ ] `Transactions.svelte` : toolbar (recherche, filtres pills) + liste groupée par jour.
- [ ] Form action : suppression d'une transaction (avec confirmation).
- [ ] Bouton « Ajouter » → ouvre `AddTxModal`.

### 6.3 Récurrents (`/recurring`)

- [ ] `+page.server.ts` : charge récurrents + agrège par enveloppe.
- [ ] `Recurring.svelte` : résumé + bloc solde net mensuel + liste.
- [ ] Form action : `toggleRecurring`, `removeRecurring`.

### 6.4 Statistiques (`/stats`)

- [ ] `+page.server.ts` : calcule la tendance 6 mois, top catégories, donut.
- [ ] `Stats.svelte` : 4 hero + 2 graphiques (barres empilées + donut SVG) + top catégories.
- [ ] Donut : porter le SVG de la maquette en composant Svelte.

### 6.5 Modales

- [ ] `AddTxModal.svelte` (porter `Maquette/modals.jsx` AddTxModal). 3 onglets, validation Zod côté serveur via form action.
- [ ] `AccountsModal.svelte` (porter AccountsModal). Édition liste, ajout, suppression, sauvegarde via form action.
- [ ] Comportement : fermeture sur backdrop, échappement clavier, focus trap.

---

## 7. Calcul du score de conformité 50/30/20

- [ ] Décider de la formule (suggestion : `100 − Σ |ratioRéel − ratioCible|` plafonné à 0).
- [ ] Documenter dans `SPECIFICATIONS.md §4`.
- [ ] Implémenter dans `domain/compliance.ts`.
- [ ] Tester : ratios parfaits = 100 %, dépense uniquement Envies = score bas.

---

## 8. Tests d'intégration & E2E

### 8.1 Vitest (intégration server)

- [ ] Test `transactions.service` avec une DB SQLite en mémoire.
- [ ] Test du flux création utilisateur → `initUserData` → vérifier 3 enveloppes + catégories + 2 comptes.
- [ ] Test suppression catégorie → reclassement vers « Non catégorisé ».

### 8.2 Playwright (E2E)

- [ ] Scénario : inscription → connexion → ajouter une dépense → vérifier impact sur dashboard.
- [ ] Scénario : créer un récurrent → vérifier prochaine date affichée → désactiver.
- [ ] Scénario : effectuer un transfert entre comptes → vérifier soldes des deux comptes.
- [ ] Scénario : modifier un ratio (50/30/20 → 60/20/20) → budgets recalculés.

---

## 9. Polish & déploiement

### 9.1 Polish UI

- [ ] Vérifier responsive (mobile / tablette / desktop).
- [ ] États vides (aucune transaction, aucun récurrent, aucun compte).
- [ ] États d'erreur (form invalide, conflit serveur).
- [ ] États de chargement (skeleton sur le dashboard au premier load).
- [ ] Accessibilité : focus visible, labels ARIA sur icônes/toggles, navigation clavier complète.

### 9.2 Performance

- [ ] Vérifier le bundle JS (objectif < 100 ko gzip pour la home).
- [ ] Précharger les ressources critiques (`+layout.server.ts` pour la sidebar).
- [ ] Cache HTTP sur les assets statiques.

### 9.3 Déploiement

- [ ] `pnpm build` + `bun ./build/index.js` doit servir la prod en local.
- [ ] Choisir une cible (VPS, Render, Fly.io, Railway…) compatible avec un disque persistant pour le fichier SQLite.
- [ ] Backups automatiques du fichier SQLite (cron + copie hors-site).
- [ ] Variables d'env de prod (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `ORIGIN`).
- [ ] Domaine + HTTPS (Caddy / Cloudflare devant).

### 9.4 Observabilité

- [ ] Logs structurés (pino ou simple console JSON).
- [ ] Alerte basique si le process meurt (healthcheck HTTP).

---

## 10. Idées V2 (post-launch, hors périmètre actuel)

- [ ] Import CSV bancaire.
- [ ] Multi-devises.
- [ ] Catégorisation automatique par règles (regex sur `merchant`).
- [ ] Export CSV / PDF mensuel.
- [ ] Mode sombre.
- [ ] PWA installable + offline read-only.
