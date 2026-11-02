// 🐟 Piranha-Schwarm: Ein Fluss-Puzzle in großem Maßstab. In der Flussmitte treibt ein großes Pixelbild aus Früchten
// (64 Felder breit, rund 1500–2500 Pixel), oben und unten warten riesige Piranha-Schwärme in Wurzelhöhlen.
// Höhle antippen → der Schwarm frisst sich wie eine Flut durchs Bild: jeder Fisch zum nächsten erreichbaren Pixel seiner Farbe,
// gefressene Pixel öffnen sofort den Weg dahinter. Bis zu zwei Schwärme gleichzeitig.
// Weil Fressen nur Hindernisse entfernt (nie neue schafft), ist jedes Level lösbar, solange am Ende alles erreichbar ist –
// das prüft eine Simulation beim Erzeugen. Sie liefert auch die Ziel-Zugzahl für die Sterne und den Tipp.
// (Viele Piranha-Arten fressen tatsächlich auch Früchte und Samen, die ins Wasser fallen.)
const PR_KEY = 'walquiz.piranha.v1';
const PR_FARBEN = [
  { id: 'rot', name: 'Rot', haupt: '#ef4444', bauch: '#fca5a5', frucht: '#dc2626', hell: '#f87171' },
  { id: 'gelb', name: 'Gelb', haupt: '#facc15', bauch: '#fef08a', frucht: '#eab308', hell: '#fde047' },
  { id: 'blau', name: 'Blau', haupt: '#38bdf8', bauch: '#bae6fd', frucht: '#0284c7', hell: '#7dd3fc' },
  { id: 'lila', name: 'Lila', haupt: '#a78bfa', bauch: '#ddd6fe', frucht: '#7c3aed', hell: '#c4b5fd' },
  { id: 'orange', name: 'Orange', haupt: '#fb923c', bauch: '#fed7aa', frucht: '#ea580c', hell: '#fdba74' },
  { id: 'gruen', name: 'Grün', haupt: '#4ade80', bauch: '#bbf7d0', frucht: '#16a34a', hell: '#86efac' },
];
// Zelltypen
const WASSER = 0, FELS = 1, PIXEL = 2, HOEHLE = 3;

// ---------- Bilder ----------
// Vorlagen 8 breit (r rot, g gelb, b blau, l lila, o orange, n grün, . Wasser); werden mit Scale2x dreimal geglättet vergrößert (×8)
const PR_BILDER = [
  { name: 'Kirschen', emoji: '🍒', zeilen: ['....nn..', '...n..n.', '..n....n', '.rr...rr', 'rrrr.rrr', '.rr...rr'] },
  { name: 'Wassermelone', emoji: '🍉', zeilen: ['rrrrrrrr', 'rlrrrrlr', 'rrrlrrrr', '.rrrrrr.', '.nnnnnn.', '..nnnn..'] },
  { name: 'Erdbeere', emoji: '🍓', zeilen: ['..nnnn..', '.rrnnrr.', 'rrgrrgrr', 'rrrrrrrr', '.rgrrgr.', '..rrrr..', '...rr...'] },
  { name: 'Ananas', emoji: '🍍', zeilen: ['..n.n.n.', '...nnn..', '..goggo.', '.ggogggo', '.goggogg', '.ggogggo', '..goggo.'] },
  { name: 'Weintrauben', emoji: '🍇', zeilen: ['....nn..', '.lllnll.', 'llllllll', '.llllll.', '..llll..', '...ll...'] },
  { name: 'Sonnenblume', emoji: '🌻', zeilen: ['.gg..gg.', 'ggoooogg', '.goooog.', 'ggoooogg', '.gg..gg.', '...nn...', '..nnnn..'] },
  { name: 'Banane', emoji: '🍌', zeilen: ['......no', '.....gg.', '....ggg.', '..gggg..', 'gggggg..', '.gggg...'] },
  { name: 'Blaubeeren', emoji: '🫐', zeilen: ['..nn....', '.bbbb.n.', 'bbbbbbbn', 'bbllbbbb', '.bbbbbb.', '..bbbb..'] },
  { name: 'Orange', emoji: '🍊', zeilen: ['...nn...', '..oonno.', '.oooooo.', 'oooogooo', 'oooooooo', '.oooooo.', '..oooo..'] },
  { name: 'Paprika', emoji: '🫑', zeilen: ['...nn...', '..rnnr..', '.rrrrrr.', 'rrrgrrrr', 'rrrrrrrr', '.rrrrrr.', '..r..r..'] },
];
const PR_ZEICHEN = { r: 0, g: 1, b: 2, l: 3, o: 4, n: 5 };
// Scale2x (EPX): verdoppelt ein Raster und glättet dabei Treppenkanten
function prScale2x(g) {
  const h = g.length, w = g[0].length, aus = Array.from({ length: h * 2 }, () => Array(w * 2));
  const at = (y, x) => g[Math.max(0, Math.min(h - 1, y))][Math.max(0, Math.min(w - 1, x))];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = g[y][x], A = at(y - 1, x), B = at(y, x + 1), C = at(y, x - 1), D = at(y + 1, x);
    aus[2 * y][2 * x] = C === A && C !== D && A !== B ? A : P;
    aus[2 * y][2 * x + 1] = A === B && A !== C && B !== D ? B : P;
    aus[2 * y + 1][2 * x] = D === C && D !== B && C !== A ? C : P;
    aus[2 * y + 1][2 * x + 1] = B === D && B !== A && D !== C ? D : P;
  }
  return aus;
}
function prBildRaster(bild) {
  let g = bild.zeilen.map((z) => [...z].map((ch) => (ch in PR_ZEICHEN ? PR_ZEICHEN[ch] : -1)));
  for (let k = 0; k < 3; k++) g = prScale2x(g);
  return g;
}

// ---------- Brett ----------
// b = { W, H, typ: Uint8Array, farbe: Int8Array, hid: Int16Array, hoehlen: [{ f, n, zellen, mitte }], rest: Pixel je Farbe }
const prKopie = (b) => ({ W: b.W, H: b.H, typ: b.typ.slice(), farbe: b.farbe.slice(), hid: b.hid.slice(), hoehlen: b.hoehlen.map((h) => ({ ...h })), rest: b.rest.slice() });
function prNachbarn(W, H, i, aus) {
  const x = i % W; let n = 0;
  if (x > 0) aus[n++] = i - 1; if (x < W - 1) aus[n++] = i + 1; if (i >= W) aus[n++] = i - W; if (i < W * (H - 1)) aus[n++] = i + W;
  return n;
}
const PR_NB = new Int32Array(4);
// Flut von einer Höhle aus. essen=false: nur prüfen, ob ein Pixel ihrer Farbe erreichbar ist.
function prFlut(b, id, essen) {
  const h = b.hoehlen[id], W = b.W, H = b.H, f = h.f, N = W * H;
  if (h.n <= 0) return essen ? null : false;
  const vor = new Int32Array(N).fill(-2), q = new Int32Array(N);
  let kopf = 0, ende = 0, fische = h.n;
  const fahrten = [];
  h.zellen.forEach((c) => { vor[c] = -1; q[ende++] = c; });
  while (kopf < ende && fische > 0) {
    const i = q[kopf++], n = prNachbarn(W, H, i, PR_NB);
    for (let k = 0; k < n; k++) {
      const j = PR_NB[k];
      if (vor[j] !== -2) continue;
      const t = b.typ[j];
      if (t === PIXEL && b.farbe[j] === f) {
        if (!essen) return true;
        vor[j] = i;
        const weg = []; let m = j; while (m !== -1) { weg.push(m); m = vor[m]; }
        weg.reverse();
        fahrten.push({ weg, ziel: j });
        b.typ[j] = WASSER; b.rest[f]--; fische--; q[ende++] = j;
        if (fische <= 0) break;
      } else if (t === WASSER) { vor[j] = i; q[ende++] = j; }
    }
  }
  if (!essen) return false;
  if (!fahrten.length) return null;
  h.n = fische;
  if (fische <= 0) h.zellen.forEach((c) => { b.typ[c] = WASSER; b.hid[c] = -1; });
  return fahrten;
}
const prFertig = (b) => b.rest.every((r) => r <= 0);
// Simulation: immer den Zug, der eine Höhle ganz leert – sonst den, der am meisten frisst. Liefert Zugfolge oder null.
function prSimulieren(b0) {
  const b = prKopie(b0), folge = [];
  for (let schritt = 0; schritt < 200 && !prFertig(b); schritt++) {
    let best = -1, wert = -1;
    b.hoehlen.forEach((h, id) => {
      if (h.n <= 0 || !prFlut(b, id, false)) return;
      const probe = prKopie(b), fahrten = prFlut(probe, id, true);
      const v = (probe.hoehlen[id].n === 0 ? 1e6 : 0) + fahrten.length;
      if (v > wert) { wert = v; best = id; }
    });
    if (best < 0) return null;
    prFlut(b, best, true); folge.push(best);
  }
  return prFertig(b) ? folge : null;
}

function prErzeugen(seed, nr) {
  const stufe = Math.min(nr, 40);
  const hash = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7), bild = PR_BILDER[(seed === 'piranha' ? nr - 1 : hash) % PR_BILDER.length];
  const raster = prBildRaster(bild), W = raster[0].length, bh = raster.length, ZONE = 12, H = ZONE + 2 + bh + 2 + ZONE;
  const HS = 5;   // Höhlen sind 5×5 Felder groß
  for (let versuch = 0; versuch < 60; versuch++) {
    const r = zufallsGenerator(seed + '|' + nr + '|' + versuch);
    const b = { W, H, typ: new Uint8Array(W * H), farbe: new Int8Array(W * H).fill(-1), hid: new Int16Array(W * H).fill(-1), hoehlen: [], rest: new Int32Array(PR_FARBEN.length) };
    const zaehl = new Array(PR_FARBEN.length).fill(0);
    raster.forEach((zeile, y) => zeile.forEach((f, x) => { if (f < 0) return; const i = (ZONE + 2 + y) * W + x; b.typ[i] = PIXEL; b.farbe[i] = f; zaehl[f]++; }));
    zaehl.forEach((n, f) => { b.rest[f] = n; });
    // Höhlen-Plätze: zwei Reihen à 5×5 oben und unten, zufällig belegt
    const plaetze = [];
    for (const y0 of [0, ZONE - HS - 1, H - ZONE + 1, H - HS]) for (let x0 = (y0 % 2); x0 + HS <= W; x0 += HS + 1) plaetze.push([x0, y0]);
    for (let i = plaetze.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [plaetze[i], plaetze[j]] = [plaetze[j], plaetze[i]]; }
    const farben = zaehl.map((n, f) => [f, n]).filter(([, n]) => n > 0);
    const teile = Math.min(5, 2 + Math.floor(stufe / 3));
    let ok = true;
    farben.forEach(([f, gesamt]) => {
      if (!ok) return;
      const n = Math.max(2, Math.min(teile, Math.ceil(gesamt / 60)));
      let rest = gesamt;
      for (let k = 0; k < n; k++) {
        const anz = k === n - 1 ? rest : Math.max(1, Math.min(rest - (n - 1 - k), Math.round(rest / (n - k) * (0.7 + r() * 0.6))));
        rest -= anz;
        // abwechselnd oben und unten
        const idx = plaetze.findIndex(([, y0]) => (k % 2 === 0) === (y0 < ZONE));
        if (idx < 0) { ok = false; return; }
        const [x0, y0] = plaetze.splice(idx, 1)[0], zellen = [];
        for (let dy = 0; dy < HS; dy++) for (let dx = 0; dx < HS; dx++) { const c = (y0 + dy) * W + x0 + dx; zellen.push(c); b.typ[c] = HOEHLE; b.hid[c] = b.hoehlen.length; }
        b.hoehlen.push({ f, n: anz, zellen, mitte: [x0 + HS / 2, y0 + HS / 2] });
      }
    });
    if (!ok) continue;
    // Felsen: kleine Blöcke in den Zonen, mehr in höheren Levels
    const felsen = Math.min(40, 6 + stufe * 2);
    for (let k = 0; k < felsen; k++) {
      const oben = r() < 0.5, x0 = Math.floor(r() * (W - 3)), y0 = oben ? Math.floor(r() * (ZONE - 1)) : H - ZONE + Math.floor(r() * (ZONE - 1));
      const g = 2 + Math.floor(r() * 2);
      for (let dy = 0; dy < g; dy++) for (let dx = 0; dx < g; dx++) { const c = (y0 + dy) * W + x0 + dx; if (c < W * H && b.typ[c] === WASSER) b.typ[c] = FELS; }
    }
    const folge = prSimulieren(b);
    if (!folge) continue;
    const blockiert = b.hoehlen.filter((h, id) => !prFlut(b, id, false)).length;
    if (nr >= 2 && blockiert === 0 && versuch < 40) continue;
    return { brett: b, par: folge.length, bild, pixel: zaehl.reduce((a, c) => a + c, 0), fische: b.hoehlen.reduce((a, h) => a + h.n, 0) };
  }
  return null;
}

// ---------- Zustand ----------
let pr = null;
const prStore = () => loadJson(PR_KEY);
const prTeile = ['intro', 'spiel'];
const zeigePrTeil = (t) => prTeile.forEach((x) => { $('pr-' + x).hidden = x !== t; });

function piranhaIntro() {
  prStopp();
  const st = prStore(), level = st.level || 1;
  $('prLevelText').textContent = 'Level ' + level;
  $('prSterne').textContent = '⭐ ' + Object.values(st.sterne || {}).reduce((a, b) => a + b, 0) + ' Sterne gesammelt';
  const t = st.tag && st.tag[heute()];
  $('prTagBtn').textContent = t ? '📅 Tagesfluss – heute geschafft: ' + '⭐'.repeat(t) : '📅 Tagesfluss (heute für alle gleich)';
  zeigePrTeil('intro');
}
function piranhaStart(opts = {}) {
  zeigePrTeil('spiel');
  $('prKopf').textContent = '';
  $('prMeldung').textContent = '🌊 Fluss wird vorbereitet …';
  const cv = $('prBild'); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
  setTimeout(() => piranhaBauen(opts), 30);
}
function piranhaBauen(opts) {
  const st = prStore();
  const nr = opts.taeglich ? 12 : opts.level || st.level || 1;
  const seed = opts.taeglich ? 'pr-' + heute() : 'piranha';
  const L = prErzeugen(seed, nr);
  if (!L) { $('prMeldung').textContent = 'Konnte kein Level bauen – bitte nochmal.'; return; }
  const b = L.brett;
  pr = { nr, bild: L.bild, taeglich: !!opts.taeglich, brett: b, start: prKopie(b), par: L.par, zuege: 0, verlauf: [], fische: [],
    unterwegs: new Int32Array(b.hoehlen.length), ankunft: new Uint8Array(b.W * b.H), maske: b.farbe.slice(), aktiv: new Set(), wackel: {}, fertig: false, pixel: L.pixel };
  $('prKopf').textContent = (pr.taeglich ? '📅 Tagesfluss' : 'Level ' + nr) + ' · ' + L.bild.emoji + ' ' + L.bild.name + ' · ' + L.pixel.toLocaleString('de-DE') + ' Pixel · ' + L.fische.toLocaleString('de-DE') + ' Piranhas · Ziel: ' + pr.par + ' Züge';
  $('prMeldung').textContent = '';
  prFreiNeu();
  prGroesse();
  prStatus();
  const lauf = ++prLaufNr;
  const frame = (t) => { if (lauf !== prLaufNr || !pr) return; prUpdate(t); prZeichnen(t); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
let prLaufNr = 0;
function prStopp() { prLaufNr++; }
// Welche Höhlen haben gerade freien Weg? (nur nach Zügen neu berechnet)
function prFreiNeu() { pr.frei = pr.brett.hoehlen.map((h, id) => prFlut(pr.brett, id, false)); }
function prStatus() {
  const rest = pr.brett.rest.reduce((a, c) => a + Math.max(0, c), 0);
  $('prZuege').textContent = pr.zuege + (pr.zuege === 1 ? ' Zug' : ' Züge') + ' · noch ' + rest.toLocaleString('de-DE');
  $('prRueck').disabled = !pr.verlauf.length || pr.fische.length > 0;
}

// ---------- Eingabe ----------
function prTipp(e) {
  if (!pr || pr.fertig) return;
  const b = pr.brett, cv = $('prBild'), r = cv.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width * b.W, py = (e.clientY - r.top) / r.height * b.H;
  // nächste Höhle zum Tippunkt (großzügig)
  let id = -1, d = 1e9;
  b.hoehlen.forEach((h, k) => { if (h.n <= 0) return; const dd = Math.hypot(h.mitte[0] - px, h.mitte[1] - py); if (dd < d) { d = dd; id = k; } });
  if (id < 0 || d > 6) return;
  const h = b.hoehlen[id];
  if (pr.aktiv.has(id)) return;
  if (pr.aktiv.size >= 2) { $('prMeldung').textContent = 'Zwei Schwärme sind schon unterwegs – warte kurz.'; return; }
  if (!prFlut(b, id, false)) { pr.wackel[id] = performance.now(); if (navigator.vibrate) navigator.vibrate(30); $('prMeldung').textContent = 'Kein freier Weg zu einem ' + PR_FARBEN[h.f].name.toLowerCase() + 'en Pixel.'; return; }
  if (!pr.fische.length) pr.verlauf.push(prKopie(b));
  const fahrten = prFlut(b, id, true);
  $('prMeldung').textContent = '';
  pr.zuege++;
  pr.aktiv.add(id);
  const jetzt = performance.now(), abstand = Math.max(2, Math.min(25, 1800 / fahrten.length));
  fahrten.forEach((f, k) => { pr.fische.push({ weg: f.weg, f: h.f, start: jetzt + k * abstand, ziel: f.ziel, quelle: id, wobble: Math.random() * 6.28 }); pr.ankunft[f.ziel] = 1; });
  pr.unterwegs[id] += fahrten.length;
  prFreiNeu();
  if (navigator.vibrate) navigator.vibrate(15);
  prStatus();
}
function prRueckgaengig() {
  if (!pr || !pr.verlauf.length || pr.fische.length) return;
  pr.brett = pr.verlauf.pop(); pr.zuege++; pr.fertig = false;
  $('prMeldung').textContent = 'Rückgängig (zählt als Zug)';
  prFreiNeu(); prSchicht(); prStatus();
}
function prNeu() { if (!pr || pr.fische.length) return; pr.brett = prKopie(pr.start); pr.zuege = 0; pr.verlauf = []; pr.fertig = false; $('prMeldung').textContent = ''; prFreiNeu(); prSchicht(); prStatus(); }
function prTipp2() {
  if (!pr || pr.fertig) return;
  if (pr.fische.length) { $('prMeldung').textContent = 'Warte, bis die Schwärme fertig sind.'; return; }
  const l = prSimulieren(pr.brett);
  if (!l) { $('prMeldung').textContent = 'Von hier aus geht es nicht mehr – nimm einen Zug zurück oder fang neu an.'; return; }
  pr.wackel[l[0]] = performance.now(); pr.tipp = { id: l[0], bis: performance.now() + 2400 };
  $('prMeldung').textContent = '💡 Probier die markierte Höhle.';
}

// ---------- Animation ----------
const PR_TEMPO = 0.045;   // Felder pro ms
function prUpdate(t) {
  if (!pr.fische.length) return;
  const b = pr.brett;
  let geaendert = false;
  pr.fische = pr.fische.filter((f) => {
    const s = (t - f.start) * PR_TEMPO;
    if (s >= f.weg.length - 1) {
      pr.ankunft[f.ziel] = 0; prPixelWeg(f.ziel); pr.unterwegs[f.quelle]--; geaendert = true;
      return false;
    }
    return true;
  });
  pr.aktiv.forEach((q) => { if (pr.unterwegs[q] <= 0) pr.aktiv.delete(q); });
  if (geaendert) prStatus();
  if (!pr.fische.length) {
    pr.aktiv.clear();
    if (prFertig(b)) prGeschafft();
    else if (!pr.frei.some(Boolean)) $('prMeldung').textContent = 'Festgefahren! Nimm einen Zug zurück oder fang neu an.';
    prStatus();
  }
}
function prGeschafft() {
  pr.fertig = true;
  const sterne = pr.zuege <= pr.par ? 3 : pr.zuege <= pr.par + 3 ? 2 : 1;
  const st = prStore();
  st.sterne = st.sterne || {}; st.tag = st.tag || {};
  if (pr.taeglich) st.tag[heute()] = Math.max(st.tag[heute()] || 0, sterne);
  else { st.sterne[pr.nr] = Math.max(st.sterne[pr.nr] || 0, sterne); st.level = Math.max(st.level || 1, pr.nr + 1); }
  saveJson(PR_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('piranha', sterne, 3, pr.taeglich ? 'Tagesfluss' : 'Level ' + pr.nr);
  konfetti(28, ['🐟', '🍒', '✨', '🌿']);
  if (navigator.vibrate) navigator.vibrate([30, 40, 30, 40, 60]);
  $('prMeldung').innerHTML = '<b>' + '⭐'.repeat(sterne) + '☆'.repeat(3 - sterne) + '</b> ' + pr.bild.emoji + ' ' + pr.bild.name + ' weggefuttert – ' + pr.pixel.toLocaleString('de-DE') + ' Pixel in ' + pr.zuege + ' Zügen (Ziel: ' + pr.par + ').';
  $('prWeiterBtn').hidden = pr.taeglich;
}

// ---------- Zeichnen ----------
// Bild-Pixel liegen auf einer eigenen Ebene; gefressene werden dort einmalig gelöscht (schnell auch bei Tausenden Pixeln)
let prPx = 6, prEbene = null;
function prGroesse() {
  const b = pr.brett, cv = $('prBild'), breite = Math.min(cv.parentElement.clientWidth, 720), hoehe = Math.max(360, window.innerHeight - 220);
  prPx = Math.max(3, Math.min(breite / b.W, hoehe / b.H));
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(b.W * prPx * dpr); cv.height = Math.round(b.H * prPx * dpr);
  cv.style.width = b.W * prPx + 'px'; cv.style.height = b.H * prPx + 'px';
  cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  prSchicht();
}
function prSchicht() {
  const b = pr.brett, P = prPx, dpr = window.devicePixelRatio || 1;
  prEbene = prEbene || document.createElement('canvas');
  prEbene.width = Math.round(b.W * P * dpr); prEbene.height = Math.round(b.H * P * dpr);
  const x = prEbene.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, b.W * P, b.H * P);
  for (let i = 0; i < b.W * b.H; i++) {
    if (pr.maske[i] < 0) continue;
    const gx = (i % b.W) * P, gy = Math.floor(i / b.W) * P;
    if (b.typ[i] === PIXEL || pr.ankunft[i]) prPixelMalen(x, i, gx, gy, P);
    else prGeistMalen(x, i, gx, gy, P);
  }
}
function prPixelMalen(x, i, gx, gy, P) {
  const F = PR_FARBEN[pr.maske[i]], y = Math.floor(i / pr.brett.W), xx = i % pr.brett.W;
  x.fillStyle = (xx + y) % 2 ? F.frucht : F.haupt;
  x.fillRect(gx, gy, P + 0.5, P + 0.5);
  if ((xx * 7 + y * 13) % 11 === 0) { x.fillStyle = F.hell; x.fillRect(gx, gy, P * 0.6, P * 0.6); }
}
function prGeistMalen(x, i, gx, gy, P) {
  x.clearRect(gx, gy, P + 0.5, P + 0.5);
  x.fillStyle = PR_FARBEN[pr.maske[i]].haupt; x.globalAlpha = 0.1; x.fillRect(gx, gy, P + 0.5, P + 0.5); x.globalAlpha = 1;
}
function prPixelWeg(i) {
  if (!prEbene) return;
  const x = prEbene.getContext('2d'), P = prPx;
  prGeistMalen(x, i, (i % pr.brett.W) * P, Math.floor(i / pr.brett.W) * P, P);
}
function prZeichnen(t) {
  const b = pr.brett, x = $('prBild').getContext('2d'), P = prPx, W = b.W, H = b.H;
  // Fluss
  const g = x.createLinearGradient(0, 0, 0, H * P);
  g.addColorStop(0, '#1f4d3a'); g.addColorStop(0.5, '#173f33'); g.addColorStop(1, '#0f2f2a');
  x.fillStyle = g; x.fillRect(0, 0, W * P, H * P);
  x.strokeStyle = 'rgba(180,230,200,0.06)'; x.lineWidth = 2;
  for (let i = 0; i < 7; i++) { x.beginPath(); const y = ((i * 97 + t / 40) % (H * P + 40)) - 20; x.moveTo(0, y); x.bezierCurveTo(W * P * 0.3, y - 14, W * P * 0.6, y + 14, W * P, y); x.stroke(); }
  // Felsen
  x.fillStyle = '#4b5548';
  for (let i = 0; i < W * H; i++) if (b.typ[i] === FELS) x.fillRect((i % W) * P, Math.floor(i / W) * P, P + 0.5, P + 0.5);
  // Bild
  x.drawImage(prEbene, 0, 0, W * P, H * P);
  // Höhlen
  b.hoehlen.forEach((h, id) => {
    if (h.n <= 0 && pr.unterwegs[id] <= 0) return;
    const F = PR_FARBEN[h.f], cx = h.mitte[0] * P, cy = h.mitte[1] * P, R = P * 2.6;
    let ox = 0;
    if (pr.wackel[id] && t - pr.wackel[id] < 400) ox = Math.sin((t - pr.wackel[id]) / 25) * 4;
    const frei = pr.aktiv.has(id) || pr.frei[id];
    x.globalAlpha = h.n > 0 ? 1 : 0.5;
    x.fillStyle = '#3a2a1a'; x.beginPath(); x.arc(cx + ox, cy, R, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#120c06'; x.beginPath(); x.arc(cx + ox, cy + R * 0.08, R * 0.74, 0, Math.PI * 2); x.fill();
    x.strokeStyle = F.haupt; x.lineWidth = Math.max(3, P * 0.7); x.globalAlpha = frei ? 1 : 0.35;
    x.beginPath(); x.arc(cx + ox, cy, R * 0.93, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
    for (let k = 0; k < Math.min(5, Math.ceil(h.n / 30)); k++) prFisch(x, F, cx + ox + Math.cos(t / 500 + k * 1.3) * R * 0.4, cy + Math.sin(t / 600 + k * 1.7) * R * 0.35, t / 500 + k * 1.3 + Math.PI / 2, t, R * 0.42);
    if (h.n > 0) {
      const fs = Math.max(11, Math.round(R * 0.62));
      x.font = '800 ' + fs + 'px Outfit, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const txt = String(h.n), bw = Math.max(fs * 1.3, x.measureText(txt).width + fs * 0.6);
      const bx = Math.min(W * P - bw / 2, Math.max(bw / 2, cx + ox + R * 0.7)), by = Math.min(H * P - fs * 0.62, Math.max(fs * 0.62, cy - R * 0.75));
      x.fillStyle = 'rgba(0,0,0,.78)'; x.beginPath(); x.roundRect(bx - bw / 2, by - fs * 0.62, bw, fs * 1.24, fs * 0.62); x.fill();
      x.fillStyle = '#fff'; x.fillText(txt, bx, by + 1);
    }
    if (pr.tipp && pr.tipp.id === id && t < pr.tipp.bis) { x.strokeStyle = '#fff'; x.lineWidth = 3; x.setLineDash([6, 5]); x.beginPath(); x.arc(cx, cy, R * 1.2 + Math.sin(t / 120) * 3, 0, Math.PI * 2); x.stroke(); x.setLineDash([]); }
  });
  // Fische: bei Hunderten eine einfache Form, sonst mit Details
  const viele = pr.fische.length > 300, gr = Math.max(4, P * 1.15);
  pr.fische.forEach((f) => {
    if (t < f.start) return;
    const s = (t - f.start) * PR_TEMPO, i = Math.min(f.weg.length - 2, Math.floor(s)), a = s - i;
    const p0 = f.weg[Math.max(0, i)], p1 = f.weg[Math.min(f.weg.length - 1, i + 1)];
    const x0 = p0 % W + 0.5, y0 = Math.floor(p0 / W) + 0.5, x1 = p1 % W + 0.5, y1 = Math.floor(p1 / W) + 0.5;
    const fx = (x0 + (x1 - x0) * a) * P + Math.sin(t / 90 + f.wobble) * P * 0.35, fy = (y0 + (y1 - y0) * a) * P + Math.cos(t / 110 + f.wobble) * P * 0.35;
    const w = Math.atan2(y1 - y0, x1 - x0), F = PR_FARBEN[f.f];
    if (viele) {
      const c = Math.cos(w), sn = Math.sin(w);
      x.fillStyle = F.haupt;
      x.beginPath(); x.moveTo(fx + c * gr * 0.6, fy + sn * gr * 0.6); x.lineTo(fx - sn * gr * 0.35 - c * gr * 0.3, fy + c * gr * 0.35 - sn * gr * 0.3);
      x.lineTo(fx - c * gr * 0.9, fy - sn * gr * 0.9); x.lineTo(fx + sn * gr * 0.35 - c * gr * 0.3, fy - c * gr * 0.35 - sn * gr * 0.3); x.fill();
    } else prFisch(x, F, fx, fy, w, t, gr);
  });
}
function prFisch(x, F, px, py, winkel, t, groesse) {
  const g = groesse;
  x.save(); x.translate(px, py); x.rotate(winkel);
  const schwanz = Math.sin(t / 70 + px) * 0.35;
  x.fillStyle = F.haupt;
  x.beginPath(); x.moveTo(-g * 0.55, 0); x.lineTo(-g * 0.95, -g * 0.35 + schwanz * g * 0.3); x.lineTo(-g * 0.95, g * 0.35 + schwanz * g * 0.3); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(0, 0, g * 0.6, g * 0.4, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = F.bauch; x.beginPath(); x.ellipse(g * 0.05, g * 0.15, g * 0.42, g * 0.2, 0, 0, Math.PI); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(g * 0.3, -g * 0.1, g * 0.12, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#111'; x.beginPath(); x.arc(g * 0.33, -g * 0.1, g * 0.06, 0, Math.PI * 2); x.fill();
  x.restore();
}

// ---------- Knöpfe ----------
$('prBild').addEventListener('pointerdown', prTipp);
$('prLos').addEventListener('click', () => piranhaStart());
$('prTagBtn').addEventListener('click', () => piranhaStart({ taeglich: true }));
$('prRueck').addEventListener('click', prRueckgaengig);
$('prNeu').addEventListener('click', prNeu);
$('prHinweis').addEventListener('click', prTipp2);
$('prWeiterBtn').addEventListener('click', () => { $('prWeiterBtn').hidden = true; piranhaStart({ level: pr.nr + 1 }); });
window.addEventListener('resize', () => { if (pr && !$('pr-spiel').hidden) prGroesse(); });
$('prZurueck').addEventListener('click', () => { if (!$('pr-spiel').hidden) { piranhaIntro(); return; } prStopp(); zeigeHub(); });
$('hubPiranha').addEventListener('click', () => { merkeZuletzt('piranha'); zoomZu($('hubPiranha'), () => { show('piranha', '🐟 Piranha-Schwarm'); piranhaIntro(); }); });
