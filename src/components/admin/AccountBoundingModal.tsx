import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Ban,
  Lock,
  MessageSquare,
  PhoneCall,
  Users,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Unlock,
} from 'lucide-react';
import { User, AccountBoundingDetails } from '../../types';
import { useChatTime } from '../../context/ChatTimeContext';

interface AccountBoundingModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (b: AccountBoundingDetails) => Promise<void> | void;
  onUnbind?: () => Promise<void> | void;
}

const VIOLATION_PRESETS = [
  'Spam / Automated Bot Activity',
  'Harassment & Abusive Messaging',
  'Fraud, Scam, or Phishing Attempt',
  'Terms of Service & Security Violation',
  'Security Investigation / Suspicious Auth',
  'Impersonation of Another Individual',
  'Illegal or Inappropriate Content Sharing',
  'Custom Reason',
];

export const AccountBoundingModal: React.FC<AccountBoundingModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  onUnbind,
}) => {
  const { boundUserAccount, unbindUserAccount, currentUser } = useChatTime();

  const [scope, setScope] = useState<'full_block' | 'restricted' | 'frozen'>('full_block');
  const [restrictMessages, setRestrictMessages] = useState(true);
  const [restrictCalls, setRestrictCalls] = useState(true);
  const [restrictGroups, setRestrictGroups] = useState(true);
  const [restrictProfile, setRestrictProfile] = useState(false);
  const [selectedReason, setSelectedReason] = useState(VIOLATION_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [duration, setDuration] = useState<'1h' | '24h' | '3d' | '7d' | '30d' | 'permanent'>('permanent');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.boundingDetails) {
      const b = user.boundingDetails;
      setScope(b.scope || 'full_block');
      setRestrictMessages(b.restrictions?.includes('messages') ?? true);
      setRestrictCalls(b.restrictions?.includes('calls') ?? true);
      setRestrictGroups(b.restrictions?.includes('groups') ?? true);
      setRestrictProfile(b.restrictions?.includes('profile') ?? false);
      setDuration(b.duration || 'permanent');
      if (VIOLATION_PRESETS.includes(b.reason)) {
        setSelectedReason(b.reason);
      } else {
        setSelectedReason('Custom Reason');
        setCustomReason(b.reason);
      }
      setInternalNotes(b.internalNotes || '');
    } else {
      setScope('full_block');
      setRestrictMessages(true);
      setRestrictCalls(true);
      setRestrictGroups(true);
      setRestrictProfile(false);
      setSelectedReason(VIOLATION_PRESETS[0]);
      setCustomReason('');
      setDuration('permanent');
      setInternalNotes('');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isAlreadyBounded = Boolean(user.isBanned || user.isBounded || user.boundingDetails?.isBounded);

  const handleApplyBounding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const activeRestrictions: ('messages' | 'calls' | 'groups' | 'profile')[] = [];
    if (restrictMessages) activeRestrictions.push('messages');
    if (restrictCalls) activeRestrictions.push('calls');
    if (restrictGroups) activeRestrictions.push('groups');
    if (restrictProfile) activeRestrictions.push('profile');

    const effectiveReason = selectedReason === 'Custom Reason' ? (customReason.trim() || 'Custom violation') : selectedReason;

    let expiresAt: number | undefined;
    const now = Date.now();
    if (duration === '1h') expiresAt = now + 3600 * 1000;
    else if (duration === '24h') expiresAt = now + 86400 * 1000;
    else if (duration === '3d') expiresAt = now + 3 * 86400 * 1000;
    else if (duration === '7d') expiresAt = now + 7 * 86400 * 1000;
    else if (duration === '30d') expiresAt = now + 30 * 86400 * 1000;

    const boundingDetails: AccountBoundingDetails = {
      isBounded: true,
      scope,
      restrictions: activeRestrictions,
      reason: effectiveReason,
      duration,
      boundedAt: now,
      expiresAt,
      boundedBy: `${currentUser.name} (@${currentUser.username})`,
      internalNotes: internalNotes.trim() || undefined,
      caseId: `BND-${user.id.slice(-6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    };

    if (onSave) {
      await onSave(boundingDetails);
    } else {
      await boundUserAccount(user.id, boundingDetails, scope === 'full_block');
    }
    setIsSubmitting(false);
    onClose();
  };

  const handleUnbind = async () => {
    setIsSubmitting(true);
    if (onUnbind) {
      await onUnbind();
    } else {
      await unbindUserAccount(user.id);
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                Account Bounding & Block Enforcement
              </h3>
              <p className="text-xs text-slate-400">
                Manage restriction bounds, communication limits, or full account suspension
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target User Info Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-11 h-11 rounded-2xl object-cover border border-slate-700 bg-slate-900 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100 truncate">{user.name}</span>
                <span className="text-xs font-mono text-teal-400">@{user.username}</span>
              </div>
              <p className="text-xs font-mono text-slate-400 truncate">
                Phone: {user.phoneNumber || user.chatTimeNumber} · ID: {user.chatTimeNumber}
              </p>
            </div>
          </div>

          <div>
            {isAlreadyBounded ? (
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                Currently Bounded
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Good Standing
              </span>
            )}
          </div>
        </div>

        {/* Bounding Configuration Form */}
        <form onSubmit={handleApplyBounding} className="space-y-4">
          {/* Scope Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Bounding Scope & Action
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'full_block',
                  label: 'Full Account Ban',
                  desc: 'Lockout from login & all features',
                  icon: Ban,
                },
                {
                  id: 'restricted',
                  label: 'Communication Bound',
                  desc: 'Restrict messages, calls, groups',
                  icon: MessageSquare,
                },
                {
                  id: 'frozen',
                  label: 'Security Freeze',
                  desc: 'Account frozen for audit',
                  icon: Lock,
                },
              ].map((s) => {
                const Icon = s.icon;
                const active = scope === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScope(s.id as any)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-1 transition-all ${
                      active
                        ? 'bg-rose-500/15 border-rose-500/60 text-slate-100 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${active ? 'text-rose-400' : 'text-slate-400'}`} />
                      {active && <CheckCircle className="w-3.5 h-3.5 text-rose-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{s.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{s.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Bounds Checklist */}
          {scope !== 'full_block' && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Bounding Restrictions
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer p-1 text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={restrictMessages}
                    onChange={(e) => setRestrictMessages(e.target.checked)}
                    className="accent-rose-500 rounded"
                  />
                  <span>Bound Messaging (Mute)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1 text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={restrictCalls}
                    onChange={(e) => setRestrictCalls(e.target.checked)}
                    className="accent-rose-500 rounded"
                  />
                  <span>Bound Audio/Video Calls</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1 text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={restrictGroups}
                    onChange={(e) => setRestrictGroups(e.target.checked)}
                    className="accent-rose-500 rounded"
                  />
                  <span>Bound Group Creation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1 text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={restrictProfile}
                    onChange={(e) => setRestrictProfile(e.target.checked)}
                    className="accent-rose-500 rounded"
                  />
                  <span>Bound Profile Editing</span>
                </label>
              </div>
            </div>
          )}

          {/* Duration & Violation Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Bounding Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500/50"
              >
                <option value="1h">1 Hour (Quick Cooling Period)</option>
                <option value="24h">24 Hours (Temporary Warning)</option>
                <option value="3d">3 Days (Disciplinary Hold)</option>
                <option value="7d">7 Days (Severe Infraction)</option>
                <option value="30d">30 Days (Extended Suspension)</option>
                <option value="permanent">Indefinite / Permanent Block</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Violation Code / Reason
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500/50"
              >
                {VIOLATION_PRESETS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedReason === 'Custom Reason' && (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Specify Custom Bounding Reason
              </label>
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Reason explained to user..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500/50"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Internal Admin Notes (Private)
            </label>
            <input
              type="text"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="e.g. Repeated spam reports in #General channel"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500/50"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {isAlreadyBounded ? (
              <button
                type="button"
                onClick={handleUnbind}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Lift All Bounds & Unblock</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isAlreadyBounded ? 'Update Bounding Bounds' : 'Apply Bounding & Block'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
