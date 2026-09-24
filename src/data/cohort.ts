// When this round of Speak Better actually runs.
//
// One file, because the dates appear in the hero, in the pricing, in
// the checkout confirmation and in the emails, and a cohort whose
// start date disagrees with itself across four screens is the kind of
// thing people notice and stop trusting.
//
// THE DISTINCTION THAT MATTERS. Doors and start are not the same day.
// Buying opens the app immediately - a student can explore, take the
// tour, watch lessons, record a baseline - and the cohort proper, with
// everybody moving together and the live sessions running, begins on
// the start date. Saying only "starts October 3" makes someone who
// buys on the 25th feel they have paid to wait; saying only "instant
// access" loses the reason a cohort is worth more than a course.

export const cohort = {
  /** Which round this is, for when there is a second one. */
  name: "Autumn 2026",

  /** The first live session. ISO, with the offset spelled out so it is
   *  unambiguous no matter where it is read or rendered. */
  startsAt: "2026-10-03T11:00:00-05:00",

  /** What the start time is called in the copy. Tariq runs on Central. */
  startLabel: "Saturday, October 3 at 11:00 AM CST",
  startShort: "October 3",

  /** Six weeks of the cohort, from the start date. */
  weeks: 6,
  endsAt: "2026-11-14T11:00:00-06:00",
  endShort: "November 14",

  /** The span, for a line that has to say both ends. */
  runLabel: "October 3 - November 14, 2026",

  /** What a student gets the moment they pay, before the cohort opens. */
  doorsLine: "Doors are open now - buy today and you can start exploring the app straight away.",

  /** The access window, said the same way everywhere. */
  accessLabel: "6 weeks' access",
} as const;

/** Days until the cohort starts, or 0 once it has. For a countdown. */
export function daysUntilStart(now: Date = new Date()): number {
  const start = new Date(cohort.startsAt).getTime();
  return Math.max(0, Math.ceil((start - now.getTime()) / 86_400_000));
}

/** Whether the cohort is still ahead of us. */
export function beforeStart(now: Date = new Date()): boolean {
  return now.getTime() < new Date(cohort.startsAt).getTime();
}
