import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const target = new URL('/staff-login', url);
	const redirectTo = url.searchParams.get('redirectTo');
	if (redirectTo) target.searchParams.set('redirectTo', redirectTo);

	throw redirect(308, `${target.pathname}${target.search}`);
};
