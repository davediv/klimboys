import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDB(d1: D1Database): DrizzleD1Database<typeof schema> {
	return drizzle(d1, { schema });
}
