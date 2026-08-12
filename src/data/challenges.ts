import type { CategoryId } from "./categories";

// The STORY curriculum — master plan §04. Five phases, 21 challenges,
// each matched to its filmed explainer video and the Skills lessons a
// student warms up with (the STEP cycle's "Tap Into Tools").
// `criteria` + `targetSkills` are the structured rubric the AI review
// scores against (build plan Phase 2 → Phase 4).

export type PhaseId = "S" | "T" | "O" | "R" | "Y";

export interface StoryPhase {
  id: PhaseId;
  name: string;
  tagline: string;
  /** Each phase owns a color, borrowed from the skill it leans on most.
   *  Class names stay literal so Tailwind's scanner finds them. */
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const storyPhases: StoryPhase[] = [
  {
    id: "S",
    name: "Start With Awareness",
    tagline: "Reflect, baseline, and map your voice's starting point.",
    bgClass: "bg-mindset",
    textClass: "text-mindset",
    borderClass: "border-mindset/35",
  },
  {
    id: "T",
    name: "Train Your Instrument",
    tagline: "Build vocal clarity, rhythm, tone, and presence.",
    bgClass: "bg-body-language",
    textClass: "text-body-language",
    borderClass: "border-body-language/35",
  },
  {
    id: "O",
    name: "Own Your Stories",
    tagline: "Storytelling techniques, scene work, and personal expression.",
    bgClass: "bg-storytelling",
    textClass: "text-storytelling",
    borderClass: "border-storytelling/35",
  },
  {
    id: "R",
    name: "Reveal Deeper Truths",
    tagline: "Connect emotionally, explore vulnerability, expand empathy.",
    bgClass: "bg-acting",
    textClass: "text-acting",
    borderClass: "border-acting/35",
  },
  {
    id: "Y",
    name: "Your Voice in the World",
    tagline: "Real-world speaking formats and challenges.",
    bgClass: "bg-structure",
    textClass: "text-structure",
    borderClass: "border-structure/35",
  },
];

export interface Challenge {
  slug: string;
  phase: PhaseId;
  title: string;
  /** Vimeo id of the challenge explainer video; null for the passive item */
  vimeoId: string | null;
  /** Passive items are watched, not recorded (the Mindset Toolbox) */
  passive?: boolean;
  brief: string;
  criteria: string[];
  targetSkills: CategoryId[];
  relatedLessonIds: string[];
}

export const challenges: Challenge[] = [
  // ── S — Start With Awareness ────────────────────────────────────────
  {
    slug: "speaking-baseline",
    phase: "S",
    title: "Record Your Speaking Baseline",
    vimeoId: "1081200493",
    brief:
      "Speak your truth to the camera for up to two minutes — no preparation, no polish. This is your starting point on the map.",
    criteria: [
      "Speak continuously to the camera for at least 60 seconds",
      "Say something true about yourself or your life",
      "Finish the recording without restarting",
    ],
    targetSkills: ["mindset"],
    relatedLessonIds: ["1081029780", "1081197407", "1081032074"],
  },
  {
    slug: "story-without-help",
    phase: "S",
    title: "Tell a Story Without Any Help",
    vimeoId: "1081200781",
    brief:
      "Tell any story from your life, exactly as you would today — before learning a single technique. Your future self will thank you for the comparison.",
    criteria: [
      "Tell one complete story with a beginning and an end",
      "Keep it under three minutes",
      "Don't stop to apologize or restart",
    ],
    targetSkills: ["storytelling", "mindset"],
    relatedLessonIds: ["1081030429", "1081031495"],
  },
  {
    slug: "mindset-toolbox",
    phase: "S",
    title: "Watch the Mindset Toolbox",
    vimeoId: null,
    passive: true,
    brief:
      "The one challenge you complete by watching: work through the green Mindset & Psychology lessons in Skills. Everything else in the course stands on this foundation.",
    criteria: ["Watch the Mindset & Psychology lessons in Skills"],
    targetSkills: ["mindset"],
    relatedLessonIds: [
      "1081029629",
      "1081029780",
      "1081029881",
      "1081030261",
      "1081197407",
      "1094881996",
    ],
  },

  // ── T — Train Your Instrument ───────────────────────────────────────
  {
    slug: "no-filler-words",
    phase: "T",
    title: "Say What You Love — With No Filler Words",
    vimeoId: "1081280579",
    brief:
      "Speak about something you're passionate about for two minutes — with zero ums, uhs, likes, or you-knows. Passion first, polish second.",
    criteria: [
      "Speak about something you genuinely love",
      "No filler words for the full recording",
      "Use pauses instead of fillers when you need to think",
    ],
    targetSkills: ["acting", "mindset"],
    relatedLessonIds: ["1080629747", "1081162033", "1081200223"],
  },
  {
    slug: "avoid-boring-words",
    phase: "T",
    title: "Avoid Boring Words",
    vimeoId: "1081200895",
    brief:
      "Describe something you find amazing — without ever saying amazing, beautiful, or exciting. Reach for language that actually paints.",
    criteria: [
      "Describe something impressive without using: amazing, beautiful, exciting",
      "Use at least three vivid, specific alternatives",
      "Keep the energy of genuine enthusiasm",
    ],
    targetSkills: ["figurative", "storytelling"],
    relatedLessonIds: ["1081032328", "1081032528", "1081706536"],
  },
  {
    slug: "voice-melody",
    phase: "T",
    title: "Play With Your Voice",
    vimeoId: "1081281914",
    brief:
      "Make your message a melody: take a simple topic and deliver it with deliberate shifts in tone, pace, and musicality.",
    criteria: [
      "Vary your tone noticeably at least three times",
      "Use at least one deliberate change of pace",
      "Include one powerful pause",
    ],
    targetSkills: ["acting"],
    relatedLessonIds: ["1080675446", "1081285460", "1080443133", "1081162033"],
  },
  {
    slug: "tongue-twisters",
    phase: "T",
    title: "Tongue Twister Challenge",
    vimeoId: "1081940261",
    brief:
      "Warm up your articulation on camera: three tongue twisters, each one three times, each round faster — without losing clarity.",
    criteria: [
      "Complete three different tongue twisters",
      "Repeat each at increasing speed",
      "Stay intelligible even at top speed",
    ],
    targetSkills: ["acting"],
    relatedLessonIds: ["1081200064", "1080612884"],
  },
  {
    slug: "beatbox-rhythm",
    phase: "T",
    title: "Beatbox or Rhythm Flow",
    vimeoId: "1081935006",
    brief:
      "The self-consciousness breaker: beatbox, hum a rhythm, or flow to a beat on camera. Being willing to look silly is a speaking superpower.",
    criteria: [
      "Keep a rhythm going for at least 30 seconds",
      "Commit fully — no breaking into apology",
      "Have fun with it (it shows)",
    ],
    targetSkills: ["mindset", "acting"],
    relatedLessonIds: ["1094881996", "1080612884", "1082732774"],
  },

  // ── O — Own Your Stories ────────────────────────────────────────────
  {
    slug: "create-storybook",
    phase: "O",
    title: "Create Your Storybook",
    vimeoId: "1081200682",
    brief:
      "Build your personal story bank: pick three moments from your life and tell one of them on camera as a titled story.",
    criteria: [
      "Name the story with a title before telling it",
      "Tell one complete story from your own life",
      "End with the moral or message",
    ],
    targetSkills: ["storytelling"],
    relatedLessonIds: ["1081289259", "1081290890", "1081292518", "1081292414"],
  },
  {
    slug: "scene-with-sound",
    phase: "O",
    title: "Paint the Scene With Sound",
    vimeoId: "1082010596",
    brief:
      "Bring a scene to life using sound effects, onomatopoeia, and your voice as the soundtrack — the door creaks, the engine roars, the crowd goes quiet.",
    criteria: [
      "Use at least three distinct sound effects in one story",
      "Make the sounds carry real information, not decoration",
      "Keep the story coherent around them",
    ],
    targetSkills: ["acting", "figurative", "storytelling"],
    relatedLessonIds: ["1081163657", "1081707157", "1081294121"],
  },
  {
    slug: "describe-vividly",
    phase: "O",
    title: "Describe a Place or Person Vividly",
    vimeoId: "1081932833",
    brief:
      "Describe a landscape or a person using figurative language so vivid the listener can see them — metaphor, simile, and sensory detail doing the work.",
    criteria: [
      "Use at least two metaphors or similes",
      "Touch at least two senses beyond sight",
      "Make one comparison nobody's heard before",
    ],
    targetSkills: ["figurative", "storytelling"],
    relatedLessonIds: ["1081032528", "1081032662", "1080679081", "1081032892"],
  },
  {
    slug: "moment-from-your-day",
    phase: "O",
    title: "Tell a Real-Life Moment From Your Day",
    vimeoId: "1081938254",
    brief:
      "Narrate one scene from today — not the whole day, one moment — zoomed all the way in. Life scene, not life story.",
    criteria: [
      "Pick a single moment, not a summary of the day",
      "Narrate it in the present tense",
      "Include what you saw, heard, and felt",
    ],
    targetSkills: ["storytelling", "acting"],
    relatedLessonIds: ["1081031433", "1081163248", "1081031042"],
  },
  {
    slug: "high-stakes-moment",
    phase: "O",
    title: "Act Out a High-Stakes Moment",
    vimeoId: "1081956346",
    brief:
      "Take a moment where everything hung in the balance and act it out — voice, face, body, the works. Don't just say it, be in it.",
    criteria: [
      "Choose a story with genuine stakes",
      "Act out at least one moment physically",
      "Let the tension build before it breaks",
    ],
    targetSkills: ["acting", "body-language", "storytelling"],
    relatedLessonIds: ["1081162875", "1081162752", "1081163913"],
  },
  {
    slug: "twist-third-person",
    phase: "O",
    title: "Add a Twist in Third-Person",
    vimeoId: "1081933936",
    brief:
      "Own your story with a plot twist: tell a story that turns, holding the reveal until the moment it lands hardest.",
    criteria: [
      "Structure the story so the twist genuinely surprises",
      "Plant at least one clue the listener only sees afterwards",
      "Land the reveal in a single sentence",
    ],
    targetSkills: ["storytelling", "structure"],
    relatedLessonIds: ["1081197526", "1081163913", "1081197062"],
  },

  // ── R — Reveal Deeper Truths ────────────────────────────────────────
  {
    slug: "three-emotions",
    phase: "R",
    title: "Trigger 3 Emotions in 1 Story",
    vimeoId: "1081948719",
    brief:
      "Tell one story that moves through three different emotions — and takes the listener through them with you.",
    criteria: [
      "Move through three clearly different emotions",
      "Embody each one in voice and body, not just words",
      "Make the transitions feel earned, not switched",
    ],
    targetSkills: ["acting", "storytelling", "body-language"],
    relatedLessonIds: ["1081163657", "1081031042", "1081162875"],
  },
  {
    slug: "someone-elses-story",
    phase: "R",
    title: "Tell Someone Else's Story",
    vimeoId: "1081932244",
    brief:
      "Step into someone else's shoes and tell their story with the same care you'd give your own — empathy as a speaking skill.",
    criteria: [
      "Tell a real story that happened to someone else",
      "Honor their perspective — no editorializing over them",
      "Make the listener feel why the story matters",
    ],
    targetSkills: ["storytelling", "mindset"],
    relatedLessonIds: ["1081030429", "1081198327", "1081162172"],
  },
  {
    slug: "multiple-characters",
    phase: "R",
    title: "Bring a Story to Life With Multiple Characters",
    vimeoId: "1081947627",
    brief:
      "A story with at least three characters, each distinct — different voices, postures, energy. You are the whole cast.",
    criteria: [
      "Give at least three characters distinct voices or physicality",
      "Keep it obvious who's speaking without saying 'he said'",
      "Stay in the scene rather than narrating from outside",
    ],
    targetSkills: ["acting", "body-language", "storytelling"],
    relatedLessonIds: ["1081163466", "1081162875", "1081163248"],
  },
  {
    slug: "story-youve-healed",
    phase: "R",
    title: "Share a Story You've Healed",
    vimeoId: "1081936936",
    brief:
      "Tell a story from a hard chapter you've come through — from the far side of it. Vulnerability, delivered with strength.",
    criteria: [
      "Choose something genuinely difficult that you've processed",
      "Speak from perspective, not from inside the wound",
      "End with what it gave you, not just what it cost",
    ],
    targetSkills: ["mindset", "storytelling"],
    relatedLessonIds: ["1081029881", "1081030261", "1081292414"],
  },

  // ── Y — Your Voice in the World ─────────────────────────────────────
  {
    slug: "explain-with-analogies",
    phase: "Y",
    title: "Explain It With Analogies",
    vimeoId: "1081945708",
    brief:
      "Take an abstract concept from your work or passion and make it land for a nine-year-old using analogies.",
    criteria: [
      "Pick a genuinely abstract concept",
      "Explain it through at least two analogies",
      "No jargon survives the explanation",
    ],
    targetSkills: ["figurative", "structure"],
    relatedLessonIds: ["1081707642", "1080635988", "1081032404"],
  },
  {
    slug: "podcast-introduction",
    phase: "Y",
    title: "Podcast Introduction Challenge",
    vimeoId: "1081953650",
    brief:
      "Open a podcast episode: welcome the audience, set the energy, and edify your guest so the listener leans in.",
    criteria: [
      "Hook the listener in the first ten seconds",
      "Introduce a (real or imagined) guest so they sound fascinating",
      "Land a clean handoff question to end",
    ],
    targetSkills: ["structure", "acting"],
    relatedLessonIds: ["1081198798", "1081198957", "1080443133"],
  },
  {
    slug: "thirty-second-pitch",
    phase: "Y",
    title: "Pitch Your Idea in 30 Seconds",
    vimeoId: "1081950736",
    brief:
      "The elevator pitch: your idea, product, or mission in thirty seconds — clear, warm, and impossible to forget.",
    criteria: [
      "Complete the pitch in 30 seconds or less",
      "State the problem, the idea, and the invitation",
      "Invite rather than sell",
    ],
    targetSkills: ["structure", "mindset", "figurative"],
    relatedLessonIds: ["1081164747", "1081198886", "1081200223"],
  },
];

// Filmed challenge videos not yet placed in the STORY curriculum
// (open question, master plan §18) — surfaced as bonus challenges.
export const bonusChallenges = [
  { title: "Story with Set & Scene", vimeoId: "1081955083" },
  { title: "Tell A Story Using Foreshadowing & Fulfilment", vimeoId: "1081952336" },
  { title: "Tell A Story With A Mic Drop Moment", vimeoId: "1081949655" },
];

// Section introduction videos (not challenges themselves)
export const challengesIntro = [
  { title: "Welcome To The Challenges!", vimeoId: "1081200318" },
  { title: "How To Use The Skills In Your Challenges", vimeoId: "1081200420" },
];

export const challengeBySlug = new Map(challenges.map((c) => [c.slug, c]));

export function challengesInPhase(phase: PhaseId): Challenge[] {
  return challenges.filter((c) => c.phase === phase);
}
