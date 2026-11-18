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
  ck('Vorschau: Schritte, Gipfel, Dauer', /111 Schritten, Gipfel 9\.232/.test(await p.textContent('#coMInfo')) && /160 BPM/.test(await p.textContent('#coMTempoW')), await p.textContent('#coMInfo'));
  await bild('zm-intro');
  await p.click('#coMLos'); await p.waitForTimeout(2000);
  const i1 = await p.evaluate(() => wu.i);
  ck('Spielt im Takt (160 BPM = 5,3 Achtel pro s)', i1 >= 8 && i1 <= 12, i1 + ' Schritte nach 2 s');
  await p.evaluate(() => { wu.start -= 13; }); await p.waitForTimeout(500); await bild('zm-27');
  await p.evaluate(() => { ftAk.stumm = true; wu.start -= 60; });
  await p.waitForSelector('.ft-ergebnis', { timeout: 5000 });
  ck('Ende: 27 → 111 Schritte, Gipfel 9.232', /111 Schritten, Gipfel 9\.232/.test(await p.textContent('.ft-karte')));
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

  // ---------- Eigene Regeln ----------
  const rg = await p.evaluate(() => {
    const R = (b, m = 2, a = { op: '÷', k: 2, c: 0 }) => ({ m, a, b });
    const t = (n, r) => { const e = coFolgeRegel(n, r); return e.ende + ':' + (e.zyklus ? e.zyklus.join('>') : e.f.length - 1); };
    return {
      gleich: [1, 2, 27, 97, 871, 6171, 63728127].every((n) => coFolgeRegel(n, CO_STANDARD).f.join() === coFolge(n).join()) && coFolgeRegel(27, CO_STANDARD).ende === 'eins',
      minus: t(5, R({ op: '×−', k: 3, c: 1 })), minus17: coFolgeRegel(17, R({ op: '×−', k: 3, c: 1 })).zyklus.length - 1,
      fuenf13: t(13, R({ op: '×+', k: 5, c: 1 })), fuenf7: coFolgeRegel(7, R({ op: '×+', k: 5, c: 1 })).ende,
      plus: t(27, R({ op: '+', k: 1, c: 1 })), dreier: coFolgeRegel(100, R({ op: '+', k: 1, c: 1 }, 3, { op: '÷', k: 3, c: 0 })).ende,
      unter: coFolgeRegel(3, R({ op: '−', k: 1, c: 5 })).ende, kaputt: JSON.stringify(coRegelSauber({ m: 77, a: { op: 'x', k: -3 }, b: null })) === JSON.stringify(CO_STANDARD),
    };
  });
  ck('Standard-Regel = Collatz wie bisher', rg.gleich);
  ck('3n−1: 5 landet in der Schleife 5→14→7→20→10→5, 17 in einer 18er-Schleife', rg.minus === 'zyklus:5>14>7>20>10>5' && rg.minus17 === 18, rg.minus + ' / ' + rg.minus17);
  ck('5n+1: 13 Schleife, 7 läuft davon', /^zyklus:13>66>33/.test(rg.fuenf13) && rg.fuenf7 === 'davon', rg.fuenf13 + ' / ' + rg.fuenf7);
  ck('+1 statt ×3 und Dreier erreichen die 1, −5 fällt unter 1, kaputte Regel → Standard', rg.plus.startsWith('eins') && rg.dreier === 'eins' && rg.unter === 'null' && rg.kaputt, rg.plus);
  await p.click('#coMusikBtn'); await p.waitForTimeout(200);
  await p.click('[data-variante="1"]'); await p.waitForTimeout(200);
  ck('Variante „3n − 1“ setzt Regel und Zahlen, Vorschau zeigt die Schleife', (await p.inputValue('#coMZahlen')) === '5, 17' && (await p.inputValue('#coRegel [data-r="b-op"]')) === '×−' && /Schleife aus 5 Zahlen: 5 → 14 → 7 → 20 → 10 → 5/.test(await p.textContent('#coMInfo')), await p.textContent('#coMInfo'));
  await bild('zm-regel');
  // selbst ändern: sonst ×5+1
  await p.selectOption('#coRegel [data-r="b-op"]', '×+'); await p.fill('#coRegel [data-r="b-k"]', '5'); await p.fill('#coMZahlen', '13');
  await p.dispatchEvent('#coMZahlen', 'input');
  ck('Eigene Regel ×5+1: Vorschau aktualisiert', /Schleife aus 10 Zahlen/.test(await p.textContent('#coMInfo')), await p.textContent('#coMInfo'));
  await p.selectOption('#coRegel [data-r="a-op"]', '+');
  ck('Felder passen sich an (bei „+ c“ kein k)', await p.evaluate(() => document.querySelector('#coRegel [data-r="a-k"]').parentNode.hidden && !document.querySelector('#coRegel [data-r="a-c"]').parentNode.hidden));
  await p.selectOption('#coRegel [data-r="a-op"]', '÷');
  await p.click('#coMLos'); await p.waitForTimeout(400);
  ck('Beim Spielen stehen die eigenen Regeln oben', (await p.textContent('#coU')) === 'ungerade ×5+1' && (await p.textContent('#coG')) === 'gerade ÷2');
  await p.evaluate(() => { wu.start -= 1.5; }); await p.waitForTimeout(500); await bild('zm-regel-spiel');
  await p.evaluate(() => { ftAk.stumm = true; wu.start -= 60; });
  await p.waitForSelector('.ft-ergebnis', { timeout: 5000 });
  ck('Ergebnis nennt Regel und Schleife', /Regel: gerade ÷2 · ungerade ×5\+1/.test(await p.textContent('.ft-karte')) && /Schleife aus 10 Zahlen/.test(await p.textContent('.ft-karte')));
  ck('Regel bleibt gespeichert', await p.evaluate(() => { const r = loadJson(WU_KEY).collatz.musik.regel; return r.b.op === '×+' && r.b.k === 5; }));
  ck('Rekorde zählen nur mit der echten Collatz-Regel', await p.evaluate(() => !loadJson(WU_KEY).collatz.funde[100] || loadJson(WU_KEY).collatz.funde[100][0] !== 13));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
