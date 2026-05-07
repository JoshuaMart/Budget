import { listAccountsWithBalance } from '$lib/server/services/accounts.service';
import { listCategories } from '$lib/server/services/categories.service';
import { listEnvelopes } from '$lib/server/services/envelopes.service';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) {
		return { user: null, accounts: [], envelopes: [], categories: [] };
	}
	return {
		user: locals.user,
		accounts: listAccountsWithBalance(locals.user.id),
		envelopes: listEnvelopes(locals.user.id),
		categories: listCategories(locals.user.id)
	};
};
