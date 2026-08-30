import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const target = new URL('/staff-login/verify-email', url);
	const email = url.searchParams.get('email');
	if (email) target.searchParams.set('email', email);

	throw redirect(308, `${target.pathname}${target.search}`);
};
