import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/rbac';
import { nanoid } from 'nanoid';
import { dev } from '$app/environment';

// Allowed file types for products
const ALLOWED_FILE_TYPES = {
	'image/jpeg': ['.jpg', '.jpeg'],
	'image/png': ['.png'],
	'image/webp': ['.webp']
};

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Get file extension from filename
function getFileExtension(filename: string): string {
	const lastDot = filename.lastIndexOf('.');
	return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : '';
}

// Validate file type
function isValidFileType(mimeType: string, filename: string): boolean {
	const allowedExtensions = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
	if (!allowedExtensions) return false;

	const fileExtension = getFileExtension(filename);
	return allowedExtensions.includes(fileExtension);
}

// Generate unique key for file
function generateFileKey(category: string, filename: string): string {
	const id = nanoid();
	const extension = getFileExtension(filename);
	return `${category}/${id}${extension}`;
}

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	// Check authentication
	const session = requireAuth(locals.session);
	
	// Only admins can upload files
	if (session.user.role !== 'admin') {
		return json({ error: 'Only admins can upload files' }, { status: 403 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const category = formData.get('category') as string || 'products';

		// Validate file presence
		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return json({
				error: 'File too large',
				maxSize: '5MB',
				fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
			}, { status: 400 });
		}

		// Validate file type
		if (!isValidFileType(file.type, file.name)) {
			return json({
				error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
				allowedTypes: Object.keys(ALLOWED_FILE_TYPES),
				receivedType: file.type
			}, { status: 400 });
		}

		// Generate unique key
		const key = generateFileKey(category, file.name);

		// In development without R2, return mock response
		if (dev && !platform?.env?.BUCKET) {
			console.warn('R2 not available in development, returning mock upload response');
			
			return json({
				success: true,
				message: 'File uploaded successfully (dev mode)',
				file: {
					key,
					url: `/api/images/${key}`,
					originalName: file.name,
					size: file.size,
					type: file.type,
					uploadedAt: new Date().toISOString()
				}
			}, { status: 201 });
		}

		// Check R2 availability
		if (!platform?.env?.BUCKET) {
			return json({ error: 'Storage service not available' }, { status: 500 });
		}

		// Upload to R2
		const arrayBuffer = await file.arrayBuffer();

		// Set metadata
		const metadata = {
			uploadedBy: session.user.id,
			uploadedAt: new Date().toISOString(),
			originalName: file.name,
			contentType: file.type,
			size: file.size.toString()
		};

		// Put object in R2
		await platform.env.BUCKET.put(key, arrayBuffer, {
			httpMetadata: {
				contentType: file.type,
				cacheControl: 'public, max-age=31536000' // Cache for 1 year
			},
			customMetadata: metadata
		});

		// Return success response
		return json({
			success: true,
			message: 'File uploaded successfully',
			file: {
				key,
				url: `/api/images/${key}`,
				originalName: file.name,
				size: file.size,
				type: file.type,
				uploadedAt: metadata.uploadedAt
			}
		}, { status: 201 });

	} catch (error) {
		console.error('Error uploading file:', error);
		return json({ error: 'Failed to upload file' }, { status: 500 });
	}
};