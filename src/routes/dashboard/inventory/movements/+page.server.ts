import { createDB } from '$lib/server/db';
import { stockMovement, inventory, transaction } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/rbac';
import type { PageServerLoad } from './$types';
import { desc, eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	requireAdmin(locals.session);

	if (!platform?.env.DB) {
		throw new Error('Database not available');
	}

	const db = createDB(platform.env.DB);

	// Get filter parameters
	const inventoryId = url.searchParams.get('inventory');
	const movementType = url.searchParams.get('type');
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 50;
	const offset = (page - 1) * limit;

	// Build query conditions
	const conditions = [];
	if (inventoryId) {
		conditions.push(eq(stockMovement.inventoryId, inventoryId));
	}
	if (movementType && ['in', 'out', 'adjustment'].includes(movementType)) {
		conditions.push(eq(stockMovement.type, movementType));
	}

	// Get stock movements with related data
	const movements = await db.query.stockMovement.findMany({
		where: conditions.length > 0 ? and(...conditions) : undefined,
		orderBy: [desc(stockMovement.createdAt)],
		limit,
		offset,
		with: {
			inventory: true,
			transaction: {
				columns: {
					id: true,
					transactionNumber: true
				}
			},
			createdByUser: {
				columns: {
					id: true,
					name: true,
					email: true
				}
			}
		}
	});

	// Get all inventory items for filter dropdown
	const inventoryItems = await db.query.inventory.findMany({
		orderBy: [inventory.name]
	});

	// Calculate stats
	const stats = {
		totalIn: 0,
		totalOut: 0,
		totalAdjustments: 0
	};

	movements.forEach((movement) => {
		if (movement.type === 'in') {
			stats.totalIn += movement.quantity;
		} else if (movement.type === 'out') {
			stats.totalOut += movement.quantity;
		} else {
			stats.totalAdjustments++;
		}
	});

	return {
		movements,
		inventoryItems,
		stats,
		filters: {
			inventoryId,
			movementType
		},
		pagination: {
			page,
			limit,
			hasMore: movements.length === limit
		}
	};
};
