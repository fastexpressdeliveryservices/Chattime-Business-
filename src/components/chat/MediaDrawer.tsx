import React, { useState } from 'react';
import {
  X,
  Phone,
  ShieldCheck,
  Image as ImageIcon,
  FileText,
  Link2,
  Bell,
  BellOff,
  Trash2,
  LogOut,
  Copy,
  Check,
  Lock,
  Users,
  Crown,
  Shield,
  UserMinus,
  Flag,
  Sparkles,
  UserPlus,
  ExternalLink,
  Eraser,
  Ghost,
  ArrowLeft,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { maskPhoneNumber } from '../../utils/numberGenerator';
import { User } from '../../types';

export const MediaDrawer: React.FC = () => {
  const {
    activeChatId,
    chats,
    messages,
    users,
    currentUser,
    isInfoDrawerOpen,
    setIsInfoDrawerOpen,
    setInspectedUserId,
    toggleMuteChat,
    clearChatHistory,
    deleteChat,
    updateGroupPermissions,
    updateMemberRole,
    addGroupMembers,
    removeGroupMember,
    submitReport,
    addToast,
    isUserGhosted,
    toggleGhostUser,
  } = useChatTime();

  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'files' | 'links'>('overview');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Spam or unwanted contact');
  const [reportDetails, setReportDetails] = useState('');

  if (!isInfoDrawerOpen || !activeChatId) return null;

  const chat = chats.find((c) => c.id === activeChatId);
  if (!chat) return null;

  const chatMessages = messages[activeChatId] || [];
  const imageMessages = chatMessages.filter((m) => m.type === 'image' || m.type === 'video');
  const fileMessages = chatMessages.filter((m) => m.type === 'file' || m.type === 'voice');
  const linkMessages = chatMessages.filter((m) => m.content.includes('http'));

  const peerUserId =
    chat.type === 'direct'
      ? chat.participants.find((id) => id !== currentUser.id) || chat.participants[0]
      : undefined;
  const peerUser = peerUserId ? users[peerUserId] : undefined;

  const displayName = peerUser ? peerUser.name : chat.name;
  const displayAvatar = peerUser ? peerUser.avatar : chat.avatar;

  // Respect phone number privacy settings
  const numberVis = peerUser?.privacySettings?.numberVisibility || 'everyone';
  const isContact = peerUser && (currentUser.contacts || []).includes(peerUser.id);
  const canSeePhone =
    peerUser &&
    (currentUser.role === 'admin' ||
      (!peerUser.phonePrivate &&
        (numberVis === 'everyone' || (numberVis === 'contacts' && isContact))));
  const rawPhone = peerUser?.phoneNumber || peerUser?.chatTimeNumber || '';
  const peerPhone = peerUser
    ? canSeePhone
      ? rawPhone
      : maskPhoneNumber(rawPhone)
    : null;

  const isGroupAdmin =
    chat.type === 'group' &&
    (chat.admins?.includes(currentUser.id) ||
      chat.participantRoles?.[currentUser.id] === 'creator' ||
      chat.participantRoles?.[currentUser.id] === 'admin');

  const nonMembers = (Object.values(users) as User[]).filter(
    (u) => !chat.participants.includes(u.id)
  );

  const handleCopyInvite = () => {
    if (!chat.inviteLink) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = chat.inviteLink.startsWith('http')
      ? chat.inviteLink
      : `${origin}${chat.inviteLink.startsWith('/') ? '' : '/'}${chat.inviteLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedInvite(true);
    addToast('Invite Link Copied', 'Share this link to invite members.', 'info');
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(
      chat.type === 'direct' ? 'user' : 'group',
      peerUser?.id || chat.id,
      displayName,
      reportReason,
      reportDetails || 'Reported from conversation details drawer.'
    );
    setReportDetails('');
    setIsReportModalOpen(false);
  };

  return (
    <aside className="w-full sm:w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 z-20 overflow-hidden">
      {/* Header with Back button */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsInfoDrawerOpen(false)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700/80 transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Back</span>
          </button>
          <h3 className="text-sm font-bold text-white truncate">
            {chat.type === 'direct' ? 'Contact Info' : 'Group Info'}
          </h3>
        </div>
        <button
          onClick={() => setIsInfoDrawerOpen(false)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Identity Summary */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-24 h-24 rounded-3xl object-cover bg-slate-800 border-2 border-slate-700 shadow-lg"
            />
            {peerUser && (
              <span
                className={`w-4 h-4 rounded-full border-2 border-slate-900 absolute -bottom-1 -right-1 ${
                  peerUser.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <h4 className="text-base font-bold text-white">{displayName}</h4>
            {peerUser?.isVerified && (
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            )}
          </div>

          {peerUser && (
            <p className="text-xs font-medium text-teal-400 mt-0.5">@{peerUser.username}</p>
          )}

          {peerPhone ? (
            <div className="mt-2 flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-mono font-semibold text-slate-200">{peerPhone}</span>
              {!canSeePhone && (
                <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded ml-1">
                  Private
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              {chat.participants.length} members
            </p>
          )}

          {peerUser && (
            <button
              onClick={() => setInspectedUserId(peerUser.id)}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Full Profile View
            </button>
          )}

          {peerUser?.statusFeeling && (
            <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-xs text-slate-300">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>{peerUser.statusFeeling}</span>
            </div>
          )}

          {(peerUser?.bio || chat.description) && (
            <p className="text-xs text-slate-300 mt-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 w-full">
              {peerUser?.bio || chat.description}
            </p>
          )}
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['overview', 'media', 'files', 'links'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-teal-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Encryption Notice */}
            <div className="p-3.5 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex items-start gap-3">
              <Lock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-teal-300">End-to-End Encrypted</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Messages and calls in this conversation are secured with ChatTime verification.
                </p>
              </div>
            </div>

            {/* Group Invite Link */}
            {chat.type === 'group' && chat.inviteLink && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Group Invite Link
                </label>
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="text-xs font-mono text-teal-400 truncate">
                    {chat.inviteLink}
                  </span>
                  <button
                    onClick={handleCopyInvite}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {copiedInvite ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Group Admin Permissions Matrix */}
            {chat.type === 'group' && chat.permissions && (
              <div className="space-y-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-teal-400" />
                    Group Permissions
                  </span>
                  {!isGroupAdmin && (
                    <span className="text-[10px] text-slate-500">Admin only</span>
                  )}
                </div>
                {(
                  [
                    { key: 'canSendMessages', label: 'Members can send messages' },
                    { key: 'canAddMembers', label: 'Members can invite others' },
                    { key: 'canPinMessages', label: 'Members can pin messages' },
                    { key: 'canChangeInfo', label: 'Members can edit group info' },
                  ] as const
                ).map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-center justify-between text-xs text-slate-300 cursor-pointer py-1"
                  >
                    <span>{perm.label}</span>
                    <input
                      type="checkbox"
                      disabled={!isGroupAdmin}
                      checked={Boolean(chat.permissions?.[perm.key])}
                      onChange={(e) =>
                        updateGroupPermissions(chat.id, { [perm.key]: e.target.checked })
                      }
                      className="accent-teal-500 w-4 h-4 rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            )}

            {/* Group Members List & Role Management */}
            {chat.type === 'group' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    Members ({chat.participants.length})
                  </span>
                  {nonMembers.length > 0 && (
                    <button
                      onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                      className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Member
                    </button>
                  )}
                </div>

                {isAddMemberOpen && nonMembers.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-teal-500/30 space-y-1.5 max-h-40 overflow-y-auto">
                    {nonMembers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-900"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs text-white truncate">{u.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            addGroupMembers(chat.id, [u.id]);
                            setIsAddMemberOpen(false);
                          }}
                          className="px-2 py-1 rounded bg-teal-500 text-slate-950 text-[10px] font-bold"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {chat.participants.map((uid) => {
                    const member = users[uid];
                    if (!member) return null;
                    const role =
                      chat.participantRoles?.[uid] ||
                      (chat.admins?.includes(uid) ? 'admin' : 'member');

                    return (
                      <div
                        key={uid}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60"
                      >
                        <div
                          onClick={() => setInspectedUserId(member.id)}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                        >
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover bg-slate-800"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-semibold text-slate-200 truncate hover:text-teal-400">
                                {member.name}
                              </span>
                              {role === 'creator' && (
                                <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                              )}
                              {role === 'admin' && (
                                <Shield className="w-3 h-3 text-teal-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 truncate">
                              @{member.username}
                            </p>
                          </div>
                        </div>

                        {isGroupAdmin && uid !== currentUser.id && role !== 'creator' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => removeGroupMember(chat.id, uid)}
                              title="Remove from group"
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer active:scale-95 transition-all"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => toggleMuteChat(chat.id)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/70 border border-slate-800 text-xs font-medium text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  {chat.isMuted ? (
                    <BellOff className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Bell className="w-4 h-4 text-teal-400" />
                  )}
                  {chat.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                </span>
              </button>

              <button
                onClick={() => clearChatHistory(chat.id)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/70 border border-slate-800 text-xs font-medium text-slate-200 transition-colors"
              >
                <Eraser className="w-4 h-4 text-amber-400" />
                Clear Chat Messages
              </button>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-amber-500/10 border border-slate-800 text-xs font-medium text-amber-400 transition-colors"
              >
                <Flag className="w-4 h-4" />
                Report {chat.type === 'direct' ? 'User' : 'Group'}
              </button>

              {chat.type === 'direct' && peerUser && (
                <button
                  type="button"
                  onClick={() => toggleGhostUser(peerUser.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                    isUserGhosted(peerUser.id)
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-slate-950 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Ghost className="w-4 h-4 text-rose-400" />
                    {isUserGhosted(peerUser.id) ? 'Unghost Contact' : 'Ghost (Block) Contact'}
                  </span>
                  {isUserGhosted(peerUser.id) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                      Ghosted
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => deleteChat(chat.id)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-400 transition-colors"
              >
                {chat.type === 'group' ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    Leave & Delete Group
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Conversation
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-3">
            {imageMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No shared photos or videos yet
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {imageMessages.map((m) => (
                  <div
                    key={m.id}
                    className="aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group"
                  >
                    {m.type === 'video' ? (
                      <video
                        src={m.mediaUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={m.mediaUrl}
                        alt={m.content}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-2">
            {fileMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No shared documents or voice notes
              </div>
            ) : (
              fileMessages.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                >
                  <FileText className="w-5 h-5 text-teal-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {m.fileName || m.content}
                    </p>
                    <p className="text-[10px] text-slate-500">{m.fileSize || 'Audio Note'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-2">
            {linkMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No shared links in this chat
              </div>
            ) : (
              linkMessages.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-teal-400 break-all"
                >
                  {m.content}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReportSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                Report {displayName}
              </h4>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option>Spam or unwanted contact</option>
                <option>Harassment or abusive behavior</option>
                <option>Impersonation or fake number</option>
                <option>Scam or phishing link</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Additional Details</label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe the issue..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};
