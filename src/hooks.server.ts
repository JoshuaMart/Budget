import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

import { auth } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/client.ts';
import { startPriceScheduler } from '#lib/server/priceScheduler.ts';
import { startRecurringScheduler } from '#lib/server/recurringScheduler.ts';

// Apply pending migrations on server startup. Idempotent: drizzle's
// migrator skips entries already recorded in __drizzle_migrations.
migrate(db, { migrationsFolder: './drizzle' });

// Materialise due recurrings now and every 24h afterwards.
startRecurringScheduler();

// Refresh holding prices now and every 6h afterwards.
startPriceScheduler();

const PUBLIC_PREFIXES = ['/login', '/register', '/api/auth'];

const isPublicPath = (path: string): boolean =>
	PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	if (!event.locals.user && !isPublicPath(event.url.pathname)) {
		throw redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
	}

	return resolve(event);
};
