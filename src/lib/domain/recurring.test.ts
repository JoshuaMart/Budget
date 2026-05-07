import { describe, expect, it } from 'vitest';

import type { Recurring } from '$lib/server/db/schema';

import { dueRecurrings, materialize, nextOccurrence } from './recurring';

const rec = (over: Partial<Recurring>): Recurring =>
	({
		id: 'r',
		userId: 'u',
		merchant: 'X',
		amountCents: 10000,
		frequency: 'monthly',
		dayOfMonth: 1,
		accountId: 'acc-courant',
		toAccountId: null,
		envelopeId: null,
		categoryId: null,
		incomeCategory: null,
		kind: 'expense',
		nextDate: '2026-05-01',
		active: true,
		...over
	}) as Recurring;

describe('nextOccurrence', () => {
	it('weekly: shifts by 7 days', () => {
		expect(nextOccurrence('weekly', null, '2026-05-07')).toBe('2026-05-14');
		expect(nextOccurrence('weekly', null, '2026-05-31')).toBe('2026-06-07');
	});

	it('monthly: shifts by one month using dayOfMonth', () => {
		expect(nextOccurrence('monthly', 5, '2026-05-05')).toBe('2026-06-05');
		expect(nextOccurrence('monthly', 2, '2026-05-02')).toBe('2026-06-02');
	});

	it('monthly clamps day 31 to the last day of the destination month', () => {
		expect(nextOccurrence('monthly', 31, '2026-01-31')).toBe('2026-02-28');
		expect(nextOccurrence('monthly', 31, '2024-01-31')).toBe('2024-02-29'); // leap
		expect(nextOccurrence('monthly', 31, '2026-03-31')).toBe('2026-04-30');
	});

	it('yearly: shifts by one year', () => {
		expect(nextOccurrence('yearly', null, '2026-05-07')).toBe('2027-05-07');
	});
});

describe('dueRecurrings', () => {
	it('returns active recurrings whose nextDate is on or before today', () => {
		const list = [
			rec({ id: 'r1', nextDate: '2026-05-01' }),
			rec({ id: 'r2', nextDate: '2026-05-07' }),
			rec({ id: 'r3', nextDate: '2026-05-08' }),
			rec({ id: 'r4', nextDate: '2026-04-15', active: false })
		];
		const due = dueRecurrings(list, '2026-05-07');
		expect(due.map((r) => r.id)).toEqual(['r1', 'r2']);
	});
});

describe('materialize', () => {
	it('produces a transaction with negative amount for expense', () => {
		const r = rec({ amountCents: 8900, kind: 'expense' });
		const tx = materialize(r, '2026-05-02');
		expect(tx.amountCents).toBe(-8900);
		expect(tx.kind).toBe('expense');
		expect(tx.recurringId).toBe(r.id);
		expect(tx.date).toBe('2026-05-02');
	});

	it('produces a positive amount for income', () => {
		const r = rec({ amountCents: 320000, kind: 'income' });
		const tx = materialize(r, '2026-05-02');
		expect(tx.amountCents).toBe(320000);
		expect(tx.kind).toBe('income');
	});

	it('produces a negative amount for transfer (source debit)', () => {
		const r = rec({
			amountCents: 20000,
			kind: 'transfer',
			toAccountId: 'acc-epargne'
		});
		const tx = materialize(r, '2026-05-01');
		expect(tx.amountCents).toBe(-20000);
		expect(tx.toAccountId).toBe('acc-epargne');
	});

	it('preserves the recurringId back-reference', () => {
		const r = rec({ id: 'rec-loyer' });
		expect(materialize(r, '2026-05-01').recurringId).toBe('rec-loyer');
	});
});
