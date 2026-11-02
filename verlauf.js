// 📅 Verlauf & Statistik: Jedes Spiel meldet beim Ende einen Eintrag (merkeVerlauf). Gespeichert je Profil, die letzten 400 Tage.
// Anzeige: Tagesserie, Kalender der letzten 15 Wochen, je Spiel Anzahl, Bestwert, Schnitt und Verlaufskurve, Einträge eines Tages.
const VERLAUF_KEY = 'walquiz.verlauf.v1';
const VERLAUF_SPIELE = {
  quiz: { name: 'Quizzes', emoji: '🐋', farbe: '#38bdf8' },
  farben: { name: 'Farb-Gedächtnis', emoji: '🎨', farbe: '#f472b6' },
  cello: { name: 'Noten & Griffe', emoji: '🎻', farbe: '#d6a35c' },
  toene: { name: 'Ton-Gedächtnis', emoji: '🎧', farbe: '#67e8f9' },
  takt: { name: 'Takt-Gefühl', emoji: '⏱️', farbe: '#ff8a3d' },
  punkte: { name: 'Punktwolke', emoji: '📈', farbe: '#fde047' },
  augen: { name: 'Augenmaß', emoji: '📐', farbe: '#5eead4' },
  karte: { name: 'Karten-Gefühl', emoji: '🧭', farbe: '#34d399' },
  tiefgang: { name: 'Tiefgang', emoji: '🤿', farbe: '#22d3ee' },
  riff: { name: 'Riffbau', emoji: '🎲', farbe: '#fb7185' },
  krimi: { name: 'Wer war’s?', emoji: '🔎', farbe: '#ef4444' },
};
const tagSchluessel = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

// Ein Spiel ist zu Ende: spiel (Schlüssel aus VERLAUF_SPIELE), punkte/max (z. B. 38,2 von 50) und eine kurze Beschreibung
function merkeVerlauf(spiel, punkte, max, info) {
  try {
    const v = loadJson(VERLAUF_KEY);
    v.tage = v.tage || {};
    const t = tagSchluessel();
    (v.tage[t] = v.tage[t] || []).push({ s: spiel, p: Math.round(Number(punkte) * 10) / 10, m: max, i: String(info || '').slice(0, 60), z: Date.now() });
    if (v.tage[t].length > 80) v.tage[t] = v.tage[t].slice(-80);
    const alle = Object.keys(v.tage).sort();
    alle.slice(0, Math.max(0, alle.length - 400)).forEach((k) => delete v.tage[k]);
    saveJson(VERLAUF_KEY, v);
  } catch (e) { /* Verlauf ist nur Zugabe */ }
}

function verlaufDaten() {
  const tage = loadJson(VERLAUF_KEY).tage || {};
  const eintraege = Object.entries(tage).flatMap(([t, l]) => l.map((e) => ({ ...e, t })));
  // Serie: aufeinanderfolgende Tage bis heute (oder bis gestern, wenn heute noch nichts gespielt wurde)
  let serie = 0;
  const d = new Date();
  if (!tage[tagSchluessel(d)]) d.setDate(d.getDate() - 1);
  while (tage[tagSchluessel(d)]) { serie++; d.setDate(d.getDate() - 1); }
  let laengste = 0, lauf = 0, vorher = null;
  Object.keys(tage).sort().forEach((k) => {
    const dt = new Date(k + 'T12:00:00');
    lauf = vorher && Math.round((dt - vorher) / 864e5) === 1 ? lauf + 1 : 1;
    laengste = Math.max(laengste, lauf); vorher = dt;
  });
  return { tage, eintraege, serie, laengste };
}

// Kleine Verlaufskurve (letzte 15 Ergebnisse in Prozent)
function sparkline(werte, farbe) {
  if (werte.length < 2) return '<svg class="vl-spark" viewBox="0 0 120 34"><text x="60" y="21">' + (werte.length ? 'erst 1 Runde' : '–') + '</text></svg>';
  const W = 120, H = 34, x = (i) => 4 + i * (W - 8) / (werte.length - 1), y = (v) => H - 4 - v * (H - 8);
  const pfad = werte.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join('');
  return '<svg class="vl-spark" viewBox="0 0 ' + W + ' ' + H + '"><path d="' + pfad + 'L' + x(werte.length - 1) + ' ' + H + 'L4 ' + H + 'Z" fill="' + farbe + '" opacity=".18"/>'
    + '<path d="' + pfad + '" fill="none" stroke="' + farbe + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'
    + '<circle cx="' + x(werte.length - 1) + '" cy="' + y(werte[werte.length - 1]) + '" r="3.4" fill="' + farbe + '"/></svg>';
}

let verlaufGewaehlt = null;
function zeigeVerlauf() {
  const { tage, eintraege, serie, laengste } = verlaufDaten();
  const heuteL = tage[tagSchluessel()] || [];
  $('vlSerie').textContent = serie;
  $('vlSerieText').textContent = serie === 1 ? 'Tag in Folge' : 'Tage in Folge';
  $('vlHeute').textContent = heuteL.length;
  $('vlGesamt').textContent = eintraege.length;
  $('vlLaengste').textContent = laengste;
  // Kalender: 15 Wochen, Montag oben, heute unten rechts
  const kal = $('vlKalender');
  kal.innerHTML = '';
  const start = new Date(); start.setHours(12, 0, 0, 0);
  const wtag = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - wtag - 14 * 7);
  const maxTag = Math.max(1, ...Object.values(tage).map((l) => l.length));
  for (let i = 0; i < 15 * 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = tagSchluessel(d), n = (tage[k] || []).length, zukunft = d > new Date();
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'vl-tag' + (zukunft ? ' leer' : '') + (k === (verlaufGewaehlt || tagSchluessel()) ? ' gewaehlt' : '');
    b.style.setProperty('--s', n ? 0.25 + 0.75 * n / maxTag : 0);
    b.title = d.toLocaleDateString('de-DE') + ': ' + n + (n === 1 ? ' Spiel' : ' Spiele');
    b.setAttribute('aria-label', b.title);
    if (!zukunft) b.addEventListener('click', () => { verlaufGewaehlt = k; zeigeVerlauf(); });
    kal.appendChild(b);
  }
  // Je Spiel
  const box = $('vlSpiele');
  box.innerHTML = '';
  const proSpiel = Object.entries(VERLAUF_SPIELE).map(([id, S]) => ({ id, S, l: eintraege.filter((e) => e.s === id).sort((a, b) => a.z - b.z) }))
    .filter((x) => x.l.length).sort((a, b) => b.l.length - a.l.length);
  $('vlLeer').hidden = proSpiel.length > 0;
  proSpiel.forEach(({ S, l }) => {
    const proz = l.filter((e) => e.m).map((e) => Math.max(0, Math.min(1, e.p / e.m)));
    const best = l.filter((e) => e.m).reduce((a, e) => (!a || e.p / e.m > a.p / a.m ? e : a), null);
    const letzte7 = proz.slice(-7);
    const schnitt = letzte7.length ? Math.round(letzte7.reduce((a, b) => a + b, 0) / letzte7.length * 100) : null;
    const k = document.createElement('div');
    k.className = 'vl-spiel';
    k.style.setProperty('--f', S.farbe);
    k.innerHTML = '<span class="vl-emoji"></span><div class="vl-info"><b></b><small></small></div>' + sparkline(proz.slice(-15), S.farbe);
    k.querySelector('.vl-emoji').textContent = S.emoji;
    k.querySelector('b').textContent = S.name;
    k.querySelector('small').textContent = l.length + (l.length === 1 ? ' Runde' : ' Runden')
      + (best ? ' · Bestwert ' + fmt(best.p) + ' / ' + best.m : '') + (schnitt != null ? ' · zuletzt Ø ' + schnitt + ' %' : '');
    box.appendChild(k);
  });
  // Ein Tag im Detail
  const tag = verlaufGewaehlt || tagSchluessel();
  const liste = (tage[tag] || []).slice().sort((a, b) => b.z - a.z);
  const datum = new Date(tag + 'T12:00:00');
  $('vlTagTitel').textContent = tag === tagSchluessel() ? 'Heute' : datum.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  const tl = $('vlTagListe');
  tl.innerHTML = '';
  if (!liste.length) tl.innerHTML = '<li class="vl-nichts">An diesem Tag wurde nichts gespielt.</li>';
  liste.forEach((e) => {
    const S = VERLAUF_SPIELE[e.s] || { emoji: '🎮', name: e.s };
    const li = document.createElement('li');
    li.innerHTML = '<span class="vl-zeit"></span><span class="vl-was"></span><b></b>';
    li.querySelector('.vl-zeit').textContent = new Date(e.z).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    li.querySelector('.vl-was').textContent = S.emoji + ' ' + S.name + (e.i ? ' · ' + e.i : '');
    li.querySelector('b').textContent = e.m ? fmt(e.p) + ' / ' + e.m : e.i ? '✓' : fmt(e.p);
    tl.appendChild(li);
  });
}

// Kleine Karte im Dashboard
function verlaufKarte() {
  const { tage, serie } = verlaufDaten();
  const n = (tage[tagSchluessel()] || []).length;
  $('hubVerlaufSerie').textContent = serie ? '🔥 ' + serie + (serie === 1 ? ' Tag' : ' Tage') : '🔥 0';
  $('hubVerlaufText').textContent = n ? 'Heute ' + n + (n === 1 ? ' Spiel' : ' Spiele') + ' gespielt' : serie ? 'Heute noch nicht gespielt – halte deine Serie!' : 'Spiel heute etwas und starte eine Serie';
  // Mini-Woche: die letzten 7 Tage als Punkte
  const w = $('hubVerlaufWoche');
  w.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = tagSchluessel(d), dot = document.createElement('i');
    if (tage[k]) dot.className = 'an';
    dot.title = d.toLocaleDateString('de-DE', { weekday: 'short' });
    w.appendChild(dot);
  }
}

$('hubVerlauf').addEventListener('click', () => { verlaufGewaehlt = null; zoomZu($('hubVerlauf'), () => { show('verlauf', '📅 Verlauf'); zeigeVerlauf(); }); });
$('vlZurueck').addEventListener('click', () => zeigeHub());
