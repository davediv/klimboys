export interface PosProductVariant {
	id: string;
	size: string;
	volumeMl: number;
	sellingPrice: number;
	stockQuantity: number;
}

export interface PosProduct {
	id: string;
	name: string;
	description: string | null;
	category: string;
	imageUrl: string | null;
	variants: PosProductVariant[];
}

export interface CatalogProductVariant extends PosProductVariant {
	costPrice: number;
}

export interface CatalogProduct extends PosProduct {
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

export interface PosProductListResponse {
	success: boolean;
	data?: {
		products?: PosProduct[];
	};
}
