import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { COACH_RATE, DEFAULT_DIRECTION, DEFAULT_VOICE, GEMINI_VOICES } from "@/lib/coach/voice";
import { timeStretch } from "@/lib/coach/stretch";

// The coach speaks: a line of feedback as audio, in the chosen stock
// voice, directed in words. Gemini's TTS returns raw 24 kHz 16-bit PCM;
// it's brought up to the coach's pace here (lib/coach/stretch.ts - the
// browser's own playbackRate chopped words on a phone) and goes back as
// a WAV so an <audio> element plays it without help.
//
// A line is billed once per function instance: the same text in the
// same voice comes from a small cache, so replaying a review, or the
// audition page playing one line across thirty voices, costs what it
// should. Lines are short - a summary, a note - and capped so.

export const maxDuration = 60;

const MODEL = process.env.COACH_TTS_MODEL || "gemini-3.1-flash-tts-preview";
const MAX_CHARS = 1200;

const cache = new Map<string, Buffer>();
const CACHE_MAX = 200;

/** Raw PCM into a WAV container. */
function wav(pcm: Buffer, sampleRate: number, channels = 1, bits = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bits) / 8;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE((channels * bits) / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY)
    return NextResponse.json({ error: "The coach has no voice configured." }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    text?: string;
    voice?: string;
    style?: string;
  };
  const text = String(body.text ?? "").trim().slice(0, MAX_CHARS);
  if (!text) return NextResponse.json({ error: "Nothing to say." }, { status: 400 });
  const voice = GEMINI_VOICES.some((v) => v.name === body.voice) ? body.voice! : DEFAULT_VOICE;
  const style = String(body.style ?? DEFAULT_DIRECTION).trim().slice(0, 320);

  const key = createHash("sha1").update(`${MODEL}|${voice}|${style}|${COACH_RATE}|${text}`).digest("hex");
  const hit = cache.get(key);
  if (hit) return audio(hit, true);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: style ? `Say this ${style}:\n\n${text}` : text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });
    const part = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    const data = part?.inlineData?.data;
    if (!data) throw new Error("no audio");
    const mime = part?.inlineData?.mimeType ?? "audio/L16;rate=24000";
    const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
    const raw = Buffer.from(data, "base64");
    const pcm = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
    const paced = timeStretch(pcm, COACH_RATE);
    const out = wav(Buffer.from(paced.buffer, paced.byteOffset, paced.length * 2), rate);
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
    cache.set(key, out);
    return audio(out, false);
  } catch (err) {
    console.error("[speak] failed", err);
    return NextResponse.json({ error: "The coach lost its voice for a moment." }, { status: 502 });
  }
}

function audio(buf: Buffer, cached: boolean) {
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": String(buf.length),
      "Cache-Control": "private, max-age=3600",
      "X-Coach-Cache": cached ? "hit" : "miss",
    },
  });
}
