import { describe, expect, it } from 'vitest';

import type { MonthSummary } from './budget';
import { complianceScore } from './compliance';

const RATIOS = { necessities: 50, wants: 30, investments: 20 };

const summary = (nec: number, want: number, inv: number): MonthSummary => ({
	income: 0,
	totalSpent: nec + want + inv,
	byEnvelope: {
		necessities: { spent: nec, budget: 0, remaining: 0 },
		wants: { spent: want, budget: 0, remaining: 0 },
		investments: { spent: inv, budget: 0, remaining: 0 }
	},
	byCategory: {}
});

describe('complianceScore', () => {
	it('returns 100 when nothing is spent yet', () => {
		expect(complianceScore(summary(0, 0, 0), RATIOS)).toBe(100);
	});

	it('returns 100 for a perfectly balanced spend', () => {
		expect(complianceScore(summary(50000, 30000, 20000), RATIOS)).toBe(100);
	});

	it('drops as the spread shifts away from target', () => {
		// 60/30/10 vs 50/30/20 → deviation 20
		expect(complianceScore(summary(60000, 30000, 10000), RATIOS)).toBe(80);
	});

	it('clamps to 0 in the worst case (everything in one envelope)', () => {
		// 100/0/0 vs 50/30/20 → deviation 100, clamped at 0
		expect(complianceScore(summary(100000, 0, 0), RATIOS)).toBe(0);
	});
});
