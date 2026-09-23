// Bringing Coach up to a level a phone can actually play.
//
// The voice model returns clips whose PEAKS are nearly full scale but
// whose AVERAGE is around -21 dBFS - a big, dynamic, lion-ish delivery
// with quiet passages between the loud ones. Measured against speech
// that is meant to be heard on a phone in a room with other people in
// it, that is about five decibels too quiet, and on a phone at half
// volume it disappears. Turning the element's volume up cannot fix it:
// the peaks are already at the top, so all that does is clip them.
//
// What fixes it is closing the gap between the loud parts and the
// quiet ones, then lifting the whole thing. That is one soft knee and
// one gain:
//
//   below the knee   the sample is untouched, so ordinary speech keeps
//                    its shape and its consonants
//   above the knee   it bends smoothly towards the ceiling instead of
//                    running into it, so the loudest syllables get
//                    quieter relative to the rest rather than square
//
// No look-ahead, no attack and release, nothing that could pump or
// breathe: this runs on every clip on a server and has to be
// predictable more than it has to be clever.

/** Where speech should sit on average - a little under broadcast, so
 *  it is loud without sounding squashed. */
const TARGET_RMS = 0.15; // about -16.5 dBFS
/** Never past this, so nothing ever hard-clips. */
const CEILING = 0.97;
/** Where the bend starts. Below it, nothing is touched at all. */
const KNEE = 0.6;
/** As much as this clip may be lifted, however quiet it is - past
 *  this, a near-silent clip would come back as a wall of hiss. */
const MAX_GAIN = 4;

/** x bent smoothly towards the ceiling above the knee. */
function soften(x: number): number {
  const a = Math.abs(x);
  if (a <= KNEE) return x;
  const over = (a - KNEE) / (CEILING - KNEE);
  const bent = KNEE + (CEILING - KNEE) * Math.tanh(over);
  return x < 0 ? -bent : bent;
}

/**
 * Raise a mono 16-bit PCM buffer to a speaking level, in place-ish.
 *
 * Returns a new buffer; the input is left alone. Silence comes back
 * unchanged rather than amplified into noise.
 */
export function normalizeSpeech(pcm: Buffer): Buffer {
  const samples = Math.floor(pcm.length / 2);
  if (samples === 0) return pcm;

  let sum = 0;
  let peak = 0;
  for (let i = 0; i < samples; i++) {
    const v = pcm.readInt16LE(i * 2) / 32768;
    sum += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  const rms = Math.sqrt(sum / samples);
  // Nothing worth lifting: an empty or near-empty clip.
  if (rms < 1e-4 || peak < 1e-3) return pcm;

  const gain = Math.min(MAX_GAIN, TARGET_RMS / rms);
  if (gain <= 1.02) return pcm;

  const out = Buffer.allocUnsafe(pcm.length);
  for (let i = 0; i < samples; i++) {
    const v = (pcm.readInt16LE(i * 2) / 32768) * gain;
    const s = soften(v);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), i * 2);
  }
  // An odd trailing byte, if the buffer had one.
  if (pcm.length % 2) out[pcm.length - 1] = pcm[pcm.length - 1];
  return out;
}
