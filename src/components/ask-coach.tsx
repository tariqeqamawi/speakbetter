"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { challenges } from "@/data/challenges";
import { standing } from "@/lib/progress";
import { currentStreak } from "@/data/badges";
import { speakUrl } from "@/lib/coach/voice";
import { TalkingLion, type TalkingLionHandle } from "@/components/talking-lion";
import { SectionBanner } from "@/components/section-banner";
import { ChevronDownIcon, ListenIcon, XIcon } from "@/components/icons";
import { hapticTap } from "@/lib/feedback-fx";
import { hasCoach } from "@/lib/plan";
import { UpgradePanel } from "@/components/upgrade-panel";

// Ask your coach (master plan §07): hold the button and ask - "how
// have I been improving over my last few takes?" - and the coach
// answers from the student's own record, aloud, with captions. The
// record is what this device holds: every attempt, the notes on it,
// the streak, the XP, the rank. Nothing is stored for this; the
// question and the record go up, the answer comes back, that's all.

type Phase = "idle" | "listening" | "thinking" | "answering" | "failed";

function pickAudioMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((m) =>
    MediaRecorder.isTypeSupported(m),
  );
}

export function AskCoach() {
  const { state, ready } = useStore();
  const [phase, setPhase] = useState<Phase>("idle");
  const [question, setQuestion] = useState("");
  const [typed, setTyped] = useState("");
  const [answer, setAnswer] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lionRef = useRef<TalkingLionHandle>(null);
  const canTalk = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && pickAudioMime() !== undefined;

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  /** The student's record, compact - what the coach answers from. */
  const record = () => {
    const rank = standing(state);
    const title = (slug: string) => challenges.find((c) => c.slug === slug)?.title ?? slug;
    return {
      today: new Date().toISOString().slice(0, 10),
      level: state.level,
      xp: rank.xp,
      rank: rank.rank.name,
      nextRank: rank.next ? { name: rank.next.name, xpToGo: rank.toNext } : null,
      streakDays: currentStreak(state),
      lessonsWatched: state.watchedLessons.length,
      badges: state.badges.map((b) => b.title),
      attempts: [...state.attempts]
        .sort((a, b) => (a.at < b.at ? -1 : 1))
        .map((a) => ({
          date: a.at.slice(0, 10),
          challenge: title(a.challengeSlug),
          seconds: a.durationSec,
          score: a.score,
          passed: a.passed,
          spectrum: a.spectrum,
          summary: a.summary,
          whatWorked: (a.strengths ?? []).map((n) => n.note),
          nextTime: a.focus.map((n) => n.note),
          skillsSpotted: (a.skillsSpotted ?? []).map((s) => s.evidence),
        })),
    };
  };

  const ask = async (payload: { audio?: { data: string; mimeType: string }; question?: string }) => {
    setPhase("thinking");
    setError(null);
    setAnswer("");
    setReading(false);
    if (url) {
      URL.revokeObjectURL(url);
      setUrl(null);
    }
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, record: record(), displayName: state.displayName, level: state.level }),
      });
      const json = (await res.json()) as { question?: string; answer?: string; error?: string };
      if (!res.ok || !json.answer) throw new Error(json.error || "no answer");
      setQuestion(json.question ?? payload.question ?? "");
      setAnswer(json.answer);
      const spoken = await speakUrl(json.answer);
      if (spoken) {
        setUrl(spoken);
        setPhase("answering");
      } else {
        setPhase("failed");
        setError("Your coach lost its voice for a moment - the answer is written below.");
      }
    } catch (e) {
      setPhase("failed");
      setError(e instanceof Error && e.message !== "no answer" ? e.message : "Your coach didn't catch that - try asking again.");
    }
  };

  const startListening = async () => {
    const mime = pickAudioMime();
    if (!mime) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: mime });
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime.split(";")[0] });
        if (blob.size < 2000) {
          setPhase("idle");
          return;
        }
        const data = await toBase64(blob);
        lionRef.current?.prime();
        ask({ audio: { data, mimeType: blob.type } });
      };
      recRef.current = rec;
      rec.start(250);
      hapticTap();
      setPhase("listening");
    } catch {
      setError("The microphone isn't available here - type your question instead.");
    }
  };

  const stopListening = () => {
    const rec = recRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    recRef.current = null;
  };

  if (!ready) return null;
  if (!hasCoach(state))
    return (
      <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
        <SectionBanner image="/sections/trophies-lion.jpg" title="Ask your coach" Icon={ListenIcon} accentClass="text-advanced" large />
        <div className="p-5">
          <UpgradePanel
            title="Ask your coach comes with the Full Experience"
            body="Hold to ask how your speaking is developing and the coach answers from your own record - every take, every note - aloud. It's part of the membership, with the coach who watches every take."
          />
        </div>
      </section>
    );

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
      <SectionBanner image="/sections/trophies-lion.jpg" title="Ask your coach" Icon={ListenIcon} accentClass="text-advanced" large />
      <div className="flex flex-col gap-4 p-5">
        <p className="text-sm text-ink-muted">
          Ask how your speaking is developing - &ldquo;how have I been improving over my last few takes?&rdquo;,
          &ldquo;what keeps coming up?&rdquo; - and your coach answers from your own record: every take, every note.
        </p>

        <TalkingLion
          ref={lionRef}
          text={answer}
          captions
          controls={false}
          audioSrc={phase === "answering" && url ? url : undefined}
          autoPlay={phase === "answering"}
          onEnded={() => setPhase("idle")}
          className="scale-90"
        />

        {question && (
          <p className="text-center text-xs text-ink-faint">
            You asked: <span className="text-ink-muted">&ldquo;{question}&rdquo;</span>
          </p>
        )}
        {answer && phase !== "answering" && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setReading((r) => !r)}
              aria-expanded={reading}
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-600 px-3.5 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              {reading ? "Hide" : "Read"} the answer
              <ChevronDownIcon className={`size-3.5 transition-transform ${reading ? "rotate-180" : ""}`} />
            </button>
            {reading && (
              <p className="coach-cue w-full rounded-xl border border-navy-600 bg-navy-900/60 px-4 py-3 text-sm leading-relaxed text-ink">{answer}</p>
            )}
          </div>
        )}
        {error && <p className="text-center text-xs text-storytelling">{error}</p>}

        <div className="flex flex-col items-center gap-3">
          {canTalk && (
            <button
              type="button"
              disabled={phase === "thinking" || phase === "answering"}
              onPointerDown={(e) => {
                e.preventDefault();
                if (phase === "idle" || phase === "failed") startListening();
              }}
              onPointerUp={stopListening}
              onPointerCancel={stopListening}
              onPointerLeave={() => phase === "listening" && stopListening()}
              onContextMenu={(e) => e.preventDefault()}
              className={`select-none rounded-full px-6 py-3 text-sm font-semibold transition-all disabled:opacity-50 ${
                phase === "listening"
                  ? "bg-acting text-navy-900 shadow-[0_0_28px_-2px_var(--color-acting)] scale-105"
                  : "bg-ink text-navy-900 hover:opacity-90"
              }`}
              style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
            >
              {phase === "listening"
                ? "Listening… let go when you're done"
                : phase === "thinking"
                  ? "Your coach is looking at your record…"
                  : phase === "answering"
                    ? "Your coach is answering"
                    : "Hold to ask"}
            </button>
          )}
          <form
            className="flex w-full max-w-md items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!typed.trim()) return;
              lionRef.current?.prime();
              ask({ question: typed.trim() });
              setTyped("");
            }}
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={canTalk ? "Or type a question" : "Type a question for your coach"}
              maxLength={300}
              className="min-w-0 flex-1 rounded-lg border border-navy-600 bg-navy-950 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typed.trim() || phase === "thinking" || phase === "answering"}
              className="rounded-lg border border-navy-600 px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              Ask
            </button>
            {(answer || question) && (
              <button
                type="button"
                onClick={() => {
                  setAnswer("");
                  setQuestion("");
                  setPhase("idle");
                }}
                aria-label="Clear"
                className="grid size-9 shrink-0 place-items-center rounded-full border border-navy-600 text-ink-faint hover:text-ink"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </form>
          <p className="text-center text-[0.65rem] text-ink-faint">
            Your record goes up with the question and comes straight back with the answer - nothing is kept.
          </p>
        </div>
      </div>
    </section>
  );
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
