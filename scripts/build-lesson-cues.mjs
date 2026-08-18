// Builds the floating key ideas the player drifts beside the teacher.
//
// The old pool was single words mined from the hand-written takeaways and
// spawned at random - so a lesson on the pause could float "SNOWBOARD"
// while the teacher was saying something else entirely. These cues are
// timed instead: each one is a phrase the teacher is actually saying at
// that second, lifted from the lesson's own Whisper transcript segments.
//
// What makes a phrase worth floating is that it is *distinctive to this
// lesson*. "Audience" appears in nearly every transcript and teaches
// nothing on screen; "power pose" appears in one, and naming it while
// it's spoken reinforces the idea. That's TF-IDF over the 121-transcript
// corpus, boosted where the phrase also shows up in the lesson's title or
// its hand-written takeaways - the two places the lesson's key ideas are
// already stated.
//
// Run: npm run build:cues
// Output: src/data/lesson-cues.json (checked in; the player loads it lazily)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const transcripts = JSON.parse(
  readFileSync(join(ROOT, "src/data/transcripts.json"), "utf8"),
);

// ── Tuning ───────────────────────────────────────────────────────────
const WINDOW_SECONDS = 9; // shortest stretch of speech that can carry a cue
const MIN_GAP = 7.5; // seconds of quiet between cues
const REPEAT_COOLDOWN = 75; // don't float the same phrase again within this
const MAX_USES = 3; // ...or more than this many times in one lesson
const KEY_IDEAS = 14; // the lesson's floatable vocabulary, ranked
const SCORE_FLOOR = 5.5; // below this a phrase isn't distinctive enough
const RELATIVE_FLOOR = 0.34; // ...nor below this share of the lesson's best
const ECHO_GAP = 30; // seconds before a word may reappear inside another
const LEAD = 0.25; // appear a beat before the words land

// Words that carry no idea on their own. Kept deliberately broad: a cue
// that says nothing costs more than a window with no cue at all.
const STOP = new Set(
  [
    "a about above across actually after again against ago all almost alone",
    "along already also although always am among an and another any anybody",
    "anyone anything anyway are around as at away back backwards be became",
    "because become becomes been before began begin behind being below best",
    "better between beyond big both bring brings brought but by call called",
    "came can cannot cant come comes coming could couldnt did didnt different",
    "do does doesnt doing done dont down during each either else enough",
    "especially even ever every everybody everyone everything exactly example",
    "far felt few find finds first five for found four from front full further",
    "gave get gets getting give given gives go goes going gone good got great",
    "had half happen happened happens has have havent having he hear heard help",
    "her here hers herself high him himself his hold holding holds how however",
    "i if im in indeed inside instead into is isnt it its itself ive just keep",
    "keeping keeps kind knew know known knows last later least leave left less",
    "let lets like liked likes little long look looked looking looks lot lots",
    "made make makes making many may maybe me mean means meant might mine more",
    "most move moving much must my myself near need needs never new next nice",
    "no nobody none nor not nothing now number of off often oh okay old on once",
    "one only onto or other others our ours out over own part parts people",
    "perhaps place put quite rather real really right said same saw say saying",
    "says second see seeing seem seems seen set several shall she should",
    "shouldnt show showing shows side simply since six small so some somebody",
    "someone something sometimes soon sort stand start started starts still",
    "stop such sure take taken takes taking talk talked talking talks tell",
    "telling tells ten than that thats the their theirs them themselves then",
    "there therefore these they thing things think thinking third this those",
    "though thought three through throughout thus time times to today together",
    "too took toward towards true try trying turn turned turns two under until",
    "up upon us use used uses using usually very want wanted wants was wasnt",
    "watch watching way ways we well went were what whatever when whenever",
    "where whether which while who whole whom whose why will with within",
    "without wont word words work working works would wouldnt yeah year years",
    "yes yet you youll young your youre yours yourself youve",
  ]
    .join(" ")
    .split(/\s+/),
);

// Glue that may sit inside a phrase without counting as one of its words -
// "call to action" and "point of view" read as single ideas.
const GLUE = new Set(["to", "of", "the", "in", "on", "for"]);

/** Lowercased word tokens; apostrophes kept so "hero's" survives whole. */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z'\s-]+/g, " ")
    .split(/[\s-]+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

// "he's", "that's", "you're" tokenize whole and would otherwise read as
// rare, distinctive vocabulary. Judge them by their stem.
const isContent = (w) => {
  const stem = w.includes("'") ? w.slice(0, w.indexOf("'")) : w;
  return w.length >= 4 && !STOP.has(w) && !STOP.has(stem) && !GLUE.has(w);
};

/**
 * Every phrase a stretch of speech could offer: one content word, two
 * adjacent content words, or two joined by glue.
 */
function phrasesFrom(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const a = tokens[i];
    if (!isContent(a)) continue;
    out.push(a);
    const b = tokens[i + 1];
    if (b && isContent(b)) out.push(a + " " + b);
    const c = tokens[i + 2];
    if (b && GLUE.has(b) && c && isContent(c)) out.push(a + " " + b + " " + c);
  }
  return out;
}

// ── Proper nouns ─────────────────────────────────────────────────────
// Names and brands are the most "distinctive" words in any transcript and
// the least useful on screen - a lesson floating "BRENE" teaches nothing.
// A word capitalized mid-sentence more often than not is one of those.
const capMid = new Map();
const seenLower = new Map();
for (const entry of transcripts) {
  let sentenceStart = true;
  for (const w of (entry.text ?? "").split(/\s+/)) {
    const bare = w.replace(/[^A-Za-z']/g, "");
    if (bare) {
      const lower = bare.toLowerCase();
      seenLower.set(lower, (seenLower.get(lower) ?? 0) + 1);
      if (!sentenceStart && /^[A-Z]/.test(bare))
        capMid.set(lower, (capMid.get(lower) ?? 0) + 1);
    }
    sentenceStart = /[.!?]["')\]]?$/.test(w);
  }
}
const properNouns = new Set(
  [...capMid.keys()].filter(
    (w) => capMid.get(w) / (seenLower.get(w) ?? 1) > 0.4,
  ),
);

// ── Corpus statistics ────────────────────────────────────────────────
const docs = transcripts.map((entry) => {
  const tokens = tokenize(entry.text ?? "");
  const tf = new Map();
  for (const p of phrasesFrom(tokens)) tf.set(p, (tf.get(p) ?? 0) + 1);
  return {
    id: entry.id,
    title: entry.title ?? "",
    tf,
    segments: entry.segments ?? [],
  };
});

const df = new Map();
for (const d of docs)
  for (const p of d.tf.keys()) df.set(p, (df.get(p) ?? 0) + 1);

const N = docs.length;

// Takeaways are the lesson's key ideas already written down by hand -
// read straight out of the TS module so the two can never drift apart.
const takeawaySrc = readFileSync(join(ROOT, "src/data/takeaways.ts"), "utf8");
const takeawayText = new Map();
for (const m of takeawaySrc.matchAll(/"(\d{9,})":\s*\[([\s\S]*?)\n\s*\],/g))
  takeawayText.set(m[1], m[2]);

/**
 * The vocabulary this lesson is allowed to float: its own key ideas,
 * ranked. Anything outside this list never reaches the screen, which is
 * what keeps a story lesson from floating the props in the story - the
 * teacher says "free lettuce" exactly once in the course, so rarity alone
 * makes it look distinctive, and it teaches nothing.
 */
function keyIdeasFor(doc) {
  const titleTokens = new Set(tokenize(doc.title));
  const takeTokens = new Set(tokenize(takeawayText.get(doc.id) ?? ""));
  const scored = [];
  for (const [phrase, tf] of doc.tf) {
    const words = phrase.split(" ").filter((w) => !GLUE.has(w));
    if (words.some((w) => properNouns.has(w))) continue;
    // "Metaphor a metaphor" - the speaker restating, not a phrase.
    if (new Set(words).size !== words.length) continue;

    const documentFreq = df.get(phrase) ?? 1;
    // Said in the lesson's title or its written takeaways, this is one of
    // the ideas the lesson is *about*, stated twice over.
    const inTitle = words.every((w) => titleTokens.has(w));
    const named = inTitle || words.every((w) => takeTokens.has(w));
    // A phrase this rare is either the lesson's signature idea ("power
    // pose", said nowhere else in the course) or a passing detail. What
    // separates them is whether the lesson names it anywhere else.
    if (documentFreq < 3 && !named) continue;

    const idf = Math.log(N / documentFreq);
    let score = (1 + Math.log(tf)) * idf;
    if (words.length > 1) score *= 1.45; // two words name an idea; one hints
    if (inTitle) score *= 2.3;
    else if (named) score *= 1.7;
    if (score >= SCORE_FLOOR) scored.push([phrase, score]);
  }
  scored.sort((a, b) => b[1] - a[1]);
  // A relative floor as well as an absolute one, because lessons differ in
  // how much distinctive vocabulary they have at all. The story lessons
  // are narrative end to end - their best phrase should still float, but
  // the long tail beneath it ("eight", "amazing") is just the story being
  // told, and a lesson with nothing to say on screen should say nothing.
  const best = scored[0]?.[1] ?? 0;
  return new Map(
    scored
      .filter(([, s]) => s >= best * RELATIVE_FLOOR)
      .slice(0, KEY_IDEAS),
  );
}

/** Title-cased for the data file; the player renders it uppercase anyway. */
function present(phrase) {
  return phrase
    .split(" ")
    .map((w, i) => (i > 0 && GLUE.has(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

// ── Windowing ────────────────────────────────────────────────────────
// Whisper's segments are clause-sized. Grouped into ~9s windows each one
// holds a complete thought, and whatever phrase in it scores highest is
// what the teacher is making a point of right then.
function windowsOf(segments) {
  const out = [];
  let current = null;
  for (const seg of segments) {
    if (!current) current = { start: seg.start, end: seg.end, text: seg.text };
    else {
      current.end = seg.end;
      current.text += " " + seg.text;
    }
    if (current.end - current.start >= WINDOW_SECONDS) {
      out.push(current);
      current = null;
    }
  }
  if (current && current.end - current.start > 3) out.push(current);
  return out;
}

/** The second inside the window at which the phrase is actually spoken. */
function spokenAt(segments, phrase, from, to) {
  const words = phrase.split(" ");
  for (const seg of segments) {
    if (seg.end < from || seg.start > to) continue;
    const tokens = tokenize(seg.text);
    for (let i = 0; i + words.length <= tokens.length; i++)
      if (words.every((w, k) => tokens[i + k] === w)) return seg.start;
  }
  return null;
}

// `node scripts/build-lesson-cues.mjs --ideas <id>` prints a lesson's
// ranked vocabulary with scores - how the tuning above gets checked.
const inspectId = process.argv.includes("--ideas")
  ? process.argv[process.argv.indexOf("--ideas") + 1]
  : null;

const cues = {};
let totalCues = 0;
let covered = 0;

for (const doc of docs) {
  if (!doc.segments.length) continue;
  const ideas = keyIdeasFor(doc);
  if (inspectId && doc.id === inspectId) {
    console.log(doc.title);
    for (const [p, sc] of ideas) console.log("  " + sc.toFixed(1) + "  " + p);
  }
  const lastUsed = new Map();
  const wordSeen = new Map();
  const uses = new Map();
  const list = [];
  let lastCueAt = -Infinity;

  for (const win of windowsOf(doc.segments)) {
    if (win.start - lastCueAt < MIN_GAP) continue;
    const spoken = [...new Set(phrasesFrom(tokenize(win.text)))].filter((p) =>
      ideas.has(p),
    );
    // Freshness is per phrase and per word: floating "POWER POSE" and then
    // "POSE" a beat later reads as a stutter, not a second idea.
    const fresh = (p) =>
      (uses.get(p) ?? 0) < MAX_USES &&
      win.start - (lastUsed.get(p) ?? -Infinity) >= REPEAT_COOLDOWN &&
      p
        .split(" ")
        .every((w) => win.start - (wordSeen.get(w) ?? -Infinity) >= ECHO_GAP);

    const candidates = spoken
      .filter(fresh)
      .sort((a, b) => ideas.get(b) - ideas.get(a));

    for (const shortest of candidates) {
      // "Awkward silence" says the idea; "awkward" only gestures at it -
      // so when the window offers both, the fuller phrasing wins.
      const phrase =
        candidates.find(
          (p) => p !== shortest && (p + " ").includes(shortest + " "),
        ) ?? shortest;
      const at = spokenAt(doc.segments, phrase, win.start, win.end);
      if (at === null) continue;
      const t = Math.max(0, at - LEAD);
      if (t - lastCueAt < MIN_GAP) continue;
      list.push({ t: Math.round(t * 10) / 10, w: present(phrase) });
      lastUsed.set(phrase, win.start);
      for (const w of phrase.split(" ")) wordSeen.set(w, win.start);
      uses.set(phrase, (uses.get(phrase) ?? 0) + 1);
      lastCueAt = t;
      break;
    }
  }

  if (list.length) {
    cues[doc.id] = list;
    totalCues += list.length;
    covered++;
  }
}

writeFileSync(
  join(ROOT, "src/data/lesson-cues.json"),
  JSON.stringify(cues) + "\n",
);

console.log(
  covered +
    "/" +
    docs.length +
    " videos, " +
    totalCues +
    " cues, " +
    (JSON.stringify(cues).length / 1024).toFixed(1) +
    " KB",
);
