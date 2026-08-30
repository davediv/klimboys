import { redirect } from '@sveltejs/kit';
import { isEmailServiceConfigured } from '$lib/server/email';
import { getAuthorizedStaffRedirect, getSafeStaffRedirect } from '$lib/navigation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const requestedRedirect = getSafeStaffRedirect(url.searchParams.get('redirectTo'));

	if (locals.user) {
		throw redirect(
			302,
			getAuthorizedStaffRedirect(url.searchParams.get('redirectTo'), locals.user.role)
		);
	}

	return {
		redirectTo: requestedRedirect,
		accountsManaged: url.searchParams.get('notice') === 'staff-accounts-managed',
		emailVerified: url.searchParams.get('verified') === 'true',
		passwordReset: url.searchParams.get('notice') === 'password-reset',
		emailRecoveryAvailable: isEmailServiceConfigured()
	};
};
