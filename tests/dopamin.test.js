// Dopamin-Maschine: 25 Sekunden automatisch spielen (Blasen treffen, stapeln, drehen), Auflösung prüfen, Blitz-Rate messen.
// Aufruf: python3 -m http.server 8765, dann  node tests/dopamin.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1000);
  await p.click('#hubDopamin'); await p.waitForTimeout(900);
  await p.screenshot({ path: ordner + '/dp-intro.png' });
  await p.click('[data-modus="voll"]'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => $('dpBild').getBoundingClientRect().toJSON());
  const t0 = Date.now(); let bild = 0;
  while (Date.now() - t0 < 25000) {
    const ziel = await p.evaluate(() => {
      const F = dpFelder(), z = [];
      const bl = dp.blasen[0]; if (bl) z.push([F[0].x + bl.x * F[0].w, F[0].y + bl.y * F[0].h]);
      const S = dp.stapel, o = S.turm[S.turm.length - 1]; if (Math.abs(S.block.x - o.x) < 0.06) z.push([F[1].x + F[1].w / 2, F[1].y + F[1].h / 2]);
      if (dp.rad.energie >= 1 && !dp.rad.dreht) z.push([F[2].x + F[2].w / 2, F[2].y + F[2].h / 2]);
      return z;
    });
    for (const [x, y] of ziel) await p.mouse.click(r.x + x, r.y + y);
    if (Date.now() - t0 > 8000 * (bild + 1) && bild < 2) { await p.screenshot({ path: ordner + '/dp-spiel-' + bild + '.png' }); bild++; }
    await p.waitForTimeout(40);
  }
  const st = await p.evaluate(() => ({ punkte: dp.punkte, level: dp.level, ...dp.stat }));
  console.log('Nach 25 s:', JSON.stringify(st));
  const blitzRate = (st.blitze || 0) / 25;
  await p.click('#dpEnde'); await p.waitForTimeout(400);
  await p.screenshot({ path: ordner + '/dp-ende.png', fullPage: true });
  const ende = await p.evaluate(() => /Was gerade passiert ist/.test($('dpInhalt').innerText) && /Beinahe-Gewinne/.test($('dpInhalt').innerText));
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).some((e) => e.s === 'dopamin'));
  const checks = [['Punkte gesammelt', st.punkte > 200], ['Level-up', st.level >= 2], ['Auflösung mit Tricks', ende], ['Verlaufseintrag', vl], ['Aufhellen < 3/s', blitzRate < 3], ['Keine Seitenfehler', !fehler.length]];
  checks.forEach(([n, ok]) => console.log((ok ? '✓ ' : '✗ ') + n + (n.startsWith('Aufhellen') ? ' (' + blitzRate.toFixed(2) + '/s)' : '') + (n === 'Keine Seitenfehler' && fehler.length ? ' – ' + fehler.join(' | ') : '')));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
