import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const guestbook_entries = sqliteTable("guestbook_entries", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	message: text("message").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	email: text("email"),
});
