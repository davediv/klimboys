export interface InventoryItem {
	variantId: string;
	productId: string;
	productName: string;
	size: string;
	volumeMl: number;
	stockQuantity: number;
	productActive: boolean;
}

export interface InventoryList {
	items: InventoryItem[];
	page: number;
	totalItems: number;
	totalPages: number;
	search: string;
	lowOnly: boolean;
	lowStockThreshold: number;
}
