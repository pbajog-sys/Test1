// 💪 Fitness – Muskeln, Körper-Grafik und Übungswissen.
// Die Figur (vorn + hinten) ist selbst gezeichnet (SVG): Jeder Muskel ist eine eigene Fläche, die je nach Übung bzw.
// Trainingsmenge eingefärbt wird. Tipps sind allgemeine Technik-Hinweise, keine medizinische Beratung.
const FI_MUSKELN = {
  brust: { name: 'Brust', seite: 'v' }, schultern: { name: 'Schultern', seite: 'vh' }, bizeps: { name: 'Bizeps', seite: 'v' },
  trizeps: { name: 'Trizeps', seite: 'h' }, unterarme: { name: 'Unterarme', seite: 'vh' }, bauch: { name: 'Bauch', seite: 'v' },
  nacken: { name: 'Oberer Rücken', seite: 'h' }, lat: { name: 'Latissimus', seite: 'h' }, unterruecken: { name: 'Unterer Rücken', seite: 'h' },
  gesaess: { name: 'Gesäß', seite: 'h' }, quad: { name: 'Oberschenkel vorn', seite: 'v' }, beinbizeps: { name: 'Oberschenkel hinten', seite: 'h' },
  waden: { name: 'Waden', seite: 'vh' },
};
// Flächen der Figur: [Muskel, Ansicht (v/h), SVG-Form]. Koordinaten je Ansicht 0–100 × 0–200; die Rückansicht wird um 100 verschoben.
const FI_FORMEN = [
  // Vorderseite
  ['schultern', 'v', '<ellipse cx="30" cy="43" rx="8.5" ry="7.5"/><ellipse cx="70" cy="43" rx="8.5" ry="7.5"/>'],
  ['brust', 'v', '<path d="M49 37 H38 Q31 41 33 52 Q41 58 49 55 Z"/><path d="M51 37 H62 Q69 41 67 52 Q59 58 51 55 Z"/>'],
  ['bizeps', 'v', '<ellipse cx="25.5" cy="61" rx="5" ry="10.5"/><ellipse cx="74.5" cy="61" rx="5" ry="10.5"/>'],
  ['unterarme', 'v', '<ellipse cx="21.5" cy="87" rx="4.5" ry="12"/><ellipse cx="78.5" cy="87" rx="4.5" ry="12"/>'],
  ['bauch', 'v', '<rect x="41" y="59" width="18" height="33" rx="5"/><path d="M39 60 Q35 76 38 92 L40 92 L40 60 Z"/><path d="M61 60 Q65 76 62 92 L60 92 L60 60 Z"/>'],
  ['quad', 'v', '<path d="M49 106 Q47 132 46 144 Q41 147 37 143 Q33 124 36 104 Q42 99 49 106 Z"/><path d="M51 106 Q53 132 54 144 Q59 147 63 143 Q67 124 64 104 Q58 99 51 106 Z"/>'],
  ['waden', 'v', '<ellipse cx="41.5" cy="166" rx="4.8" ry="13"/><ellipse cx="58.5" cy="166" rx="4.8" ry="13"/>'],
  // Rückseite
  ['nacken', 'h', '<path d="M50 28 L36 39 Q42 46 50 54 Q58 46 64 39 Z"/>'],
  ['schultern', 'h', '<ellipse cx="30" cy="43" rx="8.5" ry="7.5"/><ellipse cx="70" cy="43" rx="8.5" ry="7.5"/>'],
  ['lat', 'h', '<path d="M48.5 55 L37 46 Q32 62 40 78 L48.5 80 Z"/><path d="M51.5 55 L63 46 Q68 62 60 78 L51.5 80 Z"/>'],
  ['trizeps', 'h', '<ellipse cx="25.5" cy="61" rx="5" ry="10.5"/><ellipse cx="74.5" cy="61" rx="5" ry="10.5"/>'],
  ['unterarme', 'h', '<ellipse cx="21.5" cy="87" rx="4.5" ry="12"/><ellipse cx="78.5" cy="87" rx="4.5" ry="12"/>'],
  ['unterruecken', 'h', '<rect x="43" y="80" width="14" height="14" rx="4"/>'],
  ['gesaess', 'h', '<ellipse cx="43.5" cy="103" rx="7.5" ry="8"/><ellipse cx="56.5" cy="103" rx="7.5" ry="8"/>'],
  ['beinbizeps', 'h', '<path d="M49 114 Q48 132 46 144 Q41 147 37 143 Q34 126 37 112 Q43 110 49 114 Z"/><path d="M51 114 Q52 132 54 144 Q59 147 63 143 Q66 126 63 112 Q57 110 51 114 Z"/>'],
  ['waden', 'h', '<ellipse cx="41.5" cy="164" rx="5.5" ry="14"/><ellipse cx="58.5" cy="164" rx="5.5" ry="14"/>'],
];
// neutraler Körper (Kopf, Hals, Hüfte, Hände, Füße, Knie), damit die Figur geschlossen wirkt
const FI_RUMPF = '<circle cx="50" cy="16" r="9.5"/><rect x="45.5" y="24" width="9" height="8" rx="3"/><rect x="38" y="92" width="24" height="12" rx="5"/>'
  + '<circle cx="20.5" cy="102" r="3.8"/><circle cx="79.5" cy="102" r="3.8"/><rect x="38" y="144" width="8" height="8" rx="3"/><rect x="54" y="144" width="8" height="8" rx="3"/>'
  + '<path d="M36 182 h11 v6 h-13 Z"/><path d="M64 182 h-11 v6 h13 Z"/>';

// Körper-SVG. werte: { muskel: 0…1 } (Wärmebild) oder { muskel: 'p'|'s' } (primär/sekundär). ansicht: 'v', 'h' oder 'vh'
function fiKoerper(werte, ansicht = 'vh', klasse = '', ausschnitt = null) {
  const breite = ansicht === 'vh' ? 200 : 100, versatz = ansicht === 'h' ? -100 : 0;
  const farbe = (m) => {
    const w = werte[m];
    if (w === 'p') return '#fb923c'; if (w === 's') return '#fdba74aa';
    if (typeof w === 'number' && w > 0) { const k = Math.min(1, w); return 'rgba(251,' + Math.round(146 - 80 * k) + ',' + Math.round(60 - 30 * k) + ',' + (0.35 + 0.65 * k).toFixed(2) + ')'; }
    return null;
  };
  let svg = '<svg class="fi-koerper ' + klasse + '" viewBox="' + (ausschnitt || '0 0 ' + breite + ' 200') + '" aria-hidden="true">';
  for (const v of ansicht === 'vh' ? ['v', 'h'] : [ansicht]) {
    const dx = (v === 'h' ? 100 : 0) + versatz;
    svg += '<g transform="translate(' + dx + ' 0)"><g class="fi-rumpf">' + FI_RUMPF + '</g>';
    FI_FORMEN.filter((f) => f[1] === v).forEach(([m, , form]) => { const f = farbe(m); svg += '<g class="fi-muskel' + (f ? ' an' : '') + '"' + (f ? ' style="fill:' + f + '"' : '') + ' data-muskel="' + m + '">' + form + '</g>'; });
    svg += '</g>';
  }
  return svg + '</svg>';
}
// Kleines Icon einer Übung: die Ansicht mit dem Hauptmuskel
function fiIcon(info) {
  if (!info || !info.p || !info.p.length) return '<span class="fi-icon fi-icon-leer">🏋️</span>';
  const w = {}; info.p.forEach((m) => { w[m] = 'p'; }); (info.s || []).forEach((m) => { if (!w[m]) w[m] = 's'; });
  const seite = FI_MUSKELN[info.p[0]].seite.includes('v') ? 'v' : 'h';
  // Ausschnitt: Oberkörper oder Beine – je nachdem, wo der Hauptmuskel liegt (größer und besser erkennbar)
  const unten = ['gesaess', 'quad', 'beinbizeps', 'waden'].includes(info.p[0]);
  return '<span class="fi-icon' + (info.ausdauer ? ' fi-icon-ausdauer' : '') + (unten ? ' fi-icon-unten' : '') + '">' + fiKoerper(w, seite, '', unten ? '22 90 56 104' : '10 3 80 104') + '</span>';
}

// Übungswissen: p = Hauptmuskeln, s = mitarbeitende Muskeln, schritt = Gewichtssprung für Steigerung (kg), tipps
const FI_INFO = {
  bank: { p: ['brust'], s: ['trizeps', 'schultern'], schritt: 2.5, tipps: ['Schulterblätter zusammen- und nach unten ziehen, Füße fest am Boden.', 'Stange kontrolliert zur unteren Brust, Ellenbogen etwa 45° vom Körper.', 'Bei schweren Sätzen mit Sicherung oder Partner trainieren.'] },
  schraeg: { p: ['brust'], s: ['schultern', 'trizeps'], schritt: 2.5, tipps: ['Bank auf 30–45° stellen – steiler trainiert vor allem die Schultern.', 'Stange zur oberen Brust führen, Schulterblätter bleiben hinten.'] },
  liege: { p: ['brust'], s: ['trizeps', 'schultern', 'bauch'], tipps: ['Körper bildet eine Linie – Bauch und Po anspannen.', 'Hände etwa schulterbreit, Ellenbogen schräg nach hinten (ca. 45°).', 'Zu schwer? Hände erhöht abstützen, z. B. auf einer Bank.'] },
  klimm: { p: ['lat'], s: ['bizeps', 'nacken', 'unterarme'], tipps: ['Aus dem ruhigen Hang starten, zuerst die Schultern nach unten ziehen.', 'Brust zur Stange, nicht nur das Kinn drüberstrecken.', 'Noch zu schwer? Mit Widerstandsband oder langsamen Negativen (nur ablassen) üben.'] },
  rudern: { p: ['lat', 'nacken'], s: ['bizeps', 'unterruecken'], schritt: 2.5, tipps: ['Rücken gerade, Oberkörper etwa 45° nach vorn geneigt.', 'Stange Richtung Bauchnabel ziehen, Schulterblätter zusammen.', 'Kein Schwung aus dem Oberkörper.'] },
  latzug: { p: ['lat'], s: ['bizeps', 'nacken'], schritt: 2.5, tipps: ['Stange zur oberen Brust ziehen, nicht in den Nacken.', 'Leicht zurücklehnen, Ellenbogen nach unten führen.', 'Oben ganz strecken lassen, unten kurz halten.'] },
  kreuz: { p: ['unterruecken', 'gesaess', 'beinbizeps'], s: ['quad', 'nacken', 'unterarme'], schritt: 5, tipps: ['Stange nah am Schienbein, Rücken neutral, Brust raus.', 'Aus den Beinen drücken – Hüfte und Schultern steigen gleichzeitig.', 'Technik vor Gewicht: lieber leichter und sauber.'] },
  knie: { p: ['quad', 'gesaess'], s: ['beinbizeps', 'unterruecken', 'bauch'], schritt: 5, tipps: ['Knie zeigen in Richtung der Zehen, Fersen bleiben am Boden.', 'So tief, wie der Rücken gerade bleibt.', 'Bauch fest anspannen, bei schweren Sätzen vorher tief einatmen.'] },
  presse: { p: ['quad', 'gesaess'], s: ['beinbizeps'], schritt: 5, tipps: ['Unterer Rücken bleibt am Polster.', 'Knie oben nicht ganz durchdrücken.', 'Füße höher auf der Platte = mehr Gesäß, tiefer = mehr Oberschenkel.'] },
  ausfall: { p: ['quad', 'gesaess'], s: ['beinbizeps', 'waden'], schritt: 2, tipps: ['Vorderes Knie bleibt über dem Fuß.', 'Hinteres Knie senkt sich Richtung Boden.', 'Oberkörper aufrecht, Blick nach vorn.'] },
  waden: { p: ['waden'], s: [], schritt: 5, tipps: ['Volle Bewegung: unten dehnen, oben kurz halten.', 'Langsam und ohne Federn.'] },
  schulter: { p: ['schultern'], s: ['trizeps', 'nacken'], schritt: 2.5, tipps: ['Bauch und Po anspannen – kein Hohlkreuz.', 'Stange eng am Gesicht vorbei senkrecht nach oben.', 'Oben Kopf leicht „durchs Fenster“ nach vorn.'] },
  seit: { p: ['schultern'], s: ['nacken'], schritt: 1, tipps: ['Leichtes Gewicht, Ellenbogen leicht gebeugt.', 'Nur bis Schulterhöhe heben.', 'Nicht schwingen – langsam ablassen.'] },
  bizeps: { p: ['bizeps'], s: ['unterarme'], schritt: 1, tipps: ['Ellenbogen bleiben am Körper.', 'Langsam ablassen, unten ganz strecken.', 'Kein Schwung aus dem Rücken.'] },
  trizeps: { p: ['trizeps'], s: [], schritt: 1, tipps: ['Ellenbogen eng und ruhig, nur der Unterarm bewegt sich.', 'Unten ganz durchstrecken.'] },
  dips: { p: ['trizeps', 'brust'], s: ['schultern'], tipps: ['Schultern unten halten, nicht hochziehen.', 'Nur so tief, wie es für die Schultern angenehm ist.', 'Oberkörper aufrecht = mehr Trizeps, nach vorn geneigt = mehr Brust.'] },
  crunch: { p: ['bauch'], s: [], tipps: ['Nur die Schultern abheben, unterer Rücken bleibt am Boden.', 'Nicht am Kopf ziehen.', 'Beim Hochkommen ausatmen.'] },
  beinheben: { p: ['bauch'], s: [], tipps: ['Unteren Rücken in den Boden drücken.', 'Beine langsam absenken.', 'Leichter mit gebeugten Knien.'] },
  lauf: { p: ['quad', 'waden'], s: ['beinbizeps', 'gesaess'], ausdauer: true, tipps: ['Die meisten Läufe locker – du solltest dich noch unterhalten können.', 'Wöchentlichen Umfang nur langsam steigern (grob höchstens ~10 % pro Woche).', 'Kurze Schritte, Landung unter dem Körper.'] },
  rad: { p: ['quad'], s: ['gesaess', 'waden', 'beinbizeps'], ausdauer: true, tipps: ['Sattelhöhe: Bein unten fast gestreckt.', 'Lieber höhere Trittfrequenz (ca. 80–90 pro Minute) als schwerer Gang.'] },
  schwimm: { p: ['lat', 'schultern'], s: ['trizeps', 'bauch', 'quad'], ausdauer: true, tipps: ['Gleichmäßig ins Wasser ausatmen.', 'Pausen zwischen Bahnen sind okay – Intervalle bringen viel.'] },
  rudergeraet: { p: ['lat', 'quad'], s: ['bizeps', 'gesaess', 'unterruecken'], ausdauer: true, tipps: ['Reihenfolge: Beine → Rücken → Arme, zurück umgekehrt.', 'Die meiste Kraft kommt aus den Beinen.', 'Rücken gerade, Schultern locker.'] },
  gehen: { p: ['quad', 'waden'], s: ['gesaess'], ausdauer: true, tipps: ['Zügiges Gehen zählt – so, dass du etwas schneller atmest.', 'Bergauf trainiert Gesäß und Waden extra.'] },
  stepper: { p: ['quad', 'gesaess'], s: ['waden', 'schultern'], ausdauer: true, tipps: ['Aufrecht stehen, nicht auf die Griffe stützen.', 'Gleichmäßiges Tempo, Widerstand lieber etwas höher.'] },
};
const FI_GRUPPEN = [
  ['Brust', ['brust']], ['Rücken', ['lat', 'nacken', 'unterruecken']], ['Beine', ['quad', 'beinbizeps', 'gesaess', 'waden']],
  ['Schultern', ['schultern']], ['Arme', ['bizeps', 'trizeps', 'unterarme']], ['Bauch', ['bauch']], ['Ausdauer', null],
];
const FI_TIPPS_ALLG = [
  'Steigern mit „doppelter Progression“: Schaffst du in allen Sätzen deine Ziel-Wiederholungen, nimm beim nächsten Mal etwas mehr Gewicht.',
  'Vor schweren Sätzen 1–2 leichte Aufwärmsätze machen.',
  'Für Muskelaufbau reichen meist 1–2 Minuten Pause, bei schweren Grundübungen gern 3 Minuten.',
  'Jeden Muskel etwa zweimal pro Woche zu trainieren, ist für die meisten ein guter Richtwert.',
  'Schlaf und genug Eiweiß sind für den Fortschritt so wichtig wie das Training selbst.',
];
