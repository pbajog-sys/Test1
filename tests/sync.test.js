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
// Minecraft-Platzhalter: „RCON“ als Liste im Speicher, „Aufgabe starten“ wird nur notiert
const dcPosts = [];
const mc = { laeuft: true, whitelist: [], online: [], befehle: [], aufgaben: [], aufruf: null };
const mcBefehl = async (c) => {
  mc.befehle.push(c);
  if (!mc.laeuft) throw new Error('aus');
  if (c === 'list') return 'There are ' + mc.online.length + ' of a max of 10 players online: ' + mc.online.join(', ');
  if (c === 'whitelist list') return mc.whitelist.length ? 'There are ' + mc.whitelist.length + ' whitelisted player(s): ' + mc.whitelist.join(', ') : 'There are no whitelisted players';
  let x = /^whitelist add (\w+)$/.exec(c); if (x) { mc.whitelist.push(x[1]); return 'Added ' + x[1] + ' to the whitelist'; }
  x = /^whitelist remove (\w+)$/.exec(c); if (x) { mc.whitelist = mc.whitelist.filter((n) => n !== x[1]); return 'Removed ' + x[1]; }
  if (c === 'stop') { mc.laeuft = false; return ''; }
  x = /^gamerule (\w+)(?: (\S+))?$/.exec(c);
  if (x) { mc.regeln = mc.regeln || {}; if (x[2]) { mc.regeln[x[1]] = x[2]; return 'Gamerule ' + x[1] + ' is now set to: ' + x[2]; } return 'Gamerule ' + x[1] + ' is currently set to: ' + (mc.regeln[x[1]] || (x[1] === 'players_sleeping_percentage' ? '100' : 'true')); }
  return '';
};
fs.writeFileSync(path.join(DATEN, 'spiel', 'werkzeuge', 'homeserver', 'windows', 'erweiterungen', 'minecraft.ps1'), '# Platzhalter');
const erweiterungStarten = (skript, basis, env) => {
  if (/minecraft\.ps1$/.test(skript)) {
    mc.aufruf = { skript, env };
    setTimeout(() => { fs.mkdirSync(path.join(DATEN, 'minecraft'), { recursive: true }); fs.writeFileSync(path.join(DATEN, 'minecraft', 'paper.jar'), ''); fs.writeFileSync(path.join(DATEN, 'minecraft', 'paper-version.txt'), 'paper-26.3-256.jar');
      fs.appendFileSync(path.join(DATEN, 'erweiterungen.log'), '2026-11-19 12:00:00  Minecraft: Fertig: Minecraft-Server läuft.\n'); }, 1500);
    return;
  }
  erweiterungAufruf = { skript, basis, env };
  setTimeout(() => { fs.mkdirSync(path.join(DATEN, 'AdGuardHome'), { recursive: true }); fs.writeFileSync(path.join(DATEN, 'AdGuardHome', 'AdGuardHome.exe'), ''); adguardLaeuft = true;
    fs.appendFileSync(path.join(DATEN, 'erweiterungen.log'), '2026-11-19 12:00:00  AdGuard: Fertig: AdGuard Home läuft.\n'); }, 2000);
};
const api = erstelleServer({ daten: path.join(DATEN), basis: DATEN, admin: ['Anna'], github, erweiterungStarten, dnsPruefen: async () => adguardLaeuft, lanIp: () => '192.168.2.42',
  diensteAbfragen: async () => ({ dienste: { Caddy: 'Running', DuckDNS: 'Running', Update: 'Ready', AdGuard: 'fehlt' }, akku: 78, netz: true }),
  aktionStarten: (ps) => { aktionen.push(ps); },
  mcBefehl, aufgabeAusfuehren: async (art) => { mc.aufgaben.push(art); mc.laeuft = true; },
  logTakt: 0, discordSenden: async (url, n) => { if (/kaputt/.test(url)) throw new Error('Discord 404'); dcPosts.push(n); },
  mojangProfil: async (n) => ({ notch: { id: '069a79f444e94726a5befca90e38aaf5', name: 'Notch' }, jeb_: { id: '853c80ef3c3749fdaa49938b674adae6', name: 'jeb_' } })[n.toLowerCase()] || null,
  mcWarten: 60, modrinth: async (pfad) => {
    if (pfad.startsWith('/search')) { mc.suche = pfad; return { hits: [{ slug: 'graves', title: 'Graves', description: 'Grabstein mit deinen Sachen', downloads: 1234567, icon_url: 'https://cdn.modrinth.com/i.png' }, { slug: 'squaremap', title: 'squaremap', description: 'Karte', downloads: 900000, icon_url: 'http://boese.example/x.png' }] }; }
    mc.modrinth = pfad; const slug = /project\/([^/]+)/.exec(pfad)[1], f = slug === 'squaremap' ? 'squaremap-paper-mc26.3-1.4.4.jar' : slug + '-2.0.jar';
    return [{ version_type: 'release', version_number: slug === 'squaremap' ? '1.4.4' : '2.0', files: [{ primary: true, url: 'https://cdn.modrinth.com/data/x/' + f, filename: f }] }]; },
  herunterladen: async (q, ziel) => { mc.download = q; fs.writeFileSync(ziel, 'jar'); },
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

  // ---------- Minecraft ----------
  await A.evaluate(() => { document.getElementById('skDlg').close(); syKontoDialog(); }); await ruhig(A, 1500);
  ck('Minecraft: zunächst „installieren“ mit EULA-Häkchen', !!(await A.$('#syMcLos')) && !!(await A.$('#syMcEula')));
  const ohneEula = await A.evaluate(async () => (await syApi('admin/erweiterung', 'POST', { name: 'minecraft' })).status);
  const benMc = await C.evaluate(async () => [(await syApi('admin/minecraft')).status, (await syApi('admin/minecraft', 'POST', { aktion: 'freischalten', spieler: 'Ben' })).status]);
  ck('Minecraft: ohne EULA abgelehnt, Ben darf nichts', ohneEula === 400 && benMc.every((x) => x === 403) && !mc.aufruf);
  await A.check('#syMcEula'); await A.click('#syMcLos'); await ruhig(A, 9000);
  const mcText = await A.textContent('#syMinecraft');
  ck('Minecraft: installiert (EULA übergeben), läuft, Adresse für Freunde', mc.aufruf && mc.aufruf.env.SPIELEKISTE_EULA === 'ja' && /läuft ✓/.test(mcText) && /Adresse für Freunde: localhost/.test(mcText) && /paper-26\.3-256/.test(mcText), mcText.replace(/\s+/g, ' ').slice(0, 120));
  await A.fill('#syMcName', 'Steve'); await A.click('#syMcPlus'); await ruhig(A, 2500);
  ck('Minecraft: Spieler freischalten (whitelist add) und anzeigen', mc.befehle.includes('whitelist add Steve') && /Steve/.test(await A.textContent('#syMinecraft')));
  const falschName = await A.evaluate(async () => (await syApi('admin/minecraft', 'POST', { aktion: 'freischalten', spieler: 'x; op Ben' })).status);
  ck('Minecraft: ungültiger Name (Befehls-Einschleusung) abgelehnt', falschName === 400 && !mc.befehle.some((c) => /op Ben/.test(c)));
  await A.locator('#syMinecraft').scrollIntoViewIfNeeded(); await A.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft.png') });
  const breit = await A.evaluate(() => { const d = document.getElementById('skDlg'), R = d.getBoundingClientRect().right;
    return { ok: d.scrollWidth <= d.clientWidth + 1, zu: [...d.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > R + 1).slice(0, 6).map((e) => e.tagName + '#' + e.id + ' ' + (e.textContent || '').slice(0, 30) + ' +' + Math.round(e.getBoundingClientRect().right - R)) }; });
  ck('☁️-Fenster: nichts ragt rechts heraus', breit.ok, breit.zu.join(' | '));
  const stopp = await A.evaluate(async () => (await syApi('admin/minecraft', 'POST', { aktion: 'stopp' })).status);
  ck('Minecraft: Stopp sendet „stop“ (Welt wird gespeichert) und merkt „absichtlich aus“', stopp === 200 && mc.befehle.includes('stop') && fs.existsSync(path.join(DATEN, 'minecraft-aus.txt')));
  const start = await A.evaluate(async () => (await syApi('admin/minecraft', 'POST', { aktion: 'start' })).status);
  ck('Minecraft: Start führt die Aufgabe aus und hebt „absichtlich aus“ auf', start === 200 && mc.aufgaben.includes('/Run') && !fs.existsSync(path.join(DATEN, 'minecraft-aus.txt')));

  const gleichNochmal = await A.evaluate(async () => (await syApi('admin/aktualisieren', 'POST', {})).status);
  ck('Server aktualisieren: höchstens einmal pro Minute', gleichNochmal === 429 && updatesGestartet === 1);
  // ---------- Minecraft-Seite ----------
  const MC = path.join(DATEN, 'minecraft');
  fs.writeFileSync(path.join(MC, 'server.properties'), '#Minecraft server properties\r\nlevel-name=world\r\ndifficulty=easy\r\npvp=true\r\nmax-players=10\r\nmotd=Hallo\r\nlevel-seed=\r\nrcon.port=25575\r\n');
  fs.mkdirSync(path.join(MC, 'world', 'stats'), { recursive: true });
  fs.writeFileSync(path.join(MC, 'usercache.json'), JSON.stringify([{ name: 'Steve', uuid: 'aaaa-1' }, { name: 'Alex', uuid: 'bbbb-2' }]));
  fs.writeFileSync(path.join(MC, 'world', 'stats', 'aaaa-1.json'), JSON.stringify({ stats: { 'minecraft:custom': { 'minecraft:deaths': 7, 'minecraft:play_time': 72000 * 2, 'minecraft:mob_kills': 31, 'minecraft:walk_one_cm': 1234500, 'minecraft:sprint_one_cm': 500000 } } }));
  fs.writeFileSync(path.join(MC, 'world', 'stats', 'bbbb-2.json'), JSON.stringify({ stats: { 'minecraft:custom': { 'minecraft:deaths': 2, 'minecraft:play_time': 36000, 'minecraft:player_kills': 3 } } }));
  fs.mkdirSync(path.join(MC, 'world', 'advancements'), { recursive: true });
  fs.writeFileSync(path.join(MC, 'world', 'advancements', 'aaaa-1.json'), JSON.stringify({ 'minecraft:story/mine_stone': { done: true }, 'minecraft:story/root': { done: true }, 'minecraft:recipes/misc/x': { done: true }, 'minecraft:story/smelt_iron': { done: false }, DataVersion: 4000 }));
  fs.mkdirSync(path.join(MC, 'logs'), { recursive: true });
  const tag = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const zlib = require('zlib');
  fs.writeFileSync(path.join(MC, 'logs', tag(3) + '-1.log.gz'), zlib.gzipSync('[18:01:02 INFO]: Steve joined the game\n[18:05:00 INFO]: Alex joined the game\n[19:00:00 INFO]: Steve joined the game\n'));
  fs.writeFileSync(path.join(MC, 'logs', tag(1) + '-1.log.gz'), zlib.gzipSync('[18:01:02 INFO]: Alex joined the game\n'));
  fs.writeFileSync(path.join(MC, 'logs', tag(200) + '-1.log.gz'), zlib.gzipSync('[18:01:02 INFO]: Uralt joined the game\n'));
  fs.writeFileSync(path.join(MC, 'logs', 'latest.log'), '[10:00:00 INFO]: Steve joined the game\n');
  mc.online = ['Steve'];
  const benInfo = await C.evaluate(async () => { const r = await syApi('minecraft/info'); return [r.status, r.json]; });
  const steve = (benInfo[1].spieler || []).find((x) => x.name === 'Steve');
  ck('Minecraft-Seite: jeder Angemeldete sieht Tode, Spielzeit, Kills, km', benInfo[0] === 200 && steve && steve.tode === 7 && steve.spielzeitMin === 120 && steve.mobKills === 31 && steve.km === 17.3 && benInfo[1].spieler[1].spielerKills === 3 && benInfo[1].seed === undefined && steve.erfolge === 2, JSON.stringify(benInfo[1].spieler));
  const akt = benInfo[1].aktivitaet || [];
  ck('Minecraft-Seite: Online pro Tag aus den Server-Logs (einmal je Spieler und Tag, nur letzte 90 Tage)', akt.length === 3 && akt[0].tag === tag(3) && akt[0].spieler.join() === 'Alex,Steve' && akt[2].spieler.join() === 'Steve' && !JSON.stringify(akt).includes('Uralt'), JSON.stringify(akt));
  ck('Minecraft-Seite: ohne Anmeldung nichts', (await fetch('http://localhost:8766/api/minecraft/info')).status === 401);
  await A.goto(URL_ + 'minecraft.html'); await ruhig(A, 1500);
  const seite = await A.textContent('body');
  ck('Minecraft-Seite: Status, Adresse, Tabelle (meiste Tode oben), Admin-Bereich', /Online/.test(seite) && /localhost/.test(seite) && !!(await A.$('[data-name=Steve] .online-punkt')) && (await A.textContent('#balken .wer')).includes('Steve') && (await A.$$('#verlauf path')).length === 3 && /Steve/.test(await A.textContent('#koepfe')) && await A.isVisible('#verwaltungKnopf'));
  await A.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-seite.png'), fullPage: true });
  await C.goto(URL_ + 'minecraft.html'); await ruhig(C, 1500);
  ck('Minecraft-Seite: Ben sieht Statistik, aber keine Einstellungen', /Alex/.test(await C.textContent('#zeilen')) && !(await C.isVisible('#verwaltungKnopf')) && !(await C.$('#verwaltung[open]')));
  const benAdmin = await C.evaluate(async () => (await (await fetch('api/admin/minecraft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'neue-welt' }) })).status));
  ck('Minecraft-Seite: Ben darf keine neue Welt erzeugen', benAdmin === 403);
  // Verwaltung (Overlay)
  await A.click('#verwaltungKnopf'); await ruhig(A, 1500);
  ck('Verwaltung: öffnet als Overlay mit Server, Konsole (Server-Log) und Reitern', await A.isVisible('#verwaltung') && /Steve joined the game/.test(await A.textContent('#konsole')) && (await A.$$('[data-tab]')).length === 6);
  await A.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-verwaltung.png') });
  await A.fill('#befehl', '/time set day'); await A.press('#befehl', 'Enter'); await ruhig(A, 800);
  const stoppBefehl = await A.evaluate(async () => (await (await fetch('api/admin/minecraft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'befehl', befehl: 'stop' }) })).status));
  ck('Konsole: Befehl wird gesendet (ohne /), „stop“ nur über den Knopf', mc.befehle.includes('time set day') && stoppBefehl === 400 && !mc.befehle.slice(-3).includes('stop'));
  await A.click('[data-tab=spieler]'); await ruhig(A, 400);
  ck('Spieler: alle Spieler mit „darf rein“ und „Admin“', /Steve/.test(await A.textContent('#spielerZeilen')) && /Alex/.test(await A.textContent('#spielerZeilen')));
  await A.click('[data-sp=op][data-n=Alex]'); await ruhig(A, 1500);
  await A.click('[data-sp=ban][data-n=Alex]'); await ruhig(A, 1500);
  const opBoese = await A.evaluate(async () => (await (await fetch('api/admin/minecraft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'op', spieler: 'x @a' }) })).status));
  ck('Spieler: zum Admin machen und bannen (nach Rückfrage), falsche Namen abgelehnt', mc.befehle.includes('op Alex') && mc.befehle.includes('ban Alex') && opBoese === 400);
  await A.click('[data-tab=plugins]'); await ruhig(A, 1200);
  const treffer = await A.textContent('#pluginTreffer');
  ck('Plugins: Vorschläge von Modrinth passend zur Version (nur Modrinth-Bilder)', /Graves/.test(treffer) && /1,2 Mio\. Downloads/.test(treffer) && /versions%3A26\.3/.test(mc.suche) && !(await A.$('#pluginTreffer img[src*="boese"]')));
  await A.click('[data-slug=graves]'); await ruhig(A, 2500);
  const pliste = JSON.parse(fs.readFileSync(path.join(MC, 'plugins.json'), 'utf8'));
  ck('Plugins: installieren lädt die passende Datei, Server startet neu', fs.existsSync(path.join(MC, 'plugins', 'graves-2.0.jar')) && pliste.graves && pliste.graves.version === '2.0' && mc.laeuft);
  await A.evaluate(() => adminLaden()); await ruhig(A, 800);
  ck('Plugins: in der Liste „Installiert“', /Graves/.test(await A.textContent('#pluginListe')));
  await A.click('[data-weg-plugin="graves-2.0.jar"]'); await ruhig(A, 2500);
  const pfadBoese = await A.evaluate(async () => (await (await fetch('api/admin/minecraft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'plugin-entfernen', datei: '../paper.jar' }) })).status));
  ck('Plugins: entfernen klappt, fremde Pfade nicht', !fs.existsSync(path.join(MC, 'plugins', 'graves-2.0.jar')) && !JSON.parse(fs.readFileSync(path.join(MC, 'plugins.json'), 'utf8')).graves && pfadBoese === 404 && fs.existsSync(path.join(MC, 'paper.jar')));
  // ---------- Selbst eintragen ----------
  const post = (P, weg, body) => P.evaluate(async ([w, b]) => { const r = await fetch('api/' + w, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); return [r.status, await r.json().catch(() => null)]; }, [weg, body]);
  const ausAn = await post(C, 'minecraft/beitreten', { name: 'Notch', code: '' });
  ck('Selbst eintragen: anfangs aus', ausAn[0] === 403);
  const z1 = await post(A, 'admin/minecraft', { aktion: 'zugang', modus: 'code' });
  ck('Selbst eintragen: Admin schaltet „mit Code“ an, Code wird erzeugt', z1[0] === 200 && /^[a-z]+-[a-z]+-\d+$/.test(z1[1].code), JSON.stringify(z1));
  await C.goto(URL_ + 'minecraft.html'); await ruhig(C, 1500);
  ck('Selbst eintragen: Ben sieht „Mitspielen“ mit Code-Feld', await C.isVisible('#mcBeiName') && await C.isVisible('#mcBeiCode'));
  await C.fill('#mcBeiName', 'notch'); await C.fill('#mcBeiCode', 'falsch'); await C.click('#mcBeiLos'); await ruhig(C, 800);
  const falschCode = await C.textContent('#toast');
  await C.fill('#mcBeiCode', z1[1].code.toUpperCase()); await C.click('#mcBeiLos'); await ruhig(C, 1800);
  ck('Selbst eintragen: falscher Code abgelehnt, richtiger Code → Name bei Mojang geprüft (richtige Schreibweise) und auf der Whitelist',
    /stimmt nicht/.test(falschCode) && mc.befehle.includes('whitelist add Notch') && /Du spielst als Notch/.test(await C.textContent('#mitspielen')), falschCode);
  await C.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-mitspielen.png') });
  const gibtsNicht = await post(C, 'minecraft/beitreten', { name: 'GibtEsNichtXY', code: z1[1].code });
  const vergeben = await post(A, 'minecraft/beitreten', { name: 'Notch', code: z1[1].code });
  ck('Selbst eintragen: unbekannter Name und schon vergebener Name abgelehnt', gibtsNicht[0] === 404 && vergeben[0] === 409);
  const wechsel = await post(C, 'minecraft/beitreten', { name: 'jeb_', code: z1[1].code });
  ck('Selbst eintragen: Namen wechseln nimmt den alten von der Whitelist', wechsel[0] === 200 && mc.befehle.includes('whitelist remove Notch') && mc.befehle.includes('whitelist add jeb_'));
  mc.laeuft = false;
  await post(C, 'minecraft/austreten', {});
  const wl = JSON.parse(fs.readFileSync(path.join(MC, 'whitelist.json'), 'utf8') || '[]');
  ck('Selbst eintragen: austreten geht auch bei gestopptem Server (whitelist.json)', Array.isArray(wl) && !wl.some((x) => x.name === 'jeb_'));
  await post(C, 'minecraft/beitreten', { name: 'jeb_', code: z1[1].code });
  const wl2 = JSON.parse(fs.readFileSync(path.join(MC, 'whitelist.json'), 'utf8'));
  ck('Selbst eintragen: bei gestopptem Server direkt in whitelist.json (mit UUID)', wl2.some((x) => x.name === 'jeb_' && x.uuid === '853c80ef-3c37-49fd-aa49-938b674adae6'), JSON.stringify(wl2));
  mc.laeuft = true;
  let gesperrt = 0; for (let i = 0; i < 6; i++) gesperrt = (await post(C, 'minecraft/beitreten', { name: 'Notch', code: 'raten' + i }))[0];
  ck('Selbst eintragen: nach 5 falschen Codes gesperrt', gesperrt === 429);
  await A.evaluate(() => adminLaden()); await ruhig(A, 600);
  ck('Verwaltung: Code und Selbst-Eingetragene sichtbar', (await A.textContent('#zugangCode')) === z1[1].code && /jeb_/.test(await A.textContent('#zugangListe')) && /Ben/.test(await A.textContent('#zugangListe')));
  // ---------- Discord ----------
  const dcFalsch = await post(A, 'admin/minecraft', { aktion: 'discord', url: 'https://boese.example/api/webhooks/1/x' });
  await A.click('[data-tab=discord]'); await ruhig(A, 300);
  await A.fill('#discordUrl', 'https://discord.com/api/webhooks/123456/abcDEF-ghi'); await A.click('#discordVerbinden'); await ruhig(A, 1200);
  const adminJson = await A.evaluate(async () => JSON.stringify((await (await fetch('api/admin/minecraft')).json()).discord));
  ck('Discord: nur echte Webhook-Links, Test-Nachricht, Link geht nie zurück an den Browser', dcFalsch[0] === 400 && dcPosts.length === 1 && /verbunden/.test(await A.textContent('#discordStatus')) && !/abcDEF/.test(adminJson), adminJson);
  await A.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-discord.png') });
  api.mcLogPruefen();
  fs.appendFileSync(path.join(MC, 'logs', 'latest.log'), ['[20:00:01 INFO]: Steve joined the game', '[20:01:00 INFO]: <Steve> hallo', '[20:02:00 INFO]: Steve was blown up by Creeper',
    '[20:03:00 INFO]: Steve has made the advancement [Stone Age]', '[20:04:00 INFO]: Steve left the game', ''].join('\n'));
  api.mcLogPruefen(); await ruhig(A, 600);
  const texte = dcPosts.slice(1).map((n) => n.content || n.embeds[0].description);
  ck('Discord: Beitritt, Tod (deutsch), Erfolg, Verlassen – Chat nur wenn eingeschaltet', texte.length === 4 && /Steve\*\* ist dem Server beigetreten/.test(texte[0]) && /gesprengt/.test(texte[1]) && /einem Creeper/.test(texte[1]) && /Stone Age/.test(texte[2]) && /verlassen/.test(texte[3]), JSON.stringify(texte));

  // Einstellungen speichern
  await A.click('[data-tab=einstellungen]'); await ruhig(A, 400);
  ck('Einstellungen: aktuelle Werte im Formular', /easy/.test(await A.inputValue('[name=difficulty]')));
  await A.selectOption('[name=difficulty]', 'hard'); await A.uncheck('[name=pvp]'); await A.fill('[name=players_sleeping_percentage]', '1'); await A.fill('[name=motd]', 'Spielekiste!');
  ck('Einstellungen: Änderungen markiert, Leiste zeigt Anzahl', /4 Änderungen/.test(await A.textContent('#aenderungen')) && (await A.$$('.opt.geaendert')).length === 4);
  await A.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-konfig.png') });
  const vorher = mc.befehle.length; await A.click('#speichern'); await ruhig(A, 2500);
  const props = fs.readFileSync(path.join(MC, 'server.properties'), 'utf8');
  ck('Einstellungen: geschrieben (Rest bleibt), Server neu gestartet', /difficulty=hard\r\n/.test(props) && mc.befehle.includes('gamerule pvp false') && mc.befehle.includes('gamerule players_sleeping_percentage 1') && !/players_sleeping/.test(props) && /motd=Spielekiste!/.test(props) && /rcon\.port=25575/.test(props) && /^#Minecraft/.test(props) && mc.befehle.slice(vorher).includes('stop') && mc.laeuft, props);
  const boese = await A.evaluate(async () => [(await (await fetch('api/admin/minecraft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'einstellungen', werte: { 'rcon.password': 'x' } }) })).status),
    (await (await fetch('api/admin/minecraft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'einstellungen', werte: { motd: 'a\nenable-rcon=false' } }) })).status)]);
  ck('Einstellungen: fremde Schlüssel und Zeilenumbrüche abgelehnt', boese.every((x) => x === 400) && !/enable-rcon=false/.test(fs.readFileSync(path.join(MC, 'server.properties'), 'utf8')));
  // Neue Welt
  await A.click('[data-tab=welt]'); await ruhig(A, 300);
  await A.fill('#seed', 'ggwp'); await A.click('#neueWelt'); await ruhig(A, 3000);
  const archiv = fs.readdirSync(path.join(MC, 'welten-archiv'));
  ck('Neue Welt: alte Welt archiviert, Seed gesetzt, Server läuft wieder', archiv.length === 1 && fs.existsSync(path.join(MC, 'welten-archiv', archiv[0], 'world', 'stats', 'aaaa-1.json')) && !fs.existsSync(path.join(MC, 'world'))
    && /level-seed=ggwp/.test(fs.readFileSync(path.join(MC, 'server.properties'), 'utf8')) && mc.laeuft && !fs.existsSync(path.join(DATEN, 'minecraft-aus.txt')), archiv.join(','));
  for (let i = 0; i < 3; i++) { fs.mkdirSync(path.join(MC, 'welten-archiv', '2020-01-0' + (i + 1)), { recursive: true }); }
  await A.evaluate(async () => fetch('api/admin/minecraft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aktion: 'neue-welt', seed: '' }) })); await ruhig(A, 2500);
  ck('Neue Welt: nur die letzten 3 Archive bleiben', fs.readdirSync(path.join(MC, 'welten-archiv')).length === 3 && !fs.existsSync(path.join(MC, 'welten-archiv', '2020-01-01')));
  // Karte installieren + anzeigen
  const sqm = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end('<title>squaremap</title>Karte ' + q.url); });
  await new Promise((ok) => sqm.listen(8771, '127.0.0.1', ok));
  fs.mkdirSync(path.join(MC, 'plugins', 'squaremap'), { recursive: true });
  fs.writeFileSync(path.join(MC, 'plugins', 'squaremap', 'config.yml'), 'settings:\n  internal-webserver:\n    enabled: true\n    bind: 0.0.0.0\n    port: 8771\n');
  await A.goto(URL_ + 'minecraft.html'); await ruhig(A, 1500);
  await A.click('#karteLos'); await ruhig(A, 2500);
  ck('Karte: passende squaremap-Version von Modrinth geladen und installiert', /game_versions=.*26\.3/.test(decodeURIComponent(mc.modrinth)) && fs.existsSync(path.join(MC, 'plugins', 'squaremap-paper-mc26.3-1.4.4.jar')), mc.modrinth);
  await C.reload(); await ruhig(C, 2000);
  const kartenText = await C.evaluate(async () => (await fetch('api/minecraft/karte/tiles/x.png?v=1')).text());
  ck('Karte: für Angemeldete durchgereicht (squaremap nur lokal), in der Seite eingebettet', /Karte \/tiles\/x\.png\?v=1/.test(kartenText) && !!(await C.$('#karteFrame')), kartenText);
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' }); await ctx.addCookies(await A.context().cookies());
    const P = await ctx.newPage(); P.on('pageerror', (e) => fehler.push('Desktop: ' + e.message)); await P.goto(URL_ + 'minecraft.html'); await ruhig(P, 2500);
    await P.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-desktop.png'), fullPage: true });
    const lay = await P.evaluate(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(), k = r('karte'), seite = document.querySelector('.seite').getBoundingClientRect();
      return { kLinks: Math.round(k.left), sRechts: Math.round(seite.right), kBreit: Math.round(k.width), kHoch: Math.round(k.height), unten: Math.round(innerHeight - k.bottom), breit: document.documentElement.scrollWidth <= innerWidth }; });
    ck('Minecraft-Seite am PC: volle Breite, Seitenleiste links, Karte füllt den Rest bis unten', lay.kLinks > lay.sRechts && lay.kBreit > 1440 * 0.6 && lay.kHoch > 650 && lay.unten < 30 && lay.breit, JSON.stringify(lay));
    // breiter Bildschirm mit echten Daten
    const W = path.join(MC, 'world', 'stats'); fs.mkdirSync(W, { recursive: true });
    const leute = [['Steve', 'aaaa-1', 7, 9000, 31], ['Alex', 'bbbb-2', 2, 3000, 12], ['Philip', 'cccc-3', 16, 14000, 88], ['Ben', 'dddd-4', 4, 600, 5], ['Mia', 'eeee-5', 1, 7200, 40]];
    fs.writeFileSync(path.join(MC, 'usercache.json'), JSON.stringify(leute.map(([name, uuid]) => ({ name, uuid }))));
    leute.forEach(([, uuid, tode, min, mobs]) => fs.writeFileSync(path.join(W, uuid + '.json'), JSON.stringify({ stats: { 'minecraft:custom': { 'minecraft:deaths': tode, 'minecraft:play_time': min * 1200, 'minecraft:mob_kills': mobs, 'minecraft:walk_one_cm': min * 4000 } } })));
    for (let n = 1; n < 25; n += 1 + (n % 3)) fs.writeFileSync(path.join(MC, 'logs', tag(n) + '-1.log.gz'), zlib.gzipSync(leute.slice(0, 1 + (n * 7) % 5).map((l) => '[18:00:00 INFO]: ' + l[0] + ' joined the game').join('\n')));
    await P.setViewportSize({ width: 2000, height: 1000 }); await P.reload(); await ruhig(P, 2500);
    await P.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-breit.png') });
    await P.click('#verwaltungKnopf'); await ruhig(P, 1200); await P.click('[data-tab=spieler]'); await ruhig(P, 300);
    await P.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-verwaltung-pc.png') });
    await P.click('[data-tab=einstellungen]'); await ruhig(P, 500); await P.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-konfig-pc.png') });
    await P.click('[data-tab=plugins]'); await ruhig(P, 1200); await P.screenshot({ path: path.join(os.tmpdir(), 'sync-minecraft-plugins-pc.png') });
    await ctx.close(); }
  sqm.close(); await C.goto(URL_); await ruhig(C, 1500);
  await A.goto(URL_); await ruhig(A, 1500);
  await A.evaluate(() => syKontoDialog()); await ruhig(A, 1200);
  ck('☁️-Fenster: Link zur Minecraft-Seite', await A.isVisible('#syMcSeite'));
  await A.evaluate(() => document.getElementById('skDlg').close());

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
