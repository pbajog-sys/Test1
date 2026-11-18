// Nähstube: Laden, Auftrag, Skizze, Zuschnitt (Teile + Stoffverbrauch), Schneiden, Nähen, Verzieren, Abgabe, Feierabend, Lookbook.
// Aufruf: python3 -m http.server 8765, dann  node tests/naehen.test.js [Bilderordner]
const { chromium, devices } = require('playwright');
const ordner = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!localStorage.getItem('walquiz.profile.v1')) localStorage.setItem('walquiz.profile.v1', JSON.stringify({ aktiv: 't', liste: [{ id: 't', name: 'T', avatar: '🧪', farbe: '#22c55e' }] })); localStorage.setItem('walquiz.installhinweis.v1', 'weg'); });
  const p = await ctx.newPage(); const fehler = []; p.on('pageerror', (e) => fehler.push(e.message));
  const checks = [], ck = (n, ok, info = '') => { checks.push([n, ok]); console.log((ok ? '✓ ' : '✗ ') + n + (info ? ' – ' + info : '')); };
  const bild = (n) => p.screenshot({ path: ordner + '/' + n + '.png' });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(900);
  ck('Hub-Karte in „Alltag“', await p.evaluate(() => !!document.querySelector('.sk-kat-alltag #hubNaehen')));
  // Kaputter Spielstand → sichere Standardwerte
  const mig = await p.evaluate(() => { localStorage.setItem(NS_KEY, '{"muenzen":"x","lager":5,"kleider":null}'); const s = nsStore(); localStorage.removeItem(NS_KEY); return s.muenzen === 80 && Array.isArray(s.lager) && Array.isArray(s.kleider) && Array.isArray(s.fenster); });
  ck('Kaputter Spielstand wird sicher gelesen', mig);
  // Wertung: Wunschkleid schlägt Fehlgriff
  const wert = await p.evaluate(() => {
    const a = { kunde: 'hanne', anlass: 'winterball', farbe: 'tanne', muster: 'uni', laenge: 'maxi', aermel: 'lang', budget: 100 };
    const gut = { oberteil: 'rund', aermel: 'lang', rock: 'glocke', laenge: 'maxi', stoffO: { art: 'samt', farbe: 'tanne', muster: 'uni' }, stoffR: { art: 'samt', farbe: 'tanne', muster: 'uni' }, winkelO: 0, winkelR: 45, deko: [{ a: 'perle', x: 150, y: 100 }, { a: 'perle', x: 160, y: 110 }] };
    const schlecht = { ...gut, aermel: 'ohne', laenge: 'mini', stoffO: { art: 'leinen', farbe: 'senf', muster: 'karo' }, stoffR: { art: 'leinen', farbe: 'senf', muster: 'karo' }, deko: [] };
    return [nsBewerten(gut, a, 1, 1).gesamt, nsBewerten(schlecht, a, 1, 1).gesamt, nsBewerten(gut, a, 0.2, 0.2).gesamt];
  });
  ck('Wertung: Wunschkleid ≥ 0,9, Fehlgriff ≤ 0,4, schiefe Nähte kosten Punkte', wert[0] >= 0.9 && wert[1] <= 0.4 && wert[2] < wert[0] - 0.15, wert.map((v) => v.toFixed(2)).join(' / '));
  await p.click('#hubNaehen'); await p.waitForTimeout(1200);
  const start = await p.evaluate(() => nsStore());
  ck('Start: 80 Münzen, 3 m Baumwolle als Startstoff, leeres Schaufenster', start.muenzen === 80 && start.lager.length === 1 && start.lager[0].cm === 300 && (await p.locator('.ns-platz').count()) === 3);
  // Kater streicheln
  const box = await p.locator('#nsKatze').boundingBox();
  await p.evaluate(({ x, y }) => { const k = $('nsKatze'), ev = (t, dx) => k.dispatchEvent(new PointerEvent(t, { clientX: x + dx, clientY: y, pointerId: 1, bubbles: true })); ev('pointerdown', 0); for (let i = 1; i <= 20; i++) ev('pointermove', (i % 2 ? 30 : -30)); ev('pointerup', 0); }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  ck('Kater Zwirn schnurrt beim Streicheln', (await p.evaluate(() => nsStore().streicheln)) >= 5);
  // Stoffladen: kaufen kostet Geld
  await p.click('#nsStoffladen'); await p.waitForTimeout(300);
  ck('Stoffladen: 10 Ballen mit Fall/Glanz/Wärme', (await p.locator('.ns-stoff').count()) === 10 && (await p.locator('.ns-wert').count()) === 30);
  await bild('ns-stoffladen');
  const vor = await p.evaluate(() => nsStore().muenzen);
  await p.click('[data-kauf="0"]'); await p.waitForTimeout(200);
  const nach = await p.evaluate(() => nsStore());
  const summe = (s) => s.lager.reduce((a, x) => a + x.cm, 0);
  ck('1 m kaufen: Münzen runter, 100 cm mehr im Regal', nach.muenzen < vor && summe(nach) === 400);
  await p.click('#nsZurueckLaden'); await p.waitForTimeout(200);
  // Auftrag
  await p.click('#nsKlingel'); await p.waitForTimeout(200);
  const auftrag = await p.evaluate(() => nsStore().auftrag);
  ck('Kundschaft kommt mit Wunsch und Budget', auftrag && auftrag.budget > 0 && await p.evaluate((a) => !!NS_ANLAESSE[a.anlass], auftrag) && /Ich brauche ein Kleid/.test(await p.textContent('.ns-auftrag')));
  await bild('ns-laden');
  await p.click('#nsAnnehmen'); await p.waitForTimeout(300);
  ck('Skizzenbuch: Wunsch-Ärmel und -Länge vorausgewählt, Vorschau-Kleid', await p.evaluate((a) => ns.d.aermel === a.aermel && ns.d.laenge === a.laenge && !!document.querySelector('.ns-vorschau svg'), auftrag));
  // Startstoff (300 cm) für alles, Knielang + A-Linie + kurze Ärmel → passt sicher
  await p.evaluate(() => { ns.d.laenge = 'knie'; ns.d.aermel = 'kurz'; ns.d.rock = 'aline'; ns.d.lo = 'start'; ns.d.lr = 'start'; });
  await p.click('.ns-chip[data-f="oberteil"][data-v="v"]'); await p.waitForTimeout(200);
  await bild('ns-skizze');
  await p.click('#nsZumZuschnitt'); await p.waitForTimeout(300);
  ck('Zuschnitt: 6 Teile automatisch angeordnet, alles passt', (await p.locator('.ns-teil').count()) === 6 && (await p.locator('.ns-teil.falsch').count()) === 0 && !(await p.evaluate(() => $('nsSchneiden').disabled)));
  // Teil drehen bis schräg (45°), dann übereinander ziehen → Fehler
  await p.evaluate(() => { ns.sel = 5; }); await p.click('#nsAuto'); await p.waitForTimeout(100);
  await p.evaluate(() => { ns.sel = 4; nsZuschnitt(); }); await p.click('#nsDrehen'); await p.waitForTimeout(100);
  ck('Drehen: Rock vorn liegt schräg (45°) im Fadenlauf', await p.evaluate(() => ns.gruppen[0].teile[4].r === 45));
  await p.evaluate(() => { const t = ns.gruppen[0].teile; t[5].x = t[0].x; t[5].y = t[0].y; nsZuschnitt(); });
  ck('Überlappende Teile werden rot, Zuschneiden gesperrt', (await p.locator('.ns-teil.falsch').count()) >= 2 && await p.evaluate(() => $('nsSchneiden').disabled));
  await p.click('#nsAuto'); await p.waitForTimeout(200);
  const verbrauch = await p.evaluate(() => nsPruefen(ns.gruppen[0].teile, 300).verbrauch), vorher = await p.evaluate(() => nsStore().lager.find((x) => x.id === 'start').cm);
  await bild('ns-zuschnitt');
  await p.click('#nsSchneiden'); await p.waitForTimeout(300);
  const lager = await p.evaluate(() => nsStore().lager.find((x) => x.id === 'start'));
  ck('Zuschneiden verbraucht Stoff vom Ballen', lager ? lager.cm === vorher - verbrauch : vorher - verbrauch < 15, 'Verbrauch ' + verbrauch + ' cm');
  // Schneiden: genau die Kontur abfahren
  await p.evaluate(() => {
    const svg = $('nsSchnitt'), pol = svg.querySelector('.ns-schnittlinie'), pts = pol.getAttribute('points').split(' ').map((q) => q.split(',').map(Number));
    const M = svg.getScreenCTM(), sc = (x, y) => { const q = svg.createSVGPoint(); q.x = x; q.y = y; return q.matrixTransform(M); };
    const ev = (t, x, y) => { const s = sc(x, y); svg.dispatchEvent(new PointerEvent(t, { clientX: s.x, clientY: s.y, pointerId: 2, bubbles: true })); };
    ev('pointerdown', ...pts[0]);
    pts.concat([pts[0]]).forEach((a, i, L) => { const b = L[i + 1]; if (!b) return; for (let j = 0; j <= 20; j++) ev('pointermove', a[0] + ((b[0] - a[0]) * j) / 20, a[1] + ((b[1] - a[1]) * j) / 20); });
  });
  await p.waitForTimeout(900);
  ck('Genau geschnitten → Genauigkeit ≥ 90 %, weiter zur Nähmaschine', await p.evaluate(() => ns.schnitt >= 0.9 && ns.teil === 'naehen'), await p.evaluate(() => String(ns.schnitt)));
  // Nähen: Stoff perfekt nachführen
  await p.evaluate(() => { const T = ns.nahtTest; T.treten(true); const f = () => { if (ns.teil !== 'naehen') return; T.setze(-T.g(T.pos())); requestAnimationFrame(f); }; f(); });
  await p.waitForTimeout(3500); await bild('ns-naehen');
  await p.waitForFunction(() => ns.teil === 'deko', null, { timeout: 15000 });
  ck('Saubere Naht → ≥ 85 % auf der Linie', await p.evaluate(() => ns.naht >= 0.85), await p.evaluate(() => String(ns.naht)));
  // Verzieren: zwei Knöpfe aufs Oberteil, einen wieder weg
  const tippe = async (x, y) => { const bb = await p.locator('#nsDekoFlaeche svg').boundingBox(); await p.mouse.click(bb.x + (x / 300) * bb.width, bb.y + (y / 420) * bb.height); await p.waitForTimeout(120); };
  await tippe(150, 110); await tippe(150, 135); await p.click('.ns-chip[data-dw="schleife"]'); await tippe(150, 160);
  ck('Verzierungen setzen (3)', (await p.evaluate(() => ns.d.deko.length)) === 3 && (await p.locator('#nsDekoFlaeche [data-di]').count()) === 3);
  await p.evaluate(() => document.querySelector('#nsDekoFlaeche [data-di="2"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  ck('Antippen entfernt eine Verzierung', (await p.evaluate(() => ns.d.deko.length)) === 2);
  await bild('ns-deko');
  const geld = await p.evaluate(() => nsStore().muenzen);
  await p.click('#nsFertig'); await p.waitForTimeout(500);
  const nachAbgabe = await p.evaluate(() => nsStore());
  ck('Abgabe: Sterne, Kommentare, Lohn, Lookbook-Eintrag, Auftrag erledigt', (await p.locator('.ns-stimmen li').count()) === 7 && nachAbgabe.muenzen > geld && nachAbgabe.kleider.length === 1 && !nachAbgabe.auftrag, '+' + (nachAbgabe.muenzen - geld) + ' 🪙, ' + nachAbgabe.kleider[0].sterne + '★');
  ck('Verlauf bekommt einen Eintrag', await p.evaluate(() => JSON.stringify(loadJson('walquiz.verlauf.v1')).includes('naehen')));
  await bild('ns-abgabe');
  // Fürs Schaufenster (ohne Auftrag; 1-m-Stoff reicht für Mini ohne Ärmel nicht → anderer Stoff)
  await p.click('#nsWeiterLaden'); await p.waitForTimeout(200);
  await p.evaluate(() => { const S = nsStore(); S.lager.push({ id: 'viel', art: 'seide', farbe: 'rose', muster: 'punkte', cm: 400 }); nsSpeichern(S); });
  await p.click('#nsFrei'); await p.waitForTimeout(200);
  await p.evaluate(() => { ns.d.lo = 'viel'; ns.d.lr = 'viel'; ns.d.aermel = 'ohne'; ns.d.rock = 'teller'; ns.d.laenge = 'midi'; });
  await p.click('#nsZumZuschnitt'); await p.waitForTimeout(200);
  ck('Ohne Ärmel → 4 Teile', (await p.locator('.ns-teil').count()) === 4);
  await p.click('#nsSchneiden'); await p.waitForTimeout(200); await p.click('#nsMaschine'); await p.waitForTimeout(300);
  ck('Schneidemaschine: weiter mit 60 %', await p.evaluate(() => ns.schnitt === 0.6 && ns.teil === 'naehen'));
  await p.evaluate(() => { const T = ns.nahtTest; T.setze(150); T.treten(true); });   // Stoff weit daneben
  await p.waitForFunction(() => ns.teil === 'deko', null, { timeout: 15000 });
  ck('Schief genäht → Naht unter 20 %', await p.evaluate(() => ns.naht < 0.2), await p.evaluate(() => String(ns.naht)));
  await p.click('#nsFertig'); await p.waitForTimeout(300);
  const fenster = await p.evaluate(() => nsStore().fenster);
  ck('Kleid hängt im Schaufenster mit Preisschild', fenster.length === 1 && fenster[0].preis >= 20);
  const tag = await p.evaluate(() => nsStore().tag);
  await p.evaluate(() => { const S = nsStore(); S.ruf = 60; nsSpeichern(S); Math.random = () => 0.1; });
  await p.click('#nsFeierabend'); await p.waitForTimeout(300);
  const morgen = await p.evaluate(() => nsStore());
  ck('Feierabend: neuer Tag, Schaufenster-Kleid verkauft', morgen.tag === tag + 1 && morgen.fenster.length === 0);
  await bild('ns-laden-tag2');
  await p.click('#nsLook'); await p.waitForTimeout(200);
  ck('Lookbook zeigt beide Kleider', (await p.locator('.ns-look-k').count()) === 2);
  await bild('ns-lookbook');
  await p.click('#nsZurueck'); await p.waitForTimeout(200); await p.click('#nsZurueck'); await p.waitForTimeout(600);
  ck('Zurück → Hub, Karte zeigt Tag und Kleider', /Tag 2 · 2 Kleider/.test(await p.textContent('#hubNaehenBest')));
  ck('Keine JS-Fehler', !fehler.length, fehler.slice(0, 3).join(' | '));
  await b.close();
  const ok = checks.filter((c) => c[1]).length; console.log('\n' + ok + '/' + checks.length + ' Checks bestanden');
  process.exit(ok === checks.length ? 0 : 1);
})();
