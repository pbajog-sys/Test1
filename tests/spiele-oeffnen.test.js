// Rauchtest: Jede Spielkarte des Dashboards öffnet ihr Spiel, ohne Seitenfehler; zurück zum Dashboard klappt.
// Aufruf: python3 -m http.server 8765, dann  node tests/spiele-oeffnen.test.js
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  let ok = 0, fail = 0;
  for (const [name, opt] of [['Handy', devices['iPhone 13']], ['Desktop', { viewport: { width: 1366, height: 850 } }]]) {
    const ctx = await b.newContext({ ...opt, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
    const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForTimeout(1300);
    const karten = await p.evaluate(() => [...document.querySelectorAll('#screen-hub .hub-game')].map((k) => k.id));
    for (const id of karten) {
      await p.evaluate(() => { zeigeHub(); document.querySelectorAll('dialog[open]').forEach((d) => d.close()); }); await p.waitForTimeout(250);
      await p.evaluate((id) => $(id).click(), id); await p.waitForTimeout(900);
      const wo = await p.evaluate(() => document.querySelector('.screen.active').id);
      const gut = wo !== 'screen-hub';
      gut ? ok++ : fail++;
      if (!gut) console.log('✗', name, id, 'bleibt auf', wo);
    }
    await p.evaluate(() => zeigeHub());
    if (fehler.length) { fail++; console.log('✗', name, 'Seitenfehler:', fehler.join(' | ')); } else ok++;
    console.log(name + ':', karten.length, 'Spielkarten geprüft');
    await ctx.close();
  }
  console.log(ok + ' bestanden, ' + fail + ' fehlgeschlagen');
  await b.close(); process.exit(fail ? 1 : 0);
})();
