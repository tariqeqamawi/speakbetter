"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useStore, type Attempt, type FeedbackNote } from "@/lib/store";
import { GRACE_SECONDS, maxSecondsFor, type Challenge } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";
import { categoryById, type CategoryId } from "@/data/categories";
import Link from "next/link";
import { SpectrumBars, SpectrumStrip } from "@/components/spectrum";
import { CheckIcon, CircleIcon, FilmIcon, PlayIcon, VideoIcon } from "@/components/icons";
import { RecordingsShelf } from "@/components/recordings-shelf";
import { capturePoster, keepVideo } from "@/lib/attempt-videos";
import { TalkingLion, type TalkingLionHandle } from "@/components/talking-lion";
import { speakUrl } from "@/lib/coach/voice";

// The practice loop (master plan §06, steps 3–7; build plan Phase 4).
//
// Video handling honors §13: the file is read locally for duration and
// playback via an object URL. For the review it goes straight from the
// phone to a private store (api/review/upload issues the permission),
// the coach watches it, and it's deleted; the feedback record is what
// persists - and the video itself is kept on the student's own device,
// the last three per challenge, so they can watch back what they
// submitted (see lib/attempt-videos.ts and the shelf above the box).
//
// The time limit is the challenge's own (three minutes unless it says
// otherwise, the pitch is thirty seconds), with five seconds of grace
// and no more: being succinct is part of what the course teaches.

type Stage =
  | { kind: "idle" }
  | { kind: "selected"; file: File; url: string; durationSec: number }
  | { kind: "uploading"; file: File; url: string; durationSec: number; percent: number }
  | { kind: "reviewing"; file: File; url: string; durationSec: number }
  | { kind: "reviewed"; url: string; attempt: Attempt }
  | { kind: "error"; message: string };

/** "3 minutes", "30 seconds", "1:30". */
function limitLabel(sec: number): string {
  if (sec % 60 === 0) return `${sec / 60} minute${sec === 60 ? "" : "s"}`;
  if (sec < 60) return `${sec} seconds`;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function PracticePanel({ challenge }: { challenge: Challenge }) {
  const { state, ready, recordAttempt, attemptsFor, bestAttempt, latestAttempt } =
    useStore();
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  // Bumped once a new recording is on the device, so the shelf re-reads.
  const [shelfKey, setShelfKey] = useState(0);
  // Two pickers: one that opens the camera, one that opens the library.
  // A single input with `capture` skips the library on a phone, and
  // one without it makes the camera a second tap away.
  const recordRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);

  if (!ready) return null;
  if (challenge.passive) return <PassiveProgress challenge={challenge} />;

  const attempts = attemptsFor(challenge.slug);
  const best = bestAttempt(challenge.slug);
  const latest = latestAttempt(challenge.slug);
  const limit = maxSecondsFor(challenge);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const durationSec = Math.round(probe.duration);
      if (!Number.isFinite(probe.duration) || durationSec <= 0) {
        setStage({ kind: "error", message: "Couldn't read that video - try a different file." });
        return;
      }
      if (durationSec > limit + GRACE_SECONDS) {
        setStage({
          kind: "error",
          message: `Your video is too long - that's ${fmt(durationSec)}, and this challenge is ${limitLabel(limit)} at most. Try again and keep it under ${limitLabel(limit)}: being succinct is part of the skill.`,
        });
        return;
      }
      setStage({ kind: "selected", file, url, durationSec });
    };
    probe.onerror = () =>
      setStage({ kind: "error", message: "Couldn't read that video - try a different file." });
    probe.src = url;
  };

  const submit = async (file: File, url: string, durationSec: number) => {
    setStage({ kind: "uploading", file, url, durationSec, percent: 0 });
    // A frame for the shelf, taken while the coach is watching - the
    // wait is there anyway.
    const poster = capturePoster(url, durationSec);
    try {
      // The recording goes phone-to-store; the server only issues the
      // permission. Where uploads aren't configured (a preview without
      // the store) the review runs without a video and the stand-in
      // coach answers.
      let blobUrl: string | undefined;
      try {
        const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
        const put = await upload(`attempts/${challenge.slug}/${crypto.randomUUID()}.${ext}`, file, {
          access: "private",
          handleUploadUrl: "/api/review/upload",
          contentType: file.type || "video/mp4",
          multipart: file.size > 8 * 1024 * 1024,
          clientPayload: JSON.stringify({ challengeSlug: challenge.slug, durationSec }),
          onUploadProgress: ({ percentage }) =>
            setStage((s) => (s.kind === "uploading" ? { ...s, percent: Math.round(percentage) } : s)),
        });
        blobUrl = put.url;
      } catch (err) {
        // A refusal (too long, wrong type) is worth telling; a missing
        // store just means the stand-in answers.
        const message = err instanceof Error ? err.message : "";
        if (/too long|at most|seconds/i.test(message)) {
          setStage({ kind: "error", message });
          return;
        }
        blobUrl = undefined;
      }

      setStage({ kind: "reviewing", file, url, durationSec });
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeSlug: challenge.slug,
          durationSec,
          level: state.level ?? "beginner",
          attemptNumber: attempts.length + 1,
          blobUrl,
          contentType: file.type || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setStage({ kind: "error", message: err?.error ?? "Review failed - try again." });
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
        briefVerdict: result.briefVerdict,
        criteria: result.criteria,
        lessonsUsed: result.lessonsUsed,
        skillsSpotted: result.skillsSpotted,
        strengths: result.strengths,
        spoken: result.spoken,
        mock: result.mock || undefined,
      };
      recordAttempt(attempt);
      setStage({ kind: "reviewed", url, attempt });
      // The feedback is recorded; now the video, on this device only.
      // If the browser won't keep it, nothing is lost but the replay.
      // A baseline's first take is the "before" and is pinned for good
      // (see lib/attempt-videos.ts); keepVideo ignores the pin if this
      // device already holds one.
      keepVideo(
        {
          id: attempt.id,
          challengeSlug: challenge.slug,
          at: attempt.at,
          durationSec,
          size: file.size,
          type: file.type,
          poster: await poster,
        },
        file,
        Boolean(challenge.baseline),
      ).then((kept) => {
        if (kept) setShelfKey((k) => k + 1);
      });
    } catch {
      setStage({ kind: "error", message: "Review failed - check your connection and try again." });
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
        <RecordingsShelf
          challengeSlug={challenge.slug}
          attempts={attempts}
          refreshKey={shelfKey}
        />
      )}

      {stage.kind === "idle" && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-navy-600 bg-navy-800 p-5">
          <p className="text-sm text-ink-muted">
            Record yourself here - selfie mode,{" "}
            {limit >= 120
              ? `${limitLabel(limit)} at most, and shorter is better`
              : `${limitLabel(limit)} at most`}
            {" "}- or choose one you&apos;ve already recorded, and your coach will review it.
          </p>
          <input
            ref={recordRef}
            type="file"
            accept="video/*"
            capture="user"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <input
            ref={pickRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => recordRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
            >
              <VideoIcon className="size-4" />
              {attempts.length > 0 ? "Record another attempt" : "Record now"}
            </button>
            <button
              type="button"
              onClick={() => pickRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-navy-600 px-5 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              <FilmIcon className="size-4" />
              Choose from library
            </button>
          </div>
          <p className="text-xs text-ink-faint">
            Your video goes to your coach for review and is deleted the
            moment the review is back - it&apos;s never stored by us. The
            feedback is what&apos;s kept, and your last three recordings
            stay on this device so you can watch them back.
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
              {fmt(stage.durationSec)} - looks good
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
                onClick={() => submit(stage.file, stage.url, stage.durationSec)}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
              >
                Submit for review
              </button>
            </div>
          </div>
        </div>
      )}

      {stage.kind === "uploading" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-navy-600 bg-navy-800 p-8 text-center">
          <div className="h-1 w-48 overflow-hidden rounded-full bg-navy-700">
            <div
              className="spectrum-rule h-full rounded-full transition-[width] duration-300"
              style={{ width: `${Math.max(4, stage.percent)}%` }}
            />
          </div>
          <p className="text-sm text-ink-muted">
            Sending your video to your coach… {stage.percent}%
          </p>
        </div>
      )}

      {stage.kind === "reviewing" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-navy-600 bg-navy-800 p-8 text-center">
          <div className="spectrum-rule h-1 w-24 animate-pulse rounded-full" />
          <p className="text-sm text-ink-muted">
            Your coach is watching your performance…
          </p>
          <p className="text-xs text-ink-faint text-balance">
            Watching and listening properly takes a minute or two. Stay on
            this page.
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

  // The reveal is a sequence, not a page load: bars land one at a time,
  // the score counts up, the verdict arrives, the notes follow. Same
  // data throughout - the anticipation is the reward, and it's free.
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [barsShown, setBarsShown] = useState(reduceMotion ? 7 : 0);
  const [shownScore, setShownScore] = useState(reduceMotion ? attempt.score : 0);
  const barsDone = barsShown >= 7;
  const scoreDone = shownScore >= attempt.score;

  // One bar every 260ms - enough gap for each landing to register.
  useEffect(() => {
    if (barsDone) return;
    const t = setTimeout(() => setBarsShown(barsShown + 1), barsShown === 0 ? 500 : 260);
    return () => clearTimeout(t);
  }, [barsShown, barsDone]);

  // Then the score climbs, fast at first and slowing into the final
  // number - the last few points take the longest, as they should.
  useEffect(() => {
    if (!barsDone || scoreDone) return;
    const remaining = attempt.score - shownScore;
    const step = Math.max(1, Math.ceil(remaining / 12));
    const t = setTimeout(() => setShownScore(Math.min(attempt.score, shownScore + step)), 55);
    return () => clearTimeout(t);
  }, [barsDone, scoreDone, shownScore, attempt.score]);

  const settled = barsDone && scoreDone;
  // The verdict comes last - the whole review first, then the line
  // they were waiting for. Where there's a spoken review it lands
  // when the coach reaches it; otherwise a beat after the notes.
  const [verdictShown, setVerdictShown] = useState(reduceMotion || !attempt.spoken);
  useEffect(() => {
    if (!settled || verdictShown || attempt.spoken) return;
    const t = setTimeout(() => setVerdictShown(true), 1400);
    return () => clearTimeout(t);
  }, [settled, verdictShown, attempt.spoken]);

  const noteLine = (n: FeedbackNote) => {
    const refs = canRevealAll
      ? (n.lessonIds ?? [])
          .map((id) => lessonByVimeoId.get(id)?.title)
          .filter(Boolean)
      : [];
    return `- [${catName(n.category)}] ${n.note}${
      refs.length ? ` (lesson: ${refs.join(", ")})` : ""
    }`;
  };

  const download = () => {
    const lines = [
      `Speak Better - Feedback`,
      `Challenge: ${challengeTitle}`,
      `Date: ${new Date(attempt.at).toLocaleString()}`,
      `Score: ${attempt.score} / 100 (${attempt.passed ? "passed" : "not passed"})`,
      ``,
      attempt.summary,
      ``,
      `Focus on next:`,
      ...attempt.focus.map(noteLine),
      ...(canRevealAll
        ? [``, `Everything the coach noticed:`, ...attempt.fullNotes.map(noteLine)]
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
            className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
              !settled
                ? "text-ink-faint"
                : attempt.passed
                  ? "text-mindset"
                  : "text-storytelling"
            }`}
          >
            {!settled
              ? "Reading your talk…"
              : verdictShown
                ? attempt.passed
                  ? "Challenge complete"
                  : "Keep going"
                : "Your review"}
          </span>
          <span
            className={`text-3xl font-bold tabular-nums text-ink transition-transform duration-300 ${
              settled ? "" : "opacity-90"
            }`}
          >
            {barsDone ? shownScore : "–"}
            <span className="text-base font-normal text-ink-faint"> / 100</span>
          </span>
        </div>
        {settled && (
          <button
            type="button"
            onClick={download}
            className="coach-cue rounded-lg border border-navy-600 px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Download feedback
          </button>
        )}
      </div>

      {settled && attempt.spoken && (
        <ReviewVoice
          spoken={attempt.spoken}
          onVerdict={() => setVerdictShown(true)}
        />
      )}

      {settled && (
        <p className="coach-cue text-sm text-ink-muted">{attempt.summary}</p>
      )}

      {settled && attempt.criteria && attempt.criteria.length > 0 && (
        <div className="coach-cue" style={{ animationDelay: "80ms" }}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
            The brief
          </h3>
          {attempt.briefVerdict && (
            <p className="mb-2 text-sm text-ink">{attempt.briefVerdict}</p>
          )}
          <ul className="flex flex-col gap-1.5">
            {attempt.criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
                    c.met ? "bg-mindset text-navy-950" : "border border-navy-500 text-ink-faint"
                  }`}
                >
                  {c.met ? <CheckIcon className="size-3" /> : <CircleIcon className="size-2" />}
                </span>
                <span className="flex flex-col">
                  <span className={c.met ? "text-ink" : "text-ink-muted"}>{c.text}</span>
                  {c.evidence && (
                    <span className="text-xs text-ink-faint">{c.evidence}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {settled && attempt.strengths && attempt.strengths.length > 0 && (
        <div className="coach-cue" style={{ animationDelay: "100ms" }}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
            What worked
          </h3>
          <ul className="flex flex-col gap-2">
            {attempt.strengths.map((note, i) => (
              <FeedbackNoteRow key={i} note={note} showLessons={canRevealAll} />
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
          Your color spectrum
        </h3>
        <SpectrumBars spectrum={attempt.spectrum} revealCount={barsShown} />
      </div>

      {settled && attempt.lessonsUsed && attempt.lessonsUsed.length > 0 && (
        <div className="coach-cue" style={{ animationDelay: "120ms" }}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
            The lessons this challenge asked for
          </h3>
          <ul className="flex flex-col gap-2">
            {attempt.lessonsUsed.map((l) => {
              const lesson = lessonByVimeoId.get(l.lessonId);
              if (!lesson) return null;
              const cat = categoryById.get(lesson.category);
              return (
                <li key={l.lessonId} className="flex flex-col gap-1 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`size-2 shrink-0 rounded-full ${cat?.bgClass ?? ""}`} />
                    <Link
                      href={`/skills/${lesson.category}/${lesson.vimeoId}`}
                      className="flex-1 font-medium text-ink underline-offset-4 hover:underline"
                    >
                      {lesson.title}
                    </Link>
                    <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-navy-700">
                      <span
                        className={`block h-full rounded-full ${cat?.bgClass ?? "bg-ink"} ${l.used ? "" : "opacity-30"}`}
                        style={{ width: `${l.used ? Math.max(8, l.quality * 10) : 0}%` }}
                      />
                    </span>
                    <span className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-faint">
                      {l.used ? `${l.quality}/10` : "–"}
                    </span>
                  </span>
                  {l.evidence && (
                    <span className="pl-4 text-xs text-ink-faint">{l.evidence}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Skills hit by instinct - Intermediate and Advanced see them
          named, with the lesson behind each, so what was luck can be
          studied on purpose (§08). A Beginner is told how many, and
          that the list is waiting at the next level. */}
      {settled && attempt.skillsSpotted && attempt.skillsSpotted.length > 0 && (
        <div className="coach-cue rounded-lg border border-navy-600 bg-navy-900/50 p-3" style={{ animationDelay: "140ms" }}>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-faint">
            Skills you used without being asked
          </h3>
          {canRevealAll ? (
            <ul className="flex flex-col gap-2">
              {attempt.skillsSpotted.map((s) => {
                const lesson = lessonByVimeoId.get(s.lessonId);
                if (!lesson) return null;
                const cat = categoryById.get(lesson.category);
                return (
                  <li key={s.lessonId} className="flex flex-col gap-0.5 text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`size-2 shrink-0 rounded-full ${cat?.bgClass ?? ""}`} />
                      {s.at && (
                        <span className="rounded bg-navy-700 px-1 py-0.5 text-[0.65rem] font-semibold tabular-nums text-ink-muted">
                          {s.at}
                        </span>
                      )}
                      <Link
                        href={`/skills/${lesson.category}/${lesson.vimeoId}`}
                        className="flex-1 font-medium text-ink underline-offset-4 hover:underline"
                      >
                        {lesson.title}
                      </Link>
                      <span className="text-xs tabular-nums text-ink-faint">{s.quality}/10</span>
                    </span>
                    {s.evidence && <span className="pl-4 text-xs text-ink-faint">{s.evidence}</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">
              Your coach spotted {attempt.skillsSpotted.length}{" "}
              {attempt.skillsSpotted.length === 1 ? "technique" : "techniques"} from other
              lessons in this take. At Intermediate they&apos;re named, with the
              lesson behind each.
            </p>
          )}
        </div>
      )}

      {settled && (
      <div className="coach-cue" style={{ animationDelay: "150ms" }}>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
          {attempt.strengths ? "For next time - do more of this" : "Focus on next"}
        </h3>
        <ul className="flex flex-col gap-2">
          {attempt.focus.map((note, i) => (
            <FeedbackNoteRow
              key={i}
              note={note}
              showLessons={canRevealAll}
              className="coach-cue"
              style={{ animationDelay: `${300 + i * 220}ms` }}
            />
          ))}
        </ul>
      </div>
      )}

      {settled && (
        <div
          className={`coach-cue rounded-xl border p-4 transition-opacity ${
            verdictShown ? "opacity-100" : "opacity-0"
          } ${attempt.passed ? "border-mindset/40 bg-mindset/10" : "border-storytelling/40 bg-storytelling/10"}`}
          aria-live="polite"
        >
          {verdictShown && (
            <>
              <p className={`text-sm font-semibold ${attempt.passed ? "text-mindset" : "text-storytelling"}`}>
                {attempt.passed ? "Congratulations - you've passed this challenge." : "Not quite there this time."}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {attempt.passed
                  ? "The next one is waiting on the map."
                  : "I'm sure you'll get it on the next attempt. Record a new video, upload it, and I'll be here waiting."}
              </p>
            </>
          )}
        </div>
      )}

      {settled && canRevealAll && attempt.fullNotes.length > 0 && (
        <details className="rounded-lg border border-navy-600">
          <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
            Everything your coach noticed ({attempt.fullNotes.length})
          </summary>
          <ul className="flex flex-col gap-2 px-3 pb-3">
            {attempt.fullNotes.map((note, i) => (
              <FeedbackNoteRow key={i} note={note} showLessons />
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
            Played from your device - the app keeps no copy. It stays on
            this phone with your last three recordings for this challenge.
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

/**
 * The coach saying the review aloud - thirty to forty-five seconds,
 * verdict last. Generated the moment the review arrives so it's ready
 * by the time the reveal is done; played from a tap, because that's
 * what browsers allow. The verdict block under the notes lands when
 * the coach reaches it, or on a tap of "Skip to the verdict".
 */
function ReviewVoice({ spoken, onVerdict }: { spoken: string; onVerdict: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "playing" | "done" | "failed">("loading");
  const lionRef = useRef<TalkingLionHandle>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    let alive = true;
    speakUrl(spoken).then((u) => {
      if (!alive) return;
      if (u) {
        setUrl(u);
        setState("ready");
      } else setState("failed");
    });
    return () => {
      alive = false;
    };
  }, [spoken]);

  const hear = () => {
    lionRef.current?.prime();
    setPlay(true);
    setState("playing");
  };

  return (
    <div className="coach-cue flex flex-col items-center gap-2 rounded-xl border border-navy-600 bg-navy-900/60 p-4">
      <TalkingLion
        ref={lionRef}
        audioSrc={play && url ? url : undefined}
        autoPlay={play}
        onEnded={() => {
          setState("done");
          onVerdict();
        }}
        className="scale-90"
      />
      {state === "loading" && (
        <p className="text-xs text-ink-faint">Your coach is getting ready to talk you through it…</p>
      )}
      {state === "ready" && (
        <button
          type="button"
          onClick={hear}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
        >
          Hear your review
        </button>
      )}
      {(state === "playing" || state === "done") && (
        <p className="max-w-prose text-center text-xs text-ink-faint text-balance">{spoken}</p>
      )}
      {state === "failed" && (
        <p className="max-w-prose text-center text-sm text-ink-muted">{spoken}</p>
      )}
      {state !== "done" && (
        <button
          type="button"
          onClick={onVerdict}
          className="text-xs font-medium text-ink-faint underline-offset-4 hover:text-ink hover:underline"
        >
          Skip to the verdict
        </button>
      )}
    </div>
  );
}

function catName(id: CategoryId): string {
  return categoryById.get(id)?.name ?? id;
}

function FeedbackNoteRow({
  note,
  showLessons = false,
  className = "",
  style,
}: {
  note: FeedbackNote;
  /** Intermediate/Advanced only (§08): link each observation back to the
   * Skills lesson behind it, so a skill used by instinct - or one still
   * missing - leads straight to its video. */
  showLessons?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cat = categoryById.get(note.category);
  const lessons = showLessons
    ? (note.lessonIds ?? [])
        .map((id) => lessonByVimeoId.get(id))
        .filter((l) => l !== undefined)
    : [];
  return (
    <li className={`flex items-start gap-2 text-sm text-ink ${className}`} style={style}>
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${cat?.bgClass ?? ""}`} />
      <span className="flex flex-col gap-1">
        <span>
          {note.at && (
            <span className="mr-1.5 rounded bg-navy-700 px-1 py-0.5 text-[0.65rem] font-semibold tabular-nums text-ink-muted">
              {note.at}
            </span>
          )}
          {note.note}
        </span>
        {lessons.length > 0 && (
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            {lessons.map((lesson) => (
              <Link
                key={lesson.vimeoId}
                href={`/skills/${lesson.category}/${lesson.vimeoId}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted underline decoration-navy-500 underline-offset-4 transition-colors hover:text-ink"
              >
                <PlayIcon className="size-3 shrink-0" />
                Watch the lesson: {lesson.title}
              </Link>
            ))}
          </span>
        )}
      </span>
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
          ? "Toolbox complete - every mindset lesson watched. That foundation carries the whole journey."
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
