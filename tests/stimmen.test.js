// Stimmgerät: Tonhöhen-Genauigkeit (YIN) an künstlichen Klängen von 41 Hz bis 1,3 kHz, dann echter Durchlauf mit
// simuliertem Mikrofon (WAV: gezupftes A2 um −20 Cent verstimmt, dann sauberes e′ = E4), Saiten, Sperre, Kammerton.
// Aufruf: python3 -m http.server 8765, dann  node tests/stimmen.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const ordner = process.argv[2] || '.';
function wav() {
  const rate = 48000, teile = [[110 * 2 ** (-20 / 1200), 3.2], [0, 0.4], [329.63, 3.2], [0, 0.4]], n = Math.round(teile.reduce((s, t) => s + t[1], 0) * rate), d = new Float32Array(n);
  let s = 3; const zuf = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let o = 0;
  for (const [f, dauer] of teile) {
    const len = Math.round(dauer * rate);
    if (f) for (let i = 0; i < len; i++) { const t = i / rate, h = Math.exp(-t * 0.9); d[o + i] = 0.35 * h * (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(4 * Math.PI * f * t) + 0.3 * Math.sin(6 * Math.PI * f * t) + 0.15 * Math.sin(8 * Math.PI * f * t)) + (zuf() - 0.5) * 0.004; }
    o += len;
  }
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(d[i] * 30000))), 44 + i * 2);
  return buf;
}
(async () => {
  const datei = path.join(os.tmpdir(), 'stimmen-test.wav'); fs.writeFileSync(datei, wav());
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + datei] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', permissions: ['microphone'] });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);

  // ---------- Genauigkeit ----------
  const gen = await p.evaluate(() => {
    let s = 7; const zuf = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return [41.2, 55, 65.41, 82.41, 110 * 2 ** (-20 / 1200), 146.83, 196, 246.94, 329.63, 440, 659.25, 1318.5].map((f) => {
      const rate = f > 500 ? 48000 : 24000, x = new Float32Array(4096);
      for (let i = 0; i < x.length; i++) { const t = i / rate; x[i] = 0.3 * (Math.sin(2 * Math.PI * f * t) + 0.6 * Math.sin(4 * Math.PI * f * t + 1) + 0.3 * Math.sin(6 * Math.PI * f * t + 2)) + (zuf() - 0.5) * 0.01; }
      const r = f > 500 ? sgYin(x, rate, 400, 2000) : sgYin(x, rate, 35, 1600);
      return { f, cent: r ? Math.round(1200 * Math.log2(r.f / f) * 100) / 100 : null };
    });
  });
  ck('YIN: 41 Hz bis 1,3 kHz auf ±2 Cent (auch mit Obertönen)', gen.every((g) => g.cent !== null && Math.abs(g.cent) <= 2), gen.map((g) => Math.round(g.f) + ':' + g.cent).join(' '));
  ck('Stille wird nicht als Ton erkannt', await p.evaluate(() => sgYin(new Float32Array(4096), 24000) === null));

  // ---------- Über Noten & Griffe öffnen ----------
  await p.evaluate(() => instrumentWaehlen('gitarre')); await p.waitForTimeout(400);
  const knopf = await p.$('#instWahl button:last-child');
  ck('Noten & Griffe: Punkt „Stimmen“ in der Instrument-Auswahl', /Stimmen/.test(await knopf.textContent()));
  await knopf.click(); await p.waitForTimeout(500);
  ck('… öffnet das Stimmgerät mit Gitarre', await p.evaluate(() => $('screen-stimmen').classList.contains('active') && sg.inst === 'gitarre' && document.querySelectorAll('#sgSaiten [data-saite]').length === 6));

  // ---------- Mit simuliertem Mikrofon ----------
  await p.click('#sgStart');
  const zust = await p.evaluate(() => new Promise((ok) => { const l = []; const t = setInterval(() => { if (sg.anzeige) l.push([sg.anzeige.ziel.saite, Math.round(sg.anzeige.cent * 10) / 10]); }, 120); setTimeout(() => { clearInterval(t); ok(l); }, 9000); }));
  const aWerte = zust.filter((z) => z[0] === 1).map((z) => z[1]), eWerte = zust.filter((z) => z[0] === 5).map((z) => z[1]);
  const med = (l) => l.slice().sort((a, b) => a - b)[Math.floor(l.length / 2)];
  ck('A-Saite erkannt, −20 Cent (±3)', aWerte.length > 5 && Math.abs(med(aWerte) + 20) <= 3, aWerte.length + ' Messungen, Median ' + med(aWerte));
  ck('Hohe e-Saite erkannt, gestimmt (±3 Cent)', eWerte.length > 5 && Math.abs(med(eWerte)) <= 3, eWerte.length + ' Messungen, Median ' + med(eWerte));
  ck('e-Saite bekommt ✓, A-Saite nicht', await p.evaluate(() => sg.gestimmt[5] === true && !sg.gestimmt[1] && document.querySelector('#sgSaiten [data-saite="5"]').classList.contains('ok')));
  await p.waitForFunction(() => sg.anzeige && sg.anzeige.ziel.saite === 1, null, { timeout: 5000 }); await p.waitForTimeout(500);
  await bild('sg-gitarre');
  // Saite sperren: D gewählt, A erklingt → „viel zu hoch“
  await p.click('#sgSaiten [data-saite="2"]');
  await p.waitForFunction(() => sg.anzeige && sg.anzeige.ziel.saite === 2 && sg.verlauf.length && Math.abs(69 + 12 * Math.log2(sg.anzeige.f / sg.a4) - 45) < 0.5, null, { timeout: 8000 });
  ck('Saite gesperrt (D): A klingt → „viel zu tief“', /viel zu tief/.test(await p.textContent('#sgHz')) && /🔒/.test(await p.textContent('#sgSaiten')));
  await p.click('#sgSaiten [data-saite="2"]');
  // chromatisch und Kammerton
  await p.click('[data-inst="chromatisch"]'); await p.waitForTimeout(300);
  ck('Chromatisch: Wechsel lässt das Mikrofon an', await p.evaluate(() => sg.an && !document.getElementById('sgSaiten')));
  await p.waitForFunction(() => sg.anzeige && Math.abs(sg.anzeige.f - 329.6) < 3, null, { timeout: 8000 });
  ck('Chromatisch: E4 erkannt', (await p.textContent('#sgNote')) === 'E' && /E4/.test(await p.textContent('#sgHz')), await p.textContent('#sgHz'));
  await bild('sg-chromatisch');
  await p.click('[data-a4="1"]'); await p.click('[data-a4="1"]');
  await p.waitForFunction(() => sg.anzeige && Math.abs(sg.anzeige.f - 329.6) < 3 && sg.a4 === 442, null, { timeout: 8000 }); await p.waitForTimeout(400);
  const c442 = await p.evaluate(() => sg.anzeige.cent), gespeichert = await p.evaluate(() => loadJson('walquiz.stimmen.v1').kammerton);
  ck('Kammerton 442 Hz: E4 (für 440 gestimmt) ist knapp 8 Cent zu tief', c442 < -5 && c442 > -11 && gespeichert === 442, c442.toFixed(1));
  // Referenzton stoppt das Mikrofon
  await p.click('#sgRef'); await p.waitForTimeout(200);
  ck('Referenzton: Mikrofon pausiert, Ton läuft', await p.evaluate(() => !sg.an && !sg.stream && ftAk && ftAk.c.state === 'running') && /🔊/.test(await p.textContent('#sgHz')));
  await p.click('#sgZurueck'); await p.waitForTimeout(500);
  ck('Zurück zum Start, Hub zeigt letzte Wahl', await p.evaluate(() => $('screen-hub').classList.contains('active')) && /Chromatisch · a′ = 442 Hz/.test(await p.textContent('#hubStimmenBest')), await p.textContent('#hubStimmenBest'));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
