import React, { useState, useMemo, useEffect } from 'react';
import {
  Phone,
  Search,
  Lock,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Check,
  MessageSquare,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { maskPhoneNumber } from '../../utils/numberGenerator';
import { BrandLogo } from '../common/BrandLogo';
import { VerifiedBadge } from '../common/VerifiedBadge';
import type { User } from '../../types';

interface TopHeaderProps {
  onOpenRegister: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenRegister: _onOpenRegister }) => {
  const {
    currentUser,
    users,
    searchUsers,
    startDirectChat,
    startCall,
    searchQuery,
    setSearchQuery,
    updateCurrentUser,
    setInspectedUserId,
    setIsAppLocked,
    addToast,
    t,
  } = useChatTime();

  const [copied, setCopied] = useState(false);

  // Background search server as user types
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers(searchQuery);
    }
  }, [searchQuery, searchUsers]);

  const matchingUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const digits = q.replace(/[^0-9]/g, '');
    const cleanUser = q.replace(/^@/, '');

    const allUsers = Object.values(users) as User[];
    return allUsers.filter((u) => {
      if (!u) return false;
      const uUser = (u.username || '').toLowerCase();
      const uName = (u.name || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uChatDigits = (u.chatTimeNumber || '').replace(/[^0-9]/g, '');
      const uPhoneDigits = (u.phoneNumber || '').replace(/[^0-9]/g, '');

      if (cleanUser.length >= 2 && (uUser.includes(cleanUser) || cleanUser.includes(uUser))) return true;
      if (q.length >= 2 && (uName.includes(q) || uEmail.includes(q))) return true;
      if (digits.length >= 2 && (uChatDigits.includes(digits) || uPhoneDigits.includes(digits) || digits.includes(uChatDigits) || digits.includes(uPhoneDigits))) return true;
      return false;
    });
  }, [searchQuery, users]);

  const rawNumber = currentUser.phoneNumber || currentUser.chatTimeNumber || '+1 (555) 019-9001';
  const displayedNumber = currentUser.phonePrivate
    ? maskPhoneNumber(rawNumber)
    : rawNumber;

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawNumber);
    setCopied(true);
    addToast('Number Copied', `${rawNumber} copied to clipboard.`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleNumberPrivacy = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateCurrentUser({ phonePrivate: !currentUser.phonePrivate });
  };

  return (
    <header
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
        minHeight: 'calc(4rem + max(env(safe-area-inset-top, 0px), 0px))',
      }}
      className="bg-slate-900 border-b border-slate-800/80 flex items-center justify-between gap-2 z-30 shrink-0 select-none pb-2"
    >
      {/* Left: Brand Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <BrandLogo
          size="md"
          showText
          subtitle={currentUser.isBusiness ? t('chatTimeBusiness', 'Chat Time Business') : undefined}
        />
        {currentUser.isBusiness && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold tracking-wide">
            {t('official', 'Official Business')}
          </span>
        )}
      </div>

      {/* Center: Global Search Input with Interactive Results Dropdown */}
      <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder', 'Search chats, @username, or +country phone number...')}
            className="w-full bg-slate-950/90 border border-slate-800 focus:border-teal-500/60 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Live User Search Dropdown */}
        {matchingUsers.length > 0 && searchQuery.trim().length >= 2 && (
          <div className="absolute top-11 left-0 right-0 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 z-50 max-h-80 overflow-y-auto space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-teal-400 uppercase tracking-wider">
              <span>Matching Registered Accounts ({matchingUsers.length})</span>
              <span className="text-[9px] text-slate-400">Click to view profile</span>
            </div>
            {matchingUsers.map((u) => {
              const isCurrent = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 transition-colors"
                >
                  <div
                    onClick={() => {
                      setInspectedUserId(u.id);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={u.avatar || '/icon.svg'}
                        alt={u.name}
                        className="w-8 h-8 rounded-xl object-cover bg-slate-800 border border-slate-700"
                      />
                      {u.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">{u.name}</span>
                        <VerifiedBadge user={u} size="xs" />
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 text-[9px] font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-teal-400 font-mono truncate">
                        @{u.username} • {u.chatTimeNumber || u.phoneNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectedUserId(u.id);
                        setSearchQuery('');
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer"
                      title="View Full Profile"
                    >
                      <UserIcon className="w-3 h-3" />
                    </button>
                    {!isCurrent && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            startDirectChat(u.id);
                            setSearchQuery('');
                          }}
                          className="px-2 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            startDirectChat(u.id);
                            startCall(u.id, 'voice');
                            setSearchQuery('');
                          }}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 cursor-pointer"
                          title="Call"
                        >
                          <Phone className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Phone Badge & User Profile Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Active User Phone / ChatTime Number Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/90 border border-slate-800/90 rounded-xl px-3 py-1.5">
          <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="text-xs font-mono font-medium text-slate-200 tracking-wide">
            {displayedNumber}
          </span>
          <button
            onClick={toggleNumberPrivacy}
            title={currentUser.phonePrivate ? 'Show full number' : 'Mask phone number'}
            className="p-1 text-slate-400 hover:text-teal-400 transition-colors"
          >
            {currentUser.phonePrivate ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleCopyNumber}
            title="Copy my phone number"
            className="p-1 text-slate-400 hover:text-teal-400 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* App Passcode Lock Trigger */}
        {currentUser.securitySettings?.pinEnabled && (
          <button
            onClick={() => setIsAppLocked(true)}
            title="Lock App Now"
            aria-label="Lock app now"
            className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Current User Profile Trigger (Opens in front on the app with Back icon) */}
        <button
          type="button"
          onClick={() => {
            setInspectedUserId(currentUser?.id || 'me');
          }}
          aria-label="Open your profile"
          className="min-h-11 min-w-[44px] flex items-center gap-2 bg-slate-950 hover:bg-slate-800 active:bg-slate-800 border border-slate-800 rounded-xl pl-1.5 pr-2.5 py-1 transition-all cursor-pointer active:scale-95 shadow-sm touch-manipulation"
        >
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover bg-slate-800"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="hidden sm:flex flex-col items-start text-left max-w-[120px]">
            <div className="flex items-center gap-1 w-full min-w-0">
              <span className="text-xs font-semibold text-slate-100 leading-tight truncate">
                {currentUser.name}
              </span>
              <VerifiedBadge user={currentUser} size="xs" />
            </div>
            <span className="text-[10px] text-teal-400 leading-tight truncate w-full">
              @{currentUser.username}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
