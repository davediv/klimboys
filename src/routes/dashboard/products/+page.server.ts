import type { PageServerLoad } from './$types';
import { routeGuard } from '$lib/server/guards';

export const load: PageServerLoad = async (event) => {
	// Require authentication, verification, and admin role
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: true,
		minRole: 'admin'
	});
	let products: any[] = [];
	let productsError: string | null = null;

	try {
		const response = await event.fetch('/api/products?limit=100&active=true&includeMeta=false');
		if (!response.ok) {
			throw new Error('Failed to fetch products');
		}

		const result = (await response.json()) as any;
		if (result.success && result.data) {
			products = result.data.products || [];
		}
	} catch (error) {
		console.error('Error loading products:', error);
		productsError = error instanceof Error ? error.message : 'Failed to load products';
	}

	return {
		user,
		products,
		productsError
	};
};
