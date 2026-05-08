import { desc } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from './db/index';
import { guestbookEntries } from './db/schema';
import { cachedFetch, getAlbumImage, getTrackImage, LASTFM_BASE, LASTFM_USER, TTL } from './lastFM';
import { env } from 'cloudflare:workers';
import { CATPPUCCIN_MACCHIATO_COLORS, getOrigin, isValidEmail } from './helpers';

const app = new Hono<{ Bindings: Env }>();
app.use(
    '*',
    cors({
        origin: getOrigin,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type']
    })
);

const db = createDb(env.nyamelia_services);

app.get('/api/guestbook', async c => {
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

app.post('/api/guestbook', async c => {
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

    await db.insert(guestbookEntries).values({
        name: body.name ?? 'anonymous',
        message: body.message,
        email: body.email,
        borderColor: body.borderColor ?? 'pink'
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
