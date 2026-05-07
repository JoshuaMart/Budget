import { fail, redirect } from '@sveltejs/kit';

import { transactionInput } from '$lib/server/schemas';
import { listAccountsWithBalance } from '$lib/server/services/accounts.service';
import { listCategories } from '$lib/server/services/categories.service';
import { listEnvelopes } from '$lib/server/services/envelopes.service';
import {
	createTransaction,
	deleteTransaction,
	listTransactions
} from '$lib/server/services/transactions.service';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) throw redirect(303, '/login');
	const userId = locals.user.id;

	const search = url.searchParams.get('q') ?? '';
	const envParam = url.searchParams.get('env');
	const envelopeId = envParam ?? undefined;

	const transactions = listTransactions(userId, {
		merchantSearch: search || undefined,
		envelopeId
	});
	const envelopes = listEnvelopes(userId);
	const categories = listCategories(userId);
	const accounts = listAccountsWithBalance(userId);

	return { transactions, envelopes, categories, accounts, search, envFilter: envelopeId ?? null };
};

function parseAmountToCents(raw: string | undefined): number | null {
	if (!raw) return null;
	const normalised = raw.replace(',', '.').trim();
	const n = Number.parseFloat(normalised);
	if (!Number.isFinite(n) || n <= 0) return null;
	return Math.round(n * 100);
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const data = await request.formData();
		const amountCents = parseAmountToCents(data.get('amount')?.toString());
		if (!amountCents) return fail(400, { error: 'Montant invalide' });

		const kind = data.get('kind')?.toString() ?? 'expense';
		const base = {
			kind,
			amountCents,
			date: data.get('date')?.toString() ?? '',
			merchant: data.get('merchant')?.toString() ?? '',
			accountId: data.get('accountId')?.toString() ?? ''
		};
		let body: unknown;
		if (kind === 'transfer') {
			body = {
				...base,
				toAccountId: data.get('toAccountId')?.toString() ?? '',
				envelopeId: data.get('envelopeId')?.toString() ?? '',
				categoryId: data.get('categoryId')?.toString() || undefined
			};
		} else if (kind === 'income') {
			body = {
				...base,
				incomeCategory: data.get('incomeCategory')?.toString() || undefined
			};
		} else {
			body = {
				...base,
				envelopeId: data.get('envelopeId')?.toString() ?? '',
				categoryId: data.get('categoryId')?.toString() || undefined
			};
		}
		const parsed = transactionInput.safeParse(body);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Données invalides' });
		}
		createTransaction(locals.user.id, parsed.data);
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const data = await request.formData();
		const txId = data.get('txId')?.toString();
		if (!txId) return fail(400, { error: 'Identifiant manquant' });
		deleteTransaction(locals.user.id, txId);
		return { success: true };
	}
};
