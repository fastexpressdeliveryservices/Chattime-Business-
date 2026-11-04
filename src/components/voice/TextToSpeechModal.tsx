import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Volume2,
  Play,
  Square,
  Send,
  Sparkles,
  AlertCircle,
  Check,
  User as UserIcon,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { CHATTIME_VOICE_STYLES } from '../../services/voiceProcessingEngine';

interface TextToSpeechModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVoiceStudio?: () => void;
}

export const TextToSpeechModal: React.FC<TextToSpeechModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, activeChatId, sendMessage, addToast, theme, t } = useChatTime();

  const [text, setText] = useState<string>('');
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('american');
  const [isSpeakingWebSpeech, setIsSpeakingWebSpeech] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [generatedDuration, setGeneratedDuration] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any active speech on unmount or close
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const selectedStyle =
    CHATTIME_VOICE_STYLES.find((s) => s.id === selectedStyleId) || CHATTIME_VOICE_STYLES[0];

  // Native Web Speech Synthesis with realistic human Female / Male voice selection
  const speakWithWebSpeech = (phrase: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      addToast('Speech Unsupported', 'Web Speech API is not supported in this browser.', 'error');
      return;
    }

    window.speechSynthesis.cancel();

    if (isSpeakingWebSpeech) {
      setIsSpeakingWebSpeech(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    const voices = window.speechSynthesis.getVoices();

    const isFem = voiceGender === 'female';

    // Intelligent voice matcher for Female vs Male
    let matchedVoice: SpeechSynthesisVoice | undefined;

    if (isFem) {
      matchedVoice = voices.find((v) =>
        /female|samantha|victoria|zira|karen|moira|google us english|alloy/i.test(v.name)
      ) || voices.find((v) => v.lang.startsWith('en') && !/male|david|alex|daniel|fred|george/i.test(v.name));
    } else {
      matchedVoice = voices.find((v) =>
        /male|alex|david|daniel|george|fred|google uk english male|echo/i.test(v.name)
      ) || voices.find((v) => v.lang.startsWith('en') && /david|alex|daniel|george/i.test(v.name));
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    // Realistic natural vocal inflection
    utterance.pitch = isFem ? 1.15 : 0.92;
    utterance.rate = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeakingWebSpeech(true);
    utterance.onend = () => setIsSpeakingWebSpeech(false);
    utterance.onerror = () => setIsSpeakingWebSpeech(false);

    window.speechSynthesis.speak(utterance);
  };

  // Synthesize studio audio via server route for voice note sending
  const handleSynthesizeStudioAudio = async () => {
    if (!text.trim()) {
      addToast(t('textRequired', 'Text Required'), 'Please enter message text to speak aloud', 'error');
      return;
    }

    setIsSynthesizing(true);
    setGeneratedAudioBase64(null);

    // Speak aloud immediately so the user hears it right away
    speakWithWebSpeech(text.trim());

    try {
      const res = await fetch('/api/voice/synthesize-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: currentUser?.id,
          text: text.trim(),
          voiceStyleId: selectedStyle.id,
          presentation: voiceGender === 'female' ? 'feminine' : 'masculine',
        }),
      });

      const data = await res.json();
      if (res.ok && data.audioBase64) {
        setGeneratedAudioBase64(data.audioBase64);
        setGeneratedDuration(data.durationSec || Math.max(2, Math.round(text.trim().length / 14)));
        addToast(
          'Voice Synthesized',
          `Spoken in articulate ${voiceGender === 'female' ? 'Female 👩' : 'Male 👨'} voice (${selectedStyle.name})`,
          'success'
        );
      }
    } catch (err: any) {
      console.warn('[TTS] Server audio synthesis note:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleTogglePlayAudio = () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (generatedAudioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${generatedAudioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => {});
      setIsPlayingAudio(true);
    } else {
      speakWithWebSpeech(text.trim());
    }
  };

  const handleSendVoiceNote = async () => {
    if (!text.trim() || !activeChatId) return;

    let base64ToSend = generatedAudioBase64;
    let dur = generatedDuration || Math.max(2, Math.round(text.trim().length / 14));

    if (!base64ToSend) {
      try {
        const res = await fetch('/api/voice/synthesize-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: currentUser?.id,
            text: text.trim(),
            voiceStyleId: selectedStyle.id,
            presentation: voiceGender === 'female' ? 'feminine' : 'masculine',
          }),
        });
        const data = await res.json();
        if (data.audioBase64) {
          base64ToSend = data.audioBase64;
          dur = data.durationSec || dur;
        }
      } catch (e) {
        console.warn('[TTS] send error:', e);
      }
    }

    if (!base64ToSend) {
      // Send text message with speech note if audio conversion unavailable
      sendMessage(activeChatId, text.trim(), 'text');
      addToast('Message Sent', 'Sent to chat!', 'success');
      onClose();
      return;
    }

    const audioDataUrl = `data:audio/wav;base64,${base64ToSend}`;
    const modifierLabel = `${voiceGender === 'female' ? '👩 Female' : '👨 Male'} Voice (${selectedStyle.name})`;

    sendMessage(activeChatId, text.trim(), 'voice', {
      mediaUrl: audioDataUrl,
      audioDuration: dur,
      voiceModifier: modifierLabel,
    });

    addToast(t('voiceSent', 'Voice Note Sent'), `Sent voice message in ${voiceGender === 'female' ? 'Female' : 'Male'} voice!`, 'success');
    onClose();
  };

  const samplePhrases = [
    'Hey! How are you doing today?',
    'Thank you for reaching out, ChatTime is online and ready.',
    'Let me know when you are free for a quick chat!',
    'Everything is set and working smoothly.',
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          window.speechSynthesis?.cancel();
          onClose();
        }
      }}
      className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none animate-in fade-in duration-150"
    >
      <div
        className={`w-full max-w-lg rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-md shadow-teal-500/20 shrink-0">
              <Volume2 className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Voice Speech (Female & Male)
              </h3>
              <p className="text-[11px] text-slate-400">
                Speaks typed text in natural human female or male voice
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[82vh]">
          {/* Female vs Male Voice Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Choose Voice Gender
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setVoiceGender('female');
                  if (text.trim()) speakWithWebSpeech(text.trim());
                }}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all cursor-pointer ${
                  voiceGender === 'female'
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20 scale-[1.02]'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-lg">👩</span>
                <span>Female Voice</span>
                {voiceGender === 'female' && <Check className="w-4 h-4 text-slate-950" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVoiceGender('male');
                  if (text.trim()) speakWithWebSpeech(text.trim());
                }}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all cursor-pointer ${
                  voiceGender === 'male'
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20 scale-[1.02]'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-lg">👨</span>
                <span>Male Voice</span>
                {voiceGender === 'male' && <Check className="w-4 h-4 text-slate-950" />}
              </button>
            </div>
          </div>

          {/* Regional Accent Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Accent / Regional Style
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

          {/* Text Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Message Text to Speak
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {text.length}/500 chars
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              placeholder="Type your message here... The voice will speak these words clearly."
              rows={3}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500 resize-none transition-colors"
            />
          </div>

          {/* Quick preset suggestions */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Quick suggestions:</span>
            <div className="flex flex-wrap gap-1.5">
              {samplePhrases.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => {
                    setText(phrase);
                    speakWithWebSpeech(phrase);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-[11px] text-slate-300 hover:text-teal-300 transition-colors text-left truncate max-w-full cursor-pointer"
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              disabled={!text.trim()}
              onClick={() => {
                if (isSpeakingWebSpeech) {
                  window.speechSynthesis?.cancel();
                  setIsSpeakingWebSpeech(false);
                } else {
                  speakWithWebSpeech(text.trim());
                }
              }}
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-700 disabled:opacity-40"
            >
              {isSpeakingWebSpeech ? (
                <>
                  <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <span>Stop Speaking</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-teal-400" />
                  <span>Speak Aloud ({voiceGender === 'female' ? 'Female 👩' : 'Male 👨'})</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSynthesizing || !text.trim()}
              onClick={handleSendVoiceNote}
              className="py-3 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/25 active:scale-98 transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>Send as Voice Note</span>
            </button>
          </div>

          {/* Ready Audio Indicator */}
          {generatedAudioBase64 && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-xs">
              <span className="text-teal-300 flex items-center gap-1.5 font-semibold">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                Audio note generated ({generatedDuration}s)
              </span>
              <button
                type="button"
                onClick={handleTogglePlayAudio}
                className="text-xs font-bold text-teal-300 hover:underline cursor-pointer flex items-center gap-1"
              >
                {isPlayingAudio ? 'Pause' : 'Replay Audio'}
              </button>
            </div>
          )}

          {/* Privacy note */}
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1">
            <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              Voice synthesis articulates naturally using high-definition voice profiles.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
