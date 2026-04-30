import { Hono } from 'hono';
import { createDb } from './db/index';
import { guestbook_entries } from './db/schema';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());

function isValidEmail(email: string) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

app.get('/api/guestbook', async c => {
    const db = createDb(c.env.nyamelia_services);
    const entries = await db
        .select({
            name: guestbook_entries.name,
            message: guestbook_entries.message,
            createdAt: guestbook_entries.createdAt
        })
        .from(guestbook_entries);

    return c.json({
        entries: entries.map(e => ({
            ...e,
            createdAt: e.createdAt?.toISOString()
        }))
    });
});

app.post('/api/guestbook', async c => {
    const body = await c.req.json<{
        name?: string;
        message: string;
        email?: string;
    }>();

    if (!body.message) {
        return c.json({
            error: 'NO_MESSAGE',
            description: 'A message is required in the guestbook'
        });
    }

    if (body.email && !isValidEmail(body.email)) {
        return c.json({
            error: 'INVALID_EMAIL',
            description: 'The email is not a valid email'
        });
    }

    const db = createDb(c.env.nyamelia_services);

    await db.insert(guestbook_entries).values({
        name: body.name ?? 'anonymous',
        message: body.message,
        email: body.email
    });

    return c.json({ inserted: true });
});

app.onError((err, c) => {
    console.error(`${err}`);
    return c.json({
        name: err.name,
        msg: err.message,
        tip: 'Try checking for malformed JSON'
    });
});

export default app;
