// 🧪 Das Experiment der Woche: jede Kalenderwoche (Europe/Berlin) ein Versuch. Experimente sind Module:
//   { id, emoji, titel, teaser, frage, dauer, art: 'eigen' | 'spiel', start(box, fertig) }
// 'eigen' bringt eine eigene Versuchsanordnung mit, 'spiel' nutzt ein vorhandenes Spiel (Abschluss über den Verlauf).
// fertig({ werte, zeilen, html }) speichert das Ergebnis; alle Läufe bleiben im Archiv.
// Überraschungen entstehen nur aus der Versuchsanordnung – nie aus vorgetäuschten Fehlern oder Zufallsereignissen.
const LAB_START = Date.UTC(2026, 0, 5);   // Montag der ersten Versuchswoche

const LAB_EXPERIMENTE = [
  { id: 'grau', emoji: '◐', titel: 'Das Grau, das lügt', teaser: 'Stell sechs Grautöne nach. Klingt leicht.', frage: 'Wie stark verändert die Umgebung, was du siehst?', dauer: '2 Minuten', art: 'eigen', start: labGrau },
  { id: 'anker', emoji: '⚓', titel: 'Der Anker im Kopf', teaser: 'Sechs Schätzfragen. Eine harmlose Vorfrage vor jeder.', frage: 'Lässt du dich von einer Zahl lenken, die gar nichts bedeutet?', dauer: '3 Minuten', art: 'eigen', start: labAnker },
  { id: 'dopamin', emoji: '🧠', titel: 'Die Dopamin-Maschine', teaser: 'Drei Spiele gleichzeitig, Parkour im Hintergrund. Wie lange hältst du durch?', frage: 'Mit welchen Tricks halten Spiele und Apps uns fest?', dauer: '3 Minuten', art: 'spiel', spiel: 'dopamin', hub: 'hubDopamin' },
  { id: 'tierleben', emoji: '🐾', titel: 'Ein Leben in 42 Tagen', teaser: 'Werde für ein paar Minuten ein Tier. Ausgelost wie in Wirklichkeit.', frage: 'Wie fühlt sich ein Leben an, das für uns geplant ist?', dauer: '5 Minuten', art: 'spiel', spiel: 'tierleben', hub: 'hubTierleben' },
];

function labWoche(d = new Date()) {
  const [y, m, t] = skDatum(d).split('-').map(Number);
  const tag = Date.UTC(y, m - 1, t), idx = Math.floor((tag - LAB_START) / (7 * 864e5));
  // ISO-Kalenderwoche
  const dt = new Date(tag), wt = (dt.getUTCDay() + 6) % 7; dt.setUTCDate(dt.getUTCDate() - wt + 3);
  const jan4 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4)), kw = 1 + Math.round(((dt - jan4) / 864e5 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return { idx, kw, jahr: dt.getUTCFullYear() };
}
const labFuer = (idx) => LAB_EXPERIMENTE[((idx % LAB_EXPERIMENTE.length) + LAB_EXPERIMENTE.length) % LAB_EXPERIMENTE.length];
const labStand = () => { const s = loadJson(SK_EXP_KEY); s.fertig = s.fertig || {}; s.laeufe = s.laeufe || []; return s; };
function labDieseWoche() {
  const w = labWoche(), e = labFuer(w.idx);
  return { e, nr: w.idx + 1, kw: w.kw, fertig: !!labStand().fertig[e.id] };
}

// ---------- Seiten ----------
function labZeigen() { show('labor', '🧪 Das Experiment'); labUebersicht(); }
function labUebersicht() {
  const st = labStand(), w = labWoche(), jetzt = labFuer(w.idx), erg = st.fertig[jetzt.id];
  const archiv = [];
  for (let i = w.idx - 1; i >= Math.max(0, w.idx - 8); i--) archiv.push({ i, e: labFuer(i), kw: labWoche(new Date(LAB_START + i * 7 * 864e5 + 2 * 864e5)).kw });
  $('labInhalt').innerHTML = '<div class="lab-akte"><div class="lab-stempel' + (erg ? ' an' : '') + '">' + (erg ? 'DURCHGEFÜHRT' : 'OFFEN') + '</div>'
    + '<div class="lab-kopf"><span>EXPERIMENT Nº ' + String(w.idx + 1).padStart(2, '0') + '</span><span>KW ' + w.kw + ' · ' + w.jahr + '</span></div>'
    + '<div class="lab-symbol" aria-hidden="true">' + jetzt.emoji + '</div><h2 class="lab-titel">' + jetzt.titel + '</h2>'
    + '<p class="lab-frage"><span>FRAGESTELLUNG</span>' + jetzt.frage + '</p><p class="lab-teaser">' + jetzt.teaser + '</p>'
    + '<div class="lab-meta"><span>⏱ ' + jetzt.dauer + '</span><span>' + (jetzt.art === 'spiel' ? '↪ nutzt ein Spiel der Kiste' : '⚗ eigene Versuchsanordnung') + '</span></div>'
    + (erg ? '<div class="lab-ergebnis-kurz"><span>PROTOKOLL</span>' + (erg.kurz || 'abgeschlossen') + '</div>' : '')
    + '<button type="button" class="lab-los" id="labLos">' + (erg ? 'Noch einmal durchführen' : 'Versuch beginnen') + '</button></div>'
    + '<h3 class="lab-h">Archiv</h3><div class="lab-archiv">' + (archiv.length ? archiv.map((a) => { const f = st.fertig[a.e.id]; return '<button type="button" class="lab-archiv-eintrag" data-id="' + a.e.id + '"><span class="lab-nr">Nº ' + String(a.i + 1).padStart(2, '0') + '</span><b>' + a.e.emoji + ' ' + a.e.titel + '</b><small>KW ' + a.kw + (f ? ' · ✓ ' + (f.kurz || '') : ' · nicht durchgeführt') + '</small></button>'; }).join('') : '<p class="lab-leer">Das ist die erste Versuchswoche.</p>') + '</div>'
    + '<p class="lab-fein">Ein neues Experiment erscheint jeden Montag um 0:00 Uhr (deutsche Zeit). Ältere Versuche bleiben im Archiv spielbar.</p>';
  $('labLos').addEventListener('click', () => labStart(jetzt));
  $('labInhalt').querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => labStart(LAB_EXPERIMENTE.find((e) => e.id === b.dataset.id))));
}
function labStart(e) {
  if (e.art === 'spiel') {
    const st = labStand(); st.wartet = { id: e.id, seit: Date.now() }; saveJson(SK_EXP_KEY, st);
    zeigeHub(); setTimeout(() => $(e.hub).click(), 60);
    return;
  }
  const box = $('labInhalt');
  box.innerHTML = '<div class="lab-versuch" id="labVersuch"></div>';
  e.start($('labVersuch'), (ergebnis) => labFertig(e, ergebnis));
  window.scrollTo(0, 0);
}
function labFertig(e, ergebnis) {
  const st = labStand(), erstes = !st.fertig[e.id];
  const eintrag = { datum: skDatum(), kurz: ergebnis.kurz, werte: ergebnis.werte || null };
  st.fertig[e.id] = st.fertig[e.id] || eintrag;
  if (!erstes) st.fertig[e.id] = { ...st.fertig[e.id], letzt: eintrag };
  st.laeufe.push({ id: e.id, ...eintrag });
  st.laeufe = st.laeufe.slice(-60);
  delete st.wartet;
  saveJson(SK_EXP_KEY, st);
  if (typeof merkeVerlauf === 'function') { /* Experimente zählen nicht als Spielrunde – nur XP über das Fortschrittssystem */ }
  if (ergebnis.html !== undefined) {
    $('labInhalt').innerHTML = '<div class="lab-auswertung"><div class="lab-kopf"><span>AUSWERTUNG</span><span>' + e.titel + '</span></div>' + ergebnis.html
      + '<div class="lab-knoepfe"><button type="button" class="lab-los" id="labKarte">📤 Ergebnis-Karte</button><button type="button" class="lab-zweit" id="labZurUebersicht">Zum Labor</button></div></div>';
    $('labKarte').addEventListener('click', () => skKarteZeigen({ titel: e.titel, emoji: e.emoji === '◐' ? '🧪' : e.emoji, zeilen: ergebnis.zeilen || [['Experiment', 'durchgeführt']], hinweis: ergebnis.karte || '', farbe: '#5eead4' }));
    $('labZurUebersicht').addEventListener('click', labUebersicht);
  }
  if (erstes) skToast('🧪 <b>Experiment abgeschlossen</b><br><small>' + e.titel + ' · +40 XP</small>');
  setTimeout(() => skErfolgePruefen(true), 800);
}
// vorhandenes Spiel als Experiment: Abschluss kommt über den Verlauf
function labNachSpiel(spiel) {
  const st = labStand();
  if (!st.wartet) return;
  const e = LAB_EXPERIMENTE.find((x) => x.id === st.wartet.id);
  if (!e || e.spiel !== spiel) return;
  labFertig(e, { kurz: 'ein Leben gelebt' });
}

// ---------- Experiment: Das Grau, das lügt (Simultankontrast) ----------
// Links liegt ein graues Feld auf einem farbigen Grund, rechts stellst du auf neutralem Grund dasselbe Grau ein.
// Eine Runde (neutraler Grund) ist die Kontrolle. Am Ende werden die Gründe entfernt – dann sieht man, wie gleich die Felder waren.
const LAB_GRUENDE = [['#0b0b0b', 'Schwarz'], ['#f5f5f5', 'Weiß'], ['#7a7a7a', 'Neutral (Kontrolle)'], ['#1e3a8a', 'Dunkelblau'], ['#facc15', 'Gelb'], ['#2a2a2a', 'Fast schwarz']];
function labGrau(box, fertig) {
  const runden = LAB_GRUENDE.map((g, i) => ({ grund: g[0], name: g[1], ziel: [52, 48, 50, 55, 46, 58][i] }));
  const folge = [0, 1, 2, 3, 4, 5];   // feste Reihenfolge – gleich für alle
  let i = 0;
  const ergebnisse = [];
  const runde = () => {
    const r = runden[folge[i]];
    box.innerHTML = '<div class="lab-kopf"><span>VERSUCH ' + (i + 1) + ' / ' + runden.length + '</span><span>◐ Das Grau, das lügt</span></div>'
      + '<p class="lab-anleitung">Stell rechts genau das Grau ein, das du links in der Mitte siehst.</p>'
      + '<div class="lab-grau"><div class="lab-feld" style="background:' + r.grund + '"><i style="background:hsl(0 0% ' + r.ziel + '%)"></i></div>'
      + '<div class="lab-feld" style="background:#7a7a7a"><i id="labDu"></i></div></div>'
      + '<input type="range" min="10" max="90" step="0.5" value="' + (i % 2 ? 30 : 70) + '" id="labRegler" class="lab-regler" aria-label="Helligkeit einstellen">'
      + '<button type="button" class="lab-los" id="labGleich">Sieht gleich aus</button>';
    const reg = $('labRegler'), du = $('labDu');
    const zeig = () => { du.style.background = 'hsl(0 0% ' + reg.value + '%)'; };
    reg.addEventListener('input', zeig); zeig();
    $('labGleich').addEventListener('click', () => {
      ergebnisse.push({ name: r.name, grund: r.grund, ziel: r.ziel, gewaehlt: Number(reg.value), abw: Number(reg.value) - r.ziel });
      i++;
      if (i < runden.length) runde(); else aufloesen();
    });
  };
  const aufloesen = () => {
    const kontrolle = ergebnisse.find((e) => e.grund === '#7a7a7a'), illu = ergebnisse.filter((e) => e !== kontrolle);
    const mittel = illu.reduce((a, e) => a + Math.abs(e.abw), 0) / illu.length;
    const dunkel = ergebnisse.filter((e) => ['#0b0b0b', '#1e3a8a', '#2a2a2a'].includes(e.grund)), hell = ergebnisse.filter((e) => ['#f5f5f5', '#facc15'].includes(e.grund));
    const dAbw = dunkel.reduce((a, e) => a + e.abw, 0) / dunkel.length, hAbw = hell.reduce((a, e) => a + e.abw, 0) / hell.length;
    const getaeuscht = dAbw > 1.5 && hAbw < -1.5;
    box.innerHTML = '<div class="lab-kopf"><span>AUFLÖSUNG</span><span>◐ Das Grau, das lügt</span></div><p class="lab-anleitung">Jetzt nehmen wir die Hintergründe weg.</p>'
      + '<div class="lab-reihe">' + ergebnisse.map((e) => '<div class="lab-paar"><div class="lab-mini lab-weg" style="--g:' + e.grund + '"><i style="background:hsl(0 0% ' + e.ziel + '%)"></i></div><div class="lab-mini" style="--g:#7a7a7a"><i style="background:hsl(0 0% ' + e.gewaehlt + '%)"></i></div><small>' + e.name + '<br>' + (e.abw > 0 ? '+' : '') + fmt(Math.round(e.abw * 10) / 10) + ' %</small></div>').join('') + '</div>';
    setTimeout(() => {
      fertig({
        kurz: 'Ø ' + fmt(Math.round(mittel * 10) / 10) + ' % daneben' + (getaeuscht ? ' · Kontrast-Effekt gezeigt' : ''),
        werte: { mittel, dunkel: dAbw, hell: hAbw, kontrolle: kontrolle.abw },
        zeilen: [['Ø Abweichung', fmt(Math.round(mittel * 10) / 10) + ' %'], ['auf dunklem Grund', (dAbw > 0 ? '+' : '') + fmt(Math.round(dAbw * 10) / 10) + ' %'], ['auf hellem Grund', (hAbw > 0 ? '+' : '') + fmt(Math.round(hAbw * 10) / 10) + ' %']],
        karte: getaeuscht ? 'Mein Gehirn hat mich angelogen.' : 'Mich hat das Grau nicht reingelegt.',
        html: '<div class="lab-reihe">' + ergebnisse.map((e) => '<div class="lab-paar"><div class="lab-mini" style="--g:#7a7a7a"><i style="background:hsl(0 0% ' + e.ziel + '%)"></i></div><div class="lab-mini" style="--g:#7a7a7a"><i style="background:hsl(0 0% ' + e.gewaehlt + '%)"></i></div><small>' + e.name + '<br>' + (e.abw > 0 ? '+' : '') + fmt(Math.round(e.abw * 10) / 10) + ' %</small></div>').join('') + '</div>'
          + '<p class="lab-text">Links jeweils das echte Grau, rechts deine Einstellung – jetzt beide auf demselben Grund. ' + (getaeuscht
            ? 'Auf dunklem Grund hast du das Grau im Schnitt <b>' + fmt(Math.round(dAbw * 10) / 10) + ' %</b> zu hell eingestellt, auf hellem Grund <b>' + fmt(Math.round(-hAbw * 10) / 10) + ' %</b> zu dunkel. Genau das sagt die Theorie voraus.'
            : 'Deine Einstellungen waren ziemlich unabhängig vom Grund – ungewöhnlich gut. Bei den meisten Menschen wirkt Grau auf dunklem Grund heller und auf hellem dunkler.') + '</p>'
          + '<p class="lab-text"><b>Simultankontrast:</b> Das Auge misst keine absolute Helligkeit, sondern Unterschiede zur Umgebung. Nervenzellen in der Netzhaut hemmen ihre Nachbarn (laterale Hemmung) – so werden Kanten betont, aber derselbe Farbton sieht je nach Umgebung anders aus. Die Kontrollrunde auf neutralem Grund zeigt, wie genau du ohne Täuschung bist: ' + (kontrolle.abw > 0 ? '+' : '') + fmt(Math.round(kontrolle.abw * 10) / 10) + ' %.</p>',
      });
    }, 2600);
  };
  runde();
}

// ---------- Experiment: Der Anker im Kopf (Ankereffekt) ----------
// Vor jeder Schätzfrage steht eine Vorfrage mit einer Zahl („mehr oder weniger als …?“). Die Hälfte der Zahlen ist viel zu hoch,
// die Hälfte viel zu niedrig – welche, wird für dich zufällig verteilt. Am Ende vergleichen wir deine Schätzungen nach hohen und niedrigen Ankern.
const LAB_FRAGEN = [
  { q: 'Wie hoch ist der Triglav, Sloweniens höchster Berg?', e: 'Meter', w: 2864 },
  { q: 'Wie lang ist die Elbe?', e: 'Kilometer', w: 1094 },
  { q: 'Wie viele Knochen hat ein erwachsener Mensch?', e: 'Knochen', w: 206 },
  { q: 'Wie hoch ist der Kölner Dom?', e: 'Meter', w: 157 },
  { q: 'In welchem Jahr wurde die Universität Heidelberg gegründet?', e: '(Jahr)', w: 1386, jahr: true },
  { q: 'Wie viele Tasten hat ein Klavier?', e: 'Tasten', w: 88 },
];
function labAnker(box, fertig) {
  const rund = (v) => { const s = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 1)); return Math.round(v / s) * s; };
  const hoch = LAB_FRAGEN.map((_, i) => i % 2 === 0);
  for (let i = hoch.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [hoch[i], hoch[j]] = [hoch[j], hoch[i]]; }
  const fragen = LAB_FRAGEN.map((f, i) => ({ ...f, hoch: hoch[i], anker: f.jahr ? (hoch[i] ? 1790 : 980) : rund(f.w * (hoch[i] ? 1.9 + Math.random() * 0.5 : 0.38 + Math.random() * 0.15)) }));
  let i = 0;
  const schritt = () => {
    const f = fragen[i];
    box.innerHTML = '<div class="lab-kopf"><span>FRAGE ' + (i + 1) + ' / ' + fragen.length + '</span><span>⚓ Der Anker im Kopf</span></div>'
      + '<p class="lab-frage-gross">' + f.q + '</p><p class="lab-anleitung">Vorfrage: ' + (f.jahr ? 'Vor oder nach dem Jahr' : 'Mehr oder weniger als') + ' <b>' + fmt(f.anker) + '</b>' + (f.jahr ? '' : ' ' + f.e) + '?</p>'
      + '<div class="lab-knoepfe"><button type="button" class="lab-zweit" data-v="w">' + (f.jahr ? 'Davor' : 'Weniger') + '</button><button type="button" class="lab-zweit" data-v="m">' + (f.jahr ? 'Danach' : 'Mehr') + '</button></div>';
    box.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => {
      box.innerHTML = '<div class="lab-kopf"><span>FRAGE ' + (i + 1) + ' / ' + fragen.length + '</span><span>⚓ Der Anker im Kopf</span></div>'
        + '<p class="lab-frage-gross">' + f.q + '</p><p class="lab-anleitung">Und jetzt deine Schätzung:</p>'
        + '<div class="lab-eingabe"><input type="number" inputmode="decimal" id="labZahl" aria-label="Deine Schätzung"><span>' + f.e + '</span></div><button type="button" class="lab-los" id="labOk" disabled>Weiter</button>';
      const inp = $('labZahl');
      inp.addEventListener('input', () => { $('labOk').disabled = !(Number(inp.value) > 0); });
      inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && Number(inp.value) > 0) $('labOk').click(); });
      setTimeout(() => inp.focus(), 50);
      $('labOk').addEventListener('click', () => { f.schaetzung = Number(inp.value); i++; if (i < fragen.length) schritt(); else auswerten(); });
    }));
  };
  const auswerten = () => {
    // Abweichung als Verhältnis zur Wahrheit (bei Jahreszahlen: Abstand in Jahren relativ zu 500 Jahren)
    const abw = (f) => (f.jahr ? (f.schaetzung - f.w) / 500 : Math.log(f.schaetzung / f.w));
    const H = fragen.filter((f) => f.hoch), N = fragen.filter((f) => !f.hoch);
    const mH = H.reduce((a, f) => a + abw(f), 0) / H.length, mN = N.reduce((a, f) => a + abw(f), 0) / N.length;
    const effekt = Math.round((Math.exp(mH - mN) - 1) * 100);
    fertig({
      kurz: effekt > 10 ? 'Anker zog um ' + effekt + ' %' : 'kaum beeinflusst',
      werte: { effekt, mH, mN },
      zeilen: [['Schätzungen nach hohem Anker', (mH >= 0 ? '+' : '') + Math.round((Math.exp(mH) - 1) * 100) + ' %'], ['nach niedrigem Anker', (mN >= 0 ? '+' : '') + Math.round((Math.exp(mN) - 1) * 100) + ' %']],
      karte: effekt > 10 ? 'Eine bedeutungslose Zahl hat mich um ' + effekt + ' % verschoben.' : 'Ich bin ankerfest.',
      html: '<p class="lab-text">Die Vorfragen waren keine Hinweise: Die Zahlen waren absichtlich <b>viel zu hoch</b> oder <b>viel zu niedrig</b> – für dich zufällig verteilt.</p>'
        + '<table class="lab-tabelle"><tr><th>Frage</th><th>Anker</th><th>Du</th><th>Richtig</th></tr>' + fragen.map((f) => '<tr class="' + (f.hoch ? 'hoch' : 'tief') + '"><td>' + f.q.replace(/\?$/, '') + '</td><td>' + (f.hoch ? '▲ ' : '▼ ') + fmt(f.anker) + '</td><td>' + fmt(f.schaetzung) + '</td><td>' + fmt(f.w) + '</td></tr>').join('') + '</table>'
        + '<p class="lab-text">' + (effekt > 10 ? 'Nach einem hohen Anker lagen deine Schätzungen im Schnitt <b>' + effekt + ' % höher</b> als nach einem niedrigen – obwohl die Vorfrage nichts mit der Antwort zu tun hatte.'
          : effekt < -10 ? 'Spannend: Bei dir war es umgekehrt – nach hohen Ankern hast du eher niedriger geschätzt. Vielleicht hast du bewusst gegengesteuert?' : 'Deine Schätzungen hingen kaum vom Anker ab. Bei sechs Fragen ist das allerdings auch ein Stück Zufall.') + '</p>'
        + '<p class="lab-text"><b>Ankereffekt:</b> Eine Zahl, die wir gerade gesehen haben, wirkt als Ausgangspunkt – wir passen von dort aus an, aber zu wenig. Amos Tversky und Daniel Kahneman haben das 1974 beschrieben; es wirkt bei Preisen, Gehaltsverhandlungen und sogar bei Gerichtsurteilen. Mit sechs Fragen ist dein Ergebnis nur ein Hinweis, kein Messwert.</p>',
    });
  };
  schritt();
}

$('labZurueck').addEventListener('click', () => { if ($('labVersuch')) { labUebersicht(); return; } zeigeHub(); });
