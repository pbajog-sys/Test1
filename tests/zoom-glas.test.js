// Zoom durchs Universum + Verdopplung im Glas: Daten, komplette Durchläufe über die Oberfläche, Verlauf, Musik.
// Aufruf: python3 -m http.server 8765, dann  node tests/zoom-glas.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);

  // ---------- Zoom ----------
  const d = await p.evaluate(() => {
    const sortiert = ZM_DINGE.every((x, i) => i === 0 || x.s > ZM_DINGE[i - 1].s);
    const leer = []; for (let k = ZM_MIN; k <= ZM_MAX; k++) if (!zmImBild(k).length) leer.push(k);
    return { sortiert, leer, schritte: Math.log10(ZM_DINGE[ZM_DINGE.length - 1].s / ZM_DINGE[0].s), anzahl: ZM_DINGE.length, start: zmImBild(ZM_START).map((x) => x.n) };
  });
  ck('Zoom: ' + d.anzahl + ' Objekte, nach Größe sortiert', d.anzahl >= 45 && d.sortiert);
  ck('Zoom: Proton → Universum = 41,7 ≈ 42 Zehnerschritte', Math.abs(d.schritte - 41.7) < 0.05, d.schritte.toFixed(2));
  ck('Zoom: Start (10 m Bildbreite) zeigt den Menschen', d.start.includes('Mensch'), d.start.join(', '));
  ck('Zoom: auf jeder der 43 Stufen ist etwas im Bild', d.leer.length === 0, 'leer bei 10^' + d.leer.join(', 10^'));
  await p.click('#hubZoom'); await p.waitForTimeout(900);
  await p.evaluate(() => { const s = $('zmSchieber'); s.value = 30; s.dispatchEvent(new Event('input')); });
  await p.click('#zmLos'); await p.waitForTimeout(400);
  await p.screenshot({ path: ordner + '/zm-start.png' });
  const bilder = { 7: 'zm-erde', 12: 'zm-sonnensystem', 21: 'zm-milchstrasse' };
  for (let k = 2; k <= 27; k++) { await p.click('#zmRaus'); await p.waitForTimeout(k in bilder ? 750 : 60); if (bilder[k]) await p.screenshot({ path: ordner + '/' + bilder[k] + '.png' }); }
  ck('Zoom: oben angekommen (10^27 m)', await p.evaluate(() => zm.k === 27 && zm.max === 27));
  await p.click('#zmRaus'); await p.waitForTimeout(100);
  ck('Zoom: weiter als das Universum geht nicht', /Weiter können wir nicht/.test(await p.textContent('#zmText')));
  const unten = { '-5': 'zm-blut', '-10': 'zm-atom', '-15': 'zm-proton' };
  for (let k = 26; k >= -15; k--) { await p.click('#zmRein'); await p.waitForTimeout(String(k) in unten ? 750 : 50); if (unten[k]) await p.screenshot({ path: ordner + '/' + unten[k] + '.png' }); }
  await p.waitForSelector('.ft-ergebnis', { timeout: 4000 });
  const zk = await p.textContent('.ft-karte');
  ck('Zoom: beide Enden erreicht → Ergebniskarte mit 42', /durchs ganze Universum/.test(zk) && /42/.test(zk) && /12 daneben/.test(zk));
  ck('Zoom: Musik lief mit voller Stärke', await p.evaluate(() => ftLaut === 40 && !!(ftAk && ftAk.takt)));
  await p.click('#zmWeiter'); await p.click('#zmRaus'); await p.waitForTimeout(1300);
  ck('Zoom: „Weiter erkunden“ ohne erneute Auswertung', (await p.$$('.ft-ergebnis')).length === 0);
  await p.click('#zmZurueck'); await p.waitForTimeout(200); await p.click('#zmZurueck'); await p.waitForTimeout(500);

  // ---------- Glas ----------
  ck('Glas: Prozent- und Zahlformat', await p.evaluate(() => glProzent(55) === '3,13 %' && glProzent(59) === '50 %' && glZahlWort(2 ** 60) === '1,2 Trillionen' && glUhr(59) === '11:59'), await p.evaluate(() => [glProzent(55), glProzent(59), glProzent(40), glZahlWort(2 ** 60)].join(' | ')));
  await p.click('#hubGlas'); await p.waitForTimeout(900); await p.click('#glLos'); await p.waitForTimeout(300);
  await p.evaluate(() => { const s = $('glSchieber'); s.value = 59; s.dispatchEvent(new Event('input')); });
  await p.screenshot({ path: ordner + '/gl-frage1.png' });
  await p.click('#glAntwort'); await p.waitForTimeout(150);
  ck('Glas: Frage 1 (11:59) richtig erkannt', /Richtig/.test(await p.textContent('#glErkl')));
  await p.click('#glWeiterFrage');
  for (let i = 0; i < 55; i++) await p.click('#glMinute');
  await p.waitForSelector('.gl-opt', { timeout: 3000 });
  await p.screenshot({ path: ordner + '/gl-1155.png' });
  ck('Glas: um 11:55 erscheint Frage 2', /11:55/.test(await p.textContent('#glZahl')));
  await p.click('.gl-opt[data-o="0"]'); await p.click('#glWeiterFrage');
  await p.click('#glAutoBtn'); await p.waitForSelector('.gl-opt', { timeout: 6000 });
  ck('Glas: „Laufen lassen“ hält bei 11:58 für Frage 3', /11:58/.test(await p.textContent('#glZahl')));
  await p.click('.gl-opt[data-o="2"]'); await p.waitForTimeout(100);
  ck('Glas: falsche Antwort wird erklärt (nur 2 Minuten)', /Nur 2 Minuten/.test(await p.textContent('#glErkl')));
  await p.click('#glWeiterFrage');
  await p.screenshot({ path: ordner + '/gl-4glaeser.png' });
  for (let i = 0; i < 4; i++) await p.click('#glMinute');
  await p.waitForTimeout(600); await p.screenshot({ path: ordner + '/gl-1202.png' });
  await p.waitForSelector('.ft-ergebnis', { timeout: 3000 });
  ck('Glas: Ende um 12:02 mit 2 von 3', /12:02/.test(await p.textContent('.ft-karte')) && /2<\/b> von 3|2 von 3/.test(await p.innerText('.ft-karte')));
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).map((e) => e.s).filter((s) => s === 'zoom' || s === 'glas').join(','));
  ck('Verlauf: Zoom und Glas eingetragen', vl === 'zoom,glas', vl);
  await p.click('#glNochmal'); await p.click('#glZurueck'); await p.waitForTimeout(500);
  ck('Zurück zum Start, Beat aus', await p.evaluate(() => $('screen-hub').classList.contains('active') && !(ftAk && ftAk.takt)));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
