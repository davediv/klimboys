import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

// This will be initialized in hooks.server.ts
let db: DrizzleD1Database<typeof schema>;

export function initializeDb(database: D1Database) {
	db = drizzle(database, { schema });
	return db;
}

export function getDb() {
	if (!db) {
		throw new Error('Database not initialized. Call initializeDb first.');
	}
	return db;
}

export { db };
