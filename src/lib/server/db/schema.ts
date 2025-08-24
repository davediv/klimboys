import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// User table with role support
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name'),
	role: text('role').notNull().default('viewer'), // admin, cashier, viewer
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

// Session table for Better Auth
export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId')
		.notNull()
		.references(() => user.id)
});

// Account table for OAuth providers (optional, but included for completeness)
export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId')
		.notNull()
		.references(() => user.id),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

// Verification table for email verification
export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
});

// ============================================
// POS System Tables
// ============================================

// Products table for managing milk shake products
export const products = sqliteTable('products', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category').notNull(),
	imageUrl: text('image_url'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date())
});

// Product variants table for size-based pricing and stock management
export const productVariants = sqliteTable(
	'product_variants',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		productId: text('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		size: text('size').notNull(), // 'S', 'M', 'L'
		volumeMl: integer('volume_ml').notNull(), // 250, 350, 500 ml
		costPrice: integer('cost_price').notNull(), // Store as cents to avoid decimal issues
		sellingPrice: integer('selling_price').notNull(), // Store as cents
		stockQuantity: integer('stock_quantity').notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
			.$onUpdate(() => new Date())
	},
	(table) => ({
		// Unique constraint: Each product can only have one variant per size
		uniqueProductSize: unique().on(table.productId, table.size)
	})
);

// Transactions table for recording sales
export const transactions = sqliteTable('transactions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	transactionCode: text('transaction_code').notNull().unique(), // Format: TRX-YYYYMMDD-XXXX
	userId: text('user_id')
		.notNull()
		.references(() => user.id), // Reference to the cashier/admin who processed
	channel: text('channel').notNull(), // 'Store', 'GrabFood', 'GoFood', 'ShopeeFood', 'UberEats'
	paymentMethod: text('payment_method').notNull(), // 'Cash', 'QRIS', 'Transfer', etc.
	subtotal: integer('subtotal').notNull(), // Store as cents
	discount: integer('discount').default(0), // Store as cents
	total: integer('total').notNull(), // Store as cents
	notes: text('notes'),
	status: text('status').notNull().default('completed'), // 'pending', 'completed', 'cancelled', 'refunded'
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date())
});
