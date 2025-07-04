import { error, redirect } from '@sveltejs/kit';
import type { AuthSession, Role } from './rbac';
import { logActivity } from './rbac';

// Route permission configuration
export interface RoutePermission {
	path: string;
	roles?: Role[];
	requireAuth?: boolean;
	requireActive?: boolean;
	customCheck?: (session: AuthSession | null) => boolean | Promise<boolean>;
}

// Define all route permissions
export const routePermissions: RoutePermission[] = [
	// Public routes
	{ path: '/', requireAuth: false },
	{ path: '/login', requireAuth: false },
	{ path: '/register', requireAuth: false },
	{ path: '/setup', requireAuth: false },
	
	// General dashboard - requires authentication
	{ path: '/dashboard', requireAuth: true, requireActive: true },
	
	// Transaction routes - accessible by all authenticated users
	{ path: '/dashboard/transactions', requireAuth: true, requireActive: true },
	{ path: '/dashboard/transactions/new', requireAuth: true, requireActive: true },
	{ path: '/dashboard/transactions/[id]', requireAuth: true, requireActive: true },
	
	// Product routes - viewing accessible by all, editing admin only
	{ path: '/dashboard/products', requireAuth: true, requireActive: true },
	{ path: '/dashboard/products/recipes', roles: ['admin'], requireActive: true },
	
	// Admin-only routes
	{ path: '/dashboard/admin', roles: ['admin'], requireActive: true },
	{ path: '/dashboard/inventory', roles: ['admin'], requireActive: true },
	{ path: '/dashboard/categories', roles: ['admin'], requireActive: true },
	{ path: '/dashboard/customers', roles: ['admin'], requireActive: true },
	{ path: '/dashboard/analytics', roles: ['admin'], requireActive: true },
	
	// Settings - requires authentication
	{ path: '/dashboard/settings', requireAuth: true, requireActive: true },
	
	// API routes
	{ path: '/api/upload', roles: ['admin'], requireActive: true },
	{ path: '/api/auth', requireAuth: false }, // Handled by Better Auth
	{ path: '/api/images', requireAuth: false }, // Public image serving
];

// Field-level permissions
export interface FieldPermission {
	field: string;
	roles: Role[];
}

export const fieldPermissions: Record<string, FieldPermission[]> = {
	product: [
		{ field: 'productCost', roles: ['admin'] },
		{ field: 'profitMargin', roles: ['admin'] }
	],
	transaction: [
		{ field: 'totalCost', roles: ['admin'] },
		{ field: 'profit', roles: ['admin'] }
	],
	user: [
		{ field: 'lastLoginAt', roles: ['admin'] },
		{ field: 'createdAt', roles: ['admin'] }
	]
};

// Enhanced route guard function
export async function guardRoute(
	path: string,
	session: AuthSession | null,
	options?: {
		logAccess?: boolean;
		checkOrigin?: string;
		allowedIPs?: string[];
		customChecks?: Array<(session: AuthSession | null) => boolean | Promise<boolean>>;
	}
): Promise<void> {
	// Find matching route permission
	const permission = findRoutePermission(path);
	
	if (!permission) {
		// No specific permission defined - default to requiring auth
		if (!session) {
			throw redirect(302, '/login');
		}
		return;
	}
	
	// Check authentication requirement
	if (permission.requireAuth !== false && !session) {
		throw redirect(302, '/login');
	}
	
	// Check if user account is active
	if (permission.requireActive && session && !session.user.isActive) {
		throw error(403, 'Your account has been deactivated. Please contact an administrator.');
	}
	
	// Check role-based access
	if (permission.roles && permission.roles.length > 0) {
		if (!session || !permission.roles.includes(session.user.role)) {
			throw error(403, 'You do not have permission to access this page.');
		}
	}
	
	// Run custom permission check if defined
	if (permission.customCheck) {
		const allowed = await permission.customCheck(session);
		if (!allowed) {
			throw error(403, 'Access denied.');
		}
	}
	
	// Check IP restrictions (if provided)
	if (options?.allowedIPs && options.allowedIPs.length > 0 && options.checkOrigin) {
		if (!options.allowedIPs.includes(options.checkOrigin)) {
			throw error(403, 'Access denied from this IP address.');
		}
	}
	
	// Run additional custom checks
	if (options?.customChecks) {
		for (const check of options.customChecks) {
			const allowed = await check(session);
			if (!allowed) {
				throw error(403, 'Access denied by security policy.');
			}
		}
	}
	
	// Log access if requested
	if (options?.logAccess && session) {
		await logActivity(session.user.id, 'route_access', {
			entityType: 'route',
			entityId: path,
			metadata: {
				ip: options.checkOrigin,
				timestamp: new Date().toISOString()
			}
		});
	}
}

// Helper function to find matching route permission
function findRoutePermission(path: string): RoutePermission | undefined {
	// First try exact match
	let permission = routePermissions.find(p => p.path === path);
	if (permission) return permission;
	
	// Try pattern matching for dynamic routes
	for (const perm of routePermissions) {
		const pattern = perm.path.replace(/\[([^\]]+)\]/g, '([^/]+)');
		const regex = new RegExp(`^${pattern}$`);
		if (regex.test(path)) {
			return perm;
		}
	}
	
	// Try prefix matching for nested routes
	const sortedPermissions = [...routePermissions].sort((a, b) => b.path.length - a.path.length);
	for (const perm of sortedPermissions) {
		if (path.startsWith(perm.path)) {
			return perm;
		}
	}
	
	return undefined;
}

// Check if user has permission for a specific field
export function hasFieldPermission(
	entityType: string,
	fieldName: string,
	userRole: Role
): boolean {
	const permissions = fieldPermissions[entityType];
	if (!permissions) return true; // No restrictions defined
	
	const fieldPerm = permissions.find(p => p.field === fieldName);
	if (!fieldPerm) return true; // Field not restricted
	
	return fieldPerm.roles.includes(userRole);
}

// Filter object based on field permissions
export function filterFieldsByRole<T extends Record<string, any>>(
	data: T,
	entityType: string,
	userRole: Role
): Partial<T> {
	const permissions = fieldPermissions[entityType];
	if (!permissions || userRole === 'admin') return data; // Admins see everything
	
	const filtered = { ...data };
	for (const perm of permissions) {
		if (!perm.roles.includes(userRole)) {
			delete filtered[perm.field];
		}
	}
	
	return filtered;
}

// Session timeout check
export function checkSessionTimeout(session: AuthSession, maxIdleMinutes: number = 30): boolean {
	const now = new Date();
	const lastActivity = new Date(session.session.updatedAt || session.session.createdAt);
	const idleMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
	
	return idleMinutes > maxIdleMinutes;
}

// Password complexity validator
export function validatePasswordComplexity(password: string): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	
	if (password.length < 8) {
		errors.push('Password must be at least 8 characters long');
	}
	
	if (!/[A-Z]/.test(password)) {
		errors.push('Password must contain at least one uppercase letter');
	}
	
	if (!/[a-z]/.test(password)) {
		errors.push('Password must contain at least one lowercase letter');
	}
	
	if (!/[0-9]/.test(password)) {
		errors.push('Password must contain at least one number');
	}
	
	if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
		errors.push('Password must contain at least one special character');
	}
	
	return {
		valid: errors.length === 0,
		errors
	};
}

// Security headers middleware
export function getSecurityHeaders(): Record<string, string> {
	return {
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'X-XSS-Protection': '1; mode=block',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
		'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
		'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.telegram.org"
	};
}