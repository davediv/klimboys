import { redirect } from '@sveltejs/kit';
import { getDefaultStaffPath } from '$lib/permissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/staff-login?redirectTo=/staff');
	throw redirect(302, getDefaultStaffPath(locals.user.role));
};
