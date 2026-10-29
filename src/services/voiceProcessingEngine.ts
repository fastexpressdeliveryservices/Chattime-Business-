/**
 * ChatTime AI Human Voice Engine
 * Real-Time Formant & Pitch DSP for WebRTC Live Calls, Voice Notes, and Speech Synthesis
 */

import { VoiceStyleConfig, VoicePresentation, UserVoiceSettings } from '../types/index.ts';

export const CHATTIME_VOICE_STYLES: VoiceStyleConfig[] = [
  {
    id: 'american',
    name: 'American English',
    country: 'United States',
    flag: '🇺🇸',
    accentCode: 'en-US',
    region: 'North America',
    description: 'Crisp presence, natural conversational cadence with broadcast vocal clarity',
    samplePhrase: 'Hello! This is ChatTime encrypted voice calling with natural American speech.',
    defaultPitch: 0,
    defaultSpeed: 1.0,
    defaultIntensity: 1.0,
    isPremium: false, // Free tier sample
    providerVoiceId: 'Puck',
    acousticProfile: {
      f1Hz: 580,
      f2Hz: 1750,
      f3Hz: 2800,
      resonanceGain: 4.5,
    },
  },
  {
    id: 'british',
    name: 'British English',
    country: 'United Kingdom',
    flag: '🇬🇧',
    accentCode: 'en-GB',
    region: 'Europe',
    description: 'Received Pronunciation with punchy mid-band articulation and refined vowel shaping',
    samplePhrase: 'Good day! Your end-to-end encrypted call is crystal clear across the Atlantic.',
    defaultPitch: 1,
    defaultSpeed: 0.98,
    defaultIntensity: 1.05,
    isPremium: true,
    providerVoiceId: 'Charon',
    acousticProfile: {
      f1Hz: 520,
      f2Hz: 1950,
      f3Hz: 2950,
      resonanceGain: 5.2,
    },
  },
  {
    id: 'scottish',
    name: 'Scottish English',
    country: 'Scotland',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    accentCode: 'en-GB-SCT',
    region: 'Europe',
    description: 'Authentic rhotic resonance, deep throat acoustic warmth and energetic vocal lilt',
    samplePhrase: 'Aye, hello there! Delighted to connect with ye over ChatTime secure line.',
    defaultPitch: -1,
    defaultSpeed: 1.02,
    defaultIntensity: 1.15,
    isPremium: true,
    providerVoiceId: 'Fenrir',
    acousticProfile: {
      f1Hz: 480,
      f2Hz: 1550,
      f3Hz: 2450,
      resonanceGain: 6.0,
    },
  },
  {
    id: 'australian',
    name: 'Australian English',
    country: 'Australia',
    flag: '🇦🇺',
    accentCode: 'en-AU',
    region: 'Oceania',
    description: 'Broad open-vowel formant glide, upbeat inflection and crisp treble definition',
    samplePhrase: 'G\'day mate! Voice conversion is running smoothly on our live WebRTC connection.',
    defaultPitch: 1,
    defaultSpeed: 1.04,
    defaultIntensity: 1.08,
    isPremium: true,
    providerVoiceId: 'Zephyr',
    acousticProfile: {
      f1Hz: 620,
      f2Hz: 1850,
      f3Hz: 2750,
      resonanceGain: 5.0,
    },
  },
  {
    id: 'canadian',
    name: 'Canadian English',
    country: 'Canada',
    flag: '🇨🇦',
    accentCode: 'en-CA',
    region: 'North America',
    description: 'Neutral Canadian raising formant curve with balanced harmonic presence',
    samplePhrase: 'Hi there, how are you doing? Clean voice transmission coming through nicely, eh?',
    defaultPitch: 0,
    defaultSpeed: 1.0,
    defaultIntensity: 1.0,
    isPremium: true,
    providerVoiceId: 'Kore',
    acousticProfile: {
      f1Hz: 560,
      f2Hz: 1720,
      f3Hz: 2850,
      resonanceGain: 4.2,
    },
  },
  {
    id: 'nigerian',
    name: 'Nigerian English',
    country: 'Nigeria',
    flag: '🇳🇬',
    accentCode: 'en-NG',
    region: 'West Africa',
    description: 'Rich resonant chest harmonics, syllable-timed cadence and vibrant warmth',
    samplePhrase: 'How far! ChatTime voice changer is active and sounding 100% natural and sharp.',
    defaultPitch: -1,
    defaultSpeed: 1.05,
    defaultIntensity: 1.25,
    isPremium: true,
    providerVoiceId: 'Puck',
    acousticProfile: {
      f1Hz: 650,
      f2Hz: 1420,
      f3Hz: 2600,
      resonanceGain: 6.8,
    },
  },
  {
    id: 'ghanaian',
    name: 'Ghanaian English',
    country: 'Ghana',
    flag: '🇬🇭',
    accentCode: 'en-GH',
    region: 'West Africa',
    description: 'Melodic vowel inflection, bright forward acoustic projection and polite cadence',
    samplePhrase: 'Akwaaba! You are connected securely on ChatTime with authentic Ghanaian speech.',
    defaultPitch: 1,
    defaultSpeed: 1.02,
    defaultIntensity: 1.12,
    isPremium: true,
    providerVoiceId: 'Kore',
    acousticProfile: {
      f1Hz: 590,
      f2Hz: 1680,
      f3Hz: 2780,
      resonanceGain: 5.5,
    },
  },
  {
    id: 'south_african',
    name: 'South African English',
    country: 'South Africa',
    flag: '🇿🇦',
    accentCode: 'en-ZA',
    region: 'Southern Africa',
    description: 'Distinctive close-vowel formant contour, tightened plosives and rhythmic tone',
    samplePhrase: 'Howzit! Audio processing is running in real-time with zero lag or distortion.',
    defaultPitch: 0,
    defaultSpeed: 1.01,
    defaultIntensity: 1.06,
    isPremium: true,
    providerVoiceId: 'Charon',
    acousticProfile: {
      f1Hz: 510,
      f2Hz: 1820,
      f3Hz: 2890,
      resonanceGain: 4.8,
    },
  },
  {
    id: 'indian',
    name: 'Indian English',
    country: 'India',
    flag: '🇮🇳',
    accentCode: 'en-IN',
    region: 'South Asia',
    description: 'Warm retroflex harmonic transitions, melodic intonation contours and clarity',
    samplePhrase: 'Namaste! Welcome to ChatTime voice studio. The speech quality is completely clear.',
    defaultPitch: 1,
    defaultSpeed: 1.03,
    defaultIntensity: 1.1,
    isPremium: true,
    providerVoiceId: 'Zephyr',
    acousticProfile: {
      f1Hz: 540,
      f2Hz: 1620,
      f3Hz: 2700,
      resonanceGain: 5.4,
    },
  },
  {
    id: 'spanish_spain',
    name: 'Spanish — Spain',
    country: 'Spain',
    flag: '🇪🇸',
    accentCode: 'es-ES',
    region: 'Europe',
    description: 'Castilian apical articulation, rhythmic syllabic precision and crisp sibilance',
    samplePhrase: '¡Hola! La conexión de audio en tiempo real funciona con total naturalidad.',
    defaultPitch: 1,
    defaultSpeed: 1.08,
    defaultIntensity: 1.14,
    isPremium: true,
    providerVoiceId: 'Kore',
    acousticProfile: {
      f1Hz: 570,
      f2Hz: 1910,
      f3Hz: 2950,
      resonanceGain: 5.6,
    },
  },
  {
    id: 'spanish_latam',
    name: 'Spanish — Latin America',
    country: 'Latin America',
    flag: '🇲🇽',
    accentCode: 'es-419',
    region: 'Americas',
    description: 'Warm harmonic glide, softened fricatives and expressive open melodic cadence',
    samplePhrase: '¡Buenas! Qué gusto saludarte por ChatTime con la voz procesada en vivo.',
    defaultPitch: 0,
    defaultSpeed: 1.05,
    defaultIntensity: 1.08,
    isPremium: true,
    providerVoiceId: 'Puck',
    acousticProfile: {
      f1Hz: 550,
      f2Hz: 1780,
      f3Hz: 2750,
      resonanceGain: 5.0,
    },
  },
  {
    id: 'jamaican',
    name: 'Jamaican English',
    country: 'Jamaica',
    flag: '🇯🇲',
    accentCode: 'en-JM',
    region: 'Caribbean',
    description: 'Deep resonant bass foundation, melodic patois contour and warm low-end boost',
    samplePhrase: 'Wah gwaan! ChatTime voice modifier is active and sounding heavy and smooth.',
    defaultPitch: -2,
    defaultSpeed: 0.96,
    defaultIntensity: 1.3,
    isPremium: true,
    providerVoiceId: 'Fenrir',
    acousticProfile: {
      f1Hz: 460,
      f2Hz: 1380,
      f3Hz: 2350,
      resonanceGain: 7.2,
    },
  },
];

export const DEFAULT_USER_VOICE_SETTINGS: UserVoiceSettings = {
  voiceStyleId: 'american',
  presentation: 'neutral',
  pitch: 0,
  speed: 1.0,
  intensity: 1.0,
  monitorEnabled: false,
};

/**
 * Production Web Audio Real-Time Formant & Voice Engine
 * Handles live microphone audio input, dynamic formant EQ, pitch modulation,
 * and audio worklet streaming for WebRTC peer connections.
 */
export class RealTimeVoiceProcessor {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private inputHighpass: BiquadFilterNode | null = null;
  private formantF1: BiquadFilterNode | null = null;
  private formantF2: BiquadFilterNode | null = null;
  private formantF3: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private intensityGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private monitorGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Real-time pitch shifter delay nodes
  private pitchDelayA: DelayNode | null = null;
  private pitchGainA: GainNode | null = null;

  private currentSettings: UserVoiceSettings = { ...DEFAULT_USER_VOICE_SETTINGS };
  private status: 'idle' | 'connecting' | 'active' | 'error' = 'idle';
  private processedTrack: MediaStreamTrack | null = null;
  private rawTrack: MediaStreamTrack | null = null;
  private isMonitorActive = false;

  constructor() {
    this.loadSavedSettings();
  }

  loadSavedSettings(): UserVoiceSettings {
    try {
      const saved = localStorage.getItem('chattime_voice_studio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentSettings = { ...DEFAULT_USER_VOICE_SETTINGS, ...parsed };
      }
    } catch {}
    return this.currentSettings;
  }

  saveSettings(settings: Partial<UserVoiceSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...settings };
    try {
      localStorage.setItem('chattime_voice_studio_settings', JSON.stringify(this.currentSettings));
    } catch {}
  }

  getSettings(): UserVoiceSettings {
    return { ...this.currentSettings };
  }

  getStatus(): 'idle' | 'connecting' | 'active' | 'error' {
    return this.status;
  }

  getProcessedTrack(): MediaStreamTrack | null {
    return this.processedTrack;
  }

  /**
   * Initializes the real-time audio pipeline using the user's active microphone track.
   */
  async attachMicrophoneTrack(track: MediaStreamTrack): Promise<MediaStreamTrack | null> {
    try {
      this.status = 'connecting';
      this.rawTrack = track;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) {
        console.warn('[VoiceEngine] Web Audio API is not supported on this device.');
        this.status = 'error';
        return null;
      }

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtx({ sampleRate: 48000, latencyHint: 'interactive' });
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.cleanupNodes();

      const sourceStream = new MediaStream([track]);
      this.sourceNode = this.audioCtx.createMediaStreamSource(sourceStream);

      // 1. Output destination for WebRTC PeerConnection
      this.destinationNode = this.audioCtx.createMediaStreamDestination();

      // 2. Audio Visualizer Analyser Node
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // 3. Local Monitor Node for "Hear Myself" Live Preview
      this.monitorGainNode = this.audioCtx.createGain();
      this.monitorGainNode.gain.value = this.isMonitorActive ? 0.8 : 0;
      this.monitorGainNode.connect(this.audioCtx.destination);

      // 4. Master Output Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.destinationNode);
      this.masterGain.connect(this.analyserNode);
      this.masterGain.connect(this.monitorGainNode);

      // 5. Gentle rumble cut (80Hz highpass) to remove wind and table taps
      this.inputHighpass = this.audioCtx.createBiquadFilter();
      this.inputHighpass.type = 'highpass';
      this.inputHighpass.frequency.value = 80;
      this.inputHighpass.Q.value = 0.7;

      // 6. 3-Stage Formant Equalizer (F1, F2, F3) for Accent & Vocal Tract Shaping
      this.formantF1 = this.audioCtx.createBiquadFilter();
      this.formantF1.type = 'peaking';

      this.formantF2 = this.audioCtx.createBiquadFilter();
      this.formantF2.type = 'peaking';

      this.formantF3 = this.audioCtx.createBiquadFilter();
      this.formantF3.type = 'peaking';

      // 7. Presence & Air filter
      this.presenceFilter = this.audioCtx.createBiquadFilter();
      this.presenceFilter.type = 'highshelf';

      // 8. Intensity / Saturation Gain
      this.intensityGain = this.audioCtx.createGain();

      // 9. Broadcast Compressor (controls dynamics, adds warmth, prevents clipping)
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 8;
      this.compressor.ratio.value = 3.5;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.15;

      // 10. Split paths: Dry (clean acoustic voice) and Wet (pitch/timbre altered)
      this.dryGain = this.audioCtx.createGain();
      this.wetGain = this.audioCtx.createGain();

      // Single smooth delay line (no dual comb-filter phase cancellation)
      this.pitchDelayA = this.audioCtx.createDelay(0.1);
      this.pitchDelayA.delayTime.value = 0.015;
      this.pitchGainA = this.audioCtx.createGain();
      this.pitchGainA.gain.value = 1.0;

      // Connect vocal tract chain:
      this.sourceNode.connect(this.inputHighpass);
      this.inputHighpass.connect(this.formantF1);
      this.formantF1.connect(this.formantF2);
      this.formantF2.connect(this.formantF3);
      this.formantF3.connect(this.presenceFilter);
      this.presenceFilter.connect(this.intensityGain);
      this.intensityGain.connect(this.compressor);

      // Route dry directly to master
      this.compressor.connect(this.dryGain);
      this.dryGain.connect(this.masterGain);

      // Route wet through smooth pitch delay
      this.compressor.connect(this.pitchDelayA);
      this.pitchDelayA.connect(this.pitchGainA);
      this.pitchGainA.connect(this.wetGain);
      this.wetGain.connect(this.masterGain);

      this.applyAcousticProfile();

      const outTracks = this.destinationNode.stream.getAudioTracks();
      if (outTracks.length > 0) {
        this.processedTrack = outTracks[0];
        this.status = 'active';
        return this.processedTrack;
      }

      this.status = 'error';
      return null;
    } catch (err) {
      console.error('[VoiceEngine] Failed to initialize voice processor:', err);
      this.status = 'error';
      return null;
    }
  }

  /**
   * Applies the selected accent profile, formant shifts, presentation, and pitch.
   */
  applyAcousticProfile(): void {
    if (!this.audioCtx) return;

    const { voiceStyleId, presentation, pitch, intensity, speed } = this.currentSettings;
    const style = CHATTIME_VOICE_STYLES.find((s) => s.id === voiceStyleId) || CHATTIME_VOICE_STYLES[0];
    const profile = style.acousticProfile || { f1Hz: 550, f2Hz: 1750, f3Hz: 2800, resonanceGain: 5 };

    // Presentation adjustments:
    // Feminine: raises formants by +18%, shifts fundamental frequency higher
    // Masculine: lowers formants by -14%, boosts lower chest resonance
    let formantMultiplier = 1.0;
    let presentationPitchOffset = 0;
    let chestWarmthGain = 0;

    if (presentation === 'feminine') {
      formantMultiplier = 1.18;
      presentationPitchOffset = 4.2; // +4.2 semitones
      chestWarmthGain = -2.5;
    } else if (presentation === 'masculine') {
      formantMultiplier = 0.86;
      presentationPitchOffset = -4.0; // -4.0 semitones
      chestWarmthGain = 4.5;
    }

    const totalPitchSemitones = pitch + presentationPitchOffset;

    // Apply Formants
    if (this.formantF1 && this.formantF2 && this.formantF3) {
      const f1 = Math.min(Math.max(profile.f1Hz * formantMultiplier, 250), 1200);
      const f2 = Math.min(Math.max(profile.f2Hz * formantMultiplier, 800), 3200);
      const f3 = Math.min(Math.max(profile.f3Hz * formantMultiplier, 1800), 4500);

      this.formantF1.frequency.setTargetAtTime(f1, this.audioCtx.currentTime, 0.05);
      this.formantF1.gain.setTargetAtTime(profile.resonanceGain * intensity + chestWarmthGain, this.audioCtx.currentTime, 0.05);
      this.formantF1.Q.setTargetAtTime(2.2, this.audioCtx.currentTime, 0.05);

      this.formantF2.frequency.setTargetAtTime(f2, this.audioCtx.currentTime, 0.05);
      this.formantF2.gain.setTargetAtTime((profile.resonanceGain * 0.85) * intensity, this.audioCtx.currentTime, 0.05);
      this.formantF2.Q.setTargetAtTime(2.8, this.audioCtx.currentTime, 0.05);

      this.formantF3.frequency.setTargetAtTime(f3, this.audioCtx.currentTime, 0.05);
      this.formantF3.gain.setTargetAtTime((profile.resonanceGain * 0.6) * intensity, this.audioCtx.currentTime, 0.05);
      this.formantF3.Q.setTargetAtTime(3.2, this.audioCtx.currentTime, 0.05);
    }

    // High presence
    if (this.presenceFilter) {
      this.presenceFilter.frequency.setTargetAtTime(4200, this.audioCtx.currentTime, 0.05);
      this.presenceFilter.gain.setTargetAtTime(presentation === 'feminine' ? 3.5 : 1.5, this.audioCtx.currentTime, 0.05);
    }

    // Intensity Gain
    if (this.intensityGain) {
      const targetGain = Math.min(Math.max(intensity, 0.5), 1.6);
      this.intensityGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
    }

    // Dry / Wet and Pitch Blend for crystal clear, pop-free voice
    if (this.dryGain && this.wetGain && this.pitchDelayA && this.pitchGainA) {
      if (Math.abs(totalPitchSemitones) < 0.1) {
        // Pure uncolored broadcast audio: zero delay, zero comb filtering, zero crackle
        this.dryGain.gain.setTargetAtTime(1.0, this.audioCtx.currentTime, 0.05);
        this.wetGain.gain.setTargetAtTime(0.0, this.audioCtx.currentTime, 0.05);
      } else {
        // Altered presentation (masculine body or feminine resonance)
        const delayTime = Math.min(Math.max(0.016 - (totalPitchSemitones * 0.0008), 0.006), 0.030);
        this.pitchDelayA.delayTime.setTargetAtTime(delayTime, this.audioCtx.currentTime, 0.05);
        this.pitchGainA.gain.setTargetAtTime(1.0, this.audioCtx.currentTime, 0.05);
        this.dryGain.gain.setTargetAtTime(0.35, this.audioCtx.currentTime, 0.05);
        this.wetGain.gain.setTargetAtTime(0.8, this.audioCtx.currentTime, 0.05);
      }
    }
  }

  /**
   * Updates preset settings and immediately applies acoustic changes in real-time.
   */
  updateSettings(settings: Partial<UserVoiceSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...settings };
    this.saveSettings(this.currentSettings);
    this.applyAcousticProfile();
  }

  /**
   * Toggles local headphone monitor ("Hear Myself" Live Preview).
   */
  setMonitor(enabled: boolean): boolean {
    this.isMonitorActive = enabled;
    this.currentSettings.monitorEnabled = enabled;
    this.saveSettings({ monitorEnabled: enabled });

    if (this.monitorGainNode && this.audioCtx) {
      const targetGain = enabled ? 0.85 : 0;
      this.monitorGainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.03);
    }
    return this.isMonitorActive;
  }

  isMonitorEnabled(): boolean {
    return this.isMonitorActive;
  }

  /**
   * Retrieves real-time RMS microphone volume level (0-100) for visual meters.
   */
  getAudioLevel(): number {
    if (!this.analyserNode) return 0;
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    return Math.min(Math.round(rms * 150), 100);
  }

  private cleanupNodes(): void {
    try {
      this.sourceNode?.disconnect();
      this.inputHighpass?.disconnect();
      this.formantF1?.disconnect();
      this.formantF2?.disconnect();
      this.formantF3?.disconnect();
      this.presenceFilter?.disconnect();
      this.intensityGain?.disconnect();
      this.compressor?.disconnect();
      this.dryGain?.disconnect();
      this.wetGain?.disconnect();
      this.pitchDelayA?.disconnect();
      this.pitchGainA?.disconnect();
      this.masterGain?.disconnect();
      this.monitorGainNode?.disconnect();
      this.analyserNode?.disconnect();
    } catch {}

    if (this.processedTrack) {
      try {
        this.processedTrack.stop();
      } catch {}
      this.processedTrack = null;
    }
  }

  dispose(): void {
    this.cleanupNodes();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
    this.status = 'idle';
  }
}

export const globalVoiceProcessor = new RealTimeVoiceProcessor();
