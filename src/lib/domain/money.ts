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
