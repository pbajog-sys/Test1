// Beat-Bahnen: Einsatz-Erkennung (synthetisch), Charts der eigenen Songs, komplette Durchläufe über die Oberfläche
// (Tasten werden im Seitenkontext genau zur Notenzeit gedrückt), eigener Song per Datei-Upload, Verlauf.
// Aufruf: python3 -m http.server 8765, dann  node tests/beat.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const ordner = process.argv[2] || '.';

// WAV mit gezupften Tönen zu bekannten Zeiten (44,1 kHz, Stereo) – Zeiten werden zurückgegeben
function testWav() {
  const rate = 44100, dauer = 24, n = rate * dauer, d = new Float32Array(n);
  let s = 7; const zuf = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const zeiten = []; let t = 1.0;
  while (t < dauer - 1) { zeiten.push(t); t += 0.22 + zuf() * 0.6; }
  for (let i = 0; i < n; i++) d[i] = (zuf() * 2 - 1) * 0.004 + 0.03 * Math.sin(2 * Math.PI * 110 * i / rate);   // Rauschen + Brummton
  zeiten.forEach((z, k) => {
    const f = [196, 330, 523, 880, 1320][k % 5], a = Math.round(z * rate), laut = 0.25 + zuf() * 0.35;
    for (let i = 0; i < rate * 0.35 && a + i < n; i++) { const e = Math.exp(-i / (rate * 0.06)); d[a + i] += laut * e * (Math.sin(2 * Math.PI * f * i / rate) + 0.3 * Math.sin(4 * Math.PI * f * i / rate)) + (i < 200 ? (zuf() * 2 - 1) * laut * 0.5 : 0); }
  });
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { const v = Math.max(-32768, Math.min(32767, Math.round(d[i] * 32767))); buf.writeInt16LE(v, 44 + i * 4); buf.writeInt16LE(v, 46 + i * 4); }
  return { buf, zeiten };
}

(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);

  // ---------- Charts der eingebauten Songs ----------
  const ch = await p.evaluate(() => BB_SONGS.map((s) => {
    const r = {};
    for (const st of ['leicht', 'mittel', 'schwer']) {
      const n = bbNoten(s, st), c = n.filter((x) => x.chart), s16 = 60 / s.bpm / 4;
      r[st] = { anzahl: c.length, bahnen: [0, 1, 2, 3].map((b) => c.filter((x) => x.bahn === b).length), raster: n.every((x) => Math.abs(x.t / s16 - Math.round(x.t / s16)) < 1e-9), sortiert: n.every((x, i) => !i || x.t >= n[i - 1].t), auto: n.filter((x) => !x.chart).length, ende: n[n.length - 1].t < BB_TAKTE * 16 * s16 };
    }
    return { id: s.id, r };
  }));
  ch.forEach(({ id, r }) => {
    ck('Chart ' + id + ': mehr Noten je Stufe (' + r.leicht.anzahl + ' / ' + r.mittel.anzahl + ' / ' + r.schwer.anzahl + ')', r.leicht.anzahl < r.mittel.anzahl && r.mittel.anzahl < r.schwer.anzahl && r.leicht.anzahl >= 40);
    ck('Chart ' + id + ': alle vier Bahnen belegt, Noten im Sechzehntel-Raster, sortiert', ['leicht', 'mittel', 'schwer'].every((st) => r[st].bahnen.every((x) => x > 3) && r[st].raster && r[st].sortiert && r[st].ende), JSON.stringify(r.mittel.bahnen));
    ck('Chart ' + id + ': Leicht spielt die übrigen Melodietöne selbst', r.leicht.auto > 0 && r.mittel.auto === 0);
  });

  // ---------- Einsatz-Erkennung an einem künstlichen Signal ----------
  const er = await p.evaluate(() => {
    let s = 3; const zuf = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const rate = 11025, n = rate * 30, x = new Float32Array(n), soll = [];
    for (let t = 0.8; t < 29; t += 0.18 + zuf() * 0.7) soll.push(t);
    for (let i = 0; i < n; i++) x[i] = (zuf() * 2 - 1) * 0.01 + 0.05 * Math.sin(2 * Math.PI * 80 * i / rate);
    soll.forEach((t, k) => { const a = Math.round(t * rate), f = 150 + (k * 377) % 1800, laut = 0.15 + zuf() * 0.5; for (let i = 0; i < rate * 0.3 && a + i < n; i++) x[a + i] += laut * Math.exp(-i / (rate * 0.05)) * Math.sin(2 * Math.PI * f * i / rate); });
    const ist = bbEinsaetze(x, rate);
    const abw = soll.map((t) => Math.min(...ist.map((e) => Math.abs(e.t - t))));
    const treffer = abw.filter((a) => a <= 0.035).length, falsch = ist.filter((e) => !soll.some((t) => Math.abs(e.t - t) <= 0.05)).length;
    const versatz = soll.map((t) => { const e = ist.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a)); return e.t - t; });
    return { soll: soll.length, treffer, falsch, mittel: versatz.reduce((a, b) => a + b, 0) / versatz.length };
  });
  ck('Erkennung: ≥ 90 % der Einsätze auf ±35 ms gefunden', er.treffer / er.soll >= 0.9, er.treffer + ' von ' + er.soll + ', mittlerer Versatz ' + Math.round(er.mittel * 1000) + ' ms');
  ck('Erkennung: höchstens 10 % Fehlalarme', er.falsch <= er.soll * 0.1, er.falsch + ' Fehlalarme');

  // ---------- Durchlauf über die Oberfläche: Neon-Sprint, Mittel, perfekt per Taste ----------
  await p.click('#hubBeat'); await p.waitForTimeout(900);
  await p.screenshot({ path: ordner + '/bb-intro.png' });
  const autoSpielen = () => p.evaluate(() => new Promise((fertig) => {
    // drückt im Seitenkontext jede Note per Tastatur-Ereignis, sobald ihre Zeit erreicht ist
    const erledigt = new Set();
    const schleife = () => {
      if (!bb || bb.fertig) { fertig(); return; }
      const t = bbJetzt();
      bb.noten.forEach((n, i) => { if (n.chart && !erledigt.has(i) && t >= n.t - 0.004) { erledigt.add(i); document.dispatchEvent(new KeyboardEvent('keydown', { key: BB_TASTEN[n.bahn], bubbles: true })); } });
      requestAnimationFrame(schleife);
    };
    schleife();
  }));
  await p.click('.bb-stufe[data-stufe="mittel"]'); await p.waitForTimeout(300);
  await p.click('.bb-song[data-song="neon"]');
  await p.waitForTimeout(3500); await p.screenshot({ path: ordner + '/bb-spiel.png' });
  await autoSpielen();
  await p.waitForSelector('.ft-ergebnis', { timeout: 8000 });
  await p.waitForTimeout(500); await p.screenshot({ path: ordner + '/bb-ergebnis.png' });
  const e1 = await p.evaluate(() => ({ z: bb.zaehler, sterne: bbErgebnis().sterne, ges: bbErgebnis().ges, combo: bb.maxCombo, punkte: bb.punkte }));
  ck('Neon-Sprint: alle Noten getroffen, 3 Sterne', e1.z[3] === 0 && e1.sterne === 3 && e1.combo === e1.ges, 'Perfekt/Gut/Okay/Verpasst ' + e1.z.join('/') + ', Serie ' + e1.combo + '/' + e1.ges);
  ck('Neon-Sprint: Takt hält – mind. 95 % „Perfekt“', e1.z[0] >= e1.ges * 0.95, e1.z[0] + ' von ' + e1.ges);
  ck('Punkte mit Serien-Faktor (mehr als 300 × Noten)', e1.punkte > 300 * e1.ges, String(e1.punkte));
  const best = await p.evaluate(() => loadJson(BB_KEY).best['neon|mittel']);
  ck('Rekord gespeichert', best && best.sterne === 3 && best.punkte === e1.punkte);

  // ---------- Nichts tippen: alles verpasst ----------
  await p.click('#bbAndere'); await p.waitForTimeout(300);
  await p.click('.bb-stufe[data-stufe="leicht"]'); await p.waitForTimeout(300);
  await p.click('.bb-song[data-song="sonne"]'); await p.waitForTimeout(400);
  await p.evaluate(() => { bb.start -= 60; });   // Zeitsprung ans Ende
  await p.waitForSelector('.ft-ergebnis', { timeout: 4000 });
  const e2 = await p.evaluate(() => ({ z: bb.zaehler, ges: bbErgebnis().ges, sterne: bbErgebnis().sterne }));
  ck('Ohne Tippen: alles verpasst, 0 Sterne, Rekord bleibt', e2.z[3] === e2.ges && e2.sterne === 0, e2.z.join('/'));
  ck('Urteil: Fenster 50/100/150 ms', await p.evaluate(() => [0, 0.049, 0.07, -0.12, 0.149, 0.2].map(bbUrteil).join(',') === '0,0,1,2,2,-1'));

  // ---------- Eigener Song per Datei ----------
  await p.click('#bbAndere'); await p.waitForTimeout(300);
  await p.click('.bb-stufe[data-stufe="mittel"]'); await p.waitForTimeout(300);
  const { buf, zeiten } = testWav(), datei = path.join(os.tmpdir(), 'beat-test-song.wav'); fs.writeFileSync(datei, buf);
  await p.setInputFiles('#bbDatei', datei);
  await p.waitForSelector('.bb-eigen', { timeout: 6000 });
  ck('Eigener Song erscheint in der Liste', /beat-test-song/.test(await p.textContent('.bb-eigen')));
  await p.click('.bb-eigen'); await p.waitForFunction(() => bb && bb.eigen, null, { timeout: 15000 });
  const ch2 = await p.evaluate((soll) => { const t = bb.noten.map((n) => n.t); const tr = soll.filter((s) => t.some((x) => Math.abs(x - s) <= 0.035)).length; return { n: t.length, tr, soll: soll.length, bahnen: [0, 1, 2, 3].map((b) => bb.noten.filter((n) => n.bahn === b).length) }; }, zeiten);
  ck('Eigener Song: Noten liegen auf den echten Einsätzen (±35 ms)', ch2.tr / ch2.soll >= 0.9 && ch2.n <= ch2.soll * 1.15, ch2.tr + ' von ' + ch2.soll + ' getroffen, ' + ch2.n + ' Noten, Bahnen ' + ch2.bahnen.join('/'));
  ck('Eigener Song: alle vier Bahnen genutzt', ch2.bahnen.every((x) => x > 0));
  await p.waitForTimeout(2600); await p.screenshot({ path: ordner + '/bb-eigen.png' });
  await autoSpielen();
  await p.waitForSelector('.ft-ergebnis', { timeout: 8000 });
  const e3 = await p.evaluate(() => ({ z: bb.zaehler, sterne: bbErgebnis().sterne }));
  ck('Eigener Song: komplett durchgespielt, 3 Sterne', e3.z[3] === 0 && e3.sterne === 3, e3.z.join('/'));
  await p.click('#bbNochmal'); await p.waitForTimeout(500);
  ck('„Nochmal“ startet denselben eigenen Song ohne neue Berechnung', await p.evaluate(() => !!(bb && bb.eigen && bb.quelle && !bb.fertig)));
  await p.click('#bbZurueck'); await p.waitForTimeout(300);
  ck('Zurück während des Songs → Auswahl, Song gestoppt', await p.evaluate(() => !!document.querySelector('.bb-song') && !bbTakt && (!bb || !bb.quelle)));

  // ---------- Verlauf, Hub, Fehler ----------
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'beat').map((e) => e.p + ':' + e.x.stufe));
  ck('Verlauf: drei Runden mit Stufe eingetragen', vl.length === 3 && vl[0] === '100:mittel' && vl[1] === '0:leicht', vl.join(', '));
  await p.click('#bbZurueck'); await p.waitForTimeout(600);
  ck('Hub zeigt gesammelte Sterne', /6 ★/.test(await p.textContent('#hubBeatBest')), await p.textContent('#hubBeatBest'));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
