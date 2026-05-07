import { and, eq } from 'drizzle-orm';

import { db } from '../db/client';
import { envelope } from '../db/schema';
import type { RatiosInput } from '../schemas';

export function listEnvelopes(userId: string) {
	return db.select().from(envelope).where(eq(envelope.userId, userId)).all();
}

export function updateRatios(userId: string, ratios: RatiosInput) {
	db.transaction((tx) => {
		const entries: [keyof RatiosInput, number][] = [
			['necessities', ratios.necessities],
			['wants', ratios.wants],
			['investments', ratios.investments]
		];
		for (const [key, ratio] of entries) {
			tx.update(envelope)
				.set({ ratio })
				.where(and(eq(envelope.userId, userId), eq(envelope.key, key)))
				.run();
		}
	});
}
