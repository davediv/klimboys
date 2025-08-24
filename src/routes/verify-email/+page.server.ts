import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Get the token from URL parameters
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(302, '/login');
	}

	// Better Auth will handle the verification through its API
	// The verification happens client-side
	return {
		token
	};
};
