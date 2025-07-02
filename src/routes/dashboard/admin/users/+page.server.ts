import { createDB } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/rbac';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { eq, ne, desc } from 'drizzle-orm';

const createUserSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	role: z.enum(['admin', 'cashier']).default('cashier')
});

const updateUserSchema = z.object({
	userId: z.string(),
	name: z.string().min(2).optional(),
	email: z.string().email().optional(),
	role: z.enum(['admin', 'cashier']).optional(),
	isActive: z.boolean().optional()
});

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);

	// Get all users except the current user
	const users = await db.query.user.findMany({
		where: ne(user.id, locals.session.user.id),
		orderBy: [desc(user.createdAt)],
		columns: {
			id: true,
			name: true,
			email: true,
			role: true,
			isActive: true,
			lastLoginAt: true,
			createdAt: true
		}
	});

	return {
		users
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
			email: formData.get('email') as string,
			password: formData.get('password') as string,
			role: formData.get('role') as 'admin' | 'cashier'
		};

		const result = createUserSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			// Create user using Better Auth
			const authResult = await locals.auth.api.signUpEmail({
				body: {
					email: result.data.email,
					password: result.data.password,
					name: result.data.name
				}
			});

			if (!authResult || !authResult.user) {
				return fail(400, {
					message: 'Failed to create user'
				});
			}

			// Update user role if not cashier (default)
			if (result.data.role !== 'cashier') {
				const db = createDB(platform.env.DB);
				await db
					.update(user)
					.set({
						role: result.data.role
					})
					.where(eq(user.id, authResult.user.id));
			}

			return { success: true };
		} catch (error) {
			console.error('Create user error:', error);
			return fail(500, {
				message: 'Failed to create user'
			});
		}
	},

	update: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const data = {
			userId: formData.get('userId') as string,
			name: (formData.get('name') as string) || undefined,
			email: (formData.get('email') as string) || undefined,
			role: (formData.get('role') as 'admin' | 'cashier') || undefined,
			isActive: formData.get('isActive') === 'true'
		};

		const result = updateUserSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors
			});
		}

		try {
			const db = createDB(platform.env.DB);

			// Prepare update data
			const updateData: any = {};
			if (result.data.name) updateData.name = result.data.name;
			if (result.data.email) updateData.email = result.data.email;
			if (result.data.role) updateData.role = result.data.role;
			if (result.data.isActive !== undefined) updateData.isActive = result.data.isActive;

			updateData.updatedAt = new Date();

			await db.update(user).set(updateData).where(eq(user.id, result.data.userId));

			return { success: true };
		} catch (error) {
			console.error('Update user error:', error);
			return fail(500, {
				message: 'Failed to update user'
			});
		}
	},

	delete: async ({ request, locals, platform }) => {
		requireAdmin(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { message: 'User ID required' });
		}

		// Prevent self-deletion
		if (userId === locals.session.user.id) {
			return fail(400, { message: 'Cannot delete your own account' });
		}

		try {
			const db = createDB(platform.env.DB);

			// Soft delete - just deactivate the user
			await db
				.update(user)
				.set({
					isActive: false,
					updatedAt: new Date()
				})
				.where(eq(user.id, userId));

			return { success: true };
		} catch (error) {
			console.error('Delete user error:', error);
			return fail(500, {
				message: 'Failed to delete user'
			});
		}
	}
} satisfies Actions;
