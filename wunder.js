// 🌀 Wundermuster – vier einfache Regeln, aus denen erstaunliche Muster entstehen, jeweils mit Schätzfrage und Beat:
//  🐜 Langtons Ameise (Chaos → „Autobahn“ ab Schritt 9.977) · 🔢 Binär-Beat (jedes Bit ist ein Instrument, plus Quiz)
//  🐉 Drachen-Streifen (Papierstreifen n-mal falten und aufklappen → Drachenkurve) · 📈 27 → 1 (Collatz, 111 Schritte, Gipfel 9.232)
// Klang: Bausteine aus falten.js (ftAudio, ftKick, ftRauschen, ftSaw, ftTaktStarten, ftLaut).
// Speicher: walquiz.wunder.v1 = { ameise: { runden, autobahn }, binaer: { best, runden }, drache: { runden, richtig }, collatz: { runden, funde: { 100: [n, s], 1000: …, 10000: … } } }
const WU_KEY = 'walquiz.wunder.v1';
let wu = null, wuRaf = 0, wuTimer = null, wuSeq = null;
const wuStore = () => { const s = loadJson(WU_KEY); s.ameise = s.ameise || { runden: 0 }; s.binaer = s.binaer || { runden: 0, best: 0 }; s.drache = s.drache || { runden: 0 }; s.collatz = s.collatz || { runden: 0, funde: {} }; return s; };
const wuZahl = (n) => Math.round(n).toLocaleString('de-DE');
const wuAktiv = () => { const sc = $('screen-wunder'); return !!(sc && sc.classList.contains('active')); };
function wuStopp() {
  cancelAnimationFrame(wuRaf); clearInterval(wuTimer); clearTimeout(wuTimer); wuTimer = null;
  if (wuSeq) { clearInterval(wuSeq); wuSeq = null; }
  ftTaktStoppen(); wu = null;
}
function wuCanvas(id, faktor, min, max) {
  const cv = $(id), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 360, H = Math.round(Math.max(min, Math.min(window.innerHeight * faktor, max)));
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { cv, c, W, H };
}
// Frage mit Antwortknöpfen; weiter(ok) nach „Weiter“
function wuFrage(ziel, frage, optionen, richtig, erkl, weiter) {
  ziel.innerHTML = '<div class="gl-frage wu-frage"><p>' + frage + '</p><div class="gl-optionen">' + optionen.map((o, i) => '<button type="button" class="gl-opt" data-o="' + i + '">' + o + '</button>').join('') + '</div><div class="wu-erkl"></div></div>';
  let fertig = false;
  ziel.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
    if (fertig) return; fertig = true;
    const ok = +b.dataset.o === richtig;
    b.classList.add(ok ? 'richtig' : 'falsch'); ziel.querySelector('[data-o="' + richtig + '"]').classList.add('richtig');
    ziel.querySelector('.wu-erkl').innerHTML = '<p><b>' + (ok ? 'Richtig! ' : 'Nicht ganz. ') + '</b>' + erkl + '</p><button type="button" class="btn ft-los wu-los" id="wuWeiter">Weiter</button>';
    $('wuWeiter').addEventListener('click', () => weiter(ok));
  }));
}
function wuTonKnopf(id) {
  const b = $(id); if (!b) return;
  b.textContent = ftAk && ftAk.stumm ? '🔇' : '🔊';
  b.addEventListener('click', () => { const A = ftAudio(); if (!A) return; A.stumm = !A.stumm; b.textContent = A.stumm ? '🔇' : '🔊'; });
}
// Einzelner Ton, auf das nächste Achtel des laufenden Beats gelegt
function wuTon(midi, laut = 0.08, dauer = 0.2, hell = 4200) {
  const A = ftAudio(); if (!A || A.stumm) return;
  const jetzt = A.c.currentTime; let t = jetzt + 0.01;
  if (A.takt) { const rel = (jetzt - A.start) / FT_ACHTEL; t = A.start + Math.ceil(rel - 0.15) * FT_ACHTEL; if (t < jetzt) t = jetzt + 0.01; }
  ftSaw(A, t, [midi], dauer, laut, hell);
}
function wuEnde(html, knoepfe) {
  const d = document.createElement('div'); d.className = 'ft-ergebnis';
  d.innerHTML = '<div class="ft-karte wu-karte">' + html + '<div class="ft-karte-knoepfe">' + knoepfe.map((k, i) => '<button type="button" class="btn ' + (i ? 'secondary' : 'ft-los wu-los') + '" data-k="' + i + '">' + k[0] + '</button>').join('') + '</div></div>';
  $('wuInhalt').appendChild(d);
  d.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { d.remove(); knoepfe[+b.dataset.k][1](); }));
}

// ---------- Menü ----------
const WU_MODI = [
  { id: 'ameise', emoji: '🐜', name: 'Langtons Ameise', text: 'Zwei Regeln, eine Ameise – erst Chaos, dann plötzlich Ordnung.' },
  { id: 'binaer', emoji: '🔢', name: 'Binär-Beat', text: 'Zähl von 0 bis 255 – jedes Bit ist ein Instrument. Plus Binär-Quiz.' },
  { id: 'drache', emoji: '🐉', name: 'Drachen-Streifen', text: 'Einen Papierstreifen falten und aufklappen – welche Form steckt darin?' },
  { id: 'collatz', emoji: '📈', name: '27 → 1', text: 'Ungerade ×3+1, gerade ÷2. Kommt jede Zahl bei 1 an?' },
];
function wuOeffnen() { show('wunder', '🌀 Wundermuster'); wuMenue(); }
function wuMenue() {
  wuStopp();
  const st = wuStore();
  const info = { ameise: st.ameise.runden ? 'Gespielt: ' + st.ameise.runden + '×' : '', binaer: st.binaer.runden ? 'Bestes Quiz: ' + st.binaer.best + ' / 10' : '', drache: st.drache.runden ? 'Gespielt: ' + st.drache.runden + '×' : '', collatz: Object.keys(st.collatz.funde).length ? 'Rekorde gefunden: ' + Object.keys(st.collatz.funde).filter((k) => WU_CHAMPS[k] && st.collatz.funde[k][0] === WU_CHAMPS[k][0]).length + ' / 3' : '' };
  $('wuTitel').textContent = '🌀 Wundermuster';
  $('wuInhalt').innerHTML = '<div class="ft-intro wu-intro"><h2 class="wu-h">Wundermuster</h2><p>Vier winzige Regeln – und was daraus wächst. Erst schätzen, dann staunen. 🔊</p>'
    + '<div class="wu-modi">' + WU_MODI.map((m) => '<button type="button" class="wu-modus wu-m-' + m.id + '" data-modus="' + m.id + '"><span class="wu-me">' + m.emoji + '</span><span class="wu-mt"><b>' + m.name + '</b><small>' + m.text + '</small>' + (info[m.id] ? '<em>' + info[m.id] + '</em>' : '') + '</span></button>').join('') + '</div></div>';
  $('wuInhalt').querySelectorAll('[data-modus]').forEach((b) => b.addEventListener('click', () => { ftAudio(); ({ ameise: amIntro, binaer: biIntro, drache: drIntro, collatz: coIntro })[b.dataset.modus](); }));
}

// =====================================================================
// 🐜 Langtons Ameise
// =====================================================================
const AM_REGELN = [
  { id: 'RL', name: 'Klassisch', text: 'Weiß → rechts, Schwarz → links' },
  { id: 'RLR', name: 'Wildwuchs', text: '3 Farben: R L R' },
  { id: 'LLRR', name: 'Herz', text: '4 Farben: L L R R – wächst symmetrisch' },
  { id: 'LRRRRRLLR', name: 'Festung', text: '9 Farben – baut ein Quadrat' },
];
const AM_FARBEN = ['', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#fb923c', '#e879f9', '#a3e635'];
const AM_DX = [0, 1, 0, -1], AM_DY = [-1, 0, 1, 0], AM_PFEIL = ['↑', '→', '↓', '←'];
function amIntro() {
  wuStopp(); $('wuTitel').textContent = '🐜 Ameise';
  $('wuInhalt').innerHTML = '<div class="ft-intro"><div class="wu-logo">🐜</div><h2 class="wu-h">Langtons Ameise</h2>'
    + '<p>Eine Ameise läuft auf einem karierten Feld. Steht sie auf einem <b>weißen</b> Feld, dreht sie sich nach <b>rechts</b>, auf einem <b>schwarzen</b> nach <b>links</b>. Dann färbt sie das Feld um und geht einen Schritt weiter.</p>'
    + '<div id="amFrage"></div></div>';
  wuFrage($('amFrage'), 'Was passiert auf Dauer?', ['Sie läuft ewig im Kreis', 'Sie malt ein Schachbrett', 'Erst Chaos, dann baut sie eine gerade Straße', 'Nur Chaos, für immer'], 2,
    'Rund 10.000 Schritte lang sieht alles zufällig aus. Dann baut die Ameise plötzlich eine schnurgerade „Autobahn“ – und das für immer. Warum genau, kann bis heute niemand beweisen.',
    (ok) => amStart('RL', ok));
}
function amStart(regel, frageOk) {
  wuStopp(); ftLaut = 0;
  const N = 640;
  wu = { art: 'ameise', regel, k: regel.length, N, g: new Uint8Array(N * N), alter: new Int32Array(N * N), x: N >> 1, y: N >> 1, d: 0, schritt: 0, schwarz: 0, turns: new Uint8Array(200000), minX: N >> 1, maxX: N >> 1, minY: N >> 1, maxY: N >> 1, autobahn: -1, frageOk, fertig: false, turbo: 1, rest: 0, verlauf: [0], blende: 0, sicht: null, tausender: 0 };
  $('wuTitel').textContent = '🐜 Ameise';
  $('wuInhalt').innerHTML = '<div class="ft-kopf"><div class="ft-zahl wu-zahl" id="amZahl"></div><div class="wu-chips" id="amChips"></div>'
    + '<div class="wu-regeln">' + [...regel].map((r, i) => '<span style="--f:' + (i ? AM_FARBEN[i] : '#e2e8f0') + '"><i></i>' + (i ? 'Farbe ' + (i + 1) : 'Weiß') + ' → ' + (r === 'R' ? 'rechts' : 'links') + '</span>').join('') + '</div></div>'
    + '<canvas id="amBild" class="ft-bild wu-bild"></canvas><canvas id="amKurve" class="wu-kurve"></canvas>'
    + '<div class="ft-unten"><div class="ft-text" id="amText"></div><div class="wu-knoepfe"><button type="button" class="ft-ton" id="amTon"></button><button type="button" class="btn secondary" id="amTurbo">⏩ Schneller</button><button type="button" class="btn secondary" id="amRegel">🎨 Andere Regel</button></div></div>';
  Object.assign(wu, wuCanvas('amBild', 0.46, 280, 520));
  const k2 = wuCanvas('amKurve', 0, 64, 64); wu.c2 = k2.c; wu.W2 = k2.W; wu.H2 = k2.H;
  wuTonKnopf('amTon');
  $('amTurbo').addEventListener('click', () => { wu.turbo = wu.turbo >= 16 ? 1 : wu.turbo * 4; $('amTurbo').textContent = wu.turbo > 1 ? '⏩ ×' + wu.turbo : '⏩ Schneller'; });
  $('amRegel').addEventListener('click', amRegelWahl);
  ftTaktStarten();
  let letzt = performance.now();
  const lauf = (jetzt) => {
    if (!wu || wu.art !== 'ameise') return;
    const dt = Math.min(0.1, (jetzt - letzt) / 1000); letzt = jetzt;
    if (!wu.fertig) {
      const s = wu.schritt, tempo = (s < 24 ? 5 : s < 200 ? 30 : s < 1500 ? 120 : 360) * wu.turbo;
      wu.rest += dt * tempo;
      let n = Math.floor(wu.rest); wu.rest -= n;
      while (n-- > 0 && !wu.fertig) amSchritt();
    }
    amZeichnen(); amAnzeige();
    wuRaf = requestAnimationFrame(lauf);
  };
  wuRaf = requestAnimationFrame(lauf);
}
function amSchritt() {
  const w = wu, i = w.y * w.N + w.x, s = w.g[i], r = w.regel[s];
  w.d = (w.d + (r === 'R' ? 1 : 3)) % 4;
  const neu = (s + 1) % w.k; w.g[i] = neu;
  if (s === 0) w.schwarz++; if (neu === 0) w.schwarz--;
  w.alter[i] = w.schritt;
  if (w.schritt < w.turns.length) w.turns[w.schritt] = r === 'R' ? 0 : 1;
  w.x += AM_DX[w.d]; w.y += AM_DY[w.d]; w.schritt++;
  if (w.x < w.minX) w.minX = w.x; if (w.x > w.maxX) w.maxX = w.x; if (w.y < w.minY) w.minY = w.y; if (w.y > w.maxY) w.maxY = w.y;
  if (w.schritt % 50 === 0) w.verlauf.push(w.schwarz);
  if (w.schritt <= 24) wuTon(72 + [0, 2, 4, 7, 9][w.schritt % 5] + (r === 'R' ? 0 : -12), 0.05, 0.12);
  ftLaut = Math.min(40, Math.round(Math.log2(1 + w.schritt) * 2.9));
  if (Math.floor(w.schritt / 1000) > w.tausender) { w.tausender = Math.floor(w.schritt / 1000); ftFaltKlang(w.tausender + 4, false); }
  // Autobahn: Die Drehungen wiederholen sich mit Periode 104 – frühester Beginn der Wiederholung
  if (w.autobahn < 0 && w.schritt > 600 && w.schritt % 104 === 0 && w.schritt < w.turns.length) {
    let k = w.schritt - 105;
    while (k >= 0 && w.turns[k] === w.turns[k + 104]) k--;
    if (w.schritt - (k + 1) >= 104 * 4) { w.autobahn = k + 1; w.blende = performance.now(); ftFaltKlang(30, true); if (navigator.vibrate) navigator.vibrate([20, 40, 20]); }
  }
  const rand = 4;
  if (w.x < rand || w.y < rand || w.x >= w.N - rand || w.y >= w.N - rand || (w.autobahn >= 0 && w.schritt > w.autobahn + 2600) || w.schritt >= 60000) amFertig();
}
function amPhase() {
  const w = wu;
  if (w.autobahn >= 0) return ['Autobahn', '#fde68a'];
  if (w.regel !== 'RL') return ['läuft', '#a5b4fc'];
  return w.schritt < 400 ? ['Ordnung', '#67e8f9'] : ['Chaos', '#f9a8d4'];
}
function amAnzeige() {
  const w = wu, [ph, pf] = amPhase();
  $('amZahl').innerHTML = wuZahl(w.schritt) + '<small>Schritte</small>';
  $('amChips').innerHTML = '<span>Gefärbt <b>' + wuZahl(w.schwarz) + '</b></span><span>Phase <b style="color:' + pf + '">' + ph + '</b></span><span>Richtung <b>' + AM_PFEIL[w.d] + '</b></span>';
  $('amText').textContent = w.autobahn >= 0 ? 'Autobahn ab Schritt ' + wuZahl(w.autobahn) + ' – alle 104 Schritte dasselbe Muster.' : w.regel !== 'RL' ? AM_REGELN.find((r) => r.id === w.regel).text : w.schritt < 400 ? 'Am Anfang sieht alles noch ordentlich und symmetrisch aus …' : w.schritt < 9000 ? 'Chaos. Kein Muster, nirgends …' : 'Gleich passiert etwas …';
}
function amZeichnen() {
  const w = wu, { c, W, H } = w, now = performance.now();
  c.fillStyle = '#0d0b26'; c.fillRect(0, 0, W, H);
  // Ausschnitt weich nachführen
  const ziel = { x0: w.minX - 3, x1: w.maxX + 4, y0: w.minY - 3, y1: w.maxY + 4 };
  const mitte = [(ziel.x0 + ziel.x1) / 2, (ziel.y0 + ziel.y1) / 2], gr = Math.max(14, (ziel.x1 - ziel.x0) / W * H, ziel.y1 - ziel.y0);
  if (!w.sicht) w.sicht = { cx: mitte[0], cy: mitte[1], gr };
  w.sicht.cx += (mitte[0] - w.sicht.cx) * 0.12; w.sicht.cy += (mitte[1] - w.sicht.cy) * 0.12; w.sicht.gr += (gr - w.sicht.gr) * 0.12;
  const z = Math.min(H / w.sicht.gr, 28), ox = W / 2 - w.sicht.cx * z, oy = H / 2 - w.sicht.cy * z;
  if (z > 7) {
    c.strokeStyle = 'rgba(148,163,255,.07)'; c.lineWidth = 1; c.beginPath();
    for (let gx = Math.floor(-ox / z); gx * z + ox < W; gx++) { c.moveTo(gx * z + ox, 0); c.lineTo(gx * z + ox, H); }
    for (let gy = Math.floor(-oy / z); gy * z + oy < H; gy++) { c.moveTo(0, gy * z + oy); c.lineTo(W, gy * z + oy); }
    c.stroke();
  }
  const x0 = Math.max(0, Math.floor(-ox / z)), x1 = Math.min(w.N - 1, Math.ceil((W - ox) / z)), y0 = Math.max(0, Math.floor(-oy / z)), y1 = Math.min(w.N - 1, Math.ceil((H - oy) / z));
  const pad = z > 4 ? Math.max(1, z * 0.12) : 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * w.N + x, s = w.g[i]; if (!s) continue;
    if (w.k === 2) { const a = Math.min(1, (w.schritt - w.alter[i]) / 700); c.fillStyle = 'rgb(' + Math.round(103 + (167 - 103) * a) + ',' + Math.round(232 + (139 - 232) * a) + ',' + Math.round(249 + (250 - 249) * a) + ')'; }
    else c.fillStyle = AM_FARBEN[s];
    c.fillRect(x * z + ox + pad, y * z + oy + pad, z - 2 * pad, z - 2 * pad);
  }
  // Ameise als Dreieck
  const ax = (w.x + 0.5) * z + ox, ay = (w.y + 0.5) * z + oy, r = Math.max(4, z * 0.55);
  c.save(); c.translate(ax, ay); c.rotate(w.d * Math.PI / 2); c.fillStyle = '#fde047'; c.shadowColor = '#fde047'; c.shadowBlur = 12;
  c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.75, r * 0.7); c.lineTo(-r * 0.75, r * 0.7); c.closePath(); c.fill(); c.restore();
  if (w.autobahn >= 0 && now - w.blende < 3000) {
    const a = Math.min(1, (3000 - (now - w.blende)) / 600);
    c.globalAlpha = a; c.fillStyle = '#fde68a'; c.font = '900 ' + Math.round(W / 8) + 'px system-ui'; c.textAlign = 'center'; c.shadowColor = '#f59e0b'; c.shadowBlur = 20; c.fillText('AUTOBAHN!', W / 2, H * 0.16); c.shadowBlur = 0; c.globalAlpha = 1;
  }
  // unten: letzte 104 Drehungen und die Zahl der gefärbten Felder
  const c2 = w.c2, W2 = w.W2, H2 = w.H2; c2.clearRect(0, 0, W2, H2);
  const n = Math.min(104, w.schritt), bw = W2 / 104;
  for (let j = 0; j < n; j++) { const t = w.turns[Math.min(w.turns.length - 1, w.schritt - n + j)]; c2.fillStyle = t ? '#fb7185' : '#67e8f9'; c2.fillRect(j * bw, 0, Math.max(1, bw - 1), 16); }
  c2.fillStyle = 'rgba(199,208,245,.6)'; c2.font = '600 10px system-ui'; c2.textAlign = 'left'; c2.fillText('letzte 104 Drehungen  R / L' + (w.autobahn >= 0 ? '  · wiederholen sich' : ''), 0, 30);
  const v = w.verlauf, mx = Math.max(10, ...v.slice(-400));
  c2.strokeStyle = '#fde68a'; c2.lineWidth = 1.5; c2.beginPath();
  const vs = v.slice(-400); vs.forEach((y, j) => { const px = j / Math.max(1, vs.length - 1) * W2, py = H2 - 2 - y / mx * 26; j ? c2.lineTo(px, py) : c2.moveTo(px, py); }); c2.stroke();
  c2.textAlign = 'right'; c2.fillText('gefärbte Felder', W2, 30);
}
function amRegelWahl() {
  const f = document.createElement('div'); f.className = 'ft-ergebnis';
  f.innerHTML = '<div class="ft-karte"><h3>Andere Regel</h3><p>Jeder Buchstabe gehört zu einer Farbe: R = rechts drehen, L = links drehen.</p><div class="wu-modi">' + AM_REGELN.map((r) => '<button type="button" class="wu-modus" data-r="' + r.id + '"><span class="wu-me">' + r.id.length + '</span><span class="wu-mt"><b>' + r.name + ' · ' + r.id + '</b><small>' + r.text + '</small></span></button>').join('') + '</div><button type="button" class="btn secondary" data-r="">Abbrechen</button></div>';
  $('wuInhalt').appendChild(f);
  f.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => { f.remove(); if (b.dataset.r) amStart(b.dataset.r, null); }));
}
function amFertig() {
  const w = wu; if (w.fertig) return; w.fertig = true;
  if (w.frageOk == null) return;
  const st = wuStore(); st.ameise.runden++; if (w.autobahn >= 0) st.ameise.autobahn = w.autobahn; saveJson(WU_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('wunder', w.frageOk ? 1 : 0, 1, 'Ameise: Autobahn ab ' + wuZahl(w.autobahn), { modus: 'ameise' });
  setTimeout(() => {
    if (!wu || wu !== w) return;
    wuEnde('<div class="wu-logo">🐜</div><h3>Ordnung aus Chaos</h3><p class="ft-gross">Autobahn ab Schritt <b>' + wuZahl(w.autobahn) + '</b></p><p>Danach wiederholt die Ameise alle 104 Schritte dasselbe Muster und rückt dabei 2 Felder schräg weiter – für immer.</p><p class="ft-klein">Chris Langton hat die Ameise 1986 erfunden. Ob sie bei <i>jedem</i> Startmuster irgendwann eine Autobahn baut, ist bis heute unbewiesen.</p>',
      [['🎨 Andere Regel ausprobieren', amRegelWahl], ['Zurück zur Auswahl', wuMenue]]);
  }, 1200);
}

// =====================================================================
// 🔢 Binär-Beat
// =====================================================================
const BI_BITS = [
  { name: 'Shaker', f: '#67e8f9' }, { name: 'Hi-Hat', f: '#38bdf8' }, { name: 'Perc', f: '#2dd4bf' }, { name: 'Snare', f: '#a3e635' },
  { name: 'Sub', f: '#818cf8' }, { name: 'Akkorde', f: '#fbbf24' }, { name: 'Lead', f: '#fb923c' }, { name: 'Wobble', f: '#c084fc' },
];
const BI_AKKORDE = [['Fm', [53, 56, 60]], ['Des', [49, 53, 56]], ['As', [56, 60, 63]], ['Es', [51, 55, 58]]];
const BI_LEAD = [0, 2, 1, 2, 0, 2, 1, 0];   // Akkordtöne je Achtel
const BI_BPM = 140, BI_S16 = 60 / BI_BPM / 4;
// Welche Spuren schlagen bei Zahl n an? Untere 4 Bits: wenn das Bit auf 1 springt. Obere 4 Bits: ganze Spuren, solange das Bit 1 ist.
function biSpielt(n) {
  const pos = n % 16, r = [];
  for (let k = 0; k < 4; k++) r.push((n & ((2 << k) - 1)) === (1 << k));
  r.push(!!(n & 16) && (pos === 0 || pos === 10));
  r.push(!!(n & 32) && (pos === 0 || pos === 3 || pos === 6 || pos === 12));
  r.push(!!(n & 64) && pos % 2 === 0);
  r.push(!!(n & 128) && pos % 2 === 0);
  r.push(pos === 0 || pos === 10);   // Kick, unabhängig von den Bits
  return r;
}
function biOsz(A, t, typ, f1, f2, dauer, laut) {
  const c = A.c, o = c.createOscillator(), g = c.createGain();
  o.type = typ; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dauer);
  g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.001, t + dauer);
  o.connect(g).connect(A.master); o.start(t); o.stop(t + dauer + 0.02);
}
function biInstrument(A, k, t, n) {
  const ak = BI_AKKORDE[(n >> 4) % 4][1];
  if (k === 0) ftRauschen(A, t, 0.035, 9500, 0.09);
  else if (k === 1) ftRauschen(A, t, 0.06, 7000, 0.15);
  else if (k === 2) biOsz(A, t, 'sine', 330, 150, 0.14, 0.4);
  else if (k === 3) { ftRauschen(A, t, 0.2, 1400, 0.35); biOsz(A, t, 'triangle', 200, 140, 0.09, 0.25); }
  else if (k === 4) biOsz(A, t, 'sine', ftHz(ak[0] - 24), 0, BI_S16 * 6, 0.5);
  else if (k === 5) ftSaw(A, t, ak.map((x) => x + 12), BI_S16 * 1.6, 0.035, 2200);
  else if (k === 6) ftSaw(A, t, [ak[BI_LEAD[(n % 16) / 2 | 0]] + 24], BI_S16 * 1.8, 0.07, 5000);
  else if (k === 7) {
    const c = A.c, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = ftHz(ak[0] - 24); f.type = 'lowpass'; f.Q.value = 8; f.frequency.value = 500;
    lfo.frequency.value = n % 32 < 16 ? 6 : 12; lg.gain.value = 420; lfo.connect(lg).connect(f.frequency);
    g.gain.setValueAtTime(0.35, t); g.gain.setValueAtTime(0.35, t + BI_S16 * 1.8); g.gain.exponentialRampToValueAtTime(0.001, t + BI_S16 * 2);
    o.connect(f).connect(g).connect(A.master); o.start(t); lfo.start(t); o.stop(t + BI_S16 * 2 + 0.02); lfo.stop(t + BI_S16 * 2 + 0.02);
  } else if (k === 8) ftKick(A, t, 1);
}
function biIntro() {
  wuStopp(); $('wuTitel').textContent = '🔢 Binär-Beat';
  const st = wuStore();
  $('wuInhalt').innerHTML = '<div class="ft-intro"><div class="wu-logo">🔢</div><h2 class="wu-h">Binär-Beat</h2>'
    + '<p>Computer zählen nur mit 0 und 1. Jede Stelle ist doppelt so viel wert wie die rechts daneben: <b>1, 2, 4, 8, 16, 32, 64, 128</b>.</p>'
    + '<p>Hier ist jede Stelle ein Instrument. Zählst du von 0 bis 255, entsteht ganz von selbst ein Dubstep-Beat – die schnellen Bits trommeln, die langsamen bauen den Song auf.</p>'
    + '<button type="button" class="btn ft-los wu-los" id="biHoeren">▶ Von 0 bis 255 zählen</button><button type="button" class="btn secondary" id="biStudioIntro">🎛️ Selbst bauen im Beat-Studio</button><button type="button" class="btn secondary" id="biQuizBtn">🧠 Binär-Quiz (10 Runden)</button>'
    + (st.binaer.runden ? '<p class="ft-klein">Bestes Quiz: ' + st.binaer.best + ' / 10</p>' : '') + '</div>';
  $('biHoeren').addEventListener('click', biHoeren);
  $('biQuizBtn').addEventListener('click', biQuiz);
  $('biStudioIntro').addEventListener('click', () => { wuStopp(); stOeffnen(0); });
}
function biBitsHtml(id, klickbar) {
  return '<div class="bi-bits" id="' + id + '">' + [7, 6, 5, 4, 3, 2, 1, 0].map((k) => '<button type="button" class="bi-bit" data-k="' + k + '" style="--f:' + BI_BITS[k].f + '"' + (klickbar ? '' : ' tabindex="-1"') + '><small>' + (1 << k) + '</small><b>0</b><em>' + BI_BITS[k].name + '</em></button>').join('') + '</div>';
}
function biBitsSetzen(id, n) {
  $(id).querySelectorAll('.bi-bit').forEach((b) => { const an = !!(n & (1 << +b.dataset.k)); b.classList.toggle('an', an); b.querySelector('b').textContent = an ? '1' : '0'; });
}
function biSumme(n) {
  if (!n) return '0';
  return [7, 6, 5, 4, 3, 2, 1, 0].filter((k) => n & (1 << k)).map((k) => '<span style="color:' + BI_BITS[k].f + '">' + (1 << k) + '</span>').join(' + ');
}
function biHoeren() {
  wuStopp(); ftTaktStoppen();
  const A = ftAudio(); if (!A) return;
  wu = { art: 'binaer', n: -1, A, warte: [], start: A.c.currentTime + 0.15, naechste: 0, verlauf: [], fertig: false };
  $('wuInhalt').innerHTML = '<div class="ft-kopf"><div class="ft-zahl wu-zahl bi-zahl" id="biZahl">0</div><div class="bi-summe" id="biSumme"></div><div class="wu-chips" id="biChips"></div></div>'
    + biBitsHtml('biBits', false) + '<canvas id="biRaster" class="wu-bild bi-raster"></canvas>'
    + '<div class="ft-unten"><div class="wu-knoepfe"><button type="button" class="ft-ton" id="biTon"></button><button type="button" class="btn secondary" id="biStopp">⏸ Anhalten</button><button type="button" class="btn secondary" id="biZurQuiz">🧠 Quiz</button></div><button type="button" class="btn secondary" id="biStudio">🎛️ Selbst bauen im Beat-Studio</button></div>';
  Object.assign(wu, wuCanvas('biRaster', 0.34, 230, 340));
  wuTonKnopf('biTon');
  $('biStopp').addEventListener('click', () => { if (wuSeq) { clearInterval(wuSeq); wuSeq = null; $('biStopp').textContent = '▶ Weiter'; } else { wu.start = A.c.currentTime + 0.1 - wu.naechste * BI_S16; biTakt(); $('biStopp').textContent = '⏸ Anhalten'; } });
  $('biZurQuiz').addEventListener('click', biQuiz);
  $('biStudio').addEventListener('click', () => { const n = Math.max(0, wu.n) & 0xf0; wuStopp(); stOeffnen(n); });
  biTakt();
  const lauf = () => {
    if (!wu || wu.art !== 'binaer') return;
    const jetzt = A.c.currentTime;
    while (wu.warte.length && wu.warte[0].t <= jetzt) { const e = wu.warte.shift(); wu.n = e.n; wu.verlauf.push(e.n); if (wu.verlauf.length > 64) wu.verlauf.shift(); biAnzeige(); }
    biRasterZeichnen();
    if (wu.n === 255 && !wu.fertig && !wu.warte.length) biFinale();
    wuRaf = requestAnimationFrame(lauf);
  };
  wuRaf = requestAnimationFrame(lauf);
}
function biTakt() {
  const A = wu.A;
  wuSeq = setInterval(() => {
    if (!wu || wu.art !== 'binaer' || !wuAktiv()) { clearInterval(wuSeq); wuSeq = null; return; }
    while (wu.naechste <= 255 && wu.start + wu.naechste * BI_S16 < A.c.currentTime + 0.12) {
      const n = wu.naechste, t = wu.start + n * BI_S16;
      if (!A.stumm) biSpielt(n).forEach((an, k) => { if (an) biInstrument(A, k, t, n); });
      if (n === 255 && !A.stumm) { ftSaw(A, t + BI_S16, [65, 68, 72, 77], 1.4, 0.07, 5000); ftRauschen(A, t + BI_S16, 1.5, 2500, 0.3); ftKick(A, t + BI_S16, 1); }
      wu.warte.push({ t, n }); wu.naechste++;
    }
  }, 25);
}
function biAnzeige() {
  const n = wu.n;
  $('biZahl').textContent = n;
  $('biSumme').innerHTML = n + ' = ' + biSumme(n);
  $('biChips').innerHTML = '<span>Binär <b>' + n.toString(2).padStart(8, '0') + '</b></span><span>Hex <b>' + n.toString(16).toUpperCase().padStart(2, '0') + '</b></span><span>Takt <b>' + ((n >> 4) + 1) + '/16</b></span><span>Akkord <b>' + BI_AKKORDE[(n >> 4) % 4][0] + '</b></span>';
  biBitsSetzen('biBits', n);
}
function biRasterZeichnen() {
  const { c, W, H, n } = wu, zeilen = [...BI_BITS.map((b) => [b.name, b.f]).reverse(), ['Kick', '#e2e8f0']], links = 62, oben = 4, zh = Math.min(17, (H * 0.62 - oben) / 9), sw = (W - links) / 16;
  c.clearRect(0, 0, W, H);
  const takt = Math.max(0, n) >> 4, pos = n % 16;
  zeilen.forEach(([name, f], z) => {
    const k = z < 8 ? 7 - z : 8, y = oben + z * zh;
    c.fillStyle = f; c.font = '700 10px system-ui'; c.textAlign = 'right'; c.fillText(name.toUpperCase(), links - 8, y + zh * 0.7);
    for (let s = 0; s < 16; s++) {
      const m = takt * 16 + s, an = biSpielt(m)[k], x = links + s * sw;
      c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(x + 1, y + 1, sw - 2, zh - 2);
      if (!an) continue;
      if (m <= n) { c.fillStyle = f; c.globalAlpha = m === n ? 1 : 0.75; c.fillRect(x + 1, y + 1, sw - 2, zh - 2); c.globalAlpha = 1; }
      else { c.strokeStyle = f; c.globalAlpha = 0.5; c.lineWidth = 1.2; c.strokeRect(x + 2, y + 2, sw - 4, zh - 4); c.globalAlpha = 1; }
    }
  });
  if (n >= 0) { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5; c.strokeRect(links + pos * sw, oben, sw, zh * 9); }
  // Verlauf: die letzten 64 Zahlen als Bit-Säulen
  const y0 = oben + zh * 9 + 16, hh = (H - y0 - 4) / 8, bw = W / 64;
  c.fillStyle = 'rgba(199,208,245,.55)'; c.font = '600 10px system-ui'; c.textAlign = 'center'; c.fillText('die letzten 64 Zahlen, Bit für Bit', W / 2, y0 - 4);
  wu.verlauf.forEach((v, j) => { for (let k = 0; k < 8; k++) if (v & (1 << k)) { c.fillStyle = BI_BITS[k].f; c.fillRect(j * bw + 0.5, y0 + (7 - k) * hh + 0.5, bw - 1, hh - 1); } });
}
function biFinale() {
  wu.fertig = true;
  setTimeout(() => {
    if (!wu || wu.art !== 'binaer') return;
    if (typeof konfetti === 'function') konfetti(30, ['1️⃣', '0️⃣', '🎵', '✨']);
    wuEnde('<div class="wu-logo">🔢</div><h3>255 = 11111111</h3><p class="ft-gross">Alle <b>8</b> Instrumente auf einmal</p><p>Mit 8 Bits kann man 256 Zahlen darstellen (0 bis 255). Das ist genau ein <b>Byte</b>. Das Bit ganz rechts wechselt bei jeder Zahl, das ganz links nur einmal – deshalb klingt das Zählen wie ein Song, der sich aufbaut.</p>',
      [['🎛️ Selbst weiterbauen im Beat-Studio', () => { wuStopp(); stOeffnen(0); }], ['🧠 Binär-Quiz', biQuiz], ['▶ Nochmal hören', biHoeren], ['Zurück zur Auswahl', wuMenue]]);
  }, 1600);
}
// Quiz: abwechselnd Zahl mit Bits bauen und Bits ablesen
function biQuiz() {
  wuStopp();
  const r = zufallsGenerator(Date.now() % 1e9);
  wu = { art: 'binaerQuiz', runde: 0, richtig: 0, r, fehler: [] };
  biQuizRunde();
}
function biQuizRunde() {
  const w = wu, bauen = w.runde % 2 === 0, stufe = w.runde < 4 ? 31 : w.runde < 8 ? 127 : 255;
  const ziel = 1 + Math.floor(w.r() * stufe);
  w.ziel = ziel; w.wert = 0;
  $('wuTitel').textContent = '🧠 Binär-Quiz ' + (w.runde + 1) + '/10';
  $('wuInhalt').innerHTML = '<div class="ft-kopf"><div class="wu-chips"><span>Runde <b>' + (w.runde + 1) + '/10</b></span><span>Richtig <b>' + w.richtig + '</b></span></div>'
    + '<p class="ft-frage">' + (bauen ? 'Tippe die Bits an, bis die Zahl <b class="bi-ziel">' + ziel + '</b> entsteht.' : 'Welche Zahl zeigen diese Bits?') + '</p></div>'
    + biBitsHtml('biQBits', bauen) + '<div class="bi-summe" id="biQSumme"></div><div id="biQUnten"></div>';
  wuTonKnopf('biTon');
  const A = ftAudio();
  if (bauen) {
    const zeig = () => { biBitsSetzen('biQBits', w.wert); $('biQSumme').innerHTML = '= <b>' + w.wert + '</b>' + (w.wert ? ' (' + biSumme(w.wert) + ')' : ''); };
    zeig();
    $('biQBits').querySelectorAll('.bi-bit').forEach((b) => b.addEventListener('click', () => { w.wert ^= 1 << +b.dataset.k; zeig(); if (A && !A.stumm) biInstrument(A, +b.dataset.k, A.c.currentTime + 0.01, 0); }));
    $('biQUnten').innerHTML = '<button type="button" class="btn ft-los wu-los" id="biPruefen">Prüfen</button>';
    $('biPruefen').addEventListener('click', () => biQuizAntwort(w.wert === ziel, ziel.toString(2).padStart(8, '0') + ' = ' + biSumme(ziel)));
  } else {
    biBitsSetzen('biQBits', ziel);
    if (A && !A.stumm) [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => ziel & (1 << k)).forEach((k, i) => biInstrument(A, k, A.c.currentTime + 0.05 + i * 0.12, 0));
    const opt = new Set([ziel]);
    [ziel ^ (1 << Math.floor(w.r() * 8)), ziel ^ (1 << Math.floor(w.r() * 8)), (ziel + 1 + Math.floor(w.r() * 30)) % 256, 255 - ziel, ziel + 8].forEach((x) => { if (opt.size < 4 && x > 0 && x < 256) opt.add(x); });
    while (opt.size < 4) opt.add(1 + Math.floor(w.r() * 255));
    const l = [...opt].sort((a, b) => a - b);
    $('biQUnten').innerHTML = '<div class="gl-optionen">' + l.map((x) => '<button type="button" class="gl-opt" data-x="' + x + '">' + x + '</button>').join('') + '</div>';
    let fertig = false;
    $('biQUnten').querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => {
      if (fertig) return; fertig = true;
      const ok = +b.dataset.x === ziel; b.classList.add(ok ? 'richtig' : 'falsch'); $('biQUnten').querySelector('[data-x="' + ziel + '"]').classList.add('richtig');
      biQuizAntwort(ok, ziel + ' = ' + biSumme(ziel), true);
    }));
  }
}
function biQuizAntwort(ok, erkl, behalte) {
  const w = wu; if (ok) w.richtig++; else w.fehler.push(w.ziel);
  if (ok) wuTon(79, 0.07, 0.25); else wuTon(55, 0.05, 0.3, 1200);
  const box = document.createElement('div'); box.className = 'gl-frage wu-frage';
  box.innerHTML = '<p><b>' + (ok ? 'Richtig! ' : 'Leider nicht. ') + '</b>' + erkl + '</p><button type="button" class="btn ft-los wu-los" id="biNaechste">' + (w.runde < 9 ? 'Nächste Zahl' : 'Ergebnis') + '</button>';
  if (behalte) $('biQUnten').appendChild(box); else { $('biQUnten').innerHTML = ''; $('biQUnten').appendChild(box); }
  biBitsSetzen('biQBits', w.ziel);
  $('biNaechste').addEventListener('click', () => { w.runde++; if (w.runde < 10) biQuizRunde(); else biQuizEnde(); });
}
function biQuizEnde() {
  const w = wu, st = wuStore(); st.binaer.runden++; st.binaer.best = Math.max(st.binaer.best || 0, w.richtig); saveJson(WU_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('wunder', w.richtig, 10, 'Binär-Quiz ' + w.richtig + '/10', { modus: 'binaer' });
  if (w.richtig >= 8 && typeof konfetti === 'function') konfetti(30, ['1️⃣', '0️⃣', '✨']);
  wuEnde('<div class="wu-logo">🧠</div><h3>' + (w.richtig >= 9 ? 'Binär-Profi!' : w.richtig >= 6 ? 'Gut gezählt!' : 'Übung macht den Profi') + '</h3><p class="ft-gross"><b>' + w.richtig + '</b> von 10 richtig</p><p class="ft-klein">Trick: Von links nach rechts – passt die Stelle noch in die Zahl? Dann 1 und abziehen, sonst 0.</p>',
    [['Nochmal', biQuiz], ['▶ Von 0 bis 255 hören', biHoeren], ['Zurück zur Auswahl', wuMenue]]);
}

// =====================================================================
// 🐉 Drachen-Streifen (Papierstreifen falten und aufklappen = Drachenkurve)
// =====================================================================
const DR_MAX = 12;
function drIntro() {
  wuStopp(); $('wuTitel').textContent = '🐉 Drachen-Streifen';
  $('wuInhalt').innerHTML = '<div class="ft-intro"><div class="wu-logo">🐉</div><h2 class="wu-h">Drachen-Streifen</h2>'
    + '<p>Nimm einen Papierstreifen und falte ihn in der Mitte – immer in dieselbe Richtung, 12-mal hintereinander. Dann klappst du ihn wieder auf, so dass jeder Knick genau einen <b>rechten Winkel</b> bildet.</p>'
    + '<div id="drFrage"></div></div>';
  wuFrage($('drFrage'), 'Wie viele Knicke hat der Streifen dann?', ['24', '144', '4.095', 'über 1 Million'], 2,
    'Jede Faltung verdoppelt die Lagen: 2¹² = 4.096 Teilstücke – und dazwischen 4.095 Knicke. Schau, welche Form sie bilden!',
    (ok) => drStart(ok));
}
// Punkte der Kurve nach n Auffaltungen: Kopie rückwärts, um 90° um den Endpunkt gedreht
function drPunkte(n) {
  let p = [[0, 0], [1, 0]];
  for (let k = 0; k < n; k++) { const [ex, ey] = p[p.length - 1], neu = []; for (let i = p.length - 2; i >= 0; i--) { const dx = p[i][0] - ex, dy = p[i][1] - ey; neu.push([ex - dy, ey + dx]); } p = p.concat(neu); }
  return p;
}
// Knick-Code: L oder R an jedem inneren Punkt
function drKnicke(p) {
  const out = [];
  for (let i = 1; i < p.length - 1; i++) { const ax = p[i][0] - p[i - 1][0], ay = p[i][1] - p[i - 1][1], bx = p[i + 1][0] - p[i][0], by = p[i + 1][1] - p[i][1]; out.push(ax * by - ay * bx > 0 ? 'L' : 'R'); }
  return out;
}
// Überkreuzen: kommt eine Strecke doppelt vor?
function drUeberlappt(p) {
  const s = new Set();
  for (let i = 1; i < p.length; i++) { const a = p[i - 1].join(','), b = p[i].join(','), k = a < b ? a + '|' + b : b + '|' + a; if (s.has(k)) return true; s.add(k); }
  return false;
}
function drStart(frageOk) {
  wuStopp(); ftLaut = 0;
  wu = { art: 'drache', n: 0, p: drPunkte(0), anim: null, frageOk, frage2: null, fertig: false, kopien: 1, sicht: null, auto: false };
  $('wuInhalt').innerHTML = '<div class="ft-kopf"><div class="ft-zahl wu-zahl" id="drZahl"></div><div class="wu-chips" id="drChips"></div></div>'
    + '<canvas id="drBild" class="ft-bild wu-bild"></canvas><canvas id="drCode" class="wu-kurve"></canvas>'
    + '<div class="ft-unten"><div class="ft-text" id="drText"></div><div id="drFrage2"></div><div class="wu-knoepfe" id="drKnoepfe"><button type="button" class="ft-ton" id="drTon"></button><button type="button" class="btn ft-los wu-los" id="drAuf">↔ Auffalten</button><button type="button" class="btn secondary" id="drAuto">⏩ Alles</button></div>'
    + '<div class="wu-kopien" id="drKopien" hidden><span>Streifen:</span>' + [1, 2, 4].map((k) => '<button type="button" class="bb-stufe' + (k === 1 ? ' an' : '') + '" data-kopien="' + k + '">' + k + '</button>').join('') + '</div></div>';
  Object.assign(wu, wuCanvas('drBild', 0.5, 300, 560));
  const k2 = wuCanvas('drCode', 0, 40, 40); wu.c2 = k2.c; wu.W2 = k2.W; wu.H2 = k2.H;
  wuTonKnopf('drTon');
  $('drAuf').addEventListener('click', drAuffalten);
  $('drAuto').addEventListener('click', () => { wu.auto = true; drAuffalten(); });
  $('drKopien').querySelectorAll('[data-kopien]').forEach((b) => b.addEventListener('click', () => { wu.kopien = +b.dataset.kopien; wu.sicht = null; $('drKopien').querySelectorAll('[data-kopien]').forEach((x) => x.classList.toggle('an', x === b)); drAnzeige(); }));
  ftTaktStarten();
  const lauf = (jetzt) => { if (!wu || wu.art !== 'drache') return; drZeichnen(jetzt); wuRaf = requestAnimationFrame(lauf); };
  wuRaf = requestAnimationFrame(lauf); drAnzeige();
}
function drAuffalten() {
  const w = wu; if (w.anim || w.n >= DR_MAX || w.frage2 === 'offen') return;
  w.anim = { t0: performance.now(), dauer: w.auto ? 520 : 750, alt: w.p };
  w.n++; w.p = drPunkte(w.n);
  ftLaut = Math.min(40, w.n * 3.4);
  ftFaltKlang(w.n * 2, w.n === DR_MAX);
  drAnzeige();
}
function drAnzeige() {
  const w = wu;
  $('drZahl').innerHTML = wuZahl(2 ** w.n) + '<small>' + (w.n ? 'Teilstücke' : 'Teilstück') + '</small>';
  $('drChips').innerHTML = '<span>Faltungen <b>' + w.n + '/' + DR_MAX + '</b></span><span>Knicke <b>' + wuZahl(2 ** w.n - 1) + '</b></span>';
  $('drText').textContent = w.n === 0 ? 'Der gefaltete Streifen: alle Lagen liegen übereinander. Klapp ihn auf!' : w.n < 4 ? 'Jedes Auffalten: die Kopie dreht sich um 90° um das Ende.' : w.n < DR_MAX ? 'Jedes Auffalten verdoppelt die Teilstücke.' : w.kopien > 1 ? w.kopien + ' Drachen um denselben Punkt – sie greifen ineinander, ohne sich zu überlappen.' : 'Die Drachenkurve – aus einem einfachen Papierstreifen.';
  $('drAuf').disabled = w.n >= DR_MAX;
}
function drZeichnen(jetzt) {
  const w = wu, { c, W, H } = w;
  c.fillStyle = '#0d0b26'; c.fillRect(0, 0, W, H);
  let p = w.p, winkel = 1, alt = null;
  if (w.anim) {
    const k = Math.min(1, (jetzt - w.anim.t0) / w.anim.dauer); winkel = ftEase(k); alt = w.anim.alt;
    if (k >= 1) { w.anim = null; if (w.auto && w.n < DR_MAX) setTimeout(() => { if (wu === w) drAuffalten(); }, 120); else if (w.n === DR_MAX) drFrage2(); }
  }
  // Punkte während der Animation: alte Hälfte fest, Kopie um winkel·90° gedreht
  let pts = p;
  if (alt) {
    const [ex, ey] = alt[alt.length - 1], th = winkel * Math.PI / 2, co = Math.cos(th), si = Math.sin(th);
    pts = alt.slice(); for (let i = alt.length - 2; i >= 0; i--) { const dx = alt[i][0] - ex, dy = alt[i][1] - ey; pts.push([ex + dx * co - dy * si, ey + dx * si + dy * co]); }
  }
  // Ansicht an alle Kopien anpassen (weich)
  const kop = w.kopien, dreh = (q, j) => { let [x, y] = q; for (let r = 0; r < j; r++) [x, y] = [-y, x]; return [x, y]; };
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let j = 0; j < kop; j++) for (const q of (j ? p : pts)) { const [x, y] = dreh(q, j); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const ziel = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, gr: Math.max((x1 - x0 + 1) / W, (y1 - y0 + 1) / H) };
  if (!w.sicht) w.sicht = { ...ziel };
  for (const k of ['cx', 'cy', 'gr']) w.sicht[k] += (ziel[k] - w.sicht[k]) * 0.1;
  const z = Math.min(0.86 / w.sicht.gr, 70), ox = W / 2 - w.sicht.cx * z, oy = H / 2 - w.sicht.cy * z;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const lw = Math.max(1.2, Math.min(7, z * 0.3));
  for (let j = 0; j < kop; j++) {
    const q = j ? p : pts, seg = q.length - 1, stuecke = Math.min(64, seg), proStueck = Math.ceil(seg / stuecke);
    for (let s = 0; s < seg; s += proStueck) {
      const t = s / Math.max(1, seg), hue = (190 + t * 190 + j * 60) % 360;
      c.strokeStyle = 'hsl(' + hue + ',90%,68%)'; c.shadowColor = c.strokeStyle; c.shadowBlur = seg < 600 ? 10 : 4; c.lineWidth = lw;
      c.beginPath();
      for (let i = s; i <= Math.min(seg, s + proStueck); i++) { const [x, y] = dreh(q[i], j); const X = x * z + ox, Y = y * z + oy; i === s ? c.moveTo(X, Y) : c.lineTo(X, Y); }
      c.stroke();
    }
  }
  c.shadowBlur = 0;
  if (w.n === 0 && !alt) { c.fillStyle = 'rgba(199,208,245,.6)'; c.font = '600 12px system-ui'; c.textAlign = 'center'; c.fillText('12 Lagen Papier übereinander', W / 2, H / 2 + 34); }
  // Knick-Code
  const c2 = w.c2, W2 = w.W2; c2.clearRect(0, 0, W2, w.H2);
  const kn = drKnicke(p), bw = W2 / Math.max(1, kn.length);
  kn.forEach((k, i) => { c2.fillStyle = k === 'L' ? '#67e8f9' : '#f9a8d4'; c2.fillRect(i * bw, 0, Math.max(0.6, bw - (bw > 3 ? 1 : 0)), 16); });
  c2.fillStyle = 'rgba(199,208,245,.6)'; c2.font = '600 10px system-ui'; c2.textAlign = 'center'; c2.fillText('Knick-Code L / R · ' + wuZahl(kn.length) + ' Knicke', W2 / 2, 32);
}
function drFrage2() {
  const w = wu; if (w.frage2) return; w.frage2 = 'offen';
  $('drKnoepfe').hidden = true;
  wuFrage($('drFrage2'), '4.096 Teilstücke auf engem Raum. Läuft der Streifen irgendwo <b>doppelt über dieselbe Linie</b>?', ['Ja, ganz oft', 'Ein paar Mal', 'Nie – er berührt sich nur an Ecken'], 2,
    'Nie! Die Drachenkurve berührt sich nur an Eckpunkten, keine Strecke wird zweimal benutzt. Und vier Drachen um einen Punkt füllen die Fläche lückenlos – probier unten 2 und 4 Streifen aus.',
    (ok) => {
      w.frage2 = 'fertig'; $('drFrage2').innerHTML = ''; $('drKnoepfe').hidden = false; $('drKopien').hidden = false;
      const st = wuStore(); st.drache.runden++; saveJson(WU_KEY, st);
      const punkte = (w.frageOk ? 1 : 0) + (ok ? 1 : 0);
      if (typeof merkeVerlauf === 'function') merkeVerlauf('wunder', punkte, 2, 'Drachen-Streifen ' + punkte + '/2', { modus: 'drache' });
      if (typeof konfetti === 'function') konfetti(25, ['🐉', '✨', '📄']);
      const b = $('drAuto').cloneNode(true); b.textContent = '↺ Nochmal'; $('drAuto').replaceWith(b); b.addEventListener('click', drIntro);
    });
}

// =====================================================================
// 📈 27 → 1 (Collatz)
// =====================================================================
const WU_CHAMPS = { 100: [97, 118], 1000: [871, 178], 10000: [6171, 261] };
function coFolge(n) { const f = [n]; while (n !== 1 && f.length < 2000) { n = n % 2 ? 3 * n + 1 : n / 2; f.push(n); } return f; }
function coIntro() {
  wuStopp(); $('wuTitel').textContent = '📈 27 → 1';
  $('wuInhalt').innerHTML = '<div class="ft-intro"><div class="wu-logo">📈</div><h2 class="wu-h">Kommt die 27 bei 1 an?</h2>'
    + '<p>Nimm eine Zahl. Ist sie <b class="co-u">ungerade</b>: mal 3 plus 1. Ist sie <b class="co-g">gerade</b>: durch 2. Und immer so weiter.</p>'
    + '<p class="ft-frage">Wie viele Schritte braucht die <b>27</b>, bis sie bei <b>1</b> ankommt?</p>'
    + '<div class="ft-schaetzen"><input type="range" id="coSchieber" min="0" max="100" value="35" aria-label="Schätzung"><output id="coWahl"></output></div>'
    + '<button type="button" class="btn ft-los wu-los" id="coLos">🎵 Schätzen und loslegen</button>'
    + '<button type="button" class="btn secondary" id="coJagd">🏆 Gleich zur Rekordjagd</button></div>';
  const wert = () => Math.round(5 * Math.pow(100, $('coSchieber').value / 100));   // 5 … 500, logarithmisch
  const zeig = () => { $('coWahl').textContent = wert() + ' Schritte'; };
  $('coSchieber').addEventListener('input', zeig); zeig();
  $('coLos').addEventListener('click', () => coStart(27, wert()));
  $('coJagd').addEventListener('click', () => coJagd());
}
function coStart(start, schaetzung, jagd) {
  wuStopp(); ftLaut = 0;
  const f = coFolge(start), peak = Math.max(...f);
  wu = { art: 'collatz', start, f, peak, i: 0, schaetzung, jagd: !!jagd, frage2: jagd ? 'fertig' : null, ok2: false, fertig: false, max: start, maxA: start, t0: performance.now() };
  $('wuInhalt').innerHTML = '<div class="ft-kopf"><div class="wu-chips co-kopf"><span>Schritte <b id="coSchritte">0</b></span><span>Wert <b id="coWert">' + wuZahl(start) + '</b></span></div>'
    + '<div class="co-regeln"><span id="coU" class="co-u">ungerade ×3+1</span><span id="coG" class="co-g">gerade ÷2</span></div></div>'
    + '<canvas id="coBild" class="ft-bild wu-bild"></canvas>'
    + '<div class="ft-unten"><div class="ft-text" id="coText"></div><div id="coFrage"></div><div class="wu-knoepfe"><button type="button" class="ft-ton" id="coTon"></button><button type="button" class="btn secondary" id="coSchnell">⏩ Schneller</button><button type="button" class="btn secondary" id="coZurueckJagd">🏆 Rekordjagd</button></div></div>';
  Object.assign(wu, wuCanvas('coBild', 0.5, 300, 560));
  wuTonKnopf('coTon');
  wu.tempo = jagd ? 4 : 1;
  $('coSchnell').addEventListener('click', () => { wu.tempo = wu.tempo >= 4 ? 1 : wu.tempo * 2; $('coSchnell').textContent = wu.tempo > 1 ? '⏩ ×' + wu.tempo : '⏩ Schneller'; });
  $('coZurueckJagd').addEventListener('click', () => coJagd());
  ftTaktStarten();
  coText('Los geht’s mit der ' + start + '.');
  const takt = () => {
    if (!wu || wu.art !== 'collatz') return;
    if (!wu.pause && !wu.fertig) coSchritt();
    wuTimer = setTimeout(takt, FT_ACHTEL * 1000 / wu.tempo);
  };
  wuTimer = setTimeout(takt, 400);
  const lauf = () => { if (!wu || wu.art !== 'collatz') return; coZeichnen(); wuRaf = requestAnimationFrame(lauf); };
  wuRaf = requestAnimationFrame(lauf);
}
const coText = (t) => { $('coText').innerHTML = t; };
function coNote(v) {   // Tonhöhe folgt dem Wert (Pentatonik) – hohe Zahl, hoher Ton
  const pent = [0, 2, 4, 7, 9], d = Math.round(Math.log2(v) * 1.5);
  return Math.min(96, 50 + 12 * Math.floor(d / 5) + pent[d % 5]);
}
function coSchritt() {
  const w = wu; if (w.i >= w.f.length - 1) return;
  const alt = w.f[w.i]; w.i++; const v = w.f[w.i];
  w.max = Math.max(w.max, v); w.sprung = performance.now();
  $('coSchritte').textContent = w.i; $('coWert').textContent = wuZahl(v);
  $('coU').classList.toggle('an', alt % 2 === 1); $('coG').classList.toggle('an', alt % 2 === 0);
  ftLaut = Math.round(Math.min(40, Math.log2(v) / Math.log2(Math.max(16, w.peak)) * 40));
  if (w.tempo < 4 || w.i % 2 === 0) wuTon(coNote(v), alt % 2 ? 0.08 : 0.05, 0.18, alt % 2 ? 5000 : 2600);
  if (v === w.peak) { coText('Gipfel: <b>' + wuZahl(v) + '</b>!'); ftFaltKlang(30, true); }
  else if (w.i > w.f.indexOf(w.peak) && w.i <= w.f.indexOf(w.peak) + 4) coText('… und jetzt stürzt sie ab.');
  else if (w.i < w.f.length - 3) coText(wuZahl(alt) + (alt % 2 ? ' ist <span class="co-u">ungerade</span> → ×3+1 = ' : ' ist <span class="co-g">gerade</span> → ÷2 = ') + '<b>' + wuZahl(v) + '</b>');
  if (!w.jagd && w.frage2 == null && w.i === 22) coFrage2();
  if (w.i === w.f.length - 1) coZiel();
}
function coFrage2() {
  const w = wu; w.pause = true; w.frage2 = 'offen';
  wuFrage($('coFrage'), 'Die 27 steht jetzt bei <b>' + wuZahl(w.f[w.i]) + '</b>. Wie hoch klettert sie höchstens?', ['bis 100', 'bis 1.000', 'bis 9.232', 'über 1 Million'], 2,
    'Sie klettert bis 9.232 – mehr als das 340-Fache ihres Startwerts – bevor sie abstürzt.',
    (ok) => { w.ok2 = ok; w.frage2 = 'fertig'; $('coFrage').innerHTML = ''; w.pause = false; });
}
function coZiel() {
  const w = wu; w.fertig = true;
  coText('4 → 2 → 1 – und von 1 ginge es im Kreis: 1 → 4 → 2 → 1 …');
  ftFaltKlang(20, true);
  const st = wuStore();
  coFundMerken(st, w.start, w.f.length - 1);
  if (w.jagd) { saveJson(WU_KEY, st); setTimeout(() => { if (wu === w) coJagd(w.start); }, 1400); return; }
  st.collatz.runden++; saveJson(WU_KEY, st);
  const abw = Math.abs(Math.log(w.schaetzung / 111)), p1 = abw < Math.log(1.2) ? 2 : abw < Math.log(1.6) ? 1 : 0, punkte = p1 + (w.ok2 ? 1 : 0);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('wunder', punkte, 3, '27 → 1: geschätzt ' + w.schaetzung, { modus: 'collatz' });
  setTimeout(() => {
    if (wu !== w) return;
    wuEnde('<div class="wu-logo">📈</div><h3>111 Schritte</h3><p class="ft-gross">Du hast <b>' + w.schaetzung + '</b> geschätzt</p><p>Die 27 klettert bis <b>9.232</b> und braucht 111 Schritte bis zur 1. Ihre Nachbarn 26 und 28 schaffen es in 10 und 18.</p><p class="ft-klein">Die Collatz-Vermutung (1937): Jede Zahl landet irgendwann bei 1. Computer haben es für alle Zahlen bis über 2⁶⁸ geprüft – bewiesen ist es bis heute nicht.</p>',
      [['🏆 Rekordjagd', () => coJagd()], ['Zurück zur Auswahl', wuMenue]]);
  }, 1500);
}
function coFundMerken(st, n, s) {
  for (const g of [100, 1000, 10000]) if (n < g) { const alt = st.collatz.funde[g]; if (!alt || s > alt[1]) st.collatz.funde[g] = [n, s]; }
}
function coZeichnen() {
  const w = wu, { c, W, H } = w, now = performance.now();
  c.fillStyle = '#0d0b26'; c.fillRect(0, 0, W, H);
  w.maxA += (w.max - w.maxA) * 0.08;
  const n = w.f.length, basis = H * 0.84, hoehe = H * 0.7, bw = W / Math.max(n, 12), sk = hoehe / w.maxA;
  // Gipfel-Linie
  if (w.max > w.start) { const y = basis - w.max * sk; c.setLineDash([6, 6]); c.strokeStyle = 'rgba(251,146,60,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); c.setLineDash([]); c.fillStyle = '#fdba74'; c.font = '700 12px system-ui'; c.textAlign = 'right'; c.fillText('Gipfel ' + wuZahl(w.max), W - 4, y - 5); }
  for (let i = 0; i <= w.i; i++) {
    const v = w.f[i], h = Math.max(1.5, v * sk), x = i * bw, ungerade = i > 0 && w.f[i - 1] % 2 === 1;
    c.fillStyle = i === 0 ? '#e2e8f0' : ungerade ? '#fb923c' : '#38bdf8';
    c.fillRect(x + bw * 0.12, basis - h, bw * 0.76, h);
    c.globalAlpha = 0.18; c.fillRect(x + bw * 0.12, basis + 2, bw * 0.76, Math.min(H - basis, h * 0.25)); c.globalAlpha = 1;   // Spiegelung
  }
  c.strokeStyle = 'rgba(129,140,248,.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, basis + 1); c.lineTo(W, basis + 1); c.stroke();
  // Kugel hüpft von Säule zu Säule
  const k = Math.min(1, (now - (w.sprung || now)) / (FT_ACHTEL * 1000 / w.tempo)), i0 = Math.max(0, w.i - 1);
  const xa = (i0 + 0.5) * bw, xb = (w.i + 0.5) * bw, ya = basis - w.f[i0] * sk, yb = basis - w.f[w.i] * sk;
  const bx = xa + (xb - xa) * k, by = ya + (yb - ya) * k - Math.sin(k * Math.PI) * 26 - 8;
  c.fillStyle = '#dbeafe'; c.shadowColor = '#93c5fd'; c.shadowBlur = 16; c.beginPath(); c.arc(bx, by, Math.max(4, Math.min(9, bw * 0.6)), 0, 7); c.fill(); c.shadowBlur = 0;
}
function coJagd(zuletzt) {
  wuStopp(); $('wuTitel').textContent = '🏆 Rekordjagd';
  const st = wuStore(), f = st.collatz.funde;
  const zeile = (g) => { const x = f[g], champ = WU_CHAMPS[g], ok = x && x[0] === champ[0]; return '<div class="co-rekord' + (ok ? ' ok' : '') + '"><span>unter ' + wuZahl(g) + '</span><b>' + (x ? x[0] + ' → ' + x[1] + ' Schritte' : '–') + '</b><em>' + (ok ? '🏆 Champion!' : 'Rekord: ' + champ[1] + ' Schritte') + '</em></div>'; };
  $('wuInhalt').innerHTML = '<div class="ft-intro"><div class="wu-logo">🏆</div><h2 class="wu-h">Rekordjagd</h2><p>Finde die Zahl mit den <b>meisten Schritten</b> bis zur 1 – in jedem Bereich gibt es einen Champion.</p>'
    + (zuletzt ? '<p class="ft-frage">' + zuletzt + ' braucht <b>' + (coFolge(zuletzt).length - 1) + '</b> Schritte und klettert bis ' + wuZahl(Math.max(...coFolge(zuletzt))) + '.</p>' : '')
    + [100, 1000, 10000].map(zeile).join('')
    + '<div class="co-eingabe"><input type="number" id="coZahl" min="1" max="99999" inputmode="numeric" placeholder="Zahl, z. B. 97" aria-label="Startzahl"><button type="button" class="btn ft-los wu-los" id="coProbier">Los</button></div>'
    + '<button type="button" class="btn secondary" id="coZufall">🎲 Zufallszahl unter 10.000</button>'
    + '<p class="ft-klein">Tipp: Große Zahlen sind nicht automatisch lang – 1.024 ist in 10 Schritten unten. Ungerade Zahlen klettern oft länger.</p></div>';
  const los = (n) => { if (n >= 1 && n <= 99999) coStart(n, null, true); };
  $('coProbier').addEventListener('click', () => los(Math.floor(+$('coZahl').value)));
  $('coZahl').addEventListener('keydown', (e) => { if (e.key === 'Enter') los(Math.floor(+$('coZahl').value)); });
  $('coZufall').addEventListener('click', () => los(1 + Math.floor(Math.random() * 9999)));
  if (zuletzt) [100, 1000, 10000].forEach((g) => { const x = f[g]; if (x && x[0] === WU_CHAMPS[g][0] && zuletzt === x[0] && typeof konfetti === 'function') konfetti(30, ['🏆', '✨', '📈']); });
}

// ---------- Navigation ----------
$('hubWunder').addEventListener('click', () => { merkeZuletzt('wunder'); zoomZu($('hubWunder'), wuOeffnen); });
$('wuZurueck').addEventListener('click', () => {
  const art = wu && wu.art;
  if ($('wuInhalt').querySelector('.wu-modi') && !$('wuInhalt').querySelector('.ft-ergebnis')) { wuStopp(); zeigeHub(); return; }
  if (art === 'collatz' && wu.jagd) { coJagd(); return; }
  wuMenue();
});
