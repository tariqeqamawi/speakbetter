import { cohort } from "@/data/cohort";

// This cohort's live sessions, as planned.
//
// WHY THE SCHEDULE IS IN THE REPO AND THE RECORDINGS ARE IN THE
// DATABASE. Six dates decided in advance do not need a database - they
// need to be right, visible in a diff, and impossible to get wrong in
// two places. What genuinely cannot live here is everything that
// happens on the day: who was in the hot seat, at what minute, and
// where the recording ended up. That is what live_sessions and
// hot_seats are for (supabase/live.sql), and once Supabase is
// configured the rows there win over these.
//
// So: this file is the promise. The database is the record.
//
// THE FORMAT. Every session is hot-seat coaching - students on camera,
// worked with live - which is the whole reason the call is on Zoom
// rather than built into the app. A two-way room is the expensive half
// of live video and Zoom already does it well. The app owns the part
// that compounds: knowing when, getting in, and the library afterwards.

export interface PlannedSession {
  id: string;
  /** Which week of the six this is. */
  week: number;
  title: string;
  blurb: string;
  /** ISO, offset spelled out so it is unambiguous wherever it is read. */
  heldAt: string;
  /** Roughly how long to set aside. */
  minutes: number;
  /** Which challenges this session works on - so the replay can be
   *  offered from the challenge itself, which is where it is worth
   *  most: it reaches somebody about to record that exact thing. */
  relatedSlugs: string[];
}

/** Every session is the same hour on the same day of the week as the
 *  opening one - a cohort should never have to check what time it is
 *  this week. */
function weekly(week: number): string {
  const start = new Date(cohort.startsAt);
  start.setDate(start.getDate() + (week - 1) * 7);
  return start.toISOString();
}

export const plannedSessions: PlannedSession[] = [
  {
    id: "week-1",
    week: 1,
    title: "Opening night - and your first hot seat",
    blurb:
      "We start the cohort together. Tariq sets out the six weeks, then goes straight into hot seats: the first few volunteers speak live and get coached on the spot. Watching somebody else be worked with is most of the value, so come even if you do not want the chair.",
    heldAt: weekly(1),
    minutes: 90,
    relatedSlugs: ["speaking-baseline", "story-without-help"],
  },
  {
    id: "week-2",
    week: 2,
    title: "The instrument - voice, pace and the pause",
    blurb:
      "Hot seats on delivery. Filler words, rushing, the flat line - the things everybody can hear in somebody else and nobody can hear in themselves. Bring a passage you keep stumbling on.",
    heldAt: weekly(2),
    minutes: 90,
    relatedSlugs: ["no-filler-words", "voice-melody", "tongue-twisters", "avoid-boring-words"],
  },
  {
    id: "week-3",
    week: 3,
    title: "Owning your stories",
    blurb:
      "Bring a story from your storybook and tell it live. We work on where it actually starts, what to cut, and the difference between telling a story and reporting one.",
    heldAt: weekly(3),
    minutes: 90,
    relatedSlugs: ["create-storybook", "moment-from-your-day", "set-and-scene", "describe-vividly"],
  },
  {
    id: "week-4",
    week: 4,
    title: "Structure, twists and the payoff",
    blurb:
      "Hot seats on shape. Holding a reveal, planting something early that pays off late, and why most stories give themselves away in the first ten seconds.",
    heldAt: weekly(4),
    minutes: 90,
    relatedSlugs: ["twist-third-person", "foreshadowing", "high-stakes-moment", "three-emotions"],
  },
  {
    id: "week-5",
    week: 5,
    title: "Going deeper - the stories that cost something",
    blurb:
      "The most careful session of the six. Vulnerability delivered with strength, told from the far side of the thing rather than from inside it. Volunteering is entirely optional and watching is enough.",
    heldAt: weekly(5),
    minutes: 90,
    relatedSlugs: ["story-youve-healed", "someone-elses-story", "multiple-characters"],
  },
  {
    id: "week-6",
    week: 6,
    title: "The mic drop - and where you go from here",
    blurb:
      "Final hot seats, and we watch baselines against week-six takes. Then what to keep practicing once the cohort ends, and how to keep the habit without the deadline.",
    heldAt: weekly(6),
    minutes: 90,
    relatedSlugs: ["mic-drop", "thirty-second-pitch", "podcast-introduction", "explain-with-analogies"],
  },
];

/** The session that is on now, else the next one, else the last one. */
export function nextPlanned(now: Date = new Date()): PlannedSession | null {
  const t = now.getTime();
  const on = plannedSessions.find((s) => {
    const start = new Date(s.heldAt).getTime();
    return t >= start - 15 * 60_000 && t <= start + s.minutes * 60_000;
  });
  if (on) return on;
  const ahead = plannedSessions.filter((s) => new Date(s.heldAt).getTime() > t);
  return ahead[0] ?? plannedSessions[plannedSessions.length - 1] ?? null;
}

/** Sessions that worked on a particular challenge. */
export function plannedForChallenge(slug: string): PlannedSession[] {
  return plannedSessions.filter((s) => s.relatedSlugs.includes(slug));
}

/** Has this one already happened? */
export function isPast(s: PlannedSession, now: Date = new Date()): boolean {
  return now.getTime() > new Date(s.heldAt).getTime() + s.minutes * 60_000;
}
