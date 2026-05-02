import { desc } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from './db/index';
import { guestbook_entries } from './db/schema';
import { cachedFetch, getAlbumImage, getTrackImage, LASTFM_BASE, LASTFM_USER } from './lastFM';

const app = new Hono<{ Bindings: Env }>();
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
        .from(guestbook_entries)
        .orderBy(desc(guestbook_entries.createdAt));

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

app.get('/api/lastfm/recent', async c => {
    const data = await cachedFetch(
        c.env.lastfm_cache,
        'lastfm:recent:10',
        `${LASTFM_BASE}?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${c.env.LASTFM_API_KEY}&format=json&limit=10`,
        300
    );

    const clean: any[] = [];

    for (const track of data.recenttracks.track) {
        clean.push({
            name: track.name,
            artist: track.artist['#text'],
            album: track.album['#text'],
            image: await getTrackImage(
                track.artist['#text'],
                track.name,
                track.image.find((i: any) => i.size === 'extralarge')?.['#text'],
                c
            ),
            url: track.url
        });
    }

    return c.json(clean);
});

app.get('/api/lastfm/artists', async c => {
    const data = await cachedFetch(
        c.env.lastfm_cache,
        'lastfm:artists:15',
        `${LASTFM_BASE}?method=user.gettopartists&user=${LASTFM_USER}&api_key=${c.env.LASTFM_API_KEY}&format=json&period=7day&limit=15`,
        3600
    );

    const clean = data.topartists.artist.map((a: any) => ({
        name: a.name,
        url: a.url
    }));

    return c.json(clean);
});

app.get('/api/lastfm/albums', async c => {
    const data = await cachedFetch(
        c.env.lastfm_cache,
        'lastfm:albums:20',
        `${LASTFM_BASE}?method=user.gettopalbums&user=${LASTFM_USER}&api_key=${c.env.LASTFM_API_KEY}&format=json&period=1month&limit=20`,
        3600
    );

    const clean: any[] = [];

    for (const a of data.topalbums.album) {
        clean.push({
            name: a.name,
            artist: a.artist.name,
            playcount: a.playcount,
            image: await getAlbumImage(
                a.artist.name,
                a.name,
                a.image.find((i: any) => i.size === 'extralarge')?.['#text'],
                c
            ),
            url: a.url
        });
    }

    return c.json(clean);
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
