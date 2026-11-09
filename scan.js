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
    tagebuch: ok && Array.isArray(s.tagebuch) ? s.tagebuch.filter((e) => e && /^\d{4}-\d{2}-\d{2}$/.test(e.tag) && isFinite(+e.kcal) && +e.kcal >= 0 && typeof e.name === 'string') : [],
    ziel: ok && +s.ziel >= 1000 && +s.ziel <= 6000 ? Math.round(+s.ziel) : 2000,
  };
}
function scSpeichern(s) {
  const codes = Object.keys(s.cache);
  if (codes.length > 150) { const behalten = new Set([...s.favoriten, ...s.verlauf.slice(0, 100).map((v) => v.code)]); codes.forEach((c) => { if (!behalten.has(c)) delete s.cache[c]; }); }
  s.verlauf = s.verlauf.slice(0, 100); s.tagebuch = s.tagebuch.slice(-3000); saveJson(SC_KEY, s);
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
// ---------- Kalorien-Tagebuch ----------
const scTag = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
// kcal je 100 g aus den Nährwerten (kJ wird umgerechnet); null, wenn die Datenbank nichts kennt
function scKcal100(p) { const n = (p && p.nutriments) || {}; const k = n['energy-kcal_100g'] != null ? +n['energy-kcal_100g'] : n.energy_100g != null ? +n.energy_100g / 4.184 : NaN; return isFinite(k) && k >= 0 && k <= 900 ? k : null; }
function scPortion(p, g) { const n = (p && p.nutriments) || {}, f = g / 100, m = (k) => (isFinite(+n[k]) && n[k] != null ? Math.round(+n[k] * f * 10) / 10 : 0); const k = scKcal100(p); return { kcal: k == null ? 0 : Math.round(k * f), e: m('proteins_100g'), k: m('carbohydrates_100g'), f: m('fat_100g') }; }
function scTagSumme(s, tag) { const l = s.tagebuch.filter((e) => e.tag === tag); return l.reduce((a, e) => ({ kcal: a.kcal + +e.kcal, e: a.e + (+e.e || 0), k: a.k + (+e.k || 0), f: a.f + (+e.f || 0), n: a.n + 1 }), { kcal: 0, e: 0, k: 0, f: 0, n: 0 }); }
function scEintragen(e) { const s = scStore(); s.tagebuch.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), tag: scTag(), zeit: Date.now(), ...e }); scSpeichern(s); scHubText(); return scTagSumme(s, scTag()); }
function scTagebuchHtml(s) {
  const heute = scTag(), sum = scTagSumme(s, heute), anteil = Math.min(1, sum.kcal / s.ziel), U = 2 * Math.PI * 52, rest = s.ziel - Math.round(sum.kcal);
  const tage = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { t: scTag(d), n: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()] }; });
  const max = Math.max(s.ziel, ...tage.map((t) => scTagSumme(s, t.t).kcal));
  return '<div class="sc-karte sc-kal"><h3>Heute gegessen</h3><div class="sc-kal-oben"><svg viewBox="0 0 120 120" class="sc-ring' + (sum.kcal > s.ziel ? ' drueber' : '') + '" role="img" aria-label="' + Math.round(sum.kcal) + ' von ' + s.ziel + ' Kilokalorien"><circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="52" class="voll" stroke-dasharray="' + (U * anteil).toFixed(1) + ' ' + U.toFixed(1) + '"/><text x="60" y="58">' + Math.round(sum.kcal) + '</text><text x="60" y="76" class="kl">kcal</text></svg>'
    + '<div class="sc-kal-zahlen"><b id="scRest">' + (rest >= 0 ? 'Noch ' + rest + ' kcal' : Math.abs(rest) + ' kcal über dem Ziel') + '</b><span>Eiweiß ' + scZahl(sum.e) + ' g · Kohlenhydrate ' + scZahl(sum.k) + ' g · Fett ' + scZahl(sum.f) + ' g</span>'
    + '<label class="sc-ziel">Tagesziel <input id="scZiel" type="number" inputmode="numeric" min="1000" max="6000" step="50" value="' + s.ziel + '"> kcal</label></div></div>'
    + '<div class="sc-woche" aria-hidden="true">' + tage.map((t) => { const k = scTagSumme(s, t.t).kcal; return '<div class="' + (t.t === heute ? 'heute' : '') + (k > s.ziel ? ' drueber' : '') + '"><i style="--h:' + Math.round((k / max) * 100) + '%"></i><span>' + t.n + '</span></div>'; }).join('') + '</div>'
    + (sum.n ? s.tagebuch.filter((e) => e.tag === heute).map((e) => '<div class="sc-eintrag"><span><b>' + scEsc(e.name) + '</b><small>' + (e.g ? scZahl(+e.g) + ' g · ' : '') + Math.round(+e.kcal) + ' kcal</small></span><button type="button" data-weg="' + scEsc(e.id) + '" aria-label="' + scEsc(e.name) + ' entfernen">✕</button></div>').join('') : '<p class="sc-klein">Noch nichts eingetragen. Produkt scannen und „Ins Tagebuch“ tippen – oder unten selbst eintragen.</p>')
    + '<form class="sc-eigen" id="scEigen"><input id="scEigenName" placeholder="z. B. Apfel" maxlength="40" autocomplete="off"><input id="scEigenKcal" type="number" inputmode="numeric" min="1" max="5000" placeholder="kcal"><button type="submit" aria-label="Eintragen">＋</button></form>'
    + '<p class="sc-klein">Das Tagesziel ist ein Richtwert (Erwachsene oft 1800–2500 kcal) – dein Bedarf hängt von Größe, Gewicht und Bewegung ab.</p></div>';
}
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

// ---------- Oberfläche ----------
function scOeffnen() { show('scan', '🔎 Zutaten-Check'); sc = { ansicht: 'start' }; scStart(); }
function scStart() {
  scKameraAus();
  const s = scStore(), box = $('scInhalt'); sc.ansicht = 'start';
  const zeile = (v) => { const e = s.cache[v.code], b = e ? scBewerten(e.p, e.art, s.filter) : null;
    return '<button type="button" class="sc-zeile" data-code="' + v.code + '"><i class="sc-punkt ' + (b ? b.ampel : 'grau') + '"></i><span><b>' + scEsc(v.name || v.code) + '</b><small>' + scEsc(v.marke || '') + (v.marke ? ' · ' : '') + (v.art === 'kosmetik' ? 'Kosmetik' : 'Lebensmittel') + '</small></span>' + (s.favoriten.includes(v.code) ? '<em>★</em>' : '') + '</button>'; };
  const favs = s.favoriten.map((c) => s.verlauf.find((v) => v.code === c) || (s.cache[c] && { code: c, name: scName(s.cache[c].p), marke: s.cache[c].p.brands, art: s.cache[c].art })).filter(Boolean);
  box.innerHTML = '<div class="sc-held"><div class="sc-held-bild" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
    + '<button type="button" class="sc-scan-btn" id="scScannen">📷 Barcode scannen</button>'
    + '<form class="sc-eingabe" id="scForm"><input id="scCode" inputmode="numeric" autocomplete="off" placeholder="EAN-Nummer eintippen" maxlength="14"><button type="submit">Prüfen</button></form>'
    + '<p class="sc-fehler" id="scFehler" role="alert"></p></div>'
    + scTagebuchHtml(s)
    + '<div class="sc-karte"><h3>Meine Filter</h3><div class="sc-chips">' + SC_FILTER.map(([k, n]) => '<button type="button" class="sc-chip' + (s.filter[k] ? ' an' : '') + '" data-filter="' + k + '" aria-pressed="' + !!s.filter[k] + '">' + n + '</button>').join('') + '</div><p class="sc-klein">Passt ein Produkt nicht, wird es rot markiert.</p></div>'
    + (favs.length ? '<div class="sc-karte"><h3>★ Favoriten</h3>' + favs.map(zeile).join('') + '</div>' : '')
    + '<div class="sc-karte"><h3>Zuletzt geprüft</h3>' + (s.verlauf.length ? s.verlauf.slice(0, 20).map(zeile).join('') : '<p class="sc-klein">Noch nichts gescannt. Halte die Kamera auf den Strichcode einer Verpackung.</p>') + '</div>'
    + '<p class="sc-klein sc-hinweis">Daten: <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a> und <a href="https://world.openbeautyfacts.org" target="_blank" rel="noopener">Open Beauty Facts</a> (frei, ODbL). Beim Prüfen wird nur der Barcode dorthin geschickt. Die Ampel ist eine eigene, vereinfachte Einschätzung – keine medizinische oder Ernährungsberatung.</p>';
  $('scScannen').addEventListener('click', scKamera);
  $('scForm').addEventListener('submit', (e) => { e.preventDefault(); const c = $('scCode').value.replace(/\D/g, ''); if (!/^\d{8,14}$/.test(c)) { $('scFehler').textContent = 'Bitte die 8- bis 13-stellige Nummer unter dem Strichcode eingeben.'; return; } scZeigen(c); });
  box.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { const st = scStore(); st.filter[b.dataset.filter] = !st.filter[b.dataset.filter]; scSpeichern(st); scStart(); }));
  box.querySelectorAll('[data-code]').forEach((b) => b.addEventListener('click', () => scZeigen(b.dataset.code)));
  box.querySelectorAll('[data-weg]').forEach((b) => b.addEventListener('click', () => { const st = scStore(); st.tagebuch = st.tagebuch.filter((e) => e.id !== b.dataset.weg); scSpeichern(st); scHubText(); scStart(); }));
  $('scZiel').addEventListener('change', () => { const v = Math.round(+$('scZiel').value); const st = scStore(); if (v >= 1000 && v <= 6000) { st.ziel = v; scSpeichern(st); } scStart(); });
  $('scEigen').addEventListener('submit', (e) => { e.preventDefault(); const name = $('scEigenName').value.trim(), k = Math.round(+$('scEigenKcal').value); if (!name || !(k >= 1 && k <= 5000)) { $('scFehler').textContent = 'Für einen eigenen Eintrag bitte Name und Kalorien (1–5000) angeben.'; return; } scEintragen({ name, kcal: k }); scStart(); });
}
const scName = (p) => p.product_name_de || p.product_name || 'Ohne Namen';

async function scZeigen(code) {
  scKameraAus();
  const box = $('scInhalt'); sc.ansicht = 'produkt'; sc.code = code;
  box.innerHTML = '<div class="sc-laden"><i></i><p>Suche ' + scEsc(code) + ' …</p></div>';
  const e = await scHolen(code);
  if (!sc || sc.code !== code) return;
  if (e.fehler) {
    box.innerHTML = '<div class="sc-karte sc-leer"><div class="sc-leer-icon">' + (e.fehler === 'netz' ? '📡' : '🤷') + '</div><h3>' + (e.fehler === 'netz' ? 'Keine Verbindung' : 'Produkt nicht gefunden') + '</h3><p>' + (e.fehler === 'netz' ? 'Zum Nachschlagen braucht es Internet. Bereits geprüfte Produkte gehen auch offline.' : 'Die Nummer ' + scEsc(code) + ' ist noch nicht in den offenen Datenbanken. Du kannst das Produkt dort selbst eintragen – dann hilft es allen.') + '</p>'
      + (e.fehler === 'unbekannt' ? '<a class="sc-link" href="https://world.openfoodfacts.org/cgi/product.pl?type=add&code=' + code + '" target="_blank" rel="noopener">Bei Open Food Facts eintragen ↗</a>' : '') + '<button type="button" class="sc-scan-btn" id="scNochmal">📷 Nächstes scannen</button></div>';
    $('scNochmal').addEventListener('click', scKamera); return;
  }
  const s = scStore(), p = e.p, b = scBewerten(p, e.art, s.filter), name = scName(p);
  s.verlauf = [{ code, name, marke: (p.brands || '').split(',')[0].trim(), art: e.art, zeit: Date.now() }, ...s.verlauf.filter((v) => v.code !== code)]; scSpeichern(s);
  const fav = s.favoriten.includes(code), n = p.nutriments || {};
  const naehr = e.art === 'food' ? SC_NAEHR.map(([k, nm, lo, hi]) => { const v = n[k]; if (v == null || !isFinite(+v)) return ''; const f = +v > hi ? 'rot' : +v > lo ? 'gelb' : 'gruen'; return '<div class="sc-naehr ' + f + '"><span>' + nm + '</span><b>' + scZahl(+v) + ' g</b><i style="--w:' + Math.min(100, (+v / (hi * 1.6)) * 100) + '%"></i></div>'; }).join('') : '';
  const zutaten = p.ingredients_text_de || p.ingredients_text || '';
  box.innerHTML = '<div class="sc-produkt">'
    + '<div class="sc-kopf">' + (p.image_front_small_url && /^https:\/\/images\.open(food|beauty)facts\.org\//.test(p.image_front_small_url) ? '<img src="' + scEsc(p.image_front_small_url) + '" alt="" loading="lazy">' : '<div class="sc-ohnebild">' + (e.art === 'kosmetik' ? '🧴' : '🛒') + '</div>')
    + '<div><h2>' + scEsc(name) + '</h2><p>' + scEsc(p.brands || '') + (p.quantity ? ' · ' + scEsc(p.quantity) : '') + '</p><small>' + (e.art === 'kosmetik' ? 'Kosmetik' : 'Lebensmittel') + ' · ' + code + (e.offline ? ' · offline gespeichert' : '') + '</small></div>'
    + '<button type="button" class="sc-fav' + (fav ? ' an' : '') + '" id="scFav" aria-pressed="' + fav + '" aria-label="Favorit">' + (fav ? '★' : '☆') + '</button></div>'
    + '<div class="sc-ampel ' + b.ampel + '"><div class="sc-lichter" aria-hidden="true"><i class="r"></i><i class="y"></i><i class="g"></i></div><div><b>' + b.satz + '</b><small>' + (b.ampel === 'grau' ? 'Die Datenbank kennt zu wenig zu diesem Produkt.' : 'Eigene Einschätzung aus den Gründen unten') + '</small></div></div>'
    + (b.konflikte.length ? '<div class="sc-karte sc-konflikt"><h3>Deine Filter</h3>' + b.konflikte.map((k) => '<p class="' + (k[0] === '?' ? 'vllt' : 'nein') + '">' + (k[0] === '?' ? '⚠️ ' + scEsc(k.slice(1)) : '⛔ ' + scEsc(k)) + '</p>').join('') + '</div>' : '')
    + '<div class="sc-karte"><h3>Warum?</h3>' + (b.gruende.length ? b.gruende.map((g) => '<p class="sc-grund"><i class="sc-punkt ' + g.farbe + '"></i>' + scEsc(g.text) + '</p>').join('') : '<p class="sc-klein">' + (e.art === 'kosmetik' ? 'Keine der geprüften kritischen Inhaltsstoffe gefunden.' : 'Keine Auffälligkeiten in den vorhandenen Daten.') + '</p>') + '</div>'
    + (e.art === 'food' ? (scKcal100(p) != null ? '<div class="sc-karte sc-kal-prod"><h3>Kalorien</h3><p class="sc-kal-100"><b>' + Math.round(scKcal100(p)) + ' kcal</b> je 100 g</p><div class="sc-menge"><label for="scGramm">Menge</label><input id="scGramm" type="number" inputmode="decimal" min="1" max="5000" value="' + (+p.serving_quantity > 0 && +p.serving_quantity <= 2000 ? Math.round(+p.serving_quantity) : 100) + '"><span>g/ml</span><b id="scMengeKcal"></b></div><button type="button" class="sc-zweit sc-plus" id="scInsTagebuch">➕ Ins Tagebuch</button><p class="sc-klein" id="scEingetragen" role="status"></p></div>' : '<div class="sc-karte"><h3>Kalorien</h3><p class="sc-klein">Für dieses Produkt sind keine Kalorien hinterlegt. Du kannst es auf der Startseite als eigenen Eintrag mit kcal eintragen.</p></div>') : '')
    + (naehr ? '<div class="sc-karte"><h3>Nährwerte je 100 g</h3>' + naehr + '<p class="sc-klein">Farben nach den Grenzwerten der britischen Lebensmittelbehörde (FSA).</p></div>' : '')
    + (zutaten ? '<details class="sc-karte sc-zutaten"><summary>Zutaten</summary><p>' + scEsc(zutaten) + '</p></details>' : '')
    + '<div class="sc-knoepfe"><button type="button" class="sc-scan-btn" id="scNochmal">📷 Nächstes scannen</button><a class="sc-link" href="' + e.quelle + '/product/' + code + '" target="_blank" rel="noopener">Quelle ansehen ↗</a></div></div>';
  $('scFav').addEventListener('click', () => { const st = scStore(); st.favoriten = st.favoriten.includes(code) ? st.favoriten.filter((c) => c !== code) : [code, ...st.favoriten]; scSpeichern(st); const an = st.favoriten.includes(code); $('scFav').classList.toggle('an', an); $('scFav').textContent = an ? '★' : '☆'; $('scFav').setAttribute('aria-pressed', an); });
  $('scNochmal').addEventListener('click', scKamera);
  if ($('scGramm')) {
    const menge = () => { const g = +String($('scGramm').value).replace(',', '.'); return g >= 1 && g <= 5000 ? g : null; };
    const zeig = () => { const g = menge(); $('scMengeKcal').textContent = g ? '= ' + scPortion(p, g).kcal + ' kcal' : '–'; };
    $('scGramm').addEventListener('input', zeig); zeig();
    $('scInsTagebuch').addEventListener('click', () => { const g = menge(); if (!g) { $('scEingetragen').textContent = 'Bitte eine Menge zwischen 1 und 5000 eingeben.'; return; } const sum = scEintragen({ code, name, g, ...scPortion(p, g) }); const z = scStore().ziel; $('scEingetragen').textContent = '✓ Eingetragen – heute ' + Math.round(sum.kcal) + ' von ' + z + ' kcal.'; });
  }
  scHubText();
}

// ---------- Kamera (ZXing wird erst beim ersten Scan geladen) ----------
function scZxingLaden() {
  if (window.ZXing) return Promise.resolve();
  return new Promise((ok, nein) => { const t = document.createElement('script'); t.src = 'lib/zxing.min.js'; t.onload = ok; t.onerror = () => nein(new Error('Scanner konnte nicht geladen werden')); document.head.appendChild(t); });
}
async function scKamera() {
  const box = $('scInhalt'); sc.ansicht = 'kamera'; sc.code = null;
  box.innerHTML = '<div class="sc-kamera"><video id="scVideo" playsinline muted autoplay></video><div class="sc-rahmen" aria-hidden="true"><i></i></div><p id="scKamText">Strichcode in den Rahmen halten …</p></div>'
    + '<div class="sc-knoepfe"><button type="button" class="sc-zweit" id="scAbbruch">Abbrechen</button></div>';
  $('scAbbruch').addEventListener('click', scStart);
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('scKamText').textContent = 'Kamera wird hier nicht unterstützt – Nummer bitte eintippen.'; return; }
  try {
    await scZxingLaden(); if (!sc || sc.ansicht !== 'kamera') return;
    const hints = new Map(); hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E]);
    const reader = new ZXing.BrowserMultiFormatReader(hints, 250); sc.reader = reader;
    let fertig = false;
    await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } }, $('scVideo'), (res) => {
      if (!res || fertig) return; let c = res.getText().replace(/\D/g, '');
      if (c.length === 12) c = '0' + c; // UPC-A → EAN-13
      if (!scPruefziffer(c) && !/^\d{6,8}$/.test(c)) return;
      fertig = true; if (navigator.vibrate) navigator.vibrate(40); scZeigen(c);
    });
  } catch (e) {
    const t = $('scKamText'); if (t) t.textContent = /NotAllowed|Permission/.test(e && e.name + e.message) ? 'Kein Kamerazugriff – in den Einstellungen erlauben oder die Nummer eintippen.' : 'Kamera nicht verfügbar – Nummer bitte eintippen.';
  }
}
function scKameraAus() { if (sc && sc.reader) { try { sc.reader.reset(); } catch (e) { /* schon aus */ } sc.reader = null; } }

function scHubText() {
  const el = $('hubScanBest'); if (!el) return;
  const s = scStore(), heute = scTagSumme(s, scTag()); el.textContent = heute.n ? 'Heute ' + Math.round(heute.kcal) + ' von ' + s.ziel + ' kcal' : s.verlauf.length ? s.verlauf.length + (s.verlauf.length === 1 ? ' Produkt' : ' Produkte') + ' geprüft · zuletzt: ' + s.verlauf[0].name : 'Lebensmittel & Kosmetik scannen';
}
scHubText();
$('hubScan').addEventListener('click', () => { merkeZuletzt('scan'); zoomZu($('hubScan'), scOeffnen); });
$('scZurueck').addEventListener('click', () => { if (sc && sc.ansicht !== 'start') { scStart(); return; } scKameraAus(); sc = null; zeigeHub(); scHubText(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && sc && sc.ansicht === 'kamera') scStart(); });
