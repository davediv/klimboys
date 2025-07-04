import { createAuth } from '$lib/server/auth';
import { createDB } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import type { AuthSession } from '$lib/server/auth/rbac';
import { guardRoute, getSecurityHeaders } from '$lib/server/auth/guards';
import { checkRateLimit, getRateLimitStatus, addRateLimitHeaders } from '$lib/server/auth/rate-limit';
import { ActivityType } from '$lib/server/auth/activity-log';
import { logActivity } from '$lib/server/auth/rbac';
import { user as users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Store database instance globally for activity logging
declare global {
	var __db: ReturnType<typeof createDB> | undefined;
}

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize database if available
	if (event.platform?.env.DB) {
		const db = createDB(event.platform.env.DB);
		globalThis.__db = db;
		
		const auth = createAuth(event.platform.env.DB);
		event.locals.auth = auth;

		// Get session from Better Auth
		const betterAuthSession = await auth.api.getSession({
			headers: event.request.headers
		});

		if (betterAuthSession) {
			// Get full user data with role from database
			const user = await db.query.user.findFirst({
				where: (users, { eq }) => eq(users.id, betterAuthSession.user.id),
				columns: {
					id: true,
					email: true,
					name: true,
					role: true,
					image: true,
					isActive: true,
					createdAt: true,
					updatedAt: true
				}
			});

			if (user && user.isActive) {
				// Create our enhanced session object
				event.locals.session = {
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
						role: user.role as 'admin' | 'cashier',
						image: user.image,
						isActive: user.isActive
					},
					session: betterAuthSession.session
				} as AuthSession;

				// Update last login timestamp (only once per hour to reduce DB writes)
				const lastUpdate = user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt);
				const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
				
				if (hoursSinceUpdate > 1) {
					await db
						.update(users)
						.set({
							lastLoginAt: new Date(),
							updatedAt: new Date()
						})
						.where(eq(users.id, user.id));
				}
			} else {
				// User not found or inactive
				event.locals.session = null;
				
				// Log suspicious activity if user is deactivated
				if (user && !user.isActive) {
					await logActivity(user.id, ActivityType.SUSPICIOUS_ACTIVITY, {
						entityType: 'auth',
						metadata: {
							reason: 'Deactivated user attempted access',
							email: user.email
						},
						ipAddress: getClientIP(event),
						userAgent: event.request.headers.get('user-agent') || undefined
					});
				}
			}
		} else {
			event.locals.session = null;
		}
	}

	// Apply rate limiting to sensitive endpoints
	const path = event.url.pathname;
	
	try {
		if (path === '/login' || path === '/api/auth/signin') {
			await checkRateLimit(event.request, 'login');
		} else if (path === '/register' || path === '/api/auth/signup') {
			await checkRateLimit(event.request, 'register');
		} else if (path.startsWith('/api/upload')) {
			await checkRateLimit(event.request, 'upload');
		} else if (path.startsWith('/api/')) {
			await checkRateLimit(event.request, 'api');
		}
	} catch (error: any) {
		// Log rate limit exceeded
		if (error.status === 429 && event.locals.session) {
			await logActivity(event.locals.session.user.id, ActivityType.RATE_LIMIT_EXCEEDED, {
				entityType: 'rate_limit',
				metadata: {
					endpoint: path,
					message: error.body?.message
				},
				ipAddress: getClientIP(event),
				userAgent: event.request.headers.get('user-agent') || undefined
			});
		}
		throw error;
	}

	// Apply route guards
	try {
		await guardRoute(path, event.locals.session, {
			logAccess: shouldLogAccess(path),
			checkOrigin: getClientIP(event),
			customChecks: [
				// Add custom security checks here
				async (session) => {
					// Example: Block access during maintenance
					if (event.platform?.env.MAINTENANCE_MODE === 'true' && session?.user?.role !== 'admin') {
						return false;
					}
					return true;
				}
			]
		});
	} catch (error: any) {
		// Log permission denied
		if (error.status === 403 && event.locals.session) {
			await logActivity(event.locals.session.user.id, ActivityType.PERMISSION_DENIED, {
				entityType: 'route',
				entityId: path,
				metadata: {
					message: error.body?.message || error.message
				},
				ipAddress: getClientIP(event),
				userAgent: event.request.headers.get('user-agent') || undefined
			});
		}
		throw error;
	}

	// Add security headers
	const securityHeaders = getSecurityHeaders();
	
	// Resolve the request
	let response = await resolve(event);
	
	// Add security headers to response
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries(securityHeaders)) {
		headers.set(key, value);
	}
	
	// Add rate limit headers
	const rateLimitStatus = getRateLimitStatus(event.request, getRateLimitConfig(path));
	if (rateLimitStatus) {
		response = addRateLimitHeaders(response, rateLimitStatus);
	}
	
	// Create new response with updated headers
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
};

// Helper function to get client IP
function getClientIP(event: any): string {
	const forwarded = event.request.headers.get('x-forwarded-for');
	const realIp = event.request.headers.get('x-real-ip');
	const cfConnectingIp = event.request.headers.get('cf-connecting-ip');
	
	return cfConnectingIp || realIp || forwarded?.split(',')[0] || event.getClientAddress();
}

// Helper function to determine if access should be logged
function shouldLogAccess(path: string): boolean {
	// Log access to sensitive routes
	const sensitiveRoutes = [
		'/dashboard/admin',
		'/dashboard/analytics',
		'/dashboard/settings',
		'/api/upload'
	];
	
	return sensitiveRoutes.some(route => path.startsWith(route));
}

// Helper function to get rate limit config for path
function getRateLimitConfig(path: string): string {
	if (path === '/login' || path === '/api/auth/signin') return 'login';
	if (path === '/register' || path === '/api/auth/signup') return 'register';
	if (path.startsWith('/api/upload')) return 'upload';
	if (path.startsWith('/api/')) return 'api';
	return 'api';
}