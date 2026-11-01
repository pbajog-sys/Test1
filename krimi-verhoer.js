// 🗣️ Das Verhör – Logikrätsel (Typ „Lügner und Ehrliche“).
// Jede verdächtige Person macht eine Aussage. Wer ehrlich ist, sagt die Wahrheit, wer lügt, sagt etwas Falsches.
//   Leicht:  genau eine Person lügt – und das ist der Täter
//   Mittel:  genau eine Person lügt – der Täter kann lügen, muss aber nicht
//   Schwer:  genau zwei Personen lügen
// Der Generator wählt Täter und Lügner, gibt jeder Person eine passende Aussage und prüft durch Ausprobieren
// aller Möglichkeiten, dass genau eine Lösung bleibt.
const VERHOER_STUFEN = {
  leicht: { n: 3, luegner: 1, taeterLuegt: true, regel: 'Genau eine Person lügt – und der Lügner ist der Täter.' },
  mittel: { n: 4, luegner: 1, taeterLuegt: false, regel: 'Genau eine Person lügt. Der Täter kann lügen – muss aber nicht.' },
  schwer: { n: 5, luegner: 2, taeterLuegt: false, regel: 'Genau zwei Personen lügen. Der Täter kann einer davon sein – oder auch nicht.' },
};

// Alle möglichen Aussagen von Person s über die Gruppe p[] – jede mit Text und Prüfung (Täter m, Lügner L)
function verhoerAussagen(p, s) {
  const A = [];
  const n = (i) => p[i].name;
  A.push({ text: 'Ich war es nicht.', f: (m) => m !== s });
  p.forEach((_, x) => {
    if (x === s) return;
    A.push({ text: n(x) + ' war es.', f: (m) => m === x });
    A.push({ text: n(x) + ' war es nicht.', f: (m) => m !== x });
    A.push({ text: n(x) + ' lügt.', f: (m, L) => L.has(x) });
    A.push({ text: n(x) + ' sagt die Wahrheit.', f: (m, L) => !L.has(x) });
    p.forEach((_, y) => {
      if (y > x && y !== s) A.push({ text: 'Es war ' + n(x) + ' oder ' + n(y) + '.', f: (m) => m === x || m === y });
    });
  });
  // Merkmale des Täters: Alter und Frau/Mann
  const alter = [...new Set(p.map((q) => q.alter))].sort((a, b) => a - b);
  for (let i = 1; i < alter.length; i++) {
    const grenze = Math.round((alter[i - 1] + alter[i]) / 2);
    A.push({ text: 'Der Täter ist älter als ' + grenze + '.', f: (m) => p[m].alter > grenze });
    A.push({ text: 'Der Täter ist jünger als ' + grenze + '.', f: (m) => p[m].alter < grenze });
  }
  if (p.some((q) => q.frau) && p.some((q) => !q.frau)) {
    A.push({ text: 'Es war eine Frau.', f: (m) => p[m].frau });
    A.push({ text: 'Es war ein Mann.', f: (m) => !p[m].frau });
  }
  return A;
}

// Alle Lügner-Mengen der passenden Größe
function luegnerMengen(n, k) {
  const out = [];
  const los = (start, akt) => {
    if (akt.length === k) { out.push(new Set(akt)); return; }
    for (let i = start; i < n; i++) los(i + 1, akt.concat(i));
  };
  los(0, []);
  return out;
}
// Welche (Täter, Lügner)-Paare passen zu allen Aussagen?
function verhoerLoesungen(fall) {
  const { p, aussagen, regel } = fall;
  const out = [];
  for (let m = 0; m < p.length; m++) {
    for (const L of luegnerMengen(p.length, regel.luegner)) {
      if (regel.taeterLuegt && !L.has(m)) continue;
      if (aussagen.every((a, s) => a.f(m, L) === !L.has(s))) out.push({ m, L });
    }
  }
  return out;
}

function erzeugeVerhoer(stufe, rnd, vorgabe = {}) {
  const regel = VERHOER_STUFEN[stufe];
  for (let versuch = 0; versuch < 4000; versuch++) {
    const p = vorgabe.personen ? vorgabe.personen.slice(0, regel.n) : mischen(VERDAECHTIGE, rnd).slice(0, regel.n);
    const m = vorgabe.moerder !== undefined ? p.findIndex((q) => q.id === vorgabe.moerder.id) : Math.floor(rnd() * p.length);
    if (m < 0) return null;
    let L;
    if (regel.taeterLuegt) L = new Set([m]);
    else L = new Set(mischen([...p.keys()], rnd).slice(0, regel.luegner));
    // jede Person: eine Aussage, die zu ehrlich/gelogen passt
    const aussagen = p.map((_, s) => {
      const passend = verhoerAussagen(p, s).filter((a) => a.f(m, L) === !L.has(s));
      return passend[Math.floor(rnd() * passend.length)];
    });
    if (aussagen.some((a) => !a)) continue;
    const fall = { stufe, p, m, L, aussagen, regel };
    const l = verhoerLoesungen(fall);
    if (l.length !== 1) continue;
    // zu leicht? Wenn jemand Ehrliches direkt „X war es.“ sagt und es nur einen Lügner gibt, ist es fast geschenkt
    const direkt = aussagen.filter((a, s) => !L.has(s) && /war es\.$/.test(a.text) && !/nicht/.test(a.text)).length;
    if (stufe !== 'leicht' && direkt > 0 && rnd() < 0.8) continue;
    fall.opfer = vorgabe.opfer || mischen(VERDAECHTIGE.filter((q) => !p.includes(q)), rnd)[0];
    return fall;
  }
  return null;
}

// Warum kann x nicht der Täter sein? (für den Tipp)
const zahlWort = (z) => ['keine', 'eine', 'zwei', 'drei', 'vier', 'fünf'][z] || String(z);
const taeterWort = (pe) => (pe.frau ? 'die Täterin' : 'der Täter');
function verhoerWarumNicht(fall, x) {
  const { p, aussagen, regel } = fall;
  const k = regel.luegner, wer = p[x].name + ' ' + taeterWort(p[x]);
  const liste = (idx) => idx.map((i) => p[i].name).join(idx.length > 2 ? ', ' : ' und ').replace(/, ([^,]*)$/, ' und $1');
  if (regel.taeterLuegt) {
    // Täter = einziger Lügner: wessen Aussage passt dann nicht?
    const L = new Set([x]);
    const falschEhrlich = aussagen.map((a, s) => (s !== x && !a.f(x, L) ? s : -1)).filter((s) => s >= 0);
    if (falschEhrlich.length) return 'Wenn ' + wer + ' wäre, wäre ' + p[x].name + ' die einzige Person, die lügt – aber dann wäre auch die Aussage von ' + liste(falschEhrlich) + ' falsch.';
    return 'Wenn ' + wer + ' wäre, müsste ' + p[x].name + ' lügen – aber der Satz „' + aussagen[x].text + '“ wäre dann wahr.';
  }
  // Welche Lügner-Mengen (beliebiger Größe) wären mit Täter x in sich stimmig?
  const stimmig = [];
  for (let g = 0; g <= p.length; g++) {
    for (const L of luegnerMengen(p.length, g)) {
      if (aussagen.every((a, s) => a.f(x, L) === !L.has(s))) stimmig.push(L);
    }
  }
  if (!stimmig.length) return 'Wenn ' + wer + ' wäre, würden sich die Aussagen widersprechen – egal, wer lügt.';
  stimmig.sort((a, b) => Math.abs(a.size - k) - Math.abs(b.size - k));
  const L = stimmig[0];
  const lu = L.size === 0 ? 'würde niemand lügen' : L.size === 1 ? 'würde nur ' + liste([...L]) + ' lügen' : 'müssten ' + zahlWort(L.size) + ' Personen lügen (' + liste([...L]) + ')';
  return 'Wenn ' + wer + ' wäre, ' + lu + ' – ' + (k === 1 ? 'es lügt aber genau eine Person.' : 'es lügen aber genau ' + zahlWort(k) + '.');
}

// ---------- Spiel ----------
let vf = null;   // { fall, notiz[] (0 –, 1 ehrlich, 2 lügt), raus:Set, hilfen, tag }

function verhoerStart({ stufe, seed, tag, fall, vorgabe }) {
  fall = fall || erzeugeVerhoer(stufe, zufallsGenerator(seed), vorgabe);
  if (!fall) return;
  vf = { fall, notiz: fall.p.map(() => 0), raus: new Set(), hilfen: 0, tag };
  $('verhoerRegel').textContent = fall.regel.regel;
  $('verhoerOpfer').replaceChildren(krimiFigur({ ...fall.opfer, opfer: true }, 'ko-bild'),
    Object.assign(document.createElement('span'), { textContent: fall.opfer.voll + ' wurde ermordet. ' + fall.p.length + ' Verdächtige werden verhört – wer war es?' }));
  $('verhoerTipp').hidden = true;
  krimiTeil('verhoer');
  verhoerZeichnen();
  krimiUhrStart();
}

function verhoerZeichnen() {
  const { fall, notiz, raus } = vf;
  const box = $('verhoerKarten');
  box.innerHTML = '';
  fall.p.forEach((pe, s) => {
    const k = document.createElement('div');
    k.className = 'vh-karte' + (raus.has(s) ? ' raus' : '') + (notiz[s] === 1 ? ' ehrlich' : notiz[s] === 2 ? ' luegt' : '');
    k.style.animationDelay = (s * 0.08) + 's';
    k.innerHTML = '<div class="vh-kopf"><span class="vh-bild"></span><div class="vh-name"><b></b><small></small></div></div>'
      + '<blockquote class="vh-aussage"></blockquote>'
      + '<div class="vh-knoepfe"><button type="button" class="vh-notiz"></button><button type="button" class="vh-anklage">Anklagen</button></div>';
    k.querySelector('.vh-bild').appendChild(krimiFigur(pe, 'vh-fig'));
    k.querySelector('b').textContent = pe.voll;
    k.querySelector('small').textContent = pe.alter + ' · ' + pe.beruf;
    k.querySelector('.vh-aussage').textContent = '„' + fall.aussagen[s].text + '“';
    const nb = k.querySelector('.vh-notiz');
    nb.textContent = ['Notiz: ?', '✓ ehrlich', '✗ lügt'][notiz[s]];
    nb.addEventListener('click', () => { vf.notiz[s] = (vf.notiz[s] + 1) % 3; verhoerZeichnen(); });
    const an = k.querySelector('.vh-anklage');
    an.disabled = raus.has(s) || vf.vorbei;
    an.addEventListener('click', () => verhoerAnklage(s, k));
    box.appendChild(k);
  });
}

function verhoerAnklage(s, karte) {
  if (vf.vorbei) return;
  const { fall } = vf;
  if (s === fall.m) {
    vf.vorbei = true;
    const luegner = [...fall.L].map((i) => fall.p[i].name);
    krimiGeschafft({
      modus: 'verhoer', stufe: fall.stufe, hilfen: vf.hilfen, tag: vf.tag,
      figur: krimiFigur(fall.p[s], 'krimi-taeter-fig'), war: 'Überführt im Verhör', name: fall.p[s].voll,
      text: (luegner.length === 1 ? luegner[0] + ' hat gelogen.' : luegner.join(' und ') + ' haben gelogen.') + ' ' + fall.p[s].beruf + ', ' + fall.p[s].alter + ' Jahre.',
      beweis: { moerder: fall.p[s], text: 'Im Verhör hat sich ' + fall.p[s].name + ' verraten.' },
    });
    return;
  }
  // falsch angeklagt: Erklärung zeigen, Person ausgrauen
  vf.hilfen++;
  vf.raus.add(s);
  karte.classList.remove('shake'); void karte.offsetWidth; karte.classList.add('shake');
  setTimeout(() => {
    verhoerZeichnen();
    verhoerTippZeigen('✗ Falsch angeklagt! ' + verhoerWarumNicht(fall, s));
  }, 380);
}

function verhoerTipp() {
  if (vf.vorbei) return;
  const { fall } = vf;
  const kandidaten = fall.p.map((_, i) => i).filter((i) => i !== fall.m && !vf.raus.has(i));
  if (!kandidaten.length) return verhoerTippZeigen('💡 Nur noch eine Person ist übrig – klag sie an!');
  vf.hilfen++;
  const x = kandidaten[0];
  vf.raus.add(x);
  verhoerZeichnen();
  verhoerTippZeigen('💡 ' + verhoerWarumNicht(fall, x));
}
function verhoerTippZeigen(text) {
  const t = $('verhoerTipp');
  t.textContent = text;
  t.hidden = false;
  t.classList.remove('neu'); void t.offsetWidth; t.classList.add('neu');
}
$('verhoerTippBtn').addEventListener('click', verhoerTipp);

krimiModus('verhoer', {
  titel: 'Knights & Knaves', untertitel: 'Das Verhör', kurz: 'Wer lügt – und wer war es?', icon: 'alibi',
  lead: 'Alle Verdächtigen sitzen im Verhörraum. Jede Person sagt einen Satz. Finde heraus, wer lügt – und wer der Täter ist.',
  regeln: [
    '<i class="mini" data-k-icon="alibi"></i> Wer <b>ehrlich</b> ist, sagt die Wahrheit. Wer <b>lügt</b>, sagt etwas Falsches.',
    '<i class="mini" data-k-icon="notizen"></i> Wie viele lügen, steht oben im Verhörraum.',
    '<i class="mini" data-k-icon="tatwaffe"></i> Klag die Person an, die es <b>war</b>. Eine falsche Anklage zählt als Tipp.',
  ],
  anleitung: [
    'Lies alle Aussagen. Im roten Kasten steht, <b>wie viele</b> lügen – und ob der Lügner der Täter ist.',
    '<b>Probier aus:</b> Nimm an, eine Person war es. Welche Aussagen wären dann wahr, welche falsch?',
    'Stimmt die Zahl der Lügner genau mit der Regel überein, hast du den Täter. Sonst war es jemand anderes.',
    'Sätze wie „Lara lügt“ sind besonders verräterisch: Entweder Lara lügt – oder wer das sagt, lügt selbst.',
    'Mit dem Notiz-Knopf merkst du dir, wen du für ehrlich (✓) oder für einen Lügner (✗) hältst.',
  ],
  stufen: { leicht: '3 Verdächtige', mittel: '4 Verdächtige', schwer: '5 · zwei lügen' },
  neuText: 'Neues Verhör', tagesName: 'Verhör des Tages',
  start: (o) => verhoerStart(o),
});
