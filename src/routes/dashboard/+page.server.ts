import type { PageServerLoad } from './$types';
import { routeGuard } from '$lib/server/guards';

export const load: PageServerLoad = async (event) => {
	// Require authentication, verification, and at least cashier role
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: false, // Allow unverified users to see verification message
		minRole: 'cashier'
	});

	return {
		user,
		needsVerification: user && !user.emailVerified
	};
};
