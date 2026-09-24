import { NextResponse } from "next/server";
import { getJson, isStudentId, listJson } from "@/lib/server/store";

// Getting a student's work back after their device forgot it.
//
// WHY THERE IS ANYTHING TO GET BACK. The app is device-local until
// accounts are switched on: a student's record lives in their
// browser's storage and nowhere else (lib/supabase/config.ts). That is
// a deliberate privacy choice and it works right up until the browser
// throws the storage away - which iOS does on its own to any site not
// opened for a week, and which also happens whenever the app is
// reached on a different domain, because storage is per-origin.
//
// What survives is here by accident of a different feature: a review
// is parked server-side so a student who closes the tab mid-review
// still gets it on their next open. Those parked copies carry the
// challenge, the score, the spectrum and the whole written review -
// enough to rebuild the attempts, which is the part nobody wants to
// re-record.
//
// WHAT IT CANNOT BRING BACK. Watched lessons, badges, streak days and
// quest chests were only ever in the browser. This restores takes and
// their reviews. Everything else has to be re-earned, and the student
// should be told that plainly rather than left to notice.
//
// The id is a random uuid the device made up, so knowing one is proof
// enough to read that one student's reviews - there is no account to
// authenticate against yet. Worth removing, or putting behind the
// Supabase session, once accounts are live.

interface Kept {
  attemptId?: string;
  challengeSlug?: string;
  durationSec?: number;
  at?: string;
  score?: number;
  passed?: boolean;
  [key: string]: unknown;
}

export async function GET(request: Request) {
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!isStudentId(studentId))
    return NextResponse.json({ error: "Which student?" }, { status: 400 });

  const rows = await listJson<Kept>(`reviews/${studentId}/`);

  const attempts = rows
    .map(({ path, data }) => ({
      ...data,
      // The filename is the attempt id, and is the one field that is
      // certainly right even if an older record was saved without it.
      attemptId: data.attemptId ?? path.split("/").pop()?.replace(".json", ""),
    }))
    .filter((a) => a.attemptId && a.challengeSlug)
    .sort((a, b) => String(a.at ?? "").localeCompare(String(b.at ?? "")));

  // A full backup, if this student's device has written one since
  // backups existed. It carries everything - lessons watched, badges,
  // streak days - where the parked reviews carry only the takes.
  const backup = await getJson<{ at?: string; state?: Record<string, unknown> }>(
    `backup/${studentId}.json`,
  );

  return NextResponse.json({
    attempts,
    backup: backup?.state ? { at: backup.at ?? null, state: backup.state } : null,
  });
}
