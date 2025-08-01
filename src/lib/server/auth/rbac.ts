import { error, redirect } from '@sveltejs/kit';

export type Role = 'admin' | 'cashier';

export interface AuthSession {
	user: {
		id: string;
		email: string;
		name: string;
		role: Role;
		image?: string | null;
	};
	session: {
		id: string;
		expiresAt: Date;
		userId: string;
	};
}

export function hasRole(session: AuthSession | null, requiredRoles: Role[]): boolean {
	if (!session?.user) return false;
	return requiredRoles.includes(session.user.role);
}

export function requireAuth(
	session: AuthSession | null,
	redirectTo = '/login'
): asserts session is AuthSession {
	if (!session) {
		throw redirect(302, redirectTo);
	}
}

export function requireRole(
	session: AuthSession | null,
	requiredRoles: Role[],
	redirectTo = '/dashboard'
): asserts session is AuthSession {
	requireAuth(session);

	if (!hasRole(session, requiredRoles)) {
		throw error(403, 'Insufficient permissions. Access denied.');
	}
}

export function requireAdmin(session: AuthSession | null): asserts session is AuthSession {
	requireRole(session, ['admin']);
}

export function requireCashier(session: AuthSession | null): asserts session is AuthSession {
	requireRole(session, ['cashier', 'admin']); // Admin can access cashier routes
}

// Helper to filter sensitive data based on role
export function filterDataByRole<T extends Record<string, any>>(
	data: T,
	role: Role,
	sensitiveFields: (keyof T)[]
): Partial<T> {
	if (role === 'admin') {
		return data; // Admin sees everything
	}

	// Filter out sensitive fields for non-admin users
	const filtered = { ...data };
	for (const field of sensitiveFields) {
		delete filtered[field];
	}
	return filtered;
}

// Activity logging types
export interface ActivityLog {
	userId: string;
	action: string;
	entityType?: string;
	entityId?: string;
	metadata?: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	timestamp: Date;
}

export async function logActivity(
	userId: string,
	action: string,
	details?: Omit<ActivityLog, 'userId' | 'action' | 'timestamp'>
): Promise<void> {
	// This will be implemented when we add the activity log table
	console.log('Activity:', { userId, action, ...details, timestamp: new Date() });
}
