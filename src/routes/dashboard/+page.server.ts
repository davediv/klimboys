import type { PageServerLoad } from './$types';
import type { DashboardSummary } from '$lib/dashboard';
import { getDashboardSummary } from '$lib/server/dashboard';
import { routeGuard } from '$lib/server/guards';

export const load: PageServerLoad = async (event) => {
	// Require authentication, verification, and at least cashier role
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: false, // Allow unverified users to see verification message
		minRole: 'cashier'
	});
	let dashboard: DashboardSummary | null = null;
	let dashboardError: string | null = null;

	if (user?.emailVerified) {
		try {
			dashboard = await getDashboardSummary();
		} catch (error) {
			console.error('Failed to load dashboard summary:', error);
			dashboardError = 'Live store data is temporarily unavailable.';
		}
	}

	return {
		user,
		needsVerification: user && !user.emailVerified,
		dashboard,
		dashboardError
	};
};
