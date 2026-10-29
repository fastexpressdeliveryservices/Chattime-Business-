import type { User, Chat, Message, CallRecord, StatusStory, ChannelItem, AdminReport } from '../types/index.ts';

export const INITIAL_USERS: User[] = [];

export const INITIAL_CHATS: Chat[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

export const INITIAL_CHANNELS: ChannelItem[] = [];

export const INITIAL_CALLS: CallRecord[] = [];

export const INITIAL_STATUSES: StatusStory[] = [];

export const INITIAL_REPORTS: AdminReport[] = [];
