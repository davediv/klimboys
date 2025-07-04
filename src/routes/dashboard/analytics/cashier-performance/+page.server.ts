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
				gte(transaction.createdAt, monthAgo.getTime())
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
				gte(transaction.createdAt, today.getTime())
			)
		)
		.groupBy(transaction.cashierId, user.name)
		.orderBy(desc(sql`sum(${transaction.totalAmount})`));

	// Get weekly trend by cashier
	const weeklyTrend = await db
		.select({
			cashierId: transaction.cashierId,
			cashierName: user.name,
			date: sql<string>`date(${transaction.createdAt} / 1000, 'unixepoch')`,
			revenue: sql<number>`coalesce(sum(${transaction.totalAmount}), 0)`,
			transactions: sql<number>`count(*)`
		})
		.from(transaction)
		.innerJoin(user, eq(transaction.cashierId, user.id))
		.where(
			and(
				eq(transaction.status, 'completed'),
				gte(transaction.createdAt, weekAgo.getTime())
			)
		)
		.groupBy(transaction.cashierId, user.name, sql`date(${transaction.createdAt} / 1000, 'unixepoch')`)
		.orderBy(sql`date(${transaction.createdAt} / 1000, 'unixepoch')`);

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
				gte(transaction.createdAt, monthAgo.getTime())
			)
		)
		.groupBy(transaction.cashierId, user.name, transaction.channel)
		.orderBy(transaction.cashierId, desc(sql`count(*)`));

	// Get hourly performance pattern by cashier
	const hourlyPattern = await db
		.select({
			cashierId: transaction.cashierId,
			cashierName: user.name,
			hour: sql<number>`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`,
			transactions: sql<number>`count(*)`,
			avgRevenue: sql<number>`coalesce(avg(${transaction.totalAmount}), 0)`
		})
		.from(transaction)
		.innerJoin(user, eq(transaction.cashierId, user.id))
		.where(
			and(
				eq(transaction.status, 'completed'),
				gte(transaction.createdAt, weekAgo.getTime())
			)
		)
		.groupBy(
			transaction.cashierId,
			user.name,
			sql`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`
		)
		.orderBy(
			transaction.cashierId,
			sql`cast(strftime('%H', ${transaction.createdAt} / 1000, 'unixepoch') as integer)`
		);

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
				gte(transaction.createdAt, weekAgo.getTime()),
				sql`json_array_length(${transaction.items}) > 0`
			)
		)
		.groupBy(
			transaction.cashierId,
			user.name,
			sql`json_extract(${transaction.items}, '$[0].title')`
		)
		.orderBy(
			transaction.cashierId,
			desc(sql`count(*)`)
		)
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

	return {
		cashierSummary: performanceRankings,
		todayPerformance,
		weeklyTrend,
		channelPreference,
		hourlyPattern,
		topProductsByCashier
	};
};