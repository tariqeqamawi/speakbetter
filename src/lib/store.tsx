"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { CategoryId } from "@/data/categories";
import { evaluateBadges, type EarnedBadge } from "@/data/badges";
import { demoState } from "@/lib/demo-state";

// ─────────────────────────────────────────────────────────────────────
// Local-first state layer.
//
// INTEGRATION SWAP POINT (build plan Phase 3, stack §19): everything in
// this file persists to localStorage today. When Supabase is wired in,
// this same interface backs onto Postgres + Supabase Auth and the
// mock unlock() is replaced by the real Stripe checkout webhook.
// Component code should not need to change.
// ─────────────────────────────────────────────────────────────────────

export type Level = "beginner" | "intermediate" | "advanced";

export interface FeedbackNote {
  category: CategoryId;
  note: string;
  /** Lessons behind this observation - the skill used or the skill to
   * learn. Rendered as links into Skills at Intermediate/Advanced (§08),
   * so a skill stumbled into by chance can be studied on purpose. */
  lessonIds?: string[];
  /** m:ss in the student's own video, where the coach gives one. */
  at?: string;
}

export interface Attempt {
  id: string;
  challengeSlug: string;
  at: string; // ISO datetime
  durationSec: number;
  passed: boolean;
  score: number; // 0–100
  spectrum: Record<CategoryId, number>; // 0–100 per category
  focus: FeedbackNote[]; // the 2–3 priority notes (all levels)
  fullNotes: FeedbackNote[]; // everything the AI noticed (revealed at int/adv)
  summary: string;
  /** The brief, judged - one line, then each criterion. From the real
   *  coach only; older and mock attempts have neither. */
  briefVerdict?: string;
  criteria?: { text: string; met: boolean; evidence: string }[];
  /** The lessons the challenge cited, and whether they were used.
   *  Quality is out of ten. */
  lessonsUsed?: { lessonId: string; used: boolean; quality: number; evidence: string }[];
  /** Techniques from other lessons used without being asked for -
   *  revealed at Intermediate and Advanced (§08). Quality out of ten. */
  skillsSpotted?: { lessonId: string; quality: number; at?: string; evidence: string }[];
  /** What worked - every level sees these, before the improvements. */
  strengths?: FeedbackNote[];
  /** True while the stand-in coach answered rather than Gemini. */
  mock?: boolean;
}

/**
 * A before-and-after the student chose to share with the community: the
 * two scores and spectra and the date, never the videos - those stay on
 * the device (§13). Kept locally until the community layer lands, when
 * this same record is what gets posted.
 */
export interface SharedReel {
  id: string;
  at: string; // ISO datetime
  thenSlug: string;
  thenScore: number;
  thenSpectrum: Record<CategoryId, number>;
  nowSlug: string;
  nowScore: number;
  nowSpectrum: Record<CategoryId, number>;
  /** Challenges passed at the time. */
  passed: number;
}

export interface AppState {
  unlocked: boolean;
  level: Level | null;
  attempts: Attempt[];
  watchedLessons: string[]; // vimeo ids
  badges: EarnedBadge[];
  /** Days (yyyy-mm-dd) a freeze covered, so a streak survives one miss */
  frozenDays: string[];
  freezesRemaining: number;
  /** When each lesson was watched (vimeo id → yyyy-mm-dd). The watched
   *  list predates this, so older entries may be absent - anything that
   *  reads it must treat missing as "not today". */
  watchedOn: Record<string, string>;
  /** Days (yyyy-mm-dd) the daily-quest chest was opened. Each one is a
   *  completed three-quest day, worth bonus XP. */
  questChests: string[];
  /** Why they're here, in their own words - asked at onboarding and kept
   *  at the top of their profile. The whole course asks people to keep
   *  going; this is the reason they gave for wanting to. */
  intention: string;
  displayName: string;
  /** A downscaled data URL. Small enough to sit in localStorage today,
   *  and swapped for a storage bucket URL when Supabase lands. */
  avatar: string;
  /** Before-and-afters shared to the community, newest last. */
  sharedReels: SharedReel[];
}

const STARTING_FREEZES = 2;

const EMPTY: AppState = {
  unlocked: false,
  level: null,
  attempts: [],
  watchedLessons: [],
  badges: [],
  frozenDays: [],
  freezesRemaining: STARTING_FREEZES,
  watchedOn: {},
  questChests: [],
  intention: "",
  displayName: "",
  avatar: "",
  sharedReels: [],
};

export const STORAGE_KEY = "speak-better-state-v1";

interface StoreApi {
  state: AppState;
  ready: boolean; // false until localStorage has been read (avoids hydration flash)
  celebrations: EarnedBadge[]; // badges earned but not yet shown
  unlock: () => void;
  setLevel: (level: Level) => void;
  setIntention: (intention: string) => void;
  setProfile: (patch: { displayName?: string; avatar?: string }) => void;
  /** Opens today's quest chest - idempotent per day. */
  claimQuestChest: () => void;
  markLessonWatched: (vimeoId: string) => void;
  recordAttempt: (attempt: Attempt) => void;
  /** Post a before-and-after to the community (§12). */
  shareReel: (reel: SharedReel) => void;
  dismissCelebration: (badgeId: string) => void;
  attemptsFor: (challengeSlug: string) => Attempt[];
  bestAttempt: (challengeSlug: string) => Attempt | undefined;
  latestAttempt: (challengeSlug: string) => Attempt | undefined;
  isChallengeComplete: (challengeSlug: string) => boolean;
}

/**
 * Spend a freeze to bridge a single missed day, so one busy day doesn't
 * wipe a long streak. Runs once on load; only ever covers yesterday, and
 * only when there is a streak worth saving.
 */
function applyStreakFreeze(state: AppState): AppState {
  if (state.freezesRemaining <= 0 || state.attempts.length === 0) return state;
  const DAY = 86_400_000;
  const today = new Date().toISOString().slice(0, 10);
  const active = new Set([
    ...state.attempts.map((a) => a.at.slice(0, 10)),
    ...state.frozenDays,
  ]);
  if (active.has(today)) return state;

  const yesterday = new Date(Date.parse(today) - DAY).toISOString().slice(0, 10);
  const dayBefore = new Date(Date.parse(today) - DAY * 2).toISOString().slice(0, 10);
  // Yesterday missed, but the day before was active - exactly the gap a
  // freeze exists to cover.
  if (!active.has(yesterday) && active.has(dayBefore)) {
    return {
      ...state,
      frozenDays: [...state.frozenDays, yesterday],
      freezesRemaining: state.freezesRemaining - 1,
    };
  }
  return state;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Two preview surfaces, both backed by an ephemeral store that never
  // reads or writes real progress: /landing always shows the visitor's
  // view, and /demo shows a worked-in dashboard. The key remount swaps
  // cleanly between an ephemeral store and the live one on navigation.
  const pathname = usePathname();
  const preview =
    pathname === "/landing"
      ? "landing"
      : pathname === "/demo" || pathname.startsWith("/demo/")
        ? "demo"
        : null;
  return (
    <StoreCore
      key={preview ?? "live"}
      ephemeral={preview !== null}
      seed={preview === "demo" ? demoState : undefined}
    >
      {children}
    </StoreCore>
  );
}

function StoreCore({
  children,
  ephemeral,
  seed,
}: {
  children: ReactNode;
  ephemeral: boolean;
  seed?: AppState;
}) {
  const [state, setState] = useState<AppState>(seed ?? EMPTY);
  const [ready, setReady] = useState(false);
  const [celebrations, setCelebrations] = useState<EarnedBadge[]>([]);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydrate from localStorage after mount. This must happen in an effect
  // (not a useState initializer) so server and first client render agree;
  // the synchronous setState here is the sync-from-external-store idiom.
  useEffect(() => {
    // An ephemeral store (the /landing preview) skips hydration entirely -
    // it always starts from EMPTY and never touches localStorage.
    if (!ephemeral) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const loaded = applyStreakFreeze({
            ...EMPTY,
            ...(JSON.parse(raw) as Partial<AppState>),
          });
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState(loaded);
          stateRef.current = loaded;
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
          } catch {
            // a spent freeze that fails to persist just gets re-applied
          }
        }
      } catch {
        // corrupt state - start fresh rather than crash
      }
    }
    setReady(true);
  }, [ephemeral]);

  const persist = useCallback(
    (next: AppState) => {
      setState(next);
      if (ephemeral) return; // preview progress lives and dies in memory
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage full/unavailable - state still lives in memory
      }
    },
    [ephemeral],
  );

  // Apply a state change, then check whether it earned any new badges;
  // newly earned badges join the celebration queue (master plan §11).
  const applyWithBadges = useCallback(
    (mutate: (prev: AppState) => AppState) => {
      const next = mutate(stateRef.current);
      const newBadges = evaluateBadges(next);
      const final = newBadges.length
        ? { ...next, badges: [...next.badges, ...newBadges] }
        : next;
      persist(final);
      if (newBadges.length) setCelebrations((q) => [...q, ...newBadges]);
    },
    [persist],
  );

  const api = useMemo<StoreApi>(() => {
    const attemptsFor = (slug: string) =>
      state.attempts.filter((a) => a.challengeSlug === slug);
    return {
      state,
      ready,
      celebrations,
      unlock: () => applyWithBadges((p) => ({ ...p, unlocked: true })),
      setLevel: (level) => applyWithBadges((p) => ({ ...p, level })),
      setIntention: (intention) =>
        applyWithBadges((p) => ({ ...p, intention: intention.trim() })),
      setProfile: (patch) => applyWithBadges((p) => ({ ...p, ...patch })),
      markLessonWatched: (vimeoId) =>
        applyWithBadges((p) =>
          p.watchedLessons.includes(vimeoId)
            ? p
            : {
                ...p,
                watchedLessons: [...p.watchedLessons, vimeoId],
                watchedOn: {
                  ...p.watchedOn,
                  [vimeoId]: new Date().toISOString().slice(0, 10),
                },
              },
        ),
      claimQuestChest: () =>
        applyWithBadges((p) => {
          const today = new Date().toISOString().slice(0, 10);
          return p.questChests.includes(today)
            ? p
            : { ...p, questChests: [...p.questChests, today] };
        }),
      recordAttempt: (attempt) =>
        applyWithBadges((p) => ({ ...p, attempts: [...p.attempts, attempt] })),
      // INTEGRATION SWAP POINT (§12, stack §19): today this is a row in
      // the student's own state; with Supabase it becomes an insert
      // into the community feed, and the local copy is the cache.
      shareReel: (reel) =>
        applyWithBadges((p) => ({ ...p, sharedReels: [...p.sharedReels, reel] })),
      dismissCelebration: (badgeId) =>
        setCelebrations((q) => q.filter((b) => b.id !== badgeId)),
      attemptsFor,
      bestAttempt: (slug) =>
        attemptsFor(slug).reduce<Attempt | undefined>(
          (best, a) => (!best || a.score > best.score ? a : best),
          undefined,
        ),
      latestAttempt: (slug) => attemptsFor(slug).at(-1),
      isChallengeComplete: (slug) => attemptsFor(slug).some((a) => a.passed),
    };
  }, [state, ready, celebrations, applyWithBadges]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
