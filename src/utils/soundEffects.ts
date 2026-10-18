import { RingtoneStyle } from '../types';

/**
 * Production Web Audio API Sound & Ringtone Engine for ChatTime
 * Supports multiple selectable professional ringtones, outgoing call ringback cadence,
 * volume control, mute/silence controls, and notification chimes.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: number | null = null;
  private outgoingInterval: number | null = null;
  private soundEffectsEnabled: boolean = true;
  private callRingtoneEnabled: boolean = true;
  private ringtoneStyle: RingtoneStyle = 'harmonic';
  private ringtoneVolume: number = 0.8; // 0.0 to 1.0
  private currentRingMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  configure(options: {
    soundEffects?: boolean;
    callRingtone?: boolean;
    ringtoneStyle?: RingtoneStyle;
    ringtoneVolume?: number;
  }) {
    if (options.soundEffects !== undefined) this.soundEffectsEnabled = options.soundEffects;
    if (options.callRingtone !== undefined) this.callRingtoneEnabled = options.callRingtone;
    if (options.ringtoneStyle !== undefined) this.ringtoneStyle = options.ringtoneStyle;
    if (options.ringtoneVolume !== undefined) {
      this.setVolume(options.ringtoneVolume);
    }
  }

  setEnabled(enabled: boolean) {
    this.soundEffectsEnabled = enabled;
  }

  setCallRingtoneEnabled(enabled: boolean) {
    this.callRingtoneEnabled = enabled;
    if (!enabled) {
      this.stopIncomingRingtone();
      this.stopOutgoingRingtone();
    }
  }

  setRingtoneStyle(style: RingtoneStyle) {
    this.ringtoneStyle = style;
  }

  setVolume(vol: number) {
    // Support either 0..1 or 0..100
    const normalized = vol > 1 ? vol / 100 : vol;
    this.ringtoneVolume = Math.max(0, Math.min(1, normalized));
  }

  muteCurrentRing(muted: boolean = true) {
    this.currentRingMuted = muted;
    if (muted) {
      this.stopIncomingRingtone();
      this.stopOutgoingRingtone();
    }
  }

  isRingMuted(): boolean {
    return this.currentRingMuted;
  }

  /**
   * Subtle pleasant sent message "pop"
   */
  playMessageSent() {
    if (!this.soundEffectsEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.12 * this.ringtoneVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  /**
   * Distinctive soft glass double-chime for incoming message or announcement
   */
  playMessageReceived() {
    if (!this.soundEffectsEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.11].forEach((delay, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 659.25 : 987.77, now + delay); // E5 -> B5
        gain.gain.setValueAtTime(0.18 * this.ringtoneVolume, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.22);
      });
    } catch {}
  }

  /**
   * Alias for general notifications
   */
  playNotification() {
    this.playMessageReceived();
  }

  /**
   * Plays a single bar of the specified ringtone style (used for live preview & incoming loop)
   */
  playRingtonePattern(style: RingtoneStyle = this.ringtoneStyle) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const start = this.ctx.currentTime;
      const vol = Math.max(0.05, this.ringtoneVolume * 0.28);

      if (style === 'harmonic') {
        // Warm studio arpeggio (C5 - E5 - G5 - B5 - C6)
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
        notes.forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const sub = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          sub.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start + i * 0.14);
          sub.frequency.setValueAtTime(freq / 2, start + i * 0.14);
          gain.gain.setValueAtTime(vol, start + i * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, start + i * 0.14 + 0.36);
          osc.connect(gain);
          sub.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start + i * 0.14);
          sub.start(start + i * 0.14);
          osc.stop(start + i * 0.14 + 0.36);
          sub.stop(start + i * 0.14 + 0.36);
        });
      } else if (style === 'pulse') {
        // Modern Nordic dual-chord pulse
        const chords = [
          [440, 659.25],
          [440, 659.25],
          [587.33, 880],
        ];
        chords.forEach((pair, idx) => {
          const offset = idx * 0.24;
          pair.forEach((freq) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start + offset);
            gain.gain.setValueAtTime(vol * 0.85, start + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(start + offset);
            osc.stop(start + offset + 0.2);
          });
        });
      } else if (style === 'marimba') {
        // Crisp wooden marimba melody
        const melody = [
          { f: 587.33, t: 0 },
          { f: 783.99, t: 0.12 },
          { f: 880.0, t: 0.24 },
          { f: 1174.66, t: 0.36 },
          { f: 880.0, t: 0.52 },
          { f: 1174.66, t: 0.66 },
        ];
        melody.forEach((n) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(n.f, start + n.t);
          gain.gain.setValueAtTime(vol, start + n.t);
          gain.gain.exponentialRampToValueAtTime(0.001, start + n.t + 0.15);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start + n.t);
          osc.stop(start + n.t + 0.15);
        });
      } else {
        // Executive clean digital bell
        [0, 0.45].forEach((offset) => {
          if (!this.ctx) return;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(783.99, start + offset);
          osc2.frequency.setValueAtTime(1046.5, start + offset);
          gain.gain.setValueAtTime(vol * 0.9, start + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.35);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          osc1.start(start + offset);
          osc2.start(start + offset);
          osc1.stop(start + offset + 0.35);
          osc2.stop(start + offset + 0.35);
        });
      }
    } catch {}
  }

  previewRingtone(style: RingtoneStyle) {
    this.playRingtonePattern(style);
  }

  /**
   * Starts continuous incoming call ringtone loop
   */
  startIncomingRingtone() {
    this.stopIncomingRingtone();
    this.stopOutgoingRingtone();
    this.currentRingMuted = false;

    if (!this.callRingtoneEnabled) return;

    this.playRingtonePattern(this.ringtoneStyle);
    this.ringtoneInterval = window.setInterval(() => {
      if (!this.currentRingMuted && this.callRingtoneEnabled) {
        this.playRingtonePattern(this.ringtoneStyle);
      }
    }, 2200);
  }

  stopIncomingRingtone() {
    if (this.ringtoneInterval !== null) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Starts realistic outgoing ringback tone loop while calling a contact
   */
  startOutgoingRingtone() {
    this.stopOutgoingRingtone();
    this.stopIncomingRingtone();
    this.currentRingMuted = false;

    if (!this.callRingtoneEnabled) return;

    const playRingbackPulse = () => {
      if (this.currentRingMuted || !this.callRingtoneEnabled) return;
      try {
        this.initCtx();
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        gain.gain.setValueAtTime(0.07 * this.ringtoneVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.1);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 1.1);
        osc2.stop(this.ctx.currentTime + 1.1);
      } catch {}
    };

    playRingbackPulse();
    this.outgoingInterval = window.setInterval(playRingbackPulse, 3000);
  }

  stopOutgoingRingtone() {
    if (this.outgoingInterval !== null) {
      clearInterval(this.outgoingInterval);
      this.outgoingInterval = null;
    }
  }

  playDialTone() {
    this.startOutgoingRingtone();
  }

  /**
   * Call connected pleasant chord
   */
  playCallConnected() {
    this.stopIncomingRingtone();
    this.stopOutgoingRingtone();
    if (!this.soundEffectsEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25]; // A major
      notes.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.14 * this.ringtoneVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      });
    } catch {}
  }

  /**
   * Call ended descending chime
   */
  playCallEnded() {
    this.stopIncomingRingtone();
    this.stopOutgoingRingtone();
    if (!this.soundEffectsEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(261.63, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.16 * this.ringtoneVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch {}
  }
}

export const sounds = new SoundManager();
export const soundEffects = sounds;
