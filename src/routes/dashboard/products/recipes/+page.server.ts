import { createDB } from '$lib/server/db';
import { product, inventory, productRecipe } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/rbac';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const recipeItemSchema = z.object({
	inventoryId: z.string(),
	quantity: z.number().positive('Quantity must be positive')
});

const recipeSchema = z.object({
	productId: z.string(),
	items: z.array(recipeItemSchema).min(1, 'At least one ingredient is required')
});

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);

	// Get all products with their recipes
	const products = await db.query.product.findMany({
		orderBy: [product.title],
		with: {
			category: true,
			recipes: {
				with: {
					inventory: true
				}
			}
		}
	});

	// Get all inventory items
	const inventoryItems = await db.query.inventory.findMany({
		orderBy: [inventory.name]
	});

	return {
		products,
		inventoryItems
	};
};

export const actions = {
	save: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const productId = formData.get('productId') as string;

		// Parse recipe items from form data
		const items = [];
		let i = 0;
		while (formData.has(`items[${i}][inventoryId]`)) {
			items.push({
				inventoryId: formData.get(`items[${i}][inventoryId]`) as string,
				quantity: parseFloat(formData.get(`items[${i}][quantity]`) as string)
			});
			i++;
		}

		const result = recipeSchema.safeParse({
			productId,
			items
		});

		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				message: 'Invalid recipe data'
			});
		}

		try {
			const db = createDB(platform.env.DB);
			const now = new Date();

			// Delete existing recipes for this product
			await db.delete(productRecipe).where(eq(productRecipe.productId, productId));

			// Insert new recipes
			for (const item of result.data.items) {
				await db.insert(productRecipe).values({
					id: nanoid(),
					productId: result.data.productId,
					inventoryId: item.inventoryId,
					quantity: item.quantity,
					createdAt: now,
					updatedAt: now
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Save recipe error:', error);
			return fail(500, {
				message: 'Failed to save recipe'
			});
		}
	},

	delete: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

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

			// Delete all recipes for this product
			await db.delete(productRecipe).where(eq(productRecipe.productId, productId));

			return { success: true };
		} catch (error) {
			console.error('Delete recipe error:', error);
			return fail(500, {
				message: 'Failed to delete recipe'
			});
		}
	}
} satisfies Actions;
