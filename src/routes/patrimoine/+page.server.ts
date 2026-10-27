import { fail, redirect } from '@sveltejs/kit';

import { parseDecimal } from '#lib/domain/index.ts';
import { type HoldingInput, holdingInput } from '#lib/server/schemas/index.ts';
import {
	createHolding,
	deleteHolding,
	getHolding,
	hasStalePrices,
	isSameQuote,
	listHoldings,
	listSnapshots,
	recordSnapshot,
	refreshPrices,
	updateHolding
} from '#lib/server/services/holdings.service.ts';
import { fetchPricesCents, quoteKey } from '#lib/server/services/quotes.service.ts';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const userId = locals.user.id;

	// The scheduler refreshes every 6h; top up on demand when the page is
	// opened with prices older than an hour.
	if (hasStalePrices(userId)) {
		await refreshPrices({ userId }).catch((e) =>
			console.warn('[patrimoine] refresh failed:', e instanceof Error ? e.message : e)
		);
	}

	return { holdings: listHoldings(userId), snapshots: listSnapshots(userId) };
};

type ParseResult = { ok: true; data: HoldingInput } | { ok: false; error: string };

function parseHoldingForm(data: FormData): ParseResult {
	// NaN (unparsable input) is rejected by the schema with its own message.
	const num = (key: string) => parseDecimal(data.get(key)?.toString()) ?? Number.NaN;
	const quantity = num('quantity');
	// Cost is optional and can be typed per unit (PRU) or as the total
	// amount invested, which brokers and exchanges often show instead.
	const rawCost = data.get('cost')?.toString().trim() ?? '';
	let avgCostCents: number | null = null;
	if (rawCost) {
		const cost = num('cost') * 100;
		avgCostCents = data.get('costMode') === 'total' ? cost / quantity : cost;
	}
	const parsed = holdingInput.safeParse({
		assetClass: data.get('assetClass')?.toString(),
		wallet: data.get('wallet')?.toString() ?? '',
		symbol: data.get('symbol')?.toString() ?? '',
		label: data.get('label')?.toString() ?? '',
		quantity,
		// Keeps sub-cent precision, like fetched prices.
		avgCostCents
	});
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' };
	}
	return { ok: true, data: parsed.data };
}

/** Fetch the price of the submitted symbol; also proves it exists. */
async function priceOf(input: HoldingInput): Promise<number | undefined> {
	const prices = await fetchPricesCents([input]).catch(() => new Map<string, number>());
	return prices.get(quoteKey(input));
}

// Unknown ticker and provider outage look the same from here.
const NO_QUOTE =
	'Cours indisponible pour ce symbole : choisissez-le dans les suggestions, ou réessayez plus tard si le service de cotation ne répond pas.';

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const result = parseHoldingForm(await request.formData());
		if (!result.ok) return fail(400, { error: result.error });
		const price = await priceOf(result.data);
		if (price === undefined) return fail(400, { error: NO_QUOTE });
		createHolding(locals.user.id, result.data, price);
		recordSnapshot(locals.user.id);
		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Identifiant manquant' });
		const result = parseHoldingForm(data);
		if (!result.ok) return fail(400, { error: result.error });
		const userId = locals.user.id;
		const current = getHolding(userId, id);
		if (!current) return fail(404, { error: 'Position introuvable' });
		// Only a new symbol needs a quote; editing quantity or PRU must keep
		// working while the price providers are down.
		let price: number | undefined;
		if (!isSameQuote(current, result.data)) {
			price = await priceOf(result.data);
			if (price === undefined) return fail(400, { error: NO_QUOTE });
		}
		updateHolding(userId, id, result.data, price);
		recordSnapshot(userId);
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const id = (await request.formData()).get('id')?.toString();
		if (!id) return fail(400, { error: 'Identifiant manquant' });
		deleteHolding(locals.user.id, id);
		recordSnapshot(locals.user.id);
		return { success: true };
	},

	refresh: async ({ locals }) => {
		if (!locals.user) return fail(401);
		const n = await refreshPrices({ userId: locals.user.id }).catch(() => 0);
		return { success: true, refreshed: n };
	}
};
