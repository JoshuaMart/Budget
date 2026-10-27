import { describe, expect, it } from 'vitest';

import { db } from '../db/client';
import { user } from '../db/schema';
import { initUserData } from '../initUserData';
import {
	createHolding,
	deleteHolding,
	hasStalePrices,
	listHoldings,
	listSnapshots,
	refreshPrices,
	updateHolding
} from './holdings.service';
import { fetchPricesCents } from './quotes.service';

function bootstrap() {
	const userId = crypto.randomUUID();
	db.insert(user)
		.values({ id: userId, email: `${userId}@test.local`, name: 'Test', emailVerified: false })
		.run();
	initUserData(userId);
	return userId;
}

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const chart = (price: number, currency: string) =>
	json({ chart: { result: [{ meta: { regularMarketPrice: price, currency } }] } });

/** Fake market: CW8.PA in EUR, AAPL in USD (1 USD = 0.9 €), BTC via CoinGecko. */
const fakeFetch = (async (input: string | URL | Request) => {
	const url = String(input);
	if (url.includes('coingecko')) return json({ bitcoin: { eur: 70000 } });
	if (url.includes('/chart/CW8.PA')) return chart(713.01, 'EUR');
	if (url.includes('/chart/AAPL')) return chart(200, 'USD');
	if (url.includes('/chart/USDEUR%3DX')) return chart(0.9, 'EUR');
	if (url.includes('/chart/VOD.L')) return chart(7000, 'GBp');
	if (url.includes('/chart/GBPEUR%3DX')) return chart(1.2, 'EUR');
	return json({ chart: { result: null } }, 404);
}) as typeof fetch;

const base = { wallet: 'PEA', label: 'Test', quantity: 1, avgCostCents: 0 };

describe('quotes.service', () => {
	it('prices every source in euro cents and skips unknown symbols', async () => {
		const prices = await fetchPricesCents(
			[
				{ assetClass: 'etf', symbol: 'CW8.PA' },
				{ assetClass: 'stock', symbol: 'AAPL' },
				{ assetClass: 'stock', symbol: 'VOD.L' },
				{ assetClass: 'crypto', symbol: 'bitcoin' },
				{ assetClass: 'etf', symbol: 'NOPE.PA' }
			],
			fakeFetch
		);
		const expected = {
			'etf:CW8.PA': 71_301,
			'stock:AAPL': 18_000,
			'stock:VOD.L': 8_400,
			'crypto:bitcoin': 7_000_000
		};
		expect([...prices.keys()].sort()).toEqual(Object.keys(expected).sort());
		for (const [k, v] of Object.entries(expected)) expect(prices.get(k)).toBeCloseTo(v, 6);
	});

	it('keeps sub-cent prices unrounded', async () => {
		const memeFetch = (async () =>
			json({ 'shiba-inu': { eur: 0.00001234 } })) as unknown as typeof fetch;
		const prices = await fetchPricesCents(
			[{ assetClass: 'crypto', symbol: 'shiba-inu' }],
			memeFetch
		);
		expect(prices.get('crypto:shiba-inu')).toBeCloseTo(0.001234, 9);
	});
});

describe('holdings.service', () => {
	it('refreshPrices updates prices and records a daily snapshot', async () => {
		const userId = bootstrap();
		createHolding(userId, {
			...base,
			assetClass: 'etf',
			symbol: 'CW8.PA',
			quantity: 10,
			avgCostCents: 50_000
		});
		createHolding(userId, {
			...base,
			wallet: 'Ledger',
			assetClass: 'crypto',
			symbol: 'bitcoin',
			quantity: 0.01,
			avgCostCents: 5_000_000
		});
		expect(hasStalePrices(userId)).toBe(true);

		const now = new Date('2026-10-27T10:00:00');
		const n = await refreshPrices({ userId, now, fetchFn: fakeFetch });
		expect(n).toBe(2);
		expect(hasStalePrices(userId, now)).toBe(false);
		const byClass = Object.fromEntries(listHoldings(userId).map((h) => [h.assetClass, h]));
		expect(byClass.etf?.lastPriceCents).toBeCloseTo(71_301, 6);
		expect(byClass.crypto?.lastPriceCents).toBe(7_000_000);

		// Same day again → upsert, not a second row.
		await refreshPrices({ userId, now, fetchFn: fakeFetch });
		const snaps = listSnapshots(userId);
		expect(snaps).toHaveLength(1);
		expect(snaps[0]).toMatchObject({
			date: '2026-10-27',
			holdingsCents: 713_010 + 70_000,
			investedCents: 500_000 + 50_000
		});
	});

	it('updateHolding clears the cached price when the symbol changes', async () => {
		const userId = bootstrap();
		const h = createHolding(userId, { ...base, assetClass: 'etf', symbol: 'CW8.PA' }, 71_301);
		updateHolding(userId, h.id, { ...base, assetClass: 'etf', symbol: 'CW8.PA', quantity: 2 });
		expect(listHoldings(userId)[0]?.lastPriceCents).toBe(71_301);
		updateHolding(userId, h.id, { ...base, assetClass: 'stock', symbol: 'AAPL' });
		expect(listHoldings(userId)[0]?.lastPriceCents).toBeNull();
	});

	it('scopes update and delete to the owner', () => {
		const owner = bootstrap();
		const other = bootstrap();
		const h = createHolding(owner, { ...base, assetClass: 'etf', symbol: 'CW8.PA' });
		updateHolding(other, h.id, { ...base, assetClass: 'etf', symbol: 'CW8.PA', quantity: 99 });
		deleteHolding(other, h.id);
		expect(listHoldings(owner)).toHaveLength(1);
		expect(listHoldings(owner)[0]?.quantity).toBe(1);
	});
});

describe('holdings.service — failure paths', () => {
	const downFetch = (async () => json({}, 503)) as unknown as typeof fetch;

	it('a failed refresh writes no snapshot and is not retried within the hour', async () => {
		const userId = bootstrap();
		createHolding(userId, { ...base, assetClass: 'etf', symbol: 'CW8.PA' });
		const now = new Date('2026-10-27T10:00:00');
		expect(await refreshPrices({ userId, now, fetchFn: downFetch })).toBe(0);
		expect(listSnapshots(userId)).toHaveLength(0);
		// Price still missing, but the attempt counts: no blocking retry.
		expect(hasStalePrices(userId, new Date('2026-10-27T10:30:00'))).toBe(false);
		expect(hasStalePrices(userId, new Date('2026-10-27T11:30:00'))).toBe(true);
	});

	it('does not stamp an old quote on a holding whose symbol changed mid-fetch', async () => {
		const userId = bootstrap();
		const h = createHolding(userId, { ...base, assetClass: 'etf', symbol: 'CW8.PA' });
		const racingFetch = (async (input: string | URL | Request) => {
			// The user switches the line to bitcoin while the quote is in flight.
			updateHolding(userId, h.id, { ...base, assetClass: 'crypto', symbol: 'bitcoin' });
			return fakeFetch(input);
		}) as typeof fetch;
		expect(await refreshPrices({ userId, fetchFn: racingFetch })).toBe(0);
		const [row] = listHoldings(userId);
		expect(row?.symbol).toBe('bitcoin');
		expect(row?.lastPriceCents).toBeNull();
	});

	it('updateHolding stores the new symbol price when given', () => {
		const userId = bootstrap();
		const h = createHolding(userId, { ...base, assetClass: 'etf', symbol: 'CW8.PA' }, 71_301);
		updateHolding(userId, h.id, { ...base, assetClass: 'crypto', symbol: 'bitcoin' }, 7_000_000);
		expect(listHoldings(userId)[0]?.lastPriceCents).toBe(7_000_000);
	});
});
