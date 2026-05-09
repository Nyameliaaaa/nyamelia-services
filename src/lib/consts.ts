export const LASTFM_PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f';
export const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0';
export const LASTFM_USER = 'nyamelia';

export const TTL = {
    MUSICBRAINZ_MBID: 7 * 24 * 60 * 60, // 1 week,
    LASTFM_RECENT: 5 * 60, // 5 minutes
    LASTFM_TOP: 1 * 60 * 60 // 1 hour
};

export const COLOR_VALUES: Record<string, number> = {
    rosewater: 0xf4dbd6,
    flamingo: 0xf0c6c6,
    pink: 0xf5bde6,
    mauve: 0xc6a0f6,
    red: 0xed8796,
    maroon: 0xee99a0,
    peach: 0xf5a97f,
    yellow: 0xeed49f,
    green: 0xa6da95,
    teal: 0x8bd5ca,
    sky: 0x91d7e3,
    sapphire: 0x7dc4e4,
    blue: 0x8aadf4,
    lavender: 0xb7bdf8
};
export const CATPPUCCIN_MACCHIATO_COLORS = Object.keys(COLOR_VALUES);

export const NEW_GUESTBOOK_ENTRY_CHANNEL_ID = '1501499421983244338';
export const REPORT_CHANNEL_ID = '1501499446612066375';
export const CONTACT_CHANNEL_ID = '1502303477806923787';
export const EPHEMERAL = 1 << 6;
