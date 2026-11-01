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
function rgbZuHsv([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return { h: (h + 360) % 360, s: max ? (d / max) * 100 : 0, v: (max / 255) * 100 };
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

// ---------- Auswertung: wie weit lag man daneben? ----------
const hexText = ([r, g, b]) => '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
const FARBNAMEN = [[0, 'Rot'], [20, 'Orange'], [45, 'Gelb'], [75, 'Gelbgrün'], [105, 'Grün'], [160, 'Türkis'], [195, 'Hellblau'], [225, 'Blau'], [265, 'Violett'], [295, 'Magenta'], [330, 'Pink'], [350, 'Rot']];
const farbName = (h) => FARBNAMEN.reduce((n, [g, name]) => (h >= g ? name : n), 'Rot');

function farbAnalyse(ziel, mix) {
  const rz = hsvZuRgb(ziel.h, ziel.s, ziel.v), rm = hsvZuRgb(mix.h, mix.s, mix.v);
  let dh = mix.h - ziel.h;                    // kürzester Weg auf dem Farbkreis
  if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const ds = mix.s - ziel.s, dv = mix.v - ziel.v;
  const dE = deltaE2000(rgbZuLab(rz), rgbZuLab(rm));
  const tipps = [];
  const etwas = (x, grenze) => (Math.abs(x) < grenze ? 'etwas ' : '');
  if (Math.abs(dv) >= 6) tipps.push(etwas(dv, 15) + (dv < 0 ? 'zu dunkel' : 'zu hell'));
  if (Math.abs(ds) >= 8) tipps.push(etwas(ds, 20) + (ds < 0 ? 'zu blass' : 'zu kräftig'));
  // Der Farbton zählt nur, wenn die Farbe nicht fast grau ist
  if (Math.abs(dh) >= 8 && ziel.s >= 15) {
    const nz = farbName(ziel.h), nm = farbName(mix.h);
    tipps.push(nz !== nm ? 'Farbton zu sehr ' + nm + ' statt ' + nz : 'Farbton um ' + Math.abs(dh) + '° verschoben');
  }
  return { rz, rm, dh, ds, dv, dE, tipps, maxRgb: Math.max(...rz.map((x, i) => Math.abs(rm[i] - x))) };
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
// ---------- Farbtopf: mischen wie mit echter Farbe ----------
// Malfarben schlucken Licht: Gemischt wird über das gewichtete geometrische Mittel der Kanäle.
// So wird Rot + Gelb Orange, Gelb + Blau Grün, Weiß hellt auf, Schwarz dunkelt ab.
const PIGMENTE = [
  { id: 'rot', name: 'Rot', rgb: [200, 20, 35] },
  { id: 'gelb', name: 'Gelb', rgb: [250, 210, 20] },
  { id: 'blau', name: 'Blau', rgb: [20, 80, 180] },
  { id: 'weiss', name: 'Weiß', rgb: [250, 250, 250] },
  { id: 'schwarz', name: 'Schwarz', rgb: [25, 25, 30] },
];
function topfMischen(rezept) {
  const n = PIGMENTE.reduce((a, pg) => a + (rezept[pg.id] || 0), 0);
  if (!n) return null;
  return [0, 1, 2].map((k) => Math.round(Math.exp(PIGMENTE.reduce((a, pg) => a + (rezept[pg.id] || 0) * Math.log(Math.max(pg.rgb[k], 4)), 0) / n)));
}
const rezeptText = (rezept) => PIGMENTE.filter((pg) => rezept[pg.id]).map((pg) => rezept[pg.id] + '× ' + pg.name).join(' + ') || 'leer';
// Zufälliges Rezept: wenige Farben, wenige Tropfen (je Stufe etwas mehr)
function zufallsRezept(r, stufe, tropfen) {
  // nie mehr Farben als Tropfen – sonst gäbe es keine passende Mischung
  const anzahl = Math.min(tropfen || 9, { leicht: 2, mittel: 2 + Math.floor(r() * 2), profi: 3 }[stufe]);
  const max = { leicht: 3, mittel: 4, profi: 4 }[stufe];
  for (;;) {
    const ids = PIGMENTE.map((pg) => pg.id).sort(() => r() - 0.5).slice(0, anzahl);
    if (ids.every((id) => id === 'weiss' || id === 'schwarz')) continue;   // reines Grau ist langweilig
    const rezept = {};
    ids.forEach((id) => { rezept[id] = 1 + Math.floor(r() * max); });
    if (tropfen) {   // genau so viele Tropfen insgesamt (für „Mitte finden“)
      let summe = ids.reduce((a, id) => a + rezept[id], 0);
      while (summe > tropfen) { const id = ids.find((x) => rezept[x] > 1); if (!id) break; rezept[id]--; summe--; }
      while (summe < tropfen) { rezept[ids[Math.floor(r() * ids.length)]]++; summe++; }
      if (summe !== tropfen) continue;
    }
    return rezept;
  }
}

// Lab → RGB (für die Mitte zwischen zwei Farben, so wie das Auge sie sieht)
function labZuRgb([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const x = inv(fx) * 0.95047, y = inv(fy), z = inv(fz) * 1.08883;
  const R = x * 3.2406 - y * 1.5372 - z * 0.4986, G = -x * 0.9689 + y * 1.8758 + z * 0.0415, B = x * 0.0557 - y * 0.204 + z * 1.057;
  const gamma = (c) => (c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c);
  return [R, G, B].map((c) => Math.max(0, Math.min(255, Math.round(gamma(c) * 255))));
}
const mitteLab = (a, b) => { const la = rgbZuLab(hsvZuRgb(a.h, a.s, a.v)), lb = rgbZuLab(hsvZuRgb(b.h, b.s, b.v)); return rgbZuHsv(labZuRgb(la.map((x, i) => (x + lb[i]) / 2))); };

// Spielarten: 'merken' (Farbe merken) oder 'mitte' (Farbe genau zwischen zwei Farben)
const FARB_ARTEN = {
  merken: { name: 'Merken', text: 'Eine Farbe blitzt kurz auf. Dann mischst du sie aus dem Kopf nach. Fünf Farben, bis zu 50 Punkte.',
    stufen: { leicht: '5 Sek.', mittel: '3 Sek.', profi: '1,5 Sek.' } },
  mitte: { name: 'Mitte finden', text: 'Zwei Farben erscheinen. Misch die Farbe genau dazwischen – so, als würdest du beide zu gleichen Teilen zusammenkippen.',
    stufen: { leicht: 'Farben bleiben', mittel: '5 Sek. merken', profi: '2 Sek. merken' }, sek: { leicht: 3, mittel: 5, profi: 2 } },
};
const farbArt = () => (FARB_ARTEN[farbStore().art] ? farbStore().art : 'merken');

function farbenAus(seed, art = 'merken', werkzeug = 'rgb', stufe = 'leicht') {
  const r = zufallsGenerator(seed);
  const zufall = () => ({ h: Math.round(r() * 360), s: Math.round(25 + r() * 75), v: Math.round(30 + r() * 70) });
  const abstand = (a, b) => deltaE2000(rgbZuLab(hsvZuRgb(a.h, a.s, a.v)), rgbZuLab(hsvZuRgb(b.h, b.s, b.v)));
  return Array.from({ length: FARB_RUNDEN }, () => {
    if (werkzeug === 'topf') {
      if (art === 'mitte') {
        // beide Farben mit gleich vielen Tropfen – dann ist die Mitte genau beide Rezepte zusammen
        const t = 2 + Math.floor(r() * 2);
        for (;;) {
          const ra = zufallsRezept(r, stufe === 'profi' ? 'mittel' : 'leicht', t), rb = zufallsRezept(r, stufe === 'profi' ? 'mittel' : 'leicht', t);
          const a = rgbZuHsv(topfMischen(ra)), b = rgbZuHsv(topfMischen(rb));
          if (abstand(a, b) < 25) continue;
          const rezept = {};
          PIGMENTE.forEach((pg) => { if (ra[pg.id] || rb[pg.id]) rezept[pg.id] = (ra[pg.id] || 0) + (rb[pg.id] || 0); });
          return { ...rgbZuHsv(topfMischen(rezept)), rezept, a, b, ra, rb };
        }
      }
      const rezept = zufallsRezept(r, stufe);
      return { ...rgbZuHsv(topfMischen(rezept)), rezept };
    }
    if (art === 'mitte') {
      for (;;) {
        const a = zufall(), b = zufall();
        if (abstand(a, b) < 30) continue;
        return { ...mitteLab(a, b), a, b };
      }
    }
    return zufall();
  });
}
const heute = () => new Date().toISOString().slice(0, 10);

// ---------- Spielablauf ----------
let fs = null;   // Farbspiel-Zustand
const farbStore = () => loadJson(FARB_KEY);

function farbenStart(opts = {}) {
  const stufe = opts.stufe || fs?.stufe || 'leicht';
  const seed = opts.seed || (opts.taeglich ? 'tag-' + heute() : String(Math.random()).slice(2));
  const art = opts.art || farbArt(), werkzeug = opts.werkzeug || farbRegler();
  // Klassisch (Merken + Regler) bleiben die Farben wie bisher – so passen alte Challenge-Links
  const zusatz = art === 'merken' && werkzeug !== 'topf' ? '' : '|' + art + '|' + (werkzeug === 'topf' ? 'topf' : 'regler');
  fs = { stufe, seed, art, werkzeug, taeglich: !!opts.taeglich, farben: farbenAus(seed + '|' + stufe + zusatz, art, werkzeug, stufe), runde: 0, punkte: [], mixe: [], gegner: opts.gegner || null };
  farbPhase('zeigen');
}

function farbenIntro() {
  const st = farbStore();
  $('farbStufen').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.stufe === (fs?.stufe || 'leicht')));
  $('farbReglerWahl').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.regler === farbRegler()));
  const art = farbArt();
  $('farbArtWahl').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.art === art));
  $('farbIntroText').textContent = FARB_ARTEN[art].text;
  $('farbStufen').querySelectorAll('button').forEach((b) => { b.querySelector('small').textContent = FARB_ARTEN[art].stufen[b.dataset.stufe]; });
  const best = st.best || {};
  const bk = (k) => (art === 'mitte' ? 'mitte-' + k : k);
  $('farbBest').textContent = 'Bestwerte' + (art === 'mitte' ? ' (Mitte finden)' : '') + ': ' + Object.entries(FARB_STUFEN).map(([k, v]) => v.name + ' ' + (best[bk(k)] != null ? fmt(best[bk(k)]) : '–')).join(' · ');
  const t = st.tag && st.tag[(art === 'mitte' ? 'mitte:' : '') + heute()];
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
  const mitte = fs.art === 'mitte';
  if (phase === 'zeigen') {
    zeigeFarbTeil('zeigen');
    $('farbMerkText').textContent = mitte ? 'Gesucht: die Farbe genau dazwischen' : 'Merk dir diese Farbe';
    if (mitte) {
      const st = $('farbBuehne');
      st.style.background = 'linear-gradient(90deg, ' + hsvText(ziel.a) + ' 0 50%, ' + hsvText(ziel.b) + ' 50% 100%)';
      st.classList.toggle('hell', !helleSchrift(ziel.a) && !helleSchrift(ziel.b));
    } else farbBuehne(ziel);
    let rest = mitte ? FARB_ARTEN.mitte.sek[fs.stufe] : FARB_STUFEN[fs.stufe].sek;
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
    // Mitte finden (Leicht): beide Farben bleiben neben dem Topf sichtbar
    $('farbMitteLeiste').hidden = !(mitte && fs.stufe === 'leicht');
    if (mitte) { $('farbMitteA').style.background = hsvText(ziel.a); $('farbMitteB').style.background = hsvText(ziel.b); }
    const topf = fs.werkzeug === 'topf';
    const rgbModus = fs.werkzeug === 'rgb';
    $('farbReglerRgb').hidden = topf || !rgbModus;
    $('farbReglerHsb').hidden = topf || rgbModus;
    $('farbTopf').hidden = !topf;
    if (topf) {
      // Der Topf startet leer – jeder Tropfen zählt
      fs.rezept = {}; fs.verlauf = [];
      fs.mix = null;
      topfZeichnen();
    } else if (rgbModus) {
      $('farbVorschau').classList.remove('topf-leer'); $('farbVorschau').querySelector('span').textContent = 'Deine Farbe';
      fs.rgb = [0, 0, 0].map(() => Math.round(40 + Math.random() * 175));
      fs.mix = rgbZuHsv(fs.rgb);
      ['r', 'g', 'b'].forEach((k, i) => { $('farbRegler-' + k).value = fs.rgb[i]; });
    } else {
      $('farbVorschau').classList.remove('topf-leer'); $('farbVorschau').querySelector('span').textContent = 'Deine Farbe';
      fs.mix = { h: Math.round(Math.random() * 360), s: 50, v: 50 };
      ['h', 's', 'v'].forEach((k) => { $('farbRegler-' + k).value = fs.mix[k]; });
    }
    if (!topf) farbMischAktualisieren();
  } else if (phase === 'aufloesung') {
    const p = farbPunkte(ziel, fs.mix);
    fs.punkte.push(p); fs.mixe.push({ ...fs.mix, rezept: fs.rezept ? { ...fs.rezept } : null });
    zeigeFarbTeil('aufloesung');
    farbBuehne(null);
    $('farbZiel').style.background = hsvText(ziel);
    $('farbDein').style.background = hsvText(fs.mix);
    $('farbZiel').classList.toggle('hell', !helleSchrift(ziel));
    $('farbDein').classList.toggle('hell', !helleSchrift(fs.mix));
    zeigeAnalyse(farbAnalyse(ziel, fs.mix));
    // Mitte finden: beide Ausgangsfarben, die Mitte und deine Farbe
    $('farbMitteErg').hidden = !mitte;
    if (mitte) {
      $('farbMEa').style.background = hsvText(ziel.a); $('farbMEz').style.background = hsvText(ziel);
      $('farbMEd').style.background = hsvText(fs.mix); $('farbMEb').style.background = hsvText(ziel.b);
    }
    // Farbtopf: Rezept und ein konkreter Tipp, welcher Tropfen gefehlt hat
    $('farbRezept').hidden = fs.werkzeug !== 'topf';
    if (fs.werkzeug === 'topf') $('farbRezept').innerHTML = topfAuswertung(ziel);
    hochzaehlen($('farbPunkte'), p, ' / 10');
    $('farbKommentar').textContent = p >= 9.5 ? 'Volltreffer! 🎯' : p >= 8.5 ? 'Richtig nah dran 🔥' : p >= 7 ? 'Gut gemerkt 👍' : p >= 5 ? 'Na ja … 🤔' : 'Ganz woanders 🙈';
    if (navigator.vibrate) navigator.vibrate(p >= 8.5 ? [30, 40, 30] : 20);
    if (p >= 9.5) konfetti(24, ['🎨', '✨', '🎯', '🌈']);
    $('farbWeiter').textContent = fs.runde === FARB_RUNDEN - 1 ? 'Zum Ergebnis' : 'Nächste Farbe';
  }
}

const vz = (x, einheit = '') => (x > 0 ? '+' : x < 0 ? '−' : '±') + Math.abs(Math.round(x)) + einheit;
function zeigeAnalyse(a) {
  $('farbZielHex').textContent = hexText(a.rz);
  $('farbDeinHex').textContent = hexText(a.rm);
  $('farbTipp').textContent = a.tipps.length ? 'Deine Farbe war ' + a.tipps.join(' · ') + '.' : 'Fast perfekt getroffen – kaum ein Unterschied.';
  // RGB-Tabelle: Original, deine Farbe und die Differenz je Kanal
  const tab = $('farbRgb');
  tab.innerHTML = '<tr><th></th><th class="r">R</th><th class="g">G</th><th class="b">B</th><th>Hex</th></tr>';
  const zeile = (name, werte, hex, klasse = '') => {
    const tr = document.createElement('tr');
    tr.className = klasse;
    tr.innerHTML = '<th></th>' + werte.map(() => '<td></td>').join('') + '<td class="hex"></td>';
    tr.querySelector('th').textContent = name;
    werte.forEach((w, i) => {
      const td = tr.querySelectorAll('td')[i];
      td.textContent = w.text;
      if (w.klasse) td.className = w.klasse;
    });
    tr.querySelector('.hex').textContent = hex;
    tab.appendChild(tr);
  };
  zeile('Original', a.rz.map((x) => ({ text: x })), hexText(a.rz));
  zeile('Deine', a.rm.map((x) => ({ text: x })), hexText(a.rm));
  zeile('Differenz', a.rm.map((x, i) => {
    const d = x - a.rz[i];
    return { text: vz(d), klasse: Math.abs(d) <= 10 ? 'gut' : Math.abs(d) <= 35 ? 'mittel' : 'weit' };
  }), '', 'diff');
  // Abweichung in den drei Reglern, die man benutzt hat
  $('farbHsbBlock').hidden = fs.werkzeug !== 'hsb';
  const regler = [['Farbton', vz(a.dh, '°'), Math.abs(a.dh) <= 6], ['Sättigung', vz(a.ds, ' %'), Math.abs(a.ds) <= 6], ['Helligkeit', vz(a.dv, ' %'), Math.abs(a.dv) <= 6]];
  $('farbRegler').innerHTML = '';
  regler.forEach(([name, wert, gut]) => {
    const d = document.createElement('div');
    d.className = 'regler-chip' + (gut ? ' gut' : '');
    d.innerHTML = '<small></small><b></b>';
    d.querySelector('small').textContent = name;
    d.querySelector('b').textContent = wert;
    $('farbRegler').appendChild(d);
  });
  $('farbDeltaE').textContent = 'Farbabstand ΔE ' + fmt(Math.round(a.dE * 10) / 10)
    + ' – unter 1 sieht man keinen Unterschied, ab etwa 2–3 einen kleinen, über 10 einen deutlichen.';
}

// Welche Regler: 'rgb' (Rot, Grün, Blau) oder 'hsb' (Farbton, Sättigung, Helligkeit)
const farbRegler = () => farbStore().regler || 'rgb';

function farbMischAktualisieren() {
  const m = fs.mix;
  $('farbVorschau').style.background = hsvText(m);
  $('farbVorschau').classList.toggle('hell', !helleSchrift(m));
  if (fs.werkzeug === 'rgb') {
    const [r, g, b] = fs.rgb;
    $('farbRegler-r').style.background = `linear-gradient(90deg, rgb(0,${g},${b}), rgb(255,${g},${b}))`;
    $('farbRegler-g').style.background = `linear-gradient(90deg, rgb(${r},0,${b}), rgb(${r},255,${b}))`;
    $('farbRegler-b').style.background = `linear-gradient(90deg, rgb(${r},${g},0), rgb(${r},${g},255))`;
    $('farbWert-r').textContent = r; $('farbWert-g').textContent = g; $('farbWert-b').textContent = b;
    return;
  }
  // Reglerspuren zeigen, was passiert, wenn man sie verschiebt
  const stops = (f) => Array.from({ length: 7 }, (_, i) => f(i / 6)).join(',');
  $('farbRegler-h').style.background = 'linear-gradient(90deg,' + stops((t) => hsvText({ h: t * 360, s: m.s, v: m.v })) + ')';
  $('farbRegler-s').style.background = 'linear-gradient(90deg,' + stops((t) => hsvText({ h: m.h, s: t * 100, v: m.v })) + ')';
  $('farbRegler-v').style.background = 'linear-gradient(90deg,' + stops((t) => hsvText({ h: m.h, s: m.s, v: t * 100 })) + ')';
}
['h', 's', 'v'].forEach((k) => $('farbRegler-' + k).addEventListener('input', (e) => { fs.mix[k] = Number(e.target.value); farbMischAktualisieren(); }));
['r', 'g', 'b'].forEach((k, i) => $('farbRegler-' + k).addEventListener('input', (e) => {
  fs.rgb[i] = Number(e.target.value);
  fs.mix = rgbZuHsv(fs.rgb);
  farbMischAktualisieren();
}));
$('farbReglerWahl').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  const st = farbStore();
  st.regler = b.dataset.regler;
  saveJson(FARB_KEY, st);
  farbenIntro();
}));

function farbEnde() {
  const summe = Math.round(fs.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const st = farbStore();
  st.best = st.best || {};
  st.tag = st.tag || {};
  const bk = fs.art === 'mitte' ? 'mitte-' + fs.stufe : fs.stufe, tk = (fs.art === 'mitte' ? 'mitte:' : '') + heute();
  const neuerRekord = !fs.taeglich && (st.best[bk] == null || summe > st.best[bk]);
  if (!fs.taeglich) st.best[bk] = Math.max(st.best[bk] || 0, summe);
  if (fs.taeglich && st.tag[tk] == null) st.tag[tk] = summe;
  saveJson(FARB_KEY, st);

  zeigeFarbTeil('ende');
  hochzaehlen($('farbSumme'), summe, ' / 50');
  $('farbRekord').textContent = neuerRekord ? '🏆 Neuer Bestwert (' + (fs.art === 'mitte' ? 'Mitte finden, ' : '') + FARB_STUFEN[fs.stufe].name + ')!' : fs.taeglich ? '📅 Tagesfarben vom ' + new Date().toLocaleDateString('de-DE') : '';
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
    const an = farbAnalyse(z, fs.mixe[i]);
    li.innerHTML = '<span class="fz"></span><span class="fd"></span><b><span></span><small></small></b>';
    li.querySelector('.fz').style.background = hsvText(z);
    li.querySelector('.fd').style.background = hsvText(fs.mixe[i]);
    li.querySelector('b span').textContent = fmt(fs.punkte[i]);
    li.querySelector('b small').textContent = 'RGB ±' + an.maxRgb;
    li.title = an.tipps.join(', ');
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
    + '&n=' + encodeURIComponent(name) + '&p=' + summe + (fs.art === 'mitte' ? '&art=mitte' : '') + (fs.werkzeug === 'topf' ? '&w=topf' : '');
  const text = '🎨 Farb-Gedächtnis' + (fs.art === 'mitte' ? ' – Mitte finden' : '') + (fs.werkzeug === 'topf' ? ' 🪣 Farbtopf' : '') + (fs.taeglich ? ' – Tagesfarben ' + new Date().toLocaleDateString('de-DE') : ' (' + FARB_STUFEN[fs.stufe].name + ')')
    + '\n' + fmt(summe) + ' / 50 ' + fs.punkte.map(kaestchen).join('') + '\nSchaffst du mehr mit denselben Farben?';
  if (navigator.share) {
    try { await navigator.share({ title: 'Farb-Gedächtnis', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('farbTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('farbTeilenMsg').textContent = url; }
}

// ---------- Farbtopf: Bedienung ----------
function topfZeichnen() {
  const rgb = topfMischen(fs.rezept);
  fs.mix = rgb ? rgbZuHsv(rgb) : null;
  const v = $('farbVorschau');
  v.classList.toggle('topf-leer', !rgb);
  v.style.background = rgb ? rgbText(rgb) : '';
  v.classList.toggle('hell', !!rgb && !helleSchrift(fs.mix));
  v.querySelector('span').textContent = rgb ? 'Dein Farbtopf' : 'Dein Farbtopf ist noch leer';
  $('farbTopfHinweis').textContent = rgb ? rezeptText(fs.rezept) : 'Tippe auf eine Farbe, um einen Tropfen dazuzugeben.';
  $('farbTuben').querySelectorAll('.tube').forEach((t) => {
    const n = fs.rezept[t.dataset.id] || 0;
    t.querySelector('.tube-zahl').textContent = n || '';
    t.classList.toggle('drin', n > 0);
  });
  $('topfRueck').disabled = !fs.verlauf.length;
  $('topfLeer').disabled = !rgb;
}
function topfTropfen(id, knopf) {
  const summe = Object.values(fs.rezept).reduce((a, b) => a + b, 0);
  if (summe >= 30) return;
  fs.verlauf.push({ ...fs.rezept });
  fs.rezept[id] = (fs.rezept[id] || 0) + 1;
  topfZeichnen();
  // ein Tropfen fällt in den Topf
  const pg = PIGMENTE.find((x) => x.id === id);
  const t = document.createElement('i');
  t.className = 'topf-tropfen';
  t.style.background = rgbText(pg.rgb);
  const v = $('farbVorschau').getBoundingClientRect(), k = knopf.getBoundingClientRect();
  t.style.left = (k.left + k.width / 2 - v.left - 9) + 'px';
  $('farbVorschau').appendChild(t);
  t.animate([{ transform: 'translate(0, ' + (k.top - v.top) + 'px) scale(.6)', opacity: 1 }, { transform: 'translate(' + (v.width / 2 - (k.left + k.width / 2 - v.left)) + 'px, ' + (v.height * 0.55) + 'px) scale(1.1)', opacity: 0 }],
    { duration: 420, easing: 'cubic-bezier(.5,0,.8,.4)' }).onfinish = () => t.remove();
  if (navigator.vibrate) navigator.vibrate(8);
}
PIGMENTE.forEach((pg) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'tube';
  b.dataset.id = pg.id;
  b.innerHTML = '<span class="tube-klecks"></span><span class="tube-name"></span><span class="tube-zahl"></span>';
  b.querySelector('.tube-klecks').style.background = rgbText(pg.rgb);
  b.querySelector('.tube-name').textContent = pg.name;
  b.addEventListener('click', () => topfTropfen(pg.id, b));
  $('farbTuben').appendChild(b);
});
$('topfRueck').addEventListener('click', () => { if (fs.verlauf.length) { fs.rezept = fs.verlauf.pop(); topfZeichnen(); } });
$('topfLeer').addEventListener('click', () => { fs.verlauf.push({ ...fs.rezept }); fs.rezept = {}; topfZeichnen(); });

// Auswertung im Farbtopf: Rezepte vergleichen und den einen Tropfen finden, der am meisten geholfen hätte
function topfAuswertung(ziel) {
  const zLab = rgbZuLab(hsvZuRgb(ziel.h, ziel.s, ziel.v));
  const abst = (rez) => { const rgb = topfMischen(rez); return rgb ? deltaE2000(zLab, rgbZuLab(rgb)) : 999; };
  const jetzt = abst(fs.rezept);
  let bester = null;
  PIGMENTE.forEach((pg) => {
    const mehr = { ...fs.rezept, [pg.id]: (fs.rezept[pg.id] || 0) + 1 };
    const d1 = abst(mehr);
    if (d1 < jetzt - 1 && (!bester || d1 < bester.d)) bester = { d: d1, text: 'Ein Tropfen ' + pg.name + ' mehr hätte geholfen.' };
    if (fs.rezept[pg.id]) {
      const weniger = { ...fs.rezept, [pg.id]: fs.rezept[pg.id] - 1 };
      const d2 = abst(weniger);
      if (d2 < jetzt - 1 && (!bester || d2 < bester.d)) bester = { d: d2, text: 'Ein Tropfen ' + pg.name + ' weniger hätte geholfen.' };
    }
  });
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return '<div><b>Original:</b> ' + esc(rezeptText(ziel.rezept)) + (fs.art === 'mitte' ? ' <small>(' + esc(rezeptText(ziel.ra)) + ' und ' + esc(rezeptText(ziel.rb)) + ')</small>' : '') + '</div>'
    + '<div><b>Deine:</b> ' + esc(rezeptText(fs.rezept)) + '</div>'
    + '<div class="rezept-tipp">' + (jetzt < 2 ? '🎯 Genau getroffen!' : bester ? '💡 ' + bester.text : '💡 Probier ein anderes Verhältnis der Farben.') + '</div>';
}

// ---------- Knöpfe ----------
$('farbStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  fs = { ...(fs || {}), stufe: b.dataset.stufe };
  farbenIntro();
}));
let farbGegner = null;   // aus einem Challenge-Link
$('farbLos').addEventListener('click', () => {
  if (farbGegner) { const g = farbGegner; farbGegner = null; $('farbChallenge').hidden = true; farbenStart({ stufe: g.stufe, seed: g.seed, gegner: g, art: g.art, werkzeug: g.werkzeug }); }
  else farbenStart({ stufe: fs?.stufe || 'leicht' });
});
$('farbTagBtn').addEventListener('click', () => farbenStart({ stufe: 'mittel', taeglich: true, seed: 'tag-' + heute() + (farbArt() === 'mitte' ? '-mitte' : '') }));
$('farbFertig').addEventListener('click', () => {
  if (!fs.mix) { $('farbTopfHinweis').classList.remove('shake'); void $('farbTopfHinweis').offsetWidth; $('farbTopfHinweis').classList.add('shake'); return; }
  farbPhase('aufloesung');
});
$('farbArtWahl').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  const st = farbStore(); st.art = b.dataset.art; saveJson(FARB_KEY, st);
  farbenIntro();
}));
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
  const gegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('farben'), stufe,
    art: q.get('art') === 'mitte' ? 'mitte' : 'merken', werkzeug: q.get('w') === 'topf' ? 'topf' : undefined };
  history.replaceState(null, '', location.pathname);
  show('farben', '🎨 Farb-Gedächtnis');
  fs = { stufe };
  farbenIntro();
  $('farbChallenge').hidden = false;
  $('farbChallenge').textContent = gegner.name + ' hat ' + fmt(gegner.punkte) + ' / 50 Punkte (' + FARB_STUFEN[stufe].name + '). Gleiche Farben – schaffst du mehr?';
  farbGegner = gegner;
})();
