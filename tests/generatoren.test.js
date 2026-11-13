// Generator-Tests der Spielekiste. Läuft im Browser (Playwright) gegen die echte App, damit genau der ausgelieferte Code geprüft wird.
// Aufruf:  python3 -m http.server 8765  (im Projektordner)  und dann  node tests/generatoren.test.js [Fälle je Generator]
// Ergebnis: Tabelle auf der Konsole und tests/ergebnis.json
const { chromium } = require('playwright');
const fs = require('fs');
const N = Number(process.argv[2]) || 1000;

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  await ctx.addInitScript(() => { localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'Test', avatar: '🧪', farbe: '#22c55e' }] })); });
  const p = await ctx.newPage();
  const fehler = [];
  p.on('pageerror', (e) => fehler.push(e.message));
  await p.goto('http://localhost:8765/');
  await p.waitForTimeout(1200);

  const tests = {
    // 🔎 Tatort (Mörder-Sudoku): genau eine Lösung, ohne Raten lösbar, Opferraum mit genau einer weiteren Person
    'Krimi · Tatort': (i) => {
      const stufe = ['leicht', 'mittel', 'schwer'][i % 3];
      const f = erzeugeFall(stufe, zufallsGenerator('test-mord-' + i));
      if (!f) return 'kein Fall';
      if (loesungenZaehlen(f, f.hinweise, 3) !== 1) return 'nicht eindeutig';
      if (!logikLoesen(f, f.hinweise).geloest) return 'nur mit Raten lösbar';
      const opferRaum = f.raum[f.loesung[f.n - 1]];
      if (f.loesung.filter((z) => f.raum[z] === opferRaum).length !== 2) return 'Opferraum falsch belegt';
      if (f.raum[f.loesung[f.moerder]] !== opferRaum) return 'Mörder nicht im Opferraum';
      return { stufe, ziel: KRIMI_ZIEL[stufe](f.bewertung) };
    },
    // 🛡️ Wachen der Villa (Queens-Variante): eine Wache je Zeile, Spalte, Raum; keine berührt eine andere; eindeutig
    'Krimi · Wachen': (i) => {
      const stufe = ['leicht', 'mittel', 'schwer'][i % 3];
      const f = erzeugeWachen(stufe, zufallsGenerator('test-wachen-' + i));
      if (!f) return 'kein Fall';
      const n = f.n, L = f.loesung, zeilen = new Set(L.map((z) => Math.floor(z / n))), spalten = new Set(L.map((z) => z % n)), raeume = new Set(L.map((z) => f.raum[z]));
      if (L.length !== n || zeilen.size !== n || spalten.size !== n || raeume.size !== n) return 'Lösung verletzt Regeln';
      for (const a of L) for (const c of L) if (a !== c && Math.abs(Math.floor(a / n) - Math.floor(c / n)) <= 1 && Math.abs((a % n) - (c % n)) <= 1) return 'Wachen berühren sich';
      if (wachenZaehlen(n, f.raum, 3) !== 1) return 'nicht eindeutig';
      return { stufe, ziel: WACHEN_ZIEL[stufe](f.bewertung) };
    },
    // 📋 Alibi-Raster: die Hinweise lassen genau eine Zuordnung zu – und zwar die hinterlegte
    'Krimi · Alibi': (i) => {
      const stufe = ['leicht', 'mittel', 'schwer'][i % 3];
      const f = erzeugeAlibi(stufe, zufallsGenerator('test-alibi-' + i));
      if (!f) return 'kein Fall';
      const passend = alleZuordnungen(f.n, f.kats.length).filter((A) => f.hinweise.every((h) => h.f(A)));
      if (passend.length !== 1) return passend.length + ' Lösungen';
      if (JSON.stringify(passend[0]) !== JSON.stringify(f.loesung)) return 'falsche Lösung hinterlegt';
      return { stufe };
    },
    // 🗣️ Verhör: genau ein Täter mit genau einer Lügner-Menge
    'Krimi · Verhör': (i) => {
      const stufe = Object.keys(VERHOER_STUFEN)[i % Object.keys(VERHOER_STUFEN).length];
      const f = erzeugeVerhoer(stufe, zufallsGenerator('test-verhoer-' + i));
      if (!f) return 'kein Fall';
      const l = verhoerLoesungen(f);
      if (new Set(l.map((x) => x.m)).size !== 1) return 'Täter nicht eindeutig (' + l.length + ')';
      return { stufe };
    },
    // 🐟 Piranha: Level entsteht, die Spieler-Simulation löst es mit den erlaubten Buchten
    'Piranha · Level': (i) => {
      const nr = 1 + (i % 25);
      const L = prErzeugen('test-' + i, nr);
      if (!L) return 'kein Level';
      const s = prSimulation(L.farbe, L.hoehlen, L.buchten, L.steine);
      if (!s.ok) return 'nicht lösbar';
      if (L.fische !== PB * PB) return 'Fischzahl ≠ Pixelzahl';
      return { stufe: nr <= 2 ? 'L1–2' : nr <= 8 ? 'L3–8' : 'L9+' };
    },
    // 🐉 Slowenisch: jede Aufgabe hat Inhalt, Auswahl enthält die richtige Antwort genau einmal
    'Slowenisch · Lektionen': (i) => {
      const u = SLO_EINHEITEN[i % SLO_EINHEITEN.length], stufe = 1 + (i % 3);
      const L = sloLektion(u, stufe);
      if (!L.length) return 'leer';
      for (const a of L) {
        if (!SLO_RENDER[a.typ]) return 'unbekannter Typ ' + a.typ;
        if (['bild', 'slde', 'desl', 'hoeren', 'neu', 'tippen'].includes(a.typ) && !a.w) return a.typ + ' ohne Wort';
        if (['satzwahl', 'bauen', 'luecke', 'diktat'].includes(a.typ) && !a.s) return a.typ + ' ohne Satz';
        if (a.typ === 'paare' && (a.liste.length < 3 || new Set(a.liste.map((w) => w.sl)).size !== a.liste.length)) return 'Paare doppelt';
        if (a.typ === 'desl') { const opt = [a.w, ...sloAndere(sloPool(a.w), a.w, 3, 'sl')]; if (new Set(opt.map((o) => sloNorm(o.sl))).size !== opt.length) return 'Auswahl doppelt'; }
      }
      return { stufe: 'Stufe ' + stufe };
    },
    // 📅 Tagesmodi: gleicher Seed → exakt gleiche Aufgaben, anderer Tag → andere Aufgaben
    'Tagesmodi · Reproduzierbarkeit': (i) => {
      const tag = new Date(Date.UTC(2026, 0, 1) + i * 864e5).toISOString().slice(0, 10);
      const gen = [
        ['Augenmaß', (s) => agRunden(s, 'mittel')], ['Zufall', (s) => zfRunden(s, 'mittel')], ['Punktwolke', (s) => pwRunden(s, 'mix', 'mittel')],
        ['Karte', (s) => ktRunden(s, 'mix', 'mittel')], ['Takt', (s) => taktRunden(s, 'mix', 'mittel')], ['Funktion', (s) => fdRunden(s, 'mix', 'mittel')],
        ['Farben', (s) => farbenAus(s)], ['Töne', (s) => toeneAus(s)], ['Riff', (s) => riffAufbau(s)],
      ];
      const roh = (x) => JSON.stringify(x, (k, v) => (typeof v === 'function' ? String(v) : v));
      for (const [name, g] of gen) {
        const a = roh(g('tag-' + tag)), b2 = roh(g('tag-' + tag)), c = roh(g('tag-' + tag + '-x'));
        if (a !== b2) return name + ': gleicher Seed, andere Aufgabe';
        if (a === c) return name + ': anderer Seed, gleiche Aufgabe';
      }
      return { stufe: 'alle' };
    },
    // 🎲 Zufallsgenerator: Gleichverteilung (Chi-Quadrat über 10 Klassen, 20 000 Würfe)
    'Zufallsgenerator · Verteilung': (i) => {
      const r = zufallsGenerator('vert-' + i), k = Array(10).fill(0), n = 20000;
      for (let j = 0; j < n; j++) { const v = r(); if (v < 0 || v >= 1) return 'Wert außerhalb [0,1)'; k[Math.floor(v * 10)]++; }
      const chi = k.reduce((a, x) => a + (x - n / 10) ** 2 / (n / 10), 0);
      // 9 Freiheitsgrade: 99,9 %-Schranke ≈ 27,9
      if (chi > 27.9) return 'Chi² ' + chi.toFixed(1);
      return { stufe: 'chi', chi };
    },
  };

  const auswertung = {};
  for (const name of Object.keys(tests)) {
    const anzahl = name.startsWith('Piranha') ? Math.min(N, 1000) : N;
    const r = await p.evaluate(({ name, quelle, anzahl }) => {
      const test = eval('(' + quelle + ')');
      const out = { faelle: 0, fehler: 0, beispiele: [], ms: 0, max: 0, stufen: {}, zielVerfehlt: 0, chi: [] };
      for (let i = 0; i < anzahl; i++) {
        const t0 = performance.now();
        let erg;
        try { erg = test(i); } catch (e) { erg = 'Ausnahme: ' + e.message; }
        const dt = performance.now() - t0;
        out.faelle++; out.ms += dt; out.max = Math.max(out.max, dt);
        if (typeof erg === 'string') { out.fehler++; if (out.beispiele.length < 5) out.beispiele.push('#' + i + ' ' + erg); continue; }
        out.stufen[erg.stufe] = (out.stufen[erg.stufe] || 0) + 1;
        if (erg.ziel === false) out.zielVerfehlt++;
        if (erg.chi) out.chi.push(erg.chi);
      }
      out.ms = out.ms / out.faelle;
      if (out.chi.length) out.chiSchnitt = out.chi.reduce((a, b) => a + b, 0) / out.chi.length;
      delete out.chi;
      return out;
    }, { name, quelle: tests[name].toString(), anzahl });
    auswertung[name] = r;
    console.log(name.padEnd(32), String(r.faelle).padStart(5), 'Fälle', String(r.fehler).padStart(4), 'Fehler', (r.fehler / r.faelle * 100).toFixed(2).padStart(6) + ' %',
      r.ms.toFixed(1).padStart(8) + ' ms Ø', r.max.toFixed(0).padStart(6) + ' ms max', r.zielVerfehlt ? '· Stufenziel verfehlt: ' + r.zielVerfehlt : '', r.chiSchnitt ? '· Chi² Ø ' + r.chiSchnitt.toFixed(2) : '');
    r.beispiele.forEach((x) => console.log('   ↳', x));
  }
  fs.writeFileSync(__dirname + '/ergebnis.json', JSON.stringify({ datum: new Date().toISOString(), faelleJeGenerator: N, auswertung, seitenfehler: fehler }, null, 2));
  console.log('Seitenfehler:', fehler.length ? fehler : 'keine');
  await b.close();
})();
