// What Coach says when his page opens.
//
// Fixed lines, no name in them: a greeting is the one thing in this app
// that should never be assembled from the record, and a lion who says
// your name every single time you open a page stops sounding like a
// greeting.
//
// They are also **spoken from files rather than generated**. Twenty-one
// short lines that never change are twenty-one clips that can be made
// once (scripts/build-greetings.mjs) and shipped: the hello is instant,
// it costs nothing per visit, and - the part that matters - it still
// works on a day when the text-to-speech balance is empty. Coach
// falling silent the moment he opens his mouth is the worst first
// impression this app could make.
//
// Each line's clip is greet-01.mp3, greet-02.mp3 and so on, in the
// order below, so adding a line means rerunning the script.

export const GREETINGS: string[] = [
  "Welcome back.",
  "Back for more, I see.",
  "How can I help?",
  "Ready for more?",
  "You're back.",
  "Ask me anything.",
  "What can I do for you today?",
  "Hey there.",
  "Look who returns.",
  "Ah, let's continue.",
  "Nice to see you again.",
  "Practice makes permanent.",
  "I'm glad to see you.",
  "This is how legends are made.",
  "You ask, I'll teach.",
  "Ask away.",
  "Speaking will be your new superpower.",
  "Getting your reps in.",
  "Alright, let's go.",
  "Ready when you are.",
  "What would you like to know?",
];

/** The clip for a line, by its place in the list. */
export function greetingClip(index: number): string {
  return `/coach/greet-${String(index + 1).padStart(2, "0")}.mp3`;
}

/** One at random, with the file that says it. */
export function pickGreeting(): { text: string; src: string } {
  const i = Math.floor(Math.random() * GREETINGS.length);
  return { text: GREETINGS[i], src: greetingClip(i) };
}

// ── While he thinks ──────────────────────────────────────────────────
//
// The written review lands in a few seconds; his spoken one takes
// about thirty-five, because the voice has to be made a word at a
// time. A student staring at a disabled button for half a minute
// assumes something is broken.
//
// So he says so, instantly, from a file: look at what is already on
// your screen, I am working on the rest. The wait stops being dead
// air and becomes a person gathering their thoughts - which is what it
// actually is.

export const HOLDS: string[] = [
  "Start looking at your review while I put my thoughts together.",
  "Your colors are up there. Give me a moment and I'll talk you through it.",
  "Have a look at the numbers while I work out what to tell you.",
  "It's all on the screen. One moment and I'll say what I saw.",
];

/** The clip for a holding line, by its place in the list. */
export function holdClip(index: number): string {
  return `/coach/hold-${String(index + 1).padStart(2, "0")}.mp3`;
}

/** One at random, with the file that says it. */
export function pickHold(): { text: string; src: string } {
  const i = Math.floor(Math.random() * HOLDS.length);
  return { text: HOLDS[i], src: holdClip(i) };
}

// ── At the record button ─────────────────────────────────────────────
//
// The moment a student scrolls down to "Ready for the challenge?" is
// the moment they are deciding whether to do it today, and it is the
// one moment in the app where a coach would actually say something.
// So he does - once, when the card comes into view, and never again on
// that visit.
//
// Fixed lines, from files, for the same reasons as everything else he
// says: instant, free, and still there when the voice model is not.

export const ROARS: string[] = [
  "Ready for the challenge?",
  "Let's go. Hit record.",
  "You've got this.",
  "Upload your challenge now.",
  "I'm ready for you.",
  "Lights, camera, action.",
  "Let's get those cameras rolling.",
  "You were born for this.",
  "Let me hear you roar.",
  "Show me your true colors.",
];

/** The clip for a line at the record button, by its place in the list. */
export function roarClip(index: number): string {
  return `/coach/roar-${String(index + 1).padStart(2, "0")}.mp3`;
}

/** One at random, with the file that says it. */
export function pickRoar(): { text: string; src: string } {
  const i = Math.floor(Math.random() * ROARS.length);
  return { text: ROARS[i], src: roarClip(i) };
}

// What Coach says when a trophy lands on the stage. Tariq's lines,
// spoken once each into /coach/trophy-NN.mp3 by build-greetings.mjs, so
// a win never waits on a model or costs a call. The reveal picks one at
// random, and never the same one twice in a row.
export const TROPHY_LINES: string[] = [
  "Well done.",
  "This is what winning looks like.",
  "You unlocked a trophy.",
  "Congratulations.",
  "Victory is yours.",
  "That will look good in your collection.",
  "Add this to your trophy case.",
  "That's going to look great on the shelf.",
  "Here come the bragging rights.",
  "Put this on your mantle.",
  "Polished and shining.",
  "That one's a beauty.",
  "Look how good that looks.",
  "I want one of those.",
  "This is now yours.",
  "I'm proud of you.",
  "You did it. Nicely done.",
  "Successful AF.",
  "Now that's what winning looks like.",
  "Add this to your collection.",
  "Your trophy case is growing.",
];

/** The clip for a trophy line, by its place in the list. */
export function trophyLineClip(index: number): string {
  return `/coach/trophy-${String(index + 1).padStart(2, "0")}.mp3`;
}

let lastTrophyLine = -1;

/** One at random, never the one he said last - three trophies won at
 *  once should not all be "Well done." */
export function pickTrophyLine(): { text: string; src: string } {
  let i = Math.floor(Math.random() * TROPHY_LINES.length);
  if (i === lastTrophyLine) i = (i + 1) % TROPHY_LINES.length;
  lastTrophyLine = i;
  return { text: TROPHY_LINES[i], src: trophyLineClip(i) };
}
