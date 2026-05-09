import { isMessage, isGuestbookEntry, isReport, QueuedMessage } from '@/lib/types';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { ButtonStyle, Routes } from 'discord-api-types/v10';
import { COLOR_VALUES, CONTACT_CHANNEL_ID, NEW_GUESTBOOK_ENTRY_CHANNEL_ID, REPORT_CHANNEL_ID } from './lib/consts';

export const queue: ExportedHandlerQueueHandler<Bindings, QueuedMessage> = async (batch, env) => {
    const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
    for (const message of batch.messages) {
        const { body } = message;
        // SECTION - Guestbook Entry
        if (isGuestbookEntry(body)) {
            const embed = new EmbedBuilder()
                .setTitle(body.name)
                .setDescription(body.message)
                .setAuthor({ name: 'new guestbook entry :3' })
                .setFooter({ text: `#${body.id}` })
                .setColor(COLOR_VALUES[body.borderColor ?? 'pink']);

            const actionRow = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId(`guestbookEntry:reply:${body.id}`)
                    .setLabel('reply')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`guestbookEntry:delete:${body.id}`)
                    .setLabel('delete')
                    .setStyle(ButtonStyle.Danger)
            ]);

            if (body.url) {
                embed.addFields([{ name: 'url', value: body.url }]);

                actionRow.addComponents([
                    new ButtonBuilder().setLabel('site').setStyle(ButtonStyle.Link).setURL(body.url)
                ]);
            }

            if (body.email) {
                embed.addFields([{ name: 'email', value: body.email }]);

                actionRow.addComponents([
                    new ButtonBuilder()
                        .setLabel('mail')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`${body.workerUrl}/api/message/mail?to=${body.email}`)
                ]);
            }

            await rest.post(Routes.channelMessages(NEW_GUESTBOOK_ENTRY_CHANNEL_ID), {
                body: { embeds: [embed], components: [actionRow] }
            });

            message.ack();
            // !SECTION
        } else if (isReport(body)) {
            // SECTION - Report
            const { offendingEntry } = body;

            const embed = new EmbedBuilder()
                .setTitle('new report')
                .setDescription(`${body.message}`)
                .addFields([
                    { name: 'name', value: offendingEntry.name },
                    { name: 'message', value: offendingEntry.message }
                ])
                .setFooter({ text: `#${offendingEntry.id}` })
                .setColor(COLOR_VALUES[offendingEntry.borderColor ?? 'pink']);

            const actionRow = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId(`guestbookEntry:delete:${offendingEntry.id}`)
                    .setLabel('delete')
                    .setStyle(ButtonStyle.Danger)
            ]);

            if (offendingEntry.url) {
                embed.addFields([{ name: 'url', value: offendingEntry.url }]);

                actionRow.addComponents([
                    new ButtonBuilder().setLabel('site').setStyle(ButtonStyle.Link).setURL(offendingEntry.url)
                ]);
            }

            if (offendingEntry.email) {
                embed.addFields([{ name: 'email', value: offendingEntry.email }]);

                actionRow.addComponents([
                    new ButtonBuilder()
                        .setLabel('mail')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`${body.workerUrl}/api/message/mail?to=${offendingEntry.email}`)
                ]);
            }

            await rest.post(Routes.channelMessages(REPORT_CHANNEL_ID), {
                body: { embeds: [embed], components: [actionRow] }
            });

            message.ack();
            // !SECTION
        } else if (isMessage(body)) {
            // SECTION - Contact
            const embed = new EmbedBuilder()
                .setTitle(body.name)
                .setDescription(body.message)
                .setAuthor({ name: 'new message ^^' })
                .setFields({ name: 'email', value: body.email })
                .setColor(COLOR_VALUES.pink);

            const actionRow = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setLabel('reply')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${body.workerUrl}/api/message/mail?to=${body.email}`)
            ]);

            await rest.post(Routes.channelMessages(CONTACT_CHANNEL_ID), {
                body: { embeds: [embed], components: [actionRow] }
            });

            message.ack();
            // !SECTION
        }
    }
};
