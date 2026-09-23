"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, RepeatIcon, SendIcon, VideoIcon, XIcon } from "@/components/icons";
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

/** Seconds left at which the clock turns yellow, then orange, then red
 *  - closer in on a short challenge, where a minute would be the whole
 *  take. A student should feel the time going without looking away. */
function noticeAt(limit: number): number {
  return limit <= 60 ? 20 : 60;
}
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
  const [phase, setPhase] = useState<"asking" | "ready" | "recording" | "finishing" | "denied" | "review">("asking");
  // The take just recorded, held here so the two questions that follow
  // - keep it or go again - are asked without leaving the camera.
  const [take, setTake] = useState<{ file: File; url: string; durationSec: number } | null>(null);
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
      setTake({ file, url: URL.createObjectURL(file), durationSec: Math.max(1, durationSec) });
      setPhase("review");
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
      if (remaining === alarmAt(limitSec) || remaining === warnAt(limitSec) || remaining === noticeAt(limitSec)) hapticTap();
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
  const tone =
    left <= alarmAt(limitSec) ? "alarm" : left <= warnAt(limitSec) ? "warn" : left <= noticeAt(limitSec) ? "notice" : "calm";
  /** The clock's color at this tone - yellow, orange, red. */
  const toneColor =
    tone === "alarm" ? "var(--color-acting)" : tone === "warn" ? "var(--color-figurative)" : "var(--color-storytelling)";
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
          style={
            recording && tone !== "calm"
              ? { color: toneColor, borderColor: toneColor, background: `color-mix(in oklab, ${toneColor} 18%, rgba(6,10,21,0.6))` }
              : undefined
          }
          className={`take-clock flex items-center gap-2 rounded-full border px-3.5 py-2 backdrop-blur-sm ${
            !recording
              ? "border-white/20 bg-navy-950/60 text-ink"
              : tone === "alarm"
                ? "take-clock-alarm"
                : tone === "calm"
                  ? "border-mindset/60 bg-navy-950/60 text-mindset"
                  : ""
          }`}
          aria-live={tone === "alarm" ? "assertive" : "off"}
        >
          {recording && (
            <span
              style={tone === "calm" ? undefined : { background: toneColor }}
              className={`size-2 rounded-full ${tone === "calm" ? "bg-acting take-rec-dot" : ""}`}
            />
          )}
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
            Complete the challenge by
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
                      {/* The circle fills as the line is met - one
                          color, filling, rather than seven. */}
                      <span
                        className={`relative mt-0.5 grid size-5 shrink-0 place-items-center overflow-hidden rounded-full border transition-colors ${
                          met ? "border-mindset text-navy-950 shadow-[0_0_10px_-1px_var(--color-mindset)]" : "border-white/30 text-transparent"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`absolute inset-0 rounded-full bg-mindset transition-transform duration-500 ease-out ${
                            met ? "scale-100" : "scale-0"
                          }`}
                        />
                        <CheckIcon className="relative size-3" />
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

      {/* The last stretch, said in words as well as color. */}
      {recording && tone !== "calm" && (
        <p
          key={tone}
          style={{ color: toneColor }}
          className="coach-cue absolute inset-x-0 top-20 text-center text-sm font-semibold"
        >
          {tone === "alarm"
            ? `${left} seconds - land it`
            : tone === "warn"
              ? `${warnAt(limitSec)} seconds left - head for the close`
              : `${noticeAt(limitSec)} seconds left`}
        </p>
      )}

      {/* The take, right where it was made: watch it back, go again, or
          send it to Coach. Leaving the camera to answer that question
          was a step too many. */}
      {phase === "review" && take && (
        <div className="absolute inset-0 z-10 flex flex-col bg-navy-950">
          <video src={take.url} controls playsInline autoPlay className="min-h-0 flex-1 bg-navy-950 object-contain" />
          <div className="flex flex-col gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <p className="text-center text-xs text-ink-muted">
              {clock(take.durationSec)} recorded - happy with it?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(take.url);
                  setTake(null);
                  setTicked(new Set());
                  void open(facing);
                }}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-navy-500 px-5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                <RepeatIcon className="size-4" />
                Redo
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = take;
                  setTake(null);
                  onDone(t.file, t.durationSec);
                }}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-acting px-6 text-base font-bold text-navy-950 shadow-[0_0_28px_-6px_var(--color-acting)] transition-opacity hover:opacity-90"
              >
                <SendIcon className="size-5" />
                Send it to Coach
              </button>
            </div>
          </div>
        </div>
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
            {/* The one setup note that changes the score most: the coach
                can only score what it can see. */}
            {!recording && phase === "ready" && (
              <p className="rounded-full border border-body-language/40 bg-navy-900/80 px-3 py-1 text-center text-[0.65rem] font-medium text-body-language">
                Prop the phone up so your hands and body are in frame - Coach scores what he can see
              </p>
            )}
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
