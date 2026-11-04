// 🎵 Song-Rätsel im Ton-Gedächtnis
//  • „Wie geht’s weiter?“: Ein Lied läuft und stoppt – welcher Ton kommt als Nächstes?
//  • „Rückwärts“: Ein Lied läuft rückwärts – welches ist es?
// Quellen: eingebaute, gemeinfreie Lieder (selbst synthetisiert) oder eigene Audiodateien vom Gerät.
// Eigene Songs bleiben im Browser (IndexedDB), nichts wird hochgeladen. Spotify/YouTube gehen nicht:
// Spotify liefert seit Nov. 2024 keine Hörproben mehr und braucht Premium + Login; YouTube läuft nur im
// fremden iframe – dessen Ton kann eine Web-App weder umdrehen noch analysieren.
const SR_LIEDER = [
  { t: 'Alle meine Entchen', bpm: 120, n: 'C4 D4 E4 F4 G4:2 G4:2 A4 A4 A4 A4 G4:4 A4 A4 A4 A4 G4:4 F4 F4 F4 F4 E4:2 E4:2 D4 D4 D4 D4 C4:4' },
  { t: 'Hänschen klein', bpm: 120, n: 'G4 E4 E4:2 F4 D4 D4:2 C4 D4 E4 F4 G4 G4 G4:2 G4 E4 E4:2 F4 D4 D4:2 C4 E4 G4 G4 C4:4' },
  { t: 'Bruder Jakob', bpm: 120, n: 'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 C4 G3 C4:2 C4 G3 C4:2' },
  { t: 'Freude, schöner Götterfunken', bpm: 120, n: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2' },
  { t: 'Morgen kommt der Weihnachtsmann', bpm: 110, n: 'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2' },
  { t: 'Jingle Bells', bpm: 140, n: 'E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4 F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 E4 D4 D4 E4 D4:2 G4:2' },
  { t: 'Happy Birthday', bpm: 100, n: 'G3:.75 G3:.25 A3 G3 C4 B3:2 G3:.75 G3:.25 A3 G3 D4 C4:2 G3:.75 G3:.25 G4 E4 C4 B3 A3:2 F4:.75 F4:.25 E4 C4 D4 C4:2' },
  { t: 'Stille Nacht', bpm: 150, n: 'G4:1.5 A4:.5 G4 E4:3 G4:1.5 A4:.5 G4 E4:3 D5:2 D5 B4:3 C5:2 C5 G4:3 A4:2 A4 C5:1.5 B4:.5 A4 G4:1.5 A4:.5 G4 E4:3' },
  { t: 'Für Elise', bpm: 140, n: 'E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1.5 C4:.5 E4:.5 A4:.5 B4:1.5 E4:.5 G#4:.5 B4:.5 C5:1.5 E4:.5 E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1.5' },
  { t: 'Oh When the Saints', bpm: 160, n: 'C4 E4 F4 G4:4 C4 E4 F4 G4:4 C4 E4 F4 G4:2 E4:2 C4:2 E4:2 D4:4' },
  { t: 'Guten Abend, gut’ Nacht', bpm: 120, n: 'E4:.5 E4:.5 G4:2 E4:.5 E4:.5 G4:2 E4:.5 G4:.5 C5 B4:1.5 A4:.5 A4 G4 D4:.5 E4:.5 F4 D4 D4:.5 E4:.5 F4:2 D4:.5 F4:.5 B4:.5 A4:.5 G4 B4 C5:2' },
  { t: 'Old MacDonald', bpm: 130, n: 'C4 C4 C4 G3 A3 A3 G3:2 E4 E4 D4 D4 C4:3' },
  { t: 'Mary Had a Little Lamb', bpm: 130, n: 'E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:4' },
  { t: 'Yankee Doodle', bpm: 150, n: 'C4 C4 D4 E4 C4 E4 D4 G3 C4 C4 D4 E4 C4:2 B3:2 C4 C4 D4 E4 F4 E4 D4 C4 B3 G3 A3 B3 C4:2 C4:2' },
];
const SR_MODI = {
  weiter: { name: 'Wie geht’s weiter?', emoji: '⏸️', text: 'Lied stoppt – welcher Ton kommt?' },
  rueck: { name: 'Rückwärts', emoji: '⏪', text: 'Lied läuft rückwärts – welches?' },
};
const SR_STUFEN = {
  weiter: { leicht: 'von vorn · Titel sichtbar · nur Töne aus dem Lied', mittel: 'mitten im Lied · Titel geheim · alle 12 Töne', profi: 'kurzer Ausschnitt · andere Tonart · alle 12 Töne' },
  rueck: { leicht: '3 Antworten · bis zu 3× hören', mittel: '4 Antworten · bis zu 2× hören', profi: '6 Antworten · 1× hören · andere Tonart' },
  eigenWeiter: { leicht: '8 Sekunden Anlauf', mittel: '5 Sekunden Anlauf', profi: '3 Sekunden Anlauf' },
  eigenRueck: { leicht: '7 Sekunden · bis zu 3× hören', mittel: '5 Sekunden · bis zu 2× hören', profi: '3 Sekunden · 1× hören' },
};
const SR_RUNDEN = 5;
const SR_NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function srNoten(text, transp = 0) {
  return text.trim().split(/\s+/).map((tok) => {
    const [n, d] = tok.split(':'), m = /^([A-G])(#|b)?(\d)$/.exec(n);
    return { m: m ? 12 * (Number(m[3]) + 1) + SR_NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + transp : null, d: d ? Number(d) : 1 };
  });
}

// ---------- Klang: Noten mit Obertönen offline in einen Puffer rendern ----------
function srRendern(noten, bpm) {
  const rate = 44100, beat = 60 / bpm, len = noten.reduce((a, x) => a + x.d, 0) * beat + 1.3;
  const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const c = new Off(1, Math.ceil(len * rate), rate), master = c.createGain();
  master.gain.value = 0.9; master.connect(c.destination);
  let t = 0.03;
  noten.forEach((x) => {
    if (x.m != null) {
      const f = 440 * Math.pow(2, (x.m - 69) / 12), dauer = Math.max(0.35, x.d * beat * 0.95) + 0.3;
      [[1, 0.3], [2, 0.11], [3, 0.045], [4, 0.02]].forEach(([k, a]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = f * k;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + 0.012);
        g.gain.exponentialRampToValueAtTime(a * 0.4, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
        o.connect(g).connect(master); o.start(t); o.stop(t + dauer + 0.02);
      });
    }
    t += x.d * beat;
  });
  return new Promise((res) => { c.oncomplete = (e) => res(e.renderedBuffer); const p = c.startRendering(); if (p && p.then) p.then(res); });
}
// Puffer umdrehen (stille Ränder vorher abschneiden, sonst beginnt „rückwärts“ mit einer Pause)
function srUmdrehen(buf) {
  const a0 = buf.getChannelData(0);
  let s = 0, e = a0.length - 1;
  while (s < e && Math.abs(a0[s]) < 0.002) s++;
  while (e > s && Math.abs(a0[e]) < 0.002) e--;
  const out = audio().createBuffer(buf.numberOfChannels, e - s + 1, buf.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const a = buf.getChannelData(ch), b = out.getChannelData(ch);
    for (let i = 0; i <= e - s; i++) b[i] = a[e - i];
  }
  return out;
}
function srAusschnitt(buf, von, bis) {
  const r = buf.sampleRate, s = Math.max(0, Math.floor(von * r)), e = Math.min(buf.length, Math.floor(bis * r));
  const out = audio().createBuffer(buf.numberOfChannels, Math.max(1, e - s), r);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) out.getChannelData(ch).set(buf.getChannelData(ch).subarray(s, e));
  // weich ein- und ausblenden (kein Knacken)
  const n = Math.min(Math.floor(r * 0.03), out.length >> 2);
  for (let ch = 0; ch < out.numberOfChannels; ch++) { const d = out.getChannelData(ch); for (let i = 0; i < n; i++) { d[i] *= i / n; d[d.length - 1 - i] *= i / n; } }
  return out;
}
let srQuelle = null;
function srSpielen(buf, wennFertig) {
  srStopp();
  try {
    const c = audio(), q = c.createBufferSource(), g = c.createGain();
    g.gain.value = 0.9; q.buffer = buf; q.connect(g).connect(c.destination);
    q.onended = () => { if (srQuelle === q) { srQuelle = null; if (wennFertig) wennFertig(); } };
    q.start(); srQuelle = q;
  } catch (e) { if (wennFertig) wennFertig(); }
}
function srStopp() { if (srQuelle) { const q = srQuelle; srQuelle = null; try { q.stop(); } catch (e) { /* schon aus */ } } }
function srTaste(midi) { if (typeof gbKlang === 'function') gbKlang(440 * Math.pow(2, (midi - 69) / 12), 0.02, 0.9); }

// ---------- Eigene Songs: IndexedDB (bleibt nur auf diesem Gerät) ----------
function srDB() {
  return new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('kein IndexedDB'));
    const r = indexedDB.open('walquiz-songs', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('songs', { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function srDbTun(modus, fn) {
  const db = await srDB();
  return new Promise((res, rej) => { const tx = db.transaction('songs', modus), r = fn(tx.objectStore('songs')); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); });
}
const srSongs = () => srDbTun('readonly', (s) => s.getAll()).then((l) => (l || []).map((x) => ({ id: x.id, name: x.name, groesse: x.groesse }))).catch(() => []);
const srSongLaden = (id) => srDbTun('readonly', (s) => s.get(id));
const srSongWeg = (id) => srDbTun('readwrite', (s) => s.delete(id));
async function srSongDazu(datei) {
  const daten = await datei.arrayBuffer();
  await srDekodieren(daten.slice(0));   // vorher prüfen, ob der Browser die Datei abspielen kann
  const id = 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  await srDbTun('readwrite', (s) => s.put({ id, name: datei.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').slice(0, 60), groesse: datei.size, daten }));
  return id;
}
function srDekodieren(ab) {
  return new Promise((res, rej) => { const p = audio().decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
}
const srPuffer = {};   // id → AudioBuffer (nur während einer Partie)
async function srSongPuffer(id) {
  if (!srPuffer[id]) { const x = await srSongLaden(id); srPuffer[id] = await srDekodieren(x.daten.slice(0)); }
  return srPuffer[id];
}

// ---------- Tonhöhe erkennen (YIN) für eigene Songs ----------
function srMono(buf, ziel = 11025) {
  const q = Math.max(1, Math.round(buf.sampleRate / ziel)), n = Math.floor(buf.length / q), out = new Float32Array(n), ch = [];
  for (let c = 0; c < buf.numberOfChannels; c++) ch.push(buf.getChannelData(c));
  for (let i = 0; i < n; i++) { let s = 0; for (let k = 0; k < q; k++) for (const a of ch) s += a[i * q + k]; out[i] = s / (q * ch.length); }
  return { x: out, rate: buf.sampleRate / q };
}
function srYin(x, start, W, rate) {
  const tMin = Math.floor(rate / 1000), tMax = Math.floor(rate / 70);
  if (start + W + tMax >= x.length) return { f: 0, q: 1, e: 0 };
  let e = 0; for (let j = 0; j < W; j++) e += x[start + j] * x[start + j];
  e = Math.sqrt(e / W);
  if (e < 0.01) return { f: 0, q: 1, e };
  const d = new Float32Array(tMax + 1);
  for (let tau = 1; tau <= tMax; tau++) { let s = 0; for (let j = 0; j < W; j++) { const v = x[start + j] - x[start + j + tau]; s += v * v; } d[tau] = s; }
  let sum = 0; d[0] = 1;
  for (let tau = 1; tau <= tMax; tau++) { sum += d[tau]; d[tau] = sum ? (d[tau] * tau) / sum : 1; }
  let tau = tMin;
  while (tau <= tMax && d[tau] >= 0.15) tau++;
  if (tau > tMax) return { f: 0, q: 1, e };
  while (tau + 1 <= tMax && d[tau + 1] < d[tau]) tau++;
  const a = d[tau - 1], b = d[tau], c = d[tau + 1] != null ? d[tau + 1] : b, den = a + c - 2 * b;
  const t = den ? tau + (a - c) / (2 * den) : tau;
  return { f: rate / t, q: b, e };
}
const srMidiVon = (f) => 69 + 12 * Math.log2(f / 440);
// Sucht ab einer Zeit eine Stelle, an der ein neuer, klar gehaltener Ton beginnt.
function srStoppSuchen(mono, ab, bis) {
  const { x, rate } = mono, W = 512, hop = Math.round(rate * 0.04), lauf = 7;
  const fr = [];
  for (let s = Math.floor(ab * rate); s < Math.min(bis * rate, x.length - W - 200); s += hop) fr.push({ t: s / rate, ...srYin(x, s, W, rate) });
  for (let i = 1; i + lauf <= fr.length; i++) {
    const run = fr.slice(i, i + lauf);
    if (!run.every((r) => r.f > 0 && r.q < 0.15)) continue;
    const mids = run.map((r) => srMidiVon(r.f)).sort((a, b) => a - b), med = mids[lauf >> 1];
    if (mids[lauf - 1] - mids[0] > 0.6) continue;
    const vor = fr[i - 1];
    if (vor.f > 0 && vor.q < 0.2 && Math.abs(srMidiVon(vor.f) - med) < 0.8) continue;   // kein neuer Ton
    return { stopp: run[0].t, midi: med };
  }
  return null;
}

// ---------- Partie ----------
let sr = null;
const srKey = () => tonStore().song || {};
function srRundenBauen(modus, stufe, r) {
  const idx = [...SR_LIEDER.keys()].sort(() => r() - 0.5), out = [];
  for (let i = 0; i < SR_RUNDEN; i++) {
    const L = SR_LIEDER[idx[i % idx.length]], transp = stufe === 'profi' ? Math.floor(r() * 12) - 5 : 0, N = srNoten(L.n, transp);
    if (modus === 'weiter') {
      const kand = N.map((x, k) => k).filter((k) => k >= 5 && N[k].m != null && (stufe !== 'leicht' || k < N.length * 0.75));
      const k = kand[Math.floor(r() * kand.length)];
      const von = stufe === 'leicht' ? 0 : stufe === 'mittel' ? Math.max(0, k - 10) : Math.max(0, k - 6);
      const pcs = [...new Set(N.filter((x) => x.m != null).map((x) => ((x.m % 12) + 12) % 12))];
      out.push({ L, N, k, von, transp, ziel: N[k].m, prev: N[k - 1].m != null ? N[k - 1].m : N[k].m, erlaubt: stufe === 'leicht' ? pcs : [...Array(12).keys()] });
    } else {
      const zahl = { leicht: 3, mittel: 4, profi: 6 }[stufe];
      const andere = SR_LIEDER.filter((x) => x !== L).sort(() => r() - 0.5).slice(0, zahl - 1);
      let bis = 0, dauer = 0;
      while (bis < N.length && (dauer < 7.5 * L.bpm / 60 || bis < 8) && bis < 16) dauer += N[bis++].d;
      out.push({ L, N: N.slice(0, bis), transp, optionen: [L, ...andere].sort(() => r() - 0.5).map((x) => x.t), richtig: L.t });
    }
  }
  return out;
}
async function srEigeneRunden(modus, stufe, songs, r) {
  const out = [], liste = songs.slice().sort(() => r() - 0.5);
  const anlauf = { leicht: 8, mittel: 5, profi: 3 }[stufe], laenge = { leicht: 7, mittel: 5, profi: 3.5 }[stufe];
  for (let i = 0; i < SR_RUNDEN; i++) {
    const S = liste[i % liste.length];
    if (modus === 'weiter') out.push({ eigen: S, anlauf });
    else {
      const zahl = Math.min(liste.length, { leicht: 3, mittel: 4, profi: 6 }[stufe]);
      const opt = [S.name, ...liste.filter((x) => x !== S).sort(() => r() - 0.5).slice(0, zahl - 1).map((x) => x.name)].sort(() => r() - 0.5);
      out.push({ eigen: S, laenge, optionen: opt, richtig: S.name });
    }
  }
  return out;
}
async function srStart(modus, stufe, quelle) {
  audio();
  const r = zufallsGenerator('sr-' + Date.now() + Math.random());
  sr = { modus, stufe, quelle, i: 0, punkte: [], lauf: {} };
  zeigeTonTeil('song');
  if (quelle === 'eigen') {
    const songs = await srSongs();
    if (songs.length < (modus === 'rueck' ? 2 : 1)) { srMenue(); return; }
    $('ton-song').innerHTML = '<div class="ton-merk">Lade deine Songs …</div>';
    sr.runden = await srEigeneRunden(modus, stufe, songs, r);
  } else sr.runden = srRundenBauen(modus, stufe, r);
  srRunde();
}
function srKopf() {
  const M = SR_MODI[sr.modus];
  return '<div class="gb-kopf"><span>' + M.emoji + ' ' + M.name + ' · ' + { leicht: 'Leicht', mittel: 'Mittel', profi: 'Profi' }[sr.stufe] + (sr.quelle === 'eigen' ? ' · 📁' : '') + '</span><span>' + (sr.i + 1) + ' / ' + sr.runden.length + ' · ' + fmt(sr.punkte.reduce((a, b) => a + b, 0)) + ' P.</span></div>'
    + '<div class="gb-balken"><i style="width:' + Math.round((sr.i / sr.runden.length) * 100) + '%"></i></div>';
}
async function srRunde() {
  const R = sr.runden[sr.i], box = $('ton-song'), lauf = (sr.lauf = {});
  R.antwort = null; R.gehoert = 0;
  box.innerHTML = srKopf() + '<div class="ton-merk">Einen Moment …</div>';
  try {
    if (R.eigen) {
      const buf = await srSongPuffer(R.eigen.id);
      if (sr.lauf !== lauf) return;
      if (sr.modus === 'weiter') {
        if (!R.stopp) {
          const mono = srMono(buf), dauer = buf.duration, r = Math.random;
          for (let v = 0; v < 18 && !R.stopp; v++) {
            const ab = Math.max(R.anlauf + 0.5, dauer * 0.08) + r() * Math.max(1, dauer * 0.85 - R.anlauf - 5);
            const st = srStoppSuchen(mono, ab, ab + 4);
            if (st) { R.stopp = st.stopp; R.ziel = st.midi; }
          }
        }
        if (!R.stopp) { srUnbrauchbar(R); return; }
        R.vorher = srAusschnitt(buf, R.stopp - R.anlauf, R.stopp);
        R.danach = srAusschnitt(buf, R.stopp - 1.5, R.stopp + 1.6);
        R.prev = Math.round(R.ziel); R.erlaubt = [...Array(12).keys()];
      } else {
        const ab = buf.duration * 0.15 + Math.random() * Math.max(0, buf.duration * 0.7 - R.laenge);
        R.vor = srAusschnitt(buf, ab, ab + R.laenge); R.klang = srUmdrehen(R.vor);
      }
    } else if (sr.modus === 'weiter') {
      R.vorher = await srRendern(R.N.slice(R.von, R.k), R.L.bpm);
      R.danach = await srRendern(R.N.slice(Math.max(R.von, R.k - 3), Math.min(R.N.length, R.k + 3)), R.L.bpm);
    } else {
      R.vor = await srRendern(R.N, R.L.bpm); R.klang = srUmdrehen(R.vor);
    }
  } catch (e) { box.innerHTML = srKopf() + '<p class="gb-info">Dieser Song lässt sich hier nicht abspielen.</p><button type="button" class="btn ton-gross" id="srWeiter">Weiter →</button>'; $('srWeiter').addEventListener('click', () => srNaechste(0)); return; }
  if (sr.lauf !== lauf) return;
  if (sr.modus === 'weiter') srWeiterAnzeigen(R); else srRueckAnzeigen(R);
}
function srUnbrauchbar(R) {
  $('ton-song').innerHTML = srKopf() + '<p class="gb-info">In „' + R.eigen.name + '“ habe ich keinen klar erkennbaren Ton gefunden (sehr volle Mischung oder viel Schlagzeug). Diese Runde zählt nicht.</p><button type="button" class="btn ton-gross" id="srWeiter">Weiter →</button>';
  $('srWeiter').addEventListener('click', () => srNaechste(null));
}
function srWeiterAnzeigen(R) {
  const titel = R.eigen ? '„' + R.eigen.name + '“' : sr.stufe === 'leicht' ? '„' + R.L.t + '“' : 'Welches Lied? Das verrate ich erst danach.';
  $('ton-song').innerHTML = srKopf() + '<div class="ton-merk">Wie geht’s weiter?</div><p class="gb-info">' + titel + '</p>'
    + '<div class="sr-platte" id="srPlatte" aria-hidden="true"><i></i></div>'
    + '<button type="button" class="gb-hoeren" id="srHoeren">▶︎ Anspielen</button>'
    + '<p class="gb-fein">Tippe Tasten zum Ausprobieren – dann bestätigen. Die Oktave ist egal.</p>'
    + gbTastatur(R.erlaubt) + '<button type="button" class="btn ton-gross" id="srOk" disabled>✓ Das ist der nächste Ton</button>'
    + (R.eigen ? '<p class="gb-fein">Der Ton wird automatisch erkannt. Bei vollen Mischungen kann das danebenliegen.</p>' : '') + '<div class="gb-urteil" id="srUrteil"></div>';
  let wahl = null;
  $('ton-song').querySelectorAll('.gb-taste').forEach((b) => b.addEventListener('click', () => {
    if (R.antwort !== null) return;
    wahl = Number(b.dataset.n);
    const m = R.prev + ((((wahl - R.prev) % 12) + 18) % 12) - 6;   // nächstgelegene Oktave zum letzten Ton
    srTaste(m);
    $('ton-song').querySelectorAll('.gb-taste').forEach((x) => x.classList.toggle('gewaehlt', x === b));
    $('srOk').disabled = false; $('srOk').textContent = '✓ ' + GB_NOTEN[wahl] + ' kommt als Nächstes';
  }));
  $('srOk').addEventListener('click', () => { if (wahl !== null) srWeiterAntwort(R, wahl); });
  const spiel = () => { $('srPlatte').classList.add('dreht'); srSpielen(R.vorher, () => { const p = $('srPlatte'); if (p) p.classList.remove('dreht'); }); };
  $('srHoeren').addEventListener('click', spiel);
  setTimeout(() => { if (sr && sr.runden[sr.i] === R && R.antwort === null && !srQuelle) spiel(); }, 300);
}
function srWeiterAntwort(R, wahl) {
  if (R.antwort !== null) return;
  R.antwort = wahl; srStopp();
  const ziel = Math.round(R.ziel), pc = ((ziel % 12) + 12) % 12, abst = Math.min((wahl - pc + 12) % 12, (pc - wahl + 12) % 12);
  // bei erkannten Tönen genau zwischen zwei Halbtönen zählen beide
  const zwischen = R.eigen && Math.abs(R.ziel - ziel) > 0.3, nachbar = ((ziel + Math.sign(R.ziel - ziel)) % 12 + 12) % 12;
  const ok = abst === 0 || (zwischen && wahl === nachbar);
  const p = ok ? 10 : abst === 1 ? 3 : 0;
  $('ton-song').querySelectorAll('.gb-taste').forEach((b) => { b.disabled = true; if (Number(b.dataset.n) === pc) b.classList.add('richtig'); });
  if (!ok) { const k = $('ton-song').querySelector('.gb-taste[data-n="' + wahl + '"]'); if (k) k.classList.add('falsch'); }
  $('srOk').hidden = true; $('srHoeren').hidden = true;
  const lied = R.eigen ? '' : ' · Lied: <b>' + R.L.t + '</b>' + (R.transp ? ' (in anderer Tonart)' : '');
  const text = (ok ? '✅ Richtig – als Nächstes kam ein <b>' : abst === 1 ? '🟡 Knapp – es kam ein <b>' : '❌ Es kam ein <b>') + GB_NOTEN[pc] + '</b>.' + (!ok ? ' Du hattest ' + GB_NOTEN[wahl] + ' (' + abst + ' Halbt' + (abst === 1 ? 'on' : 'öne') + ' daneben).' : '') + lied;
  srUrteil(R, p, text, '🔊 Stelle anhören', R.danach, R.eigen ? '<button type="button" class="btn secondary" id="srFalsch">🤷 Erkennung lag falsch – Runde streichen</button>' : '');
  srSpielen(R.danach);
}
function srRueckAnzeigen(R) {
  const max = { leicht: 3, mittel: 2, profi: 1 }[sr.stufe];
  $('ton-song').innerHTML = srKopf() + '<div class="ton-merk">⏪ Welches Lied läuft rückwärts?</div>'
    + '<div class="sr-platte rueck" id="srPlatte" aria-hidden="true"><i></i></div>'
    + '<button type="button" class="gb-hoeren" id="srHoeren">⏪ Rückwärts abspielen</button><p class="gb-fein" id="srRest"></p>'
    + '<div class="gb-optionen sr-optionen">' + R.optionen.map((t, i) => '<button type="button" class="gb-opt" data-o="' + i + '">' + t + '</button>').join('') + '</div><div class="gb-urteil" id="srUrteil"></div>';
  const rest = () => { $('srRest').textContent = R.gehoert >= max ? 'Nicht mehr anhörbar – jetzt raten!' : 'Noch ' + (max - R.gehoert) + '× anhören · weniger Hören = mehr Punkte'; $('srHoeren').disabled = R.gehoert >= max; };
  const spiel = () => { if (R.gehoert >= max || R.antwort !== null) return; R.gehoert++; rest(); $('srPlatte').classList.add('dreht'); srSpielen(R.klang, () => { const p = $('srPlatte'); if (p) p.classList.remove('dreht'); }); };
  $('srHoeren').addEventListener('click', spiel); rest();
  $('ton-song').querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => srRueckAntwort(R, R.optionen[Number(b.dataset.o)], b)));
  setTimeout(() => { if (sr && sr.runden[sr.i] === R && R.gehoert === 0) spiel(); }, 300);
}
function srRueckAntwort(R, wahl, knopf) {
  if (R.antwort !== null) return;
  R.antwort = wahl; srStopp();
  const ok = wahl === R.richtig, p = ok ? Math.max(4, 13 - 3 * Math.max(1, R.gehoert)) : 0;
  $('ton-song').querySelectorAll('[data-o]').forEach((b) => { b.disabled = true; if (R.optionen[Number(b.dataset.o)] === R.richtig) b.classList.add('richtig'); });
  if (!ok) knopf.classList.add('falsch');
  $('srHoeren').hidden = true; $('srRest').hidden = true;
  srUrteil(R, p, (ok ? '✅ Erkannt! ' + (R.gehoert <= 1 ? 'Nach einmal Hören.' : 'Nach ' + R.gehoert + '× Hören.') : '❌ Das war <b>' + R.richtig + '</b>.') + ' Jetzt vorwärts:', '🔊 Vorwärts anhören', R.vor, '');
  srSpielen(R.vor);
}
function srUrteil(R, p, text, hoerText, puffer, extra) {
  if (navigator.vibrate) navigator.vibrate(p >= 7 ? 15 : [40, 40, 40]);
  $('srUrteil').innerHTML = '<div class="gb-text">' + text + '</div><div class="gb-knoepfe"><button type="button" class="btn secondary" id="srNochmal">' + hoerText + '</button></div>' + extra
    + '<button type="button" class="btn ton-gross" id="srWeiter">' + (sr.i + 1 < sr.runden.length ? 'Weiter →' : 'Auswertung') + '</button>';
  $('srNochmal').addEventListener('click', () => srSpielen(puffer));
  $('srWeiter').addEventListener('click', () => srNaechste(p));
  if ($('srFalsch')) $('srFalsch').addEventListener('click', () => srNaechste(null));
}
// p = null: Runde zählt nicht (Erkennung falsch / kein Ton gefunden)
function srNaechste(p) {
  srStopp();
  if (p === null) sr.runden.splice(sr.i, 1); else { sr.punkte.push(p); sr.i++; }
  if (sr.i < sr.runden.length) srRunde(); else srEnde();
}
function srEnde() {
  srStopp();
  const M = SR_MODI[sr.modus], max = sr.runden.length * 10, roh = sr.punkte.reduce((a, b) => a + b, 0);
  const summe = max ? Math.round((roh / max) * 50 * 10) / 10 : 0, k = sr.modus + '-' + sr.stufe + (sr.quelle === 'eigen' ? '-eigen' : '');
  const stufeName = { leicht: 'Leicht', mittel: 'Mittel', profi: 'Profi' }[sr.stufe];
  let alt = null;
  if (max) {
    const st = tonStore(); st.song = st.song || {}; alt = st.song[k] != null ? st.song[k] : null; st.song[k] = Math.max(alt || 0, summe); saveJson(TON_KEY, st);
    if (typeof merkeVerlauf === 'function') merkeVerlauf('toene', summe, 50, 'Song-Rätsel: ' + M.name + ' · ' + stufeName + (sr.quelle === 'eigen' ? ' · eigene Songs' : ''), { stufe: sr.stufe === 'profi' ? 'schwer' : sr.stufe, modus: 'song-' + sr.modus, rekord: alt != null && summe > alt });
  }
  const urteil = !max ? 'Keine Runde konnte gewertet werden.' : summe >= 45 ? 'Super Gehör!' : summe >= 30 ? 'Gut gehört.' : 'Das ist schwer – nochmal?';
  $('ton-song').innerHTML = '<div class="ton-merk">' + M.emoji + ' Song-Rätsel · ' + M.name + '</div><div class="farb-summe">' + fmt(summe) + ' / 50</div>'
    + '<p class="gb-info">' + urteil + (alt != null && summe > alt ? ' 🏆 Neuer Bestwert!' : alt != null ? ' Bestwert: ' + fmt(alt) : '') + '</p>'
    + '<div class="gb-knoepfe"><button type="button" class="btn ton-gross" id="srNochmalSpiel">Nochmal</button><button type="button" class="btn secondary" id="srZurMenue">Zum Song-Rätsel</button></div>';
  $('srNochmalSpiel').addEventListener('click', () => srStart(sr.modus, sr.stufe, sr.quelle));
  $('srZurMenue').addEventListener('click', () => srMenue());
}

// ---------- Menü ----------
async function srMenue(modus) {
  srStopp();
  const alt = sr || {};
  sr = { modus: modus || alt.modus || 'weiter', stufe: alt.stufe || 'leicht', quelle: alt.quelle || 'lieder' };
  zeigeTonTeil('song');
  const songs = await srSongs(), best = srKey(), box = $('ton-song');
  if (sr.quelle === 'eigen' && !songs.length) sr.quelle = 'lieder';
  const stufenText = SR_STUFEN[sr.quelle === 'eigen' ? (sr.modus === 'weiter' ? 'eigenWeiter' : 'eigenRueck') : sr.modus];
  const zuWenig = sr.quelle === 'eigen' && sr.modus === 'rueck' && songs.length < 2;
  box.innerHTML = '<div class="ton-merk">🎵 Song-Rätsel</div><div class="gb-modi sr-modi">' + Object.entries(SR_MODI).map(([k, m]) => '<button type="button" class="gb-modus' + (k === sr.modus ? ' on' : '') + '" data-m="' + k + '"><span>' + m.emoji + '</span><b>' + m.name + '</b><small>' + m.text + '</small></button>').join('') + '</div>'
    + '<div class="sr-quelle"><button type="button" data-q="lieder" class="' + (sr.quelle === 'lieder' ? 'on' : '') + '">🎼 Bekannte Lieder<small>' + SR_LIEDER.length + ' Lieder, Klavier</small></button><button type="button" data-q="eigen" class="' + (sr.quelle === 'eigen' ? 'on' : '') + '"' + (songs.length ? '' : ' disabled') + '>📁 Meine Songs<small>' + (songs.length ? songs.length + ' Song' + (songs.length === 1 ? '' : 's') : 'erst hinzufügen ↓') + '</small></button></div>'
    + '<div class="farb-stufen ton-stufen">' + ['leicht', 'mittel', 'profi'].map((s) => { const b = best[sr.modus + '-' + s + (sr.quelle === 'eigen' ? '-eigen' : '')]; return '<button type="button" data-s="' + s + '" class="' + (s === sr.stufe ? 'on' : '') + '">' + { leicht: 'Leicht', mittel: 'Mittel', profi: 'Profi' }[s] + '<small>' + stufenText[s] + '</small><small>' + (b != null ? 'Bestwert ' + fmt(b) + ' / 50' : '') + '</small></button>'; }).join('') + '</div>'
    + (zuWenig ? '<p class="gb-fein">Für „Rückwärts“ mit eigenen Songs brauchst du mindestens 2 Songs.</p>' : '')
    + '<button type="button" class="btn ton-gross" id="srLos"' + (zuWenig ? ' disabled' : '') + '>Los geht’s 🎵</button>'
    + '<div class="sr-eigen"><h3>📁 Meine Songs</h3><p class="gb-fein">MP3, M4A, WAV … von deinem Gerät (z. B. aus der Dateien-App). Die Songs bleiben nur auf diesem Gerät – nichts wird hochgeladen. Gekaufte/gestreamte Titel aus Apple Music oder Spotify sind kopiergeschützt und lassen sich nicht auswählen.</p>'
    + '<label class="btn secondary sr-datei">➕ Songs hinzufügen<input type="file" id="srDatei" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac" multiple hidden></label><div class="gb-fein" id="srStatus"></div>'
    + '<ul class="sr-liste">' + songs.map((s) => '<li><span>🎵 ' + s.name.replace(/</g, '&lt;') + '</span><small>' + fmt(Math.round(s.groesse / 1e5) / 10) + ' MB</small><button type="button" data-weg="' + s.id + '" aria-label="Entfernen">✕</button></li>').join('') + '</ul></div>'
    + '<details class="sr-warum"><summary>Warum nicht direkt Spotify oder YouTube?</summary><p>Spotify gibt Apps seit November 2024 keine Hörproben mehr heraus; Abspielen geht nur mit Premium-Konto, Entwickler-Anmeldung und kopiergeschütztem Ton – den darf eine App weder rückwärts abspielen noch nach Tönen untersuchen. YouTube-Videos laufen nur in einem fremden Fenster, auf dessen Ton eine Web-App keinen Zugriff hat. Mit eigenen Dateien klappt beides.</p></details>'
    + '<button type="button" class="btn secondary" id="srZurueckIntro">← Zurück</button>';
  box.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => srMenue(b.dataset.m)));
  box.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { sr.quelle = b.dataset.q; srMenue(); }));
  box.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { sr.stufe = b.dataset.s; box.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b)); }));
  box.querySelectorAll('[data-weg]').forEach((b) => b.addEventListener('click', async () => { await srSongWeg(b.dataset.weg); delete srPuffer[b.dataset.weg]; srMenue(); }));
  $('srLos').addEventListener('click', () => srStart(sr.modus, sr.stufe, sr.quelle));
  $('srZurueckIntro').addEventListener('click', () => { srStopp(); sr = null; toeneIntro(); });
  $('srDatei').addEventListener('change', async (e) => {
    const dateien = [...e.target.files], status = $('srStatus');
    let ok = 0, fehl = [];
    for (const d of dateien) {
      status.textContent = 'Prüfe „' + d.name + '“ …';
      try { await srSongDazu(d); ok++; } catch (err) { fehl.push(d.name); }
    }
    if (ok) sr.quelle = 'eigen';
    await srMenue();
    $('srStatus').textContent = (ok ? '✅ ' + ok + ' Song' + (ok === 1 ? '' : 's') + ' hinzugefügt. ' : '') + (fehl.length ? '⚠️ Nicht abspielbar: ' + fehl.join(', ') : '');
  });
}
document.querySelectorAll('#ton-intro [data-song]').forEach((b) => b.addEventListener('click', () => { audio(); sr = null; srMenue(b.dataset.song); }));
