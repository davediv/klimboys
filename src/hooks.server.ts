import { createAuth } from '$lib/server/auth';
import { createDB } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import type { AuthSession } from '$lib/server/auth/rbac';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.platform?.env.DB) {
		const auth = createAuth(event.platform.env.DB);
		event.locals.auth = auth;

		// Get session from Better Auth
		const betterAuthSession = await auth.api.getSession({
			headers: event.request.headers
		});

		if (betterAuthSession) {
			// Get full user data with role from database
			const db = createDB(event.platform.env.DB);
			const user = await db.query.user.findFirst({
				where: (users, { eq }) => eq(users.id, betterAuthSession.user.id),
				columns: {
					id: true,
					email: true,
					name: true,
					role: true,
					image: true,
					isActive: true
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
						image: user.image
					},
					session: betterAuthSession.session
				} as AuthSession;

				// Update last login timestamp
				await db
					.update(users)
					.set({
						lastLoginAt: new Date()
					})
					.where(eq(users.id, user.id));
			} else {
				// User not found or inactive
				event.locals.session = null;
			}
		} else {
			event.locals.session = null;
		}
	}

	return resolve(event);
};

// Import necessary items for the update query
import { user as users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
