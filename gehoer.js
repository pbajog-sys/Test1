// 🎼 Gehörbildung im Ton-Gedächtnis: drei Übungen mit echten Notennamen (deutsch: … A, B, H).
//  • Intervalle: zwei Töne – welcher Abstand? (relatives Hören, mit Eselsbrücken aus bekannten Liedern)
//  • Töne benennen: ein Ton – welcher? Leicht/Mittel mit Referenz-C, Profi ohne (absolutes Gehör)
//  • Ton einstellen: „Stell ein C ein“ – mit dem Schieber, gezählt wird der Abstand in Cent zum nächsten C (Oktave egal)
// Jede Übung bringt bis zu 50 Punkte und landet als „Ton-Gedächtnis“ im Verlauf (zählt fürs Gehör im Fähigkeitenprofil).
const GB_NOTEN = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'];
const GB_WEISS = [0, 2, 4, 5, 7, 9, 11];
const gbFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const GB_INTERVALLE = [
  { h: 0, name: 'Prime' }, { h: 1, name: 'kleine Sekunde', lied: 'Der weiße Hai (Filmmusik)' }, { h: 2, name: 'große Sekunde', lied: '„Alle meine Entchen“ – al-le' },
  { h: 3, name: 'kleine Terz', lied: '„Kuckuck, Kuckuck“ – abwärts' }, { h: 4, name: 'große Terz', lied: '„Oh when the Saints“ – Oh when' },
  { h: 5, name: 'Quarte', lied: '„O Tannenbaum“ – O Tan-' }, { h: 6, name: 'Tritonus', lied: '„Maria“ (West Side Story) – Ma-ri' },
  { h: 7, name: 'Quinte', lied: '„Morgen kommt der Weihnachtsmann“ – Mor-gen kommt' }, { h: 8, name: 'kleine Sexte' },
  { h: 9, name: 'große Sexte', lied: '„My Bonnie Is Over the Ocean“ – My Bon-' }, { h: 10, name: 'kleine Septime', lied: 'Raumschiff Enterprise (alte Titelmusik)' },
  { h: 11, name: 'große Septime' }, { h: 12, name: 'Oktave', lied: '„Somewhere Over the Rainbow“ – Some-where' },
];
const GB_MODI = {
  intervall: { name: 'Intervalle', emoji: '↕️', text: 'Zwei Töne – welcher Abstand?', runden: 10, je: 5 },
  benennen: { name: 'Töne benennen', emoji: '🏷️', text: 'Ein Ton – wie heißt er?', runden: 10, je: 5 },
  einstellen: { name: 'Ton einstellen', emoji: '🎯', text: '„Stell ein C ein“ – ganz ohne Hilfe?', runden: 5, je: 10 },
};
const GB_STUFEN = {
  intervall: { leicht: 'große Sekunde, große Terz, Quinte, Oktave · aufwärts', mittel: '+ kleine Terz, Quarte, große Sexte · auf- und abwärts', profi: 'alle 12 Intervalle · auch gleichzeitig' },
  benennen: { leicht: 'weiße Tasten · vorher erklingt ein C', mittel: 'alle 12 Töne · vorher erklingt ein C', profi: 'alle 12 Töne · ohne Referenz, jede Oktave' },
  einstellen: { leicht: 'vorher erklingt ein C', mittel: 'nur einmal am Anfang ein A (440 Hz)', profi: 'ganz ohne Referenz' },
};

// ---------- Klang: weicher Klavier-ähnlicher Ton (Grundton + Obertöne, abklingend) ----------
function gbKlang(f, start = 0, dauer = 1.1) {
  try {
    const c = audio(), t = c.currentTime + start;
    [[1, 0.32], [2, 0.12], [3, 0.05], [4, 0.025]].forEach(([k, a]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f * k;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(a, t + 0.012);
      g.gain.exponentialRampToValueAtTime(a * 0.35, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dauer + 0.05);
    });
  } catch (e) { /* ohne Ton */ }
}

// ---------- Runden ----------
let gb = null;
function gbRunden(modus, stufe, r) {
  const M = GB_MODI[modus], out = [];
  for (let i = 0; i < M.runden; i++) {
    if (modus === 'intervall') {
      const erlaubt = stufe === 'leicht' ? [2, 4, 7, 12] : stufe === 'mittel' ? [2, 3, 4, 5, 7, 9, 12] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const h = erlaubt[Math.floor(r() * erlaubt.length)];
      const art = stufe === 'leicht' ? 'auf' : stufe === 'mittel' ? (r() < 0.5 ? 'auf' : 'ab') : ['auf', 'ab', 'zusammen'][Math.floor(r() * 3)];
      const unten = 52 + Math.floor(r() * 14);   // E3 … F4
      out.push({ h, art, unten, erlaubt });
    } else if (modus === 'benennen') {
      const pool = stufe === 'leicht' ? GB_WEISS : [...Array(12).keys()];
      const n = pool[Math.floor(r() * pool.length)], oktave = stufe === 'profi' ? 48 + 12 * Math.floor(r() * 3) : 60;
      out.push({ n, midi: oktave + n, referenz: stufe !== 'profi', pool });
    } else {
      const n = GB_WEISS[Math.floor(r() * 7)];
      out.push({ n, referenz: stufe === 'leicht' ? 'C' : stufe === 'mittel' && i === 0 ? 'A' : null });
    }
  }
  return out;
}
function gbStart(modus, stufe) {
  audio();
  gb = { modus, stufe, runden: gbRunden(modus, stufe, zufallsGenerator('gb-' + Date.now() + Math.random())), i: 0, punkte: [], antwort: null };
  zeigeTonTeil('gb');
  gbRunde();
}
function gbAbspielen() {
  const R = gb && gb.runden && gb.runden[gb.i];
  if (!R) return;
  if (gb.modus === 'intervall') {
    const a = gbFreq(R.unten), b = gbFreq(R.unten + R.h);
    if (R.art === 'zusammen') { gbKlang(a, 0.05, 1.6); gbKlang(b, 0.05, 1.6); }
    else if (R.art === 'ab') { gbKlang(b, 0.05); gbKlang(a, 0.75); }
    else { gbKlang(a, 0.05); gbKlang(b, 0.75); }
  } else if (gb.modus === 'benennen') {
    if (R.referenz) { gbKlang(gbFreq(60), 0.05, 0.9); gbKlang(gbFreq(R.midi), 1.15); } else gbKlang(gbFreq(R.midi), 0.05);
  } else if (R.referenz) gbKlang(gbFreq(R.referenz === 'C' ? 60 : 69), 0.05, 1.2);
}
function gbKopf() {
  const M = GB_MODI[gb.modus];
  return '<div class="gb-kopf"><span>' + M.emoji + ' ' + M.name + ' · ' + { leicht: 'Leicht', mittel: 'Mittel', profi: 'Profi' }[gb.stufe] + '</span><span>' + (gb.i + 1) + ' / ' + gb.runden.length + ' · ' + fmt(gb.punkte.reduce((a, b) => a + b, 0)) + ' P.</span></div>'
    + '<div class="gb-balken"><i style="width:' + Math.round((gb.i / gb.runden.length) * 100) + '%"></i></div>';
}
// Tastatur: eine Oktave, weiße und schwarze Tasten mit deutschen Namen
function gbTastatur(erlaubt) {
  const schwarzLinks = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 };
  return '<div class="gb-tasten">' + GB_WEISS.map((n) => '<button type="button" class="gb-taste weiss" data-n="' + n + '"' + (erlaubt.includes(n) ? '' : ' disabled') + '><span>' + GB_NOTEN[n] + '</span></button>').join('')
    + [1, 3, 6, 8, 10].map((n) => '<button type="button" class="gb-taste schwarz" style="--pos:' + schwarzLinks[n] + '" data-n="' + n + '"' + (erlaubt.includes(n) ? '' : ' disabled') + '><span>' + GB_NOTEN[n] + '</span></button>').join('') + '</div>';
}
function gbRunde() {
  const R = gb.runden[gb.i], box = $('ton-gb');
  gb.antwort = null;
  if (gb.modus === 'intervall') {
    box.innerHTML = gbKopf() + '<div class="ton-merk">Welches Intervall?</div><p class="gb-info">' + { auf: 'Zwei Töne nacheinander, aufwärts.', ab: 'Zwei Töne nacheinander, abwärts.', zusammen: 'Zwei Töne gleichzeitig.' }[R.art] + '</p>'
      + '<button type="button" class="gb-hoeren" id="gbHoeren">🔊 Anhören</button>'
      + '<div class="gb-optionen">' + R.erlaubt.map((h) => '<button type="button" class="gb-opt" data-h="' + h + '">' + GB_INTERVALLE[h].name + '<small>' + h + ' Halbt' + (h === 1 ? 'on' : 'öne') + '</small></button>').join('') + '</div><div class="gb-urteil" id="gbUrteil"></div>';
    box.querySelectorAll('[data-h]').forEach((b) => b.addEventListener('click', () => gbAntwort(Number(b.dataset.h), b)));
  } else if (gb.modus === 'benennen') {
    box.innerHTML = gbKopf() + '<div class="ton-merk">Welcher Ton ist das?</div><p class="gb-info">' + (R.referenz ? 'Zuerst erklingt ein <b>C</b>, dann der gesuchte Ton.' : 'Ohne Hilfe – nur der Ton. Die Oktave ist egal.') + '</p>'
      + '<button type="button" class="gb-hoeren" id="gbHoeren">🔊 Anhören</button>' + gbTastatur(R.pool) + '<div class="gb-urteil" id="gbUrteil"></div>';
    box.querySelectorAll('.gb-taste').forEach((b) => b.addEventListener('click', () => gbAntwort(Number(b.dataset.n), b)));
  } else {
    const name = GB_NOTEN[R.n];
    box.innerHTML = gbKopf() + '<div class="ton-merk">Stell ein <b class="gb-ziel">' + name + '</b> ein</div><p class="gb-info">' + (R.referenz === 'C' ? 'Zur Orientierung erklingt ein C.' : R.referenz === 'A' ? 'Einmal zur Orientierung: ein A (440 Hz). Danach musst du dir die Töne selbst merken.' : 'Ohne jede Referenz. Die Oktave ist egal – nur der Ton zählt.') + '</p>'
      + (R.referenz ? '<button type="button" class="gb-hoeren" id="gbHoeren">🔊 ' + R.referenz + ' anhören</button>' : '')
      + '<input class="ton-regler" type="range" id="gbRegler" min="0" max="1000" step="1" value="' + Math.round(200 + Math.random() * 600) + '" aria-label="Tonhöhe">'
      + '<div class="ton-skala"><span>tief</span><span>hoch</span></div><div class="ton-tipp-klein">Schieber festhalten = Ton hören</div>'
      + '<button type="button" class="btn ton-gross" id="gbFertig">Das ist ein ' + name + ' ✓</button><div class="gb-urteil" id="gbUrteil"></div>';
    const reg = $('gbRegler'), f = () => gbSchieberF(Number(reg.value));
    reg.addEventListener('pointerdown', () => liveStart(f()));
    reg.addEventListener('input', () => liveFrequenz(f()));
    ['pointerup', 'pointercancel', 'blur'].forEach((ev) => reg.addEventListener(ev, liveStopp));
    $('gbFertig').addEventListener('click', () => { liveStopp(); gbAntwort(f(), $('gbFertig')); });
  }
  if ($('gbHoeren')) $('gbHoeren').addEventListener('click', gbAbspielen);
  const runde = gb.i, lauf = gb;
  if (gb.modus !== 'einstellen' || R.referenz) setTimeout(() => { if (gb === lauf && gb.i === runde && gb.antwort === null) gbAbspielen(); }, 250);
}
// Schieber über zwei Oktaven C3 … C6 (logarithmisch)
const gbSchieberF = (x) => gbFreq(48) * Math.pow(2, (3 * x) / 1000);
function gbAntwort(wert, knopf) {
  if (gb.antwort !== null) return;
  gb.antwort = wert;
  const R = gb.runden[gb.i], M = GB_MODI[gb.modus];
  let p = 0, text = '';
  if (gb.modus === 'intervall') {
    const I = GB_INTERVALLE[R.h], ok = wert === R.h;
    p = ok ? M.je : 0;
    $('ton-gb').querySelectorAll('[data-h]').forEach((b) => { b.disabled = true; if (Number(b.dataset.h) === R.h) b.classList.add('richtig'); });
    if (!ok) knopf.classList.add('falsch');
    text = (ok ? '✅ Richtig: ' : '❌ Das war eine ') + '<b>' + I.name + '</b> (' + R.h + ' Halbtöne).' + (I.lied ? '<br><small>🎵 Eselsbrücke: ' + I.lied + '</small>' : '');
  } else if (gb.modus === 'benennen') {
    const ok = wert === R.n;
    // knapp daneben (ein Halbton) gibt einen Punkt
    const abst = Math.min((wert - R.n + 12) % 12, (R.n - wert + 12) % 12);
    p = ok ? M.je : abst === 1 ? 1 : 0;
    $('ton-gb').querySelectorAll('.gb-taste').forEach((b) => { b.disabled = true; if (Number(b.dataset.n) === R.n) b.classList.add('richtig'); });
    if (!ok) knopf.classList.add('falsch');
    text = (ok ? '✅ Richtig – ein <b>' : abst === 1 ? '🟡 Knapp daneben – es war ein <b>' : '❌ Es war ein <b>') + GB_NOTEN[R.n] + '</b>.' + (!ok ? ' Du hast ' + GB_NOTEN[wert] + ' gewählt (' + abst + ' Halbt' + (abst === 1 ? 'on' : 'öne') + ' daneben).' : '');
  } else {
    // Abstand zum nächstgelegenen Ton dieses Namens, in Cent
    const midi = 69 + 12 * Math.log2(wert / 440), cent = (((midi - R.n) % 12) + 12) % 12 * 100, abw = cent > 600 ? cent - 1200 : cent;
    p = Math.max(0, Math.round((M.je - Math.abs(abw) / 30) * 10) / 10);
    const getroffen = notenName(wert);
    knopf.disabled = true; $('gbRegler').disabled = true;
    text = (Math.abs(abw) <= 25 ? '🎯 Volltreffer! ' : Math.abs(abw) <= 100 ? '👍 Nah dran. ' : '') + 'Dein Ton: <b>' + getroffen.name.replace(/-?\d+$/, '') + '</b>' + (getroffen.cent ? ' ' + (getroffen.cent > 0 ? '+' : '') + getroffen.cent + ' Cent' : '') + ' · ' + (abw > 0 ? 'zu hoch' : abw < 0 ? 'zu tief' : 'genau') + ' um <b>' + Math.round(Math.abs(abw)) + ' Cent</b> (100 Cent = ein Halbton).'
      + '<div class="gb-knoepfe"><button type="button" class="btn secondary" id="gbDein">🔊 Deiner</button><button type="button" class="btn secondary" id="gbEcht">🔊 Echtes ' + GB_NOTEN[R.n] + '</button></div>';
    const echt = gbFreq(60 + R.n) * Math.pow(2, Math.round(Math.log2(wert / gbFreq(60 + R.n))));
    setTimeout(() => { $('gbDein').addEventListener('click', () => gbKlang(wert)); $('gbEcht').addEventListener('click', () => gbKlang(echt)); }, 0);
    gbKlang(wert, 0.05); gbKlang(echt, 1.0);
  }
  gb.punkte.push(p);
  if (navigator.vibrate) navigator.vibrate(p >= M.je * 0.8 ? 15 : [40, 40, 40]);
  $('gbUrteil').innerHTML = '<div class="gb-text">' + text + '</div><button type="button" class="btn ton-gross" id="gbWeiter">' + (gb.i + 1 < gb.runden.length ? 'Weiter →' : 'Auswertung') + '</button>';
  $('gbWeiter').addEventListener('click', () => { gb.i++; if (gb.i < gb.runden.length) gbRunde(); else gbEnde(); });
}
function gbEnde() {
  const M = GB_MODI[gb.modus], summe = Math.round(gb.punkte.reduce((a, b) => a + b, 0) * 10) / 10, k = gb.modus + '-' + gb.stufe;
  const st = tonStore(); st.gb = st.gb || {}; const alt = st.gb[k]; st.gb[k] = Math.max(alt || 0, summe); saveJson(TON_KEY, st);
  const stufeName = { leicht: 'Leicht', mittel: 'Mittel', profi: 'Profi' }[gb.stufe];
  if (typeof merkeVerlauf === 'function') merkeVerlauf('toene', summe, 50, M.name + ' · ' + stufeName, { stufe: gb.stufe === 'profi' ? 'schwer' : gb.stufe, modus: gb.modus, rekord: alt != null && summe > alt });
  const urteil = summe >= 45 ? 'Ein ausgezeichnetes Gehör!' : summe >= 35 ? 'Sehr gut gehört.' : summe >= 20 ? 'Ordentlich – Übung macht den Meister.' : 'Am Anfang ist das schwer. Probier die leichtere Stufe.';
  $('ton-gb').innerHTML = '<div class="ton-merk">' + M.emoji + ' ' + M.name + ' · ' + stufeName + '</div><div class="farb-summe">' + fmt(summe) + ' / 50</div>'
    + '<p class="gb-info">' + urteil + (alt != null && summe > alt ? ' 🏆 Neuer Bestwert!' : alt != null ? ' Bestwert: ' + fmt(alt) : '') + '</p>'
    + (gb.modus === 'benennen' && gb.stufe === 'profi' ? '<p class="gb-fein">Ohne Referenz Töne zu benennen nennt man absolutes Gehör. Nur wenige Menschen haben es – relatives Hören (Intervalle) lässt sich dagegen gut trainieren.</p>' : '')
    + '<div class="gb-knoepfe"><button type="button" class="btn ton-gross" id="gbNochmal">Nochmal</button><button type="button" class="btn secondary" id="gbZurMenue">Zur Gehörbildung</button></div>';
  $('gbNochmal').addEventListener('click', () => gbStart(gb.modus, gb.stufe));
  $('gbZurMenue').addEventListener('click', () => gbMenue());
}
// Auswahl: Übung und Stufe
function gbMenue(modus) {
  modus = modus || (gb && gb.modus) || 'intervall';
  const st = tonStore().gb || {}, stufe = (gb && gb.stufe) || 'leicht';
  gb = { modus, stufe };
  zeigeTonTeil('gb');
  const box = $('ton-gb');
  box.innerHTML = '<div class="ton-merk">🎼 Gehörbildung</div><div class="gb-modi">' + Object.entries(GB_MODI).map(([k, m]) => '<button type="button" class="gb-modus' + (k === modus ? ' on' : '') + '" data-m="' + k + '"><span>' + m.emoji + '</span><b>' + m.name + '</b><small>' + m.text + '</small></button>').join('') + '</div>'
    + '<div class="farb-stufen ton-stufen" id="gbStufen">' + ['leicht', 'mittel', 'profi'].map((s) => '<button type="button" data-s="' + s + '" class="' + (s === stufe ? 'on' : '') + '">' + { leicht: 'Leicht', mittel: 'Mittel', profi: 'Profi' }[s] + '<small>' + GB_STUFEN[modus][s] + '</small><small>' + (st[modus + '-' + s] != null ? 'Bestwert ' + fmt(st[modus + '-' + s]) + ' / 50' : '') + '</small></button>').join('') + '</div>'
    + '<button type="button" class="btn ton-gross" id="gbLos">Los geht’s 🎼</button><button type="button" class="btn secondary" id="gbZurueckIntro">← Zurück</button>';
  box.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => gbMenue(b.dataset.m)));
  box.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { gb.stufe = b.dataset.s; box.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b)); }));
  $('gbLos').addEventListener('click', () => gbStart(gb.modus, gb.stufe));
  $('gbZurueckIntro').addEventListener('click', () => { gb = null; toeneIntro(); });
}
document.querySelectorAll('#ton-intro [data-gb]').forEach((b) => b.addEventListener('click', () => { audio(); gb = null; gbMenue(b.dataset.gb); }));
