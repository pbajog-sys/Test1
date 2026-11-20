// Service Worker: App offline verfügbar machen. Walfotos werden beim ersten Anzeigen zwischengespeichert.
const VERSION = 'walquiz-v186';
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
  'songs.js',
  'spotify.js',
  'deezer.js',
  'klassiker.js',
  'falten.js',
  'zoom.js',
  'glas.js',
  'beat.js',
  'wunder.js',
  'studio.js',
  'stimmen-pro.js',
  'stimmen.js',
  'fitness-daten.js',
  'fitness-plaene.js',
  'fitness.js',
  'scan.js',
  'gesten.js',
  'lib/zxing.min.js',
  'sync.js',
  'werkzeuge/text-zu-ics.html',
  'nvl/',
  'nvl/index.html',
  'nvl/icons/apple-touch-icon.png?v=1',
  'takt.js',
  'punkte.js',
  'funktion.js',
  'zufall.js',
  'zfrechen.js',
  'zahlen.js',
  'tierleben.js',
  'tierpixel.js',
  'piranha.js',
  'slo.js',
  'slo-pro.js',
  'lernlog.js',
  'sprech-ki.js',
  'lernhalle.js',
  'slo-fach.js',
  'slo-theorie.js',
  'en-daten.js',
  'en-c1c2.js',
  'slo-lex.json',
  'plattform.js',
  'dopamin.js',
  'rage.js',
  'naehen.js',
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
  // cache: 'reload' – beim Installieren einer neuen Version nie eine ältere Kopie aus dem Browser-Zwischenspeicher übernehmen
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'sprechki-cdn' && !/transformers/i.test(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Spielstand-Sync / Konto-Server auf dem Homeserver: nie zwischenspeichern, immer direkt ans Netz.
  if (url.origin === location.origin && (url.pathname.includes('/sync/') || url.pathname.includes('/api/'))) return;   // Konto-Server: nie zwischenspeichern

  // Eigene Dateien: sofort aus dem Cache (schneller Start, auch wenn der Homeserver gerade nicht erreichbar ist),
  // im Hintergrund frisch vom Server holen und für das nächste Öffnen merken. Nur was noch nicht im Cache ist,
  // kommt direkt aus dem Netz. Neue App-Versionen (VERSION) legen beim Installieren einen kompletten neuen Cache an,
  // danach lädt app.js die Seite einmal neu – so werden alte und neue Dateien nicht gemischt.
  if (url.origin === location.origin) {
    event.respondWith(caches.open(VERSION).then((c) => c.match(req, { ignoreSearch: true }).then((cached) => {
      // cache: 'no-cache' – nicht die bis zu 10 Minuten alte Kopie aus dem Browser-Zwischenspeicher nehmen
      const netz = fetch(req, { cache: 'no-cache' }).then((res) => {
        if (res.status === 200) c.put(req, res.clone()).catch(() => {});
        return res;
      });
      if (cached) { event.waitUntil(netz.catch(() => {})); return cached; }
      return netz.catch(() => caches.match('index.html'));
    })));
    return;
  }

  // Whisper (Spracherkennung auf dem Gerät): Programm von jsDelivr dauerhaft merken → danach offline.
  // Die Modelldateien speichert transformers.js selbst im Cache „transformers-cache“.
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('@huggingface/transformers')) {
    event.respondWith(
      caches.open('sprechki-cdn').then((c) => c.match(req).then((cached) => cached || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; })))
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
