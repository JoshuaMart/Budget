import { describe, expect, it } from 'vitest';

import {
	addMonths,
	dayLabel,
	daysInMonth,
	daysRemainingInMonth,
	endOfMonth,
	isInMonth,
	monthLabel,
	monthOf,
	parseIsoDate,
	startOfMonth,
	toIsoDate
} from './dates';

describe('parseIsoDate / toIsoDate', () => {
	it('round-trips local dates without UTC drift', () => {
		expect(toIsoDate(parseIsoDate('2026-05-07'))).toBe('2026-05-07');
		expect(toIsoDate(parseIsoDate('2024-02-29'))).toBe('2024-02-29');
	});

	it('zero-pads month and day', () => {
		expect(toIsoDate(new Date(2026, 0, 3))).toBe('2026-01-03');
	});
});

describe('monthOf / isInMonth', () => {
	it('extracts year/month (0-indexed)', () => {
		expect(monthOf('2026-05-07')).toEqual({ year: 2026, month: 4 });
	});

	it('matches transactions to a month', () => {
		expect(isInMonth('2026-05-31', 2026, 4)).toBe(true);
		expect(isInMonth('2026-06-01', 2026, 4)).toBe(false);
		expect(isInMonth('2025-05-15', 2026, 4)).toBe(false);
	});
});

describe('monthLabel / dayLabel', () => {
	it('uses long French month names', () => {
		expect(monthLabel({ year: 2026, month: 4 })).toBe('Mai 2026');
		expect(monthLabel({ year: 2026, month: 0 })).toBe('Janvier 2026');
	});

	it('formats day labels like the transactions list', () => {
		// 2026-05-07 is a Thursday
		expect(dayLabel('2026-05-07')).toBe('Jeu 7 Mai');
	});
});

describe('startOfMonth / endOfMonth / daysInMonth', () => {
	it('returns first and last day of a month', () => {
		const ym = { year: 2026, month: 4 };
		expect(startOfMonth(ym).getDate()).toBe(1);
		expect(endOfMonth(ym).getDate()).toBe(31);
		expect(daysInMonth(ym)).toBe(31);
	});

	it('handles February in a leap year', () => {
		expect(daysInMonth({ year: 2024, month: 1 })).toBe(29);
		expect(daysInMonth({ year: 2025, month: 1 })).toBe(28);
	});
});

describe('daysRemainingInMonth', () => {
	const may = { year: 2026, month: 4 };

	it('counts inclusively from today to end of month', () => {
		expect(daysRemainingInMonth(new Date(2026, 4, 7), may)).toBe(25);
		expect(daysRemainingInMonth(new Date(2026, 4, 31), may)).toBe(1);
	});

	it('returns 0 for a future today and full month for a past today', () => {
		expect(daysRemainingInMonth(new Date(2026, 5, 1), may)).toBe(0); // June → past
		expect(daysRemainingInMonth(new Date(2026, 3, 30), may)).toBe(31); // April → still upcoming
	});
});

describe('addMonths', () => {
	it('adds and subtracts across year boundaries', () => {
		expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
		expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
	});
});
