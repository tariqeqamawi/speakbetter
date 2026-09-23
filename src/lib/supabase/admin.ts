import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, supabaseConfigured } from "./config";

// The one client that is allowed past Row Level Security, for the one
// job that has to be: Stripe's webhook writing a plan onto a profile.
// Nothing a browser runs ever sees this key - it is read from the
// server environment and used only inside route handlers.
//
// Null when the service key isn't set, which keeps the same promise
// the rest of the Supabase layer makes: unconfigured means inert, not
// broken.

let admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseConfigured() || !key) return null;
  admin ??= createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
