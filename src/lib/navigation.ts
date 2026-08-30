import { getDefaultStaffPath, hasCapability, type Capability } from '$lib/permissions';

export type { UserRole } from '$lib/permissions';

export interface NavigationRoute {
	id: string;
	href: string;
	label: string;
	title: string;
	released: boolean;
	capability?: Capability;
	section?: 'Operations' | 'Management';
}

export const publicRoutes = {
	home: {
		id: 'home',
		href: '/',
		label: 'Home',
		title: 'Home',
		released: true
	},
	menu: {
		id: 'menu',
		href: '/menu',
		label: 'Menu',
		title: 'Menu',
		released: true
	},
	about: {
		id: 'about',
		href: '/#about',
		label: 'About',
		title: 'About',
		released: true
	},
	contact: {
		id: 'contact',
		href: '/#contact',
		label: 'Contact',
		title: 'Contact',
		released: true
	},
	login: {
		id: 'login',
		href: '/staff-login',
		label: 'Staff Login',
		title: 'Staff Login',
		released: true
	}
} as const satisfies Record<string, NavigationRoute>;

export const staffRoutes = {
	overview: {
		id: 'overview',
		href: '/staff/overview',
		label: 'Overview',
		title: 'Overview',
		released: true,
		capability: 'overview:read',
		section: 'Management'
	},
	pos: {
		id: 'pos',
		href: '/staff/pos',
		label: 'New Sale',
		title: 'New Sale',
		released: true,
		capability: 'sale:create',
		section: 'Operations'
	},
	orders: {
		id: 'orders',
		href: '/staff/orders',
		label: 'Orders',
		title: 'Orders',
		released: true,
		capability: 'order:read-own',
		section: 'Operations'
	},
	inventory: {
		id: 'inventory',
		href: '/staff/inventory',
		label: 'Inventory',
		title: 'Inventory',
		released: true,
		capability: 'inventory:read',
		section: 'Operations'
	},
	catalog: {
		id: 'catalog',
		href: '/staff/catalog',
		label: 'Catalog',
		title: 'Catalog',
		released: true,
		capability: 'catalog:manage',
		section: 'Management'
	}
} as const satisfies Record<string, NavigationRoute>;

export type StaffRouteId = keyof typeof staffRoutes;

const publicNavigation = [
	publicRoutes.home,
	publicRoutes.menu,
	publicRoutes.about,
	publicRoutes.contact
];

const staffNavigation = [
	staffRoutes.pos,
	staffRoutes.orders,
	staffRoutes.inventory,
	staffRoutes.overview,
	staffRoutes.catalog
];

export function getPublicNavigation(): NavigationRoute[] {
	return publicNavigation.filter((route) => route.released);
}

export function getStaffNavigation(role: string | undefined): NavigationRoute[] {
	return staffNavigation.filter(
		(route) => route.released && route.capability && hasCapability(role, route.capability)
	);
}

export function getStaffPageTitle(pathname: string): string {
	const route = staffNavigation
		.filter((candidate) => candidate.released)
		.sort((left, right) => right.href.length - left.href.length)
		.find((candidate) =>
			candidate.href === staffRoutes.overview.href
				? pathname === candidate.href
				: pathname.startsWith(candidate.href)
		);

	return route?.title ?? 'Staff Workspace';
}

export function getSafeStaffRedirect(
	value: string | null,
	fallback: string = staffRoutes.overview.href
): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;

	const url = new URL(value, 'https://staff.klimboys.invalid');
	const isStaffDestination = staffNavigation.some(
		(route) =>
			route.released && (url.pathname === route.href || url.pathname.startsWith(`${route.href}/`))
	);

	return isStaffDestination ? `${url.pathname}${url.search}${url.hash}` : fallback;
}

export function getAuthorizedStaffRedirect(value: string | null, role: string | undefined): string {
	const fallback = getDefaultStaffPath(role);
	const destination = getSafeStaffRedirect(value, fallback);
	const url = new URL(destination, 'https://staff.klimboys.invalid');
	const route = staffNavigation
		.filter((candidate) => candidate.released)
		.sort((left, right) => right.href.length - left.href.length)
		.find(
			(candidate) =>
				url.pathname === candidate.href || url.pathname.startsWith(`${candidate.href}/`)
		);

	return route?.capability && hasCapability(role, route.capability) ? destination : fallback;
}
