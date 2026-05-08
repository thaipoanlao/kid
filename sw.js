const CACHE = 'cher-v1';
const STATIC = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // MP3 — cache first, เก็บไว้เล่น offline
  if (url.includes('/songs/') && url.endsWith('.mp3')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const hit = await cache.match(e.request);
        if (hit) return hit;
        const resp = await fetch(e.request);
        if (resp.ok) cache.put(e.request, resp.clone());
        return resp;
      })
    );
    return;
  }

  // อื่นๆ — network first, fallback cache
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp.ok) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
