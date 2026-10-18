import type { User, Chat, Message, CallRecord, StatusStory, ChannelItem, AdminReport } from '../types/index.ts';

export const INITIAL_USERS: User[] = [];

export const INITIAL_CHATS: Chat[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

export const INITIAL_CHANNELS: ChannelItem[] = [
  {
    id: 'chan_global',
    name: 'ChatTime Global Community',
    handle: 'global',
    description: 'The official international hub for ChatTime users. News, product updates, and discussions.',
    category: 'Community',
    avatar: '/src/assets/images/chattime_brand_logo_1790475904458.jpg',
    bannerUrl: '/src/assets/images/chattime_community_banner_1790475940372.jpg',
    creatorId: 'system',
    subscriberCount: 1,
    isSubscribed: false,
    isVerified: true,
    chatId: 'chat_global_community',
    members: [],
    memberRoles: {},
    announcements: [
      {
        id: 'cann_welcome',
        communityId: 'chan_global',
        title: 'Welcome to ChatTime',
        content: 'End-to-end encrypted messaging, peer-to-peer WebRTC calling, and PWA offline support are now live.',
        authorId: 'system',
        authorName: 'ChatTime',
        authorAvatar: '/src/assets/images/chattime_brand_logo_1790475904458.jpg',
        priority: 'important',
        timestamp: Date.now(),
      },
    ],
    posts: [],
  },
];

export const INITIAL_CALLS: CallRecord[] = [];

export const INITIAL_STATUSES: StatusStory[] = [];

export const INITIAL_REPORTS: AdminReport[] = [];
