"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// PROTOTYPE — the coach persona (see the coaching-delivery discussion).
//
// The brand lion split into two layers: the head, and the lower jaw
// hinged at the point where it disappears under the cheek. Because the
// lion is drawn in profile, a single rotating jaw is enough to read as
// speech — no phoneme mouth shapes are needed, which is what makes this
// viable at all from flat artwork.
//
// Two drive modes:
//   audioSrc  — real amplitude off an AnalyserNode. This is the
//               production path, and works with any TTS that returns
//               an audio file.
//   text      — the browser's own speech synthesis, whose audio cannot
//               be tapped for amplitude, so the jaw is driven by an
//               envelope pumped on each word boundary. Demo only.

const PIVOT_X_PCT = (331 / 762) * 100;
const PIVOT_Y_PCT = (221 / 610) * 100;
const MAX_ANGLE = 8;

export function TalkingLion({
  text,
  audioSrc,
  className = "",
}: {
  text?: string;
  audioSrc?: string;
  className?: string;
}) {
  const [angle, setAngle] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  // Resolved lazily: `window` isn't there during the server render.
  const supported =
    typeof window === "undefined" || !!audioSrc || "speechSynthesis" in window;

  const rafRef = useRef<number | null>(null);
  const envelopeRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const smoothedRef = useRef(0);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setAngle(0);
    smoothedRef.current = 0;
    envelopeRef.current = 0;
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  /** Real amplitude: root-mean-square of the waveform, smoothed. */
  const runAmplitudeLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      // Speech rarely exceeds ~0.3 RMS; scale so normal volume opens fully.
      const target = Math.min(1, rms * 3.2);
      smoothedRef.current += (target - smoothedRef.current) * 0.35;
      setAngle(smoothedRef.current * MAX_ANGLE);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  /** Synthesized stand-in: a syllable-rate flutter under a decaying envelope. */
  const runEnvelopeLoop = useCallback(() => {
    const tick = () => {
      envelopeRef.current *= 0.94; // decays between words
      const t = performance.now() / 1000;
      const flutter = 0.55 + 0.45 * Math.sin(t * 2 * Math.PI * 5.2);
      const target = envelopeRef.current * flutter;
      smoothedRef.current += (target - smoothedRef.current) * 0.4;
      setAngle(smoothedRef.current * MAX_ANGLE);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

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
        source.connect(analyser);
        analyser.connect(ctx.destination);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
      }
      await ctxRef.current.resume();
      el.currentTime = 0;
      setSpeaking(true);
      runAmplitudeLoop();
      el.onended = () => {
        setSpeaking(false);
        stopLoop();
      };
      await el.play();
      return;
    }

    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.98;
    utter.pitch = 0.85; // a shade lower — it's a lion
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

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative w-full max-w-xs" style={{ aspectRatio: "762 / 610" }}>
        <Image
          src="/lion-head.png"
          alt="Speak Better coach"
          width={762}
          height={610}
          priority
          className="absolute inset-0 h-full w-full"
        />
        <Image
          src="/lion-jaw.png"
          alt=""
          width={762}
          height={610}
          priority
          className="absolute inset-0 h-full w-full will-change-transform"
          style={{
            transformOrigin: `${PIVOT_X_PCT}% ${PIVOT_Y_PCT}%`,
            transform: `rotate(${angle.toFixed(2)}deg)`,
          }}
        />
      </div>

      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="auto" hidden />}

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
          This browser has no speech synthesis — try Chrome or Safari.
        </p>
      )}
    </div>
  );
}
