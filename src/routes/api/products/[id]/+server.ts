import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { products, productVariants } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hasRole } from '$lib/server/auth';
import { nanoid } from 'nanoid';

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
			.where(eq(productVariants.productId, productId));

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
		// Check authentication and admin role
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!hasRole(locals.user.role, 'admin')) {
			return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
		}

		const db = getDb();
		const productId = params.id;

		// Check if product exists
		const existingProduct = await db
			.select({ id: products.id })
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (existingProduct.length === 0) {
			return json({ error: 'Product not found' }, { status: 404 });
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

		// Prepare update data for product
		const updateData: any = {
			updatedAt: new Date()
		};

		// Validate and add fields if provided
		if (body.name !== undefined) {
			if (typeof body.name !== 'string' || body.name.trim().length === 0) {
				return json({ error: 'Product name must be a non-empty string' }, { status: 400 });
			}
			updateData.name = body.name.trim();
		}

		if (body.description !== undefined) {
			if (body.description !== null && typeof body.description !== 'string') {
				return json({ error: 'Product description must be a string or null' }, { status: 400 });
			}
			updateData.description = body.description ? body.description.trim() : null;
		}

		if (body.category !== undefined) {
			if (typeof body.category !== 'string' || body.category.trim().length === 0) {
				return json({ error: 'Product category must be a non-empty string' }, { status: 400 });
			}
			updateData.category = body.category.trim();
		}

		if (body.imageUrl !== undefined) {
			if (body.imageUrl !== null && typeof body.imageUrl !== 'string') {
				return json({ error: 'Product image URL must be a string or null' }, { status: 400 });
			}
			updateData.imageUrl = body.imageUrl ? body.imageUrl.trim() : null;
		}

		if (body.isActive !== undefined) {
			if (typeof body.isActive !== 'boolean') {
				return json({ error: 'Product isActive must be a boolean' }, { status: 400 });
			}
			updateData.isActive = body.isActive;
		}

		// Update product
		await db.update(products).set(updateData).where(eq(products.id, productId));

		// Handle variants if provided
		if (body.variants !== undefined) {
			if (!Array.isArray(body.variants)) {
				return json({ error: 'Variants must be an array' }, { status: 400 });
			}

			if (body.variants.length === 0) {
				return json({ error: 'At least one variant is required' }, { status: 400 });
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
					return json(
						{ error: 'Variant cost price must be a non-negative number' },
						{ status: 400 }
					);
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

			// Delete existing variants
			await db.delete(productVariants).where(eq(productVariants.productId, productId));

			// Insert new variants
			const now = new Date();
			const variantRecords = (body.variants as any[]).map((variant: any) => ({
				id: variant.id || nanoid(),
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
		}

		// Fetch updated product with variants for response
		const updatedProduct = await db
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

		const updatedVariants = await db
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

		// Return updated product with variants
		return json({
			success: true,
			data: {
				...updatedProduct[0],
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
		// Check authentication and admin role
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!hasRole(locals.user.role, 'admin')) {
			return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
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
