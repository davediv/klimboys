import { createDB } from '../db';
import type { ActivityLog } from './rbac';
import { sql } from 'drizzle-orm';
import { getD1Database } from '../db/raw';

// Activity log table schema (to be added to main schema)
export const activityLogSchema = `
CREATE TABLE IF NOT EXISTS activity_log (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES user(id),
	action TEXT NOT NULL,
	entity_type TEXT,
	entity_id TEXT,
	metadata TEXT,
	ip_address TEXT,
	user_agent TEXT,
	created_at INTEGER NOT NULL,
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
`;

// Activity types for better categorization
export enum ActivityType {
	// Authentication
	LOGIN = 'login',
	LOGOUT = 'logout',
	LOGIN_FAILED = 'login_failed',
	PASSWORD_RESET = 'password_reset',
	PASSWORD_CHANGED = 'password_changed',
	
	// User Management
	USER_CREATED = 'user_created',
	USER_UPDATED = 'user_updated',
	USER_DELETED = 'user_deleted',
	USER_ACTIVATED = 'user_activated',
	USER_DEACTIVATED = 'user_deactivated',
	
	// Product Management
	PRODUCT_CREATED = 'product_created',
	PRODUCT_UPDATED = 'product_updated',
	PRODUCT_DELETED = 'product_deleted',
	
	// Transaction Management
	TRANSACTION_CREATED = 'transaction_created',
	TRANSACTION_VOIDED = 'transaction_voided',
	
	// Inventory Management
	INVENTORY_ADJUSTED = 'inventory_adjusted',
	STOCK_ADDED = 'stock_added',
	STOCK_REMOVED = 'stock_removed',
	
	// System Actions
	SETTINGS_UPDATED = 'settings_updated',
	DATA_EXPORTED = 'data_exported',
	BACKUP_CREATED = 'backup_created',
	
	// Security Actions
	SUSPICIOUS_ACTIVITY = 'suspicious_activity',
	PERMISSION_DENIED = 'permission_denied',
	RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

// Enhanced activity logging implementation
export async function logActivityToDatabase(
	db: ReturnType<typeof createDB>,
	userId: string,
	action: string,
	details?: Omit<ActivityLog, 'userId' | 'action' | 'timestamp'>
): Promise<void> {
	try {
		// Get the underlying D1 database instance
		const d1 = getD1Database(db);
		
		// Debug: Check if table exists
		console.log('[Activity Log] Checking if activity_log table exists...');
		
		try {
			const tableCheck = await d1.prepare(
				`SELECT name FROM sqlite_master WHERE type='table' AND name='activity_log'`
			).all();
			console.log('[Activity Log] Table check result:', tableCheck.results);
			
			// If table doesn't exist, create it
			if (!tableCheck.results || tableCheck.results.length === 0) {
				console.log('[Activity Log] Table does not exist, creating it...');
				await d1.prepare(activityLogSchema).run();
				console.log('[Activity Log] Table created successfully');
			}
		} catch (checkError) {
			console.error('[Activity Log] Error checking/creating table:', checkError);
		}
		
		const id = crypto.randomUUID();
		const timestamp = new Date().getTime();
		
		console.log('[Activity Log] Attempting to insert activity:', {
			userId,
			action,
			entityType: details?.entityType,
			timestamp: new Date(timestamp).toISOString()
		});
		
		await d1.prepare(
			`INSERT INTO activity_log (
				id, user_id, action, entity_type, entity_id, 
				metadata, ip_address, user_agent, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).bind(
			id,
			userId,
			action,
			details?.entityType || null,
			details?.entityId || null,
			details?.metadata ? JSON.stringify(details.metadata) : null,
			details?.ipAddress || null,
			details?.userAgent || null,
			timestamp
		).run();
		
		console.log('[Activity Log] Successfully logged activity');
	} catch (error) {
		console.error('[Activity Log] Failed to log activity:', error);
		console.error('[Activity Log] Error details:', {
			errorType: error?.constructor?.name,
			message: error?.message,
			stack: error?.stack
		});
		// Don't throw - logging failures shouldn't break the app
	}
}

// Get activity logs with filtering
export async function getActivityLogs(
	db: ReturnType<typeof createDB>,
	filters?: {
		userId?: string;
		action?: string;
		entityType?: string;
		entityId?: string;
		startDate?: Date;
		endDate?: Date;
		limit?: number;
		offset?: number;
	}
): Promise<ActivityLog[]> {
	let query = `
		SELECT 
			al.*,
			u.name as user_name,
			u.email as user_email
		FROM activity_log al
		INNER JOIN user u ON al.user_id = u.id
		WHERE 1=1
	`;
	
	const params: any[] = [];
	
	if (filters?.userId) {
		query += ' AND al.user_id = ?';
		params.push(filters.userId);
	}
	
	if (filters?.action) {
		query += ' AND al.action = ?';
		params.push(filters.action);
	}
	
	if (filters?.entityType) {
		query += ' AND al.entity_type = ?';
		params.push(filters.entityType);
	}
	
	if (filters?.entityId) {
		query += ' AND al.entity_id = ?';
		params.push(filters.entityId);
	}
	
	if (filters?.startDate) {
		query += ' AND al.created_at >= ?';
		params.push(filters.startDate.getTime());
	}
	
	if (filters?.endDate) {
		query += ' AND al.created_at <= ?';
		params.push(filters.endDate.getTime());
	}
	
	query += ' ORDER BY al.created_at DESC';
	
	if (filters?.limit) {
		query += ' LIMIT ?';
		params.push(filters.limit);
		
		if (filters?.offset) {
			query += ' OFFSET ?';
			params.push(filters.offset);
		}
	}
	
	const d1 = getD1Database(db);
	const stmt = d1.prepare(query);
	const results = await stmt.bind(...params).all();
	
	return (results.results || []).map((row: any) => ({
		userId: row.user_id,
		userName: row.user_name,
		userEmail: row.user_email,
		action: row.action,
		entityType: row.entity_type,
		entityId: row.entity_id,
		metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
		ipAddress: row.ip_address,
		userAgent: row.user_agent,
		timestamp: new Date(row.created_at)
	}));
}

// Get user's last activity
export async function getUserLastActivity(
	db: ReturnType<typeof createDB>,
	userId: string
): Promise<ActivityLog | null> {
	const d1 = getD1Database(db);
	const result = await d1.prepare(
		`SELECT * FROM activity_log 
		WHERE user_id = ? 
		ORDER BY created_at DESC 
		LIMIT 1`
	).bind(userId).first();
	
	if (!result) return null;
	
	return {
		userId: result.user_id as string,
		action: result.action as string,
		entityType: result.entity_type as string | undefined,
		entityId: result.entity_id as string | undefined,
		metadata: result.metadata ? JSON.parse(result.metadata as string) : undefined,
		ipAddress: result.ip_address as string | undefined,
		userAgent: result.user_agent as string | undefined,
		timestamp: new Date(result.created_at as number)
	};
}

// Clean up old activity logs
export async function cleanupOldActivityLogs(
	db: ReturnType<typeof createDB>,
	daysToKeep: number = 90
): Promise<number> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
	
	const d1 = getD1Database(db);
	const result = await d1.prepare(
		'DELETE FROM activity_log WHERE created_at < ?'
	).bind(cutoffDate.getTime()).run();
	
	return result.meta?.changes || 0;
}

// Get suspicious activities
export async function getSuspiciousActivities(
	db: ReturnType<typeof createDB>,
	hours: number = 24
): Promise<ActivityLog[]> {
	const cutoffTime = new Date();
	cutoffTime.setHours(cutoffTime.getHours() - hours);
	
	const suspiciousActions = [
		ActivityType.LOGIN_FAILED,
		ActivityType.PERMISSION_DENIED,
		ActivityType.RATE_LIMIT_EXCEEDED,
		ActivityType.SUSPICIOUS_ACTIVITY
	];
	
	return getActivityLogs(db, {
		action: suspiciousActions.join(','),
		startDate: cutoffTime
	});
}