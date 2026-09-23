// A student's own challenge videos, kept on their device.
//
// Master plan §13: the app doesn't host challenge videos. The video is
// reviewed and the feedback is what's kept - but a student has to be
// able to watch back what they submitted, and the fallback the plan
// names is to play it from their own phone rather than from storage of
// ours. A web app can't hold a pointer to a file in the camera roll,
// so this is the nearest thing: the file the student picked is copied
// into the browser's own storage for this site (IndexedDB), on this
// device only, and never leaves it. Nothing here is synced or uploaded.
//
// Three per challenge. A challenge is attempted more than once by
// design, and the last three attempts are the ones worth comparing;
// older videos are dropped as new ones arrive, and their feedback
// records stay behind in the store. The exception is a baseline: the
// first recording of "Record Your Speaking Baseline" and "Tell a Story
// Without Any Help" is the student as they arrived, and it's pinned -
// never dropped for a newer one, not removable from the shelf - so
// that weeks later it can be set beside the latest attempt and the
// distance traveled can be seen rather than told.
//
// Three two-minute phone videos is a few hundred megabytes at most -
// small next to a phone's storage, not small next to a browser's
// default quota, which is why the site asks for persistent storage the
// first time it keeps one.
//
// Two object stores rather than one, so listing a challenge's videos
// (meta) never has to read the files (blobs) - a poster and a duration
// is all the shelf needs until a video is actually played.

export interface StoredVideoMeta {
  /** The attempt this is the video of - see Attempt.id in store.tsx. */
  id: string;
  challengeSlug: string;
  /** ISO datetime the attempt was made. */
  at: string;
  durationSec: number;
  /** Bytes. */
  size: number;
  /** MIME type, for the object URL. */
  type: string;
  /** A small JPEG data URL of one frame, for the shelf. */
  poster?: string;
  /** Kept for good - a baseline. Never pruned, never removable. */
  pinned?: boolean;
}

const DB_NAME = "speak-better-videos";
const DB_VERSION = 1;
const META = "meta";
const FILES = "files";
/** How many videos a challenge keeps. */
export const KEEP_PER_CHALLENGE = 3;

/** Whether this browser can keep videos at all. */
export function canKeepVideos(): boolean {
  return typeof indexedDB !== "undefined";
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(META)) {
        const meta = db.createObjectStore(META, { keyPath: "id" });
        meta.createIndex("challengeSlug", "challengeSlug", { unique: false });
      }
      if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("blocked"));
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("aborted"));
  });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Keep a video. The attempt's feedback is recorded separately (and
 * first) in the store; this fails quietly if the browser won't hold
 * the file - the feedback is the record, the video is a convenience.
 *
 * `pin` asks for it to be kept for good - the caller says so for the
 * first recording of a baseline challenge. It holds only if the
 * challenge has no pinned recording yet: a baseline is the first take,
 * and re-recording it later doesn't move the starting line.
 */
export async function keepVideo(
  meta: StoredVideoMeta,
  blob: Blob,
  pin = false,
): Promise<boolean> {
  if (!canKeepVideos()) return false;
  try {
    // Ask once for storage that survives the browser tidying up. Not
    // every browser asks the user; the ones that don't decide from how
    // the site has been used. Either answer is fine to carry on with.
    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }
    const db = await open();
    const already = await listVideos(meta.challengeSlug, db);
    const pinned = pin && !already.some((v) => v.pinned);
    const tx = db.transaction([META, FILES], "readwrite");
    tx.objectStore(META).put(pinned ? { ...meta, pinned: true } : meta);
    tx.objectStore(FILES).put(blob, meta.id);
    await done(tx);

    // Three per challenge, not counting the baseline: the oldest
    // beyond that go.
    const kept = await listVideos(meta.challengeSlug, db);
    const stale = kept.filter((v) => !v.pinned).slice(KEEP_PER_CHALLENGE);
    if (stale.length) {
      const prune = db.transaction([META, FILES], "readwrite");
      for (const v of stale) {
        prune.objectStore(META).delete(v.id);
        prune.objectStore(FILES).delete(v.id);
      }
      await done(prune);
    }
    db.close();
    return true;
  } catch {
    return false;
  }
}

/** A challenge's kept videos, newest first. Never the files themselves. */
export async function listVideos(
  challengeSlug: string,
  db?: IDBDatabase,
): Promise<StoredVideoMeta[]> {
  if (!canKeepVideos()) return [];
  try {
    const own = db ?? (await open());
    const tx = own.transaction(META, "readonly");
    const rows = await request(
      tx.objectStore(META).index("challengeSlug").getAll(challengeSlug),
    );
    if (!db) own.close();
    return (rows as StoredVideoMeta[]).sort((a, b) => (a.at < b.at ? 1 : -1));
  } catch {
    return [];
  }
}

/** The video itself, for playing. Null if it's no longer on this device. */
/** Every kept recording on this device, newest first - for the
 *  dashboard's thumbnails. Posters only; the files aren't read. */
export async function listAllVideos(): Promise<StoredVideoMeta[]> {
  if (!canKeepVideos()) return [];
  try {
    const db = await open();
    const tx = db.transaction(META, "readonly");
    const rows = await request(tx.objectStore(META).getAll());
    db.close();
    return (rows as StoredVideoMeta[]).sort((a, b) => (a.at < b.at ? 1 : -1));
  } catch {
    return [];
  }
}

export async function loadVideo(id: string): Promise<Blob | null> {
  if (!canKeepVideos()) return null;
  try {
    const db = await open();
    const tx = db.transaction(FILES, "readonly");
    const blob = await request(tx.objectStore(FILES).get(id));
    db.close();
    return (blob as Blob | undefined) ?? null;
  } catch {
    return null;
  }
}

/** The pinned baseline recording of a challenge, if this device has it. */
export async function baselineVideo(
  challengeSlug: string,
): Promise<StoredVideoMeta | undefined> {
  return (await listVideos(challengeSlug)).find((v) => v.pinned);
}

/**
 * Take a video off this device. The attempt's feedback stays. A
 * pinned recording is left alone - the baseline isn't the student's to
 * lose by accident.
 */
export async function forgetVideo(id: string): Promise<void> {
  if (!canKeepVideos()) return;
  try {
    const db = await open();
    const meta = (await request(
      db.transaction(META, "readonly").objectStore(META).get(id),
    )) as StoredVideoMeta | undefined;
    if (meta?.pinned) {
      db.close();
      return;
    }
    const tx = db.transaction([META, FILES], "readwrite");
    tx.objectStore(META).delete(id);
    tx.objectStore(FILES).delete(id);
    await done(tx);
    db.close();
  } catch {
    // Nothing to do - it was a convenience.
  }
}

/**
 * One frame of a video as a small JPEG data URL, for the shelf. Taken a
 * second in rather than at zero, where a phone recording is usually
 * still a thumb over the lens. Resolves undefined where the browser
 * won't draw the frame - the shelf shows a plain tile instead.
 */
export function capturePoster(url: string, durationSec: number): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    let settled = false;
    const finish = (poster?: string) => {
      if (settled) return;
      settled = true;
      video.removeAttribute("src");
      video.load();
      resolve(poster);
    };
    const timer = setTimeout(() => finish(), 4000);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, Math.max(0, durationSec / 2));
    };
    video.onseeked = () => {
      try {
        const w = 320;
        const h = Math.round((w * video.videoHeight) / video.videoWidth) || 180;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(video, 0, 0, w, h);
        clearTimeout(timer);
        finish(canvas.toDataURL("image/jpeg", 0.72));
      } catch {
        clearTimeout(timer);
        finish();
      }
    };
    video.onerror = () => {
      clearTimeout(timer);
      finish();
    };
    video.src = url;
  });
}
