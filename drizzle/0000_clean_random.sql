CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`interests` text NOT NULL,
	`visible` integer DEFAULT 1 NOT NULL,
	`consent_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_public_id` ON `profiles` (`id`);--> statement-breakpoint
CREATE INDEX `idx_profiles_visible_created` ON `profiles` (`visible`,`created_at`);