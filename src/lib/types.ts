import { schema } from '@/db';

export enum QueuedMessageType {
    Report,
    GuestbookEntry,
    ContactMessage
}

type _GuestbookEntry = typeof schema.guestbookEntries.$inferInsert;

export interface QueuedMessage {
    type: QueuedMessageType;
}

export type GuestbookEntryPacket = _GuestbookEntry & QueuedMessage;
export interface ReportPacket extends QueuedMessage {
    reportMessage: string;
    id?: number;
}

export interface ContactPacket extends QueuedMessage {
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

export const isContact = (data: QueuedMessage): data is ReportPacket => {
    return data.type === QueuedMessageType.ContactMessage;
};
