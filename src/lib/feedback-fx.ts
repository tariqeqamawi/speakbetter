import { requestFloor } from "@/lib/voice-floor";
// A speaking course that stays silent when you achieve something is
// missing a beat. The chime is synthesised with the Web Audio API rather
// than shipped as a file - no asset, no download, and it can be tuned in
// code. Haptics ride along where the device supports them.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** A short rising three-note figure - warm, not a game-show sting. */
export function playCelebration() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ac = audio();
  if (!ac) return;
  void ac.resume().catch(() => {});

  // A major triad walking up: a settled, encouraging shape.
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const now = ac.currentTime;

  notes.forEach((freq, i) => {
    const at = now + i * 0.085;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, at);
    // quick attack, gentle tail - keeps it from feeling sharp
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(at);
    osc.stop(at + 0.5);
  });
}

/**
 * The smaller sibling of the celebration: two notes for finishing a
 * lesson, where a badge gets three.
 *
 * Finishing a lesson happens a hundred times over a course and earning a
 * badge happens rarely, so this one has to be something a student is
 * happy to hear again - quieter, shorter, and resolving upward without
 * the triad's sense of arrival. It rides on the video the student just
 * chose to play, so it never arrives out of a silent page.
 */
export function playXpChime() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ac = audio();
  if (!ac) return;
  void ac.resume().catch(() => {});

  const notes = [783.99, 1174.66]; // G5 up to D6 - a rising fifth
  const now = ac.currentTime;

  notes.forEach((freq, i) => {
    const at = now + i * 0.07;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.075, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.38);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(at);
    osc.stop(at + 0.42);
  });
}

/** A short double tap. Android honours this; iOS Safari ignores it. */
export function hapticCelebrate() {
  if (typeof navigator === "undefined") return;
  navigator.vibrate?.([18, 60, 28]);
}

/** A single light tap for smaller confirmations. */
export function hapticTap() {
  if (typeof navigator === "undefined") return;
  navigator.vibrate?.(12);
}

// ── The sound design, in one place ────────────────────────────────────
//
// Where the apps people keep coming back to put sound, and why:
//
//   Duolingo   a bright "ding" on every correct answer, a fanfare when a
//              lesson completes, a swell when the streak extends. Sound
//              on the small win, every time; the big win gets more.
//   Apple      a chime and a ring-close animation when a fitness ring
//   Fitness    completes - one sound bound to one unmistakable moment.
//   Strava     a soft tone when kudos arrive - social reward, quiet.
//   Headspace  low, warm tones on completion; nothing sharp, ever.
//   Games      a whoosh on send, a click on record, a rising arpeggio
//              on level-up - the interface itself has a voice.
//
// The rules drawn from them, applied here: (1) every action that
// changes the record gets a sound, scaled to its size - a tick for a
// tap, two notes for a lesson, three for a badge, a fanfare for a pass,
// an arpeggio for a rank; (2) the same moment always makes the same
// sound, so it becomes recognisable; (3) warm, short, low in the mix,
// and never out of a silent page unless the student just did something;
// (4) a miss gets a sound too - a soft, settling one - so the app
// doesn't go quiet exactly when it's needed; (5) nothing plays when the
// system asks for reduced motion.

function tone(ac: AudioContext, freq: number, at: number, dur: number, peak: number, type: OscillatorType = "sine") {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function ready(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const ac = audio();
  if (!ac) return null;
  void ac.resume().catch(() => {});
  return ac;
}

/** A pass: a fanfare - the triad, then the octave held. The biggest
 *  sound in the app, for the biggest moment. */
export function playPass() {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  [523.25, 659.25, 783.99].forEach((f, i) => tone(ac, f, now + i * 0.09, 0.5, 0.11));
  tone(ac, 1046.5, now + 0.3, 0.9, 0.13);
  tone(ac, 1318.5, now + 0.3, 0.9, 0.06);
  // a soft shimmer under the held note
  tone(ac, 2093, now + 0.34, 0.6, 0.02, "triangle");
}

/** A miss that counts: two notes settling down a step - not a buzzer,
 *  a "not yet" - so the moment has a sound without a sting. */
export function playMiss() {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  tone(ac, 587.33, now, 0.35, 0.07);
  tone(ac, 523.25, now + 0.16, 0.5, 0.07);
}

/** XP landing: a bright single ding, the coin sound - short enough to
 *  hear a hundred times. */
export function playXpDing() {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  tone(ac, 1567.98, now, 0.22, 0.07);
  tone(ac, 2093, now + 0.05, 0.28, 0.04);
}

/** A rank reached, a phase opened: a rising arpeggio over an octave. */
export function playRankUp() {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  [392, 493.88, 587.33, 783.99, 987.77].forEach((f, i) => tone(ac, f, now + i * 0.075, 0.45, 0.09));
  tone(ac, 1567.98, now + 0.42, 0.8, 0.07);
}

/** Recording starts: a soft click and a low tone - the "on". */
export function playRecordStart() {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  tone(ac, 880, now, 0.08, 0.06, "square");
  tone(ac, 440, now + 0.06, 0.25, 0.05);
}

/** Recording stops: the same, falling - the "off". */
export function playRecordStop() {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  tone(ac, 660, now, 0.08, 0.06, "square");
  tone(ac, 330, now + 0.06, 0.25, 0.05);
}

/** Sent to the coach: a rising whoosh - noise swept upward. */
export function playSend() {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  const len = Math.floor(ac.sampleRate * 0.45);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(3200, now + 0.4);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(now);
}

/** The review has arrived: two notes, a question answered. */
export function playReviewReady() {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  tone(ac, 659.25, now, 0.3, 0.07);
  tone(ac, 880, now + 0.14, 0.45, 0.08);
}

/** A streak day counted: a warm low tick. */
export function playStreakTick() {
  const ac = ready();
  if (!ac) return;
  const now = ac.currentTime;
  tone(ac, 293.66, now, 0.3, 0.06);
  tone(ac, 440, now + 0.08, 0.35, 0.05);
}

/** A stronger haptic for the pass - three pulses. */
export function hapticPass() {
  if (typeof navigator === "undefined") return;
  navigator.vibrate?.([24, 50, 24, 50, 60]);
}

// ── Applause, under a trophy reveal ─────────────────────────────────────
//
// The one recorded sound in the set, because a room clapping is not
// something an oscillator can fake. It goes through the same Web Audio
// context as the chimes rather than an <audio> element, and that is
// deliberate: on an iPhone, Web Audio follows the silent switch and a
// media element does not - so a phone on silent in a meeting stays
// silent, which is what "muted" means to the person holding it.
//
// It never plays out of a page nobody has touched (the browser would
// refuse anyway, and a page that claps at you on arrival is a bad
// page), never for somebody who has asked for less motion, and a file
// that is missing or will not decode is simply no applause.

const APPLAUSE = "/sfx/applause.mp3";
let applause: Promise<AudioBuffer | null> | null = null;

function touched(): boolean {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  // Every browser the app supports has userActivation; one that does
  // not gets no applause rather than a guess.
  return !!ua?.hasBeenActive;
}

/** Whether the page may make sound yet - it has been clicked, tapped or
 *  typed on (scrolling does not count). */
export function activated(): boolean {
  return typeof window !== "undefined" && touched();
}

/** Start the applause; the function returned fades it out early. */
export function playApplause(): () => void {
  const none = () => {};
  if (typeof window === "undefined") return none;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return none;
  if (!touched()) return none;
  const ac = audio();
  if (!ac) return none;
  void ac.resume().catch(() => {});

  applause ??= fetch(APPLAUSE)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .then((b) => (b ? ac.decodeAudioData(b) : null))
    .catch(() => null);

  let stopped = false;
  let stop = () => {
    stopped = true;
  };
  void applause.then((buffer) => {
    if (!buffer || stopped) return;
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    src.buffer = buffer;
    // Under the moment, not over it.
    gain.gain.value = 0.35;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
    stop = () => {
      const now = ac.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      try {
        src.stop(now + 0.45);
      } catch {
        // already finished
      }
    };
  });
  return () => stop();
}

// One of Coach's pre-recorded lines, played through the same context as
// the applause - so it obeys the silent switch on a phone like the rest
// of the app's sounds, and can be timed against the reveal to the
// millisecond. Decoded clips are kept, so a second trophy that picks a
// line already heard starts instantly.
const clips = new Map<string, Promise<AudioBuffer | null>>();

export function playCoachLine(src: string, delayMs = 0): () => void {
  const none = () => {};
  if (typeof window === "undefined") return none;
  if (!touched()) return none;
  const ac = audio();
  if (!ac) return none;
  void ac.resume().catch(() => {});

  let clip = clips.get(src);
  if (!clip) {
    clip = fetch(src)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => (b ? ac.decodeAudioData(b) : null))
      .catch(() => null);
    clips.set(src, clip);
  }

  // After the delay he asks for the floor (lib/voice-floor), so he never
  // talks over himself elsewhere - and gives it back when the clip ends.
  let stopped = false;
  let node: AudioBufferSourceNode | null = null;
  let done = () => {};
  const loaded = clip;
  const timer = setTimeout(() => {
    done = requestFloor(() => {
      void loaded.then((buffer) => {
        if (!buffer || stopped) return done();
        node = ac.createBufferSource();
        node.buffer = buffer;
        node.connect(ac.destination);
        node.onended = () => done();
        node.start();
      });
    });
  }, delayMs);
  return () => {
    stopped = true;
    clearTimeout(timer);
    try {
      node?.stop();
    } catch {
      // already finished
    }
    done();
  };
}

// The road's sounds - the adventure plays them only when the student
// has turned its sound on.

/** Air rushing past as the traveller goes through a checkpoint. */
export function playRoadWhoosh() {
  const ac = audio();
  if (!ac || !touched()) return;
  void ac.resume().catch(() => {});
  const now = ac.currentTime;
  const len = Math.floor(ac.sampleRate * 0.7);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.2;
  band.frequency.setValueAtTime(300, now);
  band.frequency.exponentialRampToValueAtTime(2400, now + 0.35);
  band.frequency.exponentialRampToValueAtTime(500, now + 0.7);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  src.connect(band);
  band.connect(gain);
  gain.connect(ac.destination);
  src.start(now);
  src.stop(now + 0.72);
}

/** A brass fanfare as the traveller crosses into a new section - trumpets
 *  calling over French horns and tubas, heralding the next stretch of the
 *  road. One of four calls (public/sfx/fanfare-1..4.mp3, built by
 *  scripts/sfx/build-fanfare.py), never the one heard last. Shares the
 *  clip cache with Coach's lines, so each is decoded once. */
let lastFanfare = 0;
export function playGateChime() {
  const ac = audio();
  if (!ac || !touched()) return;
  void ac.resume().catch(() => {});
  let k = 1 + Math.floor(Math.random() * 4);
  if (k === lastFanfare) k = (k % 4) + 1;
  lastFanfare = k;
  const src = `/sfx/fanfare-${k}.mp3`;
  let clip = clips.get(src);
  if (!clip) {
    clip = fetch(src)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => (b ? ac.decodeAudioData(b) : null))
      .catch(() => null);
    clips.set(src, clip);
  }
  void clip.then((buffer) => {
    if (!buffer) return;
    const node = ac.createBufferSource();
    const gain = ac.createGain();
    node.buffer = buffer;
    gain.gain.value = 0.55;
    node.connect(gain);
    gain.connect(ac.destination);
    node.start();
  });
}
