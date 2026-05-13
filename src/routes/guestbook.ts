import { createDb, schema } from '@/db';
import { CATPPUCCIN_MACCHIATO_COLORS } from '@/lib/consts';
import { isValidEmail, sendDiscordPacket } from '@/lib/helpers';
import { GuestbookEntryPacket, QueuedMessageType, ReportPacket } from '@/lib/types';
import { env } from 'cloudflare:workers';
import { desc, eq, getTableColumns } from 'drizzle-orm';
import { Hono } from 'hono';

const guestbook = new Hono<{ Bindings: Bindings }>();
const db = createDb(env.NYAMELIA_SERVICES);
const guestbookEntries = schema.guestbookEntries;

guestbook.get('/', async c => {
    const { email, ...publicFields } = getTableColumns(guestbookEntries);
    const entries = await db.select(publicFields).from(guestbookEntries).orderBy(desc(guestbookEntries.createdAt));

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
        return c.json(
            {
                error: 'NO_MESSAGE',
                description: 'a message is required in the guestbook'
            },
            422
        );
    }

    if (body.email && !isValidEmail(body.email)) {
        return c.json(
            {
                error: 'INVALID_EMAIL',
                description: 'that email is not a valid email'
            },
            422
        );
    }

    if (body.url) {
        try {
            new URL(body.url);
        } catch {
            return c.json(
                {
                    error: 'INVALID_URL',
                    description: 'that URL is not a valid URL'
                },
                422
            );
        }
    }

    if (body.borderColor && !CATPPUCCIN_MACCHIATO_COLORS.includes(body.borderColor)) {
        return c.json(
            {
                error: 'INVALID_COLOR',
                description: 'the border color is not a valid Catppuccin Macchiato color'
            },
            422
        );
    }

    const [entry] = await db
        .insert(guestbookEntries)
        .values({
            name: body.name ?? 'anonymous',
            message: body.message,
            email: body.email,
            borderColor: body.borderColor ?? 'pink',
            ...(body.url && { url: body.url })
        })
        .returning();

    await sendDiscordPacket<GuestbookEntryPacket>(c, { type: QueuedMessageType.GuestbookEntry, ...entry });

    return c.json({ success: true, id: entry.id }, 201);
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
    const { email, ...publicFields } = getTableColumns(guestbookEntries);

    const entry = await db.selectDistinct(publicFields).from(guestbookEntries).where(eq(guestbookEntries.id, id));

    if (!entry.length) {
        return c.json(
            {
                error: 'ENTRY_NOT_FOUND',
                description: 'That entry does not exist'
            },
            404
        );
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
        return c.json(
            {
                error: 'INVALID_ID',
                description: 'the ID is not a number'
            },
            422
        );
    }

    const id = Number(_id);

    const entry = await db.selectDistinct().from(guestbookEntries).where(eq(guestbookEntries.id, id));

    if (!entry.length) {
        return c.json(
            {
                error: 'ENTRY_NOT_FOUND',
                description: 'that entry does not exist'
            },
            404
        );
    }

    await sendDiscordPacket<ReportPacket>(c, {
        type: QueuedMessageType.Report,
        offendingEntry: entry[0],
        message: body.message
    });

    return c.json({ success: true, id });
});

export default guestbook;
