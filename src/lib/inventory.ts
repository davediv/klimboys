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

export const inventoryAdjustmentTypes = ['restock', 'waste', 'correction'] as const;

export type InventoryAdjustmentType = (typeof inventoryAdjustmentTypes)[number];

export interface InventoryAdjustmentRequest {
	idempotencyKey: string;
	variantId: string;
	type: InventoryAdjustmentType;
	quantity: number;
	reason: string;
}

export interface InventoryAdjustment {
	id: string;
	variantId: string;
	productName: string;
	size: string;
	type: InventoryAdjustmentType;
	quantityChange: number;
	quantityAfter: number;
	reason: string;
	performedBy: string;
	createdAt: string;
	alreadyProcessed?: boolean;
}

export interface InventoryAdjustmentResponse {
	success: boolean;
	data?: InventoryAdjustment;
	error?: string;
}
