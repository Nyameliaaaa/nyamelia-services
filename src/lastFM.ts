import type { Context } from 'hono';

export const cachedFetch = async (kv: KVNamespace, key: string, url: string, ttl: number) => {
    const cached = await kv.get(key);

    if (cached) {
        return JSON.parse(cached);
    }

    const res = await fetch(url, { headers: { 'User-Agent': 'nyamelia-website/1.0 (nyameliaaaa@proton.me)' } });
    const data = await res.json();

    await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
    return data;
};

const cacheKey = async (prefix: string, ...parts: string[]) => {
    const text = parts.join(':');
    const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
    const hex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return `${prefix}:${hex}`;
};

export const getTrackImage = async (
    artist: string,
    track: string,
    lastfmImage: string | null,
    c: Context<{ Bindings: Env }>
) => {
    if (lastfmImage && !lastfmImage.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
        return lastfmImage;
    }

    const mbData = await cachedFetch(
        c.env.lastfm_cache,
        await cacheKey('mb:track', artist, track),
        `https://musicbrainz.org/ws/2/release/?query=artist:${encodeURIComponent(artist)}+release:${encodeURIComponent(track)}&fmt=json&limit=1`,
        604800
    );

    const mbid = mbData.releases?.[0]?.id;
    if (!mbid) {
        return null;
    }

    return `https://coverartarchive.org/release/${mbid}/front`;
};

export const getAlbumImage = async (
    artist: string,
    album: string,
    lastfmImage: string | null,
    c: Context<{ Bindings: Env }>
) => {
    if (lastfmImage) {
        return lastfmImage;
    }

    const mbData = await cachedFetch(
        c.env.lastfm_cache,
        await cacheKey('mb:track', artist, album),
        `https://musicbrainz.org/ws/2/release/?query=artist:${encodeURIComponent(artist)}+release:${encodeURIComponent(album)}&fmt=json&limit=1`,
        604800
    );

    const mbid = mbData.releases?.[0]?.id;

    if (!mbid) {
        return null;
    }

    return `https://coverartarchive.org/release/${mbid}/front`;
};

export const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0';
export const LASTFM_USER = 'nyamelia';
