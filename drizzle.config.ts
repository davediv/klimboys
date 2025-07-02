import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle/migrations',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		wranglerConfigPath: './wrangler.jsonc',
		dbName: 'klimboys'
	}
} satisfies Config;
