// 🧬 Spielekiste 2.0 – die Schicht über allen Spielen:
//  • Fortschritt: Erfahrungspunkte und Level werden aus dem Verlauf berechnet (nichts Neues zu speichern, alte Stände zählen mit).
//    Wiederholungen bringen abnehmend wenig: pro Spiel und Tag zählen die ersten zwei Runden voll, dann 60 %, 35 %, 20 %, 10 %, danach nichts.
//  • Erfolge: spielübergreifend, aus Verlauf und den vorhandenen Spielständen (Krimi, Piranha, Slowenisch, Quiz-Abzeichen, Tierleben).
//  • Tagesaufgaben: Daily Brain, Daily Sense, Daily Chaos – für alle gleich (Seed = Datum in Europe/Berlin), gestartet werden die
//    vorhandenen Tagesmodi der Spiele. Erkannt wird ein Abschluss am Verlaufseintrag des Spiels.
//  • Fähigkeitenprofil: sieben Werte von 0 bis 100 nach einer offenen Formel (siehe skFaehigkeiten), kein Intelligenztest.
//  • Ergebnis-Karten als Bild, Vergleich mit anderen Profilen auf dem Gerät oder per Vergleichscode.
const SK_TAG_KEY = 'walquiz.taeglich.v1';
const SK_ERFOLG_KEY = 'walquiz.erfolge.v1';
const SK_EXP_KEY = 'walquiz.experiment.v1';

// ---------- Spiele: Start, Tagesmodus, Kategorie ----------
const SK_SPIELE = {
  farben: { name: 'Farb-Gedächtnis', emoji: '🎨', hub: 'hubFarben', tag: 'farbTagBtn', kat: 'sinne' },
  toene: { name: 'Ton-Gedächtnis', emoji: '🎧', hub: 'hubToene', tag: 'tonTagBtn', kat: 'sinne', ton: true },
  songs: { name: 'Song-Rätsel', emoji: '🎵', hub: 'hubSongs', kat: 'sinne', ton: true },
  takt: { name: 'Takt-Gefühl', emoji: '⏱️', hub: 'hubTakt', tag: 'taktTagBtn', kat: 'sinne', ton: true },
  augen: { name: 'Augenmaß', emoji: '📐', hub: 'hubAugen', tag: 'agTagBtn', kat: 'sinne' },
  funktion: { name: 'Funktions-Detektiv', emoji: '🕵️', hub: 'hubFunktion', tag: 'fdTagBtn', kat: 'denken' },
  zufall: { name: 'Zufalls-Gefühl', emoji: '🎲', hub: 'hubZufall', tag: 'zfTagBtn', kat: 'zahlen' },
  punkte: { name: 'Punktwolke', emoji: '📈', hub: 'hubPunkte', tag: 'pwTagBtn', kat: 'zahlen' },
  karte: { name: 'Karten-Gefühl', emoji: '🧭', hub: 'hubKarte', tag: 'ktTagBtn', kat: 'zahlen' },
  piranha: { name: 'Piranha-Schwarm', emoji: '🐟', hub: 'hubPiranha', tag: 'prTagBtn', kat: 'denken' },
  riff: { name: 'Riffbau', emoji: '🪸', hub: 'hubRiff', tag: 'rfTagBtn', kat: 'denken' },
  tiefgang: { name: 'Tiefgang', emoji: '🤿', hub: 'hubTiefgang', tag: 'tgTagBtn', kat: 'zahlen' },
  krimi: { name: 'Wer war’s?', emoji: '🔎', hub: 'hubKrimi', kat: 'denken' },
  klassiker: { name: 'Klassiker', emoji: '🃏', hub: 'hubKlassiker', kat: 'denken' },
  falten: { name: 'Falten bis zum Mars', emoji: '📄', hub: 'hubFalten', kat: 'zahlen' },
  zoom: { name: 'Zoom durchs Universum', emoji: '🔭', hub: 'hubZoom', kat: 'zahlen' },
  glas: { name: 'Verdopplung im Glas', emoji: '🦠', hub: 'hubGlas', kat: 'zahlen' },
  beat: { name: 'Beat-Bahnen', emoji: '🎸', hub: 'hubBeat', kat: 'sinne', ton: true },
};
const SK_KRIMI = { mord: { name: 'Tatort', emoji: '🔎' }, wachen: { name: 'Wachen der Villa', emoji: '🛡️' }, alibi: { name: 'Alibi-Raster', emoji: '📋' }, verhoer: { name: 'Verhör', emoji: '🗣️' } };
const SK_KATEGORIEN = [
  { id: 'original', name: 'Das Original', emoji: '🐋', karten: ['hubQuizzes'] },
  { id: 'denken', name: 'Denken & Logik', emoji: '🧠', karten: ['hubKrimi', 'hubKlassiker', 'hubPiranha', 'hubFunktion', 'hubRiff'] },
  { id: 'sinne', name: 'Sinne & Wahrnehmung', emoji: '👁️', karten: ['hubFarben', 'hubToene', 'hubSongs', 'hubBeat', 'hubTakt', 'hubAugen'] },
  { id: 'zahlen', name: 'Zahlen & Welt', emoji: '🔢', karten: ['hubPunkte', 'hubZufall', 'hubKarte', 'hubTiefgang', 'hubZahlen', 'hubFalten', 'hubZoom', 'hubGlas'] },
  { id: 'wissen', name: 'Wissen & Sprache', emoji: '📚', karten: ['hubCello', 'hubSlo'] },
  { id: 'perspektive', name: 'Perspektivwechsel', emoji: '🪞', karten: ['hubTierleben', 'hubDopamin'] },
];

// ---------- Verlauf lesen: jeder Eintrag bekommt Leistung q (0–1) und Schwierigkeit d ----------
const skKlemm = (v, a, b) => Math.max(a, Math.min(b, v));
function skSchwierigkeit(e) {
  const st = e.x && e.x.stufe, t = (st || '') + ' ' + (e.i || '');
  if (e.s === 'piranha') { const m = /Level (\d+)/.exec(e.i || ''); return m ? skKlemm(0.8 + Number(m[1]) * 0.03, 0.8, 1.15) : 1; }
  if (e.s === 'slo') return /Stufe 3/.test(t) ? 1.1 : /Stufe 1/.test(t) ? 0.85 : 1;
  if (/schwer|Profi|Experte|Gold|Königsklasse/i.test(t)) return 1.15;
  if (/leicht|Anfänger|Seepferdchen|Bronze|Einsteiger/i.test(t)) return 0.8;
  return 1;
}
// Leistung einer Runde: Punkte/Höchstpunkte; Krimi: Tempo im Verhältnis zur Stufe, Hinweise kosten
function skLeistung(e) {
  if (e.s === 'krimi') {
    let sek = e.x && e.x.sek;
    if (!sek) { const m = /(\d+):(\d\d)\s*$/.exec(e.i || ''); if (m) sek = Number(m[1]) * 60 + Number(m[2]); }
    if (!sek) return 0.8;
    const ref = { leicht: 150, mittel: 300, schwer: 540 }[(e.x && e.x.stufe) || 'mittel'];
    return skKlemm(1.25 - sek / (2 * ref) - 0.12 * ((e.x && e.x.hilfen) || 0), 0.2, 1);
  }
  if (e.m > 0) return skKlemm(e.p / e.m, 0, 1);
  return null;   // ohne Maßstab (Riff, Tiefgang, Tierleben): zählt für XP, nicht für Fähigkeiten
}
function skEintraege(verlauf) {
  const tage = (verlauf && verlauf.tage) || {};
  return Object.entries(tage).flatMap(([t, l]) => l.map((e) => ({ ...e, t, q: skLeistung(e), d: skSchwierigkeit(e) }))).sort((a, b) => (a.z || 0) - (b.z || 0));
}

// ---------- Erfahrungspunkte und Level ----------
const SK_WIEDERHOLUNG = [1, 1, 0.6, 0.35, 0.2, 0.1];
function skXP(E, tagesSt, expSt, erfolgSt) {
  const proTag = {};
  let spiele = 0;
  E.forEach((e) => {
    const k = e.t + '|' + e.s, n = (proTag[k] = (proTag[k] || 0) + 1) - 1;
    const f = SK_WIEDERHOLUNG[n] || 0;
    spiele += Math.round((10 + 20 * (e.q == null ? 0.6 : e.q) * e.d) * f);
  });
  let taeglich = 0;
  Object.values((tagesSt && tagesSt.tage) || {}).forEach((t) => { const n = ['brain', 'sense', 'chaos'].filter((s) => t[s]).length; taeglich += n * 40 + (n === 3 ? 40 : 0); });
  const experimente = Object.keys((expSt && expSt.fertig) || {}).length * 40;
  const erfolge = Object.keys(erfolgSt || {}).reduce((a, id) => a + ((SK_ERFOLGE.find((x) => x.id === id) || {}).xp || 0), 0);
  return { gesamt: spiele + taeglich + experimente + erfolge, spiele, taeglich, experimente, erfolge };
}
const skXpFuerLevel = (L) => 50 * (L - 1) * (L + 2);
function skLevel(xp) {
  let L = 1;
  while (skXpFuerLevel(L + 1) <= xp) L++;
  const von = skXpFuerLevel(L), bis = skXpFuerLevel(L + 1);
  return { level: L, von, bis, anteil: (xp - von) / (bis - von), titel: skTitel(L) };
}
const SK_TITEL = [[1, 'Frischling'], [3, 'Knobelfuchs'], [5, 'Spürnase'], [8, 'Querkopf'], [12, 'Laborratte'], [16, 'Wundertüte'], [20, 'Universalgenie']];
const skTitel = (L) => SK_TITEL.filter(([l]) => L >= l).pop()[1];

// ---------- Fähigkeiten ----------
// Gewicht, mit dem ein Spiel in eine Fähigkeit eingeht
const SK_FAEHIGKEITEN = [
  { id: 'logik', name: 'Logisches Denken', kurz: 'Logik', emoji: '🧠', titel: 'Kopfnuss-Knacker', spiele: { krimi: 1, piranha: 0.6, klassiker: 0.6, funktion: 0.5 } },
  { id: 'gehoer', name: 'Musikalisches Gehör', kurz: 'Gehör', emoji: '🎵', titel: 'Goldohr', spiele: { toene: 1, songs: 0.8, cello: 0.6, takt: 0.5, beat: 0.4 } },
  { id: 'visuell', name: 'Visuelle Wahrnehmung', kurz: 'Sehen', emoji: '👁️', titel: 'Adlerauge', spiele: { farben: 1, augen: 0.6, punkte: 0.5 } },
  { id: 'raum', name: 'Räumliches Denken', kurz: 'Raum', emoji: '📐', titel: 'Kartenkopf', spiele: { karte: 1, augen: 0.8, piranha: 0.4, zoom: 0.6 } },
  { id: 'zahlen', name: 'Zahlenverständnis', kurz: 'Zahlen', emoji: '🔢', titel: 'Zahlenflüsterer', spiele: { zufall: 1, funktion: 0.8, punkte: 0.7, falten: 0.6, glas: 0.7 } },
  { id: 'reaktion', name: 'Reaktion & Timing', kurz: 'Timing', emoji: '⚡', titel: 'Taktgeber', spiele: { takt: 1, beat: 0.9 } },
  { id: 'gedaechtnis', name: 'Gedächtnis', kurz: 'Gedächtnis', emoji: '🧩', titel: 'Elefantengedächtnis', spiele: { farben: 0.8, slo: 0.8, quiz: 0.7, toene: 0.6, cello: 0.4 } },
];
// Je Spiel: die letzten 30 Runden; Wert = Durchschnitt der besseren 60 % (Runde × Schwierigkeit, höchstens 1).
// Leichte Stufen zählen ×0,8 – mit Leichtem allein kommt man nie über 80. Erfahrung: höchstens 3 Runden pro Tag zählen.
function skSpielWert(E, spiel) {
  const l = E.filter((e) => e.s === spiel && e.q != null).slice(-30);
  if (!l.length) return null;
  const werte = l.map((e) => Math.min(1, e.q * e.d)).sort((a, b) => b - a);
  const top = werte.slice(0, Math.max(1, Math.ceil(werte.length * 0.6)));
  const proTag = {};
  l.forEach((e) => { proTag[e.t] = Math.min(3, (proTag[e.t] || 0) + 1); });
  const n = Object.values(proTag).reduce((a, b) => a + b, 0);
  return { wert: top.reduce((a, b) => a + b, 0) / top.length, n, runden: l.length };
}
function skFaehigkeiten(E) {
  const cache = {};
  const sw = (s) => (s in cache ? cache[s] : (cache[s] = skSpielWert(E, s)));
  return SK_FAEHIGKEITEN.map((f) => {
    let z = 0, nn = 0, N = 0;
    const teile = [];
    Object.entries(f.spiele).forEach(([s, w]) => {
      const g = sw(s);
      if (!g) return;
      const c = 1 - Math.exp(-g.n / 4);
      z += w * c * g.wert; nn += w * c; N += w * g.n;
      teile.push({ spiel: s, gewicht: w, wert: Math.round(g.wert * 100), runden: g.runden });
    });
    if (!nn) return { ...f, wert: null, teile };
    const leistung = z / nn, erfahrung = 1 - Math.exp(-N / 10);
    return { ...f, wert: Math.round(100 * leistung * (0.5 + 0.5 * erfahrung)), leistung: Math.round(leistung * 100), erfahrung: Math.round(erfahrung * 100), teile };
  });
}

// ---------- Daten eines Profils bündeln ----------
function skDaten(quelle) {
  const L = (k) => (quelle ? quelle[k] || {} : loadJson(k));
  const E = skEintraege(L(VERLAUF_KEY));
  const tagesSt = L(SK_TAG_KEY), expSt = L(SK_EXP_KEY), erfolgSt = L(SK_ERFOLG_KEY);
  return { E, tagesSt, expSt, erfolgSt, krimi: L(KRIMI_KEY), piranha: L('walquiz.piranha.v1'), slo: L('walquiz.slo.v1'), quiz: L(STORE_KEY), tierleben: L('walquiz.tierleben.v1'), skills: skFaehigkeiten(E) };
}

// ---------- Erfolge (spielübergreifend, inklusive vorhandener Abzeichen) ----------
function skKrimiGeloest(st, nurSchwer) {
  const zaehl = (g) => Object.entries(g || {}).reduce((a, [s, n]) => a + (!nurSchwer || s !== 'leicht' ? n : 0), 0);
  return zaehl(st.geloest) + Object.values(st.modi || {}).reduce((a, m) => a + zaehl(m.geloest), 0);
}
const SK_ERFOLGE = [
  { id: 'detektiv', emoji: '🕵️', name: 'Meisterdetektiv', text: 'Löse zehn Krimirätsel auf „Mittel“ oder „Schwer“.', xp: 100, f: (D) => [skKrimiGeloest(D.krimi, true), 10] },
  { id: 'gehoer', emoji: '👂', name: 'Absolutes Gehör?', text: 'Schaffe dreimal mindestens 45 von 50 Punkten im Ton-Gedächtnis.', xp: 100, f: (D) => [D.E.filter((e) => e.s === 'toene' && e.p >= 45).length, 3] },
  { id: 'universal', emoji: '🌐', name: 'Universalgenie', text: 'Erreiche in fünf verschiedenen Fähigkeiten mindestens 50.', xp: 150, f: (D) => [D.skills.filter((s) => s.wert >= 50).length, 5] },
  { id: 'experiment', emoji: '🧪', name: 'Experimentierfreudig', text: 'Schließe fünf verschiedene Experimente ab.', xp: 100, f: (D) => [Object.keys(D.expSt.fertig || {}).length, 5] },
  { id: 'perfekt', emoji: '☀️', name: 'Perfekter Tag', text: 'Schaffe an einem Tag alle drei Tagesaufgaben.', xp: 50, f: (D) => [Object.values(D.tagesSt.tage || {}).some((t) => t.brain && t.sense && t.chaos) ? 1 : 0, 1] },
  { id: 'serie', emoji: '🔥', name: 'Sieben auf einen Streich', text: 'Mach sieben Tage hintereinander mindestens eine Tagesaufgabe.', xp: 100, f: (D) => [skTagesSerie(D.tagesSt).laengste, 7] },
  { id: 'bummler', emoji: '🧳', name: 'Weltenbummler', text: 'Spiele zehn verschiedene Spiele.', xp: 60, f: (D) => [new Set(D.E.map((e) => e.s)).size, 10] },
  { id: 'piranha', emoji: '🐟', name: 'Schwarmflüsterer', text: 'Sammle 30 Sterne im Piranha-Schwarm.', xp: 60, f: (D) => [Object.values(D.piranha.sterne || {}).reduce((a, b) => a + b, 0), 30] },
  { id: 'zmajcek', emoji: '🐉', name: 'Zmajčeks Freund', text: 'Meistere fünf Stationen in Slowenisch.', xp: 80, f: (D) => [Object.values(D.slo.stufe || {}).filter((x) => x >= 3).length, 5] },
  { id: 'abzeichen', emoji: '🏅', name: 'Abzeichen-Sammler', text: 'Verdiene fünf Abzeichen in den Quizzes.', xp: 60, f: (D) => [Object.values(D.quiz.badges || {}).filter(Boolean).length, 5] },
  { id: 'perspektive', emoji: '🪞', name: 'Perspektivwechsel', text: 'Lebe fünf verschiedene Tierleben.', xp: 60, f: (D) => [new Set((D.tierleben.leben || []).map((l) => l.id || l.tier || l.name)).size, 5] },
  { id: 'rekord', emoji: '⏱️', name: 'Gegen die Uhr', text: 'Stelle drei neue Krimi-Bestzeiten ohne Hinweise auf.', xp: 60, f: (D) => [D.E.filter((e) => e.s === 'krimi' && e.x && e.x.rekord).length, 3] },
];
function skErfolgeStand(D) {
  return SK_ERFOLGE.map((a) => { const [ist, ziel] = a.f(D); return { ...a, ist: Math.min(ist, ziel), ziel, fertig: ist >= ziel, datum: (D.erfolgSt || {})[a.id] }; });
}
// neue Erfolge festhalten und melden
function skErfolgePruefen(melden = true) {
  const D = skDaten(), st = loadJson(SK_ERFOLG_KEY);
  const neu = skErfolgeStand(D).filter((a) => a.fertig && !st[a.id]);
  if (!neu.length) return [];
  neu.forEach((a) => { st[a.id] = skDatum(); });
  saveJson(SK_ERFOLG_KEY, st);
  if (melden) neu.forEach((a, i) => setTimeout(() => skToast(a.emoji + ' <b>Erfolg: ' + a.name + '</b><br><small>' + a.text + ' · +' + a.xp + ' XP</small>'), 400 + i * 2600));
  return neu;
}

// ---------- Tagesaufgaben ----------
const SK_POOL = {
  brain: [{ spiel: 'krimi', modus: 'mord' }, { spiel: 'krimi', modus: 'wachen' }, { spiel: 'krimi', modus: 'alibi' }, { spiel: 'krimi', modus: 'verhoer' }, { spiel: 'funktion' }, { spiel: 'piranha' }],
  sense: [{ spiel: 'farben' }, { spiel: 'toene' }, { spiel: 'augen' }, { spiel: 'takt' }],
  chaos: [{ spiel: 'karte' }, { spiel: 'punkte' }, { spiel: 'riff' }, { spiel: 'tiefgang' }, { spiel: 'zufall' }, { spiel: 'piranha' }, { spiel: 'krimi', modus: 'verhoer' }, { spiel: 'funktion' }],
};
const SK_SLOTS = [
  { id: 'brain', name: 'Daily Brain', emoji: '🧠', text: 'Eine Denkaufgabe' },
  { id: 'sense', name: 'Daily Sense', emoji: '👁️', text: 'Eine Wahrnehmungsprobe' },
  { id: 'chaos', name: 'Daily Chaos', emoji: '🎲', text: 'Irgendetwas aus der Kiste' },
];
// Für einen Kalendertag (YYYY-MM-DD, Europe/Berlin) – für alle gleich, auch nach dem Neuladen
function skTagesAufgaben(datum = skDatum()) {
  const r = zufallsGenerator('sk-daily-' + datum);
  const wt = new Date(datum + 'T12:00:00Z').getUTCDay();
  const krimiStufe = wt === 1 ? 'leicht' : wt === 0 || wt >= 5 ? 'schwer' : 'mittel';
  const wahl = (l) => l[Math.floor(r() * l.length)];
  const brain = wahl(SK_POOL.brain), sense = wahl(SK_POOL.sense);
  const chaos = wahl(SK_POOL.chaos.filter((c) => c.spiel !== brain.spiel));
  return { datum, brain: { ...brain, stufe: krimiStufe }, sense, chaos: { ...chaos, stufe: krimiStufe } };
}
const skAufgabeName = (a) => (a.spiel === 'krimi' ? SK_KRIMI[a.modus].name : SK_SPIELE[a.spiel].name);
const skAufgabeEmoji = (a) => (a.spiel === 'krimi' ? SK_KRIMI[a.modus].emoji : SK_SPIELE[a.spiel].emoji);
function skAufgabeStarten(slot) {
  const a = skTagesAufgaben()[slot], sp = SK_SPIELE[a.spiel];
  const st = loadJson(SK_TAG_KEY); st.gestartet = { slot, datum: skDatum() }; saveJson(SK_TAG_KEY, st);
  if (sp.ton && typeof audio === 'function') audio();   // Ton muss im Klick entsperrt werden
  $(sp.hub).click();
  const bis = Date.now() + 4000;
  const warte = () => {
    if (Date.now() > bis) return;
    if (a.spiel === 'krimi') {
      if (!$('screen-krimi').classList.contains('active') || typeof krimiSetup !== 'function') { setTimeout(warte, 80); return; }
      krimiSetup(a.modus); krimiLos(a.modus, a.stufe, true); return;
    }
    const b = $(sp.tag);
    if (b && b.offsetParent) b.click(); else setTimeout(warte, 80);
  };
  setTimeout(warte, 120);
}
// Wird nach jedem Verlaufseintrag aufgerufen (verlauf.js)
function skNachSpiel(spiel, punkte, max, info, extra) {
  const A = skTagesAufgaben(), st = loadJson(SK_TAG_KEY);
  st.tage = st.tage || {};
  const heuteSt = (st.tage[A.datum] = st.tage[A.datum] || {});
  SK_SLOTS.forEach((s) => {
    const a = A[s.id];
    if (heuteSt[s.id] || a.spiel !== spiel) return;
    const passt = spiel === 'krimi' ? extra && extra.tag && extra.modus === a.modus && extra.stufe === a.stufe : /Tages/.test(info || '');
    if (!passt) return;
    heuteSt[s.id] = { p: punkte, m: max, i: info, x: extra || null, z: Date.now() };
    st.neu = { slot: s.id, datum: A.datum };
    setTimeout(() => skToast(s.emoji + ' <b>' + s.name + ' geschafft!</b><br><small>' + skAufgabeName(a) + ' · ' + skErgebnisText(heuteSt[s.id]) + '</small>', () => skKarteZeigen(skKarteTagesaufgabe(s.id, A.datum))), 900);
  });
  saveJson(SK_TAG_KEY, st);
  if (typeof labNachSpiel === 'function') labNachSpiel(spiel);
  setTimeout(() => skErfolgePruefen(true), 1500);
}
const skErgebnisText = (r) => (r.x && r.x.sek ? zeitText(r.x.sek) + (r.x.hilfen ? ' · ' + r.x.hilfen + ' Hinweise' : ' · ohne Hinweise') : r.m ? fmt(r.p) + ' / ' + r.m : fmt(r.p) + ' Punkte');
function skTagesSerie(st) {
  const tage = (st && st.tage) || {};
  const hat = (d) => { const t = tage[skDatum(d)]; return t && (t.brain || t.sense || t.chaos); };
  let serie = 0; const d = new Date();
  if (!hat(d)) d.setTime(d.getTime() - 864e5);
  while (hat(d)) { serie++; d.setTime(d.getTime() - 864e5); }
  let laengste = 0, lauf = 0, vorher = null;
  Object.keys(tage).filter((k) => { const t = tage[k]; return t.brain || t.sense || t.chaos; }).sort().forEach((k) => {
    const dt = new Date(k + 'T12:00:00Z');
    lauf = vorher && Math.round((dt - vorher) / 864e5) === 1 ? lauf + 1 : 1; laengste = Math.max(laengste, lauf); vorher = dt;
  });
  const perfekt = Object.values(tage).filter((t) => t.brain && t.sense && t.chaos).length;
  return { serie, laengste, perfekt };
}
function skTeilenText(datum = skDatum()) {
  const A = skTagesAufgaben(datum), t = (loadJson(SK_TAG_KEY).tage || {})[datum] || {};
  const d = datum.split('-').reverse().slice(0, 2).join('.') + '.';
  return 'SPIELEKISTE · Tagesaufgaben ' + d + '\n' + SK_SLOTS.map((s) => s.emoji + ' ' + skAufgabeName(A[s.id]) + ' ' + (t[s.id] ? '✅ ' + skErgebnisText(t[s.id]) : '⬜')).join('\n') + '\n' + location.origin + location.pathname;
}

// ---------- Ergebnis-Karte als Bild ----------
// karte: { titel, emoji, zeilen: [[Bezeichnung, Wert]], hinweis, farbe, datum }
function skKarteZeichnen(k) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), farbe = k.farbe || '#f59e0b', schrift = '"Outfit", system-ui, sans-serif';
  x.fillStyle = '#141210'; x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W * 0.8, 0, 50, W * 0.8, 0, W);
  g.addColorStop(0, farbe + '55'); g.addColorStop(1, 'rgba(20,18,16,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  // Rahmen wie eine Spielkarte
  x.strokeStyle = farbe; x.lineWidth = 6; x.beginPath(); x.roundRect(48, 48, W - 96, H - 96, 48); x.stroke();
  x.fillStyle = '#f5ead6'; x.font = '800 44px ' + schrift; x.textAlign = 'left'; x.fillText('SPIELEKISTE', 110, 150);
  x.fillStyle = farbe; x.fillRect(110, 172, 120, 8);
  x.font = '220px ' + schrift; x.textAlign = 'center'; x.fillText(k.emoji || '🎮', W / 2, 470);
  x.fillStyle = '#ffffff'; x.font = '800 86px ' + schrift; x.fillText(k.titel.toUpperCase(), W / 2, 610, W - 200);
  x.textAlign = 'left';
  (k.zeilen || []).forEach(([a, b], i) => {
    const y = 740 + i * 100;
    x.fillStyle = '#b7aa95'; x.font = '600 46px ' + schrift; x.fillText(a, 130, y);
    x.fillStyle = '#ffffff'; x.font = '800 56px ' + schrift; x.textAlign = 'right'; x.fillText(b, W - 130, y); x.textAlign = 'left';
    x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(130, y + 28, W - 260, 3);
  });
  if (k.hinweis) {
    const y = 740 + (k.zeilen || []).length * 100 + 40;
    x.fillStyle = farbe + '33'; x.beginPath(); x.roundRect(110, y, W - 220, 110, 30); x.fill();
    x.fillStyle = '#fff3d6'; x.font = '800 52px ' + schrift; x.textAlign = 'center'; x.fillText(k.hinweis, W / 2, y + 72, W - 260); x.textAlign = 'left';
  }
  x.fillStyle = '#8f8270'; x.font = '600 38px ' + schrift; x.fillText((k.wer ? k.wer + ' · ' : '') + (k.datum || skDatum()).split('-').reverse().join('.'), 110, H - 110);
  x.textAlign = 'right'; x.font = '600 30px ' + schrift; x.fillText('Experimentierkasten', W - 110, H - 110);
  return c;
}
function skKarteTagesaufgabe(slot, datum) {
  const A = skTagesAufgaben(datum), a = A[slot], r = (((loadJson(SK_TAG_KEY).tage || {})[datum] || {})[slot]);
  const s = SK_SLOTS.find((q) => q.id === slot), zeilen = [];
  if (a.spiel === 'krimi') zeilen.push(['Schwierigkeit', { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' }[a.stufe]]);
  if (r) {
    if (r.x && r.x.sek) { zeilen.push(['Gelöst in', zeitText(r.x.sek)]); zeilen.push(['Hinweise', String(r.x.hilfen || 0)]); }
    else zeilen.push(['Ergebnis', r.m ? fmt(r.p) + ' / ' + r.m : fmt(r.p) + ' Punkte']);
  }
  zeilen.push([s.name, r ? '✓ geschafft' : 'offen']);
  return { titel: skAufgabeName(a), emoji: skAufgabeEmoji(a), zeilen, hinweis: r && r.x && r.x.rekord ? '🏆 Neuer persönlicher Rekord!' : skTagesSerie(loadJson(SK_TAG_KEY)).serie >= 2 ? '🔥 ' + skTagesSerie(loadJson(SK_TAG_KEY)).serie + ' Tage in Folge' : '', farbe: slot === 'brain' ? '#a78bfa' : slot === 'sense' ? '#22d3ee' : '#f59e0b', datum };
}
// Karte zu einem Verlaufseintrag (mit Rekord-Erkennung gegenüber allen früheren Runden dieses Spiels)
function skKarteEintrag(e) {
  const sp = VERLAUF_SPIELE[e.s] || { name: e.s, emoji: '🎮', farbe: '#f59e0b' };
  const E = skEintraege(loadJson(VERLAUF_KEY)), frueher = E.filter((f) => f.s === e.s && f.z < e.z && f.q != null);
  const rekord = (e.x && e.x.rekord) || (e.q != null && frueher.length >= 2 && frueher.every((f) => f.q < skLeistung(e)));
  const zeilen = [];
  if (e.i) zeilen.push(['Runde', e.i.split(' · ')[0].slice(0, 24)]);
  if (e.x && e.x.stufe) zeilen.push(['Schwierigkeit', { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' }[e.x.stufe] || e.x.stufe]);
  if (e.x && e.x.sek) { zeilen.push(['Gelöst in', zeitText(e.x.sek)]); zeilen.push(['Hinweise', String(e.x.hilfen || 0)]); }
  else zeilen.push(['Ergebnis', e.m ? fmt(e.p) + ' / ' + e.m : fmt(e.p) + (e.s === 'krimi' || e.s === 'tierleben' ? '' : ' Punkte')]);
  return { titel: sp.name, emoji: sp.emoji, zeilen, hinweis: rekord ? '🏆 Neuer persönlicher Rekord!' : '', farbe: sp.farbe, datum: e.t };
}
function skKarteZeigen(k) {
  const pr = typeof aktivesProfil === 'function' ? aktivesProfil() : null;
  if (pr && !k.wer) k.wer = pr.name;
  const c = skKarteZeichnen(k);
  const d = skDialog('<div class="sk-karte-vorschau"><img alt="Ergebnis-Karte: ' + k.titel + '" src="' + c.toDataURL('image/png') + '"></div>'
    + '<div class="sk-knopfreihe"><button type="button" class="btn" id="skKarteTeilen">📤 Teilen</button><button type="button" class="btn secondary" id="skKarteLaden">⬇️ Speichern</button></div>');
  const datei = () => new Promise((ok) => c.toBlob((b) => ok(new File([b], 'spielekiste-' + (k.datum || skDatum()) + '.png', { type: 'image/png' })), 'image/png'));
  d.querySelector('#skKarteTeilen').addEventListener('click', async () => {
    const f = await datei();
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: 'Spielekiste' }); } catch (e) { /* abgebrochen */ } }
    else skLaden(f);
  });
  d.querySelector('#skKarteLaden').addEventListener('click', async () => skLaden(await datei()));
}
function skLaden(f) { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

// ---------- Kleine Bausteine: Dialog, Hinweis ----------
function skDialog(html) {
  let d = $('skDlg');
  if (!d) {
    d = document.createElement('dialog'); d.id = 'skDlg'; d.className = 'sk-dlg';
    document.body.appendChild(d);
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('.sk-dlg-zu')) d.close(); });
  }
  d.innerHTML = '<div class="sk-dlg-in"><button type="button" class="sk-dlg-zu" aria-label="Schließen">×</button>' + html + '</div>';
  if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
  return d;
}
function skToast(html, klick) {
  const t = document.createElement('div');
  t.className = 'sk-toast'; t.innerHTML = html + (klick ? '<span class="sk-toast-mehr">Karte ansehen ›</span>' : ''); t.setAttribute('role', 'status');
  document.body.appendChild(t);
  if (klick) { t.style.cursor = 'pointer'; t.addEventListener('click', () => { t.remove(); klick(); }); }
  setTimeout(() => t.classList.add('weg'), 4200); setTimeout(() => t.remove(), 4800);
}

// ---------- Radar-Diagramm (SVG) ----------
function skRadar(reihen, opts = {}) {
  const N = SK_FAEHIGKEITEN.length, R = 100, cx = 150, cy = 140;
  const punkt = (i, v) => { const w = -Math.PI / 2 + (i * 2 * Math.PI) / N; return [cx + Math.cos(w) * R * v, cy + Math.sin(w) * R * v]; };
  let svg = '<svg class="sk-radar' + (opts.klein ? ' klein' : '') + '" viewBox="0 0 300 290" role="img" aria-label="Fähigkeitenprofil">';
  [0.25, 0.5, 0.75, 1].forEach((r) => { svg += '<polygon class="sk-r-netz" points="' + SK_FAEHIGKEITEN.map((_, i) => punkt(i, r).join(',')).join(' ') + '"/>'; });
  SK_FAEHIGKEITEN.forEach((f, i) => { const [x2, y2] = punkt(i, 1); svg += '<line class="sk-r-achse" x1="' + cx + '" y1="' + cy + '" x2="' + x2 + '" y2="' + y2 + '"/>'; });
  reihen.forEach((r, ri) => {
    const pts = r.werte.map((v, i) => punkt(i, Math.max(0.02, (v || 0) / 100)).join(',')).join(' ');
    svg += '<polygon class="sk-r-flaeche" style="--f:' + r.farbe + '" points="' + pts + '"/>';
    r.werte.forEach((v, i) => { if (v == null) return; const [px, py] = punkt(i, v / 100); svg += '<circle class="sk-r-punkt" style="--f:' + r.farbe + '" cx="' + px + '" cy="' + py + '" r="' + (ri ? 3 : 4) + '"/>'; });
  });
  if (!opts.klein) SK_FAEHIGKEITEN.forEach((f, i) => {
    const [lx, ly] = punkt(i, 1.24), v = reihen[0].werte[i];
    svg += '<g class="sk-r-label" data-f="' + f.id + '" tabindex="0" role="button" aria-label="' + f.name + ': ' + (v == null ? 'noch keine Daten' : v) + '"><text x="' + lx + '" y="' + (ly - 4) + '">' + f.emoji + ' ' + f.kurz + '</text><text class="sk-r-wert" x="' + lx + '" y="' + (ly + 12) + '">' + (v == null ? '–' : v) + '</text></g>';
  });
  return svg + '</svg>';
}
// Werte zu einem früheren Zeitpunkt (nur Einträge bis zu diesem Tag)
function skFaehigkeitenAm(E, datum) { return skFaehigkeiten(E.filter((e) => e.t <= datum)); }
const skVorTagen = (n) => skDatum(new Date(Date.now() - n * 864e5));

// ---------- Vergleich: andere Profile auf diesem Gerät oder per Code ----------
function skVergleichCode() {
  const pr = typeof aktivesProfil === 'function' ? aktivesProfil() : null, D = skDaten();
  const lv = skLevel(skXP(D.E, D.tagesSt, D.expSt, D.erfolgSt).gesamt).level;
  const daten = { v: 1, n: pr ? pr.name : 'Ich', a: pr ? pr.avatar : '🙂', l: lv, s: D.skills.map((s) => (s.wert == null ? -1 : s.wert)), d: skDatum() };
  return 'SK1.' + btoa(unescape(encodeURIComponent(JSON.stringify(daten))));
}
function skVergleichLesen(code) {
  try {
    const roh = String(code).trim().replace(/^SK1\./, '');
    const d = JSON.parse(decodeURIComponent(escape(atob(roh))));
    if (d.v !== 1 || !Array.isArray(d.s) || d.s.length !== SK_FAEHIGKEITEN.length) return null;
    return { name: String(d.n || 'Freund').slice(0, 24), avatar: String(d.a || '🙂').slice(0, 4), level: Number(d.l) || 1, werte: d.s.map((v) => (v < 0 ? null : skKlemm(Number(v) || 0, 0, 100))), datum: String(d.d || '').slice(0, 10) };
  } catch (e) { return null; }
}

// ---------- Profil-Seite ----------
let skVergleich = null;
function skProfilZeigen() {
  show('sk', '🧬 Dein Profil');
  skProfilZeichnen();
}
function skProfilZeichnen() {
  const D = skDaten(), xp = skXP(D.E, D.tagesSt, D.expSt, D.erfolgSt), lv = skLevel(xp.gesamt);
  const pr = typeof aktivesProfil === 'function' ? aktivesProfil() : null;
  const frueher = skFaehigkeitenAm(D.E, skVorTagen(30));
  const mit = D.skills.filter((s) => s.wert != null).sort((a, b) => b.wert - a.wert);
  const reihen = [{ werte: D.skills.map((s) => s.wert), farbe: '#f59e0b' }];
  if (skVergleich) reihen.push({ werte: skVergleich.werte, farbe: '#38bdf8' });
  else if (frueher.some((s) => s.wert != null)) reihen.push({ werte: frueher.map((s) => s.wert), farbe: 'rgba(255,255,255,.45)' });
  const serie = skTagesSerie(D.tagesSt), E7 = D.E.filter((e) => e.t > skVorTagen(7));
  const erfolge = skErfolgeStand(D);
  const andere = (typeof profile === 'function' ? profile().liste : []).filter((p) => !pr || p.id !== pr.id);
  $('skInhalt').innerHTML = '<div class="sk-kopfkarte">' + (pr ? '<span class="sk-ava" style="background:' + pr.farbe + '">' + pr.avatar + '</span>' : '')
    + '<div><b>' + (pr ? pr.name : 'Du') + '</b><span>Level ' + lv.level + ' · ' + lv.titel + (mit[0] && mit[0].wert >= 40 ? ' · ' + mit[0].titel : '') + '</span>'
    + '<div class="sk-xpbalken"><i style="width:' + Math.round(lv.anteil * 100) + '%"></i></div><small>' + fmt(xp.gesamt) + ' XP · noch ' + fmt(lv.bis - xp.gesamt) + ' bis Level ' + (lv.level + 1) + '</small></div></div>'
    + '<section class="sk-block"><h2>Fähigkeitenprofil</h2>'
    + '<div class="sk-legende"><span style="--f:#f59e0b">' + (pr ? pr.name : 'Du') + ' heute</span>' + (skVergleich ? '<span style="--f:#38bdf8">' + skVergleich.avatar + ' ' + skVergleich.name + ' (Level ' + skVergleich.level + ')</span>' : frueher.some((s) => s.wert != null) ? '<span style="--f:rgba(255,255,255,.45)">vor 30 Tagen</span>' : '') + '</div>'
    + skRadar(reihen) + '<p class="sk-fein">Tippe auf eine Fähigkeit für die Berechnung. Spielinterne Leistungsanzeige – kein Intelligenz- oder Persönlichkeitstest.</p>'
    + (mit.length ? '<div class="sk-staerken"><div><b>Stärke</b>' + mit[0].emoji + ' ' + mit[0].name + ' <i>' + mit[0].wert + '</i></div>' + (mit.length > 1 ? '<div><b>Ausbaufähig</b>' + mit[mit.length - 1].emoji + ' ' + mit[mit.length - 1].name + ' <i>' + mit[mit.length - 1].wert + '</i></div>' : '') + '</div>' : '<p class="sk-fein">Noch keine Daten – spiel ein paar Runden, dann füllt sich das Netz.</p>')
    + '<div class="sk-tabelle">' + D.skills.map((s, i) => { const f = frueher[i].wert, diff = s.wert != null && f != null ? s.wert - f : null; return '<button type="button" class="sk-zeile" data-f="' + s.id + '"><span>' + s.emoji + ' ' + s.name + '</span><b>' + (s.wert == null ? '–' : s.wert) + '</b><small>' + (diff == null ? '' : diff > 0 ? '▲ ' + diff : diff < 0 ? '▼ ' + -diff : '±0') + '</small></button>'; }).join('') + '</div></section>'
    + '<section class="sk-block"><h2>Vergleichen</h2><p class="sk-fein">Freiwillig und ohne Server: Verglichen werden nur die sieben Werte, Name und Level.</p>'
    + (andere.length ? '<div class="sk-knopfreihe">' + andere.map((p) => '<button type="button" class="btn secondary sk-mit" data-id="' + p.id + '">' + p.avatar + ' ' + p.name + '</button>').join('') + '</div>' : '')
    + '<div class="sk-knopfreihe"><button type="button" class="btn secondary" id="skCodeKopie">📋 Meinen Vergleichscode kopieren</button><button type="button" class="btn secondary" id="skCodeRein">🔗 Code einfügen</button>' + (skVergleich ? '<button type="button" class="btn secondary" id="skVglAus">✕ Vergleich beenden</button>' : '') + '</div></section>'
    + '<section class="sk-block"><h2>Tagesaufgaben</h2><div class="sk-zahlen3"><div><b>' + serie.serie + '</b>Tage Serie</div><div><b>' + serie.laengste + '</b>längste Serie</div><div><b>' + serie.perfekt + '</b>perfekte Tage</div></div>'
    + '<div class="sk-woche">' + Array.from({ length: 7 }, (_, i) => { const dt = skVorTagen(6 - i), t = (D.tagesSt.tage || {})[dt] || {}; return '<div><small>' + ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(dt + 'T12:00:00Z').getUTCDay()] + '</small>' + SK_SLOTS.map((s) => '<i class="' + (t[s.id] ? 'an' : '') + '" title="' + s.name + '"></i>').join('') + '</div>'; }).join('') + '</div>'
    + '<p class="sk-fein">Diese Woche: ' + E7.length + ' Runden in ' + new Set(E7.map((e) => e.s)).size + ' Spielen.</p></section>'
    + '<section class="sk-block"><h2>Erfolge <small>' + erfolge.filter((a) => a.fertig).length + ' / ' + erfolge.length + '</small></h2><div class="sk-erfolge">'
    + erfolge.map((a) => '<div class="sk-erfolg' + (a.fertig ? ' fertig' : '') + '"><span>' + a.emoji + '</span><div><b>' + a.name + '</b><small>' + a.text + '</small><div class="sk-mini"><i style="width:' + Math.round((a.ist / a.ziel) * 100) + '%"></i></div><small>' + (a.fertig ? '✓ ' + (a.datum ? a.datum.split('-').reverse().join('.') : 'geschafft') : a.ist + ' / ' + a.ziel) + ' · ' + a.xp + ' XP</small></div></div>').join('') + '</div></section>'
    + '<section class="sk-block"><h2>So entstehen die Werte</h2><div class="sk-formel">'
    + '<p><b>XP:</b> jede Runde 10 XP + bis zu 20 XP für die Leistung × Schwierigkeit. Pro Spiel und Tag zählen die ersten zwei Runden voll, dann 60 %, 35 %, 20 %, 10 % – danach nichts mehr. Dazu 40 XP je Tagesaufgabe (+40 für alle drei), 40 XP je Experiment und die XP der Erfolge.</p>'
    + '<p><b>Fähigkeiten:</b> Je Spiel zählen die letzten 30 Runden: Ergebnis × Schwierigkeit (Leicht ×0,8, Mittel ×1, Schwer ×1,15, höchstens 100 %), daraus der Durchschnitt der besseren 60 %. Krimi: Tempo im Verhältnis zur Stufe, jeder Hinweis −12 %. Die Spiele einer Fähigkeit werden gewichtet und nach Erfahrung gewichtet gemittelt. Wenig Erfahrung zieht den Wert nach unten (bis auf 50 %), pro Tag zählen höchstens drei Runden als Erfahrung.</p>'
    + '<p><b>Level:</b> Level n braucht 50 × (n−1) × (n+2) XP – Level 2 bei 200, Level 5 bei 1 400, Level 10 bei 5 400.</p></div></section>';
  $('skInhalt').querySelectorAll('[data-f]').forEach((el) => {
    const zeig = () => skFaehigkeitErklaeren(D.skills.find((s) => s.id === el.dataset.f));
    el.addEventListener('click', zeig); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zeig(); } });
  });
  $('skInhalt').querySelectorAll('.sk-mit').forEach((b) => b.addEventListener('click', () => {
    const p = profile().liste.find((q) => q.id === b.dataset.id), daten = datenVon(p.id), D2 = skDaten(daten);
    skVergleich = { name: p.name, avatar: p.avatar, level: skLevel(skXP(D2.E, D2.tagesSt, D2.expSt, D2.erfolgSt).gesamt).level, werte: D2.skills.map((s) => s.wert) };
    skProfilZeichnen();
  }));
  $('skCodeKopie').addEventListener('click', async () => {
    const code = skVergleichCode();
    try { await navigator.clipboard.writeText(code); skToast('📋 Vergleichscode kopiert – schick ihn an wen du willst.'); }
    catch (e) { skDialog('<h3>Dein Vergleichscode</h3><textarea class="sk-code" readonly>' + code + '</textarea>'); }
  });
  $('skCodeRein').addEventListener('click', () => {
    const d = skDialog('<h3>Vergleichscode einfügen</h3><textarea class="sk-code" id="skCodeFeld" placeholder="SK1.…"></textarea><div class="sk-knopfreihe"><button type="button" class="btn" id="skCodeOk">Vergleichen</button></div><p class="sk-fein" id="skCodeFehler"></p>');
    d.querySelector('#skCodeOk').addEventListener('click', () => {
      const v = skVergleichLesen(d.querySelector('#skCodeFeld').value);
      if (!v) { d.querySelector('#skCodeFehler').textContent = 'Das ist kein gültiger Vergleichscode.'; return; }
      skVergleich = v; d.close(); skProfilZeichnen();
    });
  });
  if ($('skVglAus')) $('skVglAus').addEventListener('click', () => { skVergleich = null; skProfilZeichnen(); });
}
function skFaehigkeitErklaeren(s) {
  skDialog('<h3>' + s.emoji + ' ' + s.name + '</h3>'
    + (s.wert == null ? '<p>Noch keine Runden in den passenden Spielen.</p>' : '<div class="sk-zahlen3"><div><b>' + s.wert + '</b>Wert</div><div><b>' + s.leistung + ' %</b>Leistung</div><div><b>' + s.erfahrung + ' %</b>Erfahrung</div></div>'
      + '<p class="sk-fein">Wert = Leistung × (50 % + 50 % × Erfahrung)</p>')
    + '<ul class="sk-teile">' + Object.entries(s.spiele).map(([sp, w]) => { const t = s.teile.find((x) => x.spiel === sp), v = VERLAUF_SPIELE[sp] || { name: sp, emoji: '🎮' }; return '<li>' + v.emoji + ' ' + v.name + ' <small>Gewicht ' + String(w).replace('.', ',') + '</small><b>' + (t ? t.wert + ' % · ' + t.runden + ' Runden' : 'noch nicht gespielt') + '</b></li>'; }).join('') + '</ul>');
}

// ---------- Dashboard ----------
function skBegruessung() {
  const h = Number(new Intl.DateTimeFormat('de-DE', { timeZone: SK_ZONE, hour: 'numeric', hour12: false }).format(new Date()));
  return h < 5 ? 'Noch wach' : h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : h < 22 ? 'Guten Abend' : 'Späte Runde';
}
function skDashboard() {
  const hub = $('screen-hub');
  if (!hub) return;
  skKategorienEinrichten();
  let start = $('skStart');
  if (!start) {
    start = document.createElement('div'); start.id = 'skStart'; start.className = 'sk-start';
    const spalten = hub.querySelector('.hub-spalten');
    hub.insertBefore(start, spalten);
  }
  const D = skDaten(), xp = skXP(D.E, D.tagesSt, D.expSt, D.erfolgSt), lv = skLevel(xp.gesamt);
  const pr = typeof aktivesProfil === 'function' ? aktivesProfil() : null;
  const A = skTagesAufgaben(), t = (D.tagesSt.tage || {})[A.datum] || {}, serie = skTagesSerie(D.tagesSt);
  const fertig = SK_SLOTS.filter((s) => t[s.id]).length;
  const exp = typeof labDieseWoche === 'function' ? labDieseWoche() : null;
  start.innerHTML = '<button type="button" class="sk-gruss" id="skGruss" aria-label="Dein Profil öffnen">'
    + '<span class="sk-level"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" class="sk-ring-bg"/><circle cx="22" cy="22" r="19" class="sk-ring" style="stroke-dasharray:' + (119.4 * lv.anteil).toFixed(1) + ' 119.4"/></svg><b>' + lv.level + '</b></span>'
    + '<span class="sk-gruss-text"><small>' + skBegruessung() + (pr ? ', ' + pr.name : '') + '</small><b>' + lv.titel + '</b><span>' + fmt(xp.gesamt) + ' XP · Level ' + (lv.level + 1) + ' bei ' + fmt(lv.bis) + '</span></span>'
    + skRadar([{ werte: D.skills.map((s) => s.wert), farbe: '#f59e0b' }], { klein: true }) + '</button>'
    + '<div class="sk-tag-kopf"><h2 class="hub-h"><span>📅</span> Heute <small>' + fertig + ' / 3' + (serie.serie ? ' · 🔥 ' + serie.serie : '') + '</small></h2><button type="button" class="sk-teilen" id="skTagTeilen" aria-label="Tagesergebnis teilen">📤</button></div>'
    + '<div class="sk-tageskarten">' + SK_SLOTS.map((s) => {
      const a = A[s.id], r = t[s.id];
      return '<div class="sk-tageskarte sk-' + s.id + (r ? ' fertig' : '') + '"><span class="sk-slot">' + s.emoji + ' ' + s.name + '</span><span class="sk-spiel-emoji" aria-hidden="true">' + skAufgabeEmoji(a) + '</span>'
        + '<b>' + skAufgabeName(a) + '</b><small>' + (a.spiel === 'krimi' ? { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' }[a.stufe] + ' · ' : '') + (r ? '✓ ' + skErgebnisText(r) : s.text) + '</small>'
        + (r ? '<button type="button" class="sk-karte-btn" data-karte="' + s.id + '">📤 Karte</button>' : '<button type="button" class="sk-los" data-slot="' + s.id + '">Los ▶</button>') + '</div>';
    }).join('') + '</div>'
    + (exp ? '<button type="button" class="sk-experiment" id="skExperiment"><span class="sk-exp-nr">EXPERIMENT Nº ' + String(exp.nr).padStart(2, '0') + ' · KW ' + exp.kw + '</span><b>' + exp.e.emoji + ' ' + exp.e.titel + '</b><small>' + exp.e.teaser + '</small><span class="sk-exp-status">' + (exp.fertig ? '✓ durchgeführt · Ergebnis ansehen' : 'Versuch starten ›') + '</span></button>' : '');
  start.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => skAufgabeStarten(b.dataset.slot)));
  start.querySelectorAll('[data-karte]').forEach((b) => b.addEventListener('click', () => skKarteZeigen(skKarteTagesaufgabe(b.dataset.karte, A.datum))));
  $('skGruss').addEventListener('click', skProfilZeigen);
  $('skTagTeilen').addEventListener('click', async () => {
    const text = skTeilenText();
    if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { return; } }
    try { await navigator.clipboard.writeText(text); skToast('📋 Tagesergebnis kopiert'); } catch (e) { skDialog('<textarea class="sk-code" readonly>' + text + '</textarea>'); }
  });
  if ($('skExperiment')) $('skExperiment').addEventListener('click', () => labZeigen());
  skUnten(D);
  skErfolgePruefen(true);
}
// Unten im Dashboard: zuletzt gespielt (mit Karte) und nächste Erfolge
function skUnten(D) {
  const b = document.querySelector('#screen-hub .spalte-b');
  if (!b) return;
  let box = $('skUnten');
  if (!box) { box = document.createElement('div'); box.id = 'skUnten'; box.className = 'sk-unten'; b.insertBefore(box, b.firstChild); }
  const letzte = D.E.slice().reverse().slice(0, 5);
  const naechste = skErfolgeStand(D).filter((a) => !a.fertig).sort((x, y) => y.ist / y.ziel - x.ist / x.ziel).slice(0, 3);
  box.innerHTML = '<h2 class="hub-h"><span>🕘</span> Zuletzt gespielt</h2>'
    + (letzte.length ? '<div class="sk-letzte">' + letzte.map((e, i) => { const sp = VERLAUF_SPIELE[e.s] || { emoji: '🎮', name: e.s }; return '<div class="sk-letzt"><span>' + sp.emoji + '</span><div><b>' + sp.name + '</b><small>' + (e.i || '') + '</small></div><i>' + (e.m ? fmt(e.p) + '/' + e.m : '') + '</i><button type="button" data-e="' + i + '" aria-label="Ergebnis-Karte">📤</button></div>'; }).join('') + '</div>' : '<p class="sk-fein">Noch nichts gespielt.</p>')
    + (naechste.length ? '<h2 class="hub-h"><span>🏆</span> Nächste Erfolge</h2><div class="sk-naechste">' + naechste.map((a) => '<div><span>' + a.emoji + '</span><div><b>' + a.name + '</b><div class="sk-mini"><i style="width:' + Math.round((a.ist / a.ziel) * 100) + '%"></i></div></div><small>' + a.ist + '/' + a.ziel + '</small></div>').join('') + '</div>' : '');
  box.querySelectorAll('[data-e]').forEach((x) => x.addEventListener('click', () => skKarteZeigen(skKarteEintrag(letzte[Number(x.dataset.e)]))));
}
// Spielkarten nach Kategorien gruppieren (die Knöpfe selbst bleiben dieselben, nur ihr Platz ändert sich)
function skKategorienEinrichten() {
  const a = document.querySelector('#screen-hub .spalte-a');
  if (!a || a.dataset.kategorien) return;
  a.dataset.kategorien = '1';
  const alt = a.querySelector('.hub-liste') || a, verlauf = $('hubVerlauf');
  const abschnitt = (emoji, name, cls) => {
    const sec = document.createElement('section');
    sec.className = 'sk-kat ' + cls;
    sec.innerHTML = '<h2 class="hub-h"><span>' + emoji + '</span> ' + name + '</h2><div class="hub-liste"></div>';
    a.appendChild(sec);
    return sec.querySelector('.hub-liste');
  };
  SK_KATEGORIEN.forEach((k) => {
    const liste = abschnitt(k.emoji, k.name, 'sk-kat-' + k.id);
    k.karten.forEach((id) => { const el = $(id); if (el) liste.appendChild(el); });
  });
  // was keiner Kategorie zugeordnet ist, bleibt sichtbar
  const rest = [...alt.querySelectorAll(':scope > .hub-game')];
  if (rest.length) { const liste = abschnitt('✨', 'Weitere', ''); rest.forEach((el) => liste.appendChild(el)); }
  if (alt !== a && !alt.children.length) alt.remove();
  if (verlauf) { const b = document.querySelector('#screen-hub .spalte-b'); if (b) b.appendChild(verlauf); }
}

// renderHub (hub.js) zeichnet die Startseite – danach die neue Schicht
if (typeof renderHub === 'function') {
  const skAltRenderHub = renderHub;
  // eslint-disable-next-line no-global-assign
  renderHub = function () { skAltRenderHub.apply(this, arguments); try { skDashboard(); } catch (e) { console.error(e); } };
}
$('skZurueck').addEventListener('click', () => { skVergleich = null; zeigeHub(); });
skDashboard();
