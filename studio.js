// 🎛️ Beat-Studio – eigene Beats bauen: Step-Sequencer (Rhythmus), Piano-Roll (Melodie), Song-Anordnung, Mixer, Pads,
// Binär-Generator (aus dem Binär-Beat der Wundermuster), Vorlagen, mehrere Projekte, WAV-Export – alles offline.
// Klang: Bausteine aus falten.js (ftAudio, ftKick, ftRauschen, ftSaw, ftHz). Speicher: walquiz.studio.v1
//   = { version: 1, aktiv: id, projekte: { id: { id, name, bpm, swing, tonart, skala, muster: [4 × { kanal: [16] }], song: [Musternummern], kanaele: { kanal: { laut, stumm, solo, klang, laenge } }, geaendert } } }
const ST_KEY = 'walquiz.studio.v1';
const ST_KANAELE = [
  { id: 'kick', name: 'Kick', f: '#e2e8f0', art: 'drum' },
  { id: 'snare', name: 'Snare', f: '#a3e635', art: 'drum' },
  { id: 'clap', name: 'Clap', f: '#facc15', art: 'drum' },
  { id: 'hat', name: 'Hi-Hat', f: '#38bdf8', art: 'drum' },
  { id: 'openhat', name: 'Open Hat', f: '#7dd3fc', art: 'drum' },
  { id: 'perc', name: 'Perc', f: '#2dd4bf', art: 'drum' },
  { id: 'shaker', name: 'Shaker', f: '#67e8f9', art: 'drum' },
  { id: 'sub', name: 'Bass', f: '#818cf8', art: 'melodie', oktave: 2, klaenge: ['Sub', 'Reese', '808'] },
  { id: 'wobble', name: 'Wobble', f: '#c084fc', art: 'melodie', oktave: 2, klaenge: ['Langsam', 'Schnell', 'Triolen'] },
  { id: 'lead', name: 'Lead', f: '#fb923c', art: 'melodie', oktave: 5, klaenge: ['Säge', 'Rechteck', 'Pluck'] },
  { id: 'chords', name: 'Akkorde', f: '#fbbf24', art: 'akkord', oktave: 4, klaenge: ['Stab', 'Pad', 'Piano'] },
];
const ST_SKALEN = { moll: { name: 'Moll', st: [0, 2, 3, 5, 7, 8, 10] }, dur: { name: 'Dur', st: [0, 2, 4, 5, 7, 9, 11] }, dorisch: { name: 'Dorisch', st: [0, 2, 3, 5, 7, 9, 10] } };
const ST_NOTEN = ['C', 'Des', 'D', 'Es', 'E', 'F', 'Ges', 'G', 'As', 'A', 'B', 'H'];
const ST_STUFEN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const ST_ZEILEN = 15;   // Piano-Roll: zwei Oktaven + Grundton
let st = null, stTimer = null, stRaf = 0;

// ---------- Speicher ----------
const stLeer16 = (w) => Array.from({ length: 16 }, () => w);
function stLeeresMuster() { const m = {}; ST_KANAELE.forEach((k) => { m[k.id] = stLeer16(k.art === 'drum' ? 0 : null); }); return m; }
function stNeuesProjekt(name) {
  const kan = {}; ST_KANAELE.forEach((k) => { kan[k.id] = { laut: k.art === 'drum' ? 0.8 : 0.7, stumm: false, solo: false, klang: 0, laenge: k.id === 'chords' ? 2 : 1 }; });
  return { id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), name: name || 'Mein Beat', bpm: 128, swing: 0, tonart: 9, skala: 'moll', muster: [0, 1, 2, 3].map(stLeeresMuster), song: [0], kanaele: kan, geaendert: Date.now() };
}
// Fehlende Felder ergänzen – auch wenn später neue Kanäle dazukommen, bleiben alte Projekte ladbar
function stReparieren(p) {
  const neu = stNeuesProjekt(p.name);
  for (const k of ['bpm', 'swing', 'tonart', 'skala', 'song', 'name', 'id', 'geaendert']) if (p[k] == null) p[k] = neu[k];
  if (!ST_SKALEN[p.skala]) p.skala = 'moll';
  p.muster = Array.isArray(p.muster) ? p.muster : neu.muster;
  while (p.muster.length < 4) p.muster.push(stLeeresMuster());
  p.muster.forEach((m) => ST_KANAELE.forEach((k) => { if (!Array.isArray(m[k.id]) || m[k.id].length !== 16) m[k.id] = stLeer16(k.art === 'drum' ? 0 : null); }));
  p.kanaele = p.kanaele || {};
  ST_KANAELE.forEach((k) => { p.kanaele[k.id] = Object.assign({}, neu.kanaele[k.id], p.kanaele[k.id] || {}); });
  if (!Array.isArray(p.song) || !p.song.length) p.song = [0];
  return p;
}
function stLaden() {
  const s = loadJson(ST_KEY);
  s.version = 1; s.projekte = s.projekte || {};
  Object.values(s.projekte).forEach(stReparieren);
  if (!s.aktiv || !s.projekte[s.aktiv]) {
    const p = stVorlage('binaer'); s.projekte[p.id] = p; s.aktiv = p.id;
    saveJson(ST_KEY, s);
  }
  return s;
}
function stSpeichern() { if (!st) return; st.p.geaendert = Date.now(); st.daten.projekte[st.p.id] = st.p; st.daten.aktiv = st.p.id; saveJson(ST_KEY, st.daten); }

// ---------- Tonhöhen ----------
function stMidi(p, kanal, stufe) {
  const k = ST_KANAELE.find((x) => x.id === kanal), sk = ST_SKALEN[p.skala].st;
  return 12 * (k.oktave + 1) + p.tonart + 12 * Math.floor(stufe / 7) + sk[((stufe % 7) + 7) % 7];
}
function stAkkord(p, stufe) { return [0, 2, 4].map((d) => stMidi(p, 'chords', stufe + d)); }
// Akkordname: Grundton + m (Moll) / ° (vermindert) / nichts (Dur)
function stAkkordName(p, stufe) { const [a, b, c] = stAkkord(p, stufe), t = b - a, q = c - a; return ST_NOTEN[((a % 12) + 12) % 12] + (t === 3 && q === 6 ? '°' : t === 3 ? 'm' : t === 4 && q === 8 ? '+' : ''); }
const stNotenName = (m) => ST_NOTEN[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

// ---------- Klänge ----------
function stOsz(A, t, typ, f1, f2, dauer, laut, attack = 0.004) {
  const c = A.c, o = c.createOscillator(), g = c.createGain();
  o.type = typ; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dauer);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut, t + attack); g.gain.exponentialRampToValueAtTime(0.0008, t + dauer);
  o.connect(g).connect(A.master); o.start(t); o.stop(t + dauer + 0.03);
}
function stInstrument(A, kanal, t, p, wert, dur) {
  const kl = p.kanaele[kanal].klang || 0, lang = dur * (p.kanaele[kanal].laenge || 1);
  switch (kanal) {
    case 'kick': ftKick(A, t, 1); break;
    case 'snare': ftRauschen(A, t, 0.2, 1400, 0.35); stOsz(A, t, 'triangle', 200, 140, 0.09, 0.25); break;
    case 'clap': [0, 0.011, 0.023].forEach((d, i) => ftRauschen(A, t + d, i === 2 ? 0.22 : 0.03, 1100, 0.32)); break;
    case 'hat': ftRauschen(A, t, 0.05, 8000, 0.15); break;
    case 'openhat': ftRauschen(A, t, 0.32, 6500, 0.12); break;
    case 'perc': stOsz(A, t, 'sine', 330, 150, 0.14, 0.4); break;
    case 'shaker': ftRauschen(A, t, 0.035, 9500, 0.1); break;
    case 'sub': {
      const f = ftHz(stMidi(p, 'sub', wert));
      if (kl === 0) stOsz(A, t, 'sine', f, 0, Math.max(0.12, lang * 0.95), 0.5, 0.008);
      else if (kl === 2) stOsz(A, t, 'sine', f * 2.2, f, Math.max(0.4, lang * 1.5), 0.6, 0.004);
      else { const c = A.c, fi = c.createBiquadFilter(), g = c.createGain(); fi.type = 'lowpass'; fi.frequency.value = 600; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01); g.gain.setValueAtTime(0.18, t + lang * 0.85); g.gain.exponentialRampToValueAtTime(0.001, t + lang); fi.connect(g).connect(A.master); [-14, 14].forEach((ct) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = ct; o.connect(fi); o.start(t); o.stop(t + lang + 0.03); }); }
      break;
    }
    case 'wobble': {
      const c = A.c, o = c.createOscillator(), fi = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = ftHz(stMidi(p, 'wobble', wert)); fi.type = 'lowpass'; fi.Q.value = 9; fi.frequency.value = 520;
      lfo.frequency.value = (60 / (dur * 4 * 60)) * [2, 4, 6][kl]; lg.gain.value = 460; lfo.connect(lg).connect(fi.frequency);
      const d = Math.max(dur, lang);
      g.gain.setValueAtTime(0.32, t); g.gain.setValueAtTime(0.32, t + d * 0.9); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(fi).connect(g).connect(A.master); o.start(t); lfo.start(t); o.stop(t + d + 0.02); lfo.stop(t + d + 0.02);
      break;
    }
    case 'lead': {
      const m = stMidi(p, 'lead', wert);
      if (kl === 0) ftSaw(A, t, [m], Math.max(0.12, lang * 0.95), 0.08, 4800);
      else if (kl === 1) { stOsz(A, t, 'square', ftHz(m), 0, Math.max(0.1, lang * 0.9), 0.06); }
      else { stOsz(A, t, 'triangle', ftHz(m), 0, 0.35, 0.22, 0.002); stOsz(A, t, 'sawtooth', ftHz(m), 0, 0.08, 0.04, 0.002); }
      break;
    }
    case 'chords': {
      const ak = stAkkord(p, wert);
      if (kl === 0) ftSaw(A, t, ak, Math.max(0.1, lang * 0.7), 0.035, 2600);
      else if (kl === 1) ak.forEach((m) => stOsz(A, t, 'triangle', ftHz(m), 0, Math.max(0.3, lang * 1.05), 0.08, Math.min(0.25, lang * 0.4)));
      else ak.forEach((m) => { stOsz(A, t, 'triangle', ftHz(m), 0, 0.9, 0.09, 0.003); stOsz(A, t, 'sine', ftHz(m + 12), 0, 0.4, 0.03, 0.003); });
      break;
    }
  }
}
// Kanal-Lautstärken: je Kanal ein Gain, damit der Mixer auch während des Spielens wirkt
function stKanalAusgaenge(c, ziel, p) {
  const aus = {};
  ST_KANAELE.forEach((k) => { const g = c.createGain(); g.gain.value = stKanalLaut(p, k.id); g.connect(ziel); aus[k.id] = { c, master: g }; });
  return aus;
}
function stKanalLaut(p, id) {
  const solo = ST_KANAELE.some((k) => p.kanaele[k.id].solo), kk = p.kanaele[id];
  return kk.stumm || (solo && !kk.solo) ? 0 : kk.laut;
}
function stMixerAnwenden() { if (st && st.aus) ST_KANAELE.forEach((k) => { st.aus[k.id].master.gain.value = stKanalLaut(st.p, k.id); }); }
// Ein Schritt eines Musters
function stSchrittSpielen(aus, p, mi, s, t, dur) {
  const m = p.muster[mi];
  ST_KANAELE.forEach((k) => {
    const w = m[k.id][s];
    if (k.art === 'drum' ? w : w != null) stInstrument(aus[k.id], k.id, t, p, w, dur);
  });
}
const stDauer = (p) => 60 / p.bpm / 4;
const stSwing = (p, g, dur) => (g % 2 ? p.swing * dur * 0.5 : 0);

// ---------- Vorlagen ----------
function stVorlage(art) {
  const p = stNeuesProjekt();
  const setze = (mi, kanal, schritte, w = 1) => schritte.forEach((s) => { p.muster[mi][kanal][s] = w; });
  const alle = (f) => [0, 1, 2, 3].forEach(f);
  if (art === 'binaer') { stBinaerFuellen(p, 0); p.name = 'Binär-Dubstep'; return p; }
  if (art === 'hardcore') {
    Object.assign(p, { name: 'Happy Hardcore', bpm: 175, tonart: 0, skala: 'dur', song: [0, 1, 0, 2] });
    alle((mi) => { setze(mi, 'kick', [0, 4, 8, 12]); setze(mi, 'hat', [2, 6, 10, 14]); setze(mi, 'clap', [4, 12]); [2, 6, 10, 14].forEach((s) => { p.muster[mi].sub[s] = [0, 4, 5, 3][mi]; }); [0, 3, 6, 10].forEach((s) => { p.muster[mi].chords[s] = [0, 4, 5, 3][mi]; }); });
    [[7, null, 8, 9, null, 11, 9, null, 8, null, 6, 8, null, 11, 8, null], [7, null, 9, 12, null, 11, 9, null, 10, null, 9, 8, null, 7, 8, null], [11, null, 11, 12, 11, 9, 7, null, 8, null, 8, 9, 8, 6, 4, null]].forEach((mel, i) => { p.muster[i].lead = mel.slice(); });
    p.kanaele.chords.laenge = 1;
  } else if (art === 'house') {
    Object.assign(p, { name: 'House-Groove', bpm: 124, tonart: 2, skala: 'moll', song: [0, 0, 1, 1] });
    alle((mi) => { setze(mi, 'kick', [0, 4, 8, 12]); setze(mi, 'openhat', [2, 6, 10, 14]); setze(mi, 'clap', [4, 12]); setze(mi, 'shaker', [1, 3, 5, 7, 9, 11, 13, 15]); [0, 6, 11].forEach((s) => { p.muster[mi].sub[s] = [0, 5, 2, 6][mi]; }); [2, 7, 10].forEach((s) => { p.muster[mi].chords[s] = [0, 5, 2, 6][mi]; }); });
    p.muster[1].lead = [7, null, null, 9, null, null, 8, null, 7, null, 6, null, 4, null, null, null];
    p.kanaele.chords.klang = 2; p.kanaele.sub.klang = 0;
  } else if (art === 'trap') {
    Object.assign(p, { name: 'Trap', bpm: 140, tonart: 4, skala: 'moll', song: [0, 1] });
    alle((mi) => { setze(mi, 'kick', [0, 7, 10]); setze(mi, 'snare', [8]); setze(mi, 'hat', [0, 2, 4, 6, 8, 10, 12, 13, 14, 15]); p.muster[mi].sub[0] = 0; p.muster[mi].sub[7] = 0; p.muster[mi].sub[10] = mi % 2 ? 3 : 5; });
    p.muster[1].lead = [11, null, 9, null, 7, null, null, 6, 7, null, null, null, 4, null, 2, null];
    p.kanaele.sub.klang = 2; p.kanaele.sub.laenge = 4; p.kanaele.lead.klang = 2;
  } else p.name = 'Leeres Projekt';
  return p;
}
// Binär-Generator: zählt ab `start` 64 Schritte weiter, jedes Bit ist ein Instrument (wie im Binär-Beat der Wundermuster)
function stBinaerFuellen(p, start) {
  Object.assign(p, { bpm: 140, tonart: 5, skala: 'moll', song: [0, 1, 2, 3] });
  const akkStufe = [0, 5, 2, 6], leadTon = [0, 2, 1, 2, 0, 2, 1, 0];
  for (let mi = 0; mi < 4; mi++) {
    const m = stLeeresMuster();
    for (let s = 0; s < 16; s++) {
      const n = (start + mi * 16 + s) % 256, an = typeof biSpielt === 'function' ? biSpielt(n) : [], ak = akkStufe[(n >> 4) % 4];
      m.shaker[s] = an[0] ? 1 : 0; m.hat[s] = an[1] ? 1 : 0; m.perc[s] = an[2] ? 1 : 0; m.snare[s] = an[3] ? 1 : 0; m.kick[s] = an[8] ? 1 : 0;
      if (an[4]) m.sub[s] = ak; if (an[5]) m.chords[s] = ak; if (an[6]) m.lead[s] = ak + [0, 2, 4][leadTon[(s / 2) | 0]]; if (an[7]) m.wobble[s] = ak;
    }
    p.muster[mi] = m;
  }
  p.kanaele.sub.laenge = 6; p.kanaele.chords.laenge = 2; p.kanaele.wobble.laenge = 2; p.kanaele.lead.laenge = 2;
  p.binaerStart = start;
}

// ---------- Abspielen ----------
function stPlay() {
  const A = ftAudio(); if (!A || !st) return;
  if (st.laeuft) { stStopp(); return; }
  ftTaktStoppen();
  if (!st.aus || st.aus.kick.c !== A.c) st.aus = stKanalAusgaenge(A.c, A.master, st.p);
  stMixerAnwenden();
  Object.assign(st, { laeuft: true, g: 0, zeit: A.c.currentTime + 0.08, warte: [], songPos: 0 });
  stTimer = setInterval(() => {
    if (!st || !st.laeuft) return;
    if (!$('screen-studio').classList.contains('active')) { stStopp(); return; }
    while (st.zeit < A.c.currentTime + 0.12) {
      const p = st.p, dur = stDauer(p), s = st.g % 16;
      let mi = st.muster;
      if (st.modus === 'song') { const pos = Math.floor(st.g / 16) % p.song.length; mi = p.song[pos]; st.warteSong = pos; }
      const t = st.zeit + stSwing(p, st.g, dur);
      if (!A.stumm) stSchrittSpielen(st.aus, p, mi, s, t, dur);
      st.warte.push({ t, s, mi, pos: st.modus === 'song' ? Math.floor(st.g / 16) % p.song.length : -1 });
      st.g++; st.zeit += dur;
    }
  }, 25);
  stTransport();
  cancelAnimationFrame(stRaf);
  const lauf = () => {
    if (!st || !st.laeuft) return;
    const jetzt = A.c.currentTime;
    let e = null; while (st.warte.length && st.warte[0].t <= jetzt) e = st.warte.shift();
    if (e) stKopf(e);
    stRaf = requestAnimationFrame(lauf);
  };
  stRaf = requestAnimationFrame(lauf);
}
function stStopp() {
  clearInterval(stTimer); stTimer = null; cancelAnimationFrame(stRaf);
  if (st) { st.laeuft = false; st.kopf = null; document.querySelectorAll('#stInhalt .kopf').forEach((x) => x.classList.remove('kopf')); stTransport(); }
}
// Abspielkopf markieren; im Song-Modus wechselt die Ansicht mit
function stKopf(e) {
  st.kopf = e;
  if (st.modus === 'song' && e.mi !== st.ansichtMuster && (st.tab === 'rhythmus' || st.tab === 'melodie')) { st.ansichtMuster = e.mi; st.muster = e.mi; stZeichnen(); }
  document.querySelectorAll('#stInhalt .kopf').forEach((x) => x.classList.remove('kopf'));
  if (e.mi === st.muster) document.querySelectorAll('#stInhalt [data-s="' + e.s + '"]').forEach((x) => x.classList.add('kopf'));
  if (st.tab === 'song') document.querySelectorAll('#stInhalt [data-pos="' + e.pos + '"]').forEach((x) => x.classList.add('kopf'));
  const halb = st.halb;
  if (halb != null && st.folgen && (e.s < 8 ? 0 : 1) !== halb && e.mi === st.muster && (st.tab === 'rhythmus' || st.tab === 'melodie')) { st.halb = e.s < 8 ? 0 : 1; stZeichnen(); }
}

// ---------- Oberfläche ----------
function stOeffnen(binaerStart) {
  show('studio', '🎛️ Beat-Studio');
  const daten = stLaden();
  if (binaerStart != null) {
    // schon ein Projekt aus dieser Startzahl? Dann das öffnen, sonst neu anlegen
    let p = Object.values(daten.projekte).find((x) => x.binaerStart === binaerStart);
    if (!p) { p = stVorlage('binaer'); if (binaerStart) stBinaerFuellen(p, binaerStart); p.name = binaerStart ? 'Binär ab ' + binaerStart : 'Binär-Dubstep'; daten.projekte[p.id] = p; }
    daten.aktiv = p.id; saveJson(ST_KEY, daten);
  }
  st = { daten, p: daten.projekte[daten.aktiv], tab: 'rhythmus', muster: 0, modus: binaerStart != null ? 'song' : 'muster', kanal: 'lead', laeuft: false, halb: window.innerWidth < 560 ? 0 : null, folgen: true, rec: false, aus: null };
  stAufbau();
}
function stAufbau() {
  $('stTitel').textContent = '🎛️ ' + st.p.name;
  $('stKopfzeile').innerHTML = '<button type="button" class="st-play" id="stPlay" aria-label="Abspielen">▶</button>'
    + '<div class="st-tempo"><button type="button" data-bpm="-1" aria-label="langsamer">−</button><b id="stBpm"></b><small>BPM</small><button type="button" data-bpm="1" aria-label="schneller">+</button></div>'
    + '<div class="st-muster" id="stMusterWahl">' + [0, 1, 2, 3].map((i) => '<button type="button" data-m="' + i + '">' + 'ABCD'[i] + '</button>').join('') + '</div>'
    + '<button type="button" class="st-modus" id="stModus"></button><button type="button" class="st-menue-btn" id="stMenueBtn" aria-label="Menü">⋯</button>';
  $('stTabs').innerHTML = [['rhythmus', '🥁 Rhythmus'], ['melodie', '🎹 Melodie'], ['song', '🧩 Song'], ['mixer', '🎚️ Mixer'], ['pads', '🟪 Pads']].map(([id, n]) => '<button type="button" data-tab="' + id + '">' + n + '</button>').join('');
  $('stPlay').addEventListener('click', stPlay);
  $('stKopfzeile').querySelectorAll('[data-bpm]').forEach((b) => { let wdh = null; const schritt = () => { st.p.bpm = Math.max(60, Math.min(200, st.p.bpm + +b.dataset.bpm)); stTransport(); }; b.addEventListener('pointerdown', () => { schritt(); wdh = setInterval(schritt, 120); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => { if (wdh) { clearInterval(wdh); wdh = null; stSpeichern(); } })); });
  $('stMusterWahl').querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { st.muster = +b.dataset.m; st.ansichtMuster = st.muster; if (st.modus === 'song' && st.laeuft) { st.modus = 'muster'; } stTransport(); stZeichnen(); }));
  $('stModus').addEventListener('click', () => { st.modus = st.modus === 'song' ? 'muster' : 'song'; if (st.laeuft) { stStopp(); stPlay(); } stTransport(); });
  $('stMenueBtn').addEventListener('click', stMenue);
  $('stTabs').querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { st.tab = b.dataset.tab; stZeichnen(); }));
  stTransport(); stZeichnen();
}
function stTransport() {
  if (!st || !$('stPlay')) return;
  $('stPlay').textContent = st.laeuft ? '■' : '▶'; $('stPlay').classList.toggle('an', st.laeuft);
  $('stBpm').textContent = st.p.bpm;
  $('stMusterWahl').querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('an', +b.dataset.m === st.muster));
  $('stModus').textContent = st.modus === 'song' ? '🧩 Song' : '🔁 Muster'; $('stModus').classList.toggle('an', st.modus === 'song');
  $('stTabs').querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('an', b.dataset.tab === st.tab));
}
function stSchritte() { return st.halb == null ? [...Array(16).keys()] : [...Array(8).keys()].map((i) => i + st.halb * 8); }
function stHalbKnopf() {
  if (st.halb == null) return '';
  return '<div class="st-halb"><button type="button" data-halb="0" class="' + (st.halb === 0 ? 'an' : '') + '">Schritt 1–8</button><button type="button" data-halb="1" class="' + (st.halb === 1 ? 'an' : '') + '">9–16</button><label><input type="checkbox" id="stFolgen"' + (st.folgen ? ' checked' : '') + '> mitlaufen</label></div>';
}
function stHalbVerdrahten() {
  $('stInhalt').querySelectorAll('[data-halb]').forEach((b) => b.addEventListener('click', () => { st.halb = +b.dataset.halb; st.folgen = false; stZeichnen(); }));
  if ($('stFolgen')) $('stFolgen').addEventListener('change', (e) => { st.folgen = e.target.checked; });
}
function stZeichnen() {
  stTransport();
  const z = $('stInhalt'), m = st.p.muster[st.muster];
  if (st.tab === 'rhythmus') {
    const sch = stSchritte();
    z.innerHTML = stHalbKnopf() + '<div class="st-raster" style="--n:' + sch.length + '">' + ST_KANAELE.map((k) => {
      const kk = st.p.kanaele[k.id], aus = stKanalLaut(st.p, k.id) === 0;
      const zelle = (s) => { const w = m[k.id][s], an = k.art === 'drum' ? !!w : w != null; return '<button type="button" class="st-z' + (an ? ' an' : '') + (s % 4 === 0 ? ' takt' : '') + '" data-k="' + k.id + '" data-s="' + s + '" aria-label="' + k.name + ' Schritt ' + (s + 1) + '">' + (an && k.art !== 'drum' ? '<i>' + (k.art === 'akkord' ? stAkkordName(st.p, w) : stNotenName(stMidi(st.p, k.id, w)).replace(/\d+$/, '')) + '</i>' : '') + '</button>'; };
      return '<div class="st-zeile' + (aus ? ' aus' : '') + '" style="--f:' + k.f + '"><button type="button" class="st-name" data-vorhoeren="' + k.id + '">' + k.name + (kk.stumm ? ' 🔇' : kk.solo ? ' 🎧' : '') + '</button>' + sch.map(zelle).join('') + '</div>';
    }).join('') + '</div>'
      + '<p class="st-tipp">Antippen = Schlag an/aus. Bei Bass, Wobble, Lead und Akkorden setzt ein Tipp den Grundton – die Tonhöhe stellst du unter <b>🎹 Melodie</b> ein. Auf den Namen tippen = vorhören.</p>'
      + '<div class="st-aktionen"><button type="button" class="btn secondary" id="stKopieren">⧉ Muster ' + 'ABCD'[st.muster] + ' kopieren nach …</button><button type="button" class="btn secondary" id="stLeeren">✕ Muster leeren</button></div>';
    z.querySelectorAll('.st-z').forEach((b) => b.addEventListener('click', () => {
      const k = ST_KANAELE.find((x) => x.id === b.dataset.k), s = +b.dataset.s, arr = m[k.id];
      if (k.art === 'drum') arr[s] = arr[s] ? 0 : 1; else arr[s] = arr[s] == null ? (st.letzterTon && st.letzterTon[k.id] != null ? st.letzterTon[k.id] : 0) : null;
      const an = k.art === 'drum' ? !!arr[s] : arr[s] != null;
      if (an) stVorhoeren(k.id, arr[s]);
      stSpeichern(); stZeichnen();
    }));
    z.querySelectorAll('[data-vorhoeren]').forEach((b) => b.addEventListener('click', () => stVorhoeren(b.dataset.vorhoeren, 0)));
    $('stKopieren').addEventListener('click', stKopierenDialog);
    $('stLeeren').addEventListener('click', () => { if (confirm('Muster ' + 'ABCD'[st.muster] + ' wirklich leeren?')) { st.p.muster[st.muster] = stLeeresMuster(); stSpeichern(); stZeichnen(); } });
    stHalbVerdrahten();
  } else if (st.tab === 'melodie') {
    const k = ST_KANAELE.find((x) => x.id === st.kanal), sch = stSchritte(), arr = m[k.id], kk = st.p.kanaele[k.id];
    const zeilen = k.art === 'akkord' ? 7 : ST_ZEILEN;
    z.innerHTML = '<div class="st-kanalwahl">' + ST_KANAELE.filter((x) => x.art !== 'drum').map((x) => '<button type="button" data-kanal="' + x.id + '" class="' + (x.id === k.id ? 'an' : '') + '" style="--f:' + x.f + '">' + x.name + '</button>').join('') + '</div>'
      + '<div class="st-einst"><label>Tonart <select id="stTonart">' + ST_NOTEN.map((n, i) => '<option value="' + i + '"' + (i === st.p.tonart ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>'
      + '<label><select id="stSkala">' + Object.entries(ST_SKALEN).map(([id, s]) => '<option value="' + id + '"' + (id === st.p.skala ? ' selected' : '') + '>' + s.name + '</option>').join('') + '</select></label>'
      + '<label>Klang <select id="stKlang">' + k.klaenge.map((n, i) => '<option value="' + i + '"' + (i === kk.klang ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>'
      + '<label>Länge <select id="stLaenge">' + [[1, '1/16'], [2, '1/8'], [4, '1/4'], [6, '3/8'], [8, '1/2']].map(([v, n]) => '<option value="' + v + '"' + (v === kk.laenge ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label></div>'
      + stHalbKnopf()
      + '<div class="st-roll" style="--n:' + sch.length + ';--f:' + k.f + '">' + Array.from({ length: zeilen }, (_, i) => zeilen - 1 - i).map((stufe) => {
        const name = k.art === 'akkord' ? ST_STUFEN[stufe] + ' · ' + stAkkordName(st.p, stufe) : stNotenName(stMidi(st.p, k.id, stufe));
        return '<div class="st-rzeile' + (stufe % 7 === 0 ? ' grund' : '') + '"><span class="st-rname">' + name + '</span>' + sch.map((s) => '<button type="button" class="st-r' + (arr[s] === stufe ? ' an' : '') + (s % 4 === 0 ? ' takt' : '') + '" data-s="' + s + '" data-stufe="' + stufe + '" aria-label="' + name + ' Schritt ' + (s + 1) + '"></button>').join('') + '</div>';
      }).join('') + '</div>'
      + '<p class="st-tipp">' + (k.art === 'akkord' ? 'Jede Zeile ist ein Akkord der Tonart (I = Grundakkord). ' : 'Pro Schritt ein Ton. ') + 'Nochmal tippen löscht.</p>';
    z.querySelectorAll('[data-kanal]').forEach((b) => b.addEventListener('click', () => { st.kanal = b.dataset.kanal; stZeichnen(); }));
    $('stTonart').addEventListener('change', (e) => { st.p.tonart = +e.target.value; stSpeichern(); stZeichnen(); });
    $('stSkala').addEventListener('change', (e) => { st.p.skala = e.target.value; stSpeichern(); stZeichnen(); });
    $('stKlang').addEventListener('change', (e) => { kk.klang = +e.target.value; stSpeichern(); stVorhoeren(k.id, 0); });
    $('stLaenge').addEventListener('change', (e) => { kk.laenge = +e.target.value; stSpeichern(); });
    z.querySelectorAll('.st-r').forEach((b) => b.addEventListener('click', () => {
      const s = +b.dataset.s, stufe = +b.dataset.stufe;
      arr[s] = arr[s] === stufe ? null : stufe;
      if (arr[s] != null) { stVorhoeren(k.id, stufe); st.letzterTon = st.letzterTon || {}; st.letzterTon[k.id] = stufe; }
      stSpeichern(); stZeichnen();
    }));
    stHalbVerdrahten();
  } else if (st.tab === 'song') {
    const song = st.p.song;
    z.innerHTML = '<p class="st-tipp">Die Reihenfolge deiner Muster. Im Modus <b>🧩 Song</b> wird sie abgespielt – sonst läuft nur das gewählte Muster in Schleife.</p>'
      + '<div class="st-song">' + song.map((mi, i) => '<button type="button" class="st-slot m' + mi + '" data-pos="' + i + '">' + 'ABCD'[mi] + '<small>' + (i + 1) + '</small></button>').join('') + (song.length < 32 ? '<div class="st-dazu">' + [0, 1, 2, 3].map((mi) => '<button type="button" class="st-slot neu m' + mi + '" data-dazu="' + mi + '">+' + 'ABCD'[mi] + '</button>').join('') + '</div>' : '') + '</div>'
      + '<p class="st-tipp">Kästchen antippen = A→B→C→D wechseln. ' + song.length + ' Takte · ' + stZeitText(song.length * 16 * stDauer(st.p)) + '</p>'
      + '<div class="st-aktionen"><button type="button" class="btn secondary" id="stSongWeg"' + (song.length < 2 ? ' disabled' : '') + '>⌫ Letzten Takt weg</button><button type="button" class="btn secondary" id="stSongPlay">▶ Song abspielen</button></div>';
    z.querySelectorAll('[data-pos]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.pos; song[i] = (song[i] + 1) % 4; stSpeichern(); stZeichnen(); }));
    z.querySelectorAll('[data-dazu]').forEach((b) => b.addEventListener('click', () => { song.push(+b.dataset.dazu); stSpeichern(); stZeichnen(); }));
    $('stSongWeg').addEventListener('click', () => { if (song.length > 1) { song.pop(); stSpeichern(); stZeichnen(); } });
    $('stSongPlay').addEventListener('click', () => { st.modus = 'song'; if (st.laeuft) stStopp(); stPlay(); });
  } else if (st.tab === 'mixer') {
    z.innerHTML = '<div class="st-mixer">' + ST_KANAELE.map((k) => { const kk = st.p.kanaele[k.id]; return '<div class="st-kanal" style="--f:' + k.f + '"><input type="range" min="0" max="100" value="' + Math.round(kk.laut * 100) + '" data-laut="' + k.id + '" aria-label="Lautstärke ' + k.name + '" orient="vertical"><b>' + k.name + '</b><div><button type="button" data-stumm="' + k.id + '" class="' + (kk.stumm ? 'an' : '') + '" aria-label="' + k.name + ' stumm">M</button><button type="button" data-solo="' + k.id + '" class="' + (kk.solo ? 'an' : '') + '" aria-label="' + k.name + ' solo">S</button></div></div>'; }).join('') + '</div>'
      + '<div class="st-einst"><label>Swing <input type="range" min="0" max="60" value="' + Math.round(st.p.swing * 100) + '" id="stSwing"></label><label>Tempo <input type="range" min="60" max="200" value="' + st.p.bpm + '" id="stBpmRegler"></label></div>'
      + '<p class="st-tipp">M = stumm, S = solo (nur dieser Kanal und andere Solo-Kanäle).</p>';
    z.querySelectorAll('[data-laut]').forEach((r) => r.addEventListener('input', () => { st.p.kanaele[r.dataset.laut].laut = r.value / 100; stMixerAnwenden(); }));
    z.querySelectorAll('[data-laut]').forEach((r) => r.addEventListener('change', stSpeichern));
    z.querySelectorAll('[data-stumm]').forEach((b) => b.addEventListener('click', () => { const kk = st.p.kanaele[b.dataset.stumm]; kk.stumm = !kk.stumm; stMixerAnwenden(); stSpeichern(); stZeichnen(); }));
    z.querySelectorAll('[data-solo]').forEach((b) => b.addEventListener('click', () => { const kk = st.p.kanaele[b.dataset.solo]; kk.solo = !kk.solo; stMixerAnwenden(); stSpeichern(); stZeichnen(); }));
    $('stSwing').addEventListener('input', (e) => { st.p.swing = e.target.value / 100; });
    $('stSwing').addEventListener('change', stSpeichern);
    $('stBpmRegler').addEventListener('input', (e) => { st.p.bpm = +e.target.value; stTransport(); });
    $('stBpmRegler').addEventListener('change', stSpeichern);
  } else if (st.tab === 'pads') {
    const pads = ST_KANAELE.filter((k) => k.art === 'drum').concat([{ id: 'chords', name: 'Akkord I', f: '#fbbf24', w: 0 }, { id: 'chords', name: 'Akkord VI', f: '#fbbf24', w: 5 }, { id: 'sub', name: 'Bass', f: '#818cf8', w: 0 }, { id: 'wobble', name: 'Wobble', f: '#c084fc', w: 0 }, { id: 'lead', name: 'Lead', f: '#fb923c', w: 7 }]);
    z.innerHTML = '<div class="st-pads">' + pads.map((k, i) => '<button type="button" class="st-pad" data-pad="' + i + '" style="--f:' + k.f + '">' + k.name + '</button>').join('') + '</div>'
      + '<label class="st-rec"><input type="checkbox" id="stRec"' + (st.rec ? ' checked' : '') + '> ⏺ Aufnehmen: Während das Muster läuft, landen deine Pad-Schläge auf dem nächsten Sechzehntel</label>';
    z.querySelectorAll('[data-pad]').forEach((b) => b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); const k = pads[+b.dataset.pad];
      stVorhoeren(k.id, k.w || 0); b.classList.add('druck'); setTimeout(() => b.classList.remove('druck'), 120);
      if (st.rec && st.laeuft) stAufnehmen(k.id, k.w || 0);
    }));
    $('stRec').addEventListener('change', (e) => { st.rec = e.target.checked; });
  }
}
const stZeitText = (s) => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
function stVorhoeren(kanal, wert) {
  const A = ftAudio(); if (!A || A.stumm) return;
  if (!st.aus || st.aus.kick.c !== A.c) st.aus = stKanalAusgaenge(A.c, A.master, st.p);
  const g = st.aus[kanal].master; const alt = g.gain.value; if (!alt) g.gain.value = st.p.kanaele[kanal].laut || 0.7;
  stInstrument(st.aus[kanal], kanal, A.c.currentTime + 0.005, st.p, wert, stDauer(st.p));
  if (!alt) setTimeout(() => stMixerAnwenden(), 800);
}
// Pad-Schlag ins laufende Muster schreiben (auf das nächstgelegene Sechzehntel)
function stAufnehmen(kanal, wert) {
  const A = ftAudio(), dur = stDauer(st.p), jetzt = A.c.currentTime;
  const g = Math.round((jetzt - (st.zeit - st.g * dur)) / dur), s = ((g % 16) + 16) % 16;
  let mi = st.muster;
  if (st.modus === 'song') mi = st.p.song[Math.floor(g / 16) % st.p.song.length];
  const k = ST_KANAELE.find((x) => x.id === kanal);
  st.p.muster[mi][kanal][s] = k.art === 'drum' ? 1 : wert;
  stSpeichern();
  return { mi, s };
}
function stKopierenDialog() {
  stDialog('Muster ' + 'ABCD'[st.muster] + ' kopieren nach', [0, 1, 2, 3].filter((i) => i !== st.muster).map((i) => ['Muster ' + 'ABCD'[i] + ' überschreiben', () => { st.p.muster[i] = JSON.parse(JSON.stringify(st.p.muster[st.muster])); stSpeichern(); st.muster = i; stZeichnen(); }]));
}
function stDialog(titel, knoepfe, html = '') {
  const d = document.createElement('div'); d.className = 'ft-ergebnis st-dialog';
  d.innerHTML = '<div class="ft-karte"><h3>' + titel + '</h3>' + html + '<div class="ft-karte-knoepfe">' + knoepfe.map((k, i) => '<button type="button" class="btn ' + (k[2] || 'secondary') + '" data-i="' + i + '">' + k[0] + '</button>').join('') + '<button type="button" class="btn secondary" data-i="x">Abbrechen</button></div></div>';
  $('stInhalt').appendChild(d);
  d.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.i !== 'x') knoepfe[+b.dataset.i][1](); d.remove(); }));
  d.addEventListener('click', (e) => { if (e.target === d) d.remove(); });
  return d;
}
function stMenue() {
  stDialog('🎛️ ' + st.p.name, [
    ['📁 Meine Projekte', stProjekte],
    ['＋ Neues Projekt (Vorlage)', stNeuDialog],
    ['🔢 Binär-Generator', stBinaerDialog],
    ['✏️ Umbenennen', () => { const n = prompt('Name des Projekts', st.p.name); if (n && n.trim()) { st.p.name = n.trim().slice(0, 40); stSpeichern(); stAufbau(); } }],
    ['💾 Als WAV exportieren', stExport],
  ]);
}
function stProjekte() {
  const l = Object.values(st.daten.projekte).sort((a, b) => b.geaendert - a.geaendert);
  const d = stDialog('📁 Meine Projekte', [], '<div class="st-projekte">' + l.map((p) => '<div class="st-projekt' + (p.id === st.p.id ? ' an' : '') + '"><button type="button" data-oeffnen="' + p.id + '"><b>' + p.name.replace(/[<>&]/g, '') + '</b><small>' + p.bpm + ' BPM · ' + ST_NOTEN[p.tonart] + ' ' + ST_SKALEN[p.skala].name + ' · ' + new Date(p.geaendert).toLocaleDateString('de-DE') + '</small></button><button type="button" data-kopie="' + p.id + '" aria-label="Kopie">⧉</button><button type="button" data-weg="' + p.id + '" aria-label="Löschen">🗑</button></div>').join('') + '</div>');
  d.querySelectorAll('[data-oeffnen]').forEach((b) => b.addEventListener('click', () => { d.remove(); stWechseln(b.dataset.oeffnen); }));
  d.querySelectorAll('[data-kopie]').forEach((b) => b.addEventListener('click', () => { const p = JSON.parse(JSON.stringify(st.daten.projekte[b.dataset.kopie])); p.id = stNeuesProjekt().id; p.name = (p.name + ' (Kopie)').slice(0, 40); p.geaendert = Date.now(); st.daten.projekte[p.id] = p; saveJson(ST_KEY, st.daten); d.remove(); stProjekte(); }));
  d.querySelectorAll('[data-weg]').forEach((b) => b.addEventListener('click', () => {
    if (Object.keys(st.daten.projekte).length < 2) { alert('Das letzte Projekt kann nicht gelöscht werden.'); return; }
    if (!confirm('„' + st.daten.projekte[b.dataset.weg].name + '“ wirklich löschen?')) return;
    delete st.daten.projekte[b.dataset.weg];
    if (b.dataset.weg === st.p.id) { st.p = Object.values(st.daten.projekte).sort((a, c) => c.geaendert - a.geaendert)[0]; st.daten.aktiv = st.p.id; }
    saveJson(ST_KEY, st.daten); d.remove(); stAufbau(); stProjekte();
  }));
}
function stWechseln(id) { stStopp(); st.p = stReparieren(st.daten.projekte[id]); st.daten.aktiv = id; st.aus = null; st.muster = 0; saveJson(ST_KEY, st.daten); stAufbau(); }
function stNeuDialog() {
  stDialog('Neues Projekt', [['🔢 Binär-Dubstep (140 BPM)', 'binaer'], ['⚡ Happy Hardcore (175 BPM)', 'hardcore'], ['🏠 House-Groove (124 BPM)', 'house'], ['🔊 Trap (140 BPM)', 'trap'], ['⬜ Leer', 'leer']].map(([n, art]) => [n, () => { const p = stVorlage(art); st.daten.projekte[p.id] = p; stWechseln(p.id); }]));
}
function stBinaerDialog() {
  const d = stDialog('🔢 Binär-Generator', [['Muster A–D füllen', () => { const n = Math.max(0, Math.min(255, Math.floor(+$('stBinStart').value) || 0)); stBinaerFuellen(st.p, n); stSpeichern(); st.modus = 'song'; stAufbau(); }, 'ft-los st-los']],
    '<p>Zählt ab deiner Startzahl 64 Schritte weiter. Jedes Bit ist ein Instrument – wie im Binär-Beat: Shaker, Hi-Hat, Perc und Snare schlagen an, wenn ihr Bit auf 1 springt; Bass, Akkorde, Lead und Wobble spielen, solange ihr Bit 1 ist. <b>Überschreibt die Muster A–D.</b></p>'
    + '<div class="st-einst"><label>Startzahl <input type="number" id="stBinStart" min="0" max="255" value="' + (st.p.binaerStart || 0) + '" inputmode="numeric"></label></div><p class="ft-klein">Tipp: 0 = ruhiger Anfang, 64 = mit Lead, 128 = mit Wobble, 192 = alles.</p>');
  return d;
}

// ---------- WAV-Export (offline gerendert) ----------
async function stExport() {
  const p = st.p, takte = st.modus === 'song' ? p.song : [st.muster, st.muster, st.muster, st.muster];
  const dur = stDauer(p), laenge = takte.length * 16 * dur + 2.5, rate = 44100;
  const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OC) { alert('Dieser Browser kann leider nicht exportieren.'); return; }
  const info = stDialog('💾 Export', [], '<div id="stExportInfo"><p>Wird gerechnet …</p></div>');
  try {
    const c = new OC(2, Math.ceil(laenge * rate), rate), master = c.createGain(), komp = c.createDynamicsCompressor();
    master.gain.value = 0.55; master.connect(komp).connect(c.destination);
    ftAudio();   // sorgt für den gemeinsamen Rausch-Puffer
    const aus = stKanalAusgaenge(c, master, p);
    takte.forEach((mi, ti) => { for (let s = 0; s < 16; s++) { const g = ti * 16 + s; stSchrittSpielen(aus, p, mi, s, 0.05 + g * dur + stSwing(p, g, dur), dur); } });
    const buf = await c.startRendering(), wav = stWav(buf);
    const name = p.name.replace(/[^\wäöüÄÖÜß -]+/g, '').trim() || 'beat';
    const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
    st.letzterExport = { bytes: wav.byteLength, sek: buf.duration, name };
    $('stExportInfo').innerHTML = '<p>' + stZeitText(buf.duration) + ' · ' + (wav.byteLength / 1048576).toFixed(1).replace('.', ',') + ' MB</p><a class="btn ft-los st-los" id="stLaden" href="' + url + '" download="' + name + '.wav">⬇ ' + name + '.wav speichern</a><p class="ft-klein">Alles wurde hier auf dem Gerät berechnet – nichts wird hochgeladen.</p>';
  } catch (e) { if ($('stExportInfo')) $('stExportInfo').textContent = 'Export hat nicht geklappt: ' + e.message; }
  return info;
}
function stWav(buf) {
  const n = buf.length, ch = buf.numberOfChannels, out = new DataView(new ArrayBuffer(44 + n * ch * 2)), w = (o, s) => [...s].forEach((x, i) => out.setUint8(o + i, x.charCodeAt(0)));
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const d = [...Array(ch).keys()].map((i) => buf.getChannelData(i));
  for (let i = 0, o = 44; i < n; i++) for (let k = 0; k < ch; k++, o += 2) out.setInt16(o, Math.max(-1, Math.min(1, d[k][i])) * 32767, true);
  return out.buffer;
}

// ---------- Navigation ----------
$('hubStudio').addEventListener('click', () => { merkeZuletzt('studio'); zoomZu($('hubStudio'), stOeffnen); });
$('stZurueck').addEventListener('click', () => { stStopp(); const d = document.querySelector('#stInhalt .st-dialog'); if (d) { d.remove(); return; } st = null; zeigeHub(); });
