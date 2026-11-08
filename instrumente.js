// 🎹🎸🪕 Noten & Griffe für Klavier, Gitarre und Ukulele – Gegenstück zu „Cello-Noten“ (cello.js).
// Nutzt aus cello.js: note, deutsch, schreibe, notenSvg, SCHLUESSEL, HALBTOENE, TASTEN_12.
// Klavier: Violin- und Bassschlüssel, Tasten auf zwei Oktaven mit Oktavnamen (c, c', c'' …).
// Gitarre: notiert im Violinschlüssel mit kleiner 8 (klingt eine Oktave tiefer), Stimmung E A D G H e.
// Ukulele: Stimmung G C E A (hohe G-Saite), notiert wie sie klingt. Gitarre und Ukulele haben dazu einen Akkord-Modus.
const INST_KEY = 'walquiz.instrumente.v1';
const INST_WAHL_KEY = 'walquiz.instrument.v1';
const INSTRUMENTE = {
  klavier: {
    name: 'Klavier', emoji: '🎹', griffWort: 'Taste',
    lead: 'Noten lesen in Violin- und Bassschlüssel und die richtige Taste finden – mit Oktavnamen von c bis c‴. Jeder Ton erklingt.',
    stufen: [
      { lvl: 1, name: 'Seepferdchen', emoji: '🐴', klein: 'c bis g, c′ bis g′', bereiche: [[48, 55], [60, 67]], vz: false },
      { lvl: 2, name: 'Bronze', emoji: '🥉', klein: 'c bis c″', bereiche: [[48, 72]], vz: false },
      { lvl: 3, name: 'Silber', emoji: '🥈', klein: 'G bis g″ · ♯ ♭', bereiche: [[43, 79]], vz: true },
      { lvl: 4, name: 'Gold', emoji: '🥇', klein: 'C bis c‴ · ♯ ♭', bereiche: [[36, 84]], vz: true },
    ],
  },
  gitarre: {
    name: 'Gitarre', emoji: '🎸', griffWort: 'Griff', saiten: [40, 45, 50, 55, 59, 64], saitenNamen: ['E', 'A', 'D', 'G', 'H', 'e'], notiert: 12,
    lead: 'Noten lesen, Bünde finden und Akkorde erkennen. Gitarrennoten stehen im Violinschlüssel mit kleiner 8 – sie klingen eine Oktave tiefer.',
    stufen: [
      { lvl: 1, name: 'Seepferdchen', emoji: '🐴', klein: 'Bund 0–3', bund: 3, vz: false, akkorde: ['C', 'G', 'D', 'Em', 'Am'] },
      { lvl: 2, name: 'Bronze', emoji: '🥉', klein: 'Bund 0–5', bund: 5, vz: false, akkorde: ['C', 'G', 'D', 'Em', 'Am', 'A', 'E', 'Dm'] },
      { lvl: 3, name: 'Silber', emoji: '🥈', klein: 'Bund 0–9 · ♯ ♭', bund: 9, vz: true, akkorde: ['C', 'G', 'D', 'Em', 'Am', 'A', 'E', 'Dm', 'E7', 'A7', 'D7', 'G7', 'C7', 'H7'] },
      { lvl: 4, name: 'Gold', emoji: '🥇', klein: 'Bund 0–12 · Barré', bund: 12, vz: true, akkorde: ['C', 'G', 'D', 'Em', 'Am', 'A', 'E', 'Dm', 'E7', 'A7', 'D7', 'G7', 'C7', 'H7', 'F', 'Hm', 'Cmaj7', 'Am7', 'Dm7'] },
    ],
    // Griffe von der tiefen E-Saite zur hohen e-Saite; x = nicht spielen
    griffe: { C: 'x32010', G: '320003', D: 'xx0232', Em: '022000', Am: 'x02210', A: 'x02220', E: '022100', Dm: 'xx0231',
      E7: '020100', A7: 'x02020', D7: 'xx0212', G7: '320001', C7: 'x32310', H7: 'x21202', F: '133211', Hm: 'x24432', Cmaj7: 'x32000', Am7: 'x02010', Dm7: 'xx0211' },
    punkte: [3, 5, 7, 9], doppel: 12,
  },
  ukulele: {
    name: 'Ukulele', emoji: '🪕', griffWort: 'Griff', saiten: [67, 60, 64, 69], saitenNamen: ['G', 'C', 'E', 'A'], notiert: 0,
    lead: 'Die Ukulele ist gestimmt in G C E A – mit hoher G-Saite. Lerne Töne auf dem Griffbrett und die wichtigsten Akkorde.',
    stufen: [
      { lvl: 1, name: 'Seepferdchen', emoji: '🐴', klein: 'Bund 0–3', bund: 3, vz: false, akkorde: ['C', 'Am', 'F', 'G'] },
      { lvl: 2, name: 'Bronze', emoji: '🥉', klein: 'Bund 0–5', bund: 5, vz: false, akkorde: ['C', 'Am', 'F', 'G', 'A', 'D', 'Em', 'Dm'] },
      { lvl: 3, name: 'Silber', emoji: '🥈', klein: 'Bund 0–7 · ♯ ♭', bund: 7, vz: true, akkorde: ['C', 'Am', 'F', 'G', 'A', 'D', 'Em', 'Dm', 'C7', 'A7', 'G7', 'E7', 'D7'] },
      { lvl: 4, name: 'Gold', emoji: '🥇', klein: 'Bund 0–12', bund: 12, vz: true, akkorde: ['C', 'Am', 'F', 'G', 'A', 'D', 'Em', 'Dm', 'C7', 'A7', 'G7', 'E7', 'D7', 'B', 'Hm', 'E', 'Am7', 'Cmaj7'] },
    ],
    // von der G-Saite zur A-Saite
    griffe: { C: '0003', Am: '2000', F: '2010', G: '0232', A: '2100', D: '2220', Em: '0432', Dm: '2210',
      C7: '0001', A7: '0100', G7: '0212', E7: '1202', D7: '2223', B: '3211', Hm: '4222', E: '1402', Am7: '0000', Cmaj7: '0002' },
    punkte: [5, 7, 10], doppel: 12,
  },
};
const INST_MODI = {
  finden: { name: 'finden', emoji: '🎯' },
  benennen: { name: 'lesen', emoji: '🔎' },
  lesen: { name: 'Noten lesen', emoji: '📖' },
  akkorde: { name: 'Akkorde', emoji: '🎼' },
  test: { name: 'Abzeichen-Test', emoji: '🎖️' },
};
const INST_TEST_LEN = 10, INST_TEST_PASS = 8;

// Oktavnamen wie im Musikunterricht: C (große Oktave), c (kleine), c′ (eingestrichen) …
function oktavName(midi, geschrieben) {
  // geschrieben: die Note so benennen, wie sie notiert ist (B statt Ais); Oktave nach dem Stammton (Ces/His wären Sonderfälle)
  const o = geschrieben ? geschrieben.oct : Math.floor(midi / 12) - 1, n = deutsch(geschrieben || schreibe(midi, false));
  if (o <= 2) return n + (o === 1 ? '₁' : o === 0 ? '₂' : '');
  return n.toLowerCase() + ['', '′', '″', '‴', '⁗'][o - 3];
}

// ---------- Klang ----------
let instCtx = null;
const instAudio = () => {
  instCtx = instCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (instCtx.state === 'suspended') instCtx.resume();
  return instCtx;
};
function instTon(inst, midi, wann = 0, dauer = 1.6) {
  try {
    const c = instAudio(), t = c.currentTime + wann, f = 440 * Math.pow(2, (midi - 69) / 12);
    const g = c.createGain();
    g.connect(c.destination);
    if (inst === 'klavier') {
      // Klavier: Grundton und zwei Obertöne, schneller Anschlag, langes Ausklingen
      [[1, 0.32], [2, 0.12], [3, 0.05]].forEach(([k, v]) => {
        const o = c.createOscillator(), og = c.createGain();
        o.type = k === 1 ? 'triangle' : 'sine'; o.frequency.value = f * k;
        og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(v, t + 0.008);
        og.gain.exponentialRampToValueAtTime(0.0001, t + dauer / k);
        o.connect(og).connect(g); o.start(t); o.stop(t + dauer + 0.05);
      });
      g.gain.value = 0.9;
    } else {
      // Gezupfte Saite: heller Anschlag, der Klang wird schnell weicher
      const o = c.createOscillator(), fi = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = f;
      fi.type = 'lowpass'; fi.Q.value = 2;
      const hell = inst === 'ukulele' ? 7 : 5;
      fi.frequency.setValueAtTime(f * hell, t); fi.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.5);
      const lang = inst === 'ukulele' ? dauer * 0.7 : dauer;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + lang);
      o.connect(fi).connect(g); o.start(t); o.stop(t + lang + 0.05);
    }
  } catch (e) { /* ohne Ton weiter */ }
}
function instAkkordKlang(inst, akkord) {
  const I = INSTRUMENTE[inst];
  [...I.griffe[akkord]].forEach((b, i) => { if (b !== 'x') instTon(inst, I.saiten[i] + Number(b), i * 0.035, 1.8); });
}

// ---------- Notation ----------
function instNotenSvg(inst, a, opts = {}) {
  if (inst === 'klavier') return notenSvg(a.midi >= 60 ? 'violin' : 'bass', opts.leer ? null : a.note, opts);
  const geschrieben = note(a.note.letter, a.note.acc, a.note.oct + INSTRUMENTE[inst].notiert / 12);
  let svg = notenSvg('violin', opts.leer ? null : geschrieben, opts);
  if (inst === 'gitarre') svg = svg.replace('</svg>', '<text class="schluessel-8" x="33" y="146">8</text></svg>');   // Gitarre klingt eine Oktave tiefer
  return svg;
}
const instSchluesselText = (inst, a) => (inst === 'klavier' ? (a.midi >= 60 ? 'Violinschlüssel' : 'Bassschlüssel')
  : inst === 'gitarre' ? 'Violinschlüssel mit 8 · klingt eine Oktave tiefer' : 'Violinschlüssel');

// ---------- Klaviatur (zwei Oktaven) ----------
function klaviaturSvg(start, { markiert = null, loesung = null, falsch = null, klickbar = false } = {}) {
  const weisse = [], schwarze = [];
  for (let m = start; m <= start + 24; m++) (HALBTOENE.includes(m % 12) ? weisse : schwarze).push(m);
  const B = 40, H = 160, sB = 24, sH = 98;
  const xWeiss = (m) => weisse.indexOf(m) * B;
  let s = '';
  const cls = (m, basis) => [basis, klickbar ? 'klick' : '', markiert === m ? 'markiert' : '', loesung === m ? 'loesung' : '', falsch === m ? 'falsch' : ''].join(' ');
  weisse.forEach((m) => {
    s += `<g class="${cls(m, 'weiss')}" data-midi="${m}"><rect x="${xWeiss(m) + 1}" y="0" width="${B - 2}" height="${H}" rx="5"/>`
      + (m % 12 === 0 ? `<text x="${xWeiss(m) + B / 2}" y="${H - 12}" class="okt${m === 60 ? ' mitte' : ''}">${oktavName(m)}</text>` : '') + '</g>';
  });
  schwarze.forEach((m) => {
    s += `<g class="${cls(m, 'schwarz')}" data-midi="${m}"><rect x="${xWeiss(m - 1) + B - sB / 2}" y="0" width="${sB}" height="${sH}" rx="4"/></g>`;
  });
  return `<svg class="klaviatur-svg" viewBox="0 0 ${weisse.length * B} ${H}" role="img" aria-label="Klaviatur ab ${oktavName(start)}">${s}</svg>`;
}

// ---------- Griffbrett (Gitarre/Ukulele), senkrecht: Sattel oben, tiefste Saite links ----------
function bundbrettSvg(inst, bis, { markiert = null, loesung = [], falsch = null, klickbar = false, nurStamm = false } = {}) {
  const I = INSTRUMENTE[inst], n = I.saiten.length;
  const abst = inst === 'gitarre' ? 46 : 56, links = 64, oben = 58, reihe = bis <= 5 ? 50 : bis <= 9 ? 40 : 34;
  const W = links + (n - 1) * abst + 44, H = oben + bis * reihe + 18;
  const xs = (i) => links + i * abst, yb = (b) => (b === 0 ? 30 : oben + (b - 0.5) * reihe);
  let s = `<rect x="${links - 22}" y="${oben}" width="${(n - 1) * abst + 44}" height="${bis * reihe + 10}" rx="6" fill="url(#holz-${inst})" stroke="#5a3e2b" stroke-width="2"/>`;
  s = `<defs><linearGradient id="holz-${inst}" x1="0" x2="1"><stop offset="0" stop-color="#3b2416"/><stop offset=".5" stop-color="#4d3020"/><stop offset="1" stop-color="#3b2416"/></linearGradient></defs>` + s;
  s += `<rect x="${links - 24}" y="${oben - 6}" width="${(n - 1) * abst + 48}" height="7" rx="2" fill="#efe3c8"/>`;
  for (let b = 1; b <= bis; b++) {
    s += `<line x1="${links - 22}" x2="${links + (n - 1) * abst + 22}" y1="${oben + b * reihe}" y2="${oben + b * reihe}" stroke="#c9c2b4" stroke-width="2.5"/>`;
    s += `<text class="bund" x="${links - 34}" y="${oben + (b - 0.5) * reihe + 5}">${b}</text>`;
  }
  const mitte = links + (n - 1) * abst / 2;
  I.punkte.filter((b) => b <= bis).forEach((b) => { s += `<circle cx="${mitte}" cy="${yb(b)}" r="6" fill="rgba(255,255,255,0.28)"/>`; });
  if (I.doppel <= bis) [-1, 1].forEach((k) => { s += `<circle cx="${mitte + k * abst}" cy="${yb(I.doppel)}" r="6" fill="rgba(255,255,255,0.28)"/>`; });
  I.saiten.forEach((m, i) => {
    s += `<line x1="${xs(i)}" x2="${xs(i)}" y1="${oben - 6}" y2="${oben + bis * reihe + 10}" stroke="#e8dcc0" stroke-width="${inst === 'gitarre' ? 3.4 - i * 0.45 : 2.4}"/>`;
    s += `<text class="saite" x="${xs(i)}" y="12">${I.saitenNamen[i]}</text>`;
  });
  // Griffstellen
  I.saiten.forEach((m, i) => {
    for (let b = 0; b <= bis; b++) {
      const id = i + '-' + b;
      const frei = nurStamm && !HALBTOENE.includes((m + b) % 12) && ![markiert, falsch].includes(id) && !loesung.includes(id);
      const k = ['punkt', frei ? 'frei' : klickbar ? 'klick' : '', markiert === id ? 'markiert' : '', loesung.includes(id) ? 'loesung' : '', falsch === id ? 'falsch' : ''].join(' ');
      s += `<g class="${k}" data-pos="${id}"><circle cx="${xs(i)}" cy="${yb(b)}" r="${b === 0 ? 11 : 14}"/></g>`;
    }
  });
  return `<svg class="griff-svg bund-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${I.name}-Griffbrett">${s}</svg>`;
}
const instPosMidi = (inst, pos) => { const [i, b] = pos.split('-').map(Number); return INSTRUMENTE[inst].saiten[i] + b; };
function instPosText(inst, pos) {
  const [i, b] = pos.split('-').map(Number), I = INSTRUMENTE[inst];
  return I.saitenNamen[i] + '-Saite · ' + (b === 0 ? 'leer' : b + '. Bund');
}

// ---------- Akkord-Diagramm ----------
function akkordSvg(inst, akkord, { klasse = '' } = {}) {
  const I = INSTRUMENTE[inst], griff = [...I.griffe[akkord]], n = griff.length;
  const max = Math.max(4, ...griff.filter((b) => b !== 'x').map(Number));
  const abst = n === 6 ? 22 : 28, links = 24, oben = 30, reihe = 26;
  const W = links * 2 + (n - 1) * abst, H = oben + max * reihe + 12;
  let s = `<rect x="${links}" y="${oben}" width="${(n - 1) * abst}" height="${max * reihe}" fill="#fbf5e9"/>`;
  s += `<rect x="${links - 2}" y="${oben - 5}" width="${(n - 1) * abst + 4}" height="6" fill="#2b2118"/>`;
  for (let b = 1; b <= max; b++) s += `<line x1="${links}" x2="${links + (n - 1) * abst}" y1="${oben + b * reihe}" y2="${oben + b * reihe}" stroke="#8a7a62" stroke-width="1.5"/>`;
  griff.forEach((b, i) => {
    const x = links + i * abst;
    s += `<line x1="${x}" x2="${x}" y1="${oben}" y2="${oben + max * reihe}" stroke="#4a3b2a" stroke-width="1.6"/>`;
    if (b === 'x') s += `<text class="ak-x" x="${x}" y="${oben - 11}">×</text>`;
    else if (b === '0') s += `<circle cx="${x}" cy="${oben - 15}" r="5" fill="none" stroke="#2b2118" stroke-width="1.8"/>`;
    else s += `<circle cx="${x}" cy="${oben + (Number(b) - 0.5) * reihe}" r="${abst * 0.36}" fill="#2b2118"/>`;
  });
  // Barré: gleicher Bund auf allen Saiten von der tiefsten bis zur höchsten → Balken
  if (akkord === 'F' && inst === 'gitarre') s += `<rect x="${links - 6}" y="${oben + 0.5 * reihe - 6}" width="${(n - 1) * abst + 12}" height="12" rx="6" fill="#2b2118"/>`;
  return `<svg class="akkord-svg ${klasse}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Akkord-Griffbild">${s}</svg>`;
}

// ---------- Spiel ----------
let is = null;   // Instrument-Spielzustand
const instOpt = { inst: 'klavier', modus: 'finden', stufe: 1, vorzeichen: false, speed: false };
const instStufe = () => INSTRUMENTE[instOpt.inst].stufen.find((s) => s.lvl === instOpt.stufe);
function instTeil(t) { ['intro', 'spiel', 'ende'].forEach((x) => { $('inst-' + x).hidden = x !== t; }); }

// Instrument-Wechsler (auch im Cello-Bildschirm): merkt sich die Wahl
function instrumentWaehlen(inst) {
  try { localStorage.setItem(INST_WAHL_KEY, inst); } catch (e) { /* egal */ }
  if (inst === 'cello') { show('cello', '🎻 Cello-Noten'); celloIntro(); return; }
  if (instOpt.inst !== inst) { instOpt.inst = inst; instOpt.stufe = 1; instOpt.vorzeichen = false; if (instOpt.modus === 'akkorde' && inst === 'klavier') instOpt.modus = 'finden'; }
  show('instrument', INSTRUMENTE[inst].emoji + ' ' + INSTRUMENTE[inst].name);
  instIntro();
}
function instWahlZeichnen(box, aktiv) {
  box.innerHTML = '';
  [['cello', '🎻', 'Cello'], ...Object.entries(INSTRUMENTE).map(([k, v]) => [k, v.emoji, v.name]), ['stimmen', '🎚️', 'Stimmen']].forEach(([k, e, n]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = k === aktiv ? 'on' : '';
    b.innerHTML = '<span></span><small></small>';
    b.querySelector('span').textContent = e;
    b.querySelector('small').textContent = n;
    b.addEventListener('click', () => { if (k === 'stimmen') { if (typeof sgOeffnen === 'function') sgOeffnen({ klavier: 'chromatisch' }[aktiv] || aktiv); return; } if (k !== aktiv) instrumentWaehlen(k); });
    box.appendChild(b);
  });
}

function instIntro() {
  const I = INSTRUMENTE[instOpt.inst], st = (loadJson(INST_KEY)[instOpt.inst]) || {}, badges = st.badges || {};
  $('instBuehne').className = 'cello-buehne inst-buehne inst-' + instOpt.inst;
  $('instKopf').textContent = I.emoji + ' ' + I.name;
  instWahlZeichnen($('instWahl'), instOpt.inst);
  $('instTitel').textContent = I.name;
  $('instLead').textContent = I.lead;
  const sb = $('instStufen');
  sb.innerHTML = '';
  I.stufen.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = (s.lvl === instOpt.stufe ? 'on' : '') + (badges[s.lvl] ? ' geschafft' : '');
    b.innerHTML = '<span></span><b></b><small></small>';
    b.querySelector('span').textContent = s.emoji;
    b.querySelector('b').textContent = s.name;
    b.querySelector('small').textContent = s.klein;
    b.addEventListener('click', () => { instOpt.stufe = s.lvl; instOpt.vorzeichen = s.vz; instIntro(); });
    sb.appendChild(b);
  });
  // Modi: Wortwahl je Instrument, Akkorde nur bei Gitarre und Ukulele
  const w = I.griffWort;
  const texte = {
    finden: [w + ' finden', 'Note sehen – ' + (instOpt.inst === 'klavier' ? 'die richtige Taste in der richtigen Oktave tippen' : 'Saite und Bund tippen')],
    benennen: [w + ' lesen', (instOpt.inst === 'klavier' ? 'Markierte Taste sehen' : 'Markierten Griff sehen') + ' – Ton nennen'],
    lesen: ['Noten lesen', 'Note sehen – Namen tippen'],
    akkorde: ['Akkorde', 'Griffbild erkennen oder zum Namen das Griffbild finden'],
    test: ['Abzeichen-Test', '10 gemischte Aufgaben, 8 richtig = Abzeichen'],
  };
  if (instOpt.modus === 'akkorde' && !I.griffe) instOpt.modus = 'finden';
  $('instModi').querySelectorAll('button').forEach((b) => {
    const m = b.dataset.modus;
    b.hidden = m === 'akkorde' && !I.griffe;
    b.classList.toggle('on', m === instOpt.modus);
    b.querySelector('span').textContent = m === 'finden' ? I.emoji : INST_MODI[m].emoji;
    b.querySelector('b').textContent = texte[m][0];
    b.querySelector('small').textContent = texte[m][1];
  });
  $('instVz').checked = instOpt.vorzeichen;
  $('instVzZeile').hidden = instOpt.modus === 'akkorde' || instOpt.modus === 'test';
  $('instSpeed').checked = instOpt.speed;
  $('instSpeedZeile').hidden = instOpt.modus === 'test';
  const S = instStufe();
  $('instLos').textContent = instOpt.modus === 'test' ? S.emoji + ' Abzeichen-Test starten' : 'Los geht’s 🎵';
  $('instBest').textContent = 'Abzeichen: ' + I.stufen.map((s) => (badges[s.lvl] ? s.emoji : '·')).join(' ') + ' · 60-Sek.-Rekord: ' + (st.best != null ? st.best : '–');
  instTeil('intro');
}

function instStart() {
  const test = instOpt.modus === 'test';
  is = { ...instOpt, S: instStufe(), test, richtig: 0, gesamt: 0, serie: 0, besteSerie: 0, aufgabe: null, ende: !test && instOpt.speed ? Date.now() + 60000 : null };
  instTeil('spiel');
  const I = INSTRUMENTE[is.inst];
  $('instModusTitel').textContent = test ? '🎖️ ' + is.S.emoji + ' ' + is.S.name : (is.modus === 'finden' ? I.emoji + ' ' + I.griffWort + ' finden' : is.modus === 'benennen' ? '🔎 ' + I.griffWort + ' lesen' : INST_MODI[is.modus].emoji + ' ' + INST_MODI[is.modus].name);
  clearInterval(is.timer);
  if (is.ende) {
    is.timer = setInterval(() => {
      const rest = Math.max(0, is.ende - Date.now());
      $('instZeit').textContent = Math.ceil(rest / 1000) + ' s';
      $('instZeitBar').style.width = (rest / 600) + '%';
      if (!rest) instEnde();
    }, 100);
  }
  $('instZeitBox').hidden = !is.ende;
  instNeueAufgabe();
}

function instZufallsAufgabe() {
  const I = INSTRUMENTE[is.inst];
  const moeglich = I.griffe ? ['lesen', 'finden', 'benennen', 'akkorde'] : ['lesen', 'finden', 'benennen'];
  const modus = is.test ? moeglich[Math.floor(Math.random() * moeglich.length)] : is.modus;
  const vz = is.test ? is.S.vz : is.vorzeichen;
  if (modus === 'akkorde') {
    const liste = is.S.akkorde;
    let ak;
    do ak = liste[Math.floor(Math.random() * liste.length)]; while (is.aufgabe && is.aufgabe.akkord === ak && liste.length > 1);
    const andere = liste.filter((x) => x !== ak).sort(() => Math.random() - 0.5).slice(0, 3);
    const wahl = [ak, ...andere].sort(() => Math.random() - 0.5);
    return { modus, akkord: ak, wahl, richtung: Math.random() < 0.5 ? 'name' : 'bild' };
  }
  let midi, pos = null;
  do {
    if (is.inst === 'klavier') {
      const b = is.S.bereiche[Math.floor(Math.random() * is.S.bereiche.length)];
      midi = b[0] + Math.floor(Math.random() * (b[1] - b[0] + 1));
    } else {
      const i = Math.floor(Math.random() * I.saiten.length), bund = Math.floor(Math.random() * (is.S.bund + 1));
      pos = i + '-' + bund; midi = I.saiten[i] + bund;
    }
  } while ((!vz && !HALBTOENE.includes(midi % 12)) || (is.aufgabe && is.aufgabe.midi === midi));
  // Klavier: zwei Oktaven zeigen, in denen der Ton liegt (mal in der unteren, mal in der oberen)
  const cUnten = Math.floor(midi / 12) * 12;
  const start = Math.random() < 0.5 && cUnten - 12 >= 24 ? cUnten - 12 : cUnten;
  return { modus, midi, pos, note: schreibe(midi), vz, start };
}

function instGriffbild(a, opts) {
  if (is.inst === 'klavier') return klaviaturSvg(a.start, opts);
  return bundbrettSvg(is.inst, is.S.bund, { ...opts, markiert: opts.markiert, loesung: opts.loesung || [], nurStamm: !a.vz });
}
// Alle Stellen auf dem Griffbrett, die diesen Ton ergeben
function instAllePos(midi) {
  const I = INSTRUMENTE[is.inst], out = [];
  I.saiten.forEach((m, i) => { const b = midi - m; if (b >= 0 && b <= is.S.bund) out.push(i + '-' + b); });
  return out;
}

function instNeueAufgabe() {
  is.aufgabe = instZufallsAufgabe();
  is.gesperrt = false;
  const a = is.aufgabe, I = INSTRUMENTE[is.inst];
  const fb = $('instFeedback');
  fb.className = 'cello-feedback';
  $('instStand').textContent = is.test ? (is.gesamt + 1) + ' / ' + INST_TEST_LEN : is.richtig + ' / ' + is.gesamt + (is.serie > 2 ? ' · 🔥 ' + is.serie : '');
  const griff = $('instGriff'), tasten = $('instTasten');
  tasten.innerHTML = '';
  $('inst-spiel').classList.toggle('mit-griff', a.modus !== 'lesen');
  if (a.modus === 'akkorde') {
    $('instLegende').hidden = true;
    tasten.hidden = false;
    if (a.richtung === 'name') {
      // Griffbild zeigen → Namen wählen
      $('instNoten').innerHTML = '<div class="akkord-frage">?</div>';
      $('instSchluessel').textContent = '';
      fb.textContent = 'Welcher Akkord ist das?';
      griff.hidden = false;
      griff.innerHTML = akkordSvg(is.inst, a.akkord, { klasse: 'gross' });
      tasten.className = 'cello-tasten akkord-namen';
      a.wahl.forEach((ak) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'taste'; b.textContent = ak; b.dataset.ak = ak;
        b.addEventListener('click', () => instAntwort(ak, b));
        tasten.appendChild(b);
      });
    } else {
      // Namen zeigen → Griffbild wählen
      $('instNoten').innerHTML = '<div class="akkord-frage">' + a.akkord + '</div>';
      $('instSchluessel').textContent = 'Akkord';
      fb.textContent = 'Welches Griffbild gehört zu ' + a.akkord + '?';
      griff.hidden = true;
      tasten.className = 'cello-tasten akkord-bilder';
      a.wahl.forEach((ak) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'akkord-wahl'; b.dataset.ak = ak;
        b.innerHTML = akkordSvg(is.inst, ak);
        b.addEventListener('click', () => instAntwort(ak, b));
        tasten.appendChild(b);
      });
    }
    return;
  }
  fb.textContent = a.modus === 'benennen' ? 'Welcher Ton ist das?' : a.modus === 'finden' ? (is.inst === 'klavier' ? 'Tippe die Taste – in der richtigen Oktave!' : 'Wo greifst du diesen Ton?') : 'Wie heißt diese Note?';
  $('instNoten').innerHTML = a.modus === 'benennen' ? instNotenSvg(is.inst, a, { leer: true, frage: true }) : instNotenSvg(is.inst, a);
  $('instSchluessel').textContent = a.modus === 'benennen' ? '' : instSchluesselText(is.inst, a);
  griff.hidden = a.modus === 'lesen';
  $('instLegende').hidden = griff.hidden || is.inst === 'klavier';
  $('instLegende').textContent = a.vz ? 'Jede Reihe = ein Bund = ein Halbton' : 'Gestrichelt = ergibt einen Ton mit ♯ oder ♭ (hier nicht gefragt)';
  if (!griff.hidden) {
    griff.innerHTML = instGriffbild(a, { markiert: a.modus === 'benennen' ? (is.inst === 'klavier' ? a.midi : a.pos) : null, klickbar: a.modus === 'finden' });
    if (a.modus === 'finden') {
      griff.querySelectorAll(is.inst === 'klavier' ? 'g[data-midi]' : '.punkt.klick').forEach((p) => p.addEventListener('click', () => instAntwort(is.inst === 'klavier' ? Number(p.dataset.midi) : p.dataset.pos)));
    }
  }
  tasten.className = 'cello-tasten';
  tasten.hidden = a.modus === 'finden';
  if (!tasten.hidden) {
    tasten.classList.toggle('alle', a.vz);
    TASTEN_12.filter(([pc]) => a.vz || HALBTOENE.includes(pc)).forEach(([pc, name]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'taste' + (HALBTOENE.includes(pc) ? '' : ' schwarz');
      b.textContent = name; b.dataset.pc = pc;
      b.addEventListener('click', () => instAntwort(pc, b));
      tasten.appendChild(b);
    });
  }
}

function instAntwort(wert, knopf) {
  if (is.gesperrt) return;
  is.gesperrt = true;
  const a = is.aufgabe, I = INSTRUMENTE[is.inst];
  let ok;
  if (a.modus === 'akkorde') ok = wert === a.akkord;
  else if (a.modus === 'finden') ok = (is.inst === 'klavier' ? wert : instPosMidi(is.inst, wert)) === a.midi;
  else ok = Number(wert) === a.midi % 12;
  is.gesamt++;
  if (ok) { is.richtig++; is.serie++; is.besteSerie = Math.max(is.besteSerie, is.serie); } else is.serie = 0;
  if (navigator.vibrate) navigator.vibrate(ok ? 15 : [30, 40, 30]);
  const fb = $('instFeedback');
  fb.className = 'cello-feedback ' + (ok ? 'ok' : 'bad');
  $('instStand').textContent = is.test ? is.gesamt + ' / ' + INST_TEST_LEN : is.richtig + ' / ' + is.gesamt + (is.serie > 2 ? ' · 🔥 ' + is.serie : '');
  if (ok) plusEins(knopf || $('instGriff'));
  if (a.modus === 'akkorde') {
    instAkkordKlang(is.inst, a.akkord);
    fb.textContent = ok ? '✓ ' + a.akkord : '✗ Richtig ist: ' + a.akkord;
    $('instNoten').innerHTML = '<div class="akkord-frage ' + (ok ? 'ok' : 'bad') + '">' + a.akkord + '</div>';
    $('instGriff').hidden = false;
    $('instGriff').innerHTML = akkordSvg(is.inst, a.akkord, { klasse: 'gross' });
    $('instTasten').querySelectorAll('[data-ak]').forEach((b) => {
      if (b.dataset.ak === a.akkord) b.classList.add('richtig');
      else if (b === knopf) b.classList.add('falsch');
    });
  } else {
    instTon(is.inst, a.midi);
    const ort = is.inst === 'klavier' ? oktavName(a.midi, a.note) : instPosText(is.inst, a.pos);
    const andere = is.inst === 'klavier' ? [] : instAllePos(a.midi);
    fb.textContent = (ok ? '✓ ' : '✗ Richtig ist: ') + deutsch(a.note) + ' – ' + ort
      + (andere.length > 1 ? ' (auch: ' + andere.filter((p) => p !== a.pos).map((p) => instPosText(is.inst, p)).join(', ') + ')' : '');
    $('instNoten').innerHTML = instNotenSvg(is.inst, a, { klasse: ok ? 'ok' : 'bad' });
    $('instSchluessel').textContent = instSchluesselText(is.inst, a);
    $('instGriff').hidden = false;
    $('inst-spiel').classList.add('mit-griff');
    $('instLegende').hidden = is.inst === 'klavier';
    $('instGriff').innerHTML = is.inst === 'klavier'
      ? klaviaturSvg(a.start, { loesung: a.midi, falsch: a.modus === 'finden' && !ok ? wert : null })
      : bundbrettSvg(is.inst, is.S.bund, { loesung: andere, falsch: a.modus === 'finden' && !ok ? wert : null, nurStamm: !a.vz });
    $('instTasten').querySelectorAll('.taste').forEach((b) => {
      if (Number(b.dataset.pc) === a.midi % 12) b.classList.add('richtig');
      else if (b === knopf) b.classList.add('falsch');
    });
  }
  const weiter = () => {
    if (!is || $('inst-spiel').hidden) return;
    if (is.test && is.gesamt >= INST_TEST_LEN) instEnde(); else instNeueAufgabe();
  };
  setTimeout(weiter, is.ende ? (ok ? 600 : 1300) : (ok ? 1300 : 2600));
}

function instEnde() {
  clearInterval(is.timer);
  if (typeof merkeVerlauf === 'function') { if (is.gesamt) merkeVerlauf('cello', is.richtig, is.gesamt, INSTRUMENTE[is.inst].name + ' · ' + (is.test ? 'Abzeichen-Test ' + is.S.emoji : is.modus === 'finden' ? INSTRUMENTE[is.inst].griffWort + ' finden' : is.modus === 'benennen' ? INSTRUMENTE[is.inst].griffWort + ' lesen' : INST_MODI[is.modus].name)); }
  const alle = loadJson(INST_KEY), st = alle[is.inst] = alle[is.inst] || {};
  st.badges = st.badges || {};
  instTeil('ende');
  if (is.test) {
    const bestanden = is.richtig >= INST_TEST_PASS, S = is.S;
    if (bestanden && !st.badges[S.lvl]) st.badges[S.lvl] = new Date().toISOString().slice(0, 10);
    saveJson(INST_KEY, alle);
    hochzaehlen($('instErgebnis'), is.richtig, ' / ' + INST_TEST_LEN);
    $('instErgebnisText').textContent = bestanden ? S.emoji + ' ' + S.name + ' am ' + INSTRUMENTE[is.inst].name + ' – bestanden!'
      : 'Für ' + S.emoji + ' ' + S.name + ' brauchst du ' + INST_TEST_PASS + ' von ' + INST_TEST_LEN + '. Übe noch ein bisschen!';
    if (bestanden) setTimeout(() => konfetti(50, [INSTRUMENTE[is.inst].emoji, '🎵', '🎶', S.emoji]), 400);
    return;
  }
  const rekord = !!is.ende && (st.best == null || is.richtig > st.best);
  if (rekord) st.best = is.richtig;
  saveJson(INST_KEY, alle);
  hochzaehlen($('instErgebnis'), is.richtig, ' richtig');
  $('instErgebnisText').textContent = (rekord ? '🏆 Neuer Rekord! ' : '') + is.gesamt + ' Versuche · beste Serie ' + is.besteSerie;
  if (rekord && is.richtig >= 10) setTimeout(() => konfetti(40, [INSTRUMENTE[is.inst].emoji, '🎵', '🎶', '✨']), 400);
}

// ---------- Knöpfe ----------
$('instModi').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { instOpt.modus = b.dataset.modus; instIntro(); }));
$('instVz').addEventListener('change', (e) => { instOpt.vorzeichen = e.target.checked; });
$('instSpeed').addEventListener('change', (e) => { instOpt.speed = e.target.checked; });
$('instLos').addEventListener('click', () => { instTon(instOpt.inst, 60, 0, 0.4); instStart(); });
$('instStopp').addEventListener('click', () => (is && (is.ende || is.test) ? instEnde() : (clearInterval(is && is.timer), instIntro())));
$('instNochmal').addEventListener('click', instStart);
$('instMenue').addEventListener('click', instIntro);
$('instZurueck').addEventListener('click', () => { if (is) clearInterval(is.timer); is = null; zeigeHub(); });
instWahlZeichnen($('celloInstWahl'), 'cello');
