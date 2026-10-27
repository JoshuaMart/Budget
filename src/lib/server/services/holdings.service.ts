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

export function updateHolding(userId: string, holdingId: string, input: HoldingInput) {
	const [current] = db
		.select()
		.from(holding)
		.where(and(eq(holding.userId, userId), eq(holding.id, holdingId)))
		.all();
	if (!current) return;
	// A new symbol invalidates the cached price; the next refresh refills it.
	const symbolChanged = current.symbol !== input.symbol || current.assetClass !== input.assetClass;
	db.update(holding)
		.set({ ...input, ...(symbolChanged ? { lastPriceCents: null, lastPriceAt: null } : {}) })
		.where(and(eq(holding.userId, userId), eq(holding.id, holdingId)))
		.run();
}

export function deleteHolding(userId: string, holdingId: string) {
	db.delete(holding)
		.where(and(eq(holding.userId, userId), eq(holding.id, holdingId)))
		.run();
}

export function hasStalePrices(userId: string, now = new Date()): boolean {
	const cutoff = new Date(now.getTime() - PRICE_MAX_AGE_MS);
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
 * worth snapshot for each affected user. Returns how many holdings got a
 * fresh price. Network failures leave the previous price in place.
 */
export async function refreshPrices(
	opts: { userId?: string; now?: Date; fetchFn?: typeof fetch } = {}
): Promise<number> {
	const now = opts.now ?? new Date();
	const rows = opts.userId ? listHoldings(opts.userId) : db.select().from(holding).all();
	if (rows.length === 0) return 0;

	const prices = await fetchPricesCents(rows, opts.fetchFn);
	let updated = 0;
	db.transaction((tx) => {
		for (const r of rows) {
			const cents = prices.get(quoteKey(r));
			if (cents === undefined) continue;
			tx.update(holding)
				.set({ lastPriceCents: cents, lastPriceAt: now })
				.where(eq(holding.id, r.id))
				.run();
			updated++;
		}
	});

	for (const userId of new Set(rows.map((r) => r.userId))) recordSnapshot(userId, now);
	return updated;
}

/** Upsert today's snapshot: holdings value, invested amount and bank cash. */
export function recordSnapshot(userId: string, now = new Date()) {
	const rows = listHoldings(userId);
	const values = {
		holdingsCents: rows.reduce((s, h) => s + holdingValue(h), 0),
		investedCents: rows.reduce((s, h) => s + holdingCost(h), 0),
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
