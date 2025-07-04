import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';

// Helper to execute raw SQL queries on D1
export async function executeRawQuery<T = unknown>(
	db: DrizzleD1Database<any>,
	query: string,
	params: any[] = []
): Promise<T[]> {
	// Use Drizzle's sql template to execute raw queries
	const result = await db.all(sql.raw(query, params));
	return result as T[];
}

export async function executeRawInsert(
	db: DrizzleD1Database<any>,
	query: string,
	params: any[] = []
): Promise<void> {
	await db.run(sql.raw(query, params));
}

// Get the underlying D1 database instance from Drizzle
export function getD1Database(db: DrizzleD1Database<any>): D1Database {
	// Access the internal D1 database instance
	// @ts-ignore - accessing internal property
	return db._.session.client;
}