import React, { useState } from 'react';
import {
  Phone,
  Search,
  Lock,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { maskPhoneNumber } from '../../utils/numberGenerator';
import { BrandLogo } from '../common/BrandLogo';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface TopHeaderProps {
  onOpenRegister: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenRegister: _onOpenRegister }) => {
  const {
    currentUser,
    searchQuery,
    setSearchQuery,
    updateCurrentUser,
    setInspectedUserId,
    setIsAppLocked,
    addToast,
    t,
  } = useChatTime();

  const [copied, setCopied] = useState(false);

  const rawNumber = currentUser.phoneNumber || currentUser.chatTimeNumber;
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

      {/* Center: Global Search Input */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder', 'Search chats, @username, or +country phone number...')}
            className="w-full bg-slate-950/90 border border-slate-800 focus:border-teal-500/60 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-200"
            >
              {t('clear', 'Clear')}
            </button>
          )}
        </div>
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
          onClick={() => setInspectedUserId(currentUser.id)}
          aria-label="Open your profile"
          className="min-h-11 flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl pl-1.5 pr-2.5 py-1 transition-all cursor-pointer active:scale-95 shadow-sm"
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
