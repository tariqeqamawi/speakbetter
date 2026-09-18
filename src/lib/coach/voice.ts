// The coach's voice.
//
// Gemini's text-to-speech, which the app already has a key for, with
// one of its thirty stock voices and a direction in words - "warm and
// unhurried, like a coach who's on your side" - which is the thing
// ordinary text-to-speech can't take and the thing the lion most
// needs. A cloned voice (the teacher's own) is a later swap: same
// function, different provider behind it.
//
// Which voice is a choice made on the audition page (/prototype/voice)
// and kept in the browser until it's settled; then it becomes the one
// constant below.

/** The thirty stock voices, with Google's own one-word character for each. */
export const GEMINI_VOICES: { name: string; character: string }[] = [
  { name: "Zephyr", character: "Bright" },
  { name: "Puck", character: "Upbeat" },
  { name: "Charon", character: "Informative" },
  { name: "Kore", character: "Firm" },
  { name: "Fenrir", character: "Excitable" },
  { name: "Leda", character: "Youthful" },
  { name: "Orus", character: "Firm" },
  { name: "Aoede", character: "Breezy" },
  { name: "Callirrhoe", character: "Easy-going" },
  { name: "Autonoe", character: "Bright" },
  { name: "Enceladus", character: "Breathy" },
  { name: "Iapetus", character: "Clear" },
  { name: "Umbriel", character: "Easy-going" },
  { name: "Algieba", character: "Smooth" },
  { name: "Despina", character: "Smooth" },
  { name: "Erinome", character: "Clear" },
  { name: "Algenib", character: "Gravelly" },
  { name: "Rasalgethi", character: "Informative" },
  { name: "Laomedeia", character: "Upbeat" },
  { name: "Achernar", character: "Soft" },
  { name: "Alnilam", character: "Firm" },
  { name: "Schedar", character: "Even" },
  { name: "Gacrux", character: "Mature" },
  { name: "Pulcherrima", character: "Forward" },
  { name: "Achird", character: "Friendly" },
  { name: "Zubenelgenubi", character: "Casual" },
  { name: "Vindemiatrix", character: "Gentle" },
  { name: "Sadachbia", character: "Lively" },
  { name: "Sadaltager", character: "Knowledgeable" },
  { name: "Sulafat", character: "Warm" },
];

/** The direction the voice is given, in words. */
export const DEFAULT_STYLE = "warm and unhurried, like a coach who's on your side";

/** The voice the app speaks in until the audition settles it. */
export const DEFAULT_VOICE = "Sulafat";

const KEY = "speak-better-coach-voice";

/** The chosen voice on this browser: { voice, style }. */
export function chosenVoice(): { voice: string; style: string } {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { voice?: string; style?: string };
      if (parsed.voice && GEMINI_VOICES.some((v) => v.name === parsed.voice))
        return { voice: parsed.voice, style: parsed.style || DEFAULT_STYLE };
    }
  } catch {
    // no storage, or a bad entry - the default speaks
  }
  return { voice: DEFAULT_VOICE, style: DEFAULT_STYLE };
}

export function chooseVoice(voice: string, style: string): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ voice, style }));
  } catch {
    // fine - it'll be chosen again next time
  }
}

/**
 * The line as audio, from the app's own route. Resolves to an object
 * URL the caller must revoke, or null where speech isn't available -
 * the caller falls back to the browser's own voice.
 */
export async function speakUrl(text: string, voice?: string, style?: string): Promise<string | null> {
  try {
    const chosen = chosenVoice();
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: voice ?? chosen.voice, style: style ?? chosen.style }),
    });
    if (!res.ok) return null;
    return URL.createObjectURL(await res.blob());
  } catch {
    return null;
  }
}
