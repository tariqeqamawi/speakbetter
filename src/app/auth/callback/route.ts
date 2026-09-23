import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Where the email's link lands: the code becomes a session, and the
// student goes on to whatever they were trying to reach.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";
  const db = await supabaseServer();
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", url.origin));
}
