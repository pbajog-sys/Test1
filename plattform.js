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
  wunder: { name: 'Wundermuster', emoji: '🌀', hub: 'hubWunder', kat: 'zahlen' },
  beat: { name: 'Beat-Bahnen', emoji: '🎸', hub: 'hubBeat', kat: 'sinne', ton: true },
};
const SK_KRIMI = { mord: { name: 'Tatort', emoji: '🔎' }, wachen: { name: 'Wachen der Villa', emoji: '🛡️' }, alibi: { name: 'Alibi-Raster', emoji: '📋' }, verhoer: { name: 'Verhör', emoji: '🗣️' } };
// Aussortiert (auf Wunsch): Die Karten verschwinden aus dem Hub, Code und Spielstände bleiben unangetastet –
// so geht nichts verloren und alles ließe sich mit einer Zeile wieder einblenden.
const SK_AUSSORTIERT = { karten: ['hubQuizzes', 'hubPiranha'], spiele: ['piranha'], erfolge: ['piranha', 'abzeichen'] };
const SK_KATEGORIEN = [
  { id: 'denken', name: 'Denken & Zahlen', emoji: '🧠', karten: ['hubKlassiker', 'hubFunktion', 'hubPunkte', 'hubZufall', 'hubZahlen', 'hubTierleben'] },
  { id: 'sinne', name: 'Sinne & Musik', emoji: '👁️', karten: ['hubFarben', 'hubToene', 'hubTakt', 'hubAugen', 'hubSongs', 'hubStudio', 'hubBeat'] },
  { id: 'wissen', name: 'Wissen & Sprache', emoji: '📚', karten: ['hubCello', 'hubStimmen', 'hubSlo', 'hubEng'] },
];
// Archiviert (auf Wunsch): nicht mehr auf der Startseite, aber unten im „Archiv“ weiter spielbar – Spielstände bleiben.
// Tagesaufgaben nehmen nur noch sichtbare Spiele.
const SK_ARCHIV = { karten: ['hubKrimi', 'hubRiff', 'hubKarte', 'hubTiefgang', 'hubFalten', 'hubZoom', 'hubGlas', 'hubWunder', 'hubNvl', 'hubFitness', 'hubScan', 'hubNaehen', 'hubDopamin', 'hubRage'], experiment: true };

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
// Keine Ränge mehr („Frischling“ …) – neutral nur das Level
const skTitel = (L) => 'Level ' + L;

// ---------- Fähigkeiten ----------
// Gewicht, mit dem ein Spiel in eine Fähigkeit eingeht
const SK_FAEHIGKEITEN = [
  { id: 'logik', name: 'Logisches Denken', kurz: 'Logik', emoji: '🧠', titel: 'Kopfnuss-Knacker', spiele: { krimi: 1, piranha: 0.6, klassiker: 0.6, funktion: 0.5 } },
  { id: 'gehoer', name: 'Musikalisches Gehör', kurz: 'Gehör', emoji: '🎵', titel: 'Goldohr', spiele: { toene: 1, songs: 0.8, cello: 0.6, takt: 0.5, beat: 0.4 } },
  { id: 'visuell', name: 'Visuelle Wahrnehmung', kurz: 'Sehen', emoji: '👁️', titel: 'Adlerauge', spiele: { farben: 1, augen: 0.6, punkte: 0.5 } },
  { id: 'raum', name: 'Räumliches Denken', kurz: 'Raum', emoji: '📐', titel: 'Kartenkopf', spiele: { karte: 1, augen: 0.8, piranha: 0.4, zoom: 0.6 } },
  { id: 'zahlen', name: 'Zahlenverständnis', kurz: 'Zahlen', emoji: '🔢', titel: 'Zahlenflüsterer', spiele: { zufall: 1, funktion: 0.8, punkte: 0.7, falten: 0.6, glas: 0.7, wunder: 0.6 } },
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
  return SK_ERFOLGE.filter((a) => !SK_AUSSORTIERT.erfolge.includes(a.id) || (D.erfolgSt || {})[a.id]).map((a) => { const [ist, ziel] = a.f(D); return { ...a, ist: Math.min(ist, ziel), ziel, fertig: ist >= ziel, datum: (D.erfolgSt || {})[a.id] }; });
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
  brain: [{ spiel: 'funktion' }, { spiel: 'punkte' }, { spiel: 'zufall' }],
  sense: [{ spiel: 'farben' }, { spiel: 'toene' }, { spiel: 'augen' }, { spiel: 'takt' }],
  chaos: [{ spiel: 'farben' }, { spiel: 'toene' }, { spiel: 'augen' }, { spiel: 'takt' }, { spiel: 'funktion' }, { spiel: 'punkte' }, { spiel: 'zufall' }],
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
  const chaos = wahl(SK_POOL.chaos.filter((c) => c.spiel !== brain.spiel && c.spiel !== sense.spiel));
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
    + '<div><b>' + (pr ? pr.name : 'Du') + '</b><span>Level ' + lv.level + (mit[0] && mit[0].wert >= 40 ? ' · ' + mit[0].titel : '') + '</span>'
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
  skFavoriten();
  let start = $('skStart');
  if (!start) {
    start = document.createElement('div'); start.id = 'skStart'; start.className = 'sk-start';
    const spalten = hub.querySelector('.hub-spalten');
    hub.insertBefore(start, spalten);
  }
  const D = skDaten(), xp = skXP(D.E, D.tagesSt, D.expSt, D.erfolgSt), lv = skLevel(xp.gesamt);
  const pr = typeof aktivesProfil === 'function' ? aktivesProfil() : null;
  const exp = typeof labDieseWoche === 'function' ? labDieseWoche() : null;
  let grussBox = $('skGrussBox');
  if (!grussBox) { grussBox = document.createElement('div'); grussBox.id = 'skGrussBox'; const b = hub.querySelector('.spalte-b'); if (b) b.insertBefore(grussBox, b.firstChild); else hub.insertBefore(grussBox, start); }
  grussBox.innerHTML = '<button type="button" class="sk-gruss" id="skGruss" aria-label="Dein Profil öffnen">'
    + '<span class="sk-level"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" class="sk-ring-bg"/><circle cx="22" cy="22" r="19" class="sk-ring" style="stroke-dasharray:' + (119.4 * lv.anteil).toFixed(1) + ' 119.4"/></svg><b>' + lv.level + '</b></span>'
    + '<span class="sk-gruss-text"><small>' + skBegruessung() + (pr ? ', ' + skText(pr.name) : '') + '</small><b>Level ' + lv.level + '</b><span>' + fmt(xp.gesamt) + ' XP · Level ' + (lv.level + 1) + ' bei ' + fmt(lv.bis) + '</span></span>'
    + skRadar([{ werte: D.skills.map((s) => s.wert), farbe: '#f59e0b' }], { klein: true }) + '</button>';
  start.innerHTML = '<div class="sk-gross" id="skGross" hidden>'
    + '<section class="sk-dienstzeile" id="skGrossLol" hidden><div class="sk-gross-kachel">'
    + '<img class="spielraum-motiv" src="bilder/duellbuch.webp" alt="Steinbrücke über einer Schlucht bei Nacht">'
    + '<div class="sk-dienstkopf"><h2>League of Legends</h2><div class="sk-lol-aktionen"><button type="button" id="skLolAktualisieren">Aktualisieren</button><a class="sk-dienstweiter" href="lol.html">League of Legends öffnen <span aria-hidden="true">→</span></a></div></div><p id="skLolMeldung" role="status" hidden></p><div id="skGrossLolDaten"></div></div><aside id="skGrossLolStats" class="sk-dienststats"></aside></section>'
    + '<section class="sk-dienstzeile" id="skGrossMc" hidden><div class="sk-gross-kachel">'
    + '<img class="spielraum-motiv" src="bilder/blockrevier.webp" alt="Beleuchtete Hütte in einem kantigen Tannenwald">'
    + '<div class="sk-dienstkopf"><h2>Minecraft</h2><a class="sk-dienstweiter" href="minecraft.html">Minecraft öffnen <span aria-hidden="true">→</span></a></div><div id="skGrossMcDaten"></div></div><aside id="skGrossMcStats" class="sk-dienststats"></aside></section></div>'
    + (exp && !SK_ARCHIV.experiment ? '<button type="button" class="sk-experiment" id="skExperiment"><span class="sk-exp-nr">EXPERIMENT Nº ' + String(exp.nr).padStart(2, '0') + ' · KW ' + exp.kw + '</span><b>' + exp.e.emoji + ' ' + exp.e.titel + '</b><small>' + exp.e.teaser + '</small><span class="sk-exp-status">' + (exp.fertig ? '✓ durchgeführt · Ergebnis ansehen' : 'Versuch starten ›') + '</span></button>' : '');
  $('skGruss').addEventListener('click', skProfilZeigen);
  if ($('skExperiment')) $('skExperiment').addEventListener('click', () => labZeigen());
  const archivExp = $('skArchivExtra');
  if (archivExp) {
    archivExp.innerHTML = exp && SK_ARCHIV.experiment ? '<button type="button" class="sk-experiment sk-experiment-klein" id="skExperimentArchiv"><span class="sk-exp-nr">EXPERIMENT DER WOCHE · KW ' + exp.kw + '</span><b>' + exp.e.emoji + ' ' + exp.e.titel + '</b><span class="sk-exp-status">' + (exp.fertig ? '✓ durchgeführt · Ergebnis ansehen' : 'Versuch starten ›') + '</span></button>' : '';
    if ($('skExperimentArchiv')) $('skExperimentArchiv').addEventListener('click', () => labZeigen());
  }
  skGrossKacheln();
  skUnten(D);
  skErfolgePruefen(true);
}
// Die Vorschau gehört zur aktiven Sitzung. Antworten einer früheren Anmeldung verwerfen.
let skDienstVorschau = null;
const skText = (wert) => String(wert ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const skZahl = (wert) => Number(wert).toLocaleString('de-DE');
const skRangNamen = { IRON: 'Eisen', BRONZE: 'Bronze', SILVER: 'Silber', GOLD: 'Gold', PLATINUM: 'Platin', EMERALD: 'Smaragd', DIAMOND: 'Diamant', MASTER: 'Meister', GRANDMASTER: 'Großmeister', CHALLENGER: 'Herausforderer' };
const skKennzahl = (wert, text) => '<span><strong>' + skText(wert) + '</strong><small>' + text + '</small></span>';

const skDuoModi = new Map([['jeder', 'Alle öffentlichen Modi'], ['alle', 'Alle (Kluft)'], ['solo', 'Solo/Duo'], ['flex', 'Flex'], ['5er', '5er'], ['aram', 'ARAM'], ['mayhem', 'Mayhem']]);

function skDuoErgebnis(daten, modus) {
  if (!daten || daten.quelle !== 'riot') return '<p>Für diesen Modus sind gerade keine Daten verfügbar.</p>';
  const personen = new Map((daten.personen || []).map((p) => [p.id, p.name]));
  const vorhanden = (daten.duos || []).filter((d) => d.g > 0);
  const eigene = vorhanden.filter((d) => d.a === daten.ichId || d.b === daten.ichId);
  const gruppe = !eigene.length && vorhanden.length > 0;
  const duos = (gruppe ? vorhanden : eigene).slice(0, 3);
  const name = (id) => personen.get(id) || 'Mitspieler';
  return (modus === '5er' ? '<p class="sk-duohinweis">Flex mit fünf eingetragenen Personen im selben Team.</p>' : '') + (gruppe ? '<p class="sk-duohinweis">Gruppen-Duos · keine eigenen Duos für diesen Filter.</p>' : '') + (duos.length ? '<ul class="sk-duos">' + duos.map((d) => {
      const quote = Math.max(0, Math.min(100, Math.round(d.w / d.g * 100)));
      return '<li><span>' + skText(gruppe ? name(d.a) + ' & ' + name(d.b) : name(d.a === daten.ichId ? d.b : d.a)) + ' <small>· ' + Number(d.g) + ' Spiele</small></span><b>' + quote + ' %</b><meter min="0" max="100" value="' + quote + '" aria-label="Siegquote"></meter></li>';
    }).join('') + '</ul>' : '<p>Noch keine gemeinsamen Spiele in diesem Modus.</p>');
}

async function skDienstJson(pfad) {
  const r = await fetch('api/' + pfad, { credentials: 'same-origin', cache: 'no-store' });
  return r.ok ? r.json() : null;
}

function skDuoZeigen(vorschau) {
  const wahl = $('skDuoModus'), box = $('skDuoErgebnis');
  if (!wahl || !box) return;
  if (vorschau.duoModus && ![...wahl.options].some((option) => option.value === vorschau.duoModus)) vorschau.duoModus = 'jeder';
  const modus = vorschau.duoModus || 'jeder';
  wahl.value = modus;
  const alt = vorschau.duos.get(modus);
  box.innerHTML = alt ? alt.html : '<p>Wird geladen …</p>';
  if ((alt && Date.now() - alt.zeit < 60000) || vorschau.duoLaedt.has(modus)) return;
  vorschau.duoLaedt.add(modus);
  const filter = modus === '5er' ? 'flex&gruppe=5' : modus;
  skDienstJson('lol/daten?filter=' + filter).catch(() => null).then((daten) => {
    vorschau.duoLaedt.delete(modus);
    if (skDienstVorschau !== vorschau || syZustand !== 'ok' || syName !== vorschau.konto) return;
    vorschau.duos.set(modus, { html: skDuoErgebnis(daten, modus), zeit: Date.now() });
    if ((vorschau.duoModus || 'jeder') === modus) skDuoZeigen(vorschau);
  });
}

function skZeigeLol(daten, profil, kartenModus = 'Kluft') {
  if (!profil || profil.quelle !== 'riot') {
    return ['<p>' + ((daten.meine || []).length ? 'Deine Profilwerte sind noch nicht verfügbar.' : 'Verknüpfe deinen Riot-Account für deine persönliche Übersicht.') + '</p>', ''];
  }
  const raenge = Object.keys(skRangNamen), divisionen = ['IV', 'III', 'II', 'I'];
  const wert = (r) => raenge.indexOf(r.tier) * 400 + Math.max(0, divisionen.indexOf(r.div)) * 100 + r.lp;
  const accounts = profil.accounts || [];
  const rangFuer = (art) => accounts.map((a) => a.rang && a.rang[art]).filter((r) => r && skRangNamen[r.tier]).sort((a, b) => wert(b) - wert(a))[0];
  const rangKarte = (titel, rang, unter) => {
    const abzeichen = rang ? '<img src="bilder/raenge/' + rang.tier.toLowerCase() + '.webp" width="68" height="68" alt="">' : '';
    const text = rang ? skRangNamen[rang.tier] + (raenge.indexOf(rang.tier) < 7 && rang.div ? ' ' + rang.div : '') : 'Ohne Rang';
    const bilanz = !unter && Number.isFinite(rang?.w) && Number.isFinite(rang?.l) && rang.w + rang.l > 0
      ? '<small>' + skZahl(rang.w) + ' S · ' + skZahl(rang.l) + ' N</small>' : '';
    return '<div class="sk-rangkarte"><small>' + titel + '</small><div class="sk-rangbild">' + (abzeichen || '<span aria-hidden="true">◇</span>') + '</div><strong>' + skText(text) + '</strong><small>' + (unter || (rang ? skText(rang.lp) + ' LP' : '')) + '</small>' + bilanz + '</div>';
  };
  const konto = accounts.reduce((bestes, a) => Number(a.level) > (Number(bestes.level) || 0) ? a : bestes, {});
  const icon = Number(konto.icon);
  const kontoBild = Number.isSafeInteger(icon) && icon > 0 ? '<img src="api/lol/bild/profil/' + icon + '.png" alt="" width="54" height="54">' : '';
  const kontoName = (konto.riotId || '').split('#')[0];
  const serie = (profil.spiele || []).findIndex((m) => !m.w);
  const siegeInFolge = serie < 0 ? (profil.spiele || []).length : serie;
  const lolFakten = [
    profil.filterSpiele > 0 ? skKennzahl(skZahl(profil.filterSpiele), 'Spiele im Verlauf · ' + kartenModus) : '',
    siegeInFolge > 1 ? skKennzahl(skZahl(siegeInFolge), 'Siege in Folge') : '',
    profil.champs && profil.champs[0] ? skKennzahl(skZahl(profil.champs[0].g), 'Spiele mit ' + skText(profil.champs[0].c)) : ''
  ].filter(Boolean).join('');
  const solo = rangFuer('solo'), flex = rangFuer('flex');
  const bilanz = profil.leistung || {}, letzte = (profil.spiele || []).slice(0, 4);
  const champions = (profil.mastery || []).slice(0, 3);
  const masteryHinweis = accounts.find((a) => a.fehler)?.fehler || 'Riot hat für dieses Profil keine Meisterschaftsdaten geliefert.';
  const champBild = (name, groesse) => /^[a-z0-9]+$/i.test(name) ? '<img src="api/lol/bild/champion/' + encodeURIComponent(name) + '.png" alt="" width="' + groesse + '" height="' + groesse + '">' : '';
  return ['<div class="sk-lol-raenge">'
    + '<div class="sk-rangkarte"><small>Riot-Kontostufe</small><div class="sk-konto-bild">' + kontoBild + '<b aria-label="Level ' + skText(konto.level || 'unbekannt') + '">' + skText(konto.level || '–') + '</b></div>' + (kontoName ? '<strong>' + skText(kontoName) + '</strong>' : '') + '</div>'
    + rangKarte('Solo/Duo', solo) + rangKarte('Flex', flex) + rangKarte('5er-Gruppe', flex, 'Flex-Wertung')
    + '</div>'
    + '<p class="sk-lol-form">' + (bilanz.alle ? '<strong>' + Number(bilanz.alle.wr) + ' %</strong> Siege · ' + kartenModus : 'Noch keine öffentlichen Spiele im gespeicherten Verlauf') + (bilanz.neu ? ' <span>· <b>' + Number(bilanz.neu.wr) + ' %</b> in den letzten ' + Number(bilanz.neu.g) + ' Spielen</span>' : '') + '</p>'
    + (letzte.length ? '<p class="sk-label sk-letzte-label">Letzte Spiele · ' + kartenModus + '</p><ul class="sk-lol-letzte">' + letzte.map((m) => {
      const spieler = (m.p || [])[m.ich] || {}, datum = new Date(m.t);
      const zeit = m.t && Number.isFinite(datum.getTime()) ? '<time datetime="' + datum.toISOString() + '">' + datum.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: SK_ZONE }) + '</time>' : '';
      return '<li class="' + (m.w ? 'sk-sieg' : 'sk-niederlage') + '">' + champBild(spieler.c, 36) + '<span><b>' + (m.w ? 'Sieg' : 'Niederlage') + '</b><small>' + skText(spieler.c) + '</small></span>' + zeit + '</li>';
    }).join('') + '</ul>' : ''),
    '<div><h3>Champion-Meisterschaft</h3>' + (champions.length ? '<ul class="sk-meisterschaft">' + champions.map((c) => '<li><span>' + champBild(c.c, 54) + '<b aria-label="Meisterschaftsstufe ' + skText(c.l) + '">' + skText(c.l) + '</b></span><small>' + skText(c.c) + '</small></li>').join('') + '</ul>' : '<p>' + skText(masteryHinweis) + '</p>') + '</div>'
    + '<div><div class="sk-duokopf"><h3>Siegquote mit Mitspielern</h3><select id="skDuoModus" aria-label="Spielmodus für Mitspieler-Siegquote">'
    + [...skDuoModi].filter(([id]) => id !== 'mayhem' || daten.mayhemVerfuegbar).map(([id, name]) => '<option value="' + id + '">' + name + '</option>').join('')
    + '</select></div><div id="skDuoErgebnis" aria-live="polite"></div></div>'
    + (lolFakten ? '<div class="sk-lol-fakten"><h3>Kluft-Statistik</h3><div class="sk-kennzahlen">' + lolFakten + '</div></div>' : '')
  ];
}

function skZeigeMinecraft(info) {
  const mine = info.zugang && info.zugang.mein;
  const stats = mine && (info.spieler || []).find((p) => p.name.toLowerCase() === mine.toLowerCase());
  const online = info.online || [];
  const spieler = info.spieler || [], zugang = info.zugang || {};
  const gesamt = (feld) => spieler.reduce((summe, p) => summe + (Number(p[feld]) || 0), 0);
  const tage = Math.floor((Date.now() - Number(info.weltErstellt)) / 864e5);
  const weltstart = info.weltErstellt && Number.isFinite(tage) && tage >= 0 ? '<div class="sk-weltstart"><span class="sk-weltstart-icon" aria-hidden="true">✦</span><span><small title="Erstellungsdatum des Weltordners">Weltstart</small><strong><time datetime="' + new Date(info.weltErstellt).toISOString() + '">' + new Date(info.weltErstellt).toLocaleDateString('de-DE', { timeZone: SK_ZONE, day: 'numeric', month: 'long', year: 'numeric' }) + '</time></strong></span><b>' + (tage === 0 ? 'Tag 1' : 'Seit ' + skZahl(tage) + (tage === 1 ? ' Tag' : ' Tagen')) + '</b></div>' : '';
  const min = gesamt('spielzeitMin');
  const zeitText = (m) => skZahl(Math.floor(m / 60)) + ' Std. ' + (m % 60) + ' Min.';
  const weltFakten = [
    ['🍰', gesamt('kuchen'), 'Kuchenstücke verputzt'],
    ['🎣', gesamt('fische'), 'Fische geangelt'],
    ['🛏️', gesamt('schlaf'), 'Mal ins Bett gefallen'],
    ['🦘', gesamt('spruenge'), 'Sprünge gemacht']
  ].filter(([, n]) => n > 0);

  const aktion = info.admin && zugang.modus === 'code' ? '<a class="sk-dienstlink" href="minecraft.html#beitrittscode">Beitrittscode verwalten →</a>'
    : !mine && zugang.modus === 'code' ? '<a class="sk-dienstlink" href="minecraft.html#mitspielen">Mitspielen · Code beim Admin anfragen →</a>'
    : !mine && zugang.modus === 'offen' ? '<a class="sk-dienstlink" href="minecraft.html#mitspielen">Mitspielen →</a>' : '';
  return ['<p class="sk-mc-status"><i class="sk-punkt' + (info.laeuft ? ' an' : '') + '" aria-hidden="true"></i> '
    + (info.beschaeftigt ? skText(info.beschaeftigt) + ' …' : info.laeuft ? 'Online · ' + online.length + ' von ' + (Number(info.maxSpieler) || '–') + ' Spielern' : 'Offline') + '</p>'
    + (online.length ? '<ul class="sk-champions">' + online.map((name) => '<li>' + skText(name) + '</li>').join('') + '</ul>' : '') + weltstart + aktion,
    '<div><h3>Weltstatistik</h3><div class="sk-kennzahlen">'
    + (spieler.some((p) => typeof p.bloecke === 'number') ? skKennzahl(skZahl(gesamt('bloecke')), 'Blöcke abgebaut') : '')
    + skKennzahl(skZahl(gesamt('mobKills')), 'Mobs getötet') + skKennzahl(skZahl(spieler.length), 'Spieler mit Statistik')
    + (min > 0 ? skKennzahl(zeitText(min), 'Gemeinsame Spielzeit') : '')
    + (gesamt('km') > 0 ? skKennzahl(skZahl(Math.round(gesamt('km') * 10) / 10) + ' km', 'Zurückgelegt') : '')
    + '</div></div><div><h3>Deine Statistik</h3>'
    + (stats ? '<div class="sk-kennzahlen">' + skKennzahl(zeitText(stats.spielzeitMin), 'Spielzeit')
      + skKennzahl(skZahl(stats.tode), 'Tode') + skKennzahl(skZahl(stats.erfolge), 'Erfolge') + (stats.bloecke > 0 ? skKennzahl(skZahl(stats.bloecke), 'Blöcke abgebaut') : '') + (stats.mobKills > 0 ? skKennzahl(skZahl(stats.mobKills), 'Mobs getötet') : '') + '</div>' : '<p>' + (mine ? 'Für deinen Namen sind noch keine Spielwerte da.' : 'Verknüpfe deinen Minecraft-Namen.') + '</p>') + '</div>'
    + (weltFakten.length ? '<div class="sk-weltfakten"><h3>Kurioses aus der Welt</h3><ul>' + weltFakten.map(([symbol, anzahl, text]) => '<li><span aria-hidden="true">' + symbol + '</span><b>' + skZahl(anzahl) + '</b> ' + text + '</li>').join('') + '</ul></div>' : '')];
}

async function skLolAktualisieren(vorschau) {
  if (vorschau.lolLaedt) return;
  const aktiv = () => skDienstVorschau === vorschau && syZustand === 'ok' && syName === vorschau.konto;
  vorschau.lolLaedt = true;
  vorschau.lolMeldung = 'Riot-Daten werden geholt …';
  skGrossKacheln();
  try {
    const r = await fetch('api/lol/aktualisieren', { method: 'POST', credentials: 'same-origin' });
    if (!r.ok) {
      const info = await r.json().catch(() => null);
      vorschau.lolMeldung = info?.fehler || 'Aktualisierung fehlgeschlagen.';
      return;
    }
    for (let i = 0; i < 7; i++) {
      await new Promise((fertig) => setTimeout(fertig, 5000));
      if (!aktiv() || document.hidden) break;
      const status = await skDienstJson('lol/aktualisieren');
      if (status?.stand === 'fertig') {
        vorschau.lolMeldung = 'Riot-Daten aktualisiert.';
        break;
      }
      if (status?.stand === 'fehler') {
        vorschau.lolMeldung = status.meldung || 'Riot konnte die Daten gerade nicht vollständig liefern.';
        break;
      }
    }
    if (vorschau.lolMeldung === 'Riot-Daten werden geholt …') vorschau.lolMeldung = 'Der Import läuft im Hintergrund weiter. Die Übersicht lädt beim nächsten Öffnen neu.';
    vorschau.lolZeit = 0;
    vorschau.duos.clear();
  } catch (e) {
    vorschau.lolMeldung = 'Der Server war gerade nicht erreichbar.';
  } finally {
    vorschau.lolLaedt = false;
    if (aktiv()) skGrossKacheln();
  }
}

function skGrossKacheln() {
  const box = $('skGross');
  if (!box) return;
  if (typeof syZustand !== 'string' || syZustand !== 'ok') {
    skDienstVorschau = null;
    box.hidden = true;
    return;
  }
  if (!skDienstVorschau || skDienstVorschau.konto !== syName) skDienstVorschau = { konto: syName, lolZeit: 0, mcZeit: 0, duos: new Map(), duoLaedt: new Set() };
  const vorschau = skDienstVorschau;
  const zeigen = () => {
    const knopf = $('skLolAktualisieren'), meldung = $('skLolMeldung');
    knopf.disabled = !!vorschau.lolLaedt;
    knopf.onclick = () => skLolAktualisieren(vorschau);
    meldung.textContent = vorschau.lolMeldung || '';
    meldung.hidden = !vorschau.lolMeldung;
    for (const [id, inhalt] of [['skGrossLol', vorschau.lol], ['skGrossMc', vorschau.mc]]) {
      $(id).hidden = !inhalt;
      const daten = $(id + 'Daten'), stats = $(id + 'Stats');
      if (daten.skInhalt !== inhalt) {
        daten.skInhalt = inhalt;
        daten.innerHTML = inhalt ? inhalt[0] : '';
        stats.innerHTML = inhalt ? inhalt[1] : '';
        stats.hidden = !inhalt || !inhalt[1];
      }
    }
    $('skGross').hidden = !vorschau.lol && !vorschau.mc;
    if ($('skDuoModus')) {
      $('skDuoModus').onchange = (e) => {
        if (!skDuoModi.has(e.target.value)) return;
        vorschau.duoModus = e.target.value;
        skDuoZeigen(vorschau);
      };
      skDuoZeigen(vorschau);
    }
  };
  zeigen();

  const laden = (fach, abfrage) => abfrage.catch(() => '').then((html) => {
    if (skDienstVorschau !== vorschau || syZustand !== 'ok' || syName !== vorschau.konto) return;
    vorschau[fach] = html;
    zeigen();
  });
  if (Date.now() - vorschau.lolZeit >= 60000) {
    vorschau.lolZeit = Date.now();
    laden('lol', skDienstJson('lol/daten?filter=jeder').then(async (d) => {
      if (!d) return '';
      const profilPfad = 'lol/person?id=' + encodeURIComponent(d.ichId);
      let profil = d.ichId && (d.quelle === 'riot' || d.meine?.length)
        ? await skDienstJson(profilPfad + '&filter=alle') : null;
      let kartenModus = 'Kluft';
      if (profil?.quelle === 'riot' && !profil.filterSpiele && !profil.spiele?.length && d.quelle === 'riot') {
        const weitere = await skDienstJson(profilPfad + '&filter=jeder').catch(() => null);
        if (weitere?.filterSpiele) {
          profil = weitere;
          kartenModus = 'Öffentliche Modi';
        }
      }
      vorschau.duos.set('jeder', { html: skDuoErgebnis(d, 'jeder'), zeit: Date.now() });
      return skZeigeLol(d, profil, kartenModus);
    }));
  }
  if (Date.now() - vorschau.mcZeit >= 60000) {
    vorschau.mcZeit = Date.now();
    laden('mc', skDienstJson('minecraft/info').then((i) => i && i.installiert ? skZeigeMinecraft(i) : ''));
  }
}
// Unten im Dashboard: zuletzt gespielt (mit Karte) und nächste Erfolge
function skUnten(D) {
  const b = document.querySelector('#screen-hub .spalte-b');
  if (!b) return;
  let box = $('skUnten');
  if (!box) { box = document.createElement('div'); box.id = 'skUnten'; box.className = 'sk-unten'; b.insertBefore(box, b.firstChild); }
  const letzte = D.E.slice().reverse().slice(0, 5);
  const naechste = skErfolgeStand(D).filter((a) => !a.fertig).sort((x, y) => y.ist / y.ziel - x.ist / x.ziel).slice(0, 3);
  const spiele = new Map(), tage = new Map();
  for (const e of D.E) {
    spiele.set(e.s, (spiele.get(e.s) || 0) + 1);
    if (e.t) tage.set(e.t, (tage.get(e.t) || 0) + 1);
  }
  const [favorit, runden] = [...spiele].sort((a, b) => b[1] - a[1])[0] || [];
  const titel = VERLAUF_SPIELE[favorit] && VERLAUF_SPIELE[favorit].name;
  const rekord = [...tage.values()].reduce((max, n) => Math.max(max, n), 0);
  box.innerHTML = (D.E.length ? '<section class="sk-spielfakten"><h2 class="hub-h">Deine Spiele in Zahlen</h2><div class="sk-kennzahlen">'
    + skKennzahl(skZahl(D.E.length), 'Runden insgesamt') + skKennzahl(skZahl(spiele.size), 'Spiele ausprobiert')
    + (rekord > 1 ? skKennzahl(skZahl(rekord), 'Runden am stärksten Spieltag') : '')
    + (titel && runden > 1 ? skKennzahl(skZahl(runden), 'Noch eine Runde? · ' + skText(titel)) : '') + '</div></section>' : '')
    + '<h2 class="hub-h">Zuletzt gespielt</h2>'
    + (letzte.length ? '<div class="sk-letzte">' + letzte.map((e, i) => { const sp = VERLAUF_SPIELE[e.s] || { emoji: '🎮', name: e.s }; const ziel = SK_SPIELE[e.s] && SK_SPIELE[e.s].hub; return '<div class="sk-letzt"><span>' + sp.emoji + '</span><div>' + (ziel && $(ziel) && !SK_AUSSORTIERT.karten.includes(ziel) ? '<button type="button" class="sk-erneut" data-spiel="' + ziel + '">' + skText(sp.name) + '</button>' : '<b>' + skText(sp.name) + '</b>') + '<small>' + skText(e.i) + '</small></div><i>' + (e.m ? fmt(e.p) + '/' + e.m : '') + '</i><button type="button" data-e="' + i + '" aria-label="Ergebnis-Karte">📤</button></div>'; }).join('') + '</div>' : '<p class="sk-fein">Noch nichts gespielt.</p>')
    + (naechste.length ? '<h2 class="hub-h"><span>🏆</span> Nächste Erfolge</h2><div class="sk-naechste">' + naechste.map((a) => '<div><span>' + a.emoji + '</span><div><b>' + a.name + '</b><div class="sk-mini"><i style="width:' + Math.round((a.ist / a.ziel) * 100) + '%"></i></div></div><small>' + a.ist + '/' + a.ziel + '</small></div>').join('') + '</div>' : '');
  box.querySelectorAll('[data-spiel]').forEach((x) => x.addEventListener('click', () => $(x.dataset.spiel).click()));
  box.querySelectorAll('[data-e]').forEach((x) => x.addEventListener('click', () => skKarteZeigen(skKarteEintrag(letzte[Number(x.dataset.e)]))));
}
// Spielkarten nach Kategorien gruppieren (die Knöpfe selbst bleiben dieselben, nur ihr Platz ändert sich)
function skKategorienEinrichten() {
  const a = document.querySelector('#screen-hub .spalte-a');
  if (!a || a.dataset.kategorien) return;
  a.dataset.kategorien = '1';
  const alt = a.querySelector('.hub-liste') || a, verlauf = $('hubVerlauf');
  const titel = document.createElement('section');
  titel.className = 'sk-spielesammlung';
  titel.innerHTML = '<img class="spielraum-motiv" src="bilder/spielekiste.webp" alt="Holzwürfel und Spielsteine auf einem beleuchteten Tisch"><h2>Spielekiste</h2>';
  const hub = $('screen-hub');
  hub.insertBefore(titel, hub.querySelector('.hub-spalten'));
  // Suche + Filter (am PC oben angeheftet, am Handy waagerecht wischbar)
  const filter = document.createElement('div');
  filter.className = 'sk-filter'; filter.id = 'skFilter';
  filter.innerHTML = '<input type="search" id="skSuche" placeholder="🔍 Spiel suchen …" autocomplete="off" aria-label="Spiel suchen">'
    + '<div class="sk-chips" role="group" aria-label="Kategorie"><button type="button" data-f="" aria-pressed="true">Alle Spiele</button><button type="button" data-f="fav" aria-pressed="false">⭐ Favoriten</button>'
    + SK_KATEGORIEN.map((k) => '<button type="button" data-f="' + k.id + '" aria-pressed="false">' + k.emoji + ' ' + k.name + '</button>').join('')
    + '<button type="button" data-f="archiv" aria-pressed="false">🗄️ Archiv</button></div>';
  a.appendChild(filter);
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
  // aussortierte Karten in ein unsichtbares Fach (die Spiele greifen weiter auf ihre Knöpfe zu)
  let fach = $('skAussortiert');
  if (!fach) { fach = document.createElement('div'); fach.id = 'skAussortiert'; fach.hidden = true; document.body.appendChild(fach); }
  SK_AUSSORTIERT.karten.forEach((id) => { const el = $(id); if (el) fach.appendChild(el); });
  // was keiner Kategorie zugeordnet ist, bleibt sichtbar
  const rest = [...alt.querySelectorAll(':scope > .hub-game')].filter((el) => !SK_ARCHIV.karten.includes(el.id));
  if (rest.length) { const liste = abschnitt('✨', 'Weitere', ''); rest.forEach((el) => liste.appendChild(el)); }
  // Archiv: eigenes aufklappbares Fach, in der vollständigen Liste zunächst offen
  const archiv = document.createElement('details');
  archiv.className = 'sk-kat sk-archiv'; archiv.id = 'skArchiv'; archiv.open = true;
  archiv.innerHTML = '<summary><h2 class="hub-h"><span>🗄️</span> Archiv <small id="skArchivZahl"></small></h2><span class="sk-archiv-pfeil" aria-hidden="true">▾</span></summary><div class="hub-liste"></div><div id="skArchivExtra"></div>';
  a.appendChild(archiv);
  SK_ARCHIV.karten.forEach((id) => { const el = $(id); if (el) archiv.querySelector('.hub-liste').appendChild(el); });
  if (alt !== a && !alt.children.length) alt.remove();
  if (verlauf) { const b = document.querySelector('#screen-hub .spalte-b'); if (b) b.appendChild(verlauf); }
  filter.querySelector('.sk-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    filter.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    skFilterAnwenden();
    const ziel = a.querySelector('.sk-kat:not([hidden])');
    if (ziel && innerWidth >= 1100 && filter.getBoundingClientRect().top <= 20) ziel.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  $('skSuche').addEventListener('input', skFilterAnwenden);
}
// Filter/Suche anwenden: Abschnitte und Karten ein-/ausblenden
function skFilterAnwenden() {
  const a = document.querySelector('#screen-hub .spalte-a'); if (!a) return;
  const f = (a.querySelector('.sk-chips [aria-pressed="true"]') || {}).dataset || {}, wahl = f.f || '', q = ($('skSuche') ? $('skSuche').value : '').trim().toLowerCase();
  const archiv = $('skArchiv');
  a.querySelectorAll('.sk-kat').forEach((sec) => {
    const id = sec.id === 'skFavoriten' ? 'fav' : sec.id === 'skArchiv' ? 'archiv' : (/sk-kat-(\w+)/.exec(sec.className) || [])[1] || '';
    let sichtbar = 0;
    sec.querySelectorAll('.hub-game').forEach((el) => {
      const passt = !q || el.textContent.toLowerCase().includes(q);
      el.hidden = !passt; if (passt) sichtbar++;
    });
    const gewaehlt = !wahl || wahl === id;
    sec.hidden = !gewaehlt || !sichtbar || (id === 'fav' && sec.dataset.leer === '1');
  });
  if (archiv && !archiv.hidden) archiv.open = wahl === 'archiv' || (!!q && wahl !== 'archiv' ? true : archiv.open);
  let nichts = $('skNichts');
  if (!nichts) { nichts = document.createElement('p'); nichts.id = 'skNichts'; nichts.className = 'sk-fein sk-nichts'; a.appendChild(nichts); }
  const leer = ![...a.querySelectorAll('.sk-kat')].some((s) => !s.hidden);
  nichts.hidden = !leer; nichts.textContent = q ? 'Kein Spiel gefunden für „' + q + '“.' : 'Hier ist noch nichts – mit ☆ an einer Karte landet sie in den Favoriten.';
}

// ---------- ⭐ Favoriten: Stern an jeder Karte, Favoriten stehen ganz oben (je Profil) ----------
const SK_FAV_KEY = 'walquiz.favoriten.v1';
function skFavIds() { const f = loadJson(SK_FAV_KEY); return Array.isArray(f.ids) ? f.ids : ['hubStudio']; }   // ohne Eintrag: Beat-Studio als Start-Favorit
function skFavUmschalten(id) {
  const ids = skFavIds().slice(), i = ids.indexOf(id);
  if (i >= 0) ids.splice(i, 1); else ids.push(id);
  saveJson(SK_FAV_KEY, { ids });
  skFavoriten();
}
function skFavoriten() {
  const a = document.querySelector('#screen-hub .spalte-a');
  if (!a) return;
  const ids = skFavIds().filter((id) => $(id) && !SK_AUSSORTIERT.karten.includes(id));
  let sec = $('skFavoriten');
  if (!sec) {
    sec = document.createElement('section'); sec.id = 'skFavoriten'; sec.className = 'sk-kat sk-kat-fav';
    sec.innerHTML = '<h2 class="hub-h"><span>⭐</span> Favoriten</h2><div class="hub-liste"></div>';
    a.insertBefore(sec, a.querySelector('.sk-kat:not(#skFilter)'));
  }
  const fav = sec.querySelector('.hub-liste');
  // erst alle Nicht-Favoriten zurück an ihren Platz (in der festen Reihenfolge), dann die Favoriten nach oben
  SK_KATEGORIEN.concat([{ id: 'archiv', karten: SK_ARCHIV.karten }]).forEach((k) => {
    const liste = k.id === 'archiv' ? a.querySelector('#skArchiv .hub-liste') : a.querySelector('.sk-kat-' + k.id + ' .hub-liste');
    if (liste) k.karten.forEach((id) => { const el = $(id); if (el && !ids.includes(id)) liste.appendChild(el); });
  });
  ids.forEach((id) => fav.appendChild($(id)));
  sec.dataset.leer = ids.length ? '' : '1';
  if ($('skArchivZahl')) $('skArchivZahl').textContent = a.querySelectorAll('#skArchiv .hub-game').length + ' Spiele';
  skFilterAnwenden();
  document.querySelectorAll('#screen-hub .hub-game').forEach((el) => {
    let s = el.querySelector('.hg-stern');
    if (!s) {
      s = document.createElement('span'); s.className = 'hg-stern'; s.setAttribute('role', 'button');
      ['pointerdown', 'mousedown', 'touchstart'].forEach((ev) => s.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
      s.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); skFavUmschalten(el.id); });
      el.appendChild(s);
    }
    const an = ids.includes(el.id), titel = (el.querySelector('.hg-titel') || el).textContent.trim();
    s.textContent = an ? '★' : '☆'; s.classList.toggle('an', an);
    s.setAttribute('aria-label', (an ? 'Aus den Favoriten entfernen: ' : 'Zu den Favoriten: ') + titel);
  });
}

// renderHub (hub.js) zeichnet die Startseite – danach die neue Schicht
if (typeof renderHub === 'function') {
  const skAltRenderHub = renderHub;
  // eslint-disable-next-line no-global-assign
  renderHub = function () { skAltRenderHub.apply(this, arguments); try { skDashboard(); } catch (e) { console.error(e); } };
}
$('skZurueck').addEventListener('click', () => { skVergleich = null; zeigeHub(); });
skDashboard();
