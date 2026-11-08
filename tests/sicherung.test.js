// Sicherung: Daten anlegen → sichern (Datei) → alles löschen wie beim Entfernen der App → Datei einspielen → alles wieder da
// (auch zweites Profil und eigener Song bitgenau), Rückgängig, kaputte/fremde Dateien, Erinnerung im Hub.
// Aufruf: python3 -m http.server 8765, dann  node tests/sicherung.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', acceptDownloads: true });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1') && !sessionStorage.getItem('geloescht')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }, { id: 'b', name: 'Bea', avatar: '🦊', farbe: '#2563eb' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message)); p.on('dialog', (d) => d.accept());
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  // nach dem Löschen zeigt die App zuerst „Wer spielt?“ – dort gibt es den Einspielen-Knopf
  const oeffnen = async () => { if (await p.isVisible('#pwSicherungNeu')) await p.click('#pwSicherungNeu'); else if (await p.isVisible('#pwSicherung')) await p.click('#pwSicherung'); else await p.click('#sicherungBtn'); await p.waitForTimeout(400); };
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);

  // ---------- Daten anlegen ----------
  await p.evaluate(async () => {
    saveJson(FI_KEY, { version: 1, eigene: [], pause: 90, aktiv: null, einheiten: [{ id: 'a', start: Date.now() - 864e5, ende: Date.now() - 864e5 + 3600e3, eintraege: [{ u: 'bank', kg: 60, wdh: 10 }, { u: 'lauf', km: 5, sek: 1500 }] }] });
    saveJson('walquiz.profil.b', { 'walquiz.v2': { name: 'Bea', punkte: 42 } });
    const bytes = new Uint8Array(70000); for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 7919) % 256;
    await srDbTun('readwrite', (s) => s.put({ id: 'song1', name: 'Mein Song', groesse: bytes.length, daten: bytes.buffer }));
    sbHinweis();
  });
  ck('Hub-Erinnerung: noch nie gesichert', /Letzte Sicherung: noch nie/.test(await p.textContent('#sbHinweis')));
  await bild('sb-hinweis');
  await p.click('#sbHinweis .sb-hi-los'); await p.waitForTimeout(400);
  ck('Dialog: Daten und Song werden angezeigt', /1 eigener Song/.test(await p.textContent('#skDlg')) && await p.isChecked('#sbMitSongs'));
  await bild('sb-dialog');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#sbJetzt')]);
  const datei = path.join(os.tmpdir(), 'spielekiste-test-sicherung.json'); await dl.saveAs(datei);
  const obj = JSON.parse(fs.readFileSync(datei, 'utf8'));
  ck('Sicherungsdatei: Name, Format, alle walquiz-Daten, Song', /^Spielekiste-Sicherung-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()) && obj.app === 'spielekiste' && obj.format === 1 && obj.daten['walquiz.fitness.v1'] && obj.daten['walquiz.profil.b'] && obj.songs.length === 1 && Object.keys(obj.daten).every((k) => k.startsWith('walquiz.')), dl.suggestedFilename() + ' · ' + Object.keys(obj.daten).length + ' Einträge');
  await p.waitForTimeout(300);
  ck('Nach dem Sichern: „heute“, Erinnerung weg', (await p.textContent('#sbZuletzt')) === 'heute' && !(await p.$('#sbHinweis')));

  // ---------- App „vom Home-Bildschirm gelöscht“: alles weg ----------
  await p.evaluate(async () => { sessionStorage.setItem('geloescht', '1'); localStorage.clear(); await new Promise((ok) => { const r = indexedDB.deleteDatabase('walquiz-songs'); r.onsuccess = r.onerror = r.onblocked = () => ok(); }); });
  await p.reload(); await p.waitForTimeout(900);
  const leer = await p.evaluate(async () => ({ fitness: fiStore().einheiten.length, songs: (await srSongs()).length }));
  ck('Simuliertes Löschen: Training und Song weg', leer.fitness === 0 && leer.songs === 0, JSON.stringify(leer));
  // ---------- Einspielen ----------
  ck('Nach dem Löschen: „Wie heißt du?“ mit „Sicherung einspielen“', await p.isVisible('#pwSicherungNeu'));
  await bild('sb-neu');
  await oeffnen();
  await p.setInputFiles('#sbDatei', datei);
  await p.waitForLoadState('load'); await p.waitForTimeout(1500);
  const zurueck = await p.evaluate(async () => {
    const song = await srSongLaden('song1'), b = song ? new Uint8Array(song.daten) : null;
    let gleich = !!b && b.length === 70000; if (gleich) for (let i = 0; i < b.length; i++) if (b[i] !== (i * 7919) % 256) { gleich = false; break; }
    return { fitness: fiStore().einheiten.length, bea: loadJson('walquiz.profil.b')['walquiz.v2'].punkte, profile: profile().liste.length, song: gleich };
  });
  ck('Nach dem Einspielen: Training, zweites Profil und Song (bitgenau) wieder da', zurueck.fitness === 1 && zurueck.bea === 42 && zurueck.profile === 2 && zurueck.song, JSON.stringify(zurueck));
  ck('Keine Erinnerung direkt nach dem Einspielen', !(await p.$('#sbHinweis')));
  // ---------- Rückgängig ----------
  await oeffnen();
  ck('Rückgängig-Knopf vorhanden', !!(await p.$('#sbRueck')));
  await p.click('#sbRueck'); await p.waitForLoadState('load'); await p.waitForTimeout(1200);
  ck('Rückgängig: Stand von vor dem Einspielen (leer)', await p.evaluate(() => fiStore().einheiten.length === 0));
  // ---------- Fremde und kaputte Dateien ----------
  await oeffnen();
  const kaputt = path.join(os.tmpdir(), 'kaputt.json'); fs.writeFileSync(kaputt, '{"app":"andere","daten":{}}');
  await p.setInputFiles('#sbDatei', kaputt); await p.waitForTimeout(300);
  ck('Fremde Datei wird abgelehnt', /keine Spielekiste-Sicherung/.test(await p.textContent('#sbMeldung')));
  fs.writeFileSync(kaputt, JSON.stringify({ app: 'spielekiste', format: 1, erstellt: new Date().toISOString(), daten: { 'boese.schluessel': 'x' } }));
  await p.setInputFiles('#sbDatei', kaputt); await p.waitForTimeout(300);
  ck('Datei mit fremden Schlüsseln wird abgelehnt', /unerwartete Einträge/.test(await p.textContent('#sbMeldung')));
  fs.writeFileSync(kaputt, 'kein json');
  await p.setInputFiles('#sbDatei', kaputt); await p.waitForTimeout(300);
  ck('Kaputte Datei wird abgelehnt', /keine gültige Sicherungsdatei/.test(await p.textContent('#sbMeldung')));
  // ---------- Erinnerung „später“ und nach 7 Tagen ----------
  await p.keyboard.press('Escape');
  await p.evaluate(() => { saveJson(FI_KEY, { version: 1, einheiten: [{ id: 'x', start: 1, ende: 2, eintraege: [] }] }); sbInfoSetzen({ zuletzt: Date.now() - 8 * 864e5, spaeter: 0 }); sbHinweis(); });
  ck('Nach 8 Tagen erscheint die Erinnerung wieder', /vor 8 Tagen/.test(await p.textContent('#sbHinweis')));
  await p.evaluate(() => document.querySelector('#sbHinweis .sb-hi-zu').click());
  ck('„×“ = später erinnern (3 Tage Ruhe)', await p.evaluate(() => { sbHinweis(); return !$('sbHinweis') && sbInfo().spaeter > Date.now() + 2.9 * 864e5; }));
  // ---------- Aktualisieren ohne Löschen: lädt neu, Daten bleiben ----------
  await p.evaluate(() => sbDialog()); await p.waitForTimeout(300);
  ck('Dialog zeigt Stand und „Jetzt nach Update suchen“', /App aktualisieren/.test(await p.textContent('#skDlg')) && /v\d+/.test(await p.textContent('.sb-update')));
  await p.evaluate(() => { window.__vorReload = 1; });
  await p.click('#sbUpdate'); await p.waitForFunction(() => !window.__vorReload, null, { timeout: 8000 }); await p.waitForTimeout(800);
  ck('Nach dem Aktualisieren: neu geladen, Daten noch da', await p.evaluate(() => fiStore().einheiten.length === 1));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
