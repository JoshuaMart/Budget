import { redirect } from '@sveltejs/kit';

import { complianceScore, monthSummary, type YearMonth } from '$lib/domain';
import { listEnvelopes } from '$lib/server/services/envelopes.service';
import { monthlyTrend, topCategories } from '$lib/server/services/stats.service';
import { listTransactions } from '$lib/server/services/transactions.service';

import type { PageServerLoad } from './$types';

const RATIOS = { necessities: 50, wants: 30, investments: 20 };

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const userId = locals.user.id;

	const now = new Date();
	const ym: YearMonth = { year: now.getFullYear(), month: now.getMonth() };

	const envelopes = listEnvelopes(userId);
	const transactions = listTransactions(userId);
	const summary = monthSummary(transactions, envelopes, RATIOS, ym);
	const trend = monthlyTrend(userId, ym, 6);
	const top = topCategories(userId, ym, 6);
	const compliance = complianceScore(summary, RATIOS);

	return { ym, envelopes, summary, trend, top, compliance };
};
