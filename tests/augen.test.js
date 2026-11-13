// Augenmaß: faire Darstellung (Querstrich statt Punkt beim Halbieren, Griff neben der Linie bei „Länge“, flache Linienenden)
// und der neue Modus „Schätzen“ (Länge, Höhe, Fläche, Winkel, Anteil): 600 Runden auf Gültigkeit, Wertung, Bedienung.
// Aufruf: python3 -m http.server 8765, dann  node tests/augen.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  // ---------- faire Darstellung ----------
  const fair = await p.evaluate(() => {
    const R = agRunden('x1', 'mittel'), h = R.find((r) => r.typ === 'halbieren'), l = R.find((r) => r.typ === 'laenge');
    const sh = agSzene(h, h.m, false), sl = agSzene(l, l.L, false);
    const d = document.createElement('div'); d.innerHTML = '<svg>' + sl + '</svg>';
    const griff = d.querySelector('.ag-griff'), linie = d.querySelector('.ag-du-linie');
    const gx = +griff.getAttribute('cx'), gy = +griff.getAttribute('cy'), ex = +linie.getAttribute('x2'), ey = +linie.getAttribute('y2');
    return { strich: /ag-du-strich/.test(sh) && !/class="ag-du"/.test(sh), griffAbstand: Math.round(Math.hypot(gx - ex, gy - ey)), keineEndpunkte: !/ag-ende/.test(sh) };
  });
  ck('Halbieren: Markierung als feiner Querstrich, keine Endpunkte an der Linie', fair.strich && fair.keineEndpunkte, JSON.stringify(fair));
  ck('Länge: Griff sitzt 30 px neben dem Linienende (verlängert die Linie nicht)', fair.griffAbstand === 30, JSON.stringify(fair));
  const proj = await p.evaluate(() => { const st = getComputedStyle(document.createElement('div')); return true; });
  // ---------- Schätzen: viele Runden ----------
  const pruef = await p.evaluate(() => {
    const out = { n: 0, fehler: [], typen: {} };
    ['leicht', 'mittel', 'profi'].forEach((stufe) => { for (let i = 0; i < 200; i++) {
      const R = agRundenSchaetzen('s' + i, stufe);
      if (R.length !== 5 || new Set(R.map((r) => r.typ)).size !== 5) out.fehler.push('Runde ' + i + ' ' + stufe + ': nicht alle 5 Typen');
      R.forEach((rd) => {
        out.n++; out.typen[rd.typ] = (out.typen[rd.typ] || 0) + 1;
        if (!(rd.wahr > 0) || rd.wahr < rd.min || rd.wahr > rd.max) out.fehler.push(rd.typ + ' außerhalb: ' + rd.wahr + ' [' + rd.min + ',' + rd.max + ']');
        const svg = agSzene(rd, null, true), zahlen = [...svg.matchAll(/(?:x|y|x1|y1|x2|y2|cx|cy)="(-?[\d.]+)"/g)].map((m) => +m[1]);
        if (zahlen.some((z) => z < -1 || z > 401)) out.fehler.push(rd.typ + ' ragt aus der Fläche (' + stufe + ' ' + i + ')');
        const pos = agZuRegler(rd, rd.wahr), zur = agVonRegler(rd, pos);
        if (Math.abs(zur - rd.wahr) / Math.max(1, rd.wahr) > 0.02) out.fehler.push(rd.typ + ' Regler ' + rd.wahr + '→' + zur);
        const [e0] = agFehler(rd, rd.wahr), T = AG_TYPEN[rd.typ];
        if (agPunkte(rd, e0) !== 10) out.fehler.push(rd.typ + ' genau ≠ 10 Punkte');
        const daneben = T.rel ? rd.wahr * (1 + T.tol) : rd.wahr + T.tol;
        if (agPunkte(rd, agFehler(rd, daneben)[0]) !== 0) out.fehler.push(rd.typ + ' Toleranzgrenze');
      });
    } });
    return out;
  });
  ck('Schätzen: 600 Runden – je 5 verschiedene Aufgaben, Lösung im Reglerbereich, alles innerhalb der Fläche, Regler hin und zurück exakt', !pruef.fehler.length && pruef.n === 3000, pruef.fehler.slice(0, 4).join(' | ') + ' ' + JSON.stringify(pruef.typen));
  ck('Wertung: genau = 10 Punkte, an der Toleranzgrenze (±35 % Länge/Höhe, ±50 % Fläche, ±25° Winkel, ±15 Prozentpunkte) = 0', !pruef.fehler.some((f) => /Punkte|Toleranz/.test(f)));
  // ---------- Bedienung ----------
  await p.evaluate(() => { show('augen', '📐 Augenmaß'); augenIntro(); }); await p.waitForTimeout(300);
  await p.click('#agModi [data-modus="schaetzen"]'); await p.waitForTimeout(200);
  ck('Modus „Schätzen“ wählbar, Einleitung passt sich an', /Schätzaufgaben/.test(await p.textContent('#ag-intro .ag-lead')) && /Höhe/.test(await p.textContent('#ag-intro .ag-typen')));
  await bild('ag-intro');
  await p.click('#agLos'); await p.waitForTimeout(300);
  ck('Runde startet mit Regler, „Fertig“ erst nach dem Einstellen', await p.evaluate(() => !$('agSchaetzen').hidden && $('agFertig').disabled && ag.modus === 'schaetzen'));
  await bild('ag-schaetzen');
  for (let i = 0; i < 5; i++) {
    await p.evaluate(() => { const rd = ag.runden[ag.i]; const r = $('agRegler'); r.value = agZuRegler(rd, rd.wahr * (AG_TYPEN[rd.typ].rel ? 1.1 : 1) + (AG_TYPEN[rd.typ].rel ? 0 : 3)); r.dispatchEvent(new Event('input')); });
    if (i === 0) { await p.click('#agSchaetzen [data-pm="1"]'); await p.waitForTimeout(50); }
    await p.click('#agFertig'); await p.waitForTimeout(250);
    if (i === 1) await bild('ag-loesung');
    await p.click('#agWeiter'); await p.waitForTimeout(250);
  }
  const ende = await p.evaluate(() => ({ teil: !$('ag-ende').hidden, summe: ag.punkte.reduce((a, b) => a + b, 0), bestS: (agStore().bestS || {}).leicht, bestKlassisch: (agStore().best || {}).leicht }));
  ck('Runde zu Ende: Punkte gespeichert unter „Schätzen“ (klassische Bestwerte unberührt)', ende.teil && ende.summe > 25 && ende.bestS === Math.round(ende.summe * 10) / 10 && ende.bestKlassisch == null, JSON.stringify(ende));
  await bild('ag-ende');
  // klassisch noch spielbar: Halbieren projiziert auf die Linie
  await p.evaluate(() => { agModus = 'ziehen'; augenIntro(); augenStart({ stufe: 'leicht', seed: 'h' }); while (ag.runden[ag.i].typ !== 'halbieren') ag.i++; agRundeZeigen(); });
  const halb = await p.evaluate(() => { const rd = ag.runden[ag.i], svg = $('agFlaeche'), m = svg.getScreenCTM(); const pt = agPunkt(rd.m, rd.w + Math.PI / 2, 40); svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: m.a * pt[0] + m.e, clientY: m.d * pt[1] + m.f, bubbles: true, pointerId: 1 })); svg.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 })); return agFehler(rd, ag.wert)[0]; });
  ck('Halbieren: 40 px neben der Linie getippt zählt nur die Position entlang der Linie', halb < 0.02, String(halb));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
