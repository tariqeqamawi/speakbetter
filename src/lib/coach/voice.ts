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

/** The thirty stock voices, with Google's one-word character for each
 *  and which way the voice reads. The lion is a low male voice; the
 *  audition lists those first, but the others stay for comparison. */
export const GEMINI_VOICES: { name: string; character: string; gender: "male" | "female" }[] = [
  // The lower, rougher male voices first - the lion's register.
  { name: "Algenib", character: "Gravelly", gender: "male" },
  { name: "Charon", character: "Informative, deep", gender: "male" },
  { name: "Alnilam", character: "Firm", gender: "male" },
  { name: "Orus", character: "Firm", gender: "male" },
  { name: "Enceladus", character: "Breathy", gender: "male" },
  { name: "Schedar", character: "Even", gender: "male" },
  { name: "Sadaltager", character: "Knowledgeable", gender: "male" },
  { name: "Iapetus", character: "Clear", gender: "male" },
  { name: "Rasalgethi", character: "Informative", gender: "male" },
  { name: "Umbriel", character: "Easy-going", gender: "male" },
  { name: "Algieba", character: "Smooth", gender: "male" },
  { name: "Achird", character: "Friendly", gender: "male" },
  { name: "Zubenelgenubi", character: "Casual", gender: "male" },
  { name: "Sadachbia", character: "Lively", gender: "male" },
  { name: "Fenrir", character: "Excitable", gender: "male" },
  { name: "Puck", character: "Upbeat", gender: "male" },
  { name: "Sulafat", character: "Warm", gender: "female" },
  { name: "Gacrux", character: "Mature", gender: "female" },
  { name: "Achernar", character: "Soft", gender: "female" },
  { name: "Vindemiatrix", character: "Gentle", gender: "female" },
  { name: "Despina", character: "Smooth", gender: "female" },
  { name: "Kore", character: "Firm", gender: "female" },
  { name: "Zephyr", character: "Bright", gender: "female" },
  { name: "Leda", character: "Youthful", gender: "female" },
  { name: "Aoede", character: "Breezy", gender: "female" },
  { name: "Callirrhoe", character: "Easy-going", gender: "female" },
  { name: "Autonoe", character: "Bright", gender: "female" },
  { name: "Erinome", character: "Clear", gender: "female" },
  { name: "Laomedeia", character: "Upbeat", gender: "female" },
  { name: "Pulcherrima", character: "Forward", gender: "female" },
];

/**
 * The direction the voice is given, in words. Gemini's voices take a
 * direction the way an actor does - register, pace, mood, and an
 * accent, which is how the same stock voice can be tried American and
 * British before the lion is settled on one.
 */
export const DEFAULT_STYLE =
  "in a very deep, gravelly, rumbling baritone - a lion's voice, rough at the edges - warm, fast and lively, at a quick conversational clip with barely a pause, like a coach talking to you across a table";

/** Directions worth trying against each other on the audition page. */
export const STYLE_PRESETS: { label: string; style: string }[] = [
  { label: "Gravelly baritone, quick", style: DEFAULT_STYLE },
  {
    label: "Deep, quick",
    style: "in a very deep, gravelly male voice with a heavy rasp, speaking fast and fluently with barely a pause, reassuring",
  },
  {
    label: "Warm, brisk",
    style: "in a low, warm, husky male voice, speaking fast at a lively conversational clip, like a coach who's on your side",
  },
];

/** The accent, appended to the direction. */
export const ACCENTS: { label: string; suffix: string }[] = [
  { label: "American", suffix: ", with a natural American accent" },
  { label: "British", suffix: ", with a natural British accent (Received Pronunciation, London)" },
  { label: "Unspecified", suffix: "" },
];

/** The voice the app speaks in - Charon, chosen on the audition page. */
export const DEFAULT_VOICE = "Charon";

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
