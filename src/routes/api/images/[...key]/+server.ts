import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const GET: RequestHandler = async ({ params, platform }) => {
	const key = params.key;
	if (!key) {
		throw error(400, 'Invalid image key');
	}

	// In development, redirect to a placeholder image
	if (dev && !platform?.env.BUCKET) {
		console.warn('R2 bucket not available in development. Using placeholder image.');
		
		// Redirect to a placeholder image service
		const placeholderUrl = `https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=${encodeURIComponent('Product Image')}`;
		
		return new Response(null, {
			status: 302,
			headers: {
				'Location': placeholderUrl,
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
