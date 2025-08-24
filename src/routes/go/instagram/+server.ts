import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Replace with your actual Instagram URL
	const instagramUrl = 'https://instagram.com/klimboys'; // Replace with actual Instagram handle

	redirect(302, instagramUrl);
};
