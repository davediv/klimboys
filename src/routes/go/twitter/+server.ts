import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Replace with your actual Twitter/X URL
	const twitterUrl = 'https://twitter.com/klimboys'; // Replace with actual Twitter/X handle

	redirect(302, twitterUrl);
};
