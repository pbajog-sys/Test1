// Spielstand-Sync mit Konto: echter Spielstand-Server (werkzeuge/homeserver/spielstand-server.js) hinter einem
// nachgebauten Caddy (statische Dateien + /api/ weitergeleitet). Mehrere Geräte und Personen:
// Registrieren, Name schon vergeben, falsche PIN, Sperre, Anmeldung bleibt gespeichert, Abgleich hin und zurück,
// Konflikt, zweite Person getrennt, „Ohne Konto spielen“, und ohne Server (GitHub Pages) passiert nichts.
// Aufruf: node tests/sync.test.js   (startet alles selbst auf Port 8766/8768)
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { erstelleServer } = require('../werkzeuge/homeserver/spielstand-server.js');
const WURZEL = path.join(__dirname, '..');
const DATEN = fs.mkdtempSync(path.join(os.tmpdir(), 'spielekiste-sync-'));
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

let apiAn = true;
const api = erstelleServer({ daten: DATEN });
const caddy = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) {
    if (!apiAn) { res.writeHead(404); return res.end(); }
    const p = http.request({ host: '127.0.0.1', port: 8768, path: req.url, method: req.method, headers: { ...req.headers, 'x-forwarded-for': '203.0.113.7' } }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    return req.pipe(p);
  }
  let datei = path.join(WURZEL, decodeURIComponent(u.pathname));
  if (datei.endsWith('/')) datei += 'index.html';
  fs.readFile(datei, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' }); res.end(data);
  });
});

(async () => {
  await new Promise((ok) => api.listen(8768, '127.0.0.1', ok));
  await new Promise((ok) => caddy.listen(8766, ok));
  const URL_ = 'http://localhost:8766/';
  const b = await chromium.launch();
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const fehler = [];
  const geraet = async (name, antwort = { wert: true }) => {
    const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
    await ctx.addInitScript(() => { localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => fehler.push(name + ': ' + e.message));
    p.dialogs = [];
    p.on('dialog', (d) => { p.dialogs.push(d.message()); antwort.wert ? d.accept() : d.dismiss(); });
    p.antwort = antwort;
    return p;
  };
  const ruhig = (p, ms = 1200) => p.waitForTimeout(ms);
  const stand = (name) => { try { return JSON.parse(fs.readFileSync(path.join(DATEN, 'staende', name + '.json'), 'utf8')); } catch (e) { return null; } };
  const lesen = (p, k) => p.evaluate((k) => localStorage.getItem(k), k);
  const setzen = (p, k, v) => p.evaluate(([k, v]) => localStorage.setItem(k, v), [k, v]);
  const abgleich = async (p) => { await p.evaluate(() => syAbgleich()).catch(() => {}); await ruhig(p); };
  const dialogDa = (p) => p.isVisible('#syNameFeld').catch(() => false);
  const eingeben = async (p, name, pin, knopf) => {
    await p.fill('#syNameFeld', name); await p.fill('#syPinFeld', pin);
    await p.click(knopf === 'neu' ? '#syRegistrieren' : '#syAnmelden'); await ruhig(p, 1500);
  };
  const meldung = (p) => p.textContent('#syMeldung').catch(() => '');

  // ---------- A: erster Besuch, registriert „Anna“ und nimmt den vorhandenen Spielstand mit ----------
  const A = await geraet('A');
  await A.goto(URL_); await ruhig(A, 1500);
  await setzen(A, 'walquiz.farben.v1', JSON.stringify({ rekord: 7 }));
  ck('A: Anmelde-Dialog beim ersten Besuch', await dialogDa(A));
  await A.screenshot({ path: path.join(os.tmpdir(), 'sync-anmelden.png') });
  await eingeben(A, 'Anna', '1234', 'neu');
  ck('A: Konto angelegt, Dialog zu, ☁️ sichtbar', !(await dialogDa(A)) && (await A.textContent('#syncBtn')) === '☁️');
  ck('A: Spielstand hochgeladen (Version 1)', stand('anna') && stand('anna').version === 1 && stand('anna').daten['walquiz.farben.v1'] === '{"rekord":7}');
  ck('PIN nicht im Klartext gespeichert', !fs.readFileSync(path.join(DATEN, 'konten.json'), 'utf8').includes('1234'));
  ck('Tageskopie angelegt', fs.readdirSync(path.join(DATEN, 'archiv')).some((f) => /^anna-\d{4}-\d\d-\d\d\.json$/.test(f)));
  await A.reload(); await ruhig(A, 1500);
  ck('A: nach Neuladen weiter angemeldet, kein Dialog', !(await dialogDa(A)) && (await A.textContent('#syncBtn')) === '☁️');

  // ---------- B: zweites Gerät von Anna ----------
  const B = await geraet('B');
  await B.goto(URL_); await ruhig(B, 1500);
  await eingeben(B, 'anna', '1234', 'neu');
  ck('B: Name schon vergeben (auch in Kleinschreibung)', /gibt es schon/.test(await meldung(B)));
  await eingeben(B, 'Anna', '9999');
  ck('B: falsche PIN → Fehlermeldung', /stimmt nicht/.test(await meldung(B)));
  await eingeben(B, 'Anna', '1234'); await ruhig(B, 1500);
  ck('B: angemeldet und Stand von A übernommen', (await lesen(B, 'walquiz.farben.v1')) === '{"rekord":7}');
  ck('B: keine Konflikt-Frage', B.dialogs.length === 0, B.dialogs.join(' | '));

  // ---------- Hin und zurück ----------
  await setzen(B, 'walquiz.farben.v1', JSON.stringify({ rekord: 12 })); await abgleich(B);
  ck('B: neue Version hochgeladen', stand('anna').version === 2 && stand('anna').daten['walquiz.farben.v1'] === '{"rekord":12}', 'v' + stand('anna').version);
  await abgleich(A); await ruhig(A, 1500);
  ck('A: holt Stand von B', (await lesen(A, 'walquiz.farben.v1')) === '{"rekord":12}' && A.dialogs.length === 0);
  await abgleich(A); await abgleich(B);
  ck('Ohne Änderungen bleibt die Version gleich', stand('anna').version === 2);

  // ---------- Konflikt ----------
  await setzen(B, 'walquiz.takt.v1', '"B-Runde"'); await abgleich(B);
  await setzen(A, 'walquiz.punkte.v1', '"A-Runde"');
  await abgleich(A); await ruhig(A, 1500);
  ck('Konflikt: A wird gefragt und übernimmt den Stand von B', A.dialogs.length === 1 && (await lesen(A, 'walquiz.takt.v1')) === '"B-Runde"' && (await lesen(A, 'walquiz.punkte.v1')) === null);
  const konf = fs.readdirSync(path.join(DATEN, 'konflikte'));
  ck('Konflikt: Stand von A auf dem Server aufgehoben', konf.some((f) => f.startsWith('anna-') && JSON.parse(fs.readFileSync(path.join(DATEN, 'konflikte', f), 'utf8')).daten['walquiz.punkte.v1'] === '"A-Runde"'), konf.join(','));

  // ---------- Zweite Person ----------
  const C = await geraet('C');
  await C.goto(URL_); await ruhig(C, 1500);
  await setzen(C, 'walquiz.zahlen.v1', '"Ben"');
  await eingeben(C, 'Ben', '4321', 'neu');
  ck('C: zweite Person „Ben“ hat eigenen Stand', stand('ben') && stand('ben').daten['walquiz.zahlen.v1'] === '"Ben"' && !('walquiz.zahlen.v1' in stand('anna').daten));
  const res409 = await C.evaluate(async () => (await fetch('api/stand', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ basis: 0, daten: {} }) })).status);
  ck('Server lehnt veraltete Version ab (409)', res409 === 409);
  const fremd = await C.evaluate(async () => (await fetch('api/stand')).json());
  ck('Ben sieht nur seinen eigenen Stand', fremd.daten && !('walquiz.farben.v1' in fremd.daten));

  // ---------- Sperre nach 5 falschen PINs ----------
  const E = await geraet('E');
  await E.goto(URL_); await ruhig(E, 1500);
  for (let i = 0; i < 5; i++) await eingeben(E, 'Ben', '0000');
  await eingeben(E, 'Ben', '4321');
  ck('Nach 5 falschen PINs gesperrt – auch die richtige PIN geht erst später', /gesperrt/.test(await meldung(E)), await meldung(E));

  // ---------- Ohne Konto spielen ----------
  const D = await geraet('D');
  await D.goto(URL_); await ruhig(D, 1500);
  await D.click('#sySpaeter'); await ruhig(D, 500);
  await D.reload(); await ruhig(D, 1500);
  ck('„Ohne Konto spielen“: kein Dialog mehr, 👤 zum späteren Anmelden', !(await dialogDa(D)) && (await D.textContent('#syncBtn')) === '👤');

  // ---------- Abmelden ----------
  await B.evaluate(() => syKontoDialog()); await ruhig(B, 300); await B.click('#syAbmelden'); await ruhig(B, 800);
  await B.reload(); await ruhig(B, 1500);
  ck('Abmelden: danach nicht mehr angemeldet', (await B.textContent('#syncBtn')) === '👤');

  // ---------- Ohne Server (z. B. GitHub Pages) ----------
  apiAn = false;
  const F = await geraet('F');
  await F.goto(URL_); await ruhig(F, 1500);
  ck('Ohne Server: kein Dialog, kein Knopf', !(await dialogDa(F)) && !(await F.isVisible('#syncBtn').catch(() => false)));

  ck('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));
  await b.close(); caddy.close(); api.close();
  fs.rmSync(DATEN, { recursive: true, force: true });
  const ok = checks.filter((c) => c[1]).length;
  console.log(`\n${ok}/${checks.length} Prüfungen bestanden`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
