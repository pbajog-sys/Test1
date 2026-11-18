// Fitness-Trainingspläne: Vorlage wählen, geführtes Training (Ziele, Satz x/y, automatisch weiter), Steigerung nach
// Wiederholungsbereich, nächster Trainingstag, Teilen per Code (Hin- und Rückweg, eigene Übungen), Editor.
// Aufruf: python3 -m http.server 8765, dann  node tests/fitness-plan.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message)); p.on('dialog', (d) => d.accept());
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  await p.evaluate(() => { const t = Date.now() - 3 * 864e5; saveJson(FI_KEY, { version: 1, eigene: [], pause: 90, aktiv: null, einheiten: [{ id: 'a', start: t, ende: t + 3600e3, eintraege: [{ u: 'bank', kg: 60, wdh: 10 }, { u: 'bank', kg: 60, wdh: 10 }, { u: 'bank', kg: 60, wdh: 10 }, { u: 'bank', kg: 60, wdh: 10 }] }] }); fiOeffnen(); });
  await p.waitForTimeout(400);
  ck('Übersicht: Karte „Trainingsplan – Plan wählen“', /Plan wählen/.test(await p.textContent('.fi-plan-karte')));
  await p.click('#fiPlanWahl'); await p.waitForTimeout(200);
  ck('Vier Vorlagen', (await p.$$('#skDlg .fi-plan-zeile')).length === 4);
  await p.click('#skDlg [data-plan="v-ppl"]'); await p.waitForTimeout(200);
  ck('Plan-Ansicht: Tage mit Übungen und Zielen', /Push/.test(await p.textContent('#skDlg')) && /4× 6–10/.test(await p.textContent('#skDlg')) && (await p.$$('#skDlg .fi-plan-tag')).length === 3);
  await bild('pl-plan');
  await p.click('#fiPlanAktiv'); await p.waitForTimeout(300);
  ck('Aktiver Plan: „Nächstes Training: Push“', /Nächstes Training: Push/.test(await p.textContent('.fi-plan-karte')));
  await bild('pl-start');
  await p.click('#fiPlanStart'); await p.waitForTimeout(300);
  ck('Geführtes Training: 0/16 Sätze, Bankdrücken mit Ziel 4× 6–10, Satz 1/4', /0\/16 Sätze/.test(await p.textContent('.fi-plan-leiste')) && /Ziel 4× 6–10 Wdh\. · Satz 1\/4/.test(await p.textContent('.fi-ue-kopf')));
  ck('Steigerung nach Bereich: 4× 10 (oberes Ende) → 62,5 kg, wieder 6 Wdh.', (await p.inputValue('#fiKg')) === '62,5' && (await p.inputValue('#fiWdh')) === '6' && /4× 10 mit 60 kg/.test(await p.textContent('#fiSteigern')));
  await bild('pl-training');
  for (let i = 0; i < 4; i++) { await p.click('#fiSatz'); await p.waitForTimeout(150); }
  ck('Nach 4 Sätzen automatisch weiter zu Schulterdrücken', /Schulterdrücken/.test(await p.textContent('.fi-eingabe h3')) && /Weiter mit Schulterdrücken/.test(await p.textContent('.fi-toast:last-of-type')) && /4\/16 Sätze/.test(await p.textContent('.fi-plan-leiste')));
  ck('Bankdrücken in der Leiste als erledigt markiert', await p.evaluate(() => document.querySelector('.fi-plan-leiste [data-wahl="bank"]').classList.contains('fertig')));
  await p.evaluate(() => { fi.pauseEnde = 0; }); await p.click('#fiEnde'); await p.waitForTimeout(300); await p.click('#fiFertig'); await p.waitForTimeout(300);
  ck('Nach dem Training: nächstes ist „Pull“', /Nächstes Training: Pull/.test(await p.textContent('.fi-plan-karte')) && await p.evaluate(() => fiStore().planAktiv.naechster === 1));
  // ---------- Teilen per Code ----------
  const rt = await p.evaluate(() => {
    const s = fiStore(); s.eigene.push({ id: 'xhip', name: 'Hip Thrust', art: 'kraft', gruppe: 'Eigene', kg0: false, muskel: 'gesaess' });
    const plan = { id: 'pmein', name: 'Mein Po-Plan', info: 'Test', tage: [{ name: 'Tag A', uebungen: [{ u: 'xhip', saetze: 4, min: 8, max: 12 }, { u: 'knie', saetze: 3, min: 5, max: 8 }] }] };
    s.plaene = [plan]; fiSpeichern(s);
    const code = fiPlanCode(plan, s), zurueck = fiPlanAusCode('Schau mal: ' + code + ' viel Spaß');
    return { code, ok: !!zurueck.plan && zurueck.plan.t[0][1].length === 2 && zurueck.plan.e.xhip[0] === 'Hip Thrust', kaputt: fiPlanAusCode('SKPLAN1:abc').fehler, ohne: fiPlanAusCode('hallo').fehler };
  });
  ck('Plan-Code: Hin- und Rückweg (auch mitten in einer Nachricht), eigene Übung mit Name', rt.ok && /^SKPLAN1:[A-Za-z0-9_-]+$/.test(rt.code), rt.code.length + ' Zeichen');
  ck('Kaputte und fehlende Codes werden erkannt', /beschädigt|ungültig|keinen gültigen/.test(rt.kaputt) && /Kein Plan-Code/.test(rt.ohne));
  // Import bei „Freund“ ohne die eigene Übung
  await p.evaluate(() => { const s = fiStore(); s.eigene = []; s.plaene = []; fiSpeichern(s); });
  await p.click('#fiPlanWahl'); await p.click('#fiPlanCode'); await p.waitForTimeout(200);
  await p.fill('#fiPlanText', 'Hier mein Plan: ' + rt.code); await p.click('#fiPlanOk'); await p.waitForTimeout(300);
  const imp = await p.evaluate(() => { const s = fiStore(), pl = s.plaene[0]; return { name: pl && pl.name, ue: pl && pl.tage[0].uebungen.map((x) => fiUebung(x.u, s).name).join(','), eigene: s.eigene.map((u) => u.name + ':' + u.muskel).join(',') }; });
  ck('Import: Plan übernommen, eigene Übung „Hip Thrust“ (Gesäß) angelegt', imp.name === 'Mein Po-Plan' && imp.ue === 'Hip Thrust,Kniebeugen' && imp.eigene === 'Hip Thrust:gesaess', JSON.stringify(imp));
  // ---------- Editor ----------
  await p.click('#fiPlanEdit'); await p.waitForTimeout(200);
  await p.selectOption('#skDlg [data-neu="0"]', 'waden'); await p.click('#skDlg [data-dazu="0"]'); await p.waitForTimeout(150);
  await p.fill('#skDlg [data-feld="saetze"][data-x="2"]', '5'); await p.click('#fiTagDazu'); await p.waitForTimeout(150);
  await bild('pl-editor');
  await p.click('#fiPlanSpeichern'); await p.waitForTimeout(200);
  const ed = await p.evaluate(() => { const pl = fiStore().plaene[0]; return { tage: pl.tage.length, w: pl.tage[0].uebungen[2] }; });
  ck('Editor: Übung hinzugefügt (5 Sätze), leerer Tag beim Speichern entfernt', ed.tage === 1 && ed.w.u === 'waden' && ed.w.saetze === 5, JSON.stringify(ed));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
