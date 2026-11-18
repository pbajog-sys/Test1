// Beat-Studio und Favoriten: Binär-Vorlage, Rhythmus/Melodie/Song/Mixer/Pads über die Oberfläche, Abspielen,
// Projekte, Binär-Generator, WAV-Export (Inhalt wird geprüft), Reparatur alter Projekte, Favoriten-Sterne im Hub.
// Aufruf: python3 -m http.server 8765, dann  node tests/studio.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', acceptDownloads: true });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  p.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'Mein Testbeat' : undefined));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1000);

  // ---------- Favoriten ----------
  const favIds = () => p.evaluate(() => [...document.querySelectorAll('#skFavoriten .hub-game')].map((x) => x.id).join(','));
  ck('Favoriten: Beat-Studio steht von Anfang an oben', (await favIds()) === 'hubStudio' && await p.evaluate(() => { const a = document.querySelector('#screen-hub .spalte-a'); return a.querySelector('.sk-kat') === $('skFavoriten'); }));
  await p.evaluate(() => $('skFavoriten').scrollIntoView()); await bild('fav-start');
  await p.click('#hubFalten .hg-stern'); await p.waitForTimeout(300);
  ck('Stern antippen: Falten wird Favorit, Spiel öffnet sich nicht', (await favIds()) === 'hubStudio,hubFalten' && await p.evaluate(() => $('screen-hub').classList.contains('active')));
  await p.click('#hubStudio .hg-stern'); await p.waitForTimeout(300);
  ck('Stern wieder aus: Studio zurück an seinen Platz (nach Song-Rätsel)', (await favIds()) === 'hubFalten' && await p.evaluate(() => $('hubStudio').previousElementSibling.id === 'hubSongs'));
  await p.reload(); await p.waitForTimeout(1000);
  ck('Favoriten bleiben nach Neuladen', (await favIds()) === 'hubFalten' && await p.evaluate(() => $('hubFalten').querySelector('.hg-stern').classList.contains('an')));
  await p.click('#hubStudio .hg-stern'); await p.waitForTimeout(200);
  ck('Reihenfolge = Reihenfolge des Markierens', (await favIds()) === 'hubFalten,hubStudio');
  await p.evaluate(() => $('skFavoriten').scrollIntoView()); await bild('fav-zwei');

  // ---------- Studio: Binär-Vorlage ----------
  await p.click('#hubStudio'); await p.waitForTimeout(900);
  const vor = await p.evaluate(() => {
    const m = st.p.muster, ok = [];
    for (let n = 0; n < 64; n++) { const a = biSpielt(n), mm = m[n >> 4], s = n % 16; ok.push(!!mm.snare[s] === a[3] && !!mm.shaker[s] === a[0] && !!mm.kick[s] === a[8] && (mm.lead[s] != null) === a[6] && (mm.sub[s] != null) === a[4]); }
    return { name: st.p.name, alle: ok.every(Boolean), bpm: st.p.bpm, song: st.p.song.join('') };
  });
  ck('Start-Projekt = Binär-Beat 0–63 als Muster A–D', vor.name === 'Binär-Dubstep' && vor.alle && vor.bpm === 140 && vor.song === '0123', JSON.stringify(vor));
  await bild('studio-rhythmus');
  // Rhythmus: Clap auf Schritt 5 setzen (Hälfte 1–8 auf dem Handy)
  await p.click('.st-z[data-k="clap"][data-s="4"]');
  ck('Rhythmus: Schritt antippen speichert', await p.evaluate(() => loadJson(ST_KEY).projekte[st.p.id].muster[0].clap[4] === 1));
  await p.click('[data-halb="1"]'); await p.click('.st-z[data-k="clap"][data-s="12"]');
  ck('Rhythmus: zweite Hälfte (9–16)', await p.evaluate(() => st.p.muster[0].clap[12] === 1));
  // Abspielen
  await p.click('#stPlay'); await p.waitForTimeout(1300);
  const lauf = await p.evaluate(() => ({ g: st.g, kopf: document.querySelectorAll('#stInhalt .kopf').length }));
  ck('Abspielen: Schritte laufen, Abspielkopf sichtbar', lauf.g >= 10 && lauf.kopf > 0, JSON.stringify(lauf));
  await bild('studio-spielt');
  // Melodie
  await p.click('[data-tab="melodie"]'); await p.waitForTimeout(200);
  await p.click('[data-kanal="lead"]'); await p.click('[data-halb="0"]');
  await p.click('.st-r[data-s="1"][data-stufe="9"]');
  ck('Melodie: Ton in der Piano-Roll gesetzt', await p.evaluate(() => st.p.muster[st.muster].lead[1] === 9));
  await p.selectOption('#stTonart', '0'); await p.selectOption('#stKlang', '2');
  ck('Melodie: Tonart (C-Moll: Stufe 9 = Es) und Klang', await p.evaluate(() => st.p.tonart === 0 && st.p.kanaele.lead.klang === 2 && stNotenName(stMidi(st.p, 'lead', 9)) === 'Es6'), await p.evaluate(() => stNotenName(stMidi(st.p, 'lead', 9))));
  await p.click('[data-kanal="chords"]'); await p.waitForTimeout(100); await bild('studio-melodie');
  ck('Akkorde: Zeilen sind Stufen I–VII mit Namen (C-Moll: Cm, D°, Es …)', (await p.$$('.st-rzeile')).length === 7 && await p.evaluate(() => [0, 1, 2, 4].map((d) => stAkkordName(st.p, d)).join(',') === 'Cm,D°,Es,Gm'), await p.evaluate(() => [0, 1, 2, 3, 4, 5, 6].map((d) => stAkkordName(st.p, d)).join(',')));
  // Song
  await p.click('[data-tab="song"]'); await p.click('[data-dazu="1"]'); await p.click('.st-slot[data-pos="0"]');
  ck('Song: Takt anhängen und Muster wechseln', await p.evaluate(() => st.p.song.join('') === '11231'));
  await p.click('#stSongPlay'); await p.waitForTimeout(600); await bild('studio-song');
  ck('Song-Modus spielt', await p.evaluate(() => st.laeuft && st.modus === 'song'));
  // Mixer
  await p.click('[data-tab="mixer"]'); await p.click('[data-stumm="kick"]'); await p.click('[data-solo="lead"]');
  ck('Mixer: stumm und solo wirken sofort', await p.evaluate(() => st.aus.kick.master.gain.value === 0 && st.aus.snare.master.gain.value === 0 && st.aus.lead.master.gain.value > 0));
  await bild('studio-mixer');
  await p.click('[data-solo="lead"]'); await p.click('[data-stumm="kick"]');
  // Pads mit Aufnahme
  await p.click('#stModus'); await p.click('[data-tab="pads"]'); await p.click('#stRec');
  const vorher = await p.evaluate(() => st.p.muster[st.muster].perc.filter(Boolean).length);
  const pad = await p.$('.st-pad:nth-child(6)');
  for (let i = 0; i < 3; i++) { await pad.dispatchEvent('pointerdown'); await p.waitForTimeout(170); }
  const nachher = await p.evaluate(() => st.p.muster[st.muster].perc.filter(Boolean).length);
  ck('Pads: Aufnahme schreibt Schläge ins laufende Muster', nachher > vorher, vorher + ' → ' + nachher);
  await bild('studio-pads');
  await p.click('#stPlay');
  ck('Stopp', await p.evaluate(() => !st.laeuft && !stTimer));

  // ---------- Menü: Binär-Generator, Vorlagen, Projekte, Umbenennen ----------
  await p.click('#stMenueBtn'); await p.click('.st-dialog [data-i="2"]');
  await p.fill('#stBinStart', '128'); await p.click('.st-dialog [data-i="0"]');
  ck('Binär-Generator ab 128: Wobble spielt', await p.evaluate(() => st.p.muster[0].wobble.some((x) => x != null) && st.p.binaerStart === 128));
  await p.click('#stMenueBtn'); await p.click('.st-dialog [data-i="1"]'); await p.click('.st-dialog [data-i="1"]');
  ck('Neues Projekt aus Vorlage (Happy Hardcore)', await p.evaluate(() => st.p.name === 'Happy Hardcore' && st.p.bpm === 175 && Object.keys(st.daten.projekte).length === 2));
  await p.click('#stMenueBtn'); await p.click('.st-dialog [data-i="3"]'); await p.waitForTimeout(200);
  ck('Umbenennen', (await p.textContent('#stTitel')).includes('Mein Testbeat'));
  await p.click('#stMenueBtn'); await p.click('.st-dialog [data-i="0"]'); await p.waitForTimeout(200);
  await bild('studio-projekte');
  ck('Projektliste zeigt beide', (await p.$$('.st-projekt')).length === 2);
  await p.click('.st-projekt:not(.an) [data-oeffnen]'); await p.waitForTimeout(200);
  ck('Projekt wechseln', await p.evaluate(() => st.p.name === 'Binär-Dubstep'));

  // ---------- WAV-Export ----------
  await p.click('#stModus');   // Song-Modus
  await p.click('#stMenueBtn'); await p.click('.st-dialog [data-i="4"]');
  await p.waitForSelector('#stLaden', { timeout: 20000 });
  const wav = await p.evaluate(async () => {
    const r = await fetch($('stLaden').href), ab = await r.arrayBuffer(), dv = new DataView(ab);
    let peak = 0; for (let o = 44; o < ab.byteLength; o += 2) peak = Math.max(peak, Math.abs(dv.getInt16(o, true)));
    const sek = (ab.byteLength - 44) / 4 / 44100, soll = st.p.song.length * 16 * stDauer(st.p) + 2.5;
    return { sek, soll, peak, riff: String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)), name: $('stLaden').download };
  });
  ck('WAV-Export: gültige Datei mit Song-Länge und Klang', wav.riff === 'RIFF' && Math.abs(wav.sek - wav.soll) < 0.05 && wav.peak > 3000 && wav.name === 'Binär-Dubstep.wav', JSON.stringify(wav));
  await bild('studio-export');
  await p.click('.st-dialog [data-i="x"]');

  // ---------- Reparatur alter/kaputter Projekte ----------
  const rep = await p.evaluate(() => { const x = stReparieren({ name: 'Alt', muster: [{ kick: [1] }], kanaele: { kick: { laut: 0.3 } } }); return x.muster.length === 4 && x.muster[0].kick.length === 16 && x.muster[0].lead.length === 16 && x.kanaele.kick.laut === 0.3 && x.kanaele.wobble.laut > 0 && x.bpm === 128; });
  ck('Alte Projekte werden ergänzt, nicht verworfen', rep);

  // ---------- Aus den Wundermustern ins Studio ----------
  await p.click('#stZurueck'); await p.waitForTimeout(500);
  await p.evaluate(() => { wuOeffnen(); }); await p.waitForTimeout(300);
  await p.click('[data-modus="binaer"]'); await p.click('#biStudioIntro'); await p.waitForTimeout(400);
  const w1 = await p.evaluate(() => ({ aktiv: $('screen-studio').classList.contains('active'), start: st.p.binaerStart, n: Object.keys(st.daten.projekte).length }));
  await p.click('#stZurueck'); await p.waitForTimeout(400);
  await p.evaluate(() => { wuOeffnen(); }); await p.waitForTimeout(300);
  await p.click('[data-modus="binaer"]'); await p.click('#biStudioIntro'); await p.waitForTimeout(400);
  const w2 = await p.evaluate(() => Object.keys(st.daten.projekte).length);
  ck('Wundermuster → Studio: Binär ab 0, beim zweiten Mal kein Doppel', w1.aktiv && w1.start === 0 && w1.n === 3 && w2 === 3, JSON.stringify(w1) + ' / ' + w2);
  await p.click('#stZurueck'); await p.waitForTimeout(500);
  ck('Zurück zum Start', await p.evaluate(() => $('screen-hub').classList.contains('active')));
  ck('Hub: Projektzahl', /3 Projekte/.test(await p.textContent('#hubStudioBest')));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
