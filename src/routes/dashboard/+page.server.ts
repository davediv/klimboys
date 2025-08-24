import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to login if not authenticated
	if (!locals.user) {
		throw redirect(302, '/login?redirectTo=/dashboard');
	}

	// Check if email is verified
	if (!locals.user.emailVerified) {
		return {
			user: locals.user,
			needsVerification: true
		};
	}

	return {
		user: locals.user,
		needsVerification: false
	};
};
