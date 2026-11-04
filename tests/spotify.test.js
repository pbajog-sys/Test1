// Spotify im Song-Rätsel – gegen ein NACHGEBAUTES Spotify (Anmeldung, Suche, Bibliothek, Wiedergabe), nicht gegen das echte.
// Prüft: PKCE, Token-Tausch, Kategorie-Suche (80er Pop = genre:pop year:1980-1989), Hits vs. Unbekanntes (Offsets),
// Ausschnittlänge, „Titel erkennen“ und „Jahr schätzen“ (je 50/50), „Wie meine Favoriten“, Verlauf, Fehlerfälle.
// Aufruf: python3 -m http.server 8765, dann  node tests/spotify.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const crypto = require('crypto');
const ordner = process.argv[2] || '.';
const b64 = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const BIB = Array.from({ length: 12 }, (_, i) => ({ type: 'track', uri: 'spotify:track:b' + i, name: 'Lieblingssong ' + (i + 1), artists: [{ name: 'Band ' + String.fromCharCode(65 + i) }], duration_ms: 200000, album: { release_date: String(1990 + i), images: [] } }));
// Suche: Treffer hängen von q und offset ab; Jahr liegt im angefragten Bereich
function suchTreffer(q, off) {
  const y = /year:(\d{4})(?:-(\d{4}))?/.exec(q), von = y ? +y[1] : 1975, bis = y ? +(y[2] || y[1]) : 2020, kuenstler = /artist:"([^"]+)"/.exec(q);
  return Array.from({ length: 10 }, (_, i) => {
    const n = off + i;
    return { type: 'track', uri: 'spotify:track:' + crypto.createHash('md5').update(q + n).digest('hex').slice(0, 12), name: (kuenstler ? kuenstler[1] + ' Song ' : 'Treffer ') + n + (n % 7 === 0 ? ' - Remastered 2011' : ''), artists: [{ name: kuenstler ? kuenstler[1] : 'Künstler ' + n }], duration_ms: 210000, album: { release_date: (von + (n % (bis - von + 1))) + '-01-01', images: [] } };
  });
}

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const S = { challenge: null, pkceOk: null, geraete: true, abgelaufen: false, play: null, plays: [], pausen: [], suchen: [] };
  await ctx.route('https://accounts.spotify.com/**', async (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/authorize') {
      S.challenge = u.searchParams.get('code_challenge'); S.scope = u.searchParams.get('scope'); S.redirect = u.searchParams.get('redirect_uri');
      return route.fulfill({ status: 302, headers: { location: S.redirect + '?code=testcode&state=' + u.searchParams.get('state') } });
    }
    const body = new URLSearchParams(route.request().postData() || '');
    if (body.get('grant_type') === 'authorization_code') S.pkceOk = b64(crypto.createHash('sha256').update(body.get('code_verifier')).digest()) === S.challenge && body.get('code') === 'testcode';
    return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'application/json', body: JSON.stringify({ access_token: 'tok', expires_in: 3600, refresh_token: 'ref' }) });
  });
  await ctx.route('https://api.spotify.com/**', async (route) => {
    const req = route.request(), u = new URL(req.url()), j = (x, st = 200) => route.fulfill({ status: st, headers: { 'access-control-allow-origin': '*' }, contentType: 'application/json', body: JSON.stringify(x) });
    const leer = () => route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (S.abgelaufen) return j({ error: { status: 401, message: 'The access token expired' } }, 401);
    if (u.pathname === '/v1/search') { const q = u.searchParams.get('q'), off = +u.searchParams.get('offset'); S.suchen.push({ q, off, limit: +u.searchParams.get('limit'), market: u.searchParams.get('market') }); return j({ tracks: { items: suchTreffer(q, off) } }); }
    if (u.pathname === '/v1/me/top/artists') return j({ items: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map((n) => ({ name: n })) });
    if (u.pathname === '/v1/me/top/tracks') return j({ items: BIB.slice(0, 6) });
    if (u.pathname === '/v1/me/tracks') return j({ items: BIB.slice(4).map((t) => ({ track: t })), next: null });
    if (u.pathname === '/v1/me/player/devices') return j({ devices: S.geraete ? [{ id: 'dev1', name: 'iPhone', is_active: false, is_restricted: false }] : [] });
    if (u.pathname === '/v1/me/player/play') { const x = JSON.parse(req.postData()); S.play = { uri: x.uris[0], pos: x.position_ms, t: Date.now() + 250 }; S.plays.push(S.play); return leer(); }
    if (u.pathname === '/v1/me/player/pause') { if (S.play) { S.pausen.push(Date.now() - S.play.t); S.play = null; } return leer(); }
    if (u.pathname === '/v1/me/player') {   // simulierte 250 ms Startverzögerung
      if (!S.play || Date.now() < S.play.t) return j({ is_playing: false, progress_ms: 0, item: null });
      return j({ is_playing: true, progress_ms: S.play.pos + (Date.now() - S.play.t), item: { uri: S.play.uri } });
    }
    return j({ error: { message: 'unbekannt ' + u.pathname } }, 404);
  });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const runde = async (modus, i) => {
    await p.waitForSelector(modus === 'jahr' ? '#spJahrOk' : '.sp-optionen [data-o]', { timeout: 10000 });
    await p.waitForFunction(() => sp && sp.runden[sp.i].gehoert === 1, null, { timeout: 5000 });
    return p.evaluate(() => { const R = sp.runden[sp.i]; return { k: R.optionen.indexOf(R.T), jahr: R.T.jahr, name: R.T.name }; });
  };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  await p.click('#hubSongs'); await p.waitForTimeout(900);
  await p.click('[data-netz="spotify"]'); await p.waitForTimeout(400);
  ck('Spotify-Reiter warnt vor Spotifys Quiz-Verbot', /Spotify erlaubt keine Quiz-Spiele/.test(await p.evaluate(() => document.querySelector('.sp-box').innerText)));
  await p.evaluate(() => document.querySelector('.sp-box').scrollIntoView());
  await p.screenshot({ path: ordner + '/sp-einrichten.png' });
  ck('Redirect-URI wird angezeigt', (await p.textContent('#spUri')) === 'http://localhost:8765/');
  await p.fill('#spId', 'falsch'); await p.click('#spVerbinden');
  ck('Falsche Client ID wird abgelehnt', await p.evaluate(() => $('spId').classList.contains('falsch')));
  await p.fill('#spId', '0123456789abcdef0123456789abcdef'); await p.click('#spVerbinden');
  await p.waitForSelector('#spLos', { timeout: 10000 });
  ck('PKCE: Challenge passt zum Verifier, Code getauscht', S.pkceOk === true);
  ck('Rechte: nur Bibliothek lesen + Wiedergabe steuern', S.scope === 'user-library-read user-top-read user-read-playback-state user-modify-playback-state', S.scope);
  ck('Nach Anmeldung wieder im Song-Rätsel, Adresse sauber', !/code=/.test(p.url()) && await p.evaluate(() => $('screen-songs').classList.contains('active')), p.url());
  await p.screenshot({ path: ordner + '/sp-verbunden.png', fullPage: true });

  // 1) Titel erkennen · 80er Pop · große Hits · Leicht
  await p.click('#spLos');
  for (let i = 0; i < 5; i++) {
    const R = await runde('titel', i);
    await p.waitForTimeout(4700);
    if (i === 0) await p.screenshot({ path: ordner + '/sp-runde.png' });
    await p.click('[data-o="' + R.k + '"]'); await p.waitForTimeout(150);
    if (i === 0) await p.screenshot({ path: ordner + '/sp-aufloesung.png' });
    await p.click('#srWeiter');
  }
  await p.waitForTimeout(300);
  let ende = await p.evaluate(() => $('ton-song').innerText);
  ck('Titel erkennen: 5 richtig = 50/50', /50 \/ 50/.test(ende), ende.split('\n')[1]);
  await p.screenshot({ path: ordner + '/sp-ende.png', fullPage: true });
  const su = S.suchen.slice();
  ck('80er Pop sucht „genre:pop year:1980-1989“, limit 10, market=from_token', su.length >= 6 && su.every((x) => x.q === 'genre:pop year:1980-1989' && x.limit === 10 && x.market === 'from_token'), su.length + ' Suchen');
  ck('Große Hits: nur vordere Treffer (Offset ≤ 90)', su.every((x) => x.off <= 90), su.map((x) => x.off).join(','));
  const lj = await p.evaluate(() => sp.runden.map((R) => R.T.jahr + ' ' + R.T.name));
  ck('Alle Songs aus den 80ern', lj.every((x) => +x.slice(0, 4) >= 1980 && +x.slice(0, 4) <= 1989), lj.join(' | '));
  ck('„Remastered 2011“ aus Titeln entfernt', await p.evaluate(() => sp.runden.every((R) => R.optionen.every((T) => !/Remaster/.test(T.name)))));
  const laengen = S.pausen.slice(0, 5);
  ck('Ausschnitt dauert ≈ 4 s (Startverzögerung nicht mitgezählt)', laengen.length === 5 && laengen.every((x) => x > 3700 && x < 4500), laengen.join(', ') + ' ms');

  // 2) Jahr schätzen · Rock-Klassiker · Auch Unbekanntes · Mittel
  await p.click('#srZurMenue'); await p.waitForTimeout(400);
  await p.click('[data-spm="jahr"]'); await p.waitForTimeout(300);
  await p.click('[data-kat="rock"]'); await p.waitForTimeout(300);
  await p.click('[data-hits="0"]'); await p.waitForTimeout(300);
  await p.click('[data-s="mittel"]'); await p.waitForTimeout(400);
  S.suchen = [];
  await p.click('#spLos');
  for (let i = 0; i < 5; i++) {
    const R = await runde('jahr', i);
    await p.waitForTimeout(2600);
    await p.evaluate((j) => { const r = $('spJahr'); r.value = j; r.dispatchEvent(new Event('input')); }, R.jahr);
    if (i === 0) await p.screenshot({ path: ordner + '/sp-jahr.png' });
    await p.click('#spJahrOk'); await p.waitForTimeout(150);
    if (i === 0) await p.screenshot({ path: ordner + '/sp-jahr-urteil.png' });
    await p.click('#srWeiter');
  }
  await p.waitForTimeout(300);
  ende = await p.evaluate(() => $('ton-song').innerText);
  ck('Jahr schätzen: 5× genau = 50/50', /50 \/ 50/.test(ende), ende.split('\n')[1]);
  ck('Rock-Klassiker sucht „genre:rock year:1965-1995“', S.suchen.length >= 6 && S.suchen.every((x) => x.q === 'genre:rock year:1965-1995'));
  ck('Auch Unbekanntes: tiefere Offsets', S.suchen.some((x) => x.off > 90), S.suchen.map((x) => x.off).join(','));
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'songs' && e.x && /^spotify-/.test(e.x.modus)).map((e) => e.x.modus + ':' + e.x.kat));
  ck('Verlauf: zwei Einträge unter „Song-Rätsel“', vl.join(',') === 'spotify-titel:80er,spotify-jahr:rock', vl.join(','));

  // 3) Wie meine Favoriten – sucht nach den Top-Künstlern
  await p.click('#srZurMenue'); await p.waitForTimeout(400);
  await p.click('[data-spm="titel"]'); await p.waitForTimeout(300); await p.click('[data-kat="fav"]'); await p.waitForTimeout(300);
  S.suchen = [];
  await p.click('#spLos'); await runde('titel', 0);
  ck('Favoriten: Suche nach Top-Künstlern', S.suchen.length >= 2 && S.suchen.every((x) => /^artist:"(Alpha|Beta|Gamma|Delta|Epsilon)"$/.test(x.q)), S.suchen.map((x) => x.q).join(' '));

  // 4) kein Gerät / abgelaufene Anmeldung
  S.geraete = false;
  await p.click('#srAppZurueck'); await p.waitForTimeout(400); await p.click('#spLos'); await p.waitForTimeout(800);
  ck('Ohne Gerät: Hinweis „Spotify-App öffnen“', /Kein Spotify-Gerät/.test(await p.evaluate(() => $('ton-song').innerText)));
  S.geraete = true; S.abgelaufen = true;
  await p.click('#spNochmal'); await p.waitForTimeout(800);
  ck('Abgelaufen: Hinweis zum neu Verbinden', /abgelaufen/.test(await p.evaluate(() => $('ton-song').innerText)));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
