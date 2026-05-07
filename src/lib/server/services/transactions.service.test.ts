import { describe, expect, it } from 'vitest';

import { db } from '../db/client';
import { user } from '../db/schema';
import { initUserData } from '../initUserData';
import { listAccounts } from './accounts.service';
import { listCategories } from './categories.service';
import { listEnvelopes } from './envelopes.service';
import {
	createTransaction,
	deleteTransaction,
	listTransactions,
	updateTransaction
} from './transactions.service';

function bootstrap() {
	const userId = crypto.randomUUID();
	db.insert(user)
		.values({ id: userId, email: `${userId}@test.local`, name: 'Test', emailVerified: false })
		.run();
	initUserData(userId);
	const envelopes = listEnvelopes(userId);
	const categories = listCategories(userId);
	const accounts = listAccounts(userId);
	const necEnv = envelopes.find((e) => e.key === 'necessities')!;
	const wantEnv = envelopes.find((e) => e.key === 'wants')!;
	const courant = accounts.find((a) => a.label === 'Compte courant')!;
	const epargne = accounts.find((a) => a.label === 'Épargne')!;
	const logement = categories.find((c) => c.label === 'Logement')!;
	const sorties = categories.find((c) => c.label === 'Sorties et Restaurants')!;
	return {
		userId,
		envelopes,
		categories,
		accounts,
		necEnv,
		wantEnv,
		courant,
		epargne,
		logement,
		sorties
	};
}

describe('transactions.service', () => {
	it('createTransaction signs the amount according to kind', () => {
		const ctx = bootstrap();

		const expense = createTransaction(ctx.userId, {
			kind: 'expense',
			date: '2026-05-07',
			merchant: 'Carrefour',
			amountCents: 6840,
			accountId: ctx.courant.id,
			envelopeId: ctx.necEnv.id,
			categoryId: ctx.logement.id
		});
		expect(expense.amountCents).toBe(-6840);
		expect(expense.kind).toBe('expense');

		const income = createTransaction(ctx.userId, {
			kind: 'income',
			date: '2026-05-02',
			merchant: 'Salaire',
			amountCents: 320000,
			accountId: ctx.courant.id,
			incomeCategory: 'salary'
		});
		expect(income.amountCents).toBe(320000);
		expect(income.envelopeId).toBeNull();
		expect(income.categoryId).toBeNull();
		expect(income.incomeCategory).toBe('salary');

		const transfer = createTransaction(ctx.userId, {
			kind: 'transfer',
			date: '2026-05-01',
			merchant: 'Vers Livret A',
			amountCents: 20000,
			accountId: ctx.courant.id,
			toAccountId: ctx.epargne.id,
			envelopeId: ctx.necEnv.id
		});
		expect(transfer.amountCents).toBe(-20000);
		expect(transfer.toAccountId).toBe(ctx.epargne.id);
	});

	it('listTransactions filters by month, envelope and merchant search', () => {
		const ctx = bootstrap();

		createTransaction(ctx.userId, {
			kind: 'expense',
			date: '2026-05-15',
			merchant: 'Carrefour',
			amountCents: 5000,
			accountId: ctx.courant.id,
			envelopeId: ctx.necEnv.id,
			categoryId: ctx.logement.id
		});
		createTransaction(ctx.userId, {
			kind: 'expense',
			date: '2026-04-15',
			merchant: 'Carrefour',
			amountCents: 3000,
			accountId: ctx.courant.id,
			envelopeId: ctx.necEnv.id,
			categoryId: ctx.logement.id
		});
		createTransaction(ctx.userId, {
			kind: 'expense',
			date: '2026-05-20',
			merchant: 'Restaurant',
			amountCents: 4000,
			accountId: ctx.courant.id,
			envelopeId: ctx.wantEnv.id,
			categoryId: ctx.sorties.id
		});

		expect(listTransactions(ctx.userId)).toHaveLength(3);

		// Month filter
		const may = listTransactions(ctx.userId, { year: 2026, month: 4 });
		expect(may).toHaveLength(2);
		expect(may.every((t) => t.date.startsWith('2026-05'))).toBe(true);

		// Envelope filter
		const necOnly = listTransactions(ctx.userId, { envelopeId: ctx.necEnv.id });
		expect(necOnly).toHaveLength(2);
		expect(necOnly.every((t) => t.envelopeId === ctx.necEnv.id)).toBe(true);

		// Merchant search
		const restaurants = listTransactions(ctx.userId, { merchantSearch: 'estau' });
		expect(restaurants).toHaveLength(1);
		expect(restaurants[0]?.merchant).toBe('Restaurant');
	});

	it('updateTransaction patches fields and re-applies the sign', () => {
		const ctx = bootstrap();
		const tx = createTransaction(ctx.userId, {
			kind: 'expense',
			date: '2026-05-07',
			merchant: 'Old',
			amountCents: 1000,
			accountId: ctx.courant.id,
			envelopeId: ctx.necEnv.id,
			categoryId: ctx.logement.id
		});

		updateTransaction(ctx.userId, tx.id, {
			kind: 'income',
			date: '2026-05-08',
			merchant: 'New',
			amountCents: 5000,
			accountId: ctx.courant.id,
			incomeCategory: 'freelance'
		});

		const refreshed = listTransactions(ctx.userId);
		expect(refreshed).toHaveLength(1);
		const updated = refreshed[0]!;
		expect(updated.merchant).toBe('New');
		expect(updated.amountCents).toBe(5000); // positive for income
		expect(updated.envelopeId).toBeNull();
		expect(updated.incomeCategory).toBe('freelance');
	});

	it('deleteTransaction removes the row scoped to the user', () => {
		const ctx = bootstrap();
		const tx = createTransaction(ctx.userId, {
			kind: 'expense',
			date: '2026-05-07',
			merchant: 'X',
			amountCents: 1000,
			accountId: ctx.courant.id,
			envelopeId: ctx.necEnv.id,
			categoryId: ctx.logement.id
		});
		expect(listTransactions(ctx.userId)).toHaveLength(1);

		deleteTransaction(ctx.userId, tx.id);
		expect(listTransactions(ctx.userId)).toHaveLength(0);
	});

	it('does not leak transactions across users', () => {
		const a = bootstrap();
		const b = bootstrap();

		createTransaction(a.userId, {
			kind: 'expense',
			date: '2026-05-07',
			merchant: 'A spending',
			amountCents: 1000,
			accountId: a.courant.id,
			envelopeId: a.necEnv.id,
			categoryId: a.logement.id
		});

		expect(listTransactions(a.userId)).toHaveLength(1);
		expect(listTransactions(b.userId)).toHaveLength(0);
	});
});
