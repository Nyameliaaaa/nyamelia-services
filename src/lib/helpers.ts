import type { QueuedMessage } from '@/lib/types';
import type { Context } from 'hono';

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
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

export const sendDiscordPacket = async <T extends QueuedMessage>(c: Context<{ Bindings: Bindings }>, object: T) => {
    await c.env.DISCORD_SEND_QUEUE.send({
        workerUrl: new URL(c.req.raw.url).origin,
        ...object
    } as T);
};
