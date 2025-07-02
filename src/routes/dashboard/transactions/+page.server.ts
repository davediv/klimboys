import { createDB } from '$lib/server/db';
import { transaction, transactionItem, product, user, customer } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/rbac';
import type { PageServerLoad } from './$types';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAuth(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);

	// Get recent transactions
	const transactions = await db.query.transaction.findMany({
		orderBy: [desc(transaction.createdAt)],
		limit: 50,
		with: {
			items: {
				with: {
					product: true
				}
			},
			customer: true,
			cashier: {
				columns: {
					id: true,
					name: true,
					email: true
				}
			}
		},
		where:
			locals.session.user.role === 'cashier'
				? eq(transaction.cashierId, locals.session.user.id)
				: undefined
	});

	// Calculate summary stats
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const todaysTransactions = transactions.filter((t) => new Date(t.createdAt) >= todayStart);

	const stats = {
		todayTotal: todaysTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
		todayCount: todaysTransactions.length,
		allTimeTotal: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
		allTimeCount: transactions.length
	};

	return {
		transactions,
		stats
	};
};
