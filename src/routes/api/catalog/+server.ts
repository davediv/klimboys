import { json } from '@sveltejs/kit';
import { getPublicCatalog } from '$lib/server/catalog';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const requestedLimit = Number.parseInt(url.searchParams.get('limit') ?? '100', 10);
	const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 100;
	const search = (url.searchParams.get('search') ?? '').slice(0, 100);
	const category = (url.searchParams.get('category') ?? '').slice(0, 100);

	try {
		const catalog = await getPublicCatalog({ category, limit, search });
		setHeaders({
			'cache-control': 'public, max-age=60, stale-while-revalidate=300'
		});
		return json({ success: true, data: catalog });
	} catch (error) {
		console.error('Error fetching public catalog:', error);
		return json(
			{ success: false, error: 'The public catalog is temporarily unavailable.' },
			{ status: 500 }
		);
	}
};
