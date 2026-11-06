// Falten bis zum Mars: Meilenstein-Mathematik, Zahlenformat, 49 Faltungen bis zum Mars, Weiterfalten bis Proxima Centauri.
// Aufruf: python3 -m http.server 8765, dann  node tests/falten.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);

  const m = await p.evaluate(() => ({ ziele: Object.fromEntries(FT_ZIELE.map((z) => [z.n, z.ab])), mars: FT_MARS, f: [1, 3, 25, 32, 37, 42, 49, 69].map((n) => n + '=' + ftLaenge(ftHoehe(n))) }));
  const soll = { 'Burj Khalifa': 23, 'Raumstation ISS': 32, 'Erde (Durchmesser)': 37, Mond: 42, Mars: 49, Sonne: 51, 'Proxima Centauri': 69, Mensch: 15, Weltraum: 30 };
  ck('Meilensteine an der richtigen Faltung', Object.entries(soll).every(([k, v]) => m.ziele[k] === v), JSON.stringify(soll));
  ck('Mars nach genau 49 Faltungen', m.mars === 49 && m.ziele.Mars === 49);
  ck('Zahlen wie im Reel (0,2 mm · 0,8 mm · 3,36 km · 429 km · 13.744 km)', m.f.slice(0, 5).join(' ') === '1=0,2 mm 3=0,8 mm 25=3,36 km 32=429 km 37=13.744 km', m.f.join(' · '));

  await p.click('#hubFalten'); await p.waitForTimeout(900);
  await p.screenshot({ path: ordner + '/ft-intro.png' });
  await p.evaluate(() => { const s = $('ftSchieber'); s.value = 600; s.dispatchEvent(new Event('input')); });
  const schaetzung = await p.evaluate(() => parseInt($('ftSchaetzung').textContent.replace(/\D/g, ''), 10));
  await p.click('#ftLos'); await p.waitForTimeout(300);
  const bilder = { 1: 'ft-01', 3: 'ft-03', 25: 'ft-25', 32: 'ft-32', 37: 'ft-37', 42: 'ft-42' };
  for (let i = 1; i <= 49; i++) {
    await p.click('#ftFalten');
    await p.waitForTimeout(i < 6 ? 200 : 90);
    if (bilder[i]) { await p.waitForTimeout(500); await p.screenshot({ path: ordner + '/' + bilder[i] + '.png' }); }
  }
  const zahl = await p.textContent('#ftZahl');
  ck('Anzeige nach 49 Faltungen', /49 Faltungen = 56,3 Mio\. km/.test(zahl), zahl);
  await p.waitForSelector('.ft-ergebnis', { timeout: 4000 });
  const karte = await p.textContent('.ft-karte');
  ck('Mars-Karte mit Schätzung und Abweichung', /Mars erreicht/.test(karte) && karte.includes(schaetzung.toLocaleString('de-DE')), 'Schätzung ' + schaetzung);
  await p.screenshot({ path: ordner + '/ft-mars.png' });
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'falten').length);
  ck('Verlaufseintrag', vl === 1);
  ck('Takt läuft (Beat-Schleife aktiv)', await p.evaluate(() => !!(ftAk && ftAk.takt)));
  await p.click('#ftWeiter');
  for (let i = 50; i <= 69; i++) { await p.click('#ftFalten'); await p.waitForTimeout(80); }
  await p.waitForSelector('.ft-ergebnis', { timeout: 4000 });
  ck('Weiterfalten bis Proxima Centauri (69)', /Proxima Centauri/.test(await p.textContent('.ft-karte')));
  await p.click('#ftNochmal'); await p.waitForTimeout(200);
  await p.click('#ftZurueck'); await p.waitForTimeout(500);
  ck('Zurück führt zum Start, Beat stoppt', await p.evaluate(() => $('screen-hub').classList.contains('active') && !(ftAk && ftAk.takt)));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
