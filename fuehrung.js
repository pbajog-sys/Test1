// 🧑‍🏫 Führung für alle Spiele: Spickzettel (?-Knopf), geführte Einführung mit kleinen Aufträgen,
// und beim ersten Öffnen ein Hinweis auf die Einführung. Inhalt je Spiel unten in FUEHRUNGEN.
// Punktwolke, Funktions-Detektiv und Zufalls-Gefühl haben eigene, größere Lernrunden.
const FH_KEY = 'walquiz.fuehrung.v1';
const FUEHRUNGEN = {};
const fuehrung = (id, def) => { FUEHRUNGEN[id] = { id, ...def }; };

// ---------- Kleine Bausteine für Aufträge ----------
// Quiz: Optionen [{ t, richtig, warum }]; richtige Antwort ruft ok(warum) auf
function fhQuiz(box, ok, frage, optionen) {
  box.innerHTML = (frage ? '<div class="fh-frage">' + frage + '</div>' : '') + '<div class="fh-wahl">'
    + optionen.map((o, i) => '<button type="button" class="fh-opt" data-i="' + i + '">' + o.t + '</button>').join('') + '</div><div class="fh-nein"></div>';
  box.querySelectorAll('.fh-opt').forEach((b) => b.addEventListener('click', () => {
    const o = optionen[Number(b.dataset.i)];
    if (o.richtig) { b.classList.add('richtig'); box.querySelectorAll('.fh-opt').forEach((x) => { x.disabled = true; }); box.querySelector('.fh-nein').textContent = ''; ok(o.warum); }
    else { b.classList.add('falsch'); box.querySelector('.fh-nein').innerHTML = o.warum || 'Nicht ganz – probier noch eine.'; }
  }));
}
function fhSvgPunkt(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [p.x, p.y];
}
const fhTon = (f, d = 0.6) => { if (typeof sinus === 'function') sinus(f, d); };

// ---------- 🎨 Farb-Gedächtnis ----------
const fhFarbe = (hsv) => 'rgb(' + hsvZuRgb(hsv.h, hsv.s, hsv.v).join(',') + ')';
const fhDeltaE = (a, b) => deltaE2000(rgbZuLab(a), rgbZuLab(b));
// Mini-Mischpult: ziel/start als RGB-Array; regler: [{name, min, max, wert(rgb)->Zahl}] – je nach Modus HSB oder RGB
function fhMischer(box, ok, modus, ziel, start, schwelle, nur) {
  const hsb = modus === 'hsb';
  const w = { ...start };
  const R = hsb ? [['h', 'Farbton', 360, 'linear-gradient(90deg,red,yellow,lime,cyan,blue,magenta,red)'], ['s', 'Sättigung', 100, ''], ['v', 'Helligkeit', 100, '']]
    : [['r', 'Rot', 255, 'linear-gradient(90deg,#000,#f00)'], ['g', 'Grün', 255, 'linear-gradient(90deg,#000,#0f0)'], ['b', 'Blau', 255, 'linear-gradient(90deg,#000,#00f)']];
  const rgb = () => (hsb ? hsvZuRgb(w.h, w.s, w.v) : [w.r, w.g, w.b]);
  box.innerHTML = '<div class="fh-felder"><div><i id="fhZielFeld"></i><small>Ziel</small></div><div><i id="fhDuFeld"></i><small>Deine Farbe</small></div></div>'
    + R.filter((r) => !nur || nur.includes(r[0])).map(([k, name, max, bg]) => '<label class="fh-regel">' + name + ' <b data-z="' + k + '"></b><input type="range" class="fh-regler" data-k="' + k + '" min="0" max="' + max + '" value="' + w[k] + '"' + (bg ? ' style="--spur:' + bg + '"' : '') + '></label>').join('')
    + '<div class="fh-messung" id="fhAbstand"></div>';
  $('fhZielFeld').style.background = 'rgb(' + ziel.join(',') + ')';
  let fertig = false;
  const zeigen = () => {
    $('fhDuFeld').style.background = 'rgb(' + rgb().join(',') + ')';
    box.querySelectorAll('[data-z]').forEach((b) => { b.textContent = w[b.dataset.z] + (b.dataset.z === 'h' ? '°' : hsb ? ' %' : ''); });
    const d = fhDeltaE(ziel, rgb());
    $('fhAbstand').innerHTML = 'Abstand ΔE <b>' + fmt(Math.round(d * 10) / 10) + '</b> · ' + (d < 2 ? 'praktisch gleich' : d < 5 ? 'sehr nah' : d < 12 ? 'nah dran' : d < 25 ? 'erkennbar anders' : 'weit weg');
    if (!fertig && d < schwelle) { fertig = true; ok(); }
  };
  box.querySelectorAll('.fh-regler').forEach((r) => r.addEventListener('input', () => { w[r.dataset.k] = Number(r.value); zeigen(); }));
  zeigen();
}
const fhKleck = (rgb, text) => '<span class="fh-kleck"><i style="background:rgb(' + rgb.join(',') + ')"></i>' + (text || '') + '</span>';

fuehrung('farben', {
  titel: 'Farb-Gedächtnis', emoji: '🎨', thema: 'farben', intro: 'farb-intro',
  spick: () => '<h3>So triffst du Farben</h3>'
    + '<div class="fh-regelzeile"><span>1</span><div><b>In Worten merken</b>Nicht „grün“, sondern „helles, leicht gräuliches Blaugrün“: Farbton, Sättigung, Helligkeit.</div></div>'
    + '<div class="fh-regelzeile"><span>2</span><div><b>Erst Farbton, dann Helligkeit, dann Sättigung</b>Der Farbton ist am leichtesten zu merken, die Sättigung am schwersten.</div></div>'
    + '<div class="fh-regelzeile"><span>3</span><div><b>Punkte nach ΔE</b>ΔE misst, wie verschieden zwei Farben fürs Auge sind. ΔE 0 = 10 Punkte, je 5 ΔE ein Punkt weniger, ab 50 null.</div></div>'
    + '<div class="fh-kasten"><b>Drei Werkzeuge</b><ul><li><b>Farbton · Sättigung · Helligkeit</b>: am natürlichsten für Menschen.</li><li><b>Rot · Grün · Blau</b>: wie Licht am Bildschirm. Rot + Grün = Gelb, alle drei = Weiß.</li><li><b>🪣 Farbtopf</b>: wie Malfarbe. Gelb + Blau = Grün, Weiß hellt auf, schon wenig Schwarz dunkelt stark ab.</li></ul></div>'
    + '<div class="fh-kasten"><b>Mitte finden</b>: Stell dir vor, du kippst beide Farben zusammen. Zwischen Gegenfarben (Blau/Gelb, Rot/Grün) landest du bei einem gräulichen Ton.</div>',
  schritte: [
    { titel: 'Drei Fragen an jede Farbe', bild: () => '<div class="fh-reihe">' + [[30, 90, 95], [30, 35, 95], [30, 90, 45]].map((h, i) => fhKleck(hsvZuRgb(...h), ['kräftig hell', 'blass', 'dunkel'][i])).join('') + '</div>',
      text: 'Jede Farbe lässt sich mit drei Fragen beschreiben: <b>Welcher Farbton?</b> (Rot, Orange, Blau …) <b>Wie kräftig?</b> (Sättigung) <b>Wie hell?</b> (Helligkeit). Oben dreimal derselbe Orangeton – nur Sättigung und Helligkeit ändern sich.' },
    { titel: 'Auftrag: Farbton finden', text: 'Dreh nur am <b>Farbton</b>, bis deine Farbe dasselbe Grün hat wie das Ziel.',
      auftrag: (box, ok) => fhMischer(box, () => ok('Genau! Der Farbton ist der Winkel im Farbkreis: 0° Rot, 120° Grün, 240° Blau.'), 'hsb', hsvZuRgb(140, 70, 70), { h: 20, s: 70, v: 70 }, 6, ['h']) },
    { titel: 'Auftrag: alle drei Regler', text: 'Jetzt alle drei: Misch das gedeckte Blau. Tipp: erst Farbton, dann Helligkeit, zuletzt Sättigung.',
      auftrag: (box, ok) => fhMischer(box, () => ok('Super! Unter ΔE 6 sieht man kaum noch einen Unterschied – im Spiel wären das fast 9 Punkte.'), 'hsb', hsvZuRgb(215, 45, 55), { h: 0, s: 100, v: 100 }, 6) },
    { titel: 'Licht mischt anders: RGB', text: 'Am Bildschirm mischt sich <b>Licht</b>: Rot und Grün ergeben <b>Gelb</b>, alle drei zusammen Weiß.<br><b>Auftrag:</b> Misch ein kräftiges Gelb.',
      auftrag: (box, ok) => fhMischer(box, () => ok('Richtig: viel Rot + viel Grün, kein Blau = Gelb. Mit Malfarbe ginge das nie!'), 'rgb', [250, 215, 20], { r: 40, g: 40, b: 200 }, 8) },
    { titel: 'Farbtopf = Malkasten', bild: () => '<div class="fh-gleichung">' + fhKleck([250, 210, 20]) + '+' + fhKleck([20, 80, 180]) + '=' + fhKleck(topfMischenSicher({ gelb: 1, blau: 1 })) + '</div>'
      + '<div class="fh-gleichung">' + fhKleck([200, 20, 35]) + '+' + fhKleck([250, 250, 250]) + '=' + fhKleck(topfMischenSicher({ rot: 1, weiss: 1 })) + '</div>',
      text: 'Im 🪣 Farbtopf mischst du wie mit echter Farbe aus Rot, Gelb, Blau, Weiß und Schwarz – jeder Tropfen zählt.',
      auftrag: (box, ok) => fhQuiz(box, ok, 'Wie bekommst du ein dunkles Orange?', [
        { t: 'Rot + Gelb + ein Tropfen Schwarz', richtig: true, warum: 'Genau: Rot + Gelb = Orange, und schon ein Tropfen Schwarz dunkelt stark ab.' },
        { t: 'Rot + Blau', warum: 'Rot + Blau gibt Lila.' },
        { t: 'Gelb + viel Weiß', warum: 'Weiß macht heller, nicht dunkler – und ohne Rot kein Orange.' }]) },
    { titel: 'Mitte finden', bild: () => { const a = { h: 225, s: 85, v: 75 }, b = { h: 50, s: 90, v: 95 }, m = mitteLab(a, b); return '<div class="fh-gleichung">' + fhKleck(hsvZuRgb(a.h, a.s, a.v)) + '↔' + fhKleck(hsvZuRgb(b.h, b.s, b.v)) + '→' + fhKleck(hsvZuRgb(m.h, m.s, m.v), 'Mitte') + '</div>'; },
      text: 'Bei „Mitte finden“ suchst du die Farbe genau dazwischen, so wie das Auge sie empfindet. Zwischen <b>Gegenfarben</b> wie Blau und Gelb kommt kein Grün heraus, sondern ein <b>gräulicher</b> Ton – die Farben heben sich gegenseitig auf.' },
  ],
});
// Farbtopf-Mischung, auch wenn farben.js die Funktion anders nennt
function topfMischenSicher(rezept) {
  try { if (typeof topfMischen === 'function') { const r = topfMischen(rezept); if (r) return r; } } catch (e) { /* weiter unten */ }
  const basis = { rot: [200, 20, 35], gelb: [250, 210, 20], blau: [20, 80, 180], weiss: [250, 250, 250], schwarz: [25, 25, 30] };
  const n = Object.values(rezept).reduce((a, b) => a + b, 0);
  return [0, 1, 2].map((i) => Math.round(Object.entries(rezept).reduce((s, [k, m]) => s + basis[k][i] * m, 0) / n));
}

// ---------- 🎧 Ton-Gedächtnis ----------
fuehrung('toene', {
  titel: 'Ton-Gedächtnis', emoji: '🎧', thema: 'toene', intro: 'ton-intro',
  spick: () => '<h3>So triffst du Töne</h3>'
    + '<div class="fh-regelzeile"><span>1</span><div><b>Sofort mitsummen</b>Summ den Ton leise mit, solange er klingt. Die Stimme merkt sich Tonhöhen besser als der Kopf.</div></div>'
    + '<div class="fh-regelzeile"><span>2</span><div><b>Erst grob, dann fein</b>Schieb zuerst große Schritte, bis die Richtung stimmt, dann in kleinen Schritten hin und her.</div></div>'
    + '<div class="fh-regelzeile"><span>3</span><div><b>Vorsicht Oktave</b>Ein Ton mit doppelter Frequenz klingt „gleich, nur höher“. Prüf, ob du nicht eine Oktave daneben liegst.</div></div>'
    + '<div class="fh-kasten"><b>Punkte nach Cent</b><ul><li>100 Cent = ein Halbton (Klaviertaste daneben)</li><li>je 50 Cent daneben 1 Punkt weniger</li><li>ab 500 Cent (gut eine Quarte) 0 Punkte</li></ul>Der Schieber ist logarithmisch: Jede Oktave ist gleich breit – so wie das Ohr hört.</div>',
  schritte: [
    { titel: 'Hoch und tief', bild: () => '<svg class="fh-wellen" viewBox="0 0 300 90"><path d="M0 25 Q 25 0 50 25 T 100 25 T 150 25 T 200 25 T 250 25 T 300 25"/><path class="hoch" d="M0 70 Q 12.5 52 25 70 T 50 70 T 75 70 T 100 70 T 125 70 T 150 70 T 175 70 T 200 70 T 225 70 T 250 70 T 275 70 T 300 70"/></svg>',
      text: 'Ein Ton ist eine Schwingung. Je öfter sie pro Sekunde schwingt (<b>Hertz</b>), desto höher klingt der Ton. Der Kammerton A hat 440 Hz.',
      auftrag: (box, ok) => {
        box.innerHTML = '<div class="fh-wahl">' + [[220, 'A 220 Hz'], [440, 'A 440 Hz'], [880, 'A 880 Hz']].map(([f, t]) => '<button class="fh-opt" type="button" data-f="' + f + '">🔊 ' + t + '</button>').join('') + '</div>';
        const gehoert = new Set();
        box.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { fhTon(Number(b.dataset.f), 0.8); gehoert.add(b.dataset.f); b.classList.add('richtig');
          if (gehoert.size === 3) ok('Hörst du es? Alle drei klingen wie „derselbe“ Ton, nur höher. Doppelte Frequenz = eine <b>Oktave</b> höher.'); }));
      } },
    { titel: 'Oktave = doppelt', text: 'Weil das Ohr in <b>Verhältnissen</b> hört, ist der Schritt 220 → 440 Hz gleich groß wie 440 → 880 Hz.',
      auftrag: (box, ok) => fhQuiz(box, ok, 'Welcher Ton liegt eine Oktave über 300 Hz?', [
        { t: '400 Hz', warum: 'Plus 100 Hz ist nur eine Quarte. Eine Oktave ist das <b>Doppelte</b>.' },
        { t: '600 Hz', richtig: true, warum: 'Genau: 300 × 2 = 600 Hz.' },
        { t: '900 Hz', warum: 'Das wäre das Dreifache – mehr als eine Oktave.' }]) },
    { titel: 'Cent: das Maß fürs Gehör', bild: () => '<div class="fh-skala">' + [[0, 10], [50, 9], [100, 8], [250, 5], [500, 0]].map(([c, p]) => '<div><b>' + c + ' Cent</b><span>' + p + ' Punkte</span></div>').join('') + '</div>',
      text: 'Im Spiel zählt der Abstand in <b>Cent</b>: 100 Cent sind ein Halbton, also zwei benachbarte Klaviertasten. So zählt ein Fehler bei tiefen und hohen Tönen gleich viel.' },
    { titel: 'Auftrag: Triff den Ton', text: 'Hör dir den Ton an, dann schieb den Regler, bis dein Ton gleich klingt. Beim Schieben hörst du deinen Ton.',
      auftrag: (box, ok) => {
        const ziel = 392, fMin = 200, fMax = 800, f = (x) => fMin * Math.pow(fMax / fMin, x / 1000);
        box.innerHTML = '<button class="fh-opt" type="button" id="fhTonZiel">🔊 Zielton hören</button>'
          + '<input type="range" class="fh-regler" id="fhTonRegler" min="0" max="1000" value="120"><div class="fh-messung" id="fhTonInfo">Schieb den Regler</div><button class="fh-opt" type="button" id="fhTonPruef">✓ Prüfen</button>';
        $('fhTonZiel').addEventListener('click', () => fhTon(ziel, 1));
        let letzt = 0;
        $('fhTonRegler').addEventListener('input', () => { const jetzt = Date.now(); if (jetzt - letzt > 220) { letzt = jetzt; fhTon(f(Number($('fhTonRegler').value)), 0.3); } });
        $('fhTonPruef').addEventListener('click', () => {
          const c = Math.round(1200 * Math.log2(f(Number($('fhTonRegler').value)) / ziel));
          if (Math.abs(c) <= 40) ok('Getroffen! Nur ' + Math.abs(c) + ' Cent daneben – das wären ' + fmt(Math.max(0, Math.round((10 - Math.abs(c) / 50) * 10) / 10)) + ' Punkte.');
          else $('fhTonInfo').innerHTML = 'Noch ' + Math.abs(c) + ' Cent ' + (c > 0 ? '<b>zu hoch</b>' : '<b>zu tief</b>') + '. Hör nochmal hin!';
        });
      } },
    { titel: 'Profi-Tricks', text: '<b>Nicht lange warten:</b> Das Tongedächtnis verblasst nach wenigen Sekunden – fang sofort an zu suchen.<br><b>Summen hilft:</b> Halte den Ton mit der Stimme fest.<br><b>Vergleichen statt suchen:</b> Klingt dein Ton „heller“ als die Erinnerung? Dann ist er zu hoch.' },
  ],
});

// ---------- ⏱️ Takt-Gefühl ----------
fuehrung('takt', {
  titel: 'Takt-Gefühl', emoji: '⏱️', thema: 'takt', intro: 'takt-intro',
  spick: () => '<h3>So hältst du den Takt</h3>'
    + '<div class="fh-regelzeile"><span>⏱️</span><div><b>Zeitgefühl</b>Zähl innerlich „ein-und-zwan-zig“ – das ist etwa eine Sekunde. Bei 30 % daneben gibt es 0 Punkte.</div></div>'
    + '<div class="fh-regelzeile"><span>🥁</span><div><b>Tempo</b>Wipp mit Kopf oder Fuß mit, bevor du tippst. BPM = Schläge pro Minute: 60 BPM = 1 pro Sekunde, 120 BPM = 2 pro Sekunde. 20 % daneben = 0 Punkte.</div></div>'
    + '<div class="fh-regelzeile"><span>🎼</span><div><b>Taktart</b>Such die betonte „1“ (meist der tiefste, lauteste Schlag) und zähl bis zur nächsten „1“.</div></div>'
    + '<div class="fh-kasten"><b>Taktarten</b><ul><li><b>2/4</b> 1-2 · Marsch</li><li><b>3/4</b> 1-2-3 · Walzer, „Bum-tschak-tschak“</li><li><b>4/4</b> 1-2-3-4 · fast jeder Popsong</li><li><b>6/8</b> 1-2-3-4-5-6 in zwei Dreiergruppen, schaukelt</li><li><b>5/4</b> 3 + 2 · stolpert</li><li><b>7/8</b> 2 + 2 + 3 · Balkan</li></ul>Verwandte Taktarten (2/4 ↔ 4/4, 3/4 ↔ 6/8) geben halbe Punkte.</div>',
  schritte: [
    { titel: 'Auftrag: 2 Sekunden fühlen', text: 'Halte den Kreis gedrückt und lass nach genau <b>2 Sekunden</b> los. Zähl dabei „ein-und-zwan-zig, zwei-und-zwan-zig“.',
      auftrag: (box, ok) => {
        box.innerHTML = '<button class="fh-halten" type="button" id="fhHalten">Drücken &amp; halten</button><div class="fh-messung" id="fhHaltenInfo"></div>';
        let t0 = 0;
        const los = (e) => { e.preventDefault(); t0 = performance.now(); $('fhHalten').classList.add('an'); };
        const stopp = () => {
          if (!t0) return;
          const s = (performance.now() - t0) / 1000; t0 = 0; $('fhHalten').classList.remove('an');
          const abw = (s - 2) / 2;
          $('fhHaltenInfo').innerHTML = '<b>' + fmt(s.toFixed(2)) + ' s</b> – ' + (Math.abs(abw) < 0.1 ? 'super!' : abw > 0 ? 'zu lang' : 'zu kurz') + ' (' + (abw > 0 ? '+' : '') + fmt(Math.round(abw * 100)) + ' %)';
          if (Math.abs(abw) < 0.1) ok('Sehr gut! Unter 10 % daneben wären im Spiel 7 von 10 Punkten oder mehr.');
        };
        $('fhHalten').addEventListener('pointerdown', los);
        $('fhHalten').addEventListener('pointerup', stopp);
        $('fhHalten').addEventListener('pointerleave', stopp);
      } },
    { titel: 'Auftrag: Tempo mittippen', text: 'Der Punkt pulsiert mit <b>100 BPM</b>. Tippe mindestens sechsmal im selben Takt auf den Knopf.',
      auftrag: (box, ok) => {
        box.innerHTML = '<div class="fh-puls" style="--dauer:.6s"><i></i></div><button class="fh-opt fh-tipp" type="button" id="fhTipp">👆 Tipp</button><div class="fh-messung" id="fhTippInfo">Tippe mit</div>';
        const zeiten = [];
        $('fhTipp').addEventListener('pointerdown', () => {
          zeiten.push(performance.now()); if (zeiten.length > 7) zeiten.shift();
          if (zeiten.length < 3) return;
          const d = (zeiten[zeiten.length - 1] - zeiten[0]) / (zeiten.length - 1), bpm = 60000 / d;
          $('fhTippInfo').innerHTML = 'Du: <b>' + Math.round(bpm) + ' BPM</b>';
          if (zeiten.length >= 6 && Math.abs(bpm - 100) / 100 < 0.07) ok('Im Takt! ' + Math.round(bpm) + ' statt 100 BPM. Mitwippen hilft mehr als Zählen.');
        });
      } },
    { titel: 'Die „1“ finden', bild: () => ['3/4', '4/4', '6/8'].map((t) => { const g = { '3/4': [1, 0, 0], '4/4': [1, 0, 0, 0], '6/8': [1, 0, 0, 0.5, 0, 0] }[t];
      return '<div class="fh-takt"><b>' + t + '</b>' + (t === '6/8' ? [0] : [0, 1]).map(() => g.map((s, i) => '<i class="' + (s === 1 ? 'eins' : s ? 'halb' : '') + '" style="--k:' + i + '">' + (i + 1) + '</i>').join('')).join('<span>|</span>') + '</div>'; }).join(''),
      text: 'Jede Taktart hat einen Puls, der sich wiederholt. Die <b>1</b> ist betont – im Schlagzeug meist die tiefe Bassdrum. Zähl von einer 1 bis zur nächsten: So viele Schläge hat der Takt. 6/8 hat zwei Dreiergruppen: <b>1</b> 2 3 <b>4</b> 5 6.' },
    { titel: 'Kleines Hörrätsel', auftrag: (box, ok) => fhQuiz(box, ok, '„<b>Bum</b>-tschak-tschak, <b>Bum</b>-tschak-tschak“ – welche Taktart?', [
      { t: '2/4', warum: 'Dann käme die Betonung jeden zweiten Schlag.' },
      { t: '3/4', richtig: true, warum: 'Richtig, der Walzer: ein betonter und zwei leichte Schläge.' },
      { t: '4/4', warum: 'Dann wären es drei leichte Schläge nach dem Bum.' }]),
      text: 'Bevor es losgeht: Zähl die Silben zwischen den Betonungen.' },
    { titel: 'Ungerade Takte', bild: () => '<div class="fh-takt"><b>5/4</b><i class="eins">1</i><i>2</i><i>3</i><i class="halb">4</i><i>5</i></div><div class="fh-takt"><b>7/8</b><i class="eins">1</i><i>2</i><i class="halb">3</i><i>4</i><i class="halb">5</i><i>6</i><i>7</i></div>',
      text: '5/4 und 7/8 klingen, als würde der Rhythmus <b>stolpern</b>. 5/4 wird meist als 3 + 2 gespielt, 7/8 als 2 + 2 + 3. Wenn sich ein Takt „zu kurz“ oder „zu lang“ anfühlt, ist es oft einer davon.' },
  ],
});

// ---------- 📐 Augenmaß ----------
fuehrung('augen', {
  titel: 'Augenmaß', emoji: '📐', thema: 'augen', intro: 'ag-intro',
  spick: () => '<h3>Tricks fürs Augenmaß</h3>'
    + '<div class="fh-regelzeile"><span>✂️</span><div><b>Halbieren</b>Schau abwechselnd auf beide Enden statt auf die Mitte. Pfeilspitzen an den Enden ignorieren – sie täuschen.</div></div>'
    + '<div class="fh-regelzeile"><span>🎯</span><div><b>Mittelpunkt</b>Kreis und Quadrat: Mitte zwischen gegenüberliegenden Rändern. Dreieck: Der Schwerpunkt liegt auf einem <b>Drittel</b> der Höhe, näher an der breiten Seite.</div></div>'
    + '<div class="fh-regelzeile"><span>📐</span><div><b>Winkel</b>Denk in Ankern: 90° = Ecke eines Blatts, 45° = halbe Ecke, 30° und 60° = Drittel. 135° = Ecke + halbe Ecke.</div></div>'
    + '<div class="fh-regelzeile"><span>📏</span><div><b>Länge</b>Senkrechte Linien wirken länger als waagrechte. Zieh waagrechte Linien deshalb eher etwas länger.</div></div>'
    + '<div class="fh-regelzeile"><span>🛤️</span><div><b>Parallel</b>Vergleiche den Abstand der beiden Linien an beiden Enden – er muss gleich sein.</div></div>',
  schritte: [
    { titel: 'Auftrag: genau halbieren', text: 'Tippe genau auf die <b>Mitte</b> der Linie. Tipp: Schau abwechselnd auf beide Enden.',
      auftrag: (box, ok) => {
        const x1 = 22, x2 = 262, y = 60;
        box.innerHTML = '<svg class="fh-tafel" viewBox="0 0 300 120"><line class="fh-linie" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '"/><g id="fhMarken"></g></svg><div class="fh-messung" id="fhAgInfo">Tippe auf die Linie</div>';
        box.querySelector('svg').addEventListener('click', (e) => {
          const [x] = fhSvgPunkt(box.querySelector('svg'), e), m = (x1 + x2) / 2, f = Math.abs(x - m) / (x2 - x1);
          $('fhMarken').innerHTML = '<line class="fh-du" x1="' + x + '" x2="' + x + '" y1="' + (y - 18) + '" y2="' + (y + 18) + '"/><line class="fh-mitte" x1="' + m + '" x2="' + m + '" y1="' + (y - 12) + '" y2="' + (y + 12) + '"/>';
          $('fhAgInfo').innerHTML = fmt(Math.round(f * 1000) / 10) + ' % der Länge daneben';
          if (f < 0.025) ok('Präzise! Unter 2,5 % daneben – fast volle Punktzahl.');
        });
      } },
    { titel: 'Täuschung: Pfeilspitzen', bild: () => '<svg class="fh-tafel" viewBox="0 0 300 130"><g class="fh-linie"><path d="M60 40H240M60 40l14-12M60 40l14 12M240 40l-14-12M240 40l-14 12"/><path d="M60 95H240M60 95l-14-12M60 95l-14 12M240 95l14-12M240 95l14 12"/></g></svg>',
      text: 'Beide waagrechten Linien sind <b>gleich lang</b>! Die untere wirkt länger, weil ihre Spitzen nach außen zeigen (Müller-Lyer-Täuschung). Im Profi-Modus kommen solche Spitzen vor: Halbiere nur die Linie, nicht die Pfeile.' },
    { titel: 'Auftrag: Schwerpunkt im Dreieck', text: 'Der Mittelpunkt eines Dreiecks ist der <b>Schwerpunkt</b>: dort, wo du es auf einer Fingerspitze balancieren könntest. Tippe ihn an.',
      auftrag: (box, ok) => {
        const P = [[40, 200], [265, 185], [120, 30]], S = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
        box.innerHTML = '<svg class="fh-tafel" viewBox="0 0 300 230"><path class="fh-linie" d="M' + P.map((p) => p.join(' ')).join('L') + 'Z"/><g id="fhMarken"></g></svg><div class="fh-messung" id="fhAgInfo">Tippe ins Dreieck</div>';
        box.querySelector('svg').addEventListener('click', (e) => {
          const [x, y] = fhSvgPunkt(box.querySelector('svg'), e), d = Math.hypot(x - S[0], y - S[1]);
          const halb = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          $('fhMarken').innerHTML = '<circle class="fh-du-punkt" cx="' + x + '" cy="' + y + '" r="6"/>' + (d < 14 ? P.map((p, i) => { const g = halb(P[(i + 1) % 3], P[(i + 2) % 3]); return '<line class="fh-hilfe" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + g[0] + '" y2="' + g[1] + '"/>'; }).join('') + '<circle class="fh-ziel-punkt" cx="' + S[0] + '" cy="' + S[1] + '" r="6"/>' : '');
          $('fhAgInfo').textContent = d < 14 ? 'Getroffen!' : d < 35 ? 'Nah dran – eher Richtung breite Seite?' : 'Noch zu weit weg';
          if (d < 14) ok('Genau! Die Linien von jeder Ecke zur Mitte der Gegenseite treffen sich im Schwerpunkt – auf einem Drittel der Höhe.');
        });
      } },
    { titel: 'Winkel mit Ankern', bild: () => '<svg class="fh-tafel" viewBox="0 0 300 140"><g class="fh-linie">' + [[90, 50], [45, 120], [30, 190], [135, 260]].map(([w, x]) => { const r = 50, a = w * Math.PI / 180; return '<path d="M' + (x - 25) + ' 110h' + r + 'M' + (x - 25) + ' 110l' + (Math.cos(a) * r).toFixed(1) + ' ' + (-Math.sin(a) * r).toFixed(1) + '"/>'; }).join('') + '</g>'
      + [[90, 50], [45, 120], [30, 190], [135, 260]].map(([w, x]) => '<text class="fh-svg-text" x="' + x + '" y="132" text-anchor="middle">' + w + '°</text>').join('') + '</svg>',
      text: 'Schätze Winkel nicht frei, sondern von <b>Ankern</b> aus: 90° (Ecke), 45° (halbe Ecke), 30°/60° (Drittel einer Ecke). Ein stumpfer Winkel ist 90° plus etwas.',
      auftrag: (box, ok) => fhQuiz(box, ok, 'Ecke + halbe Ecke – wie viel ist das?', [
        { t: '120°', warum: 'Das wäre Ecke + Drittel (90 + 30).' }, { t: '135°', richtig: true, warum: 'Genau: 90° + 45° = 135°.' }, { t: '150°', warum: 'Das wäre 90° + 60°.' }]) },
    { titel: 'Senkrecht wirkt länger', bild: () => '<svg class="fh-tafel" viewBox="0 0 300 150"><g class="fh-linie"><path d="M80 130H220M150 130V30"/></g></svg>',
      text: 'Die senkrechte und die waagrechte Linie sind <b>gleich lang</b> – trotzdem wirkt die senkrechte länger. Beim Längen-Ziehen gilt deshalb: waagrechte Linien eher etwas länger ziehen, senkrechte etwas kürzer.' },
  ],
});

// ---------- 🧭 Karten-Gefühl ----------
fuehrung('karte', {
  titel: 'Karten-Gefühl', emoji: '🧭', thema: 'karte', intro: 'kt-intro',
  spick: () => '<h3>So findest du Orte</h3>'
    + '<div class="fh-regelzeile"><span>📍</span><div><b>Anker statt Raten</b>Merk dir ein paar sichere Orte und schätze von dort aus: „halbe Strecke zwischen …“, „etwas nördlich von …“.</div></div>'
    + '<div class="fh-regelzeile"><span>🔍</span><div><b>Zoomen</b>Zwei Finger, Doppeltipp oder Mausrad. Erst grob tippen, dann reinzoomen und korrigieren.</div></div>'
    + '<div class="fh-regelzeile"><span>📏</span><div><b>Punkte nach Kilometern</b>Deutschland: 0 Punkte ab 220 km daneben · Europa ab 800 km · Welt ab 2500 km.</div></div>'
    + '<div class="fh-kasten"><b>Anker Deutschland</b><ul><li>Hamburg oben Mitte, Berlin oben rechts, Köln links Mitte</li><li>Frankfurt in der Mitte links, München unten rechts, Stuttgart unten links</li><li>Rhein im Westen, Elbe im Osten, Donau im Süden</li></ul></div>'
    + '<div class="fh-kasten"><b>Breitengrad-Überraschungen</b><ul><li>Berlin liegt so weit nördlich wie London und Warschau</li><li>Rom liegt etwa auf Höhe von New York und Barcelona</li><li>Der Äquator geht durch Ecuador, Kenia und Indonesien</li></ul></div>',
  schritte: [
    { titel: 'Punkte nach Kilometern', bild: () => '<svg class="fh-tafel" viewBox="0 0 300 160"><circle class="fh-ring" cx="150" cy="80" r="70"/><circle class="fh-ring" cx="150" cy="80" r="35"/><circle class="fh-ziel-punkt" cx="150" cy="80" r="6"/><text class="fh-svg-text" x="150" y="40" text-anchor="middle">110 km = 5 P.</text><text class="fh-svg-text" x="150" y="155" text-anchor="middle">220 km = 0 P. (Deutschland)</text></svg>',
      text: 'Du tippst, wo du den Ort vermutest. Je näher, desto mehr Punkte. In Deutschland gibt es bei 220 km Abstand nichts mehr, in Europa bei 800 km, auf der Weltkarte bei 2500 km.' },
    { titel: 'Auftrag: Finde Berlin', text: 'Tippe ungefähr dorthin, wo <b>Berlin</b> liegt. Tipp: im Nordosten, gut 150 km südlich der Ostsee und knapp 100 km westlich der polnischen Grenze.',
      auftrag: (box, ok) => {
        if (typeof ktSvg !== 'function') { ok('Berlin liegt im Nordosten.'); return; }
        box.innerHTML = '<div class="fh-karte">' + ktSvg('deutschland') + '</div><div class="fh-messung" id="fhKtInfo">Tippe auf die Karte</div>';
        const svg = box.querySelector('svg'), g = svg.querySelector('.kt-marken');
        const P = (lat, lon) => ktProjiziere('deutschland', lat, lon);
        const r = svg.viewBox.baseVal.width / 60;
        svg.addEventListener('click', (e) => {
          const [x, y] = fhSvgPunkt(svg, e), [lat, lon] = ktZurueck('deutschland', x, y), km = ktKm(lat, lon, 52.52, 13.405);
          const [bx, by] = P(52.52, 13.405);
          g.innerHTML = '<circle class="fh-du-punkt" cx="' + x + '" cy="' + y + '" r="' + r + '"/>' + (km < 90 ? '<circle class="fh-ziel-punkt" cx="' + bx + '" cy="' + by + '" r="' + r + '"/>' : '');
          $('fhKtInfo').innerHTML = '<b>' + Math.round(km) + ' km</b> daneben';
          if (km < 90) {
            g.innerHTML += [['Hamburg', 53.55, 9.99], ['Köln', 50.94, 6.96], ['Frankfurt', 50.11, 8.68], ['München', 48.14, 11.58], ['Berlin', 52.52, 13.405]].map(([n, la, lo]) => { const [px, py] = P(la, lo); return '<circle class="fh-anker" cx="' + px + '" cy="' + py + '" r="' + (r * 0.7) + '"/><text class="fh-karten-text" x="' + (px + r) + '" y="' + (py + r * 0.4) + '" font-size="' + (r * 2.2) + '">' + n + '</text>'; }).join('');
            ok('Gut! ' + Math.round(km) + ' km daneben. Merk dir diese fünf Anker – von ihnen aus findest du fast alles.');
          }
        });
      } },
    { titel: 'Von Ankern aus schätzen', text: '<b>Hannover</b>? Etwa zwischen Hamburg und Frankfurt, etwas näher an Hamburg. <b>Leipzig</b>? Südwestlich von Berlin, auf halbem Weg nach … Denk in Strecken und Richtungen statt in freien Punkten.<br><br>Auf der Welt- und Europakarte helfen <b>Breitengrade</b>: Rom liegt so weit südlich wie New York, Berlin so weit nördlich wie London.' },
    { titel: 'Zoomen', text: 'Gerade auf der Weltkarte lohnt sich Zoomen: <b>zwei Finger</b> auseinander, <b>Doppeltipp</b> oder Mausrad. Tipp zuerst grob, zoom dann hinein und setz den Punkt genau – du kannst ihn so oft verschieben, wie du willst, bis du bestätigst.' },
  ],
});

// ---------- 🤿 Tiefgang ----------
function tgRisikoTabelle() {
  const zonen = ['Sonnenzone', 'Dämmerzone', 'Mitternacht'];
  const gef = ['qualle', 'stroemung', 'druck'];
  return '<table class="fh-tabelle"><tr><th>Schon gesehen</th>' + zonen.map((z) => '<th>' + z + '</th>').join('') + '</tr>'
    + [1, 2, 3].map((n) => '<tr><th>' + gef.slice(0, n).map((g) => TG_KARTEN[g].emoji).join('') + '</th>' + [0, 1, 2].map((zi) => {
      const sum = Object.values(TG_GEWICHTE).reduce((s, g) => s + g[zi], 0), w = gef.slice(0, n).reduce((s, g) => s + TG_GEWICHTE[g][zi], 0);
      return '<td>' + (w ? Math.round(w / sum * 100) + ' %' : '–') + '</td>'; }).join('') + '</tr>').join('') + '</table>';
}
function tgErwartung(zi) {
  const sum = Object.values(TG_GEWICHTE).reduce((s, g) => s + g[zi], 0);
  return Object.entries(TG_GEWICHTE).reduce((s, [k, g]) => s + (TG_KARTEN[k].punkte || 0) * g[zi], 0) / sum;
}
fuehrung('tiefgang', {
  titel: 'Tiefgang', emoji: '🤿', thema: 'tiefgang', intro: 'tg-intro',
  spick: () => '<h3>Tauch-Regeln &amp; Strategie</h3>'
    + '<div class="fh-regelzeile"><span>⬇️</span><div><b>Tiefer</b>Jeder Schritt: 10 m tiefer, eine neue Karte, ein Luftzug weniger. Tiefer = wertvollere Funde.</div></div>'
    + '<div class="fh-regelzeile"><span>💥</span><div><b>Gefahr doppelt</b>Kommt dieselbe Gefahr (🪼 🌀 💢) zum zweiten Mal im selben Tauchgang, ist die Beute dieses Tauchgangs weg.</div></div>'
    + '<div class="fh-regelzeile"><span>⬆️</span><div><b>Auftauchen</b>sichert alles. Ohne Luft musst du hoch. 🫧 gibt +2 Luft.</div></div>'
    + '<div class="fh-regelzeile"><span>🐋</span><div><b>Logbuch</b>Jede neue Tierart +2 Punkte am Ende.</div></div>'
    + '<div class="fh-kasten"><b>Risiko für den nächsten Schritt</b> (Chance, dass eine schon gesehene Gefahr wiederkommt)' + tgRisikoTabelle() + '</div>'
    + '<div class="fh-kasten"><b>Faustregel:</b> Weiter lohnt sich, solange <b>Risiko × Beute</b> kleiner ist als ein durchschnittlicher Fund (Sonne ≈ ' + fmt(tgErwartung(0).toFixed(1)) + ', Dämmer ≈ ' + fmt(tgErwartung(1).toFixed(1)) + ', Mitternacht ≈ ' + fmt(tgErwartung(2).toFixed(1)) + ' Punkte).</div>',
  schritte: [
    { titel: 'Ein Tauchgang', bild: () => '<div class="fh-karten">' + ['🐚', '⭐', '🪼', '🐋', '🦪', '🌀'].map((e, i) => '<i style="--k:' + i + '">' + e + '</i>').join('') + '<b>⬆️</b></div>',
      text: 'Mit jedem Schritt geht es 10 m tiefer, und du ziehst eine Karte: Funde (🐚 ⭐ 🦪 💰), Tiere fürs Logbuch, Luftblasen – oder Gefahren. Wer rechtzeitig <b>auftaucht</b>, behält alles.' },
    { titel: 'Die Falle', bild: () => '<div class="fh-karten">' + ['🐚', '🪼', '🦪', '💰', '🪼'].map((e, i) => '<i style="--k:' + i + '" class="' + (i === 4 ? 'boom' : '') + '">' + e + '</i>').join('') + '<b>💥</b></div>',
      text: 'Eine Gefahr allein schadet nicht. Kommt aber <b>dieselbe</b> Gefahr ein zweites Mal, ist die ganze Beute dieses Tauchgangs verloren – hier 🐚 🦪 💰. Zwei verschiedene Gefahren (🪼 und 🌀) sind dagegen kein Problem.' },
    { titel: 'Wie groß ist das Risiko?', bild: tgRisikoTabelle,
      text: 'Je mehr verschiedene Gefahren du schon gesehen hast, desto wahrscheinlicher kommt eine davon wieder – und in der Tiefe gibt es mehr Gefahren. Im Modus <b>Leicht</b> zeigt dir das Spiel dieses Risiko an.' },
    { titel: 'Auftrag: Weiter oder hoch?', text: 'Du bist in der <b>Dämmerzone</b>, hast schon 🪼 und 🌀 gesehen und trägst <b>9 Punkte</b> Beute.',
      auftrag: (box, ok) => {
        const sum = Object.values(TG_GEWICHTE).reduce((s, g) => s + g[1], 0), r = (TG_GEWICHTE.qualle[1] + TG_GEWICHTE.stroemung[1]) / sum, e = tgErwartung(1), beute = 9;
        const weiter = (1 - r) * e > r * beute;
        const erkl = 'Risiko ' + Math.round(r * 100) + ' % × 9 Punkte = ' + fmt((r * beute).toFixed(1)) + ' Punkte, die du im Schnitt verlierst. Ein Fund bringt im Schnitt nur ' + fmt(((1 - r) * e).toFixed(1)) + '. ';
        fhQuiz(box, ok, 'Was ist schlauer?', [
          { t: '⬇️ Weiter tauchen', richtig: weiter, warum: erkl + (weiter ? 'Also weiter!' : 'Das lohnt sich nicht.') },
          { t: '⬆️ Auftauchen', richtig: !weiter, warum: erkl + (weiter ? 'Hier lohnt sich weiter.' : 'Also lieber sichern.') }]);
      } },
    { titel: 'Die Zonen', bild: () => '<div class="fh-zonen">' + TG_ZONEN.map((z, i) => '<div style="background:' + z.farbe + '"><b>' + z.name + '</b><span>' + ['🐚 ⭐ – sicher, wenig wert', '🦪 🪸 – mehr wert, 💢 Druck kommt dazu', '💰 👑 – Schätze, aber viele Gefahren'][i] + '</span></div>').join('') + '</div>',
      text: 'Oben ist es sicher, aber mager. Unten liegen Schätze und Kronen – und mehr Gefahren. Ein guter Plan: erst ein paar sichere Tauchgänge, dann einen mutigen, wenn du hinten liegst.' },
  ],
});

// ---------- 🎲 Riffbau ----------
const FH_RIFF_BEISPIEL = (() => {
  const b = Array(36).fill(null), setze = (r, c, f) => { b[r * 6 + c] = f; };
  [[0, 0], [0, 1], [0, 2], [1, 0]].forEach(([r, c]) => setze(r, c, 'rot'));
  [[1, 1], [1, 2]].forEach(([r, c]) => setze(r, c, 'blau'));
  [0, 1, 2, 3, 4].forEach((c) => setze(2, c, 'gelb'));
  return { brett: b, aufbau: { felsen: [17], fische: [{ z: 7, farbe: 'blau' }, { z: 28, farbe: 'lila' }] } };
})();
function fhRiffBrett(brett, aufbau, hervor) {
  const farbe = (id) => (RIFF_FARBEN.find((f) => f.id === id) || {}).farbe;
  return '<div class="fh-riff">' + brett.map((f, z) => {
    const fisch = aufbau.fische.find((x) => x.z === z), fels = aufbau.felsen.includes(z);
    return '<i class="' + (hervor && hervor.includes(z) ? 'hervor' : '') + '" style="' + (f ? 'background:' + farbe(f) : '') + '">' + (fels ? '🪨' : fisch ? '<span style="--fisch:' + farbe(fisch.farbe) + '">🐠</span>' : '') + '</i>';
  }).join('') + '</div>';
}
fuehrung('riff', {
  titel: 'Riffbau', emoji: '🎲', thema: 'riff', intro: 'rf-intro',
  spick: () => '<h3>Punkte &amp; Strategie</h3>'
    + '<div class="fh-regelzeile"><span>🪸</span><div><b>Farbflächen</b>Jede zusammenhängende Fläche einer Farbe ab <b>3 Feldern</b> zählt so viele Punkte, wie sie groß ist. Kleinere zählen nichts.</div></div>'
    + '<div class="fh-regelzeile"><span>➖</span><div><b>Volle Reihen und Spalten</b>je +4. Felsen 🪨 zählen als gefüllt!</div></div>'
    + '<div class="fh-regelzeile"><span>🐠</span><div><b>Fische</b>+4, wenn ihr Feld in ihrer Lieblingsfarbe bedeckt ist.</div></div>'
    + '<div class="fh-kasten"><b>Strategie</b><ul><li>Gib jeder Farbe eine eigene Ecke – so wachsen große Flächen.</li><li>Reihen mit Felsen sind schneller voll.</li><li>Fische früh bedienen: +4 für ein einziges Feld.</li><li>Den ⭐ Joker für Lücken und Fische aufheben.</li><li>Passt nichts Gutes, lieber <b>Passen</b> als eine Fläche zerstören.</li></ul></div>',
  schritte: [
    { titel: 'Zwei Würfel', bild: () => '<div class="fh-wuerfel"><div><b>Form</b>' + RIFF_FORMEN.map((f) => '<span>' + (f.joker ? '⭐' : '<svg viewBox="0 0 30 30">' + f.felder.map(([r, c]) => '<rect x="' + (c * 10 + 1) + '" y="' + (r * 10 + 1) + '" width="8" height="8" rx="2"/>').join('') + '</svg>') + '</span>').join('') + '</div>'
      + '<div><b>Farbe</b>' + RIFF_FARBEN.map((f) => '<span><i style="background:' + f.farbe + '"></i></span>').join('') + '<span>⭐</span></div></div>',
      text: 'Jede Runde zeigt ein Würfel die <b>Form</b>, der andere die <b>Farbe</b>. Du darfst die Form drehen und setzt sie aufs 6×6-Riff. Felsen und belegte Felder sind tabu. ⭐ ist ein Joker.' },
    { titel: 'Farbflächen', bild: () => fhRiffBrett(FH_RIFF_BEISPIEL.brett, FH_RIFF_BEISPIEL.aufbau, [0, 1, 2, 6]),
      text: 'Die vier roten Felder hängen zusammen: <b>+4</b>. Die zwei blauen sind zu klein (unter 3): <b>0</b>. Die gelbe Reihe aus fünf Feldern: <b>+5</b>. Nur Felder, die mit einer Kante aneinanderstoßen, zählen zusammen.' },
    { titel: 'Reihen und Fische', bild: () => fhRiffBrett(FH_RIFF_BEISPIEL.brett, FH_RIFF_BEISPIEL.aufbau, [12, 13, 14, 15, 16, 17, 7]),
      text: 'Die dritte Reihe ist voll – der <b>Felsen zählt mit</b>: <b>+4</b>. Der Fisch auf dem blauen Feld wollte Blau: <b>+4</b>. Der lila Fisch weiter unten wartet noch.' },
    { titel: 'Auftrag: Zähl selbst', bild: () => fhRiffBrett(FH_RIFF_BEISPIEL.brett, FH_RIFF_BEISPIEL.aufbau),
      text: 'Wie viele Punkte hat dieses Riff insgesamt?',
      auftrag: (box, ok) => { const w = riffWertung(FH_RIFF_BEISPIEL.brett, FH_RIFF_BEISPIEL.aufbau); fhQuiz(box, ok, '', [w.summe - 4, w.summe, w.summe + 2].map((n) => ({ t: n + ' Punkte', richtig: n === w.summe,
        warum: n === w.summe ? 'Genau: Flächen ' + w.flaechen + ' + Reihen ' + w.linien + ' + Fische ' + w.fische + ' = ' + w.summe + '.' : 'Zähl nochmal: Flächen (nur ab 3 Feldern), volle Reihen (+4) und satte Fische (+4).' }))); } },
    { titel: 'Strategie', text: '<b>Ecken für Farben:</b> Bau jede Farbe an einer eigenen Stelle, dann wachsen die Flächen.<br><b>Felsen nutzen:</b> Reihen mit Felsen sind schneller voll.<br><b>Fische zuerst:</b> +4 für ein einziges Feld ist der beste Tausch.<br><b>Passen ist erlaubt:</b> Lieber eine Runde auslassen, als eine große Fläche zu blockieren.' },
  ],
});

// ---------- 🎻 Cello & Instrumente ----------
const fhNote = (schl, l, o, acc = 0) => (typeof notenSvg === 'function' ? '<div class="fh-noten">' + notenSvg(schl, note(l, acc, o)) + '</div>' : '');
fuehrung('cello', {
  titel: 'Cello-Noten', emoji: '🎻', thema: 'cello', intro: 'cello-intro',
  spick: () => '<h3>Noten &amp; Griffe am Cello</h3>'
    + '<div class="fh-regelzeile"><span>🎻</span><div><b>Leere Saiten</b>C – G – D – A (von tief nach hoch), jeweils eine Quinte auseinander.</div></div>'
    + '<div class="fh-regelzeile"><span>𝄢</span><div><b>Bassschlüssel</b>Linien von unten: G H D F A – „<b>G</b>ute <b>H</b>unde <b>D</b>ürfen <b>F</b>ast <b>A</b>lles“. Zwischenräume: A C E G – „<b>A</b>lle <b>C</b>ellisten <b>E</b>ssen <b>G</b>ern“.</div></div>'
    + '<div class="fh-regelzeile"><span>𝄞</span><div><b>Tenor- und Violinschlüssel</b>kommen in hohen Lagen. Der Tenorschlüssel zeigt mit seiner Mitte das c′ auf der 4. Linie.</div></div>'
    + '<div class="fh-regelzeile"><span>✋</span><div><b>Finger &amp; Lagen</b>In den unteren Lagen liegt jeder Finger einen Halbton weiter. Die Lage sagt, wo der 1. Finger steht. Ab der Daumenlage greift auch der Daumen (D).</div></div>'
    + '<div class="fh-kasten"><b>Vorzeichen</b><ul><li>♯ = einen Halbton höher: C → Cis</li><li>♭ = einen Halbton tiefer: D → Des (klingt wie Cis!)</li><li>Deutsch: H ist das „B“ der Engländer, B ist H mit ♭</li></ul></div>'
    + '<div class="fh-kasten"><b>Abzeichen</b>10 gemischte Aufgaben, 8 richtig = Abzeichen der Stufe: 🐴 → 🥉 → 🥈 → 🥇.</div>',
  schritte: [
    { titel: 'Die vier Saiten', bild: () => '<div class="fh-reihe">' + [['C', 2], ['G', 2], ['D', 3], ['A', 3]].map(([l, o]) => '<div class="fh-noten-klein">' + fhNote('bass', l, o) + '<b>' + l + '</b></div>').join('') + '</div>',
      text: 'Das Cello hat vier Saiten: <b>C, G, D, A</b> – von der dicksten zur dünnsten. Jede leere Saite ist ein fester Anker zum Notenlesen.' },
    { titel: 'Bassschlüssel lesen', bild: () => '<div class="fh-reihe">' + [['G', 2], ['H', 2], ['D', 3], ['F', 3], ['A', 3]].map(([l, o]) => '<div class="fh-noten-klein">' + fhNote('bass', l === 'H' ? 'B' : l, o) + '<b>' + l + '</b></div>').join('') + '</div>',
      text: 'Die fünf Linien von unten: <b>G H D F A</b> – „Gute Hunde Dürfen Fast Alles“. Die Zwischenräume: <b>A C E G</b> – „Alle Cellisten Essen Gern“. Der Bassschlüssel umarmt mit seinen zwei Punkten die F-Linie.',
      auftrag: (box, ok) => { box.innerHTML = fhNote('bass', 'F', 3) + '<div class="fh-q"></div>'; fhQuiz(box.querySelector('.fh-q'), ok, 'Welche Note ist das?', [
        { t: 'D', warum: 'D liegt eine Linie tiefer (3. Linie).' }, { t: 'F', richtig: true, warum: 'Genau: 4. Linie = F, zwischen den beiden Punkten des Schlüssels.' }, { t: 'A', warum: 'A ist die oberste Linie.' }]); } },
    { titel: 'Finger und Lagen', bild: () => (typeof griffbrettSvg === 'function' ? '<div class="fh-griff">' + griffbrettSvg('1') + '</div>' : ''),
      text: 'In der <b>1. Lage</b> steht der 1. Finger einen Ganzton über der leeren Saite, jeder weitere Finger einen Halbton höher. Auf der A-Saite: 1 = H, 2 = C, 3 = Cis, 4 = D. Die Lage verschiebt die ganze Hand.' },
    { titel: 'Vorzeichen', text: '<b>♯</b> macht einen Ton einen Halbton höher (C → <b>Cis</b>), <b>♭</b> einen Halbton tiefer (D → <b>Des</b>). Cis und Des klingen gleich – sie heißen nur je nach Tonart anders. Im Deutschen heißt das englische „B“ <b>H</b>, und <b>B</b> ist H mit ♭.',
      auftrag: (box, ok) => fhQuiz(box, ok, 'Welcher Ton klingt gleich wie Fis?', [
        { t: 'Ges', richtig: true, warum: 'Genau: F + ♯ = G + ♭.' }, { t: 'Fes', warum: 'Fes ist F mit ♭ – das klingt wie E.' }, { t: 'Gis', warum: 'Gis ist zwei Halbtöne höher.' }]) },
  ],
});
const FH_INST = {
  klavier: { saiten: '', spick: '<div class="fh-regelzeile"><span>🎹</span><div><b>Tasten finden</b>Schwarze Tasten kommen in Zweier- und Dreiergruppen. <b>C</b> liegt direkt links von der Zweiergruppe, <b>F</b> links von der Dreiergruppe.</div></div>'
    + '<div class="fh-regelzeile"><span>𝄞</span><div><b>Violinschlüssel</b> (rechte Hand) Linien von unten: E G H D F – „<b>E</b>s <b>G</b>eht <b>H</b>urtig <b>D</b>urch <b>F</b>leiß“. Zwischenräume: F A C E.</div></div>'
    + '<div class="fh-regelzeile"><span>𝄢</span><div><b>Bassschlüssel</b> (linke Hand) Linien: G H D F A – „Gute Hunde Dürfen Fast Alles“.</div></div>',
    bild: () => { const weiss = 'CDEFGAHCDEFGAH'.split(''); let s = '<svg class="fh-klavier" viewBox="0 0 280 110">';
      weiss.forEach((n, i) => { s += '<rect class="w' + (n === 'C' || n === 'F' ? ' an' : '') + '" x="' + (i * 20) + '" y="0" width="19" height="105" rx="3"/><text x="' + (i * 20 + 9.5) + '" y="96" text-anchor="middle">' + n + '</text>'; });
      [0, 1, 3, 4, 5, 7, 8, 10, 11, 12].forEach((i) => { s += '<rect class="s" x="' + (i * 20 + 13) + '" y="0" width="13" height="62" rx="2"/>'; });
      return s + '</svg>'; },
    text: 'Die schwarzen Tasten sind deine Landkarte: <b>C</b> liegt immer links von zwei schwarzen Tasten, <b>F</b> links von dreien. Von dort zählst du weiter: C D E F G A H.' },
  gitarre: { spick: '<div class="fh-regelzeile"><span>🎸</span><div><b>Saiten</b>E A D G H e (tief nach hoch) – „<b>E</b>ine <b>A</b>lte <b>D</b>ame <b>G</b>eht <b>H</b>eute <b>E</b>inkaufen“.</div></div>'
    + '<div class="fh-regelzeile"><span>🎯</span><div><b>Bünde</b>Jeder Bund = ein Halbton höher. Im <b>5. Bund</b> klingt die nächste leere Saite – außer auf der G-Saite: dort im <b>4. Bund</b> (H).</div></div>'
    + '<div class="fh-regelzeile"><span>𝄞</span><div><b>Noten</b>Gitarre wird im Violinschlüssel notiert, klingt aber eine Oktave tiefer.</div></div>',
    bild: () => '<div class="fh-saiten">' + ['E', 'A', 'D', 'G', 'H', 'e'].map((s, i) => '<div style="--d:' + (3.2 - i * 0.45) + 'px"><b>' + s + '</b><i></i></div>').join('') + '</div>',
    text: 'Sechs Saiten: <b>E A D G H e</b>. Jeder Bund macht den Ton einen Halbton höher. Trick: Im 5. Bund klingt die nächsthöhere leere Saite (auf der G-Saite schon im 4. Bund).' },
  ukulele: { spick: '<div class="fh-regelzeile"><span>🪕</span><div><b>Saiten</b>G C E A – „<b>G</b>ute <b>C</b>ola <b>E</b>rfrischt <b>A</b>lle“. Die G-Saite ist höher gestimmt als die C-Saite („Re-entrant“).</div></div>'
    + '<div class="fh-regelzeile"><span>🎯</span><div><b>Bünde</b>Jeder Bund = ein Halbton. C-Saite 4. Bund = E, E-Saite 5. Bund = A.</div></div>',
    bild: () => '<div class="fh-saiten">' + ['G', 'C', 'E', 'A'].map((s, i) => '<div style="--d:' + [2, 2.6, 2.3, 1.8][i] + 'px"><b>' + s + '</b><i></i></div>').join('') + '</div>',
    text: 'Vier Saiten: <b>G C E A</b>. Besonderheit: Die G-Saite klingt <b>höher</b> als die C-Saite – darum klingt die Ukulele so hell. Jeder Bund = ein Halbton.' },
};
const fhInst = () => FH_INST[(typeof instOpt !== 'undefined' && instOpt.inst) || 'klavier'] || FH_INST.klavier;
const fhInstName = () => (typeof INSTRUMENTE !== 'undefined' && typeof instOpt !== 'undefined' && INSTRUMENTE[instOpt.inst] ? INSTRUMENTE[instOpt.inst].name : 'Instrument');
fuehrung('instrument', {
  titel: 'Noten & Griffe', emoji: '🎵', thema: 'cello', intro: 'inst-intro',
  spick: () => '<h3>' + fhInstName() + ': Noten &amp; Griffe</h3>' + fhInst().spick
    + '<div class="fh-kasten"><b>Akkorde</b><ul><li><b>Dur</b> = Grundton + 4 Halbtöne + 3 Halbtöne (C-E-G), klingt fröhlich</li><li><b>Moll</b> = Grundton + 3 + 4 (A-C-E), klingt traurig</li></ul></div>'
    + '<div class="fh-kasten"><b>Vorzeichen</b> ♯ = Halbton höher, ♭ = Halbton tiefer. Cis klingt wie Des. Deutsch: H statt B.</div>',
  schritte: [
    { titel: () => 'Orientierung am ' + fhInstName(), bild: () => fhInst().bild(), text: () => fhInst().text },
    { titel: 'Violinschlüssel lesen', bild: () => '<div class="fh-reihe">' + [['E', 4], ['G', 4], ['H', 4], ['D', 5], ['F', 5]].map(([l, o]) => '<div class="fh-noten-klein">' + fhNote('violin', l === 'H' ? 'B' : l, o) + '<b>' + l + '</b></div>').join('') + '</div>',
      text: 'Linien von unten: <b>E G H D F</b> – „Es Geht Hurtig Durch Fleiß“. Zwischenräume: <b>F A C E</b>. Der Schlüssel kringelt sich um die G-Linie.',
      auftrag: (box, ok) => { box.innerHTML = fhNote('violin', 'A', 4) + '<div class="fh-q"></div>'; fhQuiz(box.querySelector('.fh-q'), ok, 'Welche Note ist das?', [
        { t: 'A', richtig: true, warum: 'Genau: 2. Zwischenraum = A (F-<b>A</b>-C-E).' }, { t: 'G', warum: 'G liegt auf der 2. Linie, eins tiefer.' }, { t: 'C', warum: 'C ist der 3. Zwischenraum.' }]); } },
    { titel: 'Dur und Moll', bild: () => '<div class="fh-gleichung"><span class="fh-chip">C</span>+4<span class="fh-chip">E</span>+3<span class="fh-chip">G</span>=<b>C-Dur 😊</b></div><div class="fh-gleichung"><span class="fh-chip">A</span>+3<span class="fh-chip">C</span>+4<span class="fh-chip">E</span>=<b>a-Moll 😢</b></div>',
      text: 'Ein Akkord sind drei Töne im Terzabstand. Bei <b>Dur</b> kommt erst die große Terz (4 Halbtöne), bei <b>Moll</b> erst die kleine (3).',
      auftrag: (box, ok) => fhQuiz(box, ok, 'Welche Töne hat G-Dur?', [
        { t: 'G – H – D', richtig: true, warum: 'Genau: G + 4 Halbtöne = H, + 3 = D.' }, { t: 'G – B – D', warum: 'Das ist g-Moll (kleine Terz zuerst).' }, { t: 'G – C – E', warum: 'Das ist C-Dur, nur umgestellt.' }]) },
  ],
});

// ---------- 🔎 Wer war’s? – Übungsfälle ----------
fuehrung('krimi-wachen', {
  titel: 'Queens – Übungsfall', emoji: '💂', thema: 'krimi',
  schritte: [
    { titel: 'Drei Regeln', bild: () => { const r = [0, 0, 1, 1, 1, 0, 0, 1, 2, 2, 3, 0, 4, 2, 2, 3, 3, 4, 4, 2, 3, 3, 4, 4, 4]; return fhGitter(5, r, { 7: '💂' }, fhSperre(5, r, 7)); },
      text: 'Jede <b>Reihe</b>, jede <b>Spalte</b> und jeder farbige <b>Raum</b> bekommt genau eine Wache – und Wachen dürfen sich nicht berühren, auch nicht schräg. Eine Wache sperrt also ihre Reihe, ihre Spalte, ihren Raum und alle 8 Nachbarfelder (✕).' },
    { titel: 'Trick 1: Kleinster Raum zuerst', bild: () => fhGitter(5, [0, 0, 1, 1, 1, 0, 2, 1, 1, 1, 3, 3, 3, 3, 1, 4, 4, 3, 3, 3, 4, 4, 3, 3, 3], {}, [], [6]),
      text: 'Der rosa Raum hat nur <b>ein Feld</b> – dort muss die Wache stehen. Allgemein: Fang beim Raum mit den wenigsten freien Feldern an.' },
    { titel: 'Trick 2: Raum in einer Reihe', bild: () => fhGitter(5, [0, 0, 0, 1, 1, 2, 2, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 3, 3, 3, 4, 4, 4, 3, 3], {}, [3, 4], [0, 1, 2]),
      text: 'Der rote Raum liegt <b>komplett in der obersten Reihe</b>. Seine Wache steht also sicher in dieser Reihe – darum bekommen alle anderen Felder der Reihe ein ✕. Das gleiche gilt für Spalten.' },
    { titel: 'Prüf dich', auftrag: (box, ok) => fhQuiz(box, ok, 'Eine Wache steht in der Mitte eines 5×5-Felds. Wie viele Felder sperrt sie <b>mindestens</b> (Reihe, Spalte, Nachbarn)?', [
      { t: '8', warum: 'Das sind nur die Nachbarn – Reihe und Spalte kommen dazu.' }, { t: '12', richtig: true, warum: 'Genau: 4 in der Reihe + 4 in der Spalte + 4 schräge Nachbarn = 12 (die geraden Nachbarn liegen schon in Reihe/Spalte).' }, { t: '16', warum: 'Zu viel – die geraden Nachbarn liegen schon in Reihe und Spalte.' }]),
      text: 'Das Laternenlicht im Spiel zeigt dir genau diese gesperrten Felder.' },
  ],
});
// Felder, die eine Wache auf z sperrt: Reihe, Spalte, Raum und alle Nachbarn
function fhSperre(n, raeume, z) {
  const r = Math.floor(z / n), c = z % n;
  return raeume.map((_, k) => k).filter((k) => k !== z && (Math.floor(k / n) === r || k % n === c || raeume[k] === raeume[z] || (Math.abs(Math.floor(k / n) - r) <= 1 && Math.abs(k % n - c) <= 1)));
}
function fhGitter(n, raeume, inhalt = {}, kreuze = [], hervor = []) {
  const farben = ['#fca5a5', '#fde68a', '#f9a8d4', '#93c5fd', '#a7f3d0', '#c4b5fd', '#fdba74'];
  return '<div class="fh-gitter" style="--n:' + n + '">' + raeume.map((r, z) => {
    const rand = (dz) => { const o = z + dz; return o < 0 || o >= n * n || (dz === 1 && z % n === n - 1) || (dz === -1 && z % n === 0) || raeume[o] !== r; };
    const st = 'background:' + farben[r % farben.length] + ';border-top-width:' + (rand(-n) ? 3 : 1) + 'px;border-left-width:' + (rand(-1) ? 3 : 1) + 'px;border-right-width:' + (rand(1) ? 3 : 1) + 'px;border-bottom-width:' + (rand(n) ? 3 : 1) + 'px';
    return '<i class="' + (hervor.includes(z) ? 'hervor' : '') + '" style="' + st + '">' + (inhalt[z] || (kreuze.includes(z) ? '✕' : '')) + '</i>';
  }).join('') + '</div>';
}
fuehrung('krimi-mord', {
  titel: 'Murdoku – Übungsfall', emoji: '🗡️', thema: 'krimi',
  schritte: [
    { titel: 'Wie ein Sudoku', bild: () => fhGitter(4, [0, 0, 1, 1, 0, 0, 3, 3, 2, 2, 3, 3, 2, 2, 3, 3], { 1: '👩', 7: '🧔', 8: '🧑', 14: '💀' }),
      text: 'Wie beim Sudoku steht in jeder <b>Reihe</b> und <b>Spalte</b> genau eine Person – auch das Opfer 💀. Die farbigen Bereiche sind die Räume der Villa.' },
    { titel: 'Hinweise eingrenzen', text: 'Lies alle Hinweise und fang mit den <b>engsten</b> an: „Clara saß im Sessel“ (nur wenige Sessel) oder „Ben stand in der obersten Reihe“. Mit <b>✕ Ausschließen</b> markierst du Felder, auf denen sicher niemand stand – so bleiben für andere Personen oft nur noch ein oder zwei Felder übrig.' },
    { titel: 'Wer war es?', bild: () => fhGitter(4, [0, 0, 1, 1, 0, 0, 3, 3, 2, 2, 3, 3, 2, 2, 3, 3], { 1: '👩', 7: '🧔', 8: '🧑', 14: '💀' }, [], [14, 7]),
      text: 'Wenn alle stehen: Der Mörder ist, wer <b>allein mit dem Opfer</b> in einem Raum war.',
      auftrag: (box, ok) => fhQuiz(box, ok, 'Wer war allein mit dem Opfer 💀 im Raum?', [
        { t: '👩 Anna', warum: 'Anna steht im roten Raum oben links – allein, aber ohne Opfer.' }, { t: '🧔 Ben', richtig: true, warum: 'Genau: Ben und das Opfer sind beide im blauen Raum – sonst niemand.' }, { t: '🧑 Clara', warum: 'Clara steht im rosa Raum unten links.' }]) },
  ],
});
fuehrung('krimi-verhoer', {
  titel: 'Verhör – Übungsfall', emoji: '🗣️', thema: 'krimi',
  schritte: [
    { titel: 'Ehrlich oder gelogen?', text: 'Im Verhör sagt jede Person einen Satz. Ehrliche sagen die Wahrheit, Lügner etwas Falsches. Der Trick: <b>Probier jede Möglichkeit aus</b> und zähl, wie viele dann lügen würden.' },
    { titel: 'Auftrag: Finde den Täter', text: '<b>Genau eine Person lügt – und das ist der Täter.</b><br>🧑 Anna: „Ben war es.“<br>🧔 Ben: „Ich war es nicht.“<br>👩 Clara: „Anna sagt die Wahrheit.“<br>Tippe eine Annahme an und schau, wie viele dann lügen.',
      auftrag: (box, ok) => {
        const P = ['Anna', 'Ben', 'Clara'];
        const wahr = (t) => [t === 1, t !== 1, t === 1];   // Annas Satz wahr, wenn Ben; Bens Satz wahr, wenn nicht Ben; Clara wie Anna
        box.innerHTML = '<div class="fh-wahl">' + P.map((p, i) => '<button class="fh-opt" type="button" data-t="' + i + '">Annahme: ' + p + ' war’s</button>').join('') + '</div><div id="fhVerh"></div>';
        box.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
          const t = Number(b.dataset.t), w = wahr(t), luegner = P.filter((_, i) => !w[i]);
          const passt = luegner.length === 1 && luegner[0] === P[t];
          $('fhVerh').innerHTML = '<table class="fh-tabelle">' + P.map((p, i) => '<tr><th>' + p + '</th><td>' + (w[i] ? '✓ wahr' : '✗ gelogen') + '</td></tr>').join('') + '</table><div class="fh-messung">'
            + luegner.length + (luegner.length === 1 ? ' Lügner' : ' Lügner') + ' – ' + (passt ? '<b>passt!</b>' : 'passt nicht zur Regel (genau einer lügt, und zwar der Täter).') + '</div>';
          b.classList.add(passt ? 'richtig' : 'falsch');
          if (passt) ok('Gelöst: Nur bei Ben lügt genau eine Person – Ben selbst. Also war es <b>Ben</b>.');
        }));
      } },
    { titel: 'Verräterische Sätze', text: 'Sätze wie „Lara lügt“ sind Gold wert: Entweder Lara lügt wirklich – oder wer das sagt, lügt selbst. Einer von beiden ist also auf jeden Fall ein Lügner. Mit dem Notiz-Knopf merkst du dir deine Annahmen (✓ ehrlich, ✗ Lügner).' },
  ],
});
fuehrung('krimi-alibi', {
  titel: 'Alibi-Raster – Übungsfall', emoji: '🕰️', thema: 'krimi',
  schritte: [
    { titel: 'Das Raster', text: 'Jede <b>Zeile</b> ist eine Person, jede <b>Spalte</b> ein Raum (im Spiel auch Zeiten und Gegenstände). In jeder Zeile und jeder Spalte gibt es genau ein ✓. Setzt du ein ✓, ist der Rest von Zeile und Spalte automatisch ✕.' },
    { titel: 'Auftrag: Kläre die Alibis', text: '<b>Hinweise:</b><br>1. Anna war <b>nicht</b> in der Küche.<br>2. Ben war in der Bibliothek.<br>3. Clara war <b>nicht</b> im Salon.<br>Tippe ein Feld: einmal = ✕, zweimal = ✓.',
      auftrag: (box, ok) => {
        const P = ['Anna', 'Ben', 'Clara'], R = ['🍳 Küche', '📚 Biblioth.', '🛋️ Salon'], loesung = [2, 1, 0];
        const z = Array(9).fill(0);
        const zeichnen = () => {
          box.innerHTML = '<div class="fh-raster"><span></span>' + R.map((r) => '<span class="kopf">' + r + '</span>').join('')
            + P.map((p, i) => '<span class="kopf">' + p + '</span>' + R.map((_, j) => '<button type="button" data-z="' + (i * 3 + j) + '">' + ['', '✕', '✓'][z[i * 3 + j]] + '</button>').join('')).join('') + '</div><div class="fh-messung" id="fhAlInfo"></div>';
          box.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { const k = Number(b.dataset.z); z[k] = (z[k] + 1) % 3; zeichnen(); }));
          const ok3 = P.every((_, i) => z[i * 3 + loesung[i]] === 2);
          const zuViel = z.filter((v) => v === 2).length > 3;
          if (zuViel) $('fhAlInfo').textContent = 'Zu viele ✓ – in jeder Zeile und Spalte nur eins!';
          if (ok3 && !zuViel) ok('Gelöst! Ben → Bibliothek (Hinweis 2). Für Anna bleibt ohne Küche nur der Salon. Und Clara bekommt die Küche. So arbeitest du dich auch durch die großen Raster: erst sichere ✓, dann ausschließen.');
        };
        zeichnen();
      } },
    { titel: 'Verknüpfte Hinweise', text: 'Im Spiel gibt es auch Hinweise wie „Wer den Schlüssel hatte, kam um 21 Uhr“. Die verbinden zwei Spaltengruppen: Ein ✓ bei Schlüssel bedeutet automatisch ein ✓ bei 21 Uhr – und ein ✕ bei Schlüssel ein ✕ bei 21 Uhr. Zeit-Hinweise („kam früher als Leon“) schließen das erste bzw. letzte Feld aus.' },
  ],
});

// ---------- 🐟 Piranha-Schwarm ----------
fuehrung('piranha', {
  titel: 'Piranha-Schwarm', emoji: '🐟', thema: 'karte', intro: 'pr-intro',
  spick: () => '<h3>So knabberst du jedes Bild weg</h3>'
    + '<div class="fh-regelzeile"><span>1</span><div><b>Von unten nach oben</b>Schwärme kommen von unten. Schau, welche Farben gerade am unteren Rand und an den Fressgängen liegen – die sind dran.</div></div>'
    + '<div class="fh-regelzeile"><span>2</span><div><b>Buchten sparen</b>Ein Schwarm, der nicht alles fressen kann, belegt eine Bucht. Schick lieber Schwärme los, deren Farbe gerade frei liegt.</div></div>'
    + '<div class="fh-regelzeile"><span>3</span><div><b>Höhlen freiräumen</b>Hintere Höhlen werden erst erreichbar, wenn ein Weg zum Fluss frei ist. Manchmal muss man einen Schwarm „parken“, um an den richtigen zu kommen.</div></div>'
    + '<div class="fh-regelzeile"><span>4</span><div><b>Steine und Algen</b>Sie sperren Pixel, auch als Durchgang. Die Zahl im Kreis zeigt, wie viele Pixel der Kreisfarbe noch übrig sind – bei 0 bröckelt der Stein weg. Diese Farbe also früh abräumen!</div></div>'
    + '<div class="fh-kasten"><b>Sterne</b> ⭐⭐⭐ = höchstens die Hälfte der Buchten gleichzeitig belegt, ⭐⭐ = nie alle. 💡 Tipp zeigt den Schwarm, der gerade am meisten frisst. Volle Buchten + Schwarm ohne Futter = verstopft → ↶ Zurück.</div>',
  schritte: [
    { titel: 'Das Bild abknabbern', text: 'Oben schwimmt ein Pixelbild. Jede Höhle unten hat eine Farbe und eine Zahl: so viele Piranhas. Ein Schwarm frisst Pixel seiner Farbe – aber nur solche, die von unten erreichbar sind.' },
    { titel: 'Die Buchten', text: 'Findet ein Schwarm nicht genug zu fressen, wartet der Rest in einer Bucht im Fluss und frisst automatisch, sobald seine Farbe frei wird. Buchten sind knapp!',
      auftrag: (box, ok) => fhQuiz(box, ok, 'Unten im Bild liegt gerade nur Blau frei. Welchen Schwarm schickst du?', [
        { t: 'Den blauen', richtig: true, warum: 'Genau: Er frisst sofort und braucht keine Bucht.' },
        { t: 'Den roten', warum: 'Rot liegt noch nicht frei – der Schwarm müsste in eine Bucht.' }]) },
    { titel: 'Steine und Algen', text: 'Manche Pixel sind von Steinen oder Algen verdeckt. Darauf steht ein Kreis mit einer Farbe und einer Zahl: So viele Pixel dieser Farbe müssen erst weg. Dann löst sich die Sperre und die Fische kommen weiter.',
      auftrag: (box, ok) => fhQuiz(box, ok, 'Auf einem Stein steht ein gelber Kreis mit „12“. Was öffnet ihn?', [
        { t: 'Alle 12 übrigen gelben Pixel wegfressen', richtig: true, warum: 'Genau: Ist Gelb ganz weg, bröckelt der Stein.' },
        { t: 'Einen gelben Schwarm in eine Bucht schicken', warum: 'Warten reicht nicht – die gelben Pixel müssen wirklich gefressen werden.' }]) },
    { titel: 'Planen', text: 'Gute Strategie: erst Schwärme, deren Farbe frei liegt. Ist keiner passend, park den Schwarm, der als Nächstes gebraucht wird – und räum dabei Wege zu hinteren Höhlen frei.' },
  ],
});

// ---------- Oberfläche ----------
const FH_SCREENS = { farben: 'farben', toene: 'toene', takt: 'takt', augen: 'augen', karte: 'karte', tiefgang: 'tiefgang', riff: 'riff', cello: 'cello', instrument: 'instrument', piranha: 'piranha' };
const fhStand = () => loadJson(FH_KEY);
let fhAktiv = null;
const fhDlg = document.createElement('dialog');
fhDlg.className = 'fh';
fhDlg.innerHTML = '<div class="fh-kopf"><span class="fh-emoji" id="fhEmoji"></span><b id="fhTitel"></b><button class="fh-x" type="button" id="fhX" aria-label="Schließen">×</button></div><div class="fh-inhalt" id="fhInhalt"></div>';
document.body.appendChild(fhDlg);
const fhZu = () => { if (fhDlg.close) fhDlg.close(); else fhDlg.removeAttribute('open'); fhAktiv = null; };
$('fhX').addEventListener('click', fhZu);
fhDlg.addEventListener('click', (e) => { if (e.target === fhDlg) fhZu(); });
function fhOeffnen(def) {
  fhDlg.className = 'fh fht-' + (def.thema || 'standard');
  $('fhEmoji').textContent = def.emoji;
  $('fhTitel').textContent = def.titel;
  if (!fhDlg.open) { if (typeof fhDlg.showModal === 'function') fhDlg.showModal(); else fhDlg.setAttribute('open', ''); }
  $('fhInhalt').scrollTop = 0;
}
function fhGesehen(id) { const st = fhStand(); st.gesehen = st.gesehen || {}; st.gesehen[id] = true; saveJson(FH_KEY, st); }

// Spickzettel mit Knopf zur geführten Einführung
function fhSpick(id) {
  const def = FUEHRUNGEN[id];
  if (!def) return;
  fhGesehen(id);
  fhOeffnen(def);
  $('fhInhalt').innerHTML = '<div class="fh-spick">' + def.spick() + '</div><button class="fh-haupt" type="button" id="fhTourLos">🧑‍🏫 Geführte Einführung starten</button>';
  $('fhTourLos').addEventListener('click', () => fhTour(id));
  document.querySelectorAll('.fh-blase').forEach((b) => b.remove());
  document.querySelectorAll('.fh-knopf.neu').forEach((b) => b.classList.remove('neu'));
}
// Geführte Einführung Schritt für Schritt
function fhTour(id) {
  const def = FUEHRUNGEN[id];
  if (!def) return;
  fhGesehen(id);
  fhAktiv = { id, schritt: 0, fertig: {} };
  fhOeffnen(def);
  fhSchritt();
  document.querySelectorAll('.fh-blase').forEach((b) => b.remove());
}
const fhWert = (v) => (typeof v === 'function' ? v() : v || '');
function fhSchritt() {
  const def = FUEHRUNGEN[fhAktiv.id], S = def.schritte[fhAktiv.schritt], hier = fhAktiv.schritt, letzte = hier === def.schritte.length - 1;
  const fertig = !S.auftrag || fhAktiv.fertig[hier];
  $('fhInhalt').innerHTML = '<div class="fh-punkte">' + def.schritte.map((_, i) => '<i class="' + (i < hier || fhAktiv.fertig[i] ? 'fertig' : '') + (i === hier ? ' jetzt' : '') + '"></i>').join('') + '</div>'
    + '<h3 class="fh-schritt-titel">' + fhWert(S.titel) + '</h3>' + (S.bild ? '<div class="fh-bild">' + fhWert(S.bild) + '</div>' : '')
    + (S.text ? '<div class="fh-text">' + fhWert(S.text) + '</div>' : '') + (S.auftrag ? '<div class="fh-auftrag" id="fhAuftrag"></div>' : '')
    + '<div class="fh-geschafft" id="fhGeschafft" hidden></div>'
    + '<div class="fh-nav"><button type="button" class="fh-zweit" id="fhZurueck"' + (hier ? '' : ' disabled') + '>‹ Zurück</button><button type="button" class="fh-haupt" id="fhWeiter"' + (fertig ? '' : ' disabled') + '>' + (letzte ? 'Los geht’s ✓' : 'Weiter ›') + '</button></div>'
    + (S.auftrag && !fertig ? '<button type="button" class="fh-ueber" id="fhUeber">Auftrag überspringen</button>' : '');
  $('fhInhalt').scrollTop = 0;
  const geschafft = (text) => {
    if (!fhAktiv || fhAktiv.schritt !== hier || fhAktiv.fertig[hier]) return;
    fhAktiv.fertig[hier] = true;
    $('fhGeschafft').hidden = false;
    $('fhGeschafft').innerHTML = '✅ ' + (text || 'Geschafft!');
    $('fhWeiter').disabled = false;
    if ($('fhUeber')) $('fhUeber').remove();
    if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    if (typeof konfetti === 'function') konfetti(10, ['✨', def.emoji, '🎯']);
  };
  if (S.auftrag) S.auftrag($('fhAuftrag'), geschafft);
  $('fhZurueck').addEventListener('click', () => { fhAktiv.schritt--; fhSchritt(); });
  $('fhWeiter').addEventListener('click', () => { if (letzte) fhZu(); else { fhAktiv.schritt++; fhSchritt(); } });
  if ($('fhUeber')) $('fhUeber').addEventListener('click', () => { fhAktiv.fertig[hier] = true; fhSchritt(); });
}

// ?-Knopf in die Kopfzeile jedes Spiels, dazu ein Knopf „Geführte Einführung“ auf der Startseite des Spiels
Object.entries(FH_SCREENS).forEach(([screen, id]) => {
  const kopf = document.querySelector('#screen-' + screen + ' .farb-kopf');
  if (kopf && !kopf.querySelector('.fh-knopf')) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'icon-btn fh-knopf'; b.textContent = '?'; b.title = 'Hilfe & Einführung';
    b.setAttribute('aria-label', 'Hilfe und Einführung');
    b.addEventListener('click', () => fhSpick(id));
    kopf.appendChild(b);
  }
  const def = FUEHRUNGEN[id], intro = def && def.intro && $(def.intro);
  if (intro && !intro.querySelector('.fh-intro-btn')) {
    const ziel = intro.querySelector('.spalte-b') || intro;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn secondary fh-intro-btn'; b.textContent = '🧑‍🏫 Geführte Einführung';
    b.addEventListener('click', () => fhTour(id));
    ziel.appendChild(b);
  }
});
// Beim ersten Öffnen eines Spiels: ?-Knopf leuchtet, kleine Sprechblase
function fhBeimOeffnen(screen) {
  const id = FH_SCREENS[screen];
  if (!id || (fhStand().gesehen || {})[id]) return;
  const knopf = document.querySelector('#screen-' + screen + ' .fh-knopf');
  if (!knopf || knopf.parentElement.querySelector('.fh-blase')) return;
  knopf.classList.add('neu');
  const blase = document.createElement('span');
  blase.className = 'fh-blase';
  blase.innerHTML = 'Neu hier? Tipp auf <b>?</b> für eine Einführung';
  blase.addEventListener('click', () => fhSpick(id));
  knopf.parentElement.appendChild(blase);
  setTimeout(() => blase.remove(), 9000);
}
if (typeof show === 'function') {
  const fhAltShow = show;
  show = function (name, ...rest) { const r = fhAltShow(name, ...rest); try { fhBeimOeffnen(name); } catch (e) { /* Hilfe ist Zugabe */ } return r; };
}
// Wer war’s?: in der Regel-Hilfe einen Knopf zum Übungsfall des Modus
if (typeof krimiHilfe === 'function' && $('khOk')) {
  const fhAltKrimi = krimiHilfe;
  const knopf = document.createElement('button');
  knopf.type = 'button'; knopf.className = 'btn secondary fh-krimi-btn'; knopf.textContent = '🧑‍🏫 Übungsfall Schritt für Schritt';
  $('khOk').parentElement.insertBefore(knopf, $('khOk'));
  let modus = null;
  knopf.addEventListener('click', () => { $('krimiHilfe').hidden = true; fhTour('krimi-' + modus); });
  krimiHilfe = function (id) { fhAltKrimi(id); modus = id; knopf.hidden = !FUEHRUNGEN['krimi-' + id]; };
}
