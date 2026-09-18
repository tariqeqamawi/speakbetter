"use client";

import { useEffect, useRef, useState } from "react";
import { TalkingLion, type TalkingLionHandle } from "@/components/talking-lion";
import {
  ACCENTS,
  DEFAULT_STYLE,
  GEMINI_VOICES,
  STYLE_PRESETS,
  chooseVoice,
  chosenVoice,
  speakUrl,
} from "@/lib/coach/voice";
import { CheckIcon } from "@/components/icons";

// Prototype route - not part of the student experience. The audition:
// thirty stock voices, one real line of coaching, one direction in
// words, and the lion. Tap a voice and hear the lion say the line in
// it; star the ones worth a second listen; when one wins, "Use this
// voice" makes it the app's. The choice is kept in this browser until
// it's settled for everyone.

const LINES = [
  {
    label: "Credit and a next step",
    text: "Well done for hitting record - you spoke for a full two minutes, and that's no easy feat. Your story about the kitchen had real sensory detail; I could smell the bread. Next time, slow down on that moment and let us sit in it a second longer.",
  },
  {
    label: "Passed",
    text: "You've passed this challenge. Three colors lit up - storytelling, mindset, and body language - and your hands were painting the picture the whole way through. For next time: you used one metaphor, and it landed. Go for two or three.",
  },
  {
    label: "Keep going",
    text: "Not there yet, and that's completely fine - every attempt is compounding. The brief asked for one complete story with a beginning and an end, and yours stopped just before the ending. Tell us what happened next, and you're there.",
  },
];

const SHORTLIST_KEY = "speak-better-voice-shortlist";

export default function VoiceAudition() {
  const [line, setLine] = useState(LINES[0].text);
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [current, setCurrent] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | undefined>();
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState<"male" | "all">("male");
  const [accent, setAccent] = useState(0);
  // What's actually sent: the direction plus the accent.
  const direction = `${style}${ACCENTS[accent].suffix}`;
  const urlRef = useRef<string | null>(null);
  const lionRef = useRef<TalkingLionHandle>(null);

  // Read once, after mount: the shortlist and the chosen voice live in
  // this browser and aren't there on the server.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        setShortlist(JSON.parse(localStorage.getItem(SHORTLIST_KEY) ?? "[]"));
      } catch {
        // none yet
      }
      const c = chosenVoice();
      setChosen(c.voice);
      setStyle(c.style);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const audition = async (voice: string) => {
    if (busy) return;
    // Wake the audio path while this tap is still warm - the clip
    // arrives seconds from now, and by then a browser may refuse to
    // start sound on its own.
    lionRef.current?.prime();
    setBusy(voice);
    setError(null);
    const url = await speakUrl(line, voice, direction);
    setBusy(null);
    if (!url) {
      setError("The coach lost its voice for a moment - try again.");
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    setCurrent(voice);
    setAudio(url);
  };

  const toggleStar = (voice: string) => {
    const next = shortlist.includes(voice) ? shortlist.filter((v) => v !== voice) : [...shortlist, voice];
    setShortlist(next);
    try {
      localStorage.setItem(SHORTLIST_KEY, JSON.stringify(next));
    } catch {
      // fine
    }
  };

  const use = () => {
    if (!current) return;
    chooseVoice(current, direction);
    setChosen(current);
  };

  const ordered = GEMINI_VOICES.filter((v) => show === "all" || v.gender === "male").sort(
    (a, b) => Number(shortlist.includes(b.name)) - Number(shortlist.includes(a.name)),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Prototype · the coach</p>
        <h1 className="text-2xl font-semibold tracking-tight">Voice audition</h1>
        <p className="text-sm text-ink-muted">
          Thirty of Gemini&apos;s stock voices, one line of real coaching, and a direction in
          words. Tap a voice to hear the lion say it. Star the ones worth a second listen;
          when one wins, make it the app&apos;s.
        </p>
      </header>

      <TalkingLion ref={lionRef} audioSrc={audio} autoPlay />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-navy-600 bg-navy-800 px-4 py-3">
        <div className="text-sm">
          {current ? (
            <>
              <span className="text-ink-faint">Hearing </span>
              <span className="font-semibold text-ink">{current}</span>
              <span className="text-ink-faint">
                {" "}· {GEMINI_VOICES.find((v) => v.name === current)?.character}
              </span>
            </>
          ) : (
            <span className="text-ink-faint">Tap a voice below.</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-faint">
            The app speaks in <span className="font-semibold text-ink">{chosen || "…"}</span>
          </span>
          <button
            type="button"
            onClick={use}
            disabled={!current || current === chosen}
            className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-navy-900 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {current && current === chosen ? "This is the app's voice" : "Use this voice"}
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-faint">Register:</span>
          {STYLE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setStyle(p.style)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                style === p.style
                  ? "border-ink-faint bg-navy-700 text-ink"
                  : "border-navy-600 bg-navy-800 text-ink-muted hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
          <span className="ml-2 text-xs text-ink-faint">Accent:</span>
          {ACCENTS.map((a, i) => (
            <button
              key={a.label}
              type="button"
              onClick={() => setAccent(i)}
              aria-pressed={accent === i}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                accent === i
                  ? "border-ink-faint bg-navy-700 text-ink"
                  : "border-navy-600 bg-navy-800 text-ink-muted hover:text-ink"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          The direction - how the voice is told to say it (edit freely; the accent is added after)
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink outline-none focus:border-ink-faint"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {LINES.map((l) => (
            <button
              key={l.label}
              type="button"
              onClick={() => setLine(l.text)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                line === l.text
                  ? "border-ink-faint bg-navy-700 text-ink"
                  : "border-navy-600 bg-navy-800 text-ink-muted hover:text-ink"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <textarea
          value={line}
          onChange={(e) => setLine(e.target.value)}
          rows={3}
          aria-label="The line"
          className="w-full rounded-xl border border-navy-600 bg-navy-800 p-3 text-sm text-ink outline-none focus:border-ink-faint"
        />
        <p className="text-xs text-ink-faint">
          Each voice takes about six seconds to generate the first time and is instant after.
          A line costs about a cent.
        </p>
      </section>

      {error && <p className="text-sm text-storytelling">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          The lion is a low male voice. The sixteen male voices are listed, lowest and
          roughest first; the rest are there for comparison.
        </p>
        <div className="flex gap-1 rounded-lg border border-navy-600 bg-navy-900/60 p-0.5">
          {(["male", "all"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setShow(k)}
              aria-pressed={show === k}
              className={`rounded-md px-2.5 py-1 text-[0.7rem] font-semibold transition-colors ${
                show === k ? "bg-navy-700 text-ink" : "text-ink-faint hover:text-ink-muted"
              }`}
            >
              {k === "male" ? "Male" : "All 30"}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ordered.map((v) => {
          const starred = shortlist.includes(v.name);
          const on = current === v.name;
          const loading = busy === v.name;
          return (
            <li key={v.name}>
              <div
                className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${
                  on ? "border-ink-faint bg-navy-700" : "border-navy-600 bg-navy-800"
                }`}
              >
                <button
                  type="button"
                  onClick={() => audition(v.name)}
                  disabled={Boolean(busy)}
                  className="flex min-w-0 flex-1 flex-col items-start text-left disabled:opacity-60"
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    {v.name}
                    {v.name === chosen && <CheckIcon className="size-3.5 text-mindset" />}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {loading ? "generating…" : v.character}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleStar(v.name)}
                  aria-label={starred ? `Unstar ${v.name}` : `Star ${v.name}`}
                  aria-pressed={starred}
                  className={`shrink-0 text-lg leading-none transition-colors ${
                    starred ? "text-storytelling" : "text-navy-600 hover:text-ink-faint"
                  }`}
                >
                  ★
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
