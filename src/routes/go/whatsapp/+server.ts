import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Replace with your actual WhatsApp number and message
	const phoneNumber = '6282112345678'; // Replace with actual number
	const message = encodeURIComponent('Halo Klimboys! Saya ingin memesan milkshake.');
	const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

	redirect(302, whatsappUrl);
};
