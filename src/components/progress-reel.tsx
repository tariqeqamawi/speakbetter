"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore, type Attempt } from "@/lib/store";
import { challengeBySlug, challenges } from "@/data/challenges";
import { loadVideo, type StoredVideoMeta } from "@/lib/attempt-videos";
import {
  REEL_H,
  REEL_W,
  paint,
  recordingType,
  timeline,
  type ReelSpec,
} from "@/lib/reel";
import { hapticTap, playXpChime } from "@/lib/feedback-fx";
import { PlayFillIcon } from "@/components/player-icons";
import { CheckIcon, CommunityIcon, RepeatIcon, XIcon } from "@/components/icons";

// The before-and-after, played and shared. See lib/reel.ts for what it
// is and why it's cut on the device.
//
// The canvas is the screen and the recording at once: while the reel
// plays, its frames and the videos' sound are recorded, so when it ends
// the file is already made and the share sheet is one tap away. Where
// the browser can't record (or can't share a file), the reel still
// plays, and the closing card can be shared as a picture instead.

type Phase = "ready" | "playing" | "done";

export function ProgressReel({
  thenAttempt,
  nowAttempt,
  thenVideo,
  nowVideo,
  onClose,
}: {
  thenAttempt: Attempt;
  nowAttempt: Attempt;
  thenVideo: StoredVideoMeta | null;
  nowVideo: StoredVideoMeta | null;
  onClose: () => void;
}) {
  const { state, isChallengeComplete, shareReel } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thenRef = useRef<HTMLVideoElement | null>(null);
  const nowRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const frameRef = useRef<number>(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [loaded, setLoaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [shared, setShared] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const passed = challenges.filter((c) => !c.passive && isChallengeComplete(c.slug)).length;
  const total = challenges.filter((c) => !c.passive).length;

  const spec = useRef<ReelSpec>({
    then: {
      label: "Then",
      title: challengeBySlug.get(thenAttempt.challengeSlug)?.title ?? "",
      date: thenAttempt.at,
      score: thenAttempt.score,
      spectrum: thenAttempt.spectrum,
      videoUrl: null,
    },
    now: {
      label: "Now",
      title: challengeBySlug.get(nowAttempt.challengeSlug)?.title ?? "",
      date: nowAttempt.at,
      score: nowAttempt.score,
      spectrum: nowAttempt.spectrum,
      videoUrl: null,
    },
    passed,
    total,
  });

  // Load the two videos off the device into hidden elements. Either may
  // be missing; the reel is cut around what's there.
  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    const make = async (meta: StoredVideoMeta | null) => {
      if (!meta) return null;
      const blob = await loadVideo(meta.id);
      if (!blob || !alive) return null;
      const url = URL.createObjectURL(blob);
      urls.push(url);
      const v = document.createElement("video");
      v.src = url;
      v.playsInline = true;
      v.preload = "auto";
      v.muted = false;
      await new Promise<void>((res) => {
        v.onloadedmetadata = () => res();
        v.onerror = () => res();
      });
      return { v, url };
    };
    Promise.all([make(thenVideo), make(nowVideo)]).then(([a, b]) => {
      if (!alive) return;
      if (a) {
        thenRef.current = a.v;
        spec.current.then.videoUrl = a.url;
      }
      if (b) {
        nowRef.current = b.v;
        spec.current.now.videoUrl = b.url;
      }
      setLoaded(true);
      // The first frame, so the canvas isn't blank before play.
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const scenes = timeline(spec.current, 0, 0);
        paint(ctx, spec.current, scenes, 0, { then: null, now: null });
      }
    });
    return () => {
      alive = false;
      cancelAnimationFrame(frameRef.current);
      thenRef.current?.pause();
      nowRef.current?.pause();
      for (const u of urls) URL.revokeObjectURL(u);
      audioRef.current?.close().catch(() => {});
    };
  }, [thenVideo, nowVideo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const play = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    hapticTap();
    setFile(null);
    setNote(null);
    setPhase("playing");

    const videos = { then: thenRef.current, now: nowRef.current };
    // Prime both elements inside the tap: a phone browser allows play()
    // on an element only after a gesture has touched it, and the second
    // clip starts half a minute after the tap.
    for (const v of [videos.then, videos.now]) {
      if (!v) continue;
      try {
        await v.play();
        v.pause();
        v.currentTime = 0;
      } catch {
        // Then it plays silently later, or not at all - the cards carry
        // the reel either way.
      }
    }

    // Record what's drawn and what's heard. Set up once; a replay
    // records again into a fresh file.
    let recorder: MediaRecorder | null = null;
    const type = recordingType();
    if (type && canvas.captureStream) {
      try {
        const stream = canvas.captureStream(30);
        if (!audioRef.current) {
          const ac = new AudioContext();
          const dest = ac.createMediaStreamDestination();
          for (const v of [videos.then, videos.now]) {
            if (!v) continue;
            const src = ac.createMediaElementSource(v);
            src.connect(ac.destination);
            src.connect(dest);
          }
          audioRef.current = ac;
          (audioRef.current as AudioContext & { dest?: MediaStreamAudioDestinationNode }).dest = dest;
        }
        const ac = audioRef.current as AudioContext & { dest?: MediaStreamAudioDestinationNode };
        if (ac.state === "suspended") await ac.resume();
        for (const track of ac.dest?.stream.getAudioTracks() ?? []) stream.addTrack(track);
        recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 4_000_000 });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size) chunksRef.current.push(e.data);
        };
        recorder.start(500);
        recorderRef.current = recorder;
      } catch {
        recorder = null;
      }
    }

    const scenes = timeline(
      spec.current,
      videos.then?.duration ?? 0,
      videos.now?.duration ?? 0,
    );
    const end = scenes[scenes.length - 1].to;
    const started = performance.now();
    let current = -1;

    const frame = () => {
      const t = (performance.now() - started) / 1000;
      const i = scenes.findIndex((s) => t >= s.from && t < s.to);
      if (i !== current) {
        // Leaving a clip: stop its video. Entering one: start it.
        const prev = scenes[current];
        if (prev?.kind === "clip")
          (prev.side.label === "Then" ? videos.then : videos.now)?.pause();
        const next = scenes[i];
        if (next?.kind === "clip") {
          const v = next.side.label === "Then" ? videos.then : videos.now;
          if (v) {
            v.currentTime = 0;
            v.play().catch(() => {});
          }
        }
        current = i;
      }
      paint(ctx, spec.current, scenes, Math.min(t, end - 0.001), videos);
      if (t < end) {
        frameRef.current = requestAnimationFrame(frame);
        return;
      }
      videos.then?.pause();
      videos.now?.pause();
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder!.mimeType });
          const ext = recorder!.mimeType.includes("mp4") ? "mp4" : "webm";
          setFile(new File([blob], `speak-better-then-and-now.${ext}`, { type: blob.type }));
        };
        recorder.stop();
      }
      playXpChime();
      setPhase("done");
    };
    frameRef.current = requestAnimationFrame(frame);
  }, []);

  const shareVideo = async () => {
    if (!file) return;
    hapticTap();
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: "My before and after - Speak Better",
          text: `${thenAttempt.score} → ${nowAttempt.score}. ${passed} challenges in on Speak Better.`,
        });
        return;
      } catch {
        // Cancelled, or the sheet refused the file - fall through to a
        // download so the video isn't lost.
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    setNote("Saved to your downloads - post it from there.");
  };

  const sharePicture = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    hapticTap();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const pic = new File([blob], "speak-better-then-and-now.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [pic] })) {
      try {
        await nav.share({ files: [pic], title: "My before and after - Speak Better" });
        return;
      } catch {
        // as above
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(pic);
    a.download = pic.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    setNote("Saved to your downloads.");
  };

  const shareToCommunity = () => {
    hapticTap();
    shareReel({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      thenSlug: thenAttempt.challengeSlug,
      thenScore: thenAttempt.score,
      thenSpectrum: thenAttempt.spectrum,
      nowSlug: nowAttempt.challengeSlug,
      nowScore: nowAttempt.score,
      nowSpectrum: nowAttempt.spectrum,
      passed,
    });
    setShared(true);
  };

  const alreadyShared =
    shared ||
    state.sharedReels.some(
      (r) => r.nowScore === nowAttempt.score && r.nowSlug === nowAttempt.challengeSlug && r.passed === passed,
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-navy-950/90 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your before and after"
        className="panel-in relative flex w-full max-w-sm flex-col items-center gap-3"
      >
        {/* The reel, at the height the screen allows once the buttons
            under it have theirs; portrait, so whole on a phone. */}
        <div className="relative w-full overflow-hidden rounded-2xl border border-navy-600 bg-navy-950 shadow-2xl shadow-navy-950/80">
          <canvas
            ref={canvasRef}
            width={REEL_W}
            height={REEL_H}
            className="block w-full"
            style={{ maxHeight: "min(70vh, calc(100dvh - 12rem))", aspectRatio: "9 / 16", objectFit: "contain", margin: "0 auto" }}
          />
          {phase !== "playing" && (
            <button
              type="button"
              onClick={play}
              disabled={!loaded}
              aria-label={phase === "done" ? "Play again" : "Play your before and after"}
              className="absolute inset-0 flex items-center justify-center bg-navy-950/30 transition-colors hover:bg-navy-950/15 disabled:cursor-wait"
            >
              <span className="flex size-20 items-center justify-center rounded-full border border-white/25 bg-navy-950/75 text-ink backdrop-blur-sm">
                {phase === "done" ? (
                  <RepeatIcon className="size-8" />
                ) : loaded ? (
                  <PlayFillIcon className="ml-1 size-9" />
                ) : (
                  <span className="spectrum-rule h-1 w-10 animate-pulse rounded-full" />
                )}
              </span>
            </button>
          )}
        </div>

        {phase === "done" ? (
          <div className="flex w-full flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={file ? shareVideo : sharePicture}
                className="flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-navy-900 transition-opacity hover:opacity-90"
              >
                {file ? "Share the video" : "Share a picture"}
              </button>
              <button
                type="button"
                onClick={shareToCommunity}
                disabled={alreadyShared}
                className="flex items-center justify-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-navy-700 disabled:opacity-60"
              >
                {alreadyShared ? (
                  <>
                    <CheckIcon className="size-4 text-mindset" />
                    Shared with students
                  </>
                ) : (
                  <>
                    <CommunityIcon className="size-4" />
                    Share with students
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-ink-faint text-balance">
              {note ??
                (file
                  ? "The video was made on this phone and goes straight to your share sheet - nothing was uploaded."
                  : "This browser can't record the reel; the closing card shares as a picture.")}
              {" "}Sharing with students posts your scores and spectra, never your video.
            </p>
          </div>
        ) : (
          <p className="text-center text-xs text-ink-faint text-balance">
            {phase === "playing"
              ? "Recording as it plays…"
              : "About fifty seconds: twenty of then, twenty of now, and the difference."}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-1 flex size-9 items-center justify-center rounded-full border border-navy-600 bg-navy-850 text-ink-muted transition-colors hover:text-ink"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
