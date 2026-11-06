// Zahlen-Musik (27 → 1 mit eigenen Zahlen): Eingabe, Tonhöhen, Abspielen im Takt, mehrere Stimmen, Ende, Übernahme ins Beat-Studio.
// Aufruf: python3 -m http.server 8765, dann  node tests/zahlenmusik.test.js [Bilderordner]
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

  const f = await p.evaluate(() => ({
    lesen: coZahlenLesen('27, 97;871 x 0 2000000000000 5').join(','),
    tiefsterTon: coMusikTon(1, 9232, 'penta', 0), hoechsterTon: coMusikTon(9232, 9232, 'penta', 0),
    steigt: [1, 2, 4, 16, 100, 1000, 9232].map((v) => coMusikTon(v, 9232, 'dur', 0)).every((m, i, a) => !i || m >= a[i - 1]),
    riese: coFolge(63728127).length - 1, grossOk: coFolge(1e12).length > 1 && coFolge(1e12).every(Number.isSafeInteger),
  }));
  ck('Eingabe: bis zu 3 Zahlen, 0 und zu große werden ignoriert', f.lesen === '27,97,871', f.lesen);
  ck('Tonhöhe: 1 ist der Grundton, der Gipfel 2½ Oktaven höher, steigt mit dem Wert', f.tiefsterTon === 55 && f.hoechsterTon - f.tiefsterTon >= 28 && f.hoechsterTon - f.tiefsterTon <= 31 && f.steigt, f.tiefsterTon + ' … ' + f.hoechsterTon);
  ck('Große Zahlen: 63.728.127 (949 Schritte), 1 Billion ohne Überlauf', f.riese === 949 && f.grossOk, String(f.riese));

  // ---------- Oberfläche ----------
  await p.evaluate(() => wuOeffnen()); await p.waitForTimeout(300);
  await p.click('[data-modus="collatz"]'); await p.click('#coMusikBtn'); await p.waitForTimeout(200);
  await p.fill('#coMZahlen', '27'); await p.evaluate(() => { const s = $('coMTempo'); s.value = 160; s.dispatchEvent(new Event('input')); });
  ck('Vorschau: Schritte, Gipfel, Dauer', /111 Schritte, Gipfel 9\.232/.test(await p.textContent('#coMInfo')) && /160 BPM/.test(await p.textContent('#coMTempoW')), await p.textContent('#coMInfo'));
  await bild('zm-intro');
  await p.click('#coMLos'); await p.waitForTimeout(2000);
  const i1 = await p.evaluate(() => wu.i);
  ck('Spielt im Takt (160 BPM = 5,3 Achtel pro s)', i1 >= 8 && i1 <= 12, i1 + ' Schritte nach 2 s');
  await p.evaluate(() => { wu.start -= 13; }); await p.waitForTimeout(500); await bild('zm-27');
  await p.evaluate(() => { ftAk.stumm = true; wu.start -= 60; });
  await p.waitForSelector('.ft-ergebnis', { timeout: 5000 });
  ck('Ende: 27 → 111 Schritte, Gipfel 9.232', /111 Schritte, Gipfel 9\.232/.test(await p.textContent('.ft-karte')));
  await p.evaluate(() => { ftAk.stumm = false; });
  // Trio
  await p.click('.ft-ergebnis [data-k="1"]'); await p.waitForTimeout(200);
  await p.click('.co-vorschlaege [data-z="97, 871, 703"]'); await p.click('#coMLos'); await p.waitForTimeout(600);
  await p.evaluate(() => { wu.start -= 14; }); await p.waitForTimeout(600); await bild('zm-trio');
  ck('Trio: drei Stimmen', await p.evaluate(() => wu.folgen.length === 3 && wu.laenge === 179 && wu.i > 80), await p.evaluate(() => wu.i + ' / ' + wu.laenge));
  await p.evaluate(() => { ftAk.stumm = true; wu.start -= 60; });
  await p.waitForSelector('.ft-ergebnis', { timeout: 5000 });
  ck('Trio-Ende: alle drei aufgeführt', /97.*118 Schritte/.test(await p.textContent('.ft-karte')) && /871.*178 Schritte/.test(await p.textContent('.ft-karte')));
  await p.evaluate(() => { ftAk.stumm = false; });
  // Ins Beat-Studio
  await p.click('.ft-ergebnis [data-k="2"]'); await p.waitForTimeout(600);
  const s = await p.evaluate(() => ({ aktiv: $('screen-studio').classList.contains('active'), name: st.p.name, bpm: st.p.bpm, lead: st.p.muster.map((m) => m.lead.filter((x) => x != null).length).join('/'), ak: st.p.muster[0].chords.filter((x) => x != null).length, kick: st.p.muster[0].kick.filter(Boolean).length, tab: st.tab }));
  ck('Ins Beat-Studio: Melodie in A–D, Akkorde, Beat, halbes Tempo', s.aktiv && s.name === 'Zahl 97+871+703' && s.lead === '16/16/16/16' && s.ak === 4 && s.kick === 4 && s.bpm === 80 && s.tab === 'melodie', JSON.stringify(s));
  await bild('zm-studio');
  await p.click('#stZurueck'); await p.waitForTimeout(400);
  // Aus der Rekordjagd mit Zahl hinüber
  await p.evaluate(() => { wuOeffnen(); }); await p.click('[data-modus="collatz"]'); await p.click('#coJagd');
  await p.fill('#coZahl', '6171'); await p.click('#coZurMusik'); await p.waitForTimeout(200);
  ck('Rekordjagd → Musik übernimmt die Zahl', (await p.inputValue('#coMZahlen')) === '6171');
  await p.click('#wuZurueck'); await p.waitForTimeout(200);
  ck('Zurück führt zu 27 → 1', !!(await p.$('#coMusikBtn')));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
