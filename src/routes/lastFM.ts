import { LASTFM_BASE, LASTFM_USER, TTL } from '@/lib/consts';
import { cachedFetch, getAlbumImage, getTrackImage } from '@/lib/lastFM';
import { Hono } from 'hono';

const lastFM = new Hono<{ Bindings: Bindings }>();

lastFM.get('/recent', async c => {
    const data = await cachedFetch(
        c.env.LASTFM_CACHE,
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
                track.album['#text'] || track.album['#text'] === '' ? track.name : track.album,
                track.image.find((i: any) => i.size === 'extralarge')?.['#text']
            ),
            url: track.url
        }))
    );

    return c.json(clean);
});

lastFM.get('/artists', async c => {
    const data = await cachedFetch(
        c.env.LASTFM_CACHE,
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

lastFM.get('/albums', async c => {
    const data = await cachedFetch(
        c.env.LASTFM_CACHE,
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

export default lastFM;
