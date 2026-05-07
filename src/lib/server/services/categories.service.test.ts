import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '../db/client';
import { transaction, user } from '../db/schema';
import { initUserData, UNCATEGORIZED_LABEL } from '../initUserData';
import { listAccounts } from './accounts.service';
import { createCategory, deleteCategory, listCategories } from './categories.service';
import { listEnvelopes } from './envelopes.service';
import { createTransaction } from './transactions.service';

function bootstrap() {
	const userId = crypto.randomUUID();
	db.insert(user)
		.values({ id: userId, email: `${userId}@test.local`, name: 'Test', emailVerified: false })
		.run();
	initUserData(userId);
	const envelopes = listEnvelopes(userId);
	const accounts = listAccounts(userId);
	const necEnv = envelopes.find((e) => e.key === 'necessities')!;
	const courant = accounts.find((a) => a.label === 'Compte courant')!;
	return { userId, necEnv, courant };
}

describe('categories.service', () => {
	it('createCategory adds a non-virtual category', () => {
		const ctx = bootstrap();
		const cat = createCategory(ctx.userId, {
			envelopeId: ctx.necEnv.id,
			label: 'Streaming'
		});
		expect(cat.label).toBe('Streaming');
		expect(cat.isVirtual).toBe(false);

		const cats = listCategories(ctx.userId);
		expect(cats.find((c) => c.id === cat.id)).toBeDefined();
	});

	it('deleteCategory reassigns transactions to the virtual category of the same envelope', () => {
		const ctx = bootstrap();

		const realCat = createCategory(ctx.userId, {
			envelopeId: ctx.necEnv.id,
			label: 'Streaming'
		});

		const tx = createTransaction(ctx.userId, {
			kind: 'expense',
			date: '2026-05-07',
			merchant: 'Netflix',
			amountCents: 1349,
			accountId: ctx.courant.id,
			envelopeId: ctx.necEnv.id,
			categoryId: realCat.id
		});

		deleteCategory(ctx.userId, realCat.id);

		// Real category is gone.
		const cats = listCategories(ctx.userId);
		expect(cats.find((c) => c.id === realCat.id)).toBeUndefined();

		// Transaction now points at the virtual category of the same envelope.
		const refreshed = db.select().from(transaction).where(eq(transaction.id, tx.id)).get();
		expect(refreshed).toBeDefined();
		const virtual = cats.find(
			(c) => c.envelopeId === ctx.necEnv.id && c.isVirtual && c.label === UNCATEGORIZED_LABEL
		)!;
		expect(refreshed!.categoryId).toBe(virtual.id);
	});

	it('refuses to delete the virtual "Non catégorisé" category', () => {
		const ctx = bootstrap();
		const cats = listCategories(ctx.userId);
		const virtualNec = cats.find((c) => c.envelopeId === ctx.necEnv.id && c.isVirtual)!;

		expect(() => deleteCategory(ctx.userId, virtualNec.id)).toThrow(/non catégorisé/i);

		// Still there.
		expect(listCategories(ctx.userId).find((c) => c.id === virtualNec.id)).toBeDefined();
	});

	it('does not allow another user to delete your category', () => {
		const a = bootstrap();
		const b = bootstrap();

		const aCat = createCategory(a.userId, {
			envelopeId: a.necEnv.id,
			label: 'Hobbies'
		});

		// User B tries to delete A's category — should throw "Catégorie introuvable".
		expect(() => deleteCategory(b.userId, aCat.id)).toThrow(/introuvable/i);

		// A's category still exists.
		expect(listCategories(a.userId).find((c) => c.id === aCat.id)).toBeDefined();
	});
});
