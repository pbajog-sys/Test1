// 🎻 Cello-Noten: Noten lesen (Bass-, Tenor-, Violinschlüssel) und die Lagen auf dem Griffbrett lernen.
// Deutsche Notennamen (H statt B, B = B♭, Fis, Es …). Jeder Ton erklingt mit einem einfachen Cello-Klang.
const CELLO_KEY = 'walquiz.cello.v1';
const BUCHSTABEN = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];       // intern englisch, angezeigt deutsch
const HALBTOENE = [0, 2, 4, 5, 7, 9, 11];
const SAITEN = [{ name: 'C', midi: 36 }, { name: 'G', midi: 43 }, { name: 'D', midi: 50 }, { name: 'A', midi: 57 }];

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

// ---------- Lagen ----------
// Zählung wie in deutschen Celloschulen: Die Lage bestimmt der 2. Finger, gemessen an den Stammtönen der A-Saite
// (halbe Lage = H, 1. = C, 2. = D, 3. = E, 4. = F, 5. = G, 6. = A, 7. = H, Daumenlage = C eine Oktave höher).
// z = Halbtöne des 2. Fingers über der leeren Saite – gilt so auf jeder Saite.
// Enge Haltung: 1. Finger einen Halbton unter dem 2., 3. und 4. Finger je einen Halbton darüber.
// Halbe bis 4. Lage: vier Finger. 5. bis 7. Lage: drei Finger (der kleine Finger reicht nicht mehr).
// Daumenlage: Daumen auf der Oktave, dann 1., 2., 3. Finger.
const LAGEN = {
  halb: { name: 'Halbe Lage', z: 2, finger: 4 },
  1: { name: '1. Lage', z: 3, finger: 4 },
  2: { name: '2. Lage', z: 5, finger: 4 },
  3: { name: '3. Lage', z: 7, finger: 4 },
  4: { name: '4. Lage', z: 8, finger: 4 },
  5: { name: '5. Lage', z: 10, finger: 3 },
  6: { name: '6. Lage', z: 12, finger: 3 },
  7: { name: '7. Lage', z: 14, finger: 3 },
  daumen: { name: 'Daumenlage', z: 15, finger: 3, daumen: true },
};
// Alle Griffe einer Lage: { finger: '0' | 'D' | '1'…'4', off: Halbtöne über der leeren Saite }
function griffe(lageId) {
  const L = LAGEN[lageId];
  const g = [];
  if (lageId === 'halb' || lageId === '1') g.push({ finger: '0', off: 0 });
  if (L.daumen) g.push({ finger: 'D', off: L.z - 3 });
  for (let f = 1; f <= L.finger; f++) g.push({ finger: String(f), off: L.z - 2 + f });
  return g;
}
const fingerText = (f) => (f === '0' ? 'leere Saite' : f === 'D' ? 'Daumen' : f + '. Finger');

// Stufen wie bei den Quizzes – jede schließt die vorigen Lagen mit ein
const CELLO_STUFEN = [
  { lvl: 1, name: 'Seepferdchen', emoji: '🐴', lagen: ['1'], neu: ['1'], schluessel: ['bass'] },
  { lvl: 2, name: 'Bronze', emoji: '🥉', lagen: ['halb', '1', '2', '3', '4'], neu: ['halb', '2', '3', '4'], schluessel: ['bass', 'tenor'] },
  { lvl: 3, name: 'Silber', emoji: '🥈', lagen: ['halb', '1', '2', '3', '4', '5', '6', '7'], neu: ['5', '6', '7'], schluessel: ['bass', 'tenor', 'violin'] },
  { lvl: 4, name: 'Gold', emoji: '🥇', lagen: ['halb', '1', '2', '3', '4', '5', '6', '7', 'daumen'], neu: ['daumen'], schluessel: ['bass', 'tenor', 'violin'] },
];
const stufeCello = (lvl) => CELLO_STUFEN.find((s) => s.lvl === lvl);

// ---------- Griffbrett-Ausschnitt einer Lage als SVG ----------
// Spieler-Sicht: Saiten von links C, G, D, A. Gezeigt wird der Teil des Griffbretts, auf dem die Hand liegt;
// links eine kleine Hals-Karte, die zeigt, wo dieser Ausschnitt auf der ganzen Saite liegt.
// nurStamm: ohne Vorzeichen – Finger, die keinen Stammton ergeben, werden ausgegraut (so greifen Anfänger:
// z. B. 1. Lage D-Saite: D, E = 1., F = 2., 3. Finger frei, G = 4.). Jede Reihe ist ein Halbton.
function griffbrettSvg(lageId, { markiert = null, loesung = null, falsch = null, klickbar = false, nurStamm = false } = {}) {
  const g = griffe(lageId);
  const offs = g.map((x) => x.off);
  const mitSattel = offs.includes(0);
  const von = mitSattel ? 1 : Math.min(...offs) - 1, bis = Math.max(...offs) + 1;
  const reihe = 50, oben = mitSattel ? 70 : 26, W = 320;
  const H = oben + (bis - von + 1) * reihe + 10;
  const xs = [96, 152, 208, 264];
  const yOff = (o) => (o === 0 ? 38 : oben + (o - von + 0.5) * reihe);
  let s = `<defs><linearGradient id="ebenholz" x1="0" x2="1"><stop offset="0" stop-color="#1b1310"/><stop offset=".5" stop-color="#2a1d17"/><stop offset="1" stop-color="#1b1310"/></linearGradient></defs>`;
  s += `<rect x="72" y="${oben - (mitSattel ? 8 : 18)}" width="216" height="${H - oben + (mitSattel ? 8 : 18)}" rx="${mitSattel ? 3 : 14}" fill="url(#ebenholz)" stroke="#5a3e2b" stroke-width="2"/>`;
  if (mitSattel) s += `<rect x="68" y="${oben - 8}" width="224" height="7" rx="2" fill="#efe3c8"/>`;
  for (let o = von; o <= bis; o++) s += `<line x1="76" x2="284" y1="${oben + (o - von) * reihe}" y2="${oben + (o - von) * reihe}" stroke="rgba(255,255,255,0.05)"/>`;
  SAITEN.forEach((sa, i) => {
    s += `<line x1="${xs[i]}" x2="${xs[i]}" y1="${oben - (mitSattel ? 8 : 18)}" y2="${H}" stroke="#d9c7a0" stroke-width="${4.2 - i * 0.7}"/>`;
    s += `<text class="saite" x="${xs[i]}" y="16">${sa.name}</text>`;
  });
  // Hals-Karte: ganze Saite von Sattel bis zur Doppeloktave, mit echten Abständen, Ausschnitt hervorgehoben
  const kTop = 30, kH = H - 44, laenge = (n) => 1 - Math.pow(2, -n / 12);
  const ky = (n) => kTop + (laenge(n) / laenge(24)) * kH;
  s += `<rect x="20" y="${kTop}" width="14" height="${kH}" rx="7" fill="rgba(255,255,255,0.08)"/>`;
  s += `<rect x="20" y="${ky(Math.max(0, Math.min(...offs) - 0.5))}" width="14" height="${Math.max(6, ky(Math.max(...offs) + 0.5) - ky(Math.max(0, Math.min(...offs) - 0.5)))}" rx="5" fill="#f3d9a4"/>`;
  s += `<line x1="16" x2="38" y1="${ky(12)}" y2="${ky(12)}" stroke="rgba(243,217,164,0.6)" stroke-dasharray="3 2"/><text class="karte" x="44" y="${ky(12) + 4}">8va</text>`;
  // Griffstellen mit Fingernummer
  SAITEN.forEach((sa, i) => {
    g.forEach(({ finger, off }) => {
      const id = i + '-' + off, x = xs[i], y = yOff(off);
      const frei = nurStamm && HALBTOENE.indexOf((sa.midi + off) % 12) < 0 && ![markiert, loesung, falsch].includes(id);
      const cls = ['punkt', frei ? 'frei' : klickbar ? 'klick' : '', markiert === id ? 'markiert' : '', loesung === id ? 'loesung' : '', falsch === id ? 'falsch' : ''].join(' ');
      s += `<g class="${cls}" data-pos="${id}"><circle cx="${x}" cy="${y}" r="${off === 0 ? 13 : 17}"/><text class="finger" x="${x}" y="${y + 5}">${finger}</text></g>`;
    });
  });
  return `<svg class="griff-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cello-Griffbrett, ${LAGEN[lageId].name}">${s}</svg>`;
}
const posMidi = (pos) => { const [i, off] = pos.split('-').map(Number); return SAITEN[i].midi + off; };
function posText(pos, lageId) {
  const [i, off] = pos.split('-').map(Number);
  const gr = griffe(lageId).find((x) => x.off === off);
  return SAITEN[i].name + '-Saite · ' + LAGEN[lageId].name + ' · ' + fingerText(gr ? gr.finger : '?');
}

// ---------- Spiel ----------
const CELLO_MODI = {
  lesen: { name: 'Noten lesen', emoji: '📖' },
  finden: { name: 'Griff finden', emoji: '🎻' },
  benennen: { name: 'Griff lesen', emoji: '🔎' },
  test: { name: 'Abzeichen-Test', emoji: '🎖️' },
};
const CELLO_TEST_LEN = 10, CELLO_TEST_PASS = 8;
let cs = null;   // Cello-Spielzustand
const celloOpt = { modus: 'finden', stufe: 1, lage: 'alle', vorzeichen: false, speed: false };

function celloIntro() {
  const st = loadJson(CELLO_KEY);
  const badges = st.badges || {};
  const stufe = stufeCello(celloOpt.stufe);
  $('celloModi').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.modus === celloOpt.modus));
  // Stufen
  const sb = $('celloStufen');
  sb.innerHTML = '';
  CELLO_STUFEN.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = (s.lvl === celloOpt.stufe ? 'on' : '') + (badges[s.lvl] ? ' geschafft' : '');
    b.innerHTML = '<span></span><b></b><small></small>';
    b.querySelector('span').textContent = s.emoji;
    b.querySelector('b').textContent = s.name;
    b.querySelector('small').textContent = s.lvl === 1 ? '1. Lage' : s.lvl === 2 ? 'bis 4. Lage' : s.lvl === 3 ? 'bis 7. Lage' : '+ Daumenlage';
    b.addEventListener('click', () => { celloOpt.stufe = s.lvl; celloOpt.lage = 'alle'; celloOpt.vorzeichen = s.lvl > 1; celloIntro(); });
    sb.appendChild(b);
  });
  // Einzelne Lage zum gezielten Üben
  const lb = $('celloLagen');
  lb.innerHTML = '';
  ['alle', ...stufe.lagen].forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = l === celloOpt.lage ? 'on' : '';
    b.textContent = l === 'alle' ? 'Alle' : l === 'halb' ? '½' : l === 'daumen' ? 'Daumen' : l + '.';
    b.addEventListener('click', () => { celloOpt.lage = l; celloIntro(); });
    lb.appendChild(b);
  });
  $('celloLagenZeile').hidden = celloOpt.modus === 'test' || stufe.lagen.length < 2;
  $('celloVz').checked = celloOpt.vorzeichen;
  $('celloSpeed').checked = celloOpt.speed;
  $('celloSpeedZeile').hidden = celloOpt.modus === 'test';
  $('celloLos').textContent = celloOpt.modus === 'test' ? stufe.emoji + ' Abzeichen-Test starten' : 'Los geht’s 🎵';
  const best = st.best || {};
  $('celloBest').textContent = 'Abzeichen: ' + CELLO_STUFEN.map((s) => (badges[s.lvl] ? s.emoji : '·')).join(' ')
    + ' · 60-Sek.-Rekord: ' + (best.alle != null ? best.alle : '–');
  celloTeil('intro');
}
function celloTeil(t) { ['intro', 'spiel', 'ende'].forEach((x) => { $('cello-' + x).hidden = x !== t; }); }

function celloStart() {
  const stufe = stufeCello(celloOpt.stufe);
  const test = celloOpt.modus === 'test';
  cs = {
    ...celloOpt, stufeObj: stufe, test, richtig: 0, gesamt: 0, serie: 0, besteSerie: 0, aufgabe: null,
    ende: !test && celloOpt.speed ? Date.now() + 60000 : null,
  };
  celloTeil('spiel');
  $('celloModusTitel').textContent = CELLO_MODI[cs.modus].emoji + ' ' + (test ? stufe.emoji + ' ' + stufe.name : CELLO_MODI[cs.modus].name);
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

// Eine Lage aus der Stufe ziehen – neue Lagen der Stufe kommen öfter dran
function zieheLage() {
  if (cs.lage !== 'alle') return cs.lage;
  const S = cs.stufeObj;
  const pool = Math.random() < 0.6 ? S.neu : S.lagen;
  return pool[Math.floor(Math.random() * pool.length)];
}
// Passender Schlüssel für eine Note: wie in Cellonoten üblich, tiefe Noten im Bass-, mittlere im Tenor-, hohe im Violinschlüssel
function schluesselFuer(midi) {
  const erlaubt = cs.stufeObj.schluessel;
  const passt = (s) => (s === 'bass' ? midi <= 64 : s === 'tenor' ? midi >= 48 && midi <= 72 : midi >= 65);
  const moeglich = erlaubt.filter(passt);
  return moeglich.length ? moeglich[Math.floor(Math.random() * moeglich.length)] : midi > 64 ? (erlaubt.includes('tenor') ? 'tenor' : 'bass') : 'bass';
}

function zufallsAufgabe() {
  const modus = cs.test ? ['lesen', 'finden', 'benennen'][Math.floor(Math.random() * 3)] : cs.modus;
  const vz = cs.test ? cs.stufeObj.lvl > 1 : cs.vorzeichen;
  let lageId, pos, midi;
  do {
    lageId = zieheLage();
    const g = griffe(lageId);
    const gr = g[Math.floor(Math.random() * g.length)];
    pos = Math.floor(Math.random() * 4) + '-' + gr.off;
    midi = posMidi(pos);
  } while ((!vz && HALBTOENE.indexOf(midi % 12) < 0) || (cs.aufgabe && cs.aufgabe.pos === pos));
  const n = schreibe(midi);
  return { modus, lageId, pos, midi, note: n, schluessel: schluesselFuer(midi), vz };
}

function celloNeueAufgabe() {
  cs.aufgabe = zufallsAufgabe();
  cs.gesperrt = false;
  const a = cs.aufgabe;
  const lageName = LAGEN[a.lageId].name;
  $('celloFeedback').className = 'cello-feedback';
  $('celloFeedback').textContent = a.modus === 'benennen' ? 'Welcher Ton ist das?' : a.modus === 'finden' ? 'Wo greifst du diesen Ton in der ' + lageName + '?' : 'Wie heißt diese Note?';
  $('celloStand').textContent = cs.test ? (cs.gesamt + 1) + ' / ' + CELLO_TEST_LEN : cs.richtig + ' / ' + cs.gesamt + (cs.serie > 2 ? ' · 🔥 ' + cs.serie : '');
  $('celloNoten').innerHTML = a.modus === 'benennen' ? notenSvg(a.schluessel, null, { frage: true }) : notenSvg(a.schluessel, a.note);
  $('celloSchluesselName').textContent = a.modus === 'benennen' ? '' : SCHLUESSEL[a.schluessel].name;
  const griff = $('celloGriff');
  griff.hidden = a.modus === 'lesen';
  $('celloLageName').hidden = griff.hidden;
  $('celloLageName').textContent = lageName;
  $('celloLegende').hidden = griff.hidden;
  $('celloLegende').textContent = 'Eine Reihe = Halbton' + (a.vz ? '' : ' · gestrichelt = Finger wird hier nicht gebraucht');
  $('cello-spiel').classList.toggle('mit-griff', !griff.hidden);
  if (!griff.hidden) {
    griff.innerHTML = griffbrettSvg(a.lageId, { markiert: a.modus === 'benennen' ? a.pos : null, klickbar: a.modus === 'finden', nurStamm: !a.vz });
    if (a.modus === 'finden') griff.querySelectorAll('.punkt.klick').forEach((p) => p.addEventListener('click', () => celloAntwort(p.dataset.pos)));
  }
  const tasten = $('celloTasten');
  tasten.hidden = a.modus === 'finden';
  if (!tasten.hidden) {
    tasten.innerHTML = '';
    tasten.classList.toggle('alle', a.vz);
    TASTEN_12.filter(([pc]) => a.vz || HALBTOENE.includes(pc)).forEach(([pc, name]) => {
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
  const ok = a.modus === 'finden' ? posMidi(wert) === a.midi : Number(wert) === a.midi % 12;
  cs.gesamt++;
  if (ok) { cs.richtig++; cs.serie++; cs.besteSerie = Math.max(cs.besteSerie, cs.serie); } else cs.serie = 0;
  spieleTon(a.midi);
  if (navigator.vibrate) navigator.vibrate(ok ? 15 : [30, 40, 30]);

  const fb = $('celloFeedback');
  fb.className = 'cello-feedback ' + (ok ? 'ok' : 'bad');
  fb.textContent = (ok ? '✓ ' : '✗ Richtig ist: ') + deutsch(a.note) + ' – ' + posText(a.pos, a.lageId);
  $('celloStand').textContent = cs.test ? cs.gesamt + ' / ' + CELLO_TEST_LEN : cs.richtig + ' / ' + cs.gesamt + (cs.serie > 2 ? ' · 🔥 ' + cs.serie : '');
  if (ok) plusEins(knopf || $('celloGriff'));

  // Auflösung: Note im System, Griff auf dem Griffbrett (auch beim reinen Notenlesen), richtige Taste
  $('celloNoten').innerHTML = notenSvg(a.schluessel, a.note, { klasse: ok ? 'ok' : 'bad' });
  $('celloSchluesselName').textContent = SCHLUESSEL[a.schluessel].name;
  $('celloGriff').hidden = false;
  $('celloLageName').hidden = false;
  $('celloLegende').hidden = false;
  $('celloLegende').textContent = 'Eine Reihe = Halbton' + (a.vz ? '' : ' · gestrichelt = Finger wird hier nicht gebraucht');
  $('cello-spiel').classList.add('mit-griff');
  $('celloGriff').innerHTML = griffbrettSvg(a.lageId, { loesung: a.pos, falsch: a.modus === 'finden' && !ok ? wert : null, nurStamm: !a.vz });
  $('celloTasten').querySelectorAll('.taste').forEach((b) => {
    if (Number(b.dataset.pc) === a.midi % 12) b.classList.add('richtig');
    else if (b === knopf) b.classList.add('falsch');
  });
  const weiter = () => {
    if (!cs || $('cello-spiel').hidden) return;
    if (cs.test && cs.gesamt >= CELLO_TEST_LEN) celloEnde(); else celloNeueAufgabe();
  };
  setTimeout(weiter, cs.ende ? (ok ? 600 : 1300) : (ok ? 1300 : 2400));
}

function celloEnde() {
  clearInterval(cs.timer);
  const st = loadJson(CELLO_KEY);
  st.best = st.best || {};
  st.badges = st.badges || {};
  celloTeil('ende');
  if (cs.test) {
    const bestanden = cs.richtig >= CELLO_TEST_PASS;
    const S = cs.stufeObj;
    if (bestanden && !st.badges[S.lvl]) st.badges[S.lvl] = new Date().toISOString().slice(0, 10);
    saveJson(CELLO_KEY, st);
    hochzaehlen($('celloErgebnis'), cs.richtig, ' / ' + CELLO_TEST_LEN);
    $('celloErgebnisText').textContent = bestanden ? S.emoji + ' ' + S.name + ' der Cellokunde – bestanden!'
      : 'Für ' + S.emoji + ' ' + S.name + ' brauchst du ' + CELLO_TEST_PASS + ' von ' + CELLO_TEST_LEN + '. Übe noch die Lagen!';
    if (bestanden) setTimeout(() => konfetti(50, ['🎻', '🎵', '🎶', S.emoji]), 400);
    return;
  }
  const rekord = !!cs.ende && (st.best.alle == null || cs.richtig > st.best.alle);
  if (rekord) st.best.alle = cs.richtig;
  saveJson(CELLO_KEY, st);
  hochzaehlen($('celloErgebnis'), cs.richtig, ' richtig');
  $('celloErgebnisText').textContent = (rekord ? '🏆 Neuer Rekord! ' : '') + cs.gesamt + ' Versuche · beste Serie ' + cs.besteSerie;
  if (rekord && cs.richtig >= 10) setTimeout(() => konfetti(40, ['🎻', '🎵', '🎶', '✨']), 400);
}

// ---------- Knöpfe ----------
$('celloModi').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { celloOpt.modus = b.dataset.modus; celloIntro(); }));
$('celloVz').addEventListener('change', (e) => { celloOpt.vorzeichen = e.target.checked; });
$('celloSpeed').addEventListener('change', (e) => { celloOpt.speed = e.target.checked; });
$('celloLos').addEventListener('click', () => { spieleTon(48, 0.6); celloStart(); });
$('celloStopp').addEventListener('click', () => (cs && (cs.ende || cs.test) ? celloEnde() : (clearInterval(cs && cs.timer), celloIntro())));
$('celloNochmal').addEventListener('click', celloStart);
$('celloMenue').addEventListener('click', celloIntro);
$('celloZurueck').addEventListener('click', () => { if (cs) clearInterval(cs.timer); cs = null; zeigeHub(); });
