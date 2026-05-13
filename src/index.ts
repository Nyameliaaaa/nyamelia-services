import { getOrigin } from '@/lib/helpers';
import { queue } from '@/queue';
import discord from '@/routes/discord';
import guestbook from '@/routes/guestbook';
import lastFM from '@/routes/lastFM';
import message from '@/routes/message';
import statuses from '@/routes/statuses';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Bindings }>();
app.use(
    '*',
    cors({
        origin: getOrigin,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type']
    })
);

app.onError((err, c) => {
    console.error(`${err}, ${err.stack}`);

    return c.json(
        {
            name: err.name,
            msg: err.message,
            tip: 'try checking for malformed JSON'
        },
        500
    );
});

app.route('/api/guestbook', guestbook);
app.route('/api/lastfm', lastFM);
app.route('/api/message', message);
app.route('/api/discord', discord);
app.route('/api/statuses', statuses);

export default {
    fetch: app.fetch,
    queue
};
