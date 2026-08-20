CREATE TABLE `cash_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`amount` text NOT NULL,
	`method` text NOT NULL,
	`transaction_date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `payment_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `payment_method` text DEFAULT 'pix' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `amount_paid` text DEFAULT '0' NOT NULL;