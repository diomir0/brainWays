// BrainWays service worker: cache-first for the heavy immutable assets
// (brain model + Draco decoder), network-first with cache fallback otherwise.
const CACHE = 'brainways-v1';

const PRECACHE = [
  './',
  './icon.svg',
  './manifest.webmanifest',
  './models/brain.glb',
  './draco/draco_decoder.js',
  './draco/draco_decoder.wasm',
  './draco/draco_wasm_wrapper.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Cache-first for immutable heavy assets.
  if (url.pathname.includes('/models/') || url.pathname.includes('/draco/')) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })),
    );
    return;
  }

  // Network-first, falling back to cache (navigation falls back to the root.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((hit) => hit || caches.match('./')),
      ),
  );
});
