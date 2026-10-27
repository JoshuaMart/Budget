import { and, asc, eq, isNull, lt, or } from 'drizzle-orm';

import { holdingCost, holdingValue, toIsoDate } from '#lib/domain/index.ts';

import { db } from '../db/client';
import { holding, netWorthSnapshot } from '../db/schema';
import type { HoldingInput } from '../schemas';
import { listAccountsWithBalance } from './accounts.service';
import { fetchPricesCents, quoteKey } from './quotes.service';

/** Prices older than this are refetched when the patrimoine page loads. */
export const PRICE_MAX_AGE_MS = 60 * 60 * 1000;

export function listHoldings(userId: string) {
	return db
		.select()
		.from(holding)
		.where(eq(holding.userId, userId))
		.orderBy(asc(holding.wallet), asc(holding.label))
		.all();
}

// Last refresh attempt per user. A quote that keeps failing never updates
// `lastPriceAt`, so staleness can't rely on it alone or every page load
// would block on the network again. In-memory is fine: single process,
// and a restart simply allows one immediate retry.
const lastAttemptAt = new Map<string, number>();

export function createHolding(userId: string, input: HoldingInput, lastPriceCents?: number) {
	const [created] = db
		.insert(holding)
		.values({
			userId,
			...input,
			lastPriceCents: lastPriceCents ?? null,
			lastPriceAt: lastPriceCents !== undefined ? new Date() : null
		})
		.returning()
		.all();
	if (!created) throw new Error('failed to create holding');
	return created;
}

/** Find one of the user's holdings, or undefined. */
export function getHolding(userId: string, holdingId: string) {
	return db
		.select()
		.from(holding)
		.where(and(eq(holding.userId, userId), eq(holding.id, holdingId)))
		.get();
}

/**
 * Update a holding. When the quote identity (symbol / class) changes, the
 * cached price is replaced by `lastPriceCents` (the new symbol's price,
 * fetched by the caller) or cleared until the next refresh.
 */
export function updateHolding(
	userId: string,
	holdingId: string,
	input: HoldingInput,
	lastPriceCents?: number
) {
	const current = getHolding(userId, holdingId);
	if (!current) return;
	const price = isSameQuote(current, input)
		? {}
		: {
				lastPriceCents: lastPriceCents ?? null,
				lastPriceAt: lastPriceCents !== undefined ? new Date() : null
			};
	db.update(holding)
		.set({ ...input, ...price })
		.where(and(eq(holding.userId, userId), eq(holding.id, holdingId)))
		.run();
}

export function isSameQuote(
	a: Pick<HoldingInput, 'symbol' | 'assetClass'>,
	b: Pick<HoldingInput, 'symbol' | 'assetClass'>
): boolean {
	return a.symbol === b.symbol && a.assetClass === b.assetClass;
}

export function deleteHolding(userId: string, holdingId: string) {
	db.delete(holding)
		.where(and(eq(holding.userId, userId), eq(holding.id, holdingId)))
		.run();
}

export function hasStalePrices(userId: string, now = new Date()): boolean {
	const cutoff = new Date(now.getTime() - PRICE_MAX_AGE_MS);
	if ((lastAttemptAt.get(userId) ?? 0) > cutoff.getTime()) return false;
	const stale = db
		.select({ id: holding.id })
		.from(holding)
		.where(
			and(
				eq(holding.userId, userId),
				or(isNull(holding.lastPriceAt), lt(holding.lastPriceAt, cutoff))
			)
		)
		.limit(1)
		.all();
	return stale.length > 0;
}

/**
 * Refetch prices for every holding (or one user's) and record today's net
 * worth snapshot for each user that got at least one fresh price. Returns
 * how many holdings got a fresh price. Network failures leave the previous
 * price in place and write no snapshot, so outages don't freeze stale
 * values into the history.
 */
export async function refreshPrices(
	opts: { userId?: string; now?: Date; fetchFn?: typeof fetch } = {}
): Promise<number> {
	const now = opts.now ?? new Date();
	const rows = opts.userId ? listHoldings(opts.userId) : db.select().from(holding).all();
	if (rows.length === 0) return 0;
	for (const userId of new Set(rows.map((r) => r.userId))) lastAttemptAt.set(userId, now.getTime());

	const prices = await fetchPricesCents(rows, opts.fetchFn);
	const refreshedUsers = new Set<string>();
	let updated = 0;
	db.transaction((tx) => {
		for (const r of rows) {
			const cents = prices.get(quoteKey(r));
			if (cents === undefined) continue;
			// Match the quote identity read before the fetch: if the user
			// switched the symbol meanwhile, this price belongs to the old one.
			const matched = tx
				.update(holding)
				.set({ lastPriceCents: cents, lastPriceAt: now })
				.where(
					and(
						eq(holding.id, r.id),
						eq(holding.symbol, r.symbol),
						eq(holding.assetClass, r.assetClass)
					)
				)
				.returning({ id: holding.id })
				.all();
			if (matched.length === 0) continue;
			refreshedUsers.add(r.userId);
			updated++;
		}
	});

	for (const userId of refreshedUsers) recordSnapshot(userId, now);
	return updated;
}

/** Upsert today's snapshot: holdings value, invested amount and bank cash. */
export function recordSnapshot(userId: string, now = new Date()) {
	const rows = listHoldings(userId);
	const values = {
		holdingsCents: rows.reduce((s, h) => s + holdingValue(h), 0),
		investedCents: rows.reduce((s, h) => s + (holdingCost(h) ?? 0), 0),
		cashCents: listAccountsWithBalance(userId).reduce((s, a) => s + a.currentBalanceCents, 0)
	};
	db.insert(netWorthSnapshot)
		.values({ userId, date: toIsoDate(now), ...values })
		.onConflictDoUpdate({ target: [netWorthSnapshot.userId, netWorthSnapshot.date], set: values })
		.run();
}

export function listSnapshots(userId: string) {
	return db
		.select()
		.from(netWorthSnapshot)
		.where(eq(netWorthSnapshot.userId, userId))
		.orderBy(asc(netWorthSnapshot.date))
		.all();
}
