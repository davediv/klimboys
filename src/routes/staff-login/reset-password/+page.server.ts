import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => ({
	token: url.searchParams.get('token') ?? '',
	invalidToken: url.searchParams.has('error') || !url.searchParams.has('token')
});
