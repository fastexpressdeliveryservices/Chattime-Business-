import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Globe,
  ShieldCheck,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
  Radio,
  Send,
  Zap,
  Info,
  Layers,
  ArrowRightLeft,
  ChevronDown,
  Headphones,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { globalVoiceProcessor } from '../../services/voiceProcessingEngine';
import {
  krispSessionClient,
  krispRTCAdapter,
  krispSTTClient,
  krispTTSClient,
  krispVTClient,
  KrispStatusResponse,
} from '../../services/krispService';
import { KrispVoiceSettings, KrispTranscriptEvent } from '../../types';

export const VoiceAISettingsSection: React.FC = () => {
  const { currentUser, updateCurrentUser, addToast, activeChatId, sendMessage, openVoiceStudio, t } = useChatTime();

  // Settings State
  const [settings, setSettings] = useState<KrispVoiceSettings>(() => ({
    noiseCancellationOutbound: currentUser.krispSettings?.noiseCancellationOutbound ?? true,
    noiseCancellationInbound: currentUser.krispSettings?.noiseCancellationInbound ?? true,
    voiceIsolationEnabled: currentUser.krispSettings?.voiceIsolationEnabled ?? true,
    liveAccentConversionEnabled: currentUser.krispSettings?.liveAccentConversionEnabled ?? false,
    selectedAccent: currentUser.krispSettings?.selectedAccent || 'en-US',
    voiceTranslationEnabled: currentUser.krispSettings?.voiceTranslationEnabled ?? false,
    vtSourceLanguage: currentUser.krispSettings?.vtSourceLanguage || 'en',
    vtTargetLanguage: currentUser.krispSettings?.vtTargetLanguage || 'es',
    sttActive: false,
    ttsVoiceId: currentUser.krispSettings?.ttsVoiceId || 'en_US_natural',
  }));

  // Krisp Service Status State
  const [krispStatus, setKrispStatus] = useState<KrispStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);

  // STT Live Test State
  const [isSTTRecording, setIsSTTRecording] = useState(false);
  const [sttTranscript, setSttTranscript] = useState('');
  const [sttInterimText, setSttInterimText] = useState('');
  const [sttError, setSttError] = useState('');

  // TTS Synthesis State
  const [ttsText, setTtsText] = useState('Hello! Welcome to ChatTime. This is crystal-clear Krisp speech.');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [ttsError, setTtsError] = useState('');
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Accent Preview & Live DSP Monitor State
  const [previewingAccentId, setPreviewingAccentId] = useState<string | null>(null);
  const [isLiveMicMonitorActive, setIsLiveMicMonitorActive] = useState<boolean>(false);
  const accentAudioRef = useRef<HTMLAudioElement | null>(null);

  const mapAccentCodeToStyle = (accentId: string): string => {
    const map: Record<string, string> = {
      'en-US': 'american',
      'en_US': 'american',
      'en-GB': 'british',
      'en_GB': 'british',
      'en-AU': 'australian',
      'en_AU': 'australian',
      'en-IN': 'indian',
      'en_IN': 'indian',
      'es-ES': 'spanish_spain',
      'es_ES': 'spanish_spain',
      'es-419': 'spanish_latam',
      'es_419': 'spanish_latam',
      'en-NG': 'nigerian',
      'en_NG': 'nigerian',
      'en-GH': 'ghanaian',
      'en_GH': 'ghanaian',
      'en-ZA': 'south_african',
      'en_ZA': 'south_african',
    };
    return map[accentId] || 'american';
  };

  const handlePlayAccentPreview = async (accentId: string, samplePhrase?: string) => {
    if (previewingAccentId === accentId) {
      if (accentAudioRef.current) {
        accentAudioRef.current.pause();
      }
      setPreviewingAccentId(null);
      return;
    }

    setPreviewingAccentId(accentId);
    try {
      const styleId = mapAccentCodeToStyle(accentId);
      const url = `/api/voice/preview-accent?styleId=${encodeURIComponent(styleId)}&format=wav&phrase=${encodeURIComponent(samplePhrase || 'Hello! Testing ChatTime live accent conversion.')}`;
      if (!accentAudioRef.current) {
        accentAudioRef.current = new Audio(url);
      } else {
        accentAudioRef.current.src = url;
      }
      accentAudioRef.current.onended = () => setPreviewingAccentId(null);
      accentAudioRef.current.onerror = () => setPreviewingAccentId(null);
      await accentAudioRef.current.play();
    } catch {
      setPreviewingAccentId(null);
    }
  };

  const handleToggleLiveMicMonitor = async () => {
    const nextVal = !isLiveMicMonitorActive;
    setIsLiveMicMonitorActive(nextVal);
    try {
      if (nextVal) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const track = stream.getAudioTracks()[0];
        if (track) {
          const style = mapAccentCodeToStyle(settings.selectedAccent);
          globalVoiceProcessor.updateSettings({
            voiceStyleId: style,
            pitch: 0,
            speed: 1.0,
            intensity: 1.1,
          });
          await globalVoiceProcessor.attachMicrophoneTrack(track);
          globalVoiceProcessor.setMonitor(true);
          addToast('Live Monitor On', 'Speak into your microphone with headphones on to hear your converted accent.', 'info');
        }
      } else {
        globalVoiceProcessor.setMonitor(false);
      }
    } catch (err: any) {
      setIsLiveMicMonitorActive(false);
      addToast('Microphone Error', err?.message || 'Could not access microphone for live monitoring.', 'error');
    }
  };

  // VT Live Test State
  const [isVTRunning, setIsVTRunning] = useState(false);
  const [vtSourceTranscript, setVtSourceTranscript] = useState('');
  const [vtTranslatedTranscript, setVtTranslatedTranscript] = useState('');
  const [vtError, setVtError] = useState('');

  useEffect(() => {
    loadKrispStatus();
  }, []);

  const loadKrispStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await krispSessionClient.getStatus(true);
      setKrispStatus(status);
    } catch {
      // ignore
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleToggle = (key: keyof KrispVoiceSettings) => {
    const nextVal = !settings[key];
    const newSettings = { ...settings, [key]: nextVal };
    setSettings(newSettings);

    // Apply to RTC adapter
    if (key === 'noiseCancellationOutbound') krispRTCAdapter.setOutboundNoiseCancellation(Boolean(nextVal));
    if (key === 'noiseCancellationInbound') krispRTCAdapter.setInboundNoiseCancellation(Boolean(nextVal));
    if (key === 'voiceIsolationEnabled') krispRTCAdapter.setVoiceIsolation(Boolean(nextVal));
    if (key === 'liveAccentConversionEnabled') {
      krispRTCAdapter.setAccentConversion(Boolean(nextVal), settings.selectedAccent);
      const style = mapAccentCodeToStyle(settings.selectedAccent);
      globalVoiceProcessor.updateSettings({
        voiceStyleId: nextVal ? style : 'original',
      });
      addToast(
        nextVal ? 'Live Accent Conversion Active' : 'Live Accent Conversion Disabled',
        nextVal ? 'Accent voice applied to live microphone & call stream.' : 'Microphone reverted to standard audio.',
        'info'
      );
    }

    updateCurrentUser({
      krispSettings: newSettings,
    });
  };

  const handleSelectAccent = (accentId: string) => {
    const newSettings = { ...settings, selectedAccent: accentId };
    setSettings(newSettings);
    krispRTCAdapter.setAccentConversion(settings.liveAccentConversionEnabled, accentId);
    const style = mapAccentCodeToStyle(accentId);
    globalVoiceProcessor.updateSettings({
      voiceStyleId: settings.liveAccentConversionEnabled ? style : 'original',
    });
    updateCurrentUser({ krispSettings: newSettings });
  };

  // STT Handlers
  const handleToggleSTT = async () => {
    if (isSTTRecording) {
      krispSTTClient.stop();
      setIsSTTRecording(false);
    } else {
      setSttError('');
      setSttTranscript('');
      setSttInterimText('');
      setIsSTTRecording(true);

      const ok = await krispSTTClient.start(
        (event: KrispTranscriptEvent) => {
          if (event.is_final) {
            setSttTranscript((prev) => (prev ? `${prev} ${event.text}` : event.text));
            setSttInterimText('');
          } else {
            setSttInterimText(event.text);
          }
        },
        (err) => {
          setSttError(err);
          setIsSTTRecording(false);
        }
      );

      if (!ok) {
        setIsSTTRecording(false);
      }
    }
  };

  // TTS Handlers
  const handleSynthesizeTTS = async () => {
    if (!ttsText.trim()) return;
    setIsSynthesizing(true);
    setTtsError('');
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      setIsPlayingTTS(false);
    }

    try {
      if (krispStatus?.configured) {
        // Try Krisp Streaming TTS first
        const { audioUrl } = await krispTTSClient.synthesizeSpeech(ttsText, settings.ttsVoiceId);
        setTtsAudioUrl(audioUrl);
        // High-fidelity fallback via server-side Google GenAI TTS & acoustic DSP
        const res = await fetch('/api/voice/synthesize-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: currentUser.id,
            text: ttsText.trim(),
            voiceStyleId: mapAccentCodeToStyle(settings.selectedAccent),
            presentation: 'feminine',
          }),
        });
        const data = await res.json();
        if (res.ok && data.audioBase64) {
          const url = `data:audio/wav;base64,${data.audioBase64}`;
          setTtsAudioUrl(url);
        } else {
          throw new Error(data.error || 'Speech synthesis failed.');
        }
      }
    } catch (err: any) {
      setTtsError(err.message || 'TTS synthesis failed.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePlayTTS = () => {
    if (!ttsAudioUrl) return;
    if (isPlayingTTS) {
      ttsAudioRef.current?.pause();
      setIsPlayingTTS(false);
    } else {
      if (!ttsAudioRef.current) {
        ttsAudioRef.current = new Audio(ttsAudioUrl);
        ttsAudioRef.current.onended = () => setIsPlayingTTS(false);
      } else {
        ttsAudioRef.current.src = ttsAudioUrl;
      }
      ttsAudioRef.current.play().catch(() => {});
      setIsPlayingTTS(true);
    }
  };

  const handleSendTTSAsVoiceNote = () => {
    if (!ttsAudioUrl || !activeChatId) {
      addToast(
        t('openChatFirst', 'Select a Chat'),
        t('openChatDesc', 'Please open a chat to send this generated voice note.'),
        'warning'
      );
      return;
    }

    sendMessage(activeChatId, '', 'voice', {
      mediaUrl: ttsAudioUrl,
      audioDuration: Math.max(Math.round(ttsText.length / 15), 2),
      voiceModifier: '🎙️ Krisp AI Speech',
    });

    addToast(t('voiceSent', 'Voice Note Dispatched'), t('voiceSentDesc', 'AI voice note sent to active conversation!'), 'success');
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-teal-400" />
            <span>{t('voiceAiSettings', 'Voice Changing & Krisp Speech Platform')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time noise cancellation, voice isolation, speech translation, and accent conversion.
          </p>
        </div>

        {/* Global Voice Studio Modal Trigger */}
        <button
          type="button"
          onClick={openVoiceStudio}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-teal-500/20 border border-teal-500/30 text-teal-300 font-bold text-xs hover:border-teal-400 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Launch Voice Studio</span>
        </button>
      </div>

      {/* Service Credentials & Connectivity Status Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          krispStatus?.configured && !krispStatus?.balanceExhausted
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-slate-900 border-amber-500/30 text-slate-300'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                krispStatus?.configured && !krispStatus?.balanceExhausted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Krisp Speech & Audio API Status</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    krispStatus?.configured && !krispStatus?.balanceExhausted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {krispStatus?.configured
                    ? krispStatus.balanceExhausted
                      ? 'Prepaid Credit Needed'
                      : 'Active & Ready'
                    : 'Standby / Credentials Needed'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {krispStatus?.configured
                  ? krispStatus.balanceExhausted
                    ? 'Your Krisp API key is verified, but your Krisp developer prepaid balance is exhausted. Top up your balance at developers.krisp.ai. High-fidelity Web Audio DSP & browser speech fallbacks are active.'
                    : 'Authenticated via secure backend tokens. Live STT, TTS, VT, and RTC pipelines are available.'
                  : 'Backend endpoint is active. Add your private KRISP_API_KEY to enable live Krisp cloud streaming. Built-in WebRTC Opus AEC & Web Audio DSP fallbacks remain fully functional.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadKrispStatus}
            disabled={isLoadingStatus}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Check API Gateway"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. REAL-TIME CALL NOISE CANCELLATION & VOICE ISOLATION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-teal-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white">Call Clarity & Background Noise Reduction</h4>
        </div>

        <div className="space-y-3">
          {/* Outbound Noise Cancellation */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Outbound Noise Cancellation (Microphone)</div>
              <div className="text-[11px] text-slate-400">
                Removes dog barking, fans, traffic, keyboard clicks from your outgoing call audio.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('noiseCancellationOutbound')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.noiseCancellationOutbound ? 'bg-teal-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.noiseCancellationOutbound ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Inbound Noise Cancellation */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Inbound Noise Cancellation (Speaker / Earphone)</div>
              <div className="text-[11px] text-slate-400">
                Filters noise coming from the other participant's noisy environment so you hear them clearly.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('noiseCancellationInbound')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.noiseCancellationInbound ? 'bg-teal-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.noiseCancellationInbound ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Voice Isolation (Viva / BVC) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Voice Isolation (Background Voice Cancellation)</div>
              <div className="text-[11px] text-slate-400">
                Preserves only your voice while cancelling other people talking in the same room.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('voiceIsolationEnabled')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.voiceIsolationEnabled ? 'bg-teal-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  settings.voiceIsolationEnabled ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. LIVE ACCENT CONVERSION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white">Live Call Accent Conversion</h4>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('liveAccentConversionEnabled')}
            className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              settings.liveAccentConversionEnabled
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {settings.liveAccentConversionEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          Adapts pronunciation and accent characteristics during live audio/video calls while preserving your vocal pitch and speaker identity.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(krispStatus?.supportedAccents || [
            { id: 'en-US', name: 'American English', flag: '🇺🇸', krispCode: 'en_US' },
            { id: 'en-GB', name: 'British English', flag: '🇬🇧', krispCode: 'en_GB' },
            { id: 'en-AU', name: 'Australian English', flag: '🇦🇺', krispCode: 'en_AU' },
            { id: 'en-IN', name: 'Indian English', flag: '🇮🇳', krispCode: 'en_IN' },
            { id: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸', krispCode: 'es_ES' },
            { id: 'es-419', name: 'Spanish (Latin America)', flag: '🇲🇽', krispCode: 'es_419' },
          ]).map((acc) => {
            const isSelected = settings.selectedAccent === acc.id;
            const isPlayingThis = previewingAccentId === acc.id;
            return (
              <div
                key={acc.id}
                onClick={() => handleSelectAccent(acc.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 ring-2 ring-amber-500/20 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{acc.flag}</span>
                  <div className="flex items-center gap-1.5">
                    {/* Play Audio Sample Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAccentPreview(acc.id);
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isPlayingThis
                          ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Listen to accent sample"
                    >
                      {isPlayingThis ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                    </button>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </div>
                <div className="text-xs font-bold text-white mt-1.5 truncate">{acc.name}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{acc.krispCode}</div>
              </div>
            );
          })}
        </div>

        {/* Live Audio Test & Mic Monitor Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400">Active Voice Accent: </span>
              <span className="font-bold text-amber-300">
                {(krispStatus?.supportedAccents || []).find((a) => a.id === settings.selectedAccent)?.name || settings.selectedAccent}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handlePlayAccentPreview(settings.selectedAccent)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{previewingAccentId === settings.selectedAccent ? 'Playing Sample...' : 'Hear Accent Sample'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleLiveMicMonitor}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                isLiveMicMonitorActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{isLiveMicMonitorActive ? 'Mic Monitor Active' : 'Hear Myself (Mic)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. REAL-TIME SPEECH-TO-TEXT (STT) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white">Live Speech-to-Text Transcription (STT)</h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">wss://streaming.krisp.ai/stt</span>
        </div>

        <p className="text-[11px] text-slate-400">
          Stream live microphone audio over the documented Krisp WebSocket protocol to receive instantaneous partial and final text transcripts.
        </p>

        {sttError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{sttError}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-h-[80px] max-h-36 overflow-y-auto space-y-1">
          {sttTranscript || sttInterimText ? (
            <p className="text-xs text-white leading-relaxed">
              <span>{sttTranscript}</span>
              {sttInterimText && <span className="text-teal-400 italic font-medium ml-1">{sttInterimText}</span>}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              {isSTTRecording ? 'Listening... Speak into your microphone.' : 'Tap "Start Live Transcription" to test live microphone stream.'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSTT}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              isSTTRecording
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
            }`}
          >
            {isSTTRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop Transcription</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Start Live Transcription</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. REAL-TIME TEXT-TO-SPEECH (TTS) & VOICE NOTE GENERATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white">AI Speech Synthesis (TTS & Voice Notes)</h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">wss://streaming.krisp.ai/tts</span>
        </div>

        <p className="text-[11px] text-slate-400">
          Type any message and convert it into a natural, human-like voice note with full playback and one-tap dispatch into your chat.
        </p>

        {ttsError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{ttsError}</span>
          </div>
        )}

        <textarea
          rows={3}
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          placeholder="Type the message you want spoken aloud..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSynthesizeTTS}
            disabled={isSynthesizing || !ttsText.trim()}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50 transition-opacity cursor-pointer shadow-md shadow-teal-500/20"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Audio...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Synthesize Speech</span>
              </>
            )}
          </button>

          {ttsAudioUrl && (
            <>
              <button
                type="button"
                onClick={handlePlayTTS}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isPlayingTTS ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400 fill-current" />}
                <span>{isPlayingTTS ? 'Pause' : 'Play Speech'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendTTSAsVoiceNote}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send as Voice Note to Chat</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 5. TWO-WAY VOICE TRANSLATION (VT) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white">Real-Time Voice Translation (VT)</h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">wss://streaming.krisp.ai/vt</span>
        </div>

        <p className="text-[11px] text-slate-400">
          Live speech-to-speech bidirectional translation. Translates spoken words into your conversation partner's language in real time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Source Language (Speaking)
            </label>
            <select
              value={settings.vtSourceLanguage}
              onChange={(e) => {
                const s = { ...settings, vtSourceLanguage: e.target.value };
                setSettings(s);
                updateCurrentUser({ krispSettings: s });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
            >
              <option value="en">English</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
              <option value="de">German (Deutsch)</option>
              <option value="pt">Portuguese (Português)</option>
              <option value="zh">Chinese (Mandarin)</option>
              <option value="ja">Japanese (日本語)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="ar">Arabic (العربية)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Target Language (Hearing)
            </label>
            <select
              value={settings.vtTargetLanguage}
              onChange={(e) => {
                const s = { ...settings, vtTargetLanguage: e.target.value };
                setSettings(s);
                updateCurrentUser({ krispSettings: s });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
            >
              <option value="es">Spanish (Español)</option>
              <option value="en">English</option>
              <option value="fr">French (Français)</option>
              <option value="de">German (Deutsch)</option>
              <option value="pt">Portuguese (Português)</option>
              <option value="zh">Chinese (Mandarin)</option>
              <option value="ja">Japanese (日本語)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="ar">Arabic (العربية)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
