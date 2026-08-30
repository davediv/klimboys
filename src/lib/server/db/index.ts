import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

// This will be initialized in hooks.server.ts
let db: DrizzleD1Database<typeof schema>;
let d1Database: D1Database;

export function initializeDb(database: D1Database) {
	d1Database = database;
	db = drizzle(database, { schema });
	return db;
}

export function getDb() {
	if (!db) {
		throw new Error('Database not initialized. Call initializeDb first.');
	}
	return db;
}

export function getD1Database() {
	if (!d1Database) {
		throw new Error('Database not initialized. Call initializeDb first.');
	}
	return d1Database;
}

export { db };
