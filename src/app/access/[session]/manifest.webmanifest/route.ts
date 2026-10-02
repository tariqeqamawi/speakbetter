import manifest from "@/app/manifest";

// A buyer's own install: the same app, but the home-screen icon opens
// their access link (/access/<session>) instead of "/". On an iPhone a
// home-screen app keeps its own storage, separate from Safari's - so an
// icon pointed at "/" would open a locked app. Pointed at the access
// link, it unlocks itself on every launch and goes straight in
// (access-unlock.tsx skips its welcome when running installed).

export async function GET(_req: Request, { params }: { params: Promise<{ session: string }> }) {
  const { session } = await params;
  const base = manifest();
  const ok = /^cs_(live|test)_[A-Za-z0-9]+$/.test(session);
  return Response.json(
    { ...base, start_url: ok ? `/access/${session}` : "/", id: "/" },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "private, max-age=3600" } },
  );
}
