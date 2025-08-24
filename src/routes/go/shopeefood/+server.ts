import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Replace with your actual ShopeeFood URL
	const shopeefoodUrl = 'https://shopee.co.id/universal-link/now-food/shop/klimboys'; // Replace with actual ShopeeFood link
	
	redirect(302, shopeefoodUrl);
};