// 🧭 Karten-Gefühl: Wo liegt das? Tippe den Ort auf der leeren Karte an – Punkte nach Kilometern daneben.
// Drei Karten (Deutschland, Europa, Welt), drei Stufen. Kartendaten: karten-daten.js (Natural Earth).
const KT_KEY = 'walquiz.karte.v1';
const KT_RUNDEN = 5;
const KT_MODI = {
  deutschland: { name: 'Deutschland', emoji: '🇩🇪', km: 220, lead: 'Eine leere Deutschlandkarte. Wo liegt die Stadt, der Berg, die Insel? Tippe den Ort an – je näher, desto mehr Punkte.' },
  europa: { name: 'Europa', emoji: '🇪🇺', km: 800, lead: 'Hauptstädte, Inseln und Gipfel in ganz Europa. Tippe auf die leere Karte, wo du den Ort vermutest.' },
  welt: { name: 'Welt', emoji: '🌍', km: 2500, lead: 'Von New York bis zur Osterinsel – und dorthin, wo Wale und Haie leben. Tippe auf die Weltkarte.' },
};
const KT_STUFEN = {
  leicht: { name: 'Leicht', klein: 'Bekannte Orte · Grenzen' },
  mittel: { name: 'Mittel', klein: 'Mehr Orte · Grenzen' },
  profi: { name: 'Profi', klein: 'Knifflig · ohne Grenzen' },
};
// [Name, Breite, Länge, Info (optional)]
const KT_ORTE = {
  deutschland: {
    leicht: [['Berlin', 52.52, 13.405], ['Hamburg', 53.551, 9.993], ['München', 48.137, 11.575], ['Köln', 50.938, 6.96], ['Frankfurt am Main', 50.11, 8.682],
      ['Stuttgart', 48.776, 9.183], ['Düsseldorf', 51.227, 6.773], ['Dresden', 51.05, 13.738], ['Leipzig', 51.34, 12.375], ['Hannover', 52.375, 9.732],
      ['Bremen', 53.079, 8.802], ['Nürnberg', 49.452, 11.077], ['Kiel', 54.323, 10.123], ['Rostock', 54.092, 12.099], ['Dortmund', 51.514, 7.468]],
    mittel: [['Freiburg', 47.999, 7.842], ['Erfurt', 50.978, 11.029], ['Magdeburg', 52.131, 11.64], ['Potsdam', 52.391, 13.065], ['Mainz', 49.993, 8.247],
      ['Saarbrücken', 49.24, 6.997], ['Schwerin', 53.636, 11.401], ['Würzburg', 49.791, 9.953], ['Regensburg', 49.013, 12.102], ['Kassel', 51.312, 9.48],
      ['Münster', 51.961, 7.626], ['Aachen', 50.776, 6.084], ['Heidelberg', 49.399, 8.672], ['Lübeck', 53.866, 10.687], ['Konstanz', 47.66, 9.175], ['Augsburg', 48.371, 10.898]],
    profi: [['Zugspitze', 47.421, 10.985, 'Mit 2962 m der höchste Berg Deutschlands.'], ['Brocken', 51.8, 10.616, 'Der höchste Berg im Harz (1141 m).'],
      ['Sylt', 54.907, 8.31, 'Die nördlichste Insel Deutschlands.'], ['Kap Arkona (Rügen)', 54.679, 13.432], ['Helgoland', 54.181, 7.886, 'Deutschlands einzige Hochseeinsel.'],
      ['Passau', 48.575, 13.461, 'Die Drei-Flüsse-Stadt: Donau, Inn und Ilz.'], ['Görlitz', 51.153, 14.987, 'Die östlichste Stadt Deutschlands.'], ['Flensburg', 54.794, 9.437],
      ['Trier', 49.75, 6.637, 'Die älteste Stadt Deutschlands.'], ['Bayreuth', 49.948, 11.578], ['Oberstdorf', 47.409, 10.279], ['Cottbus', 51.756, 14.333],
      ['Wolfsburg', 52.423, 10.787], ['Emden', 53.367, 7.207], ['Schloss Neuschwanstein', 47.558, 10.75], ['Loreley', 50.139, 7.729, 'Der berühmte Felsen am Rhein.']],
  },
  europa: {
    leicht: [['Paris', 48.857, 2.352], ['London', 51.507, -0.128], ['Rom', 41.903, 12.496], ['Madrid', 40.417, -3.704], ['Berlin', 52.52, 13.405],
      ['Wien', 48.208, 16.373], ['Amsterdam', 52.368, 4.904], ['Athen', 37.984, 23.728], ['Lissabon', 38.722, -9.139], ['Stockholm', 59.329, 18.069],
      ['Oslo', 59.914, 10.752], ['Warschau', 52.23, 21.012], ['Dublin', 53.35, -6.26], ['Kopenhagen', 55.676, 12.568], ['Prag', 50.075, 14.438], ['Istanbul', 41.008, 28.978]],
    mittel: [['Helsinki', 60.17, 24.938], ['Budapest', 47.498, 19.04], ['Brüssel', 50.85, 4.352], ['Bern', 46.948, 7.447], ['Reykjavík', 64.147, -21.942],
      ['Bukarest', 44.427, 26.103], ['Kyjiw', 50.45, 30.523], ['Belgrad', 44.787, 20.457], ['Zagreb', 45.815, 15.982], ['Barcelona', 41.385, 2.173],
      ['Mailand', 45.464, 9.19], ['Edinburgh', 55.953, -3.188], ['Venedig', 45.441, 12.316], ['Krakau', 50.065, 19.945], ['Sofia', 42.698, 23.322],
      ['Riga', 56.95, 24.105], ['Vilnius', 54.687, 25.28], ['Tallinn', 59.437, 24.754]],
    profi: [['Valletta', 35.899, 14.514, 'Hauptstadt von Malta.'], ['Bratislava', 48.149, 17.107], ['Ljubljana', 46.057, 14.506], ['Sarajevo', 43.856, 18.413],
      ['Tirana', 41.328, 19.819], ['Skopje', 41.998, 21.425], ['Podgorica', 42.441, 19.263], ['Chișinău', 47.011, 28.864], ['Minsk', 53.904, 27.562],
      ['Luxemburg', 49.612, 6.13], ['Andorra la Vella', 42.507, 1.522], ['Nordkap', 71.169, 25.783, 'Gilt als nördlichster Punkt Europas.'], ['Gibraltar', 36.14, -5.354],
      ['Ätna', 37.751, 14.993, 'Der größte aktive Vulkan Europas.'], ['Mont Blanc', 45.833, 6.865, 'Mit 4806 m der höchste Berg der Alpen.'],
      ['Färöer (Tórshavn)', 62.009, -6.772, 'Hier ziehen Grindwale vorbei.'], ['Bergen', 60.391, 5.322], ['Sevilla', 37.389, -5.984]],
  },
  welt: {
    leicht: [['New York', 40.713, -74.006], ['Tokio', 35.676, 139.65], ['Sydney', -33.869, 151.209], ['Rio de Janeiro', -22.907, -43.173], ['Kairo', 30.044, 31.236],
      ['Los Angeles', 34.052, -118.244], ['Peking', 39.904, 116.407], ['Mumbai', 19.076, 72.878], ['Kapstadt', -33.925, 18.424, 'Vor der Küste jagen Weiße Haie.'],
      ['Mexiko-Stadt', 19.433, -99.133], ['Moskau', 55.756, 37.617], ['London', 51.507, -0.128], ['Buenos Aires', -34.604, -58.382], ['Toronto', 43.653, -79.383], ['Singapur', 1.352, 103.82]],
    mittel: [['Hawaii (Honolulu)', 21.307, -157.858, 'Hier überwintern Buckelwale und bekommen ihre Jungen.'], ['Galápagos-Inseln', -0.954, -90.966, 'Hammerhaie in riesigen Schwärmen.'],
      ['Azoren', 37.741, -25.676, 'Pottwale leben hier das ganze Jahr.'], ['Great Barrier Reef (Cairns)', -16.92, 145.77, 'Das größte Korallenriff der Welt.'],
      ['Kap Hoorn', -55.98, -67.27, 'Die gefürchtete Südspitze Amerikas.'], ['Nairobi', -1.292, 36.822], ['Lima', -12.046, -77.043], ['Bangkok', 13.756, 100.502],
      ['Dubai', 25.205, 55.271], ['Anchorage', 61.218, -149.9], ['Seoul', 37.567, 126.978], ['Jakarta', -6.208, 106.846], ['Lagos', 6.524, 3.379],
      ['Santiago de Chile', -33.449, -70.669], ['Vancouver', 49.283, -123.121, 'Hier leben Orcas in der Salish Sea.'], ['Reykjavík', 64.147, -21.942]],
    profi: [['Mount Everest', 27.988, 86.925, 'Mit 8849 m der höchste Berg der Erde.'], ['Tristan da Cunha', -37.11, -12.28, 'Die abgelegenste bewohnte Insel der Welt.'],
      ['Antananarivo (Madagaskar)', -18.879, 47.508], ['Ulaanbaatar', 47.886, 106.906], ['Nuuk (Grönland)', 64.181, -51.694], ['Tahiti', -17.535, -149.57],
      ['Kamtschatka', 53.017, 158.65], ['Timbuktu', 16.774, -3.007], ['Perth', -31.95, 115.86], ['Baikalsee', 53.5, 108.0, 'Der tiefste See der Erde.'],
      ['Osterinsel', -27.113, -109.35], ['Bermuda', 32.307, -64.751], ['Spitzbergen', 78.223, 15.627, 'Eisbären, Walrosse – und Grönlandwale.'],
      ['Wellington', -41.286, 174.776], ['Malé (Malediven)', 4.175, 73.509, 'Walhaie, die größten Fische der Welt.'], ['Hobart (Tasmanien)', -42.882, 147.327]],
  },
};

// ---------- Rechnen ----------
function ktProjiziere(karte, lat, lon) {
  const k = KARTEN_DATEN[karte], c = Math.cos(k.phi0 * Math.PI / 180);
  return [(lon - k.lon0) * c * k.skala, (k.lat1 - lat) * k.skala];
}
function ktZurueck(karte, x, y) {
  const k = KARTEN_DATEN[karte], c = Math.cos(k.phi0 * Math.PI / 180);
  return [k.lat1 - y / k.skala, k.lon0 + x / (c * k.skala)];
}
function ktKm(lat1, lon1, lat2, lon2) {   // Großkreis-Entfernung (Haversine)
  const r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}
const ktPunkte = (karte, km) => Math.round(10 * Math.max(0, 1 - km / KT_MODI[karte].km) * 10) / 10;
const kmText = (km) => (km < 10 ? fmt(Math.round(km * 10) / 10) : fmt(Math.round(km))) + ' km';

function ktRunden(seed, modus, stufe) {
  const rng = zufallsGenerator(seed + '|' + modus + '|' + stufe);
  const karten = modus === 'mix' ? ['deutschland', 'deutschland', 'europa', 'europa', 'welt'] : Array(KT_RUNDEN).fill(modus);
  const genutzt = new Set();
  return karten.map((karte) => {
    const liste = KT_ORTE[karte][stufe].filter((o) => !genutzt.has(o[0]));
    const o = liste[Math.floor(rng() * liste.length)];
    genutzt.add(o[0]);
    return { karte, name: o[0], lat: o[1], lon: o[2], info: o[3] || '' };
  });
}

// ---------- Karte zeichnen ----------
function ktSvg(karte, ohneGrenzen) {
  const k = KARTEN_DATEN[karte];
  return '<svg class="kt-svg' + (ohneGrenzen ? ' ohne-grenzen' : '') + '" viewBox="0 0 ' + k.b + ' ' + k.h + '" preserveAspectRatio="xMidYMid meet">'
    + '<rect class="kt-meer" width="' + k.b + '" height="' + k.h + '"/>'
    + '<path class="kt-land" d="' + k.land + '"/>' + (k.heim ? '<path class="kt-land kt-heim" d="' + k.heim + '"/>' : '')
    + '<g class="kt-marken"></g></svg>';
}
function ktSvgPunkt(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [p.x, p.y];
}
// Größe der Markierungen an die sichtbare Kartengröße anpassen (gleich groß auf jedem Bildschirm)
function ktMassstab(svg) {
  const r = svg.getBoundingClientRect(), k = svg.viewBox.baseVal;
  return k.width / Math.max(1, r.width);
}

// ---------- Spielablauf ----------
let kt = null;
let ktModus = 'deutschland', ktStufe = 'leicht', ktGegner = null;
const ktStore = () => loadJson(KT_KEY);
const ktTeile = ['intro', 'spiel', 'aufloesung', 'ende'];
const zeigeKtTeil = (t) => ktTeile.forEach((x) => { $('kt-' + x).hidden = x !== t; });

function karteIntro() {
  const st = ktStore(), best = (st.best || {})[ktModus] || {};
  $('ktModi').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.modus === ktModus));
  $('ktLead').textContent = KT_MODI[ktModus].lead;
  $('ktStufen').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.stufe === ktStufe);
    b.querySelector('small').textContent = KT_STUFEN[b.dataset.stufe].klein;
  });
  $('ktBest').textContent = 'Bestwerte ' + KT_MODI[ktModus].name + ': '
    + Object.entries(KT_STUFEN).map(([k, v]) => v.name + ' ' + (best[k] != null ? fmt(best[k]) : '–')).join(' · ');
  const t = st.tag && st.tag[heute()];
  $('ktTagBtn').textContent = t != null ? '📅 Tagesreise – heute: ' + fmt(t) + ' / 50' : '📅 Tagesreise (heute für alle gleich)';
  $('ktRunde').textContent = '';
  zeigeKtTeil('intro');
}

function karteStart(opts = {}) {
  const modus = opts.taeglich ? 'mix' : opts.modus || ktModus;
  const stufe = opts.taeglich ? 'mittel' : opts.stufe || ktStufe;
  const seed = opts.seed || (opts.taeglich ? 'kt-' + heute() : String(Math.random()).slice(2));
  kt = { modus, stufe, seed, taeglich: !!opts.taeglich, runden: ktRunden(seed, modus, stufe), i: 0, punkte: [], antworten: [], gegner: opts.gegner || null };
  ktRundeZeigen();
}

// Karte wie in einer Karten-App: zwei Finger zoomen, ein Finger verschiebt, kurzes Tippen setzt die Nadel.
// Am Computer: Mausrad zoomt, Ziehen verschiebt. Dazu Knöpfe + / − / ganze Karte.
const KT_MAX_ZOOM = { deutschland: 5, europa: 10, welt: 18 };
function ktKarteBedienen(box, karte, onTipp) {
  const k = KARTEN_DATEN[karte], svg = box.querySelector('svg');
  svg.setAttribute('preserveAspectRatio', 'none');   // Seitenverhältnis halten wir selbst passend zum Kasten
  const v = { x: 0, y: 0, w: Infinity, h: k.h };   // Start: ganze Karte einpassen
  const masse = () => { const r = svg.getBoundingClientRect(); return [Math.max(1, r.width), Math.max(1, r.height), r]; };
  let ganz = true;
  const nadelGroesse = () => {
    const m = v.w / masse()[0];
    svg.querySelectorAll('.kt-marken g').forEach((g) => g.setAttribute('transform', g.getAttribute('transform').replace(/scale\([^)]*\)/, 'scale(' + m + ')')));
  };
  const zeichnen = () => {
    const [cw, ch] = masse(), seiten = ch / cw;
    const maxW = Math.max(k.b, k.h / seiten), minW = k.b / KT_MAX_ZOOM[karte];
    v.w = Math.max(minW, Math.min(maxW, v.w));
    v.h = v.w * seiten;
    // nicht aus der Karte hinaus schieben; ist der Ausschnitt größer als die Karte, wird sie mittig gezeigt
    v.x = v.w >= k.b ? (k.b - v.w) / 2 : Math.max(0, Math.min(k.b - v.w, v.x));
    v.y = v.h >= k.h ? (k.h - v.h) / 2 : Math.max(0, Math.min(k.h - v.h, v.y));
    ganz = v.w >= maxW - 0.5;
    svg.setAttribute('viewBox', [v.x, v.y, v.w, v.h].map((z) => z.toFixed(2)).join(' '));
    nadelGroesse();
  };
  const kartenPunkt = (px, py) => { const [cw, ch, r] = masse(); return [v.x + (px - r.left) / cw * v.w, v.y + (py - r.top) / ch * v.h]; };
  const zoomUm = (px, py, f) => {
    const [cw, ch, r] = masse(), rx = (px - r.left) / cw, ry = (py - r.top) / ch;
    const [mx, my] = kartenPunkt(px, py);
    v.w /= f; v.h = v.w * ch / cw;
    v.x = mx - rx * v.w; v.y = my - ry * v.h;
    zeichnen();
  };
  const zoomMitte = (f) => { const [, , r] = masse(); zoomUm(r.left + r.width / 2, r.top + r.height / 2, f); };
  // Zeiger: 1 Finger = verschieben oder tippen, 2 Finger = zoomen
  const zeiger = new Map();
  let start = null, bewegt = false, letzt = null, letzterTipp = null;
  const zwei = () => { const [a, b] = [...zeiger.values()]; return { d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; };
  svg.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { svg.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
    zeiger.set(e.pointerId, [e.clientX, e.clientY]);
    if (zeiger.size === 1) { start = { px: e.clientX, py: e.clientY, x: v.x, y: v.y }; bewegt = false; }
    else if (zeiger.size === 2) { letzt = zwei(); bewegt = true; }
  });
  svg.addEventListener('pointermove', (e) => {
    if (!zeiger.has(e.pointerId)) return;
    zeiger.set(e.pointerId, [e.clientX, e.clientY]);
    if (zeiger.size >= 2) {
      const jetzt = zwei(), [cw, ch] = masse();
      zoomUm(jetzt.m[0], jetzt.m[1], jetzt.d / (letzt.d || 1));
      v.x -= (jetzt.m[0] - letzt.m[0]) / cw * v.w; v.y -= (jetzt.m[1] - letzt.m[1]) / ch * v.h;
      zeichnen();
      letzt = jetzt;
    } else if (start) {
      const dx = e.clientX - start.px, dy = e.clientY - start.py;
      if (!bewegt && Math.hypot(dx, dy) > 8) bewegt = true;
      if (bewegt) { const [cw, ch] = masse(); v.x = start.x - dx / cw * v.w; v.y = start.y - dy / ch * v.h; zeichnen(); }
    }
  });
  const los = (e) => {
    if (!zeiger.has(e.pointerId)) return;
    zeiger.delete(e.pointerId);
    if (zeiger.size === 0) {
      if (!bewegt && start && e.type === 'pointerup') {
        onTipp(kartenPunkt(e.clientX, e.clientY));
        // Doppeltippen (wie in Karten-Apps) zoomt an dieser Stelle hinein
        const jetzt = performance.now();
        if (letzterTipp && jetzt - letzterTipp.t < 320 && Math.hypot(e.clientX - letzterTipp.x, e.clientY - letzterTipp.y) < 30) { zoomUm(e.clientX, e.clientY, 2.2); letzterTipp = null; }
        else letzterTipp = { t: jetzt, x: e.clientX, y: e.clientY };
      }
      start = null;
    } else if (zeiger.size === 1) {   // von zwei auf einen Finger: weiter verschieben, aber nicht als Tippen werten
      const [p] = [...zeiger.values()];
      start = { px: p[0], py: p[1], x: v.x, y: v.y };
      bewegt = true;
    }
  };
  svg.addEventListener('pointerup', los);
  svg.addEventListener('pointercancel', los);
  svg.addEventListener('wheel', (e) => { e.preventDefault(); zoomUm(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0022)); }, { passive: false });
  svg.addEventListener('contextmenu', (e) => e.preventDefault());
  const steuer = document.createElement('div');
  steuer.className = 'kt-steuer';
  steuer.innerHTML = '<button type="button" aria-label="Hineinzoomen">+</button><button type="button" aria-label="Herauszoomen">−</button><button type="button" aria-label="Ganze Karte">⤢</button>';
  const [plus, minus, alles] = steuer.querySelectorAll('button');
  plus.onclick = () => zoomMitte(1.8);
  minus.onclick = () => zoomMitte(1 / 1.8);
  alles.onclick = () => { v.w = Infinity; zeichnen(); };
  box.appendChild(steuer);
  const neu = () => zeichnen();
  window.addEventListener('resize', neu);
  zeichnen();
  return { zeichnen, nadelGroesse, ende: () => window.removeEventListener('resize', neu), ganz: () => ganz };
}

function ktRundeZeigen() {
  const rd = kt.runden[kt.i];
  $('ktRunde').textContent = KT_MODI[rd.karte].emoji + ' ' + KT_MODI[rd.karte].name + ' · ' + (kt.i + 1) + ' / ' + KT_RUNDEN;
  $('ktFrage').innerHTML = 'Wo liegt <b></b>';
  $('ktFrage').querySelector('b').textContent = rd.name + '?';
  zeigeKtTeil('spiel');
  const box = $('ktKarte');
  box.className = 'kt-karte spiel kt-' + rd.karte;
  box.innerHTML = ktSvg(rd.karte, kt.stufe === 'profi');
  const svg = box.querySelector('svg'), marken = svg.querySelector('.kt-marken');
  $('ktFertig').disabled = true;
  kt.tipp = null;
  if (kt.bedienung) kt.bedienung.ende();
  kt.bedienung = ktKarteBedienen(box, rd.karte, ([x, y]) => {
    kt.tipp = [x, y];
    marken.innerHTML = '<g class="kt-nadel" transform="translate(' + x + ' ' + y + ') scale(1)"><circle r="7"/><circle class="kern" r="2.5"/></g>';
    kt.bedienung.nadelGroesse();
    $('ktFertig').disabled = false;
    if (navigator.vibrate) navigator.vibrate(8);
  });
}

function ktAuswerten() {
  const rd = kt.runden[kt.i];
  const [lat, lon] = ktZurueck(rd.karte, kt.tipp[0], kt.tipp[1]);
  const km = ktKm(rd.lat, rd.lon, lat, lon);
  const p = ktPunkte(rd.karte, km);
  kt.punkte.push(p);
  kt.antworten.push({ lat, lon, km });
  zeigeKtTeil('aufloesung');
  hochzaehlen($('ktPunkte'), p, ' / 10');
  $('ktKommentar').textContent = p >= 9.5 ? 'Punktlandung! 🎯' : p >= 8 ? 'Richtig nah dran 🔥' : p >= 6 ? 'Gute Richtung 👍' : p >= 3 ? 'Etwas daneben 🤔' : 'Ganz woanders 🙈';
  const box = $('ktErgebnisKarte');
  box.className = 'kt-karte kt-' + rd.karte + ' ergebnis';
  box.innerHTML = ktSvg(rd.karte, false);
  const svg = box.querySelector('svg'), marken = svg.querySelector('.kt-marken');
  const [zx, zy] = ktProjiziere(rd.karte, rd.lat, rd.lon), [tx, ty] = kt.tipp;
  requestAnimationFrame(() => {
    const m = ktMassstab(svg);
    marken.innerHTML = '<line class="kt-strecke" x1="' + tx + '" y1="' + ty + '" x2="' + zx + '" y2="' + zy + '" stroke-width="' + 2.5 * m + '" stroke-dasharray="' + 6 * m + ' ' + 5 * m + '"/>'
      + '<g class="kt-nadel" transform="translate(' + tx + ' ' + ty + ') scale(' + m + ')"><circle r="7"/><circle class="kern" r="2.5"/></g>'
      + '<g class="kt-ziel" transform="translate(' + zx + ' ' + zy + ') scale(' + m + ')"><circle class="welle" r="16"/><circle r="8"/><path d="M-3.5 0l2.5 2.5 4.5-5"/></g>';
    // Ergebnis-Ausschnitt: auf Ziel und Tipp zoomen, wenn beide nah beieinander liegen
    const k = KARTEN_DATEN[rd.karte];
    const pad = Math.max(60, Math.hypot(zx - tx, zy - ty) * 0.6);
    let x0 = Math.min(zx, tx) - pad, y0 = Math.min(zy, ty) - pad, w = Math.abs(zx - tx) + 2 * pad, h = Math.abs(zy - ty) + 2 * pad;
    const seiten = k.b / k.h;   // Seitenverhältnis der Karte beibehalten
    if (w / h < seiten) { const nw = h * seiten; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / seiten; y0 -= (nh - h) / 2; h = nh; }
    x0 = Math.max(0, Math.min(k.b - w, x0)); y0 = Math.max(0, Math.min(k.h - h, y0));   // nicht über den Kartenrand hinaus
    if (rd.karte !== 'deutschland' && w < k.b * 0.95 && h <= k.h) {
      svg.setAttribute('viewBox', [x0, y0, w, h].map((v) => v.toFixed(1)).join(' '));
      const m2 = ktMassstab(svg);
      marken.querySelectorAll('g').forEach((g) => g.setAttribute('transform', g.getAttribute('transform').replace(/scale\([^)]*\)/, 'scale(' + m2 + ')')));
      const l = marken.querySelector('line');
      l.setAttribute('stroke-width', 2.5 * m2); l.setAttribute('stroke-dasharray', 6 * m2 + ' ' + 5 * m2);
    }
  });
  $('ktText').innerHTML = '<b></b> liegt <span class="kt-km"></span> von deinem Tipp entfernt.';
  $('ktText').querySelector('b').textContent = rd.name;
  $('ktText').querySelector('.kt-km').textContent = kmText(km);
  $('ktInfo').textContent = rd.info;
  $('ktInfo').hidden = !rd.info;
  if (navigator.vibrate) navigator.vibrate(p >= 8 ? [30, 40, 30] : 20);
  if (p >= 9.5) konfetti(24, ['🧭', '📍', '✨', '🎯']);
  $('ktWeiter').textContent = kt.i === KT_RUNDEN - 1 ? 'Zum Ergebnis' : 'Nächster Ort';
}

function karteEnde() {
  const summe = Math.round(kt.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const st = ktStore();
  st.best = st.best || {}; st.tag = st.tag || {};
  let rekord = false;
  if (kt.taeglich) { if (st.tag[heute()] == null) st.tag[heute()] = summe; }
  else {
    const b = st.best[kt.modus] = st.best[kt.modus] || {};
    rekord = b[kt.stufe] == null || summe > b[kt.stufe];
    b[kt.stufe] = Math.max(b[kt.stufe] || 0, summe);
  }
  saveJson(KT_KEY, st);
  zeigeKtTeil('ende');
  if (typeof merkeVerlauf === 'function') merkeVerlauf('karte', summe, 50, kt.modus === 'mix' ? 'Tagesreise' : KT_MODI[kt.modus].name + ' · ' + KT_STUFEN[kt.stufe].name);
  $('ktRunde').textContent = '';
  hochzaehlen($('ktSumme'), summe, ' / 50');
  $('ktRekord').textContent = rekord ? '🏆 Neuer Bestwert (' + KT_MODI[kt.modus].name + ', ' + KT_STUFEN[kt.stufe].name + ')!'
    : kt.taeglich ? '📅 Tagesreise vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('ktVergleich').hidden = !kt.gegner;
  if (kt.gegner) {
    const g = kt.gegner;
    $('ktVergleich').textContent = summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + fmt(g.punkte) + ')!'
      : summe < g.punkte ? g.name + ' war besser (' + fmt(g.punkte) + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  const liste = $('ktListe');
  liste.innerHTML = '';
  kt.runden.forEach((rd, i) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="tl-n"></span><span class="tl-c"></span><b></b>';
    li.querySelector('.tl-n').textContent = '📍 ' + rd.name;
    li.querySelector('.tl-c').textContent = kmText(kt.antworten[i].km);
    li.querySelector('b').textContent = fmt(kt.punkte[i]);
    liste.appendChild(li);
  });
  const gesamt = kt.antworten.reduce((s, a) => s + a.km, 0);
  $('ktGesamtKm').textContent = 'Zusammen ' + kmText(gesamt) + ' daneben';
  if (summe >= 40) setTimeout(() => konfetti(50, ['🧭', '🌍', '📍', '🏆']), 400);
}

async function karteTeilen() {
  const summe = Math.round(kt.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const name = loadJson(STORE_KEY).name || 'Jemand';
  const url = location.origin + location.pathname + '?karte=' + encodeURIComponent(kt.seed) + '&m=' + kt.modus + '&stufe=' + kt.stufe
    + '&n=' + encodeURIComponent(name) + '&p=' + summe;
  const k = (p) => (p >= 9 ? '🟩' : p >= 7 ? '🟨' : p >= 5 ? '🟧' : '🟥');
  const titel = kt.modus === 'mix' ? 'Tagesreise ' + new Date().toLocaleDateString('de-DE') : KT_MODI[kt.modus].name + ' (' + KT_STUFEN[kt.stufe].name + ')';
  const text = '🧭 Karten-Gefühl – ' + titel + '\n' + fmt(summe) + ' / 50 ' + kt.punkte.map(k).join('') + '\nFindest du die Orte besser? Gleiche Orte:';
  if (navigator.share) {
    try { await navigator.share({ title: 'Karten-Gefühl', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('ktTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('ktTeilenMsg').textContent = url; }
}

// ---------- Knöpfe ----------
$('ktModi').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { ktModus = b.dataset.modus; karteIntro(); }));
$('ktStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { ktStufe = b.dataset.stufe; karteIntro(); }));
$('ktLos').addEventListener('click', () => {
  if (ktGegner) { const g = ktGegner; ktGegner = null; $('ktChallenge').hidden = true; karteStart({ modus: g.modus, stufe: g.stufe, seed: g.seed, gegner: g }); }
  else karteStart();
});
$('ktTagBtn').addEventListener('click', () => karteStart({ taeglich: true }));
$('ktFertig').addEventListener('click', () => { if (kt.tipp) { if (kt.bedienung) kt.bedienung.ende(); ktAuswerten(); } });
$('ktWeiter').addEventListener('click', () => { kt.i++; if (kt.i >= KT_RUNDEN) karteEnde(); else ktRundeZeigen(); });
$('ktNochmalSpiel').addEventListener('click', () => karteStart({ modus: kt.modus === 'mix' ? ktModus : kt.modus, stufe: kt.stufe }));
$('ktTeilen').addEventListener('click', karteTeilen);
$('ktZurueck').addEventListener('click', () => {
  if (kt && $('kt-intro').hidden) { kt = null; karteIntro(); return; }
  kt = null;
  zeigeHub();
});
$('hubKarte').addEventListener('click', () => { merkeZuletzt('karte'); zoomZu($('hubKarte'), () => { show('karte', '🧭 Karten-Gefühl'); karteIntro(); }); });

// Challenge-Link: ?karte=<seed>&m=…&stufe=…&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('karte')) return;
  const modus = (KT_MODI[q.get('m')] || q.get('m') === 'mix') ? q.get('m') : 'deutschland';
  const stufe = KT_STUFEN[q.get('stufe')] ? q.get('stufe') : 'leicht';
  ktGegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('karte'), modus, stufe };
  history.replaceState(null, '', location.pathname);
  show('karte', '🧭 Karten-Gefühl');
  if (modus !== 'mix') { ktModus = modus; ktStufe = stufe; }
  karteIntro();
  $('ktChallenge').hidden = false;
  $('ktChallenge').textContent = ktGegner.name + ' hat ' + fmt(ktGegner.punkte) + ' / 50 Punkte ('
    + (modus === 'mix' ? 'Tagesreise' : KT_MODI[modus].name + ', ' + KT_STUFEN[stufe].name) + '). Gleiche Orte – findest du sie besser?';
})();
