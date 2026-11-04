// 🧠💥 Dopamin-Maschine: drei Spiele gleichzeitig (Blasen, Slot-Maschine, Roulette) über einem endlosen Block-Parkour-„Video“.
// Jede geplatzte Blase und jeder Gewinn zündet Feuerwerk (leuchtende Funken, Raketen bei großen Gewinnen).
// Bewusst überladen: Combos, Multiplikator, Zufallsbelohnungen, Beinahe-Gewinne, Level-ups, Sounds, pulsierende Farben.
// Kein Stroboskop: Farbwechsel sind weich, Aufblitzen höchstens schwach und selten (unter 3 pro Sekunde). „Ruhig“-Modus dämpft alles.
// Am Ende deckt die Maschine auf, welche Tricks sie benutzt hat – die Punkte sind nichts wert.
const DP_KEY = 'walquiz.dopamin.v1';
let dp = null, dpLauf = 0;

// ---------- Ton ----------
let dpAc = null;
function dpTon(f, d = 0.08, art = 'square', laut = 0.05, verz = 0) {
  if (!dp || dp.stumm) return;
  try {
    dpAc = dpAc || new (window.AudioContext || window.webkitAudioContext)();
    const t = dpAc.currentTime + verz, o = dpAc.createOscillator(), g = dpAc.createGain();
    o.type = art; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(dpAc.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (e) { /* ohne Ton */ }
}
// ---------- Feuerwerk ----------
// Explosion: Funken fliegen ringförmig auseinander, ziehen eine Leuchtspur, fallen langsam und verglühen
function dpExplosion(x, y, n, kraft = 1, hue) {
  if (!dp) return;
  dp.stat.feuerwerke++;
  const h0 = hue == null ? Math.random() * 360 : hue, zwei = Math.random() < 0.5;
  for (let i = 0; i < n; i++) {
    const w = (i / n) * Math.PI * 2 + Math.random() * 0.2, v = (2.2 + Math.random() * 2.4) * kraft;
    dp.funken.push({ x, y, px: x, py: y, vx: Math.cos(w) * v, vy: Math.sin(w) * v, t: 0, leben: 0.8 + Math.random() * 0.6, h: (zwei && i % 2 ? h0 + 160 : h0) + Math.random() * 30, gr: 1.6 + Math.random() * 1.6 });
  }
  if (dp.funken.length > 1400) dp.funken.splice(0, dp.funken.length - 1400);
  dpTon(1200 + Math.random() * 400, 0.05, 'triangle', 0.02);
}
// Raketen steigen vom unteren Rand auf und explodieren oben im Bild
function dpRaketen(n) {
  for (let i = 0; i < n; i++) dp.raketen.push({ x: dp.w * (0.15 + Math.random() * 0.7), y: dp.h, vy: -(9 + Math.random() * 4), zielY: dp.h * (0.12 + Math.random() * 0.35), verz: i * 0.18, h: Math.random() * 360 });
}
const dpArpeggio = (basis) => [0, 4, 7, 12, 16].forEach((h, i) => dpTon(basis * Math.pow(2, h / 12), 0.12, 'triangle', 0.06, i * 0.06));

// ---------- Start / Ende ----------
function dopaminIntro() {
  dpStopp();
  const st = loadJson(DP_KEY);
  $('dpInhalt').innerHTML = '<div class="dp-intro"><div class="dp-logo">🧠💥</div><h2 class="dp-titel">DOPAMIN-MASCHINE</h2>'
    + '<p class="dp-lead">Drei Spiele gleichzeitig. Darunter läuft Block-Parkour. Punkte, Combos, Jackpots, Level-ups – alles auf einmal.</p>'
    + '<ul class="dp-regeln"><li>🫧 <b>Blasen:</b> antippen, bevor sie platzen – jede zündet ein Feuerwerk, goldene ein großes.</li><li>🎰 <b>Slot-Maschine:</b> antippen und drehen. Drei gleiche = Gewinn, drei 💎 = Jackpot.</li><li>🎡 <b>Roulette:</b> unten auf ROT oder SCHWARZ setzen, die Kugel rollt. Grün (0) ist für die Bank.</li></ul>'
    + '<p class="dp-warn">⚠️ Viel Bewegung und Farbwechsel (keine schnellen Blitze). Bei Lichtempfindlichkeit lieber „Ruhig“.</p>'
    + '<div class="dp-knoepfe"><button type="button" class="dp-los" data-modus="voll">🔥 Volle Dröhnung</button><button type="button" class="dp-ruhig" data-modus="ruhig">😌 Ruhig</button></div>'
    + (st.best ? '<p class="dp-best">Bestwert: ' + fmt(st.best) + ' Punkte · ' + (st.runden || 0) + ' Runden</p>' : '') + '</div>';
  $('dpInhalt').querySelectorAll('[data-modus]').forEach((b) => b.addEventListener('click', () => dopaminStart(b.dataset.modus === 'ruhig')));
}
function dopaminStart(ruhig) {
  try { dpAc = dpAc || new (window.AudioContext || window.webkitAudioContext)(); dpAc.resume(); } catch (e) { /* ohne Ton */ }
  $('dpInhalt').innerHTML = '<div class="dp-kopf"><div class="dp-punkte"><b id="dpPunkte">0</b><small id="dpMulti">×1</small></div><div class="dp-level"><span id="dpLevelText">LEVEL 1</span><div class="dp-lbalken"><i id="dpLevelBalken"></i></div></div>'
    + '<span class="dp-zeit" id="dpZeit">0:00</span><button type="button" class="dp-ton" id="dpTon" aria-label="Ton an/aus">🔊</button><button type="button" class="dp-ende" id="dpEnde">Ende</button></div>'
    + '<canvas id="dpBild" class="dp-bild"></canvas><div class="dp-banner" id="dpBanner"></div>';
  const cv = $('dpBild');
  dp = { ruhig, stumm: false, punkte: 0, multi: 1, combo: 0, level: 1, start: performance.now(), letzte: 0, schuettel: 0, blitz: 0, pausenHinweis: 5,
    stat: { belohnungen: 0, zufall: 0, knapp: 0, wechsel: 0, levelups: 0, taps: 0, jackpots: 0, roulette: 0, rouletteGewinne: 0, rouletteNull: 0, feuerwerke: 0 }, letztesFeld: -1,
    blasen: [], blasenTakt: 0,
    rad: { walzen: ['🍒', '⭐', '💎'], dreht: 0, ergebnis: null }, roul: { winkel: 0, dreht: 0, zahl: null, einsatz: null, letzte: [] }, raketen: [], park: { x: 0, spieler: { y: 0, vy: 0, tot: 0 }, welt: [] },
    texte: [], funken: [] };
  dpParkourWelt();
  const groesse = () => { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); dp.w = r.width; dp.h = r.height; cv.getContext('2d').setTransform(d, 0, 0, d, 0, 0); };
  groesse(); dp.groesse = groesse;
  cv.addEventListener('pointerdown', dpTipp);
  $('dpEnde').addEventListener('click', dopaminEnde);
  $('dpTon').addEventListener('click', () => { dp.stumm = !dp.stumm; $('dpTon').textContent = dp.stumm ? '🔇' : '🔊'; });
  const lauf = ++dpLauf;
  const frame = (t) => { if (lauf !== dpLauf || !dp) return; dpUpdate(t); dpZeichnen(t); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
function dpStopp() { dpLauf++; dp = null; }

// ---------- Aufteilung: oben drei Spiele nebeneinander, unten das Parkour-„Video“ ----------
function dpFelder() {
  const W = dp.w, H = dp.h, quer = W > H * 1.1;
  if (quer) { const sw = W * 0.6 / 3; return [{ x: 0, y: 0, w: sw, h: H }, { x: sw, y: 0, w: sw, h: H }, { x: 2 * sw, y: 0, w: sw, h: H }, { x: W * 0.6, y: 0, w: W * 0.4, h: H }]; }
  const oh = H * 0.56, sw = W / 3;
  return [{ x: 0, y: 0, w: sw, h: oh }, { x: sw, y: 0, w: sw, h: oh }, { x: 2 * sw, y: 0, w: sw, h: oh }, { x: 0, y: oh, w: W, h: H - oh }];
}

// ---------- Punkte & Belohnungen ----------
function dpGib(pkt, x, y, text, farbe, gross) {
  const p = Math.round(pkt * dp.multi);
  dp.punkte += p; dp.stat.belohnungen++;
  dp.texte.push({ x, y, t: 0, text: text || '+' + p, farbe: farbe || '#fde047', gross });
  dpExplosion(x, y, gross ? 70 : 28, gross ? 1.4 : 0.8);
  if (gross) dpRaketen(3 + Math.floor(Math.random() * 3));
  // Aufhellen höchstens alle 500 ms (unter 3 pro Sekunde, kein Stroboskop)
  if (gross && !dp.ruhig) { dp.schuettel = 220; const jetzt = performance.now(); if (jetzt - (dp.letzterBlitz || 0) > 500) { dp.blitz = 0.22; dp.letzterBlitz = jetzt; dp.stat.blitze = (dp.stat.blitze || 0) + 1; } }
  // Level: jede Stufe braucht etwas mehr – der Balken ist fast immer „gleich voll“
  const brauch = (L) => 300 * L * (L + 1);
  while (dp.punkte >= brauch(dp.level)) { dp.level++; dp.stat.levelups++; dpBanner('LEVEL ' + dp.level + '!'); dpArpeggio(392); if (typeof konfetti === 'function' && !dp.ruhig) konfetti(18, ['⭐', '🔥', '💎', '🎉']); }
}
function dpCombo(an) {
  if (an) { dp.combo++; dp.multi = Math.min(10, 1 + Math.floor(dp.combo / 5)); }
  else { if (dp.combo >= 10) dpBanner('COMBO WEG 😱'); dp.combo = 0; dp.multi = 1; }
}
function dpBanner(text) {
  const b = $('dpBanner'); if (!b) return;
  b.textContent = text; b.classList.remove('an'); void b.offsetWidth; b.classList.add('an');
}

// ---------- Eingabe ----------
function dpTipp(e) {
  if (!dp) return;
  const r = $('dpBild').getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, F = dpFelder();
  const i = F.findIndex((f) => x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
  if (i < 0 || i === 3) return;
  dp.stat.taps++;
  if (dp.letztesFeld !== -1 && dp.letztesFeld !== i) dp.stat.wechsel++;
  dp.letztesFeld = i;
  const f = F[i];
  if (i === 0) {
    // Blasen: die oberste getroffene platzt
    const b = dp.blasen.slice().reverse().find((q) => Math.hypot(q.x * f.w + f.x - x, q.y * f.h + f.y - y) < q.r + 10);
    if (b) { b.weg = 1; dpCombo(true); dpGib(b.gold ? 100 : 10, x, y, b.gold ? 'GOLD +' + Math.round(100 * dp.multi) : null, b.gold ? '#fbbf24' : null, b.gold); dpExplosion(x, y, b.gold ? 0 : 16, 0.6, b.f); dpTon(500 + dp.combo * 25, 0.07, 'square'); if (b.gold) { dp.stat.zufall++; dpArpeggio(660); } }
    else dpTon(140, 0.05, 'sawtooth', 0.03);
  } else if (i === 1) dpDrehen(f);
  else dpRoulette(f, x, y);
}
// ---------- Roulette (europäisch, ehrlich: 37 Felder, die 0 gehört der Bank) ----------
const DP_KESSEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const DP_ROT = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const dpFarbe = (z) => (z === 0 ? 'gruen' : DP_ROT.has(z) ? 'rot' : 'schwarz');
function dpRoulette(f, x, y) {
  const R = dp.roul;
  if (R.dreht) return;
  // unten zwei Felder: ROT | SCHWARZ; ein Tipp auf den Kessel wiederholt den letzten Einsatz
  const unten = y > f.y + f.h * 0.78;
  const einsatz = unten ? (x < f.x + f.w / 2 ? 'rot' : 'schwarz') : R.einsatz || 'rot';
  R.einsatz = einsatz; R.dreht = 1; R.start = performance.now(); R.feld = f;
  R.zahl = DP_KESSEL[Math.floor(Math.random() * 37)];
  // Endwinkel so, dass die Zahl oben unter dem Zeiger landet, plus ein paar volle Umdrehungen
  const idx = DP_KESSEL.indexOf(R.zahl), seg = (Math.PI * 2) / 37;
  R.von = R.winkel; R.bis = R.winkel - (R.winkel % (Math.PI * 2)) + Math.PI * 2 * 5 + (Math.PI * 2 - idx * seg);
  dp.stat.roulette++;
  dpTon(600, 0.05, 'square', 0.03);
}
function dpRouletteFertig() {
  const R = dp.roul, f = R.feld, farbe = dpFarbe(R.zahl);
  R.dreht = 0; R.winkel = R.bis; R.letzte.unshift(R.zahl); R.letzte = R.letzte.slice(0, 6);
  const cx = f.x + f.w / 2, cy = f.y + f.h * 0.42;
  if (farbe === R.einsatz) {
    dp.stat.rouletteGewinne++; dp.stat.zufall++;
    dpGib(200, cx, cy, (farbe === 'rot' ? '🔴' : '⚫') + ' ' + R.zahl + '! +' + Math.round(200 * dp.multi), '#fde047', true);
    dpArpeggio(494);
  } else {
    if (R.zahl === 0) { dp.stat.rouletteNull++; dp.texte.push({ x: cx, y: cy, t: 0, text: '🟢 0 – Bank gewinnt', farbe: '#4ade80', gross: true }); }
    else dp.texte.push({ x: cx, y: cy, t: 0, text: (farbe === 'rot' ? '🔴 ' : '⚫ ') + R.zahl + ' – leider', farbe: '#fb7185', gross: false });
    dpTon(220, 0.15, 'sine', 0.04);
  }
}
// Glücksrad: Gewinne kommen zufällig (variable Belohnung); bei Verlusten zeigt es oft „knapp daneben“
const DP_SYMBOLE = ['🍒', '⭐', '💎', '🐉', '7️⃣', '🍀'];
function dpDrehen(f) {
  const R = dp.rad;
  if (R.dreht > 0) return;
  R.dreht = 1; R.start = performance.now(); R.ergebnis = null;
  const z = Math.random();
  let w;
  if (z < 0.03) { w = ['💎', '💎', '💎']; R.art = 'jackpot'; }
  else if (z < 0.16) { const s = DP_SYMBOLE.filter((q) => q !== '💎')[Math.floor(Math.random() * 5)]; w = [s, s, s]; R.art = 'drei'; }
  else if (z < 0.65) { const s = DP_SYMBOLE[Math.floor(Math.random() * 6)]; w = [s, s, DP_SYMBOLE[(DP_SYMBOLE.indexOf(s) + 1) % 6]]; R.art = 'knapp'; }
  else { w = [0, 1, 2].map(() => DP_SYMBOLE[Math.floor(Math.random() * 6)]); if (w[0] === w[1] && w[1] === w[2]) w[2] = DP_SYMBOLE[(DP_SYMBOLE.indexOf(w[2]) + 2) % 6]; R.art = 'nix'; }
  R.ziel = w; R.feld = f;
}
function dpRadFertig() {
  const R = dp.rad, f = R.feld;
  R.walzen = R.ziel; R.dreht = 0;
  if (R.art === 'jackpot') { dp.stat.jackpots++; dp.stat.zufall++; dpGib(1000, f.x + f.w / 2, f.y + f.h * 0.45, 'JACKPOT!!! +' + Math.round(1000 * dp.multi), '#f472b6', true); dpBanner('💎 JACKPOT 💎'); dpArpeggio(523); setTimeout(() => dpArpeggio(784), 300); dpRaketen(8); }
  else if (R.art === 'drei') { dp.stat.zufall++; dpGib(150, f.x + f.w / 2, f.y + f.h * 0.45, 'GEWINN +' + Math.round(150 * dp.multi), '#fde047', true); dpArpeggio(440); }
  else if (R.art === 'knapp') { dp.stat.knapp++; dp.texte.push({ x: f.x + f.w / 2, y: f.y + f.h * 0.45, t: 0, text: 'SO KNAPP! 😫', farbe: '#fb7185', gross: true }); dpTon(330, 0.12, 'triangle'); dpTon(311, 0.2, 'triangle', 0.05, 0.12); }
  else dpTon(200, 0.1, 'sine', 0.04);
}

// ---------- Block-Parkour (nur zum Zuschauen) ----------
function dpParkourWelt() {
  const P = dp.park; P.welt = []; let x = 0, h = 3;
  for (let i = 0; i < 400; i++) {
    const art = i < 6 ? 'boden' : Math.random() < 0.18 ? 'luecke' : Math.random() < 0.1 ? 'lava' : 'boden';
    h = Math.max(2, Math.min(6, h + (Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0)));
    P.welt.push({ x, art, h }); x += 1;
  }
}
function dpParkourUpdate(dt) {
  const P = dp.park, s = P.spieler, tempo = 4.2;
  P.x += tempo * dt;
  if (P.x > 380) P.x = 0;
  const unter = (gx) => P.welt[Math.floor(gx) % P.welt.length];
  const fx = P.x + 3, hier = unter(fx), vor = unter(fx + 1.2), boden = hier.art === 'boden' ? hier.h : -5;
  if (s.tot > 0) { s.tot -= dt; if (s.tot <= 0) { s.y = 6; s.vy = 0; } return; }
  s.vy -= 30 * dt; s.y += s.vy * dt;
  if (s.y <= boden && s.vy <= 0 && hier.art === 'boden') { s.y = boden; s.vy = 0; if (vor.art !== 'boden' || vor.h > hier.h) s.vy = Math.random() < 0.92 ? 11.5 : 7; }
  if (s.y < 0.5 && (hier.art === 'lava' || hier.art === 'luecke')) { s.tot = 0.9; }
}

// ---------- Schleife ----------
function dpUpdate(t) {
  const dt = Math.min(0.05, (t - (dp.letzte || t)) / 1000); dp.letzte = t;
  const F = dpFelder(), sek = (t - dp.start) / 1000;
  $('dpZeit').textContent = Math.floor(sek / 60) + ':' + String(Math.floor(sek % 60)).padStart(2, '0');
  if (sek / 60 >= dp.pausenHinweis) { dpBanner('⏱ ' + dp.pausenHinweis + ' MIN – kurz Pause?'); dp.pausenHinweis += 5; }
  // Blasen
  dp.blasenTakt -= dt;
  if (dp.blasenTakt <= 0) { dp.blasen.push({ x: 0.15 + Math.random() * 0.7, y: 0.12 + Math.random() * 0.76, r: 13 + Math.random() * 10, t: 0, life: 1.6 + Math.random() * 0.8, gold: Math.random() < 0.06, f: Math.floor(Math.random() * 360) }); dp.blasenTakt = Math.max(0.35, 0.8 - sek * 0.004); }
  dp.blasen.forEach((b) => { b.t += dt; if (b.t > b.life && !b.weg) { b.weg = 2; dpCombo(false); } });
  dp.blasen = dp.blasen.filter((b) => !b.weg);
  // Roulette
  const RO = dp.roul;
  if (RO.dreht) { const a = Math.min(1, (performance.now() - RO.start) / 3200); RO.winkel = RO.von + (RO.bis - RO.von) * (1 - Math.pow(1 - a, 3)); if (a >= 1) dpRouletteFertig(); }
  // Raketen
  dp.raketen.forEach((r) => { if (r.verz > 0) { r.verz -= dt; return; } r.y += r.vy * dt * 60; dp.funken.push({ x: r.x, y: r.y, px: r.x, py: r.y + 4, vx: (Math.random() - 0.5) * 0.6, vy: 1, t: 0, leben: 0.35, h: 40, gr: 1.5 }); if (r.y <= r.zielY) { r.weg = 1; dpExplosion(r.x, r.y, 80, 1.5, r.h); dpTon(90, 0.25, 'sawtooth', 0.04); } });
  dp.raketen = dp.raketen.filter((r) => !r.weg);
  // Glücksrad
  if (dp.rad.dreht && performance.now() - dp.rad.start > 1500) dpRadFertig();
  dpParkourUpdate(dt);
  dp.texte.forEach((q) => { q.t += dt; }); dp.texte = dp.texte.filter((q) => q.t < 1.1);
  dp.funken.forEach((q) => { q.t += dt; q.px = q.x; q.py = q.y; q.x += q.vx; q.y += q.vy; q.vx *= 0.97; q.vy = q.vy * 0.97 + 0.09; }); dp.funken = dp.funken.filter((q) => q.t < q.leben);
  dp.schuettel = Math.max(0, dp.schuettel - dt * 1000); dp.blitz = Math.max(0, dp.blitz - dt * 1.4);
  $('dpPunkte').textContent = fmt(dp.punkte); $('dpMulti').textContent = '×' + dp.multi + (dp.combo >= 5 ? ' 🔥' + dp.combo : '');
  const brauch = (L) => 300 * L * (L + 1), von = dp.level > 1 ? brauch(dp.level - 1) : 0;
  $('dpLevelText').textContent = 'LEVEL ' + dp.level; $('dpLevelBalken').style.width = Math.round(((dp.punkte - von) / (brauch(dp.level) - von)) * 100) + '%';
  void F;
}
function dpZeichnen(t) {
  const cv = $('dpBild'); if (!cv) return;
  const x = cv.getContext('2d'), F = dpFelder(), W = dp.w, H = dp.h, hue = dp.ruhig ? 210 : (t / 30) % 360;
  x.save();
  if (dp.schuettel) x.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  x.fillStyle = '#05030a'; x.fillRect(-10, -10, W + 20, H + 20);
  // Parkour unten
  const P = F[3]; x.save(); x.beginPath(); x.rect(P.x, P.y, P.w, P.h); x.clip(); dpParkourZeichnen(x, P, t); x.restore();
  // drei Spiele
  F.slice(0, 3).forEach((f, i) => {
    x.save(); x.beginPath(); x.rect(f.x, f.y, f.w, f.h); x.clip();
    const g = x.createLinearGradient(f.x, f.y, f.x, f.y + f.h);
    g.addColorStop(0, 'hsl(' + ((hue + i * 120) % 360) + ' 70% ' + (dp.ruhig ? 14 : 18) + '%)'); g.addColorStop(1, '#07040f');
    x.fillStyle = g; x.fillRect(f.x, f.y, f.w, f.h);
    if (i === 0) dpBlasenZeichnen(x, f); else if (i === 1) dpRadZeichnen(x, f, t); else dpRouletteZeichnen(x, f, t);
    x.restore();
    x.strokeStyle = 'hsl(' + ((hue + i * 120) % 360) + ' 95% ' + (dp.ruhig ? 45 : 60) + '%)'; x.lineWidth = 3; x.strokeRect(f.x + 1.5, f.y + 1.5, f.w - 3, f.h - 3);
  });
  // Texte und Funken
  // Feuerwerk leuchtet (additiv): Spur + heller Kern
  x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
  dp.funken.forEach((q) => {
    const a = Math.max(0, 1 - q.t / q.leben), farbe = 'hsla(' + Math.round(q.h) + ',100%,' + (55 + 25 * a) + '%,' + a + ')';
    x.strokeStyle = farbe; x.lineWidth = q.gr; x.beginPath(); x.moveTo(q.px - q.vx * 2, q.py - q.vy * 2); x.lineTo(q.x, q.y); x.stroke();
    x.fillStyle = 'hsla(' + Math.round(q.h) + ',100%,85%,' + a + ')'; x.fillRect(q.x - q.gr / 2, q.y - q.gr / 2, q.gr, q.gr);
  });
  dp.raketen.forEach((r) => { if (r.verz <= 0) { x.fillStyle = '#fff7d6'; x.beginPath(); x.arc(r.x, r.y, 2.5, 0, 7); x.fill(); } });
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  dp.texte.forEach((q) => {
    const a = 1 - q.t / 1.1, s = q.gross ? 1 + Math.sin(Math.min(1, q.t * 4) * Math.PI) * 0.4 : 1;
    x.globalAlpha = a; x.font = '900 ' + Math.round((q.gross ? 20 : 15) * s) + 'px Outfit, system-ui, sans-serif'; x.textAlign = 'center';
    x.lineWidth = 4; x.strokeStyle = '#000'; x.strokeText(q.text, q.x, q.y - q.t * 40); x.fillStyle = q.farbe; x.fillText(q.text, q.x, q.y - q.t * 40);
  });
  x.globalAlpha = 1;
  if (dp.blitz > 0) { x.globalAlpha = dp.blitz; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
  x.restore();
}
function dpBlasenZeichnen(x, f) {
  dp.blasen.forEach((b) => {
    const k = Math.max(0.3, 1 - b.t / b.life * 0.6), px = f.x + b.x * f.w, py = f.y + b.y * f.h, r = b.r * k;
    const g = x.createRadialGradient(px - r * 0.3, py - r * 0.3, 1, px, py, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.3, b.gold ? '#fde047' : 'hsl(' + b.f + ' 90% 65%)'); g.addColorStop(1, b.gold ? '#b45309' : 'hsl(' + b.f + ' 80% 35%)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    if (b.t / b.life > 0.7) { x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.arc(px, py, r + 3, 0, 7 * (1 - (b.t / b.life - 0.7) / 0.3)); x.stroke(); }
  });
  x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '800 11px Outfit, system-ui'; x.textAlign = 'center'; x.fillText('🫧 BLASEN', f.x + f.w / 2, f.y + 16);
}
function dpRouletteZeichnen(x, f, t) {
  const R = dp.roul, cx = f.x + f.w / 2, cy = f.y + f.h * 0.42, r = Math.min(f.w * 0.44, f.h * 0.3), seg = (Math.PI * 2) / 37;
  x.save(); x.translate(cx, cy); x.rotate(R.winkel);
  DP_KESSEL.forEach((z, i) => {
    const a0 = -Math.PI / 2 + i * seg - seg / 2;
    x.fillStyle = z === 0 ? '#16a34a' : DP_ROT.has(z) ? '#dc2626' : '#111827';
    x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, r, a0, a0 + seg); x.closePath(); x.fill();
  });
  x.strokeStyle = '#facc15'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke();
  x.fillStyle = '#78350f'; x.beginPath(); x.arc(0, 0, r * 0.45, 0, 7); x.fill();
  x.strokeStyle = '#fde68a'; x.lineWidth = 2; for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 4); x.beginPath(); x.moveTo(-r * 0.4, 0); x.lineTo(r * 0.4, 0); x.stroke(); }
  x.restore();
  // Kugel: kreist gegenläufig, fällt am Ende in die Tasche oben unter den Zeiger
  const a = R.dreht ? Math.min(1, (performance.now() - R.start) / 3200) : 1, kugelW = R.dreht ? -Math.PI / 2 - (1 - Math.pow(1 - a, 2)) * Math.PI * 12 : -Math.PI / 2;
  const kr = r * (R.dreht && a < 0.8 ? 1.06 : 0.86);
  x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + Math.cos(kugelW) * kr, cy + Math.sin(kugelW) * kr, Math.max(3, r * 0.07), 0, 7); x.fill();
  x.fillStyle = '#fde047'; x.beginPath(); x.moveTo(cx - 6, cy - r - 12); x.lineTo(cx + 6, cy - r - 12); x.lineTo(cx, cy - r - 2); x.fill();
  // letzte Zahlen
  x.font = '800 10px Outfit, system-ui'; x.textAlign = 'center';
  R.letzte.forEach((z, i) => { const bx = cx + (i - (R.letzte.length - 1) / 2) * 18; x.fillStyle = z === 0 ? '#16a34a' : DP_ROT.has(z) ? '#dc2626' : '#111827'; x.beginPath(); x.arc(bx, cy + r + 16, 8, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillText(z, bx, cy + r + 19.5); });
  // Einsatzfelder
  const by = f.y + f.h * 0.8, bh = f.h * 0.16, bw = f.w / 2 - 6;
  [['rot', '#dc2626', 'ROT'], ['schwarz', '#111827', 'SCHWARZ']].forEach(([k, c, txt], i) => {
    const bx = f.x + 4 + i * (bw + 4);
    x.fillStyle = c; x.beginPath(); x.roundRect(bx, by, bw, bh, 8); x.fill();
    if (R.einsatz === k) { x.strokeStyle = '#fde047'; x.lineWidth = 3; x.stroke(); }
    x.fillStyle = '#fff'; x.font = '900 ' + Math.round(Math.min(12, bw / 6)) + 'px Outfit, system-ui'; x.fillText(txt, bx + bw / 2, by + bh / 2 + 4);
  });
  x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '800 11px Outfit, system-ui'; x.fillText('🎡 ROULETTE', cx, f.y + 16);
  void t;
}
function dpRadZeichnen(x, f, t) {
  const R = dp.rad, cx = f.x + f.w / 2, cy = f.y + f.h * 0.45, bw = Math.min(f.w * 0.28, 44);
  for (let i = 0; i < 3; i++) {
    const wx = cx + (i - 1) * (bw + 4) - bw / 2;
    x.fillStyle = '#fff7ed'; x.fillRect(wx, cy - bw * 0.7, bw, bw * 1.4);
    // beim Drehen laufen die Symbole durch; die Walzen stoppen nacheinander
    const lauf = R.dreht && performance.now() - R.start < 600 + i * 400;
    const sym = lauf ? DP_SYMBOLE[Math.floor(t / 60 + i * 2) % 6] : R.dreht ? R.ziel[i] : R.walzen[i];
    x.font = Math.round(bw * 0.7) + 'px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(sym, wx + bw / 2, cy + 2);
    x.textBaseline = 'alphabetic';
  }
  // Hebel-Hinweis
  x.fillStyle = R.dreht ? 'rgba(255,255,255,.4)' : 'hsl(' + ((t / 5) % 360) + ' 95% 60%)'; x.font = '900 12px Outfit, system-ui'; x.textAlign = 'center';
  x.fillText(R.dreht ? 'DREHT …' : 'TIPPEN = DREHEN!', cx, f.y + f.h * 0.8);
  x.fillStyle = 'rgba(255,255,255,.45)'; x.font = '700 9px Outfit, system-ui'; x.fillText('💎💎💎 = JACKPOT', cx, f.y + f.h * 0.88);
  x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '800 11px Outfit, system-ui'; x.fillText('🎰 SLOTS', cx, f.y + 16);
}
function dpParkourZeichnen(x, P, t) {
  const K = dp.park, z = Math.max(14, P.h / 9);   // Blockgröße
  const sky = x.createLinearGradient(0, P.y, 0, P.y + P.h); sky.addColorStop(0, '#60a5fa'); sky.addColorStop(1, '#bfdbfe');
  x.fillStyle = sky; x.fillRect(P.x, P.y, P.w, P.h);
  x.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 4; i++) { const cx = P.x + ((i * 170 - K.x * z * 0.3) % (P.w + 200) + P.w + 200) % (P.w + 200) - 100; x.fillRect(cx, P.y + 14 + i * 9, z * 3, z * 0.8); }
  const grund = P.y + P.h, start = Math.floor(K.x);
  for (let gx = start - 1; gx < start + P.w / z + 2; gx++) {
    const b = K.welt[((gx % K.welt.length) + K.welt.length) % K.welt.length], sx = P.x + (gx - K.x) * z;
    if (b.art === 'luecke') continue;
    for (let hy = 0; hy < (b.art === 'lava' ? 1 : b.h); hy++) {
      const sy = grund - (hy + 1) * z;
      if (b.art === 'lava') { x.fillStyle = 'hsl(' + (18 + Math.sin(t / 200 + gx) * 8) + ' 95% 52%)'; x.fillRect(sx, sy + z * 0.4, z, z * 0.6); continue; }
      const oben = hy === b.h - 1;
      x.fillStyle = oben ? '#4ade80' : (hy + gx) % 3 ? '#92400e' : '#78350f'; x.fillRect(sx, sy, z, z);
      if (oben) { x.fillStyle = '#15803d'; x.fillRect(sx, sy + z * 0.75, z, z * 0.25); x.fillStyle = '#86efac'; x.fillRect(sx + z * 0.2, sy, z * 0.2, z * 0.2); }
      x.strokeStyle = 'rgba(0,0,0,.15)'; x.strokeRect(sx + 0.5, sy + 0.5, z - 1, z - 1);
    }
  }
  // Spielfigur: ein Block-Fuchs
  const s = K.spieler;
  if (s.tot <= 0) {
    const px = P.x + 3 * z, py = grund - s.y * z - z * 1.6;
    x.fillStyle = '#f97316'; x.fillRect(px, py + z * 0.6, z * 0.9, z * 0.9);
    x.fillRect(px + z * 0.1, py, z * 0.8, z * 0.7); x.fillStyle = '#fff'; x.fillRect(px + z * 0.5, py + z * 0.35, z * 0.4, z * 0.3);
    x.fillStyle = '#111'; x.fillRect(px + z * 0.55, py + z * 0.18, z * 0.12, z * 0.12);
    x.fillStyle = '#f97316'; x.fillRect(px - z * 0.4, py + z * 0.8 + Math.sin(t / 80) * 2, z * 0.45, z * 0.2);
  } else { x.fillStyle = '#fff'; x.font = '900 ' + Math.round(z) + 'px Outfit, system-ui'; x.textAlign = 'center'; x.fillText('RESPAWN…', P.x + P.w / 2, P.y + P.h / 2); }
  x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(P.x + 6, P.y + 6, 96, 18); x.fillStyle = '#fff'; x.font = '800 10px Outfit, system-ui'; x.textAlign = 'left'; x.fillText('▶ BLOCK-PARKOUR', P.x + 12, P.y + 19);
}

// ---------- Auflösung: was die Maschine mit dir gemacht hat ----------
function dopaminEnde() {
  if (!dp) return;
  const sek = Math.max(1, Math.round((performance.now() - dp.start) / 1000)), S = dp.stat, min = sek / 60;
  const st = loadJson(DP_KEY); st.best = Math.max(st.best || 0, dp.punkte); st.runden = (st.runden || 0) + 1; st.sekunden = (st.sekunden || 0) + sek; saveJson(DP_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('dopamin', dp.punkte, null, Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0') + ' Min · Level ' + dp.level);
  const pro = (n) => fmt(Math.round(n / min * 10) / 10);
  const punkte = dp.punkte, level = dp.level;
  dpStopp();
  $('dpInhalt').innerHTML = '<div class="dp-aufloesung"><div class="dp-logo">🧠</div><h2 class="dp-titel">Was gerade passiert ist</h2>'
    + '<div class="dp-zahlen"><div><b>' + fmt(punkte) + '</b>Punkte<small>wert: 0 €</small></div><div><b>' + Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0') + '</b>Minuten</div><div><b>' + pro(S.belohnungen) + '</b>Belohnungen pro Minute</div></div>'
    + '<ul class="dp-tricks">'
    + '<li><b>🎰 Zufällige Belohnungen</b> – ' + S.zufall + '× gab es einen Gewinn, ohne dass du ihn vorhersehen konntest. Unregelmäßige Belohnungen halten am stärksten bei der Stange – derselbe Mechanismus wie bei Spielautomaten und beim Nachladen eines Feeds.</li>'
    + '<li><b>😫 Beinahe-Gewinne</b> – ' + S.knapp + '× hat die Slot-Maschine absichtlich „knapp daneben“ gezeigt. Das war kein Zufall, sondern eingebaut. Beinahe-Gewinne fühlen sich fast wie Gewinne an und machen Lust auf die nächste Runde.</li>'
    + '<li><b>🎡 Roulette ist ehrlich – und trotzdem verliert man</b> – ' + S.roulette + '× gedreht, ' + S.rouletteGewinne + '× gewonnen, ' + S.rouletteNull + '× die grüne 0. Bei Rot oder Schwarz gewinnt man in 18 von 37 Fällen, nicht in 18 von 36. Diese eine Null reicht der Bank: Auf Dauer bleiben ihr 2,7 % jedes Einsatzes.</li>'
    + '<li><b>🎆 Feuerwerk für Kleinigkeiten</b> – ' + S.feuerwerke + ' Explosionen. Jede geplatzte Blase wird gefeiert, als hättest du etwas Großes geschafft.</li>'
    + '<li><b>⭐ Fortschritt, der nie endet</b> – ' + S.levelups + ' Level-ups bis Level ' + level + '. Jedes Level braucht etwas mehr, also wirkt der Balken immer „fast voll“.</li>'
    + '<li><b>🔥 Combos, die man verlieren kann</b> – Verlustangst: Eine laufende Serie will man nicht aufgeben.</li>'
    + '<li><b>🔀 Drei Spiele plus Video</b> – ' + S.wechsel + '× ist deine Aufmerksamkeit zwischen den Spielen gesprungen (bei ' + S.taps + ' Tipps). Dazu lief unten ein Parkour-Video wie bei den „Split-Screen“-Clips. Es ist nie langweilig, aber du bist auch nirgends ganz.</li>'
    + '<li><b>🔊 Töne und Farben</b> – je höher die Combo, desto höher der Ton.</li></ul>'
    + '<p class="dp-fein">Das ist ein Experiment: Hier gibt es kein Geld, keine Werbung und keine Benachrichtigungen. Echte Apps kombinieren dieselben Tricks oft mit genau diesen Dingen.</p>'
    + '<div class="dp-knoepfe"><button type="button" class="dp-los" id="dpNochmal">Nochmal 🔥</button><button type="button" class="dp-ruhig" id="dpRaus">Genug für heute</button></div></div>';
  $('dpNochmal').addEventListener('click', dopaminIntro);
  $('dpRaus').addEventListener('click', () => zeigeHub());
}

window.addEventListener('resize', () => { if (dp && dp.groesse) dp.groesse(); });
$('dpZurueck').addEventListener('click', () => { if (dp) { dopaminEnde(); return; } dpStopp(); zeigeHub(); });
$('hubDopamin').addEventListener('click', () => { merkeZuletzt('dopamin'); zoomZu($('hubDopamin'), () => { show('dopamin', '🧠 Dopamin-Maschine'); dopaminIntro(); }); });
