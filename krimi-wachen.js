// 🏮 Wachen der Villa – Logikrätsel (Typ „Star Battle“).
// Jeder Raum bekommt genau eine Wache mit Laterne. In jeder Reihe und Spalte steht genau eine Wache,
// und zwei Wachen dürfen sich nie berühren – auch nicht schräg.
// Generator: erst eine gültige Aufstellung, dann Räume um die Wachen wachsen lassen, bis die Lösung eindeutig ist.
// Danach muss der Fall mit Denkschritten (ohne Raten) lösbar sein; die Schritte bestimmen die Schwierigkeit.
const WACHEN_STUFEN = { leicht: 5, mittel: 6, schwer: 7 };
const WACHEN_RAEUME = [
  { name: 'rot', im: 'im roten Raum', farbe: '#6e1f2a' },
  { name: 'grün', im: 'im grünen Raum', farbe: '#1d5236' },
  { name: 'blau', im: 'im blauen Raum', farbe: '#1e3a66' },
  { name: 'gold', im: 'im goldenen Raum', farbe: '#7a5a16' },
  { name: 'violett', im: 'im violetten Raum', farbe: '#4a2668' },
  { name: 'türkis', im: 'im türkisen Raum', farbe: '#16585e' },
  { name: 'grau', im: 'im grauen Raum', farbe: '#44444e' },
];

// Laterne der Wache (selbst gezeichnet)
const WACHE_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <path d="M50 4 a9 9 0 0 1 9 9 h-4 a5 5 0 0 0 -10 0 h-4 a9 9 0 0 1 9 -9z" fill="url(#wMessing)"/>
  <path d="M30 22 h40 l-6 -8 h-28z" fill="url(#wMessing)" stroke="#5a3a10" stroke-width="2" stroke-linejoin="round"/>
  <path d="M33 24 h34 l4 50 h-42z" fill="url(#wGlas)" stroke="#5a3a10" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M50 24 v50 M37 24 l-2 50 M63 24 l2 50" stroke="#7a5418" stroke-width="2" opacity=".7"/>
  <path d="M50 44 q7 9 0 18 q-7 -9 0 -18z" fill="#fff" opacity=".9" class="w-flamme"/>
  <path d="M24 74 h52 l-4 10 h-44z" fill="url(#wMessing)" stroke="#5a3a10" stroke-width="2" stroke-linejoin="round"/>
  <rect x="30" y="84" width="40" height="7" rx="2" fill="#5a3a10"/>
</svg>`;

// Farbverläufe der Laterne einmal fest ins Dokument – nicht in einem versteckten Bild,
// sonst zeichnet der Browser sie nicht und alle Laternen bleiben dunkel
document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><radialGradient id="wGlas" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#fff7d6"/><stop offset=".45" stop-color="#ffcf6a"/><stop offset="1" stop-color="#e08a1e"/></radialGradient>
  <linearGradient id="wMessing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5d27a"/><stop offset=".5" stop-color="#b8862b"/><stop offset="1" stop-color="#7a5418"/></linearGradient></defs></svg>`);

// ---------- Generator ----------
const wNachbarn8 = (n, z) => {
  const r = Math.floor(z / n), c = z % n, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if ((dr || dc) && r + dr >= 0 && r + dr < n && c + dc >= 0 && c + dc < n) out.push((r + dr) * n + c + dc);
  }
  return out;
};
function wachenAufstellung(n, rnd) {
  const sp = new Array(n).fill(-1), frei = new Set([...Array(n).keys()]);
  const los = (r) => {
    if (r === n) return true;
    for (const c of mischen([...frei], rnd)) {
      if (r > 0 && Math.abs(c - sp[r - 1]) <= 1) continue;
      sp[r] = c; frei.delete(c);
      if (los(r + 1)) return true;
      frei.add(c);
    }
    return false;
  };
  return los(0) ? sp.map((c, r) => r * n + c) : null;
}
// Räume wachsen von den Wachen aus – unregelmäßig, damit es spannend wird
function wachenRaeume(n, wachen, rnd) {
  const raum = new Array(n * n).fill(-1);
  wachen.forEach((z, i) => { raum[z] = i; });
  let offen = n * n - n;
  while (offen > 0) {
    const kand = [];
    raum.forEach((r, z) => { if (r < 0) nachbarn(n, z).forEach((j) => { if (raum[j] >= 0) kand.push([z, raum[j]]); }); });
    const [z, r] = kand[Math.floor(rnd() * kand.length)];
    raum[z] = r; offen--;
  }
  return raum;
}
function wachenZaehlen(n, raum, grenze = 2, fest = []) {
  const spalte = new Set(), rr = new Set();
  let gefunden = 0, vor = -9;
  const festReihe = {};
  fest.forEach((z) => { festReihe[Math.floor(z / n)] = z % n; });
  const los = (r) => {
    if (r === n) { gefunden++; return; }
    for (let c = 0; c < n; c++) {
      if (festReihe[r] !== undefined && festReihe[r] !== c) continue;
      const z = r * n + c;
      if (spalte.has(c) || rr.has(raum[z]) || Math.abs(c - vor) <= 1) continue;
      spalte.add(c); rr.add(raum[z]);
      const alt = vor; vor = c;
      los(r + 1);
      vor = alt; spalte.delete(c); rr.delete(raum[z]);
      if (gefunden >= grenze) return;
    }
  };
  los(0);
  return gefunden;
}

// ---------- Logik-Löser (wie ein Mensch) ----------
function wLogik(fall, festWachen = []) {
  const { n, raum } = fall;
  const kand = new Set([...Array(n * n).keys()]);
  const gesetzt = new Set();
  const reihe = (z) => Math.floor(z / n), spalte = (z) => z % n;
  const gruppen = () => {
    const g = [];
    for (let i = 0; i < n; i++) {
      g.push({ art: 'Reihe', i, name: 'in Reihe ' + (i + 1), zellen: [...kand].filter((z) => reihe(z) === i), fertig: [...gesetzt].some((z) => reihe(z) === i) });
      g.push({ art: 'Spalte', i, name: 'in Spalte ' + (i + 1), zellen: [...kand].filter((z) => spalte(z) === i), fertig: [...gesetzt].some((z) => spalte(z) === i) });
      g.push({ art: 'Raum', i, name: WACHEN_RAEUME[i].im, zellen: [...kand].filter((z) => raum[z] === i), fertig: [...gesetzt].some((z) => raum[z] === i) });
    }
    return g;
  };
  const sperre = (z) => [...Array(n * n).keys()].filter((y) => y !== z && (reihe(y) === reihe(z) || spalte(y) === spalte(z) || raum[y] === raum[z] || wNachbarn8(n, z).includes(y)));
  const setze = (z) => { gesetzt.add(z); sperre(z).forEach((y) => kand.delete(y)); };
  festWachen.forEach(setze);
  const widerspruch = () => gruppen().some((g) => !g.fertig && g.zellen.filter((z) => !gesetzt.has(z)).length === 0);
  const schritte = [];
  const schritt = (st) => { schritte.push(st); return st; };

  const stufe1 = () => {
    for (const g of gruppen()) {
      if (g.fertig) continue;
      const z = g.zellen.filter((y) => !gesetzt.has(y));
      if (z.length === 1) { setze(z[0]); return schritt({ stufe: 1, setzt: z[0], text: 'Für die Wache ' + g.name + ' bleibt nur noch ein Feld.' }); }
    }
    return null;
  };
  const stufe2 = () => {
    const gs = gruppen().filter((g) => !g.fertig);
    // Ein Raum liegt ganz in einer Reihe/Spalte → dort darf sonst keine Wache stehen (und umgekehrt)
    for (const a of gs) for (const b of gs) {
      if (a === b || a.art === b.art || (a.art !== 'Raum' && b.art !== 'Raum')) continue;
      if (!a.zellen.length || !a.zellen.every((z) => b.zellen.includes(z))) continue;
      const weg = b.zellen.filter((z) => !a.zellen.includes(z));
      if (weg.length) {
        weg.forEach((z) => kand.delete(z));
        return schritt({ stufe: 2, weg, text: 'Die Wache ' + a.name + ' steht sicher ' + b.name.replace(/^im /, 'im ').replace(/^in /, 'in ') + ' – also steht dort sonst keine Wache.' });
      }
    }
    // Eine Wache auf diesem Feld würde einen ganzen Raum, eine Reihe oder Spalte blockieren
    for (const z of kand) {
      if (gesetzt.has(z)) continue;
      const blockiert = new Set(sperre(z));
      const opfer = gs.find((g) => !(g.art === 'Raum' ? raum[z] === g.i : g.art === 'Reihe' ? reihe(z) === g.i : spalte(z) === g.i) && g.zellen.length && g.zellen.every((y) => blockiert.has(y)));
      if (opfer) {
        kand.delete(z);
        return schritt({ stufe: 2, weg: [z], text: 'Eine Wache in Reihe ' + (reihe(z) + 1) + ', Spalte ' + (spalte(z) + 1) + ' würde ' + opfer.name.replace(/^in /, 'die ganze ').replace(/^im /, 'den ganzen ').replace(/ Raum$/, ' Raum') + ' blockieren – also nicht dort.' });
      }
    }
    // Zwei Räume liegen zusammen in zwei Reihen/Spalten → dort keine anderen Wachen
    const raeume = gs.filter((g) => g.art === 'Raum');
    for (const art of ['Reihe', 'Spalte']) {
      const von = art === 'Reihe' ? reihe : spalte;
      for (let i = 0; i < raeume.length; i++) for (let j = i + 1; j < raeume.length; j++) {
        const zellen = raeume[i].zellen.concat(raeume[j].zellen);
        const linien = new Set(zellen.map(von));
        if (linien.size !== 2 || [...linien].some((l) => gs.find((g) => g.art === art && g.i === l) === undefined)) continue;
        const weg = [...kand].filter((z) => linien.has(von(z)) && raum[z] !== raeume[i].i && raum[z] !== raeume[j].i && !gesetzt.has(z));
        if (weg.length) {
          weg.forEach((z) => kand.delete(z));
          const [l1, l2] = [...linien].sort((a, b) => a - b);
          return schritt({ stufe: 2, weg, text: 'Die Wachen ' + raeume[i].name + ' und ' + raeume[j].name.replace(/^im /, '') + ' brauchen die ' + art + 'n ' + (l1 + 1) + ' und ' + (l2 + 1) + ' – dort steht sonst niemand.' });
        }
      }
    }
    return null;
  };
  const propagiere = () => { for (;;) { if (widerspruch()) return false; if (!stufe1() && !stufe2()) return true; } };
  const stufe3 = () => {
    for (const z of [...kand]) {
      if (gesetzt.has(z)) continue;
      const k = new Set(kand), g = new Set(gesetzt), s = schritte.length;
      setze(z);
      const ok = propagiere();
      kand.clear(); k.forEach((y) => kand.add(y)); gesetzt.clear(); g.forEach((y) => gesetzt.add(y)); schritte.length = s;
      if (!ok) {
        kand.delete(z);
        return schritt({ stufe: 3, weg: [z], text: 'Angenommen, in Reihe ' + (reihe(z) + 1) + ', Spalte ' + (spalte(z) + 1) + ' stünde eine Wache – dann ginge es nicht mehr auf. Also nicht dort.' });
      }
    }
    return null;
  };
  while (gesetzt.size < n) {
    if (widerspruch()) return { geloest: false, schritte };
    if (!stufe1() && !stufe2() && !stufe3()) return { geloest: false, schritte };
    if (schritte.length > 300) return { geloest: false, schritte };
  }
  return { geloest: fall.loesung.every((z) => gesetzt.has(z)), schritte };
}

const WACHEN_ZIEL = { leicht: (b) => b.s3 === 0 && b.s2 <= 5, mittel: (b) => b.s3 === 0 && b.s2 >= 3, schwer: (b) => b.s3 >= 1 || b.s2 >= 8 };
function erzeugeWachen(stufe, rnd) {
  const n = WACHEN_STUFEN[stufe];
  let notfall = null;
  for (let versuch = 0; versuch < 3000; versuch++) {
    const loesung = wachenAufstellung(n, rnd);
    const raum = wachenRaeume(n, loesung, rnd);
    if (wachenZaehlen(n, raum) !== 1) continue;
    const fall = { stufe, n, raum, loesung };
    const e = wLogik(fall);
    if (!e.geloest) continue;
    const s2 = e.schritte.filter((x) => x.stufe === 2).length, s3 = e.schritte.filter((x) => x.stufe === 3).length;
    fall.bewertung = { s2, s3, denkschritte: e.schritte.length, sterne: s3 >= 1 || s2 >= 8 ? 3 : s2 >= 4 ? 2 : 1 };
    if (WACHEN_ZIEL[stufe](fall.bewertung)) return fall;
    if (!notfall || (stufe === 'schwer' ? fall.bewertung.s2 > notfall.bewertung.s2 : fall.bewertung.s2 < notfall.bewertung.s2)) notfall = fall;
    if (versuch > 600 && notfall) return notfall;
  }
  return notfall;
}

// ---------- Spiel ----------
let wf = null;   // { fall, zustand[] (0 leer, 1 ✕, 2 Wache), verlauf[], hilfen, tag }

function wachenStart({ stufe, seed, tag, fall }) {
  fall = fall || erzeugeWachen(stufe, zufallsGenerator(seed));
  if (!fall) return;
  wf = { fall, zustand: new Array(fall.n * fall.n).fill(0), verlauf: [], hilfen: 0, tag };
  $('wachenTipp').hidden = true;
  krimiSterne($('wachenSterne'), fall.bewertung);
  krimiTeil('wachen');
  wachenZeichnen();
  krimiUhrStart();
}

function wachenKonflikte() {
  const { n, raum } = wf.fall;
  const w = wf.zustand.map((s, z) => (s === 2 ? z : -1)).filter((z) => z >= 0);
  const k = new Set();
  w.forEach((a) => w.forEach((b) => {
    if (a < b && (Math.floor(a / n) === Math.floor(b / n) || a % n === b % n || raum[a] === raum[b] || wNachbarn8(n, a).includes(b))) { k.add(a); k.add(b); }
  }));
  return { w, k };
}

function wachenZeichnen() {
  const { n, raum } = wf.fall;
  const brett = $('wachenBrett');
  brett.style.setProperty('--n', n);
  brett.innerHTML = '';
  const { w, k } = wachenKonflikte();
  // Licht der Laternen: Nachbarfelder hell, Reihe/Spalte/Raum leicht beleuchtet
  const schein = new Set();
  w.forEach((z) => {
    wNachbarn8(n, z).forEach((y) => schein.add(y));
    for (let y = 0; y < n * n; y++) if (y !== z && (Math.floor(y / n) === Math.floor(z / n) || y % n === z % n || raum[y] === raum[z])) schein.add(y);
  });
  for (let z = 0; z < n * n; z++) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'wz';
    const r = Math.floor(z / n), c = z % n, R = raum[z];
    d.style.setProperty('--boden', WACHEN_RAEUME[R].farbe);
    const wand = (j, rand) => (rand || raum[j] !== R ? '3px solid #cdb68c' : '1px solid rgba(255,240,210,0.08)');
    d.style.borderTop = wand(z - n, r === 0);
    d.style.borderBottom = wand(z + n, r === n - 1);
    d.style.borderLeft = wand(z - 1, c === 0);
    d.style.borderRight = wand(z + 1, c === n - 1);
    if (schein.has(z)) d.classList.add('schein');
    if (wf.zustand[z] === 1) d.innerHTML = '<span class="wz-kreuz">✕</span>';
    if (wf.zustand[z] === 2) {
      d.classList.add('hat-wache');
      d.innerHTML = '<span class="wz-licht"></span><span class="wz-wache' + (k.has(z) ? ' konflikt' : '') + '">' + WACHE_SVG + '</span>';
      d.setAttribute('aria-label', 'Wache');
    }
    d.addEventListener('click', () => wachenTippen(z));
    brett.appendChild(d);
  }
  $('wachenStatus').textContent = w.length + ' / ' + n + ' Wachen aufgestellt' + (k.size ? ' – zwei Wachen sehen sich!' : '');
  $('wachenStatus').classList.toggle('fehler', k.size > 0);
}

// Tippen: leer → ✕ → Wache → leer
function wachenTippen(z) {
  if (wf.vorbei) return;
  wf.verlauf.push(wf.zustand.slice());
  wf.zustand[z] = (wf.zustand[z] + 1) % 3;
  $('wachenTipp').hidden = true;
  wachenZeichnen();
  wachenPruefen();
}

function wachenPruefen() {
  const { fall } = wf;
  const { w, k } = wachenKonflikte();
  if (w.length !== fall.n || k.size) return;
  if (fall.loesung.every((z) => w.includes(z))) {
    wf.vorbei = true;
    $('wachenBrett').classList.add('alle-an');
    setTimeout(() => {
      krimiGeschafft({
        modus: 'wachen', stufe: fall.stufe, hilfen: wf.hilfen, tag: wf.tag,
        figur: Object.assign(document.createElement('span'), { className: 'krimi-taeter-icon w-gross', innerHTML: WACHE_SVG }),
        war: 'Die Villa ist bewacht', name: 'Alle ' + fall.n + ' Wachen stehen',
        text: 'Keiner kommt mehr unbemerkt hinein oder hinaus.',
        brett: { html: $('wachenBrett').innerHTML, n: fall.n, klasse: 'wachen-brett' },
        beweis: { text: 'Die Villa ist abgeriegelt – der Täter ist noch im Haus.' },
      });
    }, 900);
  }
}

function wachenTipp() {
  if (wf.vorbei) return;
  const { fall } = wf;
  const n = fall.n;
  wf.hilfen++;
  // falsche Wache zuerst zurücknehmen
  const falsch = wf.zustand.findIndex((s, z) => s === 2 && !fall.loesung.includes(z));
  if (falsch >= 0) {
    wf.verlauf.push(wf.zustand.slice());
    wf.zustand[falsch] = 0;
    wachenZeichnen();
    return wachenTippZeigen('🕵️ Die Wache in Reihe ' + (Math.floor(falsch / n) + 1) + ', Spalte ' + (falsch % n + 1) + ' steht falsch – ich habe sie zurückgenommen.');
  }
  const fest = wf.zustand.map((s, z) => (s === 2 ? z : -1)).filter((z) => z >= 0);
  const { schritte } = wLogik(fall, fest);
  // nächster Schritt, der auf dem Brett noch etwas ändert
  for (const s of schritte) {
    if (s.setzt !== undefined && wf.zustand[s.setzt] !== 2) {
      wf.verlauf.push(wf.zustand.slice());
      wf.zustand[s.setzt] = 2;
      wachenZeichnen();
      wachenTippZeigen('💡 ' + s.text);
      wachenPruefen();
      return;
    }
    if (s.weg && s.weg.some((z) => wf.zustand[z] === 0)) {
      wf.verlauf.push(wf.zustand.slice());
      s.weg.forEach((z) => { if (wf.zustand[z] === 0) wf.zustand[z] = 1; });
      wachenZeichnen();
      return wachenTippZeigen('💡 ' + s.text + ' (✕ gesetzt)');
    }
  }
}
function wachenTippZeigen(text) {
  const t = $('wachenTipp');
  t.textContent = text;
  t.hidden = false;
  t.classList.remove('neu'); void t.offsetWidth; t.classList.add('neu');
}

$('wachenRueck').addEventListener('click', () => {
  if (!wf || wf.vorbei || !wf.verlauf.length) return;
  wf.zustand = wf.verlauf.pop();
  wachenZeichnen();
});
$('wachenTippBtn').addEventListener('click', wachenTipp);
$('wachenLeeren').addEventListener('click', () => {
  if (!wf || wf.vorbei || !confirm('Alles vom Brett nehmen?')) return;
  wf.verlauf.push(wf.zustand.slice());
  wf.zustand.fill(0);
  wachenZeichnen();
});

krimiModus('wachen', {
  titel: 'Queens', untertitel: 'Die Wachen der Villa', kurz: 'Jeder Raum braucht eine Wache', icon: 'lampe',
  bild: () => Object.assign(document.createElement('span'), { className: 'w-symbol', innerHTML: WACHE_SVG }),
  lead: 'Heute Nacht darf niemand unbemerkt durch die Villa schleichen. Stell die Wachen so auf, dass jeder Raum bewacht ist.',
  regeln: [
    '<i class="mini" data-k-icon="raum-salon"></i> In <b>jedem Raum</b> steht genau <b>eine Wache</b>.',
    '<i class="mini" data-k-icon="alibi"></i> In <b>jeder Reihe</b> und <b>jeder Spalte</b> steht genau eine Wache.',
    '<i class="mini" data-k-icon="lampe"></i> Zwei Wachen dürfen sich <b>nie berühren</b> – auch nicht schräg.',
  ],
  anleitung: [
    'Feld <b>einmal</b> antippen = ✕ (hier steht keine Wache), <b>zweimal</b> = Wache, <b>dreimal</b> = wieder leer.',
    'Fang beim <b>kleinsten Raum</b> an – er hat die wenigsten Möglichkeiten.',
    'Liegt ein Raum ganz in einer Reihe (oder Spalte), steht die Wache dieser Reihe sicher in diesem Raum – der Rest der Reihe bekommt ✕.',
    'Rund um jede Wache (auch schräg) und in ihrer Reihe, Spalte und ihrem Raum darf keine weitere stehen – das <b>Laternenlicht</b> zeigt dir diese Felder.',
    'Mit <b>Rückgängig</b> nimmst du den letzten Zug zurück. Stehen alle Wachen richtig, leuchtet die ganze Villa.',
  ],
  stufen: { leicht: '5 × 5', mittel: '6 × 6', schwer: '7 × 7' },
  neuText: 'Neue Nacht', tagesName: 'Nacht des Tages',
  start: (o) => wachenStart(o),
});
