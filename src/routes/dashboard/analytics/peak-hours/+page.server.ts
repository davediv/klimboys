import { createDB } from '$lib/server/db';
import { transaction, transactionItem } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/rbac';
import type { PageServerLoad } from './$types';
import { and, gte, lte, sql, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAuth(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);
	const now = new Date();
	
	// Date ranges
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
	thirtyDaysAgo.setHours(0, 0, 0, 0);
	
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
	sevenDaysAgo.setHours(0, 0, 0, 0);
	
	const endDate = new Date();
	endDate.setHours(23, 59, 59, 999);

	// Get hourly distribution for last 30 days
	const hourlyDistribution = await db
		.select({
			hour: sql<number>`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`,
			dayOfWeek: sql<number>`cast(strftime('%w', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`,
			transactions: sql<number>`count(*)`,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			avgOrderValue: sql<number>`coalesce(avg(${transaction.totalAmount}), 0)`,
			itemsSold: sql<number>`coalesce(sum((SELECT sum(quantity) FROM ${transactionItem} WHERE ${transactionItem.transactionId} = ${transaction.id})), 0)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, thirtyDaysAgo), lte(transaction.createdAt, endDate)))
		.groupBy(
			sql`strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch')`,
			sql`strftime('%w', ${transaction.createdAt} / 1000, 'unixepoch')`
		)
		.orderBy(
			sql`cast(strftime('%w', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`,
			sql`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`
		);

	// Get overall hourly summary (all days combined)
	const hourlySummary = await db
		.select({
			hour: sql<number>`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`,
			totalTransactions: sql<number>`count(*)`,
			totalRevenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			avgTransactions: sql<number>`cast(count(*) as float) / 30`, // Average per day
			avgRevenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0) / 30`,
			avgOrderValue: sql<number>`coalesce(avg(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, thirtyDaysAgo), lte(transaction.createdAt, endDate)))
		.groupBy(sql`strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch')`)
		.orderBy(desc(sql`count(*)`));

	// Get peak hours by channel
	const peakHoursByChannel = await db
		.select({
			channel: transaction.channel,
			hour: sql<number>`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`,
			transactions: sql<number>`count(*)`,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, thirtyDaysAgo), lte(transaction.createdAt, endDate)))
		.groupBy(
			transaction.channel,
			sql`strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch')`
		)
		.orderBy(transaction.channel, desc(sql`count(*)`));

	// Get weekly pattern (last 7 days hour by hour)
	const weeklyPattern = await db
		.select({
			date: sql<string>`strftime('%Y-%m-%d', ${transaction.createdAt} / 1000, 'unixepoch')`,
			hour: sql<number>`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`,
			transactions: sql<number>`count(*)`,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, sevenDaysAgo), lte(transaction.createdAt, endDate)))
		.groupBy(
			sql`strftime('%Y-%m-%d', ${transaction.createdAt} / 1000, 'unixepoch')`,
			sql`strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch')`
		)
		.orderBy(
			sql`strftime('%Y-%m-%d', ${transaction.createdAt} / 1000, 'unixepoch')`,
			sql`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`
		);

	// Calculate peak hours (top 5 busiest hours)
	const peakHours = hourlySummary.slice(0, 5).map(h => ({
		...h,
		isPeak: true
	}));

	// Calculate quiet hours (bottom 5)
	const quietHours = hourlySummary.slice(-5).reverse().map(h => ({
		...h,
		isPeak: false
	}));

	// Day of week analysis
	const dayOfWeekAnalysis = await db
		.select({
			dayOfWeek: sql<number>`cast(strftime('%w', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`,
			transactions: sql<number>`count(*)`,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			peakHour: sql<number>`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`
		})
		.from(transaction)
		.where(and(gte(transaction.createdAt, thirtyDaysAgo), lte(transaction.createdAt, endDate)))
		.groupBy(sql`strftime('%w', ${transaction.createdAt} / 1000, 'unixepoch')`)
		.orderBy(sql`cast(strftime('%w', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`);

	return {
		hourlyDistribution,
		hourlySummary,
		peakHoursByChannel,
		weeklyPattern,
		peakHours,
		quietHours,
		dayOfWeekAnalysis,
		dateRange: {
			start: thirtyDaysAgo,
			end: endDate
		}
	};
};