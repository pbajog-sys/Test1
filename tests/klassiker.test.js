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
  ck('Klassiker-App mit 5 Spielen', (await p.$$('[data-kl]')).length === 5 && await p.evaluate(() => $('screen-klassiker').classList.contains('active')));
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

  const vl = await p.evaluate(() => [...new Set((loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'klassiker').map((e) => e.x.modus))].sort().join(','));
  ck('Verlauf: alle 5 Spiele eingetragen', vl === 'bloecke,minen,solitaer,sudoku,vier', vl);
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
