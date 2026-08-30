import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db';
import * as schema from './db/schema';
import { sendAuthEmail } from './email';
import type { RequestEvent } from '@sveltejs/kit';

// Lazy-initialize Better Auth to avoid global scope issues in Cloudflare Workers
let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuthInstance() {
	if (!authInstance) {
		authInstance = betterAuth({
			database: drizzleAdapter(getDb(), {
				provider: 'sqlite',
				schema: {
					user: schema.user,
					session: schema.session,
					account: schema.account,
					verification: schema.verification
				}
			}),
			emailAndPassword: {
				enabled: true,
				disableSignUp: true,
				requireEmailVerification: true,
				revokeSessionsOnPasswordReset: true,
				sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
					await sendAuthEmail({
						to: user.email,
						subject: 'Reset your Klimboys staff password',
						heading: 'Reset your password',
						message: 'Use the secure link below to choose a new staff workspace password.',
						actionLabel: 'Reset password',
						actionUrl: url
					});
				}
			},
			emailVerification: {
				sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
					await sendAuthEmail({
						to: user.email,
						subject: 'Verify your Klimboys staff email',
						heading: 'Verify your email address',
						message: 'Confirm this email address before accessing the Klimboys staff workspace.',
						actionLabel: 'Verify email',
						actionUrl: url
					});
				},
				sendOnSignUp: false,
				sendOnSignIn: true
			},
			user: {
				additionalFields: {
					role: {
						type: 'string',
						defaultValue: 'viewer',
						required: false
					}
				}
			},
			session: {
				expiresIn: 60 * 60 * 24 * 7, // 7 days
				updateAge: 60 * 60 * 24 // 1 day
			},
			trustedOrigins: [
				'http://localhost:5179',
				'https://klimboys.pages.dev',
				'https://*.klimboys.pages.dev'
			]
		});
	}
	return authInstance;
}

// Export a getter for the auth instance
export const auth = {
	get handler() {
		return getAuthInstance().handler;
	},
	get api() {
		return getAuthInstance().api;
	}
};

// Helper to get auth from SvelteKit request event
export async function getAuth(event: RequestEvent) {
	const sessionToken = event.cookies.get('better-auth.session_token');

	if (!sessionToken) {
		return null;
	}

	const response = await getAuthInstance().api.getSession({
		headers: event.request.headers
	});

	if (!response || response.session === null) {
		return null;
	}

	return {
		user: response.user,
		session: response.session
	};
}

// Role check helper
export function hasRole(
	userRole: string | undefined,
	requiredRole: 'admin' | 'cashier' | 'viewer'
): boolean {
	const roleHierarchy = {
		admin: 3,
		cashier: 2,
		viewer: 1
	};

	if (!userRole) return false;

	const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
	const requiredLevel = roleHierarchy[requiredRole];

	return userLevel >= requiredLevel;
}
