import type { PageServerLoad } from './$types';
import { routeGuard } from '$lib/server/guards';

export const load: PageServerLoad = async (event) => {
	// Require authentication, verification, and admin role
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: true,
		minRole: 'admin'
	});

	return {
		user
	};
};
