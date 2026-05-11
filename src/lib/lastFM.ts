import { LASTFM_PLACEHOLDER_HASH, TTL } from '@/lib/consts';
import { env } from 'cloudflare:workers';

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

const getImage = async (artist: string, release: string, lastfmImage: string | null, key: string) => {
    if (lastfmImage && !lastfmImage.includes(LASTFM_PLACEHOLDER_HASH)) {
        return lastfmImage;
    }

    try {
        const mbData = await cachedFetch(
            env.LASTFM_CACHE,
            await cacheKey(key, artist, release),
            `https://musicbrainz.org/ws/2/release/?query=artist:${encodeURIComponent(artist)}+release:${encodeURIComponent(release)}&fmt=json&limit=1`,
            TTL.MUSICBRAINZ_MBID
        );

        const mbid = mbData.releases?.[0]?.id;
        if (!mbid) {
            return null;
        }

        return `https://coverartarchive.org/release/${mbid}/front`;
    } catch (e) {
        return lastfmImage;
    }
};

export const getTrackImage = async (artist: string, track: string, lastfmImage: string | null) => {
    return await getImage(artist, track, lastfmImage, 'mb:track');
};

export const getAlbumImage = async (artist: string, album: string, lastfmImage: string | null) => {
    return await getImage(artist, album, lastfmImage, 'mb:album');
};
