// Hub: Zurück an dieselbe Stelle. Weit unten ein Spiel öffnen (Beat-Bahnen, Fitness), zurück → dieselbe Karte steht an
// derselben Stelle (auch wenn „Zuletzt gespielt“ oben die Seite verändert); nochmal „zurück“ (Rand-Geste) bzw. „Nach oben“ → ganz oben.
// Aufruf: python3 -m http.server 8765, dann  node tests/hub-zurueck.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { window.SK_GESTEN_IMMER = true; if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const cdp = await ctx.newCDPSession(p);
  const wisch = async (x1, y1, x2, y2, schritte = 10, ms = 14) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] });
    for (let i = 1; i <= schritte; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + ((x2 - x1) * i) / schritte, y: y1 + ((y2 - y1) * i) / schritte }] }); await p.waitForTimeout(ms); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const lage = (id) => p.evaluate((i) => ({ y: Math.round(scrollY), top: Math.round($(i).getBoundingClientRect().top), screen: document.querySelector('.screen.active').id }), id);
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1200);

  for (const [id, zurueck, name] of [['hubBeat', '#bbZurueck', 'Beat-Bahnen'], ['hubFitness', '#fiZurueck', 'Fitness'], ['hubScan', '#scZurueck', 'Zutaten-Check']]) {
    await p.evaluate((i) => { const k = $(i); window.scrollTo(0, hubDocTop(k) - innerHeight * 0.55); }, id); await p.waitForTimeout(300);
    const vorher = await lage(id);
    const bx = await p.evaluate((i) => { const r = $(i).getBoundingClientRect(); return { x: r.left + r.width * 0.3, y: r.top + Math.min(40, r.height / 2) }; }, id);
    await p.touchscreen.tap(bx.x, bx.y); await p.waitForTimeout(1300);  // tippen wie mit dem Finger – ohne automatisches Scrollen
    const drin = await lage(id);
    await p.click(zurueck); await p.waitForTimeout(700);
    const nachher = await lage(id);
    ck(name + ': weit unten geöffnet, zurück → Karte steht wieder an derselben Stelle (±3 px)', vorher.y > 600 && drin.screen !== 'screen-hub' && nachher.screen === 'screen-hub' && Math.abs(nachher.top - vorher.top) <= 3, JSON.stringify({ vorher, nachher }));
    ck(name + ': die Karte leuchtet kurz auf', await p.evaluate((i) => $(i).classList.contains('hub-zurueck'), id));
  }
  await p.screenshot({ path: ordner + '/hub-zurueck.png' });
  ck('„Nach oben“-Knopf ist sichtbar, wenn man weit unten ist', await p.evaluate(() => !$('hubNachOben').hidden));
  await wisch(4, 450, 220, 452); await p.waitForTimeout(1200);
  ck('Nochmal zurück (Rand-Geste auf dem Hub) → ganz nach oben, Knopf verschwindet', await p.evaluate(() => scrollY === 0 && $('hubNachOben').hidden && document.querySelector('.screen.active').id === 'screen-hub'));
  await p.evaluate(() => window.scrollTo(0, 2500)); await p.waitForTimeout(300);
  await p.click('#hubNachOben'); await p.waitForTimeout(1200);
  ck('„Nach oben“ antippen → ganz oben', await p.evaluate(() => scrollY === 0));
  // oben geöffnet → oben zurück, mit Auftritt-Animation
  await p.evaluate(() => { window.scrollTo(0, 0); hubMerken($('hubStimmen')); show('stimmen'); }); await p.waitForTimeout(200);
  await p.evaluate(() => zeigeHub()); await p.waitForTimeout(200);
  ck('Von ganz oben geöffnet → oben zurück (Karten gleiten wie gewohnt herein)', await p.evaluate(() => scrollY === 0 && $('screen-hub').classList.contains('auftritt')));
  // Fallback ohne Karte (z. B. aus dem Universum oder ohne Zoom): Scrollposition wird trotzdem gemerkt
  await p.evaluate(() => { window.scrollTo(0, 1800); hubRueck = null; }); await p.waitForTimeout(150);
  await p.evaluate(() => { show('verlauf'); }); await p.waitForTimeout(150);
  await p.evaluate(() => zeigeHub()); await p.waitForTimeout(200);
  ck('Ohne angetippte Karte: dieselbe Scrollposition', await p.evaluate(() => Math.abs(scrollY - 1800) <= 2), String(await p.evaluate(() => scrollY)));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
