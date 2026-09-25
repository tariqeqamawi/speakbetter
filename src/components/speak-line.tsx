"use client";

import { useEffect, useRef, useState } from "react";
import { CoachPill } from "@/components/coach-pill";
import { requestFloor } from "@/lib/voice-floor";

// A line of the page, said aloud on request.
//
// It is Coach's voice, so it is Coach's button - the big pill with the
// wave running through it, the same one as everywhere else he speaks.
// It never autoplays - sound at a stranger who has just opened
// a page is the rudest thing a site can do, and half of them are
// somewhere they cannot use it. The words are on screen; this is the
// offer of the voice.
//
// The clip is a static file. No model is called, nothing is generated
// per visitor, and it works on a day when the voice quota is spent.

/** How loud a SpeakLine is right now, 0..1, or null once it stops -
 *  sent on the window as `speak-line-level` so a lion elsewhere on the
 *  page (the hero's, say) can move its mouth with the words. */
export type SpeakLevel = { channel: string; level: number | null };

export function SpeakLine({
  audioSrc,
  label = "Listen to Coach",
  channel,
}: {
  audioSrc: string;
  label?: string;
  /** Announce the voice's loudness under this name while it plays. */
  channel?: string;
}) {
  const el = useRef<HTMLAudioElement | null>(null);
  const meter = useRef<{ ctx: AudioContext; analyser: AnalyserNode } | null>(null);
  const raf = useRef(0);
  const send = (level: number | null) => {
    if (channel) window.dispatchEvent(new CustomEvent<SpeakLevel>("speak-line-level", { detail: { channel, level } }));
  };
  // Measure the voice as it plays: how much sound is in the speech band,
  // frame by frame, eased so the mouth opens on syllables and closes in
  // the gaps.
  const startMeter = (audioEl: HTMLAudioElement) => {
    if (!channel) return;
    try {
      if (!meter.current) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctor();
        const source = ctx.createMediaElementSource(audioEl);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.minDecibels = -75;
        analyser.maxDecibels = -25;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        meter.current = { ctx, analyser };
      }
      void meter.current.ctx.resume().catch(() => {});
    } catch {
      return;
    }
    const { analyser, ctx } = meter.current!;
    const bins = new Uint8Array(analyser.frequencyBinCount);
    const lo = Math.floor((120 / (ctx.sampleRate / 2)) * bins.length);
    const hi = Math.floor((3500 / (ctx.sampleRate / 2)) * bins.length);
    let level = 0;
    const tick = () => {
      analyser.getByteFrequencyData(bins);
      let sum = 0;
      for (let i = lo; i < hi; i++) sum += bins[i];
      const target = Math.min(1, sum / (hi - lo) / 150);
      level += (target - level) * (target > level ? 0.6 : 0.35);
      send(level);
      raf.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  };
  const stopMeter = () => {
    cancelAnimationFrame(raf.current);
    send(null);
  };
  const releaseFloor = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetch(audioSrc, { method: "HEAD" })
      .then((r) => {
        if (alive && r.ok) setReady(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
      el.current?.pause();
      releaseFloor.current();
      cancelAnimationFrame(raf.current);
    };
  }, [audioSrc]);

  if (!ready) return null;

  return (
    <CoachPill
      onClick={() => {
        if (!el.current) {
          el.current = new Audio(audioSrc);
          el.current.addEventListener("ended", () => {
            releaseFloor.current();
            stopMeter();
            setPlaying(false);
          });
        }
        if (playing) {
          el.current.pause();
          el.current.currentTime = 0;
          releaseFloor.current();
          stopMeter();
          setPlaying(false);
          return;
        }
        setPlaying(true);
        // His turn (lib/voice-floor): after anyone else speaking.
        const audioEl = el.current;
        releaseFloor.current = requestFloor(() => {
          startMeter(audioEl);
          void audioEl.play().catch(() => {
            stopMeter();
            releaseFloor.current();
            setPlaying(false);
          });
        });
      }}
    >
      {playing ? "Stop" : label}
    </CoachPill>
  );
}
