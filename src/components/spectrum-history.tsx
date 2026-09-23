import { categories } from "@/data/categories";
import type { Attempt } from "@/lib/store";

// What has changed in each color since the student started, said in
// words and a number.
//
// This used to be a row of stacked color blocks, one column per
// attempt - a chart that looked like data and told you almost nothing.
// Counting how many blocks were in the third column and comparing it
// with the seventh is work, and the answer, once you had done it, was
// a number with no meaning attached: "five".
//
// A student wants to know which of their skills got better and by how
// much. So that is what this says, one line per color, largest gain
// first: "Storytelling up 13 points". The colors that moved are the
// story; the ones that held are worth seeing too, because holding is
// not the same as falling; and the ones that slipped are said plainly,
// because a record that only reports good news isn't a record.
//
// Points, not percentages, because the spectrum is scored 0-100 per
// color and "up 13 points" is what actually happened. "Up 13%" would
// be a different and wrong number.

/** The average of a color across some takes - a single take is noisy,
 *  and the question is where the student is, not what one video did. */
function averageOf(attempts: Attempt[], id: string): number {
  if (attempts.length === 0) return 0;
  const sum = attempts.reduce((n, a) => n + (a.spectrum[id as keyof typeof a.spectrum] ?? 0), 0);
  return sum / attempts.length;
}

export function SpectrumHistory({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-ink-muted">
        Two attempts and this fills in - it needs a before to show you an after.
      </p>
    );
  }

  // Where they started against where they are: the first third of the
  // road against the last third, so one unusual take cannot pretend to
  // be a trend in either direction.
  const span = Math.max(1, Math.floor(attempts.length / 3));
  const early = attempts.slice(0, span);
  const recent = attempts.slice(-span);

  const moves = categories
    .map((cat) => {
      const then = averageOf(early, cat.id);
      const now = averageOf(recent, cat.id);
      return { cat, then, now, delta: Math.round(now - then) };
    })
    .sort((a, b) => b.delta - a.delta);

  const risen = moves.filter((m) => m.delta >= 3);
  const held = moves.filter((m) => m.delta > -3 && m.delta < 3);
  const slipped = moves.filter((m) => m.delta <= -3);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-ink-faint">
          Since you started
        </span>
        <span className="text-[0.65rem] tabular-nums text-ink-faint">
          {early.length === 1 ? "first take" : `first ${early.length}`} vs{" "}
          {recent.length === 1 ? "latest" : `latest ${recent.length}`}
        </span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {moves.map(({ cat, delta, now }) => {
          const up = delta >= 3;
          const down = delta <= -3;
          return (
            <li
              key={cat.id}
              className="flex items-center gap-3 rounded-xl border border-navy-600 bg-navy-900/50 px-3 py-2.5"
            >
              <span className={`size-2.5 shrink-0 rounded-full ${cat.bgClass}`} />
              <span className="min-w-0 flex-1 text-sm text-ink">
                <b className={`font-semibold ${cat.textClass}`}>{cat.name}</b>{" "}
                <span className="text-ink-muted">
                  {up ? "increased by" : down ? "dropped by" : "stayed about the same"}
                </span>
                {!up && !down ? "" : <b className="pl-1 font-semibold tabular-nums text-ink">{Math.abs(delta)} points</b>}
              </span>
              {/* Where it sits now, so a big gain from nothing and a
                  small gain from something high read differently. */}
              <span className="shrink-0 text-xs tabular-nums text-ink-faint">{Math.round(now)}/100</span>
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold ${
                  up ? cat.textClass : down ? "text-storytelling" : "text-ink-faint"
                }`}
                aria-hidden
              >
                {up ? "▲" : down ? "▼" : "–"}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-ink-muted text-balance">
        {risen.length > 0
          ? `${risen.length === 1 ? "One color has" : `${risen.length} colors have`} grown since you started${
              risen[0] ? ` - most of all ${risen[0].cat.name.toLowerCase()}, up ${risen[0].delta} points` : ""
            }.${slipped.length > 0 ? ` ${slipped[0].cat.name} has slipped; worth a take that leans on it.` : ""}`
          : held.length === categories.length
            ? "Every color is holding where it was. A challenge that asks for something you haven't used yet will move one."
            : "Nothing has grown yet - which is what the next take is for."}
      </p>
    </section>
  );
}
