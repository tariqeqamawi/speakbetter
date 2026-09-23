import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

// The server's client, reading the session from cookies - for route
// handlers that act as the student (checking a plan before spending a
// review, say). Null when Supabase isn't configured.

export async function supabaseServer() {
  if (!supabaseConfigured()) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // A Server Component can't set cookies; middleware refreshes
          // the session instead.
        }
      },
    },
  });
}

/** The signed-in student's id, or null. */
export async function currentStudentId(): Promise<string | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db.auth.getUser();
  return data.user?.id ?? null;
}
