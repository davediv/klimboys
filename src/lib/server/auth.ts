import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDB } from './db';
import * as schema from './db/schema';

export function createAuth(d1: D1Database) {
	const db = createDB(d1);

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema
		}),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24 // 1 day
		}
	});
}

export type Auth = ReturnType<typeof createAuth>;
