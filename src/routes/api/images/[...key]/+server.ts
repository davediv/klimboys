import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const GET: RequestHandler = async ({ params, platform }) => {
	try {
		const key = params.key;

		if (!key) {
			throw error(400, 'Invalid image key');
		}

		// In development or when R2 is not available, serve a placeholder
		if (dev || !platform?.env?.BUCKET) {
			// Create a more visually appealing SVG placeholder
			const svg = `
				<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
					<!-- Background -->
					<rect width="400" height="300" fill="#e5e7eb"/>
					
					<!-- Product icon -->
					<g transform="translate(200, 150)">
						<!-- Box shape -->
						<path d="M-40 -30 L-40 20 L40 20 L40 -30 Z" fill="#9ca3af"/>
						<path d="M-40 -30 L0 -50 L40 -30 Z" fill="#d1d5db"/>
						<path d="M40 -30 L40 20 L60 0 L60 -50 L40 -30 Z" fill="#6b7280"/>
						<path d="M0 -50 L60 -50 L40 -30 Z" fill="#e5e7eb"/>
						
						<!-- Text below icon -->
						<text x="0" y="45" font-family="Arial" font-size="16" fill="#6b7280" text-anchor="middle">Product Image</text>
						<text x="0" y="65" font-family="Arial" font-size="12" fill="#9ca3af" text-anchor="middle">(Development Mode)</text>
					</g>
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

		try {
			// Get the object from R2
			const object = await platform.env.BUCKET.get(key);

			if (!object) {
				// Return placeholder instead of 404
				const svg = `
					<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
						<rect width="400" height="300" fill="#f3f4f6"/>
						<text x="50%" y="50%" font-family="Arial" font-size="18" fill="#9ca3af" text-anchor="middle" dy=".3em">Image Not Found</text>
					</svg>
				`;

				return new Response(svg.trim(), {
					status: 200,
					headers: {
						'Content-Type': 'image/svg+xml',
						'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
					}
				});
			}

			// Get the object data and headers
			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set('cache-control', 'public, max-age=86400'); // Cache for 1 day

			// Return the image
			return new Response(object.body, { headers });
		} catch (r2Error) {
			console.error('Error fetching from R2:', r2Error);
			// Return placeholder on R2 error
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
					'Cache-Control': 'public, max-age=300'
				}
			});
		}
	} catch (err) {
		console.error('Unexpected error in image API:', err);
		// Always return a valid image response instead of throwing
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
				'Cache-Control': 'no-cache'
			}
		});
	}
};
