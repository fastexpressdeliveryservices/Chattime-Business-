// Applies an audible voice effect to a recorded voice note before it is sent.
// Browser DSP only: pitch/tempo shift plus tone shaping. It colours the voice;
// it does not do true accent conversion.

interface Preset {
  rate: number; // playbackRate: >1 raises pitch and shortens, <1 lowers
  lowShelf: number; // dB at 200 Hz
  highShelf: number; // dB at 3.5 kHz
  presence: number; // dB peaking at 1.8 kHz
}

const PRESETS: Array<[string, Preset]> = [
  ['American', { rate: 1.0, lowShelf: 0, highShelf: 1.5, presence: 2 }],
  ['British', { rate: 1.03, lowShelf: -1, highShelf: 2.5, presence: 3 }],
  ['Indian', { rate: 1.06, lowShelf: -2, highShelf: 1, presence: 4 }],
  ['Asian', { rate: 1.1, lowShelf: -3, highShelf: 2, presence: 2 }],
  ['Australian', { rate: 0.97, lowShelf: 1, highShelf: 0.5, presence: 2 }],
  ['Nigerian', { rate: 0.93, lowShelf: 3, highShelf: -1, presence: 3 }],
  ['Jamaican', { rate: 0.9, lowShelf: 4, highShelf: -2, presence: 2 }],
];

function presetFor(modifier: string): Preset | undefined {
  return PRESETS.find(([key]) => modifier.includes(key))?.[1];
}

function encodeWav(buffer: AudioBuffer): Blob {
  const channels = Math.min(buffer.numberOfChannels, 2);
  const length = buffer.length * channels * 2;
  const view = new DataView(new ArrayBuffer(44 + length));
  const write = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  write(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  write(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, length, true);
  let offset = 44;
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}

/** Returns the processed audio and its new duration in seconds. Falls back to the original on any failure. */
export async function applyVoiceModifier(
  blob: Blob,
  modifier: string | undefined
): Promise<{ blob: Blob; duration?: number }> {
  const preset = modifier ? presetFor(modifier) : undefined;
  if (!preset) return { blob };
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    ctx.close();

    const outLength = Math.ceil(decoded.length / preset.rate);
    const offline = new OfflineAudioContext(decoded.numberOfChannels, outLength, decoded.sampleRate);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.playbackRate.value = preset.rate;

    const low = offline.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 200;
    low.gain.value = preset.lowShelf;
    const mid = offline.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1800;
    mid.Q.value = 1;
    mid.gain.value = preset.presence;
    const high = offline.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 3500;
    high.gain.value = preset.highShelf;
    const comp = offline.createDynamicsCompressor();

    src.connect(low).connect(mid).connect(high).connect(comp).connect(offline.destination);
    src.start();
    const rendered = await offline.startRendering();
    return { blob: encodeWav(rendered), duration: Math.max(1, Math.round(rendered.duration)) };
  } catch (err) {
    console.warn('[VoiceModifier] Falling back to original audio:', err);
    return { blob };
  }
}
