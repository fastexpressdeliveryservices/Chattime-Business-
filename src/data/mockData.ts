import type { User, Chat, Message, CallRecord, StatusStory, ChannelItem, AdminReport } from '../types/index.ts';

export const INITIAL_USERS: User[] = [];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat_chattime_announcements',
    type: 'direct',
    name: 'ChatTime Announcements',
    avatar: '/icon.svg',
    folder: 'direct',
    participants: ['user_chattime_support'],
    isPinned: true,
    isVerified: true,
    unreadCount: 0,
    createdAt: Date.now(),
    lastMessage: {
      id: 'msg_announcement_welcome',
      chatId: 'chat_chattime_announcements',
      senderId: 'user_chattime_support',
      senderName: 'ChatTime Announcements',
      senderAvatar: '/icon.svg',
      type: 'text',
      content: '📢 Welcome to ChatTime! Official announcements, features, and system updates are published here.',
      timestamp: Date.now(),
      reactions: {},
      status: 'delivered',
    },
  },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  chat_chattime_announcements: [
    {
      id: 'msg_announcement_welcome',
      chatId: 'chat_chattime_announcements',
      senderId: 'user_chattime_support',
      senderName: 'ChatTime Announcements',
      senderAvatar: '/icon.svg',
      type: 'text',
      content: '📢 Welcome to ChatTime! Official announcements, features, and system updates are published here.',
      timestamp: Date.now(),
      reactions: {},
      status: 'delivered',
    },
  ],
};

export const INITIAL_CHANNELS: ChannelItem[] = [];

export const INITIAL_CALLS: CallRecord[] = [];

export const INITIAL_STATUSES: StatusStory[] = [];

export const INITIAL_REPORTS: AdminReport[] = [];
