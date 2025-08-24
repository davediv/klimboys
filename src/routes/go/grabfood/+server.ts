import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Replace with your actual GrabFood URL
	const grabfoodUrl = 'https://food.grab.com/id/en/restaurant/klimboys-delivery'; // Replace with actual GrabFood link
	
	redirect(302, grabfoodUrl);
};