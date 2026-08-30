import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { routeGuard } from '$lib/server/guards';
import type {
	CatalogPagination,
	CatalogProduct,
	CatalogStatus,
	ProductListResponse
} from '$lib/product';

const EMPTY_PAGINATION: CatalogPagination = {
	page: 1,
	limit: 20,
	totalItems: 0,
	totalPages: 0,
	hasNext: false,
	hasPrev: false
};

export const load: PageServerLoad = async (event) => {
	// Require catalog-management permission.
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: true,
		capability: 'catalog:manage'
	});
	const requestedPage = Number.parseInt(event.url.searchParams.get('page') ?? '1', 10);
	const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
	const search = (event.url.searchParams.get('search') ?? '').trim().slice(0, 100);
	const requestedStatus = event.url.searchParams.get('status');
	const status: CatalogStatus =
		requestedStatus === 'inactive' || requestedStatus === 'all' ? requestedStatus : 'active';
	let products: CatalogProduct[] = [];
	let pagination: CatalogPagination = { ...EMPTY_PAGINATION, page };
	let productsError: string | null = null;

	try {
		const params = new URLSearchParams({
			limit: '20',
			page: String(page),
			search,
			status
		});
		const response = await event.fetch(`/api/products?${params.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to fetch products');
		}

		const result = (await response.json()) as ProductListResponse;
		if (result.success && result.data) {
			products = result.data.products || [];
			pagination = result.data.pagination || pagination;
		}
	} catch (error) {
		console.error('Error loading products:', error);
		productsError = error instanceof Error ? error.message : 'Failed to load products';
	}
	if (!productsError && pagination.totalPages > 0 && page > pagination.totalPages) {
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		if (status !== 'active') params.set('status', status);
		if (pagination.totalPages > 1) params.set('page', String(pagination.totalPages));
		throw redirect(302, `/staff/catalog${params.size > 0 ? `?${params.toString()}` : ''}`);
	}

	return {
		user,
		products,
		pagination,
		search,
		status,
		productsError
	};
};
