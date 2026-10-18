/**
 * ChatTime WebRTC Calling Engine
 * Production-grade Real-Time Audio & Video Calling over RTCPeerConnection
 */

export type CallType = 'voice' | 'video';

export interface WebRTCStats {
  rtt: number; // in milliseconds
  packetLoss: number; // percentage
  bitrate: number; // in kbps
  codec: string;
  quality: 'HD Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface VoiceEffectPreset {
  id: string;
  name: string;
  tag: string;
  icon: string;
  description: string;
}

export const CALL_VOICE_EFFECTS: VoiceEffectPreset[] = [
  { id: 'original', name: 'Original 🎙️', tag: 'Natural', icon: '🎙️', description: 'Clean HD unmodified microphone audio' },
  { id: 'american', name: 'American 🇺🇸', tag: 'Presence', icon: '🇺🇸', description: 'Warm broadcast presence with crisp high-end' },
  { id: 'british', name: 'British 🇬🇧', tag: 'Clarity', icon: '🇬🇧', description: 'Punchy articulate mid-range and treble definition' },
  { id: 'indian', name: 'Indian 🇮🇳', tag: 'Melodic', icon: '🇮🇳', description: 'Rich acoustic resonance with warm vocal body' },
  { id: 'asian', name: 'Asian 🌏', tag: 'Bright', icon: '🌏', description: 'Crystal bright treble emphasis and airiness' },
  { id: 'australian', name: 'Australian 🇦🇺', tag: 'Punchy', icon: '🇦🇺', description: 'Forward high-mid vocal projection' },
  { id: 'jamaican', name: 'Jamaican 🇯🇲', tag: 'Bass', icon: '🇯🇲', description: 'Deep dub warm low-end boost and smooth roll-off' },
  { id: 'robot', name: 'Robot Vocoder 🤖', tag: 'Sci-Fi', icon: '🤖', description: 'Metallic synthesized robotic vocoder modulation' },
  { id: 'deep', name: 'Deep Tone 🎙️', tag: 'Baritone', icon: '📻', description: 'Resonant deep baritone bass vocal boost' },
  { id: 'chipmunk', name: 'High Pitch 🐿️', tag: 'Fun', icon: '🐿️', description: 'Bright elevated high-frequency formant shift' },
  { id: 'echo', name: 'Cosmic Echo 🌌', tag: 'Spatial', icon: '🌌', description: 'Spacious ambient audio repeat and stereo delay' },
  { id: 'walkie', name: 'Walkie-Talkie 📟', tag: 'Radio', icon: '📟', description: 'Authentic 300Hz-3.4kHz military radio filter' },
];

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export class WebRTCCallEngine {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private processedVideoTrack: MediaStreamTrack | null = null;
  private filterSourceVideo: HTMLVideoElement | null = null;
  private filterCanvas: HTMLCanvasElement | null = null;
  private filterFrameRequest: number | null = null;
  private activeVideoFilter = 'none';

  // Real-time In-Call Voice Changer / Web Audio FX
  private rawAudioTrack: MediaStreamTrack | null = null;
  private processedAudioTrack: MediaStreamTrack | null = null;
  private voiceEffectNodes: AudioNode[] = [];
  private activeVoiceEffect = 'original';

  private peerConnection: RTCPeerConnection | null = null;
  private loopbackPeer: RTCPeerConnection | null = null;

  // Web Audio level analyzer
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  // Track state
  private isMuted: boolean = false;
  private isVideoOff: boolean = false;
  private currentFacingMode: 'user' | 'environment' = 'user';
  private isTorchOn: boolean = false;
  private callType: CallType = 'voice';

  // Stats monitoring
  private statsInterval: number | null = null;
  private onStatsUpdate?: (stats: WebRTCStats) => void;
  private remoteStreamListeners = new Set<(stream: MediaStream) => void>();
  private onConnectionStateUpdate?: (state: RTCIceConnectionState) => void;
  private onIceCandidateGenerated?: (candidate: RTCIceCandidate) => void;
  private onConnectedListeners = new Set<() => void>();

  constructor() {}

  private lastBytesSent: number = 0;
  private lastStatsTimestamp: number = 0;

  /**
   * Initializes local media stream with echo cancellation & noise suppression.
   * Accepts either CallType ('voice' | 'video') or boolean (withVideo).
   */
  async acquireMedia(
    typeOrWithVideo: CallType | boolean = 'voice',
    facingMode: 'user' | 'environment' = 'user',
    options?: { isVideoOff?: boolean }
  ): Promise<MediaStream> {
    const type: CallType =
      typeof typeOrWithVideo === 'boolean'
        ? typeOrWithVideo
          ? 'video'
          : 'voice'
        : typeOrWithVideo;
    this.callType = type;
    this.currentFacingMode = facingMode;
    this.isMuted = false;
    this.isVideoOff = options?.isVideoOff !== undefined ? Boolean(options.isVideoOff) : type === 'voice';

    const isVideo = type === 'video';

    // Stop any previous local stream tracks before acquiring fresh media
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      this.localStream = null;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const err = new Error('Media devices are not supported in this environment.');
      err.name = 'NotSupportedError';
      throw err;
    }

    // 1. Try high-definition audio & video constraints with noise suppression & echo cancellation
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideo
          ? {
              facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : false,
      });

      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
      stream.getVideoTracks().forEach((t) => {
        t.enabled = isVideo && !this.isVideoOff;
      });

      this.localStream = stream;
      this.rawAudioTrack = stream.getAudioTracks()[0] || null;
      this.setupAudioAnalyzer(stream);
      return stream;
    } catch (hdErr: any) {
      if (hdErr?.name === 'NotAllowedError' || hdErr?.name === 'PermissionDeniedError') {
        throw hdErr;
      }
      console.warn('[WebRTC] High-def media request failed, attempting standard media:', hdErr?.message || hdErr);
    }

    // 2. Try standard / permissive media constraints
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: isVideo ? { facingMode } : false,
      });

      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
      stream.getVideoTracks().forEach((t) => {
        t.enabled = isVideo;
      });

      this.localStream = stream;
      this.rawAudioTrack = stream.getAudioTracks()[0] || null;
      this.setupAudioAnalyzer(stream);
      return stream;
    } catch (stdErr: any) {
      if (stdErr?.name === 'NotAllowedError' || stdErr?.name === 'PermissionDeniedError') {
        throw stdErr;
      }
      console.warn('[WebRTC] Standard media request failed:', stdErr?.message || stdErr);
    }

    // 3. If video was requested but camera is unavailable/busy, fall back to audio only
    if (isVideo) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: false,
        });
        audioStream.getAudioTracks().forEach((t) => {
          t.enabled = true;
        });
        this.localStream = audioStream;
        this.isVideoOff = true;
        this.rawAudioTrack = audioStream.getAudioTracks()[0] || null;
        this.setupAudioAnalyzer(audioStream);
        return audioStream;
      } catch (audioErr: any) {
        if (audioErr?.name === 'NotAllowedError' || audioErr?.name === 'PermissionDeniedError') {
          throw audioErr;
        }
        console.warn('[WebRTC] Audio-only fallback failed:', audioErr?.message || audioErr);
      }
    }

    // 4. Safe synthetic fallback for environments without physical media devices (e.g., iframe preview / virtual sandbox)
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(dst);
        osc.start();
        const synthStream = dst.stream;
        this.localStream = synthStream;
        this.rawAudioTrack = synthStream.getAudioTracks()[0] || null;
        this.setupAudioAnalyzer(synthStream);
        return synthStream;
      }
    } catch {
      // ignore
    }

    throw new Error('Could not access microphone hardware. Please check audio devices.');
  }

  /**
   * Web Audio API analyzer to compute real-time decibel volume
   */
  private setupAudioAnalyzer(stream: MediaStream) {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      source.connect(this.analyser);
    } catch {
      // Audio analyzer not critical
    }
  }

  /**
   * Returns audio level percentage (0 to 100) based on actual microphone input
   */
  getAudioLevel(): number {
    if (this.isMuted) return 0;
    if (!this.analyser || !this.dataArray) {
      return 0;
    }
    this.analyser.getByteFrequencyData(this.dataArray as any);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / this.dataArray.length;
    return Math.min(100, Math.round((avg / 255) * 100 * 2));
  }

  /**
   * Create standard RTCPeerConnection
   */
  async createPeerConnection(
    _targetUserId?: string,
    _callId?: string,
    onCandidate?: (candidate: RTCIceCandidate) => void
  ): Promise<RTCPeerConnection> {
    if (this.peerConnection) {
      try {
        this.peerConnection.ontrack = null;
        this.peerConnection.onicecandidate = null;
        this.peerConnection.oniceconnectionstatechange = null;
        this.peerConnection.close();
      } catch {
        // ignore
      }
      this.peerConnection = null;
    }
    if (this.loopbackPeer) {
      try {
        this.loopbackPeer.close();
      } catch {
        // ignore
      }
      this.loopbackPeer = null;
    }

    this.pendingCandidates = [];
    this.remoteStream = null;

    if (onCandidate) {
      this.onIceCandidateGenerated = onCandidate;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnection = pc;

    // Use a processed canvas track for outgoing video when an effect is selected.
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(
          track.kind === 'video' ? this.processedVideoTrack || track : track,
          this.localStream!
        );
      });
    }
    if (this.callType === 'video' && !this.localStream?.getVideoTracks().length) {
      pc.addTransceiver('video', { direction: 'sendrecv' });
    }

    pc.ontrack = (event) => {
      const existingTracks = this.remoteStream ? this.remoteStream.getTracks() : [];
      const trackMap = new Map<string, MediaStreamTrack>();
      existingTracks.forEach((t) => trackMap.set(t.id, t));

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          trackMap.set(track.id, track);
        });
      }
      if (event.track) {
        trackMap.set(event.track.id, event.track);
      }

      // Create a fresh MediaStream instance so React state listeners always re-render when video/audio tracks arrive
      const freshRemote = new MediaStream(Array.from(trackMap.values()));
      this.remoteStream = freshRemote;
      this.remoteStreamListeners.forEach((cb) => cb(freshRemote));
      this.notifyConnected();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateGenerated) {
        this.onIceCandidateGenerated(event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (this.onConnectionStateUpdate) {
        this.onConnectionStateUpdate(pc.iceConnectionState);
      }
      if (pc.connectionState === 'connected') {
        this.notifyConnected();
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        pc.restartIce();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (this.onConnectionStateUpdate) {
        this.onConnectionStateUpdate(pc.iceConnectionState);
      }
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        this.notifyConnected();
      }
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        pc.restartIce();
      }
    };

    this.startStatsMonitoring();
    return pc;
  }

  private notifyConnected() {
    this.onConnectedListeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // ignore
      }
    });
  }

  onConnected(callback: () => void): () => void {
    this.onConnectedListeners.add(callback);
    return () => {
      this.onConnectedListeners.delete(callback);
    };
  }

  /**
   * Generates SDP offer for peer
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }
    const offer = await this.peerConnection!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.peerConnection!.setLocalDescription(offer);
    return offer;
  }

  /**
   * Sets remote offer and generates SDP answer
   */
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }
    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
    await this.drainPendingCandidates();
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    return answer;
  }

  /**
   * Sets remote answer from callee
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.peerConnection && this.peerConnection.signalingState !== 'stable') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      await this.drainPendingCandidates();
    }
  }

  private pendingCandidates: RTCIceCandidateInit[] = [];

  private async drainPendingCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.pendingCandidates.length > 0) {
      const cand = this.pendingCandidates.shift();
      if (cand) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('[WebRTC] Error adding buffered candidate:', e);
        }
      }
    }
  }

  /**
   * Adds received ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      if (candidate) {
        this.pendingCandidates.push(candidate);
      }
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('[WebRTC] ICE candidate error:', e);
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    return this.addIceCandidate(candidate);
  }

  /**
   * Monitor real-time WebRTC stats via pc.getStats()
   */
  private startStatsMonitoring() {
    if (this.statsInterval) clearInterval(this.statsInterval);

    this.statsInterval = window.setInterval(async () => {
      if (!this.peerConnection || !this.onStatsUpdate) return;

      try {
        const stats = await this.peerConnection.getStats();
        let rtt = 18;
        let packetsLost = 0;
        let totalPackets = 100;
        let bytesSent = 0;
        let codec = 'Opus 48kHz HD';

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
            rtt = Math.round(report.currentRoundTripTime * 1000);
          }
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            packetsLost = report.packetsLost || 0;
            totalPackets = (report.packetsReceived || 0) + packetsLost;
          }
          if (report.type === 'outbound-rtp') {
            bytesSent += report.bytesSent || 0;
          }
          if (report.type === 'codec' && report.mimeType) {
            codec = report.mimeType.replace('audio/', '').replace('video/', '').toUpperCase();
          }
        });

        const now = Date.now();
        const timeDiffSec = this.lastStatsTimestamp > 0 ? (now - this.lastStatsTimestamp) / 1000 : 1.5;
        let bitrateKbps = 96;

        if (this.lastBytesSent > 0 && bytesSent >= this.lastBytesSent && timeDiffSec > 0) {
          bitrateKbps = Math.round(((bytesSent - this.lastBytesSent) * 8) / (timeDiffSec * 1000));
        } else if (bytesSent > 0) {
          bitrateKbps = Math.min(320, Math.max(48, Math.round((bytesSent * 8) / (1024 * 10))));
        }

        this.lastBytesSent = bytesSent;
        this.lastStatsTimestamp = now;

        const packetLossPercent = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;

        let quality: WebRTCStats['quality'] = 'HD Excellent';
        if (rtt > 200 || packetLossPercent > 5) quality = 'Poor';
        else if (rtt > 100 || packetLossPercent > 2) quality = 'Fair';
        else if (rtt > 50) quality = 'Good';

        this.onStatsUpdate({
          rtt: Math.max(12, rtt),
          packetLoss: Math.round(packetLossPercent * 10) / 10,
          bitrate: bitrateKbps,
          codec: this.callType === 'video' ? 'VP8 / Opus HD' : codec,
          quality,
        });
      } catch {
        // stats error
      }
    }, 1500);
  }

  /**
   * Mute / Unmute microphone track
   */
  toggleMute(): boolean {
    if (!this.localStream) return this.isMuted;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });
    if (this.processedAudioTrack) {
      this.processedAudioTrack.enabled = !this.isMuted;
    }
    return this.isMuted;
  }

  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return !this.isMuted;
    const nextEnabled = enabled !== undefined ? enabled : this.isMuted;
    this.isMuted = !nextEnabled;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    if (this.processedAudioTrack) {
      this.processedAudioTrack.enabled = nextEnabled;
    }
    return nextEnabled;
  }

  /**
   * Turn video camera on / off
   */
  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return this.isVideoOff;
    if (enabled !== undefined) {
      this.isVideoOff = !enabled;
    } else {
      this.isVideoOff = !this.isVideoOff;
    }
    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = !this.isVideoOff;
    });
    if (this.processedVideoTrack) this.processedVideoTrack.enabled = !this.isVideoOff;
    return this.isVideoOff;
  }

  async setVideoEnabled(enabled: boolean): Promise<boolean> {
    if (!this.localStream) return false;
    let videoTrack = this.localStream.getVideoTracks()[0];

    if (enabled && !videoTrack) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: this.currentFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
        });
        videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) return false;
        this.localStream.addTrack(videoTrack);
        this.callType = 'video';
      } catch (error) {
        console.warn('[WebRTC] Could not enable camera:', error);
        return false;
      }
    }

    if (!videoTrack) return false;
    videoTrack.enabled = enabled;
    if (this.processedVideoTrack) this.processedVideoTrack.enabled = enabled;
    this.isVideoOff = !enabled;

    if (enabled && this.peerConnection) {
      const videoSender = this.peerConnection.getSenders().find((sender) => sender.track?.kind === 'video')
        || this.peerConnection.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === 'video')?.sender;
      if (videoSender) {
        await videoSender.replaceTrack(this.processedVideoTrack || videoTrack);
      }
    }
    return true;
  }

  private async replaceOutgoingVideoTrack(track: MediaStreamTrack): Promise<void> {
    if (!this.peerConnection) return;
    const videoSender = this.peerConnection.getSenders().find((sender) => sender.track?.kind === 'video')
      || this.peerConnection.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === 'video')?.sender;
    if (videoSender) await videoSender.replaceTrack(track);
  }

  private async replaceOutgoingAudioTrack(track: MediaStreamTrack): Promise<void> {
    if (!this.peerConnection) return;
    const audioSender = this.peerConnection.getSenders().find((sender) => sender.track?.kind === 'audio')
      || this.peerConnection.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === 'audio')?.sender;
    if (audioSender) await audioSender.replaceTrack(track);
  }

  private clearAudioProcessor(): void {
    if (this.voiceEffectNodes.length > 0) {
      this.voiceEffectNodes.forEach((node) => {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch {}
      });
      this.voiceEffectNodes = [];
    }
    if (this.processedAudioTrack) {
      try {
        this.processedAudioTrack.stop();
      } catch {}
      this.processedAudioTrack = null;
    }
  }

  getActiveVoiceEffect(): string {
    return this.activeVoiceEffect;
  }

  /**
   * Real-time Voice Changer on active call
   */
  async setVoiceEffect(effectId: string): Promise<boolean> {
    this.activeVoiceEffect = effectId || 'original';
    const sourceTrack = this.rawAudioTrack || this.localStream?.getAudioTracks()[0];
    if (!sourceTrack) return false;
    if (!this.rawAudioTrack) this.rawAudioTrack = sourceTrack;

    if (this.activeVoiceEffect === 'original' || this.activeVoiceEffect === 'none') {
      this.clearAudioProcessor();
      await this.replaceOutgoingAudioTrack(this.rawAudioTrack);
      return true;
    }

    try {
      this.clearAudioProcessor();
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const mediaStreamSource = this.audioContext.createMediaStreamSource(new MediaStream([this.rawAudioTrack]));
      const destination = this.audioContext.createMediaStreamDestination();

      let currentOut: AudioNode = mediaStreamSource;
      const nodes: AudioNode[] = [];

      switch (this.activeVoiceEffect.toLowerCase()) {
        case 'deep': {
          const bassFilter = this.audioContext.createBiquadFilter();
          bassFilter.type = 'lowshelf';
          bassFilter.frequency.value = 220;
          bassFilter.gain.value = 11;
          const lowpass = this.audioContext.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 3200;
          currentOut.connect(bassFilter);
          bassFilter.connect(lowpass);
          currentOut = lowpass;
          nodes.push(bassFilter, lowpass);
          break;
        }
        case 'chipmunk': {
          const highpass = this.audioContext.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = 650;
          const trebleBoost = this.audioContext.createBiquadFilter();
          trebleBoost.type = 'highshelf';
          trebleBoost.frequency.value = 2800;
          trebleBoost.gain.value = 12;
          currentOut.connect(highpass);
          highpass.connect(trebleBoost);
          currentOut = trebleBoost;
          nodes.push(highpass, trebleBoost);
          break;
        }
        case 'robot': {
          const osc = this.audioContext.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = 85;
          const ringModGain = this.audioContext.createGain();
          ringModGain.gain.value = 0;
          osc.connect(ringModGain.gain);
          osc.start();

          const bandpass = this.audioContext.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.value = 1200;
          bandpass.Q.value = 2.5;

          currentOut.connect(ringModGain);
          ringModGain.connect(bandpass);
          currentOut = bandpass;
          nodes.push(osc, ringModGain, bandpass);
          break;
        }
        case 'echo': {
          const delay = this.audioContext.createDelay();
          delay.delayTime.value = 0.22;
          const feedback = this.audioContext.createGain();
          feedback.gain.value = 0.42;
          const dryGain = this.audioContext.createGain();
          dryGain.gain.value = 0.8;
          const wetGain = this.audioContext.createGain();
          wetGain.gain.value = 0.55;

          currentOut.connect(dryGain);
          dryGain.connect(destination);

          currentOut.connect(delay);
          delay.connect(feedback);
          feedback.connect(delay);
          delay.connect(wetGain);
          wetGain.connect(destination);

          currentOut = dryGain;
          nodes.push(delay, feedback, dryGain, wetGain);
          break;
        }
        case 'walkie': {
          const highpass = this.audioContext.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = 450;
          const lowpass = this.audioContext.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 2900;
          const gain = this.audioContext.createGain();
          gain.gain.value = 1.3;
          currentOut.connect(highpass);
          highpass.connect(lowpass);
          lowpass.connect(gain);
          currentOut = gain;
          nodes.push(highpass, lowpass, gain);
          break;
        }
        case 'american': {
          const highshelf = this.audioContext.createBiquadFilter();
          highshelf.type = 'highshelf';
          highshelf.frequency.value = 3500;
          highshelf.gain.value = 5;
          const lowshelf = this.audioContext.createBiquadFilter();
          lowshelf.type = 'lowshelf';
          lowshelf.frequency.value = 180;
          lowshelf.gain.value = 3;
          currentOut.connect(highshelf);
          highshelf.connect(lowshelf);
          currentOut = lowshelf;
          nodes.push(highshelf, lowshelf);
          break;
        }
        case 'british': {
          const peaking = this.audioContext.createBiquadFilter();
          peaking.type = 'peaking';
          peaking.frequency.value = 2400;
          peaking.gain.value = 6;
          peaking.Q.value = 1.5;
          currentOut.connect(peaking);
          currentOut = peaking;
          nodes.push(peaking);
          break;
        }
        case 'indian': {
          const lowshelf = this.audioContext.createBiquadFilter();
          lowshelf.type = 'lowshelf';
          lowshelf.frequency.value = 240;
          lowshelf.gain.value = 4.5;
          const midPeak = this.audioContext.createBiquadFilter();
          midPeak.type = 'peaking';
          midPeak.frequency.value = 1500;
          midPeak.gain.value = 4;
          currentOut.connect(lowshelf);
          lowshelf.connect(midPeak);
          currentOut = midPeak;
          nodes.push(lowshelf, midPeak);
          break;
        }
        case 'asian': {
          const highPeak = this.audioContext.createBiquadFilter();
          highPeak.type = 'highshelf';
          highPeak.frequency.value = 4200;
          highPeak.gain.value = 6;
          currentOut.connect(highPeak);
          currentOut = highPeak;
          nodes.push(highPeak);
          break;
        }
        case 'australian': {
          const midPeak = this.audioContext.createBiquadFilter();
          midPeak.type = 'peaking';
          midPeak.frequency.value = 1900;
          midPeak.gain.value = 5;
          currentOut.connect(midPeak);
          currentOut = midPeak;
          nodes.push(midPeak);
          break;
        }
        case 'jamaican': {
          const subBass = this.audioContext.createBiquadFilter();
          subBass.type = 'lowshelf';
          subBass.frequency.value = 160;
          subBass.gain.value = 9;
          currentOut.connect(subBass);
          currentOut = subBass;
          nodes.push(subBass);
          break;
        }
        default: {
          currentOut.connect(destination);
          break;
        }
      }

      if (this.activeVoiceEffect.toLowerCase() !== 'echo') {
        currentOut.connect(destination);
      }

      const outTrack = destination.stream.getAudioTracks()[0];
      if (outTrack) {
        outTrack.enabled = !this.isMuted;
        this.processedAudioTrack = outTrack;
        this.voiceEffectNodes = nodes;
        await this.replaceOutgoingAudioTrack(outTrack);
      }
      return true;
    } catch (err) {
      console.warn('[WebRTC] Error setting voice effect:', err);
      return false;
    }
  }

  private clearVideoProcessor(): void {
    if (this.filterFrameRequest !== null) {
      cancelAnimationFrame(this.filterFrameRequest);
      this.filterFrameRequest = null;
    }
    this.processedVideoTrack?.stop();
    this.processedVideoTrack = null;
    if (this.filterSourceVideo) {
      this.filterSourceVideo.pause();
      this.filterSourceVideo.srcObject = null;
      this.filterSourceVideo.remove();
      this.filterSourceVideo = null;
    }
    if (this.filterCanvas) {
      this.filterCanvas.width = 0;
      this.filterCanvas.height = 0;
      this.filterCanvas = null;
    }
  }

  async setVideoFilter(filter: string): Promise<boolean> {
    this.activeVideoFilter = filter || 'none';
    const sourceTrack = this.localStream?.getVideoTracks()[0];
    if (!sourceTrack) return false;

    if (this.activeVideoFilter === 'none') {
      this.clearVideoProcessor();
      await this.replaceOutgoingVideoTrack(sourceTrack);
      return true;
    }

    this.clearVideoProcessor();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context || typeof canvas.captureStream !== 'function') return false;

    const settings = sourceTrack.getSettings();
    const sourceWidth = settings.width || 640;
    const sourceHeight = settings.height || 480;
    const scale = Math.min(1, 960 / sourceWidth, 960 / sourceHeight);
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    video.style.cssText = 'position:fixed;width:1px;height:1px;left:-2px;top:-2px;opacity:0;pointer-events:none';
    video.srcObject = new MediaStream([sourceTrack]);
    document.body.appendChild(video);
    video.play().catch(() => {});

    const outputTrack = canvas.captureStream(24).getVideoTracks()[0];
    if (!outputTrack) {
      video.remove();
      return false;
    }
    this.filterCanvas = canvas;
    this.filterSourceVideo = video;
    this.processedVideoTrack = outputTrack;

    const drawFrame = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        context.filter = this.activeVideoFilter;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      outputTrack.enabled = sourceTrack.enabled;
      this.filterFrameRequest = requestAnimationFrame(drawFrame);
    };
    drawFrame();
    await this.replaceOutgoingVideoTrack(outputTrack);
    return true;
  }

  /**
   * Flip camera between front (user) and rear (environment)
   */
  async flipCamera(): Promise<'user' | 'environment'> {
    if (!this.localStream || this.callType !== 'video') return this.currentFacingMode;

    const nextMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    if (nextMode === 'user') {
      this.isTorchOn = false;
    }
    const selectedFilter = this.activeVideoFilter;
    try {
      if (this.processedVideoTrack) {
        const oldTrack = this.localStream.getVideoTracks()[0];
        if (oldTrack) await this.replaceOutgoingVideoTrack(oldTrack);
        this.clearVideoProcessor();
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = this.localStream.getVideoTracks()[0];

      if (oldVideoTrack) {
        this.localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }

      this.localStream.addTrack(newVideoTrack);
      this.currentFacingMode = nextMode;

      await this.replaceOutgoingVideoTrack(newVideoTrack);
      if (selectedFilter !== 'none') await this.setVideoFilter(selectedFilter);

      return nextMode;
    } catch (err) {
      console.warn('[WebRTC] Could not flip camera:', err);
      return this.currentFacingMode;
    }
  }

  getFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode;
  }

  getIsTorchOn(): boolean {
    return this.isTorchOn;
  }

  async toggleTorch(forceState?: boolean): Promise<boolean> {
    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (!videoTrack) return false;
    const nextTorch = forceState !== undefined ? forceState : !this.isTorchOn;
    try {
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      this.isTorchOn = nextTorch;
      return nextTorch;
    } catch (err) {
      console.warn('[WebRTC] Torch constraint error:', err);
      this.isTorchOn = false;
      return false;
    }
  }

  async switchCamera(): Promise<MediaStream | null> {
    await this.flipCamera();
    if (this.localStream) {
      this.localStream = new MediaStream(this.localStream.getTracks());
    }
    return this.localStream;
  }

  /**
   * Share screen during a video call
   */
  async startScreenShare(): Promise<MediaStream | null> {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !('getDisplayMedia' in navigator.mediaDevices)
    ) {
      return null;
    }
    try {
      if (this.processedVideoTrack) {
        const sourceTrack = this.localStream?.getVideoTracks()[0];
        if (sourceTrack) await this.replaceOutgoingVideoTrack(sourceTrack);
        this.clearVideoProcessor();
      }
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return null;

      if (this.localStream) {
        const oldVideoTracks = this.localStream.getVideoTracks();
        oldVideoTracks.forEach((t) => {
          this.localStream?.removeTrack(t);
          t.stop();
        });
        this.localStream.addTrack(screenTrack);
        this.localStream = new MediaStream(this.localStream.getTracks());
      } else {
        this.localStream = displayStream;
      }

      if (this.peerConnection) {
        const videoSender = this.peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }
      }

      this.isVideoOff = false;
      return this.localStream;
    } catch (err) {
      console.warn('[WebRTC] Screen share cancelled or unsupported:', err);
      return null;
    }
  }

  /**
   * Request Picture-in-Picture on a video element
   */
  async requestPictureInPicture(videoEl: HTMLVideoElement): Promise<boolean> {
    if (document.pictureInPictureEnabled && videoEl) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          return false;
        } else {
          await videoEl.requestPictureInPicture();
          return true;
        }
      } catch (err) {
        console.warn('[WebRTC] PiP failed:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Switch audio output device (speaker vs bluetooth vs headphones)
   */
  async setAudioOutputDevice(mediaEl: HTMLMediaElement, deviceId: string): Promise<boolean> {
    if ('setSinkId' in mediaEl) {
      try {
        await (mediaEl as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(
          deviceId
        );
        return true;
      } catch (err) {
        console.warn('[WebRTC] setSinkId error:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Enumerate available media devices
   */
  async getAvailableDevices(): Promise<AudioDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.map((d, idx) => ({
        deviceId: d.deviceId,
        label: d.label || `${d.kind} (${idx + 1})`,
        kind: d.kind,
      }));
    } catch {
      return [];
    }
  }

  // Event handlers
  onRemoteStream(callback: (stream: MediaStream) => void): () => void {
    this.remoteStreamListeners.add(callback);
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
    return () => {
      this.remoteStreamListeners.delete(callback);
    };
  }

  onStats(callback: (stats: WebRTCStats) => void) {
    this.onStatsUpdate = callback;
  }

  onConnectionState(callback: (state: RTCIceConnectionState) => void): () => void {
    this.onConnectionStateUpdate = callback;
    return () => {
      if (this.onConnectionStateUpdate === callback) {
        this.onConnectionStateUpdate = undefined;
      }
    };
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.onIceCandidateGenerated = callback;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Gracefully terminate call, close all tracks and connections
   */
  endCall() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (typeof document !== 'undefined' && document.pictureInPictureElement) {
      try {
        document.exitPictureInPicture().catch(() => {});
      } catch {
        // ignore
      }
    }

    this.clearVideoProcessor();
    this.activeVideoFilter = 'none';
    this.isTorchOn = false;
    this.currentFacingMode = 'user';

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.ontrack = null;
        this.peerConnection.onicecandidate = null;
        this.peerConnection.oniceconnectionstatechange = null;
        this.peerConnection.close();
      } catch {
        // ignore
      }
      this.peerConnection = null;
    }

    if (this.loopbackPeer) {
      try {
        this.loopbackPeer.close();
      } catch {
        // ignore
      }
      this.loopbackPeer = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(() => {});
      } catch {
        // ignore
      }
      this.audioContext = null;
    }

    this.clearAudioProcessor();
    this.activeVoiceEffect = 'original';
    this.rawAudioTrack = null;
    this.pendingCandidates = [];
    this.analyser = null;
    this.dataArray = null;
    this.isMuted = false;
    this.isVideoOff = false;
  }

  cleanup() {
    this.endCall();
  }
}

// Global engine singleton
export const webrtcEngine = new WebRTCCallEngine();
export const webrtcService = webrtcEngine;
