import { and, asc, desc, eq, gte, lt, lte, sql } from 'drizzle-orm';
import type { DashboardPeriodSummary, DashboardSummary } from '$lib/dashboard';
import { getDb } from '$lib/server/db';
import { products, productVariants, transactionItems, transactions } from '$lib/server/db/schema';
import { LOW_STOCK_THRESHOLD } from '$lib/server/inventory';

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
function jakartaDayStart(date: Date): Date {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Jakarta',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);
	const values = Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
	return new Date(Date.UTC(values.year, values.month - 1, values.day) - JAKARTA_OFFSET_MS);
}

function periodSummary(
	row: { revenue: number; orders: number } | undefined
): DashboardPeriodSummary {
	return {
		revenue: Number(row?.revenue ?? 0),
		orders: Number(row?.orders ?? 0)
	};
}

export async function getDashboardSummary(now = new Date()): Promise<DashboardSummary> {
	const db = getDb();
	const todayStart = jakartaDayStart(now);
	const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
	const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
	const soldQuantity = sql<number>`sum(${transactionItems.quantity})`;

	const completedBetween = (start: Date, end: Date) =>
		and(
			eq(transactions.status, 'completed'),
			gte(transactions.createdAt, start),
			lt(transactions.createdAt, end)
		);

	const [
		todayRows,
		yesterdayRows,
		activeProductRows,
		lowStockCountRows,
		lowStockRows,
		recentTransactionRows,
		bestSellerRows
	] = await Promise.all([
		db
			.select({
				revenue: sql<number>`coalesce(sum(${transactions.total}), 0)`,
				orders: sql<number>`count(*)`
			})
			.from(transactions)
			.where(completedBetween(todayStart, tomorrowStart)),
		db
			.select({
				revenue: sql<number>`coalesce(sum(${transactions.total}), 0)`,
				orders: sql<number>`count(*)`
			})
			.from(transactions)
			.where(completedBetween(yesterdayStart, todayStart)),
		db
			.select({ count: sql<number>`count(*)` })
			.from(products)
			.where(eq(products.isActive, true)),
		db
			.select({ count: sql<number>`count(*)` })
			.from(productVariants)
			.innerJoin(products, eq(products.id, productVariants.productId))
			.where(
				and(eq(products.isActive, true), lte(productVariants.stockQuantity, LOW_STOCK_THRESHOLD))
			),
		db
			.select({
				variantId: productVariants.id,
				name: products.name,
				size: productVariants.size,
				stockQuantity: productVariants.stockQuantity
			})
			.from(productVariants)
			.innerJoin(products, eq(products.id, productVariants.productId))
			.where(
				and(eq(products.isActive, true), lte(productVariants.stockQuantity, LOW_STOCK_THRESHOLD))
			)
			.orderBy(asc(productVariants.stockQuantity), asc(products.name))
			.limit(5),
		db
			.select({
				transactionCode: transactions.transactionCode,
				createdAt: transactions.createdAt,
				itemQuantity: sql<number>`coalesce(sum(${transactionItems.quantity}), 0)`,
				total: transactions.total,
				status: transactions.status
			})
			.from(transactions)
			.leftJoin(transactionItems, eq(transactionItems.transactionId, transactions.id))
			.groupBy(transactions.id)
			.orderBy(desc(transactions.createdAt))
			.limit(5),
		db
			.select({ name: products.name, quantity: soldQuantity })
			.from(transactionItems)
			.innerJoin(transactions, eq(transactions.id, transactionItems.transactionId))
			.innerJoin(productVariants, eq(productVariants.id, transactionItems.productVariantId))
			.innerJoin(products, eq(products.id, productVariants.productId))
			.where(completedBetween(todayStart, tomorrowStart))
			.groupBy(products.id)
			.orderBy(desc(soldQuantity))
			.limit(1)
	]);

	return {
		today: periodSummary(todayRows[0]),
		yesterday: periodSummary(yesterdayRows[0]),
		activeProducts: Number(activeProductRows[0]?.count ?? 0),
		lowStockThreshold: LOW_STOCK_THRESHOLD,
		lowStockCount: Number(lowStockCountRows[0]?.count ?? 0),
		lowStockItems: lowStockRows,
		recentTransactions: recentTransactionRows.map((transaction) => ({
			...transaction,
			itemQuantity: Number(transaction.itemQuantity),
			createdAt: transaction.createdAt.toISOString()
		})),
		bestSeller: bestSellerRows[0]
			? { name: bestSellerRows[0].name, quantity: Number(bestSellerRows[0].quantity) }
			: null,
		generatedAt: now.toISOString()
	};
}
