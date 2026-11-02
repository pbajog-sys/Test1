// 👾 Ein Tierleben – Pixel-Modus: dieselben Leben und Fakten, aber als kleines Retro-Abenteuer zum Herumlaufen.
// Eigene Pixelgrafik (16×16, vier Farbtöne), Kachelkarten, Textbox unten. Jedes Kapitel ist eine Karte:
// Schild lesen (Fakten + Entscheidung), dann öffnet sich der Ausgang. Nutztiere: Der Stall wird von Kapitel zu Kapitel voller.
// Bedrohte Arten: Schiffe, Netze, Lärm, Plantage und Feuer muss man wirklich umgehen – das ist hier die Spielregel.
const TP_W = 160, TP_H = 144, TP_T = 16;
const TP_PALETTEN = {
  stall: ['#f8f0d8', '#d8b878', '#8a6038', '#2a1808'],
  meer: ['#e8f8f8', '#78c0d8', '#2c6080', '#081828'],
  wald: ['#e0f8d0', '#88c070', '#346856', '#081820'],
};

// ---------- Pixelgrafik: '.' durchsichtig, 0–3 = Farbton hell → dunkel ----------
const TP_SPRITES = {
  huhn: ['................', '........33......', '.......3223.....', '......300003....', '.....300003033..', '.....30000003223', '..33.3000000033.', '.3003300000003..',
    '.30000000000003.', '.30001000010003.', '..300011111003..', '...3000000003...', '....33333333....', '.....3....3.....', '.....3....3.....', '....33...33.....'],
  pute: ['................', '.333.......33...', '32223.....3223..', '3212233...30003.', '3221122333000303', '.32212222300002.', '..322222230003..', '...3222223003...',
    '..322222222223..', '..322222222223..', '...3222222223...', '....33333333....', '.....3....3.....', '.....3....3.....', '....33...33.....', '................'],
  ente: ['................', '................', '..........333...', '.........32223..', '.........3223233', '.........3222111', '..33......3223..', '.3113333333223..',
    '.31111111111113.', '.31111111111113.', '..311122222113..', '...31111111113..', '....333333333...', '......1...1.....', '.....11..11.....', '................'],
  schwein: ['................', '................', '....3......3....', '...323....323...', '..3111111111133.', '.31111111111113.', '3111111111311133', '3111111111111223',
    '3111111111111223', '.31111111111113.', '.3111111111113..', '..33333333333...', '..31.31..31.31..', '..33.33..33.33..', '................', '................'],
  kuh: ['................', '.............3..', '..........33303.', '.........300003.', '.33333333300303.', '3000033300000003', '3000333300000113', '3003333000000113',
    '3000000000330033', '3000000003333003', '.30000000033003..', '..3333333333333.', '..30.30...30.30.', '..30.30...30.30.', '..33.33...33.33.', '................'],
  wal: ['................', '................', '................', '.33.............', '3223...33333....', '32223333222233..', '.3222222222222333', '.32222222222203.3',
    '322222222222222 3', '3111111111122223', '.31111111111113..', '..33333333333....', '................', '................', '................', '................'],
  delfin: ['................', '................', '................', '.......33.......', '......323.......', '33...3222333....', '323332222222333.', '.32222222222203.3',
    '322222222222222.', '.3111111112223...', '..333333333333..', '................', '................', '................', '................', '................'],
  hai: ['................', '................', '.......3........', '......323.......', '.....3223.......', '33..3222233333..', '3233222222222233', '.322222222222203',
    '3222222222222223', '.31111111111123..', '..311111111133..', '...3333333333...', '.....33.........', '................', '................', '................'],
  affe: ['................', '.....333333.....', '....32222223....', '...3221111223...', '...3210110123...', '...3211111123...', '....32133123....', '..332211112233..',
    '.32222222222223.', '3222322222232223', '322.322222232.23', '33..32222223..33', '....32222223....', '....3223322 3....', '....333..333....', '................'],
  schild: ['................', '................', '..333333333333..', '..300000000003..', '..302222222203..', '..300000000003..', '..302222220003..', '..300000000003..',
    '..333333333333..', '.......33.......', '.......33.......', '.......33.......', '.......33.......', '......3333......', '................', '................'],
  boje: ['................', '................', '.......33.......', '......3003......', '.......33.......', '......3223......', '.....322223.....', '.....300003.....',
    '.....322223.....', '....33333333....', '...3111111113...', '....33333333....', '................', '................', '................', '................'],
};
// Kacheln
const TP_KACHELN = {
  stroh: ['1111111111111111', '1121111111111211', '1111111211111111', '1111111111111111', '1111211111121111', '1111111111111111', '1211111111111111', '1111111121111111',
    '1111111111111121', '1111211111111111', '1111111111211111', '1111111111111111', '1211111112111111', '1111111111111111', '1111121111111211', '1111111111111111'],
  wand: ['3333333333333333', '2222222322222223', '2222222322222223', '3333333333333333', '2223222222232222', '2223222222232222', '3333333333333333', '2222222322222223',
    '2222222322222223', '3333333333333333', '2223222222232222', '2223222222232222', '3333333333333333', '2222222322222223', '2222222322222223', '3333333333333333'],
  trog: ['1111111111111111', '1111111111111111', '1111111111111111', '1111111111111111', '3333333333333333', '3000000000000003', '3022222222222203', '3022222222222203',
    '3333333333333333', '3111111111111113', '3111111111111113', '3333333333333333', '1311111111111131', '1311111111111131', '1111111111111111', '1111111111111111'],
  tuer: ['3333333333333333', '3222222222222223', '3233333333333323', '3232222222222323', '3232222222222323', '3232222222222323', '3232222222222323', '3232222222222003',
    '3232222222222003', '3232222222222323', '3232222222222323', '3232222222222323', '3232222222222323', '3232222222222323', '3233333333333323', '3333333333333333'],
  gitter: ['3111311131113111', '3111311131113111', '3333333333333333', '3111311131113111', '3111311131113111', '3111311131113111', '3111311131113111', '3333333333333333',
    '3111311131113111', '3111311131113111', '3111311131113111', '3111311131113111', '3333333333333333', '3111311131113111', '3111311131113111', '3111311131113111'],
  auf: ['1111111111111111', '1111111331111111', '1111113333111111', '1111133333311111', '1111333333331111', '1111111331111111', '1111111331111111', '1111111331111111',
    '1111111331111111', '1111111331111111', '1111111111111111', '1111111111111111', '1111111111111111', '1111111111111111', '1111111111111111', '1111111111111111'],
  wasser: ['1111111111111111', '1111111111111111', '1122211111111111', '1211121111111111', '1111111111111111', '1111111111122211', '1111111111211121', '1111111111111111',
    '1111111111111111', '1111222111111111', '1112111211111111', '1111111111111111', '1111111111111111', '1111111112221111', '1111111121112111', '1111111111111111'],
  land: ['2222222222222222', '2232222222223222', '2333222222233322', '2222222222222222', '2222223222222222', '2222233322222222', '2222222222222322', '2232222222223332',
    '2333222222222222', '2222222232222222', '2222222333222222', '2222222222222222', '2222222222222322', '2232222222223332', '2333222222222222', '2222222222222222'],
  netz: ['3111113111113111', '1311131311131311', '1131311131311131', '1113111113111113', '1131311131311131', '1311131311131311', '3111113111113111', '1311131311131311',
    '1131311131311131', '1113111113111113', '1131311131311131', '1311131311131311', '3111113111113111', '1311131311131311', '1131311131311131', '1113111113111113'],
  laerm: ['1111111111111111', '1111133333311111', '1113300000033111', '1130022222200311', '1130222222220311', '1302223333222031', '1302233003322031', '1302230000322031',
    '1302230000322031', '1302233003322031', '1302223333222031', '1130222222220311', '1130022222200311', '1113300000033111', '1111133333311111', '1111111111111111'],
  gras: ['0000000000000000', '0010000000001000', '0101000000010100', '0000000000000000', '0000000100000000', '0000001010000000', '0000000000000010', '0100000000000101',
    '1010000000000000', '0000000001000000', '0000000010100000', '0000000000000000', '0000010000000000', '0000101000001000', '0000000000010100', '0000000000000000'],
  baum: ['0000333333330000', '0003222222223000', '0032212222122300', '0322222222222230', '3221222222221223', '3222222122222223', '3222222222222223', '3212222222221223',
    '0322222222222230', '0032222222222300', '0003333223333000', '0000003223000000', '0000003223000000', '0000003223000000', '0000033333300000', '0000000000000000'],
  palme: ['0000000000000000', '0033300000333000', '0322230003222300', '0000323032300000', '0000003330000000', '0003332323330000', '0032200300223000', '0300000300000300',
    '0000000300000000', '0000000300000000', '0000000300000000', '0000000300000000', '0000003330000000', '0000000000000000', '0101010101010101', '1010101010101010'],
  feuer: ['0000000000000000', '0000000300000000', '0000003130000000', '0000031113000000', '0003031113030000', '0031311111313000', '0031111011113000', '0311110001111300',
    '0311100000111300', '3111000000011130', '3110000000001130', '3110000000001130', '0311000000011300', '0031110001113000', '0003333333330000', '0000000000000000'],
};

// Sprite in Pixel umrechnen (zwischengespeichert je Palette und Spiegelung)
const tpCache = {};
function tpBild(name, pal, spiegeln) {
  const key = name + '|' + pal + '|' + (spiegeln ? 1 : 0);
  if (tpCache[key]) return tpCache[key];
  const daten = TP_SPRITES[name] || TP_KACHELN[name], farben = TP_PALETTEN[pal];
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const x = c.getContext('2d');
  daten.forEach((zeile, y) => {
    const z = (zeile + '................').slice(0, 16).replace(/ /g, '.');
    for (let i = 0; i < 16; i++) {
      const ch = z[spiegeln ? 15 - i : i];
      if (ch >= '0' && ch <= '3') { x.fillStyle = farben[Number(ch)]; x.fillRect(i, y, 1, 1); }
    }
  });
  return (tpCache[key] = c);
}

// Welches Tier, welche Welt
const TP_TIER = { masthuhn: 'huhn', legehenne: 'huhn', pute: 'pute', ente: 'ente', schwein: 'schwein', milchkuh: 'kuh', mastbulle: 'kuh',
  glattwal: 'wal', vaquita: 'delfin', schweinswal: 'delfin', hai: 'hai', orang: 'affe' };
const TP_WELT = { glattwal: 'meer', vaquita: 'meer', schweinswal: 'meer', hai: 'meer', orang: 'wald' };
const tpWelt = (id) => TP_WELT[id] || 'stall';
const TP_TUER_TEXT = {
  masthuhn: 'Die Tür nach draußen bleibt zu. Masthühner in konventioneller Haltung sehen nie Tageslicht im Freien.',
  legehenne: 'Die Tür bleibt zu. Freiland- und Biohennen dürfen raus – du lebst im Stall.',
  pute: 'Die Tür bleibt zu. Die Halle ist dein ganzes Leben lang dieselbe.',
  ente: 'Dahinter liegt ein Teich. Die Tür bleibt zu – Badewasser gibt es hier nicht.',
  schwein: 'Draußen wäre Erde zum Wühlen. Die Tür bleibt zu.',
  milchkuh: 'Draußen wäre die Weide. Heute bleibt die Tür zu.',
  mastbulle: 'Die Tür bleibt zu. In der Bucht ist kein Platz zum Rennen.',
};
// Gefahrenart eines Kapitels aus dem Todestext ableiten
function tpGefahr(id, K) {
  const t = (K.tod || '') + ' ' + (K.text || '');
  if (!K.wahl) return null;
  if (/Feuer|abgebrannt|brennen/.test(t)) return 'feuer';
  if (/Plantage/.test(t)) return 'plantage';
  if (/taub|Knall|Lärm/.test(t)) return 'laerm';
  if (/Trawler|gefangen/.test(t)) return 'trawler';
  if (/Frachtschiff|gerammt|Schiff/.test(K.tod || '')) return 'schiffe';
  return 'netze';
}

// ---------- Karte eines Kapitels bauen ----------
function tpKarte(id, k, K, n) {
  const welt = tpWelt(id), W = 12, H = 14;
  const kacheln = Array(W * H).fill(welt === 'stall' ? 'stroh' : welt === 'meer' ? 'wasser' : 'gras');
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < W && y < H) kacheln[y * W + x] = t; };
  const m = { W, H, kacheln, welt, npcs: [], gefahren: [], objekte: [], start: [5, H - 2], ausgang: [5, 0], offen: false, gefahr: tpGefahr(id, K), feuerZeile: H, feuerTakt: 0 };
  const frei = (x, y) => !['wand', 'trog', 'tuer', 'land', 'baum', 'gitter'].includes(kacheln[y * W + x]);
  if (welt === 'stall') {
    for (let x = 0; x < W; x++) { set(x, 0, 'wand'); set(x, H - 1, 'wand'); }
    for (let y = 0; y < H; y++) { set(0, y, 'wand'); set(W - 1, y, 'wand'); }
    for (let x = 2; x < W - 2; x += 3) set(x, 3, 'trog');
    set(0, 7, 'tuer');
    m.objekte.push({ x: 1, y: 7, art: 'tuer', unsichtbar: true });
    set(5, 0, 'gitter'); m.ausgang = [5, 0];
    // Kalb: Mutter hinter einem Gitter
    if ((id === 'milchkuh' || id === 'mastbulle') && k === 0) {
      for (let x = 1; x <= 4; x++) set(x, 4, 'gitter');
      for (let y = 1; y <= 4; y++) set(4, y, 'gitter');
      set(2, 3, 'stroh');
      m.npcs.push({ x: 2, y: 2, sprite: 'kuh', fest: true, mutter: true });
      m.mutter = true;
    }
    // Enge: Zahl der Artgenossen wächst bis fast alles voll ist
    const voll = n > 1 ? k / (n - 1) : 1, gefluegel = ['huhn', 'pute', 'ente'].includes(TP_TIER[id]);
    let freieFelder = 0; for (let yy = 1; yy < H - 1; yy++) for (let xx = 1; xx < W - 1; xx++) if (frei(xx, yy)) freieFelder++;
    const anzahl = Math.round(freieFelder * (gefluegel ? 0.06 + voll * 0.88 : 0.05 + voll * 0.55));
    const sprite = TP_TIER[id];
    m.voll = voll;
    // Zusätzliche Tiere zwischen den Kacheln: nur Bild, kein Hindernis – zeigt die echte Dichte
    m.deko = [];
    const dekoAnzahl = gefluegel ? Math.round(voll * voll * 170) : Math.round(voll * 25);
    for (let i = 0; i < dekoAnzahl; i++) m.deko.push({ x: 1 + Math.random() * (W - 2.6), y: 1 + Math.random() * (H - 2.8), spiegeln: Math.random() < 0.5, p: Math.random() * 1000 });
    m.deko.sort((a, b) => a.y - b.y);
    let versuche = 0;
    while (m.npcs.filter((p) => !p.fest).length < anzahl && versuche++ < 3000) {
      const x = 1 + Math.floor(Math.random() * (W - 2)), y = 1 + Math.floor(Math.random() * (H - 2));
      if (!frei(x, y) || (x === m.start[0] && y === m.start[1]) || (x === 5 && y <= 1) || (x === 4 && y === H - 3) || (x === 1 && y === 7)) continue;
      if (m.npcs.some((p) => p.x === x && p.y === y)) continue;
      m.npcs.push({ x, y, sprite, spiegeln: Math.random() < 0.5 });
    }
    m.objekte.push({ x: 4, y: H - 4, art: 'schild' });
  } else if (welt === 'meer') {
    for (let y = 0; y < H; y++) { set(0, y, 'land'); if (y % 5 !== 2) set(1, y, 'land'); }
    m.objekte.push({ x: 6, y: H - 3, art: 'boje' });
    const g = m.gefahr;
    if (g === 'schiffe' || g === 'trawler') {
      [[3, 1, 3, 520], [6, -1, 3, 380], [9, 1, 4, 300]].forEach(([y, d, len, takt], i) => m.gefahren.push({ art: 'schiff', y, x: i * 4, d, len, takt, t: 0, netz: g === 'trawler' && i === 1 }));
    }
    if (g === 'netze' || g === 'trawler') {
      const reihen = g === 'netze' ? [3, 6, 9] : [5];
      reihen.forEach((y, i) => { const luecke = 2 + ((i * 4 + Math.floor(Math.random() * 3)) % (W - 4)); for (let x = 2; x < W; x++) if (x !== luecke && x !== luecke + 1) set(x, y, 'netz'); });
    }
    if (g === 'laerm') m.laerm = { felder: [[4, 5], [8, 4], [6, 8], [3, 9], [9, 9]], an: false, t: 0 };
  } else {
    for (let i = 0; i < 16; i++) { const x = Math.floor(Math.random() * W), y = 1 + Math.floor(Math.random() * (H - 4)); if (x !== 5 && x !== 6) set(x, y, 'baum'); }
    m.objekte.push({ x: 4, y: H - 3, art: 'schild' });
    if (m.gefahr === 'plantage') for (let y = 1; y < H - 3; y++) for (let x = 8; x < W; x++) set(x, y, 'palme');
    if (m.gefahr === 'plantage') for (let y = 2; y < H - 4; y += 3) for (let x = 0; x < 3; x++) set(x, y, 'palme');
    if (m.gefahr === 'feuer') m.feuerZeile = H;
  }
  // Ausgang frei halten
  set(m.ausgang[0], m.ausgang[1], welt === 'stall' ? 'gitter' : kacheln[m.ausgang[1] * W + m.ausgang[0]]);
  if (welt !== 'stall') { set(5, 0, welt === 'meer' ? 'wasser' : 'gras'); set(5, 1, welt === 'meer' ? 'wasser' : 'gras'); }
  set(m.start[0], m.start[1], welt === 'stall' ? 'stroh' : welt === 'meer' ? 'wasser' : 'gras');
  return m;
}

// ---------- Spielzustand ----------
let tp = null;
function tpStart() {
  const L = tl.L;
  tp = { k: 0, spieler: { x: 0, y: 0, px: 0, py: 0, spiegeln: false, schritt: 0 }, tasten: {}, dialog: null, lauf: 0, gelesen: false, uebergang: 0, letzteZeit: 0, tot: false };
  $('tlLebenKopfP').innerHTML = L.emoji + ' <b>' + L.name + '</b>';
  zeigeTlTeil('pixel');
  tpKapitel();
  const lauf = ++tpLaufNr;
  const frame = (t) => { if (lauf !== tpLaufNr || !tp) return; tpUpdate(t); if (!tp || lauf !== tpLaufNr) return; tpZeichnen(t); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
let tpLaufNr = 0;
function tpStopp() { tpLaufNr++; tp = null; const b = $('tpBox'); if (b) { b.classList.remove('szene'); b.hidden = true; } }

function tpKapitel() {
  const L = tl.L, K = L.kapitel[tp.k];
  tp.karte = tpKarte(tl.id, tp.k, K, L.kapitel.length);
  tp.gelesen = false; tp.gedraengelt = false;
  const s = tp.spieler;
  [s.x, s.y] = tp.karte.start; s.px = s.x * TP_T; s.py = s.y * TP_T;
  tp.uebergang = 1;
  $('tpKapitel').textContent = (tp.k + 1) + ' / ' + L.kapitel.length + ' · ' + K.zeit;
  tpDialog([{ html: '<b>' + K.zeit + ' – ' + K.titel + '</b><br>' + (tp.k === 0 ? 'Lauf zum ' + (tp.karte.welt === 'meer' ? 'Bojen-Zeichen' : 'Schild') + ' und lies es.' : (tp.karte.gefahr ? 'Lies das Schild – dann schaffe es zum Ausgang oben. Vorsicht!' : 'Lies das Schild.')) }]);
}

// Textbox mit Seiten; eine Seite kann Auswahlknöpfe haben
function tpDialog(seiten, fertig) {
  tp.dialog = { seiten, i: 0, fertig };
  tpDialogZeigen();
}
function tpDialogZeigen() {
  const d = tp.dialog, box = $('tpBox');
  if (!d) { box.hidden = true; return; }
  const S = d.seiten[d.i];
  box.hidden = false;
  box.innerHTML = '<div class="tp-text">' + S.html + '</div>' + (S.optionen ? '<div class="tp-optionen">' + S.optionen.map((o, i) => '<button type="button" data-i="' + i + '">▶ ' + o[0] + '</button>').join('') + '</div>' : '<span class="tp-weiter">▼</span>');
  if (S.optionen) box.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); S.wahl(Number(b.dataset.i)); }));
}
function tpDialogWeiter() {
  const d = tp && tp.dialog;
  if (!d || d.seiten[d.i].optionen) return;
  if (d.i < d.seiten.length - 1) { d.i++; tpDialogZeigen(); return; }
  tp.dialog = null; tpDialogZeigen();
  if (d.fertig) d.fertig();
}

// Schild lesen: Kapiteltext, dann ggf. Entscheidung
function tpSchild() {
  const K = tl.L.kapitel[tp.k];
  const seiten = [];
  if (K.text) seiten.push({ html: K.text });
  if (K.quelle) seiten.push({ html: '<small>Quelle: ' + K.quelle + '</small>' });
  const oeffnen = () => {
    tp.gelesen = true; tp.karte.offen = true;
    if (tp.karte.welt === 'stall') { const a = tp.karte.ausgang; tp.karte.kacheln[a[1] * tp.karte.W + a[0]] = 'auf'; }
    if (tp.karte.gefahr === 'feuer') tp.karte.feuerZeile = tp.karte.H - 1;
    const letzte = tp.k === tl.L.kapitel.length - 1;
    tpDialog([{ html: letzte ? (tl.wild ? 'Schwimm/geh zum Ausgang oben – und du hast es geschafft.' : 'Der Ausgang oben ist offen. Er führt zum Ende dieses Lebens.') : 'Der Ausgang oben ist jetzt offen. ▲' }]);
  };
  if (K.wahl) {
    seiten.push({ html: '<b>' + K.wahl.frage + '</b>', optionen: K.wahl.optionen, wahl: (i) => { tp.dialog = null; tpDialog([{ html: K.wahl.optionen[i][1] }], oeffnen); } });
  }
  if (!seiten.length) { oeffnen(); return; }
  tpDialog(seiten, K.wahl ? null : oeffnen);
}

function tpSterben(text) {
  if (tp.tot) return;
  tp.tot = true;
  tl.tot = text;
  if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
  tpDialog([{ html: '<b>✝ ' + text + '</b>' }, { html: '<small>Spielregel: In diesem Modus entscheidet dein Geschick. Die Gefahr selbst ist echt.</small>' }], () => { tpStopp(); tlEnde(); });
}

// ---------- Bewegung ----------
const tpRichtung = { hoch: [0, -1], runter: [0, 1], links: [-1, 0], rechts: [1, 0] };
function tpBlockiert(x, y) {
  const m = tp.karte;
  if (x < 0 || y < 0 || x >= m.W || y >= m.H) return true;
  const t = m.kacheln[y * m.W + x];
  if (['wand', 'trog', 'tuer', 'land', 'baum'].includes(t)) return true;
  if (t === 'gitter' && !(m.offen && x === m.ausgang[0] && y === m.ausgang[1])) return true;
  if (m.npcs.some((p) => p.x === x && p.y === y)) return true;
  if (m.objekte.some((o) => !o.unsichtbar && o.x === x && o.y === y)) return true;
  return false;
}
function tpVersuche(dir) {
  const s = tp.spieler;
  if (tp.dialog || tp.tot || s.px !== s.x * TP_T || s.py !== s.y * TP_T) return;
  const [dx, dy] = tpRichtung[dir];
  if (dx) s.spiegeln = dx < 0;
  s.blick = [dx, dy];
  const nx = s.x + dx, ny = s.y + dy, m = tp.karte;
  // Gegen Schild/Boje/Tür laufen = ansehen
  const obj = m.objekte.find((o) => o.x === nx && o.y === ny);
  if (obj) { tpAnsehen(obj); return; }
  const npc = m.npcs.find((p) => p.x === nx && p.y === ny);
  if (npc && !npc.fest) {
    npc.x = s.x; npc.y = s.y; s.x = nx; s.y = ny; s.schritt++; tp.langsam = 260;
    if (!tp.gedraengelt && m.npcs.length > 15) { tp.gedraengelt = true; tpAnstossen(npc); }
    return;
  }
  if (npc) { tpAnstossen(npc); return; }
  if (m.mutter && m.kacheln[ny * m.W + nx] === 'gitter' && !(nx === m.ausgang[0] && ny === m.ausgang[1])) { tpDialog([{ html: 'Hinter dem Gitter steht deine Mutter. Du kommst nicht zu ihr – und sie nicht zu dir.' }]); return; }
  if (m.welt === 'stall' && nx === m.ausgang[0] && ny === m.ausgang[1] && !m.offen) { tpDialog([{ html: 'Das Gitter ist zu. Lies zuerst das Schild.' }]); return; }
  if (tpBlockiert(nx, ny)) return;
  s.x = nx; s.y = ny; s.schritt++;
}
function tpAnsehen(obj) {
  if (obj.art === 'tuer') { tpDialog([{ html: TP_TUER_TEXT[tl.id] || 'Die Tür bleibt zu.' }]); return; }
  tpSchild();
}
function tpAnstossen(npc) {
  if (npc.mutter) { tpDialog([{ html: 'Deine Mutter ist hinter dem Gitter. Du kommst nicht zu ihr.' }]); return; }
  const n = tp.karte.npcs.length;
  const texte = n > 40 ? ['Alle stehen dicht an dicht. Du kommst nur noch durch, indem du dich zwischen den anderen hindurchquetschst.']
    : n > 15 ? ['Du musst dich an den anderen vorbeidrängeln. Es wird enger.'] : ['Ein Artgenosse. Ihr kennt euch vom Futtertrog.'];
  tpDialog([{ html: texte[Math.floor(Math.random() * texte.length)] }]);
}
function tpA() {
  if (!tp) return;
  if (tp.dialog) { tpDialogWeiter(); return; }
  const s = tp.spieler, b = s.blick || [0, -1], m = tp.karte;
  const obj = m.objekte.find((o) => o.x === s.x + b[0] && o.y === s.y + b[1]) || m.objekte.find((o) => Math.abs(o.x - s.x) + Math.abs(o.y - s.y) <= 1);
  if (obj) tpAnsehen(obj);
}

// ---------- Spiellogik pro Frame ----------
function tpUpdate(t) {
  const dt = tp.letzteZeit ? Math.min(60, t - tp.letzteZeit) : 16; tp.letzteZeit = t;
  if (tp.szene) {
    tp.szene.t += dt;
    if (tp.szene.t >= TP_SZENEN[tp.szene.nr].dauer && tp.szene.nr < TP_SZENEN.length - 1) { tp.dialog = null; tpSzeneWeiter(); }
    return;
  }
  const s = tp.spieler, m = tp.karte;
  // gleitende Bewegung
  const v = dt * (tp.langsam ? 0.045 : 0.11);
  if (tp.langsam) tp.langsam = Math.max(0, tp.langsam - dt);
  s.px += Math.sign(s.x * TP_T - s.px) * Math.min(v, Math.abs(s.x * TP_T - s.px));
  s.py += Math.sign(s.y * TP_T - s.py) * Math.min(v, Math.abs(s.y * TP_T - s.py));
  const amZiel = s.px === s.x * TP_T && s.py === s.y * TP_T;
  if (amZiel && !tp.dialog && !tp.tot) {
    const dir = ['hoch', 'runter', 'links', 'rechts'].find((d) => tp.tasten[d]);
    if (dir) tpVersuche(dir);
    // Ausgang erreicht
    if (m.offen && s.x === m.ausgang[0] && s.y === m.ausgang[1]) { tpNaechstes(); return; }
    // Gefahrenkacheln
    const k = m.kacheln[s.y * m.W + s.x], K = tl.L.kapitel[tp.k];
    if (k === 'netz') tpSterben(K.tod || 'Du hast dich in einem Netz verfangen.');
    if (k === 'palme') tpSterben(K.tod || 'Am Plantagenrand bist du gefangen worden.');
    if (k === 'feuer') tpSterben(K.tod || 'Das Feuer war schneller.');
  }
  tp.uebergang = Math.max(0, tp.uebergang - dt / 400);
  if (tp.dialog) return;
  // Artgenossen wackeln und tauschen gelegentlich den Platz
  m.npcs.forEach((p) => {
    if (p.fest) return;
    if (Math.random() < 0.004) {
      const [dx, dy] = Object.values(tpRichtung)[Math.floor(Math.random() * 4)];
      const nx = p.x + dx, ny = p.y + dy;
      if (!tpBlockiert(nx, ny) && !(nx === s.x && ny === s.y) && !(nx === m.ausgang[0] && ny === m.ausgang[1])) { p.x = nx; p.y = ny; p.spiegeln = dx < 0 ? true : dx > 0 ? false : p.spiegeln; }
    }
  });
  // Schiffe fahren quer
  m.gefahren.forEach((g) => {
    g.t += dt;
    if (g.t >= g.takt) { g.t = 0; g.x += g.d; if (g.x > m.W + 1) g.x = -g.len - 1; if (g.x < -g.len - 1) g.x = m.W + 1; }
    const trifft = s.y === g.y && s.x >= Math.round(g.x) && s.x < Math.round(g.x) + g.len;
    const netzTrifft = g.netz && s.y === g.y + 1 && s.x >= Math.round(g.x) - 2 && s.x < Math.round(g.x) + g.len;
    if ((trifft || netzTrifft) && !tp.tot) tpSterben(tl.L.kapitel[tp.k].tod || 'Ein Schiff hat dich erwischt.');
  });
  // Lärm: pulsiert, ist er an, ist das Feld gefährlich
  if (m.laerm) {
    m.laerm.t += dt;
    if (m.laerm.t > (m.laerm.an ? 900 : 1500)) { m.laerm.t = 0; m.laerm.an = !m.laerm.an; }
    if (m.laerm.an && m.laerm.felder.some(([x, y]) => Math.abs(x - s.x) <= 1 && Math.abs(y - s.y) <= 1)) tpSterben(tl.L.kapitel[tp.k].tod || 'Der Lärm hat dein Gehör zerstört.');
  }
  // Feuer frisst sich von unten nach oben, sobald das Schild gelesen ist
  if (m.gefahr === 'feuer' && m.offen) {
    m.feuerTakt += dt;
    if (m.feuerTakt > 1100 && m.feuerZeile > 2) {
      m.feuerTakt = 0; m.feuerZeile--;
      for (let x = 0; x < m.W; x++) if (m.kacheln[m.feuerZeile * m.W + x] !== 'baum' || Math.random() < 0.6) m.kacheln[m.feuerZeile * m.W + x] = 'feuer';
      if (s.y >= m.feuerZeile) tpSterben(tl.L.kapitel[tp.k].tod || 'Das Feuer war schneller.');
    }
  }
}
function tpNaechstes() {
  if (tp.k >= tl.L.kapitel.length - 1) {
    if (TP_SCHLACHT_TIERE.includes(tl.id)) { tpSchlachtFrage(); return; }
    tpStopp(); tlEnde(); return;
  }
  tp.k++;
  tpKapitel();
}

// ---------- Schlachtung: Geflügel, Elektro-Wasserbad (eine der üblichen Methoden) ----------
const TP_SCHLACHT_TIERE = ['masthuhn', 'legehenne', 'pute', 'ente'];
const TP_PRO_TAG = { masthuhn: 640.3, legehenne: 20.7, pute: 27.6, ente: 8.3 };
function tpSchlachtFrage() {
  const s = tp.spieler; s.px = s.x * TP_T; s.py = s.y * TP_T; tp.tasten = {};
  tpDialog([{ html: '<b>Inhaltshinweis</b><br>Als Nächstes folgt die Schlachtung – als Pixel-Animation, ohne Blut, aber ohne Beschönigung. Gezeigt wird das Elektro-Wasserbad, eine der üblichen Methoden für Geflügel in Deutschland.',
    optionen: [['Ansehen'], ['Überspringen']], wahl: (i) => { tp.dialog = null; tpDialogZeigen(); if (i === 0) tpSchlachtStart(); else { tpStopp(); tlEnde(); } } }]);
}
const TP_SZENEN = [
  { dauer: 7000, text: () => '<b>Ausstallen</b><br>Nach wenigen Wochen kommen Fängertrupps in den Stall – oft nachts, weil die Tiere im Dunkeln ruhiger sind. Sie werden gegriffen und in Transportkisten gesetzt.' },
  { dauer: 6000, text: () => '<b>Transport</b><br>Mit Lkw geht es zum Schlachthof. Viele Tiere sind zum ersten Mal unter freiem Himmel – in einer Kiste.' },
  { dauer: 7000, text: () => '<b>Einhängen</b><br>Am Schlachthof werden die Tiere bei vollem Bewusstsein kopfüber an den Füßen in Metallbügel gehängt. Ein Förderband zieht sie weiter.' },
  { dauer: 8000, text: () => '<b>Betäubung im Wasserbad</b><br>Die Köpfe werden durch ein unter Strom stehendes Wasserbad gezogen. Das Gesetz schreibt vor, Tiere vor dem Töten zu betäuben (EU-Verordnung 1099/2009). Tiere, die den Kopf heben, können das Bad verfehlen.' },
  { dauer: 6500, text: () => '<b>Töten</b><br>Danach wird der Hals durchtrennt, die Tiere verbluten. Es folgen Brühen, Rupfen und Zerlegen – am Ende liegt das Fleisch verpackt im Kühlregal.' },
  { dauer: 9000, text: () => { const n = TP_PRO_TAG[tl.id] || 640.3; return 'Das war ein Leben. In Deutschland geschieht das <b>' + fmt((n * 1e6 / 365 / 1e6).toFixed(2)).replace(',00', '') + ' Millionen</b> Mal – <b>an jedem einzelnen Tag</b> ' + (tl.id === 'masthuhn' ? 'allein mit Masthühnern' : 'allein mit dieser Tierart') + '.<br><small>Quelle: Destatis, Schlachtungen 2025</small>'; } },
];
function tpSchlachtStart() {
  tp.szene = { nr: 0, t: 0 };
  tp.letzteZeit = 0;
  tpSzeneText();
}
function tpSzeneText() {
  const S = TP_SZENEN[tp.szene.nr];
  tp.dialog = { seiten: [{ html: S.text() }], i: 0, fertig: tpSzeneWeiter, szene: true };
  tpDialogZeigen();
  $('tpBox').classList.add('szene');
}
function tpSzeneWeiter() {
  if (!tp || !tp.szene) return;
  if (tp.szene.nr >= TP_SZENEN.length - 1) { tpStopp(); tlEnde(); return; }
  tp.szene.nr++; tp.szene.t = 0;
  tpSzeneText();
}
const TP_MENSCH = ['................', '......3333......', '.....333333.....', '.....333333.....', '......3333......', '....33333333....', '...3333333333...', '...3333333333...',
  '..33.333333.33..', '..33.333333.33..', '.....333333.....', '.....33..33.....', '.....33..33.....', '.....33..33.....', '....333..333....', '................'];
TP_SPRITES.mensch = TP_MENSCH;
function tpKiste(x, px, py, pal, inhalt) {
  const c = TP_PALETTEN[pal];
  x.fillStyle = c[2]; x.fillRect(px, py, 22, 14);
  x.fillStyle = c[3]; for (let i = 0; i < 22; i += 4) x.fillRect(px + i, py, 1, 14); x.fillRect(px, py, 22, 1); x.fillRect(px, py + 13, 22, 1);
  if (inhalt) { x.fillStyle = c[0]; for (let i = 0; i < inhalt; i++) x.fillRect(px + 3 + i * 5, py + 4, 3, 3); }
}
function tpSzeneZeichnen(x, t) {
  const sz = tp.szene, pal = 'stall', c = TP_PALETTEN[pal], st = sz.t, tier = TP_TIER[tl.id];
  x.fillStyle = c[3]; x.fillRect(0, 0, TP_W, TP_H);
  if (sz.nr === 0) {
    // dunkler Stall, Kisten rechts, Fänger, Tiere wandern in die Kisten
    x.fillStyle = '#3a2a14'; x.fillRect(0, 70, TP_W, 74);
    for (let i = 0; i < 6; i++) tpKiste(x, 120, 120 - i * 15, pal, Math.min(4, Math.max(0, Math.floor(st / 400) - i * 4)));
    for (let i = 0; i < 26; i++) {
      const start = i * 230, f = Math.max(0, Math.min(1, (st - start) / 900));
      const bx = 6 + (i % 7) * 15 + (i * 13) % 9, by = 76 + Math.floor(i / 7) * 16;
      const px = bx + (122 - bx) * f, py = by + (110 - Math.floor(i / 4) * 2 - by) * f;
      if (f < 1) x.drawImage(tpBild(tier, pal, i % 2 === 0), Math.round(px), Math.round(py) - (f > 0 && f < 1 ? Math.floor(t / 80) % 2 * 3 : 0));
    }
    const fx = 30 + Math.sin(t / 400) * 30;
    x.drawImage(tpBild('mensch', pal), Math.round(fx), 66); x.drawImage(tpBild('mensch', pal, true), Math.round(fx + 40), 70);
    x.globalAlpha = 0.28; x.fillStyle = '#000'; x.fillRect(0, 0, TP_W, TP_H); x.globalAlpha = 1;
    x.fillStyle = c[1]; x.fillRect(0, 0, TP_W, 2);
  } else if (sz.nr === 1) {
    // Landstraße bei Nacht, Lkw mit Kistenstapel fährt durch
    x.fillStyle = '#0d0a05'; x.fillRect(0, 0, TP_W, 90);
    x.fillStyle = c[0]; for (let i = 0; i < 14; i++) x.fillRect((i * 37 + 11) % TP_W, (i * 23) % 60 + 4, 1, 1);
    x.fillStyle = '#2a2016'; x.fillRect(0, 90, TP_W, 54);
    x.fillStyle = c[1]; for (let i = 0; i < 8; i++) x.fillRect(((i * 30 - st / 8) % 240 + 240) % 240 - 40, 116, 14, 2);
    const lx = -110 + (st / 6000) * 300;
    for (let r = 0; r < 4; r++) for (let s2 = 0; s2 < 4; s2++) tpKiste(x, Math.round(lx + s2 * 23), 58 + r * 13, pal, 4);
    x.fillStyle = c[2]; x.fillRect(Math.round(lx) - 2, 110, 96, 6);
    x.fillStyle = c[1]; x.fillRect(Math.round(lx) + 94, 82, 26, 34); x.fillStyle = c[0]; x.fillRect(Math.round(lx) + 108, 86, 10, 10);
    x.fillStyle = '#000'; [8, 40, 78, 108].forEach((o) => x.fillRect(Math.round(lx) + o, 114, 10, 10));
    x.globalAlpha = 0.35; x.fillStyle = '#f8f0d8'; x.beginPath(); x.moveTo(lx + 120, 92); x.lineTo(lx + 200, 80); x.lineTo(lx + 200, 116); x.fill(); x.globalAlpha = 1;
  } else {
    // Schlachtband: Schiene oben, Tiere kopfüber an Bügeln
    const kalt = '#1a1612';
    x.fillStyle = kalt; x.fillRect(0, 0, TP_W, TP_H);
    x.fillStyle = '#5a5248'; x.fillRect(0, 18, TP_W, 3);
    const bad = sz.nr >= 3, dunkel = sz.nr >= 4;
    const tempo = 0.028, abstand = 26, versatz = (st * tempo) % abstand;
    if (bad) {
      x.fillStyle = '#2c4a5a'; x.fillRect(46, 60, 72, 26);
      x.fillStyle = '#4f7f96'; for (let i = 0; i < 9; i++) x.fillRect(48 + i * 8 + (Math.floor(t / 150) % 2) * 2, 60, 4, 1);
      x.fillStyle = '#888'; x.fillRect(44, 58, 2, 30); x.fillRect(118, 58, 2, 30);
    }
    for (let i = -1; i < 8; i++) {
      const hx = i * abstand + versatz - 10;
      x.fillStyle = '#8a8074'; x.fillRect(Math.round(hx) + 7, 20, 2, 12);
      if (sz.nr === 2 && hx < 30 && i < 1) continue;   // vorne wird gerade eingehängt
      const imBad = bad && hx > 40 && hx < 112, danach = bad && hx >= 112;
      x.save();
      x.translate(Math.round(hx), imBad ? 44 : 32);
      x.scale(1, -1);
      if (danach || dunkel) x.globalAlpha = 0.75;
      x.drawImage(tpBild(tier, pal), 0, -16);
      x.restore();
      if (imBad && Math.floor(t / 70) % 2) { x.fillStyle = '#f8f0a0'; x.fillRect(Math.round(hx) + 3, 56, 1, 3); x.fillRect(Math.round(hx) + 12, 57, 1, 3); x.fillRect(Math.round(hx) + 7, 54, 2, 1); }
    }
    if (sz.nr === 2) { x.drawImage(tpBild('mensch', pal), 4, 44); x.drawImage(tpBild('mensch', pal, true), 22, 46); }
    if (dunkel) {
      const f = Math.min(1, st / 4000);
      const g = x.createLinearGradient(0, 0, TP_W, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.55, 'rgba(0,0,0,' + (0.4 + f * 0.5) + ')'); g.addColorStop(1, 'rgba(0,0,0,1)');
      x.fillStyle = g; x.fillRect(0, 0, TP_W, TP_H);
      x.fillStyle = '#5a1a14'; x.fillRect(118, 100, 42, 2);
    }
  }
  if (sz.nr === 5) {
    // Zähler: Silhouetten füllen den Bildschirm
    x.fillStyle = '#000'; x.fillRect(0, 0, TP_W, TP_H);
    const n = Math.min(360, Math.floor(st / 18));
    for (let i = 0; i < n; i++) x.drawImage(tpBild(tier, pal, i % 3 === 0), (i % 20) * 8, Math.floor(i / 20) * 8, 8, 8);
  }
}

// ---------- Zeichnen ----------
function tpZeichnen(t) {
  const cv = $('tpBild'), x = cv.getContext('2d');
  x.imageSmoothingEnabled = false;
  if (tp.szene) { tpSzeneZeichnen(x, t); return; }
  const m = tp.karte, pal = m.welt, s = tp.spieler;
  const camX = Math.max(0, Math.min(m.W * TP_T - TP_W, s.px + 8 - TP_W / 2)), camY = Math.max(0, Math.min(m.H * TP_T - TP_H, s.py + 8 - TP_H / 2));
  x.fillStyle = TP_PALETTEN[pal][3]; x.fillRect(0, 0, TP_W, TP_H);
  const welle = Math.floor(t / 500) % 2;
  for (let ty = 0; ty < m.H; ty++) for (let tx = 0; tx < m.W; tx++) {
    let k = m.kacheln[ty * m.W + tx];
    const px = tx * TP_T - camX, py = ty * TP_T - camY;
    if (px < -16 || py < -16 || px > TP_W || py > TP_H) continue;
    if (k === 'netz' || k === 'wasser') x.drawImage(tpBild('wasser', pal), px + (welle && k === 'wasser' ? 1 : 0), py);
    if (k === 'palme' || k === 'baum' || k === 'feuer') x.drawImage(tpBild('gras', pal), px, py);
    if (k === 'feuer' && Math.floor(t / 180) % 2) x.drawImage(tpBild('feuer', pal, true), px, py);
    else x.drawImage(tpBild(k, pal), px, py);
    if (k === 'gitter' && m.offen && tx === m.ausgang[0] && ty === m.ausgang[1]) x.drawImage(tpBild('auf', pal), px, py);
  }
  // Ausgang im Meer/Wald markieren
  if (m.welt !== 'stall') {
    const [ax, ay] = m.ausgang;
    x.globalAlpha = m.offen ? 0.6 + 0.4 * Math.sin(t / 200) : 0.25;
    x.drawImage(tpBild('auf', pal), ax * TP_T - camX, ay * TP_T - camY);
    x.globalAlpha = 1;
  }
  // Lärmfelder
  if (m.laerm) m.laerm.felder.forEach(([lx, ly]) => { x.globalAlpha = m.laerm.an ? 1 : 0.3; x.drawImage(tpBild('laerm', pal), lx * TP_T - camX, ly * TP_T - camY); x.globalAlpha = 1; });
  // Objekte
  m.objekte.forEach((o) => {
    if (o.unsichtbar) return;
    x.drawImage(tpBild(o.art, pal), o.x * TP_T - camX, o.y * TP_T - camY);
    if (!tp.gelesen && Math.floor(t / 400) % 2) { x.fillStyle = TP_PALETTEN[pal][3]; x.fillRect(o.x * TP_T - camX + 7, o.y * TP_T - camY - 9, 2, 5); x.fillRect(o.x * TP_T - camX + 7, o.y * TP_T - camY - 3, 2, 2); }
  });
  // Schiffe
  m.gefahren.forEach((g) => {
    const gx = Math.round(g.x) * TP_T - camX, gy = g.y * TP_T - camY, c = TP_PALETTEN[pal];
    x.fillStyle = c[3]; x.fillRect(gx, gy + 3, g.len * TP_T, 11);
    x.fillStyle = c[2]; x.fillRect(gx + 2, gy + 5, g.len * TP_T - 4, 7);
    x.fillStyle = c[0]; for (let i = 0; i < g.len; i++) x.fillRect(gx + i * TP_T + 5, gy + 6, 5, 4);
    x.fillStyle = c[3]; x.fillRect(gx + (g.d > 0 ? g.len * TP_T : -3), gy + 6, 3, 5);
    if (g.netz) { for (let i = -2; i < g.len; i++) x.drawImage(tpBild('netz', pal), gx + i * TP_T, gy + TP_T); }
  });
  // Tiere (Artgenossen, dann du)
  const sprite = TP_TIER[tl.id];
  (m.deko || []).forEach((d) => {
    const wackel = Math.floor((t + d.p) / 260) % 2;
    x.drawImage(tpBild(sprite, pal, d.spiegeln), Math.round(d.x * TP_T - camX), Math.round(d.y * TP_T - camY) - wackel);
  });
  m.npcs.forEach((p) => {
    const wackel = Math.floor((t / 300 + p.x * 7 + p.y * 3)) % 2;
    x.drawImage(tpBild(p.sprite, pal, p.spiegeln), p.x * TP_T - camX, p.y * TP_T - camY - wackel);
  });
  const bob = (s.px !== s.x * TP_T || s.py !== s.y * TP_T) ? Math.floor(t / 90) % 2 : 0;
  x.drawImage(tpBild(sprite, pal, s.spiegeln), Math.round(s.px - camX), Math.round(s.py - camY) - bob);
  // Markierung „du“
  x.fillStyle = TP_PALETTEN[pal][3];
  x.fillRect(Math.round(s.px - camX) + 6, Math.round(s.py - camY) - 5 - bob, 4, 2);
  if (m.welt === 'stall' && m.voll > 0.3) { x.globalAlpha = (m.voll - 0.3) * 0.32; x.fillStyle = TP_PALETTEN.stall[3]; x.fillRect(0, 0, TP_W, TP_H); x.globalAlpha = 1; }
  // Überblendung
  if (tp.uebergang > 0) { x.globalAlpha = tp.uebergang; x.fillStyle = TP_PALETTEN[pal][3]; x.fillRect(0, 0, TP_W, TP_H); x.globalAlpha = 1; }
}

// ---------- Steuerung ----------
(() => {
  const halten = (dir, an) => { if (tp) tp.tasten[dir] = an; };
  document.querySelectorAll('#tpPad [data-dir]').forEach((b) => {
    const d = b.dataset.dir;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); halten(d, true); if (tp && !tp.dialog) tpVersuche(d); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => b.addEventListener(ev, () => halten(d, false)));
  });
  $('tpA').addEventListener('pointerdown', (e) => { e.preventDefault(); tpA(); });
  $('tpBox').addEventListener('click', () => tpDialogWeiter());
  const TASTEN = { ArrowUp: 'hoch', ArrowDown: 'runter', ArrowLeft: 'links', ArrowRight: 'rechts', w: 'hoch', s: 'runter', a: 'links', d: 'rechts' };
  document.addEventListener('keydown', (e) => {
    if (!tp || $('tl-pixel').hidden) return;
    if (TASTEN[e.key]) { e.preventDefault(); halten(TASTEN[e.key], true); }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tpA(); }
  });
  document.addEventListener('keyup', (e) => { if (tp && TASTEN[e.key]) halten(TASTEN[e.key], false); });
})();
