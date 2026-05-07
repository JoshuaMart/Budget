// Conformity to the configured envelope ratios (50/30/20 by default).
//
// Score = 100 − Σ |actualRatio − targetRatio| over the three envelopes,
// clamped to [0, 100]. Perfect alignment scores 100; the worst possible
// imbalance (e.g. spending only on one envelope when none was budgeted)
// caps at 0.

import type { MonthSummary, Ratios } from './budget';

export function complianceScore(summary: MonthSummary, ratios: Ratios): number {
	const total = summary.totalSpent;
	if (total === 0) return 100;

	const actualNec = (summary.byEnvelope.necessities.spent / total) * 100;
	const actualWant = (summary.byEnvelope.wants.spent / total) * 100;
	const actualInv = (summary.byEnvelope.investments.spent / total) * 100;

	const deviation =
		Math.abs(actualNec - ratios.necessities) +
		Math.abs(actualWant - ratios.wants) +
		Math.abs(actualInv - ratios.investments);

	return Math.max(0, Math.round(100 - deviation));
}
