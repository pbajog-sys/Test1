// Song-Rätsel: eingebaute Lieder (beide Modi, alle Antworten richtig = 50/50), eigene Songs hochladen
// (zwei erzeugte WAV-Dateien mit bekannten Tönen), Tonerkennung gegen die Wahrheit prüfen, Speichern nach Neuladen.
// Aufruf: python3 -m http.server 8765, dann  node tests/songs.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const ordner = process.argv[2] || '.';

// ---- Testsongs erzeugen: Melodie mit Obertönen, optional Bass + Rauschen ----
function wav(datei, mix, seed) {
  let s = seed; const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const rate = 22050, noten = []; let t = 0;
  while (t < 40) { const d = 0.35 + Math.floor(r() * 4) * 0.15; noten.push({ t, d, m: 60 + Math.floor(r() * 13) }); t += d; }
  const n = Math.floor(t * rate), a = new Float32Array(n);
  for (const x of noten) {
    const f = 440 * Math.pow(2, (x.m - 69) / 12), s0 = Math.floor(x.t * rate), len = Math.floor(x.d * rate);
    for (let i = 0; i < len && s0 + i < n; i++) {
      const tt = i / rate, env = Math.min(1, tt / 0.01) * Math.exp(-tt * 1.5) * Math.min(1, (len - i) / (rate * 0.01));
      a[s0 + i] += env * (0.5 * Math.sin(2 * Math.PI * f * tt) + 0.2 * Math.sin(4 * Math.PI * f * tt) + 0.1 * Math.sin(6 * Math.PI * f * tt));
    }
  }
  if (mix) {   // Bass (Grundton zwei Oktaven tiefer, alle 2 s ein anderer) + leises Rauschen
    for (let i = 0; i < n; i++) { const bm = 36 + [0, 5, 7, 3][Math.floor(i / rate / 2) % 4], bf = 440 * Math.pow(2, (bm - 69) / 12); a[i] += 0.12 * Math.sin(2 * Math.PI * bf * i / rate) + 0.02 * (r() * 2 - 1); }
  }
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(a[i] * 30000))), 44 + i * 2);
  fs.writeFileSync(datei, buf);
  return noten;
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'songs-'));
const dKlar = path.join(tmp, 'Testsong klar.wav'), dMix = path.join(tmp, 'Testsong Mix.wav');
const wahr = { 'Testsong klar': wav(dKlar, false, 7), 'Testsong Mix': wav(dMix, true, 99) };

(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) { localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); } localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [];
  const ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  await p.screenshot({ path: ordner + '/sr-hub.png' });
  await p.click('#hubSongs'); await p.waitForTimeout(900);
  ck('Song-Rätsel ist eine eigene App', await p.evaluate(() => $('screen-songs').classList.contains('active') && !$('ton-song').hidden));

  // 1) Wie geht's weiter? – eingebaute Lieder, Leicht, immer richtig
  await p.screenshot({ path: ordner + '/sr-menue.png', fullPage: true });
  await p.click('#srLos');
  for (let i = 0; i < 5; i++) {
    await p.waitForSelector('#srOk', { timeout: 8000 });
    await p.waitForTimeout(300);
    const pc = await p.evaluate(() => ((Math.round(sr.runden[sr.i].ziel) % 12) + 12) % 12);
    await p.click('.gb-taste[data-n="' + pc + '"]');
    if (i === 0) await p.screenshot({ path: ordner + '/sr-weiter.png', fullPage: true });
    await p.click('#srOk'); await p.waitForTimeout(150);
    if (i === 0) await p.screenshot({ path: ordner + '/sr-weiter-urteil.png', fullPage: true });
    await p.click('#srWeiter');
  }
  await p.waitForTimeout(300);
  const e1 = await p.evaluate(() => $('ton-song').innerText);
  ck('Weiter (Lieder): richtig getippt = 50/50', /50 \/ 50/.test(e1), e1.split('\n')[1]);
  await p.screenshot({ path: ordner + '/sr-ende.png', fullPage: true });

  // 2) Rückwärts – Profi (6 Antworten, transponiert)
  await p.click('#srZurMenue'); await p.waitForTimeout(300);
  await p.click('[data-m="rueck"]'); await p.waitForTimeout(300);
  await p.click('[data-s="profi"]'); await p.click('#srLos');
  let opt6 = true;
  for (let i = 0; i < 5; i++) {
    await p.waitForSelector('[data-o]', { timeout: 8000 }); await p.waitForTimeout(300);
    const info = await p.evaluate(() => { const R = sr.runden[sr.i]; return { i: R.optionen.indexOf(R.richtig), n: R.optionen.length, dauer: R.klang.duration, gehoert: R.gehoert }; });
    if (info.n !== 6 || !(info.dauer > 2)) opt6 = false;
    if (i === 0) await p.screenshot({ path: ordner + '/sr-rueck.png', fullPage: true });
    await p.click('[data-o="' + info.i + '"]'); await p.waitForTimeout(100);
    await p.click('#srWeiter');
  }
  await p.waitForTimeout(300);
  const e2 = await p.evaluate(() => $('ton-song').innerText);
  ck('Rückwärts (Profi): 6 Antworten, Ausschnitt > 2 s', opt6);
  ck('Rückwärts: sofort richtig = 50/50', /50 \/ 50/.test(e2), e2.split('\n')[1]);

  // 3) Eigene Songs hochladen
  await p.click('#srZurMenue'); await p.waitForTimeout(300);
  await p.setInputFiles('#srDatei', [dKlar, dMix]);
  await p.waitForFunction(() => /hinzugefügt/.test(($('srStatus') || {}).textContent || ''), null, { timeout: 15000 });
  const liste = await p.evaluate(() => [...document.querySelectorAll('.sr-liste li span')].map((x) => x.textContent));
  ck('2 Songs hinzugefügt', liste.length === 2, liste.join(', '));
  await p.screenshot({ path: ordner + '/sr-eigene.png', fullPage: true });

  // 4) Tonerkennung bei eigenen Songs gegen die Wahrheit
  await p.click('[data-m="weiter"]'); await p.waitForTimeout(300);
  await p.click('[data-q="eigen"]'); await p.waitForTimeout(300);
  const treffer = { 'Testsong klar': [0, 0, 0], 'Testsong Mix': [0, 0, 0] };   // richtig, falsch, nicht gefunden
  for (let lauf = 0; lauf < 3; lauf++) {
    await p.click('#srLos');
    for (let i = 0; i < 5; i++) {
      await p.waitForSelector('#srOk, #srWeiter', { timeout: 20000 }); await p.waitForTimeout(200);
      const R = await p.evaluate(() => { const R = sr.runden[sr.i]; return { name: R.eigen.name, stopp: R.stopp || null, ziel: R.ziel || null }; });
      if (!R.stopp) { treffer[R.name][2]++; await p.click('#srWeiter'); continue; }
      const note = wahr[R.name].find((x) => R.stopp + 0.12 >= x.t && R.stopp + 0.12 < x.t + x.d);
      const ok = note && ((Math.round(R.ziel) - note.m) % 12 === 0);
      treffer[R.name][ok ? 0 : 1]++;
      const pc = ((note.m % 12) + 12) % 12;
      await p.click('.gb-taste[data-n="' + pc + '"]'); await p.click('#srOk'); await p.waitForTimeout(80);
      if (lauf === 0 && i === 0) await p.screenshot({ path: ordner + '/sr-eigen-urteil.png', fullPage: true });
      await p.click('#srWeiter');
    }
    await p.waitForSelector('#srZurMenue'); await p.click('#srZurMenue'); await p.waitForTimeout(300);
  }
  const k = treffer['Testsong klar'], m = treffer['Testsong Mix'];
  console.log('  Tonerkennung klar: ' + k[0] + ' richtig, ' + k[1] + ' falsch, ' + k[2] + ' ohne Ton · Mix (Bass + Rauschen): ' + m[0] + ' richtig, ' + m[1] + ' falsch, ' + m[2] + ' ohne Ton');
  ck('Tonerkennung (klarer Song) ≥ 90 % richtig', k[0] + k[1] > 0 && k[0] / (k[0] + k[1]) >= 0.9);
  ck('Tonerkennung (Mix) ≥ 70 % richtig', m[0] + m[1] > 0 && m[0] / (m[0] + m[1]) >= 0.7);

  // 5) Rückwärts mit eigenen Songs
  await p.click('[data-m="rueck"]'); await p.waitForTimeout(300); await p.click('#srLos');
  await p.waitForSelector('[data-o]', { timeout: 15000 });
  const ro = await p.evaluate(() => sr.runden[sr.i].optionen.slice().sort().join(','));
  ck('Rückwärts mit eigenen Songs: Antworten = Songnamen', ro === 'Testsong Mix,Testsong klar', ro);

  // 6) Verlauf + bleibt nach Neuladen
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'songs').length);
  ck('Verlaufseinträge Song-Rätsel', vl >= 5, vl + ' Einträge');
  await p.reload(); await p.waitForTimeout(900);
  await p.click('#hubSongs'); await p.waitForTimeout(900);
  const nach = await p.evaluate(() => document.querySelectorAll('.sr-liste li').length);
  ck('Songs bleiben nach Neuladen gespeichert', nach === 2);
  await p.click('[data-weg]'); await p.waitForTimeout(400);
  ck('Song entfernen', (await p.evaluate(() => document.querySelectorAll('.sr-liste li').length)) === 1);
  // Verweis im Ton-Gedächtnis führt zur App, Zurück-Knopf zum Hub
  await p.click('#srAppZurueck'); await p.waitForTimeout(600);
  ck('Zurück führt zur Startseite', await p.evaluate(() => $('screen-hub').classList.contains('active')));
  await p.click('#hubToene'); await p.waitForTimeout(900); await p.click('[data-zu-songs]'); await p.waitForTimeout(600);
  ck('Verweis im Ton-Gedächtnis öffnet die App', await p.evaluate(() => $('screen-songs').classList.contains('active')));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  fs.rmSync(tmp, { recursive: true, force: true });
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
