import { createDb, schema } from '@/db';
import { CATPPUCCIN_MACCHIATO_COLORS } from '@/lib/consts';
import { isValidEmail } from '@/lib/helpers';
import { ReportPacket } from '@/lib/types';
import { env } from 'cloudflare:workers';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';

const guestbook = new Hono<{ Bindings: Env }>();
const db = createDb(env.nyamelia_services);
const guestbookEntries = schema.guestbookEntries;

guestbook.get('/', async c => {
    const entries = await db
        .select({
            id: guestbookEntries.id,
            name: guestbookEntries.name,
            message: guestbookEntries.message,
            createdAt: guestbookEntries.createdAt,
            borderColor: guestbookEntries.borderColor,
            url: guestbookEntries.url
        })
        .from(guestbookEntries)
        .orderBy(desc(guestbookEntries.createdAt));

    return c.json(
        entries.map(e => ({
            ...e,
            createdAt: e.createdAt?.toISOString()
        }))
    );
});

guestbook.post('/', async c => {
    const body = await c.req.json<{
        name?: string;
        message: string;
        email?: string;
        borderColor?: string;
        url?: string;
    }>();

    if (!body.message) {
        c.status(422);

        return c.json({
            error: 'NO_MESSAGE',
            description: 'A message is required in the guestbook'
        });
    }

    if (body.email && !isValidEmail(body.email)) {
        c.status(422);

        return c.json({
            error: 'INVALID_EMAIL',
            description: 'The email is not a valid email'
        });
    }

    if (body.url) {
        try {
            new URL(body.url);
        } catch {
            c.status(422);

            return c.json({
                error: 'INVALID_URL',
                description: 'The URL is not a valid URL'
            });
        }
    }

    if (body.borderColor && !CATPPUCCIN_MACCHIATO_COLORS.includes(body.borderColor)) {
        c.status(422);

        return c.json({
            error: 'INVALID_COLOR',
            description: 'The border color is not a valid Catppuccin Macchiato color'
        });
    }

    const [entry] = await db
        .insert(guestbookEntries)
        .values({
            name: body.name ?? 'anonymous',
            message: body.message,
            email: body.email,
            borderColor: body.borderColor ?? 'pink'
        })
        .returning({ id: guestbookEntries.id });

    c.status(201);
    return c.json({ success: true, id: entry.id });
});

guestbook.get('/:id', async c => {
    const _id = c.req.param('id');

    if (!Number.isFinite(Number(_id))) {
        c.status(422);

        return c.json({
            error: 'INVALID_ID',
            description: 'The ID is not a number'
        });
    }

    const id = Number(_id);

    const entry = await db
        .selectDistinct({
            id: guestbookEntries.id,
            name: guestbookEntries.name,
            message: guestbookEntries.message,
            createdAt: guestbookEntries.createdAt,
            borderColor: guestbookEntries.borderColor,
            url: guestbookEntries.url
        })
        .from(guestbookEntries)
        .where(eq(guestbookEntries.id, id));

    if (!entry.length) {
        c.status(404);

        return c.json({
            error: 'ENTRY_NOT_FOUND',
            description: 'That entry does not exist'
        });
    }

    return c.json(
        entry.map(e => ({
            ...e,
            createdAt: e.createdAt?.toISOString()
        }))[0]
    );
});

guestbook.post('/:id/report', async c => {
    const _id = c.req.param('id');

    const body = await c.req.json<ReportPacket>();

    if (!Number.isFinite(Number(_id))) {
        c.status(422);

        return c.json({
            error: 'INVALID_ID',
            description: 'The ID is not a number'
        });
    }

    const id = Number(_id);

    const entry = await db
        .selectDistinct({
            id: guestbookEntries.id
        })
        .from(guestbookEntries)
        .where(eq(guestbookEntries.id, id));

    if (!entry.length) {
        c.status(404);

        return c.json({
            error: 'ENTRY_NOT_FOUND',
            description: 'That entry does not exist'
        });
    }

    // send to discord

    return c.json({ success: true, id });
});

export default guestbook;
