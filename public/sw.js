// Speak Better service worker — makes the app installable and keeps the
// shell responsive on flaky connections. Deliberately conservative:
// network-first for pages (content stays fresh), cache-first for
// hashed static assets and course imagery (immutable in practice), an
// offline page when a navigation can't be served at all, and nothing
// touches video or API traffic.

const CACHE = "speak-better-v2";
const OFFLINE_URL = "/offline.html";

// The bones of the app, cached at install so first-launch offline still
// shows something coherent.
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
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Course imagery never changes once shipped — serve it like a build asset. */
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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Vimeo etc. untouched
  if (url.pathname.startsWith("/api/")) return; // reviews stay live

  // Immutable assets: cache-first.
  if (isImmutable(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations: network-first, cached copy second, offline page last —
  // a dead connection should never end at a browser error screen.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit ?? caches.match(OFFLINE_URL))
            .then((hit) => hit ?? Response.error()),
        ),
    );
    return;
  }

  // Everything else: network-first with cache fallback.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
  );
});
