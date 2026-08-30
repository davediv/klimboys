export const transactionChannels = ['Store', 'GrabFood', 'GoFood', 'ShopeeFood'] as const;
export const transactionPaymentMethods = [
	'Cash',
	'QRIS',
	'Transfer',
	'Debit',
	'Credit',
	'E-Wallet'
] as const;

export type TransactionChannel = (typeof transactionChannels)[number];
export type TransactionPaymentMethod = (typeof transactionPaymentMethods)[number];

export interface TransactionRequestItem {
	variantId: string;
	quantity: number;
}

export interface CreateTransactionRequest {
	idempotencyKey: string;
	channel: TransactionChannel;
	paymentMethod: TransactionPaymentMethod;
	notes: string;
	items: TransactionRequestItem[];
}

export interface TransactionReceipt {
	id: string;
	transactionCode: string;
	subtotal: number;
	total: number;
	itemQuantity: number;
	createdAt: string;
	alreadyProcessed: boolean;
}

export interface CreateTransactionResponse {
	success: boolean;
	data?: TransactionReceipt;
	error?: string;
}
