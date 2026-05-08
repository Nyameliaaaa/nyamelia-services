import { isContact, isGuestbookEntry, isReport, QueuedMessage } from '@/lib/types';
import { REST } from '@discordjs/rest';
import { ButtonStyle, Routes } from 'discord-api-types/v10';
import { COLOR_VALUES, CONTACT_CHANNEL_ID, NEW_GUESTBOOK_ENTRY_CHANNEL_ID, REPORT_CHANNEL_ID } from './lib/consts';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from '@discordjs/builders';

export const queue: ExportedHandlerQueueHandler<Bindings, QueuedMessage> = async (batch, env) => {
    const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
    for (const message of batch.messages) {
        if (isGuestbookEntry(message.body)) {
            const embed = new EmbedBuilder()
                .setTitle(message.body.name)
                .setDescription(message.body.message)
                .setAuthor({ name: 'new guestbook entry :3' })
                .setFooter({ text: `#${message.body.id}` })
                .setColor(COLOR_VALUES[message.body.borderColor ?? 'pink']);

            const actionRow = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId(`newGuestbookEntry:reply:${message.body.id}`)
                    .setLabel('reply')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`newGuestbookEntry:delete:${message.body.id}`)
                    .setLabel('delete')
                    .setStyle(ButtonStyle.Danger)
            ]);

            if (message.body.url) {
                embed.addFields([{ name: 'url', value: message.body.url }]);

                actionRow.addComponents([
                    new ButtonBuilder().setLabel('site').setStyle(ButtonStyle.Link).setURL(message.body.url)
                ]);
            }

            if (message.body.email) {
                embed.addFields([{ name: 'email', value: message.body.email }]);

                actionRow.addComponents([
                    new ButtonBuilder()
                        .setLabel('mail')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`${message.body.workerUrl}/api/message/mail?to=${message.body.email}`)
                ]);
            }

            await rest.post(Routes.channelMessages(NEW_GUESTBOOK_ENTRY_CHANNEL_ID), {
                body: { embeds: [embed], components: [actionRow] }
            });
            message.ack();
        }

        if (isReport(message.body)) {
            const embed = new EmbedBuilder()
                .setTitle('new report')
                .setDescription(`${message.body.message ?? 'something ate shit and the reason is not given now'}`)
                .addFields([
                    { name: 'name', value: message.body.offendingEntry.name },
                    { name: 'message', value: message.body.offendingEntry.message }
                ])
                .setFooter({ text: `#${message.body.offendingEntry.id}` })
                .setColor(COLOR_VALUES[message.body.offendingEntry.borderColor ?? 'pink']);

            const actionRow = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId(`newGuestbookEntry:delete:${message.body.offendingEntry.id}`)
                    .setLabel('delete')
                    .setStyle(ButtonStyle.Danger)
            ]);

            if (message.body.offendingEntry.url) {
                embed.addFields([{ name: 'url', value: message.body.offendingEntry.url }]);

                actionRow.addComponents([
                    new ButtonBuilder()
                        .setLabel('site')
                        .setStyle(ButtonStyle.Link)
                        .setURL(message.body.offendingEntry.url)
                ]);
            }

            if (message.body.offendingEntry.email) {
                embed.addFields([{ name: 'email', value: message.body.offendingEntry.email }]);

                actionRow.addComponents([
                    new ButtonBuilder()
                        .setLabel('mail')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`${message.body.workerUrl}/api/message/mail?to=${message.body.offendingEntry.email}`)
                ]);
            }

            await rest.post(Routes.channelMessages(REPORT_CHANNEL_ID), {
                body: { embeds: [embed], components: [actionRow] }
            });
            message.ack();
        }

        if (isContact(message.body)) {
            const embed = new EmbedBuilder()
                .setTitle(message.body.name)
                .setDescription(message.body.message)
                .setAuthor({ name: 'new message ^^' })
                .setColor(COLOR_VALUES.pink);

            const actionRow = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setLabel('reply')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${message.body.workerUrl}/api/message/mail?to=${message.body.email}`)
            ]);

            await rest.post(Routes.channelMessages(CONTACT_CHANNEL_ID), {
                body: { embeds: [embed], components: [actionRow] }
            });
            message.ack();
        }
    }
};
