// 🤿 Tiefgang: Tauchen mit Risiko (Push your luck). Fünf Tauchgänge; Schritt für Schritt tiefer, jede Tiefe deckt einen Fund auf.
// Zwei gleiche Gefahren in einem Tauchgang (Qualle, Strömung, Druck) → die Beute dieses Tauchgangs ist verloren.
// Auftauchen sichert die Beute. Jede neue Tierart im Logbuch gibt Bonuspunkte. Die Luft begrenzt die Schritte.
// Gleicher Seed = gleiche Karte an gleicher Stelle (Tauchgang, Schritt) – so ist der Tagesgang für alle fair.
const TG_KEY = 'walquiz.tiefgang.v1';
const TG_TAUCHGAENGE = 5;
const TG_STUFEN = {
  leicht: { name: 'Leicht', luft: 12, risiko: true, gefahrMal: 0.8, klein: '12 Luft · Risiko wird angezeigt' },
  mittel: { name: 'Mittel', luft: 10, risiko: false, gefahrMal: 1, klein: '10 Luft · ohne Anzeige' },
  profi: { name: 'Profi', luft: 9, risiko: false, gefahrMal: 1.25, klein: '9 Luft · mehr Gefahren' },
};
const TG_ZONEN = [
  { name: 'Sonnenzone', bis: 3, farbe: '#1f8fc4', tiere: ['Großer Tümmler', 'Buckelwal', 'Schwarzspitzen-Riffhai', 'Ammenhai', 'Gemeiner Delfin', 'Zebrahai'] },
  { name: 'Dämmerzone', bis: 7, farbe: '#0d4f80', tiere: ['Blauwal', 'Hammerhai', 'Schwertwal', 'Blauhai', 'Weißer Hai', 'Rundkopfdelfin'] },
  { name: 'Mitternachtszone', bis: 99, farbe: '#06223f', tiere: ['Pottwal', 'Koboldhai', 'Kragenhai', 'Grönlandhai', 'Cuvier-Schnabelwal', 'Zigarrenhai'] },
];
// Karten: Fund (Punkte), Tier (fürs Logbuch), Gefahr (Typ)
const TG_KARTEN = {
  muschel: { emoji: '🐚', name: 'Muschel', punkte: 1 },
  seestern: { emoji: '⭐', name: 'Seestern', punkte: 2 },
  perle: { emoji: '🦪', name: 'Perle', punkte: 4 },
  koralle: { emoji: '🪸', name: 'Rote Koralle', punkte: 3 },
  schatz: { emoji: '💰', name: 'Schatzkiste', punkte: 6 },
  krone: { emoji: '👑', name: 'Versunkene Krone', punkte: 9 },
  luft: { emoji: '🫧', name: 'Luftblase', punkte: 0, luft: 2 },
  tier: { emoji: '🐋', name: 'Tier', punkte: 0 },
  qualle: { emoji: '🪼', name: 'Qualle', gefahr: true },
  stroemung: { emoji: '🌀', name: 'Strömung', gefahr: true },
  druck: { emoji: '💢', name: 'Druck', gefahr: true },
};
// Gewichte je Zone (Sonne, Dämmer, Mitternacht)
const TG_GEWICHTE = {
  muschel: [30, 10, 2], seestern: [20, 12, 4], koralle: [6, 14, 8], perle: [2, 16, 14], schatz: [0, 4, 14], krone: [0, 0, 5],
  luft: [6, 6, 5], tier: [16, 16, 16], qualle: [10, 12, 14], stroemung: [10, 12, 14], druck: [0, 8, 16],
};
const tgZone = (tiefe) => TG_ZONEN.findIndex((z) => tiefe <= z.bis);

// Die Karte an (Tauchgang, Schritt) – nur vom Seed abhängig
function tgKarte(seed, stufe, gang, tiefe) {
  const r = zufallsGenerator(seed + '|' + gang + '|' + tiefe);
  const zi = tgZone(tiefe), mal = TG_STUFEN[stufe].gefahrMal;
  const liste = Object.entries(TG_GEWICHTE).map(([k, g]) => [k, g[zi] * (TG_KARTEN[k].gefahr ? mal : 1)]);
  let x = r() * liste.reduce((s, [, g]) => s + g, 0);
  const typ = liste.find(([, g]) => (x -= g) < 0)[0];
  const k = { typ, ...TG_KARTEN[typ] };
  if (typ === 'tier') { const t = TG_ZONEN[zi].tiere; k.tier = t[Math.floor(r() * t.length)]; k.emoji = /hai/i.test(k.tier) ? '🦈' : /delfin|tümmler/i.test(k.tier) ? '🐬' : '🐋'; k.name = k.tier; }
  return k;
}
// Risiko des nächsten Schritts: Wahrscheinlichkeit einer Gefahr, die in diesem Tauchgang schon einmal kam
function tgRisiko(stufe, tiefe, schon) {
  const zi = tgZone(tiefe), mal = TG_STUFEN[stufe].gefahrMal;
  const summe = Object.entries(TG_GEWICHTE).reduce((s, [k, g]) => s + g[zi] * (TG_KARTEN[k].gefahr ? mal : 1), 0);
  return [...schon].reduce((s, k) => s + TG_GEWICHTE[k][zi] * mal, 0) / summe;
}

// ---------- Spielablauf ----------
let tg = null, tgStufe = 'leicht', tgGegner = null;
const tgStore = () => loadJson(TG_KEY);
const zeigeTgTeil = (t) => ['intro', 'spiel', 'ende'].forEach((x) => { $('tg-' + x).hidden = x !== t; });

function tiefgangIntro() {
  const st = tgStore(), best = st.best || {};
  $('tgStufen').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.stufe === tgStufe);
    b.querySelector('small').textContent = TG_STUFEN[b.dataset.stufe].klein;
  });
  $('tgBest').textContent = 'Bestwerte: ' + Object.entries(TG_STUFEN).map(([k, v]) => v.name + ' ' + (best[k] != null ? best[k] : '–')).join(' · ')
    + (st.logbuch ? ' · Logbuch ' + Object.keys(st.logbuch).length + ' / 18 Arten' : '');
  const t = st.tag && st.tag[heute()];
  $('tgTagBtn').textContent = t != null ? '📅 Tagestauchgang – heute: ' + t + ' Punkte' : '📅 Tagestauchgang (heute für alle gleich)';
  zeigeTgTeil('intro');
}

function tiefgangStart(opts = {}) {
  const stufe = opts.taeglich ? 'mittel' : opts.stufe || tgStufe;
  const seed = opts.seed || (opts.taeglich ? 'tg-' + heute() : String(Math.random()).slice(2));
  tg = { stufe, seed, taeglich: !!opts.taeglich, gang: 0, gesichert: 0, verloren: 0, tiere: {}, gaenge: [], gegner: opts.gegner || null };
  tgNeuerGang();
}

function tgNeuerGang() {
  tg.tiefe = 0; tg.luft = TG_STUFEN[tg.stufe].luft; tg.beute = []; tg.gefahren = new Set(); tg.vorbei = false;
  zeigeTgTeil('spiel');
  $('tgKarten').innerHTML = '';
  $('tgMeldung').textContent = 'Tauchgang ' + (tg.gang + 1) + ' von ' + TG_TAUCHGAENGE + ' – wie tief traust du dich?';
  $('tgMeldung').className = 'tg-meldung';
  tgZeichnen();
}

function tgZeichnen() {
  const S = TG_STUFEN[tg.stufe], zi = tgZone(Math.max(1, tg.tiefe + 1)), zone = TG_ZONEN[tgZone(Math.max(1, tg.tiefe))];
  $('tgRunde').textContent = '🤿 ' + (tg.gang + 1) + ' / ' + TG_TAUCHGAENGE;
  $('tgSpielBuehne').style.setProperty('--tiefe', Math.min(1, tg.tiefe / 11));
  $('tgTiefe').textContent = tg.tiefe * 10 + ' m';
  $('tgZone').textContent = tg.tiefe ? zone.name : 'An der Oberfläche';
  $('tgLuft').innerHTML = '';
  for (let i = 0; i < Math.max(S.luft, tg.luft); i++) { const b = document.createElement('i'); if (i < tg.luft) b.className = 'voll'; $('tgLuft').appendChild(b); }
  $('tgGefahren').innerHTML = ['qualle', 'stroemung', 'druck'].map((k) => '<span class="' + (tg.gefahren.has(k) ? 'an' : '') + '">' + TG_KARTEN[k].emoji + '</span>').join('');
  const wert = tg.beute.reduce((s, k) => s + k.punkte, 0);
  $('tgBeute').textContent = wert + ' Punkte in der Tasche';
  $('tgGesichert').textContent = tg.gesichert + ' gesichert' + (Object.keys(tg.tiere).length ? ' · ' + Object.keys(tg.tiere).length + ' Tiere (+' + Object.keys(tg.tiere).length * 2 + ')' : '');
  $('tgRisiko').hidden = !S.risiko || tg.vorbei;
  if (S.risiko) $('tgRisiko').textContent = 'Risiko nächster Schritt: ' + Math.round(tgRisiko(tg.stufe, tg.tiefe + 1, tg.gefahren) * 100) + ' %' + (zi !== tgZone(Math.max(1, tg.tiefe)) && tg.tiefe ? ' · neue Zone!' : '');
  $('tgTiefer').disabled = tg.vorbei || tg.luft <= 0;
  $('tgAuf').disabled = tg.vorbei;
  $('tgAuf').textContent = tg.tiefe ? 'Auftauchen ⬆️' : 'Auftauchen';
  $('tgWeiter').hidden = !tg.vorbei;
  $('tgWeiter').textContent = tg.gang + 1 >= TG_TAUCHGAENGE ? 'Zum Ergebnis' : 'Nächster Tauchgang';
  $('tgTiefer').hidden = $('tgAuf').hidden = tg.vorbei;
}

function tgTiefer() {
  if (tg.vorbei || tg.luft <= 0) return;
  tg.tiefe++; tg.luft--;
  const k = tgKarte(tg.seed, tg.stufe, tg.gang, tg.tiefe);
  const el = document.createElement('div');
  el.className = 'tg-karte ' + (k.gefahr ? 'gefahr' : k.typ === 'tier' ? 'tier' : 'fund');
  el.innerHTML = '<span class="tg-k-emoji"></span><span class="tg-k-name"></span><span class="tg-k-wert"></span>';
  el.querySelector('.tg-k-emoji').textContent = k.emoji;
  el.querySelector('.tg-k-name').textContent = k.name;
  $('tgKarten').prepend(el);
  const m = $('tgMeldung');
  if (k.gefahr) {
    if (tg.gefahren.has(k.typ)) {
      // zweite gleiche Gefahr: Beute verloren
      const weg = tg.beute.reduce((s, x) => s + x.punkte, 0);
      tg.verloren += weg;
      el.querySelector('.tg-k-wert').textContent = 'zweimal!';
      m.textContent = k.emoji + ' Schon wieder ' + k.name + '! Du musst sofort auftauchen – ' + (weg ? weg + ' Punkte gehen verloren.' : 'zum Glück hattest du noch nichts.');
      m.className = 'tg-meldung schlecht';
      tg.gaenge.push({ tiefe: tg.tiefe, punkte: 0, verloren: weg });
      tg.beute = []; tg.vorbei = true;
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
      $('tgSpielBuehne').classList.remove('wackeln'); void $('tgSpielBuehne').offsetWidth; $('tgSpielBuehne').classList.add('wackeln');
    } else {
      tg.gefahren.add(k.typ);
      el.querySelector('.tg-k-wert').textContent = 'Vorsicht';
      m.textContent = k.emoji + ' ' + k.name + '! Noch einmal ' + k.name + ' in diesem Tauchgang – und die Beute ist weg.';
      m.className = 'tg-meldung warnung';
    }
  } else if (k.typ === 'tier') {
    const neu = !tg.tiere[k.tier];
    tg.tiere[k.tier] = true;
    el.querySelector('.tg-k-wert').textContent = neu ? 'neu! +2' : 'schon gesehen';
    m.textContent = k.emoji + ' Sichtung: ' + k.tier + (neu ? ' – neu im Logbuch!' : '.');
    m.className = 'tg-meldung gut';
  } else if (k.typ === 'luft') {
    tg.luft += k.luft;
    el.querySelector('.tg-k-wert').textContent = '+' + k.luft + ' Luft';
    m.textContent = '🫧 Eine Luftblase – zwei Atemzüge mehr!';
    m.className = 'tg-meldung gut';
  } else {
    tg.beute.push(k);
    el.querySelector('.tg-k-wert').textContent = '+' + k.punkte;
    m.textContent = k.emoji + ' ' + k.name + ' gefunden (+' + k.punkte + ').' + (tg.luft <= 0 ? ' Die Luft ist alle – auftauchen!' : '');
    m.className = 'tg-meldung gut';
  }
  if (!tg.vorbei && tg.luft <= 0) m.textContent += ' Keine Luft mehr – tauch auf!';
  tgZeichnen();
}

function tgAuftauchen() {
  if (tg.vorbei) return;
  const wert = tg.beute.reduce((s, k) => s + k.punkte, 0);
  tg.gesichert += wert;
  tg.gaenge.push({ tiefe: tg.tiefe, punkte: wert, verloren: 0 });
  tg.vorbei = true;
  $('tgMeldung').textContent = '⬆️ Sicher aufgetaucht aus ' + tg.tiefe * 10 + ' m – ' + wert + ' Punkte gesichert!';
  $('tgMeldung').className = 'tg-meldung gut';
  if (wert >= 15) konfetti(20, ['💰', '🦪', '🐚', '✨']);
  tgZeichnen();
}

function tgWeiter() {
  tg.gang++;
  if (tg.gang >= TG_TAUCHGAENGE) tiefgangEnde(); else tgNeuerGang();
}

function tiefgangEnde() {
  const bonus = Object.keys(tg.tiere).length * 2, summe = tg.gesichert + bonus;
  const st = tgStore();
  st.best = st.best || {}; st.tag = st.tag || {}; st.logbuch = st.logbuch || {};
  Object.keys(tg.tiere).forEach((t) => { st.logbuch[t] = st.logbuch[t] || heute(); });
  let rekord = false;
  if (tg.taeglich) { if (st.tag[heute()] == null) st.tag[heute()] = summe; }
  else { rekord = st.best[tg.stufe] == null || summe > st.best[tg.stufe]; st.best[tg.stufe] = Math.max(st.best[tg.stufe] || 0, summe); }
  saveJson(TG_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('tiefgang', summe, null, tg.taeglich ? 'Tagestauchgang' : TG_STUFEN[tg.stufe].name);
  zeigeTgTeil('ende');
  $('tgRunde').textContent = '';
  hochzaehlen($('tgSumme'), summe, ' Punkte');
  $('tgRekord').textContent = rekord ? '🏆 Neuer Bestwert (' + TG_STUFEN[tg.stufe].name + ')!' : tg.taeglich ? '📅 Tagestauchgang vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('tgVergleich').hidden = !tg.gegner;
  if (tg.gegner) {
    const g = tg.gegner;
    $('tgVergleich').textContent = summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + g.punkte + ')!' : summe < g.punkte ? g.name + ' war besser (' + g.punkte + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  const l = $('tgListe');
  l.innerHTML = '';
  tg.gaenge.forEach((g, i) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="tl-n"></span><span class="tl-c"></span><b></b>';
    li.querySelector('.tl-n').textContent = '🤿 Tauchgang ' + (i + 1) + ' · ' + g.tiefe * 10 + ' m';
    li.querySelector('.tl-c').textContent = g.verloren ? '💥 ' + g.verloren + ' verloren' : g.punkte ? '⬆️ gesichert' : 'leer';
    li.querySelector('b').textContent = g.punkte;
    l.appendChild(li);
  });
  const li = document.createElement('li');
  li.innerHTML = '<span class="tl-n"></span><span class="tl-c"></span><b></b>';
  li.querySelector('.tl-n').textContent = '📖 Logbuch: ' + Object.keys(tg.tiere).length + ' Arten';
  li.querySelector('.tl-c').textContent = Object.keys(tg.tiere).slice(0, 3).join(', ') + (Object.keys(tg.tiere).length > 3 ? ' …' : '');
  li.querySelector('b').textContent = '+' + bonus;
  l.appendChild(li);
  if (summe >= 60) setTimeout(() => konfetti(50, ['🤿', '💰', '🐋', '🏆']), 400);
}

async function tiefgangTeilen() {
  const summe = tg.gesichert + Object.keys(tg.tiere).length * 2;
  const name = loadJson(STORE_KEY).name || 'Jemand';
  const url = location.origin + location.pathname + '?tiefgang=' + encodeURIComponent(tg.seed) + '&stufe=' + tg.stufe + '&n=' + encodeURIComponent(name) + '&p=' + summe;
  const text = '🤿 Tiefgang – ' + (tg.taeglich ? 'Tagestauchgang ' + new Date().toLocaleDateString('de-DE') : TG_STUFEN[tg.stufe].name) + '\n' + summe + ' Punkte '
    + tg.gaenge.map((g) => (g.verloren ? '💥' : g.punkte >= 15 ? '💰' : g.punkte ? '🐚' : '⚪')).join('') + '\nTauchst du tiefer? Gleiches Meer:';
  if (navigator.share) {
    try { await navigator.share({ title: 'Tiefgang', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('tgTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('tgTeilenMsg').textContent = url; }
}

// ---------- Knöpfe ----------
$('tgStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { tgStufe = b.dataset.stufe; tiefgangIntro(); }));
$('tgLos').addEventListener('click', () => {
  if (tgGegner) { const g = tgGegner; tgGegner = null; $('tgChallenge').hidden = true; tiefgangStart({ stufe: g.stufe, seed: g.seed, gegner: g }); }
  else tiefgangStart();
});
$('tgTagBtn').addEventListener('click', () => tiefgangStart({ taeglich: true }));
$('tgTiefer').addEventListener('click', tgTiefer);
$('tgAuf').addEventListener('click', tgAuftauchen);
$('tgWeiter').addEventListener('click', tgWeiter);
$('tgNochmal').addEventListener('click', () => tiefgangStart({ stufe: tg.stufe }));
$('tgTeilen').addEventListener('click', tiefgangTeilen);
$('tgZurueck').addEventListener('click', () => {
  if (tg && $('tg-intro').hidden) { tg = null; tiefgangIntro(); return; }
  tg = null; zeigeHub();
});
$('hubTiefgang').addEventListener('click', () => { merkeZuletzt('tiefgang'); zoomZu($('hubTiefgang'), () => { show('tiefgang', '🤿 Tiefgang'); tiefgangIntro(); }); });

// Challenge-Link: ?tiefgang=<seed>&stufe=…&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('tiefgang')) return;
  const stufe = TG_STUFEN[q.get('stufe')] ? q.get('stufe') : 'leicht';
  tgGegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('tiefgang'), stufe };
  history.replaceState(null, '', location.pathname);
  show('tiefgang', '🤿 Tiefgang');
  tgStufe = stufe;
  tiefgangIntro();
  $('tgChallenge').hidden = false;
  $('tgChallenge').textContent = tgGegner.name + ' hat ' + tgGegner.punkte + ' Punkte (' + TG_STUFEN[stufe].name + '). Gleiches Meer – tauchst du besser?';
})();
