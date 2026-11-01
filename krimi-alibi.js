// 🕰️ Alibi-Raster – Logikrätsel (Typ „Einstein-/Zebra-Rätsel“).
// Wer war wann wo – und mit welchem Gegenstand? Jede Person hat in jeder Kategorie genau einen Wert,
// und jeden Wert hat genau eine Person. Man füllt das Raster mit ✓ und ✕.
// Generator: erst eine Lösung, dann wahre Hinweise sammeln, bis alle anderen Möglichkeiten wegfallen,
// überflüssige wieder streichen. Ein Logik-Löser prüft, dass es ohne Raten geht, und bewertet die Schwierigkeit.
const ALIBI_STUFEN = {
  leicht: { n: 3, kats: ['raum', 'zeit'] },
  mittel: { n: 4, kats: ['raum', 'zeit', 'ding'] },
  schwer: { n: 4, kats: ['raum', 'zeit', 'ding'] },
};
const ALIBI_ZEITEN = ['20:00', '20:30', '21:00', '21:30', '22:00'];
const ALIBI_DINGE = [
  { name: 'Schlüssel', akk: 'den Schlüssel', dat: 'dem Schlüssel', icon: 'schluessel' },
  { name: 'Lupe', akk: 'die Lupe', dat: 'der Lupe', icon: 'lupe' },
  { name: 'Notizbuch', akk: 'das Notizbuch', dat: 'dem Notizbuch', icon: 'notizen' },
  { name: 'Brieföffner', akk: 'den Brieföffner', dat: 'dem Brieföffner', icon: 'tatwaffe' },
  { name: 'Pokal', akk: 'den Pokal', dat: 'dem Pokal', icon: 'erfolg' },
];
// Sprachbausteine je Kategorie
const ALIBI_SPRACHE = {
  raum: { satz: (w) => 'war ' + w.im, nicht: (w) => 'war nicht ' + w.im, wer: (w) => 'Wer ' + w.im + ' war', person: (w) => 'die Person ' + w.im, dativ: (w) => 'der Person ' + w.im },
  zeit: { satz: (w) => 'kam um ' + w.t + ' Uhr', nicht: (w) => 'kam nicht um ' + w.t + ' Uhr', wer: (w) => 'Wer um ' + w.t + ' Uhr kam', person: (w) => 'die Person, die um ' + w.t + ' Uhr kam', dativ: (w) => 'der Person, die um ' + w.t + ' Uhr kam' },
  ding: { satz: (w) => 'hatte ' + w.akk, nicht: (w) => 'hatte nicht ' + w.akk, wer: (w) => 'Wer ' + w.akk + ' hatte', person: (w) => 'die Person mit ' + w.dat, dativ: (w) => 'der Person mit ' + w.dat },
};
const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function permutationen(n) {
  const out = [];
  const los = (akt, frei) => {
    if (!frei.length) { out.push(akt); return; }
    frei.forEach((x, i) => los(akt.concat(x), frei.slice(0, i).concat(frei.slice(i + 1))));
  };
  los([], [...Array(n).keys()]);
  return out;
}
// Alle möglichen Lösungen: für jede Kategorie eine Zuordnung Person → Wert
function alleZuordnungen(n, k) {
  const P = permutationen(n);
  let out = [[]];
  for (let i = 0; i < k; i++) out = out.flatMap((a) => P.map((p) => a.concat([p])));
  return out;
}

// ---------- Hinweise ----------
function alibiHinweise(fall, rnd) {
  const { n, kats, werte, loesung, personen } = fall;
  const out = [];
  const K = kats.length;
  const zk = kats.indexOf('zeit');
  const wer = (k, v) => ALIBI_SPRACHE[kats[k]].wer(werte[k][v]);
  const satz = (k, v) => ALIBI_SPRACHE[kats[k]].satz(werte[k][v]);
  const nicht = (k, v) => ALIBI_SPRACHE[kats[k]].nicht(werte[k][v]);
  const pers = (k, v) => ALIBI_SPRACHE[kats[k]].person(werte[k][v]);
  const dativ = (k, v) => ALIBI_SPRACHE[kats[k]].dativ(werte[k][v]);
  const von = (A, k, v) => A[k].indexOf(v);   // welche Person hat Wert v?
  for (let p = 0; p < n; p++) {
    for (let k = 0; k < K; k++) {
      const v = loesung[k][p];
      out.push({ art: 'pos', kats: [k], text: personen[p].name + ' ' + satz(k, v) + '.', f: (A) => A[k][p] === v });
      for (let w = 0; w < n; w++) if (w !== v) out.push({ art: 'neg', kats: [k], text: personen[p].name + ' ' + nicht(k, w) + '.', f: (A) => A[k][p] !== w });
    }
  }
  // Zusammenhänge zwischen Kategorien
  for (let k1 = 0; k1 < K; k1++) for (let k2 = 0; k2 < K; k2++) {
    if (k1 === k2) continue;
    for (let v1 = 0; v1 < n; v1++) {
      const p = loesung[k1].indexOf(v1), v2 = loesung[k2][p];
      out.push({ art: 'kreuz', kats: [k1, k2], text: wer(k1, v1) + ', ' + satz(k2, v2) + '.', f: (A) => A[k2][von(A, k1, v1)] === v2 });
      for (let w = 0; w < n; w++) if (w !== v2 && rnd() < 0.5) out.push({ art: 'kreuzNicht', kats: [k1, k2], text: wer(k1, v1) + ', ' + nicht(k2, w) + '.', f: (A) => A[k2][von(A, k1, v1)] !== w });
    }
  }
  // Reihenfolge der Ankunft
  if (zk >= 0) {
    // Subjekte: Personen oder „die Person im Salon / mit dem Schlüssel“
    const subj = [];
    for (let p = 0; p < n; p++) subj.push({ name: personen[p].name, dat: personen[p].name, kats: [zk], wer: (A) => p });
    kats.forEach((kat, k) => { if (k !== zk) for (let v = 0; v < n; v++) subj.push({ name: pers(k, v), dat: dativ(k, v), kats: [zk, k], wer: (A) => von(A, k, v) }); });
    const zeit = (A, s) => A[zk][s.wer(A)];
    const lz = (s) => loesung[zk][s.wer(loesung)];
    for (const a of subj) for (const b of subj) {
      if (a === b || a.wer(loesung) === b.wer(loesung)) continue;
      const kk = [...new Set(a.kats.concat(b.kats))];
      if (lz(a) < lz(b) && rnd() < 0.35) out.push({ art: 'frueher', kats: kk, text: gross(a.name) + ' kam früher als ' + b.name + '.', f: (A) => zeit(A, a) < zeit(A, b) });
      if (lz(a) === lz(b) + 1 && rnd() < 0.6) out.push({ art: 'danach', kats: kk, text: gross(a.name) + ' kam eine halbe Stunde nach ' + b.dat + '.', f: (A) => zeit(A, a) === zeit(A, b) + 1 });
    }
    for (const a of subj) {
      if (lz(a) === 0) out.push({ art: 'erste', kats: a.kats, text: gross(a.name) + ' kam als Erstes.', f: (A) => zeit(A, a) === 0 });
      if (lz(a) === n - 1) out.push({ art: 'letzte', kats: a.kats, text: gross(a.name) + ' kam als Letztes.', f: (A) => zeit(A, a) === n - 1 });
    }
  }
  // Entweder – oder (genau eins davon stimmt)
  for (let p = 0; p < n; p++) {
    for (let k1 = 0; k1 < K; k1++) for (let k2 = k1 + 1; k2 < K; k2++) {
      if (rnd() < 0.5) continue;
      const wahr = rnd() < 0.5 ? 1 : 2;
      const v1 = wahr === 1 ? loesung[k1][p] : (loesung[k1][p] + 1 + Math.floor(rnd() * (n - 1))) % n;
      const v2 = wahr === 2 ? loesung[k2][p] : (loesung[k2][p] + 1 + Math.floor(rnd() * (n - 1))) % n;
      out.push({ art: 'oder', kats: [k1, k2], text: personen[p].name + ' ' + satz(k1, v1) + ' oder ' + satz(k2, v2) + ' – aber nicht beides.', f: (A) => (A[k1][p] === v1) !== (A[k2][p] === v2) });
    }
  }
  return out;
}

// ---------- Logik-Löser ----------
// Zustand: kand[k][p] = Menge möglicher Werte
function alibiLogik(fall, hinweise, fest = []) {
  const { n, kats } = fall;
  const K = kats.length, P = permutationen(n);
  const kand = kats.map(() => [...Array(n)].map(() => new Set([...Array(n).keys()])));
  fest.forEach(([k, p, v]) => { kand[k][p] = new Set([v]); });
  const schritte = [];
  const wname = (k, v) => { const w = fall.werte[k][v]; return w.name || (w.t + ' Uhr'); };
  const kopie = () => kand.map((kk) => kk.map((s) => new Set(s)));
  const zurueck = (c) => c.forEach((kk, k) => kk.forEach((s, p) => { kand[k][p] = s; }));
  const widerspruch = () => kand.some((kk) => kk.some((s) => s.size === 0) || [...Array(n).keys()].some((v) => !kk.some((s) => s.has(v))));
  const fertig = () => kand.every((kk) => kk.every((s) => s.size === 1));
  // Stufe 1: Raster-Logik (ein Wert pro Person und Person pro Wert)
  const stufe1 = () => {
    for (let k = 0; k < K; k++) {
      for (let p = 0; p < n; p++) {
        if (kand[k][p].size !== 1) continue;
        const v = [...kand[k][p]][0];
        const weg = [];
        for (let q = 0; q < n; q++) if (q !== p && kand[k][q].delete(v)) weg.push(q);
        if (weg.length) return { stufe: 1, k, p, v, text: fall.personen[p].name + ' hat sicher „' + wname(k, v) + '“ – also niemand sonst.' };
      }
      for (let v = 0; v < n; v++) {
        const wer = [...Array(n).keys()].filter((q) => kand[k][q].has(v));
        if (wer.length === 1 && kand[k][wer[0]].size > 1) {
          kand[k][wer[0]] = new Set([v]);
          return { stufe: 1, k, p: wer[0], v, setzt: true, text: 'Nur ' + fall.personen[wer[0]].name + ' kann noch „' + wname(k, v) + '“ haben.' };
        }
      }
    }
    return null;
  };
  // Stufe 2: ein Hinweis für sich – alle damit verträglichen Möglichkeiten durchgehen
  const stufe2 = () => {
    for (const h of hinweise) {
      const ks = h.kats;
      let kombis = [[]];
      for (const k of ks) kombis = kombis.flatMap((c) => P.filter((perm) => perm.every((v, p) => kand[k][p].has(v))).map((perm) => c.concat([perm])));
      const gestuetzt = ks.map(() => [...Array(n)].map(() => new Set()));
      const A = [];
      for (const c of kombis) {
        ks.forEach((k, i) => { A[k] = c[i]; });
        if (!h.f(A)) continue;
        ks.forEach((k, i) => c[i].forEach((v, p) => gestuetzt[i][p].add(v)));
      }
      let weg = 0, wer = -1, welche = -1;
      ks.forEach((k, i) => { for (let p = 0; p < n; p++) for (const v of [...kand[k][p]]) if (!gestuetzt[i][p].has(v)) { kand[k][p].delete(v); weg++; wer = p; welche = k; } });
      if (weg) return { stufe: 2, p: wer, k: welche, text: 'Wegen „' + h.text.replace(/\.$/, '') + '“ ' + (weg === 1 ? 'fällt eine Möglichkeit weg.' : 'fallen ' + weg + ' Möglichkeiten weg.') };
    }
    return null;
  };
  const propagiere = () => { for (;;) { if (widerspruch()) return false; if (!stufe1() && !stufe2()) return true; } };
  const stufe3 = () => {
    for (let k = 0; k < K; k++) for (let p = 0; p < n; p++) {
      if (kand[k][p].size < 2) continue;
      for (const v of [...kand[k][p]]) {
        const c = kopie();
        kand[k][p] = new Set([v]);
        const ok = propagiere();
        zurueck(c);
        if (!ok) {
          kand[k][p].delete(v);
          return { stufe: 3, p, text: 'Angenommen, ' + fall.personen[p].name + ' hätte „' + wname(k, v) + '“ – dann ginge es nicht mehr auf. Also nicht.' };
        }
      }
    }
    return null;
  };
  while (!fertig()) {
    if (widerspruch()) return { geloest: false, schritte, kand };
    const s = stufe1() || stufe2() || stufe3();
    if (!s) return { geloest: false, schritte, kand };
    schritte.push(s);
    if (schritte.length > 300) return { geloest: false, schritte, kand };
  }
  const geloest = kand.every((kk, k) => kk.every((s, p) => [...s][0] === fall.loesung[k][p]));
  return { geloest, schritte, kand };
}

const ALIBI_ZIEL = { leicht: (b) => b.s3 === 0, mittel: (b) => b.s3 === 0 && b.s2 >= 4, schwer: (b) => b.s3 >= 1 };
function erzeugeAlibi(stufe, rnd, vorgabe = {}) {
  const { n, kats } = ALIBI_STUFEN[stufe];
  const alle = alleZuordnungen(n, kats.length);
  let notfall = null;
  for (let versuch = 0; versuch < 200; versuch++) {
    const personen = vorgabe.personen ? vorgabe.personen.slice(0, n) : mischen(VERDAECHTIGE, rnd).slice(0, n);
    const werte = kats.map((kat) => (kat === 'raum' ? mischen(RAEUME, rnd).slice(0, n)
      : kat === 'zeit' ? ALIBI_ZEITEN.slice(0, n).map((t) => ({ t }))
        : (vorgabe.moerder ? [ALIBI_DINGE[3]].concat(mischen(ALIBI_DINGE.filter((d) => d !== ALIBI_DINGE[3]), rnd).slice(0, n - 1)) : mischen(ALIBI_DINGE, rnd).slice(0, n))));
    const P = permutationen(n);
    const loesung = kats.map(() => P[Math.floor(rnd() * P.length)].slice());
    // Ermittlungsakte: der Täter hatte den Brieföffner
    if (vorgabe.moerder) {
      const dk = kats.indexOf('ding'), m = personen.findIndex((q) => q.id === vorgabe.moerder.id);
      const bf = werte[dk].indexOf(ALIBI_DINGE[3]);
      const wer = loesung[dk].indexOf(bf);
      [loesung[dk][m], loesung[dk][wer]] = [loesung[dk][wer], loesung[dk][m]];
    }
    const fall = { stufe, n, kats, werte, loesung, personen };
    const pool = mischen(alibiHinweise(fall, rnd), rnd);
    // direkte Hinweise („Elena war im Salon.“) machen es leicht – in schwer seltener nehmen
    if (stufe !== 'leicht') pool.sort((a, b) => (a.art === 'pos') - (b.art === 'pos') + (rnd() - 0.5) * (stufe === 'schwer' ? 0.4 : 1.2));
    let rest = alle;
    const hinweise = [];
    for (const h of pool) {
      const neu = rest.filter((A) => h.f(A));
      if (neu.length === rest.length) continue;   // bringt nichts
      hinweise.push(h); rest = neu;
      if (rest.length === 1) break;
    }
    if (rest.length !== 1) continue;
    // überflüssige streichen
    for (const h of mischen(hinweise, rnd)) {
      const ohne = hinweise.filter((x) => x !== h);
      if (alle.filter((A) => ohne.every((x) => x.f(A))).length === 1) hinweise.splice(hinweise.indexOf(h), 1);
    }
    const e = alibiLogik(fall, hinweise);
    if (!e.geloest) continue;
    const s2 = e.schritte.filter((x) => x.stufe === 2).length, s3 = e.schritte.filter((x) => x.stufe === 3).length;
    fall.hinweise = hinweise;
    fall.bewertung = { s2, s3, denkschritte: e.schritte.length, sterne: s3 >= 2 ? 3 : s3 === 1 || s2 >= 7 ? 2 : 1 };
    if (ALIBI_ZIEL[stufe](fall.bewertung)) return fall;
    if (!notfall || (stufe === 'schwer' ? s3 > notfall.bewertung.s3 : s3 < notfall.bewertung.s3)) notfall = fall;
    if (versuch > 60 && notfall) return notfall;
  }
  return notfall;
}

// ---------- Spiel ----------
let af = null;   // { fall, mark[k][p][v] (0 leer, 1 ✕, 2 ✓), erledigt:Set, hilfen, tag }

function alibiStart({ stufe, seed, tag, fall, vorgabe }) {
  fall = fall || erzeugeAlibi(stufe, zufallsGenerator(seed), vorgabe);
  if (!fall) return;
  af = { fall, mark: fall.kats.map(() => fall.personen.map(() => new Array(fall.n).fill(0))), erledigt: new Set(), hilfen: 0, tag };
  krimiSterne($('alibiSterne'), fall.bewertung);
  $('alibiTipp').hidden = true;
  krimiTeil('alibi');
  alibiZeichnen();
  krimiUhrStart();
}

function alibiZeichnen() {
  const { fall, mark } = af, { n, kats, werte, personen } = fall;
  const t = $('alibiRaster');
  t.innerHTML = '';
  t.style.setProperty('--spalten', n * kats.length);
  // Kopf: Kategorien und Werte
  const kopf1 = document.createElement('tr');
  kopf1.appendChild(document.createElement('th'));
  kats.forEach((kat, k) => {
    const th = document.createElement('th');
    th.colSpan = n;
    th.className = 'ar-kat';
    th.textContent = { raum: 'Raum', zeit: 'Zeit', ding: 'Ding' }[kat];
    kopf1.appendChild(th);
  });
  const kopf2 = document.createElement('tr');
  kopf2.appendChild(document.createElement('th'));
  kats.forEach((kat, k) => werte[k].forEach((w, v) => {
    const th = document.createElement('th');
    th.className = 'ar-wert' + (v === 0 ? ' ar-block' : '');
    if (kat === 'zeit') { const [h, m] = w.t.split(':'); th.innerHTML = '<span class="ar-zeit"><b>' + h + '</b><small>:' + m + '</small></span>'; }
    else th.appendChild(krimiIcon(w.icon || 'raum-salon', 'ar-icon'));
    th.title = w.name || w.t;
    kopf2.appendChild(th);
  }));
  const thead = document.createElement('thead');
  thead.append(kopf1, kopf2);
  t.appendChild(thead);
  const tbody = document.createElement('tbody');
  personen.forEach((pe, p) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.className = 'ar-person';
    th.append(krimiFigur(pe, 'ar-fig'), Object.assign(document.createElement('span'), { textContent: pe.name }));
    tr.appendChild(th);
    kats.forEach((kat, k) => werte[k].forEach((w, v) => {
      const td = document.createElement('td');
      td.className = 'ar-zelle' + (v === 0 ? ' ar-block' : '');
      const m = mark[k][p][v];
      // automatisch ✕: Person hat schon ✓ in dieser Kategorie, oder Wert hat schon eine andere Person
      const auto = m === 0 && (mark[k][p].some((x, w2) => x === 2 && w2 !== v) || personen.some((_, q) => q !== p && mark[k][q][v] === 2));
      td.innerHTML = m === 2 ? '<span class="ar-ja">✓</span>' : m === 1 ? '<span class="ar-nein">✕</span>' : auto ? '<span class="ar-nein auto">✕</span>' : '';
      td.addEventListener('click', () => { if (af.vorbei) return; mark[k][p][v] = (m + 1) % 3; $('alibiTipp').hidden = true; alibiZeichnen(); alibiPruefen(); });
      tr.appendChild(td);
    }));
    tbody.appendChild(tr);
  });
  t.appendChild(tbody);
  // Hinweise zum Abhaken
  const liste = $('alibiHinweise');
  liste.innerHTML = '';
  fall.hinweise.forEach((h, i) => {
    const li = document.createElement('li');
    li.textContent = h.text;
    if (af.erledigt.has(i)) li.className = 'ok';
    li.addEventListener('click', () => { if (af.erledigt.has(i)) af.erledigt.delete(i); else af.erledigt.add(i); alibiZeichnen(); });
    liste.appendChild(li);
  });
}

function alibiPruefen() {
  const { fall, mark } = af;
  const ok = fall.kats.every((_, k) => fall.personen.every((_, p) => mark[k][p].filter((x) => x === 2).length === 1 && mark[k][p][fall.loesung[k][p]] === 2));
  if (!ok) return;
  af.vorbei = true;
  const zk = fall.kats.indexOf('zeit'), dk = fall.kats.indexOf('ding');
  const bf = dk >= 0 ? fall.werte[dk].findIndex((d) => d.name === 'Brieföffner') : -1;
  const mitWaffe = bf >= 0 ? fall.loesung[dk].indexOf(bf) : -1;
  const p = mitWaffe >= 0 ? mitWaffe : fall.loesung[zk].indexOf(fall.n - 1);
  const raum = fall.werte[fall.kats.indexOf('raum')][fall.loesung[fall.kats.indexOf('raum')][p]];
  const zeit = fall.werte[zk][fall.loesung[zk][p]].t;
  setTimeout(() => krimiGeschafft({
    modus: 'alibi', stufe: fall.stufe, hilfen: af.hilfen, tag: af.tag,
    figur: krimiFigur(fall.personen[p], 'krimi-taeter-fig'),
    war: mitWaffe >= 0 ? 'Den Brieföffner hatte' : 'Als Letztes kam',
    name: fall.personen[p].voll,
    text: fall.personen[p].name + ' war um ' + zeit + ' Uhr ' + raum.im + '. Alle Alibis sind geklärt.',
    beweis: { moerder: mitWaffe >= 0 ? fall.personen[p] : null, text: fall.personen[p].name + ' hatte den Brieföffner und kam um ' + zeit + ' Uhr an – zuerst ' + raum.im + '.' },
  }), 400);
}

function alibiTipp() {
  if (af.vorbei) return;
  const { fall, mark } = af;
  af.hilfen++;
  // falsches ✓ oder ✕ zuerst korrigieren
  for (let k = 0; k < fall.kats.length; k++) for (let p = 0; p < fall.n; p++) for (let v = 0; v < fall.n; v++) {
    const richtig = fall.loesung[k][p] === v;
    if ((mark[k][p][v] === 2 && !richtig) || (mark[k][p][v] === 1 && richtig)) {
      mark[k][p][v] = 0;
      alibiZeichnen();
      return alibiTippZeigen('🕵️ Da stimmt etwas nicht: Bei ' + fall.personen[p].name + ' war ein falsches ' + (richtig ? '✕' : '✓') + ' – ich habe es entfernt.');
    }
  }
  // Logik-Löser ab den richtigen ✓ weiterlaufen lassen
  const fest = [];
  fall.kats.forEach((_, k) => fall.personen.forEach((_, p) => { const v = mark[k][p].indexOf(2); if (v >= 0) fest.push([k, p, v]); }));
  const { schritte } = alibiLogik(fall, fall.hinweise, fest);
  // erster Denkschritt, der eine Person betrifft, bei der noch ein ✓ fehlt – genau dort ein ✓ setzen
  const offen = (p) => fall.kats.some((_, k) => !mark[k][p].includes(2));
  const offenIn = (x) => x.p >= 0 && (x.k >= 0 ? !mark[x.k][x.p].includes(2) : offen(x.p));
  const s = schritte.find((x) => x.stufe > 1 && offenIn(x)) || schritte.find(offenIn);
  if (!s) {
    // nichts mehr zu folgern – einfach das nächste offene ✓ setzen
    for (let k = 0; k < fall.kats.length; k++) for (let p = 0; p < fall.n; p++) {
      if (mark[k][p].includes(2)) continue;
      mark[k][p][fall.loesung[k][p]] = 2;
      alibiZeichnen();
      alibiTippZeigen('💡 Für ' + fall.personen[p].name + ' bleibt hier nur noch eine Möglichkeit.');
      return alibiPruefen();
    }
    return;
  }
  const k = s.k >= 0 && !mark[s.k][s.p].includes(2) ? s.k : fall.kats.findIndex((_, kk) => !mark[kk][s.p].includes(2));
  mark[k][s.p][fall.loesung[k][s.p]] = 2;
  alibiZeichnen();
  alibiTippZeigen('💡 ' + s.text);
  alibiPruefen();
}
function alibiTippZeigen(text) {
  const t = $('alibiTipp');
  t.textContent = text;
  t.hidden = false;
  t.classList.remove('neu'); void t.offsetWidth; t.classList.add('neu');
}
$('alibiTippBtn').addEventListener('click', alibiTipp);
$('alibiLeeren').addEventListener('click', () => {
  if (!af || af.vorbei || !confirm('Alle ✓ und ✕ löschen?')) return;
  af.mark.forEach((kk) => kk.forEach((r) => r.fill(0)));
  alibiZeichnen();
});

krimiModus('alibi', {
  titel: 'Alibi-Raster', kurz: 'Wer war wann wo?', icon: 'uhr',
  lead: 'Jede Person war zu einer anderen Zeit in einem anderen Raum – mit einem anderen Gegenstand. Kläre alle Alibis!',
  regeln: [
    '<i class="mini" data-k-icon="richtig"></i> Jede Person hat in jeder Spalte-Gruppe <b>genau ein ✓</b> – und jeder Wert gehört <b>genau einer</b> Person.',
    '<i class="mini" data-k-icon="notizen"></i> Alle <b>Hinweise</b> stimmen. Tippe einen Hinweis an, um ihn abzuhaken.',
    '<i class="mini" data-k-icon="falsch"></i> Feld antippen: einmal ✕, zweimal ✓, dreimal leer. Graue ✕ ergeben sich von selbst.',
  ],
  stufen: { leicht: '3 Personen', mittel: '4 Personen', schwer: '4 · knifflig' },
  neuText: 'Neue Alibis', tagesName: 'Alibis des Tages',
  start: (o) => alibiStart(o),
});
