import { redirect } from '@sveltejs/kit';
import { hasRole } from '$lib/server/auth';
import { getDefaultRedirect } from '$lib/server/guards';
import { getSafeStaffRedirect } from '$lib/navigation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const requestedRedirect = getSafeStaffRedirect(url.searchParams.get('redirectTo'));

	if (locals.user) {
		const fallback = getDefaultRedirect(locals.user.role);
		throw redirect(302, hasRole(locals.user.role, 'cashier') ? requestedRedirect : fallback);
	}

	return {
		redirectTo: requestedRedirect,
		accountsManaged: url.searchParams.get('notice') === 'staff-accounts-managed',
		emailVerified: url.searchParams.get('verified') === 'true'
	};
};
