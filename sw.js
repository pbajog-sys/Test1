// Service Worker: App offline verfügbar machen. Walfotos werden beim ersten Anzeigen zwischengespeichert.
const VERSION = 'walquiz-v85';
const SHELL = [
  './',
  'index.html',
  'stil.css',
  'ansichten.css',
  'fonts/fonts.css',
  'wale.js',
  'haie.js',
  'porsche.js',
  'dackel.js',
  'groesse.js',
  'gretchen.js',
  'effekte.js',
  'app.js',
  'melden.js',
  'verlauf.js',
  'hub.js',
  'farben.js',
  'cello.js',
  'instrumente.js',
  'toene.js',
  'gehoer.js',
  'takt.js',
  'punkte.js',
  'funktion.js',
  'zufall.js',
  'zahlen.js',
  'tierleben.js',
  'tierpixel.js',
  'piranha.js',
  'slo.js',
  'plattform.js',
  'experimente.js',
  'augen.js',
  'karten-daten.js',
  'karte.js',
  'tiefgang.js',
  'riff.js',
  'krimi-grafik.js',
  'krimi.js',
  'krimi-wachen.js',
  'krimi-verhoer.js',
  'krimi-alibi.js',
  'krimi-akte.js',
  'krimi-zentrale.js',
  'profile.js',
  'fuehrung.js',
  'datenschutz.html',
  'fotos.json',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/favicon-64.png',
  'icons/icon-maskable-512.png',
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
  'img/krimi/alibi.webp',
  'img/krimi/elena.webp',
  'img/krimi/erfolg.webp',
  'img/krimi/falsch.webp',
  'img/krimi/felix.webp',
  'img/krimi/geloest.webp',
  'img/krimi/hut-leicht.webp',
  'img/krimi/hut-mittel.webp',
  'img/krimi/hut-schwer.webp',
  'img/krimi/jonas.webp',
  'img/krimi/lampe.webp',
  'img/krimi/lara.webp',
  'img/krimi/leon.webp',
  'img/krimi/lupe.webp',
  'img/krimi/markus.webp',
  'img/krimi/mia.webp',
  'img/krimi/notizen.webp',
  'img/krimi/pflanze.webp',
  'img/krimi/raum-arbeitszimmer.webp',
  'img/krimi/raum-bibliothek.webp',
  'img/krimi/raum-kueche.webp',
  'img/krimi/raum-salon.webp',
  'img/krimi/raum-schlafzimmer.webp',
  'img/krimi/raum-wintergarten.webp',
  'img/krimi/richtig.webp',
  'img/krimi/schluessel.webp',
  'img/krimi/schrank.webp',
  'img/krimi/sofa.webp',
  'img/krimi/sophie.webp',
  'img/krimi/stern-leer.webp',
  'img/krimi/stern.webp',
  'img/krimi/tatwaffe.webp',
  'img/krimi/teppich.webp',
  'img/krimi/thomas.webp',
  'img/krimi/tipp.webp',
  'img/krimi/uhr.webp',
  'img/krimi/victoria.webp',
  'img/krimi/villa.webp',
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
      // cache: 'no-cache' – nicht die bis zu 10 Minuten alte Kopie aus dem Browser-Zwischenspeicher nehmen
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // Fotos von Wikimedia: erst Cache, sonst Netz und merken.
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
