"use client";

import { useState } from "react";
import { features, tiers } from "@/data/pricing";
import { UnlockButton } from "@/components/unlock-button";
import { CheckIcon, StarIcon, XIcon } from "@/components/icons";
import { TierArt } from "@/components/tier-art";

// The three tiers. On a desktop they stand side by side, the membership
// drawn larger; on a phone, stacked, a visitor scrolled through three
// long cards to compare them - so there they are tabs instead: three
// names in a row, one card beneath, tap from one to the next. The same
// markup serves both; only what's shown changes with the width.

// VIP Ultimate (storytelling accent) wears gold - the gradient of the
// guarantee seal - rather than flat yellow.
const ACCENT = { mindset: "text-mindset", structure: "text-structure", storytelling: "text-gold" } as const;
const ACCENT_BG = { mindset: "bg-mindset", structure: "bg-structure", storytelling: "bg-storytelling" } as const;

export function TierTabs() {
  const [active, setActive] = useState(tiers.find((t) => t.featured)?.id ?? tiers[0].id);
  return (
    <div className="flex flex-col gap-4">
      {/* The tab row - phones only */}
      <div role="tablist" aria-label="Plans" className="grid grid-cols-3 gap-1 rounded-2xl border border-navy-600 bg-navy-900 p-1 lg:hidden">
        {tiers.map((tier) => {
          const on = tier.id === active;
          return (
            <button
              key={tier.id}
              id={`tier-tab-${tier.id}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`tier-${tier.id}`}
              onClick={() => setActive(tier.id)}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-center transition-colors ${
                on ? "bg-navy-800 text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              <span className={`text-base font-bold leading-tight ${on ? ACCENT[tier.accent] : ""}`}>{tier.name}</span>
              <span className="text-[0.65rem] tabular-nums text-ink-faint">{tier.price}</span>
              {tier.featured && (
                <span className={`absolute -top-2 rounded-full px-1.5 py-px text-[0.5rem] font-bold uppercase tracking-wider text-navy-950 ${ACCENT_BG[tier.accent]}`}>
                  Most students
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        {tiers.map((tier) => (
          <section
            key={tier.id}
            id={`tier-${tier.id}`}
            role="tabpanel"
            aria-labelledby={`tier-tab-${tier.id}`}
            className={`relative flex-col gap-5 rounded-2xl border p-6 ${active === tier.id ? "flex" : "hidden lg:flex"} ${
              tier.featured
                ? "border-structure/60 bg-navy-800 shadow-[0_0_48px_-16px_var(--color-structure)] lg:-my-3 lg:py-9"
                : "border-navy-600 bg-navy-800/70"
            }`}
          >
            {tier.featured && (
              <span className="absolute -top-3 left-6 hidden rounded-full bg-structure px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-navy-950 lg:block">
                Most students
              </span>
            )}
            <div className="flex flex-col gap-1">
              <h3 className={`text-3xl font-bold tracking-tight sm:text-4xl ${ACCENT[tier.accent]}`}>{tier.name}</h3>
              {tier.sub && <p className="text-xs text-ink-faint">({tier.sub})</p>}
              <p className="text-sm text-ink-muted">{tier.tagline}</p>
            </div>
            <div className="flex flex-col">
              <span className="flex items-baseline gap-2.5">
                {tier.future && (
                  <span className="text-xl font-semibold text-ink-faint line-through decoration-2" aria-label={`Future price ${tier.future}`}>
                    {tier.future}
                  </span>
                )}
                <span className="text-4xl font-bold tracking-tight text-ink">{tier.price}</span>
              </span>
              <span className="text-xs text-ink-faint">{tier.term}</span>
            </div>
            <TierArt has={tier.has} />

            {/* The one reason to choose this tier, taken out of the
                list.
                
                Sixteen identical ticks is a specification, and a
                specification hides the single thing somebody is
                paying the difference for. On VIP that thing is not
                another feature of the software - it is the teacher's
                own time, which is the only part of this that cannot
                be given to everybody. It gets its own box. */}
            {tier.standout && (
              <div
                className={`flex flex-col gap-1.5 rounded-xl border p-4 ${
                  { mindset: "border-mindset/50 bg-mindset/10", structure: "border-structure/50 bg-structure/10", storytelling: "border-storytelling/50 bg-storytelling/10" }[tier.accent]
                }`}
              >
                <span className="flex items-start gap-2">
                  <StarIcon className={`mt-0.5 size-4 shrink-0 ${ACCENT[tier.accent]} drop-shadow-[0_0_6px_currentColor]`} />
                  <span className={`text-sm font-bold leading-snug ${ACCENT[tier.accent]}`}>
                    {tier.standout.label}
                  </span>
                </span>
                <span className="pl-6 text-xs leading-relaxed text-ink-muted">{tier.standout.note}</span>
              </div>
            )}

            {/* Every tier lists everything: what it has, lit in its
                color; what it doesn't, greyed and struck - so the
                columns visibly fill in from left to right. */}
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {features.map((f) => {
                // Already said above, larger, in its own box.
                if (tier.standout?.id === f.id) return null;
                const has = tier.has.includes(f.id);
                const tick = { mindset: "text-mindset", structure: "text-structure", storytelling: "text-storytelling" }[tier.accent];
                return (
                  <li key={f.id} className={`flex items-start gap-2 ${has ? "text-ink" : "text-ink-faint/60"}`}>
                    {has ? (
                      <CheckIcon className={`mt-0.5 size-4 shrink-0 ${tick} drop-shadow-[0_0_5px_currentColor]`} />
                    ) : (
                      <XIcon className="mt-0.5 size-4 shrink-0 opacity-50" />
                    )}
                    <span className={has ? "" : "line-through decoration-ink-faint/50"}>{f.label}</span>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col items-start gap-2">
              <UnlockButton plan={tier.id} quiet={!tier.featured}>
                {tier.cta}
              </UnlockButton>
              {tier.note && <p className="text-xs text-ink-faint">{tier.note}</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
