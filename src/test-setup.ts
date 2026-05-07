// Run once per Vitest worker. Must execute before any service module
// imports `$lib/server/db/client`, since client.ts reads
// `process.env.DATABASE_URL` at module-init time.

process.env.DATABASE_URL = ':memory:';
process.env.BETTER_AUTH_SECRET = 'test-secret-' + 'x'.repeat(32);
process.env.ORIGIN = 'http://localhost:5173';

const { migrate } = await import('drizzle-orm/bun-sqlite/migrator');
const { db } = await import('$lib/server/db/client');
migrate(db, { migrationsFolder: './drizzle' });

export {};
