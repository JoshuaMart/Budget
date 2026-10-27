// Net worth computations over investment holdings. Pure functions: prices
// are fetched and stored by the server, these only aggregate.

export type AssetClass = 'etf' | 'stock' | 'crypto';

export const ASSET_CLASSES: AssetClass[] = ['etf', 'stock', 'crypto'];

export interface HoldingLike {
	assetClass: AssetClass;
	wallet: string;
	quantity: number;
	/** Average unit cost (PRU); null when the user didn't provide it. */
	avgCostCents: number | null;
	lastPriceCents: number | null;
}

/** Current market value; falls back to cost basis while no price is known. */
export function holdingValue(h: HoldingLike): number {
	const unit = h.lastPriceCents ?? h.avgCostCents ?? 0;
	return Math.round(h.quantity * unit);
}

/** Amount invested, or null when the PRU is unknown. */
export function holdingCost(h: HoldingLike): number | null {
	return h.avgCostCents === null ? null : Math.round(h.quantity * h.avgCostCents);
}

export interface Performance {
	/** Market value of every holding. */
	valueCents: number;
	/** Invested amount, over holdings with a known PRU only. */
	costCents: number;
	/** Gain over holdings with a known PRU only. */
	gainCents: number;
	/** Gain relative to cost, in percent. 0 when the cost basis is 0. */
	gainPct: number;
	/** Holdings left out of cost and gain because their PRU is unknown. */
	uncostedCount: number;
}

export function performance(holdings: HoldingLike[]): Performance {
	let valueCents = 0;
	let costCents = 0;
	let costedValueCents = 0;
	let uncostedCount = 0;
	for (const h of holdings) {
		const value = holdingValue(h);
		const cost = holdingCost(h);
		valueCents += value;
		if (cost === null) {
			uncostedCount++;
			continue;
		}
		costCents += cost;
		costedValueCents += value;
	}
	const gainCents = costedValueCents - costCents;
	const gainPct = costCents > 0 ? (gainCents / costCents) * 100 : 0;
	return { valueCents, costCents, gainCents, gainPct, uncostedCount };
}

/** Market value summed per asset class (always the three keys). */
export function allocationByClass(holdings: HoldingLike[]): Record<AssetClass, number> {
	const out: Record<AssetClass, number> = { etf: 0, stock: 0, crypto: 0 };
	for (const h of holdings) out[h.assetClass] += holdingValue(h);
	return out;
}

/** Market value summed per wallet, sorted by value desc. */
export function allocationByWallet(
	holdings: HoldingLike[]
): { wallet: string; valueCents: number }[] {
	const m = new Map<string, number>();
	for (const h of holdings) m.set(h.wallet, (m.get(h.wallet) ?? 0) + holdingValue(h));
	return [...m.entries()]
		.map(([wallet, valueCents]) => ({ wallet, valueCents }))
		.sort((a, b) => b.valueCents - a.valueCents);
}
