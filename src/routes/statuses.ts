import { createDb, schema } from '@/db';
import { env } from 'cloudflare:workers';
import { desc } from 'drizzle-orm';
import { Hono } from 'hono';

const statuses = new Hono<{ Bindings: Bindings }>();
const db = createDb(env.NYAMELIA_SERVICES);
const statusesDb = schema.statuses;

statuses.get('/', async c => {
    const entries = await db.select().from(statusesDb).orderBy(desc(statusesDb.createdAt));

    return c.json(
        entries.map(e => ({
            ...e,
            createdAt: e.createdAt.toISOString()
        })),
        200,
        { 'Cache-Control': 'public, max-age=120' }
    );
});

statuses.get('/latest', async c => {
    const entry = await db.select().from(statusesDb).orderBy(desc(statusesDb.createdAt)).limit(1);

    return c.json(
        entry.map(e => ({
            ...e,
            createdAt: e.createdAt.toISOString()
        }))[0],
        200,
        { 'Cache-Control': 'public, max-age=120' }
    );
});

statuses.get('/rss.xml', async c => {
    const entries = await db.select().from(statusesDb).orderBy(desc(statusesDb.createdAt));
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0">',
        '	<channel>',
        '		<title>My Statuses</title>',
        '		<link>https://nyamelia.is-immensely.gay/statuses</link>',
        "		<description>what i'm up to lol. these are NOT my ramblings lmao</description>"
    ];

    for (const entry of entries) {
        xml.push(
            ...[
                '		<item>',
                `			<title>${entry.text}</title>`,
                `			<pubDate>${entry.createdAt.toUTCString()}</pubDate>`,
                `			<guid isPermaLink="false">${entry.id}</guid>`,
                '		</item>'
            ]
        );
    }

    xml.push(...['	</channel>', '</rss>']);

    return c.body(xml.join('\n'), 200, { 'Content-Type': 'application/xml; charset=UTF-8' });
});

export default statuses;
