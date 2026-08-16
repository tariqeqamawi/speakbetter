// A speaking course that stays silent when you achieve something is
// missing a beat. The chime is synthesised with the Web Audio API rather
// than shipped as a file - no asset, no download, and it can be tuned in
// code. Haptics ride along where the device supports them.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** A short rising three-note figure - warm, not a game-show sting. */
export function playCelebration() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ac = audio();
  if (!ac) return;
  void ac.resume().catch(() => {});

  // A major triad walking up: a settled, encouraging shape.
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const now = ac.currentTime;

  notes.forEach((freq, i) => {
    const at = now + i * 0.085;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, at);
    // quick attack, gentle tail - keeps it from feeling sharp
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(at);
    osc.stop(at + 0.5);
  });
}

/** A short double tap. Android honours this; iOS Safari ignores it. */
export function hapticCelebrate() {
  if (typeof navigator === "undefined") return;
  navigator.vibrate?.([18, 60, 28]);
}

/** A single light tap for smaller confirmations. */
export function hapticTap() {
  if (typeof navigator === "undefined") return;
  navigator.vibrate?.(12);
}
