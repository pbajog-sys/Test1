// Wundermuster: Fakten (Ameise 9.977, 27 → 111 Schritte/9.232, Drachenkurve), alle vier Spiele über die Oberfläche, Verlauf.
// Aufruf: python3 -m http.server 8765, dann  node tests/wunder.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);

  // ---------- Fakten ----------
  const f = await p.evaluate(() => {
    const c = coFolge(27), dr = drPunkte(12), kn = drKnicke(dr), k3 = drKnicke(drPunkte(3)).join('');
    // Faltfolge: zweite Hälfte = erste Hälfte rückwärts und vertauscht
    const h = (kn.length - 1) / 2, spiegel = kn.slice(h + 1).join('') === kn.slice(0, h).reverse().map((x) => (x === 'L' ? 'R' : 'L')).join('');
    const kleinste = (g) => { let best = [0, 0]; for (let n = 1; n < g; n++) { const s = coFolge(n).length - 1; if (s > best[1]) best = [n, s]; } return best; };
    return { c27: [c.length - 1, Math.max(...c)], punkte: dr.length, knicke: kn.length, ueber: drUeberlappt(dr), spiegel, k3,
      champs: [100, 1000, 10000].map((g) => kleinste(g).join('/')).join(' '), soll: Object.entries(WU_CHAMPS).map(([, v]) => v.join('/')).join(' '),
      bits: [biSpielt(8)[3], biSpielt(24)[3], biSpielt(9)[3], biSpielt(1)[0], biSpielt(2)[0], biSpielt(0)[8], biSpielt(10)[8], biSpielt(200)[7], biSpielt(100)[7]].join(',') };
  });
  ck('27 → 1: 111 Schritte, Gipfel 9.232', f.c27[0] === 111 && f.c27[1] === 9232, f.c27.join(' / '));
  ck('Rekord-Champions stimmen (97, 871, 6171)', f.champs === f.soll, f.champs);
  ck('Drache: 12 Faltungen = 4.096 Teilstücke, 4.095 Knicke', f.punkte === 4097 && f.knicke === 4095);
  ck('Drache: Knick-Code ist die Papierfalt-Folge (Spiegel-Regel)', f.spiegel, 'n=3: ' + f.k3);
  ck('Drache: keine Strecke doppelt', f.ueber === false);
  ck('Binär: Snare bei 8/24, Shaker auf ungeraden, Kick 0/10, Wobble ab 128', f.bits === 'true,true,false,true,false,true,true,true,false', f.bits);

  // ---------- Menü ----------
  await p.click('#hubWunder'); await p.waitForTimeout(900);
  await bild('wu-menue');
  ck('Menü mit vier Mustern', (await p.$$('.wu-modus')).length === 4);

  // ---------- Ameise ----------
  await p.click('[data-modus="ameise"]'); await p.waitForTimeout(300);
  await p.click('#amFrage [data-o="2"]'); await p.click('#wuWeiter'); await p.waitForTimeout(2500);
  const s1 = await p.evaluate(() => wu.schritt);
  ck('Ameise läuft am Anfang langsam', s1 > 5 && s1 < 60, s1 + ' Schritte nach 2,5 s');
  await p.evaluate(() => { while (wu.schritt < 3000) amSchritt(); }); await p.waitForTimeout(700); await bild('wu-ameise-chaos');
  ck('Ameise: nach 3.000 Schritten Phase „Chaos“', /Chaos/.test(await p.textContent('#amChips')));
  await p.evaluate(() => { while (wu.autobahn < 0) amSchritt(); for (let i = 0; i < 1200; i++) amSchritt(); }); await p.waitForTimeout(900); await bild('wu-ameise-autobahn');
  const ab = await p.evaluate(() => wu.autobahn);
  ck('Ameise: Autobahn ab Schritt 9.977 erkannt', ab === 9977, String(ab));
  await p.evaluate(() => { while (!wu.fertig) amSchritt(); });
  await p.waitForSelector('.ft-ergebnis', { timeout: 4000 });
  ck('Ameise: Ergebniskarte nennt 9.977', /9\.977/.test(await p.textContent('.ft-karte')));
  await p.click('.ft-ergebnis [data-k="0"]'); await p.waitForTimeout(200); await p.click('[data-r="LLRR"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { for (let i = 0; i < 12000; i++) amSchritt(); }); await p.waitForTimeout(800); await bild('wu-ameise-llrr');
  const sym = await p.evaluate(() => { const w = wu; let gleich = 0, alle = 0; for (let y = w.minY; y <= w.maxY; y++) for (let x = w.minX; x <= w.maxX; x++) { const a = w.g[y * w.N + x]; if (!a) continue; alle++; } return { alle, regel: w.regel }; });
  ck('Andere Regel (LLRR) läuft', sym.regel === 'LLRR' && sym.alle > 100, sym.alle + ' Felder');
  await p.click('#wuZurueck'); await p.waitForTimeout(300);

  // ---------- Binär-Beat ----------
  await p.click('[data-modus="binaer"]'); await p.waitForTimeout(300);
  await p.click('#biHoeren'); await p.waitForTimeout(2200);
  const n1 = await p.evaluate(() => wu.n);
  ck('Binär: zählt im Takt (140 BPM, 16tel ≈ 9,3 pro s)', n1 >= 14 && n1 <= 22, n1 + ' nach 2,2 s');
  await p.evaluate(() => { wu.start -= 7.3; }); await p.waitForTimeout(600); await bild('wu-binaer');
  await p.evaluate(() => { ftAk.stumm = true; wu.start -= 30; });
  await p.waitForSelector('.ft-ergebnis', { timeout: 5000 });
  ck('Binär: bei 255 alle Bits an, Ergebniskarte', /11111111/.test(await p.textContent('.ft-karte')) && (await p.$$('#biBits .bi-bit.an')).length === 8);
  await p.evaluate(() => { ftAk.stumm = false; });
  await p.click('.ft-ergebnis [data-k="0"]'); await p.waitForTimeout(300);
  for (let r = 0; r < 10; r++) {
    const z = await p.evaluate(() => ({ ziel: wu.ziel, bauen: wu.runde % 2 === 0 }));
    if (z.bauen) { for (let k = 0; k < 8; k++) if (z.ziel & (1 << k)) await p.click('#biQBits [data-k="' + k + '"]'); if (r === 0) await bild('wu-binaer-quiz'); await p.click('#biPruefen'); }
    else await p.click('#biQUnten [data-x="' + z.ziel + '"]');
    await p.click('#biNaechste'); await p.waitForTimeout(80);
  }
  await p.waitForSelector('.ft-ergebnis', { timeout: 3000 });
  ck('Binär-Quiz: 10 von 10', /10<\/b> von 10|10 von 10/.test(await p.innerText('.ft-karte')));
  await p.click('.ft-ergebnis [data-k="2"]'); await p.waitForTimeout(300);

  // ---------- Drachen-Streifen ----------
  await p.click('[data-modus="drache"]'); await p.waitForTimeout(300);
  await p.click('#drFrage [data-o="2"]'); await p.click('#wuWeiter'); await p.waitForTimeout(300);
  await p.click('#drAuf'); await p.waitForTimeout(350); await bild('wu-drache-mitte');
  await p.waitForTimeout(600); await p.click('#drAuto');
  await p.waitForSelector('#drFrage2 .gl-opt', { timeout: 15000 });
  await p.waitForTimeout(500); await bild('wu-drache-12');
  ck('Drache: 12-mal aufgefaltet → 4.096', (await p.textContent('#drZahl')).includes('4.096'));
  await p.click('#drFrage2 [data-o="2"]'); await p.click('#wuWeiter'); await p.waitForTimeout(200);
  await p.click('[data-kopien="4"]'); await p.waitForTimeout(1500); await bild('wu-drache-4');
  ck('Drache: Auswahl 1/2/4 Streifen erscheint', await p.isVisible('#drKopien'));
  await p.click('#wuZurueck'); await p.waitForTimeout(300);

  // ---------- 27 → 1 ----------
  await p.click('[data-modus="collatz"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { const s = $('coSchieber'); s.value = 68; s.dispatchEvent(new Event('input')); });
  ck('Collatz: Schieber zeigt Schätzung', /1[01]\d Schritte/.test(await p.textContent('#coWahl')), await p.textContent('#coWahl'));
  await p.click('#coLos'); await p.click('#coSchnell'); await p.click('#coSchnell');
  await p.waitForSelector('#coFrage .gl-opt', { timeout: 10000 });
  await bild('wu-collatz-frage');
  ck('Collatz: Zwischenfrage bei Schritt 22', (await p.textContent('#coSchritte')) === '22');
  await p.click('#coFrage [data-o="2"]'); await p.click('#wuWeiter');
  await p.waitForFunction(() => wu && wu.max === 9232, null, { timeout: 15000 }); await p.waitForTimeout(400); await bild('wu-collatz-gipfel');
  await p.waitForSelector('.ft-ergebnis', { timeout: 15000 });
  ck('Collatz: Ziel nach 111 Schritten', (await p.textContent('#coSchritte')) === '111' && /111 Schritte/.test(await p.textContent('.ft-karte')));
  await p.click('.ft-ergebnis [data-k="0"]'); await p.waitForTimeout(300);
  await p.fill('#coZahl', '97'); await p.click('#coProbier');
  await p.waitForSelector('.co-rekord.ok', { timeout: 15000 });
  await bild('wu-collatz-jagd');
  ck('Rekordjagd: 97 ist Champion unter 100', /97 → 118/.test(await p.textContent('.co-rekord.ok')));

  // ---------- Verlauf, Navigation, Fehler ----------
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'wunder').map((e) => e.x.modus + ':' + e.p + '/' + e.m).join(', '));
  ck('Verlauf: Ameise, Binär-Quiz, Drache, Collatz', vl === 'ameise:1/1, binaer:10/10, drache:2/2, collatz:3/3', vl);
  await p.click('#wuZurueck'); await p.waitForTimeout(200); await p.click('#wuZurueck'); await p.waitForTimeout(600);
  ck('Zurück zum Start, Beat aus', await p.evaluate(() => $('screen-hub').classList.contains('active') && !(ftAk && ftAk.takt) && !wuSeq));
  ck('Hub zeigt 4 von 4', /4 von 4/.test(await p.textContent('#hubWunderBest')), await p.textContent('#hubWunderBest'));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
