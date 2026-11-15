// Lernhalle + SprechKI: Wort-Abgleich, echte vs. falsche Antworten beim Sprechen (Browser-Erkennung und Whisper simuliert),
// Slowenisch-Spielhalle (Decks, Karteikarten, 8 Spiele, Rollenspiel) und English Pro.
// Aufruf: python3 -m http.server 8765, dann  node tests/lernhalle.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + __dirname + '/sprechprobe.wav'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', permissions: ['microphone'] });
  await ctx.addInitScript(() => {
    localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] }));
    localStorage.setItem('walquiz.fuehrung.v1', JSON.stringify({ gesehen: { slo: true } })); localStorage.setItem('walquiz.installhinweis.v1', 'weg');
    // simulierte Browser-Erkennung: liefert window.__gehoert (Text) oder Fehler
    window.SpeechRecognition = class { start() { setTimeout(() => { if (window.__srFehler) { this.onerror({ error: window.__srFehler }); this.onend(); return; } this.onresult({ results: [[{ transcript: window.__gehoert || '' }]] }); this.onend(); }, 60); } stop() {} abort() {} };
  });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message)); p.on('dialog', (d) => d.accept());
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);

  // ---------- Wort-Abgleich ----------
  const v = await p.evaluate(() => {
    const V = (h, z, l) => SprechKI.vergleiche(h, z, l);
    return {
      exakt: V('Eno kavo, prosim', 'Eno kavo, prosim.', 'sl').quote,
      akzente: V('eno kavo prosim', 'Ena kava, prosím', 'sl').quote,
      hacek: V('cas je', 'Čas je.', 'sl').ok,
      anders: V('dober dan', 'Hvala lepa.', 'sl').quote,
      teil: V('imam dva', 'Imam dva brata.', 'sl'),
      zahl: V('imam 10 let', 'Imam deset let.', 'sl').ok,
      kurz: V("I'm looking forward to it", 'I am looking forward to it.', 'en').ok,
      extra: V('um so I would like a coffee please yes yes yes', 'I would like a coffee, please.', 'en').quote,
      leer: V('', 'Hello there.', 'en').quote,
      unsinn: V('banana phone', 'Could you please confirm the date?', 'en').ok,
    };
  });
  ck('Abgleich: exakt 100 %, č≈c, Zahlen als Wort, englische Kurzformen', v.exakt === 1 && v.hacek && v.zahl && v.kurz, JSON.stringify({ e: v.exakt, h: v.hacek, z: v.zahl, k: v.kurz }));
  ck('Abgleich: anderer Satz / Unsinn / nichts → nicht bestanden', v.anders < 0.4 && !v.unsinn && v.leer === 0, JSON.stringify({ a: v.anders.toFixed(2), u: v.unsinn, l: v.leer }));
  ck('Abgleich: halber Satz → fehlende Wörter markiert, nicht bestanden', !v.teil.ok && v.teil.woerter.filter((w) => w.status === 'fehlt').length === 1, JSON.stringify(v.teil.woerter.map((w) => w.w + ':' + w.status)));
  ck('Abgleich: Füllwörter kosten etwas, Kernsatz zählt', v.extra > 0.5 && v.extra < 1, v.extra.toFixed(2));

  // ---------- Slowenisch: Sprechen in der Lektion – falsch gesprochen ist falsch ----------
  await p.evaluate(() => { show('slo', '🐉 Slowenisch'); sloKarte(); }); await p.waitForTimeout(1000);
  await p.evaluate(() => { sloStart(SLO_EINHEITEN[0]); const a = { typ: 'sprechen', s: SLO_EINHEITEN[0].S[0] }; slo.liste.splice(slo.i, 0, a); sloZeigen(); });
  await p.evaluate(() => { window.__gehoert = 'nasvidenje mama'; }); await p.click('#sloSprechBox .ski-mikro'); await p.waitForTimeout(400);
  const falsch = await p.evaluate(() => ({ zustand: slo.zustand, text: $('sloSprechBox').innerText, rote: document.querySelectorAll('#sloSprechBox .ski-w.fehlt').length, knopf: $('sloPruefen').textContent }));
  ck('Falsch gesagt → NICHT „richtig“, rote Wörter, „So lassen“', falsch.zustand === 'antwort' && falsch.rote >= 2 && /So lassen/.test(falsch.knopf) && /anders/.test(falsch.text), JSON.stringify(falsch).slice(0, 160));
  await bild('lh-slo-sprechen-falsch');
  await p.evaluate(() => { window.__gehoert = 'dober dan kako ste'; }); await p.click('#sloSprechBox .ski-mikro'); await p.waitForTimeout(500);
  ck('Richtig gesagt → automatisch richtig, Wort-Hinweis', await p.evaluate(() => slo.zustand === 'weiter' && /gut/.test($('sloFuss').className) && /Gehört/.test($('sloUrteil').innerText)));
  await p.evaluate(() => sloKarte());

  // ---------- Whisper-Weg (simuliert): Aufnahme vom Mikrofon → Transkript ----------
  await p.evaluate(() => { saveJson('walquiz.sprechki.v1', { modell: 'base' }); window.SpeechRecognition = undefined; SprechKI._transkribiere = async () => 'Dober dan, kako ste?'; });
  ck('Slowenisch nutzt Whisper, sobald eingerichtet', await p.evaluate(() => SprechKI.weg('sl') === 'whisper' && /Whisper/.test(SprechKI.statusText('sl'))));
  await p.evaluate(() => { sloStart(SLO_EINHEITEN[0]); slo.liste.splice(slo.i, 0, { typ: 'sprechen', s: SLO_EINHEITEN[0].S[0] }); sloZeigen(); });
  await p.click('#sloSprechBox .ski-mikro');
  await p.waitForFunction(() => slo.zustand === 'weiter', null, { timeout: 15000 }).catch(() => {});
  ck('Whisper: echte Mikro-Aufnahme → Transkript → richtig', await p.evaluate(() => slo.zustand === 'weiter' && /gut/.test($('sloFuss').className)), await p.evaluate(() => $('sloSprechBox').innerText.slice(0, 120)));
  await p.evaluate(() => { SprechKI._transkribiere = async () => 'Hvala lepa.'; sloZeigen(); slo.zustand = 'antwort'; slo.liste.splice(slo.i, 0, { typ: 'sprechen', s: SLO_EINHEITEN[0].S[0] }); sloZeigen(); });
  await p.click('#sloSprechBox .ski-mikro');
  await p.waitForSelector('#sloSprechBox .ski-urteil', { timeout: 15000 }).catch(() => {});
  ck('Whisper: anderer Satz erkannt → falsch', await p.evaluate(() => slo.zustand === 'antwort' && /schlecht/.test(document.querySelector('#sloSprechBox .ski-urteil').className)));
  await p.evaluate(() => { saveJson('walquiz.sprechki.v1', {}); sloKarte(); });
  // Einrichten-Dialog
  await p.evaluate(() => SprechKI.einrichten()); await p.waitForTimeout(200);
  ck('Einrichten-Dialog: 2 Modelle, Datenschutz, Laden-Knopf', await p.evaluate(() => document.querySelectorAll('#skiDlg [data-m]').length === 2 && /verlässt das Gerät nicht/.test($('skiDlg').innerText) && !!document.querySelector('#skiDlg [data-ski="los"]')));
  await bild('lh-whisper-dialog');
  await p.evaluate(() => $('skiDlg').close());

  // ---------- Slowenisch: Spielhalle ----------
  await p.evaluate(() => slpZeige('spiele')); await p.waitForSelector('.lh-hero', { timeout: 15000 });
  const start = await p.evaluate(() => ({ decks: [...document.querySelectorAll('.lh-deck')].map((x) => x.dataset.deck), spiele: document.querySelectorAll('.lh-spiel').length, rollen: document.querySelectorAll('.lh-rolle').length, tab: !!document.querySelector('[data-slp="spiele"].an') }));
  ck('Spielhalle (Slowenisch): Decks Alltag/A1–B2/Business/Pharma/Mix, 10 Spiele, 5 Rollenspiele, Lernplan-Knopf', JSON.stringify(start.decks) === JSON.stringify(['alltag', 'a1', 'a2', 'b1', 'b2', 'business', 'pharma', 'mix']) && start.spiele === 10 && start.rollen === 5 && start.tab, JSON.stringify(start));
  ck('Ohne Plan: „Lernplan erstellen“ sichtbar', await p.evaluate(() => !!document.querySelector('[data-lh="plan-neu"].lh-plan-neu')));
  await bild('lh-slo-start');
  const groesse = await p.evaluate(() => LH._intern.decks().map((d) => d.id + ':' + d.items.length).join(' '));
  ck('Decks gefüllt (Pharma ≥ 70, Business ≥ 60, A1–B2 je ≥ 500)', await p.evaluate(() => { const D = Object.fromEntries(LH._intern.decks().map((d) => [d.id, d.items.length])); return D.pharma >= 70 && D.business >= 60 && ['a1', 'a2', 'b1', 'b2'].every((k) => D[k] >= 500) && D.alltag > 80; }), groesse);
  const fachOk = await p.evaluate(() => LH._intern.decks().filter((d) => ['pharma', 'business'].includes(d.id)).flatMap((d) => d.items).every((x) => x.z && x.de && x.bsp && x.bspDe));
  ck('Jedes Pharma-/Business-Wort hat Beispielsatz mit Übersetzung', fachOk);
  await p.click('[data-deck="pharma"]'); await p.waitForTimeout(300);
  ck('Deck „Pharma“ gewählt und gespeichert', await p.evaluate(() => LH._intern.store().deck === 'pharma' && !!document.querySelector('[data-deck="pharma"].an')));
  // Karteikarten
  await p.click('[data-lh="karten"]'); await p.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { await p.click('[data-lh="karte"]'); await p.waitForTimeout(150); if (i === 0) await bild('lh-karte'); await p.click('[data-note="' + (i === 1 ? 0 : 2) + '"]'); await p.waitForTimeout(120); }
  const srs = await p.evaluate(() => { const s = LH._intern.store(), h = LH._intern.tagNr(); return Object.values(s.srs).map((z) => [z[0], z[1] - h]); });
  ck('Karteikarten: umdrehen, bewerten → Spaced Repetition gespeichert („Nochmal“ bleibt heute fällig)', srs.length === 3 && srs.filter((z) => z[1] > 0).length === 2, JSON.stringify(srs));
  await p.click('[data-lh="raus"]'); await p.waitForTimeout(400);
  // Blitz: alles richtig klicken
  await p.click('[data-spiel="blitz"]'); await p.waitForTimeout(300);
  for (let i = 0; i < 8; i++) {
    await p.evaluate(() => { const f = document.querySelector('.lh-frage b').textContent; const D = LH._intern.aktivesDeck().items; const x = D.find((y) => y.z === f || y.de === f); const b = [...document.querySelectorAll('.lh-opt:not([disabled])')].find((o) => x && (o.textContent === x.de || o.textContent === x.z)); if (b) b.click(); });
    await p.waitForTimeout(330);
  }
  const blitz = await p.evaluate(() => ({ punkte: +document.querySelector('.lh-punkte').textContent.replace(/\./g, ''), combo: (document.querySelector('.lh-combo') || {}).textContent }));
  ck('Blitz-Duell: richtige Antworten → Punkte + Serien-Bonus', blitz.punkte >= 100 && /×/.test(blitz.combo || ''), JSON.stringify(blitz));
  await bild('lh-blitz');
  await p.evaluate(() => { document.querySelector('[data-lh="raus"]').click(); }); await p.waitForTimeout(300);
  // Memory komplett lösen
  await p.click('[data-spiel="memory"]'); await p.waitForTimeout(300);
  await p.evaluate(async () => {
    const D = LH._intern.aktivesDeck().items, K = [...document.querySelectorAll('.lh-mk')];
    const paarVon = (t) => D.find((x) => x.z === t || x.de === t);
    const erledigt = new Set();
    for (const a of K) {
      if (erledigt.has(a)) continue;
      const ta = a.querySelector('.v').textContent, xa = paarVon(ta);
      const bb = K.find((c) => c !== a && !erledigt.has(c) && paarVon(c.querySelector('.v').textContent) === xa && c.classList.contains('z') !== a.classList.contains('z'));
      a.click(); bb.click(); erledigt.add(a); erledigt.add(bb);
      await new Promise((r) => setTimeout(r, 420));
    }
  });
  await p.waitForSelector('.lh-ende', { timeout: 5000 }).catch(() => {});
  const mem = await p.evaluate(() => ({ ende: !!document.querySelector('.lh-ende'), rekord: !!document.querySelector('.lh-rekord'), best: LH._intern.store().best.memory, sterne: document.querySelectorAll('.lh-sterne .an').length }));
  ck('Memory: 6 Paare mit 6 Zügen → Ende, Rekord, 3 Sterne', mem.ende && mem.rekord && mem.best >= 480 && mem.sterne === 3, JSON.stringify(mem));
  await bild('lh-ende');
  // Tipp-Turbo: richtig, mit Akzentfehler, falsch
  await p.click('[data-lh="raus"]'); await p.waitForTimeout(300); await p.click('[data-spiel="tippen"]'); await p.waitForTimeout(300);
  const tipp = [];
  for (const art of ['exakt', 'akzent', 'falsch']) {
    await p.evaluate((art) => { const de = document.querySelector('.lh-frage b').textContent, x = LH._intern.aktivesDeck().items.find((y) => y.de === de); const i = document.querySelector('[data-lh="ein"]'); i.value = art === 'exakt' ? x.z : art === 'akzent' ? x.z.normalize('NFD').replace(/[̀-ͯ]/g, '') : 'qqqq'; document.querySelector('[data-lh="form"]').requestSubmit(); }, art);
    await p.waitForTimeout(100); tipp.push(await p.evaluate(() => document.querySelector('.lh-loesung').className + ' ' + document.querySelector('.lh-loesung').textContent.slice(0, 18)));
    await p.waitForTimeout(1800);
  }
  ck('Tipp-Turbo: exakt ✓, ohne Häkchen ✓ (Hinweis), Unsinn ✗', /gut/.test(tipp[0]) && /gut/.test(tipp[1]) && /schlecht/.test(tipp[2]), tipp.join(' | '));
  ck('Tipp-Wertung: Tippfehler-Toleranz nur ab 5 Buchstaben', await p.evaluate(() => { const T = LH._intern.tippWert; return T('odmerk', 'odmerek') === 0.6 && T('pes', 'pas') === 0 && T('Kontrola kakovosti', 'kontrola kakovosti') === 1 && T('to carry out', 'carry out / to carry out') === 1; }));
  // Wort-Regen: drei Wellen richtig fangen, dann absichtlich daneben
  await p.click('[data-lh="raus"]'); await p.waitForTimeout(300); await p.click('[data-spiel="regen"]'); await p.waitForTimeout(400);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { const de = document.querySelector('[data-lh="prompt"]').textContent, x = LH._intern.aktivesDeck().items.find((y) => y.de === de); [...document.querySelectorAll('.lh-tropfen')].find((t) => t.textContent === x.z).click(); }); await p.waitForTimeout(450); }
  await bild('lh-regen');
  const regen1 = await p.evaluate(() => +document.querySelector('.lh-punkte').textContent);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { const de = document.querySelector('[data-lh="prompt"]').textContent, x = LH._intern.aktivesDeck().items.find((y) => y.de === de); const t = [...document.querySelectorAll('.lh-tropfen:not([disabled])')].find((q) => q.textContent !== x.z); if (t) t.click(); }); await p.waitForTimeout(1250); }
  await p.waitForSelector('.lh-ende', { timeout: 4000 }).catch(() => {});
  ck('Wort-Regen: Treffer geben Punkte, 3 Fehlgriffe → Spielende', regen1 >= 30 && await p.evaluate(() => !!document.querySelector('.lh-ende')), 'Punkte ' + regen1);
  // Satz-Sprint
  await p.click('[data-lh="raus"]'); await p.waitForTimeout(300); await p.click('[data-spiel="satz"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { const de = document.querySelector('.lh-frage b').textContent, x = LH._intern.aktivesDeck().items.find((y) => y.bspDe === de); x.bsp.split(' ').forEach((w) => { const k = [...document.querySelectorAll('.lh-bank .lh-kachel:not(.weg)')].find((q) => q.textContent === w); k.click(); }); document.querySelector('[data-lh="ok"]').click(); });
  await p.waitForTimeout(150);
  ck('Satz-Sprint: Pharma-Satz richtig gebaut', await p.evaluate(() => /gut/.test(document.querySelector('.lh-loesung').className)));
  await bild('lh-satz');
  // Grammatik-Duell
  await p.click('[data-lh="raus"]'); await p.waitForTimeout(300); await p.click('[data-spiel="grammatik"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { const b = [...document.querySelectorAll('.lh-opt')]; const s = document.querySelector('.lh-frage b').textContent; const f = SLF_GRAMMATIK.find((g) => g.s.replace('___', '') === s.replace('___', '')); b.find((x) => x.textContent === f.o[f.r]).click(); });
  ck('Grammatik-Duell: richtige Lücke + Erklärung', await p.evaluate(() => /Richtig/.test(document.querySelector('.lh-erk').textContent)));
  // Übersetzung (Slowenisch, Deck Alltag mit Varianten)
  await p.click('[data-lh="raus"]'); await p.waitForTimeout(300); await p.click('[data-deck="alltag"]'); await p.waitForTimeout(300);
  await p.click('[data-spiel="uebersetzen"]'); await p.waitForTimeout(300);
  const ue = [];
  for (let i = 0; i < 3; i++) {
    await p.evaluate((i) => {
      const q = document.querySelector('.lh-frage b').textContent, P = LH._paket('slo');
      const x = P.uebersetzung.find((y) => y.de === q || y.z === q) || LH._intern.aktivesDeck().items.find((y) => y.bspDe === q || y.bsp === q);
      const nachZiel = !!(x.de === q || x.bspDe === q);
      const ziel = nachZiel ? (x.z || x.bsp) : (x.de || x.bspDe);
      document.querySelector('[data-lh="ein"]').value = i === 0 ? ziel : i === 1 ? ziel.split(' ').slice(0, -1).join(' ') + ' xyz' : 'banana';
      document.querySelector('[data-lh="ok"]').click();
    }, i);
    await p.waitForTimeout(120);
    ue.push(await p.evaluate(() => document.querySelector('.lh-erk b').textContent));
    if (i === 2) { await p.click('[data-lh="auch"]'); ue.push(await p.evaluate(() => document.querySelector('[data-lh="auch"]').textContent)); }
    await p.click('[data-lh="weiter"]'); await p.waitForTimeout(150);
  }
  ck('Übersetzung: exakt „Sehr gut“, fast „Nah dran“/„Sehr gut“, Unsinn „Weicht ab“; „Meine Version stimmt auch“ zählt', /Sehr gut/.test(ue[0]) && /Nah dran|Sehr gut/.test(ue[1]) && /Weicht/.test(ue[2]) && /gezählt/.test(ue[3]), ue.join(' | '));
  await bild('lh-uebersetzen');
  ck('Diktat-Wertung: exakt 100 %, ohne Häkchen = halbe Punkte, falsches Wort rot', await p.evaluate(() => { const D = LH._intern.diktatWert; const a = D('dober dan kako ste', 'Dober dan, kako ste?'), b = D('zelim kavo', 'Želim kavo.'), c = D('dober noc', 'Dober dan.'); return a.quote === 1 && b.quote === 0.75 && b.woerter[0].status === 'fast' && c.woerter[1].status === 'fehlt'; }));
  ck('Diktat ohne slowenische Stimme ehrlich gesperrt', await p.evaluate(() => { const b = document.querySelector('[data-spiel="diktat"]'); return !b || true; }) && await p.evaluate(async () => { document.querySelector('[data-lh="raus"]').click(); await new Promise((r) => setTimeout(r, 300)); const b = document.querySelector('[data-spiel="diktat"]'); return b.disabled === !LH._paket('slo').hatTon('Dober dan.'); }));
  // Sprech-Arena mit Whisper (simuliert): sagt immer den Zielsatz
  await p.evaluate(() => { saveJson('walquiz.sprechki.v1', { modell: 'base' }); SprechKI._transkribiere = async () => document.querySelector('.lh-frage b').textContent; });
  await p.click('[data-spiel="sprechen"]'); await p.waitForTimeout(300);
  await p.click('.lh-buehne .ski-mikro'); await p.waitForSelector('.lh-buehne .ski-urteil', { timeout: 15000 }).catch(() => {});
  ck('Sprech-Arena: gesprochen → Wort-Farben, Punkte', await p.evaluate(() => document.querySelectorAll('.lh-buehne .ski-w.ok').length >= 1 && +document.querySelector('.lh-punkte').textContent >= 15));
  await bild('lh-sprechen');
  await p.evaluate(() => saveJson('walquiz.sprechki.v1', {}));
  // Rollenspiel GMP-Audit fehlerfrei
  await p.click('[data-lh="raus"]'); await p.waitForTimeout(300); await p.click('[data-rolle="presoja"]'); await p.waitForTimeout(700);
  for (let i = 0; i < 5; i++) { await p.evaluate(() => { const R = SLF_ROLLEN.find((r) => r.id === 'presoja'); const richtige = R.z.filter((z) => z[0] === 'du').map((z) => z[1].find((o) => o[2])[0]); const b = [...document.querySelectorAll('.lh-antwort')].find((x) => richtige.some((r) => x.textContent.startsWith(r))); if (b) b.click(); }); await p.waitForTimeout(950); }
  await bild('lh-rolle');
  ck('Rollenspiel GMP-Audit: fehlerfrei → 3 Sterne gespeichert', await p.evaluate(() => LH._intern.store().rollen.presoja === 3 && document.querySelectorAll('.lh-blase.du').length === 5));
  // falsche Antwort erklärt
  await p.click('[data-lh="nochmal"]'); await p.waitForTimeout(700);
  await p.evaluate(() => { const b = [...document.querySelectorAll('.lh-antwort')].find((x) => /smeteh|ne delamo/.test(x.textContent)); b.click(); });
  ck('Rollenspiel: falsche Antwort → Erklärung, bleibt stehen', await p.evaluate(() => !!document.querySelector('.lh-antwort.falsch em') && document.querySelectorAll('.lh-blase.du').length === 0));
  await p.click('[data-lh="raus"]'); await p.waitForTimeout(400);
  const xp = await p.evaluate(() => LH._intern.store().xp);
  ck('XP gesammelt, Level-Leiste und Tagesring sichtbar', xp > 50 && await p.evaluate(() => !!document.querySelector('.lh-xpbar i') && !!document.querySelector('.lh-hero .lh-ring')), xp + ' XP');
  ck('„Meine Fehler“-Deck taucht auf', await p.evaluate(() => !!document.querySelector('[data-deck="fehler"]')));
  await bild('lh-slo-start-2');

  // ---------- English Pro ----------
  await p.evaluate(() => zeigeHub()); await p.waitForTimeout(500);
  ck('Hub-Karte „English Pro“ in Wissen & Sprache', await p.evaluate(() => !!document.querySelector('.sk-kat-wissen #hubEng')));
  await p.click('#hubEng'); await p.waitForSelector('#engInhalt .lh-hero', { timeout: 8000 });
  const en = await p.evaluate(() => ({ decks: [...document.querySelectorAll('#engInhalt .lh-deck')].map((x) => x.dataset.deck), spick: document.querySelectorAll('#engInhalt .lh-spick details').length, rollen: document.querySelectorAll('#engInhalt .lh-rolle').length, groesse: LH._intern.decks().map((d) => d.items.length) }));
  ck('English Pro: B1, B2, C1, C2, Business, Pharma, Phrasal Verbs, Idioms, False Friends + Mix; 6 Rollenspiele; 12 Spickzettel', JSON.stringify(en.decks) === JSON.stringify(['b1', 'b2', 'c1', 'c2', 'business', 'pharma', 'phrasal', 'idiome', 'falsch', 'mix']) && en.rollen === 6 && en.spick === 12, JSON.stringify(en));
  ck('C1/C2: ≥ 45 Wörter je Stufe, ≥ 25 Idioms, ≥ 75 Grammatik-Fragen, ≥ 20 Übersetzungen inkl. Texte', await p.evaluate(() => { const D = Object.fromEntries(LH._intern.decks().map((d) => [d.id, d.items.length])); return D.c1 >= 45 && D.c2 >= 45 && D.idiome >= 25 && EN_GRAMMATIK.length >= 75 && EN_UEBERSETZUNG.length >= 20 && EN_UEBERSETZUNG.filter((x) => x.text).length >= 4; }));
  // Lernplan mit Einstufungstest
  await p.click('#engInhalt [data-lh="plan-neu"]'); await p.waitForTimeout(200);
  await p.click('#engInhalt [data-z="C2"]'); await p.click('#engInhalt [data-m="30"]'); await p.click('#engInhalt [data-lh="test"]'); await p.waitForTimeout(200);
  for (let i = 0; i < 20; i++) {
    await p.evaluate(() => { const z = document.querySelector('.lh-frage b').textContent, x = LH._intern.decks().flatMap((d) => d.items).find((y) => y.z === z); const lvl = +document.querySelector('.lh-frage small').textContent.split(' ')[0]; const b = [...document.querySelectorAll('.lh-opt')]; const richtig = b.find((o) => o.textContent === x.de); (lvl <= 10 ? richtig : b[b.length - 1]).click(); });
    await p.waitForTimeout(40);
  }
  ck('Einstufung: B1+B2 gewusst, C1 nicht → Start C1', await p.evaluate(() => /Einstufung: C1/.test(document.querySelector('.lh-ende h3').textContent)));
  await bild('lh-einstufung');
  await p.click('#engInhalt [data-lh="weiter"]'); await p.waitForTimeout(200);
  await p.click('#engInhalt [data-lh="speichern"]'); await p.waitForTimeout(400);
  const plan = await p.evaluate(() => ({ plan: LH._intern.store().plan, niv: LH._intern.aktuellesNiveau().id, m: LH._intern.planMissionen().M.map((m) => m.id), karte: !!document.querySelector('#engInhalt .lh-plan'), ton: LH._paket('en').hatTon('x') }));
  ck('Plan gespeichert (Ziel C2, 30 Min., Start C1) mit Tagesmissionen (Diktat nur mit Stimme), Übersetzung, Grammatik, Rollenspiel', plan.karte && plan.plan.ziel === 'C2' && plan.plan.start === 'C1' && plan.niv === 'C1' && plan.m.length === (plan.ton ? 6 : 5) && plan.m.includes('diktat') === plan.ton && plan.m.includes('uebersetzen') && plan.m.includes('grammatik') && plan.m.includes('rolle'), JSON.stringify(plan.m));
  await bild('lh-plan');
  // Mission „Übersetzung“ starten und erledigen
  await p.evaluate(() => { const M = LH._intern.planMissionen().M; document.querySelector('[data-mission="' + M.findIndex((m) => m.id === 'uebersetzen') + '"]').click(); });
  await p.waitForTimeout(300);
  for (let i = 0; i < 5; i++) { await p.click('#engInhalt [data-lh="skip"]'); await p.waitForTimeout(80); await p.click('#engInhalt [data-lh="weiter"]'); await p.waitForTimeout(120); }
  await p.waitForSelector('#engInhalt .lh-ende', { timeout: 4000 }).catch(() => {});
  await p.click('#engInhalt [data-lh="raus"]'); await p.waitForTimeout(300);
  ck('Mission erledigt → abgehakt, Wochenleiste zeigt heute', await p.evaluate(() => !!document.querySelector('#engInhalt .lh-mission.fertig') && !!document.querySelector('#engInhalt .lh-woche i.heute.halb')));
  // Diktat (englische Stimme simuliert)
  await p.evaluate(() => { const P = LH._paket('en'); P.hatTon = () => true; P.sprich = (t) => { window.__gesprochen = t; }; LH.home(); }); await p.waitForTimeout(300);
  await p.click('#engInhalt [data-deck="pharma"]'); await p.waitForTimeout(300);
  await p.click('#engInhalt [data-spiel="diktat"]'); await p.waitForTimeout(500);
  const dik = await p.evaluate(async () => {
    const t = window.__gesprochen, w = t.split(' ').sort((x, y) => y.length - x.length)[0].replace(/[.,!?]/g, ''), kaputt = w.slice(0, 2) + w[3] + w[2] + w.slice(4);
    document.querySelector('[data-lh="ein"]').value = t.replace(w, kaputt); document.querySelector('[data-lh="ok"]').click();
    await new Promise((r) => setTimeout(r, 100));
    const falsch = [...document.querySelectorAll('.lh-erk .ski-w')].filter((x) => !x.classList.contains('ok'));
    return { kaputt, n: falsch.length, text: falsch.map((x) => x.textContent).join(','), ok: document.querySelectorAll('.lh-erk .ski-w.ok').length };
  });
  ck('Diktat: vertauschte Buchstaben → genau dieses Wort markiert, Rest grün', dik.n === 1 && dik.text.includes(dik.kaputt.toLowerCase()) && dik.ok >= 2, JSON.stringify(dik));
  await bild('lh-diktat');
  await p.click('#engInhalt [data-lh="raus"]'); await p.waitForTimeout(300);
  ck('English-Inhalte: jeder Eintrag mit Beispiel + Übersetzung, ≥ 48 Grammatik-Fragen', await p.evaluate(() => LH._intern.decks().flatMap((d) => d.items).every((x) => x.bsp && x.bspDe) && EN_GRAMMATIK.length >= 48 && EN_GRAMMATIK.every((g) => g.s.includes('___') && g.o[g.r])));
  await bild('lh-en-start');
  await p.click('#engInhalt [data-spiel="grammatik"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { const s = document.querySelector('.lh-frage b').textContent; const f = EN_GRAMMATIK.find((g) => g.s.replace('___', '') === s.replace('___', '')); [...document.querySelectorAll('.lh-opt')].find((x) => x.textContent === f.o[(f.r + 1) % 3]).click(); });
  ck('English Grammatik-Duell: falsche Wahl → Erklärung', await p.evaluate(() => /Leider/.test(document.querySelector('.lh-erk').textContent)));
  await bild('lh-en-grammatik');
  await p.click('[data-lh="raus"]'); await p.waitForTimeout(300);
  // Englisch Sprechen über Browser-Erkennung (simuliert): falsche Präposition wird rot markiert
  const enSp = await p.evaluate(async () => { window.__srFehler = null; window.__gehoert = 'I am interested on the position'; const r = await SprechKI.hoeren('en'); const v = SprechKI.besteVon(r.alternativen, 'I am interested in the position.', 'en'); return { weg: SprechKI.weg('en'), w: v.woerter.map((x) => x.w + ':' + x.status).join(' ') }; });
  ck('Englisch: Browser-Erkennung, falsche Präposition „on“ statt „in“ wird markiert', enSp.weg === 'web' && /in:fehlt/.test(enSp.w) && /interested:ok/.test(enSp.w), JSON.stringify(enSp));
  await p.click('#engInhalt [data-rolle="interview"]'); await p.waitForTimeout(500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('.lh-antwort')].find((x) => /since five years/.test(x.textContent)); b.click(); });
  ck('Interview: Germanismus „since five years“ wird erklärt', await p.evaluate(() => /for five years/.test(document.querySelector('.lh-antwort.falsch em').textContent)));
  await bild('lh-en-rolle');
  await p.click('#engZurueck'); await p.waitForTimeout(300); await p.click('#engZurueck'); await p.waitForTimeout(500);
  ck('Zurück: erst zur Lernhalle, dann zum Hub', await p.evaluate(() => $('screen-hub').classList.contains('active') && !!$('hubEngBest').textContent));
  ck('Keine JS-Fehler', !fehler.length, fehler.slice(0, 3).join(' | '));
  await b.close();
  const ok = checks.filter((c) => c[1]).length; console.log('\n' + ok + '/' + checks.length + ' Checks bestanden');
  process.exit(ok === checks.length ? 0 : 1);
})();
