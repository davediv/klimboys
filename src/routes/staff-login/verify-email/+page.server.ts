import { redirect } from '@sveltejs/kit';
import { isEmailServiceConfigured } from '$lib/server/email';
import { getDefaultRedirect } from '$lib/server/guards';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user?.emailVerified) throw redirect(302, getDefaultRedirect(locals.user.role));

	const requestedEmail = url.searchParams.get('email')?.trim() ?? '';
	return {
		email: requestedEmail.length <= 254 ? requestedEmail : '',
		emailDeliveryAvailable: isEmailServiceConfigured()
	};
};
