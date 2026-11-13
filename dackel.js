// Dackel-Wissensquiz: Fragen mit einer richtigen und drei falschen Antworten.
// Spalten: Stufe, Gruppe, Frage, richtige Antwort, falsche Antworten, Erklärung.
// Neue Fragen bitte nur hinten anhängen – Challenge-Links speichern die Position in der Liste.
const DACKEL_DATEN = [
  // ---------- Herkunft & Geschichte ----------
  [1, 'geschichte', 'Aus welchem Land stammt der Dackel?', 'Deutschland', ['England', 'Frankreich', 'Ungarn'],
    'Der Dackel wurde in Deutschland für die Jagd gezüchtet – vor allem für die Arbeit unter der Erde.'],
  [1, 'geschichte', 'Woher kommt der Name „Dachshund“?', 'Vom Dachs, den er im Bau jagte', ['Von einem Züchter namens Dachs', 'Vom Ort Dachsbach', 'Weil er gern auf Dächern lag'],
    'Dackel wurden gezüchtet, um Dachse und Füchse in ihrem unterirdischen Bau aufzuspüren.'],
  [1, 'geschichte', 'Wie hieß das Maskottchen der Olympischen Spiele 1972 in München?', 'Waldi', ['Bello', 'Hansi', 'Wuffi'],
    'Waldi, ein bunt gestreifter Dackel, war das erste offizielle Maskottchen der Olympischen Spiele.'],
  [2, 'geschichte', 'Welches andere Wort benutzen besonders Jäger für den Dackel?', 'Teckel', ['Terrier', 'Bracke', 'Spitz'],
    '„Teckel“ ist die traditionelle Bezeichnung, besonders in der Jägersprache und im Vereinsnamen.'],
  [3, 'geschichte', 'Welcher Verein betreut in Deutschland die Dackelzucht?', 'Deutscher Teckelklub (DTK)', ['Deutscher Dackelbund', 'Bundesverband Kurzbeiner', 'Teckel-Union Europa'],
    'Der Deutsche Teckelklub ist der größte Zuchtverein für Dackel in Deutschland.'],
  [4, 'geschichte', 'In welchem Jahr wurde der Deutsche Teckelklub gegründet?', '1888', ['1799', '1920', '1950'],
    'Der DTK wurde 1888 gegründet und gehört zu den ältesten Rassehunde-Vereinen Deutschlands.'],
  [4, 'geschichte', 'Seit wann gibt es eine geregelte Dackelzucht mit Zuchtbuch?', 'Seit dem späten 19. Jahrhundert', ['Seit dem Mittelalter', 'Seit den 1960er-Jahren', 'Seit dem Jahr 2000'],
    'Dackelähnliche Jagdhunde gibt es schon lange; die geregelte Zucht mit Zuchtbuch begann im 19. Jahrhundert.'],
  [4, 'geschichte', 'In welcher FCI-Gruppe ist der Dackel eingeordnet?', 'Gruppe 4 – eine eigene Gruppe nur für Dackel', ['Gruppe 1 – Hütehunde', 'Gruppe 3 – Terrier', 'Gruppe 9 – Gesellschaftshunde'],
    'Der Dackel ist so besonders, dass die FCI ihm eine eigene Gruppe gegeben hat.'],

  // ---------- Aussehen & Körper ----------
  [1, 'koerper', 'Welche drei Haararten gibt es beim Dackel?', 'Kurzhaar, Langhaar, Rauhaar', ['Kurzhaar, Lockenhaar, Langhaar', 'Glatthaar, Seidenhaar, Wollhaar', 'Kurzhaar, Langhaar, Nackt'],
    'Jede Haarart gibt es in allen drei Größen.'],
  [2, 'koerper', 'Welche drei Größen kennt die FCI beim Dackel?', 'Standard, Zwerg, Kaninchen', ['Groß, Mittel, Klein', 'Standard, Mini, Micro', 'Jagd, Haus, Schoß'],
    'Der Kaninchendackel ist der kleinste – klein genug, um sogar in einen Kaninchenbau zu passen.'],
  [2, 'koerper', 'Woran wird gemessen, ob ein Dackel Standard, Zwerg oder Kaninchen ist?', 'Am Brustumfang', ['An der Schulterhöhe', 'Am Gewicht', 'An der Körperlänge'],
    'Zwergdackel haben 30–35 cm Brustumfang, Kaninchendackel bis 30 cm, Standarddackel mehr.'],
  [3, 'koerper', 'Wie viel wiegt ein Standarddackel laut Rassestandard höchstens ungefähr?', 'Etwa 9 kg', ['Etwa 2 kg', 'Etwa 18 kg', 'Etwa 25 kg'],
    'Standarddackel wiegen bis etwa 9 kg – Zwerg- und Kaninchendackel entsprechend weniger.'],
  [1, 'koerper', 'Welche klassische Fellfarbe hat ein Kurzhaardackel oft?', 'Rot oder schwarz mit rotbraunen Abzeichen', ['Grün', 'Blau-weiß gestreift', 'Reinweiß'],
    'Einfarbig Rot und Schwarz-Rot sind die bekanntesten Farben.'],
  [2, 'koerper', 'Was bedeutet die Farbe „saufarben“ beim Rauhaardackel?', 'Helle und dunkle Haare gemischt – wie beim Wildschwein', ['Rosa', 'Ganz schwarz', 'Weiß mit braunen Flecken'],
    '„Sau“ ist in der Jägersprache das Wildschwein – dessen Fell sieht ähnlich aus.'],
  [2, 'koerper', 'Wie nennt man einen Dackel mit gefleckter, marmorierter Fellzeichnung?', 'Tigerdackel', ['Leopardendackel', 'Zebradackel', 'Pandadackel'],
    'Die Zeichnung heißt „getigert“ – obwohl sie eher gefleckt als gestreift ist.'],
  [3, 'koerper', 'Was nennt man bei der Dackelfarbe einen „Brand“?', 'Die hellen, rotbraunen Abzeichen z. B. über den Augen', ['Ein Brandzeichen im Fell', 'Eine dunkle Linie auf dem Rücken', 'Weiße Pfoten'],
    'Ein schwarzer Dackel mit „Brand“ hat rotbraune Stellen an Augenbrauen, Schnauze, Brust und Pfoten.'],
  [3, 'koerper', 'Welche Augenfarbe kann bei Tigerdackeln vorkommen?', 'Blau – manchmal nur auf einem Auge', ['Rot', 'Violett', 'Gelb-grün gestreift'],
    'Die Tigerzeichnung kann auch die Augen betreffen; blaue Augen nennt man dann „Glasaugen“.'],
  [4, 'koerper', 'Wie viele Zähne hat ein erwachsener Dackel – wie fast alle Hunde?', '42', ['28', '32', '50'],
    'Erwachsene Hunde haben 42 Zähne, Welpen 28 Milchzähne.'],
  [4, 'koerper', 'Welche Hunde wurden laut Rassegeschichte für den Rauhaardackel eingekreuzt?', 'Rauhaarige Terrier und Pinscher', ['Pudel', 'Möpse', 'Windhunde'],
    'Das drahtige Fell kommt von eingekreuzten rauhaarigen Hunden wie dem Dandie Dinmont Terrier.'],

  // ---------- Gesundheit & Pflege ----------
  [1, 'gesundheit', 'Welche Körpereigenschaft macht Dackel anfällig für Rückenprobleme?', 'Langer Rücken und kurze Beine', ['Großer Kopf', 'Kurzer Schwanz', 'Dickes Fell'],
    'Der lange Rücken belastet die Bandscheiben – deshalb sollten Dackel nicht zu viel springen.'],
  [2, 'gesundheit', 'Wie heißt die typische Bandscheiben-Erkrankung beim Dackel umgangssprachlich?', 'Dackellähme', ['Dackelhusten', 'Dackelfieber', 'Dackelknie'],
    'Bei der Dackellähme drückt eine Bandscheibe aufs Rückenmark – im schlimmsten Fall bis zur Lähmung.'],
  [1, 'gesundheit', 'Was sollte man einem Dackel wegen seines Rückens möglichst ersparen?', 'Viel Treppensteigen und Springen vom Sofa', ['Spaziergänge', 'Schnüffelspiele', 'Kuscheln'],
    'Rampen und Hochheben schonen die Bandscheiben.'],
  [1, 'gesundheit', 'Wie alt werden Dackel durchschnittlich?', '12–16 Jahre', ['5–7 Jahre', '8–10 Jahre', '20–25 Jahre'],
    'Dackel gehören zu den langlebigen Hunderassen.'],
  [3, 'gesundheit', 'Wie pflegt man das Fell eines Rauhaardackels richtig?', 'Trimmen – lose Haare werden ausgezupft', ['Komplett kurz scheren', 'Jeden Tag baden', 'Gar nicht, es pflegt sich selbst'],
    'Beim Trimmen wird abgestorbenes Haar ausgezupft, damit das drahtige Fell schön dicht bleibt.'],
  [3, 'gesundheit', 'Warum dürfen zwei Tigerdackel nicht miteinander verpaart werden?', 'Die Welpen können taub oder blind werden', ['Das Fell wird zu lang', 'Die Welpen werden zu groß', 'Es ist erlaubt und völlig unproblematisch'],
    'Das Tiger-Gen (Merle) ist doppelt vererbt gefährlich – deshalb ist diese Verpaarung verboten.'],
  [2, 'gesundheit', 'Ab welchem Alter darf ein Dackelwelpe frühestens zu seiner neuen Familie?', 'Ab 8 Wochen', ['Ab 2 Wochen', 'Ab 6 Monaten', 'Ab 1 Jahr'],
    'In Deutschland dürfen Welpen nicht vor der 8. Woche von der Mutter getrennt werden; viele Züchter warten länger.'],
  [2, 'gesundheit', 'Wie viele Welpen bekommt eine Dackelhündin meistens pro Wurf?', '3–6', ['Immer nur 1', '10–15', 'Etwa 20'],
    'Je nach Größe der Hündin sind es meist drei bis sechs Welpen.'],

  // ---------- Jagd ----------
  [1, 'jagd', 'Wofür wurde der Dackel ursprünglich gezüchtet?', 'Für die Jagd im Bau von Dachs und Fuchs', ['Zum Schafehüten', 'Zum Schlittenziehen', 'Als Wachhund für Burgen'],
    'Mit seinen kurzen Beinen und dem langen Körper passt er perfekt in einen Erdbau.'],
  [1, 'jagd', 'Welche Tiere jagt der Dackel traditionell unter der Erde?', 'Dachs und Fuchs', ['Hase und Reh', 'Wildschwein und Hirsch', 'Ente und Gans'],
    'Diese Arbeit unter der Erde heißt in der Jägersprache „Bauarbeit“.'],
  [2, 'jagd', 'Warum haben Dackel eine so laute, kräftige Stimme?', 'Damit der Jäger sie unter der Erde hören kann', ['Um Schafe zu treiben', 'Reiner Zufall', 'Um andere Hunde einzuschüchtern'],
    'Unter der Erde konnte der Jäger seinen Hund nicht sehen – nur hören.'],
  [3, 'jagd', 'Wofür werden Dackel bei der Jagd heute auch über der Erde eingesetzt?', 'Zur Nachsuche auf verletztes Wild (Schweißarbeit)', ['Zum Treiben von Schafen', 'Zum Bewachen von Hühnern', 'Zum Ziehen von Schlitten'],
    'Mit ihrer feinen Nase folgen Dackel der Spur eines angeschossenen Tieres.'],
  [3, 'jagd', 'Was bedeutet „Schweiß“ in der Jägersprache?', 'Blut', ['Fell', 'Spur im Schnee', 'Geruch des Hundes'],
    'Ein „Schweißhund“ ist ein Hund, der Blutspuren verletzter Tiere folgt.'],

  // ---------- Charakter ----------
  [1, 'charakter', 'Welche Eigenschaft ist typisch für Dackel?', 'Selbstbewusst und eigensinnig', ['Schüchtern und ängstlich', 'Unterwürfig', 'Träge und desinteressiert'],
    'Als Jagdhund musste er unter der Erde selbst Entscheidungen treffen – das merkt man bis heute.'],
  [1, 'charakter', 'Was ist der „Dackelblick“?', 'Ein treuherziger Blick, mit dem man etwas erreichen will', ['Schielen', 'Ein böser Blick', 'Kurzsichtigkeit'],
    'Der Dackelblick wird gern eingesetzt, wenn es ums Futter geht – bei Hunden und Menschen.'],

  // ---------- Kultur ----------
  [1, 'kultur', 'Wie heißt der Dackel auf Englisch?', 'Dachshund', ['Corgi', 'Beagle', 'Basset'],
    'Die Engländer haben das deutsche Wort einfach übernommen.'],
  [2, 'kultur', 'Welchen Spitznamen hat der Dackel in Großbritannien?', 'Sausage dog (Würstchenhund)', ['Bread dog', 'Pickle dog', 'Noodle dog'],
    'In den USA sagt man dagegen oft „wiener dog“.'],
  [1, 'kultur', 'Was ist ein „Wackeldackel“?', 'Eine Hundefigur mit nickendem Kopf für die Hutablage im Auto', ['Ein Hundetanz', 'Ein Spielzeug-Roboter', 'Ein Dackelrennen'],
    'Wackeldackel waren besonders in den 1960er- und 70er-Jahren in vielen Autos zu sehen.'],
  [3, 'kultur', 'In welcher Stadt gibt es ein Dackelmuseum?', 'Passau', ['Hamburg', 'Köln', 'Bremen'],
    'Das Dackelmuseum in Passau zeigt tausende Dackel-Ausstellungsstücke.'],
  [4, 'kultur', 'Wie hieß der Dackel des Malers Pablo Picasso?', 'Lump', ['Waldi', 'Bobby', 'Fritz'],
    'Lump gehörte eigentlich dem Fotografen David Douglas Duncan, lebte aber lange bei Picasso und taucht in seinen Bildern auf.'],
  [3, 'kultur', 'Welche Haarart ist in Deutschland heute am weitesten verbreitet?', 'Rauhaar', ['Kurzhaar', 'Langhaar', 'Alle gleich häufig'],
    'Der Rauhaardackel ist bei Züchtern und Jägern in Deutschland die häufigste Variante.'],
];

const DACKEL_GRUPPEN = {
  geschichte: 'Dackel – Herkunft & Geschichte',
  koerper:    'Dackel – Aussehen & Körper',
  gesundheit: 'Dackel – Gesundheit & Pflege',
  jagd:       'Dackel – Jagd',
  charakter:  'Dackel – Charakter',
  kultur:     'Dackel – Kultur',
};

const DACKEL = DACKEL_DATEN.map(([lvl, gruppe, frage, richtig, falsch, erklaerung], i) => ({
  id: 'dackel-' + (i + 1),
  welt: 'dackel', name: richtig, frage, falsch, erklaerung, lvl, gruppe, auch: [], latin: '',
}));
