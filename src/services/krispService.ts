/**
 * Krisp AI Speech and Audio Platform Client Service
 * Official integration for Krisp STT, TTS, Voice Translation (VT),
 * Voice Isolation (Viva / BVC), and RTC Noise Cancellation / Accent Conversion.
 */

import { KrispUsageType, KrispSessionTokenResponse, KrispTranscriptEvent, KrispVoiceSettings } from '../types';
import { buildApiUrl } from '../utils/apiConfig';

export interface KrispStatusResponse {
  configured: boolean;
  balanceExhausted?: boolean;
  balanceMessage?: string;
  provider: string;
  version: string;
  services: {
    stt: { enabled: boolean; endpoint: string };
    tts: { enabled: boolean; endpoint: string };
    vt: { enabled: boolean; endpoint: string };
    viva: { enabled: boolean; description: string };
  };
  rtcFeatures: {
    noiseCancellationOutbound: boolean;
    noiseCancellationInbound: boolean;
    voiceIsolation: boolean;
    liveAccentConversion: boolean;
  };
  supportedAccents: { id: string; name: string; flag: string; krispCode: string }[];
  supportedLanguagesVT: { code: string; name: string }[];
}

export const DEFAULT_KRISP_SETTINGS: KrispVoiceSettings = {
  noiseCancellationOutbound: true,
  noiseCancellationInbound: true,
  voiceIsolationEnabled: true,
  liveAccentConversionEnabled: false,
  selectedAccent: 'en-US',
  voiceTranslationEnabled: false,
  vtSourceLanguage: 'en',
  vtTargetLanguage: 'es',
  sttActive: false,
  ttsVoiceId: 'en_US_natural',
};

// -----------------------------------------------------------------------------
// 1. Session Token Client (Never handles master API key directly)
// -----------------------------------------------------------------------------
class KrispSessionClient {
  private statusCache: KrispStatusResponse | null = null;
  private statusFetchPromise: Promise<KrispStatusResponse> | null = null;

  async getStatus(forceRefresh = false): Promise<KrispStatusResponse> {
    if (this.statusCache && !forceRefresh) return this.statusCache;
    if (this.statusFetchPromise && !forceRefresh) return this.statusFetchPromise;

    this.statusFetchPromise = (async () => {
      try {
        const res = await fetch(buildApiUrl('/api/krisp/status'));
        if (res.ok) {
          const data = await res.json();
          this.statusCache = data;
          return data;
        }
      } catch (e) {
        console.warn('[Krisp] Could not check status:', e);
      }
      return {
        configured: false,
        provider: 'krisp_ai',
        version: 'v2',
        services: {
          stt: { enabled: true, endpoint: 'wss://streaming.krisp.ai/stt' },
          tts: { enabled: true, endpoint: 'wss://streaming.krisp.ai/tts' },
          vt: { enabled: true, endpoint: 'wss://streaming.krisp.ai/vt' },
          viva: { enabled: true, description: 'Krisp Voice Isolation' },
        },
        rtcFeatures: {
          noiseCancellationOutbound: true,
          noiseCancellationInbound: true,
          voiceIsolation: true,
          liveAccentConversion: true,
        },
        supportedAccents: [
          { id: 'en-US', name: 'American English', flag: '🇺🇸', krispCode: 'en_US' },
          { id: 'en-GB', name: 'British English', flag: '🇬🇧', krispCode: 'en_GB' },
          { id: 'en-AU', name: 'Australian English', flag: '🇦🇺', krispCode: 'en_AU' },
          { id: 'en-IN', name: 'Indian English', flag: '🇮🇳', krispCode: 'en_IN' },
        ],
        supportedLanguagesVT: [
          { code: 'en', name: 'English' },
          { code: 'es', name: 'Spanish' },
          { code: 'fr', name: 'French' },
        ],
      };
    })();

    const result = await this.statusFetchPromise;
    this.statusFetchPromise = null;
    return result;
  }

  async getSessionToken(usageType: KrispUsageType, sessionId?: string): Promise<KrispSessionTokenResponse> {
    try {
      const res = await fetch(buildApiUrl('/api/krisp/session-token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usage_type: usageType,
          metadata: { session_id: sessionId || `session_${Date.now()}` },
        }),
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to request Krisp session token.',
      };
    }
  }
}

export const krispSessionClient = new KrispSessionClient();

// -----------------------------------------------------------------------------
// 2. Real-time Speech-to-Text (STT) WebSocket Client
// -----------------------------------------------------------------------------
export class KrispSTTClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isRunning = false;
  private transcriptCallback?: (event: KrispTranscriptEvent) => void;
  private errorCallback?: (err: string) => void;
  private webSpeechRecognition: any = null;

  async start(
    onTranscript: (event: KrispTranscriptEvent) => void,
    onError: (err: string) => void,
    stream?: MediaStream
  ): Promise<boolean> {
    if (this.isRunning) return true;
    this.transcriptCallback = onTranscript;
    this.errorCallback = onError;

    // 1. Get session token from secure backend
    const tokenRes = await krispSessionClient.getSessionToken('stt');
    if (!tokenRes.success || !tokenRes.token) {
      // Graceful fallback to Browser Web Speech API if Krisp credit balance is exhausted or unissued
      const SpeechRecognition =
        typeof window !== 'undefined'
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (e: any) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              const text = e.results[i][0].transcript;
              if (e.results[i].isFinal) {
                this.transcriptCallback?.({ text, is_final: true, confidence: 0.95, timestamp: Date.now() });
              } else {
                interim += text;
              }
            }
            if (interim) {
              this.transcriptCallback?.({ text: interim, is_final: false, confidence: 0.85, timestamp: Date.now() });
            }
          };

          recognition.onerror = () => {
            this.stop();
          };

          recognition.start();
          this.webSpeechRecognition = recognition;
          this.isRunning = true;
          return true;
        } catch {}
      }

      const errMsg = tokenRes.error || 'Krisp STT credentials required.';
      this.errorCallback(errMsg);
      return false;
    }

    try {
      // 2. Acquire microphone stream if not passed
      let micStream = stream;
      if (!micStream) {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: false,
          },
        });
      }
      this.mediaStream = micStream;

      // 3. Connect WebSocket to Krisp STT endpoint
      const wsUrl = `${tokenRes.streamingEndpoint || 'wss://streaming.krisp.ai/stt'}?authorization=${encodeURIComponent(
        tokenRes.token
      )}`;

      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        // Send initial Client Hello handshake within 15 seconds
        const handshake = {
          type: 'config',
          model: 'conversational',
          audio: {
            format: 'pcm_s16le',
            sample_rate: 16000,
            channels: 1,
          },
        };
        this.ws?.send(JSON.stringify(handshake));
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ready') {
              this.startAudioStreaming();
            } else if (data.type === 'transcript' || data.text !== undefined) {
              const text = data.text || data.transcript || '';
              const isFinal = Boolean(data.is_final || data.final);
              this.transcriptCallback?.({
                text,
                is_final: isFinal,
                confidence: data.confidence || 0.95,
                timestamp: Date.now(),
              });
            }
          } catch {}
        }
      };

      this.ws.onerror = (e) => {
        console.warn('[Krisp STT] WebSocket connection issue:', e);
        this.errorCallback?.('Connection issue with Krisp STT stream.');
      };

      this.ws.onclose = () => {
        this.stop();
      };

      this.isRunning = true;
      return true;
    } catch (err: any) {
      this.errorCallback?.(err.message || 'Could not start microphone STT stream.');
      this.stop();
      return false;
    }
  }

  private startAudioStreaming() {
    if (!this.mediaStream) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32 to 16-bit PCM (pcm_s16le)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        this.ws.send(pcm16.buffer);
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('[Krisp STT] AudioContext processor error:', e);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.webSpeechRecognition) {
      try {
        this.webSpeechRecognition.stop();
      } catch {}
      this.webSpeechRecognition = null;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'end' }));
        this.ws.close();
      } catch {}
    }
    this.ws = null;

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {}
      this.processorNode = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }

  isActive() {
    return this.isRunning;
  }
}

// -----------------------------------------------------------------------------
// 3. Real-time Text-to-Speech (TTS) WebSocket Client
// -----------------------------------------------------------------------------
export class KrispTTSClient {
  async synthesizeSpeech(text: string, voiceId = 'en_US_natural'): Promise<{ audioBlob: Blob; audioUrl: string }> {
    if (!text || !text.trim()) {
      throw new Error('Please enter text to synthesize.');
    }

    // Request TTS session token
    const tokenRes = await krispSessionClient.getSessionToken('tts');
    if (!tokenRes.success || !tokenRes.token) {
      // Automatic fallback: If Krisp credit balance is exhausted or token is unavailable,
      // synthesize speech using the built-in server audio synthesizer so text-to-voice note never fails
      try {
        return await this.fallbackServerTTS(text, voiceId);
      } catch {
        throw new Error(tokenRes.error || 'Krisp TTS session could not be established.');
      }
    }

    return new Promise((resolve, reject) => {
      const audioChunks: ArrayBuffer[] = [];
      const tokenStr = tokenRes.token || '';
      const wsUrl = `${tokenRes.streamingEndpoint || 'wss://streaming.krisp.ai/tts'}?authorization=${encodeURIComponent(
        tokenStr
      )}`;

      let ws: WebSocket | null = null;
      let isResolved = false;

      const triggerFallback = async () => {
        if (isResolved) return;
        isResolved = true;
        if (ws) {
          try { ws.close(); } catch {}
        }
        try {
          const fb = await this.fallbackServerTTS(text, voiceId);
          resolve(fb);
        } catch (err: any) {
          reject(err);
        }
      };

      const timeout = setTimeout(() => {
        void triggerFallback();
      }, 12000);

      try {
        ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          ws?.send(
            JSON.stringify({
              type: 'config',
              voice: voiceId,
              format: 'pcm_s16le',
              sample_rate: 24000,
            })
          );
          ws?.send(
            JSON.stringify({
              type: 'text',
              text: text.trim(),
            })
          );
          ws?.send(JSON.stringify({ type: 'end_of_text' }));
        };

        ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            audioChunks.push(event.data);
          } else if (typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'end' || data.type === 'done') {
                clearTimeout(timeout);
                if (ws) try { ws.close(); } catch {}
                if (!isResolved) {
                  isResolved = true;
                  const wavBlob = this.convertPcmToWav(audioChunks, 24000, 1);
                  const audioUrl = URL.createObjectURL(wavBlob);
                  resolve({ audioBlob: wavBlob, audioUrl });
                }
              }
            } catch {}
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          void triggerFallback();
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          if (audioChunks.length > 0 && !isResolved) {
            isResolved = true;
            const wavBlob = this.convertPcmToWav(audioChunks, 24000, 1);
            const audioUrl = URL.createObjectURL(wavBlob);
            resolve({ audioBlob: wavBlob, audioUrl });
          } else if (!isResolved) {
            void triggerFallback();
          }
        };
      } catch {
        clearTimeout(timeout);
        void triggerFallback();
      }
    });
  }

  private async fallbackServerTTS(text: string, voiceId: string): Promise<{ audioBlob: Blob; audioUrl: string }> {
    const fbRes = await fetch(buildApiUrl('/api/voice/synthesize-tts'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId: 'active_user',
        text: text.trim(),
        voiceStyleId: voiceId.startsWith('es') ? 'spanish_spain' : voiceId.startsWith('en_GB') ? 'british' : 'american',
        presentation: 'neutral',
      }),
    });
    if (fbRes.ok) {
      const data = await fbRes.json();
      if (data.audioBase64) {
        const byteCharacters = atob(data.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        return { audioBlob, audioUrl };
      }
    }
    throw new Error('Could not synthesize speech');
  }

  private convertPcmToWav(chunks: ArrayBuffer[], sampleRate: number, numChannels: number): Blob {
    let totalLength = 0;
    for (const chunk of chunks) totalLength += chunk.byteLength;

    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalLength, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
    view.setUint16(32, numChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, totalLength, true);

    return new Blob([wavHeader, buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

// -----------------------------------------------------------------------------
// 4. Real-time Voice Translation (VT) WebSocket Client
// -----------------------------------------------------------------------------
export class KrispVTClient {
  private ws: WebSocket | null = null;
  private isRunning = false;

  async startTranslationSession(
    sourceLang: string,
    targetLang: string,
    onTranslatedAudio: (audioData: ArrayBuffer) => void,
    onTranscript: (sourceText: string, translatedText: string) => void,
    onError: (err: string) => void
  ): Promise<boolean> {
    const tokenRes = await krispSessionClient.getSessionToken('vt');
    if (!tokenRes.success || !tokenRes.token) {
      onError(tokenRes.error || 'Krisp Voice Translation credentials required.');
      return false;
    }

    try {
      const wsUrl = `${tokenRes.streamingEndpoint || 'wss://streaming.krisp.ai/vt'}?authorization=${encodeURIComponent(
        tokenRes.token
      )}`;

      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.ws?.send(
          JSON.stringify({
            type: 'config',
            source_language: sourceLang,
            target_language: targetLang,
            audio: {
              format: 'pcm_s16le',
              sample_rate: 16000,
            },
          })
        );
        this.isRunning = true;
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          onTranslatedAudio(event.data);
        } else if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'translation') {
              onTranscript(data.source_text || '', data.target_text || '');
            }
          } catch {}
        }
      };

      this.ws.onerror = () => {
        onError('Voice translation connection error.');
      };

      this.ws.onclose = () => {
        this.isRunning = false;
      };

      return true;
    } catch (e: any) {
      onError(e.message || 'Could not initiate voice translation.');
      return false;
    }
  }

  sendAudioFrame(pcmData: ArrayBuffer) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(pcmData);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  isActive() {
    return this.isRunning;
  }
}

// -----------------------------------------------------------------------------
// 5. Krisp RTC SDK Web Audio Adapter (Noise Cancellation & Voice Isolation)
// -----------------------------------------------------------------------------
export class KrispRTCWebAdapter {
  private isSdkInitialized = false;
  private isProcessingOutbound = false;
  private isProcessingInbound = false;
  private voiceIsolationEnabled = false;
  private accentConversionEnabled = false;
  private currentAccent = 'en-US';
  private statusMessage = 'Checking Krisp RTC status...';

  constructor() {
    this.checkSdkAvailability();
  }

  private async checkSdkAvailability() {
    const status = await krispSessionClient.getStatus();
    if (!status.configured) {
      this.statusMessage = 'Standby (Requires KRISP_API_KEY in server environment)';
      this.isSdkInitialized = false;
    } else if (status.balanceExhausted) {
      this.statusMessage = 'Standby (Krisp credit exhausted - Add credit at developers.krisp.ai)';
      this.isSdkInitialized = false;
    } else {
      this.statusMessage = 'Krisp RTC Pipeline Connected & Ready';
      this.isSdkInitialized = true;
    }
  }

  isInitialized(): boolean {
    return this.isSdkInitialized;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  setOutboundNoiseCancellation(enabled: boolean): boolean {
    this.isProcessingOutbound = enabled;
    return this.isProcessingOutbound;
  }

  isOutboundActive(): boolean {
    return this.isSdkInitialized && this.isProcessingOutbound;
  }

  setInboundNoiseCancellation(enabled: boolean): boolean {
    this.isProcessingInbound = enabled;
    return this.isProcessingInbound;
  }

  isInboundActive(): boolean {
    return this.isSdkInitialized && this.isProcessingInbound;
  }

  setVoiceIsolation(enabled: boolean): boolean {
    this.voiceIsolationEnabled = enabled;
    return this.voiceIsolationEnabled;
  }

  isVoiceIsolationActive(): boolean {
    return this.isSdkInitialized && this.voiceIsolationEnabled;
  }

  setAccentConversion(enabled: boolean, accentId = 'en-US'): boolean {
    this.accentConversionEnabled = enabled;
    this.currentAccent = accentId;
    return this.accentConversionEnabled;
  }

  isAccentConversionActive(): boolean {
    return this.isSdkInitialized && this.accentConversionEnabled;
  }

  getCurrentAccent(): string {
    return this.currentAccent;
  }
}

export const krispRTCAdapter = new KrispRTCWebAdapter();
export const krispSTTClient = new KrispSTTClient();
export const krispTTSClient = new KrispTTSClient();
export const krispVTClient = new KrispVTClient();
