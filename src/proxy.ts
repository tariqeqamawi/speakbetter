import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";

// Keeps a signed-in session fresh as the student moves around. Without
// Supabase configured this does nothing at all, which is what lets the
// app go on working as a single-device course.
//
// (Next 16 calls this file "proxy"; it is what used to be middleware.)

// Pages whose shared link should open as the square card in WhatsApp.
const SQUARE_SHARE = new Set(["/", "/landing"]);

export default async function proxy(request: NextRequest) {
  // WhatsApp's link-preview crawler gets the square-card metadata.
  if (SQUARE_SHARE.has(request.nextUrl.pathname) && /WhatsApp/i.test(request.headers.get("user-agent") ?? "")) {
    return NextResponse.rewrite(new URL("/share/whatsapp", request.url));
  }
  if (!supabaseConfigured()) return NextResponse.next();
  const response = NextResponse.next({ request });
  const db = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await db.auth.getUser();
  return response;
}

export const config = {
  // Everything but the things that never carry a session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|webp|svg|mp4|mp3|ico)$).*)"],
};
