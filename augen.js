// 📐 Augenmaß: Wie genau sieht dein Auge? Fünf Aufgaben pro Runde – jede einmal:
//   Halbieren (Mitte einer Linie antippen), Mitte (Mittelpunkt einer Form), Winkel (vorgegebenen Winkel einstellen),
//   Länge (zweite Linie gleich lang ziehen), Parallel (Linie parallel drehen).
// Profi mischt echte optische Täuschungen dazu (Müller-Lyer, Vertikal-Horizontal, Zöllner).
const AG_KEY = 'walquiz.augen.v1';
const AG_G = 400;   // Zeichenfläche 400 × 400
const AG_TYPEN = {
  halbieren: { name: 'Halbieren', emoji: '✂️', frage: 'Tippe genau auf die Mitte der Linie.', tol: 0.15 },
  mitte: { name: 'Mittelpunkt', emoji: '🎯', frage: 'Tippe auf den Mittelpunkt der Form.', tol: 0.35 },
  winkel: { name: 'Winkel', emoji: '📐', frage: '', tol: 20 },
  laenge: { name: 'Länge', emoji: '📏', frage: 'Zieh die orange Linie genauso lang wie die weiße.', tol: 0.25 },
  parallel: { name: 'Parallel', emoji: '🛤️', frage: 'Dreh die orange Linie, bis sie parallel zur weißen ist.', tol: 15 },
  // Modus „Schätzen“: Eine Größe ist bekannt – wie groß ist das andere wohl? (rel = relativer Fehler, sonst absolut)
  slaenge: { name: 'Länge', emoji: '📏', frage: '', tol: 0.35, rel: true, schaetzen: true },
  shoehe: { name: 'Höhe', emoji: '🗼', frage: '', tol: 0.35, rel: true, schaetzen: true },
  sflaeche: { name: 'Fläche', emoji: '⬛', frage: '', tol: 0.5, rel: true, schaetzen: true },
  swinkel: { name: 'Winkel', emoji: '📐', frage: 'Wie groß ist dieser Winkel?', tol: 25, schaetzen: true },
  santeil: { name: 'Anteil', emoji: '🥧', frage: 'Wie viel Prozent des Kreises sind gefüllt?', tol: 15, schaetzen: true },
};
const AG_KLASSISCH = ['halbieren', 'mitte', 'winkel', 'laenge', 'parallel'];
const AG_SCHAETZ = ['slaenge', 'shoehe', 'sflaeche', 'swinkel', 'santeil'];
const AG_STUFEN = {
  leicht: { name: 'Leicht', klein: 'Klare Formen' },
  mittel: { name: 'Mittel', klein: 'Schräg und frei' },
  profi: { name: 'Profi', klein: 'Mit Sinnestäuschungen' },
};

// ---------- Geometrie ----------
const agRad = (g) => g * Math.PI / 180;
const agDeg = (r) => r * 180 / Math.PI;
const agPunkt = (c, w, l) => [c[0] + Math.cos(w) * l, c[1] - Math.sin(w) * l];   // Winkel gegen den Uhrzeigersinn, y nach unten
const agAbstand = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const agWinkelDiff = (a, b, periode = 360) => { const d = ((a - b) % periode + periode) % periode; return Math.min(d, periode - d); };
const f1 = (x) => fmt(Math.round(x * 10) / 10);
// Pfeilspitzen für die Müller-Lyer-Täuschung: aussen = „<—>“-Flossen nach außen, innen = „>—<“
function agFlossen(p, richtung, aussen) {
  const l = 26, w = agRad(38) * (aussen ? 1 : -1);
  const back = richtung + Math.PI;
  const a = aussen ? richtung : back;
  return [agPunkt(p, a + w, l), agPunkt(p, a - w, l)].map((q) => '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '"/>').join('');
}
// Zöllner-Striche: kurze, schräge Querstriche entlang einer Linie
function agZoellner(a, b, kipp) {
  const n = 9, w = Math.atan2(-(b[1] - a[1]), b[0] - a[0]) + kipp;
  let s = '';
  for (let i = 1; i < n; i++) {
    const m = [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n];
    const p = agPunkt(m, w, 13), q = agPunkt(m, w + Math.PI, 13);
    s += '<line class="ag-tausch" x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '"/>';
  }
  return s;
}

function agRunden(seed, stufe) {
  const r = zufallsGenerator(seed + '|augen|' + stufe);
  const zw = (a, b) => a + r() * (b - a);
  const typen = AG_KLASSISCH.slice();
  for (let i = typen.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [typen[i], typen[j]] = [typen[j], typen[i]]; }
  const profi = stufe === 'profi', leicht = stufe === 'leicht';
  return typen.map((typ) => {
    if (typ === 'halbieren') {
      const L = zw(leicht ? 220 : 170, 280), w = leicht ? agRad(zw(-12, 12)) : r() * Math.PI, c = [200 + zw(-50, 50), 200 + zw(-50, 50)];
      return { typ, a: agPunkt(c, w + Math.PI, L / 2), b: agPunkt(c, w, L / 2), m: c, L, w, flossen: profi };
    }
    if (typ === 'mitte') {
      const c = [200 + zw(-40, 40), 200 + zw(-40, 40)];
      if (leicht) { const R = zw(80, 130); return { typ, form: 'kreis', c, R, groesse: R, ziel: c }; }
      if (!profi) {
        const s = zw(150, 210), w = r() * Math.PI / 2;
        const ecken = [0, 1, 2, 3].map((k) => agPunkt(c, w + Math.PI / 4 + k * Math.PI / 2, s / Math.SQRT2));
        return { typ, form: 'eck', ecken, groesse: s / 2, ziel: c };
      }
      // Profi: Dreieck – gesucht ist der Schwerpunkt (Treffpunkt der Seitenhalbierenden)
      let ecken, flaeche;
      do {
        ecken = [0, 1, 2].map((k) => agPunkt(c, agRad(90 + k * 120 + zw(-35, 35)), zw(90, 150)));
        flaeche = Math.abs((ecken[1][0] - ecken[0][0]) * (ecken[2][1] - ecken[0][1]) - (ecken[2][0] - ecken[0][0]) * (ecken[1][1] - ecken[0][1])) / 2;
      } while (flaeche < 9000);
      const ziel = [(ecken[0][0] + ecken[1][0] + ecken[2][0]) / 3, (ecken[0][1] + ecken[1][1] + ecken[2][1]) / 3];
      return { typ, form: 'dreieck', ecken, groesse: Math.sqrt(flaeche / Math.PI), ziel };
    }
    if (typ === 'winkel') {
      const ziel = leicht ? [30, 45, 60, 90, 120, 135, 150][Math.floor(r() * 7)] : Math.round(zw(profi ? 5 : 15, profi ? 175 : 165));
      const basis = leicht ? 0 : profi ? r() * 360 : zw(-25, 25);
      const start = (ziel + (r() < 0.5 ? -1 : 1) * zw(35, 60) + 360) % 360;
      const v = agPunkt([200, 200], agRad(basis + 180 + ziel / 2), 55);   // Scheitel so, dass der Winkel mittig liegt
      return { typ, ziel, basis, start: Math.min(178, Math.max(2, start)), v, len: 138 };
    }
    if (typ === 'laenge') {
      const L = zw(120, 200), fakt = (r() < 0.5 ? -1 : 1) * zw(0.3, 0.55);
      const senkrecht = !leicht;   // ab Mittel: Vergleich waagrecht ↔ senkrecht (Senkrechte wirken länger)
      return { typ, L, start: Math.min(L * (1 + fakt), senkrecht ? 340 : 380 - (200 - L / 2)), ref: [[200 - L / 2 + zw(-40, 40), 90 + zw(-20, 20)], 0], s: senkrecht ? [200 + zw(-40, 40), 360] : [200 - L / 2 + zw(-60, 20), 300],
        w: senkrecht ? Math.PI / 2 : 0, flossen: profi ? (r() < 0.5 ? 1 : -1) : 0 };
    }
    // parallel
    const w = leicht ? agRad(zw(25, 65)) : agRad(zw(10, 170));
    const start = agDeg(w) + (r() < 0.5 ? -1 : 1) * zw(20, 45);
    return { typ, w: agDeg(w), start, c1: [200 + zw(-30, 30), 130], c2: [200 + zw(-30, 30), 280], L: 230, zoellner: profi };
  });
}

// ---------- Schätzen: eine Größe ist bekannt, die andere schätzt man ----------
function agRundenSchaetzen(seed, stufe) {
  const r = zufallsGenerator(seed + '|schaetzen|' + stufe);
  const zw = (a, b) => a + r() * (b - a), wahl = (l) => l[Math.floor(r() * l.length)];
  const typen = AG_SCHAETZ.slice();
  for (let i = typen.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [typen[i], typen[j]] = [typen[j], typen[i]]; }
  const leicht = stufe === 'leicht', profi = stufe === 'profi';
  return typen.map((typ) => {
    if (typ === 'slaenge') {
      const [V, was] = wahl([[1, 'ein Stuhl breit'], [2, 'eine Tür hoch'], [5, 'ein Auto lang'], [10, 'ein Bus lang'], [25, 'ein Schwimmbecken lang'], [100, 'ein Fußballfeld lang']]);
      const Lr = zw(70, 120), w = leicht ? 0 : profi ? agRad(zw(25, 70)) : Math.PI / 2;
      let q = leicht ? zw(0.5, 2.4) : zw(0.35, 3.2); q = Math.min(q, (w ? 290 : 330) / Lr);
      const start = w === 0 ? [200 - (Lr * q) / 2, 250] : w === Math.PI / 2 ? [270 + zw(0, 60), 370] : [60 + zw(0, 30), 370];
      return { typ, V, einheit: 'm', was, Lr, q, w, start, wahr: V * q, min: V * 0.1, max: V * 6, frage: 'Der blaue Balken ist ' + agZahl(V) + ' m (' + was + '). Wie lang ist die weiße Linie?' };
    }
    if (typ === 'shoehe') {
      const Hp = leicht ? zw(55, 75) : zw(38, 60);
      let q = leicht ? zw(2, 4.5) : profi ? zw(1.6, 8) : zw(2, 6); q = Math.min(q, 330 / Hp);
      const was = wahl(['der Turm', 'der Baum', 'das Haus', 'der Leuchtturm']);
      return { typ, Hp, q, was, abstand: profi ? zw(120, 220) : zw(70, 120), breite: zw(36, 70), wahr: 1.8 * q, min: 1, max: 1.8 * 10, einheit: 'm', frage: 'Der Mensch ist 1,80 m groß. Wie hoch ist ' + was + '?' };
    }
    if (typ === 'sflaeche') {
      const V = wahl([1, 4, 10]), s = zw(36, 52), kreis = !leicht, q = leicht ? zw(2, 6) : zw(2, profi ? 14 : 9);
      const G = kreis ? s * Math.sqrt(q / Math.PI) : s * Math.sqrt(q);
      return { typ, V, s, kreis, q: Math.min(q, kreis ? Math.PI * (150 / s) ** 2 : (290 / s) ** 2), G: Math.min(G, kreis ? 150 : 290), wahr: V * Math.min(q, kreis ? Math.PI * (150 / s) ** 2 : (290 / s) ** 2), min: V * 0.5, max: V * 30, einheit: 'm²',
        frage: 'Das blaue Quadrat hat ' + agZahl(V) + ' m². Wie groß ist die Fläche ' + (kreis ? 'des Kreises' : 'des weißen Quadrats') + '?' };
    }
    if (typ === 'swinkel') {
      const ziel = leicht ? wahl([20, 30, 45, 60, 75, 90, 110, 120, 135, 150, 165]) : Math.round(zw(8, 172));
      return { typ, ziel, wahr: ziel, basis: leicht ? 0 : r() * 360, min: 0, max: 180, linear: true, einheit: '°', v: null };
    }
    const p = leicht ? 5 * Math.round(zw(2, 18)) : Math.round(zw(3, 97));
    return { typ: 'santeil', p, wahr: p, start: leicht ? 90 : r() * 360, min: 0, max: 100, linear: true, einheit: '%' };
  });
}
const agZahl = (x) => (x >= 100 ? fmt(Math.round(x)) : x >= 10 ? fmt(Math.round(x * 10) / 10) : fmt(Math.round(x * 100) / 100));
// Reglerstellung (0–1000) ↔ Wert: Größen logarithmisch, Winkel/Prozent linear
const agVonRegler = (rd, pos) => (rd.linear ? Math.round(rd.min + (rd.max - rd.min) * pos / 1000) : rd.min * (rd.max / rd.min) ** (pos / 1000));
const agZuRegler = (rd, wert) => Math.round(rd.linear ? (wert - rd.min) / (rd.max - rd.min) * 1000 : Math.log(wert / rd.min) / Math.log(rd.max / rd.min) * 1000);
const agRund = (rd, x) => (rd.linear ? Math.round(x) : x >= 100 ? Math.round(x) : x >= 10 ? Math.round(x * 2) / 2 : Math.round(x * 10) / 10);

// ---------- Zeichnen ----------
function agSzene(rd, wert, loesung) {
  let s = '', du = '', ok = '';
  const linie = (a, b, cls = '') => '<line' + (cls ? ' class="' + cls + '"' : '') + ' x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '"/>';
  const punkt = (p, cls) => '<circle class="' + cls + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (cls === 'ag-griff' ? 11 : 7) + '"/>';
  if (rd.typ === 'halbieren') {
    s += linie(rd.a, rd.b);
    if (rd.flossen) s += agFlossen(rd.a, rd.w + Math.PI, true) + agFlossen(rd.b, rd.w, false);
    // Markierungen als feine Querstriche – ein dicker Punkt würde die Linie optisch verlängern bzw. verschieben
    const strich = (p, cls, l = 13) => linie(agPunkt(p, rd.w + Math.PI / 2, l), agPunkt(p, rd.w - Math.PI / 2, l), cls);
    if (wert) du += strich(wert, 'ag-du-strich');
    if (loesung) ok += strich(rd.m, 'ag-ok-strich', 18);
  } else if (rd.typ === 'mitte') {
    if (rd.form === 'kreis') s += '<circle class="ag-form" cx="' + rd.c[0] + '" cy="' + rd.c[1] + '" r="' + rd.R + '"/>';
    else s += '<polygon class="ag-form" points="' + rd.ecken.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>';
    if (wert) du += punkt(wert, 'ag-du');
    if (loesung) {
      if (rd.form === 'dreieck') rd.ecken.forEach((p, i) => { const q = rd.ecken[(i + 1) % 3], o = rd.ecken[(i + 2) % 3]; ok += linie(p, [(q[0] + o[0]) / 2, (q[1] + o[1]) / 2], 'ag-hilfe'); });
      ok += punkt(rd.ziel, 'ag-ok');
    }
  } else if (rd.typ === 'winkel') {
    const b = agPunkt(rd.v, agRad(rd.basis), rd.len);
    s += linie(rd.v, b) + '<circle class="ag-ende" cx="' + rd.v[0].toFixed(1) + '" cy="' + rd.v[1].toFixed(1) + '" r="4"/>';
    const bogen = (grad, cls, r) => {
      const p = agPunkt(rd.v, agRad(rd.basis), r), q = agPunkt(rd.v, agRad(rd.basis + grad), r);
      return '<path class="' + cls + '" d="M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'A' + r + ' ' + r + ' 0 ' + (grad > 180 ? 1 : 0) + ' 0 ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + '"/>';
    };
    if (wert != null) { const e = agPunkt(rd.v, agRad(rd.basis + wert), rd.len); du += bogen(wert, 'ag-bogen', 40) + linie(rd.v, e, 'ag-du-linie') + punkt(e, 'ag-griff'); }
    if (loesung) ok += linie(rd.v, agPunkt(rd.v, agRad(rd.basis + rd.ziel), rd.len), 'ag-ok-linie');
  } else if (rd.typ === 'laenge') {
    const a = rd.ref[0], b = [a[0] + rd.L, a[1]];
    s += linie(a, b);
    if (rd.flossen) s += agFlossen(a, Math.PI, rd.flossen > 0) + agFlossen(b, 0, rd.flossen > 0);
    if (wert != null) {
      const e = agPunkt(rd.s, rd.w, wert), g = agPunkt(e, rd.w - Math.PI / 2, 30);   // Griff neben der Linie, nicht auf ihr
      du += linie(rd.s, e, 'ag-du-linie') + linie(e, g, 'ag-fuehrung') + punkt(g, 'ag-griff');
      if (rd.flossen) du += '<g class="ag-du-flossen">' + agFlossen(rd.s, rd.w + Math.PI, rd.flossen < 0) + agFlossen(e, rd.w, rd.flossen < 0) + '</g>';
    }
    if (loesung) { const z = agPunkt(rd.s, rd.w, rd.L); ok += linie(rd.s, z, 'ag-ok-linie') + linie(agPunkt(z, rd.w + Math.PI / 2, 14), agPunkt(z, rd.w - Math.PI / 2, 14), 'ag-ok-strich'); }
  } else if (rd.typ === 'slaenge') {
    s += linie([60, 70], [60 + rd.Lr, 70], 'ag-ref') + '<text class="ag-text ref" x="' + (68 + rd.Lr) + '" y="76">= ' + agZahl(rd.V) + ' m</text>';
    const e = agPunkt(rd.start, rd.w, rd.Lr * rd.q);
    s += linie(rd.start, e);
    if (loesung) ok += '<text class="ag-text ok" x="' + Math.min(300, Math.max(20, (rd.start[0] + e[0]) / 2 + 14)) + '" y="' + Math.max(110, Math.min(390, (rd.start[1] + e[1]) / 2 + (rd.w ? 0 : -14))) + '">' + agZahl(rd.wahr) + ' m</text>';
  } else if (rd.typ === 'shoehe') {
    const x0 = 70, y0 = 375, H = rd.Hp, k = H * 0.13;   // Strichmännchen: Füße bis Scheitel genau H
    s += '<g class="ag-mensch"><circle cx="' + x0 + '" cy="' + (y0 - H + k).toFixed(1) + '" r="' + k.toFixed(1) + '"/>' + linie([x0, y0 - H + 2 * k], [x0, y0 - H * 0.45]) + linie([x0, y0 - H * 0.45], [x0 - H * 0.16, y0]) + linie([x0, y0 - H * 0.45], [x0 + H * 0.16, y0]) + linie([x0 - H * 0.2, y0 - H * 0.66], [x0 + H * 0.2, y0 - H * 0.66]) + '</g>'
      + '<text class="ag-text ref" x="' + (x0 - 22) + '" y="' + (y0 - H - 10).toFixed(1) + '">1,80 m</text>' + linie([20, y0], [380, y0], 'ag-boden');
    const xt = x0 + rd.abstand, Ht = rd.Hp * rd.q;
    s += '<rect class="ag-form" x="' + xt.toFixed(1) + '" y="' + (y0 - Ht).toFixed(1) + '" width="' + rd.breite.toFixed(1) + '" height="' + Ht.toFixed(1) + '"/>';
    if (loesung) ok += '<text class="ag-text ok" x="' + Math.min(330, xt + rd.breite + 8).toFixed(1) + '" y="' + Math.max(20, y0 - Ht + 18).toFixed(1) + '">' + agZahl(rd.wahr) + ' m</text>';
  } else if (rd.typ === 'sflaeche') {
    s += '<rect class="ag-ref-form" x="30" y="30" width="' + rd.s.toFixed(1) + '" height="' + rd.s.toFixed(1) + '"/><text class="ag-text ref" x="' + (38 + rd.s).toFixed(1) + '" y="' + (36 + rd.s / 2).toFixed(1) + '">= ' + agZahl(rd.V) + ' m²</text>';
    const c = [rd.kreis ? 230 : 240 - 0, rd.kreis ? 235 : 240];
    if (rd.kreis) s += '<circle class="ag-form" cx="' + c[0] + '" cy="' + c[1] + '" r="' + rd.G.toFixed(1) + '"/>';
    else s += '<rect class="ag-form" x="' + (c[0] - rd.G / 2).toFixed(1) + '" y="' + (c[1] - rd.G / 2).toFixed(1) + '" width="' + rd.G.toFixed(1) + '" height="' + rd.G.toFixed(1) + '"/>';
    if (loesung) ok += '<text class="ag-text ok mitte" x="' + c[0] + '" y="' + Math.min(394, c[1] + rd.G / (rd.kreis ? 1 : 2) + 24).toFixed(1) + '">' + agZahl(rd.wahr) + ' m²</text>';
  } else if (rd.typ === 'swinkel') {
    const v = agPunkt([200, 210], agRad(rd.basis + 180 + rd.ziel / 2), 50), L = 140;
    s += linie(v, agPunkt(v, agRad(rd.basis), L)) + linie(v, agPunkt(v, agRad(rd.basis + rd.ziel), L)) + '<circle class="ag-ende" cx="' + v[0].toFixed(1) + '" cy="' + v[1].toFixed(1) + '" r="4"/>';
    if (loesung) { const p = agPunkt(v, agRad(rd.basis + rd.ziel / 2), 70); ok += '<text class="ag-text ok mitte" x="' + p[0].toFixed(1) + '" y="' + p[1].toFixed(1) + '">' + rd.ziel + '°</text>'; }
  } else if (rd.typ === 'santeil') {
    const c = [200, 200], R = 140, a0 = agRad(rd.start), a1 = agRad(rd.start + rd.p * 3.6), p0 = agPunkt(c, a0, R), p1 = agPunkt(c, a1, R);
    s += '<circle class="ag-form" cx="200" cy="200" r="' + R + '"/><path class="ag-stueck" d="M200 200L' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + 'A' + R + ' ' + R + ' 0 ' + (rd.p > 50 ? 1 : 0) + ' 0 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'Z"/>';
    if (loesung) ok += '<text class="ag-text ok mitte gross" x="200" y="215">' + rd.p + ' %</text>';
  } else {
    const ende = (c, grad, l) => [agPunkt(c, agRad(grad), l / 2), agPunkt(c, agRad(grad + 180), l / 2)];
    const [a, b] = ende(rd.c1, rd.w, rd.L);
    s += linie(a, b);
    if (rd.zoellner) s += agZoellner(a, b, agRad(50));
    if (wert != null) {
      const [p, q] = ende(rd.c2, wert, rd.L);
      du += linie(p, q, 'ag-du-linie') + punkt(p, 'ag-griff') + '<circle class="ag-ende" cx="' + rd.c2[0] + '" cy="' + rd.c2[1] + '" r="4"/>';
      if (rd.zoellner) du += agZoellner(p, q, agRad(-50));
    }
    if (loesung) { const [p, q] = ende(rd.c2, rd.w, rd.L); ok += linie(p, q, 'ag-ok-linie'); }
  }
  return '<g class="ag-vorlage">' + s + '</g><g class="ag-du-ebene">' + du + '</g><g class="ag-loesung">' + ok + '</g>';
}

// Fehler einer Antwort: [Fehler in Einheiten der Toleranz, Text]
function agFehler(rd, wert) {
  const T = AG_TYPEN[rd.typ];
  if (T.schaetzen) {
    const e = T.rel ? Math.abs(wert - rd.wahr) / rd.wahr : Math.abs(wert - rd.wahr), ein = rd.einheit === '°' || rd.einheit === '%' ? rd.einheit : ' ' + rd.einheit;
    const richtung = wert > rd.wahr ? 'zu hoch' : 'zu niedrig';
    return [e, 'Geschätzt ' + agZahl(wert) + ein + ', richtig ' + agZahl(rd.wahr) + ein + (e < (T.rel ? 0.02 : 1) ? ' – fast genau' : ' – ' + (T.rel ? f1(e * 100) + ' %' : f1(e) + (rd.einheit === '%' ? ' Prozentpunkte' : '°')) + ' ' + richtung)];
  }
  if (rd.typ === 'halbieren') { const e = agAbstand(wert, rd.m) / rd.L; return [e, f1(e * 100) + ' % der Linienlänge neben der Mitte']; }
  if (rd.typ === 'mitte') { const e = agAbstand(wert, rd.ziel) / rd.groesse; return [e, f1(e * 100) + ' % der Formgröße neben dem Mittelpunkt']; }
  if (rd.typ === 'winkel') { const d = wert - rd.ziel; return [Math.abs(d), 'Dein Winkel: ' + Math.round(wert) + '° – ' + (Math.abs(d) < 0.5 ? 'genau getroffen' : f1(Math.abs(d)) + '° zu ' + (d > 0 ? 'groß' : 'klein'))]; }
  if (rd.typ === 'laenge') { const e = (wert - rd.L) / rd.L; return [Math.abs(e), Math.abs(e) < 0.005 ? 'Exakt gleich lang' : f1(Math.abs(e) * 100) + ' % zu ' + (e > 0 ? 'lang' : 'kurz')]; }
  const d = agWinkelDiff(wert, rd.w, 180);
  return [d, d < 0.5 ? 'Perfekt parallel' : f1(d) + '° schräg'];
}
const agPunkte = (rd, fehler) => Math.round(10 * Math.max(0, 1 - fehler / AG_TYPEN[rd.typ].tol) * 10) / 10;
function agErklaerung(rd) {
  if (rd.typ === 'sflaeche') return 'Flächen unterschätzt man fast immer: Doppelt so breit heißt viermal so viel Fläche. Ein Kreis hat etwa 79 % der Fläche des Quadrats, in das er passt.';
  if (rd.typ === 'shoehe') return 'Trick: Stapel den Menschen gedanklich übereinander – wie oft passt er in die Höhe? Mal 1,80 m.';
  if (rd.typ === 'slaenge') return rd.w ? 'Gedreht ist es schwerer: Senkrechte Linien wirken länger als gleich lange waagrechte.' : 'Trick: Wie oft passt der blaue Balken in die weiße Linie?';
  if (rd.typ === 'swinkel') return 'Vergleiche mit 90° (Ecke) und 45° (halbe Ecke) – die meisten Winkel lassen sich so eingrenzen.';
  if (rd.typ === 'santeil') return 'Hilfe: Ein Viertel ist ein rechter Winkel, die Hälfte eine gerade Linie durch die Mitte.';
  if (rd.typ === 'halbieren' && rd.flossen) return 'Täuschung: Mit nach außen zeigenden Spitzen wirkt eine Strecke länger, mit nach innen zeigenden kürzer (Müller-Lyer-Täuschung). Darum rutscht die gefühlte Mitte.';
  if (rd.typ === 'mitte' && rd.form === 'dreieck') return 'Der Schwerpunkt eines Dreiecks liegt dort, wo sich die drei Seitenhalbierenden treffen – auf einem Drittel der Höhe.';
  if (rd.typ === 'laenge' && rd.flossen) return 'Täuschung: Die Pfeilspitzen verändern die gefühlte Länge (Müller-Lyer). Dazu wirken senkrechte Linien länger als gleich lange waagrechte.';
  if (rd.typ === 'laenge' && rd.w) return 'Senkrechte Linien wirken länger als gleich lange waagrechte (Vertikal-Horizontal-Täuschung). Viele ziehen die senkrechte deshalb zu kurz.';
  if (rd.typ === 'parallel' && rd.zoellner) return 'Täuschung: Die schrägen Querstriche lassen parallele Linien gekippt wirken (Zöllner-Täuschung).';
  if (rd.typ === 'winkel') return 'Merkhilfe: 90° ist eine Ecke wie beim Blatt Papier, 45° die Hälfte davon, 60° die Ecke eines gleichseitigen Dreiecks.';
  return '';
}

// ---------- Spielablauf ----------
let ag = null;
let agStufe = 'leicht', agGegner = null, agModus = (loadJson(AG_KEY).modus === 'schaetzen' ? 'schaetzen' : 'ziehen');
const agStore = () => loadJson(AG_KEY);
const agTeile = ['intro', 'spiel', 'aufloesung', 'ende'];
const zeigeAgTeil = (t) => agTeile.forEach((x) => { $('ag-' + x).hidden = x !== t; });

function augenIntro() {
  const st = agStore(), best = st.best || {};
  $('agStufen').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.stufe === agStufe);
    b.querySelector('small').textContent = AG_STUFEN[b.dataset.stufe].klein;
  });
  const bestM = agModus === 'schaetzen' ? st.bestS || {} : best;
  $('agBest').textContent = 'Bestwerte' + (agModus === 'schaetzen' ? ' Schätzen' : '') + ': ' + Object.entries(AG_STUFEN).map(([k, v]) => v.name + ' ' + (bestM[k] != null ? fmt(bestM[k]) : '–')).join(' · ');
  $('agModi').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.modus === agModus));
  const sch = agModus === 'schaetzen';
  document.querySelector('#ag-intro .ag-lead').textContent = sch ? 'Fünf Schätzaufgaben: Eine Größe ist bekannt – wie groß ist das andere wohl? Länge, Höhe, Fläche, Winkel und Anteil. Nur schauen, nicht messen.' : 'Fünf Aufgaben für dein Auge – jede einmal: eine Linie halbieren, den Mittelpunkt finden, einen Winkel einstellen, eine Länge nachziehen und eine Linie parallel drehen. Ganz ohne Lineal.';
  document.querySelector('#ag-intro .ag-typen').innerHTML = (sch ? AG_SCHAETZ : AG_KLASSISCH).map((t) => '<span>' + AG_TYPEN[t].emoji + ' ' + AG_TYPEN[t].name + '</span>').join('');
  const t = st.tag && st.tag[heute()];
  $('agTagBtn').textContent = t != null ? '📅 Tagesprüfung – heute: ' + fmt(t) + ' / 50' : '📅 Tagesprüfung (heute für alle gleich)';
  $('agRunde').textContent = '';
  zeigeAgTeil('intro');
}

function augenStart(opts = {}) {
  const stufe = opts.taeglich ? 'mittel' : opts.stufe || agStufe, modus = opts.taeglich ? 'ziehen' : opts.modus || agModus;
  const seed = opts.seed || (opts.taeglich ? 'ag-' + heute() : String(Math.random()).slice(2));
  ag = { stufe, seed, modus, taeglich: !!opts.taeglich, runden: modus === 'schaetzen' ? agRundenSchaetzen(seed, stufe) : agRunden(seed, stufe), i: 0, punkte: [], antworten: [], texte: [], gegner: opts.gegner || null };
  agRundeZeigen();
}

function agRundeZeigen() {
  const rd = ag.runden[ag.i], T = AG_TYPEN[rd.typ];
  $('agRunde').textContent = T.emoji + ' ' + T.name + ' · ' + (ag.i + 1) + ' / 5';
  $('agFrage').textContent = rd.typ === 'winkel' ? 'Stelle einen Winkel von ' + rd.ziel + '° ein.' : rd.frage || T.frage;
  zeigeAgTeil('spiel');
  const svg = $('agFlaeche');
  $('agSchaetzen').hidden = !T.schaetzen;
  if (T.schaetzen) {
    // Schätzen: Szene steht fest, die Zahl stellt man am Regler ein
    ag.wert = null; svg.innerHTML = agSzene(rd, null, false);
    svg.onpointerdown = svg.onpointermove = svg.onpointerup = svg.onpointercancel = null;
    const regler = $('agRegler'), zeig = () => { $('agWert').textContent = ag.wert == null ? 'Regler bewegen' : agZahl(ag.wert) + (rd.einheit === '°' || rd.einheit === '%' ? '' : ' ') + rd.einheit; $('agFertig').disabled = ag.wert == null; };
    regler.value = 500;
    regler.oninput = () => { ag.wert = agRund(rd, agVonRegler(rd, +regler.value)); zeig(); };
    document.querySelectorAll('#agSchaetzen [data-pm]').forEach((b) => { b.onclick = () => {
      const d = +b.dataset.pm, w0 = ag.wert == null ? agRund(rd, agVonRegler(rd, 500)) : ag.wert;
      ag.wert = Math.min(rd.max, Math.max(rd.min, agRund(rd, rd.linear ? w0 + d : w0 * (d > 0 ? 1.05 : 1 / 1.05) + d * (w0 < 10 ? 0.1 : 0))));
      regler.value = agZuRegler(rd, ag.wert); zeig();
    }; });
    $('agHinweis').textContent = 'Nur schauen, nicht messen – dann am Regler einstellen.';
    zeig(); return;
  }
  // Startwert: Bei Winkel, Länge und Parallel liegt der bewegliche Teil schon da, nur falsch
  ag.wert = rd.typ === 'winkel' ? rd.start : rd.typ === 'laenge' ? rd.start : rd.typ === 'parallel' ? rd.start : null;
  const zeichnen = () => { svg.innerHTML = agSzene(rd, ag.wert, false); };
  zeichnen();
  $('agFertig').disabled = ag.wert == null;
  $('agHinweis').textContent = rd.typ === 'halbieren' ? 'Tippen setzt die Markierung – verschieben geht auch.' : rd.typ === 'mitte' ? 'Tippen setzt den Punkt – verschieben geht auch.' : 'Irgendwo auf der Fläche ziehen – der Griff sitzt neben der Linie, damit er nichts verfälscht.';
  const setzen = (e) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse()), q = [p.x, p.y];
    if (rd.typ === 'halbieren') {   // auf die Linie projizieren: zählt nur, wo entlang der Linie getippt wurde
      const dx = rd.b[0] - rd.a[0], dy = rd.b[1] - rd.a[1], t = Math.max(0, Math.min(1, ((q[0] - rd.a[0]) * dx + (q[1] - rd.a[1]) * dy) / (dx * dx + dy * dy)));
      ag.wert = [rd.a[0] + dx * t, rd.a[1] + dy * t];
    } else if (rd.typ === 'mitte') ag.wert = q;
    else if (rd.typ === 'winkel') {
      let g = agDeg(Math.atan2(-(q[1] - rd.v[1]), q[0] - rd.v[0])) - rd.basis;
      g = ((g % 360) + 360) % 360;
      ag.wert = Math.min(179.5, Math.max(0.5, g > 270 ? 0.5 : g));   // Winkel zwischen 0° und 180°
    } else if (rd.typ === 'laenge') {
      const l = (q[0] - rd.s[0]) * Math.cos(rd.w) - (q[1] - rd.s[1]) * Math.sin(rd.w);
      ag.wert = Math.max(20, Math.min(rd.w ? rd.s[1] - 12 : AG_G - rd.s[0] - 12, l));
    } else {
      ag.wert = ((agDeg(Math.atan2(-(q[1] - rd.c2[1]), q[0] - rd.c2[0])) % 180) + 180) % 180;
    }
    $('agFertig').disabled = false;
    zeichnen();
  };
  let zieht = false;
  svg.onpointerdown = (e) => { e.preventDefault(); zieht = true; try { svg.setPointerCapture(e.pointerId); } catch (x) { /* egal */ } setzen(e); };
  svg.onpointermove = (e) => { if (zieht) setzen(e); };
  svg.onpointerup = svg.onpointercancel = () => { zieht = false; };
}

function agAuswerten() {
  const rd = ag.runden[ag.i];
  const [fehler, text] = agFehler(rd, ag.wert);
  const p = agPunkte(rd, fehler);
  ag.punkte.push(p); ag.antworten.push(ag.wert); ag.texte.push(text);
  zeigeAgTeil('aufloesung');
  hochzaehlen($('agPunkte'), p, ' / 10');
  $('agKommentar').textContent = p >= 9.5 ? 'Augen wie ein Adler! 🦅' : p >= 8 ? 'Richtig präzise 🔥' : p >= 6 ? 'Gutes Augenmaß 👍' : p >= 3 ? 'Knapp daneben 🤔' : 'Da hat dich was getäuscht 🙈';
  $('agErgebnis').innerHTML = agSzene(rd, ag.wert, true);
  $('agText').textContent = text + '.';
  const erkl = agErklaerung(rd);
  $('agErkl').textContent = erkl;
  $('agErkl').hidden = !erkl;
  if (navigator.vibrate) navigator.vibrate(p >= 8 ? [30, 40, 30] : 20);
  if (p >= 9.5) konfetti(24, ['📐', '🎯', '✨', '🦅']);
  $('agWeiter').textContent = ag.i === 4 ? 'Zum Ergebnis' : 'Nächste Aufgabe';
}

function augenEnde() {
  const summe = Math.round(ag.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const st = agStore();
  st.best = st.best || {}; st.tag = st.tag || {}; st.bestS = st.bestS || {};
  const B = ag.modus === 'schaetzen' ? st.bestS : st.best;
  let rekord = false;
  if (ag.taeglich) { if (st.tag[heute()] == null) st.tag[heute()] = summe; }
  else { rekord = B[ag.stufe] == null || summe > B[ag.stufe]; B[ag.stufe] = Math.max(B[ag.stufe] || 0, summe); }
  saveJson(AG_KEY, st);
  zeigeAgTeil('ende');
  if (typeof merkeVerlauf === 'function') merkeVerlauf('augen', summe, 50, ag.taeglich ? 'Tagesprüfung' : (ag.modus === 'schaetzen' ? 'Schätzen · ' : '') + AG_STUFEN[ag.stufe].name);
  $('agRunde').textContent = '';
  hochzaehlen($('agSumme'), summe, ' / 50');
  $('agRekord').textContent = rekord ? '🏆 Neuer Bestwert (' + AG_STUFEN[ag.stufe].name + ')!' : ag.taeglich ? '📅 Tagesprüfung vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('agVergleich').hidden = !ag.gegner;
  if (ag.gegner) {
    const g = ag.gegner;
    $('agVergleich').textContent = summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + fmt(g.punkte) + ')!'
      : summe < g.punkte ? g.name + ' war besser (' + fmt(g.punkte) + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  const liste = $('agListe');
  liste.innerHTML = '';
  ag.runden.forEach((rd, i) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="tl-n"></span><span class="tl-c"></span><b></b>';
    li.querySelector('.tl-n').textContent = AG_TYPEN[rd.typ].emoji + ' ' + AG_TYPEN[rd.typ].name;
    li.querySelector('.tl-c').textContent = ag.texte[i].replace(/^Dein Winkel: \d+° – /, '').replace(/^Geschätzt /, '');
    li.querySelector('b').textContent = fmt(ag.punkte[i]);
    liste.appendChild(li);
  });
  if (summe >= 40) setTimeout(() => konfetti(50, ['📐', '📏', '🦅', '🏆']), 400);
}

async function augenTeilen() {
  const summe = Math.round(ag.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const name = loadJson(STORE_KEY).name || 'Jemand';
  const url = location.origin + location.pathname + '?augen=' + encodeURIComponent(ag.seed) + '&stufe=' + ag.stufe + (ag.modus === 'schaetzen' ? '&modus=schaetzen' : '') + '&n=' + encodeURIComponent(name) + '&p=' + summe;
  const k = (p) => (p >= 9 ? '🟩' : p >= 7 ? '🟨' : p >= 5 ? '🟧' : '🟥');
  const text = '📐 Augenmaß – ' + (ag.taeglich ? 'Tagesprüfung ' + new Date().toLocaleDateString('de-DE') : (ag.modus === 'schaetzen' ? 'Schätzen · ' : '') + AG_STUFEN[ag.stufe].name)
    + '\n' + fmt(summe) + ' / 50 ' + ag.punkte.map(k).join('') + '\nHast du das bessere Auge? Gleiche Aufgaben:';
  if (navigator.share) {
    try { await navigator.share({ title: 'Augenmaß', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('agTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('agTeilenMsg').textContent = url; }
}

// ---------- Knöpfe ----------
$('agStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { agStufe = b.dataset.stufe; augenIntro(); }));
$('agModi').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { agModus = b.dataset.modus; const st = agStore(); st.modus = agModus; saveJson(AG_KEY, st); augenIntro(); }));
$('agLos').addEventListener('click', () => {
  if (agGegner) { const g = agGegner; agGegner = null; $('agChallenge').hidden = true; augenStart({ stufe: g.stufe, seed: g.seed, gegner: g, taeglich: g.taeglich, modus: g.modus }); }
  else augenStart();
});
$('agTagBtn').addEventListener('click', () => augenStart({ taeglich: true }));
$('agFertig').addEventListener('click', () => { if (ag.wert != null) agAuswerten(); });
$('agWeiter').addEventListener('click', () => { ag.i++; if (ag.i >= 5) augenEnde(); else agRundeZeigen(); });
$('agNochmalSpiel').addEventListener('click', () => augenStart({ stufe: ag.stufe, modus: ag.modus }));
$('agTeilen').addEventListener('click', augenTeilen);
$('agZurueck').addEventListener('click', () => {
  if (ag && $('ag-intro').hidden) { ag = null; augenIntro(); return; }
  ag = null;
  zeigeHub();
});
$('hubAugen').addEventListener('click', () => { merkeZuletzt('augen'); zoomZu($('hubAugen'), () => { show('augen', '📐 Augenmaß'); augenIntro(); }); });

// Challenge-Link: ?augen=<seed>&stufe=…&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('augen')) return;
  const stufe = AG_STUFEN[q.get('stufe')] ? q.get('stufe') : 'leicht';
  agGegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('augen'), stufe, modus: q.get('modus') === 'schaetzen' ? 'schaetzen' : 'ziehen' };
  agModus = agGegner.modus;
  history.replaceState(null, '', location.pathname);
  show('augen', '📐 Augenmaß');
  agStufe = stufe;
  augenIntro();
  $('agChallenge').hidden = false;
  $('agChallenge').textContent = agGegner.name + ' hat ' + fmt(agGegner.punkte) + ' / 50 Punkte (' + AG_STUFEN[stufe].name + '). Gleiche Aufgaben – hast du das bessere Auge?';
})();
