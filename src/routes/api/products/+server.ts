import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { products, productVariants } from '$lib/server/db/schema';
import { eq, like, sql, and, desc } from 'drizzle-orm';
import { hasRole } from '$lib/server/auth';
import { nanoid } from 'nanoid';

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

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication and admin role
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!hasRole(locals.user.role, 'admin')) {
			return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
		}

		// Parse request body
		const body = (await request.json()) as {
			name?: unknown;
			description?: unknown;
			category?: unknown;
			imageUrl?: unknown;
			isActive?: unknown;
			variants?: unknown;
		};

		// Validate required fields
		if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
			return json({ error: 'Product name is required' }, { status: 400 });
		}

		if (!body.category || typeof body.category !== 'string' || body.category.trim().length === 0) {
			return json({ error: 'Product category is required' }, { status: 400 });
		}

		// Validate variants array
		if (!Array.isArray(body.variants) || body.variants.length === 0) {
			return json({ error: 'At least one product variant is required' }, { status: 400 });
		}

		// Validate each variant
		for (const variant of body.variants as any[]) {
			if (!variant.size || typeof variant.size !== 'string') {
				return json({ error: 'Variant size is required' }, { status: 400 });
			}

			if (typeof variant.volumeMl !== 'number' || variant.volumeMl <= 0) {
				return json({ error: 'Variant volume must be a positive number' }, { status: 400 });
			}

			if (typeof variant.costPrice !== 'number' || variant.costPrice < 0) {
				return json({ error: 'Variant cost price must be a non-negative number' }, { status: 400 });
			}

			if (typeof variant.sellingPrice !== 'number' || variant.sellingPrice < 0) {
				return json(
					{ error: 'Variant selling price must be a non-negative number' },
					{ status: 400 }
				);
			}

			if (typeof variant.stockQuantity !== 'number' || variant.stockQuantity < 0) {
				return json(
					{ error: 'Variant stock quantity must be a non-negative number' },
					{ status: 400 }
				);
			}
		}

		const db = getDb();

		// Generate product ID
		const productId = nanoid();
		const now = new Date();

		// At this point, we know body.name and body.category are valid strings
		const validatedName = body.name as string;
		const validatedCategory = body.category as string;
		const validatedDescription =
			typeof body.description === 'string' ? body.description : undefined;
		const validatedImageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : undefined;
		const validatedIsActive = body.isActive !== false;
		const validatedVariants = body.variants as any[];

		// Create product
		await db.insert(products).values({
			id: productId,
			name: validatedName.trim(),
			description: validatedDescription?.trim() || null,
			category: validatedCategory.trim(),
			imageUrl: validatedImageUrl?.trim() || null,
			isActive: validatedIsActive, // Default to true if not specified
			createdAt: now,
			updatedAt: now
		});

		// Create variants
		const variantRecords = validatedVariants.map((variant: any) => ({
			id: nanoid(),
			productId: productId,
			size: variant.size.trim(),
			volumeMl: variant.volumeMl,
			costPrice: Math.round(variant.costPrice), // Store as integer (cents)
			sellingPrice: Math.round(variant.sellingPrice), // Store as integer (cents)
			stockQuantity: variant.stockQuantity,
			createdAt: now,
			updatedAt: now
		}));

		await db.insert(productVariants).values(variantRecords);

		// Fetch the created product with variants for response
		const createdProduct = await db
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
			.where(eq(products.id, productId))
			.limit(1);

		const createdVariants = await db
			.select({
				id: productVariants.id,
				size: productVariants.size,
				volumeMl: productVariants.volumeMl,
				costPrice: productVariants.costPrice,
				sellingPrice: productVariants.sellingPrice,
				stockQuantity: productVariants.stockQuantity
			})
			.from(productVariants)
			.where(eq(productVariants.productId, productId));

		// Return created product with variants
		return json(
			{
				success: true,
				data: {
					...createdProduct[0],
					variants: createdVariants
				}
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating product:', error);

		// Return appropriate error response
		return json(
			{
				success: false,
				error: 'Failed to create product',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};
