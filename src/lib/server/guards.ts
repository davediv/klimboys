import { redirect } from '@sveltejs/kit';
import { getDefaultStaffPath, hasCapability, type Capability } from '$lib/permissions';
import type { ServerLoadEvent } from '@sveltejs/kit';

interface GuardOptions {
	requireAuth?: boolean;
	requireVerified?: boolean;
	capability?: Capability;
	redirectTo?: string;
}

/**
 * Route guard to protect pages based on authentication and capabilities
 * @param event - SvelteKit server load event
 * @param options - Guard configuration options
 * @returns User data if all checks pass
 */
export function routeGuard(event: ServerLoadEvent, options: GuardOptions = {}) {
	const {
		requireAuth = true,
		requireVerified = true,
		capability,
		redirectTo = '/staff-login'
	} = options;

	const { locals, url } = event;

	// Check authentication
	if (requireAuth && !locals.user) {
		const loginUrl = new URL(redirectTo, url.origin);
		loginUrl.searchParams.set('redirectTo', url.pathname);
		throw redirect(302, loginUrl.toString());
	}

	if (!locals.user) {
		return null;
	}

	// Check email verification
	if (requireVerified && !locals.user.emailVerified) {
		const verificationUrl = new URL('/staff-login/verify-email', url.origin);
		verificationUrl.searchParams.set('email', locals.user.email);
		throw redirect(302, `${verificationUrl.pathname}${verificationUrl.search}`);
	}

	// Keep navigation and server authorization on the same capability model.
	if (capability && !hasCapability(locals.user.role, capability)) {
		throw redirect(302, getDefaultStaffPath(locals.user.role));
	}

	return locals.user;
}

/**
 * Get the default redirect path for a user based on their role
 * @param role - User's role
 * @returns Default path for the role
 */
export function getDefaultRedirect(role: string | undefined): string {
	return getDefaultStaffPath(role);
}
