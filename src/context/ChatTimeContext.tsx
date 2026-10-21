import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Chat,
  Message,
  CallRecord,
  ActiveCallState,
  StatusStory,
  ChannelItem,
  ChatFolder,
  CallType,
  MessageType,
  ToastNotification,
  GroupPermissions,
  AdminReport,
  ThemeMode,
  AccentColor,
  RingtoneStyle,
  NotificationSettings,
  AppBackgroundStyle,
  WallpaperPattern,
  AccountBoundingDetails,
  AdminAuditLog,
  PlatformFeatureSettings,
} from '../types';
import { soundEffects } from '../utils/soundEffects';
import { webrtcService } from '../services/webrtcService';
import { translate, CORE_ENGLISH_KEYS, registerDynamicLanguage, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../utils/languages';
import {
  startCallRinging,
  stopCallRinging,
  triggerTestCallNotification as runTestCallNotification,
} from '../utils/notificationSystem';
import { registerPushSubscription, unregisterPushSubscription } from '../utils/pushNotifications';
import { isSharedAppUrl } from '../utils/sharedUrl';
import { buildApiUrl, getWsBaseUrl } from '../utils/apiConfig';

export type NavigationTab =
  | 'chats'
  | 'calls'
  | 'contacts'
  | 'status'
  | 'discover'
  | 'settings'
  | 'admin';

const GUEST_FALLBACK_USER: User = {
  id: '',
  name: 'Visitor',
  username: 'visitor',
  chatTimeNumber: '',
  phoneNumber: '',
  phoneVerified: false,
  countryCode: '+1',
  countryName: 'United States',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chattime',
  bio: '',
  statusFeeling: 'Available',
  phonePrivate: false,
  isOnline: false,
  lastSeen: Date.now(),
  role: 'user',
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
    ringtoneVolume: 80,
    communityAlerts: true,
  },
};

export interface RegisterAccountParams {
  name: string;
  username: string;
  countryCode: string;
  countryName: string;
  avatar?: string;
  bio?: string;
  pin?: string;
  chatTimeNumber?: string;
  phoneNumber?: string;
  email?: string;
  isBusiness?: boolean;
  businessCategory?: string;
  businessHours?: string;
  website?: string;
  role?: 'user' | 'admin';
}

interface CreateCommunityParams {
  name: string;
  handle?: string;
  description: string;
  category: string;
  avatar?: string;
  bannerUrl?: string;
  isPrivate?: boolean;
}

interface ChatTimeContextType {
  currentUser: User;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  users: Record<string, User>;
  chats: Chat[];
  messages: Record<string, Message[]>;
  calls: CallRecord[];
  statuses: StatusStory[];
  statusHistory: StatusStory[];
  channels: ChannelItem[];
  reports: AdminReport[];
  activeTab: NavigationTab;
  activeChatId: string | null;
  activeFolder: ChatFolder;
  searchQuery: string;
  activeCall: ActiveCallState | null;
  replyingTo: Message | null;
  editingMessage: Message | null;
  isInfoDrawerOpen: boolean;
  inspectedUserId: string | null;
  toasts: ToastNotification[];
  theme: ThemeMode;
  accentColor: AccentColor;
  appBackground: AppBackgroundStyle;
  wallpaper: WallpaperPattern;
  wallpaperOpacity: number;
  auditLogs: AdminAuditLog[];
  maintenanceMode: boolean;
  platformFeatures: PlatformFeatureSettings;
  isAppLocked: boolean;
  wsConnected: boolean;
  localMediaStream: MediaStream | null;
  remoteMediaStream: MediaStream | null;
  notificationPermission: NotificationPermission;
  pushNotificationsEnabled: boolean;

  // Setters & Actions
  setActiveTab: (tab: NavigationTab) => void;
  setActiveChatId: (chatId: string | null) => void;
  setActiveFolder: (folder: ChatFolder) => void;
  setSearchQuery: (q: string) => void;
  setReplyingTo: (msg: Message | null) => void;
  setEditingMessage: (msg: Message | null) => void;
  setIsInfoDrawerOpen: (open: boolean) => void;
  setInspectedUserId: (userId: string | null) => void;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setAppBackground: (style: AppBackgroundStyle) => void;
  setWallpaper: (wallpaper: WallpaperPattern) => void;
  setWallpaperOpacity: (opacity: number) => void;
  setIsAppLocked: (locked: boolean) => void;
  requestBrowserNotifications: () => Promise<void>;
  disableBrowserNotifications: () => Promise<void>;
  switchUserAccount: (userId: string) => void;
  logoutUser: () => void;

  // Auth & Phone Verification
  sendPhoneOtp: (
    phone: string,
    forCurrentUser?: boolean,
    email?: string
  ) => Promise<{
    success: boolean;
    code?: string;
    error?: string;
    email?: string;
    sender?: string;
    domain?: string;
    emailPreview?: any;
  }>;
  verifyPhoneOtp: (
    phone: string,
    code: string,
    options?: { updateCurrentUser?: boolean; countryCode?: string; countryName?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  registerNewAccount: (params: RegisterAccountParams) => Promise<{ user?: User; error?: string }>;
  loginAccount: (identifier: string, pin?: string) => Promise<{ user?: User; error?: string }>;

  // Messaging Actions
  sendMessage: (
    chatId: string,
    content: string,
    type?: MessageType,
    extra?: Partial<Message>
  ) => void;
  editMessage: (chatId: string, messageId: string, newContent: string) => void;
  deleteMessage: (chatId: string, messageId: string, forEveryone?: boolean) => void;
  forwardMessage: (message: Message, targetChatId: string) => void;
  toggleReaction: (chatId: string, messageId: string, emoji: string) => void;
  togglePinMessage: (chatId: string, messageId: string) => void;
  votePoll: (chatId: string, messageId: string, optionId: string) => void;
  markViewOnceOpened: (chatId: string, messageId: string) => void;
  markMessageRead: (chatId: string, messageId: string, userId: string) => void;
  markChatRead: (chatId: string) => Promise<void>;
  sendTypingSignal: (chatId: string, isTyping: boolean) => void;
  sendRecordingSignal: (chatId: string, isRecording: boolean) => void;

  // Chat & Group Actions
  startDirectChat: (targetUserId: string) => string;
  createGroupChat: (
    name: string,
    participantIds: string[],
    description?: string,
    isPublic?: boolean
  ) => string;
  togglePinChat: (chatId: string) => void;
  toggleMuteChat: (chatId: string) => void;
  clearChatHistory: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  leaveOrDeleteChat: (chatId: string) => void;
  updateGroupPermissions: (chatId: string, perms: Partial<GroupPermissions>) => void;
  updateMemberRole: (chatId: string, userId: string, role: 'admin' | 'member') => void;
  addGroupMembers: (chatId: string, memberIds: string[]) => void;
  removeGroupMember: (chatId: string, userId: string) => void;

  // Call Actions
  startCall: (chatId: string, type: CallType) => void;
  receiveIncomingCall: (callerId?: string, type?: CallType) => void;
  acceptIncomingCall: (options?: { isVideoOff?: boolean; facingMode?: 'user' | 'environment' }) => Promise<void> | void;
  endActiveCall: () => void;
  toggleCallMute: () => void;
  toggleCallVideo: () => void;
  toggleCallSpeaker: () => void;
  toggleMuteRingtone: () => void;
  flipCallCamera: () => void;
  toggleCallScreenShare: () => Promise<void>;
  toggleCallMinimize: () => void;
  clearCallHistory: () => void;

  // Status / Story & History Actions
  postStatusStory: (story: Omit<StatusStory, 'id' | 'timestamp' | 'expiresAt' | 'viewers'>) => void;
  deleteStatusStory: (storyId: string) => void;
  archiveStatusStory: (storyId: string) => void;
  clearStatusHistory: () => void;
  markStoryViewed: (storyId: string) => void;
  reactToStatusStory: (storyId: string, emoji: string) => void;
  updateStatusPrivacy: (
    visibility: 'everyone' | 'contacts' | 'selected',
    selectedViewers?: string[]
  ) => void;

  // Community / Discover Actions
  createCommunity: (params: CreateCommunityParams) => Promise<ChannelItem | null>;
  toggleSubscribeChannel: (channelId: string) => void;
  openCommunityChat: (channelId: string) => void;
  manageCommunityMember: (
    channelId: string,
    targetUserId: string,
    action: 'add' | 'remove' | 'promote_admin' | 'promote_moderator' | 'demote'
  ) => Promise<void>;
  postCommunityAnnouncement: (
    channelId: string,
    title: string,
    content: string,
    priority?: 'normal' | 'important' | 'urgent'
  ) => Promise<void>;
  createChannelPost: (
    channelId: string,
    title: string,
    content: string,
    mediaUrl?: string
  ) => void;
  reactChannelPost: (channelId: string, postId: string, emoji: string) => void;
  commentChannelPost: (channelId: string, postId: string, content: string) => void;

  // Profile & Contact Actions
  updateCurrentUser: (updates: Partial<User>) => void;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  addNewContactByNumber: (query: string) => Promise<User | null>;
  searchUsers: (query: string) => Promise<User[]>;
  toggleContact: (targetUserId: string) => void;
  ghostUser: (userId: string) => Promise<void>;
  unghostUser: (userId: string) => Promise<void>;
  toggleGhostUser: (userId: string) => Promise<void>;
  isUserGhosted: (userId: string) => boolean;
  addToast: (
    title: string,
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error'
  ) => void;
  removeToast: (id: string) => void;

  // Admin & Moderation Actions
  submitReport: (
    targetType: AdminReport['targetType'],
    targetId: string,
    targetName: string,
    reason: string,
    details: string
  ) => void;
  resolveReport: (reportId: string, status: 'resolved' | 'dismissed') => void;
  toggleBanUser: (userId: string) => void;
  toggleVerifyUser: (userId: string) => void;
  setVerificationBadgeByAdmin: (userId: string, badgeType: 'blue' | 'red' | 'none') => Promise<void>;
  toggleFollowUser: (targetUserId: string) => Promise<void>;
  updateUserRoleByAdmin: (userId: string, role: User['role']) => void;
  broadcastSystemAnnouncement: (
    title: string,
    content: string,
    priority: 'normal' | 'high' | 'urgent'
  ) => void;
  boundUserAccount: (
    userId: string,
    boundingDetails: AccountBoundingDetails,
    isBanned: boolean
  ) => Promise<void>;
  unbindUserAccount: (userId: string) => Promise<void>;
  resetUserPinByAdmin: (userId: string, newPin?: string) => Promise<void>;
  terminateUserSessionsByAdmin: (userId: string) => Promise<void>;
  deleteUserAccountByAdmin: (userId: string) => Promise<void>;
  deleteMyAccount: () => Promise<{ success: boolean; error?: string }>;
  dissolveGroupByAdmin: (chatId: string) => Promise<void>;
  purgeSpamMessagesByAdmin: () => Promise<number>;
  setMaintenanceModeByAdmin: (enabled: boolean) => Promise<void>;
  updatePlatformFeaturesByAdmin: (
    updates: Partial<PlatformFeatureSettings>
  ) => Promise<void>;

  // Global Multi-Language & AI Translation System
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  translateText: (text: string, targetLanguage?: string) => Promise<string>;
  translateAppToLanguage: (languageNameOrCode: string) => Promise<boolean>;
  messageTranslations: Record<
    string,
    { text: string; targetLang: string; showOriginal: boolean; isTranslating?: boolean }
  >;
  toggleMessageTranslation: (chatId: string, messageId: string, targetLanguage?: string) => Promise<void>;
  isTranslatingApp: boolean;

  // Background Ringtone & Notification Test
  triggerTestCallNotification: () => Promise<boolean>;
}

const ChatTimeContext = createContext<ChatTimeContextType | undefined>(undefined);

export const ChatTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(() => {
    return (
      sessionStorage.getItem('chattime_active_user_id') ||
      localStorage.getItem('chattime_active_user_id')
    );
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [users, setUsers] = useState<Record<string, User>>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('chattime_active_user_profile');
      if (cached) {
        try {
          const u = JSON.parse(cached);
          if (u && u.id) return { [u.id]: u };
        } catch {}
      }
    }
    return {};
  });
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [statuses, setStatuses] = useState<StatusStory[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusStory[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);

  const [activeTab, setActiveTabState] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      if (
        search.includes('portal=admin') ||
        search.includes('admin=1') ||
        search.includes('admin=true') ||
        pathname === '/admin' ||
        pathname.startsWith('/admin/')
      ) {
        return 'admin';
      }
    }
    return 'chats';
  });
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<ChatFolder>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('chattime_theme') as ThemeMode | null;
    return saved || 'dark';
  });
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('chattime_accent') as AccentColor | null;
    return saved || 'emerald';
  });
  const [appBackground, setAppBackgroundState] = useState<AppBackgroundStyle>(() => {
    const saved = localStorage.getItem('chattime_bg_style') as AppBackgroundStyle | null;
    return saved || 'whatsapp';
  });
  const [wallpaper, setWallpaperState] = useState<WallpaperPattern>(() => {
    const saved = localStorage.getItem('chattime_wallpaper') as WallpaperPattern | null;
    return saved || 'doodle';
  });
  const [wallpaperOpacity, setWallpaperOpacityState] = useState<number>(() => {
    const saved = localStorage.getItem('chattime_wp_opacity');
    return saved ? Number(saved) : 0.08;
  });
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [maintenanceMode, setMaintenanceModeState] = useState<boolean>(false);
  const [platformFeatures, setPlatformFeatures] = useState<PlatformFeatureSettings>({
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
  });

  const [isAppLocked, setIsAppLocked] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const activeCallRef = useRef<ActiveCallState | null>(null);
  activeCallRef.current = activeCall;
  const chatsRef = useRef<Chat[]>(chats);
  chatsRef.current = chats;
  const usersRef = useRef<Record<string, User>>(users);
  usersRef.current = users;
  const accountSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const activeUserIdRef = useRef<string | null>(activeUserId);
  activeUserIdRef.current = activeUserId;
  const activeChatIdRef = useRef<string | null>(activeChatId);
  activeChatIdRef.current = activeChatId;
  const wakeLockRef = useRef<any>(null);

  const authenticatedUser = activeUserId ? users[activeUserId] || null : null;
  const isAuthenticated = Boolean(authenticatedUser && authenticatedUser.id);
  
  // Patch: Force admin privileges
  const ADMIN_EMAILS = [
    'prosperikeokwu@gmail.com',
    'fastexpressdeliveryservices00@gmail.com',
    'ikeokwuprosper6@gmail.com',
  ];
  const baseUser = authenticatedUser || GUEST_FALLBACK_USER;
  const isMasterAdmin =
    (baseUser.email && ADMIN_EMAILS.includes(baseUser.email.toLowerCase().trim())) ||
    baseUser.username === 'prosperikeokwu' ||
    baseUser.username === 'fastexpress_admin' ||
    baseUser.id === 'user_admin_prosper' ||
    baseUser.id === 'user_admin_fastexpress' ||
    baseUser.role === 'admin';
  const currentUser: User = isMasterAdmin
    ? {
        ...baseUser,
        role: 'admin',
        isVerified: true,
        isRedVerified: true,
        verificationBadge: 'red',
        verificationBadgeType: 'red',
      }
    : baseUser;

  useEffect(() => {
    if (!activeUserId || !isAuthenticated || notificationPermission !== 'granted') {
      setPushNotificationsEnabled(false);
      return;
    }
    if (localStorage.getItem('chattime_push_disabled') === 'true') {
      setPushNotificationsEnabled(false);
      return;
    }
    let isCurrentAccount = true;
    void registerPushSubscription(activeUserId).then((result) => {
      if (isCurrentAccount) setPushNotificationsEnabled(result.enabled);
    });
    return () => {
      isCurrentAccount = false;
    };
  }, [activeUserId, isAuthenticated, notificationPermission]);

  // Protect Admin Tab on Shared App URLs
  useEffect(() => {
    if (activeTab === 'admin' && isSharedAppUrl()) {
      setActiveTabState('chats');
    }
  }, [activeTab]);

  // Apply Theme, Accent & Background Atmosphere to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', theme);
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    localStorage.setItem('chattime_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-accent', accentColor);
    localStorage.setItem('chattime_accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-bg-style', appBackground);
    localStorage.setItem('chattime_bg_style', appBackground);
  }, [appBackground]);

  // Sync user sound preferences with soundEffects engine
  useEffect(() => {
    if (authenticatedUser?.notificationSettings) {
      const ns = authenticatedUser.notificationSettings;
      soundEffects.setEnabled(ns.soundEffects);
      soundEffects.setRingtoneStyle(ns.ringtoneStyle || 'harmonic');
      soundEffects.setVolume((ns.ringtoneVolume ?? 80) / 100);
    }
  }, [authenticatedUser?.notificationSettings]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const setAccentColor = useCallback((newAccent: AccentColor) => {
    setAccentColorState(newAccent);
  }, []);

  const setAppBackground = useCallback((style: AppBackgroundStyle) => {
    setAppBackgroundState(style);
  }, []);

  const setWallpaper = useCallback((wp: WallpaperPattern) => {
    setWallpaperState(wp);
    localStorage.setItem('chattime_wallpaper', wp);
  }, []);

  const setWallpaperOpacity = useCallback((op: number) => {
    setWallpaperOpacityState(op);
    localStorage.setItem('chattime_wp_opacity', String(op));
  }, []);

  const setActiveTab = useCallback((tab: NavigationTab) => {
    if (tab === 'admin' && isSharedAppUrl()) {
      setActiveTabState('chats');
      return;
    }
    setActiveTabState(tab);
  }, []);

  const addToast = useCallback(
    (
      title: string,
      message: string,
      type: 'info' | 'success' | 'warning' | 'error' = 'info'
    ) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const localMediaStreamRef = useRef<MediaStream | null>(null);
  localMediaStreamRef.current = localMediaStream;
  const remoteMediaStreamRef = useRef<MediaStream | null>(null);
  remoteMediaStreamRef.current = remoteMediaStream;

  const teardownCallState = useCallback(
    (reasonToast?: { title: string; message: string; type?: 'info' | 'warning' | 'error' }) => {
      soundEffects.stopIncomingRingtone();
      soundEffects.stopOutgoingRingtone();
      soundEffects.playCallEnded();

      const lStream = localMediaStreamRef.current || webrtcService.getLocalStream();
      if (lStream) {
        try {
          lStream.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
        } catch {}
      }

      const rStream = remoteMediaStreamRef.current || webrtcService.getRemoteStream();
      if (rStream) {
        try {
          rStream.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
        } catch {}
      }

      try {
        webrtcService.cleanup();
      } catch {}

      stopCallRinging();

      setLocalMediaStream(null);
      setRemoteMediaStream(null);

      const current = activeCallRef.current;
      if (current?.chatId) {
        const peerId = current.peerId || current.caller.id;
        const peerUser = usersRef.current[peerId];
        setChats((prev) => {
          if (prev.some((c) => c.id === current.chatId)) return prev;
          const restoredChat: Chat = {
            id: current.chatId,
            type: 'direct',
            name: peerUser?.name || current.chatName,
            avatar: peerUser?.avatar || current.caller.avatar,
            participants: [activeUserIdRef.current || '', peerId].filter(Boolean),
            unreadCount: 0,
            folder: 'direct',
          };
          const next = [restoredChat, ...prev];
          chatsRef.current = next;
          return next;
        });
        setActiveChatIdState(current.chatId);
        setActiveTabState('chats');
      }

      setActiveCall(null);
      if (reasonToast) {
        addToast(reasonToast.title, reasonToast.message, reasonToast.type || 'info');
      }
    },
    [addToast]
  );

  // Multi-Language State (A to Z)
  const [language, setLanguageState] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('chattime_lang')) || 'en';
  });

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chattime_lang', lang);
      document.documentElement.lang = lang;
      const isRtl = ['ar', 'he', 'fa', 'ur'].includes(lang.split('-')[0].toLowerCase());
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
      const isRtl = ['ar', 'he', 'fa', 'ur'].includes(language.split('-')[0].toLowerCase());
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    }
  }, [language]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translate(language, key, fallback || key);
    },
    [language]
  );

  // Real-Time In-Chat and App Translation Engine
  const [messageTranslations, setMessageTranslations] = useState<
    Record<string, { text: string; targetLang: string; showOriginal: boolean; isTranslating?: boolean }>
  >({});
  const [isTranslatingApp, setIsTranslatingApp] = useState<boolean>(false);

  const translateText = useCallback(
    async (text: string, targetLanguage?: string): Promise<string> => {
      if (!text || !text.trim()) return '';
      const target = targetLanguage || language;
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLanguage: target }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.translatedText) return data.translatedText;
        }
      } catch (err) {
        console.warn('[Translate] API call failed:', err);
      }
      return text;
    },
    [language]
  );

  const translateAppToLanguage = useCallback(
    async (langInput: string): Promise<boolean> => {
      if (!langInput || !langInput.trim()) return false;
      const cleanInput = langInput.trim();
      const lower = cleanInput.toLowerCase();

      // 1. Direct match with existing 52 global languages
      const foundLang = SUPPORTED_LANGUAGES.find(
        (l) =>
          l.code.toLowerCase() === lower ||
          l.name.toLowerCase() === lower ||
          l.nativeName.toLowerCase() === lower ||
          l.name.toLowerCase().includes(lower)
      );
      if (foundLang && TRANSLATIONS[foundLang.code]) {
        setLanguage(foundLang.code);
        addToast(
          'App Translated',
          `Switched to ${foundLang.name} (${foundLang.nativeName}). Entire app is now updated.`,
          'success'
        );
        return true;
      }

      // 2. Dynamic AI translation for any custom language
      setIsTranslatingApp(true);
      try {
        const res = await fetch('/api/translate-bundle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bundle: CORE_ENGLISH_KEYS,
            targetLanguage: cleanInput,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.translations && Object.keys(data.translations).length > 0) {
            const code = cleanInput.toLowerCase().slice(0, 8).replace(/[^a-z0-9]/g, '_');
            registerDynamicLanguage(
              code,
              cleanInput,
              cleanInput,
              data.translations,
              '🌐',
              'Custom'
            );
            setLanguage(code);
            addToast(
              'App Translated',
              `ChatTime has been translated into ${cleanInput}.`,
              'success'
            );
            setIsTranslatingApp(false);
            return true;
          }
        }
      } catch (err) {
        console.warn('[Translate Bundle] Error:', err);
      }
      setIsTranslatingApp(false);
      addToast(
        'Translation Failed',
        `Could not auto-translate into ${cleanInput}. Please try again.`,
        'warning'
      );
      return false;
    },
    [addToast, setLanguage]
  );

  const toggleMessageTranslation = useCallback(
    async (chatId: string, messageId: string, targetLanguage?: string) => {
      const target = targetLanguage || language;
      const existing = messageTranslations[messageId];

      if (existing && !existing.isTranslating) {
        setMessageTranslations((prev) => ({
          ...prev,
          [messageId]: {
            ...existing,
            showOriginal: !existing.showOriginal,
          },
        }));
        return;
      }

      const msg = (messages[chatId] || []).find((m) => m.id === messageId);
      if (!msg || !msg.content) return;

      setMessageTranslations((prev) => ({
        ...prev,
        [messageId]: {
          text: '',
          targetLang: target,
          showOriginal: false,
          isTranslating: true,
        },
      }));

      const translated = await translateText(msg.content, target);

      setMessageTranslations((prev) => ({
        ...prev,
        [messageId]: {
          text: translated,
          targetLang: target,
          showOriginal: false,
          isTranslating: false,
        },
      }));
    },
    [language, messageTranslations, messages, translateText]
  );

  const triggerTestCallNotification = useCallback(async (): Promise<boolean> => {
    const success = await runTestCallNotification();
    if (success) {
      addToast(
        'Test Alert Sent',
        'Foreground ringtone and a system alert were triggered. Your phone controls notification sound.',
        'info'
      );
    } else {
      addToast(
        'Notification Permission',
        'Allow browser notifications. Lock-screen push also requires VAPID keys on the server.',
        'warning'
      );
    }
    return success;
  }, [addToast]);

  const showSystemNotification = useCallback(
    (title: string, body: string, tag?: string) => {
      // Vibrate mobile device
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          if (tag?.startsWith('call')) {
            navigator.vibrate([400, 200, 400, 200, 800]);
          } else {
            navigator.vibrate([150, 80, 150]);
          }
        } catch {}
      }

      if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
      if (Notification.permission !== 'granted') return;
      if (document.visibilityState === 'visible' || pushNotificationsEnabled) return;

      const isCall = Boolean(tag?.startsWith('call'));
      const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: tag || 'chattime-notification',
        renotify: true,
        requireInteraction: isCall,
        vibrate: isCall ? [400, 200, 400, 200, 800] : [150, 80, 150],
        data: { url: '/', isCall },
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, options);
          })
          .catch(() => {
            try {
              new Notification(title, options);
            } catch {}
          });
      } else {
        try {
          new Notification(title, options);
        } catch {}
      }
    },
    [pushNotificationsEnabled]
  );

  const requestBrowserNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      addToast('Notifications', 'Browser notifications are not supported in this environment.', 'warning');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        localStorage.removeItem('chattime_push_disabled');
        const result = activeUserId
          ? await registerPushSubscription(activeUserId)
          : { enabled: false as const, reason: 'Sign in to enable device notifications.' };
        setPushNotificationsEnabled(result.enabled);
        addToast(
          result.enabled ? 'Background Alerts Enabled' : 'Notification Permission Granted',
          result.enabled
            ? 'This device is registered for lock-screen message and call alerts. Notification sound follows your phone settings.'
            : result.reason,
          result.enabled ? 'success' : 'warning'
        );
      } else {
        addToast('Permission Denied', 'Enable notifications in your browser settings to receive background alerts.', 'warning');
      }
    } catch {
      addToast('Notifications', 'Could not request notification permission in this view.', 'info');
    }
  }, [activeUserId, addToast]);

  const disableBrowserNotifications = useCallback(async () => {
    localStorage.setItem('chattime_push_disabled', 'true');
    if (activeUserId) await unregisterPushSubscription(activeUserId);
    setPushNotificationsEnabled(false);
    addToast(
      'Background Alerts Disabled',
      'This device will no longer receive Chat Time push alerts. Browser permission can be revoked in device settings.',
      'info'
    );
  }, [activeUserId, addToast]);

  // Acquire / release Screen WakeLock during active calls so screen stays responsive
  useEffect(() => {
    const manageWakeLock = async () => {
      if (activeCall && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch {
          // WakeLock optional
        }
      } else if (!activeCall && wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch {
          // Ignore
        }
      }
    };
    manageWakeLock();
  }, [activeCall]);

  // Configure MediaSession API during active calls for lock-screen / hardware media controls
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (activeCall) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: activeCall.chatName || activeCall.caller.name,
          artist:
            activeCall.status === 'incoming'
              ? `Incoming ChatTime ${activeCall.type} call`
              : `ChatTime ${activeCall.type === 'video' ? 'Video' : 'Voice'} Call`,
          album: 'ChatTime Encrypted Call',
          artwork: [
            { src: activeCall.caller.avatar || '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          ],
        });
      } catch {
        // Ignore
      }
    }
  }, [activeCall]);

  // Periodic check for expired statuses to automatically move them to Status History
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setStatuses((prev) => {
        const expired = prev.filter((s) => s.expiresAt <= now);
        if (expired.length === 0) return prev;
        const active = prev.filter((s) => s.expiresAt > now);
        setStatusHistory((hist) => {
          const existingIds = new Set(hist.map((h) => h.id));
          const newlyArchived = expired
            .filter((e) => !existingIds.has(e.id))
            .map((e) => ({ ...e, isExpired: true, archivedAt: now }));
          return [...newlyArchived, ...hist];
        });
        return active;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load state from Real Database API on mount
  const fetchBootstrap = useCallback(async (userIdToLoad?: string | null) => {
    try {
      const targetId =
        userIdToLoad ??
        sessionStorage.getItem('chattime_active_user_id') ??
        localStorage.getItem('chattime_active_user_id');
      const query = targetId ? `?userId=${encodeURIComponent(targetId)}` : '';
      const res = await fetch(buildApiUrl(`/api/bootstrap${query}`), { credentials: 'include' });
      if (!res.ok) {
        setIsAuthLoading(false);
        return;
      }
      const data = await res.json();
      if (data.users) {
        const userMap: Record<string, User> = {};
        if (Array.isArray(data.users)) {
          data.users.forEach((u: User) => {
            if (u && u.id) userMap[u.id] = u;
          });
        } else if (typeof data.users === 'object') {
          Object.assign(userMap, data.users);
        }
        usersRef.current = userMap;
        setUsers(userMap);
        if (targetId && userMap[targetId]) {
          sessionStorage.setItem('chattime_active_user_id', targetId);
          localStorage.setItem('chattime_active_user_id', targetId);
          localStorage.setItem('chattime_active_user_profile', JSON.stringify(userMap[targetId]));
        } else if (targetId && !userMap[targetId]) {
          // If server momentarily returned empty or is restarting, check cached user profile instead of logging out
          const cachedProfile = localStorage.getItem('chattime_active_user_profile');
          if (cachedProfile) {
            try {
              const parsed = JSON.parse(cachedProfile);
              if (parsed && parsed.id === targetId) {
                userMap[targetId] = parsed;
                usersRef.current = userMap;
                setUsers({ ...userMap });
              }
            } catch {}
          }
        }
      }
      if (data.chats) {
        chatsRef.current = data.chats;
        setChats(data.chats);
      }
      if (data.messages) setMessages(data.messages);
      if (data.calls) setCalls(data.calls);
      if (data.stories) setStatuses(data.stories);
      if (data.statusHistory) setStatusHistory(data.statusHistory);
      if (data.channels) setChannels(data.channels);
      if (data.reports) setReports(data.reports);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.maintenanceMode !== undefined) setMaintenanceModeState(Boolean(data.maintenanceMode));
      if (data.platformFeatures) {
        setPlatformFeatures((current) => ({ ...current, ...data.platformFeatures }));
      }
    } catch (err) {
      console.warn('[Bootstrap] Error loading initial state:', err);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap(activeUserId);
  }, [activeUserId, fetchBootstrap]);

  // Handle shared link query parameters (?chat=..., ?join=..., ?channel=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const targetChat = params.get('chat') || params.get('join') || params.get('chatId');
      if (targetChat) {
        setActiveTabState('chats');
        setActiveChatIdState(targetChat);
      }
      const targetChannel = params.get('channel') || params.get('c');
      if (targetChannel) {
        setActiveTabState('discover');
      }
    } catch {
      // Ignore url parse errors
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handlePushNotificationClick = (event: MessageEvent) => {
      if (event.data?.type !== 'PUSH_NOTIFICATION_OPEN') return;
      const chatId = event.data.data?.chatId;
      if (typeof chatId !== 'string' || !chatId) return;
      setActiveTabState('chats');
      setActiveChatIdState(chatId);
    };
    navigator.serviceWorker.addEventListener('message', handlePushNotificationClick);
    return () => navigator.serviceWorker.removeEventListener('message', handlePushNotificationClick);
  }, []);

  // Connect to Real-Time WebSocket Server
  useEffect(() => {
    if (!activeUserId || !isAuthenticated) return;

    const baseWs = getWsBaseUrl();
    const wsUrl = `${baseWs}/ws${activeUserId ? `?userId=${encodeURIComponent(activeUserId)}` : ''}`;
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let isClosedIntentionally = false;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          ws.send(
            JSON.stringify({
              type: 'auth',
              userId: activeUserId,
            })
          );
        };

        ws.onmessage = async (event) => {
          try {
            const payload = JSON.parse(event.data);

            switch (payload.type) {
              case 'presence:update': {
                const { userId, isOnline, timestamp } = payload;
                setUsers((prev) => {
                  if (!prev[userId]) return prev;
                  return {
                    ...prev,
                    [userId]: {
                      ...prev[userId],
                      isOnline,
                      lastSeen: timestamp || Date.now(),
                    },
                  };
                });
                break;
              }

              case 'user:new':
              case 'user:updated':
              case 'user:bounded':
              case 'user:unbounded':
              case 'account:bounded':
              case 'account:unbounded': {
                const u: User = payload.user;
                if (u && u.id) {
                  setUsers((prev) => ({ ...prev, [u.id]: u }));

                  // Cascade avatar/name changes to messages, calls, and statuses
                  if (u.avatar || u.name) {
                    setMessages((prevMsgs) => {
                      const next = { ...prevMsgs };
                      let changed = false;
                      for (const cId of Object.keys(next)) {
                        const list = next[cId];
                        if (list && list.some((m) => m.senderId === u.id)) {
                          changed = true;
                          next[cId] = list.map((m) =>
                            m.senderId === u.id
                              ? {
                                  ...m,
                                  ...(u.avatar ? { senderAvatar: u.avatar } : {}),
                                  ...(u.name ? { senderName: u.name } : {}),
                                }
                              : m
                          );
                        }
                      }
                      return changed ? next : prevMsgs;
                    });
                    setCalls((prevCalls) =>
                      prevCalls.map((c) => ({
                        ...c,
                        ...(c.callerId === u.id
                          ? {
                              ...(u.avatar ? { callerAvatar: u.avatar } : {}),
                              ...(u.name ? { callerName: u.name } : {}),
                            }
                          : {}),
                        ...(c.receiverId === u.id
                          ? {
                              ...(u.avatar ? { receiverAvatar: u.avatar } : {}),
                              ...(u.name ? { receiverName: u.name } : {}),
                            }
                          : {}),
                      }))
                    );
                    setStatuses((prev) =>
                      prev.map((s) =>
                        s.userId === u.id
                          ? {
                              ...s,
                              ...(u.avatar ? { userAvatar: u.avatar } : {}),
                              ...(u.name ? { userName: u.name } : {}),
                            }
                          : s
                      )
                    );
                  }

                  if (u.id === activeUserId) {
                    if (u.isBanned || u.boundingDetails?.scope === 'full_block') {
                      addToast('Account Bounded', 'Your account has been restricted by an administrator.', 'error');
                    } else if (payload.type === 'user:unbounded' || payload.type === 'account:unbounded') {
                      addToast('Bounds Lifted', 'Your account restrictions were removed by an administrator.', 'success');
                    }
                  }
                }
                break;
              }

              case 'user:deleted': {
                if (payload.userId) {
                  setUsers((prev) => {
                    const next = { ...prev };
                    delete next[payload.userId];
                    return next;
                  });
                  if (payload.userId === activeUserId) {
                    logoutUser();
                  }
                }
                break;
              }

              case 'system:maintenance': {
                setMaintenanceModeState(Boolean(payload.enabled));
                addToast(
                  'Maintenance Mode',
                  payload.enabled
                    ? 'Platform maintenance mode is active.'
                    : 'Platform maintenance mode has ended.',
                  'info'
                );
                break;
              }

              case 'platform:features': {
                if (payload.features) {
                  setPlatformFeatures((current) => ({ ...current, ...payload.features }));
                }
                break;
              }

              case 'chat:new': {
                const newChat: Chat = payload.chat;
                if (
                  newChat.participants.includes(activeUserId) ||
                  newChat.isPublic ||
                  newChat.type === 'channel'
                ) {
                  setChats((prev) => {
                    if (prev.some((c) => c.id === newChat.id)) return prev;
                    return [newChat, ...prev];
                  });
                }
                break;
              }

              case 'chat:updated': {
                const updatedChat: Chat = payload.chat;
                setChats((prev) => {
                  const exists = prev.some((c) => c.id === updatedChat.id);
                  if (!exists && updatedChat.participants.includes(activeUserId)) {
                    return [updatedChat, ...prev];
                  }
                  return prev.map((c) => (c.id === updatedChat.id ? { ...c, ...updatedChat } : c));
                });
                break;
              }

              case 'chat:removed': {
                setChats((prev) => prev.filter((c) => c.id !== payload.chatId));
                break;
              }

              case 'chat:cleared': {
                setMessages((prev) => ({
                  ...prev,
                  [payload.chatId]: [],
                }));
                setChats((prev) =>
                  prev.map((c) =>
                    c.id === payload.chatId ? { ...c, lastMessage: undefined, unreadCount: 0 } : c
                  )
                );
                break;
              }


              case 'chat:message': {
                const incomingMsg: Message = payload.message;
                const targetChatId: string = payload.chatId;
                const payloadChat: Chat | undefined = payload.chat;
                const senderUser: User | undefined = payload.senderUser;
                if (!incomingMsg || !targetChatId) break;

                if (senderUser && senderUser.id) {
                  setUsers((prev) => {
                    if (prev[senderUser.id]) return prev;
                    const next = { ...prev, [senderUser.id]: senderUser };
                    usersRef.current = next;
                    return next;
                  });
                }

                setMessages((prev) => {
                  const existing = prev[targetChatId] || [];
                  const existingIdx = existing.findIndex((m) => m.id === incomingMsg.id);
                  if (existingIdx !== -1) {
                    const next = [...existing];
                    next[existingIdx] = incomingMsg;
                    return { ...prev, [targetChatId]: next };
                  }
                  return {
                    ...prev,
                    [targetChatId]: [...existing, incomingMsg],
                  };
                });

                setChats((prev) => {
                  const chatExists = prev.some((c) => c.id === targetChatId);
                  if (!chatExists) {
                    if (payloadChat) {
                      const enrichedChat: Chat = {
                        ...payloadChat,
                        lastMessage: incomingMsg,
                        unreadCount: incomingMsg.senderId !== activeUserId ? 1 : 0,
                      };
                      const nextList = [enrichedChat, ...prev];
                      chatsRef.current = nextList;
                      return nextList;
                    }
                    // Chat is not yet in state (e.g. newly initiated by peer)
                    fetch(`/api/chats/${targetChatId}`)
                      .then((r) => (r.ok ? r.json() : null))
                      .then((fetchedChat) => {
                        if (fetchedChat) {
                          setChats((cur) => {
                            if (cur.some((c) => c.id === targetChatId)) return cur;
                            const nextList = [
                              {
                                ...fetchedChat,
                                lastMessage: incomingMsg,
                                unreadCount: incomingMsg.senderId !== activeUserId ? 1 : 0,
                              },
                              ...cur,
                            ];
                            chatsRef.current = nextList;
                            return nextList;
                          });
                        }
                      })
                      .catch(() => {});
                    return prev;
                  }

                  const isCurrentActiveChat = activeChatIdRef.current === targetChatId;
                  const nextList = prev.map((c) =>
                    c.id === targetChatId
                      ? {
                          ...c,
                          lastMessage:
                            isCurrentActiveChat && incomingMsg.senderId !== activeUserId
                              ? { ...incomingMsg, status: 'read' as const }
                              : incomingMsg,
                          unreadCount:
                            incomingMsg.senderId !== activeUserId
                              ? isCurrentActiveChat
                                ? 0
                                : c.unreadCount + 1
                              : c.unreadCount,
                        }
                      : c
                  );
                  chatsRef.current = nextList;
                  return nextList;
                });

                if (activeChatIdRef.current === targetChatId && incomingMsg.senderId !== activeUserId) {
                  fetch(`/api/chats/${encodeURIComponent(targetChatId)}/messages/read`, { method: 'POST' }).catch(() => {});
                }

                if (incomingMsg.senderId !== activeUserId) {
                  soundEffects.playMessageReceived();
                  if (activeChatIdRef.current !== targetChatId) {
                    showSystemNotification(
                      incomingMsg.senderName,
                      incomingMsg.content || 'Sent an attachment',
                      `chat-${targetChatId}`
                    );
                  }
                }
                break;
              }

              case 'chat:message:edited': {
                const updatedMsg: Message = payload.message;
                setMessages((prev) => ({
                  ...prev,
                  [payload.chatId]: (prev[payload.chatId] || []).map((m) =>
                    m.id === updatedMsg.id ? updatedMsg : m
                  ),
                }));
                break;
              }

              case 'chat:message:read': {
                const { chatId, messageId, readAt } = payload;
                if (chatId) {
                  setMessages((prev) => ({
                    ...prev,
                    [chatId]: (prev[chatId] || []).map((m) =>
                      !messageId || m.id === messageId
                        ? { ...m, status: 'read', readAt: readAt || Date.now() }
                        : m
                    ),
                  }));
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === chatId
                        ? {
                            ...c,
                            lastMessage:
                              c.lastMessage && (!messageId || c.lastMessage.id === messageId)
                                ? { ...c.lastMessage, status: 'read', readAt: readAt || Date.now() }
                                : c.lastMessage,
                          }
                        : c
                    )
                  );
                }
                break;
              }

              case 'chat:read': {
                const { chatId } = payload;
                if (chatId) {
                  setMessages((prev) => ({
                    ...prev,
                    [chatId]: (prev[chatId] || []).map((m) =>
                      m.status !== 'read' ? { ...m, status: 'read', readAt: Date.now() } : m
                    ),
                  }));
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === chatId
                        ? {
                            ...c,
                            unreadCount: 0,
                            lastMessage: c.lastMessage ? { ...c.lastMessage, status: 'read' } : c.lastMessage,
                          }
                        : c
                    )
                  );
                }
                break;
              }

              case 'chat:message:deleted': {
                const { chatId, messageId, forEveryone, userId } = payload;
                setMessages((prev) => ({
                  ...prev,
                  [chatId]: (prev[chatId] || [])
                    .map((m) => {
                      if (m.id !== messageId) return m;
                      if (forEveryone) {
                        return {
                          ...m,
                          content: '🚫 This message was deleted',
                          type: 'text' as MessageType,
                          mediaUrl: undefined,
                        };
                      }
                      return {
                        ...m,
                        deletedFor: [...(m.deletedFor || []), userId],
                      };
                    })
                    .filter((m) => !(m.deletedFor || []).includes(activeUserId)),
                }));
                break;
              }

              case 'chat:message:reaction': {
                const { chatId, messageId, reactions } = payload;
                setMessages((prev) => ({
                  ...prev,
                  [chatId]: (prev[chatId] || []).map((m) =>
                    m.id === messageId ? { ...m, reactions } : m
                  ),
                }));
                break;
              }

              case 'chat:poll:voted': {
                const { chatId, messageId, pollData } = payload;
                setMessages((prev) => ({
                  ...prev,
                  [chatId]: (prev[chatId] || []).map((m) =>
                    m.id === messageId ? { ...m, pollData } : m
                  ),
                }));
                break;
              }

              case 'chat:message:viewed_once': {
                const { chatId, messageId, message: updatedMsg } = payload;
                if (chatId && messageId && updatedMsg) {
                  setMessages((prev) => ({
                    ...prev,
                    [chatId]: (prev[chatId] || []).map((m) =>
                      m.id === messageId ? updatedMsg : m
                    ),
                  }));
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === chatId && c.lastMessage?.id === messageId
                        ? { ...c, lastMessage: updatedMsg }
                        : c
                    )
                  );
                }
                break;
              }

              case 'chat:typing': {
                const { chatId, userName, isTyping } = payload;
                setChats((prev) =>
                  prev.map((c) => {
                    if (c.id !== chatId) return c;
                    const currentTyping = c.typingUsers || [];
                    const updated = isTyping
                      ? Array.from(new Set([...currentTyping, userName]))
                      : currentTyping.filter((n) => n !== userName);
                    return { ...c, typingUsers: updated };
                  })
                );
                break;
              }

              case 'chat:recording': {
                const { chatId, userName, isRecording } = payload;
                setChats((prev) =>
                  prev.map((c) => {
                    if (c.id !== chatId) return c;
                    const currentRecording = c.recordingUsers || [];
                    const updated = isRecording
                      ? Array.from(new Set([...currentRecording, userName]))
                      : currentRecording.filter((n) => n !== userName);
                    return { ...c, recordingUsers: updated };
                  })
                );
                break;
              }

              case 'story:new': {
                const story: StatusStory = payload.story;
                setStatuses((prev) => {
                  if (prev.some((s) => s.id === story.id)) return prev;
                  return [story, ...prev];
                });
                break;
              }

              case 'story:archived': {
                const archived: StatusStory = payload.story;
                setStatuses((prev) => prev.filter((s) => s.id !== archived.id));
                if (archived.userId === activeUserId) {
                  setStatusHistory((prev) => [
                    archived,
                    ...prev.filter((s) => s.id !== archived.id),
                  ]);
                }
                break;
              }

              case 'story:deleted': {
                setStatuses((prev) => prev.filter((s) => s.id !== payload.storyId));
                setStatusHistory((prev) => prev.filter((s) => s.id !== payload.storyId));
                break;
              }

              case 'story:viewed': {
                const { storyId, viewer, story: updatedStory } = payload;
                if (storyId) {
                  setStatuses((prev) =>
                    prev.map((s) => {
                      if (s.id !== storyId) return s;
                      if (updatedStory) return updatedStory;
                      if (viewer && !s.viewers.some((v) => v.userId === viewer.userId)) {
                        return { ...s, viewers: [...s.viewers, viewer] };
                      }
                      return s;
                    })
                  );
                }
                break;
              }

              case 'story:reaction': {
                const { storyId, reactions, story: updatedStory } = payload;
                if (storyId) {
                  setStatuses((prev) =>
                    prev.map((s) => {
                      if (s.id !== storyId) return s;
                      if (updatedStory) return updatedStory;
                      return { ...s, reactions: reactions || s.reactions };
                    })
                  );
                }
                break;
              }

              case 'channel:new': {
                const { channel, chat } = payload;
                if (channel) {
                  setChannels((prev) => {
                    if (prev.some((ch) => ch.id === channel.id)) return prev;
                    return [channel, ...prev];
                  });
                }
                if (chat && chat.participants?.includes(activeUserId)) {
                  setChats((prev) => {
                    if (prev.some((c) => c.id === chat.id)) return prev;
                    return [chat, ...prev];
                  });
                }
                break;
              }

              case 'channel:updated': {
                const updatedChannel: ChannelItem = payload.channel;
                const linkedChat: Chat | undefined = payload.chat;
                if (updatedChannel) {
                  setChannels((prev) =>
                    prev.map((ch) => (ch.id === updatedChannel.id ? updatedChannel : ch))
                  );
                }
                if (linkedChat) {
                  setChats((prev) => {
                    const has = prev.some((c) => c.id === linkedChat.id);
                    if (!has && linkedChat.participants.includes(activeUserId)) {
                      return [linkedChat, ...prev];
                    }
                    return prev.map((c) => (c.id === linkedChat.id ? linkedChat : c));
                  });
                }
                break;
              }

              case 'community:announcement': {
                const { channel, announcement } = payload;
                if (channel) {
                  setChannels((prev) =>
                    prev.map((ch) => (ch.id === channel.id ? channel : ch))
                  );
                  if (
                    channel.members?.includes(activeUserId) &&
                    announcement?.authorId !== activeUserId
                  ) {
                    soundEffects.playNotification();
                    addToast(
                      `📣 ${channel.name}`,
                      `${announcement.title}: ${announcement.content}`,
                      announcement.priority === 'urgent' ? 'warning' : 'info'
                    );
                    showSystemNotification(
                      `${channel.name}: ${announcement.title}`,
                      announcement.content,
                      `comm-ann-${announcement.id}`
                    );
                  }
                }
                break;
              }

              // ==========================================
              // Real WebRTC & Call Signaling Handlers
              // ==========================================
              case 'call:incoming': {
                const caller = payload.data?.caller;
                const callType: CallType = payload.data?.callType || 'voice';
                const incomingCallId = payload.callId || 'call_' + Date.now();
                const incomingChatId =
                  payload.chatId ||
                  (caller?.id && activeUserId
                    ? 'c_direct_' + [activeUserId, caller.id].sort().join('_')
                    : 'c_direct');

                if (caller && caller.id !== activeUserId && !activeCallRef.current) {
                  const myBlocked =
                    usersRef.current[activeUserId]?.blockedUsers ||
                    usersRef.current[activeUserId]?.ghostedUsers ||
                    [];
                  if (caller.id && myBlocked.includes(caller.id)) {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(
                        JSON.stringify({
                          type: 'call:reject',
                          callId: incomingCallId,
                          targetUserId: caller.id,
                          reason: 'User unavailable',
                        })
                      );
                    }
                    break;
                  }
                  // Ensure caller profile is saved in local users map
                  if (caller.id) {
                    const callerUserObj = payload.callerUser || {
                      id: caller.id,
                      name: caller.name,
                      username: caller.username || caller.name.toLowerCase().replace(/\s+/g, ''),
                      chatTimeNumber: caller.number,
                      phoneNumber: caller.number,
                      avatar: caller.avatar,
                      isOnline: true,
                      lastSeen: Date.now(),
                      countryCode: '+1',
                      countryName: 'United States',
                      role: 'user',
                    };
                    setUsers((prev) => {
                      if (prev[caller.id]) return prev;
                      const next = { ...prev, [caller.id]: callerUserObj };
                      usersRef.current = next;
                      return next;
                    });
                  }

                  // Ensure direct chat exists in chats state
                  setChats((prev) => {
                    if (prev.some((c) => c.id === incomingChatId)) return prev;
                    const directChat: Chat = {
                      id: incomingChatId,
                      type: 'direct',
                      name: caller.name,
                      avatar: caller.avatar,
                      participants: [activeUserId, caller.id],
                      unreadCount: 0,
                      folder: 'direct',
                    };
                    const next = [directChat, ...prev];
                    chatsRef.current = next;
                    return next;
                  });

                  soundEffects.startIncomingRingtone();
                  showSystemNotification(
                    `Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`,
                    `${caller.name} (${caller.number}) is calling you on ChatTime`,
                    `call-${incomingCallId}`
                  );
                  setActiveCall({
                    id: incomingCallId,
                    type: callType,
                    isGroup: false,
                    chatId: incomingChatId,
                    chatName: caller.name,
                    peerId: caller.id,
                    participants: [
                      {
                        id: caller.id,
                        name: caller.name,
                        avatar: caller.avatar,
                        isMuted: false,
                        isVideoOff: callType === 'voice',
                      },
                    ],
                    status: 'incoming',
                    caller: {
                      id: caller.id,
                      name: caller.name,
                      avatar: caller.avatar,
                      number: caller.number,
                    },
                    startedAt: Date.now(),
                    isMuted: false,
                    isVideoOff: callType === 'voice',
                    isSpeakerOn: true,
                    isRingtoneMuted: false,
                    isFacingUser: true,
                    isMinimized: false,
                  });
                }
                break;
              }

              case 'call:ringing-status': {
                const { recipientOnline, targetUserId } = payload;
                if (!recipientOnline) {
                  const targetUser = targetUserId ? usersRef.current[targetUserId] : undefined;
                  const targetName = targetUser?.name || 'Contact';
                  addToast(
                    'Sending Call Alert',
                    `${targetName} is offline. The call will remain available briefly for a lock-screen alert.`,
                    'info'
                  );
                }
                break;
              }

              case 'call:accepted': {
                soundEffects.stopOutgoingRingtone();
                setActiveCall((prev) =>
                  prev ? { ...prev, status: 'connecting' } : null
                );

                const currentCall = activeCallRef.current;
                const peerId = payload.acceptedBy || currentCall?.peerId || currentCall?.caller.id;
                const myId = activeUserIdRef.current;
                if (currentCall && peerId && myId) {
                  try {
                    if (!webrtcService.getLocalStream()) {
                      const stream = await webrtcService.acquireMedia(currentCall.type === 'video');
                      if (stream) setLocalMediaStream(stream);
                    }
                    await webrtcService.createPeerConnection(
                      peerId,
                      currentCall.id,
                      (candidate) => {
                        wsRef.current?.send(
                          JSON.stringify({
                            type: 'webrtc:ice-candidate',
                            userId: myId,
                            targetUserId: peerId,
                            callId: currentCall.id,
                            data: { candidate },
                          })
                        );
                      }
                    );
                    const offer = await webrtcService.createOffer();
                    if (offer) {
                      wsRef.current?.send(
                        JSON.stringify({
                          type: 'webrtc:offer',
                          userId: myId,
                          targetUserId: peerId,
                          callId: currentCall.id,
                          data: { offer },
                        })
                      );
                    }
                  } catch (e) {
                    console.warn('[WebRTC] Offer error:', e);
                  }
                }
                break;
              }

              case 'webrtc:offer': {
                const { offer } = payload.data || {};
                const senderId =
                  payload.userId ||
                  payload.data?.senderId ||
                  payload.acceptedBy ||
                  activeCallRef.current?.peerId ||
                  activeCallRef.current?.caller.id;
                const callId = payload.callId || activeCallRef.current?.id;
                const myId = activeUserIdRef.current;
                if (offer && senderId && myId) {
                  try {
                    if (!webrtcService.getLocalStream()) {
                      const isVideo = activeCallRef.current?.type === 'video';
                      const stream = await webrtcService.acquireMedia(isVideo);
                      if (stream) setLocalMediaStream(stream);
                    }
                    await webrtcService.createPeerConnection(senderId, callId, (candidate) => {
                      wsRef.current?.send(
                        JSON.stringify({
                          type: 'webrtc:ice-candidate',
                          userId: myId,
                          targetUserId: senderId,
                          callId,
                          data: { candidate },
                        })
                      );
                    });
                    const answer = await webrtcService.handleOffer(offer);
                    if (answer) {
                      wsRef.current?.send(
                        JSON.stringify({
                          type: 'webrtc:answer',
                          userId: myId,
                          targetUserId: senderId,
                          callId,
                          data: { answer },
                        })
                      );
                    }
                  } catch (err) {
                    console.warn('[WebRTC] Handle offer error:', err);
                  }
                }
                break;
              }

              case 'webrtc:answer': {
                const { answer } = payload.data || {};
                if (answer) {
                  await webrtcService.handleAnswer(answer);
                }
                break;
              }

              case 'webrtc:ice-candidate': {
                const { candidate } = payload.data || {};
                if (candidate) {
                  await webrtcService.handleIceCandidate(candidate);
                }
                break;
              }

              case 'call:media-state': {
                const { isMuted: peerMuted, isVideoOff: peerVideoOff } = payload.data || {};
                const senderId = payload.userId;
                setActiveCall((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    participants: prev.participants.map((p) =>
                      !senderId || p.id === senderId
                        ? {
                            ...p,
                            isMuted: peerMuted !== undefined ? peerMuted : p.isMuted,
                            isVideoOff: peerVideoOff !== undefined ? peerVideoOff : p.isVideoOff,
                          }
                        : p
                    ),
                  };
                });
                break;
              }

              case 'call:unavailable': {
                if (activeCallRef.current?.id === payload.callId) {
                  teardownCallState({
                    title: 'Calls Unavailable',
                    message: payload.reason || 'New calls are temporarily disabled.',
                    type: 'warning',
                  });
                }
                break;
              }

              case 'call:rejected':
              case 'call:Busy':
              case 'call:busy': {
                teardownCallState({
                  title: 'Call Ended',
                  message: payload.reason || 'Recipient declined or is currently busy.',
                  type: 'warning',
                });
                break;
              }

              case 'call:cancelled':
              case 'call:ended': {
                teardownCallState();
                break;
              }

              case 'system:announcement': {
                const ann = payload.announcement;
                if (ann) {
                  soundEffects.playNotification();
                  addToast(
                    `📢 ${ann.title}`,
                    ann.content,
                    ann.priority === 'urgent' ? 'error' : 'info'
                  );
                }
                break;
              }
            }
          } catch {
            // Ignore malformed JSON frames
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          if (!isClosedIntentionally) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };
      } catch {
        setWsConnected(false);
      }
    };

    connect();

    return () => {
      isClosedIntentionally = true;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeUserId, isAuthenticated, addToast, showSystemNotification]);

  // Listen to remote WebRTC stream
  useEffect(() => {
    const unsubscribe = webrtcService.onRemoteStream((stream) => {
      setRemoteMediaStream(stream);
    });
    return unsubscribe;
  }, []);

  // Listen to WebRTC connection established event
  useEffect(() => {
    const unsub = webrtcService.onConnected(() => {
      soundEffects.stopIncomingRingtone();
      soundEffects.stopOutgoingRingtone();
      soundEffects.playCallConnected();
      setActiveCall((prev) => {
        if (!prev) return null;
        if (prev.status === 'connected') return prev;
        return {
          ...prev,
          status: 'connected',
          startedAt: Date.now(),
        };
      });
    });
    return unsub;
  }, []);

  // Select chat and mark unread messages as read
  const setActiveChatId = useCallback(
    (chatId: string | null) => {
      setActiveChatIdState(chatId);
      setReplyingTo(null);
      setEditingMessage(null);
      if (chatId) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  unreadCount: 0,
                  lastMessage:
                    c.lastMessage && c.lastMessage.senderId !== activeUserId
                      ? { ...c.lastMessage, status: 'read' as const }
                      : c.lastMessage,
                }
              : c
          )
        );
        setMessages((prev) => {
          const chatMsgs = prev[chatId];
          if (!chatMsgs) {
            // Asynchronously fetch messages in background without blocking UI
            fetch(`/api/chats/${chatId}/messages`)
              .then((r) => (r.ok ? r.json() : null))
              .then((msgs) => {
                if (Array.isArray(msgs)) {
                  setMessages((curr) => ({ ...curr, [chatId]: msgs }));
                }
              })
              .catch(() => {});
            return prev;
          }
          return {
            ...prev,
            [chatId]: chatMsgs.map((m) =>
              m.senderId !== activeUserId && m.status !== 'read'
                ? { ...m, status: 'read' as const }
                : m
            ),
          };
        });
        fetch(`/api/chats/${chatId}/messages/read`, { method: 'POST' }).catch(() => {});
      }
    },
    [activeUserId]
  );

  // Mark all messages in a chat as read
  const markChatRead = useCallback(
    async (chatId: string) => {
      if (!chatId) return;
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                unreadCount: 0,
                lastMessage:
                  c.lastMessage && c.lastMessage.senderId !== activeUserId
                    ? { ...c.lastMessage, status: 'read' as const }
                    : c.lastMessage,
              }
            : c
        )
      );
      setMessages((prev) => {
        const chatMsgs = prev[chatId];
        if (!chatMsgs) return prev;
        return {
          ...prev,
          [chatId]: chatMsgs.map((m) =>
            m.senderId !== activeUserId && m.status !== 'read'
              ? { ...m, status: 'read' as const, readAt: Date.now() }
              : m
          ),
        };
      });
      try {
        await fetch(buildApiUrl(`/api/chats/${encodeURIComponent(chatId)}/messages/read`), {
          method: 'POST',
          credentials: 'include',
        });
      } catch (err) {
        console.error('Failed to mark chat read:', err);
      }
    },
    [activeUserId]
  );

  // Switch active user account
  const switchUserAccount = useCallback(
    (userId: string) => {
      if (users[userId]) {
        sessionStorage.setItem('chattime_active_user_id', userId);
        localStorage.setItem('chattime_active_user_id', userId);
        setActiveUserId(userId);
        setActiveChatIdState(null);
        fetchBootstrap(userId);
        addToast(
          'Account Switched',
          `Signed in as ${users[userId].name} (${users[userId].chatTimeNumber})`,
          'success'
        );
      }
    },
    [users, addToast, fetchBootstrap]
  );

  const logoutUser = useCallback(() => {
    if (activeUserIdRef.current) {
      void unregisterPushSubscription(activeUserIdRef.current);
    }
    void fetch(buildApiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' }).catch(() => {});
    sessionStorage.removeItem('chattime_active_user_id');
    localStorage.removeItem('chattime_active_user_id');
    if (wsRef.current) {
      wsRef.current.close();
    }
    setActiveUserId(null);
    setActiveChatIdState(null);
    setIsInfoDrawerOpen(false);
    setInspectedUserId(null);
    addToast('Signed Out', 'You have signed out of your ChatTime account.', 'info');
  }, [addToast]);

  const deleteMyAccount = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser.id) return { success: false, error: 'No active user session' };
    const deletingId = currentUser.id;
    try {
      const res = await fetch(buildApiUrl(`/api/users/${encodeURIComponent(deletingId)}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => {
          const next = { ...prev };
          delete next[deletingId];
          return next;
        });
        logoutUser();
        addToast('Account Deleted', 'Your account has been permanently removed.', 'info');
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to delete account' };
    } catch {
      return { success: false, error: 'Network error deleting account' };
    }
  }, [currentUser.id, logoutUser, addToast]);

  // Phone & Email OTP Verification
  const sendPhoneOtp = useCallback(
    async (
      phone: string,
      forCurrentUser = false,
      email?: string
    ): Promise<{
      success: boolean;
      code?: string;
      error?: string;
      email?: string;
      sender?: string;
      domain?: string;
      emailPreview?: any;
    }> => {
      try {
        const res = await fetch(buildApiUrl('/api/auth/send-otp'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            phone,
            email,
            userId: forCurrentUser ? currentUser.id : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Could not send verification code.' };
        }
        addToast(
          'Verification Code Sent',
          email
            ? `From ChatTime <code@chattimeapp.name.ng>: Code for ${phone} sent to ${email}`
            : `ChatTime verification code for ${phone} generated.`,
          'info'
        );
        return {
          success: true,
          code: data.verificationCode,
          email: data.email,
          sender: data.sender || 'ChatTime <code@chattimeapp.name.ng>',
          domain: data.domain || 'chattimeapp.name.ng',
          emailPreview: data.emailPreview,
        };
      } catch {
        return { success: false, error: 'Network error sending verification code.' };
      }
    },
    [currentUser.id, addToast]
  );

  const verifyPhoneOtp = useCallback(
    async (
      phone: string,
      code: string,
      options?: { updateCurrentUser?: boolean; countryCode?: string; countryName?: string }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(buildApiUrl('/api/auth/verify-otp'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            phone,
            code,
            userId: options?.updateCurrentUser ? currentUser.id : undefined,
            countryCode: options?.countryCode,
            countryName: options?.countryName,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Invalid verification code.' };
        }
        if (data.user) {
          setUsers((prev) => ({ ...prev, [data.user.id]: data.user }));
          addToast(
            'Phone Number Verified',
            `Your phone number has been updated to ${data.user.phoneNumber}.`,
            'success'
          );
        }
        return { success: true };
      } catch {
        return { success: false, error: 'Network error verifying code.' };
      }
    },
    [currentUser.id, addToast]
  );

  // Register a brand new permanent user account
  const registerNewAccount = useCallback(
    async (params: RegisterAccountParams): Promise<{ user?: User; error?: string }> => {
      try {
        const res = await fetch(buildApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(params),
        });
        const data = await res.json();
        if (!res.ok) {
          addToast('Registration Error', data.error || 'Could not register account', 'error');
          return { error: data.error || 'Could not register account' };
        }
        const newUser: User = data;
        setUsers((prev) => ({ ...prev, [newUser.id]: newUser }));
        sessionStorage.setItem('chattime_active_user_id', newUser.id);
        localStorage.setItem('chattime_active_user_id', newUser.id);
        setActiveUserId(newUser.id);
        setActiveChatIdState(null);
        await fetchBootstrap(newUser.id);
        soundEffects.playNotification();
        addToast(
          'Welcome to ChatTime!',
          `${newUser.name} registered with number ${newUser.chatTimeNumber}`,
          'success'
        );
        return { user: newUser };
      } catch {
        addToast('Error', 'Failed to connect to registration server', 'error');
        return { error: 'Failed to connect to registration server' };
      }
    },
    [addToast, fetchBootstrap]
  );

  // Login to an existing user account by username or phone number
  const loginAccount = useCallback(
    async (identifier: string, pin?: string): Promise<{ user?: User; error?: string }> => {
      try {
        const res = await fetch(buildApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ identifier, pin }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: data.error || 'Login failed' };
        }
        const loggedInUser: User = data;
        setUsers((prev) => ({ ...prev, [loggedInUser.id]: loggedInUser }));
        sessionStorage.setItem('chattime_active_user_id', loggedInUser.id);
        localStorage.setItem('chattime_active_user_id', loggedInUser.id);
        setActiveUserId(loggedInUser.id);
        setActiveChatIdState(null);
        await fetchBootstrap(loggedInUser.id);
        soundEffects.playNotification();
        addToast(
          'Signed In',
          `Welcome back, ${loggedInUser.name} (${loggedInUser.chatTimeNumber})`,
          'success'
        );
        return { user: loggedInUser };
      } catch {
        return { error: 'Could not reach authentication server' };
      }
    },
    [addToast, fetchBootstrap]
  );

  // Send typing indicator over WebSocket
  const sendTypingSignal = useCallback(
    (chatId: string, isTyping: boolean) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isAuthenticated) {
        wsRef.current.send(
          JSON.stringify({
            type: 'chat:typing',
            chatId,
            userId: currentUser.id,
            userName: currentUser.name,
            isTyping,
          })
        );
      }
    },
    [currentUser.id, currentUser.name, isAuthenticated, platformFeatures.allowMessaging, addToast]
  );

  // Send recording audio indicator over WebSocket
  const sendRecordingSignal = useCallback(
    (chatId: string, isRecording: boolean) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isAuthenticated) {
        wsRef.current.send(
          JSON.stringify({
            type: 'chat:recording',
            chatId,
            userId: currentUser.id,
            userName: currentUser.name,
            isRecording,
          })
        );
      }
    },
    [currentUser.id, currentUser.name, isAuthenticated]
  );

  // Send a new message (persisted via API & broadcasted via WebSocket)
  const sendMessage = useCallback(
    async (
      chatId: string,
      content: string,
      type: MessageType = 'text',
      extra?: Partial<Message>
    ) => {
      if (!isAuthenticated) return;
      if (!platformFeatures.allowMessaging) {
        addToast('Messaging Unavailable', 'Sending new messages is temporarily disabled.', 'warning');
        return;
      }

      if (
        currentUser.isBanned ||
        currentUser.boundingDetails?.scope === 'full_block' ||
        currentUser.boundingDetails?.restrictions?.includes('messages')
      ) {
        addToast(
          'Action Restricted',
          'Your account messaging permissions have been bounded by an administrator.',
          'error'
        );
        return;
      }

      const activeDirectChat = chatsRef.current.find((c) => c.id === chatId);
      if (activeDirectChat?.type === 'direct') {
        const peerId = activeDirectChat.participants.find((p) => p !== currentUser.id);
        if (peerId && (currentUser.blockedUsers || currentUser.ghostedUsers || []).includes(peerId)) {
          addToast(
            'Contact Ghosted',
            'You have ghosted (blocked) this user. Unghost them to send messages.',
            'warning'
          );
          return;
        }
      }

      const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const previousLastMessage = chatsRef.current.find((chat) => chat.id === chatId)?.lastMessage;
      const replyPreview = replyingTo
        ? {
            senderName: replyingTo.senderName,
            text:
              replyingTo.type === 'text'
                ? replyingTo.content
                : `[${replyingTo.type.toUpperCase()}] ${replyingTo.content}`,
          }
        : undefined;

      const optimisticMessage: Message = {
        id: msgId,
        chatId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        type,
        content,
        replyToId: replyingTo?.id,
        replyToPreview: replyPreview,
        reactions: {},
        status: 'sending',
        timestamp: Date.now(),
        ...extra,
      };

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), optimisticMessage],
      }));

      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, lastMessage: optimisticMessage } : c))
      );

      setReplyingTo(null);
      soundEffects.playMessageSent();

      const targetChat = chatsRef.current.find((c) => c.id === chatId);

      try {
        const res = await fetch(buildApiUrl(`/api/chats/${chatId}/messages`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...optimisticMessage,
            participants: targetChat?.participants,
          }),
        });
        if (res.ok) {
          const savedMsg: Message = await res.json();
          setMessages((prev) => {
            const list = prev[chatId] || [];
            const mapped = list.map((m) => (m.id === msgId ? savedMsg : m));
            // Deduplicate by message id
            const seen = new Set<string>();
            const deduped = mapped.filter((m) => {
              if (seen.has(m.id)) return false;
              seen.add(m.id);
              return true;
            });
            return {
              ...prev,
              [chatId]: deduped,
            };
          });
        } else {
          const error = await res.json().catch(() => ({}));
          setMessages((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((message) =>
              message.id === msgId ? { ...message, status: 'failed' } : message
            ),
          }));
          setChats((prev) => prev.map((chat) =>
            chat.id === chatId && chat.lastMessage?.id === msgId
              ? { ...chat, lastMessage: previousLastMessage }
              : chat
          ));
          addToast('Message Not Sent', error.error || 'The server rejected this message.', 'warning');
        }
      } catch {
        setMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((m) =>
            m.id === msgId ? { ...m, status: 'failed' } : m
          ),
        }));
        setChats((prev) => prev.map((chat) =>
          chat.id === chatId && chat.lastMessage?.id === msgId
            ? { ...chat, lastMessage: previousLastMessage }
            : chat
        ));
        addToast('Message Not Sent', 'Check your connection and try again.', 'warning');
      }
    },
    [currentUser, isAuthenticated, replyingTo, platformFeatures.allowMessaging, addToast]
  );

  // Edit existing message
  const editMessage = useCallback(
    async (chatId: string, messageId: string, newContent: string) => {
      setMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
        ),
      }));
      setEditingMessage(null);
      fetch(`/api/chats/${chatId}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      }).catch(() => {});
      addToast('Message Edited', 'Your message has been updated.', 'info');
    },
    [addToast]
  );

  // Delete message
  const deleteMessage = useCallback(
    (chatId: string, messageId: string, forEveryone = true) => {
      setMessages((prev) => {
        const list = prev[chatId] || [];
        if (forEveryone) {
          return {
            ...prev,
            [chatId]: list.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: '🚫 This message was deleted',
                    type: 'text',
                    mediaUrl: undefined,
                  }
                : m
            ),
          };
        } else {
          return {
            ...prev,
            [chatId]: list.filter((m) => m.id !== messageId),
          };
        }
      });

      fetch(`/api/chats/${chatId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forEveryone, userId: currentUser.id }),
      }).catch(() => {});

      addToast('Message Deleted', 'Message removed from conversation.', 'info');
    },
    [currentUser.id, addToast]
  );

  // Forward message to another chat
  const forwardMessage = useCallback(
    (message: Message, targetChatId: string) => {
      sendMessage(targetChatId, message.content, message.type, {
        mediaUrl: message.mediaUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        locationData: message.locationData,
        contactData: message.contactData,
      });
      addToast('Message Forwarded', 'Message forwarded to conversation.', 'success');
    },
    [sendMessage, addToast]
  );

  // Toggle reaction on message
  const toggleReaction = useCallback(
    (chatId: string, messageId: string, emoji: string) => {
      setMessages((prev) => {
        const list = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: list.map((m) => {
            if (m.id !== messageId) return m;
            const currentUsers = m.reactions[emoji] || [];
            const hasReacted = currentUsers.includes(currentUser.id);
            const nextUsers = hasReacted
              ? currentUsers.filter((id) => id !== currentUser.id)
              : [...currentUsers, currentUser.id];
            const nextReactions = { ...m.reactions };
            if (nextUsers.length === 0) {
              delete nextReactions[emoji];
            } else {
              nextReactions[emoji] = nextUsers;
            }
            return { ...m, reactions: nextReactions };
          }),
        };
      });

      fetch(`/api/chats/${chatId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId: currentUser.id }),
      }).catch(() => {});
    },
    [currentUser.id]
  );

  // Pin / unpin a message inside chat
  const togglePinMessage = useCallback(
    (chatId: string, messageId: string) => {
      setMessages((prev) => {
        const list = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: list.map((m) => (m.id === messageId ? { ...m, isPinned: !m.isPinned } : m)),
        };
      });
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          const nextPinned = c.pinnedMessageId === messageId ? undefined : messageId;
          return { ...c, pinnedMessageId: nextPinned };
        })
      );
      fetch(`/api/chats/${chatId}/messages/${messageId}/pin`, { method: 'POST' }).catch(() => {});
      addToast('Pin Updated', 'Conversation pinned message updated.', 'info');
    },
    [addToast]
  );

  // Vote in an interactive poll
  const votePoll = useCallback(
    (chatId: string, messageId: string, optionId: string) => {
      setMessages((prev) => {
        const list = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: list.map((m) => {
            if (m.id !== messageId || !m.pollData) return m;
            const updatedOptions = m.pollData.options.map((opt) => {
              const filteredVotes = opt.votes.filter((uid) => uid !== currentUser.id);
              if (opt.id === optionId) {
                const alreadyVoted = opt.votes.includes(currentUser.id);
                return {
                  ...opt,
                  votes: alreadyVoted ? filteredVotes : [...filteredVotes, currentUser.id],
                };
              }
              return { ...opt, votes: filteredVotes };
            });
            return {
              ...m,
              pollData: { ...m.pollData, options: updatedOptions },
            };
          }),
        };
      });

      fetch(`/api/chats/${chatId}/messages/${messageId}/poll-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, userId: currentUser.id }),
      }).catch(() => {});
    },
    [currentUser.id]
  );

  // Mark a message as read in chat and update conversation preview
  const markMessageRead = useCallback(
    async (chatId: string, messageId: string, userId: string) => {
      setMessages((prev) => {
        const list = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: list.map((m) => {
            if (m.id !== messageId || m.status === 'read') return m;
            return {
              ...m,
              status: 'read',
              readAt: Date.now(),
            };
          }),
        };
      });
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          const isTargetLastMsg = !c.lastMessage || c.lastMessage.id === messageId;
          return {
            ...c,
            unreadCount: 0,
            lastMessage:
              c.lastMessage && isTargetLastMsg
                ? { ...c.lastMessage, status: 'read', readAt: Date.now() }
                : c.lastMessage,
          };
        })
      );
      try {
        await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/read`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch (err) {
        console.error('Failed to mark message as read:', err);
      }
    },
    []
  );

  const markViewOnceOpened = useCallback(
    (chatId: string, messageId: string) => {
      if (!currentUser.id) return;
      const now = Date.now();
      setMessages((prev) => {
        const list = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: list.map((m) => {
            if (m.id !== messageId) return m;
            const viewedBy = Array.from(new Set([...(m.viewedBy || []), currentUser.id]));
            return {
              ...m,
              isViewOnce: true,
              viewedBy,
              viewedAt: m.viewedAt || now,
              mediaUrl: undefined,
              content: 'Opened',
              status: 'read',
            };
          }),
        };
      });

      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId || c.lastMessage?.id !== messageId) return c;
          const viewedBy = Array.from(
            new Set([...(c.lastMessage.viewedBy || []), currentUser.id])
          );
          return {
            ...c,
            lastMessage: {
              ...c.lastMessage,
              isViewOnce: true,
              viewedBy,
              viewedAt: c.lastMessage.viewedAt || now,
              mediaUrl: undefined,
              content: 'Opened',
              status: 'read',
            },
          };
        })
      );

      fetch(`/api/chats/${chatId}/messages/${messageId}/view-once`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      }).catch(() => {});
    },
    [currentUser.id]
  );

  // Start or open a direct 1-on-1 chat
  const startDirectChat = useCallback(
    (targetUserId: string): string => {
      if (!currentUser.id || !targetUserId) return '';

      const existing = chatsRef.current.find(
        (c) =>
          c.type === 'direct' &&
          c.participants.includes(targetUserId) &&
          c.participants.includes(currentUser.id)
      );
      if (existing) {
        setActiveChatId(existing.id);
        setActiveTab('chats');
        fetch(`/api/chats/${existing.id}/messages`)
          .then((r) => (r.ok ? r.json() : null))
          .then((msgs) => {
            if (Array.isArray(msgs)) {
              setMessages((prev) => ({ ...prev, [existing.id]: msgs }));
            }
          })
          .catch(() => {});
        return existing.id;
      }

      const targetUser = usersRef.current[targetUserId] || users[targetUserId];
      const fallbackName = targetUser?.name || 'Direct Chat';
      const fallbackAvatar =
        targetUser?.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetUserId)}&backgroundColor=0d9488`;

      const newChatId = 'c_direct_' + [currentUser.id, targetUserId].sort().join('_');
      const newChat: Chat = {
        id: newChatId,
        type: 'direct',
        name: fallbackName,
        avatar: fallbackAvatar,
        participants: [currentUser.id, targetUserId],
        unreadCount: 0,
        folder: 'direct',
      };

      const nextChats = [newChat, ...chatsRef.current.filter((c) => c.id !== newChatId)];
      chatsRef.current = nextChats;
      setChats(nextChats);
      setMessages((prev) => ({ ...prev, [newChatId]: prev[newChatId] || [] }));
      setActiveChatId(newChatId);
      setActiveTab('chats');

      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChat),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((savedChat: Chat | null) => {
          if (savedChat && savedChat.id) {
            fetch(`/api/chats/${savedChat.id}/messages`)
              .then((mr) => (mr.ok ? mr.json() : null))
              .then((msgs) => {
                if (Array.isArray(msgs)) {
                  setMessages((prev) => ({ ...prev, [savedChat.id]: msgs }));
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});

      return newChatId;
    },
    [users, currentUser.id, setActiveChatId, setActiveTab]
  );

  // Create a new group chat
  const createGroupChat = useCallback(
    (
      name: string,
      participantIds: string[],
      description = '',
      isPublic = false
    ): string => {
      if (!platformFeatures.allowGroups) {
        addToast('Group Creation Unavailable', 'New groups are temporarily disabled.', 'warning');
        return '';
      }
      const newChatId = 'c_group_' + Date.now();
      const allParticipants = Array.from(new Set([currentUser.id, ...participantIds]));
      const roles: Record<string, 'creator' | 'admin' | 'member'> = {
        [currentUser.id]: 'creator',
      };
      participantIds.forEach((id) => {
        roles[id] = 'member';
      });

      const handleSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');

      const newChat: Chat = {
        id: newChatId,
        type: 'group',
        name,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
        description: description || 'Group conversation on ChatTime',
        participants: allParticipants,
        participantRoles: roles,
        admins: [currentUser.id],
        unreadCount: 0,
        folder: 'groups',
        isPublic,
        inviteLink: typeof window !== 'undefined' ? `${window.location.origin}/?chat=${newChatId}` : `/?chat=${newChatId}`,
        permissions: {
          canSendMessages: true,
          canAddMembers: true,
          canPinMessages: true,
          canChangeInfo: false,
        },
      };

      setChats((prev) => [newChat, ...prev]);
      setMessages((prev) => ({ ...prev, [newChatId]: [] }));
      setActiveChatId(newChatId);
      setActiveTab('chats');

      const rollbackGroup = () => {
        setChats((prev) => prev.filter((chat) => chat.id !== newChatId));
        setMessages((prev) => {
          const next = { ...prev };
          delete next[newChatId];
          return next;
        });
        setActiveChatIdState((current) => current === newChatId ? null : current);
      };

      void fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChat),
      })
        .then(async (response) => {
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            rollbackGroup();
            addToast('Group Not Created', result.error || 'The server rejected this group.', 'warning');
            return;
          }
          addToast('Group Created', `"${name}" is ready with ${allParticipants.length} members.`, 'success');
        })
        .catch(() => {
          rollbackGroup();
          addToast('Group Not Created', 'Check your connection and try again.', 'warning');
        });
      return newChatId;
    },
    [currentUser.id, setActiveChatId, platformFeatures.allowGroups, addToast]
  );

  const togglePinChat = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const nextPinned = !c.isPinned;
        fetch(`/api/chats/${chatId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPinned: nextPinned }),
        }).catch(() => {});
        return { ...c, isPinned: nextPinned };
      })
    );
  }, []);

  const toggleMuteChat = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const nextMuted = !c.isMuted;
        fetch(`/api/chats/${chatId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isMuted: nextMuted }),
        }).catch(() => {});
        return { ...c, isMuted: nextMuted };
      })
    );
  }, []);

  const clearChatHistory = useCallback(
    (chatId: string) => {
      setMessages((prev) => ({ ...prev, [chatId]: [] }));
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, lastMessage: undefined, unreadCount: 0 } : c
        )
      );
      fetch(`/api/chats/${chatId}/messages`, { method: 'DELETE' }).catch(() => {});
      addToast('Chat Cleared', 'All messages in this conversation have been cleared.', 'info');
    },
    [addToast]
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      setMessages((prev) => {
        const next = { ...prev };
        delete next[chatId];
        return next;
      });
      if (activeChatId === chatId) {
        setActiveChatIdState(null);
      }
      setIsInfoDrawerOpen(false);
      fetch(`/api/chats/${chatId}`, { method: 'DELETE' }).catch(() => {});
      addToast('Conversation Deleted', 'Conversation has been permanently removed.', 'warning');
    },
    [activeChatId, addToast]
  );

  const leaveOrDeleteChat = useCallback(
    (chatId: string) => {
      deleteChat(chatId);
    },
    [deleteChat]
  );

  const updateGroupPermissions = useCallback(
    (chatId: string, perms: Partial<GroupPermissions>) => {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          const nextPerms = {
            canSendMessages: true,
            canAddMembers: true,
            canPinMessages: true,
            canChangeInfo: false,
            ...c.permissions,
            ...perms,
          };
          fetch(`/api/chats/${chatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissions: nextPerms }),
          }).catch(() => {});
          return { ...c, permissions: nextPerms };
        })
      );
      addToast('Permissions Saved', 'Group member permissions updated.', 'success');
    },
    [addToast]
  );

  const updateMemberRole = useCallback(
    (chatId: string, userId: string, role: 'admin' | 'member') => {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          const roles = { ...(c.participantRoles || {}), [userId]: role };
          const admins = new Set(c.admins || []);
          if (role === 'admin') admins.add(userId);
          else admins.delete(userId);
          const nextAdmins = Array.from(admins);
          fetch(`/api/chats/${chatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantRoles: roles, admins: nextAdmins }),
          }).catch(() => {});
          return { ...c, participantRoles: roles, admins: nextAdmins };
        })
      );
      addToast(
        'Role Updated',
        `${users[userId]?.name || 'Member'} is now ${role}.`,
        'info'
      );
    },
    [users, addToast]
  );

  const addGroupMembers = useCallback(
    (chatId: string, memberIds: string[]) => {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          const nextParticipants = Array.from(new Set([...c.participants, ...memberIds]));
          const nextRoles = { ...(c.participantRoles || {}) };
          memberIds.forEach((id) => {
            if (!nextRoles[id]) nextRoles[id] = 'member';
          });
          fetch(`/api/chats/${chatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants: nextParticipants, participantRoles: nextRoles }),
          }).catch(() => {});
          return { ...c, participants: nextParticipants, participantRoles: nextRoles };
        })
      );
      addToast('Members Added', `${memberIds.length} member(s) added to group.`, 'success');
    },
    [addToast]
  );

  const removeGroupMember = useCallback(
    (chatId: string, userId: string) => {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          const nextParticipants = c.participants.filter((id) => id !== userId);
          fetch(`/api/chats/${chatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participants: nextParticipants }),
          }).catch(() => {});
          return {
            ...c,
            participants: nextParticipants,
          };
        })
      );
      addToast(
        'Member Removed',
        `${users[userId]?.name || 'User'} removed from group.`,
        'warning'
      );
    },
    [users, addToast]
  );

  // ==========================================
  // Real WebRTC Audio & Video Call Actions
  // ==========================================
  const startCall = useCallback(
    async (chatIdOrUserId: string, type: CallType) => {
      if (!platformFeatures.allowCalls) {
        addToast('Calls Unavailable', 'New calls are temporarily disabled by an administrator.', 'warning');
        return;
      }
      if (
        currentUser.isBanned ||
        currentUser.boundingDetails?.scope === 'full_block' ||
        currentUser.boundingDetails?.restrictions?.includes('calls')
      ) {
        addToast(
          'Calls Restricted',
          'Voice and video calls are restricted on your account by an administrator.',
          'error'
        );
        return;
      }

      let chat = chatsRef.current.find((c) => c.id === chatIdOrUserId);
      if (!chat) {
        // Check if chatIdOrUserId is a userId for a direct chat
        chat = chatsRef.current.find(
          (c) =>
            c.type === 'direct' &&
            c.participants.includes(chatIdOrUserId) &&
            c.participants.includes(currentUser.id)
        );
      }
      if (!chat && (usersRef.current[chatIdOrUserId] || users[chatIdOrUserId])) {
        const createdChatId = startDirectChat(chatIdOrUserId);
        chat = chatsRef.current.find((c) => c.id === createdChatId);
      }
      if (!chat) return;

      const otherParticipantIds = chat.participants.filter((id) => id !== currentUser.id);
      if (otherParticipantIds.length === 0) {
        addToast(
          'Cannot Start Call',
          'Add another member to this conversation before initiating a call.',
          'warning'
        );
        return;
      }

      if (chat.type === 'direct') {
        const peerId = otherParticipantIds[0];
        const isGhosted = (currentUser.blockedUsers || currentUser.ghostedUsers || []).includes(peerId);
        if (isGhosted) {
          addToast(
            'Contact Ghosted',
            'You have ghosted this user. Unghost them to place calls.',
            'warning'
          );
          return;
        }
      }

      let stream: MediaStream | null = null;
      try {
        stream = await webrtcService.acquireMedia(type === 'video');
        if (stream) {
          setLocalMediaStream(stream);
        }
      } catch (mediaErr: any) {
        soundEffects.stopOutgoingRingtone();
        const isNotAllowed =
          mediaErr?.name === 'NotAllowedError' || mediaErr?.name === 'PermissionDeniedError';
        addToast(
          isNotAllowed ? 'Permission Denied' : 'Device Error',
          isNotAllowed
            ? `Please allow access to your microphone ${type === 'video' ? 'and camera' : ''} in your browser to place calls.`
            : 'Could not access audio/video hardware.',
          'error'
        );
        return;
      }

      const participants = otherParticipantIds.map((id) => {
        const u = usersRef.current[id] || users[id];
        return {
          id,
          name: u?.name || chat!.name,
          avatar: u?.avatar || chat!.avatar,
          isMuted: false,
          isVideoOff: type === 'voice',
        };
      });

      const primaryPeerId = otherParticipantIds[0];
      const primaryPeer = usersRef.current[primaryPeerId] || users[primaryPeerId];
      const callId = 'call_' + Date.now();
      const displayChatName = chat.type === 'direct' && primaryPeer ? primaryPeer.name : chat.name;
      const displayAvatar = chat.type === 'direct' && primaryPeer ? primaryPeer.avatar : chat.avatar;

      const callState: ActiveCallState = {
        id: callId,
        type,
        isGroup: chat.type === 'group',
        chatId: chat.id,
        chatName: displayChatName,
        peerId: primaryPeerId,
        participants,
        status: 'calling',
        caller: {
          id: primaryPeerId,
          name: displayChatName,
          avatar: displayAvatar,
          number: primaryPeer?.phoneNumber || primaryPeer?.chatTimeNumber || 'Group Call',
        },
        startedAt: Date.now(),
        isMuted: false,
        isVideoOff: type === 'voice' || !stream?.getVideoTracks().length,
        isSpeakerOn: true,
        isRingtoneMuted: false,
        isFacingUser: true,
        isMinimized: false,
      };

      setActiveCall(callState);
      soundEffects.startOutgoingRingtone();

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        otherParticipantIds.forEach((targetId) => {
          wsRef.current?.send(
            JSON.stringify({
              type: 'call:initiate',
              callId,
              chatId: chat!.id,
              userId: currentUser.id,
              targetUserId: targetId,
              data: {
                callType: type,
                caller: {
                  id: currentUser.id,
                  name: currentUser.name,
                  avatar: currentUser.avatar,
                  number: currentUser.phoneNumber || currentUser.chatTimeNumber,
                },
              },
            })
          );
        });

        // 35-second call timeout if recipient does not answer
        setTimeout(() => {
          const current = activeCallRef.current;
          if (current && current.id === callId && current.status === 'calling') {
            soundEffects.stopOutgoingRingtone();
            soundEffects.playCallEnded();
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              otherParticipantIds.forEach((targetId) => {
                wsRef.current?.send(
                  JSON.stringify({
                    type: 'call:cancel',
                    callId,
                    userId: currentUser.id,
                    targetUserId: targetId,
                  })
                );
              });
            }
            teardownCallState({
              title: 'No Answer',
              message: `${displayChatName} did not answer.`,
              type: 'info',
            });
          }
        }, 35000);
      } else {
        soundEffects.stopOutgoingRingtone();
        webrtcService.cleanup();
        setLocalMediaStream(null);
        addToast('Connection Error', 'Cannot place call while disconnected from server.', 'error');
        setActiveCall(null);
      }
    },
    [users, currentUser, platformFeatures.allowCalls, addToast, startDirectChat, teardownCallState]
  );

  const receiveIncomingCall = useCallback(
    (callerId?: string, type: CallType = 'voice') => {
      let caller = callerId ? users[callerId] : undefined;
      if (!caller) {
        caller = Object.values(users).find((u) => u.id !== currentUser.id);
      }
      const callerIdToUse = caller?.id || 'contact';
      const callerName = caller?.name || 'Contact';
      const callerAvatar = caller?.avatar || '';
      const callerNumber =
        caller?.phoneNumber || caller?.chatTimeNumber || '';

      soundEffects.startIncomingRingtone();
      startCallRinging(callerName, type);
      showSystemNotification(
        `Incoming ${type === 'video' ? 'Video' : 'Voice'} Call`,
        `${callerName} is calling you on Chat Time Business`,
        `call-in-${Date.now()}`
      );

      const existingChat = chats.find(
        (c) => c.type === 'direct' && c.participants.includes(callerIdToUse)
      );

      setActiveCall({
        id: 'call_in_' + Date.now(),
        type,
        isGroup: false,
        chatId:
          existingChat?.id ||
          (caller?.id
            ? 'c_direct_' + [currentUser.id, caller.id].sort().join('_')
            : 'c_direct'),
        chatName: callerName,
        peerId: callerIdToUse,
        participants: [
          {
            id: callerIdToUse,
            name: callerName,
            avatar: callerAvatar,
            isMuted: false,
            isVideoOff: type === 'voice',
          },
        ],
        status: 'incoming',
        caller: {
          id: callerIdToUse,
          name: callerName,
          avatar: callerAvatar,
          number: callerNumber,
        },
        startedAt: Date.now(),
        isMuted: false,
        isVideoOff: type === 'voice',
        isSpeakerOn: true,
        isRingtoneMuted: false,
        isFacingUser: true,
        isMinimized: false,
      });
    },
    [users, chats, currentUser.id, showSystemNotification]
  );

  const acceptIncomingCall = useCallback(
    async (options?: { isVideoOff?: boolean; facingMode?: 'user' | 'environment' }) => {
      const current = activeCallRef.current;
      if (!current) return;

      soundEffects.stopIncomingRingtone();
      soundEffects.stopOutgoingRingtone();
      stopCallRinging();

      const shouldVideoBeOff = options?.isVideoOff ?? false;
      const facing = options?.facingMode ?? 'user';

      let stream: MediaStream | null = null;
      try {
        stream = await webrtcService.acquireMedia(
          current.type === 'video',
          facing,
          { isVideoOff: shouldVideoBeOff }
        );
        if (stream) {
          setLocalMediaStream(stream);
        }
      } catch (err) {
        console.warn('[Call] Could not acquire media for incoming call:', err);
        addToast(
          'Permissions Required',
          `Please allow access to your microphone ${current.type === 'video' && !shouldVideoBeOff ? 'and camera' : ''} to answer this call.`,
          'error'
        );
        teardownCallState();
        return;
      }

      setActiveCall((prev) =>
        prev
          ? {
              ...prev,
              status: 'connecting',
              startedAt: Date.now(),
              isVideoOff: shouldVideoBeOff || (current.type === 'video' && !stream?.getVideoTracks().length),
            }
          : null
      );

      const targetPeerId = current.peerId || current.caller.id;
      const myId = activeUserIdRef.current;

      if (shouldVideoBeOff && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && targetPeerId) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call:media-state',
            callId: current.id,
            userId: myId,
            targetUserId: targetPeerId,
            data: { isMuted: false, isVideoOff: true },
          })
        );
      }

    if (targetPeerId && myId) {
      try {
        await webrtcService.createPeerConnection(
          targetPeerId,
          current.id,
          (candidate) => {
            wsRef.current?.send(
              JSON.stringify({
                type: 'webrtc:ice-candidate',
                userId: myId,
                targetUserId: targetPeerId,
                callId: current.id,
                data: { candidate },
              })
            );
          }
        );
      } catch (e) {
        console.warn('[WebRTC] Peer connection init error on answer:', e);
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call:accept',
          callId: current.id,
          chatId: current.chatId,
          userId: currentUser.id,
          targetUserId: targetPeerId,
        })
      );
    }
  }, [currentUser.id, addToast, teardownCallState]);

  const endActiveCall = useCallback(() => {
    soundEffects.stopIncomingRingtone();
    soundEffects.stopOutgoingRingtone();
    soundEffects.playCallEnded();
    webrtcService.cleanup();
    setLocalMediaStream(null);
    setRemoteMediaStream(null);

    const current = activeCallRef.current;
    if (current) {
      const targetPeerId = current.peerId || current.caller.id;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const eventType =
          current.status === 'incoming'
            ? 'call:reject'
            : current.status === 'calling'
            ? 'call:cancel'
            : 'call:end';

        wsRef.current.send(
          JSON.stringify({
            type: eventType,
            callId: current.id,
            userId: currentUser.id,
            targetUserId: targetPeerId,
          })
        );
      }

      const durationSec =
        current.status === 'connected'
          ? Math.max(1, Math.floor((Date.now() - current.startedAt) / 1000))
          : 0;

      const newRecord: CallRecord = {
        id: 'cr_' + Date.now(),
        type: current.type,
        isGroup: current.isGroup,
        chatId: current.chatId,
        chatName: current.chatName,
        callerId: current.caller.id,
        callerName: current.caller.name,
        callerAvatar: current.caller.avatar,
        callerNumber: current.caller.number,
        receiverId: currentUser.id,
        direction: current.status === 'incoming' ? 'missed' : 'outgoing',
        status: current.status === 'connected' ? 'ended' : 'missed',
        startedAt: current.startedAt,
        duration: durationSec,
      };

      setCalls((cPrev) => [newRecord, ...cPrev]);

      fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      }).catch(() => {});
    }

    teardownCallState();
  }, [currentUser.id, teardownCallState]);

  const toggleCallMute = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextMuted = !prev.isMuted;
      webrtcService.toggleAudio(!nextMuted);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call:media-state',
            callId: prev.id,
            userId: activeUserIdRef.current,
            targetUserId: prev.peerId || prev.caller.id,
            data: { isMuted: nextMuted, isVideoOff: prev.isVideoOff },
          })
        );
      }
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  const toggleCallVideo = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current) return;
    const nextVideoOff = !current.isVideoOff;
    const cameraReady = await webrtcService.setVideoEnabled(!nextVideoOff);
    if (!cameraReady) {
      if (!nextVideoOff) {
        addToast(
          'Camera Unavailable',
          'Allow camera access in your browser settings, then try again.',
          'warning'
        );
      }
      return;
    }

    setActiveCall((prev) => {
      if (!prev || prev.id !== current.id) return prev;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call:media-state',
            callId: prev.id,
            userId: activeUserIdRef.current,
            targetUserId: prev.peerId || prev.caller.id,
            data: { isMuted: prev.isMuted, isVideoOff: nextVideoOff },
          })
        );
      }
      return { ...prev, isVideoOff: nextVideoOff };
    });
  }, [addToast]);

  const toggleCallSpeaker = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, isSpeakerOn: !prev.isSpeakerOn } : null));
  }, []);

  const toggleMuteRingtone = useCallback(() => {
    soundEffects.stopIncomingRingtone();
    soundEffects.stopOutgoingRingtone();
    setActiveCall((prev) => (prev ? { ...prev, isRingtoneMuted: true } : null));
  }, []);

  const flipCallCamera = useCallback(async () => {
    const nextMode = await webrtcService.flipCamera();
    const newStream = webrtcService.getLocalStream();
    if (newStream) {
      setLocalMediaStream(new MediaStream(newStream.getTracks()));
    }
    setActiveCall((prev) => (prev ? { ...prev, isFacingUser: nextMode === 'user' } : null));
    return nextMode;
  }, []);

  const toggleCallScreenShare = useCallback(async () => {
    const screenStream = await webrtcService.startScreenShare();
    if (screenStream) {
      setLocalMediaStream(screenStream);
      setActiveCall((prev) => (prev ? { ...prev, isVideoOff: false } : null));
      addToast('Screen Sharing', 'Your screen is now being shared in the call.', 'info');
    } else {
      addToast('Screen Share', 'Screen sharing is only available on supported desktop/mobile browsers.', 'info');
    }
  }, [addToast]);

  const toggleCallMinimize = useCallback(() => {
    setActiveCall((prev) => (prev ? { ...prev, isMinimized: !prev.isMinimized } : null));
  }, []);

  const clearCallHistory = useCallback(() => {
    setCalls([]);
    fetch('/api/calls', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    }).catch(() => {});
    addToast('Call Logs Cleared', 'Your call history has been cleared.', 'info');
  }, [currentUser.id, addToast]);

  // ==========================================
  // Status / Stories & History Actions
  // ==========================================
  const postStatusStory = useCallback(
    async (story: Omit<StatusStory, 'id' | 'timestamp' | 'expiresAt' | 'viewers'>) => {
      const newStory: StatusStory = {
        ...story,
        id: 'st_' + Date.now(),
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        viewers: [],
      };
      setStatuses((prev) => [newStory, ...prev]);

      fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStory),
      }).catch(() => {});

      addToast('Status Published', 'Your 24-hour story is now live.', 'success');
    },
    [addToast]
  );

  const deleteStatusStory = useCallback(
    (storyId: string) => {
      setStatuses((prev) => prev.filter((s) => s.id !== storyId));
      setStatusHistory((prev) => prev.filter((s) => s.id !== storyId));
      fetch(`/api/stories/${storyId}`, { method: 'DELETE' }).catch(() => {});
      addToast('Status Deleted', 'Your status has been deleted.', 'info');
    },
    [addToast]
  );

  const archiveStatusStory = useCallback(
    async (storyId: string) => {
      try {
        const res = await fetch(`/api/stories/${storyId}/archive`, { method: 'POST' });
        if (res.ok) {
          const archived: StatusStory = await res.json();
          setStatuses((prev) => prev.filter((s) => s.id !== storyId));
          setStatusHistory((prev) => [archived, ...prev.filter((s) => s.id !== storyId)]);
          addToast('Moved to History', 'Status moved to your Status History archive.', 'info');
        }
      } catch {
        // Fallback local move
        const target = statuses.find((s) => s.id === storyId);
        if (target) {
          const archived = { ...target, isExpired: true, archivedAt: Date.now() };
          setStatuses((prev) => prev.filter((s) => s.id !== storyId));
          setStatusHistory((prev) => [archived, ...prev]);
        }
      }
    },
    [statuses, addToast]
  );

  const clearStatusHistory = useCallback(() => {
    setStatusHistory((prev) => prev.filter((s) => s.userId !== currentUser.id));
    fetch(`/api/stories/history/${currentUser.id}`, { method: 'DELETE' }).catch(() => {});
    addToast('Status History Cleared', 'All archived statuses have been cleared.', 'info');
  }, [currentUser.id, addToast]);

  const markStoryViewed = useCallback(
    (storyId: string) => {
      const viewerObj = {
        userId: currentUser.id,
        userName: currentUser.name,
        avatar: currentUser.avatar,
        viewedAt: Date.now(),
      };
      setStatuses((prev) =>
        prev.map((s) => {
          if (s.id !== storyId || s.userId === currentUser.id) return s;
          if (s.viewers.some((v) => v.userId === currentUser.id)) return s;
          return {
            ...s,
            viewers: [...s.viewers, viewerObj],
          };
        })
      );

      fetch(`/api/stories/${storyId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer: viewerObj }),
      }).catch(() => {});
    },
    [currentUser]
  );

  const reactToStatusStory = useCallback(
    (storyId: string, emoji: string) => {
      if (!currentUser.id) return;
      setStatuses((prev) =>
        prev.map((s) => {
          if (s.id !== storyId) return s;
          const reactions = { ...(s.reactions || {}) };
          const list = reactions[emoji] || [];
          if (list.includes(currentUser.id)) {
            reactions[emoji] = list.filter((id) => id !== currentUser.id);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...list, currentUser.id];
          }
          return { ...s, reactions };
        })
      );

      fetch(`/api/stories/${storyId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId: currentUser.id }),
      }).catch(() => {});

      soundEffects.playMessageSent();
      addToast('Reaction Sent', `You reacted ${emoji} to this status update.`, 'success');
    },
    [currentUser.id, addToast]
  );

  const updateStatusPrivacy = useCallback(
    (visibility: 'everyone' | 'contacts' | 'selected', selectedViewers?: string[]) => {
      const updatedPrivacy = {
        ...currentUser.privacySettings,
        statusVisibility: visibility,
        selectedStatusViewers: selectedViewers || currentUser.privacySettings.selectedStatusViewers || [],
      };
      setUsers((prev) => ({
        ...prev,
        [currentUser.id]: {
          ...currentUser,
          privacySettings: updatedPrivacy,
        },
      }));
      fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacySettings: updatedPrivacy }),
      }).catch(() => {});
      addToast('Status Privacy Saved', `Your status audience is set to "${visibility}".`, 'success');
    },
    [currentUser, addToast]
  );

  // ==========================================
  // Communities / Channels Actions
  // ==========================================
  const createCommunity = useCallback(
    async (params: CreateCommunityParams): Promise<ChannelItem | null> => {
      if (!platformFeatures.allowCommunities) {
        addToast('Community Creation Unavailable', 'New communities are temporarily disabled.', 'warning');
        return null;
      }
      try {
        const res = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            creatorId: currentUser.id,
            members: [currentUser.id],
          }),
        });
        if (!res.ok) {
          addToast('Error', 'Could not create community.', 'error');
          return null;
        }
        const { channel, chat } = await res.json();
        if (channel) {
          setChannels((prev) => [channel, ...prev.filter((c) => c.id !== channel.id)]);
        }
        if (chat) {
          setChats((prev) => [chat, ...prev.filter((c) => c.id !== chat.id)]);
        }
        soundEffects.playNotification();
        addToast('Community Created', `"${channel.name}" is now live with community chat!`, 'success');
        return channel;
      } catch {
        addToast('Error', 'Network error creating community.', 'error');
        return null;
      }
    },
    [currentUser.id, platformFeatures.allowCommunities, addToast]
  );

  const toggleSubscribeChannel = useCallback(
    async (channelId: string) => {
      try {
        const res = await fetch(`/api/channels/${channelId}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        });
        if (res.ok) {
          const updated: ChannelItem = await res.json();
          setChannels((prev) => prev.map((ch) => (ch.id === channelId ? updated : ch)));
          const isMember = updated.members?.includes(currentUser.id);
          addToast(
            isMember ? 'Joined Community' : 'Left Community',
            isMember
              ? `You joined ${updated.name}. Community chat and alerts enabled.`
              : `You left ${updated.name}.`,
            isMember ? 'success' : 'info'
          );
          await fetchBootstrap(currentUser.id);
        }
      } catch {
        // Ignore
      }
    },
    [currentUser.id, addToast, fetchBootstrap]
  );

  const openCommunityChat = useCallback(
    (channelId: string) => {
      const channel = channels.find((c) => c.id === channelId);
      if (!channel) return;

      if (channel.chatId) {
        const existingChat = chats.find((c) => c.id === channel.chatId);
        if (existingChat) {
          setActiveChatId(existingChat.id);
          setActiveTab('chats');
          return;
        }
      }
      // If chat isn't created yet or found, create/link a group chat for the community
      const newChatId = channel.chatId || `c_comm_${channel.id}`;
      const newChat: Chat = {
        id: newChatId,
        type: 'group',
        name: `${channel.name} (Community Chat)`,
        avatar: channel.avatar,
        description: channel.description,
        participants: Array.from(new Set([currentUser.id, ...(channel.members || [])])),
        participantRoles: { [currentUser.id]: 'creator' },
        admins: [currentUser.id],
        unreadCount: 0,
        folder: 'groups',
        isPublic: true,
        communityId: channel.id,
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChatId);
      setActiveTab('chats');
      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChat),
      }).catch(() => {});
    },
    [channels, chats, currentUser.id, setActiveChatId]
  );

  const manageCommunityMember = useCallback(
    async (
      channelId: string,
      targetUserId: string,
      action: 'add' | 'remove' | 'promote_admin' | 'promote_moderator' | 'demote'
    ) => {
      try {
        const res = await fetch(`/api/channels/${channelId}/members/${targetUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        if (res.ok) {
          const updated: ChannelItem = await res.json();
          setChannels((prev) => prev.map((ch) => (ch.id === channelId ? updated : ch)));
          addToast('Member Updated', 'Community member permissions updated.', 'success');
        }
      } catch {
        addToast('Error', 'Could not update community member.', 'error');
      }
    },
    [addToast]
  );

  const postCommunityAnnouncement = useCallback(
    async (
      channelId: string,
      title: string,
      content: string,
      priority: 'normal' | 'important' | 'urgent' = 'normal'
    ) => {
      try {
        const res = await fetch(`/api/channels/${channelId}/announcements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            priority,
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
          }),
        });
        if (res.ok) {
          const { channel } = await res.json();
          if (channel) {
            setChannels((prev) => prev.map((ch) => (ch.id === channelId ? channel : ch)));
          }
          soundEffects.playNotification();
          addToast('Announcement Broadcasted', 'All community members have been notified.', 'success');
        }
      } catch {
        addToast('Error', 'Could not post announcement.', 'error');
      }
    },
    [currentUser, addToast]
  );

  const createChannelPost = useCallback(
    async (channelId: string, title: string, content: string, mediaUrl?: string) => {
      try {
        const res = await fetch(`/api/channels/${channelId}/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            mediaUrl,
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
          }),
        });
        if (res.ok) {
          const updatedChannel: ChannelItem = await res.json();
          setChannels((prev) =>
            prev.map((ch) => (ch.id === channelId ? updatedChannel : ch))
          );
          addToast('Post Published', 'Your update is now live in the community.', 'success');
        }
      } catch {
        addToast('Error', 'Could not publish post.', 'error');
      }
    },
    [currentUser, addToast]
  );

  const reactChannelPost = useCallback(
    (channelId: string, postId: string, emoji: string) => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          return {
            ...ch,
            posts: ch.posts.map((p) => {
              if (p.id !== postId) return p;
              const currentCount = p.reactions[emoji] || 0;
              const isSame = p.userReaction === emoji;
              return {
                ...p,
                userReaction: isSame ? undefined : emoji,
                reactions: {
                  ...p.reactions,
                  [emoji]: isSame ? Math.max(0, currentCount - 1) : currentCount + 1,
                },
              };
            }),
          };
        })
      );

      fetch(`/api/channels/${channelId}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      }).catch(() => {});
    },
    []
  );

  const commentChannelPost = useCallback(
    async (channelId: string, postId: string, content: string) => {
      if (!content.trim()) return;
      try {
        const res = await fetch(`/api/channels/${channelId}/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            content: content.trim(),
          }),
        });
        if (res.ok) {
          const updatedChannel: ChannelItem = await res.json();
          setChannels((prev) =>
            prev.map((ch) => (ch.id === channelId ? updatedChannel : ch))
          );
        }
      } catch {
        addToast('Error', 'Could not post comment', 'error');
      }
    },
    [currentUser, addToast]
  );

  // Update Current User Profile & Settings
  const updateCurrentUser = useCallback(
    (updates: Partial<User>) => {
      if (!currentUser.id) return;
      const userId = currentUser.id;
      setUsers((prev) => {
        const existing = prev[userId] || currentUser;
        const updated = { ...existing, ...updates };
        return {
          ...prev,
          [userId]: updated,
        };
      });

      // Immediate local cascading update for instant UI responsiveness
      if (updates.avatar || updates.name) {
        const newAvatar = updates.avatar;
        const newName = updates.name;
        setMessages((prevMsgs) => {
          const next = { ...prevMsgs };
          let changed = false;
          for (const cId of Object.keys(next)) {
            const list = next[cId];
            if (list && list.some((m) => m.senderId === userId)) {
              changed = true;
              next[cId] = list.map((m) =>
                m.senderId === userId
                  ? {
                      ...m,
                      ...(newAvatar ? { senderAvatar: newAvatar } : {}),
                      ...(newName ? { senderName: newName } : {}),
                    }
                  : m
              );
            }
          }
          return changed ? next : prevMsgs;
        });
        setCalls((prevCalls) =>
          prevCalls.map((c) => ({
            ...c,
            ...(c.callerId === userId
              ? {
                  ...(newAvatar ? { callerAvatar: newAvatar } : {}),
                  ...(newName ? { callerName: newName } : {}),
                }
              : {}),
            ...(c.receiverId === userId
              ? {
                  ...(newAvatar ? { receiverAvatar: newAvatar } : {}),
                  ...(newName ? { receiverName: newName } : {}),
                }
              : {}),
          }))
        );
        setStatuses((prev) =>
          prev.map((s) =>
            s.userId === userId
              ? {
                  ...s,
                  ...(newAvatar ? { userAvatar: newAvatar } : {}),
                  ...(newName ? { userName: newName } : {}),
                }
              : s
          )
        );
      }
      accountSaveQueueRef.current = accountSaveQueueRef.current
        .catch(() => {})
        .then(async () => {
          const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || 'Could not save account changes.');
          setUsers((usersNow) => ({
            ...usersNow,
            [userId]: { ...usersNow[userId], ...data },
          }));
          addToast('Profile Saved', 'Your account changes are stored.', 'success');
        })
        .catch(() => {
          addToast('Save Failed', 'Your changes could not reach the server. Please try again.', 'error');
        });
    },
    [currentUser, addToast]
  );

  const updateNotificationSettings = useCallback(
    (updates: Partial<NotificationSettings>) => {
      if (!currentUser.id) return;
      const merged: NotificationSettings = {
        messagePreviews: true,
        soundEffects: true,
        callRingtone: true,
        ringtoneStyle: 'harmonic',
        ringtoneVolume: 80,
        communityAlerts: true,
        ...(currentUser.notificationSettings || {}),
        ...updates,
      };
      updateCurrentUser({ notificationSettings: merged });
    },
    [currentUser, updateCurrentUser]
  );

  const toggleContact = useCallback(
    (targetUserId: string) => {
      if (!currentUser.id || targetUserId === currentUser.id) return;
      const currentContacts = currentUser.contacts || [];
      const isSaved = currentContacts.includes(targetUserId);
      const nextContacts = isSaved
        ? currentContacts.filter((id) => id !== targetUserId)
        : [...currentContacts, targetUserId];

      setUsers((prev) => {
        const existing = prev[currentUser.id] || currentUser;
        return {
          ...prev,
          [currentUser.id]: { ...existing, contacts: nextContacts },
        };
      });

      fetch(`/api/users/${currentUser.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          action: isSaved ? 'remove' : 'add',
        }),
      }).catch(() => {});
    },
    [currentUser]
  );

  const isUserGhosted = useCallback(
    (userId: string) => {
      if (!userId) return false;
      const blocked = currentUser.blockedUsers || currentUser.ghostedUsers || [];
      return blocked.includes(userId);
    },
    [currentUser.blockedUsers, currentUser.ghostedUsers]
  );

  const toggleGhostUser = useCallback(
    async (targetUserId: string) => {
      if (!currentUser.id || !targetUserId || targetUserId === currentUser.id) return;
      const currentBlocked = currentUser.blockedUsers || currentUser.ghostedUsers || [];
      const isAlreadyGhosted = currentBlocked.includes(targetUserId);
      const nextBlocked = isAlreadyGhosted
        ? currentBlocked.filter((id) => id !== targetUserId)
        : [...currentBlocked, targetUserId];

      const targetUser = users[targetUserId] || usersRef.current[targetUserId];
      const targetName = targetUser?.name || 'Contact';

      setUsers((prev) => {
        const existing = prev[currentUser.id] || currentUser;
        return {
          ...prev,
          [currentUser.id]: {
            ...existing,
            blockedUsers: nextBlocked,
            ghostedUsers: nextBlocked,
          },
        };
      });

      fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockedUsers: nextBlocked,
          ghostedUsers: nextBlocked,
        }),
      }).catch(() => {});

      if (isAlreadyGhosted) {
        soundEffects.playNotification();
        addToast(
          'Contact Unghosted',
          `${targetName} has been unghosted. You can now chat and call normally.`,
          'success'
        );
      } else {
        soundEffects.playNotification();
        addToast(
          '👻 Contact Ghosted (Blocked)',
          `${targetName} is now ghosted. They cannot message, call, or see your status.`,
          'info'
        );
      }
    },
    [currentUser, users, addToast]
  );

  const ghostUser = useCallback(
    async (targetUserId: string) => {
      const currentBlocked = currentUser.blockedUsers || currentUser.ghostedUsers || [];
      if (!currentBlocked.includes(targetUserId)) {
        await toggleGhostUser(targetUserId);
      }
    },
    [currentUser.blockedUsers, currentUser.ghostedUsers, toggleGhostUser]
  );

  const unghostUser = useCallback(
    async (targetUserId: string) => {
      const currentBlocked = currentUser.blockedUsers || currentUser.ghostedUsers || [];
      if (currentBlocked.includes(targetUserId)) {
        await toggleGhostUser(targetUserId);
      }
    },
    [currentUser.blockedUsers, currentUser.ghostedUsers, toggleGhostUser]
  );

  // Search users across the database by username, generated number, phone, or name
  const searchUsers = useCallback(
    async (query: string): Promise<User[]> => {
      const cleaned = query.trim();
      if (!cleaned) return [];
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(cleaned)}`);
        if (res.ok) {
          const list: User[] = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setUsers((prev) => {
              const updated = { ...prev };
              list.forEach((u) => {
                if (u && u.id) updated[u.id] = u;
              });
              return updated;
            });
          }
          return list;
        }
      } catch (err) {
        console.warn('[Search] Failed to search users:', err);
      }
      return [];
    },
    []
  );

  // Find user by ChatTime number, phone number, or username
  const addNewContactByNumber = useCallback(
    async (query: string): Promise<User | null> => {
      const cleaned = query.trim().toLowerCase();
      if (!cleaned) return null;

      const digitsOnly = cleaned.replace(/[^0-9]/g, '');
      const usernameClean = cleaned.replace(/^@/, '');

      // 1. Check local state first with strict complete matching rules
      let found = (Object.values(users) as User[]).find((u) => {
        if (u.id === currentUser.id) return false;
        const uNumDigits = (u.chatTimeNumber || '').replace(/[^0-9]/g, '');
        const uPhoneDigits = (u.phoneNumber || '').replace(/[^0-9]/g, '');
        const uUsername = (u.username || '').toLowerCase();

        // Exact username match (min 3 characters)
        if (usernameClean.length >= 3 && uUsername === usernameClean) return true;

        // Complete phone match (min 7 digits)
        if (digitsOnly.length >= 7) {
          if (
            uNumDigits === digitsOnly ||
            uPhoneDigits === digitsOnly ||
            uNumDigits.endsWith(digitsOnly) ||
            uPhoneDigits.endsWith(digitsOnly)
          ) {
            return true;
          }
        }
        return false;
      });

      // 2. If not found in local memory, search server database
      if (!found) {
        try {
          const serverResults = await searchUsers(query);
          const candidate = serverResults.find((u) => u.id !== currentUser.id);
          if (candidate) {
            found = candidate;
          }
        } catch {
          // ignore
        }
      }

      if (found) {
        const currentContacts = currentUser.contacts || [];
        if (!currentContacts.includes(found.id)) {
          const nextContacts = [...currentContacts, found.id];
          setUsers((prev) => {
            const existing = prev[currentUser.id] || currentUser;
            return {
              ...prev,
              [found.id]: found,
              [currentUser.id]: { ...existing, contacts: nextContacts },
            };
          });
          fetch(`/api/users/${currentUser.id}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: found.id, action: 'add' }),
          }).catch(() => {});
        }
      }

      return found || null;
    },
    [users, currentUser, updateCurrentUser, searchUsers]
  );

  // ==========================================
  // Admin & Moderation Actions
  // ==========================================
  const submitReport = useCallback(
    (
      targetType: AdminReport['targetType'],
      targetId: string,
      targetName: string,
      reason: string,
      details: string
    ) => {
      const newReport: AdminReport = {
        id: 'rep_' + Date.now(),
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        targetType,
        targetId,
        targetName,
        reason,
        details,
        status: 'pending',
        timestamp: Date.now(),
      };
      setReports((prev) => [newReport, ...prev]);

      fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      }).catch(() => {});

      addToast('Report Submitted', `Thank you. Moderation team will review ${targetName}.`, 'info');
    },
    [currentUser, addToast]
  );

  const resolveReport = useCallback(
    (reportId: string, status: 'resolved' | 'dismissed') => {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminId: currentUser.id }),
      }).catch(() => {});
      addToast('Report Updated', `Report marked as ${status}.`, 'success');
    },
    [currentUser.id, addToast]
  );

  const toggleBanUser = useCallback(
    (userId: string) => {
      setUsers((prev) => {
        const u = prev[userId];
        if (!u) return prev;
        const nextBan = !u.isBanned;
        fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isBanned: nextBan }),
        }).catch(() => {});
        addToast(
          nextBan ? 'User Suspended' : 'User Restored',
          `${u.name} has been ${nextBan ? 'suspended' : 'unbanned'}.`,
          nextBan ? 'warning' : 'success'
        );
        return { ...prev, [userId]: { ...u, isBanned: nextBan } };
      });
    },
    [addToast]
  );

  const toggleVerifyUser = useCallback(
    async (userId: string) => {
      const user = users[userId];
      if (!user) return;
      const nextVerified = !user.isVerified;
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVerified: nextVerified, adminId: currentUser.id }),
        });
        const updated: User = await response.json();
        if (!response.ok) throw new Error('Could not update verification status.');
        setUsers((prev) => ({ ...prev, [userId]: updated }));
        addToast(
          nextVerified ? 'Badge Granted' : 'Badge Revoked',
          `Verification updated for ${user.name}.`,
          'info'
        );
      } catch {
        addToast('Admin Action Failed', 'Could not update verification status.', 'error');
      }
    },
    [users, currentUser.id, addToast]
  );

  const setVerificationBadgeByAdmin = useCallback(
    async (userId: string, badgeType: 'blue' | 'red' | 'none') => {
      const isVerified = badgeType !== 'none';
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isVerified,
            badgeType: badgeType === 'none' ? 'blue' : badgeType,
            isRedVerified: badgeType === 'red',
            adminId: currentUser.id,
          }),
        });
        const updated: User = await response.json();
        if (!response.ok) throw new Error('Could not update verification badge.');
        setUsers((prev) => ({ ...prev, [userId]: updated }));
        addToast(
          isVerified ? (badgeType === 'red' ? 'Red Tick Verified' : 'Blue Tick Verified') : 'Badge Revoked',
          `Verification status updated for ${updated.name}.`,
          'info'
        );
      } catch {
        addToast('Admin Action Failed', 'Could not update verification badge.', 'error');
      }
    },
    [currentUser.id, addToast]
  );

  const toggleFollowUser = useCallback(
    async (targetUserId: string) => {
      if (!currentUser.id || !targetUserId || targetUserId === currentUser.id) return;
      const currentFollowing = currentUser.following || [];
      const isFollowing = currentFollowing.includes(targetUserId);
      const nextFollowing = isFollowing
        ? currentFollowing.filter((id) => id !== targetUserId)
        : [...currentFollowing, targetUserId];

      setUsers((prev) => {
        const u = prev[currentUser.id] || currentUser;
        const target = prev[targetUserId];
        const nextTargetFollowers = target
          ? isFollowing
            ? (target.followers || []).filter((id) => id !== currentUser.id)
            : [...(target.followers || []), currentUser.id]
          : [];
        return {
          ...prev,
          [currentUser.id]: { ...u, following: nextFollowing },
          ...(target ? { [targetUserId]: { ...target, followers: nextTargetFollowers } } : {}),
        };
      });

      try {
        await fetch(`/api/users/${currentUser.id}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId, action: isFollowing ? 'unfollow' : 'follow' }),
        });
      } catch {}

      const targetUser = users[targetUserId];
      const targetName = targetUser?.name || 'User';
      soundEffects.playNotification();
      addToast(
        isFollowing ? 'Unfollowed' : 'Following',
        isFollowing ? `You unfollowed ${targetName}.` : `You are now following ${targetName} (@${targetUser?.username || 'user'}).`,
        'success'
      );
    },
    [currentUser, users, addToast]
  );

  const updateUserRoleByAdmin = useCallback(
    async (userId: string, role: User['role']) => {
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, adminId: currentUser.id }),
        });
        const updated: User = await response.json();
        if (!response.ok) throw new Error('Could not update administrator role.');
        setUsers((prev) => ({ ...prev, [userId]: updated }));
        addToast('Role Updated', `${updated.name} is now a ${role}.`, 'success');
      } catch {
        addToast('Admin Action Failed', 'Could not update administrator role.', 'error');
      }
    },
    [currentUser.id, addToast]
  );

  const broadcastSystemAnnouncement = useCallback(
    async (title: string, content: string, priority: 'normal' | 'high' | 'urgent') => {
      try {
        const response = await fetch('/api/admin/announcement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            priority,
            author: currentUser.name,
            adminId: currentUser.id,
          }),
        });
        if (!response.ok) throw new Error('Could not send the announcement.');
        addToast('Broadcast Sent', `"${title}" broadcasted to all connected clients.`, 'success');
      } catch {
        addToast('Error', 'Failed to broadcast announcement', 'error');
      }
    },
    [currentUser.id, currentUser.name, addToast]
  );

  const boundUserAccount = useCallback(
    async (userId: string, boundingDetails: AccountBoundingDetails, isBanned: boolean) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/bound`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boundingDetails, isBanned, adminId: currentUser.id }),
        });
        if (res.ok) {
          const updated: User = await res.json();
          setUsers((prev) => ({ ...prev, [userId]: updated }));
          addToast(
            'Account Bounded',
            `${updated.name} (@${updated.username}) has been restricted.`,
            'warning'
          );
        } else {
          addToast('Error', 'Failed to apply bounding to user account.', 'error');
        }
      } catch {
        addToast('Error', 'Failed to connect to administration service.', 'error');
      }
    },
    [currentUser.id, addToast]
  );

  const unbindUserAccount = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/unbound`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminName: currentUser.name, adminId: currentUser.id }),
        });
        if (res.ok) {
          const updated: User = await res.json();
          setUsers((prev) => ({ ...prev, [userId]: updated }));
          addToast(
            'Bounds Lifted',
            `All account bounds removed for ${updated.name}. Full access restored.`,
            'success'
          );
        } else {
          addToast('Error', 'Failed to lift account bounds.', 'error');
        }
      } catch {
        addToast('Error', 'Failed to connect to administration service.', 'error');
      }
    },
    [currentUser.id, currentUser.name, addToast]
  );

  const resetUserPinByAdmin = useCallback(
    async (userId: string, newPin?: string) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/reset-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPin, adminName: currentUser.name, adminId: currentUser.id }),
        });
        if (res.ok) {
          const updated: User = await res.json();
          setUsers((prev) => ({ ...prev, [userId]: updated }));
          addToast(
            'PIN Updated',
            newPin ? 'New security PIN assigned to user.' : 'User security PIN lock removed.',
            'info'
          );
        }
      } catch {
        addToast('Error', 'Failed to reset user PIN.', 'error');
      }
    },
    [currentUser.id, currentUser.name, addToast]
  );

  const terminateUserSessionsByAdmin = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/terminate-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminName: currentUser.name, adminId: currentUser.id }),
        });
        if (res.ok) {
          const updated: User = await res.json();
          setUsers((prev) => ({ ...prev, [userId]: updated }));
          addToast(
            'Sessions Terminated',
            `Forced logout on all remote sessions for ${updated.name}.`,
            'info'
          );
        }
      } catch {
        addToast('Error', 'Failed to terminate remote sessions.', 'error');
      }
    },
    [currentUser.id, currentUser.name, addToast]
  );

  const deleteUserAccountByAdmin = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminName: currentUser.name, adminId: currentUser.id }),
        });
        if (res.ok) {
          setUsers((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          addToast('User Purged', 'User account permanently deleted from database.', 'warning');
        }
      } catch {
        addToast('Error', 'Failed to delete user account.', 'error');
      }
    },
    [currentUser.id, currentUser.name, addToast]
  );

  const dissolveGroupByAdmin = useCallback(
    async (chatId: string) => {
      try {
        const res = await fetch(`/api/admin/groups/${chatId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminName: currentUser.name, adminId: currentUser.id }),
        });
        if (res.ok) {
          setChats((prev) => prev.filter((c) => c.id !== chatId));
          if (activeChatId === chatId) {
            setActiveChatIdState(null);
          }
          addToast('Group Dissolved', 'The group/channel was forcefully dissolved.', 'warning');
        }
      } catch {
        addToast('Error', 'Failed to dissolve group.', 'error');
      }
    },
    [currentUser.id, currentUser.name, activeChatId, addToast]
  );

  const purgeSpamMessagesByAdmin = useCallback(async (): Promise<number> => {
    try {
      const res = await fetch('/api/admin/purge-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: currentUser.name, adminId: currentUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchBootstrap(activeUserId);
        addToast('Spam Purged', `Successfully cleaned ${data.purgedCount || 0} messages.`, 'success');
        return data.purgedCount || 0;
      }
      return 0;
    } catch {
      addToast('Error', 'Failed to purge spam messages.', 'error');
      return 0;
    }
  }, [currentUser.id, currentUser.name, activeUserId, fetchBootstrap, addToast]);

  const setMaintenanceModeByAdmin = useCallback(
    async (enabled: boolean) => {
      try {
        const res = await fetch('/api/admin/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled, adminName: currentUser.name, adminId: currentUser.id }),
        });
        if (res.ok) {
          setMaintenanceModeState(enabled);
          addToast(
            'Maintenance Mode',
            enabled ? 'Platform maintenance mode activated.' : 'Platform maintenance mode deactivated.',
            enabled ? 'warning' : 'success'
          );
        }
      } catch {
        addToast('Error', 'Failed to update maintenance mode.', 'error');
      }
    },
    [currentUser.id, currentUser.name, addToast]
  );

  const updatePlatformFeaturesByAdmin = useCallback(
    async (updates: Partial<PlatformFeatureSettings>) => {
      try {
        const response = await fetch('/api/admin/platform-features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId: currentUser.id, updates }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not update platform settings.');
        setPlatformFeatures(data.features);
        addToast('Platform Settings Saved', 'Feature availability has been updated.', 'success');
      } catch (error) {
        addToast(
          'Admin Setting Failed',
          error instanceof Error ? error.message : 'Could not update platform settings.',
          'error'
        );
      }
    },
    [currentUser.id, addToast]
  );

  return (
    <ChatTimeContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAuthLoading,
        users,
        chats,
        messages,
        calls,
        statuses,
        statusHistory,
        channels,
        reports,
        activeTab,
        activeChatId,
        activeFolder,
        searchQuery,
        activeCall,
        replyingTo,
        editingMessage,
        isInfoDrawerOpen,
        inspectedUserId,
        toasts,
        theme,
        accentColor,
        appBackground,
        wallpaper,
        wallpaperOpacity,
        auditLogs,
        maintenanceMode,
        platformFeatures,
        isAppLocked,
        wsConnected,
        localMediaStream,
        remoteMediaStream,
        notificationPermission,
        pushNotificationsEnabled,
        setActiveTab,
        setActiveChatId,
        setActiveFolder,
        setSearchQuery,
        setReplyingTo,
        setEditingMessage,
        setIsInfoDrawerOpen,
        setInspectedUserId,
        setTheme,
        setAccentColor,
        setAppBackground,
        setWallpaper,
        setWallpaperOpacity,
        setIsAppLocked,
        requestBrowserNotifications,
        disableBrowserNotifications,
        switchUserAccount,
        logoutUser,
        sendPhoneOtp,
        verifyPhoneOtp,
        registerNewAccount,
        loginAccount,
        sendMessage,
        editMessage,
        deleteMessage,
        forwardMessage,
        toggleReaction,
        togglePinMessage,
        votePoll,
        markViewOnceOpened,
        markMessageRead,
        markChatRead,
        sendTypingSignal,
        sendRecordingSignal,
        startDirectChat,
        createGroupChat,
        togglePinChat,
        toggleMuteChat,
        clearChatHistory,
        deleteChat,
        leaveOrDeleteChat,
        updateGroupPermissions,
        updateMemberRole,
        addGroupMembers,
        removeGroupMember,
        startCall,
        receiveIncomingCall,
        acceptIncomingCall,
        endActiveCall,
        toggleCallMute,
        toggleCallVideo,
        toggleCallSpeaker,
        toggleMuteRingtone,
        flipCallCamera,
        toggleCallScreenShare,
        toggleCallMinimize,
        clearCallHistory,
        postStatusStory,
        deleteStatusStory,
        archiveStatusStory,
        clearStatusHistory,
        markStoryViewed,
        reactToStatusStory,
        updateStatusPrivacy,
        createCommunity,
        toggleSubscribeChannel,
        openCommunityChat,
        manageCommunityMember,
        postCommunityAnnouncement,
        createChannelPost,
        reactChannelPost,
        commentChannelPost,
        updateCurrentUser,
        updateNotificationSettings,
        addNewContactByNumber,
        searchUsers,
        toggleContact,
        ghostUser,
        unghostUser,
        toggleGhostUser,
        isUserGhosted,
        addToast,
        removeToast,
        submitReport,
        resolveReport,
        toggleBanUser,
        toggleVerifyUser,
        setVerificationBadgeByAdmin,
        toggleFollowUser,
        updateUserRoleByAdmin,
        broadcastSystemAnnouncement,
        boundUserAccount,
        unbindUserAccount,
        resetUserPinByAdmin,
        terminateUserSessionsByAdmin,
        deleteUserAccountByAdmin,
        deleteMyAccount,
        dissolveGroupByAdmin,
        purgeSpamMessagesByAdmin,
        setMaintenanceModeByAdmin,
        updatePlatformFeaturesByAdmin,
        language,
        setLanguage,
        t,
        translateText,
        translateAppToLanguage,
        messageTranslations,
        toggleMessageTranslation,
        isTranslatingApp,
        triggerTestCallNotification,
      }}
    >
      {children}
    </ChatTimeContext.Provider>
  );
};

export const useChatTime = () => {
  const context = useContext(ChatTimeContext);
  if (!context) {
    throw new Error('useChatTime must be used within a ChatTimeProvider');
  }
  return context;
};
