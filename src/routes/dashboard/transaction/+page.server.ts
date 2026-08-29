import type { PageServerLoad } from './$types';
import { routeGuard } from '$lib/server/guards';

export const load: PageServerLoad = async (event) => {
	// Require authentication, verification, and at least cashier role
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: true,
		minRole: 'cashier'
	});
	let popularProducts: any[] = [];

	try {
		const response = await event.fetch('/api/products?limit=6&active=true&includeMeta=false');
		if (!response.ok) {
			throw new Error('Failed to fetch popular products');
		}

		const result = (await response.json()) as any;
		if (result.success && result.data) {
			popularProducts = result.data.products || [];
		}
	} catch (error) {
		console.error('Failed to load popular products:', error);
	}

	return {
		user,
		popularProducts
	};
};
