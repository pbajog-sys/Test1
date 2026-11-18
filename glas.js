// 🦠 Verdopplung im Glas – Bakterien verdoppeln sich jede Minute, um 12:00 ist das Glas voll.
// Drei Fragen (halb voll? · wie voll um 11:55? · 3 neue Gläser – wie lange reicht das?), dazwischen läuft die Zeit
// mit dem Happy-Hardcore-Beat aus falten.js. Nach dem bekannten Gedankenexperiment von Albert A. Bartlett.
// Speicher: walquiz.glas.v1 = { best, runden }
const GL_KEY = 'walquiz.glas.v1';
const GL_FRAGEN = [
  { bei: 0, id: 'halb', frage: 'Die Bakterien verdoppeln sich jede Minute. Um 12:00 Uhr ist das Glas voll. Um wie viel Uhr war es <b>halb voll</b>?', art: 'uhr', richtig: 59, erkl: 'Um 11:59 – nur eine Minute vorher! Eine Verdopplung später ist das Glas voll.' },
  { bei: 55, id: 'voll', frage: 'Es ist <b>11:55 Uhr</b>. Die Bakterien finden: Es ist noch jede Menge Platz. Wie voll ist das Glas gerade?', art: 'wahl', optionen: ['3 %', '25 %', '50 %', '80 %'], richtig: 0, erkl: 'Gut 3 % (genau 3,125 %) – fünf Minuten vor dem Ende sieht das Glas noch fast leer aus.' },
  { bei: 58, id: 'gläser', frage: 'Rettung! Die Bakterien entdecken <b>drei neue, leere Gläser</b> – jetzt haben sie viermal so viel Platz. Wie lange reicht das?', art: 'wahl', optionen: ['2 Minuten', '1 Stunde', '3 Stunden', '4 Stunden'], richtig: 0, erkl: 'Nur 2 Minuten: 4× so viel Platz sind genau 2 Verdopplungen. Um 12:02 sind alle vier Gläser voll.' },
];
let gl = null, glAnim = null, glAuto = null;
const glStore = () => { const s = loadJson(GL_KEY); s.runden = s.runden || 0; return s; };
const glUhr = (m) => { const t = 11 * 60 + m; return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const glAnzahl = (m) => 2 ** m;   // 1 Bakterium um 11:00
function glZahlWort(n) {
  const st = [[1e18, 'Trillionen'], [1e15, 'Billiarden'], [1e12, 'Billionen'], [1e9, 'Milliarden'], [1e6, 'Millionen']];
  for (const [g, w] of st) if (n >= g) return (n / g).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' ' + w;
  return Math.round(n).toLocaleString('de-DE');
}
function glProzent(m, glaeser = 1) {
  const p = (100 * 2 ** (m - 60)) / glaeser;
  if (p >= 1) return p.toLocaleString('de-DE', { maximumFractionDigits: p < 10 ? 2 : 1 }) + ' %';
  const d = Math.ceil(-Math.log10(p)) + 1;
  return p.toLocaleString('de-DE', { maximumFractionDigits: Math.min(20, d) }) + ' %';
}
function glOeffnen() { show('glas', '🦠 Verdopplung im Glas'); glIntro(); }
function glIntro() {
  ftTaktStoppen(); cancelAnimationFrame(glAnim); clearInterval(glAuto); gl = null;
  const st = glStore();
  $('glInhalt').innerHTML = '<div class="ft-intro"><div class="gl-logo" aria-hidden="true"><i></i></div><h2 class="gl-h">Verdopplung im Glas</h2>'
    + '<p>Um <b>11:00 Uhr</b> kommt ein einziges Bakterium in ein Glas. Jede Minute teilt sich jedes Bakterium – ihre Zahl <b>verdoppelt</b> sich. Um <b>12:00 Uhr</b> ist das Glas voll.</p>'
    + '<p class="ft-klein">Drei Fragen, dazwischen läuft die Uhr – mit Beat. 🔊' + (st.runden ? '<br>Bisher gespielt: ' + st.runden + '× · beste Runde ' + (st.best || 0) + '/3' : '') + '</p>'
    + '<button type="button" class="btn ft-los gl-los" id="glLos">🦠 Los geht’s</button></div>';
  $('glLos').addEventListener('click', () => { ftAudio(); glStart(); });
}
function glStart() {
  ftLaut = 0;
  gl = { m: 0, glaeser: 1, frage: 0, richtig: 0, antworten: [], fertig: false, mA: 0, anim: null, ende: 60 };
  $('glInhalt').innerHTML = '<div class="ft-kopf"><div class="ft-zahl gl-zahl" id="glZahl"></div></div>'
    + '<canvas id="glBild" class="ft-bild gl-bild"></canvas>'
    + '<div class="ft-unten"><div class="gl-werte" id="glWerte"></div><div id="glFrage"></div>'
    + '<div class="gl-knoepfe" id="glKnoepfe"><button type="button" class="ft-ton" id="glTon" aria-label="Ton an/aus">' + (ftAk && ftAk.stumm ? '🔇' : '🔊') + '</button><button type="button" class="btn gl-minute" id="glMinute">+1 Minute</button><button type="button" class="btn gl-auto" id="glAutoBtn">⏩ Laufen lassen</button></div></div>';
  const cv = $('glBild'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 360, H = Math.max(280, Math.min(window.innerHeight * 0.45, 460));
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  Object.assign(gl, { ctx: cv.getContext('2d'), W, H, dpr, punkte: Array.from({ length: 260 }, () => [Math.random(), Math.random(), Math.random()]) });
  $('glMinute').addEventListener('click', () => glWeiter());
  $('glAutoBtn').addEventListener('click', glAutoUmschalten);
  $('glTon').addEventListener('click', () => { const A = ftAudio(); if (!A) return; A.stumm = !A.stumm; $('glTon').textContent = A.stumm ? '🔇' : '🔊'; });
  glAnzeige(); glLauf(); glFrageZeigen();
}
function glAutoUmschalten() {
  if (glAuto) { clearInterval(glAuto); glAuto = null; } else { glAuto = setInterval(() => glWeiter(), FT_ACHTEL * 4 * 1000); glWeiter(); }
  $('glAutoBtn').textContent = glAuto ? '⏸ Anhalten' : '⏩ Laufen lassen';
}
function glWeiter() {
  if (!gl || gl.fertig || gl.offen) return;
  if (gl.m >= gl.ende) return;
  const alt = gl.m; gl.m++;
  ftLaut = Math.min(40, Math.round(gl.m * 0.68));
  if (!ftAk || !ftAk.takt) ftTaktStarten();
  ftFaltKlang(gl.m, gl.m >= 55);
  gl.anim = { von: alt, bis: gl.m, t0: performance.now(), dauer: 420 };
  if (navigator.vibrate && gl.m >= 56) navigator.vibrate(10);
  glAnzeige();
  const f = GL_FRAGEN[gl.frage];
  if (f && gl.m === f.bei) { if (glAuto) glAutoUmschalten(); setTimeout(glFrageZeigen, 450); }
  if (gl.m === gl.ende) { if (glAuto) glAutoUmschalten(); setTimeout(glEnde, 900); }
}
function glAnzeige() {
  $('glZahl').innerHTML = '<span class="gl-uhr">🕐 ' + glUhr(gl.m) + '</span>';
  $('glWerte').innerHTML = '<span>🦠 <b>' + glZahlWort(glAnzahl(gl.m)) + '</b> ' + (gl.m === 0 ? 'Bakterium' : 'Bakterien') + '</span><span>' + (gl.glaeser > 1 ? 'Alle Gläser' : 'Glas') + ' zu <b>' + glProzent(gl.m, gl.glaeser) + '</b> voll</span>';
}
function glFrageZeigen() {
  const f = GL_FRAGEN[gl.frage];
  if (!f || gl.m !== f.bei) { $('glFrage').innerHTML = ''; $('glKnoepfe').hidden = false; return; }
  gl.offen = true; $('glKnoepfe').hidden = true;
  let eingabe;
  if (f.art === 'uhr') eingabe = '<div class="ft-schaetzen"><input type="range" id="glSchieber" min="1" max="59" value="30" aria-label="Uhrzeit"><output id="glWahl"></output></div><button type="button" class="btn ft-los gl-los" id="glAntwort">Antworten</button>';
  else eingabe = '<div class="gl-optionen">' + f.optionen.map((o, i) => '<button type="button" class="gl-opt" data-o="' + i + '">' + o + '</button>').join('') + '</div>';
  $('glFrage').innerHTML = '<div class="gl-frage"><p>' + f.frage + '</p>' + eingabe + '<div id="glErkl"></div></div>';
  if (f.art === 'uhr') {
    const zeig = () => { $('glWahl').textContent = glUhr(+$('glSchieber').value) + ' Uhr'; };
    $('glSchieber').addEventListener('input', zeig); zeig();
    $('glAntwort').addEventListener('click', () => glAntwort(+$('glSchieber').value));
  } else $('glFrage').querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => glAntwort(+b.dataset.o, b)));
}
function glAntwort(wert, knopf) {
  const f = GL_FRAGEN[gl.frage];
  if (!gl.offen || $('glWeiterFrage')) return;
  const ok = wert === f.richtig;
  if (ok) gl.richtig++;
  gl.antworten.push(wert);
  if (f.art === 'uhr') { $('glSchieber').disabled = true; $('glAntwort').remove(); }
  else $('glFrage').querySelectorAll('[data-o]').forEach((b) => { b.disabled = true; if (+b.dataset.o === f.richtig) b.classList.add('richtig'); else if (b === knopf) b.classList.add('falsch'); });
  ftFaltKlang(ok ? 24 : 7, ok);
  if (f.id === 'gläser') { gl.glaeser = 4; gl.ende = 62; glAnzeige(); }
  $('glErkl').innerHTML = '<p class="gl-erkl">' + (ok ? '✅ Richtig! ' : '❌ ') + f.erkl + '</p><button type="button" class="btn ft-los gl-los" id="glWeiterFrage">Weiter ▶</button>';
  $('glWeiterFrage').addEventListener('click', () => { gl.offen = false; gl.frage++; $('glFrage').innerHTML = ''; $('glKnoepfe').hidden = false; });
}
function glLauf() {
  cancelAnimationFrame(glAnim);
  const s = () => { if (!gl || !gl.ctx || !ftMusikSpielt()) return; glMalen(); glAnim = requestAnimationFrame(s); };
  glAnim = requestAnimationFrame(s);
}
function glMalen() {
  const { ctx: c, W, H, dpr } = gl, jetzt = performance.now();
  if (gl.anim) { const f = Math.min(1, (jetzt - gl.anim.t0) / gl.anim.dauer); gl.mA = gl.anim.von + (gl.anim.bis - gl.anim.von) * ftEase(f); if (f >= 1) gl.anim = null; } else gl.mA = gl.m;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const hg = c.createLinearGradient(0, 0, 0, H); hg.addColorStop(0, '#132a2a'); hg.addColorStop(1, '#071414'); c.fillStyle = hg; c.fillRect(0, 0, W, H);
  if (ftAk && ftAk.takt && !ftAk.stumm) { const ph = ((ftAk.c.currentTime - ftAk.start) / (FT_ACHTEL * 2)) % 1; c.fillStyle = 'rgba(110,231,183,' + (0.045 * (1 - ph)) + ')'; c.fillRect(0, 0, W, H); }
  // Gläser: eins, ab der Rettung vier
  const n = gl.glaeser, gb = n > 1 ? W * 0.19 : W * 0.34, gh = H * 0.62, abst = n > 1 ? W * 0.22 : 0, x0 = W / 2 - ((n - 1) * abst) / 2, yb = H * 0.86;
  const voll = Math.min(1, (2 ** (gl.mA - 60)) / n);
  for (let i = 0; i < n; i++) {
    const cx = x0 + i * abst, l = cx - gb / 2, r = cx + gb / 2, t = yb - gh;
    const fh = gh * voll;
    if (fh > 0.3) { const g = c.createLinearGradient(0, yb - fh, 0, yb); g.addColorStop(0, '#86efac'); g.addColorStop(1, '#15803d'); c.fillStyle = g; c.beginPath(); c.moveTo(l + 4, yb - fh); c.lineTo(r - 4, yb - fh); c.lineTo(r - 4 - 6, yb); c.lineTo(l + 4 + 6, yb); c.closePath(); c.fill(); }
    c.strokeStyle = 'rgba(220,252,231,.85)'; c.lineWidth = 3; c.beginPath(); c.moveTo(l, t); c.lineTo(l + 8, yb); c.lineTo(r - 8, yb); c.lineTo(r, t); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(l + 8, t + 10); c.lineTo(l + 14, yb - 10); c.stroke();
  }
  // Lupe: so sieht die Kolonie aus (je Minute doppelt so viele Punkte, bis die Lupe voll ist)
  const lr = Math.min(W, H) * 0.17, lx = W - lr - 14, ly = lr + 14, zahl = Math.min(gl.punkte.length, Math.round(2 ** Math.min(8, gl.mA)));
  c.save(); c.beginPath(); c.arc(lx, ly, lr, 0, Math.PI * 2); c.fillStyle = 'rgba(8,30,30,.9)'; c.fill(); c.clip();
  for (let i = 0; i < zahl; i++) { const [a, b, s] = gl.punkte[i]; const rr = Math.sqrt(a) * lr * 0.92, w = b * Math.PI * 2; c.fillStyle = 'hsl(' + (130 + s * 30) + ',70%,' + (50 + s * 20) + '%)'; c.beginPath(); c.ellipse(lx + Math.cos(w) * rr, ly + Math.sin(w) * rr, 2.6, 1.6, w, 0, Math.PI * 2); c.fill(); }
  c.restore(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(lx, ly, lr, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(lx - lr * 0.72, ly + lr * 0.72); c.lineTo(lx - lr * 1.15, ly + lr * 1.15); c.lineWidth = 6; c.stroke();
  c.font = '600 11px system-ui'; c.fillStyle = 'rgba(220,252,231,.8)'; c.textAlign = 'center'; c.fillText('Lupe', lx, ly + lr + 16);
  // Hinweis, solange man im Glas noch nichts sieht
  if (voll < 0.004) { c.font = '600 13px system-ui'; c.fillStyle = 'rgba(220,252,231,.7)'; c.textAlign = 'center'; c.fillText('Im Glas sieht man noch nichts …', W / 2 - (n > 1 ? 0 : W * 0.08), H * 0.3); }
}
function glEnde() {
  gl.fertig = true;
  const st = glStore(); st.runden++; st.best = Math.max(st.best || 0, gl.richtig); saveJson(GL_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('glas', gl.richtig, 3, gl.richtig + ' von 3 richtig', { antworten: gl.antworten });
  if (typeof konfetti === 'function') konfetti(35, ['🦠', '🧫', '✨']);
  const d = document.createElement('div'); d.className = 'ft-ergebnis';
  d.innerHTML = '<div class="ft-karte"><div class="gl-logo" aria-hidden="true"><i style="height:100%"></i></div><h3>12:02 – alle Gläser voll</h3>'
    + '<p class="ft-gross"><b>' + gl.richtig + '</b> von 3 richtig</p>'
    + '<p>Um 11:55 sah das Glas fast leer aus – und fünf Minuten später war es voll. Selbst viermal so viel Platz reichte nur zwei Minuten.</p>'
    + '<p class="ft-klein">Das Gedankenexperiment stammt vom US-Physiker Albert A. Bartlett. Sein berühmter Satz: Die größte Schwäche der Menschheit ist, dass wir die Exponentialfunktion nicht verstehen.</p>'
    + '<div class="ft-karte-knoepfe"><button type="button" class="btn ft-los gl-los" id="glNochmal">Nochmal</button></div></div>';
  $('glInhalt').appendChild(d);
  $('glNochmal').addEventListener('click', () => glIntro());
}
$('hubGlas').addEventListener('click', () => { merkeZuletzt('glas'); zoomZu($('hubGlas'), glOeffnen); });
$('glZurueck').addEventListener('click', () => { ftTaktStoppen(); clearInterval(glAuto); glAuto = null; cancelAnimationFrame(glAnim); if (gl) { glIntro(); return; } zeigeHub(); });
