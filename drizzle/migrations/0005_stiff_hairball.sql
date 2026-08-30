ALTER TABLE `inventory_logs` ADD `idempotency_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_logs_idempotency_key_unique` ON `inventory_logs` (`idempotency_key`);--> statement-breakpoint
UPDATE `inventory_logs`
SET
	`type` = 'correction',
	`reason` = coalesce(nullif(trim(`reason`), ''), 'Legacy stock correction')
WHERE `type` = 'adjustment';--> statement-breakpoint
DROP TRIGGER IF EXISTS `transaction_items_deduct_stock`;--> statement-breakpoint
CREATE TRIGGER `transaction_items_deduct_stock`
AFTER INSERT ON `transaction_items`
FOR EACH ROW
BEGIN
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
		`variant`.`stock_quantity` - NEW.`quantity`,
		'Sale ' || `transaction`.`transaction_code`,
		unixepoch()
	FROM `transactions` AS `transaction`
	INNER JOIN `product_variants` AS `variant`
		ON `variant`.`id` = NEW.`product_variant_id`
	WHERE `transaction`.`id` = NEW.`transaction_id`;
END;--> statement-breakpoint
CREATE TRIGGER `inventory_logs_validate_change`
BEFORE INSERT ON `inventory_logs`
FOR EACH ROW
BEGIN
	SELECT CASE
		WHEN NEW.`type` NOT IN ('sale', 'restock', 'waste', 'correction')
		THEN RAISE(ABORT, 'INVENTORY_LOG_INVALID_TYPE')
	END;
	SELECT CASE
		WHEN NEW.`quantity_change` = 0
			OR (NEW.`type` = 'restock' AND NEW.`quantity_change` < 1)
			OR (NEW.`type` IN ('sale', 'waste') AND NEW.`quantity_change` > -1)
		THEN RAISE(ABORT, 'INVENTORY_LOG_INVALID_QUANTITY')
	END;
	SELECT CASE
		WHEN NEW.`type` != 'sale'
			AND (
				NEW.`idempotency_key` IS NULL
				OR length(trim(NEW.`idempotency_key`)) = 0
				OR NEW.`reason` IS NULL
				OR length(trim(NEW.`reason`)) = 0
			)
		THEN RAISE(ABORT, 'INVENTORY_LOG_REASON_REQUIRED')
	END;
	SELECT CASE
		WHEN NEW.`quantity_after` < 0
		THEN RAISE(ABORT, 'INVENTORY_NEGATIVE_STOCK')
	END;
	SELECT CASE
		WHEN NOT EXISTS (
			SELECT 1
			FROM `product_variants` AS `variant`
			INNER JOIN `products` AS `product`
				ON `product`.`id` = `variant`.`product_id`
			WHERE `variant`.`id` = NEW.`product_variant_id`
				AND `variant`.`is_active` = 1
				AND `product`.`is_active` = 1
		)
		THEN RAISE(ABORT, 'INVENTORY_VARIANT_UNAVAILABLE')
	END;
	SELECT CASE
		WHEN NEW.`quantity_after` != (
			SELECT `stock_quantity` + NEW.`quantity_change`
			FROM `product_variants`
			WHERE `id` = NEW.`product_variant_id`
		)
		THEN RAISE(ABORT, 'INVENTORY_QUANTITY_MISMATCH')
	END;
END;--> statement-breakpoint
CREATE TRIGGER `inventory_logs_apply_stock`
AFTER INSERT ON `inventory_logs`
FOR EACH ROW
BEGIN
	UPDATE `product_variants`
	SET
		`stock_quantity` = NEW.`quantity_after`,
		`updated_at` = unixepoch()
	WHERE `id` = NEW.`product_variant_id`;
END;
