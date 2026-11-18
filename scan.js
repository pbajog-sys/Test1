// 🔎 Zutaten-Check: Barcode scannen (Kamera, ZXing lokal) oder eintippen → Produktdaten aus Open Food Facts bzw.
// Open Beauty Facts (frei, ohne Konto) → eigene Ampel mit nachvollziehbaren Gründen + persönliche Filter.
// Es wird nur der Barcode an openfoodfacts.org / openbeautyfacts.org geschickt. Verlauf, Favoriten und Filter bleiben lokal.
const SC_KEY = 'walquiz.scan.v1';
const SC_FELDER = 'code,product_name,product_name_de,brands,quantity,nutriscore_grade,nova_group,additives_tags,allergens_tags,traces_tags,ingredients_analysis_tags,ingredients_tags,ingredients_text_de,ingredients_text,nutriments,image_front_small_url,categories_tags,serving_quantity';
const SC_FILTER = [
  ['vegan', '🌱 Vegan'], ['vegetarisch', '🥕 Vegetarisch'], ['palmoel', '🌴 Ohne Palmöl'], ['milch', '🥛 Ohne Milch/Laktose'],
  ['gluten', '🌾 Glutenfrei'], ['nuesse', '🥜 Ohne Nüsse/Erdnüsse'], ['ei', '🥚 Ohne Ei'], ['soja', '🫘 Ohne Soja'],
];
const SC_ALLERGEN = { milch: ['en:milk'], gluten: ['en:gluten'], nuesse: ['en:nuts', 'en:peanuts'], ei: ['en:eggs'], soja: ['en:soybeans'] };
const SC_ALLERGEN_NAME = { milch: 'Milch/Laktose', gluten: 'Gluten', nuesse: 'Nüsse/Erdnüsse', ei: 'Ei', soja: 'Soja' };
// Zusatzstoffe: „warn“ = EU-Pflichthinweis bzw. in Lebensmitteln verboten; „umstritten“ = in der Diskussion, Grenzwerte beachten
const SC_ZUSATZ = {
  'en:e171': ['rot', 'Titandioxid – seit 2022 in EU-Lebensmitteln verboten (EFSA: Genotoxizität nicht ausschließbar)'],
  'en:e102': ['warn', 'Tartrazin – Azofarbstoff, EU-Warnhinweis „kann Aktivität und Aufmerksamkeit bei Kindern beeinträchtigen“'],
  'en:e104': ['warn', 'Chinolingelb – EU-Warnhinweis für Kinder (VO 1333/2008)'],
  'en:e110': ['warn', 'Gelborange S – Azofarbstoff, EU-Warnhinweis für Kinder'],
  'en:e122': ['warn', 'Azorubin – Azofarbstoff, EU-Warnhinweis für Kinder'],
  'en:e124': ['warn', 'Cochenillerot A – Azofarbstoff, EU-Warnhinweis für Kinder'],
  'en:e129': ['warn', 'Allurarot – Azofarbstoff, EU-Warnhinweis für Kinder'],
  'en:e249': ['umstritten', 'Kaliumnitrit – Pökelstoff, kann Nitrosamine bilden'],
  'en:e250': ['umstritten', 'Natriumnitrit – Pökelstoff, kann Nitrosamine bilden'],
  'en:e251': ['umstritten', 'Natriumnitrat – Pökelstoff, kann Nitrosamine bilden'],
  'en:e252': ['umstritten', 'Kaliumnitrat – Pökelstoff, kann Nitrosamine bilden'],
  'en:e320': ['umstritten', 'BHA – Antioxidans, umstritten (hormonelle Wirkung diskutiert)'],
  'en:e321': ['umstritten', 'BHT – Antioxidans, umstritten'],
  'en:e338': ['umstritten', 'Phosphorsäure – Phosphate: EFSA empfiehlt, die Gesamtaufnahme zu begrenzen'],
  'en:e339': ['umstritten', 'Natriumphosphate – Gesamtaufnahme begrenzen (EFSA 2019)'],
  'en:e340': ['umstritten', 'Kaliumphosphate – Gesamtaufnahme begrenzen (EFSA 2019)'],
  'en:e341': ['umstritten', 'Calciumphosphate – Gesamtaufnahme begrenzen (EFSA 2019)'],
  'en:e450': ['umstritten', 'Diphosphate – Gesamtaufnahme begrenzen (EFSA 2019)'],
  'en:e451': ['umstritten', 'Triphosphate – Gesamtaufnahme begrenzen (EFSA 2019)'],
  'en:e452': ['umstritten', 'Polyphosphate – Gesamtaufnahme begrenzen (EFSA 2019)'],
  'en:e407': ['umstritten', 'Carrageen – Verdickungsmittel, Wirkung auf den Darm diskutiert'],
};
// Kosmetik (INCI, so wie Open Beauty Facts sie als ingredients_tags führt)
const SC_INCI = [
  [/butylphenyl-methylpropional|lilial/, 'rot', 'Butylphenyl Methylpropional (Lilial) – seit 2022 in EU-Kosmetik verboten'],
  [/^en:(isopropylparaben|isobutylparaben|phenylparaben|benzylparaben|pentylparaben)$/, 'rot', 'Paraben, das seit 2014 in der EU verboten ist'],
  [/^en:(polyethylene|polypropylene|nylon-12|nylon-6|polymethyl-methacrylate|polystyrene|polyethylene-terephthalate|acrylates-copolymer|acrylates-crosspolymer)$/, 'gelb', 'Kunststoff (Mikroplastik bzw. synthetisches Polymer)'],
  [/^en:(dmdm-hydantoin|imidazolidinyl-urea|diazolidinyl-urea|quaternium-15|2-bromo-2-nitropropane-1-3-diol|sodium-hydroxymethylglycinate)$/, 'gelb', 'Formaldehyd-Abspalter – seit 2022 Hinweispflicht ab 0,001 % (VO 2022/1181)'],
  [/^en:(propylparaben|butylparaben)$/, 'gelb', 'Paraben mit EU-Höchstmenge (hormonelle Wirkung diskutiert)'],
  [/^en:(methylisothiazolinone|methylchloroisothiazolinone)$/, 'gelb', 'Isothiazolinon – häufiges Kontaktallergen, in Leave-on-Produkten verboten'],
  [/^en:triclosan$/, 'gelb', 'Triclosan – antibakteriell, nur noch eingeschränkt erlaubt'],
  [/^en:(limonene|linalool|citronellol|geraniol|coumarin|eugenol|isoeugenol|citral|hexyl-cinnamal|benzyl-salicylate|benzyl-benzoate|benzyl-cinnamate|cinnamal|cinnamyl-alcohol|farnesol|alpha-isomethyl-ionone|amyl-cinnamal|amylcinnamyl-alcohol|hydroxycitronellal|anise-alcohol|evernia-prunastri-extract|evernia-furfuracea-extract)$/, 'info', 'Duftstoff-Allergen (in der EU deklarationspflichtig)'],
  [/^en:(sodium-lauryl-sulfate)$/, 'info', 'Sodium Lauryl Sulfate – Tensid, kann empfindliche Haut reizen'],
];
// Nährwert-Ampel je 100 g (Schwellen der britischen Lebensmittelbehörde FSA, Front-of-Pack-Kennzeichnung)
const SC_NAEHR = [
  ['fat_100g', 'Fett', 3, 17.5], ['saturated-fat_100g', 'ges. Fettsäuren', 1.5, 5], ['sugars_100g', 'Zucker', 5, 22.5], ['salt_100g', 'Salz', 0.3, 1.5],
];
let sc = null;

function scStore() {
  const s = loadJson(SC_KEY, null);
  const ok = s && typeof s === 'object' && s.version === 1;
  return {
    version: 1,
    verlauf: ok && Array.isArray(s.verlauf) ? s.verlauf.filter((v) => v && /^\d{6,14}$/.test(v.code)) : [],
    cache: ok && s.cache && typeof s.cache === 'object' ? s.cache : {},
    favoriten: ok && Array.isArray(s.favoriten) ? s.favoriten.filter((c) => /^\d{6,14}$/.test(c)) : [],
    filter: ok && s.filter && typeof s.filter === 'object' ? s.filter : {},
    // Kalorien-Tagebuch (ab v133; ältere Stände ohne diese Felder bekommen leere Vorgaben)
    tagebuch: ok && Array.isArray(s.tagebuch) ? s.tagebuch.filter((e) => e && /^\d{4}-\d{2}-\d{2}$/.test(e.tag) && isFinite(+e.kcal) && +e.kcal >= 0 && typeof e.name === 'string').map((e) => (SC_MAHLZEIT_IDS.includes(e.m) ? e : { ...e, m: scMahlzeitJetzt(new Date(+e.zeit || Date.now())) })) : [],
    ziel: ok && +s.ziel >= 1000 && +s.ziel <= 6000 ? Math.round(+s.ziel) : 2000,
    // ab v134: Mahlzeit je Eintrag (alte Einträge bekommen sie aus der Uhrzeit), Makro-Ziele, Profil, Wasser, zuletzt offene Seite
    makro: ok && s.makro && +s.makro.e >= 20 && +s.makro.e <= 400 && +s.makro.f >= 20 && +s.makro.f <= 300 ? { e: Math.round(+s.makro.e), f: Math.round(+s.makro.f) } : null,
    profil: ok && typeof scProfilOk === 'function' && scProfilOk(s.profil) ? s.profil : null,
    wasser: ok && s.wasser && typeof s.wasser === 'object' ? Object.fromEntries(Object.entries(s.wasser).filter(([t, n]) => /^\d{4}-\d{2}-\d{2}$/.test(t) && Number.isInteger(n) && n >= 0 && n <= 20)) : {},
    seite: ok && Number.isInteger(s.seite) && s.seite >= 0 && s.seite <= 3 ? s.seite : 0,
  };
}
function scSpeichern(s) {
  const codes = Object.keys(s.cache);
  if (codes.length > 150) { const behalten = new Set([...s.favoriten, ...s.verlauf.slice(0, 100).map((v) => v.code)]); codes.forEach((c) => { if (!behalten.has(c)) delete s.cache[c]; }); }
  s.verlauf = s.verlauf.slice(0, 100); s.tagebuch = s.tagebuch.slice(-3000);
  const alt = scTag(new Date(Date.now() - 90 * 864e5)); Object.keys(s.wasser || {}).forEach((t) => { if (t < alt) delete s.wasser[t]; });
  saveJson(SC_KEY, s);
}
const scEsc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// EAN-8/13, UPC-A (12): Prüfziffer
function scPruefziffer(code) {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false;
  const d = code.split('').map(Number), last = d.pop(); let sum = 0;
  d.reverse().forEach((x, i) => { sum += x * (i % 2 === 0 ? 3 : 1); });
  return (10 - (sum % 10)) % 10 === last;
}

// ---------- Bewertung (reine Funktion, testbar) ----------
// p: Produkt (OFF-Format), art: 'food' | 'kosmetik', filter: { vegan: true, … } → { ampel, satz, gruende[], konflikte[] }
function scBewerten(p, art, filter = {}) {
  const gruende = [], konflikte = [], tags = (k) => (Array.isArray(p[k]) ? p[k] : []);
  const ana = tags('ingredients_analysis_tags');
  let stufe = 0; // 0 grün, 1 gelb, 2 rot
  const hoch = (s) => { stufe = Math.max(stufe, s); };
  if (art === 'food') {
    const ns = String(p.nutriscore_grade || '').toLowerCase();
    if (/^[a-e]$/.test(ns)) { const s = 'ab'.includes(ns) ? 0 : ns === 'c' ? 1 : 2; hoch(s); gruende.push({ farbe: ['gruen', 'gelb', 'rot'][s], text: 'Nutri-Score ' + ns.toUpperCase() }); }
    if (+p.nova_group === 4) { hoch(1); gruende.push({ farbe: 'gelb', text: 'Stark verarbeitet (NOVA 4)' }); }
    else if (+p.nova_group >= 1) gruende.push({ farbe: 'gruen', text: 'Verarbeitungsgrad NOVA ' + +p.nova_group + ' von 4' });
    tags('additives_tags').forEach((t) => { const z = SC_ZUSATZ[t]; if (!z) return; const f = z[0] === 'rot' ? 'rot' : z[0] === 'warn' ? 'rot' : 'gelb'; hoch(f === 'rot' ? 2 : 1); gruende.push({ farbe: f, text: t.slice(3).toUpperCase() + ': ' + z[1] }); });
    const n = p.nutriments || {};
    if (!/^[a-e]$/.test(ns)) SC_NAEHR.forEach(([k, name, lo, hi]) => { const v = +n[k]; if (!isFinite(v) || n[k] == null) return; if (v > hi) { hoch(1); gruende.push({ farbe: 'rot', text: 'Viel ' + name + ' (' + scZahl(v) + ' g/100 g)' }); } });
    if (ana.includes('en:palm-oil')) gruende.push({ farbe: 'gelb', text: 'Enthält Palmöl' });
  } else {
    const gesehen = new Set();
    tags('ingredients_tags').forEach((t) => SC_INCI.forEach(([re, f, txt]) => { if (!re.test(t) || gesehen.has(txt + t)) return; gesehen.add(txt + t); if (f === 'rot') hoch(2); else if (f === 'gelb') hoch(1); gruende.push({ farbe: f === 'info' ? 'info' : f, text: scInci(t) + ': ' + txt }); }));
  }
  // persönliche Filter
  const alle = [...tags('allergens_tags')], spuren = tags('traces_tags');
  if (filter.vegan) { if (ana.includes('en:non-vegan')) konflikte.push('nicht vegan'); else if (!ana.includes('en:vegan')) konflikte.push('?vegan unklar'); }
  if (filter.vegetarisch) { if (ana.includes('en:non-vegetarian')) konflikte.push('nicht vegetarisch'); else if (!ana.includes('en:vegetarian') && !ana.includes('en:vegan')) konflikte.push('?vegetarisch unklar'); }
  if (filter.palmoel) { if (ana.includes('en:palm-oil')) konflikte.push('enthält Palmöl'); else if (ana.includes('en:may-contain-palm-oil') || ana.includes('en:palm-oil-content-unknown')) konflikte.push('?Palmöl nicht ausgeschlossen'); }
  Object.entries(SC_ALLERGEN).forEach(([k, liste]) => {
    if (!filter[k]) return; const name = SC_ALLERGEN_NAME[k];
    if (liste.some((t) => alle.includes(t))) konflikte.push('enthält ' + name); else if (liste.some((t) => spuren.includes(t))) konflikte.push('?kann Spuren enthalten: ' + name);
  });
  const hart = konflikte.filter((k) => k[0] !== '?');
  const genug = gruende.some((g) => g.farbe !== 'info') || (art === 'kosmetik' && tags('ingredients_tags').length > 0) || (art === 'food' && (p.nutriscore_grade || p.nova_group));
  let ampel = !genug ? 'grau' : ['gruen', 'gelb', 'rot'][stufe];
  if (hart.length) ampel = 'rot';
  const satz = hart.length ? 'Passt nicht zu deinen Filtern' : ampel === 'grau' ? 'Zu wenig Daten für eine Bewertung'
    : art === 'kosmetik' ? ['Keine auffälligen Inhaltsstoffe gefunden', 'Einzelne Inhaltsstoffe beachten', 'Enthält einen in der EU verbotenen bzw. stark kritischen Stoff'][stufe]
      : ['Gute Wahl', 'Geht so – ab und zu', 'Eher selten'][stufe];
  return { ampel, satz, gruende, konflikte };
}
// ---------- Ernährungs-Tagebuch: Kalorien, Eiweiß, Kohlenhydrate, Fett, Wasser ----------
const SC_MAHLZEITEN = [['fruehstueck', 'Frühstück', '🍳'], ['mittag', 'Mittagessen', '🥗'], ['abend', 'Abendessen', '🍝'], ['snack', 'Snacks', '🍎']];
const SC_MAHLZEIT_IDS = SC_MAHLZEITEN.map((m) => m[0]);
const SC_AKTIV = [[1.2, 'Kaum Bewegung (Büro, wenig Sport)'], [1.375, 'Leicht aktiv (1–3× Sport pro Woche)'], [1.55, 'Aktiv (3–5× Sport pro Woche)'], [1.725, 'Sehr aktiv (6–7× Sport pro Woche)'], [1.9, 'Extrem (körperliche Arbeit + Sport)']];
const SC_ZIELARTEN = { abnehmen: ['Abnehmen (≈ 0,5 kg/Woche)', -500], halten: ['Gewicht halten', 0], zunehmen: ['Muskeln aufbauen', 300] };
const SC_EIWEISS = [[0.8, '0,8 g/kg – DGE-Empfehlung für Erwachsene'], [1.2, '1,2 g/kg – aktiv'], [1.6, '1,6 g/kg – Krafttraining'], [2, '2,0 g/kg – Muskelaufbau / Diät mit Training']];
const SC_GLAS_ML = 250, SC_GLAESER = 8;
const scTag = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const scTagDatum = (t) => { const [y, m, d] = t.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const scTagPlus = (t, n) => { const d = scTagDatum(t); d.setDate(d.getDate() + n); return scTag(d); };
function scMahlzeitJetzt(d = new Date()) { const h = d.getHours() + d.getMinutes() / 60; return h >= 4 && h < 11 ? 'fruehstueck' : h >= 11 && h < 15 ? 'mittag' : h >= 17 && h < 22 ? 'abend' : 'snack'; }
// kcal je 100 g aus den Nährwerten (kJ wird umgerechnet); null, wenn die Datenbank nichts kennt
function scKcal100(p) { const n = (p && p.nutriments) || {}; const k = n['energy-kcal_100g'] != null ? +n['energy-kcal_100g'] : n.energy_100g != null ? +n.energy_100g / 4.184 : NaN; return isFinite(k) && k >= 0 && k <= 900 ? k : null; }
function scPortion(p, g) { const n = (p && p.nutriments) || {}, f = g / 100, m = (k) => (isFinite(+n[k]) && n[k] != null ? Math.round(+n[k] * f * 10) / 10 : 0); const k = scKcal100(p); return { kcal: k == null ? 0 : Math.round(k * f), e: m('proteins_100g'), k: m('carbohydrates_100g'), f: m('fat_100g') }; }
function scTagSumme(s, tag, mahlzeit) { const l = s.tagebuch.filter((e) => e.tag === tag && (!mahlzeit || e.m === mahlzeit)); return l.reduce((a, e) => ({ kcal: a.kcal + +e.kcal, e: a.e + (+e.e || 0), k: a.k + (+e.k || 0), f: a.f + (+e.f || 0), n: a.n + 1 }), { kcal: 0, e: 0, k: 0, f: 0, n: 0 }); }
function scEintragen(e) {
  const s = scStore(), tag = e.tag || (sc && sc.tag) || scTag(), m = SC_MAHLZEIT_IDS.includes(e.m) ? e.m : (sc && sc.mahlzeit) || scMahlzeitJetzt();
  const r = (v) => Math.round((+v || 0) * 10) / 10;
  s.tagebuch.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), tag, m, zeit: Date.now(), name: String(e.name).slice(0, 60), kcal: Math.round(+e.kcal || 0), e: r(e.e), k: r(e.k), f: r(e.f), ...(e.g ? { g: r(e.g) } : {}), ...(e.code ? { code: e.code } : {}) });
  scSpeichern(s); scHubText(); return scTagSumme(s, tag);
}
// Ziele: kcal + Eiweiß/Fett in g (gespeichert oder 20 %/30 % der kcal); Kohlenhydrate = Rest
function scZiele(s) {
  const kcal = s.ziel, e = s.makro && s.makro.e ? s.makro.e : Math.round((kcal * 0.2) / 4), f = s.makro && s.makro.f ? s.makro.f : Math.round((kcal * 0.3) / 9);
  return { kcal, e, f, k: Math.max(0, Math.round((kcal - 4 * e - 9 * f) / 4)) };
}
// Bedarf nach Mifflin-St Jeor × Aktivitätsfaktor ± Zielanpassung; Fett 30 % der Energie, Eiweiß g/kg Körpergewicht
function scBerechnen(pr) {
  const bmr = 10 * pr.gewicht + 6.25 * pr.groesse - 5 * pr.alter + (pr.geschlecht === 'm' ? 5 : -161);
  const tdee = bmr * SC_AKTIV[pr.aktiv][0], unten = pr.geschlecht === 'm' ? 1500 : 1200;
  const kcal = Math.max(unten, Math.min(6000, Math.round((tdee + SC_ZIELARTEN[pr.ziel][1]) / 10) * 10));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, e: Math.round(pr.ekg * pr.gewicht), f: Math.round((kcal * 0.3) / 9) };
}
const scLiter = (ml) => (ml / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 });
const scZahl = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
const scInci = (t) => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ---------- Datenabruf ----------
async function scHolen(code) {
  const s = scStore();
  const quellen = [['food', 'https://world.openfoodfacts.org'], ['kosmetik', 'https://world.openbeautyfacts.org']];
  let netzFehler = false;
  for (const [art, basis] of quellen) {
    try {
      const r = await fetch(basis + '/api/v2/product/' + code + '.json?fields=' + SC_FELDER, { headers: { Accept: 'application/json' } });
      if (!r.ok && r.status !== 404) { netzFehler = true; continue; }
      const j = await r.json();
      if (j && j.status === 1 && j.product) {
        const p = j.product; const eintrag = { art, quelle: basis, p, zeit: Date.now() };
        s.cache[code] = eintrag; scSpeichern(s); return eintrag;
      }
    } catch (e) { netzFehler = true; }
  }
  if (s.cache[code]) return { ...s.cache[code], offline: true };
  return { fehler: netzFehler ? 'netz' : 'unbekannt' };
}
const scName = (p) => p.product_name_de || p.product_name || 'Ohne Namen';

// ---------- Rahmen: vier Seiten zum Wischen + Tab-Leiste + Blatt (schiebt sich von rechts herein) ----------
const SC_SEITEN = [['heute', 'Heute', '🍽️'], ['scan', 'Scannen', '📷'], ['produkte', 'Produkte', '★'], ['ich', 'Ich', '👤']];
const scWenigBewegung = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function scOeffnen() {
  show('scan', '🔎 Zutaten-Check');
  const st = scStore();
  sc = { ansicht: 'start', tag: scTag(), seite: st.seite, stapel: [], mahlzeit: null };
  $('scInhalt').innerHTML = '';
  scStart();
  requestAnimationFrame(() => scSeite(st.seite, true));
}
function scRahmen() {
  const box = $('scInhalt');
  box.innerHTML = '<div class="sc-seiten" id="scSeiten">' + SC_SEITEN.map(([id, n]) => '<section class="sc-seite" id="scSeite_' + id + '" aria-label="' + n + '"></section>').join('') + '</div>'
    + '<nav class="sc-tabs" id="scTabs" role="tablist"><i class="sc-tab-licht" aria-hidden="true"></i>' + SC_SEITEN.map(([id, n, ic], i) => '<button type="button" class="sc-tab" role="tab" data-seite="' + i + '" aria-selected="false" aria-controls="scSeite_' + id + '"><b aria-hidden="true">' + ic + '</b>' + n + '</button>').join('') + '</nav>'
    + '<div class="sc-toast" id="scToast" role="status" aria-live="polite"></div>'
    + '<div class="sc-blatt" id="scBlatt" hidden data-eigene-geste><div class="sc-blatt-kopf"><button class="icon-btn" id="scBlattZu" type="button" aria-label="Zurück">←</button><span id="scBlattTitel"></span><span></span></div><div class="sc-blatt-inhalt" id="scBlattInhalt"></div></div>';
  const pg = $('scSeiten');
  pg.addEventListener('scroll', () => {
    const pos = pg.scrollLeft / (pg.clientWidth || 1); $('scTabs').style.setProperty('--pos', pos.toFixed(3));
    const i = Math.max(0, Math.min(SC_SEITEN.length - 1, Math.round(pos)));
    if (sc && i !== sc.seite) { sc.seite = i; scTabsMarkieren(); if (i === 3) scIch(scStore()); clearTimeout(sc.seiteMerken); sc.seiteMerken = setTimeout(() => { const st = scStore(); st.seite = i; scSpeichern(st); }, 400); }
  }, { passive: true });
  $('scTabs').querySelectorAll('[data-seite]').forEach((b) => b.addEventListener('click', () => scSeite(+b.dataset.seite)));
  $('scBlattZu').addEventListener('click', scBlattZurueck);
  scBlattGeste($('scBlatt'));
}
function scSeite(i, sofort) {
  const pg = $('scSeiten'); if (!pg) return;
  if (i === 3 && sc.seite !== 3) scIch(scStore());
  sc.seite = i; scTabsMarkieren();
  pg.scrollTo({ left: i * pg.clientWidth, behavior: sofort || scWenigBewegung() ? 'auto' : 'smooth' });
  if (sofort) $('scTabs').style.setProperty('--pos', i);
  const st = scStore(); if (st.seite !== i) { st.seite = i; scSpeichern(st); }
}
function scTabsMarkieren() { document.querySelectorAll('#scTabs [data-seite]').forEach((b) => { const an = +b.dataset.seite === sc.seite; b.classList.toggle('an', an); b.setAttribute('aria-selected', an); }); }
function scToast(text) { const t = $('scToast'); if (!t) return; t.textContent = text; t.classList.add('an'); clearTimeout(scToast.t); scToast.t = setTimeout(() => t.classList.remove('an'), 2200); }

// scStart: schließt ein offenes Blatt und zeichnet alle Seiten neu (Scrollposition bleibt)
function scStart() {
  if (!sc) sc = { ansicht: 'start', tag: scTag(), seite: 0, stapel: [], mahlzeit: null };
  if (!$('scSeiten')) scRahmen();
  scBlattSchliessen(true, true);
  scZeichnen();
}
function scZeichnen() { const s = scStore(); scHeute(s); scScanSeite(s); scProdukte(s); scIch(s); scTabsMarkieren(); }

// ---------- Seite 1: Heute ----------
function scHeute(s) {
  const box = $('scSeite_heute'), tag = sc.tag, z = scZiele(s), sum = scTagSumme(s, tag), istHeute = tag === scTag();
  const U = 2 * Math.PI * 52, anteil = Math.min(1, sum.kcal / z.kcal), rest = z.kcal - Math.round(sum.kcal);
  const titel = istHeute ? 'Heute' : tag === scTagPlus(scTag(), -1) ? 'Gestern' : scTagDatum(tag).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
  const makro = (k, name, ziel, cls) => { const v = sum[k], pr = ziel ? v / ziel : 0; return '<div class="sc-makro ' + cls + (pr > 1.1 && k !== 'e' ? ' drueber' : '') + (k === 'e' && pr >= 1 ? ' geschafft' : '') + '"><span>' + name + '</span><i style="--w:' + Math.min(100, Math.round(pr * 100)) + '%"></i><b>' + Math.round(v) + '<small> / ' + ziel + ' g</small></b></div>'; };
  const wasser = (s.wasser[tag] || 0);
  box.innerHTML = '<div class="sc-tagkopf"><button type="button" data-tag="-1" aria-label="Vorheriger Tag">‹</button><b id="scTagTitel">' + titel + '</b><button type="button" data-tag="1" aria-label="Nächster Tag"' + (istHeute ? ' disabled' : '') + '>›</button></div>'
    + '<div class="sc-karte sc-kal"><div class="sc-kal-oben"><div class="sc-kal-wert"><b>' + Math.round(sum.kcal) + '</b><small>gegessen</small></div>'
    + '<svg viewBox="0 0 120 120" class="sc-ring' + (sum.kcal > z.kcal ? ' drueber' : '') + (sum.kcal <= 0 ? ' leer' : '') + '" role="img" aria-label="' + Math.round(sum.kcal) + ' von ' + z.kcal + ' Kilokalorien"><circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="52" class="voll" stroke-dasharray="' + (U * anteil).toFixed(1) + ' ' + U.toFixed(1) + '"/><text x="60" y="60">' + Math.abs(rest) + '</text><text x="60" y="78" class="kl">' + (rest >= 0 ? 'kcal übrig' : 'kcal zu viel') + '</text></svg>'
    + '<div class="sc-kal-wert"><b>' + z.kcal + '</b><small>Ziel</small></div></div>'
    + '<p class="sc-rest" id="scRest">' + (rest >= 0 ? 'Noch ' + rest + ' kcal' : Math.abs(rest) + ' kcal über dem Ziel') + '</p>'
    + '<div class="sc-makros">' + makro('e', 'Eiweiß', z.e, 'ew') + makro('k', 'Kohlenhydrate', z.k, 'kh') + makro('f', 'Fett', z.f, 'ft') + '</div></div>'
    + SC_MAHLZEITEN.map(([id, n, ic]) => {
      const l = s.tagebuch.filter((e) => e.tag === tag && e.m === id), ms = scTagSumme(s, tag, id);
      return '<div class="sc-karte sc-mahlzeit" data-m="' + id + '"><div class="sc-mz-kopf"><span class="sc-mz-ic" aria-hidden="true">' + ic + '</span><span><b>' + n + '</b><small>' + (l.length ? 'E ' + scZahl(ms.e) + ' · K ' + scZahl(ms.k) + ' · F ' + scZahl(ms.f) + ' g' : 'Noch nichts') + '</small></span><em>' + Math.round(ms.kcal) + ' kcal</em><button type="button" class="sc-mz-plus" data-mahlzeit="' + id + '" aria-label="' + n + ' hinzufügen">＋</button></div>'
        + l.map((e) => '<div class="sc-eintrag"><span><b>' + scEsc(e.name) + '</b><small>' + (e.g ? scZahl(+e.g) + ' g · ' : '') + Math.round(+e.kcal) + ' kcal' + (e.e || e.k || e.f ? ' · E ' + scZahl(+e.e || 0) + ' · K ' + scZahl(+e.k || 0) + ' · F ' + scZahl(+e.f || 0) : '') + '</small></span><button type="button" data-weg="' + scEsc(e.id) + '" aria-label="' + scEsc(e.name) + ' entfernen">✕</button></div>').join('') + '</div>';
    }).join('')
    + '<div class="sc-karte sc-wasser"><div class="sc-mz-kopf"><span class="sc-mz-ic" aria-hidden="true">💧</span><span><b>Wasser</b><small id="scWasserText">' + scLiter(wasser * SC_GLAS_ML) + ' von ' + scLiter(SC_GLAESER * SC_GLAS_ML) + ' l</small></span></div><div class="sc-glaeser">'
    + [...Array(SC_GLAESER)].map((_, i) => '<button type="button" class="sc-glas' + (i < wasser ? ' voll' : '') + '" data-glas="' + i + '" aria-label="' + (i + 1) + ' Gläser" aria-pressed="' + (i < wasser) + '"><i></i></button>').join('') + '</div></div>'
    + '<p class="sc-klein sc-hinweis">Wischen ← → wechselt die Seiten. Die Ziele stellst du unter „Ich“ ein – sie sind Richtwerte, keine Ernährungsberatung.</p>';
  box.querySelectorAll('[data-tag]').forEach((b) => b.addEventListener('click', () => { const n = scTagPlus(sc.tag, +b.dataset.tag); if (n > scTag()) return; sc.tag = n; scHeute(scStore()); }));
  box.querySelectorAll('[data-mahlzeit]').forEach((b) => b.addEventListener('click', () => scHinzufuegen(b.dataset.mahlzeit)));
  box.querySelectorAll('[data-weg]').forEach((b) => b.addEventListener('click', () => { const st = scStore(), e = st.tagebuch.find((x) => x.id === b.dataset.weg); st.tagebuch = st.tagebuch.filter((x) => x.id !== b.dataset.weg); scSpeichern(st); scHubText(); scHeute(st); scIch(st); if (e) scToast('„' + e.name + '“ entfernt'); }));
  box.querySelectorAll('[data-glas]').forEach((b) => b.addEventListener('click', () => { const st = scStore(), alt = st.wasser[sc.tag] || 0, i = +b.dataset.glas; st.wasser[sc.tag] = alt === i + 1 ? i : i + 1; scSpeichern(st); scHeute(st); }));
}

// ---------- Seite 2: Scannen ----------
function scZeile(s, v) {
  const e = s.cache[v.code], b = e ? scBewerten(e.p, e.art, s.filter) : null;
  return '<button type="button" class="sc-zeile" data-code="' + v.code + '" data-name="' + scEsc((v.name || '') + ' ' + (v.marke || '')).toLowerCase() + '"><i class="sc-punkt ' + (b ? b.ampel : 'grau') + '"></i><span><b>' + scEsc(v.name || v.code) + '</b><small>' + scEsc(v.marke || '') + (v.marke ? ' · ' : '') + (v.art === 'kosmetik' ? 'Kosmetik' : 'Lebensmittel') + '</small></span>' + (s.favoriten.includes(v.code) ? '<em>★</em>' : '') + '</button>';
}
function scScanSeite(s) {
  const box = $('scSeite_scan');
  box.innerHTML = '<div class="sc-held"><div class="sc-held-bild" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
    + '<button type="button" class="sc-scan-btn" id="scScannen">📷 Barcode scannen</button>'
    + '<form class="sc-eingabe" id="scForm"><input id="scCode" inputmode="numeric" autocomplete="off" placeholder="EAN-Nummer eintippen" maxlength="14"><button type="submit">Prüfen</button></form>'
    + '<p class="sc-fehler" id="scFehler" role="alert"></p></div>'
    + '<div class="sc-karte"><h3>Zuletzt geprüft</h3>' + (s.verlauf.length ? s.verlauf.slice(0, 5).map((v) => scZeile(s, v)).join('') + (s.verlauf.length > 5 ? '<button type="button" class="sc-mehr" data-zu-seite="2">Alle Produkte →</button>' : '') : '<p class="sc-klein">Noch nichts gescannt. Halte die Kamera auf den Strichcode einer Verpackung.</p>') + '</div>'
    + '<p class="sc-klein sc-hinweis">Daten: <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a> und <a href="https://world.openbeautyfacts.org" target="_blank" rel="noopener">Open Beauty Facts</a> (frei, ODbL). Beim Prüfen wird nur der Barcode dorthin geschickt. Die Ampel ist eine eigene, vereinfachte Einschätzung – keine medizinische oder Ernährungsberatung.</p>';
  $('scScannen').addEventListener('click', () => scKamera());
  $('scForm').addEventListener('submit', (e) => { e.preventDefault(); const c = $('scCode').value.replace(/\D/g, ''); if (!/^\d{8,14}$/.test(c)) { $('scFehler').textContent = 'Bitte die 8- bis 13-stellige Nummer unter dem Strichcode eingeben.'; return; } $('scFehler').textContent = ''; scZeigen(c); });
  box.querySelectorAll('[data-code]').forEach((b) => b.addEventListener('click', () => scZeigen(b.dataset.code)));
  box.querySelectorAll('[data-zu-seite]').forEach((b) => b.addEventListener('click', () => scSeite(+b.dataset.zuSeite)));
}

// ---------- Seite 3: Produkte (Favoriten + Verlauf, durchsuchbar) ----------
function scProdukte(s) {
  const box = $('scSeite_produkte');
  const favs = s.favoriten.map((c) => s.verlauf.find((v) => v.code === c) || (s.cache[c] && { code: c, name: scName(s.cache[c].p), marke: s.cache[c].p.brands, art: s.cache[c].art })).filter(Boolean);
  box.innerHTML = (s.verlauf.length > 6 ? '<input class="sc-suche" id="scSuche" type="search" placeholder="Produkt suchen …" autocomplete="off">' : '')
    + (favs.length ? '<div class="sc-karte"><h3>★ Favoriten</h3>' + favs.map((v) => scZeile(s, v)).join('') + '</div>' : '')
    + '<div class="sc-karte"><h3>Alle geprüften Produkte</h3>' + (s.verlauf.length ? s.verlauf.map((v) => scZeile(s, v)).join('') : '<p class="sc-klein">Hier landet alles, was du scannst. Mit ☆ auf der Produktseite merkst du dir Favoriten.</p>') + '</div>';
  box.querySelectorAll('[data-code]').forEach((b) => b.addEventListener('click', () => scZeigen(b.dataset.code)));
  if ($('scSuche')) $('scSuche').addEventListener('input', () => { const q = $('scSuche').value.trim().toLowerCase(); box.querySelectorAll('.sc-zeile').forEach((z) => { z.hidden = !!q && !z.dataset.name.includes(q); }); });
}

// ---------- Seite 4: Ich (Woche, Ziele, Bedarfsrechner, Filter) ----------
function scIch(s) {
  const box = $('scSeite_ich'), z = scZiele(s), heute = scTag(), pr = s.profil;
  const tage = [...Array(7)].map((_, i) => { const t = scTagPlus(heute, i - 6); return { t, n: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][scTagDatum(t).getDay()], sum: scTagSumme(s, t) }; });
  const mit = tage.filter((t) => t.sum.n), max = Math.max(z.kcal, ...tage.map((t) => t.sum.kcal));
  const schnitt = (k) => (mit.length ? Math.round(mit.reduce((a, t) => a + t.sum[k], 0) / mit.length) : 0);
  const imZiel = mit.filter((t) => t.sum.kcal >= z.kcal * 0.9 && t.sum.kcal <= z.kcal * 1.1).length;
  const opt = (liste, wert) => liste.map(([v, n]) => '<option value="' + v + '"' + (+v === +wert || v === wert ? ' selected' : '') + '>' + n + '</option>').join('');
  box.innerHTML = '<div class="sc-karte"><h3>Diese Woche</h3><div class="sc-woche" aria-hidden="true">' + tage.map((t) => '<div class="' + (t.t === heute ? 'heute' : '') + (t.sum.kcal > z.kcal * 1.1 ? ' drueber' : '') + '"><i style="--h:' + Math.round((t.sum.kcal / max) * 100) + '%"></i><span>' + t.n + '</span></div>').join('') + '</div>'
    + '<div class="sc-statistik"><div><b>' + schnitt('kcal') + '</b><small>ø kcal</small></div><div><b>' + schnitt('e') + ' g</b><small>ø Eiweiß</small></div><div><b>' + imZiel + '/' + mit.length + '</b><small>Tage im Ziel ±10 %</small></div></div></div>'
    + '<div class="sc-karte"><h3>Meine Ziele pro Tag</h3><div class="sc-ziele">'
    + '<label><span>Kalorien</span><input id="scZiel" type="number" inputmode="numeric" min="1000" max="6000" step="50" value="' + z.kcal + '"><small>kcal</small></label>'
    + '<label><span>Eiweiß</span><input id="scZielE" type="number" inputmode="numeric" min="20" max="400" value="' + z.e + '"><small>g</small></label>'
    + '<label><span>Fett</span><input id="scZielF" type="number" inputmode="numeric" min="20" max="300" value="' + z.f + '"><small>g</small></label>'
    + '<label><span>Kohlenhydrate</span><output id="scZielK">' + z.k + '</output><small>g (Rest)</small></label></div>'
    + '<details class="sc-rechner"' + (pr ? '' : ' open') + '><summary>🧮 Aus meinen Daten berechnen</summary><form id="scProfil" class="sc-profil" novalidate>'
    + '<label>Geschlecht<select id="scPrG">' + opt([['w', 'weiblich'], ['m', 'männlich']], pr ? pr.geschlecht : 'w') + '</select></label>'
    + '<label>Alter<input id="scPrA" type="number" inputmode="numeric" min="14" max="100" value="' + (pr ? pr.alter : '') + '" placeholder="Jahre"></label>'
    + '<label>Größe<input id="scPrH" type="number" inputmode="numeric" min="120" max="230" value="' + (pr ? pr.groesse : '') + '" placeholder="cm"></label>'
    + '<label>Gewicht<input id="scPrK" type="text" inputmode="decimal" autocomplete="off" value="' + (pr ? pr.gewicht : '') + '" placeholder="kg"></label>'
    + '<label class="breit">Bewegung<select id="scPrAk">' + opt(SC_AKTIV.map((a, i) => [i, a[1]]), pr ? pr.aktiv : 1) + '</select></label>'
    + '<label class="breit">Ziel<select id="scPrZ">' + opt(Object.entries(SC_ZIELARTEN).map(([k, v]) => [k, v[0]]), pr ? pr.ziel : 'halten') + '</select></label>'
    + '<label class="breit">Eiweiß<select id="scPrE">' + opt(SC_EIWEISS, pr ? pr.ekg : 1.2) + '</select></label>'
    + '<button type="submit" class="sc-zweit sc-plus breit">Ziele berechnen</button><p class="sc-klein breit" id="scPrInfo" role="status">' + (pr ? scRechnerText(scBerechnen(pr)) : 'Berechnung nach Mifflin-St Jeor (Grundumsatz) × Bewegungsfaktor.') + '</p></form></details></div>'
    + '<div class="sc-karte"><h3>Meine Filter</h3><div class="sc-chips">' + SC_FILTER.map(([k, n]) => '<button type="button" class="sc-chip' + (s.filter[k] ? ' an' : '') + '" data-filter="' + k + '" aria-pressed="' + !!s.filter[k] + '">' + n + '</button>').join('') + '</div><p class="sc-klein">Passt ein gescanntes Produkt nicht, wird es rot markiert.</p></div>';
  const zielSpeichern = () => {
    const st = scStore(), k = Math.round(+$('scZiel').value), e = Math.round(+$('scZielE').value), f = Math.round(+$('scZielF').value);
    if (k >= 1000 && k <= 6000) st.ziel = k;
    st.makro = { e: e >= 20 && e <= 400 ? e : scZiele(st).e, f: f >= 20 && f <= 300 ? f : scZiele(st).f };
    scSpeichern(st); scHubText(); scHeute(st); scIch(st);
  };
  ['scZiel', 'scZielE', 'scZielF'].forEach((id) => $(id).addEventListener('change', zielSpeichern));
  $('scProfil').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = { geschlecht: $('scPrG').value, alter: Math.round(+$('scPrA').value), groesse: Math.round(+$('scPrH').value), gewicht: Math.round(+String($('scPrK').value).replace(',', '.') * 10) / 10, aktiv: +$('scPrAk').value, ziel: $('scPrZ').value, ekg: +$('scPrE').value };
    if (!scProfilOk(p)) { $('scPrInfo').textContent = 'Bitte Alter (14–100), Größe (120–230 cm) und Gewicht (30–300 kg) eintragen.'; return; }
    const r = scBerechnen(p), st = scStore(); st.profil = p; st.ziel = r.kcal; st.makro = { e: r.e, f: r.f }; scSpeichern(st); scHubText(); scHeute(st); scIch(st);
    scToast('✓ Ziele: ' + r.kcal + ' kcal, ' + r.e + ' g Eiweiß');
  });
  box.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { const st = scStore(); st.filter[b.dataset.filter] = !st.filter[b.dataset.filter]; scSpeichern(st); scIch(st); scScanSeite(st); scProdukte(st); }));
}
function scProfilOk(p) { return p && ['w', 'm'].includes(p.geschlecht) && p.alter >= 14 && p.alter <= 100 && p.groesse >= 120 && p.groesse <= 230 && p.gewicht >= 30 && p.gewicht <= 300 && SC_AKTIV[p.aktiv] && SC_ZIELARTEN[p.ziel] && SC_EIWEISS.some((x) => x[0] === p.ekg); }
const scRechnerText = (r) => 'Grundumsatz ' + r.bmr + ' kcal · Gesamtbedarf ' + r.tdee + ' kcal → Ziel ' + r.kcal + ' kcal, ' + r.e + ' g Eiweiß, ' + r.f + ' g Fett.';

// ---------- Blatt: Produkt, Kamera, Hinzufügen – mit Stapel wie bei iOS ----------
function scBlattZeigen(e) {
  const bl = $('scBlatt'); scKameraAus();
  $('scBlattTitel').textContent = e.titel; e.zeichne($('scBlattInhalt')); $('scBlattInhalt').scrollTop = 0;
  sc.ansicht = e.art || 'blatt';
  if (bl.hidden) { bl.hidden = false; bl.classList.remove('offen'); void bl.offsetWidth; bl.classList.add('offen'); }
}
function scBlattPush(titel, art, zeichne, ersetzen) { if (ersetzen && sc.stapel.length) sc.stapel.pop(); const e = { titel, art, zeichne }; sc.stapel.push(e); scBlattZeigen(e); }
function scBlattZurueck() { scKameraAus(); sc.stapel.pop(); if (sc.stapel.length) scBlattZeigen(sc.stapel[sc.stapel.length - 1]); else scBlattSchliessen(); }
function scBlattSchliessen(sofort, ohneNeuzeichnen) {
  scKameraAus(); const bl = $('scBlatt');
  sc.stapel = []; sc.code = null; sc.mahlzeit = null; sc.ansicht = 'start';
  const leeren = () => { bl.hidden = true; $('scBlattInhalt').innerHTML = ''; };  // Video & Co. wirklich entfernen
  if (bl && !bl.hidden) { bl.classList.remove('offen'); if (sofort || scWenigBewegung()) leeren(); else setTimeout(() => { if (!bl.classList.contains('offen')) leeren(); }, 340); }
  if (!ohneNeuzeichnen) scZeichnen();
}
// Wischen vom linken Rand: das Blatt folgt dem Finger und geht beim Loslassen zurück (wie in iOS-Apps)
function scBlattGeste(bl) {
  let x0 = null, y0 = 0, t0 = 0, dx = 0, aktiv = false;
  bl.addEventListener('touchstart', (e) => { x0 = null; if (e.touches.length !== 1 || !skGestenAn()) return; const t = e.touches[0]; if (t.clientX > 28) return; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); dx = 0; aktiv = false; }, { passive: true });
  bl.addEventListener('touchmove', (e) => {
    if (x0 == null) return; const t = e.touches[0], ddx = t.clientX - x0, ddy = t.clientY - y0;
    if (!aktiv) { if (Math.abs(ddy) > 12 && Math.abs(ddy) > ddx) { x0 = null; return; } if (ddx > 8) { aktiv = true; bl.classList.add('ziehen'); } }
    if (aktiv) { dx = Math.max(0, ddx); bl.style.transform = 'translateX(' + dx + 'px)'; if (e.cancelable) e.preventDefault(); }
  }, { passive: false });
  const ende = () => {
    if (x0 == null) return; x0 = null; if (!aktiv) return; aktiv = false;
    const v = dx / Math.max(1, Date.now() - t0); bl.classList.remove('ziehen');
    if (dx > bl.clientWidth * 0.33 || (v > 0.5 && dx > 40)) {
      bl.style.transform = 'translateX(100%)';
      setTimeout(() => { bl.classList.add('ziehen'); bl.style.transform = ''; if (sc.stapel.length > 1) scBlattZurueck(); else scBlattSchliessen(true); void bl.offsetWidth; bl.classList.remove('ziehen'); }, scWenigBewegung() ? 0 : 230);
    } else bl.style.transform = '';
  };
  bl.addEventListener('touchend', ende); bl.addEventListener('touchcancel', ende);
}

// ---------- Hinzufügen zu einer Mahlzeit ----------
function scHinzufuegen(m) {
  sc.mahlzeit = SC_MAHLZEIT_IDS.includes(m) ? m : scMahlzeitJetzt();
  const mz = SC_MAHLZEITEN.find((x) => x[0] === sc.mahlzeit);
  scBlattPush(mz[1] + ' hinzufügen', 'hinzufuegen', (box) => {
    const s = scStore(), gesehen = new Set(), zuletzt = [];
    for (let i = s.tagebuch.length - 1; i >= 0 && zuletzt.length < 40; i--) { const e = s.tagebuch[i], key = (e.code || '') + '|' + e.name.toLowerCase(); if (gesehen.has(key)) continue; gesehen.add(key); zuletzt.push(e); }
    const favs = s.favoriten.map((c) => [c, s.cache[c]]).filter(([, e]) => e && e.art === 'food' && scKcal100(e.p) != null);
    box.innerHTML = '<button type="button" class="sc-scan-btn" id="scAddScan">📷 Barcode scannen</button>'
      + (zuletzt.length > 5 ? '<input class="sc-suche" id="scAddSuche" type="search" placeholder="In „Zuletzt gegessen“ suchen …" autocomplete="off">' : '')
      + '<div class="sc-karte"><h3>Zuletzt gegessen</h3>' + (zuletzt.length ? zuletzt.map((e, i) => '<div class="sc-eintrag sc-nochmal" data-name="' + scEsc(e.name.toLowerCase()) + '"><span><b>' + scEsc(e.name) + '</b><small>' + (e.g ? scZahl(+e.g) + ' g · ' : '') + Math.round(+e.kcal) + ' kcal' + (e.e ? ' · E ' + scZahl(+e.e) : '') + '</small></span><button type="button" class="sc-plus-rund" data-nochmal="' + i + '" aria-label="' + scEsc(e.name) + ' hinzufügen">＋</button></div>').join('') : '<p class="sc-klein">Was du einträgst, kannst du hier später mit einem Tipp wieder hinzufügen.</p>') + '</div>'
      + (favs.length ? '<div class="sc-karte"><h3>★ Favoriten</h3>' + favs.map(([c, e]) => '<button type="button" class="sc-zeile" data-code="' + c + '"><i class="sc-punkt ' + scBewerten(e.p, e.art, s.filter).ampel + '"></i><span><b>' + scEsc(scName(e.p)) + '</b><small>' + Math.round(scKcal100(e.p)) + ' kcal / 100 g</small></span></button>').join('') + '</div>' : '')
      + '<form class="sc-karte sc-schnell" id="scEigen" novalidate><h3>Schnell eintragen</h3><input id="scEigenName" placeholder="Was? z. B. Apfel" maxlength="40" autocomplete="off"><div class="sc-schnell-zahlen">'
      + '<label>kcal<input id="scEigenKcal" type="number" inputmode="numeric" min="0" max="5000"></label><label>Eiweiß g<input id="scEigenE" type="text" inputmode="decimal" autocomplete="off"></label><label>Kohlenh. g<input id="scEigenK" type="text" inputmode="decimal" autocomplete="off"></label><label>Fett g<input id="scEigenF" type="text" inputmode="decimal" autocomplete="off"></label></div>'
      + '<p class="sc-fehler" id="scAddFehler" role="alert"></p><button type="submit" class="sc-zweit sc-plus">＋ Eintragen</button><p class="sc-klein">Nur kcal reicht – oder nur Eiweiß/Kohlenhydrate/Fett, dann werden die kcal daraus berechnet (4/4/9 kcal pro g).</p></form>';
    $('scAddScan').addEventListener('click', () => scKamera());
    box.querySelectorAll('[data-nochmal]').forEach((b) => b.addEventListener('click', () => { const e = zuletzt[+b.dataset.nochmal]; scEintragen({ name: e.name, code: e.code, g: e.g, kcal: e.kcal, e: e.e, k: e.k, f: e.f, m: sc.mahlzeit }); b.textContent = '✓'; b.classList.add('ok'); scToast('✓ ' + e.name + ' → ' + mz[1]); }));
    box.querySelectorAll('[data-code]').forEach((b) => b.addEventListener('click', () => scZeigen(b.dataset.code)));
    if ($('scAddSuche')) $('scAddSuche').addEventListener('input', () => { const q = $('scAddSuche').value.trim().toLowerCase(); box.querySelectorAll('.sc-nochmal').forEach((z) => { z.hidden = !!q && !z.dataset.name.includes(q); }); });
    $('scEigen').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const zahl = (id) => { const v = String($(id).value).replace(',', '.').trim(); return v === '' ? null : /^\d+(\.\d+)?$/.test(v) ? +v : NaN; };
      const name = $('scEigenName').value.trim(), e = zahl('scEigenE'), k = zahl('scEigenK'), f = zahl('scEigenF');
      let kcal = zahl('scEigenKcal');
      if (kcal == null && (e != null || k != null || f != null)) kcal = Math.round(4 * (e || 0) + 4 * (k || 0) + 9 * (f || 0));
      const ok = name && kcal != null && kcal >= 0 && kcal <= 5000 && [e, k, f].every((x) => x == null || (x >= 0 && x <= 1000));  // NaN fällt hier überall durch
      if (!ok) { $('scAddFehler').textContent = 'Bitte einen Namen und kcal (0–5000) oder Eiweiß/Kohlenhydrate/Fett angeben.'; return; }
      scEintragen({ name, kcal, e, k, f, m: sc.mahlzeit });
      scToast('✓ ' + name + ' → ' + mz[1]); scBlattSchliessen(); scSeite(0);
    });
  });
}

// ---------- Produktseite ----------
function scZeigen(code, ersetzen) {
  sc.code = code;
  scBlattPush('Produkt', 'produkt', (box) => scProduktZeichnen(box, code), ersetzen);
}
async function scProduktZeichnen(box, code) {
  sc.code = code;
  box.innerHTML = '<div class="sc-laden"><i></i><p>Suche ' + scEsc(code) + ' …</p></div>';
  const e = await scHolen(code);
  if (!sc || sc.code !== code || !box.isConnected) return;
  if (e.fehler) {
    $('scBlattTitel').textContent = e.fehler === 'netz' ? 'Offline' : 'Unbekannt';
    box.innerHTML = '<div class="sc-karte sc-leer"><div class="sc-leer-icon">' + (e.fehler === 'netz' ? '📡' : '🤷') + '</div><h3>' + (e.fehler === 'netz' ? 'Keine Verbindung' : 'Produkt nicht gefunden') + '</h3><p>' + (e.fehler === 'netz' ? 'Zum Nachschlagen braucht es Internet. Bereits geprüfte Produkte gehen auch offline.' : 'Die Nummer ' + scEsc(code) + ' ist noch nicht in den offenen Datenbanken. Du kannst das Produkt dort selbst eintragen – dann hilft es allen.') + '</p>'
      + (e.fehler === 'unbekannt' ? '<a class="sc-link" href="https://world.openfoodfacts.org/cgi/product.pl?type=add&code=' + code + '" target="_blank" rel="noopener">Bei Open Food Facts eintragen ↗</a>' : '') + '<button type="button" class="sc-scan-btn" id="scNochmal">📷 Nächstes scannen</button></div>';
    $('scNochmal').addEventListener('click', () => scKamera(true)); return;
  }
  const s = scStore(), p = e.p, b = scBewerten(p, e.art, s.filter), name = scName(p);
  $('scBlattTitel').textContent = e.art === 'kosmetik' ? 'Kosmetik' : 'Lebensmittel';
  s.verlauf = [{ code, name, marke: (p.brands || '').split(',')[0].trim(), art: e.art, zeit: Date.now() }, ...s.verlauf.filter((v) => v.code !== code)]; scSpeichern(s);
  const fav = s.favoriten.includes(code), n = p.nutriments || {};
  const naehr = e.art === 'food' ? SC_NAEHR.map(([k, nm, lo, hi]) => { const v = n[k]; if (v == null || !isFinite(+v)) return ''; const f = +v > hi ? 'rot' : +v > lo ? 'gelb' : 'gruen'; return '<div class="sc-naehr ' + f + '"><span>' + nm + '</span><b>' + scZahl(+v) + ' g</b><i style="--w:' + Math.min(100, (+v / (hi * 1.6)) * 100) + '%"></i></div>'; }).join('') : '';
  const zutaten = p.ingredients_text_de || p.ingredients_text || '', k100 = scKcal100(p), portion = +p.serving_quantity > 0 && +p.serving_quantity <= 2000 ? Math.round(+p.serving_quantity) : null;
  const mzStart = sc.mahlzeit || scMahlzeitJetzt();
  box.innerHTML = '<div class="sc-produkt">'
    + '<div class="sc-kopf">' + (p.image_front_small_url && /^https:\/\/images\.open(food|beauty)facts\.org\//.test(p.image_front_small_url) ? '<img src="' + scEsc(p.image_front_small_url) + '" alt="" loading="lazy">' : '<div class="sc-ohnebild">' + (e.art === 'kosmetik' ? '🧴' : '🛒') + '</div>')
    + '<div><h2>' + scEsc(name) + '</h2><p>' + scEsc(p.brands || '') + (p.quantity ? ' · ' + scEsc(p.quantity) : '') + '</p><small>' + code + (e.offline ? ' · offline gespeichert' : '') + '</small></div>'
    + '<button type="button" class="sc-fav' + (fav ? ' an' : '') + '" id="scFav" aria-pressed="' + fav + '" aria-label="Favorit">' + (fav ? '★' : '☆') + '</button></div>'
    + '<div class="sc-ampel ' + b.ampel + '"><div class="sc-lichter" aria-hidden="true"><i class="r"></i><i class="y"></i><i class="g"></i></div><div><b>' + b.satz + '</b><small>' + (b.ampel === 'grau' ? 'Die Datenbank kennt zu wenig zu diesem Produkt.' : 'Eigene Einschätzung aus den Gründen unten') + '</small></div></div>'
    + (e.art === 'food' ? (k100 != null ? '<div class="sc-karte sc-kal-prod"><h3>Ins Tagebuch</h3><p class="sc-kal-100"><b>' + Math.round(k100) + ' kcal</b> je 100 g · E ' + scZahl(+n.proteins_100g || 0) + ' · K ' + scZahl(+n.carbohydrates_100g || 0) + ' · F ' + scZahl(+n.fat_100g || 0) + ' g</p>'
      + '<div class="sc-seg" role="radiogroup" aria-label="Mahlzeit">' + SC_MAHLZEITEN.map(([id, nm, ic]) => '<button type="button" role="radio" data-mz="' + id + '" aria-checked="' + (id === mzStart) + '" class="' + (id === mzStart ? 'an' : '') + '"><b aria-hidden="true">' + ic + '</b>' + nm.replace('essen', '').replace('Snacks', 'Snack') + '</button>').join('') + '</div>'
      + '<div class="sc-menge"><label for="scGramm" class="sc-sr">Menge</label><input id="scGramm" type="text" inputmode="decimal" autocomplete="off" value="' + (portion || 100) + '"><span>g/ml</span>' + (portion ? '<button type="button" class="sc-mini-btn" data-g="' + portion + '">1 Portion</button>' : '') + '<button type="button" class="sc-mini-btn" data-g="100">100 g</button></div>'
      + '<p class="sc-portion" id="scMengeKcal"></p><button type="button" class="sc-zweit sc-plus" id="scInsTagebuch">➕ Ins Tagebuch</button><p class="sc-klein" id="scEingetragen" role="status"></p></div>'
      : '<div class="sc-karte"><h3>Kalorien</h3><p class="sc-klein">Für dieses Produkt sind keine Kalorien hinterlegt. Unter „Heute“ → ＋ kannst du es mit „Schnell eintragen“ erfassen.</p></div>') : '')
    + (b.konflikte.length ? '<div class="sc-karte sc-konflikt"><h3>Deine Filter</h3>' + b.konflikte.map((k) => '<p class="' + (k[0] === '?' ? 'vllt' : 'nein') + '">' + (k[0] === '?' ? '⚠️ ' + scEsc(k.slice(1)) : '⛔ ' + scEsc(k)) + '</p>').join('') + '</div>' : '')
    + '<div class="sc-karte"><h3>Warum?</h3>' + (b.gruende.length ? b.gruende.map((g) => '<p class="sc-grund"><i class="sc-punkt ' + g.farbe + '"></i>' + scEsc(g.text) + '</p>').join('') : '<p class="sc-klein">' + (e.art === 'kosmetik' ? 'Keine der geprüften kritischen Inhaltsstoffe gefunden.' : 'Keine Auffälligkeiten in den vorhandenen Daten.') + '</p>') + '</div>'
    + (naehr ? '<div class="sc-karte"><h3>Nährwerte je 100 g</h3>' + naehr + '<p class="sc-klein">Farben nach den Grenzwerten der britischen Lebensmittelbehörde (FSA).</p></div>' : '')
    + (zutaten ? '<details class="sc-karte sc-zutaten"><summary>Zutaten</summary><p>' + scEsc(zutaten) + '</p></details>' : '')
    + '<div class="sc-knoepfe"><button type="button" class="sc-scan-btn" id="scNochmal">📷 Nächstes scannen</button><a class="sc-link" href="' + e.quelle + '/product/' + code + '" target="_blank" rel="noopener">Quelle ansehen ↗</a></div></div>';
  $('scFav').addEventListener('click', () => { const st = scStore(); st.favoriten = st.favoriten.includes(code) ? st.favoriten.filter((c) => c !== code) : [code, ...st.favoriten]; scSpeichern(st); const an = st.favoriten.includes(code); $('scFav').classList.toggle('an', an); $('scFav').textContent = an ? '★' : '☆'; $('scFav').setAttribute('aria-pressed', an); });
  $('scNochmal').addEventListener('click', () => scKamera(true));
  if ($('scGramm')) {
    let mz = mzStart;
    const menge = () => { const g = +String($('scGramm').value).replace(',', '.'); return g >= 1 && g <= 5000 ? g : null; };
    const zeig = () => { const g = menge(), r = g && scPortion(p, g); $('scMengeKcal').innerHTML = r ? '<b>= ' + r.kcal + ' kcal</b> · Eiweiß ' + scZahl(r.e) + ' g · Kohlenh. ' + scZahl(r.k) + ' g · Fett ' + scZahl(r.f) + ' g' : '–'; };
    $('scGramm').addEventListener('input', zeig); zeig();
    box.querySelectorAll('[data-g]').forEach((bt) => bt.addEventListener('click', () => { $('scGramm').value = bt.dataset.g; zeig(); }));
    box.querySelectorAll('[data-mz]').forEach((bt) => bt.addEventListener('click', () => { mz = bt.dataset.mz; box.querySelectorAll('[data-mz]').forEach((x) => { x.classList.toggle('an', x === bt); x.setAttribute('aria-checked', x === bt); }); }));
    $('scInsTagebuch').addEventListener('click', () => {
      const g = menge(); if (!g) { $('scEingetragen').textContent = 'Bitte eine Menge zwischen 1 und 5000 eingeben.'; return; }
      const ausMahlzeit = !!sc.mahlzeit, sum = scEintragen({ code, name, g, m: mz, ...scPortion(p, g) }), z = scZiele(scStore()), mzName = SC_MAHLZEITEN.find((x) => x[0] === mz)[1];
      $('scEingetragen').textContent = '✓ Eingetragen (' + mzName + ') – heute ' + Math.round(sum.kcal) + ' von ' + z.kcal + ' kcal, ' + Math.round(sum.e) + ' von ' + z.e + ' g Eiweiß.';
      if (ausMahlzeit) { scToast('✓ ' + name + ' → ' + mzName); scBlattSchliessen(); scSeite(0); }
    });
  }
  scHubText();
}

// ---------- Kamera (ZXing wird erst beim ersten Scan geladen) ----------
function scZxingLaden() {
  if (window.ZXing) return Promise.resolve();
  return new Promise((ok, nein) => { const t = document.createElement('script'); t.src = 'lib/zxing.min.js'; t.onload = ok; t.onerror = () => nein(new Error('Scanner konnte nicht geladen werden')); document.head.appendChild(t); });
}
function scKamera(ersetzen) {
  scBlattPush('Barcode scannen', 'kamera', (box) => {
    box.innerHTML = '<div class="sc-kamera"><video id="scVideo" playsinline muted autoplay></video><div class="sc-rahmen" aria-hidden="true"><i></i></div><p id="scKamText">Strichcode in den Rahmen halten …</p></div>'
      + '<div class="sc-knoepfe"><button type="button" class="sc-zweit" id="scAbbruch">Abbrechen</button></div>';
    $('scAbbruch').addEventListener('click', scBlattZurueck);
    scKameraStarten();
  }, ersetzen);
}
async function scKameraStarten() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('scKamText').textContent = 'Kamera wird hier nicht unterstützt – Nummer bitte eintippen.'; return; }
  try {
    await scZxingLaden(); if (!sc || sc.ansicht !== 'kamera' || !$('scVideo')) return;
    const hints = new Map(); hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E]);
    const reader = new ZXing.BrowserMultiFormatReader(hints, 250); sc.reader = reader;
    let fertig = false;
    await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } }, $('scVideo'), (res) => {
      if (!res || fertig) return; let c = res.getText().replace(/\D/g, '');
      if (c.length === 12) c = '0' + c; // UPC-A → EAN-13
      if (!scPruefziffer(c) && !/^\d{6,8}$/.test(c)) return;
      fertig = true; if (navigator.vibrate) navigator.vibrate(40); scZeigen(c, true);
    });
  } catch (e) {
    const t = $('scKamText'); if (t) t.textContent = /NotAllowed|Permission/.test(e && e.name + e.message) ? 'Kein Kamerazugriff – in den Einstellungen erlauben oder die Nummer eintippen.' : 'Kamera nicht verfügbar – Nummer bitte eintippen.';
  }
}
function scKameraAus() { if (sc && sc.reader) { try { sc.reader.reset(); } catch (e) { /* schon aus */ } sc.reader = null; } }

function scHubText() {
  const el = $('hubScanBest'); if (!el) return;
  const s = scStore(), heute = scTagSumme(s, scTag()), z = scZiele(s);
  el.textContent = heute.n ? 'Heute ' + Math.round(heute.kcal) + ' von ' + z.kcal + ' kcal · ' + Math.round(heute.e) + ' g Eiweiß' : s.verlauf.length ? s.verlauf.length + (s.verlauf.length === 1 ? ' Produkt' : ' Produkte') + ' geprüft · zuletzt: ' + s.verlauf[0].name : 'Scannen, Kalorien & Eiweiß tracken';
}
scHubText();
$('hubScan').addEventListener('click', () => { merkeZuletzt('scan'); zoomZu($('hubScan'), scOeffnen); });
$('scZurueck').addEventListener('click', () => { if (sc && sc.stapel && sc.stapel.length) { scBlattZurueck(); return; } scKameraAus(); sc = null; zeigeHub(); scHubText(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && sc && sc.ansicht === 'kamera') scBlattZurueck(); });
