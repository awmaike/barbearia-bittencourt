CREATE TABLE `admin_users` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'barber' NOT NULL,
	`active` text DEFAULT '1' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `business_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`preferred_date` text NOT NULL,
	`preferred_period` text DEFAULT 'Qualquer horário' NOT NULL,
	`service` text NOT NULL,
	`barber` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
