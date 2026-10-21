export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support' | 'analyst';
export type UserRole = 'user' | AdminRole;

export type AdminPermission =
  | 'manage_users'
  | 'manage_roles'
  | 'manage_verifications'
  | 'suspend_users'
  | 'ban_users'
  | 'moderate_content'
  | 'resolve_reports'
  | 'manage_calls'
  | 'manage_features'
  | 'view_analytics'
  | 'view_audit_logs'
  | 'manage_admins'
  | 'system_settings'
  | 'manage_announcements';

export type ThemeMode = 'dark' | 'midnight' | 'light';
export type AccentColor = 'teal' | 'indigo' | 'sky' | 'emerald' | 'violet' | 'rose' | 'amber' | 'orange';
export type RingtoneStyle = 'harmonic' | 'pulse' | 'marimba' | 'executive' | 'classic';

export type AppBackgroundStyle =
  | 'whatsapp'  // Clear iconic WhatsApp background with subtle doodle texture
  | 'glow'      // Dynamic ambient luminous aura reflecting accent color
  | 'sunset'    // Radiant fiery sunset horizon
  | 'aurora'    // Ethereal northern lights flowing atmosphere
  | 'cyber'     // Isometric futuristic cyber matrix grid
  | 'cosmic'    // Starry interstellar deep space nebula
  | 'mesh'      // Modern fluid silky color mesh
  | 'minimal';  // Clean flat studio slate / pure midnight

export type WallpaperPattern = 'none' | 'doodle' | 'geometric' | 'stars' | 'circuit';

export interface AccountBoundingDetails {
  isBounded: boolean;
  scope: 'full_block' | 'restricted' | 'frozen';
  restrictions: ('messages' | 'calls' | 'groups' | 'profile')[];
  reason: string;
  duration: '1h' | '24h' | '3d' | '7d' | '30d' | 'permanent';
  boundedAt: number;
  expiresAt?: number;
  boundedBy: string; // admin name / id
  internalNotes?: string;
  caseId: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: number;
  adminId: string;
  adminName: string;
  action: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failed' | 'rejected';
}

export interface PlatformFeatureSettings {
  allowRegistration: boolean;
  allowMessaging: boolean;
  allowCalls: boolean;
  allowVideoCalls: boolean;
  allowGroupCalls: boolean;
  allowGroups: boolean;
  allowCommunities: boolean;
  allowVoiceNotes: boolean;
  allowVoiceChanger: boolean;
  allowFileSharing: boolean;
  allowMediaSharing: boolean;
  allowReactions: boolean;
  allowStories: boolean;
  allowNotifications: boolean;
  voiceEffectsEnabled: boolean;
  voiceModifiers: string[];
  maintenanceMode?: boolean;
  maintenanceNotice?: string;
}

export interface NotificationSettings {
  messagePreviews: boolean;
  soundEffects: boolean;
  callRingtone: boolean;
  ringtoneStyle: RingtoneStyle;
  ringtoneVolume: number; // 0 to 100
  communityAlerts: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  chatTimeNumber: string; // e.g. +1 415-882-9014
  phoneNumber?: string;   // Verified personal/account phone number
  phoneVerified?: boolean;
  countryCode?: string;    // e.g. +1
  countryName?: string;    // e.g. United States
  avatar: string;
  bio: string;
  statusFeeling: string;
  phonePrivate: boolean;
  isOnline: boolean;
  lastSeen: number;       // timestamp
  createdAt?: number;
  isBanned?: boolean;
  isBounded?: boolean;
  boundingDetails?: AccountBoundingDetails;
  role: UserRole;
  isVerified?: boolean;
  isRedVerified?: boolean;
  verificationBadge?: 'blue' | 'red' | 'none';
  verificationBadgeType?: 'blue' | 'red' | 'none';
  following?: string[];
  followers?: string[];
  email?: string;
  isBusiness?: boolean;
  businessCategory?: string;
  businessHours?: string;
  location?: string;
  website?: string;
  contacts?: string[];    // user IDs in contacts list
  blockedUsers?: string[]; // ghosted / blocked user IDs
  ghostedUsers?: string[]; // alias for ghosted users
  privacySettings: {
    lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
    numberVisibility: 'everyone' | 'contacts' | 'nobody';
    statusVisibility?: 'everyone' | 'contacts' | 'selected';
    selectedStatusViewers?: string[];
    readReceipts: boolean;
    discoverable: boolean;
    whoCanCallMe: 'everyone' | 'contacts';
    countryVisibility?: 'everyone' | 'contacts' | 'nobody';
    joinDateVisibility?: 'everyone' | 'contacts' | 'nobody';
  };
  securitySettings: {
    twoFactorEnabled: boolean;
    pinEnabled: boolean;
    pinCode?: string;
    biometricSupported: boolean;
    activeSessions: {
      id: string;
      device: string;
      location: string;
      lastActive: string;
      isCurrent: boolean;
    }[];
  };
  notificationSettings?: NotificationSettings;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'voice'
  | 'file'
  | 'location'
  | 'contact'
  | 'poll'
  | 'call_log';

export interface LocationData {
  latitude: number;
  longitude: number;
  label: string;
  liveUntil?: number;
}

export interface ContactData {
  name: string;
  chatTimeNumber: string;
  avatar: string;
  username: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  closed?: boolean;
  multiple?: boolean;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  audioDuration?: number;
  voiceModifier?: string;
  locationData?: LocationData;
  contactData?: ContactData;
  pollData?: PollData;
  replyToId?: string;
  replyToPreview?: {
    senderName: string;
    text: string;
  };
  isEdited?: boolean;
  isPinned?: boolean;
  isViewOnce?: boolean;
  viewedBy?: string[];
  viewedAt?: number;
  reactions: Record<string, string[]>;
  status: MessageStatus;
  readAt?: number;
  timestamp: number;
  deletedFor?: string[];
}

export type ChatType = 'direct' | 'group' | 'channel';
export type ChatFolder = 'all' | 'direct' | 'groups' | 'channels' | 'unread';

export interface GroupPermissions {
  canSendMessages: boolean;
  canAddMembers: boolean;
  canPinMessages: boolean;
  canChangeInfo: boolean;
}

export interface ChatParticipant {
  userId: string;
  role: 'creator' | 'admin' | 'member';
  joinedAt: number;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  avatar: string;
  description?: string;
  participants: string[];
  participantRoles?: Record<string, 'creator' | 'admin' | 'member'>;
  admins?: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  folder: ChatFolder;
  pinnedMessageId?: string;
  inviteLink?: string;
  permissions?: GroupPermissions;
  typingUsers?: string[];
  recordingUsers?: string[];
  subscriberCount?: number;
  isPublic?: boolean;
  isVerified?: boolean;
  category?: string;
  communityId?: string;
  createdAt?: number;
}

export type CallType = 'voice' | 'video';
export type CallStatus = 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected' | 'busy';

export interface CallRecord {
  id: string;
  type: CallType;
  isGroup: boolean;
  chatId: string;
  chatName: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  callerNumber: string;
  receiverId?: string;
  receiverName?: string;
  receiverAvatar?: string;
  direction: 'incoming' | 'outgoing' | 'missed';
  status: CallStatus;
  startedAt: number;
  duration: number;
}

export interface ActiveCallState {
  id: string;
  type: CallType;
  isGroup: boolean;
  chatId: string;
  chatName: string;
  peerId?: string;
  participants: {
    id: string;
    name: string;
    avatar: string;
    isMuted: boolean;
    isVideoOff: boolean;
    stream?: MediaStream | null;
  }[];
  status: 'incoming' | 'calling' | 'connecting' | 'connected';
  caller: {
    id: string;
    name: string;
    avatar: string;
    number: string;
  };
  startedAt: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isRingtoneMuted?: boolean;
  isFacingUser: boolean;
  isMinimized: boolean;
}

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userNumber?: string;
  type: 'text' | 'image' | 'video' | 'voice';
  content: string;
  mediaUrl?: string;
  background?: string;
  timestamp: number;
  expiresAt: number;
  archivedAt?: number;
  isExpired?: boolean;
  viewers: {
    userId: string;
    userName: string;
    avatar: string;
    viewedAt: number;
  }[];
  audience?: 'everyone' | 'contacts' | 'selected';
  privacy?: 'everyone' | 'contacts' | 'selected';
  allowedViewers?: string[];
  reactions?: Record<string, string[]>;
}

export interface CommunityAnnouncement {
  id: string;
  communityId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  priority: 'normal' | 'important' | 'urgent';
  timestamp: number;
}

export interface ChannelItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bannerUrl?: string;
  description: string;
  category: string;
  creatorId?: string;
  subscriberCount: number;
  isSubscribed: boolean;
  isVerified: boolean;
  isPrivate?: boolean;
  chatId?: string;
  members?: string[];
  memberRoles?: Record<string, 'owner' | 'admin' | 'moderator' | 'member'>;
  announcements?: CommunityAnnouncement[];
  posts: ChannelPost[];
}

export interface ChannelComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: number;
}

export interface ChannelPost {
  id: string;
  channelId: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  title?: string;
  content: string;
  mediaUrl?: string;
  timestamp: number;
  views: number;
  reactions: Record<string, number>;
  userReaction?: string;
  commentsCount: number;
  comments?: ChannelComment[];
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'group' | 'channel' | 'message';
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  timestamp: number;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  createdAt: number;
  author: string;
}

export interface CountryInfo {
  name: string;
  code: string;
  iso: string;
  flag: string;
  placeholder: string;
}
