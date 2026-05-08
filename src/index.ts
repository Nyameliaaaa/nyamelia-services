import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getOrigin } from '@/lib/helpers';
import guestbook from '@/routes/guestbook';
import lastFM from '@/routes/lastFM';
import message from '@/routes/message';
import { queue } from '@/queue';

const app = new Hono<{ Bindings: Bindings }>();
app.use(
    '*',
    cors({
        origin: getOrigin,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type']
    })
);

app.route('/api/guestbook', guestbook);
app.route('/api/lastfm', lastFM);
app.route('/api/message', message);

app.onError((err, c) => {
    console.error(`${err}`);
    return c.json({
        name: err.name,
        msg: err.message,
        tip: 'Try checking for malformed JSON'
    });
});

export default {
    fetch: app.fetch,
    queue
};
