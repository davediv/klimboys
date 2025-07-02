import { redirect, fail } from '@sveltejs/kit';
import { createDB } from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';

const setupSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters')
});

export const load: PageServerLoad = async ({ locals, platform }) => {
	// If already logged in, redirect to dashboard
	if (locals.session) {
		throw redirect(302, '/dashboard');
	}

	// Check if any users exist
	if (platform?.env.DB) {
		const db = createDB(platform.env.DB);
		const userCount = await db.query.user.findFirst();

		// If users exist, redirect to login
		if (userCount) {
			throw redirect(302, '/login');
		}
	}

	return {};
};

export const actions = {
	default: async ({ request, locals, platform }) => {
		if (!platform?.env.DB) {
			return fail(500, { message: 'Database not available' });
		}

		const db = createDB(platform.env.DB);

		// Double-check no users exist
		const existingUser = await db.query.user.findFirst();
		if (existingUser) {
			throw redirect(302, '/login');
		}

		const formData = await request.formData();
		const data = {
			name: formData.get('name') as string,
			email: formData.get('email') as string,
			password: formData.get('password') as string
		};

		// Validate input
		const result = setupSchema.safeParse(data);
		if (!result.success) {
			const errors = result.error.flatten();
			return fail(400, {
				data,
				errors: errors.fieldErrors
			});
		}

		try {
			// Create first admin user using Better Auth
			const { data: authData, error } = await locals.auth.api.signUpEmail({
				body: {
					email: result.data.email,
					password: result.data.password,
					name: result.data.name
				}
			});

			if (error || !authData) {
				return fail(400, {
					data: { ...data, password: '' },
					message: error?.message || 'Failed to create account'
				});
			}

			// Update user role to admin
			await db
				.update(user)
				.set({
					role: 'admin'
				})
				.where(eq(user.id, authData.user.id));

			// Sign in the user
			const signInResponse = await locals.auth.api.signInEmail({
				body: {
					email: result.data.email,
					password: result.data.password
				}
			});

			if (signInResponse.error || !signInResponse.data) {
				throw redirect(302, '/login');
			}

			// Set session cookie
			const sessionCookie = locals.auth.createSessionCookie(
				signInResponse.data.session.token,
				signInResponse.data.session.expiresAt
			);

			return {
				success: true,
				headers: {
					'Set-Cookie': sessionCookie
				}
			};
		} catch (error) {
			console.error('Setup error:', error);
			return fail(500, {
				data: { ...data, password: '' },
				message: 'Failed to create admin account'
			});
		}
	}
} satisfies Actions;

// Import necessary items
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
