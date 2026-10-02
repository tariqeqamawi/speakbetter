import { categoryById, type Category, type CategoryId } from "@/data/categories";
import { challenges, storyPhases } from "@/data/challenges";
import { lessonByVimeoId, lessonsInCategory } from "@/data/lessons";
import { phaseGate } from "@/lib/progress";
import type { AppState } from "@/lib/store";

// Skills open one colour at a time, in the order a nervous beginner needs
// them: how you feel on camera, then your body, then your voice, then the
// colours of what you say, then shaping it, then the advanced craft.
//
// A new student who walked straight into Storytelling met the storybook
// lessons cold, felt they had missed something, and stopped (2 Oct). So
// Presence opens first, and watching five lessons in a colour (or every
// one, if it has fewer) opens the next.
//
// Two exceptions keep the lock from getting in the way:
// - A lesson a challenge asks you to warm up with opens when you come to
//   it FROM that challenge (its links carry ?from=<slug>), whatever its
//   colour - the challenges don't follow this order. Browsing Skills, it
//   stays locked with the rest of its colour.
// - Anyone who started before the lock existed keeps everything open:
//   the whole library was theirs, and taking it back would punish them.

/** The order the colours open in. */
export const UNLOCK_ORDER: CategoryId[] = [
  "mindset",
  "body-language",
  "voice",
  "storytelling",
  "figurative",
  "acting",
  "structure",
  "advanced",
];

/** The colour every student starts in. */
export const FIRST_COLOUR: CategoryId = UNLOCK_ORDER[0];
/** Lessons watched in a colour that open the next one. */
export const OPEN_AFTER = 5;
/** The day the lock arrived; anyone active before it keeps everything. */
const LOCK_FROM = "2026-10-02";

type LockState = Pick<AppState, "watchedLessons" | "watchedOn" | "attempts">;

/** Started before the lock: a lesson watched, or a take sent, before it. */
function startedBefore(state: LockState): boolean {
  if (state.attempts.some((a) => a.at.slice(0, 10) < LOCK_FROM)) return true;
  // A watch with no date predates the dates being kept, so it's older still.
  return state.watchedLessons.some((id) => {
    const on = state.watchedOn?.[id];
    return !on || on < LOCK_FROM;
  });
}

/** How many lessons a colour asks for before the next one opens. */
export function neededIn(colour: CategoryId): number {
  return Math.min(OPEN_AFTER, lessonsInCategory(colour).length);
}

/** Lessons watched in a colour (its own and those shelved in it too). */
export function watchedIn(state: LockState, colour: CategoryId): number {
  const watched = new Set(state.watchedLessons);
  return lessonsInCategory(colour).filter((l) => watched.has(l.vimeoId)).length;
}

/** How many colours are open, counting from the start of UNLOCK_ORDER. */
export function openCount(state: LockState): number {
  if (startedBefore(state)) return UNLOCK_ORDER.length;
  let n = 1;
  while (n < UNLOCK_ORDER.length && watchedIn(state, UNLOCK_ORDER[n - 1]) >= neededIn(UNLOCK_ORDER[n - 1])) n++;
  return n;
}

/** Every colour open. */
export function skillsOpen(state: LockState): boolean {
  return openCount(state) === UNLOCK_ORDER.length;
}

export function colourOpen(state: LockState, colour: string): boolean {
  const i = UNLOCK_ORDER.indexOf(colour as CategoryId);
  return i >= 0 && i < openCount(state);
}

/** The colour being worked on: the last one open, while any are locked. */
export function frontier(state: LockState): CategoryId | null {
  const n = openCount(state);
  return n < UNLOCK_ORDER.length ? UNLOCK_ORDER[n - 1] : null;
}

/** The colour a colour waits on (the one before it in the order). */
export function opensAfter(colour: CategoryId): Category | null {
  const i = UNLOCK_ORDER.indexOf(colour);
  return i > 0 ? (categoryById.get(UNLOCK_ORDER[i - 1]) ?? null) : null;
}

/** The colour that opens after this one. */
export function opensNext(colour: CategoryId): Category | null {
  const i = UNLOCK_ORDER.indexOf(colour);
  return i >= 0 && i < UNLOCK_ORDER.length - 1 ? (categoryById.get(UNLOCK_ORDER[i + 1]) ?? null) : null;
}

/** A single lesson: open if any colour it's shelved in is open, or it was
 *  opened from a challenge (`from`, its slug) that the student can reach
 *  and that asks for it as a warm-up. */
export function lessonOpen(state: AppState, vimeoId: string, from?: string | null): boolean {
  const lesson = lessonByVimeoId.get(vimeoId);
  if (!lesson) return true;
  if ([lesson.category, ...(lesson.alsoIn ?? [])].some((c) => colourOpen(state, c))) return true;
  const challenge = from ? challenges.find((c) => c.slug === from) : undefined;
  if (!challenge?.relatedLessonIds.includes(vimeoId)) return false;
  return phaseGate(state, storyPhases.findIndex((p) => p.id === challenge.phase)).open;
}

/** What to say when a locked colour (or a lesson in one) is asked for:
 *  which colour is open now, how many more of its lessons to watch, and
 *  what that opens - so a lock always comes with the way through it. */
export function lockMessage(state: LockState, colour: CategoryId): { title: string; body: string; now: Category } {
  const now = categoryById.get(frontier(state) ?? FIRST_COLOUR)!;
  const next = opensNext(now.id);
  const asked = categoryById.get(colour)!;
  const toGo = Math.max(1, neededIn(now.id) - watchedIn(state, now.id));
  const lessons = `${toGo} more ${now.name} lesson${toGo === 1 ? "" : "s"}`;
  if (!next || next.id === asked.id)
    return { title: `${asked.name} is locked`, body: `Watch ${lessons} to unlock ${asked.name}.`, now };
  return {
    title: `${asked.name} is locked`,
    body: `The colors open one at a time. Watch ${lessons} to unlock ${next.name} next - ${asked.name} opens after that, in order.`,
    now,
  };
}
