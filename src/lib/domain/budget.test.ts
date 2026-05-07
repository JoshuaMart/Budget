import { describe, expect, it } from 'vitest';

import type { Envelope, Transaction } from '$lib/server/db/schema';

import {
	envelopeBudget,
	envelopeRemaining,
	envelopeSpent,
	monthIncome,
	monthSummary
} from './budget';

const ENVELOPES = [
	{ id: 'env-nec', key: 'necessities' as const },
	{ id: 'env-want', key: 'wants' as const },
	{ id: 'env-inv', key: 'investments' as const }
];

const RATIOS = { necessities: 50, wants: 30, investments: 20 };

const tx = (over: Partial<Transaction>): Transaction =>
	({
		id: 't',
		userId: 'u',
		date: '2026-05-15',
		merchant: 'X',
		amountCents: -1000,
		accountId: 'a',
		toAccountId: null,
		envelopeId: null,
		categoryId: null,
		incomeCategory: null,
		kind: 'expense',
		recurringId: null,
		createdAt: new Date(),
		...over
	}) as Transaction;

describe('monthIncome', () => {
	it('sums income transactions inside the month', () => {
		const txs = [
			tx({ kind: 'income', amountCents: 320000, date: '2026-05-02' }),
			tx({ kind: 'income', amountCents: 50000, date: '2026-05-20' }),
			tx({ kind: 'income', amountCents: 999, date: '2026-04-30' }), // wrong month
			tx({ kind: 'expense', amountCents: -1000, date: '2026-05-10' })
		];
		expect(monthIncome(txs, { year: 2026, month: 4 })).toBe(370000);
	});

	it('returns 0 when no income for the month', () => {
		const txs = [tx({ kind: 'income', amountCents: 100, date: '2026-04-15' })];
		expect(monthIncome(txs, { year: 2026, month: 4 })).toBe(0);
	});
});

describe('envelopeBudget', () => {
	it('returns 0 when income is 0', () => {
		expect(envelopeBudget(0, 50)).toBe(0);
	});

	it('rounds to nearest cent', () => {
		expect(envelopeBudget(10001, 50)).toBe(5001);
		expect(envelopeBudget(10003, 50)).toBe(5002);
	});
});

describe('envelopeSpent', () => {
	it('sums absolute amounts ignoring income and other envelopes', () => {
		const txs = [
			tx({ envelopeId: 'env-nec', amountCents: -2000, date: '2026-05-01' }),
			tx({ envelopeId: 'env-nec', amountCents: -3000, date: '2026-05-31' }),
			tx({ envelopeId: 'env-want', amountCents: -5000, date: '2026-05-10' }),
			tx({ envelopeId: 'env-nec', amountCents: -100, date: '2026-04-30' }),
			tx({ envelopeId: null, kind: 'income', amountCents: 320000, date: '2026-05-02' })
		];
		expect(envelopeSpent(txs, 'env-nec', { year: 2026, month: 4 })).toBe(5000);
	});
});

describe('envelopeRemaining', () => {
	it('computes positive remaining', () => {
		expect(envelopeRemaining(160000, 100000)).toBe(60000);
	});

	it('returns negative on overspend (dépassement)', () => {
		expect(envelopeRemaining(100000, 130000)).toBe(-30000);
	});
});

describe('monthSummary', () => {
	const ym = { year: 2026, month: 4 };

	it('aggregates income, totals and per-category in a single pass', () => {
		const txs = [
			tx({ kind: 'income', amountCents: 320000, date: '2026-05-02' }),
			tx({
				envelopeId: 'env-nec',
				categoryId: 'cat-rent',
				amountCents: -98000,
				date: '2026-05-01'
			}),
			tx({ envelopeId: 'env-nec', categoryId: 'cat-rent', amountCents: -3000, date: '2026-05-15' }),
			tx({ envelopeId: 'env-want', categoryId: 'cat-sub', amountCents: -1349, date: '2026-05-05' }),
			tx({ envelopeId: 'env-inv', categoryId: 'cat-act', amountCents: -30000, date: '2026-05-03' })
		];
		const summary = monthSummary(txs, ENVELOPES as Envelope[], RATIOS, ym);

		expect(summary.income).toBe(320000);
		expect(summary.totalSpent).toBe(98000 + 3000 + 1349 + 30000);
		expect(summary.byEnvelope.necessities.spent).toBe(101000);
		expect(summary.byEnvelope.necessities.budget).toBe(160000);
		expect(summary.byEnvelope.necessities.remaining).toBe(59000);
		expect(summary.byEnvelope.wants.spent).toBe(1349);
		expect(summary.byEnvelope.investments.spent).toBe(30000);
		expect(summary.byCategory['cat-rent']).toBe(101000);
		expect(summary.byCategory['cat-sub']).toBe(1349);
	});

	it('skips transactions outside the requested month', () => {
		const txs = [
			tx({ envelopeId: 'env-nec', amountCents: -5000, date: '2026-04-30' }),
			tx({ envelopeId: 'env-nec', amountCents: -5000, date: '2026-06-01' })
		];
		const summary = monthSummary(txs, ENVELOPES as Envelope[], RATIOS, ym);
		expect(summary.totalSpent).toBe(0);
	});

	it('handles zero income (budgets are 0, remaining = -spent)', () => {
		const txs = [tx({ envelopeId: 'env-nec', amountCents: -5000, date: '2026-05-10' })];
		const summary = monthSummary(txs, ENVELOPES as Envelope[], RATIOS, ym);
		expect(summary.byEnvelope.necessities.budget).toBe(0);
		expect(summary.byEnvelope.necessities.remaining).toBe(-5000);
	});
});
