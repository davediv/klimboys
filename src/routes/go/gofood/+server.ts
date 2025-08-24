import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Replace with your actual GoFood URL
	const gofoodUrl = 'https://gofood.link/a/DxHrnHF'; // Replace with actual GoFood link

	redirect(302, gofoodUrl);
};
