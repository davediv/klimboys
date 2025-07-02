import { createDB } from '$lib/server/db';
import { inventory, stockMovement, productRecipe, product } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/rbac';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const inventorySchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	unit: z.enum(['ml', 'g', 'pcs', 'kg', 'l'], {
		errorMap: () => ({ message: 'Invalid unit' })
	}),
	minimumStock: z.number().min(0, 'Minimum stock must be positive'),
	currentStock: z.number().min(0, 'Current stock must be positive')
});

const stockAdjustmentSchema = z.object({
	inventoryId: z.string(),
	quantity: z.number(),
	reason: z.string().min(3, 'Reason must be at least 3 characters')
});

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);

	// Get all inventory items with their product usage
	const inventoryItems = await db.query.inventory.findMany({
		orderBy: [inventory.name],
		with: {
			recipes: {
				with: {
					product: true
				}
			}
		}
	});

	// Get recent stock movements
	const recentMovements = await db.query.stockMovement.findMany({
		orderBy: [desc(stockMovement.createdAt)],
		limit: 10,
		with: {
			inventory: true,
			createdByUser: {
				columns: {
					id: true,
					name: true,
					email: true
				}
			}
		}
	});

	// Calculate low stock items
	const lowStockItems = inventoryItems.filter((item) => item.currentStock <= item.minimumStock);

	return {
		inventoryItems,
		recentMovements,
		lowStockCount: lowStockItems.length
	};
};

export const actions = {
	create: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const data = {
			name: formData.get('name') as string,
			unit: formData.get('unit') as string,
			minimumStock: parseFloat(formData.get('minimumStock') as string),
			currentStock: parseFloat(formData.get('currentStock') as string)
		};

		const result = inventorySchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			const db = createDB(platform.env.DB);
			const inventoryId = nanoid();
			const now = new Date();

			// Create inventory item
			await db.insert(inventory).values({
				id: inventoryId,
				...result.data,
				lastRestockDate: result.data.currentStock > 0 ? now : null,
				createdAt: now,
				updatedAt: now
			});

			// Create initial stock movement if there's initial stock
			if (result.data.currentStock > 0) {
				await db.insert(stockMovement).values({
					id: nanoid(),
					inventoryId,
					type: 'in',
					quantity: result.data.currentStock,
					reason: 'Initial stock',
					createdBy: locals.session.user.id,
					createdAt: now
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Create inventory error:', error);
			return fail(500, {
				message: 'Failed to create inventory item'
			});
		}
	},

	update: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const inventoryId = formData.get('inventoryId') as string;

		if (!inventoryId) {
			return fail(400, { message: 'Inventory ID required' });
		}

		const data = {
			name: formData.get('name') as string,
			unit: formData.get('unit') as string,
			minimumStock: parseFloat(formData.get('minimumStock') as string),
			currentStock: parseFloat(formData.get('currentStock') as string)
		};

		const result = inventorySchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			const db = createDB(platform.env.DB);

			await db
				.update(inventory)
				.set({
					name: result.data.name,
					unit: result.data.unit,
					minimumStock: result.data.minimumStock,
					updatedAt: new Date()
				})
				.where(eq(inventory.id, inventoryId));

			return { success: true };
		} catch (error) {
			console.error('Update inventory error:', error);
			return fail(500, {
				message: 'Failed to update inventory item'
			});
		}
	},

	adjust: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const data = {
			inventoryId: formData.get('inventoryId') as string,
			quantity: parseFloat(formData.get('quantity') as string),
			reason: formData.get('reason') as string
		};

		const result = stockAdjustmentSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			const db = createDB(platform.env.DB);

			// Get current inventory
			const inventoryItem = await db.query.inventory.findFirst({
				where: eq(inventory.id, result.data.inventoryId)
			});

			if (!inventoryItem) {
				return fail(404, { message: 'Inventory item not found' });
			}

			const newStock = inventoryItem.currentStock + result.data.quantity;
			if (newStock < 0) {
				return fail(400, { message: 'Cannot adjust stock below zero' });
			}

			const now = new Date();

			// Update inventory stock
			await db
				.update(inventory)
				.set({
					currentStock: newStock,
					lastRestockDate: result.data.quantity > 0 ? now : inventoryItem.lastRestockDate,
					updatedAt: now
				})
				.where(eq(inventory.id, result.data.inventoryId));

			// Create stock movement record
			await db.insert(stockMovement).values({
				id: nanoid(),
				inventoryId: result.data.inventoryId,
				type: result.data.quantity > 0 ? 'in' : 'out',
				quantity: Math.abs(result.data.quantity),
				reason: result.data.reason,
				createdBy: locals.session.user.id,
				createdAt: now
			});

			return { success: true };
		} catch (error) {
			console.error('Adjust stock error:', error);
			return fail(500, {
				message: 'Failed to adjust stock'
			});
		}
	},

	delete: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const inventoryId = formData.get('inventoryId') as string;

		if (!inventoryId) {
			return fail(400, { message: 'Inventory ID required' });
		}

		try {
			const db = createDB(platform.env.DB);

			// Check if inventory is used in any recipes
			const recipesUsingInventory = await db.query.productRecipe.findFirst({
				where: eq(productRecipe.inventoryId, inventoryId)
			});

			if (recipesUsingInventory) {
				return fail(400, {
					message: 'Cannot delete inventory item used in product recipes'
				});
			}

			await db.delete(inventory).where(eq(inventory.id, inventoryId));

			return { success: true };
		} catch (error) {
			console.error('Delete inventory error:', error);
			return fail(500, {
				message: 'Failed to delete inventory item'
			});
		}
	}
} satisfies Actions;
