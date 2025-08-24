import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { products, productVariants } from '$lib/server/db/schema';
import { eq, like, sql, and, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Check if user is authenticated (optional for public product listing)
		// For now, we'll allow public access to product list
		// Uncomment if you want to restrict to authenticated users only:
		// if (!locals.user) {
		//     return json({ error: 'Unauthorized' }, { status: 401 });
		// }

		const db = getDb();

		// Get query parameters
		const searchQuery = url.searchParams.get('search') || '';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const category = url.searchParams.get('category') || '';
		const activeOnly = url.searchParams.get('active') !== 'false'; // Default to true

		// Validate pagination parameters
		const validPage = Math.max(1, page);
		const validLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page
		const offset = (validPage - 1) * validLimit;

		// Build where conditions
		const conditions = [];

		// Add search condition (search in name and description)
		if (searchQuery) {
			conditions.push(
				sql`(${products.name} LIKE ${`%${searchQuery}%`} OR ${products.description} LIKE ${`%${searchQuery}%`})`
			);
		}

		// Add category filter
		if (category) {
			conditions.push(eq(products.category, category));
		}

		// Add active filter
		if (activeOnly) {
			conditions.push(eq(products.isActive, true));
		}

		// Combine conditions
		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Get total count for pagination
		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(products)
			.where(whereClause);

		const totalItems = countResult[0]?.count || 0;
		const totalPages = Math.ceil(totalItems / validLimit);

		// Get products with pagination
		const productsData = await db
			.select({
				id: products.id,
				name: products.name,
				description: products.description,
				category: products.category,
				imageUrl: products.imageUrl,
				isActive: products.isActive,
				createdAt: products.createdAt,
				updatedAt: products.updatedAt
			})
			.from(products)
			.where(whereClause)
			.orderBy(desc(products.createdAt))
			.limit(validLimit)
			.offset(offset);

		// Get variants for all products
		const productIds = productsData.map((p) => p.id);

		let variantsData: Array<{
			id: string;
			productId: string;
			size: string;
			volumeMl: number;
			costPrice: number;
			sellingPrice: number;
			stockQuantity: number;
		}> = [];
		if (productIds.length > 0) {
			variantsData = await db
				.select({
					id: productVariants.id,
					productId: productVariants.productId,
					size: productVariants.size,
					volumeMl: productVariants.volumeMl,
					costPrice: productVariants.costPrice,
					sellingPrice: productVariants.sellingPrice,
					stockQuantity: productVariants.stockQuantity
				})
				.from(productVariants)
				.where(sql`${productVariants.productId} IN ${productIds}`);
		}

		// Group variants by product
		const variantsByProduct = variantsData.reduce(
			(acc, variant) => {
				if (!acc[variant.productId]) {
					acc[variant.productId] = [];
				}
				acc[variant.productId].push({
					id: variant.id,
					size: variant.size,
					volumeMl: variant.volumeMl,
					costPrice: variant.costPrice,
					sellingPrice: variant.sellingPrice,
					stockQuantity: variant.stockQuantity
				});
				return acc;
			},
			{} as Record<string, any[]>
		);

		// Combine products with their variants
		const productsWithVariants = productsData.map((product) => ({
			...product,
			variants: variantsByProduct[product.id] || []
		}));

		// Get unique categories for filtering
		const categoriesResult = await db
			.selectDistinct({ category: products.category })
			.from(products)
			.where(activeOnly ? eq(products.isActive, true) : undefined);

		const categories = categoriesResult.map((r) => r.category).filter(Boolean);

		// Return response with pagination metadata
		return json({
			success: true,
			data: {
				products: productsWithVariants,
				pagination: {
					page: validPage,
					limit: validLimit,
					totalItems,
					totalPages,
					hasNext: validPage < totalPages,
					hasPrev: validPage > 1
				},
				filters: {
					categories,
					search: searchQuery,
					category: category || null,
					activeOnly
				}
			}
		});
	} catch (error) {
		console.error('Error fetching products:', error);

		// Return appropriate error response
		return json(
			{
				success: false,
				error: 'Failed to fetch products',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};
