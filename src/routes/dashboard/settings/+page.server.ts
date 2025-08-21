import { requireAuth } from '$lib/server/auth/rbac';
import { logActivity } from '$lib/server/auth/rbac';
import { ActivityType } from '$lib/server/auth/activity-log';
import { validatePasswordComplexity } from '$lib/server/auth/guards';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createDB } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	requireAuth(locals.session);

	return {
		user: locals.session.user
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals, platform }) => {
		requireAuth(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;

		if (!name || !email) {
			return fail(400, { message: 'Name and email are required' });
		}

		try {
			const db = createDB(platform.env.DB);

			// Check if email is already taken by another user
			const existingUser = await db.query.user.findFirst({
				where: (users, { and, eq, ne }) =>
					and(eq(users.email, email), ne(users.id, locals.session!.user.id))
			});

			if (existingUser) {
				return fail(400, { message: 'Email is already in use' });
			}

			// Update user profile
			await db
				.update(user)
				.set({
					name,
					email,
					updatedAt: new Date()
				})
				.where(eq(user.id, locals.session!.user.id));

			// Log activity
			await logActivity(locals.session!.user.id, ActivityType.SETTINGS_UPDATED, {
				entityType: 'user',
				entityId: locals.session!.user.id,
				metadata: {
					fieldsUpdated: ['name', 'email']
				}
			});

			return { success: true, message: 'Profile updated successfully' };
		} catch (error) {
			console.error('Failed to update profile:', error);
			return fail(500, { message: 'Failed to update profile' });
		}
	},

	changePassword: async ({ request, locals, platform }) => {
		requireAuth(locals.session);

		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword') as string;
		const newPassword = formData.get('newPassword') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { message: 'All password fields are required' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { message: 'New passwords do not match' });
		}

		// Validate password complexity
		const validation = validatePasswordComplexity(newPassword);
		if (!validation.valid) {
			return fail(400, {
				message: 'Password does not meet requirements',
				errors: validation.errors
			});
		}

		try {
			// Use Better Auth to change password
			const auth = locals.auth;

			// Better Auth handles password verification and hashing internally
			const result = await auth.api.changePassword({
				body: {
					currentPassword,
					newPassword,
					revokeOtherSessions: false
				},
				headers: request.headers
			});

			if (!result) {
				return fail(400, {
					message: 'Failed to change password. Please check your current password.'
				});
			}

			// Log activity
			await logActivity(locals.session!.user.id, ActivityType.PASSWORD_CHANGED, {
				entityType: 'user',
				entityId: locals.session!.user.id,
				metadata: {
					changedAt: new Date().toISOString()
				}
			});

			return { success: true, message: 'Password changed successfully' };
		} catch (error) {
			console.error('Failed to change password:', error);
			return fail(500, {
				message: 'Failed to change password. Please check your current password.'
			});
		}
	}
};
