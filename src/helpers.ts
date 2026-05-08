export const getOrigin = (origin: string) => {
    if (!origin) {
        return null;
    }

    const allowed = ['http://localhost:4321', 'https://nyamelia.pages.dev', 'https://nyamelia.is-immensely.gay'];

    if (allowed.includes(origin)) {
        return origin;
    }

    if (/^https:\/\/[a-z0-9-]+\.nyamelia\.pages\.dev$/.test(origin)) {
        return origin;
    }

    return null;
};

export const isValidEmail = (email: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
};

export const CATPPUCCIN_MACCHIATO_COLORS = [
    'rosewater',
    'flamingo',
    'pink',
    'mauve',
    'red',
    'maroon',
    'peach',
    'yellow',
    'green',
    'teal',
    'sky',
    'sapphire',
    'blue',
    'lavender'
];
