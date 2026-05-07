// Recurring-payment scheduling helpers. Used by the cron-like job that
// materialises due payments and shifts their `nextDate`.

import type { Recurring, Transaction } from '$lib/server/db/schema';

import { parseIsoDate, toIsoDate } from './dates';

export type Frequency = Recurring['frequency'];

/**
 * Compute the next occurrence after `fromIso` for the given frequency.
 * Monthly with `dayOfMonth` clamps to the destination month's last day —
 * day 31 in February becomes 28 (or 29 in leap years).
 */
export function nextOccurrence(
	frequency: Frequency,
	dayOfMonth: number | null | undefined,
	fromIso: string
): string {
	const from = parseIsoDate(fromIso);
	if (frequency === 'weekly') {
		const next = new Date(from.getTime());
		next.setDate(from.getDate() + 7);
		return toIsoDate(next);
	}
	if (frequency === 'yearly') {
		const next = new Date(from.getFullYear() + 1, from.getMonth(), from.getDate());
		return toIsoDate(next);
	}
	// monthly
	const target = dayOfMonth ?? from.getDate();
	const year = from.getFullYear();
	const nextMonth = from.getMonth() + 1;
	const lastDay = new Date(year, nextMonth + 1, 0).getDate();
	const day = Math.min(target, lastDay);
	return toIsoDate(new Date(year, nextMonth, day));
}

/** Active recurrings whose `nextDate` is on or before `today`. */
export function dueRecurrings(recurrings: Recurring[], todayIso: string): Recurring[] {
	return recurrings.filter((r) => r.active && r.nextDate <= todayIso);
}

/**
 * Build the transaction row to insert when materialising a recurring on
 * `dateIso`. Sign convention matches the rest of the app: expenses and
 * transfers are stored as negative cents, incomes as positive.
 */
export function materialize(rec: Recurring, dateIso: string): Transaction {
	const signedAmount = rec.kind === 'income' ? rec.amountCents : -rec.amountCents;
	return {
		id: crypto.randomUUID(),
		userId: rec.userId,
		date: dateIso,
		merchant: rec.merchant,
		amountCents: signedAmount,
		accountId: rec.accountId,
		toAccountId: rec.toAccountId,
		envelopeId: rec.envelopeId,
		categoryId: rec.categoryId,
		incomeCategory: rec.incomeCategory,
		kind: rec.kind,
		recurringId: rec.id,
		createdAt: new Date()
	};
}
