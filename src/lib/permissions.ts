export type UserRole = 'admin' | 'cashier' | 'viewer';

export const capabilities = [
	'overview:read',
	'sale:create',
	'order:read-own',
	'order:read-all',
	'catalog:manage',
	'inventory:adjust',
	'report:read',
	'team:manage',
	'settings:manage'
] as const;

export type Capability = (typeof capabilities)[number];

export const roleCapabilities = {
	admin: capabilities,
	cashier: ['sale:create', 'order:read-own'],
	viewer: []
} as const satisfies Record<UserRole, readonly Capability[]>;

export function isUserRole(role: string | undefined): role is UserRole {
	return role === 'admin' || role === 'cashier' || role === 'viewer';
}

export function getCapabilities(role: string | undefined): readonly Capability[] {
	return isUserRole(role) ? roleCapabilities[role] : [];
}

export function hasCapability(role: string | undefined, capability: Capability): boolean {
	return getCapabilities(role).some((candidate) => candidate === capability);
}

export function hasStaffWorkspaceAccess(role: string | undefined): boolean {
	return getCapabilities(role).length > 0;
}

export function getDefaultStaffPath(role: string | undefined): string {
	if (hasCapability(role, 'overview:read')) return '/dashboard';
	if (hasCapability(role, 'sale:create')) return '/dashboard/transaction';
	return '/';
}
