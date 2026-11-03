// Slowenisch: Lektionen durchspielen (simulierte Stimme und Spracherkennung), „Ich weiß es nicht“, Sprech-Fehler, „nicht hören“.
// Aufruf: python3 -m http.server 8765, dann  node tests/slo.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
let ok = 0, fail = 0;
const pruefe = (n, b, i = '') => { b ? ok++ : fail++; console.log((b ? '✓ ' : '✗ ') + n + (i ? ' – ' + i : '')); };
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + __dirname + '/sprechprobe.wav'] }); const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => {
    localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'P', avatar: '🐸', farbe: '#22c55e' }] }));
    localStorage.setItem('walquiz.fuehrung.v1', JSON.stringify({ gesehen: { slo: true } })); localStorage.setItem('walquiz.installhinweis.v1', 'weg');
    // simulierte Spracherkennung: liefert den Zieltext – oder einen Fehler, wenn window.__srFehler gesetzt ist
    window.SpeechRecognition = class { start() { setTimeout(() => { if (window.__srFehler) { this.onerror({ error: window.__srFehler }); this.onend(); return; } const a = slo.liste[slo.i], t = a.s ? a.s.sl : a.w.sl; this.onresult({ results: [[{ transcript: t.toLowerCase().replace(/[.,!?]/g, '') }]] }); this.onend(); }, 80); } abort() {} };
  });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message)); p.on('dialog', (d) => d.accept());
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  await p.evaluate(() => { sloAudio = {}; show('slo', '🐉 Slowenisch'); sloKarte(); }); await p.waitForTimeout(1600);
  await p.screenshot({ path: ordner + '/slo-karte.png', fullPage: true });
  const urteile = await p.evaluate(() => {
    const P = (folge) => { const out = []; let t = 0; folge.forEach(([dauer, rms]) => { for (let k = 0; k < dauer / 16; k++) { out.push({ t, rms: rms * (rms > 0.02 ? 0.6 + 0.4 * Math.abs(Math.sin(t / 60)) : 1) }); t += 16; } }); return out; };
    const satz = 'Dober dan, kako ste?';   // 7 Silben
    return {
      stille: sloSprachUrteil(P([[3000, 0.004]]), 0.004, satz).ok,
      kurz: sloSprachUrteil(P([[300, 0.004], [180, 0.1], [1200, 0.004]]), 0.004, satz).ok,
      passend: sloSprachUrteil(P([[300, 0.004], [1500, 0.1], [1200, 0.004]]), 0.004, satz).ok,
      lang: sloSprachUrteil(P([[300, 0.004], [8000, 0.1], [600, 0.004]]), 0.004, satz).ok,
      silbenR: sloSilben('Prst') + '/' + sloSilben('Dober dan'),
    };
  });
  pruefe('Sprach-Urteil: Stille ✗, zu kurz ✗, passend ✓, viel zu lang ✗', !urteile.stille && !urteile.kurz && urteile.passend && !urteile.lang, JSON.stringify(urteile));
  pruefe('Landschaften an allen Stationen', await p.evaluate(() => document.querySelectorAll('.slo-deko svg').length === SLO_EINHEITEN.length));
  pruefe('Drache mit Flügeln auf der Karte', await p.evaluate(() => !!document.querySelector('#sloMaskottchen .slo-fl-l')));
  await p.click('#sloMaskottchen', { force: true }); await p.waitForTimeout(300);
  pruefe('Drache antippen → Looping', await p.evaluate(() => $('sloMaskottchen').classList.contains('looping')));
  const loese = async (falsch) => p.evaluate((falsch) => {
    const a = slo.liste[slo.i], box = $('sloAufgabe');
    const opt = (t) => { const el = [...box.querySelectorAll('.slo-opt')].find((x) => (falsch ? !t(x) : t(x))); if (el) el.click(); };
    const txt = (x) => sloNorm(x.textContent);
    if (a.typ === 'bild') opt((x) => x.textContent.trim() === a.w.e);
    else if (a.typ === 'slde') opt((x) => txt(x) === sloNorm(a.w.de));
    else if (a.typ === 'desl' || a.typ === 'hoeren') opt((x) => txt(x) === sloNorm(a.w.sl));
    else if (a.typ === 'satzwahl') opt((x) => txt(x) === sloNorm(a.s.de));
    else if (a.typ === 'luecke') { const t2 = box.querySelector('.slo-frage').textContent.split(/\s+/); const z = sloNorm(sloTeile(a.s.sl)[t2.indexOf('____')]); opt((x) => txt(x) === z); }
    else if (a.typ === 'tippen') { const i = $('sloEingabe'); i.value = a.w.sl; i.dispatchEvent(new Event('input')); }
    else if (a.typ === 'bauen' || a.typ === 'diktat') { sloTeile(a.typ === 'diktat' || a.nach === 'sl' ? a.s.sl : a.s.de).forEach((t) => { const k = [...box.querySelectorAll('.slo-bank .slo-kachel:not(.weg)')].find((x) => x.textContent === t); if (k) k.click(); }); }
    else if (a.typ === 'sprechen') { if ($('sloMikro')) $('sloMikro').click(); else sloBewerten({ ok: true, loesung: '' }, a); }
    else if (a.typ === 'paare') a.liste.forEach((w) => { box.querySelector('.slo-paar[data-s="l"][data-sl="' + w.sl + '"]').click(); box.querySelector('.slo-paar[data-s="r"][data-sl="' + w.sl + '"]').click(); });
    return a.typ;
  }, falsch);
  const lektion = async (opts = {}) => {
    let n = 0, weissNicht = 0;
    while (await p.evaluate(() => !!slo && !$('slo-lektion').hidden) && n++ < 90) {
      const typ = await p.evaluate(() => slo.liste[slo.i].typ);
      if (opts.weissNicht && !weissNicht && !['neu', 'tipp', 'paare'].includes(typ)) {
        weissNicht = 1;
        await p.click('#sloWeissNicht'); await p.waitForTimeout(150);
        await p.screenshot({ path: ordner + '/slo-weissnicht.png' });
        pruefe('„Ich weiß es nicht“ zeigt Lösung und kommt wieder', await p.evaluate(() => slo.zustand === 'weiter' && /so sagt man das/.test($('sloUrteil').innerText) && slo.liste.length > slo.i + 1 && slo.liste[slo.liste.length - 1].nochmal));
        await p.click('#sloPruefen'); continue;
      }
      if (opts.srFehler && typ === 'sprechen') {
        await p.evaluate((e) => { window.__srFehler = e; $('sloMikro').click(); }, opts.srFehler); await p.waitForTimeout(300);
        pruefe('Fehler „' + opts.srFehler + '“ → Aufnehmen statt Erkennung', await p.evaluate(() => !!$('sloAufnahme') && /stattdessen auf/.test($('sloSprechBox').innerText)));
        await p.click('#sloAufnahme');
        await p.waitForFunction(() => slo.zustand === 'weiter' || /\S/.test(($('sloAufUrteil') || {}).textContent || ''), null, { timeout: 15000 });
        await p.screenshot({ path: ordner + '/slo-aufnahme.png' });
        pruefe('Aufnahme stoppt selbst und lässt durch (ohne Nachfrage)', await p.evaluate(() => slo.zustand === 'weiter' && /gut/.test($('sloFuss').className) && /Silben/.test($('sloUrteil').innerText)), await p.evaluate(() => ($('sloAufUrteil') || {}).textContent || $('sloUrteil').innerText));
        await p.click('#sloPruefen');
        await p.evaluate(() => { window.__srFehler = null; });
        pruefe('Nächste Sprech-Aufgabe nimmt direkt auf', await p.evaluate(() => sloStore().srKaputt === true && sloSprechenMoeglich()));
        opts.srFehler = null; continue;
      }
      if (opts.nichtHoeren && (typ === 'hoeren' || typ === 'diktat')) {
        await p.click('[data-nicht="hoeren"]'); await p.waitForTimeout(150);
        pruefe('„Ich kann gerade nicht hören“ überspringt alle Hör-Aufgaben', await p.evaluate(() => !sloTonDa() && !slo.liste.slice(slo.i).some((x) => x.typ === 'hoeren' || x.typ === 'diktat')));
        opts.nichtHoeren = false; continue;
      }
      await loese(false);
      if (typ === 'sprechen') await p.waitForTimeout(250); else await p.evaluate(() => $('sloPruefen').click());
      if (await p.evaluate(() => slo && slo.zustand === 'weiter')) await p.evaluate(() => $('sloPruefen').click());
      await p.waitForTimeout(40);
    }
    await p.waitForTimeout(300);
    const ende = await p.evaluate(() => !$('slo-ende').hidden);
    await p.screenshot({ path: ordner + '/slo-ende.png' });
    await p.evaluate(() => { if ($('sloEndeWeiter')) $('sloEndeWeiter').click(); });
    return ende;
  };
  pruefe('Stufe 1 mit „Ich weiß es nicht“', await (async () => { await p.evaluate(() => sloStart(SLO_EINHEITEN[0])); return lektion({ weissNicht: true }); })());
  pruefe('Stufe 2 mit Sprech-Fehler', await (async () => { await p.evaluate(() => sloStart(SLO_EINHEITEN[0])); return lektion({ srFehler: 'service-not-allowed' }); })());
  await p.evaluate(() => sloMikroCheck()); await p.waitForTimeout(600);
  await p.screenshot({ path: ordner + '/slo-check.png' });
  pruefe('Mikrofon-Check zeigt Ergebnis', await p.evaluate(() => /Mikrofon/.test($('skDlg').innerText) && /service-not-allowed/.test($('skDlg').innerText)));
  await p.evaluate(() => { $('skDlg').close(); const st = sloStore(); delete st.sprechenAus; saveJson(SLO_KEY, st); });
  pruefe('Stufe 3 mit „nicht hören“', await (async () => { await p.evaluate(() => sloStart(SLO_EINHEITEN[0])); return lektion({ nichtHoeren: true }); })());
  await p.evaluate(() => sloKarte()); await p.waitForTimeout(300);
  pruefe('Schalter „Hör-Aufgaben wieder einschalten“', await p.evaluate(() => !!document.querySelector('[data-an="hoerenAus"]')));
  await p.click('[data-an="hoerenAus"]'); await p.waitForTimeout(100);
  pruefe('… und wieder an', await p.evaluate(() => sloTonDa()));
  pruefe('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(ok + ' bestanden, ' + fail + ' fehlgeschlagen');
  await b.close(); process.exit(fail ? 1 : 0);
})();
