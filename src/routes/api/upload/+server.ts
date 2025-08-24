import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasRole } from '$lib/server/auth';
import { nanoid } from 'nanoid';

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check admin role
		if (!hasRole(locals.user.role, 'admin')) {
			return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
		}

		// Check if R2 bucket is available
		if (!platform?.env?.BUCKET) {
			console.error('R2 bucket not configured');
			return json({ error: 'Storage service unavailable' }, { status: 503 });
		}

		// Parse multipart form data
		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Validate file type
		if (!ALLOWED_TYPES.includes(file.type)) {
			return json(
				{ error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed' },
				{ status: 400 }
			);
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 });
		}

		// Generate unique filename
		const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
		const uniqueFilename = `products/${nanoid()}.${fileExtension}`;

		// Upload to R2
		const arrayBuffer = await file.arrayBuffer();
		const r2Object = await platform.env.BUCKET.put(uniqueFilename, arrayBuffer, {
			httpMetadata: {
				contentType: file.type
			},
			customMetadata: {
				uploadedBy: locals.user.id,
				originalName: file.name,
				uploadedAt: new Date().toISOString()
			}
		});

		if (!r2Object) {
			throw new Error('Failed to upload file to R2');
		}

		// Get the public URL for the uploaded file
		// Note: This assumes you have configured public access for your R2 bucket
		// or are using a custom domain/worker for serving images
		const publicUrl = `https://pub-auto.r2.dev/${uniqueFilename}`;

		// Alternative: If using a custom domain
		// const publicUrl = `https://your-cdn-domain.com/${uniqueFilename}`;

		return json({
			success: true,
			data: {
				url: publicUrl,
				filename: uniqueFilename,
				size: file.size,
				type: file.type,
				originalName: file.name
			}
		});
	} catch (error) {
		console.error('Error uploading image:', error);
		return json(
			{
				success: false,
				error: 'Failed to upload image',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ url, locals, platform }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check admin role
		if (!hasRole(locals.user.role, 'admin')) {
			return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
		}

		// Check if R2 bucket is available
		if (!platform?.env?.BUCKET) {
			console.error('R2 bucket not configured');
			return json({ error: 'Storage service unavailable' }, { status: 503 });
		}

		// Get filename from query params
		const filename = url.searchParams.get('filename');
		if (!filename) {
			return json({ error: 'Filename is required' }, { status: 400 });
		}

		// Delete from R2
		await platform.env.BUCKET.delete(filename);

		return json({
			success: true,
			message: 'Image deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting image:', error);
		return json(
			{
				success: false,
				error: 'Failed to delete image',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};
