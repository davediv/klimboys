import { getDefaultStaffPath, hasCapability, type Capability } from '$lib/permissions';

export type { UserRole } from '$lib/permissions';

export interface NavigationRoute {
	id: string;
	href: string;
	label: string;
	title: string;
	released: boolean;
	capability?: Capability;
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
	dashboard: {
		id: 'dashboard',
		href: '/dashboard',
		label: 'Dashboard',
		title: 'Dashboard',
		released: true,
		capability: 'overview:read'
	},
	pos: {
		id: 'pos',
		href: '/dashboard/transaction',
		label: 'Transactions',
		title: 'Transactions',
		released: true,
		capability: 'sale:create'
	},
	products: {
		id: 'products',
		href: '/dashboard/products',
		label: 'Products',
		title: 'Products',
		released: true,
		capability: 'catalog:manage'
	}
} as const satisfies Record<string, NavigationRoute>;

export type StaffRouteId = keyof typeof staffRoutes;

const publicNavigation = [
	publicRoutes.home,
	publicRoutes.menu,
	publicRoutes.about,
	publicRoutes.contact
];

const staffNavigation = [staffRoutes.dashboard, staffRoutes.pos, staffRoutes.products];

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
			candidate.href === staffRoutes.dashboard.href
				? pathname === candidate.href
				: pathname.startsWith(candidate.href)
		);

	return route?.title ?? staffRoutes.dashboard.title;
}

export function getSafeStaffRedirect(
	value: string | null,
	fallback: string = staffRoutes.dashboard.href
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
