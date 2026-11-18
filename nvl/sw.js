// Service Worker: Fallsimulator offline verfügbar machen. Gespeichert werden nur die App-Dateien – keine Falldaten.
const VERSION = 'nvl-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png?v=1',
  'icons/icon-512.png?v=1',
  'icons/icon-maskable-512.png?v=1',
  'icons/apple-touch-icon.png?v=1',
  'icons/favicon-64.png?v=1'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('nvl-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Erst Netz (damit Updates ankommen), sonst Cache. Nur eigene Dateien, nie fremde Adressen.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
