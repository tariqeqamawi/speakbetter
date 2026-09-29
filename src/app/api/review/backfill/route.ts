import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { challengeBySlug } from "@/data/challenges";
import { coachAvailable, coachModel } from "@/lib/coach/gemini";
import {
  BACKFILL_SCHEMA,
  backfillPrompt,
  deriveBackfill,
  shapeBackfill,
  type BackfillInput,
} from "@/lib/coach/backfill";

// Filling in an older review (lib/coach/backfill.ts): the sections the
// first reviews didn't have, written once from the stored record - text
// only, no video - and kept on the phone so this never runs twice for
// the same review.

export const maxDuration = 60;

/** Text in, a few hundred tokens out: the quick model is plenty - and
 *  the coach's own model if Google has retired that one. */
const MODELS = [process.env.COACH_BACKFILL_MODEL || "gemini-3.8-flash", coachModel()];

export async function POST(request: Request) {
  const input = (await request.json()) as BackfillInput;
  const challenge = challengeBySlug.get(input?.challengeSlug);
  if (!challenge || challenge.passive || !input.spectrum)
    return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });
  input.focus = Array.isArray(input.focus) ? input.focus : [];
  input.fullNotes = Array.isArray(input.fullNotes) ? input.fullNotes : [];

  const fromNotes = () => NextResponse.json(deriveBackfill(input));
  if (input.deriveOnly || !coachAvailable()) return fromNotes();

  const ask = backfillPrompt(input);
  if (!ask) return fromNotes();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  for (const model of MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: ask.prompt }] }],
        config: {
          systemInstruction: ask.system,
          responseMimeType: "application/json",
          responseJsonSchema: BACKFILL_SCHEMA,
          temperature: 0.2,
        },
      });
      const text = result.text;
      if (!text) continue;
      const meta = result.usageMetadata;
      console.log(
        `[coach] backfill ${challenge.slug} model=${model} tokens in=${meta?.promptTokenCount ?? 0} out=${meta?.candidatesTokenCount ?? 0}`,
      );
      return NextResponse.json(shapeBackfill(JSON.parse(text), challenge));
    } catch (err) {
      console.error(`[coach] backfill failed on ${model}`, err instanceof Error ? err.message.slice(0, 200) : err);
    }
  }
  return fromNotes();
}
