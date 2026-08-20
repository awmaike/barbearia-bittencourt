CREATE TABLE `barber_hours` (
	`barber` text NOT NULL,
	`weekday` text NOT NULL,
	`enabled` text DEFAULT '1' NOT NULL,
	`start_time` text DEFAULT '08:00' NOT NULL,
	`end_time` text DEFAULT '18:00' NOT NULL,
	PRIMARY KEY(`barber`, `weekday`)
);
--> statement-breakpoint
CREATE TABLE `schedule_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`barber` text NOT NULL,
	`appointment_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`reason` text DEFAULT 'Horário bloqueado' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `cancel_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_cancel_token_unique` ON `appointments` (`cancel_token`);
