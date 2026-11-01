// 🔎 Wer war's? – Krimi-Logikrätsel („Mörder-Sudoku“).
// Ein Grundriss mit Räumen und Möbeln. In jeder Reihe und jeder Spalte steht genau eine Person.
// Möbel wie Pflanzen oder Regale sind besetzt, auf Stühlen, Sofas, Betten und Teppichen darf man stehen.
// Wer allein mit dem Opfer in einem Raum war, ist der Mörder.
// Die Fälle erzeugt die App selbst: Grundriss, Lösung und so viele Hinweise, dass genau eine Lösung bleibt.
const KRIMI_KEY = 'walquiz.krimi.v1';
const KRIMI_STUFEN = {
  leicht: { name: 'Leicht', n: 4, raeume: 3 },
  mittel: { name: 'Mittel', n: 5, raeume: 4 },
  schwer: { name: 'Schwer', n: 6, raeume: 5 },
};
const VERDAECHTIGE = [
  { name: 'Butler Bruno', emoji: '🤵' },
  { name: 'Köchin Klara', emoji: '👩‍🍳' },
  { name: 'Gärtner Gustav', emoji: '🧑‍🌾' },
  { name: 'Malerin Mia', emoji: '👩‍🎨' },
  { name: 'Doktor Dietrich', emoji: '👨‍⚕️' },
  { name: 'Tante Trude', emoji: '👵' },
  { name: 'Kapitän Kurt', emoji: '👨‍✈️' },
  { name: 'Sängerin Sophie', emoji: '👩‍🎤' },
];
const OPFER = { name: 'Lord Lennart', emoji: '🧐', opfer: true };
const RAEUME = [
  { name: 'Küche', im: 'in der Küche', farbe: '#f6dcc4' },
  { name: 'Salon', im: 'im Salon', farbe: '#dfe7f5' },
  { name: 'Bibliothek', im: 'in der Bibliothek', farbe: '#e8dcc8' },
  { name: 'Wintergarten', im: 'im Wintergarten', farbe: '#d9eed6' },
  { name: 'Speisezimmer', im: 'im Speisezimmer', farbe: '#f3d6da' },
  { name: 'Schlafzimmer', im: 'im Schlafzimmer', farbe: '#e6dcf2' },
  { name: 'Bad', im: 'im Bad', farbe: '#d3eef0' },
  { name: 'Arbeitszimmer', im: 'im Arbeitszimmer', farbe: '#efe7c9' },
];
// frei: darf man draufstellen · auf/neben: Text für Hinweise
const MOEBEL = {
  stuhl:    { emoji: '🪑', frei: true, auf: 'saß auf einem Stuhl', neben: 'stand neben einem Stuhl' },
  sofa:     { emoji: '🛋️', frei: true, auf: 'saß auf einem Sofa', neben: 'stand neben einem Sofa' },
  bett:     { emoji: '🛏️', frei: true, auf: 'lag auf einem Bett', neben: 'stand neben einem Bett' },
  teppich:  { emoji: '', frei: true, auf: 'stand auf einem Teppich' },
  pflanze:  { emoji: '🪴', frei: false, neben: 'stand neben einer Pflanze' },
  regal:    { emoji: '📚', frei: false, neben: 'stand neben einem Bücherregal' },
  uhr:      { emoji: '🕰️', frei: false, neben: 'stand neben einer Standuhr' },
  klavier:  { emoji: '🎹', frei: false, neben: 'stand neben dem Klavier' },
};

function mischen(liste, rnd) {
  const a = liste.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const nachbarn = (n, i) => {
  const r = Math.floor(i / n), c = i % n, out = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
};

// ---------- Grundriss ----------
function raeumeAufteilen(n, k, rnd) {
  const raum = new Array(n * n).fill(-1);
  mischen([...Array(n * n).keys()], rnd).slice(0, k).forEach((z, i) => { raum[z] = i; });
  let offen = n * n - k;
  while (offen > 0) {
    // zufällige noch freie Zelle neben einem Raum dem Raum geben
    const kandidaten = [];
    raum.forEach((r, i) => { if (r < 0) nachbarn(n, i).forEach((j) => { if (raum[j] >= 0) kandidaten.push([i, raum[j]]); }); });
    const [z, r] = kandidaten[Math.floor(rnd() * kandidaten.length)];
    raum[z] = r; offen--;
  }
  for (let r = 0; r < k; r++) if (raum.filter((x) => x === r).length < 2) return null;
  return raum;
}

function moebelVerteilen(n, rnd) {
  const moebel = new Array(n * n).fill(null);
  const zellen = mischen([...Array(n * n).keys()], rnd);
  const fest = Math.round(n * n * 0.14), frei = Math.round(n * n * 0.22);
  const festArten = mischen(['pflanze', 'regal', 'uhr', 'klavier', 'pflanze', 'regal', 'uhr'], rnd);
  const freiArten = ['stuhl', 'stuhl', 'sofa', 'bett', 'teppich', 'teppich'];
  zellen.slice(0, fest).forEach((z, i) => { moebel[z] = festArten[i % festArten.length]; });
  zellen.slice(fest, fest + frei).forEach((z) => { moebel[z] = freiArten[Math.floor(rnd() * freiArten.length)]; });
  return moebel;
}
const begehbar = (fall, z) => !fall.moebel[z] || MOEBEL[fall.moebel[z]].frei;

// Eine Lösung: pro Reihe eine Person, jede Spalte nur einmal, nie auf festen Möbeln
function platzieren(fall, rnd) {
  const { n } = fall, spalte = new Array(n).fill(-1), belegt = new Set();
  const los = (r) => {
    if (r === n) return true;
    for (const c of mischen([...Array(n).keys()], rnd)) {
      if (belegt.has(c) || !begehbar(fall, r * n + c)) continue;
      belegt.add(c); spalte[r] = c;
      if (los(r + 1)) return true;
      belegt.delete(c);
    }
    return false;
  };
  if (!los(0)) return null;
  return mischen([...Array(n).keys()], rnd).map((r) => r * n + spalte[r]);   // Person i → Zelle
}

// ---------- Hinweise ----------
function alleHinweise(fall, rnd) {
  const { n, raum, moebel, personen, loesung, raumListe } = fall;
  const out = [];
  const rc = (z) => [Math.floor(z / n), z % n];
  personen.forEach((pe, p) => {
    const z = loesung[p], [r, c] = rc(z), wer = pe.name;
    out.push({ p, art: 'raum', text: wer + ' war ' + raumListe[raum[z]].im + '.', f: (a) => raum[a] === raum[z] });
    mischen(raumListe.map((_, i) => i).filter((i) => i !== raum[z]), rnd).slice(0, 2).forEach((R) => {
      out.push({ p, art: 'nicht', text: wer + ' war nicht ' + raumListe[R].im + '.', f: (a) => raum[a] !== R });
    });
    if (moebel[z]) { const m = moebel[z]; out.push({ p, art: 'auf', text: wer + ' ' + MOEBEL[m].auf + '.', f: (a) => moebel[a] === m }); }
    else out.push({ p, art: 'boden', text: wer + ' stand auf freiem Boden – nicht auf einem Möbel.', f: (a) => !moebel[a] });
    new Set(nachbarn(n, z).map((j) => moebel[j]).filter((m) => m && MOEBEL[m].neben)).forEach((m) => {
      out.push({ p, art: 'neben', text: wer + ' ' + MOEBEL[m].neben + '.', f: (a) => nachbarn(n, a).some((j) => moebel[j] === m) });
    });
    const eckig = (r === 0 || r === n - 1) && (c === 0 || c === n - 1);
    if (eckig) out.push({ p, art: 'ecke', text: wer + ' stand in einer Ecke des Hauses.', f: (a) => { const [x, y] = rc(a); return (x === 0 || x === n - 1) && (y === 0 || y === n - 1); } });
    else if (r === 0 || r === n - 1 || c === 0 || c === n - 1) out.push({ p, art: 'rand', text: wer + ' stand an einer Außenwand.', f: (a) => { const [x, y] = rc(a); return x === 0 || x === n - 1 || y === 0 || y === n - 1; } });
    else out.push({ p, art: 'mitte', text: wer + ' stand nicht an einer Außenwand.', f: (a) => { const [x, y] = rc(a); return x > 0 && x < n - 1 && y > 0 && y < n - 1; } });
    if (r === 0) out.push({ p, art: 'reihe', text: wer + ' war in der obersten Reihe.', f: (a) => rc(a)[0] === 0 });
    if (r === n - 1) out.push({ p, art: 'reihe', text: wer + ' war in der untersten Reihe.', f: (a) => rc(a)[0] === n - 1 });
    if (c === 0) out.push({ p, art: 'reihe', text: wer + ' war in der linken Spalte.', f: (a) => rc(a)[1] === 0 });
    if (c === n - 1) out.push({ p, art: 'reihe', text: wer + ' war in der rechten Spalte.', f: (a) => rc(a)[1] === n - 1 });
    const allein = loesung.filter((y) => raum[y] === raum[z]).length === 1;
    if (allein) out.push({ p, art: 'allein', global: true, text: wer + ' war ganz allein im Raum.', f: (a, alle) => alle.filter((y) => raum[y] === raum[a]).length === 1 });
  });
  // Hinweise über zwei Personen
  const opfer = personen.length - 1;
  for (let p = 0; p < personen.length; p++) {
    for (let q = p + 1; q < personen.length; q++) {
      const [zp, zq] = [loesung[p], loesung[q]], [rp, cp] = rc(zp), [rq, cq] = rc(zq);
      const P = personen[p].name, Q = personen[q].name;
      if (raum[zp] === raum[zq]) {
        if (q !== opfer) out.push({ p, q, art: 'zusammen', text: P + ' war im selben Raum wie ' + Q + '.', f: (a, b) => raum[a] === raum[b] });
      } else out.push({ p, q, art: 'getrennt', text: P + ' war nicht im selben Raum wie ' + Q + '.', f: (a, b) => raum[a] !== raum[b] });
      if (rnd() < 0.5) out.push(cp < cq
        ? { p, q, art: 'links', text: P + ' stand weiter links als ' + Q + '.', f: (a, b) => a % n < b % n }
        : { p, q, art: 'links', text: P + ' stand weiter rechts als ' + Q + '.', f: (a, b) => a % n > b % n });
      else out.push(rp < rq
        ? { p, q, art: 'oben', text: P + ' stand weiter oben als ' + Q + '.', f: (a, b) => Math.floor(a / n) < Math.floor(b / n) }
        : { p, q, art: 'oben', text: P + ' stand weiter unten als ' + Q + '.', f: (a, b) => Math.floor(a / n) > Math.floor(b / n) });
    }
  }
  return out;
}

// Wie viele Aufstellungen passen zu den Hinweisen? (bis grenze)
function loesungenZaehlen(fall, hinweise, grenze = 2) {
  const { n, raum, personen } = fall;
  const anzahl = personen.length, opfer = anzahl - 1;
  const kand = personen.map((_, p) => {
    const eigene = hinweise.filter((h) => h.p === p && h.q === undefined && !h.global);
    return [...Array(n * n).keys()].filter((z) => begehbar(fall, z) && eigene.every((h) => h.f(z)));
  });
  const reihenfolge = [...Array(anzahl).keys()].sort((a, b) => kand[a].length - kand[b].length);
  const zwei = hinweise.filter((h) => h.q !== undefined);
  const glob = hinweise.filter((h) => h.global);
  const zelle = new Array(anzahl).fill(-1), reihe = new Set(), spalte = new Set();
  let gefunden = 0;
  const los = (k) => {
    if (k === anzahl) {
      const or = raum[zelle[opfer]];
      if (zelle.filter((z) => raum[z] === or).length !== 2) return;   // genau einer allein mit dem Opfer
      if (!glob.every((h) => h.f(zelle[h.p], zelle))) return;
      gefunden++;
      return;
    }
    const p = reihenfolge[k];
    for (const z of kand[p]) {
      const r = Math.floor(z / n), c = z % n;
      if (reihe.has(r) || spalte.has(c)) continue;
      zelle[p] = z;
      if (zwei.every((h) => zelle[h.p] < 0 || zelle[h.q] < 0 || h.f(zelle[h.p], zelle[h.q]))) {
        reihe.add(r); spalte.add(c);
        los(k + 1);
        reihe.delete(r); spalte.delete(c);
        if (gefunden >= grenze) { zelle[p] = -1; return; }
      }
      zelle[p] = -1;
    }
  };
  los(0);
  return gefunden;
}

// Ein ganzer Fall: Grundriss, Personen, Lösung, Hinweise
function erzeugeFall(stufe, rnd) {
  const { n, raeume } = KRIMI_STUFEN[stufe];
  for (let versuch = 0; versuch < 300; versuch++) {
    const raum = raeumeAufteilen(n, raeume, rnd);
    if (!raum) continue;
    const fall = { stufe, n, raum, moebel: moebelVerteilen(n, rnd), raumListe: mischen(RAEUME, rnd).slice(0, raeume) };
    fall.personen = mischen(VERDAECHTIGE, rnd).slice(0, n - 1).concat([OPFER]);
    fall.loesung = platzieren(fall, rnd);
    if (!fall.loesung) continue;
    const opferRaum = raum[fall.loesung[n - 1]];
    if (fall.loesung.filter((z) => raum[z] === opferRaum).length !== 2) continue;
    fall.moerder = fall.loesung.findIndex((z, i) => i !== n - 1 && raum[z] === opferRaum);
    // Hinweise sammeln, bis die Lösung eindeutig ist – dann überflüssige wieder weglassen
    const pool = mischen(alleHinweise(fall, rnd), rnd);
    const hinweise = [];
    for (const h of pool) {
      hinweise.push(h);
      if (loesungenZaehlen(fall, hinweise) === 1) break;
    }
    if (loesungenZaehlen(fall, hinweise) !== 1) continue;
    for (const h of mischen(hinweise, rnd)) {
      const ohne = hinweise.filter((x) => x !== h);
      if (loesungenZaehlen(fall, ohne) === 1) hinweise.splice(hinweise.indexOf(h), 1);
    }
    // In Lesereihenfolge: erst Hinweise zu einzelnen Personen, dann die über zwei
    fall.hinweise = hinweise.sort((a, b) => (a.q !== undefined) - (b.q !== undefined) || a.p - b.p);
    return fall;
  }
  return null;
}

// ---------- Spiel ----------
let kf = null;   // laufender Fall: { fall, platz[], kreuz:Set, wahl, modus, start, hilfen, timer, tag }
const kStand = () => loadJson(KRIMI_KEY);
let krimiStufe = (kStand().stufe in KRIMI_STUFEN) ? kStand().stufe : 'leicht';

function krimiTeil(id) {
  ['intro', 'spiel', 'ende'].forEach((t) => { $('krimi-' + t).hidden = t !== id; });
  window.scrollTo(0, 0);
  $('krimiBuehne').scrollTop = 0;
}

function krimiIntro() {
  clearInterval(kf && kf.timer);
  kf = null;
  krimiTeil('intro');
  $('krimiRunde').textContent = '';
  document.querySelectorAll('#krimiStufen button').forEach((b) => b.classList.toggle('on', b.dataset.stufe === krimiStufe));
  const st = kStand();
  const geloest = Object.values(st.geloest || {}).reduce((a, b) => a + b, 0);
  const best = (st.best || {})[krimiStufe];
  $('krimiBest').textContent = geloest
    ? '🔎 ' + geloest + (geloest === 1 ? ' Fall' : ' Fälle') + ' gelöst' + (best ? ' · Bestzeit ' + KRIMI_STUFEN[krimiStufe].name + ': ' + zeitText(best) : '')
    : 'Noch kein Fall gelöst';
  $('krimiTagBtn').textContent = (st.tag || {})[heute() + ':' + krimiStufe] ? '📅 Fall des Tages ✓' : '📅 Fall des Tages';
}
const zeitText = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

function krimiStart(tag) {
  const seed = tag ? 'krimi:' + heute() + ':' + krimiStufe : 'krimi:' + Date.now() + ':' + Math.random();
  $('krimiLos').disabled = true;
  // kurz warten, damit „Fall wird ausgedacht …“ erscheint, bevor gerechnet wird
  $('krimiLos').textContent = '🕵️ Fall wird ausgedacht …';
  setTimeout(() => {
    const fall = erzeugeFall(krimiStufe, zufallsGenerator(seed));
    $('krimiLos').disabled = false;
    $('krimiLos').textContent = 'Neuer Fall 🔎';
    if (!fall) return;
    kf = { fall, platz: new Array(fall.personen.length).fill(-1), kreuz: new Set(), wahl: 0, modus: 'setzen', start: Date.now(), hilfen: 0, tag };
    kf.timer = setInterval(krimiUhr, 1000);
    krimiTeil('spiel');
    krimiZeichnen();
    krimiUhr();
  }, 30);
}

function krimiUhr() {
  if (!kf) return;
  $('krimiRunde').textContent = '⏱ ' + zeitText(Math.floor((Date.now() - kf.start) / 1000));
}

function krimiZeichnen() {
  const { fall, platz, kreuz } = kf, { n, raum, moebel, raumListe, personen } = fall;
  const brett = $('krimiBrett');
  brett.style.setProperty('--n', n);
  brett.innerHTML = '';
  // Zwei Personen in einer Reihe oder Spalte → rot markieren
  const konflikt = new Set();
  platz.forEach((z, p) => platz.forEach((y, q) => {
    if (p < q && z >= 0 && y >= 0 && (Math.floor(z / n) === Math.floor(y / n) || z % n === y % n)) { konflikt.add(z); konflikt.add(y); }
  }));
  const ersteZelle = raumListe.map((_, r) => raum.indexOf(r));
  for (let z = 0; z < n * n; z++) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'kz';
    const r = Math.floor(z / n), c = z % n, R = raum[z];
    d.style.background = raumListe[R].farbe;
    const wand = (j, rand) => (rand || raum[j] !== R ? '3px solid #2b1d14' : '1px solid rgba(43,29,20,0.15)');
    d.style.borderTop = wand(z - n, r === 0);
    d.style.borderBottom = wand(z + n, r === n - 1);
    d.style.borderLeft = wand(z - 1, c === 0);
    d.style.borderRight = wand(z + 1, c === n - 1);
    if (moebel[z] === 'teppich') d.classList.add('teppich');
    if (moebel[z] && !MOEBEL[moebel[z]].frei) d.classList.add('fest');
    if (ersteZelle[R] === z) { const l = document.createElement('span'); l.className = 'kz-raum'; l.textContent = raumListe[R].name; d.appendChild(l); }
    if (moebel[z] && MOEBEL[moebel[z]].emoji) { const m = document.createElement('span'); m.className = 'kz-moebel'; m.textContent = MOEBEL[moebel[z]].emoji; d.appendChild(m); }
    const p = platz.indexOf(z);
    if (p >= 0) {
      const t = document.createElement('span');
      t.className = 'kz-person' + (personen[p].opfer ? ' opfer' : '') + (konflikt.has(z) ? ' konflikt' : '');
      t.textContent = personen[p].emoji;
      d.appendChild(t);
      d.setAttribute('aria-label', personen[p].name);
    } else if (kreuz.has(z)) {
      const x = document.createElement('span'); x.className = 'kz-kreuz'; x.textContent = '✕'; d.appendChild(x);
    }
    d.addEventListener('click', () => zelleTippen(z, d));
    brett.appendChild(d);
  }
  // Personen-Leiste
  const leiste = $('krimiPersonen');
  leiste.innerHTML = '';
  personen.forEach((pe, p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'kp' + (kf.wahl === p && kf.modus === 'setzen' ? ' an' : '') + (platz[p] >= 0 ? ' gesetzt' : '') + (pe.opfer ? ' opfer' : '');
    b.innerHTML = '<span class="kp-e"></span><span class="kp-n"></span>';
    b.querySelector('.kp-e').textContent = pe.emoji;
    b.querySelector('.kp-n').textContent = pe.opfer ? 'Opfer' : pe.name.split(' ').pop();
    b.title = pe.name;
    b.addEventListener('click', () => { kf.wahl = p; kf.modus = 'setzen'; krimiZeichnen(); });
    leiste.appendChild(b);
  });
  $('krimiSetzen').classList.toggle('an', kf.modus === 'setzen');
  $('krimiKreuz').classList.toggle('an', kf.modus === 'kreuz');
  // Hinweise mit Haken, sobald sie erfüllt sind
  const liste = $('krimiHinweise');
  liste.innerHTML = '';
  fall.hinweise.forEach((h) => {
    const li = document.createElement('li');
    const a = platz[h.p], b = h.q !== undefined ? platz[h.q] : 0;
    const voll = a >= 0 && b >= 0 && (!h.global || platz.every((z) => z >= 0));
    if (voll) li.className = (h.q !== undefined ? h.f(a, b) : h.f(a, platz)) ? 'ok' : 'falsch';
    li.textContent = h.text;
    liste.appendChild(li);
  });
  $('krimiStatus').textContent = platz.filter((z) => z >= 0).length + ' / ' + personen.length + ' Personen platziert';
}

function zelleTippen(z, el) {
  if (kf.vorbei) return;
  const { fall, platz, kreuz } = kf;
  const p = platz.indexOf(z);
  if (kf.modus === 'kreuz') {
    if (p >= 0) return;
    if (kreuz.has(z)) kreuz.delete(z); else kreuz.add(z);
    krimiZeichnen();
    return;
  }
  if (p >= 0 && (p === kf.wahl || platz[kf.wahl] >= 0)) {   // Person wieder vom Plan nehmen
    platz[p] = -1;
    kf.wahl = p;
    krimiZeichnen();
    return;
  }
  if (!begehbar(fall, z)) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
  if (p >= 0) platz[p] = -1;
  platz[kf.wahl] = z;
  kreuz.delete(z);
  const naechste = platz.findIndex((x) => x < 0);
  if (naechste >= 0) kf.wahl = naechste;
  krimiZeichnen();
  pruefeFall();
}

function pruefeFall() {
  const { fall, platz } = kf;
  if (platz.some((z) => z < 0)) return;
  if (platz.every((z, p) => z === fall.loesung[p])) { setTimeout(fallGeloest, 350); return; }
  const n = fall.n, raum = fall.raum;
  const doppelt = platz.some((z, p) => platz.some((y, q) => p < q && (Math.floor(z / n) === Math.floor(y / n) || z % n === y % n)));
  const rot = fall.hinweise.some((h) => !(h.q !== undefined ? h.f(platz[h.p], platz[h.q]) : h.f(platz[h.p], platz)));
  const opferRaum = raum[platz[platz.length - 1]];
  $('krimiStatus').textContent = doppelt || rot
    ? 'Alle platziert – aber etwas passt noch nicht. Schau auf die roten Hinweise und Felder.'
    : platz.filter((z) => raum[z] === opferRaum).length !== 2
      ? 'Fast! Aber denk an die Regel: Mit dem Opfer war genau eine Person allein im Raum.'
      : 'Fast! Es gibt eine andere Aufstellung, die alle Hinweise erfüllt – probier weiter.';
  $('krimiBrett').classList.remove('shake'); void $('krimiBrett').offsetWidth; $('krimiBrett').classList.add('shake');
}

function krimiTipp() {
  if (kf.vorbei) return;
  const { fall, platz } = kf;
  // erst falsch gesetzte Person zurücknehmen, sonst eine fehlende richtig setzen
  let p = platz.findIndex((z, i) => z >= 0 && z !== fall.loesung[i]);
  if (p < 0) p = platz.findIndex((z) => z < 0);
  if (p < 0) return;
  const andere = platz.indexOf(fall.loesung[p]);
  if (andere >= 0) platz[andere] = -1;
  platz[p] = fall.loesung[p];
  kf.hilfen++;
  const naechste = platz.findIndex((x) => x < 0);
  if (naechste >= 0) kf.wahl = naechste;
  krimiZeichnen();
  pruefeFall();
}

function fallGeloest() {
  if (!kf) return;
  clearInterval(kf.timer);
  const { fall } = kf, sek = Math.floor((Date.now() - kf.start) / 1000);
  const st = kStand();
  st.geloest = st.geloest || {}; st.best = st.best || {}; st.tag = st.tag || {};
  st.geloest[fall.stufe] = (st.geloest[fall.stufe] || 0) + 1;
  const neu = !kf.hilfen && (!st.best[fall.stufe] || sek < st.best[fall.stufe]);
  if (neu) st.best[fall.stufe] = sek;
  if (kf.tag) st.tag[heute() + ':' + fall.stufe] = true;
  saveJson(KRIMI_KEY, st);
  const m = fall.personen[fall.moerder];
  $('krimiTaeter').textContent = m.emoji;
  $('krimiTaeterName').textContent = m.name;
  $('krimiTatort').textContent = 'allein mit ' + OPFER.name + ' ' + fall.raumListe[fall.raum[fall.loesung[fall.personen.length - 1]]].im;
  $('krimiZeit').textContent = '⏱ ' + zeitText(sek) + (kf.hilfen ? ' · 💡 ' + kf.hilfen + (kf.hilfen === 1 ? ' Tipp' : ' Tipps') : '') + (neu ? ' · 🏆 Bestzeit!' : '');
  krimiTeil('ende');
  konfetti(50, ['🔎', '🕵️', '✨', '🎉', '🗝️']);
}

document.querySelectorAll('#krimiStufen button').forEach((b) => b.addEventListener('click', () => {
  krimiStufe = b.dataset.stufe;
  const st = kStand(); st.stufe = krimiStufe; saveJson(KRIMI_KEY, st);
  krimiIntro();
}));
$('krimiLos').addEventListener('click', () => krimiStart(false));
$('krimiTagBtn').addEventListener('click', () => krimiStart(true));
$('krimiSetzen').addEventListener('click', () => { kf.modus = 'setzen'; krimiZeichnen(); });
$('krimiKreuz').addEventListener('click', () => { kf.modus = 'kreuz'; krimiZeichnen(); });
$('krimiTippBtn').addEventListener('click', krimiTipp);
$('krimiNochmal').addEventListener('click', () => krimiStart(false));
$('krimiMenue').addEventListener('click', krimiIntro);
$('krimiAufgeben').addEventListener('click', () => {
  if (!confirm('Fall aufgeben und die Lösung ansehen?')) return;
  kf.platz = kf.fall.loesung.slice();
  kf.vorbei = true;
  krimiZeichnen();
  $('krimiStatus').textContent = 'Das ist die Lösung. ' + kf.fall.personen[kf.fall.moerder].name + ' war es!';
  clearInterval(kf.timer);
});
$('krimiZurueck').addEventListener('click', () => { if (kf) clearInterval(kf.timer); kf = null; zeigeHub(); });
$('hubKrimi').addEventListener('click', () => zoomZu($('hubKrimi'), () => { show('krimi', '🔎 Wer war\'s?'); krimiIntro(); }));
