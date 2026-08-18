// The vocabulary the cue engine reasons with.
//
// Three kinds of knowledge live here, and they are deliberately kept
// apart from the scoring in ../build-lesson-cues.mjs: the engine decides
// *how* to weigh things, this file says *what* the words are. Retuning
// one without disturbing the other is what keeps the cues predictable.
//
//   STOP / GLUE            - words that carry no idea on their own
//   EMPHASIS               - the rhetoric that marks a point being made
//   CONCRETE / FELT /CRAFT - words you can see, feel, or are here to learn
//   ICONS                  - concepts the icon set can draw, single-color
//
// Everything here was mined from the course's own 121 transcripts rather
// than invented: if the teacher never says it, it isn't listed.

/** Words that carry no idea on their own. Broad on purpose. */
export const STOP = new Set(
  [
    "a about above across actually after again against ago all almost alone",
    "along already also although always am among an and another any anybody",
    "anyone anything anyway are around as at away back backwards be became",
    "because become becomes been before began begin behind being below best",
    "better between beyond big both bring brings brought but by call called",
    "came can cannot cant come comes coming could couldnt did didnt different",
    "do does doesnt doing done down during each either else enough especially",
    "even ever every everybody everyone everything exactly example far felt",
    "few find finds first five for found four from full further gave get gets",
    "getting give given gives go goes going gone good got great had half",
    "happen happened happens has have havent having he hear heard help her",
    "here hers herself him himself his hold holding holds how however i if im",
    "in indeed inside instead into is isnt it its itself ive just keep keeping",
    "keeps kind knew know known knows last later least leave left less let",
    "lets like liked likes little long look looked looking looks lot lots made",
    "make makes making many may maybe me mean means meant might mine more most",
    "much must my myself near need needs never new next nice no nobody none",
    "nor not nothing now number of off often oh okay old on once one only onto",
    "or other others our ours out over own part parts people perhaps place put",
    "quite rather real really right said same saw say saying says second see",
    "seeing seem seems seen set several shall she should shouldnt show showing",
    "shows side simply since six small so some somebody someone something",
    "sometimes soon sort stand start started starts still stop such sure take",
    "taken takes taking talk talked talking talks tell telling tells ten than",
    "that thats the their theirs them themselves then there therefore these",
    "they thing things think thinking third this those though thought three",
    "through throughout thus time times to today together too took toward",
    "towards true try trying turn turned turns two under until up upon us use",
    "used uses using usually very want wanted wants was wasnt watch watching",
    "way ways we well went were what whatever when whenever where whether",
    "which while who whole whom whose why will with within without wont word",
    "words work working works would wouldnt yeah year years yes yet you youll",
    "your youre yours yourself youve gonna wanna",
    // Course furniture: said constantly, teaches nothing on screen.
    "video videos lesson lessons course section sections module welcome",
    "upload socials account library skills tools",
    "speakbetter click link below subscribe",
    // The rhetoric itself. "Remember" and "I promise you" are how the
    // teacher marks a point; the point is whatever follows them, and a
    // cue reading REMEMBER would put the frame on screen instead of the
    // picture. They earn a beat its score (see EMPHASIS) and are then
    // barred from being what that beat shows.
    "remember promise promised guarantee listen notice imagine picture",
    "chances probably basically literally totally actually definitely",
    "leading getting giving taking making coming going putting",
    "blah stuff okay alright anyway basically sure yeah huh",
    // Short words the three-letter floor now lets through.
    "bit guy guys ton lot kid kids day days man men she her him his its",
    "add ask big buy cut end eat fix hit let low mix run sit top win yet",
    "opposed versus rather regarding concerning towards",
    // Generic course patter that reads as a cue but names nothing: the
    // teacher saying what is coming up, or how easy this will be.
    "ahead reason tried wondering simple easy quick effective overly",
    "coming next covered cover covering ready begin beginning",
    "everybody everyone anybody anyone somebody someone nobody",
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean),
);

/** Glue that may sit inside a phrase - "point of view" is one idea. */
export const GLUE = new Set(["to", "of", "the", "in", "on", "for", "a", "your"]);

// -- What the teacher is making a point of ----------------------------
//
// Rhetoric, not keywords. A speaking teacher signals a point the same few
// ways every time: he promises, he asks and answers, he draws a contrast,
// he states a rule, he tells you to picture something. Each pattern below
// is one of those moves, weighted by how reliably it marks a real point
// rather than a passing remark.
//
// `lookahead` marks a move that sets a point up instead of being it - a
// rhetorical question is the wind-up, so what shows on screen should be
// drawn from the answer that follows it.
export const EMPHASIS = [
  {
    name: "promise",
    re: /\b(i (want to tell you|promise you|promise|guarantee)|trust me)\b/i,
    weight: 3.2,
  },
  {
    name: "directive",
    re: /^\W*(remember|listen|notice|watch this|here.s (the|what|why|how))\b/i,
    weight: 3,
  },
  {
    name: "antithesis",
    re: /\b(it.s not (about|what|how|that)|not .{2,40}? but rather|instead of)\b/i,
    weight: 2.8,
  },
  {
    name: "superlative",
    re: /\b(holy grail|the (single )?most|number one|the whole (point|thing)|the key|the secret|the difference between)\b/i,
    weight: 2.6,
  },
  {
    name: "imagery",
    re: /\b(imagine|picture (this|yourself)|close your eyes)\b/i,
    weight: 2.4,
  },
  {
    name: "rule",
    re: /\b(if you .{2,60}?(then|you.ll|you will|it will)|the more you|every time you)\b/i,
    weight: 2.2,
  },
  {
    name: "definition",
    re: /\b(is where|is when|is basically|is simply|means that|in other words)\b/i,
    weight: 2,
  },
  {
    name: "absolute",
    re: /\b(never|always|every single|the only|no one|nobody)\b/i,
    weight: 1.9,
  },
  {
    name: "consequence",
    re: /\b(that.s (why|how|what)|which means|the reason (why|that|is))\b/i,
    weight: 1.6,
  },
  {
    name: "instruction",
    re: /^\W*(start|stop|try|use|give|take|put|keep|practice|write|record)\b/i,
    weight: 1.5,
  },
  // The wind-up, not the point: boosts whatever answers it.
  { name: "question", re: /\?\s*$/, weight: 2.1, lookahead: true },
];

// -- Words worth a moment on screen -----------------------------------
//
// A cue earns the screen by being something a viewer can see or feel.
// "Approach" and "technique" are ideas about ideas; "roller coaster",
// "grief", "spotlight" land in the body. They're split by kind because
// they weigh differently: a concrete object is the most showable thing
// there is, an emotion close behind, and the craft vocabulary of the
// course is showable because it is the very thing being taught.

/** Things you can picture. */
export const CONCRETE = new Set(
  [
    "stage spotlight microphone camera screen movie film theater",
    "chair curtain podium crowd audience",
    "eyes eye face mouth tongue hands hand fingers heart chest shoulders",
    "breath diaphragm lungs throat jaw",
    "mountain cliff ocean wave waves fire storm river road path bridge door",
    "window mirror knife kitchen vegetables leather book notebook phone",
    "money bank coaster rollercoaster snowboard seashells bullet clock",
    "music melody instrument drum note song",
    "scene scenes picture image painting canvas",
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean),
);

/** Things you can feel. */
export const FELT = new Set(
  [
    "fear afraid nervous nerves anxiety panic dread terror",
    "grief sorrow pain hurt loss heartbreak sadness despair",
    "triumph elation joy excitement thrill delight pride relief",
    "love passion hunger desire longing hope",
    "confidence courage boldness authority presence power",
    "shame embarrassment awkward cringe doubt",
    "emotion emotions emotional feeling feelings",
    "energy calm stillness tension release",
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean),
);

/** The craft the course teaches - showable because it is the subject. */
export const CRAFT = new Set(
  [
    "pause pauses silence filler fillers rhythm pace tempo cadence",
    "melody tone pitch volume projection resonance articulation",
    "story stories storytelling hook moral message metaphor simile",
    "analogy alliteration rhyme triplet repetition rhetorical imagery",
    "gesture gestures expression posture stance movement stillness",
    "contact connection delivery performance vocabulary",
    "imagination memory memories journey transformation vulnerability",
    "ovation applause",
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean),
);

/** How much a word earns for being showable at all. */
export function vividness(word) {
  if (CONCRETE.has(word)) return 1.7;
  if (FELT.has(word)) return 1.55;
  if (CRAFT.has(word)) return 1.35;
  return 1;
}

// -- Icons ------------------------------------------------------------
//
// A concept the icon set can draw. Keys are matched whole-phrase first,
// so "eye contact" doesn't come out as an eye. The values name components
// in src/components/cue-icons.tsx - every one a single-color stroke
// drawing on the same 24x24 grid as the rest of the interface, because a
// filled or multi-color glyph would read as decoration stuck on top of
// the video rather than as part of the course.
export const ICONS = {
  "standing ovation": "Ovation",
  "roller coaster": "RollerCoaster",
  "eye contact": "EyeContact",
  "call to action": "Target",
  "body language": "Posture",
  "tone of voice": "Waveform",
  "point of view": "Eye",
  ovation: "Ovation",
  applause: "Ovation",
  audience: "Audience",
  crowd: "Audience",
  stage: "Stage",
  spotlight: "Spotlight",
  microphone: "Microphone",
  camera: "Camera",
  screen: "Camera",
  movie: "Film",
  movies: "Film",
  film: "Film",
  theater: "Film",
  scene: "Film",
  scenes: "Film",
  story: "Book",
  stories: "Book",
  storybook: "Book",
  book: "Book",
  notebook: "Book",
  pause: "Pause",
  pauses: "Pause",
  silence: "Pause",
  filler: "Static",
  fillers: "Static",
  melody: "Waveform",
  music: "Note",
  song: "Note",
  note: "Note",
  voice: "Waveform",
  sound: "Waveform",
  tone: "Waveform",
  pitch: "Waveform",
  volume: "Waveform",
  rhythm: "Metronome",
  pace: "Metronome",
  tempo: "Metronome",
  cadence: "Metronome",
  heart: "Heart",
  love: "Heart",
  emotion: "Heart",
  emotions: "Heart",
  feeling: "Heart",
  feelings: "Heart",
  grief: "Heart",
  eyes: "Eye",
  eye: "Eye",
  hands: "Hand",
  hand: "Hand",
  gesture: "Hand",
  gestures: "Hand",
  posture: "Posture",
  breath: "Lungs",
  diaphragm: "Lungs",
  lungs: "Lungs",
  fear: "Storm",
  storm: "Storm",
  nerves: "Storm",
  mountain: "Mountain",
  obstacle: "Mountain",
  journey: "Path",
  path: "Path",
  road: "Path",
  imagination: "Imagination",
  mind: "Imagination",
  memory: "Imagination",
  memories: "Imagination",
  mirror: "Mirror",
  practice: "Repeat",
  repetition: "Repeat",
  repeat: "Repeat",
  metaphor: "Metaphor",
  simile: "Metaphor",
  analogy: "Metaphor",
  clock: "Clock",
  minutes: "Clock",
  seconds: "Clock",
  fire: "Flame",
  energy: "Flame",
  passion: "Flame",
  power: "Flame",
  message: "Message",
  point: "Target",
  target: "Target",
  focus: "Target",
  attention: "Target",
  confidence: "Crown",
  authority: "Crown",
  presence: "Crown",
};

/**
 * The icon a cue should wear, if the set has one for it. Tries the whole
 * phrase before its words so "eye contact" doesn't become an eye.
 */
export function iconFor(phrase) {
  if (ICONS[phrase]) return ICONS[phrase];
  for (const w of phrase.split(" ")) if (ICONS[w]) return ICONS[w];
  return null;
}
