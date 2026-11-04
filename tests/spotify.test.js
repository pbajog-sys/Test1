// Spotify im Song-Rätsel – gegen ein NACHGEBAUTES Spotify (Anmeldung, Bibliothek, Wiedergabe), nicht gegen das echte.
// Prüft: PKCE (Challenge = SHA-256 des Verifiers), Token-Tausch, Titel laden, Ausschnittlänge, 5 Runden = 50/50,
// Verlauf, „kein Gerät“-Hinweis, abgelaufene Anmeldung.
// Aufruf: python3 -m http.server 8765, dann  node tests/spotify.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const crypto = require('crypto');
const ordner = process.argv[2] || '.';
const b64 = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const TITEL = Array.from({ length: 12 }, (_, i) => ({ type: 'track', uri: 'spotify:track:t' + i, name: 'Testsong ' + (i + 1), artists: [{ name: 'Band ' + String.fromCharCode(65 + i) }], duration_ms: 200000, album: { images: [] } }));

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const S = { challenge: null, pkceOk: null, geraete: true, abgelaufen: false, play: null, plays: [], pausen: [] };
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
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (S.abgelaufen) return j({ error: { status: 401, message: 'The access token expired' } }, 401);
    if (u.pathname === '/v1/me/top/tracks') return j({ items: TITEL.slice(0, 6) });
    if (u.pathname === '/v1/me/tracks') return j({ items: TITEL.slice(4).map((t) => ({ track: t })), next: null });
    if (u.pathname === '/v1/me/player/devices') return j({ devices: S.geraete ? [{ id: 'dev1', name: 'iPhone', is_active: false, is_restricted: false }] : [] });
    if (u.pathname === '/v1/me/player/play') { const x = JSON.parse(req.postData()); S.play = { uri: x.uris[0], pos: x.position_ms, t: Date.now() + 250 }; S.plays.push(S.play); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
    if (u.pathname === '/v1/me/player/pause') { if (S.play) { S.pausen.push(Date.now() - S.play.t); S.play = null; } return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
    if (u.pathname === '/v1/me/player') {   // simulierte 250 ms Startverzögerung
      if (!S.play || Date.now() < S.play.t) return j({ is_playing: false, progress_ms: 0, item: null });
      return j({ is_playing: true, progress_ms: S.play.pos + (Date.now() - S.play.t), item: { uri: S.play.uri } });
    }
    return j({ error: { message: 'unbekannt ' + u.pathname } }, 404);
  });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  await p.click('#hubToene'); await p.waitForTimeout(300); await p.click('[data-song="weiter"]'); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.sp-box').scrollIntoView());
  await p.screenshot({ path: ordner + '/sp-einrichten.png' });
  ck('Redirect-URI wird angezeigt', (await p.textContent('#spUri')) === 'http://localhost:8765/');
  await p.fill('#spId', 'falsch'); await p.click('#spVerbinden');
  ck('Falsche Client ID wird abgelehnt', await p.evaluate(() => $('spId').classList.contains('falsch')));
  await p.fill('#spId', '0123456789abcdef0123456789abcdef'); await p.click('#spVerbinden');
  await p.waitForSelector('#spLos', { timeout: 10000 });
  ck('PKCE: Challenge passt zum Verifier, Code getauscht', S.pkceOk === true);
  ck('Rechte: nur Bibliothek lesen + Wiedergabe steuern', S.scope === 'user-library-read user-top-read user-read-playback-state user-modify-playback-state', S.scope);
  ck('Adresszeile wieder sauber (kein ?code=)', !/code=/.test(p.url()), p.url());
  await p.evaluate(() => document.querySelector('.sp-box').scrollIntoView());
  await p.screenshot({ path: ordner + '/sp-verbunden.png' });

  await p.click('#spLos');
  for (let i = 0; i < 5; i++) {
    await p.waitForSelector('.sp-optionen [data-o]', { timeout: 10000 });
    await p.waitForFunction(() => sp && sp.runden[sp.i].gehoert === 1, null, { timeout: 5000 });
    await p.waitForTimeout(4900);   // Ausschnitt (4 s) ablaufen lassen
    if (i === 0) await p.screenshot({ path: ordner + '/sp-runde.png' });
    const k = await p.evaluate(() => { const R = sp.runden[sp.i]; return R.optionen.indexOf(R.T); });
    await p.click('[data-o="' + k + '"]'); await p.waitForTimeout(150);
    await p.click('#srWeiter');
  }
  await p.waitForTimeout(300);
  const ende = await p.evaluate(() => $('ton-song').innerText);
  ck('5 Runden richtig = 50/50', /50 \/ 50/.test(ende), ende.split('\n')[1]);
  const laengen = S.pausen.slice(0, 5);
  ck('Ausschnitt dauert ≈ 4 s (Startverzögerung nicht mitgezählt)', laengen.length === 5 && laengen.every((x) => x > 3700 && x < 4500), laengen.join(', ') + ' ms');
  ck('Leicht: immer vom Songanfang', S.plays.slice(0, 5).every((x) => x.pos === 0));
  ck('5 verschiedene Songs', new Set(S.plays.slice(0, 5).map((x) => x.uri)).size === 5);
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).some((e) => e.s === 'toene' && e.x && e.x.modus === 'song-spotify'));
  ck('Verlaufseintrag', vl);

  // kein Gerät
  S.geraete = false;
  await p.click('#srZurMenue'); await p.waitForTimeout(300); await p.click('#spLos'); await p.waitForTimeout(800);
  ck('Ohne Gerät: Hinweis „Spotify-App öffnen“', /Kein Spotify-Gerät/.test(await p.evaluate(() => $('ton-song').innerText)));
  // abgelaufene Anmeldung (Refresh schlägt auch fehl → neu verbinden)
  S.geraete = true; S.abgelaufen = true;
  await p.evaluate(() => { const s = loadJson(SP_KEY); s.titel = null; saveJson(SP_KEY, s); });
  await p.click('#spNochmal'); await p.waitForTimeout(800);
  ck('Abgelaufen: Hinweis zum neu Verbinden', /abgelaufen/.test(await p.evaluate(() => $('ton-song').innerText)));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
