// Fitness: Training live eintragen (Kraft + Ausdauer), Vorbelegung, Pausen-Timer, Bestwerte, Abschluss, Fortsetzen nach
// Neuladen, Fortschritt (Kurve, Tabelle), Wochen-Serie, CSV-Export, Löschen.
// Aufruf: python3 -m http.server 8765, dann  node tests/fitness.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const fs = require('fs');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', acceptDownloads: true });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message)); p.on('dialog', (d) => d.accept());
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  // Zwei frühere Trainings (letzte und vorletzte Woche)
  await p.evaluate(() => {
    const tag = 864e5, w = fiWoche(Date.now());
    const e1 = { id: 'a', start: w - 13 * tag + 18 * 3600e3, ende: w - 13 * tag + 19 * 3600e3, eintraege: [{ u: 'bank', kg: 55, wdh: 10, t: 1 }, { u: 'bank', kg: 57.5, wdh: 8, t: 2 }, { u: 'lauf', km: 5, sek: 1650, t: 3 }] };
    const e2 = { id: 'b', start: w - 6 * tag + 18 * 3600e3, ende: w - 6 * tag + 19 * 3600e3, eintraege: [{ u: 'bank', kg: 57.5, wdh: 10, t: 4 }, { u: 'klimm', kg: 0, wdh: 6, t: 5 }] };
    saveJson(FI_KEY, { version: 1, einheiten: [e1, e2], eigene: [], pause: 90, aktiv: null });
    fiHubText();
  });
  ck('Hub-Karte: 0 diese Woche, 2 gesamt', /0 Trainings diese Woche · 2 gesamt/.test(await p.textContent('#hubFitnessBest')), await p.textContent('#hubFitnessBest'));
  await p.click('#hubFitness'); await p.waitForTimeout(800);
  ck('Übersicht: Serie 2 Wochen (letzte Woche zählt noch), Fortschritt je Übung', /2\s*Wochen in Folge/.test(await p.textContent('.fi-kacheln')) && (await p.$$('[data-uebung]')).length === 3, await p.textContent('.fi-kacheln'));
  await bild('fi-start');

  // ---------- Training ----------
  await p.click('#fiLos'); await p.waitForTimeout(200);
  await p.click('#fiNeueUebung'); await p.waitForTimeout(200);
  await p.click('#skDlg [data-neu="bank"]'); await p.waitForTimeout(200);
  ck('Bankdrücken vorbelegt mit dem letzten Mal (57,5 × 10)', (await p.inputValue('#fiKg')) === '57,5' && (await p.inputValue('#fiWdh')) === '10' && /Letztes Mal/.test(await p.textContent('.fi-letztes')));
  await p.click('[data-schritt="fiKg"][data-d="2.5"]');
  ck('+ erhöht um 2,5 kg', (await p.inputValue('#fiKg')) === '60');
  await p.click('#fiSatz'); await p.waitForTimeout(300);
  ck('Satz gespeichert → Bestwert erkannt (schwerstes Gewicht)', /Schwerstes Gewicht: 60 kg/.test(await p.textContent('.fi-toast')) && /🏆/.test(await p.textContent('.fi-heute')), await p.textContent('.fi-toast'));
  ck('Pausen-Timer läuft (1:30)', /Pause 1:(30|29)/.test(await p.textContent('#fiPause')), await p.textContent('#fiPause'));
  await bild('fi-satz');
  await p.evaluate(() => { fi.pauseEnde = Date.now() - 500; }); await p.waitForTimeout(700);
  ck('Pause vorbei → „Weiter geht’s“', /Weiter geht/.test(await p.textContent('#fiPause')));
  ck('Nächster Satz vorbelegt mit 60 × 10', (await p.inputValue('#fiKg')) === '60' && /Satz 2 speichern/.test(await p.textContent('#fiSatz')));
  await p.fill('#fiWdh', '8'); await p.click('#fiSatz'); await p.waitForTimeout(200);
  await p.fill('#fiKg', '20'); await p.click('#fiSatz'); await p.waitForTimeout(200);
  await p.click('.fi-heute span:nth-child(3) button'); await p.waitForTimeout(200);
  ck('Satz löschen', (await p.$$('.fi-heute span')).length === 2);
  // Neu laden mitten im Training
  await p.reload(); await p.waitForTimeout(900);
  ck('Nach Neuladen: Training läuft weiter', /Training läuft/.test(await p.textContent('#hubFitnessBest')));
  await p.click('#hubFitness'); await p.waitForTimeout(700);
  ck('… Startknopf „Weiter“ mit 2 Einträgen', /Weiter mit dem laufenden Training/.test(await p.textContent('#fiLos')) && /2 Einträge/.test(await p.textContent('#fiLos')));
  await p.click('#fiLos'); await p.waitForTimeout(200);
  // Ausdauer
  await p.click('#fiNeueUebung'); await p.click('#skDlg [data-neu="lauf"]'); await p.waitForTimeout(200);
  await p.fill('#fiKm', '5'); await p.fill('#fiMin', '25:00'); await p.dispatchEvent('#fiMin', 'input');
  ck('Laufen: Tempo 5:00 min/km, 12 km/h', /5:00 min\/km · 12 km\/h/.test(await p.textContent('#fiTempo')), await p.textContent('#fiTempo'));
  await bild('fi-lauf');
  await p.click('#fiSatz'); await p.waitForTimeout(300);
  ck('Laufen: schnellstes Tempo als Bestwert', /Schnellstes Tempo: 5:00/.test(await p.textContent('.fi-toast')));
  ck('Laufen: kein Pausen-Timer', await p.isHidden('#fiPause'));
  // eigene Übung
  await p.click('#fiNeueUebung'); await p.fill('#fiEigenName', 'Hip Thrust'); await p.click('#fiEigenOk'); await p.waitForTimeout(200);
  ck('Eigene Übung angelegt und gewählt', /Hip Thrust/.test(await p.textContent('.fi-eingabe h3')));
  await p.click('#fiSatz'); await p.waitForTimeout(200);
  ck('Erstes Mal ist kein Bestwert', !/🏆/.test(await p.textContent('.fi-heute')));
  await p.evaluate(() => { fi.pauseEnde = 0; });
  await p.click('#fiEnde'); await p.waitForTimeout(400);
  const karte = await p.textContent('.fi-karte');
  ck('Abschluss-Karte bietet „Training gleich sichern“', !!(await p.$('#fiSichernJetzt')));
  ck('Abschluss: 3 Sätze, 5 km, 2 Bestwerte', /3\s*Sätze/.test(karte) && /5\s*km/.test(karte) && /2<\/b> neue Bestwerte|2 neue Bestwerte/.test(await p.innerText('.fi-karte')), karte.replace(/\s+/g, ' ').slice(0, 160));
  await bild('fi-ende');
  const vl = await p.evaluate(() => (loadJson(VERLAUF_KEY).tage[skDatum()] || []).filter((e) => e.s === 'fitness').map((e) => e.i + ' | ' + JSON.stringify(e.x)));
  ck('Verlauf: Training eingetragen', vl.length === 1 && /3 Sätze · 5 km · 2 Bestwerte/.test(vl[0]), vl.join(' '));
  await p.click('#fiFertig'); await p.waitForTimeout(300);
  ck('Übersicht: 1 diese Woche, Serie 3 Wochen', /1\s*diese Woche/.test(await p.textContent('.fi-kacheln')) && /3\s*Wochen in Folge/.test(await p.textContent('.fi-kacheln')));
  // Fortschritt
  await p.click('[data-uebung="bank"]'); await p.waitForTimeout(400);
  ck('Fortschritt Bankdrücken: schwerstes 60 kg, 3 Trainings, Tabelle', /60 kg/.test(await p.textContent('.fi-kacheln')) && /3\s*Trainings/.test(await p.textContent('.fi-kacheln')) && (await p.$$('.fi-tabelle > div')).length === 3);
  await bild('fi-kurve');
  await p.click('#fiZurUebersicht'); await p.waitForTimeout(200);
  // CSV
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#fiExport')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  ck('CSV-Export: Kopfzeile, Bankdrücken mit Komma-Zahlen, Laufen mit Dauer', /Datum;Uhrzeit;Übung/.test(csv) && /"Bankdrücken";kraft;57,5;8/.test(csv) && /"Laufen";ausdauer;;;5;25:00/.test(csv) && csv.split('\n').length === 1 + 5 + 4, csv.split('\n').length + ' Zeilen');
  // Training löschen
  await p.click('[data-einheit]'); await p.waitForTimeout(200); await p.click('#fiEinheitWeg'); await p.waitForTimeout(300);
  ck('Training löschen', await p.evaluate(() => fiStore().einheiten.length === 2));
  await p.click('#fiZurueck'); await p.waitForTimeout(500);
  ck('Zurück zum Hub', await p.evaluate(() => $('screen-hub').classList.contains('active')));

  // ---------- Muskeln, Icons, Tipps, Steigerung ----------
  const daten = await p.evaluate(() => {
    const fehlend = FI_STANDARD.filter((u) => !FI_INFO[u.id] || !FI_INFO[u.id].p.every((m) => FI_MUSKELN[m]) || !(FI_INFO[u.id].tipps || []).length).map((u) => u.id);
    const formen = Object.keys(FI_MUSKELN).filter((m) => !FI_FORMEN.some((f) => f[0] === m));
    return { fehlend, formen };
  });
  ck('Jede Standard-Übung hat Muskeln und Tipps, jeder Muskel eine Fläche in der Figur', !daten.fehlend.length && !daten.formen.length, JSON.stringify(daten));
  await p.evaluate(() => {
    const s = fiStore(), t = Date.now() - 3600e3;
    s.einheiten.push({ id: 'z', start: t, ende: t + 1800e3, eintraege: [{ u: 'bank', kg: 60, wdh: 10, t }, { u: 'bank', kg: 60, wdh: 10, t }, { u: 'bank', kg: 60, wdh: 10, t }] });
    fiSpeichern(s);
  });
  await p.click('#hubFitness'); await p.waitForTimeout(700);
  ck('Muskel-Karte der Woche: Brust leuchtet, Text nennt Brust', await p.evaluate(() => !!document.querySelector('.fi-woche .fi-muskel.an[data-muskel="brust"]') && /Brust/.test(document.querySelector('.fi-woche').textContent)));
  ck('Tipp des Tages und Icons in der Fortschrittsliste', (await p.$$('.fi-tipp')).length === 1 && (await p.$$('.fi-zeile .fi-icon svg')).length >= 3);
  await p.click('#fiLos'); await p.click('#fiNeueUebung'); await p.waitForTimeout(200);
  await p.click('#skDlg [data-filter="Brust"]'); const nBrust = (await p.$$('#fiRaster [data-neu]')).length;
  await p.click('#skDlg [data-filter="Rücken"]'); const nRuecken = (await p.$$('#fiRaster [data-neu]')).length;
  await p.click('#skDlg [data-filter="Ausdauer"]'); const nAusdauer = (await p.$$('#fiRaster [data-neu]')).length;
  ck('Auswahl-Filter: Brust 3, Rücken 4, Ausdauer 6', nBrust === 3 && nRuecken === 4 && nAusdauer === 6, [nBrust, nRuecken, nAusdauer].join('/'));
  await p.click('#skDlg [data-filter="Brust"]'); await p.click('#skDlg [data-neu="bank"]'); await p.waitForTimeout(200);
  ck('Steigerung: 3× 10 mit 60 kg → Vorschlag 62,5 kg vorbelegt', /3× 10 mit 60 kg geschafft/.test(await p.textContent('#fiSteigern')) && (await p.inputValue('#fiKg')) === '62,5');
  await p.click('#fiWieLetztes');
  ck('„lieber 60 kg“ setzt zurück', (await p.inputValue('#fiKg')) === '60' && !(await p.$('#fiSteigern')));
  ck('Technik-Tipps und Muskeln bei der Übung', (await p.$$('.fi-tipps li')).length === 3 && /Brust · mit Trizeps, Schultern/.test(await p.textContent('.fi-ue-kopf')));
  await p.click('#fiNeueUebung'); await p.fill('#fiEigenName', 'Hip Thrust Maschine'); await p.selectOption('#fiEigenMuskel', 'gesaess'); await p.click('#fiEigenOk'); await p.waitForTimeout(200);
  ck('Eigene Übung mit Muskel: Gesäß, Icon zeigt die Beine', /Gesäß/.test(await p.textContent('.fi-ue-kopf')) && !!(await p.$('.fi-ue-kopf .fi-icon-unten')));
  await p.evaluate(() => { const s = fiStore(); s.aktiv = null; fiSpeichern(s); fiDetail('bank'); }); await p.waitForTimeout(200);
  ck('Detailseite: Figur mit Brust und Tipps', !!(await p.$('.fi-detail-kopf .fi-muskel.an[data-muskel="brust"]')) && (await p.$$('.fi-tipps-liste li')).length === 3);
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
