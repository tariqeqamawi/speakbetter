// What Coach says the first time a student arrives.
//
// This is the only moment in the app where somebody has paid, opened
// it, and has no idea what they have bought yet. A heading and two
// radio buttons is a form; the lion saying it out loud is a welcome -
// and it sets, in fifteen seconds, that the coach is a character who
// talks to you rather than a scoring engine with a mane.
//
// It is spoken from a file, like the greetings: one line that never
// changes, made once, so the welcome is instant, costs nothing per
// student, and still works on a day when the text-to-speech quota is
// spent. A lion who is silent at hello is the worst possible first
// impression, and this is the one hello that cannot be retried.
//
// Rendered by scripts/build-welcome.mjs to public/coach/welcome.mp3.

export const WELCOME_SPEECH =
  "Welcome to Speak Better. You are about to start a most exciting adventure to becoming the speaker, orator, narrator and storyteller you have always wanted to be. Unleash your true colors and roar on screen and stage. To begin, choose your level. Each level changes the type of feedback you receive, and how strictly you are marked. You can change this at any time.";

/** Where the clip lives, once it has been made. */
export const WELCOME_AUDIO = "/coach/welcome.mp3";

// And the second question, which is the one that actually matters.
//
// The course's whole retention layer asks people to keep going; this
// is the reason they gave for wanting to, in their own words, and it
// sits at the top of their dashboard from then on. Asked by a heading
// it is a form field. Asked out loud, by the coach, on the way in, it
// is somebody wanting to know - which is the difference between an
// answer worth re-reading in week five and "get better at speaking".

export const INTENTION_SPEECH =
  "Nearly there. But first, tell me: why are you really here? What has you doing this course? What is the fear you are overcoming, or the outcome you are aspiring toward? Tell me below, and this will be your anchor as we move through this journey together.";

/** Where that clip lives. */
export const INTENTION_AUDIO = "/coach/intention.mp3";

// And what Coach says to somebody who has not bought yet.
//
// Everything else on the landing page is a claim ABOUT him - that an
// AI coach watches your videos and gives real feedback - and a claim
// about a thing is always weaker than the thing. Him saying it, in his
// own voice, settles in ten seconds what a page of copy argues for.
//
// It names the one doubt a visitor actually has at that point, which
// is not "does it work" but "will it be any good, or is it a gimmick".

export const LANDING_PITCH =
  "Hello. I'm Coach. Here's how this works: Tariq teaches you, and then you record yourself doing it. I watch every take you send me - your gestures, your eyes, your voice, the story you told - and I tell you what landed, what didn't, and the one thing to change next time. Not a score out of ten from a machine. A real review, in your ear, on every single take. That's the part you can't get from watching videos, and it's the part that makes you better.";

export const LANDING_PITCH_AUDIO = "/coach/landing-pitch.mp3";
