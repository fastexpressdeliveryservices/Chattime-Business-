import React, { useState, useMemo } from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Trash2,
  Delete,
  Hash,
  Users,
  BellRing,
  Globe,
  Search,
  ChevronDown,
  Plus,
  X,
  Check,
  UserPlus,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { COUNTRIES } from '../../data/countries';
import { formatTime, formatCallDuration } from '../../utils/formatters';
import { User } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';

export const CallsView: React.FC = () => {
  const {
    calls,
    startCall,
    clearCallHistory,
    receiveIncomingCall,
    users,
    currentUser,
    startDirectChat,
    addNewContactByNumber,
    setInspectedUserId,
    addToast,
    toggleContact,
    t,
  } = useChatTime();

  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [showDialer, setShowDialer] = useState(false);
  const [dialCountryCode, setDialCountryCode] = useState<string>('');
  const [dialCountryFlag, setDialCountryFlag] = useState<string>('');
  const [dialCountryName, setDialCountryName] = useState<string>('');
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [customList, setCustomList] = useState<{ name: string; code: string; flag: string }[]>([]);
  const [customInputName, setCustomInputName] = useState('');
  const [customInputCode, setCustomInputCode] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [dialNumber, setDialNumber] = useState('');

  const dialMatchingUsers = useMemo(() => {
    const raw = dialNumber.trim();
    if (!raw || raw.length < 2) return [];
    const digits = raw.replace(/[^0-9]/g, '');
    const cleanRaw = raw.toLowerCase().replace(/^@/, '');

    const candidates = Object.values(users) as User[];
    return candidates.filter((u) => {
      if (!u) return false;
      const uCt = (u.chatTimeNumber || '').replace(/[^0-9]/g, '');
      const uPh = (u.phoneNumber || '').replace(/[^0-9]/g, '');
      const uName = (u.name || '').toLowerCase();
      const uUser = (u.username || '').toLowerCase();

      if (digits.length >= 2 && (uCt.includes(digits) || uPh.includes(digits) || digits.includes(uCt) || digits.includes(uPh))) {
        return true;
      }
      if (cleanRaw.length >= 2 && (uUser.includes(cleanRaw) || uName.includes(cleanRaw))) {
        return true;
      }
      return false;
    });
  }, [dialNumber, users]);

  const myCalls = calls.filter(
    (c) => !c.callerId || c.callerId === currentUser.id || c.receiverId === currentUser.id
  );

  const filteredCalls = myCalls.filter((c) => {
    if (filter === 'missed') return c.status === 'missed';
    return true;
  });

  const handleDialDigit = (digit: string) => {
    if (dialNumber.length < 15) {
      setDialNumber((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const handleStartDialedCall = async (type: 'voice' | 'video') => {
    if (!dialNumber.trim()) {
      addToast('Enter Number', 'Please enter a phone number or ChatTime number to dial.', 'warning');
      return;
    }
    const trimmedInput = dialNumber.trim();
    const fullNumber = trimmedInput.startsWith('+')
      ? trimmedInput
      : dialCountryCode
      ? `${dialCountryCode} ${trimmedInput}`
      : trimmedInput;
    const cleanFull = fullNumber.replace(/[\s\-()]/g, '');
    const cleanInput = dialNumber.trim().replace(/[\s\-()]/g, '');

    let matchedUser = (Object.values(users) as User[]).find((u) => {
      const uCt = (u.chatTimeNumber || '').replace(/[\s\-()]/g, '');
      const uPh = (u.phoneNumber || '').replace(/[\s\-()]/g, '');
      const uCtDigits = (u.chatTimeNumber || '').replace(/[^0-9]/g, '');
      const uPhDigits = (u.phoneNumber || '').replace(/[^0-9]/g, '');
      return (
        uCt === cleanFull ||
        uPh === cleanFull ||
        (cleanInput.length >= 3 && (uCtDigits.includes(cleanInput) || uPhDigits.includes(cleanInput) || cleanInput.includes(uCtDigits)))
      );
    });

    if (!matchedUser) {
      matchedUser = (await addNewContactByNumber(fullNumber)) || (await addNewContactByNumber(dialNumber.trim())) || undefined;
    }

    if (matchedUser) {
      startDirectChat(matchedUser.id);
      startCall(matchedUser.id, type);
    } else {
      addToast(
        'User Not Found',
        `No registered ChatTime user found with number ${fullNumber}.`,
        'warning'
      );
    }
  };

  const handleCallUserDirect = (userId: string, type: 'voice' | 'video') => {
    startDirectChat(userId);
    startCall(userId, type);
  };

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden select-none">
      {/* Left / Main: Calls Log & Quick Call Contacts */}
      <div className="flex-1 h-full flex flex-col border-r border-slate-800/80 bg-slate-900/40 overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-display">{t('calls', 'Calls')}</h2>
            <p className="text-xs text-slate-400">
              End-to-end encrypted voice & video calling
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowDialer(!showDialer)}
              className={`md:hidden px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showDialer
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>{showDialer ? 'Call History' : 'Keypad'}</span>
            </button>

            {calls.length > 0 && (
              <button
                onClick={clearCallHistory}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                title={t('clearChat', 'Clear Call History')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-900/80 border-b border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-teal-500/20 text-teal-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('all', 'All')} ({calls.length})
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'missed'
                ? 'bg-rose-500/20 text-rose-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('missed', 'Missed')} ({calls.filter((c) => c.status === 'missed').length})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Call History List */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('recentCalls', 'Recent Calls')}
            </h3>

            {filteredCalls.length === 0 ? (
              <div className="p-10 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center text-slate-500 text-xs space-y-2">
                <Phone className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p className="text-sm font-semibold text-slate-300">{t('noCallRecords', 'No call records yet')}</p>
                <p className="text-xs text-slate-500">
                  {t('startCallPrompt', 'Start an encrypted voice or video call using the dialer or contact list above.')}
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl divide-y divide-slate-800/60 overflow-hidden">
                {filteredCalls.map((call) => {
                  const isMissed = call.status === 'missed';
                  const isIncoming = call.direction === 'incoming';

                  const otherUserId = call.callerId === currentUser.id ? call.receiverId : call.callerId;
                  const otherUser = otherUserId ? users[otherUserId] : null;
                  const isContact = otherUserId ? Boolean(currentUser.contacts?.includes(otherUserId)) : false;
                  const isSelf = otherUserId === currentUser.id;

                  const rawNumber = otherUser?.phoneNumber || otherUser?.chatTimeNumber || call.callerNumber || '';
                  const displayName = isContact || isSelf
                    ? (otherUser?.name || call.callerName)
                    : (rawNumber || call.callerName);

                  return (
                    <div
                      key={call.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                    >
                      <div
                        onClick={() => {
                          if (call.callerId && users[call.callerId]) {
                            setInspectedUserId(call.callerId);
                          }
                        }}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <img
                          src={call.callerAvatar}
                          alt={displayName}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-800"
                          referrerPolicy="no-referrer"
                        />

                        <div>
                          <div className="flex items-center gap-1.5">
                            <div className="text-sm font-semibold text-slate-100 font-display hover:text-teal-400">
                              {displayName}
                            </div>
                            {otherUser && <VerifiedBadge user={otherUser} size="xs" />}
                            {!isContact && otherUserId && !isSelf && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleContact(otherUserId);
                                }}
                                className="px-2 py-0.5 rounded-full bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Save Number to Contacts"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>+ Save</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs mt-0.5">
                            {isMissed ? (
                              <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />
                            ) : isIncoming ? (
                              <PhoneIncoming className="w-3.5 h-3.5 text-teal-400" />
                            ) : (
                              <PhoneOutgoing className="w-3.5 h-3.5 text-sky-400" />
                            )}

                            <span
                              className={isMissed ? 'text-rose-400 font-medium' : 'text-slate-400'}
                            >
                              {isMissed ? 'Missed' : isIncoming ? 'Incoming' : 'Outgoing'}{' '}
                              {call.type === 'video' ? 'Video Call' : 'Voice Call'}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {formatTime(call.startedAt)}
                            </span>
                            {call.duration && call.duration > 0 ? (
                              <>
                                <span className="text-slate-600">·</span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  {formatCallDuration(call.duration)}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Re-dial Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startCall(call.chatId, 'voice')}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 transition-colors"
                          title="Redial Voice"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startCall(call.chatId, 'video')}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 transition-colors"
                          title="Redial Video"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right / Panel: International Touch Dial Pad */}
      <div
        className={`${
          showDialer ? 'flex' : 'hidden md:flex'
        } w-full md:w-80 lg:w-96 flex-col p-6 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 items-center justify-between shrink-0`}
      >
        <div className="w-full text-center">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
            ChatTime International Dialer
          </h3>

          {/* Country Selector & Number Display */}
          <div className="relative mb-6">
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 focus-within:border-teal-500/80 transition-colors">
              <button
                type="button"
                onClick={() => setIsCountryModalOpen(!isCountryModalOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-xs font-bold text-teal-300 transition-all cursor-pointer shrink-0 active:scale-95"
                title="Select Country or Add Others"
              >
                {dialCountryCode ? (
                  <>
                    <span>{dialCountryFlag || '🌍'}</span>
                    <span className="font-mono">{dialCountryCode}</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-teal-400" />
                    <span>Select</span>
                  </>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {dialCountryCode && (
                <button
                  type="button"
                  onClick={() => {
                    setDialCountryCode('');
                    setDialCountryFlag('');
                    setDialCountryName('');
                  }}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-900"
                  title="Remove Country Code (Dial Raw Number)"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              <input
                type="text"
                value={dialNumber}
                onChange={(e) =>
                  setDialNumber(e.target.value.replace(/[^0-9\s\-()+*#]/g, '').slice(0, 20))
                }
                placeholder={dialCountryCode ? 'Enter phone number...' : 'Dial number or +code...'}
                className="flex-1 bg-transparent text-base font-mono font-bold text-slate-100 tracking-wider focus:outline-none placeholder-slate-600 min-w-0"
              />
              {dialNumber.length > 0 && (
                <button
                  onClick={handleBackspace}
                  className="text-slate-400 hover:text-slate-100 p-1 shrink-0"
                  title="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Country Selector Modal / Popover */}
            {isCountryModalOpen && (
              <div className="absolute top-14 left-0 right-0 z-50 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 max-h-80 flex flex-col text-left animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-teal-400" />
                    Select Country / Add Others
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCountryModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country or code..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-44">
                  <button
                    type="button"
                    onClick={() => {
                      setDialCountryCode('');
                      setDialCountryFlag('');
                      setDialCountryName('');
                      setIsCountryModalOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between hover:bg-slate-800 text-slate-300"
                  >
                    <span className="flex items-center gap-2">
                      <span>🌐</span>
                      <span className="font-semibold">Direct Dial (No Prefix)</span>
                    </span>
                    {!dialCountryCode && <Check className="w-3.5 h-3.5 text-teal-400" />}
                  </button>

                  {[...customList, ...COUNTRIES]
                    .filter((c) => {
                      if (!countrySearch.trim()) return true;
                      const q = countrySearch.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(q) ||
                        c.code.toLowerCase().includes(q)
                      );
                    })
                    .map((c, i) => (
                      <button
                        key={`${c.name}-${c.code}-${i}`}
                        type="button"
                        onClick={() => {
                          setDialCountryCode(c.code);
                          setDialCountryFlag(c.flag);
                          setDialCountryName(c.name);
                          setIsCountryModalOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          dialCountryCode === c.code
                            ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span>{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="font-mono text-[11px] text-teal-400 font-semibold shrink-0 ml-2">
                          {c.code}
                        </span>
                      </button>
                    ))}
                </div>

                {/* Add Custom / Other Country Section */}
                <div className="mt-2 pt-2 border-t border-slate-800">
                  {showAddCustom ? (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-teal-300">Add Other Country Code</div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customInputName}
                          onChange={(e) => setCustomInputName(e.target.value)}
                          placeholder="Country / Region Name"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-teal-500"
                        />
                        <input
                          type="text"
                          value={customInputCode}
                          onChange={(e) => setCustomInputCode(e.target.value)}
                          placeholder="+Code (e.g. +999)"
                          className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-teal-500 font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowAddCustom(false)}
                          className="px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!customInputCode.trim()) return;
                            const code = customInputCode.trim().startsWith('+')
                              ? customInputCode.trim()
                              : `+${customInputCode.trim()}`;
                            const name = customInputName.trim() || 'Custom';
                            const newCustom = { name, code, flag: '📍' };
                            setCustomList((prev) => [newCustom, ...prev]);
                            setDialCountryCode(code);
                            setDialCountryFlag('📍');
                            setDialCountryName(name);
                            setShowAddCustom(false);
                            setIsCountryModalOpen(false);
                            setCustomInputName('');
                            setCustomInputCode('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-[10px] font-bold"
                        >
                          Add & Select
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(true)}
                      className="w-full py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-[11px] font-semibold text-teal-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Other Country Code</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Matching Registered Users Preview Card When Dialing */}
          {dialMatchingUsers.length > 0 && (
            <div className="mb-3 max-w-[280px] sm:max-w-xs mx-auto w-full p-2.5 rounded-2xl bg-slate-900 border border-teal-500/40 text-left space-y-2 max-h-44 overflow-y-auto shadow-lg animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[10px] font-bold text-teal-400 uppercase tracking-wider px-1">
                <span>Matching Users ({dialMatchingUsers.length})</span>
                <span className="text-[9px] text-slate-400">Live Dial Result</span>
              </div>
              <div className="space-y-1.5">
                {dialMatchingUsers.map((u: User) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition-colors"
                    >
                      <div
                        onClick={() => setInspectedUserId(u.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                        title="View profile"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={u.avatar || '/icon.svg'}
                            alt={u.name}
                            className="w-8 h-8 rounded-xl object-cover bg-slate-800 border border-slate-700"
                          />
                          {u.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-950" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white truncate">{u.name}</span>
                            <VerifiedBadge user={u} size="xs" />
                            {isCurrent && (
                              <span className="px-1 py-0.2 rounded bg-teal-500/20 text-teal-300 text-[9px] font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-teal-400 font-mono truncate">
                            {u.chatTimeNumber || u.phoneNumber}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setInspectedUserId(u.id)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCallUserDirect(u.id, 'voice')}
                          className="p-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold cursor-pointer transition-transform active:scale-95"
                          title="Call this user"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keypad Grid (3x4) */}
          <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
            {[
              { d: '1', sub: ' ' },
              { d: '2', sub: 'ABC' },
              { d: '3', sub: 'DEF' },
              { d: '4', sub: 'GHI' },
              { d: '5', sub: 'JKL' },
              { d: '6', sub: 'MNO' },
              { d: '7', sub: 'PQRS' },
              { d: '8', sub: 'TUV' },
              { d: '9', sub: 'WXYZ' },
              { d: '*', sub: ' ' },
              { d: '0', sub: '+' },
              { d: '#', sub: ' ' },
            ].map((btn) => (
              <button
                key={btn.d}
                onClick={() => handleDialDigit(btn.d)}
                className="h-14 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 flex flex-col items-center justify-center active:scale-95 transition-all"
              >
                <span className="text-lg font-bold text-slate-100 leading-none">{btn.d}</span>
                <span className="text-[9px] font-mono text-slate-500 mt-0.5">{btn.sub}</span>
              </button>
            ))}
          </div>

          {/* Call CTAs */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => handleStartDialedCall('voice')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Voice Call</span>
            </button>
            <button
              onClick={() => handleStartDialedCall('video')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Video Call</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 text-center font-mono mt-4">
          Dial any registered phone number or ChatTime ID
        </div>
      </div>
    </div>
  );
};
