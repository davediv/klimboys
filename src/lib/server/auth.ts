import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db';
import * as schema from './db/schema';
import type { RequestEvent } from '@sveltejs/kit';

// Custom email sending function (you'll need to replace with actual email service)
async function sendVerificationEmail(email: string, url: string) {
	// In production, integrate with an email service like SendGrid, Resend, etc.
	console.log(`[EMAIL] Verification email would be sent to ${email}`);
	console.log(`[EMAIL] Verification URL: ${url}`);

	// For development, we'll log the verification URL
	// In production, you'd send an actual email here
	return true;
}

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
				requireEmailVerification: true,
				sendResetPasswordToken: async ({ user, url }: { user: { email: string }; url: string }) => {
					await sendVerificationEmail(user.email, url);
				}
			},
			emailVerification: {
				sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
					await sendVerificationEmail(user.email, url);
				},
				sendOnSignUp: true
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
	requiredRole: 'admin' | 'editor' | 'viewer'
): boolean {
	const roleHierarchy = {
		admin: 3,
		editor: 2,
		viewer: 1
	};

	if (!userRole) return false;

	const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
	const requiredLevel = roleHierarchy[requiredRole];

	return userLevel >= requiredLevel;
}