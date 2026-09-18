// The coach watches: the video goes to Gemini, Gemini answers in the
// shape the rubric requires, and the video is deleted.
//
// Gemini reads video natively - frames and audio together - which is
// the whole reason it's the model here (§07): gestures, eye contact
// and strain don't exist in a transcript. The file goes up through
// Gemini's Files API, which holds it for at most 48 hours and which we
// delete from the moment the answer is back; nothing about the
// recording persists on our side (§13).

import { GoogleGenAI, createPartFromUri } from "@google/genai";
import type { CoachContext } from "./context";
import { RESPONSE_SCHEMA, type CoachVerdict } from "./rubric";

/**
 * The model. An alias that tracks Google's current Pro, because the
 * brief-checking has to be right and Pro is the one that's right; Flash
 * is a few cents cheaper per review and worth an A/B once there's real
 * footage to compare on. Override with COACH_MODEL.
 */
export function coachModel(): string {
  return process.env.COACH_MODEL || "gemini-3.1-pro-preview";
}

export function coachAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export interface CoachRun {
  verdict: CoachVerdict;
  model: string;
  /** Token counts, for the cost log. */
  usage: { input: number; output: number; thinking: number };
  /** Wall-clock, ms: upload+processing, then generation. */
  timing: { file: number; answer: number };
}

/** Wait for an uploaded file to finish processing on Google's side. */
async function untilActive(ai: GoogleGenAI, name: string): Promise<void> {
  const started = Date.now();
  for (;;) {
    const f = await ai.files.get({ name });
    if (f.state === "ACTIVE") return;
    if (f.state === "FAILED") throw new Error("Gemini could not process the video.");
    if (Date.now() - started > 240_000) throw new Error("Gemini took too long to process the video.");
    await new Promise((r) => setTimeout(r, 2000));
  }
}

/**
 * Review one recording against one challenge.
 *
 * `video` is the recording as bytes with its MIME type; where it came
 * from is the route's business. The file is uploaded, waited for,
 * watched, and deleted, in that order, and deleted on failure too.
 */
export async function review(
  context: CoachContext,
  video: { blob: Blob; mimeType: string },
): Promise<CoachRun> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = coachModel();

  const t0 = Date.now();
  const uploaded = await ai.files.upload({
    file: video.blob,
    config: { mimeType: video.mimeType, displayName: `attempt-${context.challenge.slug}` },
  });
  const name = uploaded.name!;
  try {
    await untilActive(ai, name);
    const t1 = Date.now();

    const result = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            createPartFromUri(uploaded.uri!, uploaded.mimeType ?? video.mimeType),
            { text: context.prompt },
          ],
        },
      ],
      config: {
        systemInstruction: context.system,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        // The judgement is the product: let the model think. Cost is
        // bounded by the clip length either way - a minute of video is
        // ~18k tokens and the thinking is a fraction of that.
        thinkingConfig: { thinkingBudget: 4096 },
        // Low: the coach is describing what happened, not composing.
        // The first run at 0.4 praised a speaker who wasn't in the
        // frame for "keeping your eyes on the lens".
        temperature: 0.2,
      },
    });
    const t2 = Date.now();

    const text = result.text;
    if (!text) throw new Error("The coach returned nothing.");
    const verdict = JSON.parse(text) as CoachVerdict;
    const meta = result.usageMetadata;
    return {
      verdict,
      model,
      usage: {
        input: meta?.promptTokenCount ?? 0,
        output: meta?.candidatesTokenCount ?? 0,
        thinking: meta?.thoughtsTokenCount ?? 0,
      },
      timing: { file: t1 - t0, answer: t2 - t1 },
    };
  } finally {
    // Gone the moment we have the answer - or the moment we don't.
    ai.files.delete({ name }).catch(() => {});
  }
}
