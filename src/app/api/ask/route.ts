import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { coachAvailable } from "@/lib/coach/gemini";

// Ask your coach (master plan §07): a question, spoken or typed, about
// how the student's speaking is developing - answered from their own
// record and nothing else. The device sends what it holds: every
// attempt's date, challenge, score, pass, spectrum, and the coach's
// notes on it; the streak, the XP, the rank, the lessons watched. The
// model transcribes the question and answers in the coach's voice, in
// a hundred words or so, and every claim has to be in the record: the
// rule that governs the reviews governs this too.

export const maxDuration = 60;

const MODEL = process.env.COACH_ASK_MODEL || "gemini-3-flash-preview";

interface AskBody {
  /** The question as audio (base64) with its type, or as text. */
  audio?: { data: string; mimeType: string };
  question?: string;
  /** No question: the student has just opened the page, and Coach
   *  speaks first. The number is how many times today, this one
   *  included. */
  greeting?: { visitsToday: number };
  /** The student's record, compact. */
  record: unknown;
  displayName?: string;
  level?: string;
}

const SYSTEM = `You are the Speak Better coach - a speaking teacher's coaching voice, warm, specific, grounded and honest. A student is asking you a question about how their speaking is developing. You are given their whole record with this app: every challenge attempt (date, challenge, score out of 100, whether it passed, the seven-color spectrum of that take, and the notes you gave them), plus their streak, XP, rank and lessons watched.

Answer the question from the record and only from the record. Say what the record shows - scores rising or not, colors lighting up over time, which notes recur, what changed between early takes and recent ones, what they've been consistently praised for and what keeps coming up as the next step. Cite specifics: a challenge by name, a score, a color, a date in plain words ("last Tuesday", "your third take"). Never invent a detail, a video, or a moment you were not given. If the record is thin - one attempt, or none - say so plainly and say what one more take would tell you. If the question isn't about their speaking, answer briefly and bring it back to the record.

Speak as if aloud, to be heard: contractions, short sentences, no lists, no headings, no lesson ids, no numbers with decimals. 80 to 130 words. Praise is qualified, never bare: name what produced it. Encouraging, never flattering. Begin with the answer, not with a greeting.`;

/** Coach speaks first. Live rather than canned: written fresh from the
 *  record and the day each time the page opens, so no two openings are
 *  the same. */
const GREETING = `You are the Speak Better coach - "Coach", the lion - a speaking teacher's coaching voice: warm, specific, grounded, honest, with a bit of play in it. The student has just opened your page. Greet them and invite a question, in one to three short sentences, 20 to 45 words, to be said aloud.

Make it theirs and make it today's: you are told how many times they've opened this page today (the first time, say welcome back or hello; the second or third, notice it lightly - "twice today - I like that"; more, tease gently). If their record has anything in it, touch one true thing from it in passing - the last take and how it went, a streak, a colour that has grown, a note that keeps coming up - and never invent one; if the record is empty, say you're ready to watch their first take. Remind them, in your own words, that you've watched their takes and have been tracking their progress, and end by asking how you can help them become the speaker they want to be - or what they'd like to know. Vary everything: the opener, the shape, the question. No lists, no headings, no lesson ids, no emoji. Never the same greeting twice.`;

export async function POST(request: Request) {
  if (!coachAvailable()) return NextResponse.json({ error: "The coach isn't available here." }, { status: 503 });
  const body = (await request.json().catch(() => null)) as AskBody | null;
  if (!body || (!body.audio && !body.question && !body.greeting))
    return NextResponse.json({ error: "Ask something." }, { status: 400 });

  const record = JSON.stringify(body.record ?? {}).slice(0, 60_000);

  if (body.greeting) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `The student: ${body.displayName || "the student"}, level ${body.level || "beginner"}. Times they've opened your page today, this one included: ${Math.max(1, Number(body.greeting.visitsToday) || 1)}. The local time is ${new Date().toISOString()}.\n\nTheir record:\n${record}\n\nGreet them.`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: GREETING,
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: { answer: { type: "string", description: "The greeting, 20-45 words, to be said aloud." } },
            required: ["answer"],
          },
          temperature: 1.1,
        },
      });
      const text = result.text;
      if (!text) throw new Error("nothing back");
      const out = JSON.parse(text) as { answer: string };
      return NextResponse.json({ answer: out.answer, model: MODEL });
    } catch (err) {
      console.error("[ask] greeting failed", err);
      return NextResponse.json({ error: "Coach is clearing his throat - ask away." }, { status: 502 });
    }
  }

  const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [];
  if (body.audio && typeof body.audio.data === "string" && body.audio.data.length < 8_000_000) {
    parts.push({ inlineData: { data: body.audio.data, mimeType: body.audio.mimeType || "audio/webm" } });
    parts.push({
      text: `The audio is the student's question. First write it down as they asked it, then answer it.\n\nThe student: ${body.displayName || "the student"}, level ${body.level || "beginner"}.\n\nTheir record:\n${record}`,
    });
  } else {
    parts.push({
      text: `The student's question: "${String(body.question).slice(0, 600)}"\n\nThe student: ${body.displayName || "the student"}, level ${body.level || "beginner"}.\n\nTheir record:\n${record}`,
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            question: { type: "string", description: "The question, as asked, in the student's words." },
            answer: { type: "string", description: "The coach's spoken answer, 80-130 words." },
          },
          required: ["question", "answer"],
        },
        temperature: 0.3,
      },
    });
    const text = result.text;
    if (!text) throw new Error("nothing back");
    const out = JSON.parse(text) as { question: string; answer: string };
    return NextResponse.json({ question: out.question, answer: out.answer, model: MODEL });
  } catch (err) {
    console.error("[ask] failed", err);
    return NextResponse.json({ error: "Your coach didn't catch that - try asking again." }, { status: 502 });
  }
}
