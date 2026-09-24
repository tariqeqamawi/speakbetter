// The seven color-coded skill categories - master plan §03.
// Category colors are defined once in globals.css; the class strings here
// must stay literal so Tailwind's scanner picks them up.

export type CategoryId =
  | "storytelling"
  | "figurative"
  | "acting"
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
  colorName: string;
  blurb: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const categories: Category[] = [
  {
    id: "storytelling",
    name: "Storytelling",
    short: "Storytelling",
    code: "STORY",
    colorName: "Neon yellow",
    blurb: "Relive experiences instead of reporting them - scenes, morals, and stories that sell.",
    bgClass: "bg-storytelling",
    textClass: "text-storytelling",
    borderClass: "border-storytelling",
  },
  {
    id: "figurative",
    name: "Figurative & Sensory",
    short: "Figurative & Sensory",
    code: "IMAGE",
    colorName: "Bright orange",
    blurb: "Metaphor, simile, hyperbole, analogy - language that paints instead of describes.",
    bgClass: "bg-figurative",
    textClass: "text-figurative",
    borderClass: "border-figurative",
  },
  {
    id: "acting",
    name: "Acting",
    short: "Acting",
    code: "ACT",
    colorName: "Bright red",
    blurb: "Voice, character, emotion, and scene work - deliver the experience, don't just say it.",
    bgClass: "bg-acting",
    textClass: "text-acting",
    borderClass: "border-acting",
  },
  {
    id: "structure",
    name: "Structure",
    short: "Structure",
    code: "FRAME",
    colorName: "Magenta",
    blurb: "Openings, frameworks, open loops, and payoffs - the architecture of a talk.",
    bgClass: "bg-structure",
    textClass: "text-structure",
    borderClass: "border-structure",
  },
  {
    id: "mindset",
    name: "Confidence",
    short: "Confidence",
    code: "MIND",
    colorName: "Neon green",
    blurb: "Fear, confidence, and conviction - the inner game that everything else stands on.",
    bgClass: "bg-mindset",
    textClass: "text-mindset",
    borderClass: "border-mindset",
  },
  {
    id: "body-language",
    name: "Body & Physical",
    short: "Body & Physical",
    code: "BODY",
    colorName: "Bright cyan",
    blurb: "Gestures, posture, movement - expressing visually what you say verbally.",
    bgClass: "bg-body-language",
    textClass: "text-body-language",
    borderClass: "border-body-language",
  },
  {
    id: "advanced",
    name: "Advanced",
    short: "Advanced",
    code: "PRO",
    colorName: "Deep crimson",
    blurb: "Slides, mic drops, going live, memorization - the professional's toolkit.",
    bgClass: "bg-advanced",
    textClass: "text-advanced",
    borderClass: "border-advanced",
  },
];

export const categoryById = new Map(categories.map((c) => [c.id, c]));
