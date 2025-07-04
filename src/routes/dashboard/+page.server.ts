import { createDB } from '$lib/server/db';
import { transaction, inventory, product, transactionItem } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/rbac';
import type { PageServerLoad } from './$types';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAuth(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);
	const now = new Date();

	// Get date range for today
	const startOfDay = new Date(now);
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date(now);
	endOfDay.setHours(23, 59, 59, 999);

	// Get date range for this month
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	endOfMonth.setHours(23, 59, 59, 999);

	// Get today's transactions count
	const todayTransactions = await db
		.select({ count: sql<number>`count(*)` })
		.from(transaction)
		.where(and(gte(transaction.createdAt, startOfDay), lte(transaction.createdAt, endOfDay)));

	// Get today's revenue
	const todayRevenue = await db
		.select({ total: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)` })
		.from(transaction)
		.where(and(gte(transaction.createdAt, startOfDay), lte(transaction.createdAt, endOfDay)));

	// Get month's revenue
	const monthRevenue = await db
		.select({ total: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)` })
		.from(transaction)
		.where(and(gte(transaction.createdAt, startOfMonth), lte(transaction.createdAt, endOfMonth)));

	// Get low stock items (current stock <= minimum stock)
	const lowStockItems = await db.query.inventory.findMany({
		where: sql`${inventory.currentStock} <= ${inventory.minimumStock}`,
		with: {
			recipes: {
				with: {
					product: true
				}
			}
		},
		orderBy: [sql`${inventory.currentStock} / ${inventory.minimumStock}`, inventory.name]
	});

	// Get out of stock items
	const outOfStockCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(inventory)
		.where(eq(inventory.currentStock, 0));

	// Get recent transactions
	const recentTransactions = await db.query.transaction.findMany({
		with: {
			cashier: true,
			items: {
				with: {
					product: true
				}
			}
		},
		orderBy: [desc(transaction.createdAt)],
		limit: 5
	});

	// Get best selling products today
	const bestSellingToday = await db
		.select({
			productId: product.id,
			title: product.title,
			totalQuantity: sql<number>`sum(${transactionItem.quantity})`,
			totalRevenue: sql<number>`sum(${transactionItem.subtotal})`
		})
		.from(transactionItem)
		.innerJoin(transaction, eq(transactionItem.transactionId, transaction.id))
		.innerJoin(product, eq(transactionItem.productId, product.id))
		.where(and(gte(transaction.createdAt, startOfDay), lte(transaction.createdAt, endOfDay)))
		.groupBy(product.id, product.title)
		.orderBy(desc(sql`sum(${transactionItem.quantity})`))
		.limit(5);

	// Get daily sales data for the last 7 days
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 days ago + today = 7 days
	sevenDaysAgo.setHours(0, 0, 0, 0);

	const dailySalesData = await db
		.select({
			date: sql<string>`strftime('%Y-%m-%d', ${transaction.createdAt} / 1000, 'unixepoch')`,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			transactions: sql<number>`count(*)`
		})
		.from(transaction)
		.where(gte(transaction.createdAt, sevenDaysAgo))
		.groupBy(sql`strftime('%Y-%m-%d', ${transaction.createdAt} / 1000, 'unixepoch')`)
		.orderBy(sql`strftime('%Y-%m-%d', ${transaction.createdAt} / 1000, 'unixepoch')`);

	// Fill in missing dates with zero values
	const salesByDate = new Map(dailySalesData.map(d => [d.date, d]));
	const completeData = [];
	
	for (let i = 0; i < 7; i++) {
		const date = new Date(sevenDaysAgo);
		date.setDate(date.getDate() + i);
		const dateStr = date.toISOString().split('T')[0];
		
		const dayData = salesByDate.get(dateStr);
		completeData.push({
			date: dateStr,
			revenue: dayData?.revenue || 0,
			transactions: dayData?.transactions || 0
		});
	}

	// Get channel performance metrics for this month
	const channelPerformance = await db
		.select({
			channel: transaction.channel,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			transactions: sql<number>`count(*)`,
			avgOrderValue: sql<number>`coalesce(avg(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, startOfMonth), lte(transaction.createdAt, endOfMonth)))
		.groupBy(transaction.channel)
		.orderBy(desc(sql`sum(${transaction.totalAmount})`));

	// Get channel performance for today
	const todayChannelPerformance = await db
		.select({
			channel: transaction.channel,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			transactions: sql<number>`count(*)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, startOfDay), lte(transaction.createdAt, endOfDay)))
		.groupBy(transaction.channel)
		.orderBy(desc(sql`sum(${transaction.totalAmount})`));

	return {
		stats: {
			todayTransactions: todayTransactions[0]?.count || 0,
			todayRevenue: todayRevenue[0]?.total || 0,
			monthRevenue: monthRevenue[0]?.total || 0,
			lowStockCount: lowStockItems.length,
			outOfStockCount: outOfStockCount[0]?.count || 0
		},
		lowStockItems,
		recentTransactions,
		bestSellingToday,
		dailySalesData: completeData,
		channelPerformance,
		todayChannelPerformance
	};
};
