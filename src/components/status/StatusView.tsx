import React, { useState, useEffect } from 'react';
import {
  Plus,
  Eye,
  Send,
  X,
  Camera,
  Video,
  Type,
  Mic,
  Shield,
  Clock,
  Trash2,
  Upload,
  Archive,
  History,
  Check,
  Sparkles,
  Lock,
  Users,
  Globe,
  Settings,
  Volume2,
  VolumeX,
  UserPlus,
  Ghost,
  Palette,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { StatusStory, User } from '../../types';
import { formatTime } from '../../utils/formatters';

const STORY_GRADIENTS = [
  'linear-gradient(135deg, #0d9488, #0f172a)', // Teal Slate
  'linear-gradient(135deg, #059669, #022c22)', // WhatsApp Emerald
  'linear-gradient(135deg, #4f46e5, #1e1b4b)', // Indigo Deep
  'linear-gradient(135deg, #7c3aed, #2e1065)', // Royal Purple
  'linear-gradient(135deg, #e11d48, #4c0519)', // Crimson Rose
  'linear-gradient(135deg, #d97706, #451a03)', // Warm Amber
  'linear-gradient(135deg, #0284c7, #082f49)', // Electric Sky
  'linear-gradient(135deg, #db2777, #500724)', // Pink Fuchsia
  'linear-gradient(135deg, #334155, #090d16)', // Obsidian Dark
];

export const StatusView: React.FC = () => {
  const {
    statuses,
    statusHistory,
    currentUser,
    users,
    postStatusStory,
    deleteStatusStory,
    archiveStatusStory,
    clearStatusHistory,
    markStoryViewed,
    reactToStatusStory,
    updateStatusPrivacy,
    sendMessage,
    startDirectChat,
    setInspectedUserId,
    setActiveTab,
    addToast,
    t,
  } = useChatTime();

  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [viewerStories, setViewerStories] = useState<StatusStory[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isStoryMuted, setIsStoryMuted] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isManageUpdatesOpen, setIsManageUpdatesOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Create Story Form state
  const [createType, setCreateType] = useState<'text' | 'image' | 'video' | 'voice'>('text');
  const [textContent, setTextContent] = useState('');
  const [mediaDataUrl, setMediaDataUrl] = useState<string | undefined>(undefined);
  const [selectedBg, setSelectedBg] = useState(STORY_GRADIENTS[0]);
  const [audience, setAudience] = useState<'everyone' | 'contacts' | 'selected'>(
    currentUser.privacySettings?.statusVisibility || 'contacts'
  );
  const [selectedViewers, setSelectedViewers] = useState<string[]>(
    currentUser.privacySettings?.selectedStatusViewers || []
  );

  const handleCycleBackground = () => {
    const currentIdx = STORY_GRADIENTS.indexOf(selectedBg);
    const nextIdx = (currentIdx + 1) % STORY_GRADIENTS.length;
    setSelectedBg(STORY_GRADIENTS[nextIdx]);
    addToast('Color Changed', 'Status background color updated.', 'info');
  };

  // Helper: check if a user is ghosted / blocked
  const isGhosted = (uid: string) => {
    const myBlocked = currentUser.blockedUsers || currentUser.ghostedUsers || [];
    return myBlocked.includes(uid);
  };

  // Helper: strictly check if a contact is added to my contacts list (or their number is saved)
  const isContactAdded = (uid: string, sUserNumber?: string) => {
    if ((currentUser.contacts || []).includes(uid)) return true;
    if (sUserNumber) {
      const cleanNum = sUserNumber.replace(/[^0-9]/g, '');
      if (cleanNum) {
        return (currentUser.contacts || []).some((cId) => {
          const cUser = users[cId];
          const cNum = (cUser?.phoneNumber || cUser?.chatTimeNumber || '').replace(/[^0-9]/g, '');
          return cNum && cNum === cleanNum;
        });
      }
    }
    return false;
  };

  // Filter visible active stories:
  // Strict requirement: ONLY show status from contacts whose number/ID is saved in my contacts list!
  // If haven't added a contact, don't let their status show unless I have their number already!
  // And never show status if user is ghosted/blocked!
  const visibleStatuses = statuses.filter((s) => {
    if (s.userId === currentUser.id) return true;
    if (isGhosted(s.userId)) return false;

    const author = users[s.userId];
    const authorNumber = s.userNumber || author?.phoneNumber || author?.chatTimeNumber;
    if (!isContactAdded(s.userId, authorNumber)) {
      return false;
    }

    const vis = s.privacy || author?.privacySettings?.statusVisibility || 'contacts';
    if (vis === 'selected') {
      const allowed = s.allowedViewers || author?.privacySettings?.selectedStatusViewers || [];
      return allowed.includes(currentUser.id);
    }
    return true;
  });

  const myStories = visibleStatuses.filter((s) => s.userId === currentUser.id);
  const contactStories = visibleStatuses.filter((s) => s.userId !== currentUser.id);
  const myHistory = statusHistory.filter((s) => s.userId === currentUser.id);

  const openViewerWithList = (list: StatusStory[], index: number) => {
    setViewerStories(list);
    setActiveStoryIndex(index);
    setStoryProgress(0);
  };

  // Story progress timer
  useEffect(() => {
    if (activeStoryIndex === null || viewerStories.length === 0) {
      setStoryProgress(0);
      return;
    }

    const currentStory = viewerStories[activeStoryIndex];
    if (!currentStory) {
      setActiveStoryIndex(null);
      return;
    }

    if (!currentStory.isExpired) {
      markStoryViewed(currentStory.id);
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < viewerStories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, isPaused, viewerStories, markStoryViewed]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, preferredType?: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/') || preferredType === 'video';
    setCreateType(isVideo ? 'video' : 'image');
    const reader = new FileReader();
    reader.onload = () => {
      setMediaDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePostStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() && !mediaDataUrl) return;
    const caption =
      textContent.trim() ||
      (createType === 'video'
        ? 'Shared a video status update'
        : createType === 'image'
        ? 'Shared a photo story'
        : 'Voice status update');

    postStatusStory({
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      type: createType,
      content: caption,
      mediaUrl: mediaDataUrl,
      background: selectedBg,
      privacy: audience,
      allowedViewers: audience === 'selected' ? selectedViewers : undefined,
    });

    setIsCreateModalOpen(false);
    setTextContent('');
    setMediaDataUrl(undefined);
  };

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatusPrivacy(audience, selectedViewers);
    setIsPrivacyModalOpen(false);
  };

  const handleDeleteAllMyUpdates = async () => {
    if (myStories.length === 0) return;
    try {
      await fetch(`/api/stories/user/${currentUser.id}`, { method: 'DELETE' });
    } catch {
      // Ignore network errors
    }
    myStories.forEach((s) => deleteStatusStory(s.id));
    setIsManageUpdatesOpen(false);
    if (activeStoryIndex !== null) setActiveStoryIndex(null);
    addToast('Updates Deleted', 'All your active status updates were deleted.', 'success');
  };

  const handleReplyToStory = (story: StatusStory) => {
    if (!replyText.trim()) return;
    const chatId = startDirectChat(story.userId);
    if (chatId) {
      sendMessage(chatId, `Replied to your status: "${replyText.trim()}"`, 'text');
    }
    setReplyText('');
    setActiveStoryIndex(null);
  };

  const toggleViewerSelection = (uid: string) => {
    setSelectedViewers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const rawActiveStory =
    activeStoryIndex !== null ? viewerStories[activeStoryIndex] : null;
  const currentActiveStory = rawActiveStory
    ? statuses.find((s) => s.id === rawActiveStory.id) ||
      statusHistory.find((s) => s.id === rawActiveStory.id) ||
      rawActiveStory
    : null;

  const activeAuthor = currentActiveStory ? users[currentActiveStory.userId] : null;
  const isActiveSaved = currentActiveStory ? (currentUser.contacts || []).includes(currentActiveStory.userId) : false;
  const activeAuthorNum = currentActiveStory
    ? currentActiveStory.userNumber || activeAuthor?.phoneNumber || activeAuthor?.chatTimeNumber
    : '';
  const activeStoryDisplayName = currentActiveStory
    ? currentActiveStory.userId === currentUser.id
      ? 'My Status'
      : isActiveSaved
      ? (activeAuthor?.name || currentActiveStory.userName)
      : (activeAuthorNum || currentActiveStory.userName)
    : '';

  const otherUsers = (Object.values(users) as User[]).filter((u) => u.id !== currentUser.id);
  const myAddedContacts = (currentUser.contacts || [])
    .map((cId) => users[cId])
    .filter((u): u is User => Boolean(u && u.id && !isGhosted(u.id)));

  // Group contact stories by user so each user has a story ring (displaying saved contact name or available phone number)
  const groupedUserStories = React.useMemo(() => {
    const map = new Map<string, StatusStory[]>();
    contactStories.forEach((st) => {
      const list = map.get(st.userId) || [];
      list.push(st);
      map.set(st.userId, list);
    });
    return Array.from(map.entries()).map(([userId, userStories]) => {
      const uAuthor = users[userId];
      const isSaved = (currentUser.contacts || []).includes(userId);
      const uNum = userStories[0].userNumber || uAuthor?.phoneNumber || uAuthor?.chatTimeNumber;
      const uName = isSaved ? (uAuthor?.name || userStories[0].userName) : (uNum || userStories[0].userName);
      return {
        userId,
        userName: uName,
        userAvatar: userStories[0].userAvatar,
        stories: userStories,
        latestStory: userStories[0],
        allViewed: userStories.every((s) => s.viewers.some((v) => v.userId === currentUser.id)),
      };
    });
  }, [contactStories, currentUser.id, currentUser.contacts, users]);

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-display">{t('status', 'Status & Stories')}</h2>
          <p className="text-xs text-slate-400">
            {t('statusDisappear', '24-hour encrypted stories · Expired updates automatically move to Status History')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active vs History Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'active'
                  ? 'bg-teal-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('live', 'Live')} ({visibleStatuses.length})</span>
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'history'
                  ? 'bg-teal-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{t('history', 'History')} ({myHistory.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsPrivacyModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            title={t('privacy', 'Status Privacy Settings')}
          >
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">{t('privacy', 'Privacy')}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 transition-all shadow-md shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newStatus', 'New Status')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
        {viewMode === 'active' ? (
          <>
            {/* Horizontal Story Rings Bar (Instagram / WhatsApp style quick strip) */}
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1 px-1">
              {/* My Story Ring */}
              <button
                onClick={() =>
                  myStories.length > 0
                    ? openViewerWithList(myStories, 0)
                    : setIsCreateModalOpen(true)
                }
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div
                  className={`relative p-0.5 rounded-2xl ${
                    myStories.length > 0
                      ? 'bg-gradient-to-tr from-teal-400 via-emerald-400 to-indigo-500 shadow-lg shadow-teal-500/20'
                      : 'border-2 border-dashed border-slate-700'
                  }`}
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-14 h-14 rounded-[14px] object-cover bg-slate-950"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow">
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[72px]">
                  My Status
                </span>
              </button>

              {/* Other Users' Story Rings */}
              {groupedUserStories.map((group) => (
                <button
                  key={group.userId}
                  onClick={() => openViewerWithList(group.stories, 0)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div
                    className={`relative p-0.5 rounded-2xl transition-transform group-hover:scale-105 ${
                      group.allViewed
                        ? 'border-2 border-slate-700'
                        : 'bg-gradient-to-tr from-teal-400 via-amber-400 to-rose-500 shadow-lg shadow-teal-500/20'
                    }`}
                  >
                    <img
                      src={group.userAvatar}
                      alt={group.userName}
                      className="w-14 h-14 rounded-[14px] object-cover bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                    {group.stories.length > 1 && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-teal-500 text-slate-950 text-[9px] font-extrabold shadow">
                        {group.stories.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 group-hover:text-teal-300 truncate max-w-[76px]">
                    {group.userName.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* My Status Card */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-400 p-0.5 bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow-lg"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100 font-display">My Status</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 capitalize">
                        Audience: {currentUser.privacySettings?.statusVisibility || 'everyone'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {myStories.length > 0
                        ? `${myStories.length} active status update(s)`
                        : 'Tap + to share a photo, text, or voice story for 24 hours'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {myStories.length > 0 && (
                    <button
                      onClick={() => openViewerWithList(myStories, 0)}
                      className="px-3.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-xs text-teal-300 font-bold transition-colors"
                    >
                      Play My Statuses
                    </button>
                  )}
                  <button
                    onClick={() => setIsManageUpdatesOpen(true)}
                    className="p-2 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-teal-400 border border-slate-700 transition-colors flex items-center gap-1.5"
                    title="Manage & Delete My Updates"
                  >
                    <Settings className="w-4 h-4 text-teal-400 hover:rotate-90 transition-transform duration-300" />
                    <span className="text-xs font-semibold hidden sm:inline">Delete / Manage Updates</span>
                  </button>
                </div>
              </div>

              {/* List of My Active Statuses with Archive / Delete actions */}
              {myStories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-800/80">
                  {myStories.map((st, idx) => {
                    const hoursLeft = Math.max(
                      1,
                      Math.ceil((st.expiresAt - Date.now()) / (1000 * 60 * 60))
                    );
                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div
                          onClick={() => openViewerWithList(myStories, idx)}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                        >
                          <div
                            style={{ background: st.background || STORY_GRADIENTS[0] }}
                            className="w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center border border-slate-700"
                          >
                            {st.mediaUrl ? (
                              <img
                                src={st.mediaUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Type className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">
                              {st.content}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {st.viewers.length} views · expires in {hoursLeft}h
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => archiveStatusStory(st.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-teal-300"
                            title="Move to Status History Now"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteStatusStory(st.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            title="Delete Status"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* WhatsApp End-to-End Encryption Status Notice */}
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
              <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="text-[11px] text-slate-400">
                Your status updates are <strong className="text-slate-200">end-to-end encrypted</strong> and visible only to your contacts.
              </span>
            </div>

            {/* Recent Contact Updates */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recent Updates ({contactStories.length})
              </h3>

              {contactStories.length === 0 ? (
                <div className="p-10 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-teal-400/60 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No active updates from contacts yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When registered users share a 24-hour status update, it will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {contactStories.map((story, idx) => {
                    const hasViewed = story.viewers.some((v) => v.userId === currentUser.id);
                    const author = users[story.userId];
                    const isSaved = (currentUser.contacts || []).includes(story.userId);
                    const authorNum = story.userNumber || author?.phoneNumber || author?.chatTimeNumber;
                    const storyDisplayName = isSaved ? (author?.name || story.userName) : (authorNum || story.userName);

                    return (
                      <div
                        key={story.id}
                        onClick={() => openViewerWithList(contactStories, idx)}
                        className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:border-teal-500/40 hover:bg-slate-800/40 transition-all flex items-center gap-3 relative group"
                      >
                        <div className="relative shrink-0">
                          <div
                            className={`p-0.5 rounded-2xl ${
                              hasViewed
                                ? 'border border-slate-700'
                                : 'bg-gradient-to-tr from-teal-400 to-indigo-500 shadow-md'
                            }`}
                          >
                            <img
                              src={story.userAvatar}
                              alt={storyDisplayName}
                              className="w-12 h-12 rounded-xl object-cover bg-slate-950"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-sm font-semibold text-slate-100 truncate group-hover:text-teal-300 transition-colors">
                              {storyDisplayName}
                            </h4>
                            {!hasViewed && (
                              <span className="px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[9px] font-bold uppercase">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{story.content}</p>
                          <div className="flex items-center justify-between gap-1.5 text-[11px] text-slate-500 font-mono mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-teal-400" />
                              {formatTime(story.timestamp)}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Eye className="w-3 h-3" /> {story.viewers.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved Contacts Live Status Board */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Contacts Live Status ({myAddedContacts.length})
                </h3>
                <span className="text-[11px] text-slate-500">Only contacts saved in your phonebook</span>
              </div>

              {myAddedContacts.length === 0 ? (
                <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-semibold text-slate-300">
                    No contact status updates yet
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Status updates only appear from people you have added as a contact. Add a contact by their ChatTime number to see their stories and status!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('contacts')}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add New Contact</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myAddedContacts.map((u) => {
                    const userActiveStories = contactStories.filter((s) => s.userId === u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          if (userActiveStories.length > 0) {
                            openViewerWithList(userActiveStories, 0);
                          } else {
                            setInspectedUserId(u.id);
                          }
                        }}
                        className="p-3.5 bg-slate-900/70 border border-slate-800/90 hover:border-teal-500/40 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className={`w-11 h-11 rounded-xl object-cover bg-slate-950 ${
                                userActiveStories.length > 0 ? 'ring-2 ring-teal-400' : 'border border-slate-800'
                              }`}
                            />
                            <span
                              className={`w-2.5 h-2.5 rounded-full border-2 border-slate-900 absolute -bottom-0.5 -right-0.5 ${
                                u.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-100 truncate">{u.name}</span>
                              {u.statusFeeling && (
                                <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-300 font-medium truncate">
                                  {u.statusFeeling}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {u.bio || `@${u.username}`}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startDirectChat(u.id);
                          }}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-teal-500 hover:text-slate-950 text-teal-400 border border-slate-800 transition-colors shrink-0"
                        title={`Message ${u.name}`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          </>
        ) : (
          /* Status History Archive View */
          <div className="space-y-4">
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">My Status History Archive</h3>
                  <p className="text-xs text-slate-400">
                    Expired statuses automatically move here after 24 hours. Only you can view your Status History.
                  </p>
                </div>
              </div>

              {myHistory.length > 0 && (
                <button
                  onClick={clearStatusHistory}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All History</span>
                </button>
              )}
            </div>

            {myHistory.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                <Archive className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">Your Status History is empty</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Statuses that expire after 24 hours or that you manually archive will be stored here safely.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myHistory.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3"
                  >
                    <div
                      onClick={() => openViewerWithList(myHistory, idx)}
                      className="flex items-start gap-3 cursor-pointer"
                    >
                      <div
                        style={{ background: item.background || STORY_GRADIENTS[0] }}
                        className="w-14 h-14 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center border border-slate-700"
                      >
                        {item.mediaUrl ? (
                          <img
                            src={item.mediaUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Type className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 mb-1">
                          Archived · {formatTime(item.archivedAt || item.timestamp)}
                        </span>
                        <p className="text-xs font-semibold text-slate-100 line-clamp-2">
                          {item.content}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-teal-400 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {item.viewers.length} views
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openViewerWithList(myHistory, idx)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteStatusStory(item.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Delete from History"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp-Style Floating Action Buttons for Status (Type, Video & Camera) */}
      {viewMode === 'active' && (
        <div className="fixed bottom-20 md:bottom-8 right-5 sm:right-8 flex flex-col items-center gap-3 z-30 pointer-events-auto">
          {/* Text status button (Pencil / Typography) */}
          <button
            type="button"
            onClick={() => {
              setCreateType('text');
              setIsCreateModalOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            title="Create Text Status"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Video status button */}
          <button
            type="button"
            onClick={() => {
              setCreateType('video');
              setIsCreateModalOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            title="Post Video Status"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Photo/Camera status button (Camera) */}
          <button
            type="button"
            onClick={() => {
              setCreateType('image');
              setIsCreateModalOpen(true);
            }}
            className="w-13 h-13 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-xl shadow-teal-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title="Create Photo Status"
          >
            <Camera className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Fullscreen Story Viewer Modal */}
      {currentActiveStory && (
        <div
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-sm h-[90vh] max-h-[680px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-slate-800">
            {/* Story Canvas Background */}
            <div
              style={{
                background: currentActiveStory.background || STORY_GRADIENTS[0],
              }}
              className="absolute inset-0 z-0 flex items-center justify-center p-6 text-center"
            >
              {currentActiveStory.mediaUrl ? (
                <>
                  {currentActiveStory.type === 'video' ||
                  currentActiveStory.mediaUrl.startsWith('data:video') ||
                  /\.(mp4|webm|mov|ogg)$/i.test(currentActiveStory.mediaUrl) ? (
                    <video
                      src={currentActiveStory.mediaUrl}
                      autoPlay
                      playsInline
                      muted={isStoryMuted}
                      loop={false}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  ) : (
                    <img
                      src={currentActiveStory.mediaUrl}
                      alt="story"
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  )}
                  {currentActiveStory.content && (
                    <div className="absolute bottom-28 inset-x-4 z-10 bg-black/65 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        {currentActiveStory.content}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-lg sm:text-xl font-bold text-slate-100 font-display leading-relaxed z-10">
                  {currentActiveStory.content}
                </p>
              )}
            </div>

            {/* Top Bar with Segmented Progress */}
            <div className="relative z-20 p-4 space-y-3 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-1.5">
                {viewerStories.map((s, idx) => (
                  <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      style={{
                        width:
                          idx < activeStoryIndex!
                            ? '100%'
                            : idx === activeStoryIndex
                            ? `${storyProgress}%`
                            : '0%',
                      }}
                      className="h-full bg-teal-400 rounded-full"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentActiveStory.userAvatar}
                    alt={activeStoryDisplayName}
                    className="w-8 h-8 rounded-full object-cover border border-white/40"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold leading-none flex items-center gap-1.5">
                      <span>{activeStoryDisplayName}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[9px] font-mono border border-teal-500/30">
                        <Lock className="w-2.5 h-2.5 text-teal-400" />
                        End-to-End Encrypted
                      </span>
                    </div>
                    <div className="text-[10px] text-teal-300 font-mono mt-0.5">
                      {currentActiveStory.isExpired ? 'Archived History · ' : ''}
                      {formatTime(currentActiveStory.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {(currentActiveStory.type === 'video' ||
                    currentActiveStory.mediaUrl?.startsWith('data:video')) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsStoryMuted(!isStoryMuted);
                      }}
                      className="p-1.5 rounded-full bg-slate-800/70 hover:bg-slate-700 text-teal-300"
                      title={isStoryMuted ? 'Unmute Video' : 'Mute Video'}
                    >
                      {isStoryMuted ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-teal-400" />
                      )}
                    </button>
                  )}
                  {currentActiveStory.userId === currentUser.id && !currentActiveStory.isExpired && (
                    <button
                      onClick={() => {
                        const idToArchive = currentActiveStory.id;
                        setActiveStoryIndex(null);
                        archiveStatusStory(idToArchive);
                      }}
                      className="p-1.5 rounded-full bg-slate-800/70 hover:bg-slate-700 text-teal-300"
                      title="Move to History"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  {currentActiveStory.userId === currentUser.id && (
                    <>
                      <button
                        onClick={() => {
                          setIsPaused(true);
                          setIsManageUpdatesOpen(true);
                        }}
                        className="p-1.5 rounded-full bg-slate-800/70 hover:bg-slate-700 text-teal-300"
                        title="Manage & Delete My Updates"
                      >
                        <Settings className="w-4 h-4 text-teal-400" />
                      </button>
                      <button
                        onClick={() => {
                          const idToRemove = currentActiveStory.id;
                          setActiveStoryIndex(null);
                          deleteStatusStory(idToRemove);
                        }}
                        className="p-1.5 rounded-full bg-rose-500/30 hover:bg-rose-500/50 text-rose-200"
                        title="Delete Status"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveStoryIndex(null)}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation click zones */}
            <button
              onClick={() => {
                if (activeStoryIndex! > 0) {
                  setActiveStoryIndex(activeStoryIndex! - 1);
                  setStoryProgress(0);
                }
              }}
              className="absolute left-0 inset-y-16 w-1/4 z-10"
              title="Previous"
            />
            <button
              onClick={() => {
                if (activeStoryIndex! < viewerStories.length - 1) {
                  setActiveStoryIndex(activeStoryIndex! + 1);
                  setStoryProgress(0);
                } else {
                  setActiveStoryIndex(null);
                }
              }}
              className="absolute right-0 inset-y-16 w-1/4 z-10"
              title="Next"
            />

            {/* Bottom: Viewers, Reactions, or Reply Input */}
            <div className="relative z-20 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent space-y-2.5">
              {/* Active Reactions Display Pill */}
              {currentActiveStory.reactions &&
                Object.keys(currentActiveStory.reactions).length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {Object.entries(currentActiveStory.reactions).map(([emoji, uids]) => (
                      <span
                        key={emoji}
                        className="px-2.5 py-0.5 rounded-full bg-black/70 border border-white/20 text-xs text-white flex items-center gap-1"
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px] font-bold text-teal-300">{uids.length}</span>
                      </span>
                    ))}
                  </div>
                )}

              {currentActiveStory.userId === currentUser.id ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center justify-center gap-2 text-xs text-teal-300 font-medium">
                    <Eye className="w-4 h-4" />
                    <span>{currentActiveStory.viewers.length} Views</span>
                  </div>
                  {currentActiveStory.viewers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <span>Viewed by:</span>
                      <span className="font-semibold">
                        {currentActiveStory.viewers.map((v) => v.userName).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Quick Reaction Emojis */}
                  <div className="flex items-center justify-center gap-2">
                    {['❤️', '🔥', '😂', '😮', '👏', '🎉'].map((emoji) => {
                      const hasReacted = (
                        currentActiveStory.reactions?.[emoji] || []
                      ).includes(currentUser.id);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            reactToStatusStory(currentActiveStory.id, emoji);
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-transform active:scale-125 border ${
                            hasReacted
                              ? 'bg-teal-500/30 border-teal-400 scale-110'
                              : 'bg-black/60 border-white/15 hover:bg-black/80'
                          }`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>

                  {/* Direct Story Reply Input */}
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-2xl p-1.5 border border-white/20"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onFocus={() => setIsPaused(true)}
                      onBlur={() => setIsPaused(false)}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleReplyToStory(currentActiveStory);
                      }}
                      placeholder={`Reply to ${activeStoryDisplayName}...`}
                      className="flex-1 min-w-0 bg-transparent px-3 py-1.5 text-xs text-white placeholder-white/60 focus:outline-none"
                    />
                    <button
                      onClick={() => handleReplyToStory(currentActiveStory)}
                      className="p-2 rounded-xl bg-teal-500 text-slate-950 font-bold shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Privacy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSavePrivacy}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-100 font-display">
                  Status Privacy Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Control who can view your 24-hour status updates on ChatTime.
            </p>

            <div className="space-y-2">
              {[
                {
                  id: 'everyone',
                  label: 'Everyone on ChatTime',
                  desc: 'All registered ChatTime users can view your status updates',
                  icon: Globe,
                },
                {
                  id: 'contacts',
                  label: 'My Contacts Only',
                  desc: 'Only users saved in your contacts can view your status',
                  icon: Users,
                },
                {
                  id: 'selected',
                  label: 'Selected People Only',
                  desc: 'Choose specific people who are allowed to view your status',
                  icon: Lock,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = audience === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setAudience(opt.id as any)}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-100">{opt.label}</div>
                        <div className="text-[11px] text-slate-400">{opt.desc}</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-teal-400 bg-teal-500 text-slate-950' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {audience === 'selected' && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300">
                  Select Allowed Viewers ({selectedViewers.length})
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                  {otherUsers.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-3">
                      No other users registered yet.
                    </p>
                  ) : (
                    otherUsers.map((u) => {
                      const checked = selectedViewers.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleViewerSelection(u.id)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <div className="text-xs font-semibold text-slate-200">{u.name}</div>
                              <div className="text-[10px] text-slate-500">@{u.username}</div>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              checked
                                ? 'bg-teal-500 border-teal-500 text-slate-950'
                                : 'border-slate-700'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-teal-400"
              >
                Save Privacy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create New Status Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handlePostStory}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 font-display">
                Create 24-Hour Status
              </h3>
              <div className="flex items-center gap-2">
                {createType === 'text' && (
                  <button
                    type="button"
                    onClick={handleCycleBackground}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 shadow cursor-pointer"
                    title="Press to cycle background colors"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Change Color</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-100 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl">
              {[
                { id: 'text', label: 'Text', icon: Type },
                { id: 'image', label: 'Photo', icon: Camera },
                { id: 'video', label: 'Video', icon: Video },
                { id: 'voice', label: 'Voice', icon: Mic },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => {
                      setCreateType(t.id as any);
                      if (t.id === 'text' || t.id === 'voice') {
                        setMediaDataUrl(undefined);
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                      createType === t.id
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {(createType === 'image' || createType === 'video') && (
              <div className="space-y-2">
                {mediaDataUrl ? (
                  <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                    {createType === 'video' || mediaDataUrl.startsWith('data:video') ? (
                      <video
                        src={mediaDataUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={mediaDataUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaDataUrl(undefined)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white z-10 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-800 hover:border-teal-500/50 rounded-2xl bg-slate-950 cursor-pointer transition-colors p-4 text-center">
                    {createType === 'video' ? (
                      <Video className="w-6 h-6 text-teal-400 mb-1" />
                    ) : (
                      <Upload className="w-6 h-6 text-teal-400 mb-1" />
                    )}
                    <span className="text-xs text-slate-200 font-semibold">
                      {createType === 'video' ? 'Upload Video for Story' : 'Upload Photo for Story'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {createType === 'video' ? 'MP4, WebM, or MOV' : 'JPG, PNG, WebP or GIF'}
                    </span>
                    <input
                      type="file"
                      accept={createType === 'video' ? 'video/*' : 'image/*'}
                      onChange={(e) => handleMediaSelect(e, createType === 'video' ? 'video' : 'image')}
                      className="hidden"
                    />
                  </label>
                )}

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    {createType === 'image' ? 'Caption (optional)' : 'Video Caption'}
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Add a caption..."
                    rows={2}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50 resize-none"
                  />
                </div>
              </div>
            )}

            {createType === 'voice' && (
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Voice status caption or title
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Add voice status description..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50 resize-none"
                />
              </div>
            )}

            {createType === 'text' && (
              <div className="space-y-3">
                {/* Live WhatsApp-style Canvas Editor */}
                <div
                  style={{ background: selectedBg }}
                  onClick={handleCycleBackground}
                  className="relative h-48 sm:h-52 rounded-3xl p-5 flex flex-col justify-between items-center text-center cursor-pointer shadow-inner border border-white/15 select-none transition-all group"
                  title="Click anywhere to change background color"
                >
                  <div className="w-full flex items-center justify-between z-10">
                    <span className="text-[10px] font-bold text-white/80 bg-black/40 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                      Tap canvas or button above to cycle colors
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCycleBackground();
                      }}
                      className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white shadow transition-transform hover:scale-110 active:scale-90"
                      title="Cycle Color"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type a status..."
                    rows={3}
                    className="w-full bg-transparent text-center text-white placeholder-white/60 font-bold text-lg sm:text-xl font-display outline-none resize-none z-10"
                    autoFocus
                  />

                  <div className="text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded-full z-10">
                    WhatsApp Business Live Preview
                  </div>
                </div>

                {/* Color Swatches */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-teal-400" />
                      <span>Choose Background Theme</span>
                    </label>
                    <span className="text-[10px] text-slate-500">{STORY_GRADIENTS.length} themes</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {STORY_GRADIENTS.map((bg, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedBg(bg)}
                        style={{ background: bg }}
                        className={`w-7 h-7 rounded-xl border-2 transition-transform shrink-0 ${
                          selectedBg === bg ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts</option>
                  <option value="selected">Selected People</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-teal-400 shadow-lg shadow-teal-500/20"
                >
                  Publish Status
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Manage & Delete My Updates Wheel Modal */}
      {isManageUpdatesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Settings className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-display">
                    Manage & Delete My Updates
                  </h3>
                  <p className="text-xs text-slate-400">
                    {myStories.length} active update(s) · {myHistory.length} archived in history
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManageUpdatesOpen(false);
                  setIsPaused(false);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Bulk Delete Action */}
            {myStories.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Delete All Active Updates
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Permanently remove all {myStories.length} of your current status stories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAllMyUpdates}
                  className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All</span>
                </button>
              </div>
            )}

            {/* Active Updates List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Updates ({myStories.length})
              </h4>
              {myStories.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">You have no active updates right now.</p>
                  <button
                    onClick={() => {
                      setIsManageUpdatesOpen(false);
                      setIsCreateModalOpen(true);
                    }}
                    className="mt-2 text-xs text-teal-400 font-semibold hover:underline"
                  >
                    + Post a new status update
                  </button>
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {myStories.map((st) => {
                    const hoursLeft = Math.max(
                      1,
                      Math.ceil((st.expiresAt - Date.now()) / (1000 * 60 * 60))
                    );
                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            style={{ background: st.background || STORY_GRADIENTS[0] }}
                            className="w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center border border-slate-700"
                          >
                            {st.mediaUrl ? (
                              <img src={st.mediaUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Type className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">
                              {st.content}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {st.viewers.length} views · expires in {hoursLeft}h
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              archiveStatusStory(st.id);
                              addToast('Archived', 'Moved update to history.', 'info');
                            }}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300"
                            title="Move to History"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteStatusStory(st.id);
                              addToast('Deleted', 'Update deleted successfully.', 'info');
                            }}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                            title="Delete This Update"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History & Privacy Shortcuts */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsManageUpdatesOpen(false);
                    setIsPrivacyModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-teal-400" />
                  <span>Audience & Privacy</span>
                </button>
                {myHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearStatusHistory();
                      addToast('History Cleared', 'Status history was cleared.', 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl hover:bg-rose-500/10 text-rose-400 text-xs font-semibold transition-colors"
                  >
                    Clear History ({myHistory.length})
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManageUpdatesOpen(false);
                  setIsPaused(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
