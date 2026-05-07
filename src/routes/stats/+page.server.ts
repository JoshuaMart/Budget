import { redirect } from '@sveltejs/kit';

import { complianceScore, monthSummary, type YearMonth } from '$lib/domain';
import { listEnvelopes } from '$lib/server/services/envelopes.service';
import { monthlyTrend, topCategories } from '$lib/server/services/stats.service';
import { listTransactions } from '$lib/server/services/transactions.service';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const userId = locals.user.id;

	const now = new Date();
	const ym: YearMonth = { year: now.getFullYear(), month: now.getMonth() };

	const envelopes = listEnvelopes(userId);
	const transactions = listTransactions(userId);

	const ratios = {
		necessities: envelopes.find((e) => e.key === 'necessities')?.ratio ?? 50,
		wants: envelopes.find((e) => e.key === 'wants')?.ratio ?? 30,
		investments: envelopes.find((e) => e.key === 'investments')?.ratio ?? 20
	};

	const summary = monthSummary(transactions, envelopes, ratios, ym);
	const trend = monthlyTrend(userId, ym, 6);
	const top = topCategories(userId, ym, 6);
	const compliance = complianceScore(summary, ratios);

	return { ym, envelopes, summary, trend, top, compliance };
};
