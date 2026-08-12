"use client";

import Player from "@vimeo/player";
import { useCallback, useEffect, useRef, useState } from "react";
import { vimeoEmbedUrl } from "@/lib/vimeo";
import {
  CaptionsIcon,
  PauseFillIcon,
  PlayFillIcon,
  ResetFrameIcon,
  SpeedIcon,
  ZoomLandscapeIcon,
  ZoomPortraitIcon,
} from "@/components/player-icons";

// Vimeo's own chrome is switched off (controls=0) and replaced with our
// own, driven through the player SDK — so playback looks like part of
// the app rather than a borrowed widget.
//
// Framing (master plan §14): course videos are landscape, but most
// students watch on a phone held in portrait. Two zooms rather than one
// — push in while staying wide, or crop all the way to portrait so the
// speaker fills a tall screen and body language stays readable.

type Frame = "fit" | "landscape" | "portrait";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function VimeoPlayer({ vimeoId, title }: { vimeoId: string; title: string }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  const [frame, setFrame] = useState<Frame>("fit");
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captionLang, setCaptionLang] = useState<string | null>(null);

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

    player.ready().then(() => setReady(true)).catch(() => {});
    player.getDuration().then(setDuration).catch(() => {});
    // Only offer captions if this video actually has a track.
    player
      .getTextTracks()
      .then((tracks) => {
        if (tracks.length) setCaptionLang(tracks[0].language);
      })
      .catch(() => {});

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
    const onTime = (d: { seconds: number; duration: number }) => {
      setProgress(d.duration ? d.seconds / d.duration : 0);
      if (d.duration) setDuration(d.duration);
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
  }, [vimeoId]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pause().catch(() => {});
    else p.play().catch(() => {});
  }, [playing]);

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

  // The holder is scaled inside a masked window; the aspect of that
  // window is what changes between the three framings. The SDK gives the
  // iframe fixed pixel dimensions, so it has to be stretched explicitly.
  const windowClass =
    frame === "portrait"
      ? "mx-auto aspect-[9/16] w-full max-w-sm"
      : "aspect-video w-full";

  // In portrait the holder keeps the video's own 16:9 and is sized by
  // height, so it overflows the tall window sideways and gets cropped —
  // the speaker stays centered and fills the screen.
  const holderClass =
    frame === "portrait"
      ? "absolute left-1/2 top-1/2 h-full aspect-video -translate-x-1/2 -translate-y-1/2 scale-[1.18]"
      : frame === "landscape"
        ? "absolute inset-0 size-full scale-[1.4]"
        : "absolute inset-0 size-full";

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative overflow-hidden rounded-xl bg-navy-950 ${windowClass}`}
      >
        {/* the iframe the SDK mounts into — it arrives with fixed pixel
            dimensions, so it's stretched to the holder here */}
        <div
          className={`${holderClass} [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:size-full`}
          ref={holderRef}
          data-title={title}
        />

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
              label="Zoom in, keep it wide"
              onClick={() => setFrameMode("landscape")}
              active={frame === "landscape"}
            >
              <ZoomLandscapeIcon />
            </ControlButton>

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
