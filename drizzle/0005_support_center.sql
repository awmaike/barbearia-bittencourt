CREATE TABLE `support_trash` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`payload` text NOT NULL,
	`deleted_by` text NOT NULL,
	`deleted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`restored_at` text
);
--> statement-breakpoint
CREATE INDEX `support_trash_deleted_idx` ON `support_trash` (`deleted_at`);
--> statement-breakpoint
CREATE TABLE `error_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`route` text NOT NULL,
	`message` text NOT NULL,
	`context` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`resolved_at` text
);
--> statement-breakpoint
CREATE INDEX `error_logs_created_idx` ON `error_logs` (`created_at`);
--> statement-breakpoint
INSERT OR IGNORE INTO `business_settings` (`key`,`value`) VALUES ('booking_maintenance','0');
--> statement-breakpoint
INSERT OR IGNORE INTO `business_settings` (`key`,`value`) VALUES ('support_refresh_seconds','15');
--> statement-breakpoint
INSERT OR IGNORE INTO `business_settings` (`key`,`value`) VALUES ('support_retention_days','90');
