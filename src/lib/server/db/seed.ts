// Seed a demo user with the data shown in the React mockup (Maquette/).
// Idempotent: drops the demo user (and cascaded data) before re-inserting.
//
// Run with: pnpm db:seed
//
// The demo account uses better-auth's signUpEmail so the password is
// hashed and the account_auth row is created — login works immediately.

import { and, eq } from 'drizzle-orm';

import { auth } from '../auth';
import { db, sqlite } from './client';
import { account, category, envelope, recurring, transaction, user } from './schema';

const DEMO_EMAIL = 'demo@budget.local';
const DEMO_PASSWORD = 'Budget123!';
const DEMO_NAME = 'Camille Démo';

type Env = 'necessities' | 'wants' | 'investments';
type Kind = 'expense' | 'income' | 'transfer';
type Acc = 'courant' | 'epargne';

interface SeedRecurring {
	key: string; // local ref shared with seed transactions
	merchant: string;
	amount: number; // euros
	dayOfMonth: number;
	envelope?: Env;
	category?: string;
	account: Acc;
	toAccount?: Acc;
	kind: Kind;
	nextDate: string;
	incomeCategory?: string;
}

interface SeedTransaction {
	date: string;
	merchant: string;
	amount: number; // euros (signed: negative for expense/transfer, positive for income)
	envelope?: Env;
	category?: string;
	account: Acc;
	toAccount?: Acc;
	kind?: Kind;
	incomeCategory?: string;
	recurringKey?: string;
}

const RECURRINGS: SeedRecurring[] = [
	{
		key: 'r1',
		merchant: 'Loyer',
		amount: 980,
		dayOfMonth: 1,
		envelope: 'necessities',
		category: 'Logement',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-01'
	},
	{
		key: 'r2',
		merchant: 'EDF',
		amount: 89,
		dayOfMonth: 2,
		envelope: 'necessities',
		category: 'Logement',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-02'
	},
	{
		key: 'r3',
		merchant: 'Orange Mobile',
		amount: 29.99,
		dayOfMonth: 19,
		envelope: 'necessities',
		category: 'Logement',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-05-19'
	},
	{
		key: 'r4',
		merchant: 'Netflix',
		amount: 13.49,
		dayOfMonth: 5,
		envelope: 'wants',
		category: 'Abonnements',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-05'
	},
	{
		key: 'r5',
		merchant: 'Spotify Family',
		amount: 17.99,
		dayOfMonth: 2,
		envelope: 'wants',
		category: 'Abonnements',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-02'
	},
	{
		key: 'r6',
		merchant: 'iCloud+',
		amount: 2.99,
		dayOfMonth: 28,
		envelope: 'wants',
		category: 'Abonnements',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-05-28'
	},
	{
		key: 'r7',
		merchant: 'DCA Trade Republic',
		amount: 300,
		dayOfMonth: 3,
		envelope: 'investments',
		category: 'Actions',
		account: 'courant',
		kind: 'expense',
		nextDate: '2026-06-03'
	},
	{
		key: 'r8',
		merchant: 'Virement Livret A',
		amount: 200,
		dayOfMonth: 1,
		envelope: 'investments',
		category: 'Matelas de sécurité',
		account: 'courant',
		toAccount: 'epargne',
		kind: 'transfer',
		nextDate: '2026-06-01'
	},
	{
		key: 'r9',
		merchant: 'SALAIRE — ACME Corp',
		amount: 3200,
		dayOfMonth: 2,
		account: 'courant',
		kind: 'income',
		incomeCategory: 'salary',
		nextDate: '2026-06-02'
	}
];

const TRANSACTIONS: SeedTransaction[] = [
	{
		date: '2026-05-05',
		merchant: 'Carrefour Market',
		amount: -68.4,
		envelope: 'necessities',
		category: 'Alimentation et boissons',
		account: 'courant'
	},
	{
		date: '2026-05-05',
		merchant: 'Netflix',
		amount: -13.49,
		envelope: 'wants',
		category: 'Abonnements',
		account: 'courant',
		recurringKey: 'r4'
	},
	{
		date: '2026-05-04',
		merchant: 'Uber',
		amount: -14.2,
		envelope: 'necessities',
		category: 'Transports',
		account: 'courant'
	},
	{
		date: '2026-05-04',
		merchant: 'Le Petit Bistro',
		amount: -42,
		envelope: 'wants',
		category: 'Sorties et Restaurants',
		account: 'courant'
	},
	{
		date: '2026-05-03',
		merchant: 'Virement DCA Trade Republic',
		amount: -300,
		envelope: 'investments',
		category: 'Actions',
		account: 'courant',
		recurringKey: 'r7'
	},
	{
		date: '2026-05-03',
		merchant: 'Boulangerie Marie',
		amount: -8.5,
		envelope: 'necessities',
		category: 'Alimentation et boissons',
		account: 'courant'
	},
	{
		date: '2026-05-02',
		merchant: 'Spotify Family',
		amount: -17.99,
		envelope: 'wants',
		category: 'Abonnements',
		account: 'courant',
		recurringKey: 'r5'
	},
	{
		date: '2026-05-02',
		merchant: 'EDF',
		amount: -89,
		envelope: 'necessities',
		category: 'Logement',
		account: 'courant',
		recurringKey: 'r2'
	},
	{
		date: '2026-05-02',
		merchant: 'SALAIRE — ACME Corp',
		amount: 3200,
		kind: 'income',
		incomeCategory: 'salary',
		account: 'courant',
		recurringKey: 'r9'
	},
	{
		date: '2026-05-01',
		merchant: 'Loyer Mai',
		amount: -980,
		envelope: 'necessities',
		category: 'Logement',
		account: 'courant',
		recurringKey: 'r1'
	},
	{
		date: '2026-05-01',
		merchant: 'Virement Livret A',
		amount: -200,
		envelope: 'investments',
		category: 'Matelas de sécurité',
		account: 'courant',
		toAccount: 'epargne',
		kind: 'transfer',
		recurringKey: 'r8'
	},
	{
		date: '2026-04-30',
		merchant: 'Zara',
		amount: -75.9,
		envelope: 'wants',
		category: 'Shopping',
		account: 'courant'
	},
	{
		date: '2026-04-29',
		merchant: 'Monoprix',
		amount: -54.2,
		envelope: 'necessities',
		category: 'Alimentation et boissons',
		account: 'courant'
	},
	{
		date: '2026-04-28',
		merchant: 'SNCF Voyageurs',
		amount: -78,
		envelope: 'necessities',
		category: 'Transports',
		account: 'courant'
	},
	{
		date: '2026-04-28',
		merchant: 'iCloud+',
		amount: -2.99,
		envelope: 'wants',
		category: 'Abonnements',
		account: 'courant'
	},
	{
		date: '2026-04-27',
		merchant: 'Coinbase — BTC',
		amount: -150,
		envelope: 'investments',
		category: 'Crypto',
		account: 'courant'
	},
	{
		date: '2026-04-26',
		merchant: 'Restaurant Comptoir',
		amount: -64,
		envelope: 'wants',
		category: 'Sorties et Restaurants',
		account: 'courant'
	},
	{
		date: '2026-04-25',
		merchant: 'Pharmacie du Centre',
		amount: -23.4,
		envelope: 'necessities',
		category: 'Frais',
		account: 'courant'
	},
	{
		date: '2026-04-24',
		merchant: 'Amazon',
		amount: -41.2,
		envelope: 'wants',
		category: 'Shopping',
		account: 'courant'
	},
	{
		date: '2026-04-23',
		merchant: 'Total Energies',
		amount: -62.3,
		envelope: 'necessities',
		category: 'Transports',
		account: 'courant'
	},
	{
		date: '2026-04-22',
		merchant: 'Decathlon',
		amount: -89.99,
		envelope: 'wants',
		category: 'Shopping',
		account: 'courant'
	},
	{
		date: '2026-04-21',
		merchant: 'Picard',
		amount: -34.1,
		envelope: 'necessities',
		category: 'Alimentation et boissons',
		account: 'courant'
	},
	{
		date: '2026-04-20',
		merchant: 'Cinéma UGC',
		amount: -22,
		envelope: 'wants',
		category: 'Sorties et Restaurants',
		account: 'courant'
	},
	{
		date: '2026-04-19',
		merchant: 'Orange Mobile',
		amount: -29.99,
		envelope: 'necessities',
		category: 'Logement',
		account: 'courant'
	},
	{
		date: '2026-04-18',
		merchant: 'Café Oberkampf',
		amount: -6.8,
		envelope: 'wants',
		category: 'Sorties et Restaurants',
		account: 'courant'
	}
];

const toCents = (eur: number): number => Math.round(eur * 100);

async function seed(): Promise<void> {
	// Drop existing demo user; cascades to account_auth, sessions, envelopes,
	// categories, accounts, transactions, recurrings.
	db.delete(user).where(eq(user.email, DEMO_EMAIL)).run();

	// Sign up via better-auth so the password is properly hashed and the
	// account_auth row is created. databaseHooks.user.create.after on the
	// auth config will automatically run initUserData(userId).
	const result = await auth.api.signUpEmail({
		body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: DEMO_NAME }
	});
	if (!result?.user?.id) throw new Error('failed to sign up demo user');
	const demoUser = result.user;

	// Lookup tables
	const accounts = db.select().from(account).where(eq(account.userId, demoUser.id)).all();
	const accByLabel: Record<Acc, string> = {
		courant: accounts.find((a) => a.label === 'Compte courant')?.id ?? '',
		epargne: accounts.find((a) => a.label === 'Épargne')?.id ?? ''
	};
	if (!accByLabel.courant || !accByLabel.epargne) throw new Error('missing default accounts');

	const envelopes = db.select().from(envelope).where(eq(envelope.userId, demoUser.id)).all();
	const envByKey: Record<Env, string> = {
		necessities: envelopes.find((e) => e.key === 'necessities')?.id ?? '',
		wants: envelopes.find((e) => e.key === 'wants')?.id ?? '',
		investments: envelopes.find((e) => e.key === 'investments')?.id ?? ''
	};

	const categories = db.select().from(category).where(eq(category.userId, demoUser.id)).all();
	const catByEnvLabel = new Map<string, string>();
	for (const c of categories) catByEnvLabel.set(`${c.envelopeId}::${c.label}`, c.id);

	const findCat = (env: Env, label: string): string => {
		const id = catByEnvLabel.get(`${envByKey[env]}::${label}`);
		if (!id) throw new Error(`unknown category: ${env}/${label}`);
		return id;
	};

	// Insert recurrings; remember their IDs for transaction back-refs.
	const recurringIdByKey = new Map<string, string>();
	for (const r of RECURRINGS) {
		const [row] = db
			.insert(recurring)
			.values({
				userId: demoUser.id,
				merchant: r.merchant,
				amountCents: toCents(r.amount),
				frequency: 'monthly',
				dayOfMonth: r.dayOfMonth,
				accountId: accByLabel[r.account],
				toAccountId: r.toAccount ? accByLabel[r.toAccount] : null,
				envelopeId: r.envelope ? envByKey[r.envelope] : null,
				categoryId: r.envelope && r.category ? findCat(r.envelope, r.category) : null,
				incomeCategory: r.incomeCategory ?? null,
				kind: r.kind,
				nextDate: r.nextDate,
				active: true
			})
			.returning()
			.all();
		if (!row) throw new Error(`failed to insert recurring ${r.key}`);
		recurringIdByKey.set(r.key, row.id);
	}

	// Insert transactions.
	for (const t of TRANSACTIONS) {
		db.insert(transaction)
			.values({
				userId: demoUser.id,
				date: t.date,
				merchant: t.merchant,
				amountCents: toCents(t.amount),
				accountId: accByLabel[t.account],
				toAccountId: t.toAccount ? accByLabel[t.toAccount] : null,
				envelopeId: t.envelope ? envByKey[t.envelope] : null,
				categoryId: t.envelope && t.category ? findCat(t.envelope, t.category) : null,
				incomeCategory: t.incomeCategory ?? null,
				kind: t.kind ?? 'expense',
				recurringId: t.recurringKey ? (recurringIdByKey.get(t.recurringKey) ?? null) : null
			})
			.run();
	}

	// Sanity counts
	const txCount = db
		.select()
		.from(transaction)
		.where(eq(transaction.userId, demoUser.id))
		.all().length;
	const recCount = db
		.select()
		.from(recurring)
		.where(eq(recurring.userId, demoUser.id))
		.all().length;
	const catCount = db
		.select()
		.from(category)
		.where(and(eq(category.userId, demoUser.id), eq(category.isVirtual, false)))
		.all().length;

	console.log(
		`Seeded demo user ${DEMO_EMAIL} (password: ${DEMO_PASSWORD}) — ${txCount} transactions, ${recCount} recurrings, ${catCount} real categories.`
	);
}

await seed();
sqlite.close();
