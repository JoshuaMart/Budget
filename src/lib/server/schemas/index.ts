import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD attendu)');

const positiveCents = z.number().int().positive();

const expenseInput = z.object({
	kind: z.literal('expense'),
	date: isoDate,
	merchant: z.string().min(1),
	amountCents: positiveCents,
	accountId: z.string().min(1),
	envelopeId: z.string().min(1),
	categoryId: z.string().min(1).nullable().optional()
});

// A transfer between the user's own accounts moves cash without spending it,
// so it carries no envelope by default. An envelope is opted into only when
// the transfer IS the budget act (compte courant → Livret A, DCA…), which is
// how the "Investissements" envelope gets filled under 50/30/20.
const transferInput = z.object({
	kind: z.literal('transfer'),
	date: isoDate,
	merchant: z.string().min(1),
	amountCents: positiveCents,
	accountId: z.string().min(1),
	toAccountId: z.string().min(1),
	envelopeId: z.string().min(1).nullable().optional(),
	categoryId: z.string().min(1).nullable().optional()
});

const incomeInput = z.object({
	kind: z.literal('income'),
	date: isoDate,
	merchant: z.string().min(1),
	amountCents: positiveCents,
	accountId: z.string().min(1),
	incomeCategory: z.string().min(1).nullable().optional()
});

export const transactionInput = z.discriminatedUnion('kind', [
	expenseInput,
	transferInput,
	incomeInput
]);
export type TransactionInput = z.infer<typeof transactionInput>;

export const recurringInput = z.discriminatedUnion('kind', [
	expenseInput.extend({
		frequency: z.enum(['weekly', 'monthly', 'yearly']),
		dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
		nextDate: isoDate
	}),
	transferInput.extend({
		frequency: z.enum(['weekly', 'monthly', 'yearly']),
		dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
		nextDate: isoDate
	}),
	incomeInput.extend({
		frequency: z.enum(['weekly', 'monthly', 'yearly']),
		dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
		nextDate: isoDate
	})
]);
export type RecurringInput = z.infer<typeof recurringInput>;

export const accountInput = z.object({
	label: z.string().min(1).max(60),
	type: z.enum(['checking', 'savings']),
	initialBalanceCents: z.number().int().default(0)
});
export type AccountInput = z.infer<typeof accountInput>;

export const categoryInput = z.object({
	envelopeId: z.string().min(1),
	label: z.string().min(1).max(60),
	icon: z.string().max(8).nullable().optional()
});
export type CategoryInput = z.infer<typeof categoryInput>;

export const ratiosInput = z
	.object({
		necessities: z.number().int().min(0).max(100),
		wants: z.number().int().min(0).max(100),
		investments: z.number().int().min(0).max(100)
	})
	.refine((r) => r.necessities + r.wants + r.investments === 100, {
		message: 'Les ratios doivent additionner à 100'
	});
export type RatiosInput = z.infer<typeof ratiosInput>;

export const holdingInput = z.object({
	assetClass: z.enum(['etf', 'stock', 'crypto']),
	wallet: z.string().trim().min(1, 'Enveloppe requise').max(40),
	symbol: z.string().trim().min(1, 'Symbole requis').max(40),
	label: z.string().trim().min(1, 'Libellé requis').max(80),
	quantity: z.number({ error: 'Quantité invalide' }).positive('Quantité invalide'),
	avgCostCents: z.number({ error: 'Prix de revient invalide' }).min(0, 'Prix de revient invalide')
});
export type HoldingInput = z.infer<typeof holdingInput>;
