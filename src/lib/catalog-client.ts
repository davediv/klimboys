import type { CatalogProduct } from '$lib/product';
import type { CatalogProductPayload } from '$lib/catalog-form';

interface ApiErrorResponse {
	error?: string;
}

interface ProductMutationResponse {
	success: boolean;
	data?: CatalogProduct;
}

interface ImageMutationResponse {
	success: boolean;
	data?: { image?: { url?: string } };
}

async function responseError(response: Response, fallback: string): Promise<Error> {
	try {
		const result = (await response.json()) as ApiErrorResponse;
		return new Error(result.error || fallback);
	} catch {
		return new Error(fallback);
	}
}

export async function saveCatalogProduct(
	payload: CatalogProductPayload,
	productId?: string
): Promise<CatalogProduct> {
	const response = await fetch(productId ? `/api/products/${productId}` : '/api/products', {
		method: productId ? 'PUT' : 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!response.ok) {
		throw await responseError(
			response,
			productId ? 'Failed to update product.' : 'Failed to add product.'
		);
	}
	const result = (await response.json()) as ProductMutationResponse;
	if (!result.success || !result.data) throw new Error('The product response was incomplete.');
	return result.data;
}

export async function uploadCatalogImage(productId: string, file: File): Promise<string> {
	const body = new FormData();
	body.append('file', file);
	const response = await fetch(`/api/products/${productId}/image`, { method: 'POST', body });
	if (!response.ok) throw await responseError(response, 'Failed to upload product image.');
	const result = (await response.json()) as ImageMutationResponse;
	const url = result.data?.image?.url;
	if (!result.success || !url) throw new Error('The image response was incomplete.');
	return url;
}

export async function archiveCatalogProduct(productId: string): Promise<void> {
	const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
	if (!response.ok) throw await responseError(response, 'Failed to archive product.');
}

export async function restoreCatalogProduct(productId: string): Promise<CatalogProduct> {
	const response = await fetch(`/api/products/${productId}`, {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ isActive: true })
	});
	if (!response.ok) throw await responseError(response, 'Failed to restore product.');
	const result = (await response.json()) as ProductMutationResponse;
	if (!result.success || !result.data) throw new Error('The product response was incomplete.');
	return result.data;
}
