import { createAuth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.platform?.env.DB) {
		const auth = createAuth(event.platform.env.DB);
		event.locals.auth = auth;
		event.locals.session = await auth.api.getSession({
			headers: event.request.headers
		});
	}

	return resolve(event);
};
