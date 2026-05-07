import { eq } from 'drizzle-orm';

import { addMonths, type EnvelopeKey, monthSummary, type YearMonth } from '$lib/domain';

import { db } from '../db/client';
import { category, envelope, transaction } from '../db/schema';

export interface MonthlyTrendPoint extends YearMonth {
	necessities: number;
	wants: number;
	investments: number;
}

/**
 * Last `count` months of spending per envelope, oldest first.
 *
 * Pulls all of the user's transactions once and aggregates in memory; fine
 * until the user accumulates 100k+ rows, at which point we'd switch to
 * GROUP BY queries.
 */
export function monthlyTrend(userId: string, anchor: YearMonth, count = 6): MonthlyTrendPoint[] {
	const envs = db.select().from(envelope).where(eq(envelope.userId, userId)).all();
	const txs = db.select().from(transaction).where(eq(transaction.userId, userId)).all();

	const points: MonthlyTrendPoint[] = [];
	for (let i = count - 1; i >= 0; i--) {
		const ym = addMonths(anchor, -i);
		const summary = monthSummary(txs, envs, { necessities: 0, wants: 0, investments: 0 }, ym);
		points.push({
			...ym,
			necessities: summary.byEnvelope.necessities.spent,
			wants: summary.byEnvelope.wants.spent,
			investments: summary.byEnvelope.investments.spent
		});
	}
	return points;
}

export interface TopCategory {
	categoryId: string;
	label: string;
	envelopeKey: EnvelopeKey;
	spentCents: number;
}

export function topCategories(userId: string, ym: YearMonth, limit = 6): TopCategory[] {
	const envs = db.select().from(envelope).where(eq(envelope.userId, userId)).all();
	const cats = db.select().from(category).where(eq(category.userId, userId)).all();
	const txs = db.select().from(transaction).where(eq(transaction.userId, userId)).all();

	const summary = monthSummary(
		txs,
		envs,
		{ necessities: 50, wants: 30, investments: 20 }, // ratios irrelevant for byCategory
		ym
	);
	const envIdToKey = new Map<string, EnvelopeKey>(envs.map((e) => [e.id, e.key]));
	const catById = new Map(cats.map((c) => [c.id, c]));

	return Object.entries(summary.byCategory)
		.map(([categoryId, spentCents]) => {
			const cat = catById.get(categoryId);
			return {
				categoryId,
				label: cat?.label ?? '?',
				envelopeKey: cat ? (envIdToKey.get(cat.envelopeId) ?? 'necessities') : 'necessities',
				spentCents
			};
		})
		.sort((a, b) => b.spentCents - a.spentCents)
		.slice(0, limit);
}

export interface DonutSlice {
	envelopeKey: EnvelopeKey;
	spentCents: number;
	budgetCents: number;
	remainingCents: number;
}

export function envelopeDonut(
	userId: string,
	ym: YearMonth,
	ratios: { necessities: number; wants: number; investments: number }
): DonutSlice[] {
	const envs = db.select().from(envelope).where(eq(envelope.userId, userId)).all();
	const txs = db.select().from(transaction).where(eq(transaction.userId, userId)).all();
	const summary = monthSummary(txs, envs, ratios, ym);
	return (['necessities', 'wants', 'investments'] as const).map((key) => ({
		envelopeKey: key,
		spentCents: summary.byEnvelope[key].spent,
		budgetCents: summary.byEnvelope[key].budget,
		remainingCents: summary.byEnvelope[key].remaining
	}));
}
