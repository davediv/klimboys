import { type Handle } from '@sveltejs/kit';
import { initializeDb } from '$lib/server/db';
import { getAuthInstance } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize database with platform-specific D1 binding
	if (event.platform?.env?.DB) {
		initializeDb(event.platform.env.DB);
	}

	// Handle Better Auth API routes
	if (event.url.pathname.startsWith('/api/auth')) {
		// Get auth instance inside the request handler to avoid global scope issues
		const auth = getAuthInstance();
		return auth.handler(event.request);
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
				event.locals.user = {
					...response.user,
					role: (response.user as any).role || 'viewer'
				};
				event.locals.session = response.session;
			}
		}
	} catch (error) {
		console.error('Session validation error:', error);
	}

	return resolve(event);
};
