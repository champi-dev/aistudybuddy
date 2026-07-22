/*
 * AI Study Buddy service worker.
 *
 * Hand-written (no build step) so it can ship with the existing Vite setup:
 *   - App shell is precached so the app opens offline.
 *   - Vite's /assets/* files are content-hashed, therefore immutable ->
 *     cache-first.
 *   - Navigations are network-first with a cached shell fallback, so a new
 *     deploy is picked up immediately when online but still works offline.
 *   - API traffic is NEVER cached: responses are user-scoped and auth'd, and
 *     serving a stale one to a different account would leak data.
 */

const VERSION = 'v1';
const SHELL_CACHE = `asb-shell-${VERSION}`;
const ASSET_CACHE = `asb-assets-${VERSION}`;

const SHELL_URLS = [
  '/',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
];

/*
 * Vite emits content-hashed bundles whose names aren't known when this file is
 * written, and the first page load fetches them BEFORE this worker activates —
 * so the fetch handler never sees them and an offline reload would render a
 * blank shell. Discover them by parsing index.html at install time.
 */
async function precacheHashedAssets() {
  const response = await fetch('/', { cache: 'no-store' });
  const html = await response.text();
  const urls = new Set();
  for (const match of html.matchAll(/["'](\/assets\/[^"']+)["']/g)) {
    urls.add(match[1]);
  }
  if (urls.size === 0) return;
  const cache = await caches.open(ASSET_CACHE);
  await Promise.allSettled([...urls].map((url) => cache.add(url)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // Individual misses must not fail the whole install
      .then((cache) => Promise.allSettled(SHELL_URLS.map((url) => cache.add(url))))
      .then(() => precacheHashedAssets())
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only; leave the API and third parties to the network.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // Navigations: network-first, fall back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // Hashed build output + icons: cache-first.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
