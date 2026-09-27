"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// "How the road works" - the whole game on one page, behind a small ?
// on the road. The road itself stays clean: no instructions painted on
// it. Each thing a student might wonder about is a card - a picture of
// it on top, what it is underneath - and the page closes back to the
// road.

const PHASES = [
  { id: "S", color: "#1fe890" },
  { id: "T", color: "#22d9f5" },
  { id: "O", color: "#ffd60a" },
  { id: "R", color: "#ff4a2b" },
  { id: "Y", color: "#f53de0" },
];

/** A portal as the road draws it, in one of its three states. */
function PortalDot({ kind, n }: { kind: "open" | "done" | "shut"; n: number }) {
  const ring =
    kind === "open"
      ? "border-white shadow-[0_0_18px_4px_rgba(255,255,255,0.55)]"
      : kind === "done"
        ? "border-mindset"
        : "border-[#2b303b]";
  const eye =
    kind === "open"
      ? "radial-gradient(circle, #ffffff 0%, #bff7df 30%, #1fe890 65%, #0b3a28 100%)"
      : kind === "done"
        ? "radial-gradient(circle, #1fe890 0%, #127a52 55%, #07261a 100%)"
        : "radial-gradient(circle, #151922 0%, #0c0f16 100%)";
  return (
    <span className={`relative grid size-16 place-items-center rounded-full border-[3px] ${ring}`} style={{ background: eye }}>
      <span
        className={`grid size-8 place-items-center rounded-full bg-[rgb(5,8,16)] text-sm font-extrabold ${
          kind === "shut" ? "text-[#5a6282]" : "text-white"
        }`}
      >
        {n}
      </span>
    </span>
  );
}

function Card({ visual, title, children }: { visual: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col items-center gap-3 rounded-2xl border border-navy-600 bg-navy-800/70 p-4 text-center">
      <div className="flex min-h-16 items-center justify-center">{visual}</div>
      <b className="text-base text-ink">{title}</b>
      <div className="text-sm leading-snug text-ink-muted">{children}</div>
    </li>
  );
}

function Legend() {
  return (
    <ul className="flex flex-col gap-3">
      <Card
        title="Moving"
        visual={
          <div className="flex items-center gap-5">
            {/* The dial, as it sits on the road. */}
            <span className="flex flex-col items-center gap-1 rounded-full border border-white/15 bg-navy-950/70 p-1 shadow-[0_0_14px_-4px_#1fe890]">
              <span className="grid size-6 place-items-center text-white/80">▲</span>
              <span className="relative h-12 w-6">
                <span className="absolute inset-x-[0.65rem] inset-y-0.5 rounded-full bg-white/15" />
                <span className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/25" />
              </span>
              <span className="grid size-6 place-items-center text-white/80">▼</span>
            </span>
            <span className="text-2xl" aria-hidden>
              ☝️
            </span>
          </div>
        }
      >
        Drag the road down or scroll to travel forward, and up to go back. Or hold the <b className="text-ink">dial</b>:
        push up to go forward - the higher, the faster - and down to go back. On a phone, <b className="text-ink">tilt it</b> to
        look around.
      </Card>

      <Card
        title="Jump to a section"
        visual={
          <span className="flex gap-1.5">
            {PHASES.map((p, i) => (
              <span
                key={p.id}
                className="grid size-9 place-items-center rounded-full border-2 text-sm font-extrabold"
                style={{
                  borderColor: p.color,
                  color: i === 0 ? "#070c18" : p.color,
                  background: i === 0 ? p.color : "rgba(7,12,24,0.7)",
                  boxShadow: i === 0 ? `0 0 14px ${p.color}` : undefined,
                }}
              >
                {p.id}
              </span>
            ))}
          </span>
        }
      >
        Tap a S·T·O·R·Y letter to fly to that section.
      </Card>

      <Card
        title="Every portal is a challenge"
        visual={
          <div className="flex items-start gap-4">
            {(
              [
                ["open", 2, "Open"],
                ["done", 1, "Done"],
                ["shut", 5, "Not open yet"],
              ] as const
            ).map(([kind, n, label]) => (
              <span key={kind} className="flex flex-col items-center gap-1.5">
                <PortalDot kind={kind} n={n} />
                <span className="text-[0.7rem] font-semibold text-ink-faint">{label}</span>
              </span>
            ))}
          </div>
        }
      >
        Numbered in order, with its name above it as you come close. <b className="text-white">White and glowing</b>: open
        and waiting - tap it, or <b className="text-ink">Start challenge</b>, to dive in.{" "}
        <b className="text-mindset">Rimmed in its section&apos;s colour</b>: done - tap to replay.{" "}
        <b className="text-ink-faint">Dark and grey</b>: not open yet.
      </Card>

      <Card
        title="Five sections"
        visual={
          <span className="flex gap-1.5">
            {PHASES.map((p) => (
              <span
                key={p.id}
                className="relative size-12 overflow-hidden rounded-lg border-2 sm:size-14"
                style={{ borderColor: p.color }}
              >
                <Image src={`/road/section-${p.id}.webp`} alt="" fill sizes="56px" className="object-cover" />
                <span
                  className="absolute bottom-0.5 left-1 text-xs font-extrabold"
                  style={{ color: p.color, textShadow: "0 1px 4px #000" }}
                >
                  {p.id}
                </span>
              </span>
            ))}
          </span>
        }
      >
        Take the challenges in your section in any order. Finish them all and the next section opens, with a banner as
        you cross into it.
      </Card>

      <Card
        title="Faces and initials"
        visual={
          <span className="flex -space-x-2">
            {["M", "J", "A", "P"].map((l, i) => (
              <span
                key={l}
                className="grid size-10 place-items-center rounded-full border-2 border-navy-900 text-sm font-bold text-navy-950"
                style={{ background: ["#f53de0", "#22d9f5", "#ffd60a", "#1fe890"][i] }}
              >
                {l}
              </span>
            ))}
          </span>
        }
      >
        The little faces and initials by a portal are your classmates - people who have been on that challenge recently.
        The speech cards are what they said about it.
      </Card>

      <Card
        title="Trophy silhouettes"
        visual={
          <span className="flex items-end gap-5">
            <span className="flex flex-col items-center gap-1">
              <span className="relative size-14">
                <span className="absolute inset-1 rounded-full bg-mindset/40 blur-md" />
                <Image
                  src="/trophy/challenge-avoid-boring-words.webp"
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain brightness-0"
                />
              </span>
              <span className="text-[0.7rem] font-semibold text-ink-faint">Not yet won</span>
            </span>
            <span className="flex flex-col items-center gap-1">
              <span className="relative size-14">
                <Image src="/trophy/challenge-avoid-boring-words.webp" alt="" fill sizes="56px" className="object-contain" />
              </span>
              <span className="text-[0.7rem] font-semibold text-ink-faint">Won</span>
            </span>
          </span>
        }
      >
        Each portal has its trophy beside it - a silhouette until you win it. Pass the challenge well and it lights up, on
        the road and in your trophy case.
      </Card>

      <Card
        title="Coach"
        visual={
          <span className="flex items-center gap-2">
            <Image src="/logo-mark.png" alt="" width={56} height={45} className="h-12 w-auto" />
            <span className="rounded-xl rounded-bl-none border border-figurative/50 bg-navy-950 px-3 py-1.5 text-xs text-ink">
              Two colors lit today!
            </span>
          </span>
        }
      >
        Coach appears in the sky and speaks when you make real progress: the first time you open the road, when you pass
        a challenge, and when a new section opens. Exploring is quiet. 🔊 turns his voice and the road&apos;s sounds on or
        off.
      </Card>

      <Card title="The finish line" visual={<span className="text-4xl">🏁</span>}>
        Pass every challenge and you can cross the finish line at the end of the road.
      </Card>

      <Card
        title="3D, 2D and full screen"
        visual={
          <span className="flex items-center gap-2">
            <span className="flex rounded-full border border-navy-600 bg-navy-950/80 p-1 text-xs font-bold">
              <span className="rounded-full border border-body-language/70 bg-navy-700/70 px-3 py-1 text-ink shadow-[0_0_12px_-2px_var(--color-body-language)]">
                3D
              </span>
              <span className="px-3 py-1 text-ink-muted">2D</span>
            </span>
            <span className="grid size-8 place-items-center rounded-full border border-navy-600 bg-navy-950/80 text-ink-muted">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
            </span>
          </span>
        }
      >
        Switch between the 3D road and a flat 2D map at any time. The full-screen button hides everything but the road;
        tap ✕, pinch, or turn your phone upright to come back.
      </Card>
    </ul>
  );
}

export function RoadLegendButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How the road works"
        className="grid size-9 place-items-center rounded-full border border-navy-600 bg-navy-950/80 text-sm font-bold text-ink-muted backdrop-blur hover:text-ink"
      >
        ?
      </button>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="road-legend-title"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/80 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-3xl border border-navy-600 bg-navy-900 p-4 shadow-2xl sm:p-5"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-ink-muted hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="spectrum-rule block h-1 w-12 rounded-full" />
                <h2 id="road-legend-title" className="text-xl font-semibold">
                  How the road works
                </h2>
              </div>
              <Legend />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="self-center rounded-full border border-body-language/70 bg-navy-700/70 px-6 py-2 text-sm font-semibold text-ink shadow-[0_0_12px_-2px_var(--color-body-language)]"
              >
                Got it
              </button>
            </div>
          </div>,
          // On the page itself, so no box the road sits in can clip it or
          // hold it under the tab bar.
          document.body,
        )}
    </>
  );
}
