// ⏱️ Takt-Gefühl: Wie gut ist deine innere Uhr?
// Drei Spielarten mit je fünf Runden (bis 50 Punkte):
//   Zeitgefühl – eine Dauer merken und genauso lange gedrückt halten,
//   Tempo      – ein Metronom hören und im selben Tempo weitertippen,
//   Taktart    – einen Schlagzeug-Rhythmus hören und die Taktart erkennen (2/4, 3/4, 4/4, 6/8, 5/4, 7/8).
// Der Tages-Mix mischt alle drei und ist für alle gleich.
const TAKT_KEY = 'walquiz.takt.v1';
const TAKT_RUNDEN = 5;
const TAKT_TIPPS = 8;           // so oft tippt man im Tempo-Spiel
const TAKT_TON = 523.25;        // C5 – Ton beim Zeitgefühl
const TAKT_MODI = {
  dauer: { name: 'Zeitgefühl', emoji: '⏱️', lead: 'Ein Licht leuchtet eine Weile. Danach hältst du den Kreis genauso lange gedrückt – ohne Uhr, nur mit Gefühl.' },
  tempo: { name: 'Tempo', emoji: '🥁', lead: 'Ein Metronom tickt ein paar Schläge. Danach tippst du im selben Tempo weiter. Wie genau triffst du die BPM?' },
  takt: { name: 'Taktart', emoji: '🎼', lead: 'Ein Schlagzeug spielt einen Rhythmus. Zählst du mit? Erkenne die Taktart – gespielt von Schlagzeug, Klavier, Elektro, Percussion oder Klatschen.' },
};
const TAKT_STUFEN = {
  leicht: {
    name: 'Leicht', nochmal: 1,
    dauer: { min: 1000, max: 4000, zeige: 'ring', klein: '1–4 Sek. · mit Uhr' },
    tempo: { min: 70, max: 130, schlaege: 8, licht: true, klein: '8 Schläge · mit Licht' },
    takt: { arten: ['2/4', '3/4', '4/4'], glocke: true, licht: true, bpm: [88, 112], klein: '3 Taktarten · 3 Sounds · mit Licht', kits: ['schlagzeug', 'klavier', 'perkussion'] },
  },
  mittel: {
    name: 'Mittel', nochmal: 0,
    dauer: { min: 1500, max: 7000, zeige: 'licht', klein: '1,5–7 Sek. · nur Licht' },
    tempo: { min: 55, max: 160, schlaege: 6, licht: false, klein: '6 Schläge · nur Ton' },
    takt: { arten: ['2/4', '3/4', '4/4', '6/8'], glocke: true, licht: false, bpm: [80, 130], klein: '+ 6/8 · 5 Sounds · Synkopen', kits: 'alle', variation: true },
  },
  profi: {
    name: 'Profi', nochmal: 0,
    dauer: { min: 2000, max: 10000, zeige: 'ton', klein: '2–10 Sek. · nur Ton' },
    tempo: { min: 45, max: 190, schlaege: 4, licht: false, klein: '4 Schläge · nur Ton' },
    takt: { arten: ['2/4', '3/4', '4/4', '6/8', '5/4', '7/8'], glocke: false, licht: false, bpm: [70, 150], klein: '+ 5/4, 7/8 · Einsatz mittendrin', kits: 'alle', variation: true, mittendrin: true },
  },
};
// Taktarten im Achtel-Raster: Gruppen = betonte Zählzeiten, kick = Bassdrum-Schläge
const TAKTARTEN = {
  '2/4': { gruppen: [2, 2], kick: [0], name: 'Marsch', info: 'Zwei Viertel pro Takt: 1 & 2 & – wie ein Marsch: links, rechts.' },
  '3/4': { gruppen: [2, 2, 2], kick: [0], name: 'Walzer', info: 'Drei Viertel pro Takt: 1 & 2 & 3 & – der Walzer: Bum-tschak-tschak.' },
  '4/4': { gruppen: [2, 2, 2, 2], kick: [0, 4], name: 'Pop & Rock', info: 'Vier Viertel pro Takt: 1 & 2 & 3 & 4 & – fast jeder Popsong.' },
  '6/8': { gruppen: [3, 3], kick: [0], name: 'Wiegen', info: 'Sechs Achtel in zwei Dreiergruppen: 1 2 3 4 5 6 – schaukelt wie ein Wiegenlied.' },
  '5/4': { gruppen: [2, 2, 2, 2, 2], kick: [0, 6], name: 'Ungerade', info: 'Fünf Viertel: 1 & 2 & 3 & 4 & 5 & – meist als 3 + 2 gespielt, klingt wie ein Takt mit Stolperer.' },
  '7/8': { gruppen: [2, 2, 3], kick: [0], name: 'Balkan', info: 'Sieben Achtel als 2 + 2 + 3: 1 2 3 4 5 6 7 – typisch für Musik vom Balkan.' },
};
const TAKT_VERWANDT = ['2/4|4/4', '4/4|2/4', '3/4|6/8', '6/8|3/4'];

// ---------- Rechnen ----------
const runde1 = (x) => Math.round(x * 10) / 10;
const dauerPunkte = (ziel, ist) => runde1(10 * Math.max(0, 1 - Math.abs(ist - ziel) / ziel / 0.3));
const tempoPunkte = (ziel, bpm) => runde1(10 * Math.max(0, 1 - Math.abs(bpm - ziel) / ziel / 0.2));
const taktartPunkte = (ziel, wahl) => (ziel === wahl ? 10 : TAKT_VERWANDT.includes(ziel + '|' + wahl) ? 5 : 0);
const sekText = (ms) => fmt((Math.round(ms / 10) / 100).toFixed(2)) + ' s';
const prozentText = (x) => (x > 0 ? '+' : x < 0 ? '−' : '±') + fmt(Math.abs(Math.round(x * 1000) / 10)) + ' %';
const achtelVon = (sig) => TAKTARTEN[sig].gruppen.reduce((a, b) => a + b, 0);
function gruppenStarts(sig) {
  const s = [];
  TAKTARTEN[sig].gruppen.reduce((pos, g) => { s.push(pos); return pos + g; }, 0);
  return s;
}
// Zählweise unter dem Raster: Viertel-Takte mit „&“, Achtel-Takte durchgezählt
function zaehlweise(sig) {
  const n = achtelVon(sig);
  if (sig.endsWith('/8')) return Array.from({ length: n }, (_, i) => String(i + 1));
  return Array.from({ length: n }, (_, i) => (i % 2 ? '&' : String(i / 2 + 1)));
}

function taktRunden(seed, modus, stufe) {
  const r = zufallsGenerator(seed + '|' + modus + '|' + stufe);
  const S = TAKT_STUFEN[stufe];
  const arten = modus === 'mix' ? ['dauer', 'dauer', 'tempo', 'tempo', 'takt'] : Array(TAKT_RUNDEN).fill(modus);
  let vorrat = [];
  return arten.map((art) => {
    if (art === 'dauer') return { art, ms: Math.round((S.dauer.min + r() * (S.dauer.max - S.dauer.min)) / 10) * 10 };
    if (art === 'tempo') return { art, bpm: Math.round(S.tempo.min + r() * (S.tempo.max - S.tempo.min)) };
    // Taktarten gemischt ziehen, damit nicht fünfmal dieselbe kommt
    if (!vorrat.length) {
      vorrat = S.takt.arten.slice();
      for (let i = vorrat.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [vorrat[i], vorrat[j]] = [vorrat[j], vorrat[i]]; }
    }
    const kits = S.takt.kits === 'alle' ? Object.keys(TAKT_KITS) : S.takt.kits;
    return { art, sig: vorrat.pop(), bpm: Math.round(S.takt.bpm[0] + r() * (S.takt.bpm[1] - S.takt.bpm[0])), kit: kits[Math.floor(r() * kits.length)] };
  });
}

// ---------- Klang: Metronom und kleines Schlagzeug (alles mit Web Audio erzeugt) ----------
let taktBus = null, taktRauschen = null;
function taktBusNeu() {
  const c = audio();
  if (taktBus) { try { taktBus.disconnect(); } catch (e) { /* schon weg */ } }
  taktBus = c.createGain();
  taktBus.gain.value = 0.9;
  taktBus.connect(c.destination);
  return taktBus;
}
function rauschPuffer(c) {
  if (taktRauschen) return taktRauschen;
  const b = c.createBuffer(1, Math.floor(c.sampleRate * 0.3), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return (taktRauschen = b);
}
function schlag(art, t) {
  try {
    const c = audio(), bus = taktBus || taktBusNeu();
    const g = c.createGain();
    g.connect(bus);
    if (art === 'kick') {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.14);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g); o.start(t); o.stop(t + 0.24);
    } else if (art === 'snare' || art === 'hat') {
      const n = c.createBufferSource(), f = c.createBiquadFilter();
      n.buffer = rauschPuffer(c);
      f.type = art === 'snare' ? 'bandpass' : 'highpass';
      f.frequency.value = art === 'snare' ? 1800 : 7000;
      const len = art === 'snare' ? 0.14 : 0.05;
      g.gain.setValueAtTime(art === 'snare' ? 0.6 : 0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      n.connect(f).connect(g); n.start(t); n.stop(t + len + 0.01);
    } else {   // klick, akzent, glocke, tipp
      const o = c.createOscillator();
      o.type = art === 'glocke' ? 'sine' : 'triangle';
      o.frequency.value = { klick: 1000, akzent: 1500, glocke: 1760, tipp: 660 }[art];
      const len = art === 'glocke' ? 0.25 : 0.04;
      g.gain.setValueAtTime({ klick: 0.35, akzent: 0.45, glocke: 0.3, tipp: 0.3 }[art], t);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      o.connect(g); o.start(t); o.stop(t + len + 0.01);
    }
  } catch (e) { /* ohne Ton weiter */ }
}

// ---------- Klang-Sets für die Taktart ----------
// Jedes Set spielt drei Rollen: 'eins' (Taktanfang/Bass), 'betont' (Gruppenanfang) und 'leise' (Achtel dazwischen).
function oszi(t, f0, f1, dauer, vol, typ = 'sine') {
  try {
    const c = audio(), g = c.createGain(), o = c.createOscillator();
    o.type = typ;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dauer * 0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g).connect(taktBus || taktBusNeu());
    o.start(t); o.stop(t + dauer + 0.02);
  } catch (e) { /* ohne Ton weiter */ }
}
function rausch(t, filter, f, dauer, vol, q = 1) {
  try {
    const c = audio(), g = c.createGain(), n = c.createBufferSource(), fi = c.createBiquadFilter();
    n.buffer = rauschPuffer(c);
    fi.type = filter; fi.frequency.value = f; fi.Q.value = q;
    g.gain.setValueAtTime(Math.max(0.0002, vol), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    n.connect(fi).connect(g).connect(taktBus || taktBusNeu());
    n.start(t); n.stop(t + dauer + 0.01);
  } catch (e) { /* ohne Ton weiter */ }
}
const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const TAKT_AKKORDE = [[36, 60, 64, 67], [33, 60, 64, 69], [29, 60, 65, 69], [31, 59, 62, 67]];   // C – a – F – G, je Takt ein Akkord
const klatscher = (t, v) => [0, 0.011, 0.022].forEach((d, k) => rausch(t + d, 'bandpass', 1300, k === 2 ? 0.12 : 0.03, 0.5 * v, 1.4));
const TAKT_KITS = {
  schlagzeug: { name: 'Schlagzeug', emoji: '🥁', spiel(r, t, v) {
    if (r === 'eins') { oszi(t, 150, 45, 0.22, 0.9 * v); rausch(t, 'highpass', 7000, 0.05, 0.18 * v); }
    else if (r === 'betont') { rausch(t, 'bandpass', 1800, 0.14, 0.6 * v); oszi(t, 230, 180, 0.08, 0.2 * v, 'triangle'); }
    else rausch(t, 'highpass', 7000, 0.05, 0.22 * v);
  } },
  elektro: { name: 'Elektro', emoji: '🎛️', spiel(r, t, v) {
    if (r === 'eins') oszi(t, 120, 46, 0.55, 0.95 * v);
    else if (r === 'betont') klatscher(t, v);
    else rausch(t, 'highpass', 9000, 0.03, 0.2 * v);
  } },
  perkussion: { name: 'Percussion', emoji: '🪘', spiel(r, t, v) {
    if (r === 'eins') oszi(t, 190, 140, 0.32, 0.8 * v);
    else if (r === 'betont') oszi(t, 410, 340, 0.16, 0.6 * v);
    else rausch(t, 'bandpass', 5500, 0.07, 0.22 * v, 2);
  } },
  klavier: { name: 'Klavier', emoji: '🎹', spiel(r, t, v, takt) {
    const a = TAKT_AKKORDE[takt % 4];
    if (r === 'eins') { oszi(t, midiHz(a[0]), midiHz(a[0]), 0.7, 0.55 * v, 'triangle'); a.slice(1).forEach((m) => oszi(t, midiHz(m), midiHz(m), 0.35, 0.1 * v, 'triangle')); }
    else if (r === 'betont') a.slice(1).forEach((m) => oszi(t, midiHz(m), midiHz(m), 0.28, 0.14 * v, 'triangle'));
    else oszi(t, midiHz(a[3] + 12), midiHz(a[3] + 12), 0.12, 0.06 * v, 'triangle');
  } },
  klatschen: { name: 'Klatschen', emoji: '👏', spiel(r, t, v) {
    if (r === 'eins') { oszi(t, 110, 50, 0.2, 0.9 * v); rausch(t, 'lowpass', 500, 0.12, 0.35 * v); }
    else if (r === 'betont') klatscher(t, v);
    else { rausch(t, 'highpass', 3500, 0.03, 0.3 * v); oszi(t, 2100, 1900, 0.02, 0.08 * v); }
  } },
};

// ---------- Spielablauf ----------
let tk = null;                    // Zustand der laufenden Runde
let taktModus = 'dauer', taktStufe = 'leicht', taktGegner = null;
const taktStore = () => loadJson(TAKT_KEY);
const taktTeile = ['intro', 'spiel', 'aufloesung', 'ende'];
const zeigeTaktTeil = (t) => taktTeile.forEach((x) => { $('takt-' + x).hidden = x !== t; });
const taktMerk = (t) => { $('taktMerk').textContent = t; };
// Zeitgeber merken, damit „Zurück“ oder eine Antwort alles sauber anhält
function nachher(ms, fn) { const id = setTimeout(fn, Math.max(0, ms)); if (tk) tk.timer.push(id); return id; }
function taktStopp() {
  if (tk) { tk.timer.forEach(clearTimeout); tk.timer = []; }
  if (taktBus) { try { taktBus.disconnect(); } catch (e) { /* schon weg */ } taktBus = null; }
  liveStopp();
}
function pulsieren(el, stark) {
  if (!el || !el.animate) return;
  el.animate([{ transform: 'scale(1)', opacity: 0.55 }, { transform: 'scale(' + (stark ? 1.2 : 1.08) + ')', opacity: 1 }, { transform: 'scale(1)', opacity: 0.55 }],
    { duration: stark ? 260 : 180, easing: 'ease-out' });
}

function taktIntro() {
  taktStopp();
  const st = taktStore(), best = (st.best || {})[taktModus] || {};
  $('taktModi').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.modus === taktModus));
  $('taktLead').textContent = TAKT_MODI[taktModus].lead;
  $('taktStufen').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.stufe === taktStufe);
    b.querySelector('small').textContent = TAKT_STUFEN[b.dataset.stufe][taktModus].klein;
  });
  $('taktBest').textContent = 'Bestwerte ' + TAKT_MODI[taktModus].name + ': '
    + Object.entries(TAKT_STUFEN).map(([k, v]) => v.name + ' ' + (best[k] != null ? fmt(best[k]) : '–')).join(' · ');
  const t = st.tag && st.tag[heute()];
  $('taktTagBtn').textContent = t != null ? '📅 Tages-Mix – heute: ' + fmt(t) + ' / 50' : '📅 Tages-Mix: Zeit, Tempo & Taktart';
  $('taktRunde').textContent = '';
  zeigeTaktTeil('intro');
}

function taktStart(opts = {}) {
  taktStopp();
  const modus = opts.taeglich ? 'mix' : opts.modus || taktModus;
  const stufe = opts.taeglich ? 'mittel' : opts.stufe || taktStufe;
  const seed = opts.seed || (opts.taeglich ? 'takt-' + heute() : String(Math.random()).slice(2));
  tk = { modus, stufe, seed, taeglich: !!opts.taeglich, runden: taktRunden(seed, modus, stufe), i: 0, punkte: [], antworten: [], timer: [], gegner: opts.gegner || null };
  taktRunde();
}

function taktRunde() {
  taktStopp();
  const rd = tk.runden[tk.i];
  $('taktRunde').textContent = TAKT_MODI[rd.art].emoji + ' ' + TAKT_MODI[rd.art].name + ' · ' + (tk.i + 1) + ' / ' + TAKT_RUNDEN;
  tk.nochmal = TAKT_STUFEN[tk.stufe].nochmal;
  zeigeTaktTeil('spiel');
  if (rd.art === 'dauer') dauerZeigen();
  else if (rd.art === 'tempo') tempoZeigen();
  else taktartSpielen();
}

// ----- Zeitgefühl -----
const UHR_U = 2 * Math.PI * 88;
function dauerZeigen() {
  taktStopp();
  const rd = tk.runden[tk.i], S = TAKT_STUFEN[tk.stufe].dauer;
  $('taktBild').innerHTML = '<button class="tk-uhr" type="button" aria-label="Gedrückt halten"><svg viewBox="0 0 200 200"><circle class="tk-ring-bg" cx="100" cy="100" r="88"/>'
    + '<circle class="tk-ring" cx="100" cy="100" r="88"/></svg><span class="tk-kern"></span><span class="tk-uhr-text"></span></button>';
  $('taktAktion').innerHTML = '';
  const uhr = $('taktBild').querySelector('.tk-uhr'), ring = uhr.querySelector('.tk-ring');
  ring.style.strokeDasharray = UHR_U;
  ring.style.strokeDashoffset = UHR_U;
  uhr.disabled = true;
  uhr.classList.toggle('dunkel', S.zeige === 'ton');
  uhr.querySelector('.tk-uhr-text').textContent = S.zeige === 'ton' ? '🎧' : '';
  taktMerk('Gleich geht’s los …');
  nachher(1100, () => {
    taktMerk(S.zeige === 'ton' ? 'Hör genau hin – wie lange klingt der Ton?' : 'Merk dir, wie lange es leuchtet …');
    sinus(TAKT_TON, rd.ms / 1000);
    if (S.zeige !== 'ton') uhr.classList.add('an');
    if (S.zeige === 'ring' && ring.animate) ring.animate([{ strokeDashoffset: UHR_U }, { strokeDashoffset: 0 }], { duration: rd.ms, easing: 'linear', fill: 'forwards' });
    nachher(rd.ms, () => { uhr.classList.remove('an'); nachher(350, dauerEingabe); });
  });
}
function dauerEingabe() {
  const uhr = $('taktBild').querySelector('.tk-uhr'), ring = uhr.querySelector('.tk-ring');
  ring.getAnimations?.().forEach((a) => a.cancel());
  ring.style.strokeDashoffset = UHR_U;
  uhr.disabled = false;
  uhr.classList.add('tippbar');
  uhr.querySelector('.tk-uhr-text').textContent = 'Halten';
  taktMerk('Jetzt du: Halte den Kreis genauso lange gedrückt.');
  nochmalKnopf(dauerZeigen);
  let start = null;
  const an = () => {
    if (start != null) return;
    start = performance.now();
    uhr.classList.add('an');
    uhr.querySelector('.tk-uhr-text').textContent = '';
    liveStart(TAKT_TON);
  };
  const aus = () => {
    if (start == null) return;
    const ms = performance.now() - start;
    start = null;
    uhr.classList.remove('an');
    liveStopp();
    if (ms < 150) { uhr.querySelector('.tk-uhr-text').textContent = 'Halten'; taktMerk('Zu kurz – halte den Kreis gedrückt und lass dann los.'); return; }
    uhr.onpointerdown = uhr.onpointerup = uhr.onpointercancel = uhr.onkeydown = uhr.onkeyup = null;
    taktAuswerten(Math.round(ms));
  };
  uhr.onpointerdown = (e) => { e.preventDefault(); try { uhr.setPointerCapture(e.pointerId); } catch (x) { /* egal */ } an(); };
  uhr.onpointerup = aus;
  uhr.onpointercancel = aus;
  uhr.onkeydown = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); an(); } };
  uhr.onkeyup = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); aus(); } };
  uhr.oncontextmenu = (e) => e.preventDefault();
}
function nochmalKnopf(fn) {
  if (!(tk.nochmal > 0)) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn secondary';
  b.textContent = '🔁 Nochmal zeigen (' + tk.nochmal + '×)';
  b.onclick = () => { tk.nochmal--; fn(); };
  $('taktAktion').appendChild(b);
}

// ----- Tempo -----
function tempoMetronom(bpm, anzahl, licht, el) {
  taktBusNeu();
  const c = audio(), beat = 60 / bpm, t0 = c.currentTime + 0.5;
  for (let i = 0; i < anzahl; i++) {
    const t = t0 + i * beat;
    schlag(i === 0 ? 'akzent' : 'klick', t);
    if (licht) nachher((t - c.currentTime) * 1000, () => pulsieren(el, i === 0));
  }
  return (t0 + (anzahl - 1) * beat - c.currentTime) * 1000;   // ms bis zum letzten Schlag
}
function tempoZeigen() {
  taktStopp();
  const rd = tk.runden[tk.i], S = TAKT_STUFEN[tk.stufe].tempo;
  $('taktBild').innerHTML = '<button class="tk-pad" type="button" aria-label="Im Takt tippen" disabled><span class="tk-kern"></span><span class="tk-pad-text"></span></button>';
  $('taktAktion').innerHTML = '';
  const pad = $('taktBild').querySelector('.tk-pad');
  pad.querySelector('.tk-pad-text').textContent = S.licht ? '' : '🎧';
  taktMerk('Hör auf das Tempo …');
  const bis = tempoMetronom(rd.bpm, S.schlaege, S.licht, pad.querySelector('.tk-kern'));
  nachher(bis + 60000 / rd.bpm * 0.6, tempoEingabe);
}
function tempoEingabe() {
  const pad = $('taktBild').querySelector('.tk-pad'), kern = pad.querySelector('.tk-kern');
  pad.disabled = false;
  pad.classList.add('tippbar');
  pad.querySelector('.tk-pad-text').textContent = 'Tippen';
  taktMerk('Jetzt du: Tippe ' + TAKT_TIPPS + '× im gleichen Tempo.');
  $('taktAktion').innerHTML = '<div class="tk-zaehler">' + '<i></i>'.repeat(TAKT_TIPPS) + '</div>';
  nochmalKnopf(tempoZeigen);
  const punkte = $('taktAktion').querySelectorAll('.tk-zaehler i');
  const taps = [];
  const tipp = () => {
    taps.push(performance.now());
    schlag('tipp', audio().currentTime);
    pulsieren(kern, taps.length === 1);
    punkte[taps.length - 1].classList.add('an');
    pad.querySelector('.tk-pad-text').textContent = taps.length;
    if (taps.length < TAKT_TIPPS) return;
    pad.onpointerdown = pad.onkeydown = null;
    const abst = taps.slice(1).map((t, i) => t - taps[i]);
    const mittel = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
    const sd = Math.sqrt(abst.reduce((s, a) => s + (a - mittel) ** 2, 0) / abst.length);
    nachher(250, () => taktAuswerten({ bpm: 60000 / mittel, gleich: Math.round(Math.max(0, 1 - (sd / mittel) * 3) * 100), taps: taps.map((t) => t - taps[0]) }));
  };
  pad.onpointerdown = (e) => { e.preventDefault(); tipp(); };
  pad.onkeydown = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); tipp(); } };
  pad.oncontextmenu = (e) => e.preventDefault();
}

// ----- Taktart -----
// Spielt Takte ab tStart und gibt zurück, wann der nächste beginnt. onSchlag(i) für die Anzeige.
// o.kit = Klang-Set, o.variation = Synkopen in jedem zweiten Takt, o.ab = Einsatz erst ab diesem Achtel, o.takt0 = Taktzähler (Akkorde)
function takteSpielen(sig, bpm, glocke, tStart, takte, onSchlag, o = {}) {
  const c = audio(), achtel = 60 / bpm / 2, n = achtelVon(sig), starts = gruppenStarts(sig), A = TAKTARTEN[sig];
  const kit = TAKT_KITS[o.kit] || TAKT_KITS.schlagzeug;
  let t = tStart;
  for (let b = 0; b < takte; b++) {
    const takt = (o.takt0 || 0) + b;
    for (let i = b === 0 ? (o.ab || 0) : 0; i < n; i++) {
      let rolle = A.kick.includes(i) ? 'eins' : starts.includes(i) ? 'betont' : 'leise', v = 1;
      // Synkope: ein Zwischen-Achtel bekommt einen leisen Akzent – macht das Zählen schwerer, ändert aber nicht den Takt
      if (o.variation && takt % 2 === 1 && rolle === 'leise' && Math.random() < 0.3) { rolle = 'betont'; v = 0.4; }
      if (i === 0 && glocke) schlag('glocke', t);
      kit.spiel(rolle, t, v, takt);
      const tt = t;
      if (onSchlag) nachher((tt - c.currentTime) * 1000, () => onSchlag(i));
      t += achtel;
    }
  }
  return t;
}
function taktartSpielen() {
  taktStopp();
  const rd = tk.runden[tk.i], S = TAKT_STUFEN[tk.stufe].takt, starts = gruppenStarts(rd.sig), n = achtelVon(rd.sig);
  const kit = TAKT_KITS[rd.kit] || TAKT_KITS.schlagzeug;
  $('taktBild').innerHTML = '<div class="tk-pad tk-lautsprecher"><span class="tk-kern"></span><span class="tk-pad-text">' + kit.emoji + '</span></div><div class="tk-kit">' + kit.name + '</div>'
    + (S.licht ? '<div class="tk-schlaege">' + Array.from({ length: n }, (_, i) => '<i class="' + (i === 0 ? 'eins' : starts.includes(i) ? 'betont' : '') + '"></i>').join('') + '</div>' : '');
  taktMerk('Welche Taktart hörst du? Zähl mit!');
  const kern = $('taktBild').querySelector('.tk-kern'), schlaege = $('taktBild').querySelectorAll('.tk-schlaege i');
  const anzeige = (i) => {
    pulsieren(kern, S.licht && (i === 0 || starts.includes(i)));
    if (schlaege.length) { schlaege.forEach((s) => s.classList.remove('an')); schlaege[i].classList.add('an'); }
  };
  const box = document.createElement('div');
  box.className = 'tk-wahl' + (S.arten.length > 4 ? ' viele' : '');
  S.arten.forEach((sig) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = '<b></b>' + (tk.stufe === 'leicht' ? '<small></small>' : '');
    b.querySelector('b').textContent = sig;
    if (tk.stufe === 'leicht') b.querySelector('small').textContent = TAKTARTEN[sig].name;
    b.onclick = () => { taktStopp(); taktAuswerten(sig); };
    box.appendChild(b);
  });
  $('taktAktion').replaceChildren(box);
  // Endlosschleife: immer zwei Takte im Voraus planen, bis geantwortet wird
  taktBusNeu();
  let tNext = audio().currentTime + 0.4, takt0 = 0;
  // Profi: Der Rhythmus setzt irgendwo mitten im Takt ein – die „1“ muss man selbst finden
  let ab = S.mittendrin ? 1 + Math.floor(Math.random() * (n - 1)) : 0;
  const weiter = () => {
    tNext = takteSpielen(rd.sig, rd.bpm, S.glocke, tNext, 2, anzeige, { kit: rd.kit, variation: S.variation, ab, takt0 });
    ab = 0; takt0 += 2;
    nachher((tNext - audio().currentTime - 0.35) * 1000, weiter);
  };
  weiter();
}

// ----- Auswertung einer Runde -----
function taktKommentar(rd, p) {
  if (rd.art === 'takt') return p === 10 ? 'Richtig erkannt! 🎯' : p === 5 ? 'Fast – eine verwandte Taktart 🤏' : 'Leider nicht 🙈';
  if (p >= 9.5) return rd.art === 'dauer' ? 'Wie eine Stoppuhr! ⏱️' : 'Wie ein Metronom! 🎯';
  return p >= 8.5 ? 'Richtig nah dran 🔥' : p >= 7 ? 'Gutes Gefühl 👍' : p >= 5 ? 'Geht so 🤔' : 'Ganz woanders 🙈';
}
function taktAuswerten(wert) {
  taktStopp();
  const rd = tk.runden[tk.i];
  const p = rd.art === 'dauer' ? dauerPunkte(rd.ms, wert) : rd.art === 'tempo' ? tempoPunkte(rd.bpm, wert.bpm) : taktartPunkte(rd.sig, wert);
  tk.punkte.push(p);
  tk.antworten.push(wert);
  zeigeTaktTeil('aufloesung');
  hochzaehlen($('taktPunkte'), p, ' / 10');
  $('taktKommentar').textContent = taktKommentar(rd, p);
  const box = $('taktAnalyse');
  if (rd.art === 'dauer') {
    const max = Math.max(rd.ms, wert), d = (wert - rd.ms) / rd.ms;
    box.innerHTML = '<div class="tk-balken"><div><span>Original</span><i style="--w:' + (rd.ms / max * 100) + '%"></i><b>' + sekText(rd.ms) + '</b></div>'
      + '<div class="du"><span>Deine</span><i style="--w:' + (wert / max * 100) + '%"></i><b>' + sekText(wert) + '</b></div></div>'
      + '<div class="farb-tipp">' + (Math.abs(d) < 0.02 ? 'Auf die Hundertstel fast genau!' : 'Du warst ' + fmt(Math.round(Math.abs(d) * 100)) + ' % ' + (d > 0 ? 'zu lang' : 'zu kurz') + ' (' + sekText(Math.abs(wert - rd.ms)) + ').') + '</div>'
      + '<div class="farb-deltae">Tipp: Zähl leise „einundzwanzig, zweiundzwanzig …“ – jedes Wort dauert ungefähr eine Sekunde.</div>';
  } else if (rd.art === 'tempo') {
    const d = (wert.bpm - rd.bpm) / rd.bpm, ziel = 60000 / rd.bpm;
    const spanne = Math.max(ziel * (TAKT_TIPPS - 1), wert.taps[wert.taps.length - 1]) || 1;
    const reihe = (xs, cls) => '<div class="tk-strahl ' + cls + '">' + xs.map((x) => '<i style="left:' + (x / spanne * 100) + '%"></i>').join('') + '</div>';
    box.innerHTML = '<table class="farb-tabelle"><tr><th></th><th>Tempo</th></tr>'
      + '<tr><th>Original</th><td>' + rd.bpm + ' BPM</td></tr><tr><th>Deins</th><td>' + fmt(runde1(wert.bpm)) + ' BPM</td></tr>'
      + '<tr class="diff"><th>Differenz</th><td class="' + (Math.abs(d) <= 0.04 ? 'gut' : Math.abs(d) <= 0.1 ? 'mittel' : 'weit') + '">' + prozentText(d) + '</td></tr>'
      + '<tr><th>Gleichmäßig</th><td>' + wert.gleich + ' %</td></tr></table>'
      + '<div class="tk-strahlen">' + reihe(Array.from({ length: TAKT_TIPPS }, (_, i) => i * ziel), 'ziel') + reihe(wert.taps, 'du') + '</div>'
      + '<div class="ton-legende"><span>◆ Metronom</span><span>● Deine Tipper</span></div>'
      + '<div class="farb-tipp">' + (Math.abs(d) < 0.02 ? 'Tempo perfekt gehalten!' : 'Du warst ' + (d > 0 ? 'schneller' : 'langsamer') + ' als das Metronom.') + '</div>'
      + '<div class="ton-hoer zwei"><button type="button" id="taktHoerZiel">▶ Original-Tempo</button><button type="button" id="taktHoerDu">▶ Dein Tempo</button></div>';
    $('taktHoerZiel').onclick = () => { taktStopp(); tempoMetronom(rd.bpm, 8, false); };
    $('taktHoerDu').onclick = () => { taktStopp(); tempoMetronom(wert.bpm, 8, false); };
  } else {
    const starts = gruppenStarts(rd.sig), zaehl = zaehlweise(rd.sig);
    box.innerHTML = '<div class="tk-sig"><b>' + rd.sig + '</b>' + (wert !== rd.sig ? '<span>Du: ' + wert + '</span>' : '<span>✓</span>') + '</div>'
      + '<div class="tk-raster">' + zaehl.map((z, i) => '<span class="' + (i === 0 ? 'eins' : starts.includes(i) ? 'betont' : '') + '">' + z + '</span>').join('') + '</div>'
      + '<div class="farb-tipp">' + TAKTARTEN[rd.sig].info + '</div>'
      + (p === 5 ? '<div class="farb-deltae">' + (rd.sig.endsWith('/8') || wert.endsWith('/8')
        ? '3/4 und 6/8 haben beide sechs Achtel – 3/4 zählt in drei Paaren (1 & 2 & 3 &), 6/8 in zwei Dreiergruppen (1 2 3 4 5 6). Halbe Punkte!'
        : '2/4 und 4/4 klingen fast gleich – 4/4 ist einfach doppelt so lang. Halbe Punkte!') + '</div>' : '')
      + '<div class="ton-hoer zwei"><button type="button" id="taktHoerTakt">▶ Nochmal anhören</button>'
      + (wert !== rd.sig ? '<button type="button" id="taktHoerWahl">▶ So klingt ' + wert + '</button>' : '') + '</div>';
    const zellen = box.querySelectorAll('.tk-raster span');
    const vorspielen = (sig) => {
      taktStopp();
      tk.timer = [];
      taktBusNeu();
      takteSpielen(sig, rd.bpm, true, audio().currentTime + 0.25, 2, sig === rd.sig ? (i) => { zellen.forEach((z) => z.classList.remove('an')); zellen[i].classList.add('an'); } : null, { kit: rd.kit });
    };
    $('taktHoerTakt').onclick = () => vorspielen(rd.sig);
    if ($('taktHoerWahl')) $('taktHoerWahl').onclick = () => vorspielen(wert);
  }
  if (navigator.vibrate) navigator.vibrate(p >= 8.5 ? [30, 40, 30] : 20);
  if (p >= 9.5) konfetti(24, ['⏱️', '🥁', '✨', '🎯']);
  $('taktWeiter').textContent = tk.i === TAKT_RUNDEN - 1 ? 'Zum Ergebnis' : 'Nächste Runde';
}

function taktEnde() {
  taktStopp();
  const summe = runde1(tk.punkte.reduce((a, b) => a + b, 0));
  const st = taktStore();
  st.best = st.best || {}; st.tag = st.tag || {};
  let rekord = false;
  if (tk.taeglich) { if (st.tag[heute()] == null) st.tag[heute()] = summe; }
  else {
    const b = st.best[tk.modus] = st.best[tk.modus] || {};
    rekord = b[tk.stufe] == null || summe > b[tk.stufe];
    b[tk.stufe] = Math.max(b[tk.stufe] || 0, summe);
  }
  saveJson(TAKT_KEY, st);
  zeigeTaktTeil('ende');
  $('taktRunde').textContent = '';
  hochzaehlen($('taktSumme'), summe, ' / 50');
  $('taktRekord').textContent = rekord ? '🏆 Neuer Bestwert (' + TAKT_MODI[tk.modus].name + ', ' + TAKT_STUFEN[tk.stufe].name + ')!'
    : tk.taeglich ? '📅 Tages-Mix vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('taktVergleich').hidden = !tk.gegner;
  if (tk.gegner) {
    const g = tk.gegner;
    $('taktVergleich').textContent = summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + fmt(g.punkte) + ')!'
      : summe < g.punkte ? g.name + ' war besser (' + fmt(g.punkte) + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  const liste = $('taktListe');
  liste.innerHTML = '';
  tk.runden.forEach((rd, i) => {
    const w = tk.antworten[i];
    const li = document.createElement('li');
    li.innerHTML = '<span class="tl-n"></span><span class="tl-c"></span><b></b>';
    if (rd.art === 'dauer') {
      li.querySelector('.tl-n').textContent = '⏱️ ' + sekText(rd.ms) + ' → ' + sekText(w);
      li.querySelector('.tl-c').textContent = prozentText((w - rd.ms) / rd.ms);
    } else if (rd.art === 'tempo') {
      li.querySelector('.tl-n').textContent = '🥁 ' + rd.bpm + ' → ' + Math.round(w.bpm) + ' BPM';
      li.querySelector('.tl-c').textContent = prozentText((w.bpm - rd.bpm) / rd.bpm);
    } else {
      li.querySelector('.tl-n').textContent = (TAKT_KITS[rd.kit] || TAKT_KITS.schlagzeug).emoji + ' ' + rd.sig + (w === rd.sig ? '' : ' → ' + w);
      li.querySelector('.tl-c').textContent = w === rd.sig ? '✓' : '✗';
    }
    li.querySelector('b').textContent = fmt(tk.punkte[i]);
    liste.appendChild(li);
  });
  if (summe >= 40) setTimeout(() => konfetti(50, ['⏱️', '🥁', '🎼', '🏆']), 400);
}

async function taktTeilen() {
  const summe = runde1(tk.punkte.reduce((a, b) => a + b, 0));
  const name = loadJson(STORE_KEY).name || 'Jemand';
  const url = location.origin + location.pathname + '?takt=' + encodeURIComponent(tk.seed) + '&m=' + tk.modus + '&stufe=' + tk.stufe
    + '&n=' + encodeURIComponent(name) + '&p=' + summe;
  const k = (p) => (p >= 9 ? '🟩' : p >= 7 ? '🟨' : p >= 5 ? '🟧' : '🟥');
  const titel = tk.modus === 'mix' ? 'Tages-Mix ' + new Date().toLocaleDateString('de-DE') : TAKT_MODI[tk.modus].name + ' (' + TAKT_STUFEN[tk.stufe].name + ')';
  const text = '⏱️ Takt-Gefühl – ' + titel + '\n' + fmt(summe) + ' / 50 ' + tk.punkte.map(k).join('') + '\nWie gut ist deine innere Uhr? Gleiche Runden:';
  if (navigator.share) {
    try { await navigator.share({ title: 'Takt-Gefühl', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('taktTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('taktTeilenMsg').textContent = url; }
}

// ---------- Knöpfe ----------
$('taktModi').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { taktModus = b.dataset.modus; taktIntro(); }));
$('taktStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { taktStufe = b.dataset.stufe; taktIntro(); }));
$('taktLos').addEventListener('click', () => {
  audio();   // Ton direkt beim Tippen freischalten (iPhone)
  if (taktGegner) { const g = taktGegner; taktGegner = null; $('taktChallenge').hidden = true; taktStart({ modus: g.modus, stufe: g.stufe, seed: g.seed, gegner: g, taeglich: false }); }
  else taktStart();
});
$('taktTagBtn').addEventListener('click', () => { audio(); taktStart({ taeglich: true }); });
$('taktWeiter').addEventListener('click', () => { tk.i++; if (tk.i >= TAKT_RUNDEN) taktEnde(); else taktRunde(); });
$('taktNochmalSpiel').addEventListener('click', () => { audio(); taktStart({ modus: tk.modus === 'mix' ? taktModus : tk.modus, stufe: tk.stufe }); });
$('taktTeilen').addEventListener('click', taktTeilen);
$('taktZurueck').addEventListener('click', () => {
  if (tk && !$('takt-intro').hidden) { tk = null; zeigeHub(); return; }
  if (tk) { taktStopp(); tk = null; taktIntro(); return; }   // aus dem Spiel erst zurück zur Auswahl
  zeigeHub();
});
$('hubTakt').addEventListener('click', () => { merkeZuletzt('takt'); zoomZu($('hubTakt'), () => { show('takt', '⏱️ Takt-Gefühl'); taktIntro(); }); });

// Challenge-Link: ?takt=<seed>&m=…&stufe=…&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('takt')) return;
  const modus = (TAKT_MODI[q.get('m')] || q.get('m') === 'mix') ? q.get('m') : 'dauer';
  const stufe = TAKT_STUFEN[q.get('stufe')] ? q.get('stufe') : 'leicht';
  taktGegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('takt'), modus, stufe };
  history.replaceState(null, '', location.pathname);
  show('takt', '⏱️ Takt-Gefühl');
  if (modus !== 'mix') { taktModus = modus; taktStufe = stufe; }
  taktIntro();
  $('taktChallenge').hidden = false;
  $('taktChallenge').textContent = taktGegner.name + ' hat ' + fmt(taktGegner.punkte) + ' / 50 Punkte ('
    + (modus === 'mix' ? 'Tages-Mix' : TAKT_MODI[modus].name + ', ' + TAKT_STUFEN[stufe].name) + '). Gleiche Runden – schaffst du mehr?';
})();
