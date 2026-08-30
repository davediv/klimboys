export interface PublicCatalogVariant {
	id: string;
	size: string;
	volumeMl: number;
	sellingPrice: number;
	available: boolean;
}

export interface PublicCatalogProduct {
	id: string;
	name: string;
	description: string | null;
	category: string;
	imageUrl: string | null;
	variants: PublicCatalogVariant[];
}

export interface PublicCatalogResult {
	products: PublicCatalogProduct[];
	categories: string[];
}
