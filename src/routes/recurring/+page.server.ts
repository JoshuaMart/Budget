import { fail, redirect } from '@sveltejs/kit';

import { recurringInput } from '$lib/server/schemas';
import { listAccountsWithBalance } from '$lib/server/services/accounts.service';
import { listCategories } from '$lib/server/services/categories.service';
import { listEnvelopes } from '$lib/server/services/envelopes.service';
import {
	createRecurring,
	deleteRecurring,
	listRecurrings,
	toggleRecurring
} from '$lib/server/services/recurring.service';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const userId = locals.user.id;
	return {
		recurrings: listRecurrings(userId),
		envelopes: listEnvelopes(userId),
		categories: listCategories(userId),
		accounts: listAccountsWithBalance(userId)
	};
};

function parseAmountToCents(raw: string | undefined): number | null {
	if (!raw) return null;
	const n = Number.parseFloat(raw.replace(',', '.').trim());
	if (!Number.isFinite(n) || n <= 0) return null;
	return Math.round(n * 100);
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const data = await request.formData();
		const amountCents = parseAmountToCents(data.get('amount')?.toString());
		if (!amountCents) return fail(400, { error: 'Montant invalide' });

		const kind = data.get('kind')?.toString() ?? 'expense';
		const frequency = data.get('frequency')?.toString() ?? '';
		const nextDate = data.get('date')?.toString() ?? '';
		// Monthly recurrings anchor to the chosen day; weekly/yearly don't need it.
		const dayOfMonth =
			frequency === 'monthly' && /^\d{4}-\d{2}-\d{2}$/.test(nextDate)
				? Number(nextDate.slice(8, 10))
				: undefined;

		const base = {
			kind,
			frequency,
			amountCents,
			merchant: data.get('merchant')?.toString() ?? '',
			accountId: data.get('accountId')?.toString() ?? '',
			// recurringInput extends the tx schemas, which still require `date`;
			// the first occurrence date doubles as both `date` and `nextDate`.
			date: nextDate,
			nextDate,
			dayOfMonth
		};
		let body: unknown;
		if (kind === 'transfer') {
			body = {
				...base,
				toAccountId: data.get('toAccountId')?.toString() ?? '',
				envelopeId: data.get('envelopeId')?.toString() ?? '',
				categoryId: data.get('categoryId')?.toString() || undefined
			};
		} else if (kind === 'income') {
			body = {
				...base,
				incomeCategory: data.get('incomeCategory')?.toString() || undefined
			};
		} else {
			body = {
				...base,
				envelopeId: data.get('envelopeId')?.toString() ?? '',
				categoryId: data.get('categoryId')?.toString() || undefined
			};
		}
		const parsed = recurringInput.safeParse(body);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Données invalides' });
		}
		createRecurring(locals.user.id, parsed.data);
		return { success: true };
	},

	toggle: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Identifiant manquant' });
		try {
			toggleRecurring(locals.user.id, id);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Bascule impossible' });
		}
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Identifiant manquant' });
		deleteRecurring(locals.user.id, id);
		return { success: true };
	}
};
