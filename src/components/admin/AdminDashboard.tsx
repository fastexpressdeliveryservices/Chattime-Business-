import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  MessageSquare,
  Phone,
  AlertTriangle,
  Radio,
  CheckCircle,
  Ban,
  Search,
  Send,
  ShieldCheck,
  Crown,
  ExternalLink,
  Compass,
  Lock,
  Unlock,
  Key,
  Trash2,
  Download,
  Power,
  RotateCcw,
  Sparkles,
  FileText,
  Activity,
  UserX,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { User, Chat, PlatformFeatureSettings } from '../../types';
import { formatTime } from '../../utils/formatters';
import { isSharedAppUrl } from '../../utils/sharedUrl';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { AccountBoundingModal } from './AccountBoundingModal';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    chats,
    messages,
    calls,
    channels,
    reports,
    auditLogs,
    maintenanceMode,
    platformFeatures,
    toggleVerifyUser,
    setVerificationBadgeByAdmin,
    updateUserRoleByAdmin,
    resolveReport,
    broadcastSystemAnnouncement,
    boundUserAccount,
    unbindUserAccount,
    resetUserPinByAdmin,
    terminateUserSessionsByAdmin,
    deleteUserAccountByAdmin,
    dissolveGroupByAdmin,
    purgeSpamMessagesByAdmin,
    setMaintenanceModeByAdmin,
    updatePlatformFeaturesByAdmin,
    setInspectedUserId,
    switchUserAccount,
    addToast,
  } = useChatTime();

  // If user is on shared app URL, admin dashboard MUST NEVER be displayed
  if (isSharedAppUrl()) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <h3 className="text-base font-bold text-slate-100 font-display">Page Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">This destination is unavailable on public preview.</p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<
    'users' | 'kpis' | 'reports' | 'moderation' | 'broadcast' | 'audit' | 'features'
  >('users');
  const [userFilter, setUserFilter] = useState<'all' | 'online' | 'bounded' | 'admins' | 'verified'>(
    'all'
  );
  const [userSearch, setUserSearch] = useState('');
  const [boundingModalUser, setBoundingModalUser] = useState<User | null>(null);
  const [isBoundingModalOpen, setIsBoundingModalOpen] = useState(false);

  // PIN Reset Modal
  const [pinResetUser, setPinResetUser] = useState<User | null>(null);
  const [customPinInput, setCustomPinInput] = useState('');

  // Delete User Confirmation Modal
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);

  // Dissolve Group Confirmation
  const [dissolveTargetChat, setDissolveTargetChat] = useState<Chat | null>(null);

  // Broadcast state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'high' | 'urgent'>(
    'normal'
  );
  const [broadcastSent, setBroadcastSent] = useState(false);

  const allUsers = Object.values(users) as User[];
  type BooleanFeatureKey =
    | 'allowRegistration'
    | 'allowMessaging'
    | 'allowCalls'
    | 'allowGroups'
    | 'allowCommunities'
    | 'voiceEffectsEnabled';

  const platformFeatureSwitches: {
    key: BooleanFeatureKey;
    title: string;
    description: string;
  }[] = [
    { key: 'allowRegistration', title: 'New account registration', description: 'Existing accounts can still sign in.' },
    { key: 'allowMessaging', title: 'New messages', description: 'Existing conversations remain available.' },
    { key: 'allowCalls', title: 'New voice and video calls', description: 'Calls already in progress are not interrupted.' },
    { key: 'allowGroups', title: 'Group creation', description: 'Existing groups remain available.' },
    { key: 'allowCommunities', title: 'Community creation', description: 'Existing communities remain available.' },
    { key: 'voiceEffectsEnabled', title: 'Voice Note Effects', description: 'Enable or disable accent-based voice modifiers for voice notes.' },
  ];
  const boundedUsers = allUsers.filter((u) => u.isBanned || u.isBounded || u.boundingDetails?.isBounded);
  const onlineUsers = allUsers.filter((u) => u.isOnline);
  const adminUsers = allUsers.filter((u) => u.role === 'admin');
  const verifiedUsers = allUsers.filter((u) => u.isVerified);

  const totalMessagesCount = Object.values(messages).reduce(
    (sum, list) => sum + (list?.length || 0),
    0
  );

  if (currentUser.role !== 'admin') {
    const adminAccount = allUsers.find((u) => u.role === 'admin');
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-100 font-display">
          Administrator Panel Restricted
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
          Viewing registered user phone numbers, account records, and moderation tools requires Administrator privileges.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {adminAccount && (
            <button
              onClick={() => switchUserAccount(adminAccount.id)}
              className="px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 transition-colors"
            >
              Switch to Admin ({adminAccount.name})
            </button>
          )}
          <button
            onClick={() => updateUserRoleByAdmin(currentUser.id, 'admin')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold transition-colors"
          >
            Elevate My Account to Admin
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phoneNumber || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      u.chatTimeNumber.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.countryName || '').toLowerCase().includes(userSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (userFilter === 'online') return u.isOnline;
    if (userFilter === 'bounded') return Boolean(u.isBanned || u.isBounded || u.boundingDetails?.isBounded);
    if (userFilter === 'admins') return u.role === 'admin';
    if (userFilter === 'verified') return u.isVerified;
    return true;
  });

  const handleOpenBoundingModal = (u: User) => {
    setBoundingModalUser(u);
    setIsBoundingModalOpen(true);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    broadcastSystemAnnouncement(
      announcementTitle.trim(),
      announcementContent.trim(),
      announcementPriority
    );
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setAnnouncementTitle('');
      setAnnouncementContent('');
    }, 2500);
  };

  const handleExportBackup = () => {
    window.open(`/api/admin/export-database?adminId=${encodeURIComponent(currentUser.id)}`, '_blank');
    addToast('Backup Exported', 'Database JSON export downloaded.', 'success');
  };

  const handleConfirmPinReset = async () => {
    if (!pinResetUser) return;
    await resetUserPinByAdmin(pinResetUser.id, customPinInput.trim() || undefined);
    setPinResetUser(null);
    setCustomPinInput('');
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    await deleteUserAccountByAdmin(deleteTargetUser.id);
    setDeleteTargetUser(null);
  };

  const handleConfirmDissolveChat = async () => {
    if (!dissolveTargetChat) return;
    await dissolveGroupByAdmin(dissolveTargetChat.id);
    setDissolveTargetChat(null);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 font-display">
              Administrator Control Center
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
              Master Access
            </span>
            {maintenanceMode && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                Maintenance Mode Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Account bounding, phone directory, conversation moderation, and system telemetry
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'users', label: `Users & Bounds (${allUsers.length})` },
            { id: 'moderation', label: `Conversations (${chats.length})` },
            { id: 'reports', label: `Reports (${reports.length})` },
            { id: 'kpis', label: 'System & Backup' },
            { id: 'broadcast', label: 'Broadcast' },
            { id: 'features', label: 'App Features' },
            { id: 'audit', label: `Audit Log (${auditLogs.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-teal-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* 1. REGISTERED USERS & ACCOUNT BOUNDING CENTER */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, @username, verified phone number, or country..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `All (${allUsers.length})` },
                  { id: 'bounded', label: `Bounded / Blocked (${boundedUsers.length})` },
                  { id: 'online', label: `Online (${onlineUsers.length})` },
                  { id: 'admins', label: `Admins (${adminUsers.length})` },
                  { id: 'verified', label: `Verified (${verifiedUsers.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setUserFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                      userFilter === f.id
                        ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Users List with Bounding Badges and Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No accounts found matching your filter criteria.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isBounded = Boolean(u.isBanned || u.isBounded || u.boundingDetails?.isBounded);
                  const isFullBlock = u.isBanned || u.boundingDetails?.scope === 'full_block';

                  return (
                    <div
                      key={u.id}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className={`w-13 h-13 rounded-2xl object-cover border bg-slate-950 ${
                              isBounded ? 'border-rose-500/50' : 'border-slate-700'
                            }`}
                            referrerPolicy="no-referrer"
                          />
                          <span
                            className={`w-3 h-3 rounded-full border-2 border-slate-900 absolute -bottom-0.5 -right-0.5 ${
                              u.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-100">{u.name}</span>
                            <span className="text-xs font-mono text-teal-400">@{u.username}</span>

                            {u.role === 'admin' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                                <Crown className="w-3 h-3" /> Admin
                              </span>
                            )}
                            {u.isVerified && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-200 font-mono flex items-center gap-1.5 shadow-sm">
                                <VerifiedBadge user={u} size="xs" />
                                <span>{u.isRedVerified || u.verificationBadge === 'red' ? 'Red Verified' : 'Blue Verified'}</span>
                              </span>
                            )}
                            {isBounded && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold flex items-center gap-1 border border-rose-500/30">
                                <Ban className="w-3 h-3" />
                                {isFullBlock ? 'Account Blocked' : 'Bounded & Restricted'}
                              </span>
                            )}
                          </div>

                          {/* Admin Details: Full Phone & ChatTime ID */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <div className="flex items-center gap-1.5 font-mono text-slate-200 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                              <Phone className="w-3.5 h-3.5 text-teal-400" />
                              <span>Phone: {u.phoneNumber || u.chatTimeNumber}</span>
                            </div>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ID: {u.chatTimeNumber}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {u.countryName} ({u.countryCode})
                            </span>
                            {u.createdAt && (
                              <span className="text-slate-500 text-[11px]">
                                Joined: {formatTime(u.createdAt)}
                              </span>
                            )}
                          </div>

                          {/* Bounding Details Pill */}
                          {u.boundingDetails?.isBounded && (
                            <div className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/20 px-2.5 py-1 rounded-lg mt-1 inline-flex items-center gap-2">
                              <span>Reason: {u.boundingDetails.reason}</span>
                              <span className="text-slate-400">·</span>
                              <span>Duration: {u.boundingDetails.duration}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin User Actions */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Admin Account Protection & Actions */}
                        {u.role === 'admin' || u.id === currentUser.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                              <span>{u.id === currentUser.id ? 'You (Admin)' : 'Admin (Protected)'}</span>
                            </span>
                            {u.id !== currentUser.id && (
                              <button
                                onClick={() => terminateUserSessionsByAdmin(u.id)}
                                title="Terminate active remote sessions"
                                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              >
                                <Power className="w-3.5 h-3.5 text-indigo-400" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* 1. Bound & Block Trigger */}
                            <button
                              onClick={() => handleOpenBoundingModal(u)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                isBounded
                                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-sm'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{isBounded ? 'Manage Bounds' : 'Bound & Block'}</span>
                            </button>

                            {/* 2. Verification Badge Controls (Red Tick / Blue Tick / Unverify) */}
                            <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                              <button
                                onClick={() => setVerificationBadgeByAdmin(u.id, 'red')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                  u.isVerified && (u.isRedVerified || u.verificationBadge === 'red')
                                    ? 'bg-rose-500/25 border border-rose-500/50 text-rose-300'
                                    : 'bg-slate-900 hover:bg-slate-800 text-rose-400'
                                }`}
                                title="Enable Red Tick (VIP / Official)"
                              >
                                <VerifiedBadge type="red" size="xs" />
                                <span>Red Tick</span>
                              </button>
                              <button
                                onClick={() => setVerificationBadgeByAdmin(u.id, 'blue')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                  u.isVerified && !(u.isRedVerified || u.verificationBadge === 'red')
                                    ? 'bg-sky-500/25 border border-sky-500/50 text-sky-300'
                                    : 'bg-slate-900 hover:bg-slate-800 text-sky-400'
                                }`}
                                title="Enable Blue Tick (Standard Verified)"
                              >
                                <VerifiedBadge type="blue" size="xs" />
                                <span>Blue Tick</span>
                              </button>
                              {u.isVerified && (
                                <button
                                  onClick={() => setVerificationBadgeByAdmin(u.id, 'none')}
                                  className="px-1.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                                  title="Revoke Verification"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>

                            {/* 3. Reset Security PIN */}
                            <button
                              onClick={() => setPinResetUser(u)}
                              title="Reset Security PIN"
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            >
                              <Key className="w-3.5 h-3.5 text-amber-400" />
                            </button>

                            {/* 4. Kill Sessions */}
                            <button
                              onClick={() => terminateUserSessionsByAdmin(u.id)}
                              title="Terminate all active remote sessions"
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            >
                              <Power className="w-3.5 h-3.5 text-indigo-400" />
                            </button>
                          </>
                        )}

                        {/* 5. Role Toggle */}
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() =>
                              updateUserRoleByAdmin(u.id, u.role === 'admin' ? 'user' : 'admin')
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/20 text-xs font-semibold"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </button>
                        )}

                        {/* 6. Profile Inspection */}
                        <button
                          onClick={() => setInspectedUserId(u.id)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                        </button>

                        {/* 7. Delete User Permanent */}
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => setDeleteTargetUser(u)}
                            title="Delete Account Permanently"
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. CONVERSATIONS & CONTENT MODERATION TAB */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display">
                  Conversations & Community Oversight
                </h3>
                <p className="text-xs text-slate-400">
                  Moderate group discussions, channels, and purge illicit or spam message streams
                </p>
              </div>
              <button
                onClick={() => purgeSpamMessagesByAdmin()}
                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Spam Messages ({totalMessagesCount} Total)</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
              {chats.map((c) => {
                const msgCount = (messages[c.id] || []).length;
                return (
                  <div
                    key={c.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-11 h-11 rounded-2xl object-cover bg-slate-800 border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">{c.name}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {c.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {c.participants.length} member(s) · {msgCount} messages
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDissolveTargetChat(c)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/25 text-rose-300 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Force Dissolve</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. REPORTS OVERSIGHT TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display">
                  Moderation Reports Queue
                </h3>
                <p className="text-xs text-slate-400">
                  Review flagged users, reported spam, and user security appeals
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                {reports.filter((r) => r.status === 'pending').length} Pending Review
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                No moderation reports or security appeals currently queued.
              </div>
            ) : (
              reports.map((rep) => {
                const targetUserObj = Object.values(users).find(
                  (u) => u.id === rep.targetId || u.name === rep.targetName
                );
                return (
                  <div
                    key={rep.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                        Report #{rep.id} · {rep.targetType}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          rep.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-100">
                      Target: {rep.targetName}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{rep.reason}</p>
                    <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {rep.details}
                    </p>

                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500">Reported by: {rep.reporterName}</span>
                      {rep.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => resolveReport(rep.id, 'dismissed')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                          >
                            Dismiss
                          </button>
                          {targetUserObj && (
                            <button
                              onClick={() => handleOpenBoundingModal(targetUserObj)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/30"
                            >
                              Bound Target
                            </button>
                          )}
                          <button
                            onClick={() => resolveReport(rep.id, 'resolved')}
                            className="px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400"
                          >
                            Resolve Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 4. SYSTEM TELEMETRY, MAINTENANCE & BACKUP TAB */}
        {activeTab === 'kpis' && (
          <div className="space-y-6">
            {/* Real-time KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Registered Accounts</span>
                  <Users className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100">{allUsers.length}</div>
                <div className="text-[11px] text-teal-400">{onlineUsers.length} active right now</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Bounded Accounts</span>
                  <Ban className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-rose-400">{boundedUsers.length}</div>
                <div className="text-[11px] text-slate-400">Restricted / Blocked</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Messages Stored</span>
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100">
                  {totalMessagesCount}
                </div>
                <div className="text-[11px] text-slate-400">{chats.length} active chats</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Calls & Audio</span>
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">{calls.length}</div>
                <div className="text-[11px] text-slate-400">{channels.length} communities</div>
              </div>
            </div>

            {/* Server Controls: Maintenance Mode & Backup Export */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Power className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">Platform Maintenance Mode</h4>
                      <p className="text-xs text-slate-400">
                        Signal maintenance state to all connected clients
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMaintenanceModeByAdmin(!maintenanceMode)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      maintenanceMode
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {maintenanceMode ? 'Active (Deactivate)' : 'Activate Mode'}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Download className="w-5 h-5 text-teal-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">Database JSON Export</h4>
                      <p className="text-xs text-slate-400">Download formatted database snapshot</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Backup</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PLATFORM FEATURE CONTROLS TAB */}
        {activeTab === 'features' && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 max-w-xl mx-auto">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-100">Platform Feature Controls</h3>
              <p className="mt-1 text-xs text-slate-400">
                Changes are saved on the server and enforced for new activity across the app.
              </p>
            </div>
            <div className="divide-y divide-slate-800">
              {platformFeatureSwitches.map((feature) => (
                <label key={feature.key} className="flex min-h-16 items-center justify-between gap-4 py-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-100">{feature.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">{feature.description}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(platformFeatures[feature.key])}
                    onChange={(event) =>
                      void updatePlatformFeaturesByAdmin({ [feature.key]: event.currentTarget.checked })
                    }
                    aria-label={`${feature.title} enabled`}
                    className="h-5 w-5 shrink-0 accent-teal-500"
                  />
                </label>
              ))}
            </div>

            {/* Voice Modifiers Configuration */}
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-teal-400" />
                    <span>Voice Note Modifiers (Accents & Effects)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select which accents and voice filters users can choose before sending voice notes.
                  </p>
                </div>
              </div>

              {/* Preset Modifier Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {[
                  'American 🇺🇸',
                  'British 🇬🇧',
                  'Indian 🇮🇳',
                  'Asian 🌏',
                  'Australian 🇦🇺',
                  'Nigerian 🇳🇬',
                  'Jamaican 🇯🇲',
                  'French 🇫🇷',
                  'Spanish 🇪🇸',
                  'Canadian 🇨🇦',
                ].map((mod) => {
                  const isEnabled = (platformFeatures.voiceModifiers || []).includes(mod);
                  return (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => {
                        const current = platformFeatures.voiceModifiers || [];
                        const updated = isEnabled
                          ? current.filter((m) => m !== mod)
                          : [...current, mod];
                        void updatePlatformFeaturesByAdmin({ voiceModifiers: updated });
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all border ${
                        isEnabled
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{mod}</span>
                      <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-teal-400' : 'bg-slate-700'}`} />
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Modifiers: {(platformFeatures.voiceModifiers || []).length}</span>
                <button
                  type="button"
                  onClick={() => {
                    void updatePlatformFeaturesByAdmin({
                      voiceModifiers: ['American 🇺🇸', 'British 🇬🇧', 'Indian 🇮🇳', 'Asian 🌏', 'Australian 🇦🇺', 'Nigerian 🇳🇬', 'Jamaican 🇯🇲'],
                    });
                  }}
                  className="text-teal-400 hover:underline font-semibold"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </section>
        )}


        {/* 5. GLOBAL BROADCAST ANNOUNCEMENT TAB */}
        {activeTab === 'broadcast' && (
          <form
            onSubmit={handleBroadcast}
            className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 max-w-xl mx-auto"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-teal-400" />
              <h3 className="text-base font-bold text-slate-100 font-display">
                Global System Announcement
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Transmit an instant real-time notification broadcast to all connected ChatTime users.
            </p>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Title</label>
              <input
                type="text"
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Announcement headline..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Message</label>
              <textarea
                required
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                rows={3}
                placeholder="Write the broadcast message..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Priority</label>
              <select
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Critical</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {broadcastSent && (
                <span className="text-xs text-teal-400 font-bold">
                  Broadcast transmitted to all users!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto flex items-center gap-1.5 px-5 py-2.5 bg-teal-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-teal-400 shadow-md shadow-teal-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Broadcast</span>
              </button>
            </div>
          </form>
        )}

        {/* 6. ADMINISTRATIVE AUDIT LOG TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                Administrative Audit Trail
              </h3>
              <p className="text-xs text-slate-400">
                Immutable security log of administrative actions, account boundings, and role changes
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
              {auditLogs.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No administrative actions logged yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30">
                          {log.action}
                        </span>
                        {log.targetName && (
                          <span className="text-xs font-semibold text-slate-200">
                            Target: {log.targetName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{log.details}</p>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 shrink-0">
                      {formatTime(log.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Account Bounding & Block Modal */}
      <AccountBoundingModal
        user={boundingModalUser}
        isOpen={isBoundingModalOpen}
        onClose={() => {
          setIsBoundingModalOpen(false);
          setBoundingModalUser(null);
        }}
      />

      {/* Reset PIN Modal */}
      {pinResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100 font-display">
                Reset PIN for {pinResetUser.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Assign a new security PIN code or leave blank to remove PIN lock.
            </p>
            <input
              type="text"
              maxLength={6}
              value={customPinInput}
              onChange={(e) => setCustomPinInput(e.target.value)}
              placeholder="Leave blank to remove PIN, or enter new code"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/50"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPinResetUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPinReset}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Apply PIN Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100 font-display">
                Delete Account: {deleteTargetUser.name}?
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete @{deleteTargetUser.username}? This action purges their credentials and records permanently.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dissolve Group Confirmation */}
      {dissolveTargetChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100 font-display">
                Dissolve Group: {dissolveTargetChat.name}?
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Force-dissolving this group will remove it and all contained messages for all participants.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDissolveTargetChat(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDissolveChat}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
              >
                Dissolve Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
