import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import * as schema from './schema';

// Read directly from process.env so this module is also importable from
// standalone scripts (migrations, seeds), not only from SvelteKit context.
const url = process.env.DATABASE_URL ?? './data/budget.db';
mkdirSync(dirname(resolve(url)), { recursive: true });

export const sqlite = new Database(url);
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });
