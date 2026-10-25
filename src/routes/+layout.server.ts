import { signupEnabled } from '#lib/server/auth.ts';
import { listAccountsWithBalance } from '#lib/server/services/accounts.service.ts';
import { listCategories } from '#lib/server/services/categories.service.ts';
import { listEnvelopes } from '#lib/server/services/envelopes.service.ts';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) {
		return { user: null, accounts: [], envelopes: [], categories: [], signupEnabled };
	}
	return {
		user: locals.user,
		accounts: listAccountsWithBalance(locals.user.id),
		envelopes: listEnvelopes(locals.user.id),
		categories: listCategories(locals.user.id),
		signupEnabled
	};
};
