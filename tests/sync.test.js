// Spielstand-Sync mit Konto: echter Spielstand-Server (werkzeuge/homeserver/spielstand-server.js) hinter einem
// nachgebauten Caddy (statische Dateien + /api/ weitergeleitet). Mehrere Geräte und Personen:
// Registrieren, Name schon vergeben, falsche PIN, Sperre, Anmeldung bleibt gespeichert, Abgleich hin und zurück,
// Zusammenführen ohne Rückfrage (pro Eintrag), altes Gerät überschreibt nichts, nur Änderungen übertragen, zweite Person getrennt, „Ohne Konto spielen“, und ohne Server (GitHub Pages) passiert nichts.
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
  const wert = (name, k) => { const st = stand(name); return st && st.eintraege[k] ? st.eintraege[k].v : undefined; };
  const abgleich = async (p) => { await p.evaluate(() => syAbgleich()).catch(() => {}); await ruhig(p); };                                   // nach dem Spielen
  const zurueck = async (p) => { await p.evaluate(() => syAbgleich({ alt: true, ladenErlaubt: true })).catch(() => {}); await ruhig(p, 1800); };   // App wieder geöffnet
  let antworten = [];
  caddy.on('request', (req, res) => {
    if (req.url !== '/api/abgleich') return;
    let n = 0; const schreib = res.write.bind(res), ende = res.end.bind(res);
    res.write = (c, ...r) => { if (c) n += c.length; return schreib(c, ...r); };
    res.end = (c, ...r) => { if (c && typeof c !== 'function') n += c.length; antworten.push(n); return ende(c, ...r); };
  });
  const dialogDa = (p) => p.isVisible('#syNameFeld').catch(() => false);
  const eingeben = async (p, name, pin, knopf) => {
    await p.fill('#syNameFeld', name); await p.fill('#syPinFeld', pin);
    await p.click(knopf === 'neu' ? '#syRegistrieren' : '#syAnmelden'); await ruhig(p, 1500);
  };
  const meldung = (p) => p.textContent('#syMeldung').catch(() => '');
  const D0 = async () => (await fetch('http://localhost:8766/api/bestenliste')).status;

  // ---------- A: erster Besuch, registriert „Anna“ und nimmt den vorhandenen Spielstand mit ----------
  const A = await geraet('A');
  await A.goto(URL_); await ruhig(A, 1500);
  await setzen(A, 'walquiz.farben.v1', JSON.stringify({ rekord: 7 }));
  ck('A: Anmelde-Dialog beim ersten Besuch', await dialogDa(A));
  await A.screenshot({ path: path.join(os.tmpdir(), 'sync-anmelden.png') });
  await eingeben(A, 'Anna', '1234', 'neu');
  ck('A: Konto angelegt, Dialog zu, ☁️ sichtbar', !(await dialogDa(A)) && (await A.textContent('#syncBtn')) === '☁️');
  ck('A: Spielstand hochgeladen (Version 1)', stand('anna') && stand('anna').version === 1 && wert('anna', 'walquiz.farben.v1') === '{"rekord":7}');
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

  // ---------- Hin und zurück, ohne Rückfrage ----------
  await setzen(B, 'walquiz.farben.v1', JSON.stringify({ rekord: 12 })); await abgleich(B);
  ck('B: Runde hochgeladen', wert('anna', 'walquiz.farben.v1') === '{"rekord":12}', 'v' + stand('anna').version);
  await zurueck(A);
  ck('A: holt beim Zurückkehren den Stand von B', (await lesen(A, 'walquiz.farben.v1')) === '{"rekord":12}');
  const vA = stand('anna').version; antworten = [];
  await zurueck(A); await zurueck(B); await abgleich(A); await abgleich(B);
  ck('Ohne Änderungen: Version gleich, nur winzige Antworten', stand('anna').version === vA && antworten.every((n) => n < 40), antworten.join(',') + ' Bytes');

  // ---------- Beide Geräte spielen: wird zusammengeführt, keine Frage ----------
  await setzen(B, 'walquiz.takt.v1', '"B-Runde"'); await abgleich(B);
  await setzen(A, 'walquiz.punkte.v1', '"A-Runde"'); antworten = []; await abgleich(A);
  ck('Nach einer Runde: Antwort enthält nur die Änderung von B', antworten.length === 1 && antworten[0] < 200, antworten.join(',') + ' Bytes');
  ck('A: mitten im Spiel nicht neu geladen', (await lesen(A, 'walquiz.takt.v1')) === null);
  await zurueck(A); await zurueck(B);
  ck('Zusammengeführt: beide Geräte haben beide Runden', (await lesen(A, 'walquiz.takt.v1')) === '"B-Runde"' && (await lesen(A, 'walquiz.punkte.v1')) === '"A-Runde"' && (await lesen(B, 'walquiz.punkte.v1')) === '"A-Runde"' && (await lesen(B, 'walquiz.takt.v1')) === '"B-Runde"');
  ck('Keine einzige Rückfrage', A.dialogs.length === 0 && B.dialogs.length === 0, A.dialogs.concat(B.dialogs).join(' | '));

  // ---------- Altes Gerät (lange nicht benutzt) überschreibt keinen neueren Fortschritt ----------
  await B.evaluate(() => { syZustand = 'aus'; });                       // B „liegt in der Schublade“
  await setzen(A, 'walquiz.farben.v1', JSON.stringify({ rekord: 30 })); await abgleich(A);
  await setzen(B, 'walquiz.farben.v1', JSON.stringify({ rekord: 5 }));   // alter Kram beim Öffnen von B
  await B.evaluate(() => { syZustand = 'ok'; });
  await zurueck(B);
  ck('Altes Gerät: neuer Rekord vom anderen Gerät bleibt und kommt auch auf B an', wert('anna', 'walquiz.farben.v1') === '{"rekord":30}' && (await lesen(B, 'walquiz.farben.v1')) === '{"rekord":30}');
  await setzen(A, 'walquiz.zahlen.v1', '"neu"'); await A.evaluate(() => localStorage.removeItem('walquiz.takt.v1')); await abgleich(A);
  await zurueck(B);
  ck('Löschen kommt auch an', (await lesen(B, 'walquiz.takt.v1')) === null && (await lesen(B, 'walquiz.zahlen.v1')) === '"neu"');

  // ---------- Nur öffnen, nicht spielen: anderes Gerät soll deswegen nicht neu laden ----------
  await zurueck(A); await zurueck(B);
  let neuGeladen = 0; B.on('framenavigated', (f) => { if (f === B.mainFrame()) neuGeladen++; });
  await A.reload(); await ruhig(A, 2000);           // App auf A nur geöffnet
  await zurueck(B);
  const geaendertBeimOeffnen = await A.evaluate(() => Object.keys(syAenderungen(syDaten(), false)));
  ck('Nur öffnen auf A: B lädt nicht neu', neuGeladen === 0, 'beim Öffnen geschrieben: ' + (geaendertBeimOeffnen.join(', ') || 'nichts'));

  // ---------- Zweite Person ----------
  const C = await geraet('C');
  await C.goto(URL_); await ruhig(C, 1500);
  await setzen(C, 'walquiz.zahlen.v1', '"Ben"');
  await eingeben(C, 'Ben', '4321', 'neu');
  ck('C: zweite Person „Ben“ hat eigenen Stand', wert('ben', 'walquiz.zahlen.v1') === '"Ben"' && wert('anna', 'walquiz.zahlen.v1') === '"neu"');
  const fremd = await C.evaluate(async () => (await fetch('api/abgleich', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ basis: 0, aenderungen: {} }) })).json());
  ck('Ben sieht nur seinen eigenen Stand', fremd.neu && fremd.neu['walquiz.zahlen.v1'] === '"Ben"' && !('walquiz.farben.v1' in fremd.neu));
  const schlecht = await C.evaluate(async () => (await fetch('api/abgleich', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ basis: 0, aenderungen: { 'fremd.x': { v: 'x' } } }) })).status);
  ck('Server nimmt nur Spieldaten an', schlecht === 400);

  // ---------- Bestenliste ----------
  const heute = new Date().toISOString().slice(0, 10);
  await setzen(A, 'walquiz.verlauf.v1', JSON.stringify({ tage: { [heute]: [{ s: 'farben', p: 9, m: 10, z: Date.now() }, { s: 'krimi', p: 1, m: 1, z: Date.now() + 1 }] } }));
  await abgleich(A); await abgleich(C);
  const liste = await C.evaluate(async () => (await fetch('api/bestenliste')).json());
  ck('Bestenliste: beide Konten, nach XP sortiert, „ich“ markiert', liste.length === 2 && liste[0].name === 'Anna' && liste[0].xp > liste[1].xp && liste[1].ich === true && !liste[0].ich, liste.map((e) => e.name + ' ' + e.xp + 'XP L' + e.level).join(' · '));
  ck('Bestenliste: nur Zusammenfassung, kein Spielstand', !JSON.stringify(liste).includes('walquiz.'));
  await C.evaluate(() => { document.getElementById('profilWahl') && (document.getElementById('profilWahl').hidden = true); syBestenliste(true); }); await ruhig(C, 800);
  ck('Bestenliste im Dashboard sichtbar, eigener Eintrag mit „(du)“', /Anna/.test(await C.textContent('#syBestenliste')) && /Ben \(du\)/.test(await C.textContent('#syBestenliste')));
  await C.locator('#syBestenliste').scrollIntoViewIfNeeded(); await C.screenshot({ path: path.join(os.tmpdir(), 'sync-bestenliste.png') });
  await C.click('#syBestenliste [data-vgl="0"]'); await ruhig(C, 800);
  ck('📊 öffnet den Radar-Vergleich mit Anna', /Anna \(Level/.test(await C.textContent('.sk-legende').catch(() => '')));
  await C.screenshot({ path: path.join(os.tmpdir(), 'sync-vergleich.png') });
  const ohne = await D0();
  ck('Bestenliste nur für Angemeldete', ohne === 401);

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
