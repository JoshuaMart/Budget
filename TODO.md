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

- [x] `better-auth` + `zod` installés.
- [x] `src/lib/server/auth.ts` : `betterAuth({...})` avec `emailAndPassword.enabled = true`, `autoSignIn = true`, `minPasswordLength = 8`, `requireEmailVerification = false`.
- [x] Adapter Drizzle (`drizzleAdapter(db, { provider: 'sqlite', schema })`) ; mapping `account` → `accountAuth` pour résoudre le clash avec la table comptes bancaires.
- [x] Tables d'auth déjà couvertes par la migration `0000_*.sql` de 1.2 (user/session/account_auth/verification) — pas de migration supplémentaire.
- [x] `BETTER_AUTH_SECRET` généré localement dans `.env` (`openssl rand -base64 32`). `.env` reste gitignoré.

### 2.2 Routes & UI

- [x] Endpoint catch-all `src/routes/api/auth/[...all]/+server.ts` : délègue à `auth.handler(request)` pour GET et POST.
- [x] `src/hooks.server.ts` : `auth.api.getSession({ headers })` peuple `event.locals.user` et `event.locals.session`. `src/app.d.ts` typé en conséquence.
- [x] `+layout.server.ts` propage `data.user` à toutes les pages.
- [x] Page `/login` (Svelte 5 runes + Zod + `authClient.signIn.email`, redirige vers `?next=...`).
- [x] Page `/register` (Zod + `authClient.signUp.email`). `databaseHooks.user.create.after` exécute automatiquement `initUserData(userId)` à l'inscription (validé end-to-end : 3 envelopes + 19 cats + 2 accounts à la création).
- [x] Page `/logout` : appelle `authClient.signOut()` puis redirige vers `/login`.
- [x] Garde de routes dans `hooks.server.ts` : redirige vers `/login?next=...` si pas de session, sauf pour les préfixes publics (`/login`, `/register`, `/api/auth`). Validé : GET `/` anonyme → 303 vers `/login?next=%2F`.

### 2.3 Sécurité

- [x] Cookies `httpOnly + sameSite=lax + secure` (en prod via `NODE_ENV`). Vérifié : header `Set-Cookie: better-auth.session_token=…; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax`.
- [x] Rate-limit better-auth activé (`storage: 'memory'`), règles renforcées sur `/sign-in/email` et `/sign-up/email` (5 essais / 600 s).
- [x] Validation Zod côté client sur `/login` et `/register`. Better-auth applique aussi ses propres règles (longueur du mot de passe, format email).
- [x] Protection CSRF de better-auth active : POST sans `Origin` est rejeté avec 403 `MISSING_OR_NULL_ORIGIN` (le navigateur envoie l'Origin automatiquement).

---

## 3. Couche domaine (logique métier pure)

> But : isoler les calculs de budget dans des fonctions pures, faciles à tester unitairement.

### 3.1 Modules `src/lib/domain/`

- [x] `money.ts` : `toCents`/`toEuros` + `formatCents(cents, { signed?, compact? })` via `Intl.NumberFormat('fr-FR', currency:EUR)`. Compact arrondit à l'euro entier au-delà de 1000.
- [x] `dates.ts` : `parseIsoDate`/`toIsoDate` (sans drift UTC), `monthOf`, `isInMonth`, `monthLabel` ("Mai 2026"), `dayLabel` ("Lun 7 Mai"), `startOfMonth`/`endOfMonth`/`daysInMonth`, `daysRemainingInMonth`, `addMonths`.
- [x] `budget.ts` : `monthIncome`, `envelopeBudget`, `envelopeSpent`, `envelopeRemaining`, et `monthSummary` (single-pass : revenus + total dépensé + per-envelope + per-category).
- [x] `accounts.ts` : `accountBalance(account, transactions)` qui applique le signe des transactions sur `accountId` et crédite `toAccountId` pour les transferts.
- [x] `recurring.ts` : `nextOccurrence(frequency, dayOfMonth, fromIso)` (clamp jour 31 → fin de mois cible), `dueRecurrings`, `materialize(rec, date)` (signe correct selon `kind`, conserve `recurringId`).
- [x] `compliance.ts` : `complianceScore = max(0, 100 − Σ |ratioRéel − ratioCible|)`. 100 si rien dépensé ou ratios parfaits, 0 dans le pire cas.
- [x] `index.ts` réexporte tous les modules. Imports de types DB en `import type` (zéro runtime).

### 3.2 Tests unitaires (Vitest)

- [x] **46 tests sur 6 fichiers** (`money` 7, `dates` 12, `budget` 9, `accounts` 4, `recurring` 10, `compliance` 4). Tous verts.
- [x] `money` : arrondis half-up, signe, séparateur de milliers, mode compact, robustesse aux variations d'espaces Intl (NBSP/NNBSP) via `normalize`.
- [x] `monthIncome` : multi-mois, incomes mixtes, mois sans revenu.
- [x] `envelopeBudget` : `income = 0`, arrondi cent.
- [x] `envelopeRemaining` : dépassement négatif.
- [x] `accountBalance` : transferts (débit source + crédit cible), comptes étrangers ignorés.
- [x] `nextOccurrence` : weekly, monthly (jour 31 → fév 28/29 année bissextile, 30 avril), yearly.
- [x] `materialize` : signes par `kind`, `recurringId` conservé.
- [x] **Bonus** : suppression de `src/lib/vitest-examples/` (placeholder du scaffold).

---

## 4. Couche serveur (services + endpoints)

### 4.1 Services `src/lib/server/services/`

- [x] `accounts.service.ts` : `listAccounts`, `listAccountsWithBalance` (utilise `accountBalance` du domaine), `createAccount`, `updateAccount`, `deleteAccount` (cascade FK).
- [x] `envelopes.service.ts` : `listEnvelopes`, `updateRatios` (transactionnel ; validation 100 % faite au niveau Zod).
- [x] `categories.service.ts` : `listCategories`, `createCategory`, `updateCategory`, `deleteCategory` qui réassigne les transactions/recurrents à la catégorie virtuelle « Non catégorisé » de l'enveloppe avant la suppression (refuse de supprimer la catégorie virtuelle).
- [x] `transactions.service.ts` : `listTransactions(userId, { year?, month?, envelopeId?, merchantSearch? })` (tri date desc + createdAt desc), `createTransaction` / `updateTransaction` qui appliquent automatiquement le signe selon `kind`, `deleteTransaction`.
- [x] `recurring.service.ts` : `listRecurrings`, `create/update/toggle/deleteRecurring`, plus `runDueRecurrings(now)` exporté pour le scheduler.
- [x] `stats.service.ts` : `monthlyTrend(userId, anchor, count)`, `topCategories(userId, ym, limit)`, `envelopeDonut(userId, ym, ratios)`.
- [x] `services/index.ts` réexporte les modules en namespaces (`services.accounts.list...`).

### 4.2 Schémas Zod (`src/lib/server/schemas/`)

- [x] `transactionInput` : `discriminatedUnion('kind', [expense, transfer, income])` avec date ISO `YYYY-MM-DD`, montants en centimes positifs (le service applique le signe).
- [x] `recurringInput` : même union étendue avec `frequency`, `dayOfMonth`, `nextDate`.
- [x] `accountInput` : `label`, `type ∈ {checking,savings}`, `initialBalanceCents` (default 0).
- [x] `categoryInput` : `envelopeId`, `label`, `icon?`.
- [x] `ratiosInput` : trois entiers 0–100, `refine` qui rejette si la somme ≠ 100.
- [x] Tous exposés depuis `schemas/index.ts`.

### 4.3 Cron / déclencheur de récurrents

- [x] `runDueRecurrings(now)` (dans `recurring.service.ts`) : boucle tant qu'il reste des récurrents `active` avec `nextDate <= today`. À chaque itération, matérialise la transaction (si pas déjà présente pour ce `(recurringId, date)` — **idempotent**), avance `nextDate` via `nextOccurrence` du domaine. Garde-fou de 1000 itérations contre les boucles infinies.
- [x] `recurringScheduler.ts` : `startRecurringScheduler()` exécute `runDueRecurrings` au boot, puis un `setInterval` 24 h. Flag `started` pour ne pas empiler plusieurs timers en HMR. `unref()` pour ne pas bloquer la fermeture du process.
- [x] Branché dans `src/hooks.server.ts` après les migrations.
- [x] Idempotence : `INSERT INTO transaction` est conditionné à l'absence de ligne `(recurringId, date)` existante dans la même transaction Drizzle.
- Validation manuelle : récurrent « Loyer » backdaté à 2026-04-01 → `runDueRecurrings(2026-05-07)` insère la tx du 04-01, skippe celle du 05-01 (déjà seedée), avance `nextDate` à 06-01. Comportement attendu.

---

## 5. UI — composants partagés

### 5.1 Design system

- [x] `Maquette/styles.css` (1475 lignes) splité : `src/lib/ui/tokens.css` (35 lignes — toutes les variables CSS du `:root`) + `src/app.css` (le reste, importe `tokens.css`).
- [x] Fonts (`Inter` 400/500/600/700 + `JetBrains Mono` 400/500/600) chargées via `<link>` dans `app.html`. Lang `fr`.
- [x] `Icon.svelte` : 15 icônes portées de `Maquette/icons.jsx` via `{#if name === ...}` typé par l'union `IconName`.
- [x] Composants atomiques dans `$lib/ui/` : `Button` (variants `primary`/`ghost`), `Input` (label + erreur), `Select` (générique sur la valeur), `Switch` (toggle .rec-toggle), `Modal` (backdrop + close + escape), `Tabs` (modal-tabs), `Pill` (`tx-filter-pill` + variant enveloppe).
- [x] `Money.svelte` enveloppe `formatCents(cents, { signed?, compact? })` du domaine.
- [x] `EnvelopeTag.svelte` : tag avec dot, classe `env-<key>` qui injecte les `--env*`.
- [x] `$lib/ui/index.ts` réexporte tout pour des imports concis.

### 5.2 Layout

- [x] `src/routes/+layout.server.ts` : précharge `accounts` (avec solde calculé) et `envelopes` pour les utilisateurs authentifiés ; renvoie des arrays vides sinon (pages publiques).
- [x] `src/routes/+layout.svelte` : importe `app.css`, conditionne sur `data.user` — sidebar + `<main class="main">` si connecté, juste `{@render children()}` sinon (les pages `/login` et `/register` gardent leur propre auth-shell).
- [x] `Sidebar.svelte` : port de `Maquette/sidebar.jsx`. Brand, nav typée via `resolve()`, liste des comptes avec `Money`, total tous comptes calculé via `$derived`, footer + lien `Se déconnecter`. `isActive` highlight via `page.url.pathname`. Prop `onEditAccounts` optionnelle (sera câblée à la modale en section 6).
- [x] Stubs `+page.svelte` créés pour `/transactions`, `/recurring`, `/stats` (placeholders « Vue à venir en section 6 ») afin de satisfaire le typage `resolve()` ; le scaffold `/demo` est supprimé.
- Validation : login démo → home avec sidebar (Bonjour Camille + 3 nav items + 2 comptes + total + lien logout), `/transactions` 200 avec sidebar, `/login` 200 sans sidebar (auth-card visible).

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
