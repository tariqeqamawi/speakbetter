import { NextResponse } from "next/server";
import { getTranscript } from "@/lib/transcripts";

// One lesson's transcript, on request. The whole file is half a
// megabyte and belongs on the server (lib/transcripts.ts); the panel
// under a lesson asks for the one it needs when a student opens it.

export async function GET(request: Request) {
  const lesson = new URL(request.url).searchParams.get("lesson") ?? "";
  if (!/^\d{6,12}$/.test(lesson)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const text = getTranscript(lesson);
  if (!text) return NextResponse.json({ error: "none" }, { status: 404 });
  return NextResponse.json({ text }, { headers: { "Cache-Control": "public, max-age=86400, immutable" } });
}
