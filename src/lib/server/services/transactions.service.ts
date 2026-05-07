import { and, desc, eq, gte, like, lte, type SQL } from 'drizzle-orm';

import { endOfMonth, startOfMonth, toIsoDate } from '$lib/domain';

import { db } from '../db/client';
import { transaction } from '../db/schema';
import type { TransactionInput } from '../schemas';

export interface TxFilters {
	year?: number;
	month?: number;
	envelopeId?: string;
	merchantSearch?: string;
}

export function listTransactions(userId: string, filters: TxFilters = {}) {
	const conditions: SQL[] = [eq(transaction.userId, userId)];

	if (filters.year !== undefined && filters.month !== undefined) {
		const ym = { year: filters.year, month: filters.month };
		conditions.push(gte(transaction.date, toIsoDate(startOfMonth(ym))));
		conditions.push(lte(transaction.date, toIsoDate(endOfMonth(ym))));
	}
	if (filters.envelopeId) conditions.push(eq(transaction.envelopeId, filters.envelopeId));
	if (filters.merchantSearch) {
		conditions.push(like(transaction.merchant, `%${filters.merchantSearch}%`));
	}

	return db
		.select()
		.from(transaction)
		.where(and(...conditions))
		.orderBy(desc(transaction.date), desc(transaction.createdAt))
		.all();
}

export function createTransaction(userId: string, input: TransactionInput) {
	const signedAmount = input.kind === 'income' ? input.amountCents : -input.amountCents;
	const base = {
		userId,
		date: input.date,
		merchant: input.merchant,
		amountCents: signedAmount,
		accountId: input.accountId,
		kind: input.kind,
		toAccountId: null as string | null,
		envelopeId: null as string | null,
		categoryId: null as string | null,
		incomeCategory: null as string | null,
		recurringId: null as string | null
	};
	if (input.kind === 'transfer') {
		base.toAccountId = input.toAccountId;
		base.envelopeId = input.envelopeId;
		base.categoryId = input.categoryId ?? null;
	} else if (input.kind === 'expense') {
		base.envelopeId = input.envelopeId;
		base.categoryId = input.categoryId ?? null;
	} else {
		base.incomeCategory = input.incomeCategory ?? null;
	}

	const [created] = db.insert(transaction).values(base).returning().all();
	if (!created) throw new Error('failed to create transaction');
	return created;
}

export function updateTransaction(userId: string, txId: string, input: TransactionInput) {
	const signedAmount = input.kind === 'income' ? input.amountCents : -input.amountCents;
	const patch = {
		date: input.date,
		merchant: input.merchant,
		amountCents: signedAmount,
		accountId: input.accountId,
		kind: input.kind,
		toAccountId: input.kind === 'transfer' ? input.toAccountId : null,
		envelopeId: input.kind === 'income' ? null : input.envelopeId,
		categoryId: input.kind === 'income' ? null : (input.categoryId ?? null),
		incomeCategory: input.kind === 'income' ? (input.incomeCategory ?? null) : null
	};
	db.update(transaction)
		.set(patch)
		.where(and(eq(transaction.userId, userId), eq(transaction.id, txId)))
		.run();
}

export function deleteTransaction(userId: string, txId: string) {
	db.delete(transaction)
		.where(and(eq(transaction.userId, userId), eq(transaction.id, txId)))
		.run();
}
