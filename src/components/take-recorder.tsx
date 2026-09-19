"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, VideoIcon, XIcon } from "@/components/icons";
import { hapticTap, playRecordStart, playRecordStop } from "@/lib/feedback-fx";

// Recording a take inside the app, with the clock in view. The phone's
// own camera app can't show one, and the limit is part of the
// challenge (§07: being succinct is the skill), so the student sees it
// count down from the challenge's own limit as they speak, the ring
// turns amber inside the last thirty seconds and red inside the last
// ten, and the recording stops itself at the limit. A two-minute
// challenge records two minutes and no more.
//
// Where the browser can't record (no camera, permission refused, no
// MediaRecorder), the caller falls back to the phone's camera app.

/** Seconds left at which the clock turns amber, then red - closer in
 *  on a short challenge, where thirty seconds would be the whole take. */
function warnAt(limit: number): number {
  return limit <= 60 ? 10 : 30;
}
function alarmAt(limit: number): number {
  return limit <= 60 ? 5 : 10;
}

/** The recording format the browser can make that the coach can watch. */
function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const wanted = [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return wanted.find((m) => MediaRecorder.isTypeSupported(m));
}

export function canRecordInApp(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined" &&
    pickMime() !== undefined
  );
}

/** A criterion the clock can judge on its own: "at least 60 seconds"
 *  ticks itself once the take has run that long; "under three
 *  minutes" is what the stop at the limit guarantees, so it's ticked
 *  from the first second. Everything else is the student's own tick. */
function timed(text: string): { kind: "atLeast"; seconds: number } | { kind: "under" } | null {
  const least = /at least (\d+) (second|minute)s?/i.exec(text);
  if (least) return { kind: "atLeast", seconds: Number(least[1]) * (least[2].toLowerCase() === "minute" ? 60 : 1) };
  if (/(under|within|less than|no more than).*(second|minute)s?/i.test(text)) return { kind: "under" };
  return null;
}

export function TakeRecorder({
  limitSec,
  criteria = [],
  onDone,
  onFallback,
  onClose,
}: {
  /** The challenge's limit - the clock starts here and the recording stops here. */
  limitSec: number;
  /** What the challenge asks for, one line each - the brief, on screen
   *  while they speak, each line ticked as it's met. */
  criteria?: string[];
  /** The take, with the seconds it ran. */
  onDone: (file: File, durationSec: number) => void;
  /** The browser couldn't record: open the phone's camera app instead. */
  onFallback: () => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<"asking" | "ready" | "recording" | "finishing" | "denied">("asking");
  const [left, setLeft] = useState(limitSec);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [briefOpen, setBriefOpen] = useState(true);

  // The camera, opened when the sheet opens and closed when it closes.
  const open = useCallback(async (mode: "user" | "environment") => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setPhase("ready");
    } catch {
      setPhase("denied");
    }
  }, []);

  useEffect(() => {
    // Deferred a tick: opening the camera resolves into state, and the
    // linter wants that off the effect's own frame.
    const t = window.setTimeout(() => open(facing), 0);
    return () => {
      window.clearTimeout(t);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [open, facing]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return;
    setPhase("finishing");
    if (tickRef.current) window.clearInterval(tickRef.current);
    playRecordStop();
    rec.stop();
  }, []);

  const start = () => {
    const stream = streamRef.current;
    const mime = pickMime();
    if (!stream || !mime) return onFallback();
    chunksRef.current = [];
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const durationSec = Math.min(limitSec, Math.round((Date.now() - startedAtRef.current) / 1000));
      const ext = mime.startsWith("video/mp4") ? "mp4" : "webm";
      const type = mime.split(";")[0];
      const file = new File(chunksRef.current, `take-${Date.now()}.${ext}`, { type });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onDone(file, Math.max(1, durationSec));
    };
    recorderRef.current = rec;
    startedAtRef.current = Date.now();
    setLeft(limitSec);
    setPhase("recording");
    hapticTap();
    playRecordStart();
    rec.start(1000);
    // The clock, and the stop at the limit - to the second, from the
    // wall clock rather than a counter, so a slow tick can't drift it.
    tickRef.current = window.setInterval(() => {
      const gone = (Date.now() - startedAtRef.current) / 1000;
      const remaining = Math.max(0, Math.ceil(limitSec - gone));
      setLeft(remaining);
      if (remaining === alarmAt(limitSec) || remaining === warnAt(limitSec)) hapticTap();
      if (gone >= limitSec) stop();
    }, 200);
  };

  const recording = phase === "recording";
  const elapsed = limitSec - left;
  const isMet = (text: string, i: number): boolean => {
    const t = timed(text);
    if (t?.kind === "atLeast") return recording && elapsed >= t.seconds;
    if (t?.kind === "under") return recording;
    return ticked.has(i);
  };
  const tone = left <= alarmAt(limitSec) ? "alarm" : left <= warnAt(limitSec) ? "warn" : "calm";
  const ring = limitSec > 0 ? 1 - left / limitSec : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-navy-950" role="dialog" aria-modal="true" aria-label="Record your take">
      {/* The preview fills the screen; the student sees themselves the
          way the coach will. Mirrored for the front camera. */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className={`absolute inset-0 size-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-transparent to-navy-950/80" />

      {/* Top: close, and the clock. */}
      <div className="relative flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => {
            if (recording) stop();
            else onClose();
          }}
          aria-label={recording ? "Stop and keep" : "Close"}
          className="grid size-10 place-items-center rounded-full border border-white/20 bg-navy-950/60 text-ink backdrop-blur-sm"
        >
          <XIcon className="size-4" />
        </button>

        <div
          className={`take-clock flex items-center gap-2 rounded-full border px-3.5 py-2 backdrop-blur-sm ${
            !recording
              ? "border-white/20 bg-navy-950/60 text-ink"
              : tone === "alarm"
                ? "take-clock-alarm border-acting bg-acting/20 text-acting"
                : tone === "warn"
                  ? "border-figurative bg-figurative/15 text-figurative"
                  : "border-mindset/60 bg-navy-950/60 text-mindset"
          }`}
          aria-live={tone === "alarm" ? "assertive" : "off"}
        >
          {recording && <span className={`size-2 rounded-full ${tone === "alarm" ? "bg-acting" : tone === "warn" ? "bg-figurative" : "bg-acting take-rec-dot"}`} />}
          <span className="text-lg font-bold tabular-nums leading-none">{clock(left)}</span>
          {!recording && <span className="text-xs text-ink-muted">max</span>}
        </div>
      </div>

      {/* The brief, in shorthand, while they speak: each line ticks as
          it's met - by the clock where the clock can tell, by their own
          tap where only they can. A tap on the heading folds it away. */}
      {criteria.length > 0 && phase !== "denied" && (
        <div className="relative mx-4 max-w-xs self-start rounded-xl border border-white/15 bg-navy-950/70 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setBriefOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-ink-muted"
          >
            The brief
            <span className="tabular-nums text-ink-faint">
              {criteria.filter((c, i) => isMet(c, i)).length}/{criteria.length}
            </span>
          </button>
          {briefOpen && (
            <ul className="flex flex-col gap-1 px-2 pb-2">
              {criteria.map((c, i) => {
                const met = isMet(c, i);
                const byClock = timed(c) !== null;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      disabled={byClock}
                      onClick={() => {
                        hapticTap();
                        setTicked((prev) => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          return next;
                        });
                      }}
                      className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left text-xs leading-snug disabled:cursor-default"
                    >
                      <span
                        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors ${
                          met ? "border-mindset bg-mindset text-navy-950 shadow-[0_0_8px_-1px_var(--color-mindset)]" : "border-white/30 text-transparent"
                        }`}
                      >
                        <CheckIcon className="size-2.5" />
                      </span>
                      <span className={met ? "text-ink" : "text-ink-muted"}>{c}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* The last stretch, said in words as well as colour. */}
      {recording && tone !== "calm" && (
        <p
          key={tone}
          className={`coach-cue absolute inset-x-0 top-20 text-center text-sm font-semibold ${
            tone === "alarm" ? "text-acting" : "text-figurative"
          }`}
        >
          {tone === "alarm" ? `${left} seconds - land it` : `${warnAt(limitSec)} seconds left - head for the close`}
        </p>
      )}

      {/* Bottom: the record button inside a ring that fills as the time goes. */}
      <div className="relative mt-auto flex flex-col items-center gap-4 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {phase === "denied" ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="max-w-xs text-sm text-ink">
              The camera isn&apos;t available here. Your phone&apos;s own camera can record the take instead -
              keep it under {clock(limitSec)}.
            </p>
            <button
              type="button"
              onClick={onFallback}
              className="inline-flex items-center gap-2 rounded-lg bg-acting px-5 py-2.5 text-sm font-semibold text-navy-900"
            >
              <VideoIcon className="size-4" />
              Use the phone&apos;s camera
            </button>
          </div>
        ) : (
          <>
            <p className="text-center text-xs text-ink-muted">
              {phase === "asking"
                ? "Opening the camera…"
                : recording
                  ? "Tap to stop when you've landed the close"
                  : `This challenge is ${clock(limitSec)} at most - the recording stops itself there`}
            </p>
            <div className="relative grid size-24 place-items-center">
              <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
                {recording && (
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke={tone === "alarm" ? "var(--color-acting)" : tone === "warn" ? "var(--color-figurative)" : "var(--color-mindset)"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 46}`}
                    strokeDashoffset={`${2 * Math.PI * 46 * (1 - ring)}`}
                    className="transition-[stroke-dashoffset] duration-200 ease-linear"
                  />
                )}
              </svg>
              <button
                type="button"
                onClick={recording ? stop : start}
                disabled={phase === "asking" || phase === "finishing"}
                aria-label={recording ? "Stop recording" : "Start recording"}
                className={`grid place-items-center rounded-full transition-all disabled:opacity-50 ${
                  recording ? "size-10 rounded-lg bg-acting" : "size-16 bg-acting shadow-[0_0_28px_-4px_var(--color-acting)]"
                }`}
              />
            </div>
            {!recording && phase === "ready" && (
              <button
                type="button"
                onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                className="text-xs font-medium text-ink-faint underline-offset-4 hover:text-ink hover:underline"
              >
                Flip camera
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function clock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
