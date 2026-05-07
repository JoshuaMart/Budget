// Date helpers. Transactions store their date as ISO YYYY-MM-DD strings;
// we work with month/year integers (month is 0-indexed to match Date).

const MONTHS_FR_LONG = [
	'Janvier',
	'Février',
	'Mars',
	'Avril',
	'Mai',
	'Juin',
	'Juillet',
	'Août',
	'Septembre',
	'Octobre',
	'Novembre',
	'Décembre'
];
const MONTHS_FR_SHORT = [
	'Jan',
	'Fév',
	'Mar',
	'Avr',
	'Mai',
	'Juin',
	'Juil',
	'Août',
	'Sep',
	'Oct',
	'Nov',
	'Déc'
];
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export interface YearMonth {
	year: number;
	/** 0-11, like Date#getMonth(). */
	month: number;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** "2026-05-07" → Date (parsed as local midnight, no UTC drift). */
export function parseIsoDate(iso: string): Date {
	const [y, m, d] = iso.split('-').map((s) => Number.parseInt(s, 10));
	return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

/** Date → "2026-05-07". */
export function toIsoDate(date: Date): string {
	return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function monthOf(iso: string): YearMonth {
	const d = parseIsoDate(iso);
	return { year: d.getFullYear(), month: d.getMonth() };
}

export function isInMonth(iso: string, year: number, month: number): boolean {
	const ym = monthOf(iso);
	return ym.year === year && ym.month === month;
}

/** "Mai 2026". */
export function monthLabel({ year, month }: YearMonth): string {
	return `${MONTHS_FR_LONG[month]} ${year}`;
}

/** "Lun 7 Mai" — used in the transactions list day grouping. */
export function dayLabel(iso: string): string {
	const d = parseIsoDate(iso);
	return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]}`;
}

export function startOfMonth({ year, month }: YearMonth): Date {
	return new Date(year, month, 1);
}

export function endOfMonth({ year, month }: YearMonth): Date {
	return new Date(year, month + 1, 0);
}

export function daysInMonth(ym: YearMonth): number {
	return endOfMonth(ym).getDate();
}

/** Days remaining (inclusive of today) until end of `ym`. 0 if `today` is past it. */
export function daysRemainingInMonth(today: Date, ym: YearMonth): number {
	const last = endOfMonth(ym).getDate();
	if (today.getFullYear() !== ym.year || today.getMonth() !== ym.month) {
		return today < startOfMonth(ym) ? last : 0;
	}
	return last - today.getDate() + 1;
}

/** Shift a YearMonth by `delta` months. */
export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
	const total = year * 12 + month + delta;
	return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}
