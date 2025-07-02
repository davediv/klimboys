import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const user = sqliteTable(
	'user',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		email: text('email').notNull().unique(),
		emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
		image: text('image'),
		role: text('role', { enum: ['admin', 'cashier'] })
			.notNull()
			.default('cashier'),
		isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
		lastLoginAt: integer('lastLoginAt', { mode: 'timestamp' }),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		emailIdx: index('user_email_idx').on(table.email),
		roleIdx: index('user_role_idx').on(table.role)
	})
);

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
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
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

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

// Category table
export const category = sqliteTable(
	'category',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		nameIdx: index('category_name_idx').on(table.name)
	})
);

// Product table
export const product = sqliteTable(
	'product',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		description: text('description'),
		size: integer('size').notNull(), // in ml
		productCost: real('productCost').notNull(),
		sellingPrice: real('sellingPrice').notNull(),
		imageUrl: text('imageUrl'),
		categoryId: text('categoryId').references(() => category.id),
		isAvailable: integer('isAvailable', { mode: 'boolean' }).notNull().default(true),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		titleIdx: index('product_title_idx').on(table.title),
		categoryIdx: index('product_category_idx').on(table.categoryId),
		availableIdx: index('product_available_idx').on(table.isAvailable)
	})
);

// Inventory table
export const inventory = sqliteTable(
	'inventory',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		unit: text('unit').notNull(), // ml, g, pcs
		currentStock: real('currentStock').notNull().default(0),
		minimumStock: real('minimumStock').notNull().default(0),
		lastRestockDate: integer('lastRestockDate', { mode: 'timestamp' }),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		nameIdx: index('inventory_name_idx').on(table.name)
	})
);

// Product Recipe (linking products to inventory items)
export const productRecipe = sqliteTable(
	'productRecipe',
	{
		id: text('id').primaryKey(),
		productId: text('productId')
			.notNull()
			.references(() => product.id, { onDelete: 'cascade' }),
		inventoryId: text('inventoryId')
			.notNull()
			.references(() => inventory.id, { onDelete: 'cascade' }),
		quantity: real('quantity').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		productInventoryIdx: uniqueIndex('product_inventory_idx').on(table.productId, table.inventoryId)
	})
);

// Stock Movement table
export const stockMovement = sqliteTable(
	'stockMovement',
	{
		id: text('id').primaryKey(),
		inventoryId: text('inventoryId')
			.notNull()
			.references(() => inventory.id, { onDelete: 'cascade' }),
		type: text('type', { enum: ['in', 'out', 'adjustment'] }).notNull(),
		quantity: real('quantity').notNull(),
		reason: text('reason').notNull(),
		transactionId: text('transactionId'),
		createdBy: text('createdBy')
			.notNull()
			.references(() => user.id),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		inventoryIdx: index('stock_movement_inventory_idx').on(table.inventoryId),
		typeIdx: index('stock_movement_type_idx').on(table.type),
		transactionIdx: index('stock_movement_transaction_idx').on(table.transactionId)
	})
);

// Customer table
export const customer = sqliteTable(
	'customer',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		phone: text('phone').notNull().unique(),
		address: text('address'),
		notes: text('notes'),
		totalPurchases: integer('totalPurchases').notNull().default(0),
		totalSpent: real('totalSpent').notNull().default(0),
		lastPurchaseDate: integer('lastPurchaseDate', { mode: 'timestamp' }),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		phoneIdx: uniqueIndex('customer_phone_idx').on(table.phone),
		nameIdx: index('customer_name_idx').on(table.name)
	})
);

// Transaction table
export const transaction = sqliteTable(
	'transaction',
	{
		id: text('id').primaryKey(),
		transactionNumber: text('transactionNumber').notNull().unique(),
		customerId: text('customerId').references(() => customer.id),
		cashierId: text('cashierId')
			.notNull()
			.references(() => user.id),
		channel: text('channel', {
			enum: ['grabfood', 'gofood', 'shopeefood', 'ubereats', 'store']
		}).notNull(),
		paymentMethod: text('paymentMethod', {
			enum: [
				'cash',
				'qris',
				'debit_card',
				'credit_card',
				'grabfood',
				'gofood',
				'shopeefood',
				'ubereats'
			]
		}).notNull(),
		totalAmount: real('totalAmount').notNull(),
		totalCost: real('totalCost').notNull(), // Hidden from cashier
		notes: text('notes'),
		status: text('status', { enum: ['completed', 'void'] })
			.notNull()
			.default('completed'),
		voidReason: text('voidReason'),
		voidedBy: text('voidedBy').references(() => user.id),
		voidedAt: integer('voidedAt', { mode: 'timestamp' }),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		numberIdx: uniqueIndex('transaction_number_idx').on(table.transactionNumber),
		customerIdx: index('transaction_customer_idx').on(table.customerId),
		cashierIdx: index('transaction_cashier_idx').on(table.cashierId),
		channelIdx: index('transaction_channel_idx').on(table.channel),
		statusIdx: index('transaction_status_idx').on(table.status),
		createdAtIdx: index('transaction_created_at_idx').on(table.createdAt)
	})
);

// Transaction Item table
export const transactionItem = sqliteTable(
	'transactionItem',
	{
		id: text('id').primaryKey(),
		transactionId: text('transactionId')
			.notNull()
			.references(() => transaction.id, { onDelete: 'cascade' }),
		productId: text('productId')
			.notNull()
			.references(() => product.id),
		quantity: integer('quantity').notNull(),
		unitPrice: real('unitPrice').notNull(),
		unitCost: real('unitCost').notNull(), // Hidden from cashier
		subtotal: real('subtotal').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull()
	},
	(table) => ({
		transactionIdx: index('transaction_item_transaction_idx').on(table.transactionId),
		productIdx: index('transaction_item_product_idx').on(table.productId)
	})
);

// Define relationships
export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	transactions: many(transaction),
	stockMovements: many(stockMovement)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));

export const categoryRelations = relations(category, ({ many }) => ({
	products: many(product)
}));

export const productRelations = relations(product, ({ one, many }) => ({
	category: one(category, {
		fields: [product.categoryId],
		references: [category.id]
	}),
	recipes: many(productRecipe),
	transactionItems: many(transactionItem)
}));

export const inventoryRelations = relations(inventory, ({ many }) => ({
	recipes: many(productRecipe),
	stockMovements: many(stockMovement)
}));

export const productRecipeRelations = relations(productRecipe, ({ one }) => ({
	product: one(product, {
		fields: [productRecipe.productId],
		references: [product.id]
	}),
	inventory: one(inventory, {
		fields: [productRecipe.inventoryId],
		references: [inventory.id]
	})
}));

export const stockMovementRelations = relations(stockMovement, ({ one }) => ({
	inventory: one(inventory, {
		fields: [stockMovement.inventoryId],
		references: [inventory.id]
	}),
	transaction: one(transaction, {
		fields: [stockMovement.transactionId],
		references: [transaction.id]
	}),
	createdByUser: one(user, {
		fields: [stockMovement.createdBy],
		references: [user.id]
	})
}));

export const customerRelations = relations(customer, ({ many }) => ({
	transactions: many(transaction)
}));

export const transactionRelations = relations(transaction, ({ one, many }) => ({
	customer: one(customer, {
		fields: [transaction.customerId],
		references: [customer.id]
	}),
	cashier: one(user, {
		fields: [transaction.cashierId],
		references: [user.id]
	}),
	voidedByUser: one(user, {
		fields: [transaction.voidedBy],
		references: [user.id]
	}),
	items: many(transactionItem),
	stockMovements: many(stockMovement)
}));

export const transactionItemRelations = relations(transactionItem, ({ one }) => ({
	transaction: one(transaction, {
		fields: [transactionItem.transactionId],
		references: [transaction.id]
	}),
	product: one(product, {
		fields: [transactionItem.productId],
		references: [product.id]
	})
}));
