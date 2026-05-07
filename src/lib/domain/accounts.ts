import type { Account, Transaction } from '$lib/server/db/schema';

/**
 * Current balance of an account = initial balance + signed sum of its
 * transactions. Transfers debit the source account (the tx already carries
 * a negative amount on `accountId`) and credit the destination via
 * `toAccountId` (we add `|amount|` there).
 */
export function accountBalance(
	account: Pick<Account, 'id' | 'initialBalanceCents'>,
	transactions: Transaction[]
): number {
	let balance = account.initialBalanceCents;
	for (const t of transactions) {
		if (t.accountId === account.id) {
			balance += t.amountCents;
		}
		if (t.kind === 'transfer' && t.toAccountId === account.id) {
			balance += Math.abs(t.amountCents);
		}
	}
	return balance;
}
