// 🐉 Slowenisch mit Zmajček: eine Sprachreise durch Slowenien. Jede Station ist ein Thema mit drei Stufen.
// Aufgaben: neues Wort, Bild wählen, Übersetzung wählen, Paare finden, Satz verstehen, Satz bauen, Lücke füllen,
// Wort tippen (mit č š ž) und – wenn das Gerät eine slowenische Stimme hat – Hören. Falsche Antworten kommen am Ende der
// Lektion noch einmal dran. Fortschritt, XP, Tagesziel, Serie und Wortstärke je Profil.
const SLO_KEY = 'walquiz.slo.v1';
const SLO_TAGESZIEL = 30;

// ---------- Inhalte ----------
// woerter: [slowenisch, deutsch, Bild]; saetze: [slowenisch, deutsch, weitere slowenische Lösungen, weitere deutsche Lösungen]
const SLO_EINHEITEN = [
  { id: 'pozdravi', ort: 'Ljubljana', ortEmoji: '🐉', titel: 'Pozdravi', de: 'Begrüßen', farbe: '#22c55e',
    tipp: '<p><b>Du oder Sie?</b> Wie im Deutschen gibt es zwei Formen: <i>Kako si?</i> (Wie geht es dir?) und <i>Kako ste?</i> (Wie geht es Ihnen?).</p>'
      + '<p><b>živjo</b> heißt unter Freunden „hallo“ <i>und</i> „tschüss“.</p>'
      + '<p><b>Aussprache:</b> č = tsch · š = sch · ž = wie „j“ in Journal · c = z · z = weiches s · s = scharfes s · v am Wortende ≈ u.</p>',
    woerter: [['zdravo', 'hallo', '👋'], ['dober dan', 'guten Tag', '☀️'], ['hvala', 'danke', '🙏'], ['prosim', 'bitte', '🤲'], ['ja', 'ja', '✅'], ['ne', 'nein', '❌'],
      ['dobro jutro', 'guten Morgen', '🌅'], ['dober večer', 'guten Abend', '🌆'], ['lahko noč', 'gute Nacht', '🌙'], ['nasvidenje', 'auf Wiedersehen', '🚪'], ['živjo', 'hi', '🙌'], ['oprostite', 'Entschuldigung', '🙇']],
    saetze: [['Dober dan, kako ste?', 'Guten Tag, wie geht es Ihnen?'], ['Kako si?', 'Wie geht es dir?', [], ['Wie gehts dir']], ['Dobro, hvala.', 'Gut, danke.'],
      ['Hvala lepa.', 'Vielen Dank.', [], ['Danke schön', 'Danke sehr']], ['Ni za kaj.', 'Keine Ursache.', [], ['Gern geschehen', 'Bitte']], ['Lahko noč, mama.', 'Gute Nacht, Mama.']] },
  { id: 'jaz', ort: 'Bled', ortEmoji: '🏝️', titel: 'Jaz in ti', de: 'Sich vorstellen', farbe: '#38bdf8',
    tipp: '<p><b>biti (sein):</b> jaz <b>sem</b> · ti <b>si</b> · on/ona <b>je</b> · mi <b>smo</b> · vi <b>ste</b> · oni <b>so</b>.</p>'
      + '<p>Das Wort für „ich“ lässt man meist weg: <i>Sem Ana.</i> = Ich bin Ana.</p>'
      + '<p><b>Woher?</b> iz + Genitiv: Nemčija → <i>iz Nemčije</i>, Slovenija → <i>iz Slovenije</i>.</p>',
    woerter: [['jaz', 'ich', '🙋'], ['ti', 'du', '👉'], ['on', 'er', '👨'], ['ona', 'sie (eine Frau)', '👩'], ['ime', 'Name', '🏷️'], ['prijatelj', 'Freund', '🤝'],
      ['mi', 'wir', '👥'], ['prijateljica', 'Freundin', '💁‍♀️'], ['Nemčija', 'Deutschland', '🇩🇪'], ['Slovenija', 'Slowenien', '🇸🇮'], ['moj', 'mein', '🫵']],
    saetze: [['Jaz sem Ana.', 'Ich bin Ana.', ['Sem Ana']], ['Kako ti je ime?', 'Wie heißt du?'], ['Ime mi je Luka.', 'Ich heiße Luka.', [], ['Mein Name ist Luka']],
      ['Od kod si?', 'Woher kommst du?', [], ['Woher bist du']], ['Sem iz Nemčije.', 'Ich bin aus Deutschland.', ['Jaz sem iz Nemčije'], ['Ich komme aus Deutschland']],
      ['Me veseli.', 'Freut mich.'], ['On je moj prijatelj.', 'Er ist mein Freund.'], ['Mi smo iz Slovenije.', 'Wir sind aus Slowenien.', [], ['Wir kommen aus Slowenien']]] },
  { id: 'stevilke', ort: 'Piran', ortEmoji: '⚓', titel: 'Številke', de: 'Zahlen', farbe: '#f59e0b',
    tipp: '<p><b>Slowenisch hat den Dual</b> – eine eigene Form für genau zwei: <i>en brat</i> (ein Bruder), <i>dva brata</i> (zwei Brüder), <i>dve sestri</i> (zwei Schwestern).</p>'
      + '<p>Ab fünf folgt der Genitiv Plural: <i>pet evrov</i> (fünf Euro).</p><p><b>Alter</b> sagt man mit „haben“: <i>Imam deset let.</i> = Ich bin zehn (Jahre alt).</p>',
    woerter: [['ena', 'eins', '1️⃣'], ['dva', 'zwei', '2️⃣'], ['tri', 'drei', '3️⃣'], ['štiri', 'vier', '4️⃣'], ['pet', 'fünf', '5️⃣'], ['šest', 'sechs', '6️⃣'],
      ['sedem', 'sieben', '7️⃣'], ['osem', 'acht', '8️⃣'], ['devet', 'neun', '9️⃣'], ['deset', 'zehn', '🔟'], ['dvajset', 'zwanzig', '20'], ['sto', 'hundert', '💯']],
    saetze: [['Imam dva brata.', 'Ich habe zwei Brüder.'], ['Imam dve sestri.', 'Ich habe zwei Schwestern.'], ['Koliko stane?', 'Wie viel kostet das?', [], ['Was kostet das', 'Wie viel kostet es']],
      ['To stane pet evrov.', 'Das kostet fünf Euro.'], ['Ura je tri.', 'Es ist drei Uhr.'], ['Imam deset let.', 'Ich bin zehn Jahre alt.', [], ['Ich bin zehn']]] },
  { id: 'barve', ort: 'Postojna', ortEmoji: '🦎', titel: 'Barve', de: 'Farben', farbe: '#ec4899',
    tipp: '<p><b>Farben passen sich an:</b> rdeč (männlich) · rdeča (weiblich) · rdeče (sächlich). <i>Avto je rdeč. Hiša je rdeča. Jabolko je rdeče.</i></p>'
      + '<p>Die Wörter hier stehen in der weiblichen Form, weil <i>barva</i> (Farbe) weiblich ist.</p>'
      + '<p>Der weiße Grottenolm aus der Höhle von Postojna heißt <i>človeška ribica</i> – „Menschenfischlein“.</p>',
    woerter: [['rdeča', 'rot', '🔴'], ['modra', 'blau', '🔵'], ['zelena', 'grün', '🟢'], ['rumena', 'gelb', '🟡'], ['črna', 'schwarz', '⚫'], ['bela', 'weiß', '⚪'],
      ['rjava', 'braun', '🟤'], ['oranžna', 'orange', '🟠'], ['vijolična', 'lila', '🟣'], ['siva', 'grau', '🩶'], ['barva', 'Farbe', '🎨']],
    saetze: [['Hiša je bela.', 'Das Haus ist weiß.'], ['Nebo je modro.', 'Der Himmel ist blau.'], ['Avto je rdeč.', 'Das Auto ist rot.'],
      ['Moja najljubša barva je zelena.', 'Meine Lieblingsfarbe ist grün.'], ['Banana je rumena.', 'Die Banane ist gelb.'], ['Človeška ribica je bela.', 'Der Grottenolm ist weiß.']] },
  { id: 'hrana', ort: 'Maribor', ortEmoji: '🍇', titel: 'Hrana in pijača', de: 'Essen & Trinken', farbe: '#ef4444',
    tipp: '<p><b>Ich hätte gern …</b> <i>Rad bi …</i> (als Mann) · <i>Rada bi …</i> (als Frau).</p>'
      + '<p>Beim Bestellen wird aus <b>-a</b> ein <b>-o</b>: kava → <i>eno kavo</i>, voda → <i>vodo</i>.</p>'
      + '<p>In Maribor wächst die älteste Weinrebe der Welt, die <i>Stara trta</i> – über 400 Jahre alt.</p>',
    woerter: [['kruh', 'Brot', '🍞'], ['voda', 'Wasser', '💧'], ['kava', 'Kaffee', '☕'], ['čaj', 'Tee', '🍵'], ['mleko', 'Milch', '🥛'], ['sir', 'Käse', '🧀'],
      ['jabolko', 'Apfel', '🍎'], ['vino', 'Wein', '🍷'], ['pivo', 'Bier', '🍺'], ['juha', 'Suppe', '🍲'], ['riba', 'Fisch', '🐟'], ['sladoled', 'Eis', '🍦']],
    saetze: [['Eno kavo, prosim.', 'Einen Kaffee, bitte.'], ['Rad bi vodo.', 'Ich hätte gern Wasser.', ['Rada bi vodo']], ['Račun, prosim.', 'Die Rechnung, bitte.'],
      ['Dober tek!', 'Guten Appetit!'], ['Na zdravje!', 'Prost!', [], ['Zum Wohl', 'Gesundheit']], ['Kruh je svež.', 'Das Brot ist frisch.']] },
  { id: 'druzina', ort: 'Ptuj', ortEmoji: '🎭', titel: 'Družina', de: 'Familie', farbe: '#a855f7',
    tipp: '<p><b>mein:</b> <i>moj</i> brat (m) · <i>moja</i> mama (f) · <i>moje</i> ime (n).</p>'
      + '<p>„Ich habe eine Schwester“: <i>Imam sestro.</i> – auch hier wird -a zu -o.</p>'
      + '<p>Zu Feiertagen backt man <i>potico</i>, einen gerollten Nusskuchen. In Ptuj jagen im Fasching die zotteligen <i>Kurenti</i> den Winter fort.</p>',
    woerter: [['mama', 'Mama', '👩'], ['oče', 'Vater', '👨'], ['brat', 'Bruder', '👱‍♂️'], ['sestra', 'Schwester', '👱‍♀️'], ['babica', 'Oma', '👵'], ['dedek', 'Opa', '👴'],
      ['sin', 'Sohn', '👦'], ['hči', 'Tochter', '👧'], ['družina', 'Familie', '👪'], ['otrok', 'Kind', '🧒'], ['potica', 'Nusskuchen', '🥮']],
    saetze: [['To je moja mama.', 'Das ist meine Mama.', [], ['Das ist meine Mutter']], ['To je moj oče.', 'Das ist mein Vater.'], ['Imam sestro.', 'Ich habe eine Schwester.'],
      ['Moj brat je visok.', 'Mein Bruder ist groß.'], ['Babica peče potico.', 'Oma backt Potica.', [], ['Die Oma backt Potica', 'Oma backt Nusskuchen']], ['Imamo veliko družino.', 'Wir haben eine große Familie.']] },
  { id: 'zivali', ort: 'Soča', ortEmoji: '🛶', titel: 'Živali', de: 'Tiere', farbe: '#14b8a6',
    tipp: '<p>Der Hai heißt <b>morski pes</b> – wörtlich „Meereshund“!</p>'
      + '<p><i>pes</i> (Hund) wird zu <i>psa</i>: <i>Imam psa.</i> = Ich habe einen Hund.</p>'
      + '<p>Aus Slowenien stammen die Krainer Biene (<i>kranjska čebela</i>) und die Lipizzaner. In der smaragdgrünen Soča lebt die Marmorierte Forelle.</p>',
    woerter: [['pes', 'Hund', '🐶'], ['mačka', 'Katze', '🐱'], ['konj', 'Pferd', '🐴'], ['krava', 'Kuh', '🐮'], ['ptica', 'Vogel', '🐦'], ['medved', 'Bär', '🐻'],
      ['čebela', 'Biene', '🐝'], ['kit', 'Wal', '🐋'], ['morski pes', 'Hai', '🦈'], ['zmaj', 'Drache', '🐉'], ['kokoš', 'Huhn', '🐔'], ['postrv', 'Forelle', '🐟']],
    saetze: [['Pes je velik.', 'Der Hund ist groß.'], ['Mačka je majhna.', 'Die Katze ist klein.'], ['Imam psa.', 'Ich habe einen Hund.'],
      ['Medved živi v gozdu.', 'Der Bär lebt im Wald.'], ['Čebela je pridna.', 'Die Biene ist fleißig.'], ['Zmaj je simbol Ljubljane.', 'Der Drache ist das Symbol von Ljubljana.', [], ['Der Drache ist das Symbol Ljubljanas']]] },
  { id: 'mesto', ort: 'Celje', ortEmoji: '🏰', titel: 'V mestu', de: 'In der Stadt', farbe: '#6366f1',
    tipp: '<p><b>Kje je …?</b> = Wo ist …? Antwort: <i>levo</i> (links), <i>desno</i> (rechts), <i>naravnost</i> (geradeaus).</p>'
      + '<p>Aufforderung mit „Sie“: <i>Pojdite levo!</i> – mit „du“: <i>Pojdi levo!</i></p>'
      + '<p>Über Celje thront die größte Burg Sloweniens.</p>',
    woerter: [['mesto', 'Stadt', '🏙️'], ['ulica', 'Straße', '🛣️'], ['trgovina', 'Laden', '🏪'], ['postaja', 'Haltestelle', '🚏'], ['levo', 'links', '⬅️'], ['desno', 'rechts', '➡️'],
      ['naravnost', 'geradeaus', '⬆️'], ['banka', 'Bank', '🏦'], ['pošta', 'Post', '🏤'], ['avtobus', 'Bus', '🚌'], ['vlak', 'Zug', '🚆'], ['grad', 'Burg', '🏰']],
    saetze: [['Kje je postaja?', 'Wo ist die Haltestelle?', [], ['Wo ist der Bahnhof']], ['Pojdite levo.', 'Gehen Sie nach links.', [], ['Gehen Sie links']], ['Banka je desno.', 'Die Bank ist rechts.'],
      ['Vlak zamuja.', 'Der Zug hat Verspätung.', [], ['Der Zug ist verspätet']], ['Ljubljana je glavno mesto.', 'Ljubljana ist die Hauptstadt.'], ['Grad je na hribu.', 'Die Burg ist auf dem Hügel.', [], ['Die Burg steht auf dem Hügel']]] },
  { id: 'dnevi', ort: 'Kranjska Gora', ortEmoji: '⛷️', titel: 'Dnevi in vreme', de: 'Tage & Wetter', farbe: '#0ea5e9',
    tipp: '<p>Wochentage schreibt man <b>klein</b>. <i>sreda</i> heißt „Mitte“ (der Woche), <i>četrtek</i> „der Vierte“, <i>petek</i> „der Fünfte“.</p>'
      + '<p>Wetter ganz ohne „es“: <i>Dežuje.</i> = Es regnet. <i>Sneži.</i> = Es schneit.</p>',
    woerter: [['ponedeljek', 'Montag', 'Mo'], ['torek', 'Dienstag', 'Di'], ['sreda', 'Mittwoch', 'Mi'], ['četrtek', 'Donnerstag', 'Do'], ['petek', 'Freitag', 'Fr'], ['sobota', 'Samstag', 'Sa'],
      ['nedelja', 'Sonntag', 'So'], ['danes', 'heute', '📅'], ['jutri', 'morgen', '⏭️'], ['včeraj', 'gestern', '⏮️'], ['sonce', 'Sonne', '☀️'], ['sneg', 'Schnee', '❄️'], ['dež', 'Regen', '🌧️']],
    saetze: [['Danes je petek.', 'Heute ist Freitag.'], ['Jutri je sobota.', 'Morgen ist Samstag.'], ['Se vidimo jutri.', 'Wir sehen uns morgen.', [], ['Bis morgen']],
      ['Danes je lepo vreme.', 'Heute ist schönes Wetter.', [], ['Heute ist das Wetter schön']], ['Dežuje.', 'Es regnet.'], ['Sneži.', 'Es schneit.']] },
  { id: 'narava', ort: 'Triglav', ortEmoji: '🏔️', titel: 'Narava', de: 'Natur', farbe: '#84cc16',
    tipp: '<p>Der <b>Triglav</b> (2 864 m) ist der höchste Berg Sloweniens und steht im Wappen auf der Flagge.</p>'
      + '<p><b>in / auf + wo?</b> Lokativ: Slovenija → <i>v Sloveniji</i>, gozd → <i>v gozdu</i>, otok → <i>na otoku</i>.</p>',
    woerter: [['gora', 'Berg', '⛰️'], ['jezero', 'See', '🏞️'], ['morje', 'Meer', '🌊'], ['gozd', 'Wald', '🌲'], ['drevo', 'Baum', '🌳'], ['roža', 'Blume', '🌸'],
      ['jama', 'Höhle', '🕳️'], ['reka', 'Fluss', '🛶'], ['otok', 'Insel', '🏝️'], ['zvezda', 'Stern', '⭐'], ['luna', 'Mond', '🌙'], ['nebo', 'Himmel', '🌤️']],
    saetze: [['Triglav je najvišja gora v Sloveniji.', 'Der Triglav ist der höchste Berg in Slowenien.', [], ['Der Triglav ist der höchste Berg Sloweniens']], ['Blejsko jezero je lepo.', 'Der Bleder See ist schön.'],
      ['Na otoku je cerkev.', 'Auf der Insel ist eine Kirche.', [], ['Auf der Insel steht eine Kirche']], ['Gremo v gore.', 'Wir gehen in die Berge.'], ['Morje je toplo.', 'Das Meer ist warm.'],
      ['Postojnska jama je velika.', 'Die Höhle von Postojna ist groß.', [], ['Die Postojna-Höhle ist groß']]] },
  { id: 'pogovor', ort: 'Lipica', ortEmoji: '🐴', titel: 'Pogovor', de: 'Unterhalten', farbe: '#f97316',
    tipp: '<p><b>Endungen</b> (govoriti, sprechen): govor<b>im</b> · govor<b>iš</b> · govor<b>i</b> · govor<b>imo</b> · govor<b>ite</b> · govor<b>ijo</b>.</p>'
      + '<p><b>Fragen</b> beginnen oft mit <i>Ali …?</i> – <i>Ali govorite nemško?</i></p><p><b>Verneinen</b> mit <i>ne</i>: <i>Ne razumem.</i> <i>Ne vem.</i></p>',
    woerter: [['govoriti', 'sprechen', '🗣️'], ['razumeti', 'verstehen', '💡'], ['imeti', 'haben', '🎁'], ['biti', 'sein', '✨'], ['jesti', 'essen', '🍽️'], ['piti', 'trinken', '🥤'],
      ['spati', 'schlafen', '😴'], ['delati', 'arbeiten', '💼'], ['vedeti', 'wissen', '🧠'], ['živeti', 'leben', '🏡'], ['ljubiti', 'lieben', '❤️'], ['iti', 'gehen', '🚶']],
    saetze: [['Govorim malo slovensko.', 'Ich spreche ein bisschen Slowenisch.', [], ['Ich spreche ein wenig Slowenisch']], ['Ali govorite nemško?', 'Sprechen Sie Deutsch?'], ['Ne razumem.', 'Ich verstehe nicht.', [], ['Ich verstehe das nicht']],
      ['Ne vem.', 'Ich weiß nicht.', [], ['Ich weiß es nicht']], ['Rad te imam.', 'Ich hab dich lieb.', ['Rada te imam'], ['Ich liebe dich', 'Ich habe dich lieb']], ['Živim v Ljubljani.', 'Ich wohne in Ljubljana.', [], ['Ich lebe in Ljubljana']]] },
];
SLO_EINHEITEN.forEach((u) => {
  u.W = u.woerter.map(([sl, de, e]) => ({ sl, de, e, u: u.id }));
  u.S = u.saetze.map(([sl, de, slAlt, deAlt]) => ({ sl, de, slAlt: slAlt || [], deAlt: deAlt || [], u: u.id }));
});
const SLO_SPRUECHE = [['Živjo!', 'Hallo!'], ['Greva naprej?', 'Gehen wir zwei weiter? (Dual!)'], ['Dajmo!', 'Los geht’s!'], ['Super si!', 'Du bist super!'], ['Še malo!', 'Noch ein bisschen!']];

// ---------- Hilfen ----------
const sloMisch = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const sloNorm = (t) => String(t).toLowerCase().replace(/[.,!?;:„“"«»()¿¡–—]/g, ' ').replace(/\s+/g, ' ').trim();
const sloOhneZeichen = (t) => sloNorm(t).normalize('NFD').replace(/[̀-ͯ]/g, '');
const sloTeile = (t) => String(t).replace(/[.,!?;:„“"«»]/g, '').split(/\s+/).filter(Boolean);
const sloEsc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sloStore = () => { const s = loadJson(SLO_KEY); s.stufe = s.stufe || {}; s.tage = s.tage || {}; s.wort = s.wort || {}; s.xp = s.xp || 0; return s; };
const sloEinheit = (id) => SLO_EINHEITEN.find((u) => u.id === id);
function sloAndere(liste, ziel, n, feld) {
  const schon = new Set([sloNorm(ziel[feld])]);
  return sloMisch(liste).filter((x) => { const k = sloNorm(x[feld]); if (schon.has(k)) return false; schon.add(k); return true; }).slice(0, n);
}
function sloSerie(st) {
  let n = 0; const d = new Date();
  if (!(st.tage[tagSchluessel(d)] > 0)) d.setDate(d.getDate() - 1);
  while (st.tage[tagSchluessel(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const sloOffen = (st, i) => i === 0 || (st.stufe[SLO_EINHEITEN[i - 1].id] || 0) >= 1;

// ---------- Stimme ----------
let sloStimme = null;
function sloStimmeSuchen() {
  if (!('speechSynthesis' in window)) return;
  const v = speechSynthesis.getVoices();
  sloStimme = v.find((x) => /^sl([-_]|$)/i.test(x.lang)) || null;
  const el = $('sloStimme');
  if (el) el.textContent = sloStimme ? '🔊 Slowenische Stimme: ' + sloStimme.name + ' – tippe auf 🔊 zum Anhören.' : '🔇 Auf diesem Gerät gibt es keine slowenische Stimme – Hör-Aufgaben sind ausgeblendet. Die Aussprache steht im 💡 Tipp jeder Station.';
}
if ('speechSynthesis' in window) { sloStimmeSuchen(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', sloStimmeSuchen); }
function sloSprich(text, langsam) {
  if (!sloStimme) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = sloStimme; u.lang = sloStimme.lang; u.rate = langsam ? 0.6 : 0.9;
  speechSynthesis.speak(u);
}
const sloLaut = (text) => (sloStimme ? '<button type="button" class="slo-laut" data-sprich="' + sloEsc(text) + '" aria-label="Anhören">🔊</button>' : '');

// kleine Töne für richtig / falsch
let sloAc = null;
function sloKlang(gut) {
  try {
    sloAc = sloAc || new (window.AudioContext || window.webkitAudioContext)();
    const t = sloAc.currentTime;
    (gut ? [[660, 0], [990, 0.09]] : [[220, 0], [180, 0.12]]).forEach(([f, d]) => {
      const o = sloAc.createOscillator(), g = sloAc.createGain();
      o.type = gut ? 'sine' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.18, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.22);
      o.connect(g).connect(sloAc.destination); o.start(t + d); o.stop(t + d + 0.25);
    });
  } catch (e) { /* ohne Ton */ }
}

// ---------- Zmajček, der kleine Ljubljana-Drache ----------
function sloDrache(stimmung = 'froh') {
  const mund = stimmung === 'traurig' ? '<path d="M44 50q6-4 12 0" stroke="#14532d" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    : stimmung === 'jubel' ? '<path d="M42 47q8 9 16 0z" fill="#7f1d1d"/><path d="M45 49q5 3 10 0" fill="#fb7185"/>'
      : '<path d="M43 48q7 6 14 0" stroke="#14532d" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  const arme = stimmung === 'jubel' ? '<path d="M30 62l-10-12M70 62l10-12" stroke="#2f9e63" stroke-width="6" stroke-linecap="round"/>' : '<path d="M32 66l-6 6M68 66l6 6" stroke="#2f9e63" stroke-width="6" stroke-linecap="round"/>';
  return '<svg class="slo-drache slo-' + stimmung + '" viewBox="0 0 100 100" aria-hidden="true">'
    + '<path d="M70 82q22 2 20-16q-1-8-8-6q5 6-2 11q-6 4-14 1z" fill="#2f9e63"/><path d="M88 60l4-6 1 8z" fill="#f5c542"/>'
    + '<path d="M34 58q-22-14-26 6q12-6 16 2q4-8 10-2z" fill="#1f7a4a"/><path d="M66 58q22-14 26 6q-12-6-16 2q-4-8-10-2z" fill="#1f7a4a"/>'
    + '<ellipse cx="50" cy="70" rx="22" ry="20" fill="#3fb67a"/><ellipse cx="50" cy="74" rx="13" ry="13" fill="#d6f5b0"/>'
    + '<path d="M44 66h12M43 72h14M44 78h12" stroke="#a7d98a" stroke-width="1.5"/>'
    + arme
    + '<ellipse cx="40" cy="89" rx="7" ry="4" fill="#2f9e63"/><ellipse cx="60" cy="89" rx="7" ry="4" fill="#2f9e63"/>'
    + '<path d="M36 22l-4-12 9 8zM64 22l4-12-9 8z" fill="#f5c542"/>'
    + '<path d="M44 16l6-8 6 8" fill="#f5c542"/><circle cx="50" cy="9" r="2" fill="#ef4444"/>'
    + '<circle cx="50" cy="36" r="21" fill="#46c486"/><ellipse cx="50" cy="45" rx="13" ry="8" fill="#86e3ad"/>'
    + '<circle cx="46" cy="44" r="1.3" fill="#14532d"/><circle cx="54" cy="44" r="1.3" fill="#14532d"/>'
    + '<circle cx="41" cy="31" r="6" fill="#fff"/><circle cx="59" cy="31" r="6" fill="#fff"/>'
    + (stimmung === 'jubel' ? '<path d="M37 32q4-5 8 0M55 32q4-5 8 0" stroke="#111" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
      : '<circle cx="42" cy="32" r="3" fill="#111"/><circle cx="60" cy="32" r="3" fill="#111"/><circle cx="43" cy="31" r="1" fill="#fff"/><circle cx="61" cy="31" r="1" fill="#fff"/>')
    + (stimmung === 'traurig' ? '<path d="M35 24l10 3M65 24l-10 3" stroke="#14532d" stroke-width="2" stroke-linecap="round"/>' : '')
    + '<circle cx="33" cy="41" r="3.5" fill="#fb7185" opacity=".55"/><circle cx="67" cy="41" r="3.5" fill="#fb7185" opacity=".55"/>'
    + mund + '</svg>';
}

// ---------- Lektionen zusammenstellen ----------
// Aufgaben: { typ, w (Wort) | s (Satz), ... }
function sloLektion(u, stufe) {
  const W = u.W, S = u.S, haelfte = Math.ceil(W.length / 2), A = [];
  const W1 = W.slice(0, haelfte), W2 = W.slice(haelfte);
  const wortAufgabe = (w, i) => {
    const typen = ['bild', 'slde', 'desl'];
    if (sloStimme && stufe >= 2) typen.push('hoeren');
    return { typ: typen[(i + stufe) % typen.length], w };
  };
  if (stufe === 1) {
    A.push({ typ: 'tipp' });
    W1.forEach((w, i) => { A.push({ typ: 'neu', w }); A.push(wortAufgabe(w, i)); });
    A.push({ typ: 'paare', liste: sloMisch(W1).slice(0, 5) });
    sloMisch(W1).slice(0, 3).forEach((w) => A.push({ typ: 'desl', w }));
  } else if (stufe === 2) {
    W2.forEach((w, i) => { A.push({ typ: 'neu', w }); A.push(wortAufgabe(w, i + 1)); });
    A.push({ typ: 'paare', liste: sloMisch(W).slice(0, 5) });
    sloMisch(S).slice(0, 4).forEach((s) => { A.push({ typ: 'satzwahl', s }); A.push({ typ: 'bauen', s, nach: 'sl' }); });
  } else {
    // Stufe 3 und Wiederholen: alles gemischt, mit Tippen und Rückübersetzung
    const ws = sloMisch(W), ss = sloMisch(S);
    ws.slice(0, 3).forEach((w) => A.push({ typ: 'tippen', w }));
    ss.slice(0, 2).forEach((s) => A.push({ typ: 'luecke', s }));
    ss.slice(2, 4).forEach((s) => A.push({ typ: 'bauen', s, nach: 'de' }));
    ss.slice(4, 6).forEach((s) => A.push({ typ: 'bauen', s, nach: 'sl' }));
    A.push({ typ: 'paare', liste: ws.slice(3, 8) });
    if (sloStimme) ws.slice(8, 10).forEach((w) => A.push({ typ: 'hoeren', w }));
    ws.slice(10, 12).forEach((w, i) => A.push({ typ: i ? 'desl' : 'bild', w }));
    const rest = sloMisch(A.filter((x) => x.typ !== 'paare'));
    rest.splice(Math.floor(rest.length / 2), 0, ...A.filter((x) => x.typ === 'paare'));
    return rest;
  }
  return A;
}
// Üben: schwächste Wörter aus allen offenen Stationen
function sloUebung(st) {
  const offen = SLO_EINHEITEN.filter((u, i) => sloOffen(st, i) && (st.stufe[u.id] || 0) >= 1);
  const woerter = offen.flatMap((u) => u.W.slice(0, (st.stufe[u.id] || 0) >= 2 ? u.W.length : Math.ceil(u.W.length / 2)));
  if (!woerter.length) return null;
  const schwach = woerter.map((w) => ({ w, s: (st.wort[w.sl] || 0) + Math.random() * 1.5 })).sort((a, b) => a.s - b.s).slice(0, 10).map((x) => x.w);
  const typen = ['tippen', 'desl', 'slde', 'bild'].concat(sloStimme ? ['hoeren'] : []);
  const A = schwach.map((w, i) => ({ typ: typen[i % typen.length], w }));
  if (schwach.length >= 4) A.splice(5, 0, { typ: 'paare', liste: schwach.slice(0, 5) });
  return A;
}

// ---------- Ablauf ----------
let slo = null;
const sloTeile2 = ['karte', 'lektion', 'ende', 'woerter'];
const zeigeSloTeil = (t) => sloTeile2.forEach((x) => { $('slo-' + x).hidden = x !== t; });

function sloKarte() {
  slo = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const st = sloStore(), heuteXp = st.tage[tagSchluessel()] || 0, serie = sloSerie(st);
  const anteil = Math.min(1, heuteXp / SLO_TAGESZIEL);
  $('sloStatus').innerHTML = '<div class="slo-ring" style="--a:' + anteil + '"><b>' + heuteXp + '</b><small>/' + SLO_TAGESZIEL + ' XP</small></div>'
    + '<div class="slo-zahlen"><span>🔥 <b>' + serie + '</b> ' + (serie === 1 ? 'Tag' : 'Tage') + '</span><span>⚡ <b>' + fmt(st.xp) + '</b> XP</span><span>📚 <b>' + Object.keys(st.wort).length + '</b> Wörter</span></div>';
  // aktuelle Station: erste offene, die noch nicht fertig ist
  let jetzt = SLO_EINHEITEN.findIndex((u, i) => sloOffen(st, i) && (st.stufe[u.id] || 0) < 3);
  if (jetzt < 0) jetzt = SLO_EINHEITEN.length - 1;
  const spruch = SLO_SPRUECHE[Math.floor(Math.random() * SLO_SPRUECHE.length)];
  $('sloPfad').innerHTML = SLO_EINHEITEN.map((u, i) => {
    const s = st.stufe[u.id] || 0, offen = sloOffen(st, i), seite = ['links', 'mitte', 'rechts', 'mitte'][i % 4];
    return '<div class="slo-station slo-' + seite + (offen ? '' : ' zu') + (s >= 3 ? ' fertig' : '') + (i === jetzt ? ' jetzt' : '') + '" style="--f:' + u.farbe + '">'
      + (i === jetzt ? '<div class="slo-maskottchen">' + sloDrache('froh') + '<span class="slo-blase"><b>' + spruch[0] + '</b><small>' + spruch[1] + '</small></span></div>' : '')
      + '<button type="button" class="slo-knoten" data-u="' + u.id + '"' + (offen ? '' : ' aria-disabled="true"') + ' aria-label="' + u.ort + ': ' + u.de + '">'
      + '<span class="slo-ort-emoji">' + (offen ? u.ortEmoji : '🔒') + '</span>'
      + '<span class="slo-kronen">' + [1, 2, 3].map((k) => '<i class="' + (s >= k ? 'voll' : '') + '"></i>').join('') + '</span></button>'
      + '<div class="slo-info"><b>' + u.ort + '</b><span>' + u.titel + ' · ' + u.de + '</span>'
      + '<small>' + (s >= 3 ? '✓ gemeistert · Wiederholen' : offen ? 'Stufe ' + (s + 1) + ' von 3' : 'Erst ' + SLO_EINHEITEN[i - 1].ort + ' beginnen') + '</small>'
      + '<button type="button" class="slo-tippknopf" data-tipp="' + u.id + '">💡 Tipp</button></div></div>';
  }).join('');
  $('sloUeben').disabled = !sloUebung(st);
  sloStimmeSuchen();
  zeigeSloTeil('karte');
}
function sloStart(u, art) {
  const st = sloStore();
  let liste, stufe = 0;
  if (art === 'ueben') liste = sloUebung(st);
  else { stufe = Math.min(3, (st.stufe[u.id] || 0) + 1); liste = sloLektion(u, stufe); }
  if (!liste || !liste.length) return;
  slo = { u, art, stufe, liste, i: 0, fehler: 0, richtig: 0, bewertet: 0, nochmal: new Set(), start: Date.now(), zustand: 'antwort', fehlerListe: [] };
  zeigeSloTeil('lektion');
  sloZeigen();
}
function sloFortschritt() {
  $('sloBalken').style.width = Math.round((slo.i / slo.liste.length) * 100) + '%';
}
function sloBereit(ja, text) {
  const b = $('sloPruefen');
  b.disabled = !ja; if (text) b.textContent = text;
}
function sloZeigen() {
  if (slo.i >= slo.liste.length) { sloEnde(); return; }
  sloFortschritt();
  const a = slo.liste[slo.i], box = $('sloAufgabe');
  slo.zustand = 'antwort'; slo.antwort = null;
  $('sloFuss').className = 'slo-fuss'; $('sloUrteil').innerHTML = '';
  $('sloPruefen').hidden = false;
  sloBereit(false, 'Prüfen');
  box.className = 'slo-aufgabe slo-a-' + a.typ;
  const R = SLO_RENDER[a.typ];
  R(a, box);
  box.querySelectorAll('[data-sprich]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); sloSprich(b.dataset.sprich, b.classList.contains('langsam')); }));
}
function sloPruefen() {
  if (!slo) return;
  if (slo.zustand === 'weiter') { slo.i++; sloZeigen(); return; }
  const a = slo.liste[slo.i];
  if (a.typ === 'neu' || a.typ === 'tipp') { if (a.w) sloWortStaerke(a.w, 0); slo.i++; sloZeigen(); return; }
  const r = slo.pruefe();
  if (!r) return;
  slo.zustand = 'weiter'; slo.bewertet++;
  if (r.ok) { slo.richtig++; sloKlang(true); if (navigator.vibrate) navigator.vibrate(12); }
  else {
    slo.fehler++; sloKlang(false); if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
    // falsch beantwortet: kommt am Ende noch einmal (einmal je Aufgabe)
    if (!slo.nochmal.has(a)) { slo.nochmal.add(a); slo.liste.push({ ...a, nochmal: true }); }
    slo.fehlerListe.push(a);
  }
  if (a.w) sloWortStaerke(a.w, r.ok ? 1 : -1);
  const lob = ['Pravilno!', 'Odlično!', 'Bravo!', 'Super!', 'Točno!'];
  $('sloFuss').className = 'slo-fuss ' + (r.ok ? 'gut' : 'schlecht');
  $('sloUrteil').innerHTML = '<div class="slo-urteil-kopf">' + sloDrache(r.ok ? 'jubel' : 'traurig') + '<b>' + (r.ok ? lob[Math.floor(Math.random() * lob.length)] + ' <small>(richtig!)</small>' : 'Ni čisto prav <small>(nicht ganz)</small>') + '</b></div>'
    + (r.loesung ? '<div class="slo-loesung">' + (r.ok ? '' : 'Richtig: ') + r.loesung + (r.laut ? ' ' + sloLaut(r.laut) : '') + '</div>' : '')
    + (r.hinweis ? '<div class="slo-hinweis">' + r.hinweis + '</div>' : '');
  $('sloUrteil').querySelectorAll('[data-sprich]').forEach((b) => b.addEventListener('click', () => sloSprich(b.dataset.sprich)));
  sloBereit(true, 'Weiter');
  $('sloAufgabe').querySelectorAll('button, input').forEach((b) => { if (!b.classList.contains('slo-laut')) b.disabled = true; });
  if (r.laut && r.ok) sloSprich(r.laut);
}
function sloWortStaerke(w, d) {
  const st = sloStore();
  st.wort[w.sl] = Math.max(0, Math.min(5, (st.wort[w.sl] || 0) + d));
  saveJson(SLO_KEY, st);
}
function sloEnde() {
  const st = sloStore(), quote = slo.bewertet ? slo.richtig / slo.bewertet : 1, fehlerfrei = slo.fehler === 0;
  const xp = 10 + (fehlerfrei ? 5 : 0) + (slo.stufe === 3 ? 5 : 0);
  st.xp += xp; st.tage[tagSchluessel()] = (st.tage[tagSchluessel()] || 0) + xp;
  const neueStufe = slo.art !== 'ueben' && slo.stufe > (st.stufe[slo.u.id] || 0);
  if (slo.art !== 'ueben') st.stufe[slo.u.id] = Math.max(st.stufe[slo.u.id] || 0, slo.stufe);
  saveJson(SLO_KEY, st);
  const was = slo.art === 'ueben' ? 'Üben' : slo.u.ort + ' · Stufe ' + slo.stufe;
  if (typeof merkeVerlauf === 'function') merkeVerlauf('slo', Math.round(quote * 100), 100, was);
  const sek = Math.round((Date.now() - slo.start) / 1000), heute = st.tage[tagSchluessel()], ziel = heute >= SLO_TAGESZIEL && heute - xp < SLO_TAGESZIEL;
  const fertigU = neueStufe && slo.stufe === 3;
  $('slo-ende').innerHTML = '<div class="slo-ende-drache">' + sloDrache('jubel') + '</div>'
    + '<h2 class="slo-ende-titel">' + (fehlerfrei ? 'Brez napake!' : quote >= 0.8 ? 'Odlično!' : 'Dobro opravljeno!') + '</h2>'
    + '<p class="slo-ende-sub">' + (fehlerfrei ? 'Ohne einen Fehler!' : quote >= 0.8 ? 'Ausgezeichnet!' : 'Gut gemacht!') + ' · ' + sloEsc(was) + '</p>'
    + '<div class="slo-ende-werte"><div><b>+' + xp + '</b>XP</div><div><b>' + Math.round(quote * 100) + ' %</b>richtig</div><div><b>' + Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0') + '</b>Zeit</div></div>'
    + (ziel ? '<p class="slo-ende-ziel">🎯 Tagesziel erreicht – ' + SLO_TAGESZIEL + ' XP! Serie: 🔥 ' + sloSerie(st) + '</p>' : '')
    + (fertigU ? '<p class="slo-ende-ziel">👑 ' + slo.u.ort + ' gemeistert!' + (SLO_EINHEITEN[SLO_EINHEITEN.indexOf(slo.u) + 1] ? ' Weiter nach ' + SLO_EINHEITEN[SLO_EINHEITEN.indexOf(slo.u) + 1].ort + '.' : '') + '</p>' : '')
    + (slo.fehlerListe.length ? '<div class="slo-ende-fehler"><b>Das üben wir noch:</b>' + [...new Set(slo.fehlerListe.map((a) => (a.w ? a.w.sl + ' = ' + a.w.de : a.s ? a.s.sl + ' = ' + a.s.de : '')).filter(Boolean))].slice(0, 6).map((t) => '<span>' + sloEsc(t) + '</span>').join('') + '</div>' : '')
    + '<button type="button" class="btn slo-gross" id="sloEndeWeiter">Weiter</button>';
  $('sloEndeWeiter').addEventListener('click', sloKarte);
  zeigeSloTeil('ende');
  konfetti(fehlerfrei ? 30 : 18, ['🐉', '⭐', '🇸🇮', '✨']);
}

// ---------- Aufgaben-Typen ----------
function sloOptionen(box, optionen, istRichtig, html) {
  box.querySelector('.slo-optionen').innerHTML = optionen.map((o, i) => '<button type="button" class="slo-opt" data-i="' + i + '">' + html(o) + '</button>').join('');
  box.querySelectorAll('.slo-opt').forEach((b) => b.addEventListener('click', () => {
    box.querySelectorAll('.slo-opt').forEach((x) => x.classList.toggle('gewaehlt', x === b));
    slo.antwort = optionen[Number(b.dataset.i)];
    sloBereit(true);
  }));
  slo.pruefe = () => { if (!slo.antwort) return null; const ok = istRichtig(slo.antwort); box.querySelectorAll('.slo-opt').forEach((x) => { const o = optionen[Number(x.dataset.i)]; if (istRichtig(o)) x.classList.add('richtig'); else if (x.classList.contains('gewaehlt')) x.classList.add('falsch'); }); return { ok }; };
}
// Wort-Kacheln zum Satzbauen
function sloKacheln(box, ziel, vorrat, pruefen) {
  const gewaehlt = [];
  const kacheln = vorrat.map((t, i) => ({ t, i }));
  const zeichnen = () => {
    box.querySelector('.slo-zeile').innerHTML = gewaehlt.length ? gewaehlt.map((k, j) => '<button type="button" class="slo-kachel drin" data-j="' + j + '">' + sloEsc(k.t) + '</button>').join('') : '<span class="slo-leer">Tippe die Wörter in der richtigen Reihenfolge an</span>';
    box.querySelector('.slo-bank').innerHTML = kacheln.map((k) => '<button type="button" class="slo-kachel' + (gewaehlt.includes(k) ? ' weg' : '') + '" data-i="' + k.i + '">' + sloEsc(k.t) + '</button>').join('');
    box.querySelectorAll('.slo-zeile .slo-kachel').forEach((b) => b.addEventListener('click', () => { gewaehlt.splice(Number(b.dataset.j), 1); zeichnen(); }));
    box.querySelectorAll('.slo-bank .slo-kachel:not(.weg)').forEach((b) => b.addEventListener('click', () => { gewaehlt.push(kacheln[Number(b.dataset.i)]); zeichnen(); }));
    sloBereit(gewaehlt.length > 0);
  };
  zeichnen();
  slo.pruefe = () => (gewaehlt.length ? pruefen(gewaehlt.map((k) => k.t).join(' ')) : null);
}
const SLO_RENDER = {
  tipp(a, box) {
    box.innerHTML = '<div class="slo-tippkarte" style="--f:' + slo.u.farbe + '"><div class="slo-tk-kopf">' + sloDrache('froh') + '<div><small>Station ' + (SLO_EINHEITEN.indexOf(slo.u) + 1) + ' · ' + slo.u.ortEmoji + ' ' + slo.u.ort + '</small><b>' + slo.u.titel + '</b><span>' + slo.u.de + '</span></div></div>' + slo.u.tipp + '</div>';
    sloBereit(true, 'Los geht’s');
  },
  neu(a, box) {
    box.innerHTML = '<div class="slo-titel">✨ Neues Wort</div><div class="slo-neu"><div class="slo-neu-bild">' + a.w.e + '</div><div class="slo-neu-wort">' + sloEsc(a.w.sl) + ' ' + sloLaut(a.w.sl) + '</div><div class="slo-neu-de">' + sloEsc(a.w.de) + '</div></div>';
    sloBereit(true, 'Verstanden');
    sloSprich(a.w.sl);
  },
  bild(a, box) {
    const opt = sloMisch([a.w, ...sloAndere(slo.u ? slo.u.W.concat(sloPool()) : sloPool(), a.w, 3, 'e')]);
    box.innerHTML = '<div class="slo-titel">Welches Bild passt zu</div><div class="slo-frage">„' + sloEsc(a.w.sl) + '“ ' + sloLaut(a.w.sl) + '</div><div class="slo-optionen slo-bilder"></div>';
    sloOptionen(box, opt, (o) => o.sl === a.w.sl, (o) => '<span class="slo-bild">' + o.e + '</span>');
    const p = slo.pruefe; slo.pruefe = () => { const r = p(); return r && { ...r, loesung: a.w.e + ' ' + sloEsc(a.w.sl) + ' = ' + sloEsc(a.w.de), laut: a.w.sl }; };
  },
  slde(a, box) {
    const opt = sloMisch([a.w, ...sloAndere(sloPool(a.w), a.w, 3, 'de')]);
    box.innerHTML = '<div class="slo-titel">Was heißt</div><div class="slo-frage">„' + sloEsc(a.w.sl) + '“ ' + sloLaut(a.w.sl) + '</div><div class="slo-optionen"></div>';
    sloOptionen(box, opt, (o) => sloNorm(o.de) === sloNorm(a.w.de), (o) => sloEsc(o.de));
    const p = slo.pruefe; slo.pruefe = () => { const r = p(); return r && { ...r, loesung: sloEsc(a.w.sl) + ' = ' + sloEsc(a.w.de), laut: a.w.sl }; };
  },
  desl(a, box) {
    const opt = sloMisch([a.w, ...sloAndere(sloPool(a.w), a.w, 3, 'sl')]);
    box.innerHTML = '<div class="slo-titel">Wie sagt man auf Slowenisch</div><div class="slo-frage">' + a.w.e + ' „' + sloEsc(a.w.de) + '“</div><div class="slo-optionen"></div>';
    sloOptionen(box, opt, (o) => sloNorm(o.sl) === sloNorm(a.w.sl), (o) => sloEsc(o.sl));
    const p = slo.pruefe; slo.pruefe = () => { const r = p(); return r && { ...r, loesung: sloEsc(a.w.de) + ' = ' + sloEsc(a.w.sl), laut: a.w.sl }; };
  },
  hoeren(a, box) {
    const opt = sloMisch([a.w, ...sloAndere(sloPool(a.w), a.w, 3, 'sl')]);
    box.innerHTML = '<div class="slo-titel">Was hörst du?</div><div class="slo-hoer"><button type="button" class="slo-laut gross" data-sprich="' + sloEsc(a.w.sl) + '">🔊</button><button type="button" class="slo-laut langsam" data-sprich="' + sloEsc(a.w.sl) + '">🐢</button></div><div class="slo-optionen"></div>';
    sloOptionen(box, opt, (o) => o.sl === a.w.sl, (o) => sloEsc(o.sl));
    const p = slo.pruefe; slo.pruefe = () => { const r = p(); return r && { ...r, loesung: sloEsc(a.w.sl) + ' = ' + sloEsc(a.w.de) }; };
    setTimeout(() => sloSprich(a.w.sl), 250);
  },
  tippen(a, box) {
    box.innerHTML = '<div class="slo-titel">Schreib auf Slowenisch</div><div class="slo-frage">' + a.w.e + ' „' + sloEsc(a.w.de) + '“</div>'
      + '<input class="slo-eingabe" id="sloEingabe" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="slowenisch …">'
      + '<div class="slo-zeichen">' + ['č', 'š', 'ž'].map((z) => '<button type="button" data-z="' + z + '">' + z + '</button>').join('') + '</div>';
    const inp = $('sloEingabe');
    inp.addEventListener('input', () => sloBereit(inp.value.trim().length > 0));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('sloPruefen').disabled) { e.preventDefault(); sloPruefen(); } });
    box.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
      const p = inp.selectionStart ?? inp.value.length;
      inp.value = inp.value.slice(0, p) + b.dataset.z + inp.value.slice(inp.selectionEnd ?? p);
      inp.focus(); inp.setSelectionRange(p + 1, p + 1); sloBereit(true);
    }));
    setTimeout(() => inp.focus(), 50);
    slo.pruefe = () => {
      const v = inp.value;
      if (!v.trim()) return null;
      if (sloNorm(v) === sloNorm(a.w.sl)) return { ok: true, loesung: sloEsc(a.w.sl), laut: a.w.sl };
      if (sloOhneZeichen(v) === sloOhneZeichen(a.w.sl)) return { ok: true, loesung: sloEsc(a.w.sl), laut: a.w.sl, hinweis: 'Fast perfekt – achte auf die Häkchen: <b>' + sloEsc(a.w.sl) + '</b>' };
      return { ok: false, loesung: sloEsc(a.w.sl), laut: a.w.sl, hinweis: 'Du hast „' + sloEsc(v.trim()) + '“ geschrieben.' };
    };
  },
  paare(a, box) {
    const links = sloMisch(a.liste), rechts = sloMisch(a.liste);
    box.innerHTML = '<div class="slo-titel">Finde die Paare</div><div class="slo-paare"><div>' + links.map((w) => '<button type="button" class="slo-paar" data-sl="' + sloEsc(w.sl) + '" data-s="l">' + sloEsc(w.sl) + '</button>').join('') + '</div><div>'
      + rechts.map((w) => '<button type="button" class="slo-paar" data-sl="' + sloEsc(w.sl) + '" data-s="r">' + sloEsc(w.de) + '</button>').join('') + '</div></div>';
    $('sloPruefen').hidden = true;
    let auswahl = null, gefunden = 0, patzer = 0;
    box.querySelectorAll('.slo-paar').forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('ok')) return;
      if (b.dataset.s === 'l') sloSprich(b.dataset.sl);
      if (!auswahl || auswahl.dataset.s === b.dataset.s) { box.querySelectorAll('.slo-paar').forEach((x) => x.classList.toggle('gewaehlt', x === b)); auswahl = b; return; }
      if (auswahl.dataset.sl === b.dataset.sl) {
        [auswahl, b].forEach((x) => { x.classList.remove('gewaehlt'); x.classList.add('ok'); x.disabled = true; });
        gefunden++; sloKlang(true);
        if (gefunden === a.liste.length) {
          slo.bewertet++; if (!patzer) slo.richtig++; else slo.fehler++;
          a.liste.forEach((w) => sloWortStaerke(w, patzer ? 0 : 1));
          slo.zustand = 'weiter';
          $('sloFuss').className = 'slo-fuss gut';
          $('sloUrteil').innerHTML = '<div class="slo-urteil-kopf">' + sloDrache('jubel') + '<b>Vse pari! <small>(alle Paare)</small></b></div>' + (patzer ? '<div class="slo-hinweis">' + patzer + '× daneben getippt</div>' : '');
          $('sloPruefen').hidden = false; sloBereit(true, 'Weiter');
        }
      } else {
        patzer++; sloKlang(false);
        [auswahl, b].forEach((x) => { x.classList.add('wackeln'); setTimeout(() => x.classList.remove('wackeln', 'gewaehlt'), 420); });
      }
      auswahl = null;
    }));
  },
  satzwahl(a, box) {
    const andere = sloAndere(slo.u ? slo.u.S : sloSatzPool(), a.s, 2, 'de');
    const opt = sloMisch([a.s, ...andere]);
    box.innerHTML = '<div class="slo-titel">Was bedeutet dieser Satz?</div><div class="slo-frage satz">„' + sloEsc(a.s.sl) + '“ ' + sloLaut(a.s.sl) + '</div><div class="slo-optionen satz"></div>';
    sloOptionen(box, opt, (o) => o === a.s, (o) => sloEsc(o.de));
    const p = slo.pruefe; slo.pruefe = () => { const r = p(); return r && { ...r, loesung: sloEsc(a.s.sl) + ' = ' + sloEsc(a.s.de), laut: a.s.sl }; };
    sloSprich(a.s.sl);
  },
  bauen(a, box) {
    const nachSl = a.nach === 'sl', ziel = nachSl ? a.s.sl : a.s.de, quelle = nachSl ? a.s.de : a.s.sl;
    const passt = [ziel].concat(nachSl ? a.s.slAlt : a.s.deAlt).map(sloNorm);
    const teile = sloTeile(ziel), schon = new Set(teile.map(sloNorm));
    const pool = (slo.u ? slo.u.S : sloSatzPool()).filter((s) => s !== a.s).flatMap((s) => sloTeile(nachSl ? s.sl : s.de)).filter((t) => { const k = sloNorm(t); if (schon.has(k)) return false; schon.add(k); return true; });
    const vorrat = sloMisch(teile.concat(sloMisch(pool).slice(0, Math.min(3, Math.max(2, Math.round(teile.length / 2))))));
    box.innerHTML = '<div class="slo-titel">' + (nachSl ? 'Bau den Satz auf Slowenisch' : 'Übersetze ins Deutsche') + '</div><div class="slo-frage satz">„' + sloEsc(quelle) + '“ ' + (nachSl ? '' : sloLaut(a.s.sl)) + '</div>'
      + '<div class="slo-zeile"></div><div class="slo-bank"></div>';
    sloKacheln(box, ziel, vorrat, (txt) => {
      const ok = passt.includes(sloNorm(txt));
      return { ok, loesung: sloEsc(ziel), laut: a.s.sl };
    });
  },
  luecke(a, box) {
    const teile = sloTeile(a.s.sl), kand = teile.map((t, i) => [t, i]).filter(([t]) => sloNorm(t).length >= 2);
    const [loch, idx] = kand.sort((x, y) => sloNorm(y[0]).length - sloNorm(x[0]).length)[Math.floor(Math.random() * Math.min(2, kand.length))];
    const schon = new Set([sloNorm(loch)]);
    const falsch = sloMisch((slo.u ? slo.u.S : sloSatzPool()).filter((s) => s !== a.s).flatMap((s) => sloTeile(s.sl)).concat((slo.u ? slo.u.W : []).map((w) => w.sl)))
      .filter((t) => { const k = sloNorm(t); if (schon.has(k) || k.length < 2) return false; schon.add(k); return true; }).slice(0, 2);
    const opt = sloMisch([loch, ...falsch]);
    const satz = teile.map((t, i) => (i === idx ? '<span class="slo-loch">____</span>' : sloEsc(t))).join(' ');
    box.innerHTML = '<div class="slo-titel">Welches Wort fehlt?</div><div class="slo-frage satz">' + satz + '</div><div class="slo-uebersetzung">„' + sloEsc(a.s.de) + '“</div><div class="slo-optionen"></div>';
    sloOptionen(box, opt, (o) => sloNorm(o) === sloNorm(loch), (o) => sloEsc(o));
    const p = slo.pruefe; slo.pruefe = () => { const r = p(); if (r) box.querySelector('.slo-loch').textContent = loch; return r && { ...r, loesung: sloEsc(a.s.sl), laut: a.s.sl }; };
  },
};
// Ablenker aus den Stationen, die man schon kennt (für „Üben“ und kleine Stationen)
function sloPool(w) {
  const u = w ? sloEinheit(w.u) : slo && slo.u;
  if (u && slo && slo.art !== 'ueben') return u.W;
  const st = sloStore();
  return SLO_EINHEITEN.filter((x, i) => sloOffen(st, i)).flatMap((x) => x.W);
}
function sloSatzPool() { return SLO_EINHEITEN.flatMap((u) => u.S); }

// ---------- Wörterbuch ----------
function sloWoerter() {
  const st = sloStore();
  $('slo-woerter').innerHTML = '<h2 class="slo-wb-titel">📖 Deine Wörter</h2>' + SLO_EINHEITEN.filter((u, i) => sloOffen(st, i)).map((u) => {
    const s = st.stufe[u.id] || 0, bekannt = s >= 2 ? u.W : s >= 1 ? u.W.slice(0, Math.ceil(u.W.length / 2)) : [];
    return '<div class="slo-wb-gruppe" style="--f:' + u.farbe + '"><b>' + u.ortEmoji + ' ' + u.ort + ' · ' + u.titel + '</b>'
      + (bekannt.length ? '<ul>' + bekannt.map((w) => '<li><span>' + w.e + '</span><b>' + sloEsc(w.sl) + '</b><i>' + sloEsc(w.de) + '</i><em class="slo-staerke" style="--s:' + ((st.wort[w.sl] || 0) / 5) + '"></em>' + sloLaut(w.sl) + '</li>').join('') + '</ul>'
        + (s >= 2 ? '<div class="slo-wb-saetze">' + u.S.map((x) => '<p><b>' + sloEsc(x.sl) + '</b> ' + sloLaut(x.sl) + '<br><i>' + sloEsc(x.de) + '</i></p>').join('') + '</div>' : '') : '<p class="slo-wb-leer">Noch nicht begonnen.</p>') + '</div>';
  }).join('') + '<button type="button" class="btn slo-gross" id="sloWbZurueck">Zurück zur Reise</button>';
  $('sloWbZurueck').addEventListener('click', sloKarte);
  $('slo-woerter').querySelectorAll('[data-sprich]').forEach((b) => b.addEventListener('click', () => sloSprich(b.dataset.sprich)));
  zeigeSloTeil('woerter');
}

// ---------- Tipp-Fenster ----------
function sloTippZeigen(u) {
  let d = $('sloTippDlg');
  if (!d) { d = document.createElement('dialog'); d.id = 'sloTippDlg'; d.className = 'slo-dlg'; document.body.appendChild(d); d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('.slo-dlg-zu')) d.close(); }); }
  d.style.setProperty('--f', u.farbe);
  d.innerHTML = '<div class="slo-dlg-in"><button type="button" class="slo-dlg-zu" aria-label="Schließen">×</button><div class="slo-tk-kopf">' + sloDrache('froh') + '<div><small>' + u.ortEmoji + ' ' + u.ort + '</small><b>' + u.titel + '</b><span>' + u.de + '</span></div></div>' + u.tipp
    + '<div class="slo-dlg-woerter">' + u.W.map((w) => '<span>' + w.e + ' <b>' + sloEsc(w.sl) + '</b> ' + sloEsc(w.de) + '</span>').join('') + '</div></div>';
  if (d.showModal) d.showModal(); else d.setAttribute('open', '');
}

// ---------- Knöpfe ----------
$('sloPfad').addEventListener('click', (e) => {
  const t = e.target.closest('[data-tipp]');
  if (t) { sloTippZeigen(sloEinheit(t.dataset.tipp)); return; }
  const k = e.target.closest('.slo-knoten');
  if (!k) return;
  const st = sloStore(), i = SLO_EINHEITEN.findIndex((u) => u.id === k.dataset.u);
  if (!sloOffen(st, i)) { k.classList.add('wackeln'); setTimeout(() => k.classList.remove('wackeln'), 420); if (navigator.vibrate) navigator.vibrate(30); return; }
  sloStart(SLO_EINHEITEN[i]);
});
$('sloPruefen').addEventListener('click', sloPruefen);
$('sloAbbruch').addEventListener('click', () => { if (!slo || slo.i === 0 || confirm('Lektion abbrechen? Der Fortschritt dieser Lektion geht verloren.')) sloKarte(); });
$('sloUeben').addEventListener('click', () => sloStart(null, 'ueben'));
$('sloWoerterBtn').addEventListener('click', sloWoerter);
$('sloZurueck').addEventListener('click', () => { if (!$('slo-karte').hidden) { if ('speechSynthesis' in window) speechSynthesis.cancel(); zeigeHub(); } else if (!slo || slo.i === 0 || confirm('Lektion abbrechen?')) sloKarte(); });
$('hubSlo').addEventListener('click', () => { merkeZuletzt('slo'); zoomZu($('hubSlo'), () => { show('slo', '🐉 Slowenisch'); sloKarte(); }); });
