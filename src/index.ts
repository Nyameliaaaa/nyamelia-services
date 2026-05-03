import { desc } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from './db/index';
import { guestbook_entries } from './db/schema';
import { cachedFetch, getAlbumImage, getTrackImage, LASTFM_BASE, LASTFM_USER, TTL } from './lastFM';
import { env } from 'cloudflare:workers';

const app = new Hono<{ Bindings: Env }>();
app.use(
    '*',
    cors({
        origin: origin => {
            if (!origin) {
                return null;
            }

            const allowed = [
                'http://localhost:4321',
                'https://nyamelia.pages.dev',
                'https://nyamelia.is-immensely.gay'
            ];

            if (allowed.includes(origin)) {
                return origin;
            }

            if (/^https:\/\/[a-z0-9-]+\.nyamelia\.pages\.dev$/.test(origin)) {
                return origin;
            }

            return null;
        },
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type']
    })
);

function isValidEmail(email: string) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

const db = createDb(env.nyamelia_services);

app.get('/api/guestbook', async c => {
    const entries = await db
        .select({
            name: guestbook_entries.name,
            message: guestbook_entries.message,
            createdAt: guestbook_entries.createdAt
        })
        .from(guestbook_entries)
        .orderBy(desc(guestbook_entries.createdAt));

    return c.json(
        entries.map(e => ({
            ...e,
            createdAt: e.createdAt?.toISOString()
        }))
    );
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
        TTL.LASTFM_RECENT
    );

    const clean = await Promise.all(
        data.recenttracks.track.map(async (track: any) => ({
            name: track.name,
            artist: track.artist['#text'],
            album: track.album['#text'],
            image: await getTrackImage(
                track.artist['#text'],
                track.name,
                track.image.find((i: any) => i.size === 'extralarge')?.['#text']
            ),
            url: track.url
        }))
    );

    return c.json(clean);
});

app.get('/api/lastfm/artists', async c => {
    const data = await cachedFetch(
        c.env.lastfm_cache,
        'lastfm:artists:15',
        `${LASTFM_BASE}?method=user.gettopartists&user=${LASTFM_USER}&api_key=${c.env.LASTFM_API_KEY}&format=json&period=7day&limit=15`,
        TTL.LASTFM_TOP
    );

    const clean = data.topartists.artist.map((artist: any) => ({
        name: artist.name,
        url: artist.url,
        playcount: artist.playcount
    }));

    return c.json(clean);
});

app.get('/api/lastfm/albums', async c => {
    const data = await cachedFetch(
        c.env.lastfm_cache,
        'lastfm:albums:20',
        `${LASTFM_BASE}?method=user.gettopalbums&user=${LASTFM_USER}&api_key=${c.env.LASTFM_API_KEY}&format=json&period=1month&limit=20`,
        TTL.LASTFM_TOP
    );

    const clean = await Promise.all(
        data.topalbums.album.map(async (album: any) => ({
            name: album.name,
            artist: album.artist.name,
            playcount: album.playcount,
            image: await getAlbumImage(
                album.artist.name,
                album.name,
                album.image.find((i: any) => i.size === 'extralarge')?.['#text']
            ),
            url: album.url
        }))
    );

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
