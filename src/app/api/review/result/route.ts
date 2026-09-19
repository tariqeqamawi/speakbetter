import { NextResponse } from "next/server";
import { delJson, getJson, isStudentId } from "@/lib/server/store";

// A review kept for a student who left the page while the coach
// watched (see the review route). The app asks for it on its next open,
// records it, and it's deleted here - nothing about a recording or its
// review persists on our side longer than it has to (§13).

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const attemptId = url.searchParams.get("attemptId");
  if (!isStudentId(studentId) || !attemptId || !/^[0-9a-f-]{36}$/i.test(attemptId))
    return NextResponse.json({ error: "Which?" }, { status: 400 });
  const path = `reviews/${studentId}/${attemptId}.json`;
  const kept = await getJson<Record<string, unknown>>(path);
  if (!kept) return NextResponse.json({ ready: false });
  await delJson(path);
  return NextResponse.json({ ready: true, review: kept });
}
