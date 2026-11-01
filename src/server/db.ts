import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import type {
  User,
  Chat,
  Message,
  CallRecord,
  StatusStory,
  ChannelItem,
  ChannelPost,
  ChannelComment,
  CommunityAnnouncement,
  AdminReport,
  SystemAnnouncement,
  AccountBoundingDetails,
  AdminAuditLog,
  PlatformFeatureSettings,
  AdminRole,
  UserRole,
  AdminPermission,
  VoiceSubscription,
  VoiceAiPlatformConfig,
} from '../types/index.ts';
import {
  INITIAL_USERS,
  INITIAL_CHATS,
  INITIAL_MESSAGES,
  INITIAL_CHANNELS,
  INITIAL_STATUSES,
  INITIAL_CALLS,
} from '../data/mockData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = process.env.CHATTIME_DB_FILE
  ? path.resolve(process.env.CHATTIME_DB_FILE)
  : path.resolve(DEFAULT_DATA_DIR, 'chattime_db.json');
const DATA_DIR = path.dirname(DB_FILE);

const DEFAULT_PLATFORM_FEATURES: PlatformFeatureSettings = {
  allowRegistration: true,
  allowMessaging: true,
  allowCalls: true,
  allowVideoCalls: true,
  allowGroupCalls: true,
  allowGroups: true,
  allowCommunities: true,
  allowVoiceNotes: true,
  allowVoiceChanger: true,
  allowFileSharing: true,
  allowMediaSharing: true,
  allowReactions: true,
  allowStories: true,
  allowNotifications: true,
  voiceEffectsEnabled: true,
  voiceModifiers: ['American 🇺🇸', 'British 🇬🇧', 'Indian 🇮🇳', 'Asian 🌏', 'Australian 🇦🇺', 'Jamaican 🇯🇲'],
};

export function hashPin(pin: string): string {
  const value = String(pin ?? '').trim();
  if (!value) return '';
  const salt = process.env.CHATTIME_PIN_SECRET || 'chattime-pin-default-secret';
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

export function normalizePin(pin: string | undefined): string {
  const value = typeof pin === 'string' ? pin.trim() : '';
  if (!value) return '';
  if (/^[a-f0-9]{64}$/i.test(value)) return value;
  return hashPin(value);
}

export function verifyPin(pin: string | undefined, expectedHash?: string): boolean {
  const candidate = typeof pin === 'string' ? pin.trim() : '';
  const expected = typeof expectedHash === 'string' ? expectedHash.trim() : '';
  if (!candidate || !expected) return false;
  const hashed = normalizePin(candidate);
  return hashed === expected || hashPin(candidate) === expected;
}

export interface ChatTimeDatabase {
  users: User[];
  chats: Chat[];
  messages: Record<string, Message[]>;
  calls: CallRecord[];
  stories: StatusStory[];
  statusHistory: StatusStory[];
  channels: ChannelItem[];
  reports: AdminReport[];
  announcements: SystemAnnouncement[];
  otpCodes: Record<string, { code: string; phone: string; expiresAt: number }>;
  auditLogs: AdminAuditLog[];
  pushSubscriptions: Record<string, StoredPushSubscription[]>;
  authSessions: Record<string, { userId: string; expiresAt: number }>;
  platformFeatures: PlatformFeatureSettings;
  voiceSubscriptions?: Record<string, VoiceSubscription>;
  voiceUsageStats?: {
    totalTTSCalls: number;
    totalTTSChars: number;
    activeSubscriptions: number;
    estimatedCostUsd: number;
  };
  voiceAdminConfig?: VoiceAiPlatformConfig;
  maintenanceMode?: boolean;
  welcomeSettings?: {
    enabled: boolean;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    messageText: string;
  };
}

export const DEFAULT_VOICE_AI_CONFIG: VoiceAiPlatformConfig = {
  enabled: true,
  provider: 'webaudio_neural',
  allowFreePreviews: true,
  plans: {
    weekly: { priceNgn: 1000, days: 7, label: 'Weekly Voice Pass (7 Days)' },
    monthly: { priceNgn: 6000, days: 30, label: 'Monthly Voice Pro (30 Days)' },
    yearly: { priceNgn: 20000, days: 365, label: 'Yearly Voice Unlimited (365 Days)' },
  },
};

export const DEFAULT_WELCOME_SETTINGS = {
  enabled: true,
  senderId: 'user_chattime_support',
  senderName: 'ChatTime Support',
  senderAvatar: '/icon.svg',
  messageText: 'Hello! Welcome to ChatTime Business. We are delighted to have you. If you need any assistance, have questions, or want to explore features, reply here anytime. End-to-end encrypted support is available 24/7.',
};

export interface StoredPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

class DatabaseManager {
  private db: ChatTimeDatabase;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('[DB] Failed to create data dir:', err);
      }
    }
  }

  private loadDatabase(): ChatTimeDatabase {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed.users)) {
          const loaded: ChatTimeDatabase = {
            users: parsed.users,
            chats: parsed.chats || [],
            messages: parsed.messages || {},
            calls: parsed.calls || [],
            stories: parsed.stories || [],
            statusHistory: parsed.statusHistory || [],
            channels: parsed.channels || [],
            reports: parsed.reports || [],
            announcements: parsed.announcements || [],
            otpCodes: parsed.otpCodes || {},
            auditLogs: parsed.auditLogs || [],
            pushSubscriptions: parsed.pushSubscriptions || {},
            authSessions: parsed.authSessions || {},
            platformFeatures: { ...DEFAULT_PLATFORM_FEATURES, ...(parsed.platformFeatures || {}) },
            voiceSubscriptions: parsed.voiceSubscriptions || {},
            voiceUsageStats: parsed.voiceUsageStats || { totalTTSCalls: 0, totalTTSChars: 0, activeSubscriptions: 0, estimatedCostUsd: 0 },
            voiceAdminConfig: parsed.voiceAdminConfig || { ...DEFAULT_VOICE_AI_CONFIG },
            maintenanceMode: Boolean(parsed.maintenanceMode),
            welcomeSettings: parsed.welcomeSettings || { ...DEFAULT_WELCOME_SETTINGS },
          };
          this.migrateLegacyPinHashes(loaded);
          this.ensureAdminAndOfficialChannel(loaded);
          this.persist(loaded);
          return loaded;
        }
      } catch (err) {
        console.warn('[DB] Failed to parse db file, initializing seed DB:', err);
      }
    }

    const seedDatabase = !process.env.CHATTIME_DB_FILE;
    const initialDb: ChatTimeDatabase = {
      users: seedDatabase ? [...INITIAL_USERS] : [],
      chats: seedDatabase ? [...INITIAL_CHATS] : [],
      messages: seedDatabase ? { ...INITIAL_MESSAGES } : {},
      calls: seedDatabase ? [...INITIAL_CALLS] : [],
      stories: seedDatabase ? [...INITIAL_STATUSES] : [],
      statusHistory: [],
      channels: seedDatabase ? [...INITIAL_CHANNELS] : [],
      reports: [],
      announcements: [],
      otpCodes: {},
      auditLogs: [],
      pushSubscriptions: {},
      authSessions: {},
      platformFeatures: { ...DEFAULT_PLATFORM_FEATURES },
      voiceSubscriptions: {},
      voiceUsageStats: { totalTTSCalls: 0, totalTTSChars: 0, activeSubscriptions: 0, estimatedCostUsd: 0 },
      voiceAdminConfig: { ...DEFAULT_VOICE_AI_CONFIG },
      maintenanceMode: false,
      welcomeSettings: { ...DEFAULT_WELCOME_SETTINGS },
    };

    this.migrateLegacyPinHashes(initialDb);
    this.ensureAdminAndOfficialChannel(initialDb);
    this.persist(initialDb);
    return initialDb;
  }

  private migrateLegacyPinHashes(database: ChatTimeDatabase) {
    for (const user of database.users) {
      const rawPin = user.securitySettings?.pinCode;
      if (typeof rawPin === 'string' && rawPin.trim()) {
        user.securitySettings = {
          ...user.securitySettings,
          pinCode: normalizePin(rawPin),
          pinEnabled: Boolean(rawPin),
        };
      }
    }
  }

  private ensureAdminAndOfficialChannel(database: ChatTimeDatabase) {
    const ADMIN_EMAILS = [
      'prosperikeokwu@gmail.com',
    ];

    // 1. Ensure ONLY prosperikeokwu@gmail.com is super_admin. Demote all unchosen admin accounts to regular users.
    database.users = database.users.map((u) => {
      const isProsper = u.id === 'user_admin_prosper' || u.username === 'prosperikeokwu';
      if (isProsper) {
        return {
          ...u,
          id: 'user_admin_prosper',
          name: 'Prosper Ikeokwu',
          username: 'prosperikeokwu',
          email: 'prosperikeokwu@gmail.com',
          role: 'super_admin' as const,
          isVerified: true,
          isRedVerified: true,
          verificationBadge: 'red',
          verificationBadgeType: 'red',
        };
      }
      // If another account had prosperikeokwu@gmail.com attached, clear it so there is only one
      if (u.email && u.email.toLowerCase().trim() === 'prosperikeokwu@gmail.com') {
        u.email = undefined;
      }
      // Demote unchosen admin accounts
      if (u.role === 'super_admin' || u.role === 'admin') {
        u.role = 'user';
        u.isRedVerified = false;
        u.verificationBadge = 'none';
        u.verificationBadgeType = 'none';
      }
      return u;
    });

    // 1a. Ensure Prosper Ikeokwu super admin account exists
    let prosperUser = database.users.find(
      (u) =>
        u.id === 'user_admin_prosper' ||
        u.username === 'prosperikeokwu' ||
        (u.email && u.email.toLowerCase() === 'prosperikeokwu@gmail.com')
    );
    if (!prosperUser) {
      prosperUser = {
        id: 'user_admin_prosper',
        name: 'Prosper Ikeokwu',
        username: 'prosperikeokwu',
        email: 'prosperikeokwu@gmail.com',
        phoneNumber: '+15550199000',
        chatTimeNumber: '+1 (555) 019-9000',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=prosperikeokwu&backgroundColor=b91c1c',
        bio: 'Chat Time Official Administrator',
        statusFeeling: '🛡️ Super Admin',
        phonePrivate: false,
        isOnline: true,
        lastSeen: Date.now(),
        createdAt: Date.now(),
        role: 'super_admin',
        isVerified: true,
        isRedVerified: true,
        verificationBadge: 'red',
        verificationBadgeType: 'red',
        contacts: [],
        privacySettings: {
          lastSeenVisibility: 'everyone',
          numberVisibility: 'everyone',
          statusVisibility: 'everyone',
          readReceipts: true,
          discoverable: true,
          whoCanCallMe: 'everyone',
        },
        securitySettings: {
          twoFactorEnabled: true,
          pinEnabled: false,
          biometricSupported: true,
          activeSessions: [],
        },
        notificationSettings: {
          messagePreviews: true,
          soundEffects: true,
          callRingtone: true,
          ringtoneStyle: 'harmonic',
          ringtoneVolume: 90,
          communityAlerts: true,
        },
      };
      database.users.unshift(prosperUser);
    } else {
      prosperUser.role = 'super_admin';
      prosperUser.email = 'prosperikeokwu@gmail.com';
      prosperUser.name = 'Prosper Ikeokwu';
      prosperUser.username = 'prosperikeokwu';
      prosperUser.isVerified = true;
      prosperUser.isRedVerified = true;
      prosperUser.verificationBadge = 'red';
      prosperUser.verificationBadgeType = 'red';
      if (!prosperUser.chatTimeNumber) prosperUser.chatTimeNumber = '+1 (555) 019-9000';
      if (!prosperUser.phoneNumber) prosperUser.phoneNumber = '+15550199000';
    }

    // 1b. Ensure Fast Express account exists as regular registered user (admins added by super admin)
    let fastExpressUser = database.users.find(
      (u) =>
        u.id === 'user_fastexpress' ||
        u.id === 'user_admin_fastexpress' ||
        u.username === 'fastexpress' ||
        u.username === 'fastexpress_admin' ||
        (u.email && u.email.toLowerCase() === 'fastexpressdeliveryservices00@gmail.com')
    );
    if (!fastExpressUser) {
      fastExpressUser = {
        id: 'user_fastexpress',
        name: 'Fast Express',
        username: 'fastexpress',
        email: 'fastexpressdeliveryservices00@gmail.com',
        phoneNumber: '+15550199001',
        chatTimeNumber: '+1 (555) 019-9001',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fastexpress&backgroundColor=0284c7',
        bio: 'Fast Express Delivery Services',
        statusFeeling: 'Available on ChatTime',
        phonePrivate: false,
        isOnline: true,
        lastSeen: Date.now(),
        createdAt: Date.now(),
        role: 'user',
        isVerified: false,
        isRedVerified: false,
        verificationBadge: 'none',
        verificationBadgeType: 'none',
        contacts: [],
        privacySettings: {
          lastSeenVisibility: 'everyone',
          numberVisibility: 'everyone',
          statusVisibility: 'everyone',
          readReceipts: true,
          discoverable: true,
          whoCanCallMe: 'everyone',
        },
        securitySettings: {
          twoFactorEnabled: false,
          pinEnabled: false,
          biometricSupported: true,
          activeSessions: [],
        },
        notificationSettings: {
          messagePreviews: true,
          soundEffects: true,
          callRingtone: true,
          ringtoneStyle: 'harmonic',
          ringtoneVolume: 90,
          communityAlerts: true,
        },
      };
      database.users.push(fastExpressUser);
    } else {
      if (!fastExpressUser.chatTimeNumber) fastExpressUser.chatTimeNumber = '+1 (555) 019-9001';
      if (!fastExpressUser.phoneNumber) fastExpressUser.phoneNumber = '+15550199001';
    }

    // 2. Ensure Official ChatTime Support account exists with RED TICK
    const supportUserId = 'user_chattime_support';
    let supportUser = database.users.find(
      (u) => u.id === supportUserId || u.username === 'chattimesupport' || u.username === 'support'
    );
    if (!supportUser) {
      supportUser = {
        id: supportUserId,
        name: 'ChatTime Support',
        username: 'support',
        email: 'support@chattime.com',
        phoneNumber: '+18002428846',
        chatTimeNumber: '+1 (800) 242-8846',
        avatar: '/icon.svg',
        bio: 'Official ChatTime Support & Help Desk. Here to assist you 24/7.',
        statusFeeling: '🔴 Official Support • Red Tick Verified',
        phonePrivate: false,
        isOnline: true,
        lastSeen: Date.now(),
        createdAt: Date.now(),
        role: 'admin',
        isVerified: true,
        isRedVerified: true,
        verificationBadge: 'red',
        verificationBadgeType: 'red',
        contacts: [],
        privacySettings: {
          lastSeenVisibility: 'everyone',
          numberVisibility: 'everyone',
          statusVisibility: 'everyone',
          readReceipts: true,
          discoverable: true,
          whoCanCallMe: 'everyone',
        },
        securitySettings: {
          twoFactorEnabled: false,
          pinEnabled: false,
          biometricSupported: true,
          activeSessions: [],
        },
        notificationSettings: {
          messagePreviews: true,
          soundEffects: true,
          callRingtone: true,
          ringtoneStyle: 'harmonic',
          ringtoneVolume: 90,
          communityAlerts: true,
        },
      };
      database.users.push(supportUser);
    } else {
      supportUser.isVerified = true;
      supportUser.isRedVerified = true;
      supportUser.verificationBadge = 'red';
      supportUser.verificationBadgeType = 'red';
      supportUser.name = 'ChatTime Support';
      supportUser.email = 'support@chattime.com';
      supportUser.avatar = '/icon.svg';
    }

    // 3. Remove old "member" broadcast announcement channel if present
    database.chats = database.chats.filter(
      (c) => c.id !== 'chat_chattime_official'
    );
    delete database.messages['chat_chattime_official'];

    // 4. Ensure 1-on-1 ChatTime Support chat with Red Tick is ready as a normal messaging chat
    const supportChatId = 'chat_chattime_support';
    let supportChat = database.chats.find((c) => c.id === supportChatId);
    if (!supportChat) {
      const newSupportChat: Chat = {
        id: supportChatId,
        type: 'direct',
        name: 'ChatTime Support',
        avatar: '/icon.svg',
        folder: 'direct',
        participants: [supportUserId],
        isPinned: true,
        isVerified: true,
        unreadCount: 0,
        createdAt: Date.now(),
        lastMessage: {
          id: 'msg_support_welcome',
          chatId: supportChatId,
          senderId: supportUserId,
          senderName: 'ChatTime Support',
          senderAvatar: '/icon.svg',
          type: 'text',
          content: 'Hello! Welcome to ChatTime Support. How can we help you today? Send a message here anytime.',
          timestamp: Date.now(),
          reactions: {},
          status: 'delivered',
        },
      };
      database.chats.unshift(newSupportChat);
      if (!database.messages[supportChatId]) {
        database.messages[supportChatId] = [
          {
            id: 'msg_support_welcome',
            chatId: supportChatId,
            senderId: supportUserId,
            senderName: 'ChatTime Support',
            senderAvatar: '/icon.svg',
            type: 'text',
            content: 'Hello! Welcome to ChatTime Support. How can we help you today? Send a message here anytime.',
            timestamp: Date.now(),
            reactions: {},
            status: 'delivered',
          },
        ];
      }
    } else {
      supportChat.name = 'ChatTime Support';
      supportChat.avatar = '/icon.svg';
      supportChat.isVerified = true;
      supportChat.type = 'direct';
      if (!supportChat.participants.includes(supportUserId)) {
        supportChat.participants.push(supportUserId);
      }
    }

    // 5. Remove channel-like announcements chat so it doesn't clutter direct chats
    database.chats = database.chats.filter(
      (c) => c.id !== 'chat_chattime_announcements' && c.id !== 'chat_chattime_official'
    );
    delete database.messages['chat_chattime_announcements'];
    delete database.messages['chat_chattime_official'];

    // 6. Remove channel chan_global if it has the welcome message so welcome is an announcement only
    database.channels = (database.channels || []).filter(
      (ch) => ch.id !== 'chan_global'
    );
  }

  private persist(dbToSave: ChatTimeDatabase) {
    try {
      this.ensureDataDir();
      const tempPath = DB_FILE + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(dbToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Failed to write to disk:', err);
    }
  }

  public save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persist(this.db);
    }, 250);
  }

  // --- Users ---
  getUsers(): User[] {
    return this.db.users;
  }

  getUserById(id: string): User | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    return this.db.users.find((u) => u.username.toLowerCase() === clean);
  }

  getUserByNumber(num: string): User | undefined {
    const cleanNum = num.replace(/[\s\-()]/g, '');
    const digitsOnly = num.replace(/[^0-9]/g, '');
    if (!cleanNum && !digitsOnly) return undefined;
    return this.db.users.find((u) => {
      const uChat = (u.chatTimeNumber || '').replace(/[\s\-()]/g, '');
      const uPhone = (u.phoneNumber || '').replace(/[\s\-()]/g, '');
      const uChatDigits = (u.chatTimeNumber || '').replace(/[^0-9]/g, '');
      const uPhoneDigits = (u.phoneNumber || '').replace(/[^0-9]/g, '');
      return (
        uChat === cleanNum ||
        uPhone === cleanNum ||
        (digitsOnly.length >= 3 && (uChatDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uChatDigits))) ||
        (digitsOnly.length >= 3 && (uPhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uPhoneDigits)))
      );
    });
  }

  getPushSubscriptions(userId: string): StoredPushSubscription[] {
    return this.db.pushSubscriptions?.[userId] || [];
  }

  savePushSubscription(userId: string, subscription: StoredPushSubscription): void {
    if (!this.db.pushSubscriptions) this.db.pushSubscriptions = {};
    for (const [ownerId, subscriptions] of Object.entries(this.db.pushSubscriptions)) {
      this.db.pushSubscriptions[ownerId] = subscriptions.filter(
        (item) => item.endpoint !== subscription.endpoint
      );
    }
    const current = this.db.pushSubscriptions[userId] || [];
    this.db.pushSubscriptions[userId] = [...current, subscription].slice(-10);
    this.save();
  }

  removePushSubscription(userId: string, endpoint: string): void {
    if (!this.db.pushSubscriptions?.[userId]) return;
    this.db.pushSubscriptions[userId] = this.db.pushSubscriptions[userId].filter(
      (item) => item.endpoint !== endpoint
    );
    this.save();
  }

  removePushSubscriptionEndpoint(endpoint: string): void {
    if (!this.db.pushSubscriptions) return;
    for (const [userId, subscriptions] of Object.entries(this.db.pushSubscriptions)) {
      this.db.pushSubscriptions[userId] = subscriptions.filter(
        (item) => item.endpoint !== endpoint
      );
    }
    this.save();
  }

  addAuthSession(tokenHash: string, userId: string, expiresAt: number): void {
    if (!this.db.authSessions) this.db.authSessions = {};
    const now = Date.now();
    for (const [hash, session] of Object.entries(this.db.authSessions)) {
      if (session.expiresAt <= now) delete this.db.authSessions[hash];
    }
    this.db.authSessions[tokenHash] = { userId, expiresAt };
    this.persist(this.db);
  }

  getAuthSession(tokenHash: string): { userId: string; expiresAt: number } | undefined {
    const session = this.db.authSessions?.[tokenHash];
    if (!session || session.expiresAt <= Date.now()) {
      if (session) this.removeAuthSession(tokenHash);
      return undefined;
    }
    return session;
  }

  removeAuthSession(tokenHash: string): void {
    if (!this.db.authSessions?.[tokenHash]) return;
    delete this.db.authSessions[tokenHash];
    this.persist(this.db);
  }

  searchUsers(query: string): User[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    const digitsOnly = clean.replace(/[^0-9]/g, '');
    const cleanUser = clean.replace(/^@/, '').trim();

    return this.db.users.filter((u) => {
      const uId = (u.id || '').toLowerCase();
      const uUser = (u.username || '').toLowerCase();
      const uName = (u.name || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uChatDigits = (u.chatTimeNumber || '').replace(/[^0-9]/g, '');
      const uPhoneDigits = (u.phoneNumber || '').replace(/[^0-9]/g, '');

      // 1. Direct ID match
      if (uId === clean) return true;

      // 2. Username match (exact or partial, min 2 chars)
      if (cleanUser.length >= 2 && (uUser === cleanUser || uUser.startsWith(cleanUser) || uUser.includes(cleanUser))) {
        return true;
      }

      // 3. Display name match (min 2 chars)
      if (clean.length >= 2 && (uName === clean || uName.includes(clean))) {
        return true;
      }

      // 4. Email match
      if (clean.length >= 3 && uEmail.includes(clean)) {
        return true;
      }

      // 5. Phone / ChatTime Number match (min 2 digits to support real-time keypad dialing)
      if (digitsOnly.length >= 2) {
        if (
          uChatDigits.includes(digitsOnly) ||
          uPhoneDigits.includes(digitsOnly) ||
          digitsOnly.includes(uChatDigits) ||
          digitsOnly.includes(uPhoneDigits)
        ) {
          return true;
        }
      }

      return false;
    });
  }

  addUser(user: User): User {
    if (user.securitySettings?.pinCode) {
      user.securitySettings = {
        ...user.securitySettings,
        pinCode: normalizePin(user.securitySettings.pinCode),
        pinEnabled: Boolean(user.securitySettings.pinCode),
      };
    }

    const ADMIN_EMAILS = [
      'prosperikeokwu@gmail.com',
    ];
    const isTargetAdmin = Boolean(
      user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())
    );
    const staffRoles = ['super_admin', 'admin', 'moderator', 'support', 'analyst'];
    if (isTargetAdmin) {
      user.role = user.role === 'super_admin' ? 'super_admin' : 'super_admin';
      user.isVerified = true;
      user.isRedVerified = true;
      user.verificationBadge = 'red';
      user.verificationBadgeType = 'red';
    } else if (staffRoles.includes(user.role)) {
      // Keep assigned staff role and badge
      user.isVerified = true;
      if (!user.verificationBadge || user.verificationBadge === 'none') {
        user.verificationBadge = user.role === 'super_admin' || user.role === 'admin' ? 'red' : 'blue';
      }
    } else {
      user.role = 'user';
      // Only admin can put verification badge - all regular users register unverified
      user.isVerified = false;
      user.isRedVerified = false;
      user.verificationBadge = 'none';
      user.verificationBadgeType = 'none';
    }

    if (!Array.isArray(user.contacts)) {
      user.contacts = [];
    }

    this.db.users.push(user);
    if (user.role !== 'admin' && user.id !== 'user_chattime_support') {
      this.createWelcomeChatForUser(user);
    }
    this.persist(this.db);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const nextUser = { ...this.db.users[idx], ...updates };
    if (nextUser.securitySettings?.pinCode) {
      nextUser.securitySettings = {
        ...nextUser.securitySettings,
        pinCode: normalizePin(nextUser.securitySettings.pinCode),
        pinEnabled: Boolean(nextUser.securitySettings.pinCode),
      };
    }
    this.db.users[idx] = nextUser;

    // Cascade avatar and name changes everywhere across messages, calls, and stories
    if (updates.avatar || updates.name) {
      const newAvatar = updates.avatar;
      const newName = updates.name;

      // Update in all chat messages
      for (const chatId of Object.keys(this.db.messages)) {
        const msgList = this.db.messages[chatId];
        if (Array.isArray(msgList)) {
          for (const msg of msgList) {
            if (msg.senderId === id) {
              if (newAvatar) msg.senderAvatar = newAvatar;
              if (newName) msg.senderName = newName;
            }
          }
        }
      }

      // Update in call history
      for (const call of this.db.calls) {
        if (call.callerId === id) {
          if (newAvatar) call.callerAvatar = newAvatar;
          if (newName) call.callerName = newName;
        }
        if (call.receiverId === id) {
          if (newAvatar) call.receiverAvatar = newAvatar;
          if (newName) call.receiverName = newName;
        }
      }

      // Update in status stories
      for (const story of this.db.stories) {
        if (story.userId === id) {
          if (newAvatar) story.userAvatar = newAvatar;
          if (newName) story.userName = newName;
        }
      }
    }

    this.save();
    return this.db.users[idx];
  }

  addContact(userId: string, targetUserId: string): User | null {
    if (!userId || !targetUserId || userId === targetUserId) return null;
    const user = this.getUserById(userId);
    const target = this.getUserById(targetUserId);
    if (!user || !target) return null;

    if (!Array.isArray(user.contacts)) user.contacts = [];
    if (!user.contacts.includes(targetUserId)) {
      user.contacts.push(targetUserId);
    }

    // Ensure contact relationship is established mutually for both users
    if (!Array.isArray(target.contacts)) target.contacts = [];
    if (!target.contacts.includes(userId)) {
      target.contacts.push(userId);
    }

    this.save();
    return user;
  }

  removeContact(userId: string, targetUserId: string): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    if (Array.isArray(user.contacts)) {
      user.contacts = user.contacts.filter((id) => id !== targetUserId);
    }
    this.save();
    return user;
  }

  boundUser(
    id: string,
    boundingDetails: AccountBoundingDetails,
    isBanned: boolean
  ): User | null {
    const user = this.getUserById(id);
    if (!user) return null;
    user.isBanned = isBanned;
    user.isBounded = true;
    user.boundingDetails = boundingDetails;
    this.addAuditLog({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      adminId: boundingDetails.boundedBy,
      adminName: boundingDetails.boundedBy,
      action: isBanned ? 'ACCOUNT_BANNED_BOUNDED' : 'COMMUNICATIONS_RESTRICTED',
      targetId: id,
      targetName: `${user.name} (@${user.username})`,
      details: `Scope: ${boundingDetails.scope}. Reason: ${boundingDetails.reason}. Duration: ${boundingDetails.duration}`,
    });
    this.save();
    return user;
  }

  unboundUser(id: string, adminName: string = 'Admin'): User | null {
    const user = this.getUserById(id);
    if (!user) return null;
    user.isBanned = false;
    user.isBounded = false;
    user.boundingDetails = undefined;
    this.addAuditLog({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      adminId: adminName,
      adminName,
      action: 'BOUNDS_LIFTED_UNBLOCKED',
      targetId: id,
      targetName: `${user.name} (@${user.username})`,
      details: 'All account bounds and communication restrictions were removed.',
    });
    this.save();
    return user;
  }

  resetPin(id: string, newPin?: string, adminName: string = 'Admin'): User | null {
    const user = this.getUserById(id);
    if (!user) return null;
    user.securitySettings.pinEnabled = Boolean(newPin);
    user.securitySettings.pinCode = newPin ? normalizePin(newPin) : undefined;
    this.addAuditLog({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      adminId: adminName,
      adminName,
      action: 'SECURITY_PIN_RESET',
      targetId: id,
      targetName: `${user.name} (@${user.username})`,
      details: newPin ? 'Admin assigned new security PIN.' : 'Admin cleared security PIN lock.',
    });
    this.save();
    return user;
  }

  terminateSessions(id: string, adminName: string = 'Admin'): User | null {
    const user = this.getUserById(id);
    if (!user) return null;
    user.securitySettings.activeSessions = [
      {
        id: 'sess_' + Date.now(),
        device: 'Current Terminal (Active Session)',
        location: user.countryName || 'Online',
        lastActive: 'Active now',
        isCurrent: true,
      },
    ];
    this.addAuditLog({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      adminId: adminName,
      adminName,
      action: 'REMOTE_SESSIONS_TERMINATED',
      targetId: id,
      targetName: `${user.name} (@${user.username})`,
      details: 'Terminated all remote login sessions.',
    });
    this.save();
    return user;
  }

  verifyUserPin(userId: string, pin: string): boolean {
    const user = this.getUserById(userId);
    if (!user || !pin) return false;
    const candidate = String(pin).trim();
    const expected = user.securitySettings?.pinCode || '';
    if (!expected) return false;
    return verifyPin(candidate, expected) || String(candidate) === String(expected);
  }

  deleteUser(id: string, adminName: string = 'Admin'): boolean {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const user = this.db.users[idx];
    this.db.users.splice(idx, 1);
    delete this.db.pushSubscriptions?.[id];

    // Remove user from participant lists
    this.db.chats.forEach((c) => {
      c.participants = c.participants.filter((p) => p !== id);
    });

    this.addAuditLog({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      adminId: adminName,
      adminName,
      action: 'USER_ACCOUNT_DELETED',
      targetId: id,
      targetName: `${user.name} (@${user.username})`,
      details: 'Account was permanently purged from database.',
    });

    this.save();
    return true;
  }

  // --- Phone OTP Verification ---
  createOtp(key: string, phone: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.db.otpCodes[key] = {
      code,
      phone,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    this.save();
    return code;
  }

  verifyOtp(key: string, code: string): { valid: boolean; phone?: string } {
    const record = this.db.otpCodes[key];
    if (!record) return { valid: false };
    if (Date.now() > record.expiresAt) {
      delete this.db.otpCodes[key];
      this.save();
      return { valid: false };
    }
    if (record.code !== code.trim()) {
      return { valid: false };
    }
    const phone = record.phone;
    delete this.db.otpCodes[key];
    this.save();
    return { valid: true, phone };
  }

  // --- Chats ---
  getChatsForUser(userId: string): Chat[] {
    return this.db.chats.filter((c) => c.participants.includes(userId));
  }

  getAllChats(): Chat[] {
    return this.db.chats;
  }

  getChatById(chatId: string): Chat | undefined {
    return this.db.chats.find((c) => c.id === chatId);
  }

  addChat(chat: Chat): Chat {
    const existingById = this.db.chats.find((c) => c.id === chat.id);
    if (existingById) return existingById;

    if (chat.type === 'direct' && Array.isArray(chat.participants) && chat.participants.length === 2) {
      const [p1, p2] = chat.participants;
      const existingDirect = this.db.chats.find(
        (c) =>
          c.type === 'direct' &&
          c.participants.length === 2 &&
          c.participants.includes(p1) &&
          c.participants.includes(p2)
      );
      if (existingDirect) {
        if (!this.db.messages[existingDirect.id]) {
          this.db.messages[existingDirect.id] = [];
        }
        return existingDirect;
      }
    }

    this.db.chats.unshift(chat);
    if (!this.db.messages[chat.id]) {
      this.db.messages[chat.id] = [];
    }
    this.save();
    return chat;
  }

  updateChat(chatId: string, updates: Partial<Chat>): Chat | null {
    const idx = this.db.chats.findIndex((c) => c.id === chatId);
    if (idx === -1) return null;
    this.db.chats[idx] = { ...this.db.chats[idx], ...updates };
    this.save();
    return this.db.chats[idx];
  }

  removeChat(chatId: string): boolean {
    const initialLen = this.db.chats.length;
    this.db.chats = this.db.chats.filter((c) => c.id !== chatId);
    delete this.db.messages[chatId];
    this.save();
    return this.db.chats.length < initialLen;
  }

  clearChatMessages(chatId: string): boolean {
    this.db.messages[chatId] = [];
    const chat = this.getChatById(chatId);
    if (chat) {
      chat.lastMessage = undefined;
      chat.pinnedMessageId = undefined;
      chat.unreadCount = 0;
    }
    this.save();
    return true;
  }

  // --- Messages ---
  getMessages(chatId: string): Message[] {
    return this.db.messages[chatId] || [];
  }

  getAllMessages(): Record<string, Message[]> {
    return this.db.messages;
  }

  addMessage(chatId: string, message: Message): Message {
    if (!this.db.messages[chatId]) {
      this.db.messages[chatId] = [];
    }
    const existingIdx = this.db.messages[chatId].findIndex((m) => m.id === message.id);
    if (existingIdx !== -1) {
      this.db.messages[chatId][existingIdx] = {
        ...this.db.messages[chatId][existingIdx],
        ...message,
      };
    } else {
      this.db.messages[chatId].push(message);
    }

    const chat = this.getChatById(chatId);
    if (chat) {
      chat.lastMessage = message;
      if (existingIdx === -1) {
        chat.unreadCount = (chat.unreadCount || 0) + 1;
      }
    }

    this.save();
    return message;
  }

  updateMessage(chatId: string, messageId: string, updates: Partial<Message>): Message | null {
    const list = this.db.messages[chatId];
    if (!list) return null;
    const idx = list.findIndex((m) => m.id === messageId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };

    const chat = this.getChatById(chatId);
    if (chat && chat.lastMessage?.id === messageId) {
      chat.lastMessage = list[idx];
    }

    this.save();
    return list[idx];
  }

  deleteMessage(chatId: string, messageId: string, forEveryone: boolean, userId: string): boolean {
    const list = this.db.messages[chatId];
    if (!list) return false;
    const idx = list.findIndex((m) => m.id === messageId);
    if (idx === -1) return false;

    if (forEveryone) {
      this.db.messages[chatId] = list.filter((m) => m.id !== messageId);
    } else {
      const deletedFor = list[idx].deletedFor || [];
      if (!deletedFor.includes(userId)) {
        list[idx].deletedFor = [...deletedFor, userId];
      }
    }

    const remaining = this.db.messages[chatId];
    const chat = this.getChatById(chatId);
    if (chat && remaining) {
      chat.lastMessage = remaining[remaining.length - 1];
    }

    this.save();
    return true;
  }

  toggleReaction(chatId: string, messageId: string, emoji: string, userId: string): Message | null {
    const list = this.db.messages[chatId];
    if (!list) return null;
    const msg = list.find((m) => m.id === messageId);
    if (!msg) return null;

    const reactions = { ...(msg.reactions || {}) };
    const currentUsers = reactions[emoji] || [];

    if (currentUsers.includes(userId)) {
      reactions[emoji] = currentUsers.filter((id) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji] = [...currentUsers, userId];
    }

    msg.reactions = reactions;
    this.save();
    return msg;
  }

  votePoll(chatId: string, messageId: string, optionId: string, userId: string): Message | null {
    const list = this.db.messages[chatId];
    if (!list) return null;
    const msg = list.find((m) => m.id === messageId);
    if (!msg || !msg.pollData) return null;

    msg.pollData.options = msg.pollData.options.map((opt) => {
      const hasVoted = opt.votes.includes(userId);
      if (opt.id === optionId) {
        return {
          ...opt,
          votes: hasVoted ? opt.votes.filter((id) => id !== userId) : [...opt.votes, userId],
        };
      }
      if (!msg.pollData?.multiple) {
        return {
          ...opt,
          votes: opt.votes.filter((id) => id !== userId),
        };
      }
      return opt;
    });

    this.save();
    return msg;
  }

  markChatRead(chatId: string): void {
    const chat = this.getChatById(chatId);
    if (chat) {
      chat.unreadCount = 0;
      if (chat.lastMessage) {
        chat.lastMessage.status = 'read';
        chat.lastMessage.readAt = Date.now();
      }
    }
    const list = this.db.messages[chatId];
    if (list) {
      list.forEach((m) => {
        if (m.status !== 'read') {
          m.status = 'read';
          m.readAt = Date.now();
        }
      });
    }
    this.save();
  }

  markMessageViewedOnce(chatId: string, messageId: string, userId: string): Message | null {
    const list = this.db.messages[chatId];
    if (!list) return null;
    const idx = list.findIndex((m) => m.id === messageId);
    if (idx === -1) return null;

    const msg = list[idx];
    const viewedBy = new Set(msg.viewedBy || []);
    viewedBy.add(userId);

    // Once a non-sender opens the View Once message, scrub its media payload
    const isRecipient = msg.senderId !== userId;
    list[idx] = {
      ...msg,
      isViewOnce: true,
      viewedBy: Array.from(viewedBy),
      viewedAt: msg.viewedAt || Date.now(),
      status: 'read',
      ...(isRecipient
        ? {
            content: '1× View-once media opened',
            mediaUrl: undefined,
          }
        : {}),
    };

    const chat = this.getChatById(chatId);
    if (chat && chat.lastMessage?.id === messageId) {
      chat.lastMessage = list[idx];
    }

    this.save();
    return list[idx];
  }

  // --- Calls ---
  getCalls(): CallRecord[] {
    return this.db.calls;
  }

  addCallRecord(record: CallRecord): CallRecord {
    this.db.calls.unshift(record);
    this.save();
    return record;
  }

  clearCalls(userId: string): void {
    if (!userId) {
      this.db.calls = [];
    } else {
      this.db.calls = this.db.calls.filter(
        (c) => c.callerId !== userId && c.receiverId !== userId
      );
    }
    this.save();
  }

  // --- Status Stories & Automatic Status History ---
  private sweepExpiredStories() {
    const now = Date.now();
    const stillActive: StatusStory[] = [];
    let changed = false;

    for (const s of this.db.stories) {
      if (s.expiresAt <= now || s.isExpired) {
        const archivedStory: StatusStory = {
          ...s,
          isExpired: true,
          archivedAt: s.archivedAt || now,
        };
        if (!this.db.statusHistory.some((h) => h.id === s.id)) {
          this.db.statusHistory.unshift(archivedStory);
        }
        changed = true;
      } else {
        stillActive.push(s);
      }
    }

    if (changed) {
      this.db.stories = stillActive;
      this.save();
    }
  }

  getStories(): StatusStory[] {
    this.sweepExpiredStories();
    return this.db.stories || [];
  }

  getStatusHistory(userId?: string): StatusStory[] {
    this.sweepExpiredStories();
    if (!userId) return this.db.statusHistory;
    return this.db.statusHistory.filter((s) => s.userId === userId);
  }

  addStory(story: StatusStory): StatusStory {
    this.db.stories.unshift(story);
    this.save();
    return story;
  }

  archiveStory(storyId: string): StatusStory | null {
    const idx = this.db.stories.findIndex((s) => s.id === storyId);
    if (idx === -1) return null;
    const [story] = this.db.stories.splice(idx, 1);
    const archived: StatusStory = {
      ...story,
      isExpired: true,
      expiresAt: Date.now() - 1000,
      archivedAt: Date.now(),
    };
    if (!this.db.statusHistory.some((h) => h.id === archived.id)) {
      this.db.statusHistory.unshift(archived);
    }
    this.save();
    return archived;
  }

  viewStory(storyId: string, viewer: { userId: string; userName: string; avatar: string }): void {
    const story = this.db.stories.find((s) => s.id === storyId);
    if (story) {
      if (!story.viewers.some((v) => v.userId === viewer.userId)) {
        story.viewers.push({
          ...viewer,
          viewedAt: Date.now(),
        });
        this.save();
      }
    }
  }

  reactToStory(storyId: string, emoji: string, userId: string): StatusStory | null {
    const story = this.db.stories.find((s) => s.id === storyId);
    if (!story) return null;
    const reactions = { ...(story.reactions || {}) };
    const list = reactions[emoji] || [];
    if (list.includes(userId)) {
      reactions[emoji] = list.filter((id) => id !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...list, userId];
    }
    story.reactions = reactions;
    this.save();
    return story;
  }

  deleteStory(storyId: string): boolean {
    const prevLen = this.db.stories.length + this.db.statusHistory.length;
    this.db.stories = this.db.stories.filter((s) => s.id !== storyId);
    this.db.statusHistory = this.db.statusHistory.filter((s) => s.id !== storyId);
    this.save();
    return this.db.stories.length + this.db.statusHistory.length < prevLen;
  }

  deleteStoriesForUser(userId: string): number {
    const initialLen = this.db.stories.length;
    this.db.stories = this.db.stories.filter((s) => s.userId !== userId);
    const removedCount = initialLen - this.db.stories.length;
    if (removedCount > 0) {
      this.save();
    }
    return removedCount;
  }

  clearStatusHistory(userId: string): void {
    this.db.statusHistory = this.db.statusHistory.filter((s) => s.userId !== userId);
    this.save();
  }

  // --- Communities & Channels ---
  getChannels(): ChannelItem[] {
    return this.db.channels;
  }

  createChannel(data: Partial<ChannelItem> & { creatorId: string }): {
    channel: ChannelItem;
    chat: Chat;
  } {
    const id = data.id || 'comm_' + Date.now();
    const chatId = 'chat_' + id;
    const members = Array.from(new Set([data.creatorId, ...(data.members || [])]));

    const memberRoles: Record<string, 'owner' | 'admin' | 'moderator' | 'member'> = {
      [data.creatorId]: 'owner',
    };
    members.forEach((mId) => {
      if (mId !== data.creatorId) memberRoles[mId] = 'member';
    });

    const newChannel: ChannelItem = {
      id,
      name: data.name || 'New Community',
      handle:
        (data.handle || data.name || 'community')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_') +
        '_' +
        Math.floor(100 + Math.random() * 900),
      avatar:
        data.avatar ||
        `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(data.name || id)}`,
      bannerUrl: data.bannerUrl,
      description: data.description || 'Community hub on ChatTime.',
      category: data.category || 'Communities',
      creatorId: data.creatorId,
      subscriberCount: members.length,
      isSubscribed: true,
      isVerified: false,
      isPrivate: Boolean(data.isPrivate),
      chatId,
      members,
      memberRoles,
      announcements: data.announcements || [],
      posts: data.posts || [],
    };

    const communityChat: Chat = {
      id: chatId,
      type: 'group',
      name: `${newChannel.name} (Community Chat)`,
      avatar: newChannel.avatar,
      description: newChannel.description,
      participants: members,
      participantRoles: {
        [data.creatorId]: 'creator',
      },
      admins: [data.creatorId],
      unreadCount: 0,
      folder: 'groups',
      isPublic: !newChannel.isPrivate,
      communityId: id,
      inviteLink: `https://chattime.app/c/${newChannel.handle}`,
      permissions: {
        canSendMessages: true,
        canAddMembers: true,
        canPinMessages: true,
        canChangeInfo: false,
      },
    };

    this.db.channels.unshift(newChannel);
    this.addChat(communityChat);
    this.save();

    return { channel: newChannel, chat: communityChat };
  }

  toggleChannelSubscription(channelId: string, userId?: string): ChannelItem | null {
    const channel = this.db.channels.find((c) => c.id === channelId);
    if (!channel) return null;

    if (!channel.members) channel.members = [];
    if (!channel.memberRoles) channel.memberRoles = {};

    if (userId) {
      const isMember = channel.members.includes(userId);
      if (isMember) {
        channel.members = channel.members.filter((id) => id !== userId);
        delete channel.memberRoles[userId];
        channel.isSubscribed = false;
      } else {
        channel.members.push(userId);
        channel.memberRoles[userId] = 'member';
        channel.isSubscribed = true;
      }
      channel.subscriberCount = Math.max(0, channel.members.length);

      // Sync with community chat
      if (channel.chatId) {
        const chat = this.getChatById(channel.chatId);
        if (chat) {
          if (isMember) {
            chat.participants = chat.participants.filter((id) => id !== userId);
          } else if (!chat.participants.includes(userId)) {
            chat.participants.push(userId);
          }
        }
      }
    } else {
      channel.isSubscribed = !channel.isSubscribed;
      channel.subscriberCount = Math.max(
        0,
        channel.subscriberCount + (channel.isSubscribed ? 1 : -1)
      );
    }

    this.save();
    return channel;
  }

  manageCommunityMember(
    channelId: string,
    targetUserId: string,
    action: 'promote_admin' | 'promote_mod' | 'demote_member' | 'kick' | 'add'
  ): ChannelItem | null {
    const channel = this.db.channels.find((c) => c.id === channelId);
    if (!channel) return null;
    if (!channel.members) channel.members = [];
    if (!channel.memberRoles) channel.memberRoles = {};

    if (action === 'kick') {
      channel.members = channel.members.filter((id) => id !== targetUserId);
      delete channel.memberRoles[targetUserId];
      if (channel.chatId) {
        const chat = this.getChatById(channel.chatId);
        if (chat) {
          chat.participants = chat.participants.filter((id) => id !== targetUserId);
        }
      }
    } else if (action === 'add') {
      if (!channel.members.includes(targetUserId)) {
        channel.members.push(targetUserId);
        channel.memberRoles[targetUserId] = 'member';
      }
      if (channel.chatId) {
        const chat = this.getChatById(channel.chatId);
        if (chat && !chat.participants.includes(targetUserId)) {
          chat.participants.push(targetUserId);
        }
      }
    } else if (action === 'promote_admin') {
      channel.memberRoles[targetUserId] = 'admin';
    } else if (action === 'promote_mod') {
      channel.memberRoles[targetUserId] = 'moderator';
    } else if (action === 'demote_member') {
      channel.memberRoles[targetUserId] = 'member';
    }

    channel.subscriberCount = channel.members.length;
    this.save();
    return channel;
  }

  addCommunityAnnouncement(
    channelId: string,
    announcement: CommunityAnnouncement
  ): ChannelItem | null {
    const channel = this.db.channels.find((c) => c.id === channelId);
    if (!channel) return null;
    if (!channel.announcements) channel.announcements = [];
    channel.announcements.unshift(announcement);
    this.save();
    return channel;
  }

  reactToChannelPost(channelId: string, postId: string, emoji: string): ChannelItem | null {
    const channel = this.db.channels.find((c) => c.id === channelId);
    if (!channel) return null;
    const post = channel.posts.find((p) => p.id === postId);
    if (!post) return null;

    post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
    post.userReaction = emoji;
    this.save();
    return channel;
  }

  addChannelPost(channelId: string, post: ChannelPost): ChannelItem | null {
    const channel = this.db.channels.find((c) => c.id === channelId);
    if (!channel) return null;
    channel.posts.unshift(post);
    this.save();
    return channel;
  }

  addChannelComment(channelId: string, postId: string, comment: ChannelComment): ChannelItem | null {
    const channel = this.db.channels.find((c) => c.id === channelId);
    if (!channel) return null;
    const post = channel.posts.find((p) => p.id === postId);
    if (!post) return null;
    if (!post.comments) {
      post.comments = [];
    }
    post.comments.push(comment);
    post.commentsCount = (post.commentsCount || 0) + 1;
    this.save();
    return channel;
  }

  // --- Reports & Moderation ---
  getReports(): AdminReport[] {
    return this.db.reports;
  }

  addReport(report: AdminReport): AdminReport {
    this.db.reports.unshift(report);
    this.save();
    return report;
  }

  resolveReport(reportId: string, status: 'resolved' | 'dismissed'): AdminReport | null {
    const r = this.db.reports.find((item) => item.id === reportId);
    if (!r) return null;
    r.status = status;
    this.save();
    return r;
  }

  // --- Announcements ---
  getAnnouncements(): SystemAnnouncement[] {
    return this.db.announcements;
  }

  addAnnouncement(announcement: SystemAnnouncement): SystemAnnouncement {
    this.db.announcements.unshift(announcement);
    this.save();
    return announcement;
  }

  // --- Audit Logs ---
  getAuditLogs(): AdminAuditLog[] {
    return this.db.auditLogs || [];
  }

  addAuditLog(entry: AdminAuditLog): AdminAuditLog {
    if (!this.db.auditLogs) this.db.auditLogs = [];
    this.db.auditLogs.unshift(entry);
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs.pop();
    }
    this.save();
    return entry;
  }

  // --- Maintenance Mode ---
  isMaintenanceMode(): boolean {
    return Boolean(this.db.maintenanceMode);
  }

  setMaintenanceMode(enabled: boolean, adminName: string = 'Admin'): boolean {
    this.db.maintenanceMode = enabled;
    this.addAuditLog({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      adminId: adminName,
      adminName,
      action: enabled ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
      details: enabled
        ? 'Platform maintenance mode activated by admin.'
        : 'Platform maintenance mode deactivated.',
    });
    this.save();
    return this.db.maintenanceMode;
  }

  getPlatformFeatures(): PlatformFeatureSettings {
    return { ...DEFAULT_PLATFORM_FEATURES, ...(this.db.platformFeatures || {}) };
  }

  updatePlatformFeatures(
    updates: Partial<PlatformFeatureSettings>,
    adminId: string,
    adminName: string
  ): PlatformFeatureSettings {
    this.db.platformFeatures = { ...this.getPlatformFeatures(), ...updates };
    this.addAuditLog({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      adminId,
      adminName,
      action: 'PLATFORM_FEATURES_UPDATED',
      details: Object.entries(updates)
        .map(([key, enabled]) => `${key}=${enabled ? 'enabled' : 'disabled'}`)
        .join(', '),
    });
    this.save();
    return this.getPlatformFeatures();
  }

  // --- Content & Group Moderation ---
  dissolveGroup(chatId: string, adminName: string = 'Admin'): boolean {
    const chat = this.getChatById(chatId);
    if (!chat) return false;
    const removed = this.removeChat(chatId);
    if (removed) {
      this.addAuditLog({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: Date.now(),
        adminId: adminName,
        adminName,
        action: 'COMMUNITY_GROUP_DISSOLVED',
        targetId: chatId,
        targetName: chat.name,
        details: `Rogue group/channel was forcefully dissolved by admin.`,
      });
    }
    return removed;
  }

  purgeSpamMessages(adminName: string = 'Admin'): number {
    let purgedCount = 0;
    Object.keys(this.db.messages).forEach((cId) => {
      const originalCount = this.db.messages[cId].length;
      // Filter out messages flagged as spam or from suspended/banned users
      this.db.messages[cId] = this.db.messages[cId].filter((m) => {
        const sender = this.getUserById(m.senderId);
        if (sender && (sender.isBanned || sender.boundingDetails?.scope === 'full_block')) {
          return false;
        }
        return true;
      });
      purgedCount += originalCount - this.db.messages[cId].length;
    });

    if (purgedCount > 0) {
      this.addAuditLog({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: Date.now(),
        adminId: adminName,
        adminName,
        action: 'SPAM_MESSAGES_PURGED',
        details: `Purged ${purgedCount} spam/illicit messages from banned accounts across all conversations.`,
      });
      this.save();
    }
    return purgedCount;
  }

  // --- Welcome Bot & Support Accounts ---
  getWelcomeSettings() {
    return this.db.welcomeSettings || { ...DEFAULT_WELCOME_SETTINGS };
  }

  updateWelcomeSettings(updates: Partial<typeof DEFAULT_WELCOME_SETTINGS>) {
    this.db.welcomeSettings = { ...this.getWelcomeSettings(), ...updates };
    this.persist(this.db);
    return this.db.welcomeSettings;
  }

  createWelcomeChatForUser(newUser: User): void {
    const settings = this.getWelcomeSettings();
    if (!settings.enabled) return;

    const sender = this.getUserById(settings.senderId) || this.getUserById('user_chattime_support');
    const senderId = sender?.id || 'user_chattime_support';
    const senderName = settings.senderName || sender?.name || 'ChatTime Support';
    const senderAvatar = settings.senderAvatar || sender?.avatar || '/icon.svg';

    const welcomeChatId = `chat_support_${newUser.id}`;
    const welcomeChat: Chat = {
      id: welcomeChatId,
      type: 'direct',
      name: senderName,
      avatar: senderAvatar,
      folder: 'direct',
      participants: [senderId, newUser.id],
      isPinned: true,
      isVerified: true,
      unreadCount: 1,
      createdAt: Date.now(),
      lastMessage: {
        id: `msg_welcome_${Date.now()}`,
        chatId: welcomeChatId,
        senderId: senderId,
        senderName: senderName,
        senderAvatar: senderAvatar,
        type: 'text',
        content: settings.messageText,
        timestamp: Date.now(),
        reactions: {},
        status: 'delivered',
      },
    };

    this.addChat(welcomeChat);
    if (!this.db.messages[welcomeChatId] || this.db.messages[welcomeChatId].length === 0) {
      this.db.messages[welcomeChatId] = [
        {
          id: `msg_welcome_${Date.now()}`,
          chatId: welcomeChatId,
          senderId: senderId,
          senderName: senderName,
          senderAvatar: senderAvatar,
          type: 'text',
          content: settings.messageText,
          timestamp: Date.now(),
          reactions: {},
          status: 'delivered',
        },
      ];
    }
  }

  // --- Full State Bootstrap ---
  getBootstrapState(userId?: string) {
    // Return all registered users with sensitive security codes stripped so profiles are never blank and search immediately resolves
    const bootstrapUsers: User[] = this.db.users.map((u) => {
      const clone = { ...u };
      if (clone.securitySettings) {
        clone.securitySettings = { ...clone.securitySettings, pinCode: undefined };
      }
      return clone;
    });

    const userChats = userId ? this.getChatsForUser(userId) : [];
    const bootstrapMessages: Record<string, Message[]> = {};
    if (userId) {
      userChats.forEach((c) => {
        bootstrapMessages[c.id] = this.getMessages(c.id);
      });
    }

    return {
      users: bootstrapUsers,
      chats: userChats,
      messages: bootstrapMessages,
      calls: userId
        ? this.getCalls().filter((c) => c.callerId === userId || c.receiverId === userId)
        : [],
      stories: userId ? this.getStories() : [],
      statusHistory: userId ? this.getStatusHistory(userId) : [],
      channels: this.getChannels(),
      reports: userId && this.getUserById(userId)?.role === 'admin' ? this.getReports() : [],
      announcements: this.getAnnouncements(),
      auditLogs: userId && this.getUserById(userId)?.role === 'admin' ? this.getAuditLogs() : [],
      maintenanceMode: this.isMaintenanceMode(),
      platformFeatures: this.getPlatformFeatures(),
    };
  }

  // --- RBAC & Permission Verification ---
  getRolePermissions(role: string): AdminPermission[] {
    const adminRoles: AdminRole[] = ['super_admin', 'admin', 'moderator', 'support', 'analyst'];
    if (adminRoles.includes(role as AdminRole)) {
      return ROLE_PERMISSIONS[role as AdminRole] || [];
    }
    return [];
  }

  hasPermission(userId: string, permission: AdminPermission): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    const role = (user.role as AdminRole) || 'user';
    const perms = this.getRolePermissions(role);
    return perms.includes(permission);
  }

  isSuperAdmin(userId: string): boolean {
    const user = this.getUserById(userId);
    return Boolean(
      user &&
        (user.role === 'super_admin' ||
          user.email === 'prosperikeokwu@gmail.com')
    );
  }

  isAdminOrStaff(userId: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    const staffRoles: UserRole[] = ['super_admin', 'admin', 'moderator', 'support', 'analyst'];
    return (
      staffRoles.includes(user.role) ||
      user.email === 'prosperikeokwu@gmail.com'
    );
  }

  // --- Real Aggregate Analytics for Super Admin ---
  getDetailedAnalytics() {
    let totalMessages = 0;
    let textMessages = 0;
    let mediaMessages = 0;
    let voiceNotes = 0;

    Object.values(this.db.messages).forEach((msgs) => {
      totalMessages += msgs.length;
      msgs.forEach((m) => {
        if (m.type === 'voice') voiceNotes++;
        else if (['image', 'video', 'file'].includes(m.type)) mediaMessages++;
        else textMessages++;
      });
    });

    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const thirtyDaysAgo = now - 30 * 86400000;

    const dau = this.db.users.filter((u) => u.isOnline || (u.lastSeen && u.lastSeen >= oneDayAgo)).length;
    const mau = this.db.users.filter((u) => u.isOnline || (u.lastSeen && u.lastSeen >= thirtyDaysAgo)).length;
    const onlineUsers = this.db.users.filter((u) => u.isOnline).length;
    const suspendedCount = this.db.users.filter((u) => u.isBounded).length;
    const bannedCount = this.db.users.filter((u) => u.isBanned).length;
    const verifiedCount = this.db.users.filter((u) => u.isVerified).length;

    let voiceMinutes = 0;
    let videoMinutes = 0;
    this.db.calls.forEach((c) => {
      const durationMin = Math.round((c.duration || 60) / 60);
      if (c.type === 'video') videoMinutes += durationMin;
      else voiceMinutes += durationMin;
    });

    return {
      overview: {
        totalUsers: this.db.users.length,
        dailyActiveUsers: dau,
        monthlyActiveUsers: mau,
        onlineUsers,
        totalMessages,
        textMessages,
        mediaMessages,
        voiceNotes,
        totalCalls: this.db.calls.length,
        voiceMinutes,
        videoMinutes,
        totalCommunities: this.db.channels.length,
        pendingReports: this.db.reports.filter((r) => r.status === 'pending').length,
        resolvedReports: this.db.reports.filter((r) => r.status === 'resolved').length,
        suspendedUsers: suspendedCount,
        bannedUsers: bannedCount,
        verifiedUsers: verifiedCount,
        maintenanceMode: this.isMaintenanceMode(),
      },
      systemHealth: {
        status: 'healthy',
        apiStatus: 'online',
        databaseStatus: 'connected',
        websocketStatus: 'operational',
        callingServiceStatus: 'operational',
        pushNotificationStatus: 'active',
        storageUsage: `${Math.round(JSON.stringify(this.db).length / 1024)} KB`,
        uptimeSeconds: process.uptime(),
      },
    };
  }

  // --- Voice AI & Voice Premium Subscriptions ---
  getVoiceSubscription(userId: string): VoiceSubscription | null {
    if (!this.db.voiceSubscriptions) this.db.voiceSubscriptions = {};
    const sub = this.db.voiceSubscriptions[userId];
    if (!sub) return null;
    if (sub.status === 'active' && Date.now() > sub.expiresAt) {
      sub.status = 'expired';
      this.save();
    }
    return sub;
  }

  isUserVoicePremium(userId: string): { isPremium: boolean; subscription: VoiceSubscription | null; isAdminBypass: boolean } {
    const user =
      this.getUserById(userId) ||
      this.db.users.find((u) => u.email?.toLowerCase().trim() === userId.toLowerCase().trim());
    const ADMIN_EMAILS = [
      'prosperikeokwu@gmail.com',
    ];
    const isAdmin = Boolean(
      (user &&
        (user.role === 'admin' ||
          user.role === 'super_admin' ||
          (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())))) ||
      ADMIN_EMAILS.includes(userId.toLowerCase().trim()) ||
      userId === 'user_admin' ||
      userId === 'admin' ||
      userId === '0814'
    );

    if (isAdmin) {
      return {
        isPremium: true,
        subscription: {
          id: `admin_sub_${userId}`,
          userId,
          plan: 'yearly',
          status: 'active',
          amountNgn: 0,
          currency: 'NGN',
          startDate: Date.now() - 86400000,
          expiresAt: Date.now() + 10 * 365 * 86400000, // 10 years
          paymentReference: 'ADMIN_UNLIMITED_PRIVILEGE',
          createdAt: Date.now(),
        },
        isAdminBypass: true,
      };
    }

    const sub = this.getVoiceSubscription(userId);
    const isPremium = Boolean(sub && sub.status === 'active' && sub.expiresAt > Date.now());
    return { isPremium, subscription: sub, isAdminBypass: false };
  }

  createOrRenewVoiceSubscription(
    userId: string,
    plan: 'weekly' | 'monthly' | 'yearly',
    paymentReference?: string
  ): VoiceSubscription {
    if (!this.db.voiceSubscriptions) this.db.voiceSubscriptions = {};
    const now = Date.now();
    const planConfig = {
      weekly: { days: 7, amountNgn: 1000 },
      monthly: { days: 30, amountNgn: 6000 },
      yearly: { days: 365, amountNgn: 20000 },
    }[plan];

    const currentSub = this.db.voiceSubscriptions[userId];
    let startDate = now;
    let expiresAt = now + planConfig.days * 86400000;

    // If currently active, extend expiry
    if (currentSub && currentSub.status === 'active' && currentSub.expiresAt > now) {
      startDate = currentSub.startDate;
      expiresAt = currentSub.expiresAt + planConfig.days * 86400000;
    }

    const newSub: VoiceSubscription = {
      id: `vsub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      plan,
      status: 'active',
      amountNgn: planConfig.amountNgn,
      currency: 'NGN',
      startDate,
      expiresAt,
      paymentReference: paymentReference || `PAY_NGN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now,
    };

    this.db.voiceSubscriptions[userId] = newSub;
    if (this.db.voiceUsageStats) {
      this.db.voiceUsageStats.activeSubscriptions = Object.values(this.db.voiceSubscriptions).filter(
        (s) => s.status === 'active' && s.expiresAt > now
      ).length;
    }
    this.save();
    return newSub;
  }

  revokeVoiceSubscription(userId: string): boolean {
    if (!this.db.voiceSubscriptions || !this.db.voiceSubscriptions[userId]) return false;
    this.db.voiceSubscriptions[userId].status = 'revoked';
    this.save();
    return true;
  }

  getAllVoiceSubscriptions(): VoiceSubscription[] {
    if (!this.db.voiceSubscriptions) return [];
    return Object.values(this.db.voiceSubscriptions);
  }

  recordTTSUsage(chars: number): void {
    if (!this.db.voiceUsageStats) {
      this.db.voiceUsageStats = { totalTTSCalls: 0, totalTTSChars: 0, activeSubscriptions: 0, estimatedCostUsd: 0 };
    }
    this.db.voiceUsageStats.totalTTSCalls += 1;
    this.db.voiceUsageStats.totalTTSChars += chars;
    // Estimated cost: ~0.000015 USD per char for neural TTS
    this.db.voiceUsageStats.estimatedCostUsd += (chars * 0.000015);
    this.save();
  }

  getVoiceAiStats() {
    if (!this.db.voiceUsageStats) {
      this.db.voiceUsageStats = { totalTTSCalls: 0, totalTTSChars: 0, activeSubscriptions: 0, estimatedCostUsd: 0 };
    }
    const now = Date.now();
    const activeSubs = Object.values(this.db.voiceSubscriptions || {}).filter(
      (s) => s.status === 'active' && s.expiresAt > now
    ).length;
    return {
      ...this.db.voiceUsageStats,
      activeSubscriptions: activeSubs,
    };
  }

  getVoiceAdminConfig(): VoiceAiPlatformConfig {
    return this.db.voiceAdminConfig || { ...DEFAULT_VOICE_AI_CONFIG };
  }

  updateVoiceAdminConfig(updates: Partial<VoiceAiPlatformConfig>): VoiceAiPlatformConfig {
    const current = this.getVoiceAdminConfig();
    this.db.voiceAdminConfig = {
      ...current,
      ...updates,
      plans: {
        ...current.plans,
        ...(updates.plans || {}),
      },
    };
    this.save();
    return this.db.voiceAdminConfig;
  }

  // --- Admin Stats ---
  getStats() {
    let totalMessages = 0;
    Object.values(this.db.messages).forEach((msgs) => {
      totalMessages += msgs.length;
    });

    return {
      totalUsers: this.db.users.length,
      activeToday: this.db.users.filter((u) => u.isOnline || Date.now() - u.lastSeen < 86400000).length,
      boundedUsersCount: this.db.users.filter((u) => u.isBanned || u.isBounded).length,
      totalMessages,
      totalCalls: this.db.calls.length,
      totalCommunities: this.db.channels.length,
      reportedSpam: this.db.reports.filter((r) => r.status === 'pending').length,
      uptimeHours: 100,
      maintenanceMode: this.isMaintenanceMode(),
    };
  }
}

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'manage_users',
    'manage_roles',
    'manage_verifications',
    'suspend_users',
    'ban_users',
    'moderate_content',
    'resolve_reports',
    'manage_calls',
    'manage_features',
    'view_analytics',
    'view_audit_logs',
    'manage_admins',
    'system_settings',
    'manage_announcements',
  ],
  admin: [
    'manage_users',
    'manage_verifications',
    'suspend_users',
    'ban_users',
    'moderate_content',
    'resolve_reports',
    'manage_calls',
    'manage_features',
    'view_analytics',
    'view_audit_logs',
    'manage_announcements',
  ],
  moderator: [
    'moderate_content',
    'resolve_reports',
    'suspend_users',
    'view_analytics',
  ],
  support: [
    'manage_verifications',
    'resolve_reports',
    'view_analytics',
  ],
  analyst: [
    'view_analytics',
    'view_audit_logs',
  ],
};

export const dbManager = new DatabaseManager();
