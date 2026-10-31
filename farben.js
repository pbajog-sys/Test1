// 🎨 Farb-Gedächtnis: Eine Farbe wird kurz gezeigt, danach mischt man sie aus dem Gedächtnis nach.
// Punkte (0–10 pro Farbe) nach dem Farbabstand CIEDE2000 – so, wie Menschen Unterschiede wahrnehmen.
const FARB_RUNDEN = 5;
const FARB_STUFEN = {
  leicht: { name: 'Leicht', sek: 5 },
  mittel: { name: 'Mittel', sek: 3 },
  profi:  { name: 'Profi', sek: 1.5 },
};
const FARB_KEY = 'walquiz.farben.v1';

// ---------- Farbrechnung ----------
function hsvZuRgb(h, s, v) {
  s /= 100; v /= 100;
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)].map((x) => Math.round(x * 255));
}
const rgbText = ([r, g, b]) => 'rgb(' + r + ',' + g + ',' + b + ')';
const hsvText = (c) => rgbText(hsvZuRgb(c.h, c.s, c.v));

function rgbZuLab([r, g, b]) {
  const lin = (c) => { c /= 255; return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

// Farbabstand CIEDE2000
function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cm, 7) / (Math.pow(Cm, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h = (b, a) => { if (!a && !b) return 0; const x = Math.atan2(b, a) * deg; return x < 0 ? x + 360 : x; };
  const h1p = h(b1, a1p), h2p = h(b2, a2p);
  const dL = L2 - L1, dC = C2p - C1p;
  let dh = 0;
  if (C1p * C2p) { dh = h2p - h1p; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh / 2) * rad);
  const Lm = (L1 + L2) / 2, Cmp = (C1p + C2p) / 2;
  let hm = h1p + h2p;
  if (C1p * C2p) { hm = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2 : (h1p + h2p) / 2; }
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const SL = 1 + (0.015 * Math.pow(Lm - 50, 2)) / Math.sqrt(20 + Math.pow(Lm - 50, 2));
  const SC = 1 + 0.045 * Cmp, SH = 1 + 0.015 * Cmp * T;
  const RT = -2 * Math.sqrt(Math.pow(Cmp, 7) / (Math.pow(Cmp, 7) + Math.pow(25, 7))) * Math.sin(60 * Math.exp(-Math.pow((hm - 275) / 25, 2)) * rad);
  return Math.sqrt(Math.pow(dL / SL, 2) + Math.pow(dC / SC, 2) + Math.pow(dH / SH, 2) + RT * (dC / SC) * (dH / SH));
}

// 0–10 Punkte: gleich = 10, ab einem Abstand von 50 gibt es 0
function farbPunkte(ziel, mix) {
  const d = deltaE2000(rgbZuLab(hsvZuRgb(ziel.h, ziel.s, ziel.v)), rgbZuLab(hsvZuRgb(mix.h, mix.s, mix.v)));
  return Math.max(0, Math.round((10 - d / 5) * 10) / 10);
}
const helleSchrift = (c) => { const [r, g, b] = hsvZuRgb(c.h, c.s, c.v); return 0.299 * r + 0.587 * g + 0.114 * b < 150; };

// Zufall mit Startwert – damit Tagesfarben und Challenges überall gleich sind
function zufallsGenerator(seed) {
  let a = 0;
  for (const ch of String(seed)) a = (Math.imul(a ^ ch.charCodeAt(0), 2654435761) + 1) >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function farbenAus(seed) {
  const r = zufallsGenerator(seed);
  return Array.from({ length: FARB_RUNDEN }, () => ({ h: Math.round(r() * 360), s: Math.round(25 + r() * 75), v: Math.round(30 + r() * 70) }));
}
const heute = () => new Date().toISOString().slice(0, 10);

// ---------- Spielablauf ----------
let fs = null;   // Farbspiel-Zustand
const farbStore = () => loadJson(FARB_KEY);

function farbenStart(opts = {}) {
  const stufe = opts.stufe || fs?.stufe || 'leicht';
  const seed = opts.seed || (opts.taeglich ? 'tag-' + heute() : String(Math.random()).slice(2));
  fs = { stufe, seed, taeglich: !!opts.taeglich, farben: farbenAus(seed + '|' + stufe), runde: 0, punkte: [], mixe: [], gegner: opts.gegner || null };
  farbPhase('zeigen');
}

function farbenIntro() {
  const st = farbStore();
  $('farbStufen').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.stufe === (fs?.stufe || 'leicht')));
  const best = st.best || {};
  $('farbBest').textContent = 'Bestwerte: ' + Object.entries(FARB_STUFEN).map(([k, v]) => v.name + ' ' + (best[k] != null ? fmt(best[k]) : '–')).join(' · ');
  const t = st.tag && st.tag[heute()];
  $('farbTagBtn').textContent = t != null ? '📅 Tagesfarben – heute: ' + fmt(t) + ' / 50' : '📅 Tagesfarben (heute für alle gleich)';
  farbBuehne(null);
  zeigeFarbTeil('intro');
}

function zeigeFarbTeil(teil) {
  ['intro', 'zeigen', 'mischen', 'aufloesung', 'ende'].forEach((t) => { $('farb-' + t).hidden = t !== teil; });
}
function farbBuehne(c) {
  const st = $('farbBuehne');
  st.style.background = c ? hsvText(c) : '';
  st.classList.toggle('hell', !!c && !helleSchrift(c));
}

let farbTimer = null;
function farbPhase(phase) {
  clearInterval(farbTimer);
  const ziel = fs.farben[fs.runde];
  $('farbRunde').textContent = 'Farbe ' + (fs.runde + 1) + ' / ' + FARB_RUNDEN;
  if (phase === 'zeigen') {
    zeigeFarbTeil('zeigen');
    farbBuehne(ziel);
    let rest = FARB_STUFEN[fs.stufe].sek;
    const zeig = () => { $('farbCountdown').textContent = rest >= 1 ? Math.ceil(rest) : fmt(Math.max(0, Math.round(rest * 10) / 10)); };
    zeig();
    $('farbCountdown').classList.remove('tick'); void $('farbCountdown').offsetWidth; $('farbCountdown').classList.add('tick');
    farbTimer = setInterval(() => {
      rest -= 0.1;
      zeig();
      if (rest <= 0.001) { clearInterval(farbTimer); farbPhase('mischen'); }
    }, 100);
  } else if (phase === 'mischen') {
    zeigeFarbTeil('mischen');
    farbBuehne(null);   // neutraler Hintergrund – sonst könnte man die Zielfarbe einfach abgleichen
    // Startwert der Regler: zufällig, damit man nicht einfach in der Mitte bleibt
    fs.mix = { h: Math.round(Math.random() * 360), s: 50, v: 50 };
    ['h', 's', 'v'].forEach((k) => { $('farbRegler-' + k).value = fs.mix[k]; });
    farbMischAktualisieren();
  } else if (phase === 'aufloesung') {
    const p = farbPunkte(ziel, fs.mix);
    fs.punkte.push(p); fs.mixe.push({ ...fs.mix });
    zeigeFarbTeil('aufloesung');
    farbBuehne(null);
    $('farbZiel').style.background = hsvText(ziel);
    $('farbDein').style.background = hsvText(fs.mix);
    $('farbZiel').classList.toggle('hell', !helleSchrift(ziel));
    $('farbDein').classList.toggle('hell', !helleSchrift(fs.mix));
    hochzaehlen($('farbPunkte'), p, ' / 10');
    $('farbKommentar').textContent = p >= 9.5 ? 'Volltreffer! 🎯' : p >= 8.5 ? 'Richtig nah dran 🔥' : p >= 7 ? 'Gut gemerkt 👍' : p >= 5 ? 'Na ja … 🤔' : 'Ganz woanders 🙈';
    if (navigator.vibrate) navigator.vibrate(p >= 8.5 ? [30, 40, 30] : 20);
    if (p >= 9.5) konfetti(24, ['🎨', '✨', '🎯', '🌈']);
    $('farbWeiter').textContent = fs.runde === FARB_RUNDEN - 1 ? 'Zum Ergebnis' : 'Nächste Farbe';
  }
}

function farbMischAktualisieren() {
  const m = fs.mix;
  $('farbVorschau').style.background = hsvText(m);
  $('farbVorschau').classList.toggle('hell', !helleSchrift(m));
  // Reglerspuren zeigen, was passiert, wenn man sie verschiebt
  const stops = (f) => Array.from({ length: 7 }, (_, i) => f(i / 6)).join(',');
  $('farbRegler-h').style.background = 'linear-gradient(90deg,' + stops((t) => hsvText({ h: t * 360, s: m.s, v: m.v })) + ')';
  $('farbRegler-s').style.background = 'linear-gradient(90deg,' + stops((t) => hsvText({ h: m.h, s: t * 100, v: m.v })) + ')';
  $('farbRegler-v').style.background = 'linear-gradient(90deg,' + stops((t) => hsvText({ h: m.h, s: m.s, v: t * 100 })) + ')';
}
['h', 's', 'v'].forEach((k) => $('farbRegler-' + k).addEventListener('input', (e) => { fs.mix[k] = Number(e.target.value); farbMischAktualisieren(); }));

function farbEnde() {
  const summe = Math.round(fs.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const st = farbStore();
  st.best = st.best || {};
  st.tag = st.tag || {};
  const neuerRekord = !fs.taeglich && (st.best[fs.stufe] == null || summe > st.best[fs.stufe]);
  if (!fs.taeglich) st.best[fs.stufe] = Math.max(st.best[fs.stufe] || 0, summe);
  if (fs.taeglich && st.tag[heute()] == null) st.tag[heute()] = summe;
  saveJson(FARB_KEY, st);

  zeigeFarbTeil('ende');
  hochzaehlen($('farbSumme'), summe, ' / 50');
  $('farbRekord').textContent = neuerRekord ? '🏆 Neuer Bestwert (' + FARB_STUFEN[fs.stufe].name + ')!' : fs.taeglich ? '📅 Tagesfarben vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('farbVergleich').hidden = !fs.gegner;
  if (fs.gegner) {
    const g = fs.gegner;
    $('farbVergleich').textContent = summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + fmt(g.punkte) + ')!'
      : summe < g.punkte ? g.name + ' war besser (' + fmt(g.punkte) + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  const liste = $('farbListe');
  liste.innerHTML = '';
  fs.farben.forEach((z, i) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="fz"></span><span class="fd"></span><b></b>';
    li.querySelector('.fz').style.background = hsvText(z);
    li.querySelector('.fd').style.background = hsvText(fs.mixe[i]);
    li.querySelector('b').textContent = fmt(fs.punkte[i]);
    liste.appendChild(li);
  });
  if (summe >= 40) setTimeout(() => konfetti(50, ['🎨', '🌈', '✨', '🏆']), 400);
}

const kaestchen = (p) => (p >= 9 ? '🟩' : p >= 7 ? '🟨' : p >= 5 ? '🟧' : '🟥');
async function farbTeilen() {
  const summe = Math.round(fs.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const store = loadJson(STORE_KEY);
  const name = store.name || 'Jemand';
  const url = location.origin + location.pathname + '?farben=' + encodeURIComponent(fs.seed) + '&stufe=' + fs.stufe
    + '&n=' + encodeURIComponent(name) + '&p=' + summe;
  const text = '🎨 Farb-Gedächtnis' + (fs.taeglich ? ' – Tagesfarben ' + new Date().toLocaleDateString('de-DE') : ' (' + FARB_STUFEN[fs.stufe].name + ')')
    + '\n' + fmt(summe) + ' / 50 ' + fs.punkte.map(kaestchen).join('') + '\nSchaffst du mehr mit denselben Farben?';
  if (navigator.share) {
    try { await navigator.share({ title: 'Farb-Gedächtnis', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('farbTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('farbTeilenMsg').textContent = url; }
}

// ---------- Knöpfe ----------
$('farbStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  fs = { ...(fs || {}), stufe: b.dataset.stufe };
  farbenIntro();
}));
let farbGegner = null;   // aus einem Challenge-Link
$('farbLos').addEventListener('click', () => {
  if (farbGegner) { const g = farbGegner; farbGegner = null; $('farbChallenge').hidden = true; farbenStart({ stufe: g.stufe, seed: g.seed, gegner: g }); }
  else farbenStart({ stufe: fs?.stufe || 'leicht' });
});
$('farbTagBtn').addEventListener('click', () => farbenStart({ stufe: 'mittel', taeglich: true }));
$('farbFertig').addEventListener('click', () => farbPhase('aufloesung'));
$('farbWeiter').addEventListener('click', () => {
  fs.runde++;
  if (fs.runde >= FARB_RUNDEN) farbEnde(); else farbPhase('zeigen');
});
$('farbNochmal').addEventListener('click', () => farbenStart({ stufe: fs.stufe, taeglich: false }));
$('farbTeilen').addEventListener('click', farbTeilen);
$('farbZurueck').addEventListener('click', () => { clearInterval(farbTimer); farbBuehne(null); zeigeHub(); });

// Challenge-Link: ?farben=<seed>&stufe=…&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('farben')) return;
  const stufe = FARB_STUFEN[q.get('stufe')] ? q.get('stufe') : 'leicht';
  const gegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('farben'), stufe };
  history.replaceState(null, '', location.pathname);
  show('farben', '🎨 Farb-Gedächtnis');
  fs = { stufe };
  farbenIntro();
  $('farbChallenge').hidden = false;
  $('farbChallenge').textContent = gegner.name + ' hat ' + fmt(gegner.punkte) + ' / 50 Punkte (' + FARB_STUFEN[stufe].name + '). Gleiche Farben – schaffst du mehr?';
  farbGegner = gegner;
})();
