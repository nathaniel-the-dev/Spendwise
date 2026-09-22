/*
 * SpendWise service worker (served at /sw.js).
 *
 * Offline strategy, in layers:
 *  1. Static build assets + icons (content-hashed, immutable): cache-first.
 *  2. Page navigations + RSC payload fetches: network-first, cached on success,
 *     served from cache when offline. App-router pages are client components
 *     that fetch their data at runtime, so cached HTML is a data-free shell —
 *     safe to serve across sessions; the real data comes from the persisted
 *     TanStack Query cache (and fresh fetches when online).
 *  3. When a navigation can't be served from cache at all: the /offline page.
 *  4. /api/** and cross-origin requests: NEVER intercepted. Auth and
 *     RLS-scoped data must always hit the network; caching them risks
 *     cross-user leakage and stale money math.
 */

const STATIC_CACHE = "spendwise-static-v2";
const PAGES_CACHE = "spendwise-pages-v2";
const OFFLINE_URL = "/offline";
const MAX_CACHED_PAGES = 24;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache
        .addAll([
          "/icons/icon-192.png",
          "/icons/icon-512.png",
          "/icons/maskable-512.png",
          "/icons/apple-touch-icon.png",
        ])
        .catch(() => {});
      // Precache the offline fallback so it works on a cold offline start.
      try {
        await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      } catch {
        /* first-deploy hiccup — navigations still cache-first later */
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function trimPagesCache() {
  const cache = await caches.open(PAGES_CACHE);
  const keys = await cache.keys();
  if (keys.length <= MAX_CACHED_PAGES) return;
  // Oldest-first eviction (Cache Storage preserves insertion order).
  await Promise.all(
    keys.slice(0, keys.length - MAX_CACHED_PAGES).map((r) => cache.delete(r))
  );
}

/** Network-first with cache fallback; falls back to /offline when unreachable. */
async function networkFirst(req) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === "basic") {
      cache.put(req, res.clone()).then(trimPagesCache).catch(() => {});
    }
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) {
      // 504 status keeps the failure visible to devtools while still
      // rendering the friendly fallback page.
      return new Response(offline.body, {
        status: 504,
        headers: offline.headers,
      });
    }
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Hard rule: API routes are never cached or intercepted.
  if (url.pathname.startsWith("/api/")) return;

  const isStaticAsset = url.pathname.startsWith("/_next/static/");
  const isIcon = url.pathname.startsWith("/icons/");
  if (isStaticAsset || isIcon) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Full document loads.
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
  }

  // Everything else — including Next's client-side RSC payload fetches, which
  // carry a unique ?_rsc= nonce per navigation and so would never be a cache
  // hit — is left to the network. Offline, the already-loaded shell plus the
  // persisted query cache keep the current page usable.
});
