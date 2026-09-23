"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

// The browser's client, made once. Null when Supabase isn't configured,
// so every caller has to say what it does without an account - which is
// the honest shape, because the app has to keep working that way.

let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabase() {
  if (!supabaseConfigured()) return null;
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
