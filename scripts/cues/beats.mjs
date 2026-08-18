// Finding the moments in a lesson where a point is being made.
//
// A lesson isn't a flat stretch of talking. It has beats: the teacher
// sets something up, lands it, gives you the rule, and moves on. Those
// landings are the only places worth putting something on screen - the
// rest is connective tissue, and a word floating over connective tissue
// is noise the viewer has to ignore.
//
// This module turns a lesson's Whisper segments into scored beats. It
// says nothing about *what* to show, only *when* the teacher is making a
// point and how strongly - the engine decides what goes there.

import { CONCRETE, EMPHASIS, FELT } from "./lexicon.mjs";

/**
 * Whisper's segments break on breath, not on sense, so they're re-joined
 * into sentences before anything is read from them: "It's not about what
 * you say." and "It's about how you say it." are two points, while a
 * segment boundary lands mid-clause and is one of neither.
 *
 * Each sentence keeps the time its first word was spoken, which is what
 * a cue is eventually timed against.
 */
export function sentencesOf(segments) {
  const out = [];
  let text = "";
  let start = null;
  let end = 0;

  for (const seg of segments) {
    const raw = seg.text.trim();
    if (!raw) continue;
    if (start === null) start = seg.start;
    end = seg.end;
    text = text ? text + " " + raw : raw;
    // Whisper punctuates reliably; a segment ending mid-sentence carries
    // no terminal mark and simply accumulates into the next one.
    if (/[.!?]["')\]]?$/.test(raw)) {
      out.push({ text, start, end });
      text = "";
      start = null;
    }
  }
  if (text && start !== null) out.push({ text, start, end });
  return out;
}

/** Bare lowercase words, for reading a sentence's imagery. */
function wordsOf(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * How strongly a sentence reads as a point being made, plus which
 * rhetorical moves earned it - the moves are carried through so a lesson
 * can be inspected and argued with rather than just trusted.
 *
 * A lookahead move (the rhetorical question) scores the *next* sentence
 * instead of its own, since the answer is the point.
 */
export function scoreBeats(sentences) {
  const beats = sentences.map((s) => ({
    ...s,
    emphasis: 0,
    moves: [],
  }));

  sentences.forEach((s, i) => {
    for (const move of EMPHASIS) {
      if (!move.re.test(s.text)) continue;
      const target = move.lookahead ? i + 1 : i;
      if (target >= beats.length) continue;
      beats[target].emphasis += move.weight;
      beats[target].moves.push(move.lookahead ? move.name + "->" : move.name);
    }

    // Painting is emphasis too, and the kind the patterns above miss
    // entirely. When the teacher stacks images and feelings - "the depths
    // of your pain, your grief or sorrow, and then your triumph and
    // elation" - he is making his point by making you feel it, without a
    // single "remember" or "the key is" to announce it. Two such words in
    // one sentence is a coincidence; four is a passage written to land.
    const vivid = wordsOf(s.text).filter(
      (w) => CONCRETE.has(w) || FELT.has(w),
    ).length;
    if (vivid >= 2) {
      beats[i].emphasis += Math.min(2.6, 0.75 * vivid);
      beats[i].moves.push("vivid:" + vivid);
    }
  });

  // A lesson opens by naming what it's about and closes by restating it.
  // Both are points by position rather than by wording, and both are
  // where a viewer most needs the idea in writing.
  if (beats.length) {
    beats[0].emphasis += 1.4;
    beats[0].moves.push("opening");
    const last = beats[beats.length - 1];
    last.emphasis += 1.2;
    last.moves.push("closing");
  }

  return beats;
}

/**
 * A lesson should feel evenly punctuated rather than front-loaded, so
 * the lesson is cut into stretches of roughly `every` seconds and each
 * one offers up the points inside it, strongest first.
 *
 * A stretch hands back a short list rather than a single winner because
 * the strongest point isn't always sayable: "Remember, it's not about
 * what you say" is the most emphatic sentence in the standing ovation
 * lesson and every word in it is a stopword. The engine walks the list
 * until something can be shown, and a stretch holding nothing but
 * connective tissue stays empty - silence beats a word that isn't a
 * point.
 */
export function slotsOf(beats, { every, floor, depth = 3 }) {
  if (!beats.length) return [];
  const duration = beats[beats.length - 1].end;
  const count = Math.max(1, Math.round(duration / every));
  const width = duration / count;
  const slots = [];

  for (let i = 0; i < count; i++) {
    const from = i * width;
    const inSlot = beats
      .filter(
        (b) => b.start >= from && b.start < from + width && b.emphasis >= floor,
      )
      .sort((a, b) => b.emphasis - a.emphasis)
      .slice(0, depth);
    if (inSlot.length) slots.push(inSlot);
  }
  return slots;
}
