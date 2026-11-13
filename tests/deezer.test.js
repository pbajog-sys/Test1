// Deezer im Song-Rätsel – gegen ein NACHGEBAUTES Deezer (JSONP-API + Hörproben als WAV), nicht gegen das echte.
// Prüft: ohne Anmeldung, Playlist-Suche je Kategorie (Redaktion zuerst), Große Hits (Rang), echte Wiedergabe im
// <audio>-Element mit gemessener Ausschnittlänge, „Titel erkennen“ + „Jahr schätzen“ (Sampler übersprungen), Verlauf.
// Aufruf: python3 -m http.server 8765, dann  node tests/deezer.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';

// 30 s Ton als WAV (8 kHz mono) – steht für jede Hörprobe
function wav30() {
  const rate = 8000, n = rate * 30, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(3000 * Math.sin(2 * Math.PI * 440 * i / rate)), 44 + i * 2);
  return b;
}
const WAV = wav30();
const track = (pl, i) => ({ id: pl * 1000 + i, readable: true, title: 'Song ' + pl + '-' + i + (i % 9 === 0 ? ' (Remastered 2009)' : ''), title_short: 'Song ' + pl + '-' + i + (i % 9 === 0 ? ' (Remastered 2009)' : ''), rank: 100000 * (i + 1), preview: 'https://cdnt-preview.dzcdn.net/test/' + pl + '-' + i + '.mp3', artist: { name: 'Künstler ' + pl + '-' + i }, album: { id: pl * 1000 + i, cover_small: '' } });

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const L = { suchen: [], playlists: [], alben: 0, spotify: 0 };
  await ctx.route('https://api.deezer.com/**', (route) => {
    const u = new URL(route.request().url()), cb = u.searchParams.get('callback');
    let x;
    if (u.pathname === '/search/playlist') {
      L.suchen.push(u.searchParams.get('q'));
      x = { data: [{ id: 1, title: 'Fan-Liste', nb_tracks: 60, user: { name: 'Anonymous' } }, { id: 2, title: 'Zu kurz', nb_tracks: 10, user: { name: 'Max - Deezer Pop Editor' } }, { id: 3, title: 'Editor A', nb_tracks: 50, user: { name: 'Laeti - Deezer Pop Editor' } }, { id: 4, title: 'Editor B', nb_tracks: 50, user: { name: 'Rod - Deezer Rock Editor' } }, { id: 5, title: 'Editor C', nb_tracks: 50, user: { name: 'Deezer Editor' } }, { id: 6, title: 'Fan 2', nb_tracks: 40, user: { name: 'Jo' } }] };
    } else if (/^\/playlist\/\d+\/tracks$/.test(u.pathname)) {
      const pl = +u.pathname.split('/')[2]; L.playlists.push(pl);
      x = { data: Array.from({ length: 30 }, (_, i) => track(pl, i)) };
    } else if (/^\/album\/\d+$/.test(u.pathname)) {
      const id = +u.pathname.split('/')[2]; L.alben++;
      x = id % 5 === 0 ? { id, title: 'Greatest Hits', record_type: 'compile', release_date: '2015-01-01' } : { id, title: 'Album ' + id, record_type: 'album', release_date: (1980 + (id % 10)) + '-05-01' };
    } else if (u.pathname === '/chart/0/tracks') x = { data: Array.from({ length: 30 }, (_, i) => track(9, i)) };
    else x = { error: { type: 'DataException', message: 'no data' } };
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: cb + '(' + JSON.stringify(x) + ')' });
  });
  await ctx.route('https://cdnt-preview.dzcdn.net/**', (route) => route.fulfill({ status: 200, contentType: 'audio/wav', headers: { 'accept-ranges': 'bytes' }, body: WAV }));
  await ctx.route('https://*.spotify.com/**', (route) => { L.spotify++; route.abort(); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  await p.click('#hubSongs'); await p.waitForTimeout(900);
  // gespielte Audiozeit je Ausschnitt mitschreiben
  await p.evaluate(() => { window.__gespielt = []; const a = dzAudio(); let ab = null; a.addEventListener('playing', () => { if (!/^data:/.test(a.src)) ab = a.currentTime; }); a.addEventListener('pause', () => { if (ab != null) { window.__gespielt.push(a.currentTime - ab); ab = null; } }); });
  const box = await p.evaluate(() => ({ deezer: !!document.querySelector('[data-netz="deezer"].on'), privat: /private Nutzung im Familienkreis/.test(document.querySelector('.sp-box').innerText), kats: [...document.querySelectorAll('[data-kat]')].map((x) => x.dataset.kat) }));
  ck('Deezer ist Standard, ohne Anmeldung spielbar', box.deezer && !!(await p.$('#spLos')));
  ck('Hinweis „privat im Familienkreis“ sichtbar', box.privat);
  ck('Ohne Konto keine Favoriten/Bibliothek-Kategorien', !box.kats.includes('fav') && !box.kats.includes('bib') && box.kats.includes('80er'), box.kats.join(','));
  await p.evaluate(() => document.querySelector('.sp-box').scrollIntoView());
  await p.screenshot({ path: ordner + '/dz-menue.png' });

  // 1) Titel erkennen · 80er Pop · Große Hits · Leicht
  await p.click('#spLos');
  for (let i = 0; i < 5; i++) {
    await p.waitForSelector('.sp-optionen [data-o]', { timeout: 10000 });
    await p.waitForFunction(() => sp && sp.runden[sp.i].gehoert === 1 && dzAudio().paused && window.__gespielt.length > sp.i, null, { timeout: 15000 });
    if (i === 0) await p.screenshot({ path: ordner + '/dz-runde.png' });
    const k = await p.evaluate(() => { const R = sp.runden[sp.i]; return R.optionen.indexOf(R.T); });
    await p.click('[data-o="' + k + '"]'); await p.waitForTimeout(150);
    if (i === 0) await p.screenshot({ path: ordner + '/dz-aufloesung.png' });
    await p.click('#srWeiter');
  }
  await p.waitForTimeout(300);
  let ende = await p.evaluate(() => $('ton-song').innerText);
  ck('Titel erkennen: 5 richtig = 50/50', /50 \/ 50/.test(ende), ende.split('\n')[1]);
  const gesp = await p.evaluate(() => window.__gespielt.slice(0, 5));
  ck('Wirklich abgespielt, je ≈ 4 s Audiozeit', gesp.length === 5 && gesp.every((x) => x > 3.8 && x < 4.4), gesp.map((x) => x.toFixed(2)).join(', ') + ' s');
  ck('Suche „80s pop hits“', L.suchen[0] === '80s pop hits', L.suchen.join(' | '));
  ck('Nur Redaktions-Playlists mit genug Songs', L.playlists.length === 3 && L.playlists.every((x) => [3, 4, 5].includes(x)), L.playlists.join(','));
  const rang = await p.evaluate(() => sp.runden.map((R) => R.T.rang));
  ck('Große Hits: nur die bekanntere Hälfte (Rang)', rang.every((x) => x >= 1500000), rang.join(','));
  ck('„(Remastered 2009)“ entfernt', await p.evaluate(() => sp.runden.every((R) => R.optionen.every((T) => !/Remaster/.test(T.name)))));

  // 2) Jahr schätzen · Rock-Klassiker · Mittel
  await p.click('#srZurMenue'); await p.waitForTimeout(400);
  await p.click('[data-spm="jahr"]'); await p.waitForTimeout(300);
  await p.click('[data-kat="rock"]'); await p.waitForTimeout(300);
  await p.click('[data-s="mittel"]'); await p.waitForTimeout(400);
  await p.click('#spLos');
  for (let i = 0; i < 5; i++) {
    await p.waitForSelector('#spJahrOk', { timeout: 15000 });
    await p.waitForFunction(() => sp && sp.runden[sp.i].gehoert === 1, null, { timeout: 8000 });
    await p.waitForTimeout(1500);
    const j = await p.evaluate(() => sp.runden[sp.i].T.jahr);
    await p.evaluate((x) => { const r = $('spJahr'); r.value = x; r.dispatchEvent(new Event('input')); }, j);
    if (i === 0) await p.screenshot({ path: ordner + '/dz-jahr.png' });
    await p.click('#spJahrOk'); await p.waitForTimeout(150);
    await p.click('#srWeiter');
  }
  await p.waitForTimeout(300);
  ende = await p.evaluate(() => $('ton-song').innerText);
  ck('Jahr schätzen: 5× genau = 50/50', /50 \/ 50/.test(ende), ende.split('\n')[1]);
  ck('Suche „rock classics“', L.suchen.includes('rock classics'));
  const jahre = await p.evaluate(() => sp.runden.map((R) => R.T.albumId % 5 + ':' + R.T.jahr));
  ck('Sampler/„Greatest Hits“-Alben übersprungen', jahre.every((x) => !x.startsWith('0:')), jahre.join(' '));
  await p.screenshot({ path: ordner + '/dz-ende.png', fullPage: true });
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'songs').map((e) => e.x.modus + ':' + e.x.kat));
  ck('Verlauf: deezer-titel:80er, deezer-jahr:rock', vl.join(',') === 'deezer-titel:80er,deezer-jahr:rock', vl.join(','));
  ck('Keine einzige Anfrage an Spotify', L.spotify === 0, L.spotify + ' Anfragen');

  // 3) Spotify-Reiter zeigt die Regel-Warnung
  await p.click('#srZurMenue'); await p.waitForTimeout(400);
  await p.click('[data-netz="spotify"]'); await p.waitForTimeout(400);
  ck('Spotify-Reiter warnt: keine Quiz-Spiele erlaubt', /Spotify erlaubt keine Quiz-Spiele/.test(await p.evaluate(() => document.querySelector('.sp-box').innerText)));
  await p.evaluate(() => document.querySelector('.sp-box').scrollIntoView());
  await p.screenshot({ path: ordner + '/dz-spotify-warnung.png' });
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
