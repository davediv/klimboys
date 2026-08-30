export type UserRole = 'admin' | 'cashier' | 'viewer';

export interface NavigationRoute {
	id: string;
	href: string;
	label: string;
	title: string;
	released: boolean;
	roles?: readonly UserRole[];
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
		href: '/#menu',
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
		href: '/login',
		label: 'Staff Login',
		title: 'Staff Login',
		released: true
	},
	register: {
		id: 'register',
		href: '/register',
		label: 'Register',
		title: 'Register',
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
		roles: ['admin', 'cashier']
	},
	pos: {
		id: 'pos',
		href: '/dashboard/transaction',
		label: 'Transactions',
		title: 'Transactions',
		released: true,
		roles: ['admin', 'cashier']
	},
	products: {
		id: 'products',
		href: '/dashboard/products',
		label: 'Products',
		title: 'Products',
		released: true,
		roles: ['admin']
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
		(route) => route.released && route.roles.some((allowedRole) => allowedRole === role)
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
