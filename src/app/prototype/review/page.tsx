"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { challenges, maxSecondsFor, GRACE_SECONDS } from "@/data/challenges";
import { lessonByVimeoId } from "@/data/lessons";
import { SpectrumBars } from "@/components/spectrum";
import type { ReviewResponse } from "@/lib/coach/shape";
import type { Level } from "@/lib/store";

// Prototype route - not part of the student experience. The review
// bench: drop a video against any challenge at any level and see what
// the coach says, with the raw verdict, the token counts, and the
// exact prompt it was given, side by side. The rubric will only get
// right by being run against real footage and argued with, and this
// is the room to do that in without me.

type Result = ReviewResponse & {
  debug?: {
    raw: unknown;
    usage: { input: number; output: number; thinking: number };
    timing: { file: number; answer: number };
    system: string;
    prompt: string;
  };
};

const recordable = challenges.filter((c) => !c.passive);

export default function ReviewBench() {
  const [slug, setSlug] = useState(recordable[0].slug);
  const [level, setLevel] = useState<Level>("intermediate");
  const [stage, setStage] = useState<"idle" | "uploading" | "reviewing">("idle");
  const [percent, setPercent] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const challenge = recordable.find((c) => c.slug === slug)!;

  const run = async (file: File) => {
    setError(null);
    setResult(null);
    const url = URL.createObjectURL(file);
    const durationSec = await new Promise<number>((res) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => res(Math.round(v.duration));
      v.onerror = () => res(0);
      v.src = url;
    });
    URL.revokeObjectURL(url);
    if (!durationSec) return setError("Couldn't read that video.");
    if (durationSec > maxSecondsFor(challenge) + GRACE_SECONDS)
      return setError(`${durationSec}s is over this challenge's ${maxSecondsFor(challenge)}s limit.`);

    const started = Date.now();
    const tick = setInterval(() => setSeconds(Math.round((Date.now() - started) / 1000)), 500);
    try {
      setStage("uploading");
      const put = await upload(`attempts/${slug}/${crypto.randomUUID()}.${(file.name.split(".").pop() || "mp4").toLowerCase()}`, file, {
        access: "private",
        handleUploadUrl: "/api/review/upload",
        contentType: file.type || "video/mp4",
        multipart: file.size > 8 * 1024 * 1024,
        clientPayload: JSON.stringify({ challengeSlug: slug, durationSec }),
        onUploadProgress: ({ percentage }) => setPercent(Math.round(percentage)),
      });
      setStage("reviewing");
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeSlug: slug,
          durationSec,
          level,
          attemptNumber: 1,
          blobUrl: put.url,
          contentType: file.type || undefined,
          debug: true,
        }),
      });
      const json = (await res.json()) as Result & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Review failed.");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      clearInterval(tick);
      setStage("idle");
    }
  };

  const title = (id: string) => lessonByVimeoId.get(id)?.title ?? id;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Prototype · the coach</p>
        <h1 className="text-2xl font-semibold tracking-tight">Review bench</h1>
        <p className="text-sm text-ink-muted">
          Drop a video against any challenge at any level. The coach&apos;s answer, the raw
          verdict, the cost, and the exact prompt, side by side. The video is deleted after.
        </p>
      </header>

      <div className="grid gap-3 rounded-xl border border-navy-600 bg-navy-800 p-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Challenge
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink"
          >
            {recordable.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.phase} · {c.title} ({maxSecondsFor(c)}s)
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Level
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-ink"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <div className="flex flex-col justify-end">
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && run(e.target.files[0])}
          />
          <button
            type="button"
            disabled={stage !== "idle"}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 disabled:opacity-60"
          >
            {stage === "idle" ? "Drop a video" : stage === "uploading" ? `Uploading ${percent}%` : `Watching… ${seconds}s`}
          </button>
        </div>
      </div>

      <p className="text-xs text-ink-faint">
        Brief: {challenge.brief} · Criteria: {challenge.criteria.join(" / ")} · Cited:{" "}
        {challenge.relatedLessonIds.map(title).join(", ")}
      </p>

      {error && <p className="rounded-lg border border-acting/40 bg-navy-800 p-3 text-sm text-ink">{error}</p>}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl border border-navy-600 bg-navy-800 p-4">
            <span className="text-3xl font-bold tabular-nums text-ink">{result.score}</span>
            <span className={`text-sm font-semibold ${result.passed ? "text-mindset" : "text-storytelling"}`}>
              {result.passed ? "passed" : "not passed"}
            </span>
            <span className="text-xs text-ink-faint">
              {result.model} · {result.mock ? "MOCK" : "real"}
              {result.debug &&
                ` · in ${result.debug.usage.input} / out ${result.debug.usage.output} / think ${result.debug.usage.thinking} tokens · file ${(result.debug.timing.file / 1000).toFixed(1)}s + answer ${(result.debug.timing.answer / 1000).toFixed(1)}s`}
            </span>
            <p className="w-full text-sm text-ink">{result.summary}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-ink-faint">The brief</h2>
              <p className="text-sm text-ink">{result.briefVerdict}</p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {result.criteria?.map((c, i) => (
                  <li key={i}>
                    <span className={c.met ? "text-mindset" : "text-storytelling"}>{c.met ? "✓" : "✗"}</span>{" "}
                    <span className="text-ink">{c.text}</span>
                    <div className="text-xs text-ink-faint">{c.evidence}</div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-ink-faint">Spectrum</h2>
              <SpectrumBars spectrum={result.spectrum} />
            </section>
          </div>

          <section className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-faint">Cited lessons</h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              {result.lessonsUsed?.map((l) => (
                <li key={l.lessonId}>
                  <span className="text-ink">{title(l.lessonId)}</span>{" "}
                  <span className="tabular-nums text-ink-faint">{l.used ? l.quality : "not used"}</span>
                  <div className="text-xs text-ink-faint">{l.evidence}</div>
                </li>
              ))}
            </ul>
            {result.skillsSpotted && result.skillsSpotted.length > 0 && (
              <>
                <h2 className="mt-2 text-xs font-medium uppercase tracking-wider text-ink-faint">Skills spotted</h2>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {result.skillsSpotted.map((s) => (
                    <li key={s.lessonId}>
                      <span className="text-ink-faint">{s.at}</span> <span className="text-ink">{title(s.lessonId)}</span>{" "}
                      <span className="tabular-nums text-ink-faint">{s.quality}</span>
                      <div className="text-xs text-ink-faint">{s.evidence}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-faint">Notes</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {result.fullNotes.map((n, i) => (
                <li key={i} className="flex flex-col">
                  <span className="text-ink">
                    <span className="text-xs text-ink-faint">{n.at ?? ""} [{n.category}]</span> {n.note}
                  </span>
                  <span className="text-xs text-ink-faint">{(n.lessonIds ?? []).map(title).join(", ")}</span>
                </li>
              ))}
            </ul>
          </section>

          {result.debug && (
            <>
              <details className="rounded-xl border border-navy-600 bg-navy-800 p-4">
                <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Raw verdict
                </summary>
                <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-ink-muted">
                  {JSON.stringify(result.debug.raw, null, 2)}
                </pre>
              </details>
              <details className="rounded-xl border border-navy-600 bg-navy-800 p-4">
                <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-ink-faint">
                  The prompt ({Math.round((result.debug.system.length + result.debug.prompt.length) / 1000)}k chars)
                </summary>
                <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-ink-muted">
                  {result.debug.system}
                  {"\n\n────────\n\n"}
                  {result.debug.prompt}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}
