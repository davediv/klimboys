ALTER TABLE `product_variants` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD `product_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD `variant_size` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_items` ADD `variant_volume_ml` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `transaction_items`
SET
	`product_name` = coalesce(
		(
			SELECT `product`.`name`
			FROM `product_variants` AS `variant`
			INNER JOIN `products` AS `product` ON `product`.`id` = `variant`.`product_id`
			WHERE `variant`.`id` = `transaction_items`.`product_variant_id`
		),
		`product_name`
	),
	`variant_size` = coalesce(
		(
			SELECT `variant`.`size`
			FROM `product_variants` AS `variant`
			WHERE `variant`.`id` = `transaction_items`.`product_variant_id`
		),
		`variant_size`
	),
	`variant_volume_ml` = coalesce(
		(
			SELECT `variant`.`volume_ml`
			FROM `product_variants` AS `variant`
			WHERE `variant`.`id` = `transaction_items`.`product_variant_id`
		),
		`variant_volume_ml`
	);--> statement-breakpoint
DROP TRIGGER IF EXISTS `transaction_items_validate_sale`;--> statement-breakpoint
CREATE TRIGGER `transaction_items_validate_sale`
BEFORE INSERT ON `transaction_items`
FOR EACH ROW
WHEN
	NEW.`quantity` <= 0
	OR NEW.`unit_price` < 0
	OR NEW.`total_price` != NEW.`unit_price` * NEW.`quantity`
	OR length(trim(NEW.`product_name`)) = 0
	OR length(trim(NEW.`variant_size`)) = 0
	OR NEW.`variant_volume_ml` <= 0
	OR NOT EXISTS (
		SELECT 1
		FROM `product_variants` AS `variant`
		INNER JOIN `products` AS `product` ON `product`.`id` = `variant`.`product_id`
		WHERE `variant`.`id` = NEW.`product_variant_id`
			AND `product`.`is_active` = 1
			AND `variant`.`is_active` = 1
			AND `variant`.`stock_quantity` >= NEW.`quantity`
			AND `variant`.`selling_price` = NEW.`unit_price`
			AND `product`.`name` = NEW.`product_name`
			AND `variant`.`size` = NEW.`variant_size`
			AND `variant`.`volume_ml` = NEW.`variant_volume_ml`
	)
BEGIN
	SELECT RAISE(ABORT, 'TRANSACTION_ITEM_UNAVAILABLE');
END;
