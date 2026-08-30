import { and, asc, eq, like, lte, or, sql } from 'drizzle-orm';
import type { InventoryList } from '$lib/inventory';
import { getDb } from '$lib/server/db';
import { products, productVariants } from '$lib/server/db/schema';

export const LOW_STOCK_THRESHOLD = 10;

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
