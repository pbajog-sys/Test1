// Service Worker: App offline verfügbar machen. Walfotos werden beim ersten Anzeigen zwischengespeichert.
const VERSION = 'walquiz-v10';
const SHELL = [
  './',
  'index.html',
  'wale.js',
  'haie.js',
  'porsche.js',
  'dackel.js',
  'groesse.js',
  'gretchen.js',
  'app.js',
  'melden.js',
  'fotos.json',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'img/gretchen/avatar.jpg',
  'img/gretchen/avatar-denkt.jpg',
  'img/gretchen/g01.jpg',
  'img/gretchen/g02.jpg',
  'img/gretchen/g03.jpg',
  'img/gretchen/g04.jpg',
  'img/gretchen/g05.jpg',
  'img/gretchen/g06.jpg',
  'img/gretchen/g07.jpg',
  'img/gretchen/g08.jpg',
  'img/gretchen/g09.jpg',
  'img/gretchen/g10.jpg',
  'img/gretchen/g11.jpg',
  'img/gretchen/g12.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Eigene Dateien: erst Netz (damit Updates ankommen), sonst Cache.
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // Walfotos von Wikimedia: erst Cache, sonst Netz und merken.
  if (url.hostname.endsWith('wikimedia.org')) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});
