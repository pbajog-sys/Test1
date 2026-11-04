// 🧠💥 Dopamin-Maschine: drei Minispiele gleichzeitig (Blasen, Stapeln, Glücksrad) über einem endlosen Block-Parkour-„Video“.
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
const dpArpeggio = (basis) => [0, 4, 7, 12, 16].forEach((h, i) => dpTon(basis * Math.pow(2, h / 12), 0.12, 'triangle', 0.06, i * 0.06));

// ---------- Start / Ende ----------
function dopaminIntro() {
  dpStopp();
  const st = loadJson(DP_KEY);
  $('dpInhalt').innerHTML = '<div class="dp-intro"><div class="dp-logo">🧠💥</div><h2 class="dp-titel">DOPAMIN-MASCHINE</h2>'
    + '<p class="dp-lead">Drei Spiele gleichzeitig. Darunter läuft Block-Parkour. Punkte, Combos, Jackpots, Level-ups – alles auf einmal.</p>'
    + '<ul class="dp-regeln"><li>🫧 <b>Blasen:</b> antippen, bevor sie platzen. Goldene bringen Bonus.</li><li>🧱 <b>Stapeln:</b> im richtigen Moment tippen – perfekt aufeinander gibt Extra.</li><li>🎰 <b>Glücksrad:</b> Punkte füllen die Energie, dann drehen.</li></ul>'
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
    stat: { belohnungen: 0, zufall: 0, knapp: 0, wechsel: 0, levelups: 0, taps: 0, jackpots: 0 }, letztesFeld: -1,
    blasen: [], blasenTakt: 0, stapel: { turm: [{ x: 0.2, w: 0.6 }], block: { x: 0, w: 0.6, v: 0.55 }, kamera: 0, fallend: [] },
    rad: { energie: 0, walzen: ['🍒', '⭐', '💎'], dreht: 0, stopp: [0, 0, 0], ergebnis: null }, park: { x: 0, spieler: { y: 0, vy: 0, tot: 0 }, welt: [] },
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
  dp.rad.energie = Math.min(1, dp.rad.energie + p / 400);
  dp.texte.push({ x, y, t: 0, text: text || '+' + p, farbe: farbe || '#fde047', gross });
  for (let i = 0; i < (gross ? 24 : 8); i++) dp.funken.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 6, t: 0, f: 'hsl(' + Math.round(Math.random() * 360) + ' 90% 60%)' });
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
    if (b) { b.weg = 1; dpCombo(true); dpGib(b.gold ? 100 : 10, x, y, b.gold ? 'GOLD +' + Math.round(100 * dp.multi) : null, b.gold ? '#fbbf24' : null, b.gold); dpTon(500 + dp.combo * 25, 0.07, 'square'); if (b.gold) { dp.stat.zufall++; dpArpeggio(660); } }
    else dpTon(140, 0.05, 'sawtooth', 0.03);
  } else if (i === 1) dpStapeln(f);
  else dpDrehen(f);
}
function dpStapeln(f) {
  const S = dp.stapel, oben = S.turm[S.turm.length - 1], b = S.block;
  const links = Math.max(b.x, oben.x), rechts = Math.min(b.x + b.w, oben.x + oben.w), ueber = rechts - links;
  if (ueber <= 0.02) {
    // daneben: Turm stürzt ein, alles von vorn
    S.fallend.push({ x: b.x, w: b.w, y: S.turm.length, vy: 0 });
    S.turm = [{ x: 0.2, w: 0.6 }]; S.block = { x: 0, w: 0.6, v: 0.55 }; S.kamera = 0;
    dpCombo(false); dpTon(90, 0.3, 'sawtooth', 0.05); dpBanner('EINGESTÜRZT 💥');
    return;
  }
  const perfekt = Math.abs(b.x - oben.x) < 0.025;
  const neu = perfekt ? { x: oben.x, w: Math.min(0.7, oben.w + 0.03) } : { x: links, w: ueber };
  if (!perfekt) S.fallend.push({ x: b.x < oben.x ? b.x : rechts, w: b.w - ueber, y: S.turm.length, vy: 0 });
  S.turm.push(neu);
  S.block = { x: Math.random() < 0.5 ? -neu.w : 1, w: neu.w, v: (0.5 + S.turm.length * 0.03) * (Math.random() < 0.5 ? 1 : -1) };
  if (S.block.v < 0) S.block.x = 1; else S.block.x = -neu.w;
  dpCombo(true);
  const hoehe = S.turm.length;
  dpGib(perfekt ? 50 : 15, f.x + f.w / 2, f.y + f.h * 0.4, perfekt ? 'PERFEKT! +' + Math.round(50 * dp.multi) : null, perfekt ? '#5eead4' : null, perfekt || hoehe % 10 === 0);
  dpTon(perfekt ? 880 : 300 + hoehe * 12, 0.09, perfekt ? 'triangle' : 'square');
}
// Glücksrad: Gewinne kommen zufällig (variable Belohnung); bei Verlusten zeigt es oft „knapp daneben“
const DP_SYMBOLE = ['🍒', '⭐', '💎', '🐉', '7️⃣', '🍀'];
function dpDrehen(f) {
  const R = dp.rad;
  if (R.dreht > 0) return;
  if (R.energie < 1) { dpBanner('ENERGIE ' + Math.round(R.energie * 100) + ' %'); dpTon(180, 0.06, 'square', 0.03); return; }
  R.energie = 0; R.dreht = 1; R.start = performance.now(); R.ergebnis = null;
  const z = Math.random();
  let w;
  if (z < 0.04) { const s = DP_SYMBOLE[Math.floor(Math.random() * 6)]; w = [s, s, s]; R.art = 'jackpot'; }
  else if (z < 0.3) { const s = DP_SYMBOLE[Math.floor(Math.random() * 6)]; w = [s, s, DP_SYMBOLE.find((q) => q !== s)]; w = Math.random() < 0.5 ? w : [w[0], w[2], w[1]]; R.art = 'zwei'; }
  else if (z < 0.65) { const s = DP_SYMBOLE[Math.floor(Math.random() * 6)]; w = [s, s, DP_SYMBOLE[(DP_SYMBOLE.indexOf(s) + 1) % 6]]; R.art = 'knapp'; }
  else { w = [0, 1, 2].map(() => DP_SYMBOLE[Math.floor(Math.random() * 6)]); if (w[0] === w[1] && w[1] === w[2]) w[2] = DP_SYMBOLE[(DP_SYMBOLE.indexOf(w[2]) + 2) % 6]; R.art = 'nix'; }
  R.ziel = w; R.feld = f;
}
function dpRadFertig() {
  const R = dp.rad, f = R.feld;
  R.walzen = R.ziel; R.dreht = 0;
  if (R.art === 'jackpot') { dp.stat.jackpots++; dp.stat.zufall++; dpGib(1000, f.x + f.w / 2, f.y + f.h * 0.45, 'JACKPOT!!! +' + Math.round(1000 * dp.multi), '#f472b6', true); dpBanner('💎 JACKPOT 💎'); dpArpeggio(523); setTimeout(() => dpArpeggio(784), 300); }
  else if (R.art === 'zwei') { dp.stat.zufall++; dpGib(120, f.x + f.w / 2, f.y + f.h * 0.45, 'GEWINN +' + Math.round(120 * dp.multi), '#fde047', true); dpArpeggio(440); }
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
  // Stapeln
  const S = dp.stapel;
  S.block.x += S.block.v * dt;
  if (S.block.x < -S.block.w * 0.5 || S.block.x > 1 - S.block.w * 0.5) S.block.v *= -1, S.block.x = Math.max(-S.block.w * 0.5, Math.min(1 - S.block.w * 0.5, S.block.x));
  S.kamera += (Math.max(0, S.turm.length - 8) - S.kamera) * Math.min(1, dt * 4);
  S.fallend.forEach((q) => { q.vy += 18 * dt; q.y -= q.vy * dt; });
  S.fallend = S.fallend.filter((q) => q.y > S.kamera - 20);
  // Glücksrad
  if (dp.rad.dreht && performance.now() - dp.rad.start > 1500) dpRadFertig();
  dpParkourUpdate(dt);
  dp.texte.forEach((q) => { q.t += dt; }); dp.texte = dp.texte.filter((q) => q.t < 1.1);
  dp.funken.forEach((q) => { q.t += dt; q.x += q.vx; q.y += q.vy; q.vy += 0.3; }); dp.funken = dp.funken.filter((q) => q.t < 0.8);
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
    if (i === 0) dpBlasenZeichnen(x, f); else if (i === 1) dpStapelZeichnen(x, f, t); else dpRadZeichnen(x, f, t);
    x.restore();
    x.strokeStyle = 'hsl(' + ((hue + i * 120) % 360) + ' 95% ' + (dp.ruhig ? 45 : 60) + '%)'; x.lineWidth = 3; x.strokeRect(f.x + 1.5, f.y + 1.5, f.w - 3, f.h - 3);
  });
  // Texte und Funken
  dp.funken.forEach((q) => { x.globalAlpha = 1 - q.t / 0.8; x.fillStyle = q.f; x.fillRect(q.x, q.y, 4, 4); });
  x.globalAlpha = 1;
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
function dpStapelZeichnen(x, f, t) {
  const S = dp.stapel, bh = Math.min(18, f.h / 14), boden = f.y + f.h - 8;
  const yVon = (n) => boden - (n - S.kamera) * bh;
  S.turm.forEach((s, n) => { x.fillStyle = 'hsl(' + ((n * 23) % 360) + ' 80% 58%)'; x.fillRect(f.x + s.x * f.w, yVon(n + 1), s.w * f.w, bh - 1); });
  const n = S.turm.length;
  x.fillStyle = 'hsl(' + ((n * 23) % 360) + ' 90% 66%)'; x.fillRect(f.x + S.block.x * f.w, yVon(n + 1), S.block.w * f.w, bh - 1);
  S.fallend.forEach((q) => { x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(f.x + q.x * f.w, yVon(q.y + 1), q.w * f.w, bh - 1); });
  x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '800 11px Outfit, system-ui'; x.textAlign = 'center'; x.fillText('🧱 STAPEL · ' + (n - 1), f.x + f.w / 2, f.y + 16);
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
  // Energie
  const ey = f.y + f.h * 0.78, ew = f.w * 0.8;
  x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(cx - ew / 2, ey, ew, 10);
  x.fillStyle = R.energie >= 1 ? 'hsl(' + ((t / 5) % 360) + ' 95% 60%)' : '#f472b6'; x.fillRect(cx - ew / 2, ey, ew * R.energie, 10);
  x.fillStyle = '#fff'; x.font = '800 11px Outfit, system-ui'; x.fillText(R.energie >= 1 ? 'TIPPEN = DREHEN!' : 'ENERGIE ' + Math.round(R.energie * 100) + ' %', cx, ey + 26);
  x.fillStyle = 'rgba(255,255,255,.6)'; x.fillText('🎰 GLÜCKSRAD', cx, f.y + 16);
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
    + '<li><b>😫 Beinahe-Gewinne</b> – ' + S.knapp + '× hat das Glücksrad absichtlich „knapp daneben“ gezeigt. Das war kein Zufall, sondern eingebaut. Beinahe-Gewinne fühlen sich fast wie Gewinne an und machen Lust auf die nächste Runde.</li>'
    + '<li><b>⭐ Fortschritt, der nie endet</b> – ' + S.levelups + ' Level-ups bis Level ' + level + '. Jedes Level braucht etwas mehr, also wirkt der Balken immer „fast voll“.</li>'
    + '<li><b>🔥 Combos, die man verlieren kann</b> – Verlustangst: Eine laufende Serie will man nicht aufgeben.</li>'
    + '<li><b>🔀 Drei Spiele plus Video</b> – ' + S.wechsel + '× ist deine Aufmerksamkeit zwischen den Spielen gesprungen (bei ' + S.taps + ' Tipps). Dazu lief unten ein Parkour-Video wie bei den „Split-Screen“-Clips. Es ist nie langweilig, aber du bist auch nirgends ganz.</li>'
    + '<li><b>🔊 Töne, Farben, Konfetti</b> – jede Kleinigkeit wird gefeiert. Je höher die Combo, desto höher der Ton.</li></ul>'
    + '<p class="dp-fein">Das ist ein Experiment: Hier gibt es kein Geld, keine Werbung und keine Benachrichtigungen. Echte Apps kombinieren dieselben Tricks oft mit genau diesen Dingen.</p>'
    + '<div class="dp-knoepfe"><button type="button" class="dp-los" id="dpNochmal">Nochmal 🔥</button><button type="button" class="dp-ruhig" id="dpRaus">Genug für heute</button></div></div>';
  $('dpNochmal').addEventListener('click', dopaminIntro);
  $('dpRaus').addEventListener('click', () => zeigeHub());
}

window.addEventListener('resize', () => { if (dp && dp.groesse) dp.groesse(); });
$('dpZurueck').addEventListener('click', () => { if (dp) { dopaminEnde(); return; } dpStopp(); zeigeHub(); });
$('hubDopamin').addEventListener('click', () => { merkeZuletzt('dopamin'); zoomZu($('hubDopamin'), () => { show('dopamin', '🧠 Dopamin-Maschine'); dopaminIntro(); }); });
