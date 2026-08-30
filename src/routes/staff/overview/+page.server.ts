import type { PageServerLoad } from './$types';
import type { DashboardSummary } from '$lib/dashboard';
import { getDashboardSummary } from '$lib/server/dashboard';
import { routeGuard } from '$lib/server/guards';

export const load: PageServerLoad = async (event) => {
	// The overview contains owner-level financial and operational data.
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: true,
		capability: 'overview:read'
	});
	let dashboard: DashboardSummary | null = null;
	let dashboardError: string | null = null;

	if (user) {
		try {
			dashboard = await getDashboardSummary();
		} catch (error) {
			console.error('Failed to load dashboard summary:', error);
			dashboardError = 'Live store data is temporarily unavailable.';
		}
	}

	return {
		user,
		dashboard,
		dashboardError
	};
};
