import React from 'react';
import {
  Pin,
  VolumeX,
  Check,
  CheckCheck,
  Plus,
  Search,
  MessageSquarePlus,
  Megaphone,
  WifiOff,
  Users,
  UserPlus,
  Mic,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { ChatFolder, Chat } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';
import { maskPhoneNumber } from '../../utils/numberGenerator';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { MessageStatusTicks } from './MessageStatusTicks';

interface ChatListProps {
  onOpenNewGroupModal: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onOpenNewGroupModal }) => {
  const {
    chats,
    users,
    currentUser,
    activeChatId,
    setActiveChatId,
    activeFolder,
    setActiveFolder,
    searchQuery,
    setSearchQuery,
    setActiveTab,
    setInspectedUserId,
    statuses,
    wsConnected,
    t,
  } = useChatTime();

  const folders: { id: ChatFolder; label: string }[] = [
    { id: 'all', label: t('all', 'All') },
    { id: 'direct', label: t('direct', 'Direct') },
    { id: 'groups', label: t('groups', 'Groups') },
    { id: 'unread', label: t('unread', 'Unread') },
  ];

  const getDirectPeer = (chat: Chat) => {
    if (chat.type !== 'direct') return undefined;
    const otherId = chat.participants.find((id) => id !== currentUser.id) || chat.participants[0];
    return users[otherId];
  };

  const getChatDisplayName = (chat: Chat) => {
    const peer = getDirectPeer(chat);
    return peer ? peer.name : chat.name;
  };

  const getChatDisplayAvatar = (chat: Chat) => {
    const peer = getDirectPeer(chat);
    return peer ? peer.avatar : chat.avatar;
  };

  const filteredChats = chats
    .filter((chat) => {
      if (chat.type === 'direct' && !chat.participants.includes(currentUser.id)) {
        return false;
      }
      if (
        chat.type === 'group' &&
        !chat.participants.includes(currentUser.id) &&
        !chat.isPublic
      ) {
        return false;
      }
      if (activeFolder === 'direct' && chat.type !== 'direct') return false;
      if (activeFolder === 'groups' && chat.type !== 'group') return false;
      if (activeFolder === 'channels' && chat.type !== 'channel' && !chat.communityId) return false;
      if (activeFolder === 'unread' && chat.unreadCount === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const displayName = getChatDisplayName(chat).toLowerCase();
        const lastMsgMatch = chat.lastMessage?.content.toLowerCase().includes(q);
        const peer = getDirectPeer(chat);
        const peerMatch =
          peer &&
          ((peer.phoneNumber || peer.chatTimeNumber).toLowerCase().includes(q) ||
            peer.username.toLowerCase().includes(q));
        return displayName.includes(q) || lastMsgMatch || peerMatch;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });

  return (
    <div className="w-full md:w-80 lg:w-96 min-h-0 bg-slate-900 border-r border-slate-800/80 flex flex-col h-full shrink-0">
      {/* WhatsApp-Style Subtle Connecting Banner when offline / waiting for network */}
      {!wsConnected && (
        <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-2 shrink-0 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>Connecting...</span>
        </div>
      )}

      {/* Header & Action Row */}
      <div className="p-4 border-b border-slate-800/70 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold tracking-tight text-white">{t('chats', 'Messages')}</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('contacts')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              title="Start 1-on-1 Chat"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('direct', '1-on-1')}</span>
            </button>
            <button
              onClick={onOpenNewGroupModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all"
              title={t('newGroup', 'Create Group Chat')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('group', 'Group')}</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search', 'Filter conversations or +number...')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
          />
        </div>

        {/* Folder Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {folders.map((f) => {
            const active = activeFolder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f.id)}
                className={`min-h-10 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-teal-500 text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 px-6 text-center">
            <MessageSquarePlus className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">{t('noChatsFound', 'No conversations yet')}</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {t('startChatPrompt', 'Start a 1-to-1 chat with any registered user in Contacts, or create a group chat.')}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('contacts')}
                className="px-3.5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
              >
                {t('contacts', 'Find People & Contacts')}
              </button>
              <button
                onClick={onOpenNewGroupModal}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 transition-colors"
              >
                {t('newGroup', 'New Group')}
              </button>
            </div>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = activeChatId === chat.id;
            const peerUser = getDirectPeer(chat);
            const displayName = getChatDisplayName(chat);
            const displayAvatar = getChatDisplayAvatar(chat);

            const isOnline = peerUser?.isOnline ?? false;
            const rawPhone = peerUser?.phoneNumber || peerUser?.chatTimeNumber || '';
            const numberVis = peerUser?.privacySettings?.numberVisibility || 'everyone';
            const isContact = peerUser && (currentUser.contacts || []).includes(peerUser.id);
            const canSeePhone =
              peerUser &&
              !peerUser.phonePrivate &&
              (numberVis === 'everyone' || (numberVis === 'contacts' && isContact));
            const peerPhone = peerUser
              ? canSeePhone
                ? rawPhone
                : maskPhoneNumber(rawPhone)
              : null;

            const isTyping = chat.typingUsers && chat.typingUsers.length > 0;
            const lastMsg = chat.lastMessage;
            const isOwnLastMsg = lastMsg?.senderId === currentUser.id;
            const peerHasStatus = Boolean(
              peerUser &&
              statuses.some((s) => s.userId === peerUser.id && s.expiresAt > Date.now())
            );

            return (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-teal-500/12 border-l-4 border-teal-400'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Avatar + Status Ring + Presence Dot */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (chat.type === 'direct' && peerUser?.id) {
                      setInspectedUserId(peerUser.id);
                    } else {
                      setActiveChatId(chat.id);
                    }
                  }}
                  className="relative shrink-0 cursor-pointer active:scale-95 transition-transform"
                  title={`View ${displayName} profile`}
                >
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className={`w-12 h-12 rounded-2xl object-cover bg-slate-800 transition-all ${
                      peerHasStatus
                        ? 'p-0.5 ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 border-transparent'
                        : 'border border-slate-700/60'
                    }`}
                  />
                  {chat.type === 'direct' && isOnline && (
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" />
                  )}
                  {chat.type === 'group' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-500/90 border-2 border-slate-900 absolute -bottom-1 -right-1 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                  {(chat.id === 'chat_chattime_announcements' || chat.type === 'announcement' || chat.type === 'channel') && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-1 -right-1 flex items-center justify-center shadow">
                      <Megaphone className="w-2.5 h-2.5 text-slate-950" />
                    </span>
                  )}
                </div>

                {/* Middle Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {displayName}
                      </span>
                      {peerUser && <VerifiedBadge user={peerUser} size="xs" />}
                      {!peerUser && (chat.isVerified || chat.id === 'chat_chattime_support' || chat.id === 'chat_chattime_announcements') && (
                        <VerifiedBadge type="red" size="xs" />
                      )}
                      {chat.isMuted && (
                        <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </div>
                    {lastMsg && (
                      <span
                        className={`text-[11px] shrink-0 ${
                          chat.unreadCount > 0
                            ? 'text-teal-400 font-semibold'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatRelativeTime(lastMsg.timestamp)}
                      </span>
                    )}
                  </div>

                  {/* Secondary Phone / Group Metadata */}
                  {peerPhone && (
                    <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      @{peerUser?.username} • {peerPhone}
                    </div>
                  )}

                  {/* Message Preview or Typing Indicator */}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      {chat.recordingUsers && chat.recordingUsers.length > 0 ? (
                        <span className="text-xs text-rose-400 font-medium animate-pulse truncate flex items-center gap-1">
                          <Mic className="w-3 h-3 text-rose-400 animate-bounce shrink-0" />
                          <span>{chat.recordingUsers.join(', ')} recording audio...</span>
                        </span>
                      ) : isTyping ? (
                        <span className="text-xs text-teal-400 font-medium animate-pulse truncate">
                          {chat.typingUsers?.join(', ')} typing...
                        </span>
                      ) : lastMsg ? (
                        <>
                          {isOwnLastMsg && (
                            <MessageStatusTicks
                              status={lastMsg.status}
                              isLightBubble={false}
                              hideReadReceipts={
                                chat.type === 'direct' &&
                                (currentUser.privacySettings?.readReceipts === false ||
                                  getDirectPeer(chat)?.privacySettings?.readReceipts === false)
                              }
                              className="shrink-0"
                            />
                          )}
                          <span
                            className={`text-xs truncate ${
                              chat.unreadCount > 0
                                ? 'text-slate-100 font-medium'
                                : 'text-slate-400'
                            }`}
                          >
                            {(() => {
                              const previewText = lastMsg.isViewOnce
                                ? lastMsg.content === 'Opened'
                                  ? '🔒 Opened'
                                  : '🔒 View Once Media'
                                : lastMsg.content;
                              return chat.type === 'group' && !isOwnLastMsg
                                ? `${lastMsg.senderName.split(' ')[0]}: ${previewText}`
                                : previewText;
                            })()}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          No messages yet — say hello!
                        </span>
                      )}
                    </div>

                    {/* Right Badges: Unread Count & Pin */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {chat.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-slate-400 rotate-45" />
                      )}
                      {chat.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-teal-500 text-slate-950 text-[11px] font-bold flex items-center justify-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
