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
  /** What to say instead on a wide screen, where the advice is
   *  genuinely different. Telling somebody at a laptop to tap the
   *  portrait button is telling them about a control they do not
   *  have. Its clip is the stop's id with "-wide" on the end. */
  bodyWide?: string;
  /** A film of this being used, where watching beats reading. */
  film?: { src: string; poster: string };
  /** Coach introducing himself, centered, with nothing highlighted -
   *  the whole-app tour opens on one. A section tour does not: the
   *  student already pressed the button that means "show me". */
  intro?: boolean;
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
    intro: true,
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
        id: "sec-challenges-road",
        target: "[data-tour='journey']",
        title: "The road",
        body: "Twenty-four challenges along five stretches of road. You walk it in order, and a stretch opens when the one before it is done.",
        film: JOURNEY,
      },
      {
        id: "sec-challenges-levels",
        target: "[data-tour='journey']",
        title: "Levels, and looking closer",
        body: "The letters are your levels: S, T, O, R, Y. Tap the magnifier to zoom in on where you are, and again to come back out.",
        film: JOURNEY,
      },
      {
        id: "sec-challenges-open-one",
        target: "[data-tour='journey']",
        title: "Opening one",
        body: "Tap any circle to open that challenge. You get the brief, a video of me explaining it, and exactly what passing takes.",
        film: CHALLENGE,
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
      {
        id: "sec-challenges-review",
        route: "/challenges/speaking-baseline",
        title: "What I send back",
        body: "A score, your seven colors, what worked, and the one line to change next time. Every review stays, so you can read any of them again.",
        film: REVIEW,
      },
      {
        id: "sec-challenges-thenandnow",
        route: "/challenges",
        title: "Then and now",
        body: "Ten challenges in, your very first take is set beside your latest one. That is the comparison this whole course is built to give you.",
        film: JOURNEY,
      },
    ],
  },

  skills: {
    id: "skills",
    label: "Show me the lessons",
    stops: [
      {
        id: "sec-skills-dial",
        target: "[data-tour='dial']",
        title: "The dial",
        body: "Use your thumb and drag it around the circle to dial your chosen skills in the seven key color areas. Lift your thumb up and you will jump into that section, where you'll be able to view video lessons, summaries, the related card, and view the other videos in the series in the carousel below.",
        film: SKILLS,
      },
      {
        id: "sec-skills-color",
        target: "[data-tour='dial']",
        title: "Inside a color",
        body: "Every lesson in that color runs down one side, in order, with the one you are on shown large beside it. Eighty-one in total, across the seven.",
        film: SKILLS,
      },
      {
        id: "sec-skills-lesson",
        title: "Inside a lesson",
        body: "One to two minutes, with the key idea appearing beside me as I say it. Underneath you get the key ideas, a written summary, and the full transcript if you want it.",
        film: SKILLS,
      },
      {
        id: "sec-skills-portrait",
        title: "Watching a lesson",
        body:
          "On mobile you can view the lesson in standard landscape, or tap the portrait button to zoom in and make full use of your phone screen - close enough to see facial expressions and hand gestures.",
        bodyWide:
          "View it full screen or in landscape. Lessons have summaries, key ideas and transcripts below each video, as well as a carousel to watch the other skills in the same color series.",
        film: SKILLS,
      },
      {
        id: "sec-skills-back",
        title: "Finding your way back",
        body: "A lesson you opened from a challenge sends you back to that challenge, not out into the library. You never lose your place.",
        film: CHALLENGE,
      },
    ],
  },

  cards: {
    id: "cards",
    label: "Show me the deck",
    stops: [
      {
        id: "sec-cards-pull",
        target: "[data-tour='deck']",
        title: "Pulling a card",
        body: "Press and hold a color, then let go, and you get a card from that color at random.",
        film: DECK,
      },
      {
        id: "sec-cards-move",
        title: "Moving between cards",
        body: "Move your thumb left and right across the cards to choose a different one. The whole color is there, a swipe apart.",
        film: DECK,
      },
      {
        id: "sec-cards-colors",
        title: "Every color",
        body: "The strip along the bottom moves you between the seven colors without going back out. Pick from different colors and you build a different talk.",
        film: DECK,
      },
      {
        id: "sec-cards-spread",
        target: "[data-tour='spread']",
        title: "A full spread",
        body: "Deal a full spread and you get one card of every color, ensuring that your talk lights up with all of the aspects of a highly engaging and dynamic speech.",
        film: DECK,
      },
      {
        id: "sec-cards-shake",
        target: "[data-tour='shuffle']",
        title: "Shake to shuffle",
        body: "Or just shake your phone. It shuffles the deck and pulls you a new one.",
        film: DECK,
      },
      {
        id: "sec-cards-lesson",
        title: "The card is the reminder",
        body: "Every card is a lesson in the course. The card is the reminder; the video is the teaching, and it is one tap away whenever you want the whole thing.",
        film: SKILLS,
      },
    ],
  },

  dashboard: {
    id: "dashboard",
    label: "Show me my dashboard",
    stops: [
      {
        id: "sec-dash-challenges",
        title: "Challenges",
        body: "Here is a snapshot of your challenges: how many you've attempted, how many you've passed, and how many minutes total you've spent practicing speaking.",
        film: DASHBOARD,
      },
      {
        id: "sec-dash-skills",
        title: "Skills",
        body: "Which lessons you have watched, color by color, and how long you have spent on them. Tap the arrow to go straight to the library.",
        film: DASHBOARD,
      },
      {
        id: "sec-dash-spectrum",
        title: "Your spectrum",
        body: "Your speaking uploads are displayed as a spectrum of color. The more colors light up, the more dynamic your speech. You can also see where you started and where you are now, and track your improvement across time.",
        film: DASHBOARD,
      },
      {
        id: "sec-dash-streak",
        title: "Your streak",
        body: "Here you can see how many days in a row you've been practicing your speaking. The more days in a row, the longer your streak. If you miss a day you can buy your streak back with XP.",
        film: DASHBOARD,
      },
      {
        id: "sec-dash-trophies",
        target: "[data-tour='trophies']",
        title: "The trophy case",
        body: "As you complete speaking challenges and display specific abilities, you will be awarded trophies. Collect them all and show us what a winner you are.",
        film: TROPHIES,
      },
      {
        id: "sec-dash-attempts",
        title: "Every take you have sent",
        body: "All of them are kept here with the review each one earned. Open any of them and you get the whole thing back.",
        film: DASHBOARD,
      },
    ],
  },

  community: {
    id: "community",
    label: "Show me the community",
    stops: [
      {
        id: "sec-comm-goal",
        title: "The week's goal",
        body: "One bar that everybody's takes fill together. It is the one board where the whole group is on the same side.",
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
        id: "sec-coach-ask",
        target: "[data-tour='ask']",
        title: "Ask me",
        body: "Press the wave once and start talking. Press it again when you are done, and I will answer out loud from your own record.",
        film: COACH,
      },
      {
        id: "sec-coach-type",
        target: "[data-tour='ask']",
        title: "Or type it",
        body: "If you would rather not speak, type your question instead. You get the same answer either way.",
        film: COACH,
      },
      {
        id: "sec-coach-wait",
        title: "While I think",
        body: "My answer appears in writing the moment it is ready, and my voice follows a little after. Start reading. I will catch you up.",
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
