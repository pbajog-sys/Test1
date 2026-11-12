// 🐉 Slowenisch – der große Ausbau: vier Seiten (Reise · Wortschatz · Grammatik · Gespräche), zum Wischen.
// • Wortschatz: 1.700 Wörter nach Häufigkeit (Korpus SSJ + Untertitel), gelernt mit Spaced Repetition (Wiederholung
//   nach 1, 2, 4, 7, 15, 30, 60, 120, 240 Tagen). Dazu ein Wörterbuch mit Formen.
// • Grammatik-Werkstatt: Fälle, Dual, Zahlen, Zeiten, Verneinung, Adjektive – die abgefragten Formen stammen aus echten
//   Belegen (Universal Dependencies SSJ, UniMorph/Wiktionary) bzw. sicheren Regeln; Unsicheres wird nie abgefragt.
// • Gespräche: Rollenspiele für den Alltag – du wählst bzw. sprichst die passende Antwort.
// Die Daten liegen in slo-lex.json (wird erst beim ersten Öffnen geladen).
const SLP_KASUS = ['Nominativ', 'Genitiv', 'Dativ', 'Akkusativ', 'Lokativ', 'Instrumental'];
const SLP_ZAHL = ['Einzahl', 'Dual', 'Mehrzahl'];
const SLP_INTERVALL = [0, 1, 2, 4, 7, 15, 30, 60, 120, 240];
const SLP_PERS = ['jaz', 'ti', 'on', 'midva', 'vidva', 'onadva', 'mi', 'vi', 'oni'];
const SLP_BITI = ['sem', 'si', 'je', 'sva', 'sta', 'sta', 'smo', 'ste', 'so'];
const SLP_BOM = ['bom', 'boš', 'bo', 'bova', 'bosta', 'bosta', 'bomo', 'boste', 'bodo'];
const SLP_NISEM = ['nisem', 'nisi', 'ni', 'nisva', 'nista', 'nista', 'nismo', 'niste', 'niso'];
// Subjekt → [Person-Index 0–8, l-Partizip-Index 0–8 (m/f/n Sg · m/f/n Du · m/f/n Pl), Anzeige]
const SLP_SUBJ = [[0, 0, 'jaz (Mann)'], [0, 1, 'jaz (Frau)'], [1, 0, 'ti (Mann)'], [1, 1, 'ti (Frau)'], [2, 0, 'on'], [2, 1, 'ona'], [3, 3, 'midva (2 Männer)'], [3, 4, 'medve (2 Frauen)'], [5, 3, 'onadva'], [5, 4, 'onidve'], [6, 6, 'mi'], [6, 7, 'me (nur Frauen)'], [7, 6, 'vi'], [8, 6, 'oni'], [8, 7, 'one']];
let slpLex = null, slpLaedt = null, slpSeite = 'karte';

// ---------- Daten ----------
function slpLaden() {
  if (slpLex) return Promise.resolve(slpLex);
  if (!slpLaedt) slpLaedt = fetch('slo-lex.json').then((r) => r.json()).then((d) => {
    slpLex = d.map(([sl, de, p, x], i) => {
      const w = { sl, de, p, i, e: '', ...(x || {}) };
      if (w.F) w.F = w.F.split(' ');
      if (w.pr) w.pr = w.pr.split(' ');
      if (w.lp) w.lp = w.lp.split(' ');
      return w;
    });
    return slpLex;
  }).catch((e) => { slpLaedt = null; throw e; });
  return slpLaedt;
}
const slpTagNr = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
function slpStore() {
  const st = sloStore();
  st.srs = st.srs && typeof st.srs === 'object' ? st.srs : {};
  st.srsNeu = st.srsNeu && typeof st.srsNeu === 'object' ? st.srsNeu : {};
  st.srsZiel = [5, 10, 15, 20, 30].includes(st.srsZiel) ? st.srsZiel : 10;
  st.gram = st.gram && typeof st.gram === 'object' ? st.gram : {};
  st.gespr = st.gespr && typeof st.gespr === 'object' ? st.gespr : {};
  return st;
}
// Wörter aus den Reise-Stationen gehören auch ins Wortschatz-Deck (wer sie schon gut kann, startet weiter oben)
function slpDeck() {
  const schon = new Set(slpLex.map((w) => w.sl.toLowerCase()));
  const extra = SLO_EINHEITEN.flatMap((u) => u.W).filter((w) => { const k = w.sl.toLowerCase(); if (schon.has(k)) return false; schon.add(k); return true; })
    .map((w, j) => ({ sl: w.sl, de: w.de, e: w.e, p: 'x', i: slpLex.length + j, reise: w.u }));
  return slpLex.concat(extra);
}
function slpSrsStand(st, deck) {
  const heute = slpTagNr();
  let gelernt = 0, sicher = 0, faellig = 0;
  deck.forEach((w) => { const c = st.srs[w.sl]; if (!c) return; gelernt++; if (c[0] >= 5) sicher++; if (c[1] <= heute) faellig++; });
  const neuHeute = st.srsNeu[heute] || 0;
  return { gelernt, sicher, faellig, neuHeute, neuOffen: Math.max(0, st.srsZiel - neuHeute), gesamt: deck.length };
}
function slpNiveau(n) {
  if (n >= 2500) return ['B1+', 'Du verstehst die meisten Alltagstexte.'];
  if (n >= 1500) return ['B1', 'Gespräche über Arbeit, Reisen, Pläne.'];
  if (n >= 800) return ['A2', 'Alltag, Einkaufen, über dich erzählen.'];
  if (n >= 300) return ['A1', 'Einfache Sätze und Fragen.'];
  return ['Start', 'Die ersten Wörter.'];
}
// Antwort im Wortschatz-Training: Stufe hoch oder zurück (nur die erste Antwort je Wort und Sitzung zählt)
function slpSrsAntwort(w, ok) {
  if (!slo || slo.art !== 'srs' || slo.srsGezaehlt.has(w.sl)) return;
  slo.srsGezaehlt.add(w.sl);
  const st = slpStore(), heute = slpTagNr(), c = st.srs[w.sl];
  let s = c ? c[0] : 0;
  if (!c) st.srsNeu[heute] = (st.srsNeu[heute] || 0) + 1;
  s = ok ? Math.min(SLP_INTERVALL.length - 1, s + 1) : 1;
  st.srs[w.sl] = [s, heute + (ok ? SLP_INTERVALL[s] : 1)];
  Object.keys(st.srsNeu).forEach((t) => { if (+t < heute - 30) delete st.srsNeu[t]; });
  saveJson(SLO_KEY, st);
}

// ---------- Rahmen: vier Seiten mit Tab-Leiste und Wischen ----------
const SLP_SEITEN = [['karte', '🗺️', 'Reise'], ['wortschatz', '🧠', 'Wortschatz'], ['grammatik', '🧩', 'Grammatik'], ['gespraeche', '💬', 'Gespräche']];
function slpRahmen() {
  if ($('sloTabs')) return;
  const b = document.querySelector('.slo-buehne');
  ['wortschatz', 'grammatik', 'gespraeche'].forEach((t) => { const d = document.createElement('div'); d.className = 'slo-teil slp-seite'; d.id = 'slo-' + t; d.hidden = true; b.appendChild(d); sloTeile2.push(t); });
  const nav = document.createElement('nav'); nav.className = 'slp-tabs'; nav.id = 'sloTabs'; nav.setAttribute('role', 'tablist');
  nav.innerHTML = SLP_SEITEN.map(([id, ic, n]) => '<button type="button" role="tab" data-slp="' + id + '"><b aria-hidden="true">' + ic + '</b>' + n + '</button>').join('');
  b.appendChild(nav);
  nav.querySelectorAll('[data-slp]').forEach((x) => x.addEventListener('click', () => slpZeige(x.dataset.slp)));
  // Wischen links/rechts wechselt die Seite (nicht vom Rand – der gehört der Zurück-Geste)
  let x0 = null, y0 = 0;
  b.addEventListener('touchstart', (e) => { x0 = null; if (e.touches.length !== 1 || nav.hidden) return; const t = e.touches[0]; if (t.clientX < 30 || t.clientX > innerWidth - 30) return; if (e.target.closest('input, textarea, select, .slo-paare, .slp-tabelle')) return; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
  b.addEventListener('touchend', (e) => {
    if (x0 == null || nav.hidden) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    const i = SLP_SEITEN.findIndex((s) => s[0] === slpSeite), j = i + (dx < 0 ? 1 : -1);
    if (j >= 0 && j < SLP_SEITEN.length) slpZeige(SLP_SEITEN[j][0], dx < 0 ? 'links' : 'rechts');
  }, { passive: true });
}
function slpZeige(id, richtung) {
  slpSeite = id;
  if (id === 'karte') { sloKarte(); }
  else {
    zeigeSloTeil(id);
    const box = $('slo-' + id);
    box.innerHTML = '<div class="slp-laden"><i></i><p>Lade Wortschatz …</p></div>';
    slpLaden().then(() => { if (slpSeite !== id) return; ({ wortschatz: slpWortschatz, grammatik: slpGrammatik, gespraeche: slpGespraeche })[id](); })
      .catch(() => { box.innerHTML = '<div class="slp-karte"><p>Der Wortschatz konnte nicht geladen werden. Einmal online öffnen, dann geht es auch offline.</p></div>'; });
    document.querySelector('.slo-buehne').scrollTop = 0;
  }
  const t = $('slo-' + id);
  if (t && richtung) { t.classList.remove('slp-rein-links', 'slp-rein-rechts'); void t.offsetWidth; t.classList.add('slp-rein-' + richtung); }
  slpTabsMarkieren();
}
function slpTabsMarkieren() {
  const nav = $('sloTabs'); if (!nav) return;
  const teil = sloTeile2.find((t) => !$('slo-' + t).hidden);
  const weg = !['karte', 'wortschatz', 'grammatik', 'gespraeche'].includes(teil);
  if (nav.hidden !== weg) nav.hidden = weg;
  if (teil && !nav.hidden) slpSeite = teil;
  nav.querySelectorAll('[data-slp]').forEach((x) => { const an = x.dataset.slp === slpSeite; x.classList.toggle('an', an); x.setAttribute('aria-selected', an); });
  document.querySelector('.slo-buehne').classList.toggle('mit-tabs', !nav.hidden);
}

// ---------- Seite: Wortschatz ----------
function slpWortschatz() {
  const st = slpStore(), deck = slpDeck(), S = slpSrsStand(st, deck), [niv, nivText] = slpNiveau(S.gelernt);
  const anteil = S.gelernt / S.gesamt, kannLernen = S.faellig + Math.min(S.neuOffen, deck.filter((w) => !st.srs[w.sl]).length) > 0;
  const box = $('slo-wortschatz');
  box.innerHTML = '<div class="slp-karte slp-held"><div class="slo-ring slp-ring" style="--a:' + anteil.toFixed(3) + '"><b>' + S.gelernt + '</b><small>von ' + fmt(S.gesamt) + '</small></div>'
    + '<div class="slp-held-text"><b>Niveau ' + niv + '</b><span>' + nivText + '</span><small>' + S.sicher + ' Wörter sitzen sicher (≥ 1 Monat)</small></div></div>'
    + '<div class="slp-zahlen"><div><b>' + S.faellig + '</b><small>heute fällig</small></div><div><b>' + S.neuHeute + '/' + st.srsZiel + '</b><small>neue heute</small></div><div><b>' + fmt(S.gesamt - S.gelernt) + '</b><small>noch neu</small></div></div>'
    + '<button type="button" class="btn slo-gross" id="slpLernen"' + (kannLernen ? '' : ' disabled') + '>' + (kannLernen ? '▶ Lernen' + (S.faellig ? ' · ' + Math.min(S.faellig, 30) + ' Wiederholungen' : '') + (S.neuOffen ? ' · ' + S.neuOffen + ' neue' : '') : '✓ Für heute geschafft – morgen geht’s weiter') + '</button>'
    + '<div class="slp-karte"><h3>Neue Wörter pro Tag</h3><div class="slp-chips">' + [5, 10, 15, 20, 30].map((n) => '<button type="button" class="slp-chip' + (st.srsZiel === n ? ' an' : '') + '" data-ziel="' + n + '">' + n + '</button>').join('') + '</div>'
    + '<p class="slp-klein">Die Wörter kommen nach Häufigkeit: zuerst die, die man ständig hört und liest. Was du gut kannst, kommt immer seltener – erst nach Tagen, dann Wochen, dann Monaten.</p></div>'
    + '<div class="slp-karte"><h3>📖 Wörterbuch</h3><input class="slp-suche" id="slpSuche" type="search" placeholder="Suchen: slowenisch oder deutsch …" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="slp-liste" id="slpListe"></div></div>'
    + '<p class="slp-klein slp-quelle">Wortformen: Universal Dependencies SSJ (CC BY-SA 4.0) und UniMorph/Wiktionary (CC BY-SA); Häufigkeit zusätzlich aus OpenSubtitles (FrequencyWords, CC BY-SA 4.0). Übersetzungen: eigene.</p>';
  $('slpLernen').addEventListener('click', slpSrsStart);
  box.querySelectorAll('[data-ziel]').forEach((b) => b.addEventListener('click', () => { const s2 = slpStore(); s2.srsZiel = +b.dataset.ziel; saveJson(SLO_KEY, s2); slpWortschatz(); }));
  const liste = () => {
    const q = sloNorm($('slpSuche').value), qo = sloOhneZeichen($('slpSuche').value);
    const treffer = (q ? deck.filter((w) => sloOhneZeichen(w.sl).includes(qo) || sloNorm(w.de).includes(q)) : deck).slice(0, q ? 80 : 40);
    $('slpListe').innerHTML = treffer.map((w) => { const c = st.srs[w.sl]; return '<button type="button" class="slp-wort" data-w="' + w.i + '"><b>' + sloEsc(w.sl) + '</b><span>' + sloEsc(w.de) + '</span><i class="slp-stufe" style="--s:' + (c ? c[0] / 9 : 0) + '" title="' + (c ? 'Stufe ' + c[0] : 'neu') + '"></i></button>'; }).join('')
      + (!q ? '<p class="slp-klein">Die ersten 40 von ' + fmt(deck.length) + ' – oben suchen findet alle.</p>' : treffer.length ? '' : '<p class="slp-klein">Nichts gefunden.</p>');
    $('slpListe').querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => slpWortKarte(deck[+b.dataset.w])));
  };
  $('slpSuche').addEventListener('input', liste); liste();
  slpTabsMarkieren();
}
function slpSrsStart() {
  const st = slpStore(), deck = slpDeck(), heute = slpTagNr();
  // Wörter, die man in der Reise schon gut kann, starten auf Stufe 3
  deck.forEach((w) => { if (!st.srs[w.sl] && (st.wort[w.sl] || 0) >= 3) st.srs[w.sl] = [3, heute + 2]; });
  saveJson(SLO_KEY, st);
  const faellig = deck.filter((w) => st.srs[w.sl] && st.srs[w.sl][1] <= heute).sort((a, b) => st.srs[a.sl][1] - st.srs[b.sl][1]).slice(0, 30);
  const S = slpSrsStand(st, deck), neu = deck.filter((w) => !st.srs[w.sl]).slice(0, Math.min(S.neuOffen, 30 - Math.min(faellig.length, 20)));
  if (!faellig.length && !neu.length) return;
  const ton = sloTonDa(), A = [];
  const typ = (w, i) => { const s = st.srs[w.sl] ? st.srs[w.sl][0] : 0; if (s >= 5) return i % 3 === 0 && ton ? 'hoeren' : 'tippen'; if (s >= 3) return i % 2 ? 'desl' : 'tippen'; return i % 2 ? 'slde' : 'desl'; };
  neu.forEach((w) => { A.push({ typ: 'neu', w }); A.push({ typ: 'slde', w }); });
  faellig.forEach((w, i) => A.push({ typ: typ(w, i), w }));
  const liste = sloMisch(A.filter((a) => a.typ !== 'neu' && a.typ !== 'slde' || !neu.includes(a.w)));
  // neue Wörter bleiben als Paar (Vorstellen → gleich abfragen), Wiederholungen dazwischen gemischt
  const neuPaare = neu.map((w) => A.filter((a) => a.w === w));
  const ergebnis = []; let k = 0;
  neuPaare.forEach((p) => { ergebnis.push(...p); for (let j = 0; j < 2 && k < liste.length; j++) ergebnis.push(liste[k++]); });
  while (k < liste.length) ergebnis.push(liste[k++]);
  if (neu.length >= 4) ergebnis.push({ typ: 'paare', liste: sloMisch(neu).slice(0, 5) });
  slpLektion('srs', '🧠 Wortschatz', ergebnis, deck);
}

// Wortkarte mit allen Formen
function slpWortKarte(w) {
  const st = slpStore(), c = st.srs[w.sl];
  const art = { n: 'Nomen' + (w.g ? ' · ' + { m: 'männlich', f: 'weiblich', n: 'sächlich' }[w.g] : ''), v: 'Verb' + (w.asp ? ' · ' + (w.asp === 'pf' ? 'vollendet' : 'unvollendet') : ''), a: 'Adjektiv', d: 'Adverb', p: 'Präposition', o: 'Pronomen', k: 'Bindewort', t: 'Partikel', i: 'Ausruf', x: w.reise ? 'aus der Reise' : '' }[w.p] || '';
  let tab = '';
  if (w.p === 'n' && w.F) tab = '<table class="slp-tabelle"><tr><th></th>' + SLP_ZAHL.map((z) => '<th>' + z + '</th>').join('') + '</tr>' + SLP_KASUS.map((k, ki) => '<tr><th>' + k + '</th>' + [0, 1, 2].map((z) => '<td>' + sloEsc(w.F[z * 6 + ki] || '–') + '</td>').join('') + '</tr>').join('') + '</table>';
  if (w.p === 'v' && (w.pr || w.lp)) tab = (w.pr ? '<h4>Gegenwart</h4><table class="slp-tabelle"><tr><th></th><th>Einzahl</th><th>Dual</th><th>Mehrzahl</th></tr>' + ['1.', '2.', '3.'].map((p, pi) => '<tr><th>' + p + '</th>' + [0, 1, 2].map((z) => '<td>' + sloEsc(w.pr[z * 3 + pi] || '–') + '</td>').join('') + '</tr>').join('') + '</table>' : '')
    + (w.lp ? '<h4>Vergangenheit (mit sem, si, je …)</h4><table class="slp-tabelle"><tr><th></th><th>m</th><th>w</th><th>s</th></tr>' + SLP_ZAHL.map((z, zi) => '<tr><th>' + z + '</th>' + [0, 1, 2].map((g) => '<td>' + sloEsc(w.lp[zi * 3 + g] || '–') + '</td>').join('') + '</tr>').join('') + '</table>' : '')
    + (w.imp ? '<p class="slp-klein">Befehlsform: <b>' + sloEsc(w.imp) + '!</b></p>' : '');
  if (w.p === 'a' && w.F) tab = '<table class="slp-tabelle"><tr><th></th><th>m</th><th>w</th><th>s</th></tr>' + SLP_KASUS.map((k, ki) => '<tr><th>' + k + '</th>' + [0, 1, 2].map((g) => '<td>' + sloEsc((ki === 3 && g === 0 ? (w.F[0] + ' / ' + w.F[1]) : w.F[g * 18 + ki]) || '–') + '</td>').join('') + '</tr>').join('') + '</table><p class="slp-klein">Einzahl; Akkusativ männlich: unbelebt wie Nominativ, belebt wie Genitiv.</p>';
  skDialog('<div class="slp-wk"><div class="slp-wk-kopf"><b>' + sloEsc(w.sl) + '</b>' + sloLaut(w.sl) + '</div><p class="slp-wk-de">' + sloEsc(w.de) + '</p><p class="slp-klein">' + art + (c ? ' · Lernstufe ' + c[0] + ' von 9' : ' · noch nicht gelernt') + '</p>' + tab
    + (tab ? '<p class="slp-klein">Leere Felder (–): Form nicht sicher belegt, darum hier weggelassen.</p>' : '') + '</div>');
  document.querySelectorAll('#skDlg [data-sprich]').forEach((b) => b.addEventListener('click', () => sloSprich(b.dataset.sprich)));
}

// ---------- Lektionen von Wortschatz und Grammatik laufen im vorhandenen Aufgaben-Motor ----------
function slpLektion(art, titel, liste, pool, thema) {
  slo = { u: null, art, titel, thema, stufe: 0, liste, pool, i: 0, fehler: 0, richtig: 0, bewertet: 0, nochmal: new Set(), start: Date.now(), zustand: 'antwort', fehlerListe: [], srsGezaehlt: new Set() };
  zeigeSloTeil('lektion');
  slpTabsMarkieren();
  sloZeigen();
}
// Ablenker: im Wortschatz-Training aus dem großen Wortschatz, möglichst gleiche Wortart
const _sloPoolAlt = sloPool;
sloPool = function (w) {
  if (slo && slo.pool) { const p = w && w.p ? slo.pool.filter((x) => x.p === w.p) : slo.pool; return p.length >= 8 ? p : slo.pool; }
  return _sloPoolAlt(w);
};
const _sloBewertenAlt = sloBewerten;
sloBewerten = function (r, a) {
  _sloBewertenAlt(r, a);
  if (slo && slo.art === 'srs' && a.w && !a.nochmal) slpSrsAntwort(a.w, r.ok);
  if (slo && slo.art === 'gram' && !a.nochmal) { slo.gramN = (slo.gramN || 0) + 1; if (r.ok) slo.gramOk = (slo.gramOk || 0) + 1; }
};
const _sloEndeAlt = sloEnde;
sloEnde = function () {
  if (!slo || !['srs', 'gram', 'gespr'].includes(slo.art)) { _sloEndeAlt(); return; }
  const st = slpStore(), quote = slo.bewertet ? slo.richtig / slo.bewertet : 1, fehlerfrei = slo.fehler === 0, xp = 10 + (fehlerfrei ? 5 : 0);
  st.xp += xp; st.tage[tagSchluessel()] = (st.tage[tagSchluessel()] || 0) + xp;
  if (slo.art === 'gram' && slo.thema) {
    const g = st.gram[slo.thema] || { n: 0, ok: 0, best: 0 };
    g.n += slo.gramN || 0; g.ok += slo.gramOk || 0; g.best = Math.max(g.best || 0, Math.round(((slo.gramOk || 0) / Math.max(1, slo.gramN || 0)) * 100)); g.zuletzt = Date.now();
    st.gram[slo.thema] = g;
  }
  if (slo.art === 'gespr' && slo.thema) st.gespr[slo.thema] = Math.max(st.gespr[slo.thema] || 0, Math.round(quote * 100));
  saveJson(SLO_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('slo', Math.round(quote * 100), 100, slo.titel);
  const sek = Math.round((Date.now() - slo.start) / 1000), zurueck = { srs: 'wortschatz', gram: 'grammatik', gespr: 'gespraeche' }[slo.art];
  const S = slo.art === 'srs' ? slpSrsStand(st, slpDeck()) : null;
  $('slo-ende').innerHTML = '<div class="slo-ende-drache slo-ende-flug">' + sloDrache('jubel') + '</div>'
    + '<h2 class="slo-ende-titel">' + (fehlerfrei ? 'Brez napake!' : quote >= 0.8 ? 'Odlično!' : 'Dobro opravljeno!') + '</h2>'
    + '<p class="slo-ende-sub">' + (fehlerfrei ? 'Ohne einen Fehler!' : quote >= 0.8 ? 'Ausgezeichnet!' : 'Gut gemacht!') + ' · ' + sloEsc(slo.titel) + '</p>'
    + '<div class="slo-ende-werte"><div><b>+' + xp + '</b>XP</div><div><b>' + Math.round(quote * 100) + ' %</b>richtig</div><div><b>' + Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0') + '</b>Zeit</div></div>'
    + (S ? '<p class="slo-ende-ziel">🧠 ' + S.gelernt + ' Wörter im Kopf · Niveau ' + slpNiveau(S.gelernt)[0] + '</p>' : '')
    + (slo.fehlerListe.length ? '<div class="slo-ende-fehler"><b>Das üben wir noch:</b>' + [...new Set(slo.fehlerListe.map((a) => (a.w ? a.w.sl + ' = ' + a.w.de : a.loesungText || (a.s ? a.s.sl + ' = ' + a.s.de : ''))).filter(Boolean))].slice(0, 6).map((t) => '<span>' + sloEsc(t) + '</span>').join('') + '</div>' : '')
    + '<button type="button" class="btn slo-gross" id="sloEndeWeiter">Weiter</button>';
  $('sloEndeWeiter').addEventListener('click', () => slpZeige(zurueck));
  zeigeSloTeil('ende'); slpTabsMarkieren();
  konfetti(fehlerfrei ? 30 : 18, ['🐉', '⭐', '🇸🇮', '✨']);
};
// Tab-Leiste folgt automatisch jedem Seitenwechsel (zeigeSloTeil ist in slo.js fest verdrahtet)
new MutationObserver((m) => { if ($('sloTabs') && m.some((x) => x.target.classList && x.target.classList.contains('slo-teil'))) slpTabsMarkieren(); }).observe(document.querySelector('.slo-buehne'), { subtree: true, attributes: true, attributeFilter: ['hidden'] });
const _sloKarteAlt = sloKarte;
sloKarte = function () {
  if (slo && ['srs', 'gram', 'gespr'].includes(slo.art) && !$('slo-lektion').hidden) { const z = { srs: 'wortschatz', gram: 'grammatik', gespr: 'gespraeche' }[slo.art]; slo = null; slpZeige(z); return; }
  slpRahmen(); slpSeite = 'karte'; _sloKarteAlt();
};

// ---------- Neue Aufgabentypen ----------
// form: eine Form wählen oder tippen. a = { frage (HTML), hilfe, loesung, alt[], opt[] | null, laut, erklaerung }
SLO_RENDER.form = function (a, box) {
  box.innerHTML = '<div class="slo-titel">' + (a.titel || 'Welche Form passt?') + '</div><div class="slo-frage satz slp-frage">' + a.frage + '</div>' + (a.hilfe ? '<div class="slo-uebersetzung">' + a.hilfe + '</div>' : '')
    + (a.opt ? '<div class="slo-optionen"></div>' : '<input class="slo-eingabe" id="sloEingabe" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Form eintippen …"><div class="slo-zeichen">' + ['č', 'š', 'ž'].map((z) => '<button type="button" data-z="' + z + '">' + z + '</button>').join('') + '</div>');
  const passt = [a.loesung].concat(a.alt || []).map(sloNorm), ergebnis = (ok, extra) => ({ ok, loesung: sloEsc(a.loesungText || a.loesung), laut: a.laut, hinweis: [a.erklaerung, extra].filter(Boolean).join(' ') });
  if (a.opt) {
    sloOptionen(box, a.opt, (o) => passt.includes(sloNorm(o)), (o) => sloEsc(o));
    const p = slo.pruefe; slo.pruefe = () => { const r = p(); return r && ergebnis(r.ok); };
  } else {
    const inp = $('sloEingabe');
    inp.addEventListener('input', () => sloBereit(inp.value.trim().length > 0));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('sloPruefen').disabled) { e.preventDefault(); sloPruefen(); } });
    box.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { const p = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, p) + b.dataset.z + inp.value.slice(inp.selectionEnd ?? p); inp.focus(); inp.setSelectionRange(p + 1, p + 1); sloBereit(true); }));
    setTimeout(() => inp.focus(), 50);
    slo.pruefe = () => {
      const v = inp.value; if (!v.trim()) return null;
      if (passt.includes(sloNorm(v))) return ergebnis(true);
      if (passt.map(sloOhneZeichen).includes(sloOhneZeichen(v))) return ergebnis(true, 'Fast perfekt – achte auf die Häkchen.');
      return ergebnis(false, 'Du hast „' + sloEsc(v.trim()) + '“ geschrieben.');
    };
  }
};
const _sloMusterAlt = sloMusterloesung;
sloMusterloesung = function (a) { if (a.typ === 'form' || a.typ === 'zug') return { loesung: sloEsc(a.loesungText || a.loesung), laut: a.laut }; return _sloMusterAlt(a); };

// ---------- Grammatik-Werkstatt ----------
const slpZS = (w) => ('ptkcčsšfh'.includes(w[0].toLowerCase()) ? 's' : 'z');   // z/s: s vor stimmlosen Lauten
const slpKH = (w) => ('kg'.includes(w[0].toLowerCase()) ? 'h' : 'k');           // k/h: h vor k und g
const slpZufall = (a) => a[Math.floor(Math.random() * a.length)];
// häufige Wörter bevorzugen (die ersten 60 % der Liste doppelt so oft)
function slpWahl(liste) { const k = Math.floor(liste.length * 0.6); return Math.random() < 0.67 && k > 0 ? liste[Math.floor(Math.random() * k)] : slpZufall(liste); }
function slpOptionen(richtig, kandidaten, n = 4) {
  const set = new Set([richtig]);
  sloMisch(kandidaten.filter(Boolean)).forEach((k) => { if (set.size < n && sloNorm(k) !== sloNorm(richtig)) set.add(k); });
  return set.size >= 3 ? sloMisch([...set]) : null;
}
const slpN = () => slpLex.filter((w) => w.p === 'n' && w.F);
const slpV = () => slpLex.filter((w) => w.p === 'v' && w.pr);
const slpVL = () => slpLex.filter((w) => w.p === 'v' && w.lp);
const slpA = () => slpLex.filter((w) => w.p === 'a' && w.F);
const slpGl = (w) => ' <i>(' + sloEsc(w.sl) + ' – ' + sloEsc(w.de) + ')</i>';
const ZI = (k, z) => z * 6 + k;   // Index in der Nomen-Tabelle: Kasus 0–5, Zahl 0 Sg, 1 Du, 2 Pl

// Jedes Thema: Erklärung + Aufgaben-Erzeuger (gibt null zurück, wenn gerade nichts Sicheres passt)
const SLP_THEMEN = [
  { id: 'praesens', ic: '⏱️', titel: 'Gegenwart', stufe: 'A1',
    erkl: '<p>Drei Muster – erkennbar an der <b>ich-Form</b>:</p><table class="slp-tabelle"><tr><th></th><th>-am</th><th>-em</th><th>-im</th></tr><tr><th>jaz</th><td>delam</td><td>pišem</td><td>govorim</td></tr><tr><th>ti</th><td>delaš</td><td>pišeš</td><td>govoriš</td></tr><tr><th>on/ona</th><td>dela</td><td>piše</td><td>govori</td></tr><tr><th>midva</th><td>delava</td><td>piševa</td><td>govoriva</td></tr><tr><th>vidva/onadva</th><td>delata</td><td>pišeta</td><td>govorita</td></tr><tr><th>mi</th><td>delamo</td><td>pišemo</td><td>govorimo</td></tr><tr><th>vi</th><td>delate</td><td>pišete</td><td>govorite</td></tr><tr><th>oni</th><td>delajo</td><td>pišejo</td><td>govorijo</td></tr></table><p>Der Infinitiv verrät das Muster nicht immer (<i>pisati → pišem</i>) – lerne Verben darum mit der ich-Form. Das Pronomen lässt man meist weg: <i>Delam.</i> = Ich arbeite.</p>',
    neu() { const v = slpWahl(slpV()), i = slpZufall([0, 1, 2, 3, 4, 6, 7, 8].filter((j) => v.pr[j])); if (i == null) return null;
      return { frage: '<b>' + SLP_PERS[i] + '</b> ____' + slpGl(v), loesung: v.pr[i], kand: v.pr, laut: SLP_PERS[i] + ' ' + v.pr[i] }; } },
  { id: 'vergangenheit', ic: '⏪', titel: 'Vergangenheit', stufe: 'A1–A2',
    erkl: '<p><b>sem, si, je, sva, sta, smo, ste, so</b> + <b>l-Form</b> des Verbs. Die l-Form richtet sich nach dem Geschlecht:</p><p><i>Delal sem.</i> (ein Mann) · <i>Delala sem.</i> (eine Frau) · <i>Delali smo.</i> (wir) · <i>Delale so.</i> (nur Frauen) · <i>Delala sva.</i> (wir zwei Männer)</p><p>Ohne Pronomen steht die l-Form vorn: <i>Včeraj sem delal.</i> Mit Pronomen: <i>Ona je delala.</i> Verneint: <i>Nisem delal.</i></p>',
    neu() { const v = slpWahl(slpVL()), [p, li, anz] = slpZufall(SLP_SUBJ); if (!v.lp[li]) return null;
      const r = SLP_BITI[p] + ' ' + v.lp[li], kand = [];
      [p, (p + 1) % 9, (p + 6) % 9, 2].forEach((pp) => [li, (li + 1) % 9, (li + 3) % 9, (li + 6) % 9].forEach((ll) => { if (v.lp[ll]) kand.push(SLP_BITI[pp] + ' ' + v.lp[ll]); }));
      return { frage: '<b>' + anz + '</b> ____' + slpGl(v), hilfe: 'Vergangenheit', loesung: r, kand, laut: anz.split(' ')[0] + ' ' + r }; } },
  { id: 'zukunft', ic: '⏩', titel: 'Zukunft', stufe: 'A2',
    erkl: '<p><b>bom, boš, bo, bova, bosta, bosta, bomo, boste, bodo</b> + l-Form: <i>Jutri bom delal.</i> (Mann) · <i>Jutri bom delala.</i> (Frau) · <i>Bomo videli.</i> = Wir werden sehen.</p><p>Bei vollendeten Verben geht auch die Gegenwart: <i>Jutri ti pokličem.</i> = Ich rufe dich morgen an.</p>',
    neu() { const v = slpWahl(slpVL()), [p, li, anz] = slpZufall(SLP_SUBJ); if (!v.lp[li]) return null;
      const r = SLP_BOM[p] + ' ' + v.lp[li], kand = [];
      [p, (p + 1) % 9, (p + 6) % 9, 2].forEach((pp) => [li, (li + 1) % 9, (li + 6) % 9].forEach((ll) => { if (v.lp[ll]) kand.push(SLP_BOM[pp] + ' ' + v.lp[ll]); }));
      kand.push(SLP_BITI[p] + ' ' + v.lp[li]);
      return { frage: '<b>' + anz + '</b> ____' + slpGl(v), hilfe: 'Zukunft', loesung: r, kand, laut: anz.split(' ')[0] + ' ' + r }; } },
  { id: 'nikalnica', ic: '🚫', titel: 'Verneinung', stufe: 'A1',
    erkl: '<p><b>ne</b> vor das Verb: <i>Ne razumem.</i> Aber <b>biti</b> und <b>imeti</b> verschmelzen: <i>nisem, nisi, ni, nisva, nista, nismo, niste, niso</i> · <i>nimam, nimaš, nima …</i></p><p>⚠️ Nach Verneinung steht das Objekt im <b>Genitiv</b>: <i>Imam avto.</i> → <i>Nimam avta.</i> · <i>Vidim hišo.</i> → <i>Ne vidim hiše.</i></p>',
    neu() {
      if (Math.random() < 0.4) { const i = slpZufall([0, 1, 2, 3, 6, 7, 8]); return { frage: '<b>' + SLP_PERS[i] + '</b> ____ doma.', hilfe: '„… nicht zu Hause“ (biti, verneint)', loesung: SLP_NISEM[i], kand: SLP_NISEM.concat(SLP_BITI.map((x) => 'ne ' + x)), laut: SLP_PERS[i] + ' ' + SLP_NISEM[i] + ' doma' }; }
      const n = slpWahl(slpN().filter((w) => w.F[ZI(1, 0)] && w.F[ZI(3, 0)])); const r = n.F[ZI(1, 0)];
      return { frage: 'Nimam ____' + slpGl(n), hilfe: 'Ich habe kein(e) …', loesung: r, kand: n.F, laut: 'Nimam ' + r, erklaerung: 'Nach „nimam“ steht der Genitiv.' }; } },
  { id: 'rodilnik', ic: '2️⃣', titel: 'Genitiv', stufe: 'A1–A2',
    erkl: '<p>Der Genitiv steht nach <b>brez</b> (ohne), <b>iz</b> (aus), <b>od</b> (von), <b>do</b> (bis), <b>zaradi</b> (wegen), <b>blizu</b> (nahe), nach Mengen (<i>veliko časa</i>) und nach Verneinung.</p><p>Endungen Einzahl: männlich/sächlich <b>-a</b> (<i>brez avta, brez mesta</i>), weiblich <b>-e</b> (<i>brez hiše</i>), i-Wörter <b>-i</b> (<i>brez stvari</i>).</p>',
    neu() { const n = slpWahl(slpN().filter((w) => w.F[ZI(1, 0)])), pr = slpZufall([['brez', 'ohne'], ['zaradi', 'wegen'], ['do', 'bis zu'], ['blizu', 'nahe bei']]); const r = n.F[ZI(1, 0)];
      return { frage: pr[0] + ' ____' + slpGl(n), hilfe: pr[1] + ' …', loesung: r, kand: n.F, laut: pr[0] + ' ' + r }; } },
  { id: 'dajalnik', ic: '🎁', titel: 'Dativ', stufe: 'A2',
    erkl: '<p>Wem? <i>Dam knjigo <b>bratu</b>.</i> = Ich gebe dem Bruder das Buch. Auch nach <b>k/h</b> (zu) und <b>proti</b> (gegen, in Richtung).</p><p><b>k</b> wird vor <b>k</b> und <b>g</b> zu <b>h</b>: <i>k prijatelju</i>, aber <i>h kolegu</i>, <i>h gori</i>.</p><p>Endungen Einzahl: männlich/sächlich <b>-u</b>, weiblich <b>-i</b>.</p>',
    neu() {
      if (Math.random() < 0.5) { const n = slpWahl(slpN().filter((w) => w.an && w.F[ZI(2, 0)])); if (!n) return null; const r = n.F[ZI(2, 0)]; return { frage: 'Dam darilo ____' + slpGl(n), hilfe: 'Ich gebe … ein Geschenk.', loesung: r, kand: n.F, laut: 'Dam darilo ' + r }; }
      const n = slpWahl(slpN().filter((w) => w.F[ZI(2, 0)])), f = n.F[ZI(2, 0)], r = slpKH(f) + ' ' + f;
      return { frage: '____' + slpGl(n), hilfe: 'zu … (k/h + Dativ)', loesung: r, kand: [(slpKH(f) === 'k' ? 'h ' : 'k ') + f].concat(n.F.filter(Boolean).map((x) => slpKH(f) + ' ' + x)), laut: r, erklaerung: slpKH(f) === 'h' ? 'Vor k/g wird k zu h.' : '' }; } },
  { id: 'tozilnik', ic: '🎯', titel: 'Akkusativ', stufe: 'A1',
    erkl: '<p>Wen/was? <i>Vidim <b>hišo</b>. Imam <b>avto</b>. Poznam <b>brata</b>.</i></p><p>Weiblich: <b>-a → -o</b>. Sächlich und unbelebt-männlich: wie Nominativ. <b>Belebt-männlich</b> (Menschen, Tiere): wie Genitiv, also <b>-a</b>: <i>Vidim psa.</i></p>',
    neu() { const n = slpWahl(slpN().filter((w) => w.F[ZI(3, 0)])), vb = slpZufall([['Vidim', 'Ich sehe …'], ['Imam', 'Ich habe …'], ['Iščem', 'Ich suche …']]); const r = n.F[ZI(3, 0)];
      return { frage: vb[0] + ' ____' + slpGl(n), hilfe: vb[1], loesung: r, kand: n.F, laut: vb[0] + ' ' + r, erklaerung: n.g === 'm' ? (n.an ? 'Belebt-männlich: Akkusativ = Genitiv.' : 'Unbelebt-männlich: Akkusativ = Nominativ.') : '' }; } },
  { id: 'mestnik', ic: '📍', titel: 'Lokativ', stufe: 'A1–A2',
    erkl: '<p>Nur mit Präposition: <b>v</b>/<b>na</b> (wo?), <b>o</b> (über), <b>pri</b> (bei), <b>po</b> (nach, entlang).</p><p>Endungen Einzahl: männlich/sächlich <b>-u</b> (<i>v mestu, o filmu</i>), weiblich <b>-i</b> (<i>v hiši, pri mami</i>). Mehrzahl <b>-ih</b> / weiblich <b>-ah</b>.</p>',
    neu() { const pl = Math.random() < 0.25, c = ZI(4, pl ? 2 : 0), n = slpWahl(slpN().filter((w) => w.F[c])), pr = slpZufall([['o', 'über …'], ['pri', 'bei …']]); const r = n.F[c];
      return { frage: pr[0] + ' ____' + slpGl(n) + (pl ? ' <small>– Mehrzahl</small>' : ''), hilfe: pr[1], loesung: r, kand: n.F, laut: pr[0] + ' ' + r }; } },
  { id: 'orodnik', ic: '🤝', titel: 'Instrumental', stufe: 'A2',
    erkl: '<p>Mit wem/womit? <b>z/s</b> (mit), dazu <b>pred</b> (vor), <b>za</b> (hinter), <b>pod</b> (unter), <b>nad</b> (über), <b>med</b> (zwischen) – auf die Frage „wo?“.</p><p><b>s</b> vor stimmlosen Lauten (p, t, k, c, č, s, š, f, h), sonst <b>z</b>: <i>s prijateljem, s kavo</i>, aber <i>z mamo, z avtom</i>.</p><p>Endungen Einzahl: männlich/sächlich <b>-om</b> (nach c, č, š, ž, j: <b>-em</b>), weiblich <b>-o</b>.</p>',
    neu() { const n = slpWahl(slpN().filter((w) => w.F[ZI(5, 0)])), f = n.F[ZI(5, 0)], r = slpZS(f) + ' ' + f;
      return { frage: '____' + slpGl(n), hilfe: 'mit … (z/s + Instrumental)', loesung: r, kand: [(slpZS(f) === 's' ? 'z ' : 's ') + f].concat(n.F.filter(Boolean).map((x) => slpZS(f) + ' ' + x)), laut: r }; } },
  { id: 'dvojina', ic: '👯', titel: 'Dual', stufe: 'A1–A2',
    erkl: '<p>Für <b>genau zwei</b> hat Slowenisch eigene Formen: <i>en brat → dva brata</i>, <i>ena sestra → dve sestri</i>, <i>eno mesto → dve mesti</i>.</p><p>Auch beim Verb: <i>midva delava</i> (wir zwei arbeiten), <i>vidva delata</i>, <i>onadva delata</i>.</p><p><b>dva</b> für männlich, <b>dve</b> für weiblich und sächlich.</p>',
    neu() {
      if (Math.random() < 0.45) { const v = slpWahl(slpV().filter((w) => w.pr[3] && w.pr[4])), i = slpZufall([3, 4, 5]); return { frage: '<b>' + SLP_PERS[i] + '</b> ____' + slpGl(v), loesung: v.pr[i], kand: v.pr, laut: SLP_PERS[i] + ' ' + v.pr[i] }; }
      const n = slpWahl(slpN().filter((w) => w.F[ZI(0, 1)])), z = n.g === 'm' ? 'dva' : 'dve', r = z + ' ' + n.F[ZI(0, 1)];
      return { frage: '2 × ' + sloEsc(n.sl) + ' <i>(' + sloEsc(n.de) + ')</i>', hilfe: 'Zwei davon – wie heißt das?', loesung: r, kand: [(z === 'dva' ? 'dve ' : 'dva ') + n.F[ZI(0, 1)], z + ' ' + n.F[ZI(0, 2)], z + ' ' + n.F[ZI(0, 0)], z + ' ' + n.F[ZI(1, 2)]], laut: r }; } },
  { id: 'stevila', ic: '🔢', titel: 'Zahlen & Fälle', stufe: 'A2',
    erkl: '<p>Nach der Zahl ändert sich das Nomen:</p><p><b>1</b> → Einzahl: <i>en avto, ena hiša, eno mesto</i><br><b>2</b> → Dual: <i>dva avta, dve hiši</i><br><b>3–4</b> → Mehrzahl: <i>trije avti, tri hiše, štiri mesta</i> (männlich: <i>trije, štirje</i>)<br><b>ab 5</b> → Genitiv Mehrzahl: <i>pet avtov, šest hiš, deset mest</i></p>',
    neu() {
      const k = slpZufall([1, 2, 3, 4, 5, 6, 8, 10]), n = slpWahl(slpN().filter((w) => w.F[ZI(0, 0)] && w.F[ZI(0, 1)] && w.F[ZI(0, 2)] && w.F[ZI(1, 2)]));
      const zahl = { 1: { m: 'en', f: 'ena', n: 'eno' }, 2: { m: 'dva', f: 'dve', n: 'dve' }, 3: { m: 'trije', f: 'tri', n: 'tri' }, 4: { m: 'štirje', f: 'štiri', n: 'štiri' } }[k];
      const wort = zahl ? zahl[n.g] : { 5: 'pet', 6: 'šest', 8: 'osem', 10: 'deset' }[k];
      const form = k === 1 ? n.F[ZI(0, 0)] : k === 2 ? n.F[ZI(0, 1)] : k <= 4 ? n.F[ZI(0, 2)] : n.F[ZI(1, 2)], r = wort + ' ' + form;
      const kand = [n.F[ZI(0, 0)], n.F[ZI(0, 1)], n.F[ZI(0, 2)], n.F[ZI(1, 2)]].map((f) => wort + ' ' + f);
      return { frage: k + ' × ' + sloEsc(n.sl) + ' <i>(' + sloEsc(n.de) + ')</i>', hilfe: 'Wie sagt man das?', loesung: r, kand, laut: r }; } },
  { id: 'pridevnik', ic: '🎨', titel: 'Adjektiv + Nomen', stufe: 'A2–B1',
    erkl: '<p>Das Adjektiv passt sich an Geschlecht, Zahl und Fall an: <i>velik avto, velika hiša, veliko mesto</i>.</p><p>Genitiv: <i>brez velikega avta, brez velike hiše</i>. Lokativ: <i>o velikem avtu, o veliki hiši</i>. Instrumental: <i>z velikim avtom, z veliko hišo</i>.</p>',
    neu() {
      const k = slpZufall([0, 1, 4, 5]), a = slpWahl(slpA()), g = { m: 0, f: 1, n: 2 };
      const n = slpWahl(slpN().filter((w) => w.F[ZI(k, 0)] && a.F[g[w.g] * 18 + k]));
      if (!n) return null;
      const af = a.F[g[n.g] * 18 + k], nf = n.F[ZI(k, 0)], pre = ['', 'brez', '', '', 'o', ''][k], vor = k === 5 ? slpZS(af) : pre, r = (vor ? vor + ' ' : '') + af + ' ' + nf;
      const kand = [0, 1, 2].flatMap((gg) => [a.F[gg * 18 + k], a.F[gg * 18], a.F[gg * 18 + 1]]).map((x) => x && (vor ? vor + ' ' : '') + x + ' ' + nf);
      return { frage: (vor || '') + ' ____ ' + slpGl(a).replace('<i>', '<i>').trim() + ' + ' + sloEsc(n.sl) + ' <i>(' + sloEsc(n.de) + ')</i>', hilfe: ['Nominativ (wer/was?)', 'ohne … (Genitiv)', '', '', 'über … (Lokativ)', 'mit … (Instrumental)'][k], loesung: r, kand, laut: r }; } },
  { id: 'zsk', ic: '🔤', titel: 'z/s und k/h', stufe: 'A1',
    erkl: '<p>Ein paar Präpositionen passen sich dem nächsten Laut an:</p><p><b>z → s</b> vor p, t, k, c, č, s, š, f, h: <i>s sestro, s kolesom</i> – sonst <i>z mamo, z avtom</i>.</p><p><b>k → h</b> vor k und g: <i>h kolegu, h gori</i> – sonst <i>k mami</i>.</p>',
    neu() {
      if (Math.random() < 0.5) { const n = slpWahl(slpN().filter((w) => w.F[ZI(5, 0)])), f = n.F[ZI(5, 0)]; return { frage: '____ ' + sloEsc(f), hilfe: 'mit … – z oder s?', loesung: slpZS(f), opt: ['z', 's'], laut: slpZS(f) + ' ' + f }; }
      const n = slpWahl(slpN().filter((w) => w.F[ZI(2, 0)])), f = n.F[ZI(2, 0)]; return { frage: '____ ' + sloEsc(f), hilfe: 'zu … – k oder h?', loesung: slpKH(f), opt: ['k', 'h'], laut: slpKH(f) + ' ' + f }; } },
];
function slpGramAufgaben(th, n = 10) {
  const st = slpStore(), g = st.gram[th.id], tippen = g && g.best >= 80;   // wer es kann, tippt die zweite Hälfte selbst
  const A = [{ typ: 'erkl', th }]; let versuche = 0;
  while (A.length < n + 1 && versuche++ < 200) {
    const q = th.neu(); if (!q) continue;
    const opt = q.opt || slpOptionen(q.loesung, q.kand || []);
    if (!opt) continue;
    const tipp = tippen && A.length > n / 2 && !q.opt;
    A.push({ typ: 'form', frage: q.frage, hilfe: q.hilfe, loesung: q.loesung, opt: tipp ? null : opt, laut: q.laut, erklaerung: q.erklaerung, loesungText: q.laut && !q.opt ? q.loesung : q.loesung, titel: tipp ? 'Tippe die richtige Form' : 'Welche Form passt?' });
  }
  return A;
}
SLO_RENDER.erkl = function (a, box) {
  box.innerHTML = '<div class="slo-tippkarte slp-erkl"><div class="slo-tk-kopf">' + sloDrache('froh') + '<div><small>Grammatik · ' + a.th.stufe + '</small><b>' + a.th.ic + ' ' + a.th.titel + '</b></div></div>' + a.th.erkl + '</div>';
  sloBereit(true, 'Los geht’s'); $('sloWeissNicht').hidden = true;
  slo.pruefe = () => { slo.i++; sloZeigen(); return null; };   // Erklärung: einfach weiter, ohne Wertung
};
function slpGrammatik() {
  const st = slpStore();
  $('slo-grammatik').innerHTML = '<div class="slp-karte"><h3>🧩 Grammatik-Werkstatt</h3><p class="slp-klein">Kurz erklärt, dann 10 Aufgaben. Ab 80 % tippst du die Formen selbst. Alle abgefragten Formen sind in echten slowenischen Texten belegt oder folgen sicheren Regeln.</p></div>'
    + '<div class="slp-themen">' + SLP_THEMEN.map((th) => { const g = st.gram[th.id], b = g ? g.best : 0; return '<button type="button" class="slp-thema" data-th="' + th.id + '"><span class="slp-th-ic">' + th.ic + '</span><span><b>' + th.titel + '</b><small>' + th.stufe + (g ? ' · ' + g.n + ' geübt' : ' · neu') + '</small></span><i class="slp-meister" style="--p:' + b + '%"><em>' + (b ? b + '%' : '') + '</em></i></button>'; }).join('') + '</div>';
  $('slo-grammatik').querySelectorAll('[data-th]').forEach((b) => b.addEventListener('click', () => { const th = SLP_THEMEN.find((t) => t.id === b.dataset.th); slpLektion('gram', '🧩 ' + th.titel, slpGramAufgaben(th), slpLex, th.id); }));
  slpTabsMarkieren();
}

// ---------- Gespräche: Rollenspiele ----------
// Zeilen: ['npc', slowenisch, deutsch] oder ['du', [[slowenisch, deutsch, richtig?, Erklärung bei falsch], …]]
const SLP_GESPRAECHE = [
  { id: 'kavarna', ic: '☕', titel: 'Im Café', stufe: 'A1', ort: 'Ljubljana, am Fluss', z: [
    ['npc', 'Dober dan! Kaj boste pili?', 'Guten Tag! Was möchten Sie trinken?'],
    ['du', [['Eno kavo z mlekom, prosim.', 'Einen Kaffee mit Milch, bitte.', 1], ['Sem kava z mlekom.', 'Ich bin ein Kaffee mit Milch.', 0, '„Sem“ heißt „ich bin“.'], ['Nasvidenje, kava.', 'Auf Wiedersehen, Kaffee.', 0, '„Nasvidenje“ sagt man beim Gehen.']]],
    ['npc', 'Želite še kaj?', 'Möchten Sie noch etwas?'],
    ['du', [['Ne, hvala. To je vse.', 'Nein, danke. Das ist alles.', 1], ['Ja, hvala, nič.', 'Ja, danke, nichts.', 0, 'Widerspricht sich: ja … nichts.'], ['Ne, prosim, vse.', 'Nein, bitte, alles.', 0, 'Unklar – „vse“ heißt „alles“.']]],
    ['npc', 'Izvolite. To bo dva evra.', 'Bitte sehr. Das macht zwei Euro.'],
    ['du', [['Izvolite. Hvala lepa!', 'Bitte schön. Vielen Dank!', 1], ['Koliko je ura?', 'Wie spät ist es?', 0, 'Das ist die Frage nach der Uhrzeit.'], ['Dva evra sem.', 'Ich bin zwei Euro.', 0, '„sem“ = ich bin.']]],
    ['npc', 'Hvala vam. Lep dan še naprej!', 'Danke Ihnen. Noch einen schönen Tag!'],
    ['du', [['Hvala, enako!', 'Danke, gleichfalls!', 1], ['Lahko noč!', 'Gute Nacht!', 0, 'Das sagt man erst abends vor dem Schlafen.'], ['Prosim, ne.', 'Bitte, nein.', 0, 'Passt nicht als Antwort auf einen Gruß.']]]] },
  { id: 'spoznavanje', ic: '👋', titel: 'Jemanden kennenlernen', stufe: 'A1', ort: 'Bled, am See', z: [
    ['npc', 'Živjo! Jaz sem Nina. Kako ti je ime?', 'Hallo! Ich bin Nina. Wie heißt du?'],
    ['du', [['Živjo! Ime mi je Luka.', 'Hallo! Ich heiße Luka.', 1], ['Hvala, dobro.', 'Danke, gut.', 0, 'Das antwortet man auf „Wie geht’s?“.'], ['Ime ti je Luka.', 'Du heißt Luka.', 0, '„ti“ = dir. Für dich selbst: „Ime mi je …“.']]],
    ['npc', 'Me veseli, Luka! Od kod si?', 'Freut mich, Luka! Woher kommst du?'],
    ['du', [['Iz Nemčije sem.', 'Ich bin aus Deutschland.', 1], ['Grem v Nemčijo.', 'Ich fahre nach Deutschland.', 0, 'Das ist „wohin“, nicht „woher“.'], ['Iz Nemčija sem.', '—', 0, 'Nach „iz“ steht der Genitiv: iz Nemčije.']]],
    ['npc', 'Kaj delaš v Sloveniji?', 'Was machst du in Slowenien?'],
    ['du', [['Tu sem na dopustu in se učim jezika.', 'Ich bin im Urlaub hier und lerne die Sprache.', 1], ['Slovenija je moja hiša.', 'Slowenien ist mein Haus.', 0, 'Passt nicht zur Frage.'], ['Se učim jezika.', '—', 0, '„se“ darf nicht am Satzanfang stehen: Učim se jezika.']]],
    ['npc', 'Super! Govoriš že zelo dobro.', 'Super! Du sprichst schon sehr gut.'],
    ['du', [['Hvala, še vedno se učim.', 'Danke, ich lerne noch.', 1], ['Ne, ti ne govoriš.', 'Nein, du sprichst nicht.', 0, 'Unhöflich – und falsch.'], ['Hvala, govoriš.', 'Danke, du sprichst.', 0, 'Unvollständig.']]]] },
  { id: 'trgovina', ic: '🛒', titel: 'Auf dem Markt', stufe: 'A1–A2', ort: 'Tržnica Ljubljana', z: [
    ['npc', 'Dober dan, kaj želite?', 'Guten Tag, was wünschen Sie?'],
    ['du', [['Kilogram jabolk, prosim.', 'Ein Kilo Äpfel, bitte.', 1], ['Kilogram jabolka, prosim.', '—', 0, 'Nach Mengen steht der Genitiv Plural: jabolk.'], ['Jabolka so rdeča.', 'Die Äpfel sind rot.', 0, 'Das ist keine Bestellung.']]],
    ['npc', 'Še kaj?', 'Noch etwas?'],
    ['du', [['Ja, še pol kilograma sira.', 'Ja, noch ein halbes Kilo Käse.', 1], ['Ja, še pol kilograma sir.', '—', 0, 'Genitiv nach der Menge: sira.'], ['Ne, še.', '—', 0, 'Unvollständig.']]],
    ['npc', 'To je skupaj šest evrov.', 'Das macht zusammen sechs Euro.'],
    ['du', [['Lahko plačam s kartico?', 'Kann ich mit Karte zahlen?', 1], ['Lahko plačam z kartico?', '—', 0, 'Vor k wird z zu s: s kartico.'], ['Kartica je moja.', 'Die Karte gehört mir.', 0, 'Passt nicht.']]],
    ['npc', 'Seveda. Izvolite račun.', 'Natürlich. Hier ist die Rechnung.'],
    ['du', [['Hvala, nasvidenje!', 'Danke, auf Wiedersehen!', 1], ['Dober dan!', 'Guten Tag!', 0, 'Das sagt man zur Begrüßung.'], ['Račun je drag.', 'Die Rechnung ist teuer.', 0, 'Unhöflich – und nicht gefragt.']]]] },
  { id: 'pot', ic: '🧭', titel: 'Nach dem Weg fragen', stufe: 'A1–A2', ort: 'Maribor, Altstadt', z: [
    ['npc', 'Vam lahko pomagam?', 'Kann ich Ihnen helfen?'],
    ['du', [['Oprostite, kje je železniška postaja?', 'Entschuldigung, wo ist der Bahnhof?', 1], ['Oprostite, kje je železniško postajo?', '—', 0, 'Nach „kje je“ steht der Nominativ: postaja.'], ['Postaja je tukaj.', 'Der Bahnhof ist hier.', 0, 'Du suchst ihn doch.']]],
    ['npc', 'Pojdite naravnost do semaforja, nato levo.', 'Gehen Sie geradeaus bis zur Ampel, dann links.'],
    ['du', [['Je daleč?', 'Ist es weit?', 1], ['Sem daleč.', 'Ich bin weit.', 0, '„sem“ = ich bin.'], ['Naravnost je levo.', 'Geradeaus ist links.', 0, 'Widerspricht sich.']]],
    ['npc', 'Ne, približno pet minut peš.', 'Nein, ungefähr fünf Minuten zu Fuß.'],
    ['du', [['Najlepša hvala!', 'Herzlichen Dank!', 1], ['Pet minut je peš.', '—', 0, 'Wiederholung ohne Sinn.'], ['Ni za kaj.', 'Keine Ursache.', 0, 'Das sagt die andere Person.']]],
    ['npc', 'Ni za kaj. Srečno pot!', 'Keine Ursache. Gute Reise!'],
    ['du', [['Hvala, nasvidenje!', 'Danke, auf Wiedersehen!', 1], ['Srečno pot si.', '—', 0, 'Ergibt keinen Sinn.'], ['Dobro jutro!', 'Guten Morgen!', 0, 'Begrüßung, kein Abschied.']]]] },
  { id: 'zdravnik', ic: '🩺', titel: 'Beim Arzt', stufe: 'A2', ort: 'Zdravstveni dom', z: [
    ['npc', 'Dober dan. Kaj vas boli?', 'Guten Tag. Was tut Ihnen weh?'],
    ['du', [['Boli me glava in imam vročino.', 'Mir tut der Kopf weh und ich habe Fieber.', 1], ['Bolim glavo.', '—', 0, 'Richtig ist: Boli me glava (wörtlich: der Kopf tut mir weh).'], ['Glava je lepa.', 'Der Kopf ist schön.', 0, 'Passt nicht.']]],
    ['npc', 'Od kdaj?', 'Seit wann?'],
    ['du', [['Od včeraj.', 'Seit gestern.', 1], ['Do jutri.', 'Bis morgen.', 0, '„do“ = bis.'], ['Včeraj sem.', '—', 0, 'Ergibt keinen Sinn.']]],
    ['npc', 'Tukaj je recept. Pijte veliko vode in počivajte.', 'Hier ist das Rezept. Trinken Sie viel Wasser und ruhen Sie sich aus.'],
    ['du', [['Kolikokrat na dan naj jemljem tablete?', 'Wie oft am Tag soll ich die Tabletten nehmen?', 1], ['Koliko je voda?', 'Wie viel ist Wasser?', 0, 'Ergibt keinen Sinn.'], ['Pijem veliko vodo.', '—', 0, 'Nach „veliko“ steht der Genitiv: veliko vode.']]],
    ['npc', 'Trikrat na dan, po jedi.', 'Dreimal am Tag, nach dem Essen.'],
    ['du', [['Razumem. Hvala, gospod doktor.', 'Verstanden. Danke, Herr Doktor.', 1], ['Ne razumem jedi.', 'Ich verstehe das Essen nicht.', 0, 'Passt nicht.'], ['Trikrat sem.', '—', 0, 'Ergibt keinen Sinn.']]]] },
  { id: 'hotel', ic: '🏨', titel: 'Im Hotel', stufe: 'A2', ort: 'Piran', z: [
    ['npc', 'Dober večer, izvolite?', 'Guten Abend, bitte sehr?'],
    ['du', [['Dober večer. Imam rezervacijo na ime Müller.', 'Guten Abend. Ich habe eine Reservierung auf den Namen Müller.', 1], ['Dober večer. Sem rezervacija.', 'Guten Abend. Ich bin eine Reservierung.', 0, '„sem“ = ich bin.'], ['Lahko noč, imam sobo.', 'Gute Nacht, ich habe ein Zimmer.', 0, '„Lahko noč“ sagt man vor dem Schlafen.']]],
    ['npc', 'Da, za dve noči. Vaš osebni dokument, prosim.', 'Ja, für zwei Nächte. Ihren Ausweis, bitte.'],
    ['du', [['Izvolite.', 'Bitte sehr. (beim Überreichen)', 1], ['Hvala, ne.', 'Danke, nein.', 0, 'Den Ausweis braucht das Hotel.'], ['Dve noči sta.', '—', 0, 'Wiederholt nur – und ist hier sinnlos.']]],
    ['npc', 'Soba 204 je v drugem nadstropju. Zajtrk je od sedmih do desetih.', 'Zimmer 204 ist im zweiten Stock. Frühstück gibt es von sieben bis zehn.'],
    ['du', [['Ali je v sobi internet?', 'Gibt es im Zimmer Internet?', 1], ['Ali je soba zajtrk?', 'Ist das Zimmer ein Frühstück?', 0, 'Ergibt keinen Sinn.'], ['V drugo nadstropje sem.', '—', 0, 'Falscher Fall und kein Sinn.']]],
    ['npc', 'Seveda. Geslo je na kartici.', 'Natürlich. Das Passwort steht auf der Karte.'],
    ['du', [['Odlično, hvala. Lahko noč!', 'Prima, danke. Gute Nacht!', 1], ['Geslo je moje.', 'Das Passwort gehört mir.', 0, 'Passt nicht.'], ['Kartica je na geslu.', 'Die Karte ist auf dem Passwort.', 0, 'Vertauscht.']]]] },
  { id: 'vlak', ic: '🚆', titel: 'Fahrkarte kaufen', stufe: 'A2', ort: 'Bahnhof Ljubljana', z: [
    ['npc', 'Dober dan, kam potujete?', 'Guten Tag, wohin reisen Sie?'],
    ['du', [['Eno vozovnico do Maribora, prosim.', 'Eine Fahrkarte nach Maribor, bitte.', 1], ['Ena vozovnica do Maribor, prosim.', '—', 0, 'Akkusativ (eno vozovnico) und nach „do“ Genitiv (Maribora).'], ['Maribor je lep.', 'Maribor ist schön.', 0, 'Keine Antwort auf „wohin“.']]],
    ['npc', 'Enosmerno ali povratno?', 'Einfach oder hin und zurück?'],
    ['du', [['Povratno, prosim.', 'Hin und zurück, bitte.', 1], ['Ali, prosim.', 'Oder, bitte.', 0, '„ali“ = oder.'], ['Enosmerno povratno.', '—', 0, 'Beides geht nicht.']]],
    ['npc', 'To bo osemnajst evrov. Vlak odpelje ob 14.20 s tretjega tira.', 'Das macht 18 Euro. Der Zug fährt um 14:20 von Gleis drei.'],
    ['du', [['Oprostite, s katerega tira?', 'Entschuldigung, von welchem Gleis?', 1], ['Oprostite, z katerega tira?', '—', 0, 'Vor k wird z zu s: s katerega.'], ['Tir je tretji vlak.', '—', 0, 'Ergibt keinen Sinn.']]],
    ['npc', 'S tretjega.', 'Von Gleis drei.'],
    ['du', [['Hvala za pomoč!', 'Danke für die Hilfe!', 1], ['Hvala za pomoči!', '—', 0, 'Nach „za“ steht hier der Akkusativ: za pomoč.'], ['Tretji sem.', 'Ich bin der Dritte.', 0, 'Passt nicht.']]]] },
  { id: 'dogovor', ic: '📞', titel: 'Sich verabreden', stufe: 'A2', ort: 'am Telefon', z: [
    ['npc', 'Halo, tukaj Maja. Imaš čas v soboto?', 'Hallo, hier ist Maja. Hast du am Samstag Zeit?'],
    ['du', [['Ja, imam. Kaj predlagaš?', 'Ja. Was schlägst du vor?', 1], ['Ja, sem.', 'Ja, ich bin.', 0, 'Auf „imaš čas?“ antwortet man mit „imam“.'], ['Sobota je dan.', 'Samstag ist ein Tag.', 0, 'Passt nicht.']]],
    ['npc', 'Greva v kino? Ob osmih zvečer.', 'Gehen wir (zwei) ins Kino? Um acht Uhr abends.'],
    ['du', [['Super, dobiva se pred kinom.', 'Super, wir treffen uns vor dem Kino.', 1], ['Super, se dobiva pred kinom.', '—', 0, '„se“ darf nicht am Satzanfang stehen.'], ['Super, dobiva se pred kino.', '—', 0, 'Nach „pred“ (wo?) steht der Instrumental: pred kinom.']]],
    ['npc', 'Dogovorjeno! Vidiva se v soboto.', 'Abgemacht! Wir sehen uns am Samstag.'],
    ['du', [['Vidiva se! Adijo.', 'Bis dann! Tschüss.', 1], ['Vidim se!', 'Ich sehe mich!', 0, 'Für zwei Personen: vidiva se.'], ['Dober večer!', 'Guten Abend!', 0, 'Begrüßung, kein Abschied.']]]] },
  { id: 'vikend', ic: '⛰️', titel: 'Pläne fürs Wochenende', stufe: 'A2–B1', ort: 'Kranjska Gora', z: [
    ['npc', 'Kakšno vreme bo jutri?', 'Wie wird das Wetter morgen?'],
    ['du', [['Pravijo, da bo sončno in toplo.', 'Es heißt, es wird sonnig und warm.', 1], ['Jutri je bil sončen.', '—', 0, 'Zeiten gemischt – „jutri“ braucht die Zukunft.'], ['Vreme sem.', '—', 0, 'Ergibt keinen Sinn.']]],
    ['npc', 'Kaj boš delal za vikend?', 'Was machst du am Wochenende?'],
    ['du', [['Šel bom v hribe s prijatelji.', 'Ich gehe mit Freunden in die Berge.', 1], ['Grem bom v hribe.', '—', 0, 'Zukunft: bom + l-Form (šel), nicht „grem“.'], ['Bil sem v hribe.', '—', 0, 'Vergangenheit – und nach „v“ (wo?) wäre es „v hribih“.']]],
    ['npc', 'Lepo! Kam pa greste?', 'Schön! Wohin geht ihr denn?'],
    ['du', [['Na Veliko planino.', 'Auf die Velika planina.', 1], ['Na Velika planina.', '—', 0, 'Wohin? → Akkusativ: na Veliko planino.'], ['Na Veliki planini.', '—', 0, 'Das ist „wo“ (Lokativ), gefragt ist „wohin“.']]],
    ['npc', 'Tam je čudovito. Uživajte!', 'Dort ist es wunderschön. Viel Spaß!'],
    ['du', [['Hvala, bomo!', 'Danke, machen wir!', 1], ['Hvala, sem!', '—', 0, 'Passt nicht.'], ['Uživam te.', '—', 0, 'Ergibt keinen Sinn.']]]] },
  { id: 'stanovanje', ic: '🏠', titel: 'Eine Wohnung mieten', stufe: 'B1', ort: 'am Telefon', z: [
    ['npc', 'Halo, prosim?', 'Hallo, bitte?'],
    ['du', [['Dober dan, kličem zaradi oglasa za stanovanje.', 'Guten Tag, ich rufe wegen der Wohnungsanzeige an.', 1], ['Dober dan, kličem zaradi oglas.', '—', 0, 'Nach „zaradi“ steht der Genitiv: oglasa.'], ['Stanovanje je klic.', '—', 0, 'Ergibt keinen Sinn.']]],
    ['npc', 'Da, stanovanje je še prosto. Kaj vas zanima?', 'Ja, die Wohnung ist noch frei. Was möchten Sie wissen?'],
    ['du', [['Koliko znaša najemnina in ali so stroški vključeni?', 'Wie hoch ist die Miete und sind die Nebenkosten inklusive?', 1], ['Koliko je ura stanovanja?', '—', 0, 'Ergibt keinen Sinn.'], ['Najemnina so stroški.', '—', 0, 'Ergibt keinen Sinn.']]],
    ['npc', 'Najemnina je 650 evrov, stroški so posebej, približno 120 evrov na mesec.', 'Die Miete beträgt 650 Euro, Nebenkosten extra, etwa 120 Euro im Monat.'],
    ['du', [['Ali si lahko stanovanje ogledam ta teden?', 'Kann ich mir die Wohnung diese Woche ansehen?', 1], ['Si lahko ogledam stanovanje?', '—', 0, '„si“ darf nicht am Satzanfang stehen: Ali si lahko …'], ['Ta teden sem stanovanje.', '—', 0, 'Ergibt keinen Sinn.']]],
    ['npc', 'Lahko v četrtek ob petih popoldne.', 'Am Donnerstag um fünf Uhr nachmittags.'],
    ['du', [['Odlično, četrtek ob petih mi ustreza.', 'Prima, Donnerstag um fünf passt mir.', 1], ['Odlično, v četrtek ob pet.', '—', 0, 'Uhrzeit: ob petih (Lokativ).'], ['Četrtek je popoldne.', '—', 0, 'Passt nicht.']]]] },
  { id: 'mnenje', ic: '💭', titel: 'Seine Meinung sagen', stufe: 'B1–B2', ort: 'im Büro', z: [
    ['npc', 'Kaj meniš o javnem prevozu v Ljubljani?', 'Was hältst du vom öffentlichen Verkehr in Ljubljana?'],
    ['du', [['Po mojem mnenju je dober, vendar bi lahko bil cenejši.', 'Meiner Meinung nach ist er gut, könnte aber billiger sein.', 1], ['Po moje mnenje je dober.', '—', 0, 'Nach „po“ steht der Lokativ: po mojem mnenju.'], ['Javni prevoz sem jaz.', '—', 0, 'Ergibt keinen Sinn.']]],
    ['npc', 'Strinjam se. Jaz se vozim s kolesom, ker je hitreje.', 'Da stimme ich zu. Ich fahre mit dem Fahrrad, weil es schneller ist.'],
    ['du', [['Imaš prav, s kolesom si res hitrejši.', 'Du hast recht, mit dem Rad bist du wirklich schneller.', 1], ['Imaš prav, z kolesom si res hitrejši.', '—', 0, 'Vor k wird z zu s: s kolesom.'], ['Imaš kolo prav.', '—', 0, 'Ergibt keinen Sinn.']]],
    ['npc', 'Ampak pozimi je težko.', 'Aber im Winter ist es schwierig.'],
    ['du', [['Res je. Takrat raje vzamem avtobus.', 'Stimmt. Dann nehme ich lieber den Bus.', 1], ['Res je. Takrat raje vzamem avtobusa.', '—', 0, '„avtobus“ ist unbelebt: Akkusativ = Nominativ.'], ['Zima je avtobus.', '—', 0, 'Ergibt keinen Sinn.']]]] },
];
SLO_RENDER.zug = function (a, box) {
  const blase = (z, wer) => '<div class="slp-blase ' + wer + '"><b>' + sloEsc(z[1]) + '</b>' + (wer === 'npc' ? ' ' + sloLaut(z[1]) : '') + '<small>' + sloEsc(z[2]) + '</small></div>';
  box.innerHTML = '<div class="slo-titel">' + a.g.ic + ' ' + a.g.titel + ' <small>· ' + a.g.ort + '</small></div><div class="slp-chat">' + a.vorher.map((z) => blase(z, z[0])).join('') + blase(a.npc, 'npc neu') + '</div><div class="slo-titel klein">Was antwortest du?</div><div class="slo-optionen satz"></div>';
  const opt = sloMisch(a.opt.slice());
  sloOptionen(box, opt, (o) => o[2] === 1, (o) => sloEsc(o[0]), (o) => o[0]);
  const richtig = a.opt.find((o) => o[2] === 1);
  const p = slo.pruefe; slo.pruefe = () => { const r = p(); if (!r) return r; const gew = slo.antwort; return { ...r, loesung: sloEsc(richtig[0]) + ' = ' + sloEsc(richtig[1]), laut: richtig[0], hinweis: !r.ok && gew && gew[3] ? '„' + sloEsc(gew[0]) + '“: ' + gew[3] : '' }; };
  const chat = box.querySelector('.slp-chat'); chat.scrollTop = chat.scrollHeight;
  setTimeout(() => sloSprich(a.npc[1]), 200);
};
function slpGespraechAufgaben(g) {
  const A = [], vorher = [];
  g.z.forEach((z, i) => {
    if (z[0] === 'npc') return;
    const npc = g.z[i - 1], richtig = z[1].find((o) => o[2] === 1);
    A.push({ typ: 'zug', g, npc, opt: z[1], vorher: vorher.slice(), loesung: richtig[0], loesungText: richtig[0] + ' = ' + richtig[1], laut: richtig[0] });
    vorher.push(npc, ['du', richtig[0], richtig[1]]);
  });
  // zum Schluss zwei eigene Sätze laut sagen (wenn das Gerät Sprache erkennen kann)
  if (sloSprechenMoeglich()) sloMisch(A).slice(0, 2).forEach((a) => A.push({ typ: 'sprechen', s: { sl: a.loesung, de: a.loesungText.split(' = ')[1], slAlt: [], deAlt: [] } }));
  return A;
}
function slpGespraeche() {
  const st = slpStore();
  $('slo-gespraeche').innerHTML = '<div class="slp-karte"><h3>💬 Gespräche</h3><p class="slp-klein">Echte Alltagssituationen: Du liest bzw. hörst, was dein Gegenüber sagt, und wählst die passende Antwort. Falsche Antworten erklären, warum sie nicht passen. Am Ende sprichst du zwei deiner Sätze laut.</p></div>'
    + '<div class="slp-themen">' + SLP_GESPRAECHE.map((g) => { const b = st.gespr[g.id] || 0; return '<button type="button" class="slp-thema" data-g="' + g.id + '"><span class="slp-th-ic">' + g.ic + '</span><span><b>' + g.titel + '</b><small>' + g.stufe + ' · ' + g.ort + '</small></span><i class="slp-meister" style="--p:' + b + '%"><em>' + (b ? b + '%' : '') + '</em></i></button>'; }).join('') + '</div>';
  $('slo-gespraeche').querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { const g = SLP_GESPRAECHE.find((x) => x.id === b.dataset.g); slpLektion('gespr', g.ic + ' ' + g.titel, slpGespraechAufgaben(g), null, g.id); }));
  slpTabsMarkieren();
}
// Zurück-Knopf: von Wortschatz/Grammatik/Gespräche direkt zum Hub
$('sloZurueck').addEventListener('click', (e) => {
  if (['wortschatz', 'grammatik', 'gespraeche'].some((t) => $('slo-' + t) && !$('slo-' + t).hidden)) { e.stopImmediatePropagation(); if ('speechSynthesis' in window) speechSynthesis.cancel(); zeigeHub(); }
}, true);
