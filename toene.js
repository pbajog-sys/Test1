// 🎧 Ton-Gedächtnis: Ein Ton erklingt kurz, danach sucht man ihn mit einem Frequenz-Schieber.
// Punkte (0–10 pro Ton) nach dem musikalischen Abstand in Cent (100 Cent = ein Halbton), nicht in Hz –
// so zählt ein Fehler bei tiefen und hohen Tönen gleich.
const TON_RUNDEN = 5;
const TON_STUFEN = {
  leicht: { name: 'Leicht', sek: 3, nochmal: 1 },
  mittel: { name: 'Mittel', sek: 2, nochmal: 0 },
  profi:  { name: 'Profi', sek: 1, nochmal: 0 },
};
const TON_KEY = 'walquiz.toene.v1';
const F_MIN = 100, F_MAX = 2000;                     // Schieber-Bereich (logarithmisch)
const TON_NAMEN = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'];

// ---------- Rechnen ----------
const centZwischen = (fZiel, f) => 1200 * Math.log2(f / fZiel);
const tonPunkte = (fZiel, f) => Math.max(0, Math.round((10 - Math.abs(centZwischen(fZiel, f)) / 50) * 10) / 10);
// Schieber 0…1000 ↔ Frequenz (logarithmisch, wie das Gehör)
const sliderZuF = (x) => F_MIN * Math.pow(F_MAX / F_MIN, x / 1000);
const fZuSlider = (f) => (1000 * Math.log(f / F_MIN)) / Math.log(F_MAX / F_MIN);
function notenName(f) {
  const midi = 69 + 12 * Math.log2(f / 440);
  const n = Math.round(midi);
  const rest = Math.round((midi - n) * 100);
  return { name: TON_NAMEN[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1), cent: rest };
}
const hzText = (f) => (f >= 1000 ? fmt(Math.round(f)) : fmt(Math.round(f * 10) / 10)) + ' Hz';
function toeneAus(seed) {
  const r = zufallsGenerator(seed);   // aus farben.js – gleiche Töne für gleiche Seeds
  return Array.from({ length: TON_RUNDEN }, () => Math.round(150 * Math.pow(1500 / 150, r()) * 10) / 10);
}

// ---------- Klang: weicher Sinuston ----------
let tonCtx = null;
const audio = () => {
  tonCtx = tonCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (tonCtx.state === 'suspended') tonCtx.resume();
  return tonCtx;
};
function sinus(f, dauer) {
  try {
    const c = audio(), t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.04);
    g.gain.setValueAtTime(0.3, t + dauer - 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dauer + 0.02);
  } catch (e) { /* ohne Ton weiter */ }
}
// Live-Ton, solange man den Schieber festhält
let live = null;
function liveStart(f) {
  try {
    if (live) return;
    const c = audio();
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.28, c.currentTime + 0.04);
    o.connect(g).connect(c.destination);
    o.start();
    live = { o, g };
  } catch (e) { live = null; }
}
function liveFrequenz(f) { if (live) live.o.frequency.setTargetAtTime(f, tonCtx.currentTime, 0.015); }
function liveStopp() {
  if (!live) return;
  const { o, g } = live, t = tonCtx.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(g.gain.value, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.stop(t + 0.08);
  live = null;
}

// ---------- Schwingung als Animation ----------
let welleAnim = null;
function zeigeWelle(el, f, aktiv) {
  cancelAnimationFrame(welleAnim);
  const W = 320, H = 120;
  // sichtbare Wellenzahl wächst mit der Tonhöhe (logarithmisch, damit es lesbar bleibt)
  const perioden = 1.5 + 9 * (Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN));
  const pfad = (phase, amp) => {
    let d = '';
    for (let x = 0; x <= W; x += 4) {
      const y = H / 2 + amp * Math.sin((x / W) * perioden * 2 * Math.PI + phase) * Math.sin((x / W) * Math.PI);
      d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
    }
    return d;
  };
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="welle-svg"><path class="w2" d=""/><path class="w1" d=""/></svg>`;
  const p1 = el.querySelector('.w1'), p2 = el.querySelector('.w2');
  const start = performance.now();
  const schritt = (t) => {
    const ph = (t - start) / 1000 * 6;
    const amp = aktiv() ? 42 : 4;
    p1.setAttribute('d', pfad(-ph, amp));
    p2.setAttribute('d', pfad(-ph * 0.8 + 1, amp * 0.6));
    welleAnim = requestAnimationFrame(schritt);
  };
  welleAnim = requestAnimationFrame(schritt);
}

// ---------- Spielablauf ----------
let ts = null;   // Ton-Spiel-Zustand
const tonStore = () => loadJson(TON_KEY);
const tonTeile = ['intro', 'hoeren', 'treffen', 'aufloesung', 'ende'];
const zeigeTonTeil = (t) => tonTeile.forEach((x) => { $('ton-' + x).hidden = x !== t; });

function toeneIntro() {
  liveStopp(); cancelAnimationFrame(welleAnim);
  const st = tonStore(), best = st.best || {};
  $('tonStufen').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.stufe === (ts?.stufe || 'leicht')));
  $('tonBest').textContent = 'Bestwerte: ' + Object.entries(TON_STUFEN).map(([k, v]) => v.name + ' ' + (best[k] != null ? fmt(best[k]) : '–')).join(' · ');
  const t = st.tag && st.tag[heute()];
  $('tonTagBtn').textContent = t != null ? '📅 Tagestöne – heute: ' + fmt(t) + ' / 50' : '📅 Tagestöne (heute für alle gleich)';
  zeigeTonTeil('intro');
}

function toeneStart(opts = {}) {
  const stufe = opts.stufe || ts?.stufe || 'leicht';
  const seed = opts.seed || (opts.taeglich ? 'ton-' + heute() : String(Math.random()).slice(2));
  ts = { stufe, seed, taeglich: !!opts.taeglich, toene: toeneAus(seed + '|' + stufe), runde: 0, punkte: [], mixe: [], gegner: opts.gegner || null };
  tonPhase('hoeren');
}

let tonTimer = null;
function tonPhase(phase) {
  clearInterval(tonTimer); liveStopp();
  const ziel = ts.toene[ts.runde];
  $('tonRunde').textContent = 'Ton ' + (ts.runde + 1) + ' / ' + TON_RUNDEN;
  if (phase === 'hoeren') {
    zeigeTonTeil('hoeren');
    ts.nochmal = TON_STUFEN[ts.stufe].nochmal;
    const S = TON_STUFEN[ts.stufe];
    const abspielen = () => {
      sinus(ziel, S.sek);
      let ende = performance.now() + S.sek * 1000;
      zeigeWelle($('tonWelle'), ziel, () => performance.now() < ende);
      $('tonNochmal').hidden = true;
      clearInterval(tonTimer);
      tonTimer = setInterval(() => {
        const rest = Math.max(0, ende - performance.now()) / 1000;
        $('tonCountdown').textContent = rest > 0 ? fmt(Math.ceil(rest * 10) / 10) + ' s' : '';
        if (!rest) {
          clearInterval(tonTimer);
          if (ts.nochmal > 0) { $('tonNochmal').hidden = false; $('tonWeiterHoeren').hidden = false; }
          else setTimeout(() => ts && tonPhase('treffen'), 500);
        }
      }, 50);
    };
    $('tonNochmal').onclick = () => { ts.nochmal--; abspielen(); };
    $('tonWeiterHoeren').hidden = true;
    abspielen();
  } else if (phase === 'treffen') {
    zeigeTonTeil('treffen');
    // Startwert zufällig, aber mindestens eine Quinte vom Ziel entfernt
    let f;
    do { f = sliderZuF(Math.random() * 1000); } while (Math.abs(centZwischen(ziel, f)) < 700);
    ts.mix = f;
    $('tonRegler').value = fZuSlider(f);
    tonMixAnzeigen();
    zeigeWelle($('tonWelleMix'), f, () => !!live);
  } else if (phase === 'aufloesung') {
    const p = tonPunkte(ziel, ts.mix);
    ts.punkte.push(p); ts.mixe.push(ts.mix);
    zeigeTonTeil('aufloesung');
    cancelAnimationFrame(welleAnim);
    zeigeTonAuswertung(ziel, ts.mix, p);
    if (navigator.vibrate) navigator.vibrate(p >= 8.5 ? [30, 40, 30] : 20);
    if (p >= 9.5) konfetti(24, ['🎧', '🎵', '✨', '🎯']);
    $('tonWeiter').textContent = ts.runde === TON_RUNDEN - 1 ? 'Zum Ergebnis' : 'Nächster Ton';
  }
}

function tonMixAnzeigen() {
  $('tonMixHz').textContent = hzText(ts.mix);
  liveFrequenz(ts.mix);
  const x = $('tonRegler').value / 10;
  $('tonRegler').style.setProperty('--pos', x + '%');
}

function zeigeTonAuswertung(ziel, mix, p) {
  const cent = centZwischen(ziel, mix);
  const nz = notenName(ziel), nm = notenName(mix);
  hochzaehlen($('tonPunkte'), p, ' / 10');
  $('tonKommentar').textContent = p >= 9.5 ? 'Perfektes Gehör! 🎯' : p >= 8.5 ? 'Richtig nah dran 🔥' : p >= 7 ? 'Gut gehört 👍' : p >= 5 ? 'Na ja … 🤔' : 'Ganz woanders 🙉';
  const ht = Math.abs(cent) / 100;
  $('tonTipp').textContent = Math.abs(cent) < 15 ? 'Kaum zu unterscheiden – super getroffen!'
    : 'Dein Ton war ' + (ht < 1 ? fmt(Math.round(Math.abs(cent))) + ' Cent' : fmt(Math.round(ht * 10) / 10) + ' Halbtöne') + (cent > 0 ? ' zu hoch.' : ' zu tief.')
      + (Math.abs(cent) >= 1100 && Math.abs(cent) <= 1300 ? ' Fast genau eine Oktave daneben – die Tonhöhe „klang“ richtig!' : '');
  const tab = $('tonTabelle');
  tab.innerHTML = '<tr><th></th><th>Frequenz</th><th>Note</th></tr>';
  const zeile = (name, a, b, klasse = '') => {
    const tr = document.createElement('tr');
    tr.className = klasse;
    tr.innerHTML = '<th></th><td></td><td></td>';
    tr.querySelector('th').textContent = name;
    tr.querySelectorAll('td')[0].textContent = a;
    tr.querySelectorAll('td')[1].textContent = b;
    tab.appendChild(tr);
  };
  const ctxt = (c) => (c ? ' ' + (c > 0 ? '+' : '−') + Math.abs(c) + ' ct' : '');
  zeile('Original', hzText(ziel), nz.name + ctxt(nz.cent));
  zeile('Deiner', hzText(mix), nm.name + ctxt(nm.cent));
  const dHz = mix - ziel;
  zeile('Differenz', (dHz > 0 ? '+' : '−') + hzText(Math.abs(dHz)), (cent > 0 ? '+' : '−') + Math.round(Math.abs(cent)) + ' Cent', 'diff ' + (Math.abs(cent) <= 25 ? 'gut' : Math.abs(cent) <= 100 ? 'mittel' : 'weit'));
  // Skala: wo lagen beide Töne?
  $('tonSkalaZiel').style.left = fZuSlider(ziel) / 10 + '%';
  $('tonSkalaMix').style.left = fZuSlider(mix) / 10 + '%';
  $('tonHoerZiel').onclick = () => sinus(ziel, 1);
  $('tonHoerMix').onclick = () => sinus(mix, 1);
  $('tonHoerBeide').onclick = () => { sinus(ziel, 0.9); setTimeout(() => sinus(mix, 0.9), 1000); };
}

function toeneEnde() {
  const summe = Math.round(ts.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const st = tonStore();
  st.best = st.best || {}; st.tag = st.tag || {};
  const rekord = !ts.taeglich && (st.best[ts.stufe] == null || summe > st.best[ts.stufe]);
  if (!ts.taeglich) st.best[ts.stufe] = Math.max(st.best[ts.stufe] || 0, summe);
  if (ts.taeglich && st.tag[heute()] == null) st.tag[heute()] = summe;
  saveJson(TON_KEY, st);
  zeigeTonTeil('ende');
  if (typeof merkeVerlauf === 'function') merkeVerlauf('toene', summe, 50, TON_STUFEN[ts.stufe].name + (ts.taeglich ? ' · Tagestöne' : ''));
  hochzaehlen($('tonSumme'), summe, ' / 50');
  $('tonRekord').textContent = rekord ? '🏆 Neuer Bestwert (' + TON_STUFEN[ts.stufe].name + ')!' : ts.taeglich ? '📅 Tagestöne vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('tonVergleich').hidden = !ts.gegner;
  if (ts.gegner) {
    const g = ts.gegner;
    $('tonVergleich').textContent = summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + fmt(g.punkte) + ')!'
      : summe < g.punkte ? g.name + ' war besser (' + fmt(g.punkte) + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  const liste = $('tonListe');
  liste.innerHTML = '';
  ts.toene.forEach((z, i) => {
    const c = centZwischen(z, ts.mixe[i]);
    const li = document.createElement('li');
    li.innerHTML = '<span class="tl-n"></span><span class="tl-c"></span><b></b>';
    li.querySelector('.tl-n').textContent = notenName(z).name + ' → ' + notenName(ts.mixe[i]).name;
    li.querySelector('.tl-c').textContent = (c > 0 ? '+' : '−') + Math.round(Math.abs(c)) + ' Cent';
    li.querySelector('b').textContent = fmt(ts.punkte[i]);
    li.addEventListener('click', () => { sinus(z, 0.8); setTimeout(() => sinus(ts.mixe[i], 0.8), 900); });
    liste.appendChild(li);
  });
  if (summe >= 40) setTimeout(() => konfetti(50, ['🎧', '🎵', '🎶', '🏆']), 400);
}

async function toeneTeilen() {
  const summe = Math.round(ts.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const name = loadJson(STORE_KEY).name || 'Jemand';
  const url = location.origin + location.pathname + '?toene=' + encodeURIComponent(ts.seed) + '&stufe=' + ts.stufe
    + '&n=' + encodeURIComponent(name) + '&p=' + summe;
  const k = (p) => (p >= 9 ? '🟩' : p >= 7 ? '🟨' : p >= 5 ? '🟧' : '🟥');
  const text = '🎧 Ton-Gedächtnis' + (ts.taeglich ? ' – Tagestöne ' + new Date().toLocaleDateString('de-DE') : ' (' + TON_STUFEN[ts.stufe].name + ')')
    + '\n' + fmt(summe) + ' / 50 ' + ts.punkte.map(k).join('') + '\nHörst du es besser? Gleiche Töne:';
  if (navigator.share) {
    try { await navigator.share({ title: 'Ton-Gedächtnis', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('tonTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('tonTeilenMsg').textContent = url; }
}

// ---------- Knöpfe ----------
let tonGegner = null;
$('tonStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { ts = { ...(ts || {}), stufe: b.dataset.stufe }; toeneIntro(); }));
$('tonLos').addEventListener('click', () => {
  audio();   // Audio direkt beim Tippen freischalten (iPhone)
  if (tonGegner) { const g = tonGegner; tonGegner = null; $('tonChallenge').hidden = true; toeneStart({ stufe: g.stufe, seed: g.seed, gegner: g }); }
  else toeneStart({ stufe: ts?.stufe || 'leicht' });
});
$('tonTagBtn').addEventListener('click', () => { audio(); toeneStart({ stufe: 'mittel', taeglich: true }); });
$('tonWeiterHoeren').addEventListener('click', () => tonPhase('treffen'));
const regler = $('tonRegler');
regler.addEventListener('input', () => { ts.mix = sliderZuF(Number(regler.value)); tonMixAnzeigen(); });
regler.addEventListener('pointerdown', () => liveStart(ts.mix));
['pointerup', 'pointercancel', 'blur'].forEach((ev) => regler.addEventListener(ev, liveStopp));
$('tonProbe').addEventListener('click', () => sinus(ts.mix, 0.8));
$('tonFertig').addEventListener('click', () => tonPhase('aufloesung'));
$('tonWeiter').addEventListener('click', () => { ts.runde++; if (ts.runde >= TON_RUNDEN) toeneEnde(); else tonPhase('hoeren'); });
$('tonNochmalSpiel').addEventListener('click', () => toeneStart({ stufe: ts.stufe }));
$('tonTeilen').addEventListener('click', toeneTeilen);
$('tonZurueck').addEventListener('click', () => { clearInterval(tonTimer); liveStopp(); cancelAnimationFrame(welleAnim); ts = null; zeigeHub(); });
$('hubToene').addEventListener('click', () => { merkeZuletzt('toene'); zoomZu($('hubToene'), () => { show('toene', '🎧 Ton-Gedächtnis'); toeneIntro(); }); });

// Challenge-Link: ?toene=<seed>&stufe=…&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('toene')) return;
  const stufe = TON_STUFEN[q.get('stufe')] ? q.get('stufe') : 'leicht';
  tonGegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('toene'), stufe };
  history.replaceState(null, '', location.pathname);
  show('toene', '🎧 Ton-Gedächtnis');
  ts = { stufe };
  toeneIntro();
  $('tonChallenge').hidden = false;
  $('tonChallenge').textContent = tonGegner.name + ' hat ' + fmt(tonGegner.punkte) + ' / 50 Punkte (' + TON_STUFEN[stufe].name + '). Gleiche Töne – hörst du es besser?';
})();
