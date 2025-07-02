import { requireAuth } from '$lib/server/auth/rbac';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Require authentication for all dashboard routes
	requireAuth(locals.session);

	return {
		session: locals.session
	};
};
