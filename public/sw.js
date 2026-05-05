/* Minimal service worker: app-shell precache + network-first for HTML
   so users always get the latest deploy when online, but can still launch
   the app from the home screen when offline.

   Static assets (Vite hashes them) → cache-first (immutable). */

const VERSION = 'v6';
const SHELL_CACHE = `roborave-shell-${VERSION}`;
const ASSET_CACHE = `roborave-assets-${VERSION}`;
const SHELL_URLS = ['/', '/manifest.webmanifest', '/img/rain-o.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => ![SHELL_CACHE, ASSET_CACHE].includes(k)).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never intercept Firestore / Auth / non-same-origin → let the network handle it.
  if (url.origin !== self.location.origin) return;

  // Hashed Vite assets → cache-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // HTML / shell → network-first w/ cache fallback so offline launch still works.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(SHELL_CACHE).then((c) => c.put('/', copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match('/'))
    );
  }
});
