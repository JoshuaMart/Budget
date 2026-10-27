import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '../db/client';
import { transaction, user } from '../db/schema';
import { initUserData } from '../initUserData';
import { listAccounts } from './accounts.service';
import { listEnvelopes } from './envelopes.service';
import { createRecurring, runDueRecurrings } from './recurring.service';

function bootstrap() {
	const userId = crypto.randomUUID();
	db.insert(user)
		.values({ id: userId, email: `${userId}@test.local`, name: 'Test', emailVerified: false })
		.run();
	initUserData(userId);
	const necEnv = listEnvelopes(userId).find((e) => e.key === 'necessities')!;
	const courant = listAccounts(userId).find((a) => a.label === 'Compte courant')!;
	const rec = createRecurring(userId, {
		kind: 'expense',
		date: '2026-05-01',
		merchant: 'Loyer',
		amountCents: 80000,
		frequency: 'monthly',
		dayOfMonth: 1,
		accountId: courant.id,
		envelopeId: necEnv.id,
		nextDate: '2026-05-01'
	});
	return { userId, rec };
}

function countFor(recurringId: string) {
	return db.select().from(transaction).where(eq(transaction.recurringId, recurringId)).all().length;
}

describe('recurring.service', () => {
	it('runDueRecurrings scoped to a user only materialises that user', () => {
		const a = bootstrap();
		const b = bootstrap();
		const now = new Date('2026-05-15T12:00:00Z');

		runDueRecurrings({ now, userId: a.userId });

		expect(countFor(a.rec.id)).toBe(1);
		expect(countFor(b.rec.id)).toBe(0);
	});
});
