// 🎲 Zufalls-Gefühl: Wahrscheinlichkeiten schätzen – und dann 1000-mal live nachprüfen.
// Fünf Runden (bis 50 Punkte). Nach jedem Tipp läuft eine Simulation: Die Trefferquote pendelt sich sichtbar beim echten Wert ein
// (Gesetz der großen Zahlen). Danach der Rechenweg mit Bild: 6×6-Würfeltafel, Baumdiagramm, Pascal-Balken, Gegenwahrscheinlichkeit …
const ZF_KEY = 'walquiz.zufall.v1';
const ZF_RUNDEN = 5;
const ZF_VERSUCHE = 1000;
const ZF_STUFEN = {
  leicht: { name: 'Leicht', arten: ['sechs', 'summe', 'muenze', 'urneMit'], text: 'Würfel, Münzen, Kugeln' },
  mittel: { name: 'Mittel', arten: ['sechs', 'summe', 'muenze', 'urne', 'karten'], text: 'Ohne Zurücklegen, Karten' },
  profi: { name: 'Profi', arten: ['geburtstag', 'serie', 'ziege', 'karten', 'urne', 'muenze'], text: 'Geburtstage, Serien, Ziegen' },
};
const WUERFEL = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const zfProz = (p) => fmt(Math.round(p * 1000) / 10) + ' %';
const zfBinom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
const zfW = (rnd) => 1 + Math.floor(rnd() * 6);
const zfMischen = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Bilder für den Rechenweg ----------
// 6×6-Tafel aller Würfelpaare, markiert nach Bedingung
function zfTafel(passt, klein) {
  let h = '<div class="zf-tafel' + (klein ? ' klein' : '') + '"><span></span>' + WUERFEL.map((w) => '<span class="kopf">' + w + '</span>').join('');
  for (let a = 1; a <= 6; a++) {
    h += '<span class="kopf">' + WUERFEL[a - 1] + '</span>';
    for (let b = 1; b <= 6; b++) h += '<span class="' + (passt(a, b) ? 'an' : '') + '">' + (a + b) + '</span>';
  }
  return h + '</div>';
}
// Balken der Binomialverteilung (n Münzen), markierte Balken = Treffer
function zfBalken(n, markiert) {
  const w = Array.from({ length: n + 1 }, (_, k) => zfBinom(n, k)), max = Math.max(...w);
  return '<div class="zf-balken">' + w.map((v, k) => '<div class="' + (markiert(k) ? 'an' : '') + '"><i style="height:' + (v / max * 100) + '%"></i><small>' + k + '</small><em>' + v + '</em></div>').join('') + '</div>'
    + '<div class="zf-unter">Anzahl Kopf · darunter: Wege, wie es passieren kann (zusammen ' + (2 ** n) + ')</div>';
}
// Baumdiagramm für zweimal Ziehen (r rot, b blau), Pfad „hervor“ wird hervorgehoben
function zfBaum(r, b, mit, hervor) {
  const n = r + b, B = (z, nn) => z + '/' + nn;
  const ast1 = [['R', B(r, n)], ['B', B(b, n)]];
  const ast2 = (erst) => mit ? [['R', B(r, n)], ['B', B(b, n)]] : erst === 'R' ? [['R', B(r - 1, n - 1)], ['B', B(b, n - 1)]] : [['R', B(r, n - 1)], ['B', B(b - 1, n - 1)]];
  const X = [20, 120, 230], Y1 = [60, 180], Y2 = [[25, 95], [145, 215]];
  let s = '<svg class="zf-baum" viewBox="0 0 300 240">';
  ast1.forEach(([f1, p1], i) => {
    const an1 = hervor.some((h) => h[0] === f1);
    s += '<path class="' + (an1 ? 'an' : '') + '" d="M' + X[0] + ' 120L' + X[1] + ' ' + Y1[i] + '"/><text x="' + ((X[0] + X[1]) / 2 - 4) + '" y="' + ((120 + Y1[i]) / 2 + (i ? 16 : -6)) + '">' + p1 + '</text>';
    s += '<circle class="k ' + f1 + '" cx="' + X[1] + '" cy="' + Y1[i] + '" r="11"/>';
    ast2(f1).forEach(([f2, p2], j) => {
      const an2 = hervor.includes(f1 + f2);
      s += '<path class="' + (an2 ? 'an' : '') + '" d="M' + X[1] + ' ' + Y1[i] + 'L' + X[2] + ' ' + Y2[i][j] + '"/><text x="' + ((X[1] + X[2]) / 2 - 2) + '" y="' + ((Y1[i] + Y2[i][j]) / 2 + (j ? 14 : -5)) + '">' + p2 + '</text>';
      s += '<circle class="k ' + f2 + '" cx="' + X[2] + '" cy="' + Y2[i][j] + '" r="11"/><text class="end' + (an2 ? ' an' : '') + '" x="' + (X[2] + 18) + '" y="' + (Y2[i][j] + 5) + '">' + f1 + f2 + '</text>';
    });
  });
  return s + '<circle class="k start" cx="' + X[0] + '" cy="120" r="6"/></svg>';
}
// Kurve p(n) mit Markierung (z. B. Geburtstage)
function zfKurve(f, nMax, nMarke, xText) {
  const W = 300, H = 160, P = 36, sx = (n) => P + (n - 1) / (nMax - 1) * (W - P - 8), sy = (p) => H - P - p * (H - P - 10);
  let d = '';
  for (let n = 1; n <= nMax; n++) d += (n > 1 ? 'L' : 'M') + sx(n).toFixed(1) + ' ' + sy(f(n)).toFixed(1);
  return '<svg class="zf-kurve" viewBox="0 0 ' + W + ' ' + H + '"><path class="achse" d="M' + P + ' ' + (H - P) + 'H' + (W - 4) + 'M' + P + ' ' + (H - P) + 'V6"/>'
    + '<path class="halb" d="M' + P + ' ' + sy(0.5) + 'H' + (W - 4) + '"/><text x="' + (P - 4) + '" y="' + (sy(0.5) + 4) + '" text-anchor="end">50%</text>'
    + '<text x="' + (P - 4) + '" y="' + (sy(1) + 4) + '" text-anchor="end">100%</text>'
    + '<path class="linie" d="' + d + '"/>' + (nMarke ? '<circle cx="' + sx(nMarke) + '" cy="' + sy(f(nMarke)) + '" r="6"/><text class="marke" x="' + sx(nMarke) + '" y="' + (sy(f(nMarke)) - 12) + '" text-anchor="middle">' + nMarke + ': ' + zfProz(f(nMarke)) + '</text>' : '')
    + '<text x="' + (W - 6) + '" y="' + (H - 6) + '" text-anchor="end">' + xText + '</text></svg>';
}
const zfGeburtstag = (n) => { let q = 1; for (let i = 0; i < n; i++) q *= (365 - i) / 365; return 1 - q; };
// Wahrscheinlichkeit, dass in n fairen Würfen irgendwo L-mal Kopf hintereinander kommt (Zustand = aktuelle Kopf-Serie)
function zfSerie(n, L) {
  let z = Array(L).fill(0), fertig = 0;
  z[0] = 1;
  for (let i = 0; i < n; i++) {
    const neu = Array(L).fill(0);
    z.forEach((p, s) => { neu[0] += p / 2; if (s + 1 >= L) fertig += p / 2; else neu[s + 1] += p / 2; });
    z = neu;
  }
  return fertig;
}

// ---------- Aufgaben ----------
// gen(rng) → { emoji, frage, p, versuch(rnd) → { ok, txt }, schritte[], bild }
const ZF_ARTEN = {
  sechs: (rng) => {
    const n = [2, 3, 4, 6, 8][Math.floor(rng() * 5)], keine = (5 / 6) ** n;
    return { emoji: '🎲', frage: 'Du würfelst <b>' + n + '-mal</b>. Wie wahrscheinlich ist <b>mindestens eine 6</b>?', p: 1 - keine,
      versuch: (rnd) => { const w = Array.from({ length: n }, () => zfW(rnd)); return { ok: w.includes(6), txt: w.map((v) => WUERFEL[v - 1]).join('') }; },
      schritte: ['„Mindestens eine“ ist schwer direkt zu zählen. Der Trick: Rechne das <b>Gegenteil</b> aus, also <b>keine einzige 6</b>.',
        'Keine 6 bei einem Wurf: <b>5/6</b>. Bei ' + n + ' Würfen muss das jedes Mal klappen: Wahrscheinlichkeiten von „und“ werden <b>multipliziert</b>.',
        '(5/6)<sup>' + n + '</sup> = <b>' + zfProz(keine) + '</b> für keine 6.',
        'Also mindestens eine 6: 100 % − ' + zfProz(keine) + ' = <b>' + zfProz(1 - keine) + '</b>.'],
      bild: '<div class="zf-kette">' + Array.from({ length: n }, () => '<span>5/6</span>').join('<i>×</i>') + '<i>=</i><b>' + zfProz(keine) + '</b></div>'
        + '<div class="zf-teilung"><div style="width:' + (keine * 100) + '%">keine 6<br>' + zfProz(keine) + '</div><div class="an">mind. eine 6<br>' + zfProz(1 - keine) + '</div></div>' };
  },
  summe: (rng) => {
    const varianten = [
      () => { const s = [7, 8, 6, 10, 11, 12, 4][Math.floor(rng() * 7)]; return ['die Augensumme <b>genau ' + s + '</b>', (a, b) => a + b === s, 'Summe ' + s]; },
      () => { const s = [9, 10, 8][Math.floor(rng() * 3)]; return ['die Augensumme <b>mindestens ' + s + '</b>', (a, b) => a + b >= s, 'Summe ≥ ' + s]; },
      () => ['ein <b>Pasch</b> (zwei gleiche Zahlen)', (a, b) => a === b, 'Pasch'],
      () => ['<b>mindestens eine 6</b> dabei', (a, b) => a === 6 || b === 6, 'mind. eine 6'],
    ];
    const [text, passt, kurz] = varianten[Math.floor(rng() * varianten.length)]();
    let z = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (passt(a, b)) z++;
    return { emoji: '🎲🎲', frage: 'Du wirfst <b>zwei Würfel</b>. Wie wahrscheinlich ist ' + text + '?', p: z / 36,
      versuch: (rnd) => { const a = zfW(rnd), b = zfW(rnd); return { ok: passt(a, b), txt: WUERFEL[a - 1] + WUERFEL[b - 1] }; },
      schritte: ['Zwei Würfel haben <b>6 × 6 = 36</b> gleich wahrscheinliche Ergebnisse. Die Tafel zeigt alle, mit der Augensumme in jedem Feld.',
        'Markiert sind die Felder, die passen (' + kurz + '): <b>' + z + '</b> Stück.',
        'Günstige durch mögliche: ' + z + '/36 = <b>' + zfProz(z / 36) + '</b>.'],
      bild: zfTafel(passt) };
  },
  muenze: (rng) => {
    const n = [3, 4, 5, 6, 8, 10][Math.floor(rng() * 6)];
    const art = rng();
    let text, passt;
    if (art < 0.55) { const k = Math.round(n / 2) + (rng() < 0.3 ? 1 : 0); text = '<b>genau ' + k + '-mal Kopf</b>'; passt = (x) => x === k; }
    else if (art < 0.8) { text = '<b>immer dieselbe Seite</b> (nur Kopf oder nur Zahl)'; passt = (x) => x === 0 || x === n; }
    else { const k = Math.ceil(n * 0.7); text = '<b>mindestens ' + k + '-mal Kopf</b>'; passt = (x) => x >= k; }
    let wege = 0; for (let k = 0; k <= n; k++) if (passt(k)) wege += zfBinom(n, k);
    return { emoji: '🪙', frage: 'Du wirfst eine Münze <b>' + n + '-mal</b>. Wie wahrscheinlich ist ' + text + '?', p: wege / 2 ** n,
      versuch: (rnd) => { const f = Array.from({ length: n }, () => rnd() < 0.5); return { ok: passt(f.filter(Boolean).length), txt: f.map((k) => (k ? 'K' : 'Z')).join('') }; },
      schritte: ['Jeder Wurf hat 2 Ausgänge, bei ' + n + ' Würfen gibt es also 2<sup>' + n + '</sup> = <b>' + (2 ** n) + '</b> gleich wahrscheinliche Folgen.',
        'Wie viele Folgen passen? Das zählen die Balken (Pascalsches Dreieck): zusammen <b>' + wege + '</b>.',
        wege + '/' + (2 ** n) + ' = <b>' + zfProz(wege / 2 ** n) + '</b>.' + (n >= 6 && text.includes('genau') ? ' Überraschend wenig: Genau die Hälfte ist zwar das Häufigste, aber trotzdem nicht sehr wahrscheinlich.' : '')],
      bild: zfBalken(n, passt) };
  },
  urneMit: (rng) => {
    const r = 2 + Math.floor(rng() * 4), b = 2 + Math.floor(rng() * 4), n = r + b;
    return { emoji: '🔴🔵', frage: 'In einem Beutel sind <b>' + r + ' rote</b> und <b>' + b + ' blaue</b> Kugeln. Du ziehst eine, legst sie <b>zurück</b> und ziehst noch eine. Wie wahrscheinlich sind <b>beide rot</b>?',
      p: (r / n) ** 2,
      versuch: (rnd) => { const a = rnd() < r / n, c = rnd() < r / n; return { ok: a && c, txt: (a ? '🔴' : '🔵') + (c ? '🔴' : '🔵') }; },
      schritte: ['Beim ersten Ziehen: ' + r + ' von ' + n + ' Kugeln sind rot → <b>' + r + '/' + n + '</b>.',
        'Die Kugel kommt zurück, beim zweiten Mal ist es also wieder ' + r + '/' + n + '.',
        'Erst rot <b>und</b> dann rot → entlang des Pfads im Baum <b>multiplizieren</b>: ' + r + '/' + n + ' × ' + r + '/' + n + ' = <b>' + zfProz((r / n) ** 2) + '</b>.'],
      bild: zfBaum(r, b, true, ['RR']) };
  },
  urne: (rng) => {
    const r = 2 + Math.floor(rng() * 4), b = 2 + Math.floor(rng() * 4), n = r + b;
    const beide = rng() < 0.5;
    const p = beide ? r / n * (r - 1) / (n - 1) : 2 * r * b / (n * (n - 1));
    return { emoji: '🔴🔵', frage: 'In einem Beutel sind <b>' + r + ' rote</b> und <b>' + b + ' blaue</b> Kugeln. Du ziehst <b>zwei auf einmal</b> (ohne Zurücklegen). Wie wahrscheinlich ist ' + (beide ? '<b>beide rot</b>' : '<b>eine von jeder Farbe</b>') + '?',
      p,
      versuch: (rnd) => { const k = zfMischen([...Array(r).fill('🔴'), ...Array(b).fill('🔵')], rnd).slice(0, 2); return { ok: beide ? k[0] === '🔴' && k[1] === '🔴' : k[0] !== k[1], txt: k.join('') }; },
      schritte: beide
        ? ['Erste Kugel rot: <b>' + r + '/' + n + '</b>.', 'Ohne Zurücklegen sind dann nur noch ' + (r - 1) + ' rote unter ' + (n - 1) + ' Kugeln: <b>' + (r - 1) + '/' + (n - 1) + '</b>.',
          'Pfad entlang multiplizieren: ' + r + '/' + n + ' × ' + (r - 1) + '/' + (n - 1) + ' = <b>' + zfProz(p) + '</b>.']
        : ['Zwei Pfade passen: erst rot, dann blau <b>oder</b> erst blau, dann rot.',
          'Rot-Blau: ' + r + '/' + n + ' × ' + b + '/' + (n - 1) + ' · Blau-Rot: ' + b + '/' + n + ' × ' + r + '/' + (n - 1) + ' (beide gleich groß).',
          'Verschiedene Pfade werden <b>addiert</b>: zusammen <b>' + zfProz(p) + '</b>.'],
      bild: zfBaum(r, b, false, beide ? ['RR'] : ['RB', 'BR']) };
  },
  karten: (rng) => {
    const v = Math.floor(rng() * 3);
    if (v === 0) return { emoji: '🃏', frage: 'Aus einem gemischten Kartenspiel (52 Karten) ziehst du <b>2 Karten</b>. Wie wahrscheinlich sind <b>beide Herz ♥</b>?',
      p: 13 / 52 * 12 / 51,
      versuch: (rnd) => { const a = Math.floor(rnd() * 52), b0 = Math.floor(rnd() * 51), b = b0 >= a ? b0 + 1 : b0; const h = (k) => k % 4 === 0; return { ok: h(a) && h(b), txt: (h(a) ? '♥' : '♠') + (h(b) ? '♥' : '♠') }; },
      schritte: ['13 der 52 Karten sind Herz → erste Karte Herz: <b>13/52 = 1/4</b>.', 'Danach sind noch 12 Herz unter 51 Karten: <b>12/51</b>.',
        '1/4 × 12/51 = <b>' + zfProz(13 / 52 * 12 / 51) + '</b>. Das ist etwas weniger als 1/4 × 1/4, weil die erste Herzkarte fehlt.'],
      bild: '<div class="zf-kette"><span>13/52</span><i>×</i><span>12/51</span><i>=</i><b>' + zfProz(13 / 52 * 12 / 51) + '</b></div>' };
    if (v === 1) { const keinAss = zfBinom(48, 5) / zfBinom(52, 5);
      return { emoji: '🃏', frage: 'Du bekommst <b>5 Karten</b> aus 52. Wie wahrscheinlich ist <b>mindestens ein Ass</b> dabei?', p: 1 - keinAss,
        versuch: (rnd) => { const d = zfMischen(Array.from({ length: 52 }, (_, i) => i), rnd).slice(0, 5); const n = d.filter((k) => k < 4).length; return { ok: n > 0, txt: n ? n + '× A' : '–' }; },
        schritte: ['Wieder der Trick mit dem Gegenteil: Wie wahrscheinlich ist <b>kein</b> Ass?', 'Karte für Karte: 48/52 × 47/51 × 46/50 × 45/49 × 44/48 = <b>' + zfProz(keinAss) + '</b>.',
          'Mindestens ein Ass: 100 % − ' + zfProz(keinAss) + ' = <b>' + zfProz(1 - keinAss) + '</b>.'],
        bild: '<div class="zf-kette">' + ['48/52', '47/51', '46/50', '45/49', '44/48'].map((x) => '<span>' + x + '</span>').join('<i>×</i>') + '<i>=</i><b>' + zfProz(keinAss) + '</b></div>'
          + '<div class="zf-teilung"><div style="width:' + (keinAss * 100) + '%">kein Ass<br>' + zfProz(keinAss) + '</div><div class="an">mind. 1 Ass<br>' + zfProz(1 - keinAss) + '</div></div>' }; }
    return { emoji: '🃏', frage: 'Du ziehst <b>2 Karten</b> aus 52. Wie wahrscheinlich haben beide <b>dieselbe Farbe</b> (beide rot oder beide schwarz)?', p: 25 / 51,
      versuch: (rnd) => { const a = Math.floor(rnd() * 52), b0 = Math.floor(rnd() * 51), b = b0 >= a ? b0 + 1 : b0; const r = (k) => k % 2 === 0; return { ok: r(a) === r(b), txt: (r(a) ? '♥' : '♣') + (r(b) ? '♥' : '♣') }; },
      schritte: ['Die erste Karte ist egal, sie legt nur die Farbe fest.', 'Von den restlichen 51 Karten haben noch <b>25</b> diese Farbe (eine ist ja schon weg).',
        '25/51 = <b>' + zfProz(25 / 51) + '</b>: knapp unter 50 %! Viele tippen genau 50 %, aber die gezogene Karte fehlt im Stapel.'],
      bild: '<div class="zf-kette"><span>egal</span><i>×</i><span>25/51</span><i>=</i><b>' + zfProz(25 / 51) + '</b></div>' };
  },
  geburtstag: (rng) => {
    const n = [10, 15, 23, 30, 40, 50, 60][Math.floor(rng() * 7)], p = zfGeburtstag(n);
    return { emoji: '🎂', frage: 'In einem Raum sind <b>' + n + ' Menschen</b>. Wie wahrscheinlich haben <b>mindestens zwei am selben Tag</b> Geburtstag?', p,
      versuch: (rnd) => { const s = new Set(); let dop = false; for (let i = 0; i < n; i++) { const t = Math.floor(rnd() * 365); if (s.has(t)) dop = true; s.add(t); } return { ok: dop, txt: dop ? '🎂🎂' : '–' }; },
      schritte: ['Gegenteil: <b>alle haben verschiedene</b> Geburtstage. Person 2 muss einen anderen Tag haben als Person 1 (364/365), Person 3 einen anderen als beide (363/365) …',
        'Alles multipliziert: 365/365 × 364/365 × … × ' + (366 - n) + '/365 = <b>' + zfProz(1 - p) + '</b>.',
        'Also mindestens ein gemeinsamer Geburtstag: <b>' + zfProz(p) + '</b>. Der Grund: Es zählt <b>jedes Paar</b>, und bei ' + n + ' Leuten gibt es schon ' + (n * (n - 1) / 2) + ' Paare!'],
      bild: zfKurve(zfGeburtstag, 70, n, 'Personen') };
  },
  serie: (rng) => {
    const [n, L] = [[10, 4], [20, 4], [20, 5], [30, 5], [10, 3]][Math.floor(rng() * 5)], p = zfSerie(n, L);
    return { emoji: '🪙', frage: 'Du wirfst eine Münze <b>' + n + '-mal</b>. Wie wahrscheinlich kommt irgendwo <b>' + L + '-mal Kopf hintereinander</b>?', p,
      versuch: (rnd) => { let lauf = 0, ok = false, txt = ''; for (let i = 0; i < n; i++) { const k = rnd() < 0.5; lauf = k ? lauf + 1 : 0; if (lauf >= L) ok = true; if (i < 14) txt += k ? 'K' : 'Z'; } return { ok, txt: txt + (n > 14 ? '…' : '') }; },
      schritte: ['Eine bestimmte Stelle mit ' + L + '× Kopf hat nur (1/2)<sup>' + L + '</sup> = ' + zfProz(0.5 ** L) + '. Aber es gibt <b>viele mögliche Stellen</b>.',
        'Exakt rechnet man das Schritt für Schritt: Nach jedem Wurf merkt man sich, wie lang die aktuelle Kopf-Serie ist. Ergebnis: <b>' + zfProz(p) + '</b>.',
        'Die meisten unterschätzen Serien stark. Echte Zufallsfolgen sehen „verklumpter“ aus, als wir erwarten. Wer sich eine Zufallsfolge ausdenkt, wechselt zu oft.'],
      bild: zfKurve((m) => zfSerie(m, L), 40, n, 'Würfe (Serie von ' + L + ')') };
  },
  ziege: (rng) => {
    const wechseln = rng() < 0.65;
    return { emoji: '🚪🐐', frage: 'Hinter einer von 3 Türen steht ein Auto, hinter den anderen Ziegen. Du wählst eine Tür. Der Showmaster (er weiß alles) öffnet eine <b>andere</b> Tür mit einer Ziege. Du '
      + (wechseln ? '<b>wechselst</b> zur letzten Tür' : '<b>bleibst</b> bei deiner Tür') + '. Wie wahrscheinlich gewinnst du das Auto?', p: wechseln ? 2 / 3 : 1 / 3,
      versuch: (rnd) => { const auto = Math.floor(rnd() * 3), wahl = Math.floor(rnd() * 3); const gewinn = wechseln ? wahl !== auto : wahl === auto; return { ok: gewinn, txt: gewinn ? '🚗' : '🐐' }; },
      schritte: ['Deine erste Wahl trifft das Auto mit <b>1/3</b>, daran ändert das Öffnen nichts.',
        'In den anderen <b>2/3</b> der Fälle steht das Auto hinter einer der beiden anderen Türen. Der Showmaster öffnet genau die mit der Ziege, das Auto bleibt also hinter der letzten Tür.',
        wechseln ? 'Wechseln gewinnt also immer dann, wenn die erste Wahl falsch war: <b>2/3 ≈ 66,7 %</b>.' : 'Bleiben gewinnt nur, wenn die erste Wahl stimmte: <b>1/3 ≈ 33,3 %</b>. Wechseln wäre doppelt so gut!'],
      bild: '<div class="zf-tueren">' + [['🚗', '🐐', '🐐'], ['🐐', '🚗', '🐐'], ['🐐', '🐐', '🚗']].map((t, i) => '<div><span>Auto hinter Tür ' + (i + 1) + '</span><b>' + t.join(' ') + '</b><em>'
        + (i === 0 ? 'Du hast Tür 1: bleiben gewinnt' : 'Du hast Tür 1: wechseln gewinnt') + '</em></div>').join('') + '<p>Du wählst Tür 1. In 2 von 3 gleich wahrscheinlichen Fällen gewinnt Wechseln.</p></div>' };
  },
};

function zfRunden(seed, stufe) {
  const rng = zufallsGenerator(seed + '|' + stufe);
  const arten = zfMischen(ZF_STUFEN[stufe].arten.slice(), rng);
  while (arten.length < ZF_RUNDEN) arten.push(ZF_STUFEN[stufe].arten[Math.floor(rng() * ZF_STUFEN[stufe].arten.length)]);
  return arten.slice(0, ZF_RUNDEN).map((art) => ({ art, ...ZF_ARTEN[art](rng) }));
}
const zfPunkte = (p, tipp) => Math.round(10 * Math.max(0, 1 - Math.abs(tipp - p) / 0.25) * 10) / 10;

// ---------- Spielablauf ----------
let zf = null;
let zfStufe = 'leicht', zfGegner = null, zfLauf = 0, zfSofort = false;
const zfStore = () => loadJson(ZF_KEY);
const zfTeile = ['intro', 'spiel', 'aufloesung', 'ende', 'lernen'];
const zeigeZfTeil = (t) => zfTeile.forEach((x) => { $('zf-' + x).hidden = x !== t; });

function zufallIntro() {
  const st = zfStore(), best = st.best || {};
  $('zfStufen').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('on', b.dataset.stufe === zfStufe);
    b.querySelector('small').textContent = ZF_STUFEN[b.dataset.stufe].text;
  });
  $('zfBest').textContent = 'Bestwerte: ' + Object.entries(ZF_STUFEN).map(([k, v]) => v.name + ' ' + (best[k] != null ? fmt(best[k]) : '–')).join(' · ');
  const t = st.tag && st.tag[heute()];
  $('zfTagBtn').textContent = t != null ? '📅 Tages-Zufall – heute: ' + fmt(t) + ' / 50' : '📅 Tages-Zufall (heute für alle gleich)';
  $('zfRunde').textContent = '';
  zfLauf++;
  zfl = null;
  zeigeZfTeil('intro');
}

function zufallStart(opts = {}) {
  const stufe = opts.taeglich ? 'mittel' : opts.stufe || zfStufe;
  const seed = opts.seed || (opts.taeglich ? 'zf-' + heute() : String(Math.random()).slice(2));
  zf = { stufe, seed, taeglich: !!opts.taeglich, runden: zfRunden(seed, stufe), i: 0, punkte: [], tipps: [], gegner: opts.gegner || null };
  zfl = null;
  zfRundeZeigen();
}

function zfRundeZeigen() {
  const rd = zf.runden[zf.i];
  zfLauf++;
  $('zfRunde').textContent = '🎲 Runde ' + (zf.i + 1) + ' / ' + ZF_RUNDEN;
  zeigeZfTeil('spiel');
  $('zfEmoji').textContent = rd.emoji;
  $('zfFrage').innerHTML = rd.frage;
  const reg = $('zfRegler');
  reg.value = 50;
  const zeigen = () => { $('zfWert').textContent = reg.value + ' %'; reg.style.setProperty('--pos', reg.value + '%'); };
  reg.oninput = zeigen;
  zeigen();
}

// Simulation: ZF_VERSUCHE Versuche in ~2,6 s, mit Kurve der Trefferquote
function zfSimulation(rd, tipp, fertig) {
  const lauf = ++zfLauf;
  zfSofort = false;
  const W = 300, H = 150, P = 6, sx = (n) => P + n / ZF_VERSUCHE * (W - 2 * P), sy = (q) => H - P - q * (H - 2 * P);
  const box = $('zfSim');
  box.innerHTML = '<svg class="zf-sim" viewBox="0 0 ' + W + ' ' + H + '"><rect width="' + W + '" height="' + H + '" rx="10"/>'
    + '<path class="halb" d="M' + P + ' ' + sy(0.5) + 'H' + (W - P) + '"/><path class="tipp" d="M' + P + ' ' + sy(tipp) + 'H' + (W - P) + '"/>'
    + '<text class="tipp" x="' + (W - P - 4) + '" y="' + (sy(tipp) + (tipp > 0.85 ? 14 : -5)) + '" text-anchor="end">dein Tipp ' + zfProz(tipp) + '</text>'
    + '<path class="echt" id="zfEchtLinie" d="M' + P + ' ' + sy(rd.p) + 'H' + (W - P) + '" style="opacity:0"/><path class="quote" id="zfQuote" d=""/></svg>'
    + '<div class="zf-zaehler"><span id="zfZaehler">0 Versuche</span><b id="zfQuoteText">–</b></div><div class="zf-ticker" id="zfTicker"></div>';
  let n = 0, t = 0, d = '';
  const tick = [];
  const schritt = (anzahl) => {
    for (let i = 0; i < anzahl && n < ZF_VERSUCHE; i++) {
      const v = rd.versuch(Math.random);
      n++; if (v.ok) t++;
      if (n <= 20 || n % 5 === 0 || n === ZF_VERSUCHE) d += (d ? 'L' : 'M') + sx(n).toFixed(1) + ' ' + sy(t / n).toFixed(1);
      tick.push(v);
      if (tick.length > 6) tick.shift();
    }
    $('zfQuote').setAttribute('d', d);
    $('zfZaehler').textContent = n + ' Versuche · ' + t + ' Treffer';
    $('zfQuoteText').textContent = zfProz(t / n);
    $('zfTicker').innerHTML = tick.map((v) => '<span class="' + (v.ok ? 'ok' : '') + '">' + v.txt + '</span>').join('');
  };
  if (wenigBewegung()) { schritt(ZF_VERSUCHE); $('zfEchtLinie').style.opacity = 1; fertig(t / n); return; }
  const start = performance.now();
  const frame = (jetzt) => {
    if (lauf !== zfLauf) return;
    // langsam beginnen (man sieht einzelne Versuche), dann immer schneller
    const ziel = zfSofort ? ZF_VERSUCHE : Math.min(ZF_VERSUCHE, Math.round(ZF_VERSUCHE * ((jetzt - start) / 2600) ** 2.2));
    schritt(Math.max(1, ziel - n));
    if (n < ZF_VERSUCHE) requestAnimationFrame(frame);
    else { $('zfEchtLinie').style.opacity = 1; fertig(t / n); }
  };
  requestAnimationFrame(frame);
}

function zfAuswerten() {
  const rd = zf.runden[zf.i], tipp = Number($('zfRegler').value) / 100;
  const p = zfPunkte(rd.p, tipp);
  zf.punkte.push(p);
  zf.tipps.push(tipp);
  zeigeZfTeil('aufloesung');
  $('zfAufFrage').innerHTML = rd.frage;
  $('zfErgebnis').hidden = true;
  $('zfWeiter').hidden = true;
  $('zfUeberspringen').hidden = false;
  zfSimulation(rd, tipp, (quote) => {
    $('zfUeberspringen').hidden = true;
    $('zfErgebnis').hidden = false;
    $('zfWeiter').hidden = false;
    hochzaehlen($('zfPunkte'), p, ' / 10');
    $('zfKommentar').textContent = p >= 9.5 ? 'Volltreffer! 🎯' : p >= 8 ? 'Richtig gutes Gespür 🔥' : p >= 6 ? 'Ganz ordentlich 👍' : p >= 4 ? 'Na ja … 🤔' : 'Der Zufall hat dich ausgetrickst 🙈';
    $('zfTabelle').innerHTML = '<tr><th>Exakt gerechnet</th><td>' + zfProz(rd.p) + '</td></tr><tr><th>Simulation (' + ZF_VERSUCHE + '×)</th><td>' + zfProz(quote) + '</td></tr>'
      + '<tr class="diff"><th>Dein Tipp</th><td class="' + (Math.abs(tipp - rd.p) <= 0.05 ? 'gut' : Math.abs(tipp - rd.p) <= 0.15 ? 'mittel' : 'weit') + '">' + zfProz(tipp) + '</td></tr>';
    $('zfBild').innerHTML = rd.bild;
    $('zfSchritte').innerHTML = rd.schritte.map((s) => '<li>' + s + '</li>').join('');
    if (navigator.vibrate) navigator.vibrate(p >= 8 ? [30, 40, 30] : 20);
    if (p >= 9.5) konfetti(22, ['🎲', '🎯', '✨', '🍀']);
    $('zfWeiter').textContent = zf.i === ZF_RUNDEN - 1 ? 'Zum Ergebnis' : 'Nächste Runde';
  });
}

function zufallEnde() {
  const summe = Math.round(zf.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const st = zfStore();
  st.best = st.best || {}; st.tag = st.tag || {};
  let rekord = false;
  if (zf.taeglich) { if (st.tag[heute()] == null) st.tag[heute()] = summe; }
  else { rekord = st.best[zf.stufe] == null || summe > st.best[zf.stufe]; st.best[zf.stufe] = Math.max(st.best[zf.stufe] || 0, summe); }
  saveJson(ZF_KEY, st);
  zeigeZfTeil('ende');
  if (typeof merkeVerlauf === 'function') merkeVerlauf('zufall', summe, 50, zf.taeglich ? 'Tages-Zufall' : ZF_STUFEN[zf.stufe].name);
  $('zfRunde').textContent = '';
  hochzaehlen($('zfSumme'), summe, ' / 50');
  $('zfRekord').textContent = rekord ? '🏆 Neuer Bestwert (' + ZF_STUFEN[zf.stufe].name + ')!' : zf.taeglich ? '📅 Tages-Zufall vom ' + new Date().toLocaleDateString('de-DE') : '';
  $('zfVergleich').hidden = !zf.gegner;
  if (zf.gegner) {
    const g = zf.gegner;
    $('zfVergleich').textContent = summe > g.punkte ? '🏆 Du hast ' + g.name + ' geschlagen (' + fmt(g.punkte) + ')!'
      : summe < g.punkte ? g.name + ' war besser (' + fmt(g.punkte) + '). Revanche?' : 'Unentschieden mit ' + g.name + '!';
  }
  const liste = $('zfErgListe');
  liste.innerHTML = '';
  zf.runden.forEach((rd, i) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="tl-n"></span><span class="tl-c"></span><b></b>';
    li.querySelector('.tl-n').textContent = rd.emoji + ' ' + zfProz(rd.p);
    li.querySelector('.tl-c').textContent = 'Tipp ' + zfProz(zf.tipps[i]) + (zf.hilfe && zf.hilfe[i] ? ' · 🧮 gerechnet' : '');
    li.querySelector('b').textContent = fmt(zf.punkte[i]);
    liste.appendChild(li);
  });
  if (summe >= 40) setTimeout(() => konfetti(50, ['🎲', '🍀', '🎯', '🏆']), 400);
}

async function zufallTeilen() {
  const summe = Math.round(zf.punkte.reduce((a, b) => a + b, 0) * 10) / 10;
  const name = loadJson(STORE_KEY).name || 'Jemand';
  const url = location.origin + location.pathname + '?zufall=' + encodeURIComponent(zf.seed) + '&stufe=' + zf.stufe + '&n=' + encodeURIComponent(name) + '&p=' + summe;
  const k = (p) => (p >= 9 ? '🟩' : p >= 7 ? '🟨' : p >= 5 ? '🟧' : '🟥');
  const titel = zf.taeglich ? 'Tages-Zufall ' + new Date().toLocaleDateString('de-DE') : ZF_STUFEN[zf.stufe].name;
  const text = '🎲 Zufalls-Gefühl – ' + titel + '\n' + fmt(summe) + ' / 50 ' + zf.punkte.map(k).join('') + '\nWie gut ist dein Gespür für Wahrscheinlichkeiten?';
  if (navigator.share) {
    try { await navigator.share({ title: 'Zufalls-Gefühl', text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text + '\n' + url); $('zfTeilenMsg').textContent = 'Kopiert – in eine Nachricht einfügen!'; }
  catch { $('zfTeilenMsg').textContent = url; }
}

// ---------- Geführte Lernrunde: sechs kleine Aufträge ----------
let zfl = null;
const ZF_LERN = [
  { titel: 'Günstig durch möglich',
    text: 'Ein Würfel hat 6 gleich wahrscheinliche Seiten. Die Wahrscheinlichkeit ist <b>günstige ÷ mögliche</b>.<br><b>Auftrag:</b> Tippe alle Seiten an, die eine <b>gerade Zahl</b> zeigen.',
    bau: (box, ok) => {
      const an = new Set();
      const zeichnen = () => {
        box.innerHTML = '<div class="zf-seiten">' + WUERFEL.map((w, i) => '<button type="button" class="' + (an.has(i + 1) ? 'an' : '') + '" data-z="' + (i + 1) + '">' + w + '</button>').join('') + '</div>'
          + '<div class="zf-bruch"><b>' + an.size + '</b> von <b>6</b> = ' + zfProz(an.size / 6) + '</div>';
        box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { const z = Number(b.dataset.z); if (an.has(z)) an.delete(z); else an.add(z); zeichnen(); }));
        if (an.size === 3 && [2, 4, 6].every((z) => an.has(z))) ok('Genau: 2, 4 und 6 sind günstig → 3 von 6 = <b>50 %</b>.');
      };
      zeichnen();
    } },
  { titel: 'Zwei Würfel: die 36er-Tafel',
    text: 'Bei zwei Würfeln gibt es 6 × 6 = <b>36</b> gleich wahrscheinliche Paare. Die Summen sind aber <b>nicht</b> gleich wahrscheinlich!<br><b>Auftrag:</b> Probier die Summen aus und finde die <b>häufigste</b>.',
    bau: (box, ok) => {
      let s = 2;
      const zeichnen = () => {
        let z = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === s) z++;
        box.innerHTML = zfTafel((a, b) => a + b === s, true) + '<div class="zf-summen">' + Array.from({ length: 11 }, (_, i) => i + 2).map((k) => '<button type="button" class="' + (k === s ? 'an' : '') + '" data-s="' + k + '">' + k + '</button>').join('') + '</div>'
          + '<div class="zf-bruch">Summe ' + s + ': <b>' + z + '</b> von 36 = ' + zfProz(z / 36) + '</div>';
        box.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { s = Number(b.dataset.s); zeichnen(); }));
        if (s === 7) ok('Richtig, die <b>7</b>! Sie liegt auf der ganzen Diagonale: 6 von 36 = 16,7 %. Die 2 und die 12 gibt es nur je einmal.');
      };
      zeichnen();
    } },
  { titel: 'Und → malnehmen',
    text: 'Bei mehreren Schritten hilft ein <b>Baumdiagramm</b>. Entlang eines Pfads wird <b>multipliziert</b>. Ohne Zurücklegen ändern sich die Zahlen beim zweiten Zug!<br><b>Auftrag:</b> 3 rote, 2 blaue Kugeln, zwei ziehen. Welche Rechnung stimmt für <b>beide rot</b>?',
    bau: (box, ok) => {
      const opt = [['3/5 + 2/4', false], ['3/5 × 3/5', false], ['3/5 × 2/4', true]];
      box.innerHTML = zfBaum(3, 2, false, ['RR']) + '<div class="zf-wahl">' + opt.map((o, i) => '<button class="btn secondary" type="button" data-i="' + i + '">' + o[0] + '</button>').join('') + '</div><div class="zf-bruch" id="zflNein"></div>';
      box.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
        const o = opt[Number(b.dataset.i)];
        if (o[1]) { b.classList.add('richtig'); ok('Genau: Erst 3 von 5 rot, dann nur noch 2 von 4 → 3/5 × 2/4 = <b>30 %</b>.'); }
        else { b.classList.add('falsch'); $('zflNein').innerHTML = o[0].includes('+') ? 'Plus nimmt man bei <b>oder</b>, nicht bei <b>und</b>.' : 'Fast! Aber die erste rote Kugel ist ja weg: Beim zweiten Mal sind es nur noch 2 von 4.'; }
      }));
    } },
  { titel: 'Mindestens eins → das Gegenteil',
    text: '„Mindestens eine 6“ rechnet man über das Gegenteil: <b>1 − keine 6</b>. Keine 6 in n Würfen ist (5/6)<sup>n</sup>.<br><b>Auftrag:</b> Ab wie vielen Würfen ist eine 6 <b>wahrscheinlicher als keine</b> (über 50 %)?',
    bau: (box, ok) => {
      box.innerHTML = '<div class="zf-wert" id="zflN"></div><input class="zf-regler" id="zflRegler" type="range" min="1" max="15" step="1" value="1" aria-label="Anzahl Würfe"><div id="zflTeil"></div>';
      const reg = $('zflRegler');
      const zeigen = () => {
        const n = Number(reg.value), k = (5 / 6) ** n;
        reg.style.setProperty('--pos', ((n - 1) / 14 * 100) + '%');
        $('zflN').textContent = n + (n === 1 ? ' Wurf' : ' Würfe');
        $('zflTeil').innerHTML = '<div class="zf-kette klein">(5/6)<sup>' + n + '</sup> = ' + zfProz(k) + '</div><div class="zf-teilung"><div style="width:' + (k * 100) + '%">keine 6<br>' + zfProz(k) + '</div><div class="an">mind. eine<br>' + zfProz(1 - k) + '</div></div>';
        if (n === 4) ok('Ja, ab <b>4 Würfen</b>: 1 − (5/6)⁴ = 51,8 %. Mit 3 Würfen sind es erst 42,1 %.');
      };
      reg.addEventListener('input', zeigen); zeigen();
    } },
  { titel: 'Gesetz der großen Zahlen',
    text: 'Bei wenigen Würfen schwankt die Trefferquote wild. Je mehr Versuche, desto näher kommt sie dem echten Wert. Genau das macht die Simulation im Spiel.<br><b>Auftrag:</b> Wirf die Münze mindestens <b>1000-mal</b> und schau, wo die Kopf-Quote landet.',
    bau: (box, ok) => {
      let n = 0, k = 0;
      const pkt = [];
      const zeichnen = () => {
        const W = 300, H = 130, sx = (i) => 6 + Math.log10(i) / Math.log10(Math.max(10, n)) * (W - 12), sy = (q) => H - 6 - q * (H - 12);
        const d = pkt.map(([i, q], j) => (j ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(q).toFixed(1)).join('');
        box.innerHTML = '<svg class="zf-sim" viewBox="0 0 ' + W + ' ' + H + '"><rect width="' + W + '" height="' + H + '" rx="10"/><path class="echt" d="M6 ' + sy(0.5) + 'H' + (W - 6) + '"/><path class="quote" d="' + d + '"/></svg>'
          + '<div class="zf-zaehler"><span>' + n + ' Würfe · ' + k + '× Kopf</span><b>' + (n ? zfProz(k / n) : '–') + '</b></div>'
          + '<div class="zf-wahl">' + [1, 10, 100, 1000].map((z) => '<button class="btn secondary" type="button" data-z="' + z + '">+' + z + '</button>').join('') + '</div>';
        box.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
          for (let i = 0; i < Number(b.dataset.z); i++) { n++; if (Math.random() < 0.5) k++; if (n <= 30 || n % Math.ceil(n / 60) === 0) pkt.push([n, k / n]); }
          zeichnen();
        }));
        if (n >= 1000) ok('Siehst du? Nach ' + n + ' Würfen liegt die Quote bei ' + zfProz(k / n) + ', ganz nah an 50 %. Am Anfang (links, logarithmische Achse) springt sie noch wild.');
      };
      zeichnen();
    } },
  { titel: 'Bauchgefühl-Falle: Geburtstage',
    text: 'Unser Bauch schätzt manche Wahrscheinlichkeiten völlig falsch. Klassiker: Wie viele Leute braucht man, damit <b>zwei am selben Tag</b> Geburtstag haben, mit über 50 %?<br><b>Auftrag:</b> Finde die kleinste Zahl.',
    bau: (box, ok) => {
      box.innerHTML = '<div class="zf-wert" id="zflN"></div><input class="zf-regler" id="zflRegler" type="range" min="2" max="70" step="1" value="2" aria-label="Personen"><div id="zflKurve"></div>';
      const reg = $('zflRegler');
      const zeigen = () => {
        const n = Number(reg.value);
        reg.style.setProperty('--pos', ((n - 2) / 68 * 100) + '%');
        $('zflN').textContent = n + ' Personen: ' + zfProz(zfGeburtstag(n));
        $('zflKurve').innerHTML = zfKurve(zfGeburtstag, 70, n, 'Personen');
        if (n === 23) ok('Schon bei <b>23 Leuten</b> sind es 50,7 %! Die meisten tippen auf über 100. Der Trick: Es zählt jedes der 253 Paare.');
      };
      reg.addEventListener('input', zeigen); zeigen();
    } },
];

function zufallLernen() {
  zf = null;
  zfLauf++;
  zfl = { schritt: 0, fertig: {} };
  $('zfRunde').textContent = '🧑‍🏫 Lernrunde';
  zeigeZfTeil('lernen');
  zflZeigen();
}
function zflZeigen() {
  const S = ZF_LERN[zfl.schritt], hier = zfl.schritt;
  $('zflSchritte').innerHTML = ZF_LERN.map((_, i) => '<i class="' + (zfl.fertig[i] ? 'fertig' : '') + (i === hier ? ' jetzt' : '') + '"></i>').join('');
  $('zflTitel').textContent = S.titel;
  $('zflText').innerHTML = S.text;
  $('zflZurueck').disabled = hier === 0;
  $('zflWeiter').textContent = hier === ZF_LERN.length - 1 ? 'Fertig – echtes Spiel 🎲' : 'Weiter ›';
  $('zflWeiter').disabled = !zfl.fertig[hier];
  $('zflGeschafft').hidden = true;
  $('zflGeschafft').innerHTML = '';
  S.bau($('zflBox'), (text) => {
    if (!zfl || zfl.schritt !== hier || !$('zflGeschafft').hidden) return;
    zfl.fertig[hier] = true;
    $('zflGeschafft').hidden = false;
    $('zflGeschafft').innerHTML = '✅ ' + text;
    $('zflWeiter').disabled = false;
    $('zflSchritte').children[hier].classList.add('fertig');
    if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    konfetti(12, ['✨', '🎲', '🍀']);
  });
}

// ---------- Spickzettel ----------
function zfHilfeOeffnen() {
  const imSpiel = !$('zf-spiel').hidden || !$('zf-aufloesung').hidden;
  const summen = Array.from({ length: 11 }, (_, i) => 6 - Math.abs(i - 5));
  $('zfHilfeInhalt').innerHTML = '<h3>Spickzettel Wahrscheinlichkeit</h3>'
    + '<div class="zf-regel"><span>÷</span><div><b>Grundregel</b>günstige Fälle ÷ mögliche Fälle (wenn alle gleich wahrscheinlich sind)</div></div>'
    + '<div class="zf-regel"><span>×</span><div><b>Und</b>nacheinander passieren → multiplizieren (Pfad im Baum)</div></div>'
    + '<div class="zf-regel"><span>+</span><div><b>Oder</b>verschiedene Wege zum Ziel → addieren</div></div>'
    + '<div class="zf-regel"><span>1−</span><div><b>Mindestens eins</b>1 − Wahrscheinlichkeit für „keins“</div></div>'
    + '<div class="zf-regel"><span>↓</span><div><b>Ohne Zurücklegen</b>beim zweiten Zug ist eine Kugel/Karte weniger da</div></div>'
    + '<div class="zf-kasten"><b>Zwei Würfel, Augensumme (von 36):</b><div class="zf-balken mini">' + summen.map((v, i) => '<div><i style="height:' + (v / 6 * 100) + '%"></i><small>' + (i + 2) + '</small><em>' + v + '</em></div>').join('') + '</div></div>'
    + '<div class="zf-kasten"><b>Werte zum Merken:</b><ul><li>mind. eine 6 bei 4 Würfen: 51,8 %</li><li>Pasch: 1/6 ≈ 16,7 %</li><li>Geburtstag: ab 23 Leuten über 50 %</li><li>Ziegenproblem: Wechseln gewinnt 2/3</li></ul></div>';
  $('zfHilfeLernen').hidden = imSpiel;
  const d = $('zfHilfe');
  if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
}
const zfHilfeZu = () => { const d = $('zfHilfe'); if (d.close) d.close(); else d.removeAttribute('open'); };

// ---------- Knöpfe ----------
$('zfStufen').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { zfStufe = b.dataset.stufe; zufallIntro(); }));
$('zfLos').addEventListener('click', () => {
  if (zfGegner) { const g = zfGegner; zfGegner = null; $('zfChallenge').hidden = true; zufallStart({ stufe: g.stufe, seed: g.seed, gegner: g }); }
  else zufallStart();
});
$('zfTagBtn').addEventListener('click', () => zufallStart({ taeglich: true }));
$('zfTippen').addEventListener('click', zfAuswerten);
$('zfUeberspringen').addEventListener('click', () => { zfSofort = true; });
$('zfWeiter').addEventListener('click', () => { zf.i++; if (zf.i >= ZF_RUNDEN) zufallEnde(); else zfRundeZeigen(); });
$('zfNochmal').addEventListener('click', () => zufallStart({ stufe: zf.stufe }));
$('zfTeilen').addEventListener('click', zufallTeilen);
$('zfLernenBtn').addEventListener('click', zufallLernen);
$('zfHilfeBtn').addEventListener('click', zfHilfeOeffnen);
$('zfHilfeZu').addEventListener('click', zfHilfeZu);
$('zfHilfe').addEventListener('click', (e) => { if (e.target === $('zfHilfe')) zfHilfeZu(); });
$('zfHilfeLernen').addEventListener('click', () => { zfHilfeZu(); zufallLernen(); });
$('zflWeiter').addEventListener('click', () => {
  if (zfl.schritt < ZF_LERN.length - 1) { zfl.schritt++; zflZeigen(); $('zf-lernen').scrollIntoView({ block: 'start', behavior: wenigBewegung() ? 'auto' : 'smooth' }); }
  else { zfl = null; zfStufe = 'leicht'; zufallStart({ stufe: 'leicht' }); }
});
$('zflZurueck').addEventListener('click', () => { if (zfl.schritt > 0) { zfl.schritt--; zflZeigen(); } });
$('zfZurueck').addEventListener('click', () => {
  if ((zf || zfl) && $('zf-intro').hidden) { zf = null; zufallIntro(); return; }
  zf = null; zfLauf++;
  zeigeHub();
});
$('hubZufall').addEventListener('click', () => { merkeZuletzt('zufall'); zoomZu($('hubZufall'), () => { show('zufall', '🎲 Zufalls-Gefühl'); zufallIntro(); }); });

// Challenge-Link: ?zufall=<seed>&stufe=…&n=…&p=…
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.get('zufall')) return;
  const stufe = ZF_STUFEN[q.get('stufe')] ? q.get('stufe') : 'leicht';
  zfGegner = { name: (q.get('n') || 'Jemand').slice(0, 30), punkte: Number(q.get('p')) || 0, seed: q.get('zufall'), stufe };
  history.replaceState(null, '', location.pathname);
  show('zufall', '🎲 Zufalls-Gefühl');
  zfStufe = stufe;
  zufallIntro();
  $('zfChallenge').hidden = false;
  $('zfChallenge').textContent = zfGegner.name + ' hat ' + fmt(zfGegner.punkte) + ' / 50 Punkte (' + ZF_STUFEN[stufe].name + '). Dieselben Aufgaben – schaffst du mehr?';
})();
