// 📁 Ermittlungsakte: ein Fall pro Woche in vier Kapiteln und einer Anklage.
// Alle Kapitel gehören zum selben Fall – gleiches Opfer, gleiche vier Verdächtige, gleicher Täter:
//   1 Die Villa abriegeln (Wachen) · 2 Die Verhöre (Täter verrät sich) · 3 Die Alibis (Täter hatte den Brieföffner)
//   4 Der Tatort (Täter war allein mit dem Opfer) · Finale: Anklage
// Der Fall entsteht aus dem Seed der Woche – die ganze Familie ermittelt im selben Fall.
const AKTE_KAPITEL = [
  { id: 'wachen', titel: 'Die Villa abriegeln', text: 'Niemand darf das Haus verlassen. Stell die Wachen auf.', icon: 'lampe' },
  { id: 'verhoer', titel: 'Die Verhöre', text: 'Die vier Verdächtigen werden befragt. Einer lügt.', icon: 'alibi' },
  { id: 'alibi', titel: 'Die Alibis', text: 'Wer war wann wo – und wer hatte den Brieföffner?', icon: 'uhr' },
  { id: 'mord', titel: 'Der Tatort', text: 'Rekonstruiere, wer wo stand, als es passierte.', icon: 'tatwaffe' },
];

function isoWoche(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const tag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - tag);
  const jahr = t.getUTCFullYear();
  const woche = Math.ceil(((t - Date.UTC(jahr, 0, 1)) / 86400000 + 1) / 7);
  return { jahr, woche, id: jahr + '-W' + String(woche).padStart(2, '0') };
}

// Der Fall einer Akte – deterministisch aus dem Seed; Kapitel werden erst bei Bedarf erzeugt
const akteCache = {};
function akteFall(seed) {
  if (akteCache[seed]) return akteCache[seed];
  const mord = erzeugeFall('mittel', zufallsGenerator(seed + ':tatort'));
  const verdaechtige = mord.personen.slice(0, mord.personen.length - 1);
  const fall = { seed, mord, verdaechtige, opfer: mord.personen[mord.personen.length - 1], moerder: mord.personen[mord.moerder], kapitel: {} };
  akteCache[seed] = fall;
  return fall;
}
function akteKapitelFall(fall, id) {
  if (fall.kapitel[id]) return fall.kapitel[id];
  const rnd = zufallsGenerator(fall.seed + ':' + id);
  const vorgabe = { personen: fall.verdaechtige, moerder: fall.moerder, opfer: fall.opfer };
  fall.kapitel[id] = id === 'wachen' ? erzeugeWachen('mittel', rnd)
    : id === 'verhoer' ? erzeugeVerhoer('mittel', rnd, vorgabe)
      : id === 'alibi' ? erzeugeAlibi('mittel', rnd, vorgabe)
        : fall.mord;
  return fall.kapitel[id];
}

// Fortschritt je Akte (Seed) in st.akten; aktiv ist eine offene Bonus-Akte, sonst die Akte der Woche
function akteStand() {
  const st = kStand();
  st.akten = st.akten || {};
  const w = isoWoche();
  const wochenSeed = 'akte:' + w.id;
  const seed = st.akteBonus && st.akten[st.akteBonus] && !st.akten[st.akteBonus].geloest ? st.akteBonus : wochenSeed;
  if (!st.akten[seed]) {
    st.akten[seed] = { seed, nr: w.woche + '/' + w.jahr, erledigt: {}, fehler: 0 };
    // alte Akten aufräumen (die letzten 12 bleiben)
    const keys = Object.keys(st.akten);
    keys.slice(0, Math.max(0, keys.length - 12)).forEach((k) => { if (k !== seed) delete st.akten[k]; });
    saveJson(KRIMI_KEY, st);
  }
  return st.akten[seed];
}
function akteSpeichern(a) { const st = kStand(); st.akten = st.akten || {}; st.akten[a.seed] = a; saveJson(KRIMI_KEY, st); }
const akteFertig = (a) => AKTE_KAPITEL.every((k) => a.erledigt[k.id]);

// ---------- Karte in der Krimi-Zentrale ----------
function akteKarteZeigen() {
  const a = akteStand();
  const fall = akteFall(a.seed);
  const zahl = AKTE_KAPITEL.filter((k) => a.erledigt[k.id]).length;
  const box = $('krimiAkteKarte');
  box.innerHTML = '';
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'ak-karte' + (a.geloest ? ' zu' : '');
  b.innerHTML = '<span class="ak-reiter">AKTE ' + a.nr + '</span>'
    + '<span class="ak-foto"></span>'
    + '<span class="ak-text"><span class="ak-klein">' + (a.bonus ? 'Bonus-Akte' : 'Ermittlungsakte der Woche') + '</span>'
    + '<span class="ak-titel"></span><span class="ak-sub"></span>'
    + '<span class="ak-punkte">' + AKTE_KAPITEL.map((k) => '<i class="' + (a.erledigt[k.id] ? 'an' : '') + '"></i>').join('') + '<i class="' + (a.geloest ? 'an' : '') + '"></i></span></span>'
    + '<span class="ak-stempel">' + (a.geloest ? 'Gelöst' : 'Vertraulich') + '</span>';
  b.querySelector('.ak-foto').appendChild(krimiFigur({ ...fall.opfer, opfer: true }, 'ak-opfer'));
  b.querySelector('.ak-titel').textContent = 'Der Fall ' + fall.opfer.voll;
  b.querySelector('.ak-sub').textContent = a.geloest ? 'Abgeschlossen – ' + fall.moerder.voll + ' wurde überführt.'
    : zahl ? zahl + ' von 4 Kapiteln gelöst – weiter ermitteln!' : 'Ein neuer Fall wartet auf dich.';
  b.addEventListener('click', akteZeigen);
  box.appendChild(b);
}

// ---------- Die Akte ----------
function akteZeigen() {
  const a = akteStand();
  const fall = akteFall(a.seed);
  kAktiv = { teil: 'akte', modus: null, akte: null };
  const box = $('krimi-akte');
  box.innerHTML = '';
  // Deckblatt
  const deck = document.createElement('div');
  deck.className = 'akte-deckblatt';
  deck.innerHTML = '<div class="akte-kopf"><span>AKTE ' + a.nr + '</span><span class="akte-geheim">Streng vertraulich</span></div>'
    + '<div class="akte-opfer"><span class="akte-polaroid"></span><div><h2></h2><p class="akte-story"></p></div></div>'
    + '<div class="akte-verdacht"><b>Im Haus waren:</b><div class="akte-leute"></div></div>';
  deck.querySelector('.akte-polaroid').appendChild(krimiFigur({ ...fall.opfer, opfer: true }, 'akte-opferbild'));
  deck.querySelector('h2').textContent = 'Der Fall ' + fall.opfer.voll;
  deck.querySelector('.akte-story').textContent = fall.opfer.voll + ' (' + fall.opfer.beruf + ') wurde in der Nacht in der Villa tot aufgefunden. Vier Personen waren im Haus. Eine von ihnen war es.';
  fall.verdaechtige.forEach((pe) => {
    const d = document.createElement('div');
    d.className = 'akte-person';
    d.append(krimiFigur(pe, 'akte-pbild'), Object.assign(document.createElement('span'), { textContent: pe.name }));
    deck.querySelector('.akte-leute').appendChild(d);
  });
  box.appendChild(deck);
  // Kapitel
  let offenGefunden = false;
  AKTE_KAPITEL.forEach((k, i) => {
    const fertig = !!a.erledigt[k.id];
    const dran = !fertig && !offenGefunden;
    if (dran) offenGefunden = true;
    const c = document.createElement('div');
    c.className = 'akte-kapitel' + (fertig ? ' fertig' : dran ? ' dran' : ' zu');
    c.innerHTML = '<span class="akk-nr">' + (i + 1) + '</span><span class="akk-icon"></span>'
      + '<div class="akk-text"><b></b><small></small>' + (fertig ? '<p class="akk-beweis"></p>' : '') + '</div>'
      + '<span class="akk-status">' + (fertig ? '✓' : dran ? '▶' : '🔒') + '</span>';
    c.querySelector('.akk-icon').appendChild(krimiIcon(k.icon));
    c.querySelector('b').textContent = 'Kapitel ' + (i + 1) + ': ' + k.titel;
    c.querySelector('small').textContent = k.text;
    if (fertig) c.querySelector('.akk-beweis').textContent = a.erledigt[k.id];
    if (dran || fertig) c.addEventListener('click', () => akteKapitelStarten(k.id));
    box.appendChild(c);
  });
  // Finale
  const fin = document.createElement('div');
  fin.className = 'akte-finale' + (akteFertig(a) ? '' : ' zu');
  if (a.geloest) {
    fin.innerHTML = '<div class="akte-zu-stempel">Fall abgeschlossen</div><p class="akte-schluss"></p>';
    fin.querySelector('.akte-schluss').textContent = fall.moerder.voll + ' (' + fall.moerder.beruf + ') wurde überführt. Die nächste Akte gibt es am Montag.';
    const bonus = document.createElement('button');
    bonus.type = 'button';
    bonus.className = 'btn secondary';
    bonus.textContent = 'Bonus-Akte (neuer Fall)';
    bonus.addEventListener('click', () => {
      const st = kStand(), seed = 'akte:bonus:' + Date.now();
      st.akten = st.akten || {};
      st.akten[seed] = { seed, nr: 'B-' + String(Date.now()).slice(-4), bonus: true, erledigt: {}, fehler: 0 };
      st.akteBonus = seed;
      saveJson(KRIMI_KEY, st);
      akteZeigen();
    });
    fin.appendChild(bonus);
  } else {
    fin.innerHTML = '<h3>⚖️ Die Anklage</h3><p>' + (akteFertig(a) ? 'Alle Beweise liegen vor. Wen klagst du an?' : 'Löse erst alle vier Kapitel.') + '</p><div class="akte-anklage"></div><p class="akte-fehler" id="akteFehler"></p>';
    if (akteFertig(a)) {
      fall.verdaechtige.forEach((pe) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'akte-wahl';
        b.append(krimiFigur(pe, 'akte-wbild'), Object.assign(document.createElement('span'), { textContent: pe.name }));
        b.addEventListener('click', () => akteAnklage(pe, b));
        fin.querySelector('.akte-anklage').appendChild(b);
      });
    }
  }
  box.appendChild(fin);
  krimiTeil('akte');
}

function akteKapitelStarten(id) {
  const a = akteStand();
  const fall = akteFall(a.seed);
  const kf2 = akteKapitelFall(fall, id);
  kAktiv = { teil: 'akte', modus: id, akte: { seed: a.seed, kapitel: id } };
  KRIMI_MODI[id].start({ stufe: 'mittel', fall: kf2, tag: false });
  kAktiv.akte = { seed: a.seed, kapitel: id };   // start() setzt den Teil, die Akte bleibt gemerkt
}

// wird von krimiGeschafft aufgerufen
function akteKapitelFertig(e) {
  const a = akteStand();
  const id = kAktiv.akte.kapitel;
  if (!a.erledigt[id]) {
    a.erledigt[id] = (e.beweis && e.beweis.text) || 'Kapitel gelöst.';
    akteSpeichern(a);
  }
}

function akteAnklage(pe, knopf) {
  const a = akteStand();
  const fall = akteFall(a.seed);
  if (pe.id === fall.moerder.id) {
    a.geloest = true;
    akteSpeichern(a);
    const st = kStand(); st.aktenGeloest = (st.aktenGeloest || 0) + 1; saveJson(KRIMI_KEY, st);
    kAktiv = { teil: 'akte', modus: 'akte', akte: null };
    krimiGeschafft({
      modus: 'akte', stufe: 'mittel', hilfen: a.fehler, stempel: 'Fall abgeschlossen',
      figur: krimiFigur(pe, 'krimi-taeter-fig'), war: 'Angeklagt und überführt', name: pe.voll,
      text: pe.beruf + ' · ' + [a.erledigt.verhoer, a.erledigt.alibi, a.erledigt.mord].filter(Boolean).join(' '),
      zeitText: a.fehler ? '⚖️ ' + a.fehler + (a.fehler === 1 ? ' falsche Anklage' : ' falsche Anklagen') : '⚖️ Beim ersten Versuch überführt!',
    });
    $('krimiNochmal').textContent = 'Zur Akte';
    return;
  }
  a.fehler = (a.fehler || 0) + 1;
  akteSpeichern(a);
  knopf.classList.remove('shake'); void knopf.offsetWidth; knopf.classList.add('shake');
  knopf.disabled = true;
  $('akteFehler').textContent = pe.name + ' hat ein Alibi – die Beweise sprechen gegen jemand anderen. Lies die Beweise noch einmal!';
}
