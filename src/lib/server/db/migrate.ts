// Apply pending Drizzle migrations against the configured SQLite DB.
// Run with: pnpm db:migrate (or `bun --bun src/lib/server/db/migrate.ts`).
//
// drizzle-kit's own `migrate` command requires better-sqlite3/libsql and
// can't talk to bun:sqlite, so we use Drizzle's runtime migrator which
// reuses our normal client (PRAGMAs and all).

import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

import { db, sqlite } from './client';

migrate(db, { migrationsFolder: './drizzle' });
sqlite.close();
console.log('Migrations applied.');
