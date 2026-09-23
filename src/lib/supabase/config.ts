// Is Supabase wired up in this environment?
//
// The app runs without it: everything lives in the browser, one student
// per device, which is how it has worked so far and how the /demo and
// /landing previews still work. With the two public vars set it becomes
// multi-user - accounts, and a student's record following them between
// devices. Nothing else in the app has to know which mode it's in; the
// store asks this and syncs, or doesn't.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function supabaseConfigured(): boolean {
  return SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
}
