// 🎲 Riffbau: Würfeln & Bauen (Roll & Write). 6×6-Riff, 10 Runden. Ein Würfel zeigt die Form, einer die Korallenfarbe.
// Form drehen, ins Riff setzen (Felsen und belegte Felder sind tabu) – oder passen, wenn nichts passt.
// Punkte am Ende: jede zusammenhängende Farbfläche ab 3 Feldern = ihre Größe, jede volle Reihe/Spalte +4,
// jeder Fisch, dessen Feld mit seiner Lieblingsfarbe bedeckt ist, +4. Gleicher Seed = gleiche Würfe und gleiches Riff.
const RIFF_KEY = 'walquiz.riff.v1';
const RIFF_N = 6, RIFF_RUNDEN = 10;
const RIFF_FARBEN = [
  { id: 'rot', name: 'Rot', farbe: '#f43f5e' }, { id: 'gelb', name: 'Gelb', farbe: '#facc15' },
  { id: 'blau', name: 'Blau', farbe: '#38bdf8' }, { id: 'lila', name: 'Lila', farbe: '#a78bfa' }, { id: 'gruen', name: 'Grün', farbe: '#4ade80' },
];
// Formen als Felder [Zeile, Spalte]; Würfel 6 = Joker (ein Feld, Farbe frei)
const RIFF_FORMEN = [
  { name: 'Einzeln', felder: [[0, 0]] },
  { name: 'Zweier', felder: [[0, 0], [0, 1]] },
  { name: 'Dreier', felder: [[0, 0], [0, 1], [0, 2]] },
  { name: 'Ecke', felder: [[0, 0], [1, 0], [1, 1]] },
  { name: 'Block', felder: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { name: 'Joker', felder: [[0, 0]], joker: true },
];
const riffDrehen = (felder, mal) => {
  let f = felder;
  for (let i = 0; i < mal % 4; i++) f = f.map(([r, c]) => [c, -r]);
  const minR = Math.min(...f.map((x) => x[0])), minC = Math.min(...f.map((x) => x[1]));
  return f.map(([r, c]) => [r - minR, c - minC]);
};

function riffAufbau(seed) {
  const r = zufallsGenerator(seed + '|riff');
  const felder = [...Array(RIFF_N * RIFF_N).keys()];
  for (let i = felder.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [felder[i], felder[j]] = [felder[j], felder[i]]; }
  const felsen = felder.slice(0, 3), fische = felder.slice(3, 7).map((z) => ({ z, farbe: RIFF_FARBEN[Math.floor(r() * 5)].id }));
  const wuerfe = Array.from({ length: RIFF_RUNDEN }, () => ({ form: Math.floor(r() * 6), farbe: Math.floor(r() * 6) }));   // Farbe 5 = Joker
  return { felsen, fische, wuerfe };
}

// Punkte eines Riffs (brett: Array mit Farb-ID oder null)
function riffWertung(brett, aufbau) {
  const n = RIFF_N, gesehen = new Set(), gruppen = [];
  for (let z = 0; z < n * n; z++) {
    if (!brett[z] || gesehen.has(z)) continue;
    const f = brett[z], stapel = [z], g = [];
    gesehen.add(z);
    while (stapel.length) {
      const a = stapel.pop(); g.push(a);
      const r = Math.floor(a / n), c = a % n;
      [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
        const b = rr * n + cc;
        if (rr >= 0 && rr < n && cc >= 0 && cc < n && !gesehen.has(b) && brett[b] === f) { gesehen.add(b); stapel.push(b); }
      });
    }
    gruppen.push({ farbe: f, felder: g });
  }
  const flaechen = gruppen.filter((g) => g.felder.length >= 3).reduce((s, g) => s + g.felder.length, 0);
  const voll = (zs) => zs.every((z) => brett[z] || aufbau.felsen.includes(z));
  let linien = 0;
  for (let i = 0; i < n; i++) {
    if (voll([...Array(n).keys()].map((c) => i * n + c))) linien += 4;
    if (voll([...Array(n).keys()].map((r) => r * n + i))) linien += 4;
  }
  const fische = aufbau.fische.filter((f) => brett[f.z] === f.farbe).length * 4;
  return { flaechen, linien, fische, summe: flaechen + linien + fische, gruppen };
}

// ---------- Spielablauf ----------
let rf = null, riffGegner = null;
const riffStore = () => loadJson(RIFF_KEY);
const zeigeRiffTeil = (t) => ['intro', 'spiel', 'ende'].forEach((x) => { $('rf-' + x).hidden = x !== t; });

function riffIntro() {
  const st = riffStore();
  $('rfBest').textContent = 'Bestwert: ' + (st.best != null ? st.best + ' Punkte' : '–');
  const t = st.tag && st.tag[heute()];
  $('rfTagBtn').textContent = t != null ? '📅 Tagesriff – heute: ' + t + ' Punkte' : '📅 Tagesriff (heute für alle gleich)';
  zeigeRiffTeil('intro');
}

function riffStart(opts = {}) {
  const seed = opts.seed || (opts.taeglich ? 'rf-' + heute() : String(Math.random()).slice(2));
  const aufbau = riffAufbau(seed);
  rf = { seed, taeglich: !!opts.taeglich, aufbau, brett: Array(RIFF_N * RIFF_N).fill(null), runde: 0, drehung: 0, jokerFarbe: 0, vorschau: null, gegner: opts.gegner || null };
  zeigeRiffTeil('spiel');
  riffZeichnen();
}

const riffWurf = () => rf.aufbau.wuerfe[rf.runde];
function riffAktuelleFelder() {
  const w = riffWurf();
  return riffDrehen(RIFF_FORMEN[w.form].felder, rf.drehung);
}
function riffAktuelleFarbe() {
  const w = riffWurf();
  return w.farbe === 5 || RIFF_FORMEN[w.form].joker ? RIFF_FARBEN[rf.jokerFarbe].id : RIFF_FARBEN[w.farbe].id;
}
// Passt die Form mit linker oberer Ecke an (r, c)?
function riffPasst(r, c, felder) {
  return felder.every(([dr, dc]) => {
    const rr = r + dr, cc = c + dc, z = rr * RIFF_N + cc;
    return rr >= 0 && rr < RIFF_N && cc >= 0 && cc < RIFF_N && !rf.brett[z] && !rf.aufbau.felsen.includes(z);
  });
}
function riffIrgendwoPasst() {
  const basis = RIFF_FORMEN[riffWurf().form].felder;
  for (let d = 0; d < 4; d++) { const f = riffDrehen(basis, d); for (let r = 0; r < RIFF_N; r++) for (let c = 0; c < RIFF_N; c++) if (riffPasst(r, c, f)) return true; }
  return false;
}

function riffZeichnen() {
  const fertig = rf.runde >= RIFF_RUNDEN;
  $('rfRunde').textContent = fertig ? '' : '🎲 Runde ' + (rf.runde + 1) + ' / ' + RIFF_RUNDEN;
  const w = fertig ? null : riffWurf(), farbe = fertig ? null : riffAktuelleFarbe(), felder = fertig ? [] : riffAktuelleFelder();
  const vorschau = new Set(), ok = rf.vorschau && riffPasst(rf.vorschau[0], rf.vorschau[1], felder);
  if (rf.vorschau) felder.forEach(([dr, dc]) => vorschau.add((rf.vorschau[0] + dr) * RIFF_N + rf.vorschau[1] + dc));
  const box = $('rfBrett');
  box.innerHTML = '';
  for (let z = 0; z < RIFF_N * RIFF_N; z++) {
    const b = document.createElement('button');
    b.type = 'button';
    const fisch = rf.aufbau.fische.find((f) => f.z === z), fels = rf.aufbau.felsen.includes(z);
    b.className = 'rf-feld' + (fels ? ' fels' : '') + (rf.brett[z] ? ' belegt' : '') + (vorschau.has(z) ? (ok ? ' vorschau' : ' vorschau falsch') : '');
    if (rf.brett[z]) b.style.setProperty('--f', RIFF_FARBEN.find((x) => x.id === rf.brett[z]).farbe);
    else if (vorschau.has(z)) b.style.setProperty('--f', RIFF_FARBEN.find((x) => x.id === farbe).farbe);
    if (fels) b.textContent = '🪨';
    else if (fisch) { b.innerHTML = '<span class="rf-fisch">🐠</span>'; b.style.setProperty('--fisch', RIFF_FARBEN.find((x) => x.id === fisch.farbe).farbe); b.classList.add('mit-fisch'); if (rf.brett[z] === fisch.farbe) b.classList.add('satt'); }
    b.setAttribute('aria-label', 'Feld ' + (Math.floor(z / RIFF_N) + 1) + '-' + (z % RIFF_N + 1));
    if (!fertig) b.addEventListener('click', () => riffTippen(Math.floor(z / RIFF_N), z % RIFF_N));
    box.appendChild(b);
  }
  const wert = riffWertung(rf.brett, rf.aufbau);
  $('rfPunkte').textContent = wert.summe;
  $('rfAufteilung').textContent = 'Flächen ' + wert.flaechen + ' · Linien ' + wert.linien + ' · Fische ' + wert.fische;
  if (fertig) return;
  // Würfel
  const joker = w.farbe === 5 || RIFF_FORMEN[w.form].joker;
  $('rfWuerfelForm').innerHTML = riffFormSvg(felder, RIFF_FARBEN.find((x) => x.id === farbe).farbe);
  $('rfWuerfelFormName').textContent = RIFF_FORMEN[w.form].name;
  $('rfWuerfelFarbe').style.setProperty('--f', joker ? 'conic-gradient(#f43f5e, #facc15, #4ade80, #38bdf8, #a78bfa, #f43f5e)' : RIFF_FARBEN[w.farbe].farbe);
  $('rfWuerfelFarbeName').textContent = joker ? '⭐ Joker' : RIFF_FARBEN[w.farbe].name;
  $('rfJoker').hidden = !joker;
  $('rfJoker').querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === rf.jokerFarbe));
  const passt = riffIrgendwoPasst();
  $('rfSetzen').disabled = !ok;
  $('rfPassen').hidden = passt;
  $('rfHinweis').textContent = !passt ? 'Die Form passt nirgends mehr – du musst passen.' : rf.vorschau ? (ok ? 'Passt! „Setzen“ tippen oder ein anderes Feld wählen.' : 'Da passt es nicht – anderes Feld oder drehen.') : 'Tippe ein Feld: dort kommt die obere linke Ecke der Form hin.';
}
function riffFormSvg(felder, farbe) {
  const g = 22;
  return '<svg viewBox="0 0 ' + 3 * g + ' ' + 3 * g + '">' + felder.map(([r, c]) => '<rect x="' + (c * g + 1) + '" y="' + (r * g + 1) + '" width="' + (g - 2) + '" height="' + (g - 2) + '" rx="5" fill="' + farbe + '"/>').join('') + '</svg>';
}

function riffTippen(r, c) {
  // zweimal dasselbe Feld = setzen (schnell spielen)
  if (rf.vorschau && rf.vorschau[0] === r && rf.vorschau[1] === c && riffPasst(r, c, riffAktuelleFelder())) { riffSetzen(); return; }
  rf.vorschau = [r, c];
  riffZeichnen();
}
function riffSetzen() {
  if (!rf.vorschau) return;
  const felder = riffAktuelleFelder(), [r, c] = rf.vorschau;
  if (!riffPasst(r, c, felder)) return;
  const farbe = riffAktuelleFarbe();
  felder.forEach(([dr, dc]) => { rf.brett[(r + dr) * RIFF_N + c + dc] = farbe; });
  if (navigator.vibrate) navigator.vibrate(12);
  riffNaechste();
}
function riffNaechste() {
  rf.runde++; rf.drehung = 0; rf.vorschau = null;
  if (rf.runde >= RIFF_RUNDEN) { riffZeichnen(); setTimeout(riffEnde, 500); } else riffZeichnen();
}

function riffEnde() {
  const w = riffWertung(rf.brett, rf.aufbau);
  const st = riffStore();
  st.tag = st.tag || {};
  let rekord = false;
  if (rf.taeglich) { if (st.tag[heute()] == null) st.tag[heute()] = w.summe; }
  else { rekord = st.best == null || w.summe > st.best; st.best = Math.max(st.best || 0, w.summe); }
  saveJson(RIFF_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('riff', w.summe, null, rf.taeglich ? 'Tagesriff' : 'Freies Spiel');
  zeigeRiffTeil('ende');
  hochzaehlen($('rfSumme'), w.summe, ' Punkte');
  $('rfRekord').textContent = rekord ? '🏆 Neuer Bestwert!' : rf.taeglich ? '📅 Tagesriff vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('rfVergleich').hidden = !rf.gegner;
  if (rf.gegner) {
    const g = rf.gegner;
    $('rfVergleich').textContent = w.summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + g.punkte + ')!' : w.summe < g.punkte ? g.name + ' war besser (' + g.punkte + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  $('rfEndBrett').innerHTML = $('rfBrett').innerHTML;
  $('rfEndWertung').innerHTML = '<li><span>🪸 Farbflächen ab 3 Feldern</span><b>' + w.flaechen + '</b></li><li><span>➖ Volle Reihen und Spalten</span><b>' + w.linien + '</b></li><li><span>🐠 Satte Fische</span><b>' + w.fische + '</b></li>';
  if (w.summe >= 40) setTimeout(() => konfetti(40, ['🪸', '🐠', '🎲', '🏆']), 400);
}

async function riffTeilen() {
  const w = riffWertung(rf.brett, rf.aufbau);
  const name = loadJson(STORE_KEY).name || 'Jemand';
  const url = location.origin + location.pathname + '?riff=' + encodeURIComponent(rf.seed) + '&n=' + encodeURIComponent(name) + '&p=' + w.summe;
  const zeilen = [...Array(RIFF_N).keys()].map((r) => [...Array(RIFF_N).keys()].map((c) => {
    const z = r * RIFF_N + c, f = rf.brett[z];
    return rf.aufbau.felsen.includes(z) ? '⬛' : { rot: '🟥', gelb: '🟨', blau: '🟦', lila: '🟪', gruen: '🟩' }[f] || '⬜';
  }).join('')).join('\n');
  const text = '🎲 Riffbau – ' + (rf.taeglich ? 'Tagesriff ' + new Date().toLocaleDateString('de-DE') : 'freies Spiel') + ': ' + w.summe + ' Punkte\n' + zeilen + '\nBaust du ein besseres Riff? Gleiche Würfe:';
  if (navigator.share) {
    try { await navigator.share({ title: 'Riffbau', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('rfTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('rfTeilenMsg').textContent = url; }
}

// ---------- Knöpfe ----------
$('rfLos').addEventListener('click', () => {
  if (riffGegner) { const g = riffGegner; riffGegner = null; $('rfChallenge').hidden = true; riffStart({ seed: g.seed, gegner: g }); }
  else riffStart();
});
$('rfTagBtn').addEventListener('click', () => riffStart({ taeglich: true }));
$('rfDrehen').addEventListener('click', () => { rf.drehung = (rf.drehung + 1) % 4; riffZeichnen(); });
$('rfSetzen').addEventListener('click', riffSetzen);
$('rfPassen').addEventListener('click', riffNaechste);
$('rfJoker').querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { rf.jokerFarbe = i; riffZeichnen(); }));
$('rfNochmal').addEventListener('click', () => riffStart());
$('rfTeilen').addEventListener('click', riffTeilen);
$('rfZurueck').addEventListener('click', () => {
  if (rf && $('rf-intro').hidden) { rf = null; riffIntro(); return; }
  rf = null; zeigeHub();
});
$('hubRiff').addEventListener('click', () => { merkeZuletzt('riff'); zoomZu($('hubRiff'), () => { show('riff', '🎲 Riffbau'); riffIntro(); }); });

// Challenge-Link: ?riff=<seed>&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('riff')) return;
  riffGegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('riff') };
  history.replaceState(null, '', location.pathname);
  show('riff', '🎲 Riffbau');
  riffIntro();
  $('rfChallenge').hidden = false;
  $('rfChallenge').textContent = riffGegner.name + ' hat ' + riffGegner.punkte + ' Punkte gebaut. Gleiche Würfe, gleiches Riff – schaffst du mehr?';
})();
