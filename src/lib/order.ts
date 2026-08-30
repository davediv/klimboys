export interface OrderSummary {
	id: string;
	transactionCode: string;
	createdAt: string;
	channel: string;
	paymentMethod: string;
	itemQuantity: number;
	total: number;
	status: string;
	cashierName: string;
}

export interface OrderList {
	orders: OrderSummary[];
	page: number;
	totalItems: number;
	totalPages: number;
	scope: 'all' | 'own';
}
