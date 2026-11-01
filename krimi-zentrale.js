// 🕵️ Krimi-Zentrale: Startseite mit Ermittlungsakte und allen Krimi-Rätseln zum Üben.
// Gemeinsam für alle Krimi-Spiele: Einstellungen (Regeln, Stufen, Tagesrätsel), Uhr, Rekorde,
// Auflösungs-Bildschirm und Zurück-Navigation. Die Spiele melden sich mit krimiModus(id, {...}) an.
const KRIMI_TEILE = ['intro', 'setup', 'spiel', 'wachen', 'verhoer', 'alibi', 'akte', 'ende'];
let kAktiv = { teil: 'intro', modus: null, akte: null };

function krimiTeil(id) {
  KRIMI_TEILE.forEach((t) => { const el = $('krimi-' + t); if (el) el.hidden = t !== id; });
  kAktiv.teil = id;
  if (id === 'intro' || id === 'setup' || id === 'akte') krimiUhrStopp();
  window.scrollTo(0, 0);
  $('krimiBuehne').scrollTop = 0;
}

// ---------- Uhr ----------
let kUhr = null;
function krimiUhrStart() {
  clearInterval(kUhr && kUhr.t);
  kUhr = { start: Date.now() };
  const zeig = () => { if (kUhr) $('krimiRunde').textContent = '⏱ ' + zeitText(Math.floor((Date.now() - kUhr.start) / 1000)); };
  kUhr.t = setInterval(zeig, 1000);
  zeig();
}
function krimiUhrStopp() {
  $('krimiRunde').textContent = '';
  if (!kUhr) return 0;
  clearInterval(kUhr.t);
  const s = Math.floor((Date.now() - kUhr.start) / 1000);
  kUhr = null;
  return s;
}

// Schwierigkeit als Sterne + Denkschritte
function krimiSterne(el, bewertung) {
  el.replaceChildren();
  for (let i = 1; i <= 3; i++) el.appendChild(krimiIcon(i <= bewertung.sterne ? 'stern' : 'stern-leer', 'ks-stern'));
  el.append(' ' + bewertung.denkschritte + ' Denkschritte');
}
const krimiIconsEinsetzen = (wurzel = document) => wurzel.querySelectorAll('[data-k-icon]').forEach((el) => el.replaceChildren(krimiIcon(el.dataset.kIcon)));

// ---------- Rekorde ----------
// „Tatort“ liegt aus alter Zeit direkt im Stand, die anderen Spiele unter st.modi[id]
function krimiRekorde(st, modus) {
  if (modus === 'mord') return st;
  st.modi = st.modi || {};
  return (st.modi[modus] = st.modi[modus] || {});
}
function krimiGeloestZahl(st, modus) { return Object.values(krimiRekorde(st, modus).geloest || {}).reduce((a, b) => a + b, 0); }
function krimiSpeichern(modus, stufe, sek, hilfen, tag) {
  const st = kStand(), r = krimiRekorde(st, modus);
  r.geloest = r.geloest || {}; r.best = r.best || {}; r.tag = r.tag || {};
  r.geloest[stufe] = (r.geloest[stufe] || 0) + 1;
  const neu = !hilfen && (!r.best[stufe] || sek < r.best[stufe]);
  if (neu) r.best[stufe] = sek;
  if (tag) r.tag[heute() + ':' + stufe] = true;
  saveJson(KRIMI_KEY, st);
  return neu;
}

// ---------- Auflösung (für alle Spiele) ----------
function krimiGeschafft(e) {
  const sek = krimiUhrStopp();
  const neu = kAktiv.akte ? false : krimiSpeichern(e.modus, e.stufe, sek, e.hilfen, e.tag);
  if (kAktiv.akte && typeof akteKapitelFertig === 'function') akteKapitelFertig(e);
  $('krimiStempelText').textContent = e.stempel || (kAktiv.akte ? 'Kapitel gelöst' : 'Fall gelöst');
  $('krimiTaeter').replaceChildren(e.figur || krimiIcon('geloest', 'krimi-taeter-icon'));
  $('krimiTaeterWar').textContent = e.war || '';
  $('krimiTaeterName').textContent = e.name || '';
  $('krimiTatort').textContent = e.text || '';
  $('krimiZeit').textContent = '⏱ ' + zeitText(sek) + (e.hilfen ? ' · 💡 ' + e.hilfen + (e.hilfen === 1 ? ' Tipp' : ' Tipps') : '') + (neu ? ' · 🏆 Bestzeit!' : '');
  const eb = $('krimiEndBrett');
  eb.hidden = !e.brett;
  if (e.brett) {
    eb.className = 'krimi-brett krimi-endbrett' + (e.brett.klasse ? ' ' + e.brett.klasse : '');
    eb.innerHTML = e.brett.html;
    eb.style.setProperty('--n', e.brett.n);
    if (e.brett.tatort !== undefined) eb.querySelectorAll('.kz').forEach((c) => c.classList.toggle('tatort', c.dataset.raum === String(e.brett.tatort)));
  }
  $('krimiNochmal').textContent = kAktiv.akte ? 'Weiter in der Akte' : 'Nächstes Rätsel';
  $('krimiMenue').hidden = !!kAktiv.akte;
  kAktiv.letztes = e;
  krimiTeil('ende');
  setTimeout(() => konfetti(30, ['✨', '⭐', '✨']), 500);
}

// ---------- Startseite ----------
function krimiIntro() {
  kAktiv = { teil: 'intro', modus: null, akte: null };
  krimiTeil('intro');
  const st = kStand();
  const box = $('krimiModi');
  box.innerHTML = '';
  Object.values(KRIMI_MODI).forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'km-karte km-' + m.id;
    b.style.animationDelay = (0.05 + i * 0.06) + 's';
    const zahl = krimiGeloestZahl(st, m.id);
    b.innerHTML = '<span class="km-bild"></span><span class="km-titel"></span><span class="km-sub"></span><span class="km-stand"></span>';
    b.querySelector('.km-bild').appendChild(m.bild ? m.bild() : krimiIcon(m.icon));
    b.querySelector('.km-titel').textContent = m.titel;
    b.querySelector('.km-sub').textContent = m.kurz;
    b.querySelector('.km-stand').textContent = zahl ? '✓ ' + zahl + ' gelöst' : 'Neu';
    b.addEventListener('click', () => krimiSetup(m.id));
    box.appendChild(b);
  });
  if (typeof akteKarteZeigen === 'function') akteKarteZeigen();
}

// ---------- Einstellungen eines Spiels: Regeln, Stufe, Start ----------
function krimiSetup(id) {
  const m = KRIMI_MODI[id];
  kAktiv = { teil: 'setup', modus: id, akte: null };
  const st = kStand();
  const stufe = ((st.stufen || {})[id] in m.stufen) ? st.stufen[id] : (id === 'mord' && st.stufe in m.stufen ? st.stufe : 'leicht');
  $('ksBild').replaceChildren(m.bild ? m.bild() : krimiIcon(m.icon));
  $('ksTitel').textContent = m.titel;
  $('ksLead').textContent = m.lead;
  $('ksRegeln').innerHTML = m.regeln.map((r) => '<li>' + r + '</li>').join('');
  krimiIconsEinsetzen($('ksRegeln'));
  const hut = { leicht: 'hut-leicht', mittel: 'hut-mittel', schwer: 'hut-schwer' };
  const box = $('ksStufen');
  box.innerHTML = '';
  Object.entries(m.stufen).forEach(([s, info]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.stufe = s;
    b.className = s === stufe ? 'on' : '';
    b.innerHTML = '<i class="hut"></i>' + { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' }[s] + '<small></small>';
    b.querySelector('.hut').appendChild(krimiIcon(hut[s]));
    b.querySelector('small').textContent = info;
    b.addEventListener('click', () => {
      const s2 = kStand(); s2.stufen = s2.stufen || {}; s2.stufen[id] = s; saveJson(KRIMI_KEY, s2);
      krimiSetup(id);
    });
    box.appendChild(b);
  });
  const r = krimiRekorde(st, id), zahl = krimiGeloestZahl(st, id), best = (r.best || {})[stufe];
  $('ksBest').textContent = zahl
    ? '✓ ' + zahl + ' gelöst' + (best ? ' · Bestzeit ' + { leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' }[stufe] + ': ' + zeitText(best) : '')
    : 'Noch nichts gelöst';
  $('ksTag').replaceChildren(krimiIcon('schluessel', 'mini'), ((r.tag || {})[heute() + ':' + stufe] ? ' ' + m.tagesName + ' ✓' : ' ' + m.tagesName));
  $('ksLos').textContent = m.neuText;
  $('ksLos').onclick = () => krimiLos(id, stufe, false);
  $('ksTag').onclick = () => krimiLos(id, stufe, true);
  krimiTeil('setup');
}

function krimiLos(id, stufe, tag) {
  const m = KRIMI_MODI[id];
  const seed = tag ? (id === 'mord' ? 'krimi:' : 'krimi-' + id + ':') + heute() + ':' + stufe : 'krimi-' + id + ':' + Date.now() + ':' + Math.random();
  kAktiv = { teil: 'setup', modus: id, akte: null, stufe, tag };
  $('ksLos').disabled = true;
  $('ksLos').textContent = '🕵️ Wird ausgedacht …';
  // kurz warten, damit die Meldung erscheint, bevor gerechnet wird
  setTimeout(() => {
    $('ksLos').disabled = false;
    $('ksLos').textContent = m.neuText;
    m.start({ stufe, seed, tag });
  }, 30);
}

// ---------- Navigation ----------
function krimiZurueck() {
  const t = kAktiv.teil;
  if (t === 'intro') { krimiUhrStopp(); zeigeHub(); return; }
  if (t === 'setup' || t === 'akte') { krimiIntro(); return; }
  if (kAktiv.akte) { akteZeigen(); return; }
  if (t === 'ende') { krimiIntro(); return; }
  if (!confirm('Rätsel abbrechen?')) return;
  krimiSetup(kAktiv.modus);
}
$('krimiZurueck').addEventListener('click', krimiZurueck);
$('krimiNochmal').addEventListener('click', () => {
  if (kAktiv.akte) { akteZeigen(); return; }
  krimiLos(kAktiv.modus, kAktiv.stufe, false);
});
$('krimiMenue').addEventListener('click', krimiIntro);
$('hubKrimi').addEventListener('click', () => zoomZu($('hubKrimi'), () => { show('krimi', '🔎 Wer war\'s?'); krimiIntro(); }));

// Icons in der festen Seite (Regeln, Knöpfe) einsetzen
krimiIconsEinsetzen();
