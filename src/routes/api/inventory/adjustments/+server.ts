import { json } from '@sveltejs/kit';
import { hasCapability } from '$lib/permissions';
import {
	createInventoryAdjustment,
	InventoryAdjustmentError,
	parseInventoryAdjustment
} from '$lib/server/inventory';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	if (!locals.user.emailVerified) {
		return json(
			{ success: false, error: 'Verify your email before adjusting stock.' },
			{ status: 403 }
		);
	}
	if (!hasCapability(locals.user.role, 'inventory:adjust')) {
		return json(
			{ success: false, error: 'Inventory adjustment access required.' },
			{ status: 403 }
		);
	}

	try {
		const adjustment = parseInventoryAdjustment(await request.json());
		const result = await createInventoryAdjustment(adjustment, locals.user.id);
		return json({ success: true, data: result }, { status: result.alreadyProcessed ? 200 : 201 });
	} catch (error) {
		if (error instanceof InventoryAdjustmentError) {
			return json({ success: false, error: error.message }, { status: error.status });
		}
		console.error('Error adjusting inventory:', error);
		return json(
			{ success: false, error: 'The inventory adjustment could not be saved.' },
			{ status: 500 }
		);
	}
};
