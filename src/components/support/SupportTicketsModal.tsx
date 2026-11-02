import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  X,
  Plus,
  Send,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Tag,
  ChevronRight,
  ArrowLeft,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { SupportTicket, TicketCategory, TicketStatus } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';
import { buildApiUrl } from '../../utils/apiConfig';

interface SupportTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportTicketsModal: React.FC<SupportTicketsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, addToast } = useChatTime();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | TicketStatus>('all');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // New ticket form
  const [category, setCategory] = useState<TicketCategory>('general_support');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ticket reply
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<string | undefined>(undefined);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const isStaff =
    currentUser.role === 'admin' ||
    currentUser.role === 'super_admin' ||
    currentUser.role === 'support' ||
    currentUser.username === 'prosperikeokwu';

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = isStaff ? '' : `?userId=${encodeURIComponent(currentUser.id)}`;
      const res = await fetch(buildApiUrl(`/api/support/tickets${query}`), {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('[Tickets] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, isStaff]);

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen, fetchTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      addToast('Incomplete Form', 'Please enter a subject and description.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/api/support/tickets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: currentUser.id,
          category,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          attachmentUrl,
        }),
      });

      if (res.ok) {
        const createdTicket = await res.json();
        setTickets((prev) => [createdTicket, ...prev]);
        setActiveTicket(createdTicket);
        setIsCreatingTicket(false);
        setSubject('');
        setDescription('');
        setAttachmentUrl(undefined);
        addToast('Ticket Created', `Your support ticket ${createdTicket.id} was submitted.`, 'success');
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'Failed to create ticket.', 'error');
      }
    } catch {
      addToast('Error', 'Network error creating ticket.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    setIsSendingReply(true);
    try {
      const res = await fetch(buildApiUrl(`/api/support/tickets/${activeTicket.id}/messages`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          senderId: currentUser.id,
          message: replyText.trim(),
          attachmentUrl: replyAttachment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          setActiveTicket(data.ticket);
          setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? data.ticket : t)));
        }
        setReplyText('');
        setReplyAttachment(undefined);
      }
    } catch {
      addToast('Error', 'Could not send ticket reply.', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!activeTicket) return;
    try {
      const res = await fetch(buildApiUrl(`/api/support/tickets/${activeTicket.id}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, adminId: currentUser.id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        addToast('Status Updated', `Ticket marked as ${status}.`, 'info');
      }
    } catch {
      addToast('Error', 'Could not update status.', 'error');
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>, forReply = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (forReply) setReplyAttachment(reader.result);
        else setAttachmentUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.status === activeFilter;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">Open</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">In Review</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">Resolved</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/40 text-[10px] font-bold">Closed</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl h-[90vh] max-h-[700px] flex flex-col shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/80">
          <div className="flex items-center gap-3 min-w-0">
            {activeTicket && (
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer mr-1"
                title="Back to Tickets"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                <span>{activeTicket ? activeTicket.id : 'Official Support Tickets'}</span>
                {activeTicket && getStatusBadge(activeTicket.status)}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {activeTicket
                  ? activeTicket.subject
                  : isStaff
                  ? 'ChatTime 24/7 Administration Desk'
                  : 'Track and resolve customer support inquiries directly'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!activeTicket && !isCreatingTicket && (
              <button
                type="button"
                onClick={() => setIsCreatingTicket(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">New Ticket</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body View */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {isCreatingTicket ? (
            /* Create Ticket Form */
            <form onSubmit={handleCreateTicket} className="space-y-4 max-w-lg mx-auto py-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Open a Support Ticket</h4>
                <button
                  type="button"
                  onClick={() => setIsCreatingTicket(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="general_support">General Support</option>
                    <option value="account_security">Account & Security</option>
                    <option value="messaging_media">Messaging & Media</option>
                    <option value="calls_audio">Calls & Audio Engine</option>
                    <option value="voice_ai">Voice AI Platform</option>
                    <option value="billing_subscription">Billing & Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summary of issue..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information regarding your request or inquiry..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-400 resize-none"
                  required
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">
                  Screenshot / Document (Optional)
                </label>
                {attachmentUrl ? (
                  <div className="relative p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-teal-400 truncate">Attachment uploaded</span>
                    <button
                      type="button"
                      onClick={() => setAttachmentUrl(undefined)}
                      className="text-xs text-rose-400 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-800 hover:border-teal-500/50 cursor-pointer bg-slate-950 transition-colors">
                    <Paperclip className="w-4 h-4 text-teal-400" />
                    <span className="text-xs text-slate-300">Upload screenshot or file</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleAttachmentUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTicket(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          ) : activeTicket ? (
            /* Ticket Conversation View */
            <div className="flex flex-col h-full space-y-4">
              {/* Ticket Meta Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">
                      {activeTicket.category}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-slate-400">
                      Opened by <strong className="text-white">{activeTicket.userName}</strong>
                    </span>
                  </div>
                  {isStaff ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Admin Status:</span>
                      <select
                        value={activeTicket.status}
                        onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="pending">In Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  ) : (
                    getStatusBadge(activeTicket.status)
                  )}
                </div>
                <div className="text-xs text-slate-300 font-medium">{activeTicket.subject}</div>
              </div>

              {/* Messages timeline */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {(activeTicket.messages || []).map((m) => {
                  const isMe = m.senderId === currentUser.id;
                  const isSupportAgent = m.senderRole === 'support' || m.senderRole === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400">{m.senderName}</span>
                        {isSupportAgent && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold border border-rose-500/30">
                            Support Agent
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500">{formatRelativeTime(m.timestamp)}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl max-w-sm sm:max-w-md text-xs leading-relaxed ${
                          isMe
                            ? 'bg-teal-500 text-slate-950 font-medium rounded-tr-none'
                            : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                            <img
                              src={m.attachments[0]}
                              alt="Attachment"
                              className="rounded-lg max-h-40 w-auto object-cover border border-slate-800"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-2 border-t border-slate-800 space-y-2 shrink-0">
                {replyAttachment && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-teal-400">File attached to reply</span>
                    <button
                      type="button"
                      onClick={() => setReplyAttachment(undefined)}
                      className="text-xs text-rose-400 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors">
                    <Paperclip className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleAttachmentUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to this ticket..."
                    className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold cursor-pointer transition-transform active:scale-95 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Ticket List View */
            <div className="space-y-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['all', 'open', 'pending', 'resolved', 'closed'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                      activeFilter === filter
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-slate-500 text-xs">Loading support tickets...</div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
                    <LifeBuoy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">No Support Tickets</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activeFilter === 'all'
                        ? 'You do not have any active or previous support tickets.'
                        : `No ${activeFilter} tickets found.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTicket(true)}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Ticket</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTicket(t)}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-400">
                            {t.id}
                          </span>
                          {getStatusBadge(t.status)}
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
                            {t.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-teal-400 transition-colors">
                          {t.subject}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {t.description}
                        </p>
                        <div className="text-[10px] text-slate-500 pt-0.5">
                          Updated {formatRelativeTime(t.updatedAt)} • {t.messages?.length || 1} messages
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
