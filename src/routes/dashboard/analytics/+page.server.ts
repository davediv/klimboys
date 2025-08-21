import { createDB } from '$lib/server/db';
import { transaction, product, transactionItem } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/rbac';
import type { PageServerLoad } from './$types';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	requireAuth(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);

	// Get date range from query params or default to last 30 days
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - 29); // 30 days including today
	startDate.setHours(0, 0, 0, 0);
	endDate.setHours(23, 59, 59, 999);

	// Channel performance over time (daily breakdown)
	const channelDailyPerformance = await db
		.select({
			date: sql<string>`strftime('%Y-%m-%d', ${transaction.createdAt} / 1000, 'unixepoch')`,
			channel: transaction.channel,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			transactions: sql<number>`count(*)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, startDate), lte(transaction.createdAt, endDate)))
		.groupBy(
			sql`strftime('%Y-%m-%d', ${transaction.createdAt} / 1000, 'unixepoch')`,
			transaction.channel
		)
		.orderBy(
			sql`strftime('%Y-%m-%d', ${transaction.createdAt} / 1000, 'unixepoch')`,
			transaction.channel
		);

	// Overall channel summary
	const channelSummary = await db
		.select({
			channel: transaction.channel,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			transactions: sql<number>`count(*)`,
			avgOrderValue: sql<number>`coalesce(avg(${transaction.totalAmount}), 0)`,
			minOrder: sql<number>`coalesce(min(${transaction.totalAmount}), 0)`,
			maxOrder: sql<number>`coalesce(max(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, startDate), lte(transaction.createdAt, endDate)))
		.groupBy(transaction.channel)
		.orderBy(desc(sql`sum(${transaction.totalAmount})`));

	// Top products by channel
	const topProductsByChannel = await db
		.select({
			channel: transaction.channel,
			productId: product.id,
			productTitle: product.title,
			quantity: sql<number>`sum(${transactionItem.quantity})`,
			revenue: sql<number>`sum(${transactionItem.subtotal})`
		})
		.from(transactionItem)
		.innerJoin(transaction, eq(transactionItem.transactionId, transaction.id))
		.innerJoin(product, eq(transactionItem.productId, product.id))
		.where(and(gte(transaction.createdAt, startDate), lte(transaction.createdAt, endDate)))
		.groupBy(transaction.channel, product.id, product.title)
		.orderBy(transaction.channel, desc(sql`sum(${transactionItem.subtotal})`))
		.limit(50); // Get top products per channel, will filter in frontend

	// Hourly distribution by channel
	const hourlyDistribution = await db
		.select({
			hour: sql<number>`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`,
			channel: transaction.channel,
			transactions: sql<number>`count(*)`,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, startDate), lte(transaction.createdAt, endDate)))
		.groupBy(sql`strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch')`, transaction.channel)
		.orderBy(sql`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`);

	// Payment method distribution by channel
	const paymentMethodByChannel = await db
		.select({
			channel: transaction.channel,
			paymentMethod: transaction.paymentMethod,
			transactions: sql<number>`count(*)`,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, startDate), lte(transaction.createdAt, endDate)))
		.groupBy(transaction.channel, transaction.paymentMethod)
		.orderBy(transaction.channel, desc(sql`count(*)`));

	return {
		dateRange: {
			start: startDate,
			end: endDate
		},
		channelDailyPerformance,
		channelSummary,
		topProductsByChannel,
		hourlyDistribution,
		paymentMethodByChannel
	};
};
