// 🐟 Piranha-Schwarm: Ein Fluss-Puzzle. In Wurzelhöhlen warten Piranha-Schwärme, am Ufer hängen Früchte in ihrer Farbe.
// Höhle antippen → der Schwarm strömt heraus und schwimmt den kürzesten freien Weg zur nächsten passenden Frucht.
// Volle Höhlen und Früchte versperren Wege – die Reihenfolge ist das Rätsel. Jedes Level wird erzeugt und von einem
// Löser geprüft: Es ist garantiert lösbar, und der Löser kennt die kleinste Zahl an Zügen (für die Sterne und den Tipp).
// (Viele Piranha-Arten fressen tatsächlich auch Früchte und Samen, die ins Wasser fallen.)
const PR_KEY = 'walquiz.piranha.v1';
const PR_FARBEN = [
  { id: 'rot', name: 'Rot', haupt: '#ef4444', bauch: '#fca5a5', frucht: '#dc2626' },
  { id: 'gelb', name: 'Gelb', haupt: '#facc15', bauch: '#fef08a', frucht: '#eab308' },
  { id: 'blau', name: 'Blau', haupt: '#38bdf8', bauch: '#bae6fd', frucht: '#0284c7' },
  { id: 'lila', name: 'Lila', haupt: '#a78bfa', bauch: '#ddd6fe', frucht: '#7c3aed' },
  { id: 'orange', name: 'Orange', haupt: '#fb923c', bauch: '#fed7aa', frucht: '#ea580c' },
  { id: 'gruen', name: 'Grün', haupt: '#4ade80', bauch: '#bbf7d0', frucht: '#16a34a' },
];

// ---------- Level erzeugen und lösen ----------
// Zelle: { t: 'w' | 'fels' | 'hoehle' | 'frucht', f: Farbindex, n: Anzahl }  (Bild-Pixel = 'frucht' mit n = 1)
const prKey = (b) => b.map((z) => (z.t === 'hoehle' ? 'h' + z.n : z.t === 'frucht' ? 'p' : z.t[0])).join('');
function prNachbarn(W, H, i) {
  const x = i % W, y = Math.floor(i / W), r = [];
  if (x > 0) r.push(i - 1); if (x < W - 1) r.push(i + 1); if (y > 0) r.push(i - W); if (y < H - 1) r.push(i + W);
  return r;
}
// Kann die Höhle h gerade irgendein Pixel ihrer Farbe erreichen?
function prWeg(b, W, H, h) {
  const f = b[h].f, gesehen = new Uint8Array(W * H), q = [h];
  gesehen[h] = 1;
  for (let k = 0; k < q.length; k++) {
    for (const j of prNachbarn(W, H, q[k])) {
      if (gesehen[j]) continue;
      gesehen[j] = 1;
      const z = b[j];
      if (z.t === 'frucht' && z.f === f) return true;
      if (z.t === 'w') q.push(j);
    }
  }
  return false;
}
// Ein Zug: Der Schwarm frisst sich wie eine Flut vor – immer das nächstgelegene erreichbare Pixel seiner Farbe;
// ein gefressenes Pixel wird sofort zu Wasser und öffnet den Weg dahinter. Liefert neues Brett und die Wege der Fische.
function prZug(b, W, H, h) {
  const n = b.map((z) => ({ ...z })), f = n[h].f;
  let fische = n[h].n;
  const vor = new Int32Array(W * H).fill(-2), q = [h], fahrten = [];
  vor[h] = -1;
  for (let k = 0; k < q.length && fische > 0; k++) {
    for (const j of prNachbarn(W, H, q[k])) {
      if (vor[j] !== -2 || fische <= 0) continue;
      const z = n[j];
      if (z.t === 'frucht' && z.f === f) {
        vor[j] = q[k];
        const weg = []; let m = j; while (m !== -1) { weg.unshift(m); m = vor[m]; }
        fahrten.push({ weg, anzahl: 1, ziel: j });
        n[j] = { t: 'w' }; fische--; q.push(j);
      } else if (z.t === 'w') { vor[j] = q[k]; q.push(j); }
    }
  }
  if (!fahrten.length) return null;
  n[h] = fische > 0 ? { t: 'hoehle', f, n: fische } : { t: 'w' };
  return { brett: n, fahrten };
}
const prFertig = (b) => !b.some((z) => z.t === 'frucht');
// Tiefensuche nach einer Reihenfolge (Höhlen, die sich ganz leeren, zuerst). Liefert die Zugfolge oder null.
function prLoesen(b, W, H, grenze = 6000) {
  const gesehen = new Set(), pfad = [];
  let knoten = 0;
  const suche = (s) => {
    if (prFertig(s)) return true;
    if (++knoten > grenze) return false;
    const k = prKey(s);
    if (gesehen.has(k)) return false;
    gesehen.add(k);
    const zuege = [];
    s.forEach((z, i) => { if (z.t === 'hoehle') { const r = prZug(s, W, H, i); if (r) zuege.push([i, r.brett, r.brett[i].t === 'w' ? 0 : 1]); } });
    zuege.sort((x, y) => x[2] - y[2]);
    for (const [i, nb] of zuege) { pfad.push(i); if (suche(nb)) return true; pfad.pop(); }
    return false;
  };
  return suche(b) ? pfad.slice() : null;
}
// Pixelbilder aus Früchten (8 breit, werden doppelt so groß gezeichnet): r rot, g gelb, b blau, l lila, o orange, n grün, . Wasser
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
const PR_ZONE = 4;   // Reihen mit Höhlen oben und unten
function prErzeugen(seed, nr) {
  const stufe = Math.min(nr, 40);
  const hash = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7), bild = PR_BILDER[(seed === 'piranha' ? nr - 1 : hash) % PR_BILDER.length];
  const W = 16, bh = bild.zeilen.length * 2, oben = PR_ZONE + 1, H = oben + bh + 1 + PR_ZONE;
  const teile = Math.min(4, 1 + Math.floor(stufe / 3)), felsAnteil = Math.min(0.18, 0.05 + stufe * 0.006);
  const t0 = Date.now();
  let reserve = null;
  for (let versuch = 0; versuch < 300; versuch++) {
    if (reserve && Date.now() - t0 > 700) return reserve;
    const r = zufallsGenerator(seed + '|' + nr + '|' + versuch);
    const b = Array.from({ length: W * H }, () => ({ t: 'w' }));
    const zaehl = {};
    bild.zeilen.forEach((zeile, y) => [...zeile].forEach((ch, x) => {
      if (!(ch in PR_ZEICHEN)) return;
      const f = PR_ZEICHEN[ch];
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) b[(oben + y * 2 + dy) * W + x * 2 + dx] = { t: 'frucht', f, n: 1, px: true };
      zaehl[f] = (zaehl[f] || 0) + 4;
    }));
    const zonen = [[0, PR_ZONE - 1], [H - PR_ZONE, H - 1]];
    const frei = (z) => { const l = []; for (let y = zonen[z][0]; y <= zonen[z][1]; y++) for (let x = 0; x < W; x++) if (b[y * W + x].t === 'w') l.push(y * W + x); return l; };
    const zieh = (l) => l.splice(Math.floor(r() * l.length), 1)[0];
    // Höhlen: jede Farbe auf beide Seiten verteilt, damit die Schwärme von oben und unten aufeinander zu fressen
    Object.entries(zaehl).forEach(([f, gesamt]) => {
      const n = Math.max(2, Math.min(gesamt, 2 + Math.floor(r() * teile)));
      let rest = gesamt;
      for (let i = 0; i < n; i++) {
        const k = i === n - 1 ? rest : Math.max(1, Math.min(rest - (n - 1 - i), Math.round(rest / (n - i) + (r() - 0.5) * 6)));
        rest -= k;
        const l = frei(i % 2); if (!l.length) continue;
        b[zieh(l)] = { t: 'hoehle', f: Number(f), n: k };
      }
    });
    const summe = (f) => b.filter((z) => z.t === 'hoehle' && z.f === Number(f)).reduce((s2, z) => s2 + z.n, 0);
    if (Object.entries(zaehl).some(([f, g]) => summe(f) !== g)) continue;
    for (let z = 0; z < 2; z++) { const felsen = Math.round(W * PR_ZONE * felsAnteil); for (let i = 0; i < felsen; i++) { const l = frei(z); if (l.length) b[zieh(l)] = { t: 'fels' }; } }
    const loesung = prLoesen(b, W, H, Date.now() - t0 > 400 ? 1500 : 5000);
    if (!loesung) continue;
    const blockiert = b.filter((z, i) => z.t === 'hoehle' && !prWeg(b, W, H, i)).length;
    const ergebnis = { W, H, brett: b, par: loesung.length, loesung, bild, pixel: Object.values(zaehl).reduce((a2, c) => a2 + c, 0) };
    if (nr >= 2 && blockiert === 0) { reserve = reserve || ergebnis; continue; }
    return ergebnis;
  }
  return reserve;
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
  pr = { nr, bild: L.bild, maske: L.brett.map((z) => (z.px ? z.f : -1)), hFarbe: L.brett.map((z) => (z.t === 'hoehle' ? z.f : -1)), taeglich: !!opts.taeglich, W: L.W, H: L.H, brett: L.brett, start: L.brett.map((z) => ({ ...z })), par: L.par, zuege: 0, verlauf: [], fische: [], abgang: new Int32Array(L.W * L.H), ankunft: new Int32Array(L.W * L.H), aktiv: new Set(), lauf: 0, wackel: {}, fertig: false, pixel: L.pixel };
  zeigePrTeil('spiel');
  $('prKopf').textContent = (pr.taeglich ? '📅 Tagesfluss' : 'Level ' + nr) + ' · ' + L.bild.emoji + ' ' + L.bild.name + ' (' + L.pixel + ' Pixel) · Ziel: ' + pr.par + ' Züge';
  $('prMeldung').textContent = '';
  prGroesse();
  prStatus();
  const lauf = ++prLaufNr;
  const frame = (t) => { if (lauf !== prLaufNr || !pr) return; prUpdate(t); prZeichnen(t); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
let prLaufNr = 0;
function prStopp() { prLaufNr++; }
function prStatus() {
  $('prZuege').textContent = pr.zuege + (pr.zuege === 1 ? ' Zug' : ' Züge');
  $('prRueck').disabled = !pr.verlauf.length || pr.fische.length > 0;
}

// ---------- Eingabe ----------
function prTipp(e) {
  if (!pr || pr.fertig) return;
  const cv = $('prBild'), r = cv.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * pr.W), y = Math.floor((e.clientY - r.top) / r.height * pr.H);
  // großzügig treffen: auch das Nachbarfeld zählt, wenn dort eine Höhle ist
  let i = y * pr.W + x;
  if (!pr.brett[i] || pr.brett[i].t !== 'hoehle') { const n = prNachbarn(pr.W, pr.H, i).find((j) => pr.brett[j].t === 'hoehle'); if (n === undefined) return; i = n; }
  const z = pr.brett[i];
  if (pr.aktiv.has(i)) return;
  if (pr.aktiv.size >= 2) { $('prMeldung').textContent = 'Zwei Schwärme sind schon unterwegs – warte kurz.'; return; }
  const zug = prZug(pr.brett, pr.W, pr.H, i);
  if (!zug) { pr.wackel[i] = performance.now(); if (navigator.vibrate) navigator.vibrate(30); $('prMeldung').textContent = 'Kein freier Weg zu einem ' + PR_FARBEN[z.f].name.toLowerCase() + 'en Pixel.'; return; }
  $('prMeldung').textContent = '';
  if (!pr.fische.length) pr.verlauf.push(pr.brett.map((q) => ({ ...q })));
  pr.zuege++;
  pr.aktiv.add(i);
  const jetzt = performance.now();
  zug.fahrten.forEach((f, k) => {
    pr.fische.push({ weg: f.weg, f: z.f, start: jetzt + k * 32, ziel: f.ziel, quelle: i });
    pr.abgang[i]++; pr.ankunft[f.ziel]++;
  });
  pr.brett = zug.brett;   // Logik sofort, die Anzeige läuft über die Zähler nach
  if (navigator.vibrate) navigator.vibrate(15);
  prStatus();
}
function prRueckgaengig() {
  if (!pr || !pr.verlauf.length || pr.fische.length) return;
  pr.brett = pr.verlauf.pop(); pr.zuege++; pr.fertig = false;
  pr.brett.forEach((z, i) => { if (z.t === 'hoehle') pr.hFarbe[i] = z.f; });
  $('prMeldung').textContent = 'Rückgängig (zählt als Zug)';
  prStatus();
}
function prNeu() { if (!pr || pr.fische.length) return; pr.brett = pr.start.map((z) => ({ ...z })); pr.zuege = 0; pr.verlauf = []; pr.fertig = false; $('prMeldung').textContent = ''; prStatus(); }
function prTipp2() {
  if (!pr || pr.fische.length || pr.fertig) { if (pr && pr.fische.length) $('prMeldung').textContent = 'Warte, bis die Schwärme fertig sind.'; return; }
  const l = prLoesen(pr.brett, pr.W, pr.H);
  if (!l) { $('prMeldung').textContent = 'Von hier aus geht es nicht mehr – nimm einen Zug zurück oder fang neu an.'; return; }
  pr.wackel[l[0]] = performance.now(); pr.tipp = { i: l[0], bis: performance.now() + 2200 };
  $('prMeldung').textContent = '💡 Probier die markierte Höhle.';
}

// ---------- Animation ----------
const PR_TEMPO = 0.011;   // Zellen pro ms
function prUpdate(t) {
  if (!pr.fische.length) return;
  pr.fische = pr.fische.filter((f) => {
    const s2 = (t - f.start) * PR_TEMPO;
    if (s2 < 0) return true;
    if (!f.raus) { f.raus = true; pr.abgang[f.quelle]--; }
    if (s2 >= f.weg.length - 1) { pr.ankunft[f.ziel]--; return false; }
    return true;
  });
  pr.aktiv.forEach((q) => { if (pr.abgang[q] <= 0 && !pr.fische.some((f) => f.quelle === q)) pr.aktiv.delete(q); });
  if (!pr.fische.length) {
    pr.aktiv.clear();
    if (prFertig(pr.brett)) prGeschafft();
    else if (!pr.brett.some((z, i) => z.t === 'hoehle' && prWeg(pr.brett, pr.W, pr.H, i))) $('prMeldung').textContent = 'Festgefahren! Nimm einen Zug zurück oder fang neu an.';
    prStatus();
  }
}
function prPos(f, t) {
  const s = Math.max(0, (t - f.start) * PR_TEMPO), i = Math.min(f.weg.length - 2, Math.floor(s)), a = s - i;
  const p = (k) => [f.weg[k] % pr.W + 0.5, Math.floor(f.weg[k] / pr.W) + 0.5];
  const [x0, y0] = p(i), [x1, y1] = p(Math.min(f.weg.length - 1, i + 1));
  return [x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, Math.atan2(y1 - y0, x1 - x0)];
}

function prGeschafft() {
  pr.fertig = true;
  const sterne = pr.zuege <= pr.par ? 3 : pr.zuege <= pr.par + 2 ? 2 : 1;
  const st = prStore();
  st.sterne = st.sterne || {}; st.tag = st.tag || {};
  if (pr.taeglich) st.tag[heute()] = Math.max(st.tag[heute()] || 0, sterne);
  else { st.sterne[pr.nr] = Math.max(st.sterne[pr.nr] || 0, sterne); st.level = Math.max(st.level || 1, pr.nr + 1); }
  saveJson(PR_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('piranha', sterne, 3, pr.taeglich ? 'Tagesfluss' : 'Level ' + pr.nr);
  konfetti(28, ['🐟', '🍒', '✨', '🌿']);
  if (navigator.vibrate) navigator.vibrate([30, 40, 30, 40, 60]);
  $('prMeldung').innerHTML = '<b>' + '⭐'.repeat(sterne) + '☆'.repeat(3 - sterne) + '</b> ' + pr.bild.emoji + ' ' + pr.bild.name + ' weggefuttert – in ' + pr.zuege + ' Zügen (bestes Ergebnis: ' + pr.par + ').';
  $('prWeiterBtn').hidden = pr.taeglich;
}

// ---------- Zeichnen ----------
let prPx = 50;
function prGroesse() {
  const cv = $('prBild'), breite = Math.min(cv.parentElement.clientWidth, 640), hoehe = Math.max(320, window.innerHeight - 230);
  prPx = Math.max(12, Math.floor(Math.min(breite / pr.W, hoehe / pr.H)));
  const dpr = window.devicePixelRatio || 1;
  cv.width = pr.W * prPx * dpr; cv.height = pr.H * prPx * dpr;
  cv.style.width = pr.W * prPx + 'px'; cv.style.height = pr.H * prPx + 'px';
  cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
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
  // Zähnchen
  x.fillStyle = '#fff'; x.beginPath(); x.moveTo(g * 0.48, g * 0.05); x.lineTo(g * 0.56, g * 0.12); x.lineTo(g * 0.44, g * 0.12); x.fill();
  x.restore();
}
function prZeichnen(t) {
  const x = $('prBild').getContext('2d'), P = prPx, W = pr.W, H = pr.H;
  // Anzeige: was logisch schon weg ist, aber noch nicht „erreicht“ wurde, bleibt sichtbar
  const b = pr.brett.map((z, i) => {
    if (pr.ankunft[i] > 0 && pr.maske[i] >= 0) return { t: 'frucht', f: pr.maske[i], n: 1, px: true };
    if (pr.abgang[i] > 0) return { t: 'hoehle', f: pr.hFarbe[i], n: (z.t === 'hoehle' ? z.n : 0) + pr.abgang[i] };
    return z;
  });
  // Fluss
  const g = x.createLinearGradient(0, 0, 0, H * P);
  g.addColorStop(0, '#1f4d3a'); g.addColorStop(1, '#0f2f2a');
  x.fillStyle = g; x.fillRect(0, 0, W * P, H * P);
  x.strokeStyle = 'rgba(180,230,200,0.07)'; x.lineWidth = 2;
  for (let i = 0; i < 6; i++) { x.beginPath(); const y = ((i * 97 + t / 40) % (H * P + 40)) - 20; x.moveTo(0, y); x.bezierCurveTo(W * P * 0.3, y - 14, W * P * 0.6, y + 14, W * P, y); x.stroke(); }
  // Umriss des Bildes: schon gefressene Pixel blass
  if (pr.maske) pr.maske.forEach((f, i) => {
    if (f < 0 || (b[i].t === 'frucht' && b[i].n > 0)) return;
    x.strokeStyle = PR_FARBEN[f].haupt; x.globalAlpha = 0.22; x.lineWidth = 1.5;
    x.strokeRect((i % W) * P + P * 0.12, Math.floor(i / W) * P + P * 0.12, P * 0.76, P * 0.76); x.globalAlpha = 1;
  });
  b.forEach((z, i) => {
    const cx = (i % W + 0.5) * P, cy = (Math.floor(i / W) + 0.5) * P;
    let ox = 0;
    if (pr.wackel[i] && t - pr.wackel[i] < 400) ox = Math.sin((t - pr.wackel[i]) / 25) * 4;
    if (z.t === 'fels') {
      x.fillStyle = '#4b5548'; x.beginPath(); x.ellipse(cx, cy + P * 0.05, P * 0.42, P * 0.36, 0.3, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#5f6b5a'; x.beginPath(); x.ellipse(cx - P * 0.08, cy - P * 0.05, P * 0.28, P * 0.2, 0.3, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(120,180,90,0.6)'; x.beginPath(); x.arc(cx + P * 0.15, cy - P * 0.15, P * 0.08, 0, Math.PI * 2); x.fill();
    } else if (z.t === 'hoehle' && z.n > 0) {
      const F = PR_FARBEN[z.f], frei = pr.aktiv.has(i) || prWeg(pr.brett, W, H, i);
      const R = P * (P < 30 ? 0.62 : 0.44);
      x.fillStyle = '#3a2a1a'; x.beginPath(); x.arc(cx + ox, cy, R, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#120c06'; x.beginPath(); x.arc(cx + ox, cy + R * 0.1, R * 0.72, 0, Math.PI * 2); x.fill();
      x.strokeStyle = F.haupt; x.lineWidth = Math.max(3, P * 0.08); x.globalAlpha = frei ? 1 : 0.4;
      x.beginPath(); x.arc(cx + ox, cy, R * 0.95, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
      // kleine Fische schauen heraus
      for (let k = 0; k < Math.min(3, z.n); k++) prFisch(x, F, cx + ox + (k - 1) * R * 0.36, cy + R * 0.18 + Math.sin(t / 300 + k) * 2, -Math.PI / 2 + (k - 1) * 0.3, t, R * 0.5);
      const fs = Math.max(10, Math.round(P * 0.42));
      x.font = '800 ' + fs + 'px Outfit, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const bx = Math.min(W * P - fs * 0.75, Math.max(fs * 0.75, cx + ox + R * 0.7)), by = Math.min(H * P - fs * 0.75, Math.max(fs * 0.75, cy - R * 0.7));
      x.fillStyle = 'rgba(0,0,0,.75)'; x.beginPath(); x.arc(bx, by, fs * 0.72, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.fillText(z.n, bx, by + 1);
      if (pr.tipp && pr.tipp.i === i && t < pr.tipp.bis) { x.strokeStyle = '#fff'; x.lineWidth = 3; x.setLineDash([6, 5]); x.beginPath(); x.arc(cx, cy, R * 1.15 + Math.sin(t / 120) * 3, 0, Math.PI * 2); x.stroke(); x.setLineDash([]); }
    } else if (z.t === 'frucht' && z.n > 0 && z.px) {
      const F = PR_FARBEN[z.f], gx = (i % W) * P, gy = Math.floor(i / W) * P, k = P * 0.06;
      x.fillStyle = F.frucht; x.fillRect(gx + k, gy + k, P - 2 * k, P - 2 * k);
      x.fillStyle = F.haupt; x.fillRect(gx + k, gy + k, P - 2 * k, P * 0.22);
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(gx + k * 2, gy + k * 2, P * 0.18, P * 0.18);
      x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(gx + k, gy + P - k - P * 0.12, P - 2 * k, P * 0.12);
      // Pixel, die gerade erreichbar sind, glitzern leicht
      if (prNachbarn(W, H, i).some((j) => pr.brett[j].t === 'w') && Math.floor(t / 600 + i) % 4 === 0) { x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(gx + k, gy + k, P - 2 * k, P - 2 * k); }
    } else if (z.t === 'frucht' && z.n > 0) {
      const F = PR_FARBEN[z.f];
      x.fillStyle = '#2f6b2f'; x.beginPath(); x.ellipse(cx, cy + P * 0.1, P * 0.42, P * 0.3, 0, 0, Math.PI * 2); x.fill();
      const beeren = [[-0.14, -0.04], [0.14, -0.04], [0, 0.12], [-0.02, -0.2]];
      beeren.forEach(([bx, by], k) => {
        x.fillStyle = F.frucht; x.beginPath(); x.arc(cx + bx * P, cy + by * P + Math.sin(t / 500 + k) * 1.2, P * 0.15, 0, Math.PI * 2); x.fill();
        x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.arc(cx + bx * P - P * 0.05, cy + by * P - P * 0.05, P * 0.04, 0, Math.PI * 2); x.fill();
      });
      x.fillStyle = '#fff'; x.font = '800 ' + Math.round(P * 0.28) + 'px Outfit, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); x.arc(cx + P * 0.3, cy - P * 0.3, P * 0.17, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.fillText(z.n, cx + P * 0.3, cy - P * 0.29);
    }
  });
  // schwimmende Fische
  pr.fische.forEach((f) => {
    if (t < f.start) return;
    const [fx, fy, w] = prPos(f, t);
    prFisch(x, PR_FARBEN[f.f], fx * P + Math.sin(t / 90 + f.start) * 1.5, fy * P + Math.cos(t / 110 + f.start) * 1.5, w, t, Math.max(7, P * 0.4));
  });
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
