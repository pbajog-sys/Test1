# Wal-Quiz – Seepferdchen der Walkunde

Die App startet mit dem **Dashboard „Spiele“**: oben eine animierte Bühne, darunter die **Games** als Zeilen –
**Quizzes**, Farb-Gedächtnis, Cello-Noten, Ton-Gedächtnis und „Wer war’s?“. Die Quizzes führen zu den Karten der Welten. Eine Karte zoomt beim
Antippen auf den ganzen Bildschirm und wird zur Welt; ← führt zurück zum Dashboard. Es gibt fünf Welten: 🐋 Wale, 🦈 Haie, 🌊 Beide (Wale und Haie gemischt),
🏎️ Porsche und 🐕 Dackel. Jede Welt hat eigene Abzeichen; Lernstand und Lexikon funktionieren überall.

## Dackel
Ein Wissensquiz statt Foto-Raten: 40 Fragen in `dackel.js` (Herkunft, Aussehen, Gesundheit, Jagd, Charakter,
Kultur) mit je vier Antworten und einer Erklärung. Auch im Test wird angeklickt. Statt Tipps gibt es einen
50:50-Joker, der im Test einen halben Punkt kostet. Stufen: 14/24/34/40.

**Gretchen** (Fotos mit freundlicher Erlaubnis von [@chrissi_und_gretchen](https://www.instagram.com/chrissi_und_gretchen/))
ist das Maskottchen der Dackel-Welt: eigenes rosa Design, Steckbrief und Foto-Feed auf der Startseite,
Sprechblasen und ein „Gretchen-Moment“-Foto nach jeder Antwort, Pfoten-Konfetti und ein Story-Bild (1080 × 1920)
zum Teilen auf Instagram. Code in `gretchen.js`, Fotos in `img/gretchen/`.

## Porsche
33 Serienmodelle mit ihren Generationen in `porsche.js` – vom 356 über alle 911-Generationen (Urmodell bis 992),
die Frontmotor-Modelle (924, 944, 968, 928), Boxster/Cayman, die Supersportwagen (959, Carrera GT, 918) bis zu
Cayenne, Macan, Panamera und Taycan. Stufen: 14/25/31/33. Tipps: Gruppe, Bauzeit, Motor, Merkmal.
Im Test zählt die Generation („964“, „Porsche 964“, „911 (964)“); nur die Baureihe („911“, „Elfer“, „Cayenne“)
gibt im Seepferdchen-Test den vollen Punkt, sonst einen halben. Die Fotos kommen aus generationsgenauen Quellen
(Wikipedia-Artikel oder Commons-Kategorie, der Reihe nach probiert); Innenraum, Motorraum, Felgen, Logos und
Spielzeugautos werden aussortiert, Renn- und Tuning-Autos nach hinten gestellt. Inoffizielles Fan-Quiz, ohne Logos.

Eine Web-App (PWA) zum Lernen von Walarten. Sie läuft auf iPhone und Android im Browser
und lässt sich wie eine App auf den Home-Bildschirm legen.

## Modi
- **Üben:** Pro Art 2 Fotos zum Durchwischen, du wählst aus 6 Arten. Der Tipp-Knopf verrät nacheinander
  Gruppe, Größe/Gewicht, Verbreitung und ein Merkmal. Nach jeder Antwort gibt es den ganzen Steckbrief.
- **Abzeichen-Test:** 10 Wale, den Namen selbst eintippen. Ab 8 Punkten gibt es das Abzeichen der Stufe
  (Seepferdchen, Bronze, Silber, Gold). Mit Tipp gibt es nur einen halben Punkt. Kleine Tippfehler,
  Zweitnamen (Orca, Beluga, Minkwal …), der wissenschaftliche und der englische Name zählen als richtig.
- **Wer ruft da?:** Wal-Rufe und -Gesänge anhören und die Art erraten (Arten bis Bronze, nur Wale – Haie sind stumm).
- **Karteikasten-Lernen:** Jede Art liegt in einem Fach 0–5. Richtig ohne Tipp → ein Fach weiter, falsch → zurück
  auf 0. Beim Üben kommen Arten aus niedrigen Fächern viel öfter dran. Ab Fach 3 gilt eine Art als „sicher“.
- **Größenvergleich:** Silhouette des Wals neben Mensch (1,8 m) und bei großen Walen einem Bus (12 m).
- **Challenge:** Nach dem Test einen Link teilen – Freunde bekommen dieselben 10 Wale und sehen, wer gewonnen hat.
- **Wal-Lexikon:** Alle Arten mit Foto, Steckbrief, Größenvergleich und Ruf, mit Suche und Filter.

## Arten
Alle 92 heute lebenden Walarten inklusive Delfine und Schweinswale, in `wale.js`.
Dazu 78 Haiarten aus allen 8 Ordnungen in `haie.js` (Stufen: 15/35/65/78). Es gibt über 540 Haiarten –
die meisten sind kleine Tiefseehaie, von denen es kaum Fotos gibt; die Liste lässt sich aber erweitern.
Neue Arten bitte nur **hinten anhängen** – Challenge-Links speichern die Position in der Liste.
Stufen: Seepferdchen 15 Arten, Bronze 35, Silber 76, Gold 92.

## Fotos
Pro Art werden **2 Fotos** gezeigt. Echtheits-Prüfung: Bilder mit Kameradaten (EXIF-Hersteller/-Modell) werden
bevorzugt; Bilder, die auf Commons als KI-generiert, Zeichnung, Gemälde oder 3D-Modell einsortiert sind, werden nie
genommen. Im Lexikon gibt es unten **„🔎 Fotos prüfen“**: alle Arten mit ihren Fotos, ✓ = passt, ✗ = aussortieren
(das nächste Foto rückt nach). Die Liste der aussortierten Fotos lässt sich kopieren und in `FOTO_SPERRE` in
`app.js` fest eintragen.

Die App sucht die Fotos auf dem Gerät über die Wikipedia-Schnittstelle: das Hauptbild des
englischen Wikipedia-Artikels plus weitere Fotos aus dem Artikel (Karten, Skelette, Zeichnungen usw.
werden herausgefiltert). Die Treffer werden im Gerät gespeichert. Arten ohne brauchbares Foto werden
im Quiz übersprungen. Die Tonaufnahmen werden genauso auf Wikimedia Commons gesucht (für iPhones als MP3).

## Dateien
- `index.html` – Aufbau und Aussehen
- `app.js` – Quiz-Logik, Fotos, Töne, Karteikasten, Challenge
- `wale.js`, `haie.js`, `porsche.js` – Listen mit Steckbriefen
- `dackel.js` – Fragen fürs Dackel-Quiz
- `gretchen.js`, `img/gretchen/` – Gretchen als Maskottchen
- `melden.js` – Fehler und Fotos als GitHub-Issue melden
- `stil.css`, `effekte.js` – Design und Animationen der Welten
- `farben.js` – Farb-Gedächtnis
- `hub.js` – Dashboard „Spiele“ mit Zoom-Übergang
- `cello.js` – Cello-Noten
- `instrumente.js` – Noten & Griffe für Klavier, Gitarre, Ukulele
- `toene.js` – Ton-Gedächtnis
- `takt.js` – Takt-Gefühl (Zeitgefühl, Tempo, Taktart)
- `verlauf.js` – Verlauf & Statistik
- `punkte.js` – Punktwolke (Korrelation schätzen und sortieren)
- `augen.js` – Augenmaß
- `karte.js`, `karten-daten.js` – Karten-Gefühl (Kartendaten aus `werkzeuge/karten.py`)
- `krimi.js` – Wer war’s? (Krimi-Logikrätsel)
- `groesse.js` – Größenvergleich
- `profile.js` – Profile „Wer spielt?“
- `fonts/` – selbst gehostete Schriften (SIL Open Font License)
- `datenschutz.html` – Datenschutzhinweise
- `sw.js`, `manifest.webmanifest`, `icons/` – Installation und Offline-Nutzung

## Auf dem Handy nutzen
Die Dateien müssen über HTTPS ausgeliefert werden, z. B. mit GitHub Pages
(Repo → Settings → Pages → Branch auswählen). Danach die Seite öffnen und:
- **iPhone (Safari):** Teilen → „Zum Home-Bildschirm“ – das Dashboard zeigt dazu selbst einen Hinweis.
- **Android (Chrome):** Knopf „Installieren“ im Dashboard bzw. Menü ⋮ → „App installieren“

Installiert heißt die App **Spielekiste**: eigenes Symbol (`icons/`), Startbildschirm für die gängigen iPhone-Größen
(`icons/splash/`), Vollbild ohne Browserleiste, offline spielbar. Symbol und Startbilder wurden aus einer HTML-Vorlage
mit den App-Schriften gerendert.

Fotos, die einmal angezeigt wurden, sind danach auch offline verfügbar.

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.

## Bildquellen
**Fotoprüfung (2.11.2026):** Die Titelbilder aller 170 Wal- und Haiarten wurden einzeln angesehen und stehen als feste Wahl in
`fotos.json`. Für Arten mit Karte, Briefmarke, Größengrafik oder unscharfem Titelbild wurden passende Fotos von Hand gewählt.
Ursache der gemeldeten Fehlbilder (Okapi, Ambra …): Wikipedia-Artikel enthalten auch Bilder aus Navigationsleisten. Darum zählen
Artikelbilder jetzt nur, wenn ihr Dateiname zur Art passt; zusätzlich wird die Commons-Kategorie der Art durchsucht.
Alle Fotos stammen von Wikimedia Commons; jede Quelle ist in der App verlinkt.
Vor einer öffentlichen Veröffentlichung sollten Urheber und Lizenz je Bild ergänzt werden
(stehen auf der jeweiligen Commons-Seite).

## Fehler und Fotos melden
Auf jedem Quiz-Foto sitzt oben rechts ein **⚑**: ein Tipp öffnet sofort die fertige Meldung für genau dieses Foto.
Außerdem gibt es unter jeder Antwort, bei jedem Lexikon-Eintrag und auf der Startseite **„⚑ Melden“**. Der Dialog fragt,
was falsch ist (Foto, Info, App-Fehler, Idee), bei Fotos auch welches, und öffnet dann ein **vorausgefülltes
GitHub-Issue** in diesem Repo – mit Welt, Art bzw. Frage, Foto-Links, App-Stand und Gerät. Dort nur noch „Create“.
Gemeldete Fotos werden auf dem eigenen Gerät sofort aussortiert. In der Prüf-Ansicht lässt sich die ganze
Sperrliste mit „📮 Auf GitHub melden“ als Issue schicken. Bei Foto-Meldungen kann man einen **Link zu einem besseren Foto** von Wikimedia Commons angeben (im Dialog oder
nachträglich im Issue). Jede Meldung enthält einen versteckten, maschinenlesbaren Block
(`<!-- walquiz-meldung {...} -->`), damit sie ohne Abtippen übernommen werden kann.

`fotos.json` gilt für alle Geräte: `sperre` = Fotos, die nie gezeigt werden; `wahl` = pro Art-ID fest gewählte
Commons-Dateinamen, die zuerst gezeigt werden (dann sucht die App für diese Art gar nicht mehr).

Es gibt bewusst keinen Schlüssel in der App –
wer meldet, braucht ein GitHub-Konto, und die Meldungen sind öffentlich. Code in `melden.js`.

## Design
Jede Welt hat ihren eigenen Look (`stil.css`) und eine animierte Kulisse (`effekte.js`):
🐋 Tiefsee mit Lichtstrahlen und Luftblasen · 🦈 Hai-Alarm mit kantigen Karten und vorbeiziehender Flosse ·
🌊 Sonnenuntergang mit Wellen · 🏎️ Rennstrecke mit Speed-Linien und Rennstreifen · 🐕 Gretchen-Rosa mit Pfoten.
Dazu: gleitender Welt-Umschalter, aufploppende Antworten, „+1“ bei richtigen Antworten, hochzählende Punkte und
Konfetti je Welt. Mit „Bewegung reduzieren“ (iPhone/Android-Einstellung) bleibt alles ruhig.

## 🎨 Farb-Gedächtnis (Game)
Farbe sehen, merken, nachmischen – bis zu 50 Punkte in fünf Runden, bewertet mit dem Farbabstand CIEDE2000.
- **Spiel:** 🧠 *Merken* (Farbe blitzt auf, dann nachmischen) oder 🎯 *Mitte finden* (zwei Farben – gesucht ist die Farbe genau dazwischen;
  Leicht: beide bleiben sichtbar, Mittel/Profi: nur kurz).
- **Mischen:** Regler Rot·Grün·Blau, Regler Farbton·Sättigung·Helligkeit oder 🪣 **Farbtopf**: Tropfen von Rot, Gelb, Blau, Weiß
  und Schwarz wie echte Malfarbe (Rot + Gelb = Orange, Gelb + Blau = Grün). Zielfarben im Farbtopf bestehen selbst aus Tropfen –
  jede ist genau erreichbar. Danach: Rezept-Vergleich und Tipp, welcher Tropfen gefehlt hat.
- Auswertung mit RGB-/Hex-Tabelle und Differenz, Tagesfarben, Bestwerte je Spiel, Challenge-Links.

## 🎻 Cello-Noten (Game)
Lernspiel für die **Lagen auf dem Cello** mit deutschen Notennamen (H, B, Fis, Es …).
Lagen-Zählung wie in deutschen Celloschulen: Die Lage bestimmt der **2. Finger** auf den Stammtönen der A-Saite
(halbe Lage = H, 1. = C, 2. = D, 3. = E, 4. = F, 5. = G, 6. = A, 7. = H, Daumenlage = C eine Oktave höher), Finger in
enger Haltung je einen Halbton auseinander. Halbe bis 4. Lage mit vier Fingern, 5.–7. Lage mit drei, Daumenlage mit
Daumen auf der Oktave. (Quellen: celloschmidt.de „Die Lagen auf dem Violoncello“, cellolabstudio.com „Cello positions“.)

Stufen: 🐴 Seepferdchen = 1. Lage · 🥉 Bronze = bis 4. Lage · 🥈 Silber = bis 7. Lage · 🥇 Gold = mit Daumenlage.
Übungen: **Griff finden** (Note → Saite und Finger in der Lage tippen), **Griff lesen** (Finger sehen → Ton nennen),
**Noten lesen** (Bass-, Tenor-, Violinschlüssel je nach Stufe) und **Abzeichen-Test** (10 gemischte Aufgaben,
8 richtig). Jeder Ton erklingt (Web Audio). Code in `cello.js`.

## 🎹🎸🪕 Noten & Griffe: Klavier, Gitarre, Ukulele
Die Dashboard-Zeile „Noten & Griffe“ öffnet das zuletzt gewählte Instrument; oben wechselt man per Chip zwischen
🎻 Cello, 🎹 Klavier, 🎸 Gitarre und 🪕 Ukulele. Gleiche Bedienung wie beim Cello: Stufen 🐴 🥉 🥈 🥇 mit Abzeichen-Test
(10 Aufgaben, 8 richtig), Vorzeichen-Schalter, 60-Sekunden-Runde. Jeder Ton erklingt (Klavier- bzw. Zupfklang per Web Audio).
- **Klavier:** Violin- und Bassschlüssel, Klaviatur über zwei Oktaven mit Oktavnamen (c, c′, c″ …) – Taste finden heißt
  auch die richtige Oktave finden. Stufen von c–g/c′–g′ bis C–c‴.
- **Gitarre:** Noten im Violinschlüssel mit 8 (klingt eine Oktave tiefer), Stimmung E A D G H e, Griffbrett bis Bund 3/5/9/12.
  Gleiche Töne an mehreren Stellen zählen alle als richtig und werden in der Auflösung gezeigt.
- **Ukulele:** Stimmung G C E A (hohe G-Saite), Griffbrett bis Bund 3/5/7/12.
- **Akkorde** (Gitarre und Ukulele): Griffbild erkennen oder zum Namen das Griffbild wählen; von C, G, D, Em, Am bis Barré-F,
  Septakkorde und Hm. Deutsche Namen: H = B-Dur, B = B♭-Dur. Der Akkord erklingt angeschlagen.
- Code: `instrumente.js` (nutzt Notensatz und Notennamen aus `cello.js`).

## 🎧 Ton-Gedächtnis (Game)
Eigenes Spiel, angelehnt an das Prinzip „Ton hören und nachbauen“: Ein Sinuston erklingt (Leicht 3 s und einmal
wiederholbar, Mittel 2 s, Profi 1 s), danach sucht man ihn mit einem logarithmischen Frequenz-Schieber
(100–2000 Hz). Solange man den Schieber festhält, klingt der eigene Ton live. Punkte 0–10 pro Ton nach dem
Abstand in Cent (100 Cent = ein Halbton; 10 − Cent/50, ab einer Quarte 0). Auswertung: Frequenz und nächste Note
(z. B. „A4 +20 ct“) für Original und eigenen Ton, Differenz in Hz und Cent, Tipp („1,2 Halbtöne zu hoch“),
Position auf der Skala, beide Töne zum Vergleichen. Tagestöne, Bestwerte, Challenge-Links. Code in `toene.js`.

## 👤 Profile („Wer spielt?“)
Wie bei Netflix: Beim ersten Start fragt die App nach deinem Namen und einem Bild. Jedes Profil hat eigene Abzeichen, Lernstand und Rekorde. Die App merkt sich, wer zuletzt gespielt hat. Mit dem Knopf oben rechts im Dashboard wechselst du das Profil oder legst ein neues an (bis zu 8).
- Ab zwei Profilen zeigt das Dashboard eine **Bestenliste** (🏅 Abzeichen, 📚 gelernt, 🎨 Farb- und 🎧 Ton-Rekord).
- „Profile verwalten“: Name, Bild und Farbe ändern oder ein Profil löschen.
- Alles bleibt auf dem Gerät, ohne Anmeldung und ohne Server.

## 🔎 Wer war’s? (Krimi-Zentrale)
Krimi-Rätsel in einer Villa mit zehn Verdächtigen (Porträts und Icons in `img/krimi/`).

**📁 Ermittlungsakte** (`krimi-akte.js`): ein Fall pro Woche, für alle gleich – gleiches Opfer, vier Verdächtige, ein Täter.
Kapitel 1 Queens · 2 Knights & Knaves · 3 Einstein-Rätsel · 4 Murdoku · dann die Anklage. Jedes Kapitel liefert ein Beweisstück
in die Akte; alle Kapitel zeigen auf denselben Täter. Danach gibt es Bonus-Akten.

**Einzeln üben** – jedes Spiel mit Leicht/Mittel/Schwer, Tagesrätsel, Bestzeiten, erklärendem 💡 Tipp und Spielregeln (Knopf „?“, beim ersten Spielen automatisch):
- **Murdoku** (`krimi.js`, „Der Tatort“) – Mörder-Sudoku: je Reihe/Spalte eine Person, wer allein mit dem Opfer war, ist der Täter.
- **Queens** (`krimi-wachen.js`, „Die Wachen der Villa“) – eine Wache pro Reihe, Spalte und Raum, Wachen berühren sich nie.
- **Knights & Knaves** (`krimi-verhoer.js`, „Das Verhör“) – jede Person sagt einen Satz, eine (oder zwei) lügen: Wer war es?
- **Einstein-Rätsel** (`krimi-alibi.js`, „Das Alibi-Raster“) – wer war wann wo mit welchem Gegenstand? Raster mit ✓/✕.

**So entstehen die Rätsel:** Zuerst wird eine vollständige Lösung gebaut, dann werden wahre Hinweise daraus abgeleitet,
bis ein Zähl-Löser genau eine Lösung findet; überflüssige Hinweise werden gestrichen. Ein Logik-Löser, der wie ein Mensch
in Stufen denkt (Einzelfeld → Schlussfolgerung aus einem Hinweis → Annahme), prüft, dass man nie raten muss – die
nötigen Denkschritte bestimmen die Schwierigkeit und liefern die Erklärungen für den Tipp.
`krimi-zentrale.js` enthält Menü, Einstellungen, Uhr, Rekorde und den Auflösungs-Bildschirm.

## 📱🖥️ Ansichten (automatisch)
- **Hochformat** (Handy): alles untereinander – wie gewohnt.
- **Querformat** (Handy quer, Tablet, Desktop): Die Seiten sind in zwei Hälften aufgeteilt
  (`.spalten > .spalte-a / .spalte-b` in `index.html`, Regeln in `ansichten.css`). Im Hochformat sind diese Hüllen
  unsichtbar (`display: contents`). Spielbrett bzw. Foto links (bleibt beim Scrollen stehen), Bedienung und Hinweise rechts.
- **Handy quer** (wenig Höhe): kompaktere Köpfe, Bretter passen in die Bildschirmhöhe.
- **Vollbild**: Knopf ⛶ im Dashboard (Desktop und Android). Als installierte App darf Android jetzt auch quer drehen.

## ⏱️ Takt-Gefühl
Wie gut ist deine innere Uhr? Drei Spielarten mit je fünf Runden, bis zu 50 Punkte:
- **Zeitgefühl:** Ein Licht leuchtet (bzw. ein Ton klingt) eine Weile – danach den Kreis genauso lange gedrückt halten.
  Leicht 1–4 s mit laufender Uhr, Mittel 1,5–7 s nur Licht, Profi 2–10 s nur Ton. Punkte nach der prozentualen Abweichung.
- **Tempo:** Ein Metronom tickt (Leicht 8, Mittel 6, Profi 4 Schläge), danach 8× im selben Tempo tippen.
  Auswertung in BPM, Gleichmäßigkeit und Zeitstrahl Metronom gegen deine Tipper.
- **Taktart erkennen:** Ein Rhythmus spielt in Schleife – jede Runde mit anderem Klang: Schlagzeug, Klavier (Akkordwechsel je Takt),
  Elektro, Percussion oder Klatschen (alles per Web Audio erzeugt). Leicht 2/4, 3/4, 4/4 mit Licht und 3 Klängen ·
  Mittel + 6/8, alle 5 Klänge, Synkopen · Profi + 5/4 und 7/8, ohne Glocke, Einsatz mitten im Takt. Verwandte Taktarten
  (3/4 ↔ 6/8, 2/4 ↔ 4/4) geben halbe Punkte; danach Zählraster („1 & 2 & 3 &“ oder „1 2 3 4 5 6“) zum Mitlesen beim Anhören.
- **Tages-Mix** (2× Zeit, 2× Tempo, 1× Taktart), für alle gleich. Ergebnis teilen als Challenge-Link mit denselben Runden.

## 📈 Punktwolke
Wie stark hängt das zusammen? Ein Spiel zum Korrelationskoeffizienten r, fünf Runden, bis zu 50 Punkte:
- **Schätzen:** Eine Punktwolke erscheint, r per Schieber schätzen (Leicht 0 bis 1 mit vielen Punkten, Mittel −1 bis 1,
  Profi nur 30 Punkte und Ausreißer). Danach Regressionsgerade, echtes r, Abweichung und Einordnung in Worten.
- **Sortieren:** 3–4 Wolken in die richtige Reihenfolge tippen; Punkte nach richtig geordneten Paaren.
- Die Wolken haben exakt das gewünschte r (Zufallswerte, die senkrecht zu x gemacht werden); angezeigt wird immer das echte r.
- **Tages-Wolken** (für alle gleich), Bestwerte je Profil und Challenge-Links mit denselben Wolken.

## 📐 Augenmaß
Fünf Aufgaben, jede einmal pro Runde (bis zu 50 Punkte): **Halbieren** (Mitte einer Linie antippen), **Mittelpunkt** (Kreis, Quadrat,
bei Profi der Schwerpunkt eines Dreiecks), **Winkel** (vorgegebene Gradzahl einstellen), **Länge** (zweite Linie gleich lang ziehen)
und **Parallel** (Linie drehen). Mittel: schräg und waagrecht ↔ senkrecht. Profi: echte Sinnestäuschungen (Müller-Lyer-Pfeile,
Zöllner-Striche). Danach Lösung in Mint über deiner Antwort in Orange, mit Erklärung der Täuschung. Tagesprüfung und Challenge-Links.

## 🧭 Karten-Gefühl
Wo liegt das? Tippe den Ort auf einer leeren Karte an, Punkte nach Kilometern daneben (Großkreis-Entfernung).
- Karten: **Deutschland** (Städte, Berge, Inseln), **Europa** (Hauptstädte, Gipfel), **Welt** (Metropolen und Orte, an denen Wale und Haie leben).
- Leicht: bekannte Orte · Mittel: mehr Orte · Profi: knifflige Orte, Ländergrenzen ausgeblendet.
- Bedienung wie eine Karten-App: zwei Finger oder Doppeltippen zoomt, ein Finger verschiebt, Tippen setzt die Nadel; am Computer Mausrad. Dazu Knöpfe + / − / ganze Karte.
- Danach zoomt die Karte auf Tipp und Ziel, mit Entfernung und kleinem Fakt. Tagesreise (2× Deutschland, 2× Europa, 1× Welt) und Challenge-Links.
- Kartendaten: [Natural Earth](https://www.naturalearthdata.com/) (gemeinfrei) über das npm-Paket `world-atlas` (ISC, © Mike Bostock),
  fest eingebaut in `karten-daten.js` (läuft offline). Neu erzeugen mit `werkzeuge/karten.py` (siehe Kopf des Skripts).

## 📅 Verlauf & Statistik
Jedes Spiel trägt beim Ende einen Eintrag in den Verlauf ein (Spiel, Punkte, Stufe, Uhrzeit), je Profil, die letzten 400 Tage.
Die Karte „Dein Verlauf“ im Dashboard zeigt die Tagesserie 🔥 und die letzten 7 Tage. Der Verlaufs-Bildschirm zeigt Serie,
heutige Runden, Runden gesamt, längste Serie, einen Kalender der letzten 15 Wochen (Tag antippen = Einträge des Tages)
und je Spiel Anzahl, Bestwert, Schnitt der letzten 7 Runden und eine Verlaufskurve. Code: `verlauf.js` (`merkeVerlauf`).

## 🎮 Dashboard „Spiele“
- Bunter Neon-Look: dunkler Hintergrund mit wandernden Farbflecken.
- Oben eine **animierte Bühne**, die das ganze Dashboard als Bild zeigt: tanzende Farbbalken, aufsteigende Cello-Noten,
  laufende Tonwelle, schwingendes Metronom, Mini-Punktwolke, Winkel, Kompass, suchende Lupe, Porsche und Gretchen auf der Küstenstraße, Wal mit Fontäne und Haiflosse im Meer.
  Jede Figur ist ein Schnellstart in ihr Spiel (mit Flip und Emoji-Regen). Rechts oben: Profilbild zum Wechseln.
- **Games** als Zeilen mit rundem Bild, Stand und ▶: **Quizzes** (im Kreis wechseln die Welten als Diashow), Farb-Gedächtnis,
  Noten & Griffe (Cello, Klavier, Gitarre, Ukulele), Ton-Gedächtnis, Takt-Gefühl, Punktwolke, Augenmaß, Karten-Gefühl und „Wer war’s?“. Die Quizzes führen zur Welt-Auswahl mit den bunten Karten jeder Welt.
- Akku: Farbflecken als Verlauf statt Weichzeichner, Bühne und Diashow pausieren außerhalb des Bildschirms; „Bewegung reduzieren“ wird beachtet.
