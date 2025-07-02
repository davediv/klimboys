// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Auth } from '$lib/server/auth';

declare global {
	namespace App {
		interface Platform {
			env: Env & {
				DB: D1Database;
				BUCKET: R2Bucket;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}
		interface Locals {
			auth: Auth;
			session: any;
		}
	}
}

export {};
