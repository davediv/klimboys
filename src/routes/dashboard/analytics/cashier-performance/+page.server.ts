import { requireAdmin } from '$lib/server/auth/rbac';
import { createDB } from '$lib/server/db';
import { transaction, user } from '$lib/server/db/schema';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin(locals.session);

	const db = createDB(platform!.env.DB);

	// Get date ranges
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const weekAgo = new Date(today);
	weekAgo.setDate(weekAgo.getDate() - 7);
	const monthAgo = new Date(today);
	monthAgo.setMonth(monthAgo.getMonth() - 1);

	// Get cashier performance summary
	const cashierSummary = await db
		.select({
			cashierId: transaction.cashierId,
			cashierName: user.name,
			cashierEmail: user.email,
			totalRevenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			totalTransactions: sql<number>`count(*)`,
			avgTransactionValue: sql<number>`coalesce(avg(${transaction.totalAmount}), 0)`,
			lastTransactionDate: sql<number>`max(${transaction.createdAt})`
		})
		.from(transaction)
		.innerJoin(user, eq(transaction.cashierId, user.id))
		.where(
			and(
				eq(transaction.status, 'completed'),
				gte(transaction.createdAt, monthAgo)
			)
		)
		.groupBy(transaction.cashierId, user.name, user.email)
		.orderBy(desc(sql`sum(${transaction.totalAmount})`));

	// Get today's performance by cashier
	const todayPerformance = await db
		.select({
			cashierId: transaction.cashierId,
			cashierName: user.name,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			transactions: sql<number>`count(*)`
		})
		.from(transaction)
		.innerJoin(user, eq(transaction.cashierId, user.id))
		.where(
			and(
				eq(transaction.status, 'completed'),
				gte(transaction.createdAt, today)
			)
		)
		.groupBy(transaction.cashierId, user.name)
		.orderBy(desc(sql`sum(${transaction.totalAmount})`));

	// Get weekly trend by cashier
	const weeklyTrend = await db
		.select({
			cashierId: transaction.cashierId,
			cashierName: user.name,
			createdAt: transaction.createdAt,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			transactions: sql<number>`count(*)`
		})
		.from(transaction)
		.innerJoin(user, eq(transaction.cashierId, user.id))
		.where(
			and(
				eq(transaction.status, 'completed'),
				gte(transaction.createdAt, weekAgo)
			)
		)
		.groupBy(transaction.cashierId, user.name)
		.orderBy(transaction.createdAt);

	// Get channel preference by cashier
	const channelPreference = await db
		.select({
			cashierId: transaction.cashierId,
			cashierName: user.name,
			channel: transaction.channel,
			transactions: sql<number>`count(*)`,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.innerJoin(user, eq(transaction.cashierId, user.id))
		.where(
			and(
				eq(transaction.status, 'completed'),
				gte(transaction.createdAt, monthAgo)
			)
		)
		.groupBy(transaction.cashierId, user.name, transaction.channel)
		.orderBy(desc(sql`count(*)`));

	// Get hourly performance pattern by cashier
	const hourlyPattern = await db
		.select({
			cashierId: transaction.cashierId,
			cashierName: user.name,
			createdAt: transaction.createdAt,
			transactions: sql<number>`count(*)`,
			avgRevenue: sql<number>`coalesce(avg(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.innerJoin(user, eq(transaction.cashierId, user.id))
		.where(
			and(
				eq(transaction.status, 'completed'),
				gte(transaction.createdAt, weekAgo)
			)
		)
		.groupBy(transaction.cashierId, user.name, transaction.createdAt)
		.orderBy(transaction.createdAt);

	// Get top selling products by cashier (last 7 days)
	const topProductsByCashier = await db
		.select({
			cashierId: transaction.cashierId,
			cashierName: user.name,
			productTitle: sql<string>`json_extract(${transaction.items}, '$[0].title')`,
			salesCount: sql<number>`count(*)`,
			revenue: sql<number>`coalesce(sum(json_extract(${transaction.items}, '$[0].subtotal')), 0)`
		})
		.from(transaction)
		.innerJoin(user, eq(transaction.cashierId, user.id))
		.where(
			and(
				eq(transaction.status, 'completed'),
				gte(transaction.createdAt, weekAgo),
				sql`json_array_length(${transaction.items}) > 0`
			)
		)
		.groupBy(
			transaction.cashierId,
			user.name,
			sql`json_extract(${transaction.items}, '$[0].title')`
		)
		.orderBy(desc(sql`count(*)`))
		.limit(50); // Limit to top 50 to get ~10 per cashier

	// Calculate performance rankings and ensure dates are properly formatted
	const performanceRankings = cashierSummary.map((cashier, index) => ({
		...cashier,
		// Convert timestamp to Date object if it exists
		lastTransactionDate: cashier.lastTransactionDate ? new Date(cashier.lastTransactionDate) : null,
		revenueRank: index + 1,
		transactionRank: [...cashierSummary]
			.sort((a, b) => b.totalTransactions - a.totalTransactions)
			.findIndex(c => c.cashierId === cashier.cashierId) + 1,
		avgValueRank: [...cashierSummary]
			.sort((a, b) => b.avgTransactionValue - a.avgTransactionValue)
			.findIndex(c => c.cashierId === cashier.cashierId) + 1
	}));

	// Process hourly pattern to extract hours
	const processedHourlyPattern = hourlyPattern.map(row => ({
		...row,
		hour: new Date(row.createdAt).getHours()
	}));

	// Process weekly trend to extract dates
	const processedWeeklyTrend = weeklyTrend.map(row => ({
		...row,
		date: new Date(row.createdAt).toISOString().split('T')[0]
	}));

	return {
		cashierSummary: performanceRankings,
		todayPerformance,
		weeklyTrend: processedWeeklyTrend,
		channelPreference,
		hourlyPattern: processedHourlyPattern,
		topProductsByCashier
	};
};