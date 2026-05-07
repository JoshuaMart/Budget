import { and, eq, lte } from 'drizzle-orm';

import { materialize, nextOccurrence, toIsoDate } from '$lib/domain';

import { db } from '../db/client';
import { recurring, transaction } from '../db/schema';
import type { RecurringInput } from '../schemas';

export function listRecurrings(userId: string) {
	return db.select().from(recurring).where(eq(recurring.userId, userId)).all();
}

export function createRecurring(userId: string, input: RecurringInput) {
	const base = {
		userId,
		merchant: input.merchant,
		amountCents: input.amountCents,
		frequency: input.frequency,
		dayOfMonth: input.dayOfMonth ?? null,
		accountId: input.accountId,
		toAccountId: input.kind === 'transfer' ? input.toAccountId : null,
		envelopeId: input.kind === 'income' ? null : input.envelopeId,
		categoryId: input.kind === 'income' ? null : (input.categoryId ?? null),
		incomeCategory: input.kind === 'income' ? (input.incomeCategory ?? null) : null,
		kind: input.kind,
		nextDate: input.nextDate,
		active: true
	};
	const [created] = db.insert(recurring).values(base).returning().all();
	if (!created) throw new Error('failed to create recurring');
	return created;
}

export function updateRecurring(userId: string, recId: string, input: RecurringInput) {
	const patch = {
		merchant: input.merchant,
		amountCents: input.amountCents,
		frequency: input.frequency,
		dayOfMonth: input.dayOfMonth ?? null,
		accountId: input.accountId,
		toAccountId: input.kind === 'transfer' ? input.toAccountId : null,
		envelopeId: input.kind === 'income' ? null : input.envelopeId,
		categoryId: input.kind === 'income' ? null : (input.categoryId ?? null),
		incomeCategory: input.kind === 'income' ? (input.incomeCategory ?? null) : null,
		kind: input.kind,
		nextDate: input.nextDate
	};
	db.update(recurring)
		.set(patch)
		.where(and(eq(recurring.userId, userId), eq(recurring.id, recId)))
		.run();
}

export function toggleRecurring(userId: string, recId: string) {
	const r = db
		.select()
		.from(recurring)
		.where(and(eq(recurring.userId, userId), eq(recurring.id, recId)))
		.get();
	if (!r) throw new Error('Récurrent introuvable');
	db.update(recurring)
		.set({ active: !r.active })
		.where(and(eq(recurring.userId, userId), eq(recurring.id, recId)))
		.run();
}

export function deleteRecurring(userId: string, recId: string) {
	// transaction.recurringId is set null on delete (FK), so historical
	// transactions stay but lose their backlink to the recurring.
	db.delete(recurring)
		.where(and(eq(recurring.userId, userId), eq(recurring.id, recId)))
		.run();
}

/**
 * Materialise every active recurring whose `nextDate` is on or before today.
 * Loops to catch up after a long offline period (one materialisation per
 * iteration, with `nextDate` advanced each time). Idempotent: skips inserts
 * if a transaction with the same `recurringId` and `date` already exists.
 *
 * Returns the number of transactions inserted.
 */
export function runDueRecurrings(now: Date = new Date()): number {
	const todayIso = toIsoDate(now);
	let total = 0;
	let safety = 1000; // hard upper bound

	while (safety-- > 0) {
		const due = db
			.select()
			.from(recurring)
			.where(and(eq(recurring.active, true), lte(recurring.nextDate, todayIso)))
			.all();
		if (due.length === 0) break;

		db.transaction((tx) => {
			for (const rec of due) {
				const existing = tx
					.select({ id: transaction.id })
					.from(transaction)
					.where(and(eq(transaction.recurringId, rec.id), eq(transaction.date, rec.nextDate)))
					.get();
				if (!existing) {
					tx.insert(transaction).values(materialize(rec, rec.nextDate)).run();
					total++;
				}
				const next = nextOccurrence(rec.frequency, rec.dayOfMonth, rec.nextDate);
				tx.update(recurring).set({ nextDate: next }).where(eq(recurring.id, rec.id)).run();
			}
		});
	}

	return total;
}
