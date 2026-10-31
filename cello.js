// 🎻 Cello-Noten: Noten lesen (Bass-, Tenor-, Violinschlüssel) und das Griffbrett in der 1. Lage lernen.
// Deutsche Notennamen (H statt B, B = B♭, Fis, Es …). Jeder Ton erklingt mit einem einfachen Cello-Klang.
const CELLO_KEY = 'walquiz.cello.v1';
const BUCHSTABEN = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];       // intern englisch, angezeigt deutsch
const HALBTOENE = [0, 2, 4, 5, 7, 9, 11];
const SAITEN = [{ name: 'C', midi: 36 }, { name: 'G', midi: 43 }, { name: 'D', midi: 50 }, { name: 'A', midi: 57 }];
// Finger in der 1. Lage je Halbton über der leeren Saite
const FINGER = ['leer', 'halbe Lage, 1. Finger', '1. Finger', '2. Finger', '3. Finger', '4. Finger'];

const note = (letter, acc, oct) => ({ letter, acc, oct });
const diaIndex = (n) => n.oct * 7 + BUCHSTABEN.indexOf(n.letter);
const midiVon = (n) => 12 * (n.oct + 1) + HALBTOENE[BUCHSTABEN.indexOf(n.letter)] + n.acc;
const SCHLUESSEL = {
  // y/groesse: Grundlinie und Schriftgröße des Schlüsselzeichens, so dass es auf der richtigen Linie sitzt
  bass:   { name: 'Bassschlüssel', zeichen: '\u{1D122}', unten: note('G', 0, 2), von: note('C', 0, 2), bis: note('C', 0, 4), y: 108, groesse: 52 },
  tenor:  { name: 'Tenorschlüssel', zeichen: '\u{1D121}', unten: note('D', 0, 3), von: note('C', 0, 3), bis: note('A', 0, 4), y: 100, groesse: 46 },
  violin: { name: 'Violinschlüssel', zeichen: '\u{1D11E}', unten: note('E', 0, 4), von: note('G', 0, 4), bis: note('E', 0, 5), y: 108, groesse: 52 },
};

// Deutscher Name einer Note
function deutsch(n) {
  if (n.letter === 'B') return n.acc === -1 ? 'B' : n.acc === 1 ? 'His' : 'H';
  const g = n.letter;
  if (!n.acc) return g;
  if (n.acc === 1) return g + 'is';
  return g === 'E' ? 'Es' : g === 'A' ? 'As' : g + 'es';
}
// Tasten zum Antworten: 7 Stammtöne oder alle 12 (schwarze mit beiden Namen)
const TASTEN_12 = [
  [0, 'C'], [1, 'Cis / Des'], [2, 'D'], [3, 'Dis / Es'], [4, 'E'], [5, 'F'],
  [6, 'Fis / Ges'], [7, 'G'], [8, 'Gis / As'], [9, 'A'], [10, 'Ais / B'], [11, 'H'],
];
// Eine Tonhöhe (MIDI) als Note schreiben – bei schwarzen Tasten zufällig mit ♯ oder ♭
function schreibe(midi, mitB = Math.random() < 0.5) {
  const pc = ((midi % 12) + 12) % 12, oct = Math.floor(midi / 12) - 1;
  const weiss = HALBTOENE.indexOf(pc);
  if (weiss >= 0) return note(BUCHSTABEN[weiss], 0, oct);
  if (mitB) { const i = HALBTOENE.indexOf(pc + 1); return note(BUCHSTABEN[i], -1, oct); }
  const i = HALBTOENE.indexOf(pc - 1); return note(BUCHSTABEN[i], 1, oct);
}

// ---------- Klang (Web Audio): zwei leicht verstimmte Sägezähne, gefiltert, mit Vibrato ----------
let audioCtx = null;
function spieleTon(midi, dauer = 1.1) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime, f = 440 * Math.pow(2, (midi - 69) / 12);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.09);
    gain.gain.setValueAtTime(0.2, t + dauer - 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = Math.min(2400, f * 6); filter.Q.value = 1.2;
    const vib = audioCtx.createOscillator(), vibTiefe = audioCtx.createGain();
    vib.frequency.value = 5.2; vibTiefe.gain.value = f * 0.006;
    vib.connect(vibTiefe);
    [-6, 6].forEach((cent) => {
      const o = audioCtx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cent;
      vibTiefe.connect(o.frequency);
      o.connect(filter); o.start(t); o.stop(t + dauer + 0.05);
    });
    vib.start(t); vib.stop(t + dauer + 0.05);
    filter.connect(gain).connect(audioCtx.destination);
  } catch (e) { /* ohne Ton weiterspielen */ }
}

// ---------- Notensystem als SVG ----------
const ZEILE = 12;              // Abstand der Notenlinien
function notenSvg(schluessel, n, opts = {}) {
  const S = SCHLUESSEL[schluessel];
  const W = 300, H = 170, unten = 112, x0 = 18, xNote = 190;
  const linien = Array.from({ length: 5 }, (_, i) => `<line x1="${x0}" x2="${W - 14}" y1="${unten - i * ZEILE}" y2="${unten - i * ZEILE}" />`).join('');
  let inhalt = '';
  if (n) {
    const p = diaIndex(n) - diaIndex(S.unten);           // 0 = unterste Linie, 1 = erster Zwischenraum …
    const y = unten - (p * ZEILE) / 2;
    let hilfs = '';
    for (let q = -2; q >= p; q -= 2) hilfs += `<line class="hilf" x1="${xNote - 16}" x2="${xNote + 16}" y1="${unten - (q * ZEILE) / 2}" y2="${unten - (q * ZEILE) / 2}" />`;
    for (let q = 10; q <= p; q += 2) hilfs += `<line class="hilf" x1="${xNote - 16}" x2="${xNote + 16}" y1="${unten - (q * ZEILE) / 2}" y2="${unten - (q * ZEILE) / 2}" />`;
    const hals = p < 4 ? `<line class="hals" x1="${xNote + 7.5}" x2="${xNote + 7.5}" y1="${y - 2}" y2="${y - 36}" />`
      : `<line class="hals" x1="${xNote - 7.5}" x2="${xNote - 7.5}" y1="${y + 2}" y2="${y + 36}" />`;
    const vz = n.acc ? `<text class="vz" x="${xNote - 32}" y="${y + (n.acc > 0 ? 10 : 6)}">${n.acc > 0 ? '♯' : '♭'}</text>` : '';
    inhalt = `<g class="note ${opts.klasse || ''}">${hilfs}${vz}<ellipse cx="${xNote}" cy="${y}" rx="8.2" ry="6" transform="rotate(-20 ${xNote} ${y})" />${hals}</g>`;
  } else if (opts.frage) {
    inhalt = `<text class="frage" x="${xNote}" y="${unten - 18}">?</text>`;
  }
  const schl = `<text class="schluessel" x="${x0 + 4}" y="${S.y}" font-size="${S.groesse}">${S.zeichen}</text>`;
  return `<svg class="noten-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${n ? 'Note im ' + S.name : S.name}">${linien}${schl}${inhalt}</svg>`;
}

// ---------- Griffbrett (1. Lage) als SVG ----------
// Spieler-Sicht: Saiten von links C, G, D, A. Oben der Sattel, darüber die „leeren“ Saiten.
function griffbrettSvg({ markiert = null, loesung = null, falsch = null, klickbar = false } = {}) {
  const W = 300, H = 340, xs = [66, 122, 178, 234], ySattel = 60, abstand = 46;
  const yPos = (k) => (k === 0 ? 34 : ySattel + (k - 0.5) * abstand);   // 0 = leere Saite über dem Sattel
  let s = `<defs><linearGradient id="ebenholz" x1="0" x2="1"><stop offset="0" stop-color="#1b1310"/><stop offset=".5" stop-color="#2a1d17"/><stop offset="1" stop-color="#1b1310"/></linearGradient></defs>`;
  s += `<path d="M44 ${ySattel} L256 ${ySattel} L268 ${H} L32 ${H} Z" fill="url(#ebenholz)" stroke="#5a3e2b" stroke-width="2"/>`;
  s += `<rect x="40" y="${ySattel - 6}" width="220" height="7" rx="2" fill="#efe3c8"/>`;
  // Lagen-Hilfslinien (nur zur Orientierung, ein Cello hat keine Bünde)
  for (let k = 1; k <= 5; k++) s += `<line x1="${48 - k}" x2="${252 + k}" y1="${ySattel + k * abstand}" y2="${ySattel + k * abstand}" stroke="rgba(255,255,255,0.06)" />`;
  SAITEN.forEach((sa, i) => {
    s += `<line x1="${xs[i]}" x2="${xs[i] + (i - 1.5) * 4}" y1="${ySattel - 6}" y2="${H}" stroke="#d9c7a0" stroke-width="${4.2 - i * 0.7}" />`;
    s += `<text class="saite" x="${xs[i]}" y="16">${sa.name}</text>`;
  });
  // Tipp-Punkte: leere Saite (über dem Sattel) und 5 Halbtöne
  SAITEN.forEach((sa, i) => {
    for (let k = 0; k <= 5; k++) {
      const x = xs[i] + (k === 0 ? 0 : ((i - 1.5) * 4 * (yPos(k) - ySattel)) / (H - ySattel));
      const y = yPos(k);
      const id = i + '-' + k;
      const cls = ['punkt', klickbar ? 'klick' : '', markiert === id ? 'markiert' : '', loesung === id ? 'loesung' : '', falsch === id ? 'falsch' : ''].join(' ');
      const beschr = loesung === id ? `<text class="finger" x="${x}" y="${y + 5}">${k === 0 ? '0' : k === 1 ? '1' : k - 1}</text>` : '';
      s += `<g class="${cls}" data-pos="${id}"><circle cx="${x}" cy="${y}" r="${k === 0 ? 13 : 16}"/>${beschr}</g>`;
    }
  });
  return `<svg class="griff-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cello-Griffbrett, 1. Lage">${s}</svg>`;
}
const posMidi = (pos) => { const [i, k] = pos.split('-').map(Number); return SAITEN[i].midi + k; };
const posText = (pos) => { const [i, k] = pos.split('-').map(Number); return SAITEN[i].name + '-Saite, ' + FINGER[k]; };

// ---------- Spiel ----------
const CELLO_MODI = {
  lesen: { name: 'Noten lesen', emoji: '📖', text: 'Note sehen, Namen tippen' },
  finden: { name: 'Griffbrett finden', emoji: '🎻', text: 'Note sehen, Stelle auf dem Griffbrett tippen' },
  benennen: { name: 'Griffbrett lesen', emoji: '🔎', text: 'Stelle sehen, Ton benennen' },
};
let cs = null;   // Cello-Spielzustand
const celloOpt = { modus: 'lesen', schluessel: ['bass'], vorzeichen: false, speed: false };

function celloIntro() {
  const st = loadJson(CELLO_KEY);
  $('celloModi').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.modus === celloOpt.modus));
  $('celloSchluessel').querySelectorAll('button').forEach((b) => b.classList.toggle('on', celloOpt.schluessel.includes(b.dataset.s)));
  $('celloSchluesselZeile').hidden = celloOpt.modus !== 'lesen';
  $('celloVz').checked = celloOpt.vorzeichen;
  $('celloSpeed').checked = celloOpt.speed;
  const best = st.best || {};
  $('celloBest').textContent = '60-Sek.-Rekorde: ' + Object.entries(CELLO_MODI).map(([k, m]) => m.emoji + ' ' + (best[k] != null ? best[k] : '–')).join(' · ');
  celloTeil('intro');
}
function celloTeil(t) { ['intro', 'spiel', 'ende'].forEach((x) => { $('cello-' + x).hidden = x !== t; }); }

function celloStart() {
  cs = { ...celloOpt, schluessel: celloOpt.schluessel.slice(), richtig: 0, gesamt: 0, serie: 0, besteSerie: 0, aufgabe: null, ende: celloOpt.speed ? Date.now() + 60000 : null };
  celloTeil('spiel');
  $('celloModusTitel').textContent = CELLO_MODI[cs.modus].emoji + ' ' + CELLO_MODI[cs.modus].name;
  clearInterval(cs.timer);
  if (cs.ende) {
    cs.timer = setInterval(() => {
      const rest = Math.max(0, cs.ende - Date.now());
      $('celloZeit').textContent = Math.ceil(rest / 1000) + ' s';
      $('celloZeitBar').style.width = (rest / 600) + '%';
      if (!rest) celloEnde();
    }, 100);
  }
  $('celloZeitBox').hidden = !cs.ende;
  celloNeueAufgabe();
}

function zufallsAufgabe() {
  if (cs.modus === 'lesen') {
    const schl = cs.schluessel[Math.floor(Math.random() * cs.schluessel.length)];
    const S = SCHLUESSEL[schl];
    let n;
    do {
      const d = diaIndex(S.von) + Math.floor(Math.random() * (diaIndex(S.bis) - diaIndex(S.von) + 1));
      const acc = cs.vorzeichen && Math.random() < 0.4 ? (Math.random() < 0.5 ? 1 : -1) : 0;
      n = note(BUCHSTABEN[d % 7], acc, Math.floor(d / 7));
    } while (['E1', 'B1', 'F-1', 'C-1'].includes(n.letter + n.acc));   // Eis, His, Fes, Ces weglassen
    return { schluessel: schl, note: n, midi: midiVon(n) };
  }
  // Griffbrett: eine Stelle in der 1. Lage; ohne Vorzeichen nur Stammtöne
  let pos, midi;
  do {
    pos = Math.floor(Math.random() * 4) + '-' + Math.floor(Math.random() * 6);
    midi = posMidi(pos);
  } while ((!cs.vorzeichen && HALBTOENE.indexOf(midi % 12) < 0) || (cs.aufgabe && cs.aufgabe.pos === pos));
  return { schluessel: 'bass', note: schreibe(midi), midi, pos };
}

function celloNeueAufgabe() {
  cs.aufgabe = zufallsAufgabe();
  cs.gesperrt = false;
  const a = cs.aufgabe;
  $('celloFeedback').textContent = cs.modus === 'benennen' ? 'Welcher Ton wird hier gegriffen?' : cs.modus === 'finden' ? 'Wo greifst du diesen Ton?' : 'Wie heißt diese Note?';
  $('celloFeedback').className = 'cello-feedback';
  $('celloStand').textContent = cs.richtig + ' / ' + cs.gesamt + (cs.serie > 2 ? ' · 🔥 ' + cs.serie : '');
  $('celloNoten').innerHTML = cs.modus === 'benennen' ? notenSvg('bass', null, { frage: true }) : notenSvg(a.schluessel, a.note);
  $('celloSchluesselName').textContent = cs.modus === 'benennen' ? '' : SCHLUESSEL[a.schluessel].name;
  const griff = $('celloGriff');
  griff.hidden = cs.modus === 'lesen';
  $('cello-spiel').classList.toggle('mit-griff', !griff.hidden);
  if (!griff.hidden) {
    griff.innerHTML = griffbrettSvg({ markiert: cs.modus === 'benennen' ? a.pos : null, klickbar: cs.modus === 'finden' });
    if (cs.modus === 'finden') griff.querySelectorAll('.punkt').forEach((g) => g.addEventListener('click', () => celloAntwort(g.dataset.pos)));
  }
  const tasten = $('celloTasten');
  tasten.hidden = cs.modus === 'finden';
  if (!tasten.hidden) {
    tasten.innerHTML = '';
    tasten.classList.toggle('alle', cs.vorzeichen);
    TASTEN_12.filter(([pc]) => cs.vorzeichen || HALBTOENE.includes(pc)).forEach(([pc, name]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'taste' + (HALBTOENE.includes(pc) ? '' : ' schwarz');
      b.textContent = name;
      b.dataset.pc = pc;
      b.addEventListener('click', () => celloAntwort(pc, b));
      tasten.appendChild(b);
    });
  }
}

function celloAntwort(wert, knopf) {
  if (cs.gesperrt) return;
  cs.gesperrt = true;
  const a = cs.aufgabe;
  const ok = cs.modus === 'finden' ? posMidi(wert) === a.midi : Number(wert) === a.midi % 12;
  cs.gesamt++;
  if (ok) { cs.richtig++; cs.serie++; cs.besteSerie = Math.max(cs.besteSerie, cs.serie); } else cs.serie = 0;
  spieleTon(a.midi);
  if (navigator.vibrate) navigator.vibrate(ok ? 15 : [30, 40, 30]);

  const name = deutsch(a.note);
  const fb = $('celloFeedback');
  fb.className = 'cello-feedback ' + (ok ? 'ok' : 'bad');
  fb.textContent = (ok ? '✓ Richtig: ' : '✗ Das ist ein ') + name + (a.pos ? ' – ' + posText(a.pos) : '');
  $('celloStand').textContent = cs.richtig + ' / ' + cs.gesamt + (cs.serie > 2 ? ' · 🔥 ' + cs.serie : '');
  if (ok) plusEins(knopf || $('celloGriff'));

  // Auflösung zeigen: Note im System, Stelle auf dem Griffbrett, richtige Taste
  if (cs.modus !== 'lesen') {
    $('celloNoten').innerHTML = notenSvg('bass', a.note, { klasse: ok ? 'ok' : 'bad' });
    $('celloGriff').innerHTML = griffbrettSvg({ loesung: a.pos, falsch: cs.modus === 'finden' && !ok ? wert : null });
  } else {
    $('celloNoten').innerHTML = notenSvg(a.schluessel, a.note, { klasse: ok ? 'ok' : 'bad' });
  }
  $('celloTasten').querySelectorAll('.taste').forEach((b) => {
    if (Number(b.dataset.pc) === a.midi % 12) b.classList.add('richtig');
    else if (b === knopf) b.classList.add('falsch');
  });
  // In der 60-Sekunden-Runde geht es schnell weiter, beim Üben bleibt Zeit zum Anschauen
  setTimeout(() => { if (cs && !$('cello-spiel').hidden) celloNeueAufgabe(); }, cs.ende ? (ok ? 450 : 1100) : (ok ? 900 : 1800));
}

function celloEnde() {
  clearInterval(cs.timer);
  const st = loadJson(CELLO_KEY);
  st.best = st.best || {};
  const rekord = st.best[cs.modus] == null || cs.richtig > st.best[cs.modus];
  if (rekord) st.best[cs.modus] = cs.richtig;
  saveJson(CELLO_KEY, st);
  celloTeil('ende');
  hochzaehlen($('celloErgebnis'), cs.richtig, ' richtig');
  $('celloErgebnisText').textContent = (rekord ? '🏆 Neuer Rekord! ' : '') + cs.gesamt + ' Versuche · beste Serie ' + cs.besteSerie;
  if (rekord && cs.richtig >= 10) setTimeout(() => konfetti(40, ['🎻', '🎵', '🎶', '✨']), 400);
}

// ---------- Knöpfe ----------
$('celloModi').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { celloOpt.modus = b.dataset.modus; celloIntro(); }));
$('celloSchluessel').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  const s = b.dataset.s;
  if (celloOpt.schluessel.includes(s)) { if (celloOpt.schluessel.length > 1) celloOpt.schluessel = celloOpt.schluessel.filter((x) => x !== s); }
  else celloOpt.schluessel.push(s);
  celloIntro();
}));
$('celloVz').addEventListener('change', (e) => { celloOpt.vorzeichen = e.target.checked; });
$('celloSpeed').addEventListener('change', (e) => { celloOpt.speed = e.target.checked; });
$('celloLos').addEventListener('click', () => { spieleTon(48, 0.6); celloStart(); });
$('celloStopp').addEventListener('click', () => (cs && cs.ende ? celloEnde() : (clearInterval(cs && cs.timer), celloIntro())));
$('celloNochmal').addEventListener('click', celloStart);
$('celloMenue').addEventListener('click', celloIntro);
$('celloZurueck').addEventListener('click', () => { if (cs) clearInterval(cs.timer); cs = null; zeigeHub(); });
