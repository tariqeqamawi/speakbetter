// What the microphone can measure about a voice, worked out on the
// device before the take goes up - the numbers Coach's ear can't be
// trusted to hear on its own. Gemini listens to the audio and judges
// tone and melody well enough; what it can't do reliably is measure.
// So the phone decodes the recording, finds the voiced frames, tracks
// the pitch, and reports: the pitch's median and range, how far the
// pitch and the volume drop at the ends of phrases (the voice "trailing
// off" or "dropping"), where the energy sits in the spectrum (chest-
// forward, or thin and high - the nearest an ordinary microphone gets
// to "speaking from the belly"), and how the pauses fall. Coach reads
// these beside what it heard, and says nothing about resonance it
// can't back with a number or a moment.
//
// None of this is a clinical measure. A phone microphone, a room, and
// a compressed video codec all colour the sound, so every figure is a
// proxy, and the brief tells Coach to treat it as one.

export interface VoiceProfile {
  /** Seconds of voiced speech found, out of the recording's length. */
  voicedSec: number;
  totalSec: number;
  /** Fundamental frequency, Hz, over voiced frames. */
  pitchMedianHz: number;
  /** p10 to p90 of the pitch, in semitones - the melody's width. */
  pitchRangeSemitones: number;
  /** Phrases found (voiced runs between pauses of 250 ms or more). */
  phrases: number;
  /** Typical (median) pitch fall from a phrase's middle to its last
   *  300 ms, semitones (positive = the voice drops at the end). */
  endPitchDropSemitones: number;
  /** Typical (median) loudness fall from a phrase's middle to its end, dB. */
  endLoudnessDropDb: number;
  /** Share of phrases whose end is 6 dB or more quieter than the middle. */
  trailingOffShare: number;
  /** Energy below 1 kHz as a share of energy below 4 kHz, on voiced
   *  frames - higher is warmer and chest-forward, lower is thin. */
  lowBandShare: number;
  /** Loudness variation across voiced frames, dB (standard deviation). */
  loudnessSpreadDb: number;
  /** Pauses between phrases: how many, and their median length. */
  pauses: number;
  pauseMedianSec: number;
}

const RATE = 16_000;
const FRAME = 640; // 40 ms
const HOP = 320; // 20 ms

/** Decode a recording's audio to 16 kHz mono. */
async function decode(file: Blob): Promise<Float32Array | null> {
  try {
    const buf = await file.arrayBuffer();
    // A short offline context decodes at its own rate; the result is
    // resampled to ours below.
    const probe = new OfflineAudioContext(1, 1, 44_100);
    const audio = await probe.decodeAudioData(buf);
    const frames = Math.ceil(audio.duration * RATE);
    if (frames < RATE) return null;
    const ctx = new OfflineAudioContext(1, frames, RATE);
    const src = ctx.createBufferSource();
    src.buffer = audio;
    src.connect(ctx.destination);
    src.start();
    const out = await ctx.startRendering();
    return out.getChannelData(0);
  } catch {
    return null;
  }
}

function hann(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

/** Autocorrelation pitch of one frame: the lag with the clearest
 *  period between 60 and 400 Hz, or 0 if the frame isn't voiced. */
function pitchOf(frame: Float32Array, rms: number, floor: number): number {
  if (rms < floor) return 0;
  const minLag = Math.floor(RATE / 400);
  const maxLag = Math.floor(RATE / 60);
  let energy = 0;
  for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i];
  if (energy === 0) return 0;
  let bestLag = 0;
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < frame.length; i++) sum += frame[i] * frame[i + lag];
    const r = sum / energy;
    if (r > best) {
      best = r;
      bestLag = lag;
    }
  }
  // clarity: a clean period correlates well with itself
  if (best < 0.5) return 0;
  // the shortest lag nearly as good as the best is the true period -
  // the best alone is often an octave low
  for (let lag = minLag; lag < bestLag; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < frame.length; i++) sum += frame[i] * frame[i + lag];
    if (sum / energy >= best * 0.9) return RATE / lag;
  }
  return RATE / bestLag;
}

/** Energy below 1 kHz as a share of energy below 4 kHz, by a small
 *  Goertzel bank - enough to say where the weight of the voice sits. */
function lowBandShareOf(frame: Float32Array): number {
  const bins = [150, 300, 450, 600, 800, 1000, 1400, 1800, 2400, 3000, 3600];
  let low = 0;
  let all = 0;
  for (const hz of bins) {
    const k = (2 * Math.PI * hz) / RATE;
    const c = 2 * Math.cos(k);
    let s0 = 0;
    let s1 = 0;
    let s2 = 0;
    for (let i = 0; i < frame.length; i++) {
      s0 = frame[i] + c * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    const power = s1 * s1 + s2 * s2 - c * s1 * s2;
    all += power;
    if (hz <= 1000) low += power;
  }
  return all > 0 ? low / all : 0;
}

const semis = (a: number, b: number) => 12 * Math.log2(a / b);
const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const quantile = (xs: number[], q: number) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
const db = (rms: number) => 20 * Math.log10(Math.max(rms, 1e-6));

/** Measure a recording. Null when the audio can't be read or holds
 *  under a second of speech. Takes a few seconds for a long take;
 *  call it while the upload is in flight. */
export async function measureVoice(file: Blob): Promise<VoiceProfile | null> {
  const pcm = await decode(file);
  if (!pcm) return null;
  const window = hann(FRAME);
  const n = Math.floor((pcm.length - FRAME) / HOP);
  if (n < 50) return null;

  // pass one: loudness, to find the noise floor
  const rms = new Float32Array(n);
  const frame = new Float32Array(FRAME);
  for (let f = 0; f < n; f++) {
    let e = 0;
    for (let i = 0; i < FRAME; i++) {
      const v = pcm[f * HOP + i] * window[i];
      e += v * v;
    }
    rms[f] = Math.sqrt(e / FRAME);
  }
  // The noise floor: the quietest tenth of the frames, with a margin,
  // but never more than a fifth of the typical level - a take with few
  // pauses would otherwise put the floor inside the speech.
  const sorted = [...rms].sort((a, b) => a - b);
  const floor = Math.min(Math.max(sorted[Math.floor(n * 0.1)] * 4, 0.003), sorted[Math.floor(n * 0.5)] * 0.2);

  // pass two: pitch and spectrum on the frames that carry voice
  const pitch = new Float32Array(n);
  const lowShare: number[] = [];
  for (let f = 0; f < n; f++) {
    for (let i = 0; i < FRAME; i++) frame[i] = pcm[f * HOP + i] * window[i];
    pitch[f] = pitchOf(frame, rms[f], floor);
    if (pitch[f] > 0 && f % 3 === 0) lowShare.push(lowBandShareOf(frame));
  }

  // phrases: voiced runs, split by 250 ms or more of quiet
  const voiced = Array.from(pitch, (p) => p > 0);
  const gapFrames = 12; // 240 ms
  const phrases: { start: number; end: number }[] = [];
  let start = -1;
  let quiet = 0;
  for (let f = 0; f < n; f++) {
    if (voiced[f] || rms[f] >= floor) {
      if (start < 0) start = f;
      quiet = 0;
    } else if (start >= 0) {
      quiet++;
      if (quiet >= gapFrames) {
        phrases.push({ start, end: f - quiet });
        start = -1;
        quiet = 0;
      }
    }
  }
  if (start >= 0) phrases.push({ start, end: n - 1 });
  const real = phrases.filter((p) => p.end - p.start >= 30); // 600 ms or longer

  // Octave errors are the pitch tracker's habit: a frame more than ten
  // semitones from the take's median is one, and is dropped.
  const first = Array.from(pitch).filter((p) => p > 0);
  if (first.length < 25) return null;
  const pMed0 = median(first);
  for (let f = 0; f < n; f++) if (pitch[f] > 0 && Math.abs(semis(pitch[f], pMed0)) > 10) pitch[f] = 0;
  const pitches = Array.from(pitch).filter((p) => p > 0);
  if (pitches.length < 25) return null;
  const pMed = median(pitches);

  const endDrops: number[] = [];
  const loudDrops: number[] = [];
  for (const p of real) {
    const len = p.end - p.start;
    const midA = p.start + Math.floor(len * 0.3);
    const midB = p.start + Math.floor(len * 0.7);
    const tail = Math.max(midB, p.end - 15); // last 300 ms
    const midP: number[] = [];
    const tailP: number[] = [];
    let midE = 0;
    let midN = 0;
    let tailE = 0;
    let tailN = 0;
    for (let f = midA; f < midB; f++) {
      if (pitch[f] > 0) midP.push(pitch[f]);
      midE += rms[f];
      midN++;
    }
    for (let f = tail; f <= p.end; f++) {
      if (pitch[f] > 0) tailP.push(pitch[f]);
      tailE += rms[f];
      tailN++;
    }
    if (midP.length >= 5 && tailP.length >= 4) endDrops.push(semis(median(midP), median(tailP)));
    if (midN > 0 && tailN > 0) loudDrops.push(db(midE / midN) - db(tailE / tailN));
  }

  const pauses: number[] = [];
  for (let i = 1; i < real.length; i++) pauses.push(((real[i].start - real[i - 1].end) * HOP) / RATE);

  const voicedDb = Array.from(rms)
    .filter((_, f) => pitch[f] > 0)
    .map(db);
  const meanDb = voicedDb.reduce((a, b) => a + b, 0) / voicedDb.length;
  const spread = Math.sqrt(voicedDb.reduce((a, b) => a + (b - meanDb) ** 2, 0) / voicedDb.length);

  const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
  return {
    voicedSec: round((pitches.length * HOP) / RATE),
    totalSec: round(pcm.length / RATE),
    pitchMedianHz: Math.round(pMed),
    pitchRangeSemitones: round(semis(quantile(pitches, 0.9), quantile(pitches, 0.1))),
    phrases: real.length,
    // medians, not means: one odd phrase shouldn't write the number
    endPitchDropSemitones: round(median(endDrops)),
    endLoudnessDropDb: round(median(loudDrops)),
    trailingOffShare: round(loudDrops.length ? loudDrops.filter((d) => d >= 6).length / loudDrops.length : 0, 2),
    lowBandShare: round(lowShare.length ? lowShare.reduce((a, b) => a + b, 0) / lowShare.length : 0, 2),
    loudnessSpreadDb: round(spread),
    pauses: pauses.length,
    pauseMedianSec: round(median(pauses), 2),
  };
}

/** The profile, written for the brief - the numbers and what they
 *  usually mean, so Coach reads them the way a voice teacher would. */
export function describeVoice(v: VoiceProfile): string {
  const range =
    v.pitchRangeSemitones < 5 ? "narrow - close to a monotone" : v.pitchRangeSemitones < 9 ? "moderate" : v.pitchRangeSemitones < 14 ? "wide - a real melody" : "very wide";
  const weight = v.lowBandShare >= 0.9 ? "most of the weight low - warm, chest-forward" : v.lowBandShare >= 0.75 ? "balanced" : "weight sitting high - thin, little chest in it";
  const trailing =
    v.trailingOffShare >= 0.5 ? "most phrases trail off" : v.trailingOffShare >= 0.25 ? "some phrases trail off" : "phrases hold their level to the end";
  return [
    `MEASURED FROM THE AUDIO (computed on the student's phone; proxies from an ordinary microphone, not a clinical measure). The pitch range, the falls at the ends of phrases and the pauses are dependable; the spectral weight is rough. Use them alongside what you hear - to confirm and to quantify - and never contradict what you clearly heard with a number.`,
    `- Speech found: ${v.voicedSec}s of ${v.totalSec}s, in ${v.phrases} phrases; ${v.pauses} pauses, median ${v.pauseMedianSec}s.`,
    `- Pitch: median ${v.pitchMedianHz} Hz; range p10-p90 ${v.pitchRangeSemitones} semitones (${range}).`,
    `- Ends of phrases: pitch falls ${v.endPitchDropSemitones} semitones on average; loudness falls ${v.endLoudnessDropDb} dB; ${trailing} (${Math.round(v.trailingOffShare * 100)}% by 6 dB or more). A large fall on most phrases is the voice dropping at the end of every sentence - the last words are the ones that get lost.`,
    `- Where the weight of the voice sits: low-band share ${v.lowBandShare} (${weight}). Loudness spread across the take: ${v.loudnessSpreadDb} dB (under 3 is one level throughout; over 6 is real dynamic range).`,
  ].join("\n");
}
