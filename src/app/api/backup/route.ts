import { NextResponse } from "next/server";
import { getJson, isStudentId, putJson } from "@/lib/server/store";

// A copy of a student's record, so a browser losing its storage stops
// being the end of their work.
//
// WHY THIS EXISTS AT ALL. Until accounts are switched on, a student's
// whole record lives in one browser's localStorage and nowhere else.
// That is fine as a privacy stance and fatal as a durability one: iOS
// deletes the storage of any site not opened for a week, storage is
// per-origin so the same app on a second address starts empty, and
// clearing website data takes everything with it. A cohort member
// losing four weeks of work in week five is a refund conversation, and
// "your browser did it" is not an answer anybody accepts.
//
// WHAT IS IN IT. Scores, which lessons were watched, badges, streak
// days, the display name and the student's own note about why they are
// here. NOT the recordings - those still never leave the phone except
// to be watched and deleted (master plan §13), and nothing here
// changes that promise.
//
// WHAT IT IS NOT. Not a sync: it is written one way and only read back
// deliberately, from /restore. Two devices do not merge through this,
// and the newer copy always wins on write, which is the right shape
// for a safety net and the wrong shape for multi-device - that is what
// Supabase is for, when it lands.

/** Bigger than any real record, small enough to refuse a mistake. */
const MAX_BYTES = 512 * 1024;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { studentId?: unknown; state?: unknown }
    | null;

  if (!body || !isStudentId(body.studentId))
    return NextResponse.json({ error: "Who?" }, { status: 400 });
  if (!body.state || typeof body.state !== "object")
    return NextResponse.json({ error: "What?" }, { status: 400 });

  const json = JSON.stringify(body.state);
  if (json.length > MAX_BYTES)
    return NextResponse.json({ error: "Too big." }, { status: 413 });

  // An empty record must never overwrite a full one. This is the whole
  // failure this route is meant to protect against: a device that has
  // just lost its storage will happily back up its own emptiness a
  // second later and destroy the copy that could have saved it.
  const incoming = body.state as { attempts?: unknown[]; watchedLessons?: unknown[] };
  const thin =
    (incoming.attempts?.length ?? 0) === 0 && (incoming.watchedLessons?.length ?? 0) === 0;

  if (thin) {
    const have = await getJson<{ state?: { attempts?: unknown[]; watchedLessons?: unknown[] } }>(
      `backup/${body.studentId}.json`,
    );
    const had =
      (have?.state?.attempts?.length ?? 0) > 0 || (have?.state?.watchedLessons?.length ?? 0) > 0;
    if (had) return NextResponse.json({ ok: true, skipped: "would have emptied a real record" });
  }

  await putJson(`backup/${body.studentId}.json`, {
    at: new Date().toISOString(),
    state: body.state,
  });

  return NextResponse.json({ ok: true });
}
