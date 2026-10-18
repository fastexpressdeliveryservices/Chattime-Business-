import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  MessageSquare,
  PhoneCall,
  Users,
  Clock,
  FileText,
  Send,
  LogOut,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { formatTime } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';

export const AccountBoundedScreen: React.FC = () => {
  const { currentUser, logoutUser, submitReport, addToast } = useChatTime();
  const [appealText, setAppealText] = useState('');
  const [appealSent, setAppealSent] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);

  const b = currentUser.boundingDetails;
  const isFullBlock = currentUser.isBanned || b?.scope === 'full_block';
  const reason = b?.reason || 'Violation of ChatTime Community Standards and Security Policy';
  const caseId = b?.caseId || `BND-${currentUser.id.slice(-6).toUpperCase()}`;
  const boundedAt = b?.boundedAt || currentUser.createdAt || Date.now();
  const duration = b?.duration || 'Indefinite / Permanent';
  const restrictions = b?.restrictions || ['messages', 'calls', 'groups', 'profile'];

  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealText.trim()) return;

    submitReport(
      'user',
      currentUser.id,
      currentUser.name,
      'Account Restriction Appeal',
      `[CASE: ${caseId}] User Appeal Statement: ${appealText.trim()}`
    );

    setAppealSent(true);
    addToast('Appeal Submitted', 'Your appeal has been forwarded to the trust & security review team.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <BrandLogo size="sm" showText subtitle="Security & Trust Enforcement" />
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase tracking-wider font-bold">
            Account Bounded
          </span>
        </div>

        {/* Warning Icon & Headline */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-display">
            Account Suspended & Bounded
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Your ChatTime account has been restricted by an administrator due to activity violating platform terms or security boundaries.
          </p>
        </div>

        {/* Bounding Case Record Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400 font-mono">Reference Case:</span>
            <span className="font-mono font-bold text-amber-400">{caseId}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Violation Reason:</span>
            <span className="font-medium text-slate-200 text-right max-w-[240px] truncate">
              {reason}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Restriction Scope:</span>
            <span className="font-semibold text-rose-300 uppercase tracking-wider text-[11px]">
              {isFullBlock ? 'Full Account Lockout' : 'Communication Bound'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Duration:</span>
            <span className="font-medium text-slate-200">{duration}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Enforced Date:</span>
            <span className="font-mono text-slate-300">{formatTime(boundedAt)}</span>
          </div>
        </div>

        {/* Active Bounding Restrictions Badges */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Enforced Account Bounds
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-rose-300">
              <MessageSquare className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Messages Blocked</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-rose-300">
              <PhoneCall className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Voice/Video Bound</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-rose-300">
              <Users className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Community Mute</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-rose-300">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Auth Session Frozen</span>
            </div>
          </div>
        </div>

        {/* Appeal Section */}
        {showAppealForm ? (
          appealSent ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Appeal Transmitted to Administrators</span>
                <span>An administrator will review your case file. Check back or contact platform support.</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitAppeal} className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Submit Formal Appeal to Security Reviewers
              </label>
              <textarea
                required
                rows={3}
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                placeholder="Explain why you believe this account bounding was issued in error or request unblocking..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAppealForm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Appeal</span>
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Believe this is a mistake?</span>
            <button
              onClick={() => setShowAppealForm(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Request Review / Appeal
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Account: @{currentUser.username}
          </span>
          <button
            onClick={logoutUser}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
