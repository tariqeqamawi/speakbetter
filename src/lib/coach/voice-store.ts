// Coach's voice, kept on the phone.
//
// A spoken review is made once, by the voice service, and that costs
// money every time it's asked for (data/coach-costs.ts). The words of a
// finished review never change, so the audio is kept here, in the
// browser's own database, the first time it's made: every replay after
// that is instant, works offline and is free. Keyed by the words and the
// voice, so a review re-voiced in another voice is made fresh.
//
// Kept within a budget - a minute of Coach is a few megabytes - and the
// clips played least recently go first when it's full.

const DB_NAME = "speak-better-voice";
const STORE = "clips";
const BUDGET = 80 * 1024 * 1024;

interface Clip {
  key: string;
  blob: Blob;
  size: number;
  at: number;
}

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** A short, stable key for a line in a voice. */
export async function clipKey(text: string, voice: string, style: string): Promise<string> {
  const raw = `${voice}\u0000${style}\u0000${text}`;
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return raw;
  }
}

export async function loadClip(key: string): Promise<Blob | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const get = store.get(key);
      get.onsuccess = () => {
        const clip = get.result as Clip | undefined;
        if (!clip) return resolve(null);
        // Played again: it's recent now, so it's the last to be cleared.
        store.put({ ...clip, at: Date.now() });
        resolve(clip.blob);
      };
      get.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveClip(key: string, blob: Blob): Promise<void> {
  const db = await open();
  if (!db) return;
  try {
    const all = await new Promise<Clip[]>((resolve) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as Clip[]) ?? []);
      req.onerror = () => resolve([]);
    });
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    let used = all.reduce((sum, c) => sum + c.size, 0) + blob.size;
    for (const old of all.sort((a, b) => a.at - b.at)) {
      if (used <= BUDGET) break;
      store.delete(old.key);
      used -= old.size;
    }
    store.put({ key, blob, size: blob.size, at: Date.now() } satisfies Clip);
  } catch {
    // No room, or no storage: it's made again next time.
  }
}
