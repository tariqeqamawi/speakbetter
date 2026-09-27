"use client";

import { useMemo, useState } from "react";
import { categories } from "@/data/categories";
import { FEATURE_NAME, sampleCohort, type Rating, type SampleCohort } from "@/data/admin-sample";
import { REVIEW_RATINGS } from "@/lib/insights";
import { priceCents, tiers, type Plan } from "@/data/pricing";
import { AdminFrame } from "@/components/admin/admin-frame";
import { CohortSpectrum } from "@/components/admin/cohort-spectrum";
import { Panel, Stat, pct } from "@/components/admin/insights-dashboard";

// The case for backing Speak Better, built from the cohort itself: does
// it work (outcomes), do people pay and stay (traction), does each
// student make money (unit economics), what could it become (forecast),
// and why it gets harder to copy with every student (the moat). The
// one-pager at the top prints to a PDF for an investor email.
//
// Every figure is computed from the same records the insights page
// reads. Until the database is on, that's the sample cohort; the
// forecast's starting assumptions come from it, and are replaced by the
// real cohort's numbers the day they exist.

const TIER_NAME: Record<Plan, string> = { foundations: "Starter", coached: "Complete", founders: "VIP Ultimate" };
const TIER_COLOR: Record<Plan, string> = { foundations: "bg-mindset", coached: "bg-structure", founders: "bg-storytelling" };
const PLANS: Plan[] = ["foundations", "coached", "founders"];
const STANDARD: Record<Plan, number> = Object.fromEntries(
  tiers.map((t) => [t.id, Number((t.future ?? t.price).replace(/[^0-9]/g, "")) * 100]),
) as Record<Plan, number>;
const MONTHLY: Record<Plan, number> = { foundations: 1499, coached: 2999, founders: 2999 };

const usd = (cents: number, digits = 0) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function measure(data: SampleCohort) {
  const s = data.students;
  const paying = s.filter((x) => !x.refunded);
  const gross = s.reduce((a, x) => a + x.paidCents, 0);
  const refunds = s.filter((x) => x.refunded).reduce((a, x) => a + x.paidCents, 0);
  const mix = Object.fromEntries(PLANS.map((p) => [p, paying.filter((x) => x.tier === p).length / paying.length])) as Record<
    Plan,
    number
  >;
  const startedStarter = s.filter((x) => x.tier === "foundations" || x.upgraded).length;
  const answered = s.filter((x) => x.recommend !== undefined);
  const promoters = answered.filter((x) => x.recommend! >= 9).length;
  const detractors = answered.filter((x) => x.recommend! <= 6).length;
  const withEnd = s.filter((x) => x.confidenceEnd !== undefined);

  // Scores: each student against their own first take.
  const paired = s
    .map((x) => data.takes.filter((t) => t.studentNo === x.number))
    .filter((ts) => ts.length >= 3)
    .map((ts) => ({ first: ts[0], last: ts.at(-1)! }));
  const firstAvg = avg(paired.map((p) => p.first.score));
  const lastAvg = avg(paired.map((p) => p.last.score));

  // Weeks.
  const start = new Date(data.days[0]).getTime();
  const weeks = Math.ceil(data.days.length / 7);
  const weekOf = (at: string) => Math.min(weeks - 1, Math.floor((new Date(at).getTime() - start) / (7 * 86400000)));
  const byWeek = <T,>(xs: T[], at: (x: T) => string) =>
    Array.from({ length: weeks }, (_, w) => xs.filter((x) => weekOf(at(x)) === w));
  const activeByWeek = byWeek(data.usage, (u) => u.day).map((us) => new Set(us.map((u) => u.studentNo)).size);

  // Coach against Tariq, and against the students' own verdicts.
  const judged = data.takes.filter((t) => t.tariqScore !== undefined);
  const gap = (ts: typeof judged) => avg(ts.map((t) => Math.abs(t.score - t.tariqScore!)));
  const gapByWeek = byWeek(judged, (t) => t.at).map((ts) => (ts.length ? gap(ts) : null));
  const rated = data.takes.filter((t) => t.rating);
  const spotByWeek = byWeek(rated, (t) => t.at).map((ts) => pct(ts.filter((t) => t.rating === "spot-on").length, ts.length));

  // Before and after: finishers who let us quote them, biggest change first.
  const stories = s
    .filter((x) => x.story && x.quoteOk)
    .map((x) => {
      const ts = data.takes.filter((t) => t.studentNo === x.number);
      return { x, first: ts[0], last: ts.at(-1) };
    })
    .filter((v) => v.first && v.last && v.first !== v.last)
    .sort((a, b) => b.last!.score - b.first!.score - (a.last!.score - a.first!.score))
    .slice(0, 3);

  return {
    n: s.length,
    paying: paying.length,
    gross,
    refunds,
    net: gross - refunds,
    arpu: (gross - refunds) / paying.length,
    refundRate: s.filter((x) => x.refunded).length / s.length,
    mix,
    upgradeRate: s.filter((x) => x.upgraded).length / Math.max(1, startedStarter),
    completion: s.filter((x) => x.completed).length / paying.length,
    monthlyConv: s.filter((x) => x.monthly).length / paying.length,
    nps: pct(promoters - detractors, answered.length),
    npsN: answered.length,
    confStart: avg(s.map((x) => x.confidenceStart)),
    confStartPaired: avg(withEnd.map((x) => x.confidenceStart)),
    confEnd: avg(withEnd.map((x) => x.confidenceEnd!)),
    confN: withEnd.length,
    confStartHist: Array.from({ length: 10 }, (_, i) => s.filter((x) => x.confidenceStart === i + 1).length),
    confEndHist: Array.from({ length: 10 }, (_, i) => withEnd.filter((x) => x.confidenceEnd === i + 1).length),
    firstAvg,
    lastAvg,
    improved: paired.filter((p) => p.last.score > p.first.score).length / Math.max(1, paired.length),
    pairedN: paired.length,
    activeByWeek,
    gapByWeek,
    within10: pct(judged.filter((t) => Math.abs(t.score - t.tariqScore!) <= 10).length, judged.length),
    judgedN: judged.length,
    spotByWeek,
    ratings: rated.length,
    notes: data.takes.filter((t) => t.ratingNote).length,
    transcripts: data.takes.length,
    reviewsPerStudent: data.takes.length / paying.length,
    questionsPerStudent: data.questions.length / paying.length,
    stories,
    quote: s.find((x) => x.story && x.quoteOk)?.story,
  };
}

type M = ReturnType<typeof measure>;

const TABS = [
  { id: "summary", label: "One-pager" },
  { id: "outcomes", label: "Does it work?" },
  { id: "feedback", label: "What students love" },
  { id: "traction", label: "Traction" },
  { id: "economics", label: "Unit economics" },
  { id: "forecast", label: "Forecast" },
  { id: "moat", label: "The moat" },
] as const;

export function DataRoom() {
  const data = useMemo(() => sampleCohort(), []);
  const m = useMemo(() => measure(data), [data]);
  return (
    <AdminFrame
      at="data-room"
      title="Data room"
      blurb="The evidence for backing Speak Better: whether it works, whether people pay and stay, what each student is worth, and what it could grow into. Built from the cohort's own records - students by number, never by name."
      banner={
        <p className="w-fit rounded-full border border-storytelling/40 bg-storytelling/10 px-3 py-1 text-xs text-storytelling">
          Sample cohort - every figure switches to the real founding cohort once the database is on.
        </p>
      }
      tabs={TABS}
      render={(tab) => {
        switch (tab) {
          case "summary":
            return <OnePager m={m} />;
          case "outcomes":
            return (
              <div className="flex flex-col gap-6">
                <Outcomes m={m} />
                <Panel id="spectrum" title="The Speaking Spectrum, first take → latest">
                  <CohortSpectrum data={data} />
                </Panel>
              </div>
            );
          case "feedback":
            return <Feedback data={data} />;
          case "traction":
            return <Traction m={m} />;
          case "economics":
            return <Economics m={m} />;
          case "forecast":
            return <Forecast m={m} />;
          case "moat":
            return <Moat m={m} />;
        }
      }}
    />
  );
}

// ── What students love ────────────────────────────────────────────────
// The students' own verdicts, in two kinds: on Coach's reviews (👌 spot
// on, 🤏 partly right, 👎 way off the mark) and on each part of the app
// (🔥 love it, 👇 not for me) - with what they wrote when they said no.
function Feedback({ data }: { data: SampleCohort }) {
  const rated = data.takes.filter((t) => t.rating);
  const count = (r: Rating) => rated.filter((t) => t.rating === r).length;
  const features = Object.keys(FEATURE_NAME)
    .map((f) => {
      const rs = data.reactions.filter((r) => r.feature === f);
      const love = rs.filter((r) => r.reaction === "love").length;
      const dislike = rs.length - love;
      return { f, love, dislike, total: rs.length, notes: [...new Set(rs.flatMap((r) => (r.note ? [r.note] : [])))] };
    })
    .filter((x) => x.total)
    .sort((a, b) => b.love / b.total - a.love / a.total);
  const reacted = new Set(data.reactions.map((r) => r.studentNo)).size;

  return (
    <div className="flex flex-col gap-6">
      <Panel
        id="features"
        title="Which parts of the app students love"
        blurb={`🔥 love it or 👇 not for me, under each part of the app - ${data.reactions.length} reactions from ${reacted} students, most loved first.`}
      >
        <ol className="flex flex-col gap-3">
          {features.map(({ f, love, dislike, total, notes }) => (
            <li key={f} className="flex flex-col gap-1.5">
              <div className="grid grid-cols-[8rem_1fr_7rem] items-center gap-3 text-sm">
                <b className="text-ink">{FEATURE_NAME[f]}</b>
                <div className="flex h-3 overflow-hidden rounded-full bg-navy-900">
                  <div className="bg-figurative" style={{ width: `${pct(love, total)}%` }} />
                  <div className="bg-navy-600" style={{ width: `${pct(dislike, total)}%` }} />
                </div>
                <span className="text-right text-xs tabular-nums text-ink-muted">
                  🔥 {love} · 👇 {dislike} · <b className="text-ink">{pct(love, total)}%</b>
                </span>
              </div>
              {notes.length > 0 && (
                <p className="pl-[8.75rem] text-xs text-ink-faint">
                  {notes.slice(0, 2).map((n) => `👇 “${n}”`).join("   ")}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Panel>

      <Panel
        id="reviews"
        title="How students rate Coach's reviews"
        blurb={`Every review ends with the same question - ${rated.length} answered.`}
      >
        <div className="grid grid-cols-3 gap-3">
          {REVIEW_RATINGS.map((r) => (
            <Stat
              key={r.id}
              value={`${r.emoji} ${pct(count(r.id), rated.length)}%`}
              label={r.label}
              accent={r.id === "spot-on" ? "text-mindset" : r.id === "partly" ? "text-storytelling" : "text-acting"}
            />
          ))}
        </div>
        <div className="flex h-4 overflow-hidden rounded-full">
          <div className="bg-mindset" style={{ width: `${pct(count("spot-on"), rated.length)}%` }} />
          <div className="bg-storytelling" style={{ width: `${pct(count("partly"), rated.length)}%` }} />
          <div className="bg-acting" style={{ width: `${pct(count("off"), rated.length)}%` }} />
        </div>
        <p className="text-xs text-ink-faint">
          Week by week, and where Coach missed, are on the moat tab and in Cohort insights → Coach quality.
        </p>
      </Panel>
    </div>
  );
}

// ── The one-pager ─────────────────────────────────────────────────────
function OnePager({ m }: { m: M }) {
  return (
    <section className="print-area flex flex-col gap-5 rounded-2xl border border-navy-600 bg-navy-800 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="spectrum-rule mb-2 h-1 w-16 rounded-full" />
          <h2 className="text-2xl font-semibold">Speak Better - founding cohort results</h2>
          <p className="text-sm text-ink-muted">
            A six-week public-speaking course with an AI coach that watches every take. {m.n} students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-navy-900 print:hidden"
        >
          Download as PDF
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={`+${pct(m.lastAvg - m.firstAvg, m.firstAvg)}%`} label="speaking score, first take → latest" accent="text-mindset" />
        <Stat value={`${Math.round(m.improved * 100)}%`} label="of students improved" accent="text-mindset" />
        <Stat
          value={`${m.confStartPaired.toFixed(1)} → ${m.confEnd.toFixed(1)}`}
          label="self-rated confidence on camera (of 10)"
          accent="text-body-language"
        />
        <Stat value={m.nps > 0 ? `+${m.nps}` : m.nps} label="Net Promoter Score" accent="text-storytelling" />
        <Stat value={usd(m.net)} label="net revenue, one cohort" />
        <Stat value={usd(m.arpu)} label="average paid per student" />
        <Stat value={`${Math.round(m.completion * 100)}%`} label="finished the six weeks" accent="text-structure" />
        <Stat value={`${Math.round(m.refundRate * 100)}%`} label="asked for a refund" />
      </div>
      {m.quote && (
        <blockquote className="border-l-2 border-storytelling pl-4 text-sm italic text-ink">
          &ldquo;{m.quote}&rdquo;
          <span className="not-italic text-ink-faint"> - founding-cohort student</span>
        </blockquote>
      )}
    </section>
  );
}

// ── Outcomes ──────────────────────────────────────────────────────────
function Hist({ values, color, label }: { values: number[]; color: string; label: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-ink-muted">{label}</span>
      <div className="flex h-24 items-end gap-1">
        {values.map((v, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-0.5">
            <div className={`w-full rounded-t-sm ${color}`} style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 text-center text-[0.6rem] text-ink-faint">
        {values.map((_, i) => (
          <span key={i} className="flex-1">
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function Outcomes({ m }: { m: M }) {
  return (
    <Panel
      id="outcomes"
      title="Does it work?"
      blurb="Two independent measures that agree: Coach's scores, and the students' own sense of their confidence."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Confidence on camera, in their own words</h3>
          <p className="-mt-2 text-xs text-ink-faint">
            &ldquo;How confident do you feel speaking on camera?&rdquo; 1-10, asked on day one and again at the end (
            {m.confN} finishers answered both).
          </p>
          <Hist values={m.confStartHist} color="bg-navy-600" label={`Day one - average ${m.confStart.toFixed(1)}`} />
          <Hist values={m.confEndHist} color="bg-body-language" label={`The end - average ${m.confEnd.toFixed(1)}`} />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Before and after</h3>
          {m.stories.map(({ x, first, last }) => (
            <div key={x.number} className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-900/60 p-3 text-xs">
              <div className="flex items-center gap-2">
                <b className="text-ink">Student #{x.number}</b>
                <span className="text-ink-faint">
                  score {first!.score} → <b className="text-mindset">{last!.score}</b> · confidence {x.confidenceStart} →{" "}
                  <b className="text-body-language">{x.confidenceEnd}</b>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {categories.map((c) => (
                  <div key={c.id} className="relative h-1.5 rounded-full bg-navy-900">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${last!.spectrum[c.id]}%`, background: `var(--color-${c.id})` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-navy-950/60"
                      style={{ width: `${first!.spectrum[c.id]}%` }}
                    />
                  </div>
                ))}
              </div>
              <p className="italic text-ink-muted">&ldquo;{x.story}&rdquo;</p>
            </div>
          ))}
          <p className="text-xs text-ink-faint">
            Only students who ticked &ldquo;Speak Better may quote this, without my name&rdquo;. The full cohort&apos;s
            score and color growth is on the insights page.
          </p>
        </div>
      </div>
    </Panel>
  );
}

// ── Traction ──────────────────────────────────────────────────────────
function Traction({ m }: { m: M }) {
  const maxActive = Math.max(1, ...m.activeByWeek);
  return (
    <Panel id="traction" title="Do people pay, and stay?">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={usd(m.gross)} label="gross revenue" />
        <Stat value={usd(m.refunds)} label={`refunded (${Math.round(m.refundRate * 100)}% of students)`} />
        <Stat value={`${Math.round(m.upgradeRate * 100)}%`} label="of Starter upgraded to Complete" accent="text-structure" />
        <Stat value={`${Math.round(m.monthlyConv * 100)}%`} label="stayed on month to month" accent="text-mindset" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Which tier they chose</h3>
          <div className="flex h-4 overflow-hidden rounded-full">
            {PLANS.map((p) => (
              <div key={p} className={TIER_COLOR[p]} style={{ width: `${m.mix[p] * 100}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
            {PLANS.map((p) => (
              <span key={p} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${TIER_COLOR[p]}`} />
                {TIER_NAME[p]} {Math.round(m.mix[p] * 100)}%
              </span>
            ))}
          </div>
          <p className="text-xs text-ink-faint">
            Net Promoter Score {m.nps > 0 ? `+${m.nps}` : m.nps} from {m.npsN} finishers (above +50 is considered
            excellent).
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Students practising each week</h3>
          <div className="flex h-28 items-end gap-2">
            {m.activeByWeek.map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs tabular-nums">{v}</span>
                <div className="w-full rounded-t-md bg-structure/70" style={{ height: `${(v / maxActive) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 text-center text-[0.65rem] text-ink-faint">
            {m.activeByWeek.map((_, i) => (
              <span key={i} className="flex-1">
                Wk {i + 1}
              </span>
            ))}
          </div>
          <p className="text-xs text-ink-faint">
            {Math.round(m.completion * 100)}% of paying students were still practising in the final week. Self-paced
            online courses typically see 5-15% completion.
          </p>
        </div>
      </div>
    </Panel>
  );
}

// ── Unit economics ────────────────────────────────────────────────────
function Num({
  label,
  value,
  onChange,
  step = 1,
  prefix,
  suffix,
  from,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  prefix?: string;
  suffix?: string;
  from?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-muted">
      <span className="flex items-center gap-1.5">
        {label}
        {from && (
          <span className="rounded-full bg-mindset/15 px-1.5 text-[0.6rem] font-semibold text-mindset">from cohort</span>
        )}
      </span>
      <span className="flex items-center gap-1 rounded-lg border border-navy-600 bg-navy-900 px-2 py-1.5 focus-within:border-ink-faint">
        {prefix && <span className="text-ink-faint">{prefix}</span>}
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full min-w-0 bg-transparent text-sm tabular-nums text-ink focus:outline-none"
        />
        {suffix && <span className="text-ink-faint">{suffix}</span>}
      </span>
    </label>
  );
}

function Economics({ m }: { m: M }) {
  const [standard, setStandard] = useState(false);
  const [ai, setAi] = useState(0.25);
  const [voice, setVoice] = useState(0.05);
  const [reviews, setReviews] = useState(Math.round(m.reviewsPerStudent));
  const [hosting, setHosting] = useState(1.5);
  const [hourly, setHourly] = useState(150);
  const [liveHours, setLiveHours] = useState(6);
  const [cohort, setCohort] = useState(20);
  const [vipHours, setVipHours] = useState(3);
  const [print, setPrint] = useState(45);

  const rows = PLANS.map((p) => {
    const price = (standard ? STANDARD[p] : priceCents[p]) / 100;
    const coachCost = reviews * (ai + (p === "foundations" ? 0 : voice)) + m.questionsPerStudent * 0.02;
    const live = (liveHours * hourly) / Math.max(1, cohort);
    const vip = p === "founders" ? vipHours * hourly + print : 0;
    const fees = price * 0.029 + 0.3;
    const cost = coachCost + hosting + live + vip + fees;
    return { p, price, coachCost, live, vip, fees, cost, margin: price - cost };
  });

  return (
    <Panel
      id="economics"
      title="What each student is worth"
      blurb="The cost of serving one student against what they pay. Change any figure; the ones marked come from the cohort."
    >
      <div className="flex gap-2 text-sm">
        {[false, true].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setStandard(v)}
            className={`rounded-full border px-3 py-1 ${standard === v ? "border-ink bg-ink text-navy-900" : "border-navy-600 text-ink-muted"}`}
          >
            {v ? "Standard prices" : "Founding prices"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Num label="AI review, per take" value={ai} onChange={setAi} step={0.05} prefix="$" />
        <Num label="Coach's voice, per take" value={voice} onChange={setVoice} step={0.01} prefix="$" />
        <Num label="Takes per student" value={reviews} onChange={setReviews} from />
        <Num label="Hosting per student" value={hosting} onChange={setHosting} step={0.5} prefix="$" />
        <Num label="Your time, per hour" value={hourly} onChange={setHourly} step={10} prefix="$" />
        <Num label="Live hours per cohort" value={liveHours} onChange={setLiveHours} />
        <Num label="Students per cohort" value={cohort} onChange={setCohort} />
        <Num label="VIP one-to-one hours" value={vipHours} onChange={setVipHours} step={0.5} />
        <Num label="VIP deck and book" value={print} onChange={setPrint} step={5} prefix="$" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-ink-faint">
            <tr>
              <th className="py-2 font-normal">Tier</th>
              <th className="font-normal">Price</th>
              <th className="font-normal">AI coach</th>
              <th className="font-normal">Live sessions</th>
              <th className="font-normal">VIP extras</th>
              <th className="font-normal">Card fees</th>
              <th className="font-normal">Margin</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.p} className="border-t border-navy-600">
                <td className="py-2 font-semibold">{TIER_NAME[r.p]}</td>
                <td>${r.price.toLocaleString("en-US")}</td>
                <td>${r.coachCost.toFixed(2)}</td>
                <td>${r.live.toFixed(2)}</td>
                <td>{r.vip ? `$${r.vip.toFixed(0)}` : "-"}</td>
                <td>${r.fees.toFixed(2)}</td>
                <td className="font-semibold text-mindset">
                  ${r.margin.toFixed(0)} <span className="text-xs text-ink-faint">({pct(r.margin, r.price)}%)</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-faint">
        The AI coach costs cents a take, so the margin barely moves as the cohort grows - the one cost that scales with
        students is Tariq&apos;s own time, which is why the VIP tier is capped.
      </p>
    </Panel>
  );
}

// ── Forecast ──────────────────────────────────────────────────────────
function Forecast({ m }: { m: M }) {
  const [size, setSize] = useState(20);
  const [growth, setGrowth] = useState(25);
  const [cap, setCap] = useState(300);
  const [gap, setGap] = useState(6);
  const [standard, setStandard] = useState(true);
  const [refund, setRefund] = useState(Math.round(m.refundRate * 100));
  const [conv, setConv] = useState(Math.round(m.monthlyConv * 100));
  const [churn, setChurn] = useState(12);
  const horizon = 36;

  const f = useMemo(() => {
    const course = new Array(horizon).fill(0);
    const members = new Array(horizon).fill(0);
    const memberRevenue = new Array(horizon).fill(0);
    const memberPrice = PLANS.reduce((a, p) => a + m.mix[p] * MONTHLY[p], 0);
    let students = 0;
    for (let i = 0; ; i++) {
      const week = i * gap;
      const month = Math.floor((week * 7) / 30.44);
      if (month >= horizon) break;
      const n = Math.min(cap, Math.round(size * Math.pow(1 + growth / 100, i)));
      // The first cohort is the founding one, at founding prices.
      const prices = i === 0 || !standard ? priceCents : STANDARD;
      // The mix is by final tier, so upgrades are already in it.
      const arpu = PLANS.reduce((a, p) => a + m.mix[p] * prices[p], 0);
      const kept = n * (1 - refund / 100);
      course[month] += kept * arpu;
      students += n;
      // Six weeks later, some stay on month to month and slowly leave.
      const joinMonth = Math.floor(((week + 6) * 7) / 30.44);
      let active = kept * (conv / 100);
      for (let mo = joinMonth; mo < horizon; mo++) {
        members[mo] += active;
        memberRevenue[mo] += active * memberPrice;
        active *= 1 - churn / 100;
      }
    }
    const total = course.map((c, i) => c + memberRevenue[i]);
    const year = (y: number) => total.slice(y * 12, y * 12 + 12).reduce((a, b) => a + b, 0);
    return { course, memberRevenue, members, total, students, years: [year(0), year(1), year(2)] };
  }, [m, size, growth, cap, gap, standard, refund, conv, churn]);

  // By quarter: payments land only in the months a cohort starts, so
  // month by month the chart is all spikes and gaps.
  const quarters = Array.from({ length: horizon / 3 }, (_, q) => {
    const sum = (xs: number[]) => xs.slice(q * 3, q * 3 + 3).reduce((a, b) => a + b, 0);
    return { total: sum(f.total), members: sum(f.memberRevenue) };
  });
  const max = Math.max(1, ...quarters.map((q) => q.total));
  return (
    <Panel
      id="forecast"
      title="Revenue forecast"
      blurb="Three years of cohorts, built on the founding cohort's real tier mix, refunds and month-to-month take-up. Change any assumption."
    >
      <div className="flex gap-2 text-sm">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setStandard(v)}
            className={`rounded-full border px-3 py-1 ${standard === v ? "border-ink bg-ink text-navy-900" : "border-navy-600 text-ink-muted"}`}
          >
            {v ? "Standard prices after the founding cohort" : "Founding prices throughout"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Num label="First cohort size" value={size} onChange={setSize} suffix="students" />
        <Num label="Growth per cohort" value={growth} onChange={setGrowth} suffix="%" />
        <Num label="Largest cohort" value={cap} onChange={setCap} suffix="students" />
        <Num label="Weeks between cohorts" value={gap} onChange={setGap} />
        <Num label="Refunds" value={refund} onChange={setRefund} suffix="%" from />
        <Num label="Stay on monthly" value={conv} onChange={setConv} suffix="%" from />
        <Num label="Monthly members leaving" value={churn} onChange={setChurn} suffix="% a month" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {f.years.map((y, i) => (
          <Stat key={i} value={usd(y)} label={`year ${i + 1} revenue`} accent={i === 2 ? "text-mindset" : "text-ink"} />
        ))}
        <Stat value={usd(f.memberRevenue[horizon - 1] * 12)} label="yearly recurring revenue by month 36" accent="text-structure" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex h-48 items-end gap-2">
          {quarters.map((q, i) => (
            <div
              key={i}
              title={`Quarter ${i + 1}: ${usd(q.total)}`}
              className="flex flex-1 flex-col justify-end overflow-hidden rounded-t-md"
              style={{ height: `${(q.total / max) * 100}%` }}
            >
              <div className="bg-structure/80" style={{ height: `${pct(q.members, q.total)}%` }} />
              <div className="flex-1 bg-mindset/80" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 text-center text-[0.65rem] text-ink-faint">
          {quarters.map((_, i) => (
            <span key={i} className="flex-1">
              {i % 4 === 0 ? `Year ${i / 4 + 1}` : `Q${(i % 4) + 1}`}
            </span>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-mindset/80" />
            Cohort payments
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-structure/80" />
            Month-to-month members
          </span>
        </div>
      </div>
      <p className="text-xs text-ink-faint">
        {f.students.toLocaleString("en-US")} students over three years. A forecast, not a promise: the inputs marked
        &ldquo;from cohort&rdquo; are measured, the rest are assumptions to argue about.
      </p>
    </Panel>
  );
}

// ── The moat ──────────────────────────────────────────────────────────
function Moat({ m }: { m: M }) {
  const maxGap = Math.max(1, ...m.gapByWeek.map((g) => g ?? 0));
  return (
    <Panel
      id="moat"
      title="Why it gets harder to copy"
      blurb="Every student makes Coach a better coach. A competitor starting today starts without any of it."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={m.transcripts} label="takes transcribed and scored" />
        <Stat value={m.ratings} label="reviews rated by students" />
        <Stat value={m.notes} label="&ldquo;what Coach missed&rdquo; notes" />
        <Stat value={`${m.within10}%`} label={`of Coach's scores within 10 points of Tariq's (${m.judgedN} takes)`} accent="text-mindset" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Coach vs Tariq - average gap in points, by week</h3>
          <div className="flex h-28 items-end gap-2">
            {m.gapByWeek.map((g, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs tabular-nums">{g === null ? "-" : g.toFixed(1)}</span>
                <div className="w-full rounded-t-md bg-acting/70" style={{ height: `${((g ?? 0) / maxGap) * 100}%` }} />
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint">Lower is better: the gap narrows as Tariq corrects him.</p>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Reviews rated 👌 spot on, by week</h3>
          <div className="flex h-28 items-end gap-2">
            {m.spotByWeek.map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs tabular-nums">{v}%</span>
                <div className="w-full rounded-t-md bg-mindset/70" style={{ height: `${v}%` }} />
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint">The students&apos; own verdict on every review.</p>
        </div>
      </div>
    </Panel>
  );
}
