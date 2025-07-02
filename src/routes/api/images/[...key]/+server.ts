import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const GET: RequestHandler = async ({ params, platform }) => {
	const key = params.key;
	if (!key) {
		throw error(400, 'Invalid image key');
	}

	// In development, serve a placeholder image directly
	if (dev && !platform?.env.BUCKET) {
		console.warn('R2 bucket not available in development. Serving placeholder for key:', key);
		
		// Create an SVG placeholder image
		const svg = `
			<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
				<rect width="400" height="300" fill="#f3f4f6"/>
				<text x="50%" y="50%" font-family="Arial" font-size="18" fill="#9ca3af" text-anchor="middle" dy=".3em">Product Image</text>
			</svg>
		`;
		
		return new Response(svg.trim(), {
			status: 200,
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	}

	if (!platform?.env.BUCKET) {
		throw error(500, 'Storage service not available');
	}

	try {
		// Get the object from R2
		const object = await platform.env.BUCKET.get(key);

		if (!object) {
			throw error(404, 'Image not found');
		}

		// Get the object data and headers
		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set('cache-control', 'public, max-age=86400'); // Cache for 1 day

		// Return the image
		return new Response(object.body, { headers });
	} catch (err) {
		console.error('Error fetching image:', err);
		throw error(500, 'Failed to fetch image');
	}
};
