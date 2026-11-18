// Ragebait-Fabrik (Satire): Generator (alle Lager, Empörungsgrade), Baukasten (3 Runden, Wertung, Bestwert), Detektor.
// Aufruf: python3 -m http.server 8765, dann  node tests/rage.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  ck('Hub-Karte in „Perspektivwechsel“', await p.evaluate(() => !!document.querySelector('.sk-kat-perspektive #hubRage')));
  const gen = await p.evaluate(() => { const f = []; let n = 0; RB_LAGER.forEach((L) => { for (let g = 1; g <= 5; g++) for (let i = 0; i < 40; i++) { const post = rbPostBauen(L, g); n++; if (/undefined|null|NaN/.test(post.text + post.hash.join(' ')) || !post.text.trim() || !post.hash.length) f.push(L.id + g); } }); return { n, f }; });
  ck('Generator: 1.600 Posts aus 8 Lagern × 5 Graden – alle vollständig', gen.n === 1600 && !gen.f.length, gen.f.slice(0, 3).join(','));
  const grad = await p.evaluate(() => { const L = RB_LAGER[0]; let a = 0, z = 0; for (let i = 0; i < 100; i++) { a += rbPostBauen(L, 1).wert.punkte; z += rbPostBauen(L, 5).wert.punkte; } return [a / 100, z / 100]; });
  ck('Höherer Empörungsgrad → mehr Tricks/Wut-Punkte im Schnitt', grad[1] > grad[0] * 1.8, grad.map(Math.round).join(' → '));
  await p.click('#hubRage'); await p.waitForTimeout(1200);
  ck('Start: drei Modi + Trick-Übersicht', (await p.locator('.rb-modus').count()) === 3 && (await p.locator('.rb-trick').count()) === 11);
  await bild('rb-start');
  await p.click('.rb-modus[data-m="gen"]'); await p.waitForTimeout(300);
  await p.click('.rb-lchip[data-l="wut"]'); await p.fill('#rbGrad', '5'); await p.dispatchEvent('#rbGrad', 'input'); await p.click('#rbNeu'); await p.waitForTimeout(1400);
  ck('Post-Karte mit SATIRE-Stempel, Lager „Früher-war-alles-besser“, Zähler laufen hoch', /SATIRE/.test(await p.textContent('.rb-post')) && /Jürgen/.test(await p.textContent('.rb-post')) && (await p.evaluate(() => [...document.querySelectorAll('.rb-zahlen b')].some((b) => b.textContent !== '0'))));
  await bild('rb-generator');
  await p.click('#rbKopieren'); await p.waitForTimeout(200);
  const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  ck('Kopieren hängt den Satire-Hinweis an', /\(Satire – aus der Ragebait-Fabrik\)/.test(clip) || /Satire/.test(await p.textContent('#rbKopiert')), clip.slice(-50));
  // Baukasten
  await p.click('#rbZurueck'); await p.waitForTimeout(200); await p.click('.rb-modus[data-m="bau"]'); await p.waitForTimeout(300);
  ck('Baukasten: 4 Plätze × 3 Karten, „Posten“ erst wenn alle gewählt', (await p.locator('.rb-option').count()) === 12 && await p.evaluate(() => $('rbPosten').disabled));
  for (let r = 0; r < 3; r++) {
    // je Platz die Karte mit den meisten Wut-Punkten wählen
    await p.evaluate(() => rb.opt.forEach((o, s) => { const best = o.map((x, i) => [rbWertung(x[1]).punkte, i]).sort((a, b) => b[0] - a[0])[0][1]; document.querySelector('.rb-option[data-s="' + s + '"][data-i="' + best + '"]').click(); }));
    if (r === 0) await bild('rb-baukasten');
    await p.click('#rbPosten'); await p.waitForTimeout(400);
    if (r === 0) ck('Gepostet: Karte, Tricks, keine sachliche Zutat bei Bestwahl', !(await p.textContent('#rbInhalt')).includes('Sachlich') && (await p.locator('.rb-post').count()) === 1);
    await p.click('#rbWeiter'); await p.waitForTimeout(300);
  }
  const ende = await p.evaluate(() => ({ summe: rb.summe, best: rbStore().best, text: $('rbInhalt').textContent }));
  ck('Ergebnis nach 3 Runden, Bestwert gespeichert, „Und jetzt im Ernst“-Hinweis', ende.summe > 150 && ende.best === ende.summe && /im Ernst/.test(ende.text), JSON.stringify({ summe: ende.summe, best: ende.best }));
  await bild('rb-ende');
  // Sachliche Wahl wird bestraft
  const sach = await p.evaluate(() => rbWertung(['sachlich']).punkte === 0 && rbWertung(['feind', 'stroh']).punkte === 65);
  ck('Wertung: Feindbild + Strohmann = 20 + 20 + Kombo 25; sachlich allein = 0', sach);
  // Detektor
  await p.click('#rbMenue'); await p.waitForTimeout(200); await p.click('.rb-modus[data-m="det"]'); await p.waitForTimeout(300);
  await p.fill('#rbDetText', 'UNFASSBAR!!! Die da oben wollen uns jetzt auch noch das Auto verbieten. Studien zeigen, dass das erst der Anfang ist. Wenn das so weitergeht, ist das das Ende unserer Freiheit. Bin ich der Einzige, der das sieht? TEILT DAS, bevor es gelöscht wird!!!');
  await p.click('#rbPruefen'); await p.waitForTimeout(200);
  const d1 = await p.evaluate(() => rbAnalyse($('rbDetText').value));
  ck('Detektor: typischer Wut-Post → hoher Wert, ≥ 6 Tricks', d1.score >= 70 && d1.tags.length >= 6, d1.score + ' · ' + d1.tags.join(','));
  await bild('rb-detektor');
  const d2 = await p.evaluate(() => rbAnalyse('Die Stadt hat beschlossen, ab März eine neue Buslinie einzurichten. Die Kosten liegen laut Haushaltsplan bei 1,2 Millionen Euro. Kritiker bemängeln die Taktung.'));
  ck('Detektor: sachliche Meldung → niedriger Wert', d2.score < 15, d2.score + ' · ' + d2.tags.join(','));
  await p.click('#rbZurueck'); await p.waitForTimeout(200); await p.click('#rbZurueck'); await p.waitForTimeout(400);
  ck('Zurück zum Hub, Hub-Text zeigt Bestwert', /Bestwert Baukasten/.test(await p.textContent('#hubRageBest')));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
