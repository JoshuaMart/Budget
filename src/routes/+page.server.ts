import { fail, redirect } from '@sveltejs/kit';

import { monthSummary, type YearMonth } from '$lib/domain';
import { ratiosInput } from '$lib/server/schemas';
import {
	createCategory,
	deleteCategory,
	listCategories
} from '$lib/server/services/categories.service';
import { listEnvelopes, updateRatios } from '$lib/server/services/envelopes.service';
import { listTransactions } from '$lib/server/services/transactions.service';

import type { Actions, PageServerLoad } from './$types';

const MONTH_PARAM = /^(\d{4})-(\d{2})$/;

function parseMonthParam(raw: string | null): YearMonth {
	const m = raw?.match(MONTH_PARAM);
	if (m && m[1] && m[2]) {
		return { year: Number(m[1]), month: Number(m[2]) - 1 };
	}
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() };
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) throw redirect(303, '/login');
	const userId = locals.user.id;
	const ym = parseMonthParam(url.searchParams.get('m'));

	const envelopes = listEnvelopes(userId);
	const categories = listCategories(userId);
	const transactions = listTransactions(userId);

	const ratios = {
		necessities: envelopes.find((e) => e.key === 'necessities')?.ratio ?? 50,
		wants: envelopes.find((e) => e.key === 'wants')?.ratio ?? 30,
		investments: envelopes.find((e) => e.key === 'investments')?.ratio ?? 20
	};

	const summary = monthSummary(transactions, envelopes, ratios, ym);

	return { ym, envelopes, categories, summary };
};

export const actions: Actions = {
	addCategory: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const data = await request.formData();
		const envelopeId = data.get('envelopeId')?.toString();
		const label = data.get('label')?.toString().trim();
		if (!envelopeId || !label) return fail(400, { error: 'Champs manquants' });
		createCategory(locals.user.id, { envelopeId, label });
		return { success: true };
	},

	removeCategory: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const data = await request.formData();
		const categoryId = data.get('categoryId')?.toString();
		if (!categoryId) return fail(400, { error: 'Identifiant manquant' });
		try {
			deleteCategory(locals.user.id, categoryId);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Suppression impossible' });
		}
		return { success: true };
	},

	updateRatios: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const data = await request.formData();
		const parsed = ratiosInput.safeParse({
			necessities: Number(data.get('necessities')),
			wants: Number(data.get('wants')),
			investments: Number(data.get('investments'))
		});
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Ratios invalides' });
		}
		updateRatios(locals.user.id, parsed.data);
		return { success: true };
	}
};
