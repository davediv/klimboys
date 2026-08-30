import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	// Replace with your actual WhatsApp number and message
	const phoneNumber = '6282112345678'; // Replace with actual number
	const product = url.searchParams.get('product')?.trim().slice(0, 100);
	const size = url.searchParams.get('size')?.trim().slice(0, 20);
	const selection = product ? ` ${product}${size ? ` ukuran ${size}` : ''}` : ' milkshake';
	const message = encodeURIComponent(`Halo Klimboys! Saya ingin memesan${selection}.`);
	const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

	redirect(302, whatsappUrl);
};
