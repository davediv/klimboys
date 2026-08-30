export interface DashboardPeriodSummary {
	revenue: number;
	orders: number;
}

export interface DashboardTransaction {
	transactionCode: string;
	createdAt: string;
	itemQuantity: number;
	total: number;
	status: string;
}

export interface DashboardLowStockItem {
	variantId: string;
	name: string;
	size: string;
	stockQuantity: number;
}

export interface DashboardBestSeller {
	name: string;
	quantity: number;
}

export interface DashboardSummary {
	today: DashboardPeriodSummary;
	yesterday: DashboardPeriodSummary;
	activeProducts: number;
	lowStockThreshold: number;
	lowStockCount: number;
	lowStockItems: DashboardLowStockItem[];
	recentTransactions: DashboardTransaction[];
	bestSeller: DashboardBestSeller | null;
	generatedAt: string;
}
