// Zutaten-Check: Bewertung (Lebensmittel, Kosmetik, Filter), Abruf mit simulierter Open-Food-Facts-API (Netz wird abgefangen),
// Fallback auf Open Beauty Facts, unbekanntes Produkt, offline aus dem Speicher, Favoriten, Barcode-Erkennung (ZXing) an einem
// selbst gezeichneten EAN-13, Kameransicht mit Testkamera, Seiten wischen + Rand-Geste „zurück“ (echte Touch-Events),
// Mahlzeiten, Makros, Wasser, Tage, Ziele/Bedarfsrechner, Migration alter Speicherstände.
// Aufruf: python3 -m http.server 8765, dann  node tests/scan.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
const NUTELLA = { code: '3017620422003', product_name: 'Nuss-Nougat-Creme', brands: 'Testmarke', quantity: '400 g', nutriscore_grade: 'e', nova_group: 4,
  additives_tags: ['en:e322', 'en:e129'], allergens_tags: ['en:milk', 'en:nuts', 'en:soybeans'], traces_tags: [], ingredients_analysis_tags: ['en:palm-oil', 'en:non-vegan', 'en:vegetarian'],
  serving_quantity: 15, nutriments: { 'energy-kcal_100g': 539, proteins_100g: 6.3, carbohydrates_100g: 57.5, fat_100g: 30.9, 'saturated-fat_100g': 10.6, sugars_100g: 56.3, salt_100g: 0.107 }, ingredients_text_de: 'Zucker, Palmöl, Haselnüsse 13 %, Magermilchpulver 8,7 %, Kakao, Emulgator Lecithine (Soja), Vanillin' };
const HAFER = { code: '4000000000006', product_name: 'Haferflocken', brands: 'Testmühle', nutriscore_grade: 'a', nova_group: 1, additives_tags: [], allergens_tags: ['en:gluten'], traces_tags: [],
  ingredients_analysis_tags: ['en:palm-oil-free', 'en:vegan', 'en:vegetarian'], nutriments: { energy_100g: 1548, proteins_100g: 13, carbohydrates_100g: 59, fat_100g: 7, 'saturated-fat_100g': 1.3, sugars_100g: 0.7, salt_100g: 0.01 } };
const DUSCH = { code: '4005900000003', product_name: 'Duschgel Test', brands: 'Testpflege', ingredients_tags: ['en:aqua', 'en:sodium-laureth-sulfate', 'en:polyethylene', 'en:limonene', 'en:methylisothiazolinone'] };
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', permissions: ['camera'] });
  await ctx.addInitScript(() => { window.SK_GESTEN_IMMER = true; if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
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

  // ---------- Echte Touch-Gesten (Chrome DevTools-Protokoll) ----------
  const cdp = await ctx.newCDPSession(p);
  const wisch = async (x1, y1, x2, y2, schritte = 12, ms = 16) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] });
    for (let i = 1; i <= schritte; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + ((x2 - x1) * i) / schritte, y: y1 + ((y2 - y1) * i) / schritte }] }); await p.waitForTimeout(ms); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const aktiverScreen = () => p.evaluate(() => document.querySelector('.screen.active').id);
  const blattOffen = () => p.evaluate(() => !$('scBlatt').hidden && $('scBlatt').classList.contains('offen'));

  // ---------- Oberfläche: vier Seiten zum Wischen ----------
  await p.evaluate(() => { localStorage.removeItem(SC_KEY); scHubText(); });
  ck('Hub-Karte vorhanden', /Scannen, Kalorien & Eiweiß tracken/.test(await p.textContent('#hubScanBest')));
  await p.evaluate(() => scOeffnen()); await p.waitForTimeout(1200);
  const rahmen = await p.evaluate(() => ({ seiten: document.querySelectorAll('.sc-seite').length, tabs: [...document.querySelectorAll('.sc-tab')].map((t) => t.textContent.slice(-8).trim()).join(','), an: document.querySelector('.sc-tab.an').dataset.seite, breit: document.documentElement.scrollWidth <= innerWidth + 1, seiteBreit: Math.round($('scSeiten').getBoundingClientRect().width) === innerWidth }));
  ck('Vier Seiten (Heute, Scannen, Produkte, Ich) mit Tab-Leiste, startet auf „Heute“, nichts ragt seitlich heraus', rahmen.seiten === 4 && rahmen.an === '0' && rahmen.breit && rahmen.seiteBreit && /Heute.*Scannen.*Produkte.*Ich/.test(rahmen.tabs), JSON.stringify(rahmen));
  ck('Heute: Ring „2000 kcal übrig“, drei Makro-Balken, vier Mahlzeiten, Wasser', /2000\s*kcal übrig/.test(await p.textContent('.sc-ring')) && (await p.locator('#scSeite_heute .sc-makro').count()) === 3 && (await p.locator('#scSeite_heute .sc-mahlzeit').count()) === 4 && (await p.locator('.sc-glas').count()) === 8);
  await bild('sc-heute-leer');
  await wisch(330, 520, 50, 515, 10, 12); await p.waitForTimeout(900);
  const nachWisch = await p.evaluate(() => ({ seite: sc.seite, tab: document.querySelector('.sc-tab.an').dataset.seite, pos: +getComputedStyle($('scTabs')).getPropertyValue('--pos'), links: $('scSeiten').scrollLeft, w: $('scSeiten').clientWidth }));
  ck('Wischen nach links → Seite „Scannen“, Tab und Leuchtfläche folgen', nachWisch.seite === 1 && nachWisch.tab === '1' && Math.abs(nachWisch.pos - 1) < 0.05 && Math.abs(nachWisch.links - nachWisch.w) < 2, JSON.stringify(nachWisch));
  await bild('sc-scan-seite');
  await wisch(60, 520, 340, 525, 10, 12); await p.waitForTimeout(900);
  ck('Wischen nach rechts → zurück auf „Heute“ (Rand-Geste greift nicht, weil nicht am Rand gestartet)', await p.evaluate(() => sc.seite === 0 && document.querySelector('.screen.active').id === 'screen-scan'));
  await p.click('.sc-tab[data-seite="3"]'); await p.waitForTimeout(800);
  ck('Tab „Ich“ antippen → Seite 4, wird gemerkt', await p.evaluate(() => sc.seite === 3 && Math.abs($('scSeiten').scrollLeft - 3 * $('scSeiten').clientWidth) < 2) && await p.evaluate(() => scStore().seite === 3));
  await p.click('[data-filter="vegan"]'); await p.waitForTimeout(100);
  ck('Filter wird gespeichert', await p.evaluate(() => scStore().filter.vegan === true));
  await p.click('.sc-tab[data-seite="1"]'); await p.waitForTimeout(800);
  await p.fill('#scCode', '123'); await p.click('#scForm button'); await p.waitForTimeout(100);
  ck('Zu kurze Nummer → Hinweis', /8- bis 13-stellige/.test(await p.textContent('#scFehler')));
  await p.fill('#scCode', NUTELLA.code); await p.click('#scForm button'); await p.waitForTimeout(800);
  const t1 = await p.textContent('#scBlattInhalt');
  ck('Produkt schiebt sich als Blatt herein: Name, rote Ampel, „nicht vegan“, Nährwerte, Zutaten', await blattOffen() && /Nuss-Nougat-Creme/.test(t1) && (await p.locator('.sc-ampel.rot').count()) === 1 && /nicht vegan/.test(t1) && (await p.locator('.sc-naehr').count()) === 4 && /Haselnüsse/.test(t1));
  await bild('sc-produkt');
  await p.click('#scFav'); await p.waitForTimeout(100);
  ck('Favorit gesetzt', await p.evaluate((c) => scStore().favoriten.includes(c), NUTELLA.code));
  await wisch(4, 400, 40, 402, 6, 40); await p.waitForTimeout(500);
  ck('Kurzes Ziehen vom Rand (36 px, langsam) → Blatt springt zurück, bleibt offen', await blattOffen());
  await wisch(4, 400, 300, 405, 14, 14); await p.waitForTimeout(600);
  ck('Wischen vom linken Rand → Blatt folgt dem Finger und schließt, Seite „Scannen“ bleibt', await p.evaluate(() => $('scBlatt').hidden && sc.stapel.length === 0 && sc.seite === 1 && document.querySelector('.screen.active').id === 'screen-scan'));
  // Kosmetik: erst Food (404), dann Beauty
  anfragen.length = 0; await p.evaluate((c) => scZeigen(c), DUSCH.code); await p.waitForTimeout(700);
  ck('Kosmetik: Open Food Facts kennt es nicht → Open Beauty Facts', anfragen.join() === 'world.openfoodfacts.org/api/v2/product/' + DUSCH.code + '.json,world.openbeautyfacts.org/api/v2/product/' + DUSCH.code + '.json' && /Kosmetik/.test(await p.textContent('#scBlattTitel')) && (await p.locator('.sc-ampel.gelb').count()) === 1, anfragen.join(' → '));
  ck('Kosmetik: keine Kalorien-Karte', (await p.locator('#scGramm').count()) === 0 && !/Ins Tagebuch/.test(await p.textContent('#scBlattInhalt')));
  await bild('sc-kosmetik');
  await p.evaluate(() => scZeigen('4000000000013')); await p.waitForTimeout(700);
  ck('Unbekanntes Produkt: Hinweis + Link zum Eintragen', /nicht gefunden/.test(await p.textContent('#scBlattInhalt')) && (await p.locator('a[href*="type=add"]').count()) === 1);
  await p.click('#scBlattZu'); await p.waitForTimeout(500);
  ck('Zurück-Knopf im Blatt: eine Ebene zurück (Stapel wie iOS) → wieder Kosmetik', await blattOffen() && /Duschgel/.test(await p.textContent('#scBlattInhalt')) && await p.evaluate(() => sc.stapel.length === 1));
  netz = false; await p.evaluate((c) => scZeigen(c), NUTELLA.code); await p.waitForTimeout(700);
  ck('Offline: bereits geprüftes Produkt kommt aus dem Speicher', /offline gespeichert/.test(await p.textContent('.sc-kopf')));
  await p.evaluate(() => scZeigen('4000000000020')); await p.waitForTimeout(700);
  ck('Offline + neu: „Keine Verbindung“', /Keine Verbindung/.test(await p.textContent('#scBlattInhalt')));
  netz = true;
  await p.evaluate(() => { scStart(); scSeite(2, true); }); await p.waitForTimeout(300);
  ck('Seite „Produkte“: Favoriten + alle geprüften mit Ampelpunkten', /★ Favoriten/.test(await p.textContent('#scSeite_produkte')) && (await p.locator('#scSeite_produkte .sc-zeile').count()) === 3 && (await p.locator('#scSeite_produkte .sc-zeile .sc-punkt.rot').count()) === 2);
  await bild('sc-produkte');

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
  await p.evaluate(() => scSeite(1, true)); await p.waitForTimeout(200);
  await p.click('#scScannen'); await p.waitForTimeout(1500);
  const kam = await p.evaluate(() => ({ video: !!document.querySelector('#scVideo') && document.querySelector('#scVideo').srcObject != null }));
  ck('Kamera-Blatt: Videostrom läuft, Rahmen sichtbar', kam.video && (await p.locator('.sc-rahmen').count()) === 1, JSON.stringify(kam));
  await bild('sc-kamera');
  await p.click('#scAbbruch'); await p.waitForTimeout(500);
  ck('Abbrechen: Kamera aus, Blatt zu', (await p.locator('#scVideo').count()) === 0 && await p.evaluate(() => !sc.reader && $('scBlatt').hidden));

  // ---------- Rand-Geste „zurück“ in der ganzen Spielekiste ----------
  await p.evaluate(() => scSeite(0, true)); await p.waitForTimeout(200);
  await wisch(4, 450, 50, 452, 5, 60); await p.waitForTimeout(400);
  ck('Zu kurz vom Rand gewischt → bleibt im Zutaten-Check', (await aktiverScreen()) === 'screen-scan');
  await wisch(4, 450, 200, 455, 10, 14); await p.waitForTimeout(700);
  ck('Vom linken Rand wischen (Seite „Heute“) → zurück zum Hub, Hub-Text aktualisiert', (await aktiverScreen()) === 'screen-hub' && /2 Produkte geprüft · zuletzt: Nuss-Nougat-Creme/.test(await p.textContent('#hubScanBest')), await p.textContent('#hubScanBest'));
  await p.evaluate(() => fiOeffnen()); await p.waitForTimeout(600);
  await wisch(4, 450, 220, 450, 10, 14); await p.waitForTimeout(700);
  ck('Auch in anderen Apps (Fitness): Rand-Geste → Hub', (await aktiverScreen()) === 'screen-hub');
  ck('Im Safari-Tab (nicht vom Home-Bildschirm) bleibt die Geste aus – Safari hat dort eine eigene', await p.evaluate(() => { window.SK_GESTEN_IMMER = false; const r = skGestenAn(); window.SK_GESTEN_IMMER = true; return r === false; }));

  // ---------- Kalorien & Makros ----------
  const kr = await p.evaluate(([n, h]) => ({ a: scKcal100(n), b: Math.round(scKcal100(h)), c: scKcal100({}), port: scPortion(n, 30), unsinn: scKcal100({ nutriments: { 'energy-kcal_100g': 5000 } }) }), [NUTELLA, HAFER]);
  ck('Kalorien je 100 g: kcal direkt, kJ umgerechnet (1548 kJ → 370), fehlend/unsinnig → keine', kr.a === 539 && kr.b === 370 && kr.c === null && kr.unsinn === null && kr.port.kcal === 162 && kr.port.f === 9.3 && kr.port.e === 1.9, JSON.stringify(kr));
  const rech = await p.evaluate(() => [scBerechnen({ geschlecht: 'w', alter: 30, groesse: 165, gewicht: 65, aktiv: 1, ziel: 'halten', ekg: 1.2 }), scBerechnen({ geschlecht: 'm', alter: 25, groesse: 180, gewicht: 80, aktiv: 2, ziel: 'abnehmen', ekg: 1.6 }), scBerechnen({ geschlecht: 'w', alter: 70, groesse: 150, gewicht: 45, aktiv: 0, ziel: 'abnehmen', ekg: 0.8 })]);
  ck('Bedarfsrechner (Mifflin-St Jeor): Frau 30/165/65 leicht aktiv → 1880 kcal, 78 g Eiweiß; Mann 25/180/80 aktiv, abnehmen → 2300 kcal, 128 g; Untergrenze 1200', rech[0].bmr === 1370 && rech[0].kcal === 1880 && rech[0].e === 78 && rech[0].f === 63 && rech[1].bmr === 1805 && rech[1].kcal === 2300 && rech[1].e === 128 && rech[2].kcal === 1200, JSON.stringify(rech.map((r) => [r.bmr, r.kcal, r.e, r.f])));
  const alt = await p.evaluate(() => { const t = new Date(); t.setHours(8, 0, 0, 0); localStorage.setItem(SC_KEY, JSON.stringify({ version: 1, verlauf: [{ code: '3017620422003', name: 'Alt' }], cache: {}, favoriten: ['3017620422003'], filter: { vegan: true }, tagebuch: [{ id: 'a', tag: scTag(), zeit: +t, name: 'Müsli', kcal: 300, e: 10, k: 50, f: 6 }], ziel: 1800 })); const s = scStore(); return { v: s.verlauf.length, f: s.favoriten.length, veg: s.filter.vegan, tb: s.tagebuch.length, m: s.tagebuch[0].m, ziel: s.ziel, z: scZiele(s) }; });
  ck('Alter Speicherstand (v133) bleibt erhalten: Eintrag um 8 Uhr → Frühstück, Ziel 1800 → 90 g E / 225 g K / 60 g F', alt.v === 1 && alt.f === 1 && alt.veg === true && alt.tb === 1 && alt.m === 'fruehstueck' && alt.ziel === 1800 && alt.z.e === 90 && alt.z.k === 225 && alt.z.f === 60, JSON.stringify(alt));
  await p.evaluate(() => { localStorage.removeItem(SC_KEY); scOeffnen(); }); await p.waitForTimeout(800);
  await p.click('[data-mahlzeit="fruehstueck"]'); await p.waitForTimeout(500);
  ck('＋ bei Frühstück → Blatt „Frühstück hinzufügen“', await blattOffen() && /Frühstück hinzufügen/.test(await p.textContent('#scBlattTitel')));
  await bild('sc-hinzufuegen-leer');
  await p.fill('#scEigenName', 'Apfel'); await p.fill('#scEigenKcal', '95'); await p.click('#scEigen button[type="submit"]'); await p.waitForTimeout(600);
  ck('Schnell eintragen „Apfel 95 kcal“ → Blatt zu, Apfel steht beim Frühstück', await p.evaluate(() => $('scBlatt').hidden) && /Apfel/.test(await p.textContent('.sc-mahlzeit[data-m="fruehstueck"]')) && /95 kcal/.test(await p.textContent('.sc-mahlzeit[data-m="fruehstueck"] em')));
  await p.click('[data-mahlzeit="mittag"]'); await p.waitForTimeout(500);
  await p.fill('#scEigenName', ''); await p.fill('#scEigenKcal', '50'); await p.click('#scEigen button[type="submit"]'); await p.waitForTimeout(150);
  ck('Ohne Namen wird abgelehnt', /Namen und kcal/.test(await p.textContent('#scAddFehler')) && await p.evaluate(() => scStore().tagebuch.length === 1));
  await p.fill('#scEigenName', 'Hähnchenbrust'); await p.fill('#scEigenKcal', ''); await p.fill('#scEigenE', '31'); await p.fill('#scEigenF', '3,6'); await p.click('#scEigen button[type="submit"]'); await p.waitForTimeout(600);
  const h = await p.evaluate(() => scStore().tagebuch.find((e) => e.name === 'Hähnchenbrust'));
  ck('Nur Makros eingegeben → kcal berechnet (31 g E + 3,6 g F = 156 kcal), Mahlzeit Mittag', h && h.kcal === 156 && h.e === 31 && h.f === 3.6 && h.m === 'mittag', JSON.stringify(h));
  await p.click('[data-mahlzeit="abend"]'); await p.waitForTimeout(500);
  await p.evaluate((c) => scZeigen(c), NUTELLA.code); await p.waitForTimeout(800);
  ck('Produkt aus „Abendessen“: Mahlzeit vorgewählt, Portion 15 g = 81 kcal mit Makros', /539 kcal/.test(await p.textContent('.sc-kal-100')) && await p.evaluate(() => document.querySelector('[data-mz="abend"]').getAttribute('aria-checked') === 'true') && (await p.inputValue('#scGramm')) === '15' && /= 81 kcal/.test(await p.textContent('#scMengeKcal')) && /Eiweiß 0,9 g/.test(await p.textContent('#scMengeKcal')));
  await p.click('.sc-mini-btn[data-g="100"]'); ck('Knopf „100 g“ → 539 kcal', /= 539 kcal/.test(await p.textContent('#scMengeKcal')));
  await p.fill('#scGramm', '30'); ck('Menge 30 g → 162 kcal, Eiweiß 1,9 g, Fett 9,3 g', /= 162 kcal/.test(await p.textContent('#scMengeKcal')) && /Eiweiß 1,9 g/.test(await p.textContent('#scMengeKcal')) && /Fett 9,3 g/.test(await p.textContent('#scMengeKcal')));
  await bild('sc-kalorien-produkt');
  await p.click('#scInsTagebuch'); await p.waitForTimeout(700);
  ck('Ins Tagebuch → zurück zu „Heute“, Eintrag beim Abendessen, Toast', await p.evaluate(() => $('scBlatt').hidden && sc.seite === 0) && /Nuss-Nougat-Creme/.test(await p.textContent('.sc-mahlzeit[data-m="abend"]')) && /Abendessen/.test(await p.textContent('#scToast')));
  ck('Summe 413 kcal, „Noch 1587 kcal“, Eiweiß 33 / 100 g', /Noch 1587 kcal/.test(await p.textContent('#scRest')) && /33\s*\/ 100 g/.test(await p.textContent('.sc-makro.ew')));
  await p.click('[data-mahlzeit="snack"]'); await p.waitForTimeout(500);
  ck('„Zuletzt gegessen“ zeigt die drei Einträge (neueste zuerst)', (await p.locator('.sc-nochmal').count()) === 3 && /Nuss-Nougat/.test(await p.textContent('.sc-nochmal >> nth=0')));
  await p.click('.sc-nochmal:has-text("Apfel") button'); await p.waitForTimeout(200);
  ck('Ein Tipp auf ＋ → Apfel nochmal als Snack, Knopf zeigt ✓', await p.evaluate(() => scStore().tagebuch.filter((e) => e.name === 'Apfel' && e.m === 'snack').length === 1) && (await p.textContent('.sc-nochmal:has-text("Apfel") button')) === '✓');
  await p.click('#scBlattZu'); await p.waitForTimeout(500);
  await p.evaluate((c) => { scSeite(1, true); scZeigen(c); }, NUTELLA.code); await p.waitForTimeout(800);
  await p.fill('#scGramm', '30'); await p.click('#scInsTagebuch'); await p.waitForTimeout(200);
  ck('Produkt direkt gescannt → bleibt offen mit Bestätigung „heute 670 von 2000 kcal, 35 von 100 g Eiweiß“', /heute 670 von 2000 kcal, 35 von 100 g Eiweiß/.test(await p.textContent('#scEingetragen')) && await blattOffen());
  await p.fill('#scGramm', '0'); await p.click('#scInsTagebuch'); await p.waitForTimeout(100);
  ck('Menge 0 wird abgelehnt', /zwischen 1 und 5000/.test(await p.textContent('#scEingetragen')) && await p.evaluate(() => scStore().tagebuch.length === 5));
  await p.evaluate(() => { scStart(); scSeite(0, true); }); await p.waitForTimeout(300);
  await p.click('.sc-glas[data-glas="2"]'); await p.waitForTimeout(100);
  const w1 = await p.textContent('#scWasserText');
  await p.click('.sc-glas[data-glas="2"]'); await p.waitForTimeout(100);
  ck('Wasser: 3. Glas antippen → 0,75 l, nochmal → 0,5 l', /^0,75 von 2 l$/.test(w1) && /^0,5 von 2 l$/.test(await p.textContent('#scWasserText')) && await p.evaluate(() => scStore().wasser[scTag()] === 2), w1);
  await bild('sc-heute');
  await p.click('.sc-mahlzeit[data-m="snack"] button[aria-label="Apfel entfernen"]'); await p.waitForTimeout(200);
  ck('Eintrag löschen → 575 kcal', await p.evaluate(() => scTagSumme(scStore(), scTag()).kcal === 575) && /Noch 1425 kcal/.test(await p.textContent('#scRest')));
  await p.click('.sc-tagkopf [data-tag="-1"]'); await p.waitForTimeout(150);
  ck('‹ → „Gestern“ mit leerem Tagebuch', /Gestern/.test(await p.textContent('#scTagTitel')) && /Noch 2000 kcal/.test(await p.textContent('#scRest')));
  await p.evaluate(() => { scEintragen({ name: 'Pizza', kcal: 1500, m: 'abend' }); scHeute(scStore()); }); await p.waitForTimeout(100);
  ck('Nachtragen für gestern landet bei gestern, heute bleibt 575', await p.evaluate(() => { const s = scStore(); return scTagSumme(s, scTagPlus(scTag(), -1)).kcal === 1500 && scTagSumme(s, scTag()).kcal === 575; }));
  await p.click('.sc-tagkopf [data-tag="1"]'); await p.waitForTimeout(150);
  ck('› → wieder „Heute“, weiter in die Zukunft geht nicht', /Heute/.test(await p.textContent('#scTagTitel')) && await p.evaluate(() => document.querySelector('.sc-tagkopf [data-tag="1"]').disabled));

  // ---------- Ich: Ziele, Rechner, Woche ----------
  await p.click('.sc-tab[data-seite="3"]'); await p.waitForTimeout(800);
  ck('Woche: 7 Balken, ø kcal über Tage mit Einträgen', (await p.locator('.sc-woche div').count()) === 7 && /1038/.test(await p.textContent('.sc-statistik')), await p.textContent('.sc-statistik'));
  await p.fill('#scZiel', '1800'); await p.dispatchEvent('#scZiel', 'change'); await p.waitForTimeout(150);
  await p.fill('#scZielE', '120'); await p.dispatchEvent('#scZielE', 'change'); await p.waitForTimeout(150);
  ck('Ziele: 1800 kcal, 120 g Eiweiß, 67 g Fett → Kohlenhydrate rechnen sich (179 g)', await p.evaluate(() => { const s = scStore(); return s.ziel === 1800 && s.makro.e === 120 && s.makro.f === 67; }) && (await p.textContent('#scZielK')) === '179');
  await p.fill('#scZiel', '99999'); await p.dispatchEvent('#scZiel', 'change'); await p.waitForTimeout(150);
  ck('Unsinniges Ziel wird nicht übernommen', await p.evaluate(() => scStore().ziel === 1800));
  await p.fill('#scPrA', '5'); await p.click('#scProfil button[type="submit"]'); await p.waitForTimeout(100);
  ck('Rechner: unsinniges Alter → Hinweis', /Alter \(14–100\)/.test(await p.textContent('#scPrInfo')));
  await p.selectOption('#scPrG', 'w'); await p.fill('#scPrA', '30'); await p.fill('#scPrH', '165'); await p.fill('#scPrK', '65'); await p.selectOption('#scPrAk', '1'); await p.selectOption('#scPrZ', 'halten'); await p.selectOption('#scPrE', '1.2');
  await p.click('#scProfil button[type="submit"]'); await p.waitForTimeout(200);
  ck('Rechner: Ziele 1880 kcal / 78 g Eiweiß / 63 g Fett gespeichert, Erklärung sichtbar', await p.evaluate(() => { const s = scStore(); return s.ziel === 1880 && s.makro.e === 78 && s.makro.f === 63 && s.profil.gewicht === 65; }) && /Grundumsatz 1370 kcal/.test(await p.textContent('#scPrInfo')));
  await bild('sc-ich');
  await p.evaluate(() => scOeffnen()); await p.waitForTimeout(600);
  ck('Wieder öffnen → zuletzt benutzte Seite („Ich“)', await p.evaluate(() => sc.seite === 3 && document.querySelector('.sc-tab.an').dataset.seite === '3' && Math.abs($('scSeiten').scrollLeft - 3 * $('scSeiten').clientWidth) < 2));
  await p.click('#scZurueck'); await p.waitForTimeout(400);
  ck('Hub-Text: „Heute 575 von 1880 kcal · 35 g Eiweiß“', /Heute 575 von 1880 kcal · 35 g Eiweiß/.test(await p.textContent('#hubScanBest')), await p.textContent('#hubScanBest'));
  // kaputter Speicher
  await p.evaluate(() => { localStorage.setItem(SC_KEY, '{"version":1,"verlauf":[{"code":"x"},null],"favoriten":"kaputt","makro":{"e":"viel"},"wasser":{"x":3,"2026-01-01":99},"seite":9,"profil":{"alter":-1},"tagebuch":[{"tag":"2026-01-01","name":"A","kcal":10,"m":"quatsch"},{"tag":"x"}]}'); });
  ck('Kaputter Speicher wird bereinigt', await p.evaluate(() => { const s = scStore(); return s.verlauf.length === 0 && Array.isArray(s.favoriten) && s.tagebuch.length === 1 && SC_MAHLZEIT_IDS.includes(s.tagebuch[0].m) && s.ziel === 2000 && s.makro === null && s.profil === null && Object.keys(s.wasser).length === 0 && s.seite === 0; }));
  ck('Keine Seitenfehler', !fehler.length, fehler.join(' | '));
  console.log(checks.filter((c) => c[1]).length + ' bestanden, ' + checks.filter((c) => !c[1]).length + ' fehlgeschlagen');
  await b.close(); process.exit(checks.every((c) => c[1]) ? 0 : 1);
})();
