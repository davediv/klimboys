import { hasCapability } from '$lib/permissions';
import { routeGuard } from '$lib/server/guards';
import { listOrders } from '$lib/server/orders';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = routeGuard(event, {
		requireAuth: true,
		requireVerified: true,
		capability: 'order:read-own'
	});
	const requestedPage = Number.parseInt(event.url.searchParams.get('page') ?? '1', 10);
	const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;

	return {
		user,
		orderList: await listOrders({
			userId: user!.id,
			readAll: hasCapability(user!.role, 'order:read-all'),
			page
		})
	};
};
