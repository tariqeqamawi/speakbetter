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

// Ask your coach (master plan §07): tap once to start talking, tap
// again to send - "how have I been improving over my last few takes?"
// - and the coach answers from the student's own record, aloud, with
// captions. Holding a button down through a spoken question meant a
// student could not gesture, could not think with their hands, and
// lost the question if their thumb slipped; two taps is how every
// voice note on a phone is made. The
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

/** Questions worth asking, one at a time - a prompt rather than an
 *  instruction, changing every few seconds so the page suggests
 *  something new each time a student looks up. */
const EXAMPLES = [
  "How is my speaking developing?",
  "How have I been improving over my last few takes?",
  "What keeps coming up as a pattern for me?",
  "How have the colors I light up changed this week?",
  "What should I work on in my next challenge?",
  "Which lesson would help me most right now?",
  "Am I getting better at storytelling?",
  "What did you notice in my last take?",
];

function ExampleQuestion() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % EXAMPLES.length), 4200);
    return () => window.clearInterval(id);
  }, []);
  // A fixed height: a question that wraps to two lines used to take
  // the room from underneath it, and the lion - which is allowed to
  // shrink inside a flex column - got smaller every few seconds.
  return (
    <p className="flex h-14 w-full flex-col items-center justify-center gap-0.5 text-center">
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">Example question</span>
      <span key={i} className="coach-cue line-clamp-1 max-w-full text-sm font-medium text-ink-muted">
        &ldquo;{EXAMPLES[i]}&rdquo;
      </span>
    </p>
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
  const [typing, setTyping] = useState(false);
  const [greetText, setGreetText] = useState("");
  const [greetUrl, setGreetUrl] = useState<string | null>(null);
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

  // Coach says hello, and that is all he says.
  //
  // He used to open with a review of the student's whole record, which
  // put the page into its "answering" state before a question had been
  // asked - so the button read "Coach is answering" to somebody who had
  // just arrived, and could not be pressed. A greeting is two words: it
  // says he is here and hands the floor straight back.
  const greeted = useRef(false);
  useEffect(() => {
    if (!ready || greeted.current) return;
    greeted.current = true;
    const first = state.displayName.trim().split(" ")[0];
    const lines = first
      ? [`Hey, ${first}.`, "Welcome back.", "Nice to see you.", "How can I help?", `Good to see you, ${first}.`]
      : ["Hey.", "Welcome back.", "Nice to see you.", "How can I help?"];
    const line = lines[Math.floor(Math.random() * lines.length)];
    let alive = true;
    (async () => {
      try {
        const spoken = await speakUrl(line);
        if (!alive || !spoken) return;
        setGreetText(line);
        setGreetUrl(spoken);
      } catch {
        // A greeting that fails is no greeting - the page works without it.
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

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
        setError("Coach lost his voice for a moment - the answer is written below.");
      }
    } catch (e) {
      setPhase("failed");
      setError(e instanceof Error && e.message !== "no answer" ? e.message : "Coach didn't catch that - try asking again.");
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

  /** One button, two taps: start, then stop. Priming on each tap
   *  keeps the browser's sound permission warm for the answer. */
  const onPress = () => {
    lionRef.current?.stop();
    setGreetUrl(null);
    lionRef.current?.prime();
    if (phase === "listening") {
      stopListening();
      return;
    }
    if (phase === "idle" || phase === "failed") startListening();
  };

  if (!ready) return null;
  if (!hasCoach(state))
    return (
      <section className="flex flex-col overflow-hidden rounded-2xl border border-navy-600 bg-navy-800">
        <SectionBanner image="/sections/trophies-lion.jpg" title="Ask Coach" Icon={ListenIcon} accentClass="text-advanced" large />
        <div className="p-5">
          <UpgradePanel
            title="Coach on call is the Full Experience"
            body="Upgrade now for the full 24/7 coach experience: ask him anything, any time, and he answers aloud from your own record - every take, every note. He already watches your takes and writes your reviews; this is him on call."
          />
        </div>
      </section>
    );

  const label =
    phase === "listening"
      ? "Listening"
      : phase === "thinking"
        ? "Processing"
        : phase === "answering"
          ? "Coach is answering"
          : "Ask Coach";

  return (
    <section className="flex flex-col items-center gap-3">
      <ExampleQuestion />

      {/* The lion is the page. Everything else is one button and two
          quiet lines under it. */}
      <TalkingLion
        ref={lionRef}
        text={answer || greetText}
        captions
        controls={false}
        large
        className="shrink-0"
        audioSrc={phase === "answering" && url ? url : (greetUrl ?? undefined)}
        autoPlay={phase === "answering" || !!greetUrl}
        onEnded={() => {
          setPhase("idle");
          setGreetUrl(null);
        }}
      />

      <div className="flex w-full max-w-sm flex-col items-center gap-2.5">
        {canTalk && (
          <button
            type="button"
            disabled={phase === "thinking" || phase === "answering"}
            onClick={onPress}
            className={`coach-pill inline-flex min-h-16 w-full select-none items-center justify-center gap-3 rounded-full px-6 text-lg font-bold text-navy-950 transition-transform disabled:opacity-70 ${
              phase === "listening" ? "scale-[1.03]" : "hover:scale-[1.02] active:scale-[0.99]"
            }`}
          >
            <span className="flex items-center gap-3 text-navy-950">
              {phase === "listening" ? (
                <span aria-hidden className="flex items-end gap-[3px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="listening-bar w-[3px] rounded-full bg-navy-950"
                      style={{ animationDelay: `${i * 140}ms` }}
                    />
                  ))}
                </span>
              ) : (
                <ListenIcon className="size-6" />
              )}
              {label}
            </span>
          </button>
        )}

        {/* Typing is the quiet second way in, folded away until it is
            asked for - the button above is the one thing to see. */}
        {!canTalk || typing ? (
          <form
            className="flex w-full items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!typed.trim()) return;
              lionRef.current?.prime();
              ask({ question: typed.trim() });
              setTyped("");
              setTyping(false);
            }}
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type a question for Coach"
              autoFocus={typing}
              maxLength={300}
              className="min-w-0 flex-1 rounded-full border border-navy-600 bg-navy-950 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typed.trim() || phase === "thinking" || phase === "answering"}
              className="rounded-full border border-navy-600 px-4 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setTyping(true)}
            className="text-sm font-medium text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Type a question
          </button>
        )}

        {error && <p className="text-center text-xs text-storytelling">{error}</p>}

        {/* What was asked and what came back, both behind one line, so
            an answer never pushes the lion off the screen. */}
        {answer && phase !== "answering" && (
          <div className="flex w-full flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setReading((r) => !r)}
              aria-expanded={reading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-faint transition-colors hover:text-ink"
            >
              {reading ? "Hide" : "Read"} what Coach said
              <ChevronDownIcon className={`size-3.5 transition-transform ${reading ? "rotate-180" : ""}`} />
            </button>
            {reading && (
              <div className="coach-cue w-full rounded-2xl border border-navy-600 bg-navy-900/60 px-4 py-3">
                {question && (
                  <p className="pb-1.5 text-xs text-ink-faint">
                    You asked: <span className="text-ink-muted">&ldquo;{question}&rdquo;</span>
                  </p>
                )}
                <p className="text-sm leading-relaxed text-ink">{answer}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAnswer("");
                    setQuestion("");
                    setReading(false);
                    setPhase("idle");
                  }}
                  className="inline-flex items-center gap-1.5 pt-2 text-xs font-semibold text-ink-faint transition-colors hover:text-ink"
                >
                  <XIcon className="size-3.5" />
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
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
