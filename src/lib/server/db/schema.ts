import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const cuid = () =>
	text()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

const now = () =>
	integer({ mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date());

// ============================================================
// Auth — required by better-auth.
// The auth-side "account" table is renamed account_auth to avoid
// clashing with the bank account table below (mapped via better-auth
// schema config in src/lib/server/auth.ts).
// ============================================================

export const user = sqliteTable('user', {
	id: cuid(),
	email: text().notNull().unique(),
	emailVerified: integer({ mode: 'boolean' }).notNull().default(false),
	name: text().notNull(),
	image: text(),
	createdAt: now(),
	updatedAt: now()
});

export const session = sqliteTable('session', {
	id: cuid(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	token: text().notNull().unique(),
	expiresAt: integer({ mode: 'timestamp' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	createdAt: now(),
	updatedAt: now()
});

export const accountAuth = sqliteTable('account_auth', {
	id: cuid(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accountId: text().notNull(),
	providerId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: integer({ mode: 'timestamp' }),
	refreshTokenExpiresAt: integer({ mode: 'timestamp' }),
	scope: text(),
	password: text(),
	createdAt: now(),
	updatedAt: now()
});

export const verification = sqliteTable('verification', {
	id: cuid(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: integer({ mode: 'timestamp' }).notNull(),
	createdAt: now(),
	updatedAt: now()
});

// ============================================================
// Budget domain
// ============================================================

export const account = sqliteTable('account', {
	id: cuid(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	label: text().notNull(),
	initialBalanceCents: integer().notNull().default(0),
	type: text({ enum: ['checking', 'savings'] })
		.notNull()
		.default('checking'),
	createdAt: now()
});

export const envelope = sqliteTable(
	'envelope',
	{
		id: cuid(),
		userId: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		key: text({ enum: ['necessities', 'wants', 'investments'] }).notNull(),
		label: text().notNull(),
		ratio: integer().notNull(),
		color: text().notNull(),
		position: integer().notNull().default(0)
	},
	(t) => [uniqueIndex('envelope_user_key_unique').on(t.userId, t.key)]
);

export const category = sqliteTable('category', {
	id: cuid(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	envelopeId: text()
		.notNull()
		.references(() => envelope.id, { onDelete: 'cascade' }),
	label: text().notNull(),
	icon: text(),
	position: integer().notNull().default(0),
	// Virtual category ("Non catégorisé") that hosts orphan transactions
	// after a real category is deleted. Cannot be deleted or renamed.
	isVirtual: integer({ mode: 'boolean' }).notNull().default(false)
});

// recurring is declared before transaction so transaction.recurringId
// can reference recurring.id without a forward declaration hack.
export const recurring = sqliteTable(
	'recurring',
	{
		id: cuid(),
		userId: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		merchant: text().notNull(),
		amountCents: integer().notNull(),
		frequency: text({ enum: ['weekly', 'monthly', 'yearly'] }).notNull(),
		dayOfMonth: integer(),
		accountId: text()
			.notNull()
			.references(() => account.id, { onDelete: 'cascade' }),
		toAccountId: text().references(() => account.id, { onDelete: 'set null' }),
		envelopeId: text().references(() => envelope.id, { onDelete: 'set null' }),
		categoryId: text().references(() => category.id, { onDelete: 'set null' }),
		incomeCategory: text(),
		kind: text({ enum: ['expense', 'income', 'transfer'] }).notNull(),
		nextDate: text().notNull(),
		active: integer({ mode: 'boolean' }).notNull().default(true)
	},
	(t) => [index('rec_user_active_next_idx').on(t.userId, t.active, t.nextDate)]
);

export const transaction = sqliteTable(
	'transaction',
	{
		id: cuid(),
		userId: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// ISO YYYY-MM-DD; stored as text for trivial range queries.
		date: text().notNull(),
		merchant: text().notNull(),
		// Signed cents: negative = debit, positive = credit.
		amountCents: integer().notNull(),
		accountId: text()
			.notNull()
			.references(() => account.id, { onDelete: 'cascade' }),
		toAccountId: text().references(() => account.id, { onDelete: 'set null' }),
		envelopeId: text().references(() => envelope.id, { onDelete: 'set null' }),
		categoryId: text().references(() => category.id, { onDelete: 'set null' }),
		incomeCategory: text(),
		kind: text({ enum: ['expense', 'income', 'transfer'] })
			.notNull()
			.default('expense'),
		recurringId: text().references(() => recurring.id, { onDelete: 'set null' }),
		createdAt: now()
	},
	(t) => [
		index('tx_user_date_idx').on(t.userId, t.date),
		index('tx_user_envelope_date_idx').on(t.userId, t.envelopeId, t.date)
	]
);

// ============================================================
// Net worth (patrimoine)
// ============================================================

export const holding = sqliteTable(
	'holding',
	{
		id: cuid(),
		userId: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		assetClass: text({ enum: ['etf', 'stock', 'crypto'] }).notNull(),
		// Free-form wrapper the position lives in: "PEA", "CTO", "Ledger"…
		wallet: text().notNull(),
		// Quote identifier: Yahoo Finance ticker (CW8.PA, AAPL) for ETFs and
		// stocks, CoinGecko coin id (bitcoin, solana) for crypto.
		symbol: text().notNull(),
		label: text().notNull(),
		// Fractional units (0.0123 BTC) — the one place we don't use integers.
		quantity: real().notNull(),
		// Average unit cost (PRU) and last fetched unit price, in euro cents.
		// Fractional on purpose: a unit can be worth far less than a cent
		// (memecoins); only aggregated position values get rounded.
		// PRU is optional: null means unknown, and the position is left out
		// of gain computations.
		avgCostCents: real(),
		lastPriceCents: real(),
		lastPriceAt: integer({ mode: 'timestamp' }),
		createdAt: now()
	},
	(t) => [index('holding_user_idx').on(t.userId)]
);

// One row per user per day, written when prices are refreshed; feeds the
// net worth history chart.
export const netWorthSnapshot = sqliteTable(
	'net_worth_snapshot',
	{
		id: cuid(),
		userId: text()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// ISO YYYY-MM-DD.
		date: text().notNull(),
		holdingsCents: integer().notNull(),
		investedCents: integer().notNull(),
		cashCents: integer().notNull()
	},
	(t) => [uniqueIndex('nws_user_date_unique').on(t.userId, t.date)]
);

// ============================================================
// Inferred types (used by services)
// ============================================================

export type User = typeof user.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Envelope = typeof envelope.$inferSelect;
export type Category = typeof category.$inferSelect;
export type Transaction = typeof transaction.$inferSelect;
export type Recurring = typeof recurring.$inferSelect;
export type Holding = typeof holding.$inferSelect;
export type NetWorthSnapshot = typeof netWorthSnapshot.$inferSelect;
