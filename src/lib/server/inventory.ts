import { and, asc, desc, eq, like, lte, ne, or, sql } from 'drizzle-orm';
import {
	inventoryAdjustmentTypes,
	type InventoryAdjustment,
	type InventoryAdjustmentRequest,
	type InventoryAdjustmentType,
	type InventoryList
} from '$lib/inventory';
import { getDb } from '$lib/server/db';
import { inventoryLogs, products, productVariants, user } from '$lib/server/db/schema';
import { nanoid } from 'nanoid';

export const LOW_STOCK_THRESHOLD = 10;
const MAX_ADJUSTMENT_QUANTITY = 100_000;
const MAX_REASON_LENGTH = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type InventoryAdjustmentErrorCode = 'INVALID_ADJUSTMENT' | 'INVENTORY_CHANGED';

export class InventoryAdjustmentError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code: InventoryAdjustmentErrorCode
	) {
		super(message);
		this.name = 'InventoryAdjustmentError';
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isInventoryAdjustmentType(value: unknown): value is InventoryAdjustmentType {
	return inventoryAdjustmentTypes.some((type) => type === value);
}

export function parseInventoryAdjustment(value: unknown): InventoryAdjustmentRequest {
	if (!isRecord(value)) {
		throw new InventoryAdjustmentError(
			'Invalid inventory adjustment request.',
			400,
			'INVALID_ADJUSTMENT'
		);
	}
	if (typeof value.idempotencyKey !== 'string' || !UUID_PATTERN.test(value.idempotencyKey)) {
		throw new InventoryAdjustmentError(
			'A valid adjustment key is required.',
			400,
			'INVALID_ADJUSTMENT'
		);
	}
	if (typeof value.variantId !== 'string' || value.variantId.length === 0) {
		throw new InventoryAdjustmentError('Select a product variant.', 400, 'INVALID_ADJUSTMENT');
	}
	if (!isInventoryAdjustmentType(value.type)) {
		throw new InventoryAdjustmentError(
			'Select restock, waste, or correction.',
			400,
			'INVALID_ADJUSTMENT'
		);
	}
	if (
		!Number.isInteger(value.quantity) ||
		Number(value.quantity) < (value.type === 'correction' ? 0 : 1) ||
		Number(value.quantity) > MAX_ADJUSTMENT_QUANTITY
	) {
		throw new InventoryAdjustmentError(
			value.type === 'correction'
				? `The corrected quantity must be between 0 and ${MAX_ADJUSTMENT_QUANTITY}.`
				: `The movement quantity must be between 1 and ${MAX_ADJUSTMENT_QUANTITY}.`,
			400,
			'INVALID_ADJUSTMENT'
		);
	}
	if (
		typeof value.reason !== 'string' ||
		value.reason.trim().length === 0 ||
		value.reason.length > MAX_REASON_LENGTH
	) {
		throw new InventoryAdjustmentError(
			`A reason between 1 and ${MAX_REASON_LENGTH} characters is required.`,
			400,
			'INVALID_ADJUSTMENT'
		);
	}

	return {
		idempotencyKey: value.idempotencyKey,
		variantId: value.variantId.slice(0, 128),
		type: value.type,
		quantity: Number(value.quantity),
		reason: value.reason.trim()
	};
}

interface ListInventoryOptions {
	page: number;
	search?: string;
	lowOnly?: boolean;
	limit?: number;
}

export async function listInventory({
	page,
	search = '',
	lowOnly = false,
	limit = 25
}: ListInventoryOptions): Promise<InventoryList> {
	const db = getDb();
	const validPage = Math.max(1, page);
	const normalizedSearch = search.trim().slice(0, 100);
	const conditions = [eq(products.isActive, true), eq(productVariants.isActive, true)];

	if (normalizedSearch) {
		const pattern = `%${normalizedSearch}%`;
		conditions.push(or(like(products.name, pattern), like(productVariants.size, pattern))!);
	}
	if (lowOnly) conditions.push(lte(productVariants.stockQuantity, LOW_STOCK_THRESHOLD));

	const whereClause = and(...conditions);
	const offset = (validPage - 1) * limit;
	const [rows, countRows] = await Promise.all([
		db
			.select({
				variantId: productVariants.id,
				productId: products.id,
				productName: products.name,
				size: productVariants.size,
				volumeMl: productVariants.volumeMl,
				stockQuantity: productVariants.stockQuantity,
				productActive: products.isActive
			})
			.from(productVariants)
			.innerJoin(products, eq(products.id, productVariants.productId))
			.where(whereClause)
			.orderBy(asc(products.name), asc(productVariants.volumeMl))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(productVariants)
			.innerJoin(products, eq(products.id, productVariants.productId))
			.where(whereClause)
	]);

	const totalItems = Number(countRows[0]?.count ?? 0);
	return {
		items: rows,
		page: validPage,
		totalItems,
		totalPages: Math.max(1, Math.ceil(totalItems / limit)),
		search: normalizedSearch,
		lowOnly,
		lowStockThreshold: LOW_STOCK_THRESHOLD
	};
}

interface StoredAdjustment {
	id: string;
	variantId: string;
	userId: string;
	productName: string;
	size: string;
	type: string;
	quantityChange: number;
	quantityAfter: number;
	reason: string | null;
	userName: string | null;
	userEmail: string;
	createdAt: Date;
}

function serializeAdjustment(row: StoredAdjustment, alreadyProcessed = false): InventoryAdjustment {
	return {
		id: row.id,
		variantId: row.variantId,
		productName: row.productName,
		size: row.size,
		type: row.type as InventoryAdjustmentType,
		quantityChange: row.quantityChange,
		quantityAfter: row.quantityAfter,
		reason: row.reason ?? '',
		performedBy: row.userName || row.userEmail,
		createdAt: row.createdAt.toISOString(),
		alreadyProcessed
	};
}

function adjustmentSelection() {
	return {
		id: inventoryLogs.id,
		variantId: inventoryLogs.productVariantId,
		userId: inventoryLogs.userId,
		productName: products.name,
		size: productVariants.size,
		type: inventoryLogs.type,
		quantityChange: inventoryLogs.quantityChange,
		quantityAfter: inventoryLogs.quantityAfter,
		reason: inventoryLogs.reason,
		userName: user.name,
		userEmail: user.email,
		createdAt: inventoryLogs.createdAt
	};
}

async function findAdjustmentByKey(idempotencyKey: string): Promise<StoredAdjustment | null> {
	const db = getDb();
	const [row] = await db
		.select(adjustmentSelection())
		.from(inventoryLogs)
		.innerJoin(productVariants, eq(productVariants.id, inventoryLogs.productVariantId))
		.innerJoin(products, eq(products.id, productVariants.productId))
		.innerJoin(user, eq(user.id, inventoryLogs.userId))
		.where(eq(inventoryLogs.idempotencyKey, idempotencyKey))
		.limit(1);

	return row ?? null;
}

function matchesAdjustmentRequest(
	row: StoredAdjustment,
	request: InventoryAdjustmentRequest,
	userId: string
): boolean {
	if (
		row.userId !== userId ||
		row.variantId !== request.variantId ||
		row.type !== request.type ||
		row.reason !== request.reason
	) {
		return false;
	}

	if (request.type === 'restock') return row.quantityChange === request.quantity;
	if (request.type === 'waste') return row.quantityChange === -request.quantity;
	return row.quantityAfter === request.quantity;
}

function duplicateResult(
	row: StoredAdjustment,
	request: InventoryAdjustmentRequest,
	userId: string
): InventoryAdjustment {
	if (!matchesAdjustmentRequest(row, request, userId)) {
		throw new InventoryAdjustmentError(
			'This adjustment key was already used for a different request.',
			409,
			'INVENTORY_CHANGED'
		);
	}
	return serializeAdjustment(row, true);
}

export async function createInventoryAdjustment(
	request: InventoryAdjustmentRequest,
	userId: string
): Promise<InventoryAdjustment> {
	const duplicate = await findAdjustmentByKey(request.idempotencyKey);
	if (duplicate) return duplicateResult(duplicate, request, userId);

	const db = getDb();
	const [variant] = await db
		.select({
			stockQuantity: productVariants.stockQuantity
		})
		.from(productVariants)
		.innerJoin(products, eq(products.id, productVariants.productId))
		.where(
			and(
				eq(productVariants.id, request.variantId),
				eq(productVariants.isActive, true),
				eq(products.isActive, true)
			)
		)
		.limit(1);

	if (!variant) {
		throw new InventoryAdjustmentError(
			'This product variant is no longer available.',
			409,
			'INVENTORY_CHANGED'
		);
	}

	const quantityChange =
		request.type === 'restock'
			? request.quantity
			: request.type === 'waste'
				? -request.quantity
				: request.quantity - variant.stockQuantity;
	const quantityAfter = variant.stockQuantity + quantityChange;

	if (quantityChange === 0) {
		throw new InventoryAdjustmentError(
			'The corrected quantity already matches current stock.',
			400,
			'INVALID_ADJUSTMENT'
		);
	}
	if (quantityAfter < 0) {
		throw new InventoryAdjustmentError(
			`Only ${variant.stockQuantity} units are available to remove.`,
			409,
			'INVENTORY_CHANGED'
		);
	}

	try {
		await db.insert(inventoryLogs).values({
			id: nanoid(),
			productVariantId: request.variantId,
			userId,
			type: request.type,
			idempotencyKey: request.idempotencyKey,
			quantityChange,
			quantityAfter,
			reason: request.reason,
			createdAt: new Date()
		});
	} catch (error) {
		const racedDuplicate = await findAdjustmentByKey(request.idempotencyKey);
		if (racedDuplicate) return duplicateResult(racedDuplicate, request, userId);

		const message = error instanceof Error ? error.message : String(error);
		if (
			message.includes('INVENTORY_QUANTITY_MISMATCH') ||
			message.includes('INVENTORY_NEGATIVE_STOCK') ||
			message.includes('INVENTORY_VARIANT_UNAVAILABLE')
		) {
			throw new InventoryAdjustmentError(
				'Inventory changed while this adjustment was being saved. Review the latest quantity and retry.',
				409,
				'INVENTORY_CHANGED'
			);
		}
		throw error;
	}

	const created = await findAdjustmentByKey(request.idempotencyKey);
	if (!created) throw new Error('The inventory adjustment was saved but could not be read back.');
	return serializeAdjustment(created);
}

export async function listRecentInventoryAdjustments(limit = 20): Promise<InventoryAdjustment[]> {
	const db = getDb();
	const rows = await db
		.select(adjustmentSelection())
		.from(inventoryLogs)
		.innerJoin(productVariants, eq(productVariants.id, inventoryLogs.productVariantId))
		.innerJoin(products, eq(products.id, productVariants.productId))
		.innerJoin(user, eq(user.id, inventoryLogs.userId))
		.where(ne(inventoryLogs.type, 'sale'))
		.orderBy(desc(inventoryLogs.createdAt))
		.limit(Math.min(100, Math.max(1, limit)));

	return rows
		.filter((row) => isInventoryAdjustmentType(row.type))
		.map((row) => serializeAdjustment(row));
}
