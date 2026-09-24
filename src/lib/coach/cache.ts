import type { GoogleGenAI } from "@google/genai";

// The coach's brief, held on Google's side instead of sent again.
//
// The brief is eight and a half thousand tokens and it is IDENTICAL on
// every review - the same rules about colors, the same rules about
// what the camera showed, the same jokes about the dog. Sending it
// with each take means paying to transmit the same thirty-six thousand
// characters once per student per attempt, which at a cohort's volume
// is thousands of copies of a document that never changes.
//
// Cached, it is uploaded once and referenced by name, and the tokens
// that come out of the cache are billed at a fraction of fresh ones.
//
// Two things make this safe rather than clever:
//
// A cache is keyed by the exact text. Edit one word of the brief and
// the key changes, a new cache is made, and the old one expires on its
// own - so there is no way to be silently reviewing against last
// week's rules, which is the failure mode that would matter.
//
// And every path falls back. If creating the cache fails, if it has
// expired, if the model refuses it - the review runs the old way with
// the brief inline. A cheaper review is worth having; a review that
// does not happen is not.

/** How long a cache lives. Long enough to serve a cohort's evening,
 *  short enough that an abandoned one costs almost nothing. */
const TTL_SECONDS = 3600;

interface Held {
  name: string;
  /** What is in it - a change here means a different cache. */
  key: string;
  /** When it stops being usable, in ms. */
  until: number;
}

/** One per server instance. A cold start makes a new one; that costs a
 *  single upload and is still cheaper than sending the brief with
 *  every take that instance goes on to handle. */
let held: Held | null = null;
/** So a burst of takes at the same moment makes one cache, not eight. */
let making: Promise<string | null> | null = null;

function keyOf(system: string, model: string): string {
  // The length and the ends are enough to tell two briefs apart
  // without keeping a copy of it in memory.
  return `${model}|${system.length}|${system.slice(0, 64)}|${system.slice(-64)}`;
}

/**
 * The cached brief's name, or null to send it inline.
 *
 * Never throws: a cache that cannot be made is a cache we do without.
 */
export async function cachedBrief(
  ai: GoogleGenAI,
  model: string,
  system: string,
): Promise<string | null> {
  // Below Gemini's minimum a cache is refused, and the brief only
  // grows, but the check costs nothing and the failure is confusing.
  if (system.length < 8_000) return null;

  const key = keyOf(system, model);
  const now = Date.now();
  if (held && held.key === key && held.until > now + 60_000) return held.name;
  if (making) return making;

  making = (async () => {
    try {
      const cache = await ai.caches.create({
        model,
        config: {
          systemInstruction: system,
          ttl: `${TTL_SECONDS}s`,
          displayName: "speak-better-coach-brief",
        },
      });
      if (!cache.name) return null;
      held = { name: cache.name, key, until: now + TTL_SECONDS * 1000 };
      return cache.name;
    } catch (err) {
      // Most likely: the model does not support caching, or the brief
      // is under its minimum. Either way, inline is correct.
      console.warn("[coach] brief not cached, sending inline:", err instanceof Error ? err.message : err);
      held = null;
      return null;
    } finally {
      making = null;
    }
  })();

  return making;
}

/** Forget the cache after a request was refused because of it, so the
 *  next review makes a fresh one rather than failing again. */
export function dropCachedBrief(): void {
  held = null;
}
