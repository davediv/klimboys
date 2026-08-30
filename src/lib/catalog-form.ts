import type { CatalogProduct } from '$lib/product';

export const catalogCategories = ['Classic', 'Fruity', 'Special', 'Seasonal'] as const;
export const catalogSizes = ['S', 'M', 'L', 'XL'] as const;

export interface CatalogVariantFormValue {
	id?: string;
	size: string;
	volumeMl: number;
	costPrice: number;
	sellingPrice: number;
}

export interface CatalogProductFormValue {
	name: string;
	description: string;
	category: string;
	imageUrl: string;
	variants: CatalogVariantFormValue[];
}

export interface CatalogProductPayload {
	name: string;
	description: string | null;
	category: string;
	imageUrl: string | null;
	isActive?: boolean;
	variants: Array<{
		id?: string;
		size: string;
		volumeMl: number;
		costPrice: number;
		sellingPrice: number;
	}>;
}

export function createEmptyCatalogForm(): CatalogProductFormValue {
	return {
		name: '',
		description: '',
		category: catalogCategories[0],
		imageUrl: '',
		variants: [{ size: catalogSizes[0], volumeMl: 250, costPrice: 0, sellingPrice: 0 }]
	};
}

export function createCatalogForm(product: CatalogProduct): CatalogProductFormValue {
	return {
		name: product.name,
		description: product.description ?? '',
		category: product.category,
		imageUrl: product.imageUrl ?? '',
		variants: product.variants.map((variant) => ({
			id: variant.id,
			size: variant.size,
			volumeMl: variant.volumeMl,
			costPrice: variant.costPrice / 100,
			sellingPrice: variant.sellingPrice / 100
		}))
	};
}

export function validateCatalogForm(value: CatalogProductFormValue): string | null {
	if (!value.name.trim()) return 'Product name is required.';
	if (!value.category.trim()) return 'Product category is required.';
	if (value.variants.length === 0) return 'At least one variant is required.';
	if (value.variants.length > 20) return 'A product cannot contain more than 20 variants.';

	const sizes = new Set<string>();
	for (const variant of value.variants) {
		if (!variant.size.trim()) return 'Every variant needs a size.';
		if (sizes.has(variant.size)) return 'Variant sizes must be unique.';
		sizes.add(variant.size);
		if (!Number.isInteger(variant.volumeMl) || variant.volumeMl <= 0) {
			return `Size ${variant.size} needs a positive whole-number volume.`;
		}
		if (!Number.isFinite(variant.costPrice) || variant.costPrice < 0) {
			return `Size ${variant.size} needs a valid non-negative cost price.`;
		}
		if (!Number.isFinite(variant.sellingPrice) || variant.sellingPrice < 0) {
			return `Size ${variant.size} needs a valid non-negative selling price.`;
		}
	}

	return null;
}

export function toCatalogPayload(
	value: CatalogProductFormValue,
	includeActiveDefault = false
): CatalogProductPayload {
	return {
		name: value.name.trim(),
		description: value.description.trim() || null,
		category: value.category.trim(),
		imageUrl: value.imageUrl.trim() || null,
		...(includeActiveDefault ? { isActive: true } : {}),
		variants: value.variants.map((variant) => ({
			id: variant.id,
			size: variant.size,
			volumeMl: variant.volumeMl,
			costPrice: Math.round(variant.costPrice * 100),
			sellingPrice: Math.round(variant.sellingPrice * 100)
		}))
	};
}
