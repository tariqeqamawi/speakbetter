// The forty-seven trophies, as prompts.
//
// WHY THIS FILE EXISTS. The trophies are rendered, not drawn, and a
// render is only reproducible if the words that made it are kept. One
// trophy re-made from a remembered prompt will not match the other
// forty-six, and a trophy case whose pieces do not belong to one set
// is worse than a case of flat icons - the mismatch is the thing the
// eye goes to. So the prompt lives here, in the repo, beside the code
// that turns the render into the asset.
//
// THE SHAPE IS FIXED. Every one of them is the same object: a sculpted
// figure on a SHORT chrome post, on a square brushed-gunmetal plinth
// with a thin glowing line along its base.
//
// The post used to be a tall slender stem, and the first full set came
// back looking like forty-seven table lamps: the object you had won
// was a small thing on the end of a long pole, and most of the picture
// was pole. The figure is the award - it is what says which one this
// is and what it was for - so it gets the frame, and the post is just
// enough to lift it off the plinth. That was settled by
// rendering one (the amber flame) and standing it in the trophy room
// beside the drawn versions - see /prototype/spotlight. The shared
// stem and plinth are what make forty-seven of them read as one
// collection won by one person rather than forty-seven separate prizes.
//
// THE MATERIAL IS THE RANK. Forty-seven trophies all in coloured glass
// were one collection, and also one note held for a very long time -
// nothing in the case said which of them were hard to get. So the
// material carries that, and it is the only thing it carries:
//
//   glass     the twenty-four challenges. The everyday ones.
//   ceramic   the ones about how you speak and how you feel doing it.
//   chrome    the ones earned by turning up again and again.
//   gold      a top score: 90 or more on a challenge. The glass trophy
//             is for passing it; its gold twin is for mastering it,
//             which is a reason to record it again.
//   spectrum  finishing a phase of the road - the five S.T.O.R.Y.
//             letters in blown glass with all seven colours swirling
//             through them, because a phase is every skill working
//             together. (They were neon tubes for an afternoon; solid
//             glass reads as a prize, a sign reads as a shop front.)
//   obsidian  the rare ones, and the whole road at the end of it.
//
// Four of the five still take the colour of the skill they are for -
// the glaze, the glow in the stone, the glass itself - so the case
// keeps doubling as a picture of what somebody is good at. Chrome and
// gold are the two that do not, which is the point of them: a trophy
// that is only about the doing, not about which colour it was in.
//
// A student who has never been told any of this reads it at a glance,
// because everybody already knows what those materials are worth.
// That is the whole reason for using them rather than, say, five
// sizes of plinth.
//
// SHOT ON PURE BLACK, THEN CUT BY THE MODEL. The prompt below makes the
// trophy on black; that render is then passed back to the same model
// as a reference with background: "transparent" and "keep this exact
// trophy identical", which gives the alpha channel the app ships.
// Cutting it locally from the render's brightness was tried first and
// deleted every dark part of the trophy along with the backdrop - see
// build-trophies.mjs.

// The colours are the app's own seven. A trophy carries the colour of
// the skill it is awarded for, so the case doubles as a picture of
// what somebody is good at.

// Matched to the Speaking Spectrum (globals.css --color-*), not to what
// sounds nice. "Warm golden yellow" and "emerald" rendered amber and
// dark green, so storytelling collided with figurative and gold, and
// confidence looked like a different app. The words below are what
// came out on-spectrum; the set was hue-corrected once to match.
export const COLORS = {
  storytelling: "bright neon lemon yellow (#ffd60a), not gold, not amber",
  figurative: "bright orange (#ff9500)",
  acting: "vivid scarlet red (#ff4a2b)",
  structure: "vivid magenta leaning purple (#f53de0), not pink",
  mindset: "bright neon green (#1fe890), not emerald",
  "body-language": "bright cyan (#22d9f5)",
  advanced: "deep crimson (#d11149)",
};

/** How each material is described to the renderer. */
export const MATERIALS = {
  glass: (color) => `a sculpted ${COLORS[color]} art-glass figure of`,
  ceramic: (color) => `a glazed ${COLORS[color]} ceramic figure of`,
  chrome: () => "a mirror-polished chrome figure of",
  gold: () => "a polished solid gold figure of",
  obsidian: () => "a carved black obsidian figure of",
  spectrum: () => "solid hand-blown art glass, like Murano glass, with swirling ribbons of all seven neon spectrum colours flowing through it, shaped as",
};

const FINISH = {
  glass: "polished and translucent with deep internal highlights",
  ceramic: "a soft satin glaze with gentle highlights, opaque, faint crazing in the surface",
  chrome: "liquid mirror steel, reflecting the studio lights, no colour of its own",
  gold: "warm yellow metal, mirror-polished, with bright specular highlights",
  obsidian: "deep glossy black volcanic stone, with a thin line of colour caught along its polished edges",
  spectrum: "thick, polished and translucent, glowing gently from within, bright glossy highlights on its surface",
};

/** The one sentence every trophy is made of. */
export function promptFor(subject, color, material = "glass") {
  return [
    `A small award trophy photographed in a studio: ${MATERIALS[material](color)} ${subject},`,
    `${FINISH[material]}, large and bold, filling most of the frame,`,
    "raised on a SHORT thick polished chrome post - no more than a fifth of the height of the figure above it -",
    "on a square brushed gunmetal plinth with a thin glowing neon line along its base.",
    "Straight-on product photograph, the trophy centred and filling the frame,",
    "dramatic warm-white key light from above left, soft rim light, high detail.",
    "Pure solid black background, no floor, no reflection, no shadow cast on anything, no text, no lettering, no logo.",
  ].join(" ");
}

// Subjects are described as OBJECTS, never as scenes or actions: "a
// coiled tongue twisted into a knot" renders; "somebody saying a
// tongue twister" renders a person, and a person is not a trophy.

export const TROPHIES = [
  // ── The eighteen awards (data/badges.ts) ──────────────────────────
  { id: "first-upload", color: "acting", subject: "a film clapperboard, open", material: "chrome" },
  { id: "five-uploads", color: "acting", subject: "a stack of five film reels", material: "chrome" },
  { id: "ten-uploads", color: "mindset", subject: "a rising staircase of ten steps", material: "chrome" },
  { id: "practicing-machine", color: "body-language", subject: "a pair of interlocking gear wheels", material: "chrome" },
  { id: "first-pass", color: "mindset", subject: "a bold check mark inside a ring", material: "ceramic" },
  { id: "full-spectrum", color: "structure", subject: "a fanned arc of seven upright blades, like a rainbow stood on end", material: "obsidian" },
  { id: "streak-3", color: "figurative", subject: "a leaping flame", material: "ceramic" },
  { id: "streak-5", color: "figurative", subject: "an open hand, palm forward, fingers spread", material: "ceramic" },
  { id: "streak-7", color: "figurative", subject: "a lightning bolt", material: "obsidian" },
  { id: "ten-minutes", color: "acting", subject: "an hourglass", material: "chrome" },
  { id: "handy", color: "body-language", subject: "two open hands framing an empty space between them", material: "ceramic" },
  { id: "i-see-you", color: "body-language", subject: "a single open eye", material: "ceramic" },
  { id: "storyteller", color: "storytelling", subject: "an open book with its pages curling upward", material: "ceramic" },
  { id: "oscar", color: "acting", subject: "a pair of theatre masks, comedy and tragedy, side by side", material: "obsidian" },
  { id: "twisted", color: "storytelling", subject: "a twisted rope tied in a single knot", material: "ceramic" },
  { id: "sensational", color: "figurative", subject: "a five-pointed star with a long tail, like a shooting star", material: "ceramic" },
  { id: "composer", color: "acting", subject: "a treble clef", material: "ceramic" },
  { id: "journey-complete", color: "storytelling", subject: "a laurel wreath encircling the five letters S T O R Y", material: "obsidian" },

  // ── The five phases of the road ───────────────────────────────────
  { id: "phase-S", color: "mindset", subject: "the capital letter S, sculpted", material: "spectrum" },
  { id: "phase-T", color: "body-language", subject: "the capital letter T, sculpted", material: "spectrum" },
  { id: "phase-O", color: "storytelling", subject: "the capital letter O, sculpted", material: "spectrum" },
  { id: "phase-R", color: "acting", subject: "the capital letter R, sculpted", material: "spectrum" },
  { id: "phase-Y", color: "structure", subject: "the capital letter Y, sculpted", material: "spectrum" },

  // ── One for every challenge (data/challenges.ts) ──────────────────
  { id: "challenge-speaking-baseline", color: "mindset", subject: "an old-fashioned box camera on a short tripod" },
  { id: "challenge-story-without-help", color: "storytelling", subject: "a circus trapeze: a solid bar swinging from two ropes that meet at a ring at the top" },
  { id: "challenge-mindset-toolbox", color: "mindset", subject: "a small toolbox with its lid open" },
  { id: "challenge-no-filler-words", color: "acting", subject: "a speech bubble with a clean diagonal line struck through it" },
  { id: "challenge-avoid-boring-words", color: "figurative", subject: "a friendly Tyrannosaurus rex, head and shoulders, wearing small round gold reading glasses" },
  { id: "challenge-voice-melody", color: "acting", subject: "a vinyl record standing on its edge" },
  { id: "challenge-tongue-twisters", color: "acting", subject: "a stylised head in side profile with a long silver tongue unfurling from its mouth, curling at the tip", material: "chrome" },
  { id: "challenge-beatbox-rhythm", color: "mindset", subject: "a pair of small drums" },
  { id: "challenge-create-storybook", color: "storytelling", subject: "a closed book with a ribbon bookmark" },
  { id: "challenge-scene-with-sound", color: "acting", subject: "a bell with rings of sound spreading from it" },
  { id: "challenge-describe-vividly", color: "figurative", subject: "a faceted gemstone" },
  { id: "challenge-moment-from-your-day", color: "storytelling", subject: "a pocket watch with its lid open" },
  { id: "challenge-high-stakes-moment", color: "acting", subject: "a theatre chair tipped forward onto its two front legs, as if someone is on the very edge of the seat" },
  { id: "challenge-set-and-scene", color: "storytelling", subject: "a miniature theatre stage with its curtains drawn back" },
  { id: "challenge-twist-third-person", color: "storytelling", subject: "a director's megaphone, cone pointing up and to the side" },
  { id: "challenge-foreshadowing", color: "storytelling", subject: "an ornate antique flintlock pistol, like a nineteenth-century stage prop, standing upright on its grip" },
  { id: "challenge-three-emotions", color: "acting", subject: "a small harp with its strings drawn taut" },
  { id: "challenge-someone-elses-story", color: "storytelling", subject: "two overlapping speech bubbles" },
  { id: "challenge-multiple-characters", color: "acting", subject: "three theatre masks in a row, each with a different expression" },
  { id: "challenge-story-youve-healed", color: "mindset", subject: "a heart with a healed seam running through it" },
  { id: "challenge-explain-with-analogies", color: "figurative", subject: "two linked rings" },
  { id: "challenge-podcast-introduction", color: "structure", subject: "a pair of studio headphones" },
  { id: "challenge-thirty-second-pitch", color: "structure", subject: "a stopwatch" },
  { id: "challenge-mic-drop", color: "acting", subject: "a microphone falling, tilted head-down" },
];

// ── The gold twins ───────────────────────────────────────────────────
// Every scored challenge has a gold edition, won at 90 or more. They are
// not prompted from scratch: each is its own trophy passed back to the
// model with "keep this exact trophy, change only the material to
// polished solid gold", so the pair read as one prize in two grades.
// The one challenge with no score (the mindset toolbox, passed by
// watching) has none.
export const GOLD = TROPHIES.filter(
  (t) => t.id.startsWith("challenge-") && t.id !== "challenge-mindset-toolbox",
).map((t) => ({ ...t, id: `${t.id}-gold`, material: "gold" }));

export const ALL_TROPHIES = [...TROPHIES, ...GOLD];
