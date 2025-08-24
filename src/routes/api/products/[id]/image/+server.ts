import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hasRole } from '$lib/server/auth';
import { nanoid } from 'nanoid';

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
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

		const db = getDb();
		const productId = params.id;

		// Check if product exists
		const existingProduct = await db
			.select({ id: products.id, imageUrl: products.imageUrl })
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (existingProduct.length === 0) {
			return json({ error: 'Product not found' }, { status: 404 });
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

		// Delete old image if exists
		const oldImageUrl = existingProduct[0].imageUrl;
		if (oldImageUrl && oldImageUrl.includes('products/')) {
			try {
				// Extract filename from URL
				const oldFilename = oldImageUrl.split('/').pop();
				if (oldFilename) {
					await platform.env.BUCKET.delete(`products/${oldFilename}`);
				}
			} catch (err) {
				console.error('Error deleting old image:', err);
				// Continue even if old image deletion fails
			}
		}

		// Generate unique filename
		const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
		const uniqueFilename = `products/${productId}-${nanoid()}.${fileExtension}`;

		// Upload to R2
		const arrayBuffer = await file.arrayBuffer();
		const r2Object = await platform.env.BUCKET.put(uniqueFilename, arrayBuffer, {
			httpMetadata: {
				contentType: file.type
			},
			customMetadata: {
				productId: productId,
				uploadedBy: locals.user.id,
				originalName: file.name,
				uploadedAt: new Date().toISOString()
			}
		});

		if (!r2Object) {
			throw new Error('Failed to upload file to R2');
		}

		// Get the public URL for the uploaded file
		// Note: This URL format may need adjustment based on your R2 configuration
		const publicUrl = `https://pub-auto.r2.dev/${uniqueFilename}`;

		// Alternative: If using a custom domain
		// const publicUrl = `https://your-cdn-domain.com/${uniqueFilename}`;

		// Update product with new image URL
		await db
			.update(products)
			.set({
				imageUrl: publicUrl,
				updatedAt: new Date()
			})
			.where(eq(products.id, productId));

		// Fetch updated product
		const updatedProduct = await db
			.select({
				id: products.id,
				name: products.name,
				imageUrl: products.imageUrl,
				updatedAt: products.updatedAt
			})
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		return json({
			success: true,
			data: {
				product: updatedProduct[0],
				image: {
					url: publicUrl,
					filename: uniqueFilename,
					size: file.size,
					type: file.type,
					originalName: file.name
				}
			}
		});
	} catch (error) {
		console.error('Error uploading product image:', error);
		return json(
			{
				success: false,
				error: 'Failed to upload product image',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
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

		const db = getDb();
		const productId = params.id;

		// Get product to find current image
		const existingProduct = await db
			.select({ id: products.id, imageUrl: products.imageUrl })
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (existingProduct.length === 0) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		const imageUrl = existingProduct[0].imageUrl;
		if (!imageUrl) {
			return json({ error: 'Product has no image' }, { status: 404 });
		}

		// Delete from R2
		if (imageUrl.includes('products/')) {
			try {
				// Extract filename from URL
				const filename = imageUrl.split('/').pop();
				if (filename) {
					await platform.env.BUCKET.delete(`products/${filename}`);
				}
			} catch (err) {
				console.error('Error deleting image from R2:', err);
			}
		}

		// Update product to remove image URL
		await db
			.update(products)
			.set({
				imageUrl: null,
				updatedAt: new Date()
			})
			.where(eq(products.id, productId));

		return json({
			success: true,
			message: 'Product image deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting product image:', error);
		return json(
			{
				success: false,
				error: 'Failed to delete product image',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};
