import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Replace with your actual Facebook URL
	const facebookUrl = 'https://facebook.com/klimboys'; // Replace with actual Facebook page

	redirect(302, facebookUrl);
};
