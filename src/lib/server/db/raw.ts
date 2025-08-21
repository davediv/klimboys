import type { DrizzleD1Database } from 'drizzle-orm/d1';

// Get the D1 database instance
export function getD1Database(db?: DrizzleD1Database<any>): D1Database {
	// Try to get from global context first
	if (globalThis.__d1) {
		return globalThis.__d1;
	}

	// If a Drizzle instance is provided, try to extract D1 from it
	if (db) {
		// Try different internal property paths that might exist
		try {
			// @ts-ignore - accessing internal properties
			if (db.session?.client) return db.session.client;
			// @ts-ignore
			if (db._?.session?.client) return db._.session.client;
			// @ts-ignore
			if (db.client) return db.client;
		} catch (e) {
			console.error('[Raw DB] Failed to extract D1 from Drizzle instance:', e);
		}
	}

	throw new Error('D1 database instance not available. Make sure __d1 is set in global context.');
}
