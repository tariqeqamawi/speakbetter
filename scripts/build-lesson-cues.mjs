// The cue engine: what Speak Better puts on screen beside the teacher,
// and when.
//
// The rule it works to is simple to state and most of the difficulty is
// in honoring it: every time the teacher makes a point, the thing he is
// making a point *about* appears on screen - as the words themselves, as
// a single-color icon, or as an image where an image illustrates it
// better than words could. Between the points, nothing appears.
//
// It runs in four passes, each in its own module so the reasoning can be
// argued with a piece at a time:
//
//   1. BEATS      cues/beats.mjs finds the moments a point is landed,
//                 from the rhetoric the teacher uses to land it.
//   2. CANDIDATES every phrase the beat could put on screen, scored for
//                 how distinctive it is to this lesson (TF-IDF across all
//                 121 transcripts) and how showable it is (cues/lexicon).
//   3. NOVELTY    an idea floats once per lesson and rarely across the
//                 course, so no two moments show the same thing twice.
//   4. FORM       words, icon, or image - whichever carries the idea.
//
// Why this replaced the first attempt: that one ranked a lesson's whole
// vocabulary and floated the top of it on a timer, which on "How To
// Receive A Standing Ovation" produced STANDING OVATION, then OVATION,
// then OVATION again - the title restated three times while the teacher
// moved through emotional journey, grief and sorrow, triumph, and a wild
// roller coaster of emotion, none of which reached the screen.
//
// Run:     npm run build:cues
// Inspect: npm run build:cues -- --inspect 1081161473
// Output:  src/data/lesson-cues.json (checked in; loaded lazily)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { GLUE, ICONS, STOP, iconFor, vividness } from "./cues/lexicon.mjs";
import { scoreBeats, sentencesOf, slotsOf } from "./cues/beats.mjs";
import { IMAGES, imageFor } from "./cues/images.mjs";

// Phrases the interface can draw by name, whether or not the artwork for
// them has been made yet - a concept someone has already picked out.
const KNOWN = new Set([...Object.keys(ICONS), ...Object.keys(IMAGES)]);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const transcripts = JSON.parse(
  readFileSync(join(ROOT, "src/data/transcripts.json"), "utf8"),
);

// -- Tuning -----------------------------------------------------------
const BEAT_EVERY = 10; // aim for a point on screen about this often
const BEAT_FLOOR = 0.7; // below this a sentence isn't making a point
// A cue's fade runs 4s (see .float-word) and the player shows one at a
// time, so cues closer than that would cut each other off mid-sentence.
const MIN_GAP = 4.2;
// With the beat floor this low, more stretches of a lesson offer a point
// - so the bar moves to the phrase instead. A beat whose best candidate
// is this weak shows nothing, which is what keeps a denser screen from
// becoming a noisier one.
const CUE_FLOOR = 2;
// A point worth lifting whole even when its words are all stopwords.
const VERBATIM_EMPHASIS = 2.5;
const LEAD = 0.25; // appear a beat before the words land

const REUSE_DECAY = 0.55; // how hard a course-wide repeat is penalized
const GLYPH_SHARE = 0.45; // at most this fraction of a lesson's cues draw

// -- Words ------------------------------------------------------------

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
  // Three letters, not four: "eye" is half the body-language vocabulary
  // of the course and was invisible to the engine that wanted four.
  return w.length >= 3 && !STOP.has(w) && !STOP.has(stem) && !GLUE.has(w);
};

/**
 * Crude but sufficient: "stories" and "story", "pausing" and "pause" are
 * the same idea, and floating one after the other reads as a stutter.
 * This is what stops a lesson repeating itself in different clothes.
 */
function stem(word) {
  let w = word.includes("'") ? word.slice(0, word.indexOf("'")) : word;
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  for (const suffix of ["ing", "ed", "es", "s"]) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 4)
      return w.slice(0, -suffix.length);
  }
  return w;
}

/**
 * Every phrase a stretch of speech could offer: one content word, two
 * adjacent ones, or two joined by glue - including the doubled glue of
 * "the depths of your pain", which is one picture and would otherwise
 * come apart into "depths" and "pain".
 */
function phrasesFrom(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const a = tokens[i];
    if (!isContent(a)) continue;
    out.push(a);
    const b = tokens[i + 1];
    if (b && isContent(b)) out.push(a + " " + b);
    if (!b || !GLUE.has(b)) continue;
    const c = tokens[i + 2];
    if (c && isContent(c)) out.push(a + " " + b + " " + c);
    else if (c && GLUE.has(c) && tokens[i + 3] && isContent(tokens[i + 3]))
      out.push(a + " " + b + " " + c + " " + tokens[i + 3]);
  }
  return out;
}

// Function words stay lowercase in a title; "your" is a real word and
// keeps its capital. Only matters where cues are read as text - the
// player renders them uppercase.
const MINOR = new Set(["to", "of", "the", "in", "on", "for", "a"]);

/**
 * Phrases from a whole stretch of speech, clause by clause.
 *
 * Splitting on punctuation first is what stops a phrase forming across a
 * boundary where the teacher drew breath: "...commanding authority. Learn
 * how to..." offered up AUTHORITY LEARN, two words that never belonged
 * to each other and read as a transcription error on screen.
 */
function phrasesOfText(text) {
  const out = [];
  for (const clause of text.split(/[,.;:!?]+/))
    if (clause.trim()) out.push(...phrasesFrom(tokenize(clause)));
  return out;
}

/** Title-cased for the data file. */
function present(phrase) {
  return phrase
    .split(" ")
    .map((w, i) => (i > 0 && MINOR.has(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

// -- Proper nouns -----------------------------------------------------
// Names and brands are the most "distinctive" words in any transcript and
// the least useful on screen - a lesson floating BRENE teaches nothing.
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

// -- Corpus statistics ------------------------------------------------
// How distinctive a phrase is to the lesson saying it. "Audience" turns
// up in nearly every transcript and names nothing in particular;
// "roller coaster" turns up in one, and naming it as it's spoken is the
// lesson's own image handed back to the viewer.
const docs = transcripts.map((entry) => {
  const tf = new Map();
  for (const p of phrasesOfText(entry.text ?? "")) tf.set(p, (tf.get(p) ?? 0) + 1);
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

// -- Candidates -------------------------------------------------------

/**
 * What this beat could put on screen, best first.
 *
 * Nothing is filtered by a course-wide vocabulary list the way the first
 * engine did it: the beat has already established that a point is being
 * made here, so the question is no longer "is this phrase important to
 * the course" but "which of the words he is saying right now carries the
 * point". That difference is why the emotional language of a lesson now
 * reaches the screen at all.
 */
function candidatesFor(doc, beat, ledger) {
  const scored = [];
  const seen = new Set();

  for (const phrase of phrasesOfText(beat.text)) {
    if (seen.has(phrase)) continue;
    seen.add(phrase);

    const words = phrase.split(" ").filter((w) => !GLUE.has(w));
    if (words.some((w) => properNouns.has(w))) continue;
    // "Metaphor a metaphor" - the speaker restating, not a phrase.
    if (new Set(words).size !== words.length) continue;

    const vivid = Math.max(...words.map(vividness));
    const documentFreq = df.get(phrase) ?? 1;
    // Said once in the whole course and picturing nothing: a passing
    // detail that only looks distinctive because it is rare.
    if (documentFreq === 1 && vivid === 1 && words.length === 1) continue;

    const idf = Math.log(N / documentFreq);
    let score = (1 + Math.log(doc.tf.get(phrase) ?? 1)) * (0.6 + idf) * vivid;
    // Two words name an idea, one only gestures at it: "emotional
    // journey" is the point, "journey" could be anything. Glued phrases
    // earn less than clean pairs - "coaster of emotion" is a longer way
    // of saying what "roller coaster" already says.
    const glued = phrase.split(" ").length - words.length;
    if (words.length >= 2) score *= glued ? 1.32 : 1.5;
    // The shape of a word says something about whether it names the
    // point or merely describes getting to it. A gerund is a process
    // ("maintaining eye" instead of EYE CONTACT) and an adverb is a
    // manner ("verbally") - neither is the thing being spoken about,
    // unless the course happens to teach it as one.
    // Length floors and the KNOWN exemption keep the rule off words that
    // only look the part: "holy" is not an adverb and "standing ovation"
    // is not a process, it is the name of the thing.
    if (!KNOWN.has(phrase))
      for (const w of words) {
        if (vividness(w) > 1) continue;
        if (w.length >= 6 && w.endsWith("ing")) score *= 0.72;
        else if (w.length >= 6 && w.endsWith("ly")) score *= 0.7;
      }
    // A concept the design system knows by name is one someone has
    // already judged worth showing, and it has a drawing waiting for it.
    // Deliberately a lighter thumb than the bonus for naming an idea in
    // full: "grief" is drawable and "the depths of your pain" is the
    // sentence the teacher actually built.
    if (KNOWN.has(phrase)) score *= 1.2;
    // The stronger the beat, the more the phrase inside it is worth.
    score *= 1 + beat.emphasis / 8;
    // Shown in other lessons already - the course shouldn't keep putting
    // the same handful of ideas on screen. Counted by stem rather than by
    // exact wording, because penalizing only the phrase pushes the engine
    // toward a clumsier way of saying the very thing it was avoiding:
    // "roller coaster" gets spent, so "coaster of emotion" walks in.
    const reuse = Math.max(...words.map((w) => ledger.get(stem(w)) ?? 0));
    score /= 1 + REUSE_DECAY * reuse;

    scored.push({ phrase, score, vivid, df: documentFreq });
  }

  return scored.sort((a, b) => b.score - a.score);
}

// -- Points made entirely out of small words -------------------------
//
// "It's not about what you say. It's about how you say it." is the line
// the standing ovation lesson is built to land, and there is not one
// content word in it - every word is a stopword, so no amount of ranking
// vocabulary will ever put it on screen. Same for "is it luck or
// chance?". These are the moments a viewer most wants in writing and the
// ones a word-scoring engine is structurally blind to.
//
// So a strongly marked beat that offers no showable phrase gets one last
// chance: lift the clause itself, whole, if it's short enough to read at
// a glance. Deliberately a narrow list of shapes - a general "quote the
// sentence" rule would fill the screen with prose.
const VERBATIM = [
  // "It's about how you say it and how you make people feel" -> the
  // first half of the answer, not the whole run-on.
  /\bit'?s about (?:the )?([a-z' ]{6,30}?)(?: and | or |[,.!?]|$)/i,
  // "...is it luck or chance?" -> what the question actually offers.
  /\bis it ([a-z' ]{5,26})\?/i,
  // "What matters is how you make them feel."
  /\bwhat matters is ([a-z' ]{5,26})[.!?]/i,
];

function verbatimCue(beat) {
  if (beat.emphasis < VERBATIM_EMPHASIS) return null;
  for (const pattern of VERBATIM) {
    const found = beat.text.match(pattern);
    if (!found) continue;
    const phrase = found[1].trim().replace(/\s+/g, " ");
    const words = phrase.split(" ");
    if (words.length < 2 || words.length > 5 || phrase.length > 24) continue;
    return phrase.toLowerCase();
  }
  return null;
}

/** The second inside the beat at which the phrase is actually spoken. */
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

// -- Build ------------------------------------------------------------

const inspectId = process.argv.includes("--inspect")
  ? process.argv[process.argv.indexOf("--inspect") + 1]
  : null;

/** How many times each idea, by stem, has already reached the screen. */
const ledger = new Map();
const cues = {};
let totalCues = 0;
let covered = 0;
let glyphs = 0;
let images = 0;

for (const doc of docs) {
  if (!doc.segments.length) continue;

  const slots = slotsOf(scoreBeats(sentencesOf(doc.segments)), {
    every: BEAT_EVERY,
    floor: BEAT_FLOOR,
  });

  const spent = new Set(); // stems this lesson has already shown
  const said = new Set(); // lines lifted whole, so none is lifted twice
  const list = [];
  let lastAt = -Infinity;

  if (inspectId === doc.id) console.log("\n" + doc.title + "\n");

  for (const slot of slots) {
   // The points in this stretch, strongest first. Every one of them gets
   // a turn rather than just the winner - a stretch holding three real
   // points should show three things, and the spacing rule below is what
   // stops that becoming a stream. The ordering still matters: when the
   // stretch only has room for one, the strongest point takes it.
   for (const beat of slot) {
    const ranked = candidatesFor(doc, beat, ledger);

    if (inspectId === doc.id)
      console.log(
        beat.start.toFixed(1).padStart(6) +
          "  [" +
          beat.emphasis.toFixed(1) +
          " " +
          beat.moves.join(",") +
          "]  " +
          beat.text.slice(0, 92) +
          "\n        considered: " +
          ranked
            .slice(0, 5)
            .map((c) => c.phrase + " " + c.score.toFixed(1))
            .join(" | "),
      );

    // A long sentence can land more than one point - the teacher stacking
    // "the depths of your pain" into "your triumph and elation" is two
    // pictures in one breath, and showing only the first wastes the
    // second. Short beats stay at one.
    const room = Math.max(1, Math.round((beat.end - beat.start) / 5));
    let taken = 0;

    const fresh = (c) => !c.phrase.split(" ").some((w) => spent.has(stem(w)));

    for (const top of ranked) {
      if (taken >= room) break;
      if (top.score < CUE_FLOOR) break; // ranked, so the rest are weaker
      if (!fresh(top)) continue;

      // Two ways a neighbouring candidate can be the better way of saying
      // the same thing, and in both the winner on raw score is the worse
      // cue:
      //
      //   "Standing ovation" says the idea, "ovation" only points at it -
      //   and taking the shorter one spends the idea, so the fuller
      //   phrasing can never appear later in the lesson either.
      //
      //   "Maintain eye" is a rarer sequence of words than EYE CONTACT
      //   and so scores higher, but eye contact is the thing the course
      //   teaches and the thing the icon set can draw.
      const words = (c) => c.phrase.split(" ").filter((w) => !GLUE.has(w));
      const candidate =
        ranked.find(
          (o) =>
            o !== top &&
            fresh(o) &&
            (" " + o.phrase + " ").includes(" " + top.phrase + " ") &&
            o.score >= top.score * 0.7,
        ) ??
        ranked.find(
          (o) =>
            o !== top &&
            fresh(o) &&
            KNOWN.has(o.phrase) &&
            !KNOWN.has(top.phrase) &&
            words(o).some((w) => words(top).includes(w)) &&
            o.score >= top.score * 0.6,
        ) ??
        top;

      const at = spokenAt(
        doc.segments,
        candidate.phrase,
        Math.max(beat.start, lastAt),
        beat.end + 1,
      );
      const t = Math.max(0, (at ?? beat.start) - LEAD);
      if (t - lastAt < MIN_GAP) continue;

      // What form it takes is decided once the lesson is complete - see
      // assignForms below. The phrase rides along until then.
      const cue = { t: Math.round(t * 10) / 10, w: present(candidate.phrase) };
      cue.phrase = candidate.phrase;

      list.push(cue);
      for (const w of candidate.phrase.split(" ")) {
        if (GLUE.has(w)) continue;
        spent.add(stem(w));
        ledger.set(stem(w), (ledger.get(stem(w)) ?? 0) + 1);
      }
      lastAt = t;
      taken++;

      if (inspectId === doc.id)
        console.log(
          "        " +
            t.toFixed(1).padStart(6) +
            "  " +
            cue.w +
            "",
        );
    }

    // Nothing showable in a beat that was clearly making a point: lift
    // the line itself if it's short enough to read.
    if (!taken) {
      const quoted = verbatimCue(beat);
      const t = Math.max(0, beat.start - LEAD);
      if (quoted && !said.has(quoted) && t - lastAt >= MIN_GAP) {
        list.push({ t: Math.round(t * 10) / 10, w: present(quoted), phrase: quoted });
        said.add(quoted);
        lastAt = t;
        taken++;
        if (inspectId === doc.id)
          console.log("        " + t.toFixed(1).padStart(6) + "  " + present(quoted) + "  [verbatim]");
      }
    }

    if (inspectId === doc.id && !taken) console.log("        (nothing fresh)");
   }
  }

  if (list.length) {
    assignForms(list);
    cues[doc.id] = list;
    totalCues += list.length;
    glyphs += list.filter((c) => c.icon || c.img).length;
    images += list.filter((c) => c.img).length;
    covered++;
    if (inspectId === doc.id)
      for (const c of list)
        console.log(
          "  = " +
            String(c.t).padStart(6) +
            "  " +
            c.w +
            (c.img ? "  [image " + c.img + "]" : c.icon ? "  [" + c.icon + "]" : ""),
        );
  }
}

/**
 * Which of a lesson's cues are drawn rather than written.
 *
 * Decided across the finished lesson rather than cue by cue, because the
 * cue-by-cue version handed the drawing to whichever idea happened to
 * come first: on the standing ovation lesson "grief" took the heart and
 * the rule against two drawings running then denied "roller coaster" the
 * one thing in the lesson that most wanted a picture.
 *
 * So the whole list is ranked by how well a drawing would serve it, and
 * the strongest few are drawn, subject to three limits - a lesson stays
 * mostly words, no two drawings run back to back, and no drawing repeats
 * within a lesson, since the same heart twice reads as a stutter exactly
 * the way a repeated word does.
 */
function assignForms(list) {
  const drawable = list
    .map((cue, index) => {
      const image = imageFor(cue.phrase, ROOT);
      const icon = iconFor(cue.phrase);
      // An image beats an icon; a concept named in full ("roller
      // coaster") beats a bare one ("grief"), which in turn beats one
      // merely recognized from a single word inside a longer phrase.
      const named = Boolean(ICONS[cue.phrase] || IMAGES[cue.phrase]);
      const rank = image
        ? 4
        : named && cue.phrase.includes(" ")
          ? 3
          : named
            ? 2
            : icon
              ? 1
              : 0;
      return { index, image, icon, rank };
    })
    .filter((d) => d.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.index - b.index);

  const budget = Math.floor(list.length * GLYPH_SHARE);
  const used = new Set();
  let drawn = 0;

  for (const d of drawable) {
    if (drawn >= budget) break;
    const neighbours = [list[d.index - 1], list[d.index + 1]];
    if (neighbours.some((n) => n && (n.icon || n.img))) continue;
    if (d.image) {
      if (used.has(d.image)) continue;
      list[d.index].img = d.image;
      used.add(d.image);
    } else {
      if (used.has(d.icon)) continue;
      list[d.index].icon = d.icon;
      used.add(d.icon);
    }
    drawn++;
  }

  // The phrase was only ever scaffolding for this decision.
  for (const cue of list) delete cue.phrase;
}

writeFileSync(
  join(ROOT, "src/data/lesson-cues.json"),
  JSON.stringify(cues) + "\n",
);

if (!inspectId)
  console.log(
    covered +
      "/" +
      docs.length +
      " videos, " +
      totalCues +
      " cues (" +
      glyphs +
      " drawn, of which " +
      images +
      " images), " +
      (JSON.stringify(cues).length / 1024).toFixed(1) +
      " KB",
  );


