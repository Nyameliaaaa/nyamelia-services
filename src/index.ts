import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getOrigin } from '@/lib/helpers';
import guestbook from '@/routes/guestbook';
import lastFM from '@/routes/lastFM';
export { queue } from '@/queue';

const app = new Hono<{ Bindings: Env }>();
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

app.onError((err, c) => {
    console.error(`${err}`);
    return c.json({
        name: err.name,
        msg: err.message,
        tip: 'Try checking for malformed JSON'
    });
});

export default app;
