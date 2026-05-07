// Pure budget calculations. Inputs are plain rows; outputs are plain numbers
// or summary objects. No DB, no I/O, no Svelte.

import type { Envelope, Transaction } from '$lib/server/db/schema';

import { isInMonth, type YearMonth } from './dates';

export type EnvelopeKey = 'necessities' | 'wants' | 'investments';

export interface Ratios {
	necessities: number;
	wants: number;
	investments: number;
}

export interface EnvelopeStats {
	spent: number;
	budget: number;
	remaining: number;
}

export interface MonthSummary {
	income: number;
	totalSpent: number;
	byEnvelope: Record<EnvelopeKey, EnvelopeStats>;
	/** categoryId → spent cents. */
	byCategory: Record<string, number>;
}

const ENVELOPE_KEYS: readonly EnvelopeKey[] = ['necessities', 'wants', 'investments'];

const emptyEnvStats = (): Record<EnvelopeKey, EnvelopeStats> => ({
	necessities: { spent: 0, budget: 0, remaining: 0 },
	wants: { spent: 0, budget: 0, remaining: 0 },
	investments: { spent: 0, budget: 0, remaining: 0 }
});

/** Sum of `kind === 'income'` transactions inside the given month. */
export function monthIncome(transactions: Transaction[], ym: YearMonth): number {
	let total = 0;
	for (const t of transactions) {
		if (t.kind === 'income' && isInMonth(t.date, ym.year, ym.month)) {
			total += t.amountCents;
		}
	}
	return total;
}

/** `incomeCents × ratio / 100`, rounded to nearest cent. */
export function envelopeBudget(incomeCents: number, ratio: number): number {
	return Math.round((incomeCents * ratio) / 100);
}

/** Spent (positive cents) inside `envelopeId` for the given month. Excludes income. */
export function envelopeSpent(
	transactions: Transaction[],
	envelopeId: string,
	ym: YearMonth
): number {
	let total = 0;
	for (const t of transactions) {
		if (
			t.kind !== 'income' &&
			t.envelopeId === envelopeId &&
			isInMonth(t.date, ym.year, ym.month)
		) {
			total += Math.abs(t.amountCents);
		}
	}
	return total;
}

/** `budget − spent`. Negative means dépassement. */
export function envelopeRemaining(budget: number, spent: number): number {
	return budget - spent;
}

/**
 * Single-pass aggregation: month income, total spent, per-envelope stats and
 * per-category totals. Cheaper than calling each helper separately when you
 * need everything (which is the dashboard's case).
 */
export function monthSummary(
	transactions: Transaction[],
	envelopes: readonly Pick<Envelope, 'id' | 'key'>[],
	ratios: Ratios,
	ym: YearMonth
): MonthSummary {
	const envIdToKey = new Map<string, EnvelopeKey>();
	for (const e of envelopes) envIdToKey.set(e.id, e.key);

	const byEnvelope = emptyEnvStats();
	const byCategory: Record<string, number> = {};
	let income = 0;
	let totalSpent = 0;

	for (const t of transactions) {
		if (!isInMonth(t.date, ym.year, ym.month)) continue;
		if (t.kind === 'income') {
			income += t.amountCents;
			continue;
		}
		if (!t.envelopeId) continue;
		const key = envIdToKey.get(t.envelopeId);
		if (!key) continue;
		const abs = Math.abs(t.amountCents);
		byEnvelope[key].spent += abs;
		totalSpent += abs;
		if (t.categoryId) {
			byCategory[t.categoryId] = (byCategory[t.categoryId] ?? 0) + abs;
		}
	}

	for (const key of ENVELOPE_KEYS) {
		const stats = byEnvelope[key];
		stats.budget = envelopeBudget(income, ratios[key]);
		stats.remaining = envelopeRemaining(stats.budget, stats.spent);
	}

	return { income, totalSpent, byEnvelope, byCategory };
}
