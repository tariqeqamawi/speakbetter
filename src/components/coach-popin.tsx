"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { buildContext } from "@/lib/encouragement";
import { hapticTap } from "@/lib/feedback-fx";

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

export function CoachPopIn() {
  const { state, ready, celebrations } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [jaw, setJaw] = useState(0);
  const askedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const envRef = useRef(0);

  const dismiss = useCallback(() => {
    setLeaving(true);
    window.speechSynthesis?.cancel();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTimeout(() => setMessage(null), 260);
  }, []);

  useEffect(() => {
    if (!ready || askedRef.current) return;
    if (!state.unlocked || !state.level) return;
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

  const speak = useCallback(() => {
    if (!message || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(message);
    utter.rate = 0.98;
    utter.pitch = 0.85;
    utter.onboundary = () => { envRef.current = 1; };
    utter.onend = () => {
      setSpeaking(false);
      setJaw(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    setSpeaking(true);
    envRef.current = 1;
    const tick = () => {
      envRef.current *= 0.94;
      const t = performance.now() / 1000;
      const flutter = 0.55 + 0.45 * Math.sin(t * 2 * Math.PI * 5.2);
      setJaw(envRef.current * flutter * 6);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    window.speechSynthesis.speak(utter);
  }, [message]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end ${
        leaving ? "coach-popin-out" : "coach-popin-in"
      }`}
    >
      <div className="flex max-w-sm items-start gap-3 rounded-2xl border border-navy-600 bg-navy-850 p-4 shadow-2xl shadow-navy-950/80">
        {/* the lion, mouth moving while it speaks */}
        <span className="relative block size-14 shrink-0">
          <Image src="/lion-head.png" alt="" width={762} height={610}
            className="absolute inset-0 size-full object-contain" />
          <Image src="/lion-jaw.png" alt="" width={762} height={610}
            className="absolute inset-0 size-full object-contain"
            style={{ transformOrigin: "43.4% 36.2%", transform: `rotate(${jaw.toFixed(2)}deg)` }} />
        </span>

        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm leading-snug text-ink">{message}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={speaking ? () => { window.speechSynthesis.cancel(); setSpeaking(false); setJaw(0); } : speak}
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
