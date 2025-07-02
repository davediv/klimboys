// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Auth } from '$lib/server/auth';
import type { AuthSession } from '$lib/server/auth/rbac';

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
			session: AuthSession | null;
		}
		interface PageData {
			session: AuthSession | null;
		}
	}
}

export {};
