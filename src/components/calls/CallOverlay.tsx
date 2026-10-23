import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Minimize2,
  Maximize2,
  Phone,
  ShieldCheck,
  Activity,
  Layers,
  Sliders,
  X,
  BellOff,
  Bell,
  MonitorUp,
  Sparkles,
  Wand2,
  ArrowLeftRight,
  Sun,
  Smile,
  Check,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { formatCallDuration } from '../../utils/formatters';
import {
  webrtcEngine,
  WebRTCStats,
  AudioDeviceInfo,
  CALL_VOICE_EFFECTS,
} from '../../services/webrtcService';

export interface VideoFilterPreset {
  id: string;
  name: string;
  filter: string;
  previewGradient: string;
  tag: string;
  desc: string;
}

export const VIDEO_FILTER_PRESETS: VideoFilterPreset[] = [
  {
    id: 'beauty',
    name: 'Beauty Radiant',
    filter: 'contrast(103%) brightness(108%) saturate(112%)',
    previewGradient: 'from-amber-300 via-rose-300 to-teal-300',
    tag: 'Smooth Skin',
    desc: 'Soft radiant glow with skin smoothing'
  },
  {
    id: 'normal',
    name: 'Original',
    filter: 'none',
    previewGradient: 'from-slate-700 to-slate-900',
    tag: 'Natural',
    desc: 'Unfiltered authentic camera feed'
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'sepia(22%) saturate(135%) brightness(105%) hue-rotate(-8deg)',
    previewGradient: 'from-amber-400 to-orange-500',
    tag: 'Warmth',
    desc: 'Warm sunset ambience and soft tones'
  },
  {
    id: 'studio',
    name: 'Studio Crisp',
    filter: 'contrast(115%) saturate(112%) brightness(105%)',
    previewGradient: 'from-cyan-400 to-blue-600',
    tag: 'HD Clarity',
    desc: 'Punchy studio-lit sharpness'
  },
  {
    id: 'dreamy',
    name: 'Soft Dreamy',
    filter: 'brightness(112%) contrast(94%) saturate(116%)',
    previewGradient: 'from-pink-300 to-purple-400',
    tag: 'Soft Glow',
    desc: 'Gentle pastel soft-focus vibe'
  },
  {
    id: 'teal',
    name: 'Teal Modern',
    filter: 'hue-rotate(25deg) saturate(125%) contrast(106%)',
    previewGradient: 'from-teal-400 to-emerald-500',
    tag: 'Signature',
    desc: 'ChatTime modern cyber aesthetic'
  },
  {
    id: 'noir',
    name: 'Noir Classic',
    filter: 'grayscale(100%) contrast(125%) brightness(105%)',
    previewGradient: 'from-zinc-400 to-zinc-900',
    tag: 'B&W Film',
    desc: 'Timeless high-contrast black & white'
  },
  {
    id: 'night',
    name: 'Night Bright',
    filter: 'brightness(135%) contrast(110%) saturate(105%)',
    previewGradient: 'from-yellow-400 to-amber-600',
    tag: 'Low-Light',
    desc: 'Enhanced exposure for dim lighting'
  },
];

export const CallOverlay: React.FC = () => {
  const {
    activeCall,
    acceptIncomingCall,
    endActiveCall,
    toggleCallMute,
    toggleCallVideo,
    toggleCallSpeaker,
    toggleMuteRingtone,
    flipCallCamera,
    toggleCallScreenShare,
    toggleCallMinimize,
    localMediaStream,
    remoteMediaStream,
    currentUser,
    users,
    toggleContact,
  } = useChatTime();

  const [callDuration, setCallDuration] = useState<number>(0);
  const [stats, setStats] = useState<WebRTCStats>({
    rtt: 18,
    packetLoss: 0,
    bitrate: 144,
    codec: 'Opus 48kHz HD',
    quality: 'HD Excellent',
  });
  const [micLevel, setMicLevel] = useState<number>(0);
  const [showDeviceModal, setShowDeviceModal] = useState<boolean>(false);
  const [availableDevices, setAvailableDevices] = useState<AudioDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('default');

  // WhatsApp-Style Camera Enhancements & Filters
  const [selectedFilter, setSelectedFilter] = useState<string>('beauty');
  const [beautySmoothLevel, setBeautySmoothLevel] = useState<number>(40);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [isSwappedVideos, setIsSwappedVideos] = useState<boolean>(false);

  // Pre-call and in-call Camera / Voice Controls
  const [isPreCallCameraPaused, setIsPreCallCameraPaused] = useState<boolean>(false);
  const [preCallFacingMode, setPreCallFacingMode] = useState<'user' | 'environment'>('user');
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [activeVoiceEffect, setActiveVoiceEffect] = useState<string>('original');
  const [isVoiceChangerOpen, setIsVoiceChangerOpen] = useState<boolean>(false);

  // Peer identity and privacy display calculation
  const otherUserId =
    activeCall?.caller.id === currentUser.id
      ? activeCall?.participants.find((p) => p.id !== currentUser.id)?.id || ''
      : activeCall?.caller.id || '';
  const otherUser = otherUserId ? users[otherUserId] : null;
  const isOtherContact = otherUserId ? Boolean(currentUser.contacts?.includes(otherUserId)) : false;
  const isOtherSelf = otherUserId === currentUser.id;

  const rawPeerNumber =
    otherUser?.phoneNumber ||
    otherUser?.chatTimeNumber ||
    activeCall?.caller.number ||
    '';

  const peerDisplayName =
    isOtherContact || isOtherSelf
      ? otherUser?.name || activeCall?.chatName || activeCall?.caller.name || 'ChatTime User'
      : rawPeerNumber || activeCall?.chatName || activeCall?.caller.name || 'Unknown Caller';

  const handleSelectVoiceEffect = async (effectId: string) => {
    setActiveVoiceEffect(effectId);
    await webrtcEngine.setVoiceEffect(effectId);
  };

  const currentFilterPreset =
    VIDEO_FILTER_PRESETS.find((p) => p.id === selectedFilter) || VIDEO_FILTER_PRESETS[0];

  const effectiveFilterStyle = React.useMemo(() => {
    let base = currentFilterPreset?.filter === 'none' ? '' : (currentFilterPreset?.filter || '');
    if (selectedFilter === 'beauty') {
      const smoothFactor = (beautySmoothLevel / 100) * 0.4;
      base = `contrast(105%) saturate(115%) brightness(108%) drop-shadow(0 0 ${smoothFactor * 10}px rgba(255,255,255,0.2))`;
    }
    return base || 'none';
  }, [currentFilterPreset, selectedFilter, beautySmoothLevel]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Call timer
  useEffect(() => {
    if (activeCall?.status !== 'connected') {
      setCallDuration(0);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeCall.startedAt) / 1000);
      setCallDuration(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.status, activeCall?.startedAt]);

  // Subscribe to WebRTC real-time statistics
  useEffect(() => {
    webrtcEngine.onStats((newStats) => {
      setStats(newStats);
    });
  }, []);

  // Real-time microphone audio volume meter loop
  useEffect(() => {
    if (activeCall?.status !== 'connected') {
      setMicLevel(0);
      return;
    }

    const checkAudioLevel = () => {
      const level = webrtcEngine.getAudioLevel();
      setMicLevel(level);
      animFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    animFrameRef.current = requestAnimationFrame(checkAudioLevel);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeCall?.status]);

  // Bind MediaStreams to video & audio DOM elements and clean up when call ends
  useEffect(() => {
    const localVideoEl = localVideoRef.current;
    const remoteVideoEl = remoteVideoRef.current;
    const remoteAudioEl = remoteAudioRef.current;

    if (!activeCall || activeCall.status === 'incoming') {
      if (localVideoEl) {
        localVideoEl.pause();
        localVideoEl.srcObject = null;
      }
      if (remoteVideoEl) {
        remoteVideoEl.pause();
        remoteVideoEl.srcObject = null;
      }
      if (remoteAudioEl) {
        remoteAudioEl.pause();
        remoteAudioEl.srcObject = null;
      }
      return;
    }

    const bindStreams = () => {
      const lStream = localMediaStream || webrtcEngine.getLocalStream();
      const rStream = remoteMediaStream || webrtcEngine.getRemoteStream();

      if (localVideoRef.current && lStream) {
        if (localVideoRef.current.srcObject !== lStream) {
          localVideoRef.current.srcObject = lStream;
        }
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }
      if (remoteVideoRef.current && rStream) {
        if (remoteVideoRef.current.srcObject !== rStream) {
          remoteVideoRef.current.srcObject = rStream;
        }
        // Keep video element strictly muted at all times so it never produces dual-audio out-of-phase howling
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current && rStream) {
        if (remoteAudioRef.current.srcObject !== rStream) {
          remoteAudioRef.current.srcObject = rStream;
        }
        remoteAudioRef.current.muted = !activeCall.isSpeakerOn;
        // 0.82 calibrated volume prevents speaker driver saturation and acoustic leakage into adjacent microphones
        remoteAudioRef.current.volume = 0.82;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    bindStreams();

    const unsub = webrtcEngine.onRemoteStream((stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.muted = !activeCall.isSpeakerOn;
        remoteAudioRef.current.volume = 0.82;
        remoteAudioRef.current.play().catch(() => {});
      }
    });

    const timeout = setTimeout(bindStreams, 350);
    return () => {
      clearTimeout(timeout);
      unsub();
      if (localVideoRef.current) {
        try {
          localVideoRef.current.pause();
          localVideoRef.current.srcObject = null;
          localVideoRef.current.load();
        } catch {}
      }
      if (remoteVideoRef.current) {
        try {
          remoteVideoRef.current.pause();
          remoteVideoRef.current.srcObject = null;
          remoteVideoRef.current.load();
        } catch {}
      }
      if (remoteAudioRef.current) {
        try {
          remoteAudioRef.current.pause();
          remoteAudioRef.current.srcObject = null;
        } catch {}
      }
    };
  }, [
    activeCall,
    activeCall?.status,
    activeCall?.type,
    activeCall?.isVideoOff,
    activeCall?.isSpeakerOn,
    localMediaStream,
    remoteMediaStream,
  ]);

  // Fetch available audio devices
  useEffect(() => {
    if (showDeviceModal) {
      webrtcEngine.getAvailableDevices().then((devices) => {
        setAvailableDevices(devices);
      });
    }
  }, [showDeviceModal]);

  if (!activeCall) return null;

  const isMuted = activeCall.isMuted;
  const isVideoOff = activeCall.isVideoOff;
  const isMinimized = Boolean(activeCall.isMinimized);

  const handleCameraFlip = async () => {
    await flipCallCamera();
    const mode = webrtcEngine.getFacingMode();
    setCurrentFacingMode(mode);
    if (mode === 'user') {
      setIsTorchOn(false);
    }
    const stream = webrtcEngine.getLocalStream();
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const handleToggleTorch = async () => {
    const nextTorch = await webrtcEngine.toggleTorch();
    setIsTorchOn(nextTorch);
  };

  const handlePiPToggle = async () => {
    const targetVideo = remoteVideoRef.current || localVideoRef.current;
    if (targetVideo) {
      await webrtcEngine.requestPictureInPicture(targetVideo);
    }
  };

  const handleSelectAudioDevice = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    if (remoteAudioRef.current) {
      await webrtcEngine.setAudioOutputDevice(remoteAudioRef.current, deviceId);
    }
    setShowDeviceModal(false);
  };

  // 1. Incoming Call Screen
  if (activeCall.status === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 w-full h-[100dvh] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 flex flex-col justify-between pt-[max(env(safe-area-inset-top,0px),1.5rem)] pb-[max(env(safe-area-inset-bottom,0px),2rem)] px-6 sm:px-10 select-none overflow-hidden animate-in fade-in duration-200">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row with E2EE & Silence Ringtone */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>ChatTime {activeCall.type === 'video' ? 'Video' : 'Voice'} Call</span>
          </div>

          <button
            onClick={toggleMuteRingtone}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              activeCall.isRingtoneMuted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Silence Ringtone"
          >
            {activeCall.isRingtoneMuted ? (
              <>
                <BellOff className="w-3.5 h-3.5" />
                <span>Silenced</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-teal-400 animate-bounce" />
                <span>Mute Ring</span>
              </>
            )}
          </button>
        </div>

        {/* Center Caller Profile & Details */}
        <div className="flex flex-col items-center text-center my-auto z-10 space-y-4">
          <div className="relative mb-2">
            <div className="absolute -inset-3 rounded-full bg-teal-400/20 animate-ping pointer-events-none" />
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-teal-400 p-1 bg-slate-900 shadow-2xl">
              <img
                src={activeCall.caller.avatar}
                alt={activeCall.caller.name}
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-1 right-1 p-2.5 rounded-full bg-teal-500 text-slate-950 shadow-lg">
              {activeCall.type === 'video' ? (
                <Video className="w-5 h-5" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
              {peerDisplayName}
            </h2>
            <p className="text-sm text-teal-400 font-mono font-medium">
              {rawPeerNumber}
            </p>
          </div>

          {!isOtherContact && otherUserId && !isOtherSelf && (
            <button
              type="button"
              onClick={() => toggleContact(otherUserId)}
              className="px-3.5 py-1.5 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Save Number to Contacts</span>
            </button>
          )}

          {/* Pre-Call Camera Controls (Video Call) */}
          {activeCall.type === 'video' && (
            <div className="mt-4 flex items-center justify-center gap-2 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl w-full max-w-[280px]">
              <button
                type="button"
                onClick={() => setIsPreCallCameraPaused(!isPreCallCameraPaused)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isPreCallCameraPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                }`}
                title="Pause camera before answering so caller sees your profile picture"
              >
                {isPreCallCameraPaused ? (
                  <>
                    <VideoOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Camera Paused</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5 text-teal-400" />
                    <span>Camera Active</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setPreCallFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
                }
                className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Turn Camera (Front or Back)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                <span>{preCallFacingMode === 'user' ? 'Front' : 'Back'}</span>
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp-Style Bottom Answer / Decline Action Dock */}
        <div className="flex items-center justify-around w-full max-w-sm mx-auto z-10 pt-4">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={endActiveCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 active:scale-90 transition-transform cursor-pointer"
              title="Decline"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs font-semibold text-slate-300">Decline</span>
          </div>

          {activeCall.type === 'video' && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() =>
                  acceptIncomingCall({ isVideoOff: true, facingMode: preCallFacingMode })
                }
                className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
                title="Pick with Audio Only (Privacy)"
              >
                <Phone className="w-7 h-7 text-teal-400" />
              </button>
              <span className="text-xs font-medium text-slate-300">Audio Only</span>
            </div>
          )}

          {/* Answer Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() =>
                acceptIncomingCall({
                  isVideoOff: isPreCallCameraPaused,
                  facingMode: preCallFacingMode,
                })
              }
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform cursor-pointer ${
                isPreCallCameraPaused
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/40 animate-pulse'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/40 animate-bounce'
              }`}
              title={isPreCallCameraPaused ? 'Answer with Camera Paused' : 'Answer Call'}
            >
              {activeCall.type === 'video' ? (
                isPreCallCameraPaused ? (
                  <VideoOff className="w-7 h-7" />
                ) : (
                  <Video className="w-7 h-7" />
                )
              ) : (
                <Phone className="w-7 h-7" />
              )}
            </button>
            <span className="text-xs font-bold text-emerald-400">
              {isPreCallCameraPaused ? 'Pick (Paused)' : 'Answer'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Remote Audio Element for crisp voice playback
  const remoteAudioTag = (
    <audio
      ref={remoteAudioRef}
      autoPlay
      playsInline
      controls={false}
      style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0.01 }}
    />
  );

  // 2. Minimized Floating Widget
  if (isMinimized) {
    return (
      <>
        {remoteAudioTag}
        <div className="fixed bottom-20 right-4 z-50 bg-slate-900 border border-teal-500/30 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="relative">
            <img
              src={activeCall.caller.avatar}
              alt={activeCall.caller.name}
              className="w-11 h-11 rounded-full object-cover border border-teal-400"
              referrerPolicy="no-referrer"
            />
            {micLevel > 15 && (
              <span
                className="absolute -inset-1 rounded-full border-2 border-teal-400 animate-ping pointer-events-none"
                style={{ opacity: micLevel / 100 }}
              />
            )}
          </div>
          <div className="text-left text-xs">
            <div className="font-semibold text-slate-200">{peerDisplayName}</div>
            <div className="text-teal-400 font-mono text-[11px] flex items-center gap-1">
              <Activity className="w-3 h-3 text-teal-400 animate-pulse" />
              <span>
                {activeCall.status === 'calling' ? 'Ringing...' : formatCallDuration(callDuration)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={toggleCallMute}
              className={`p-2 rounded-lg ${
                isMuted ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:bg-slate-800'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleCallMinimize}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
              title="Maximize Call"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={endActiveCall}
              className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              title="End Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
    );
  }

  // 3. Fullscreen Active WebRTC Call Window
  return (
    <div className="fixed inset-0 z-50 w-full h-[100dvh] bg-slate-950 flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-150">
      {remoteAudioTag}

      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
        {/* Top Header Bar - WhatsApp Fullscreen Floating Header */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between pt-[max(env(safe-area-inset-top,0px),0.75rem)] px-3 sm:px-6 pb-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={toggleCallMinimize}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Minimize to Floating Bar"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-[150px] sm:max-w-xs font-display">
                  {peerDisplayName}
                </h3>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                  <ShieldCheck className="w-3 h-3 text-teal-400" />
                  E2EE
                </span>
                {!isOtherContact && otherUserId && !isOtherSelf && (
                  <button
                    type="button"
                    onClick={() => toggleContact(otherUserId)}
                    className="px-2.5 py-0.5 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span className="hidden sm:inline">+ Save Number</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5 font-mono">
                {activeCall.status === 'calling' ? (
                  <span className="text-teal-300">Ringing recipient...</span>
                ) : activeCall.status === 'connecting' ? (
                  <span className="text-amber-300">Connecting secure line...</span>
                ) : (
                  <>
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{formatCallDuration(callDuration)}</span>
                    </span>
                    <span className="text-slate-400 hidden sm:inline">·</span>
                    <span className="text-slate-400 hidden sm:inline">{rawPeerNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Top Actions */}
          <div className="flex items-center gap-2">
            {activeCall.status === 'calling' && (
              <button
                onClick={toggleMuteRingtone}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
                title="Silence Ringback Tone"
              >
                <BellOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {activeCall.isRingtoneMuted ? 'Tone Muted' : 'Silence Tone'}
                </span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{stats.quality}</span>
              <span className="text-slate-600">·</span>
              <span>{stats.rtt}ms</span>
            </div>

            <button
              onClick={() => setShowDeviceModal(true)}
              className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Audio Output Device"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {activeCall.type === 'video' && (
              <>
                <button
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    isFiltersOpen || selectedFilter !== 'normal'
                      ? 'bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 font-bold shadow-lg shadow-teal-500/25 ring-2 ring-teal-400'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title="WhatsApp-Style Camera Filters & Beauty Glow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-bold">
                    {currentFilterPreset.name}
                  </span>
                </button>

                <button
                  onClick={() => setIsSwappedVideos(!isSwappedVideos)}
                  className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Swap Main & Corner Camera"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePiPToggle}
                  className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Picture in Picture"
                >
                  <Layers className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={toggleCallMinimize}
              className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Minimize to Floating Bar"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video / Call Center Workspace */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {activeCall.type === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Fullscreen Main Video (Swappable between remote and local) */}
              {isSwappedVideos ? (
                /* Local Camera shown full-screen with Beauty & Filter Applied */
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: effectiveFilterStyle }}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    currentFacingMode === 'user' ? '-scale-x-100' : 'scale-x-100'
                  }`}
                />
              ) : (
                /* Remote Peer video shown full-screen */
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transition-all duration-300"
                />
              )}

              {/* Show avatar ONLY when remote peer has actually paused/turned off their camera */}
              {(() => {
                const remoteParticipant = activeCall.participants.find((p) => p.id !== currentUser.id);
                const isConnected = (activeCall.status as string) === 'connected';
                // Once someone picks (connected), NEVER block the screen with avatar unless they actually paused/turned off their camera
                const isRemoteCameraPaused = isConnected
                  ? Boolean(
                      remoteParticipant?.isVideoOff ||
                        (remoteMediaStream &&
                          remoteMediaStream.getVideoTracks().length > 0 &&
                          remoteMediaStream.getVideoTracks().every((t) => !t.enabled))
                    )
                  : false;

                if (!isRemoteCameraPaused || isSwappedVideos) return null;

                const remoteAvatar =
                  remoteParticipant?.avatar ||
                  (activeCall.caller.id !== currentUser.id ? activeCall.caller.avatar : currentUser.avatar);
                const remoteName =
                  remoteParticipant?.name ||
                  (activeCall.caller.id !== currentUser.id ? activeCall.caller.name : 'Participant');

                return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-none z-10 transition-all duration-200">
                    <div
                      className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 p-1 shadow-2xl bg-slate-900/90"
                      style={{
                        borderColor: micLevel > 15 ? '#00d2b4' : 'rgba(0, 210, 180, 0.4)',
                        boxShadow:
                          micLevel > 15 ? `0 0 ${micLevel}px rgba(0, 210, 180, 0.4)` : 'none',
                      }}
                    >
                      <img
                        src={remoteAvatar}
                        alt={remoteName}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="mt-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 shadow-lg">
                      <VideoOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>Camera Paused</span>
                    </div>
                  </div>
                );
              })()}

              {/* Corner PiP Mirror Camera (Tap to swap main and corner) */}
              <div
                onClick={() => setIsSwappedVideos(!isSwappedVideos)}
                className="absolute bottom-20 sm:bottom-24 right-3 sm:right-4 w-28 h-40 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border-2 border-teal-500/60 shadow-2xl bg-slate-900 z-20 flex items-center justify-center cursor-pointer group hover:scale-105 transition-all"
                title="Tap to swap full-screen and corner views"
              >
                {isSwappedVideos ? (
                  /* In swapped mode, remote peer is in corner */
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : isVideoOff ? (
                  /* When local video is paused / off: show user profile avatar like WhatsApp */
                  <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center w-full h-full bg-slate-950/95">
                    <div
                      className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-teal-400 p-0.5 shadow-lg"
                      style={{
                        boxShadow: micLevel > 15 ? `0 0 ${micLevel}px rgba(0, 210, 180, 0.4)` : 'none',
                      }}
                    >
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                      <VideoOff className="w-3 h-3 text-amber-400" />
                      Paused
                    </span>
                  </div>
                ) : localMediaStream && localMediaStream.getVideoTracks().length > 0 ? (
                  /* Default: Local Camera in corner with Filter applied */
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ filter: effectiveFilterStyle }}
                    className={`w-full h-full object-cover pointer-events-none transition-all duration-300 ${
                      currentFacingMode === 'user' ? '-scale-x-100' : 'scale-x-100'
                    }`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-2 text-center w-full h-full bg-slate-950">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-teal-400"
                    />
                    <span className="text-[10px] text-teal-300 font-semibold">Camera Active</span>
                  </div>
                )}

                {/* Corner Overlay Bar */}
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-white bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded-md font-mono select-none">
                  <span>{isSwappedVideos ? activeCall.chatName : 'You'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCameraFlip();
                    }}
                    className="p-0.5 hover:text-teal-300"
                    title="Flip Front / Rear Camera"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                {/* Swap hint hover badge */}
                <div className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-teal-300">
                  <ArrowLeftRight className="w-3 h-3" />
                </div>
              </div>

              {/* WhatsApp-Style Live Camera Filters & Beauty Dock */}
              {isFiltersOpen && (
                <div
                  className="absolute bottom-4 sm:bottom-20 left-3 right-3 sm:left-auto sm:right-52 z-30 max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 shadow-2xl space-y-3.5 animate-in slide-in-from-bottom duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center text-slate-950 shadow-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          Camera Beauty & Filters
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Real-time enhancements like WhatsApp & Instagram
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFiltersOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Close Filters"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Beauty Smooth Retouch Slider */}
                  <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5 text-teal-400" />
                        Skin Smoothing Retouch
                      </span>
                      <span className="font-mono text-teal-300 font-bold">{beautySmoothLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={beautySmoothLevel}
                      onChange={(e) => setBeautySmoothLevel(Number(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Off</span>
                      <span>Natural Glow</span>
                      <span>Airbrush Soft</span>
                    </div>
                  </div>

                  {/* Filter Preset Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Style Presets ({VIDEO_FILTER_PRESETS.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {VIDEO_FILTER_PRESETS.map((preset) => {
                        const isActive = selectedFilter === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedFilter(preset.id)}
                            className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1 active:scale-95 ${
                              isActive
                                ? 'bg-teal-500/20 border-teal-400 text-white shadow-md ring-2 ring-teal-400/40'
                                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`w-4 h-4 rounded-full bg-gradient-to-tr ${preset.previewGradient} shadow-inner shrink-0`}
                              />
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  isActive
                                    ? 'bg-teal-400 text-slate-950 font-extrabold'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {preset.tag}
                              </span>
                            </div>
                            <div className="text-xs font-bold truncate mt-1">{preset.name}</div>
                            <div className="text-[9px] text-slate-400 line-clamp-1 leading-tight">
                              {preset.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Voice Call Screen */
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-6">
              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-full border-2 border-teal-400/40 transition-all duration-100"
                  style={{
                    transform: `scale(${1 + micLevel / 120})`,
                    opacity: 0.2 + micLevel / 120,
                  }}
                />
                <div
                  className="absolute -inset-8 rounded-full border border-teal-400/20 transition-all duration-150"
                  style={{
                    transform: `scale(${1 + micLevel / 90})`,
                    opacity: micLevel / 150,
                  }}
                />

                <div
                  className="relative w-36 h-36 rounded-full overflow-hidden border-4 p-1.5 bg-slate-900 shadow-2xl transition-all duration-150"
                  style={{
                    borderColor: micLevel > 15 ? '#00d2b4' : '#1e293b',
                  }}
                >
                  <img
                    src={activeCall.caller.avatar}
                    alt={activeCall.caller.name}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-100 font-display">
                  {activeCall.chatName}
                </h2>
                <p className="text-xs text-teal-400 font-mono">
                  {activeCall.status === 'calling'
                    ? 'Calling · Ringing...'
                    : formatCallDuration(callDuration)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Dock - WhatsApp Circular Floating Bar */}
        <div className="pb-[max(env(safe-area-inset-bottom,0px),1.25rem)] pt-4 px-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex items-center justify-center gap-3 sm:gap-5 z-30 flex-wrap">
          {/* Microphone Mute */}
          <button
            onClick={toggleCallMute}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg ${
              isMuted
                ? 'bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-400'
                : 'bg-slate-800/90 text-white hover:bg-slate-700/90'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Video Camera On/Off */}
          {activeCall.type === 'video' && (
            <button
              onClick={toggleCallVideo}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg ${
                isVideoOff
                  ? 'bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-400'
                  : 'bg-slate-800/90 text-white hover:bg-slate-700/90'
              }`}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          )}

          {/* Speakerphone Toggle */}
          <button
            onClick={toggleCallSpeaker}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg ${
              activeCall.isSpeakerOn
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700/90'
            }`}
            title={activeCall.isSpeakerOn ? 'Speaker On' : 'Speaker Muted'}
          >
            {activeCall.isSpeakerOn ? (
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>

          {/* Real-time In-Call Voice Changer / Audio Effects */}
          <button
            onClick={() => {
              setIsVoiceChangerOpen(!isVoiceChangerOpen);
              setIsFiltersOpen(false);
            }}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg ${
              isVoiceChangerOpen || activeVoiceEffect !== 'original'
                ? 'bg-gradient-to-tr from-amber-400 to-teal-400 text-slate-950 font-bold shadow-teal-500/30 ring-2 ring-teal-400'
                : 'bg-slate-800/90 text-white hover:bg-slate-700/90'
            }`}
            title="Real-Time Voice Changer Effects"
          >
            <Wand2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Flip Camera & Filters */}
          {activeCall.type === 'video' && (
            <>
              <button
                onClick={() => {
                  setIsFiltersOpen(!isFiltersOpen);
                  setIsVoiceChangerOpen(false);
                }}
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg ${
                  isFiltersOpen || selectedFilter !== 'normal'
                    ? 'bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 font-bold ring-2 ring-teal-400'
                    : 'bg-slate-800/90 text-white hover:bg-slate-700/90'
                }`}
                title="Camera Beauty & Filters"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={handleCameraFlip}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 text-white hover:bg-slate-700/90 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg"
                title={`Switch Camera (${currentFacingMode === 'user' ? 'Front' : 'Back'})`}
              >
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              {currentFacingMode === 'environment' && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-lg ${
                    isTorchOn
                      ? 'bg-amber-400 text-slate-950 shadow-amber-400/40 font-bold'
                      : 'bg-slate-800/90 text-white hover:bg-slate-700/90'
                  }`}
                  title={isTorchOn ? 'Turn Flash Off' : 'Turn Flash On (Back Camera)'}
                >
                  <Sun className={`w-5 h-5 sm:w-6 sm:h-6 ${isTorchOn ? 'fill-current animate-pulse' : ''}`} />
                </button>
              )}
            </>
          )}

          {/* WhatsApp-Style Prominent Red End Call Button */}
          <button
            onClick={endActiveCall}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 active:scale-90 transition-transform cursor-pointer shrink-0"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>

        {/* In-Call Real-Time Voice Changer Dock Drawer */}
        {isVoiceChangerOpen && (
          <div
            className="absolute bottom-20 left-3 right-3 sm:left-auto sm:right-6 z-40 max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-teal-400 flex items-center justify-center text-slate-950 shadow-sm">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    Live Call Voice Changer
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Real-time audio effects heard directly by recipient
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVoiceChangerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Voice Changer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {CALL_VOICE_EFFECTS.map((fx) => {
                const isActive = activeVoiceEffect === fx.id;
                return (
                  <button
                    key={fx.id}
                    type="button"
                    onClick={() => handleSelectVoiceEffect(fx.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1 active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-teal-500/20 border-teal-400 text-white shadow-md ring-2 ring-teal-400/40'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{fx.icon}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-teal-400 text-slate-950 font-extrabold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {fx.tag}
                      </span>
                    </div>
                    <div className="text-xs font-bold truncate mt-0.5">{fx.name}</div>
                    <div className="text-[9px] text-slate-400 line-clamp-1 leading-tight">
                      {fx.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Audio Output Device Selector Modal */}
        {showDeviceModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100">Audio Output Routing</h4>
                <button
                  onClick={() => setShowDeviceModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {availableDevices.filter((d) => d.kind === 'audiooutput').length === 0 ? (
                  <div
                    onClick={() => handleSelectAudioDevice('default')}
                    className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 font-semibold cursor-pointer"
                  >
                    System Default Speaker / Headset
                  </div>
                ) : (
                  availableDevices
                    .filter((d) => d.kind === 'audiooutput')
                    .map((dev) => (
                      <div
                        key={dev.deviceId}
                        onClick={() => handleSelectAudioDevice(dev.deviceId)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer ${
                          selectedDevice === dev.deviceId
                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300 font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {dev.label}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
