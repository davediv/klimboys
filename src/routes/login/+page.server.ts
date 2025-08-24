import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If user is already logged in, redirect to dashboard
	if (locals.user) {
		// Check if there's a redirectTo parameter, otherwise go to dashboard
		const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
		throw redirect(302, redirectTo);
	}

	return {};
};