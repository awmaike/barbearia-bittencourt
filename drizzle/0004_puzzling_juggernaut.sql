CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text DEFAULT '' NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` text DEFAULT '0' NOT NULL,
	`blocked_until` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
