/* Parslia Kitchen Ops — service worker */
const CACHE = 'parslia-core-v2-clarity';
const CORE = [
  './',
  './index.html',
  './pro-dashboard.html',
  './css/dashboard-clarity.css',
  './js/dashboard-search.js',
  './privacy.html',
  './terms.html',
  './support.html',
  './css/portal-info.css',
  './operations.html',
  './kitchen-sop-pack.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('parslia-core-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only cache public files on this site, never Firebase or other service responses.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (req.headers.has('authorization')) return;

  const accept = req.headers.get('accept') || '';
  const isNav = req.mode === 'navigate' || accept.includes('text/html');

  if (isNav) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(req, copy)));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./pro-dashboard.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(req, copy)));
          }
          return res;
        })
        .catch(() => cached);
      event.waitUntil(network.then(() => undefined));
      return cached || network;
    })
  );
});
