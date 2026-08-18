"use client";

import Image from "next/image";
import Player from "@vimeo/player";
import { useCallback, useEffect, useRef, useState } from "react";
import { vimeoEmbedUrl } from "@/lib/vimeo";
import { categories } from "@/data/categories";
import { lessonCues, type LessonCue } from "@/lib/lesson-cues";
import { cueIcons } from "./cue-icons";
import { XpBadge } from "./xp-badge";
import { hapticTap, playXpChime } from "@/lib/feedback-fx";
import {
  CaptionsIcon,
  ExitFullscreenIcon,
  FullscreenIcon,
  PauseFillIcon,
  PlayFillIcon,
  ResetFrameIcon,
  SpeedIcon,
  ZoomPortraitIcon,
} from "@/components/player-icons";

// Vimeo's own chrome is switched off (controls=0) and replaced with our
// own, driven through the player SDK - so playback looks like part of
// the app rather than a borrowed widget.
//
// Framing (master plan §14): course videos are landscape, but most
// students watch on a phone held in portrait, where the speaker plays
// small. One control crops all the way to portrait so they fill a tall
// screen and body language stays readable. (A second, gentler "zoom in
// but stay wide" mode was dropped - it earned its place in the bar less
// than it cost in clutter.)

type Frame = "fit" | "portrait";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

// A cue is worth showing while the teacher is still on the thought that
// earned it. Seek past that and the moment has gone - cues are missed,
// never queued up to fire late.
const CUE_GRACE = 2.5; // seconds

// The floating key words wear white or one of the spectrum's neons.
// White appears twice so it comes up more often than any single color.
const WORD_COLORS = [
  "#f5f7ff",
  "#f5f7ff",
  ...categories.map((c) => `var(--color-${c.id})`),
];

interface Floater {
  /** The lesson it was drawn for - a leftover from the previous one
      shouldn't outlive a switch to the next video. */
  lesson: string;
  word: string;
  /** A drawing to show in place of the words, when the cue has one. */
  icon?: string;
  img?: string;
  color: string;
  left: number; // percent
  top: number; // percent
  key: number;
}

/**
 * One cue, as the viewer sees it.
 *
 * A drawn cue keeps its words underneath rather than replacing them: the
 * drawing is what catches the eye at the edge of vision, and the phrase
 * is what makes it teach - a lone icon for "filler words" is a puzzle,
 * and the course isn't in the business of setting puzzles.
 *
 * The drawing inherits the cue's color from the span above it, which is
 * why every icon is stroke-only and single-color. An illustration is a
 * picture in its own right and keeps its own.
 */
function CueMark({ floater }: { floater: Floater }) {
  const Icon = floater.icon ? cueIcons[floater.icon] : undefined;
  if (!floater.img && !Icon) return <>{floater.word}</>;

  return (
    <span className="flex flex-col items-center gap-1.5">
      {floater.img ? (
        <Image
          src={floater.img}
          alt=""
          width={72}
          height={72}
          className="size-10 opacity-90 drop-shadow-[0_0_12px_rgba(0,0,0,0.55)] sm:size-14"
        />
      ) : (
        Icon?.({ className: "size-8 sm:size-10" })
      )}
      <span>{floater.word}</span>
    </span>
  );
}

// screen.orientation.lock/unlock aren't in every TS lib or browser -
// reach for them loosely and let unsupported platforms fall through.
function orientationApi():
  | { lock?: (o: string) => Promise<void>; unlock?: () => void }
  | undefined {
  if (typeof screen === "undefined") return undefined;
  return screen.orientation as unknown as {
    lock?: (o: string) => Promise<void>;
    unlock?: () => void;
  };
}

/** The screen's rotation away from the device's natural orientation. */
function screenAngle(): number {
  if (typeof screen !== "undefined" && screen.orientation)
    return ((screen.orientation.angle % 360) + 360) % 360;
  const legacy = (window as unknown as { orientation?: number }).orientation;
  return typeof legacy === "number" ? ((legacy % 360) + 360) % 360 : 0;
}

export function VimeoPlayer({
  vimeoId,
  title,
  autoplay = false,
  onEnded,
  xp,
}: {
  vimeoId: string;
  title: string;
  autoplay?: boolean;
  /** Fires once when playback completes - what "up next" hangs off. */
  onEnded?: () => void;
  /**
   * XP to send up the screen when the video finishes, with a chime.
   * Omit it and nothing is shown - which is what a rewatch, a challenge
   * explainer, or a landing page demo should do, since none of them
   * earns anything and a reward for nothing is a lie told with a
   * animation.
   */
  xp?: number;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  // Ref'd so a new callback doesn't tear down and rebuild the player.
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);
  const xpRef = useRef(xp);
  useEffect(() => {
    xpRef.current = xp;
  }, [xp]);

  const [frame, setFrame] = useState<Frame>("fit");
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  // Bumped on each finish so the badge remounts and replays its rise.
  const [rewardKey, setRewardKey] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captionLang, setCaptionLang] = useState<string | null>(null);

  // ── Floating key ideas ─────────────────────────────────────────────
  // A key phrase drifts through the margins around the teacher while the
  // video plays - a second channel of reinforcement. Each one is timed to
  // the second the teacher says it, so the words on screen and the words
  // in the room are the same idea. (They used to be single words drawn at
  // random from the lesson's takeaways, which meant a lesson on the pause
  // could float "SNOWBOARD" while the teacher was mid-sentence on
  // something else.) A lesson with no cue at that moment floats nothing.
  // Only in the default and fullscreen framings: portrait crops the
  // margins away.
  const cuesRef = useRef<LessonCue[]>([]);
  const cueLessonRef = useRef(vimeoId);
  const nextCueRef = useRef(0);
  const floaterKeyRef = useRef(0);
  const [floater, setFloater] = useState<Floater | null>(null);
  const showWords = playing && frame === "fit";

  // Which framing we're in, read from inside the player's timeupdate -
  // ref'd so changing it doesn't tear down and rebuild the player.
  const framedRef = useRef(true);
  useEffect(() => {
    framedRef.current = frame === "fit";
  }, [frame]);

  useEffect(() => {
    let alive = true;
    cuesRef.current = [];
    cueLessonRef.current = vimeoId;
    nextCueRef.current = 0;
    lessonCues(vimeoId)
      .then((list) => {
        if (alive) cuesRef.current = list;
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [vimeoId]);

  // Driven by playback position rather than a timer, and stable across
  // renders so the player effect below never rebuilds over it.
  const cueAt = useCallback((seconds: number) => {
    const list = cuesRef.current;
    if (!list.length) return;
    // A seek backwards (or a replay) hands the earlier cues back.
    if (nextCueRef.current > 0 && seconds < list[nextCueRef.current - 1].t)
      nextCueRef.current = 0;

    let due: LessonCue | null = null;
    while (
      nextCueRef.current < list.length &&
      list[nextCueRef.current].t <= seconds
    ) {
      due = list[nextCueRef.current];
      nextCueRef.current++;
    }
    if (!due || seconds - due.t > CUE_GRACE || !framedRef.current) return;

    const leftSide = Math.random() < 0.5;
    setFloater({
      lesson: cueLessonRef.current,
      word: due.w,
      icon: due.icon,
      img: due.img,
      color: WORD_COLORS[Math.floor(Math.random() * WORD_COLORS.length)],
      // The gray areas flanking the centered teacher.
      left: leftSide ? 4 + Math.random() * 13 : 70 + Math.random() * 16,
      top: 15 + Math.random() * 55,
      key: floaterKeyRef.current++,
    });
  }, []);

  useEffect(() => {
    if (!holderRef.current) return;
    const player = new Player(holderRef.current, {
      url: vimeoEmbedUrl(vimeoId),
      controls: false,
      title: false,
      byline: false,
      portrait: false,
      responsive: false,
    });
    playerRef.current = player;

    player
      .ready()
      .then(() => {
        setReady(true);
        // Only ever set from a click on the facade, so the user gesture
        // that mounted us also authorizes playback.
        if (autoplay) player.play().catch(() => {});
      })
      .catch(() => {});
    player.getDuration().then(setDuration).catch(() => {});
    // Only offer captions if this video actually has a track.
    player
      .getTextTracks()
      .then((tracks) => {
        if (tracks.length) setCaptionLang(tracks[0].language);
      })
      .catch(() => {});

    const onPlay = () => {
      setPlaying(true);
      setEnded(false);
    };
    // Clearing the floater on pause keeps a cue from replaying its fade
    // on resume, seconds after the words it belongs to were spoken.
    const onPause = () => {
      setPlaying(false);
      setFloater(null);
    };
    // The course must end where the course is: Vimeo's own end screen can
    // surface "more from" recommendations the moment playback finishes.
    // Seeking back to the start dismisses it inside the iframe, and the
    // opaque ended overlay (below) covers the frame while that happens -
    // so no Vimeo UI is ever seen, only our own replay state.
    const onEnd = () => {
      setPlaying(false);
      setEnded(true);
      player.setCurrentTime(0).then(() => player.pause()).catch(() => {});
      onEndedRef.current?.();
      if (xpRef.current !== undefined) {
        setRewardKey((n) => n + 1);
        playXpChime();
        hapticTap();
      }
    };
    const onTime = (d: { seconds: number; duration: number }) => {
      setProgress(d.duration ? d.seconds / d.duration : 0);
      if (d.duration) setDuration(d.duration);
      cueAt(d.seconds);
    };
    player.on("play", onPlay);
    player.on("pause", onPause);
    player.on("ended", onEnd);
    player.on("timeupdate", onTime);

    return () => {
      player.off("play", onPlay);
      player.off("pause", onPause);
      player.off("ended", onEnd);
      player.off("timeupdate", onTime);
      player.destroy().catch(() => {});
      playerRef.current = null;
    };
  }, [vimeoId, autoplay, cueAt]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pause().catch(() => {});
    else p.play().catch(() => {});
  }, [playing]);

  const replay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    setEnded(false);
    p.setCurrentTime(0)
      .then(() => p.play())
      .catch(() => {});
  }, []);

  const changeSpeed = useCallback((rate: number) => {
    setSpeed(rate);
    setSpeedOpen(false);
    playerRef.current?.setPlaybackRate(rate).catch(() => {});
  }, []);

  const toggleCaptions = useCallback(() => {
    const p = playerRef.current;
    if (!p || !captionLang) return;
    if (captionsOn) {
      p.disableTextTrack().catch(() => {});
      setCaptionsOn(false);
    } else {
      p.enableTextTrack(captionLang).catch(() => {});
      setCaptionsOn(true);
    }
  }, [captionsOn, captionLang]);

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const p = playerRef.current;
      if (!p || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      p.setCurrentTime(ratio * duration).catch(() => {});
      setProgress(ratio);
    },
    [duration],
  );

  const setFrameMode = (mode: Frame) =>
    setFrame((current) => (current === mode ? "fit" : mode));

  // Fullscreen the whole shell, not the iframe - that keeps our own
  // controls on screen. Vimeo's chrome is off, so handing fullscreen to
  // the iframe would leave a video with no controls at all.
  //
  // Entering fullscreen also turns the phone sideways for the viewer:
  // the video is landscape, so the screen locks to landscape rather
  // than playing letterboxed in a vertical frame. Desktop browsers
  // refuse the lock and the catch swallows it.
  useEffect(() => {
    const onChange = () => {
      const fs = document.fullscreenElement === shellRef.current;
      setFullscreen(fs);
      const orientation = orientationApi();
      if (fs) orientation?.lock?.("landscape").catch(() => {});
      else
        try {
          orientation?.unlock?.();
        } catch {}
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (shell.requestFullscreen) {
        await shell.requestFullscreen();
      } else {
        // iOS Safari won't fullscreen an arbitrary element; hand it to
        // the player, which can go native even though we lose our bar.
        await playerRef.current?.requestFullscreen();
      }
    } catch {
      await playerRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  // Portrait zoom is a takeover, not an inline crop: choosing it fills
  // the whole screen with the speaker. Done with a fixed overlay rather
  // than the Fullscreen API, so it works identically on iPhones, where
  // element fullscreen doesn't exist. Reset framing (or toggling
  // portrait off) returns to the page.
  const takeover = fullscreen || frame === "portrait";

  // Portrait is locked vertical: where the platform allows it the
  // screen orientation is pinned, and everywhere else (iOS) the angle
  // is tracked so the overlay can counter-rotate below - either way,
  // turning the phone doesn't turn the video.
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (frame !== "portrait" || fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    orientationApi()?.lock?.("portrait").catch(() => {});

    const read = () => setAngle(screenAngle());
    const t = window.setTimeout(read, 0);
    window.addEventListener("orientationchange", read);
    window.addEventListener("resize", read);
    return () => {
      document.body.style.overflow = previous;
      clearTimeout(t);
      window.removeEventListener("orientationchange", read);
      window.removeEventListener("resize", read);
      try {
        orientationApi()?.unlock?.();
      } catch {}
    };
  }, [frame, fullscreen]);

  // When the phone turns anyway, the overlay rotates against it and
  // swaps its dimensions, staying visually upright relative to the
  // device - the reorientation is simply ignored.
  const counterRotate =
    frame === "portrait" && !fullscreen && (angle === 90 || angle === 270);
  const shellStyle: React.CSSProperties | undefined = counterRotate
    ? {
        width: "100dvh",
        height: "100dvw",
        transformOrigin: "top left",
        transform:
          angle === 90
            ? "rotate(-90deg) translateX(-100%)"
            : "rotate(90deg) translateY(-100%)",
      }
    : undefined;

  // The holder is scaled inside a masked window; the aspect of that
  // window is what changes between the framings. The SDK gives the
  // iframe fixed pixel dimensions, so it has to be stretched explicitly.
  const windowClass = takeover
    ? frame === "portrait"
      ? "mx-auto h-full max-h-full min-h-0 w-auto aspect-[9/16]"
      : "min-h-0 w-full flex-1"
    : "aspect-video w-full";

  // In portrait the holder keeps the video's own 16:9 and is sized by
  // height, so it overflows the tall window sideways and gets cropped -
  // the speaker stays centered and fills the screen.
  const holderClass =
    frame === "portrait"
      ? "absolute left-1/2 top-1/2 h-full aspect-video -translate-x-1/2 -translate-y-1/2 scale-[1.18]"
      : "absolute inset-0 size-full";

  return (
    <div
      ref={shellRef}
      style={shellStyle}
      className={
        takeover
          ? `flex h-full w-full flex-col gap-2 bg-navy-950 p-3 ${
              fullscreen
                ? ""
                : counterRotate
                  ? "fixed left-0 top-0 z-50"
                  : "pt-safe pb-safe fixed inset-0 z-50"
            }`
          : "flex flex-col gap-2"
      }
    >
      <div
        className={`relative overflow-hidden bg-navy-950 ${
          takeover ? "" : "rounded-xl"
        } ${windowClass}`}
      >
        {/* the iframe the SDK mounts into - it arrives with fixed pixel
            dimensions, so it's stretched to the holder here */}
        <div
          className={`${holderClass} [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:size-full`}
          ref={holderRef}
          data-title={title}
        />

        {/* The idea the teacher is on right now, adrift in the margin
            beside them - remounted by key so each cue fades in anew.
            Some ideas arrive as a drawing rather than as words; either
            way it's one idea, in one color, in the same place. */}
        {showWords && floater?.lesson === vimeoId && (
          <span
            key={floater.key}
            aria-hidden
            className="float-word pointer-events-none absolute z-[15] text-xs font-semibold uppercase tracking-[0.18em] sm:text-sm"
            style={{
              left: `${floater.left}%`,
              top: `${floater.top}%`,
              color: floater.color,
              textShadow: floater.img ? undefined : "0 0 14px currentColor",
            }}
          >
            <CueMark floater={floater} />
          </span>
        )}

        {/* What the lesson just paid, rising off the player and away.
            Above the ended takeover, because the takeover is the thing
            it's rising off. */}
        {xp !== undefined && rewardKey > 0 && (
          <div
            key={rewardKey}
            role="status"
            aria-live="polite"
            className="xp-float pointer-events-none absolute inset-x-0 top-1/2 z-30 flex justify-center"
          >
            <XpBadge
              xp={xp}
              size="md"
              className="border border-mindset/40 bg-navy-950/90 text-mindset shadow-[0_0_26px_-6px_currentColor]"
            />
          </div>
        )}

        {/* Ended takeover - an opaque cover so Vimeo's end screen (and its
            "more from" recommendations) can never show. The course's own
            replay state is all a student sees. */}
        {ended && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-navy-950">
            <button
              type="button"
              onClick={replay}
              className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-navy-700"
            >
              <PlayFillIcon className="size-4" />
              Watch again
            </button>
            <span className="text-xs text-ink-faint">Lesson complete</span>
          </div>
        )}

        {/* click anywhere to play/pause */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <span
            className={`flex size-16 items-center justify-center rounded-full bg-navy-950/70 text-ink backdrop-blur transition-opacity ${
              playing ? "opacity-0 hover:opacity-100" : "opacity-100"
            }`}
          >
            {playing ? (
              <PauseFillIcon className="size-7" />
            ) : (
              <PlayFillIcon className="ml-0.5 size-7" />
            )}
          </span>
        </button>
      </div>

      {/* our controls */}
      <div className="flex flex-col gap-2 rounded-xl border border-navy-600 bg-navy-800 p-2.5">
        <div
          onClick={seek}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="group h-4 cursor-pointer py-1.5"
        >
          <div className="h-1 overflow-hidden rounded-full bg-navy-600">
            <div
              className="spectrum-rule h-full rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-24 shrink-0 font-mono text-[0.7rem] tabular-nums text-ink-faint">
            {fmt(progress * duration)} / {fmt(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <ControlButton
              label={captionsOn ? "Captions off" : "Captions on"}
              onClick={toggleCaptions}
              active={captionsOn}
              disabled={!captionLang}
            >
              <CaptionsIcon />
            </ControlButton>

            <div className="relative">
              <ControlButton
                label="Playback speed"
                onClick={() => setSpeedOpen((v) => !v)}
                active={speed !== 1}
              >
                <SpeedIcon />
                {speed !== 1 && (
                  <span className="font-mono text-[0.65rem] tabular-nums">
                    {speed}×
                  </span>
                )}
              </ControlButton>
              {speedOpen && (
                <div className="absolute bottom-full right-0 z-20 mb-1 flex flex-col overflow-hidden rounded-lg border border-navy-600 bg-navy-850 shadow-xl">
                  {SPEEDS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => changeSpeed(rate)}
                      className={`px-4 py-2 text-left font-mono text-xs tabular-nums transition-colors hover:bg-navy-700 ${
                        rate === speed ? "text-ink" : "text-ink-faint"
                      }`}
                    >
                      {rate}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ControlButton
              label="Zoom to portrait"
              onClick={() => setFrameMode("portrait")}
              active={frame === "portrait"}
            >
              <ZoomPortraitIcon />
            </ControlButton>

            {frame !== "fit" && (
              <ControlButton label="Reset framing" onClick={() => setFrame("fit")}>
                <ResetFrameIcon />
              </ControlButton>
            )}

            <ControlButton
              label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              onClick={toggleFullscreen}
              active={fullscreen}
            >
              {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </ControlButton>
          </div>
        </div>
      </div>

      {!ready && (
        <p className="text-[0.7rem] text-ink-faint">Loading player…</p>
      )}
    </div>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-2 transition-colors ${
        active
          ? "bg-navy-600 text-ink"
          : "text-ink-faint hover:bg-navy-700 hover:text-ink"
      } disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  );
}

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
