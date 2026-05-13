import { isValidEmail, sendDiscordPacket } from '@/lib/helpers';
import { MessagePacket, QueuedMessageType } from '@/lib/types';
import { Hono } from 'hono';

const message = new Hono<{ Bindings: Bindings }>();

message.post('/', async c => {
    const body = await c.req.json<MessagePacket>();

    if (!body.name) {
        c.status(422);

        return c.json({
            error: 'NO_NAME',
            description: 'A name is required'
        });
    }

    if (!body.message) {
        c.status(422);

        return c.json({
            error: 'NO_MESSAGE',
            description: 'A message is required'
        });
    }

    if (!body.email) {
        return c.json(
            {
                error: 'NO_EMAIL',
                description: 'an email is required'
            },
            422
        );
    }

    if (!isValidEmail(body.email)) {
        return c.json(
            {
                error: 'INVALID_EMAIL',
                description: 'that email is not a valid email'
            },
            422
        );
    }

    await sendDiscordPacket<MessagePacket>(c, { ...body, type: QueuedMessageType.Message });
    return c.json({ success: true }, 201);
});

message.get('/mail', async c => {
    const email = c.req.query('to');

    if (!email) {
        return c.json(
            {
                error: 'NO_EMAIL',
                description: 'an email is required'
            },
            422
        );
    }

    if (!isValidEmail(email)) {
        return c.json(
            {
                error: 'INVALID_EMAIL',
                description: 'that email is not a valid email'
            },
            422
        );
    }

    return c.redirect(`mailto:${email}`);
});

export default message;
