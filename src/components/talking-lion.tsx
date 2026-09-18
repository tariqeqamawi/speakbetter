"use client";

import { LionMouth } from "@/components/lion-mouth";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentType,
} from "react";

/** A quarter-second of silence, for waking the audio path up inside a
 *  tap - see TalkingLionHandle.prime. */
const SILENCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

export interface TalkingLionHandle {
  /**
   * Call inside a click or tap, before fetching audio. Browsers only
   * let sound start from a gesture, and by the time a clip has been
   * generated the gesture is seconds gone: Safari refuses outright,
   * Firefox after a few seconds, Chrome usually allows it and
   * sometimes doesn't. Priming starts the audio context and plays a
   * beat of silence through the element while the tap is still warm,
   * and after that the real clip plays whenever it arrives.
   */
  prime: () => void;
}

// The coach persona: the lion, mouth moving with the voice.
//
// Two earlier tries are worth remembering. Splitting the flat mark into
// head and jaw and rotating the jaw never hid the seam, and six degrees
// of travel read as a twitch. Pulsing the whole mark with the audio was
// honest but wasn't speech. What works is the artist's own animation:
// the brand MOV of the lion going from closed mouth to roar, cut into
// twelve frames (lion-mouth.tsx) and scrubbed by the audio's amplitude
// - loud syllables open the mouth, gaps close it. The bloom behind the
// mane and the bar meter underneath still breathe with the same level.
//
// Two drive modes:
//   audioSrc  - real amplitude off an AnalyserNode. The production
//               path; works with any TTS that returns an audio file.
//   text      - the browser's own speech synthesis, whose audio cannot
//               be tapped for amplitude, so the pulse is driven by an
//               envelope pumped on each word boundary. Fallback only.

const BAR_COUNT = 24;

/** A word the coach says, and the symbol for it - shown while it's being
 *  spoken, then held afterwards as a summary. Times are in seconds
 *  against the audio clip. */
export interface SpokenCue {
  at: number;
  until: number;
  word: string;
  /** Passed as a component, not an element, so the same symbol can be
   *  drawn large while it's spoken and smaller in the summary. */
  Icon: ComponentType<{ className?: string }>;
  /** Text color class, so the symbol carries its skill's color. */
  colorClass: string;
  /** Whether it belongs in the summary that stays on screen. Status
   *  beats like "Passed" aren't things to work on, so they drop out. */
  summary?: boolean;
}

export const TalkingLion = forwardRef<
  TalkingLionHandle,
  {
    text?: string;
    audioSrc?: string;
    cues?: SpokenCue[];
    /** Speak as soon as an audio source arrives - for a page where the
     *  tap that fetched the audio is the tap that meant "play". */
    autoPlay?: boolean;
    onEnded?: () => void;
    className?: string;
  }
>(function TalkingLion(
  { text, audioSrc, cues, autoPlay = false, onEnded, className = "" },
  ref,
) {
  const [level, setLevel] = useState(0); // 0..1 live amplitude, smoothed
  // The mouth follows a faster envelope than the bloom: quick to open
  // on a syllable, a little slower to close, so it flaps like speech
  // rather than swelling like breath.
  const [mouth, setMouth] = useState(0);
  const mouthRef = useRef(0);
  const [speaking, setSpeaking] = useState(false);
  // The browser refused to start the clip - a tap on the button will.
  const [blocked, setBlocked] = useState(false);
  const [cueIndex, setCueIndex] = useState(-1); // which cue is being spoken
  // Set once the clip plays through, which is what puts the summary up.
  const [finished, setFinished] = useState(false);
  // Resolved lazily: `window` isn't there during the server render.
  const supported =
    typeof window === "undefined" || !!audioSrc || "speechSynthesis" in window;

  const rafRef = useRef<number | null>(null);
  const envelopeRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const smoothedRef = useRef(0);
  const barsRef = useRef<HTMLDivElement | null>(null);
  // Read inside the animation loop, which is created once per playback.
  const cuesRef = useRef<SpokenCue[]>(cues ?? []);
  // Frequency bins drive the bar meter directly (no React state per frame).
  const freqRef = useRef<Uint8Array | null>(null);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevel(0);
    setMouth(0);
    mouthRef.current = 0;
    setCueIndex(-1);
    smoothedRef.current = 0;
    envelopeRef.current = 0;
    barsRef.current
      ?.querySelectorAll<HTMLElement>("[data-bar]")
      .forEach((b) => (b.style.transform = "scaleY(0.12)"));
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  useEffect(() => {
    cuesRef.current = cues ?? [];
  }, [cues]);

  const paintBars = useCallback((levels: (i: number) => number) => {
    const bars = barsRef.current?.querySelectorAll<HTMLElement>("[data-bar]");
    bars?.forEach((b, i) => {
      const v = Math.max(0.12, Math.min(1, levels(i)));
      b.style.transform = `scaleY(${v.toFixed(3)})`;
    });
  }, []);

  /** Real amplitude: RMS for the pulse, frequency bins for the bars. */
  const runAmplitudeLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const wave = new Uint8Array(analyser.fftSize);
    const freq = new Uint8Array(analyser.frequencyBinCount);
    freqRef.current = freq;
    const tick = () => {
      analyser.getByteTimeDomainData(wave);
      let sum = 0;
      for (let i = 0; i < wave.length; i++) {
        const v = (wave[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / wave.length);
      // Conversational clips sit near 0.08–0.15 RMS; drive so speech
      // reads fully and only true pauses fall to rest.
      const target = Math.min(1, rms * 6);
      smoothedRef.current += (target - smoothedRef.current) * 0.35;
      setLevel(smoothedRef.current);
      // Attack fast, release slower - and a touch above the bloom, so
      // ordinary speech opens the mouth properly and only silence
      // closes it.
      const want = Math.min(1, rms * 7.5);
      mouthRef.current +=
        (want - mouthRef.current) * (want > mouthRef.current ? 0.6 : 0.3);
      setMouth(mouthRef.current);

      // Which word is being said right now - the same clock the audio
      // plays on, so the symbol can't drift out of sync with the voice.
      if (cuesRef.current.length) {
        const t = audioRef.current?.currentTime ?? 0;
        const found = cuesRef.current.findIndex(
          (c) => t >= c.at && t < c.until,
        );
        setCueIndex((prev) => (prev === found ? prev : found));
      }

      analyser.getByteFrequencyData(freq);
      // Nearly all voice energy sits below ~4 kHz - a sixth of the bins
      // at a 48 kHz sample rate - so the meter only samples that band,
      // slightly log-spaced so the highs don't sit permanently dark.
      const usable = Math.floor(freq.length / 6);
      paintBars((i) => {
        const bin = Math.floor(Math.pow(i / BAR_COUNT, 1.4) * usable);
        return (freq[bin] / 255) * 1.3;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [paintBars]);

  /** Synthesized stand-in: a syllable-rate flutter under a decaying envelope. */
  const runEnvelopeLoop = useCallback(() => {
    const tick = () => {
      envelopeRef.current *= 0.94; // decays between words
      const t0 = performance.now() / 1000;
      mouthRef.current = envelopeRef.current * (0.55 + 0.45 * Math.abs(Math.sin(t0 * 2 * Math.PI * 4.5)));
      setMouth(mouthRef.current);
      const t = performance.now() / 1000;
      const flutter = 0.55 + 0.45 * Math.sin(t * 2 * Math.PI * 5.2);
      const target = envelopeRef.current * flutter;
      smoothedRef.current += (target - smoothedRef.current) * 0.4;
      setLevel(smoothedRef.current);
      paintBars(
        (i) =>
          smoothedRef.current *
          (0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i * 0.9))),
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [paintBars]);

  /** The audio graph - element into analyser into speakers - built once. */
  const graph = useCallback(() => {
    const el = audioRef.current;
    if (!el) return null;
    if (!ctxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(el);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      // Narrow the dB window to where conversational speech actually
      // lives, so a normal-volume clip drives the meter fully.
      analyser.minDecibels = -75;
      analyser.maxDecibels = -25;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
    }
    return ctxRef.current;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      prime: () => {
        const ctx = graph();
        const el = audioRef.current;
        if (!ctx || !el) return;
        ctx.resume().catch(() => {});
        if (!el.src || el.src === window.location.href) el.src = SILENCE;
        el.muted = true;
        el.play()
          .then(() => {
            el.pause();
            el.muted = false;
          })
          .catch(() => {
            el.muted = false;
          });
      },
    }),
    [graph],
  );

  const speak = useCallback(async () => {
    if (speaking) return;

    if (audioSrc) {
      const el = audioRef.current;
      const ctx = graph();
      if (!el || !ctx) return;
      await ctx.resume().catch(() => {});
      if (el.src !== audioSrc) el.src = audioSrc;
      el.muted = false;
      el.currentTime = 0;
      setFinished(false); // a replay clears the summary until it's earned
      el.onended = () => {
        setSpeaking(false);
        stopLoop();
        setFinished(true);
        onEnded?.();
      };
      try {
        await el.play();
      } catch {
        // The browser wants a tap for this one. Say so; the button is
        // the tap.
        setBlocked(true);
        return;
      }
      setBlocked(false);
      setSpeaking(true);
      runAmplitudeLoop();
      return;
    }

    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.98;
    utter.pitch = 0.85; // a shade lower - it's a lion
    utter.onboundary = () => {
      envelopeRef.current = 1; // pump the envelope at each word
    };
    utter.onend = () => {
      setSpeaking(false);
      stopLoop();
    };
    utter.onerror = () => {
      setSpeaking(false);
      stopLoop();
    };
    setSpeaking(true);
    envelopeRef.current = 1;
    runEnvelopeLoop();
    window.speechSynthesis.speak(utter);
  }, [speaking, audioSrc, text, graph, runAmplitudeLoop, runEnvelopeLoop, stopLoop, onEnded]);

  // A new clip on a page that asked for it to play: play it. The
  // element's src has to have caught up first, hence the frame.
  const speakRef = useRef(speak);
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);
  useEffect(() => {
    if (!autoPlay || !audioSrc) return;
    const id = requestAnimationFrame(() => {
      speakRef.current();
    });
    return () => cancelAnimationFrame(id);
  }, [autoPlay, audioSrc]);

  const stop = useCallback(() => {
    if (audioSrc) audioRef.current?.pause();
    else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    stopLoop();
  }, [audioSrc, stopLoop]);

  const activeCue = cueIndex >= 0 ? cues?.[cueIndex] : undefined;
  const summaryCues = (cues ?? []).filter((c) => c.summary !== false);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative w-full max-w-xs">
        {/* Bloom behind the mane, breathing with the voice */}
        <div
          aria-hidden
          className="absolute inset-[-12%] rounded-full will-change-transform"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(245,61,224,0.35), rgba(34,217,245,0.18) 55%, transparent 75%)",
            opacity: 0.25 + level * 0.75,
            transform: `scale(${(0.96 + level * 0.12).toFixed(3)})`,
            filter: "blur(18px)",
          }}
        />
        <LionMouth
          level={mouth}
          className="relative w-full will-change-transform"
          style={{ transform: `scale(${(1 + level * 0.03).toFixed(3)})` }}
        />
        {/* The word being spoken, with its symbol. The row keeps its
            height whether or not a cue is showing, so the lion never
            shifts as words come and go. */}
        {cues && cues.length > 0 && (
          <div className="mt-3 flex min-h-12 items-center justify-center">
            {activeCue && (
              <span
                // Keyed by word so each new cue replays the entrance
                key={activeCue.word}
                className={`coach-cue flex items-center gap-2.5 rounded-full border border-navy-600 bg-navy-900/80 px-4 py-2 ${activeCue.colorClass}`}
              >
                <activeCue.Icon className="size-8" />
                <span className="text-base font-semibold">
                  {activeCue.word}
                </span>
              </span>
            )}

            {/* Once the coach has finished, every skill they raised stays
                on screen together - the whole of what to work on, in one
                look, instead of six moments the listener has to hold in
                their head. */}
            {!activeCue && finished && summaryCues.length > 0 && (
              <ul className="coach-cue flex flex-wrap items-center justify-center gap-2">
                {summaryCues.map((cue) => (
                  <li
                    key={cue.word}
                    className={`flex items-center gap-2 rounded-full border border-navy-600 bg-navy-900/80 px-3 py-1.5 ${cue.colorClass}`}
                  >
                    <cue.Icon className="size-6" />
                    <span className="text-xs font-semibold">{cue.word}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Amplitude bars - the soundwave under the lion, live */}
        <div
          ref={barsRef}
          aria-hidden
          className="mt-2 flex h-10 items-end justify-center gap-1"
        >
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <span
              key={i}
              data-bar
              className="w-1.5 origin-bottom rounded-full"
              style={{
                height: "100%",
                transform: "scaleY(0.12)",
                background: `hsl(${190 + (i / BAR_COUNT) * 130}, 90%, 60%)`,
                transition: "transform 60ms linear",
              }}
            />
          ))}
        </div>
      </div>

      {/* Always mounted, src managed by hand, so it can be primed inside
          a tap before there's a clip to play. preload=none: the clip
          only downloads when the visitor asks to hear it. */}
      <audio ref={audioRef} preload="none" hidden />

      <button
        type="button"
        onClick={speaking ? stop : speak}
        disabled={!supported}
        className={`flex min-h-11 items-center rounded-lg border px-5 py-2.5 text-sm font-semibold text-ink transition-colors disabled:opacity-50 ${
          blocked
            ? "border-ink-faint bg-navy-700 hover:bg-navy-600"
            : "border-navy-600 bg-navy-800 hover:bg-navy-700"
        }`}
      >
        {speaking ? "Stop" : blocked ? "Tap to hear the coach" : "Hear the coach"}
      </button>
      {blocked && (
        <p className="text-xs text-ink-faint">
          Your browser wanted a tap before playing sound - it&apos;s ready now.
        </p>
      )}

      {!supported && (
        <p className="text-xs text-ink-faint">
          This browser has no speech synthesis - try Chrome or Safari.
        </p>
      )}
    </div>
  );
});
