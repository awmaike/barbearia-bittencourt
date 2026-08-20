CREATE TABLE `appointment_slots` (
	`appointment_id` text NOT NULL,
	`barber` text NOT NULL,
	`appointment_date` text NOT NULL,
	`slot_time` text NOT NULL,
	PRIMARY KEY(`barber`, `appointment_date`, `slot_time`),
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `appointment_slots_appointment_idx` ON `appointment_slots` (`appointment_id`);--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`service` text NOT NULL,
	`barber` text NOT NULL,
	`appointment_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `appointments_date_barber_idx` ON `appointments` (`appointment_date`,`barber`);