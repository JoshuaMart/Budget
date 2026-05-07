import { fail, redirect } from '@sveltejs/kit';

import { listAccountsWithBalance } from '$lib/server/services/accounts.service';
import { listCategories } from '$lib/server/services/categories.service';
import { listEnvelopes } from '$lib/server/services/envelopes.service';
import {
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

export const actions: Actions = {
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
