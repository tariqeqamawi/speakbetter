"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";
import { LionMouth } from "@/components/lion-mouth";

// Signing in: an email address and a link. No password - a course
// somebody opens on a phone each morning shouldn't ask them to
// remember one, and a link in an inbox is the shortest honest path to
// "this is me".
//
// Without Supabase configured the page says so plainly rather than
// pretending: the app still runs, one student per device.

export function SignIn() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [error, setError] = useState("");

  const send = async () => {
    const db = supabase();
    if (!db) return;
    setState("sending");
    setError("");
    const { error: failed } = await db.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (failed) {
      setState("failed");
      setError(failed.message);
    } else {
      setState("sent");
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <Image src="/logo-mark.png" alt="Speak Better" width={320} height={256} className="h-20 w-auto" priority />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-ink-muted">
          Your takes, your reviews and your road follow you between phones and laptops. Sign in with your email and
          we&apos;ll send a link - no password to remember.
        </p>
      </div>

      {!supabaseConfigured() ? (
        <p className="rounded-xl border border-navy-600 bg-navy-800 p-4 text-sm text-ink-muted">
          Accounts aren&apos;t switched on in this environment yet. Everything works as it does today - your record
          lives on this device.
        </p>
      ) : state === "sent" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-mindset/40 bg-navy-800 p-6">
          <LionMouth level={0} className="w-20" />
          <p className="text-sm font-semibold text-ink">Check your email</p>
          <p className="text-xs text-ink-muted">
            A link is on its way to <b className="text-ink">{email}</b>. Open it on the device you want to practice on.
          </p>
        </div>
      ) : (
        <form
          className="flex w-full flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-h-12 rounded-xl border border-navy-600 bg-navy-950 px-4 text-sm text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
          />
          <button
            type="submit"
            disabled={state === "sending" || email.trim().length < 5}
            className="coach-pill flex min-h-12 items-center justify-center rounded-full text-sm font-bold text-navy-950 disabled:opacity-50"
          >
            <span className="text-navy-950">{state === "sending" ? "Sending the link…" : "Email me a link"}</span>
          </button>
          {error && <p className="text-xs text-storytelling">{error}</p>}
        </form>
      )}

      <p className="text-[0.65rem] text-ink-faint">
        Your recordings never leave your device except to be reviewed, and the copy Coach watched is deleted the moment
        the review is back.
      </p>
    </div>
  );
}
