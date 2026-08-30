import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getD1Database, getDb } from '$lib/server/db';
import { products, productVariants } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { hasCapability } from '$lib/permissions';
import {
	reconcileVariantIdentities,
	VariantIdentityError,
	type CatalogVariantInput
} from '$lib/catalog-variants';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export const GET: RequestHandler = async ({ params }) => {
	try {
		const db = getDb();
		const productId = params.id;

		// Fetch the product
		const product = await db
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

		if (product.length === 0) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		// Fetch variants for this product
		const variants = await db
			.select({
				id: productVariants.id,
				size: productVariants.size,
				volumeMl: productVariants.volumeMl,
				costPrice: productVariants.costPrice,
				sellingPrice: productVariants.sellingPrice,
				stockQuantity: productVariants.stockQuantity
			})
			.from(productVariants)
			.where(and(eq(productVariants.productId, productId), eq(productVariants.isActive, true)));

		// Return product with variants
		return json({
			success: true,
			data: {
				...product[0],
				variants
			}
		});
	} catch (error) {
		console.error('Error fetching product:', error);
		return json(
			{
				success: false,
				error: 'Failed to fetch product',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (!hasCapability(locals.user.role, 'catalog:manage')) {
			return json({ error: 'Forbidden: Catalog management access required' }, { status: 403 });
		}

		const db = getDb();
		const productId = params.id;
		const body = (await request.json()) as {
			name?: unknown;
			description?: unknown;
			category?: unknown;
			imageUrl?: unknown;
			isActive?: unknown;
			variants?: unknown;
		};

		const [existingProduct, existingVariants] = await Promise.all([
			db
				.select()
				.from(products)
				.where(eq(products.id, productId))
				.limit(1)
				.then((rows) => rows[0]),
			db.select().from(productVariants).where(eq(productVariants.productId, productId))
		]);
		if (!existingProduct) return json({ error: 'Product not found' }, { status: 404 });

		let name = existingProduct.name;
		let description = existingProduct.description;
		let category = existingProduct.category;
		let imageUrl = existingProduct.imageUrl;
		let isActive = existingProduct.isActive;
		if (body.name !== undefined) {
			if (typeof body.name !== 'string' || body.name.trim().length === 0) {
				return json({ error: 'Product name must be a non-empty string' }, { status: 400 });
			}
			name = body.name.trim();
		}
		if (body.description !== undefined) {
			if (body.description !== null && typeof body.description !== 'string') {
				return json({ error: 'Product description must be a string or null' }, { status: 400 });
			}
			description = body.description ? body.description.trim() : null;
		}
		if (body.category !== undefined) {
			if (typeof body.category !== 'string' || body.category.trim().length === 0) {
				return json({ error: 'Product category must be a non-empty string' }, { status: 400 });
			}
			category = body.category.trim();
		}
		if (body.imageUrl !== undefined) {
			if (body.imageUrl !== null && typeof body.imageUrl !== 'string') {
				return json({ error: 'Product image URL must be a string or null' }, { status: 400 });
			}
			imageUrl = body.imageUrl ? body.imageUrl.trim() : null;
		}
		if (body.isActive !== undefined) {
			if (typeof body.isActive !== 'boolean') {
				return json({ error: 'Product isActive must be a boolean' }, { status: 400 });
			}
			isActive = body.isActive;
		}

		let normalizedVariants: CatalogVariantInput[] | undefined;
		if (body.variants !== undefined) {
			if (!Array.isArray(body.variants) || body.variants.length === 0) {
				return json({ error: 'At least one variant is required' }, { status: 400 });
			}
			if (body.variants.length > 20) {
				return json({ error: 'A product cannot contain more than 20 variants' }, { status: 400 });
			}

			const parsedVariants: CatalogVariantInput[] = [];
			const seenIds = new Set<string>();
			const seenSizes = new Set<string>();
			for (const variant of body.variants) {
				if (!isRecord(variant)) {
					return json({ error: 'Each variant must be an object' }, { status: 400 });
				}
				if (variant.id !== undefined && (typeof variant.id !== 'string' || !variant.id.trim())) {
					return json({ error: 'Variant ID must be a non-empty string' }, { status: 400 });
				}
				if (typeof variant.size !== 'string' || !variant.size.trim()) {
					return json({ error: 'Variant size is required' }, { status: 400 });
				}
				if (!Number.isInteger(variant.volumeMl) || Number(variant.volumeMl) <= 0) {
					return json({ error: 'Variant volume must be a positive number' }, { status: 400 });
				}
				if (
					typeof variant.costPrice !== 'number' ||
					!Number.isFinite(variant.costPrice) ||
					variant.costPrice < 0
				) {
					return json(
						{ error: 'Variant cost price must be a non-negative number' },
						{ status: 400 }
					);
				}
				if (
					typeof variant.sellingPrice !== 'number' ||
					!Number.isFinite(variant.sellingPrice) ||
					variant.sellingPrice < 0
				) {
					return json(
						{ error: 'Variant selling price must be a non-negative number' },
						{ status: 400 }
					);
				}
				const id = typeof variant.id === 'string' ? variant.id.trim() : undefined;
				const size = variant.size.trim();
				if ((id && seenIds.has(id)) || seenSizes.has(size)) {
					return json({ error: 'Variant IDs and sizes must be unique' }, { status: 400 });
				}
				if (id) seenIds.add(id);
				seenSizes.add(size);
				parsedVariants.push({
					id,
					size,
					volumeMl: Number(variant.volumeMl),
					costPrice: Math.round(variant.costPrice),
					sellingPrice: Math.round(variant.sellingPrice)
				});
			}
			normalizedVariants = parsedVariants;
		}

		const database = getD1Database();
		const statements: D1PreparedStatement[] = [
			database
				.prepare(
					`UPDATE products
					 SET name = ?, description = ?, category = ?, image_url = ?, is_active = ?, updated_at = unixepoch()
					 WHERE id = ?`
				)
				.bind(name, description, category, imageUrl, isActive ? 1 : 0, productId)
		];

		if (normalizedVariants) {
			let plan;
			try {
				plan = reconcileVariantIdentities(existingVariants, normalizedVariants);
			} catch (error) {
				if (error instanceof VariantIdentityError) {
					return json({ error: error.message }, { status: 409 });
				}
				throw error;
			}

			for (const variant of plan.variants) {
				statements.push(
					variant.operation === 'update'
						? database
								.prepare(
									`UPDATE product_variants
									 SET volume_ml = ?, cost_price = ?, selling_price = ?, is_active = 1, updated_at = unixepoch()
									 WHERE id = ? AND product_id = ?`
								)
								.bind(
									variant.volumeMl,
									variant.costPrice,
									variant.sellingPrice,
									variant.id,
									productId
								)
						: database
								.prepare(
									`INSERT INTO product_variants
										(id, product_id, size, volume_ml, cost_price, selling_price, stock_quantity, is_active, created_at, updated_at)
										 VALUES (?, ?, ?, ?, ?, ?, 0, 1, unixepoch(), unixepoch())`
								)
								.bind(
									variant.id,
									productId,
									variant.size,
									variant.volumeMl,
									variant.costPrice,
									variant.sellingPrice
								)
				);
			}

			for (const variantId of plan.retireIds) {
				statements.push(
					database
						.prepare(
							`UPDATE product_variants
							 SET is_active = 0, updated_at = unixepoch()
							 WHERE id = ? AND product_id = ?`
						)
						.bind(variantId, productId)
				);
			}
		}

		await database.batch(statements);
		const [updatedProduct, updatedVariants] = await Promise.all([
			db
				.select()
				.from(products)
				.where(eq(products.id, productId))
				.limit(1)
				.then((rows) => rows[0]),
			db
				.select({
					id: productVariants.id,
					size: productVariants.size,
					volumeMl: productVariants.volumeMl,
					costPrice: productVariants.costPrice,
					sellingPrice: productVariants.sellingPrice,
					stockQuantity: productVariants.stockQuantity
				})
				.from(productVariants)
				.where(and(eq(productVariants.productId, productId), eq(productVariants.isActive, true)))
		]);

		return json({
			success: true,
			data: {
				...updatedProduct,
				variants: updatedVariants
			}
		});
	} catch (error) {
		console.error('Error updating product:', error);
		return json(
			{
				success: false,
				error: 'Failed to update product',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		// Check authentication and catalog-management permission.
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!hasCapability(locals.user.role, 'catalog:manage')) {
			return json({ error: 'Forbidden: Catalog management access required' }, { status: 403 });
		}

		const db = getDb();
		const productId = params.id;

		// Check if product exists
		const existingProduct = await db
			.select({ id: products.id, isActive: products.isActive })
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (existingProduct.length === 0) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		// Soft delete by setting isActive to false
		await db
			.update(products)
			.set({
				isActive: false,
				updatedAt: new Date()
			})
			.where(eq(products.id, productId));

		return json({
			success: true,
			message: 'Product deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting product:', error);
		return json(
			{
				success: false,
				error: 'Failed to delete product',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};
