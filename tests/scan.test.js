// Zutaten-Check: Bewertung (Lebensmittel, Kosmetik, Filter), Abruf mit simulierter Open-Food-Facts-API (Netz wird abgefangen),
// Fallback auf Open Beauty Facts, unbekanntes Produkt, offline aus dem Speicher, Favoriten, Barcode-Erkennung (ZXing) an einem
// selbst gezeichneten EAN-13, Kameransicht mit Testkamera.
// Aufruf: python3 -m http.server 8765, dann  node tests/scan.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
const NUTELLA = { code: '3017620422003', product_name: 'Nuss-Nougat-Creme', brands: 'Testmarke', quantity: '400 g', nutriscore_grade: 'e', nova_group: 4,
  additives_tags: ['en:e322', 'en:e129'], allergens_tags: ['en:milk', 'en:nuts', 'en:soybeans'], traces_tags: [], ingredients_analysis_tags: ['en:palm-oil', 'en:non-vegan', 'en:vegetarian'],
  nutriments: { fat_100g: 30.9, 'saturated-fat_100g': 10.6, sugars_100g: 56.3, salt_100g: 0.107 }, ingredients_text_de: 'Zucker, Palmöl, Haselnüsse 13 %, Magermilchpulver 8,7 %, Kakao, Emulgator Lecithine (Soja), Vanillin' };
const HAFER = { code: '4000000000006', product_name: 'Haferflocken', brands: 'Testmühle', nutriscore_grade: 'a', nova_group: 1, additives_tags: [], allergens_tags: ['en:gluten'], traces_tags: [],
  ingredients_analysis_tags: ['en:palm-oil-free', 'en:vegan', 'en:vegetarian'], nutriments: { fat_100g: 7, 'saturated-fat_100g': 1.3, sugars_100g: 0.7, salt_100g: 0.01 } };
const DUSCH = { code: '4005900000003', product_name: 'Duschgel Test', brands: 'Testpflege', ingredients_tags: ['en:aqua', 'en:sodium-laureth-sulfate', 'en:polyethylene', 'en:limonene', 'en:methylisothiazolinone'] };
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', permissions: ['camera'] });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  let netz = true; const anfragen = [];
  const db = { 'openfoodfacts.org': { [NUTELLA.code]: NUTELLA, [HAFER.code]: HAFER }, 'openbeautyfacts.org': { [DUSCH.code]: DUSCH } };
  await ctx.route(/open(food|beauty)facts\.org\/api/, (route) => {
    const u = new URL(route.request().url()); anfragen.push(u.hostname + u.pathname);
    if (!netz) return route.abort('internetdisconnected');
    const code = u.pathname.match(/product\/(\d+)/)[1], dom = u.hostname.replace(/^world\./, ''), p = db[dom][code];
    route.fulfill({ status: p ? 200 : 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(p ? { status: 1, code, product: p } : { status: 0, status_verbose: 'product not found' }) });
  });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);

  // ---------- Bewertung als reine Funktion ----------
  const r = await p.evaluate(([n, h, d]) => {
    const a = scBewerten(n, 'food', {}), b2 = scBewerten(h, 'food', { vegan: true, gluten: true, palmoel: true }), c = scBewerten(d, 'kosmetik', {});
    const f = scBewerten(n, 'food', { vegan: true, palmoel: true, milch: true }), leer = scBewerten({}, 'food', {}), ohneNs = scBewerten({ nutriments: { sugars_100g: 30 }, nova_group: 3 }, 'food', {});
    return { a, b2, c, f, leer, ohneNs, pz: [scPruefziffer('4006381333931'), scPruefziffer('4006381333932'), scPruefziffer('96385074')] };
  }, [NUTELLA, HAFER, DUSCH]);
  ck('Lebensmittel: Nutri-Score E + NOVA 4 + E129 → rot, Gründe genannt', r.a.ampel === 'rot' && r.a.gruende.some((g) => /Nutri-Score E/.test(g.text)) && r.a.gruende.some((g) => /NOVA 4/.test(g.text)) && r.a.gruende.some((g) => /E129.*Warnhinweis/.test(g.text)) && !r.a.gruende.some((g) => /E322/.test(g.text)), r.a.gruende.map((g) => g.text.slice(0, 20)).join(' | '));
  ck('Filter: vegan/Palmöl/Milch → drei Konflikte', r.f.konflikte.length === 3 && r.f.konflikte.includes('nicht vegan') && r.f.konflikte.includes('enthält Palmöl') && r.f.satz === 'Passt nicht zu deinen Filtern', r.f.konflikte.join(', '));
  ck('Haferflocken: grün, aber Glutenfilter schlägt an → rot', r.b2.konflikte.join() === 'enthält Gluten' && r.b2.ampel === 'rot', r.b2.konflikte.join());
  ck('Kosmetik: Mikroplastik + Isothiazolinon → gelb, Duftstoff-Allergen als Info', r.c.ampel === 'gelb' && r.c.gruende.some((g) => /Polyethylene.*Kunststoff/.test(g.text)) && r.c.gruende.some((g) => g.farbe === 'info' && /Limonene/.test(g.text)), r.c.gruende.map((g) => g.farbe + ':' + g.text.slice(0, 18)).join(' | '));
  ck('Ohne Daten → grau; ohne Nutri-Score greift die Zucker-Ampel', r.leer.ampel === 'grau' && r.ohneNs.ampel === 'gelb' && r.ohneNs.gruende.some((g) => /Viel Zucker \(30 g/.test(g.text)));
  ck('Prüfziffer EAN-13/EAN-8', r.pz.join() === 'true,false,true');

  // ---------- Oberfläche ----------
  await p.evaluate(() => { localStorage.removeItem(SC_KEY); scHubText(); });
  ck('Hub-Karte vorhanden', /Lebensmittel & Kosmetik scannen/.test(await p.textContent('#hubScanBest')));
  await p.evaluate(() => scOeffnen()); await p.waitForTimeout(1200);
  ck('Startseite ohne seitliches Scrollen', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await bild('sc-start');
  await p.click('[data-filter="vegan"]'); await p.waitForTimeout(100);
  ck('Filter wird gespeichert', await p.evaluate(() => scStore().filter.vegan === true));
  await p.fill('#scCode', '123'); await p.click('#scForm button'); await p.waitForTimeout(100);
  ck('Zu kurze Nummer → Hinweis', /8- bis 13-stellige/.test(await p.textContent('#scFehler')));
  await p.fill('#scCode', NUTELLA.code); await p.click('#scForm button'); await p.waitForTimeout(600);
  const t1 = await p.textContent('#scInhalt');
  ck('Produktseite: Name, rote Ampel, Filter-Konflikt „nicht vegan“, Nährwerte, Zutaten', /Nuss-Nougat-Creme/.test(t1) && (await p.$('.sc-ampel.rot')) && /nicht vegan/.test(t1) && (await p.$$('.sc-naehr')).length === 4 && /Haselnüsse/.test(t1));
  await bild('sc-produkt');
  await p.click('#scFav'); await p.waitForTimeout(100);
  ck('Favorit gesetzt', await p.evaluate((c) => scStore().favoriten.includes(c), NUTELLA.code));
  // Kosmetik: erst Food (404), dann Beauty
  anfragen.length = 0; await p.evaluate((c) => scZeigen(c), DUSCH.code); await p.waitForTimeout(600);
  ck('Kosmetik: Open Food Facts kennt es nicht → Open Beauty Facts', anfragen.join() === 'world.openfoodfacts.org/api/v2/product/' + DUSCH.code + '.json,world.openbeautyfacts.org/api/v2/product/' + DUSCH.code + '.json' && /Kosmetik/.test(await p.textContent('.sc-kopf')) && (await p.$('.sc-ampel.gelb')), anfragen.join(' → '));
  await bild('sc-kosmetik');
  // unbekannt
  await p.evaluate(() => scZeigen('4000000000013')); await p.waitForTimeout(600);
  ck('Unbekanntes Produkt: Hinweis + Link zum Eintragen', /nicht gefunden/.test(await p.textContent('#scInhalt')) && !!(await p.$('a[href*="type=add"]')));
  // offline
  netz = false; await p.evaluate((c) => scZeigen(c), NUTELLA.code); await p.waitForTimeout(600);
  ck('Offline: bereits geprüftes Produkt kommt aus dem Speicher', /offline gespeichert/.test(await p.textContent('.sc-kopf')));
  await p.evaluate(() => scZeigen('4000000000020')); await p.waitForTimeout(600);
  ck('Offline + neu: „Keine Verbindung“', /Keine Verbindung/.test(await p.textContent('#scInhalt')));
  netz = true;
  await p.evaluate(() => scStart()); await p.waitForTimeout(200);
  ck('Startseite: Favoriten + Verlauf mit Ampelpunkten', /★ Favoriten/.test(await p.textContent('#scInhalt')) && (await p.$$('.sc-zeile')).length === 3 && (await p.$$('.sc-zeile .sc-punkt.rot')).length === 2);
  await bild('sc-verlauf');

  // ---------- Barcode-Erkennung mit ZXing an einem gezeichneten EAN-13 ----------
  const erkannt = await p.evaluate(async () => {
    await scZxingLaden();
    const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
    const G = L.map((s) => s.split('').map((x) => (x === '1' ? '0' : '1')).reverse().join('')), R = L.map((s) => s.split('').map((x) => (x === '1' ? '0' : '1')).join(''));
    const PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
    const code = '4006381333931', d = code.split('').map(Number);
    let bits = '101'; for (let i = 1; i <= 6; i++) bits += (PAR[d[0]][i - 1] === 'L' ? L : G)[d[i]]; bits += '01010'; for (let i = 7; i <= 12; i++) bits += R[d[i]]; bits += '101';
    const m = 3, cv = document.createElement('canvas'); cv.width = (bits.length + 22) * m; cv.height = 120; const c = cv.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#000'; [...bits].forEach((x, i) => { if (x === '1') c.fillRect((i + 11) * m, 10, m, 100); });
    const reader = new ZXing.BrowserMultiFormatReader(); const res = await reader.decodeFromImageUrl(cv.toDataURL());
    return res.getText();
  });
  ck('ZXing liest einen EAN-13 (lokal, ohne Netz)', erkannt === '4006381333931', erkannt);
  // Kameransicht mit Testkamera
  await p.click('#scScannen'); await p.waitForTimeout(1500);
  const kam = await p.evaluate(() => ({ video: !!document.querySelector('#scVideo') && document.querySelector('#scVideo').srcObject != null, text: document.querySelector('#scKamText') && document.querySelector('#scKamText').textContent }));
  ck('Kamera-Ansicht: Videostrom läuft, Rahmen sichtbar', kam.video && !!(await p.$('.sc-rahmen')), JSON.stringify(kam));
  await bild('sc-kamera');
  await p.click('#scAbbruch'); await p.waitForTimeout(200);
  ck('Abbrechen: Kamera aus, zurück zum Start', !(await p.$('#scVideo')) && !!(await p.$('#scScannen')) && await p.evaluate(() => !sc.reader));
  await p.click('#scZurueck'); await p.waitForTimeout(400);
  ck('Zurück zum Hub, Hub-Text aktualisiert', /2 Produkte geprüft · zuletzt: Nuss-Nougat-Creme/.test(await p.textContent('#hubScanBest')), await p.textContent('#hubScanBest'));
  // kaputter Speicher
  await p.evaluate(() => { localStorage.setItem(SC_KEY, '{"version":1,"verlauf":[{"code":"x"},null],"favoriten":"kaputt"}'); });
  ck('Kaputter Speicher wird bereinigt', await p.evaluate(() => { const s = scStore(); return s.verlauf.length === 0 && Array.isArray(s.favoriten); }));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
