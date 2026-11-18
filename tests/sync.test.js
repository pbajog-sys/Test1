// Spielstand-Sync: zwei Geräte gegen einen nachgebauten Homeserver (statische Dateien + WebDAV-artiges /sync/).
// Erstes Hochladen, Übernehmen auf dem zweiten Gerät, Änderungen hin und zurück, Konflikt (beide Wege),
// Tagesarchiv, Sync-Code (einmal pro Gerät, falscher Code wird nochmal abgefragt), und: ohne Sync-Server
// (GitHub Pages) passiert nichts.
// Aufruf: node tests/sync.test.js   (startet seinen eigenen Server auf Port 8766)
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const WURZEL = path.join(__dirname, '..');
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

let syncAn = true;
const CODE = 'geheim-123';
const ablage = new Map();   // name → text
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/sync/')) {
    if (!syncAn) { res.writeHead(404); return res.end(); }
    const name = u.pathname.slice('/sync/'.length);
    if (req.headers['x-sync-code'] !== CODE) { res.writeHead(401, { 'X-Spielekiste-Sync': 'code' }); return res.end('Sync-Code fehlt'); }
    if (req.method === 'OPTIONS') { res.writeHead(200, { DAV: '1, 2', Allow: 'OPTIONS, GET, PUT' }); return res.end(); }
    if (req.method === 'GET') { if (!ablage.has(name)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(ablage.get(name)); }
    if (req.method === 'PUT') { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => { ablage.set(name, b); res.writeHead(201); res.end(); }); return; }
    res.writeHead(405); return res.end();
  }
  if (req.method === 'OPTIONS') { res.writeHead(405); return res.end(); }
  let datei = path.join(WURZEL, decodeURIComponent(u.pathname));
  if (datei.endsWith('/')) datei += 'index.html';
  fs.readFile(datei, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' }); res.end(data);
  });
});

(async () => {
  await new Promise((ok) => server.listen(8766, ok));
  const URL_ = 'http://localhost:8766/';
  const b = await chromium.launch();
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const fehler = [];
  const geraet = async (name, dialogAntwort, codes = [CODE]) => {
    const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
    await ctx.addInitScript(() => { localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => fehler.push(name + ': ' + e.message));
    p.dialogs = []; p.prompts = 0;
    p.on('dialog', (d) => {
      if (d.type() === 'prompt') { p.prompts++; const c = codes.shift(); return c ? d.accept(c) : d.dismiss(); }
      p.dialogs.push(d.message()); dialogAntwort.wert ? d.accept() : d.dismiss();
    });
    return p;
  };
  const ruhig = (p, ms = 1200) => p.waitForTimeout(ms);
  const stand = () => (ablage.has('stand.json') ? JSON.parse(ablage.get('stand.json')) : null);
  const lesen = (p, k) => p.evaluate((k) => localStorage.getItem(k), k);
  const setzen = (p, k, v) => p.evaluate(([k, v]) => localStorage.setItem(k, v), [k, v]);
  const abgleich = async (p) => { await p.evaluate(() => syAbgleich()).catch(() => {}); await ruhig(p); };

  const antwortA = { wert: true }, antwortB = { wert: true };
  const A = await geraet('A', antwortA), B = await geraet('B', antwortB, ['falsch', ' Geheim-123 ']);

  // ---------- Gerät A: erster Start, Server leer ----------
  await A.goto(URL_); await ruhig(A, 1500);
  ck('A: Sync-Server erkannt, Code einmal abgefragt', (await A.evaluate(() => syAktiv)) && A.prompts === 1);
  await setzen(A, 'walquiz.farben.v1', JSON.stringify({ rekord: 7 }));
  await abgleich(A);
  ck('A: erster Stand hochgeladen (Version 1, mit Farben-Rekord)', stand() && stand().version === 1 && stand().daten['walquiz.farben.v1'] === '{"rekord":7}', stand() && ('v' + stand().version));
  ck('Gerätebezogenes bleibt draußen', stand() && !('walquiz.installhinweis.v1' in stand().daten));
  ck('Tagesarchiv angelegt', [...ablage.keys()].some((k) => /^archiv-\d{4}-\d\d-\d\d\.json$/.test(k)));

  // ---------- Gerät B: frisch, übernimmt den Server-Stand ohne Rückfrage ----------
  await B.goto(URL_); await ruhig(B, 2500);
  ck('B: falscher Code → nochmal gefragt; mit Großbuchstaben und Leerzeichen eingegeben → klappt, Stand von A übernommen', B.prompts === 2 && (await lesen(B, 'walquiz.farben.v1')) === '{"rekord":7}');
  ck('B: Code nicht im Server-Stand', !JSON.stringify(stand()).includes(CODE));
  ck('B: keine Konflikt-Frage beim ersten Start', B.dialogs.length === 0, B.dialogs.join(' | '));
  ck('B: Hinweis „übernommen“ sichtbar', await B.isVisible('.sync-hinweis').catch(() => false));

  // ---------- B spielt weiter → A holt es sich ----------
  await setzen(B, 'walquiz.farben.v1', JSON.stringify({ rekord: 12 }));
  await abgleich(B);
  ck('B: neue Version hochgeladen', stand().version === 2 && stand().daten['walquiz.farben.v1'] === '{"rekord":12}', 'v' + stand().version);
  await abgleich(A); await ruhig(A, 1500);
  ck('A: holt Stand von B (ohne erneute Code-Abfrage nach dem Neuladen)', (await lesen(A, 'walquiz.farben.v1')) === '{"rekord":12}' && A.prompts === 1);
  ck('A: keine Konflikt-Frage', A.dialogs.length === 0);

  // ---------- Nichts geändert → kein Hochladen ----------
  await abgleich(A); await abgleich(B);
  ck('Ohne Änderungen bleibt die Version gleich', stand().version === 2, 'v' + stand().version);

  // ---------- Konflikt 1: beide spielen, A nimmt den Server-Stand ----------
  await setzen(B, 'walquiz.takt.v1', '"B-Runde"'); await abgleich(B);   // v3 von B
  await setzen(A, 'walquiz.punkte.v1', '"A-Runde"');                    // A hat parallel gespielt
  antwortA.wert = true;
  await abgleich(A); await ruhig(A, 1500);
  ck('Konflikt: A wird gefragt', A.dialogs.length === 1);
  ck('Konflikt (Server nehmen): A hat Stand von B', (await lesen(A, 'walquiz.takt.v1')) === '"B-Runde"' && (await lesen(A, 'walquiz.punkte.v1')) === null);
  const k1 = [...ablage.keys()].find((k) => k.startsWith('konflikt-'));
  ck('Konflikt (Server nehmen): Stand von A liegt als Konflikt-Datei auf dem Server', k1 && JSON.parse(ablage.get(k1)).daten['walquiz.punkte.v1'] === '"A-Runde"', k1);

  // ---------- Konflikt 2: beide spielen, B behält seinen Stand ----------
  await setzen(A, 'walquiz.zahlen.v1', '"A2"'); await abgleich(A);      // v4 von A
  await setzen(B, 'walquiz.zufall.v1', '"B2"');
  antwortB.wert = false;
  const vorher = ablage.size;
  await abgleich(B);
  ck('Konflikt (eigenen behalten): Server hat jetzt den Stand von B', stand().daten['walquiz.zufall.v1'] === '"B2"' && !('walquiz.zahlen.v1' in stand().daten) && stand().version === 5, 'v' + stand().version);
  ck('Konflikt (eigenen behalten): Stand von A als Konflikt-Datei aufgehoben', ablage.size === vorher + 1 && [...ablage.entries()].some(([k, v]) => k.startsWith('konflikt-') && JSON.parse(v).daten['walquiz.zahlen.v1'] === '"A2"'));
  await abgleich(A); await ruhig(A, 1500);
  ck('A: übernimmt danach den Stand von B ohne Rückfrage', (await lesen(A, 'walquiz.zufall.v1')) === '"B2"' && A.dialogs.length === 1);

  // ---------- Ohne Sync-Server (z. B. GitHub Pages) ----------
  syncAn = false;
  const C = await geraet('C', { wert: true });
  await C.goto(URL_); await ruhig(C, 1500);
  ck('Ohne Sync-Server: Sync bleibt aus, keine Code-Abfrage', (await C.evaluate(() => syAktiv)) === false && C.prompts === 0);
  syncAn = true;
  const D = await geraet('D', { wert: true }, []);
  await D.goto(URL_); await ruhig(D, 1500);
  ck('Code-Abfrage abgebrochen: Sync aus, in dieser Sitzung keine weitere Frage', (await D.evaluate(() => syAktiv)) === false && D.prompts === 1);
  await D.reload(); await ruhig(D, 1500);
  ck('… auch nach Neuladen nicht', D.prompts === 1);

  ck('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));
  await b.close(); server.close();
  const ok = checks.filter((c) => c[1]).length;
  console.log(`\n${ok}/${checks.length} Prüfungen bestanden`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
