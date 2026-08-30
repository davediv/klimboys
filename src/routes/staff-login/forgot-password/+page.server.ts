import { isEmailServiceConfigured } from '$lib/server/email';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	emailRecoveryAvailable: isEmailServiceConfigured()
});
