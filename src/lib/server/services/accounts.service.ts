import { and, eq } from 'drizzle-orm';

import { accountBalance } from '$lib/domain';

import { db } from '../db/client';
import { account, transaction } from '../db/schema';
import type { AccountInput } from '../schemas';

export interface AccountWithBalance {
	id: string;
	userId: string;
	label: string;
	initialBalanceCents: number;
	currentBalanceCents: number;
	type: 'checking' | 'savings';
	createdAt: Date;
}

export function listAccounts(userId: string) {
	return db.select().from(account).where(eq(account.userId, userId)).all();
}

export function listAccountsWithBalance(userId: string): AccountWithBalance[] {
	const accounts = listAccounts(userId);
	const txs = db.select().from(transaction).where(eq(transaction.userId, userId)).all();
	return accounts.map((a) => ({ ...a, currentBalanceCents: accountBalance(a, txs) }));
}

export function createAccount(userId: string, input: AccountInput) {
	const [created] = db
		.insert(account)
		.values({
			userId,
			label: input.label,
			type: input.type,
			initialBalanceCents: input.initialBalanceCents
		})
		.returning()
		.all();
	if (!created) throw new Error('failed to create account');
	return created;
}

export function updateAccount(userId: string, accountId: string, input: AccountInput) {
	db.update(account)
		.set({
			label: input.label,
			type: input.type,
			initialBalanceCents: input.initialBalanceCents
		})
		.where(and(eq(account.userId, userId), eq(account.id, accountId)))
		.run();
}

export function deleteAccount(userId: string, accountId: string) {
	// FK cascade nukes the account's transactions; transfers pointing at it
	// via toAccountId fall back to NULL (preserving historical traces).
	db.delete(account)
		.where(and(eq(account.userId, userId), eq(account.id, accountId)))
		.run();
}
