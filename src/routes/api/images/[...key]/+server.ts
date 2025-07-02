import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, platform }) => {
	if (!platform?.env.BUCKET) {
		throw error(500, 'Storage service not available');
	}

	const key = params.key;
	if (!key) {
		throw error(400, 'Invalid image key');
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