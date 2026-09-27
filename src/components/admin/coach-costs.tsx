"use client";

import { useState } from "react";
import type { SampleCohort } from "@/data/admin-sample";
import type { Plan } from "@/data/pricing";
import { COACH_RATES, REVIEW_TOKENS, SPOKEN, packMargins, reviewCost, tierWorstCase } from "@/data/coach-costs";
import { Panel, Stat } from "@/components/admin/insights-dashboard";

// THE AI COACH, COSTED - shown in the admin (with this cohort's actual
// use) and in the data room (the model alone). One source for the rates:
// data/coach-costs.ts.

const PLANS: Plan[] = ["foundations", "coached", "founders"];
const NAME: Record<Plan, string> = { foundations: "Starter", coached: "Complete", founders: "VIP Ultimate" };
const usd = (v: number, dp = 2) => `$${v.toFixed(dp)}`;
const pc = (v: number) => `${(v * 100).toFixed(1)}%`;

function Rate({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step: number }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink-muted">
      {label}
      <span className="flex items-center gap-1 rounded-lg border border-navy-600 bg-navy-900 px-2 py-1.5 focus-within:border-ink-faint">
        <span className="text-ink-faint">$</span>
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full min-w-0 bg-transparent text-sm tabular-nums text-ink focus:outline-none"
        />
      </span>
    </label>
  );
}

export function CoachCosts({ data }: { data?: SampleCohort }) {
  const [proIn, setProIn] = useState<number>(COACH_RATES.proIn);
  const [proOut, setProOut] = useState<number>(COACH_RATES.proOut);
  const [spoken, setSpoken] = useState<number>(COACH_RATES.spokenPerReview);
  const [question, setQuestion] = useState<number>(COACH_RATES.perQuestion);
  const rates = { proIn, proOut, spokenPerReview: spoken, perQuestion: question };
  const per = reviewCost(rates);
  const worst = PLANS.map((p) => tierWorstCase(p, rates));
  const packs = packMargins(rates);

  // This cohort's actual use, costed.
  const actual = (() => {
    if (!data) return null;
    const tierOf = new Map(data.students.map((s) => [s.number, s.tier]));
    const by = Object.fromEntries(PLANS.map((p) => [p, { students: 0, takes: 0, cost: 0, revenue: 0 }])) as Record<
      Plan,
      { students: number; takes: number; cost: number; revenue: number }
    >;
    for (const s of data.students) {
      by[s.tier].students++;
      by[s.tier].revenue += s.refunded ? 0 : s.paidCents / 100;
    }
    for (const t of data.takes) {
      const tier = tierOf.get(t.studentNo) ?? "foundations";
      by[tier].takes++;
      by[tier].cost += per + (SPOKEN[tier] ? spoken : 0);
    }
    for (const q of data.questions) {
      const tier = tierOf.get(q.studentNo) ?? "foundations";
      by[tier].cost += question;
    }
    const total = PLANS.reduce((a, p) => a + by[p].cost, 0);
    const revenue = PLANS.reduce((a, p) => a + by[p].revenue, 0);
    return { by, total, revenue, takes: data.takes.length, questions: data.questions.length, students: data.students.length };
  })();

  return (
    <div className="flex flex-col gap-6">
      <Panel
        id="coach-rates"
        title="What one review costs"
        blurb={`Coach watches each take with the Pro model: about ${REVIEW_TOKENS.input.toLocaleString()} tokens in and ${REVIEW_TOKENS.output.toLocaleString()} out (measured). The rates are Google's list prices as understood in September 2026 - check them against your Gemini billing and change them here.`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Rate label="Pro, per million in" value={proIn} onChange={setProIn} step={0.25} />
          <Rate label="Pro, per million out" value={proOut} onChange={setProOut} step={0.5} />
          <Rate label="Spoken review (voice)" value={spoken} onChange={setSpoken} step={0.005} />
          <Rate label="A question to Coach" value={question} onChange={setQuestion} step={0.001} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat value={usd(per, 3)} label="per video review" accent="text-storytelling" />
          <Stat value={usd(per + spoken, 3)} label="per review, spoken (Complete, VIP)" />
          <Stat value={usd(question, 3)} label="per question asked" />
        </div>
      </Panel>

      <Panel
        id="coach-worst"
        title="The most a student can cost"
        blurb="Every included review used, and heard where the tier speaks them - against what the tier costs. Watching the video is the cost; whether Coach then writes or speaks barely moves it."
      >
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-ink-faint">
            <tr>
              <th className="py-2 font-normal">Tier</th>
              <th className="font-normal">Price</th>
              <th className="font-normal">Included reviews</th>
              <th className="font-normal">Coach, all used</th>
              <th className="font-normal">Share of price</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {worst.map((w) => (
              <tr key={w.plan} className="border-t border-navy-600">
                <td className="py-2 font-semibold">{NAME[w.plan]}</td>
                <td>{usd(w.price, 0)}</td>
                <td>{w.reviews}</td>
                <td>{usd(w.coach)}</td>
                <td className={w.share < 0.05 ? "text-mindset" : "text-acting"}>{pc(w.share)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-ink-faint">
          An alumni place (ALUMNI2026: Starter at no charge) costs up to {usd(worst[0].coach)} in Coach with nothing coming
          in - the argument for a smaller included allowance on alumni places.
        </p>
      </Panel>

      <Panel id="coach-packs" title="Extra review packs" blurb="What each pack leaves after Coach and Stripe's card fee (2.9% + 30c).">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-ink-faint">
            <tr>
              <th className="py-2 font-normal">Pack</th>
              <th className="font-normal">Per review</th>
              <th className="font-normal">Coach</th>
              <th className="font-normal">Card fee</th>
              <th className="font-normal">Left over</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {packs.map((p) => (
              <tr key={p.id} className="border-t border-navy-600">
                <td className="py-2 font-semibold">
                  {usd(p.price, 0)} · {p.reviews} reviews
                </td>
                <td>{usd(p.perReview, 3)}</td>
                <td>{usd(p.coach)}</td>
                <td>{usd(p.fee)}</td>
                <td className={p.share >= 0.3 ? "text-mindset" : "text-acting"}>
                  {usd(p.margin)} <span className="text-xs text-ink-faint">({pc(p.share)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-ink-faint">Red: under 30% left over - one retried review on the house and it&apos;s gone.</p>
      </Panel>

      {actual && (
        <Panel
          id="coach-actual"
          title="This cohort's Coach bill"
          blurb="Every take reviewed and every question asked in the cohort, costed at the rates above."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={usd(actual.total)} label="Coach, whole cohort" accent="text-storytelling" />
            <Stat value={usd(actual.total / Math.max(1, actual.students))} label="per student" />
            <Stat value={actual.takes} label="takes reviewed" />
            <Stat value={pc(actual.total / Math.max(1, actual.revenue))} label="of revenue" accent="text-mindset" />
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-faint">
              <tr>
                <th className="py-2 font-normal">Tier</th>
                <th className="font-normal">Students</th>
                <th className="font-normal">Takes</th>
                <th className="font-normal">Coach cost</th>
                <th className="font-normal">Per student</th>
                <th className="font-normal">Of that tier&apos;s revenue</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {PLANS.map((p) => {
                const r = actual.by[p];
                return (
                  <tr key={p} className="border-t border-navy-600">
                    <td className="py-2 font-semibold">{NAME[p]}</td>
                    <td>{r.students}</td>
                    <td>{r.takes}</td>
                    <td>{usd(r.cost)}</td>
                    <td>{usd(r.cost / Math.max(1, r.students))}</td>
                    <td>{pc(r.cost / Math.max(1, r.revenue))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
