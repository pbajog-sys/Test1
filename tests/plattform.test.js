// Integrationstest Spielekiste 2.0: Dashboard, Tagesaufgaben, Fortschritt, Profil, Vergleich, Experimente, Ergebnis-Karten.
// Aufruf: python3 -m http.server 8765 (im Projektordner), dann  node tests/plattform.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
let ok = 0, fail = 0;
const pruefe = (name, bed, info = '') => { if (bed) ok++; else fail++; console.log((bed ? '✓ ' : '✗ ') + name + (info ? ' – ' + info : '')); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  // vorhandener Spielstand eines „alten“ Profils: Verlauf, Krimi, Piranha – muss erhalten bleiben und zählen
  await ctx.addInitScript(() => {
    if (localStorage.getItem('test.init')) return;
    localStorage.setItem('test.init', '1');
    localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 'a', liste: [{ id: 'a', name: 'Ana', avatar: '🐸', farbe: '#22c55e' }, { id: 'b', name: 'Bo', avatar: '🦊', farbe: '#f59e0b' }] }));
    const tage = {}, d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
    for (let n = 1; n < 12; n++) tage[d(n)] = [{ s: 'farben', p: 30 + n, m: 50, i: 'Mittel', z: Date.now() - n * 864e5 }, { s: 'krimi', p: 1, m: null, i: 'Tatort · 4:3' + (n % 10), z: Date.now() - n * 864e5 + 1 }, { s: 'toene', p: 46, m: 50, i: 'Schwer', z: Date.now() - n * 864e5 + 2 }];
    localStorage.setItem('walquiz.verlauf.v1', JSON.stringify({ tage }));
    localStorage.setItem('walquiz.krimi.v1', JSON.stringify({ geloest: { mittel: 6, schwer: 2 }, modi: { wachen: { geloest: { schwer: 3 } } } }));
    localStorage.setItem('walquiz.piranha.v1', JSON.stringify({ level: 5, sterne: { 1: 3, 2: 3, 3: 2 } }));
    localStorage.setItem('walquiz.profil.b', JSON.stringify({ 'walquiz.verlauf.v1': { tage: { [d(2)]: [{ s: 'zufall', p: 44, m: 50, i: 'Profi', z: 1 }, { s: 'karte', p: 40, m: 50, i: 'Mittel', z: 2 }] } } }));
    localStorage.setItem('walquiz.installhinweis.v1', 'weg');
    localStorage.setItem('walquiz.fuehrung.v1', JSON.stringify({ gesehen: { farben: true, toene: true, takt: true, augen: true, karte: true, tiefgang: true, riff: true, piranha: true, slo: true, krimi: true, funktion: true, zufall: true, punkte: true } }));
  });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
  await p.screenshot({ path: ordner + '/pt-dashboard.png', fullPage: true });
  pruefe('Dashboard-Kopf sichtbar', await p.evaluate(() => !!$('skGruss') && !!$('skStart').querySelector('.sk-tageskarte')));
  pruefe('Kategorien angelegt', await p.evaluate(() => document.querySelectorAll('.sk-kat').length >= 5 && !!document.querySelector('.sk-kat #hubKrimi')));
  const xp = await p.evaluate(() => { const D = skDaten(); return skXP(D.E, D.tagesSt, D.expSt, D.erfolgSt); });
  pruefe('XP aus altem Verlauf', xp.spiele > 500, JSON.stringify(xp));
  // Anti-Farming: 30 identische leichte Runden an einem Tag bringen höchstens 4,25 volle Runden
  const farm = await p.evaluate(() => { const E = Array.from({ length: 30 }, (_, i) => ({ s: 'farben', t: '2026-01-01', p: 50, m: 50, i: 'Leicht', z: i, q: 1, d: 0.8 })); return skXP(E, {}, {}, {}).spiele; });
  pruefe('Anti-Farming XP begrenzt', farm <= Math.ceil(26 * 4.25), farm + ' XP für 30 Runden');
  const leicht = await p.evaluate(() => { const E = Array.from({ length: 200 }, (_, i) => ({ s: 'farben', t: '2026-01-' + String(1 + (i % 28)).padStart(2, '0'), p: 50, m: 50, i: 'Leicht', z: i, q: 1, d: 0.8 })); return skFaehigkeiten(E).find((s) => s.id === 'visuell').wert; });
  pruefe('Leichte Runden deckeln Fähigkeit', leicht <= 80, 'visuell = ' + leicht);
  const skills = await p.evaluate(() => skDaten().skills.map((s) => s.id + ':' + s.wert).join(' '));
  pruefe('Fähigkeiten berechnet', /gehoer:\d+/.test(skills) && /logik:\d+/.test(skills), skills);
  // Tagesaufgaben: deterministisch, und für jeden Tag gültig
  const det = await p.evaluate(() => { let gleich = true, ok2 = true; for (let i = 0; i < 1000; i++) { const t = new Date(Date.UTC(2026, 0, 1) + i * 864e5).toISOString().slice(0, 10); const a = JSON.stringify(skTagesAufgaben(t)), b2 = JSON.stringify(skTagesAufgaben(t)); if (a !== b2) gleich = false; const A = skTagesAufgaben(t); if (A.chaos.spiel === A.brain.spiel) ok2 = false; } return gleich && ok2; });
  pruefe('Tagesaufgaben für 1000 Tage reproduzierbar, Chaos ≠ Brain', det);
  pruefe('Zeitzone Europe/Berlin', await p.evaluate(() => skDatum(new Date('2026-06-30T22:30:00Z')) === '2026-07-01' && skDatum(new Date('2026-12-31T22:59:00Z')) === '2026-12-31'));
  // jede Tagesaufgabe startet ihr Spiel im Tagesmodus
  const A = await p.evaluate(() => skTagesAufgaben());
  for (const slot of ['brain', 'sense', 'chaos']) {
    await p.evaluate(() => zeigeHub()); await p.waitForTimeout(500);
    await p.click('[data-slot=' + slot + ']'); await p.waitForTimeout(2600);
    const wo = await p.evaluate(() => document.querySelector('.screen.active').id);
    await p.screenshot({ path: ordner + '/pt-start-' + slot + '.png' });
    pruefe('Start ' + slot + ' (' + (A[slot].modus || A[slot].spiel) + ')', wo === 'screen-' + A[slot].spiel, wo);
    await p.evaluate(() => { if (typeof prStopp === 'function') prStopp(); if (typeof krimiUhrStopp === 'function') try { krimiUhrStopp(); } catch (e) {} });
  }
  // Abschluss simulieren: so wie das Spiel ihn meldet
  await p.evaluate((A) => {
    zeigeHub();
    const melde = (a) => a.spiel === 'krimi' ? merkeVerlauf('krimi', 1, null, 'Tatort · Tagesrätsel · 4:32', { sek: 272, hilfen: 0, stufe: a.stufe, modus: a.modus, tag: true, rekord: true }) : merkeVerlauf(a.spiel, 41, 50, 'Mittel · Tagesding');
    melde(A.brain); melde(A.sense);
  }, A);
  await p.waitForTimeout(1200);
  const st = await p.evaluate(() => { const t = loadJson(SK_TAG_KEY).tage[skDatum()]; return { b: !!t.brain, s: !!t.sense, c: !!t.chaos }; });
  pruefe('Brain und Sense erkannt, Chaos offen', st.b && st.s && !st.c, JSON.stringify(st));
  await p.evaluate(() => merkeVerlauf('farben', 50, 50, 'Mittel')); // normale Runde zählt nicht als Tagesaufgabe
  pruefe('Normale Runde ≠ Tagesaufgabe', await p.evaluate((A) => A.chaos.spiel !== 'farben' || !loadJson(SK_TAG_KEY).tage[skDatum()].chaos, A));
  await p.evaluate(() => renderHub()); await p.waitForTimeout(400);
  await p.screenshot({ path: ordner + '/pt-dashboard2.png' });
  pruefe('Teilen-Text', await p.evaluate(() => /SPIELEKISTE · Tagesaufgaben/.test(skTeilenText()) && /✅/.test(skTeilenText())));
  // Ergebnis-Karte
  await p.evaluate(() => skKarteZeigen(skKarteTagesaufgabe('brain', skDatum()))); await p.waitForTimeout(500);
  await p.screenshot({ path: ordner + '/pt-karte.png' });
  pruefe('Ergebnis-Karte als Bild', await p.evaluate(() => /^data:image\/png/.test(document.querySelector('.sk-karte-vorschau img').src)));
  await p.evaluate(() => $('skDlg').close());
  // Profil
  await p.click('#skGruss'); await p.waitForTimeout(500);
  await p.screenshot({ path: ordner + '/pt-profil.png', fullPage: true });
  pruefe('Profil-Seite mit Radar', await p.evaluate(() => document.querySelectorAll('#skInhalt .sk-radar polygon').length >= 5));
  pruefe('Erfolg Meisterdetektiv (alter Krimi-Stand zählt)', await p.evaluate(() => !!loadJson(SK_ERFOLG_KEY).detektiv));
  await p.click('.sk-mit'); await p.waitForTimeout(400);
  pruefe('Vergleich mit Profil Bo', await p.evaluate(() => document.querySelectorAll('#skInhalt .sk-r-flaeche').length === 2 && /Bo/.test($('skInhalt').innerText)));
  await p.screenshot({ path: ordner + '/pt-vergleich.png' });
  const rund = await p.evaluate(() => { const c = skVergleichCode(), v = skVergleichLesen(c); return v && v.werte.length === 7 && skVergleichLesen('quatsch') === null; });
  pruefe('Vergleichscode hin und zurück, Unsinn abgelehnt', rund);
  await p.evaluate(() => document.querySelector('.sk-r-label').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await p.waitForTimeout(300);
  pruefe('Erklärung einer Fähigkeit', await p.evaluate(() => /Gewicht/.test($('skDlg').innerText)));
  await p.evaluate(() => $('skDlg').close());
  // Experimente: Grau und Anker vollständig durchspielen
  for (const id of ['grau', 'anker']) {
    await p.evaluate((id) => { show('labor'); labStart(LAB_EXPERIMENTE.find((e) => e.id === id)); }, id); await p.waitForTimeout(300);
    if (id === 'grau') { await p.screenshot({ path: ordner + '/pt-grau.png' }); for (let i = 0; i < 6; i++) { await p.evaluate(() => { const r = $('labRegler'); r.value = 50; r.dispatchEvent(new Event('input')); }); await p.click('#labGleich'); await p.waitForTimeout(80); } await p.waitForTimeout(3200); }
    else { for (let i = 0; i < 6; i++) { await p.click('[data-v=m]'); await p.waitForTimeout(60); await p.fill('#labZahl', String(1000 + i)); await p.click('#labOk'); await p.waitForTimeout(60); } await p.waitForTimeout(400); }
    await p.screenshot({ path: ordner + '/pt-exp-' + id + '.png', fullPage: true });
    pruefe('Experiment ' + id + ' abgeschlossen', await p.evaluate((id) => !!labStand().fertig[id] && !!document.querySelector('.lab-auswertung'), id));
  }
  await p.evaluate(() => labUebersicht()); await p.waitForTimeout(300);
  await p.screenshot({ path: ordner + '/pt-labor.png', fullPage: true });
  pruefe('Labor-Übersicht mit Archiv', await p.evaluate(() => !!document.querySelector('.lab-akte') && !!document.querySelector('.lab-archiv')));
  pruefe('Experiment-XP', await p.evaluate(() => { const D = skDaten(); return skXP(D.E, D.tagesSt, D.expSt, D.erfolgSt).experimente === 80; }));
  // alter Spielstand unverändert
  pruefe('Alter Krimi-Stand unverändert', await p.evaluate(() => loadJson('walquiz.krimi.v1').geloest.mittel === 6 && loadJson('walquiz.piranha.v1').level === 5));
  pruefe('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log('\n' + ok + ' bestanden, ' + fail + ' fehlgeschlagen');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
