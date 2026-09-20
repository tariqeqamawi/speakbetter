import { NextResponse } from "next/server";
import { isStudentId, putJson } from "@/lib/server/store";
import { loadPush, sendPush } from "@/lib/server/push";
import { del, get } from "@vercel/blob";
import { challengeBySlug, GRACE_SECONDS, maxSecondsFor } from "@/data/challenges";
import { buildContext } from "@/lib/coach/context";
import { coachAvailable, coachModel, review } from "@/lib/coach/gemini";
import { mockReview } from "@/lib/coach/mock";
import { shapeVerdict } from "@/lib/coach/shape";
import type { Level } from "@/lib/store";
import type { VoiceProfile } from "@/lib/voice-profile";

// ─────────────────────────────────────────────────────────────────────
// The AI review - build plan Phase 4, master plan §07.
//
// The phone has already put the recording in the private Blob store
// (see ./upload). This route reads it back, has Gemini watch it against
// the challenge's brief, criteria and lessons (lib/coach), shapes the
// verdict into the app's contract (lib/coach/shape), and deletes the
// recording from the store and from Gemini. The feedback is the record;
// the video is gone within a minute of the answer (§13).
//
// Without a GEMINI_API_KEY the stand-in coach answers instead, flagged
// `mock: true`, so previews and laptops without the env still run the
// loop end to end.
// ─────────────────────────────────────────────────────────────────────

// Upload to Gemini, processing, and a Pro model thinking over a minute
// of video together run one to three minutes. Fluid compute allows up
// to this on every plan.
export const maxDuration = 300;

interface ReviewRequest {
  challengeSlug: string;
  durationSec: number;
  level: Level;
  attemptNumber: number; // 1-based
  /** The recording's URL in the Blob store; absent means "mock only". */
  blobUrl?: string;
  contentType?: string;
  /** The bench asks for the raw verdict and the prompt alongside. */
  debug?: boolean;
  /** Who's asking and which attempt this is, so the answer can be kept
   *  for them if they've left the page, and a note sent (lib/server/push). */
  studentId?: string;
  attemptId?: string;
  /** Measured on the phone from the recording's audio (lib/voice-profile). */
  voice?: VoiceProfile | null;
}

/** What's configured - true/false only, never the values. */
export async function GET() {
  return NextResponse.json({
    coach: coachAvailable(),
    model: coachAvailable() ? coachModel() : null,
    uploads: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReviewRequest;
  const challenge = challengeBySlug.get(body.challengeSlug);
  if (!challenge || challenge.passive)
    return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });

  const limit = maxSecondsFor(challenge);
  if (!Number.isFinite(body.durationSec) || body.durationSec > limit + GRACE_SECONDS)
    return NextResponse.json(
      { error: `Your video is too long. Try again and keep it under ${fmt(limit)} - being succinct is part of the skill.` },
      { status: 400 },
    );
  const level: Level = body.level ?? "beginner";

  // No coach, or no recording to watch: the stand-in answers.
  if (!coachAvailable() || !body.blobUrl) {
    const mock = mockReview({
      challengeSlug: body.challengeSlug,
      durationSec: body.durationSec,
      level,
      attemptNumber: body.attemptNumber ?? 1,
    });
    return NextResponse.json(mock);
  }

  const context = buildContext(body.challengeSlug, level, body.attemptNumber ?? 1, Math.round(body.durationSec), body.voice ?? undefined);
  if (!context) return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });

  // The recording, from the private store.
  let blob: Blob;
  try {
    const got = await get(body.blobUrl, { access: "private", useCache: false });
    if (!got || got.statusCode !== 200 || !got.stream) throw new Error("not found");
    blob = await new Response(got.stream).blob();
    blob = new Blob([blob], { type: got.blob.contentType || body.contentType || "video/mp4" });
  } catch {
    return NextResponse.json(
      { error: "Your upload didn't arrive - check your connection and try again." },
      { status: 400 },
    );
  }

  try {
    const run = await review(context, {
      blob,
      mimeType: body.contentType || blob.type || "video/mp4",
    });
    const shaped = shapeVerdict(run.verdict, level, challenge.targetSkills, run.model);
    // The cost log, one line per review: enough to see what a review
    // costs and how long it takes, nothing about who or what.
    console.log(
      `[coach] ${challenge.slug} ${body.durationSec}s level=${level} model=${run.model} ` +
        `tokens in=${run.usage.input} out=${run.usage.output} think=${run.usage.thinking} ` +
        `file=${run.timing.file}ms answer=${run.timing.answer}ms score=${shaped.score} passed=${shaped.passed}`,
    );
    if (body.debug)
      return NextResponse.json({
        ...shaped,
        debug: {
          raw: run.verdict,
          usage: run.usage,
          timing: run.timing,
          system: context.system,
          prompt: context.prompt,
        },
      });
    // Kept for a student who left the page while the coach watched -
    // the app picks it up on its next open - and a note sent to say so.
    if (isStudentId(body.studentId) && typeof body.attemptId === "string" && /^[0-9a-f-]{36}$/i.test(body.attemptId)) {
      const kept = { ...shaped, attemptId: body.attemptId, challengeSlug: challenge.slug, durationSec: body.durationSec, at: new Date().toISOString() };
      putJson(`reviews/${body.studentId}/${body.attemptId}.json`, kept).catch(() => {});
      loadPush(body.studentId)
        .then((record) =>
          record &&
          sendPush(body.studentId!, record, {
            title: "Your review is ready",
            body: `Your coach has watched "${challenge.title}". ${shaped.passed ? "Come and hear it." : "Come and hear what to do next."}`,
            url: `/challenges/${challenge.slug}`,
            tag: "review",
          }),
        )
        .catch(() => {});
    }
    return NextResponse.json(shaped);
  } catch (err) {
    console.error("[coach] review failed", err);
    return NextResponse.json(
      { error: "Your coach couldn't watch that one - give it another try in a moment." },
      { status: 502 },
    );
  } finally {
    // Gone from the store whatever happened.
    del(body.blobUrl).catch(() => {});
  }
}

function fmt(sec: number): string {
  if (sec % 60 === 0) return `${sec / 60} minute${sec === 60 ? "" : "s"}`;
  if (sec < 60) return `${sec} seconds`;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
