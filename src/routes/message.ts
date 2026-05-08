import { sendDiscordPacket, isValidEmail } from '@/lib/helpers';
import { ContactPacket, QueuedMessageType } from '@/lib/types';
import { Hono } from 'hono';

const message = new Hono<{ Bindings: Bindings }>();

message.post('/', async c => {
    const body = await c.req.json<ContactPacket>();

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
        c.status(422);

        return c.json({
            error: 'NO_EMAIL',
            description: 'An email is required'
        });
    }

    if (!isValidEmail(body.email)) {
        c.status(422);

        return c.json({
            error: 'INVALID_EMAIL',
            description: 'The email is not a valid email'
        });
    }

    await sendDiscordPacket<ContactPacket>(c, { ...body, type: QueuedMessageType.ContactMessage });

    c.status(201);
    return c.json({ success: true });
});

message.get('/mail', async c => {
    const email = c.req.query('to');
    console.log(email);

    if (!email) {
        c.status(422);

        return c.json({
            error: 'NO_EMAIL',
            description: 'An email is required'
        });
    }

    if (!isValidEmail(email)) {
        c.status(422);

        return c.json({
            error: 'INVALID_EMAIL',
            description: 'The email is not a valid email'
        });
    }

    return c.redirect(`mailto:${email}`);
});

export default message;
