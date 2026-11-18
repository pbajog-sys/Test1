// Zufalls-Gefühl · Rechenhilfe: Brüche/Parser, Baumdiagramm bauen (Vorlagen, Stufe wiederholen, Kugeln, eigene Äste),
// Treffer-Pfade, Gegenteil, Rechner, „als Tipp übernehmen“, Markierung im Ergebnis.
// Aufruf: python3 -m http.server 8765, dann  node tests/zfrechen.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png', fullPage: false });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  const parse = await p.evaluate(() => [['1/6', '1/6'], ['0,5', '1/2'], ['30 %', '3/10'], ['30', '3/10'], ['2/3', '2/3'], ['abc', '?'], ['7/6', '?']].map(([e, s]) => zrBruchText(zrWsk(e)) === s));
  ck('Eingaben: 1/6, 0,5, 30 %, 30 → Brüche; Unsinn und > 100 % abgelehnt', parse.every(Boolean), parse.join(','));
  const rech = await p.evaluate(() => [zrBruchText(zrRechne('1 − (5/6)^4')), zrBruchText(zrRechne('3/5 × 2/4')), zrBruchText(zrRechne('1/6+1/6')), zrBruchText(zrRechne('50%×50%')), zrRechne('2++'), zrRechne('(1')]);
  ck('Rechner exakt: 1−(5/6)^4 = 671/1296, 3/5×2/4 = 3/10, Fehler → nichts', rech[0] === '671/1296' && rech[1] === '3/10' && rech[2] === '1/3' && rech[3] === '1/4' && rech[4] === null && rech[5] === null, JSON.stringify(rech));
  await p.click('#hubZufall'); await p.waitForTimeout(1200);
  await p.click('#zfLos'); await p.waitForTimeout(400);
  ck('Rechenhilfe-Knopf in der Runde, Panel zu', await p.isVisible('#zfRechenBtn') && await p.isHidden('#zfRechen'));
  await p.click('#zfRechenBtn'); await p.waitForTimeout(200);
  ck('Panel offen: Baum-Reiter mit Vorlagen', await p.isVisible('#zfRechen') && (await p.locator('[data-vorlage]').count()) === 4);
  // 4 Würfe: mind. eine 6 = 1 − P(keine 6 viermal)
  await p.click('[data-vorlage="sechs"]');
  for (let i = 0; i < 3; i++) await p.click('#zrStufe');
  ck('Würfel-Vorlage + 3× Stufe wiederholen → 16 Enden', (await p.evaluate(() => zrBlaetter(zr.baum).length)) === 16);
  await p.evaluate(() => { const e = zrBlaetter(zr.baum).find((x) => x.pfad.every((c) => c.name === 'keine 6')); document.querySelector('.zr-baum g[data-k="' + e.k.id + '"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await p.check('#zrGegen'); await p.waitForTimeout(100);
  const erg = await p.textContent('.zr-ergebnis');
  ck('Pfad „keine 6“ ×4 markiert + Gegenteil → 671/1296 ≈ 51,8 %', /671\/1296/.test(erg) && /51,8 %/.test(erg), erg.trim());
  await bild('zr-wuerfel');
  await p.click('#zrUebernehmen'); await p.waitForTimeout(300);
  ck('Als Tipp übernommen: Regler 52 %, Panel zu, Runde markiert', (await p.inputValue('#zfRegler')) === '52' && await p.isHidden('#zfRechen') && await p.evaluate(() => zf.hilfe[0] === true));
  // Kugeln ohne Zurücklegen
  await p.click('#zfRechenBtn'); await p.click('[data-vorlage="kugeln"]');
  await p.fill('#zrRot', '3'); await p.fill('#zrBlau', '2'); await p.fill('#zrZuege', '2'); await p.click('#zrKugelnOk');
  const kug = await p.evaluate(() => zrBlaetter(zr.baum).map((e) => e.pfad.map((c) => c.name[0] + c.p).join(' ')));
  ck('Kugeln 3 rot / 2 blau, 2 Züge ohne Zurücklegen → richtige Brüche', JSON.stringify(kug) === JSON.stringify(['r3/5 r2/4', 'r3/5 b2/4', 'b2/5 r3/4', 'b2/5 b1/4']), kug.join(' | '));
  await p.evaluate(() => { const e = zrBlaetter(zr.baum)[0]; document.querySelector('.zr-baum g[data-k="' + e.k.id + '"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  ck('Rot-rot markiert → 3/10 = 30 %', /3\/10 ≈ 30 %/.test(await p.textContent('.zr-ergebnis')));
  // Eigene Äste: Ja/Nein, Werte eintippen
  await p.click('[data-vorlage="janein"]'); await p.waitForTimeout(100);
  ck('Leere Werte → Hinweis „fehlt noch“', /fehlt noch/.test(await p.textContent('#zfRechen')));
  const ids = await p.evaluate(() => zr.baum.kinder.map((k) => k.id));
  await p.click('.zr-p[data-k="' + ids[0] + '"]'); await p.fill('#zrP', '0,3');
  await p.click('.zr-p[data-k="' + ids[1] + '"]'); await p.fill('#zrP', '60 %');
  ck('0,3 + 60 % → Warnung „90 % statt 100 %“', /90 % statt 100 %/.test(await p.textContent('#zfRechen')));
  await p.fill('#zrP', '70 %'); await p.waitForTimeout(100);
  ck('Korrigiert → keine Warnung mehr', !(await p.textContent('#zfRechen')).includes('statt 100'));
  await p.click('#zrAst'); await p.fill('#zrP', '1/2');   // Unterast unter „Nein“
  ck('＋ Ast unter einem Ende hängt einen neuen Ast an', await p.evaluate((id) => zrFinde(id).kinder.length === 1, ids[1]));
  await p.click('#zrWeg');
  ck('🗑 entfernt den Ast wieder', await p.evaluate((id) => zrFinde(id).kinder.length === 0, ids[1]));
  // Grenze
  await p.click('[data-vorlage="muenze"]'); for (let i = 0; i < 6; i++) await p.click('#zrStufe');
  ck('Münze 7 Stufen = 128 Enden → gestoppt bei 64 mit Hinweis', (await p.evaluate(() => zrBlaetter(zr.baum).length)) === 64 && /höchstens 64/i.test(await p.textContent('.zr-meldung')));
  // Rechner
  await p.click('[data-tab="rechner"]');
  for (const t of ['1−(', '5', '÷', '6', ')', '^', '2']) await p.click('[data-taste="' + t + '"]');
  const aus = await p.textContent('.zr-ausgabe');
  ck('Rechner-Tasten: 1−(5÷6)^2 = 11/36 ≈ 30,6 %', /11\/36/.test(aus) && /30,6 %/.test(aus), aus.trim());
  await bild('zr-rechner');
  await p.click('#zrUebernehmen');
  ck('Rechner-Ergebnis als Tipp: 31 %', (await p.inputValue('#zfRegler')) === '31');
  // Nächste Runde: frisches Blatt
  await p.click('#zfTippen'); await p.click('#zfUeberspringen').catch(() => {}); await p.waitForSelector('#zfWeiter:not([hidden])', { timeout: 8000 }); await p.click('#zfWeiter'); await p.waitForTimeout(200);
  ck('Neue Runde: Rechenhilfe zu und leer', await p.isHidden('#zfRechen') && await p.evaluate(() => zr.baum.kinder.length === 0 && zr.rechner === ''));
  for (let i = 1; i < 5; i++) { await p.click('#zfTippen'); await p.click('#zfUeberspringen').catch(() => {}); await p.waitForSelector('#zfWeiter:not([hidden])', { timeout: 8000 }); await p.click('#zfWeiter'); await p.waitForTimeout(200); }
  ck('Ergebnisliste: Runde 1 als „🧮 gerechnet“ markiert, andere nicht', /🧮 gerechnet/.test(await p.textContent('#zfErgListe li:nth-child(1)')) && !/🧮/.test(await p.textContent('#zfErgListe li:nth-child(2)')));
  ck('Keine JS-Fehler', !fehler.length, fehler.slice(0, 3).join(' | '));
  await b.close();
  const ok = checks.filter((c) => c[1]).length; console.log('\n' + ok + '/' + checks.length + ' Checks bestanden');
  process.exit(ok === checks.length ? 0 : 1);
})();
