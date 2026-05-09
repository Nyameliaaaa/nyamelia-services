import { schema } from '@/db';

export enum QueuedMessageType {
    Report,
    GuestbookEntry,
    Message
}

type GuestbookEntry = typeof schema.guestbookEntries.$inferInsert;

export interface QueuedMessage {
    type: QueuedMessageType;
    workerUrl?: string;
}

export type GuestbookEntryPacket = GuestbookEntry & QueuedMessage;
export interface ReportPacket extends QueuedMessage {
    message: string;
    offendingEntry: GuestbookEntry;
}

export interface MessagePacket extends QueuedMessage {
    message: string;
    name: string;
    email: string;
}

export const isGuestbookEntry = (data: QueuedMessage): data is GuestbookEntryPacket => {
    return data.type === QueuedMessageType.GuestbookEntry;
};

export const isReport = (data: QueuedMessage): data is ReportPacket => {
    return data.type === QueuedMessageType.Report;
};

export const isMessage = (data: QueuedMessage): data is MessagePacket => {
    return data.type === QueuedMessageType.Message;
};
