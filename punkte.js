// 📈 Punktwolke: Wie stark hängt das zusammen?
// Zwei Spielarten mit je fünf Runden (bis 50 Punkte):
//   Schätzen  – eine Punktwolke ansehen und den Korrelationskoeffizienten r schätzen,
//   Sortieren – mehrere Wolken nach ihrem Zusammenhang ordnen.
// Die Wolken werden so erzeugt, dass r exakt dem Zielwert entspricht (vor Ausreißern); angezeigt wird immer das echte r.
const PW_KEY = 'walquiz.punkte.v1';
const PW_RUNDEN = 5;
const PW_MODI = {
  schaetzen: { name: 'Schätzen', emoji: '🎯', lead: 'Eine Punktwolke erscheint. Schätze, wie stark x und y zusammenhängen: von −1 (fällt perfekt) über 0 (kein Zusammenhang) bis +1 (steigt perfekt).' },
  sortieren: { name: 'Sortieren', emoji: '📊', lead: 'Mehrere Punktwolken nebeneinander. Tippe sie der Reihe nach an – vom schwächsten zum stärksten Zusammenhang.' },
};
const PW_STUFEN = {
  leicht: { name: 'Leicht', n: 110, min: 0.05, ausreisser: 0, wolken: 3, abstand: 0.25,
    schaetzen: '0 bis 1 · viele Punkte', sortieren: '3 Wolken · nur steigend' },
  mittel: { name: 'Mittel', n: 60, min: -0.97, ausreisser: 0, wolken: 4, abstand: 0.15,
    schaetzen: '−1 bis 1 · 60 Punkte', sortieren: '4 Wolken · auch fallend' },
  profi: { name: 'Profi', n: 30, min: -0.97, ausreisser: 2, wolken: 4, abstand: 0.08,
    schaetzen: '30 Punkte · Ausreißer', sortieren: '4 Wolken · knapp beieinander' },
};

// ---------- Rechnen ----------
const rText = (r) => (r < 0 ? '−' : '') + fmt(Math.abs(r).toFixed(2));
function pearson(x, y) {
  const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxy / Math.sqrt(sxx * syy);
}
function standardisieren(v) {
  const n = v.length, m = v.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / n) || 1;
  return v.map((x) => (x - m) / sd);
}
// Wolke mit exakt r = ziel: y = r·x + √(1−r²)·e, wobei e senkrecht auf x steht
function pwWolke(rng, n, ziel, ausreisser) {
  const nv = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const x = standardisieren(Array.from({ length: n }, nv));
  let e = standardisieren(Array.from({ length: n }, nv));
  const proj = e.reduce((s, ei, i) => s + ei * x[i], 0) / n;
  e = standardisieren(e.map((ei, i) => ei - proj * x[i]));
  const y = x.map((xi, i) => ziel * xi + Math.sqrt(1 - ziel * ziel) * e[i]);
  const raus = [];
  for (let k = 0; k < ausreisser; k++) {
    // Ausreißer gegen den Trend – zieht r sichtbar in Richtung 0
    const i = Math.floor(rng() * n), s = rng() < 0.5 ? -1 : 1;
    x[i] = s * (2.2 + rng() * 0.8);
    y[i] = -s * Math.sign(ziel || 1) * (2 + rng() * 0.8);
    raus.push(i);
  }
  return { x, y, r: pearson(x, y), raus };
}
const pwPunkte = (ziel, tipp) => Math.round(10 * Math.max(0, 1 - Math.abs(tipp - ziel) / 0.4) * 10) / 10;
function pwEinordnung(r) {
  const a = Math.abs(r);
  const staerke = a < 0.1 ? 'Praktisch kein' : a < 0.3 ? 'Ein schwacher' : a < 0.5 ? 'Ein mittlerer' : a < 0.7 ? 'Ein deutlicher' : a < 0.9 ? 'Ein starker' : 'Ein sehr starker';
  if (a < 0.1) return staerke + ' Zusammenhang – die Punkte liegen kreuz und quer.';
  return staerke + (r > 0 ? ' positiver Zusammenhang: Je größer x, desto größer meist auch y.' : ' negativer Zusammenhang: Je größer x, desto kleiner meist y.');
}
function pwRunden(seed, modus, stufe) {
  const rng = zufallsGenerator(seed + '|' + modus + '|' + stufe);
  const S = PW_STUFEN[stufe];
  const arten = modus === 'mix' ? ['schaetzen', 'schaetzen', 'sortieren', 'schaetzen', 'sortieren'] : Array(PW_RUNDEN).fill(modus);
  const zielR = () => { const r = S.min + rng() * (0.97 - S.min); return Math.abs(r) < 0.02 ? 0.02 : r; };
  return arten.map((art) => {
    if (art === 'schaetzen') return { art, wolke: pwWolke(rng, S.n, zielR(), S.ausreisser) };
    // Sortieren: Zielwerte mit Mindestabstand ziehen
    let rs;
    do { rs = Array.from({ length: S.wolken }, () => zielR()).sort((a, b) => a - b); }
    while (rs.some((r, i) => i && r - rs[i - 1] < S.abstand));
    const wolken = rs.map((r) => pwWolke(rng, Math.round(S.n * 0.7), r, 0));
    for (let i = wolken.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [wolken[i], wolken[j]] = [wolken[j], wolken[i]]; }
    return { art, wolken };
  });
}

// ---------- Zeichnen ----------
// Bildschirm-Koordinaten einer Wolke: normal auf die eigene Spannweite skaliert, mit fest = feste Achsen von −3 bis 3
const PW_G = 300, PW_P = 18;
function pwSkala(w, fest) {
  const ex = (v) => fest ? [-3, 3] : [Math.min(...v), Math.max(...v)];
  const [x0, x1] = ex(w.x), [y0, y1] = ex(w.y);
  const sx = (x) => PW_P + (x - x0) / (x1 - x0 || 1) * (PW_G - 2 * PW_P);
  const sy = (y) => PW_G - PW_P - (y - y0) / (y1 - y0 || 1) * (PW_G - 2 * PW_P);
  return { sx, sy, x0, x1 };
}
// Form der Wolke: Ellipse über die Streuung (2 Standardabweichungen je Hauptachse).
// q = Breite / Länge. Für eine gleichmäßig skalierte Wolke gilt r ≈ (1 − q²) / (1 + q²).
function pwForm(w, fest) {
  const { sx, sy } = pwSkala(w, fest);
  const X = w.x.map(sx), Y = w.y.map(sy), n = X.length;
  const mx = X.reduce((a, b) => a + b, 0) / n, my = Y.reduce((a, b) => a + b, 0) / n;
  let a = 0, c = 0, bxy = 0;
  for (let i = 0; i < n; i++) { const dx = X[i] - mx, dy = Y[i] - my; a += dx * dx; c += dy * dy; bxy += dx * dy; }
  a /= n; c /= n; bxy /= n;
  const m = (a + c) / 2, d = Math.sqrt(((a - c) / 2) ** 2 + bxy * bxy);
  const l1 = m + d, l2 = Math.max(0, m - d);
  const winkel = 0.5 * Math.atan2(2 * bxy, a - c) * 180 / Math.PI;
  const q = Math.sqrt(l2 / l1);
  const steigt = bxy < 0;   // Bildschirm-y zeigt nach unten
  return { cx: mx, cy: my, lang: 2 * Math.sqrt(l1), breit: 2 * Math.sqrt(l2), winkel, q, steigt,
    rSchaetz: (steigt ? 1 : -1) * (1 - q * q) / (1 + q * q) };
}
// Vier Formen als Faustregel
const PW_FORMEN = [
  { id: 'kreis', name: 'Kreis', emoji: '⚪', von: 0, bis: 0.2, text: 'rund, kein Trend', q: '1 : 1' },
  { id: 'ei', name: 'Ei', emoji: '🥚', von: 0.2, bis: 0.6, text: 'etwas länglich', q: '≈ 2 : 3' },
  { id: 'zigarre', name: 'Zigarre', emoji: '🌭', von: 0.6, bis: 0.88, text: 'deutlich gestreckt', q: '≈ 1 : 3' },
  { id: 'strich', name: 'Strich', emoji: '➖', von: 0.88, bis: 1, text: 'fast eine Linie', q: '1 : 5 und dünner' },
];
const pwFormVon = (r) => PW_FORMEN.find((f) => Math.abs(r) < f.bis) || PW_FORMEN[3];
const pwQText = (q) => { const k = Math.max(1, Math.round(1 / Math.max(q, 0.05) * 2) / 2); return '1 : ' + fmt(k); };

// Punktwolke als SVG auf Millimeterpapier. mitLinie = Regressionsgerade (y auf x), ellipse = Form der Wolke, achsen = Länge/Breite einzeichnen.
function pwSvg(w, opt = {}) {
  const G = PW_G, P = PW_P;
  const { sx, sy, x0, x1 } = pwSkala(w, opt.fest);
  const gross = w.x.length > 80 ? 3.2 : w.x.length > 40 ? 4 : 5;
  let pkt = '';
  w.x.forEach((x, i) => {
    const aus = opt.ausreisser && w.raus.includes(i);
    pkt += '<circle class="pw-p' + (aus ? ' aus' : '') + '" cx="' + sx(x).toFixed(1) + '" cy="' + sy(w.y[i]).toFixed(1) + '" r="' + (aus ? gross + 2 : gross) + '" style="--d:' + (opt.ruhig ? 0 : (i % 40) * 12) + 'ms"/>';
  });
  let linie = '';
  if (opt.mitLinie) {
    const mx = w.x.reduce((a, b) => a + b, 0) / w.x.length, my = w.y.reduce((a, b) => a + b, 0) / w.y.length;
    let sxy = 0, sxx = 0;
    w.x.forEach((x, i) => { sxy += (x - mx) * (w.y[i] - my); sxx += (x - mx) ** 2; });
    const b = sxy / sxx, f = (x) => my + b * (x - mx);
    const xa = opt.fest ? -3 : x0, xb = opt.fest ? 3 : x1;
    linie = '<line class="pw-linie" x1="' + sx(xa) + '" y1="' + sy(f(xa)) + '" x2="' + sx(xb) + '" y2="' + sy(f(xb)) + '"/>';
  }
  let form = '';
  if (opt.ellipse || opt.achsen) {
    const F = pwForm(w, opt.fest), t = 'translate(' + F.cx.toFixed(1) + ' ' + F.cy.toFixed(1) + ') rotate(' + F.winkel.toFixed(1) + ')';
    form = '<g class="pw-form" transform="' + t + '">'
      + (opt.ellipse ? '<ellipse rx="' + F.lang.toFixed(1) + '" ry="' + Math.max(F.breit, 3).toFixed(1) + '"/>' : '')
      + (opt.achsen ? '<line class="pw-lang" x1="' + (-F.lang).toFixed(1) + '" y1="0" x2="' + F.lang.toFixed(1) + '" y2="0"/>'
        + '<line class="pw-breit" x1="0" y1="' + (-F.breit).toFixed(1) + '" x2="0" y2="' + F.breit.toFixed(1) + '"/>' : '') + '</g>';
  }
  return '<svg class="pw-svg" viewBox="0 0 ' + G + ' ' + G + '"><rect class="pw-papier" width="' + G + '" height="' + G + '" rx="10"/>'
    + '<path class="pw-achse" d="M' + P + ' ' + (G - P) + 'H' + (G - 6) + 'M' + P + ' ' + (G - P) + 'V6"/>' + linie + '<g>' + pkt + '</g>' + form + '</svg>';
}

// ---------- Spielablauf ----------
let pw = null;
let pwModus = 'schaetzen', pwStufe = 'leicht', pwGegner = null;
const pwStore = () => loadJson(PW_KEY);
const pwTeile = ['intro', 'spiel', 'aufloesung', 'ende', 'lernen'];
const zeigePwTeil = (t) => pwTeile.forEach((x) => { $('pw-' + x).hidden = x !== t; });

function punkteIntro() {
  const st = pwStore(), best = (st.best || {})[pwModus] || {};
  $('pwModi').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.modus === pwModus));
  $('pwLead').textContent = PW_MODI[pwModus].lead;
  $('pwStufen').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.stufe === pwStufe);
    b.querySelector('small').textContent = PW_STUFEN[b.dataset.stufe][pwModus];
  });
  $('pwBest').textContent = 'Bestwerte ' + PW_MODI[pwModus].name + ': '
    + Object.entries(PW_STUFEN).map(([k, v]) => v.name + ' ' + (best[k] != null ? fmt(best[k]) : '–')).join(' · ');
  const t = st.tag && st.tag[heute()];
  $('pwTagBtn').textContent = t != null ? '📅 Tages-Wolken – heute: ' + fmt(t) + ' / 50' : '📅 Tages-Wolken (heute für alle gleich)';
  $('pwRunde').textContent = '';
  zeigePwTeil('intro');
}

function punkteStart(opts = {}) {
  const modus = opts.taeglich ? 'mix' : opts.modus || pwModus;
  const stufe = opts.taeglich ? 'mittel' : opts.stufe || pwStufe;
  const seed = opts.seed || (opts.taeglich ? 'pw-' + heute() : String(Math.random()).slice(2));
  pw = { modus, stufe, seed, taeglich: !!opts.taeglich, runden: pwRunden(seed, modus, stufe), i: 0, punkte: [], antworten: [], gegner: opts.gegner || null };
  pwRundeZeigen();
}

function pwRundeZeigen() {
  const rd = pw.runden[pw.i];
  $('pwRunde').textContent = PW_MODI[rd.art].emoji + ' ' + PW_MODI[rd.art].name + ' · ' + (pw.i + 1) + ' / ' + PW_RUNDEN;
  zeigePwTeil('spiel');
  if (rd.art === 'schaetzen') pwSchaetzen(rd);
  else pwSortieren(rd);
}

function pwSchaetzen(rd) {
  const nurPositiv = pw.stufe === 'leicht' && pw.modus !== 'mix';
  $('pwFrage').textContent = 'Wie stark hängen x und y zusammen?';
  $('pwBild').innerHTML = '<div class="pw-gross">' + pwSvg(rd.wolke) + '</div>';
  $('pwAktion').innerHTML = '<div class="pw-wert" id="pwWert"></div>'
    + '<input class="pw-regler" id="pwRegler" type="range" min="' + (nurPositiv ? 0 : -100) + '" max="100" step="1" value="' + (nurPositiv ? 50 : 0) + '" aria-label="Geschätztes r">'
    + '<div class="pw-skala">' + (nurPositiv ? '<span>0 · kein</span><span>0,5</span><span>1 · perfekt</span>' : '<span>−1 fallend</span><span>0 · kein</span><span>+1 steigend</span>') + '</div>'
    + '<button class="btn pw-gross-btn" id="pwFertig" type="button">Fertig ✓</button>';
  const reg = $('pwRegler');
  const zeigen = () => {
    const v = Number(reg.value) / 100;
    $('pwWert').textContent = 'r = ' + rText(v);
    reg.style.setProperty('--pos', ((Number(reg.value) - Number(reg.min)) / (Number(reg.max) - Number(reg.min)) * 100) + '%');
  };
  reg.addEventListener('input', zeigen);
  zeigen();
  $('pwFertig').onclick = () => pwAuswerten(Number(reg.value) / 100);
}

function pwSortieren(rd) {
  const nurPositiv = rd.wolken.every((w) => w.r > 0);
  $('pwFrage').textContent = nurPositiv ? 'Tippe die Wolken an: vom schwächsten zum stärksten Zusammenhang.' : 'Tippe die Wolken an: von −1 (fällt stark) bis +1 (steigt stark).';
  $('pwBild').innerHTML = '<div class="pw-raster' + (rd.wolken.length === 3 ? ' drei' : '') + '">'
    + rd.wolken.map((w, i) => '<button class="pw-kachel" type="button" data-i="' + i + '">' + pwSvg(w) + '<span class="pw-nr"></span></button>').join('') + '</div>';
  $('pwAktion').innerHTML = '<div class="pw-skala pw-pfeil"><span>' + (nurPositiv ? 'schwach' : '−1') + '</span><span>→</span><span>' + (nurPositiv ? 'stark' : '+1') + '</span></div>'
    + '<button class="btn secondary" id="pwZuruecksetzen" type="button">↺ Neu anfangen</button>'
    + '<button class="btn pw-gross-btn" id="pwFertig" type="button" disabled>Fertig ✓</button>';
  const folge = [];
  const kacheln = $('pwBild').querySelectorAll('.pw-kachel');
  const zeichnen = () => {
    kacheln.forEach((k) => {
      const pos = folge.indexOf(Number(k.dataset.i));
      k.classList.toggle('gewaehlt', pos >= 0);
      k.querySelector('.pw-nr').textContent = pos >= 0 ? pos + 1 : '';
    });
    $('pwFertig').disabled = folge.length !== rd.wolken.length;
  };
  kacheln.forEach((k) => k.addEventListener('click', () => {
    const i = Number(k.dataset.i), pos = folge.indexOf(i);
    if (pos >= 0) folge.splice(pos);        // nochmal tippen: ab hier zurücknehmen
    else folge.push(i);
    if (navigator.vibrate) navigator.vibrate(10);
    zeichnen();
  }));
  $('pwZuruecksetzen').onclick = () => { folge.length = 0; zeichnen(); };
  $('pwFertig').onclick = () => pwAuswerten(folge.slice());
}

function pwAuswerten(wert) {
  const rd = pw.runden[pw.i];
  let p;
  if (rd.art === 'schaetzen') p = pwPunkte(rd.wolke.r, wert);
  else {
    // Anteil richtig geordneter Paare
    let gut = 0, alle = 0;
    for (let a = 0; a < wert.length; a++) for (let b = a + 1; b < wert.length; b++) { alle++; if (rd.wolken[wert[a]].r < rd.wolken[wert[b]].r) gut++; }
    p = Math.round(gut / alle * 100) / 10;
    wert = { folge: wert, gut, alle };
  }
  pw.punkte.push(p);
  pw.antworten.push(wert);
  zeigePwTeil('aufloesung');
  hochzaehlen($('pwPunkte'), p, ' / 10');
  $('pwKommentar').textContent = p >= 9.5 ? 'Volltreffer! 🎯' : p >= 8 ? 'Richtig gutes Auge 🔥' : p >= 6 ? 'Ganz ordentlich 👍' : p >= 4 ? 'Na ja … 🤔' : 'Daneben 🙈';
  const box = $('pwAnalyse');
  if (rd.art === 'schaetzen') {
    const r = rd.wolke.r, d = wert - r;
    const pos = (v) => ((v + 1) / 2 * 100) + '%';
    const F = pwForm(rd.wolke), fo = pwFormVon(F.rSchaetz);
    box.innerHTML = '<div class="pw-gross klein">' + pwSvg(rd.wolke, { mitLinie: true, ausreisser: true, ruhig: true, ellipse: true }) + '</div>'
      + '<div class="pw-faust">' + fo.emoji + ' Form: <b>' + fo.name + '</b> · Breite : Länge ≈ <b>' + pwQText(F.q) + '</b> → Faustregel r ≈ <b>' + rText(Math.round(F.rSchaetz * 20) / 20) + '</b></div>'
      + '<table class="farb-tabelle"><tr><th>Echtes r</th><td>' + rText(r) + '</td></tr><tr><th>Dein Tipp</th><td>' + rText(wert) + '</td></tr>'
      + '<tr class="diff"><th>Abweichung</th><td class="' + (Math.abs(d) <= 0.05 ? 'gut' : Math.abs(d) <= 0.15 ? 'mittel' : 'weit') + '">' + (d >= 0 ? '+' : '−') + fmt(Math.abs(d).toFixed(2)) + '</td></tr></table>'
      + '<div class="pw-band"><i class="pw-ziel" style="left:' + pos(r) + '"></i><i class="pw-du" style="left:' + pos(wert) + '"></i></div>'
      + '<div class="pw-band-text"><span>−1</span><span>0</span><span>+1</span></div>'
      + '<div class="farb-tipp">' + pwEinordnung(r) + '</div>'
      + (rd.wolke.raus.length ? '<div class="farb-deltae">Die roten Punkte sind Ausreißer gegen den Trend. Schon ein, zwei solcher Punkte können r stark verändern – meist wird der Zusammenhang dadurch schwächer.</div>'
        : '<div class="farb-deltae">Die Linie ist die Regressionsgerade. Je enger die Punkte an ihr liegen, desto näher ist r an −1 oder +1.</div>');
  } else {
    const richtig = rd.wolken.map((w, i) => i).sort((a, b) => rd.wolken[a].r - rd.wolken[b].r);
    box.innerHTML = '<div class="pw-ordnung">' + richtig.map((i, pos) => {
      const deine = wert.folge.indexOf(i) + 1;
      return '<div class="pw-ord' + (deine === pos + 1 ? ' ok' : '') + '">' + pwSvg(rd.wolken[i], { mitLinie: true, ruhig: true })
        + '<b>' + rText(rd.wolken[i].r) + '</b><small>' + (deine === pos + 1 ? '✓ Platz ' + deine : 'Du: Platz ' + deine) + '</small></div>';
    }).join('') + '</div>'
      + '<div class="farb-tipp">' + wert.gut + ' von ' + wert.alle + ' Paaren richtig herum.</div>'
      + '<div class="farb-deltae">Achte auf die Breite der Wolke quer zur Linie, nicht auf ihre Steigung: Eine flache, aber schmale Wolke hat ein größeres r als eine steile, breite.</div>';
  }
  if (navigator.vibrate) navigator.vibrate(p >= 8 ? [30, 40, 30] : 20);
  if (p >= 9.5) konfetti(24, ['📈', '🎯', '✨', '📊']);
  $('pwWeiter').textContent = pw.i === PW_RUNDEN - 1 ? 'Zum Ergebnis' : 'Nächste Runde';
}

function punkteEnde() {
  const summe = Math.round(pw.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const st = pwStore();
  st.best = st.best || {}; st.tag = st.tag || {};
  let rekord = false;
  if (pw.taeglich) { if (st.tag[heute()] == null) st.tag[heute()] = summe; }
  else {
    const b = st.best[pw.modus] = st.best[pw.modus] || {};
    rekord = b[pw.stufe] == null || summe > b[pw.stufe];
    b[pw.stufe] = Math.max(b[pw.stufe] || 0, summe);
  }
  saveJson(PW_KEY, st);
  zeigePwTeil('ende');
  if (typeof merkeVerlauf === 'function') merkeVerlauf('punkte', summe, 50, pw.modus === 'mix' ? 'Tages-Wolken' : PW_MODI[pw.modus].name + ' · ' + PW_STUFEN[pw.stufe].name);
  $('pwRunde').textContent = '';
  hochzaehlen($('pwSumme'), summe, ' / 50');
  $('pwRekord').textContent = rekord ? '🏆 Neuer Bestwert (' + PW_MODI[pw.modus].name + ', ' + PW_STUFEN[pw.stufe].name + ')!'
    : pw.taeglich ? '📅 Tages-Wolken vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('pwVergleich').hidden = !pw.gegner;
  if (pw.gegner) {
    const g = pw.gegner;
    $('pwVergleich').textContent = summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + fmt(g.punkte) + ')!'
      : summe < g.punkte ? g.name + ' war besser (' + fmt(g.punkte) + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  const liste = $('pwErgListe');
  liste.innerHTML = '';
  pw.runden.forEach((rd, i) => {
    const w = pw.antworten[i];
    const li = document.createElement('li');
    li.innerHTML = '<span class="tl-n"></span><span class="tl-c"></span><b></b>';
    if (rd.art === 'schaetzen') {
      li.querySelector('.tl-n').textContent = '🎯 r ' + rText(rd.wolke.r) + ' → ' + rText(w);
      const d = w - rd.wolke.r;
      li.querySelector('.tl-c').textContent = (d >= 0 ? '+' : '−') + fmt(Math.abs(d).toFixed(2));
    } else {
      li.querySelector('.tl-n').textContent = '📊 ' + rd.wolken.length + ' Wolken sortiert';
      li.querySelector('.tl-c').textContent = w.gut + '/' + w.alle + ' Paare';
    }
    li.querySelector('b').textContent = fmt(pw.punkte[i]);
    liste.appendChild(li);
  });
  if (summe >= 40) setTimeout(() => konfetti(50, ['📈', '📊', '🎯', '🏆']), 400);
}

async function punkteTeilen() {
  const summe = Math.round(pw.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const name = loadJson(STORE_KEY).name || 'Jemand';
  const url = location.origin + location.pathname + '?punkte=' + encodeURIComponent(pw.seed) + '&m=' + pw.modus + '&stufe=' + pw.stufe
    + '&n=' + encodeURIComponent(name) + '&p=' + summe;
  const k = (p) => (p >= 9 ? '🟩' : p >= 7 ? '🟨' : p >= 5 ? '🟧' : '🟥');
  const titel = pw.modus === 'mix' ? 'Tages-Wolken ' + new Date().toLocaleDateString('de-DE') : PW_MODI[pw.modus].name + ' (' + PW_STUFEN[pw.stufe].name + ')';
  const text = '📈 Punktwolke – ' + titel + '\n' + fmt(summe) + ' / 50 ' + pw.punkte.map(k).join('') + '\nSiehst du den Zusammenhang? Gleiche Wolken:';
  if (navigator.share) {
    try { await navigator.share({ title: 'Punktwolke', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('pwTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('pwTeilenMsg').textContent = url; }
}

// ---------- Hilfe: Spickzettel und geführte Lernrunde ----------
const pwDemo = (k, r, n = 70, aus = 0) => pwWolke(zufallsGenerator('pw-lern-' + k), n, r, aus);
const pwStreck = (w, fx, fy) => ({ ...w, x: w.x.map((v) => v * fx), y: w.y.map((v) => v * fy) });
const PW_TABELLE = [['1 : 1', '0'], ['1 : 1,5', '0,4'], ['1 : 2', '0,6'], ['1 : 3', '0,8'], ['1 : 5', '0,92'], ['1 : 10', '0,98']];
const pwTabelle = () => '<div class="pl-tabelle"><span>Breite : Länge</span>' + PW_TABELLE.map((z) => '<b>' + z[0] + '</b>').join('')
  + '<span>→ r ≈</span>' + PW_TABELLE.map((z) => '<b>' + z[1] + '</b>').join('') + '</div>';
const pwFormenBild = () => '<div class="pl-formen">' + PW_FORMEN.map((f, i) => '<figure>'
  + pwSvg(pwDemo('form' + i, [0.06, 0.42, 0.76, 0.95][i]), { ellipse: true, ruhig: true })
  + '<figcaption><b>' + f.emoji + ' ' + f.name + '</b>' + fmt(f.von) + ' bis ' + fmt(f.bis) + '</figcaption></figure>').join('') + '</div>';
const pwPaar = (a, b) => '<div class="pl-paar"><figure>' + a[0] + '<figcaption>' + a[1] + '</figcaption></figure><figure>' + b[0] + '<figcaption>' + b[1] + '</figcaption></figure></div>';

const PW_LERN = [
  { titel: 'Was zeigt eine Punktwolke?',
    bild: () => '<div class="pw-gross">' + pwSvg(pwDemo('start', 0.72)) + '</div>',
    text: () => 'Jeder Punkt ist ein Paar aus zwei Werten, zum Beispiel <b>Körpergröße</b> (x, nach rechts) und <b>Schuhgröße</b> (y, nach oben) von 70 Menschen.<br><br>'
      + 'Die Zahl <b>r</b> sagt, wie eng beides zusammenhängt: <b>+1</b> = alle Punkte auf einer steigenden Linie, <b>0</b> = gar kein Zusammenhang, <b>−1</b> = alle auf einer fallenden Linie.<br><br>Du schätzt r in <b>drei Schritten</b>.' },
  { titel: 'Schritt 1: Richtung → Vorzeichen',
    bild: () => pwPaar([pwSvg(pwDemo('rauf', 0.75), { mitLinie: true }), '↗ steigt: r ist <b>plus</b>'], [pwSvg(pwDemo('runter', -0.75), { mitLinie: true }), '↘ fällt: r ist <b>minus</b>']),
    text: () => 'Schau zuerst, wohin die Wolke zeigt. Von links unten nach rechts oben: <b>plus</b>. Von links oben nach rechts unten: <b>minus</b>.<br><br>Siehst du gar keine Richtung, liegt r nahe <b>0</b>, dann bist du schon fertig.' },
  { titel: 'Schritt 2: Form → grobe Stärke',
    bild: pwFormenBild,
    text: () => 'Stell dir ein Gummiband um die Wolke vor (gelb). Je <b>dünner</b> es ist, desto <b>stärker</b> der Zusammenhang. Vier Formen reichen für eine gute Schätzung: <b>Kreis, Ei, Zigarre, Strich</b>.' },
  { titel: 'Schritt 3: Breite ÷ Länge → genauer Wert',
    bild: () => { const w = pwDemo('mess', 0.8); return '<div class="pw-gross">' + pwSvg(w, { ellipse: true, achsen: true }) + '</div>' + pwTabelle(); },
    text: () => { const F = pwForm(pwDemo('mess', 0.8)); return 'Vergleiche die <b class="pl-gelb">Breite</b> (kurze Achse) mit der <b class="pl-rot">Länge</b> (lange Achse). '
      + 'Hier ist die Wolke etwa <b>' + pwQText(F.q) + '</b> so breit wie lang. Laut Tabelle also r ≈ <b>0,8</b>, und weil sie steigt: <b>+0,8</b>. Das echte r ist hier ' + rText(pwDemo('mess', 0.8).r) + '.'; } },
  { titel: 'Falle 1: Steil heißt nicht stark',
    bild: () => pwPaar([pwSvg(pwStreck(pwDemo('flach', 0.95), 1, 0.3), { mitLinie: true, fest: true }), 'flach, aber dünn<br>r = <b>0,95</b>'],
      [pwSvg(pwStreck(pwDemo('steil', 0.55), 0.45, 1), { mitLinie: true, fest: true }), 'steil, aber breit<br>r = <b>0,55</b>']),
    text: () => 'Wie <b>steil</b> die Linie ist, spielt keine Rolle. Es zählt nur, wie <b>eng</b> die Punkte an ihr liegen. Die flache, dünne Wolke links hängt viel stärker zusammen als die steile, breite rechts.' },
  { titel: 'Falle 2: Ausreißer',
    bild: () => '<div class="pw-gross">' + pwSvg(pwDemo('raus', 0.85, 30, 2), { mitLinie: true, ausreisser: true }) + '</div>',
    text: () => 'Bei wenigen Punkten können schon ein, zwei <b class="pl-rot">Ausreißer</b> r kräftig verändern. Ohne die roten Punkte wäre r hier <b>0,85</b>, mit ihnen nur <b>' + rText(pwDemo('raus', 0.85, 30, 2).r) + '</b>.<br><br>Tipp: Liegen Ausreißer <b>gegen</b> den Trend, schätze etwas schwächer, als die Hauptwolke aussieht.' },
  { titel: 'Jetzt du!', ueben: true },
];
const PW_UEBUNGEN = [0.8, -0.5, 0.3];
let pl = null;

function punkteLernen() {
  pl = { schritt: 0, u: 0, phase: 'richtung', punkte: [] };
  $('pwRunde').textContent = '🧑‍🏫 Lernrunde';
  zeigePwTeil('lernen');
  plZeigen();
}
function plZeigen() {
  const S = PW_LERN[pl.schritt];
  $('plSchritte').innerHTML = PW_LERN.map((_, i) => '<i class="' + (i < pl.schritt ? 'fertig' : i === pl.schritt ? 'jetzt' : '') + '"></i>').join('');
  $('plTitel').textContent = S.titel;
  $('plZurueck').disabled = pl.schritt === 0;
  if (S.ueben) { plUeben(); return; }
  $('plBild').innerHTML = S.bild();
  $('plText').innerHTML = S.text();
  $('plAktion').innerHTML = '';
  $('plWeiter').hidden = false;
  $('plWeiter').textContent = pl.schritt === PW_LERN.length - 2 ? 'Selbst probieren ›' : 'Weiter ›';
  $('pw-lernen').scrollIntoView({ block: 'start', behavior: wenigBewegung() ? 'auto' : 'smooth' });
}
function plUeben() {
  const r = PW_UEBUNGEN[pl.u], w = pwDemo('ueb' + pl.u, r, 60), F = pwForm(w);
  const ziel = Math.abs(r) < 0.2 ? 'keine' : r > 0 ? 'rauf' : 'runter';
  const formRichtig = pwFormVon(r);
  const kopf = '<b>Übung ' + (pl.u + 1) + ' / ' + PW_UEBUNGEN.length + '</b> · ';
  $('plWeiter').hidden = true;
  const bild = (opt) => { $('plBild').innerHTML = '<div class="pw-gross">' + pwSvg(w, { ruhig: true, ...opt }) + '</div>'; };
  const knoepfe = (liste, fn) => {
    $('plAktion').innerHTML = '<div class="pl-wahl">' + liste.map((k) => '<button class="btn secondary" type="button" data-k="' + k[0] + '">' + k[1] + '</button>').join('') + '</div>';
    $('plAktion').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => fn(b.dataset.k)));
  };
  if (pl.phase === 'richtung') {
    bild({ ruhig: false });
    $('plText').innerHTML = kopf + 'Schritt 1: Wohin zeigt die Wolke?';
    knoepfe([['rauf', '↗ steigt'], ['runter', '↘ fällt'], ['keine', '↔ keine Richtung']], (k) => {
      pl.richtungOk = k === ziel;
      pl.phase = 'form'; plUeben();
      $('plText').innerHTML = (pl.richtungOk ? '✅ Richtig! ' : '❌ Nicht ganz: ') + 'Die Wolke ' + (ziel === 'rauf' ? 'steigt, r ist also <b>plus</b>.' : ziel === 'runter' ? 'fällt, r ist also <b>minus</b>.' : 'hat keine klare Richtung.')
        + '<br>' + kopf + 'Schritt 2: Welche Form hat sie?';
    });
  } else if (pl.phase === 'form') {
    bild({ mitLinie: true });
    knoepfe(PW_FORMEN.map((f) => [f.id, f.emoji + ' ' + f.name]), (k) => {
      const gewaehlt = PW_FORMEN.find((f) => f.id === k);
      const ok = k === formRichtig.id || Math.abs(F.rSchaetz) >= gewaehlt.von - 0.03 && Math.abs(F.rSchaetz) <= gewaehlt.bis + 0.03;
      pl.form = ok ? gewaehlt : formRichtig;
      pl.phase = 'wert'; plUeben();
      $('plText').innerHTML = (ok ? '✅ Passt! ' : '❌ Eher ' + formRichtig.emoji + ' <b>' + formRichtig.name + '</b>. ')
        + 'Die Wolke ist etwa <b>' + pwQText(F.q) + '</b> so breit wie lang, r liegt also ungefähr zwischen <b>' + fmt(pl.form.von) + '</b> und <b>' + fmt(pl.form.bis) + '</b>.'
        + '<br>' + kopf + 'Schritt 3: Schieb den Regler an die passende Stelle.';
    });
  } else if (pl.phase === 'wert') {
    bild({ ellipse: true, achsen: true });
    const vz = r < 0 ? -1 : 1, start = Math.round(vz * (pl.form.von + pl.form.bis) / 2 * 100);
    $('plAktion').innerHTML = '<div class="pw-wert" id="plWert"></div><input class="pw-regler" id="plRegler" type="range" min="-100" max="100" step="1" value="' + start + '" aria-label="Geschätztes r">'
      + '<div class="pw-skala"><span>−1 fallend</span><span>0 · kein</span><span>+1 steigend</span></div>'
      + pwTabelle() + '<button class="btn pw-gross-btn" id="plPruefen" type="button">Prüfen ✓</button>';
    const reg = $('plRegler');
    const zeigen = () => { $('plWert').textContent = 'r = ' + rText(Number(reg.value) / 100); reg.style.setProperty('--pos', ((Number(reg.value) + 100) / 2) + '%'); };
    reg.addEventListener('input', zeigen); zeigen();
    $('plPruefen').onclick = () => {
      const tipp = Number(reg.value) / 100, p = pwPunkte(w.r, tipp);
      pl.punkte.push(p);
      const letzte = pl.u === PW_UEBUNGEN.length - 1;
      $('plText').innerHTML = (p >= 8 ? '🎯 Super! ' : p >= 5 ? '👍 Gar nicht schlecht! ' : '🤔 Noch etwas daneben. ') + 'Das echte r ist <b>' + rText(w.r) + '</b>, du hattest <b>' + rText(tipp) + '</b>. Das wären <b>' + fmt(p) + ' / 10</b> Punkte.'
        + '<br>' + pwEinordnung(w.r);
      $('plAktion').innerHTML = '<button class="btn pw-gross-btn" id="plNaechste" type="button">' + (letzte ? 'Fertig 🎓' : 'Nächste Übung ›') + '</button>';
      if (p >= 9.5) konfetti(18, ['📈', '🎯', '✨']);
      $('plNaechste').onclick = () => {
        if (!letzte) { pl.u++; pl.phase = 'richtung'; plUeben(); return; }
        const summe = pl.punkte.reduce((a, b) => a + b, 0);
        $('plTitel').textContent = 'Geschafft! 🎓';
        $('plBild').innerHTML = pwFormenBild();
        $('plText').innerHTML = 'Du hast in den Übungen <b>' + fmt(Math.round(summe * 10) / 10) + ' von 30</b> Punkten geholt. Merk dir: <b>Richtung → Form → Breite : Länge</b>. Den Spickzettel findest du jederzeit oben rechts unter <b>?</b>.';
        $('plAktion').innerHTML = '<button class="btn pw-gross-btn" id="plLos" type="button">Echtes Spiel starten 📈</button>';
        $('plLos').onclick = () => { pl = null; pwModus = 'schaetzen'; punkteStart({ modus: 'schaetzen' }); };
        $('plSchritte').querySelectorAll('i').forEach((i) => { i.className = 'fertig'; });
      };
    };
  }
}

function pwHilfeOeffnen() {
  const imSpiel = !$('pw-spiel').hidden || !$('pw-aufloesung').hidden;
  $('pwHilfeInhalt').innerHTML = '<h3>So schätzt du r</h3>'
    + '<div class="pl-schritt"><span>1</span><div><b>Richtung → Vorzeichen</b>↗ steigt = plus · ↘ fällt = minus · keine Richtung ≈ 0</div></div>'
    + '<div class="pl-schritt"><span>2</span><div><b>Form → grobe Stärke</b>Je dünner die Wolke, desto näher an ±1.</div></div>'
    + pwFormenBild()
    + '<div class="pl-schritt"><span>3</span><div><b>Breite : Länge → feiner Wert</b>Wie oft passt die Breite in die Länge?</div></div>'
    + pwTabelle()
    + '<div class="pl-tipps"><b>Fallen</b><ul><li>Die <b>Steigung</b> ist egal, nur die Enge zählt.</li><li><b>Ausreißer</b> gegen den Trend ziehen r Richtung 0.</li>'
    + '<li>Beim <b>Sortieren</b>: fallende Wolken sind immer kleiner als steigende. Innerhalb einer Richtung nach Dicke ordnen.</li></ul></div>';
  $('pwHilfeLernen').hidden = imSpiel;
  const d = $('pwHilfe');
  if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
}
const pwHilfeZu = () => { const d = $('pwHilfe'); if (d.close) d.close(); else d.removeAttribute('open'); };

$('pwHilfeBtn').addEventListener('click', pwHilfeOeffnen);
$('pwHilfeZu').addEventListener('click', pwHilfeZu);
$('pwHilfe').addEventListener('click', (e) => { if (e.target === $('pwHilfe')) pwHilfeZu(); });
$('pwHilfeLernen').addEventListener('click', () => { pwHilfeZu(); pw = null; punkteLernen(); });
$('pwLernenBtn').addEventListener('click', punkteLernen);
$('plWeiter').addEventListener('click', () => { if (pl.schritt < PW_LERN.length - 1) { pl.schritt++; plZeigen(); } });
$('plZurueck').addEventListener('click', () => { if (pl.schritt > 0) { pl.schritt--; pl.u = 0; pl.phase = 'richtung'; pl.punkte = []; plZeigen(); } });

// ---------- Knöpfe ----------
$('pwModi').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { pwModus = b.dataset.modus; punkteIntro(); }));
$('pwStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { pwStufe = b.dataset.stufe; punkteIntro(); }));
$('pwLos').addEventListener('click', () => {
  if (pwGegner) { const g = pwGegner; pwGegner = null; $('pwChallenge').hidden = true; punkteStart({ modus: g.modus, stufe: g.stufe, seed: g.seed, gegner: g }); }
  else punkteStart();
});
$('pwTagBtn').addEventListener('click', () => punkteStart({ taeglich: true }));
$('pwWeiter').addEventListener('click', () => { pw.i++; if (pw.i >= PW_RUNDEN) punkteEnde(); else pwRundeZeigen(); });
$('pwNochmalSpiel').addEventListener('click', () => punkteStart({ modus: pw.modus === 'mix' ? pwModus : pw.modus, stufe: pw.stufe }));
$('pwTeilen').addEventListener('click', punkteTeilen);
$('pwZurueck').addEventListener('click', () => {
  if ((pw || pl) && $('pw-intro').hidden) { pw = null; pl = null; punkteIntro(); return; }   // aus dem Spiel erst zurück zur Auswahl
  pw = null;
  zeigeHub();
});
$('hubPunkte').addEventListener('click', () => { merkeZuletzt('punkte'); zoomZu($('hubPunkte'), () => { show('punkte', '📈 Punktwolke'); punkteIntro(); }); });

// Challenge-Link: ?punkte=<seed>&m=…&stufe=…&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('punkte')) return;
  const modus = (PW_MODI[q.get('m')] || q.get('m') === 'mix') ? q.get('m') : 'schaetzen';
  const stufe = PW_STUFEN[q.get('stufe')] ? q.get('stufe') : 'leicht';
  pwGegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('punkte'), modus, stufe };
  history.replaceState(null, '', location.pathname);
  show('punkte', '📈 Punktwolke');
  if (modus !== 'mix') { pwModus = modus; pwStufe = stufe; }
  punkteIntro();
  $('pwChallenge').hidden = false;
  $('pwChallenge').textContent = pwGegner.name + ' hat ' + fmt(pwGegner.punkte) + ' / 50 Punkte ('
    + (modus === 'mix' ? 'Tages-Wolken' : PW_MODI[modus].name + ', ' + PW_STUFEN[stufe].name) + '). Gleiche Wolken – schaffst du mehr?';
})();
