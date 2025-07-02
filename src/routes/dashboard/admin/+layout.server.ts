import { requireAdmin } from '$lib/server/auth/rbac';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, parent }) => {
	// Wait for parent layout to ensure authentication
	await parent();

	// Require admin role for all admin routes
	requireAdmin(locals.session);

	return {};
};
