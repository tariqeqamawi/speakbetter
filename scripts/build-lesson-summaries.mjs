// Writes src/data/lesson-summaries.json: a short prose summary of each
// lesson, from its own transcript, in the teacher's terms - what the
// lesson is about, read at a glance, under the video and above the
// key ideas and the transcript.
//
//   node scripts/build-lesson-summaries.mjs           # only what's missing
//   node scripts/build-lesson-summaries.mjs --all     # every lesson again
//
// Needs GEMINI_API_KEY in .env.local. Costs one small call per lesson.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const env = readFileSync(`${root}/.env.local`, "utf8");
// The value may be quoted in .env.local - strip them.
const key = /GEMINI_API_KEY=(.+)/.exec(env)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!key) throw new Error("GEMINI_API_KEY missing from .env.local");

const MODEL = process.env.SUMMARY_MODEL || "gemini-3-flash-preview";
const OUT = `${root}/src/data/lesson-summaries.json`;
const transcripts = JSON.parse(readFileSync(`${root}/src/data/transcripts.json`, "utf8"));
const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const all = process.argv.includes("--all");

const SYSTEM = `You write the summary that sits under a lesson video in Speak Better, a public-speaking course. You are given one lesson's transcript, spoken by the teacher.

Write two or three sentences of plain prose - 35 to 60 words - saying what this lesson is about and what it asks the student to do. Present tense, second person where it helps ("you"), no headings, no lists, no "in this lesson" or "the teacher explains". Name the technique the way he names it, and keep one concrete detail or example from the transcript if there is a good one. It should read like a person telling you what's in the video, not a blurb.`;

const ai = new GoogleGenAI({ apiKey: key });

const wanted = transcripts.filter((t) => t.text?.trim() && (all || !existing[t.id]));
console.log(`${wanted.length} lessons to summarise (of ${transcripts.length})`);

let done = 0;
for (const lesson of wanted) {
  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: `Lesson: ${lesson.title}\n\nTranscript:\n${lesson.text.slice(0, 12000)}` }] }],
      config: {
        systemInstruction: SYSTEM,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: { summary: { type: "string", description: "35-60 words of prose." } },
          required: ["summary"],
        },
        temperature: 0.4,
      },
    });
    const text = result.text;
    const summary = text ? JSON.parse(text).summary?.trim() : "";
    if (summary) {
      existing[lesson.id] = summary;
      done++;
        if (done % 5 === 0) {
        const now = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
        writeFileSync(OUT, JSON.stringify({ ...now, ...existing }, null, 1));
      }
      console.log(`  ${lesson.id} ${lesson.title.slice(0, 44)} - ${summary.split(/\s+/).length} words`);
    } else {
      console.warn(`  ${lesson.id} - nothing back`);
    }
  } catch (err) {
    console.warn(`  ${lesson.id} failed:`, err instanceof Error ? err.message.slice(0, 120) : err);
  }
}

// Merge with whatever is on disk before writing: two runs at once
// would otherwise have the later one overwrite the earlier one's work
// with its own stale copy.
const onDisk = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const merged = { ...onDisk, ...existing };
writeFileSync(OUT, JSON.stringify(merged, null, 1));
console.log(`wrote ${Object.keys(merged).length} summaries to src/data/lesson-summaries.json`);
