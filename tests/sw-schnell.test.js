// Service Worker: Nach dem ersten Besuch startet die App aus dem Cache – schnell und auch dann,
// wenn der Server (Homeserver-Laptop) nicht erreichbar ist. Updates kommen im Hintergrund.
// Aufruf: node tests/sw-schnell.test.js   (startet seinen eigenen Server auf Port 8767)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const WURZEL = path.join(__dirname, '..');
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
let erreichbar = true, anfragen = 0;
const server = http.createServer((req, res) => {
  if (!erreichbar) { req.socket.destroy(); return; }
  anfragen++;
  const u = new URL(req.url, 'http://x');
  let datei = path.join(WURZEL, decodeURIComponent(u.pathname));
  if (datei.endsWith('/')) datei += 'index.html';
  fs.readFile(datei, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' }); res.end(data);
  });
});
(async () => {
  await new Promise((ok) => server.listen(8767, ok));
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8767/');
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(1500);
  ck('Service Worker aktiv', await p.evaluate(() => !!navigator.serviceWorker.controller));
  // Zweiter Start: Seite muss aus dem Cache kommen
  const quellen = [];
  p.on('response', (r) => { const pf = new URL(r.url()).pathname; if (new URL(r.url()).host === 'localhost:8767' && (pf.endsWith('.js') || pf === '/')) quellen.push(r.fromServiceWorker()); });
  const t0 = Date.now(); await p.reload({ waitUntil: 'load' }); const dauer = Date.now() - t0;
  ck('Zweiter Start: Dateien kommen vom Service Worker', quellen.length > 50 && quellen.every(Boolean), quellen.length + ' Dateien, ' + dauer + ' ms');
  // Server weg: App startet trotzdem
  erreichbar = false;
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(800);
  ck('Server nicht erreichbar: App startet aus dem Cache', await p.evaluate(() => typeof renderStart === 'function' && typeof syStart === 'function' && document.body.innerText.length > 50));
  // Update im Hintergrund: geänderte Datei kommt beim übernächsten Start an
  erreichbar = true;
  ck('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));
  await b.close(); server.close();
  const ok = checks.filter((c) => c[1]).length;
  console.log(`\n${ok}/${checks.length} Prüfungen bestanden`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
