// 📄 Falten bis zum Mars – ein Blatt Papier (0,1 mm) verdoppelt bei jedem Falten seine Dicke.
// Vorher schätzen, dann falten: Maßstab und echte Vergleichsobjekte wandern mit, jede Faltung spielt einen
// Happy-Hardcore-Klang (eigener Beat, 175 BPM, Web Audio – keine Musikdatei). Im Takt falten gibt eine Combo.
// Speicher: walquiz.falten.v1 = { best: { abw, combo }, runden }
const FT_KEY = 'walquiz.falten.v1';
const FT_DICKE = 0.1e-3;                 // m
const FT_MARS = 49;                      // 0,1 mm × 2^49 = 56,3 Mio. km ≥ 55,76 Mio. km (nächster Abstand, Aug. 2003)
const FT_ENDE = 69;                      // Proxima Centauri
// Meilensteine: Höhe in m; ab = erste Faltung, die die Höhe erreicht (wird beim Laden berechnet und im Test geprüft)
const FT_ZIELE = [
  { n: 'Kreditkarte', h: 0.76e-3, e: '💳', t: 'Dicker als eine Kreditkarte' },
  { n: '1-Euro-Münze', h: 2.33e-3, e: '🪙', t: 'Dicker als eine Euro-Münze' },
  { n: 'Smartphone', h: 8e-3, e: '📱', t: 'Dicker als ein Smartphone' },
  { n: 'Daumen', h: 2e-2, e: '👍', t: 'Breiter als ein Daumen' },
  { n: 'Tennisball', h: 6.7e-2, e: '🎾', t: 'Höher als ein Tennisball' },
  { n: 'Lineal', h: 0.3, e: '📏', t: 'Höher als ein Lineal lang ist' },
  { n: 'Kind', h: 1.2, e: '🧒', t: 'Größer als ein Kind' },
  { n: 'Mensch', h: 1.8, e: '🧍', t: 'Größer als ein Mensch' },
  { n: 'Giraffe', h: 5.5, e: '🦒', t: 'Höher als eine Giraffe' },
  { n: 'Haus', h: 10, e: '🏠', t: 'Höher als ein Haus' },
  { n: 'Freiheitsstatue', h: 93, e: '🗽', t: 'Höher als die Freiheitsstatue' },
  { n: 'Kölner Dom', h: 157, e: '⛪', t: 'Höher als der Kölner Dom' },
  { n: 'Eiffelturm', h: 330, e: '🗼', t: 'Höher als der Eiffelturm' },
  { n: 'Burj Khalifa', h: 828, e: '🏙️', t: 'Höher als der Burj Khalifa' },
  { n: 'Zugspitze', h: 2962, e: '🏔️', t: 'Höher als die Zugspitze' },
  { n: 'Mount Everest', h: 8849, e: '🗻', t: 'Höher als der Mount Everest' },
  { n: 'Flugzeug', h: 10000, e: '✈️', t: 'Über den Flugzeugen' },
  { n: 'Wetterballon', h: 35e3, e: '🎈', t: 'Höher als Wetterballons fliegen' },
  { n: 'Weltraum', h: 100e3, e: '🌌', t: 'Willkommen im Weltraum (100 km)' },
  { n: 'Raumstation ISS', h: 408e3, e: '🛰️', t: 'Vorbei an der Raumstation …' },
  { n: 'Hubble-Teleskop', h: 520e3, e: '🔭', t: 'Über dem Hubble-Teleskop' },
  { n: 'Erde (Durchmesser)', h: 12742e3, e: '🌍', t: 'Höher, als die Erde breit ist' },
  { n: 'GPS-Satelliten', h: 20200e3, e: '📡', t: 'Über den GPS-Satelliten' },
  { n: 'Geostationär', h: 35786e3, e: '📺', t: 'Höher als Wettersatelliten' },
  { n: 'Mond', h: 384400e3, e: '🌕', t: 'Bis zum Mond!' },
  { n: 'James-Webb-Teleskop', h: 1.5e9, e: '🛰️', t: 'Bis zum James-Webb-Teleskop' },
  { n: 'Mars', h: 55.76e9, e: '🔴', t: 'MARS ERREICHT!', mars: true },
  { n: 'Sonne', h: 149.6e9, e: '☀️', t: 'Bis zur Sonne' },
  { n: 'Jupiter', h: 588e9, e: '🪐', t: 'Bis zum Jupiter' },
  { n: 'Saturn', h: 1.2e12, e: '🪐', t: 'Bis zum Saturn' },
  { n: 'Neptun', h: 4.5e12, e: '🔵', t: 'Bis zum Neptun' },
  { n: 'Voyager 1', h: 25.4e12, e: '🛸', t: 'Weiter als Voyager 1 (2026)' },
  { n: '1 Lichtjahr', h: 9.4607e15, e: '✨', t: 'Ein ganzes Lichtjahr' },
  { n: 'Proxima Centauri', h: 4.0114e16, e: '⭐', t: 'Bis zum nächsten Stern!', ende: true },
];
FT_ZIELE.forEach((z) => { let k = 0; while (FT_DICKE * 2 ** k < z.h) k++; z.ab = k; });
const ftHoehe = (n) => FT_DICKE * 2 ** n;

// Längen lesbar auf Deutsch
function ftLaenge(m, kurz) {
  const f = (x, d) => x.toLocaleString('de-DE', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const nk = (x) => (x < 10 ? 2 : x < 100 ? 1 : 0);
  if (m < 0.001) return f(m * 1000, 2) + ' mm';
  if (m < 0.01) return f(m * 1000, 1) + ' mm';
  if (m < 1) return f(m * 100, nk(m * 100)) + ' cm';
  if (m < 1000) return f(m, nk(m)) + ' m';
  const km = m / 1000;
  if (km < 1e6) return f(km, km < 10 ? 2 : km < 100 ? 1 : 0) + ' km';
  if (km < 1e9) return f(km / 1e6, nk(km / 1e6)) + (kurz ? ' Mio km' : ' Mio. km');
  if (m < 9.4607e14) return f(km / 1e9, nk(km / 1e9)) + (kurz ? ' Mrd km' : ' Mrd. km');
  const lj = m / 9.4607e15;
  return f(lj, lj < 10 ? 2 : 1) + ' Lichtjahre';
}

// ---------- Happy-Hardcore-Klang (Web Audio, alles synthetisiert) ----------
const FT_BPM = 175, FT_ACHTEL = 60 / FT_BPM / 2;
// eigene Akkordfolge (I–V–vi–IV in C) und eine eigene Melodie, je Faltung ein Ton
const FT_AKKORDE = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
const FT_MELODIE = [72, 74, 76, 79, 76, 74, 72, 67, 69, 72, 74, 76, 74, 72, 71, 72, 76, 79, 81, 79, 76, 74, 76, 79];
let ftAk = null, ftStummMerk = false;
function ftAudio() {
  if (!ftAk) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    const c = new C(), master = c.createGain(), komp = c.createDynamicsCompressor();
    master.gain.value = 0.55; master.connect(komp).connect(c.destination);
    ftAk = { c, master, takt: null, start: 0, schritt: 0, naechster: 0, stumm: ftStummMerk };
  }
  if (ftAk.c.state === 'suspended') ftAk.c.resume();
  return ftAk;
}
const ftHz = (m) => 440 * 2 ** ((m - 69) / 12);
function ftKick(A, t, laut = 1) {
  const c = A.c, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.9 * laut, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  o.connect(g).connect(A.master); o.start(t); o.stop(t + 0.3);
}
let ftRauschPuffer = null;
// Mikrofon benutzt (Live-Modus, Sprechen)? iOS schaltet dabei auf „Telefonieren“ um und spielt danach über den
// Hörer am Ohr statt über den Lautsprecher. Darum: Audio-Sitzung zurück auf Wiedergabe und die Audio-Kontexte neu
// anlegen (beim nächsten Ton) – dann wählt iOS wieder den Lautsprecher.
// iOS-Audio-Sitzung: „ambient“ = normale Spiel-Wiedergabe über den Lautsprecher, mischt sich mit Spotify & Co.
// und hält sich an den Stumm-Schalter. Ohne festen Wert wählt iOS bei einer Home-Bildschirm-App, die schon einmal
// das Mikrofon hatte, manchmal den Telefon-Modus – dann kommt der Ton aus dem Hörer am Ohr.
function ftAudioSitzung(typ) { try { if (navigator.audioSession && navigator.audioSession.type !== typ) navigator.audioSession.type = typ; } catch (e) { /* ältere Browser */ } }
// Gewählte Wiedergabe-Art (im Ton-Check einstellbar, gilt für dieses Gerät): ambient | playback | auto
const FT_AUDIO_KEY = 'walquiz.audio.v1';
const ftAudioArt = () => { try { const a = JSON.parse(localStorage.getItem(FT_AUDIO_KEY) || '{}').sitzung; return ['ambient', 'playback', 'auto'].includes(a) ? a : 'ambient'; } catch (e) { return 'ambient'; } };
ftAudioSitzung(ftAudioArt());
document.addEventListener('visibilitychange', () => { if (!document.hidden && !(typeof bb !== 'undefined' && bb && bb.live && bb.live.stream)) ftAudioSitzung(ftAudioArt()); });
function ftAudioNachMikrofon() {
  ftAudioSitzung(ftAudioArt());
  if (ftAk) { ftStummMerk = ftAk.stumm; ftTaktStoppen(); try { ftAk.c.close(); } catch (e) { /* schon zu */ } ftAk = null; }
  ftRauschPuffer = null;
  if (typeof tonCtx !== 'undefined' && tonCtx && !(typeof live !== 'undefined' && live)) { try { tonCtx.close(); } catch (e) { /* schon zu */ } tonCtx = null; }
}
function ftAudioVorMikrofon() { ftAudioSitzung('play-and-record'); }
// 🔊 Ton-Check: zeigt, was iOS gerade macht, und lässt die Wiedergabe-Art ausprobieren
function ftTonTest() {
  const A = ftAudio(); if (!A) return;
  const t = A.c.currentTime + 0.05, war = A.stumm; A.stumm = false;
  ftSaw(A, t, [72, 76, 79], 0.35, 0.08, 4000); ftSaw(A, t + 0.35, [84], 0.4, 0.08, 4000); ftKick(A, t, 0.8);
  A.stumm = war;
}
function ftTonCheck() {
  const as = navigator.audioSession, ios = /OS (\d+)_(\d+)/.exec(navigator.userAgent), art = ftAudioArt();
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const mikro = typeof bb !== 'undefined' && bb && bb.live && bb.live.stream ? 'an (Live-Modus)' : 'aus';
  const zeile = (k, v) => '<li><b>' + k + '</b><span>' + v + '</span></li>';
  const arten = [['ambient', 'Spiel', 'Lautsprecher, mischt sich mit Spotify, Stumm-Schalter gilt'], ['playback', 'Wiedergabe', 'wie ein Musik-Player: spielt auch bei Stumm, hält Spotify an'], ['auto', 'Automatisch', 'iOS entscheidet (so war es früher)']];
  const html = '<h3>🔊 Ton-Check</h3><ul class="ft-check">'
    + zeile('App-Stand', typeof APP_STAND !== 'undefined' ? APP_STAND.replace('walquiz-', '') : '?')
    + zeile('Gerät', (ios ? 'iOS ' + ios[1] + '.' + ios[2] : 'kein iPhone/iPad') + (standalone ? ' · Home-Bildschirm-App' : ' · Browser'))
    + zeile('Audio-Sitzung', as ? '„' + as.type + '“' + (as.state ? ' (' + as.state + ')' : '') : 'nicht verfügbar (iOS zu alt?)')
    + zeile('Ton-Kontext', ftAk ? ftAk.c.state + ' · ' + ftAk.c.sampleRate + ' Hz' : 'noch nicht gestartet')
    + zeile('Mikrofon', mikro) + '</ul>'
    + '<p class="ft-klein">Kommt der Ton aus dem Hörer am Ohr? Probier nacheinander die Arten aus – jede spielt sofort einen Test-Ton. Die App merkt sich, was du wählst.</p>'
    + '<div class="ft-arten">' + arten.map(([id, n, t]) => '<button type="button" class="ft-art' + (id === art ? ' an' : '') + '" data-art="' + id + '"><b>' + n + '</b><small>' + t + '</small></button>').join('') + '</div>'
    + '<button type="button" class="btn secondary" id="ftTestTon">🔔 Test-Ton</button>'
    + '<p class="ft-klein">Steht im Kontrollzentrum am Lautstärkeregler ein <b>Telefon</b>, ist iOS im Anruf-Modus. Hilft keine Art: iPhone einmal neu starten. Die Spielstände bleiben dabei erhalten.</p>';
  const d = typeof skDialog === 'function' ? skDialog(html) : null; if (!d) return;
  d.querySelector('#ftTestTon').addEventListener('click', ftTonTest);
  d.querySelectorAll('[data-art]').forEach((b) => b.addEventListener('click', () => {
    try { localStorage.setItem(FT_AUDIO_KEY, JSON.stringify({ sitzung: b.dataset.art })); } catch (e) { /* privat */ }
    ftAudioNachMikrofon(); ftAudioSitzung(b.dataset.art);
    setTimeout(() => { ftTonTest(); ftTonCheck(); }, 120);
  }));
}
if (document.getElementById('tonCheckBtn')) document.getElementById('tonCheckBtn').addEventListener('click', ftTonCheck);
function ftRauschen(A, t, dauer, hp, laut) {
  const c = A.c;
  if (!ftRauschPuffer) { ftRauschPuffer = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate); const d = ftRauschPuffer.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const q = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  q.buffer = ftRauschPuffer; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.001, t + dauer);
  q.connect(f).connect(g).connect(A.master); q.start(t); q.stop(t + dauer + 0.02);
}
// „Supersaw“: mehrere leicht verstimmte Sägezähne → typischer Happy-Hardcore-Stab
function ftSaw(A, t, noten, dauer, laut, hell = 3000) {
  const c = A.c, f = c.createBiquadFilter(), g = c.createGain();
  f.type = 'lowpass'; f.frequency.setValueAtTime(hell * 1.6, t); f.frequency.exponentialRampToValueAtTime(hell * 0.4, t + dauer);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + dauer);
  f.connect(g).connect(A.master);
  noten.forEach((n) => [-12, 0, 9].forEach((cent) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = ftHz(n); o.detune.value = cent; o.connect(f); o.start(t); o.stop(t + dauer + 0.05); }));
}
function ftBass(A, t, note, laut) {
  const c = A.c, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth'; o.frequency.value = ftHz(note - 24); f.type = 'lowpass'; f.frequency.value = 420;
  g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.001, t + FT_ACHTEL * 0.95);
  o.connect(f).connect(g).connect(A.master); o.start(t); o.stop(t + FT_ACHTEL);
}
// Gemeinsamer Beat für Falten, Zoom und Glas: ftLaut (0…40) bestimmt, wie viele Spuren laufen.
let ftLaut = 0;
const FT_MUSIK_SCREENS = ['falten', 'zoom', 'glas', 'wunder'];
const ftMusikSpielt = () => FT_MUSIK_SCREENS.some((id) => { const sc = document.getElementById('screen-' + id); return sc && sc.classList.contains('active'); });
// Beat-Schleife: je mehr Faltungen, desto mehr Spuren (Kick → Hats → Bass → Stabs → Claps)
function ftTaktStarten() {
  const A = ftAudio(); if (!A || A.takt) return;
  A.start = A.c.currentTime + 0.06; A.schritt = 0; A.naechster = A.start;
  A.takt = setInterval(() => {
    if (!ftMusikSpielt()) { ftTaktStoppen(); return; }
    while (A.naechster < A.c.currentTime + 0.12) { ftSchritt(A, A.schritt, A.naechster); A.schritt++; A.naechster += FT_ACHTEL / 2; }
  }, 25);
}
function ftTaktStoppen() { if (ftAk && ftAk.takt) { clearInterval(ftAk.takt); ftAk.takt = null; } }
function ftSchritt(A, s, t) {   // s = Sechzehntel
  if (A.stumm) return;
  const n = ftLaut, im = s % 16, takt = Math.floor(s / 16), ak = FT_AKKORDE[takt % 4];
  if (im % 4 === 0) ftKick(A, t, n < 3 ? 0.7 : 1);
  if (n >= 6 && im % 4 === 2) ftRauschen(A, t, 0.09, 7000, 0.18);
  if (n >= 12 && im % 4 === 2) ftBass(A, t, ak[0], 0.35);
  if (n >= 20 && [0, 3, 6, 10, 12].includes(im)) ftSaw(A, t, ak.map((x) => x + 12), 0.14, 0.05, 2600);
  if (n >= 30 && (im === 4 || im === 12)) ftRauschen(A, t, 0.16, 1500, 0.3);
}
// Klang zur Faltung: nächster Melodieton, auf das nächste Achtel gelegt; Meilenstein = voller Akkord + Becken
function ftFaltKlang(n, meilenstein) {
  const A = ftAudio(); if (!A || A.stumm) return;
  const c = A.c, jetzt = c.currentTime;
  let t = jetzt + 0.01;
  if (A.takt) { const rel = (jetzt - A.start) / FT_ACHTEL; t = A.start + Math.ceil(rel - 0.15) * FT_ACHTEL; if (t < jetzt) t = jetzt + 0.01; }
  const ton = FT_MELODIE[(n - 1) % FT_MELODIE.length] + (n > 24 ? 12 : 0);
  ftSaw(A, t, [ton, ton + 12], 0.22, 0.09, 4200);
  // „Riser“: kurzer Pfeifton, der mit der Höhe steigt
  const o = c.createOscillator(), g = c.createGain(); o.type = 'square';
  o.frequency.setValueAtTime(ftHz(60 + Math.min(36, n * 0.7)), t); o.frequency.exponentialRampToValueAtTime(ftHz(72 + Math.min(36, n * 0.7)), t + 0.18);
  g.gain.setValueAtTime(0.025, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); o.connect(g).connect(A.master); o.start(t); o.stop(t + 0.22);
  if (meilenstein) {
    const ak = FT_AKKORDE[Math.floor(n / 2) % 4];
    ftSaw(A, t, [...ak.map((x) => x + 12), ak[0] + 24], 0.6, 0.07, 5000);
    ftRauschen(A, t, 0.9, 3000, 0.22);
  }
  return t;
}

// ---------- Spiel ----------
let ft = null, ftAnim = null;
const klAktivFalten = () => { const sc = $('screen-falten'); return !!(sc && sc.classList.contains('active')); };
const ftStore = () => { const s = loadJson(FT_KEY); s.best = s.best || {}; s.runden = s.runden || 0; return s; };
function ftOeffnen() { show('falten', '📄 Falten bis zum Mars'); ftIntro(); }
function ftIntro() {
  ftTaktStoppen(); cancelAnimationFrame(ftAnim);
  ft = null;
  const st = ftStore();
  $('ftInhalt').innerHTML = '<div class="ft-intro"><div class="ft-blatt" aria-hidden="true"></div><h2>Falten bis zum Mars</h2>'
    + '<p>Ein Blatt Papier ist <b>0,1 mm</b> dick. Jedes Mal, wenn du es faltest, verdoppelt sich die Dicke.</p>'
    + '<p class="ft-frage">Wie oft musst du falten, bis der Stapel <b>bis zum Mars</b> reicht?</p>'
    + '<div class="ft-schaetzen"><input type="range" id="ftSchieber" min="0" max="1000" value="500" aria-label="Schätzung"><output id="ftSchaetzung"></output></div>'
    + '<button type="button" class="btn ft-los" id="ftLos">🎵 Schätzen und losfalten</button>'
    + '<p class="ft-klein">Tipp: Im Takt falten gibt eine Combo. Ton an! 🔊' + (st.best.abw != null ? '<br>Deine beste Schätzung lag ' + st.best.abw + ' Faltungen daneben.' : '') + '</p></div>';
  // logarithmischer Schieber 2 … 1.000.000
  const schaetz = () => Math.max(2, Math.round(2 * Math.pow(500000, $('ftSchieber').value / 1000)));
  const zeig = () => { $('ftSchaetzung').textContent = schaetz().toLocaleString('de-DE') + ' × falten'; };
  $('ftSchieber').addEventListener('input', zeig); zeig();
  $('ftLos').addEventListener('click', () => { ftAudio(); ftStart(schaetz()); });
}
function ftStart(schaetzung) {
  ftLaut = 0;
  ft = { n: 0, anzeigeN: 0, schaetzung, combo: 0, bestCombo: 0, imTakt: 0, text: 'Falte ein Blatt Papier …', textZeit: 0, partikel: [], anim: null, fertig: false, weiter: false };
  $('ftInhalt').innerHTML = '<div class="ft-kopf"><div class="ft-zahl" id="ftZahl"></div>'
    + '<div class="ft-leiste" id="ftLeiste">' + FT_ZIELE.filter((z) => z.ab <= FT_MARS && z.ab >= 20).map((z) => '<i style="left:' + (z.ab / FT_MARS) * 100 + '%"></i>').join('') + '<b id="ftBalken"></b><span class="ft-mars">🔴<small>Mars</small></span></div></div>'
    + '<canvas id="ftBild" class="ft-bild"></canvas>'
    + '<div class="ft-unten"><div class="ft-text" id="ftText"></div><div class="ft-combo" id="ftCombo"></div>'
    + '<div class="ft-knoepfe"><button type="button" class="ft-ton" id="ftTon" aria-label="Ton an/aus">' + (ftAk && ftAk.stumm ? '🔇' : '🔊') + '</button><button type="button" class="btn ft-falten" id="ftFalten">📄 FALTEN</button></div></div>';
  const cv = $('ftBild'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 360, H = Math.max(300, Math.min(window.innerHeight * 0.58, 620));
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  Object.assign(ft, { cv, ctx: cv.getContext('2d'), W, H, dpr, sterne: Array.from({ length: 70 }, () => [Math.random(), Math.random(), Math.random()]) });
  $('ftFalten').addEventListener('click', ftFalten);
  cv.addEventListener('click', ftFalten);
  $('ftTon').addEventListener('click', () => { const A = ftAudio(); if (!A) return; A.stumm = !A.stumm; $('ftTon').textContent = A.stumm ? '🔇' : '🔊'; });
  ftAnzeige(); ftLauf();
}
function ftFalten() {
  if (!ft || ft.fertig || ft.n >= FT_ENDE) return;
  const alt = ft.n; ft.n++; ftLaut = ft.n;
  if (!ftAk || !ftAk.takt) ftTaktStarten();
  // Im Takt? (Abstand zum nächsten Achtel ≤ 70 ms)
  const A = ftAudio();
  if (A && A.takt && ft.n > 1) {
    const rel = (A.c.currentTime - A.start) / FT_ACHTEL, abw = Math.abs(rel - Math.round(rel)) * FT_ACHTEL;
    if (abw <= 0.07) { ft.combo++; ft.imTakt++; ft.bestCombo = Math.max(ft.bestCombo, ft.combo); } else ft.combo = 0;
  }
  const ziel = FT_ZIELE.filter((z) => z.ab === ft.n).pop();
  ftFaltKlang(ft.n, !!ziel);
  if (ziel) { ft.text = ziel.t; ft.textZeit = performance.now(); }
  ft.anim = { von: alt, bis: ft.n, t0: performance.now(), dauer: 560 };
  for (let i = 0; i < 14; i++) ft.partikel.push({ a: Math.random() * Math.PI * 2, v: 0.6 + Math.random() * 1.6, t: 0 });
  if (navigator.vibrate) navigator.vibrate(ziel ? [15, 30, 15] : 8);
  ftAnzeige();
  if (ft.n === FT_MARS && !ft.weiter) setTimeout(() => ftMars(), 900);
  if (ft.n === FT_ENDE) setTimeout(() => ftFinale(), 900);
}
function ftAnzeige() {
  $('ftZahl').innerHTML = '<b>' + ft.n + '</b> ' + (ft.n === 1 ? 'Faltung' : 'Faltungen') + ' = <em>' + ftLaenge(ftHoehe(ft.n)) + '</em>';
  $('ftBalken').style.width = Math.min(100, (ft.n / FT_MARS) * 100) + '%';
  $('ftText').textContent = ft.text;
  $('ftCombo').textContent = ft.combo >= 2 ? '🎵 Im Takt ×' + ft.combo : '';
}
// ---------- Zeichnen ----------
function ftLauf() {
  cancelAnimationFrame(ftAnim);
  const schleife = () => { if (!ft || !ft.ctx || !klAktivFalten()) return; ftMalen(); ftAnim = requestAnimationFrame(schleife); };
  ftAnim = requestAnimationFrame(schleife);
}
const ftEase = (x) => 1 - Math.pow(1 - x, 3);
function ftMalen() {
  const { ctx: c, W, H, dpr } = ft, jetzt = performance.now();
  // animierte Faltungszahl (für Höhe und Maßstab, logarithmisch weich)
  let fort = 1, von = ft.n, bis = ft.n;
  if (ft.anim) { fort = Math.min(1, (jetzt - ft.anim.t0) / ft.anim.dauer); von = ft.anim.von; bis = ft.anim.bis; if (fort >= 1) ft.anim = null; }
  // Maßstab zoomt in den ersten 60 % heraus, damit die umklappende Hälfte ins Bild passt
  const nA = von + (bis - von) * ftEase(Math.min(1, fort / 0.6)), hoehe = ftHoehe(nA), boden = H * 0.86, oben = H * 0.08;
  const sicht = Math.max(hoehe * 1.6, 1.5e-3), px = (boden - oben) / sicht;   // Pixel pro Meter; Start: 0,1 mm-Blatt gut sichtbar
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const hg = c.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, W); hg.addColorStop(0, '#1e2a6b'); hg.addColorStop(1, '#0b0f2a');
  c.fillStyle = hg; c.fillRect(0, 0, W, H);
  // Beat-Puls (sanft, kein Blitzen)
  if (ftAk && ftAk.takt && !ftAk.stumm) { const ph = ((ftAk.c.currentTime - ftAk.start) / (FT_ACHTEL * 2)) % 1; c.fillStyle = 'rgba(120,140,255,' + (0.06 * (1 - ph)) + ')'; c.fillRect(0, 0, W, H); }
  ft.sterne.forEach(([x, y, s]) => { c.fillStyle = 'rgba(255,255,255,' + (0.25 + s * 0.5) + ')'; c.fillRect(x * W, y * H, 1 + s, 1 + s); });
  // Maßstab links
  const roh = sicht / 5, p10 = 10 ** Math.floor(Math.log10(roh)), schritt = [1, 2, 5, 10].map((k) => k * p10).find((x) => x >= roh);
  c.strokeStyle = 'rgba(180,190,230,.35)'; c.fillStyle = 'rgba(200,210,240,.75)'; c.lineWidth = 1; c.font = '600 11px system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.beginPath(); c.moveTo(14, oben); c.lineTo(14, boden); c.stroke();
  for (let v = schritt; v <= sicht * 1.001; v += schritt) { const y = boden - v * px; c.beginPath(); c.moveTo(10, y); c.lineTo(20, y); c.stroke(); c.fillText(ftLaenge(v, true), 24, y); }
  // Boden / Erde
  if (ft.n >= 30) {
    const rE = 6371e3 * px; c.fillStyle = '#1d4ed8';
    if (rE > 4) { const g = c.createRadialGradient(W / 2 - rE * 0.3, boden + rE * 0.6, rE * 0.1, W / 2, boden + rE, rE); g.addColorStop(0, '#60a5fa'); g.addColorStop(0.6, '#2563eb'); g.addColorStop(1, '#14532d'); c.fillStyle = g; c.beginPath(); c.arc(W / 2, boden + rE, rE, 0, Math.PI * 2); c.fill(); }
  }
  c.strokeStyle = ft.n >= 30 ? '#60a5fa' : '#f59e0b'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, boden); c.lineTo(W, boden); c.stroke();
  // Vergleichsobjekte im sichtbaren Bereich
  let seite = 0;
  FT_ZIELE.forEach((z) => {
    if (z.h > sicht * 1.02 || z.h < sicht * 0.04) return;
    const y = boden - z.h * px, links = seite++ % 2 === 0, x = links ? W * 0.24 : W * 0.78, erreicht = hoehe >= z.h;
    c.globalAlpha = Math.min(1, (z.h / sicht - 0.04) * 6);
    c.setLineDash([4, 4]); c.strokeStyle = erreicht ? 'rgba(134,239,172,.6)' : 'rgba(147,197,253,.6)'; c.beginPath(); c.moveTo(links ? x + 18 : x - 18, y); c.lineTo(W / 2, y); c.stroke(); c.setLineDash([]);
    c.font = '20px system-ui'; c.textAlign = 'center'; c.fillText(z.e, x, y - 4);
    c.font = '600 11px system-ui'; c.fillStyle = erreicht ? '#bbf7d0' : '#bfdbfe'; c.fillText(z.n, x, y - 22); c.fillStyle = 'rgba(200,210,240,.8)'; c.fillText(ftLaenge(z.h, true), x, y + 14);
    c.globalAlpha = 1;
  });
  // Papierstapel. Falten wie echt: solange das Blatt breit ist, klappt die rechte Hälfte über die linke
  // (Breite halbiert, Dicke verdoppelt); ist es eine Säule, klappt eine zweite Säule oben auf.
  const cx = W / 2, minB = W * 0.07, breiteN = (n) => Math.max(minB, W * 0.5 / 2 ** n);
  const papier = (x, y, w, h) => { const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#fde68a'); g.addColorStop(0.5, '#fffbeb'); g.addColorStop(1, '#fcd34d'); c.fillStyle = g; c.fillRect(x, y, w, h); };
  c.shadowColor = 'rgba(253,230,138,.9)'; c.shadowBlur = 22;
  let top, breite;
  if (fort < 1 && bis === von + 1) {
    const wv = breiteN(von), hv = Math.max(2, ftHoehe(von) * px), klapp = ftEase(Math.min(1, fort / 0.75));
    if (breiteN(bis) < wv) {   // flaches Blatt: rechte Hälfte klappt nach links oben herüber
      const schieb = ftEase(Math.max(0, (fort - 0.6) / 0.4)), lx = cx - wv / 2 + schieb * (wv / 4), y = boden - hv;
      papier(lx, y, wv / 2, hv);
      c.save(); c.translate(lx + wv / 2, y); c.rotate(-Math.PI * klapp); papier(0, 0, wv / 2, hv); c.restore();
      breite = wv / 2; top = boden - hv * (klapp > 0.5 ? 2 : 1);
    } else {                   // Säule: zweite Hälfte schwenkt von unten rechts nach oben auf die Säule
      const w = wv, y = boden - hv;
      papier(cx - w / 2, y, w, hv);
      c.save(); c.translate(cx + w / 2, y); c.rotate(Math.PI * 0.92 * (1 - klapp)); papier(-w, -hv, w, hv); c.restore();
      breite = w; top = boden - hv * (1 + klapp);
    }
  } else {
    breite = breiteN(ft.n); const hPx = Math.max(2, ftHoehe(ft.n) * px); top = boden - hPx;
    papier(cx - breite / 2, top, breite, hPx);
    c.shadowBlur = 0;
    if (ft.n > 0 && ft.n < 7) { c.strokeStyle = 'rgba(180,140,40,.4)'; c.lineWidth = 1; for (let i = 1; i < 2 ** ft.n; i++) { const y = boden - (hPx * i) / 2 ** ft.n; c.beginPath(); c.moveTo(cx - breite / 2, y); c.lineTo(cx + breite / 2, y); c.stroke(); } }
  }
  c.shadowBlur = 0;
  // Ring + Funken an der Spitze
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(W / 2, top, breite * 0.7 + 14, 7, 0, 0, Math.PI * 2); c.stroke();
  ft.partikel = ft.partikel.filter((p) => (p.t += 0.03) < 1);
  ft.partikel.forEach((p) => { c.fillStyle = 'rgba(253,230,138,' + (1 - p.t) + ')'; c.fillRect(W / 2 + Math.cos(p.a) * p.v * p.t * 60, top + Math.sin(p.a) * p.v * p.t * 30 - p.t * 20, 2, 2); });
  // Marker am Maßstab
  c.fillStyle = '#6ee7b7'; c.beginPath(); c.moveTo(14, top); c.lineTo(24, top - 6); c.lineTo(24, top + 6); c.closePath(); c.fill();
}
// ---------- Ende ----------
function ftWertung() {
  const abw = Math.abs(ft.schaetzung - FT_MARS), q = Math.max(0, 1 - Math.abs(Math.log(ft.schaetzung / FT_MARS)) / Math.log(20));
  return { abw, q };
}
function ftMars() {
  if (!ft || ft.fertig) return;
  ft.fertig = true;
  const { abw, q } = ftWertung(), st = ftStore(), rekord = st.best.abw == null || abw < st.best.abw;
  if (rekord) st.best.abw = abw;
  st.best.combo = Math.max(st.best.combo || 0, ft.bestCombo); st.runden++; saveJson(FT_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('falten', Math.round(q * 100) / 10, 10, 'Schätzung ' + ft.schaetzung.toLocaleString('de-DE') + ' (richtig: ' + FT_MARS + ')', { schaetzung: ft.schaetzung, combo: ft.bestCombo, imTakt: ft.imTakt, rekord });
  if (typeof konfetti === 'function') konfetti(50, ['🔴', '📄', '✨', '🚀']);
  const urteil = abw === 0 ? '🎯 Exakt richtig!' : abw <= 3 ? '🔥 Fast perfekt geschätzt!' : ft.schaetzung > 1000 ? 'Die meisten schätzen Tausende – die Verdopplung ist einfach unvorstellbar schnell.' : abw <= 15 ? '👍 Gar nicht schlecht!' : 'Exponentielles Wachstum überrascht fast jeden.';
  const d = document.createElement('div'); d.className = 'ft-ergebnis';
  d.innerHTML = '<div class="ft-karte"><div class="ft-planet" aria-hidden="true"></div><h3>Mars erreicht!</h3>'
    + '<p class="ft-gross"><b>' + FT_MARS + '</b> Faltungen = ' + ftLaenge(ftHoehe(FT_MARS)) + '</p>'
    + '<p>Deine Schätzung: <b>' + ft.schaetzung.toLocaleString('de-DE') + '</b>' + (abw ? ' – ' + abw.toLocaleString('de-DE') + ' daneben' : '') + '.<br>' + urteil + '</p>'
    + (ft.bestCombo >= 2 ? '<p>🎵 Beste Takt-Combo: <b>' + ft.bestCombo + '</b> · ' + ft.imTakt + '× im Takt gefaltet</p>' : '')
    + '<p class="ft-klein">In echt schafft man kaum mehr als 7 Faltungen. Rekord: 12 Faltungen (Britney Gallivan, 2002) – mit einem sehr langen Papierstreifen.</p>'
    + '<div class="ft-karte-knoepfe"><button type="button" class="btn ft-los" id="ftWeiter">🚀 Weiter falten – bis zum nächsten Stern</button><button type="button" class="btn secondary" id="ftNochmal">Nochmal schätzen</button></div></div>';
  $('ftInhalt').appendChild(d);
  $('ftWeiter').addEventListener('click', () => { d.remove(); ft.fertig = false; ft.weiter = true; ft.text = 'Weiter Richtung Sonne …'; ftAnzeige(); });
  $('ftNochmal').addEventListener('click', () => ftIntro());
}
function ftFinale() {
  ft.fertig = true;
  if (typeof konfetti === 'function') konfetti(50, ['⭐', '✨', '📄']);
  const d = document.createElement('div'); d.className = 'ft-ergebnis';
  d.innerHTML = '<div class="ft-karte"><h3>⭐ Proxima Centauri!</h3><p class="ft-gross"><b>' + FT_ENDE + '</b> Faltungen = ' + ftLaenge(ftHoehe(FT_ENDE)) + '</p><p>Der nächste Stern nach der Sonne – mit einem einzigen Blatt Papier.</p><div class="ft-karte-knoepfe"><button type="button" class="btn ft-los" id="ftNochmal">Nochmal</button></div></div>';
  $('ftInhalt').appendChild(d);
  $('ftNochmal').addEventListener('click', () => ftIntro());
}
$('hubFalten').addEventListener('click', () => { merkeZuletzt('falten'); zoomZu($('hubFalten'), ftOeffnen); });
$('ftZurueck').addEventListener('click', () => { ftTaktStoppen(); cancelAnimationFrame(ftAnim); if (ft) { ftIntro(); ft = null; if ($('ftLos')) return; } zeigeHub(); });
