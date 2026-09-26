"use client";

import { usePathname } from "next/navigation";

import { LionMouth } from "@/components/lion-mouth";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { buildContext } from "@/lib/encouragement";
import { hapticTap } from "@/lib/feedback-fx";
import { chime, setCoachCalling } from "@/lib/coach-call";
import { speakUrl } from "@/lib/coach/voice";
import { requestFloor } from "@/lib/voice-floor";

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
  const pathname = usePathname();
  const onTour = useOnTour();
  const { state, ready, celebrations } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  /** Whether the message is open, or still ringing in the bar. */
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [jaw, setJaw] = useState(0);
  const askedRef = useRef(false);
  const spokeRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const envRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const releaseFloor = useRef<() => void>(() => {});

  const dismiss = useCallback(() => {
    setLeaving(true);
    setCoachCalling(false);
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
  //
  // Syllables, not a flutter: the mouth opens on a syllable and closes in
  // the gap, about twice a second, never the same shape twice - the same
  // rhythm as the big lion. A steady five-a-second flap read as chattering
  // teeth on a lion this small.
  const animate = () => {
    let level = 0;
    let target = 0;
    let next = 0;
    let open = false;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      envRef.current *= 0.97;
      const voiced = envRef.current > 0.2;
      if (!voiced) target = 0;
      else if (now > next) {
        open = !open;
        target = open ? 0.45 + Math.random() * 0.4 : Math.random() * 0.08;
        next = now + (open ? 180 + Math.random() * 140 : 90 + Math.random() * 70);
      }
      level += (target - level) * Math.min(1, dt * 18);
      setJaw(level * 7);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };
  const settle = () => {
    releaseFloor.current();
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
    if (audioRef.current !== el) return; // stopped while fetching
    // His turn (lib/voice-floor): after anyone else speaking has finished.
    await new Promise<void>((go) => {
      releaseFloor.current = requestFloor(go);
    });
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
    releaseFloor.current();
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    settle();
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Coach rings, rather than arriving.
  //
  // The card used to slide in over whatever the student was reading.
  // Interrupting is the one thing a good coach does not do, and it is
  // also the worst moment for the message itself: encouragement read
  // while your attention is elsewhere is noise. So the message waits
  // behind the Coach button in the navigation, which rings, and it
  // opens when the student decides to hear it - by which point they
  // are listening.
  const waiting = Boolean(message) && !open && !onTour && pathname !== "/coach";
  useEffect(() => {
    if (!waiting) {
      setCoachCalling(false);
      return;
    }
    setCoachCalling(true, () => setOpen(true));
    chime();
    hapticTap();
    return () => setCoachCalling(false);
  }, [waiting]);

  // Opening it is a tap, so this is allowed to make sound - which is
  // the point. Tariq asked that selecting the icon plays the line and
  // shows the words, rather than offering a second button to press
  // before anything happens.
  useEffect(() => {
    if (!open || spokeRef.current) return;
    spokeRef.current = true;
    void speak();
  }, [open, speak]);

  // The tour owns the screen while it's running - two cards in the
  // same corner is one too many.
  // Not on Coach's own page: he is standing right there, full size,
  // waiting to be asked something. A pop-in of him over himself is one
  // lion too many.
  // Nothing on screen until the student answers: while it is waiting,
  // the whole of Coach's presence is the ringing button.
  if (!message || !open || onTour || pathname === "/coach") return null;

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
              {speaking ? "Stop" : "Again"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-9 px-2 py-1.5 text-[0.7rem] font-medium text-ink-faint transition-colors hover:text-ink-muted"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
