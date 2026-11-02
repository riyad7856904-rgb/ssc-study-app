/* SSC পড়ার অ্যাপ — service worker: প্রথম লোডের পর পুরোপুরি অফলাইনে চলবে */
const CACHE = 'ssc-study-app-v9';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './data-pouroniti.js', './data-itihas.js', './data-bhugol.js', './data-bangla2.js', './data-islam.js'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: stale-while-revalidate (একবার এলে ক্যাশ থেকে চলবে)
  if (url.hostname.includes('fonts.g')) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(req).then(hit => {
          const net = fetch(req).then(res => { if (res && (res.status === 200 || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit);
          return hit || net;
        })
      )
    );
    return;
  }

  // নিজের ফাইল: cache-first, না থাকলে নেটওয়ার্ক থেকে এনে ক্যাশে রাখো
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit => {
        if (hit) return hit;
        return fetch(req).then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(req, copy));
          }
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
});
