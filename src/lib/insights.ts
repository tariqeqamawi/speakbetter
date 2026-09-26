"use client";

// What the app learns from being used - for making Coach a better coach
// and the app a better app. Every student is followed as an individual
// under a number, never a name (see the consent line, CONSENT_LINE). No
// video is ever recorded here: only events - what was opened, for how
// long, a rating, a reaction - and, from reviews, the anonymised text.
//
// Until the database is switched on (Supabase), events are kept in a
// small queue on the device and are sent up the moment it is; the admin
// dashboard reads the same shape from either place.

export const CONSENT_LINE =
  "None of your videos are ever stored. Your speech is turned into text and kept under a student number - never your name, and any names you mention are removed - so we can follow how you grow and help Coach become an even better coach.";

export type ReviewRating = "spot-on" | "partly" | "off";

export const REVIEW_RATINGS: { id: ReviewRating; emoji: string; label: string }[] = [
  { id: "spot-on", emoji: "👌", label: "Spot on" },
  { id: "partly", emoji: "🤏", label: "Partly right" },
  { id: "off", emoji: "👎", label: "Way off the mark" },
];

export type InsightEvent =
  | { type: "view"; area: string; path: string }
  | { type: "time"; area: string; seconds: number }
  | { type: "review-rating"; attemptId: string; challenge: string; level: string; rating: ReviewRating; note?: string }
  | { type: "feature-reaction"; feature: string; reaction: "love" | "dislike"; note?: string }
  | { type: "coach-question"; question: string }
  | { type: "tour"; stop: string; action: "next" | "back" | "end" };

/** The part of the app a path belongs to, for the heatmap. */
export function areaOf(path: string): string {
  if (path.startsWith("/challenges/")) return "challenge";
  if (path.startsWith("/challenges")) return "road";
  if (path.startsWith("/skills/cards")) return "deck";
  if (path.startsWith("/skills/")) return "lesson";
  if (path.startsWith("/skills")) return "dial";
  if (path.startsWith("/review")) return "review";
  if (path.startsWith("/coach")) return "ask-coach";
  if (path.startsWith("/profile")) return "dashboard";
  if (path.startsWith("/live")) return "live";
  if (path.startsWith("/community")) return "community";
  if (path === "/" || path.startsWith("/today")) return "today";
  return path.split("/")[1] || "today";
}

const QUEUE = "insights-queue-v1";
const MAX = 2000;

/** Record something that happened. Never throws, never slows the app. */
export function track(event: InsightEvent): void {
  if (typeof window === "undefined") return;
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE) ?? "[]") as unknown[];
    q.push({ ...event, at: new Date().toISOString() });
    localStorage.setItem(QUEUE, JSON.stringify(q.slice(-MAX)));
  } catch {
    // no storage: nothing learned from this one
  }
}

/** Everything recorded on this device, oldest first. */
export function queued(): (InsightEvent & { at: string })[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE) ?? "[]");
  } catch {
    return [];
  }
}
