// The eight color-coded skill categories - master plan §03. (Seven
// until Voice was split out of Act: the voice lessons were half of what
// Act meant, and a colour that means two things teaches neither.)
// Category colors are defined once in globals.css; the class strings here
// must stay literal so Tailwind's scanner picks them up.

export type CategoryId =
  | "storytelling"
  | "figurative"
  | "acting"
  | "voice"
  | "structure"
  | "mindset"
  | "body-language"
  | "advanced";

export interface Category {
  id: CategoryId;
  name: string;
  /**
   * The deck's short code - what a card wears in its corner, the way a
   * playing card wears its rank. A full section name doesn't fit a
   * corner and reads as a label; STORY and MIND read as the deck's own
   * shorthand, which is what a student ends up calling them anyway.
   */
  code: string;
  /** Kept for the callers that ask for it. It is the same string as
   *  `name` now: the two had drifted, so a dial said "Acting skills"
   *  while the page it opened said "Acting skills for speakers", and a
   *  student had to work out they were the same thing. One name per
   *  colour, short enough to read anywhere it lands. */
  short: string;
  /** The familiar term under the name - "Storytelling" under Tell. */
  subtitle: string;
  colorName: string;
  blurb: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const categories: Category[] = [
  // In the order of the wheel - yellow, orange, red-orange, crimson,
  // magenta, blue, cyan, green, and round to yellow again - so the dial
  // and every strip of colours runs as one smooth spectrum.
  {
    id: "storytelling",
    name: "Tell",
    subtitle: "Storytelling",
    short: "Tell",
    code: "TELL",
    colorName: "Neon yellow",
    blurb: "Relive experiences instead of reporting them - scenes, morals, and stories that sell.",
    bgClass: "bg-storytelling",
    textClass: "text-storytelling",
    borderClass: "border-storytelling",
  },
  {
    id: "figurative",
    name: "Paint",
    subtitle: "Figurative & Sensory",
    short: "Paint",
    code: "PAINT",
    colorName: "Bright orange",
    blurb: "Metaphor, simile, hyperbole, analogy - language that paints instead of describes.",
    bgClass: "bg-figurative",
    textClass: "text-figurative",
    borderClass: "border-figurative",
  },
  {
    id: "acting",
    name: "Act",
    subtitle: "Performance",
    short: "Act",
    code: "ACT",
    colorName: "Bright red",
    blurb: "Imagination, character, emotion and scene work - deliver the experience, don't just say it.",
    bgClass: "bg-acting",
    textClass: "text-acting",
    borderClass: "border-acting",
  },
  {
    id: "advanced",
    name: "Pro",
    subtitle: "Advanced Skills",
    short: "Pro",
    code: "PRO",
    colorName: "Deep crimson",
    blurb: "Slides, mic drops, going live, memorization - the professional's toolkit.",
    bgClass: "bg-advanced",
    textClass: "text-advanced",
    borderClass: "border-advanced",
  },
  {
    id: "structure",
    name: "Frame",
    subtitle: "Talk Structure",
    short: "Frame",
    code: "FRAME",
    colorName: "Magenta",
    blurb: "Openings, frameworks, open loops, and payoffs - the architecture of a talk.",
    bgClass: "bg-structure",
    textClass: "text-structure",
    borderClass: "border-structure",
  },
  {
    id: "voice",
    name: "Voice",
    subtitle: "Vocal Delivery",
    short: "Voice",
    code: "VOICE",
    colorName: "Royal blue",
    blurb: "Pace, pitch, pause and projection - no fillers, and a message that plays like a melody.",
    bgClass: "bg-voice",
    textClass: "text-voice",
    borderClass: "border-voice",
  },
  {
    id: "body-language",
    name: "Body",
    subtitle: "Posture & Stance",
    short: "Body",
    code: "BODY",
    colorName: "Bright cyan",
    blurb: "Gestures, posture, movement - expressing visually what you say verbally.",
    bgClass: "bg-body-language",
    textClass: "text-body-language",
    borderClass: "border-body-language",
  },
  {
    id: "mindset",
    name: "Presence",
    subtitle: "Confidence on Camera",
    short: "Presence",
    code: "PRESENCE",
    colorName: "Neon green",
    blurb: "Fear, nerves, and conviction - the inner game that everything else stands on, and the presence it gives you.",
    bgClass: "bg-mindset",
    textClass: "text-mindset",
    borderClass: "border-mindset",
  },
];

export const categoryById = new Map(categories.map((c) => [c.id, c]));
