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

let apiAn = true, apiFehler = 0;   // apiFehler: so antwortet „Caddy“, wenn der Konto-Server dahinter fehlt (502)
// Admin „Anna“; statt der Windows-Aufgabe schreibt ein Platzhalter nach kurzer Zeit „Fertig“ ins Update-Protokoll
let updatesGestartet = 0;
fs.writeFileSync(path.join(DATEN, 'version.txt'), 'aaaaaaa1111\n');
// GitHub-Platzhalter: neueste Version „bbbbbbb…“ mit zwei Änderungen seit „aaaaaaa…“
const github = async (pfad) => {
  if (pfad.startsWith('/commits/')) return { sha: 'bbbbbbb2222', commit: { message: 'Duelle\n\nDetails' } };
  if (pfad.startsWith('/compare/')) return { ahead_by: 2, commits: [{ commit: { message: 'Bestenliste' } }, { commit: { message: 'Duelle' } }] };
  throw new Error('unbekannt');
};
// Erweiterungen-Platzhalter: statt PowerShell „installiert“ er nach kurzer Zeit AdGuard
let erweiterungAufruf = null, adguardLaeuft = false; const aktionen = [];
fs.writeFileSync(path.join(DATEN, 'caddy.log'), 'zeile 1\nCaddy-Testzeile\n');
fs.mkdirSync(path.join(DATEN, 'spiel', 'werkzeuge', 'homeserver', 'windows', 'erweiterungen'), { recursive: true });
fs.writeFileSync(path.join(DATEN, 'spiel', 'werkzeuge', 'homeserver', 'windows', 'erweiterungen', 'adguard.ps1'), '# Platzhalter');
const erweiterungStarten = (skript, basis, env) => {
  erweiterungAufruf = { skript, basis, env };
  setTimeout(() => { fs.mkdirSync(path.join(DATEN, 'AdGuardHome'), { recursive: true }); fs.writeFileSync(path.join(DATEN, 'AdGuardHome', 'AdGuardHome.exe'), ''); adguardLaeuft = true;
    fs.appendFileSync(path.join(DATEN, 'erweiterungen.log'), '2026-11-19 12:00:00  AdGuard: Fertig: AdGuard Home läuft.\n'); }, 2000);
};
const api = erstelleServer({ daten: path.join(DATEN), basis: DATEN, admin: ['Anna'], github, erweiterungStarten, dnsPruefen: async () => adguardLaeuft, lanIp: () => '192.168.2.42',
  diensteAbfragen: async () => ({ dienste: { Caddy: 'Running', DuckDNS: 'Running', Update: 'Ready', AdGuard: 'fehlt' }, akku: 78, netz: true }),
  aktionStarten: (ps) => { aktionen.push(ps); },
  aufgabeAbfragen: async () => ({ zustand: 'Ready', letzterLauf: '2026-11-19T12:19:00', ergebnis: 2147942402, aktion: 'powershell.exe -File C:\\homeserver\\wachen.ps1' }), updateStarten: async () => {
  updatesGestartet++;
  setTimeout(() => { fs.writeFileSync(path.join(DATEN, 'version.txt'), 'bbbbbbb2222\n'); fs.appendFileSync(path.join(DATEN, 'update.log'), '2026-11-18 22:00:00  Fertig: Version bbbbbbb läuft.\n'); }, 1500);
} });
const caddy = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) {
    if (apiFehler) { res.writeHead(apiFehler); return res.end('Bad Gateway'); }
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
  await setzen(A, 'walquiz.spotify.v1', JSON.stringify({ zugang: 'GEHEIM-TOKEN' })); await abgleich(A);
  ck('Spotify-Zugangsschlüssel bleiben auf dem Gerät (nie auf dem Server)', wert('anna', 'walquiz.spotify.v1') === undefined && !fs.readFileSync(path.join(DATEN, 'staende', 'anna.json'), 'utf8').includes('GEHEIM-TOKEN'));
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
  await ruhig(B, 3200);   // grünes Aufleuchten nach der Anmeldung abwarten (wird absichtlich nicht unterbrochen)
  await setzen(B, 'walquiz.farben.v1', JSON.stringify({ rekord: 12 }));
  const puls = await B.evaluate(async () => { const p = syAbgleich(); await new Promise((r) => setTimeout(r, 30)); const an = document.getElementById('syncBtn').classList.contains('sy-laeuft'); await p; await new Promise((r) => setTimeout(r, 1100)); return [an, document.getElementById('syncBtn').classList.contains('sy-laeuft')]; });
  ck('☁️ pulsiert während des Abgleichs und hört danach auf', puls[0] === true && puls[1] === false, JSON.stringify(puls));
  ck('B: Runde hochgeladen', wert('anna', 'walquiz.farben.v1') === '{"rekord":12}', 'v' + stand('anna').version);
  await zurueck(A);
  const animA = await A.evaluate(() => ({ neu: document.getElementById('syncBtn').classList.contains('sy-neu'), text: !!document.querySelector('.sync-hinweis') }));
  ck('A: holt beim Zurückkehren den Stand von B – ☁️ leuchtet auf, kein Text', (await lesen(A, 'walquiz.farben.v1')) === '{"rekord":12}' && animA.neu && !animA.text, JSON.stringify(animA));
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
  const zeileAnna = await C.textContent('#syBestenliste [data-sp="0"]');
  ck('Zeile zeigt Stärke und Lieblingsspiel', /❤️ 🎨/.test(zeileAnna) && /Lvl 1 · \S+ \S+ \d+/.test(zeileAnna), zeileAnna.replace(/\s+/g, ' ').trim());
  await C.click('#syBestenliste [data-sp="0"]'); await ruhig(C, 600);
  const karte = await C.textContent('#skDlg');
  ck('Detailkarte: Stärken, meistgespielte Spiele, Platz', /Stärken/.test(karte) && /Spielt am meisten/.test(karte) && /Farb-Gedächtnis/.test(karte) && /1\. von 2/.test(karte));
  await C.screenshot({ path: path.join(os.tmpdir(), 'sync-spieler.png') });
  await C.click('#syVgl'); await ruhig(C, 800);
  ck('📊 öffnet den Radar-Vergleich mit Anna', /Anna \(Level/.test(await C.textContent('.sk-legende').catch(() => '')));
  await C.screenshot({ path: path.join(os.tmpdir(), 'sync-vergleich.png') });
  // ---------- Duelle ----------
  // A (Anna) fordert C (Ben) im Farb-Gedächtnis heraus und spielt sofort
  await A.evaluate(() => { document.getElementById('profilWahl') && (document.getElementById('profilWahl').hidden = true); syBestenliste(true); }); await ruhig(A, 600);
  await A.evaluate(() => syDuellWahl('Ben')); await ruhig(A, 300);
  await A.click('[data-dspiel="farben"]'); await ruhig(A, 2500);
  const duellA = await A.evaluate(() => ({ aktiv: JSON.parse(sessionStorage.getItem('spielekiste-duell') || 'null'), seed: fs && fs.seed, farben: JSON.stringify(fs && fs.farben), screen: document.querySelector('.screen.active') && document.querySelector('.screen.active').id }));
  ck('Duell: A spielt sofort Farb-Gedächtnis mit dem Duell-Seed', duellA.aktiv && duellA.seed === duellA.aktiv.seed && /farben/.test(duellA.screen), duellA.screen + ' · ' + duellA.seed);
  await A.evaluate(() => skNachSpiel('farben', 40, 50, '')); await ruhig(A, 2500);
  ck('Duell: Ergebnis von A gespeichert, A wartet', /Warte auf Ben/.test(await A.textContent('#syDuelle').catch(() => '')));
  // C sieht die Herausforderung und spielt exakt dieselbe Runde
  await C.evaluate(() => { localStorage.setItem('spielekiste-duelle-gesehen', '{}'); zeigeHub(); syDuelleLaden(true); }); await ruhig(C, 1500);
  const boxC = await C.textContent('#syDuelle').catch(() => '');
  ck('Duell: C sieht „Anna fordert dich heraus“ mit Ziel', /Anna fordert dich heraus/.test(boxC) && /Ziel: 40/.test(boxC), boxC.replace(/\s+/g, ' ').trim().slice(0, 120));
  await C.screenshot({ path: path.join(os.tmpdir(), 'sync-duelle.png') });
  await C.evaluate(() => document.querySelector('[data-dlos]').click()); await ruhig(C, 2500);
  const duellC = await C.evaluate(() => ({ seed: fs && fs.seed, farben: JSON.stringify(fs && fs.farben), gegner: fs && fs.gegner }));
  ck('Duell: C bekommt genau dieselben Farben wie A', duellC.seed === duellA.seed && duellC.farben === duellA.farben && duellC.gegner && duellC.gegner.punkte === 40);
  await C.evaluate(() => skNachSpiel('farben', 30, 50, '')); await ruhig(C, 2500);
  await A.evaluate(() => syDuelleLaden(true)); await ruhig(A, 1200);
  ck('Duell: Anna gewinnt 40 : 30, Ben verliert', /Gewonnen gegen Ben – 40 : 30/.test(await A.textContent('#syDuelle')) && /Verloren gegen Anna – 30 : 40/.test(await C.textContent('#syDuelle')));
  const bilanzA = await A.evaluate(() => syBilanz.Ben);
  ck('Duell-Bilanz: Anna 1 : 0 gegen Ben', bilanzA && bilanzA.s === 1 && bilanzA.n === 0);
  const nochmal = await C.evaluate(async (id) => (await fetch('api/duell/ergebnis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, p: 99, m: 50 }) })).status, duellA.aktiv.id);
  ck('Duell: Ergebnis nur einmal möglich', nochmal === 409);
  // Ablehnen
  await A.evaluate(async () => { await syApi('duell', 'POST', { gegen: 'Ben', spiel: 'riff' }); });
  await C.evaluate(() => syDuelleLaden(true)); await ruhig(C, 1000);
  await C.evaluate(() => document.querySelector('[data-dweg]').click()); await ruhig(C, 1200);
  await A.evaluate(() => syDuelleLaden(true)); await ruhig(A, 1000);
  ck('Duell ablehnen: A sieht „hat abgelehnt“', /Ben hat abgelehnt/.test(await A.textContent('#syDuelle')));
  // Alle Duell-Spiele starten mit dem Duell-Seed
  const ergebnisse = [];
  for (const spiel of await A.evaluate(() => Object.keys(SY_DUELL_SPIELE))) {
    await A.evaluate(() => zeigeHub());
    await A.evaluate((spiel) => syDuellStarten({ id: 'test-' + spiel, spiel, seed: 'duell-test-' + spiel, gegner: 'Ben' }), spiel); await ruhig(A, 1800);
    ergebnisse.push([spiel, await A.evaluate((spiel) => { try { return SY_DUELL_SPIELE[spiel].stand().seed; } catch (e) { return 'Fehler: ' + e.message; } }, spiel)]);
    await A.evaluate(() => { sessionStorage.removeItem('spielekiste-duell'); try { taktStopp(); } catch (e) {} });
  }
  ck('Alle 9 Duell-Spiele starten mit dem Duell-Seed', ergebnisse.every(([sp, seed]) => seed === 'duell-test-' + sp), ergebnisse.filter(([sp, seed]) => seed !== 'duell-test-' + sp).map((x) => x.join('=')).join(', '));
  const fremdDuell = await C.evaluate(async () => (await fetch('api/duell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gegen: 'Niemand' }) })).status);
  ck('Duell gegen unbekannten Namen abgelehnt', fremdDuell === 400);

  // ---------- Server-Menü (nur Admin) ----------
  ck('Admin: Anna ist Admin, Ben nicht', (await A.evaluate(async () => (await syApi('ich')).json.admin)) === true && (await C.evaluate(async () => (await syApi('ich')).json.admin)) === undefined);
  const benDarf = await C.evaluate(async () => [(await syApi('admin/aktualisieren', 'POST', {})).status, (await syApi('admin/status')).status]);
  ck('Admin: Ben darf weder aktualisieren noch den Status sehen', benDarf[0] === 403 && benDarf[1] === 403 && updatesGestartet === 0);
  ck('Admin: Ben sieht im ☁️-Fenster keinen Server-Bereich', !(await C.evaluate(() => { syKontoDialog(); return !!document.getElementById('syPruefen'); })));
  await C.evaluate(() => document.getElementById('skDlg').close());
  ck('Admin: Ben darf nicht nach Updates fragen', (await C.evaluate(async () => (await syApi('admin/pruefen')).status)) === 403);
  await A.evaluate(() => { syAdmin = true; syKontoDialog(); }); await ruhig(A, 1000);
  ck('Server-Bereich zeigt Zustand der Update-Aufgabe (hier: Skript nicht gefunden)', /Update-Aufgabe: bereit · zuletzt 2026-11-19 12:19 · Ergebnis: Datei nicht gefunden · führt aus: .*wachen\.ps1/.test(await A.textContent('#syServerAufgabe')), await A.textContent('#syServerAufgabe'));
  ck('☁️ (Admin): Server-Bereich mit Version und Konten, „Aktualisieren“ noch versteckt', (await A.textContent('#syServerVersion')) === 'aaaaaaa' && /\d+ · \d+ Duelle/.test(await A.textContent('#syServerKonten')) && !(await A.isVisible('#syServerUpdate')));
  await A.click('#syPruefen'); await ruhig(A, 800);
  ck('Updates prüfen: neue Version mit Liste der Änderungen, „Aktualisieren“ erscheint', /Neue Version bbbbbbb – 2 Änderungen/.test(await A.textContent('#syServerNeu')) && /Duelle/.test(await A.textContent('#syServerNeu')) && (await A.isVisible('#syServerUpdate')), (await A.textContent('#syServerNeu')).replace(/\s+/g, ' '));
  await A.locator('#syPruefen').scrollIntoViewIfNeeded(); await A.screenshot({ path: path.join(os.tmpdir(), 'sync-servermenue.png') });
  await A.click('#syServerUpdate'); await ruhig(A, 7000);
  ck('Aktualisieren: Fortschritt, danach „Fertig – App neu laden“ und neue Version', updatesGestartet === 1 && /Fertig – App neu laden/.test(await A.textContent('#syServerUpdate')) && (await A.textContent('#syServerVersion')) === 'bbbbbbb', await A.textContent('#syServerUpdate'));
  await A.click('#syPruefen'); await ruhig(A, 800);
  ck('Danach prüfen: „Alles aktuell“, kein Aktualisieren-Knopf', /Alles aktuell/.test(await A.textContent('#syServerNeu')) && !(await A.isVisible('#syServerUpdate')));
  // ---------- Erweiterung AdGuard ----------
  const benErw = await C.evaluate(async () => (await syApi('admin/erweiterung', 'POST', { name: 'adguard', passwort: 'sicher12345' })).status);
  const falsch = await A.evaluate(async () => [(await syApi('admin/erweiterung', 'POST', { name: 'adguard', passwort: 'kurz' })).status, (await syApi('admin/erweiterung', 'POST', { name: 'cmd.exe', passwort: 'sicher12345' })).status]);
  ck('Erweiterung: Ben darf nicht, kurzes Passwort und unbekannte Erweiterung abgelehnt', benErw === 403 && falsch[0] === 400 && falsch[1] === 400 && !erweiterungAufruf);
  ck('Erweiterung: AdGuard zunächst „nicht installiert“ mit Passwortfeld', /AdGuard Home/.test(await A.textContent('#syErweiterungen')) && !!(await A.$('#syAgPw')));
  await A.fill('#syAgPw', 'Sicher-1234'); await A.click('#syAgLos'); await ruhig(A, 9000);
  ck('Erweiterung: nur das feste Skript, Passwort nur über die Umgebung (nicht in der Befehlszeile)', erweiterungAufruf && /erweiterungen[\\/]adguard\.ps1$/.test(erweiterungAufruf.skript) && erweiterungAufruf.env.SPIELEKISTE_PASSWORT === 'Sicher-1234' && !erweiterungAufruf.skript.includes('Sicher'));
  const agText = await A.textContent('#syErweiterungen');
  ck('Erweiterung: danach „läuft ✓“ mit Anleitung (DNS-IP, Verwaltung im Heimnetz)', /läuft ✓/.test(agText) && /192\.168\.2\.42/.test(agText) && /:3000/.test(agText), agText.replace(/\s+/g, ' ').slice(0, 90));
  await A.locator('#syErweiterungen').scrollIntoViewIfNeeded(); await A.screenshot({ path: path.join(os.tmpdir(), 'sync-adguard.png') });

  // ---------- Steuerung ----------
  const benSt = await C.evaluate(async () => [(await syApi('admin/system')).status, (await syApi('admin/aktion', 'POST', { aktion: 'laptop-neustart' })).status, (await syApi('admin/protokoll?datei=caddy')).status]);
  ck('Steuerung: Ben darf weder Status, Aktionen noch Protokolle', benSt.every((x) => x === 403) && aktionen.length === 0, benSt.join(','));
  const falschSt = await A.evaluate(async () => [(await syApi('admin/aktion', 'POST', { aktion: 'format c:' })).status, (await syApi('admin/protokoll?datei=../../konten.json')).status]);
  ck('Steuerung: unbekannte Aktion und fremde Datei abgelehnt', falschSt[0] === 400 && falschSt[1] === 400 && aktionen.length === 0);
  await A.evaluate(() => { const x = document.getElementById('sySteuerung'); x.open = true; }); await ruhig(A, 2000);
  const stText = await A.textContent('#sySteuerInhalt');
  ck('Steuerung: Zustand (CPU, RAM, Akku am Netz) und Dienste', /CPU \d+ %/.test(stText) && /RAM .* frei/.test(stText) && /Akku 78 % \(am Netz\)/.test(stText) && /Caddy \(läuft\)/.test(stText) && /AdGuard \(nicht eingerichtet\)/.test(stText), stText.replace(/\s+/g, ' ').slice(0, 140));
  ck('Steuerung: Protokoll wird angezeigt', /Caddy-Testzeile/.test(await A.evaluate(async () => { document.getElementById('syProtokollWahl').value = 'caddy'; document.getElementById('syProtokollWahl').dispatchEvent(new Event('change')); await new Promise((r) => setTimeout(r, 800)); return document.getElementById('syProtokoll').textContent; })));
  await A.locator('#sySteuerung').scrollIntoViewIfNeeded(); await A.screenshot({ path: path.join(os.tmpdir(), 'sync-steuerung.png') });
  const dlg = await A.evaluate(() => {
    const d = document.getElementById('skDlg'), zu = d.querySelector('.sk-dlg-zu');
    d.scrollTop = d.scrollHeight; const r = d.getBoundingClientRect(), z = zu.getBoundingClientRect();
    return { scrollbar: d.scrollHeight > d.clientHeight, passt: r.height <= innerHeight, xSichtbar: z.top >= r.top - 1 && z.bottom <= r.top + 70, unten: !!d.querySelector('#sySchliessen') };
  });
  ck('Langes ☁️-Fenster passt auf den Bildschirm, scrollt, ✕ bleibt oben sichtbar, „Schließen“ unten', dlg.scrollbar && dlg.passt && dlg.xSichtbar && dlg.unten, JSON.stringify(dlg));
  await A.screenshot({ path: path.join(os.tmpdir(), 'sync-dialog-unten.png') });
  await A.click('[data-aktion="caddy-neustart"]'); await ruhig(A, 600);
  const nochmalAktion = await A.evaluate(async () => (await syApi('admin/aktion', 'POST', { aktion: 'adguard-neustart' })).status);
  ck('Steuerung: Caddy neu starten ausgelöst (festes Kommando), dann 30 s Sperre', aktionen.length === 1 && /TaskName 'Caddy'/.test(aktionen[0]) && /gestartet/.test(await A.textContent('#syAktionMeldung')) && nochmalAktion === 429);

  const gleichNochmal = await A.evaluate(async () => (await syApi('admin/aktualisieren', 'POST', {})).status);
  ck('Server aktualisieren: höchstens einmal pro Minute', gleichNochmal === 429 && updatesGestartet === 1);
  await A.evaluate(() => document.getElementById('skDlg').close());

  const ohne = await D0();
  ck('Bestenliste nur für Angemeldete', ohne === 401);

  // ---------- Sperre nach 5 falschen PINs ----------
  const E = await geraet('E');
  await E.goto(URL_); await ruhig(E, 1500);
  for (let i = 0; i < 5; i++) await eingeben(E, 'Ben', '0000');
  await eingeben(E, 'Ben', '4321');
  ck('Nach 5 falschen PINs gesperrt – auch die richtige PIN geht erst später', /gesperrt/.test(await meldung(E)), await meldung(E));

  // ---------- Konto löschen ----------
  await E.evaluate(async () => { await syApi('registrieren', 'POST', { name: 'Wegwerf', pin: '1111' }); });
  await E.evaluate(async () => { syZustand = 'ok'; await syApi('abgleich', 'POST', { basis: 0, aenderungen: { 'walquiz.x.v1': { v: '1' } }, oeffentlich: { xp: 5, level: 1 } }); });
  const falschLoeschen = await E.evaluate(async () => (await syApi('konto/loeschen', 'POST', { pin: '9999' })).status);
  const loeschen = await E.evaluate(async () => (await syApi('konto/loeschen', 'POST', { pin: '1111' })).status);
  const danach = await E.evaluate(async () => (await syApi('ich')).status);
  ck('Konto löschen: nur mit richtiger PIN, danach alles weg', falschLoeschen === 401 && loeschen === 200 && danach === 401 && !stand('wegwerf')
    && !fs.readFileSync(path.join(DATEN, 'konten.json'), 'utf8').includes('Wegwerf') && !fs.readFileSync(path.join(DATEN, 'bestenliste.json'), 'utf8').includes('wegwerf')
    && !fs.readdirSync(path.join(DATEN, 'archiv')).some((f) => f.startsWith('wegwerf')));

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

  // ---------- Top 3 ganz oben ----------
  await C.evaluate(() => { zeigeHub(); syBestenliste(true); }); await ruhig(C, 800);
  const top3 = await C.textContent('#syTop3').catch(() => '');
  ck('Top 3 oben im Dashboard: Podest mit Anna, eigener Platz', /Anna/.test(top3) && /Du: Platz \d+ von \d+/.test(top3), top3.replace(/\s+/g, ' ').slice(0, 80));
  ck('Planeten-Bühne entfernt, schlanke Kopfleiste mit ☁️', !(await C.$('.bu-ding')) && !!(await C.$('.hub-leiste #syncBtn')));

  // ---------- Ohne Server (z. B. GitHub Pages) ----------
  apiAn = false;
  await A.reload(); await ruhig(A, 1800);
  ck('Server weg, Gerät war angemeldet: ☁️⚠️ statt verschwinden', (await A.textContent('#syncBtn').catch(() => '')) === '☁️⚠️');
  await A.evaluate(() => document.getElementById('syncBtn').click()); await ruhig(A, 300);
  ck('☁️⚠️ erklärt das Problem und bietet „Nochmal versuchen“', /Server nicht erreichbar/.test(await A.textContent('#skDlg')) && !!(await A.$('#syNochmal')));
  apiAn = true; await A.click('#syNochmal'); await ruhig(A, 2000);
  ck('Nochmal versuchen: wieder verbunden, ☁️ normal', (await A.textContent('#syncBtn')) === '☁️');
  apiAn = false;
  const F = await geraet('F');
  await F.goto(URL_); await ruhig(F, 1500);
  apiFehler = 502;
  const G = await geraet('G');
  await G.goto(URL_); await ruhig(G, 1500);
  ck('Konto-Server hinter Caddy weg (502), Gerät war nie angemeldet: trotzdem ☁️⚠️', (await G.textContent('#syncBtn').catch(() => '')) === '☁️⚠️');
  apiFehler = 0;
  ck('Ohne Server: kein Dialog, kein Knopf', !(await dialogDa(F)) && !(await F.isVisible('#syncBtn').catch(() => false)));

  ck('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));
  await b.close(); caddy.close(); api.close();
  fs.rmSync(DATEN, { recursive: true, force: true });
  const ok = checks.filter((c) => c[1]).length;
  console.log(`\n${ok}/${checks.length} Prüfungen bestanden`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
