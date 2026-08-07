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
import type { CategoryId } from "@/data/categories";
import { evaluateBadges, type EarnedBadge } from "@/data/badges";

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
}

export interface AppState {
  unlocked: boolean;
  level: Level | null;
  attempts: Attempt[];
  watchedLessons: string[]; // vimeo ids
  badges: EarnedBadge[];
}

const EMPTY: AppState = {
  unlocked: false,
  level: null,
  attempts: [],
  watchedLessons: [],
  badges: [],
};

const STORAGE_KEY = "speak-better-state-v1";

interface StoreApi {
  state: AppState;
  ready: boolean; // false until localStorage has been read (avoids hydration flash)
  celebrations: EarnedBadge[]; // badges earned but not yet shown
  unlock: () => void;
  setLevel: (level: Level) => void;
  markLessonWatched: (vimeoId: string) => void;
  recordAttempt: (attempt: Attempt) => void;
  dismissCelebration: (badgeId: string) => void;
  attemptsFor: (challengeSlug: string) => Attempt[];
  bestAttempt: (challengeSlug: string) => Attempt | undefined;
  latestAttempt: (challengeSlug: string) => Attempt | undefined;
  isChallengeComplete: (challengeSlug: string) => boolean;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY);
  const [ready, setReady] = useState(false);
  const [celebrations, setCelebrations] = useState<EarnedBadge[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as Partial<AppState>) });
    } catch {
      // corrupt state — start fresh rather than crash
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full/unavailable — state still lives in memory
    }
  }, []);

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
      markLessonWatched: (vimeoId) =>
        applyWithBadges((p) =>
          p.watchedLessons.includes(vimeoId)
            ? p
            : { ...p, watchedLessons: [...p.watchedLessons, vimeoId] },
        ),
      recordAttempt: (attempt) =>
        applyWithBadges((p) => ({ ...p, attempts: [...p.attempts, attempt] })),
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
