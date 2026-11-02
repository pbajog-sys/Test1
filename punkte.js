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
// Punktwolke als SVG auf Millimeterpapier. mitLinie = Regressionsgerade (y auf x).
function pwSvg(w, opt = {}) {
  const G = 300, P = 18;
  const ex = (v) => [Math.min(...v), Math.max(...v)];
  const [x0, x1] = ex(w.x), [y0, y1] = ex(w.y);
  const sx = (x) => P + (x - x0) / (x1 - x0 || 1) * (G - 2 * P);
  const sy = (y) => G - P - (y - y0) / (y1 - y0 || 1) * (G - 2 * P);
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
    linie = '<line class="pw-linie" x1="' + sx(x0) + '" y1="' + sy(f(x0)) + '" x2="' + sx(x1) + '" y2="' + sy(f(x1)) + '"/>';
  }
  return '<svg class="pw-svg" viewBox="0 0 ' + G + ' ' + G + '"><rect class="pw-papier" width="' + G + '" height="' + G + '" rx="10"/>'
    + '<path class="pw-achse" d="M' + P + ' ' + (G - P) + 'H' + (G - 6) + 'M' + P + ' ' + (G - P) + 'V6"/>' + linie + '<g>' + pkt + '</g></svg>';
}

// ---------- Spielablauf ----------
let pw = null;
let pwModus = 'schaetzen', pwStufe = 'leicht', pwGegner = null;
const pwStore = () => loadJson(PW_KEY);
const pwTeile = ['intro', 'spiel', 'aufloesung', 'ende'];
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
    box.innerHTML = '<div class="pw-gross klein">' + pwSvg(rd.wolke, { mitLinie: true, ausreisser: true, ruhig: true }) + '</div>'
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
  const liste = $('pwListe');
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
  if (pw && $('pw-intro').hidden) { pw = null; punkteIntro(); return; }   // aus dem Spiel erst zurück zur Auswahl
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
