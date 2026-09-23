"use client";

import { LionMouth } from "@/components/lion-mouth";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { buildContext } from "@/lib/encouragement";
import { hapticTap } from "@/lib/feedback-fx";
import { speakUrl } from "@/lib/coach/voice";

// The coach, dropping in unprompted to say something true about how the
// student is doing. Deliberately rationed - at most once a day, only
// after there's something real to comment on, and never while a badge
// celebration is already on screen.

const SEEN_KEY = "speak-better-encouraged-on";

// When the record has nothing new to remark on, the coach still has
// something warm to say. These claim nothing about performance - they're
// a stance, not a statistic - so they don't bend the rule that every
// factual claim is checked against the record first.
const AFFIRMATIONS = [
  "You're on your way to transforming your life.",
  "Speaking is your new superpower.",
  "We're proud of you for doing this, by the way.",
  "Every rep you put in here shows up the next time it counts.",
  "The fact that you keep showing up is the whole secret.",
  "Your voice is worth hearing. That's why you're here.",
  "One day soon you'll speak somewhere that matters and feel ready. This is where that starts.",
  "Most people never practice this. You are.",
];

/** True while the guided tour (or its offer) is on screen. */
function useOnTour(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(document.body.dataset.tour === "1");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-tour"] });
    return () => observer.disconnect();
  }, []);
  return on;
}

export function CoachPopIn() {
  const onTour = useOnTour();
  const { state, ready, celebrations } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [jaw, setJaw] = useState(0);
  const askedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const envRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const dismiss = useCallback(() => {
    setLeaving(true);
    window.speechSynthesis?.cancel();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTimeout(() => setMessage(null), 260);
  }, []);

  useEffect(() => {
    if (!ready || askedRef.current) return;
    if (!state.unlocked || !state.level) return;
    // Not inside the landing page's phone frames (a bare preview).
    if (new URLSearchParams(window.location.search).get("bare") === "1") return;
    // Never talk over a badge.
    if (celebrations.length > 0) return;

    const today = new Date().toISOString().slice(0, 10);
    if (window.localStorage.getItem(SEEN_KEY) === today) return;

    const context = buildContext(state);

    askedRef.current = true;
    const timer = window.setTimeout(async () => {
      const show = (text: string) => {
        window.localStorage.setItem(SEEN_KEY, today);
        setMessage(text);
        hapticTap();
      };
      const affirmation = () =>
        AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];

      // A record-based line when there is one; a warm word when there
      // isn't. The coach no longer goes silent on quiet days.
      if (!context) {
        show(affirmation());
        return;
      }
      try {
        const res = await fetch("/api/encouragement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(context),
        });
        const data = (await res.json()) as { message: string | null };
        show(data.message ?? affirmation());
      } catch {
        show(affirmation());
      }
    }, 2600); // let the page settle first

    return () => window.clearTimeout(timer);
  }, [ready, state, celebrations.length]);

  // The jaw, pumped by an envelope: a beat on each word from the
  // browser's voice, or a steady flutter while the coach's own audio
  // plays. Same motion either way - the mark reads as talking.
  const animate = () => {
    const tick = () => {
      envRef.current *= 0.94;
      const t = performance.now() / 1000;
      const flutter = 0.55 + 0.45 * Math.sin(t * 2 * Math.PI * 5.2);
      setJaw(envRef.current * flutter * 6);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };
  const settle = () => {
    setSpeaking(false);
    setJaw(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const speak = useCallback(async () => {
    if (!message) return;
    setSpeaking(true);

    // The element is made and started - on a beat of silence - inside
    // the tap, because the clip arrives seconds later and a browser
    // may refuse to start sound on its own by then.
    const el = new Audio(
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=",
    );
    el.muted = true;
    el.play().catch(() => {});
    audioRef.current = el;

    // The coach's own voice first (see lib/coach/voice.ts) ...
    const url = await speakUrl(message);
    if (url && audioRef.current === el) {
      el.pause();
      el.src = url;
      el.muted = false;
      el.onended = () => {
        settle();
        URL.revokeObjectURL(url);
      };
      el.onerror = () => settle();
      // A steady pump while it plays; the envelope is topped up every
      // few frames so the jaw keeps moving through the whole line.
      envRef.current = 1;
      const pump = window.setInterval(() => {
        envRef.current = 0.7 + Math.random() * 0.3;
      }, 140);
      el.onpause = () => window.clearInterval(pump);
      animate();
      el.play().catch(() => settle());
      return;
    }
    if (audioRef.current !== el) return; // stopped while fetching

    // ... and the browser's own where it isn't available.
    if (!("speechSynthesis" in window)) return settle();
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(message);
    utter.rate = 0.98;
    utter.pitch = 0.85;
    utter.onboundary = () => { envRef.current = 1; };
    utter.onend = settle;
    utter.onerror = settle;
    envRef.current = 1;
    animate();
    window.speechSynthesis.speak(utter);
  }, [message]);

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    settle();
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // The tour owns the screen while it's running - two cards in the
  // same corner is one too many.
  if (!message || onTour) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end ${
        leaving ? "coach-popin-out" : "coach-popin-in"
      }`}
    >
      <div className="flex max-w-sm items-start gap-3 rounded-2xl border border-navy-600 bg-navy-850 p-4 shadow-2xl shadow-navy-950/80">
        {/* the lion, mouth moving while it speaks - the jaw envelope
            (0..6) drives the same sprite the big lion uses */}
        <span className="relative block w-[4.5rem] shrink-0">
          <LionMouth level={Math.min(1, jaw / 7)} className="w-full" />
        </span>

        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm leading-snug text-ink">{message}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={speaking ? stop : speak}
              className="min-h-9 rounded-lg border border-navy-600 px-3 py-1.5 text-[0.7rem] font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              {speaking ? "Stop" : "Hear it"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-9 px-2 py-1.5 text-[0.7rem] font-medium text-ink-faint transition-colors hover:text-ink-muted"
            >
              Thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
