// Beat-Bahnen Live-Modus: Tempo-Erkennung an künstlichen Hüllkurven, dann echter Durchlauf mit simuliertem Mikrofon
// (Chromium spielt eine WAV-Datei mit 120 BPM als Mikrofon ein). Aufruf: python3 -m http.server 8765, dann
//   node tests/beat-live.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const ordner = process.argv[2] || '.';
function beatWav(bpm, sek) {
  const rate = 48000, n = rate * sek, d = new Float32Array(n), P = 60 / bpm;
  let s = 11; const zuf = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let b = 0; b * P < sek; b++) {
    const a = Math.round(b * P * rate);
    for (let i = 0; i < rate * 0.25 && a + i < n; i++) { const t = i / rate, f = 45 + 110 * Math.exp(-t * 30); d[a + i] += 0.7 * Math.exp(-t * 12) * Math.sin(2 * Math.PI * f * t); }   // Kick
    if (b % 2 === 1) for (let i = 0; i < rate * 0.15 && a + i < n; i++) d[a + i] += 0.25 * Math.exp(-i / rate * 25) * (zuf() * 2 - 1);   // Snare auf 2 und 4
    const o = Math.round((b + 0.5) * P * rate);
    for (let i = 0; i < rate * 0.04 && o + i < n; i++) d[o + i] += 0.08 * Math.exp(-i / rate * 90) * (zuf() * 2 - 1);   // Hi-Hat auf der Zwei-und
  }
  for (let i = 0; i < n; i++) d[i] += 0.04 * Math.sin(2 * Math.PI * 110 * i / rate) * (0.6 + 0.4 * Math.sin(i / rate));   // Fläche
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(d[i] * 30000))), 44 + i * 2);
  return buf;
}
(async () => {
  const wav = path.join(os.tmpdir(), 'beat-live-120.wav'); fs.writeFileSync(wav, beatWav(120, 60));
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', permissions: ['microphone'] });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  // iOS-Audio-Sitzung nachbilden (Chromium kennt navigator.audioSession nicht): merkt sich jeden Wechsel
  await ctx.addInitScript(() => { const w = []; Object.defineProperty(navigator, 'audioSession', { configurable: true, value: { get type() { return w[w.length - 1] || 'auto'; }, set type(v) { w.push(v); }, verlauf: w } }); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);

  // ---------- Tempo an künstlichen Hüllkurven (mit Rauschen, fehlenden Schlägen, Offbeats) ----------
  const tp = await p.evaluate(() => {
    let s = 5; const zuf = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return [84, 96, 110, 120, 128, 140, 150, 174].map((bpm) => {
      const n = 800, x = new Float32Array(n), P = 6000 / bpm, ph = zuf() * P;
      for (let j = 0; j < n; j++) x[j] = zuf() * 0.15;
      for (let t = ph; t < n; t += P) { if (zuf() < 0.1) continue; const j = Math.round(t + (zuf() - 0.5) * 2); if (j >= 0 && j < n) x[j] += 0.7 + zuf() * 0.5; const o = Math.round(t + P / 2); if (o < n) x[o] += 0.25 * zuf(); }
      const r = bbTempo(x), erk = 6000 / r.lag;
      let letzter = ph; while (letzter + P <= n - 1) letzter += P;
      const phaseFehler = Math.abs((n - 1 - r.phase) - letzter);
      return { bpm, erk: Math.round(erk * 10) / 10, ok: [1, 2, 0.5].some((f) => Math.abs(erk / (bpm * f) - 1) < 0.02), genau: Math.abs(erk / bpm - 1) < 0.02, phase: Math.min(phaseFehler, Math.abs(phaseFehler - P)) <= 2.5 || Math.abs(erk / bpm - 1) >= 0.02 };
    });
  });
  ck('Tempo: 84–150 BPM exakt (±2 %)', tp.filter((t) => t.bpm <= 150).every((t) => t.genau), tp.map((t) => t.bpm + '→' + t.erk).join(', '));
  ck('Tempo: 174 BPM richtig oder halbes Tempo', tp.find((t) => t.bpm === 174).ok);
  ck('Phase: letzter Schlag auf ±25 ms', tp.every((t) => t.phase));

  // ---------- Live mit simuliertem Mikrofon (120 BPM) ----------
  await p.click('#hubBeat'); await p.waitForTimeout(800);
  await p.click('.bb-stufe[data-stufe="mittel"]'); await p.waitForTimeout(200);
  await p.click('#bbLive'); await p.waitForTimeout(300);
  await p.screenshot({ path: ordner + '/bb-live-intro.png' });
  const altCtx = await p.evaluate(() => { window.__altCtx = ftAudio().c; return true; });
  await p.click('#bbMithoeren');
  await p.waitForTimeout(1500); await p.screenshot({ path: ordner + '/bb-live-hoeren.png' });
  await p.waitForFunction(() => bb && bb.live && bb.live.periode > 0, null, { timeout: 15000 });
  const bpm = await p.evaluate(() => 60 / bb.live.periode);
  ck('Live: Beat gefunden, 120 BPM', Math.abs(bpm - 120) < 1.5, bpm.toFixed(1) + ' BPM');
  await p.waitForTimeout(4000);
  // Stimmt das Raster? Starke Einsätze der letzten 4 s gegen die vorhergesagten Schläge
  const ras = await p.evaluate(() => {
    const L = bb.live, x = bbLiveHuelle(L, 600), mx = Math.max(...x), ab = [];
    for (let j = 2; j < x.length - 2; j++) if (x[j] > mx * 0.35 && x[j] >= x[j - 1] && x[j] >= x[j + 1] && x[j] >= x[j - 2] && x[j] >= x[j + 2]) {
      const t = (L.slot - 599 + j) / 100; let d = ((t - L.anker) % L.periode + L.periode) % L.periode; if (d > L.periode / 2) d -= L.periode; ab.push(Math.round(d * 1000));
    }
    return ab;
  });
  const P = 500, aufSchlag = ras.filter((d) => Math.abs(d) <= 30).length, aufAchtel = ras.filter((d) => Math.abs(d) <= 30 || Math.abs(Math.abs(d) - P / 2) <= 30).length;
  ck('Live: Raster liegt auf den Schlägen (±30 ms, Hi-Hats genau dazwischen)', aufSchlag >= 4 && aufAchtel === ras.length, aufSchlag + ' Schläge, ' + (aufAchtel - aufSchlag) + ' Hi-Hats, ' + (ras.length - aufAchtel) + ' daneben · ' + ras.join(' '));
  ck('Live: Noten werden laufend erzeugt', await p.evaluate(() => bb.noten.length >= 8 && bb.noten.every((n, i) => !i || n.t > bb.noten[i - 1].t)));
  await p.screenshot({ path: ordner + '/bb-live-spiel.png' });
  const z0 = await p.evaluate(() => bb.zaehler.slice());
  // Im Seitenkontext genau zur Notenzeit drücken – trifft man, was man hört?
  await p.evaluate(() => new Promise((ok) => { const erledigt = new Set(), t0 = performance.now(); const l = () => { const t = bbJetzt(); bb.noten.forEach((n, i) => { if (!erledigt.has(i) && t >= n.t - 0.004) { erledigt.add(i); document.dispatchEvent(new KeyboardEvent('keydown', { key: BB_TASTEN[n.bahn], bubbles: true })); } }); if (performance.now() - t0 > 9000) ok(); else requestAnimationFrame(l); }; l(); }));
  const z = (await p.evaluate(() => bb.zaehler.slice())).map((v, i) => v - z0[i]);
  ck('Live: beim Mitspielen alle Noten getroffen', z[3] === 0 && z[0] >= 10, 'Perfekt/Gut/Okay/Verpasst ' + z.join('/'));
  await p.click('#bbAbbruch');
  await p.waitForSelector('.ft-ergebnis', { timeout: 3000 });
  ck('Live: „Fertig“ → Ergebnis, Mikrofon aus', await p.evaluate(() => !bb.live.stream && !!document.querySelector('.bb-karte')));
  const sitz = await p.evaluate(() => ({ verlauf: navigator.audioSession.verlauf.join('>'), altZu: window.__altCtx.state, neu: ftAudio().c !== window.__altCtx, laeuft: ftAudio().c.state }));
  ck('iPhone-Hörer-Problem: vor dem Mithören „play-and-record“, danach zurück auf „playback“ und neuer Audio-Kontext', sitz.verlauf === 'play-and-record>playback' && sitz.altZu === 'closed' && sitz.neu, JSON.stringify(sitz));
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'beat').map((e) => e.i));
  ck('Verlauf: Live-Runde eingetragen', vl.length === 1 && /Live 12\d BPM/.test(vl[0]), vl.join(' | '));
  await p.click('#bbAndere'); await p.waitForTimeout(300);
  ck('Live-Knopf zeigt Sterne', /★/.test(await p.textContent('#bbLive')));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
