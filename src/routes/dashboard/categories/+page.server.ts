import { createDB } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/rbac';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const categorySchema = z.object({
	name: z.string().min(2, 'Category name must be at least 2 characters'),
	description: z.string().optional()
});

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);

	// Get all categories
	const categories = await db.query.category.findMany({
		orderBy: [desc(category.createdAt)]
	});

	return {
		categories
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
			description: (formData.get('description') as string) || undefined
		};

		const result = categorySchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			const db = createDB(platform.env.DB);
			const categoryId = nanoid();

			await db.insert(category).values({
				id: categoryId,
				...result.data,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			return { success: true };
		} catch (error) {
			console.error('Create category error:', error);
			return fail(500, {
				message: 'Failed to create category'
			});
		}
	},

	update: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const categoryId = formData.get('categoryId') as string;

		if (!categoryId) {
			return fail(400, { message: 'Category ID required' });
		}

		const data = {
			name: formData.get('name') as string,
			description: (formData.get('description') as string) || undefined
		};

		const result = categorySchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			const db = createDB(platform.env.DB);

			await db
				.update(category)
				.set({
					...result.data,
					updatedAt: new Date()
				})
				.where(eq(category.id, categoryId));

			return { success: true };
		} catch (error) {
			console.error('Update category error:', error);
			return fail(500, {
				message: 'Failed to update category'
			});
		}
	},

	delete: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const categoryId = formData.get('categoryId') as string;

		if (!categoryId) {
			return fail(400, { message: 'Category ID required' });
		}

		try {
			const db = createDB(platform.env.DB);

			// Check if category has products
			const productsInCategory = await db.query.product.findFirst({
				where: (products, { eq }) => eq(products.categoryId, categoryId)
			});

			if (productsInCategory) {
				return fail(400, {
					message: 'Cannot delete category with products. Please reassign or delete products first.'
				});
			}

			await db.delete(category).where(eq(category.id, categoryId));

			return { success: true };
		} catch (error) {
			console.error('Delete category error:', error);
			return fail(500, {
				message: 'Failed to delete category'
			});
		}
	}
} satisfies Actions;
