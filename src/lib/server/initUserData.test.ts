import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from './db/client';
import { user } from './db/schema';
import { initUserData, UNCATEGORIZED_LABEL } from './initUserData';
import { listAccounts } from './services/accounts.service';
import { listCategories } from './services/categories.service';
import { listEnvelopes } from './services/envelopes.service';

function createTestUser(): string {
	const id = crypto.randomUUID();
	db.insert(user)
		.values({ id, email: `${id}@test.local`, name: 'Test', emailVerified: false })
		.run();
	return id;
}

describe('initUserData', () => {
	it('provisions 3 envelopes (50/30/20)', () => {
		const userId = createTestUser();
		initUserData(userId);

		const envelopes = listEnvelopes(userId);
		expect(envelopes).toHaveLength(3);

		const byKey = Object.fromEntries(envelopes.map((e) => [e.key, e]));
		expect(byKey.necessities?.ratio).toBe(50);
		expect(byKey.wants?.ratio).toBe(30);
		expect(byKey.investments?.ratio).toBe(20);
		expect(byKey.necessities?.label).toBe('Nécessités');
		expect(byKey.wants?.label).toBe('Envies');
		expect(byKey.investments?.label).toBe('Investissements');
	});

	it('provisions the default sub-categories from the spec (16 real)', () => {
		const userId = createTestUser();
		initUserData(userId);

		const cats = listCategories(userId);
		const real = cats.filter((c) => !c.isVirtual);
		expect(real).toHaveLength(8 + 3 + 5);

		const labels = real.map((c) => c.label);
		// Spot-check a handful of labels per envelope
		expect(labels).toContain('Logement');
		expect(labels).toContain('Alimentation et boissons');
		expect(labels).toContain('Abonnements');
		expect(labels).toContain('Sorties et Restaurants');
		expect(labels).toContain('Actions');
		expect(labels).toContain('Matelas de sécurité');
	});

	it('adds a virtual "Non catégorisé" category in each envelope', () => {
		const userId = createTestUser();
		initUserData(userId);

		const cats = listCategories(userId);
		const virtuals = cats.filter((c) => c.isVirtual);
		expect(virtuals).toHaveLength(3);
		expect(virtuals.every((c) => c.label === UNCATEGORIZED_LABEL)).toBe(true);

		const envelopes = listEnvelopes(userId);
		// One virtual per envelope.
		const envIds = new Set(virtuals.map((c) => c.envelopeId));
		expect(envIds.size).toBe(3);
		expect(envelopes.every((e) => envIds.has(e.id))).toBe(true);
	});

	it('creates the 2 default bank accounts', () => {
		const userId = createTestUser();
		initUserData(userId);

		const accounts = listAccounts(userId);
		expect(accounts).toHaveLength(2);
		const labels = accounts.map((a) => a.label).sort();
		expect(labels).toEqual(['Compte courant', 'Épargne']);
		expect(accounts.find((a) => a.label === 'Compte courant')?.type).toBe('checking');
		expect(accounts.find((a) => a.label === 'Épargne')?.type).toBe('savings');
	});

	it('cascade-deletes everything when the user is deleted', () => {
		const userId = createTestUser();
		initUserData(userId);

		expect(listEnvelopes(userId)).toHaveLength(3);

		db.delete(user).where(eq(user.id, userId)).run();

		expect(listEnvelopes(userId)).toHaveLength(0);
		expect(listCategories(userId)).toHaveLength(0);
		expect(listAccounts(userId)).toHaveLength(0);
	});
});
