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
// THE SHAPE IS FIXED AND ONLY THE SUBJECT CHANGES. Every one of them
// is the same object: a sculpted glass figure on a slender polished
// chrome stem, on a square brushed-gunmetal plinth with a thin glowing
// line along its base. That was settled by rendering one (the amber
// flame) and standing it in the trophy room beside the drawn versions
// - see /prototype/spotlight. What varies is the figure on top and the
// colour of the glass, so forty-seven of them read as one collection
// won by one person rather than forty-seven separate prizes.
//
// SHOT ON PURE BLACK, on purpose. Background removal through the API
// was rate-limited, and cutting the alpha locally from a curve-crushed
// luma turns out to be better anyway: free, instant, repeatable, and
// the glow fades out naturally instead of being clipped at an edge.
// See build-trophies.mjs.
//
// The colours are the app's own seven. A trophy carries the colour of
// the skill it is awarded for, so the case doubles as a picture of
// what somebody is good at.

export const COLORS = {
  storytelling: "warm golden yellow",
  figurative: "bright amber orange",
  acting: "vivid scarlet red",
  structure: "vivid magenta pink",
  mindset: "luminous emerald green",
  "body-language": "bright cyan blue",
  advanced: "deep crimson",
};

/** The one sentence every trophy is made of. */
export function promptFor(subject, color) {
  return [
    `A small award trophy photographed in a studio: a sculpted ${COLORS[color]} art-glass figure of ${subject},`,
    "polished and translucent with deep internal highlights, mounted on a slender polished chrome stem,",
    "standing on a square brushed gunmetal plinth with a thin glowing neon line along its base.",
    "Straight-on product photograph, the whole trophy centred in frame with clear space around it,",
    "dramatic warm-white key light from above left, soft rim light, high detail.",
    "Pure solid black background, no floor, no reflection, no shadow cast on anything, no text, no lettering, no logo.",
  ].join(" ");
}

// Subjects are described as OBJECTS, never as scenes or actions: "a
// coiled tongue twisted into a knot" renders; "somebody saying a
// tongue twister" renders a person, and a person is not a trophy.

export const TROPHIES = [
  // ── The eighteen awards (data/badges.ts) ──────────────────────────
  { id: "first-upload", color: "acting", subject: "a film clapperboard, open" },
  { id: "five-uploads", color: "acting", subject: "a stack of five film reels" },
  { id: "ten-uploads", color: "mindset", subject: "a rising staircase of ten steps" },
  { id: "practicing-machine", color: "body-language", subject: "a pair of interlocking gear wheels" },
  { id: "first-pass", color: "mindset", subject: "a bold check mark inside a ring" },
  { id: "full-spectrum", color: "structure", subject: "a fanned arc of seven upright blades, like a rainbow stood on end" },
  { id: "streak-3", color: "figurative", subject: "a leaping flame" },
  { id: "streak-5", color: "figurative", subject: "an open hand, palm forward, fingers spread" },
  { id: "streak-7", color: "figurative", subject: "a lightning bolt" },
  { id: "ten-minutes", color: "acting", subject: "an hourglass" },
  { id: "handy", color: "body-language", subject: "two open hands framing an empty space between them" },
  { id: "i-see-you", color: "body-language", subject: "a single open eye" },
  { id: "storyteller", color: "storytelling", subject: "an open book with its pages curling upward" },
  { id: "oscar", color: "acting", subject: "a pair of theatre masks, comedy and tragedy, side by side" },
  { id: "twisted", color: "acting", subject: "a twisted rope tied in a single knot" },
  { id: "sensational", color: "figurative", subject: "a five-pointed star with a long tail, like a shooting star" },
  { id: "composer", color: "acting", subject: "a treble clef" },
  { id: "journey-complete", color: "storytelling", subject: "a laurel wreath encircling the five letters S T O R Y" },

  // ── The five phases of the road ───────────────────────────────────
  { id: "phase-S", color: "mindset", subject: "the capital letter S, sculpted" },
  { id: "phase-T", color: "body-language", subject: "the capital letter T, sculpted" },
  { id: "phase-O", color: "storytelling", subject: "the capital letter O, sculpted" },
  { id: "phase-R", color: "acting", subject: "the capital letter R, sculpted" },
  { id: "phase-Y", color: "structure", subject: "the capital letter Y, sculpted" },

  // ── One for every challenge (data/challenges.ts) ──────────────────
  { id: "challenge-speaking-baseline", color: "mindset", subject: "a microphone standing upright" },
  { id: "challenge-story-without-help", color: "storytelling", subject: "an open book with no pages, only a glowing gap" },
  { id: "challenge-mindset-toolbox", color: "mindset", subject: "a small toolbox with its lid open" },
  { id: "challenge-no-filler-words", color: "acting", subject: "a speech bubble with a clean diagonal line struck through it" },
  { id: "challenge-avoid-boring-words", color: "figurative", subject: "a paintbrush with a curling ribbon of paint at its tip" },
  { id: "challenge-voice-melody", color: "acting", subject: "a sound wave rising and falling like a hill" },
  { id: "challenge-tongue-twisters", color: "acting", subject: "a ribbon twisted into a tight double knot" },
  { id: "challenge-beatbox-rhythm", color: "mindset", subject: "a pair of small drums" },
  { id: "challenge-create-storybook", color: "storytelling", subject: "a closed book with a ribbon bookmark" },
  { id: "challenge-scene-with-sound", color: "acting", subject: "a bell with rings of sound spreading from it" },
  { id: "challenge-describe-vividly", color: "figurative", subject: "a faceted gemstone" },
  { id: "challenge-moment-from-your-day", color: "storytelling", subject: "a pocket watch with its lid open" },
  { id: "challenge-high-stakes-moment", color: "acting", subject: "a tightrope walker's balance pole, tilted" },
  { id: "challenge-set-and-scene", color: "storytelling", subject: "a miniature theatre stage with its curtains drawn back" },
  { id: "challenge-twist-third-person", color: "storytelling", subject: "a spiral twist rising to a point" },
  { id: "challenge-foreshadowing", color: "storytelling", subject: "a crescent moon partly behind a cloud" },
  { id: "challenge-three-emotions", color: "acting", subject: "three overlapping teardrops" },
  { id: "challenge-someone-elses-story", color: "storytelling", subject: "two overlapping speech bubbles" },
  { id: "challenge-multiple-characters", color: "acting", subject: "three theatre masks in a row, each with a different expression" },
  { id: "challenge-story-youve-healed", color: "mindset", subject: "a heart with a healed seam running through it" },
  { id: "challenge-explain-with-analogies", color: "figurative", subject: "two linked rings" },
  { id: "challenge-podcast-introduction", color: "structure", subject: "a studio microphone on a small boom arm" },
  { id: "challenge-thirty-second-pitch", color: "structure", subject: "a stopwatch" },
  { id: "challenge-mic-drop", color: "acting", subject: "a microphone falling, tilted head-down" },
];
