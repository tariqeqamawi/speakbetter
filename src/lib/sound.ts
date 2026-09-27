import { useEffect, useState } from "react";

// ONE SWITCH FOR ALL THE APP'S SOUND.
//
// A student on a bus or in an office should be able to use the whole
// course silently - read Coach's captions, watch Tariq with captions on -
// and turn the sound back on with one tap when they can listen. So there
// is one setting, kept on the device, that every sound in the app obeys:
// Coach's voice (the lion keeps talking, silently, with his captions
// still running), the chimes and applause, the road's wind and fanfares,
// and the lesson and challenge videos.
//
// On unless the student turns it off. Anyone who had already silenced
// the road or the guided tour under the old separate switches starts
// silent here too.

const KEY = "speak-better-sound";
const EVENT = "speak-better-sound";

function read(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "on") return true;
    if (v === "off") return false;
    // The old, separate switches.
    const off = localStorage.getItem("road-sound") === "off" || localStorage.getItem("speak-better-tour-muted") === "1";
    localStorage.setItem(KEY, off ? "off" : "on");
    return !off;
  } catch {
    return true;
  }
}

let current: boolean | null = null;

/** Whether the app may make sound. */
export function soundOn(): boolean {
  if (typeof window === "undefined") return true;
  if (current === null) current = read();
  return current;
}

export function setSound(on: boolean) {
  current = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // no storage: for this visit only
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: on }));
}

export function toggleSound() {
  setSound(!soundOn());
}

/** Called with the new setting whenever it changes (this tab or another). */
export function onSoundChange(fn: (on: boolean) => void): () => void {
  const local = () => fn(soundOn());
  const other = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    current = e.newValue !== "off";
    fn(current);
  };
  window.addEventListener(EVENT, local);
  window.addEventListener("storage", other);
  return () => {
    window.removeEventListener(EVENT, local);
    window.removeEventListener("storage", other);
  };
}

/** The setting, for a component - re-rendering when it changes. On
 *  during the server render; the real value once mounted. */
export function useSound(): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    // After mounting, so the server's render and the first client
    // render agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(soundOn());
    return onSoundChange(setOn);
  }, []);
  return on;
}
