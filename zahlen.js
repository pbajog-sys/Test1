// 📊 Du in Zahlen: Geburtstag eingeben – dein Leben in belegten Zahlen.
// Grundsatz: Exakt Rechenbares (Alter, Tage, Erdumlauf, Licht) wird exakt gerechnet. Alles, was auf Durchschnitten beruht
// (Herzschlag, Atmung, Schlaf …), ist als Schätzung markiert. Statistiken stammen aus amtlichen Quellen (siehe ZL_QUELLEN).
// Alle Eingaben bleiben auf dem Gerät.
const ZL_KEY = 'walquiz.zahlen.v1';

// ---------- Daten ----------
// Weltbank (World Development Indicators, beruht auf UN World Population Prospects), Stand 08.10.2026, Jahre 1960–2025.
// Bevölkerung zur Jahresmitte in Millionen; Geburten- und Sterberate je 1000 Einwohner.
const ZL_POP = [3021.513, 3062.768, 3117.372, 3184.063, 3251.249, 3318.979, 3389.042, 3458.932, 3530.577, 3604.694, 3680.494, 3758.515, 3834.345, 3910.964,
  3987.187, 4061.960, 4135.644, 4208.841, 4283.309, 4359.931, 4437.473, 4516.793, 4599.386, 4682.735, 4765.813, 4850.494, 4937.460, 5026.770, 5116.899,
  5207.378, 5298.962, 5388.203, 5476.823, 5564.459, 5650.534, 5736.205, 5822.328, 5908.180, 5993.731, 6078.070, 6161.528, 6244.740, 6327.171, 6409.352,
  6492.355, 6575.410, 6659.536, 6744.049, 6830.081, 6916.168, 7000.860, 7086.704, 7176.482, 7265.405, 7353.532, 7441.085, 7528.222, 7613.789, 7696.160,
  7777.162, 7853.863, 7919.568, 7988.550, 8062.923, 8140.898, 8215.425];
const ZL_GEB = [32.00, 31.23, 35.16, 36.35, 35.19, 34.52, 33.48, 33.19, 33.32, 32.82, 32.57, 31.84, 31.38, 30.74, 29.89, 29.23, 28.43, 28.04, 27.78, 27.71,
  27.78, 28.25, 28.47, 27.89, 27.64, 27.64, 27.72, 27.61, 27.15, 26.67, 26.26, 25.64, 24.96, 24.56, 24.19, 23.79, 23.47, 23.13, 22.71, 22.30, 22.08, 21.75,
  21.42, 21.14, 20.96, 20.79, 20.64, 20.57, 20.52, 20.36, 20.19, 20.30, 20.41, 19.87, 19.77, 19.25, 19.29, 18.76, 18.19, 17.80, 17.15, 16.84, 16.56, 16.33, 16.27];
const ZL_TOD = [17.21, 14.56, 13.58, 13.43, 13.52, 13.33, 12.91, 12.62, 12.39, 12.23, 12.08, 12.22, 11.74, 11.47, 11.40, 11.33, 11.17, 10.89, 10.65, 10.41,
  10.37, 10.22, 10.14, 10.19, 10.06, 9.95, 9.76, 9.57, 9.51, 9.33, 9.30, 9.27, 9.17, 9.16, 9.19, 8.99, 8.89, 8.77, 8.71, 8.63, 8.51, 8.43, 8.36, 8.29, 8.19,
  8.14, 8.06, 8.01, 7.98, 7.90, 7.82, 7.76, 7.69, 7.63, 7.58, 7.58, 7.54, 7.53, 7.49, 7.47, 8.01, 8.71, 7.71, 7.59, 7.55];
// Lebenserwartung bei Geburt weltweit (Weltbank), 1960–2024
const ZL_LE_WELT = [50.94, 52.80, 55.29, 55.65, 56.10, 55.93, 56.45, 56.90, 57.34, 57.68, 57.94, 58.02, 58.84, 59.30, 59.70, 60.13, 60.45, 61.04, 61.39, 61.84,
  62.15, 62.52, 62.87, 63.13, 63.44, 63.73, 64.12, 64.46, 64.67, 64.96, 65.11, 65.30, 65.55, 65.74, 65.96, 66.20, 66.52, 66.83, 67.07, 67.31, 67.65, 67.95,
  68.23, 68.52, 68.77, 69.11, 69.47, 69.80, 70.00, 70.38, 70.68, 70.97, 71.26, 71.53, 71.78, 71.97, 72.19, 72.37, 72.64, 72.87, 72.18, 71.22, 72.97, 73.33, 73.48];
// CO₂ in der Luft, Jahresmittel Mauna Loa (NOAA GML), 1959–2025, ppm
const ZL_CO2 = [315.98, 316.91, 317.64, 318.45, 318.99, 319.62, 320.04, 321.37, 322.18, 323.05, 324.62, 325.68, 326.32, 327.46, 329.68, 330.19, 331.13, 332.03,
  333.84, 335.41, 336.84, 338.76, 340.12, 341.48, 343.15, 344.87, 346.35, 347.61, 349.31, 351.69, 353.20, 354.45, 355.70, 356.54, 357.21, 358.96, 360.97,
  362.74, 363.88, 366.84, 368.54, 369.71, 371.32, 373.45, 375.98, 377.70, 379.98, 382.09, 384.02, 385.83, 387.64, 390.10, 391.85, 394.06, 396.74, 398.81,
  401.01, 404.41, 406.76, 408.72, 411.65, 414.21, 416.41, 418.53, 421.08, 424.61, 427.35];
// Lebenserwartung bei Geburt 2025, Destatis (Pressemitteilung Nr. 236 vom 7. Juli 2026)
const ZL_LE_DE = { w: 83.6, m: 79.1, w65: 86.2, m65: 83.2 };
// Lebenserwartung bei Geburt 2024 (Weltbank)
const ZL_LAENDER = [['🇸🇪', 'Schweden', 84.06], ['🇯🇵', 'Japan', 84.04], ['🇩🇪', 'Deutschland', 80.79], ['🇺🇸', 'USA', 78.89], ['🇨🇳', 'China', 78.02],
  ['🇧🇷', 'Brasilien', 76.02], ['🇲🇽', 'Mexiko', 75.26], ['🌍', 'Welt', 73.48], ['🇷🇺', 'Russland', 73.44], ['🇮🇳', 'Indien', 72.24], ['🇿🇦', 'Südafrika', 66.31],
  ['🇹🇩', 'Tschad', 55.24], ['🇳🇬', 'Nigeria', 54.64]];
// PRB: bis Mitte 2022 etwa 117 020 448 575 Menschen je geboren
const ZL_PRB = 117020448575;
// Sterne und ihre Entfernung in Lichtjahren (gerundet, gängige Katalogwerte)
const ZL_STERNE = [['Proxima Centauri', 4.24], ['Sirius', 8.6], ['Prokyon', 11.5], ['Altair', 16.7], ['Wega', 25.0], ['Pollux', 33.8], ['Arktur', 36.7],
  ['Kapella', 42.9], ['Aldebaran', 65.3], ['Regulus', 79.3], ['Spica', 250]];
const ZL_QUELLEN = [
  ['Weltbevölkerung, Geburten- und Sterberaten, Lebenserwartung weltweit und je Land', 'Weltbank, World Development Indicators (SP.POP.TOTL, SP.DYN.CBRT.IN, SP.DYN.CDRT.IN, SP.DYN.LE00.IN), beruht auf UN World Population Prospects; Stand 08.10.2026'],
  ['Lebenserwartung Deutschland 2025', 'Statistisches Bundesamt, Pressemitteilung Nr. 236 vom 7. Juli 2026 (Periodensterbetafel)'],
  ['CO₂-Konzentration', 'NOAA Global Monitoring Laboratory, Mauna Loa, Jahresmittel (vor 1974 Scripps Institution of Oceanography)'],
  ['Menschen, die je geboren wurden', 'Population Reference Bureau (PRB), „How Many People Have Ever Lived on Earth?“, Stand 2022'],
  ['Körperwerte (Puls, Atmung, Schlaf, Haare, Nägel)', 'typische Durchschnittswerte nach Altersstufe aus der medizinischen Literatur; jeder Mensch weicht davon ab'],
  ['Erdbahn, Erddrehung, Mond, Licht', 'astronomische Konstanten: mittlerer Sonnenabstand 149,6 Mio. km, synodischer Monat 29,53059 Tage, Lichtgeschwindigkeit; Umlauf der Sonne um das Milchstraßenzentrum ca. 230 km/s'],
];

// ---------- Rechnen ----------
const ZL_JAHR_MS = 365.2425 * 864e5;
const zlJahrIndex = (j) => Math.max(0, Math.min(ZL_POP.length - 1, j - 1960));
// Weltbevölkerung zu einem Zeitpunkt: lineare Interpolation zwischen den Jahresmitten, danach mit dem letzten Zuwachs fortgeschrieben
function zlWeltPop(t) {
  const j = t.getFullYear() + (t - new Date(t.getFullYear(), 0, 1)) / ZL_JAHR_MS - 0.5;
  const i = Math.floor(j - 1960), f = j - 1960 - i, n = ZL_POP.length;
  if (i < 0) return ZL_POP[0] * 1e6;
  if (i >= n - 1) return (ZL_POP[n - 1] + (ZL_POP[n - 1] - ZL_POP[n - 2]) * (j - 1960 - (n - 1))) * 1e6;
  return (ZL_POP[i] + (ZL_POP[i + 1] - ZL_POP[i]) * f) * 1e6;
}
// Geburten bzw. Sterbefälle weltweit zwischen zwei Zeitpunkten (Rate × Bevölkerung, tageweise aufsummiert, Jahre nach 2024 mit Rate 2024)
function zlSumme(von, bis, raten) {
  let s = 0;
  for (let t = new Date(Math.max(von, new Date(1960, 0, 1))); t < bis; t = new Date(t.getTime() + 7 * 864e5)) {
    const tage = Math.min(7, (bis - t) / 864e5);
    const rate = raten[Math.min(raten.length - 1, Math.max(0, t.getFullYear() - 1960))];
    s += rate / 1000 * zlWeltPop(t) * tage / 365.2425;
  }
  return s;
}
// Durchschnittswerte je Altersstufe (bis Alter in Jahren): Ruhepuls/min, Atemzüge/min, Schlaf h/Tag
const ZL_KOERPER = [[1, 120, 40, 14], [3, 110, 30, 12.5], [6, 95, 25, 11], [12, 85, 20, 10], [18, 75, 17, 9], [999, 70, 14, 7.5]];
function zlKoerper(geburt, jetzt) {
  let herz = 0, atem = 0, schlaf = 0;
  const alterJ = (jetzt - geburt) / ZL_JAHR_MS;
  let ab = 0;
  ZL_KOERPER.forEach(([bis, puls, at, sch]) => {
    const dauer = Math.max(0, Math.min(alterJ, bis) - ab);
    const min = dauer * 365.2425 * 1440;
    herz += puls * min; atem += at * min; schlaf += sch / 24 * dauer;
    ab = bis;
  });
  const wachMin = (alterJ - schlaf) * 365.2425 * 1440;
  return { herz, atem, schlaf, blinzeln: 15 * wachMin, haare: alterJ * 12 * 1.25, naegel: alterJ * 12 * 0.35 };
}
// Alter in Jahren, Monaten, Tagen (Kalender)
function zlAlter(g, j) {
  let jahre = j.getFullYear() - g.getFullYear(), monate = j.getMonth() - g.getMonth(), tage = j.getDate() - g.getDate();
  if (tage < 0) { monate--; tage += new Date(j.getFullYear(), j.getMonth(), 0).getDate(); }
  if (monate < 0) { jahre--; monate += 12; }
  return { jahre, monate, tage };
}
// Nächste besondere Tage (runde Zahlen)
function zlMeilensteine(g, jetzt) {
  const ms = [];
  [5000, 10000, 15000, 20000, 25000, 30000].forEach((n) => ms.push([n.toLocaleString('de-DE') + '. Tag', new Date(g.getTime() + n * 864e5)]));
  [1e9, 2e9, 3e9].forEach((n) => ms.push([(n / 1e9) + ' Milliarde' + (n > 1e9 ? 'n' : '') + ' Sekunden', new Date(g.getTime() + n * 1000)]));
  [100000, 250000, 500000].forEach((n) => ms.push([n.toLocaleString('de-DE') + ' Stunden', new Date(g.getTime() + n * 3600e3)]));
  [1000, 2000, 3000, 4000].forEach((n) => ms.push([n.toLocaleString('de-DE') + ' Wochen', new Date(g.getTime() + n * 7 * 864e5)]));
  [500, 1000].forEach((n) => { const d = new Date(g); d.setMonth(d.getMonth() + n); ms.push([n.toLocaleString('de-DE') + ' Monate', d]); });
  ms.sort((a, b) => a[1] - b[1]);
  const kommend = ms.filter((m) => m[1] > jetzt).slice(0, 4);
  const vorbei = ms.filter((m) => m[1] <= jetzt).slice(-2);
  return { kommend, vorbei };
}

// ---------- Formatieren ----------
const zlZahl = (n) => Math.round(n).toLocaleString('de-DE');
function zlGross(n) {
  const a = Math.abs(n);
  if (a >= 1e12) return fmt((n / 1e12).toFixed(2)) + ' Billionen';
  if (a >= 1e9) return fmt((n / 1e9).toFixed(a >= 1e11 ? 0 : 2)) + ' Milliarden';
  if (a >= 1e6) return fmt((n / 1e6).toFixed(a >= 1e8 ? 0 : 1)) + ' Millionen';
  return zlZahl(n);
}
const zlDatum = (d) => d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const zlKarte = (emoji, titel, wert, text, art) => '<div class="zl-karte' + (art ? ' ' + art : '') + '"><span class="zl-k-emoji">' + emoji + '</span><div><small>' + titel + '</small><b>' + wert + '</b>' + (text ? '<p>' + text + '</p>' : '') + '</div></div>';

// ---------- Anzeige ----------
let zlTimer = null;
function zahlenIntro() {
  const st = loadJson(ZL_KEY);
  $('zlDatum').value = st.datum || '';
  $('zlZeit').value = st.zeit || '';
  $('zlGeschlecht').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.g === (st.g || 'x')));
  $('zlDatum').max = new Date().toISOString().slice(0, 10);
  if (st.datum) zlBerechnen(); else { $('zlErgebnis').hidden = true; clearInterval(zlTimer); }
}
function zlGeburt() {
  const st = loadJson(ZL_KEY);
  if (!st.datum) return null;
  const [y, m, d] = st.datum.split('-').map(Number), [hh, mm] = (st.zeit || '12:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
}
function zlBerechnen() {
  const g = zlGeburt(), jetzt = new Date();
  if (!g || g > jetzt || g.getFullYear() < 1900) { $('zlErgebnis').hidden = true; $('zlHinweis').textContent = g ? 'Bitte ein Datum zwischen 1900 und heute.' : ''; return; }
  $('zlHinweis').textContent = '';
  const st = loadJson(ZL_KEY), geschlecht = st.g || 'x';
  const a = zlAlter(g, jetzt), tage = (jetzt - g) / 864e5, jahreExakt = (jetzt - g) / ZL_JAHR_MS;
  const ohneZeit = !st.zeit;
  $('zlErgebnis').hidden = false;

  // 1. Alter
  $('zlAlter').innerHTML = '<div class="zl-alter-gross">' + a.jahre + '<small> Jahre</small> ' + a.monate + '<small> Monate</small> ' + a.tage + '<small> Tage</small></div>'
    + '<div class="zl-raster4">' + [['Tage', zlZahl(Math.floor(tage))], ['Wochen', zlZahl(Math.floor(tage / 7))], ['Stunden', zlZahl(Math.floor(tage * 24))], ['Sekunden', '<span id="zlSek"></span>']].map(([t, w]) => '<div><b>' + w + '</b><small>' + t + '</small></div>').join('') + '</div>'
    + (ohneZeit ? '<p class="zl-fuss">Ohne Uhrzeit rechne ich mit 12 Uhr mittags.</p>' : '');
  clearInterval(zlTimer);
  const tick = () => { const el = $('zlSek'); if (!el || !$('screen-zahlen').classList.contains('active')) { clearInterval(zlTimer); return; } el.textContent = zlZahl((Date.now() - g) / 1000); };
  tick(); zlTimer = setInterval(tick, 1000);
  const nb = new Date(jetzt.getFullYear(), g.getMonth(), g.getDate()); if (nb <= jetzt) nb.setFullYear(nb.getFullYear() + 1);
  const M = zlMeilensteine(g, jetzt);
  $('zlMeilen').innerHTML = '<li class="zl-geb">🎂 <b>' + (a.jahre + 1) + '. Geburtstag</b> in ' + zlZahl(Math.ceil((nb - jetzt) / 864e5)) + ' Tagen</li>'
    + M.kommend.map(([t, d]) => '<li>⏳ <b>' + t + '</b> am ' + zlDatum(d) + '</li>').join('')
    + M.vorbei.map(([t, d]) => '<li class="vorbei">✓ ' + t + ' war am ' + d.toLocaleDateString('de-DE') + '</li>').join('');

  // 2. Lebenswochen
  zlWochen(g, jetzt, geschlecht);

  // 3. Körper (Schätzungen)
  const K = zlKoerper(g, jetzt);
  $('zlKoerper').innerHTML = zlKarte('❤️', 'Herzschläge', 'etwa ' + zlGross(K.herz), 'mit dem durchschnittlichen Ruhepuls je Alter – mit Bewegung eher mehr', 'schaetz')
    + zlKarte('🫁', 'Atemzüge', 'etwa ' + zlGross(K.atem), 'Babys atmen etwa 40-mal pro Minute, Erwachsene 12- bis 16-mal', 'schaetz')
    + zlKarte('😴', 'Geschlafen', 'etwa ' + fmt(K.schlaf.toFixed(1)) + ' Jahre', 'rund ' + Math.round(K.schlaf / jahreExakt * 100) + ' % deines Lebens', 'schaetz')
    + zlKarte('👁️', 'Geblinzelt', 'etwa ' + zlGross(K.blinzeln), '15-mal pro wache Minute', 'schaetz')
    + zlKarte('💇', 'Haare gewachsen', 'etwa ' + fmt(Math.round(K.haare) / 100) + ' m', 'ein Haar wächst gut 1 cm im Monat – wenn man es nie schneiden würde', 'schaetz')
    + zlKarte('💅', 'Fingernägel gewachsen', 'etwa ' + fmt(Math.round(K.naegel)) + ' cm', 'pro Nagel, rund 3,5 mm im Monat', 'schaetz');

  // 4. Kosmos (exakt)
  const lj = jahreExakt;
  const sterne = ZL_STERNE.filter((s) => s[1] <= lj), naechster = ZL_STERNE.find((s) => s[1] > lj);
  $('zlKosmos').innerHTML = zlKarte('☀️', 'Mit der Erde um die Sonne', zlGross(jahreExakt * 939.9e6) + ' km', 'Ein Umlauf sind 940 Millionen km, mit 107 000 km/h.')
    + zlKarte('🌍', 'Erddrehung (in Deutschland)', zlGross(tage * 24 * 1050) + ' km', 'Auf 51° Nord dreht dich die Erde mit rund 1050 km/h mit.')
    + zlKarte('🌕', 'Vollmonde erlebt', 'etwa ' + zlZahl(tage / 29.530589), 'alle 29,53 Tage einer')
    + zlKarte('🌌', 'Mit der Sonne durch die Milchstraße', zlGross(jahreExakt * 365.2425 * 86400 * 230) + ' km', 'Unser Sonnensystem rast mit rund 230 km/s um das Zentrum der Galaxis.', 'schaetz')
    + zlKarte('✨', 'Licht von deinem Geburtstag', fmt(lj.toFixed(2)) + ' Lichtjahre', 'So weit ist das Licht, das am Tag deiner Geburt von der Erde losflog, schon gekommen.'
      + (sterne.length ? ' Es hat <b>' + sterne.map((s) => s[0]).join(', ') + '</b> schon erreicht.' : '') + (naechster ? ' Als Nächstes: ' + naechster[0] + ' (' + fmt(naechster[1]) + ' Lj.).' : ''));

  // 5. Menschheit
  const vor1960 = g.getFullYear() < 1960;
  const popG = zlWeltPop(g), popJ = zlWeltPop(jetzt);
  const geb = zlSumme(g, jetzt, ZL_GEB), tod = zlSumme(g, jetzt, ZL_TOD);
  const prb2022 = new Date(2022, 6, 1);
  const rang = g < prb2022 ? ZL_PRB - zlSumme(g, prb2022, ZL_GEB) : ZL_PRB + zlSumme(prb2022, g, ZL_GEB);
  const gj = g.getFullYear(), leG = ZL_LE_WELT[Math.min(ZL_LE_WELT.length - 1, zlJahrIndex(gj))], co2G = ZL_CO2[Math.max(0, Math.min(ZL_CO2.length - 1, gj - 1959))];
  $('zlWelt').innerHTML = (vor1960 ? '<p class="zl-fuss">Die Weltbank-Reihen beginnen 1960 – für frühere Jahre nehme ich die Werte von 1960 (Bevölkerung) bzw. zähle Geburten erst ab 1960.</p>' : '')
    + zlKarte('👶', 'Menschen bei deiner Geburt', zlGross(popG), 'Heute sind es etwa ' + zlGross(popJ) + ' – ' + (popJ / popG >= 1.995 ? 'mehr als doppelt so viele' : '+' + Math.round((popJ / popG - 1) * 100) + ' %') + '.')
    + zlKarte('🍼', 'Seitdem geboren', 'etwa ' + zlGross(geb), 'Weltweit kommen pro Sekunde rund 4 Babys zur Welt.')
    + zlKarte('🕯️', 'Seitdem gestorben', 'etwa ' + zlGross(tod), 'Die Differenz ist das Wachstum der Menschheit.')
    + (vor1960 ? '' : zlKarte('🔢', 'Du bist ungefähr Mensch Nr.', zlGross(rang), 'seit es Menschen gibt – grobe Schätzung des Population Reference Bureau. Vor dir lebten also gut ' + Math.round(rang / 1e9) + ' Milliarden.', 'schaetz'))
    + zlKarte('📈', 'Lebenserwartung weltweit', fmt(leG.toFixed(1)) + ' → ' + fmt(ZL_LE_WELT[ZL_LE_WELT.length - 1].toFixed(1)) + ' Jahre', 'bei deiner Geburt' + (gj < 1960 ? ' (1960)' : '') + ' → heute (2024)')
    + zlKarte('🏭', 'CO₂ in der Luft', fmt(co2G.toFixed(0)) + ' → ' + fmt(ZL_CO2[ZL_CO2.length - 1].toFixed(0)) + ' ppm', (gj < 1959 ? '1959' : 'In deinem Geburtsjahr') + ' → 2025 (+' + Math.round((ZL_CO2[ZL_CO2.length - 1] / co2G - 1) * 100) + ' %). Vor der Industrialisierung waren es rund 280 ppm.');

  // 6. Wärst du woanders geboren
  const max = 90;
  $('zlLaender').innerHTML = ZL_LAENDER.map(([f, n, le]) => '<div class="zl-land' + (n === 'Deutschland' ? ' de' : '') + '"><span>' + f + ' ' + n + '</span><div class="zl-balken"><i style="width:' + (le / max * 100) + '%"></i>'
    + '<em style="left:' + Math.min(100, jahreExakt / max * 100) + '%"></em></div><b>' + fmt(le.toFixed(1)) + '</b></div>').join('')
    + '<p class="zl-fuss">Lebenserwartung bei Geburt 2024 (Weltbank). Der Strich zeigt dein heutiges Alter. Zwischen Schweden und Nigeria liegen fast 30 Jahre – nur wegen des Geburtsorts.</p>';
}

// Lebenswochen-Raster: 90 Zeilen (Jahre) × 52 Wochen
function zlWochen(g, jetzt, geschlecht) {
  const cv = $('zlWochenBild'), ctx = cv.getContext('2d'), J = 90, W = 52, z = 6, gap = 1.6, rand = 22;
  const dpr = window.devicePixelRatio || 1;
  const breite = rand + W * (z + gap), hoehe = J * (z + gap) + 4;
  cv.width = breite * dpr; cv.height = hoehe * dpr; cv.style.aspectRatio = breite + ' / ' + hoehe;
  ctx.scale(dpr, dpr);
  const gelebt = (jetzt - g) / (7 * 864e5);
  const le = geschlecht === 'w' ? [ZL_LE_DE.w] : geschlecht === 'm' ? [ZL_LE_DE.m] : [ZL_LE_DE.m, ZL_LE_DE.w];
  for (let j = 0; j < J; j++) {
    if (j % 10 === 0) { ctx.fillStyle = '#7a7f8c'; ctx.font = '600 8px Outfit, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(String(j), rand - 5, j * (z + gap) + z); }
    for (let w = 0; w < W; w++) {
      const n = j * 52.1775 + w;
      const x = rand + w * (z + gap), y = j * (z + gap);
      ctx.fillStyle = n < gelebt - 1 ? '#0f766e' : n < gelebt ? '#f59e0b' : (le.some((l) => j < Math.floor(l) || (j === Math.floor(l) && w < (l % 1) * 52)) ? '#c5ced9' : '#eef1f5');
      ctx.fillRect(x, y, z, z);
    }
  }
  const proz = Math.round(gelebt / (Math.max(...le) * 52.1775) * 100);
  $('zlWochenText').innerHTML = 'Jedes Kästchen ist eine Woche, jede Zeile ein Jahr. <b>' + zlZahl(Math.floor(gelebt)) + ' Wochen</b> hast du gelebt (grün), die orange ist diese Woche. '
    + 'Hellgrau ist die durchschnittliche Lebenserwartung bei Geburt in Deutschland (Destatis 2025: ' + (geschlecht === 'w' ? 'Frauen ' + fmt(ZL_LE_DE.w) : geschlecht === 'm' ? 'Männer ' + fmt(ZL_LE_DE.m) : 'Männer ' + fmt(ZL_LE_DE.m) + ', Frauen ' + fmt(ZL_LE_DE.w)) + ' Jahre)'
    + (proz < 100 ? ' – davon ' + proz + ' % gelebt.' : '.')
    + '<br><small>Das ist keine Vorhersage für dich: Sie beschreibt heutige Sterblichkeit, und wer älter wird, hat im Schnitt mehr vor sich. Wer 65 ist, wird statistisch ' + fmt(ZL_LE_DE.m65) + ' (Männer) bzw. ' + fmt(ZL_LE_DE.w65) + ' (Frauen).</small>';
}

// ---------- Knöpfe ----------
function zlSpeichern() {
  const st = loadJson(ZL_KEY);
  st.datum = $('zlDatum').value; st.zeit = $('zlZeit').value;
  saveJson(ZL_KEY, st);
  zlBerechnen();
}
$('zlDatum').addEventListener('change', zlSpeichern);
$('zlZeit').addEventListener('change', zlSpeichern);
$('zlGeschlecht').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  const st = loadJson(ZL_KEY); st.g = b.dataset.g; saveJson(ZL_KEY, st);
  $('zlGeschlecht').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  zlBerechnen();
}));
$('zlQuellen').innerHTML = ZL_QUELLEN.map(([w, q]) => '<li><b>' + w + ':</b> ' + q + '</li>').join('');
$('zlZurueck').addEventListener('click', () => { clearInterval(zlTimer); zeigeHub(); });
$('hubZahlen').addEventListener('click', () => { merkeZuletzt('zahlen'); zoomZu($('hubZahlen'), () => { show('zahlen', '📊 Du in Zahlen'); zahlenIntro(); }); });
