export interface CatalogProductVariant {
	id: string;
	size: string;
	volumeMl: number;
	costPrice: number;
	sellingPrice: number;
	stockQuantity: number;
}

export interface CatalogProduct {
	id: string;
	name: string;
	description: string | null;
	category: string;
	imageUrl: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	variants: CatalogProductVariant[];
}

export interface ProductListResponse {
	success: boolean;
	data?: {
		products?: CatalogProduct[];
	};
}
