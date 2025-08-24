import { redirect } from '@sveltejs/kit';
import { hasRole } from './auth';
import type { ServerLoadEvent } from '@sveltejs/kit';

export type UserRole = 'admin' | 'cashier' | 'viewer';

interface GuardOptions {
	requireAuth?: boolean;
	requireVerified?: boolean;
	minRole?: UserRole;
	redirectTo?: string;
}

/**
 * Route guard to protect pages based on authentication and role requirements
 * @param event - SvelteKit server load event
 * @param options - Guard configuration options
 * @returns User data if all checks pass
 */
export function routeGuard(event: ServerLoadEvent, options: GuardOptions = {}) {
	const {
		requireAuth = true,
		requireVerified = true,
		minRole = 'viewer',
		redirectTo = '/login'
	} = options;

	const { locals, url } = event;

	// Check authentication
	if (requireAuth && !locals.user) {
		const loginUrl = new URL('/login', url.origin);
		loginUrl.searchParams.set('redirectTo', url.pathname);
		throw redirect(302, loginUrl.toString());
	}

	if (!locals.user) {
		return null;
	}

	// Check email verification
	if (requireVerified && !locals.user.emailVerified) {
		// Allow access to verification page
		if (url.pathname !== '/verify-email') {
			throw redirect(302, '/verify-email');
		}
	}

	// Check role permissions
	if (!hasRole(locals.user.role, minRole)) {
		// Redirect based on user's actual role
		const roleRedirects: Record<string, string> = {
			admin: '/dashboard',
			cashier: '/dashboard/transaction',
			viewer: '/'
		};

		const userRole = locals.user.role || 'viewer';
		const targetPath = roleRedirects[userRole] || '/';

		// Only redirect if they're not already on their allowed path
		if (url.pathname !== targetPath) {
			throw redirect(302, targetPath);
		}
	}

	return locals.user;
}

/**
 * Get the default redirect path for a user based on their role
 * @param role - User's role
 * @returns Default path for the role
 */
export function getDefaultRedirect(role: string | undefined): string {
	switch (role) {
		case 'admin':
			return '/dashboard';
		case 'cashier':
			return '/dashboard/transaction';
		case 'viewer':
		default:
			return '/';
	}
}
