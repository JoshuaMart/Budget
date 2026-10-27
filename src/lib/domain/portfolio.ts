// Net worth computations over investment holdings. Pure functions: prices
// are fetched and stored by the server, these only aggregate.

export type AssetClass = 'etf' | 'stock' | 'crypto';

export const ASSET_CLASSES: AssetClass[] = ['etf', 'stock', 'crypto'];

export interface HoldingLike {
	assetClass: AssetClass;
	wallet: string;
	quantity: number;
	avgCostCents: number;
	lastPriceCents: number | null;
}

/** Current market value; falls back to cost basis while no price is known. */
export function holdingValue(h: HoldingLike): number {
	const unit = h.lastPriceCents ?? h.avgCostCents;
	return Math.round(h.quantity * unit);
}

export function holdingCost(h: HoldingLike): number {
	return Math.round(h.quantity * h.avgCostCents);
}

export interface Performance {
	valueCents: number;
	costCents: number;
	gainCents: number;
	/** Gain relative to cost, in percent. 0 when the cost basis is 0. */
	gainPct: number;
}

export function performance(holdings: HoldingLike[]): Performance {
	let valueCents = 0;
	let costCents = 0;
	for (const h of holdings) {
		valueCents += holdingValue(h);
		costCents += holdingCost(h);
	}
	const gainCents = valueCents - costCents;
	const gainPct = costCents > 0 ? (gainCents / costCents) * 100 : 0;
	return { valueCents, costCents, gainCents, gainPct };
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
