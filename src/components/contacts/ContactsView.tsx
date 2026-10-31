import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  PhoneIncoming,
  Video,
  MessageSquare,
  UserPlus,
  UserCheck,
  UserMinus,
  X,
  Check,
  Copy,
  Info,
  ShieldCheck,
  Sparkles,
  Lock,
  Plus,
  ExternalLink,
  ChevronRight,
  Globe,
  Ghost,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { SUPPORTED_COUNTRIES } from '../../data/countries';
import { maskPhoneNumber } from '../../utils/numberGenerator';
import { formatLastSeen } from '../../utils/formatters';
import { User } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface ContactsViewProps {
  onOpenNewGroupModal?: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ onOpenNewGroupModal }) => {
  const {
    users,
    currentUser,
    startDirectChat,
    startCall,
    receiveIncomingCall,
    addNewContactByNumber,
    searchUsers,
    toggleContact,
    addToast,
    setActiveTab,
    statuses,
    isUserGhosted,
    toggleGhostUser,
    t,
  } = useChatTime();

  // Search filter for existing saved contacts
  const [searchQuery, setSearchQuery] = useState('');
  // Filter tabs: all saved contacts vs online saved contacts
  const [activeFilter, setActiveFilter] = useState<'all' | 'online'>('all');

  // WhatsApp-style "New Contact" Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    SUPPORTED_COUNTRIES.find((c) => c.iso === 'US') || SUPPORTED_COUNTRIES[0]
  );
  const [contactNameInput, setContactNameInput] = useState('');
  const [contactIdentifierInput, setContactIdentifierInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMatch, setLookupMatch] = useState<User | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Inspected Contact Panel (opens ONLY when user clicks a contact's info/view button, NEVER defaults to currentUser)
  const [inspectedContact, setInspectedContact] = useState<User | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Current user's saved contacts (strict privacy: only users explicitly added to currentUser.contacts)
  const savedContactIds = currentUser.contacts || [];
  const myContactsList: User[] = (Object.values(users) as User[]).filter(
    (u) => u && u.id !== currentUser.id && savedContactIds.includes(u.id)
  );

  // When searching, allow searching through all active registered accounts on ChatTime (including self)
  const baseList: User[] = useMemo(() => {
    if (!searchQuery.trim()) {
      return myContactsList;
    }
    const all = Object.values(users) as User[];
    return all.filter((u) => Boolean(u && u.id));
  }, [searchQuery, myContactsList, users]);

  // Filter contacts by search query & online state
  const filteredContacts = baseList
    .filter((u) => {
      if (activeFilter === 'online' && !u.isOnline) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const numDigits = q.replace(/[^0-9]/g, '');
      const userDigits = (u.phoneNumber || u.chatTimeNumber || '').replace(/[^0-9]/g, '');

      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q.replace(/^@/, '')) ||
        (u.phoneNumber || u.chatTimeNumber || '').toLowerCase().includes(q) ||
        (numDigits.length >= 2 && (userDigits.includes(numDigits) || numDigits.includes(userDigits))) ||
        (u.statusFeeling && u.statusFeeling.toLowerCase().includes(q)) ||
        (u.bio && u.bio.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Group contacts alphabetically (A-Z) like WhatsApp
  const groupedContacts = filteredContacts.reduce<Record<string, User[]>>((acc, contact) => {
    const firstChar = contact.name.trim().charAt(0).toUpperCase();
    const groupKey = /^[A-Z]$/.test(firstChar) ? firstChar : '#';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(contact);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedContacts).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  // Live lookup in New Contact Modal when user types a number or username
  useEffect(() => {
    const raw = contactIdentifierInput.trim();
    const cleanDigits = raw.replace(/[^0-9]/g, '');
    const isUsername = raw.startsWith('@') || /^[a-zA-Z]/.test(raw);
    const cleanUsername = raw.replace(/^@/, '').trim();

    // Require complete contact information: at least 2 chars for username, or 3+ digits for phone
    const isComplete = isUsername ? cleanUsername.length >= 2 : cleanDigits.length >= 3;

    if (!raw) {
      setLookupMatch(null);
      setLookupError(null);
      setIsLookingUp(false);
      return;
    }

    if (!isComplete) {
      setLookupMatch(null);
      setLookupError(
        isUsername
          ? 'Enter username (at least 2 characters)'
          : 'Enter phone number (at least 3 digits)'
      );
      setIsLookingUp(false);
      return;
    }

    setIsLookingUp(true);
    setLookupError(null);

    const timer = setTimeout(async () => {
      try {
        // Build candidate search queries: raw input, and with selected country code
        const withCountry = selectedCountry.code ? `${selectedCountry.code} ${raw}` : raw;

        const results = await searchUsers(raw);
        let match = results[0];

        if (!match && cleanDigits) {
          const countryResults = await searchUsers(withCountry);
          match = countryResults[0];
        }

        if (match) {
          setLookupMatch(match);
          setLookupError(null);
          if (!contactNameInput.trim()) {
            setContactNameInput(match.name);
          }
        } else {
          setLookupMatch(null);
          setLookupError('No ChatTime user found matching this exact contact information.');
        }
      } catch {
        setLookupError('Could not verify contact on network.');
      } finally {
        setIsLookingUp(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [contactIdentifierInput, selectedCountry, searchUsers, currentUser.id, contactNameInput]);

  const handleOpenAddModal = (initialQuery?: string) => {
    setContactNameInput('');
    setContactIdentifierInput(initialQuery || '');
    setLookupMatch(null);
    setLookupError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveContact = async (startChatAfter: boolean = false) => {
    if (!contactIdentifierInput.trim() && !lookupMatch) {
      addToast('Input Required', 'Please enter a ChatTime phone number or @username.', 'warning');
      return;
    }

    let targetUser = lookupMatch;
    if (!targetUser) {
      targetUser = await addNewContactByNumber(contactIdentifierInput.trim());
    }

    if (targetUser) {
      if (!savedContactIds.includes(targetUser.id)) {
        toggleContact(targetUser.id);
      }
      addToast(
        'Contact Saved',
        `${targetUser.name} (${targetUser.chatTimeNumber}) was saved to your contacts.`,
        'success'
      );
      setIsAddModalOpen(false);
      setContactNameInput('');
      setContactIdentifierInput('');
      setLookupMatch(null);

      if (startChatAfter) {
        startDirectChat(targetUser.id);
        setActiveTab('chats');
      } else {
        setInspectedContact(targetUser);
      }
    } else {
      addToast(
        'User Not Found',
        'Could not find a registered user matching that number or username.',
        'warning'
      );
    }
  };

  const handleStartChatWith = (userId: string) => {
    startDirectChat(userId);
    setActiveTab('chats');
  };

  const handleDirectCall = (userId: string, type: 'voice' | 'video') => {
    startDirectChat(userId);
    startCall(userId, type);
  };

  const handleRemoveContact = (contact: User) => {
    if (confirm(`Remove ${contact.name} from your saved contacts?`)) {
      toggleContact(contact.id);
      if (inspectedContact?.id === contact.id) {
        setInspectedContact(null);
      }
      addToast('Contact Removed', `${contact.name} was removed from your contacts.`, 'info');
    }
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    addToast('Copied', `${num} copied to clipboard.`, 'info');
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const canViewPhone = (u: User) => {
    if (u.phonePrivate) return false;
    const vis = u.privacySettings?.numberVisibility || 'everyone';
    const isSaved = savedContactIds.includes(u.id);
    return vis === 'everyone' || (vis === 'contacts' && isSaved);
  };

  return (
    <div className="flex-1 flex h-full bg-slate-950 overflow-hidden relative">
      {/* Main Contacts List Container (WhatsApp Styled) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-800/80">
        {/* WhatsApp Top Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              {t('contacts', 'Contacts')}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {myContactsList.length} {myContactsList.length === 1 ? 'contact' : 'contacts'} in your address book
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('newContact', 'New Contact')}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 sm:px-6 border-b border-slate-800/60 bg-slate-950/70 space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search', 'Search saved contacts by name, @username, or number...')}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('all', 'All')} ({myContactsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('online')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeFilter === 'online'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('online', 'Online')} ({myContactsList.filter((u) => u.isOnline).length})
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Private Address Book • WhatsApp Styled
            </span>
          </div>
        </div>

        {/* Contacts Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* WhatsApp Action List Items (Always at the top) */}
          <div className="p-2 sm:px-4 space-y-1 border-b border-slate-800/60">
            {/* New Contact Action Row */}
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="w-full p-2.5 rounded-2xl hover:bg-slate-900/90 flex items-center justify-between text-left transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors shadow-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                    New contact
                  </div>
                  <div className="text-xs text-slate-400">
                    Add someone via ChatTime phone number or @username
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
            </button>

            {/* New Group Action Row */}
            {onOpenNewGroupModal && (
              <button
                type="button"
                onClick={onOpenNewGroupModal}
                className="w-full p-2.5 rounded-2xl hover:bg-slate-900/90 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      New group
                    </div>
                    <div className="text-xs text-slate-400">
                      Create an encrypted group conversation
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>
            )}
          </div>

          {/* Section: Contacts List on ChatTime */}
          {myContactsList.length === 0 ? (
            /* Clean WhatsApp-Style Empty State */
            <div className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 mx-auto shadow-inner">
                <UserPlus className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No contacts yet</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Your address book is private. Other users are hidden until you search and add their ChatTime phone number or @username.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Your First Contact</span>
              </button>
            </div>
          ) : filteredContacts.length === 0 ? (
            /* Search query returned no matches */
            <div className="py-12 px-6 text-center max-w-md mx-auto space-y-3">
              <p className="text-sm text-slate-300 font-semibold">
                No saved contact matches "{searchQuery}"
              </p>
              <p className="text-xs text-slate-500">
                Want to search all of ChatTime and add them to your contacts?
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddModal(searchQuery)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Search & Add "{searchQuery}"</span>
              </button>
            </div>
          ) : (
            /* Alphabetical Grouped Contacts List */
            <div className="p-2 sm:px-4 pb-20 space-y-4">
              <div className="px-2 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Contacts on ChatTime ({filteredContacts.length})
              </div>

              {sortedGroupKeys.map((letter) => (
                <div key={letter} className="space-y-1">
                  <div className="px-3 py-1 text-xs font-bold text-teal-400/90 font-mono">
                    {letter}
                  </div>

                  <div className="space-y-1">
                    {groupedContacts[letter].map((person) => {
                      const isInspected = inspectedContact?.id === person.id;
                      const rawPhone = person.phoneNumber || person.chatTimeNumber;
                      const showPhone = canViewPhone(person)
                        ? rawPhone
                        : maskPhoneNumber(rawPhone);
                      const personHasStatus = Boolean(
                        statuses.some((s) => s.userId === person.id && s.expiresAt > Date.now())
                      );

                      return (
                        <div
                          key={person.id}
                          onClick={() => setInspectedContact(person)}
                          className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer border ${
                            isInspected
                              ? 'bg-slate-900 border-teal-500/40'
                              : 'bg-slate-900/40 hover:bg-slate-900/80 border-transparent hover:border-slate-800/80'
                          }`}
                        >
                          {/* Avatar & Contact Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="relative shrink-0"
                              onClick={(e) => {
                                if (personHasStatus) {
                                  e.stopPropagation();
                                  setActiveTab('status');
                                }
                              }}
                              title={personHasStatus ? `${person.name} has a 24h Status` : person.name}
                            >
                              <img
                                src={person.avatar}
                                alt={person.name}
                                className={`w-12 h-12 rounded-full object-cover bg-slate-800 transition-all ${
                                  personHasStatus
                                    ? 'p-0.5 ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 border-transparent hover:scale-105'
                                    : 'border border-slate-700/80'
                                }`}
                              />
                              <span
                                className={`w-3.5 h-3.5 rounded-full border-2 border-slate-950 absolute bottom-0 right-0 ${
                                  person.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                                }`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold text-white truncate">
                                  {person.name}
                                </span>
                                <VerifiedBadge user={person} size="xs" />
                                {person.id === currentUser.id && (
                                  <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                                    You
                                  </span>
                                )}
                                {isUserGhosted(person.id) && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                                    <Ghost className="w-3 h-3 text-rose-400" />
                                    Ghosted
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-300 truncate mt-0.5">
                                {person.statusFeeling || person.bio || 'Available on ChatTime'}
                              </p>

                              <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                                @{person.username} • {showPhone}
                              </p>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleStartChatWith(person.id)}
                              className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all active:scale-95 shadow-sm"
                              title={`Chat with ${person.name}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDirectCall(person.id, 'voice')}
                              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 transition-colors"
                              title="Audio Call"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDirectCall(person.id, 'video')}
                              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 transition-colors"
                              title="Video Call"
                            >
                              <Video className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInspectedContact(person)}
                              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="View Contact Info"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp Floating Action Button (FAB) at bottom-right */}
        <button
          type="button"
          onClick={() => handleOpenAddModal()}
          className="fixed bottom-20 md:bottom-8 right-6 z-30 w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-2xl shadow-teal-500/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="New Contact"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </div>

      {/* Right Side: Contact Info Drawer (ONLY shown when user explicitly selects a contact, NEVER shows currentUser) */}
      {inspectedContact && (
        <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="space-y-5">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Contact Info
              </span>
              <button
                type="button"
                onClick={() => setInspectedContact(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar & Names */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800/80 flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <img
                  src={inspectedContact.avatar}
                  alt={inspectedContact.name}
                  className="w-24 h-24 rounded-full object-cover bg-slate-800 border-2 border-teal-500/40 shadow-xl"
                />
                <span
                  className={`w-4 h-4 rounded-full border-2 border-slate-950 absolute bottom-1 right-1 ${
                    inspectedContact.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
                  {inspectedContact.name}
                  <VerifiedBadge user={inspectedContact} size="sm" />
                </h2>
                <p className="text-xs text-teal-400 font-mono mt-0.5">
                  @{inspectedContact.username}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {inspectedContact.isOnline
                    ? 'Online now'
                    : formatLastSeen(inspectedContact.lastSeen)}
                </p>
              </div>

              {inspectedContact.statusFeeling && (
                <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>{inspectedContact.statusFeeling}</span>
                </div>
              )}
            </div>

            {/* Quick Actions (WhatsApp Style: Chat, Voice, Video) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStartChatWith(inspectedContact.id)}
                className="py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex flex-col items-center gap-1 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message</span>
              </button>
              <button
                type="button"
                onClick={() => handleDirectCall(inspectedContact.id, 'voice')}
                className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex flex-col items-center gap-1 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Audio</span>
              </button>
              <button
                type="button"
                onClick={() => handleDirectCall(inspectedContact.id, 'video')}
                className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs flex flex-col items-center gap-1 transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>
            </div>

            {/* Phone Number with Copy Button */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-teal-400" /> Phone Number
                </span>
                {!canViewPhone(inspectedContact) && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 font-bold">
                    <Lock className="w-3 h-3" /> Masked
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                <span className="text-xs font-mono font-bold text-white">
                  {canViewPhone(inspectedContact)
                    ? inspectedContact.phoneNumber || inspectedContact.chatTimeNumber
                    : maskPhoneNumber(
                        inspectedContact.phoneNumber || inspectedContact.chatTimeNumber
                      )}
                </span>
                {canViewPhone(inspectedContact) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyNumber(
                        inspectedContact.phoneNumber || inspectedContact.chatTimeNumber
                      )
                    }
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Copy number"
                  >
                    {copiedNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Bio & Region */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">About / Status</span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {inspectedContact.bio || 'Available on ChatTime'}
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Country:</span>
                <span className="font-semibold text-white">
                  {inspectedContact.countryName} ({inspectedContact.countryCode})
                </span>
              </div>
            </div>
          </div>

          {/* Ghost / Block & Remove Contact Actions at Bottom */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={() => toggleGhostUser(inspectedContact.id)}
              className={`w-full py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                isUserGhosted(inspectedContact.id)
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <Ghost className="w-4 h-4 text-rose-400" />
              <span>
                {isUserGhosted(inspectedContact.id)
                  ? 'Unghost (Unblock) Contact'
                  : 'Ghost (Block) Contact'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRemoveContact(inspectedContact)}
              className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserMinus className="w-4 h-4" />
              <span>Remove from Contacts</span>
            </button>
          </div>
        </aside>
      )}

      {/* ============================================================== */}
      {/* WhatsApp-Style "New Contact" Modal Dialog */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">New Contact</h3>
                  <p className="text-[11px] text-slate-400">Save to your ChatTime contacts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveContact(false);
              }}
              className="space-y-4"
            >
              {/* Country Picker for Phone Code */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-400" /> Country / Region
                </label>
                <select
                  value={selectedCountry.iso}
                  onChange={(e) => {
                    const found = SUPPORTED_COUNTRIES.find((c) => c.iso === e.target.value);
                    if (found) setSelectedCountry(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {SUPPORTED_COUNTRIES.map((country) => (
                    <option key={`${country.iso}-${country.code}`} value={country.iso}>
                      {country.flag} {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* ChatTime Phone Number or @Username */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  ChatTime Phone Number or @Username *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={contactIdentifierInput}
                    onChange={(e) => setContactIdentifierInput(e.target.value)}
                    placeholder={`e.g. ${selectedCountry.code} 415... or @username`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                    autoFocus
                  />
                  {isLookingUp && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-teal-400 animate-pulse font-sans">
                      Checking...
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Name (Optional / Auto-filled) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Contact Name (Nickname)
                </label>
                <input
                  type="text"
                  value={contactNameInput}
                  onChange={(e) => setContactNameInput(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Live Lookup Match Card */}
              {lookupMatch ? (
                <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={lookupMatch.avatar}
                      alt={lookupMatch.name}
                      className="w-10 h-10 rounded-full object-cover bg-slate-800 border border-teal-500/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1 truncate">
                        {lookupMatch.name}
                        <Check className="w-3.5 h-3.5 text-teal-400" />
                      </div>
                      <div className="text-[11px] text-teal-300 font-mono truncate">
                        @{lookupMatch.username} • {lookupMatch.phoneNumber || lookupMatch.chatTimeNumber}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold shrink-0">
                    Found
                  </span>
                </div>
              ) : lookupError ? (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {lookupError}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                  Enter their ChatTime number or @username. ChatTime will verify they exist so you can instantly call and message securely.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!lookupMatch && !contactIdentifierInput.trim()}
                  onClick={() => handleSaveContact(true)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-teal-300 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Save & Chat</span>
                </button>
                <button
                  type="submit"
                  disabled={!lookupMatch && !contactIdentifierInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Save Contact</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
