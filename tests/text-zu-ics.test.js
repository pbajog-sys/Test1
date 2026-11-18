// Text-zu-ICS: Erkennung (fester Stichtag Fr 6.11.2026), ICS-Aufbau, Bedienung, und: die Seite baut keine Netzverbindung auf.
// Aufruf: python3 -m http.server 8765, dann  node tests/text-zu-ics.test.js [Ordner]   (schreibt <Ordner>/test.ics)
const { chromium, devices } = require('playwright');
const fs = require('fs');
const ordner = process.argv[2] || '.';
const FAELLE = [
  ['Zahnarzt morgen um 14:30 in der Hauptstraße 5', { titel: 'Zahnarzt', datum: '2026-11-07', start: '14:30', ende: '15:30', ort: 'Hauptstraße 5' }],
  ['Teammeeting 12.11. 9–10:30 Uhr @ Raum 2', { titel: 'Teammeeting', datum: '2026-11-12', start: '09:00', ende: '10:30', ort: 'Raum 2' }],
  ['Mama Geburtstag 3. Dezember', { titel: 'Mama Geburtstag', datum: '2026-12-03', ganztag: true }],
  ['Joggen nächsten Samstag 8 Uhr für 45 Minuten', { titel: 'Joggen', datum: '2026-11-07', start: '08:00', ende: '08:45' }],
  ['Elternabend am Montag von 19 bis 21 Uhr in der Schule', { titel: 'Elternabend', datum: '2026-11-09', start: '19:00', ende: '21:00', ort: 'Schule' }],
  ['Steuer abgeben 31.01.2027', { titel: 'Steuer abgeben', datum: '2027-01-31', ganztag: true }],
  ['Arzt 05.03. 10 Uhr Erinnerung 30 min', { titel: 'Arzt', datum: '2027-03-05', start: '10:00', erinnerung: 30 }],
  ['Kino heute 20:15 für 2,5 h, bei Cinemaxx', { titel: 'Kino', datum: '2026-11-06', start: '20:15', ende: '22:45', ort: 'Cinemaxx' }],
  ['Projektstart in 3 Wochen', { titel: 'Projektstart', datum: '2026-11-27', ganztag: true }],
  ['Das ist so wichtig: Abgabe 2026-11-20 um 12', { datum: '2026-11-20', start: '12:00' }],
  ['Training Do. 18:00', { titel: 'Training', datum: '2026-11-12', start: '18:00' }],
  ['Freitag Pizza essen', { titel: 'Pizza essen', datum: '2026-11-13', ganztag: true }],
];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], acceptDownloads: true });
  const p = await ctx.newPage(); const fehler = [], anfragen = [];
  p.on('pageerror', (e) => fehler.push(e.message));
  p.on('request', (r) => anfragen.push(r.url()));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8765/werkzeuge/text-zu-ics.html'); await p.waitForTimeout(300);

  const erg = await p.evaluate((F) => F.map(([text, soll]) => { const t = erkenne(text, new Date(2026, 10, 6, 10, 0)); const abw = Object.entries(soll).filter(([k, v]) => t[k] !== v).map(([k, v]) => k + ': ' + JSON.stringify(t[k]) + ' statt ' + JSON.stringify(v)); return [text, abw]; }), FAELLE);
  for (const [text, abw] of erg) ck('Erkennt: „' + text + '“', !abw.length, abw.join('; '));

  // CSP: ein Versuch, nach draußen zu funken, muss scheitern
  const blockiert = await p.evaluate(async () => { try { await fetch('https://example.com/'); return false; } catch (e) { return true; } });
  ck('Netz ist per Content-Security-Policy gesperrt (fetch scheitert)', blockiert);

  // Bedienung: Text → Termine → Datei
  await p.fill('#eingabe', FAELLE.slice(0, 4).map((f) => f[0]).join('\n'));
  await p.click('#erkennen');
  ck('4 Termine als Karten zum Prüfen', (await p.$$('.termin')).length === 4);
  await p.fill('.termin[data-i="0"] [data-f="titel"]', 'Zahnarzt, Kontrolle; mit Ümläut & Komma');
  await p.screenshot({ path: ordner + '/ics-seite.png', fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#laden')]);
  const pfad = ordner + '/test.ics'; await dl.saveAs(pfad);
  const ics = fs.readFileSync(pfad, 'utf8');
  ck('Datei heißt termine.ics', dl.suggestedFilename() === 'termine.ics', dl.suggestedFilename());
  ck('4 VEVENTs, CRLF-Zeilenenden, Zeilen ≤ 75 Byte', (ics.match(/BEGIN:VEVENT/g) || []).length === 4 && !/[^\r]\n/.test(ics) && ics.split('\r\n').every((z) => Buffer.byteLength(z) <= 75));
  ck('Sonderzeichen korrekt maskiert', ics.includes('SUMMARY:Zahnarzt\\, Kontrolle\\; mit Ümläut & Komma'));
  ck('Ganztägig als VALUE=DATE (3.12. bis 4.12.)', ics.includes('DTSTART;VALUE=DATE:20261203') && ics.includes('DTEND;VALUE=DATE:20261204'));
  ck('Zeitzone Europe/Berlin mit VTIMEZONE', ics.includes('DTSTART;TZID=Europe/Berlin:20261107T143000') && ics.includes('BEGIN:VTIMEZONE'));
  // Fehler: Datum fehlt → kein Download, Hinweis
  await p.fill('#eingabe', 'Irgendwas ohne Datum'); await p.click('#erkennen');
  ck('Ohne Datum: Karte rot markiert mit Hinweis', await p.evaluate(() => !!document.querySelector('.termin.fehler .warn')));
  await p.click('#laden'); await p.waitForTimeout(200);
  ck('… und Speichern wird verweigert', /Datum nicht erkannt/.test(await p.textContent('#meldung')));

  const fremd = anfragen.filter((u) => !u.startsWith('http://localhost:8765/werkzeuge/text-zu-ics.html') && !u.startsWith('blob:'));
  ck('Keine einzige Anfrage nach außen', fremd.length === 0, fremd.join(', ') || 'nur die Seite selbst');
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
