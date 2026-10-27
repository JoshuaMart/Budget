import type { AssetClass } from '#lib/domain/index.ts';

// Market data sources, both free and keyless:
// - Yahoo Finance (unofficial chart/search endpoints) for ETFs and stocks,
//   keyed by ticker (CW8.PA, AAPL). Prices come in the listing currency and
//   are converted to EUR with Yahoo's own FX pairs.
// - CoinGecko for crypto, keyed by coin id (bitcoin, ethereum, solana),
//   priced directly in EUR.

const YAHOO = 'https://query1.finance.yahoo.com';
const COINGECKO = 'https://api.coingecko.com/api/v3';
const TIMEOUT_MS = 8000;

type Fetch = typeof fetch;

export interface QuoteRef {
	assetClass: AssetClass;
	symbol: string;
}

export interface SymbolMatch {
	symbol: string;
	label: string;
	exchange: string;
}

export const quoteKey = (q: QuoteRef) => `${q.assetClass}:${q.symbol}`;

async function getJson(url: string, fetchFn: Fetch): Promise<unknown> {
	const res = await fetchFn(url, {
		// Yahoo rejects requests without a browser-ish user agent.
		headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
		signal: AbortSignal.timeout(TIMEOUT_MS)
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
	return res.json();
}

interface YahooChart {
	chart?: { result?: { meta?: { regularMarketPrice?: number; currency?: string } }[] | null };
}

/** Last price of a Yahoo ticker, in its listing currency. */
async function yahooPrice(
	symbol: string,
	fetchFn: Fetch
): Promise<{ price: number; currency: string }> {
	const url = `${YAHOO}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
	const data = (await getJson(url, fetchFn)) as YahooChart;
	const meta = data.chart?.result?.[0]?.meta;
	if (typeof meta?.regularMarketPrice !== 'number' || !meta.currency) {
		throw new Error(`no price for ${symbol}`);
	}
	return { price: meta.regularMarketPrice, currency: meta.currency };
}

/** Price in euros, converting from the listing currency when needed. */
async function yahooPriceEur(
	symbol: string,
	fetchFn: Fetch,
	fxCache: Map<string, Promise<number>>
): Promise<number> {
	let { price, currency } = await yahooPrice(symbol, fetchFn);
	// London quotes in pence.
	if (currency === 'GBp' || currency === 'GBX') {
		price /= 100;
		currency = 'GBP';
	}
	if (currency === 'EUR') return price;
	let rate = fxCache.get(currency);
	if (!rate) {
		rate = yahooPrice(`${currency}EUR=X`, fetchFn).then((r) => r.price);
		fxCache.set(currency, rate);
	}
	return price * (await rate);
}

async function coingeckoPricesEur(ids: string[], fetchFn: Fetch): Promise<Map<string, number>> {
	const out = new Map<string, number>();
	if (ids.length === 0) return out;
	const url = `${COINGECKO}/simple/price?ids=${ids.map(encodeURIComponent).join(',')}&vs_currencies=eur`;
	const data = (await getJson(url, fetchFn)) as Record<string, { eur?: number }>;
	for (const id of ids) {
		const eur = data[id]?.eur;
		if (typeof eur === 'number') out.set(id, eur);
	}
	return out;
}

/**
 * Fetch current unit prices in euro cents, keyed by `quoteKey`. Symbols whose
 * lookup fails are simply missing from the result, so one bad ticker never
 * blocks the others.
 */
export async function fetchPricesCents(
	refs: QuoteRef[],
	fetchFn: Fetch = fetch
): Promise<Map<string, number>> {
	const out = new Map<string, number>();
	const toCents = (eur: number) => Math.round(eur * 100);

	const cryptoIds = [
		...new Set(refs.filter((r) => r.assetClass === 'crypto').map((r) => r.symbol))
	];
	const tickers = [...new Set(refs.filter((r) => r.assetClass !== 'crypto').map((r) => r.symbol))];
	const fxCache = new Map<string, Promise<number>>();

	const [crypto, yahoo] = await Promise.all([
		coingeckoPricesEur(cryptoIds, fetchFn).catch((e) => {
			console.warn('[quotes] coingecko failed:', e instanceof Error ? e.message : e);
			return new Map<string, number>();
		}),
		Promise.allSettled(tickers.map((t) => yahooPriceEur(t, fetchFn, fxCache)))
	]);

	for (const [id, eur] of crypto)
		out.set(quoteKey({ assetClass: 'crypto', symbol: id }), toCents(eur));
	const priceByTicker = new Map<string, number>();
	yahoo.forEach((r, i) => {
		if (r.status === 'fulfilled') priceByTicker.set(tickers[i]!, toCents(r.value));
		else console.warn(`[quotes] yahoo ${tickers[i]} failed:`, String(r.reason));
	});
	for (const ref of refs) {
		const cents = ref.assetClass === 'crypto' ? undefined : priceByTicker.get(ref.symbol);
		if (cents !== undefined) out.set(quoteKey(ref), cents);
	}
	return out;
}

interface YahooSearch {
	quotes?: {
		symbol?: string;
		shortname?: string;
		longname?: string;
		exchange?: string;
		quoteType?: string;
	}[];
}
interface CoingeckoSearch {
	coins?: { id?: string; name?: string; symbol?: string }[];
}

/** Ticker / coin lookup used by the "add position" form. */
export async function searchSymbols(
	query: string,
	assetClass: AssetClass,
	fetchFn: Fetch = fetch
): Promise<SymbolMatch[]> {
	const q = encodeURIComponent(query.trim());
	if (!q) return [];
	if (assetClass === 'crypto') {
		const data = (await getJson(`${COINGECKO}/search?query=${q}`, fetchFn)) as CoingeckoSearch;
		return (data.coins ?? [])
			.filter((c) => c.id && c.name)
			.slice(0, 8)
			.map((c) => ({ symbol: c.id!, label: c.name!, exchange: (c.symbol ?? '').toUpperCase() }));
	}
	const quoteType = assetClass === 'etf' ? 'ETF' : 'EQUITY';
	const data = (await getJson(
		`${YAHOO}/v1/finance/search?q=${q}&quotesCount=15&newsCount=0`,
		fetchFn
	)) as YahooSearch;
	return (data.quotes ?? [])
		.filter((r) => r.symbol && r.quoteType === quoteType)
		.slice(0, 8)
		.map((r) => ({
			symbol: r.symbol!,
			label: (r.longname ?? r.shortname ?? r.symbol!).trim(),
			exchange: r.exchange ?? ''
		}));
}
