// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}

		interface Locals {
			user?: {
				id: string;
				email: string;
				name?: string | null;
				role: string;
				emailVerified: boolean;
				image?: string | null;
				createdAt: Date;
				updatedAt: Date;
			};
			session?: {
				id: string;
				userId: string;
				expiresAt: Date;
				token: string;
				createdAt: Date;
				updatedAt: Date;
			};
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
