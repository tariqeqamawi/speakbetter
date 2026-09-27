"use client";

import { useState } from "react";
import { SUPPORT_EMAIL } from "@/data/support";

// A short form that writes the email: it opens the visitor's own mail
// app with everything filled in, addressed to the one inbox. (Sending
// from the page itself needs an email service; this works today.)

const TOPICS = ["Help with the app", "Teams & companies", "Partnerships", "Press & speaking", "Something else"];

export function ContactForm() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Speak Better - ${topic}${name ? ` - ${name}` : ""}`;
    const body = `${message}\n\n${name ? `- ${name}` : ""}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const field = "w-full rounded-xl border border-navy-600 bg-navy-900 px-4 py-3 text-ink placeholder:text-ink-faint focus:border-body-language focus:outline-none";
  return (
    <form onSubmit={send} className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-navy-600 bg-navy-800/60 p-6">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-muted">
        What it&apos;s about
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-muted">
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-muted">
        Message
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} className={field} />
      </label>
      <button type="submit" className="cta-neon-wrap self-center rounded-xl">
        <span className="cta-neon block rounded-xl px-8 py-3 text-base">Write the email</span>
      </button>
      <p className="text-center text-xs text-ink-faint">Opens your email app with this filled in, ready to send.</p>
    </form>
  );
}
