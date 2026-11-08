// 🎚️ Stimmgerät – übers Mikrofon, alles nur im Browser (nichts wird aufgenommen oder gesendet).
// Tonhöhe per YIN (Analyser 8192 Samples, halbiert abgetastet, Bereich 35–1600 Hz, parabolische Verfeinerung),
// geglättet über den Median der letzten Messungen. Chromatisch oder mit Saiten für Gitarre, Bass, Ukulele, Geige, Bratsche, Cello.
// Speicher: walquiz.stimmen.v1 = { inst, kammerton }
const SG_KEY = 'walquiz.stimmen.v1';
const SG_NAMEN = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'];
const SG_INST = {
  chromatisch: { name: 'Chromatisch', emoji: '🎚️', saiten: null, fmin: 35 },
  gitarre: { name: 'Gitarre', emoji: '🎸', saiten: [40, 45, 50, 55, 59, 64], namen: ['E', 'A', 'D', 'G', 'H', 'e'], fmin: 60 },
  bass: { name: 'E-Bass', emoji: '🎸', saiten: [28, 33, 38, 43], namen: ['E', 'A', 'D', 'G'], fmin: 35 },
  ukulele: { name: 'Ukulele', emoji: '🪕', saiten: [67, 60, 64, 69], namen: ['G', 'C', 'E', 'A'], fmin: 200 },
  geige: { name: 'Geige', emoji: '🎻', saiten: [55, 62, 69, 76], namen: ['G', 'D', 'A', 'E'], fmin: 160 },
  bratsche: { name: 'Bratsche', emoji: '🎻', saiten: [48, 55, 62, 69], namen: ['C', 'G', 'D', 'A'], fmin: 110 },
  cello: { name: 'Cello', emoji: '🎻', saiten: [36, 43, 50, 57], namen: ['C', 'G', 'D', 'A'], fmin: 55 },
};
// Stimmungen je Instrument (MIDI-Nummern von tief nach hoch bzw. in Spielreihenfolge, dazu die Saitennamen)
const SG_STIMMUNGEN = {
  gitarre: [
    ['standard', 'Standard', [40, 45, 50, 55, 59, 64], 'E A D G H e'],
    ['dropd', 'Drop D', [38, 45, 50, 55, 59, 64], 'D A D G H e'],
    ['halbton', 'Halbton tiefer (Es)', [39, 44, 49, 54, 58, 63], 'Es As Des Ges B es'],
    ['ganzton', 'Ganzton tiefer (D)', [38, 43, 48, 53, 57, 62], 'D G C F A d'],
    ['dropc', 'Drop C', [36, 43, 48, 53, 57, 62], 'C G C F A d'],
    ['dropb', 'Drop B', [35, 42, 47, 52, 56, 61], 'H Fis H E Gis cis'],
    ['dadgad', 'DADGAD', [38, 45, 50, 55, 57, 62], 'D A D G A d'],
    ['openg', 'Open G', [38, 43, 50, 55, 59, 62], 'D G D G H d'],
    ['opend', 'Open D', [38, 45, 50, 54, 57, 62], 'D A D Fis A d'],
    ['opene', 'Open E', [40, 47, 52, 56, 59, 64], 'E H E Gis H e'],
    ['openc', 'Open C', [36, 43, 48, 55, 60, 64], 'C G C G C e'],
  ],
  bass: [
    ['standard', 'Standard', [28, 33, 38, 43], 'E A D G'],
    ['dropd', 'Drop D', [26, 33, 38, 43], 'D A D G'],
    ['halbton', 'Halbton tiefer (Es)', [27, 32, 37, 42], 'Es As Des Ges'],
    ['fuenf', '5-Saiter (H E A D G)', [23, 28, 33, 38, 43], 'H E A D G'],
  ],
  ukulele: [
    ['standard', 'Standard (hohes g)', [67, 60, 64, 69], 'g C E A'],
    ['lowg', 'Low G (tiefes G)', [55, 60, 64, 69], 'G C E A'],
    ['dstimmung', 'D-Stimmung', [69, 62, 66, 71], 'a D Fis H'],
    ['bariton', 'Bariton', [50, 55, 59, 64], 'D G H E'],
  ],
  geige: [['standard', 'Standard', [55, 62, 69, 76], 'G D A E'], ['aeae', 'Fiddle AEAE', [57, 64, 69, 76], 'A E A E'], ['gdgd', 'Fiddle GDGD', [55, 62, 67, 74], 'G D G D']],
  bratsche: [['standard', 'Standard', [48, 55, 62, 69], 'C G D A']],
  cello: [['standard', 'Standard', [36, 43, 50, 57], 'C G D A'], ['scordatura', 'Scordatura (A → G)', [36, 43, 50, 55], 'C G D G']],
};
// Aktuelle Saiten des gewählten Instruments (Vorlage oder eigene Stimmung); null = chromatisch
function sgAktuell(inst = sg && sg.inst, store = sgStore()) {
  const liste = SG_STIMMUNGEN[inst]; if (!liste) return null;
  const id = (store.stimmung || {})[inst] || 'standard', eigen = (store.eigene || {})[inst];
  if (id === 'eigen' && Array.isArray(eigen) && liste.some((x) => x[2].length === eigen.length) && eigen.every((m) => Number.isInteger(m) && m >= 12 && m <= 96)) return { id, name: 'Eigene', saiten: eigen.slice(), namen: eigen.map((m) => SG_NAMEN[m % 12]) };
  const v = liste.find((x) => x[0] === id) || liste[0];
  return { id: v[0], name: v[1], saiten: v[2].slice(), namen: v[3].split(' ') };
}
const sgStimmungName = (inst, store) => { const a = sgAktuell(inst, store || sgStore()); return a ? a.name : ''; };
// tiefste messbare Frequenz: etwas unter der tiefsten Saite
const sgFmin = (inst) => { const a = sgAktuell(inst); return a ? Math.min(SG_INST[inst].fmin, sgHz(Math.min(...a.saiten), 440) * 0.8) : SG_INST[inst].fmin; };
let sg = null, sgRaf = 0;
const sgStore = () => { const s = loadJson(SG_KEY); if (!SG_INST[s.inst]) s.inst = 'gitarre'; if (!(s.kammerton >= 430 && s.kammerton <= 450)) s.kammerton = 440; s.stimmung = s.stimmung || {}; s.eigene = s.eigene || {}; return s; };
const sgHz = (midi, a4) => a4 * 2 ** ((midi - 69) / 12);
const sgName = (midi) => SG_NAMEN[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);

// Tonhöhe (YIN) aus x mit Abtastrate rate; null bei Stille/Rauschen
function sgYin(x, rate, fmin = 35, fmax = 1600) {
  const n = x.length, tauMin = Math.max(2, Math.floor(rate / fmax)), tauMax = Math.min(Math.floor(rate / fmin), Math.floor(n / 2) - 2), W = n - tauMax - 1;
  let e = 0; for (let i = 0; i < n; i++) e += x[i] * x[i];
  const rms = Math.sqrt(e / n);
  if (rms < 0.006 || W < tauMax) return null;
  const d = new Float32Array(tauMax + 2);
  for (let t = 1; t <= tauMax + 1; t++) { let s = 0; for (let j = 0; j < W; j++) { const v = x[j] - x[j + t]; s += v * v; } d[t] = s; }
  // kumulativ normiert
  let summe = 0; const c = new Float32Array(tauMax + 2); c[0] = 1;
  for (let t = 1; t <= tauMax + 1; t++) { summe += d[t]; c[t] = summe ? d[t] * t / summe : 1; }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) if (c[t] < 0.15) { while (t + 1 <= tauMax && c[t + 1] < c[t]) t++; tau = t; break; }
  if (tau < 0) { let m = 1; for (let t = tauMin; t <= tauMax; t++) if (c[t] < m) { m = c[t]; tau = t; } if (m > 0.35) return null; }
  const a = c[tau - 1], b = c[tau], cc = c[tau + 1], den = a - 2 * b + cc, feiner = den > 0 ? tau + 0.5 * (a - cc) / den : tau;
  return { f: rate / feiner, sicher: 1 - b, rms };
}

// ---------- Oberfläche ----------
function sgOeffnen(inst) {
  show('stimmen', '🎚️ Stimmgerät');
  const s = sgStore(); if (inst && SG_INST[inst]) { s.inst = inst; saveJson(SG_KEY, s); }
  sg = { inst: s.inst, a4: s.kammerton, an: false, verlauf: [], anzeige: null, gestimmt: {}, halten: {}, ziel: null, cent: 0, centA: 0, zuletzt: 0, ruhe: 0 };
  sgAufbau();
}
function sgAufbau() {
  const I = sgAktuell(), st = sgStore(), liste = SG_STIMMUNGEN[sg.inst];
  $('sgInhalt').innerHTML = '<div class="sg-wahl">' + Object.entries(SG_INST).map(([k, v]) => '<button type="button" data-inst="' + k + '" class="' + (k === sg.inst ? 'an' : '') + '">' + v.emoji + ' ' + v.name + '</button>').join('') + '</div>'
    + '<div class="sg-anzeige"><canvas id="sgBild" class="sg-bild"></canvas><div class="sg-ton"><b id="sgNote">–</b><span id="sgHz">Tippe auf „Stimmen starten“</span></div></div>'
    + (I ? '<div class="sg-stimmung"><label>Stimmung <select id="sgStimmung">' + liste.map((x) => '<option value="' + x[0] + '"' + (x[0] === I.id ? ' selected' : '') + '>' + x[1] + ' · ' + x[3] + '</option>').join('') + '<option value="eigen"' + (I.id === 'eigen' ? ' selected' : '') + '>Eigene' + (st.eigene[sg.inst] ? ' · ' + st.eigene[sg.inst].map((m) => SG_NAMEN[m % 12]).join(' ') : '') + '</option></select></label><button type="button" class="' + (sg.anpassen ? 'an' : '') + '" id="sgAnpassen">✏️ Anpassen</button></div>'
      + '<div class="sg-saiten" id="sgSaiten" style="--n:' + I.saiten.length + '">' + I.saiten.map((m, i) => '<button type="button" data-saite="' + i + '"><b>' + I.namen[i] + '</b><small>' + sgName(m) + '</small><i></i></button>').join('') + '</div>'
      + (sg.anpassen ? '<div class="sg-edit" style="--n:' + I.saiten.length + '">' + I.saiten.map((m, i) => '<span><button type="button" data-hoch="' + i + '" aria-label="Saite ' + (i + 1) + ' höher">▲</button><button type="button" data-tief="' + i + '" aria-label="Saite ' + (i + 1) + ' tiefer">▼</button></span>').join('') + '</div><p class="ft-klein sg-tipp">Jede Saite halbtonweise verstellen – wird als „Eigene“ Stimmung gespeichert.</p>' : '<p class="ft-klein sg-tipp">Saite antippen = nur diese Saite stimmen (nochmal tippen = automatisch).</p>')
    : '')
    + '<div class="sg-knoepfe"><button type="button" class="btn ft-los sg-los" id="sgStart">🎤 Stimmen starten</button><button type="button" class="btn secondary" id="sgRef">🔊 Ton</button></div>'
    + '<div class="sg-kammer"><span>Kammerton a′</span><button type="button" data-a4="-1" aria-label="tiefer">−</button><b id="sgA4">' + sg.a4 + ' Hz</b><button type="button" data-a4="1" aria-label="höher">+</button></div>'
    + '<p class="ft-klein">Das Mikrofon hört nur hier auf dem Gerät mit – nichts wird aufgenommen oder gesendet. Am besten jede Saite einzeln anschlagen und ausklingen lassen.</p>';
  const cv = $('sgBild'), dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.min(cv.clientWidth || 340, 520), H = Math.round(W * 0.52);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  Object.assign(sg, { ctx: cv.getContext('2d'), W, H, dpr });
  $('sgInhalt').querySelectorAll('[data-inst]').forEach((b) => b.addEventListener('click', () => { sg.inst = b.dataset.inst; sg.gestimmt = {}; sg.anpassen = false; sg.anzeige = null; sg.ziel = null; sg.verlauf = []; const s = sgStore(); s.inst = sg.inst; saveJson(SG_KEY, s); sgAufbau(); }));
  if ($('sgStimmung')) $('sgStimmung').addEventListener('change', (e) => {
    const s = sgStore(); s.stimmung[sg.inst] = e.target.value;
    if (e.target.value === 'eigen' && !s.eigene[sg.inst]) s.eigene[sg.inst] = sgAktuell(sg.inst, sgStore()).saiten;
    saveJson(SG_KEY, s); sg.gestimmt = {}; sg.ziel = null; sg.verlauf = []; sg.anzeige = null; sgAufbau();
  });
  if ($('sgAnpassen')) $('sgAnpassen').addEventListener('click', () => { sg.anpassen = !sg.anpassen; sgAufbau(); });
  $('sgInhalt').querySelectorAll('[data-hoch],[data-tief]').forEach((b) => b.addEventListener('click', () => {
    const s = sgStore(), saiten = sgAktuell(sg.inst, s).saiten, i = +(b.dataset.hoch ?? b.dataset.tief);
    saiten[i] = Math.max(12, Math.min(96, saiten[i] + (b.dataset.hoch != null ? 1 : -1)));
    s.eigene[sg.inst] = saiten; s.stimmung[sg.inst] = 'eigen'; saveJson(SG_KEY, s);
    delete sg.gestimmt[i]; sg.verlauf = []; sg.anzeige = null; sgAufbau();
    if (!sg.an) sgReferenz(saiten[i]);
  }));
  $('sgInhalt').querySelectorAll('[data-saite]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.saite; sg.ziel = sg.ziel === i ? null : i; sgSaitenZeigen(); }));
  $('sgInhalt').querySelectorAll('[data-a4]').forEach((b) => b.addEventListener('click', () => { sg.a4 = Math.max(430, Math.min(450, sg.a4 + +b.dataset.a4)); $('sgA4').textContent = sg.a4 + ' Hz'; const s = sgStore(); s.kammerton = sg.a4; saveJson(SG_KEY, s); }));
  $('sgStart').addEventListener('click', () => (sg.an ? sgStopp() : sgStart()));
  $('sgRef').addEventListener('click', sgReferenz);
  sgKnopf(); sgSaitenZeigen();
  cancelAnimationFrame(sgRaf); const lauf = () => { if (!sg) return; sgZeichnen(); sgRaf = requestAnimationFrame(lauf); }; sgRaf = requestAnimationFrame(lauf);
}
function sgKnopf() { if ($('sgStart')) { $('sgStart').textContent = sg.an ? '⏸ Pause' : '🎤 Stimmen starten'; $('sgStart').classList.toggle('an', sg.an); } }
async function sgStart() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('kein Mikrofon');
    if (typeof ftAudioVorMikrofon === 'function') ftAudioVorMikrofon();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    if (!sg || !$('screen-stimmen').classList.contains('active')) { stream.getTracks().forEach((t) => t.stop()); if (typeof ftAudioNachMikrofon === 'function') ftAudioNachMikrofon(); return; }
    const C = window.AudioContext || window.webkitAudioContext, c = new C(), src = c.createMediaStreamSource(stream), an = c.createAnalyser();
    if (c.state === 'suspended') c.resume();
    an.fftSize = 8192; src.connect(an);
    Object.assign(sg, { an: true, stream, c, src, analyser: an, puffer: new Float32Array(an.fftSize), halb: new Float32Array(an.fftSize / 2) });
    sg.timer = setInterval(sgMessen, 70);
    $('sgHz').textContent = 'Schlag eine Saite an …';
  } catch (e) {
    if (typeof ftAudioNachMikrofon === 'function') ftAudioNachMikrofon();
    $('sgHz').textContent = 'Kein Zugriff aufs Mikrofon – erlaube es in den iPhone-Einstellungen (Safari › Mikrofon).';
  }
  sgKnopf();
}
function sgStopp() {
  if (!sg) return;
  clearInterval(sg.timer);
  if (sg.stream) { sg.stream.getTracks().forEach((t) => t.stop()); try { sg.c.close(); } catch (e) { /* schon zu */ } sg.stream = null; if (typeof ftAudioNachMikrofon === 'function') ftAudioNachMikrofon(); }
  sg.an = false; sgKnopf();
}
function sgMessen() {
  if (!sg || !sg.an || performance.now() < sg.ruhe) return;
  sg.analyser.getFloatTimeDomainData(sg.puffer);
  const p = sg.puffer, h = sg.halb;
  for (let i = 0; i < h.length; i++) h[i] = (p[2 * i] + p[2 * i + 1]) / 2;   // halbe Abtastrate reicht und spart Rechenzeit
  let r = sgYin(h, sg.c.sampleRate / 2, sgFmin(sg.inst), 1600);
  // hohe Töne mit voller Abtastrate nachmessen (feinere Auflösung)
  if (r && r.f > 500) { const g = sgYin(p.subarray(0, 4096), sg.c.sampleRate, Math.max(400, r.f * 0.8), Math.min(2000, r.f * 1.25)); if (g) r = g; }
  if (!r) { if (performance.now() - sg.zuletzt > 1500) sg.verlauf = []; return; }
  sg.zuletzt = performance.now();
  sgVerarbeiten(r.f);
}
// Eine gemessene Frequenz verarbeiten (auch für Tests direkt aufrufbar)
function sgVerarbeiten(f) {
  const v = sg.verlauf; v.push(f); if (v.length > 7) v.shift();
  const med = v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)];
  // springt der Ton um mehr als einen Halbton, alte Werte verwerfen
  if (Math.abs(12 * Math.log2(f / med)) > 0.8 && v.length > 2) { sg.verlauf = [f]; }
  const fm = sg.verlauf.length >= 3 ? sg.verlauf.slice().sort((a, b) => a - b)[Math.floor(sg.verlauf.length / 2)] : f;
  const I = sgAktuell(), n = 69 + 12 * Math.log2(fm / sg.a4);
  let ziel, cent;
  if (I) {
    const i = sg.ziel != null ? sg.ziel : I.saiten.reduce((best, m, k) => (Math.abs(n - m) < Math.abs(n - I.saiten[best]) ? k : best), 0);
    ziel = { midi: I.saiten[i], saite: i }; cent = (n - I.saiten[i]) * 100;
  } else { const m = Math.round(n); ziel = { midi: m }; cent = (n - m) * 100; }
  Object.assign(sg, { anzeige: { f: fm, ziel, cent } });
  // gestimmt, wenn 0,8 s lang innerhalb ±5 Cent
  const k = ziel.saite != null ? ziel.saite : 'c', jetzt = performance.now();
  if (Math.abs(cent) <= 5) { if (!sg.halten[k]) sg.halten[k] = jetzt; if (jetzt - sg.halten[k] > 800 && !sg.gestimmt[k]) { sg.gestimmt[k] = true; if (navigator.vibrate) navigator.vibrate(30); sgSaitenZeigen(); } } else sg.halten[k] = 0;
  sgText();
}
function sgText() {
  const a = sg.anzeige; if (!a) return;
  const c = Math.round(a.cent), I = sgAktuell();
  $('sgNote').textContent = I && a.ziel.saite != null ? I.namen[a.ziel.saite] : sgName(a.ziel.midi).replace(/\d+$/, '');
  const ok = Math.abs(c) <= 5;
  $('sgHz').innerHTML = (ok ? '<span class="sg-ok">✓ gestimmt</span>' : Math.abs(c) > 50 ? (c < 0 ? 'viel zu tief – höher stimmen' : 'viel zu hoch – tiefer stimmen') : (c < 0 ? c + ' Cent · etwas zu tief' : '+' + c + ' Cent · etwas zu hoch'))
    + '<small>' + a.f.toFixed(1).replace('.', ',') + ' Hz · Ziel ' + sgName(a.ziel.midi) + ' = ' + sgHz(a.ziel.midi, sg.a4).toFixed(1).replace('.', ',') + ' Hz</small>';
  sgSaitenZeigen();
}
function sgSaitenZeigen() {
  if (!$('sgSaiten')) return;
  const a = sg.anzeige;
  $('sgSaiten').querySelectorAll('[data-saite]').forEach((b) => {
    const i = +b.dataset.saite;
    b.classList.toggle('ziel', sg.ziel === i); b.classList.toggle('aktiv', !!(a && a.ziel.saite === i)); b.classList.toggle('ok', !!sg.gestimmt[i]);
    b.querySelector('i').textContent = sg.gestimmt[i] ? '✓' : sg.ziel === i ? '🔒' : '';
  });
}
function sgZeichnen() {
  const { ctx: c, W, H, dpr } = sg; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.95, r = Math.min(W * 0.45, H * 0.85);
  // Skala −50 … +50 Cent auf 150°
  const winkel = (cent) => -Math.PI / 2 + (Math.max(-50, Math.min(50, cent)) / 50) * (Math.PI * 5 / 12);
  c.lineCap = 'round';
  c.lineWidth = 14; c.strokeStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.arc(cx, cy, r, winkel(-50), winkel(50)); c.stroke();
  c.strokeStyle = 'rgba(74,222,128,.55)'; c.beginPath(); c.arc(cx, cy, r, winkel(-5), winkel(5)); c.stroke();
  for (let k = -50; k <= 50; k += 10) { const w = winkel(k), l = k % 50 === 0 ? 16 : k === 0 ? 20 : 9; c.strokeStyle = k === 0 ? '#4ade80' : 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + Math.cos(w) * (r - 22), cy + Math.sin(w) * (r - 22)); c.lineTo(cx + Math.cos(w) * (r - 22 - l), cy + Math.sin(w) * (r - 22 - l)); c.stroke(); }
  c.fillStyle = 'rgba(199,208,245,.6)'; c.font = '600 11px system-ui'; c.textAlign = 'center';
  c.fillText('zu tief', cx + Math.cos(winkel(-42)) * (r + 2) , cy + Math.sin(winkel(-42)) * (r + 2) - 12); c.fillText('zu hoch', cx + Math.cos(winkel(42)) * (r + 2), cy + Math.sin(winkel(42)) * (r + 2) - 12);
  const a = sg.anzeige, frisch = a && performance.now() - sg.zuletzt < 1200;
  const zielCent = frisch ? a.cent : 0; sg.centA += (zielCent - sg.centA) * 0.25;
  const ok = frisch && Math.abs(a.cent) <= 5, farbe = !frisch ? 'rgba(255,255,255,.35)' : ok ? '#4ade80' : Math.abs(a.cent) <= 15 ? '#fde047' : '#fb7185';
  const w = winkel(sg.centA);
  c.strokeStyle = farbe; c.lineWidth = 4; c.shadowColor = farbe; c.shadowBlur = frisch ? 12 : 0;
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(w) * (r - 8), cy + Math.sin(w) * (r - 8)); c.stroke(); c.shadowBlur = 0;
  c.fillStyle = farbe; c.beginPath(); c.arc(cx, cy, 7, 0, 7); c.fill();
  if ($('sgNote')) $('sgNote').classList.toggle('ok', !!ok), $('sgNote').classList.toggle('alt', !frisch);
}
// Referenzton: Mikrofon kurz aus (sonst hört es sich selbst und am iPhone käme der Ton aus dem Hörer)
function sgReferenz(festerTon) {
  const I = sgAktuell(), a = sg.anzeige;
  const midi = typeof festerTon === 'number' ? festerTon : I ? I.saiten[sg.ziel != null ? sg.ziel : a && a.ziel.saite != null ? a.ziel.saite : 0] : a ? a.ziel.midi : 69;
  const warAn = sg.an; if (warAn) sgStopp();
  const A = ftAudio(); if (!A) return;
  const t = A.c.currentTime + 0.05, f = sgHz(midi, sg.a4), g = A.c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 2.4); g.connect(A.master);
  [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([k, typ, l]) => { const o = A.c.createOscillator(), og = A.c.createGain(); o.type = typ; o.frequency.value = f * k; og.gain.value = l; o.connect(og).connect(g); o.start(t); o.stop(t + 2.5); });
  $('sgHz').innerHTML = '🔊 ' + sgName(midi) + ' = ' + f.toFixed(1).replace('.', ',') + ' Hz' + (warAn ? '<small>Danach wieder „Stimmen starten“ tippen</small>' : '');
}
function sgHubText() {
  const el = $('hubStimmenBest'); if (!el) return;
  const s = loadJson(SG_KEY);
  if (!s.inst || !SG_INST[s.inst]) { el.textContent = 'Mikrofon an, Saite anschlagen'; return; }
  const name = sgStimmungName(s.inst, sgStore());
  el.textContent = 'Zuletzt: ' + SG_INST[s.inst].name + (name && name !== 'Standard' ? ' (' + name + ')' : '') + ' · a′ = ' + (s.kammerton || 440) + ' Hz';
}
sgHubText();
document.addEventListener('visibilitychange', () => { if (document.hidden && sg && sg.an) sgStopp(); });
$('hubStimmen').addEventListener('click', () => { merkeZuletzt('stimmen'); zoomZu($('hubStimmen'), () => sgOeffnen()); });
$('sgZurueck').addEventListener('click', () => { sgStopp(); cancelAnimationFrame(sgRaf); sg = null; zeigeHub(); sgHubText(); });
