"use client";

import { onDemoHost } from "@/lib/demo-host";
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
import { currentStreak, evaluateBadges, type EarnedBadge } from "@/data/badges";
import { isPlan, type Plan } from "@/data/pricing";
import { standing, streakFreezesEarned } from "@/lib/progress";
import { demoState } from "@/lib/demo-state";
import { studentId } from "@/lib/student-id";
import { supabase } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";
import {
  pullState,
  pushAttempt,
  pushBadges,
  pushFrozenDay,
  pushProfile,
  pushShare,
  pushWatched,
} from "@/lib/supabase/sync";
import type { Observations } from "@/lib/coach/rubric";
import type { VoiceProfile } from "@/lib/voice-profile";

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
  /** The review as the coach says it aloud, verdict last. */
  spoken?: string;
  /** The same few things measured in every review, for comparing takes
   *  over time (lib/coach/rubric.ts). */
  /** What the streak added to this take, settled when it was awarded
   *  so it can never be recomputed away (lib/progress.ts). */
  bonusXp?: number;
  /** Every instance Coach put a time on, for the replay (§14). */
  moments?: { at: string; kind: string; category: string; what: string }[];
  observations?: Observations;
  /** What Coach said has shifted since earlier takes. */
  progress?: string;
  /** What the phone measured of the voice (lib/voice-profile.ts). */
  voice?: VoiceProfile;
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
  /** The tier they bought (data/pricing.ts). Absent on states from
   *  before plans existed - treated as coached. */
  plan?: Plan;
  level: Level | null;
  attempts: Attempt[];
  watchedLessons: string[]; // vimeo ids
  /** How many questions Coach has answered on his page. Counted so that
   *  talking to him can be recognised the way practising is; absent on
   *  records from before it was counted, which read as zero. */
  coachAnswers?: number;
  badges: EarnedBadge[];
  /** Days (yyyy-mm-dd) a freeze covered, so a streak survives one miss */
  frozenDays: string[];
  freezesRemaining: number;
  /** How many freezes this record has been GRANTED for streak
   *  milestones, ever. Held so the grant cannot be farmed: a student
   *  who breaks a streak and builds it back to ten is entitled to the
   *  same one freeze they were entitled to the first time. Absent on
   *  states written before earned freezes existed - treated as zero,
   *  which hands a long-standing streak its back pay once. */
  freezesEarned?: number;
  /** XP spent - on buying back a missed day, so far. Subtracted from
   *  the earned total by standing() in lib/progress. */
  xpSpent?: number;
  /** Coaching credits bought on top of the plan's allowance. Reviews
   *  used are counted from the attempts themselves, so this is only
   *  what was purchased (data/credits.ts). */
  creditsBought?: number;
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
  freezesEarned: 0,
  xpSpent: 0,
  creditsBought: 0,
  watchedOn: {},
  questChests: [],
  intention: "",
  displayName: "",
  avatar: "",
  sharedReels: [],
};

export const STORAGE_KEY = "speak-better-state-v1";

// ── The safety net ────────────────────────────────────────────────────
// Until accounts land, a student's record lives in one browser and
// nowhere else - and browsers throw storage away. iOS clears it for any
// site unopened for a week; a second address is a second empty bucket;
// clearing website data takes the lot. So a copy goes to our side as
// the record changes, and /restore can put it back.
//
// It is one-way and debounced. Not a sync: two devices do not merge
// through this, and the newest write wins - the right shape for a
// safety net, the wrong one for multi-device, which is Supabase's job.

let backupTimer: ReturnType<typeof setTimeout> | undefined;

function backUp(next: AppState): void {
  // Nothing worth keeping yet, and an empty record is exactly what
  // must never be allowed to overwrite a full one.
  if (next.attempts.length === 0 && next.watchedLessons.length === 0) return;
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    try {
      void fetch("/api/backup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: studentId(), state: next }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // A failed backup is a backup we do without. It must never be
      // able to interrupt somebody practising.
    }
  }, 4000);
}

interface StoreApi {
  state: AppState;
  ready: boolean; // false until localStorage has been read (avoids hydration flash)
  celebrations: EarnedBadge[]; // badges earned but not yet shown
  unlock: (plan?: Plan) => void;
  setLevel: (level: Level) => void;
  setIntention: (intention: string) => void;
  setProfile: (patch: { displayName?: string; avatar?: string }) => void;
  /** Opens today's quest chest - idempotent per day. */
  claimQuestChest: () => void;
  markLessonWatched: (vimeoId: string) => void;
  /** Coach answered a question - counts toward his trophy. */
  noteCoachAnswer: () => void;
  recordAttempt: (attempt: Attempt) => void;
  /** Post a before-and-after to the community (§12). */
  shareReel: (reel: SharedReel) => void;
  dismissCelebration: (badgeId: string) => void;
  attemptsFor: (challengeSlug: string) => Attempt[];
  bestAttempt: (challengeSlug: string) => Attempt | undefined;
  latestAttempt: (challengeSlug: string) => Attempt | undefined;
  isChallengeComplete: (challengeSlug: string) => boolean;
  /** Pay XP to cover a missed day and keep the streak alive. Returns
   *  false when the day isn't the one at risk, or the XP isn't there. */
  keepStreak: (day: string, price: number) => boolean;
  /** After a top-up is paid for. */
  addCredits: (reviews: number) => void;
}

/**
 * Spend a freeze to bridge a single missed day, so one busy day doesn't
 * wipe a long streak. Runs once on load; only ever covers yesterday, and
 * only when there is a streak worth saving.
 */
/**
 * Make a loaded record safe to render.
 *
 * Seventeen places in this app read `attempt.spectrum[someColor]`, and
 * every one of them throws on an attempt that has no spectrum at all.
 * A real attempt always has one - the review pipeline writes it - but
 * a record does not only ever arrive from the review pipeline: it can
 * come from a restore file, from a backup written before a field
 * existed, or from a hand-edit. When it does, the crash lands in the
 * FIRST render of the dashboard, which is precisely the page somebody
 * opens to check their progress is still there.
 *
 * So it is fixed once, here, on the way in, rather than seventeen
 * times at the point of use. A spectrum-less attempt draws as a flat
 * chart, which is honest about what is known about it, and everything
 * else on the record still works.
 */
function repair(state: AppState): AppState {
  if (state.attempts.every((a) => a.spectrum)) return state;
  const EMPTY_SPECTRUM = {} as Attempt["spectrum"];
  return {
    ...state,
    attempts: state.attempts.map((a) => (a.spectrum ? a : { ...a, spectrum: EMPTY_SPECTRUM })),
  };
}

/**
 * A plan the app doesn't sell, read as no plan.
 *
 * There used to be a free trial, and a record from then can still say
 * `plan: "trial"` - on this device, in a progress file, or from an
 * account. Nothing grants that now, so it opens nothing: the record is
 * kept, its plan is dropped and it waits for a tier to be bought. The
 * same for any other word a hand-edit or a stale backup might hold.
 */
function dropUnsoldPlan(state: AppState): AppState {
  if (state.plan === undefined || isPlan(state.plan)) return state;
  const rest = { ...state };
  delete rest.plan;
  return { ...rest, unlocked: false };
}

/**
 * A freeze earned every ten days in a row.
 *
 * What a long streak pays once the XP bonus has stopped climbing. Past
 * the +100% ceiling at thirty days the multiplier can no longer grow,
 * and a reward that can only be LOST is not a reward - so the thing a
 * long run keeps earning is protection for itself. The longer it has
 * run, the more there is to lose, and the more likely it is that life
 * gets in the way once.
 *
 * Entitlement, not a drip: the record remembers how many it has been
 * granted, so breaking a streak and rebuilding it to ten does not pay
 * twice.
 */
function grantStreakFreezes(state: AppState): AppState {
  const earned = streakFreezesEarned(currentStreak(state));
  const already = state.freezesEarned ?? 0;
  if (earned <= already) return state;
  return {
    ...state,
    freezesRemaining: state.freezesRemaining + (earned - already),
    freezesEarned: earned,
  };
}

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
  // Who's signed in, when accounts are switched on. Null means this
  // device is the record, which is how the app has always worked and
  // how it still works with Supabase unconfigured.
  const [account, setAccount] = useState<string | null>(null);
  const [celebrations, setCelebrations] = useState<EarnedBadge[]>([]);
  const stateRef = useRef(state);
  // The last state written to the account, so persist() can tell what
  // is new without every caller having to say so.
  const syncedRef = useRef<AppState>(EMPTY);

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
          // Earn first, then spend: a student who has just crossed a
          // ten-day milestone and missed yesterday should be covered
          // by the freeze that run just earned them.
          const loaded = applyStreakFreeze(
            grantStreakFreezes(
              repair(
                dropUnsoldPlan({
                  ...EMPTY,
                  ...(JSON.parse(raw) as Partial<AppState>),
                }),
              ),
            ),
          );
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

  // With Supabase configured and somebody signed in, their record is
  // pulled over the device's and followed from then on. The local copy
  // stays the working copy - every screen reads it, and it's what makes
  // the app usable on a train - but the account is where it lives.
  useEffect(() => {
    if (ephemeral || !supabaseConfigured()) return;
    const db = supabase();
    if (!db) return;
    let alive = true;

    const adopt = async (userId: string | null) => {
      setAccount(userId);
      if (!userId) return;
      const pulled = await pullState();
      if (!alive || !pulled) return;
      // Their account wins where it has anything to say; anything
      // recorded on this device before signing in is kept beside it.
      const merged: AppState = {
        ...stateRef.current,
        ...pulled,
        attempts: mergeById([...stateRef.current.attempts, ...(pulled.attempts ?? [])]),
        watchedLessons: [...new Set([...stateRef.current.watchedLessons, ...(pulled.watchedLessons ?? [])])],
        frozenDays: [...new Set([...stateRef.current.frozenDays, ...(pulled.frozenDays ?? [])])],
        questChests: [...new Set([...stateRef.current.questChests, ...(pulled.questChests ?? [])])],
        // The words on a badge are the app's own; the account keeps
        // which and when.
        badges: mergeBadges(stateRef.current.badges, pulled.badges ?? []),
      };
      setState(merged);
      stateRef.current = merged;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      // Anything this device had and the account didn't goes up.
      for (const attempt of merged.attempts) void pushAttempt(attempt);
      void pushProfile(merged);
    };

    void db.auth.getUser().then((res: { data: { user: { id: string } | null } }) => adopt(res.data.user?.id ?? null));
    const { data: sub } = db.auth.onAuthStateChange((_event: string, session: { user?: { id: string } } | null) => {
      void adopt(session?.user?.id ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
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
      // And a copy on our side, so a browser throwing its storage away
      // stops being the end of somebody's work. Debounced, because
      // this fires on every XP tick and nobody needs a hundred copies
      // of the same afternoon.
      backUp(next);
      // And up to the account, if there is one. What changed is worked
      // out by comparing with what was there a moment ago, so callers
      // don't each have to remember to sync.
      if (!account) return;
      const before = syncedRef.current;
      syncedRef.current = next;
      if (next.attempts.length > before.attempts.length) {
        for (const a of next.attempts.slice(before.attempts.length)) void pushAttempt(a);
      }
      const newLessons = next.watchedLessons.filter((id) => !before.watchedLessons.includes(id));
      for (const id of newLessons) void pushWatched(id);
      const newBadges = next.badges.filter((b) => !before.badges.some((o) => o.id === b.id));
      if (newBadges.length > 0) void pushBadges(newBadges.map((b) => ({ id: b.id, earnedAt: b.earnedAt })));
      const newFrozen = next.frozenDays.filter((d) => !before.frozenDays.includes(d));
      for (const day of newFrozen) void pushFrozenDay(day, (next.xpSpent ?? 0) > (before.xpSpent ?? 0));
      const newShares = next.sharedReels.filter((r) => !before.sharedReels.some((o) => o.id === r.id));
      for (const reel of newShares) void pushShare(reel);
      if (
        next.displayName !== before.displayName ||
        next.intention !== before.intention ||
        next.level !== before.level ||
        next.plan !== before.plan ||
        next.avatar !== before.avatar ||
        next.freezesRemaining !== before.freezesRemaining ||
        (next.xpSpent ?? 0) !== (before.xpSpent ?? 0)
      ) {
        void pushProfile(next);
      }
    },
    [ephemeral, account],
  );

  // Apply a state change, then check whether it earned any new badges;
  // newly earned badges join the celebration queue (master plan §11).
  const applyWithBadges = useCallback(
    (mutate: (prev: AppState) => AppState) => {
      const next = mutate(stateRef.current);
      const newBadges = evaluateBadges({ ...next, xp: standing(next).xp });
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
      // On the private demo address a new student arrives already worked
      // in - the level and the reason are still theirs to give on welcome.
      // Its trophies arrive already won - every one the record has earned,
      // worked out now and kept quietly - so nothing is announced as new.
      unlock: (plan = "coached") => {
        if (onDemoHost() && stateRef.current.attempts.length === 0) {
          const seed: AppState = { ...demoState, level: null, intention: "", plan, unlocked: true };
          const earned = evaluateBadges({ ...seed, xp: standing(seed).xp });
          persist({ ...seed, badges: [...seed.badges, ...earned] });
          return;
        }
        applyWithBadges((p) => ({ ...p, unlocked: true, plan }));
      },
      setLevel: (level) => applyWithBadges((p) => ({ ...p, level })),
      setIntention: (intention) =>
        applyWithBadges((p) => ({ ...p, intention: intention.trim() })),
      setProfile: (patch) => applyWithBadges((p) => ({ ...p, ...patch })),
      noteCoachAnswer: () =>
        applyWithBadges((p) => ({ ...p, coachAnswers: (p.coachAnswers ?? 0) + 1 })),
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
      // Buying a day back: the day joins frozenDays (so the streak
      // counts it) and the price goes on the ledger. Refused if the
      // day is already covered or the XP isn't there - the check is
      // here rather than in the button, so it can't be clicked twice.
      addCredits: (reviews) =>
        applyWithBadges((p) => ({ ...p, creditsBought: (p.creditsBought ?? 0) + Math.max(0, reviews) })),
      keepStreak: (day, price) => {
        const current = stateRef.current;
        if (current.frozenDays.includes(day)) return false;
        if (standing(current).xp < price) return false;
        applyWithBadges((p) => ({
          ...p,
          frozenDays: [...p.frozenDays, day],
          xpSpent: (p.xpSpent ?? 0) + price,
        }));
        return true;
      },
    };
  }, [state, ready, celebrations, applyWithBadges]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** Attempts from two places, newest copy of each id, oldest first. */
function mergeById(list: Attempt[]): Attempt[] {
  const by = new Map<string, Attempt>();
  for (const a of list) by.set(a.id, a);
  return [...by.values()].sort((a, b) => (a.at < b.at ? -1 : 1));
}

/** Badges from the account, wearing the app's own words for them. */
function mergeBadges(mine: EarnedBadge[], theirs: EarnedBadge[]): EarnedBadge[] {
  const by = new Map(mine.map((b) => [b.id, b]));
  for (const b of theirs) {
    const known = by.get(b.id);
    by.set(b.id, known ? { ...known, earnedAt: b.earnedAt } : b);
  }
  return [...by.values()];
}
