import type { LayoutServerLoad } from './$types';
import { createPublicBusinessConfig } from '$lib/server/public-business';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const environment = platform?.env as unknown as Record<string, unknown> | undefined;

	return {
		user: locals.user || null,
		business: createPublicBusinessConfig(environment)
	};
};
