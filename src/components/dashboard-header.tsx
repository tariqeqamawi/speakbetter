"use client";

import { useRef, useState } from "react";
import { useStore, type Level } from "@/lib/store";
import { standing } from "@/lib/progress";
import { LevelIcon, levelMeta } from "@/components/level-icon";
import { AvatarCrop } from "@/components/avatar-crop";
import { SectionTour } from "@/components/section-tour";
import { ChevronDownIcon, ProfileIcon } from "@/components/icons";
import { ProTip } from "@/components/pro-tip";

const levelOrder: Level[] = ["beginner", "intermediate", "advanced"];

// The heads-up display: who they are, what rank they've reached, and -
// held above all of it - the reason they gave for starting. Everything
// else on this page counts what they did; this says why.


/**
 * The student in one line, for the top of the phone dashboard: avatar,
 * name, level, rank and the bar to the next one. Tapping it opens the
 * full card below.
 */
export function DashboardHeaderCompact({
  open = false,
  onToggle,
}: {
  /** Whether the full card is showing underneath. */
  open?: boolean;
  onToggle?: () => void;
}) {
  const { state } = useStore();
  const rank = standing(state);
  const level = state.level ?? "beginner";
  const levelColor =
    level === "beginner" ? "text-storytelling" : level === "intermediate" ? "text-figurative" : "text-acting";

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full border border-navy-500 bg-navy-900">
          {state.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.avatar} alt="" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-ink-faint">
              <ProfileIcon className="size-6" />
            </span>
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-xl font-semibold tracking-tight text-ink">
            {state.displayName || "You"}
          </span>
          {/* Level and rank said in full, not as two tiny words: they
              are the two things a student checks when they open this. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className={`rounded-full border border-current px-2 py-0.5 font-semibold capitalize ${levelColor}`}>
              {level}
            </span>
            <span className="font-semibold text-ink">{rank.rank.name}</span>
            <span className="tabular-nums text-ink-faint">{rank.xp.toLocaleString()} XP</span>
          </div>
        </div>

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? "Close your card" : "Open your card"}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-navy-600 text-ink-faint transition-colors hover:border-ink-faint hover:text-ink"
          >
            <ChevronDownIcon className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* How far to the next rank, said and drawn. */}
      {rank.next && (
        <div className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between text-[0.7rem] text-ink-faint">
            <span>
              <b className="font-semibold tabular-nums text-ink">{rank.toNext.toLocaleString()} XP</b> to{" "}
              {rank.next.name}
            </span>
            <span className="tabular-nums">{Math.round(rank.progress * 100)}%</span>
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-navy-900">
            <span className="spectrum-rule block h-full rounded-full transition-[width] duration-700" style={{ width: `${rank.progress * 100}%` }} />
          </span>
        </div>
      )}

      {/* The reason they wrote and the day's tip: the two things worth
          unfolding for. Folded, this is a thin banner and the panels
          below it start higher up the screen. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex flex-col gap-1 rounded-xl border border-navy-600 bg-navy-900/60 px-3 py-2.5">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-ink-faint">
                Why you started
              </span>
              {state.intention ? (
                <span className="text-sm italic leading-relaxed text-ink-muted">&ldquo;{state.intention}&rdquo;</span>
              ) : (
                <span className="text-xs text-ink-faint">Write your reason on your full card below.</span>
              )}
            </div>
            <ProTip />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardHeader() {
  const { state, setProfile, setIntention, setLevel } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingWhy, setEditingWhy] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.displayName);
  const [whyDraft, setWhyDraft] = useState(state.intention);
  const [picked, setPicked] = useState<string | null>(null);

  const rank = standing(state);
  const level = state.level ?? "beginner";

  // The picked file goes to the cropper rather than straight into the
  // profile: squashing it to a square cropped from the center, and a
  // photo of a person is almost never composed that way. The cropper
  // hands back the 256-square the store keeps.
  const onPick = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPicked(String(reader.result));
    reader.readAsDataURL(file);
  };

  // Not overflow-hidden: the level menu opens downward out of this card,
  // and clipping the card clipped the menu. Only the top rule needs
  // clipping, so it gets its own rounded window.
  return (
    <section className="relative rounded-2xl border border-navy-600 bg-navy-800 p-5 sm:p-6">
      <span className="absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-2xl">
        <span className="spectrum-rule block h-full w-full" />
      </span>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* avatar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-navy-500 bg-navy-900 transition-colors hover:border-ink-faint"
            aria-label="Change your picture"
          >
            {state.avatar ? (
              // A data URL from the student's own device - next/image would
              // only add an optimizer hop for something already sized.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.avatar}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center">
                <ProfileIcon className="size-8 text-ink-faint" />
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-navy-950/80 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider text-ink-muted opacity-0 transition-opacity group-hover:opacity-100">
              Change
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              // Let the same file be picked again after a cancel.
              e.target.value = "";
            }}
          />
          {picked && (
            <AvatarCrop
              src={picked}
              onCancel={() => setPicked(null)}
              onDone={(avatar) => {
                setProfile({ avatar });
                setPicked(null);
              }}
            />
          )}

          <div className="flex flex-col gap-1">
            {editingName ? (
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => {
                  setProfile({ displayName: nameDraft.trim() });
                  setEditingName(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                maxLength={40}
                autoFocus
                placeholder="Your name"
                className="rounded-lg border border-navy-600 bg-navy-900 px-2 py-1 text-xl font-semibold text-ink focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameDraft(state.displayName);
                  setEditingName(true);
                }}
                className="text-left text-2xl font-semibold tracking-tight text-ink transition-colors hover:text-ink-muted"
              >
                {state.displayName || "Add your name"}
              </button>
            )}
            {/* Standing, worn plainly - and changed from here. The level
                is the student's own call (§09), so the insignia beside
                their name is the control, not a read-out of one kept
                somewhere else. */}
            <span className="relative flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLevelOpen((v) => !v)}
                aria-expanded={levelOpen}
                aria-haspopup="listbox"
                className={`flex items-center gap-1.5 rounded-full border border-navy-500 bg-navy-900 py-1 pl-1 pr-3 text-xs font-semibold transition-colors hover:border-ink-faint ${levelMeta[level].accentClass}`}
              >
                <LevelIcon level={level} className="h-6 w-auto" />
                {levelMeta[level].label}
                <ChevronDownIcon className="size-3.5 text-ink-faint" />
              </button>
              <span className="text-xs text-ink-faint">{rank.rank.name}</span>
              <SectionTour section="dashboard" />

              {levelOpen && (
                <>
                {/* On a phone this is a sheet in the middle of the
                    screen rather than a dropdown: anchored to the
                    button, its right-hand side ran off the screen and
                    took half of every description with it - the
                    descriptions being the entire reason the menu
                    exists. On a laptop it stays a dropdown. */}
                <span
                  aria-hidden
                  onClick={() => setLevelOpen(false)}
                  className="fixed inset-0 z-20 bg-navy-950/70 sm:hidden"
                />
                <div
                  role="listbox"
                  className="fixed left-1/2 top-1/2 z-30 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-navy-500 bg-navy-900 shadow-2xl shadow-navy-950/80 sm:absolute sm:left-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)] sm:translate-x-0 sm:translate-y-0"
                >
                  {levelOrder.map((option) => {
                    const meta = levelMeta[option];
                    const active = option === state.level;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setLevel(option);
                          setLevelOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${
                          active ? "bg-navy-700" : "hover:bg-navy-800"
                        }`}
                      >
                        <LevelIcon level={option} className="h-8 w-auto shrink-0" />
                        <span className="flex flex-col">
                          <span
                            className={`text-xs font-semibold ${meta.accentClass}`}
                          >
                            {meta.label}
                            {active && (
                              <span className="ml-2 font-normal text-ink-faint">
                                current
                              </span>
                            )}
                          </span>
                          <span className="text-[0.7rem] leading-snug text-ink-muted">
                            {meta.detail}
                          </span>
                          <span className="mt-1 text-[0.65rem] leading-snug text-ink-faint">{meta.looksFor}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                </>
              )}
            </span>
          </div>
        </div>

        {/* rank progress */}
        <div className="flex flex-1 flex-col gap-1.5 sm:items-end">
          <div className="flex w-full items-baseline justify-between gap-3 sm:justify-end">
            <span className="text-xs uppercase tracking-wider text-ink-faint">
              {rank.rank.name}
            </span>
            <span className="text-sm font-bold tabular-nums text-ink">
              {rank.xp.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-navy-900 sm:max-w-xs">
            <div
              className="spectrum-rule h-full rounded-full transition-[width] duration-700"
              style={{ width: `${rank.progress * 100}%` }}
            />
          </div>
          <span className="text-[0.7rem] text-ink-faint">
            {rank.next
              ? `${rank.toNext.toLocaleString()} XP to ${rank.next.name}`
              : "Top rank reached - nothing above this one."}
          </span>
        </div>
      </div>

      {/* The reason they're here, and one idea to act on today. */}
      <div className="mt-5 grid gap-4 border-t border-navy-700 pt-4 lg:grid-cols-2">
        <div>
        {editingWhy ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={whyDraft}
              onChange={(e) => setWhyDraft(e.target.value)}
              rows={3}
              maxLength={280}
              autoFocus
              className="w-full rounded-xl border border-navy-600 bg-navy-900 p-3 text-sm leading-relaxed text-ink focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIntention(whyDraft);
                  setEditingWhy(false);
                }}
                className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-navy-900"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingWhy(false)}
                className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs text-ink-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setWhyDraft(state.intention);
              setEditingWhy(true);
            }}
            className="group flex w-full flex-col gap-1 text-left"
          >
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
              Why you started
            </span>
            {state.intention ? (
              <span className="text-base italic leading-relaxed text-ink-muted transition-colors group-hover:text-ink">
                &ldquo;{state.intention}&rdquo;
              </span>
            ) : (
              <span className="text-sm text-ink-faint transition-colors group-hover:text-ink-muted">
                You haven&apos;t written your reason yet - tap to add it.
              </span>
            )}
          </button>
        )}
        </div>
        <ProTip />
      </div>
    </section>
  );
}
