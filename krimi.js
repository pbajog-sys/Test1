// 🔎 Wer war's? – Krimi-Logikrätsel („Mörder-Sudoku“).
// Ein Grundriss mit Räumen und Möbeln. In jeder Reihe und jeder Spalte steht genau eine Person.
// Pflanzen, Standuhren, Schränke und Stehlampen sind besetzt, auf Sesseln, Sofas, Betten und Teppichen darf man stehen.
// Wer allein mit dem Opfer in einem Raum war, ist der Mörder.
// Die Fälle erzeugt die App selbst: Grundriss, Lösung und so viele Hinweise, dass genau eine Lösung bleibt.
const KRIMI_KEY = 'walquiz.krimi.v1';
const KRIMI_STUFEN = {
  leicht: { name: 'Leicht', n: 4, raeume: 3 },
  mittel: { name: 'Mittel', n: 5, raeume: 4 },
  schwer: { name: 'Schwer', n: 6, raeume: 5 },
};
// Die Verdächtigen – in jedem Fall wird einer von ihnen zufällig zum Opfer
const VERDAECHTIGE = [
  { id: 'elena', name: 'Elena', voll: 'Dr. Elena Weiss', beruf: 'Biologin' },
  { id: 'markus', name: 'Markus', voll: 'Markus Steiner', beruf: 'Haustechniker' },
  { id: 'sophie', name: 'Sophie', voll: 'Sophie Graf', beruf: 'Künstlerin' },
  { id: 'jonas', name: 'Jonas', voll: 'Jonas Keller', beruf: 'IT-Spezialist' },
  { id: 'victoria', name: 'Victoria', voll: 'Victoria Lang', beruf: 'Geschäftsführerin' },
  { id: 'felix', name: 'Felix', voll: 'Dr. Felix Brandt', beruf: 'Chirurg' },
  { id: 'lara', name: 'Lara', voll: 'Lara Neumann', beruf: 'Köchin' },
  { id: 'thomas', name: 'Thomas', voll: 'Thomas Berger', beruf: 'Historiker' },
  { id: 'mia', name: 'Mia', voll: 'Mia Vogt', beruf: 'Journalistin' },
  { id: 'leon', name: 'Leon', voll: 'Leon Hartmann', beruf: 'Anwalt' },
];
// Dunkle Böden (Film noir) – die Möbel-Icons verschmelzen weich damit
const RAEUME = [
  { name: 'Salon', im: 'im Salon', farbe: '#4a2e22', icon: 'raum-salon' },
  { name: 'Küche', im: 'in der Küche', farbe: '#3a3d40', icon: 'raum-kueche' },
  { name: 'Schlafzimmer', im: 'im Schlafzimmer', farbe: '#3b2f45', icon: 'raum-schlafzimmer' },
  { name: 'Bibliothek', im: 'in der Bibliothek', farbe: '#3d2a1c', icon: 'raum-bibliothek' },
  { name: 'Arbeitszimmer', im: 'im Arbeitszimmer', farbe: '#46331f', icon: 'raum-arbeitszimmer' },
  { name: 'Wintergarten', im: 'im Wintergarten', farbe: '#26382a', icon: 'raum-wintergarten' },
];
// frei: darf man draufstellen · auf/neben: Text für Hinweise
const MOEBEL = {
  sessel:   { frei: true, auf: 'saß in einem Sessel', neben: 'stand neben einem Sessel' },
  sofa:     { frei: true, auf: 'saß auf einem Sofa', neben: 'stand neben einem Sofa' },
  bett:     { frei: true, auf: 'lag auf einem Bett', neben: 'stand neben einem Bett' },
  teppich:  { frei: true, auf: 'stand auf einem Teppich' },
  pflanze:  { frei: false, neben: 'stand neben einer Pflanze' },
  uhr:      { frei: false, neben: 'stand neben einer Standuhr' },
  schrank:  { frei: false, neben: 'stand neben einem Schrank' },
  lampe:    { frei: false, neben: 'stand neben einer Stehlampe' },
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
  const festArten = mischen(['pflanze', 'uhr', 'schrank', 'lampe', 'pflanze', 'schrank', 'lampe'], rnd);
  const freiArten = ['sessel', 'sessel', 'sofa', 'bett', 'teppich', 'teppich'];
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
    const z = loesung[p], [r, c] = rc(z), wer = pe.opfer ? 'Das Opfer ' + pe.name : pe.name;
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
      const P = personen[p].opfer ? 'Das Opfer ' + personen[p].name : personen[p].name;
      const Q = personen[q].opfer ? 'das Opfer ' + personen[q].name : personen[q].name;
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

// ---------- Logik-Löser: löst wie ein Mensch, Schritt für Schritt ----------
// Jede Person hat eine Menge möglicher Felder. Die Denkschritte sind nach Schwierigkeit gestuft:
//   1 – Nur noch ein Feld übrig
//   2 – Versteckter Einzelner (nur eine Person passt noch in eine Reihe/Spalte),
//       Hinweise über zwei Personen, Raum-Logik (genau eine Person beim Opfer, „allein“)
//   3 – Annahme: „Stünde X dort, ginge es nicht mehr auf“ (eine Annahme, dann nur Stufe 1–2)
// Ein Fall gilt nur, wenn er so komplett lösbar ist – Raten ist nie nötig.
const reiheVon = (fall, z) => Math.floor(z / fall.n);
const spalteVon = (fall, z) => z % fall.n;
const imRaum = (fall, R) => fall.raumListe[R].im;

function logikStart(fall, hinweise, fest = {}) {
  const { n } = fall;
  const kand = fall.personen.map((_, p) => {
    if (fest[p] !== undefined) return new Set([fest[p]]);
    const eigene = hinweise.filter((h) => h.p === p && h.q === undefined && !h.global);
    return new Set([...Array(n * n).keys()].filter((z) => begehbar(fall, z) && eigene.every((h) => h.f(z))));
  });
  return { kand, gesetzt: kand.map(() => false) };
}
const kopie = (st) => ({ kand: st.kand.map((k) => new Set(k)), gesetzt: st.gesetzt.slice() });
const raeumeVon = (fall, k) => new Set([...k].map((z) => fall.raum[z]));
const sicherIn = (fall, k, R) => k.size > 0 && [...k].every((z) => fall.raum[z] === R);
const kannIn = (fall, k, R) => [...k].some((z) => fall.raum[z] === R);
function entferne(st, p, test) {
  let weg = 0;
  for (const z of [...st.kand[p]]) if (test(z)) { st.kand[p].delete(z); weg++; }
  return weg;
}

function widerspruch(fall, hinweise, st) {
  const { n } = fall, N = st.kand.length;
  if (st.kand.some((k) => k.size === 0)) return true;
  for (let i = 0; i < n; i++) {
    if (!st.kand.some((k) => [...k].some((z) => reiheVon(fall, z) === i))) return true;
    if (!st.kand.some((k) => [...k].some((z) => spalteVon(fall, z) === i))) return true;
  }
  if (st.kand.every((k) => k.size === 1)) {
    const pl = st.kand.map((k) => [...k][0]);
    for (let p = 0; p < N; p++) for (let q = p + 1; q < N; q++) {
      if (reiheVon(fall, pl[p]) === reiheVon(fall, pl[q]) || spalteVon(fall, pl[p]) === spalteVon(fall, pl[q])) return true;
    }
    const or = fall.raum[pl[N - 1]];
    if (pl.filter((z) => fall.raum[z] === or).length !== 2) return true;
    if (!hinweise.every((h) => (h.q !== undefined ? h.f(pl[h.p], pl[h.q]) : h.f(pl[h.p], pl)))) return true;
  }
  return false;
}

// Stufe 1: Person hat nur noch ein Feld → steht dort; Reihe und Spalte sind für alle anderen weg
function schrittEinzel(fall, hinweise, st) {
  for (let p = 0; p < st.kand.length; p++) {
    if (st.gesetzt[p] || st.kand[p].size !== 1) continue;
    const z = [...st.kand[p]][0];
    st.gesetzt[p] = true;
    st.kand.forEach((_, q) => { if (q !== p) entferne(st, q, (y) => reiheVon(fall, y) === reiheVon(fall, z) || spalteVon(fall, y) === spalteVon(fall, z)); });
    return { stufe: 1, art: 'einzel', p, z, text: fall.personen[p].name + ' kann nur noch auf einem Feld stehen.' };
  }
  return null;
}

// Stufe 2a: In eine Reihe/Spalte passt nur noch eine Person → sie muss dort stehen
function schrittVersteckt(fall, hinweise, st) {
  const { n } = fall;
  for (const [lage, von, wort] of [['Reihe', reiheVon, 'Reihe'], ['Spalte', spalteVon, 'Spalte']]) {
    for (let i = 0; i < n; i++) {
      const wer = st.kand.map((k, p) => ([...k].some((z) => von(fall, z) === i) ? p : -1)).filter((p) => p >= 0);
      if (wer.length !== 1) continue;
      const p = wer[0];
      if (entferne(st, p, (z) => von(fall, z) !== i)) {
        return { stufe: 2, art: 'versteckt', p, text: 'In die ' + (i + 1) + '. ' + wort + ' passt nur noch ' + fall.personen[p].name + '.' };
      }
    }
  }
  return null;
}

// Stufe 2b: Hinweise über zwei Personen – Felder ohne passenden Partner fallen weg
function schrittPaar(fall, hinweise, st) {
  for (const h of hinweise) {
    if (h.q === undefined) continue;
    for (const [a, b, f] of [[h.p, h.q, (x, y) => h.f(x, y)], [h.q, h.p, (x, y) => h.f(y, x)]]) {
      const weg = entferne(st, a, (z) => ![...st.kand[b]].some((y) => y !== z && reiheVon(fall, y) !== reiheVon(fall, z) && spalteVon(fall, y) !== spalteVon(fall, z) && f(z, y)));
      if (weg) return { stufe: 2, art: 'paar', p: a, text: 'Wegen „' + h.text.replace(/\.$/, '') + '“ ' + (weg === 1 ? 'fällt für ' + fall.personen[a].name + ' ein Feld' : 'fallen für ' + fall.personen[a].name + ' ' + weg + ' Felder') + ' weg.' };
    }
  }
  return null;
}

// Stufe 2c: Raum-Logik – beim Opfer war genau eine weitere Person, „allein“ heißt allein
function schrittRaum(fall, hinweise, st) {
  const N = st.kand.length, V = N - 1, P = (p) => fall.personen[p].name;
  const andere = (p) => [...Array(N).keys()].filter((q) => q !== p);
  // Opfer: Räume ausschließen, in denen keine oder schon zwei andere Personen sicher sind
  for (const R of raeumeVon(fall, st.kand[V])) {
    const koennen = andere(V).filter((q) => kannIn(fall, st.kand[q], R));
    const sicher = andere(V).filter((q) => sicherIn(fall, st.kand[q], R));
    if (koennen.length === 0 || sicher.length >= 2) {
      entferne(st, V, (z) => fall.raum[z] === R);
      return { stufe: 2, art: 'raum', p: V, text: 'Beim Opfer war genau eine weitere Person – ' + (koennen.length ? 'aber ' + imRaum(fall, R) + ' waren schon zwei.' : 'aber ' + imRaum(fall, R) + ' kann sonst niemand sein.') + ' Also war ' + P(V) + ' nicht ' + imRaum(fall, R) + '.' };
    }
  }
  const opferRaeume = raeumeVon(fall, st.kand[V]);
  if (opferRaeume.size === 1) {
    const R = [...opferRaeume][0];
    const sicher = andere(V).filter((q) => sicherIn(fall, st.kand[q], R));
    if (sicher.length === 1) {
      for (const q of andere(V)) {
        if (q !== sicher[0] && entferne(st, q, (z) => fall.raum[z] === R)) {
          return { stufe: 2, art: 'raum', p: q, text: P(V) + ' und ' + P(sicher[0]) + ' waren ' + imRaum(fall, R) + ' – mehr Personen waren dort nicht. Also war ' + P(q) + ' nicht ' + imRaum(fall, R) + '.' };
        }
      }
    }
    const koennen = andere(V).filter((q) => kannIn(fall, st.kand[q], R));
    if (koennen.length === 1 && entferne(st, koennen[0], (z) => fall.raum[z] !== R)) {
      return { stufe: 2, art: 'raum', p: koennen[0], text: 'Beim Opfer ' + imRaum(fall, R) + ' war genau eine Person – das kann nur ' + P(koennen[0]) + ' sein.' };
    }
  }
  // „X war ganz allein im Raum“
  for (const h of hinweises(hinweise, 'allein')) {
    const p = h.p;
    const R1 = raeumeVon(fall, st.kand[p]);
    if (R1.size === 1) {
      const R = [...R1][0];
      for (const q of andere(p)) {
        if (entferne(st, q, (z) => fall.raum[z] === R)) return { stufe: 2, art: 'raum', p: q, text: P(p) + ' war allein ' + imRaum(fall, R) + ' – also war ' + P(q) + ' nicht dort.' };
      }
    }
    for (const q of andere(p)) {
      const Rq = raeumeVon(fall, st.kand[q]);
      if (Rq.size === 1) {
        const R = [...Rq][0];
        if (entferne(st, p, (z) => fall.raum[z] === R)) return { stufe: 2, art: 'raum', p, text: P(q) + ' war sicher ' + imRaum(fall, R) + ' – und ' + P(p) + ' war allein, also nicht dort.' };
      }
    }
  }
  return null;
}
const hinweises = (hinweise, art) => hinweise.filter((h) => h.art === art);

const LEICHTE_SCHRITTE = [schrittEinzel, schrittVersteckt, schrittPaar, schrittRaum];
function propagiere(fall, hinweise, st) {
  for (;;) {
    if (widerspruch(fall, hinweise, st)) return false;
    if (!LEICHTE_SCHRITTE.some((f) => f(fall, hinweise, st))) return true;
  }
}

// Stufe 3: Annahme durchspielen – führt sie zum Widerspruch, fällt das Feld weg
function schrittAnnahme(fall, hinweise, st) {
  const reihenfolge = [...st.kand.keys()].filter((p) => st.kand[p].size > 1).sort((a, b) => st.kand[a].size - st.kand[b].size);
  for (const p of reihenfolge) {
    for (const z of st.kand[p]) {
      const probe = kopie(st);
      probe.kand[p] = new Set([z]);
      if (!propagiere(fall, hinweise, probe)) {
        st.kand[p].delete(z);
        const R = fall.raum[z];
        return { stufe: 3, art: 'annahme', p, text: 'Angenommen, ' + fall.personen[p].name + ' stünde ' + imRaum(fall, R) + ' in Reihe ' + (reiheVon(fall, z) + 1) + ', Spalte ' + (spalteVon(fall, z) + 1) + ' – dann ginge es nicht mehr auf. Also nicht dort.' };
      }
    }
  }
  return null;
}

function logikLoesen(fall, hinweise, fest) {
  const st = logikStart(fall, hinweise, fest);
  const schritte = [];
  while (!st.gesetzt.every(Boolean)) {
    if (widerspruch(fall, hinweise, st)) return { geloest: false, schritte };
    const s = LEICHTE_SCHRITTE.reduce((x, f) => x || f(fall, hinweise, st), null) || schrittAnnahme(fall, hinweise, st);
    if (!s) return { geloest: false, schritte };
    schritte.push(s);
    if (schritte.length > 400) return { geloest: false, schritte };
  }
  const geloest = st.kand.every((k, p) => [...k][0] === fall.loesung[p]);
  return { geloest, schritte };
}

function bewerten(ergebnis) {
  const s = ergebnis.schritte;
  const s2 = s.filter((x) => x.stufe === 2).length, s3 = s.filter((x) => x.stufe === 3).length;
  return { s2, s3, denkschritte: s.length, punkte: s2 + 4 * s3, sterne: s3 >= 2 ? 3 : s3 === 1 || s2 >= 4 ? 2 : 1 };
}
// Was ein Fall der Stufe braucht: Leicht ohne Annahmen, Mittel mit echten Schlussfolgerungen, Schwer mit Annahme
const KRIMI_ZIEL = {
  leicht: (b) => b.s3 === 0 && b.s2 <= 4,
  mittel: (b) => b.s3 === 0 && b.s2 >= 3,
  schwer: (b) => b.s3 >= 1,
};

// Ein ganzer Fall: Grundriss, Personen, Lösung, Hinweise – dann mit dem Logik-Löser geprüft und bewertet
function erzeugeFall(stufe, rnd) {
  const { n, raeume } = KRIMI_STUFEN[stufe];
  let notfall = null;
  for (let versuch = 0; versuch < 400; versuch++) {
    const raum = raeumeAufteilen(n, raeume, rnd);
    if (!raum) continue;
    const fall = { stufe, n, raum, moebel: moebelVerteilen(n, rnd), raumListe: mischen(RAEUME, rnd).slice(0, raeume) };
    // n Personen aus dem Kreis der Verdächtigen – die letzte ist das Opfer
    fall.personen = mischen(VERDAECHTIGE, rnd).slice(0, n).map((pe, i) => ({ ...pe, opfer: i === n - 1 }));
    fall.loesung = platzieren(fall, rnd);
    if (!fall.loesung) continue;
    const opferRaum = raum[fall.loesung[n - 1]];
    if (fall.loesung.filter((z) => raum[z] === opferRaum).length !== 2) continue;
    fall.moerder = fall.loesung.findIndex((z, i) => i !== n - 1 && raum[z] === opferRaum);
    // 1. Hinweise sammeln, bis genau eine Lösung bleibt (Zähl-Löser)
    const pool = mischen(alleHinweise(fall, rnd), rnd);
    const hinweise = [];
    for (const h of pool) {
      hinweise.push(h);
      if (loesungenZaehlen(fall, hinweise) === 1) break;
    }
    if (loesungenZaehlen(fall, hinweise) !== 1) continue;
    // 2. Überflüssige Hinweise weglassen – aber nur, wenn der Fall danach noch ohne Raten lösbar ist
    for (const h of mischen(hinweise, rnd)) {
      const ohne = hinweise.filter((x) => x !== h);
      if (loesungenZaehlen(fall, ohne) === 1 && logikLoesen(fall, ohne).geloest) hinweise.splice(hinweise.indexOf(h), 1);
    }
    // 3. Logik-Löser: komplett ohne Raten lösbar? Wie schwer?
    const ergebnis = logikLoesen(fall, hinweise);
    if (!ergebnis.geloest) continue;
    fall.bewertung = bewerten(ergebnis);
    fall.hinweise = hinweise.sort((a, b) => (a.q !== undefined) - (b.q !== undefined) || a.p - b.p);
    if (KRIMI_ZIEL[stufe](fall.bewertung)) return fall;
    // Falls die Stufe lange nicht getroffen wird: den passendsten Fall nehmen
    const naehe = (b) => (stufe === 'schwer' ? b.punkte : stufe === 'leicht' ? -b.punkte : -Math.abs(b.s2 - 4) - 4 * b.s3);
    if (!notfall || naehe(fall.bewertung) > naehe(notfall.bewertung)) notfall = fall;
    if (versuch > 120 && notfall) return notfall;
  }
  return notfall;
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
  $('krimiTagBtn').replaceChildren(krimiIcon('schluessel', 'mini'), (st.tag || {})[heute() + ':' + krimiStufe] ? ' Fall des Tages ✓' : ' Fall des Tages');
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
    $('krimiLos').textContent = 'Neuer Fall';
    if (!fall) return;
    kf = { fall, platz: new Array(fall.personen.length).fill(-1), kreuz: new Set(), wahl: 0, modus: 'setzen', start: Date.now(), hilfen: 0, tag };
    kf.timer = setInterval(krimiUhr, 1000);
    $('krimiTippText').hidden = true;
    const opfer = fall.personen[fall.personen.length - 1];
    $('krimiOpfer').replaceChildren(krimiFigur(opfer, 'ko-bild'), Object.assign(document.createElement('span'), { textContent: opfer.voll + ' (' + opfer.beruf + ') wurde tot aufgefunden. Wer war es?' }));
    const sterne = $('krimiSterne');
    sterne.replaceChildren();
    for (let i = 1; i <= 3; i++) sterne.appendChild(krimiIcon(i <= fall.bewertung.sterne ? 'stern' : 'stern-leer', 'ks-stern'));
    sterne.append(' ' + fall.bewertung.denkschritte + ' Denkschritte');
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
    d.style.setProperty('--boden', raumListe[R].farbe);
    d.classList.add('boden-' + (KRIMI_BODEN[raumListe[R].name] || 'parkett'));
    d.dataset.raum = R;
    const wand = (j, rand) => (rand || raum[j] !== R ? '3px solid #cdb68c' : '1px solid rgba(255,240,210,0.07)');
    d.style.borderTop = wand(z - n, r === 0);
    d.style.borderBottom = wand(z + n, r === n - 1);
    d.style.borderLeft = wand(z - 1, c === 0);
    d.style.borderRight = wand(z + 1, c === n - 1);
    if (moebel[z] === 'teppich') d.appendChild(krimiIcon('teppich', 'kz-teppich'));
    if (moebel[z] && !MOEBEL[moebel[z]].frei) d.classList.add('fest');
    if (ersteZelle[R] === z) {
      const l = document.createElement('span');
      l.className = 'kz-raum' + (c >= n - 2 ? ' rechts' : '');   // am rechten Rand nach links ausrichten
      l.append(krimiIcon(raumListe[R].icon, 'kz-raum-icon'), Object.assign(document.createElement('span'), { className: 'kz-raum-text', textContent: raumListe[R].name }));
      d.appendChild(l);
    }
    if (moebel[z] && moebel[z] !== 'teppich') d.appendChild(krimiIcon(KRIMI_MOEBEL_BILD[moebel[z]], 'kz-moebel m-' + moebel[z]));
    const p = platz.indexOf(z);
    if (p >= 0) {
      const t = krimiFigur(personen[p], 'kz-person' + (konflikt.has(z) ? ' konflikt' : ''));
      d.appendChild(t);
      d.classList.add('besetzt');
      d.setAttribute('aria-label', personen[p].voll);
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
    b.innerHTML = '<span class="kp-n"></span>';
    b.prepend(krimiFigur(pe, 'kp-fig'));
    b.querySelector('.kp-n').textContent = pe.name;
    b.title = pe.voll + ' · ' + pe.beruf + (pe.opfer ? ' · Opfer' : '');
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
  $('krimiTippText').hidden = true;
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

// 💡 Tipp: Der Logik-Löser rechnet von den richtig gesetzten Personen aus weiter und erklärt den nächsten Denkschritt.
function krimiTipp() {
  if (kf.vorbei) return;
  const { fall, platz } = kf;
  kf.hilfen++;
  const falsch = platz.findIndex((z, i) => z >= 0 && z !== fall.loesung[i]);
  if (falsch >= 0) {
    platz[falsch] = -1;
    kf.wahl = falsch;
    krimiZeichnen();
    krimiTippZeigen('🕵️ ' + fall.personen[falsch].name + ' stand nicht richtig – ich habe die Figur wieder vom Plan genommen.');
    return;
  }
  const fest = {};
  platz.forEach((z, p) => { if (z >= 0) fest[p] = z; });
  const { schritte } = logikLoesen(fall, fall.hinweise, fest);
  const i = schritte.findIndex((st) => st.art === 'einzel' && platz[st.p] < 0);
  if (i < 0) return;
  const p = schritte[i].p;
  // der Denkschritt, der diese Person festgelegt hat (sonst der allgemeinste davor)
  const grund = schritte.slice(0, i).reverse().find((st) => st.p === p && st.art !== 'einzel');
  platz[p] = fall.loesung[p];
  const naechste = platz.findIndex((x) => x < 0);
  if (naechste >= 0) kf.wahl = naechste;
  krimiZeichnen();
  const z = fall.loesung[p];
  krimiTippZeigen('💡 ' + (grund ? grund.text + ' Damit bleibt für ' + fall.personen[p].name + ' nur ein Feld.'
    : 'Für ' + fall.personen[p].name + ' bleibt nur noch ein freies Feld: Reihe ' + (reiheVon(fall, z) + 1) + ', Spalte ' + (spalteVon(fall, z) + 1) + '.'));
  pruefeFall();
}
function krimiTippZeigen(text) {
  const t = $('krimiTippText');
  t.textContent = text;
  t.hidden = false;
  t.classList.remove('neu'); void t.offsetWidth; t.classList.add('neu');
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
  $('krimiTaeter').replaceChildren(krimiFigur(m, 'krimi-taeter-fig'));
  // Grundriss der Lösung: nur der Tatort leuchtet
  const eb = $('krimiEndBrett');
  eb.innerHTML = $('krimiBrett').innerHTML;
  eb.style.setProperty('--n', fall.n);
  eb.dataset.tatort = fall.raum[fall.loesung[fall.personen.length - 1]];
  eb.querySelectorAll('.kz').forEach((c) => c.classList.toggle('tatort', c.dataset.raum === eb.dataset.tatort));
  $('krimiTaeterName').textContent = m.voll;
  $('krimiTatort').textContent = m.beruf + ' · allein mit ' + fall.personen[fall.personen.length - 1].voll + ' ' + fall.raumListe[fall.raum[fall.loesung[fall.personen.length - 1]]].im;
  $('krimiZeit').textContent = '⏱ ' + zeitText(sek) + (kf.hilfen ? ' · 💡 ' + kf.hilfen + (kf.hilfen === 1 ? ' Tipp' : ' Tipps') : '') + (neu ? ' · 🏆 Bestzeit!' : '');
  krimiTeil('ende');
  setTimeout(() => konfetti(30, ['✨', '⭐', '✨']), 500);
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

// Icons einsetzen (aus krimi-grafik.js)
document.querySelectorAll('[data-k-icon]').forEach((el) => el.replaceChildren(krimiIcon(el.dataset.kIcon)));
