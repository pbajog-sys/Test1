// Gehörbildung: alle drei Übungen × drei Stufen einmal fehlerfrei und einmal absichtlich daneben durchspielen.
// Aufruf: python3 -m http.server 8765, dann  node tests/gehoer.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); localStorage.setItem('walquiz.fuehrung.v1', JSON.stringify({ gesehen: { toene: true } })); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1200);
  await p.click('#hubToene'); await p.waitForTimeout(900);
  await p.screenshot({ path: ordner + '/gb-intro.png', fullPage: true });
  let ok = 0, fail = 0;
  for (const modus of ['intervall', 'benennen', 'einstellen']) for (const stufe of ['leicht', 'mittel', 'profi']) for (const richtig of [true, false]) {
    await p.evaluate(([m, s]) => gbStart(m, s), [modus, stufe]); await p.waitForTimeout(150);
    if (richtig && stufe === 'mittel') await p.screenshot({ path: ordner + '/gb-' + modus + '.png' });
    const n = await p.evaluate(() => gb.runden.length);
    for (let i = 0; i < n; i++) {
      await p.evaluate((richtig) => {
        const R = gb.runden[gb.i];
        if (gb.modus === 'intervall') { const h = richtig ? R.h : R.erlaubt.find((x) => x !== R.h); document.querySelector('[data-h="' + h + '"]').click(); }
        else if (gb.modus === 'benennen') { const n2 = richtig ? R.n : R.pool.find((x) => Math.min((x - R.n + 12) % 12, (R.n - x + 12) % 12) >= 2); document.querySelector('.gb-taste[data-n="' + n2 + '"]').click(); }
        else { const ziel = gbFreq(60 + R.n) * (richtig ? 1 : Math.pow(2, 3 / 12)); const x = 1000 * Math.log2(ziel / gbFreq(48)) / 3; $('gbRegler').value = Math.round(x); $('gbFertig').click(); }
      }, richtig);
      if (i === 0 && !richtig && stufe === 'mittel') { await p.waitForTimeout(150); await p.screenshot({ path: ordner + '/gb-' + modus + '-antwort.png' }); }
      await p.click('#gbWeiter');
    }
    await p.waitForTimeout(150);
    const summe = await p.evaluate(() => gb.punkte.reduce((a, b) => a + b, 0));
    const erwartet = richtig ? summe >= 49 : summe <= 15;
    erwartet ? ok++ : fail++;
    console.log((erwartet ? '✓' : '✗'), modus, stufe, richtig ? 'richtig' : 'daneben', '→', Math.round(summe * 10) / 10, '/ 50');
  }
  await p.screenshot({ path: ordner + '/gb-ende.png' });
  const vl = await p.evaluate(() => { const t = loadJson(VERLAUF_KEY).tage[skDatum()]; return t.filter((e) => e.s === 'toene').length; });
  console.log(vl === 18 ? '✓' : '✗', 'Verlauf-Einträge:', vl); vl === 18 ? ok++ : fail++;
  console.log(fehler.length ? '✗ Seitenfehler: ' + fehler.join(' | ') : '✓ keine Seitenfehler'); fehler.length ? fail++ : ok++;
  console.log(ok + ' bestanden, ' + fail + ' fehlgeschlagen');
  await b.close(); process.exit(fail ? 1 : 0);
})();
