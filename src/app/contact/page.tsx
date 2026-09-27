import type { Metadata } from "next";
import { SiteHero } from "@/components/site/site-hero";
import { SiteFooter } from "@/components/site/site-footer";
import { ContactForm } from "@/components/site/contact-form";
import { SUPPORT_EMAIL } from "@/data/support";
import { talkMailto } from "@/data/site";

// One address for everything - support, teams, partnerships, press -
// with a short form that writes the email for you.

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with Speak Better - ${SUPPORT_EMAIL}.`,
};

const QUICK = [
  { label: "Help with the app", subject: "Support" },
  { label: "Teams & companies", subject: "Teams" },
  { label: "Partnerships", subject: "Partnership" },
  { label: "Press & speaking", subject: "Press & speaking" },
];

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-12 pb-10">
      <SiteHero ghost="Hello" kicker="Contact" title="We'd love to hear from you" accent="text-mindset">
        Questions, help with the app, teams, partnerships - it all comes to one inbox, and a real person answers.
      </SiteHero>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK.map((q) => (
          <a
            key={q.subject}
            href={talkMailto(q.subject)}
            className="rounded-full border border-navy-600 bg-navy-800/60 px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
          >
            {q.label}
          </a>
        ))}
      </div>
      <ContactForm />
      <p className="text-center text-sm text-ink-muted">
        Or write to us directly at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-ink underline-offset-4 hover:underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
      <SiteFooter />
    </div>
  );
}
