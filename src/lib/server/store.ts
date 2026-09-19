import { del, get, list, put } from "@vercel/blob";

// The app's small server-side records - this week's board, push
// subscriptions, a review kept for a student who left the page - as
// private JSON blobs in the store the recordings already use. There is
// no database and no accounts (§13): a student is a random id their
// device made up, and what's kept about them is what they chose to
// send. Swap this file for a database when the records outgrow it; the
// three calls are the whole interface.

const ACCESS = { access: "private" as const };

export async function putJson(path: string, data: unknown): Promise<void> {
  await put(path, JSON.stringify(data), {
    ...ACCESS,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function getJson<T>(path: string): Promise<T | null> {
  try {
    const got = await get(path, { ...ACCESS, useCache: false });
    if (!got || got.statusCode !== 200 || !got.stream) return null;
    return JSON.parse(await new Response(got.stream).text()) as T;
  } catch {
    return null;
  }
}

/** Every record under a prefix, parsed. */
export async function listJson<T>(prefix: string): Promise<{ path: string; data: T }[]> {
  const out: { path: string; data: T }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ ...ACCESS, prefix, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const data = await getJson<T>(b.pathname);
      if (data) out.push({ path: b.pathname, data });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

export async function delJson(path: string): Promise<void> {
  try {
    await del(path);
  } catch {
    // already gone
  }
}

/** The ISO week a date falls in, as "2026-W38" - the board's key. */
export function weekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** A student id as the client makes them: a UUID. Anything else is refused. */
export function isStudentId(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
}
