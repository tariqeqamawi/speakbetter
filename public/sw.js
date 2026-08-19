// Speak Better service worker - makes the app installable and keeps the
// shell responsive on flaky connections. Deliberately conservative:
// network-first for pages (content stays fresh), cache-first for
// hashed static assets and course imagery (immutable in practice), an
// offline page when a navigation can't be served at all, and nothing
// touches video or API traffic.

const CACHE = "speak-better-v4";
const OFFLINE_URL = "/offline.html";

// The bones of the app, cached at install so first-launch offline still
// shows something coherent. Bump CACHE whenever a release changes what a
// returning student should see - activate below drops every older cache,
// which is what pushes an installed copy forward.
const PRECACHE = [
  OFFLINE_URL,
  "/logo-mark.png",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // A page waiting on the network gets the response the browser
      // already started fetching, instead of waiting for this worker to
      // boot first.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable().catch(() => {});
      }
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Course imagery never changes once shipped - serve it like a build asset. */
function isImmutable(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/thumbs/") ||
    pathname.startsWith("/badges/") ||
    pathname.startsWith("/sections/") ||
    pathname.startsWith("/compare/") ||
    pathname.startsWith("/coach/") ||
    /\.(png|jpg|svg|woff2|mp3)$/.test(pathname)
  );
}

/**
 * A React flight payload, not a page.
 *
 * Every in-app link fetches the destination twice over an install's
 * lifetime: once as a document, once as flight text for a client-side
 * navigation - and both arrive at the same URL, separated only by a
 * request header. The cache keys on the URL alone, so storing the flight
 * copy would overwrite the page copy, and an offline student tapping
 * Skills would get a screenful of serialized React instead of the
 * screen. Flight traffic is served from the network and never stored.
 */
function isFlight(request, url) {
  return (
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-Prefetch") ||
    url.searchParams.has("_rsc")
  );
}

/** Put a copy in the cache, but only if it's the whole response. */
function keep(request, response) {
  // A 206 can't be cached, and an opaque cross-origin response would
  // occupy the cache without ever being readable.
  if (!response.ok || response.type === "opaque") return;
  const copy = response.clone();
  caches.open(CACHE).then((c) => c.put(request, copy));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Vimeo etc. untouched
  if (url.pathname.startsWith("/api/")) return; // reviews stay live
  if (isFlight(request, url)) return; // client-side navigation payloads

  // Immutable assets: cache-first.
  if (isImmutable(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            keep(request, res);
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations: network-first, cached copy second, offline page last -
  // a dead connection should never end at a browser error screen.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloaded = await event.preloadResponse;
          const res = preloaded || (await fetch(request));
          keep(request, res);
          return res;
        } catch {
          const cached = await caches.match(request, { ignoreSearch: true });
          return (
            cached ?? (await caches.match(OFFLINE_URL)) ?? Response.error()
          );
        }
      })(),
    );
    return;
  }

  // Everything else: network-first with cache fallback.
  event.respondWith(
    fetch(request)
      .then((res) => {
        keep(request, res);
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
  );
});
