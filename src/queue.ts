import { isGuestbookEntry, QueuedMessage } from '@/lib/types';

export const queue: ExportedHandlerQueueHandler<Env, QueuedMessage> = async (batch, env) => {
    for (const message of batch.messages) {
        if (isGuestbookEntry(message.body)) {
        }
        // send to discord here
        message.ack();
    }
};
