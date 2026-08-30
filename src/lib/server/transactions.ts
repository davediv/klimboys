import { and, eq, inArray, sql } from 'drizzle-orm';
import { getD1Database, getDb } from '$lib/server/db';
import { products, productVariants, transactionItems, transactions } from '$lib/server/db/schema';
import {
	transactionChannels,
	transactionPaymentMethods,
	type CreateTransactionRequest,
	type TransactionChannel,
	type TransactionPaymentMethod,
	type TransactionReceipt,
	type TransactionRequestItem
} from '$lib/transaction';

const MAX_ITEMS_PER_TRANSACTION = 50;
const MAX_QUANTITY_PER_VARIANT = 100;
const MAX_NOTES_LENGTH = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TransactionErrorCode = 'INVALID_TRANSACTION' | 'ITEM_UNAVAILABLE';

export class TransactionError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code: TransactionErrorCode
	) {
		super(message);
		this.name = 'TransactionError';
	}
}

interface CreateTransactionResult {
	receipt: TransactionReceipt;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isTransactionChannel(value: unknown): value is TransactionChannel {
	return typeof value === 'string' && transactionChannels.some((channel) => channel === value);
}

function isTransactionPaymentMethod(value: unknown): value is TransactionPaymentMethod {
	return typeof value === 'string' && transactionPaymentMethods.some((method) => method === value);
}

function parseItems(value: unknown): TransactionRequestItem[] {
	if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS_PER_TRANSACTION) {
		throw new TransactionError(
			`A transaction must contain between 1 and ${MAX_ITEMS_PER_TRANSACTION} items.`,
			400,
			'INVALID_TRANSACTION'
		);
	}

	const quantities = new Map<string, number>();

	for (const item of value) {
		if (!isRecord(item) || typeof item.variantId !== 'string' || item.variantId.length === 0) {
			throw new TransactionError(
				'Every item must identify a product variant.',
				400,
				'INVALID_TRANSACTION'
			);
		}

		if (!Number.isInteger(item.quantity) || Number(item.quantity) < 1) {
			throw new TransactionError(
				'Every item quantity must be a positive integer.',
				400,
				'INVALID_TRANSACTION'
			);
		}

		const variantId = item.variantId.slice(0, 128);
		const quantity = (quantities.get(variantId) ?? 0) + Number(item.quantity);
		if (quantity > MAX_QUANTITY_PER_VARIANT) {
			throw new TransactionError(
				`A single variant cannot exceed ${MAX_QUANTITY_PER_VARIANT} units.`,
				400,
				'INVALID_TRANSACTION'
			);
		}
		quantities.set(variantId, quantity);
	}

	return Array.from(quantities, ([variantId, quantity]) => ({ variantId, quantity }));
}

export function parseTransactionRequest(value: unknown): CreateTransactionRequest {
	if (!isRecord(value)) {
		throw new TransactionError('Invalid transaction request.', 400, 'INVALID_TRANSACTION');
	}

	if (typeof value.idempotencyKey !== 'string' || !UUID_PATTERN.test(value.idempotencyKey)) {
		throw new TransactionError('A valid checkout key is required.', 400, 'INVALID_TRANSACTION');
	}

	if (!isTransactionChannel(value.channel)) {
		throw new TransactionError('Select a supported sales channel.', 400, 'INVALID_TRANSACTION');
	}

	if (!isTransactionPaymentMethod(value.paymentMethod)) {
		throw new TransactionError('Select a supported payment method.', 400, 'INVALID_TRANSACTION');
	}

	if (typeof value.notes !== 'string' || value.notes.length > MAX_NOTES_LENGTH) {
		throw new TransactionError(
			`Order notes must be ${MAX_NOTES_LENGTH} characters or fewer.`,
			400,
			'INVALID_TRANSACTION'
		);
	}

	return {
		idempotencyKey: value.idempotencyKey,
		channel: value.channel,
		paymentMethod: value.paymentMethod,
		notes: value.notes.trim(),
		items: parseItems(value.items)
	};
}

function jakartaDateCode(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Jakarta',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);
	const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	return `${value.year}${value.month}${value.day}`;
}

function createTransactionCode(now: Date): string {
	const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
	return `TRX-${jakartaDateCode(now)}-${suffix}`;
}

async function findReceipt(idempotencyKey: string): Promise<TransactionReceipt | null> {
	const db = getDb();
	const [row] = await db
		.select({
			id: transactions.id,
			transactionCode: transactions.transactionCode,
			subtotal: transactions.subtotal,
			total: transactions.total,
			createdAt: transactions.createdAt,
			itemQuantity: sql<number>`coalesce(sum(${transactionItems.quantity}), 0)`
		})
		.from(transactions)
		.leftJoin(transactionItems, eq(transactionItems.transactionId, transactions.id))
		.where(eq(transactions.idempotencyKey, idempotencyKey))
		.groupBy(transactions.id)
		.limit(1);

	return row
		? {
				...row,
				itemQuantity: Number(row.itemQuantity),
				createdAt: row.createdAt.toISOString(),
				alreadyProcessed: true
			}
		: null;
}

export async function createTransaction(
	request: CreateTransactionRequest,
	userId: string
): Promise<CreateTransactionResult> {
	const duplicateReceipt = await findReceipt(request.idempotencyKey);
	if (duplicateReceipt) return { receipt: duplicateReceipt };

	const db = getDb();
	const variantIds = request.items.map((item) => item.variantId);
	const variantRows = await db
		.select({
			id: productVariants.id,
			productName: products.name,
			size: productVariants.size,
			sellingPrice: productVariants.sellingPrice,
			stockQuantity: productVariants.stockQuantity
		})
		.from(productVariants)
		.innerJoin(products, eq(products.id, productVariants.productId))
		.where(and(inArray(productVariants.id, variantIds), eq(products.isActive, true)));

	const variantsById = new Map(variantRows.map((variant) => [variant.id, variant]));
	const lineItems = request.items.map((item) => {
		const variant = variantsById.get(item.variantId);
		if (!variant) {
			throw new TransactionError(
				'One or more items are no longer available.',
				409,
				'ITEM_UNAVAILABLE'
			);
		}
		if (variant.stockQuantity < item.quantity) {
			throw new TransactionError(
				`${variant.productName} (${variant.size}) has only ${variant.stockQuantity} remaining.`,
				409,
				'ITEM_UNAVAILABLE'
			);
		}

		return {
			id: crypto.randomUUID(),
			variantId: variant.id,
			quantity: item.quantity,
			unitPrice: variant.sellingPrice,
			totalPrice: variant.sellingPrice * item.quantity
		};
	});

	const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
	const now = new Date();
	const transactionId = crypto.randomUUID();
	const transactionCode = createTransactionCode(now);
	const database = getD1Database();
	const statements: D1PreparedStatement[] = [
		database
			.prepare(
				`INSERT INTO transactions
					(id, transaction_code, idempotency_key, user_id, channel, payment_method, subtotal, discount, total, notes, status, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'completed', unixepoch(), unixepoch())`
			)
			.bind(
				transactionId,
				transactionCode,
				request.idempotencyKey,
				userId,
				request.channel,
				request.paymentMethod,
				subtotal,
				subtotal,
				request.notes || null
			),
		...lineItems.map((item) =>
			database
				.prepare(
					`INSERT INTO transaction_items
						(id, transaction_id, product_variant_id, quantity, unit_price, total_price)
					 VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(
					item.id,
					transactionId,
					item.variantId,
					item.quantity,
					item.unitPrice,
					item.totalPrice
				)
		)
	];

	try {
		await database.batch(statements);
	} catch (error) {
		const existingReceipt = await findReceipt(request.idempotencyKey);
		if (existingReceipt) return { receipt: existingReceipt };

		if (error instanceof Error && error.message.includes('TRANSACTION_ITEM_UNAVAILABLE')) {
			throw new TransactionError(
				'Stock or pricing changed during checkout. Review the cart and try again.',
				409,
				'ITEM_UNAVAILABLE'
			);
		}
		throw error;
	}

	return {
		receipt: {
			id: transactionId,
			transactionCode,
			subtotal,
			total: subtotal,
			itemQuantity: lineItems.reduce((sum, item) => sum + item.quantity, 0),
			createdAt: now.toISOString(),
			alreadyProcessed: false
		}
	};
}
