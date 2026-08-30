import { hasCapability } from '$lib/permissions';
import { routeGuard } from '$lib/server/guards';
import { listInventory, listRecentInventoryAdjustments } from '$lib/server/inventory';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: true,
		capability: 'inventory:read'
	});
	const requestedPage = Number.parseInt(event.url.searchParams.get('page') ?? '1', 10);
	const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;

	const [inventory, recentAdjustments] = await Promise.all([
		listInventory({
			page,
			search: event.url.searchParams.get('search') ?? '',
			lowOnly: event.url.searchParams.get('low') === 'true'
		}),
		listRecentInventoryAdjustments()
	]);

	return {
		user,
		canAdjust: hasCapability(user!.role, 'inventory:adjust'),
		inventory,
		recentAdjustments
	};
};
