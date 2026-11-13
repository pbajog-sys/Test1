// 🔊 Ton-Check: Anzeige, Wiedergabe-Art wählen (wird gespeichert und beim Start gesetzt), Test-Ton.
// iOS' navigator.audioSession wird nachgebildet. Aufruf: python3 -m http.server 8765, dann  node tests/toncheck.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  await ctx.addInitScript(() => { const w = []; Object.defineProperty(navigator, 'audioSession', { configurable: true, value: { get type() { return w[w.length - 1] || 'auto'; }, set type(v) { w.push(v); }, verlauf: w } }); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  ck('Beim Start: Audio-Sitzung „ambient“', await p.evaluate(() => navigator.audioSession.type === 'ambient'));
  await p.click('#tonCheckBtn'); await p.waitForTimeout(300);
  const txt = await p.textContent('#skDlg');
  ck('Ton-Check zeigt Stand, Sitzung und Arten', /Ton-Check/.test(txt) && /„ambient“/.test(txt) && (await p.$$('#skDlg [data-art]')).length === 3 && /v\d+/.test(txt), txt.slice(0, 160));
  await p.screenshot({ path: ordner + '/toncheck.png' });
  await p.click('#skDlg [data-art="playback"]'); await p.waitForTimeout(500);
  ck('Art „Wiedergabe“: gesetzt, gespeichert, Test-Ton läuft', await p.evaluate(() => navigator.audioSession.type === 'playback' && JSON.parse(localStorage.getItem('walquiz.audio.v1')).sitzung === 'playback' && ftAk && ftAk.c.state === 'running' && document.querySelector('#skDlg [data-art="playback"]').classList.contains('an')));
  await p.click('#ftTestTon');
  await p.reload(); await p.waitForTimeout(900);
  ck('Nach Neustart gilt die gewählte Art', await p.evaluate(() => navigator.audioSession.type === 'playback'));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
