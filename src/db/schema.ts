import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const guestbookEntries = sqliteTable('guestbook_entries', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    message: text('message').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
    email: text('email'),
    url: text('url'),
    borderColor: text('border_color'),
    ameliaReply: text('amelia_reply')
});

export const statuses = sqliteTable('statuses', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    text: text('text').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`)
});
