import { fail, redirect } from '@sveltejs/kit';

import { type HoldingInput, holdingInput } from '#lib/server/schemas/index.ts';
import {
	createHolding,
	deleteHolding,
	hasStalePrices,
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

function parseDecimal(raw: FormDataEntryValue | null): number {
	return Number.parseFloat((raw?.toString() ?? '').replace(/\s/g, '').replace(',', '.'));
}

type ParseResult = { ok: true; data: HoldingInput } | { ok: false; error: string };

function parseHoldingForm(data: FormData): ParseResult {
	const avgCost = parseDecimal(data.get('avgCost'));
	const parsed = holdingInput.safeParse({
		assetClass: data.get('assetClass')?.toString(),
		wallet: data.get('wallet')?.toString() ?? '',
		symbol: data.get('symbol')?.toString() ?? '',
		label: data.get('label')?.toString() ?? '',
		quantity: parseDecimal(data.get('quantity')),
		avgCostCents: Number.isFinite(avgCost) ? Math.round(avgCost * 100) : Number.NaN
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

const UNKNOWN_SYMBOL = 'Aucun cours trouvé pour ce symbole — choisissez-le dans les suggestions.';

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const result = parseHoldingForm(await request.formData());
		if (!result.ok) return fail(400, { error: result.error });
		const price = await priceOf(result.data);
		if (price === undefined) return fail(400, { error: UNKNOWN_SYMBOL });
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
		if ((await priceOf(result.data)) === undefined) return fail(400, { error: UNKNOWN_SYMBOL });
		updateHolding(locals.user.id, id, result.data);
		await refreshPrices({ userId: locals.user.id }).catch(() => 0);
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
