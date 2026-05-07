import { describe, expect, it } from 'vitest';

import type { Account, Transaction } from '$lib/server/db/schema';

import { accountBalance } from './accounts';

const courant = { id: 'acc-courant', initialBalanceCents: 350000 };
const epargne = { id: 'acc-epargne', initialBalanceCents: 1200000 };

const tx = (over: Partial<Transaction>): Transaction =>
	({
		id: 't',
		userId: 'u',
		date: '2026-05-01',
		merchant: 'X',
		amountCents: 0,
		accountId: 'acc-courant',
		toAccountId: null,
		envelopeId: null,
		categoryId: null,
		incomeCategory: null,
		kind: 'expense',
		recurringId: null,
		createdAt: new Date(),
		...over
	}) as Transaction;

describe('accountBalance', () => {
	it('starts at the initial balance', () => {
		expect(accountBalance(courant as Account, [])).toBe(350000);
	});

	it('applies signed amounts on the source account', () => {
		const txs = [
			tx({ amountCents: -8900 }), // expense
			tx({ amountCents: 320000, kind: 'income' }) // income
		];
		expect(accountBalance(courant as Account, txs)).toBe(350000 - 8900 + 320000);
	});

	it('credits the destination account on transfers', () => {
		const txs = [
			tx({
				kind: 'transfer',
				amountCents: -20000,
				accountId: 'acc-courant',
				toAccountId: 'acc-epargne'
			})
		];
		expect(accountBalance(courant as Account, txs)).toBe(350000 - 20000);
		expect(accountBalance(epargne as Account, txs)).toBe(1200000 + 20000);
	});

	it('ignores transactions for other accounts', () => {
		const txs = [tx({ amountCents: -99999, accountId: 'other-account' })];
		expect(accountBalance(courant as Account, txs)).toBe(350000);
	});
});
