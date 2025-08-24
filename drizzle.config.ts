import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		wranglerConfigPath: './wrangler.jsonc',
		dbName: 'klimboys'
	},
	verbose: true,
	strict: true
});
