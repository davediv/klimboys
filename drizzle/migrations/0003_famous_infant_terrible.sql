ALTER TABLE `transactions` ADD `idempotency_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_idempotency_key_unique` ON `transactions` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `transactions_status_created_at_idx` ON `transactions` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `transaction_items_transaction_id_idx` ON `transaction_items` (`transaction_id`);--> statement-breakpoint
CREATE TRIGGER `transaction_items_validate_sale`
BEFORE INSERT ON `transaction_items`
FOR EACH ROW
WHEN
	NEW.`quantity` <= 0
	OR NEW.`unit_price` < 0
	OR NEW.`total_price` != NEW.`unit_price` * NEW.`quantity`
	OR NOT EXISTS (
		SELECT 1
		FROM `product_variants` AS `variant`
		INNER JOIN `products` AS `product` ON `product`.`id` = `variant`.`product_id`
		WHERE `variant`.`id` = NEW.`product_variant_id`
			AND `product`.`is_active` = 1
			AND `variant`.`stock_quantity` >= NEW.`quantity`
			AND `variant`.`selling_price` = NEW.`unit_price`
	)
BEGIN
	SELECT RAISE(ABORT, 'TRANSACTION_ITEM_UNAVAILABLE');
END;--> statement-breakpoint
CREATE TRIGGER `transaction_items_deduct_stock`
AFTER INSERT ON `transaction_items`
FOR EACH ROW
BEGIN
	UPDATE `product_variants`
	SET
		`stock_quantity` = `stock_quantity` - NEW.`quantity`,
		`updated_at` = unixepoch()
	WHERE `id` = NEW.`product_variant_id`;

	INSERT INTO `inventory_logs` (
		`id`,
		`product_variant_id`,
		`user_id`,
		`type`,
		`quantity_change`,
		`quantity_after`,
		`reason`,
		`created_at`
	)
	SELECT
		lower(
			hex(randomblob(4)) || '-' ||
			hex(randomblob(2)) || '-' ||
			hex(randomblob(2)) || '-' ||
			hex(randomblob(2)) || '-' ||
			hex(randomblob(6))
		),
		NEW.`product_variant_id`,
		`transaction`.`user_id`,
		'sale',
		-NEW.`quantity`,
		`variant`.`stock_quantity`,
		'Sale ' || `transaction`.`transaction_code`,
		unixepoch()
	FROM `transactions` AS `transaction`
	INNER JOIN `product_variants` AS `variant`
		ON `variant`.`id` = NEW.`product_variant_id`
	WHERE `transaction`.`id` = NEW.`transaction_id`;
END;
