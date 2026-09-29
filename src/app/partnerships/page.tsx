import type { Metadata } from "next";
import { SiteAsk, SiteHero } from "@/components/site/site-hero";
import { SiteFooter } from "@/components/site/site-footer";
import { talkMailto } from "@/data/site";

// Who Speak Better partners with, and one door each.

export const metadata: Metadata = {
  title: "Partnerships",
  description: "Partner with Speak Better - schools, coaches, events and creators.",
};

const KINDS = [
  { title: "Schools & universities", body: "Speaking as part of the curriculum - the app for your students, and Tariq for the big day.", accent: "border-mindset/50 text-mindset" },
  { title: "Coaches & trainers", body: "Give your clients the eight colors and Coach between your sessions.", accent: "border-storytelling/50 text-storytelling" },
  { title: "Events & conferences", body: "A keynote or workshop from Tariq, and the app for your attendees afterwards.", accent: "border-acting/50 text-acting" },
  { title: "Creators & affiliates", body: "Share Speak Better with your audience and grow with it.", accent: "border-structure/50 text-structure" },
];

export default function PartnershipsPage() {
  return (
    <div className="flex flex-col gap-16 pb-10">
      <SiteHero ghost="Partners" kicker="Partnerships" title="Let's help more people find their voice" accent="text-structure">
        If you teach, train, host or create, there&apos;s a way to bring Speak Better to your people.
      </SiteHero>
      <section className="grid gap-4 sm:grid-cols-2">
        {KINDS.map((k) => {
          const [border, text] = k.accent.split(" ");
          return (
            <div key={k.title} className={`flex flex-col gap-3 rounded-3xl border bg-navy-800/60 p-6 ${border}`}>
              <b className={`text-lg font-semibold ${text}`}>{k.title}</b>
              <p className="flex-1 text-sm text-ink-muted">{k.body}</p>
              <span className="self-start">
                <SiteAsk href={talkMailto(`Partnership - ${k.title}`, ["Name", "Organisation", "What you have in mind"])}>
                  Talk to us
                </SiteAsk>
              </span>
            </div>
          );
        })}
      </section>
      <SiteFooter />
    </div>
  );
}
