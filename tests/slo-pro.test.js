// Slowenisch-Ausbau: Tabs + Wischen, Wortschatz (Spaced Repetition, Wörterbuch), Grammatik-Werkstatt (alle Themen erzeugen
// sinnvolle Aufgaben, Stichproben gegen bekannte richtige Formen), Gespräche (Dialog durchspielen), Migration alter Stände.
// Aufruf: python3 -m http.server 8765, dann  node tests/slo-pro.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { window.SK_GESTEN_IMMER = true; if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  const cdp = await ctx.newCDPSession(p);
  const wisch = async (x1, y1, x2, y2) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] }); for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + ((x2 - x1) * i) / 8, y: y1 + ((y2 - y1) * i) / 8 }] }); await p.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1000);
  // alter Spielstand (vor dem Ausbau) bleibt erhalten
  await p.evaluate(() => saveJson(SLO_KEY, { stufe: { pozdravi: 3, jaz: 1 }, tage: {}, wort: { hvala: 4, prosim: 3 }, xp: 120 }));
  await p.evaluate(() => { show('slo', '🐉 Slowenisch'); sloKarte(); }); await p.waitForTimeout(600);
  ck('Reise wie gewohnt + Tab-Leiste mit 4 Seiten', !!(await p.$('.slo-station.jetzt')) && (await p.locator('#sloTabs button').count()) === 4 && await p.evaluate(() => !$('sloTabs').hidden && document.querySelector('#sloTabs .an').dataset.slp === 'karte'));
  await bild('slp-reise');
  await wisch(330, 500, 70, 505); await p.waitForTimeout(1200);
  ck('Wischen nach links → Wortschatz', await p.evaluate(() => !$('slo-wortschatz').hidden && slpSeite === 'wortschatz' && !!document.querySelector('#slpLernen')));
  const stand = await p.evaluate(() => ({ n: slpLex.length, deck: slpDeck().length, nomen: slpLex.filter((w) => w.p === 'n' && w.F).length, verben: slpLex.filter((w) => w.p === 'v' && w.pr).length, xp: sloStore().xp, stufe: sloStore().stufe.pozdravi }));
  ck('Wortschatz geladen: > 1.600 Wörter, Formen für > 600 Nomen und > 250 Verben; alter Stand (XP 120, Station gemeistert) erhalten', stand.n > 1600 && stand.nomen > 600 && stand.verben > 250 && stand.xp === 120 && stand.stufe === 3, JSON.stringify(stand));
  await bild('slp-wortschatz');
  // Stichproben: bekannte richtige Formen
  const formen = await p.evaluate(() => {
    const W = (sl) => slpLex.find((w) => w.sl === sl), F = (sl, k, z) => (W(sl) && W(sl).F ? W(sl).F[z * 6 + k] : '?');
    return { hiseG: F('hiša', 1, 0), psaA: F('pes', 3, 0), ljudje: F('človek', 0, 2), otroci: F('otrok', 0, 2), iger: F('igra', 1, 2), mestuL: F('mesto', 4, 0), prijateljemI: F('prijatelj', 5, 0), stvarjo: F('stvar', 5, 0), pesmijo: F('pesem', 5, 0),
      delam: (W('delati').pr || [])[0], pisejo: (W('pisati').pr || [])[8], povem: (W('povedati').pr || [])[0], gredo: (W('iti').pr || [])[8], prisel: (W('priti').lp || [])[0], rekla: (W('reči').lp || [])[1], jedli: (W('jesti').lp || [])[6] };
  });
  ck('Stichprobe Formen: hiše, psa, ljudje, otroci, iger, mestu, prijateljem, stvarjo, pesmijo, delam, povem, gredo, prišel, rekla, jedli', formen.hiseG === 'hiše' && formen.psaA === 'psa' && formen.ljudje === 'ljudje' && formen.otroci === 'otroci' && formen.iger === 'iger' && formen.mestuL === 'mestu' && formen.prijateljemI === 'prijateljem' && formen.stvarjo === 'stvarjo' && formen.pesmijo === 'pesmijo' && formen.delam === 'delam' && formen.povem === 'povem' && formen.gredo === 'gredo' && formen.prisel === 'prišel' && formen.rekla === 'rekla' && formen.jedli === 'jedli', JSON.stringify(formen));
  ck('Unsichere Form wird weggelassen statt geraten (pišejo/pišo schwankt)', formen.pisejo === '' || formen.pisejo === 'pišejo', JSON.stringify(formen.pisejo));
  // Wörterbuch
  await p.fill('#slpSuche', 'hisa'); await p.waitForTimeout(150);
  ck('Wörterbuch-Suche ohne Häkchen findet „hiša“', /hiša/.test(await p.textContent('#slpListe')));
  await p.click('#slpListe [data-w]'); await p.waitForTimeout(300);
  ck('Wortkarte zeigt Tabelle mit allen Fällen', (await p.locator('#skDlg .slp-tabelle tr').count()) === 7 && /hišo/.test(await p.textContent('#skDlg')));
  await bild('slp-wortkarte');
  await p.evaluate(() => $('skDlg').close());
  // Lernen
  await p.click('#slpLernen'); await p.waitForTimeout(400);
  const lek = await p.evaluate(() => ({ art: slo.art, n: slo.liste.length, neu: slo.liste.filter((a) => a.typ === 'neu').length, tabs: $('sloTabs').hidden }));
  ck('Lernen: 10 neue Wörter (Standard), Tab-Leiste in der Lektion ausgeblendet', lek.art === 'srs' && lek.neu === 10 && lek.tabs, JSON.stringify(lek));
  // Lektion automatisch durchspielen: immer richtig antworten
  const spiele = async (richtig = true, max = 60) => {
    for (let k = 0; k < max; k++) {
      const r = await p.evaluate((richtig) => {
        if (!slo || $('slo-lektion').hidden) return 'ende';
        const a = slo.liste[slo.i];
        if (slo.zustand === 'weiter' || ['neu', 'erkl', 'tipp'].includes(a.typ)) { sloPruefen(); return a.typ; }
        if (a.typ === 'paare') { const bs = [...document.querySelectorAll('.slo-paar')]; const l = bs.filter((x) => x.dataset.s === 'l'); l.forEach((x) => { x.click(); bs.find((y) => y.dataset.s === 'r' && y.dataset.sl === x.dataset.sl).click(); }); return 'paare'; }
        if (a.typ === 'sprechen') { slo.liste.splice(slo.i, 1); sloZeigen(); return 'sprechen'; }
        const inp = document.querySelector('#sloEingabe');
        if (inp) { inp.value = richtig ? (a.w ? a.w.sl : a.loesung) : 'xyz'; inp.dispatchEvent(new Event('input')); sloPruefen(); return a.typ; }
        const opts = [...document.querySelectorAll('.slo-opt')];
        const ziel = a.typ === 'zug' ? a.opt.find((o) => o[2] === 1)[0] : a.typ === 'form' ? a.loesung : a.typ === 'slde' ? a.w.de : a.w ? a.w.sl : null;
        const o = opts.find((x) => sloNorm(x.textContent) === sloNorm(ziel) || (a.typ === 'slde' && x.textContent === ziel));
        const w = richtig ? o : opts.find((x) => x !== o);
        (w || opts[0]).click(); sloPruefen(); return a.typ;
      }, richtig);
      if (r === 'ende') return k;
      await p.waitForTimeout(30);
    }
    return -1;
  };
  const schritte = await spiele(true, 120);
  const nach = await p.evaluate(() => { const st = slpStore(), w = Object.entries(st.srs); return { n: w.length, stufe1: w.filter(([, c]) => c[0] === 1).length, faellig: w.filter(([, c]) => c[1] === slpTagNr() + 1).length, neuHeute: st.srsNeu[slpTagNr()], ende: !$('slo-ende').hidden, xp: st.xp }; });
  ck('Alles richtig: 10 neue Wörter auf Stufe 1 (+2 aus der Reise übernommen), morgen wieder fällig, Endbildschirm, XP dazu', schritte > 0 && nach.n === 12 && nach.stufe1 === 10 && nach.faellig === 10 && nach.neuHeute === 10 && nach.ende && nach.xp > 120, JSON.stringify(nach));
  await bild('slp-ende');
  await p.click('#sloEndeWeiter'); await p.waitForTimeout(400);
  ck('Weiter → zurück zum Wortschatz, „für heute geschafft“', await p.evaluate(() => !$('slo-wortschatz').hidden) && /geschafft/.test(await p.textContent('#slpLernen')));
  // Zeitreise: zwei Tage später sind die Wörter fällig; eins falsch → Stufe 1, Rest Stufe 2
  await p.evaluate(() => { const st = slpStore(); Object.values(st.srs).forEach((c) => { c[1] = slpTagNr() - 1; }); st.srsNeu = { [slpTagNr()]: st.srsZiel }; saveJson(SLO_KEY, st); slpWortschatz(); });
  await p.click('#slpLernen'); await p.waitForTimeout(300);
  await p.evaluate(() => { const a = slo.liste[0]; const inp = document.querySelector('#sloEingabe'); if (inp) { inp.value = 'falsch'; inp.dispatchEvent(new Event('input')); } else { const o = [...document.querySelectorAll('.slo-opt')].find((x) => sloNorm(x.textContent) !== sloNorm(a.typ === 'slde' ? a.w.de : a.w.sl)); o.click(); } sloPruefen(); sloPruefen(); });
  await spiele(true, 80);
  const nach2 = await p.evaluate(() => { const w = Object.values(slpStore().srs); return { s1: w.filter((c) => c[0] === 1).length, s2: w.filter((c) => c[0] === 2).length, s2tage: w.filter((c) => c[0] === 2 && c[1] === slpTagNr() + 2).length }; });
  ck('Wiederholung: 1 Fehler → Stufe 1 (morgen), 9 richtig → Stufe 2 (in 2 Tagen); die Wiederholung am Ende zählt nicht doppelt', nach2.s1 === 1 && nach2.s2 === 9 && nach2.s2tage === 9, JSON.stringify(nach2));
  await p.click('#sloEndeWeiter'); await p.waitForTimeout(300);
  // Grammatik
  await wisch(330, 500, 70, 505); await p.waitForTimeout(1000);
  ck('Wischen → Grammatik mit 13 Themen', await p.evaluate(() => !$('slo-grammatik').hidden) && (await p.locator('.slp-thema').count()) === 13);
  await bild('slp-grammatik');
  const gram = await p.evaluate(() => SLP_THEMEN.map((th) => {
    let ok = 0, schlecht = [];
    for (let i = 0; i < 40; i++) {
      const A = slpGramAufgaben(th, 10).filter((a) => a.typ === 'form');
      A.forEach((a) => { const os = a.opt || []; if (a.opt && (!os.some((o) => sloNorm(o) === sloNorm(a.loesung)) || new Set(os.map(sloNorm)).size !== os.length)) schlecht.push(a.frage); else ok++; });
    }
    return [th.id, ok, schlecht.length];
  }));
  ck('Alle 13 Themen erzeugen je 10 Aufgaben; Lösung steht immer unter den Optionen, keine doppelten Optionen (400 Aufgaben je Thema)', gram.every(([, ok, s]) => ok >= 390 && s === 0), JSON.stringify(gram));
  const regeln = await p.evaluate(() => ({ s: ['p', 't', 'k', 'c', 'č', 's', 'š', 'f', 'h'].every((c) => slpZS(c + 'a') === 's'), z: ['m', 'a', 'b', 'd', 'g', 'v', 'ž', 'l'].every((c) => slpZS(c + 'a') === 'z'), h: slpKH('kolegu') === 'h' && slpKH('gori') === 'h' && slpKH('mami') === 'k' }));
  ck('Regeln z/s und k/h', regeln.s && regeln.z && regeln.h, JSON.stringify(regeln));
  const stichprobe = await p.evaluate(() => {
    const th = (id) => SLP_THEMEN.find((t) => t.id === id), out = [];
    for (let i = 0; i < 300; i++) {
      const q = th('stevila').neu(); if (!q) continue;
      const k = +q.frage.split(' ')[0], w = q.loesung.split(' ')[0];
      const erw = { 1: ['en', 'ena', 'eno'], 2: ['dva', 'dve'], 3: ['trije', 'tri'], 4: ['štirje', 'štiri'], 5: ['pet'], 6: ['šest'], 8: ['osem'], 10: ['deset'] }[k];
      if (!erw.includes(w)) out.push(q.frage + ' → ' + q.loesung);
    }
    return out;
  });
  ck('Zahlen: richtiges Zahlwort (en/ena/eno, dva/dve, trije/tri …) in 300 Aufgaben', !stichprobe.length, stichprobe.slice(0, 3).join(' | '));
  await p.click('.slp-thema[data-th="orodnik"]'); await p.waitForTimeout(300);
  ck('Thema startet mit Erklärung', await p.evaluate(() => slo.liste[0].typ === 'erkl') && /stimmlosen/.test(await p.textContent('#sloAufgabe')));
  await p.click('#sloPruefen'); await p.waitForTimeout(200);
  await bild('slp-grammatik-aufgabe');
  await spiele(true, 40);
  ck('Grammatik-Lektion abgeschlossen → Meisterschaft gespeichert', await p.evaluate(() => (slpStore().gram.orodnik || {}).best === 100));
  await p.click('#sloEndeWeiter'); await p.waitForTimeout(300);
  // Gespräche
  await p.click('#sloTabs [data-slp="gespraeche"]'); await p.waitForTimeout(800);
  ck('Gespräche: 11 Rollenspiele', (await p.locator('#slo-gespraeche .slp-thema').count()) === 11);
  await p.click('.slp-thema[data-g="trgovina"]'); await p.waitForTimeout(300);
  await bild('slp-gespraech');
  const zug = await p.evaluate(() => { const opts = [...document.querySelectorAll('.slo-opt')]; const falsch = opts.find((x) => x.textContent === 'Kilogram jabolka, prosim.'); falsch.click(); sloPruefen(); return $('sloUrteil').textContent; });
  ck('Falsche Antwort im Gespräch wird erklärt (Genitiv Plural nach Mengen)', /Genitiv Plural/.test(zug), zug.slice(0, 120));
  await p.evaluate(() => sloPruefen());
  await spiele(true, 40);
  ck('Gespräch zu Ende → Ergebnis gespeichert', await p.evaluate(() => slpStore().gespr.trgovina > 0));
  await p.click('#sloEndeWeiter'); await p.waitForTimeout(300);
  // Gesprächsdaten: genau eine richtige Antwort je Zug, kein „se/si“ am Satzanfang in richtigen Antworten
  const daten = await p.evaluate(() => { const f = []; SLP_GESPRAECHE.forEach((g) => g.z.forEach((z) => { if (z[0] === 'du') { if (z[1].filter((o) => o[2] === 1).length !== 1) f.push(g.id + ': ' + z[1][0][0]); z[1].filter((o) => o[2] === 1).forEach((o) => { if (/^(Se|Si|Mi|Ti|Me|Te|Ga|Jo|Ji|Sem|Si|Je|Sva|Smo|Ste|So) /.test(o[0]) && !/^(Je daleč|Sem iz)/.test(o[0])) f.push('Klitikon am Anfang: ' + o[0]); }); } })); return f; });
  ck('Gesprächsdaten: genau eine richtige Antwort je Zug, keine unbetonten Wörtchen am Satzanfang', !daten.length, daten.join(' | '));
  // Zurück-Knopf auf Wortschatz-Seite → Hub
  await p.click('#sloTabs [data-slp="wortschatz"]'); await p.waitForTimeout(600);
  await p.click('#sloZurueck'); await p.waitForTimeout(500);
  ck('Zurück von „Wortschatz“ → Hub', await p.evaluate(() => document.querySelector('.screen.active').id === 'screen-hub'));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
