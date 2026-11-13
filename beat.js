// 🎸 Beat-Bahnen – Rhythmusspiel mit vier Bahnen: Noten fallen herunter, man tippt im richtigen Moment.
// Drei eigene, im Browser erzeugte Songs (Happy Hardcore, Chiptune, House) mit exakten Noten –
// oder ein eigener Song vom Handy: Die Noten werden offline aus den Einsätzen im Klang berechnet (Spectral Flux).
// Nutzt die Klangbausteine aus falten.js (ftAudio, ftKick, ftRauschen, ftSaw) und den Song-Speicher aus songs.js.
// Speicher: walquiz.beat.v1 = { runden, versatz (ms), stufe, best: { 'song|stufe': { punkte, sterne, genau } } }
const BB_KEY = 'walquiz.beat.v1';
const BB_FARBEN = ['#f472b6', '#a78bfa', '#22d3ee', '#a3e635'];
const BB_TASTEN = ['d', 'f', 'j', 'k'];
const BB_FENSTER = [[0.05, 'Perfekt', 300, 1], [0.1, 'Gut', 200, 0.7], [0.15, 'Okay', 100, 0.4]];
const BB_STUFEN = { leicht: { name: 'Leicht', reise: 1.75, abstand: 0.42 }, mittel: { name: 'Mittel', reise: 1.4, abstand: 0.26 }, schwer: { name: 'Schwer', reise: 1.1, abstand: 0.15 } };
const BB_VORLAUF = 2.2;   // Sekunden vom Start bis Songbeginn – so lange fallen die ersten Noten
const _ = null;
// Eigene Songs: bpm, Akkorde (je Takt einer, 4er-Schleife), Melodie (8 Takte × 8 Achtel, null = Pause), Stil
const BB_SONGS = [
  { id: 'neon', name: 'Neon-Sprint', emoji: '⚡', stil: 'hardcore', bpm: 175, info: 'Happy Hardcore · 175 BPM',
    akkorde: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
    melodie: [[72, _, 74, 76, _, 79, 76, _], [74, _, 71, 74, _, 79, 74, _], [72, _, 76, 81, _, 79, 76, _], [77, _, 76, 74, _, 72, 74, _],
      [79, _, 79, 81, 79, 76, 72, _], [74, _, 74, 76, 74, 71, 67, _], [72, 74, 76, _, 81, _, 79, 76], [77, _, 76, _, 74, _, 72, _]] },
  { id: 'pixel', name: 'Pixel-Party', emoji: '👾', stil: 'chip', bpm: 150, info: 'Chiptune · 150 BPM',
    akkorde: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],
    melodie: [[69, _, 72, 76, _, 72, 74, 72], [69, _, 65, 69, _, 72, _, 69], [67, _, 72, 76, 79, _, 76, _], [74, _, 71, 74, _, 79, _, 74],
      [76, _, 76, 77, 76, _, 72, _], [77, _, 77, 76, 74, _, 72, _], [76, _, 79, _, 84, _, 79, 76], [74, _, 71, _, 67, _, _, _]] },
  { id: 'sonne', name: 'Sonnenaufgang', emoji: '🌅', stil: 'house', bpm: 124, info: 'House · 124 BPM',
    akkorde: [[62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]],
    melodie: [[74, _, _, 77, _, _, 76, _], [74, _, _, 70, _, _, 72, _], [69, _, 72, _, 77, _, 76, _], [72, _, _, _, 67, _, _, _],
      [74, _, 77, _, 81, _, 79, 77], [77, _, 74, _, 70, _, 72, 74], [72, _, 77, _, 76, _, 72, _], [76, _, 74, _, 72, _, _, _]] },
];
// Aufbau: 2 Takte Einzählen, 3 × die 8-Takt-Melodie, 2 Takte Ausklang
const BB_TAKTE = 2 + 24 + 2;
let bb = null, bbRaf = 0, bbTakt = null;
const bbStore = () => { const s = loadJson(BB_KEY); s.runden = s.runden || 0; s.best = s.best || {}; if (typeof s.versatz !== 'number') s.versatz = 0; s.stufe = BB_STUFEN[s.stufe] ? s.stufe : 'mittel'; return s; };

// ---------- Noten der eigenen Songs ----------
function bbNoten(song, stufe) {
  // Bahn je Tonhöhe: Grenzen so, dass jede Bahn etwa gleich viele Noten bekommt (gleiche Töne → gleiche Bahn)
  const alle = song.melodie.flat().filter((x) => x != null).sort((a, b) => a - b), ton = [...new Set(alle)];
  const grenzen = [1, 2, 3].map((k) => { let best = 0, fehl = 1e9; ton.forEach((t, i) => { const anteil = alle.filter((x) => x < t).length / alle.length, d = Math.abs(anteil - k / 4); if (d < fehl && i > 0) { fehl = d; best = t; } }); return best; });
  const bahnVon = (m) => grenzen.filter((g) => m >= g).length;
  const s16 = 60 / song.bpm / 4, noten = [];
  for (let durchgang = 0; durchgang < 3; durchgang++) {
    for (let t8 = 0; t8 < 8; t8++) {
      const takt = 2 + durchgang * 8 + t8, zeile = song.melodie[t8];
      zeile.forEach((m, a) => {
        const zeit = (takt * 16 + a * 2) * s16;
        if (m != null) {
          const imChart = stufe !== 'leicht' || a % 2 === 0;
          const hoch = durchgang === 1 && t8 >= 4 ? 12 : 0;   // zweiter Durchgang: zweite Hälfte eine Oktave höher
          noten.push({ t: zeit, bahn: bahnVon(m), ton: m + hoch, chart: imChart });
          if (stufe === 'schwer' && a === 0 && durchgang > 0) noten.push({ t: zeit, bahn: bahnVon(m) >= 2 ? 0 : 3, ton: null, chart: true });   // Doppelnote auf der Eins
        } else if (stufe === 'schwer' && a % 2 === 0 && durchgang > 0) {
          noten.push({ t: zeit, bahn: (a / 2) % 2 ? 3 : 0, ton: null, chart: true });   // Kick in Melodie-Pausen
        }
      });
    }
  }
  return noten.sort((a, b) => a.t - b.t || a.bahn - b.bahn);
}
// Zusätzliche Klangfarben: Rechteck (Chiptune), Dreieck, Sinus
function bbTon(A, t, midi, dauer, typ, laut, ziel = A.master) {
  const c = A.c, o = c.createOscillator(), g = c.createGain();
  o.type = typ; o.frequency.value = ftHz(midi);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, t + dauer);
  o.connect(g).connect(ziel); o.start(t); o.stop(t + dauer + 0.03);
}
function bbBass(A, t, midi, dauer, laut, typ = 'sawtooth', hell = 420) {
  const c = A.c, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = typ; o.frequency.value = ftHz(midi); f.type = 'lowpass'; f.frequency.value = hell;
  g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.001, t + dauer);
  o.connect(f).connect(g).connect(A.master); o.start(t); o.stop(t + dauer + 0.02);
}
// Melodieton des Songs (beim Treffer oder automatisch, wenn er nicht im Chart ist)
function bbMelodie(A, t, song, midi, laut = 1) {
  if (song.stil === 'hardcore') ftSaw(A, t, [midi], 0.2, 0.09 * laut, 4200);
  else if (song.stil === 'chip') { bbTon(A, t, midi, 0.16, 'square', 0.07 * laut); bbTon(A, t + 0.012, midi + 12, 0.08, 'square', 0.025 * laut); }
  else { bbTon(A, t, midi, 0.45, 'triangle', 0.2 * laut); bbTon(A, t, midi + 12, 0.25, 'sine', 0.06 * laut); }
}
// Begleitung je Sechzehntel s
function bbSchritt(A, song, s, t) {
  const im = s % 16, takt = Math.floor(s / 16), ak = song.akkorde[takt % 4], s16 = 60 / song.bpm / 4;
  if (takt >= BB_TAKTE) return;
  const aus = takt >= BB_TAKTE - 2, intro = takt < 2;
  if (song.stil === 'hardcore') {
    if (im % 4 === 0 && !(aus && takt === BB_TAKTE - 1 && im > 0)) ftKick(A, t, 1);
    if (im % 4 === 2) { ftRauschen(A, t, 0.09, 7000, 0.16); if (!intro) bbBass(A, t, ak[0] - 24, s16 * 1.9, 0.33); }
    if (!intro && !aus && (im === 4 || im === 12)) ftRauschen(A, t, 0.16, 1500, 0.26);
    if (!intro && [0, 3, 6, 10].includes(im)) ftSaw(A, t, ak.map((x) => x + 12), 0.12, 0.035, 2400);
  } else if (song.stil === 'chip') {
    if (im % 4 === 0) ftKick(A, t, 0.7);
    if (im % 2 === 1) ftRauschen(A, t, 0.04, 9000, 0.08);
    if (!intro && (im === 4 || im === 12)) ftRauschen(A, t, 0.1, 3000, 0.2);
    if (im % 4 === 0) bbBass(A, t, ak[0] - 12, s16 * 3.5, 0.22, 'triangle', 2000);
    if (!intro && !aus) bbTon(A, t, ak[im % 3] + 12, s16 * 0.8, 'square', 0.022);   // Arpeggio
  } else {
    if (im % 4 === 0) ftKick(A, t, 0.95);
    if (im % 4 === 2) ftRauschen(A, t, 0.13, 8000, 0.12);
    if (!intro && (im === 4 || im === 12)) ftRauschen(A, t, 0.14, 1200, 0.2);
    if (!intro && (im === 2 || im === 7 || im === 10)) ak.forEach((n) => bbTon(A, t, n, 0.22, 'triangle', 0.05));
    if (im === 0 || im === 6 || im === 11) bbBass(A, t, ak[0] - 24, s16 * 2.5, 0.35, 'sawtooth', 300);
  }
}

// ---------- Eigene Songs: Einsätze erkennen (Spectral Flux) ----------
function bbFFT(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const w = -2 * Math.PI / len, wr = Math.cos(w), wi = Math.sin(w);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}
// x: Mono-Samples, rate: Abtastrate → [{ t, staerke, hell }] (hell = Schwerpunkt des Spektrums in Hz)
function bbEinsaetze(x, rate) {
  const N = 512, hop = 256, frames = Math.max(0, Math.floor((x.length - N) / hop)), K = N / 2;
  const fenster = new Float32Array(N); for (let i = 0; i < N; i++) fenster[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  const flux = new Float32Array(frames), hell = new Float32Array(frames);
  let alt = new Float32Array(K), neu = new Float32Array(K);
  const re = new Float32Array(N), im = new Float32Array(N);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) { re[i] = x[f * hop + i] * fenster[i]; im[i] = 0; }
    bbFFT(re, im);
    let fl = 0, sw = 0, sm = 0;
    for (let k = 1; k < K; k++) {
      const m = Math.hypot(re[k], im[k]); neu[k] = Math.log1p(20 * m);
      const d = neu[k] - alt[k]; if (d > 0) fl += d;
      sw += m * k; sm += m;
    }
    flux[f] = f ? fl : 0; hell[f] = sm > 1e-9 ? (sw / sm) * rate / N : 0;
    [alt, neu] = [neu, alt];
  }
  // Schwelle: gleitender Mittelwert ± 0,5 s plus ein Anteil der Gesamtstreuung
  let mw = 0; for (let f = 0; f < frames; f++) mw += flux[f]; mw /= Math.max(1, frames);
  let sd = 0; for (let f = 0; f < frames; f++) sd += (flux[f] - mw) ** 2; sd = Math.sqrt(sd / Math.max(1, frames));
  const R = Math.round(0.5 * rate / hop), pref = new Float64Array(frames + 1);
  for (let f = 0; f < frames; f++) pref[f + 1] = pref[f] + flux[f];
  const out = [];
  for (let f = 2; f < frames - 2; f++) {
    const a = Math.max(0, f - R), b = Math.min(frames, f + R + 1), lokal = (pref[b] - pref[a]) / (b - a);
    const schwelle = lokal * 1.35 + sd * 0.35;
    if (flux[f] <= schwelle) continue;
    let spitze = true; for (let k = -3; k <= 3; k++) if (k && f + k >= 0 && f + k < frames && flux[f + k] > flux[f]) { spitze = false; break; }
    if (!spitze) continue;
    out.push({ t: (f * hop + N * 0.55) / rate, staerke: (flux[f] - lokal) / (sd || 1), hell: hell[f] });
  }
  return out;
}
// Aus den Einsätzen ein Chart: stärkste zuerst, Mindestabstand je Stufe, Bahn nach Klanghelligkeit (Quartile)
function bbChartAusEinsaetzen(ein, stufe) {
  const gap = BB_STUFEN[stufe].abstand, gewaehlt = [];
  [...ein].sort((a, b) => b.staerke - a.staerke).forEach((e) => { if (gewaehlt.every((g) => Math.abs(g.t - e.t) >= gap)) gewaehlt.push(e); });
  gewaehlt.sort((a, b) => a.t - b.t);
  const h = gewaehlt.map((e) => e.hell).sort((a, b) => a - b), q = [0.25, 0.5, 0.75].map((p) => h[Math.floor(p * (h.length - 1))] || 0);
  let letzte = -1;
  return gewaehlt.map((e) => {
    let bahn = q.filter((g) => e.hell > g).length;
    if (bahn === letzte && e.t - (gewaehlt[gewaehlt.indexOf(e) - 1] || { t: -9 }).t < 0.2) bahn = (bahn + 2) % 4;   // schnelle Folgen nicht auf eine Bahn
    letzte = bahn;
    return { t: e.t, bahn, ton: null, chart: true };
  });
}
const bbCharts = {};   // 'id|stufe' → Noten (nur in dieser Sitzung)
async function bbEigenesLaden(id, stufe) {
  const buf = await srSongPuffer(id);
  const schluessel = id + '|' + stufe;
  if (!bbCharts[schluessel]) {
    if (!bbCharts[id]) { const { x, rate } = srMono(buf, 11025); const max = Math.min(x.length, Math.round(rate * 360)); bbCharts[id] = bbEinsaetze(x.subarray(0, max), rate); }
    bbCharts[schluessel] = bbChartAusEinsaetzen(bbCharts[id], stufe);
  }
  return { buf, noten: bbCharts[schluessel] };
}

// ---------- Oberfläche ----------
function bbOeffnen() { show('beat', '🎸 Beat-Bahnen'); bbIntro(); }
async function bbIntro() {
  bbStopp(); bb = null;
  const st = bbStore();
  const sterne = (k) => { const b = st.best[k]; return b ? '★'.repeat(b.sterne) + '☆'.repeat(3 - b.sterne) : ''; };
  const eigene = typeof srSongs === 'function' ? await srSongs() : [];
  if (!$('screen-beat').classList.contains('active')) return;
  $('bbInhalt').innerHTML = '<div class="ft-intro bb-intro"><div class="bb-logo" aria-hidden="true"><i></i><i></i><i></i><i></i></div><h2 class="bb-h">Beat-Bahnen</h2>'
    + '<p>Die Noten fallen herunter – tippe die Bahn genau dann, wenn die Note den Kreis unten trifft. Am Rechner gehen auch die Tasten <b>D F J K</b>.</p>'
    + '<div class="bb-stufen" role="radiogroup" aria-label="Schwierigkeit">' + Object.entries(BB_STUFEN).map(([k, s]) => '<button type="button" class="bb-stufe' + (k === st.stufe ? ' an' : '') + '" data-stufe="' + k + '" role="radio" aria-checked="' + (k === st.stufe) + '">' + s.name + '</button>').join('') + '</div>'
    + '<button type="button" class="bb-song bb-live" id="bbLive"><span class="bb-se">🎤</span><span class="bb-st"><b>Live – zu jeder Musik</b><small>Spotify, Radio, Lautsprecher: Das Mikro hört mit und findet den Beat</small></span><span class="bb-sterne">' + sterne('live|' + st.stufe) + '</span></button>'
    + '<div class="bb-liste">' + BB_SONGS.map((s) => '<button type="button" class="bb-song" data-song="' + s.id + '"><span class="bb-se">' + s.emoji + '</span><span class="bb-st"><b>' + s.name + '</b><small>' + s.info + '</small></span><span class="bb-sterne">' + sterne(s.id + '|' + st.stufe) + '</span></button>').join('')
    + (eigene.length ? '<h3 class="bb-zwischen">Deine Songs</h3>' + eigene.map((s) => '<button type="button" class="bb-song bb-eigen" data-eigen="' + s.id + '"><span class="bb-se">🎵</span><span class="bb-st"><b>' + s.name.replace(/[<>&]/g, '') + '</b><small>Noten werden aus dem Klang berechnet</small></span><span class="bb-sterne">' + sterne(s.id + '|' + st.stufe) + '</span></button>').join('') : '')
    + '</div><label class="btn secondary bb-datei">＋ Eigenen Song hinzufügen (MP3/M4A)<input type="file" id="bbDatei" accept="audio/*" hidden></label>'
    + '<p class="ft-klein">Eigene Songs bleiben auf diesem Gerät, die Noten werden offline berechnet – nichts wird hochgeladen. Für Spotify-Songs: den Live-Modus nehmen – Spotify spielt, das Mikrofon hört mit. Gehört wird nur hier auf dem Gerät, nichts wird aufgenommen oder gesendet.</p>'
    + '<details class="bb-versatz"><summary>Verzögerung ausgleichen (Bluetooth-Kopfhörer)</summary><p class="ft-klein">Wenn deine Treffer immer „zu früh“ oder „zu spät“ sind, hier verschieben.</p><div class="ft-schaetzen"><input type="range" id="bbVersatz" min="-250" max="250" step="10" value="' + st.versatz + '" aria-label="Verzögerung in Millisekunden"><output id="bbVersatzW"></output></div></details>'
    + (st.runden ? '<p class="ft-klein">Bisher gespielt: ' + st.runden + '×</p>' : '') + '</div>';
  const vw = () => { $('bbVersatzW').textContent = (st.versatz > 0 ? '+' : '') + st.versatz + ' ms'; };
  vw();
  $('bbVersatz').addEventListener('input', (e) => { st.versatz = +e.target.value; vw(); saveJson(BB_KEY, st); });
  $('bbInhalt').querySelectorAll('[data-stufe]').forEach((b) => b.addEventListener('click', () => { st.stufe = b.dataset.stufe; saveJson(BB_KEY, st); bbIntro(); }));
  $('bbLive').addEventListener('click', () => { ftAudio(); bbLiveIntro(); });
  $('bbInhalt').querySelectorAll('[data-song]').forEach((b) => b.addEventListener('click', () => { ftAudio(); bbStart({ song: BB_SONGS.find((s) => s.id === b.dataset.song) }); }));
  $('bbInhalt').querySelectorAll('[data-eigen]').forEach((b) => b.addEventListener('click', async () => {
    ftAudio();
    b.querySelector('small').textContent = 'Noten werden berechnet …'; b.disabled = true;
    try { const e = await bbEigenesLaden(b.dataset.eigen, st.stufe); if (!e.noten.length) throw new Error('keine Einsätze'); bbStart({ eigen: { id: b.dataset.eigen, name: b.querySelector('b').textContent, buf: e.buf }, noten: e.noten }); }
    catch (err) { b.disabled = false; b.querySelector('small').textContent = 'Konnte nicht gelesen werden – anderer Song?'; }
  }));
  $('bbDatei').addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try { await srSongDazu(f); bbIntro(); } catch (err) { alert('Diese Datei kann der Browser leider nicht abspielen.'); }
  });
}
function bbStart(was) {
  const st = bbStore(), stufe = st.stufe, A = ftAudio(); if (!A) return;
  const song = was.song || null, noten = (was.noten || bbNoten(song, stufe)).map((n) => ({ ...n, urteil: null }));
  bb = { song, eigen: was.eigen || null, live: null, stufe, noten, A, punkte: 0, combo: 0, maxCombo: 0, zaehler: [0, 0, 0, 0], fertig: false, effekte: [], gedrueckt: [0, 0, 0, 0], versatz: st.versatz / 1000 };
  const dauer = was.live ? Infinity : song ? BB_TAKTE * 16 * 60 / song.bpm / 4 : Math.min(bb.eigen.buf.duration, noten[noten.length - 1].t + 2.5);
  bb.dauer = dauer;
  const titel = was.live ? '🎤 Live' : song ? song.emoji + ' ' + song.name : '🎵 ' + bb.eigen.name;
  $('bbInhalt').innerHTML = '<div class="bb-kopf"><span class="bb-titel">' + titel + ' · ' + BB_STUFEN[stufe].name + '</span><span class="bb-punkte" id="bbPunkte">0</span></div>'
    + '<div class="bb-fort"' + (was.live ? ' hidden' : '') + '><b id="bbFort"></b></div><div class="bb-combo" id="bbCombo"></div>'
    + '<canvas id="bbBild" class="bb-bild" aria-label="Spielfeld mit vier Bahnen"></canvas>'
    + '<div class="bb-unten"><button type="button" class="ft-ton" id="bbTon" aria-label="Ton an/aus">' + (A.stumm ? '🔇' : '🔊') + '</button><button type="button" class="btn secondary" id="bbAbbruch">Song abbrechen</button></div>';
  const cv = $('bbBild'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 360, H = Math.max(340, Math.min(window.innerHeight - 190, 720));
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  Object.assign(bb, { ctx: cv.getContext('2d'), W, H, dpr });
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); bbTippen(Math.max(0, Math.min(3, Math.floor((e.clientX - r.left) / r.width * 4)))); });
  $('bbTon').addEventListener('click', () => { A.stumm = !A.stumm; $('bbTon').textContent = A.stumm ? '🔇' : '🔊'; if (bb && bb.quelle) bb.quelleGain.gain.value = A.stumm ? 0 : 1; });
  $('bbAbbruch').addEventListener('click', () => { if (bb && bb.live && bb.noten.some((n) => n.urteil)) bbEnde(); else bbIntro(); });
  if (was.live) { $('bbAbbruch').textContent = 'Fertig'; $('bbTon').remove(); $('bbAbbruch').parentNode.classList.add('bb-unten-live'); }
  // Startzeit im Audio-Takt; die Ausgabeverzögerung des Geräts wird abgezogen
  bb.start = A.c.currentTime + BB_VORLAUF;
  bb.lat = (A.c.outputLatency || A.c.baseLatency || 0);
  if (was.live) {
    bb.start = A.c.currentTime; bbLiveVerbinden(was.live);
  } else if (bb.eigen) {
    const q = A.c.createBufferSource(), g = A.c.createGain(); q.buffer = bb.eigen.buf; g.gain.value = A.stumm ? 0 : 1;
    q.connect(g).connect(A.master); q.start(bb.start); bb.quelle = q; bb.quelleGain = g;
  } else {
    bb.schritt = 0; const s16 = 60 / song.bpm / 4;
    const auto = new Map(); noten.forEach((n) => { if (n.ton != null && !n.chart) auto.set(Math.round(n.t / s16), n.ton); });
    bb.auto = auto;
    bbTakt = setInterval(() => {
      if (!bb || bb.fertig) return;
      while (bb.start + bb.schritt * s16 < A.c.currentTime + 0.15 && bb.schritt < BB_TAKTE * 16) {
        const t = bb.start + bb.schritt * s16;
        if (!A.stumm) { bbSchritt(A, song, bb.schritt, t); if (auto.has(bb.schritt)) bbMelodie(A, t, song, auto.get(bb.schritt), 0.8); }
        bb.schritt++;
      }
    }, 25);
  }
  bbAnzeige(); cancelAnimationFrame(bbRaf); bbRaf = requestAnimationFrame(bbLauf);
}
// Songzeit in Sekunden (0 = Songbeginn), so wie man sie gerade hört
function bbJetzt() {
  const A = bb.A;
  if (bb.live) return A.c.currentTime - bb.start - bb.versatz;
  if (A.c.getOutputTimestamp) {
    const ts = A.c.getOutputTimestamp();
    if (ts.contextTime > 0 && ts.performanceTime > 0) return ts.contextTime + (performance.now() - ts.performanceTime) / 1000 - bb.start - bb.versatz;
  }
  return A.c.currentTime - bb.lat - bb.start - bb.versatz;
}
function bbUrteil(dt) { const a = Math.abs(dt); return BB_FENSTER.findIndex((f) => a <= f[0]); }
function bbTippen(bahn, zeit) {
  if (!bb || bb.fertig) return;
  const jetzt = zeit != null ? zeit : bbJetzt();
  bb.gedrueckt[bahn] = performance.now();
  let beste = null;
  for (const n of bb.noten) {
    if (n.t > jetzt + 0.16) break;
    if (n.chart && !n.urteil && n.bahn === bahn && Math.abs(n.t - jetzt) <= 0.15 && (!beste || Math.abs(n.t - jetzt) < Math.abs(beste.t - jetzt))) beste = n;
  }
  if (!beste) return;   // daneben tippen kostet nichts – nur verpasste Noten brechen die Serie
  const u = bbUrteil(beste.t - jetzt);
  beste.urteil = BB_FENSTER[u][1]; beste.dt = beste.t - jetzt;
  bb.zaehler[u]++; bb.combo++; bb.maxCombo = Math.max(bb.maxCombo, bb.combo);
  bb.punkte += BB_FENSTER[u][2] * bbFaktor();
  if (bb.song && beste.ton != null && !bb.A.stumm) bbMelodie(bb.A, bb.A.c.currentTime + 0.005, bb.song, beste.ton);
  bb.effekte.push({ bahn, t0: performance.now(), text: BB_FENSTER[u][1], farbe: u === 0 ? '#fde68a' : u === 1 ? '#6ee7b7' : '#93c5fd', frueh: u > 0 ? (beste.dt > 0 ? 'früh' : 'spät') : '' });
  bbAnzeige();
}
const bbZahl = (n) => Math.round(n).toLocaleString('de-DE');
const bbFaktor = () => Math.min(4, 1 + Math.floor(bb.combo / 10));
function bbAnzeige() {
  $('bbPunkte').textContent = bbZahl(bb.punkte);
  $('bbCombo').innerHTML = bb.combo >= 5 ? bb.combo + ' in Folge' + (bbFaktor() > 1 ? ' · <b>×' + bbFaktor() + '</b>' : '') : '';
}
function bbLauf() {
  if (!bb || !bb.ctx) return;
  const jetzt = bbJetzt();
  // verpasste Noten
  let neuVerpasst = false;
  for (const n of bb.noten) { if (n.t > jetzt - 0.15) break; if (n.chart && !n.urteil) { n.urteil = 'Verpasst'; bb.zaehler[3]++; bb.combo = 0; neuVerpasst = true; } }
  if (neuVerpasst) bbAnzeige();
  if (!bb.live) $('bbFort').style.width = Math.max(0, Math.min(100, jetzt / bb.dauer * 100)) + '%';
  else if (bb.live.stilleSeit && bb.A.c.currentTime - bb.live.stilleSeit > 8 && bb.noten.some((n) => n.urteil) && !bb.fertig) { bbEnde(); return; }
  bbZeichnen(jetzt);
  if (jetzt > bb.dauer + 0.3 && !bb.fertig) { bbEnde(); return; }
  bbRaf = requestAnimationFrame(bbLauf);
}
function bbZeichnen(jetzt) {
  const { ctx: c, W, H, dpr } = bb, reise = BB_STUFEN[bb.stufe].reise, yH = H * 0.86, bw = W / 4, now = performance.now();
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0b25'); g.addColorStop(1, '#1d1240'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // Perspektive: oben schmaler; x(bahnMitte, p) mit p = 0 (oben) … 1 (Trefferlinie)
  const sk = (p) => 0.42 + 0.58 * p, xb = (b, p) => W / 2 + ((b + 0.5) * bw - W / 2) * sk(p);
  for (let b = 0; b <= 4; b++) { c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; c.beginPath(); c.moveTo(W / 2 + (b * bw - W / 2) * sk(0), 0); c.lineTo(W / 2 + (b * bw - W / 2) * sk(1.16), H); c.stroke(); }
  // Taktstriche (nur eingebaute Songs)
  if (bb.song) {
    const takt = 240 / bb.song.bpm;
    for (let k = Math.ceil(jetzt / takt); k * takt < jetzt + reise; k++) { const p = 1 - (k * takt - jetzt) / reise; if (p < 0) continue; c.strokeStyle = 'rgba(255,255,255,' + (0.05 + 0.08 * p) + ')'; c.beginPath(); c.moveTo(xb(-0.5, p), yH * p); c.lineTo(xb(3.5, p), yH * p); c.stroke(); }
  }
  // Bahnen leuchten kurz beim Tippen
  for (let b = 0; b < 4; b++) {
    const a = Math.max(0, 1 - (now - bb.gedrueckt[b]) / 180);
    if (a > 0) { const gr = c.createLinearGradient(0, yH, 0, yH * 0.4); gr.addColorStop(0, BB_FARBEN[b] + '66'); gr.addColorStop(1, BB_FARBEN[b] + '00'); c.globalAlpha = a; c.fillStyle = gr; c.fillRect(xb(b, 1) - bw * 0.5, yH * 0.4, bw, yH * 0.6); c.globalAlpha = 1; }
  }
  // Zielkreise
  for (let b = 0; b < 4; b++) {
    const x = xb(b, 1), r = bw * 0.34, a = Math.max(0, 1 - (now - bb.gedrueckt[b]) / 160);
    c.lineWidth = 4; c.strokeStyle = BB_FARBEN[b]; c.globalAlpha = 0.55 + 0.45 * a; c.beginPath(); c.arc(x, yH, r, 0, 7); c.stroke();
    c.fillStyle = BB_FARBEN[b] + (a > 0 ? 'aa' : '22'); c.fill(); c.globalAlpha = 1;
    c.font = '600 11px system-ui'; c.fillStyle = 'rgba(255,255,255,.35)'; c.textAlign = 'center'; c.fillText(BB_TASTEN[b].toUpperCase(), x, yH + r + 16);
  }
  // Noten
  for (const n of bb.noten) {
    if (!n.chart) continue;
    const d = n.t - jetzt;
    if (d > reise) break;
    if (n.urteil && n.urteil !== 'Verpasst') continue;
    const p = 1 - d / reise; if (p < 0) continue;
    const y = yH * p; if (y > H + 30) continue;
    const x = xb(n.bahn, p), r = bw * 0.3 * sk(p);
    c.globalAlpha = n.urteil ? 0.25 : 1;
    c.fillStyle = n.urteil ? '#64748b' : BB_FARBEN[n.bahn];
    c.shadowColor = BB_FARBEN[n.bahn]; c.shadowBlur = n.urteil ? 0 : 14;
    c.beginPath(); c.ellipse(x, y, r, r * 0.62, 0, 0, 7); c.fill();
    c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(x, y - r * 0.12, r * 0.42, r * 0.22, 0, 0, 7); c.fill();
    c.globalAlpha = 1;
  }
  // Treffer-Ringe und Urteile (sanft, kein Blitzen)
  bb.effekte = bb.effekte.filter((e) => now - e.t0 < 600);
  for (const e of bb.effekte) {
    const k = (now - e.t0) / 600, x = xb(e.bahn, 1);
    c.globalAlpha = 1 - k; c.strokeStyle = e.farbe; c.lineWidth = 3; c.beginPath(); c.arc(x, yH, bw * (0.34 + 0.3 * k), 0, 7); c.stroke();
    c.fillStyle = e.farbe; c.font = '800 15px system-ui'; c.textAlign = 'center'; c.fillText(e.text, x, yH - bw * 0.5 - 22 * k);
    if (e.frueh) { c.font = '600 11px system-ui'; c.fillText(e.frueh, x, yH - bw * 0.5 - 22 * k + 14); }
    c.globalAlpha = 1;
  }
  if (bb.live) { bbLiveStatus(c, W, H, jetzt, reise); return; }
  // Countdown bis die erste Note oben erscheint
  const erste = bb.noten.find((n) => n.chart), bis = erste ? erste.t - reise - jetzt : 0;
  if (bis > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(0.85, bis * 2) + ')'; c.font = '800 46px system-ui'; c.textAlign = 'center'; c.fillText(String(Math.ceil(bis)), W / 2, H * 0.4); c.font = '600 14px system-ui'; c.fillText('Gleich geht’s los', W / 2, H * 0.4 + 30); }
}
function bbStopp() {
  cancelAnimationFrame(bbRaf); clearInterval(bbTakt); bbTakt = null;
  if (bb && bb.live) bbLiveTrennen();
  if (bb && bb.quelle) { try { bb.quelle.stop(); } catch (e) { /* schon aus */ } bb.quelle = null; }
}
function bbErgebnis() {
  const z = bb.zaehler, ges = bb.noten.filter((n) => n.chart).length || 1;
  const genau = (z[0] + z[1] * 0.7 + z[2] * 0.4) / ges;
  return { genau, sterne: genau >= 0.93 ? 3 : genau >= 0.8 ? 2 : genau >= 0.6 ? 1 : 0, ges };
}
function bbEnde() {
  bb.fertig = true; bbStopp();
  if (bb.live) bb.noten = bb.noten.filter((n) => n.urteil);   // noch nicht erreichte Noten zählen nicht
  const { genau, sterne, ges } = bbErgebnis(), z = bb.zaehler;
  const id = bb.live ? 'live' : bb.song ? bb.song.id : bb.eigen.id, k = id + '|' + bb.stufe, st = bbStore(), alt = st.best[k];
  const rekord = !alt || bb.punkte > alt.punkte;
  st.runden++; if (rekord) st.best[k] = { punkte: bb.punkte, sterne: Math.max(sterne, alt ? alt.sterne : 0), genau: Math.round(genau * 1000) / 10 };
  else st.best[k].sterne = Math.max(alt.sterne, sterne);
  saveJson(BB_KEY, st);
  const name = bb.live ? 'Live' + (bb.live.periode ? ' ' + Math.round(60 / bb.live.periode) + ' BPM' : '') : bb.song ? bb.song.name : bb.eigen.name;
  if (typeof merkeVerlauf === 'function') merkeVerlauf('beat', Math.round(genau * 100), 100, name.slice(0, 30) + ' · ' + BB_STUFEN[bb.stufe].name + ' · ' + '★'.repeat(sterne), { stufe: bb.stufe, punkte: bb.punkte, combo: bb.maxCombo });
  if (sterne >= 2 && typeof konfetti === 'function') konfetti(30, ['🎸', '🎵', '✨', '⭐']);
  const d = document.createElement('div'); d.className = 'ft-ergebnis';
  d.innerHTML = '<div class="ft-karte bb-karte"><div class="bb-sterne-gross">' + '★'.repeat(sterne) + '<span>' + '★'.repeat(3 - sterne) + '</span></div><h3>' + (sterne === 3 ? 'Wahnsinn!' : sterne === 2 ? 'Stark gespielt!' : sterne === 1 ? 'Geschafft!' : 'Weiter üben!') + '</h3>'
    + '<p class="ft-gross"><b>' + bbZahl(bb.punkte) + '</b> Punkte' + (rekord && alt ? ' · neuer Rekord!' : '') + '</p>'
    + '<p>Genauigkeit <b>' + fmt(Math.round(genau * 1000) / 10) + ' %</b> · längste Serie ' + bb.maxCombo + ' von ' + ges + '</p>'
    + '<div class="bb-zaehler"><span>Perfekt <b>' + z[0] + '</b></span><span>Gut <b>' + z[1] + '</b></span><span>Okay <b>' + z[2] + '</b></span><span>Verpasst <b>' + z[3] + '</b></span></div>'
    + bbVersatzTipp()
    + '<div class="ft-karte-knoepfe"><button type="button" class="btn ft-los bb-los" id="bbNochmal">Nochmal</button><button type="button" class="btn secondary" id="bbAndere">Anderer Song</button></div></div>';
  $('bbInhalt').appendChild(d);
  const nochmal = { song: bb.song, eigen: bb.eigen, noten: bb.eigen ? bbCharts[k] : null }, warLive = !!bb.live;
  $('bbNochmal').addEventListener('click', () => { d.remove(); if (warLive) bbLiveStarten(); else bbStart(nochmal); });
  $('bbAndere').addEventListener('click', () => bbIntro());
}
// Wenn die Treffer im Mittel deutlich zu früh/spät waren: Hinweis auf den Verzögerungs-Regler
function bbVersatzTipp() {
  const l = bb.noten.filter((n) => n.dt != null).map((n) => n.dt);
  if (l.length < 12) return '';
  const m = l.reduce((a, b) => a + b, 0) / l.length;
  if (Math.abs(m) < 0.035) return '';
  return '<p class="ft-klein">Du warst im Schnitt ' + Math.round(Math.abs(m) * 1000) + ' ms ' + (m > 0 ? 'zu früh' : 'zu spät') + '. Liegt es an Bluetooth-Kopfhörern? Unter „Verzögerung ausgleichen“ ' + (m > 0 ? 'nach links' : 'nach rechts') + ' schieben.</p>';
}
// ---------- 🎤 Live-Modus: Musik von außen (Spotify, Radio …) übers Mikrofon, Beat finden, Noten vorhersagen ----------
// Ablauf: Analyser (1024er-FFT) wird alle 10 ms gelesen → Spectral Flux in 10-ms-Fächern → alle 250 ms Tempo per
// Autokorrelation der letzten 8 s (70–190 BPM, Vorliebe um 120) und Phase per Kamm-Summe → Noten auf die kommenden Schläge.
// Nichts wird aufgenommen oder gespeichert, das Mikrofonsignal geht nur in den Analyser.
const BB_LIVE_MUSTER = [[0, 1, 2, 3], [3, 2, 1, 0], [0, 2, 1, 3], [1, 2, 1, 2], [0, 3, 0, 3], [2, 1, 2, 1], [0, 1, 3, 2], [3, 1, 2, 0], [1, 0, 2, 3], [2, 3, 1, 0]];
const BB_LIVE_R = 1600;   // Ringpuffer: 16 s in 10-ms-Fächern
function bbLiveIntro() {
  bbStopp(); bb = null;
  $('bbInhalt').innerHTML = '<div class="ft-intro bb-intro"><div class="bb-logo" aria-hidden="true"><i></i><i></i><i></i><i></i></div><h2 class="bb-h">Live-Modus</h2>'
    + '<ol class="bb-schritte"><li>Starte einen Song in <b>Spotify</b> (oder Radio, YouTube, Plattenspieler …).</li><li>Komm hierher zurück und tippe <b>Mithören</b>.</li><li>Nach ein paar Sekunden hat das Spiel den Beat – dann fallen die Noten genau auf die Schläge.</li></ol>'
    + '<p class="ft-klein">Die Musik muss aus einem <b>Lautsprecher</b> kommen – mit Kopfhörern hört das Mikro nichts. Am besten klappt es mit klarem Beat (Pop, Dance, Rock). Gehört wird nur hier auf dem Gerät: nichts wird aufgenommen, gespeichert oder gesendet.</p>'
    + '<a class="btn secondary bb-datei" href="spotify:" id="bbSpotify">Spotify öffnen</a>'
    + '<button type="button" class="btn ft-los bb-los" id="bbMithoeren">🎤 Mithören</button><p class="ft-klein" id="bbLiveFehler"></p></div>';
  $('bbMithoeren').addEventListener('click', bbLiveStarten);
}
async function bbLiveStarten() {
  const A = ftAudio(); if (!A) return;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('kein Mikrofon');
    ftAudioVorMikrofon();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    if (!$('screen-beat').classList.contains('active')) { stream.getTracks().forEach((t) => t.stop()); ftAudioNachMikrofon(); return; }
    bbStart({ live: stream, noten: [] });
  } catch (e) {
    ftAudioNachMikrofon();
    const f = $('bbLiveFehler');
    if (f) f.textContent = 'Kein Zugriff aufs Mikrofon. Erlaube es in den Einstellungen (Safari → Mikrofon) und versuch es nochmal.';
    else bbLiveIntro();
  }
}
function bbLiveVerbinden(stream) {
  const c = bb.A.c, src = c.createMediaStreamSource(stream), an = c.createAnalyser();
  an.fftSize = 1024; an.smoothingTimeConstant = 0; src.connect(an);
  const tr = stream.getAudioTracks()[0], s = tr && tr.getSettings ? tr.getSettings() : {};
  bb.live = { stream, src, an, spek: new Float32Array(an.frequencyBinCount), zeit: new Float32Array(an.fftSize), alt: new Float32Array(an.frequencyBinCount),
    env: new Float32Array(BB_LIVE_R), stempel: new Int32Array(BB_LIVE_R).fill(-1), inLat: (typeof s.latency === 'number' ? s.latency : 0.02) + an.fftSize / 2 / c.sampleRate,
    periode: 0, anker: 0, kandidat: null, treffer: 0, abweich: 0, konf: 0, pegel: 0, stilleSeit: 0, letzteNote: -1e9, schlag: 0, spitzen: [], tempoUm: 0 };
  bb.live.timer = setInterval(bbLiveHoeren, 10);
}
function bbLiveTrennen() {
  const L = bb.live; if (!L || !L.stream) return;
  clearInterval(L.timer); try { L.src.disconnect(); } catch (e) { /* schon getrennt */ }
  L.stream.getTracks().forEach((t) => t.stop()); L.stream = null;
  ftAudioNachMikrofon();
}
function bbLiveHoeren() {
  if (!bb || !bb.live || !bb.live.stream || bb.fertig) return;
  const L = bb.live, c = bb.A.c, jetzt = c.currentTime;
  L.an.getFloatFrequencyData(L.spek); L.an.getFloatTimeDomainData(L.zeit);
  let fl = 0, q = 0;
  for (let k = 2; k < L.spek.length; k++) { const m = Math.log1p(1000 * Math.pow(10, L.spek[k] / 20)); const d = m - L.alt[k]; if (d > 0) fl += d; L.alt[k] = m; }
  for (let i = 0; i < L.zeit.length; i++) q += L.zeit[i] * L.zeit[i];
  L.pegel = Math.sqrt(q / L.zeit.length);
  if (L.pegel < 0.004) { if (!L.stilleSeit) L.stilleSeit = jetzt; } else L.stilleSeit = 0;
  // Zeitpunkt der Fenstermitte, wie er draußen erklang (Eingangsverzögerung abgezogen)
  const slot = Math.round((jetzt - L.inLat) * 100), i = ((slot % BB_LIVE_R) + BB_LIVE_R) % BB_LIVE_R;
  if (L.stempel[i] !== slot) { L.stempel[i] = slot; L.env[i] = fl; } else L.env[i] = Math.max(L.env[i], fl);
  L.slot = slot;
  if (jetzt - L.tempoUm > 0.25) { L.tempoUm = jetzt; bbLiveTempo(); }
  bbLiveNoten();
}
// Hüllkurve der letzten n Fächer (fehlende = 0), Mittelwert abgezogen, nur positive Teile
function bbLiveHuelle(L, n) {
  const x = new Float32Array(n);
  for (let j = 0; j < n; j++) { const s = L.slot - n + 1 + j, i = ((s % BB_LIVE_R) + BB_LIVE_R) % BB_LIVE_R; x[j] = L.stempel[i] === s ? L.env[i] : 0; }
  const y = new Float32Array(n), R = 15; let sum = 0;
  for (let j = 0; j < Math.min(n, R); j++) sum += x[j];
  for (let j = 0; j < n; j++) { const a = j - R - 1, b = j + R; if (b < n) sum += x[b]; if (a >= 0) sum -= x[a]; const cnt = Math.min(n - 1, b) - Math.max(0, a + 1) + 1; y[j] = Math.max(0, x[j] - sum / cnt); }
  return y;
}
// Tempo und Phase aus einer Hüllkurve (100 Werte pro Sekunde): { lag (Fächer pro Schlag), konf, phase (Fächer seit dem letzten Schlag) }
function bbTempo(x) {
  const n = x.length, lo = 31, hi = 86, maxL = Math.min(n - 50, 4 * hi + 2), ac = new Float32Array(maxL + 2);
  for (let L = 1; L <= maxL + 1; L++) { let s = 0; for (let j = 0; j + L < n; j++) s += x[j] * x[j + L]; ac[L] = s / (n - L); }
  const acI = (l) => { if (l >= maxL) return 0; const i = Math.floor(l), f = l - i; return ac[i] * (1 - f) + ac[i + 1] * f; };
  let mittel = 0; for (let L = lo; L <= hi; L++) mittel += ac[L]; mittel /= hi - lo + 1;
  // Kandidat-Periode L: Wiederholung nach 1, 2, 3, 4 Schlägen muss stark sein; Vorliebe um 120 BPM (L = 50)
  let lag = lo, bw = -1;
  for (let L = lo; L <= hi; L += 0.25) {
    let v = acI(L); for (let m = 2; m <= 4; m++) if (m * L < maxL) v += 0.8 * acI(m * L);
    v *= Math.exp(-0.5 * (Math.log2(L / 50) / 1.1) ** 2);
    if (v > bw) { bw = v; lag = L; }
  }
  const b = acI(lag);
  // Phase: Kamm über die Hüllkurve, neuere Schläge zählen mehr
  let phase = 0, ps = -1;
  for (let f = 0; f < Math.ceil(lag); f++) {
    let s = 0;
    for (let k = 0, w = 1; ; k++, w *= 0.88) { const j = Math.round(n - 1 - f - k * lag); if (j < 1) break; s += w * Math.max(x[j], x[j - 1] * 0.7, j + 1 < n ? x[j + 1] * 0.7 : 0); }
    if (s > ps) { ps = s; phase = f; }
  }
  return { lag, konf: mittel > 0 ? b / mittel : 0, phase };
}
function bbLiveTempo() {
  const L = bb.live, verfuegbar = Math.min(800, Math.round((bb.A.c.currentTime - bb.start) * 100));
  if (verfuegbar < 350 || L.stilleSeit) return;
  const x = bbLiveHuelle(L, verfuegbar), t = bbTempo(x);
  L.konf = t.konf;
  const P = t.lag / 100, schlag = (L.slot - t.phase) / 100;   // Zeit des letzten Schlags (draußen)
  if (!L.periode) {
    if (t.konf < 1.3) { L.kandidat = null; return; }
    if (L.kandidat && Math.abs(P / L.kandidat - 1) < 0.03) { L.treffer++; } else { L.kandidat = P; L.treffer = 1; }
    if (L.treffer >= 3) { L.periode = P; L.anker = schlag; }
    return;
  }
  const v = P / L.periode, passt = Math.abs(v - 1) < 0.05, oktave = Math.abs(v - 2) < 0.08 || Math.abs(v - 0.5) < 0.04;
  if (passt) {
    L.periode = L.periode * 0.85 + P * 0.15; L.abweich = 0;
    const vor = L.anker + Math.round((schlag - L.anker) / L.periode) * L.periode;
    let err = schlag - vor; if (err > L.periode / 2) err -= L.periode; if (err < -L.periode / 2) err += L.periode;
    L.anker = vor + err * 0.3;
  } else if (!oktave && t.konf > 1.3) {
    if (++L.abweich >= 6) { L.periode = P; L.anker = schlag; L.abweich = 0; }   // Tempo hat sich wirklich geändert
  }
}
function bbLiveNoten() {
  const L = bb.live; if (!L.periode || L.stilleSeit) return;
  const reise = BB_STUFEN[bb.stufe].reise, jetzt = bb.A.c.currentTime, P = L.periode;
  const horizont = jetzt + reise + 0.1;
  for (;;) {
    let k = Math.ceil((Math.max(L.letzteNote + P * 0.6, jetzt + 0.9) - L.anker) / P), t = L.anker + k * P;
    if (t > horizont) break;
    const b = L.schlag++, takt = Math.floor(b / 4), muster = BB_LIVE_MUSTER[(takt * 7 + (takt >> 2) * 3) % BB_LIVE_MUSTER.length], bahn = muster[b % 4];
    L.letzteNote = t;
    const zeit = t - bb.start;
    if (bb.stufe !== 'leicht' || b % 2 === 0) bb.noten.push({ t: zeit, bahn, ton: null, chart: true, urteil: null });
    if (bb.stufe === 'schwer' && b % 2 === 1 && P > 0.36) bb.noten.push({ t: zeit + P / 2, bahn: (bahn + 2) % 4, ton: null, chart: true, urteil: null });
  }
}
function bbLiveStatus(c, W, H, jetzt, reise) {
  const L = bb.live; if (!L) return;
  const bald = bb.noten.some((n) => n.t > jetzt && n.t < jetzt + reise);
  c.textAlign = 'center';
  if (L.periode) { c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '700 13px system-ui'; c.fillText('🎤 ' + Math.round(60 / L.periode) + ' BPM', W / 2, 22); }
  if (bald) return;
  const pegel = Math.min(1, L.pegel * 12);
  c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '800 22px system-ui';
  c.fillText(L.stilleSeit ? 'Ich höre nichts …' : L.periode ? 'Beat gefunden!' : 'Ich höre zu …', W / 2, H * 0.36);
  c.font = '600 13px system-ui'; c.fillStyle = 'rgba(199,208,245,.8)';
  c.fillText(L.stilleSeit ? 'Läuft die Musik über den Lautsprecher?' : L.periode ? 'Gleich kommen die Noten' : 'Suche den Beat – ein paar Sekunden', W / 2, H * 0.36 + 26);
  const bw = W * 0.5; c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect((W - bw) / 2, H * 0.36 + 44, bw, 6);
  c.fillStyle = '#a78bfa'; c.fillRect((W - bw) / 2, H * 0.36 + 44, bw * pegel, 6);
}
document.addEventListener('keydown', (e) => {
  if (!bb || bb.fertig || !$('screen-beat').classList.contains('active') || e.repeat || e.metaKey || e.ctrlKey) return;
  const b = BB_TASTEN.indexOf(e.key.toLowerCase()); if (b < 0) return;
  e.preventDefault(); bbTippen(b);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && bb && !bb.fertig && bb.ctx) bbIntro(); });
$('hubBeat').addEventListener('click', () => { merkeZuletzt('beat'); zoomZu($('hubBeat'), bbOeffnen); });
$('bbZurueck').addEventListener('click', () => { if (bb) { bbIntro(); return; } bbStopp(); zeigeHub(); });
