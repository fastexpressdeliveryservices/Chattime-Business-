import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Phone,
  PhoneIncoming,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  MapPin,
  FileText,
  UserCheck,
  BarChart2,
  Image as ImageIcon,
  Pin,
  Check,
  CheckCheck,
  Play,
  Pause,
  X,
  Reply,
  Edit2,
  Trash2,
  Share2,
  ExternalLink,
  ArrowLeft,
  Info,
  Eraser,
  User as UserIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Flame,
  Ghost,
  Copy,
  Download,
  BadgeCheck,
  Sparkles,
  ChevronDown,
  Megaphone,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { Message, LocationData, PollData, User } from '../../types';
import {
  formatTime,
  formatMessageDate,
  formatAudioDuration,
  formatLastSeen,
  isValidTimestamp,
} from '../../utils/formatters';
import { maskPhoneNumber } from '../../utils/numberGenerator';
import { InteractiveMapModal } from '../map/InteractiveMapModal';
import { MediaDrawer } from './MediaDrawer';
import { MessageStatusTicks } from './MessageStatusTicks';
import { BrandLogo } from '../common/BrandLogo';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { RichMessageContent } from './RichMessageContent';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
const REACTION_BAR_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];
const EMOJI_PALETTE = [
  '😀', '😂', '🥹', '😍', '🤩', '😎', '🥳', '🤔',
  '👍', '🙌', '👏', '🔥', '✨', '❤️', '💯', '🚀',
  '🎉', '⚡', '💎', '🌍', '☕', '🍕', '🎵', '📸',
];

export const ChatWindow: React.FC = () => {
  const {
    activeChatId,
    setActiveChatId,
    chats,
    messages,
    currentUser,
    users,
    sendMessage,
    editMessage,
    deleteMessage,
    forwardMessage,
    toggleReaction,
    togglePinMessage,
    votePoll,
    markViewOnceOpened,
    markChatRead,
    sendTypingSignal,
    sendRecordingSignal,
    startCall,
    receiveIncomingCall,
    startDirectChat,
    clearChatHistory,
    deleteChat,
    isInfoDrawerOpen,
    setIsInfoDrawerOpen,
    setInspectedUserId,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    toggleGhostUser,
    isUserGhosted,
    addToast,
    platformFeatures,
    openTTSModal,
    t,
  } = useChatTime();

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) || null,
    [chats, activeChatId]
  );

  const [inputText, setInputText] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);

  // Attachment & Picker Modals
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<LocationData | undefined>(
    undefined
  );
  const [isMapReadOnly, setIsMapReadOnly] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isContactShareModalOpen, setIsContactShareModalOpen] = useState(false);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollMultiple, setPollMultiple] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [activePlayingAudioId, setActivePlayingAudioId] = useState<string | null>(null);
  const [audioPlaybackElapsed, setAudioPlaybackElapsed] = useState<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [selectedVoiceModifier, setSelectedVoiceModifier] = useState<string>('Original 🎙️');
  const [isVoiceModifierPickerOpen, setIsVoiceModifierPickerOpen] = useState(false);

  // Lightbox for photos
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // View Once state
  const [isViewOnceMode, setIsViewOnceMode] = useState(false);
  const [viewingOnceMsg, setViewingOnceMsg] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Long-press and floating reaction picker state
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartCoordsRef = useRef<{ x: number; y: number } | null>(null);

  const handleBubbleTouchStart = (msgId: string, e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartCoordsRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore vibrate error
        }
      }
      setReactionPickerMsgId(msgId);
      setActiveMessageMenuId(null);
    }, 420);
  };

  const handleBubbleTouchMove = (e: React.TouchEvent) => {
    if (touchStartCoordsRef.current && e.touches.length > 0) {
      const dx = Math.abs(e.touches[0].clientX - touchStartCoordsRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartCoordsRef.current.y);
      if (dx > 8 || dy > 8) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }
  };

  const handleBubbleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleBubbleMouseDown = (msgId: string, e: React.MouseEvent) => {
    if (e.button === 0) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        setReactionPickerMsgId(msgId);
        setActiveMessageMenuId(null);
      }, 420);
    }
  };

  const handleBubbleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleBubbleContextMenu = (msgId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setReactionPickerMsgId(msgId);
    setActiveMessageMenuId(null);
  };

  const allChatMessages = useMemo(() => {
    if (!activeChat) return [];
    const list = messages[activeChat.id] || [];
    const map = new Map<string, Message>();
    list.forEach((m) => {
      if (!m || (m.deletedFor || []).includes(currentUser.id)) return;
      map.set(m.id, m);
    });
    return Array.from(map.values()).sort((a, b) => {
      const tA = isValidTimestamp(a.timestamp) ? Number(a.timestamp) : 0;
      const tB = isValidTimestamp(b.timestamp) ? Number(b.timestamp) : 0;
      return tA - tB;
    });
  }, [messages, activeChat, currentUser.id]);

  const chatMessages = useMemo(() => {
    if (!isSearchOpen || !inChatSearchQuery.trim()) return allChatMessages;
    const q = inChatSearchQuery.toLowerCase();
    return allChatMessages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.fileName?.toLowerCase().includes(q)
    );
  }, [allChatMessages, isSearchOpen, inChatSearchQuery]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (messagesContainerRef.current) {
      if (behavior === 'smooth') {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  };

  useEffect(() => {
    setInputText('');
    setIsSearchOpen(false);
    setInChatSearchQuery('');
    setIsHeaderMenuOpen(false);
    scrollToBottom('auto');
  }, [activeChat?.id]);

  useEffect(() => {
    if (editingMessage) {
      setInputText(editingMessage.content);
    }
  }, [editingMessage]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      scrollToBottom('auto');
    }
  }, [chatMessages.length]);

  // Mark incoming messages in this chat as read so both sender & recipient see double blue ticks immediately
  useEffect(() => {
    if (activeChat?.id) {
      const hasUnread = chatMessages.some(
        (m) => m.senderId !== currentUser.id && m.status !== 'read'
      );
      if (hasUnread || (activeChat.unreadCount && activeChat.unreadCount > 0)) {
        markChatRead(activeChat.id);
      }
    }
  }, [activeChat?.id, chatMessages, currentUser.id, markChatRead]);

  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [voicePlaybackSpeed, setVoicePlaybackSpeed] = useState<number>(1);

  const handleCycleVoiceSpeed = () => {
    const nextSpeed = voicePlaybackSpeed === 1 ? 1.5 : voicePlaybackSpeed === 1.5 ? 2 : 1;
    setVoicePlaybackSpeed(nextSpeed);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeekVoice = (e: React.MouseEvent<HTMLDivElement>, msgId: string, totalDur: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * totalDur;
    if (activePlayingAudioId === msgId && audioElementRef.current) {
      audioElementRef.current.currentTime = newTime;
    }
    setAudioPlaybackElapsed(Math.floor(newTime));
  };

  const handleToggleVoicePlay = (msgId: string) => {
    if (activePlayingAudioId === msgId) {
      if (isVoicePaused) {
        // Resume
        if (audioElementRef.current) {
          audioElementRef.current.playbackRate = voicePlaybackSpeed;
          audioElementRef.current.play().catch(() => {});
        }
        setIsVoicePaused(false);
      } else {
        // Pause
        if (audioElementRef.current) {
          audioElementRef.current.pause();
        }
        setIsVoicePaused(true);
      }
    } else {
      // Start fresh playback
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      setActivePlayingAudioId(msgId);
      setIsVoicePaused(false);
      setAudioPlaybackElapsed(0);
    }
  };

  // Voice playback progress timer & audio controller
  useEffect(() => {
    if (!activePlayingAudioId) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      setAudioPlaybackElapsed(0);
      setIsVoicePaused(false);
      return;
    }

    if (isVoicePaused) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      return;
    }

    const msg = allChatMessages.find((m) => m.id === activePlayingAudioId);
    const totalDur = msg?.audioDuration || 10;

    let audio = audioElementRef.current;
    if (!audio || audio.src !== (msg?.mediaUrl || '')) {
      if (audio) {
        audio.pause();
      }
      if (msg?.mediaUrl) {
        audio = new Audio(msg.mediaUrl);
        audioElementRef.current = audio;
      } else {
        audio = null;
        audioElementRef.current = null;
      }
    }

    if (audio) {
      audio.playbackRate = voicePlaybackSpeed;
      audio.play().catch(() => {});
      audio.ontimeupdate = () => {
        if (audio) {
          setAudioPlaybackElapsed(Math.floor(audio.currentTime));
        }
      };
      audio.onended = () => {
        setActivePlayingAudioId(null);
        setIsVoicePaused(false);
        setAudioPlaybackElapsed(0);
        audioElementRef.current = null;
      };
    } else {
      // Audio playback timer fallback for synthesized voice messages
      const interval = window.setInterval(() => {
        setAudioPlaybackElapsed((prev) => {
          if (prev + 1 >= totalDur) {
            setActivePlayingAudioId(null);
            setIsVoicePaused(false);
            return 0;
          }
          return prev + 1;
        });
      }, Math.round(1000 / (voicePlaybackSpeed || 1)));

      return () => {
        clearInterval(interval);
      };
    }
  }, [activePlayingAudioId, isVoicePaused, allChatMessages, voicePlaybackSpeed]);

  if (!activeChat) {
    return (
      <div className="flex-1 h-full bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none">
        <BrandLogo size="xl" showText subtitle="End-to-End Encrypted Global Platform" />
        <p className="text-xs text-slate-400 max-w-sm mt-4 leading-relaxed">
          Select a conversation on the left, start a 1-to-1 chat from Contacts, or join a
          Community to begin messaging and calling in real time.
        </p>
        <div className="mt-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Connected as <span className="font-mono text-teal-400">{currentUser.phoneNumber || currentUser.chatTimeNumber}</span>
        </div>
      </div>
    );
  }

  // Resolve peer user for 1-to-1 chats
  const peerUserId =
    activeChat.type === 'direct'
      ? activeChat.participants.find((id) => id !== currentUser.id) || activeChat.participants[0]
      : undefined;
  const peerUser = peerUserId ? users[peerUserId] : undefined;
  const isPeerBlockedByMe = Boolean(
    peerUserId &&
    ((currentUser.blockedUsers || []).includes(peerUserId) || isUserGhosted(peerUserId))
  );
  const amIBlockedByPeer = Boolean(
    peerUserId &&
    peerUser?.blockedUsers &&
    peerUser.blockedUsers.includes(currentUser.id)
  );
  const isPeerGhosted = isPeerBlockedByMe;

  const displayName = peerUser ? peerUser.name : activeChat.name;
  const displayAvatar = peerUser ? peerUser.avatar : activeChat.avatar;

  // Respect privacy settings for phone number & lastSeen
  const isContact = peerUser && (currentUser.contacts || []).includes(peerUser.id);
  const numberVis = peerUser?.privacySettings?.numberVisibility || 'everyone';
  const canSeePhone =
    peerUser &&
    !isPeerBlockedByMe &&
    !amIBlockedByPeer &&
    (currentUser.role === 'admin' ||
      (!peerUser.phonePrivate &&
        (numberVis === 'everyone' || (numberVis === 'contacts' && isContact))));
  const rawPhone = peerUser?.phoneNumber || peerUser?.chatTimeNumber || '';
  const peerPhone = peerUser
    ? canSeePhone
      ? rawPhone
      : maskPhoneNumber(rawPhone)
    : null;

  const lastSeenVis = peerUser?.privacySettings?.lastSeenVisibility || 'everyone';
  const canSeePresence =
    peerUser &&
    peerUser.id !== 'user_chattime_support' &&
    !isPeerBlockedByMe &&
    !amIBlockedByPeer &&
    (currentUser.role === 'admin' ||
      lastSeenVis === 'everyone' ||
      (lastSeenVis === 'contacts' && isContact));

  const shouldHideReadReceipts =
    activeChat.type === 'direct' &&
    (currentUser.privacySettings?.readReceipts === false ||
      peerUser?.privacySettings?.readReceipts === false);

  const pinnedMessage = activeChat.pinnedMessageId
    ? allChatMessages.find((m) => m.id === activeChat.pinnedMessageId)
    : allChatMessages.find((m) => m.isPinned);

  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!activeChat) return;
    sendTypingSignal(activeChat.id, val.trim().length > 0);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingSignal(activeChat.id, false);
    }, 2000);
  };

  const handleSendText = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    if (editingMessage) {
      editMessage(activeChat.id, editingMessage.id, inputText.trim());
      setInputText('');
      return;
    }

    sendTypingSignal(activeChat.id, false);
    sendMessage(
      activeChat.id,
      inputText.trim(),
      'text',
      isViewOnceMode ? { isViewOnce: true, viewedBy: [] } : undefined
    );
    setInputText('');
    setIsViewOnceMode(false);
    setIsEmojiPickerOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    const sendAsViewOnce = isViewOnceMode;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const isVideo = file.type.startsWith('video/');
        sendMessage(activeChat.id, file.name, isVideo ? 'video' : 'image', {
          mediaUrl: reader.result,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          ...(sendAsViewOnce ? { isViewOnce: true, viewedBy: [] } : {}),
        });
      }
    };
    reader.readAsDataURL(file);
    setIsViewOnceMode(false);
    setIsAttachMenuOpen(false);
    e.target.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    const sendAsViewOnce = isViewOnceMode;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        sendMessage(activeChat.id, file.name || 'Video Message', 'video', {
          mediaUrl: reader.result,
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          ...(sendAsViewOnce ? { isViewOnce: true, viewedBy: [] } : {}),
        });
      }
    };
    reader.readAsDataURL(file);
    setIsViewOnceMode(false);
    setIsAttachMenuOpen(false);
    e.target.value = '';
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    const reader = new FileReader();
    reader.onload = () => {
      sendMessage(activeChat.id, file.name, 'file', {
        mediaUrl: typeof reader.result === 'string' ? reader.result : undefined,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      });
    };
    reader.readAsDataURL(file);
    setIsAttachMenuOpen(false);
  };

  // Voice Note Recording with pause/resume and synthetic audio generator fallback
  const startVoiceRecording = async () => {
    if (activeChat) {
      sendRecordingSignal(activeChat.id, true);
    }
    setIsRecording(true);
    setIsRecordingPaused(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000,
          },
        });
        // Prioritize native Opus 128kbps codec for crystal-clear WhatsApp-quality audio
        const mimeType =
          typeof MediaRecorder !== 'undefined'
            ? MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : MediaRecorder.isTypeSupported('audio/mp4')
              ? 'audio/mp4'
              : MediaRecorder.isTypeSupported('audio/webm')
              ? 'audio/webm'
              : MediaRecorder.isTypeSupported('audio/ogg')
              ? 'audio/ogg'
              : ''
            : '';
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 })
          : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data);
        };
        // Clean 250ms audio chunk clustering prevents packet fragmentation and audio cracks
        recorder.start(250);
      } catch (err) {
        console.warn('[VoiceRecorder] Mic unavailable, using synthesized audio recorder fallback:', err);
      }
    }

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const togglePauseVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (isRecordingPaused) {
      // Resume
      if (recorder && recorder.state === 'paused') {
        recorder.resume();
      }
      setIsRecordingPaused(false);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      // Pause
      if (recorder && recorder.state === 'recording') {
        recorder.pause();
      }
      setIsRecordingPaused(true);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  /**
   * Generates a 24kHz 16-bit PCM WAV audio note with smooth envelopes to eliminate clicks/crackles
   */
  const createSynthesizedAudioDataUrl = (durationSeconds: number): string => {
    const sampleRate = 24000;
    const dur = Math.max(1, Math.min(15, durationSeconds));
    const numSamples = sampleRate * dur;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true);  // NumChannels (1 mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true);  // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample (16-bit)
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Smooth vocal harmonic frequencies with ramp envelope (zero clicks/pops)
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const f0 = 185 + Math.sin(t * 3.5) * 12;
      const envelope = Math.sin(Math.min(Math.PI, (i / numSamples) * Math.PI));
      const sample = (
        Math.sin(2 * Math.PI * f0 * t) * 0.5 +
        Math.sin(2 * Math.PI * (f0 * 2.8) * t) * 0.25
      ) * envelope * 0.6;
      const int16 = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(44 + i * 2, int16, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  };

  const finishVoiceRecording = (cancel = false) => {
    if (activeChat) {
      sendRecordingSignal(activeChat.id, false);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    const dur = Math.max(1, recordingSeconds);
    const sendAsViewOnce = isViewOnceMode;
    const modifierToApply =
      platformFeatures.voiceEffectsEnabled && selectedVoiceModifier !== 'Original 🎙️'
        ? selectedVoiceModifier
        : undefined;

    setIsRecording(false);
    setIsRecordingPaused(false);
    setIsVoiceModifierPickerOpen(false);
    setRecordingSeconds(0);
    setIsViewOnceMode(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((t) => t.stop());
        if (!cancel && activeChat) {
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, {
              type: recorder.mimeType || 'audio/webm',
            });
            const reader = new FileReader();
            reader.onloadend = () => {
              sendMessage(activeChat.id, 'Voice Message', 'voice', {
                audioDuration: dur,
                mediaUrl: typeof reader.result === 'string' ? reader.result : undefined,
                ...(modifierToApply ? { voiceModifier: modifierToApply } : {}),
                ...(sendAsViewOnce ? { isViewOnce: true, viewedBy: [] } : {}),
              });
            };
            reader.readAsDataURL(blob);
          } else {
            const synthUrl = createSynthesizedAudioDataUrl(dur);
            sendMessage(activeChat.id, 'Voice Message', 'voice', {
              audioDuration: dur,
              mediaUrl: synthUrl,
              ...(modifierToApply ? { voiceModifier: modifierToApply } : {}),
              ...(sendAsViewOnce ? { isViewOnce: true, viewedBy: [] } : {}),
            });
          }
        }
      };
      if (recorder.state === 'paused') {
        recorder.resume();
      }
      recorder.stop();
    } else if (!cancel && activeChat) {
      const synthUrl = createSynthesizedAudioDataUrl(dur);
      sendMessage(activeChat.id, 'Voice Message', 'voice', {
        audioDuration: dur,
        mediaUrl: synthUrl,
        ...(modifierToApply ? { voiceModifier: modifierToApply } : {}),
        ...(sendAsViewOnce ? { isViewOnce: true, viewedBy: [] } : {}),
      });
    }
  };

  const handleSendPoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim() || !activeChat) return;
    const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      addToast('Poll Options', 'Please provide at least 2 options.', 'warning');
      return;
    }
    const pollData: PollData = {
      question: pollQuestion.trim(),
      multiple: pollMultiple,
      options: validOptions.map((text, idx) => ({
        id: `opt_${idx}_${Date.now()}`,
        text,
        votes: [],
      })),
    };
    sendMessage(activeChat.id, `📊 Poll: ${pollData.question}`, 'poll', { pollData });
    setPollQuestion('');
    setPollOptions(['', '']);
    setIsPollModalOpen(false);
  };

  return (
    <div className="flex-1 flex h-full w-full max-w-full min-w-0 min-h-0 overflow-hidden bg-slate-950/60 backdrop-blur-sm relative">
      {/* Main Conversation Column */}
      <div className="flex-1 flex flex-col h-full w-full max-w-full min-w-0 min-h-0 overflow-hidden">
        {/* Top Conversation Header */}
        <header className="pt-[env(safe-area-inset-top,0px)] md:pt-0 min-h-[3.75rem] sm:h-16 px-2.5 sm:px-5 bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Mobile Back Button */}
            <button
              onClick={() => setActiveChatId(null)}
              className="md:hidden p-2 -ml-1 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Back to Chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Peer / Chat Avatar & Name (Click to view complete profile) */}
            <div
              onClick={() => {
                if (peerUser?.id) {
                  setInspectedUserId(peerUser.id);
                } else if (peerUserId) {
                  setInspectedUserId(peerUserId);
                } else {
                  setIsInfoDrawerOpen(!isInfoDrawerOpen);
                }
              }}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
            >
              <div className="relative shrink-0">
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover bg-slate-800 border border-slate-700 group-hover:border-teal-400 transition-colors"
                />
                {peerUser && canSeePresence && (
                  <span
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-slate-900 absolute -bottom-0.5 -right-0.5 ${
                      peerUser.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-teal-400 transition-colors">
                    {displayName}
                  </h3>
                  {peerUser?.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  )}
                  {isPeerGhosted && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <Ghost className="w-3 h-3 text-rose-400" />
                      Ghosted
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {activeChat.recordingUsers && activeChat.recordingUsers.length > 0 ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1 animate-pulse">
                      <Mic className="w-3 h-3 text-rose-400 animate-bounce" />
                      <span>{activeChat.recordingUsers.join(', ')} recording audio...</span>
                    </span>
                  ) : activeChat.typingUsers && activeChat.typingUsers.length > 0 ? (
                    <span className="text-teal-400 font-semibold flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping inline-block" />
                      <span>{activeChat.typingUsers.join(', ')} {t('typing', 'typing...')}</span>
                    </span>
                  ) : peerUser ? (
                    peerUser.id === 'user_chattime_support' ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <VerifiedBadge type="red" size="xs" />
                        Official 24/7 Support Desk • support@chattime.com
                      </span>
                    ) : (
                      <>
                        {peerUser.isOnline && canSeePresence && (
                          <span className="truncate text-emerald-400 font-medium">
                            {t('online', 'online')}
                          </span>
                        )}
                        {peerPhone && !peerUser.isOnline && (
                          <span className="hidden sm:inline font-mono text-slate-400">
                            {peerPhone}
                          </span>
                        )}
                      </>
                    )
                  ) : activeChat.id === 'chat_chattime_announcements' || activeChat.name?.toLowerCase().includes('announcement') ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Megaphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Official ChatTime Announcements
                    </span>
                  ) : activeChat.id === 'chat_chattime_support' || activeChat.name === 'ChatTime Support' ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <VerifiedBadge type="red" size="xs" />
                      Official 24/7 Support Desk • support@chattime.com
                    </span>
                  ) : activeChat.type === 'channel' ? (
                    <span className="text-teal-400 font-semibold flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      Official Community
                    </span>
                  ) : activeChat.participants.length <= 1 ? (
                    <span className="text-slate-400">
                      Group Conversation
                    </span>
                  ) : (
                    <span>{activeChat.participants.length} people</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Audio Call, Video Call, Ghost Toggle, Search, Profile & Menu */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {peerUser && (
              <button
                onClick={() => toggleGhostUser(peerUser.id)}
                title={isPeerGhosted ? 'Unghost Contact' : 'Ghost Contact (Block)'}
                className={`p-2 sm:p-2.5 rounded-xl border transition-colors ${
                  isPeerGhosted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-slate-950/70 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-slate-800/80'
                }`}
              >
                <Ghost className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                if (isPeerBlockedByMe || amIBlockedByPeer) {
                  addToast('Call Blocked', 'Cannot place call. This contact is blocked.', 'error');
                  return;
                }
                startCall(activeChat.id, 'voice');
              }}
              title={isPeerBlockedByMe || amIBlockedByPeer ? 'Cannot call blocked contact' : 'Start Audio Call'}
              disabled={isPeerBlockedByMe || amIBlockedByPeer}
              className={`p-2 sm:p-2.5 rounded-xl border transition-colors ${
                isPeerBlockedByMe || amIBlockedByPeer
                  ? 'opacity-40 cursor-not-allowed bg-slate-950/70 text-slate-600 border-slate-800/50'
                  : 'bg-slate-950/70 hover:bg-teal-500/15 text-teal-400 sm:text-slate-300 hover:text-teal-400 border border-slate-800/80 cursor-pointer'
              }`}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (isPeerBlockedByMe || amIBlockedByPeer) {
                  addToast('Call Blocked', 'Cannot place call. This contact is blocked.', 'error');
                  return;
                }
                startCall(activeChat.id, 'video');
              }}
              title={isPeerBlockedByMe || amIBlockedByPeer ? 'Cannot call blocked contact' : 'Start Video Call'}
              disabled={isPeerBlockedByMe || amIBlockedByPeer}
              className={`p-2 sm:p-2.5 rounded-xl border transition-colors ${
                isPeerBlockedByMe || amIBlockedByPeer
                  ? 'opacity-40 cursor-not-allowed bg-slate-950/70 text-slate-600 border-slate-800/50'
                  : 'bg-slate-950/70 hover:bg-indigo-500/15 text-indigo-400 sm:text-slate-300 hover:text-indigo-400 border border-slate-800/80 cursor-pointer'
              }`}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Search in Conversation"
              className={`hidden sm:flex p-2 sm:p-2.5 rounded-xl border transition-colors ${
                isSearchOpen
                  ? 'bg-teal-500/15 text-teal-400 border-teal-500/40'
                  : 'bg-slate-950/70 text-slate-300 hover:text-white border-slate-800/80'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsInfoDrawerOpen(!isInfoDrawerOpen)}
              title="Toggle Right Profile & Info Drawer"
              className={`hidden sm:flex p-2 sm:p-2.5 rounded-xl border transition-colors ${
                isInfoDrawerOpen
                  ? 'bg-teal-500/15 text-teal-400 border-teal-500/40'
                  : 'bg-slate-950/70 text-slate-300 hover:text-white border-slate-800/80'
              }`}
            >
              <Info className="w-4 h-4" />
            </button>

            {/* More Options Menu */}
            <div className="relative">
              <button
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-300 border border-slate-800/80 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isHeaderMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsHeaderMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-40 space-y-1">
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsSearchOpen(!isSearchOpen);
                      }}
                      className="w-full sm:hidden flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800"
                    >
                      <Search className="w-3.5 h-3.5 text-teal-400" />
                      <span>{t('searchInChat', 'Search in Chat')}</span>
                    </button>
                    {peerUser && (
                      <button
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          setInspectedUserId(peerUser.id);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-teal-400" />
                        <span>{t('contactInfo', 'View Full Profile')}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsInfoDrawerOpen(!isInfoDrawerOpen);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800"
                    >
                      <Info className="w-3.5 h-3.5 text-teal-400" />
                      <span>{isInfoDrawerOpen ? t('hidePanel', 'Hide Side Panel') : t('openPanel', 'Open Side Profile Panel')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        clearChatHistory(activeChat.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-300 hover:bg-slate-800"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>{t('clearChat', 'Clear Chat Messages')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        deleteChat(activeChat.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('deleteChat', 'Delete Chat')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* In-Chat Search Bar */}
        {isSearchOpen && (
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2 shrink-0">
            <Search className="w-4 h-4 text-teal-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={inChatSearchQuery}
              onChange={(e) => setInChatSearchQuery(e.target.value)}
              placeholder={t('search', 'Search messages in this conversation...')}
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {inChatSearchQuery && (
              <span className="text-[11px] text-slate-400">
                {chatMessages.length} match{chatMessages.length === 1 ? '' : 'es'}
              </span>
            )}
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setInChatSearchQuery('');
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pinned Message Banner */}
        {pinnedMessage && (
          <div className="px-4 py-2 bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Pin className="w-3.5 h-3.5 text-teal-400 shrink-0 rotate-45" />
              <div className="text-xs truncate">
                <span className="font-bold text-teal-400 mr-1.5">Pinned:</span>
                <span className="text-slate-300">{pinnedMessage.content}</span>
              </div>
            </div>
            <button
              onClick={() => togglePinMessage(activeChat.id, pinnedMessage.id)}
              className="text-[11px] text-slate-400 hover:text-white shrink-0"
            >
              Unpin
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* WhatsApp-style Iconic End-to-End Encryption Security Notice */}
          <div className="flex justify-center my-2 select-none">
            <div className="max-w-md mx-auto px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{t('endToEndNotice', 'Messages and calls are end-to-end encrypted. No one outside of this chat, not even ChatTime, can read or listen to them.')}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp-style Official Verified Support Chat Card (Not a channel) */}
          {(activeChat.id === 'chat_chattime_support' || activeChat.name === 'ChatTime Support') && (
            <div className="flex justify-center my-2 select-none">
              <div className="max-w-md w-full mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-slate-900 to-slate-900 border border-red-500/30 text-left shadow-lg space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>ChatTime Official Support</span>
                    <VerifiedBadge type="red" size="xs" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  This is your private 1-on-1 official support conversation. Real human operators and safety assistants are active. ChatTime staff will never ask for your 4-digit PIN, passwords, or authentication codes.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-red-300/80 font-mono">
                  <Lock className="w-3 h-3 text-red-400" />
                  <span>Verified 1-on-1 Direct Support • End-to-End Encrypted</span>
                </div>
              </div>
            </div>
          )}
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                <ShieldCheck className="w-7 h-7 text-teal-400" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                {isSearchOpen ? 'No matching messages found' : `Say hello to ${displayName}`}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {isSearchOpen
                  ? 'Try a different keyword.'
                  : 'Messages, voice notes, media, and calls in this chat are end-to-end encrypted.'}
              </p>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              const isOwn = msg.senderId === currentUser.id;
              const prevMsg = index > 0 ? chatMessages[index - 1] : null;
              const prevDateStr =
                prevMsg && isValidTimestamp(prevMsg.timestamp)
                  ? new Date(Number(prevMsg.timestamp)).toDateString()
                  : '';
              const curDateStr = isValidTimestamp(msg.timestamp)
                ? new Date(Number(msg.timestamp)).toDateString()
                : new Date().toDateString();
              const showDateDivider = !prevMsg || prevDateStr !== curDateStr;

              return (
                <React.Fragment key={msg.id}>
                  {showDateDivider && (
                    <div className="flex justify-center my-3">
                      <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400">
                        {formatMessageDate(msg.timestamp)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex items-end gap-2.5 group ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Sender Avatar on Left */}
                    {!isOwn && (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        onClick={() => setInspectedUserId(msg.senderId)}
                        className="w-8 h-8 rounded-xl object-cover bg-slate-800 shrink-0 cursor-pointer hover:ring-2 hover:ring-teal-400"
                        title={`View ${msg.senderName}'s Profile`}
                      />
                    )}

                    <div
                      onTouchStart={(e) => handleBubbleTouchStart(msg.id, e)}
                      onTouchMove={handleBubbleTouchMove}
                      onTouchEnd={handleBubbleTouchEnd}
                      onTouchCancel={handleBubbleTouchEnd}
                      onMouseDown={(e) => handleBubbleMouseDown(msg.id, e)}
                      onMouseUp={handleBubbleMouseUp}
                      onMouseLeave={handleBubbleMouseUp}
                      onContextMenu={(e) => handleBubbleContextMenu(msg.id, e)}
                      className={`relative max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm transition-all select-text cursor-default ${
                        isOwn
                          ? 'bg-teal-500 text-slate-950 rounded-br-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                      } ${Object.keys(msg.reactions || {}).length > 0 ? 'mb-3.5' : ''}`}
                    >
                      {/* Floating Long-Press Reaction Picker */}
                      {reactionPickerMsgId === msg.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40 bg-black/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReactionPickerMsgId(null);
                            }}
                          />
                          <div
                            className={`absolute z-50 -top-12 ${
                              isOwn ? 'right-0 sm:right-2' : 'left-0 sm:left-2'
                            } flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full px-2.5 py-1 shadow-2xl shadow-black/70 animate-in zoom-in-95 fade-in duration-150 select-none`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {REACTION_BAR_EMOJIS.map((emoji) => {
                              const isReacted = (msg.reactions?.[emoji] || []).includes(currentUser.id);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleReaction(activeChat.id, msg.id, emoji);
                                    setReactionPickerMsgId(null);
                                  }}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-130 active:scale-95 transition-transform ${
                                    isReacted
                                      ? 'bg-teal-500/25 ring-1 ring-teal-400 scale-110'
                                      : 'hover:bg-slate-800'
                                  }`}
                                  title={`React with ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                            <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReactionPickerMsgId(null);
                                setActiveMessageMenuId(msg.id);
                              }}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                      {/* Group Sender Name */}
                      {!isOwn && activeChat.type !== 'direct' && (
                        <div
                          onClick={() => setInspectedUserId(msg.senderId)}
                          className="text-[11px] font-bold text-teal-400 mb-1 cursor-pointer hover:underline"
                        >
                          {msg.senderName}
                        </div>
                      )}

                      {/* Reply Quote Preview */}
                      {msg.replyToPreview && (
                        <div
                          className={`mb-2 px-2.5 py-1.5 rounded-xl border-l-2 text-xs ${
                            isOwn
                              ? 'bg-slate-950/15 border-slate-950 text-slate-900'
                              : 'bg-slate-950/70 border-teal-400 text-slate-300'
                          }`}
                        >
                          <div className="font-bold text-[10px]">
                            {msg.replyToPreview.senderName}
                          </div>
                          <div className="truncate opacity-90">{msg.replyToPreview.text}</div>
                        </div>
                      )}

                      {/* Message Body by Type (including View Once Ephemeral Support) */}
                      {msg.isViewOnce ? (
                        (() => {
                          const isOpened = Boolean(
                            (msg.viewedBy && msg.viewedBy.length > 0 && !msg.mediaUrl && msg.content === 'Opened') ||
                              msg.content === 'Opened'
                          );
                          if (isOpened) {
                            return (
                              <div
                                className={`flex items-center gap-2.5 py-1.5 px-2.5 rounded-xl select-none ${
                                  isOwn
                                    ? 'bg-slate-950/15 text-slate-900'
                                    : 'bg-slate-950/60 border border-slate-800/80 text-slate-400'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-full border border-dashed flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isOwn
                                      ? 'border-slate-900/60 text-slate-900/70'
                                      : 'border-slate-500 text-slate-400'
                                  }`}
                                >
                                  1
                                </span>
                                <span className="text-xs italic font-medium">Opened</span>
                              </div>
                            );
                          }

                          const mediaLabel =
                            msg.type === 'image'
                              ? 'View Once Photo'
                              : msg.type === 'video'
                              ? 'View Once Video'
                              : msg.type === 'voice'
                              ? 'View Once Voice Note'
                              : 'View Once Secret Message';

                          return (
                            <button
                              type="button"
                              onClick={() => setViewingOnceMsg(msg)}
                              className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-left transition-all active:scale-95 ${
                                isOwn
                                  ? 'bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 border border-slate-950/20'
                                  : 'bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40'
                              }`}
                            >
                              <span
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-extrabold shrink-0 ${
                                  isOwn
                                    ? 'border-slate-950 bg-slate-950 text-teal-400'
                                    : 'border-teal-400 bg-teal-500/20 text-teal-300'
                                }`}
                              >
                                1
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                  <Flame className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{mediaLabel}</span>
                                </div>
                                <div className="text-[10px] opacity-80">
                                  View once • Disappears after opening
                                </div>
                              </div>
                            </button>
                          );
                        })()
                      ) : (
                        <>
                          {msg.type === 'image' && msg.mediaUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden max-h-72">
                              <img
                                src={msg.mediaUrl}
                                alt={msg.content}
                                onClick={() => setLightboxImage(msg.mediaUrl!)}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-95"
                              />
                            </div>
                          )}

                          {msg.type === 'video' && msg.mediaUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden max-h-72">
                              <video src={msg.mediaUrl} controls className="w-full max-h-72 rounded-xl" />
                            </div>
                          )}

                          {msg.type === 'file' && (
                            <a
                              href={msg.mediaUrl || '#'}
                              download={msg.fileName || msg.content}
                              className={`flex items-center gap-3 p-2.5 rounded-xl mb-1 ${
                                isOwn ? 'bg-slate-950/15' : 'bg-slate-950/80 border border-slate-800'
                              }`}
                            >
                              <FileText className="w-5 h-5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold truncate">
                                  {msg.fileName || msg.content}
                                </div>
                                <div className="text-[10px] opacity-75">
                                  {msg.fileSize || 'Document'} • Click to download
                                </div>
                              </div>
                            </a>
                          )}

                          {msg.type === 'voice' && (
                            <div className="flex items-center gap-3 min-w-[180px] sm:min-w-[200px] py-1">
                              <button
                                type="button"
                                onClick={() => handleToggleVoicePlay(msg.id)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow transition-transform active:scale-95 ${
                                  isOwn
                                    ? 'bg-slate-950 text-teal-400 hover:bg-slate-900'
                                    : 'bg-teal-500 text-slate-950 hover:bg-teal-400'
                                }`}
                              >
                                {activePlayingAudioId === msg.id && !isVoicePaused ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div
                                  onClick={(e) => handleSeekVoice(e, msg.id, msg.audioDuration || 10)}
                                  className={`h-2 rounded-full overflow-hidden cursor-pointer relative group/scrub py-0.5 ${
                                    isOwn ? 'bg-slate-950/25' : 'bg-slate-800'
                                  }`}
                                  title="Tap to scrub voice note"
                                >
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isOwn ? 'bg-slate-950' : 'bg-teal-400'
                                    }`}
                                    style={{
                                      width:
                                        activePlayingAudioId === msg.id
                                          ? `${Math.min(
                                              100,
                                              Math.max(
                                                0,
                                                (audioPlaybackElapsed /
                                                  Math.max(1, msg.audioDuration || 1)) *
                                                  100
                                              )
                                            )}%`
                                          : '0%',
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between gap-2 text-[10px] font-mono mt-1 opacity-80">
                                  <span>
                                    {activePlayingAudioId === msg.id
                                      ? formatAudioDuration(audioPlaybackElapsed)
                                      : formatAudioDuration(msg.audioDuration || 10)}
                                  </span>

                                  <div className="flex items-center gap-1.5">
                                    {msg.voiceModifier && (
                                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-sans font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                        {msg.voiceModifier}
                                      </span>
                                    )}

                                    {/* Playback Speed Pill Button (WhatsApp style: 1x, 1.5x, 2x) */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCycleVoiceSpeed();
                                      }}
                                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono transition-transform active:scale-90 cursor-pointer ${
                                        isOwn
                                          ? 'bg-slate-950/40 hover:bg-slate-950/60 text-teal-300 border border-slate-950/30'
                                          : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30'
                                      }`}
                                      title="Toggle voice speed: 1x / 1.5x / 2x"
                                    >
                                      {voicePlaybackSpeed}x
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {msg.type === 'location' && msg.locationData && (
                            <div
                              onClick={() => {
                                setSelectedMapLocation(msg.locationData);
                                setIsMapReadOnly(true);
                                setIsMapModalOpen(true);
                              }}
                              className={`p-3 rounded-xl mb-1 cursor-pointer flex items-center gap-3 ${
                                isOwn ? 'bg-slate-950/15' : 'bg-slate-950 border border-slate-800'
                              }`}
                            >
                              <MapPin className="w-5 h-5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold truncate">
                                  {msg.locationData.label}
                                </div>
                                <div className="text-[10px] opacity-80 flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" /> Open Interactive Map
                                </div>
                              </div>
                            </div>
                          )}

                          {msg.type === 'contact' && msg.contactData && (
                            <div
                              className={`p-3 rounded-xl mb-1 flex items-center justify-between gap-3 ${
                                isOwn ? 'bg-slate-950/15' : 'bg-slate-950 border border-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={msg.contactData.avatar}
                                  alt={msg.contactData.name}
                                  className="w-9 h-9 rounded-full object-cover"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">
                                    {msg.contactData.name}
                                  </div>
                                  <div className="text-[10px] font-mono opacity-80 truncate">
                                    {msg.contactData.chatTimeNumber}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const target = (Object.values(users) as User[]).find(
                                    (u) => u.username === msg.contactData?.username
                                  );
                                  if (target) setInspectedUserId(target.id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 text-teal-400 text-[10px] font-bold shrink-0"
                              >
                                Profile
                              </button>
                            </div>
                          )}

                          {msg.type === 'poll' && msg.pollData && (
                            <div className="space-y-2 min-w-[200px] sm:min-w-[220px] py-1">
                              <div className="text-xs font-bold">{msg.pollData.question}</div>
                              <div className="space-y-1.5">
                                {msg.pollData.options.map((opt) => {
                                  const totalVotes = msg.pollData!.options.reduce(
                                    (acc, o) => acc + o.votes.length,
                                    0
                                  );
                                  const pct =
                                    totalVotes > 0
                                      ? Math.round((opt.votes.length / totalVotes) * 100)
                                      : 0;
                                  const voted = opt.votes.includes(currentUser.id);
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => votePoll(activeChat.id, msg.id, opt.id)}
                                      className={`w-full text-left p-2 rounded-xl text-xs relative overflow-hidden border transition-all ${
                                        isOwn
                                          ? voted
                                            ? 'bg-slate-950/30 border-slate-950 font-bold'
                                            : 'bg-slate-950/10 border-slate-950/20'
                                          : voted
                                          ? 'bg-teal-500/20 border-teal-400 font-bold'
                                          : 'bg-slate-950 border-slate-800'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between relative z-10">
                                        <span>{opt.text}</span>
                                        <span className="text-[10px] font-mono">
                                          {opt.votes.length} ({pct}%)
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Standard Text Content with Smart Link Detection (Chrome/Safari) */}
                          {msg.type !== 'voice' && msg.type !== 'poll' && (
                            <RichMessageContent content={msg.content} isOwn={isOwn} />
                          )}
                        </>
                      )}

                      {/* Bottom Metadata: Time, Edited, Read Receipt */}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          isOwn ? 'text-slate-900/75' : 'text-slate-400'
                        }`}
                      >
                        {msg.isPinned && <Pin className="w-2.5 h-2.5 rotate-45" />}
                        {msg.isEdited && <span>edited</span>}
                        <span>{formatTime(msg.timestamp)}</span>
                        {isOwn && (
                          <MessageStatusTicks
                            status={msg.status}
                            isLightBubble={isOwn}
                            hideReadReceipts={shouldHideReadReceipts}
                            className="ml-0.5"
                          />
                        )}
                      </div>

                      {/* Small Reaction Badge on Message Bubble */}
                      {Object.keys(msg.reactions || {}).length > 0 && (
                        <div
                          className={`absolute -bottom-3 ${
                            isOwn ? 'right-2' : 'left-2'
                          } z-10 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full px-2 py-0.5 shadow-md shadow-black/40 text-[11px] select-none hover:scale-105 active:scale-95 transition-transform cursor-pointer`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id);
                          }}
                          title={Object.entries(msg.reactions)
                            .map(([em, ids]) => `${em} ${ids.length}`)
                            .join(', ')}
                        >
                          <div className="flex items-center -space-x-1">
                            {Object.entries(msg.reactions).map(([emoji]) => (
                              <span key={emoji} className="text-xs leading-none">
                                {emoji}
                              </span>
                            ))}
                          </div>
                          {(() => {
                            const totalReactions = Object.values(msg.reactions).reduce(
                              (sum, ids) => sum + ids.length,
                              0
                            );
                            const hasUserReacted = Object.values(msg.reactions).some((ids) =>
                              ids.includes(currentUser.id)
                            );
                            return (
                              <span
                                className={`text-[10px] font-bold ${
                                  hasUserReacted ? 'text-teal-400' : 'text-slate-300'
                                }`}
                              >
                                {totalReactions > 1 ? totalReactions : ''}
                              </span>
                            );
                          })()}
                        </div>
                      )}

                      {/* Quick Action Triggers on Hover / Tap */}
                      <div
                        className={`absolute top-1.5 ${
                          isOwn ? '-left-16' : '-right-16'
                        } opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1 transition-opacity`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-teal-300 transition-colors shadow-sm"
                          title="React with emoji (or long-press bubble)"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id)
                          }
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors shadow-sm"
                          title="Message Actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Message Context Menu */}
                      {activeMessageMenuId === msg.id && (
                        <div
                          className={`absolute z-30 top-8 ${
                            isOwn ? 'right-0' : 'left-0'
                          } w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 text-slate-200`}
                        >
                          {/* Quick Reaction Bar */}
                          <div className="flex items-center justify-between px-2 py-1 bg-slate-950 rounded-xl">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  toggleReaction(activeChat.id, msg.id, emoji);
                                  setActiveMessageMenuId(null);
                                }}
                                className="hover:scale-125 transition-transform text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setReplyingTo(msg);
                              setActiveMessageMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs hover:bg-slate-800"
                          >
                            <Reply className="w-3.5 h-3.5 text-teal-400" /> Reply
                          </button>

                          {isOwn && msg.type === 'text' && (
                            <button
                              onClick={() => {
                                setEditingMessage(msg);
                                setActiveMessageMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs hover:bg-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Edit Message
                            </button>
                          )}

                          <button
                            onClick={() => {
                              togglePinMessage(activeChat.id, msg.id);
                              setActiveMessageMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs hover:bg-slate-800"
                          >
                            <Pin className="w-3.5 h-3.5 text-amber-400" />{' '}
                            {msg.isPinned ? 'Unpin' : 'Pin'}
                          </button>

                          <button
                            onClick={() => {
                              setForwardingMsg(msg);
                              setActiveMessageMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs hover:bg-slate-800"
                          >
                            <Share2 className="w-3.5 h-3.5 text-teal-400" /> Forward
                          </button>

                          <button
                            onClick={() => {
                              deleteMessage(activeChat.id, msg.id, isOwn);
                              setActiveMessageMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Replying / Editing Banner */}
        {(replyingTo || editingMessage) && (
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {replyingTo ? (
                <Reply className="w-4 h-4 text-teal-400 shrink-0" />
              ) : (
                <Edit2 className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              <div className="text-xs truncate">
                <span className="font-bold text-teal-400 mr-1.5">
                  {replyingTo ? `Replying to ${replyingTo.senderName}:` : 'Editing message:'}
                </span>
                <span className="text-slate-300">
                  {replyingTo ? replyingTo.content : editingMessage?.content}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setReplyingTo(null);
                setEditingMessage(null);
                setInputText('');
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Once Active Mode Banner */}
        {isViewOnceMode && (
          <div className="px-3.5 py-1.5 bg-teal-500/15 border-t border-teal-500/30 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-teal-300 font-semibold min-w-0">
              <span className="w-4 h-4 rounded-full bg-teal-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                1
              </span>
              <span className="truncate">
                View Once enabled — next message, photo, video, or voice note disappears after viewing
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsViewOnceMode(false)}
              className="text-[10px] font-bold text-teal-300 hover:text-white shrink-0 px-1.5 py-0.5 rounded bg-slate-900/60"
            >
              Disable
            </button>
          </div>
        )}

        {/* Bottom Message Composer Bar (Mobile-first sizing with safe area insets for iPhone 13) */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] bg-slate-900/95 border-t border-slate-800/80 shrink-0 relative w-full max-w-full">
          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleDocumentUpload}
            className="hidden"
          />

          {/* Attachment Popover */}
          {isAttachMenuOpen && (
            <div className="absolute bottom-16 left-2 sm:left-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 grid grid-cols-2 gap-1.5 w-64 z-30 animate-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  imageInputRef.current?.click();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-teal-400 shrink-0" /> Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  videoInputRef.current?.click();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Video className="w-4 h-4 text-indigo-400 shrink-0" /> Video
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  setIsViewOnceMode(!isViewOnceMode);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                  isViewOnceMode
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <Flame className="w-4 h-4 text-teal-400 shrink-0" /> View Once ({isViewOnceMode ? 'On' : 'Off'})
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" /> Document
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  setSelectedMapLocation(undefined);
                  setIsMapReadOnly(false);
                  setIsMapModalOpen(true);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
              >
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" /> Location
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  setIsContactShareModalOpen(true);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-sky-400 shrink-0" /> Contact
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  setIsPollModalOpen(true);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
              >
                <BarChart2 className="w-4 h-4 text-amber-400 shrink-0" /> Create Poll
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  openTTSModal();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-800 text-xs font-bold text-amber-300 transition-colors bg-gradient-to-r from-amber-500/10 to-teal-500/10 border border-amber-500/30"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" /> AI Speech Note (TTS)
              </button>
            </div>
          )}

          {/* Emoji Palette Popover */}
          {isEmojiPickerOpen && (
            <div className="absolute bottom-16 left-2 sm:left-12 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2.5 grid grid-cols-8 gap-1 z-30 max-w-[92vw]">
              {EMOJI_PALETTE.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setInputText((prev) => prev + em)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-lg"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {isPeerBlockedByMe && peerUser ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 w-full animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-xs text-rose-300 min-w-0">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="leading-snug">
                  You blocked this contact. Tap to unblock.
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleGhostUser(peerUser.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 transition-colors shadow-sm active:scale-95 cursor-pointer"
              >
                Unblock Contact
              </button>
            </div>
          ) : amIBlockedByPeer && peerUser ? (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 w-full text-center animate-in fade-in duration-150">
              <span className="text-xs text-slate-400 font-medium">
                You cannot send messages or place calls to this user. This contact has blocked you.
              </span>
            </div>
          ) : isRecording ? (
            <div className="flex items-center justify-between gap-2 bg-slate-950 border border-rose-500/40 rounded-2xl px-3 py-2.5 w-full shadow-inner">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-3 h-3 rounded-full bg-rose-500 shrink-0 ${isRecordingPaused ? 'opacity-50' : 'animate-ping'}`} />
                <span className="text-xs sm:text-sm font-mono font-bold text-rose-400 truncate">
                  {isRecordingPaused ? 'Paused' : 'Recording'} • {formatAudioDuration(recordingSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Voice Modifier Dropdown Trigger */}
                {platformFeatures.voiceEffectsEnabled && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsVoiceModifierPickerOpen(!isVoiceModifierPickerOpen)}
                      className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-teal-500/50 text-[11px] font-semibold text-slate-200 hover:text-teal-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="Apply Voice Accent / Effect"
                    >
                      <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
                      <span className="hidden sm:inline">{selectedVoiceModifier}</span>
                      <span className="sm:hidden">{selectedVoiceModifier.split(' ')[0]}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                    </button>
                    {isVoiceModifierPickerOpen && (
                      <div className="absolute bottom-11 right-0 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 w-48 max-h-56 overflow-y-auto space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                          Voice Modifiers
                        </div>
                        {[
                          'Original 🎙️',
                          ...(platformFeatures.voiceModifiers || [
                            'American 🇺🇸',
                            'British 🇬🇧',
                            'Indian 🇮🇳',
                            'Asian 🌏',
                            'Australian 🇦🇺',
                            'Nigerian 🇳🇬',
                            'Jamaican 🇯🇲',
                          ]),
                        ].map((mod) => (
                          <button
                            key={mod}
                            type="button"
                            onClick={() => {
                              setSelectedVoiceModifier(mod);
                              setIsVoiceModifierPickerOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              selectedVoiceModifier === mod
                                ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span>{mod}</span>
                            {selectedVoiceModifier === mod && (
                              <Check className="w-3.5 h-3.5 text-teal-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={togglePauseVoiceRecording}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  title={isRecordingPaused ? 'Resume Recording' : 'Pause Recording'}
                >
                  {isRecordingPaused ? (
                    <Play className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
                  ) : (
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => finishVoiceRecording(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => finishVoiceRecording(false)}
                  className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendText} className="flex items-center gap-1.5 sm:gap-2.5 w-full max-w-full">
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(!isAttachMenuOpen);
                  setIsEmojiPickerOpen(false);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-teal-400 border border-slate-800 transition-colors shrink-0 cursor-pointer active:scale-95"
                title="Attach Media, Files, Location, or Poll"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => {
                  setIsEmojiPickerOpen(!isEmojiPickerOpen);
                  setIsAttachMenuOpen(false);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-colors shrink-0 cursor-pointer active:scale-95"
                title="Add Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* AI Voice Generator (TTS) Button */}
              <button
                type="button"
                onClick={openTTSModal}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 transition-colors shrink-0 cursor-pointer active:scale-95"
                title="AI Speech Generator (TTS) - Speak typed text in regional human accents"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Wide Text Input Field */}
              <div className="flex-1 min-w-0 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => {
                    setTimeout(() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }, 100);
                  }}
                  placeholder={isViewOnceMode ? 'View-once message...' : t('typeMessage', `Message ${displayName}...`)}
                  className={`w-full bg-slate-950 border rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    isViewOnceMode
                      ? 'border-teal-500/60 focus:border-teal-400 ring-1 ring-teal-500/20'
                      : 'border-slate-800 focus:border-teal-500/80'
                  }`}
                />
                {isViewOnceMode && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-teal-500 text-slate-950 font-extrabold text-[9px] flex items-center justify-center pointer-events-none">
                    1
                  </span>
                )}
              </div>

              {/* Dynamic Action: Send button when text is entered, or Voice Note button when empty */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shrink-0 shadow-lg shadow-teal-500/30 active:scale-95 cursor-pointer"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shrink-0 shadow-lg shadow-teal-500/25 active:scale-90 cursor-pointer ring-2 ring-teal-400/30"
                  title="Record Voice Note (Tap to record)"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Right Side Profile & Shared Media Drawer */}
      <MediaDrawer />

      {/* Interactive Map Modal */}
      <InteractiveMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLocation={selectedMapLocation}
        isReadOnly={isMapReadOnly}
        onSendLocation={(loc) => {
          sendMessage(activeChat.id, `📍 ${loc.label}`, 'location', { locationData: loc });
          setIsMapModalOpen(false);
        }}
      />

      {/* Poll Creation Modal */}
      {isPollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSendPoll}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-400" /> Create Poll
              </h3>
              <button
                type="button"
                onClick={() => setIsPollModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Question</label>
              <input
                type="text"
                required
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask the conversation a question..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-slate-400">Options</label>
              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[idx] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              ))}
              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="text-xs text-teal-400 font-bold"
                >
                  + Add Option
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPollModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
              >
                Post Poll
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contact Share Modal */}
      {isContactShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Share Contact Card</h4>
              <button
                onClick={() => setIsContactShareModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {(Object.values(users) as User[]).map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    sendMessage(activeChat.id, `Contact: ${u.name}`, 'contact', {
                      contactData: {
                        name: u.name,
                        chatTimeNumber: u.phoneNumber || u.chatTimeNumber,
                        avatar: u.avatar,
                        username: u.username,
                      },
                    });
                    setIsContactShareModalOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 text-left"
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{u.name}</div>
                    <div className="text-[10px] font-mono text-teal-400 truncate">
                      {u.phoneNumber || u.chatTimeNumber}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardingMsg && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Forward Message To...</h4>
              <button
                onClick={() => setForwardingMsg(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    forwardMessage(forwardingMsg, c.id);
                    setForwardingMsg(null);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 text-left"
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                  <span className="text-xs font-bold text-white truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <img
            src={lightboxImage}
            alt="Full size preview"
            className="max-w-full max-h-[90dvh] rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* View Once Secure Ephemeral Viewer Modal */}
      {viewingOnceMsg && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 select-none">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-full bg-teal-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shrink-0">
                1
              </span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span>View Once Encrypted Message</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  From {viewingOnceMsg.senderName} • Disappears permanently when closed
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                markViewOnceOpened(activeChat.id, viewingOnceMsg.id);
                setViewingOnceMsg(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shrink-0"
            >
              <Flame className="w-3.5 h-3.5" /> Close & Burn
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden my-4">
            {viewingOnceMsg.type === 'image' && viewingOnceMsg.mediaUrl ? (
              <img
                src={viewingOnceMsg.mediaUrl}
                alt="View Once"
                className="max-w-full max-h-[72dvh] rounded-2xl object-contain shadow-2xl border border-slate-800"
              />
            ) : viewingOnceMsg.type === 'video' && viewingOnceMsg.mediaUrl ? (
              <video
                src={viewingOnceMsg.mediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-[72dvh] rounded-2xl shadow-2xl border border-slate-800"
              />
            ) : viewingOnceMsg.type === 'voice' && viewingOnceMsg.mediaUrl ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mx-auto">
                  <Mic className="w-8 h-8 text-teal-400" />
                </div>
                <div className="text-sm font-bold text-white">View-Once Voice Note</div>
                <audio src={viewingOnceMsg.mediaUrl} controls autoPlay className="w-full" />
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-teal-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mx-auto">
                  <Eye className="w-6 h-6 text-teal-400" />
                </div>
                <p className="text-sm sm:text-base font-medium text-white whitespace-pre-wrap break-words leading-relaxed">
                  {viewingOnceMsg.content}
                </p>
              </div>
            )}
          </div>

          <div className="text-center pb-2">
            <p className="text-[11px] text-slate-400 mb-3">
              🔒 Screenshot & forward protection active. Once you close this screen, this content is permanently destroyed.
            </p>
            <button
              onClick={() => {
                markViewOnceOpened(activeChat.id, viewingOnceMsg.id);
                setViewingOnceMsg(null);
              }}
              className="px-6 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-teal-500/20"
            >
              Done Viewing (Destroy Message)
            </button>
          </div>
        </div>
      )}

      {/* Conversation Media & Information Side Drawer */}
      <MediaDrawer />
    </div>
  );
};
