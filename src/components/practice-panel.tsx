"use client";

import { useRef, useState } from "react";
import { useStore, type Attempt, type FeedbackNote } from "@/lib/store";
import type { Challenge } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";
import { categoryById, type CategoryId } from "@/data/categories";
import { SpectrumBars, SpectrumStrip } from "@/components/spectrum";
import { CheckIcon, CircleIcon } from "@/components/icons";

// The practice loop (master plan §06, steps 3–7; build plan Phase 4).
//
// Video handling honors §13: the file is read locally for duration and
// playback via an object URL — in this stub it never leaves the device
// at all. The real integration uploads it temporarily for Gemini's
// review, then deletes it; the feedback record is what persists.

const MAX_SECONDS = 183; // 3 minutes, with a few seconds of grace

type Stage =
  | { kind: "idle" }
  | { kind: "selected"; file: File; url: string; durationSec: number }
  | { kind: "reviewing"; url: string; durationSec: number }
  | { kind: "reviewed"; url: string; attempt: Attempt }
  | { kind: "error"; message: string };

export function PracticePanel({ challenge }: { challenge: Challenge }) {
  const { state, ready, recordAttempt, attemptsFor, bestAttempt, latestAttempt } =
    useStore();
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  if (!ready) return null;
  if (challenge.passive) return <PassiveProgress challenge={challenge} />;

  const attempts = attemptsFor(challenge.slug);
  const best = bestAttempt(challenge.slug);
  const latest = latestAttempt(challenge.slug);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const durationSec = Math.round(probe.duration);
      if (!Number.isFinite(probe.duration) || durationSec <= 0) {
        setStage({ kind: "error", message: "Couldn't read that video — try a different file." });
        return;
      }
      if (durationSec > MAX_SECONDS) {
        setStage({
          kind: "error",
          message: `That's ${fmt(durationSec)} — challenge videos are three minutes max (two is the sweet spot). Trim it or record a tighter take.`,
        });
        return;
      }
      setStage({ kind: "selected", file, url, durationSec });
    };
    probe.onerror = () =>
      setStage({ kind: "error", message: "Couldn't read that video — try a different file." });
    probe.src = url;
  };

  const submit = async (url: string, durationSec: number) => {
    setStage({ kind: "reviewing", url, durationSec });
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeSlug: challenge.slug,
          durationSec,
          level: state.level ?? "beginner",
          attemptNumber: attempts.length + 1,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setStage({ kind: "error", message: err?.error ?? "Review failed — try again." });
        return;
      }
      const result = (await res.json()) as Omit<Attempt, "id" | "challengeSlug" | "at" | "durationSec">;
      const attempt: Attempt = {
        id: crypto.randomUUID(),
        challengeSlug: challenge.slug,
        at: new Date().toISOString(),
        durationSec,
        passed: result.passed,
        score: result.score,
        spectrum: result.spectrum,
        focus: result.focus,
        fullNotes: result.fullNotes,
        summary: result.summary,
      };
      recordAttempt(attempt);
      setStage({ kind: "reviewed", url, attempt });
    } catch {
      setStage({ kind: "error", message: "Review failed — check your connection and try again." });
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
        Your attempt
      </h2>

      {(best || latest) && stage.kind === "idle" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {best && <AttemptCard label="Best attempt" attempt={best} />}
          {latest && latest.id !== best?.id && (
            <AttemptCard label="Most recent" attempt={latest} />
          )}
        </div>
      )}

      {stage.kind === "idle" && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-navy-600 bg-navy-800 p-5">
          <p className="text-sm text-ink-muted">
            Record yourself on your phone — selfie mode, two minutes ideal,
            three max — then upload it here for your AI review.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            capture="user"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
          >
            {attempts.length > 0 ? "Record another attempt" : "Upload your video"}
          </button>
          <p className="text-xs text-ink-faint">
            Your video is reviewed, never stored — the feedback is what&apos;s
            kept. (AI review stub — Gemini arrives with service integration.)
          </p>
        </div>
      )}

      {stage.kind === "error" && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-acting/40 bg-navy-800 p-5">
          <p className="text-sm text-ink">{stage.message}</p>
          <button
            type="button"
            onClick={() => setStage({ kind: "idle" })}
            className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Try again
          </button>
        </div>
      )}

      {stage.kind === "selected" && (
        <div className="flex flex-col gap-3 rounded-xl border border-navy-600 bg-navy-800 p-5">
          <video src={stage.url} controls playsInline className="w-full rounded-lg bg-navy-950" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-faint">
              {fmt(stage.durationSec)} — looks good
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStage({ kind: "idle" })}
                className="rounded-lg border border-navy-600 px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                Re-record
              </button>
              <button
                type="button"
                onClick={() => submit(stage.url, stage.durationSec)}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
              >
                Submit for review
              </button>
            </div>
          </div>
        </div>
      )}

      {stage.kind === "reviewing" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-navy-600 bg-navy-800 p-8 text-center">
          <div className="spectrum-rule h-1 w-24 animate-pulse rounded-full" />
          <p className="text-sm text-ink-muted">
            Your coach is watching your performance…
          </p>
        </div>
      )}

      {stage.kind === "reviewed" && (
        <Feedback
          attempt={stage.attempt}
          videoUrl={stage.url}
          challengeTitle={challenge.title}
          onDone={() => setStage({ kind: "idle" })}
        />
      )}
    </section>
  );
}

function fmt(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function AttemptCard({ label, attempt }: { label: string; attempt: Attempt }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-faint">
          {label}
        </span>
        <span className="text-lg font-bold tabular-nums text-ink">
          {attempt.score}
        </span>
      </div>
      <SpectrumStrip spectrum={attempt.spectrum} />
      <span className="text-xs text-ink-faint">
        {new Date(attempt.at).toLocaleDateString()} ·{" "}
        {attempt.passed ? "passed" : "not passed"}
      </span>
    </div>
  );
}

function Feedback({
  attempt,
  videoUrl,
  challengeTitle,
  onDone,
}: {
  attempt: Attempt;
  videoUrl: string;
  challengeTitle: string;
  onDone: () => void;
}) {
  const { state } = useStore();
  const canRevealAll = state.level !== "beginner"; // §08/§09: nested reveal

  const download = () => {
    const lines = [
      `Speak Better — Feedback`,
      `Challenge: ${challengeTitle}`,
      `Date: ${new Date(attempt.at).toLocaleString()}`,
      `Score: ${attempt.score} / 100 (${attempt.passed ? "passed" : "not passed"})`,
      ``,
      attempt.summary,
      ``,
      `Focus on next:`,
      ...attempt.focus.map((n) => `- [${catName(n.category)}] ${n.note}`),
      ...(canRevealAll
        ? [``, `Everything the coach noticed:`, ...attempt.fullNotes.map((n) => `- [${catName(n.category)}] ${n.note}`)]
        : []),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `speak-better-feedback-${attempt.at.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-navy-600 bg-navy-800 p-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              attempt.passed ? "text-mindset" : "text-storytelling"
            }`}
          >
            {attempt.passed ? "Challenge complete" : "Keep going"}
          </span>
          <span className="text-3xl font-bold tabular-nums text-ink">
            {attempt.score}
            <span className="text-base font-normal text-ink-faint"> / 100</span>
          </span>
        </div>
        <button
          type="button"
          onClick={download}
          className="rounded-lg border border-navy-600 px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          Download feedback
        </button>
      </div>

      <p className="text-sm text-ink-muted">{attempt.summary}</p>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
          Your color spectrum
        </h3>
        <SpectrumBars spectrum={attempt.spectrum} />
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
          Focus on next
        </h3>
        <ul className="flex flex-col gap-2">
          {attempt.focus.map((note, i) => (
            <FeedbackNoteRow key={i} note={note} />
          ))}
        </ul>
      </div>

      {canRevealAll && attempt.fullNotes.length > 0 && (
        <details className="rounded-lg border border-navy-600">
          <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
            Everything your coach noticed ({attempt.fullNotes.length})
          </summary>
          <ul className="flex flex-col gap-2 px-3 pb-3">
            {attempt.fullNotes.map((note, i) => (
              <FeedbackNoteRow key={i} note={note} />
            ))}
          </ul>
        </details>
      )}

      <details className="rounded-lg border border-navy-600">
        <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
          Watch your attempt back
        </summary>
        <div className="px-3 pb-3">
          <video src={videoUrl} controls playsInline className="w-full rounded-lg bg-navy-950" />
          <p className="mt-2 text-xs text-ink-faint">
            Played from your device — the app doesn&apos;t keep your video.
          </p>
        </div>
      </details>

      <button
        type="button"
        onClick={onDone}
        className="self-start rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
      >
        {attempt.passed ? "Continue" : "Try again"}
      </button>
    </div>
  );
}

function catName(id: CategoryId): string {
  return categoryById.get(id)?.name ?? id;
}

function FeedbackNoteRow({ note }: { note: FeedbackNote }) {
  const cat = categoryById.get(note.category);
  return (
    <li className="flex items-start gap-2 text-sm text-ink">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${cat?.bgClass ?? ""}`} />
      <span>{note.note}</span>
    </li>
  );
}

function PassiveProgress({ challenge }: { challenge: Challenge }) {
  const { state } = useStore();
  const watched = challenge.relatedLessonIds.filter((id) =>
    state.watchedLessons.includes(id),
  );
  const done = watched.length === challenge.relatedLessonIds.length;
  return (
    <section className="rounded-xl border border-navy-600 bg-navy-800 p-4">
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-ink-faint">
        Your progress
      </h2>
      <p className="text-sm text-ink-muted">
        {done
          ? "Toolbox complete — every mindset lesson watched. That foundation carries the whole journey."
          : `${watched.length} of ${challenge.relatedLessonIds.length} lessons watched. Open each lesson above to complete this challenge.`}
      </p>
      {!done && (
        <ul className="mt-3 flex flex-col gap-1 text-xs text-ink-faint">
          {challenge.relatedLessonIds.map((id) => {
            const lesson = lessonByVimeoId.get(id);
            const isWatched = state.watchedLessons.includes(id);
            return (
              <li key={id} className="flex items-center gap-2">
                <span className={isWatched ? "text-mindset" : "text-ink-faint"}>
                  {isWatched ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <CircleIcon className="size-3.5" />
                  )}
                </span>
                {lesson?.title ?? id}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
