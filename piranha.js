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
];

// ---------- Level erzeugen und lösen ----------
// Zelle: { t: 'w' | 'fels' | 'hoehle' | 'frucht', f: Farbindex, n: Anzahl }
function prLevelDaten(nr) {
  const stufe = Math.min(nr, 40);
  return {
    W: Math.min(8, 6 + Math.floor(stufe / 8)), H: Math.min(10, 8 + Math.floor(stufe / 10)),
    farben: Math.min(5, 2 + Math.floor((stufe + 1) / 4)),
    hoehlenJeFarbe: Math.min(3, 1 + Math.floor(stufe / 5)),
    maxHoehlen: Math.min(12, 3 + Math.floor(stufe / 2)),
    fels: Math.min(0.2, 0.06 + stufe * 0.006),
  };
}
const prKey = (b) => b.map((z) => (z.t === 'hoehle' || z.t === 'frucht' ? z.n : z.t[0])).join(',');
function prNachbarn(W, H, i) {
  const x = i % W, y = Math.floor(i / W), r = [];
  if (x > 0) r.push(i - 1); if (x < W - 1) r.push(i + 1); if (y > 0) r.push(i - W); if (y < H - 1) r.push(i + W);
  return r;
}
// Kürzester Weg von Höhle h zu einer passenden Frucht mit Bedarf; liefert [Weg als Zellindizes, Zielindex] oder null
function prWeg(b, W, H, h) {
  const f = b[h].f, vor = new Map([[h, -1]]), q = [h];
  while (q.length) {
    const i = q.shift();
    for (const j of prNachbarn(W, H, i)) {
      if (vor.has(j)) continue;
      const z = b[j];
      if (z.t === 'frucht' && z.f === f && z.n > 0) {
        const weg = [j]; let k = i; while (k !== -1) { weg.unshift(k); k = vor.get(k); }
        return [weg, j];
      }
      if (z.t !== 'w') continue;
      vor.set(j, i); q.push(j);
    }
  }
  return null;
}
// Einen Zug anwenden (auf einer Kopie): Fische laufen nacheinander zu den jeweils nächsten Früchten, solange erreichbar
function prZug(b, W, H, h) {
  const n = b.map((z) => ({ ...z }));
  const fahrten = [];
  while (n[h].n > 0) {
    const w = prWeg(n, W, H, h);
    if (!w) break;
    const [weg, ziel] = w, anzahl = Math.min(n[h].n, n[ziel].n);
    n[h].n -= anzahl; n[ziel].n -= anzahl;
    fahrten.push({ weg, anzahl, ziel });
    if (n[ziel].n === 0) n[ziel] = { t: 'w' };
  }
  if (!fahrten.length) return null;
  if (n[h].n === 0) n[h] = { t: 'w' };
  return { brett: n, fahrten };
}
const prFertig = (b) => !b.some((z) => z.t === 'frucht');
// Breitensuche: kleinste Zahl an Zügen (oder null, wenn unlösbar)
function prLoesen(b, W, H, grenze = 40000) {
  const start = prKey(b), gesehen = new Map([[start, null]]), q = [b];
  let n = 0;
  while (q.length && n++ < grenze) {
    const s = q.shift();
    if (prFertig(s)) {
      const pfad = []; let k = prKey(s);
      while (gesehen.get(k)) { const [vorKey, zug] = gesehen.get(k); pfad.unshift(zug); k = vorKey; }
      return pfad;
    }
    s.forEach((z, i) => {
      if (z.t !== 'hoehle') return;
      const r = prZug(s, W, H, i);
      if (!r) return;
      const k = prKey(r.brett);
      if (gesehen.has(k)) return;
      gesehen.set(k, [prKey(s), i]);
      q.push(r.brett);
    });
  }
  return null;
}
function prErzeugen(seed, nr) {
  const D = prLevelDaten(nr);
  for (let versuch = 0; versuch < 300; versuch++) {
    const r = zufallsGenerator(seed + '|' + nr + '|' + versuch);
    const { W, H } = D, b = Array.from({ length: W * H }, () => ({ t: 'w' }));
    const freiIn = (y0, y1) => { const l = []; for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) if (b[y * W + x].t === 'w') l.push(y * W + x); return l; };
    const zieh = (l) => l.splice(Math.floor(r() * l.length), 1)[0];
    // Früchte oben (Ufer), Höhlen unten, dazwischen Felsen
    const farben = [...Array(D.farben).keys()];
    for (const f of farben) {
      const gesamt = 3 + Math.floor(r() * (3 + Math.min(4, nr / 3)));
      const schon = b.filter((z) => z.t === 'hoehle').length, uebrig = farben.length - f;
      const teile = Math.max(1, Math.min(gesamt, 1 + Math.floor(r() * D.hoehlenJeFarbe), D.maxHoehlen - schon - (uebrig - 1)));
      // Höhlen
      let rest = gesamt;
      for (let i = 0; i < teile; i++) {
        const n = i === teile - 1 ? rest : Math.max(1, Math.min(rest - (teile - 1 - i), Math.round(rest / (teile - i) + (r() - 0.5) * 2)));
        rest -= n;
        const l = freiIn(Math.floor(H * 0.45), H - 1); if (!l.length) break;
        b[zieh(l)] = { t: 'hoehle', f, n };
      }
      // Früchte: 1–2 Stück, zusammen so viele wie Fische
      const fr = nr > 4 && gesamt >= 4 && r() < 0.5 ? 2 : 1;
      let rf = gesamt;
      for (let i = 0; i < fr; i++) {
        const n = i === fr - 1 ? rf : Math.ceil(rf / 2);
        rf -= n;
        const l = freiIn(0, Math.floor(H * 0.4)); if (!l.length) break;
        b[zieh(l)] = { t: 'frucht', f, n };
      }
    }
    const felsen = Math.round(W * H * D.fels);
    for (let i = 0; i < felsen; i++) { const l = freiIn(0, H - 1); if (l.length) b[zieh(l)] = { t: 'fels' }; }
    // Summen prüfen (falls Platz gefehlt hat)
    const summe = (t, f) => b.filter((z) => z.t === t && z.f === f).reduce((s, z) => s + z.n, 0);
    if (farben.some((f) => summe('hoehle', f) !== summe('frucht', f) || !summe('hoehle', f))) continue;
    const loesung = prLoesen(b, W, H);
    if (!loesung) continue;
    // Spannend: ab Level 3 muss mindestens eine Höhle am Anfang blockiert sein
    const blockiert = b.filter((z, i) => z.t === 'hoehle' && !prWeg(b, W, H, i)).length;
    if (nr >= 3 && blockiert === 0) continue;
    return { W, H, brett: b, par: loesung.length, loesung };
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
  pr = { nr, taeglich: !!opts.taeglich, W: L.W, H: L.H, brett: L.brett, start: L.brett.map((z) => ({ ...z })), par: L.par, zuege: 0, verlauf: [], fische: [], lauf: 0, wackel: {}, fertig: false };
  zeigePrTeil('spiel');
  $('prKopf').textContent = (pr.taeglich ? '📅 Tagesfluss' : 'Level ' + nr) + ' · Ziel: ' + pr.par + (pr.par === 1 ? ' Zug' : ' Züge');
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
  if (!pr || pr.fertig || pr.fische.length) return;
  const cv = $('prBild'), r = cv.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * pr.W), y = Math.floor((e.clientY - r.top) / r.height * pr.H);
  const i = y * pr.W + x, z = pr.brett[i];
  if (!z || z.t !== 'hoehle') return;
  const zug = prZug(pr.brett, pr.W, pr.H, i);
  if (!zug) { pr.wackel[i] = performance.now(); if (navigator.vibrate) navigator.vibrate(30); $('prMeldung').textContent = 'Kein freier Weg zu einer ' + PR_FARBEN[z.f].name.toLowerCase() + 'en Frucht.'; return; }
  $('prMeldung').textContent = '';
  pr.verlauf.push(pr.brett.map((q) => ({ ...q })));
  pr.zuege++;
  // Fische losschicken: jeder Fisch folgt dem Weg seiner Fahrt, leicht versetzt
  const jetzt = performance.now();
  let verzug = 0;
  zug.fahrten.forEach((f) => {
    for (let k = 0; k < f.anzahl; k++) { pr.fische.push({ weg: f.weg, f: z.f, start: jetzt + verzug, ziel: f.ziel, quelle: i }); verzug += 110; }
    verzug += 120;
  });
  pr.zielBrett = zug.brett;
  pr.anzeige = pr.brett.map((q) => ({ ...q }));   // was während der Animation gezeigt wird (zählt live mit)
  if (navigator.vibrate) navigator.vibrate(15);
  prStatus();
}
function prRueckgaengig() {
  if (!pr || !pr.verlauf.length || pr.fische.length) return;
  pr.brett = pr.verlauf.pop(); pr.zuege++; pr.fertig = false;
  $('prMeldung').textContent = 'Rückgängig (zählt als Zug)';
  prStatus();
}
function prNeu() { if (!pr) return; pr.brett = pr.start.map((z) => ({ ...z })); pr.zuege = 0; pr.verlauf = []; pr.fertig = false; $('prMeldung').textContent = ''; prStatus(); }
function prTipp2() {
  if (!pr || pr.fische.length || pr.fertig) return;
  const l = prLoesen(pr.brett, pr.W, pr.H);
  if (!l) { $('prMeldung').textContent = 'Von hier aus geht es nicht mehr – nimm einen Zug zurück oder fang neu an.'; return; }
  pr.wackel[l[0]] = performance.now(); pr.tipp = { i: l[0], bis: performance.now() + 2200 };
  $('prMeldung').textContent = '💡 Probier die markierte Höhle.';
}

// ---------- Animation ----------
const PR_TEMPO = 0.0062;   // Zellen pro ms
function prUpdate(t) {
  if (!pr.fische.length) return;
  const anz = pr.anzeige;
  pr.fische = pr.fische.filter((f) => {
    const s = (t - f.start) * PR_TEMPO;
    if (s < 0) return true;
    if (!f.raus) { f.raus = true; if (anz[f.quelle].n > 0) anz[f.quelle].n--; }
    if (s >= f.weg.length - 1) { if (anz[f.ziel] && anz[f.ziel].n > 0) anz[f.ziel].n--; return false; }
    return true;
  });
  if (!pr.fische.length) {
    pr.brett = pr.zielBrett; pr.anzeige = null;
    if (prFertig(pr.brett)) prGeschafft();
    else if (!pr.brett.some((z, i) => z.t === 'hoehle' && prZug(pr.brett, pr.W, pr.H, i))) $('prMeldung').textContent = 'Festgefahren! Nimm einen Zug zurück oder fang neu an.';
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
  $('prMeldung').innerHTML = '<b>' + '⭐'.repeat(sterne) + '☆'.repeat(3 - sterne) + '</b> Geschafft in ' + pr.zuege + ' Zügen (bestes Ergebnis: ' + pr.par + ').';
  $('prWeiterBtn').hidden = pr.taeglich;
}

// ---------- Zeichnen ----------
let prPx = 50;
function prGroesse() {
  const cv = $('prBild'), breite = Math.min(cv.parentElement.clientWidth, 520);
  prPx = Math.floor(breite / pr.W);
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
  const x = $('prBild').getContext('2d'), P = prPx, W = pr.W, H = pr.H, b = pr.anzeige || pr.brett;
  // Fluss
  const g = x.createLinearGradient(0, 0, 0, H * P);
  g.addColorStop(0, '#1f4d3a'); g.addColorStop(1, '#0f2f2a');
  x.fillStyle = g; x.fillRect(0, 0, W * P, H * P);
  x.strokeStyle = 'rgba(180,230,200,0.07)'; x.lineWidth = 2;
  for (let i = 0; i < 6; i++) { x.beginPath(); const y = ((i * 97 + t / 40) % (H * P + 40)) - 20; x.moveTo(0, y); x.bezierCurveTo(W * P * 0.3, y - 14, W * P * 0.6, y + 14, W * P, y); x.stroke(); }
  // Ufer oben
  x.fillStyle = 'rgba(60,120,60,0.25)'; x.fillRect(0, 0, W * P, P * 0.18);
  b.forEach((z, i) => {
    const cx = (i % W + 0.5) * P, cy = (Math.floor(i / W) + 0.5) * P;
    let ox = 0;
    if (pr.wackel[i] && t - pr.wackel[i] < 400) ox = Math.sin((t - pr.wackel[i]) / 25) * 4;
    if (z.t === 'fels') {
      x.fillStyle = '#4b5548'; x.beginPath(); x.ellipse(cx, cy + P * 0.05, P * 0.42, P * 0.36, 0.3, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#5f6b5a'; x.beginPath(); x.ellipse(cx - P * 0.08, cy - P * 0.05, P * 0.28, P * 0.2, 0.3, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(120,180,90,0.6)'; x.beginPath(); x.arc(cx + P * 0.15, cy - P * 0.15, P * 0.08, 0, Math.PI * 2); x.fill();
    } else if (z.t === 'hoehle' && z.n > 0) {
      const F = PR_FARBEN[z.f], frei = !pr.anzeige && !!prWeg(b, W, H, i);
      x.fillStyle = '#3a2a1a'; x.beginPath(); x.arc(cx + ox, cy, P * 0.44, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#120c06'; x.beginPath(); x.arc(cx + ox, cy + P * 0.04, P * 0.32, 0, Math.PI * 2); x.fill();
      x.strokeStyle = F.haupt; x.lineWidth = Math.max(3, P * 0.08); x.globalAlpha = frei || pr.anzeige ? 1 : 0.45;
      x.beginPath(); x.arc(cx + ox, cy, P * 0.42, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
      // kleine Fische schauen heraus
      for (let k = 0; k < Math.min(3, z.n); k++) prFisch(x, F, cx + ox + (k - 1) * P * 0.16, cy + P * 0.08 + Math.sin(t / 300 + k) * 2, -Math.PI / 2 + (k - 1) * 0.3, t, P * 0.22);
      x.fillStyle = '#fff'; x.font = '800 ' + Math.round(P * 0.3) + 'px Outfit, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(z.n, cx + ox + P * 0.28, cy - P * 0.28);
      if (pr.tipp && pr.tipp.i === i && t < pr.tipp.bis) { x.strokeStyle = '#fff'; x.lineWidth = 3; x.setLineDash([6, 5]); x.beginPath(); x.arc(cx, cy, P * 0.5 + Math.sin(t / 120) * 3, 0, Math.PI * 2); x.stroke(); x.setLineDash([]); }
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
    prFisch(x, PR_FARBEN[f.f], fx * P + Math.sin(t / 90 + f.start) * 1.5, fy * P + Math.cos(t / 110 + f.start) * 1.5, w, t, P * 0.34);
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
