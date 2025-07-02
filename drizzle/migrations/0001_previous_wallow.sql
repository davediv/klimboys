CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `category_name_idx` ON `category` (`name`);--> statement-breakpoint
CREATE TABLE `customer` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text,
	`notes` text,
	`totalPurchases` integer DEFAULT 0 NOT NULL,
	`totalSpent` real DEFAULT 0 NOT NULL,
	`lastPurchaseDate` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_phone_unique` ON `customer` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `customer_phone_idx` ON `customer` (`phone`);--> statement-breakpoint
CREATE INDEX `customer_name_idx` ON `customer` (`name`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`currentStock` real DEFAULT 0 NOT NULL,
	`minimumStock` real DEFAULT 0 NOT NULL,
	`lastRestockDate` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inventory_name_idx` ON `inventory` (`name`);--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`size` integer NOT NULL,
	`productCost` real NOT NULL,
	`sellingPrice` real NOT NULL,
	`imageUrl` text,
	`categoryId` text,
	`isAvailable` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `product_title_idx` ON `product` (`title`);--> statement-breakpoint
CREATE INDEX `product_category_idx` ON `product` (`categoryId`);--> statement-breakpoint
CREATE INDEX `product_available_idx` ON `product` (`isAvailable`);--> statement-breakpoint
CREATE TABLE `productRecipe` (
	`id` text PRIMARY KEY NOT NULL,
	`productId` text NOT NULL,
	`inventoryId` text NOT NULL,
	`quantity` real NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inventoryId`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_inventory_idx` ON `productRecipe` (`productId`,`inventoryId`);--> statement-breakpoint
CREATE TABLE `stockMovement` (
	`id` text PRIMARY KEY NOT NULL,
	`inventoryId` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`reason` text NOT NULL,
	`transactionId` text,
	`createdBy` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`inventoryId`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_movement_inventory_idx` ON `stockMovement` (`inventoryId`);--> statement-breakpoint
CREATE INDEX `stock_movement_type_idx` ON `stockMovement` (`type`);--> statement-breakpoint
CREATE INDEX `stock_movement_transaction_idx` ON `stockMovement` (`transactionId`);--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionNumber` text NOT NULL,
	`customerId` text,
	`cashierId` text NOT NULL,
	`channel` text NOT NULL,
	`paymentMethod` text NOT NULL,
	`totalAmount` real NOT NULL,
	`totalCost` real NOT NULL,
	`notes` text,
	`status` text DEFAULT 'completed' NOT NULL,
	`voidReason` text,
	`voidedBy` text,
	`voidedAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cashierId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`voidedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_transactionNumber_unique` ON `transaction` (`transactionNumber`);--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_number_idx` ON `transaction` (`transactionNumber`);--> statement-breakpoint
CREATE INDEX `transaction_customer_idx` ON `transaction` (`customerId`);--> statement-breakpoint
CREATE INDEX `transaction_cashier_idx` ON `transaction` (`cashierId`);--> statement-breakpoint
CREATE INDEX `transaction_channel_idx` ON `transaction` (`channel`);--> statement-breakpoint
CREATE INDEX `transaction_status_idx` ON `transaction` (`status`);--> statement-breakpoint
CREATE INDEX `transaction_created_at_idx` ON `transaction` (`createdAt`);--> statement-breakpoint
CREATE TABLE `transactionItem` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text NOT NULL,
	`productId` text NOT NULL,
	`quantity` integer NOT NULL,
	`unitPrice` real NOT NULL,
	`unitCost` real NOT NULL,
	`subtotal` real NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`transactionId`) REFERENCES `transaction`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `transaction_item_transaction_idx` ON `transactionItem` (`transactionId`);--> statement-breakpoint
CREATE INDEX `transaction_item_product_idx` ON `transactionItem` (`productId`);--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'cashier' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `isActive` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `lastLoginAt` integer;--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_role_idx` ON `user` (`role`);