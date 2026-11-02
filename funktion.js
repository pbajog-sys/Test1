// 📉 Funktions-Detektiv: Kurven lesen wie ein Profi.
// Drei Spielarten mit je fünf Runden (bis 50 Punkte):
//   Formel finden – eine Kurve sehen, die passende Gleichung wählen,
//   Graph finden  – eine Gleichung sehen, die passende Kurve wählen,
//   Nachbauen     – die gestrichelte Kurve mit Reglern genau nachstellen.
// Jede Auflösung zeigt Schritt für Schritt, wie man die Zahlen am Bild abliest (Achsenabschnitt, Steigungsdreieck, Scheitel …).
const FD_KEY = 'walquiz.funktion.v1';
const FD_RUNDEN = 5;
const FD_MODI = {
  formel: { name: 'Formel finden', emoji: '🔍', lead: 'Eine Kurve erscheint. Welche Gleichung gehört dazu? Vier Verdächtige – nur einer ist es.' },
  graph: { name: 'Graph finden', emoji: '🖼️', lead: 'Eine Gleichung erscheint. Welche der vier Kurven passt dazu?' },
  bauen: { name: 'Nachbauen', emoji: '🎛️', lead: 'Stell mit den Reglern die gestrichelte Kurve genau nach. Je näher, desto mehr Punkte.' },
};
const FD_STUFEN = {
  leicht: { name: 'Leicht', familien: ['gerade', 'gerade', 'parabelEinfach'], text: 'Geraden und einfache Parabeln' },
  mittel: { name: 'Mittel', familien: ['gerade', 'parabel', 'parabel', 'betrag'], text: 'Parabeln verschoben, Knicke' },
  profi: { name: 'Profi', familien: ['parabel', 'betrag', 'sinus', 'expo', 'wurzel', 'gerade'], text: 'Wellen, Wachstum, Wurzeln' },
};

// ---------- Funktionen ----------
const FD_FAMILIEN = {
  gerade: { name: 'Gerade', form: 'y = m·x + b', f: (p, x) => p.m * x + p.b,
    regler: { m: [-4, 4, 0.5], b: [-5, 5, 0.5] }, start: { m: 1, b: 0 } },
  parabel: { name: 'Parabel', form: 'y = a·(x − d)² + e', f: (p, x) => p.a * (x - p.d) ** 2 + p.e,
    regler: { a: [-3, 3, 0.25], d: [-5, 5, 0.5], e: [-5, 5, 0.5] }, start: { a: 1, d: 0, e: 0 } },
  betrag: { name: 'Betrag (Knick)', form: 'y = a·|x − d| + e', f: (p, x) => p.a * Math.abs(x - p.d) + p.e,
    regler: { a: [-3, 3, 0.25], d: [-5, 5, 0.5], e: [-5, 5, 0.5] }, start: { a: 1, d: 0, e: 0 } },
  sinus: { name: 'Sinus-Welle', form: 'y = a·sin(b·x) + e', f: (p, x) => p.a * Math.sin(p.b * x) + p.e,
    regler: { a: [0.5, 4, 0.5], b: [0.25, 3, 0.25], e: [-4, 4, 0.5] }, start: { a: 1, b: 1, e: 0 } },
  expo: { name: 'Exponential', form: 'y = a·2ˣ + e', f: (p, x) => p.a * 2 ** x + p.e,
    regler: { a: [-2, 2, 0.25], e: [-5, 5, 0.5] }, start: { a: 1, e: 0 } },
  wurzel: { name: 'Wurzel', form: 'y = a·√(x − d) + e', f: (p, x) => (x < p.d - 1e-9 ? NaN : p.a * Math.sqrt(Math.max(0, x - p.d)) + p.e),
    regler: { a: [-3, 3, 0.5], d: [-5, 5, 0.5], e: [-5, 5, 0.5] }, start: { a: 1, d: 0, e: 0 } },
};
const fdWert = (fn, x) => FD_FAMILIEN[fn.fam].f(fn.p, x);

// Zahlen schön: Komma, echtes Minus
const fdZahl = (v) => (v < 0 ? '−' : '') + String(Math.round(Math.abs(v) * 100) / 100).replace('.', ',');
const fdKoeff = (a, s) => (a === 1 ? s : a === -1 ? '−' + s : fdZahl(a) + s);
const fdPlus = (e) => (e === 0 ? '' : e > 0 ? ' + ' + fdZahl(e) : ' − ' + fdZahl(-e));
const fdInnen = (d) => (d === 0 ? 'x' : d > 0 ? 'x − ' + fdZahl(d) : 'x + ' + fdZahl(-d));
function fdFormel(fn) {
  const p = fn.p;
  let r;
  switch (fn.fam) {
    case 'gerade': r = p.m === 0 ? fdZahl(p.b) : fdKoeff(p.m, 'x') + fdPlus(p.b); break;
    case 'parabel': r = p.a === 0 ? fdZahl(p.e) : (p.d === 0 ? fdKoeff(p.a, 'x²') : fdKoeff(p.a, '(' + fdInnen(p.d) + ')²')) + fdPlus(p.e); break;
    case 'betrag': r = p.a === 0 ? fdZahl(p.e) : fdKoeff(p.a, '|' + fdInnen(p.d) + '|') + fdPlus(p.e); break;
    case 'sinus': r = fdKoeff(p.a, 'sin(' + (p.b === 1 ? 'x' : fdZahl(p.b) + 'x') + ')') + fdPlus(p.e); break;
    case 'expo': r = p.a === 0 ? fdZahl(p.e) : (p.a === 1 ? '2ˣ' : p.a === -1 ? '−2ˣ' : fdZahl(p.a) + '·2ˣ') + fdPlus(p.e); break;
    case 'wurzel': r = p.a === 0 ? fdZahl(p.e) : fdKoeff(p.a, p.d === 0 ? '√x' : '√(' + fdInnen(p.d) + ')') + fdPlus(p.e); break;
  }
  return 'y = ' + r;
}

// Mittlerer Abstand zweier Kurven im Bereich −5 … 5 (für Nachbauen und um zu ähnliche Verdächtige auszusortieren)
function fdAbstand(f1, f2) {
  let s = 0, n = 0;
  for (let x = -5; x <= 5.001; x += 0.1) {
    const a = fdWert(f1, x), b = fdWert(f2, x);
    if (Number.isNaN(a) && Number.isNaN(b)) continue;
    n++;
    s += Number.isNaN(a) || Number.isNaN(b) ? 3 : Math.min(Math.abs(a - b), 6);
  }
  return n ? s / n : 0;
}

// Zufällige, gut ablesbare Funktion einer Familie
function fdZiehen(rng, fam) {
  const w = (l) => l[Math.floor(rng() * l.length)];
  const ganz = (a, b) => a + Math.floor(rng() * (b - a + 1));
  switch (fam) {
    case 'gerade': return { fam, p: { m: w([-3, -2, -1, -0.5, 0.5, 1, 2, 3]), b: ganz(-4, 4) } };
    case 'parabelEinfach': return rng() < 0.5 ? { fam: 'parabel', p: { a: w([1, -1]), d: 0, e: ganz(-3, 3) } } : { fam: 'parabel', p: { a: w([1, -1]), d: w([-3, -2, -1, 1, 2, 3]), e: 0 } };
    case 'parabel': return { fam, p: { a: w([-2, -1, -0.5, 0.5, 1, 2]), d: w([-3, -2, -1, 1, 2, 3]), e: ganz(-3, 3) } };
    case 'betrag': return { fam, p: { a: w([-2, -1, -0.5, 0.5, 1, 2]), d: ganz(-3, 3), e: ganz(-3, 3) } };
    case 'sinus': return { fam, p: { a: w([1, 2, 3]), b: w([0.5, 1, 2]), e: w([-1, 0, 0, 1]) } };
    case 'expo': return { fam, p: { a: w([1, -1, 0.5, 2]), e: ganz(-3, 2) } };
    case 'wurzel': return { fam, p: { a: w([1, 2, -1, -2]), d: ganz(-4, 1), e: ganz(-2, 2) } };
  }
}

// Verdächtige: typische Verwechslungen (Vorzeichen, Verschiebung in die falsche Richtung, Kehrwert der Steigung …)
function fdVerdaechtige(rng, ziel) {
  const p = ziel.p, v = [];
  const mit = (aend) => ({ fam: ziel.fam, p: { ...p, ...aend } });
  if ('m' in p) v.push(mit({ m: -p.m }), mit({ b: -p.b }), mit({ m: Math.abs(p.m) !== 1 ? Math.sign(p.m) / Math.abs(p.m) * 1 : p.m * 2 }), mit({ m: -p.m, b: -p.b }), mit({ b: p.b + (rng() < 0.5 ? 1 : -1) }));
  if ('a' in p) v.push(mit({ a: -p.a }), mit({ e: -p.e }), mit({ a: p.a * 2 }), mit({ a: p.a / 2 }));
  if ('d' in p) v.push(mit({ d: -p.d }), mit({ d: -p.d, e: p.e }), mit({ d: p.e, e: p.d }));
  if ('b' in p && ziel.fam === 'sinus') v.push(mit({ b: p.b === 1 ? 2 : 1 }), mit({ b: p.b * 2 }));
  if (ziel.fam === 'expo') v.push(mit({ e: p.e + 1 }));
  for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [v[i], v[j]] = [v[j], v[i]]; }
  const gewaehlt = [ziel];
  const passt = (k) => gewaehlt.every((g) => fdFormel(g) !== fdFormel(k) && fdAbstand(g, k) > 0.35);
  v.forEach((k) => { if (gewaehlt.length < 4 && passt(k)) gewaehlt.push(k); });
  let sicher = 0;
  while (gewaehlt.length < 4 && sicher++ < 60) { const k = fdZiehen(rng, ziel.fam === 'parabel' ? 'parabel' : ziel.fam); if (passt(k)) gewaehlt.push(k); }
  const rest = gewaehlt.slice(1);
  const alle = [ziel, ...rest];
  for (let i = alle.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [alle[i], alle[j]] = [alle[j], alle[i]]; }
  return alle;
}

function fdRunden(seed, modus, stufe) {
  const rng = zufallsGenerator(seed + '|' + modus + '|' + stufe);
  const S = FD_STUFEN[stufe];
  const arten = modus === 'mix' ? ['formel', 'graph', 'bauen', 'formel', 'bauen'] : Array(FD_RUNDEN).fill(modus);
  const fam = S.familien.slice();
  let zuletzt = null;
  return arten.map((art) => {
    let ziel, sicher = 0;
    do { ziel = fdZiehen(rng, fam[Math.floor(rng() * fam.length)]); } while (zuletzt && fdFormel(ziel) === fdFormel(zuletzt) && sicher++ < 10);
    zuletzt = ziel;
    return { art, ziel, wahl: art === 'bauen' ? null : fdVerdaechtige(rng, ziel) };
  });
}

// ---------- Zeichnen ----------
// Koordinatensystem −6 … 6 auf Tafel. kurven: [{fn, cls}], marken: zusätzliche SVG-Schnipsel in Koordinaten (über fdX/fdY)
const FD_G = 300, FD_E = FD_G / 13;
const fdX = (x) => FD_G / 2 + x * FD_E, fdY = (y) => FD_G / 2 - y * FD_E;
function fdPfad(fn) {
  let d = '', offen = false;
  for (let i = 0; i <= 520; i++) {
    const x = -6.6 + i * 13.2 / 520, y = fdWert(fn, x);
    if (Number.isNaN(y)) { offen = false; continue; }
    const yy = Math.max(-40, Math.min(40, y));
    d += (offen ? 'L' : 'M') + fdX(x).toFixed(1) + ' ' + fdY(yy).toFixed(1);
    offen = Math.abs(y) < 40;
  }
  return d;
}
function fdSvg(kurven, opt = {}) {
  let gitter = '';
  for (let k = -6; k <= 6; k++) {
    if (!k) continue;
    gitter += '<path d="M' + fdX(k) + ' 0V' + FD_G + 'M0 ' + fdY(k) + 'H' + FD_G + '"/>';
  }
  let zahlen = '';
  if (!opt.ohneZahlen) for (let k = -6; k <= 6; k++) {
    if (!k || k % 2) continue;
    zahlen += '<text x="' + fdX(k) + '" y="' + (fdY(0) + 15) + '">' + fdZahl(k) + '</text><text x="' + (fdX(0) - 7) + '" y="' + (fdY(k) + 4) + '" text-anchor="end">' + fdZahl(k) + '</text>';
  }
  const linien = kurven.map((k) => '<path class="fd-kurve ' + (k.cls || '') + '" d="' + fdPfad(k.fn) + '"/>').join('');
  return '<svg class="fd-svg" viewBox="0 0 ' + FD_G + ' ' + FD_G + '"><rect class="fd-tafel" width="' + FD_G + '" height="' + FD_G + '" rx="12"/>'
    + '<g class="fd-gitter">' + gitter + '</g><path class="fd-achse" d="M0 ' + fdY(0) + 'H' + (FD_G - 4) + 'M' + fdX(0) + ' ' + FD_G + 'V4"/>'
    + '<path class="fd-pfeil" d="M' + (FD_G - 10) + ' ' + (fdY(0) - 5) + 'L' + (FD_G - 3) + ' ' + fdY(0) + 'L' + (FD_G - 10) + ' ' + (fdY(0) + 5) + 'M' + (fdX(0) - 5) + ' 11L' + fdX(0) + ' 3L' + (fdX(0) + 5) + ' 11"/>'
    + '<g class="fd-zahlen">' + zahlen + '</g>' + (opt.unten || '') + linien + (opt.marken || '') + '</svg>';
}
// Marken: Punkt mit Beschriftung, Steigungsdreieck, waagrechte Hilfslinie
const fdPunkt = (x, y, text, oben = true) => '<circle class="fd-punkt" cx="' + fdX(x) + '" cy="' + fdY(y) + '" r="6"/>'
  + (text ? '<text class="fd-label" x="' + (fdX(x) > 120 ? fdX(x) - 9 : fdX(x) + 9) + '" y="' + (fdY(y) + (oben ? -9 : 18)) + '" text-anchor="' + (fdX(x) > 120 ? 'end' : 'start') + '">' + text + '</text>' : '');
function fdDreieck(x0, y0, dx, dy) {
  const a = [fdX(x0), fdY(y0)], b = [fdX(x0 + dx), fdY(y0)], c = [fdX(x0 + dx), fdY(y0 + dy)];
  return '<path class="fd-dreieck" d="M' + a.join(' ') + 'L' + b.join(' ') + 'L' + c.join(' ') + '"/>'
    + '<text class="fd-label klein" x="' + ((a[0] + b[0]) / 2) + '" y="' + (b[1] + (dy > 0 ? 15 : -7)) + '" text-anchor="middle">' + fdZahl(dx) + ' →</text>'
    + '<text class="fd-label klein" x="' + (b[0] + 6) + '" y="' + ((b[1] + c[1]) / 2 + 4) + '">' + (dy > 0 ? '↑ ' : '↓ ') + fdZahl(Math.abs(dy)) + '</text>';
}
const fdWaagrecht = (y, text) => '<path class="fd-hilfslinie" d="M0 ' + fdY(y) + 'H' + FD_G + '"/>' + (text ? '<text class="fd-label klein" x="8" y="' + (fdY(y) - 6) + '">' + text + '</text>' : '');

// Ablese-Hilfen und Erklärung je Familie: { marken, schritte[] }
function fdErklaerung(fn) {
  const p = fn.p, Z = fdZahl;
  switch (fn.fam) {
    case 'gerade': {
      const dx = Math.abs(p.m) < 1 ? 2 : 1;
      return { marken: fdPunkt(0, p.b, 'b = ' + Z(p.b), p.m < 0) + fdDreieck(0, p.b, dx, p.m * dx),
        schritte: ['<b>Form:</b> eine gerade Linie → <code>y = m·x + b</code>.',
          '<b>b ablesen:</b> Die Linie schneidet die y-Achse bei <b>' + Z(p.b) + '</b>, also b = ' + Z(p.b) + '.',
          '<b>m ablesen (Steigungsdreieck):</b> ' + Z(dx) + ' nach rechts → ' + Z(Math.abs(p.m * dx)) + (p.m > 0 ? ' nach oben' : ' nach unten')
            + (dx === 2 ? ', also pro Schritt ' + Z(p.m) : '') + ' → m = <b>' + Z(p.m) + '</b>.' + (p.m < 0 ? ' Fällt die Linie, ist m negativ.' : '')] };
    }
    case 'parabel': {
      const offen = p.a > 0 ? 'nach oben' : 'nach unten';
      return { marken: fdPunkt(p.d, p.e, 'S(' + Z(p.d) + '|' + Z(p.e) + ')', p.a < 0) + fdDreieck(p.d, p.e, 1, p.a),
        schritte: ['<b>Form:</b> ein U → Parabel <code>y = a·(x − d)² + e</code>. Sie ist ' + offen + ' geöffnet, also ist a ' + (p.a > 0 ? 'positiv' : 'negativ') + '.',
          '<b>Scheitel ablesen:</b> Der tiefste/höchste Punkt liegt bei S(' + Z(p.d) + '|' + Z(p.e) + '). '
            + (p.d === 0 ? 'Keine Verschiebung nach links/rechts, also einfach x².' : 'Achtung Vorzeichen: Scheitel bei x = ' + Z(p.d) + ' heißt <b>(' + fdInnen(p.d) + ')</b>.')
            + (p.e ? ' Die Höhe ' + Z(p.e) + ' kommt hinten als ' + fdPlus(p.e).trim() + ' dazu.' : ''),
          '<b>a ablesen:</b> Vom Scheitel 1 nach rechts geht die Kurve ' + Z(Math.abs(p.a)) + (p.a > 0 ? ' nach oben' : ' nach unten') + ' → a = <b>' + Z(p.a) + '</b>.'
            + (Math.abs(p.a) < 1 ? ' |a| kleiner als 1 macht die Parabel breiter.' : Math.abs(p.a) > 1 ? ' |a| größer als 1 macht sie schmaler.' : '')] };
    }
    case 'betrag':
      return { marken: fdPunkt(p.d, p.e, 'Knick (' + Z(p.d) + '|' + Z(p.e) + ')', p.a < 0) + fdDreieck(p.d, p.e, 1, p.a),
        schritte: ['<b>Form:</b> ein spitzes V → Betragsfunktion <code>y = a·|x − d| + e</code>.',
          '<b>Knick ablesen:</b> Die Spitze liegt bei (' + Z(p.d) + '|' + Z(p.e) + '). Wie beim Scheitel: x = ' + Z(p.d) + ' wird zu <b>|' + fdInnen(p.d) + '|</b>' + (p.e ? ', und ' + fdPlus(p.e).trim() + ' hinten.' : '.'),
          '<b>a ablesen:</b> Vom Knick 1 nach rechts → ' + Z(Math.abs(p.a)) + (p.a > 0 ? ' nach oben' : ' nach unten') + ' → a = <b>' + Z(p.a) + '</b>. Jeder Arm ist eine Gerade mit Steigung ±a.'] };
    case 'sinus': {
      const periode = 2 * Math.PI / p.b, xMax = Math.PI / 2 / p.b;
      return { marken: fdWaagrecht(p.e, 'Mitte y = ' + Z(p.e)) + fdPunkt(xMax, p.e + p.a, 'Berg ' + Z(p.e + p.a)),
        schritte: ['<b>Form:</b> eine Welle → <code>y = a·sin(b·x) + e</code>.',
          '<b>e und a ablesen:</b> Die Welle schwingt um die Mittellinie y = ' + Z(p.e) + ' (das ist e) und geht ' + Z(p.a) + ' nach oben und unten (das ist a).',
          '<b>b ablesen:</b> Eine ganze Welle ist ' + Z(Math.round(periode * 10) / 10) + ' Kästchen lang. Normal (b = 1) wären es 2π ≈ 6,3. '
            + (p.b === 1 ? 'Passt, also b = 1.' : p.b > 1 ? 'Sie ist ' + Z(p.b) + '-mal so schnell → b = <b>' + Z(p.b) + '</b>.' : 'Sie ist doppelt so lang, also halb so schnell → b = <b>' + Z(p.b) + '</b>.')] };
    }
    case 'expo':
      return { marken: fdWaagrecht(p.e, 'Grenze y = ' + Z(p.e)) + fdPunkt(0, p.a + p.e, Z(p.a + p.e), p.a < 0) + fdPunkt(1, 2 * p.a + p.e, '', true),
        schritte: ['<b>Form:</b> links fast flach, rechts immer steiler → Exponentialfunktion <code>y = a·2ˣ + e</code>.',
          '<b>e ablesen:</b> Nach links nähert sich die Kurve der Linie y = <b>' + Z(p.e) + '</b>, berührt sie aber nie.',
          '<b>a ablesen:</b> Bei x = 0 ist 2⁰ = 1, die Kurve ist dort bei ' + Z(p.a + p.e) + '. Abstand zur Grenzlinie: ' + Z(p.a) + ' → a = <b>' + Z(p.a) + '</b>. '
            + 'Jeder Schritt nach rechts verdoppelt diesen Abstand' + (p.a < 0 ? ' (nach unten, weil a negativ ist).' : '.')] };
    case 'wurzel':
      return { marken: fdPunkt(p.d, p.e, 'Start (' + Z(p.d) + '|' + Z(p.e) + ')', p.a < 0) + fdPunkt(p.d + 1, p.e + p.a, '', p.a > 0) + fdPunkt(p.d + 4, p.e + 2 * p.a, '', p.a > 0),
        schritte: ['<b>Form:</b> beginnt an einem Punkt und wird immer flacher → Wurzelfunktion <code>y = a·√(x − d) + e</code>.',
          '<b>Startpunkt ablesen:</b> (' + Z(p.d) + '|' + Z(p.e) + ') → ' + (p.d === 0 ? '√x' : '√(' + fdInnen(p.d) + ')') + (p.e ? ' und ' + fdPlus(p.e).trim() : '') + '.',
          '<b>a ablesen:</b> √1 = 1 und √4 = 2: 1 nach rechts → ' + Z(Math.abs(p.a)) + ', 4 nach rechts → ' + Z(Math.abs(2 * p.a)) + (p.a > 0 ? ' nach oben' : ' nach unten') + ' → a = <b>' + Z(p.a) + '</b>.'] };
  }
  return { marken: '', schritte: [] };
}

// ---------- Spielablauf ----------
let fd = null;
let fdModus = 'formel', fdStufe = 'leicht', fdGegner = null;
const fdStore = () => loadJson(FD_KEY);
const fdTeile = ['intro', 'spiel', 'aufloesung', 'ende', 'lernen'];
const zeigeFdTeil = (t) => fdTeile.forEach((x) => { $('fd-' + x).hidden = x !== t; });

function funktionIntro() {
  const st = fdStore(), best = (st.best || {})[fdModus] || {};
  $('fdModi').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.modus === fdModus));
  $('fdLead').textContent = FD_MODI[fdModus].lead;
  $('fdStufen').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.stufe === fdStufe);
    b.querySelector('small').textContent = FD_STUFEN[b.dataset.stufe].text;
  });
  $('fdBest').textContent = 'Bestwerte ' + FD_MODI[fdModus].name + ': '
    + Object.entries(FD_STUFEN).map(([k, v]) => v.name + ' ' + (best[k] != null ? fmt(best[k]) : '–')).join(' · ');
  const t = st.tag && st.tag[heute()];
  $('fdTagBtn').textContent = t != null ? '📅 Tages-Fall – heute: ' + fmt(t) + ' / 50' : '📅 Tages-Fall (heute für alle gleich)';
  $('fdRunde').textContent = '';
  fdl = null;
  zeigeFdTeil('intro');
}

function funktionStart(opts = {}) {
  const modus = opts.taeglich ? 'mix' : opts.modus || fdModus;
  const stufe = opts.taeglich ? 'mittel' : opts.stufe || fdStufe;
  const seed = opts.seed || (opts.taeglich ? 'fd-' + heute() : String(Math.random()).slice(2));
  fd = { modus, stufe, seed, taeglich: !!opts.taeglich, runden: fdRunden(seed, modus, stufe), i: 0, punkte: [], antworten: [], gegner: opts.gegner || null };
  fdl = null;
  fdRundeZeigen();
}

function fdRundeZeigen() {
  const rd = fd.runden[fd.i];
  $('fdRunde').textContent = FD_MODI[rd.art].emoji + ' ' + FD_MODI[rd.art].name + ' · ' + (fd.i + 1) + ' / ' + FD_RUNDEN;
  zeigeFdTeil('spiel');
  if (rd.art === 'formel') fdFormelRunde(rd);
  else if (rd.art === 'graph') fdGraphRunde(rd);
  else fdBauenRunde(rd);
}

function fdFormelRunde(rd) {
  $('fdFrage').textContent = 'Welche Gleichung gehört zu dieser Kurve?';
  $('fdBild').innerHTML = '<div class="fd-gross">' + fdSvg([{ fn: rd.ziel, cls: 'ziel zeichnen' }]) + '</div>';
  $('fdAktion').innerHTML = '<div class="fd-wahl">' + rd.wahl.map((k, i) => '<button class="fd-formel-btn" type="button" data-i="' + i + '">' + fdFormel(k) + '</button>').join('') + '</div>';
  $('fdAktion').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => fdAuswerten(Number(b.dataset.i))));
}

function fdGraphRunde(rd) {
  $('fdFrage').innerHTML = 'Welche Kurve ist <span class="fd-formel-gross">' + fdFormel(rd.ziel) + '</span>?';
  $('fdBild').innerHTML = '<div class="fd-raster">' + rd.wahl.map((k, i) => '<button class="fd-kachel" type="button" data-i="' + i + '">'
    + fdSvg([{ fn: k, cls: 'ziel' }], { ohneZahlen: true }) + '<span class="fd-buchstabe">' + 'ABCD'[i] + '</span></button>').join('') + '</div>';
  $('fdAktion').innerHTML = '<p class="fd-tipp">Tipp: Erst die Form (Gerade, U, V, Welle …), dann einen markanten Punkt prüfen.</p>';
  $('fdBild').querySelectorAll('.fd-kachel').forEach((b) => b.addEventListener('click', () => fdAuswerten(Number(b.dataset.i))));
}

// Regler für eine Familie; bei jeder Änderung wird neu gezeichnet. werte wird direkt verändert.
function fdReglerHtml(fam, werte, frei) {
  const R = FD_FAMILIEN[fam].regler;
  return '<div class="fd-formel-live" data-live></div>' + Object.entries(R).filter(([k]) => !frei || frei.includes(k)).map(([k, [min, max, step]]) =>
    '<label class="fd-regel"><span class="fd-regel-name">' + k + ' = <b data-zeige="' + k + '"></b></span>'
    + '<input class="fd-regler" type="range" data-p="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + werte[k] + '" aria-label="' + k + '"></label>').join('');
}
function fdReglerVerbinden(box, fam, werte, neu) {
  const zeigen = () => {
    box.querySelector('[data-live]').textContent = fdFormel({ fam, p: werte });
    box.querySelectorAll('.fd-regler').forEach((r) => {
      box.querySelector('[data-zeige="' + r.dataset.p + '"]').textContent = fdZahl(werte[r.dataset.p]);
      r.style.setProperty('--pos', ((Number(r.value) - Number(r.min)) / (Number(r.max) - Number(r.min)) * 100) + '%');
    });
    neu();
  };
  box.querySelectorAll('.fd-regler').forEach((r) => r.addEventListener('input', () => { werte[r.dataset.p] = Number(r.value); zeigen(); }));
  zeigen();
}

function fdBauenRunde(rd) {
  const fam = rd.ziel.fam, werte = { ...FD_FAMILIEN[fam].start };
  $('fdFrage').innerHTML = 'Bau die gestrichelte <b>' + FD_FAMILIEN[fam].name + '</b> nach: <code>' + FD_FAMILIEN[fam].form + '</code>';
  $('fdAktion').innerHTML = fdReglerHtml(fam, werte) + '<button class="btn fd-gross-btn" id="fdFertig" type="button">Fertig ✓</button>';
  const zeichnen = () => { $('fdBild').innerHTML = '<div class="fd-gross">' + fdSvg([{ fn: rd.ziel, cls: 'ziel gestrichelt' }, { fn: { fam, p: werte }, cls: 'du' }]) + '</div>'; };
  fdReglerVerbinden($('fdAktion'), fam, werte, zeichnen);
  $('fdFertig').onclick = () => fdAuswerten({ fam, p: { ...werte } });
}

function fdAuswerten(wert) {
  const rd = fd.runden[fd.i];
  let p, du = null;
  if (rd.art === 'bauen') {
    du = wert;
    const fehler = fdAbstand(rd.ziel, du);
    p = fehler < 0.05 ? 10 : Math.round(10 * Math.max(0, 1 - fehler / 2) * 10) / 10;
    wert = { formel: fdFormel(du), fehler };
  } else {
    du = rd.wahl[wert];
    p = du === rd.ziel ? 10 : 0;
    wert = { formel: fdFormel(du), richtig: p === 10 };
  }
  fd.punkte.push(p);
  fd.antworten.push(wert);
  zeigeFdTeil('aufloesung');
  hochzaehlen($('fdPunkte'), p, ' / 10');
  $('fdKommentar').textContent = p >= 9.5 ? 'Fall gelöst! 🕵️' : p >= 7 ? 'Fast perfekt 👍' : p >= 4 ? 'Halb gelöst 🤔' : 'Falsche Spur 🙈';
  const E = fdErklaerung(rd.ziel);
  const kurven = [{ fn: rd.ziel, cls: 'ziel' }];
  if (fdFormel(du) !== fdFormel(rd.ziel)) kurven.unshift({ fn: du, cls: 'du gestrichelt' });
  $('fdLoesBild').innerHTML = '<div class="fd-gross klein">' + fdSvg(kurven, { marken: E.marken }) + '</div>';
  $('fdAnalyse').innerHTML = '<div class="fd-loesung"><span>Lösung</span><b>' + fdFormel(rd.ziel) + '</b></div>'
    + (fdFormel(du) !== fdFormel(rd.ziel) ? '<div class="fd-loesung du"><span>Deine</span><b>' + fdFormel(du) + '</b></div>' : '')
    + '<ol class="fd-schritte">' + E.schritte.map((s) => '<li>' + s + '</li>').join('') + '</ol>';
  if (navigator.vibrate) navigator.vibrate(p >= 8 ? [30, 40, 30] : 20);
  if (p >= 9.5) konfetti(20, ['🕵️', '📈', '✨', '🔍']);
  $('fdWeiter').textContent = fd.i === FD_RUNDEN - 1 ? 'Zum Ergebnis' : 'Nächste Runde';
}

function funktionEnde() {
  const summe = Math.round(fd.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const st = fdStore();
  st.best = st.best || {}; st.tag = st.tag || {};
  let rekord = false;
  if (fd.taeglich) { if (st.tag[heute()] == null) st.tag[heute()] = summe; }
  else {
    const b = st.best[fd.modus] = st.best[fd.modus] || {};
    rekord = b[fd.stufe] == null || summe > b[fd.stufe];
    b[fd.stufe] = Math.max(b[fd.stufe] || 0, summe);
  }
  saveJson(FD_KEY, st);
  zeigeFdTeil('ende');
  if (typeof merkeVerlauf === 'function') merkeVerlauf('funktion', summe, 50, fd.modus === 'mix' ? 'Tages-Fall' : FD_MODI[fd.modus].name + ' · ' + FD_STUFEN[fd.stufe].name);
  $('fdRunde').textContent = '';
  hochzaehlen($('fdSumme'), summe, ' / 50');
  $('fdRekord').textContent = rekord ? '🏆 Neuer Bestwert (' + FD_MODI[fd.modus].name + ', ' + FD_STUFEN[fd.stufe].name + ')!'
    : fd.taeglich ? '📅 Tages-Fall vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('fdVergleich').hidden = !fd.gegner;
  if (fd.gegner) {
    const g = fd.gegner;
    $('fdVergleich').textContent = summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + fmt(g.punkte) + ')!'
      : summe < g.punkte ? g.name + ' war besser (' + fmt(g.punkte) + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  const liste = $('fdErgListe');
  liste.innerHTML = '';
  fd.runden.forEach((rd, i) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="tl-n"></span><span class="tl-c"></span><b></b>';
    li.querySelector('.tl-n').textContent = FD_MODI[rd.art].emoji + ' ' + fdFormel(rd.ziel);
    li.querySelector('.tl-c').textContent = rd.art === 'bauen' ? '± ' + fdZahl(Math.round(fd.antworten[i].fehler * 100) / 100) : fd.antworten[i].richtig ? '✓' : '✗';
    li.querySelector('b').textContent = fmt(fd.punkte[i]);
    liste.appendChild(li);
  });
  if (summe >= 40) setTimeout(() => konfetti(50, ['🕵️', '📈', '🔍', '🏆']), 400);
}

async function funktionTeilen() {
  const summe = Math.round(fd.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const name = loadJson(STORE_KEY).name || 'Jemand';
  const url = location.origin + location.pathname + '?funktion=' + encodeURIComponent(fd.seed) + '&m=' + fd.modus + '&stufe=' + fd.stufe
    + '&n=' + encodeURIComponent(name) + '&p=' + summe;
  const k = (p) => (p >= 9 ? '🟩' : p >= 7 ? '🟨' : p >= 4 ? '🟧' : '🟥');
  const titel = fd.modus === 'mix' ? 'Tages-Fall ' + new Date().toLocaleDateString('de-DE') : FD_MODI[fd.modus].name + ' (' + FD_STUFEN[fd.stufe].name + ')';
  const text = '🕵️ Funktions-Detektiv – ' + titel + '\n' + fmt(summe) + ' / 50 ' + fd.punkte.map(k).join('') + '\nLöst du dieselben Fälle?';
  if (navigator.share) {
    try { await navigator.share({ title: 'Funktions-Detektiv', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('fdTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('fdTeilenMsg').textContent = url; }
}

// ---------- Geführte Lernrunde: kleine Aufträge mit Reglern ----------
const FD_LERN = [
  { titel: 'b: Wo schneidet die Gerade die y-Achse?', fam: 'gerade', start: { m: 1, b: 0 }, frei: ['b'], ziel: { m: 1, b: 3 },
    text: 'Eine Gerade hat die Gleichung <code>y = m·x + b</code>. Die Zahl <b>b</b> schiebt sie nach oben oder unten: Bei x = 0 ist y genau b.<br><b>Auftrag:</b> Schieb die Gerade auf die gestrichelte Linie.',
    geschafft: 'Genau! Die Gerade trifft die y-Achse jetzt bei <b>3</b>, also b = 3.', hilfe: (w) => fdPunkt(0, w.b, 'b = ' + fdZahl(w.b)) },
  { titel: 'm: Wie steil ist die Gerade?', fam: 'gerade', start: { m: 0.5, b: 1 }, frei: ['m'], ziel: { m: 2, b: 1 },
    text: '<b>m</b> ist die Steigung: Gehst du <b>1 nach rechts</b>, geht die Gerade <b>m nach oben</b>. Das Dreieck zeigt es dir live.<br><b>Auftrag:</b> Mach die Gerade so steil wie die gestrichelte.',
    geschafft: 'Super! 1 nach rechts, 2 nach oben → m = <b>2</b>.', hilfe: (w) => fdDreieck(0, w.b, 1, w.m) },
  { titel: 'Fallende Geraden', fam: 'gerade', start: { m: 1, b: 0 }, ziel: { m: -1.5, b: 2 },
    text: 'Fällt eine Gerade von links oben nach rechts unten, ist <b>m negativ</b>.<br><b>Auftrag:</b> Stell jetzt beides ein: b und m.',
    geschafft: 'Stark! b = 2, und 1 nach rechts geht es 1,5 nach <b>unten</b> → m = −1,5.', hilfe: (w) => fdPunkt(0, w.b, '') + fdDreieck(0, w.b, 1, w.m) },
  { titel: 'Parabel: a öffnet und streckt', fam: 'parabel', start: { a: 1, d: 0, e: 0 }, frei: ['a'], ziel: { a: -0.5, d: 0, e: 0 },
    text: 'Die Parabel <code>y = a·x²</code> ist ein U. Ist <b>a negativ</b>, steht das U auf dem Kopf. Ist |a| kleiner als 1, wird sie <b>breiter</b>.<br><b>Auftrag:</b> Triff die gestrichelte Parabel.',
    geschafft: 'Richtig! Nach unten geöffnet und halb so steil → a = <b>−0,5</b>. Vom Scheitel 1 nach rechts geht es 0,5 nach unten.', hilfe: (w) => fdDreieck(0, 0, 1, w.a) },
  { titel: 'Parabel: den Scheitel verschieben', fam: 'parabel', start: { a: 1, d: 0, e: 0 }, frei: ['d', 'e'], ziel: { a: 1, d: 2, e: -1 },
    text: 'Mit <code>y = (x − d)² + e</code> wandert der Scheitel nach <b>S(d|e)</b>. Die Falle: Für einen Scheitel bei x = 2 steht in der Formel <b>x − 2</b>, mit Minus!<br><b>Auftrag:</b> Bring den Scheitel auf den Punkt (2|−1).',
    geschafft: 'Perfekt! Scheitel (2|−1) → <code>y = (x − 2)² − 1</code>. Das Minus vor der 2 ist kein Fehler: Erst bei x = 2 wird die Klammer null.', hilfe: (w) => fdPunkt(w.d, w.e, 'S(' + fdZahl(w.d) + '|' + fdZahl(w.e) + ')', false) },
  { titel: 'Ausblick: Wellen', fam: 'sinus', start: { a: 1, b: 1, e: 0 }, frei: ['a', 'b'], ziel: { a: 2, b: 0.5, e: 0 },
    text: 'Im Profi-Modus gibt es auch Wellen: <code>y = a·sin(b·x)</code>. <b>a</b> macht die Welle höher, <b>b</b> macht sie schneller (kürzer).<br><b>Auftrag:</b> Mach die Welle doppelt so hoch und halb so schnell.',
    geschafft: 'Klasse! a = 2 (doppelt so hoch), b = 0,5 (halb so schnell, also doppelt so lang). Jetzt bist du bereit für echte Fälle! 🕵️', hilfe: () => fdWaagrecht(0, '') },
];
let fdl = null;

function funktionLernen() {
  fd = null;
  fdl = { schritt: 0, fertig: {} };
  $('fdRunde').textContent = '🧑‍🏫 Lernrunde';
  zeigeFdTeil('lernen');
  fdlZeigen();
}
function fdlZeigen() {
  const S = FD_LERN[fdl.schritt], werte = { ...S.start };
  const ziel = { fam: S.fam, p: { ...S.start, ...S.ziel } };
  $('fdlSchritte').innerHTML = FD_LERN.map((_, i) => '<i class="' + (fdl.fertig[i] ? 'fertig' : '') + (i === fdl.schritt ? ' jetzt' : '') + '"></i>').join('');
  $('fdlTitel').textContent = S.titel;
  $('fdlText').innerHTML = S.text;
  $('fdlZurueck').disabled = fdl.schritt === 0;
  const letzte = fdl.schritt === FD_LERN.length - 1;
  $('fdlWeiter').textContent = letzte ? 'Fertig – echtes Spiel 🕵️' : 'Weiter ›';
  $('fdlWeiter').disabled = !fdl.fertig[fdl.schritt];
  $('fdlAktion').innerHTML = fdReglerHtml(S.fam, werte, S.frei) + '<div class="fd-geschafft" id="fdlGeschafft" hidden></div>';
  const zeichnen = () => {
    const du = { fam: S.fam, p: werte };
    $('fdlBild').innerHTML = '<div class="fd-gross">' + fdSvg([{ fn: ziel, cls: 'ziel gestrichelt' }, { fn: du, cls: 'du' }], { marken: S.hilfe(werte) }) + '</div>';
    if (fdAbstand(ziel, du) < 0.02 && !$('fdlGeschafft').textContent) {
      fdl.fertig[fdl.schritt] = true;
      $('fdlGeschafft').hidden = false;
      $('fdlGeschafft').innerHTML = '✅ ' + S.geschafft;
      $('fdlWeiter').disabled = false;
      $('fdlSchritte').children[fdl.schritt].classList.add('fertig');
      if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
      konfetti(12, ['✨', '📈', '🎯']);
    }
  };
  fdReglerVerbinden($('fdlAktion'), S.fam, werte, zeichnen);
}

// ---------- Spickzettel ----------
function fdHilfeOeffnen() {
  const imSpiel = !$('fd-spiel').hidden || !$('fd-aufloesung').hidden;
  const bsp = [['gerade', { m: 2, b: 1 }], ['parabel', { a: 1, d: 2, e: -1 }], ['betrag', { a: -1, d: -1, e: 2 }], ['sinus', { a: 2, b: 1, e: 0 }], ['expo', { a: 1, e: -2 }], ['wurzel', { a: 2, d: -3, e: 0 }]];
  const tipps = {
    gerade: 'b = Schnitt mit der y-Achse · m = 1 nach rechts, m nach oben',
    parabel: 'Scheitel S(d|e) → (x − d)² + e · a = vom Scheitel 1 rechts, a hoch',
    betrag: 'wie die Parabel, nur mit Knick: |x − d| + e',
    sinus: 'e = Mittellinie · a = Höhe · b = wie schnell (Welle ist 6,3 ÷ b lang)',
    expo: 'e = Grenzlinie links · bei x = 0 ist y = a + e · nach rechts verdoppelt',
    wurzel: 'Start (d|e) · 1 rechts → a hoch, 4 rechts → 2a hoch',
  };
  $('fdHilfeInhalt').innerHTML = '<h3>So liest du Funktionen ab</h3>'
    + '<div class="fd-schritt"><span>1</span><div><b>Form erkennen</b>Linie, U, V, Welle, Kurve mit Grenze oder Startpunkt?</div></div>'
    + '<div class="fd-schritt"><span>2</span><div><b>Markanten Punkt suchen</b>y-Achsenabschnitt, Scheitel, Knick, Mittellinie, Startpunkt.</div></div>'
    + '<div class="fd-schritt"><span>3</span><div><b>Steilheit messen</b>Vom Punkt aus 1 nach rechts: Wie weit geht es hoch oder runter?</div></div>'
    + '<div class="fd-familien">' + bsp.map(([fam, p]) => { const fn = { fam, p }; return '<figure>' + fdSvg([{ fn, cls: 'ziel' }], { marken: fdErklaerung(fn).marken, ohneZahlen: true })
      + '<figcaption><b>' + FD_FAMILIEN[fam].name + '</b><code>' + FD_FAMILIEN[fam].form + '</code><small>' + tipps[fam] + '</small></figcaption></figure>'; }).join('') + '</div>'
    + '<div class="fd-falle"><b>Größte Falle:</b> Verschiebung nach rechts um 2 heißt <code>(x − 2)</code> mit <b>Minus</b>. Nach links um 2 heißt <code>(x + 2)</code>.</div>';
  $('fdHilfeLernen').hidden = imSpiel;
  const d = $('fdHilfe');
  if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
}
const fdHilfeZu = () => { const d = $('fdHilfe'); if (d.close) d.close(); else d.removeAttribute('open'); };

// ---------- Knöpfe ----------
$('fdModi').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { fdModus = b.dataset.modus; funktionIntro(); }));
$('fdStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { fdStufe = b.dataset.stufe; funktionIntro(); }));
$('fdLos').addEventListener('click', () => {
  if (fdGegner) { const g = fdGegner; fdGegner = null; $('fdChallenge').hidden = true; funktionStart({ modus: g.modus, stufe: g.stufe, seed: g.seed, gegner: g }); }
  else funktionStart();
});
$('fdTagBtn').addEventListener('click', () => funktionStart({ taeglich: true }));
$('fdWeiter').addEventListener('click', () => { fd.i++; if (fd.i >= FD_RUNDEN) funktionEnde(); else fdRundeZeigen(); });
$('fdNochmal').addEventListener('click', () => funktionStart({ modus: fd.modus === 'mix' ? fdModus : fd.modus, stufe: fd.stufe }));
$('fdTeilen').addEventListener('click', funktionTeilen);
$('fdLernenBtn').addEventListener('click', funktionLernen);
$('fdHilfeBtn').addEventListener('click', fdHilfeOeffnen);
$('fdHilfeZu').addEventListener('click', fdHilfeZu);
$('fdHilfe').addEventListener('click', (e) => { if (e.target === $('fdHilfe')) fdHilfeZu(); });
$('fdHilfeLernen').addEventListener('click', () => { fdHilfeZu(); funktionLernen(); });
$('fdlWeiter').addEventListener('click', () => {
  if (fdl.schritt < FD_LERN.length - 1) { fdl.schritt++; fdlZeigen(); $('fd-lernen').scrollIntoView({ block: 'start', behavior: wenigBewegung() ? 'auto' : 'smooth' }); }
  else { fdl = null; fdModus = 'bauen'; fdStufe = 'leicht'; funktionStart({ modus: 'bauen', stufe: 'leicht' }); }
});
$('fdlZurueck').addEventListener('click', () => { if (fdl.schritt > 0) { fdl.schritt--; fdlZeigen(); } });
$('fdZurueck').addEventListener('click', () => {
  if ((fd || fdl) && $('fd-intro').hidden) { fd = null; funktionIntro(); return; }
  fd = null;
  zeigeHub();
});
$('hubFunktion').addEventListener('click', () => { merkeZuletzt('funktion'); zoomZu($('hubFunktion'), () => { show('funktion', '🕵️ Funktions-Detektiv'); funktionIntro(); }); });

// Challenge-Link: ?funktion=<seed>&m=…&stufe=…&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('funktion')) return;
  const modus = (FD_MODI[q.get('m')] || q.get('m') === 'mix') ? q.get('m') : 'formel';
  const stufe = FD_STUFEN[q.get('stufe')] ? q.get('stufe') : 'leicht';
  fdGegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('funktion'), modus, stufe };
  history.replaceState(null, '', location.pathname);
  show('funktion', '🕵️ Funktions-Detektiv');
  if (modus !== 'mix') { fdModus = modus; fdStufe = stufe; }
  funktionIntro();
  $('fdChallenge').hidden = false;
  $('fdChallenge').textContent = fdGegner.name + ' hat ' + fmt(fdGegner.punkte) + ' / 50 Punkte ('
    + (modus === 'mix' ? 'Tages-Fall' : FD_MODI[modus].name + ', ' + FD_STUFEN[stufe].name) + '). Dieselben Fälle – schaffst du mehr?';
})();
