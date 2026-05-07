import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

import { db } from '$lib/server/db/client';

// Apply pending migrations on server startup. Idempotent: drizzle's
// migrator skips entries already recorded in __drizzle_migrations.
migrate(db, { migrationsFolder: './drizzle' });

export const handle = async ({ event, resolve }) => resolve(event);
