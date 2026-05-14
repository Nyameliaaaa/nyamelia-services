import type { QueuedMessage } from '@/lib/types';
import {
    APIActionRowComponent,
    APIButtonComponent,
    APIButtonComponentWithCustomId,
    APIChatInputApplicationCommandInteraction,
    APIComponentInMessageActionRow,
    APIInteraction,
    APIMessageTopLevelComponent,
    APIModalSubmissionComponent,
    APIModalSubmitTextInputComponent,
    ComponentType,
    InteractionType,
    ModalSubmitComponent,
    ModalSubmitLabelComponent
} from 'discord-api-types/v10';
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

    if (/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin)) {
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

export const isLabel = (data?: APIModalSubmissionComponent): data is ModalSubmitLabelComponent => {
    return (data && 'type' in data && data.type === ComponentType.Label) ?? false;
};

export const isTextInput = (data: ModalSubmitComponent): data is APIModalSubmitTextInputComponent => {
    return data.type === ComponentType.TextInput;
};

export const isActionRow = (
    data: APIMessageTopLevelComponent
): data is APIActionRowComponent<APIComponentInMessageActionRow> => {
    return data.type === ComponentType.ActionRow;
};
export const isButton = (data: APIComponentInMessageActionRow): data is APIButtonComponent => {
    return data.type === ComponentType.Button;
};

export const isButtonWithCustomID = (data: APIComponentInMessageActionRow): data is APIButtonComponentWithCustomId => {
    return data.type === ComponentType.Button && 'custom_id' in data;
};

export const isSlashCommand = (data: APIInteraction): data is APIChatInputApplicationCommandInteraction => {
    return data.type === InteractionType.ApplicationCommand;
};

export const disableDelete = (component: APIMessageTopLevelComponent) => {
    if (!isActionRow(component)) {
        return component;
    }

    return {
        ...component,
        components: component.components.map(button => {
            if (isButtonWithCustomID(button)) {
                const disabled =
                    button.custom_id.startsWith('guestbookEntry:delete') ||
                    button.custom_id.startsWith('guestbookEntry:reply');

                return { ...button, disabled };
            }

            return button;
        })
    };
};
