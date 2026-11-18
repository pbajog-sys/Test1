// Reise-Karte: Für jede mögliche aktuelle Station darf der Drache (mit Sprechblase) keine andere Station verdecken,
// Namensschilder überlappen nicht, nichts ragt aus dem Bild, die Kopfleiste bleibt beim Scrollen sichtbar.
// Aufruf: python3 -m http.server 8765, dann  node tests/slo-karte.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch(); let ok = 0, fail = 0;
  for (const [name, dev] of [['iPhone SE', devices['iPhone SE']], ['iPhone 13', devices['iPhone 13']], ['iPad', { viewport: { width: 820, height: 1180 } }]]) {
    const ctx = await b.newContext({ ...dev, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'P', avatar: '🐸', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.fuehrung.v1', JSON.stringify({ gesehen: { slo: true } })); });
    const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
    await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
    await p.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });   // Messen ohne Einflug-Animation
    await p.evaluate(() => show('slo', '🐉 Slowenisch'));
    const probleme = []; let blasen = 0;
    for (let k = 0; k < 20; k++) {
      const r = await p.evaluate((k) => {
        const st = sloStore(); st.stufe = {}; SLO_EINHEITEN.slice(0, k).forEach((u) => { st.stufe[u.id] = 3; }); saveJson(SLO_KEY, st);
        sloKarte();
        const m = $('sloMaskottchen'), mr = m.getBoundingClientRect(), bl = m.querySelector('.slo-blase'), br = bl.offsetParent ? bl.getBoundingClientRect() : mr;
        const box = { left: Math.min(mr.left, br.left), right: Math.max(mr.right, br.right), top: Math.min(mr.top, br.top), bottom: Math.max(mr.bottom, br.bottom) };
        const schnitt = (a, c) => a.left < c.right - 3 && c.left < a.right - 3 && a.top < c.bottom - 3 && c.top < a.bottom - 3;
        const treffer = [];
        document.querySelectorAll('#slo-karte .slo-station').forEach((s, i) => { ['.slo-knoten', '.slo-info'].forEach((sel) => { const e = s.querySelector(sel); if (e && (i !== k || sel === '.slo-info') && schnitt(box, e.getBoundingClientRect())) treffer.push(SLO_EINHEITEN[i].ort + sel.replace('.slo-', ' ')); }); });
        const pfad = $('sloPfad').getBoundingClientRect(), raus = box.left < pfad.left - 2 || box.right > pfad.right + 2;
        return { treffer, raus, blase: !m.classList.contains('ohne-blase') };
      }, k);
      blasen += r.blase ? 1 : 0;
      if (r.treffer.length || r.raus) probleme.push('Station ' + (k + 1) + ': ' + r.treffer.join(', ') + (r.raus ? ' (ragt hinaus)' : ''));
    }
    const schilder = await p.evaluate(() => { const r = [...document.querySelectorAll('#slo-karte .slo-info')].map((e) => e.getBoundingClientRect()); let n = 0; for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { const a = r[i], c = r[j]; if (a.left < c.right - 2 && c.left < a.right - 2 && a.top < c.bottom - 2 && c.top < a.bottom - 2) n++; } return n + r.filter((a) => a.left < 0 || a.right > innerWidth).length; });
    await p.evaluate(() => { const st = sloStore(); st.stufe = {}; saveJson(SLO_KEY, st); sloKarte(); }); await p.waitForTimeout(400);
    const kopf = await p.evaluate(() => { const k = document.querySelector('.slo-kopfleiste').getBoundingClientRect(); return k.top >= -1 && k.top < 40 && document.querySelector('.slo-buehne').scrollTop > 300; });
    await p.screenshot({ path: ordner + '/karte-' + name.replace(/ /g, '') + '.png' });
    const gut = !probleme.length && !schilder && kopf && !fehler.length;
    gut ? ok++ : fail++;
    console.log((gut ? '✓ ' : '✗ ') + name + ': Drache ' + (probleme.length ? 'verdeckt → ' + probleme.join(' | ') : 'frei an allen 20 Stationen') + ' (Sprechblase an ' + blasen + '/20)' + ' · Schilder ' + (schilder ? schilder + ' Probleme' : 'ok') + ' · Kopfleiste ' + (kopf ? 'sichtbar' : 'NICHT sichtbar') + (fehler.length ? ' · Fehler: ' + fehler.join(' | ') : ''));
    await ctx.close();
  }
  console.log(ok + ' bestanden, ' + fail + ' fehlgeschlagen'); await b.close(); process.exit(fail ? 1 : 0);
})();
