import type { PageServerLoad } from './$types';
import { getPublicCatalog } from '$lib/server/catalog';
import type { PublicCatalogProduct } from '$lib/catalog';

export const load: PageServerLoad = async ({ locals }) => {
	let popularProducts: PublicCatalogProduct[] = [];

	try {
		const catalog = await getPublicCatalog({ limit: 4 });
		popularProducts = catalog.products;
	} catch (error) {
		console.error('Failed to load homepage products:', error);
	}

	return {
		user: locals.user || null,
		popularProducts
	};
};
