import { json, type Handle } from '@sveltejs/kit';
import { initializeDb } from '$lib/server/db';
import { getAuthInstance } from '$lib/server/auth';
import { initializeEmailService } from '$lib/server/email';

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize database with platform-specific D1 binding
	if (event.platform?.env?.DB) {
		initializeDb(event.platform.env.DB);
	}

	const platformVariables = event.platform?.env as unknown as Record<string, unknown> | undefined;
	const configuredSender = platformVariables?.AUTH_EMAIL_FROM;
	initializeEmailService(
		event.platform?.env?.EMAIL,
		typeof configuredSender === 'string' ? configuredSender : undefined
	);

	// Staff accounts are provisioned by an administrator. Never expose Better
	// Auth's generic public sign-up endpoint as a customer registration flow.
	if (event.url.pathname.startsWith('/api/auth/sign-up')) {
		return json({ message: 'Staff accounts are created by an administrator.' }, { status: 403 });
	}

	// Handle Better Auth API routes
	if (event.url.pathname.startsWith('/api/auth')) {
		// Get auth instance inside the request handler to avoid global scope issues
		const auth = getAuthInstance();
		return auth.handler(event.request);
	}

	// Product reads are intentionally public and do not consume locals. Skip the
	// session lookup when an authenticated browser searches or loads the catalog.
	const isPublicProductRead =
		event.request.method === 'GET' &&
		(event.url.pathname === '/api/products' || /^\/api\/products\/[^/]+$/.test(event.url.pathname));
	if (isPublicProductRead) {
		return resolve(event);
	}

	// Get session for all requests
	try {
		const sessionToken = event.cookies.get('better-auth.session_token');

		if (sessionToken) {
			const auth = getAuthInstance();
			const response = await auth.api.getSession({
				headers: event.request.headers
			});

			if (response && response.session) {
				const sessionUser = response.user as typeof response.user & { role?: string };
				event.locals.user = {
					...sessionUser,
					role: sessionUser.role || 'viewer'
				};
				event.locals.session = response.session;
			}
		}
	} catch (error) {
		console.error('Session validation error:', error);
	}

	return resolve(event);
};
