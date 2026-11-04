# Wal-Quiz – Seepferdchen der Walkunde

Die App startet mit dem **Dashboard „Spiele“**: oben eine animierte Bühne, darunter die **Games** als Zeilen –
**Quizzes**, Farb-Gedächtnis, Cello-Noten, Ton-Gedächtnis und „Wer war’s?“. Die Quizzes führen zu den Karten der Welten. Eine Karte zoomt beim
Antippen auf den ganzen Bildschirm und wird zur Welt; ← führt zurück zum Dashboard. Es gibt fünf Welten: 🐋 Wale, 🦈 Haie, 🌊 Beide (Wale und Haie gemischt),
🏎️ Porsche und 🐕 Dackel. Jede Welt hat eigene Abzeichen; Lernstand und Lexikon funktionieren überall.

## 🧬 Spielekiste 2.0: eine Plattform statt einer Sammlung
Die Schicht über allen Spielen steckt in `plattform.js` und `experimente.js`. Sie liest den Verlauf und die vorhandenen
Spielstände, alte Stände zählen also sofort mit und werden nicht verändert.
- **Ein Kalendertag für alle:** `heute()` rechnet in **Europe/Berlin**. Tagesrätsel, Tagesaufgaben und Experiment der Woche
  wechseln um 0:00 Uhr deutscher Zeit, auch auf Geräten in anderen Zeitzonen.
- **Tagesaufgaben 🧠 Daily Brain · 👁️ Daily Sense · 🎲 Daily Chaos:** Aus dem Datum wird per Seed ausgewählt, welches Spiel dran
  ist (Brain: Tatort, Wachen, Alibi-Raster, Verhör, Funktions-Detektiv, Piranha; Sense: Farben, Töne, Augenmaß, Takt; Chaos:
  Karte, Punktwolke, Riff, Tiefgang, Zufall, Piranha, Verhör, Funktion – nie dasselbe Spiel wie Brain). Gestartet wird der
  **vorhandene Tagesmodus** des Spiels, der für alle dieselben Aufgaben erzeugt. Krimi-Stufe nach Wochentag (Mo leicht, Di–Do
  mittel, Fr–So schwer). Erkannt wird der Abschluss am Verlaufseintrag; normale Runden zählen nicht. Serie, längste Serie,
  perfekte Tage, Wochenübersicht, Teilen als Text und als Ergebnis-Karte.
- **Fortschritt:** XP und Level werden aus dem Verlauf berechnet (nichts Neues zu speichern). Jede Runde 10 XP + bis zu 20 XP für
  Leistung × Schwierigkeit; pro Spiel und Tag zählen die ersten zwei Runden voll, dann 60 %, 35 %, 20 %, 10 %, danach nichts mehr.
  Tagesaufgabe 40 XP (+40 für alle drei), Experiment 40 XP (einmal je Experiment), Erfolge mit eigenen XP.
  Level n braucht 50·(n−1)·(n+2) XP; Titel von „Frischling“ bis „Universalgenie“.
- **12 spielübergreifende Erfolge**, darunter Meisterdetektiv, Absolutes Gehör?, Universalgenie und Experimentierfreudig. Sie
  nutzen die vorhandenen Stände: Krimi-Lösungen, Piranha-Sterne, Slowenisch-Stationen, Quiz-Abzeichen und Tierleben.
  Das Datum, an dem ein Erfolg erreicht wurde, wird gespeichert.
- **Fähigkeitenprofil:** Sieben Werte (Logik, Gehör, Sehen, Raum, Zahlen, Timing, Gedächtnis) von 0 bis 100 im Radar. Antippen
  zeigt die Rechnung. Je Spiel zählen die letzten 30 Runden als Ergebnis × Schwierigkeit (Leicht ×0,8, Schwer ×1,15, höchstens
  100 %), daraus der Schnitt der besseren 60 %. Beim Krimi zählt das Tempo im Verhältnis zur Stufe, jeder Hinweis kostet 12 %.
  Wenig Erfahrung senkt den Wert (bis auf 50 %), pro Tag zählen höchstens drei Runden als Erfahrung. Mit nur leichten Runden
  bleibt man unter 80. Dazu Stärke und Schwäche, der Vergleich mit dem eigenen Stand vor 30 Tagen und ein Titel nach der
  stärksten Fähigkeit. Ausdrücklich gilt: spielinterne Leistungsanzeige, kein Intelligenz- oder Persönlichkeitstest.
- **Vergleichen:** Andere Profile auf demselben Gerät sind per Knopf vergleichbar. Für andere Geräte gibt es einen
  **Vergleichscode** (`SK1.…`, enthält nur Name, Avatar, Level und die sieben Werte). Es gibt keinen Server; nichts wird gespeichert.
- **Ergebnis-Karten:** Spielkarten-Design 1080×1350 als PNG, mit Rekord-Erkennung. Sie lassen sich teilen (Teilen-Menü des
  Geräts) oder herunterladen: für Tagesaufgaben, jede der letzten Runden und Experimente.
- **🧪 Das Experiment der Woche:** ein eigenes Labor mit Archiv der letzten acht Wochen. Experimente sind Module
  (`LAB_EXPERIMENTE`): eigene Versuchsanordnung oder ein vorhandenes Spiel. Bisher gibt es drei Experimente:
  - *Das Grau, das lügt* (Simultankontrast, mit Kontrollrunde)
  - *Der Anker im Kopf* (Ankereffekt nach Tversky & Kahneman, mit zufällig verteilten hohen und niedrigen Ankern)
  - *Ein Leben in 42 Tagen* (nutzt „Ein Tierleben“)

  Überraschungen entstehen nur aus der Versuchsanordnung, nie aus vorgetäuschten Fehlern.
- **Dashboard 2.0:** Oben stehen Begrüßung, Level-Ring, XP und Mini-Radar (öffnet das Profil), darunter die drei
  Tageskarten und das Experiment. Ganz oben steht „Das Original“ (die Quizzes), danach die Spiele nach Kategorien (Denken & Logik, Sinne & Wahrnehmung, Zahlen & Welt,
  Wissen & Sprache, Perspektivwechsel). Unten folgen Zuletzt gespielt (mit Karte), nächste Erfolge, Bestenliste und Verlauf.
- **Tests** (`tests/`, Ergebnisse in `tests/BERICHT.md`): Generator-Tests mit 1000 Fällen je Generator, Plattform-Integrationstest
  und ein Rauchtest, der alle Spiele öffnet.

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
- `plattform.js` – Spielekiste 2.0: Fortschritt, Erfolge, Tagesaufgaben, Fähigkeitenprofil, Ergebnis-Karten, Vergleich, Dashboard-Kopf
- `experimente.js` – Das Experiment der Woche (Labor, Archiv, Experimente)
- `tests/` – automatisierte Tests (Playwright gegen die echte App) und Testbericht
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
- `spotify.js` – Spotify-Anbindung fürs Song-Rätsel („Song erkennen“, PKCE-Anmeldung, Wiedergabe über Spotify Connect)
- `songs.js` – Song-Rätsel im Ton-Gedächtnis (Wie geht’s weiter? / Rückwärts, eigene Songs)
- `takt.js` – Takt-Gefühl (Zeitgefühl, Tempo, Taktart)
- `verlauf.js` – Verlauf & Statistik
- `tiefgang.js` – Tiefgang
- `riff.js` – Riffbau
- `punkte.js` – Punktwolke (Korrelation schätzen und sortieren)
- `funktion.js` – Funktions-Detektiv (Funktionsgraphen lesen und nachbauen)
- `zufall.js` – Zufalls-Gefühl (Wahrscheinlichkeiten schätzen, live simulieren)
- `zahlen.js` – Du in Zahlen (das eigene Leben in belegten Zahlen)
- `tierleben.js` – Ein Tierleben (Nutztiere nach Schlachtzahlen, bedrohte Arten)
- `tierpixel.js` – Ein Tierleben als Pixel-Abenteuer (eigene 16×16-Pixelgrafik, Kachelkarten, Steuerkreuz)
- `piranha.js` – Piranha-Schwarm (Fluss-Puzzle mit Löser)
- `fuehrung.js` – Hilfe für alle Spiele: Spickzettel (?), geführte Einführung mit Aufträgen, Übungsfälle für „Wer war’s?“
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

## 🎵 Song-Rätsel (im Ton-Gedächtnis)
Zwei Modi (`songs.js`), je 5 Runden, bis zu 50 Punkte, Bestwerte und Verlauf wie die anderen Ton-Übungen:
- **⏸️ Wie geht’s weiter?** Ein Lied läuft und stoppt – auf der Klaviertastatur den nächsten Ton suchen (Tasten zum
  Ausprobieren antippen, dann bestätigen; Oktave egal). Leicht: von vorn, Titel sichtbar, nur Töne aus dem Lied. Mittel:
  mitten im Lied, Titel geheim. Profi: kurzer Ausschnitt in zufälliger anderer Tonart. Richtig 10, ein Halbton daneben 3.
- **⏪ Rückwärts:** Ein Ausschnitt läuft wirklich rückwärts (umgedrehte Audiodaten) – welches Lied? 3/4/6 Antworten,
  höchstens 3/2/1× hören, früheres Erkennen gibt mehr Punkte (10/7/4). Danach läuft er vorwärts.
- **Quellen:** 14 gemeinfreie Lieder (Alle meine Entchen, Bruder Jakob, Stille Nacht, Für Elise, Jingle Bells …), offline
  als Klavierklang gerendert – oder **eigene Songs** (MP3/M4A/WAV … aus der Dateien-App). Diese bleiben nur im Browser
  (IndexedDB), nichts wird hochgeladen. Bei eigenen Songs erkennt ein YIN-Tonhöhendetektor eine Stelle, an der ein neuer,
  klar gehaltener Ton beginnt; dort stoppt das Lied. Volle Mischungen können falsch erkannt werden – dann lässt sich die
  Runde streichen.
- **🟢 Spotify (Premium):** Modus „Song erkennen“ – Ausschnitte aus deinen Lieblingssongs und Meistgehörten
  (Leicht 4 s vom Anfang, Mittel 2 s, Profi 1 s irgendwo im Song, 4–6 Antworten). Abgespielt wird über Spotify Connect
  in deiner Spotify-App; die Länge wird an Spotifys eigenem Fortschritt gemessen, Netzverzögerung zählt nicht mit.
  Einmalig einrichten: auf developer.spotify.com/dashboard eine App anlegen (kostenlos, Development Mode, max. 5 Nutzer),
  die im Menü angezeigte Redirect-URI (muss HTTPS sein) eintragen und die Client ID einfügen. Anmeldung per PKCE ohne
  Server. Rechte: nur Bibliothek lesen und Wiedergabe steuern. Token bleiben im Browser (`walquiz.spotify.v1`).
- **Was mit Spotify/YouTube nicht geht:** Rückwärts und Tonerkennung – der Ton läuft in der Spotify-App bzw. im fremden
  YouTube-iframe, eine Web-App kommt nicht an die Audiodaten; Hörproben und Tonanalyse gibt Spotify neuen Apps seit
  November 2024 nicht mehr frei. Dafür gibt es eigene Dateien.
- Tests: `tests/songs.test.js` (erzeugt zwei WAV-Testsongs mit bekannten Tönen, prüft Erkennung, Speichern, beide Modi),
  `tests/spotify.test.js` (gegen ein nachgebautes Spotify: PKCE, Token, Titel, Ausschnittlänge, Fehlerfälle).

## 🎼 Gehörbildung (im Ton-Gedächtnis)
Unter dem normalen Ton-Gedächtnis liegen drei Übungen (`gehoer.js`), mit deutschen Notennamen (… A, B, H) und weichem
Klavierklang:
- **↕️ Intervalle (relatives Hören):** Zwei Töne erklingen – welcher Abstand ist das?
  - Leicht: große Sekunde, große Terz, Quinte und Oktave, aufwärts.
  - Mittel: dazu kleine Terz, Quarte und große Sexte, auf- und abwärts.
  - Profi: alle 12 Intervalle, auch gleichzeitig angeschlagen.

  Nach jeder Antwort gibt es eine Eselsbrücke, zum Beispiel „Alle meine Entchen“ für die Sekunde, „O Tannenbaum“ für die
  Quarte oder „Morgen kommt der Weihnachtsmann“ für die Quinte.
- **🏷️ Töne benennen:** Auf einer Klaviatur tippt man, welcher Ton das war.
  - Leicht: nur weiße Tasten, vorher erklingt ein C.
  - Mittel: alle 12 Töne, vorher ein C.
  - Profi: ohne Referenz, in drei Oktaven – das ist absolutes Gehör.

  Liegt man einen Halbton daneben, gibt es einen Punkt.
- **🎯 Ton einstellen:** „Stell ein G ein“ – mit dem Schieber über drei Oktaven, festhalten lässt den Ton hören.
  - Leicht: vorher erklingt ein C.
  - Mittel: nur am Anfang einmal ein A (440 Hz).
  - Profi: ganz ohne Referenz.

  Gezählt wird der Abstand in Cent zum nächsten Ton dieses Namens, die Oktave ist egal: 10 Punkte minus 1 pro 30 Cent. Danach
  kann man den eigenen Ton und den echten nacheinander anhören.

Jede Übung bringt bis zu 50 Punkte, die Bestwerte werden je Übung und Stufe gespeichert. Die Ergebnisse landen als
„Ton-Gedächtnis“ im Verlauf und zählen damit fürs Gehör im Fähigkeitenprofil, Profi als schwer. Test: `tests/gehoer.test.js`.

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
- **Hilfe:** `?` oben rechts öffnet einen Spickzettel (Richtung → Form → Breite : Länge, Tabelle, typische Fallen).
  Die **geführte Lernrunde** erklärt das Schätzen in Schritten mit Beispielwolken und endet mit drei Übungen, die Schritt für
  Schritt zum Ergebnis führen. In der Auflösung zeigt eine Ellipse die Form der Wolke mit der Faustregel r ≈ (1 − q²) / (1 + q²)
  für q = Breite : Länge (im Mittel etwa ±0,02 genau).

## 📊 Du in Zahlen
Geburtstag (optional Uhrzeit und Geschlecht) eingeben, alles wird nur auf dem Gerät gerechnet:
- **Exakt:** Alter in Jahren/Monaten/Tagen, Tage, Wochen, Stunden, live tickende Sekunden, kommende Meilensteine
  (10 000. Tag, 1 Milliarde Sekunden, 2000 Wochen …), Strecke um die Sonne, Erddrehung, Vollmonde, wie weit das Licht vom
  Geburtstag gekommen ist und welche Sterne es schon erreicht hat.
- **Lebenswochen-Raster** (90 × 52) mit der Lebenserwartung bei Geburt in Deutschland (Destatis 2025: Frauen 83,6, Männer 79,1),
  mit Hinweis, dass das keine persönliche Vorhersage ist.
- **Schätzungen** (deutlich markiert): Herzschläge, Atemzüge, Schlaf, Blinzeln, Haar- und Nagelwachstum nach Durchschnittswerten je Alter.
- **Welt:** Weltbevölkerung bei Geburt und heute, Geburten und Sterbefälle seitdem, ungefähre „Mensch Nr.“ (PRB),
  Lebenserwartung weltweit damals/heute, CO₂ damals/heute, Lebenserwartung in 12 Ländern im Vergleich.
- **Quellen:** Weltbank/UN WPP (Stand 08.10.2026), Destatis PM 236/2026, NOAA Mauna Loa, PRB 2022 – alles auf der Seite aufgeführt.

## 🐾 Ein Tierleben
Ein Leben als Tier – gesellschaftskritisch, aber sachlich und mit Quellen:
- **Als Nutztier geboren werden:** Los nach den echten Schlachtzahlen in Deutschland 2025 (Destatis: 640,3 Mio. Masthühner,
  44,9 Mio. Schweine, 27,6 Mio. Puten, 20,7 Mio. Suppenhühner, 8,3 Mio. Enten, 2,8 Mio. Rinder). Ein Rind wird je zur Hälfte
  Milchkuh oder Mastbulle. Kapitel mit Fakten (Lebensdauer nach dem Bundesinformationszentrum Landwirtschaft, Platz nach der
  Tierschutz-Nutztierhaltungsverordnung); bei den Entscheidungen zeigt sich, dass das Tier kaum etwas entscheiden kann.
  Am Ende: gelebte vs. mögliche Lebenszeit und was sich ändern lässt.
- **Als eine der letzten ihrer Art:** Nordatlantischer Glattwal (384 Tiere, NARWC), Vaquita (6–8, IUCN), Sumatra-Orang-Utan,
  Ostsee-Schweinswal, Weißspitzen-Hochseehai. Entscheidungen beeinflussen das Überleben (als Spielregel gekennzeichnet),
  die Gefahren sind die echten: Schiffe, Netze, Palmöl, Lärm, Flossenhandel.
- Live-Zähler der rechnerischen Schlachtungen seit Öffnen der Seite, Logbuch der gelebten Leben, Einträge im Verlauf.
- **👾 Pixel-Abenteuer** (umschaltbar auf der Startseite): dieselben Leben und Fakten als kleines Retro-Spiel zum Herumlaufen –
  eigene Pixelgrafik mit vier Farbtönen je Welt (Stall, Meer, Wald), Steuerkreuz/Pfeiltasten und A-Knopf, Textbox mit Entscheidungen.
  Im Stall wird es von Kapitel zu Kapitel voller (am Ende quetscht man sich durch), die Tür nach draußen bleibt zu, das Kalb sieht
  die Mutter nur hinter dem Gitter. Bei bedrohten Arten muss man Schiffen, Netzen, Lärm, Plantage und Feuer wirklich ausweichen.
  **Geflügel hat eigene Stationen:** Schlupf aus dem Ei im Brutschrank → Brüterei mit Hordenwagen und Förderbändern, die einen
  mitziehen → Kükenstall mit Wärmelampen („eine Glucke gibt es nicht“) und Nippeltränken → enger Stall mit nasser, stinkender Einstreu,
  die bremst → am Ende schwere Beine (langsam, man muss sich immer wieder hinlegen). Legehennen legen im Nest ein Ei, das sofort
  wegrollt. Der Stall wird enger, bleibt aber übersichtlich; dein Tier hat einen Lichtfleck und einen roten Pfeil, zu Beginn jeder
  Karte (und mit A ohne Schild) zeigt ein Suchring, wo du bist.
  **Die Klappe zur Wiese** (Masthuhn, Legehenne): Dahinter liegt eine Wiese mit Sandbad – mit dem Hinweis, wie wenige Tiere das
  erleben: gut 2 von 100 Masthühnern (1,8 % Bio, Freilandmast selten; BLE/BMEL-Statistik) bzw. rund 38 von 100 Legehennen
  (Freiland 24,3 % + Bio 14,1 % der Haltungsplätze 2025, BMEL-Statistik). Danach geht es zurück in den Stall.
  Am Ende folgt – nach einem Inhaltshinweis, überspringbar – die Schlachtung als Pixel-Animation am Beispiel des
  Elektro-Wasserbads: Ausstallen, Transport, Einhängen, Betäubung, Halsschnitt mit Blut, das in die Blutrinne tropft, dann die
  Tageszahl laut Destatis.

## 🐟 Piranha-Schwarm
Eigenes Puzzle im Genre „Farben sortieren und Pixelbild abbauen“, mit Amazonas-Thema:
- **Bild:** 25 eigene Szenen als Pixelbild mit Hintergrund – zuerst 15 maritime (Buckelwal-Fluke, Kugelbake, Clownfisch,
  Leuchtturm an der Elbe, Orca, Strandkörbe in Duhnen, Seehund im Watt, Containerschiff vor Cuxhaven, Blauwal, Krabbenkutter im Hafen,
  Feuerqualle, Meeresschildkröte, Korallenriff, Hai, Seestern am Strand), dann Amazonas (Wassermelone, Sonnenuntergang am Fluss,
  Tukan, Frosch auf Seerose, Morphofalter, Ara, Piranha, Flussdelfin, Seerose bei Nacht, Erdbeeren). Als kleine Vektorzeichnungen
  auf 36×36 gerastert, auf eine 15-Farben-Palette gerundet und von Kantenresten bereinigt (1 296 Pixel, 6–13 Farben je Bild).
- **Steine und Algen** (ab Level 2, bis zu 4): sperren einen 4×4- bis 5×4-Block – nicht fressbar, kein Durchschwimmen. Ein Kreis
  zeigt die Schlüsselfarbe und wie viele ihrer Pixel noch übrig sind; ist die Farbe ganz weg, bröckelt die Sperre weg.
  Generator und Simulation berücksichtigen das, Levels bleiben lösbar.
- **Genüsslich fressen:** Fische schwimmen langsam und gestaffelt (deckend) zu ihrem Pixel, knabbern es weg (der Pixel schrumpft)
  und schwimmen dann **dick** und noch gemächlicher zurück in den Fluss und in eine von zwei plakativen Felsenhöhlen links und rechts
  (Felsbogen mit Zähnen, leuchtender Rand, Augen im Dunkeln, Seegras). Erst im **Untergrund** werden sie durchsichtig: Sie schwimmen
  als eigene Vollbild-Ebene hinter dem Spiel herum. Rückgängig geht schon, während sie heimschwimmen. Dezentes Seegras und Blasen.
- **Sieg:** Die Fische aus dem Untergrund (und weitere aus den Höhlen) kommen hervor, bilden über dem wieder eingeblendeten Bild ein pulsierendes Herz und
  schwimmen dann durchsichtig über den ganzen Bildschirm (mit Seegras und Blasen, eigene Vollbild-Ebene ohne Klicks). Danach kommt
  die Geschafft-Karte: Sterne, „x Züge von minimal y“ (minimal = Anzahl der Schwärme; zurückgenommene Züge zählen mit), höchste
  Buchtenbelegung, Zahl der satten Fische, Nochmal / Weiter.
- **Höhlen-Raster** (6 Spalten, 26–42 Schwärme): antippbar sind nur Höhlen mit freiem Weg zum Fluss; ab Level 3 versteckte Höhlen ❓ (bis 45 %).
- **Fressen von unten:** Ein Schwarm frisst Pixel seiner Farbe, die von unten erreichbar sind (Flut durch schon Gefressenes).
- **Buchten** (5 → 4): Was nicht gefressen werden kann, wartet und frisst automatisch nach, sobald seine Farbe frei liegt.
  Alle voll → Fluss verstopft, mit ↶ rettbar. ⭐⭐⭐ = höchstens die Hälfte der Buchten gleichzeitig belegt.
- **Levelbau:** rückwärts aus dem Bild (in welcher Reihenfolge Schwärme fressen könnten), dann gezielt gemischt, bis eine
  Spieler-Simulation Schwärme parken muss (ab Level 1, ab Level 5 drei von vier Buchten), aber noch gewinnt – garantiert lösbar.
- Alles passt auf einen Bildschirm (Bild so breit wie möglich, Höhlenreihen passen sich an). Tipp, Rückgängig, Tagesbild.

## 🧠💥 Dopamin-Maschine
Ein absichtlich überladenes Spiel (`dopamin.js`) und zugleich ein Experiment im Labor:
- **Drei Spiele gleichzeitig:** 🫧 Blasen platzen lassen (goldene geben Bonus, jede platzt mit Funkenregen),
  🎰 Slot-Maschine (antippen = drehen; 💎💎💎 = Jackpot mit großem Feuerwerk) und 🎡 Roulette (unten ROT oder SCHWARZ
  setzen, Tippen aufs Rad wiederholt den letzten Einsatz; europäischer Kessel mit 37 Fächern, die 0 gewinnt die Bank).
- **Feuerwerk:** jeder Gewinn und jede geplatzte Blase gibt Funken, große Gewinne schießen Raketen über den ganzen Bildschirm.
- **Darunter** läuft ein selbstgezeichnetes Block-Parkour als endloses „Video“ (Block-Fuchs, Lava, Lücken, Respawn).
- **Mechaniken:** Combo und Multiplikator bis ×10, Level mit immer etwas längerem Balken, Zufallsgewinne, Slot-Jackpot (3 %),
  eingebaute Beinahe-Gewinne (35 % der Slot-Drehungen; das Roulette dagegen ist ehrlich zufällig, Hausvorteil 2,7 %), Konfetti, Wackeln, Töne, die mit der Combo höher werden, pulsierende Farben.
- **Sicherheit:** kein Stroboskop. Farbwechsel sind weich, kurzes Aufhellen höchstens alle 500 ms (gemessen im Test: 0,3 pro
  Sekunde). Vorher gibt es einen Hinweis und einen „Ruhig“-Modus. Alle 5 Minuten kommt ein Pausen-Hinweis, die Spielzeit ist immer sichtbar.
- **Auflösung am Ende:** Punkte (wert: 0 €), Spielzeit, Belohnungen pro Minute und jeder Trick mit der Zahl, wie oft er
  benutzt wurde: Zufallsbelohnungen, Beinahe-Gewinne, Fortschritt ohne Ende, Verlustangst, Aufmerksamkeitswechsel, Roulette-Hausvorteil,
  Feuerwerk für Kleinigkeiten, Töne und Farben. Test: `tests/dopamin.test.js`.

## 🐉 Slowenisch mit Zmajček
Eigenes Sprachlernspiel (`slo.js`): Mit Zmajček, dem kleinen Drachen aus dem Wappen von Ljubljana, reist man durch Slowenien.
- **20 Stationen mit 241 Wörtern und 122 Sätzen:** Ljubljana (Begrüßen), Bled (Sich vorstellen), Piran (Zahlen), Postojna (Farben),
  Maribor (Essen & Trinken), Ptuj (Familie), Soča (Tiere), Celje (In der Stadt), Kranjska Gora (Tage & Wetter), Triglav (Natur),
  Lipica (Unterhalten), Planica (Körper & Gesundheit), Idrija (Kleidung), Škofja Loka (Zuhause), Novo mesto (Schule & Arbeit),
  Bovec (Freizeit), Kras (Einkaufen), Velika planina (Zeit & Uhrzeit), Koper (Reisen), Portorož (Gefühle). Jede Station hat einen
  💡 Tipp mit Grammatik (Du/Sie, biti, Dual, Fälle, Endungen, Befehlsform), Aussprache und Landeskunde.
- **Drei Stufen je Station:** neue Wörter → Sätze → Meistern. Stufe 1 öffnet die nächste Station, nach Stufe 3 gibt es 👑 und Wiederholen.
- **Aufgaben:** neues Wort, Bild wählen, Übersetzung in beide Richtungen, Paare finden, Satz verstehen, Satz aus Kacheln bauen
  (Slowenisch und Deutsch), Lücke füllen, Wort tippen (č š ž-Tasten, fehlende Häkchen zählen als „fast richtig“), **Hören** und
  **Diktat** („Tippe, was du hörst“, 🔊 und 🐢 langsam) sowie **Nachsprechen** mit dem Mikrofon (Spracherkennung `sl-SI`, 60 % der
  Wörter müssen erkannt werden; „Gerade nicht sprechen“ schaltet es eine Stunde ab). Slowenische Antworten werden beim Antippen
  vorgelesen. Falsches kommt am Ende der Lektion noch einmal, Serien richtiger Antworten zeigen eine 🔥-Combo.
- **Ton:** Liegen Aufnahmen in `audio/slo/` (mit `index.json`: normierter Text → Datei), spielt die App diese ab; sonst nutzt sie
  eine slowenische Systemstimme, falls das Gerät eine hat. Ohne beides sind Hören und Diktat ausgeblendet.
- **Zmajček lebt:**
  - Der Drache schlägt mit den Flügeln, blinzelt, pustet Rauchwölkchen aus den Nüstern und sprüht Funken, wenn du richtig liegst.
  - Er fliegt auf der Karte zur aktuellen Station und dreht einen Looping, wenn man ihn antippt (mit neuem Spruch).
  - In der Lektion sitzt er neben dem Fortschrittsbalken und hüpft oder ist traurig.
  - Am Ende fliegt er jubelnd Kreise.
- **Reise-Karte als ein langes Bild:** Das Slowenien-Bild (`img/slo/reise-slowenien.webp`) scrollt mit, 1,7-fach in die Höhe gezogen.
  Die 20 Stationen sitzen auf dem gemalten, leuchtenden Weg (`SLO_PFAD`), in gleichen Höhenabständen entlang des Weges. Die
  Positionen wurden aus den Pfad-Pixeln des Bildes ermittelt. Die Reise beginnt unten bei der Fahne (Ljubljana) und führt hinauf
  zu den Bergen; beim Öffnen springt die Karte zur aktuellen Station. Oben bleibt eine schmale **Kopfleiste** stehen (Tages-XP-Ring, Serie, XP, Wörter,
  Üben, Wörter). **Zmajček** sucht sich beim Zeichnen der Karte selbst einen Platz neben der aktuellen Station: Er probiert
  144 Stellen rundherum und nimmt die nächste, an der er keinen Knopf und kein Schild verdeckt. Reicht der Platz nicht für die
  Sprechblase, setzt er sich ohne Blase hin und zeigt den Spruch beim Antippen. Test: `tests/slo-karte.test.js` prüft alle
  20 Stationen auf iPhone SE, iPhone 13 und iPad. Hinter der übrigen App liegt dasselbe Bild abgedunkelt.
- **Wie bei Duolingo:** „Ich weiß es nicht“ zeigt die Lösung (sie zählt als falsch und kommt am Ende der Lektion wieder),
  „🙊 Ich kann gerade nicht sprechen“ und „🔇 Ich kann gerade nicht hören“ schalten die jeweiligen Aufgaben für eine Stunde ab.
  Auf der Karte kann man sie mit einem Schalter wieder einschalten.
- **Sprechen geht immer:** Kann das Gerät kein Slowenisch erkennen (auf dem iPhone der Normalfall: `service-not-allowed`), nimmt
  die App dich auf. Die Aufnahme stoppt selbst nach gut einer Sekunde Stille. Danach prüft die App ohne Nachfrage, ob du
  gesprochen hast und ob Länge und Silbenzahl ungefähr zum Satz passen: Lautstärke-Gipfel gegen Vokale, das silbische r zählt
  mit. Passt es, geht es direkt weiter. Sonst kommt ein Hinweis („zu kurz“, „nichts gehört“ …), und ab dem zweiten Versuch
  gibt es „Trotzdem weiter“. Die Aussprache selbst kann die App so nicht prüfen. Die Aufnahme bleibt auf dem Gerät.
  **🩺 Mikrofon-Check** auf der Karte: Mikrofon, Aufnahme, Spracherkennung, letzter Fehler, Browser oder Home-Bildschirm-App.
- **Fehler der Spracherkennung** werden erklärt: `service-not-allowed` (iPhone: Diktierfunktion aktivieren; in der App vom
  Home-Bildschirm blockiert iOS die Erkennung oft – dann in Safari öffnen), fehlender Mikrofon-Zugriff, kein Mikrofon,
  Sprache nicht unterstützt. Danach geht es mit „Weiter ohne Sprechen“ weiter, Nachsprechen ist dann einen Tag aus.
  Test: `tests/slo.test.js`.
- **XP & Tagesziel:** 10 XP je Lektion, +5 ohne Fehler, +5 in Stufe 3; Ring fürs Tagesziel (30 XP), Serie 🔥, Wortstärke je Wort,
  „💪 Üben“ mit den schwächsten Wörtern, „📖 Wörter“ als Wörterbuch. Ergebnisse landen im Verlauf.

## 🧑‍🏫 Führung in allen Spielen
`fuehrung.js` gibt jedem Spiel (außer den Quizzes) Hilfe zum Lernen:
- **?-Knopf** oben rechts: Spickzettel mit Regeln, Punktewertung und Tricks.
- **Geführte Einführung** (Knopf auf der Startseite des Spiels oder im Spickzettel): Schritt für Schritt mit Bildern und
  kleinen Aufträgen, die erst weitergehen, wenn sie gelöst sind (überspringbar). Beispiele: Farbton mit dem Regler treffen,
  Ton nach Gehör finden, 2 Sekunden halten, im Takt tippen, Linie halbieren, Schwerpunkt antippen, Berlin auf der Karte finden,
  Tiefgang-Risiko abwägen (aus den echten Kartengewichten berechnet), Riff-Punkte zählen, Noten im Bass- und Violinschlüssel lesen.
- **Erstes Öffnen:** Der ?-Knopf leuchtet und eine Sprechblase weist auf die Einführung hin (einmal je Spiel und Profil).
- **Wer war’s?:** In der Regel-Hilfe jedes Modus ein Übungsfall – Queens (Sperrfelder, kleinster Raum, Raum in einer Reihe),
  Murdoku, Verhör (Annahmen durchprobieren) und Alibi-Raster (zum Selberlösen).
- Punktwolke, Funktions-Detektiv und Zufalls-Gefühl haben eigene, ausführliche Lernrunden.

## 🕵️ Funktions-Detektiv
Funktionsgraphen lesen lernen, auf einer Schultafel. Fünf Runden, bis zu 50 Punkte:
- **Formel finden:** Kurve sehen, aus vier Gleichungen die richtige wählen. Die falschen sind typische Verwechslungen
  (Vorzeichen, Verschiebung in die falsche Richtung, Kehrwert der Steigung …).
- **Graph finden:** Gleichung sehen, aus vier Kurven die richtige tippen.
- **Nachbauen:** Die gestrichelte Kurve mit Reglern nachstellen; Punkte nach mittlerem Abstand der Kurven.
- Stufen: Leicht (Geraden, einfache Parabeln), Mittel (verschobene Parabeln, Betrag), Profi (Sinus, Exponential, Wurzel).
- Jede Auflösung zeigt am Bild, wie man abliest: y-Achsenabschnitt und Steigungsdreieck, Scheitel/Knick/Startpunkt,
  Mittellinie, Grenzlinie, mit nummerierten Schritten.
- **Geführte Lernrunde:** sechs Aufträge mit Reglern (b, m, fallende Gerade, a der Parabel, Scheitel verschieben, Welle),
  jeder wird erst freigeschaltet, wenn die Kurve genau sitzt. `?` öffnet einen Spickzettel mit allen Familien.
- Tages-Fall, Bestwerte je Profil, Challenge-Links (`?funktion=`).

## 🎲 Zufalls-Gefühl
Wahrscheinlichkeiten schätzen: Würfel, Münzen, Kugeln, Karten, Geburtstage, Serien, Ziegenproblem. Nach jedem Tipp
läuft eine **Live-Simulation mit 1000 Versuchen**, die Trefferquote pendelt sich sichtbar beim exakten Wert ein.
Danach der Rechenweg mit Bild: 6×6-Würfeltafel, Baumdiagramm, Pascal-Balken, Gegenwahrscheinlichkeits-Kette, Kurven.
- Alle exakten Werte sind gegen 20 000 Simulationen je Aufgabe geprüft.
- **Geführte Lernrunde:** günstig ÷ möglich, die 36er-Tafel, Baum (malnehmen), Gegenteil, Gesetz der großen Zahlen,
  Geburtstagsparadoxon. Spickzettel unter `?`.
- Tages-Zufall, Bestwerte je Profil, Challenge-Links (`?zufall=`).

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

## 🤿 Tiefgang (Push your luck)
Eigenes Tauchspiel, angelehnt an das beliebte Push-your-luck-Genre: fünf Tauchgänge, mit jedem Schritt 10 m tiefer, jede Tiefe
deckt einen Fund auf (Muschel 1 bis versunkene Krone 9 Punkte), eine Tier-Sichtung (Sonnen-, Dämmer-, Mitternachtszone) oder
eine Gefahr (Qualle, Strömung, Druck). Zweimal dieselbe Gefahr im selben Tauchgang = Beute verloren; Auftauchen sichert sie.
Luft begrenzt die Schritte, Luftblasen geben Luft zurück, jede neue Tierart im Logbuch +2. Stufen: Leicht zeigt das Risiko des
nächsten Schritts in %, Profi hat weniger Luft und mehr Gefahren. Tagestauchgang und Challenge-Links (gleiche Karte an gleicher
Stelle für alle). Balance per Simulation geprüft: Kluges Abwägen (Risiko < 20 %) schlägt Vorsicht und Gier.

## 🎲 Riffbau (Roll & Write)
Eigenes Würfel-Puzzle im Roll-&-Write-Genre: 6×6-Riff mit Felsen und Fischen, 10 Runden. Ein Würfel zeigt die Form
(Einzeln, Zweier, Dreier, Ecke, Block, Joker), einer die Korallenfarbe (fünf Farben oder Joker). Form drehen, Feld antippen
(zweimal tippen = setzen) – oder passen, wenn nichts passt. Wertung: Farbflächen ab 3 Feldern = Größe, volle Reihe/Spalte +4,
satte Fische (Feld in Lieblingsfarbe) +4. Tagesriff, Challenge-Links (gleiche Würfe) und Teilen als Emoji-Raster.

## 📅 Verlauf & Statistik
Jedes Spiel trägt beim Ende einen Eintrag in den Verlauf ein (Spiel, Punkte, Stufe, Uhrzeit), je Profil, die letzten 400 Tage.
Die Karte „Dein Verlauf“ im Dashboard zeigt die Tagesserie 🔥 und die letzten 7 Tage. Der Verlaufs-Bildschirm zeigt Serie,
heutige Runden, Runden gesamt, längste Serie, einen Kalender der letzten 15 Wochen (Tag antippen = Einträge des Tages)
und je Spiel Anzahl, Bestwert, Schnitt der letzten 7 Runden und eine Verlaufskurve. Code: `verlauf.js` (`merkeVerlauf`).

## 🎮 Dashboard „Spiele“
- Bunter Neon-Look: dunkler Hintergrund mit wandernden Farbflecken.
- Oben ein **Universum**: Nebel, funkelnde Sterne, Sternschnuppe und eine leuchtende Sonne. Alle Spiele kreisen auf drei
  gekippten Umlaufbahnen um sie – tanzende Farbbalken, Cello-Noten, Tonwelle, Metronom, Mini-Punktwolke, Winkel, Kompass, Lupe,
  Würfel, Funktionstafel, Porsche, Gretchen, ein Wal im All und Planeten für Hai-Quiz, Tiefgang, Piranha-Schwarm, Tierleben,
  Du in Zahlen und Riffbau. Vorn auf der Bahn groß und hell, hinten klein und hinter der Sonne (nur `translate`/`scale`,
  pausiert außerhalb des Bildschirms). Jedes Objekt startet sein Spiel.
- **App-Symbol** und Startbilder: Ringplanet im Sternennebel mit drei bunten Monden (Home-Bildschirm, Manifest, Favicon).
  Jede Figur ist ein Schnellstart in ihr Spiel (mit Flip und Emoji-Regen). Rechts oben: Profilbild zum Wechseln.
- **Games** als Zeilen mit rundem Bild, Stand und ▶: **Quizzes** (im Kreis wechseln die Welten als Diashow), Farb-Gedächtnis,
  Noten & Griffe (Cello, Klavier, Gitarre, Ukulele), Ton-Gedächtnis, Takt-Gefühl, Punktwolke, Augenmaß, Karten-Gefühl, Tiefgang, Riffbau und „Wer war’s?“. Die Quizzes führen zur Welt-Auswahl mit den bunten Karten jeder Welt.
- Akku: Farbflecken als Verlauf statt Weichzeichner, Bühne und Diashow pausieren außerhalb des Bildschirms; „Bewegung reduzieren“ wird beachtet.
