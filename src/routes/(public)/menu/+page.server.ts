import { getPublicCatalog } from '$lib/server/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const category = url.searchParams.get('category')?.trim() ?? '';

	try {
		const catalog = await getPublicCatalog({ category, search });
		return { ...catalog, category, search, catalogError: null };
	} catch (error) {
		console.error('Failed to load public menu:', error);
		return {
			products: [],
			categories: [],
			category,
			search,
			catalogError: 'The menu is temporarily unavailable.'
		};
	}
};
