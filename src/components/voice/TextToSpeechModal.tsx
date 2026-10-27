import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Volume2,
  Play,
  Square,
  Send,
  Sparkles,
  Crown,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { CHATTIME_VOICE_STYLES } from '../../services/voiceProcessingEngine';
import { krispTTSClient } from '../../services/krispService';
import type { VoicePresentation } from '../../types';

interface TextToSpeechModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVoiceStudio?: () => void;
}

export const TextToSpeechModal: React.FC<TextToSpeechModalProps> = ({
  isOpen,
  onClose,
  onOpenVoiceStudio,
}) => {
  const { currentUser, activeChatId, sendMessage, addToast, theme, t } = useChatTime();

  const [text, setText] = useState<string>('');
  const [ttsEngine, setTtsEngine] = useState<'krisp' | 'regional'>('krisp');
  const [krispVoiceId, setKrispVoiceId] = useState<string>('en_US_natural');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('american');
  const [presentation, setPresentation] = useState<VoicePresentation>('neutral');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [generatedDuration, setGeneratedDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Subscription verification
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isAdminBypass, setIsAdminBypass] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    fetch(`/api/voice/subscription-status?userId=${encodeURIComponent(currentUser.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsPremium(Boolean(data.isPremium));
          setIsAdminBypass(Boolean(data.isAdminBypass));
        }
      })
      .catch(() => {});
  }, [isOpen, currentUser?.id]);

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const selectedStyle =
    CHATTIME_VOICE_STYLES.find((s) => s.id === selectedStyleId) || CHATTIME_VOICE_STYLES[0];

  const handleSynthesize = async () => {
    if (!text.trim()) {
      addToast(t('textRequired', 'Text Required'), 'Please enter some text to speak aloud', 'error');
      return;
    }

    if (!currentUser?.id) {
      addToast(t('authRequired', 'Sign In Required'), 'Please log in to generate AI voice messages', 'error');
      return;
    }

    setIsSynthesizing(true);
    setGeneratedAudioBase64(null);

    if (ttsEngine === 'krisp') {
      try {
        const result = await krispTTSClient.synthesizeSpeech(text.trim(), krispVoiceId);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64Data = reader.result.split(',')[1] || '';
            setGeneratedAudioBase64(base64Data);
            setGeneratedDuration(Math.max(2, Math.round(text.trim().length / 15)));
            addToast(t('speechReady', 'Speech Synthesized'), 'Generated via Krisp Neural TTS streaming', 'success');
          }
        };
        reader.readAsDataURL(result.audioBlob);
      } catch (err: any) {
        console.error('[Krisp TTS] Synthesis failed:', err);
        addToast(t('synthesisFailed', 'Krisp TTS Failed'), err?.message || 'Could not stream speech from Krisp. Verify server KRISP_API_KEY.', 'error');
      } finally {
        setIsSynthesizing(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/voice/synthesize-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          text: text.trim(),
          voiceStyleId: selectedStyle.id,
          presentation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          addToast(t('premiumRequired', 'Voice Premium Required'), data.error, 'error');
          onOpenVoiceStudio?.();
          return;
        }
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      setGeneratedAudioBase64(data.audioBase64);
      setGeneratedDuration(data.durationSec || 3);
      addToast(t('speechReady', 'Speech Synthesized'), `Generated in authentic ${selectedStyle.name}`, 'success');
    } catch (err: any) {
      console.error('[TTS Modal] Synthesis failed:', err);
      addToast(t('synthesisFailed', 'Synthesis Failed'), err?.message || 'Could not generate speech', 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleTogglePlay = () => {
    if (!generatedAudioBase64) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(`data:audio/wav;base64,${generatedAudioBase64}`);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  const handleSendVoiceNote = () => {
    if (!generatedAudioBase64 || !activeChatId) return;

    const audioDataUrl = `data:audio/wav;base64,${generatedAudioBase64}`;
    const modifierLabel =
      ttsEngine === 'krisp'
        ? '🎙️ Krisp AI Neural Speech Note'
        : `${selectedStyle.flag} ${selectedStyle.name} (AI Speech)`;

    sendMessage(activeChatId, '', 'voice', {
      mediaUrl: audioDataUrl,
      audioDuration: generatedDuration,
      voiceModifier: modifierLabel,
    });

    addToast(t('voiceSent', 'Voice Note Sent'), `Sent AI voice note to chat!`, 'success');
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none animate-in fade-in duration-150"
    >
      <div
        className={`w-full max-w-xl rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-md shadow-teal-500/20 shrink-0">
              <Mic className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                AI Speech Generator (TTS)
              </h3>
              <p className="text-[11px] text-slate-400">
                Type text and speak aloud using authentic human-like AI voices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Subscription Notice if not subscribed */}
          {!isPremium && !isAdminBypass && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <strong className="block text-amber-300">Voice Premium Feature</strong>
                Speech synthesis requires an active Voice Premium pass (from ₦1,000/week).
                {onOpenVoiceStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVoiceStudio();
                    }}
                    className="mt-1 block text-teal-400 font-bold underline cursor-pointer hover:text-teal-300"
                  >
                    View Voice Premium Plans &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TTS Engine Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Speech Synthesis Engine</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTtsEngine('krisp')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  ttsEngine === 'krisp'
                    ? 'bg-teal-500/20 border-teal-400 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Krisp AI Streaming</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-400 text-slate-950 font-extrabold">Official</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  wss://streaming.krisp.ai/tts (24kHz HD)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTtsEngine('regional')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  ttsEngine === 'regional'
                    ? 'bg-teal-500/20 border-teal-400 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Regional Accents</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Formant</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  US, UK, Scottish, African, Spanish
                </div>
              </button>
            </div>
          </div>

          {/* Text input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Text to Speak</span>
              <span className="text-[10px] text-slate-500 font-mono">{text.length}/1000 chars</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              placeholder="Type what you want your AI voice to say naturally..."
              rows={3}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500 resize-none transition-colors"
            />
          </div>

          {/* Accent & Voice Selection */}
          {ttsEngine === 'krisp' ? (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Krisp Neural Model Voice
              </label>
              <select
                value={krispVoiceId}
                onChange={(e) => setKrispVoiceId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="en_US_natural">🇺🇸 American English (Natural Conversational)</option>
                <option value="en_GB_natural">🇬🇧 British English (Crystal Clarity)</option>
                <option value="es_ES_natural">🇪🇸 Spanish (Castilian Apical)</option>
                <option value="en_AU_natural">🇦🇺 Australian English (Open Cadence)</option>
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Regional Accent
                </label>
                <select
                  value={selectedStyleId}
                  onChange={(e) => setSelectedStyleId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  {CHATTIME_VOICE_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.flag} {s.name} ({s.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Voice Presentation
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['feminine', 'masculine'] as VoicePresentation[]).map((pres) => (
                    <button
                      key={pres}
                      type="button"
                      onClick={() => setPresentation(pres)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border text-center ${
                        presentation === pres
                          ? 'bg-teal-500 text-slate-950 border-teal-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {pres}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            disabled={isSynthesizing || !text.trim()}
            onClick={handleSynthesize}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all disabled:opacity-50"
          >
            {isSynthesizing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing Studio Audio...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Speech ({selectedStyle.name})</span>
              </>
            )}
          </button>

          {/* Audio Player and Send to Chat Action */}
          {generatedAudioBase64 && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Audio Ready (~{generatedDuration}s)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">24kHz WAV</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-teal-400" />
                      <span>Listen to Generated Audio</span>
                    </>
                  )}
                </button>

                {activeChatId && (
                  <button
                    type="button"
                    onClick={handleSendVoiceNote}
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send as Voice Note</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Disclosure */}
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1">
            <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              Generated voice messages are labeled as AI speech in chats and are separate from live call audio.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
