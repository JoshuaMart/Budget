import { describe, expect, it } from 'vitest';

import {
	allocationByClass,
	allocationByWallet,
	type HoldingLike,
	holdingValue,
	performance
} from './portfolio';

const h = (over: Partial<HoldingLike>): HoldingLike => ({
	assetClass: 'etf',
	wallet: 'PEA',
	quantity: 1,
	avgCostCents: 0,
	lastPriceCents: null,
	...over
});

describe('portfolio', () => {
	it('holdingValue uses last price, rounded to the cent', () => {
		expect(holdingValue(h({ quantity: 0.0123, lastPriceCents: 7_157_700 }))).toBe(88_040);
	});

	it('holdingValue falls back to cost basis without a price', () => {
		expect(holdingValue(h({ quantity: 3, avgCostCents: 50_000 }))).toBe(150_000);
	});

	it('performance computes gain and percentage', () => {
		const p = performance([
			h({ quantity: 10, avgCostCents: 50_000, lastPriceCents: 60_000 }),
			h({ quantity: 2, avgCostCents: 10_000, lastPriceCents: 5_000 })
		]);
		expect(p).toEqual({
			valueCents: 610_000,
			costCents: 520_000,
			gainCents: 90_000,
			gainPct: (90_000 / 520_000) * 100,
			uncostedCount: 0
		});
	});

	it('performance is 0 % on an empty or free cost basis', () => {
		expect(performance([]).gainPct).toBe(0);
		expect(performance([h({ lastPriceCents: 100 })]).gainPct).toBe(0);
	});

	it('allocationByClass always returns the three classes', () => {
		expect(
			allocationByClass([
				h({ assetClass: 'crypto', lastPriceCents: 300 }),
				h({ assetClass: 'etf', lastPriceCents: 100 }),
				h({ assetClass: 'etf', lastPriceCents: 50 })
			])
		).toEqual({ etf: 150, stock: 0, crypto: 300 });
	});

	it('allocationByWallet groups and sorts by value desc', () => {
		expect(
			allocationByWallet([
				h({ wallet: 'PEA', lastPriceCents: 100 }),
				h({ wallet: 'Ledger', lastPriceCents: 500 }),
				h({ wallet: 'PEA', lastPriceCents: 100 })
			])
		).toEqual([
			{ wallet: 'Ledger', valueCents: 500 },
			{ wallet: 'PEA', valueCents: 200 }
		]);
	});

	it('performance leaves holdings without PRU out of cost and gain', () => {
		const p = performance([
			h({ quantity: 10, avgCostCents: 50_000, lastPriceCents: 60_000 }),
			h({ quantity: 1, avgCostCents: null, lastPriceCents: 7_000_000 })
		]);
		expect(p).toEqual({
			valueCents: 7_600_000,
			costCents: 500_000,
			gainCents: 100_000,
			gainPct: 20,
			uncostedCount: 1
		});
	});
});
