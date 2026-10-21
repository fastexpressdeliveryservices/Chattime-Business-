import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Phone,
  Video,
  MessageSquare,
  ShieldCheck,
  Lock,
  Globe,
  Copy,
  Check,
  UserPlus,
  UserCheck,
  Sparkles,
  Calendar,
  Edit3,
  Users,
  Radio,
  ArrowLeft,
  Settings,
  LogOut,
  Save,
  AtSign,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { formatLastSeen } from '../../utils/formatters';
import { maskPhoneNumber } from '../../utils/numberGenerator';
import { isSharedAppUrl } from '../../utils/sharedUrl';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { buildApiUrl } from '../../utils/apiConfig';
import type { User } from '../../types';

interface UserProfileModalProps {
  onOpenRegister?: () => void;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onOpenRegister, onClose }) => {
  const {
    inspectedUserId,
    setInspectedUserId,
    users,
    currentUser,
    updateCurrentUser,
    chats,
    channels,
    startDirectChat,
    startCall,
    toggleContact,
    toggleFollowUser,
    setVerificationBadgeByAdmin,
    setActiveTab,
    logoutUser,
    addToast,
    theme,
    t,
  } = useChatTime();

  const [copied, setCopied] = useState(false);
  const [isEditingSelf, setIsEditingSelf] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);

  const isTargetSelf =
    !inspectedUserId ||
    inspectedUserId === 'me' ||
    inspectedUserId === 'self' ||
    Boolean(currentUser?.id && inspectedUserId === currentUser.id);

  // Synchronously resolve target user without blocking or spinning
  const targetUser: User | null = useMemo(() => {
    if (isTargetSelf && currentUser) return currentUser;
    if (inspectedUserId && users[inspectedUserId]) return users[inspectedUserId];
    if (fetchedUser) return fetchedUser;
    if (inspectedUserId) {
      const match = Object.values(users).find(
        (u) =>
          u &&
          (u.id === inspectedUserId ||
            (u.username && u.username.toLowerCase() === inspectedUserId.toLowerCase().replace(/^@/, '')) ||
            u.phoneNumber === inspectedUserId ||
            u.chatTimeNumber === inspectedUserId)
      );
      if (match) return match;
    }
    return currentUser || null;
  }, [isTargetSelf, inspectedUserId, users, fetchedUser, currentUser]);

  // Fast background lookup without causing endless spinning loops
  useEffect(() => {
    if (!inspectedUserId || isTargetSelf) {
      setFetchedUser(null);
      return;
    }
    if (users[inspectedUserId]) {
      return;
    }

    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted && !fetchedUser && currentUser) {
        setFetchedUser(currentUser);
      }
    }, 1500);

    fetch(buildApiUrl(`/api/users/lookup?q=${encodeURIComponent(inspectedUserId)}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isMounted && data?.user) {
          setFetchedUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
      });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [inspectedUserId, isTargetSelf]);

  // Initialize self edit form only when switching target user ID
  useEffect(() => {
    if (targetUser && currentUser?.id && targetUser.id === currentUser.id) {
      setEditName(targetUser.name || '');
      setEditUsername(targetUser.username || '');
      setEditBio(targetUser.bio || '');
    }
  }, [targetUser?.id, currentUser?.id]);

  const handleClose = () => {
    setInspectedUserId(null);
    onClose?.();
  };

  if (!inspectedUserId) return null;

  if (!targetUser) {
    return (
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-10 h-10 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-200">{t('loadingProfile', 'Opening Profile...')}</p>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            {t('close', 'Close')}
          </button>
        </div>
      </div>
    );
  }

  const isSelf = Boolean(currentUser?.id && targetUser.id === currentUser.id);
  const isAdminViewer = currentUser?.role === 'admin' && !isSharedAppUrl();
  const isContact = (currentUser?.contacts || []).includes(targetUser.id);
  const isFollowing = (currentUser?.following || []).includes(targetUser.id);

  const followersCount = (targetUser.followers || []).length;
  const followingCount = (targetUser.following || []).length;

  // Respect privacy settings for phone number visibility
  const numberVis = targetUser.privacySettings?.numberVisibility || 'everyone';
  const canSeeFullNumber =
    isSelf ||
    isAdminViewer ||
    (!targetUser.phonePrivate &&
      (numberVis === 'everyone' || (numberVis === 'contacts' && isContact)));

  const rawNumber = targetUser.phoneNumber || targetUser.chatTimeNumber || '';
  const displayedNumber = canSeeFullNumber ? rawNumber : maskPhoneNumber(rawNumber);

  // Respect privacy settings for last seen visibility safely
  const lastSeenVis = targetUser.privacySettings?.lastSeenVisibility || 'everyone';
  const canSeePresence =
    isSelf ||
    isAdminViewer ||
    (lastSeenVis === 'everyone' && currentUser?.privacySettings?.lastSeenVisibility !== 'nobody') ||
    (lastSeenVis === 'contacts' && isContact && currentUser?.privacySettings?.lastSeenVisibility !== 'nobody');

  // Country & Member Since privacy
  const countryVis = targetUser.privacySettings?.countryVisibility || 'everyone';
  const canSeeCountry =
    isSelf ||
    isAdminViewer ||
    countryVis === 'everyone' ||
    (countryVis === 'contacts' && isContact);

  const joinDateVis = targetUser.privacySettings?.joinDateVisibility || 'everyone';
  const canSeeJoinDate =
    isSelf ||
    isAdminViewer ||
    joinDateVis === 'everyone' ||
    (joinDateVis === 'contacts' && isContact);

  // Mutual groups & communities wrapped in useMemo to prevent hangs
  const mutualGroups = useMemo(() => {
    if (!targetUser?.id || !currentUser?.id) return [];
    return (chats || []).filter(
      (c) =>
        c &&
        c.type === 'group' &&
        Array.isArray(c.participants) &&
        c.participants.includes(targetUser.id) &&
        c.participants.includes(currentUser.id)
    );
  }, [chats, targetUser?.id, currentUser?.id]);

  const userCommunities = useMemo(() => {
    if (!targetUser?.id) return [];
    return (channels || []).filter(
      (ch) => ch && Array.isArray(ch.members) && ch.members.includes(targetUser.id)
    );
  }, [channels, targetUser?.id]);

  const handleCopyNumber = () => {
    if (!canSeeFullNumber || !rawNumber) return;
    navigator.clipboard.writeText(rawNumber);
    setCopied(true);
    addToast(t('copied', 'Copied'), `${rawNumber} ${t('copiedToClipboard', 'copied to clipboard.')}`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMessage = () => {
    if (isSelf) return;
    startDirectChat(targetUser.id);
    setInspectedUserId(null);
    onClose();
  };

  const handleCall = (type: 'voice' | 'video') => {
    if (isSelf) return;
    startDirectChat(targetUser.id);
    setInspectedUserId(null);
    onClose();
    startCall(targetUser.id, type);
  };

  const handleSaveProfileEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUser.length < 3) {
      addToast(t('invalidUsername', 'Invalid Username'), t('usernameMinLength', 'Username must be at least 3 characters.'), 'warning');
      return;
    }
    setEditSaving(true);
    try {
      await updateCurrentUser({
        name: editName.trim() || currentUser.name,
        username: cleanUser,
        bio: editBio.trim(),
      });
      setIsEditingSelf(false);
      addToast(t('profileUpdated', 'Profile Updated'), t('profileSavedSuccess', 'Your profile details have been saved.'), 'success');
    } catch {
      addToast(t('error', 'Error'), t('profileUpdateFailed', 'Could not update profile.'), 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const isLight = theme === 'light';
  const cardBgClass = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-slate-100';
  const innerCardBgClass = isLight
    ? 'bg-slate-100/80 border-slate-200 text-slate-800'
    : 'bg-slate-900 border-slate-800 text-slate-200';
  const textMutedClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const headingClass = isLight ? 'text-slate-900 font-bold' : 'text-white font-bold';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-0 md:p-6 overflow-hidden animate-in fade-in duration-150"
    >
      <div
        className={`border-0 md:border rounded-none md:rounded-3xl max-w-4xl w-full h-[100dvh] md:h-auto md:max-h-[92dvh] overflow-hidden shadow-2xl flex flex-col transition-colors ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Top Navigation Bar with Back Button - Safe Area Aware for iPhone Notch & Status Bar */}
        <div
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
            paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
            paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
          }}
          className={`pb-3.5 border-b flex items-center justify-between gap-3 shrink-0 select-none z-20 ${
            isLight
              ? 'bg-white/95 border-slate-200 shadow-sm backdrop-blur'
              : 'bg-slate-900/95 border-slate-800 shadow-sm backdrop-blur'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-md select-none shrink-0 min-h-[44px]"
              title={t('back', 'Go Back')}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>{t('goBack', 'Go Back')}</span>
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
              <span className={`text-xs sm:text-sm font-bold tracking-wide truncate ${headingClass}`}>
                {isSelf ? t('myProfile', 'Your Profile') : t('contactInfo', 'Contact Info')}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer border shrink-0 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={t('close', 'Close Profile')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content with iOS Safe Area Bottom Padding */}
        <div
          style={{
            paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 6rem)',
            paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
            paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
          }}
          className="flex-1 overflow-y-auto pt-4 sm:pt-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start [-webkit-overflow-scrolling:touch]"
        >
          {/* Left Column: Avatar, Follow Handles & Actions */}
          <div className={`md:col-span-5 flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl border space-y-4 ${cardBgClass}`}>
            <div className="relative">
              <img
                src={targetUser.avatar || '/icon.svg'}
                alt={targetUser.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover bg-slate-800 border-2 border-teal-500/40 shadow-xl"
              />
              {canSeePresence && (
                <span
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 ${
                    isLight ? 'border-white' : 'border-slate-950'
                  } ${targetUser.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}
                  title={targetUser.isOnline ? t('online', 'Online') : t('offline', 'Offline')}
                />
              )}
            </div>

            <div className="space-y-1.5 max-w-full">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <h2 className={`text-xl font-bold truncate ${headingClass}`}>{targetUser.name}</h2>
                <VerifiedBadge user={targetUser} size="md" />
                {targetUser.role === 'admin' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30">
                    {t('admin', 'Admin')}
                  </span>
                )}
              </div>

              {/* Follow Handle */}
              <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-teal-600 dark:text-teal-400 font-mono text-xs font-semibold ${innerCardBgClass}`}>
                <AtSign className="w-3 h-3 text-teal-500" />
                <span>{targetUser.username}</span>
              </div>

              {canSeePresence ? (
                <p className={`text-xs ${textMutedClass}`}>
                  {targetUser.isOnline
                    ? t('activeNow', 'Active Now on ChatTime')
                    : formatLastSeen(targetUser.lastSeen)}
                </p>
              ) : targetUser.bio ? (
                <p className={`text-xs truncate max-w-xs ${textMutedClass}`}>
                  {targetUser.bio}
                </p>
              ) : null}

              {/* Follower / Following Stats */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className={`text-center px-3 py-1.5 rounded-xl border ${innerCardBgClass}`}>
                  <div className={`text-sm font-bold font-mono ${headingClass}`}>{followersCount}</div>
                  <div className={`text-[10px] uppercase tracking-wider font-semibold ${textMutedClass}`}>
                    {t('followers', 'Followers')}
                  </div>
                </div>
                <div className={`text-center px-3 py-1.5 rounded-xl border ${innerCardBgClass}`}>
                  <div className={`text-sm font-bold font-mono ${headingClass}`}>{followingCount}</div>
                  <div className={`text-[10px] uppercase tracking-wider font-semibold ${textMutedClass}`}>
                    {t('following', 'Following')}
                  </div>
                </div>
              </div>
            </div>

            {targetUser.statusFeeling && (
              <div className={`px-3.5 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 ${innerCardBgClass}`}>
                <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span className="truncate">{targetUser.statusFeeling}</span>
              </div>
            )}

            {/* Bio */}
            <div className={`w-full p-3.5 rounded-xl border text-left ${innerCardBgClass}`}>
              <span className={`text-[10px] uppercase tracking-wider font-bold block mb-1 ${textMutedClass}`}>
                {t('aboutBio', 'About / Bio')}
              </span>
              <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                {targetUser.bio || t('availableOnChatTime', 'Available on ChatTime')}
              </p>
            </div>

            {/* Self Edit Profile or Target User Action Buttons */}
            {isSelf ? (
              <div className="w-full space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingSelf(!isEditingSelf)}
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditingSelf ? t('closeEditForm', 'Close Edit Form') : t('editProfile', 'Edit Profile & Handle')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    setActiveTab('settings');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors active:scale-95 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-teal-400" /> {t('settings', 'Full Settings & Privacy')}
                </button>

                {onOpenRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onOpenRegister();
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-teal-400" /> {t('addSwitchAccount', 'Add / Switch Account')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    logoutUser();
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> {t('signOut', 'Sign Out')}
                </button>
              </div>
            ) : (
              <div className="w-full space-y-2.5 pt-1">
                {/* Follow Button */}
                <button
                  type="button"
                  onClick={() => toggleFollowUser(targetUser.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    isFollowing
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 text-slate-950 font-extrabold shadow-teal-500/20'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-teal-400" /> {t('following', 'Following')} @{targetUser.username}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> {t('follow', 'Follow')} @{targetUser.username}
                    </>
                  )}
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleMessage}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t('message', 'Message')}
                  </button>
                  <button
                    onClick={() => handleCall('voice')}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    {t('voiceCall', 'Voice Call')}
                  </button>
                  <button
                    onClick={() => handleCall('video')}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    {t('videoCall', 'Video Call')}
                  </button>
                </div>

                <button
                  onClick={() => toggleContact(targetUser.id)}
                  className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isContact
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      : 'bg-teal-500/10 border-teal-500/30 text-teal-300 hover:bg-teal-500/20'
                  }`}
                >
                  {isContact ? (
                    <>
                      <UserCheck className="w-4 h-4 text-teal-400" /> {t('inContacts', 'In Your Contacts (Remove)')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> {t('saveToContacts', 'Save Number to Contacts')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Edit Username Form, Phone Number & Admin Badging */}
          <div className="md:col-span-7 space-y-4">
            {/* Inline Username & Profile Edit Form for Self */}
            {isSelf && isEditingSelf && (
              <form
                onSubmit={handleSaveProfileEdits}
                className="p-5 rounded-2xl bg-slate-950 border border-teal-500/40 space-y-3.5 shadow-xl animate-in slide-in-from-top duration-200"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-bold text-white">{t('editYourProfile', 'Edit Your Profile Details')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingSelf(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    {t('usernameHandle', 'Your Username (Follow Handle)')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400 font-mono text-sm font-bold">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{t('handleHelp', 'People find, follow, and message you using this handle.')}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    {t('displayName', 'Display Name')}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your Name"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    {t('bioAbout', 'Bio / About You')}
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={2}
                    placeholder="Tell friends about yourself..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={editSaving}
                  className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editSaving ? t('saving', 'Saving...') : t('saveChanges', 'Save Profile Changes')}</span>
                </button>
              </form>
            )}

            {/* Admin Red & Blue Tick Verification Controls */}
            {isAdminViewer && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    {t('adminVerificationControl', 'Admin Verification Badge Control')}
                  </span>
                  <VerifiedBadge user={targetUser} size="sm" />
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('adminVerificationDesc', 'Grant or remove official blue or red verified tick for this user.')}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setVerificationBadgeByAdmin(targetUser.id, 'red')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      targetUser.isVerified && (targetUser.isRedVerified || targetUser.verificationBadge === 'red')
                        ? 'bg-rose-500/25 border-rose-500 text-rose-300 ring-2 ring-rose-500/50 shadow-lg'
                        : 'bg-slate-900 hover:bg-rose-500/10 border-slate-800 text-rose-400'
                    }`}
                  >
                    <VerifiedBadge type="red" size="xs" />
                    <span>{t('redTick', 'Red Tick')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationBadgeByAdmin(targetUser.id, 'blue')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      targetUser.isVerified && !(targetUser.isRedVerified || targetUser.verificationBadge === 'red')
                        ? 'bg-sky-500/25 border-sky-500 text-sky-300 ring-2 ring-sky-500/50 shadow-lg'
                        : 'bg-slate-900 hover:bg-sky-500/10 border-slate-800 text-sky-400'
                    }`}
                  >
                    <VerifiedBadge type="blue" size="xs" />
                    <span>{t('blueTick', 'Blue Tick')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationBadgeByAdmin(targetUser.id, 'none')}
                    className="py-2 px-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-all cursor-pointer"
                  >
                    <span>{t('remove', 'Remove')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Phone Number Card */}
            <div className={`p-5 rounded-2xl border space-y-3 ${cardBgClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {t('phoneNumber', 'Phone & ChatTime Number')}
                </span>
                {canSeeFullNumber ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {t('verifiedNumber', 'Verified Number')}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {t('protectedPrivacy', 'Protected by Privacy Settings')}
                  </span>
                )}
              </div>

              <div className={`flex items-center justify-between p-3.5 rounded-xl border ${innerCardBgClass}`}>
                <div>
                  <div className={`text-lg font-mono font-bold tracking-wide ${headingClass}`}>
                    {canSeeFullNumber ? (displayedNumber || t('notAvailable', 'Not available')) : t('numberHidden', 'Hidden for privacy')}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${textMutedClass}`}>
                    {canSeeFullNumber
                      ? isAdminViewer && !isSelf && targetUser.phonePrivate
                        ? t('visibleAdmin', 'Visible to you as Platform Administrator')
                        : `${t('visibility', 'Visibility')}: ${numberVis}`
                      : t('hiddenInPrivacy', 'This user has hidden their phone number')}
                  </div>
                </div>
                {canSeeFullNumber && (
                  <button
                    onClick={handleCopyNumber}
                    className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                      isLight
                        ? 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                    title={t('copyNumber', 'Copy Phone Number')}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Account Metadata Grid (Respects Country & Member Since privacy) */}
            {(canSeeCountry || canSeeJoinDate) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {canSeeCountry && (
                  <div className={`p-4 rounded-2xl border ${cardBgClass}`}>
                    <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1 ${textMutedClass}`}>
                      <Globe className="w-3.5 h-3.5 text-teal-500" /> {t('countryRegion', 'Country / Region')}
                    </div>
                    <div className={`text-sm font-semibold ${headingClass}`}>
                      {targetUser.countryName || 'Global'} ({targetUser.countryCode || '+1'})
                    </div>
                  </div>
                )}

                {canSeeJoinDate && (
                  <div className={`p-4 rounded-2xl border ${cardBgClass}`}>
                    <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1 ${textMutedClass}`}>
                      <Calendar className="w-3.5 h-3.5 text-teal-500" /> {t('memberSince', 'Member Since')}
                    </div>
                    <div className={`text-sm font-semibold ${headingClass}`}>
                      {new Date(targetUser.createdAt || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mutual Groups & Joined Communities */}
            <div className={`p-5 rounded-2xl border space-y-3 ${cardBgClass}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${textMutedClass}`}>
                <Users className="w-3.5 h-3.5 text-teal-500" /> {t('groupsCommunities', 'Groups & Communities')} (
                {mutualGroups.length + userCommunities.length})
              </h3>

              {mutualGroups.length === 0 && userCommunities.length === 0 ? (
                <p className={`text-xs py-2 ${textMutedClass}`}>
                  {t('noSharedGroups', 'No shared groups or communities yet.')}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-44 overflow-y-auto pr-1">
                  {mutualGroups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <img
                        src={g.avatar}
                        alt={g.name}
                        className="w-8 h-8 rounded-lg object-cover bg-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{g.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {t('group', 'Group')} • {(g.participants || []).length} {t('members', 'members')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {userCommunities.map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <img
                        src={ch.avatar}
                        alt={ch.name}
                        className="w-8 h-8 rounded-lg object-cover bg-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <Radio className="w-3 h-3 text-teal-400 shrink-0" />
                          {ch.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{ch.category} {t('community', 'Community')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
