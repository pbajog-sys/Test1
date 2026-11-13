// 🧵 Nähstube – gemütliche Schneiderei. Eigene Figuren, eigene Grafik.
// Ablauf eines Tages: Auftrag annehmen → Stoff kaufen → im Skizzenbuch entwerfen → Schnittteile auf dem Stoff anordnen
// (gerader Fadenlauf oder schräg – das sieht man am Kleid) → zuschneiden → nähen → verzieren → abgeben.
// Dazu: Schaufenster (Kleider von der Stange verkaufen), Lookbook und Kater Zwirn zum Streicheln.
const NS_KEY = 'walquiz.naehstube.v1';
// ---------- Stoffe ----------
// fall = wie weich er fällt, glanz, waerme (0–5)
const NS_STOFFE = {
  baumwolle: { n: 'Baumwolle', preis: 4, fall: 2, glanz: 1, waerme: 2, t: 'Alltagstauglich, leicht zu nähen.' },
  leinen: { n: 'Leinen', preis: 6, fall: 1, glanz: 0, waerme: 1, t: 'Kühl und natürlich – perfekt für den Sommer.' },
  wolle: { n: 'Wolle', preis: 9, fall: 2, glanz: 0, waerme: 5, t: 'Warm und edel für kalte Tage.' },
  samt: { n: 'Samt', preis: 12, fall: 3, glanz: 3, waerme: 4, t: 'Weich, tief in der Farbe – Bühne und Winterball.' },
  chiffon: { n: 'Chiffon', preis: 11, fall: 5, glanz: 2, waerme: 0, t: 'Hauchzart und fließend.' },
  seide: { n: 'Seide', preis: 16, fall: 4, glanz: 5, waerme: 1, t: 'Glänzend und kostbar – für große Anlässe.' },
};
const NS_FARBEN = {
  creme: ['Creme', '#f4ead5', 'hell'], rose: ['Rosé', '#f4b6c2', 'rot'], rot: ['Kirschrot', '#c81e3a', 'rot'], bordeaux: ['Bordeaux', '#6d1a2c', 'rot'],
  senf: ['Senfgelb', '#d9a521', 'gelb'], salbei: ['Salbei', '#9db59a', 'gruen'], tanne: ['Tannengrün', '#1f5240', 'gruen'],
  himmel: ['Himmelblau', '#9cc8ef', 'blau'], marine: ['Marineblau', '#1d2b53', 'blau'], flieder: ['Flieder', '#b9a4dc', 'lila'], schwarz: ['Schwarz', '#22212a', 'dunkel'], weiss: ['Weiß', '#fbfbf8', 'hell'],
};
const NS_MUSTER = { uni: 'uni', streifen: 'Streifen', punkte: 'Punkte', karo: 'Karo', blumen: 'Blumen' };
// ---------- Entwurf ----------
const NS_TEILE = {
  oberteil: { n: 'Ausschnitt', o: { rund: 'Rundhals', v: 'V-Ausschnitt', herz: 'Herzausschnitt', carmen: 'Schulterfrei' } },
  aermel: { n: 'Ärmel', o: { ohne: 'ohne', kurz: 'kurz', puff: 'Puffärmel', lang: 'lang' } },
  rock: { n: 'Rock', o: { etui: 'Etui', aline: 'A-Linie', glocke: 'Glocke', teller: 'Tellerrock' } },
  laenge: { n: 'Länge', o: { mini: 'Mini', knie: 'Knielang', midi: 'Midi', maxi: 'Maxi' } },
};
const NS_DEKO = { knopf: ['Knopf', '🔘'], schleife: ['Schleife', '🎀'], blume: ['Blüte', '🌸'], herz: ['Herz', '❤️'], stern: ['Stern', '⭐'], perle: ['Perle', '⚪'] };
// ---------- Anlässe: was der Stoff können sollte ----------
const NS_ANLAESSE = {
  sommerfest: { n: 'Sommerfest', waerme: [0, 2], glanz: [0, 2], fall: [1, 4], deko: [1, 5] },
  hochzeit: { n: 'Hochzeit (Gast)', waerme: [0, 3], glanz: [2, 5], fall: [3, 5], deko: [1, 4] },
  braut: { n: 'eigene Hochzeit', waerme: [0, 3], glanz: [3, 5], fall: [3, 5], deko: [2, 6] },
  winterball: { n: 'Winterball', waerme: [3, 5], glanz: [2, 5], fall: [2, 5], deko: [1, 5] },
  buero: { n: 'Vorstellungsgespräch', waerme: [1, 4], glanz: [0, 2], fall: [1, 3], deko: [0, 2] },
  theater: { n: 'Theaterpremiere', waerme: [2, 5], glanz: [2, 5], fall: [2, 5], deko: [1, 4] },
  abiball: { n: 'Abiball', waerme: [0, 3], glanz: [2, 5], fall: [3, 5], deko: [2, 6] },
  alltag: { n: 'Alltag & Stadtbummel', waerme: [1, 3], glanz: [0, 2], fall: [1, 4], deko: [0, 3] },
};
// ---------- Kundschaft (eigene Figuren aus dem Städtchen Fadenbach) ----------
const NS_KUNDEN = [
  { id: 'rosi', n: 'Oma Rosi', e: '👵', t: 'feiert bald Goldene Hochzeit', anlaesse: ['hochzeit', 'theater'], farben: ['flieder', 'bordeaux', 'marine'], laengen: ['midi', 'maxi'], aermel: ['kurz', 'lang'], muster: ['uni', 'blumen'] },
  { id: 'mia', n: 'Mia', e: '👩‍🎓', t: 'hat gerade ihr Abitur geschafft', anlaesse: ['abiball'], farben: ['rose', 'himmel', 'rot', 'schwarz'], laengen: ['maxi', 'midi'], aermel: ['ohne'], muster: ['uni'] },
  { id: 'elif', n: 'Elif', e: '🧕', t: 'organisiert das Sommerfest am See', anlaesse: ['sommerfest', 'alltag'], farben: ['senf', 'salbei', 'himmel', 'creme'], laengen: ['knie', 'midi'], aermel: ['kurz', 'puff'], muster: ['blumen', 'punkte', 'streifen'] },
  { id: 'paula', n: 'Paula', e: '👩‍💼', t: 'hat ein wichtiges Vorstellungsgespräch', anlaesse: ['buero'], farben: ['marine', 'schwarz', 'tanne', 'bordeaux'], laengen: ['knie'], aermel: ['kurz', 'lang'], muster: ['uni', 'karo'] },
  { id: 'lena', n: 'Lena', e: '👰', t: 'heiratet im Mai', anlaesse: ['braut'], farben: ['weiss', 'creme'], laengen: ['maxi'], aermel: ['ohne', 'puff', 'lang'], muster: ['uni'] },
  { id: 'greta', n: 'Greta', e: '💃', t: 'spielt die Hauptrolle im Stadttheater', anlaesse: ['theater', 'winterball'], farben: ['rot', 'bordeaux', 'schwarz', 'tanne'], laengen: ['maxi', 'midi'], aermel: ['ohne', 'lang'], muster: ['uni'] },
  { id: 'jule', n: 'Jule', e: '🚲', t: 'radelt jeden Tag durch Fadenbach', anlaesse: ['alltag', 'sommerfest'], farben: ['salbei', 'senf', 'himmel', 'rose'], laengen: ['knie', 'mini'], aermel: ['kurz', 'ohne'], muster: ['streifen', 'punkte', 'karo'] },
  { id: 'hanne', n: 'Hanne', e: '❄️', t: 'tanzt jedes Jahr auf dem Winterball', anlaesse: ['winterball'], farben: ['tanne', 'marine', 'bordeaux', 'flieder'], laengen: ['maxi', 'midi'], aermel: ['lang', 'puff'], muster: ['uni'] },
];
const NS_TAG_TEXTE = { mini: 'kurz', knie: 'knielang', midi: 'wadenlang', maxi: 'bodenlang', ohne: 'ohne Ärmel', kurz: 'mit kurzen Ärmeln', puff: 'mit Puffärmeln', lang: 'mit langen Ärmeln', uni: 'einfarbig', streifen: 'gestreift', punkte: 'gepunktet', karo: 'kariert', blumen: 'mit Blümchen' };

let ns = null;
const nsZ = (a) => a[Math.floor(Math.random() * a.length)];
const nsFang = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch {} };
const nsEsc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function nsStore() {
  const s = loadJson(NS_KEY), ok = s && typeof s === 'object';
  return {
    muenzen: ok && Number.isFinite(s.muenzen) ? s.muenzen : 80, ruf: ok && Number.isFinite(s.ruf) ? s.ruf : 0, tag: ok && s.tag > 0 ? s.tag : 1,
    lager: ok && Array.isArray(s.lager) ? s.lager.filter((x) => x && NS_STOFFE[x.art] && NS_FARBEN[x.farbe] && NS_MUSTER[x.muster] && x.cm > 0) : [],
    kleider: ok && Array.isArray(s.kleider) ? s.kleider.slice(-40) : [], fenster: ok && Array.isArray(s.fenster) ? s.fenster.slice(0, 3) : [],
    auftrag: ok && s.auftrag && s.auftrag.kunde ? s.auftrag : null, streicheln: ok ? +s.streicheln || 0 : 0, angebot: ok && s.angebot && s.angebot.tag ? s.angebot : null,
  };
}
const nsSpeichern = (s) => saveJson(NS_KEY, s);
const nsStoffName = (x) => NS_FARBEN[x.farbe][0] + ' ' + (x.muster === 'uni' ? '' : NS_MUSTER[x.muster] + ' ') + NS_STOFFE[x.art].n;

// ---------- Kleid zeichnen (SVG, 300 × 420) ----------
function nsHelligkeit(hex, f) { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, m = (c) => Math.max(0, Math.min(255, Math.round(f > 0 ? c + (255 - c) * f : c * (1 + f)))); return '#' + [m(r), m(g), m(b)].map((c) => c.toString(16).padStart(2, '0')).join(''); }
let nsMusterNr = 0;
// Stoff als SVG-Muster; winkel = Fadenlauf (0 gerade, 45 schräg)
function nsStoffDefs(stoff, winkel, id) {
  const f = NS_FARBEN[stoff.farbe][1], dunkel = nsHelligkeit(f, -0.35), hell = nsHelligkeit(f, 0.55), akz = NS_FARBEN[stoff.farbe][2] === 'hell' ? '#c9a7b0' : hell;
  const rot = 'rotate(' + winkel + ')';
  const M = {
    uni: '<rect width="16" height="16" fill="' + f + '"/>',
    streifen: '<rect width="16" height="16" fill="' + f + '"/><rect width="5" height="16" fill="' + akz + '" opacity=".8"/>',
    punkte: '<rect width="16" height="16" fill="' + f + '"/><circle cx="4" cy="4" r="2.2" fill="' + akz + '"/><circle cx="12" cy="12" r="2.2" fill="' + akz + '"/>',
    karo: '<rect width="16" height="16" fill="' + f + '"/><rect width="16" height="5" fill="' + dunkel + '" opacity=".45"/><rect width="5" height="16" fill="' + dunkel + '" opacity=".45"/>',
    blumen: '<rect width="16" height="16" fill="' + f + '"/><g fill="' + akz + '"><circle cx="5" cy="3.5" r="1.6"/><circle cx="3.4" cy="5.6" r="1.6"/><circle cx="6.6" cy="5.6" r="1.6"/></g><circle cx="5" cy="5" r="1" fill="' + dunkel + '"/><circle cx="12.5" cy="12" r="1.3" fill="' + akz + '" opacity=".8"/>',
  };
  const g = NS_STOFFE[stoff.art].glanz;
  return '<pattern id="' + id + '" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="' + rot + '">' + M[stoff.muster] + '</pattern>'
    + '<linearGradient id="' + id + 'g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".38" stop-color="#fff" stop-opacity="' + (0.05 + g * 0.07).toFixed(2) + '"/><stop offset=".55" stop-color="#fff" stop-opacity="' + (g * 0.04).toFixed(2) + '"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>';
}
const NS_SAUM = { mini: 250, knie: 292, midi: 342, maxi: 398 };
const NS_WEITE = { etui: 50, aline: 74, glocke: 98, teller: 124 };
// d = { oberteil, aermel, rock, laenge, stoffO, stoffR, winkelO, winkelR, deko: [{a, x, y}] }
function nsKleidSvg(d, opt = {}) {
  const id = 'ns' + (++nsMusterNr), y0 = 168, saum = NS_SAUM[d.laenge], hw = NS_WEITE[d.rock] * (d.laenge === 'mini' ? 0.8 : d.laenge === 'knie' ? 0.9 : 1);
  const sO = d.stoffO, sR = d.stoffR || d.stoffO;
  let defs = nsStoffDefs(sO, d.winkelO || 0, id + 'o') + nsStoffDefs(sR, d.winkelR || 0, id + 'r');
  // Puppe
  let s = '<g class="ns-puppe"><rect x="146" y="' + (saum + 2) + '" width="8" height="' + Math.max(8, 410 - saum) + '" rx="3"/><ellipse cx="150" cy="414" rx="44" ry="5"/><path d="M138 22h24l-4 34h-16z"/><circle cx="150" cy="16" r="10"/></g>';
  // Rock (mit Falten je nach Fall des Stoffs)
  const wellig = d.rock === 'glocke' || d.rock === 'teller';
  let rock = 'M110 ' + y0 + ' C' + (110 - hw * 0.15) + ' ' + (y0 + 40) + ' ' + (150 - hw) + ' ' + (saum - 40) + ' ' + (150 - hw) + ' ' + saum;
  if (wellig) { const n = d.rock === 'teller' ? 6 : 4; for (let i = 1; i <= n; i++) { const x = 150 - hw + (2 * hw * i) / n; rock += ' Q' + (x - hw / n) + ' ' + (saum + (i % 2 ? 9 : -2)) + ' ' + x + ' ' + saum; } }
  else rock += ' L' + (150 + hw) + ' ' + saum;
  rock += ' C' + (150 + hw) + ' ' + (saum - 40) + ' ' + (190 + hw * 0.15) + ' ' + (y0 + 40) + ' 190 ' + y0 + ' Z';
  const falten = Math.round(NS_STOFFE[sR.art].fall + (wellig ? 2 : 0));
  let faltenSvg = '';
  for (let i = 1; i <= falten; i++) { const x = 150 - hw * 0.85 + (1.7 * hw * i) / (falten + 1); faltenSvg += '<path d="M' + (150 + (x - 150) * 0.35).toFixed(1) + ' ' + (y0 + 12) + ' Q' + x.toFixed(1) + ' ' + ((y0 + saum) / 2).toFixed(1) + ' ' + x.toFixed(1) + ' ' + (saum - 3) + '" class="ns-falte"/>'; }
  s += '<path d="' + rock + '" fill="url(#' + id + 'r)"/><path d="' + rock + '" fill="url(#' + id + 'rg)"/>' + faltenSvg;
  // Ärmel
  const ae = { kurz: ['M102 62 L80 112 L98 120 L108 92 Z', 'M198 62 L220 112 L202 120 L192 92 Z'], puff: ['M102 60 C68 58 66 110 92 116 L108 96 Z', 'M198 60 C232 58 234 110 208 116 L192 96 Z'], lang: ['M102 62 L66 250 L84 256 L108 96 Z', 'M198 62 L234 250 L216 256 L192 96 Z'] }[d.aermel];
  if (ae) ae.forEach((p) => { s += '<path d="' + p + '" fill="url(#' + id + 'o)"/><path d="' + p + '" fill="url(#' + id + 'og)" opacity=".8"/>'; });
  // Oberteil mit Ausschnitt
  const hals = { rund: 'C120 92 180 92 ', v: 'L150 122 L', herz: 'C118 102 140 96 150 112 C160 96 182 102 ', carmen: '' }[d.oberteil];
  const ob = d.oberteil === 'carmen' ? 'M100 96 C130 88 170 88 200 96 L204 108 L190 ' + y0 + ' L110 ' + y0 + ' L96 108 Z' : 'M100 58 L120 54 ' + hals + '180 54 L200 58 L204 108 L190 ' + y0 + ' L110 ' + y0 + ' L96 108 Z';
  s += '<path d="' + ob + '" fill="url(#' + id + 'o)"/><path d="' + ob + '" fill="url(#' + id + 'og)"/><path d="M110 ' + y0 + ' L190 ' + y0 + '" class="ns-naht"/>';
  // Deko
  (d.deko || []).forEach((k, i) => { s += '<text class="ns-deko" data-di="' + i + '" x="' + k.x + '" y="' + k.y + '">' + NS_DEKO[k.a][1] + '</text>'; });
  return '<svg viewBox="0 0 300 420" class="ns-kleid' + (opt.klein ? ' klein' : '') + '" aria-label="Kleid"><defs>' + defs + '</defs>' + s + '</svg>';
}

// ---------- Aufträge & Angebot ----------
function nsNeuerAuftrag(s) {
  const k = nsZ(NS_KUNDEN), anlass = nsZ(k.anlaesse);
  const budget = Math.round((60 + ['braut', 'abiball', 'winterball', 'theater', 'hochzeit'].includes(anlass) * 50 + Math.min(80, s.ruf * 2)) / 5) * 5;
  return { kunde: k.id, anlass, farbe: nsZ(k.farben), muster: nsZ(k.muster), laenge: nsZ(k.laengen), aermel: nsZ(k.aermel), budget, tag: s.tag };
}
function nsAngebot(s) {
  if (s.angebot && s.angebot.tag === s.tag) return s.angebot.liste;
  const r = zufallsGenerator('ns-stoffe-' + s.tag + '-' + (s.ruf > 20 ? 'x' : ''));
  const z = (a) => a[Math.floor(r() * a.length)], arten = Object.keys(NS_STOFFE), farben = Object.keys(NS_FARBEN), muster = Object.keys(NS_MUSTER);
  const liste = [{ art: 'baumwolle', farbe: 'creme', muster: 'uni' }, { art: 'baumwolle', farbe: 'weiss', muster: 'uni' }];
  // passende Stoffe zum offenen Auftrag gibt es immer
  if (s.auftrag) { liste.push({ art: z(['seide', 'chiffon', 'samt', 'wolle', 'leinen', 'baumwolle']), farbe: s.auftrag.farbe, muster: s.auftrag.muster === 'uni' ? 'uni' : s.auftrag.muster }, { art: 'baumwolle', farbe: s.auftrag.farbe, muster: 'uni' }); }
  while (liste.length < 10) { const x = { art: z(arten), farbe: z(farben), muster: r() < 0.5 ? 'uni' : z(muster) }; if (!liste.some((y) => y.art === x.art && y.farbe === x.farbe && y.muster === x.muster)) liste.push(x); }
  s.angebot = { tag: s.tag, liste }; nsSpeichern(s);
  return liste;
}
const nsMeterPreis = (x) => Math.round(NS_STOFFE[x.art].preis * (x.muster === 'uni' ? 1 : 1.2) * 10) / 10;

// ---------- Oberfläche: der Laden ----------
function nsOeffnen() { show('naehen', '🧵 Nähstube'); ns = { teil: 'laden' }; nsLaden(); }
function nsKopf(s) { return '<div class="ns-leiste"><span>🪙 <b>' + fmt(Math.round(s.muenzen)) + '</b></span><span>⭐ <b>' + fmt(Math.round(s.ruf)) + '</b> Ruf</span><span>📅 Tag <b>' + s.tag + '</b></span></div>'; }
function nsLaden() {
  const s = nsStore(); ns.teil = 'laden';
  if (!s.lager.length && s.tag === 1 && !s.kleider.length) { s.lager.push({ id: 'start', art: 'baumwolle', farbe: 'creme', muster: 'uni', cm: 300 }); nsSpeichern(s); }
  const k = s.auftrag && NS_KUNDEN.find((x) => x.id === s.auftrag.kunde);
  $('nsInhalt').innerHTML = nsKopf(s)
    + '<div class="ns-raum"><div class="ns-fenster">' + [0, 1, 2].map((i) => { const f = s.fenster[i]; return '<div class="ns-platz">' + (f ? nsKleidSvg(f.d, { klein: true }) + '<small>' + f.preis + ' 🪙</small>' : '<span>leer</span>') + '</div>'; }).join('') + '<div class="ns-fenster-schild">Schaufenster</div></div>'
    + '<div class="ns-theke"><div class="ns-katze" id="nsKatze" role="button" aria-label="Kater Zwirn streicheln"><span class="ns-katze-koerper">🐈</span><span class="ns-herzen" id="nsHerzen"></span></div>'
    + (k ? '<div class="ns-kunde"><span class="ns-kunde-ava">' + k.e + '</span><div><b>' + k.n + '</b><small>' + k.t + '</small></div></div>' : '<div class="ns-kunde leer"><small>Niemand an der Theke …</small></div>') + '</div></div>'
    + (k ? nsAuftragKarte(s.auftrag, k) : '<button type="button" class="btn ns-gross" id="nsKlingel">🔔 Nächste Kundschaft</button>')
    + '<div class="ns-knoepfe"><button type="button" class="ns-knopf" id="nsStoffladen">🧺<b>Stoffladen</b><small>' + s.lager.length + ' Stoffe im Regal</small></button>'
    + '<button type="button" class="ns-knopf" id="nsFrei">✏️<b>Fürs Schaufenster</b><small>frei entwerfen</small></button>'
    + '<button type="button" class="ns-knopf" id="nsLook">📒<b>Lookbook</b><small>' + s.kleider.length + ' Kleider</small></button></div>'
    + '<p class="ns-klein">Kater Zwirn wurde schon ' + fmt(s.streicheln) + '× gestreichelt.</p>';
  if ($('nsKlingel')) $('nsKlingel').addEventListener('click', () => { const s2 = nsStore(); s2.auftrag = nsNeuerAuftrag(s2); nsSpeichern(s2); nsLaden(); });
  if ($('nsAnnehmen')) $('nsAnnehmen').addEventListener('click', () => nsSkizze(true));
  if ($('nsAblehnen')) $('nsAblehnen').addEventListener('click', () => { const s2 = nsStore(); s2.auftrag = null; s2.ruf = Math.max(0, s2.ruf - 0.5); nsSpeichern(s2); nsLaden(); });
  $('nsStoffladen').addEventListener('click', nsStoffladen);
  $('nsFrei').addEventListener('click', () => nsSkizze(false));
  $('nsLook').addEventListener('click', nsLookbook);
  nsKatze();
}
function nsAuftragKarte(a, k) {
  return '<div class="ns-auftrag"><p>„Hallo! Ich brauche ein Kleid für <b>' + NS_ANLAESSE[a.anlass].n + '</b>. Am liebsten <b>' + NS_FARBEN[a.farbe][0] + '</b>, <b>' + NS_TAG_TEXTE[a.muster] + '</b>, <b>' + NS_TAG_TEXTE[a.laenge] + '</b> und <b>' + NS_TAG_TEXTE[a.aermel] + '</b>. Ich kann bis zu <b>' + a.budget + ' 🪙</b> zahlen.“</p>'
    + '<div class="ns-zeile"><button type="button" class="btn ns-gross" id="nsAnnehmen">✂️ Los geht’s</button><button type="button" class="btn secondary" id="nsAblehnen">Lieber nicht</button></div>'
    + '<p class="ns-klein">Tipp: ' + nsAnlassTipp(a.anlass) + '</p></div>';
}
function nsAnlassTipp(an) {
  const A = NS_ANLAESSE[an], g = (r, w) => (r[0] >= 3 ? 'viel ' + w : r[1] <= 2 ? 'wenig ' + w : null);
  return [g(A.waerme, 'Wärme'), g(A.glanz, 'Glanz'), A.fall[0] >= 3 ? 'ein fließender Fall' : null].filter(Boolean).join(', ') + ' – schau auf die Stoff-Werte im Laden.';
}
// Kater Zwirn: über ihn streichen = schnurren
function nsKatze() {
  const k = $('nsKatze'); if (!k) return;
  let weg = 0, letzt = null;
  const herz = () => { const h = document.createElement('i'); h.textContent = nsZ(['💗', '💕', '✨']); h.style.left = (20 + Math.random() * 60) + '%'; $('nsHerzen').appendChild(h); setTimeout(() => h.remove(), 1200); };
  k.addEventListener('pointerdown', (e) => { letzt = [e.clientX, e.clientY]; nsFang(k, e); });
  k.addEventListener('pointermove', (e) => { if (!letzt) return; weg += Math.hypot(e.clientX - letzt[0], e.clientY - letzt[1]); letzt = [e.clientX, e.clientY]; if (weg > 60) { weg = 0; herz(); k.classList.add('schnurrt'); const s = nsStore(); s.streicheln++; nsSpeichern(s); if (navigator.vibrate) navigator.vibrate(6); } });
  const ende = () => { letzt = null; setTimeout(() => k.classList.remove('schnurrt'), 600); };
  k.addEventListener('pointerup', ende); k.addEventListener('pointercancel', ende);
  k.addEventListener('click', () => { herz(); k.classList.add('schnurrt'); setTimeout(() => k.classList.remove('schnurrt'), 600); });
}
// ---------- Stoffladen ----------
function nsStoffladen() {
  const s = nsStore(), liste = nsAngebot(s); ns.teil = 'stoffe';
  const werte = (x) => { const S = NS_STOFFE[x.art]; return ['Fall', S.fall, 'Glanz', S.glanz, 'Wärme', S.waerme]; };
  const balken = (n, v) => '<span class="ns-wert"><small>' + n + '</small><i style="--v:' + v * 20 + '%"></i></span>';
  const probe = (x) => '<svg viewBox="0 0 40 40" class="ns-probe"><defs>' + nsStoffDefs(x, 0, 'pr' + (++nsMusterNr)) + '</defs><rect width="40" height="40" rx="8" fill="url(#pr' + nsMusterNr + ')"/><rect width="40" height="40" rx="8" fill="url(#pr' + nsMusterNr + 'g)"/></svg>';
  $('nsInhalt').innerHTML = nsKopf(s) + '<h2 class="ns-h2">🧺 Stoffladen <small>neue Ballen jeden Tag</small></h2>'
    + '<div class="ns-stoffe">' + liste.map((x, i) => { const w = werte(x); return '<div class="ns-stoff">' + probe(x) + '<div><b>' + nsStoffName(x) + '</b><small>' + NS_STOFFE[x.art].t + '</small><div class="ns-werte">' + balken(w[0], w[1]) + balken(w[2], w[3]) + balken(w[4], w[5]) + '</div></div><div class="ns-kauf"><b>' + fmt(nsMeterPreis(x)) + ' 🪙/m</b><button type="button" class="ns-mini" data-kauf="' + i + '">1 m</button><button type="button" class="ns-mini" data-kauf2="' + i + '">2 m</button></div></div>'; }).join('') + '</div>'
    + '<h2 class="ns-h2">Dein Regal</h2>' + (s.lager.length ? '<div class="ns-regal">' + s.lager.map((x) => '<div class="ns-ballen">' + probe(x) + '<small>' + nsStoffName(x) + '<br><b>' + fmt(Math.round(x.cm)) + ' cm</b></small></div>').join('') + '</div>' : '<p class="ns-klein">Noch leer.</p>')
    + '<button type="button" class="btn ns-gross" id="nsZurueckLaden">Zurück in den Laden</button>';
  const kaufen = (i, m) => {
    const s2 = nsStore(), x = liste[i], preis = Math.round(nsMeterPreis(x) * m * 10) / 10;
    if (s2.muenzen < preis) { nsToast('Nicht genug Münzen 🪙'); return; }
    s2.muenzen = Math.round((s2.muenzen - preis) * 10) / 10;
    const da = s2.lager.find((y) => y.art === x.art && y.farbe === x.farbe && y.muster === x.muster);
    if (da) da.cm += m * 100; else s2.lager.push({ id: Date.now().toString(36) + i, ...x, cm: m * 100 });
    nsSpeichern(s2); nsToast('✂️ ' + m + ' m ' + nsStoffName(x) + ' gekauft'); nsStoffladen();
  };
  $('nsInhalt').querySelectorAll('[data-kauf]').forEach((b) => b.addEventListener('click', () => kaufen(+b.dataset.kauf, 1)));
  $('nsInhalt').querySelectorAll('[data-kauf2]').forEach((b) => b.addEventListener('click', () => kaufen(+b.dataset.kauf2, 2)));
  $('nsZurueckLaden').addEventListener('click', nsLaden);
}
function nsToast(t) { let el = $('nsToast'); if (!el) { el = document.createElement('div'); el.id = 'nsToast'; el.className = 'ns-toast'; document.body.appendChild(el); } el.textContent = t; el.classList.add('an'); clearTimeout(nsToast.t); nsToast.t = setTimeout(() => el.classList.remove('an'), 2000); }

// ---------- Skizzenbuch ----------
function nsSkizze(auftrag) {
  const s = nsStore(); ns.teil = 'skizze'; ns.auftrag = auftrag ? s.auftrag : null;
  if (!s.lager.length) { nsToast('Erst Stoff kaufen 🧺'); nsStoffladen(); return; }
  const a = ns.auftrag;
  ns.d = ns.d && ns.d.neu ? ns.d : { neu: true, oberteil: 'rund', aermel: a ? a.aermel : 'kurz', rock: 'aline', laenge: a ? a.laenge : 'knie', lo: s.lager[0].id, lr: s.lager[0].id, deko: [] };
  if (!s.lager.some((x) => x.id === ns.d.lo)) ns.d.lo = s.lager[0].id;
  if (!s.lager.some((x) => x.id === ns.d.lr)) ns.d.lr = s.lager[0].id;
  const zeichnen = () => {
    const S = nsStore(), d = ns.d, sO = S.lager.find((x) => x.id === d.lo), sR = S.lager.find((x) => x.id === d.lr);
    const vor = { ...d, stoffO: sO, stoffR: sR };
    const wahl = (feld) => '<div class="ns-wahl"><b>' + NS_TEILE[feld].n + '</b><div class="ns-chips">' + Object.entries(NS_TEILE[feld].o).map(([k, n]) => '<button type="button" class="ns-chip' + (d[feld] === k ? ' an' : '') + '" data-f="' + feld + '" data-v="' + k + '">' + n + '</button>').join('') + '</div></div>';
    const stoffWahl = (feld, titel) => '<div class="ns-wahl"><b>' + titel + '</b><div class="ns-chips">' + S.lager.map((x) => '<button type="button" class="ns-chip stoff' + (d[feld] === x.id ? ' an' : '') + '" data-sf="' + feld + '" data-v="' + x.id + '"><i style="background:' + NS_FARBEN[x.farbe][1] + '"></i>' + nsStoffName(x) + ' · ' + Math.round(x.cm) + ' cm</button>').join('') + '</div></div>';
    $('nsInhalt').innerHTML = nsKopf(S) + '<h2 class="ns-h2">📒 Skizzenbuch' + (ns.auftrag ? ' <small>für ' + NS_KUNDEN.find((k) => k.id === ns.auftrag.kunde).n + '</small>' : ' <small>fürs Schaufenster</small>') + '</h2>'
      + (ns.auftrag ? '<p class="ns-wunsch">Wunsch: ' + NS_FARBEN[ns.auftrag.farbe][0] + ' · ' + NS_TAG_TEXTE[ns.auftrag.muster] + ' · ' + NS_TAG_TEXTE[ns.auftrag.laenge] + ' · ' + NS_TAG_TEXTE[ns.auftrag.aermel] + ' · ' + NS_ANLAESSE[ns.auftrag.anlass].n + '</p>' : '')
      + '<div class="ns-skizze"><div class="ns-vorschau">' + nsKleidSvg(vor) + '</div><div class="ns-optionen">' + wahl('oberteil') + wahl('aermel') + wahl('rock') + wahl('laenge') + stoffWahl('lo', 'Stoff Oberteil') + stoffWahl('lr', 'Stoff Rock') + '</div></div>'
      + '<div class="ns-zeile"><button type="button" class="btn secondary" id="nsSkizzeZurueck">Zurück</button><button type="button" class="btn ns-gross" id="nsZumZuschnitt">✂️ Zum Zuschnitt</button></div>';
    $('nsInhalt').querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { ns.d[b.dataset.f] = b.dataset.v; zeichnen(); }));
    $('nsInhalt').querySelectorAll('[data-sf]').forEach((b) => b.addEventListener('click', () => { ns.d[b.dataset.sf] = b.dataset.v; zeichnen(); }));
    $('nsSkizzeZurueck').addEventListener('click', () => { ns.d = null; nsLaden(); });
    $('nsZumZuschnitt').addEventListener('click', nsZuschnittStart);
  };
  zeichnen();
}
// ---------- Schnittteile (Maße in cm) ----------
function nsTeile(d) {
  const T = [], add = (n, g, poly, haupt) => T.push({ n, g, poly, r: 0, x: 0, y: 0, haupt: !!haupt });
  const vorn = d.oberteil === 'carmen' ? [[0, 0], [38, 0], [36, 36], [2, 36]] : d.oberteil === 'v' ? [[0, 0], [13, 0], [19, 14], [25, 0], [38, 0], [36, 45], [2, 45]] : [[0, 0], [12, 0], [19, 7], [26, 0], [38, 0], [36, 45], [2, 45]];
  add('Vorderteil', 'o', vorn, true); add('Rückenteil', 'o', d.oberteil === 'carmen' ? [[0, 0], [38, 0], [36, 36], [2, 36]] : [[0, 0], [38, 0], [36, 45], [2, 45]]);
  const ae = { kurz: [[0, 0], [32, 0], [28, 18], [4, 18]], puff: [[0, 6], [8, 0], [32, 0], [40, 6], [36, 24], [4, 24]], lang: [[0, 0], [34, 0], [26, 62], [8, 62]] }[d.aermel];
  if (ae) { add('Ärmel links', 'o', ae); add('Ärmel rechts', 'o', ae); }
  const L = { mini: 42, knie: 58, midi: 78, maxi: 102 }[d.laenge], H = { etui: 46, aline: 66, glocke: 86, teller: 112 }[d.rock], o = (H - 38) / 2;
  const rock = d.rock === 'teller' ? [[o, 0], [o + 38, 0], [H, L * 0.8], [H * 0.75, L], [H * 0.25, L], [0, L * 0.8]] : [[o, 0], [o + 38, 0], [H, L], [0, L]];
  add('Rock vorn', 'r', rock); add('Rock hinten', 'r', rock);
  return T;
}
function nsPoly(t) {   // gedreht, an (x, y) ausgerichtet
  const w = (t.r * Math.PI) / 180, c = Math.cos(w), s = Math.sin(w);
  const p = t.poly.map(([x, y]) => [x * c - y * s, x * s + y * c]), mx = Math.min(...p.map((q) => q[0])), my = Math.min(...p.map((q) => q[1]));
  return p.map(([x, y]) => [x - mx + t.x, y - my + t.y]);
}
function nsInnen(pt, poly) { let i = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) { const [xa, ya] = poly[a], [xb, yb] = poly[b]; if ((ya > pt[1]) !== (yb > pt[1]) && pt[0] < ((xb - xa) * (pt[1] - ya)) / (yb - ya) + xa) i = !i; } return i; }
// Prüfen: alle Teile auf dem Stoff, keine Überlappung (Raster 2 cm)
function nsPruefen(teile, laenge) {
  const belegt = new Map(), fehler = new Set();
  teile.forEach((t, i) => {
    const P = nsPoly(t);
    if (P.some(([x, y]) => x < -0.01 || x > 140.01 || y < -0.01 || y > laenge + 0.01)) fehler.add(i);
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
    for (let x = Math.floor(Math.min(...xs) / 2) * 2 + 1; x < Math.max(...xs); x += 2) for (let y = Math.floor(Math.min(...ys) / 2) * 2 + 1; y < Math.max(...ys); y += 2) {
      if (!nsInnen([x, y], P)) continue; const k = x + ',' + y;
      if (belegt.has(k) && belegt.get(k) !== i) { fehler.add(i); fehler.add(belegt.get(k)); } else belegt.set(k, i);
    }
  });
  const verbrauch = teile.length ? Math.ceil(Math.max(...teile.map((t) => Math.max(...nsPoly(t).map((p) => p[1])))) / 5) * 5 : 0;
  return { fehler, verbrauch };
}
// Automatisch anordnen: Reihen von links nach rechts
function nsAnordnen(teile) {
  let x = 0, y = 0, reihe = 0;
  teile.slice().sort((a, b) => { const ha = nsPoly({ ...a, x: 0, y: 0 }), hb = nsPoly({ ...b, x: 0, y: 0 }); return Math.max(...hb.map((p) => p[1])) - Math.max(...ha.map((p) => p[1])); }).forEach((t) => {
    const P = nsPoly({ ...t, x: 0, y: 0 }), w = Math.max(...P.map((p) => p[0])), h = Math.max(...P.map((p) => p[1]));
    if (x + w > 140) { x = 0; y += reihe + 2; reihe = 0; }
    t.x = x; t.y = y; x += w + 2; reihe = Math.max(reihe, h);
  });
}
// ---------- Zuschnitt ----------
function nsZuschnittStart() {
  const S = nsStore(), d = ns.d;
  ns.teile = nsTeile(d); ns.gruppen = [];
  const ids = [...new Set([d.lo, d.lr])];
  ids.forEach((id) => { const st = S.lager.find((x) => x.id === id); const teile = ns.teile.filter((t) => (t.g === 'o' ? d.lo : d.lr) === id); nsAnordnen(teile); ns.gruppen.push({ id, stoff: st, teile }); });
  ns.gi = 0; ns.sel = null; nsZuschnitt();
}
function nsZuschnitt() {
  ns.teil = 'zuschnitt';
  const G = ns.gruppen[ns.gi], L = Math.round(G.stoff.cm), P = nsPruefen(G.teile, L), alleOk = ns.gruppen.every((g) => !nsPruefen(g.teile, Math.round(g.stoff.cm)).fehler.size);
  const id = 'zs' + (++nsMusterNr);
  const teilSvg = G.teile.map((t, i) => {
    const Q = nsPoly(t), cx = Q.reduce((a, p) => a + p[0], 0) / Q.length, cy = Q.reduce((a, p) => a + p[1], 0) / Q.length, w = (t.r * Math.PI) / 180;
    const pfeil = [cx - Math.sin(-w) * 8, cy - Math.cos(-w) * 8, cx + Math.sin(-w) * 8, cy + Math.cos(-w) * 8].map((v) => v.toFixed(1));
    return '<g class="ns-teil' + (P.fehler.has(i) ? ' falsch' : '') + (ns.sel === i ? ' sel' : '') + '" data-t="' + i + '"><polygon points="' + Q.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ') + '"/><line x1="' + pfeil[0] + '" y1="' + pfeil[1] + '" x2="' + pfeil[2] + '" y2="' + pfeil[3] + '" class="ns-fadenlauf"/><text x="' + cx.toFixed(1) + '" y="' + (cy + 1).toFixed(1) + '">' + t.n + (t.r === 45 ? ' · schräg' : '') + '</text></g>';
  }).join('');
  $('nsInhalt').innerHTML = '<h2 class="ns-h2">✂️ Zuschnitt <small>' + nsEsc(nsStoffName(G.stoff)) + '</small></h2>'
    + (ns.gruppen.length > 1 ? '<div class="ns-chips">' + ns.gruppen.map((g, i) => '<button type="button" class="ns-chip' + (i === ns.gi ? ' an' : '') + '" data-gi="' + i + '">' + nsEsc(nsStoffName(g.stoff)) + '</button>').join('') + '</div>' : '')
    + '<p class="ns-klein">Teile ziehen, antippen und drehen. Der Pfeil zeigt den Fadenlauf: <b>gerade</b> (0°/90°) oder <b>schräg</b> (45°) – schräg fällt der Stoff weicher, braucht aber mehr Platz. Bei Mustern sieht man die Richtung am fertigen Kleid.</p>'
    + '<div class="ns-zeile"><button type="button" class="btn secondary" id="nsDrehen"' + (ns.sel == null ? ' disabled' : '') + '>↻ Drehen</button><button type="button" class="btn secondary" id="nsAuto">✨ Anordnen</button></div>'
    + '<p class="ns-status">' + (P.fehler.size ? '⚠️ ' + P.fehler.size + ' Teile überlappen oder liegen nicht auf dem Stoff' : '✓ Alles passt') + ' · Verbrauch <b>' + P.verbrauch + ' cm</b> von ' + L + ' cm</p>'
    + '<div class="ns-stoffbahn"><svg id="nsBahn" viewBox="-2 -2 144 ' + (L + 4) + '" style="aspect-ratio:144/' + (L + 4) + '"><defs>' + nsStoffDefs(G.stoff, 0, id) + '</defs><rect x="0" y="0" width="140" height="' + L + '" fill="url(#' + id + ')" class="ns-bahn"/>' + teilSvg + '</svg></div>'
    + '<div class="ns-zeile"><button type="button" class="btn secondary" id="nsZurueckSkizze">Zurück</button><button type="button" class="btn ns-gross" id="nsSchneiden"' + (alleOk ? '' : ' disabled') + '>✂️ Zuschneiden</button></div>';
  $('nsInhalt').querySelectorAll('[data-gi]').forEach((b) => b.addEventListener('click', () => { ns.gi = +b.dataset.gi; ns.sel = null; nsZuschnitt(); }));
  $('nsDrehen').addEventListener('click', () => { const t = G.teile[ns.sel]; if (!t) return; t.r = (t.r + 45) % 135; const Q = nsPoly(t), w = Math.max(...Q.map((p) => p[0])) - t.x; t.x = Math.max(0, Math.min(t.x, 140 - w)); nsZuschnitt(); });
  $('nsAuto').addEventListener('click', () => { nsAnordnen(G.teile); nsZuschnitt(); });
  $('nsZurueckSkizze').addEventListener('click', () => nsSkizze(!!ns.auftrag));
  $('nsSchneiden').addEventListener('click', nsSchneidenStart);
  // Ziehen
  const svg = $('nsBahn');
  let zug = null;
  const pt = (e) => { const m = svg.getScreenCTM().inverse(), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(m); return [q.x, q.y]; };
  svg.querySelectorAll('[data-t]').forEach((g) => {
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); const i = +g.dataset.t, t = G.teile[i], p = pt(e); zug = { i, dx: p[0] - t.x, dy: p[1] - t.y, bewegt: false }; nsFang(svg, e); });
  });
  svg.addEventListener('pointermove', (e) => {
    if (!zug) return; const t = G.teile[zug.i], p = pt(e), Q = nsPoly({ ...t, x: 0, y: 0 }), w = Math.max(...Q.map((q) => q[0])), h = Math.max(...Q.map((q) => q[1]));
    t.x = Math.round(Math.max(0, Math.min(140 - w, p[0] - zug.dx))); t.y = Math.round(Math.max(0, Math.min(L - h, p[1] - zug.dy))); zug.bewegt = true;
    const g = svg.querySelector('[data-t="' + zug.i + '"]'); const N = nsPoly(t); g.querySelector('polygon').setAttribute('points', N.map((q) => q.join(',')).join(' '));
  });
  const los = () => { if (!zug) return; const z = zug; zug = null; ns.sel = z.i; nsZuschnitt(); };
  svg.addEventListener('pointerup', los); svg.addEventListener('pointercancel', los);
}
// ---------- Schneiden: entlang der Linie fahren ----------
function nsSchneidenStart() {
  ns.teil = 'schneiden';
  // Stoff wird jetzt wirklich abgeschnitten; Fadenlauf fürs Kleid merken
  const S = nsStore();
  ns.gruppen.forEach((g) => { const st = S.lager.find((x) => x.id === g.id); if (st) st.cm -= nsPruefen(g.teile, Math.round(st.cm)).verbrauch; });
  S.lager = S.lager.filter((x) => x.cm >= 15); nsSpeichern(S);
  const vorn = ns.teile.find((x) => x.haupt), rockT = ns.teile.filter((x) => x.g === 'r');
  ns.d.winkelO = vorn.r; ns.d.winkelR = rockT.filter((x) => x.r === 45).length >= rockT.length / 2 ? 45 : rockT[0].r;
  ns.d.stoffO = { ...ns.gruppen.find((g) => g.id === ns.d.lo).stoff }; ns.d.stoffR = { ...ns.gruppen.find((g) => g.id === ns.d.lr).stoff };
  const t = ns.teile.find((x) => x.haupt), xs = t.poly.map((p) => p[0]), ys = t.poly.map((p) => p[1]);
  const k = 220 / Math.max(Math.max(...xs), Math.max(...ys)), P = t.poly.map(([x, y]) => [40 + x * k, 40 + y * k]);
  // Punkte entlang der Kontur
  const proben = [];
  P.forEach((a, i) => { const b = P[(i + 1) % P.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5)); for (let j = 0; j < n; j++) proben.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]); });
  const gedeckt = new Array(proben.length).fill(false), abst = [];
  const G = ns.gruppen.find((g) => g.teile.includes(t)), id = 'sc' + (++nsMusterNr);
  $('nsInhalt').innerHTML = '<h2 class="ns-h2">✂️ Vorderteil ausschneiden</h2><p class="ns-klein">Fahr mit dem Finger die gestrichelte Linie einmal rundherum entlang – je genauer, desto schöner sitzt das Kleid. Die anderen Teile schneidest du in Gedanken mit. 😉</p>'
    + '<div class="ns-schneid"><svg id="nsSchnitt" viewBox="0 0 300 300"><defs>' + nsStoffDefs(G.stoff, t.r, id) + '</defs><rect width="300" height="300" fill="url(#' + id + ')"/><polygon points="' + P.map((p) => p.join(',')).join(' ') + '" class="ns-schnittlinie"/><polyline id="nsSpur" points="" class="ns-spur"/></svg></div>'
    + '<div class="ns-fortschritt"><i id="nsSchnittBalken"></i></div><p class="ns-status" id="nsSchnittInfo">Los geht’s – irgendwo auf der Linie anfangen.</p>'
    + '<button type="button" class="btn secondary" id="nsMaschine">Lieber die Schneidemaschine (etwas ungenauer)</button>';
  const svg = $('nsSchnitt'), spur = [];
  let an = false;
  const pt = (e) => { const m = svg.getScreenCTM().inverse(), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(m); return [q.x, q.y]; };
  const segAbst = (p) => { let best = 1e9; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))); best = Math.min(best, Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy)); } return best; };
  const fertig = (wert) => { ns.schnitt = wert; nsNaehenStart(); };
  svg.addEventListener('pointerdown', (e) => { e.preventDefault(); an = true; nsFang(svg, e); });
  svg.addEventListener('pointermove', (e) => {
    if (!an) return; const p = pt(e); spur.push(p); abst.push(segAbst(p));
    proben.forEach((q, i) => { if (!gedeckt[i] && Math.hypot(q[0] - p[0], q[1] - p[1]) < 14) gedeckt[i] = true; });
    $('nsSpur').setAttribute('points', spur.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' '));
    const anteil = gedeckt.filter(Boolean).length / gedeckt.length, mittel = abst.reduce((a, b) => a + b, 0) / abst.length;
    $('nsSchnittBalken').style.width = Math.round(anteil * 100) + '%';
    $('nsSchnittInfo').textContent = Math.round(anteil * 100) + ' % geschnitten · im Schnitt ' + mittel.toFixed(1) + ' px neben der Linie';
    if (anteil >= 0.92) { an = false; const wert = Math.max(0, Math.min(1, 1 - Math.max(0, mittel - 2) / 14)); nsToast('✂️ Ausgeschnitten! Genauigkeit ' + Math.round(wert * 100) + ' %'); setTimeout(() => fertig(wert), 500); }
  });
  svg.addEventListener('pointerup', () => { an = false; });
  $('nsMaschine').addEventListener('click', () => fertig(0.6));
}

// ---------- Nähen: die Naht unter der Nadel führen ----------
function nsNaehenStart() {
  ns.teil = 'naehen';
  $('nsInhalt').innerHTML = '<h2 class="ns-h2">🪡 Nähen</h2><p class="ns-klein">Finger auf den Stoff = Pedal: Der Stoff läuft unter der Nadel durch. Schieb ihn nach links und rechts, damit die Nadel genau auf der gestrichelten Linie näht.</p>'
    + '<div class="ns-maschine"><canvas id="nsNaht" width="340" height="420"></canvas></div><div class="ns-fortschritt"><i id="nsNahtBalken"></i></div><p class="ns-status" id="nsNahtInfo">Drück auf den Stoff, um loszunähen.</p>';
  const cv = $('nsNaht'), c = cv.getContext('2d'), W = 340, H = 420, NY = 150, LAENGE = 1500, farbe = NS_FARBEN[ns.d.stoffR.farbe][1];
  const g = (t) => 55 * Math.sin(t / 160) + 22 * Math.sin(t / 57 + 1);
  let p = 0, off = -g(0), tritt = false, sx = 0, soff = 0, letzt = 0, stiche = [], lauf = true;
  const zeichnen = () => {
    c.clearRect(0, 0, W, H); c.fillStyle = '#2a2131'; c.fillRect(0, 0, W, H);
    c.fillStyle = farbe; c.fillRect(W / 2 + off - 400, 0, 800, H); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(W / 2 + off - 400, 0, 800, H); c.fillStyle = farbe; c.fillRect(W / 2 + off - 150, 0, 300, H);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.setLineDash([6, 6]); c.lineWidth = 2; c.beginPath();
    for (let y = 0; y <= H; y += 6) { const t = p + (y - NY), x = W / 2 + off + g(t); if (y === 0) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#1f1b2b'; c.lineWidth = 3;
    stiche.forEach((s) => { const y = NY + (s.t - p); if (y < -5 || y > H) return; c.beginPath(); c.moveTo(W / 2 + off + s.x, y - 3); c.lineTo(W / 2 + off + s.x, y + 3); c.stroke(); });
    // Nähmaschine
    c.fillStyle = '#e8e2f2'; c.fillRect(W / 2 - 34, 0, 68, NY - 26); c.fillStyle = '#c9c0db'; c.fillRect(W / 2 - 20, NY - 30, 40, 14);
    c.strokeStyle = '#d4d4d8'; c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2, NY - 16); c.lineTo(W / 2, NY + (tritt ? 4 : -4)); c.stroke();
  };
  const schritt = (zeit) => {
    if (!lauf || ns.teil !== 'naehen') return;
    const dt = Math.min(0.05, (zeit - (schritt.z || zeit)) / 1000); schritt.z = zeit;
    if (tritt) {
      p += 190 * dt;
      while (letzt + 7 <= p) { letzt += 7; stiche.push({ t: letzt, x: -off }); }
      $('nsNahtBalken').style.width = Math.min(100, (p / LAENGE) * 100) + '%';
      if (stiche.length) { const gut = stiche.filter((s) => Math.abs(s.x - g(s.t)) < 6).length / stiche.length; $('nsNahtInfo').textContent = Math.round(gut * 100) + ' % der Stiche auf der Linie'; }
    }
    zeichnen();
    if (p >= LAENGE) {
      lauf = false;
      const wert = stiche.reduce((a, s) => { const e = Math.abs(s.x - g(s.t)); return a + (e < 6 ? 1 : e < 12 ? 0.5 : 0); }, 0) / Math.max(1, stiche.length);
      ns.naht = wert; nsToast('🪡 Naht fertig! ' + Math.round(wert * 100) + ' % sauber'); setTimeout(nsVerzieren, 700); return;
    }
    requestAnimationFrame(schritt);
  };
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); tritt = true; sx = e.clientX; soff = off; nsFang(cv, e); });
  cv.addEventListener('pointermove', (e) => { if (tritt) off = soff + (e.clientX - sx) * (W / cv.getBoundingClientRect().width); });
  const los = () => { tritt = false; };
  cv.addEventListener('pointerup', los); cv.addEventListener('pointercancel', los);
  ns.nahtTest = { g, pos: () => p, setze: (o) => { off = o; }, treten: (t) => { tritt = t; } };   // für Tests
  zeichnen(); requestAnimationFrame(schritt);
}
// ---------- Verzieren ----------
function nsVerzieren() {
  ns.teil = 'deko'; ns.d.deko = ns.d.deko || []; ns.dekoWahl = ns.dekoWahl || 'knopf';
  const zeichnen = () => {
    $('nsInhalt').innerHTML = '<h2 class="ns-h2">🎀 Verzieren</h2><p class="ns-klein">Wähle eine Verzierung und tippe aufs Kleid. Antippen einer Verzierung entfernt sie. Weniger ist manchmal mehr.</p>'
      + '<div class="ns-chips ns-dekowahl">' + Object.entries(NS_DEKO).map(([k, [n, e]]) => '<button type="button" class="ns-chip' + (ns.dekoWahl === k ? ' an' : '') + '" data-dw="' + k + '">' + e + ' ' + n + '</button>').join('') + '</div>'
      + '<div class="ns-vorschau gross" id="nsDekoFlaeche">' + nsKleidSvg(ns.d) + '</div><p class="ns-status">' + ns.d.deko.length + ' Verzierungen</p>'
      + '<button type="button" class="btn ns-gross" id="nsFertig">' + (ns.auftrag ? '🎁 Abgeben' : '🪟 Fertig') + '</button>';
    $('nsInhalt').querySelectorAll('[data-dw]').forEach((b) => b.addEventListener('click', () => { ns.dekoWahl = b.dataset.dw; zeichnen(); }));
    const svg = $('nsDekoFlaeche').querySelector('svg');
    svg.addEventListener('click', (e) => {
      const di = e.target.closest('[data-di]');
      if (di) { ns.d.deko.splice(+di.dataset.di, 1); zeichnen(); return; }
      if (ns.d.deko.length >= 14) { nsToast('Genug geschmückt 😉'); return; }
      const m = svg.getScreenCTM().inverse(), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(m);
      if (q.y < 40 || q.y > NS_SAUM[ns.d.laenge] + 8) return;
      ns.d.deko.push({ a: ns.dekoWahl, x: Math.round(q.x), y: Math.round(q.y) + 6 }); zeichnen();
    });
    $('nsFertig').addEventListener('click', nsAbgabe);
  };
  zeichnen();
}
// ---------- Bewertung ----------
function nsBewerten(d, a, schnitt, naht) {
  const st = [d.stoffO, d.stoffR], S = st.map((x) => NS_STOFFE[x.art]);
  const handwerk = (schnitt + naht) / 2;
  const deko = d.deko.length;
  if (!a) return { gesamt: 0.4 + 0.6 * handwerk * (deko <= 8 ? 1 : 0.8), handwerk, teile: [] };
  const farbe = st.some((x) => x.farbe === a.farbe) ? 1 : st.some((x) => NS_FARBEN[x.farbe][2] === NS_FARBEN[a.farbe][2]) ? 0.6 : 0;
  const muster = a.muster === 'uni' ? (st.every((x) => x.muster === 'uni') ? 1 : st.some((x) => x.muster === 'uni') ? 0.5 : 0.2) : st.some((x) => x.muster === a.muster) ? 1 : st.some((x) => x.muster !== 'uni') ? 0.5 : 0.2;
  const LS = ['mini', 'knie', 'midi', 'maxi'], dl = Math.abs(LS.indexOf(d.laenge) - LS.indexOf(a.laenge)), laenge = dl === 0 ? 1 : dl === 1 ? 0.5 : 0;
  const aermel = d.aermel === a.aermel ? 1 : (d.aermel === 'ohne') === (a.aermel === 'ohne') ? 0.5 : 0.2;
  const wunsch = (farbe + muster + laenge + aermel) / 4;
  const A = NS_ANLAESSE[a.anlass], passt = (v, [lo, hi]) => (v >= lo && v <= hi ? 1 : Math.max(0, 1 - (v < lo ? lo - v : v - hi) * 0.35));
  const fallR = Math.min(5, S[1].fall + (d.winkelR === 45 ? 1 : 0));
  const anlass = (passt((S[0].waerme + S[1].waerme) / 2, A.waerme) + passt((S[0].glanz + S[1].glanz) / 2, A.glanz) + passt(fallR, A.fall)) / 3;
  const dekoW = deko >= A.deko[0] && deko <= A.deko[1] ? 1 : Math.max(0.2, 1 - Math.min(Math.abs(deko - A.deko[0]), Math.abs(deko - A.deko[1])) * 0.2);
  // Handwerk wirkt als Faktor: schief genäht verdirbt auch das schönste Wunschkleid, sauber genäht rettet keinen Fehlgriff
  const gesamt = (0.5 * wunsch + 0.3 * anlass + 0.2 * dekoW) * (0.55 + 0.45 * handwerk);
  const teile = [
    [farbe, farbe === 1 ? 'Genau meine Farbe!' : farbe ? 'Die Farbrichtung passt.' : 'Hm, die Farbe hatte ich mir anders vorgestellt.'],
    [muster, muster === 1 ? 'Das Muster ist perfekt.' : 'Beim Muster hätte ich gern etwas anderes gehabt.'],
    [laenge, laenge === 1 ? 'Die Länge stimmt.' : 'Die Länge ist nicht ganz, was ich wollte.'],
    [aermel, aermel === 1 ? 'Die Ärmel – genau so!' : 'Die Ärmel sind anders als gewünscht.'],
    [anlass, anlass >= 0.8 ? 'Der Stoff ist ideal für ' + A.n + '.' : 'Für ' + A.n + ' ist der Stoff ' + (passt((S[0].waerme + S[1].waerme) / 2, A.waerme) < 1 ? ((S[0].waerme + S[1].waerme) / 2 > A.waerme[1] ? 'zu warm' : 'zu dünn') : passt((S[0].glanz + S[1].glanz) / 2, A.glanz) < 1 ? ((S[0].glanz + S[1].glanz) / 2 > A.glanz[1] ? 'zu glänzend' : 'zu schlicht') : 'etwas steif') + '.'],
    [handwerk, handwerk >= 0.85 ? 'Wunderschön verarbeitet!' : handwerk >= 0.6 ? 'Ordentlich genäht.' : 'Die Nähte sind etwas schief …'],
    [dekoW, dekoW === 1 ? 'Die Verzierungen sind genau richtig.' : deko > A.deko[1] ? 'Ein bisschen viel Schmuck.' : 'Ein paar Details hätten gutgetan.'],
  ];
  return { gesamt, wunsch, anlass, handwerk, deko: dekoW, teile };
}
function nsAbgabe() {
  const S = nsStore(), a = ns.auftrag, B = nsBewerten(ns.d, a, ns.schnitt || 0.6, ns.naht || 0.5);
  const sterne = Math.max(0.5, Math.round(B.gesamt * 10) / 2), d = { oberteil: ns.d.oberteil, aermel: ns.d.aermel, rock: ns.d.rock, laenge: ns.d.laenge, stoffO: ns.d.stoffO, stoffR: ns.d.stoffR, winkelO: ns.d.winkelO, winkelR: ns.d.winkelR, deko: ns.d.deko };
  let html = '';
  if (a) {
    const k = NS_KUNDEN.find((x) => x.id === a.kunde), lohn = Math.round(a.budget * (0.35 + 0.65 * B.gesamt) + (sterne >= 4.5 ? 10 : 0));
    S.muenzen += lohn; S.ruf = Math.max(0, S.ruf + (sterne - 2.5)); S.auftrag = null;
    S.kleider.push({ d, sterne, kunde: k.n, anlass: NS_ANLAESSE[a.anlass].n, tag: S.tag });
    html = '<div class="ns-urteil"><div class="ns-kunde gross"><span class="ns-kunde-ava">' + k.e + '</span><div><b>' + k.n + '</b><div class="ns-sterne">' + '★'.repeat(Math.floor(sterne)) + (sterne % 1 ? '½' : '') + '<i>' + '☆'.repeat(5 - Math.ceil(sterne)) + '</i></div></div></div>'
      + nsKleidSvg(d) + '<ul class="ns-stimmen">' + B.teile.map(([v, t]) => '<li class="' + (v >= 0.8 ? 'gut' : v >= 0.5 ? 'mittel' : 'schlecht') + '">' + t + '</li>').join('') + '</ul>'
      + '<p class="ns-lohn">+' + lohn + ' 🪙 · Ruf ' + (sterne >= 2.5 ? '+' : '') + (sterne - 2.5) + '</p></div>';
    if (typeof merkeVerlauf === 'function') merkeVerlauf('naehen', Math.round(B.gesamt * 100), 100, k.n + ' · ' + NS_ANLAESSE[a.anlass].n);
    if (sterne >= 4.5) konfetti(30, ['🧵', '✨', '🎀', '💖']);
  } else {
    const preis = Math.round(20 + 70 * B.gesamt);
    S.kleider.push({ d, sterne, kunde: 'Schaufenster', anlass: 'von der Stange', tag: S.tag });
    if (S.fenster.length >= 3) S.fenster.shift();
    S.fenster.push({ d, preis });
    html = '<div class="ns-urteil">' + nsKleidSvg(d) + '<p class="ns-lohn">🪟 Hängt jetzt im Schaufenster – Preisschild: ' + preis + ' 🪙</p><p class="ns-klein">Über Nacht kommen Leute vorbei. Je besser verarbeitet und je größer dein Ruf, desto eher wird es gekauft.</p></div>';
  }
  nsSpeichern(S); ns.d = null; ns.teil = 'abgabe';
  $('nsInhalt').innerHTML = nsKopf(S) + html + '<button type="button" class="btn ns-gross" id="nsFeierabend">🌙 Feierabend</button><button type="button" class="btn secondary" id="nsWeiterLaden">Zurück in den Laden</button>';
  $('nsFeierabend').addEventListener('click', nsFeierabend);
  $('nsWeiterLaden').addEventListener('click', nsLaden);
  nsHubText();
}
// Über Nacht: Schaufenster-Verkäufe, neuer Tag
function nsFeierabend() {
  const S = nsStore(), verkauft = [];
  S.fenster = S.fenster.filter((f) => { if (Math.random() < 0.35 + Math.min(0.4, S.ruf / 150)) { S.muenzen += f.preis; verkauft.push(f.preis); return false; } return true; });
  S.tag++; nsSpeichern(S);
  nsToast(verkauft.length ? '🌙 Über Nacht verkauft: ' + verkauft.length + ' Kleid' + (verkauft.length > 1 ? 'er' : '') + ' (+' + verkauft.reduce((a, b) => a + b, 0) + ' 🪙)' : '🌙 Ein neuer Tag in Fadenbach');
  nsLaden(); nsHubText();
}
// ---------- Lookbook ----------
function nsLookbook() {
  const S = nsStore(); ns.teil = 'look';
  $('nsInhalt').innerHTML = '<h2 class="ns-h2">📒 Lookbook <small>' + S.kleider.length + ' Kleider</small></h2>'
    + (S.kleider.length ? '<div class="ns-look">' + S.kleider.slice().reverse().map((k) => '<div class="ns-look-k">' + nsKleidSvg(k.d, { klein: true }) + '<b>' + nsEsc(k.kunde) + '</b><small>' + nsEsc(k.anlass) + ' · ' + '★'.repeat(Math.round(k.sterne)) + '</small></div>').join('') + '</div>' : '<p class="ns-klein">Noch keine Kleider – auf geht’s!</p>')
    + '<button type="button" class="btn ns-gross" id="nsLookZurueck">Zurück in den Laden</button>';
  $('nsLookZurueck').addEventListener('click', nsLaden);
}
function nsHubText() { const el = $('hubNaehenBest'); if (!el) return; const S = nsStore(); el.textContent = S.kleider.length ? 'Tag ' + S.tag + ' · ' + S.kleider.length + ' Kleider · ⭐ ' + Math.round(S.ruf) : 'Stoff wählen, zuschneiden, nähen – ein gemütlicher Laden'; }
nsHubText();
$('hubNaehen').addEventListener('click', () => { merkeZuletzt('naehen'); zoomZu($('hubNaehen'), nsOeffnen); });
$('nsZurueck').addEventListener('click', () => {
  if (ns && ['stoffe', 'look', 'abgabe'].includes(ns.teil)) { nsLaden(); return; }
  if (ns && ['skizze', 'zuschnitt', 'schneiden', 'naehen', 'deko'].includes(ns.teil)) { if (['schneiden', 'naehen', 'deko'].includes(ns.teil) && !confirm('Kleid abbrechen? Der zugeschnittene Stoff ist weg.')) return; ns.d = null; nsLaden(); return; }
  ns = null; zeigeHub(); nsHubText();
});
