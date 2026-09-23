// Everything Coach says on a tour, written down.
//
// Two kinds of tour come out of this file. The **main tour** walks the
// whole app once, and the **section tours** are short - three to five
// stops - and live inside the part of the app they are about, so a
// student who lands on the cards and doesn't know what a card is for
// can ask right there rather than restarting the whole thing.
//
// Three rules the scripts follow.
//
// The line on screen is the line that is spoken. Not a summary of it,
// not a longer written version: the same words, so a student reading
// and a student listening are being told the same thing, and there is
// only ever one copy to keep true.
//
// Every line is fixed. A tour that says something different on the
// second run is not orientation.
//
// And every line is spoken from a file built once
// (scripts/build-tour-voice.mjs), keyed by the stop's id. That costs
// nothing per student, starts instantly, and still works on a day when
// the voice model's balance is empty - which is the day a new cohort
// is most likely to arrive.

export interface TourStop {
  /** Stable, and the name of the clip that speaks it. Renaming one
   *  means rebuilding its audio. */
  id: string;
  /** What to ring - the first visible match wins. No target dims the
   *  screen and lets the card speak. */
  target?: string;
  /** Go here before showing this stop. */
  route?: string;
  title: string;
  /** Shown on the card and spoken aloud - the same words. */
  body: string;
  /** A film of this being used, where watching beats reading. */
  film?: { src: string; poster: string };
}

const JOURNEY = { src: "/film/tour-journey.mp4", poster: "/film/tour-journey.jpg" };
const SKILLS = { src: "/film/tour-skills.mp4", poster: "/film/tour-skills.jpg" };
const DASHBOARD = { src: "/film/tour-dashboard.mp4", poster: "/film/tour-dashboard.jpg" };
const DECK = { src: "/film/tour-deck.mp4", poster: "/film/tour-deck.jpg" };
const REVIEW = { src: "/film/record-to-review.mp4", poster: "/film/record-to-review.jpg" };
const TODAY = { src: "/film/tour-today.mp4", poster: "/film/tour-today.jpg" };
const CHALLENGE = { src: "/film/tour-challenge.mp4", poster: "/film/tour-challenge.jpg" };
const COACH = { src: "/film/tour-coach.mp4", poster: "/film/tour-coach.jpg" };
const COMMUNITY = { src: "/film/tour-community.mp4", poster: "/film/tour-community.jpg" };
const TROPHIES = { src: "/film/tour-trophies.mp4", poster: "/film/tour-trophies.jpg" };
const JUMP = { src: "/film/tour-jump.mp4", poster: "/film/tour-jump.jpg" };

/** The clip that speaks a stop. */
export function stopAudio(id: string): string {
  return `/coach/tour/${id}.mp3`;
}

// ── The main tour ────────────────────────────────────────────────────

export const mainTour: TourStop[] = [
  {
    id: "open",
    route: "/",
    title: "Welcome to Speak Better",
    body: "Hey there, welcome to Speak Better. I'm going to show you around the place. You can call me Coach. Tariq delivers the lessons; I review your uploads and give you feedback.",
  },
  {
    id: "today",
    target: "[data-tour='today']",
    route: "/",
    title: "Today",
    body: "Start here every day. It names one thing to do, and only one, and it keeps your streak. Do that one thing and the road takes care of itself.",
    film: TODAY,
  },
  {
    id: "challenges",
    target: "[data-tour='challenges']",
    route: "/challenges",
    title: "The challenges",
    body: "This is the work. Twenty-four challenges, in five phases, and every one of them ends with you on camera.",
  },
  {
    id: "journey",
    target: "[data-tour='journey']",
    route: "/challenges",
    title: "The STORY road",
    body: "S, T, O, R, Y. Five stretches of road. Tap any circle to open its challenge, and tap the magnifier to look closer at where you are.",
    film: JOURNEY,
  },
  {
    id: "record",
    target: "[data-tour='record']",
    route: "/challenges/speaking-baseline",
    title: "Uploading a take",
    body: "Every challenge ends the same way. Press record and speak to the camera, or upload a video you have already filmed. Either way it comes straight to me.",
    film: CHALLENGE,
  },
  {
    id: "review",
    route: "/challenges/speaking-baseline",
    title: "What comes back",
    body: "I watch the whole thing. Then you get a score, your seven colors, what worked, and the one thing to change next time, spoken in my voice with the words on screen.",
    film: REVIEW,
  },
  {
    id: "skills",
    target: "[data-tour='skills']",
    route: "/skills",
    title: "The lessons",
    body: "Eighty-one lessons live here, one to two minutes each, sorted into the seven colors of speaking. Dip in. Don't binge.",
    film: SKILLS,
  },
  {
    id: "dial",
    target: "[data-tour='dial']",
    route: "/skills",
    title: "The dial",
    body: "Drag your thumb around the ring to hear each color named, then tap one to open its lessons.",
    film: SKILLS,
  },
  {
    id: "deck",
    target: "[data-tour='deck']",
    route: "/skills/cards",
    title: "The card deck",
    body: "The same library, as cards. Press a color to pull one, deal a full spread for one card of every color, or shake your phone to shuffle.",
    film: DECK,
  },
  {
    id: "coach",
    target: "[data-tour='coach']",
    title: "Me",
    body: "Tap my face anywhere in the app. Ask me how you are developing, what to work on, or what I noticed last time, and read back every review I have written you.",
    film: COACH,
  },
  {
    id: "dashboard",
    target: "[data-tour='dashboard']",
    route: "/profile",
    title: "Your dashboard",
    body: "Everything you have done is here. Challenges passed, lessons watched, minutes spent speaking, your spectrum and your streak.",
    film: DASHBOARD,
  },
  {
    id: "trophies",
    target: "[data-tour='trophies']",
    route: "/profile",
    title: "The trophy case",
    body: "Forty-odd trophies, each one earned by doing something specific. The empty stands are there to tell you what is still out on the road.",
    film: TROPHIES,
  },
  {
    id: "community",
    target: "[data-tour='community']",
    route: "/",
    title: "The others on the road",
    body: "Who else is on your challenge right now, this week's boards, and everybody's before and afters. You are not doing this alone.",
    film: COMMUNITY,
  },
  {
    id: "jump",
    target: "[data-tour='jump']",
    route: "/",
    title: "One last thing",
    body: "Can't find something? This finds any lesson, challenge or page by name. That is the whole app. Go and record something.",
    film: JUMP,
  },
];

// ── The section tours ────────────────────────────────────────────────

export type SectionId = "challenges" | "skills" | "cards" | "dashboard" | "community" | "coach";

export interface SectionTour {
  id: SectionId;
  /** The button that offers it, and the heading on its first card. */
  label: string;
  stops: TourStop[];
}

export const sectionTours: Record<SectionId, SectionTour> = {
  challenges: {
    id: "challenges",
    label: "Show me the challenges",
    stops: [
      {
        id: "sec-challenges-open",
        title: "The challenges",
        body: "This is where the work happens. Let me show you how a challenge goes.",
        film: CHALLENGE,
      },
      {
        id: "sec-challenges-road",
        target: "[data-tour='journey']",
        title: "The road",
        body: "Twenty-four challenges along five stretches of road. You walk it in order, and a stretch opens when the one before it is done.",
        film: JOURNEY,
      },
      {
        id: "sec-challenges-open-one",
        target: "[data-tour='journey']",
        title: "Opening one",
        body: "Tap any circle to open that challenge. You get the brief, a video of me explaining it, and exactly what passing takes.",
      },
      {
        id: "sec-challenges-warm",
        route: "/challenges/speaking-baseline",
        title: "Warm up first",
        body: "Under every brief are the lessons that challenge leans on. Watch those first and the take goes better. That is the whole method.",
        film: CHALLENGE,
      },
      {
        id: "sec-challenges-record",
        target: "[data-tour='record']",
        route: "/challenges/speaking-baseline",
        title: "Record, or upload",
        body: "Press record and speak to the camera with the clock running, or upload something you filmed earlier. Then redo it, or send it to me.",
        film: REVIEW,
      },
    ],
  },

  skills: {
    id: "skills",
    label: "Show me the lessons",
    stops: [
      {
        id: "sec-skills-open",
        title: "The lessons",
        body: "Eighty-one lessons, in seven colors. Here is how to find your way around them.",
        film: SKILLS,
      },
      {
        id: "sec-skills-dial",
        target: "[data-tour='dial']",
        title: "The dial",
        body: "Each point on the ring is one color of speaking. Drag your thumb around it to hear them named, then tap one to open its lessons.",
        film: SKILLS,
      },
      {
        id: "sec-skills-lesson",
        title: "Inside a lesson",
        body: "Every lesson runs one to two minutes, with the key idea appearing beside me as I say it. Underneath you get the key ideas, a written summary, and the full transcript if you want it.",
        film: SKILLS,
      },
      {
        id: "sec-skills-portrait",
        title: "Watching on a phone",
        body: "Tap the zoom button on any video to fill your screen in portrait. This is a course about how you move, so you need to be able to see it.",
        film: SKILLS,
      },
    ],
  },

  cards: {
    id: "cards",
    label: "Show me the deck",
    stops: [
      {
        id: "sec-cards-open",
        title: "The deck",
        body: "Same library, different shape. Seventy-nine cards, one per skill, for when you want the idea without the video.",
        film: DECK,
      },
      {
        id: "sec-cards-pull",
        target: "[data-tour='deck']",
        title: "Pulling a card",
        body: "Press and hold a color, then let go, and you get a card from that color at random.",
        film: DECK,
      },
      {
        id: "sec-cards-spread",
        target: "[data-tour='spread']",
        title: "A full spread",
        body: "Deal a full spread and you get one card of every color at once. That is the ingredients for a talk that moves.",
        film: DECK,
      },
      {
        id: "sec-cards-shake",
        target: "[data-tour='shuffle']",
        title: "Shake to shuffle",
        body: "Or just shake your phone. Shuffles the deck and pulls you a new one.",
        film: DECK,
      },
    ],
  },

  dashboard: {
    id: "dashboard",
    label: "Show me my dashboard",
    stops: [
      {
        id: "sec-dash-open",
        title: "Your dashboard",
        body: "This is the record of everything you have done. Let me show you what is in it.",
        film: DASHBOARD,
      },
      {
        id: "sec-dash-challenges",
        title: "Challenges",
        body: "How many you have attempted, how many you have passed, and the minutes you have spent speaking to a lens. Every one of those minutes counts.",
        film: DASHBOARD,
      },
      {
        id: "sec-dash-spectrum",
        title: "Your spectrum",
        body: "Your first take against your latest, both in color. The distance between those two lines is what this whole course is for.",
        film: DASHBOARD,
      },
      {
        id: "sec-dash-streak",
        title: "Your streak",
        body: "Practice on any day and it counts. Miss one and a freeze covers it. Miss more and you can buy the streak back with XP while it is still fresh.",
        film: DASHBOARD,
      },
      {
        id: "sec-dash-trophies",
        target: "[data-tour='trophies']",
        title: "The trophy case",
        body: "One trophy at a time, under the light. The empty stands tell you what is still out there to win.",
        film: TROPHIES,
      },
    ],
  },

  community: {
    id: "community",
    label: "Show me the community",
    stops: [
      {
        id: "sec-comm-open",
        title: "The community",
        body: "Everybody else walking the same road. Here is what you can see.",
        film: COMMUNITY,
      },
      {
        id: "sec-comm-boards",
        target: "[data-tour='boards']",
        title: "This week's boards",
        body: "Three boards, not one. Colors gained, takes recorded, and the biggest jump in score. You can lead one of them in your first week.",
        film: COMMUNITY,
      },
      {
        id: "sec-comm-before",
        target: "[data-tour='feed']",
        title: "Before and after",
        body: "Everybody's first take against their latest. Nobody's video is ever shown, only the scores and the colors. That is the proof this works.",
        film: COMMUNITY,
      },
      {
        id: "sec-comm-cheer",
        target: "[data-tour='feed']",
        title: "Cheering",
        body: "One tap to cheer somebody on. No comments, nothing to moderate. Just a hand on the shoulder.",
        film: COMMUNITY,
      },
    ],
  },

  coach: {
    id: "coach",
    label: "How to talk to me",
    stops: [
      {
        id: "sec-coach-open",
        title: "Talking to me",
        body: "I am here whenever you want me. Here is how this works.",
        film: COACH,
      },
      {
        id: "sec-coach-ask",
        target: "[data-tour='ask']",
        title: "Ask me",
        body: "Press the button once and start talking. Press it again when you are done, and I will answer out loud from your own record.",
        film: COACH,
      },
      {
        id: "sec-coach-type",
        target: "[data-tour='ask']",
        title: "Or type it",
        body: "If you would rather not speak, type your question instead. Same answer either way.",
        film: COACH,
      },
      {
        id: "sec-coach-reviews",
        target: "[data-tour='reviews']",
        title: "Every review I have written",
        body: "All of them are kept underneath, newest first. Open any one and you get the whole review back, spoken and written.",
        film: COACH,
      },
    ],
  },
};

/** Every line that needs a clip - what the build script walks. */
export function allTourStops(): TourStop[] {
  return [...mainTour, ...Object.values(sectionTours).flatMap((t) => t.stops)];
}
