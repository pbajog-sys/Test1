// Klassiker: Solitär, Sudoku, Holzblöcke, Minensuche, Vier in einer Reihe – Regeln, Generatoren und echte Bedienung.
// Aufruf: python3 -m http.server 8765, dann  node tests/klassiker.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const ergebnisWeg = async () => { if (await p.$('.kl-ergebnis')) await p.evaluate(() => document.querySelectorAll('.kl-ergebnis').forEach((x) => x.remove())); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  await p.click('#hubKlassiker'); await p.waitForTimeout(900);
  ck('Klassiker-App mit 9 Spielen', (await p.$$('[data-kl]')).length === 9 && await p.evaluate(() => $('screen-klassiker').classList.contains('active')));
  await p.screenshot({ path: ordner + '/kl-home.png' });

  // ---------- Sudoku ----------
  const gen = await p.evaluate(() => {
    const out = {};
    for (const st of ['leicht', 'mittel', 'schwer']) {
      let eindeutig = 0, passt = 0, geben = 0, t0 = performance.now();
      for (let k = 0; k < 30; k++) {
        const G = sdErzeugen(st, zufallsGenerator('sd' + st + k));
        if (sdLoesen(G.raetsel, 2).anzahl === 1) eindeutig++;
        if (G.raetsel.every((v, i) => !v || v === G.loesung[i]) && sdLoesen(G.loesung, 2).anzahl === 1) passt++;
        geben += G.raetsel.filter(Boolean).length;
      }
      out[st] = { eindeutig, passt, geben: Math.round(geben / 30), ms: Math.round((performance.now() - t0) / 30) };
    }
    return out;
  });
  ck('Sudoku: 90 Rätsel, alle mit genau einer Lösung', ['leicht', 'mittel', 'schwer'].every((s) => gen[s].eindeutig === 30 && gen[s].passt === 30), JSON.stringify(gen));
  ck('Sudoku: Schwer hat weniger Vorgaben als Leicht', gen.schwer.geben < gen.mittel.geben && gen.mittel.geben < gen.leicht.geben);
  await p.click('[data-kl="sudoku"]'); await p.waitForTimeout(300);
  await p.click('[data-sd="leicht"]'); await p.waitForSelector('#sdGitter', { timeout: 10000 });
  const leer = await p.evaluate(() => sd.raetsel.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0));
  // ein Fehler absichtlich
  await p.click('.sd-z[data-i="' + leer[0] + '"]');
  const falsch = await p.evaluate((i) => (sd.loesung[i] % 9) + 1, leer[0]);
  await p.click('.sd-ziffer[data-d="' + falsch + '"]');
  ck('Sudoku: falsche Ziffer wird rot und zählt als Fehler', await p.evaluate((i) => sd.fehler === 1 && document.querySelector('.sd-z[data-i="' + i + '"]').classList.contains('falsch'), leer[0]));
  await p.screenshot({ path: ordner + '/kl-sudoku.png' });
  for (const i of leer) { await p.click('.sd-z[data-i="' + i + '"]'); const d = await p.evaluate((k) => sd.loesung[k], i); await p.click('.sd-ziffer[data-d="' + d + '"]'); }
  await p.waitForSelector('.kl-ergebnis', { timeout: 3000 });
  ck('Sudoku: per Tippen gelöst → „Gelöst!“', /Gelöst/.test(await p.textContent('.kl-ergebnis')));
  await ergebnisWeg(); await p.click('#klZurueck'); await p.waitForTimeout(300);

  // ---------- Solitär ----------
  await p.click('[data-kl="solitaer"]'); await p.waitForTimeout(400);
  const deal = await p.evaluate(() => { const alle = [...sol.stock, ...sol.tab.flat()]; return { n: alle.length, eins: new Set(alle.map((k) => k.f + '-' + k.w)).size, laengen: sol.tab.map((s) => s.length).join(''), oben: sol.tab.every((s) => s[s.length - 1].o && s.slice(0, -1).every((k) => !k.o)) }; });
  ck('Solitär: 52 verschiedene Karten, Spalten 1–7, nur oberste offen', deal.n === 52 && deal.eins === 52 && deal.laengen === '1234567' && deal.oben, JSON.stringify(deal));
  ck('Solitär: Regeln (rot auf schwarz absteigend, Ablage ab Ass)', await p.evaluate(() => solAufSpalte({ f: 1, w: 9 }, [{ f: 0, w: 10, o: true }]) && !solAufSpalte({ f: 2, w: 9 }, [{ f: 1, w: 10, o: true }]) && solAufSpalte({ f: 0, w: 13 }, []) && !solAufSpalte({ f: 0, w: 12 }, []) && solAufAblage({ f: 3, w: 1 }, []) && solAufAblage({ f: 3, w: 2 }, [{ f: 3, w: 1 }]) && !solAufAblage({ f: 2, w: 2 }, [{ f: 3, w: 1 }])));
  await p.screenshot({ path: ordner + '/kl-solitaer.png' });
  // 400 Tipps eines Zufalls-Bots über die echte Oberfläche, nach jedem Tipp alles prüfen
  const bot = await p.evaluate(() => {
    let verstoss = '', zuege0 = sol.zuege;
    const ok = () => {
      const alle = [...sol.stock, ...sol.waste, ...sol.found.flat(), ...sol.tab.flat()];
      if (alle.length !== 52 || new Set(alle.map((k) => k.f + '-' + k.w)).size !== 52) return 'Kartenzahl';
      for (const a of sol.found) for (let i = 0; i < a.length; i++) if (a[i].w !== i + 1 || a[i].f !== a[0].f) return 'Ablage';
      for (const sp of sol.tab) { const i = sp.findIndex((k) => k.o); if (i >= 0) for (let k = i + 1; k < sp.length; k++) if (!sp[k].o || sp[k].w !== sp[k - 1].w - 1 || SOL_ROT[sp[k].f] === SOL_ROT[sp[k - 1].f]) return 'Spalte'; if (sp.length && !sp[sp.length - 1].o) return 'oben zu'; }
      return '';
    };
    for (let n = 0; n < 400 && !sol.fertig; n++) {
      const ziele = [...document.querySelectorAll('#solFeld [data-z]')];
      const el = Math.random() < 0.3 ? document.querySelector('[data-z="stock"]') : ziele[Math.floor(Math.random() * ziele.length)];
      el.click();
      verstoss = ok(); if (verstoss) break;
    }
    return { verstoss, zuege: sol.zuege - zuege0, ablage: sol.found.reduce((a, x) => a + x.length, 0) };
  });
  ck('Solitär: 400 Zufalls-Tipps ohne Regelverstoß', !bot.verstoss && bot.zuege > 20, JSON.stringify(bot));
  const vorRueck = await p.evaluate(() => solKopie(sol));
  await p.click('[data-z="stock"]'); await p.click('#solRueck');
  ck('Solitär: ↶ macht den Zug rückgängig', await p.evaluate((v) => { const a = JSON.parse(v), b = JSON.parse(solKopie(sol)); return JSON.stringify([a.stock, a.waste, a.tab, a.found]) === JSON.stringify([b.stock, b.waste, b.tab, b.found]); }, vorRueck));
  // Fortsetzen nach Zurück + Neuladen
  const stand = await p.evaluate(() => JSON.stringify(sol.tab));
  await p.click('#klZurueck'); await p.waitForTimeout(300);
  ck('Startseite zeigt „Fortsetzen“', /Fortsetzen/.test(await p.textContent('[data-kl="solitaer"]')));
  await p.reload(); await p.waitForTimeout(900); await p.click('#hubKlassiker'); await p.waitForTimeout(800); await p.click('[data-kl="solitaer"]'); await p.waitForTimeout(300);
  ck('Solitär: Partie nach Neuladen fortgesetzt', (await p.evaluate(() => JSON.stringify(sol.tab))) === stand);
  // fast gewonnen: nur die vier Könige liegen noch in den Spalten → „Fertig legen“
  await p.evaluate(() => { sol.stock = []; sol.waste = []; sol.found = [0, 1, 2, 3].map((f) => Array.from({ length: 12 }, (_, i) => ({ f, w: i + 1, o: true }))); sol.tab = [0, 1, 2, 3].map((f) => [{ f, w: 13, o: true }]).concat([[], [], []]); solZeichnen(); });
  await p.click('#solAuto'); await p.waitForSelector('.kl-ergebnis', { timeout: 4000 });
  ck('Solitär: „Fertig legen“ → Gewonnen', /Gewonnen/.test(await p.textContent('.kl-ergebnis')));
  await ergebnisWeg(); await p.click('#klZurueck'); await p.waitForTimeout(300);

  // ---------- Holzblöcke ----------
  ck('Blöcke: Reihe + Spalte + 3×3-Block werden erkannt', await p.evaluate(() => {
    const f = new Array(81).fill(0); for (let c = 0; c < 9; c++) f[c] = 1; for (let r = 0; r < 9; r++) f[r * 9 + 8] = 1; [30, 31, 32, 39, 40, 41, 48, 49, 50].forEach((i) => { f[i] = 1; });
    const x = blAbraeumen(f); return x.linien === 3 && x.weg.length === 9 + 8 + 9;
  }));
  await p.click('[data-kl="bloecke"]'); await p.waitForTimeout(400);
  await p.evaluate(() => { bl.teile = [{ t: 0, f: 0 }, { t: 9, f: 1 }, { t: 3, f: 2 }]; blZeichnen(); });
  // Ziehen: 2×2-Teil (Slot 2) mit der Maus aufs Feld
  const teil = await p.$('[data-teil="1"]'), tb = await teil.boundingBox(), fb = await (await p.$('#blFeld')).boundingBox(), z = fb.width / 9;
  await p.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await p.mouse.down();
  const zx = fb.x + 4 * z + z, zy = fb.y + 4 * z + 2 * z + z * 1.2;   // Teil schwebt über dem Finger → Ziel (4,4)
  for (let k = 1; k <= 8; k++) await p.mouse.move(tb.x + (zx - tb.x) * k / 8, tb.y + (zy - tb.y) * k / 8);
  await p.screenshot({ path: ordner + '/kl-bloecke-ziehen.png' });
  await p.mouse.up(); await p.waitForTimeout(150);
  const gelegt = await p.evaluate(() => bl.feld.map((v, i) => (v ? i : -1)).filter((i) => i >= 0));
  ck('Blöcke: Teil per Ziehen aufs Feld gelegt', gelegt.length === 4 && gelegt.includes(40), gelegt.join(','));
  // Antippen + Zielfeld antippen
  await p.click('[data-teil="0"]'); await p.click('.bl-z[data-i="0"]'); await p.waitForTimeout(100);
  ck('Blöcke: Antippen + Zielfeld antippen legt das Teil', await p.evaluate(() => bl.feld[0] > 0 && !bl.teile[0]));
  // Reihe vollmachen → wird abgeräumt und gibt Bonus
  await p.evaluate(() => { for (let c = 1; c < 9; c++) bl.feld[72 + c] = 1; bl.feld[72] = 0; bl.teile = [{ t: 0, f: 0 }, null, null]; blZeichnen(); });
  const vorher = await p.evaluate(() => bl.punkte);
  await p.click('[data-teil="0"]'); await p.click('.bl-z[data-i="72"]'); await p.waitForTimeout(450);
  ck('Blöcke: volle Reihe wird abgeräumt (+10 Bonus)', await p.evaluate((v) => bl.feld.slice(72).every((x) => !x) && bl.punkte >= v + 11, vorher));
  await p.screenshot({ path: ordner + '/kl-bloecke.png' });
  // kein Platz → Spielende
  await p.evaluate(() => { bl.feld = bl.feld.map((v, i) => ((Math.floor(i / 9) + i) % 2 ? 1 : 0)); bl.teile = [{ t: 9, f: 0 }, null, null]; bl.ende = false; blZeichnen(); blEndePruefen(); });
  ck('Blöcke: kein Platz → Spielende', !!(await p.$('.kl-ergebnis')));
  await ergebnisWeg(); await p.click('#klZurueck'); await p.waitForTimeout(300);

  // ---------- Minensuche ----------
  await p.click('[data-kl="minen"]'); await p.waitForTimeout(300); await p.click('[data-mn="leicht"]'); await p.waitForTimeout(200);
  await p.click('.mn-z[data-i="40"]'); await p.waitForTimeout(150);
  const erst = await p.evaluate(() => ({ minen: mn.minen.reduce((a, x) => a + x, 0), sicher: [40, ...mnNachbarn(40)].every((i) => !mn.minen[i]), offen: mn.offen.reduce((a, x) => a + x, 0) }));
  ck('Minen: erster Tipp sicher, 10 Minen, Fläche öffnet sich', erst.minen === 10 && erst.sicher && erst.offen >= 9, JSON.stringify(erst));
  ck('Minen: Zahlen stimmen', await p.evaluate(() => mn.offen.every((o, i) => !o || mn.minen[i] || mnZahl(i) === mnNachbarn(i).filter((k) => mn.minen[k]).length)));
  // Flagge per Modus
  const zu = await p.evaluate(() => mn.offen.findIndex((o, i) => !o && mn.minen[i]));
  await p.click('#mnModus'); await p.click('.mn-z[data-i="' + zu + '"]'); await p.click('#mnModus');
  ck('Minen: Flagge setzen', await p.evaluate((i) => mn.flagge[i] === 1, zu));
  await p.screenshot({ path: ordner + '/kl-minen.png' });
  const sicher = await p.evaluate(() => mn.offen.map((o, i) => (!o && !mn.minen[i] ? i : -1)).filter((i) => i >= 0));
  for (const i of sicher) { if (await p.evaluate((k) => !mn.offen[k], i)) await p.click('.mn-z[data-i="' + i + '"]'); }
  await p.waitForSelector('.kl-ergebnis', { timeout: 3000 });
  ck('Minen: alle sicheren Felder → „Geräumt!“', /Geräumt/.test(await p.textContent('.kl-ergebnis')));
  await ergebnisWeg();
  await p.evaluate(() => mnStart(true, 'leicht')); await p.click('.mn-z[data-i="0"]');
  const mine = await p.evaluate(() => mn.minen.findIndex((m) => m));
  await p.click('.mn-z[data-i="' + mine + '"]'); await p.waitForSelector('.kl-ergebnis', { timeout: 3000 });
  ck('Minen: Mine getroffen → „Boom“', /Boom/.test(await p.textContent('.kl-ergebnis')));
  await ergebnisWeg(); await p.click('#klZurueck'); await p.waitForTimeout(300);

  // ---------- Vier in einer Reihe ----------
  const ki = await p.evaluate(() => {
    const B = () => new Array(42).fill(0), set = (b, r, c, s) => { b[r * 7 + c] = s; };
    const h = B(); [0, 1, 2, 3].forEach((c) => set(h, 5, c, 1)); const v = B(); [2, 3, 4, 5].forEach((r) => set(v, r, 6, 2)); const d = B(); [0, 1, 2, 3].forEach((k) => set(d, 5 - k, k, 1));
    const gewinnt = B(); [0, 1, 2].forEach((c) => set(gewinnt, 5, c, 2));   // Computer (2) kann in Spalte 3 gewinnen
    const block = B(); [4, 5, 6].forEach((c) => set(block, 5, c, 1));      // Spieler droht in Spalte 3
    const t0 = performance.now(); const leerZug = vrComputerZug(B(), 'schwer'); const ms = performance.now() - t0;
    return { h: (vrGewinner(h) || {}).s, v: (vrGewinner(v) || {}).s, d: (vrGewinner(d) || {}).s, leer: vrGewinner(B()), gewinnt: vrComputerZug(gewinnt, 'leicht'), block: vrComputerZug(block, 'leicht'), leerZug, ms: Math.round(ms) };
  });
  ck('Vier: Sieg waagrecht/senkrecht/schräg erkannt', ki.h === 1 && ki.v === 2 && ki.d === 1 && !ki.leer);
  ck('Vier: Computer gewinnt sofort und blockt Drohungen', ki.gewinnt === 3 && ki.block === 3, JSON.stringify(ki));
  ck('Vier: „Schwer“ denkt schnell genug', ki.ms < 3000, ki.ms + ' ms, Eröffnung Spalte ' + ki.leerZug);
  // „Schwer“ gegen „Leicht“: Schwer muss fast immer gewinnen
  const duell = await p.evaluate(() => {
    let s = 0;
    for (let n = 0; n < 6; n++) {
      const B = new Array(42).fill(0); let dran = 1, g = null;
      while (!g && B.some((x) => !x)) { const c = vrComputerZug(B.slice(), dran === 1 ? 'schwer' : 'leicht', dran); const r = vrFrei(B, c); B[r * 7 + c] = dran; g = vrGewinner(B); dran = 3 - dran; }
      if (g && g.s === 1) s++;
    }
    return s;
  });
  ck('Vier: „Schwer“ schlägt „Leicht“ (≥ 5 von 6)', duell >= 5, duell + ' von 6');
  await p.click('[data-kl="vier"]'); await p.waitForTimeout(300); await p.click('[data-vr="mittel"]'); await p.waitForTimeout(200);
  for (let n = 0; n < 21 && !(await p.$('.kl-ergebnis')); n++) {
    const c = await p.evaluate(() => (vr.ende ? -1 : vrComputerZug(vr.B.slice(), 'schwer', 1)));
    if (c < 0) break;
    await p.click('.vr-loch[data-c="' + c + '"]'); await p.waitForFunction(() => !vr.denkt, null, { timeout: 5000 }); await p.waitForTimeout(80);
    if (n === 3) await p.screenshot({ path: ordner + '/kl-vier.png' });
  }
  await p.waitForSelector('.kl-ergebnis', { timeout: 4000 });
  ck('Vier: Partie über die Oberfläche bis zum Ende', !!(await p.$('.kl-ergebnis')), await p.textContent('.kl-erg-karte h3'));
  await ergebnisWeg();

  // ---------- Zahlenpaare ----------
  ck('Zahlenpaare: Regeln (gleich/Summe 10, nebeneinander, senkrecht, schräg, Zeilenumbruch, blockiert)', await p.evaluate(() => {
    const z = new Array(27).fill(0), t = (a, b) => zpPasst(z, a, b);
    z[0] = 3; z[1] = 7; const neben = t(0, 1);
    z[2] = 4; z[11] = 4; const senk = t(2, 11);
    z[3] = 6; z[13] = 6; const schraeg = t(3, 13);
    z[8] = 5; z[9] = 5; const umbruch = t(8, 9);
    z[20] = 2; z[22] = 2; z[21] = 9; const blockiert = !t(20, 22);
    z[24] = 1; z[25] = 3; const falsch = !t(24, 25);
    z[14] = 8; z[22] = 8; const schraegL = t(14, 22);
    return neben && senk && schraeg && umbruch && blockiert && falsch && schraegL;
  }));
  await p.click('#klZurueck'); await p.waitForTimeout(300);
  await p.click('[data-kl="zahlen"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: ordner + '/kl-zahlen.png' });
  await p.evaluate(() => { zp.z = [1, 9, 5, 5, 0, 0, 0, 0, 0, 2, 8]; zp.nachlegen = 1; zp.punkte = 0; zpZeichnen(); });
  await p.click('.zp-z[data-i="0"]'); await p.click('.zp-z[data-i="1"]');
  ck('Zahlenpaare: Paar per Tippen gestrichen', await p.evaluate(() => !zp.z[0] && !zp.z[1] && zp.punkte === 1));
  await p.click('#zpNach');
  ck('Zahlenpaare: Nachlegen hängt die restlichen Zahlen an', await p.evaluate(() => zp.z.filter(Boolean).join('') === '55285528'));
  for (let n = 0; n < 12 && !(await p.$('.kl-ergebnis')); n++) { const pr = await p.evaluate(() => zpEinPaar(zp.z)); if (!pr) break; await p.click('.zp-z[data-i="' + pr[0] + '"]'); await p.click('.zp-z[data-i="' + pr[1] + '"]'); }
  await p.waitForSelector('.kl-ergebnis', { timeout: 3000 });
  ck('Zahlenpaare: alles geräumt → Sieg', /Alles geräumt/.test(await p.textContent('.kl-ergebnis')));
  await ergebnisWeg(); await p.click('#klZurueck'); await p.waitForTimeout(300);

  // ---------- Planeten-Fusion ----------
  await p.click('[data-kl="planeten"]'); await p.waitForTimeout(400);
  await p.evaluate(() => { pf.jetzt = 2; pf.ziel = pf.W * 0.3; pf.sperre = 0; pfFallen(); });
  const cvb = await (await p.$('#pfBild')).boundingBox();
  await p.waitForTimeout(700);
  await p.mouse.click(cvb.x + cvb.width * 0.7, cvb.y + 40); await p.waitForTimeout(1500);
  ck('Planeten: Fallen lassen per Tippen, Planeten liegen am Boden', await p.evaluate(() => pf.obj.length === 2 && pf.obj.every((o) => o.y > pf.H * 0.6 && Number.isFinite(o.x))), await p.evaluate(() => pf.obj.length + ' Objekte'));
  const fusion = await p.evaluate(() => { pf.obj = [{ id: 901, x: pf.W / 2 - 5, y: pf.H - 60, vx: 0, vy: 0, lv: 4, alter: 100, ueber: 0 }, { id: 902, x: pf.W / 2 + 5, y: pf.H - 60, vx: 0, vy: 0, lv: 4, alter: 100, ueber: 0 }]; const p0 = pf.punkte; for (let i = 0; i < 5; i++) pfSchritt(); return { n: pf.obj.length, lv: pf.obj[0] && pf.obj[0].lv, plus: pf.punkte - p0 }; });
  ck('Planeten: zwei gleiche verschmelzen zum Nächstgrößeren', fusion.n === 1 && fusion.lv === 5 && fusion.plus > 0, JSON.stringify(fusion));
  const stabil = await p.evaluate(() => { pf.obj = []; for (let i = 0; i < 25; i++) pf.obj.push({ id: 1000 + i, x: 20 + (i * 37) % (pf.W - 40), y: pf.H - 30 - (i % 5) * 40, vx: 0, vy: 0, lv: i % 4, alter: 100, ueber: 0 }); for (let k = 0; k < 600; k++) pfSchritt(); return pf.obj.every((o) => Number.isFinite(o.x) && Number.isFinite(o.y) && o.x >= -1 && o.x <= pf.W + 1 && o.y <= pf.H + 1); });
  ck('Planeten: Physik bleibt stabil (keine Ausreißer)', stabil);
  await p.screenshot({ path: ordner + '/kl-planeten.png' });
  // je ein Planet jeder Größe (verschmelzen also nicht) – zusammen zu viel für die Box
  const ende = await p.evaluate(() => { pf.obj = []; for (let lv = 10; lv >= 0; lv--) pf.obj.push({ id: 2000 + lv, x: pf.W * (0.2 + 0.6 * ((lv * 37) % 11) / 10), y: pf.H - (11 - lv) * pf.W * 0.25, vx: 0, vy: 0, lv, alter: 100, ueber: 0 }); let k = 0; while (!pf.ende && k < 4000) { pfSchritt(); k++; } return { ende: pf.ende, schritte: k }; });
  await p.waitForSelector('.kl-ergebnis', { timeout: 3000 });
  ck('Planeten: Ende kommt erst nach Verweilen über der Linie (> 1,5 s)', ende.ende && ende.schritte > 100, JSON.stringify(ende));
  ck('Planeten: über der Linie → Spielende', !!(await p.$('.kl-ergebnis')));
  await ergebnisWeg(); await p.click('#klZurueck'); await p.waitForTimeout(300);

  // ---------- Schrauben sortieren / Farben umfüllen ----------
  const sog = await p.evaluate(() => { const out = []; for (const l of [1, 3, 6, 9, 12, 15]) { const t0 = performance.now(), S = soLevel(l, zufallsGenerator('so' + l)); out.push({ l, farben: S.filter((x) => x.length).length, loesbar: soLoesbar(S), ms: Math.round(performance.now() - t0) }); } return out; });
  ck('Sortieren: Level 1–15 erzeugt und alle lösbar', sog.every((x) => x.loesbar), sog.map((x) => 'L' + x.l + ':' + x.farben + 'F/' + x.ms + 'ms').join(' '));
  ck('Sortieren: Bau schnell genug (< 2 s je Level)', sog.every((x) => x.ms < 2000));
  await p.click('[data-kl="schrauben"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: ordner + '/kl-schrauben.png' });
  await p.evaluate(() => { so.staebe = [[0, 0, 0, 1], [1, 1, 1, 0], []]; so.zuege = 0; so.rueck = []; soZeichnen(); });
  await p.click('.so-stab[data-i="0"]'); await p.click('.so-stab[data-i="1"]');
  ck('Sortieren: falscher Zug (andere Farbe oben, voll) wird abgelehnt', await p.evaluate(() => so.zuege === 0));
  await p.click('.so-stab[data-i="1"]');
  for (const [a, b] of [[0, 2], [1, 0], [2, 1]]) { await p.click('.so-stab[data-i="' + a + '"]'); await p.click('.so-stab[data-i="' + b + '"]'); }
  await p.waitForSelector('.kl-ergebnis', { timeout: 3000 });
  ck('Sortieren: sortiert → Level geschafft, nächstes Level gespeichert', /geschafft/.test(await p.textContent('.kl-ergebnis')) && await p.evaluate(() => klStore().stat.schraubenLevel === 2));
  await ergebnisWeg(); await p.click('#klZurueck'); await p.waitForTimeout(300);
  await p.click('[data-kl="wasser"]'); await p.waitForTimeout(500);
  ck('Farben umfüllen: Gläser-Ansicht mit Level 1', await p.evaluate(() => !!document.querySelector('.so-feld.wasser') && so.lvl === 1 && so.staebe.length === 5));
  await p.click('.so-stab[data-i="0"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: ordner + '/kl-wasser.png' });
  await p.click('#klZurueck'); await p.waitForTimeout(300);

  const vl = await p.evaluate(() => [...new Set((loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'klassiker').map((e) => e.x.modus))].sort().join(','));
  ck('Verlauf: alle Spiele eingetragen', vl === 'bloecke,minen,planeten,schrauben,solitaer,sudoku,vier,zahlen', vl);
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
