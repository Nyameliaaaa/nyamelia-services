import { createDb, schema } from '@/db';
import { EPHEMERAL } from '@/lib/consts';
import { disableDelete, isLabel, isTextInput } from '@/lib/helpers';
import { LabelBuilder, ModalBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { env } from 'cloudflare:workers';
import {
    isMessageComponentButtonInteraction,
    isMessageComponentInteraction,
    isModalSubmitInteraction
} from 'discord-api-types/utils/v10';
import {
    APIInteraction,
    InteractionResponseType,
    InteractionType,
    Routes,
    TextInputStyle
} from 'discord-api-types/v10';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import discordVerify from 'hono-discord-verify';

const discord = new Hono<{ Bindings: Bindings }>();
const db = createDb(env.NYAMELIA_SERVICES);
const guestbookEntries = schema.guestbookEntries;

discord.post('/', discordVerify(env.DISCORD_PUBLIC_KEY), async c => {
    const body = await c.req.json<APIInteraction>();
    const rest = new REST({ version: '10' }).setToken(c.env.DISCORD_TOKEN);

    if (body.type === InteractionType.Ping) {
        return c.json({ type: InteractionResponseType.Pong });
    }

    if (isMessageComponentInteraction(body) && isMessageComponentButtonInteraction(body)) {
        const [namespace, action, id] = body.data.custom_id.split(':');

        switch (namespace) {
            case 'guestbookEntry': {
                switch (action) {
                    case 'reply': {
                        const modal = new ModalBuilder()
                            .setCustomId(`guestbookReply:${id}`)
                            .setTitle('reply')
                            .addLabelComponents([
                                new LabelBuilder()
                                    .setLabel('reply')
                                    .setTextInputComponent(component =>
                                        component
                                            .setCustomId('guestbookReply.replyText')
                                            .setRequired()
                                            .setPlaceholder(':3')
                                            .setStyle(TextInputStyle.Paragraph)
                                    )
                            ]);

                        return c.json({
                            type: InteractionResponseType.Modal,
                            data: modal.toJSON()
                        });
                    }

                    case 'delete': {
                        try {
                            db.delete(guestbookEntries).where(eq(guestbookEntries.id, Number(id)));

                            c.executionCtx.waitUntil(
                                Promise.all([
                                    rest.patch(Routes.webhookMessage(body.application_id, body.token), {
                                        body: {
                                            content: 'this entry was deleted!',
                                            components: body.message.components?.map(disableDelete)
                                        }
                                    }),
                                    rest.post(Routes.webhook(body.application_id, body.token), {
                                        body: { content: `deleted #${id} ^^`, flags: EPHEMERAL }
                                    })
                                ])
                            );

                            return c.json({ type: InteractionResponseType.DeferredMessageUpdate });
                        } catch (e) {
                            console.error(e);
                            return c.json({
                                type: InteractionResponseType.ChannelMessageWithSource,
                                data: {
                                    flags: EPHEMERAL,
                                    content: 'something went wrong :('
                                }
                            });
                        }
                    }
                }
            }
        }
    } else if (isModalSubmitInteraction(body)) {
        const [modal, id] = body.data.custom_id.split(':');

        switch (modal) {
            case 'guestbookReply': {
                const reply = body.data.components.find(
                    x => isLabel(x) && x.component.custom_id === 'guestbookReply.replyText'
                );

                if (isLabel(reply) && isTextInput(reply.component)) {
                    try {
                        await db
                            .update(guestbookEntries)
                            .set({ ameliaReply: reply.component.value })
                            .where(eq(guestbookEntries.id, Number(id)));

                        return c.json({
                            type: InteractionResponseType.ChannelMessageWithSource,
                            data: {
                                flags: EPHEMERAL,
                                content: 'replied :p'
                            }
                        });
                    } catch (e) {
                        console.log(e);
                        return c.json({
                            type: InteractionResponseType.ChannelMessageWithSource,
                            data: {
                                flags: EPHEMERAL,
                                content: 'something went wrong :('
                            }
                        });
                    }
                }
            }
        }
    }

    c.status(422);
    return c.json({ error: 'WHAT', description: "how'd this happen" });
});

export default discord;
