"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";

// The coach persona, drawn as an audio visualizer rather than a puppet.
//
// The earlier prototype split the raster mark into head and jaw layers
// and rotated the jaw. From flat artwork the seam never fully hid and
// six degrees of travel read as a twitch, not speech. So the mark now
// responds the way a soundwave does: the whole lion pulses with the
// audio - a gentle scale, a bloom of light behind the mane, and a bar
// meter underneath, all driven by the same live amplitude.
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

export function TalkingLion({
  text,
  audioSrc,
  cues,
  className = "",
}: {
  text?: string;
  audioSrc?: string;
  cues?: SpokenCue[];
  className?: string;
}) {
  const [level, setLevel] = useState(0); // 0..1 live amplitude
  const [speaking, setSpeaking] = useState(false);
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

  const speak = useCallback(async () => {
    if (speaking) return;

    if (audioSrc) {
      const el = audioRef.current;
      if (!el) return;
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
      await ctxRef.current.resume();
      el.currentTime = 0;
      setSpeaking(true);
      setFinished(false); // a replay clears the summary until it's earned
      runAmplitudeLoop();
      el.onended = () => {
        setSpeaking(false);
        stopLoop();
        setFinished(true);
      };
      await el.play();
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
  }, [speaking, audioSrc, text, runAmplitudeLoop, runEnvelopeLoop, stopLoop]);

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
        <Image
          src="/logo-mark.png"
          alt="Speak Better coach"
          width={762}
          height={610}
          priority
          className="relative h-auto w-full will-change-transform"
          style={{ transform: `scale(${(1 + level * 0.05).toFixed(3)})` }}
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

      {/* preload=none: the clip only downloads when the visitor asks to hear it */}
      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="none" hidden />}

      <button
        type="button"
        onClick={speaking ? stop : speak}
        disabled={!supported}
        className="flex min-h-11 items-center rounded-lg border border-navy-600 bg-navy-800 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-navy-700 disabled:opacity-50"
      >
        {speaking ? "Stop" : "Hear the coach"}
      </button>

      {!supported && (
        <p className="text-xs text-ink-faint">
          This browser has no speech synthesis - try Chrome or Safari.
        </p>
      )}
    </div>
  );
}
