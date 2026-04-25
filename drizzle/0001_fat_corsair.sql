PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_guestbook_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`email` text
);
--> statement-breakpoint
INSERT INTO `__new_guestbook_entries`("id", "name", "message", "created_at", "email") SELECT "id", "name", "message", "created_at", "email" FROM `guestbook_entries`;--> statement-breakpoint
DROP TABLE `guestbook_entries`;--> statement-breakpoint
ALTER TABLE `__new_guestbook_entries` RENAME TO `guestbook_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;