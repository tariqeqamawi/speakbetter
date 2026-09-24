import { type Phrase } from "@/components/talking-lion";

// One line of what Coach is saying, with the word he is on lit.
//
// WHY NOT A PARAGRAPH. Everywhere Coach speaks, the whole sentence used
// to sit on screen while the voice worked through it - which asks
// somebody to read and listen to different words at the same time.
// Reading is faster, so they finish, look away, and miss whatever was
// being said or pointed at. One line at a time, with the spoken word
// lit, keeps the eye on the word the ear is on.
//
// It is the same treatment a coaching review gets, deliberately. A
// student meets it in their first minute in the app and recognises it
// later when it is their own take being talked about.
//
// THE FALLBACK IS THE WHOLE LINE, and it matters more than it looks.
// A browser can refuse to autoplay, a clip can 404, and a student can
// be on a train with no sound - and none of those may be allowed to
// mean they never find out what to do next. With no clock to follow,
// captions would be a blank space where the instruction used to be,
// which is worse than the paragraph they replaced. So: phrase if there
// is one, the full line if there is not.

export function Caption({
  phrase,
  word,
  line,
  /** Headline size - for a screen where the words ARE the screen. */
  big = false,
  className = "",
}: {
  phrase?: Phrase;
  word: number;
  line?: string;
  big?: boolean;
  className?: string;
}) {
  if (!phrase) {
    return (
      <p
        className={`text-ink-muted text-balance ${
          big ? "text-base leading-relaxed" : "text-sm leading-snug"
        } ${className}`}
      >
        {line}
      </p>
    );
  }
  return (
    <p
      // Keyed by the phrase so each new line replays its entrance
      // rather than crossfading into the last one.
      key={phrase.text}
      className={`coach-cue text-balance font-semibold ${
        big ? "text-xl leading-snug sm:text-2xl" : "text-base leading-snug"
      } ${className}`}
    >
      {phrase.words.map((w, i) => (
        <span
          key={i}
          className={`inline-block origin-bottom mx-[0.2em] transition-[transform,color] duration-150 ${
            i === word
              ? `caption-live scale-[1.14] ${phrase.colorClass}`
              : i < word
                ? "text-ink"
                : "text-ink-faint"
          }`}
        >
          {w.text}
        </span>
      ))}
    </p>
  );
}
