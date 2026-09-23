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
