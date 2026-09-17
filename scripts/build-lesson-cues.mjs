// The cue engine: what Speak Better puts on screen beside the teacher,
// and when.
//
// The rule it works to is simple to state and most of the difficulty is
// in honoring it: about every ten seconds, one complete thought from
// what the teacher is saying right now appears beside him - lifted word
// for word out of the captions, never paraphrased. A few of them arrive
// as a drawing instead, where a drawing says it faster.
//
// TWO THINGS THIS IS NOT
//
// Not a keyword track. A cue is a *thought* - a clause of his, three to
// nine words, that stands on its own: "find the scene that shows it",
// not FIND THE SCENE, and not SCENE. The engine used to lift the two or
// three most distinctive words out of a sentence, and the screen read
// as a list of topics. A clause reads as a point.
//
// Not subtitles either. The screen shows one thing he said, not
// everything he says: a clause chosen because it names the idea, and
// never the whole sentence when the sentence runs on.
//
// HOW IT RUNS
//
//   1. BEATS      cues/beats.mjs scores each sentence for how strongly
//                 it reads as a point being made - a weighting on the
//                 clauses inside it rather than a gate on whether the
//                 stretch gets a cue at all.
//   2. CANDIDATES every clause of his that could stand on screen as a
//                 thought, scored by the strongest idea inside it - how
//                 distinctive its vocabulary is to this lesson, and how
//                 showable (cues/lexicon).
//   3. CADENCE    a walk down the lesson taking the strongest unshown
//                 thought about every ten seconds. Where nothing
//                 showable is being said the gap stretches, rather than
//                 the bar dropping - silence beats a line that says
//                 nothing.
//   4. NOVELTY    an idea floats once per lesson and rarely across the
//                 course, so no two moments show the same thing twice.
//   5. TAKES      each slot keeps a couple of runners-up - different
//                 ideas from the same stretch - so a lesson watched
//                 twice shows different things. The player deals a
//                 fresh take every time playback starts from the top.
//   6. FORM       words, icon, or image - whichever carries the idea.
//
// Why the cadence pass replaced the beat gate: the old engine only spoke
// where the rhetoric marked a landing, which left a median gap of eleven
// seconds and stretches of a minute and a half with nothing on screen at
// all. A lesson is one to two minutes long and every second of it is
// about something.
//
// Run:     npm run build:cues
// Inspect: npm run build:cues -- --inspect 1081161473
// Output:  src/data/lesson-cues.json (checked in; loaded lazily)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { GLUE, ICONS, STOP, iconFor, iconKeyFor, vividness } from "./cues/lexicon.mjs";
import { scoreBeats, sentencesOf } from "./cues/beats.mjs";
import { IMAGES, imageFor } from "./cues/images.mjs";

// Phrases the interface can draw by name, whether or not the artwork for
// them has been made yet - a concept someone has already picked out.
const KNOWN = new Set([...Object.keys(ICONS), ...Object.keys(IMAGES)]);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const transcripts = JSON.parse(
  readFileSync(join(ROOT, "src/data/transcripts.json"), "utf8"),
);

// -- Tuning -----------------------------------------------------------
// The cadence: about one every ten seconds. A cue's fade runs 6s (see
// .float-word) - a clause takes longer to read than a pair of words -
// and the player shows one at a time, so MIN is also what stops one cue
// cutting the last one off. MAX is the promise; the gap goes past it
// only where nothing worth saying whole is being said.
const MIN_GAP = 8;
const MAX_GAP = 13;
// The bar a phrase clears to be worth the screen. Set low, and
// deliberately: a phrase scores low mostly for being made of words the
// whole course uses, and on a lesson whose subject *is* one of those
// words - "share a story", on the lesson about retelling someone
// else's - the low scorers are the lesson. What the floor is really
// keeping out is the phrase whose words nobody chose, and those sit
// well below this. Raising it to 1.15 bought 4% fewer cues in cadence
// and cost the thin lessons everything they had.
const CUE_FLOOR = 0.65;
// A point worth lifting whole even when its words are all stopwords.
const VERBATIM_EMPHASIS = 2.5;
const LEAD = 0.25; // appear a beat before the words land
/** The longest run of his words an *idea* may span - the phrase inside
    a clause that decides how strong the clause is. */
const PHRASE_MAX = 5;
// The shape of a thought. Under three words it's a label, not a
// thought; past ten it's a sentence to read instead of watching him,
// and past sixty-odd characters it no longer fits the margin beside him
// in four lines.
const CLAUSE_MIN = 3;
const CLAUSE_MAX = 10;
const CLAUSE_CHARS = 58;
// How far either side of its slot a runner-up may fall. The slot is
// five seconds wide and a thought is a few seconds long, so held to the
// slot exactly most had no runner-up at all. The player keeps the takes
// it deals from crowding each other.
const ALT_SLACK = 3;
// Runners-up kept per slot, so a second viewing can show something
// else. Two: with the first choice that's three takes on each moment,
// and a lesson watched three times has run out of new things to say.
const ALTS = 2;
// An idea floats once a lesson. The exception, and only where the
// alternative is a hole in the cadence: an idea he comes back to this
// long afterwards, in different words, reads as a callback rather than
// as the screen stuttering.
const RECALL = 30;

const REUSE_DECAY = 0.55; // how hard a course-wide repeat is penalized
// Most of a lesson is words now, so the drawings are rarer - and the
// ones that remain are the ideas that most wanted a picture.
const GLYPH_SHARE = 0.18;

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
 * Every phrase a stretch of speech could offer.
 *
 * A phrase is a *contiguous run of the teacher's own words*, cut to
 * three rules: it opens on a real word, it closes on a real word, and it
 * is at most PHRASE_MAX words long. Everything between the ends comes
 * along whether it carries an idea or not, because that's what makes it
 * his sentence and not a phrase assembled out of it - "the depths of
 * your pain" survives whole instead of coming apart into "depths" and
 * "pain".
 *
 * The first version of this rule let only glue sit inside a phrase, and
 * it starved: most of what a speaking teacher says is made of ordinary
 * words, so two showable words with nothing but glue between them turn
 * up a handful of times in a whole lesson. A fifty-second lesson offered
 * exactly one phrase. What a phrase must not do is *straddle a clause* -
 * that's handled a level up, where the text is cut on punctuation before
 * it ever gets here.
 *
 * Two content words is the floor. One word gestures at an idea without
 * naming it - JOURNEY could be anything, EMOTIONAL JOURNEY is the point
 * - and a screen of single words reads as a keyword cloud rather than as
 * somebody following the talk.
 */
function phrasesFrom(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!isContent(tokens[i])) continue;
    let content = 0;
    for (let j = i; j < tokens.length && j - i < PHRASE_MAX; j++) {
      if (!isContent(tokens[j])) continue;
      content++;
      if (j > i && content >= 2) out.push(tokens.slice(i, j + 1).join(" "));
    }
  }
  return out;
}

// Function words stay lowercase in a title; "your" is a real word and
// keeps its capital. Only matters where cues are read as text - the
// player renders them uppercase.
const MINOR = new Set([
  "to", "of", "the", "in", "on", "for", "a", "an", "and", "or", "at",
  "by", "as", "is", "are", "was", "be", "it", "its", "that", "this",
  "with", "from", "into", "but", "so", "if", "you", "we", "they",
]);

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

// -- Thoughts ---------------------------------------------------------

/**
 * Words a thought can't end on. A clause that stops on one of these
 * was cut mid-idea - "the depths of" is a run-up, not a point.
 */
const NO_END = new Set([
  "a", "an", "the", "of", "to", "and", "or", "but", "nor", "with", "for",
  "in", "on", "at", "by", "from", "into", "onto", "than", "as", "that",
  "which", "who", "whom", "whose", "is", "are", "was", "were", "be",
  "been", "being", "am", "if", "so", "because", "when", "while", "very",
  "really", "just", "then", "your", "my", "their", "our", "his", "her",
  "its", "this", "these", "those", "some", "any", "every", "each", "more",
  "most", "no", "not", "about", "like", "how", "what", "where", "why",
  "i", "we", "he", "she", "they", "i'm", "i've", "i'll", "you're",
  "you've", "we're", "we've", "it's", "that's", "there's", "can", "could",
  "will", "would", "should", "might", "may", "must", "do", "does", "did",
  "have", "has", "had", "get", "got", "gets", "going", "gonna", "wanna",
]);

/** Words a thought can't open on - the tail of some other thought. */
const NO_START = new Set([
  "it", "here", "there", "of", "and", "or", "but", "nor", "than", "as", "that", "which", "whom",
  "whose", "with", "for", "at", "by", "from", "into", "onto", "is", "are",
  "was", "were", "so", "because", "if", "then", "also", "too", "either",
]);

/**
 * What he starts a clause with before getting to it. Stripped from the
 * front so "and so what you want to do is find the scene" opens on the
 * thought rather than on the throat-clearing; a thought that's still
 * too long after that is split, not trimmed further.
 */
const LEAD_IN =
  /^(?:(?:and|so|but|because|now|well|then|okay|ok|right|like|you know|i mean|which means|that means|again|also|yeah|yes|no|oh|actually|basically|literally|really|just|alright|all right|not only that|on top of that|the thing is|here's the thing)\s+)+/;
const TRAIL_OFF = /(?:\s+(?:right|okay|ok|you know|yeah|though))+$/;

/**
 * The joining words. Whisper puts a comma where he paused, but he
 * pauses less than he joins - most of his sentences are "... and ...
 * and ... and ...", one breath, three thoughts. So a clause is cut at
 * these too, and the units between them are what thoughts are built
 * from.
 */
const JOINS = new Set([
  "and", "but", "because", "which", "that", "then", "when", "while",
  "where", "or", "if",
]);

/** Joins that as often introduce a relative clause as a new thought. */
const RELATIVE = new Set(["that", "which"]);

/**
 * Words a thought may begin after, inside a unit. He doesn't pause or
 * join inside "the way you do that is by taking the audience on an
 * emotional journey", but there's a thought starting after "by" all the
 * same. A run may open on the word after one of these - at a small
 * cost against a run that opens where he actually drew breath - but it
 * still has to close where he did: a thought cut short in front of a
 * preposition ("create the structures that you're talking") or a verb
 * ("your hands express visually what your mouth") is the one thing the
 * screen must never show, and there was no list of words safe to stop
 * before.
 */
const HINGES = new Set([
  "to", "of", "by", "into", "in", "on", "at", "for", "with", "from",
  "about", "like", "as", "than", "means", "called", "through", "without",
  "toward", "towards", "onto", "over", "under", "before", "after",
]);

/**
 * Every run of his words in a sentence that could stand on screen as a
 * thought.
 *
 * Whisper punctuates reliably, so his clauses are already marked: split
 * on the marks, strip the lead-in, and what's left is a stretch he
 * delivered as one unit of sense. That stretch is cut again at every
 * joining word into units. A thought is a run of his words that opens
 * at the start of a unit - or just after a hinge word inside one - and
 * closes at the end of a unit; the joins between units come along, the
 * join in front is dropped. Then the
 * shape rules: three to nine words, at least two that carry an idea,
 * opening and closing on words a thought can open and close on.
 *
 * "A standing ovation is where you finish your talk and everybody
 * stands up out of their chair and claps for you" offers "a standing
 * ovation is where you finish your talk", "everybody stands up out of
 * their chair", "everybody stands up out of their chair and claps for
 * you", "where you finish your talk" - and not "finish your talk and
 * everybody", because a run can't end inside a unit.
 *
 * Each run says how it was cut: `whole` opened and closed where he
 * drew breath, `hinged` opened at a hinge inside a unit. The score
 * prefers the former; the latter is what keeps a long, join-free run
 * of his from offering nothing at all.
 */
function clausesOf(text) {
  const out = [];
  const pieces = text
    .replace(/[\u2014\u2013]|\s-\s/g, ",")
    .split(/[,.;:!?()"]+/);
  for (const piece of pieces) {
    const trimmed = piece
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .trim()
      .replace(LEAD_IN, "")
      .replace(TRAIL_OFF, "");
    const tokens = tokenize(trimmed);
    if (!tokens.length) continue;

    // The piece as one flat run, with the boundaries marked: where a
    // unit begins (after a join, or at the front), and where a thought
    // may also open (after a hinge).
    const unitStart = new Set([0]);
    for (let k = 1; k < tokens.length; k++)
      if (JOINS.has(tokens[k - 1])) unitStart.add(k);
    const isJoin = (k) => JOINS.has(tokens[k]);

    for (let i = 0; i < tokens.length; i++) {
      // Opens at a unit start, or after a hinge. Never on a join itself.
      // A unit that follows "that" or "which" is as often a relative
      // clause as a new thought - "the process that | we're going
      // through here" - so opening there counts as a hinge, not a
      // breath: allowed, at the same small cost.
      const opensWhole =
        unitStart.has(i) && (i === 0 || !RELATIVE.has(tokens[i - 1]));
      const opensHinged =
        i > 0 && (HINGES.has(tokens[i - 1]) || RELATIVE.has(tokens[i - 1]));
      if (!opensWhole && !opensHinged) continue;
      if (isJoin(i)) continue;

      for (let j = i; j < tokens.length && j - i < CLAUSE_MAX; j++) {
        // Closes at a unit end: before a join, or at the back. Never on
        // a join itself.
        const next = tokens[j + 1];
        if (!(next === undefined || JOINS.has(next))) continue;
        if (isJoin(j)) continue;

        const run = tokens.slice(i, j + 1);
        const clause = run.join(" ");
        if (clause.length > CLAUSE_CHARS) break;
        if (run.length < CLAUSE_MIN) continue;
        if (NO_START.has(run[0]) || NO_END.has(run[run.length - 1])) continue;
        if (run.filter(isContent).length < 2) continue;
        out.push({
          clause,
          // The whole stretch between two of his pauses, as he said it.
          whole: i === 0 && j === tokens.length - 1,
          hinged: !opensWhole,
        });
      }
    }
  }
  return out;
}

/**
 * The thoughts a beat offers, each scored by the strongest idea in it.
 *
 * A clause is worth what the best phrase inside it is worth - the
 * vocabulary that makes it this lesson's, judged exactly as before
 * (candidatesFor) - and then shaped: five to eight words is the natural
 * length of a spoken point, either side of that costs a little, a
 * stretch he delivered whole between two pauses is worth a little more
 * than a run cut out of one, and a run cut at a hinge inside a unit a
 * little less. The clause carries the phrase's score into the walk, and
 * its own words into the ledger, so the novelty rules see the whole
 * thought.
 */
function thoughtsFor(doc, beat, ledger) {
  const out = [];
  const seen = new Set();
  for (const { clause, whole, hinged } of clausesOf(beat.text)) {
    if (seen.has(clause)) continue;
    seen.add(clause);
    const inner = candidatesFor(doc, { ...beat, text: clause }, ledger);
    if (!inner.length) continue;
    const n = clause.split(" ").length;
    const shape = n < 4 ? 0.85 : n === 4 ? 0.95 : n > 8 ? 0.95 : 1;
    const cut = whole ? 1.08 : hinged ? 0.9 : 1;
    out.push({
      phrase: clause,
      score: inner[0].score * shape * cut,
      vivid: inner[0].vivid,
      df: inner[0].df,
    });
  }
  return out.sort((a, b) => b.score - a.score);
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
  const text = entry.text ?? "";
  const tf = new Map();
  for (const p of phrasesOfText(text)) tf.set(p, (tf.get(p) ?? 0) + 1);
  return {
    id: entry.id,
    title: entry.title ?? "",
    tf,
    stems: new Set(tokenize(text).filter(isContent).map(stem)),
    segments: entry.segments ?? [],
  };
});

const df = new Map();
const wordDf = new Map();
for (const d of docs) {
  for (const p of d.tf.keys()) df.set(p, (df.get(p) ?? 0) + 1);
  for (const w of d.stems) wordDf.set(w, (wordDf.get(w) ?? 0) + 1);
}
const N = docs.length;

/**
 * How distinctive a word is to the lesson saying it.
 *
 * Counted by word rather than by phrase, which is a change forced by
 * dropping single-word cues: almost every three-word run of speech is
 * unique to the lesson that says it, so phrase-level document frequency
 * scores a passing aside exactly level with the lesson's own image and
 * separates nothing. The rarest word in a phrase still separates them.
 */
function wordIdf(word) {
  return Math.log(N / (wordDf.get(stem(word)) ?? 1));
}

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

    const words = phrase.split(" ").filter(isContent);
    // Only the words that carry the idea are judged for being names -
    // "I" is capitalized in every sentence it appears in and reads as
    // the most proper noun in the course, and testing the small words
    // threw out every phrase he says in the first person.
    if (words.some((w) => properNouns.has(w))) continue;
    // "Metaphor a metaphor" - the speaker restating, not a phrase.
    if (new Set(words).size !== words.length) continue;

    const vivid = Math.max(...words.map(vividness));
    const documentFreq = df.get(phrase) ?? 1;

    // The rarest word in the phrase is what makes the phrase this
    // lesson's rather than the course's; saying it more than once is the
    // teacher telling you it matters, but only a little - a cue track
    // that rewards repetition ends up repeating itself.
    const idf = Math.max(...words.map(wordIdf));
    let score =
      (1 + 0.5 * Math.log(doc.tf.get(phrase) ?? 1)) * (0.5 + idf) * vivid;
    // Two content words name an idea and three often name it better.
    // Past that a phrase is a clause, and a clause in the margin of a
    // video is something to read instead of watching him.
    score *= words.length === 2 ? 1 : words.length === 3 ? 1.06 : 0.78;
    // The small words earn their place when they hold one picture
    // together - "the depths of your pain" - and cost when they're only
    // the run-up to it, so a phrase padded with them starts behind a
    // clean pair.
    const filler = phrase.split(" ").length - words.length;
    score *= 1 - Math.min(filler, 3) * 0.11;
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

/**
 * Every word the lesson speaks, in order, with the second it lands.
 *
 * One flat stream rather than a list of segments, for two reasons.
 *
 * Whisper times a segment, not a word, and a segment runs three to five
 * seconds; at a cue every five, landing a phrase at the top of its
 * segment puts the words on screen before he says them. So each word is
 * placed by its share of the segment - even speech is a good enough
 * model at this resolution.
 *
 * And phrases are built out of whole sentences while segments break on
 * breath, so a phrase crosses a segment boundary all the time. Searched
 * segment by segment, every one of those came back unfindable and was
 * dropped - which was most of a lesson's material and the reason the
 * first run at this cadence still had minute-long silences in it.
 */
function timeline(segments) {
  const out = [];
  for (const seg of segments) {
    const tokens = tokenize(seg.text);
    const span = seg.end - seg.start;
    for (let i = 0; i < tokens.length; i++)
      out.push({ w: tokens[i], t: seg.start + (i / tokens.length) * span });
  }
  return out;
}

/** The second at which the phrase is spoken, within the beat's window. */
function spokenAt(line, phrase, from, to) {
  const words = phrase.split(" ");
  for (let i = 0; i + words.length <= line.length; i++) {
    if (line[i].t < from) continue;
    if (line[i].t > to) return null; // in order, so the rest are later
    let hit = true;
    for (let k = 0; k < words.length; k++)
      if (line[i + k].w !== words[k]) {
        hit = false;
        break;
      }
    if (hit) return line[i].t;
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

  // Built once: spokenAt runs a few hundred times per lesson.
  const spoken = timeline(doc.segments);
  const beats = scoreBeats(sentencesOf(doc.segments));
  const duration = doc.segments[doc.segments.length - 1].end;

  if (inspectId === doc.id) console.log("\n" + doc.title + "\n");

  // Everything the lesson could put on screen, each with the second
  // it's actually spoken. Scored against the ledger as it stood when
  // the lesson began, so nothing is re-ranked halfway down its own
  // lesson by what the lesson itself has shown.
  const pool = [];
  for (const beat of beats) {
    for (const c of thoughtsFor(doc, beat, ledger)) {
      const at = spokenAt(spoken, c.phrase, beat.start - 0.4, beat.end + 0.4);
      if (at === null) continue;
      pool.push({ ...c, t: Math.max(0, at - LEAD) });
    }
  }
  pool.sort((a, b) => a.t - b.t);

  if (inspectId === doc.id) {
    console.log(
      "  " +
        pool.length +
        " thoughts offered over " +
        duration.toFixed(0) +
        "s, " +
        pool.filter((c) => c.score >= CUE_FLOOR).length +
        " above the floor. The strongest:",
    );
    for (const c of [...pool].sort((a, b) => b.score - a.score).slice(0, 14))
      console.log(
        "     " +
          c.t.toFixed(1).padStart(6) +
          "  " +
          present(c.phrase).padEnd(34) +
          c.score.toFixed(2),
      );
    console.log("");
    console.log("  Chosen:");
  }

  const spentAt = new Map(); // stem -> when it last reached the screen
  const said = new Set(); // lines lifted whole, so none is lifted twice
  const used = new Set(); // phrases already taken
  const list = [];
  const windows = []; // per cue, the stretch it was chosen from

  /**
   * Whether an idea in this phrase has been on screen inside `within`
   * seconds of `at`.
   *
   * Judged by stem, because barring only the exact phrase pushes the
   * engine toward a clumsier way of saying the very thing it was
   * avoiding: "roller coaster" gets spent, so "coaster of emotion"
   * walks in. Normally `within` is the whole lesson - an idea floats
   * once. See RECALL for the one place that softens.
   */
  const repeats = (phrase, at, within) =>
    phrase.split(" ").some((w) => {
      if (!isContent(w)) return false;
      const last = spentAt.get(stem(w));
      return last !== undefined && at - last < within;
    });

  const eligible = (c, within) =>
    !used.has(c.phrase) &&
    c.score >= CUE_FLOOR &&
    !repeats(c.phrase, c.t, within);

  /**
   * The best thing he says between `from` and `to`.
   *
   * Weighted toward the near edge of the window. Taking the strongest
   * phrase wherever it falls sounds right and isn't: the strongest one
   * is at the far edge as often as not, and always taking it turns a
   * five-to-ten promise into a steady ten.
   */
  const bestIn = (from, to, within) => {
    let best = null;
    let bestValue = -Infinity;
    const span = Math.max(to - from, 0.001);
    for (const c of pool) {
      if (c.t < from) continue;
      if (c.t > to) break; // time-sorted, so the rest are later still
      if (!eligible(c, within)) continue;
      const value = c.score * (1.18 - 0.18 * ((c.t - from) / span));
      if (value > bestValue) {
        bestValue = value;
        best = c;
      }
    }
    return best;
  };

  /** The soonest thing he says after `from` that can be shown. */
  const nextAfter = (from, within) =>
    pool.find((c) => c.t >= from && eligible(c, within)) ?? null;

  // The walk: one cue every MIN_GAP to MAX_GAP seconds.
  let lastAt = -Infinity;
  for (;;) {
    const opened = lastAt === -Infinity;
    const from = opened ? 0 : lastAt + MIN_GAP;
    const to = (opened ? 0 : lastAt) + MAX_GAP;

    let pick = bestIn(from, to, Infinity);

    if (!pick) {
      // "It's not about what you say. It's about how you say it." is the
      // line the standing ovation lesson is built to land and there is
      // not one content word in it, so no amount of ranking vocabulary
      // will ever reach it. A window with nothing showable in it gets
      // one look for a line worth lifting whole.
      const beat = beats.find((b) => {
        const t = Math.max(0, b.start - LEAD);
        const quoted = t >= from && t <= to ? verbatimCue(b) : null;
        return quoted && !said.has(quoted);
      });
      if (beat) {
        const quoted = verbatimCue(beat);
        const t = Math.round(Math.max(0, beat.start - LEAD) * 10) / 10;
        list.push({ t, w: present(quoted), phrase: quoted });
        windows.push({ from, to });
        said.add(quoted);
        lastAt = t;
        if (inspectId === doc.id)
          console.log(
            "  " + t.toFixed(1).padStart(6) + "  " + present(quoted) + "  [verbatim]",
          );
        continue;
      }
      // Everything in the window is a return to something already shown.
      // Half a minute later, in his own different words, that reads as a
      // callback rather than a stutter - and it beats leaving the screen
      // empty for twenty seconds, which is the alternative.
      pick = bestIn(from, to, RECALL);
    }

    if (!pick) {
      // Nothing showable in the window at all. The gap stretches to the
      // next thing he says that names something, rather than the bar
      // dropping to whatever was nearest - silence beats a phrase that
      // means nothing on its own. A returning idea is taken instead only
      // when it saves a real hole.
      const strict = nextAfter(from, Infinity);
      const recalled = nextAfter(from, RECALL);
      pick =
        !strict || (recalled && recalled.t < strict.t - 2) ? recalled : strict;
    }
    if (!pick || pick.t > duration) break;

    const t = Math.round(pick.t * 10) / 10;
    list.push({ t, w: present(pick.phrase), phrase: pick.phrase });
    // The stretch this cue was chosen from. A cue that stretched past
    // the window is its own stretch - a runner-up has to be about the
    // same moment, not a moment ten seconds off.
    windows.push({ from: Math.min(from, pick.t), to: Math.max(to, pick.t) });
    used.add(pick.phrase);
    for (const w of pick.phrase.split(" ")) {
      if (!isContent(w)) continue;
      spentAt.set(stem(w), pick.t);
      ledger.set(stem(w), (ledger.get(stem(w)) ?? 0) + 1);
    }
    lastAt = pick.t;

    if (inspectId === doc.id)
      console.log(
        "  " +
          t.toFixed(1).padStart(6) +
          "  " +
          present(pick.phrase).padEnd(48) +
          pick.score.toFixed(2),
      );
  }

  if (list.length) {
    assignTakes(list, windows, pool);
    if (inspectId === doc.id) {
      console.log("\n  Other takes:");
      for (const cue of list)
        if (cue.alt)
          console.log(
            "  " +
              cue.t.toFixed(1).padStart(6) +
              "  " +
              cue.alt.map((a) => a.w).join("  |  "),
          );
    }
    assignForms(list);
    cues[doc.id] = list;
    totalCues += list.length;
    glyphs += list.filter((c) => c.icon || c.img).length;
    images += list.filter((c) => c.img).length;
    covered++;
  }
}

/**
 * A second and third thing to say at each slot, for the second and
 * third viewing.
 *
 * A runner-up is a thought from the same stretch of the lesson that
 * clears the floor and is about something else: it shares no idea, by
 * stem, with any first-take cue within RECALL seconds of it - not with
 * the cue it stands in for, and not with the one after either, because
 * the player deals each slot independently and a runner-up that echoed
 * the next cue would put the same idea up twice in a row. Further off
 * than that, an echo reads as a callback, the same allowance the walk
 * makes. Nor may it share an idea with another runner-up in the same
 * slot, for the same reason on a later viewing.
 *
 * The one allowance: the cue it stands in for. The strongest idea in a
 * stretch tends to be the only strong one, so every runner-up in the
 * stretch names it too, and a rule with no give here leaves most
 * slots with one take. A runner-up may share ideas with its own cue as
 * long as it brings at least two of its own - a different angle on the
 * point, not the point again in other clothes.
 */
function assignTakes(list, windows, pool) {
  const stemsOf = (phrase) => phrase.split(" ").filter(isContent).map(stem);
  const shownNear = (t, stems, except) =>
    list.some(
      (cue) =>
        cue !== except &&
        Math.abs(cue.t - t) < RECALL &&
        stemsOf(cue.phrase).some((x) => stems.includes(x)),
    );

  list.forEach((cue, i) => {
    const from = windows[i].from - ALT_SLACK;
    const to = windows[i].to + ALT_SLACK;
    const own = new Set(stemsOf(cue.phrase));
    const taken = new Set();
    const alts = [];
    for (const c of pool) {
      if (c.t < from) continue;
      if (c.t > to) break;
      if (c.score < CUE_FLOOR || c.phrase === cue.phrase) continue;
      const stems = stemsOf(c.phrase);
      if (stems.filter((x) => !own.has(x)).length < 2) continue;
      if (stems.some((x) => taken.has(x)) || shownNear(c.t, stems, cue))
        continue;
      alts.push(c);
      for (const x of stems) taken.add(x);
    }
    alts.sort((a, b) => b.score - a.score);
    if (alts.length)
      cue.alt = alts
        .slice(0, ALTS)
        .map((c) => ({ t: Math.round(c.t * 10) / 10, w: present(c.phrase) }));
  });
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
      // A concept named in full ("roller coaster") beats one recognized
      // from a single word inside the thought ("grief").
      const key = iconKeyFor(cue.phrase);
      const rank = image ? 4 : key && key.includes(" ") ? 3 : icon ? 1 : 0;
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


