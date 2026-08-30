import { desc, eq, sql } from 'drizzle-orm';
import type { OrderList } from '$lib/order';
import { getDb } from '$lib/server/db';
import { transactionItems, transactions, user } from '$lib/server/db/schema';

interface ListOrdersOptions {
	userId: string;
	readAll: boolean;
	page: number;
	limit?: number;
}

export async function listOrders({
	userId,
	readAll,
	page,
	limit = 25
}: ListOrdersOptions): Promise<OrderList> {
	const db = getDb();
	const validPage = Math.max(1, page);
	const whereClause = readAll ? undefined : eq(transactions.userId, userId);
	const offset = (validPage - 1) * limit;

	const [rows, countRows] = await Promise.all([
		db
			.select({
				id: transactions.id,
				transactionCode: transactions.transactionCode,
				createdAt: transactions.createdAt,
				channel: transactions.channel,
				paymentMethod: transactions.paymentMethod,
				itemQuantity: sql<number>`coalesce(sum(${transactionItems.quantity}), 0)`,
				total: transactions.total,
				status: transactions.status,
				cashierName: sql<string>`coalesce(${user.name}, ${user.email})`
			})
			.from(transactions)
			.innerJoin(user, eq(user.id, transactions.userId))
			.leftJoin(transactionItems, eq(transactionItems.transactionId, transactions.id))
			.where(whereClause)
			.groupBy(transactions.id)
			.orderBy(desc(transactions.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(transactions)
			.where(whereClause)
	]);

	const totalItems = Number(countRows[0]?.count ?? 0);
	return {
		orders: rows.map((order) => ({
			...order,
			itemQuantity: Number(order.itemQuantity),
			createdAt: order.createdAt.toISOString()
		})),
		page: validPage,
		totalItems,
		totalPages: Math.max(1, Math.ceil(totalItems / limit)),
		scope: readAll ? 'all' : 'own'
	};
}
