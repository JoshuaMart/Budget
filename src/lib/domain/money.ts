// Money helpers. Internally we store amounts in signed integer cents to
// avoid float drift; UI talks in euros.

export const toCents = (eur: number): number => Math.round(eur * 100);
export const toEuros = (cents: number): number => cents / 100;

const standard = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

const compactFmt = new Intl.NumberFormat('fr-FR', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0
});

export interface FormatOpts {
	/** Prepend `+` for positive non-zero values (negatives always show `−`). */
	signed?: boolean;
	/** Drop fractional digits when the absolute value is ≥ 1000. */
	compact?: boolean;
}

/** Format a cent amount as a French euro string. */
export function formatCents(cents: number, opts: FormatOpts = {}): string {
	const abs = Math.abs(cents) / 100;
	const fmt = opts.compact && abs >= 1000 ? compactFmt : standard;
	const body = fmt.format(abs);
	if (cents < 0) return `−${body}`;
	if (opts.signed && cents > 0) return `+${body}`;
	return body;
}

/**
 * Parse a user-typed decimal ("12,5", "1 234,56", "1.234,56", "0.0123").
 * When a comma is present it is the decimal mark and dots are thousands
 * separators; otherwise a lone dot is the decimal mark. Returns null on
 * anything that isn't a plain number.
 */
export function parseDecimal(raw: string | null | undefined): number | null {
	if (!raw) return null;
	let s = raw.replace(/[\s\u00a0\u202f]/g, '');
	if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
	if (!/^\d+(\.\d+)?$/.test(s)) return null;
	return Number(s);
}

/** Parse a strictly positive euro amount into integer cents. */
export function parseAmountToCents(raw: string | null | undefined): number | null {
	const n = parseDecimal(raw);
	if (n === null || n <= 0) return null;
	return toCents(n);
}

/**
 * Format a unit price in (possibly fractional) cents. Prices under 1 € keep
 * four significant digits so sub-cent assets don't read as "0,00 €".
 */
export function formatUnitCents(cents: number): string {
	if (Math.abs(cents) >= 100) return formatCents(Math.round(cents));
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
		maximumSignificantDigits: 4
	}).format(cents / 100);
}
