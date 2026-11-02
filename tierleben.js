// 🐾 Ein Tierleben: Wie lebt ein Tier, das für uns geboren wird – oder eines, das wir gerade ausrotten?
// Nutztiere: Zufall nach den echten Schlachtzahlen in Deutschland 2025 (Destatis). Lebensdauer nach dem Bundesinformationszentrum
// Landwirtschaft, Haltungsregeln nach der Tierschutz-Nutztierhaltungsverordnung. Bedrohte Arten: Bestände nach NARWC, IUCN, WWF.
// Die Fakten sind belegt; Entscheidungen und Glück in den Wildtier-Leben sind Spielregeln, keine Statistik – das steht auch so im Spiel.
const TL_KEY = 'walquiz.tierleben.v1';
const TL_Q = {
  destatis: 'Destatis, Pressemitteilung Nr. 049 vom 13. Februar 2026 (Schlachtungen 2025)',
  bzl: 'Bundesinformationszentrum Landwirtschaft (landwirtschaft.de): „Wie lange leben Rind, Schwein, Schaf und Huhn?“',
  tierschnutztv: 'Tierschutz-Nutztierhaltungsverordnung (TierSchNutztV), §§ 19 und 29',
  eier: 'Destatis: 44,6 Millionen Legehennen legten im August 2025 rund 1,2 Milliarden Eier',
  kueken: 'Tierschutzgesetz § 4c: Töten von Hühnerküken aus Legelinien seit 1. Januar 2022 verboten',
  narwc: 'North Atlantic Right Whale Consortium, Report Card 2025: Bestand 2024 = 384 (+10/−9) Tiere, darunter 11 Kälber',
  noaa: 'NOAA Fisheries: Hauptursachen für Todesfälle sind Schiffskollisionen und Verfangen in Fanggeräten',
  vaquita: 'IUCN SSC Cetacean Specialist Group, Survey report for vaquita research 2024: Mindestschätzung 6–8 Tiere',
  orang: 'WWF-Artenlexikon Sumatra-Orang-Utan: Bestand 2017 auf rund 13.846 Tiere geschätzt; Geburtenabstand ~9 Jahre (Wich et al. 2004)',
  schweinswal: 'WWF / Deutsche Umwelthilfe: In der zentralen Ostsee leben nur noch rund 500 Schweinswale; Hauptgefahr Stellnetze',
  hai: 'IUCN Rote Liste (2019): Weißspitzen-Hochseehai „vom Aussterben bedroht“, Bestand um über 80 % eingebrochen',
};

// ---------- Nutztiere: Anzahl geschlachteter Tiere in Deutschland 2025 (Millionen, Destatis) ----------
const TL_NUTZ = [
  { id: 'masthuhn', emoji: '🐔', plural: 'Masthühner', name: 'Masthuhn', mio: 640.3, farbe: '#f59e0b' },
  { id: 'schwein', emoji: '🐖', plural: 'Schweine', name: 'Mastschwein', mio: 44.9, farbe: '#f472b6' },
  { id: 'pute', emoji: '🦃', plural: 'Puten', name: 'Pute', mio: 27.6, farbe: '#a78bfa' },
  { id: 'legehenne', emoji: '🥚', plural: 'Legehennen (als Suppenhühner)', name: 'Legehenne', mio: 20.7, farbe: '#fde68a' },
  { id: 'ente', emoji: '🦆', plural: 'Enten', name: 'Ente', mio: 8.3, farbe: '#34d399' },
  { id: 'rind', emoji: '🐄', plural: 'Rinder', name: 'Rind', mio: 2.8, farbe: '#60a5fa' },
];
const TL_SUMME = TL_NUTZ.reduce((s, t) => s + t.mio, 0);   // 744,6 Mio. pro Jahr
const TL_PRO_SEK = TL_SUMME * 1e6 / (365 * 86400);

// Leben: kapitel = [{ zeit, titel, text, wahl?: { frage, optionen: [[Text, Antwort]] }, quelle }]
const TL_LEBEN = {
  masthuhn: { emoji: '🐔', name: 'Masthuhn', tage: 42, natur: 4 * 365, naturText: '3 bis 5 Jahre, manche bis 7', quelle: [TL_Q.bzl, TL_Q.tierschnutztv, TL_Q.destatis],
    kapitel: [
      { zeit: 'Tag 1', titel: 'Geschlüpft im Brutschrank', text: 'Du schlüpfst in einer Brüterei, zusammen mit Zehntausenden Geschwistern. Eine Mutter lernst du nie kennen. Noch am selben Tag geht es in den Maststall.' },
      { zeit: 'Woche 1', titel: 'Wachsen, wachsen, wachsen', text: 'Moderne Masthühner sind auf schnelles Wachstum gezüchtet: von rund 40 Gramm beim Schlupf auf etwa 2 Kilogramm in wenigen Wochen.',
        wahl: { frage: 'Du möchtest im Sand scharren und dich sonnen. Was tust du?', optionen: [['Nach draußen gehen', 'In konventioneller Haltung gibt es kein Draußen. Auslauf ist nur in höheren Haltungsformen und im Bio-Bereich vorgeschrieben.'], ['Im Stall eine ruhige Ecke suchen', 'Ruhige Ecken werden knapp, je größer du wirst.']] } },
      { zeit: 'Woche 4', titel: 'Es wird eng', text: 'Erlaubt sind in Deutschland bis zu <b>39 kg Tier pro Quadratmeter</b>. Bei 2 kg pro Huhn sind das fast <b>20 Hühner auf einem Quadratmeter</b> – etwa die Fläche einer Duschwanne.', quelle: TL_Q.tierschnutztv,
        wahl: { frage: 'Deine Beine tun weh vom schnellen Wachsen. Was tust du?', optionen: [['Mehr liegen', 'Viele Masthühner liegen in den letzten Wochen viel – ihr Körper wächst schneller als Beine und Herz mithalten.'], ['Trotzdem herumlaufen', 'Mit jedem Tag wird das schwerer.']] } },
      { zeit: 'Woche 6', titel: 'Schlachtreif', text: 'Masthühner sind mit <b>5 bis 7 Wochen</b> schlachtreif. Dein Leben endet hier – du bist noch ein Küken mit dem Körper eines erwachsenen Huhns.', quelle: TL_Q.bzl },
    ],
    fazit: '2025 wurden in Deutschland <b>640,3 Millionen</b> Masthühner geschlachtet – 86 % aller geschlachteten Tiere.' },
  legehenne: { emoji: '🥚', name: 'Legehenne', tage: 16 * 30.4, natur: 4 * 365, naturText: '3 bis 5 Jahre, manche bis 7', quelle: [TL_Q.bzl, TL_Q.eier, TL_Q.kueken, TL_Q.destatis],
    kapitel: [
      { zeit: 'Tag 1', titel: 'Eine Henne aus einer Legelinie', text: 'Du stammst aus einer Zuchtlinie, die auf möglichst viele Eier gezüchtet ist. Deine Brüder setzen kaum Fleisch an. Früher wurden sie direkt nach dem Schlupf getötet – das ist in Deutschland seit 2022 verboten. Heute wird das Geschlecht oft schon im Ei bestimmt, oder die Brüder werden aufgezogen.', quelle: TL_Q.kueken },
      { zeit: 'Monat 5', titel: 'Das erste Ei', text: 'Mit etwa fünf Monaten legst du dein erstes Ei. Danach fast jeden Tag eines: In Deutschland legt eine Henne rund <b>27 Eier im Monat</b>.', quelle: TL_Q.eier,
        wahl: { frage: 'Du möchtest ein Nest bauen und brüten. Was tust du?', optionen: [['Auf dem Ei sitzen bleiben', 'Die Eier rollen weg oder werden eingesammelt – brüten ist nicht vorgesehen.'], ['Weiterlegen', 'Das Bankivahuhn, die Wildform des Haushuhns, legt nur etwa 10 bis 20 Eier im Jahr. Du legst über 300.']] } },
      { zeit: 'Monat 12', titel: 'Erschöpft', text: 'Jedes Ei kostet Kalzium aus deinen Knochen. Nach einem Jahr Hochleistung lässt die Legeleistung nach.' },
      { zeit: 'Monat 16', titel: 'Suppenhuhn', text: 'Mit etwa <b>16 Monaten</b> werden Legehennen geschlachtet und als Suppenhühner verkauft – 2025 waren das in Deutschland <b>20,7 Millionen</b>.', quelle: TL_Q.bzl },
    ],
    fazit: 'Rund 44,6 Millionen Legehennen leben gleichzeitig in Deutschland – mehr als halb so viele, wie Menschen hier leben.' },
  schwein: { emoji: '🐖', name: 'Mastschwein', tage: 6.5 * 30.4, natur: 9 * 365, naturText: '8 bis 10 Jahre', quelle: [TL_Q.bzl, TL_Q.tierschnutztv, TL_Q.destatis],
    kapitel: [
      { zeit: 'Tag 1', titel: 'Ferkel', text: 'Du kommst mit vielen Geschwistern zur Welt. Deine Mutter ist eine Zuchtsau – sie wird selbst nur 3 bis 4 Jahre alt.', quelle: TL_Q.bzl },
      { zeit: 'Woche 4', titel: 'Getrennt', text: 'Nach wenigen Wochen kommst du von deiner Mutter weg in die Aufzucht, danach in die Mast.',
        wahl: { frage: 'Schweine sind neugierig und wühlen gern in der Erde. Was tust du?', optionen: [['Im Boden wühlen', 'In den meisten Ställen gibt es Spaltenboden aus Beton, damit der Kot durchfällt – Erde gibt es nicht.'], ['Mit den anderen spielen', 'Spielen geht – solange Platz ist.']] } },
      { zeit: 'Monat 4', titel: 'Dreiviertel Quadratmeter', text: 'Ab 50 kg schreibt das Gesetz mindestens <b>0,75 m²</b> pro Schwein vor – etwa so viel wie ein Esstisch für zwei. Du wiegst bald über 100 kg.', quelle: TL_Q.tierschnutztv,
        wahl: { frage: 'Dir ist langweilig und die anderen drängeln. Was tust du?', optionen: [['Mich zurückziehen', 'Rückzugsorte sind auf dieser Fläche kaum möglich.'], ['Am Ohr eines anderen knabbern', 'Langeweile und Enge führen zu Verhaltensstörungen wie Schwanzbeißen – deshalb werden vielen Ferkeln bis heute die Schwänze gekürzt, obwohl das routinemäßig nicht erlaubt ist.']] } },
      { zeit: 'Monat 6–7', titel: 'Schlachtreif', text: 'Mastschweine werden mit <b>sechs bis sieben Monaten</b> geschlachtet. Möglich wären 8 bis 10 Jahre.', quelle: TL_Q.bzl },
    ],
    fazit: '2025 wurden in Deutschland <b>44,9 Millionen</b> Schweine geschlachtet – über 120.000 an jedem Tag.' },
  pute: { emoji: '🦃', name: 'Pute', tage: 19 * 7, natur: null, naturText: 'mehrere Jahre', quelle: [TL_Q.bzl, TL_Q.destatis],
    kapitel: [
      { zeit: 'Tag 1', titel: 'Küken in der Halle', text: 'Du schlüpfst in der Brüterei und kommst in eine große Halle mit Tausenden anderen Puten.' },
      { zeit: 'Woche 8', titel: 'Schwer und schwerer', text: 'Mastputen sind auf viel Brustfleisch gezüchtet. Der schwere Körper belastet Beine und Gelenke.',
        wahl: { frage: 'Puten sind in der Natur neugierig und laufen weite Strecken. Was tust du?', optionen: [['Erkunden', 'Die Halle ist dein ganzes Leben lang dieselbe.'], ['Ausruhen', 'Je schwerer du wirst, desto mehr liegst du.']] } },
      { zeit: 'Woche 16–22', titel: 'Schlachtreif', text: 'Puten werden mit <b>16 bis 22 Wochen</b> geschlachtet.', quelle: TL_Q.bzl },
    ],
    fazit: '2025 wurden in Deutschland <b>27,6 Millionen</b> Puten geschlachtet.' },
  ente: { emoji: '🦆', name: 'Ente', tage: 8.5 * 7, natur: null, naturText: 'mehrere Jahre', quelle: [TL_Q.bzl, TL_Q.destatis],
    kapitel: [
      { zeit: 'Tag 1', titel: 'Küken', text: 'Du schlüpfst in einer Brüterei. Enten sind Wasservögel – sie baden, gründeln und putzen ihr Gefieder mit Wasser.' },
      { zeit: 'Woche 3', titel: 'Wasser?', text: '',
        wahl: { frage: 'Du möchtest schwimmen und dein Gefieder im Wasser putzen. Was tust du?', optionen: [['Wasser suchen', 'In vielen Mastbetrieben gibt es nur Tränken, keine Badestellen.'], ['An der Tränke den Kopf eintauchen', 'Das ist oft das einzige Wasser, das du bekommst.']] } },
      { zeit: 'Woche 7–10', titel: 'Schlachtreif', text: 'Enten werden mit <b>7 bis 10 Wochen</b> geschlachtet.', quelle: TL_Q.bzl },
    ],
    fazit: '2025 wurden in Deutschland <b>8,3 Millionen</b> Enten geschlachtet.' },
  milchkuh: { emoji: '🐄', name: 'Milchkuh', tage: 5.5 * 365, natur: 20 * 365, naturText: 'bis zu 25 Jahre', quelle: [TL_Q.bzl, TL_Q.destatis],
    kapitel: [
      { zeit: 'Tag 1', titel: 'Ein Kalb', text: 'Du bist ein weibliches Kalb einer Milchkuh. In der Milchviehhaltung werden Kälber in der Regel kurz nach der Geburt von der Mutter getrennt – die Milch ist für den Verkauf bestimmt.',
        wahl: { frage: 'Du rufst nach deiner Mutter. Was passiert?', optionen: [['Weiter rufen', 'Kühe und Kälber rufen oft noch tagelang nacheinander.'], ['Zum Tränkeeimer gehen', 'Du bekommst Milch oder Milchaustauscher aus Eimer oder Nuckel.']] } },
      { zeit: 'Jahr 2', titel: 'Selbst Mutter', text: 'Eine Kuh gibt nur Milch, wenn sie ein Kalb bekommen hat. Mit gut zwei Jahren wirst du besamt und bekommst dein erstes Kalb. Danach etwa jedes Jahr wieder.' },
      { zeit: 'Jahr 3–5', titel: 'Hochleistung', text: 'Heutige Milchkühe geben ein Vielfaches dessen, was ein Kalb trinken würde. Euterentzündungen, Klauen- und Fruchtbarkeitsprobleme gehören zu den häufigsten Gründen, warum Kühe aus der Herde gehen.',
        wahl: { frage: 'Du möchtest auf die Weide. Was passiert?', optionen: [['Auf die Weide', 'Manche Betriebe haben Weidegang – viele Kühe in Deutschland stehen aber ganzjährig im Stall.'], ['Im Stall bleiben', 'Der Stall ist für die meisten Milchkühe das ganze Leben.']] } },
      { zeit: 'Jahr 5,5', titel: 'Abgang', text: 'Milchkühe werden im Durchschnitt nur <b>5,5 Jahre</b> alt, dann geht es zum Schlachthof. Möglich wären bis zu 25 Jahre.', quelle: TL_Q.bzl },
    ],
    fazit: '2025 wurden in Deutschland <b>2,8 Millionen</b> Rinder geschlachtet.' },
  mastbulle: { emoji: '🐂', name: 'Mastbulle', tage: 19.5 * 30.4, natur: 20 * 365, naturText: 'bis zu 25 Jahre', quelle: [TL_Q.bzl, TL_Q.destatis],
    kapitel: [
      { zeit: 'Tag 1', titel: 'Ein Bullenkalb', text: 'Du bist das männliche Kalb einer Milchkuh. Milch wirst du nie geben – für den Milchbetrieb bist du ein Nebenprodukt. Du wirst von der Mutter getrennt und nach einigen Wochen an einen Mastbetrieb verkauft.' },
      { zeit: 'Monat 6', titel: 'In der Bullenmast', text: 'Mastbullen stehen oft in Buchten auf Spaltenboden, gefüttert für schnelles Wachstum.',
        wahl: { frage: 'Du hast Kraft und willst rennen. Was tust du?', optionen: [['Losrennen', 'Dafür ist in der Bucht kein Platz.'], ['Mit den anderen rangeln', 'Rangeln ja – Auslauf meistens nicht.']] } },
      { zeit: 'Monat 18–21', titel: 'Schlachtreif', text: 'Mastbullen sind mit etwa <b>18 bis 21 Monaten</b> schlachtreif. Möglich wären bis zu 25 Jahre.', quelle: TL_Q.bzl },
    ],
    fazit: '2025 wurden in Deutschland <b>2,8 Millionen</b> Rinder geschlachtet.' },
};

// ---------- Bedrohte Arten ----------
// risiko: Spielregel-Wahrscheinlichkeit, dass das Kapitel tödlich endet; gut/schlecht je nach Entscheidung
const TL_WILD = {
  glattwal: { emoji: '🐋', name: 'Nordatlantischer Glattwal', bestand: '384', bestandText: 'Tiere gibt es noch (2024)', alter: 70, quelle: [TL_Q.narwc, TL_Q.noaa],
    kapitel: [
      { zeit: 'Jahr 0', titel: 'Geboren vor Florida', text: 'Du kommst im Winter vor der Küste von Georgia und Florida zur Welt. 2024 gab es nur <b>11 Kälber</b> wie dich.', quelle: TL_Q.narwc },
      { zeit: 'Jahr 1', titel: 'Die Wanderung nach Norden', text: 'Mit deiner Mutter schwimmst du die Ostküste hinauf – mitten durch einige der meistbefahrenen Schifffahrtswege der Welt.',
        wahl: { frage: 'Ein großes Schiff kommt näher. Was tust du?', optionen: [['Abtauchen', 'Glattwale schwimmen langsam und oft knapp unter der Oberfläche – Abtauchen klappt nicht immer.', 0.12], ['Weiterschwimmen wie immer', 'Schiffskollisionen gehören zu den häufigsten Todesursachen deiner Art.', 0.3]] },
        tod: 'Ein Frachtschiff hat dich gerammt.' },
      { zeit: 'Jahr 10', titel: 'Fressgründe in Kanada', text: 'Im Sankt-Lorenz-Golf findest du viel Nahrung. Doch hier stehen auch Tausende Leinen von Krabbenfallen im Wasser.',
        wahl: { frage: 'Zwischen den Bojen ist besonders viel Plankton. Was tust du?', optionen: [['Lieber woanders fressen', 'Klug – aber Leinen sind fast überall.', 0.12], ['Zwischen den Leinen fressen', 'Wer sich in Fischereileinen verfängt, schleppt sie oft monatelang mit sich.', 0.35]] },
        tod: 'Du hast dich in Fischereileinen verfangen und bist erschöpft gestorben.' },
      { zeit: 'Jahr 30', titel: 'Alt werden', text: 'Glattwale können über <b>70 Jahre</b> alt werden – wenn sie Schiffen und Netzen entkommen.', ende: true },
    ],
    hebel: 'Tempolimits für Schiffe in Walgebieten und Fanggeräte ohne Leinen („ropeless fishing“) könnten die wichtigsten Todesursachen fast ganz verhindern.' },
  vaquita: { emoji: '🐬', name: 'Vaquita (Kalifornischer Schweinswal)', bestand: '6–8', bestandText: 'Tiere gibt es mindestens noch (2024)', alter: 20, quelle: [TL_Q.vaquita],
    kapitel: [
      { zeit: 'Jahr 0', titel: 'Der kleinste Wal der Welt', text: 'Du bist nur etwa anderthalb Meter lang und lebst ausschließlich im nördlichsten Zipfel des Golfs von Kalifornien.' },
      { zeit: 'Jahr 2', titel: 'Die Netze der Wilderer', text: 'Hier werden illegal Stellnetze für den Totoaba-Fisch ausgelegt – dessen Schwimmblase wird teuer nach Asien verkauft. Für dich sind die Netze unsichtbar.',
        wahl: { frage: 'Du hörst Fische in der Nähe eines Netzes. Was tust du?', optionen: [['Abstand halten', 'Gute Entscheidung – aber Netze treiben auch dorthin, wo du sie nicht erwartest.', 0.25], ['Jagen', 'Vaquitas verfangen sich in den Maschen und ertrinken.', 0.55]] },
        tod: 'Du hast dich in einem Stellnetz verfangen und bist ertrunken.' },
      { zeit: 'Jahr 5', titel: 'Einen Partner finden', text: 'Bei nur noch einer Handvoll Artgenossen ist schon das Finden eines Partners fast unmöglich.',
        wahl: { frage: 'Du suchst nach anderen Vaquitas. Wo?', optionen: [['Im Schutzgebiet', 'Im Schutzgebiet ist die Gefahr kleiner – aber nicht null.', 0.15], ['Überall', 'Außerhalb des Schutzgebiets stehen noch mehr Netze.', 0.4]] },
        tod: 'Ein weiteres Netz wurde dir zum Verhängnis.' },
      { zeit: 'Jahr 15', titel: 'Überlebt', text: 'Du hast überlebt. Doch ob deine Art überlebt, hängt allein davon ab, ob die Netze verschwinden.', ende: true },
    ],
    hebel: 'Mexiko hat Stellnetze im Lebensraum verboten. Entscheidend ist, dass das Verbot durchgesetzt wird und der illegale Handel mit Totoaba-Schwimmblasen endet.' },
  orang: { emoji: '🦧', name: 'Sumatra-Orang-Utan', bestand: '≈ 13.800', bestandText: 'Tiere gab es 2017 noch', alter: 50, quelle: [TL_Q.orang],
    kapitel: [
      { zeit: 'Jahr 0', titel: 'Im Regenwald', text: 'Du wirst hoch in den Bäumen Sumatras geboren. Deine Mutter bekommt nur etwa alle <b>9 Jahre</b> ein Junges – so lange bringt sie dir alles bei.', quelle: TL_Q.orang },
      { zeit: 'Jahr 6', titel: 'Der Wald schrumpft', text: 'Am Rand eures Waldes wird gerodet. Hier sollen Ölpalmen wachsen – Palmöl steckt in vielen Lebensmitteln, Kosmetik und Reinigungsmitteln.',
        wahl: { frage: 'Im neuen Plantagenrand gibt es leckere Palmfrüchte. Was tust du?', optionen: [['Im Wald bleiben', 'Gute Idee – aber der Wald wird jedes Jahr kleiner.', 0.15], ['In die Plantage gehen', 'Orang-Utans in Plantagen gelten als Schädlinge und werden vertrieben oder getötet.', 0.4]] },
        tod: 'Du wurdest am Plantagenrand getötet.' },
      { zeit: 'Jahr 15', titel: 'Feuer', text: 'Um Flächen zu roden, werden Wälder angezündet. In trockenen Jahren brennen riesige Gebiete.',
        wahl: { frage: 'Rauch zieht durch den Wald. Was tust du?', optionen: [['Tief in den Wald fliehen', 'Du findest ein Stück Wald, das stehen bleibt.', 0.12], ['Abwarten', 'Das Feuer kommt näher als gedacht.', 0.35]] },
        tod: 'Dein Wald ist abgebrannt.' },
      { zeit: 'Jahr 30', titel: 'Alt werden', text: 'Orang-Utans können in Freiheit über 50 Jahre alt werden – wenn ihnen Wald bleibt.', ende: true },
    ],
    hebel: 'Entwaldungsfreie Lieferketten (die EU hat dazu eine Verordnung beschlossen), weniger Palmöl in Produkten und geschützte Wälder.' },
  schweinswal: { emoji: '🐬', name: 'Schweinswal der zentralen Ostsee', bestand: '≈ 500', bestandText: 'Tiere gibt es noch', alter: 20, quelle: [TL_Q.schweinswal],
    kapitel: [
      { zeit: 'Jahr 0', titel: 'Deutschlands einziger Wal', text: 'Der Schweinswal ist der einzige Wal, der in deutschen Gewässern heimisch ist. In der zentralen Ostsee bist du einer von nur noch rund 500.' },
      { zeit: 'Jahr 2', titel: 'Stellnetze', text: 'Auch in Schutzgebieten stehen Stellnetze. Für dein Echolot sind die dünnen Maschen kaum zu erkennen.',
        wahl: { frage: 'Hinter einem Netz schwimmen Heringe. Was tust du?', optionen: [['Umweg schwimmen', 'Klug – doch die Ostsee ist voller Netze.', 0.18], ['Direkt hin', 'Beifang in Stellnetzen ist die größte Gefahr für deine Population.', 0.45]] },
        tod: 'Du bist als Beifang in einem Stellnetz ertrunken.' },
      { zeit: 'Jahr 6', titel: 'Lärm', text: 'Schiffsverkehr, Bauarbeiten im Meer und Sprengungen alter Munition sind laut – Schweinswale orientieren sich mit Schall.',
        wahl: { frage: 'Ein ohrenbetäubender Knall. Was tust du?', optionen: [['Weit wegschwimmen', 'Gut – Lärm kann das Gehör dauerhaft schädigen.', 0.1], ['In der Bucht bleiben', 'Mit geschädigtem Gehör findest du kaum noch Futter.', 0.3]] },
        tod: 'Taub geworden, hast du nicht mehr genug Nahrung gefunden.' },
      { zeit: 'Jahr 12', titel: 'Überlebt', text: 'Du hast überlebt – ein seltenes Glück für deine kleine Population.', ende: true },
    ],
    hebel: 'Stellnetzverbote in Schutzgebieten, alternative Fanggeräte und leisere Bauverfahren im Meer.' },
  hai: { emoji: '🦈', name: 'Weißspitzen-Hochseehai', bestand: '> 80 %', bestandText: 'Rückgang des Bestands', alter: 25, quelle: [TL_Q.hai],
    kapitel: [
      { zeit: 'Jahr 0', titel: 'Auf hoher See', text: 'Du lebst im offenen Ozean, weit weg von jeder Küste. Früher war deine Art einer der häufigsten Haie der Welt.' },
      { zeit: 'Jahr 3', titel: 'Langleinen', text: 'Fischereiflotten legen kilometerlange Leinen mit Tausenden Haken für Thunfisch aus. Haie beißen mit an.',
        wahl: { frage: 'An einer Leine hängt ein toter Fisch. Was tust du?', optionen: [['Vorbeischwimmen', 'Klug – aber Hunger ist auf hoher See ein ständiger Begleiter.', 0.18], ['Zubeißen', 'Viele Haie werden als Beifang gefangen; ihre Flossen sind auf dem Weltmarkt begehrt.', 0.45]] },
        tod: 'Du bist an einem Haken hängen geblieben.' },
      { zeit: 'Jahr 8', titel: 'Erwachsen', text: 'Haie werden spät geschlechtsreif und bekommen nur wenige Junge. Darum erholen sich ihre Bestände so langsam.',
        wahl: { frage: 'Ein Fischtrawler zieht ein Netz. Was tust du?', optionen: [['Abstand halten', 'Gute Wahl.', 0.12], ['Neugierig näher', 'Weißspitzen-Hochseehaie sind neugierig – das wird ihnen oft zum Verhängnis.', 0.35]] },
        tod: 'Du wurdest gefangen; deine Flossen landeten auf dem Markt.' },
      { zeit: 'Jahr 20', titel: 'Alt werden', text: 'Du hast überlebt. Deine Art braucht Jahrzehnte, um sich zu erholen.', ende: true },
    ],
    hebel: 'In der EU müssen Haie seit 2013 mit anhaftenden Flossen angelandet werden. Internationale Fangverbote und Handelskontrollen (CITES) sind der wichtigste Schutz.' },
};

// ---------- Spielablauf ----------
let tl = null;
let tlZaehler = null, tlStart = Date.now();
const tlTeile = ['intro', 'los', 'leben', 'ende'];
const zeigeTlTeil = (t) => tlTeile.forEach((x) => { $('tl-' + x).hidden = x !== t; });
const tlStore = () => loadJson(TL_KEY);
const tlTageText = (t) => (t < 70 ? Math.round(t) + ' Tage' : t < 730 ? Math.round(t / 30.4) + ' Monate' : fmt((t / 365).toFixed(1)) + ' Jahre');

function tierlebenIntro() {
  tl = null;
  zeigeTlTeil('intro');
  // Live-Zähler: rechnerisch aus den Schlachtzahlen 2025
  tlStart = Date.now();
  clearInterval(tlZaehler);
  const tick = () => { if (!$('screen-tierleben').classList.contains('active')) { clearInterval(tlZaehler); return; } $('tlZaehler').textContent = zlZahlTl((Date.now() - tlStart) / 1000 * TL_PRO_SEK); };
  tick(); tlZaehler = setInterval(tick, 250);
  $('tlWild').innerHTML = Object.entries(TL_WILD).map(([id, w]) => '<button type="button" class="tl-art" data-id="' + id + '"><span>' + w.emoji + '</span><b>' + w.name + '</b><small>' + w.bestand + ' ' + w.bestandText + '</small></button>').join('');
  $('tlWild').querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => tlLebenStart(b.dataset.id, true)));
  const st = tlStore(), l = st.leben || [];
  $('tlLogbuch').hidden = !l.length;
  if (l.length) {
    const nutz = l.filter((x) => !x.wild && x.natur);
    $('tlLogbuchText').innerHTML = '<b>' + l.length + '</b> ' + (l.length === 1 ? 'Leben' : 'Leben') + ' gelebt'
      + (nutz.length ? ' · Nutztiere erreichten im Schnitt <b>' + Math.round(nutz.reduce((s, x) => s + x.tage / x.natur, 0) / nutz.length * 100) + ' %</b> ihrer möglichen Lebenszeit' : '');
    $('tlLogbuchListe').innerHTML = l.slice(-12).reverse().map((x) => '<span class="' + (x.wild ? (x.ueberlebt ? 'gut' : 'tot') : '') + '" title="' + x.name + '">' + x.emoji + '</span>').join('');
  }
}
const zlZahlTl = (n) => Math.floor(n).toLocaleString('de-DE');

// Nutztier-Lotterie: gewichtet nach Schlachtzahlen
function tlLotterie() {
  zeigeTlTeil('los');
  const r = Math.random() * TL_SUMME;
  let acc = 0, wahl = TL_NUTZ[0];
  for (const t of TL_NUTZ) { acc += t.mio; if (r < acc) { wahl = t; break; } }
  $('tlLosBalken').innerHTML = TL_NUTZ.map((t) => '<i style="flex:' + t.mio + ';background:' + t.farbe + '" title="' + t.name + '"></i>').join('') + '<b class="tl-zeiger" id="tlZeiger"></b>';
  $('tlLosLegende').innerHTML = TL_NUTZ.map((t) => '<span><i style="background:' + t.farbe + '"></i>' + t.emoji + ' ' + t.name + ' ' + fmt(Math.round(t.mio / TL_SUMME * 1000) / 10) + ' %</span>').join('');
  $('tlLosErgebnis').hidden = true;
  const ziel = (acc - wahl.mio + Math.random() * wahl.mio) / TL_SUMME * 100;
  const z = $('tlZeiger');
  z.style.left = '0%';
  requestAnimationFrame(() => requestAnimationFrame(() => { z.style.left = ziel + '%'; }));
  setTimeout(() => {
    const id = wahl.id === 'rind' ? (Math.random() < 0.5 ? 'milchkuh' : 'mastbulle') : wahl.id;
    const anteil = Math.round(wahl.mio / TL_SUMME * 1000) / 10;
    $('tlLosErgebnis').hidden = false;
    $('tlLosErgebnis').innerHTML = '<div class="tl-los-emoji">' + TL_LEBEN[id].emoji + '</div><h3>Du bist ' + (id === 'ente' || id === 'pute' || id === 'legehenne' || id === 'milchkuh' ? 'eine ' : 'ein ') + TL_LEBEN[id].name + '.</h3>'
      + '<p>' + fmt(anteil) + ' % aller Tiere, die 2025 in Deutschland geschlachtet wurden, waren ' + wahl.plural + '.' + (wahl.id === 'rind' ? ' Als Kalb einer Milchkuh bist du ' + (id === 'milchkuh' ? 'weiblich – du wirst selbst Milchkuh.' : 'männlich – du kommst in die Bullenmast.') : '') + '</p>'
      + '<button class="btn tl-gross" id="tlLebenLos" type="button">Dieses Leben leben ▶</button>';
    $('tlLebenLos').addEventListener('click', () => tlLebenStart(id, false));
  }, wenigBewegung() ? 50 : 2300);
}

function tlLebenStart(id, wild) {
  const L = wild ? TL_WILD[id] : TL_LEBEN[id];
  tl = { id, wild, L, k: 0, tot: false, alter: 0 };
  zeigeTlTeil('leben');
  $('tlLebenKopf').innerHTML = '<span>' + L.emoji + '</span><b>' + L.name + '</b>';
  $('tlKapitel').innerHTML = '';
  tlKapitel();
}

function tlKapitel() {
  const K = tl.L.kapitel[tl.k];
  const box = document.createElement('div');
  box.className = 'tl-kap';
  box.innerHTML = '<div class="tl-zeit">' + K.zeit + '</div><h3>' + K.titel + '</h3>' + (K.text ? '<p>' + K.text + '</p>' : '') + (K.quelle ? '<small class="tl-q">Quelle: ' + K.quelle + '</small>' : '');
  $('tlKapitel').appendChild(box);
  const weiter = $('tlWeiter');
  if (K.wahl) {
    weiter.hidden = true;
    const w = document.createElement('div');
    w.className = 'tl-wahl';
    w.innerHTML = '<b>' + K.wahl.frage + '</b>' + K.wahl.optionen.map((o, i) => '<button type="button" class="tl-opt" data-i="' + i + '">' + o[0] + '</button>').join('');
    box.appendChild(w);
    w.querySelectorAll('.tl-opt').forEach((b) => b.addEventListener('click', () => {
      const o = K.wahl.optionen[Number(b.dataset.i)];
      w.querySelectorAll('.tl-opt').forEach((x) => { x.disabled = true; x.classList.toggle('gewaehlt', x === b); });
      const a = document.createElement('p');
      a.className = 'tl-antwort';
      a.innerHTML = o[1];
      w.appendChild(a);
      if (tl.wild && Math.random() < (o[2] || 0)) {
        tl.tot = K.tod || 'Du bist gestorben.';
        const t = document.createElement('p');
        t.className = 'tl-tod';
        t.textContent = '✝ ' + tl.tot;
        w.appendChild(t);
      }
      weiter.hidden = false;
      weiter.textContent = tl.tot || tl.k === tl.L.kapitel.length - 1 ? 'Zum Ende ▶' : 'Weiter ▶';
      box.scrollIntoView({ block: 'nearest', behavior: wenigBewegung() ? 'auto' : 'smooth' });
    }));
  } else {
    weiter.hidden = false;
    weiter.textContent = tl.k === tl.L.kapitel.length - 1 ? 'Zum Ende ▶' : 'Weiter ▶';
  }
  requestAnimationFrame(() => box.scrollIntoView({ block: 'start', behavior: wenigBewegung() ? 'auto' : 'smooth' }));
}

function tlWeiter() {
  if (tl.tot || tl.k >= tl.L.kapitel.length - 1) { tlEnde(); return; }
  tl.k++;
  tlKapitel();
}

function tlEnde() {
  const L = tl.L;
  zeigeTlTeil('ende');
  const st = tlStore();
  st.leben = st.leben || [];
  let html = '<div class="tl-ende-emoji">' + L.emoji + '</div>';
  if (!tl.wild) {
    const anteil = L.natur ? L.tage / L.natur : null;
    html += '<h2>Dein Leben als ' + L.name + '</h2><div class="tl-vergleich"><div><small>Gelebt</small><b>' + tlTageText(L.tage) + '</b></div><div><small>Möglich wären</small><b>' + L.naturText + '</b></div></div>'
      + (anteil ? '<div class="tl-lebensbalken"><i style="--w:' + Math.max(0.6, anteil * 100) + '%"></i></div><p class="tl-gross-zahl">' + (anteil < 0.02 ? fmt((anteil * 100).toFixed(1)) : Math.round(anteil * 100)) + ' % deiner möglichen Lebenszeit</p><p class="tl-spielregel">gerechnet mit der Mitte der natürlichen Spanne (' + fmt(Math.round(L.natur / 365 * 10) / 10) + ' Jahre)</p>' : '')
      + '<p>' + L.fazit + '</p>'
      + '<div class="tl-kasten"><b>Was sich ändern lässt</b><ul><li>Beim Einkauf auf die Haltungsform achten – höhere Stufen bedeuten mehr Platz, Auslauf oder Bio-Standards.</li><li>Weniger tierische Produkte essen oder auf pflanzliche Alternativen wechseln.</li><li>Haltungsregeln sind Politik: Mindestplatz, Auslauf und Kennzeichnung werden gesetzlich festgelegt.</li></ul></div>';
    st.leben.push({ id: tl.id, emoji: L.emoji, name: L.name, tage: L.tage, natur: L.natur, wild: false, z: Date.now() });
  } else {
    html += '<h2>' + (tl.tot ? 'Dein Leben endete früh' : 'Du hast überlebt') + '</h2>'
      + '<p class="tl-gross-zahl">' + (tl.tot ? '✝ ' + tl.tot : '🌱 Ein Leben bis ins hohe Alter – für deine Art eine Ausnahme.') + '</p>'
      + '<div class="tl-vergleich"><div><small>' + L.bestandText + '</small><b>' + L.bestand + '</b></div><div><small>Kann alt werden bis</small><b>' + L.alter + ' Jahre</b></div></div>'
      + '<div class="tl-kasten"><b>Was sich ändern lässt</b><p>' + L.hebel + '</p></div>'
      + '<p class="tl-spielregel">Hinweis: Die Fakten im Text sind belegt. Wie wahrscheinlich du in diesem Spiel stirbst, ist eine Spielregel und keine Statistik.</p>';
    st.leben.push({ id: tl.id, emoji: L.emoji, name: L.name, wild: true, ueberlebt: !tl.tot, z: Date.now() });
  }
  html += '<details class="tl-quellen"><summary>📚 Quellen</summary><ul>' + L.quelle.map((q) => '<li>' + q + '</li>').join('') + '</ul></details>';
  st.leben = st.leben.slice(-200);
  saveJson(TL_KEY, st);
  if (typeof merkeVerlauf === 'function') merkeVerlauf('tierleben', 1, null, L.name + (tl.wild ? (tl.tot ? ' · gestorben' : ' · überlebt') : ' · ' + tlTageText(L.tage)));
  $('tlEndeInhalt').innerHTML = html;
  $('tl-ende').scrollIntoView({ block: 'start' });
}

// ---------- Knöpfe ----------
$('tlLotterieBtn').addEventListener('click', tlLotterie);
$('tlWeiter').addEventListener('click', tlWeiter);
$('tlNochmal').addEventListener('click', () => (tl && tl.wild ? tlLebenStart(tl.id, true) : tlLotterie()));
$('tlAndere').addEventListener('click', tierlebenIntro);
$('tlZurueck').addEventListener('click', () => {
  if (!$('tl-intro').hidden) { clearInterval(tlZaehler); zeigeHub(); return; }
  tierlebenIntro();
});
$('hubTierleben').addEventListener('click', () => { merkeZuletzt('tierleben'); zoomZu($('hubTierleben'), () => { show('tierleben', '🐾 Ein Tierleben'); tierlebenIntro(); }); });
