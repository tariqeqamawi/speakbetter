"use client";

import { CoachCosts } from "@/components/admin/coach-costs";
import { useEffect, useMemo, useState } from "react";
import { challenges } from "@/data/challenges";
import { categories } from "@/data/categories";
import { FEATURE_NAME, sampleCohort, type Rating, type SampleCohort } from "@/data/admin-sample";
import { queued, REVIEW_RATINGS } from "@/lib/insights";
import { AdminFrame } from "@/components/admin/admin-frame";
import { CohortSpectrum, LIT_AT } from "@/components/admin/cohort-spectrum";

// Tariq's view of the cohort: how the app is used, where students stop,
// how good Coach's reviews are, what students say, what it all means -
// and any one student's whole journey, by number. Reads the sample
// cohort (data/admin-sample.ts) until the database is on; the shapes are
// the same, so only the source changes.

const TITLE = new Map(challenges.map((c) => [c.slug, c.title]));
const EMOJI: Record<Rating, string> = { "spot-on": "👌", partly: "🤏", off: "👎" };
const RATING_COLOR: Record<Rating, string> = { "spot-on": "bg-mindset", partly: "bg-storytelling", off: "bg-acting" };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "progress", label: "Cohort progress" },
  { id: "usage", label: "Usage" },
  { id: "dropoff", label: "Drop-off" },
  { id: "quality", label: "Coach quality" },
  { id: "costs", label: "Coach costs" },
  { id: "voice", label: "Voice of the student" },
  { id: "insights", label: "AI insights" },
  { id: "journey", label: "Student journeys" },
] as const;

export function InsightsDashboard() {
  const data = useMemo(() => sampleCohort(), []);
  const [local, setLocal] = useState(0);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the device's queue, read after hydration
  useEffect(() => setLocal(queued().length), []);

  return (
    <AdminFrame
      at="insights"
      title="Cohort insights"
      blurb="Every student is a number, never a name. No video is stored - only what was said, as text, and how the app was used."
      banner={
        <p className="w-fit rounded-full border border-storytelling/40 bg-storytelling/10 px-3 py-1 text-xs text-storytelling">
          Sample cohort - the real one appears here once the database is switched on. This device has queued {local}{" "}
          event{local === 1 ? "" : "s"} of its own.
        </p>
      }
      tabs={TABS}
      render={(tab) => {
        switch (tab) {
          case "overview":
            return <Overview data={data} />;
          case "progress":
            return (
              <div className="flex flex-col gap-6">
                <Progress data={data} />
                <Panel id="spectrum" title="The spectrum, first take → latest">
                  <CohortSpectrum data={data} />
                </Panel>
              </div>
            );
          case "usage":
            return <Usage data={data} />;
          case "dropoff":
            return <DropOff data={data} />;
          case "quality":
            return <Quality data={data} />;
          case "costs":
            return <CoachCosts data={data} />;
          case "voice":
            return <Voice data={data} />;
          case "insights":
            return <Insights data={data} />;
          case "journey":
            return <Journey data={data} />;
        }
      }}
    />
  );
}

export function Panel({ id, title, blurb, children }: { id: string; title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border border-navy-600 bg-navy-800 p-5">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {blurb && <p className="text-sm text-ink-muted">{blurb}</p>}
      </div>
      {children}
    </section>
  );
}

export function Stat({ value, label, accent = "text-ink" }: { value: string | number; label: string; accent?: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-navy-600 bg-navy-900/60 px-4 py-3">
      <b className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</b>
      <span className="text-xs text-ink-faint">{label}</span>
    </div>
  );
}

export const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

// ── Overview ──────────────────────────────────────────────────────────
function Overview({ data }: { data: SampleCohort }) {
  const last = data.days.slice(-7);
  const active = new Set(data.usage.filter((u) => last.includes(u.day)).map((u) => u.studentNo)).size;
  const rated = data.takes.filter((t) => t.rating);
  const spot = rated.filter((t) => t.rating === "spot-on").length;
  const minutes = Math.round(data.usage.reduce((s, u) => s + u.seconds, 0) / 60 / data.students.length);
  return (
    <Panel id="overview" title="Overview">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat value={data.students.length} label="students" />
        <Stat value={active} label="active this week" accent="text-mindset" />
        <Stat value={data.takes.length} label="challenge takes" />
        <Stat value={`${pct(spot, rated.length)}%`} label="reviews rated 👌 spot on" accent="text-storytelling" />
        <Stat value={data.questions.length} label="questions asked Coach" />
        <Stat value={minutes} label="minutes per student" />
      </div>
    </Panel>
  );
}

// ── Cohort progress ───────────────────────────────────────────────────
// The efficacy story: does speaking actually get better? Told two ways
// that don't flatter - the same students measured against themselves
// (first take against latest, so students who left early can't lift the
// average by leaving), and the cohort week by week, in score and in each
// of the seven colors.
function Progress({ data }: { data: SampleCohort }) {
  const [copied, setCopied] = useState(false);
  const p = useMemo(() => {
    const start = new Date(data.days[0]).getTime();
    const count = Math.ceil(data.days.length / 7);
    const weekOf = (at: string) => Math.min(count - 1, Math.floor((new Date(at).getTime() - start) / (7 * 86400000)));
    const weeks = Array.from({ length: count }, (_, w) => w).map((w) => data.takes.filter((t) => weekOf(t.at) === w));
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const weekScore = weeks.map((ts) => avg(ts.map((t) => t.score)));
    const weekColor = weeks.map((ts) =>
      Object.fromEntries(categories.map((c) => [c.id, avg(ts.map((t) => t.spectrum[c.id] ?? 0))])),
    );

    // Each student against themselves: first take and latest, for
    // everyone who recorded at least three.
    const paired = data.students
      .map((s) => data.takes.filter((t) => t.studentNo === s.number))
      .filter((ts) => ts.length >= 3)
      .map((ts) => ({ first: ts[0], last: ts.at(-1)! }));
    const gains = paired.map(({ first, last }) => last.score - first.score);
    const colorGain = categories
      .map((c) => ({
        c,
        first: avg(paired.map(({ first }) => first.spectrum[c.id] ?? 0)),
        last: avg(paired.map(({ last }) => last.spectrum[c.id] ?? 0)),
      }))
      .sort((a, b) => b.last - b.first - (a.last - a.first));
    const lit = (sp: Record<string, number>) => Object.values(sp).filter((v) => v >= LIT_AT).length;
    return {
      weekScore,
      weekColor,
      weekN: weeks.map((ts) => new Set(ts.map((t) => t.studentNo)).size),
      n: paired.length,
      firstAvg: avg(paired.map((x) => x.first.score)),
      lastAvg: avg(paired.map((x) => x.last.score)),
      improved: gains.filter((g) => g > 0).length,
      colorGain,
      litFirst: avg(paired.map((x) => lit(x.first.spectrum))),
      litLast: avg(paired.map((x) => lit(x.last.spectrum))),
    };
  }, [data]);

  const gain = p.lastAvg - p.firstAvg;
  const fastest = p.colorGain[0];
  const summary = [
    `Speak Better - cohort progress over ${p.weekScore.length} weeks (${p.n} students with 3+ recorded takes)`,
    `Average score: ${Math.round(p.firstAvg)} on their first take -> ${Math.round(p.lastAvg)} on their latest (+${Math.round(gain)} points, +${pct(gain, p.firstAvg)}%)`,
    `${pct(p.improved, p.n)}% of students improved`,
    `Colors lit: ${p.litFirst.toFixed(1)} -> ${p.litLast.toFixed(1)} of 8`,
    `Fastest-growing skill: ${fastest.c.name} (+${Math.round(fastest.last - fastest.first)})`,
    ...p.weekScore.map((v, i) => `Week ${i + 1}: average ${Math.round(v)} (${p.weekN[i]} students active)`),
  ].join("\n");

  return (
    <Panel
      id="progress"
      title="Is their speaking getting better?"
      blurb="Every student measured against their own first take, then the whole cohort week by week - in score and in each of the eight colors."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          value={`${Math.round(p.firstAvg)} → ${Math.round(p.lastAvg)}`}
          label="average score, first take → latest"
          accent="text-mindset"
        />
        <Stat value={`+${pct(gain, p.firstAvg)}%`} label={`improvement (+${Math.round(gain)} points)`} accent="text-mindset" />
        <Stat value={`${pct(p.improved, p.n)}%`} label={`of ${p.n} students improved`} accent="text-storytelling" />
        <Stat
          value={`${p.litFirst.toFixed(1)} → ${p.litLast.toFixed(1)}`}
          label="colors lit, of 8"
          accent="text-body-language"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Score, week by week. */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Average score by week</h3>
          <div className="flex h-56 items-end gap-4 border-b border-navy-600 px-2">
            {p.weekScore.map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <b className="text-lg tabular-nums">{Math.round(v)}</b>
                <div
                  className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-mindset/40 to-mindset"
                  style={{ height: `${v}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-4 px-2 text-center text-xs text-ink-faint">
            {p.weekN.map((n, i) => (
              <span key={i} className="flex-1">
                Week {i + 1}
                <br />
                {n} active
              </span>
            ))}
          </div>
          <p className="text-xs text-ink-faint">
            Later weeks count only the students still practising. The figures above compare each student with
            themselves, so they can&apos;t be lifted by who left.
          </p>
        </div>

        {/* The seven colors, week by week: four bars a color, faint to full. */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">The color spectrum by week</h3>
          <div className="flex h-56 items-end gap-3 border-b border-navy-600 px-1">
            {categories.map((c) => (
              <div key={c.id} className="flex h-full flex-1 items-end justify-center gap-[2px]">
                {p.weekColor.map((wc, w) => (
                  <div
                    key={w}
                    title={`${c.name}, week ${w + 1}: ${Math.round(wc[c.id])}`}
                    className="w-full max-w-3 rounded-t-sm"
                    style={{ height: `${wc[c.id]}%`, background: `var(--color-${c.id})`, opacity: 0.3 + (w / Math.max(1, p.weekColor.length - 1)) * 0.7 }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-3 px-1 text-center text-[0.65rem] leading-tight">
            {categories.map((c) => (
              <span key={c.id} className="flex-1" style={{ color: `var(--color-${c.id})` }}>
                {c.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-ink-faint">One bar a week for each color, week 1 (faint) to week {p.weekColor.length} (full).</p>
        </div>
      </div>

      {/* Each color's growth the way a student's own review shows the
          spectrum: first take dark, latest the full colored bar. */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Growth in each color - same students, first take → latest</h3>
        {p.colorGain.map(({ c, first, last }) => (
          <div key={c.id} className="grid grid-cols-[8rem_1fr_5.5rem] items-center gap-3 text-xs">
            <span style={{ color: `var(--color-${c.id})` }}>{c.name}</span>
            <div className="relative h-3 rounded-full bg-navy-900">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${last}%`, background: `var(--color-${c.id})` }}
              />
              <div className="absolute inset-y-0 left-0 rounded-full bg-navy-950/60" style={{ width: `${first}%` }} />
            </div>
            <span className="text-right tabular-nums text-ink-muted">
              {Math.round(first)} → {Math.round(last)}{" "}
              <b className="text-mindset">+{Math.round(last - first)}</b>
            </span>
          </div>
        ))}
        <p className="text-xs text-ink-faint">Dark part: their first take. Full bar: their latest.</p>
      </div>

      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(summary).then(() => setCopied(true))}
        className="self-start rounded-lg border border-navy-600 px-4 py-2 text-sm font-semibold hover:border-ink-faint"
      >
        {copied ? "Copied - paste it into a deck or an email" : "Copy these numbers for investors"}
      </button>
    </Panel>
  );
}

// ── Usage heatmap ─────────────────────────────────────────────────────
function Usage({ data }: { data: SampleCohort }) {
  const areas = useMemo(() => {
    const total = new Map<string, number>();
    for (const u of data.usage) total.set(u.area, (total.get(u.area) ?? 0) + u.seconds);
    return [...total.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);
  const grid = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of data.usage) m.set(`${u.area}|${u.day}`, (m.get(`${u.area}|${u.day}`) ?? 0) + u.seconds);
    return m;
  }, [data]);
  const max = Math.max(...grid.values());
  const top = areas[0]?.[1] ?? 1;
  return (
    <Panel id="usage" title="Where the time goes" blurb="Minutes spent in each part of the app, day by day.">
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-[3px] text-xs">
          <thead>
            <tr>
              <th />
              {data.days.map((d) => (
                <th key={d} className="px-0.5 font-normal text-ink-faint">
                  {d.slice(8)}
                </th>
              ))}
              <th className="pl-3 text-left font-normal text-ink-faint">total</th>
            </tr>
          </thead>
          <tbody>
            {areas.map(([area, total]) => (
              <tr key={area}>
                <td className="whitespace-nowrap pr-3 text-ink-muted">{area}</td>
                {data.days.map((d) => {
                  const v = grid.get(`${area}|${d}`) ?? 0;
                  return (
                    <td
                      key={d}
                      title={`${area}, ${d}: ${Math.round(v / 60)} min`}
                      className="size-5 rounded-[3px]"
                      style={{
                        background: v
                          ? `color-mix(in oklab, var(--color-mindset) ${Math.round(12 + (v / max) * 88)}%, transparent)`
                          : "color-mix(in oklab, var(--color-ink) 4%, transparent)",
                      }}
                    />
                  );
                })}
                <td className="pl-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-mindset/70" style={{ width: `${(total / top) * 80}px` }} />
                    <span className="tabular-nums text-ink-faint">{Math.round(total / 60)}m</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ── Drop-off ──────────────────────────────────────────────────────────
function DropOff({ data }: { data: SampleCohort }) {
  const reached = challenges.map((c) => ({
    c,
    n: new Set(data.takes.filter((t) => t.challenge === c.slug).map((t) => t.studentNo)).size,
  }));
  const total = data.students.length;
  // The one step where the most students stop.
  const lost = reached.map(({ n }, i) => (i ? reached[i - 1].n - n : 0));
  const worst = lost.indexOf(Math.max(...lost));
  return (
    <Panel
      id="dropoff"
      title="How far students get"
      blurb="Students who recorded each challenge at least once, in road order. A big step down is where students stop."
    >
      <ol className="flex flex-col gap-1.5">
        {reached.map(({ c, n }, i) => {
          const steep = i === worst;
          return (
            <li key={c.slug} className="grid grid-cols-[2rem_minmax(0,14rem)_1fr_3rem_4rem] items-center gap-2 text-xs">
              <span className="font-semibold text-ink-faint">{c.phase}</span>
              <span className="truncate text-ink-muted" title={c.title}>
                {c.title}
              </span>
              <div className="h-3 rounded-full bg-navy-900">
                <div
                  className={`h-3 rounded-full ${steep ? "bg-acting" : "bg-body-language/70"}`}
                  style={{ width: `${pct(n, total)}%` }}
                />
              </div>
              <span className="text-right tabular-nums">{n}</span>
              <span className={`tabular-nums ${steep ? "font-semibold text-acting" : "text-ink-faint"}`}>
                {lost[i] > 0 ? `−${lost[i]}` : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

// ── Coach quality ─────────────────────────────────────────────────────
function Quality({ data }: { data: SampleCohort }) {
  const [gold, setGold] = useState<Set<number>>(new Set());
  // Tariq's own score for a take - the data room's "Coach vs Tariq".
  const [mine, setMine] = useState<Record<number, string>>({});
  const byChallenge = challenges
    .map((c) => {
      const rated = data.takes.filter((t) => t.challenge === c.slug && t.rating);
      const count = (r: Rating) => rated.filter((t) => t.rating === r).length;
      return { c, total: rated.length, spot: count("spot-on"), partly: count("partly"), off: count("off") };
    })
    .filter((x) => x.total >= 3)
    .sort((a, b) => a.spot / a.total - b.spot / b.total);
  const misses = data.takes
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.rating === "off" && t.ratingNote)
    .slice(-8)
    .reverse();

  return (
    <Panel
      id="quality"
      title="How good are Coach's reviews?"
      blurb="Students rate every review 👌 spot on, 🤏 partly right or 👎 way off the mark. Weakest challenges first."
    >
      <div className="flex flex-col gap-1.5">
        {byChallenge.map(({ c, total, spot, partly, off }) => (
          <div key={c.slug} className="grid grid-cols-[minmax(0,14rem)_1fr_3rem] items-center gap-3 text-xs">
            <span className="truncate text-ink-muted" title={c.title}>
              {c.title}
            </span>
            <div className="flex h-3 overflow-hidden rounded-full bg-navy-900">
              <div className={RATING_COLOR["spot-on"]} style={{ width: `${pct(spot, total)}%` }} />
              <div className={RATING_COLOR.partly} style={{ width: `${pct(partly, total)}%` }} />
              <div className={RATING_COLOR.off} style={{ width: `${pct(off, total)}%` }} />
            </div>
            <span className="text-right tabular-nums text-ink-faint">{pct(spot, total)}%</span>
          </div>
        ))}
        <div className="flex gap-4 pt-1 text-xs text-ink-faint">
          {REVIEW_RATINGS.map((r) => (
            <span key={r.id} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${RATING_COLOR[r.id]}`} />
              {r.emoji} {r.label}
            </span>
          ))}
        </div>
      </div>

      <h3 className="pt-2 text-sm font-semibold">Where he missed - the training queue</h3>
      <p className="-mt-3 text-xs text-ink-faint">
        Give a take your own score to measure how closely Coach agrees with you, and mark it ⭐ gold to teach him
        from it once you&apos;ve written the review it should have had.
      </p>
      <ul className="flex flex-col gap-2">
        {misses.map(({ t, i }) => (
          <li key={i} className="flex flex-col gap-1.5 rounded-xl border border-navy-600 bg-navy-900/60 p-3 text-xs">
            <div className="flex items-center gap-2 text-ink-faint">
              <b className="text-ink">Student #{t.studentNo}</b>
              <span>·</span>
              <span className="truncate">{TITLE.get(t.challenge)}</span>
              <span>·</span>
              <span>Coach scored {t.score}</span>
              <label className="flex items-center gap-1">
                · yours
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={mine[i] ?? (t.tariqScore !== undefined ? String(t.tariqScore) : "")}
                  onChange={(e) => setMine((m) => ({ ...m, [i]: e.target.value }))}
                  aria-label="Your score for this take"
                  className="w-12 rounded border border-navy-600 bg-navy-900 px-1 text-ink"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setGold((g) => {
                    const n = new Set(g);
                    if (n.has(i)) n.delete(i);
                    else n.add(i);
                    return n;
                  })
                }
                className={`ml-auto rounded-full border px-2 py-0.5 ${
                  gold.has(i) ? "border-storytelling text-storytelling" : "border-navy-600 hover:text-ink"
                }`}
              >
                {gold.has(i) ? "⭐ Gold" : "Mark gold"}
              </button>
            </div>
            <p className="text-ink-muted">&ldquo;{t.transcript}&rdquo;</p>
            <p>
              <span className="text-ink-faint">Coach: </span>
              {t.coachFocus}
            </p>
            <p className="text-acting">👎 &ldquo;{t.ratingNote}&rdquo;</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ── Voice of the student ──────────────────────────────────────────────
function Voice({ data }: { data: SampleCohort }) {
  const features = Object.keys(FEATURE_NAME).map((f) => {
    const rs = data.reactions.filter((r) => r.feature === f);
    return {
      f,
      love: rs.filter((r) => r.reaction === "love").length,
      dislike: rs.filter((r) => r.reaction === "dislike").length,
      notes: rs.filter((r) => r.note).map((r) => r.note!),
    };
  });
  const topics = new Map<string, { n: number; example: string }>();
  for (const q of data.questions) {
    const t = topics.get(q.topic) ?? { n: 0, example: q.question };
    topics.set(q.topic, { n: t.n + 1, example: t.example });
  }
  const topicList = [...topics.entries()].sort((a, b) => b[1].n - a[1].n);
  const topMax = topicList[0]?.[1].n ?? 1;

  return (
    <Panel id="voice" title="Voice of the student" blurb="🔥 and 👇 on each part of the app, and what students ask Coach.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ f, love, dislike, notes }) => (
          <div key={f} className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-900/60 p-3 text-xs">
            <div className="flex items-center justify-between">
              <b className="text-sm">{FEATURE_NAME[f]}</b>
              <span className="tabular-nums text-ink-muted">
                🔥 {love} · 👇 {dislike}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-navy-900">
              <div className="bg-figurative" style={{ width: `${pct(love, love + dislike)}%` }} />
              <div className="bg-navy-600" style={{ width: `${pct(dislike, love + dislike)}%` }} />
            </div>
            {[...new Set(notes)].slice(0, 2).map((n) => (
              <p key={n} className="text-ink-faint">
                👇 &ldquo;{n}&rdquo;
              </p>
            ))}
          </div>
        ))}
      </div>

      <h3 className="pt-2 text-sm font-semibold">What students ask Coach</h3>
      <ul className="flex flex-col gap-1.5">
        {topicList.map(([topic, { n, example }]) => (
          <li key={topic} className="grid grid-cols-[7rem_1fr] items-center gap-3 text-xs">
            <span className="text-ink-muted">{topic}</span>
            <div className="flex items-center gap-2">
              <div className="h-2 rounded-full bg-structure/70" style={{ width: `${(n / topMax) * 45}%` }} />
              <span className="tabular-nums text-ink-faint">{n}</span>
              <span className="truncate text-ink-faint">e.g. &ldquo;{example}&rdquo;</span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ── AI insights ───────────────────────────────────────────────────────
// Until the insights agent runs weekly over the real tables, the same
// questions it will answer are answered here by plain rules over the
// data - so the panel shows the kind of thing it will say.
function Insights({ data }: { data: SampleCohort }) {
  const findings = useMemo(() => {
    const out: { title: string; detail: string; suggestion: string }[] = [];

    const reached = challenges.map((c) => new Set(data.takes.filter((t) => t.challenge === c.slug).map((t) => t.studentNo)).size);
    let worst = 1;
    for (let i = 1; i < reached.length; i++) {
      if (reached[i - 1] - reached[i] > reached[worst - 1] - reached[worst]) worst = i;
    }
    const drop = challenges[worst];
    out.push({
      title: `The biggest drop is at "${drop.title}"`,
      detail: `${reached[worst - 1]} students reached the challenge before it; ${reached[worst]} went on to record this one.`,
      suggestion: "Add an easier warm-up take, or have Coach check in by name on the day a student stalls here.",
    });

    const notes = data.takes.filter((t) => t.ratingNote).map((t) => t.ratingNote!.toLowerCase());
    const body = notes.filter((n) => /hand|gesture|facial|expression/.test(n)).length;
    if (body) {
      out.push({
        title: "Coach is missing the body",
        detail: `${body} of ${notes.length} "what did he miss" notes are about hands, gestures or facial expression.`,
        suggestion: "Give Coach's review prompt an explicit body-language pass, and write gold examples for these takes.",
      });
    }

    const love = (f: string) => {
      const rs = data.reactions.filter((r) => r.feature === f);
      return pct(rs.filter((r) => r.reaction === "love").length, rs.length);
    };
    const ranked = Object.keys(FEATURE_NAME).sort((a, b) => love(a) - love(b));
    out.push({
      title: `${FEATURE_NAME[ranked.at(-1)!]} is the favourite; ${FEATURE_NAME[ranked[0]]} the least loved`,
      detail: `${love(ranked.at(-1)!)}% 🔥 against ${love(ranked[0])}% 🔥.`,
      suggestion: `Read the 👇 notes on ${FEATURE_NAME[ranked[0]].toLowerCase()} before adding anything new to it.`,
    });

    const topic = [...data.questions.reduce((m, q) => m.set(q.topic, (m.get(q.topic) ?? 0) + 1), new Map<string, number>())].sort(
      (a, b) => b[1] - a[1],
    )[0];
    if (topic) {
      out.push({
        title: `Most-asked: ${topic[0].toLowerCase()}`,
        detail: `${topic[1]} of ${data.questions.length} questions to Coach.`,
        suggestion: "A short lesson or a live-session segment on this would answer many students at once.",
      });
    }
    return out;
  }, [data]);

  return (
    <Panel
      id="insights"
      title="AI insights"
      blurb="What the insights agent concludes each week from everything above. Shown here from rules until it's switched on."
    >
      <ol className="grid gap-3 lg:grid-cols-2">
        {findings.map((f, i) => (
          <li key={i} className="flex flex-col gap-1.5 rounded-xl border border-navy-600 bg-navy-900/60 p-4 text-sm">
            <b>{f.title}</b>
            <p className="text-xs text-ink-muted">{f.detail}</p>
            <p className="text-xs text-mindset">→ {f.suggestion}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

// ── Journeys ──────────────────────────────────────────────────────────
// Every student's journey at once - how the cohort unfolded - or one
// student's, in full. Tapping a student in the all-students view opens
// theirs.
function Journey({ data }: { data: SampleCohort }) {
  const [mode, setMode] = useState<"all" | "one">("all");
  const [no, setNo] = useState(40);
  const open = (n: number) => {
    setNo(n);
    setMode("one");
  };
  return (
    <Panel
      id="journey"
      title="Student journeys"
      blurb="How every student's journey unfolded, or one student's in full - by number, never by name."
    >
      <div className="flex gap-2 text-sm">
        {(
          [
            ["all", "All students"],
            ["one", "One student"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full border px-3 py-1 ${mode === m ? "border-ink bg-ink text-navy-900" : "border-navy-600 text-ink-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "all" ? <AllJourneys data={data} onOpen={open} /> : <OneJourney data={data} no={no} setNo={setNo} />}
    </Panel>
  );
}

type Student = SampleCohort["students"][number];
const STATUS_LINE: Record<string, string> = { finished: "text-mindset", stopped: "text-ink-faint", refunded: "text-acting" };
const statusOf = (s: Student) => (s.refunded ? "refunded" : s.completed ? "finished" : "stopped");
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function AllJourneys({ data, onOpen }: { data: SampleCohort; onOpen: (n: number) => void }) {
  const byStudent = useMemo(
    () => data.students.map((s) => ({ s, takes: data.takes.filter((t) => t.studentNo === s.number) })),
    [data],
  );

  // Take by take: every student's score line, and the cohort's average
  // wherever at least five students got that far.
  const W = 800;
  const H = 220;
  const most = Math.max(...byStudent.map((j) => j.takes.length));
  const x = (i: number) => (most > 1 ? (i / (most - 1)) * W : 0);
  const y = (score: number) => H - ((score - 20) / 80) * H;
  const average = Array.from({ length: most }, (_, i) => {
    const at = byStudent.filter((j) => j.takes[i]).map((j) => j.takes[i].score);
    return at.length >= 5 ? mean(at) : null;
  });

  // Day by day: a lane per student, a square per day, lit by their best
  // score that day. Finishers first, then by how much they did.
  const lanes = [...byStudent].sort(
    (a, b) => Number(b.s.completed) - Number(a.s.completed) || b.takes.length - a.takes.length || a.s.number - b.s.number,
  );
  const best = (takes: SampleCohort["takes"], day: string) => {
    const ts = takes.filter((t) => t.at.slice(0, 10) === day);
    return ts.length ? Math.max(...ts.map((t) => t.score)) : null;
  };
  const finished = byStudent.filter((j) => j.s.completed);
  const withEnd = data.students.filter((s) => s.confidenceEnd !== undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={data.students.length} label="students" />
        <Stat value={`${pct(finished.length, data.students.length)}%`} label="finished the six weeks" accent="text-mindset" />
        <Stat
          value={`${Math.round(mean(finished.map((j) => j.takes[0]?.score ?? 0)))} → ${Math.round(mean(finished.map((j) => j.takes.at(-1)?.score ?? 0)))}`}
          label="finishers' score, first take → last"
          accent="text-mindset"
        />
        <Stat
          value={`${mean(withEnd.map((s) => s.confidenceStart)).toFixed(1)} → ${mean(withEnd.map((s) => s.confidenceEnd!)).toFixed(1)}`}
          label="self-rated confidence, start → end"
          accent="text-body-language"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Every journey, take by take</h3>
        <svg viewBox={`-10 -10 ${W + 20} ${H + 20}`} className="h-64 w-full" preserveAspectRatio="none" aria-label="Every student's score, take by take">
          <line x1={0} x2={W} y1={y(60)} y2={y(60)} stroke="currentColor" className="text-navy-600" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          {byStudent.map(({ s, takes }) =>
            takes.length > 1 ? (
              <polyline
                key={s.number}
                points={takes.map((t, i) => `${x(i)},${y(t.score)}`).join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
                strokeOpacity={0.45}
                vectorEffect="non-scaling-stroke"
                className={`${STATUS_LINE[statusOf(s)]} cursor-pointer hover:[stroke-opacity:1] hover:[stroke-width:3]`}
                onClick={() => onOpen(s.number)}
              >
                <title>{`Student #${s.number} - ${takes.length} takes, ${takes[0].score} → ${takes.at(-1)!.score} (${statusOf(s)})`}</title>
              </polyline>
            ) : null,
          )}
          <polyline
            points={average.flatMap((v, i) => (v === null ? [] : [`${x(i)},${y(v)}`])).join(" ")}
            fill="none"
            stroke="currentColor"
            className="text-ink"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-ink" />
            Cohort average
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-mindset" />
            Finished
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-ink-faint" />
            Stopped
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-acting" />
            Refunded
          </span>
          <span className="text-ink-faint">Dashed: the pass mark. Tap a line to open that student.</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Every journey, day by day</h3>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-[2px] text-[0.65rem]">
            <thead>
              <tr>
                <th />
                {data.days.map((d, i) => (
                  <th key={d} className="font-normal text-ink-faint">
                    {i % 7 === 0 ? `W${i / 7 + 1}` : ""}
                  </th>
                ))}
                <th className="pl-2 text-left font-normal text-ink-faint">takes</th>
                <th className="pl-2 text-left font-normal text-ink-faint">confidence</th>
              </tr>
            </thead>
            <tbody>
              {lanes.map(({ s, takes }) => (
                <tr key={s.number}>
                  <td className="pr-2">
                    <button type="button" onClick={() => onOpen(s.number)} className="whitespace-nowrap text-ink-muted hover:text-ink">
                      #{s.number}
                    </button>
                  </td>
                  {data.days.map((d) => {
                    const v = best(takes, d);
                    return (
                      <td
                        key={d}
                        title={v === null ? undefined : `#${s.number}, ${d}: ${v}`}
                        className="size-3 rounded-[2px]"
                        style={{
                          background:
                            v === null
                              ? "color-mix(in oklab, var(--color-ink) 4%, transparent)"
                              : v >= 60
                                ? `color-mix(in oklab, var(--color-mindset) ${Math.round(25 + ((v - 60) / 40) * 75)}%, transparent)`
                                : "color-mix(in oklab, var(--color-acting) 60%, transparent)",
                        }}
                      />
                    );
                  })}
                  <td className="pl-2 tabular-nums text-ink-muted">{takes.length}</td>
                  <td className="whitespace-nowrap pl-2 tabular-nums text-ink-muted">
                    {s.confidenceStart}
                    {s.confidenceEnd !== undefined ? ` → ${s.confidenceEnd}` : ""}
                    {s.refunded ? <span className="text-acting"> · refunded</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-faint">
          A row per student, a square per day. Green: a passing take that day, brighter for a higher score. Red: a
          take below the pass mark. Finishers first, then by how many takes. Tap a number to open that student.
        </p>
      </div>
    </div>
  );
}

function OneJourney({ data, no, setNo }: { data: SampleCohort; no: number; setNo: (n: number) => void }) {
  const student = data.students.find((s) => s.number === no)!;
  const takes = data.takes.filter((t) => t.studentNo === no);
  const questions = data.questions.filter((q) => q.studentNo === no);
  const timeline = [
    ...takes.map((t) => ({ at: t.at, kind: "take" as const, t })),
    ...questions.map((q) => ({ at: q.at, kind: "question" as const, q })),
  ].sort((a, b) => (a.at < b.at ? -1 : 1));
  const minutes = Math.round(data.usage.filter((u) => u.studentNo === no).reduce((s, u) => s + u.seconds, 0) / 60);
  const first = takes[0]?.score;
  const last = takes.at(-1)?.score;

  // The score line, take by take.
  const W = 600;
  const H = 120;
  const lo = Math.max(0, Math.min(...takes.map((t) => t.score)) - 10);
  const hi = Math.min(100, Math.max(...takes.map((t) => t.score)) + 5);
  const y = (score: number) => H - ((score - lo) / Math.max(1, hi - lo)) * H;
  const pts = takes.map((t, i) => [takes.length > 1 ? (i / (takes.length - 1)) * W : W / 2, y(t.score)]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        Student
        <select
          value={no}
          onChange={(e) => setNo(Number(e.target.value))}
          className="rounded-lg border border-navy-600 bg-navy-900 px-2 py-1"
        >
          {data.students.map((s) => (
            <option key={s.number} value={s.number}>
              #{s.number}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat value={student.level} label="level" />
        <Stat value={takes.length} label="takes" />
        <Stat value={first !== undefined && last !== undefined ? `${first} → ${last}` : "-"} label="first → latest score" accent="text-mindset" />
        <Stat value={questions.length} label="questions to Coach" />
        <Stat value={minutes} label="minutes in the app" />
      </div>
      <p className="text-xs text-ink-muted">
        {({ foundations: "Starter", coached: "Complete", founders: "VIP Ultimate" } as const)[student.tier]}
        {student.upgraded ? " (upgraded)" : ""} · confidence {student.confidenceStart}
        {student.confidenceEnd !== undefined ? ` → ${student.confidenceEnd}` : ""}
        {student.recommend !== undefined ? ` · would recommend ${student.recommend}/10` : ""}
        {student.refunded ? " · refunded" : student.completed ? " · finished" : " · stopped"}
      </p>
      {student.story && <p className="text-sm italic text-ink">&ldquo;{student.story}&rdquo;</p>}

      {takes.length > 1 && (
        <svg viewBox={`-8 -8 ${W + 16} ${H + 16}`} className="h-32 w-full" preserveAspectRatio="none" aria-label="Score over time">
          <line x1={0} x2={W} y1={y(60)} y2={y(60)} stroke="currentColor" className="text-navy-600" strokeDasharray="4 4" />
          <polyline
            points={pts.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-mindset"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      <ol className="flex flex-col gap-1.5 border-l border-navy-600 pl-4 text-xs">
        {timeline.map((e, i) =>
          e.kind === "take" ? (
            <li key={i} className="flex flex-wrap items-baseline gap-x-2">
              <span className="w-14 shrink-0 text-ink-faint">{e.at.slice(5, 10)}</span>
              <span className={e.t.passed ? "text-mindset" : "text-acting"}>{e.t.score}</span>
              <span className="text-ink-muted">{TITLE.get(e.t.challenge)}</span>
              {e.t.rating && <span title={e.t.rating}>{EMOJI[e.t.rating]}</span>}
              {e.t.ratingNote && <span className="text-ink-faint">&ldquo;{e.t.ratingNote}&rdquo;</span>}
            </li>
          ) : (
            <li key={i} className="flex flex-wrap items-baseline gap-x-2">
              <span className="w-14 shrink-0 text-ink-faint">{e.at.slice(5, 10)}</span>
              <span className="text-structure">asked</span>
              <span className="text-ink-muted">&ldquo;{e.q.question}&rdquo;</span>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
