// The seven color-coded skill categories — master plan §03.
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
  colorName: string;
  blurb: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const categories: Category[] = [
  {
    id: "storytelling",
    name: "Storytelling techniques",
    colorName: "Yellow",
    blurb: "Relive experiences instead of reporting them — scenes, morals, and stories that sell.",
    bgClass: "bg-storytelling",
    textClass: "text-storytelling",
    borderClass: "border-storytelling",
  },
  {
    id: "figurative",
    name: "Figurative language",
    colorName: "Orange",
    blurb: "Metaphor, simile, hyperbole, analogy — language that paints instead of describes.",
    bgClass: "bg-figurative",
    textClass: "text-figurative",
    borderClass: "border-figurative",
  },
  {
    id: "acting",
    name: "Acting skills for speakers",
    colorName: "Red",
    blurb: "Voice, character, emotion, and scene work — deliver the experience, don't just say it.",
    bgClass: "bg-acting",
    textClass: "text-acting",
    borderClass: "border-acting",
  },
  {
    id: "structure",
    name: "Structure & framing",
    colorName: "Purple",
    blurb: "Openings, frameworks, open loops, and payoffs — the architecture of a talk.",
    bgClass: "bg-structure",
    textClass: "text-structure",
    borderClass: "border-structure",
  },
  {
    id: "mindset",
    name: "Speaker's mindset & psychology",
    colorName: "Green",
    blurb: "Fear, confidence, and conviction — the inner game that everything else stands on.",
    bgClass: "bg-mindset",
    textClass: "text-mindset",
    borderClass: "border-mindset",
  },
  {
    id: "body-language",
    name: "Body language & physical expression",
    colorName: "Blue",
    blurb: "Gestures, posture, movement — expressing visually what you say verbally.",
    bgClass: "bg-body-language",
    textClass: "text-body-language",
    borderClass: "border-body-language",
  },
  {
    id: "advanced",
    name: "Advanced tips & tricks",
    colorName: "Turquoise",
    blurb: "Slides, mic drops, going live, memorization — the professional's toolkit.",
    bgClass: "bg-advanced",
    textClass: "text-advanced",
    borderClass: "border-advanced",
  },
];

export const categoryById = new Map(categories.map((c) => [c.id, c]));
