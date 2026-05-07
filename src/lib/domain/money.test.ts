import { describe, expect, it } from 'vitest';

import { formatCents, toCents, toEuros } from './money';

// Different ICU/Node builds use NBSP (U+00A0), NNBSP (U+202F) or regular
// spaces in fr-FR currency strings. Normalise so assertions stay stable.
const normalize = (s: string): string => s.replace(/[\u00a0\u202f ]/g, ' ');

describe('toCents / toEuros', () => {
	it('rounds half-cents up', () => {
		expect(toCents(0.005)).toBe(1);
		expect(toCents(0.004)).toBe(0);
	});

	it('round-trips through euros', () => {
		expect(toEuros(toCents(123.45))).toBeCloseTo(123.45);
	});

	it('handles negatives', () => {
		expect(toCents(-12.3)).toBe(-1230);
	});
});

describe('formatCents', () => {
	it('formats positive amounts in fr-FR EUR', () => {
		expect(normalize(formatCents(12345))).toBe('123,45 €');
	});

	it('uses minus sign for negatives', () => {
		expect(normalize(formatCents(-12345))).toBe('−123,45 €');
	});

	it('signed: prepends + for positives, − for negatives, nothing for 0', () => {
		expect(normalize(formatCents(12345, { signed: true }))).toBe('+123,45 €');
		expect(normalize(formatCents(-12345, { signed: true }))).toBe('−123,45 €');
		expect(normalize(formatCents(0, { signed: true }))).toBe('0,00 €');
	});

	it('uses thousands separator above 1000', () => {
		expect(normalize(formatCents(123456))).toBe('1 234,56 €');
	});

	it('compact drops fractional digits above 1000', () => {
		expect(normalize(formatCents(123456, { compact: true }))).toMatch(/^1 23[45] €$/);
		// Below 1000 the standard formatter is used (compact has no effect).
		expect(normalize(formatCents(99900, { compact: true }))).toBe('999,00 €');
	});
});
