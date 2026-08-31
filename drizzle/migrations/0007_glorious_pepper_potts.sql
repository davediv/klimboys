CREATE INDEX `inventory_logs_manual_created_at_idx` ON `inventory_logs` (`created_at`) WHERE "inventory_logs"."type" <> 'sale';
