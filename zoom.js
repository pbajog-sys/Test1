// 🔭 Zoom durchs Universum – jeder Tipp zoomt ×10 heraus oder ÷10 hinein, vom Proton bis zum beobachtbaren Universum.
// Echte Größen (Durchmesser bzw. Länge), Happy-Hardcore-Beat aus falten.js (ftTaktStarten/ftFaltKlang/ftLaut).
// Speicher: walquiz.zoom.v1 = { entdeckt: [Namen], best: { abw }, runden }
const ZM_KEY = 'walquiz.zoom.v1';
const ZM_MIN = -15, ZM_MAX = 27, ZM_START = 1;   // Bildbreite 10^k Meter
const ZM_SCHRITTE = 42;                          // log10(8,8e26 m / 1,7e-15 m) = 41,7
// s = Größe in m, e = Emoji (sonst gezeichneter Kreis/Ring), f = Farbe, ring = Umlaufbahn als Ring
const ZM_DINGE = [
  { n: 'Proton', s: 1.7e-15, f: '#ef4444', t: 'Baustein jedes Atomkerns' },
  { n: 'Kohlenstoff-Atomkern', s: 5.5e-15, f: '#fb923c', t: '6 Protonen, 6 Neutronen' },
  { n: 'Gold-Atomkern', s: 1.4e-14, f: '#facc15', t: '79 Protonen, 118 Neutronen' },
  { n: 'Gammastrahlung (Wellenlänge)', s: 1e-12, ring: true, f: '#a3e635', t: 'Energiereichstes Licht' },
  { n: 'Röntgenstrahlung (Wellenlänge)', s: 1e-11, ring: true, f: '#67e8f9', t: 'Geht durch Haut, nicht durch Knochen' },
  { n: 'Wasserstoff-Atom', s: 1.06e-10, e: '⚛️', t: 'Fast nur leerer Raum – der Kern ist 60.000× kleiner' },
  { n: 'Wassermolekül', s: 2.8e-10, e: '💧', t: 'H₂O' },
  { n: 'DNA-Doppelhelix (Breite)', s: 2e-9, e: '🧬', t: 'Bauplan des Lebens' },
  { n: 'Ribosom', s: 2.5e-8, f: '#a78bfa', t: 'Eiweiß-Fabrik der Zelle' },
  { n: 'Coronavirus', s: 1e-7, e: '🦠', t: 'Rund 0,1 Mikrometer' },
  { n: 'Bakterium (E. coli)', s: 2e-6, f: '#4ade80', t: '2 Mikrometer lang' },
  { n: 'Rotes Blutkörperchen', s: 7.5e-6, e: '🩸', t: '25 Billionen davon in dir' },
  { n: 'Menschliches Haar (Dicke)', s: 7e-5, f: '#a16207', t: 'Rund 0,07 mm' },
  { n: 'Staubmilbe', s: 3e-4, e: '🕷️', t: '0,3 mm' },
  { n: 'Sandkorn', s: 1e-3, f: '#d6b26e', t: 'Etwa 1 mm' },
  { n: 'Ameise', s: 5e-3, e: '🐜', t: '5 mm' },
  { n: 'Biene', s: 1.5e-2, e: '🐝', t: '1,5 cm' },
  { n: '1-Euro-Münze', s: 2.3e-2, e: '🪙', t: '23,25 mm' },
  { n: 'Hand', s: 0.19, e: '✋', t: '19 cm' },
  { n: 'Katze', s: 0.46, e: '🐈', t: '46 cm' },
  { n: 'Mensch', s: 1.75, e: '🧍', t: '1,75 m – hier fängst du an' },
  { n: 'Auto', s: 4.5, e: '🚗', t: '4,5 m' },
  { n: 'Blauwal', s: 27, e: '🐋', t: 'Größtes Tier, das je lebte' },
  { n: 'Fußballfeld', s: 105, e: '🏟️', t: '105 m' },
  { n: 'Eiffelturm', s: 330, e: '🗼', t: '330 m' },
  { n: 'Mount Everest', s: 8849, e: '🏔️', t: '8.849 m hoch' },
  { n: 'Berlin', s: 45e3, e: '🌆', t: 'Rund 45 km von Ost nach West' },
  { n: 'Deutschland', s: 876e3, e: '🇩🇪', t: '876 km von Nord nach Süd' },
  { n: 'Mond', s: 3.47e6, e: '🌕', t: '3.474 km Durchmesser' },
  { n: 'Erde', s: 1.274e7, e: '🌍', t: '12.742 km Durchmesser' },
  { n: 'Jupiter', s: 1.4e8, f: '#f59e0b', t: '11× so breit wie die Erde' },
  { n: 'Mondbahn', s: 7.69e8, ring: true, f: '#cbd5e1', t: 'Der Mond kreist 384.400 km entfernt' },
  { n: 'Sonne', s: 1.39e9, e: '☀️', t: '109× so breit wie die Erde' },
  { n: 'Merkurbahn', s: 1.16e11, ring: true, f: '#fca5a5', t: 'Innerster Planet: 88 Tage pro Runde' },
  { n: 'Erdbahn', s: 2.99e11, ring: true, f: '#60a5fa', t: 'Ein Jahr – eine Runde' },
  { n: 'Sonnensystem (Neptunbahn)', s: 9e12, ring: true, f: '#818cf8', t: 'Neptun braucht 165 Jahre für eine Runde' },
  { n: 'Voyager 1 (Abstand)', s: 2.54e13, e: '🛸', t: 'Am weitesten gereiste Sonde (2026)' },
  { n: 'Innere Oortsche Wolke (Abstand)', s: 3e14, ring: true, f: '#94a3b8', t: 'Heimat der Kometen, rund 2.000-mal so weit wie die Sonne' },
  { n: '1 Lichtjahr', s: 9.46e15, ring: true, f: '#fde68a', t: 'So weit kommt Licht in einem Jahr' },
  { n: 'Proxima Centauri (Abstand)', s: 4.0e16, e: '⭐', t: 'Nächster Stern: 4,2 Lichtjahre' },
  { n: 'Plejaden', s: 4e17, e: '✨', t: 'Sternhaufen, gut 40 Lichtjahre groß' },
  { n: 'Dicke der Milchstraßen-Scheibe', s: 9.5e18, f: '#e9d5ff', t: 'Rund 1.000 Lichtjahre dick' },
  { n: 'Orionnebel (Abstand)', s: 1.27e19, e: '🌫️', t: '1.344 Lichtjahre entfernt' },
  { n: 'Milchstraße', s: 9.5e20, e: '🌌', t: 'Rund 100.000 Lichtjahre, 100–400 Mrd. Sterne' },
  { n: 'Andromeda (Abstand)', s: 2.4e22, ring: true, f: '#c4b5fd', t: '2,5 Mio. Lichtjahre entfernt' },
  { n: 'Lokale Gruppe', s: 1e23, f: '#a78bfa', t: 'Rund 80 Galaxien' },
  { n: 'Virgo-Galaxienhaufen (Abstand)', s: 5.1e23, f: '#fda4af', t: '54 Mio. Lichtjahre entfernt' },
  { n: 'Laniakea-Superhaufen', s: 4.9e24, f: '#38bdf8', t: '520 Mio. Lichtjahre, 100.000 Galaxien' },
  { n: 'Sloan Great Wall', s: 1.3e25, f: '#c084fc', t: 'Eine der größten bekannten Strukturen: 1,4 Mrd. Lichtjahre' },
  { n: 'Beobachtbares Universum', s: 8.8e26, f: '#f472b6', t: '93 Mrd. Lichtjahre – weiter können wir nicht sehen' },
];
function zmLaenge(m) {
  const f = (x) => x.toLocaleString('de-DE', { maximumFractionDigits: x < 10 ? 1 : 0 });
  if (m < 1e-12) return f(m * 1e15) + ' Femtometer';
  if (m < 1e-9) return f(m * 1e12) + ' Pikometer';
  if (m < 1e-6) return f(m * 1e9) + ' Nanometer';
  if (m < 1e-3) return f(m * 1e6) + ' Mikrometer';
  if (m < 1) return f(m * 1e3) + ' mm';
  if (m < 1e3) return f(m) + ' m';
  if (m < 9.46e14) return f(m / 1e3) + ' km';
  return f(m / 9.46e15) + ' Lichtjahre';
}
const zmHoch = (k) => '10' + String(k).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
let zm = null, zmAnim = null;
const zmStore = () => { const s = loadJson(ZM_KEY); s.entdeckt = s.entdeckt || []; s.best = s.best || {}; s.runden = s.runden || 0; return s; };
function zmOeffnen() { show('zoom', '🔭 Zoom durchs Universum'); zmIntro(); }
function zmIntro() {
  ftTaktStoppen(); cancelAnimationFrame(zmAnim); zm = null;
  const st = zmStore();
  $('zmInhalt').innerHTML = '<div class="ft-intro"><div class="zm-logo" aria-hidden="true">🔭</div><h2 class="zm-h">Zoom durchs Universum</h2>'
    + '<p>Jeder Tipp zoomt <b>×10 heraus</b> oder <b>÷10 hinein</b> – vom kleinsten Teilchen bis zum Rand des Universums.</p>'
    + '<p class="ft-frage">Wie viele Zehnerschritte liegen zwischen einem <b>Proton</b> und dem ganzen <b>beobachtbaren Universum</b>?</p>'
    + '<div class="ft-schaetzen"><input type="range" id="zmSchieber" min="3" max="100" value="20" aria-label="Schätzung"><output id="zmSchaetzung"></output></div>'
    + '<button type="button" class="btn ft-los zm-los" id="zmLos">🎵 Schätzen und loszoomen</button>'
    + '<p class="ft-klein">Ziel: beide Enden erreichen – das Proton und das Universum. Ton an! 🔊' + (st.entdeckt.length ? '<br>Schon entdeckt: ' + st.entdeckt.length + ' von ' + ZM_DINGE.length : '') + '</p></div>';
  const zeig = () => { $('zmSchaetzung').textContent = $('zmSchieber').value + ' Schritte'; };
  $('zmSchieber').addEventListener('input', zeig); zeig();
  $('zmLos').addEventListener('click', () => { ftAudio(); zmStart(+$('zmSchieber').value); });
}
function zmStart(schaetzung) {
  ftLaut = 0;
  zm = { k: ZM_START, kA: ZM_START, schaetzung, besucht: new Set([ZM_START]), min: ZM_START, max: ZM_START, anim: null, fertig: false, text: 'Du – 1,75 m. Wohin zuerst?', schritte: 0 };
  $('zmInhalt').innerHTML = '<div class="ft-kopf"><div class="ft-zahl" id="zmZahl"></div><div class="zm-leiste"><span>⚛️</span><div class="zm-bahn"><b id="zmBereich"></b><i id="zmPunkt"></i></div><span>🌌</span></div></div>'
    + '<canvas id="zmBild" class="ft-bild zm-bild"></canvas>'
    + '<div class="ft-unten"><div class="ft-text" id="zmText"></div><div class="zm-info" id="zmInfo"></div>'
    + '<div class="zm-knoepfe"><button type="button" class="btn zm-rein" id="zmRein">🔬 Hinein ÷10</button><button type="button" class="ft-ton" id="zmTon" aria-label="Ton an/aus">' + (ftAk && ftAk.stumm ? '🔇' : '🔊') + '</button><button type="button" class="btn zm-raus" id="zmRaus">🔭 Heraus ×10</button></div></div>';
  const cv = $('zmBild'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 360, H = Math.max(300, Math.min(window.innerHeight * 0.52, 560));
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  Object.assign(zm, { ctx: cv.getContext('2d'), W, H, dpr, sterne: Array.from({ length: 90 }, () => [Math.random(), Math.random(), Math.random()]) });
  $('zmRein').addEventListener('click', () => zmZoom(-1));
  $('zmRaus').addEventListener('click', () => zmZoom(1));
  $('zmTon').addEventListener('click', () => { const A = ftAudio(); if (!A) return; A.stumm = !A.stumm; $('zmTon').textContent = A.stumm ? '🔇' : '🔊'; });
  zmAnzeige(); zmLauf();
}
// Objekte, die bei Bildbreite 10^k ins Bild passen (5–200 % der Breite); das Bild am besten füllende steht zuletzt
const zmImBild = (k) => ZM_DINGE.filter((d) => { const a = d.s / 10 ** k; return a >= 0.05 && a <= 2; })
  .sort((x, y) => Math.abs(Math.log10(y.s / 10 ** k / 0.4)) - Math.abs(Math.log10(x.s / 10 ** k / 0.4)));   // bestes zuletzt
function zmZoom(r) {
  if (!zm || zm.fertig) return;
  const neu = zm.k + r;
  if (neu < ZM_MIN || neu > ZM_MAX) { zm.text = neu < ZM_MIN ? 'Kleiner geht es nicht – darunter wissen wir (noch) nicht weiter.' : 'Weiter können wir nicht sehen.'; zmAnzeige(); if (navigator.vibrate) navigator.vibrate(30); return; }
  const alt = zm.k; zm.k = neu; zm.schritte++;
  const neuBesucht = !zm.besucht.has(neu); zm.besucht.add(neu); zm.min = Math.min(zm.min, neu); zm.max = Math.max(zm.max, neu);
  ftLaut = Math.min(40, zm.besucht.size);
  if (!ftAk || !ftAk.takt) ftTaktStarten();
  const dinge = zmImBild(neu), st = zmStore();
  const neuEntdeckt = dinge.filter((d) => !st.entdeckt.includes(d.n));
  if (neuEntdeckt.length) { st.entdeckt.push(...neuEntdeckt.map((d) => d.n)); saveJson(ZM_KEY, st); }
  ftFaltKlang(zm.besucht.size, neuEntdeckt.length > 0 && neuBesucht);
  zm.anim = { von: alt, bis: neu, t0: performance.now(), dauer: 650 };
  const d = dinge[dinge.length - 1];
  zm.text = d ? d.e ? d.e + ' ' + d.n : d.n : 'Hier ist vor allem … leerer Raum.';
  zm.info = d ? (/\d/.test(d.t) ? d.t : d.t + ' · ' + zmLaenge(d.s)) : '';   // Größe nur ergänzen, wenn der Text keine nennt
  if (navigator.vibrate) navigator.vibrate(8);
  zmAnzeige();
  if (!zm.ende && zm.min === ZM_MIN && zm.max === ZM_MAX) setTimeout(zmEnde, 1100);
}
function zmAnzeige() {
  $('zmZahl').innerHTML = 'Bildbreite <em>' + zmHoch(zm.k) + ' m</em> <small>= ' + zmLaenge(10 ** zm.k) + '</small>';
  const span = ZM_MAX - ZM_MIN, pos = (x) => ((x - ZM_MIN) / span) * 100;
  $('zmBereich').style.left = pos(zm.min) + '%'; $('zmBereich').style.width = pos(zm.max) - pos(zm.min) + '%';
  $('zmPunkt').style.left = pos(zm.k) + '%';
  $('zmText').textContent = zm.text; $('zmInfo').textContent = zm.info || 'Entdeckt: ' + zmStore().entdeckt.length + ' von ' + ZM_DINGE.length;
}
function zmLauf() {
  cancelAnimationFrame(zmAnim);
  const s = () => { if (!zm || !zm.ctx || !ftMusikSpielt()) return; zmMalen(); zmAnim = requestAnimationFrame(s); };
  zmAnim = requestAnimationFrame(s);
}
function zmMalen() {
  const { ctx: c, W, H, dpr } = zm, jetzt = performance.now();
  if (zm.anim) { const f = Math.min(1, (jetzt - zm.anim.t0) / zm.anim.dauer); zm.kA = zm.anim.von + (zm.anim.bis - zm.anim.von) * ftEase(f); if (f >= 1) zm.anim = null; } else zm.kA = zm.k;
  const V = 10 ** zm.kA, cx = W / 2, cy = H / 2, ein = Math.min(W, H) * 0.9;   // ein = Pixel für die Bildbreite
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Hintergrund: Weltraum bei großen, „Zell-Blau“ bei kleinen Maßstäben
  const kosmos = Math.min(1, Math.max(0, (zm.kA - 6) / 4)), mikro = Math.min(1, Math.max(0, (-3 - zm.kA) / 4));
  const hg = c.createRadialGradient(cx, cy, 10, cx, cy, W);
  hg.addColorStop(0, mikro > 0.5 ? '#0e3a4a' : kosmos > 0.5 ? '#1e1b4b' : '#1e293b'); hg.addColorStop(1, '#070a1a');
  c.fillStyle = hg; c.fillRect(0, 0, W, H);
  if (ftAk && ftAk.takt && !ftAk.stumm) { const ph = ((ftAk.c.currentTime - ftAk.start) / (FT_ACHTEL * 2)) % 1; c.fillStyle = 'rgba(160,140,255,' + (0.05 * (1 - ph)) + ')'; c.fillRect(0, 0, W, H); }
  // Sterne (weit) bzw. Teilchen (klein) – Parallaxe mit dem Zoom
  zm.sterne.forEach(([x, y, s]) => {
    const z = ((zm.kA * 0.35 + s * 3) % 1 + 1) % 1, sx = cx + (x - 0.5) * W * (0.3 + z * 1.4), sy = cy + (y - 0.5) * H * (0.3 + z * 1.4);
    c.fillStyle = mikro > 0.5 ? 'rgba(125,211,252,' + (0.12 + s * 0.2) + ')' : 'rgba(255,255,255,' + (0.2 + s * 0.5) * (0.4 + kosmos * 0.6) + ')';
    c.fillRect(sx, sy, 1 + s * 1.5, 1 + s * 1.5);
  });
  // Objekte von groß nach klein (kleine liegen oben)
  const sichtbar = ZM_DINGE.map((d) => ({ d, px: (d.s / V) * ein })).filter((o) => o.px > 3 && o.px < W * 14).sort((a, b) => b.px - a.px);
  let beschriftet = 0;
  sichtbar.forEach(({ d, px }) => {
    const alpha = Math.min(1, (px - 3) / 12) * (px > ein * 1.2 ? Math.max(0.12, 1 - (px - ein * 1.2) / (W * 6)) : 1);
    c.globalAlpha = alpha;
    if (d.ring) { c.strokeStyle = d.f; c.lineWidth = 1.5; c.setLineDash([5, 5]); c.beginPath(); c.arc(cx, cy, px / 2, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
    else if (d.e && px < ein * 1.4) { c.font = Math.round(px * 0.92) + 'px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.e, cx, cy + px * 0.04); }
    else { const g = c.createRadialGradient(cx - px * 0.15, cy - px * 0.15, px * 0.05, cx, cy, px / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, d.f || '#94a3b8'); g.addColorStop(1, 'rgba(0,0,0,0.15)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, px / 2, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
    if (px >= 14 && px < ein * 0.95 && beschriftet < 3) {
      const y = Math.min(H - 14, cy + px / 2 + 14 + beschriftet * 0);
      c.font = '700 12px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,.92)';
      c.fillText(d.n, cx + (beschriftet === 1 ? -W * 0.28 : beschriftet === 2 ? W * 0.28 : 0), beschriftet ? cy - px / 2 - 12 : y);
      beschriftet++;
    }
  });
  // Maßstabsbalken (1/10 der Bildbreite)
  const bal = ein / 10, bx = 16, by = H - 18;
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by - 5); c.lineTo(bx, by); c.lineTo(bx + bal, by); c.lineTo(bx + bal, by - 5); c.stroke();
  c.font = '600 11px system-ui'; c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(zmLaenge(10 ** (zm.kA - 1)), bx + bal + 6, by - 2);
  // Sucher-Rahmen wie bei einer Kamera
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; const r = ein / 2;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { c.beginPath(); c.moveTo(cx + sx * r, cy + sy * (r - 14)); c.lineTo(cx + sx * r, cy + sy * r); c.lineTo(cx + sx * (r - 14), cy + sy * r); c.stroke(); });
}
function zmEnde() {
  if (!zm || zm.fertig) return;
  zm.fertig = true;
  const abw = Math.abs(zm.schaetzung - ZM_SCHRITTE), st = zmStore(), rekord = st.best.abw == null || abw < st.best.abw;
  if (rekord) st.best.abw = abw; st.runden++; saveJson(ZM_KEY, st);
  const q = Math.max(0, 1 - abw / 30);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('zoom', Math.round(q * 100) / 10, 10, 'Schätzung ' + zm.schaetzung + ' (richtig: rund 42)', { schaetzung: zm.schaetzung, schritte: zm.schritte, entdeckt: st.entdeckt.length, rekord });
  if (typeof konfetti === 'function') konfetti(45, ['🌌', '⚛️', '✨', '🔭']);
  const d = document.createElement('div'); d.className = 'ft-ergebnis';
  d.innerHTML = '<div class="ft-karte"><div class="zm-logo" aria-hidden="true">🌌</div><h3>Einmal durchs ganze Universum!</h3>'
    + '<p class="ft-gross">Vom Proton bis zum Rand: rund <b>42</b> Zehnerschritte</p>'
    + '<p>Deine Schätzung: <b>' + zm.schaetzung + '</b>' + (abw ? ' – ' + abw + ' daneben' : ' – genau!') + '. Genau gerechnet sind es 41,7 – also tatsächlich <b>42</b>, die „Antwort auf alles“. 😄</p>'
    + '<p>Entdeckt: <b>' + st.entdeckt.length + '</b> von ' + ZM_DINGE.length + ' · ' + zm.schritte + ' Zoom-Schritte</p>'
    + '<p class="ft-klein">Der Mensch liegt ziemlich genau in der Mitte: rund 15 Zehnerschritte bis zum Proton, 27 bis zum Rand des sichtbaren Universums.</p>'
    + '<div class="ft-karte-knoepfe"><button type="button" class="btn ft-los zm-los" id="zmWeiter">🔭 Weiter erkunden</button><button type="button" class="btn secondary" id="zmNochmal">Nochmal schätzen</button></div></div>';
  $('zmInhalt').appendChild(d);
  $('zmWeiter').addEventListener('click', () => { d.remove(); zm.fertig = false; zm.ende = true; zmAnzeige(); });   // frei weiter erkunden, ohne erneute Auswertung
  $('zmNochmal').addEventListener('click', () => zmIntro());
}
$('hubZoom').addEventListener('click', () => { merkeZuletzt('zoom'); zoomZu($('hubZoom'), zmOeffnen); });
$('zmZurueck').addEventListener('click', () => { ftTaktStoppen(); cancelAnimationFrame(zmAnim); if (zm) { zmIntro(); return; } zeigeHub(); });
