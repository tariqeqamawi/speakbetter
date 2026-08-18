import Image from "next/image";
import { cueIcons } from "@/components/cue-icons";
import cueTable from "@/data/lesson-cues.json";
import transcripts from "@/data/transcripts.json";
import { lessons } from "@/data/lessons";
import { categories } from "@/data/categories";
import type { LessonCue } from "@/lib/lesson-cues";

// Prototype route - not part of the student experience. The cue engine
// decides what appears on screen for 121 lessons, and the only other way
// to judge that is to watch 121 videos. This lays every lesson's cues out
// on its own timeline so a bad one can be spotted in seconds and argued
// with by name: `npm run build:cues -- --inspect <vimeoId>` prints why
// that lesson chose what it chose.

export const metadata = { title: "Cue engine" };

const cues = cueTable as Record<string, LessonCue[]>;

const categoryOf = new Map(lessons.map((l) => [l.vimeoId, l.category]));
const titleOf = new Map(lessons.map((l) => [l.vimeoId, l.title]));

interface Row {
  id: string;
  title: string;
  duration: number;
  color: string;
  list: LessonCue[];
}

const rows: Row[] = transcripts
  .map((entry) => {
    const category = categoryOf.get(entry.id);
    return {
      id: entry.id,
      title: titleOf.get(entry.id) ?? entry.title,
      duration: entry.segments?.at(-1)?.end ?? 0,
      color: category ? `var(--color-${category})` : "#8b93a7",
      list: cues[entry.id] ?? [],
    };
  })
  .filter((r) => r.duration > 0);

const totalCues = rows.reduce((n, r) => n + r.list.length, 0);
const drawn = rows.reduce(
  (n, r) => n + r.list.filter((c) => c.icon || c.img).length,
  0,
);
const silent = rows.filter((r) => !r.list.length).length;
const minutes = rows.reduce((n, r) => n + r.duration, 0) / 60;

// How often the course puts the same idea on screen. A healthy course
// shows a lot of different things; a phrase near the top of this list is
// either a genuinely central idea or a hole in the engine's novelty rule.
const repeats = new Map<string, number>();
for (const row of rows)
  for (const cue of row.list) repeats.set(cue.w, (repeats.get(cue.w) ?? 0) + 1);
const repeated = [...repeats.entries()]
  .filter(([, n]) => n > 1)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 24);

function CueChip({ cue, color }: { cue: LessonCue; color: string }) {
  const Icon = cue.icon ? cueIcons[cue.icon] : undefined;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-navy-700 bg-navy-900 px-2 py-1">
      {cue.img ? (
        <Image src={cue.img} alt="" width={20} height={20} className="size-4" />
      ) : (
        Icon?.({ className: "size-4" })
      )}
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color }}
      >
        {cue.w}
      </span>
      <span className="text-[10px] tabular-nums text-ink-faint">{cue.t}s</span>
    </span>
  );
}

export default function CuePrototypePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 py-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-ink">Cue engine</h1>
        <p className="max-w-2xl text-sm text-ink-muted">
          What the player shows beside the teacher, and when. Every cue is a
          phrase he is speaking at that second, chosen because the sentence
          around it is making a point. Rebuild with{" "}
          <code className="text-ink-faint">npm run build:cues</code>.
        </p>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {[
            ["Cues", String(totalCues)],
            ["Drawn", `${drawn} of ${totalCues}`],
            ["Lessons", `${rows.length - silent} of ${rows.length}`],
            ["One every", `${(minutes * 60) / totalCues | 0}s`],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col">
              <dt className="text-xs uppercase tracking-wide text-ink-faint">
                {label}
              </dt>
              <dd className="font-semibold text-ink tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
          Shown in more than one lesson
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {repeated.length === 0 && (
            <span className="text-sm text-ink-muted">
              Nothing repeats - every lesson shows its own ideas.
            </span>
          )}
          {repeated.map(([phrase, n]) => (
            <span
              key={phrase}
              className="rounded-md border border-navy-700 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-ink-muted"
            >
              {phrase}
              <span className="ml-1.5 text-ink-faint">x{n}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        {rows.map((row) => (
          <article key={row.id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-sm font-semibold text-ink">{row.title}</h3>
              <span className="shrink-0 text-xs tabular-nums text-ink-faint">
                {row.list.length} cues · {Math.round(row.duration)}s
              </span>
            </div>

            {/* Where the cues fall across the lesson - a run of marks
                bunched at one end is a lesson the engine read unevenly. */}
            <div className="relative h-1.5 rounded-full bg-navy-800">
              {row.list.map((cue) => (
                <span
                  key={cue.t}
                  title={`${cue.w} @ ${cue.t}s`}
                  className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${Math.min(100, (cue.t / row.duration) * 100)}%`,
                    background: row.color,
                  }}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {row.list.length === 0 ? (
                <span className="text-xs text-ink-faint">
                  Nothing on screen - no sentence in this lesson read as a
                  point being made.
                </span>
              ) : (
                row.list.map((cue) => (
                  <CueChip key={cue.t} cue={cue} color={row.color} />
                ))
              )}
            </div>
          </article>
        ))}
      </section>

      <footer className="text-xs text-ink-faint">
        Colors follow each lesson&apos;s category:{" "}
        {categories.map((c) => c.name).join(" · ")}.
      </footer>
    </div>
  );
}
