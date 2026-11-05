// 🃏 Klassiker: fünf zeitlose Spiele in einer App – Solitär (Klondike), Sudoku, Holzblöcke, Minensuche, Vier in einer Reihe.
// Alles traditionelle Spielideen bzw. offene Genres, eigene Grafik. Laufende Partien werden gespeichert und fortgesetzt.
// Speicher: walquiz.klassiker.v1 = { best: {...}, stand: { solitaer, sudoku, bloecke }, einst: {...}, stat: {...} }
const KL_KEY = 'walquiz.klassiker.v1';
const klStore = () => { const s = loadJson(KL_KEY); s.best = s.best || {}; s.stand = s.stand || {}; s.einst = s.einst || {}; s.stat = s.stat || {}; return s; };
const klSave = (s) => saveJson(KL_KEY, s);
const KL_SPIELE = {
  solitaer: { name: 'Solitär', emoji: '🂡', text: 'Klondike – alle Karten auf die Ablagen', farbe: '#16a34a' },
  sudoku: { name: 'Sudoku', emoji: '🔢', text: 'Jede Ziffer einmal pro Zeile, Spalte, Block', farbe: '#2563eb' },
  bloecke: { name: 'Holzblöcke', emoji: '🟫', text: 'Teile legen, Reihen und Blöcke abräumen', farbe: '#b45309' },
  minen: { name: 'Minensuche', emoji: '💣', text: 'Zahlen lesen, Minen markieren', farbe: '#64748b' },
  vier: { name: 'Vier in einer Reihe', emoji: '🔴', text: 'Gegen den Computer oder zu zweit', farbe: '#dc2626' },
};
let klAktiv = null, klUhr = null;
const klZufall = () => zufallsGenerator('kl-' + Date.now() + Math.random());
const klZeit = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function klVerlauf(spiel, p, m, info, extra) { if (typeof merkeVerlauf === 'function') merkeVerlauf('klassiker', p, m, KL_SPIELE[spiel].name + ' · ' + info, { modus: spiel, ...(extra || {}) }); }
function klKopf(titel, info) { $('klTitel').textContent = titel; $('klInfo').textContent = info || ''; }
function klStoppUhr() { clearInterval(klUhr); klUhr = null; }
function klVibrieren(m) { if (navigator.vibrate) navigator.vibrate(m); }

// ---------- Startseite ----------
function klHome() {
  klStoppUhr(); klAktiv = null;
  const st = klStore();
  klKopf('🃏 Klassiker');
  const best = {
    solitaer: st.stat.solitaerSiege ? st.stat.solitaerSiege + '× gewonnen' : '',
    sudoku: st.stat.sudokuGeloest ? st.stat.sudokuGeloest + ' gelöst' + (st.best.sudoku_schwer ? ' · Schwer ' + klZeit(st.best.sudoku_schwer) : '') : '',
    bloecke: st.best.bloecke ? 'Rekord ' + fmt(st.best.bloecke) : '',
    minen: st.stat.minenSiege ? st.stat.minenSiege + '× geräumt' : '',
    vier: st.stat.vierSiege ? st.stat.vierSiege + ' Siege' : '',
  };
  $('klInhalt').innerHTML = '<div class="kl-held"><h2>Klassiker</h2><p>Fünf Spiele, die nie alt werden. Laufende Partien merkt sich die App.</p></div><div class="kl-kacheln">'
    + Object.entries(KL_SPIELE).map(([id, S]) => '<button type="button" class="kl-kachel kl-k-' + id + '" data-kl="' + id + '" style="--f:' + S.farbe + '"><span class="kl-k-bild" aria-hidden="true">' + klMiniBild(id) + '</span><span class="kl-k-text"><b>' + S.name + '</b><small>' + S.text + '</small>'
      + (st.stand[id] ? '<em>▶ Fortsetzen</em>' : best[id] ? '<em>' + best[id] + '</em>' : '') + '</span></button>').join('') + '</div>';
  $('klInhalt').querySelectorAll('[data-kl]').forEach((b) => b.addEventListener('click', () => klOeffnen(b.dataset.kl)));
}
function klMiniBild(id) {
  if (id === 'solitaer') return '<i class="klm-karte r">A<br>♥</i><i class="klm-karte s">K<br>♠</i>';
  if (id === 'sudoku') return '<i class="klm-gitter">' + [5, 3, '', '', 7, '', 6, '', 9].map((z) => '<s>' + z + '</s>').join('') + '</i>';
  if (id === 'bloecke') return '<i class="klm-bloecke">' + [1, 1, 0, 1, 1, 1, 0, 1, 0].map((z) => '<s class="' + (z ? 'v' : '') + '"></s>').join('') + '</i>';
  if (id === 'minen') return '<i class="klm-minen"><s>1</s><s>2</s><s class="f">🚩</s><s></s><s>1</s><s>3</s></i>';
  return '<i class="klm-vier"><s class="r"></s><s class="g"></s><s class="r"></s><s class="g"></s><s class="r"></s><s class="r"></s></i>';
}
function klOeffnen(id) {
  klStoppUhr(); klAktiv = id;
  ({ solitaer: solStart, sudoku: sdStart, bloecke: blStart, minen: mnStart, vier: vrStart })[id]();
}
function klZeigen() { const sc = $('screen-klassiker'); if (sc && !sc.classList.contains('active')) show('klassiker', '🃏 Klassiker'); }
$('hubKlassiker').addEventListener('click', () => { merkeZuletzt('klassiker'); zoomZu($('hubKlassiker'), () => { klZeigen(); klHome(); }); });
$('klZurueck').addEventListener('click', () => {
  if (klAktiv) { if (klAktiv === 'solitaer') solSpeichern(); if (klAktiv === 'sudoku') sdSpeichern(); if (klAktiv === 'bloecke') blSpeichern(); klHome(); return; }
  klStoppUhr(); zeigeHub();
});
function klErgebnis(titel, text, nochmal) {
  const d = document.createElement('div');
  d.className = 'kl-ergebnis';
  d.innerHTML = '<div class="kl-erg-karte"><h3>' + titel + '</h3><p>' + text + '</p><div class="kl-erg-knoepfe"><button type="button" class="btn" id="klErgNochmal">Nochmal</button><button type="button" class="btn secondary" id="klErgHome">Zu den Klassikern</button></div></div>';
  $('klInhalt').appendChild(d);
  $('klErgNochmal').addEventListener('click', () => { d.remove(); nochmal(); });
  $('klErgHome').addEventListener('click', () => klHome());
}

// =====================================================================
// 🂡 SOLITÄR (Klondike) – Tippen zieht die Karte automatisch an den besten Platz
// =====================================================================
const SOL_FARBEN = ['♠', '♥', '♦', '♣'], SOL_ROT = [false, true, true, false], SOL_WERTE = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K'];
let sol = null;
function solNeu(ziehe3) {
  const r = klZufall(), deck = [];
  for (let f = 0; f < 4; f++) for (let w = 1; w <= 13; w++) deck.push({ f, w, o: false });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const tab = [];
  for (let s = 0; s < 7; s++) { tab.push(deck.splice(0, s + 1)); tab[s][s].o = true; }
  return { stock: deck, waste: [], found: [[], [], [], []], tab, ziehe3: !!ziehe3, zuege: 0, zeit: 0, rueck: [], durchgaenge: 0 };
}
const solKopie = (S) => JSON.stringify({ stock: S.stock, waste: S.waste, found: S.found, tab: S.tab, zuege: S.zuege, durchgaenge: S.durchgaenge });
function solSchritt() { sol.rueck.push(solKopie(sol)); if (sol.rueck.length > 300) sol.rueck.shift(); }
const solAufAblage = (k, ab) => (ab.length ? ab[ab.length - 1].f === k.f && ab[ab.length - 1].w === k.w - 1 : k.w === 1);
const solAufSpalte = (k, sp) => (sp.length ? (() => { const o = sp[sp.length - 1]; return o.o && SOL_ROT[o.f] !== SOL_ROT[k.f] && o.w === k.w + 1; })() : k.w === 13);
function solStart(neu) {
  klZeigen();
  const st = klStore();
  if (!neu && st.stand.solitaer) { sol = st.stand.solitaer; sol.rueck = []; }
  else sol = solNeu(st.einst.ziehe3);
  solZeichnen(); solUhrAn();
}
function solUhrAn() { klStoppUhr(); klUhr = setInterval(() => { if (!sol || sol.fertig) return; sol.zeit++; const z = $('solZeit'); if (z) z.textContent = klZeit(sol.zeit); }, 1000); }
function solSpeichern() { const st = klStore(); if (sol && !sol.fertig && sol.zuege > 0) { const k = { ...sol }; delete k.rueck; st.stand.solitaer = k; } else delete st.stand.solitaer; klSave(st); }
function solKarteHtml(k, attr) {
  if (!k.o) return '<div class="sol-karte zu" ' + (attr || '') + '></div>';
  return '<div class="sol-karte ' + (SOL_ROT[k.f] ? 'rot' : 'schwarz') + '" ' + (attr || '') + '><span class="sk-e">' + SOL_WERTE[k.w] + '<i>' + SOL_FARBEN[k.f] + '</i></span><span class="sk-m">' + SOL_FARBEN[k.f] + '</span></div>';
}
function solZeichnen() {
  klKopf('🂡 Solitär', sol.ziehe3 ? '3 ziehen' : '1 ziehen');
  const S = sol, wt = S.waste.slice(S.ziehe3 ? -3 : -1);
  $('klInhalt').innerHTML = '<div class="sol-feld" id="solFeld">'
    + '<div class="sol-oben"><div class="sol-platz" data-z="stock">' + (S.stock.length ? '<div class="sol-karte zu stapel"><b>' + S.stock.length + '</b></div>' : '<div class="sol-leer">↻</div>') + '</div>'
    + '<div class="sol-platz sol-waste' + (S.ziehe3 ? ' drei' : '') + '" data-z="waste">' + wt.map((k, i) => solKarteHtml(k, 'style="--i:' + i + '"' + (i === wt.length - 1 ? ' data-z="waste"' : ''))).join('') + '</div><div class="sol-luecke"></div>'
    + S.found.map((ab, i) => '<div class="sol-platz sol-ablage" data-z="f' + i + '">' + (ab.length ? solKarteHtml(ab[ab.length - 1], 'data-z="f' + i + '"') : '<div class="sol-leer">' + SOL_FARBEN[i] + '</div>') + '</div>').join('') + '</div>'
    + '<div class="sol-tab">' + S.tab.map((sp, s) => '<div class="sol-spalte" data-z="t' + s + '">' + (sp.length ? '' : '<div class="sol-leer">K</div>') + sp.map((k, i) => solKarteHtml(k, 'data-z="t' + s + '" data-i="' + i + '" style="--y:' + i + '"')).join('') + '</div>').join('') + '</div></div>'
    + '<div class="kl-leiste"><span>⏱ <b id="solZeit">' + klZeit(S.zeit) + '</b></span><span>Züge <b>' + S.zuege + '</b></span>'
    + '<button type="button" class="kl-knopf" id="solRueck"' + (S.rueck.length ? '' : ' disabled') + '>↶ Zurück</button>'
    + (solKannAutomatisch() ? '<button type="button" class="kl-knopf an" id="solAuto">⚡ Fertig legen</button>' : '<button type="button" class="kl-knopf" id="solTipp">💡 Tipp</button>')
    + '<button type="button" class="kl-knopf" id="solNeu">Neu</button></div>'
    + '<div class="kl-einst"><label><input type="checkbox" id="solDrei"' + (S.ziehe3 ? ' checked' : '') + '> 3 Karten ziehen (schwerer, gilt ab dem nächsten Spiel)</label></div>';
  // Spaltenhöhe: geschlossene Karten enger
  $('klInhalt').querySelectorAll('.sol-spalte').forEach((sp, s) => { let y = 0; [...sp.querySelectorAll('.sol-karte')].forEach((el, i) => { el.style.setProperty('--y', y); y += S.tab[s][i].o ? 1 : 0.42; }); sp.style.setProperty('--h', y); });
  $('solFeld').addEventListener('click', solTipp);
  $('solRueck').addEventListener('click', () => { const r = sol.rueck.pop(); if (r) { Object.assign(sol, JSON.parse(r)); solZeichnen(); } });
  $('solNeu').addEventListener('click', () => { delete sol.fertig; const st = klStore(); delete st.stand.solitaer; klSave(st); solStart(true); });
  $('solDrei').addEventListener('change', (e) => { const st = klStore(); st.einst.ziehe3 = e.target.checked; klSave(st); });
  if ($('solAuto')) $('solAuto').addEventListener('click', solAutomatisch);
  if ($('solTipp')) $('solTipp').addEventListener('click', (e) => { e.stopPropagation(); solHinweis(); });
}
function solTipp(e) {
  const el = e.target.closest('[data-z]');
  if (!el || sol.fertig) return;
  const z = el.dataset.z;
  if (z === 'stock') { solZiehen(); return; }
  let ok = false;
  if (z === 'waste') ok = solBewegen({ von: 'waste' });
  else if (z[0] === 'f') ok = solBewegen({ von: z });
  else if (z[0] === 't') {
    const s = +z.slice(1), sp = sol.tab[s];
    let i = el.dataset.i != null ? +el.dataset.i : sp.length - 1;
    if (i < 0) return;
    if (!sp[i].o) { if (i === sp.length - 1) { solSchritt(); sp[i].o = true; sol.zuege++; ok = true; } else return; }
    else ok = solBewegen({ von: z, i });
  }
  if (!ok) { el.classList.remove('wackel'); void el.offsetWidth; el.classList.add('wackel'); klVibrieren(20); return; }
  solNachZug();
}
function solZiehen() {
  solSchritt();
  if (!sol.stock.length) { if (!sol.waste.length) { sol.rueck.pop(); return; } sol.stock = sol.waste.reverse().map((k) => ({ ...k, o: false })); sol.waste = []; sol.durchgaenge++; }
  else { const n = sol.ziehe3 ? 3 : 1; for (let i = 0; i < n && sol.stock.length; i++) { const k = sol.stock.pop(); k.o = true; sol.waste.push(k); } }
  sol.zuege++; solNachZug();
}
// Ziel suchen: erst Ablage (nur Einzelkarte), dann Spalte – leere Spalte nur für Könige, die nicht schon ganz unten liegen
function solZiel(karten, von) {
  const k = karten[0];
  if (karten.length === 1 && von[0] !== 'f') for (let i = 0; i < 4; i++) if (solAufAblage(k, sol.found[i])) return 'f' + i;
  const leer = [];
  for (let s = 0; s < 7; s++) {
    if ('t' + s === von) continue;
    if (sol.tab[s].length && solAufSpalte(k, sol.tab[s])) return 't' + s;
    if (!sol.tab[s].length && k.w === 13) leer.push('t' + s);
  }
  if (leer.length) {
    if (von[0] === 't' && sol.tab[+von.slice(1)].indexOf(k) === 0) return null;   // König liegt schon unten – nicht sinnlos verschieben
    return leer[0];
  }
  return null;
}
function solBewegen({ von, i }) {
  let quelle, karten;
  if (von === 'waste') { quelle = sol.waste; karten = quelle.slice(-1); }
  else if (von[0] === 'f') { quelle = sol.found[+von.slice(1)]; karten = quelle.slice(-1); }
  else { quelle = sol.tab[+von.slice(1)]; karten = quelle.slice(i); }
  if (!karten.length || karten.some((k) => !k.o)) return false;
  const ziel = solZiel(karten, von);
  if (!ziel) return false;
  solSchritt();
  quelle.splice(quelle.length - karten.length, karten.length);
  (ziel[0] === 'f' ? sol.found[+ziel.slice(1)] : sol.tab[+ziel.slice(1)]).push(...karten);
  if (von[0] === 't' && quelle.length && !quelle[quelle.length - 1].o) quelle[quelle.length - 1].o = true;
  sol.zuege++;
  return true;
}
function solNachZug() {
  const fertig = sol.found.every((a) => a.length === 13);
  solZeichnen();
  if (fertig) solGewonnen();
}
const solKannAutomatisch = () => !sol.fertig && !sol.stock.length && !sol.waste.length && sol.tab.every((sp) => sp.every((k) => k.o)) && sol.found.some((a) => a.length < 13);
function solAutomatisch() {
  const schritt = () => {
    for (let s = 0; s < 7; s++) {
      const sp = sol.tab[s]; if (!sp.length) continue;
      const k = sp[sp.length - 1];
      for (let i = 0; i < 4; i++) if (solAufAblage(k, sol.found[i])) { sp.pop(); sol.found[i].push(k); sol.zuege++; solZeichnen(); return setTimeout(schritt, wenigBewegung() ? 0 : 70); }
    }
    solNachZug();
  };
  solSchritt(); schritt();
}
function solHinweis() {
  // erster sinnvoller Zug: Karte auf Ablage, aufdeckender Spaltenzug, Abwurf, sonst ziehen
  const mark = (sel) => { const el = $('klInhalt').querySelector(sel); if (el) { el.classList.remove('tipp'); void el.offsetWidth; el.classList.add('tipp'); } };
  for (let s = 0; s < 7; s++) { const sp = sol.tab[s], k = sp[sp.length - 1]; if (k && k.o && sol.found.some((a) => solAufAblage(k, a))) return mark('.sol-spalte[data-z="t' + s + '"] .sol-karte:last-child'); }
  const w = sol.waste[sol.waste.length - 1];
  if (w && solZiel([w], 'waste')) return mark('.sol-waste .sol-karte:last-child');
  for (let s = 0; s < 7; s++) { const sp = sol.tab[s], i = sp.findIndex((k) => k.o); if (i > 0 && solZiel(sp.slice(i), 't' + s)) return mark('.sol-spalte[data-z="t' + s + '"] [data-i="' + i + '"]'); }
  mark('[data-z="stock"] > *');
}
function solGewonnen() {
  sol.fertig = true; klStoppUhr();
  const st = klStore(); st.stat.solitaerSiege = (st.stat.solitaerSiege || 0) + 1; delete st.stand.solitaer;
  const k = 'solitaer' + (sol.ziehe3 ? '3' : '1'), rekord = !st.best[k] || sol.zeit < st.best[k];
  if (rekord) st.best[k] = sol.zeit; klSave(st);
  klVerlauf('solitaer', 1, 1, 'gewonnen in ' + klZeit(sol.zeit), { stufe: sol.ziehe3 ? 'schwer' : 'mittel', zuege: sol.zuege, rekord });
  if (typeof konfetti === 'function') konfetti(40, ['🂡', '♥', '♠', '♦', '♣', '✨']);
  klErgebnis('🎉 Gewonnen!', 'Alle 52 Karten abgelegt – in ' + klZeit(sol.zeit) + ' mit ' + sol.zuege + ' Zügen.' + (rekord ? ' 🏆 Neue Bestzeit!' : ''), () => solStart(true));
}

// =====================================================================
// 🔢 SUDOKU – Generator mit eindeutiger Lösung
// =====================================================================
const SD_STUFEN = { leicht: { name: 'Leicht', geben: 40 }, mittel: { name: 'Mittel', geben: 32 }, schwer: { name: 'Schwer', geben: 26 } };
const sdBox = (i) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);
const sdBits = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
// Löser mit Bitmasken + „wenigste Kandidaten zuerst“. Liefert Anzahl Lösungen (bis max) und die erste.
function sdLoesen(gitter, max = 2, zufall) {
  const g = gitter.slice(), Z = new Array(9).fill(0), S = new Array(9).fill(0), B = new Array(9).fill(0);
  for (let i = 0; i < 81; i++) if (g[i]) { const b = 1 << g[i], r = Math.floor(i / 9), c = i % 9, x = sdBox(i); if ((Z[r] | S[c] | B[x]) & b) return { anzahl: 0 }; Z[r] |= b; S[c] |= b; B[x] |= b; }
  let anzahl = 0, erste = null;
  (function rek() {
    let best = -1, bm = 0, bn = 10;
    for (let i = 0; i < 81; i++) if (!g[i]) { const m = ~(Z[Math.floor(i / 9)] | S[i % 9] | B[sdBox(i)]) & 0x3fe, n = sdBits(m); if (n < bn) { bn = n; best = i; bm = m; if (!n) return; } }
    if (best < 0) { anzahl++; if (!erste) erste = g.slice(); return; }
    const r = Math.floor(best / 9), c = best % 9, x = sdBox(best), zif = [];
    for (let d = 1; d <= 9; d++) if (bm & (1 << d)) zif.push(d);
    if (zufall) for (let k = zif.length - 1; k > 0; k--) { const j = Math.floor(zufall() * (k + 1)); [zif[k], zif[j]] = [zif[j], zif[k]]; }
    for (const d of zif) {
      const b = 1 << d; g[best] = d; Z[r] |= b; S[c] |= b; B[x] |= b;
      rek();
      g[best] = 0; Z[r] &= ~b; S[c] &= ~b; B[x] &= ~b;
      if (anzahl >= max) return;
    }
  })();
  return { anzahl, erste };
}
function sdErzeugen(stufe, r = klZufall()) {
  const loesung = sdLoesen(new Array(81).fill(0), 1, r).erste, raetsel = loesung.slice(), ziel = SD_STUFEN[stufe].geben;
  const reihe = [...Array(81).keys()].sort(() => r() - 0.5);
  let geben = 81;
  for (const i of reihe) {
    if (geben <= ziel) break;
    const alt = raetsel[i]; raetsel[i] = 0;
    if (sdLoesen(raetsel, 2).anzahl !== 1) raetsel[i] = alt; else geben--;
  }
  return { raetsel, loesung };
}
let sd = null;
function sdStart(neu, stufe) {
  klZeigen();
  const st = klStore();
  if (!neu && st.stand.sudoku) sd = st.stand.sudoku;
  else if (!neu) { sdMenue(); return; }
  else { const G = sdErzeugen(stufe); sd = { stufe, raetsel: G.raetsel, loesung: G.loesung, wert: G.raetsel.slice(), notizen: new Array(81).fill(0), wahl: -1, notiz: false, fehler: 0, tipps: 0, zeit: 0 }; }
  sd.rueck = sd.rueck || [];
  sdZeichnen();
  klStoppUhr(); klUhr = setInterval(() => { if (!sd || sd.fertig) return; sd.zeit++; const z = $('sdZeit'); if (z) z.textContent = klZeit(sd.zeit); }, 1000);
}
function sdMenue() {
  klKopf('🔢 Sudoku');
  const st = klStore();
  $('klInhalt').innerHTML = '<div class="kl-held"><h2>Sudoku</h2><p>Jede Ziffer 1–9 genau einmal in jeder Zeile, jeder Spalte und jedem 3×3-Block. Jedes Rätsel hat genau eine Lösung.</p></div>'
    + '<div class="kl-stufen">' + Object.entries(SD_STUFEN).map(([k, S]) => '<button type="button" class="kl-stufe" data-sd="' + k + '"><b>' + S.name + '</b><small>' + 'ca. ' + S.geben + ' Ziffern vorgegeben' + (st.best['sudoku_' + k] ? ' · Bestzeit ' + klZeit(st.best['sudoku_' + k]) : '') + '</small></button>').join('') + '</div>';
  $('klInhalt').querySelectorAll('[data-sd]').forEach((b) => b.addEventListener('click', () => { $('klInhalt').innerHTML = '<div class="kl-held"><p>Rätsel wird gebaut …</p></div>'; setTimeout(() => sdStart(true, b.dataset.sd), 30); }));
}
function sdSpeichern() { const st = klStore(); if (sd && !sd.fertig) { const k = { ...sd }; delete k.rueck; st.stand.sudoku = k; } else delete st.stand.sudoku; klSave(st); }
function sdZeichnen() {
  klKopf('🔢 Sudoku', SD_STUFEN[sd.stufe].name);
  const w = sd.wahl, wz = w >= 0 ? sd.wert[w] : 0;
  const zellen = sd.wert.map((v, i) => {
    const vor = sd.raetsel[i] !== 0, falsch = v && !vor && v !== sd.loesung[i];
    const bezug = w >= 0 && (Math.floor(i / 9) === Math.floor(w / 9) || i % 9 === w % 9 || sdBox(i) === sdBox(w));
    const cls = ['sd-z', vor ? 'vor' : '', falsch ? 'falsch' : '', i === w ? 'wahl' : bezug ? 'bezug' : '', wz && v === wz ? 'gleich' : '', i % 3 === 2 && i % 9 !== 8 ? 'rr' : '', Math.floor(i / 9) % 3 === 2 && i < 72 ? 'ru' : ''].filter(Boolean).join(' ');
    const inhalt = v ? v : sd.notizen[i] ? '<span class="sd-noten">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => '<i>' + (sd.notizen[i] & (1 << d) ? d : '') + '</i>').join('') + '</span>' : '';
    return '<button type="button" class="' + cls + '" data-i="' + i + '">' + inhalt + '</button>';
  }).join('');
  const fertigZ = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => sd.wert.filter((v, i) => v === d && v === sd.loesung[i]).length === 9);
  $('klInhalt').innerHTML = '<div class="kl-leiste oben"><span>⏱ <b id="sdZeit">' + klZeit(sd.zeit) + '</b></span><span>Fehler <b>' + sd.fehler + '</b></span><span>Tipps <b>' + sd.tipps + '</b></span></div>'
    + '<div class="sd-gitter" id="sdGitter">' + zellen + '</div>'
    + '<div class="sd-werkzeug"><button type="button" class="kl-knopf" id="sdRueck"' + (sd.rueck.length ? '' : ' disabled') + '>↶</button><button type="button" class="kl-knopf" id="sdLoeschen">⌫</button><button type="button" class="kl-knopf' + (sd.notiz ? ' an' : '') + '" id="sdNotiz">✏️ Notizen ' + (sd.notiz ? 'an' : 'aus') + '</button><button type="button" class="kl-knopf" id="sdTipp">💡 Tipp</button></div>'
    + '<div class="sd-ziffern">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => '<button type="button" class="sd-ziffer' + (fertigZ[d - 1] ? ' fertig' : '') + '" data-d="' + d + '">' + d + '</button>').join('') + '</div>'
    + '<div class="kl-einst"><button type="button" class="kl-knopf" id="sdNeu">Neues Sudoku</button></div>';
  $('sdGitter').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { sd.wahl = +b.dataset.i; sdZeichnen(); } });
  $('klInhalt').querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => sdSetzen(+b.dataset.d)));
  $('sdLoeschen').addEventListener('click', () => sdSetzen(0));
  $('sdNotiz').addEventListener('click', () => { sd.notiz = !sd.notiz; sdZeichnen(); });
  $('sdTipp').addEventListener('click', sdTipp);
  $('sdRueck').addEventListener('click', () => { const r = sd.rueck.pop(); if (r) { const x = JSON.parse(r); sd.wert = x.wert; sd.notizen = x.notizen; sdZeichnen(); } });
  $('sdNeu').addEventListener('click', () => { const st = klStore(); delete st.stand.sudoku; klSave(st); klStoppUhr(); sd = null; sdMenue(); });
}
function sdSetzen(d) {
  const i = sd.wahl;
  if (i < 0 || sd.raetsel[i] || sd.fertig) return;
  if (sd.wert[i] && sd.wert[i] === sd.loesung[i] && d) return;   // richtige Ziffer bleibt stehen
  sd.rueck.push(JSON.stringify({ wert: sd.wert, notizen: sd.notizen })); if (sd.rueck.length > 200) sd.rueck.shift();
  if (sd.notiz && d) { sd.notizen[i] ^= 1 << d; sd.wert[i] = 0; }
  else {
    sd.wert[i] = d; sd.notizen[i] = 0;
    if (d && d !== sd.loesung[i]) { sd.fehler++; klVibrieren([40, 40, 40]); }
    if (d && d === sd.loesung[i]) {   // Notizen dieser Ziffer in Zeile/Spalte/Block löschen
      for (let k = 0; k < 81; k++) if (Math.floor(k / 9) === Math.floor(i / 9) || k % 9 === i % 9 || sdBox(k) === sdBox(i)) sd.notizen[k] &= ~(1 << d);
    }
  }
  sdZeichnen(); sdPruefen();
}
function sdTipp() {
  let i = sd.wahl;
  if (i < 0 || sd.raetsel[i] || sd.wert[i] === sd.loesung[i]) i = sd.wert.findIndex((v, k) => v !== sd.loesung[k]);
  if (i < 0) return;
  sd.wahl = i; sd.wert[i] = sd.loesung[i]; sd.notizen[i] = 0; sd.tipps++;
  sdZeichnen(); sdPruefen();
}
function sdPruefen() {
  if (!sd.wert.every((v, i) => v === sd.loesung[i])) return;
  sd.fertig = true; klStoppUhr();
  const st = klStore(), k = 'sudoku_' + sd.stufe, gilt = sd.tipps === 0, rekord = gilt && (!st.best[k] || sd.zeit < st.best[k]);
  if (rekord) st.best[k] = sd.zeit;
  st.stat.sudokuGeloest = (st.stat.sudokuGeloest || 0) + 1; delete st.stand.sudoku; klSave(st);
  const punkte = Math.max(0, 10 - sd.fehler - sd.tipps * 2);
  klVerlauf('sudoku', punkte, 10, SD_STUFEN[sd.stufe].name + ' in ' + klZeit(sd.zeit), { stufe: sd.stufe, fehler: sd.fehler, tipps: sd.tipps, rekord });
  if (typeof konfetti === 'function') konfetti(30, ['🔢', '✨', '🧠']);
  klErgebnis('🧠 Gelöst!', SD_STUFEN[sd.stufe].name + ' in ' + klZeit(sd.zeit) + ' · ' + sd.fehler + ' Fehler · ' + sd.tipps + ' Tipps.' + (rekord ? ' 🏆 Neue Bestzeit!' : !gilt ? ' (Mit Tipps zählt keine Bestzeit.)' : ''), () => sdStart(true, sd.stufe));
}

// =====================================================================
// 🟫 HOLZBLÖCKE – 9×9, drei Teile, Reihen/Spalten/3×3-Blöcke abräumen
// =====================================================================
const BL_TEILE = [
  [[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 1], [1, 1], [2, 1], [2, 0]], [[0, 0], [0, 1], [0, 2], [1, 0]], [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [1, 0], [1, 1], [1, 2]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 1], [1, 1], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 1], [1, 2]], [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [1, 1]], [[0, 1], [1, 0]], [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[0, 2], [1, 2], [2, 2], [2, 1], [2, 0]],
];
const BL_FARBEN = ['#c2410c', '#a16207', '#b45309', '#92400e', '#9a3412', '#854d0e'];
let bl = null;
const blPasst = (feld, teil, r, c) => teil.every(([dr, dc]) => { const rr = r + dr, cc = c + dc; return rr >= 0 && rr < 9 && cc >= 0 && cc < 9 && !feld[rr * 9 + cc]; });
const blIrgendwo = (feld, teil) => { for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (blPasst(feld, teil, r, c)) return true; return false; };
// Volle Reihen, Spalten und 3×3-Blöcke finden; liefert die Felder zum Abräumen und die Anzahl Linien
function blAbraeumen(feld) {
  const weg = new Set(); let linien = 0;
  for (let r = 0; r < 9; r++) { const z = [...Array(9).keys()].map((c) => r * 9 + c); if (z.every((i) => feld[i])) { z.forEach((i) => weg.add(i)); linien++; } }
  for (let c = 0; c < 9; c++) { const z = [...Array(9).keys()].map((r) => r * 9 + c); if (z.every((i) => feld[i])) { z.forEach((i) => weg.add(i)); linien++; } }
  for (let b = 0; b < 9; b++) { const z = []; for (let k = 0; k < 9; k++) z.push((Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)); if (z.every((i) => feld[i])) { z.forEach((i) => weg.add(i)); linien++; } }
  return { weg: [...weg], linien };
}
function blNeueTeile(r) { return [0, 1, 2].map(() => ({ t: Math.floor(r() * BL_TEILE.length), f: Math.floor(r() * BL_FARBEN.length) })); }
function blStart(neu) {
  klZeigen();
  const st = klStore();
  if (!neu && st.stand.bloecke) bl = st.stand.bloecke;
  else { const r = klZufall(); bl = { feld: new Array(81).fill(0), teile: blNeueTeile(r), punkte: 0, serie: 0, gelegt: 0 }; }
  bl.wahl = -1;
  blZeichnen(); blEndePruefen();
}
function blSpeichern() { const st = klStore(); if (bl && !bl.ende && bl.gelegt) { const k = { ...bl }; delete k.wahl; st.stand.bloecke = k; } else delete st.stand.bloecke; klSave(st); }
function blTeilHtml(T, idx) {
  const teil = BL_TEILE[T.t], h = Math.max(...teil.map((p) => p[0])) + 1, b = Math.max(...teil.map((p) => p[1])) + 1;
  const passt = blIrgendwo(bl.feld, teil);
  return '<div class="bl-teil' + (passt ? '' : ' passt-nicht') + (bl.wahl === idx ? ' wahl' : '') + '" data-teil="' + idx + '" style="--h:' + h + ';--b:' + b + '">' + teil.map(([r, c]) => '<i style="grid-row:' + (r + 1) + ';grid-column:' + (c + 1) + ';--f:' + BL_FARBEN[T.f] + '"></i>').join('') + '</div>';
}
function blZeichnen(weg) {
  klKopf('🟫 Holzblöcke', 'Rekord ' + fmt(klStore().best.bloecke || 0));
  $('klInhalt').innerHTML = '<div class="kl-leiste oben"><span>Punkte <b id="blPunkte">' + fmt(bl.punkte) + '</b></span>' + (bl.serie > 1 ? '<span class="bl-serie">🔥 Serie ×' + bl.serie + '</span>' : '') + '<button type="button" class="kl-knopf" id="blNeu">Neu</button></div>'
    + '<div class="bl-feld" id="blFeld">' + bl.feld.map((v, i) => '<div class="bl-z' + (v ? ' voll' : '') + ((Math.floor(Math.floor(i / 9) / 3) + Math.floor((i % 9) / 3)) % 2 ? ' dunkel' : '') + (weg && weg.includes(i) ? ' weg' : '') + '" data-i="' + i + '"' + (v ? ' style="--f:' + BL_FARBEN[v - 1] + '"' : '') + '></div>').join('') + '</div>'
    + '<div class="bl-ablage" id="blAblage">' + bl.teile.map((T, i) => '<div class="bl-slot">' + (T ? blTeilHtml(T, i) : '') + '</div>').join('') + '</div>'
    + '<p class="kl-hinweis">Teil aufs Feld ziehen – oder antippen und dann das Zielfeld (obere linke Ecke) antippen.</p>';
  $('blNeu').addEventListener('click', () => { const st = klStore(); delete st.stand.bloecke; klSave(st); blStart(true); });
  $('blAblage').querySelectorAll('[data-teil]').forEach((el) => el.addEventListener('pointerdown', blZiehStart));
  $('blFeld').addEventListener('click', (e) => { const z = e.target.closest('[data-i]'); if (z && bl.wahl >= 0) { const i = +z.dataset.i; blLegen(bl.wahl, Math.floor(i / 9), i % 9); } });
}
let blZug = null;
function blZiehStart(e) {
  if (bl.ende) return;
  const idx = +e.currentTarget.dataset.teil, T = bl.teile[idx], teil = BL_TEILE[T.t], feld = $('blFeld').getBoundingClientRect(), zelle = feld.width / 9;
  e.preventDefault();
  const geist = document.createElement('div');
  geist.className = 'bl-geist';
  geist.style.setProperty('--z', zelle + 'px');
  geist.innerHTML = blTeilHtml(T, idx);
  document.body.appendChild(geist);
  blZug = { idx, teil, geist, zelle, startX: e.clientX, startY: e.clientY, bewegt: false, ziel: null, id: e.pointerId };
  blZugBewegen(e);
  window.addEventListener('pointermove', blZugBewegen);
  window.addEventListener('pointerup', blZugEnde, { once: true });
  window.addEventListener('pointercancel', blZugEnde, { once: true });
}
function blZugBewegen(e) {
  if (!blZug) return;
  if (Math.hypot(e.clientX - blZug.startX, e.clientY - blZug.startY) > 8) blZug.bewegt = true;
  const h = Math.max(...blZug.teil.map((p) => p[0])) + 1, b = Math.max(...blZug.teil.map((p) => p[1])) + 1, z = blZug.zelle;
  // Teil schwebt über dem Finger, damit man sieht, wo es landet
  const x = e.clientX - (b * z) / 2, y = e.clientY - h * z - z * 1.2;
  blZug.geist.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  const feld = $('blFeld').getBoundingClientRect();
  const c = Math.round((x - feld.left) / z), r = Math.round((y - feld.top) / z);
  $('blFeld').querySelectorAll('.vorschau, .vorschau-weg').forEach((el) => el.classList.remove('vorschau', 'vorschau-weg'));
  blZug.ziel = null;
  if (blPasst(bl.feld, blZug.teil, r, c)) {
    blZug.ziel = [r, c];
    const probe = bl.feld.slice(); blZug.teil.forEach(([dr, dc]) => { probe[(r + dr) * 9 + c + dc] = 1; });
    const { weg } = blAbraeumen(probe);
    blZug.teil.forEach(([dr, dc]) => $('blFeld').children[(r + dr) * 9 + c + dc].classList.add('vorschau'));
    weg.forEach((i) => $('blFeld').children[i].classList.add('vorschau-weg'));
  }
}
function blZugEnde() {
  window.removeEventListener('pointermove', blZugBewegen);
  const Z = blZug; blZug = null;
  if (!Z) return;
  Z.geist.remove();
  if (!Z.bewegt) { bl.wahl = bl.wahl === Z.idx ? -1 : Z.idx; blZeichnen(); return; }
  if (Z.ziel) blLegen(Z.idx, Z.ziel[0], Z.ziel[1]); else blZeichnen();
}
function blLegen(idx, r, c) {
  const T = bl.teile[idx];
  if (!T) return false;
  const teil = BL_TEILE[T.t];
  if (!blPasst(bl.feld, teil, r, c)) { klVibrieren(20); return false; }
  teil.forEach(([dr, dc]) => { bl.feld[(r + dr) * 9 + c + dc] = T.f + 1; });
  bl.teile[idx] = null; bl.wahl = -1; bl.gelegt++;
  bl.punkte += teil.length;
  const { weg, linien } = blAbraeumen(bl.feld);
  if (linien) {
    bl.serie++;
    bl.punkte += linien * linien * 10 * bl.serie;   // mehrere Linien auf einmal und Serien zählen extra
    klVibrieren(linien > 1 ? [20, 30, 20] : 15);
  } else bl.serie = 0;
  if (bl.teile.every((t) => !t)) bl.teile = blNeueTeile(klZufall());
  blZeichnen(weg);
  if (linien) setTimeout(() => { weg.forEach((i) => { bl.feld[i] = 0; }); if (klAktiv === 'bloecke') { blZeichnen(); blEndePruefen(); } }, wenigBewegung() ? 0 : 260);
  else blEndePruefen();
  return true;
}
function blEndePruefen() {
  if (bl.ende || bl.teile.some((T) => T && blIrgendwo(bl.feld, BL_TEILE[T.t]))) return;
  bl.ende = true;
  const st = klStore(), alt = st.best.bloecke || 0, rekord = bl.punkte > alt;
  if (rekord) st.best.bloecke = bl.punkte;
  delete st.stand.bloecke; klSave(st);
  klVerlauf('bloecke', bl.punkte, Math.max(bl.punkte, alt, 1), fmt(bl.punkte) + ' Punkte', { rekord });
  klErgebnis(rekord ? '🏆 Neuer Rekord!' : '🧱 Kein Platz mehr', fmt(bl.punkte) + ' Punkte' + (rekord ? '' : ' · Rekord ' + fmt(alt)) + '.', () => blStart(true));
}

// =====================================================================
// 💣 MINENSUCHE – erster Tipp ist immer sicher
// =====================================================================
const MN_STUFEN = { leicht: { name: 'Leicht', b: 9, h: 9, m: 10 }, mittel: { name: 'Mittel', b: 12, h: 15, m: 30 }, schwer: { name: 'Schwer', b: 14, h: 20, m: 55 } };
let mn = null;
function mnStart(neu, stufe) {
  klZeigen();
  if (!stufe) { mnMenue(); return; }
  const S = MN_STUFEN[stufe];
  mn = { stufe, b: S.b, h: S.h, m: S.m, minen: null, offen: new Array(S.b * S.h).fill(0), flagge: new Array(S.b * S.h).fill(0), flaggenModus: false, zeit: 0, ende: false };
  mnZeichnen();
}
function mnMenue() {
  klKopf('💣 Minensuche');
  const st = klStore();
  $('klInhalt').innerHTML = '<div class="kl-held"><h2>Minensuche</h2><p>Jede Zahl sagt, wie viele Minen um das Feld herum liegen. Öffne alle sicheren Felder. Lange drücken oder 🚩-Modus = Flagge.</p></div>'
    + '<div class="kl-stufen">' + Object.entries(MN_STUFEN).map(([k, S]) => '<button type="button" class="kl-stufe" data-mn="' + k + '"><b>' + S.name + '</b><small>' + S.b + '×' + S.h + ' · ' + S.m + ' Minen' + (st.best['minen_' + k] ? ' · Bestzeit ' + klZeit(st.best['minen_' + k]) : '') + '</small></button>').join('') + '</div>';
  $('klInhalt').querySelectorAll('[data-mn]').forEach((b) => b.addEventListener('click', () => mnStart(true, b.dataset.mn)));
}
const mnNachbarn = (i) => { const out = [], r = Math.floor(i / mn.b), c = i % mn.b; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < mn.h && cc >= 0 && cc < mn.b) out.push(rr * mn.b + cc); } return out; };
const mnZahl = (i) => mnNachbarn(i).filter((k) => mn.minen[k]).length;
function mnLegen(sicher, r = klZufall()) {
  const n = mn.b * mn.h, frei = new Set([sicher, ...mnNachbarn(sicher)]);
  mn.minen = new Array(n).fill(0);
  const kand = [...Array(n).keys()].filter((i) => !frei.has(i)).sort(() => r() - 0.5);
  kand.slice(0, mn.m).forEach((i) => { mn.minen[i] = 1; });
}
function mnZeichnen() {
  const S = MN_STUFEN[mn.stufe], flaggen = mn.flagge.reduce((a, b) => a + b, 0);
  klKopf('💣 Minensuche', S.name);
  $('klInhalt').innerHTML = '<div class="kl-leiste oben"><span>💣 <b id="mnRest">' + (mn.m - flaggen) + '</b></span><span>⏱ <b id="mnZeit">' + klZeit(mn.zeit) + '</b></span>'
    + '<button type="button" class="kl-knopf' + (mn.flaggenModus ? ' an' : '') + '" id="mnModus">' + (mn.flaggenModus ? '🚩 Flaggen' : '⛏️ Aufdecken') + '</button><button type="button" class="kl-knopf" id="mnNeu">Neu</button></div>'
    + '<div class="mn-feld" id="mnFeld" style="--b:' + mn.b + '">' + mn.offen.map((o, i) => {
      if (o) { const z = mn.minen[i] ? -1 : mnZahl(i); return '<button type="button" class="mn-z offen' + (z < 0 ? ' mine' + (mn.knall === i ? ' knall' : '') : '') + ' n' + z + '" data-i="' + i + '">' + (z < 0 ? '💣' : z || '') + '</button>'; }
      return '<button type="button" class="mn-z' + (mn.flagge[i] ? ' fl' : '') + (mn.ende && mn.flagge[i] && !mn.minen[i] ? ' irrtum' : '') + '" data-i="' + i + '">' + (mn.flagge[i] ? '🚩' : '') + '</button>';
    }).join('') + '</div>'
    + '<p class="kl-hinweis">Tipp auf eine Zahl mit genug Flaggen drumherum öffnet die restlichen Nachbarn.</p>';
  $('mnModus').addEventListener('click', () => { mn.flaggenModus = !mn.flaggenModus; mnZeichnen(); });
  $('mnNeu').addEventListener('click', () => mnStart(true, mn.stufe));
  const feld = $('mnFeld');
  let druck = null;
  feld.addEventListener('pointerdown', (e) => { const z = e.target.closest('[data-i]'); if (!z || mn.ende) return; druck = { i: +z.dataset.i, lang: false, t: setTimeout(() => { druck.lang = true; mnFlagge(+z.dataset.i); klVibrieren(25); }, 420) }; });
  const los = () => { if (druck) clearTimeout(druck.t); };
  feld.addEventListener('pointerup', (e) => { los(); const z = e.target.closest('[data-i]'); if (!druck || !z || druck.lang || +z.dataset.i !== druck.i) { druck = null; return; } const i = druck.i; druck = null; if (mn.flaggenModus) mnFlagge(i); else mnOeffnen(i); });
  feld.addEventListener('pointercancel', () => { los(); druck = null; });
  feld.addEventListener('contextmenu', (e) => e.preventDefault());
}
function mnFlagge(i) { if (mn.ende || mn.offen[i]) return; mn.flagge[i] ^= 1; mnZeichnen(); }
function mnOeffnen(i) {
  if (mn.ende || mn.flagge[i]) return;
  if (!mn.minen) { mnLegen(i); klStoppUhr(); klUhr = setInterval(() => { if (!mn || mn.ende) return; mn.zeit++; const z = $('mnZeit'); if (z) z.textContent = klZeit(mn.zeit); }, 1000); }
  if (mn.offen[i]) {   // „Akkord“: Zahl mit passender Flaggenzahl öffnet die Nachbarn
    const nb = mnNachbarn(i), fl = nb.filter((k) => mn.flagge[k]).length;
    if (mn.minen[i] || fl !== mnZahl(i)) return;
    nb.filter((k) => !mn.flagge[k] && !mn.offen[k]).forEach((k) => mnAufdecken(k));
  } else mnAufdecken(i);
  if (!mn.ende && mn.offen.every((o, k) => o || mn.minen[k])) mnSieg();
  mnZeichnen();
}
function mnAufdecken(i) {
  if (mn.ende || mn.offen[i] || mn.flagge[i]) return;
  if (mn.minen[i]) { mn.knall = i; mnVerloren(); return; }
  const stapel = [i];
  while (stapel.length) {
    const k = stapel.pop();
    if (mn.offen[k] || mn.flagge[k]) continue;
    mn.offen[k] = 1;
    if (mnZahl(k) === 0) mnNachbarn(k).forEach((n) => { if (!mn.offen[n] && !mn.minen[n]) stapel.push(n); });
  }
}
function mnVerloren() {
  mn.ende = true; klStoppUhr();
  mn.minen.forEach((m, k) => { if (m) mn.offen[k] = 1; });
  const sicher = mn.b * mn.h - mn.m, auf = mn.offen.filter((o, k) => o && !mn.minen[k]).length;
  klVibrieren([80, 40, 80]);
  klVerlauf('minen', auf, sicher, MN_STUFEN[mn.stufe].name + ' · Mine getroffen', { stufe: mn.stufe, sieg: false });
  setTimeout(() => klErgebnis('💥 Boom!', 'Mine getroffen. ' + Math.round((auf / sicher) * 100) + ' % der sicheren Felder waren schon offen.', () => mnStart(true, mn.stufe)), 500);
}
function mnSieg() {
  mn.ende = true; klStoppUhr();
  mn.minen.forEach((m, k) => { if (m) mn.flagge[k] = 1; });
  const st = klStore(), k = 'minen_' + mn.stufe, rekord = !st.best[k] || mn.zeit < st.best[k];
  if (rekord) st.best[k] = mn.zeit;
  st.stat.minenSiege = (st.stat.minenSiege || 0) + 1; klSave(st);
  klVerlauf('minen', 1, 1, MN_STUFEN[mn.stufe].name + ' geräumt in ' + klZeit(mn.zeit), { stufe: mn.stufe, sieg: true, rekord });
  if (typeof konfetti === 'function') konfetti(30, ['🚩', '✨', '💣']);
  setTimeout(() => klErgebnis('🚩 Geräumt!', MN_STUFEN[mn.stufe].name + ' in ' + klZeit(mn.zeit) + '.' + (rekord ? ' 🏆 Neue Bestzeit!' : ''), () => mnStart(true, mn.stufe)), 300);
}

// =====================================================================
// 🔴 VIER IN EINER REIHE – 7×6, Computer mit Minimax + Alpha-Beta
// =====================================================================
const VR_STUFEN = { leicht: { name: 'Leicht', tiefe: 2, zufall: 0.35 }, mittel: { name: 'Mittel', tiefe: 4, zufall: 0.08 }, schwer: { name: 'Schwer', tiefe: 7, zufall: 0 } };
let vr = null;
const vrFrei = (B, c) => { for (let r = 5; r >= 0; r--) if (!B[r * 7 + c]) return r; return -1; };
function vrGewinner(B) {
  const L = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
    const s = B[r * 7 + c]; if (!s) continue;
    for (const [dr, dc] of L) {
      const z = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]);
      if (z.every(([rr, cc]) => rr >= 0 && rr < 6 && cc >= 0 && cc < 7 && B[rr * 7 + cc] === s)) return { s, zellen: z.map(([rr, cc]) => rr * 7 + cc) };
    }
  }
  return null;
}
// Bewertung: offene Dreier/Zweier in allen Viererfenstern, Mitte bevorzugt
function vrWert(B, ich) {
  const du = 3 - ich; let w = 0;
  for (let r = 0; r < 6; r++) if (B[r * 7 + 3] === ich) w += 3;
  const fenster = (a) => { const i = a.filter((x) => x === ich).length, d = a.filter((x) => x === du).length, l = 4 - i - d; if (i === 3 && l === 1) return 5; if (i === 2 && l === 2) return 2; if (d === 3 && l === 1) return -4; return 0; };
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const rr = r + 3 * dr, cc = c + 3 * dc; if (rr < 0 || rr > 5 || cc < 0 || cc > 6) continue;
    w += fenster([0, 1, 2, 3].map((k) => B[(r + dr * k) * 7 + c + dc * k]));
  }
  return w;
}
function vrMinimax(B, tiefe, a, b, max, ich) {
  const g = vrGewinner(B);
  if (g) return g.s === ich ? 100000 + tiefe : -100000 - tiefe;
  if (B.every((x) => x)) return 0;
  if (!tiefe) return vrWert(B, ich);
  const reihe = [3, 2, 4, 1, 5, 0, 6];
  if (max) {
    let best = -Infinity;
    for (const c of reihe) { const r = vrFrei(B, c); if (r < 0) continue; B[r * 7 + c] = ich; best = Math.max(best, vrMinimax(B, tiefe - 1, a, b, false, ich)); B[r * 7 + c] = 0; a = Math.max(a, best); if (a >= b) break; }
    return best;
  }
  let best = Infinity;
  for (const c of reihe) { const r = vrFrei(B, c); if (r < 0) continue; B[r * 7 + c] = 3 - ich; best = Math.min(best, vrMinimax(B, tiefe - 1, a, b, true, ich)); B[r * 7 + c] = 0; b = Math.min(b, best); if (a >= b) break; }
  return best;
}
function vrComputerZug(B, stufe, ich = 2, r = Math.random) {
  const S = VR_STUFEN[stufe], frei = [0, 1, 2, 3, 4, 5, 6].filter((c) => vrFrei(B, c) >= 0);
  // sofort gewinnen oder sofort blocken – das macht er auf jeder Stufe
  for (const s of [ich, 3 - ich]) for (const c of frei) { const rr = vrFrei(B, c); B[rr * 7 + c] = s; const g = vrGewinner(B); B[rr * 7 + c] = 0; if (g) return c; }
  if (r() < S.zufall) return frei[Math.floor(r() * frei.length)];
  let best = -Infinity, wahl = frei[0];
  for (const c of [3, 2, 4, 1, 5, 0, 6].filter((x) => frei.includes(x))) {
    const rr = vrFrei(B, c); B[rr * 7 + c] = ich;
    const w = vrMinimax(B, S.tiefe - 1, -Infinity, Infinity, false, ich);
    B[rr * 7 + c] = 0;
    if (w > best) { best = w; wahl = c; }
  }
  return wahl;
}
function vrStart(neu, stufe, zweiSpieler) {
  klZeigen();
  if (!stufe && !zweiSpieler) { vrMenue(); return; }
  vr = { stufe, zwei: !!zweiSpieler, B: new Array(42).fill(0), dran: 1, ende: null, denkt: false, letzte: -1 };
  vrZeichnen();
}
function vrMenue() {
  klKopf('🔴 Vier in einer Reihe');
  const st = klStore();
  $('klInhalt').innerHTML = '<div class="kl-held"><h2>Vier in einer Reihe</h2><p>Steine fallen nach unten. Wer zuerst vier in einer Reihe hat – waagrecht, senkrecht oder schräg – gewinnt. Du spielst 🔴 und fängst an.</p></div>'
    + '<div class="kl-stufen">' + Object.entries(VR_STUFEN).map(([k, S]) => '<button type="button" class="kl-stufe" data-vr="' + k + '"><b>🤖 ' + S.name + '</b><small>' + (st.stat['vier_' + k] ? st.stat['vier_' + k] + ' Siege' : 'gegen den Computer') + '</small></button>').join('')
    + '<button type="button" class="kl-stufe" data-vr="zwei"><b>👥 Zu zweit</b><small>abwechselnd an einem Handy</small></button></div>';
  $('klInhalt').querySelectorAll('[data-vr]').forEach((b) => b.addEventListener('click', () => (b.dataset.vr === 'zwei' ? vrStart(true, null, true) : vrStart(true, b.dataset.vr))));
}
function vrZeichnen() {
  const S = vr.zwei ? null : VR_STUFEN[vr.stufe];
  klKopf('🔴 Vier in einer Reihe', vr.zwei ? 'zu zweit' : '🤖 ' + S.name);
  const status = vr.ende ? (vr.ende.s === 0 ? '🤝 Unentschieden' : vr.zwei ? (vr.ende.s === 1 ? '🔴' : '🟡') + ' gewinnt!' : vr.ende.s === 1 ? '🎉 Du gewinnst!' : '🤖 Der Computer gewinnt') : vr.denkt ? '🤖 denkt …' : vr.zwei ? (vr.dran === 1 ? '🔴' : '🟡') + ' ist dran' : 'Du bist dran 🔴';
  $('klInhalt').innerHTML = '<div class="kl-leiste oben"><span class="vr-status">' + status + '</span><button type="button" class="kl-knopf" id="vrNeu">Neu</button></div>'
    + '<div class="vr-brett" id="vrBrett">' + vr.B.map((s, i) => '<button type="button" class="vr-loch" data-c="' + (i % 7) + '"' + (s ? '' : ' aria-label="Spalte ' + (i % 7 + 1) + '"') + '>' + (s ? '<i class="vr-stein ' + (s === 1 ? 'rot' : 'gelb') + (i === vr.letzte ? ' neu' : '') + (vr.ende && vr.ende.zellen && vr.ende.zellen.includes(i) ? ' sieg' : '') + '" style="--r:' + Math.floor(i / 7) + '"></i>' : '') + '</button>').join('') + '</div>'
    + '<p class="kl-hinweis">Tippe in eine Spalte.</p>';
  $('vrNeu').addEventListener('click', () => (vr.zwei ? vrStart(true, null, true) : vrMenue()));
  $('vrBrett').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) vrSpielerZug(+b.dataset.c); });
}
function vrSetzen(c, s) { const r = vrFrei(vr.B, c); if (r < 0) return false; vr.B[r * 7 + c] = s; vr.letzte = r * 7 + c; const g = vrGewinner(vr.B); if (g) vr.ende = g; else if (vr.B.every((x) => x)) vr.ende = { s: 0 }; return true; }
function vrSpielerZug(c) {
  if (vr.ende || vr.denkt) return;
  if (!vrSetzen(c, vr.dran)) { klVibrieren(20); return; }
  if (vr.zwei) { vr.dran = 3 - vr.dran; vrZeichnen(); if (vr.ende) vrEnde(); return; }
  vrZeichnen();
  if (vr.ende) { vrEnde(); return; }
  vr.denkt = true; vrZeichnen();
  setTimeout(() => {
    if (!vr || vr.ende) return;
    vrSetzen(vrComputerZug(vr.B.slice(), vr.stufe), 2);
    vr.denkt = false; vrZeichnen();
    if (vr.ende) vrEnde();
  }, 380);
}
function vrEnde() {
  const s = vr.ende.s;
  if (vr.zwei) { setTimeout(() => klErgebnis(s ? (s === 1 ? '🔴' : '🟡') + ' gewinnt!' : '🤝 Unentschieden', 'Noch eine Runde?', () => vrStart(true, null, true)), 700); return; }
  const st = klStore();
  if (s === 1) { st.stat.vierSiege = (st.stat.vierSiege || 0) + 1; st.stat['vier_' + vr.stufe] = (st.stat['vier_' + vr.stufe] || 0) + 1; }
  klSave(st);
  klVerlauf('vier', s === 1 ? 1 : s === 0 ? 0.5 : 0, 1, VR_STUFEN[vr.stufe].name + ' · ' + (s === 1 ? 'gewonnen' : s === 0 ? 'unentschieden' : 'verloren'), { stufe: vr.stufe === 'schwer' ? 'schwer' : vr.stufe });
  if (s === 1 && typeof konfetti === 'function') konfetti(30, ['🔴', '✨', '🏆']);
  setTimeout(() => klErgebnis(s === 1 ? '🎉 Gewonnen!' : s === 0 ? '🤝 Unentschieden' : '🤖 Verloren', s === 1 ? 'Du hast den Computer (' + VR_STUFEN[vr.stufe].name + ') geschlagen.' : s === 0 ? 'Das Brett ist voll.' : 'Der Computer hatte zuerst vier in einer Reihe.', () => vrStart(true, vr.stufe)), 900);
}
