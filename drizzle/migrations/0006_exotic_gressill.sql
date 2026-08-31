CREATE INDEX `transactions_created_at_idx` ON `transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `transactions_user_created_at_idx` ON `transactions` (`user_id`,`created_at`);
