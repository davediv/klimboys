import { createDB } from '$lib/server/db';
import { product, category, inventory } from '$lib/server/db/schema';
import { requireAuth, filterDataByRole } from '$lib/server/auth/rbac';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { dev } from '$app/environment';

const productSchema = z.object({
	title: z.string().min(2, 'Product name must be at least 2 characters'),
	description: z.string().optional(),
	size: z.number().positive('Size must be positive'),
	productCost: z.number().positive('Cost must be positive'),
	sellingPrice: z.number().positive('Price must be positive'),
	categoryId: z.string().optional(),
	isAvailable: z.boolean().default(true)
});

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAuth(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);

	// Get all products with category information
	const products = await db.query.product.findMany({
		with: {
			category: true
		},
		orderBy: [desc(product.createdAt)]
	});

	// Get all categories for the form
	const categories = await db.query.category.findMany({
		orderBy: [category.name]
	});

	// Filter sensitive data based on role
	const filteredProducts = products.map((p) => {
		if (locals.session?.user?.role === 'cashier') {
			// Remove cost information for cashiers
			return filterDataByRole(p, locals.session.user.role, ['productCost']);
		}
		return p;
	});

	return {
		products: filteredProducts,
		categories,
		userRole: locals.session?.user?.role || 'cashier'
	};
};

export const actions = {
	create: async ({ request, locals, platform }) => {
		requireAuth(locals.session);

		// Only admins can create products
		if (locals.session?.user?.role !== 'admin') {
			return fail(403, { message: 'Only admins can create products' });
		}

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();

		const data = {
			title: formData.get('title') as string,
			description: (formData.get('description') as string) || undefined,
			size: Number(formData.get('size')),
			productCost: Number(formData.get('productCost')),
			sellingPrice: Number(formData.get('sellingPrice')),
			categoryId: (formData.get('categoryId') as string) || undefined,
			isAvailable: formData.get('isAvailable') === 'true'
		};

		const result = productSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			const db = createDB(platform.env.DB);
			const productId = nanoid();

			// Get image URL from form (uploaded separately)
			const imageUrl = (formData.get('imageUrl') as string) || null;

			console.log('Creating product with data:', {
				productId,
				...result.data,
				imageUrl
			});

			await db.insert(product).values({
				id: productId,
				...result.data,
				imageUrl,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Automatically create inventory item for the product
			// Using the product itself as an inventory item (for finished products)
			const inventoryId = nanoid();
			await db.insert(inventory).values({
				id: inventoryId,
				name: result.data.title,
				unit: 'pcs', // Products are counted in pieces
				currentStock: 0, // Start with 0 stock
				minimumStock: 10, // Default minimum stock
				createdAt: new Date(),
				updatedAt: new Date()
			});

			console.log('Created inventory item for product:', {
				productId,
				inventoryId,
				productName: result.data.title
			});

			return { success: true };
		} catch (error) {
			console.error('Create product error:', error);
			return fail(500, {
				message: 'Failed to create product'
			});
		}
	},

	update: async ({ request, locals, platform }) => {
		requireAuth(locals.session);

		// Only admins can update products
		if (locals.session?.user?.role !== 'admin') {
			return fail(403, { message: 'Only admins can update products' });
		}

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const productId = formData.get('productId') as string;

		if (!productId) {
			return fail(400, { message: 'Product ID required' });
		}

		const data = {
			title: formData.get('title') as string,
			description: (formData.get('description') as string) || undefined,
			size: Number(formData.get('size')),
			productCost: Number(formData.get('productCost')),
			sellingPrice: Number(formData.get('sellingPrice')),
			categoryId: (formData.get('categoryId') as string) || undefined,
			isAvailable: formData.get('isAvailable') === 'true'
		};

		const result = productSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			const db = createDB(platform.env.DB);
			let updateData: any = {
				...result.data,
				updatedAt: new Date()
			};

			// Handle image update if new image URL provided
			const newImageUrl = formData.get('imageUrl') as string | null;
			if (newImageUrl) {
				// Get old product to delete old image
				const oldProduct = await db.query.product.findFirst({
					where: eq(product.id, productId)
				});

				// Delete old image if exists and R2 is available
				if (oldProduct?.imageUrl && platform.env.BUCKET) {
					try {
						await platform.env.BUCKET.delete(oldProduct.imageUrl);
					} catch (error) {
						console.error('Failed to delete old image:', error);
					}
				}

				updateData.imageUrl = newImageUrl;
			}

			// Get the old product to check if title changed
			const oldProduct = await db.query.product.findFirst({
				where: eq(product.id, productId)
			});

			await db.update(product).set(updateData).where(eq(product.id, productId));

			// If product title changed, update the related inventory item name
			if (oldProduct && oldProduct.title !== result.data.title) {
				const relatedInventory = await db.query.inventory.findFirst({
					where: eq(inventory.name, oldProduct.title)
				});

				if (relatedInventory) {
					await db
						.update(inventory)
						.set({
							name: result.data.title,
							updatedAt: new Date()
						})
						.where(eq(inventory.id, relatedInventory.id));

					console.log('Updated inventory item name:', {
						oldName: oldProduct.title,
						newName: result.data.title
					});
				}
			}

			return { success: true };
		} catch (error) {
			console.error('Update product error:', error);
			return fail(500, {
				message: 'Failed to update product'
			});
		}
	},

	delete: async ({ request, locals, platform }) => {
		requireAuth(locals.session);

		// Only admins can delete products
		if (locals.session?.user?.role !== 'admin') {
			return fail(403, { message: 'Only admins can delete products' });
		}

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const productId = formData.get('productId') as string;

		if (!productId) {
			return fail(400, { message: 'Product ID required' });
		}

		try {
			const db = createDB(platform.env.DB);

			// Get product to delete image
			const productToDelete = await db.query.product.findFirst({
				where: eq(product.id, productId)
			});

			if (!productToDelete) {
				return fail(404, { message: 'Product not found' });
			}

			// First check if there's an inventory item with the same name
			const relatedInventory = await db.query.inventory.findFirst({
				where: eq(inventory.name, productToDelete.title)
			});

			// Delete product
			await db.delete(product).where(eq(product.id, productId));

			// Delete related inventory item if it exists and has no stock
			if (relatedInventory && relatedInventory.currentStock === 0) {
				await db.delete(inventory).where(eq(inventory.id, relatedInventory.id));
				console.log('Deleted related inventory item:', relatedInventory.id);
			}

			// Delete image from R2 if exists and R2 is available
			if (productToDelete.imageUrl && platform.env.BUCKET) {
				try {
					await platform.env.BUCKET.delete(productToDelete.imageUrl);
				} catch (error) {
					console.error('Failed to delete product image:', error);
				}
			}

			return { success: true };
		} catch (error) {
			console.error('Delete product error:', error);
			return fail(500, {
				message: 'Failed to delete product'
			});
		}
	}
} satisfies Actions;
