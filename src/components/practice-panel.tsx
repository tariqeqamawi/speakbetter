"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useStore, type Attempt, type FeedbackNote } from "@/lib/store";
import { GRACE_SECONDS, challengeBySlug, maxSecondsFor, storyPhases, type Challenge } from "@/data/challenges";
import { XP, challengeXp, challengeXpFor, phaseGate } from "@/lib/progress";
import { LockIcon } from "@/components/icons";
import { ZapIcon } from "@/components/icons";
import { hapticPass, hapticTap, playMiss, playPass, playReviewReady, playSend, playXpDing } from "@/lib/feedback-fx";
import { Confetti } from "@/components/confetti";
import { TakePlayback } from "@/components/take-playback";
import { lessonByVimeoId } from "@/data/lessons";
import { categories, categoryById, type CategoryId } from "@/data/categories";
import Link from "next/link";
import { SpectrumBars, SpectrumKey } from "@/components/spectrum";
import { SpectrumWave } from "@/components/spectrum-wave";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CheckIcon,
  CircleIcon,
  ListenIcon,
  PlayIcon,
  SkillsIcon,
  SpectrumIcon,
  TrendingUpIcon,
  TrophyIcon,
  XIcon,
  RepeatIcon,
  UploadIcon,
} from "@/components/icons";
import { LionMouth } from "@/components/lion-mouth";
import { setPendingReview } from "@/lib/push-client";
import { studentId } from "@/lib/student-id";
import { PushPrompt } from "@/components/push-prompt";
import { TakeRecorder, canRecordInApp } from "@/components/take-recorder";
import { UpgradePanel } from "@/components/upgrade-panel";
import { TRIAL_REVIEWS, coachWatches, hasCoach, onTrial, trialAllowsChallenge, trialReviewsUsed } from "@/lib/plan";
import { RecordingsShelf } from "@/components/recordings-shelf";
import { capturePoster, keepVideo } from "@/lib/attempt-videos";
import { measureVoice } from "@/lib/voice-profile";
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
  | { kind: "uploading"; file: File; url: string; durationSec: number; percent: number }
  | { kind: "reviewing"; file: File; url: string; durationSec: number; poster?: string }
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
  // The map's gate, held here as well: a locked challenge reached by
  // its link says why, rather than taking a recording it won't count.
  const gate = ready ? phaseGate(state, storyPhases.findIndex((p) => p.id === challenge.phase)) : null;
  // The plan's limits (lib/plan.ts): the free baseline records the two
  // baseline challenges and gets one real review.
  const trial = ready && onTrial(state);
  const trialBlocked = trial && !trialAllowsChallenge(challenge);
  const trialSpent = trial && trialReviewsUsed(state) >= TRIAL_REVIEWS;
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  // Bumped once a new recording is on the device, so the shelf re-reads.
  const [shelfKey, setShelfKey] = useState(0);
  // Two pickers: one that opens the camera, one that opens the library.
  // A single input with `capture` skips the library on a phone, and
  // one without it makes the camera a second tap away.
  const recordRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  // The in-app recorder, with the clock; the camera app is the fallback.
  const [recorder, setRecorder] = useState(false);
  // The sticky record bar appears once the page has been scrolled past
  // the top of this panel.
  const panelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: "-120px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ready, stage.kind]);

  if (!ready) return null;
  if (challenge.passive) return <PassiveProgress challenge={challenge} />;

  const attempts = attemptsFor(challenge.slug);
  const best = bestAttempt(challenge.slug);
  const latest = latestAttempt(challenge.slug);
  const limit = maxSecondsFor(challenge);

  // A take recorded in the app arrives with its length known - a
  // MediaRecorder file often reports none - so it skips the probe.
  // A take finished in the recorder has already been kept or redone
  // there, so it goes straight up - the old "now press send" step was
  // the same question asked twice.
  const onRecorded = (file: File, durationSec: number) => {
    setRecorder(false);
    const url = URL.createObjectURL(file);
    void submit(file, url, durationSec);
  };

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
      // Chosen from the library: it's already the take they meant, so
      // it goes to Coach without another button.
      void submit(file, url, durationSec);
    };
    probe.onerror = () =>
      setStage({ kind: "error", message: "Couldn't read that video - try a different file." });
    probe.src = url;
  };

  const submit = async (file: File, url: string, durationSec: number) => {
    playSend();
    setStage({ kind: "uploading", file, url, durationSec, percent: 0 });
    // A frame for the shelf, taken while the coach is watching - the
    // wait is there anyway.
    const poster = capturePoster(url, durationSec);
    // What the microphone can measure - pitch, its range, how the
    // ends of phrases fall, where the weight of the voice sits -
    // worked out here while the file uploads, and sent up with it.
    const voice = measureVoice(file).catch(() => null);
    try {
      // The recording goes phone-to-store; the server only issues the
      // permission. Where uploads aren't configured (a preview without
      // the store) the review runs without a video and the stand-in
      // coach answers.
      let blobUrl: string | undefined;
      // Every plan gets the take watched (lib/plan.ts); what Starter
      // doesn't get is Coach's voice, which is decided in the review
      // below rather than here.
      const watch = coachWatches(state);
      try {
        if (!watch) throw new Error("standing coach");
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
      // The still for the watching scene, once it's ready - it was
      // captured while the upload ran.
      poster.then((p) => {
        if (p) setStage((s) => (s.kind === "reviewing" ? { ...s, poster: p } : s));
      });
      // The attempt's id is fixed before the coach starts, and noted as
      // pending: if the student leaves the page while the coach watches,
      // the review is kept for them under it (api/review/result) and
      // picked up on their next open (lib/push-client).
      const attemptId = crypto.randomUUID();
      setPendingReview({ attemptId, challengeSlug: challenge.slug, durationSec, at: new Date().toISOString() });
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
          studentId: studentId(),
          attemptId,
          voice: await voice,
          history: takeHistory(state.attempts),
        }),
      });
      if (!res.ok) {
        setPendingReview(null);
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        setStage({ kind: "error", message: err?.error ?? "Review failed - try again." });
        return;
      }
      setPendingReview(null);
      const result = (await res.json()) as Omit<Attempt, "id" | "challengeSlug" | "at" | "durationSec">;
      const attempt: Attempt = {
        id: attemptId,
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
        observations: result.observations,
        progress: result.progress,
        voice: (await voice) ?? undefined,
        mock: result.mock || undefined,
      };
      recordAttempt(attempt);
      playReviewReady();
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

  const canRecordNow = stage.kind === "idle" && (!gate || gate.open) && !trialBlocked && !trialSpent;

  return (
    <section className="flex flex-col gap-4">
      {/* Record and upload, under the header, from the moment the page
          scrolls - the two things a student came here to do shouldn't
          be at the bottom of a long page. */}
      {canRecordNow && (
        <div ref={panelRef} aria-hidden className="h-px" />
      )}
      {canRecordNow && stuck && (
        <div className="sticky-under-header -mx-4 flex items-center gap-2 border-b border-navy-700/70 bg-navy-900/95 px-4 py-2 backdrop-blur">
          <button
            type="button"
            onClick={() => (canRecordInApp() ? setRecorder(true) : recordRef.current?.click())}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-acting px-4 text-sm font-bold text-navy-950 shadow-[0_0_20px_-6px_var(--color-acting)]"
          >
            <span className="grid size-5 place-items-center rounded-full bg-navy-950/20">
              <span className="size-2 rounded-full bg-navy-950" />
            </span>
            Record
          </button>
          <button
            type="button"
            onClick={() => pickRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-navy-600 px-4 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <UploadIcon className="size-4" />
            Upload
          </button>
        </div>
      )}
      <h2 className="text-sm font-medium uppercase tracking-wider text-ink-faint">
        Your attempts
      </h2>

      {(best || latest) && stage.kind === "idle" && (
        <AttemptsCard best={best} latest={latest} required={challenge.targetSkills} />
      )}

      {trialBlocked && (
        <UpgradePanel
          title="This challenge is part of the course"
          body="The free baseline covers the two baseline challenges. The rest of the STORY journey - all twenty-four challenges, every lesson, the deck - comes with Starter, and the coach who watches every take with the Full Experience."
        />
      )}
      {trialSpent && !trialBlocked && stage.kind === "idle" && (
        <UpgradePanel
          title="Your free review is used"
          body="That was Coach watching your take - the score, the spectrum, what to do next. Every take gets that with the Full Experience; the method itself is one payment with Starter."
          cta="Unlock the rest of the journey"
        />
      )}

      {gate && !gate.open && !trialBlocked && (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-navy-600 bg-navy-800 p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <LockIcon className="size-4 text-ink-faint" />
            This challenge isn&apos;t open yet
          </p>
          {gate.reason === "rank" && gate.rank ? (
            <p className="text-sm text-ink-muted">
              It opens at <span className="font-semibold text-ink">{gate.rank.name}</span> ({gate.rank.at} XP) -
              you&apos;re <span className="font-semibold text-ink">{gate.xpToGo} XP</span> away. Watching the lessons
              this phase leans on, or a better score on a challenge you&apos;ve passed, both get you there.
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              The road reaches here once the phase before is done
              {gate.rank ? ` and you hold ${gate.rank.name} (${gate.rank.at} XP)` : ""}.
            </p>
          )}
          <Link href="/challenges" className="text-sm font-medium text-ink underline-offset-4 hover:underline">
            Back to the map
          </Link>
        </div>
      )}

      {stage.kind === "idle" && (
        <RecordingsShelf
          challengeSlug={challenge.slug}
          attempts={attempts}
          refreshKey={shelfKey}
        />
      )}

      {recorder && (
        <TakeRecorder
          limitSec={limit}
          criteria={challenge.criteria}
          onDone={onRecorded}
          onFallback={() => {
            setRecorder(false);
            recordRef.current?.click();
          }}
          onClose={() => setRecorder(false)}
        />
      )}

      {stage.kind === "idle" && (!gate || gate.open) && !trialBlocked && !trialSpent && (
        <div data-tour="record" className="flex flex-col items-center gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-6 text-center">
          <p className="text-lg font-semibold tracking-tight text-ink">Ready for the challenge?</p>
          <LionMouth level={0} className="w-28" />
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
          {/* The record button: big, neon, drifting through the colours -
              the one thing on the page worth pressing. */}
          <button
            type="button"
            onClick={() => (canRecordInApp() ? setRecorder(true) : recordRef.current?.click())}
            className="neon-edge flex min-h-14 w-full max-w-xs items-center justify-center gap-3 rounded-full bg-navy-900 px-6 text-base font-bold text-ink transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-acting shadow-[0_0_14px_-2px_var(--color-acting)]">
              <span className="size-3 rounded-full bg-navy-950" />
            </span>
            Record a new attempt
          </button>
          <button
            type="button"
            onClick={() => pickRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-navy-600 px-5 text-sm font-semibold text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
          >
            <UploadIcon className="size-4" />
            Choose from your library
          </button>
          <p className="text-xs text-ink-muted">
            Selfie mode, {limit >= 120 ? `${limitLabel(limit)} at most, and shorter is better` : `${limitLabel(limit)} at most`} - prop the
            phone up so your hands and body are in frame.
          </p>
          <p className="text-[0.65rem] text-ink-faint">
            Your video goes to Coach for review and is deleted the moment the review is back - it&apos;s never stored by
            us. The feedback is what&apos;s kept, and your last three recordings stay on this device.
          </p>
        </div>
      )}

      {stage.kind === "uploading" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-navy-600 bg-navy-800 p-8 text-center">
          <p className="working-word text-lg font-bold tracking-tight">Sending it</p>
          <NeonBar percent={stage.percent} />
          <p className="text-sm text-ink-muted">
            Your video is on its way to Coach - {stage.percent}%
          </p>
        </div>
      )}

      {stage.kind === "reviewing" && <WatchingCoach poster={stage.poster} />}

      {stage.kind === "reviewed" && (
        <Feedback
          attempt={stage.attempt}
          videoUrl={stage.url}
          challenge={challenge}
          onDone={() => setStage({ kind: "idle" })}
        />
      )}
    </section>
  );
}

/** The earlier takes, compact, for Coach to compare this one with:
 *  the last eight, oldest first - what each measured, what the voice
 *  measured, which colours lit, the score. */
export function takeHistory(attempts: Attempt[]) {
  return [...attempts]
    .sort((a, b) => (a.at < b.at ? -1 : 1))
    .slice(-8)
    .map((a) => ({
      date: a.at.slice(0, 10),
      challenge: challengeBySlug.get(a.challengeSlug)?.title ?? a.challengeSlug,
      seconds: a.durationSec,
      score: a.score,
      passed: a.passed,
      spectrum: a.spectrum,
      observations: a.observations,
      voice: a.voice
        ? {
            pitchRangeSemitones: a.voice.pitchRangeSemitones,
            endLoudnessDropDb: a.voice.endLoudnessDropDb,
            trailingOffShare: a.voice.trailingOffShare,
            lowBandShare: a.voice.lowBandShare,
            loudnessSpreadDb: a.voice.loudnessSpreadDb,
          }
        : undefined,
      nextTime: a.focus.slice(0, 2).map((n) => n.note),
    }));
}

function fmt(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/**
 * Where a lesson named in a review leads. Inside a review, a lesson
 * opens on the review's own lesson page - the lessons Coach named, and
 * a way back - rather than in the library, where the review would be
 * lost behind it. Provided by Feedback; the default is the library.
 */
export const LessonHrefContext = createContext<(lesson: { vimeoId: string; category: string }) => string>(
  (l) => `/skills/${l.category}/${l.vimeoId}`,
);

/** Best and most recent, in one card: two tabs, and the pair overlaid
 *  so the most recent take can be read against the best one - the
 *  dashed trace is the other attempt, under the one being shown. */
function AttemptsCard({
  best,
  latest,
  required,
}: {
  best?: Attempt;
  latest?: Attempt;
  required: CategoryId[];
}) {
  const pair = best && latest && best.id !== latest.id;
  const [tab, setTab] = useState<"best" | "latest">(pair ? "latest" : best ? "best" : "latest");
  const [overlay, setOverlay] = useState(true);
  const shown = tab === "best" ? (best ?? latest) : (latest ?? best);
  const other = tab === "best" ? latest : best;
  if (!shown) return null;
  const ghost = pair && overlay ? other : undefined;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-navy-600 bg-navy-800 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {pair ? (
          <span className="flex rounded-lg border border-navy-600 bg-navy-900 p-0.5 text-xs font-semibold">
            {([["best", "Best attempt"], ["latest", "Most recent"]] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
                className={`rounded-md px-2.5 py-1 transition-colors ${tab === id ? "bg-navy-700 text-ink" : "text-ink-faint hover:text-ink-muted"}`}
              >
                {label}
              </button>
            ))}
          </span>
        ) : (
          <span className="text-xs font-medium uppercase tracking-wider text-ink-faint">
            {shown.id === best?.id ? "Best attempt" : "Most recent"}
          </span>
        )}
        <span className="text-xl font-bold tabular-nums text-ink">
          {shown.score}
          <span className="text-xs font-medium text-ink-faint"> / 100</span>
        </span>
      </div>
      <span className="relative block overflow-hidden rounded-lg bg-navy-950/70 p-2">
        <SpectrumWave
          values={shown.spectrum}
          ghost={ghost?.spectrum}
          className="h-20 w-full"
          animate={false}
          highlight={required}
        />
      </span>
      <SpectrumKey spectrum={shown.spectrum} required={required} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-ink-faint">
          {new Date(shown.at).toLocaleDateString()} · {shown.passed ? "passed" : "not passed"}
        </span>
        <Link href={`/review/${shown.id}`} className="font-semibold text-ink-muted transition-colors hover:text-ink">
          Open the review →
        </Link>
      </div>
      {pair && (
        <button
          type="button"
          onClick={() => setOverlay((o) => !o)}
          className="self-start text-[0.7rem] font-semibold text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          {overlay
            ? `Hide the ${tab === "best" ? "most recent" : "best"} attempt behind it`
            : `Compare with your ${tab === "best" ? "most recent" : "best"} attempt`}
        </button>
      )}
    </div>
  );
}

export function Feedback({
  attempt,
  videoUrl,
  challenge,
  onDone,
  preview = false,
  revisit = false,
}: {
  attempt: Attempt;
  videoUrl: string;
  challenge: Challenge;
  /** A sample review shown for its own sake (/demo/review): no XP
   *  splash, no push prompt, no "try again". */
  preview?: boolean;
  /** A review opened again later (/review/[id]): everything already
   *  landed, so no reveal, no splash, no "try again". */
  revisit?: boolean;
  onDone: () => void;
}) {
  const challengeTitle = challenge.title;
  const { state } = useStore();
  const canRevealAll = state.level !== "beginner"; // §08/§09: nested reveal
  // Coach's voice is the Full Experience; Starter reads the same
  // review instead, with the way to hear it beside it.
  const spokenPlan = preview || hasCoach(state);
  const litCount = categories.filter((c) => (attempt.spectrum[c.id] ?? 0) >= 40).length;
  const neededLit = challenge.targetSkills.filter((c) => (attempt.spectrum[c] ?? 0) >= 40).length;

  // The reveal is a sequence, not a page load: bars land one at a time,
  // the score counts up, the verdict arrives, the notes follow. Same
  // data throughout - the anticipation is the reward, and it's free.
  const reduceMotion =
    revisit ||
    (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
  const [verdictShown, setVerdictShown] = useState(reduceMotion || preview || revisit || !attempt.spoken);
  useEffect(() => {
    if (!settled || verdictShown || attempt.spoken) return;
    const t = setTimeout(() => setVerdictShown(true), 1400);
    return () => clearTimeout(t);
  }, [settled, verdictShown, attempt.spoken]);

  // The XP splash, a beat after the verdict: what this take earned,
  // and what a better one would. Once per review.
  const [splash, setSplash] = useState<"pending" | "shown" | "done" | "off">(preview || revisit ? "off" : "pending");
  useEffect(() => {
    if (!verdictShown || splash !== "pending") return;
    const t = setTimeout(() => setSplash("shown"), 900);
    return () => clearTimeout(t);
  }, [verdictShown, splash]);

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
        ? [``, `Everything Coach noticed:`, ...attempt.fullNotes.map(noteLine)]
        : []),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `speak-better-feedback-${attempt.at.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const lessonHref = (l: { vimeoId: string }) =>
    preview ? `/demo/review/lessons/${l.vimeoId}` : `/review/${attempt.id}/lessons/${l.vimeoId}`;

  return (
    <LessonHrefContext.Provider value={lessonHref}>
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

      {settled && attempt.spoken && (spokenPlan ? (
        <ReviewVoice spoken={attempt.spoken} onVerdict={() => setVerdictShown(true)} />
      ) : (
        <WrittenReview spoken={attempt.spoken} />
      ))}

      {settled && attempt.strengths && attempt.strengths.length > 0 && (
        <ReviewSection
          title="What worked"
          summary={`${attempt.strengths.length} thing${attempt.strengths.length === 1 ? "" : "s"} Coach saw working`}
          Icon={CheckCircleIcon}
          accentClass="text-mindset"
          delay={100}
        >
          <ul className="flex flex-col gap-2">
            {attempt.strengths.map((note, i) => (
              <FeedbackNoteRow key={i} note={note} showLessons={canRevealAll} />
            ))}
          </ul>
        </ReviewSection>
      )}

      <ReviewSection
        title="Your color spectrum"
        summary={settled ? `${litCount} of 7 colors lit - ${neededLit} of the ${challenge.targetSkills.length} this challenge needed` : "Landing now…"}
        Icon={SpectrumIcon}
        accentClass="text-body-language"
        open
      >
        <SpectrumBars spectrum={attempt.spectrum} revealCount={barsShown} required={challenge.targetSkills} />
      </ReviewSection>

      {settled && attempt.lessonsUsed && attempt.lessonsUsed.length > 0 && (
        <ReviewSection
          title="The lessons this challenge asked for"
          summary={`${attempt.lessonsUsed.filter((l) => l.used).length} of ${attempt.lessonsUsed.length} used - how well, and where`}
          Icon={SkillsIcon}
          accentClass="text-storytelling"
          delay={120}
        >
          <ul className="flex flex-col gap-2">
            {attempt.lessonsUsed.map((l) => {
              const lesson = lessonByVimeoId.get(l.lessonId);
              if (!lesson) return null;
              const cat = categoryById.get(lesson.category);
              return (
                <li key={l.lessonId} className="flex flex-col gap-1.5 text-sm">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <LessonLink lesson={lesson} />
                    <span className="ml-auto flex shrink-0 items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-navy-700">
                        <span
                          className={`block h-full rounded-full ${cat?.bgClass ?? "bg-ink"} ${l.used ? "" : "opacity-30"}`}
                          style={{ width: `${l.used ? Math.max(8, l.quality * 10) : 0}%` }}
                        />
                      </span>
                      <span className="w-9 text-right text-xs tabular-nums text-ink-faint">
                        {l.used ? `${l.quality}/10` : "–"}
                      </span>
                    </span>
                  </span>
                  {l.evidence && (
                    <span className="text-xs text-ink-faint">{l.evidence}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </ReviewSection>
      )}

      {/* Skills hit by instinct - Intermediate and Advanced see them
          named, with the lesson behind each, so what was luck can be
          studied on purpose (§08). A Beginner is told how many, and
          that the list is waiting at the next level. */}
      {settled && attempt.skillsSpotted && attempt.skillsSpotted.length > 0 && (
        <ReviewSection
          title="Skills you used without being asked"
          summary={`${attempt.skillsSpotted.length} technique${attempt.skillsSpotted.length === 1 ? "" : "s"} from other lessons, spotted in this take`}
          Icon={ZapIcon}
          accentClass="text-figurative"
          delay={140}
          glow="border-figurative/50"
        >
          {canRevealAll ? (
            <ul className="flex flex-col gap-2">
              {attempt.skillsSpotted.map((s) => {
                const lesson = lessonByVimeoId.get(s.lessonId);
                if (!lesson) return null;
                const cat = categoryById.get(lesson.category);
                return (
                  <li key={s.lessonId} className="flex flex-col gap-1.5 text-sm">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <LessonLink lesson={lesson} />
                      <span className="ml-auto flex shrink-0 items-center gap-2">
                        {s.at && (
                          <span className="rounded bg-navy-700 px-1 py-0.5 text-[0.65rem] font-semibold tabular-nums text-ink-muted">
                            {s.at}
                          </span>
                        )}
                        <span className={`text-xs tabular-nums ${cat?.textClass ?? "text-ink-faint"}`}>{s.quality}/10</span>
                      </span>
                    </span>
                    {s.evidence && <span className="text-xs text-ink-faint">{s.evidence}</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">
              Coach spotted {attempt.skillsSpotted.length}{" "}
              {attempt.skillsSpotted.length === 1 ? "technique" : "techniques"} from other
              lessons in this take. At Intermediate they&apos;re named, with the
              lesson behind each.
            </p>
          )}
        </ReviewSection>
      )}

      {settled && attempt.progress && (
        <ReviewSection
          title="Since you started"
          summary="What's shifted across your takes - and what to keep an eye on"
          Icon={TrendingUpIcon}
          accentClass="text-advanced"
          delay={145}
          open
        >
          <p className="text-sm leading-relaxed text-ink">{attempt.progress}</p>
        </ReviewSection>
      )}

      {settled && (
        <ReviewSection
          title={attempt.strengths ? "For next time" : "Focus on next"}
          summary={`${attempt.focus.length} thing${attempt.focus.length === 1 ? "" : "s"} to do more of - each with the line to try`}
          Icon={TrendingUpIcon}
          accentClass="text-structure"
          delay={150}
        >
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
        </ReviewSection>
      )}

      {settled && (
        <div
          className={`coach-cue relative overflow-hidden rounded-xl border p-4 transition-opacity ${
            verdictShown ? "opacity-100" : "opacity-0"
          } ${attempt.passed ? "border-mindset/40 bg-mindset/10" : "border-storytelling/40 bg-storytelling/10"}`}
          aria-live="polite"
        >
          {verdictShown && (
            <>
              {attempt.passed && <BarConfetti />}
              <p className={`relative flex items-center gap-2 text-sm font-semibold ${attempt.passed ? "text-mindset" : "text-storytelling"}`}>
                {attempt.passed ? (
                  <TrophyIcon className="size-5 shrink-0 drop-shadow-[0_0_6px_currentColor]" />
                ) : (
                  <RepeatIcon className="size-4 shrink-0" />
                )}
                {attempt.passed ? "Congratulations - you've passed this challenge." : "Didn't pass this time."}
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

      {splash === "shown" && (
        <XpSplash attempt={attempt} challenge={challenge} onClose={() => setSplash("done")} />
      )}
      {splash === "done" && !preview && !revisit && <PushPrompt />}

      {settled && canRevealAll && attempt.fullNotes.length > 0 && (
        <details className="rounded-lg border border-navy-600">
          <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
            Everything Coach noticed ({attempt.fullNotes.length})
          </summary>
          <ul className="flex flex-col gap-2 px-3 pb-3">
            {attempt.fullNotes.map((note, i) => (
              <FeedbackNoteRow key={i} note={note} showLessons />
            ))}
          </ul>
        </details>
      )}

      {videoUrl && (
      <details className="rounded-lg border border-navy-600">
        <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
          Watch your attempt back
        </summary>
        <div className="px-3 pb-3">
          <TakePlayback url={videoUrl} attempt={attempt} />
          <p className="mt-2 text-xs text-ink-faint">
            Played from your device - the app keeps no copy. It stays on
            this phone with your last three recordings for this challenge.
          </p>
        </div>
      </details>
      )}

      {!preview && !revisit && (
        <button
          type="button"
          onClick={onDone}
          className="self-start rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
        >
          {attempt.passed ? "Continue" : "Try again"}
        </button>
      )}
    </div>
    </LessonHrefContext.Provider>
  );
}

/**
 * The review as Starter gets it: Coach's face, his words in full, and
 * the one thing the Full Experience adds - his voice, and him on call.
 */
function WrittenReview({ spoken }: { spoken: string }) {
  return (
    <div className="coach-cue flex flex-col items-center gap-3 rounded-xl border border-navy-600 bg-navy-900/60 p-4">
      <LionMouth level={0} className="w-24" />
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">Coach said</span>
      <p className="max-w-prose text-center text-sm leading-relaxed text-ink">{spoken}</p>
      <Link
        href="/pricing"
        className="coach-pill inline-flex min-h-11 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5 text-sm font-bold text-navy-950"
      >
        <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-navy-950/25">
          <LionMouth level={0} className="w-10 translate-y-0.5" />
        </span>
        <span className="text-navy-950">Hear this in his voice - upgrade</span>
      </Link>
      <p className="max-w-prose text-center text-[0.65rem] text-ink-faint">
        Upgrade now for the full 24/7 coach experience: every review spoken aloud with the words on screen, and Coach
        on call whenever you want to ask him something.
      </p>
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
  const [transcript, setTranscript] = useState(false);

  useEffect(() => {
    let alive = true;
    speakUrl(spoken).then((u) => {
      if (!alive) return;
      if (u) {
        setUrl(u);
        setState("ready");
      } else {
        // No voice - the text stands in, and the verdict follows it.
        setState("failed");
        onVerdict();
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        text={spoken}
        captions
        controls={false}
        audioSrc={play && url ? url : undefined}
        autoPlay={play}
        onEnded={() => {
          setState("done");
          onVerdict();
        }}
        className="scale-90"
      />
      {(state === "loading" || state === "ready") && (
        <button
          type="button"
          onClick={hear}
          disabled={state === "loading"}
          className="coach-pill inline-flex min-h-11 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5 text-sm font-bold text-navy-950 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-70"
        >
          <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-navy-950/25">
            <LionMouth level={0} className="w-10 translate-y-0.5" />
          </span>
          {/* Its own colour: the pill paints its text in the drifting
              colour, which is the background. */}
          <span className="flex items-center gap-2 text-navy-950">
            <ListenIcon className="size-4" />
            {state === "loading" ? "Coach is getting ready…" : "Coach's review"}
          </span>
        </button>
      )}
      {state === "failed" && (
        <p className="max-w-prose text-center text-sm text-ink-muted">{spoken}</p>
      )}
      {state !== "failed" && (
        <button
          type="button"
          onClick={() => setTranscript(true)}
          className="text-xs font-medium text-ink-faint underline-offset-4 hover:text-ink hover:underline"
        >
          Read the transcript
        </button>
      )}
      {transcript && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Coach's feedback, written out"
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setTranscript(false)}
        >
          <div
            className="celebration-pop flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-3xl border border-navy-600 bg-navy-800 p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-faint">Coach said</span>
              <button
                type="button"
                onClick={() => setTranscript(false)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full border border-navy-600 text-ink-muted transition-colors hover:text-ink"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <p className="text-lg leading-relaxed text-ink">{spoken}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One part of the review, as a card that opens. The feedback arrived
 * with each section under a full-colour plate - the fire of the streak,
 * the neon lion - and the pictures competed with the data, which is
 * also in colour. So each section is a folded card with a large, plain
 * title, a one-line summary readable while folded, and no picture: the
 * icon in a ring tinted the section's colour, and a rule in it. (Three
 * treatments were tried - a muted plate, this, a thumbnail - and this
 * one was chosen.)
 */
export function ReviewSection({
  title,
  summary,
  Icon,
  accentClass,
  delay = 0,
  glow,
  open: openProp,
  children,
}: {
  title: string;
  /** One line under the title - what's inside, readable while folded. */
  summary?: string;
  Icon: (props: { className?: string }) => React.ReactNode;
  accentClass: string;
  delay?: number;
  /** Border and shadow classes for a section that should shine. */
  glow?: string;
  /** Open to begin with (the spectrum is; the rest fold). */
  open?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(openProp ?? false);
  const id = useId();
  const accentVar = `var(--color-${accentClass.replace("text-", "")})`;
  return (
    <section
      className={`coach-cue flex flex-col overflow-hidden rounded-2xl border bg-navy-900/60 ${glow ?? "border-navy-600"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="relative flex w-full items-center gap-3 text-left transition-colors hover:bg-navy-800/40"
      >
        <span
          className={`ml-4 grid size-10 shrink-0 place-items-center rounded-full border ${accentClass}`}
          style={{ borderColor: `color-mix(in oklab, ${accentVar} 45%, transparent)`, background: `color-mix(in oklab, ${accentVar} 12%, transparent)` }}
        >
          <Icon className="size-5" />
        </span>
        <span className="relative flex min-w-0 flex-1 flex-col py-3.5 pl-1">
          <span className="text-lg font-semibold tracking-tight text-ink sm:text-xl">{title}</span>
          {summary && <span className="text-xs text-ink-muted">{summary}</span>}
        </span>
        <ChevronDownIcon
          className={`relative mr-4 size-5 shrink-0 text-ink-faint transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <span aria-hidden className="mx-4 h-px" style={{ background: `linear-gradient(90deg, ${accentVar}, transparent)`, opacity: 0.5 }} />
      <div
        id={id}
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="p-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

/**
 * What the take was worth, said the moment the verdict lands. A pass
 * pays the challenge by score - "you scored 72 and earned 116 XP; a
 * better take is worth up to 150" - so the number invites the next
 * attempt. A miss pays the upload and says what a pass would pay.
 */
function XpSplash({
  attempt,
  challenge,
  onClose,
}: {
  attempt: Attempt;
  challenge: Challenge;
  onClose: () => void;
}) {
  const max = challengeXp(challenge);
  const earned = attempt.passed ? challengeXpFor(challenge, attempt.score) : 0;
  useEffect(() => {
    if (attempt.passed) {
      playPass();
      hapticPass();
    } else {
      playMiss();
      hapticTap();
    }
    // The XP lands a beat after the verdict's sound.
    const t = window.setTimeout(playXpDing, 700);
    return () => window.clearTimeout(t);
  }, [attempt.passed]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="xp-splash-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {attempt.passed && <Confetti />}
      <div
        className="celebration-pop flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-navy-600 bg-navy-800 p-6 text-center shadow-2xl shadow-navy-950/80"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="spectrum-rule h-1 w-16 rounded-full" />
        <p id="xp-splash-title" className="text-lg font-bold text-ink">
          {attempt.passed ? "Congratulations - you passed." : "Not this time - but it counts."}
        </p>
        <p className="text-3xl font-bold tabular-nums text-ink">
          {attempt.score}
          <span className="text-sm font-medium text-ink-faint"> / 100</span>
        </p>
        <p
          className={`celebration-bounce inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-base font-bold tabular-nums ${
            attempt.passed ? "bg-mindset/15 text-mindset" : "bg-storytelling/15 text-storytelling"
          }`}
        >
          <ZapIcon className="size-4" />+{earned + XP.upload} XP
        </p>
        <p className="text-sm text-ink-muted text-balance">
          {attempt.passed
            ? earned < max
              ? `${earned} XP for the pass, ${XP.upload} for the upload. This challenge pays up to ${max} - improve your score to unlock more.`
              : `The full ${max} XP for the challenge, and ${XP.upload} for the upload. That's as good as it gets.`
            : `${XP.upload} XP for the upload. Pass this challenge for up to ${max} XP - a better score pays more.`}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-1 rounded-lg bg-ink px-5 py-2 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
        >
          {attempt.passed ? "Nice" : "Go again"}
        </button>
      </div>
    </div>
  );
}

/**
 * The wait while the coach watches: the lion beside a still from the
 * student's own upload, eyes going side to side. It makes the minute
 * feel like what it is - someone watching - rather than a spinner.
 */
function WatchingCoach({ poster }: { poster?: string }) {
  // The watching takes a minute or two and nothing arrives until it's
  // done, so the bar is honest about time rather than progress: it
  // fills fast at first and slows toward the end, reaching ninety
  // before the review typically lands. The review's arrival replaces
  // this panel, which is the bar finishing.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const id = window.setInterval(() => setElapsed((performance.now() - t0) / 1000), 500);
    return () => window.clearInterval(id);
  }, []);
  const percent = Math.round(92 * (1 - Math.exp(-elapsed / 45)));
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-navy-600 bg-navy-800 p-6 text-center">
      {/* The lion on the left, facing the take on the right - it looks
          toward what it's watching. */}
      <div className="flex items-center justify-center gap-4">
        <div className="watching-lion w-28">
          <LionMouth level={0} className="w-full" />
        </div>
        <div className="watching-eyes" aria-hidden>
          <span className="watching-eye"><span className="watching-pupil" /></span>
          <span className="watching-eye"><span className="watching-pupil" /></span>
        </div>
        <div className="relative h-36 w-24 overflow-hidden rounded-lg bg-navy-950 ring-1 ring-navy-600">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="A still from your recording" className="size-full object-cover" />
          ) : (
            <div className="size-full animate-pulse bg-navy-700" />
          )}
          <div className="watching-scan absolute inset-x-0 h-8" />
        </div>
      </div>
      <p className="working-word text-lg font-bold tracking-tight">Coach is watching your video</p>
      <NeonBar percent={percent} />
      <p className="text-xs text-ink-faint text-balance">
        Watching and listening properly takes a minute or two - {percent}% of the usual wait. Stay on this page.
      </p>
    </div>
  );
}

/** A little confetti inside the verdict bar - a few dozen pieces in the
 *  seven colours falling through the box for a few seconds, so the
 *  pass has its own small celebration even when the splash has gone.
 *  CSS only; each piece is a span. */
function BarConfetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: ((i * 53) % 100) / 100,
    dur: 2.6 + ((i * 29) % 100) / 60,
    color: ["storytelling", "figurative", "acting", "structure", "mindset", "body-language", "advanced"][i % 7],
    w: 4 + (i % 3) * 2,
  }));
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="bar-confetti absolute -top-3 block rounded-[1px]"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.w * 1.6,
            background: `var(--color-${p.color})`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </span>
  );
}

/** A bar that fills in the seven colours, with a glow at its tip - the
 *  same bar the lesson player draws as a video plays. */
function NeonBar({ percent }: { percent: number }) {
  return (
    <div className="relative h-1.5 w-56 overflow-hidden rounded-full bg-navy-700" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="spectrum-rule absolute inset-y-0 left-0 rounded-full shadow-[0_0_10px_1px_rgba(255,255,255,0.35)] transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(3, percent)}%` }}
      />
    </div>
  );
}

function catName(id: CategoryId): string {
  return categoryById.get(id)?.name ?? id;
}

/** The lesson behind a note, as a small card: its still with a play
 *  mark, its name, and the way there - so it reads as a video lesson
 *  a tap away rather than a citation. */
export function LessonLink({ lesson, href }: { lesson: { vimeoId: string; title: string; category: string }; href?: string }) {
  const hrefOf = useContext(LessonHrefContext);
  return (
    <Link
      href={href ?? hrefOf(lesson)}
      className="group inline-flex max-w-full items-center gap-2 rounded-lg border border-navy-600 bg-navy-900/60 py-1 pl-1 pr-3 text-xs font-medium text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
    >
      <span className="relative h-9 w-14 shrink-0 overflow-hidden rounded-md bg-navy-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/thumbs/${lesson.vimeoId}.jpg`} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-navy-950/30 text-ink transition-colors group-hover:bg-navy-950/10">
          <PlayIcon className="size-3.5" />
        </span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[0.6rem] uppercase tracking-wider text-ink-faint">Watch the lesson</span>
        <span className="truncate">{lesson.title}</span>
      </span>
    </Link>
  );
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
          <span className="flex flex-wrap gap-2">
            {lessons.map((lesson) => (
              <LessonLink key={lesson.vimeoId} lesson={lesson} />
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
