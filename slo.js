// 🐉 Slowenisch mit Zmajček: eine Sprachreise durch Slowenien. Jede Station ist ein Thema mit drei Stufen.
// Aufgaben: neues Wort, Bild wählen, Übersetzung wählen, Paare finden, Satz verstehen, Satz bauen, Lücke füllen,
// Wort tippen (mit č š ž) und – wenn das Gerät eine slowenische Stimme hat – Hören. Falsche Antworten kommen am Ende der
// Lektion noch einmal dran. Fortschritt, XP, Tagesziel, Serie und Wortstärke je Profil.
const SLO_KEY = 'walquiz.slo.v1';
const SLO_TAGESZIEL = 30;
const SLO_SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let sloAudio = null, sloAudioEl = null, sloStimme = null;

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
  { id: 'telo', ort: 'Planica', ortEmoji: '🎿', titel: 'Telo in zdravje', de: 'Körper & Gesundheit', farbe: '#e11d48',
    tipp: '<p><b>Es tut weh:</b> <i>Boli me glava.</i> – wörtlich „Mich schmerzt der Kopf“.</p>'
      + '<p>Männer sagen <i>Sem bolan</i>, Frauen <i>Sem bolna</i> (ich bin krank).</p>'
      + '<p>In Planica stehen die größten Skiflugschanzen der Welt – hier wurde schon über 250 m weit geflogen.</p>',
    woerter: [['glava', 'Kopf', '🧑'], ['roka', 'Hand', '✋'], ['noga', 'Bein', '🦵'], ['oko', 'Auge', '👁️'], ['uho', 'Ohr', '👂'], ['nos', 'Nase', '👃'],
      ['usta', 'Mund', '👄'], ['zob', 'Zahn', '🦷'], ['srce', 'Herz', '❤️'], ['lasje', 'Haare', '💇'], ['zdravnik', 'Arzt', '🧑‍⚕️'], ['bolan', 'krank', '🤒']],
    saetze: [['Boli me glava.', 'Mir tut der Kopf weh.', [], ['Ich habe Kopfschmerzen']], ['Sem bolan.', 'Ich bin krank.', ['Sem bolna']], ['Potrebujem zdravnika.', 'Ich brauche einen Arzt.'],
      ['Imam modre oči.', 'Ich habe blaue Augen.'], ['Umij si roke.', 'Wasch dir die Hände.'], ['Kako se počutiš?', 'Wie fühlst du dich?']] },
  { id: 'oblacila', ort: 'Idrija', ortEmoji: '🧵', titel: 'Oblačila', de: 'Kleidung', farbe: '#d946ef',
    tipp: '<p><b>tragen</b> = <i>nositi</i>: <i>Nosim očala.</i> = Ich trage eine Brille.</p>'
      + '<p>Manche Wörter gibt es nur im Plural: <i>hlače</i> (Hose), <i>očala</i> (Brille) – wie im Deutschen „die Leute“.</p>'
      + '<p>Die Klöppelspitze aus Idrija (<i>idrijska čipka</i>) ist weltberühmt.</p>',
    woerter: [['majica', 'T-Shirt', '👕'], ['hlače', 'Hose', '👖'], ['obleka', 'Kleid', '👗'], ['čevlji', 'Schuhe', '👟'], ['plašč', 'Mantel', '🧥'], ['kapa', 'Mütze', '🧢'],
      ['šal', 'Schal', '🧣'], ['nogavice', 'Socken', '🧦'], ['rokavice', 'Handschuhe', '🧤'], ['očala', 'Brille', '👓'], ['torba', 'Tasche', '👜'], ['dežnik', 'Regenschirm', '☂️']],
    saetze: [['Ta majica je lepa.', 'Dieses T-Shirt ist schön.'], ['Kje so moji čevlji?', 'Wo sind meine Schuhe?'], ['Zunaj je mrzlo, vzemi plašč.', 'Draußen ist es kalt, nimm den Mantel.', [], ['Draußen ist es kalt, nimm einen Mantel']],
      ['Koliko stane ta obleka?', 'Wie viel kostet dieses Kleid?', [], ['Was kostet dieses Kleid']], ['Nosim očala.', 'Ich trage eine Brille.'], ['Idrijska čipka je znana po vsem svetu.', 'Die Idrijaer Spitze ist auf der ganzen Welt bekannt.', [], ['Die Spitze aus Idrija ist weltbekannt']]] },
  { id: 'doma', ort: 'Škofja Loka', ortEmoji: '🏡', titel: 'Doma', de: 'Zuhause', farbe: '#eab308',
    tipp: '<p><b>doma</b> = zu Hause, <b>domov</b> = nach Hause: <i>Grem domov.</i></p>'
      + '<p>Befehle mit „du“ enden oft auf <b>-i</b>: <i>odpri</i> (mach auf), <i>ugasni</i> (mach aus), <i>zapri</i> (mach zu).</p>'
      + '<p>Škofja Loka ist eine der am besten erhaltenen mittelalterlichen Städte Sloweniens.</p>',
    woerter: [['hiša', 'Haus', '🏠'], ['stanovanje', 'Wohnung', '🏢'], ['soba', 'Zimmer', '🛋️'], ['kuhinja', 'Küche', '🍳'], ['kopalnica', 'Bad', '🛁'], ['postelja', 'Bett', '🛏️'],
      ['miza', 'Tisch', '🍽️'], ['stol', 'Stuhl', '🪑'], ['okno', 'Fenster', '🪟'], ['vrata', 'Tür', '🚪'], ['ključ', 'Schlüssel', '🔑'], ['vrt', 'Garten', '🌻'], ['luč', 'Licht', '💡']],
    saetze: [['Moja soba je majhna.', 'Mein Zimmer ist klein.'], ['Ključ je na mizi.', 'Der Schlüssel ist auf dem Tisch.', [], ['Der Schlüssel liegt auf dem Tisch']], ['Odpri okno, prosim.', 'Mach bitte das Fenster auf.', [], ['Öffne bitte das Fenster', 'Mach das Fenster auf, bitte']],
      ['V kuhinji kuham kosilo.', 'In der Küche koche ich das Mittagessen.', [], ['Ich koche in der Küche das Mittagessen']], ['Živimo v stanovanju.', 'Wir wohnen in einer Wohnung.'], ['Ugasni luč.', 'Mach das Licht aus.']] },
  { id: 'sola', ort: 'Novo mesto', ortEmoji: '🏫', titel: 'Šola in delo', de: 'Schule & Arbeit', farbe: '#0891b2',
    tipp: '<p><b>Wohin? v + Akkusativ:</b> <i>Grem v šolo.</i> · <b>Wo? v + Lokativ:</b> <i>Sem v šoli.</i></p>'
      + '<p><i>učitelj</i> (Lehrer) · <i>učiteljica</i> (Lehrerin) – die weibliche Form endet oft auf <b>-ica</b>.</p>',
    woerter: [['šola', 'Schule', '🏫'], ['učitelj', 'Lehrer', '👨‍🏫'], ['učiteljica', 'Lehrerin', '👩‍🏫'], ['knjiga', 'Buch', '📖'], ['svinčnik', 'Bleistift', '✏️'], ['zvezek', 'Heft', '📓'],
      ['računalnik', 'Computer', '💻'], ['telefon', 'Telefon', '📱'], ['služba', 'Arbeitsstelle', '💼'], ['pisarna', 'Büro', '🗄️'], ['naloga', 'Aufgabe', '📝'], ['odmor', 'Pause', '⏸️']],
    saetze: [['Grem v šolo.', 'Ich gehe in die Schule.', [], ['Ich gehe zur Schule']], ['Učiteljica je prijazna.', 'Die Lehrerin ist nett.', [], ['Die Lehrerin ist freundlich']], ['Berem knjigo.', 'Ich lese ein Buch.'],
      ['Delam v pisarni.', 'Ich arbeite in einem Büro.', [], ['Ich arbeite im Büro']], ['Imam veliko dela.', 'Ich habe viel Arbeit.', [], ['Ich habe viel zu tun']], ['Kdaj je odmor?', 'Wann ist Pause?', [], ['Wann ist die Pause']]] },
  { id: 'prosti', ort: 'Bovec', ortEmoji: '🪂', titel: 'Prosti čas', de: 'Freizeit', farbe: '#10b981',
    tipp: '<p><b>gern tun:</b> <i>rad</i> / <i>rada</i> + Verb: <i>Rad igram nogomet.</i> = Ich spiele gern Fußball.</p>'
      + '<p><b>können</b> (etwas gelernt haben) = <i>znati</i>: <i>Ali znaš plavati?</i></p>'
      + '<p>„Greva?“ ist wieder der Dual: „Gehen wir zwei?“ Bovec ist das Zentrum für Rafting und Paragliding im Soča-Tal.</p>',
    woerter: [['igrati', 'spielen', '🎮'], ['plavati', 'schwimmen', '🏊'], ['teči', 'laufen', '🏃'], ['brati', 'lesen', '📚'], ['peti', 'singen', '🎤'], ['plesati', 'tanzen', '💃'],
      ['kolo', 'Fahrrad', '🚲'], ['nogomet', 'Fußball', '⚽'], ['glasba', 'Musik', '🎵'], ['film', 'Film', '🎬'], ['izlet', 'Ausflug', '🥾'], ['smučati', 'Ski fahren', '⛷️']],
    saetze: [['Rad igram nogomet.', 'Ich spiele gern Fußball.', ['Rada igram nogomet']], ['Ob vikendih gremo na izlet.', 'Am Wochenende machen wir einen Ausflug.'], ['Ali znaš plavati?', 'Kannst du schwimmen?'],
      ['Poslušam glasbo.', 'Ich höre Musik.'], ['Pozimi smučamo.', 'Im Winter fahren wir Ski.'], ['Greva v kino?', 'Gehen wir ins Kino?']] },
  { id: 'nakup', ort: 'Kras', ortEmoji: '🍖', titel: 'Nakupovanje', de: 'Einkaufen', farbe: '#b45309',
    tipp: '<p><b>Mengen + Genitiv:</b> <i>kilogram jabolk</i> (ein Kilo Äpfel), <i>liter mleka</i> (ein Liter Milch).</p>'
      + '<p><b>pre-</b> heißt „zu“: <i>drago</i> (teuer) → <i>predrago</i> (zu teuer).</p>'
      + '<p>Aus dem Karst kommen der luftgetrocknete <i>kraški pršut</i> und der rote Wein <i>teran</i>.</p>',
    woerter: [['tržnica', 'Markt', '🧺'], ['denar', 'Geld', '💶'], ['cena', 'Preis', '🏷️'], ['drago', 'teuer', '💎'], ['poceni', 'billig', '🪙'], ['kupiti', 'kaufen', '🛒'],
      ['plačati', 'bezahlen', '💳'], ['kilogram', 'Kilo', '⚖️'], ['vrečka', 'Tüte', '🛍️'], ['pršut', 'Rohschinken', '🍖'], ['sadje', 'Obst', '🍇'], ['zelenjava', 'Gemüse', '🥦']],
    saetze: [['Kilogram jabolk, prosim.', 'Ein Kilo Äpfel, bitte.'], ['To je predrago.', 'Das ist zu teuer.'], ['Lahko plačam s kartico?', 'Kann ich mit Karte zahlen?', [], ['Kann ich mit Karte bezahlen']],
      ['Potrebujem vrečko.', 'Ich brauche eine Tüte.'], ['Na tržnici kupim sadje.', 'Auf dem Markt kaufe ich Obst.', [], ['Ich kaufe Obst auf dem Markt']], ['Kraški pršut je slasten.', 'Der Karst-Rohschinken ist lecker.', [], ['Der Karster Schinken ist lecker']]] },
  { id: 'cas', ort: 'Velika planina', ortEmoji: '🐄', titel: 'Čas in ura', de: 'Zeit & Uhrzeit', farbe: '#8b5cf6',
    tipp: '<p><b>Uhrzeit:</b> <i>Ura je tri.</i> (3 Uhr) · <i>pol osmih</i> = halb acht – genau wie im Deutschen „halb zur Acht“.</p>'
      + '<p><b>Doppelte Verneinung</b> ist richtig: <i>Nikoli ne zamudim.</i> – wörtlich „Ich komme nie nicht zu spät“.</p>'
      + '<p>Auf der Hochalm Velika planina stehen ovale Hirtenhütten, die es so nur hier gibt.</p>',
    woerter: [['ura', 'Uhr', '⏰'], ['minuta', 'Minute', '⏱️'], ['zjutraj', 'morgens', '🌄'], ['zvečer', 'abends', '🌃'], ['ponoči', 'nachts', '🌌'], ['opoldne', 'mittags', '🕛'],
      ['zgodaj', 'früh', '🐓'], ['pozno', 'spät', '🦉'], ['vedno', 'immer', '♾️'], ['nikoli', 'nie', '🚫'], ['včasih', 'manchmal', '🔀'], ['kmalu', 'bald', '⏳'], ['leto', 'Jahr', '📆'], ['mesec', 'Monat', '🗓️']],
    saetze: [['Koliko je ura?', 'Wie spät ist es?', [], ['Wie viel Uhr ist es']], ['Ura je pol osmih.', 'Es ist halb acht.'], ['Zjutraj pijem kavo.', 'Morgens trinke ich Kaffee.', [], ['Am Morgen trinke ich Kaffee']],
      ['Nikoli ne zamudim.', 'Ich komme nie zu spät.'], ['Se vidimo kmalu.', 'Bis bald.', [], ['Wir sehen uns bald']], ['Na Veliki planini so pastirske koče.', 'Auf der Velika planina gibt es Hirtenhütten.', [], ['Auf der Velika planina stehen Hirtenhütten']]] },
  { id: 'potovanje', ort: 'Koper', ortEmoji: '⛵', titel: 'Potovanje', de: 'Reisen', farbe: '#2563eb',
    tipp: '<p><b>nach (Ort):</b> <i>do</i> + Genitiv: <i>do Kopra</i>, <i>do Ljubljane</i>.</p>'
      + '<p><b>um (Uhrzeit):</b> <i>ob</i>: <i>ob devetih</i> = um neun.</p>'
      + '<p>Koper ist Sloweniens einziger großer Hafen – die Küste ist nur etwa 47 km lang.</p>',
    woerter: [['letališče', 'Flughafen', '✈️'], ['letalo', 'Flugzeug', '🛫'], ['potni list', 'Reisepass', '🛂'], ['kovček', 'Koffer', '🧳'], ['hotel', 'Hotel', '🏨'], ['vozovnica', 'Fahrkarte', '🎫'],
      ['zemljevid', 'Landkarte', '🗺️'], ['plaža', 'Strand', '🏖️'], ['ladja', 'Schiff', '🚢'], ['avto', 'Auto', '🚗'], ['dopust', 'Urlaub', '🌴'], ['meja', 'Grenze', '🚧']],
    saetze: [['Eno vozovnico do Kopra, prosim.', 'Eine Fahrkarte nach Koper, bitte.'], ['Kje je letališče?', 'Wo ist der Flughafen?'], ['Imam rezervacijo.', 'Ich habe eine Reservierung.'],
      ['Gremo na dopust.', 'Wir fahren in den Urlaub.', [], ['Wir gehen in den Urlaub']], ['Moj kovček je težek.', 'Mein Koffer ist schwer.'], ['Ladja odpelje ob devetih.', 'Das Schiff fährt um neun ab.', [], ['Das Schiff fährt um neun Uhr ab']]] },
  { id: 'custva', ort: 'Portorož', ortEmoji: '🌅', titel: 'Čustva', de: 'Gefühle', farbe: '#f43f5e',
    tipp: '<p>Gefühlswörter stehen hier in der <b>männlichen</b> Form. Frauen hängen meist <b>-a</b> an: <i>srečen → srečna</i>, <i>žalosten → žalostna</i>, <i>lačen → lačna</i>.</p>'
      + '<p><i>Dolgčas mi je.</i> = Mir ist langweilig – wörtlich „lange Zeit ist mir“.</p>',
    woerter: [['srečen', 'glücklich', '😊'], ['žalosten', 'traurig', '😢'], ['jezen', 'wütend', '😠'], ['utrujen', 'müde', '🥱'], ['lačen', 'hungrig', '🤤'], ['žejen', 'durstig', '🚰'],
      ['vesel', 'froh', '😄'], ['prestrašen', 'erschrocken', '😨'], ['zaljubljen', 'verliebt', '😍'], ['presenečen', 'überrascht', '😮'], ['ponosen', 'stolz', '🦚'], ['dolgčas', 'Langeweile', '😑']],
    saetze: [['Danes sem zelo srečen.', 'Heute bin ich sehr glücklich.', ['Danes sem zelo srečna']], ['Ali si lačen?', 'Hast du Hunger?', ['Ali si lačna'], ['Bist du hungrig']], ['Utrujena sem.', 'Ich bin müde.', ['Utrujen sem']],
      ['Ne bodi žalosten.', 'Sei nicht traurig.', ['Ne bodi žalostna']], ['Dolgčas mi je.', 'Mir ist langweilig.'], ['Ponosen sem nate.', 'Ich bin stolz auf dich.', ['Ponosna sem nate']]] },
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
function sloStimmeSuchen() {
  if (!('speechSynthesis' in window)) return;
  const v = speechSynthesis.getVoices();
  sloStimme = v.find((x) => /^sl([-_]|$)/i.test(x.lang)) || null;
  const el = $('sloStimme');
  if (el) el.textContent = (sloAudio ? '🔊 Mit Sprachaufnahmen – tippe auf 🔊 zum Anhören.' : sloStimme ? '🔊 Slowenische Stimme: ' + sloStimme.name + ' – tippe auf 🔊 zum Anhören.' : '🔇 Auf diesem Gerät gibt es keine slowenische Stimme – Hör-Aufgaben sind ausgeblendet. Die Aussprache steht im 💡 Tipp jeder Station.')
    + (sloSprechenMoeglich() ? ' 🎙️ Nachsprechen ist an.' : '');
  const st = loadJson(SLO_KEY), schalter = [];
  if (SLO_SR && st.sprechenAus > Date.now()) schalter.push('<button type="button" class="slo-schalter" data-an="sprechenAus">🎙️ Nachsprechen wieder einschalten</button>');
  if ((sloStimme || sloAudio) && st.hoerenAus > Date.now()) schalter.push('<button type="button" class="slo-schalter" data-an="hoerenAus">🎧 Hör-Aufgaben wieder einschalten</button>');
  schalter.push('<button type="button" class="slo-schalter" id="sloCheck">🩺 Mikrofon-Check</button>');
  if (el && schalter.length) {
    el.innerHTML = sloEsc(el.textContent) + '<br>' + schalter.join(' ');
    el.querySelectorAll('[data-an]').forEach((b) => b.addEventListener('click', () => { const s2 = sloStore(); delete s2[b.dataset.an]; saveJson(SLO_KEY, s2); sloStimmeSuchen(); }));
    if ($('sloCheck')) $('sloCheck').addEventListener('click', sloMikroCheck);
  }
}
if ('speechSynthesis' in window) { sloStimmeSuchen(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', sloStimmeSuchen); }
// Fertige Aufnahmen (audio/slo/index.json: normierter Text → Datei) haben Vorrang vor der Gerätestimme
fetch('audio/slo/index.json').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && typeof j === 'object') { sloAudio = j; sloStimmeSuchen(); } }).catch(() => {});
const sloDatei = (text) => sloAudio && sloAudio[sloNorm(text)];
const sloHatTon = (text) => !!(sloDatei(text) || sloStimme);
const sloTonDa = () => !!(sloStimme || sloAudio) && !(loadJson(SLO_KEY).hoerenAus > Date.now());
function sloSprich(text, langsam) {
  const datei = sloDatei(text);
  if (datei) {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (sloAudioEl) sloAudioEl.pause();
    sloAudioEl = new Audio('audio/slo/' + datei);
    sloAudioEl.playbackRate = langsam ? 0.7 : 1; sloAudioEl.preservesPitch = true;
    sloAudioEl.play().catch(() => {});
    return;
  }
  if (!sloStimme) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = sloStimme; u.lang = sloStimme.lang; u.rate = langsam ? 0.6 : 0.9;
  speechSynthesis.speak(u);
}
const sloLaut = (text) => (sloHatTon(text) ? '<button type="button" class="slo-laut" data-sprich="' + sloEsc(text) + '" aria-label="Anhören">🔊</button>' : '');

// Nachsprechen mit Spracherkennung (Safari/Chrome), abschaltbar für eine Stunde
function sloSprechenMoeglich() { const st = loadJson(SLO_KEY); return !!(SLO_SR || (window.MediaRecorder && navigator.mediaDevices)) && !(st.sprechenAus > Date.now()); }
// Anteil der Zielwörter, die erkannt wurden (Häkchen egal)
function sloSprachTreffer(gesagt, ziel) {
  const z = sloOhneZeichen(ziel).split(' ').filter(Boolean), g = new Set(sloOhneZeichen(gesagt).split(' '));
  return z.length ? z.filter((w) => g.has(w)).length / z.length : 0;
}

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
    + '<g class="slo-fl slo-fl-l"><path d="M34 58q-22-14-26 6q12-6 16 2q4-8 10-2z" fill="#1f7a4a"/><path d="M30 57q-12-6-18 2" stroke="#3fb67a" stroke-width="1.4" fill="none"/></g>'
    + '<g class="slo-fl slo-fl-r"><path d="M66 58q22-14 26 6q-12-6-16 2q-4-8-10-2z" fill="#1f7a4a"/><path d="M70 57q12-6 18 2" stroke="#3fb67a" stroke-width="1.4" fill="none"/></g>'
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
      : '<g class="slo-augen"><circle cx="42" cy="32" r="3" fill="#111"/><circle cx="60" cy="32" r="3" fill="#111"/><circle cx="43" cy="31" r="1" fill="#fff"/><circle cx="61" cy="31" r="1" fill="#fff"/></g>')
    + '<g class="slo-rauch"><circle cx="45" cy="40" r="2.2"/><circle cx="55" cy="40" r="2.2"/></g>'
    + (stimmung === 'jubel' ? '<g class="slo-funken"><path d="M14 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M86 16l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/><path d="M82 40l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></g>' : '')
    + (stimmung === 'traurig' ? '<path d="M35 24l10 3M65 24l-10 3" stroke="#14532d" stroke-width="2" stroke-linecap="round"/>' : '')
    + '<circle cx="33" cy="41" r="3.5" fill="#fb7185" opacity=".55"/><circle cx="67" cy="41" r="3.5" fill="#fb7185" opacity=".55"/>'
    + mund + '</svg>';
}

// ---------- Landschaften neben den Stationen: Burgen, Berge, Meer … (SVG, Fahnen und Wolken bewegen sich) ----------
const SLO_SZENE = { pozdravi: 'burg-huegel', jaz: 'burg-see', stevilke: 'meer-turm', barve: 'burg-fels', hrana: 'weinberg', druzina: 'burg-huegel2', zivali: 'fluss',
  mesto: 'burg-ruine', dnevi: 'berg-schnee', narava: 'berg', pogovor: 'wiese', telo: 'schanze', oblacila: 'wald', doma: 'burg-huegel2', sola: 'fluss', prosti: 'fluss',
  nakup: 'weinberg', cas: 'huetten', potovanje: 'meer', custva: 'meer-abend' };
function sloBurg(x, y, gross, f) {
  const t = (tx, ty, w, h, dach) => '<rect x="' + tx + '" y="' + ty + '" width="' + w + '" height="' + h + '" fill="#d9d2c3"/><rect x="' + tx + '" y="' + ty + '" width="' + w + '" height="3" fill="#bfb6a3"/>'
    + (dach ? '<path d="M' + (tx - 2) + ' ' + ty + 'L' + (tx + w / 2) + ' ' + (ty - h * 0.55) + 'L' + (tx + w + 2) + ' ' + ty + 'z" fill="#c2410c"/>' : '<path d="M' + tx + ' ' + ty + 'h' + w + 'v-3h-' + (w / 5) + 'v2h-' + (w / 5) + 'v-2h-' + (w / 5) + 'v2h-' + (w / 5) + 'v-2h-' + (w / 5) + 'z" fill="#d9d2c3"/>')
    + '<rect x="' + (tx + w / 2 - 1.5) + '" y="' + (ty + h * 0.35) + '" width="3" height="5" rx="1.5" fill="#fde68a" class="slo-fenster"/>';
  const k = gross ? 1.2 : 1;
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' + t(-26, -18, 52, 18) + t(-34, -34, 14, 34, true) + t(18, -40, 16, 40, true) + t(-8, -30, 14, 12)
    + '<rect x="-5" y="-9" width="10" height="9" rx="5" fill="#57534e"/>'
    + '<path d="M26 -62v-12" stroke="#57534e" stroke-width="1.2"/><path class="slo-fahne" d="M26 -74h10l-3 3 3 3h-10z" fill="' + f + '"/></g>';
}
function sloSzene(id, farbe) {
  const art = SLO_SZENE[id] || 'wald', wolke = '<g class="slo-wolke"><ellipse cx="30" cy="16" rx="12" ry="5" fill="#fff" opacity=".7"/><ellipse cx="38" cy="13" rx="8" ry="5" fill="#fff" opacity=".7"/></g>';
  const huegel = (c) => '<path d="M0 100Q30 54 64 62T130 58V100z" fill="' + c + '"/>';
  let g = '';
  if (art.startsWith('burg')) {
    if (art === 'burg-see') g = '<rect y="70" width="130" height="30" fill="#38bdf8"/><path class="slo-welle" d="M0 78q8-3 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" stroke="#e0f2fe" fill="none"/>'
      + '<path d="M78 72 L88 40 L108 36 L118 72z" fill="#78716c"/>' + sloBurg(98, 40, false, farbe) + '<ellipse cx="34" cy="74" rx="14" ry="4" fill="#15803d"/><path d="M34 70v-8M30 66l4-6 4 6" stroke="#fef3c7" stroke-width="2" fill="none"/>';
    else if (art === 'burg-fels') g = '<path d="M0 100V20Q30 6 70 14T130 10V100z" fill="#57534e"/><path d="M30 76q10-28 40-30q20 2 30 30z" fill="#1c1917"/>' + sloBurg(66, 60, false, farbe);
    else if (art === 'burg-ruine') g = huegel('#4d7c0f') + '<path d="M44 62h44v-14h-6v-6h-6v6h-6v-10h-8v10h-6v-6h-6v6h-6z" fill="#a8a29e"/><path d="M60 38v-26h12v26" fill="#a8a29e"/><path class="slo-fahne" d="M66 12v-10h10l-3 3 3 3h-10" fill="' + farbe + '"/>';
    else g = huegel(art === 'burg-huegel2' ? '#3f6212' : '#4d7c0f') + sloBurg(66, 62, true, farbe) + '<path d="M0 100Q40 86 130 92V100z" fill="#166534"/>';
  } else if (art === 'berg' || art === 'berg-schnee' || art === 'schanze') {
    g = '<path d="M-4 100L34 30L54 58L78 18L120 100z" fill="#64748b"/><path d="M78 18L68 38L76 34L82 42L90 36z" fill="#f8fafc"/><path d="M34 30L26 46L34 42L40 48z" fill="#f8fafc"/>'
      + (art === 'berg-schnee' ? '<path d="M0 100Q40 80 130 88V100z" fill="#f1f5f9"/>' : '<path d="M0 100Q40 80 130 88V100z" fill="#15803d"/>')
      + (art === 'schanze' ? '<path d="M96 52Q104 80 128 96" stroke="#e2e8f0" stroke-width="5" fill="none"/><circle class="slo-springer" cx="96" cy="52" r="2.5" fill="#ef4444"/>' : '');
  } else if (art.startsWith('meer')) {
    const abend = art === 'meer-abend';
    g = (abend ? '<rect width="130" height="70" fill="#fb923c" opacity=".35"/><circle cx="96" cy="64" r="14" fill="#fdba74"/>' : '<circle cx="104" cy="22" r="9" fill="#fde047"/>')
      + '<rect y="64" width="130" height="36" fill="#0284c7"/><path class="slo-welle" d="M0 72q8-3 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0M0 84q8-3 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" stroke="#bae6fd" fill="none"/>'
      + (art === 'meer-turm' ? '<path d="M8 64V24h10v40" fill="#e7e5e4"/><path d="M6 24L13 10L20 24z" fill="#b45309"/><rect x="10" y="30" width="6" height="6" fill="#57534e"/>' : '')
      + '<g class="slo-boot"><path d="M40 66h26l-4 6h-18z" fill="#f8fafc"/><path d="M52 64V44l12 18z" fill="#fef3c7"/><path d="M52 44v20" stroke="#78350f"/></g>';
  } else if (art === 'fluss') {
    g = huegel('#15803d') + '<path d="M60 100Q50 84 70 74T84 62" stroke="#14b8a6" stroke-width="12" fill="none"/><path d="M60 100Q50 84 70 74T84 62" stroke="#5eead4" stroke-width="2" stroke-dasharray="4 6" fill="none" class="slo-strom"/>'
      + '<path d="M16 80l6-16 6 16zM100 74l6-16 6 16z" fill="#166534"/>';
  } else if (art === 'weinberg') {
    g = huegel('#65a30d') + Array.from({ length: 5 }, (_, i) => '<path d="M' + (18 + i * 18) + ' ' + (92 - i * 3) + 'v-14" stroke="#713f12" stroke-width="2"/><circle cx="' + (18 + i * 18) + '" cy="' + (76 - i * 3) + '" r="5" fill="#16a34a"/><circle cx="' + (21 + i * 18) + '" cy="' + (81 - i * 3) + '" r="2.4" fill="#7c3aed"/>').join('');
  } else if (art === 'huetten') {
    g = huegel('#4d7c0f') + [[30, 70], [62, 64], [94, 70]].map(([x, y]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="13" ry="5" fill="#1c1917"/><path d="M' + (x - 13) + ' ' + y + 'Q' + x + ' ' + (y - 22) + ' ' + (x + 13) + ' ' + y + 'z" fill="#78716c"/><rect x="' + (x - 3) + '" y="' + (y - 4) + '" width="6" height="5" fill="#fde68a"/>').join('') + '<ellipse cx="80" cy="88" rx="7" ry="4" fill="#f5f5f4"/><circle cx="74" cy="86" r="3" fill="#f5f5f4"/>';
  } else if (art === 'wiese') {
    g = huegel('#65a30d') + '<g class="slo-pferd"><ellipse cx="64" cy="76" rx="12" ry="6" fill="#f5f5f4"/><path d="M74 74l6-10 4 2-4 10z" fill="#f5f5f4"/><path d="M56 80v8M60 80v8M68 80v8M72 80v8" stroke="#f5f5f4" stroke-width="2.4"/></g><path d="M0 70h130" stroke="#a16207" stroke-dasharray="2 4"/>';
  } else {
    g = huegel('#166534') + [16, 38, 60, 84, 106].map((x, i) => '<path d="M' + x + ' ' + (84 - (i % 2) * 6) + 'l9-26 9 26z" fill="' + (i % 2 ? '#14532d' : '#15803d') + '"/>').join('');
  }
  return '<svg class="slo-szene" viewBox="0 0 130 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + wolke + g + '</svg>';
}

// ---------- Lektionen zusammenstellen ----------
// Aufgaben: { typ, w (Wort) | s (Satz), ... }
function sloLektion(u, stufe) {
  const W = u.W, S = u.S, haelfte = Math.ceil(W.length / 2), A = [];
  const W1 = W.slice(0, haelfte), W2 = W.slice(haelfte);
  const wortAufgabe = (w, i) => {
    const typen = ['bild', 'slde', 'desl'];
    if (sloTonDa() && stufe >= 2) typen.push('hoeren');
    return { typ: typen[(i + stufe) % typen.length], w };
  };
  if (stufe === 1) {
    A.push({ typ: 'tipp' });
    W1.forEach((w, i) => { A.push({ typ: 'neu', w }); A.push(wortAufgabe(w, i)); });
    A.push({ typ: 'paare', liste: sloMisch(W1).slice(0, 5) });
    sloMisch(W1).slice(0, 3).forEach((w) => A.push({ typ: 'desl', w }));
    if (sloSprechenMoeglich()) A.splice(A.length - 2, 0, { typ: 'sprechen', w: W1[Math.floor(Math.random() * W1.length)] });
  } else if (stufe === 2) {
    W2.forEach((w, i) => { A.push({ typ: 'neu', w }); A.push(wortAufgabe(w, i + 1)); });
    A.push({ typ: 'paare', liste: sloMisch(W).slice(0, 5) });
    const ss = sloMisch(S);
    ss.slice(0, 4).forEach((s) => { A.push({ typ: 'satzwahl', s }); A.push({ typ: 'bauen', s, nach: 'sl' }); });
    if (sloTonDa()) A.push({ typ: 'diktat', s: ss[4] || ss[0] });
    if (sloSprechenMoeglich()) A.push({ typ: 'sprechen', s: ss[0] });
  } else {
    // Stufe 3 und Wiederholen: alles gemischt, mit Tippen und Rückübersetzung
    const ws = sloMisch(W), ss = sloMisch(S);
    ws.slice(0, 3).forEach((w) => A.push({ typ: 'tippen', w }));
    ss.slice(0, 2).forEach((s) => A.push({ typ: 'luecke', s }));
    ss.slice(2, 4).forEach((s) => A.push({ typ: 'bauen', s, nach: 'de' }));
    ss.slice(4, 6).forEach((s) => A.push({ typ: 'bauen', s, nach: 'sl' }));
    A.push({ typ: 'paare', liste: ws.slice(3, 8) });
    if (sloTonDa()) { ws.slice(8, 10).forEach((w) => A.push({ typ: 'hoeren', w })); ss.slice(0, 2).forEach((s) => A.push({ typ: 'diktat', s })); }
    if (sloSprechenMoeglich()) ss.slice(2, 4).forEach((s) => A.push({ typ: 'sprechen', s }));
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
  const typen = ['tippen', 'desl', 'slde', 'bild'].concat(sloTonDa() ? ['hoeren'] : [], sloSprechenMoeglich() ? ['sprechen'] : []);
  const A = schwach.map((w, i) => ({ typ: typen[i % typen.length], w }));
  if (schwach.length >= 4) A.splice(5, 0, { typ: 'paare', liste: schwach.slice(0, 5) });
  return A;
}

// ---------- Ablauf ----------
let slo = null;
const sloTeile2 = ['karte', 'lektion', 'ende', 'woerter'];
const zeigeSloTeil = (t) => sloTeile2.forEach((x) => { $('slo-' + x).hidden = x !== t; });

// Stationen auf dem gemalten Weg (x, y in % des Bildes img/slo/reise-slowenien.webp, das 1,7-fach in die Höhe gezogen ist).
// Ermittelt aus den leuchtenden Pfad-Pixeln des Bildes, in gleichen Höhenabständen entlang des Weges – Start unten bei der Fahne.
const SLO_PFAD = [[66.0, 94.39], [69.2, 90.13], [28.5, 85.74], [47.7, 81.38], [25.2, 77.0], [33.5, 72.59], [72.3, 68.1], [36.0, 63.88], [68.9, 59.49], [25.1, 55.14], [42.7, 50.78], [73.8, 46.43], [29.4, 42.02], [34.5, 37.58], [72.4, 33.33], [16.9, 28.9], [56.2, 24.54], [48.8, 20.12], [64.1, 15.83], [45.1, 11.43]];
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
    const s = st.stufe[u.id] || 0, offen = sloOffen(st, i), [px, py] = SLO_PFAD[i] || [50, 50], seite = px > 50 ? 'rechts' : 'links';
    return '<div class="slo-station slo-' + seite + (offen ? '' : ' zu') + (s >= 3 ? ' fertig' : '') + (i === jetzt ? ' jetzt' : '') + '" style="--f:' + u.farbe + ';left:' + px + '%;top:' + py + '%">'
      + (i === jetzt ? '<button type="button" class="slo-maskottchen" id="sloMaskottchen" aria-label="Zmajček">' + sloDrache('froh') + '<span class="slo-blase"><b>' + spruch[0] + '</b><small>' + spruch[1] + '</small></span></button>' : '')
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
  // zur aktuellen Station scrollen (die Reise führt von unten nach oben)
  requestAnimationFrame(() => { const el = document.querySelector('.slo-station.jetzt'), b = document.querySelector('.slo-buehne'); if (el && b) b.scrollTop = Math.max(0, el.getBoundingClientRect().top + b.scrollTop - b.clientHeight * 0.55); });
  // Zmajček antippen: ein Looping und ein neuer Spruch
  const m = $('sloMaskottchen');
  if (m) m.addEventListener('click', () => {
    const sp = SLO_SPRUECHE[Math.floor(Math.random() * SLO_SPRUECHE.length)];
    m.querySelector('.slo-blase').innerHTML = '<b>' + sp[0] + '</b><small>' + sp[1] + '</small>';
    m.classList.remove('looping'); void m.offsetWidth; m.classList.add('looping');
    sloSprich(sp[0]);
  });
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
  const kd = $('sloKopfDrache');
  if (kd && !kd.firstChild) kd.innerHTML = sloDrache('froh');
  if (kd) kd.className = 'slo-kopfdrache';
  // „Ich weiß es nicht“ – bei allen bewerteten Aufgaben außer Paaren
  $('sloWeissNicht').hidden = ['neu', 'tipp', 'paare'].includes(a.typ);
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
  sloBewerten(r, a);
}
// Musterlösung einer Aufgabe (für „Ich weiß es nicht“)
function sloMusterloesung(a) {
  if (a.w) return { loesung: (a.typ === 'bild' ? a.w.e + ' ' : '') + sloEsc(a.w.sl) + ' = ' + sloEsc(a.w.de), laut: a.w.sl };
  if (a.s) return { loesung: sloEsc(a.s.sl) + ' = ' + sloEsc(a.s.de), laut: a.s.sl };
  return { loesung: '' };
}
function sloWeissNicht() {
  if (!slo || slo.zustand !== 'antwort') return;
  const a = slo.liste[slo.i];
  if (['neu', 'tipp', 'paare'].includes(a.typ)) return;
  if (a.typ === 'sprechen') try { if (slo.rec) slo.rec.abort(); } catch (e) { /* egal */ }
  sloBewerten({ ok: false, aufgegeben: true, ...sloMusterloesung(a), hinweis: 'Kein Problem – merk es dir, es kommt am Ende noch einmal.' }, a);
}
// Aufgabe überspringen, ohne Wertung (Mikrofon oder Ton gerade nicht möglich)
function sloUeberspringen(typen, aus, schluessel, stunden) {
  const st = sloStore(); st[schluessel] = Date.now() + stunden * 36e5; saveJson(SLO_KEY, st);
  slo.liste = slo.liste.filter((x, i) => i <= slo.i || !typen.includes(x.typ));
  slo.i++; sloZeigen();
  if (typeof skToast === 'function') skToast(aus);
}
function sloBewerten(r, a) {
  $('sloWeissNicht').hidden = true;
  slo.zustand = 'weiter'; slo.bewertet++;
  if (r.ok) { slo.richtig++; slo.combo = (slo.combo || 0) + 1; sloKlang(true); if (navigator.vibrate) navigator.vibrate(12); }
  else {
    slo.fehler++; slo.combo = 0; sloKlang(false); if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
    // falsch beantwortet: kommt am Ende noch einmal (einmal je Aufgabe)
    if (!slo.nochmal.has(a)) { slo.nochmal.add(a); slo.liste.push({ ...a, nochmal: true }); }
    slo.fehlerListe.push(a);
  }
  if (a.w) sloWortStaerke(a.w, r.ok ? 1 : -1);
  const lob = ['Pravilno!', 'Odlično!', 'Bravo!', 'Super!', 'Točno!'];
  $('sloFuss').className = 'slo-fuss ' + (r.ok ? 'gut' : 'schlecht');
  $('sloUrteil').innerHTML = '<div class="slo-urteil-kopf">' + sloDrache(r.ok ? 'jubel' : 'traurig') + '<b>' + (r.ok ? lob[Math.floor(Math.random() * lob.length)] + ' <small>(richtig!)</small>' : r.aufgegeben ? 'Tako se reče <small>(so sagt man das)</small>' : 'Ni čisto prav <small>(nicht ganz)</small>') + '</b></div>'
    + (r.loesung ? '<div class="slo-loesung">' + (r.ok || r.aufgegeben ? '' : 'Richtig: ') + r.loesung + (r.laut ? ' ' + sloLaut(r.laut) : '') + '</div>' : '')
    + (r.hinweis ? '<div class="slo-hinweis">' + r.hinweis + '</div>' : '')
    + (r.ok && slo.combo >= 3 && slo.combo % (slo.combo >= 10 ? 5 : 3) === 0 ? '<div class="slo-combo">🔥 ' + slo.combo + ' richtig in Folge!</div>' : '');
  $('sloUrteil').querySelectorAll('[data-sprich]').forEach((b) => b.addEventListener('click', () => sloSprich(b.dataset.sprich)));
  sloBereit(true, 'Weiter');
  $('sloAufgabe').querySelectorAll('button, input').forEach((b) => { if (!b.classList.contains('slo-laut')) b.disabled = true; });
  if (r.laut && (r.ok || r.aufgegeben)) sloSprich(r.laut);
  const kd = $('sloKopfDrache');
  if (kd) { kd.innerHTML = sloDrache(r.ok ? 'jubel' : 'traurig'); kd.className = 'slo-kopfdrache ' + (r.ok ? 'hops' : 'wackeln'); }
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
  $('slo-ende').innerHTML = '<div class="slo-ende-drache slo-ende-flug">' + sloDrache('jubel') + '</div>'
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
function sloOptionen(box, optionen, istRichtig, html, vorlesen) {
  box.querySelector('.slo-optionen').innerHTML = optionen.map((o, i) => '<button type="button" class="slo-opt" data-i="' + i + '">' + html(o) + '</button>').join('');
  box.querySelectorAll('.slo-opt').forEach((b) => b.addEventListener('click', () => {
    box.querySelectorAll('.slo-opt').forEach((x) => x.classList.toggle('gewaehlt', x === b));
    slo.antwort = optionen[Number(b.dataset.i)];
    if (vorlesen) sloSprich(vorlesen(slo.antwort));
    sloBereit(true);
  }));
  slo.pruefe = () => { if (!slo.antwort) return null; const ok = istRichtig(slo.antwort); box.querySelectorAll('.slo-opt').forEach((x) => { const o = optionen[Number(x.dataset.i)]; if (istRichtig(o)) x.classList.add('richtig'); else if (x.classList.contains('gewaehlt')) x.classList.add('falsch'); }); return { ok }; };
}
// Wort-Kacheln zum Satzbauen
function sloKacheln(box, ziel, vorrat, pruefen, vorlesen) {
  const gewaehlt = [];
  const kacheln = vorrat.map((t, i) => ({ t, i }));
  const zeichnen = () => {
    box.querySelector('.slo-zeile').innerHTML = gewaehlt.length ? gewaehlt.map((k, j) => '<button type="button" class="slo-kachel drin" data-j="' + j + '">' + sloEsc(k.t) + '</button>').join('') : '<span class="slo-leer">Tippe die Wörter in der richtigen Reihenfolge an</span>';
    box.querySelector('.slo-bank').innerHTML = kacheln.map((k) => '<button type="button" class="slo-kachel' + (gewaehlt.includes(k) ? ' weg' : '') + '" data-i="' + k.i + '">' + sloEsc(k.t) + '</button>').join('');
    box.querySelectorAll('.slo-zeile .slo-kachel').forEach((b) => b.addEventListener('click', () => { gewaehlt.splice(Number(b.dataset.j), 1); zeichnen(); }));
    box.querySelectorAll('.slo-bank .slo-kachel:not(.weg)').forEach((b) => b.addEventListener('click', () => { const k = kacheln[Number(b.dataset.i)]; gewaehlt.push(k); if (vorlesen) sloSprich(k.t); zeichnen(); }));
    sloBereit(gewaehlt.length > 0);
  };
  zeichnen();
  slo.pruefe = () => (gewaehlt.length ? pruefen(gewaehlt.map((k) => k.t).join(' ')) : null);
}
// ---------- Sprechen ----------
// Weg 1: Spracherkennung (wenn das Gerät Slowenisch erkennt). Weg 2: Aufnehmen und mit dem Original vergleichen – braucht nur ein Mikrofon.
const SLO_HART = ['language-not-supported', 'service-not-allowed', 'not-allowed', 'audio-capture'];
const SLO_GRUND = {
  'not-allowed': 'Kein Zugriff aufs Mikrofon für diese Seite.',
  'service-not-allowed': 'Das Gerät lässt die Spracherkennung nicht zu – auf dem iPhone meist, weil Slowenisch beim Diktieren nicht angeboten wird oder weil die App vom Home-Bildschirm aus läuft.',
  'language-not-supported': 'Slowenisch wird von der Spracherkennung dieses Geräts nicht unterstützt.',
  'audio-capture': 'Kein Mikrofon gefunden.', 'no-speech': 'Nichts gehört – noch einmal?', network: 'Die Spracherkennung braucht Internet.',
};
function sloSprechenErkennung(text) {
  const box = $('sloSprechBox');
  box.innerHTML = '<button type="button" class="slo-mikro" id="sloMikro"><span>🎙️</span><b>Tippen und sprechen</b></button><div class="slo-gehoert" id="sloGehoert"></div>';
  let bester = 0, gehoert = '';
  $('sloMikro').addEventListener('click', () => {
    const m = $('sloMikro');
    if (m.classList.contains('hoert')) return;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    let rec;
    try { rec = new SLO_SR(); slo.rec = rec; } catch (e) { sloAufAufnahme(text, 'Spracherkennung startet nicht.'); return; }
    rec.lang = 'sl-SI'; rec.interimResults = false; rec.maxAlternatives = 4;
    m.classList.add('hoert'); m.querySelector('b').textContent = 'Ich höre zu …';
    rec.onresult = (e) => {
      [...e.results[0]].map((x) => x.transcript).forEach((t) => { const q = sloSprachTreffer(t, text); if (q > bester || !gehoert) { bester = Math.max(bester, q); gehoert = t; } });
      $('sloGehoert').innerHTML = 'Verstanden: „' + sloEsc(gehoert) + '“';
      sloBereit(true);
      if (bester >= 0.6) sloPruefen();
    };
    rec.onerror = (e) => {
      const st = sloStore(); st.srFehler = { code: e.error, z: Date.now() }; saveJson(SLO_KEY, st);
      if (SLO_HART.includes(e.error)) { st.srKaputt = true; saveJson(SLO_KEY, st); sloAufAufnahme(text, SLO_GRUND[e.error] + ' Kein Problem: Wir nehmen dich stattdessen auf, und die App prüft, ob du den ganzen Satz gesprochen hast.'); return; }
      $('sloGehoert').textContent = e.error === 'aborted' ? '' : SLO_GRUND[e.error] || 'Das hat nicht geklappt (' + e.error + ').';
    };
    rec.onend = () => { if ($('sloMikro')) { m.classList.remove('hoert'); m.querySelector('b').textContent = 'Noch einmal sprechen'; } };
    try { rec.start(); } catch (e) { m.classList.remove('hoert'); }
  });
  slo.pruefe = () => (gehoert ? { ok: bester >= 0.6, loesung: sloEsc(text), laut: text, hinweis: 'Verstanden wurde: „' + sloEsc(gehoert) + '“ (' + Math.round(bester * 100) + ' % der Wörter)' } : null);
}
function sloAufAufnahme(text, hinweis) { sloSprechenAufnahme(text, hinweis); }
// Aufnehmen (bis 6 Sekunden), anhören, mit dem Original vergleichen, selbst einschätzen
let sloAufn = null;
function sloSprechenAufnahme(text, hinweis) {
  const box = $('sloSprechBox');
  if (!box) return;
  const geht = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  if (!geht) {
    box.innerHTML = '<div class="slo-gehoert">Dieses Gerät kann hier nicht aufnehmen. Sprich den Satz laut, hör dir das Original an und mach dann weiter.</div><button type="button" class="btn secondary" id="sloTrotzdem">Gesagt – weiter ›</button>';
    $('sloTrotzdem').addEventListener('click', () => sloBewerten({ ok: true, loesung: sloEsc(text), laut: text, hinweis: 'Ohne Mikrofon nicht geprüft.' }, slo.liste[slo.i]));
    return;
  }
  box.innerHTML = (hinweis ? '<div class="slo-gehoert">' + sloEsc(hinweis) + '</div>' : '')
    + '<button type="button" class="slo-mikro" id="sloAufnahme"><span>🎙️</span><b>Tippen und sprechen</b><small>Die Aufnahme stoppt, wenn du fertig bist</small></button>'
    + '<div class="slo-pegel" id="sloPegel" aria-hidden="true"><i></i></div><div class="slo-gehoert" id="sloAufUrteil"></div>';
  const knopf = $('sloAufnahme');
  let versuche = 0;
  knopf.addEventListener('click', async () => {
    if (sloAufn && sloAufn.rec && sloAufn.rec.state === 'recording') { sloAufn.rec.stop(); return; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    try {
      const strom = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const teile = [], rec = new MediaRecorder(strom);
      // Pegel live messen: Sprache erkennen und nach ~1,1 s Stille automatisch stoppen
      const ac = new (window.AudioContext || window.webkitAudioContext)(), quelle = ac.createMediaStreamSource(strom), an = ac.createAnalyser();
      an.fftSize = 1024; quelle.connect(an);
      const puffer = new Float32Array(an.fftSize), pegel = [], start = performance.now();
      let rausch = null, letzteSprache = 0, sprach = false;
      sloAufn = { rec, strom, ac };
      const messen = () => {
        if (rec.state !== 'recording') return;
        an.getFloatTimeDomainData(puffer);
        let s = 0; for (let i = 0; i < puffer.length; i++) s += puffer[i] * puffer[i];
        const rms = Math.sqrt(s / puffer.length), t = performance.now() - start;
        pegel.push({ t, rms });
        if (t < 250) rausch = rausch == null ? rms : Math.min(rausch, rms);
        const schwelle = Math.max(0.012, (rausch || 0.005) * 3.2);
        if (rms > schwelle) { sprach = true; letzteSprache = t; }
        if ($('sloPegel')) $('sloPegel').firstChild.style.width = Math.min(100, (rms / 0.15) * 100) + '%';
        if ((sprach && t - letzteSprache > 1100) || t > 8000) { rec.stop(); return; }
        requestAnimationFrame(messen);
      };
      rec.ondataavailable = (e) => { if (e.data && e.data.size) teile.push(e.data); };
      rec.onstop = () => {
        strom.getTracks().forEach((t) => t.stop());
        try { ac.close(); } catch (e) { /* egal */ }
        if (!$('sloAufnahme')) return;
        knopf.classList.remove('hoert'); knopf.querySelector('b').textContent = 'Noch einmal sprechen';
        if ($('sloPegel')) $('sloPegel').firstChild.style.width = '0';
        const url = URL.createObjectURL(new Blob(teile, { type: rec.mimeType || 'audio/mp4' }));
        const urteil = sloSprachUrteil(pegel, rausch, text);
        versuche++;
        if (urteil.ok) {
          sloBewerten({ ok: true, loesung: sloEsc(text), laut: text, hinweis: '🎙️ ' + urteil.text + ' <button type="button" class="slo-meine" data-url="' + url + '">▶️ Meine Aufnahme</button>' }, slo.liste[slo.i]);
        } else {
          $('sloAufUrteil').innerHTML = sloEsc(urteil.text) + (versuche >= 2 ? '<br><button type="button" class="btn secondary slo-ohne" id="sloTrotzdem">Trotzdem weiter ›</button>' : '');
          if ($('sloTrotzdem')) $('sloTrotzdem').addEventListener('click', () => sloBewerten({ ok: true, loesung: sloEsc(text), laut: text, hinweis: 'Ohne Prüfung weiter.' }, slo.liste[slo.i]));
        }
      };
      rec.start();
      requestAnimationFrame(messen);
      knopf.classList.add('hoert'); knopf.querySelector('b').textContent = 'Ich höre zu …';
      $('sloAufUrteil').textContent = '';
    } catch (e) {
      const st = sloStore(); st.micFehler = { code: e.name, z: Date.now() }; saveJson(SLO_KEY, st);
      box.innerHTML = '<div class="slo-gehoert">' + (e.name === 'NotAllowedError' ? 'Das Mikrofon ist für diese Seite nicht erlaubt (iPhone: Einstellungen › Safari › Mikrofon).' : 'Das Mikrofon lässt sich nicht öffnen (' + sloEsc(e.name || 'Fehler') + ').') + '</div><button type="button" class="btn secondary" id="sloTrotzdem">Gesagt – weiter ›</button>';
      $('sloTrotzdem').addEventListener('click', () => sloBewerten({ ok: true, loesung: sloEsc(text), laut: text, hinweis: 'Ohne Mikrofon nicht geprüft.' }, slo.liste[slo.i]));
    }
  });
}
// Ohne Spracherkennung prüft die App, ob überhaupt gesprochen wurde und ob Länge und Silben ungefähr zum Satz passen.
// Silben ≈ Vokale (das slowenische silbische r zählt mit); Silbenkerne ≈ Lautstärke-Gipfel in der Aufnahme.
function sloSilben(text) {
  const t = sloOhneZeichen(text);
  const vokale = (t.match(/[aeiou]/g) || []).length;
  const silbischesR = (t.match(/(^|[^aeiou\s])r(?=[^aeiou]|$)/g) || []).length;
  return Math.max(1, vokale + silbischesR);
}
function sloSprachUrteil(pegel, rausch, text) {
  if (pegel.length < 5) return { ok: false, text: 'Die Aufnahme war zu kurz – noch einmal?' };
  const schwelle = Math.max(0.012, (rausch || 0.005) * 3.2);
  const laut = pegel.filter((p) => p.rms > schwelle);
  if (!laut.length) return { ok: false, text: 'Ich habe nichts gehört. Sprich etwas lauter oder näher am Mikrofon.' };
  const dauer = (laut[laut.length - 1].t - laut[0].t) / 1000, sprechzeit = laut.length / pegel.length * (pegel[pegel.length - 1].t / 1000);
  // Gipfel zählen: geglätteter Pegel, Maximum über der Schwelle, mindestens 120 ms Abstand
  const glatt = pegel.map((p, i) => { const a = pegel.slice(Math.max(0, i - 2), i + 3); return { t: p.t, v: a.reduce((s, q) => s + q.rms, 0) / a.length }; });
  let gipfel = 0, letzter = -1e9;
  for (let i = 1; i < glatt.length - 1; i++) if (glatt[i].v > schwelle * 1.3 && glatt[i].v >= glatt[i - 1].v && glatt[i].v > glatt[i + 1].v && glatt[i].t - letzter > 120) { gipfel++; letzter = glatt[i].t; }
  const silben = sloSilben(text), erwartet = silben * 0.2;
  if (dauer < Math.max(0.25, erwartet * 0.35)) return { ok: false, text: 'Das war kürzer als der Satz – sprich ihn ganz.' };
  if (dauer > erwartet * 3.5 + 2) return { ok: false, text: 'Das war deutlich länger als der Satz – nur den Satz sprechen, dann kurz still sein.' };
  if (silben >= 4 && gipfel < silben * 0.3) return { ok: false, text: 'Ich habe weniger Silben gehört als der Satz hat – sprich ihn deutlich und ganz.' };
  return { ok: true, text: 'Gut gesprochen! (etwa ' + Math.min(silben, Math.max(1, gipfel)) + ' von ' + silben + ' Silben gehört)', dauer, gipfel, silben, sprechzeit };
}
// Mikrofon-Check: zeigt, was auf diesem Gerät geht
async function sloMikroCheck() {
  const st = sloStore(), standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const zeile = (ok, t, s) => '<li class="' + (ok === true ? 'gut' : ok === false ? 'schlecht' : '') + '"><b>' + (ok === true ? '✅' : ok === false ? '❌' : 'ℹ️') + ' ' + t + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</li>';
  let mic = null, micText = '';
  try { const s2 = await navigator.mediaDevices.getUserMedia({ audio: true }); s2.getTracks().forEach((t) => t.stop()); mic = true; micText = 'Aufnehmen und Vergleichen funktioniert.'; }
  catch (e) { mic = false; micText = e.name === 'NotAllowedError' ? 'Nicht erlaubt – iPhone: Einstellungen › Safari › Mikrofon (bzw. beim Nachfragen „Erlauben“ tippen).' : 'Fehler: ' + (e.name || e.message); }
  const html = '<h3>🩺 Mikrofon-Check</h3><ul class="slo-check">'
    + zeile(mic, 'Mikrofon', micText)
    + zeile(!!window.MediaRecorder, 'Aufnahme im Browser', window.MediaRecorder ? '' : 'Dieser Browser kann nicht aufnehmen.')
    + zeile(!!SLO_SR, 'Spracherkennung vorhanden', SLO_SR ? 'Ob sie Slowenisch kann, entscheidet das Gerät.' : 'Dieser Browser hat keine Spracherkennung.')
    + (st.srFehler ? zeile(false, 'Letzter Fehler der Spracherkennung: ' + sloEsc(st.srFehler.code), SLO_GRUND[st.srFehler.code] || '') : '')
    + zeile(null, standalone ? 'Läuft als App vom Home-Bildschirm' : 'Läuft im Browser', standalone ? 'iOS erlaubt hier oft keine Spracherkennung. Aufnehmen geht trotzdem.' : '')
    + '</ul><p class="slo-fein">Ohne Spracherkennung nimmt die App dich auf und prüft, ob du den ganzen Satz gesprochen hast (Länge und Silben). Die Aussprache selbst kann sie so nicht beurteilen. Die Aufnahme bleibt auf dem Gerät und wird nicht gespeichert.</p>'
    + '<div class="sk-knopfreihe">' + (st.srKaputt && SLO_SR ? '<button type="button" class="btn secondary" id="sloSrNochmal">Spracherkennung noch einmal versuchen</button>' : '') + '<button type="button" class="btn" id="sloCheckOk">Alles klar</button></div>';
  const d = typeof skDialog === 'function' ? skDialog(html) : null;
  if (!d) return;
  d.querySelector('#sloCheckOk').addEventListener('click', () => d.close());
  if (d.querySelector('#sloSrNochmal')) d.querySelector('#sloSrNochmal').addEventListener('click', () => { const s3 = sloStore(); delete s3.srKaputt; delete s3.sprechenAus; saveJson(SLO_KEY, s3); d.close(); sloStimmeSuchen(); });
}

const sloNichtHoeren = () => '<button type="button" class="slo-nicht oben" data-nicht="hoeren">🔇 Ich kann gerade nicht hören</button>';
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
    sloOptionen(box, opt, (o) => sloNorm(o.sl) === sloNorm(a.w.sl), (o) => sloEsc(o.sl), (o) => o.sl);
    const p = slo.pruefe; slo.pruefe = () => { const r = p(); return r && { ...r, loesung: sloEsc(a.w.de) + ' = ' + sloEsc(a.w.sl), laut: a.w.sl }; };
  },
  hoeren(a, box) {
    const opt = sloMisch([a.w, ...sloAndere(sloPool(a.w), a.w, 3, 'sl')]);
    box.innerHTML = sloNichtHoeren() + '<div class="slo-titel">Was hörst du?</div><div class="slo-hoer"><button type="button" class="slo-laut gross" data-sprich="' + sloEsc(a.w.sl) + '">🔊</button><button type="button" class="slo-laut langsam" data-sprich="' + sloEsc(a.w.sl) + '">🐢</button></div><div class="slo-optionen"></div>';
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
    }, nachSl && sloStimme && !sloAudio);
  },
  diktat(a, box) {
    const teile = sloTeile(a.s.sl), schon = new Set(teile.map(sloNorm)), passt = [a.s.sl].concat(a.s.slAlt).map(sloNorm);
    const pool = (slo.u ? slo.u.S : sloSatzPool()).filter((s) => s !== a.s).flatMap((s) => sloTeile(s.sl)).filter((t) => { const k = sloNorm(t); if (schon.has(k)) return false; schon.add(k); return true; });
    const vorrat = sloMisch(teile.concat(sloMisch(pool).slice(0, Math.max(2, Math.round(teile.length / 2)))));
    box.innerHTML = sloNichtHoeren() + '<div class="slo-titel">Tippe, was du hörst</div><div class="slo-hoer"><button type="button" class="slo-laut gross" data-sprich="' + sloEsc(a.s.sl) + '">🔊</button><button type="button" class="slo-laut langsam" data-sprich="' + sloEsc(a.s.sl) + '">🐢</button></div>'
      + '<div class="slo-zeile"></div><div class="slo-bank"></div>';
    sloKacheln(box, a.s.sl, vorrat, (txt) => ({ ok: passt.includes(sloNorm(txt)), loesung: sloEsc(a.s.sl) + ' = ' + sloEsc(a.s.de), laut: a.s.sl }));
    setTimeout(() => sloSprich(a.s.sl), 250);
  },
  sprechen(a, box) {
    const text = a.s ? a.s.sl : a.w.sl, de = a.s ? a.s.de : a.w.de;
    const st0 = sloStore(), mitErkennung = !!SLO_SR && !st0.srKaputt;
    box.innerHTML = '<div class="slo-titel">Sprich nach</div><div class="slo-frage satz">' + (a.w ? a.w.e + ' ' : '') + '„' + sloEsc(text) + '“ ' + sloLaut(text) + '</div><div class="slo-uebersetzung">' + sloEsc(de) + '</div>'
      + '<div id="sloSprechBox"></div><button type="button" class="slo-nicht" id="sloNicht">🙊 Ich kann gerade nicht sprechen</button>';
    $('sloNicht').addEventListener('click', () => sloUeberspringen(['sprechen'], '🙊 Sprech-Aufgaben sind für eine Stunde aus.', 'sprechenAus', 1));
    slo.pruefe = () => null;
    if (mitErkennung) sloSprechenErkennung(text); else sloSprechenAufnahme(text);
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
    sloOptionen(box, opt, (o) => sloNorm(o) === sloNorm(loch), (o) => sloEsc(o), (o) => o);
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
$('sloWeissNicht').addEventListener('click', sloWeissNicht);
$('sloUrteil').addEventListener('click', (e) => { const b = e.target.closest('.slo-meine'); if (b) new Audio(b.dataset.url).play().catch(() => {}); });
$('sloAufgabe').addEventListener('click', (e) => { if (e.target.closest('[data-nicht="hoeren"]')) sloUeberspringen(['hoeren', 'diktat'], '🔇 Hör-Aufgaben sind für eine Stunde aus.', 'hoerenAus', 1); });
$('sloAbbruch').addEventListener('click', () => { if (!slo || slo.i === 0 || confirm('Lektion abbrechen? Der Fortschritt dieser Lektion geht verloren.')) sloKarte(); });
$('sloUeben').addEventListener('click', () => sloStart(null, 'ueben'));
$('sloWoerterBtn').addEventListener('click', sloWoerter);
$('sloZurueck').addEventListener('click', () => { if (!$('slo-karte').hidden) { if ('speechSynthesis' in window) speechSynthesis.cancel(); zeigeHub(); } else if (!slo || slo.i === 0 || confirm('Lektion abbrechen?')) sloKarte(); });
$('hubSlo').addEventListener('click', () => { merkeZuletzt('slo'); zoomZu($('hubSlo'), () => { show('slo', '🐉 Slowenisch'); sloKarte(); }); });
