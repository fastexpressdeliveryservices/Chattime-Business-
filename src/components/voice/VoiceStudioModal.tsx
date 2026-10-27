import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  Mic,
  Sliders,
  Check,
  Sparkles,
  ShieldCheck,
  Play,
  Square,
  Crown,
  Info,
  Radio,
  Zap,
  RotateCcw,
  Headphones,
  Lock,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import {
  CHATTIME_VOICE_STYLES,
  globalVoiceProcessor,
} from '../../services/voiceProcessingEngine';
import { webrtcEngine } from '../../services/webrtcService';
import type { VoiceStyleConfig, VoicePresentation, UserVoiceSettings } from '../../types';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTTS?: () => void;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  onOpenTTS,
}) => {
  const { currentUser, activeCall, addToast, theme, t } = useChatTime();

  const [selectedStyleId, setSelectedStyleId] = useState<string>('american');
  const [presentation, setPresentation] = useState<VoicePresentation>('neutral');
  const [pitch, setPitch] = useState<number>(0); // -12 to +12
  const [speed, setSpeed] = useState<number>(1.0); // 0.75 to 1.35
  const [intensity, setIntensity] = useState<number>(1.0); // 0.5 to 1.5

  const [isMonitorActive, setIsMonitorActive] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'subscription' | 'info'>('studio');

  // Subscription state
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isAdminBypass, setIsAdminBypass] = useState<boolean>(false);
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const meterAnimRef = useRef<number | null>(null);

  // Load existing settings on open
  useEffect(() => {
    if (!isOpen) return;
    const current = globalVoiceProcessor.getSettings();
    setSelectedStyleId(current.voiceStyleId || 'american');
    setPresentation(current.presentation || 'neutral');
    setPitch(current.pitch ?? 0);
    setSpeed(current.speed ?? 1.0);
    setIntensity(current.intensity ?? 1.0);
    setIsMonitorActive(globalVoiceProcessor.isMonitorEnabled());

    // Check user subscription status
    if (currentUser?.id) {
      fetch(`/api/voice/subscription-status?userId=${encodeURIComponent(currentUser.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsPremium(Boolean(data.isPremium));
            setIsAdminBypass(Boolean(data.isAdminBypass));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, currentUser?.id]);

  // Visual microphone level meter loop
  useEffect(() => {
    if (!isOpen) return;

    const updateMeter = () => {
      const level = globalVoiceProcessor.getAudioLevel();
      setMicLevel(level);
      meterAnimRef.current = requestAnimationFrame(updateMeter);
    };

    meterAnimRef.current = requestAnimationFrame(updateMeter);
    return () => {
      if (meterAnimRef.current) cancelAnimationFrame(meterAnimRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const selectedStyle =
    CHATTIME_VOICE_STYLES.find((s) => s.id === selectedStyleId) || CHATTIME_VOICE_STYLES[0];

  const handleApplyPreset = (style: VoiceStyleConfig) => {
    setSelectedStyleId(style.id);
    const newSettings: Partial<UserVoiceSettings> = {
      voiceStyleId: style.id,
      presentation,
      pitch,
      speed,
      intensity,
    };
    globalVoiceProcessor.updateSettings(newSettings);

    // If currently in a live WebRTC call, immediately propagate changes to live stream
    if (activeCall && activeCall.status === 'connected') {
      webrtcEngine.setVoiceEffect(style.id, newSettings);
    }
  };

  const handlePresentationChange = (pres: VoicePresentation) => {
    setPresentation(pres);
    const newSettings: Partial<UserVoiceSettings> = {
      voiceStyleId: selectedStyleId,
      presentation: pres,
      pitch,
      speed,
      intensity,
    };
    globalVoiceProcessor.updateSettings(newSettings);

    if (activeCall && activeCall.status === 'connected') {
      webrtcEngine.setVoiceEffect(selectedStyleId, newSettings);
    }
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    globalVoiceProcessor.updateSettings({ pitch: newPitch });
    if (activeCall && activeCall.status === 'connected') {
      webrtcEngine.setVoiceEffect(selectedStyleId, { pitch: newPitch });
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    globalVoiceProcessor.updateSettings({ speed: newSpeed });
    if (activeCall && activeCall.status === 'connected') {
      webrtcEngine.setVoiceEffect(selectedStyleId, { speed: newSpeed });
    }
  };

  const handleIntensityChange = (newIntensity: number) => {
    setIntensity(newIntensity);
    globalVoiceProcessor.updateSettings({ intensity: newIntensity });
    if (activeCall && activeCall.status === 'connected') {
      webrtcEngine.setVoiceEffect(selectedStyleId, { intensity: newIntensity });
    }
  };

  const handleResetDefaults = () => {
    setPitch(selectedStyle.defaultPitch);
    setSpeed(selectedStyle.defaultSpeed);
    setIntensity(selectedStyle.defaultIntensity);
    setPresentation('neutral');
    globalVoiceProcessor.updateSettings({
      voiceStyleId: selectedStyle.id,
      presentation: 'neutral',
      pitch: selectedStyle.defaultPitch,
      speed: selectedStyle.defaultSpeed,
      intensity: selectedStyle.defaultIntensity,
    });
    addToast(t('voiceReset', 'Voice Reset'), 'Restored default accent calibration', 'info');
  };

  // Toggle Live Headphone Monitor ("Hear Myself")
  const handleToggleMonitor = async () => {
    if (!isMonitorActive) {
      // Need microphone stream to monitor
      if (!globalVoiceProcessor.getProcessedTrack()) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          const track = stream.getAudioTracks()[0];
          await globalVoiceProcessor.attachMicrophoneTrack(track);
        } catch {
          addToast(t('micPermission', 'Microphone Permission'), 'Please allow microphone access to test your voice', 'error');
          return;
        }
      }
    }
    const state = globalVoiceProcessor.setMonitor(!isMonitorActive);
    setIsMonitorActive(state);
  };

  // Preview Voice Sample Phrase using AI Speech engine
  const handlePlaySample = async () => {
    if (isPlayingPreview && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch('/api/voice/preview-accent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceStyleId: selectedStyle.id,
          presentation,
          samplePhrase: selectedStyle.samplePhrase,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'Failed to generate voice preview');
      }

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }

      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
      audio.onerror = () => setIsPlayingPreview(false);
      await audio.play();
      setIsPlayingPreview(true);
    } catch (err: any) {
      console.warn('[VoiceStudio] Preview error:', err);
      // Fallback: browser speech synthesis if offline
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(selectedStyle.samplePhrase);
        u.pitch = 1 + (pitch * 0.05);
        u.rate = speed;
        u.onend = () => setIsPlayingPreview(false);
        window.speechSynthesis.speak(u);
        setIsPlayingPreview(true);
      } else {
        addToast(t('previewUnavailable', 'Preview Unavailable'), err?.message || 'Could not load preview audio', 'error');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  // Subscribe to Voice Premium plan
  const handleSubscribe = async (plan: 'weekly' | 'monthly' | 'yearly') => {
    if (!currentUser?.id) {
      addToast(t('authRequired', 'Sign In Required'), 'Please log in to activate Voice Premium', 'error');
      return;
    }

    setSubscribingPlan(plan);
    try {
      const res = await fetch('/api/voice/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          plan,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsPremium(true);
        addToast(
          t('subscribedTitle', 'Voice Premium Activated'),
          `Your ${plan.toUpperCase()} Voice Premium pass is now active!`,
          'success'
        );
        setActiveTab('studio');
      } else {
        throw new Error(data.error || 'Subscription failed');
      }
    } catch (err: any) {
      addToast(t('subscriptionFailed', 'Subscription Failed'), err?.message || 'Could not process plan activation', 'error');
    } finally {
      setSubscribingPlan(null);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none animate-in fade-in duration-150"
    >
      <div
        className={`w-full max-w-4xl max-h-[94dvh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header with Title & Active Status */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-rose-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  ChatTime AI Voice Studio
                </h3>
                {isAdminBypass ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    Admin Testing Privilege
                  </span>
                ) : isPremium ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-emerald-400" />
                    Voice Premium Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Free Tier (Preview Mode)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Natural human-like AI voice conversion for live calls & speech synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTTS && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTTS();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-teal-400" />
                <span>Text-to-Speech</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
              title="Close Voice Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800 px-5 bg-slate-950/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'studio'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Voice Presets & Tuning</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscription')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'subscription'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Voice Premium Plans</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'info'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Engine & Providers</span>
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'studio' && (
            <>
              {/* Voice Style Presets Grid (11+ Regional Accents) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
                      1. Select Regional Voice Style & Accent
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({CHATTIME_VOICE_STYLES.length} authentic models)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Selected: <strong className="text-white">{selectedStyle.name}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {CHATTIME_VOICE_STYLES.map((style) => {
                    const isSelected = selectedStyleId === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleApplyPreset(style)}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 active:scale-98 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-teal-500/20 to-slate-900 border-teal-400 text-white shadow-lg ring-2 ring-teal-400/30'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{style.flag}</span>
                          {style.isPremium && !isPremium && !isAdminBypass && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5 text-amber-400" />
                              PRO
                            </span>
                          )}
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-white truncate">{style.name}</div>
                          <div className="text-[10px] text-teal-400 font-mono truncate">{style.region}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-tight">
                            {style.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Presentation & Fine Tuning */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 border-t border-slate-800">
                {/* Left: Presentation & Sample Audio Preview */}
                <div className="md:col-span-5 space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono block mb-2">
                      2. Voice Presentation
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['feminine', 'neutral', 'masculine'] as VoicePresentation[]).map((pres) => {
                        const isCurrent = presentation === pres;
                        return (
                          <button
                            key={pres}
                            type="button"
                            onClick={() => handlePresentationChange(pres)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer text-center ${
                              isCurrent
                                ? 'bg-teal-500 text-slate-950 border-teal-400 font-extrabold shadow-md'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {pres}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sample Phrase Preview Player */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                        Sample Accent Phrase
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">AI Speech Engine</span>
                    </div>

                    <p className="text-xs text-slate-300 italic bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                      &ldquo;{selectedStyle.samplePhrase}&rdquo;
                    </p>

                    <button
                      type="button"
                      onClick={handlePlaySample}
                      disabled={previewLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all disabled:opacity-50"
                    >
                      {previewLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Generating Authentic Preview...</span>
                        </>
                      ) : isPlayingPreview ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop Sample Preview</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Listen to {selectedStyle.name} Sample</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mic Test / Hear Myself Live */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Headphones className="w-3.5 h-3.5 text-amber-400" />
                        Mic Test / Hear Myself
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Headphones Rec.</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleToggleMonitor}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isMonitorActive
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Radio className={`w-3.5 h-3.5 ${isMonitorActive ? 'animate-pulse' : ''}`} />
                        <span>{isMonitorActive ? 'Live Monitor Active' : 'Start Mic Test'}</span>
                      </button>
                    </div>

                    {/* Microphone Level Meter */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Microphone Input Level</span>
                        <span>{micLevel}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 via-amber-400 to-rose-500 transition-all duration-75"
                          style={{ width: `${micLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Fine-tuning sliders */}
                <div className="md:col-span-7 space-y-5 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
                      3. Fine-Tune Voice Characteristics
                    </span>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="text-[11px] text-slate-400 hover:text-teal-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Calibration</span>
                    </button>
                  </div>

                  {/* Natural Pitch Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">Natural Pitch</span>
                      <span className="font-mono text-teal-400 font-bold">
                        {pitch > 0 ? `+${pitch}` : pitch} semitones
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={pitch}
                      onChange={(e) => handlePitchChange(Number(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>-12st (Deep Baritone)</span>
                      <span>0st (Natural Center)</span>
                      <span>+12st (Elevated)</span>
                    </div>
                  </div>

                  {/* Speaking Speed / Cadence Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">Conversational Cadence & Pacing</span>
                      <span className="font-mono text-teal-400 font-bold">{speed.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.35"
                      step="0.05"
                      value={speed}
                      onChange={(e) => handleSpeedChange(Number(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>0.75x (Deliberate)</span>
                      <span>1.0x (Standard)</span>
                      <span>1.35x (Brisk)</span>
                    </div>
                  </div>

                  {/* Voice Intensity / Resonance Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">Vocal Resonance & Harmonic Intensity</span>
                      <span className="font-mono text-teal-400 font-bold">
                        {Math.round(intensity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={intensity}
                      onChange={(e) => handleIntensityChange(Number(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>50% (Soft/Subtle)</span>
                      <span>100% (Balanced)</span>
                      <span>150% (Rich Resonance)</span>
                    </div>
                  </div>

                  {/* In-Call Status Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-300">
                        {activeCall && activeCall.status === 'connected'
                          ? 'Active live call detected: changes are applied instantly to recipient.'
                          : 'Preferences saved. Audio engine will activate automatically during your next call.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Subscription Plans */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Crown className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white font-display">
                  ChatTime Voice Premium Subscriptions
                </h4>
                <p className="text-xs text-slate-400">
                  Unlock all 11+ regional accents, live WebRTC voice modification, and unlimited AI text-to-speech generation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Weekly Plan */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                      Entry Pass
                    </span>
                    <h5 className="text-base font-bold text-white mt-1">Weekly Voice Pass</h5>
                    <div className="mt-2 text-2xl font-extrabold text-white font-mono">
                      ₦1,000 <span className="text-xs text-slate-400 font-normal">/ 7 days</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>All 11+ regional accent styles</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>Live in-call voice changer</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>7 days continuous access</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(subscribingPlan) || isPremium}
                    onClick={() => handleSubscribe('weekly')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPremium ? 'Already Subscribed' : subscribingPlan === 'weekly' ? 'Activating...' : 'Activate for ₦1,000'}
                  </button>
                </div>

                {/* Monthly Plan - Popular */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-teal-950/40 via-slate-950 to-slate-950 border-2 border-teal-500/60 flex flex-col justify-between space-y-4 relative shadow-xl shadow-teal-500/10">
                  <span className="absolute -top-3 right-4 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-teal-400 text-slate-950 uppercase tracking-wider">
                    Most Popular
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 font-mono">
                      Professional
                    </span>
                    <h5 className="text-base font-bold text-white mt-1">Monthly Voice Pro</h5>
                    <div className="mt-2 text-2xl font-extrabold text-teal-300 font-mono">
                      ₦6,000 <span className="text-xs text-slate-400 font-normal">/ 30 days</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>Unlimited in-call voice conversion</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>High-fidelity AI speech synthesis</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>Custom pitch & formant tuning</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>30 days continuous access</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(subscribingPlan) || isPremium}
                    onClick={() => handleSubscribe('monthly')}
                    className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isPremium ? 'Already Subscribed' : subscribingPlan === 'monthly' ? 'Activating...' : 'Activate for ₦6,000'}
                  </button>
                </div>

                {/* Yearly Plan */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
                      Best Value
                    </span>
                    <h5 className="text-base font-bold text-white mt-1">Yearly Voice Unlimited</h5>
                    <div className="mt-2 text-2xl font-extrabold text-amber-300 font-mono">
                      ₦20,000 <span className="text-xs text-slate-400 font-normal">/ 365 days</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Save over ₦52,000 annually</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Full VIP voice features 365 days</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Priority neural voice compute</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(subscribingPlan) || isPremium}
                    onClick={() => handleSubscribe('yearly')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isPremium ? 'Already Subscribed' : subscribingPlan === 'yearly' ? 'Activating...' : 'Activate for ₦20,000'}
                  </button>
                </div>
              </div>

              {/* Security & Backend Verification Notice */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Secure Server-Side Entitlement</strong>
                  All voice subscriptions are verified against your authenticated account on the ChatTime server before granting audio processing. Unsubscribed accounts remain on standard clear HD calling. Authorized administrators bypass subscription checks for testing.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Technical Specifications & Providers */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-400" />
                  Dual-Engine Architecture: Real-Time Calls & AI Speech
                </h5>
                <p className="text-slate-400 leading-relaxed">
                  ChatTime uses a dual-engine architecture to ensure both zero-latency real-time calling and high-fidelity speech synthesis:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-teal-400 font-mono block">
                      Live In-Call Voice Changer (WebRTC)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Operates locally within the browser’s Web Audio pipeline at &lt; 15ms latency. Modulates vocal tract resonant formants (F1, F2, F3) and pitch in real time without passing raw call audio to external cloud servers, preserving end-to-end encryption.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 font-mono block">
                      AI Speech Synthesis (Google GenAI TTS)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Generates complete studio-quality spoken audio from typed text using Gemini neural voice models (<code className="text-amber-300">gemini-3.8-flash-lite-tts</code>). Audio can be previewed and sent as encrypted voice notes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Krisp RTC SDK & Provider Integration Notes
                </h5>
                <p className="text-slate-400 leading-relaxed">
                  Krisp RTC SDK provides deep-learning acoustic noise suppression and inbound/outbound voice isolation. In standard environments where Krisp commercial licensing credentials are not configured, ChatTime seamlessly utilizes native hardware acoustic echo cancellation (AEC) and our custom high-definition Formant Engine so your calls are always crisp, echo-free, and operational.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
