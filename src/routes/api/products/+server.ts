import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { products, productVariants } from '$lib/server/db/schema';
import { eq, sql, and, asc, desc } from 'drizzle-orm';
import { hasCapability } from '$lib/permissions';
import { nanoid } from 'nanoid';

interface ProductVariantInput {
	size: string;
	volumeMl: number;
	costPrice: number;
	sellingPrice: number;
}

interface ListedProduct {
	id: string;
	name: string;
	description: string | null;
	category: string;
	imageUrl: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	variants: Array<{
		id: string;
		size: string;
		volumeMl: number;
		costPrice: number;
		sellingPrice: number;
		stockQuantity: number;
	}>;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		if (!locals.user) return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		if (!locals.user.emailVerified) {
			return json(
				{ success: false, error: 'Verify your email to access staff products.' },
				{ status: 403 }
			);
		}
		const canManageCatalog = hasCapability(locals.user.role, 'catalog:manage');
		const canCreateSale = hasCapability(locals.user.role, 'sale:create');
		if (!canManageCatalog && !canCreateSale) {
			return json({ success: false, error: 'Staff product access required.' }, { status: 403 });
		}

		const db = getDb();

		// Get query parameters
		const searchQuery = (url.searchParams.get('search') || '').trim().slice(0, 100);
		const requestedPage = Number.parseInt(url.searchParams.get('page') || '1', 10);
		const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '10', 10);
		const category = (url.searchParams.get('category') || '').trim().slice(0, 100);
		const requestedStatus = url.searchParams.get('status');
		const status = !canManageCatalog
			? 'active'
			: requestedStatus === 'inactive' || requestedStatus === 'all' || requestedStatus === 'active'
				? requestedStatus
				: url.searchParams.get('active') === 'false'
					? 'all'
					: 'active';
		const includeMeta = url.searchParams.get('includeMeta') !== 'false';

		// Validate pagination parameters
		const validPage = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
		const validLimit = Number.isFinite(requestedLimit)
			? Math.min(100, Math.max(1, requestedLimit))
			: 10;
		const offset = (validPage - 1) * validLimit;

		// Build where conditions
		const conditions = [];

		// Add search condition (search in name and description)
		if (searchQuery) {
			conditions.push(
				sql`(${products.name} LIKE ${`%${searchQuery}%`} OR ${products.description} LIKE ${`%${searchQuery}%`} OR ${products.category} LIKE ${`%${searchQuery}%`})`
			);
		}

		// Add category filter
		if (category) {
			conditions.push(eq(products.category, category));
		}

		// Add active filter
		if (status === 'active') {
			conditions.push(eq(products.isActive, true));
		} else if (status === 'inactive') {
			conditions.push(eq(products.isActive, false));
		}

		// Combine conditions
		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const selectedProducts = db
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
			.offset(offset)
			.as('selected_products');

		// Product rows, counts, and filter metadata are independent. Fetch the
		// selected products and their active variants in one D1 statement so POS
		// search does not wait for a dependent second round trip.
		const [productRows, countResult, categoriesResult] = await Promise.all([
			db
				.select({
					id: selectedProducts.id,
					name: selectedProducts.name,
					description: selectedProducts.description,
					category: selectedProducts.category,
					imageUrl: selectedProducts.imageUrl,
					isActive: selectedProducts.isActive,
					createdAt: selectedProducts.createdAt,
					updatedAt: selectedProducts.updatedAt,
					variantId: productVariants.id,
					variantSize: productVariants.size,
					variantVolumeMl: productVariants.volumeMl,
					variantCostPrice: productVariants.costPrice,
					variantSellingPrice: productVariants.sellingPrice,
					variantStockQuantity: productVariants.stockQuantity
				})
				.from(selectedProducts)
				.leftJoin(
					productVariants,
					and(
						eq(productVariants.productId, selectedProducts.id),
						eq(productVariants.isActive, true)
					)
				)
				.orderBy(desc(selectedProducts.createdAt), asc(productVariants.volumeMl)),
			includeMeta
				? db
						.select({ count: sql<number>`count(*)` })
						.from(products)
						.where(whereClause)
				: undefined,
			includeMeta
				? db
						.selectDistinct({ category: products.category })
						.from(products)
						.where(status === 'all' ? undefined : eq(products.isActive, status === 'active'))
				: undefined
		]);

		const totalItems = countResult?.[0]?.count || 0;
		const totalPages = Math.ceil(totalItems / validLimit);

		const productsById = new Map<string, ListedProduct>();
		for (const row of productRows) {
			let product = productsById.get(row.id);
			if (!product) {
				product = {
					id: row.id,
					name: row.name,
					description: row.description,
					category: row.category,
					imageUrl: row.imageUrl,
					isActive: row.isActive,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
					variants: []
				};
				productsById.set(row.id, product);
			}

			if (
				row.variantId !== null &&
				row.variantSize !== null &&
				row.variantVolumeMl !== null &&
				row.variantCostPrice !== null &&
				row.variantSellingPrice !== null &&
				row.variantStockQuantity !== null
			) {
				product.variants.push({
					id: row.variantId,
					size: row.variantSize,
					volumeMl: row.variantVolumeMl,
					costPrice: row.variantCostPrice,
					sellingPrice: row.variantSellingPrice,
					stockQuantity: row.variantStockQuantity
				});
			}
		}

		// Catalog managers receive the management contract. Cashiers receive only
		// fields needed to sell, never cost price or lifecycle metadata.
		const listedProducts = Array.from(productsById.values());
		const productsWithVariants = canManageCatalog
			? listedProducts
			: listedProducts.map((product) => ({
					id: product.id,
					name: product.name,
					description: product.description,
					category: product.category,
					imageUrl: product.imageUrl,
					variants: product.variants.map((variant) => ({
						id: variant.id,
						size: variant.size,
						volumeMl: variant.volumeMl,
						sellingPrice: variant.sellingPrice,
						stockQuantity: variant.stockQuantity
					}))
				}));

		const categories = categoriesResult?.map((r) => r.category).filter(Boolean) ?? [];

		// Return response with pagination metadata
		return json({
			success: true,
			data: {
				products: productsWithVariants,
				...(includeMeta
					? {
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
								status
							}
						}
					: {})
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
		// Keep catalog writes behind the same capability used by staff navigation.
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (!locals.user.emailVerified) {
			return json({ error: 'Verify your email before managing products.' }, { status: 403 });
		}

		if (!hasCapability(locals.user.role, 'catalog:manage')) {
			return json({ error: 'Forbidden: Catalog management access required' }, { status: 403 });
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
		for (const variant of body.variants) {
			if (!variant || typeof variant !== 'object') {
				return json({ error: 'Each variant must be an object' }, { status: 400 });
			}
			const candidate = variant as Record<string, unknown>;
			if (!candidate.size || typeof candidate.size !== 'string') {
				return json({ error: 'Variant size is required' }, { status: 400 });
			}

			if (typeof candidate.volumeMl !== 'number' || candidate.volumeMl <= 0) {
				return json({ error: 'Variant volume must be a positive number' }, { status: 400 });
			}

			if (typeof candidate.costPrice !== 'number' || candidate.costPrice < 0) {
				return json({ error: 'Variant cost price must be a non-negative number' }, { status: 400 });
			}

			if (typeof candidate.sellingPrice !== 'number' || candidate.sellingPrice < 0) {
				return json(
					{ error: 'Variant selling price must be a non-negative number' },
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
		const validatedVariants = body.variants as ProductVariantInput[];

		const productRecord = {
			id: productId,
			name: validatedName.trim(),
			description: validatedDescription?.trim() || null,
			category: validatedCategory.trim(),
			imageUrl: validatedImageUrl?.trim() || null,
			isActive: validatedIsActive, // Default to true if not specified
			createdAt: now,
			updatedAt: now
		};

		const variantRecords = validatedVariants.map((variant) => ({
			id: nanoid(),
			productId: productId,
			size: variant.size.trim(),
			volumeMl: variant.volumeMl,
			costPrice: Math.round(variant.costPrice), // Store as integer (cents)
			sellingPrice: Math.round(variant.sellingPrice), // Store as integer (cents)
			// New variants always start empty. Inventory movements are recorded separately.
			stockQuantity: 0,
			createdAt: now,
			updatedAt: now
		}));

		// D1 executes batched statements in order in one round trip. Both response
		// objects are already known, so avoid reading the rows back after insertion.
		await db.batch([
			db.insert(products).values(productRecord),
			db.insert(productVariants).values(variantRecords)
		]);

		const createdVariants = variantRecords.map(
			({ id, size, volumeMl, costPrice, sellingPrice, stockQuantity }) => ({
				id,
				size,
				volumeMl,
				costPrice,
				sellingPrice,
				stockQuantity
			})
		);

		// Return created product with variants
		return json(
			{
				success: true,
				data: {
					...productRecord,
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
