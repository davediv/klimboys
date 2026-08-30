import type { PageServerLoad } from './$types';
import { routeGuard } from '$lib/server/guards';
import type { PosProduct, PosProductListResponse } from '$lib/product';

export const load: PageServerLoad = async (event) => {
	// Require permission to create a sale.
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: true,
		capability: 'sale:create'
	});
	let popularProducts: PosProduct[] = [];

	try {
		const response = await event.fetch('/api/products?limit=6&active=true&includeMeta=false');
		if (!response.ok) {
			throw new Error('Failed to fetch popular products');
		}

		const result = (await response.json()) as PosProductListResponse;
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
