// Time-stretching for the coach's voice, done on the server.
//
// Gemini takes pace in a direction loosely, so the exact part of the
// coach's speed is ours. It used to be the browser's playbackRate with
// pitch preserved, and on a phone that was the wrong place for it:
// Safari's stretch gets choppy past about 1.2x and eats the front of
// words, so a review came back as fragments. Doing it here means the
// phone plays an ordinary clip at ordinary speed.
//
// WSOLA - waveform-similarity overlap-add - the standard for speech.
// The input is walked in frames at a stride `rate` times the output's;
// each frame is placed where it best continues the waveform already
// laid down (a short search either side of its nominal position, by
// cross-correlation), and the overlaps are cross-faded. Pitch and
// timbre are untouched; only the timing changes.

/** Frame length, samples. 20ms at 24kHz - a few pitch periods of a low voice. */
const FRAME = 480;
/** Synthesis hop: half a frame, so consecutive frames cross-fade fully. */
const HOP = FRAME / 2;
/** How far either side of the nominal position to look for the best join. */
const TOLERANCE = 160;

/**
 * Speed up (rate > 1) or slow down (rate < 1) 16-bit mono PCM without
 * changing its pitch. Returns the same when rate is 1.
 */
export function timeStretch(pcm: Int16Array, rate: number): Int16Array {
  if (Math.abs(rate - 1) < 0.005 || pcm.length < FRAME * 3) return pcm;
  const outLength = Math.floor(pcm.length / rate);
  const out = new Float32Array(outLength + FRAME);
  const weight = new Float32Array(outLength + FRAME);
  const window = new Float32Array(FRAME);
  for (let i = 0; i < FRAME; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME - 1));

  // The first frame goes down as is.
  let outPos = 0;
  lay(pcm, 0, out, weight, outPos, window);
  // Where the last frame laid down came from in the input; the samples
  // that follow it are what the next frame should continue.
  let prevIn = 0;

  for (outPos = HOP; outPos + FRAME <= outLength; outPos += HOP) {
    const nominal = Math.round(outPos * rate);
    if (nominal + FRAME + TOLERANCE >= pcm.length) break;
    // Where the previous frame's continuation sits in the input.
    const target = prevIn + HOP;
    // Search near the nominal position for the offset whose frame best
    // matches that continuation.
    let best = nominal;
    let bestScore = -Infinity;
    const lo = Math.max(0, nominal - TOLERANCE);
    const hi = Math.min(pcm.length - FRAME, nominal + TOLERANCE);
    for (let cand = lo; cand <= hi; cand += 2) {
      let score = 0;
      // Correlate over the overlapping half-frame only - that's the join.
      for (let i = 0; i < HOP; i += 2) {
        score += pcm[target + i] * pcm[cand + i];
      }
      if (score > bestScore) {
        bestScore = score;
        best = cand;
      }
    }
    lay(pcm, best, out, weight, outPos, window);
    prevIn = best;
  }

  const result = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const w = weight[i];
    const v = w > 0 ? out[i] / w : 0;
    result[i] = v > 32767 ? 32767 : v < -32768 ? -32768 : Math.round(v);
  }
  return result;
}

/** Add one windowed frame of the input into the output at outPos. */
function lay(
  pcm: Int16Array,
  inPos: number,
  out: Float32Array,
  weight: Float32Array,
  outPos: number,
  window: Float32Array,
): void {
  for (let i = 0; i < FRAME; i++) {
    const s = pcm[inPos + i];
    if (s === undefined) break;
    out[outPos + i] += s * window[i];
    weight[outPos + i] += window[i];
  }
}
