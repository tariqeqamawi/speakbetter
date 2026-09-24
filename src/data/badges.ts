import type { CategoryId } from "./categories";
import { challengeBadges, challenges, storyPhases } from "./challenges";
import { lessons } from "./lessons";
import { cohort } from "./cohort";

// Gamification layer - master plan §11. Badges recognize effort as much
// as achievement, and apply identically at every level (never gated).

// Structural view of the app state (kept local to avoid an import cycle
// with the store, which imports evaluateBadges).
interface BadgeEvalState {
  attempts: {
    challengeSlug: string;
    at: string;
    passed: boolean;
    score?: number;
    durationSec: number;
    spectrum: Record<CategoryId, number>;
  }[];
  watchedLessons: string[];
  /** Questions Coach has answered (store.tsx). */
  coachAnswers?: number;
  badges: { id: string }[];
  /** Days a streak freeze covered - they count as practiced */
  frozenDays?: string[];
  /** Total XP, worked out by the store - several trophies ask for a
   *  rank as well as a deed. */
  xp?: number;
}

// A trophy is earned, not collected (§11). Every one here asks for a
// thing actually done well - a score the coach gave, more than once
// for the skill trophies, and often a rank alongside - so that a
// student who has barely started holds one or two, not fifteen. The
// challenge medals ask for a pass at 75, the teacher's own bar within
// reach: a scrape-through pass is a pass, but the trophy waits for the
// better take, which is also where the XP is.

/** Talks in which a color reached the bar. */
/** How many DIFFERENT challenges somebody has cleared a skill's bar on.
 *
 *  The skill trophies used to count takes, so two good takes of the
 *  same challenge - the same story told twice - won a trophy for a
 *  skill. A skill is something you bring to everything, so these now
 *  count challenges: to win "Handy", your hands have to be doing the
 *  work across several different talks, not twice in one. */
function challengesAt(s: BadgeEvalState, id: CategoryId, bar: number, passedOnly = false): number {
  return new Set(
    s.attempts
      .filter((a) => (a.spectrum[id] ?? 0) >= bar && (!passedOnly || a.passed))
      .map((a) => a.challengeSlug),
  ).size;
}
const xpOf = (s: BadgeEvalState) => s.xp ?? 0;
const minutesOf = (s: BadgeEvalState) => s.attempts.reduce((sum, a) => sum + (a.durationSec ?? 0), 0) / 60;

export interface BadgeDef {
  id: string;
  title: string;
  message: string;
  /** Line-icon name - the fallback, and what celebrations use inline. */
  icon: string;
  /** What to do to win it, shown under the trophy before it's earned.
   *  A few used to be left off as hidden achievements; every trophy has
   *  one now (24 Sep 2026) - a student looking at the rarest trophies in
   *  the case wants to know what they are reaching for, and a blank
   *  under the obsidian ones read as missing, not mysterious. */
  how?: string;
  earned: (s: BadgeEvalState) => boolean;
}

export interface EarnedBadge {
  id: string;
  title: string;
  message: string;
  icon: string;
  earnedAt: string;
}

/** Days the student practiced - uploads, plus any a freeze covered */
function uploadDays(s: BadgeEvalState): string[] {
  return [
    ...new Set([
      ...s.attempts.map((a) => a.at.slice(0, 10)),
      ...(s.frozenDays ?? []),
    ]),
  ].sort();
}

/** Has the student practiced today? Drives the daily goal on Today. */
export function practicedToday(s: BadgeEvalState): boolean {
  return uploadDays(s).includes(new Date().toISOString().slice(0, 10));
}

/** Current consecutive-day upload streak ending today or yesterday */
export function currentStreak(s: BadgeEvalState): number {
  const days = uploadDays(s);
  if (days.length === 0) return 0;
  const DAY = 86_400_000;
  const today = new Date().toISOString().slice(0, 10);
  const last = days[days.length - 1];
  const gapFromToday = Math.round(
    (Date.parse(today) - Date.parse(last)) / DAY,
  );
  if (gapFromToday > 1) return 0; // streak broken
  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    const gap = Math.round((Date.parse(days[i]) - Date.parse(days[i - 1])) / DAY);
    if (gap === 1) streak++;
    else break;
  }
  return streak;
}

function phaseComplete(s: BadgeEvalState, phaseId: string): boolean {
  const phaseChallenges = challenges.filter((c) => c.phase === phaseId);
  return phaseChallenges.every((c) =>
    c.passive
      ? c.relatedLessonIds.every((id) => s.watchedLessons.includes(id))
      : s.attempts.some((a) => a.challengeSlug === c.slug && a.passed),
  );
}

/**
 * The rendered trophy for a badge, a challenge or a phase.
 *
 * Every one is the same object - a sculpted figure on a short chrome
 * post, on a gunmetal plinth - in one of six materials that say how
 * hard it was to win, cut out by the model that rendered it.
 * See scripts/trophy-prompts.mjs for the words that made them and
 * scripts/build-trophies.mjs for what turns a render into these two
 * files. Anything that wants a trophy picture should come through
 * here, so if the set is ever re-rendered nothing else has to change.
 *
 * `zoom` is the same trophy at twice the size, fetched only when
 * somebody leans in to look at one properly.
 */
export function trophyArt(id: string): { image: string; zoom: string } {
  return { image: `/trophy/${id}.webp`, zoom: `/trophy/${id}-2x.webp` };
}

export const badgeDefs: BadgeDef[] = [
  {
    id: "first-upload",
    title: "First Words",
    message: "Well done - you just uploaded your first video.",
    icon: "film",
    how: "Upload your first challenge video.",
    earned: (s) => s.attempts.length >= 1,
  },
  {
    id: "five-uploads",
    title: "Finding Your Voice",
    message: "Five videos in, and the rank to show for it. This is how speakers are made.",
    icon: "video",
    how: "Upload five challenge videos and reach Finding Your Voice (250 XP).",
    earned: (s) => s.attempts.length >= 5 && xpOf(s) >= 250,
  },
  {
    id: "ten-uploads",
    title: "Serious Reps",
    message: "Fifteen videos and half an hour on camera. Your camera is officially your training partner.",
    icon: "trending-up",
    how: "Upload fifteen challenge videos - thirty minutes of speaking in all.",
    earned: (s) => s.attempts.length >= 15 && minutesOf(s) >= 30,
  },
  {
    id: "practicing-machine",
    title: "Practicing Machine",
    message:
      "You are a practicing machine. You've already tried the same challenge five times. Go you - you're getting so much better.",
    icon: "repeat",
    how: "Record the same challenge five times.",
    earned: (s) => {
      const counts = new Map<string, number>();
      for (const a of s.attempts)
        counts.set(a.challengeSlug, (counts.get(a.challengeSlug) ?? 0) + 1);
      return [...counts.values()].some((n) => n >= 5);
    },
  },
  {
    id: "first-pass",
    title: "Challenge Complete",
    message: "Your first challenge passed. The journey is officially underway.",
    icon: "check-circle",
    how: "Pass any challenge.",
    earned: (s) => s.attempts.some((a) => a.passed),
  },
  {
    id: "full-spectrum",
    title: "Full Spectrum",
    message:
      "Every color lit up in a single talk. That is a genuinely dynamic speaker at work.",
    icon: "spectrum",
    how: "Light up all seven colors in a single talk - 60 or more on every one.",
    earned: (s) =>
      s.attempts.some((a) =>
        Object.values(a.spectrum).every((v) => v >= 60),
      ),
  },
  {
    id: "streak-3",
    title: "On a Roll",
    message: "Three days of practice in a row. Momentum looks good on you.",
    icon: "flame",
    how: "Practice three days in a row.",
    earned: (s) => currentStreak(s) >= 3,
  },
  {
    id: "streak-7",
    title: "Unstoppable",
    message: "A full week of daily practice. Most people never do this once.",
    icon: "zap",
    how: "Practice seven days in a row.",
    earned: (s) => currentStreak(s) >= 7,
  },
  // Thirty days without a gap - the point where the streak bonus tops
  // out, and a month is long enough that it stops being a streak and
  // becomes how somebody lives. Obsidian.
  {
    id: "iron-will",
    title: "Iron Will",
    message: "Thirty days in a row. That is not a streak any more - that is who you are now.",
    icon: "flame",
    how: "Practice thirty days in a row.",
    earned: (s) => currentStreak(s) >= 30,
  },
  {
    id: "streak-5",
    title: "High Five",
    message: "Five days straight. This is a habit now, not an experiment.",
    icon: "flame",
    how: "Practice five days in a row.",
    earned: (s) => currentStreak(s) >= 5,
  },
  {
    id: "ten-minutes",
    title: "Ten Minutes of Fame",
    message:
      "Twenty minutes of you, on camera, speaking. Most people never record one.",
    icon: "video",
    how: "Twenty minutes of speaking uploaded, across any number of takes.",
    earned: (s) => minutesOf(s) >= 20,
  },
  // Skill badges - earned off what the coach actually saw in a talk, so
  // each one is evidence of a specific thing done well, not participation.
  {
    id: "handy",
    title: "Handy",
    message:
      "Your hands did the talking too - gesture that strong is rare, and it reads on camera.",
    icon: "spectrum",
    how: "Score 75 or higher on body language in four different challenges - hands that draw what you're saying, every time.",
    earned: (s) => challengesAt(s, "body-language", 75) >= 4,
  },
  {
    id: "i-see-you",
    title: "I See You",
    message:
      "Five talks holding your eye line and your presence. The camera trusts you now.",
    icon: "check-circle",
    how: "Score 70 or higher on body language in six different challenges - eye contact held throughout, talk after talk.",
    earned: (s) => challengesAt(s, "body-language", 70) >= 6,
  },
  {
    id: "storyteller",
    title: "Storyteller",
    message: "That was a story, properly told - scene, not summary.",
    icon: "film",
    how: "Score 80 or higher on storytelling in four different passed challenges, and hold the Storyteller rank (600 XP).",
    earned: (s) => challengesAt(s, "storytelling", 80, true) >= 4 && xpOf(s) >= 600,
  },
  {
    id: "oscar",
    title: "And the Oscar Goes To",
    message:
      "You didn't report the moment, you performed it. That's acting for speakers.",
    icon: "trophy",
    how: "Score 85 or higher on acting skills in five different challenges - the moment performed, not reported, again and again.",
    earned: (s) => challengesAt(s, "acting", 85) >= 5,
  },
  {
    id: "twisted",
    title: "Twisted",
    message: "You set them up and turned it on them. Plot twist landed.",
    icon: "repeat",
    how: "Pass 'Add a Twist in Third-Person' with a score of 85 or higher.",
    earned: (s) =>
      s.attempts.some((a) => a.challengeSlug === "twist-third-person" && a.passed && (a.score ?? 0) >= 85),
  },
  {
    id: "sensational",
    title: "Sensational",
    message:
      "Figurative, sensory, vivid - your listener saw it, not just heard it.",
    icon: "trending-up",
    how: "Score 80 or higher on figurative language in four different challenges.",
    earned: (s) => challengesAt(s, "figurative", 80) >= 4,
  },
  {
    id: "composer",
    title: "Composer",
    message: "You made your message a melody. Range like that keeps a room.",
    icon: "zap",
    how: "Score 85 or higher on 'Play With Your Voice', and 75 or higher on acting in three other challenges.",
    earned: (s) =>
      s.attempts.some((a) => a.challengeSlug === "voice-melody" && a.passed && (a.score ?? 0) >= 85) &&
      new Set(
        s.attempts
          .filter((a) => a.challengeSlug !== "voice-melody" && (a.spectrum.acting ?? 0) >= 75)
          .map((a) => a.challengeSlug),
      ).size >= 3,
  },
  // One per challenge. Passing a challenge is the single most meaningful
  // thing a student does here, so each one has its own name and art
  // rather than a generic "challenge complete".
  ...challenges.map((challenge) => {
    const meta = challengeBadges[challenge.slug];
    return {
      id: `challenge-${challenge.slug}`,
      title: meta?.title ?? challenge.title,
      message: meta?.message ?? `${challenge.title} - passed.`,
      icon: "medal",
      how: challenge.passive
        ? `Watch every lesson in "${challenge.title}".`
        : `Pass "${challenge.title}" with a score of 75 or higher - a scrape-through pass counts as a pass, not a trophy.`,
      earned: (s: BadgeEvalState) =>
        challenge.passive
          ? challenge.relatedLessonIds.every((id) =>
              s.watchedLessons.includes(id),
            )
          : s.attempts.some((a) => a.challengeSlug === challenge.slug && a.passed && (a.score ?? 0) >= 75),
    };
  }),
  // The gold twin of every scored challenge: 90 or more. The glass
  // trophy says you did it; this one says you mastered it - and it is
  // the reason to record a challenge you have already passed.
  ...challenges
    .filter((challenge) => !challenge.passive)
    .map((challenge) => {
      const meta = challengeBadges[challenge.slug];
      const title = meta?.title ?? challenge.title;
      return {
        id: `challenge-${challenge.slug}-gold`,
        title: `${title} - Gold`,
        message: `Ninety or better on "${challenge.title}". That is not a pass - that is the challenge mastered.`,
        icon: "medal",
        how: `Score 90 or higher on "${challenge.title}".`,
        earned: (s: BadgeEvalState) =>
          s.attempts.some((a) => a.challengeSlug === challenge.slug && (a.score ?? 0) >= 90),
      };
    }),
  ...storyPhases.map((phase) => ({
    id: `phase-${phase.id}`,
    title: `${phase.name} - Complete`,
    message: `You've completed every challenge in ${phase.name}. On to the next phase of the journey.`,
    icon: "medal",
    how: `Complete every challenge in ${phase.name}.`,
    earned: (s: BadgeEvalState) => phaseComplete(s, phase.id),
  })),
  // Coach himself, as a trophy - the lion from the logo in chrome and
  // gold, for somebody who has actually talked to him. Twenty-five
  // answers is about one every other day of the cohort: a habit, not a
  // one-off question.
  {
    id: "coach-confidant",
    title: "In the Lion's Den",
    message: "Twenty-five questions asked and answered. Coach knows your record as well as you do now.",
    icon: "trophy",
    how: "Ask Coach 25 questions on his page.",
    earned: (s) => (s.coachAnswers ?? 0) >= 25,
  },
  // Speak Better, finished: every challenge and every lesson. The lion
  // in obsidian and gold, and drawn larger than any other trophy in the
  // case - it is the one the rest of them were leading to.
  {
    id: "speak-better-complete",
    title: "The Lion's Roar",
    message:
      "Every challenge completed and every lesson watched. You have done all of Speak Better - the whole method, with feedback, from the first baseline to the last take.",
    icon: "trophy",
    how: "Complete every challenge and watch every lesson video.",
    earned: (s) =>
      storyPhases.every((p) => phaseComplete(s, p.id)) &&
      lessons.every((l) => s.watchedLessons.includes(l.vimeoId)),
  },
  // Only this round's students can ever hold it: any take recorded by
  // the day the Autumn 2026 cohort closes. A trophy with a date on it
  // that the next cohort cannot win is what makes the first cohort the
  // founding one.
  {
    id: "cohort-autumn-2026",
    title: "Founding Cohort",
    message: "You were here for the first one - Autumn 2026. No later cohort can ever win this.",
    icon: "trophy",
    how: `Record a take during the founding cohort, before its final session on ${cohort.endShort}, 2026. Only this round can win it.`,
    // Compared as instants: the two are written in different offsets,
    // so comparing the strings would misplace a take by hours.
    earned: (s) => s.attempts.some((a) => new Date(a.at).getTime() <= new Date(cohort.endsAt).getTime()),
  },
  {
    id: "journey-complete",
    title: "The Whole STORY",
    message:
      "All five phases complete. You can now produce a dynamic, full-spectrum talk on demand - because you've done it, with feedback, dozens of times.",
    icon: "trophy",
    how: "Complete all five phases of the S.T.O.R.Y. road - every challenge in every phase.",
    earned: (s) => storyPhases.every((p) => phaseComplete(s, p.id)),
  },
];

/** Returns badges newly earned by `state` that aren't already held. */
export function evaluateBadges(state: BadgeEvalState): EarnedBadge[] {
  const held = new Set(state.badges.map((b) => b.id));
  const now = new Date().toISOString();
  return badgeDefs
    .filter((def) => !held.has(def.id) && def.earned(state))
    .map(({ id, title, message, icon }) => ({
      id,
      title,
      message,
      icon,
      earnedAt: now,
    }));
}
