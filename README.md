# Wal-Quiz – Seepferdchen der Walkunde

Die App startet mit dem **Dashboard „Spiele“**: oben Statistiken (Abzeichen, gelernte Arten, Farb-Rekord),
darunter die **Quizzes** als Karten im Look ihrer Welt und die **Games** (Farb-Gedächtnis). Eine Karte zoomt beim
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
- `groesse.js` – Größenvergleich
- `sw.js`, `manifest.webmanifest`, `icons/` – Installation und Offline-Nutzung

## Auf dem Handy nutzen
Die Dateien müssen über HTTPS ausgeliefert werden, z. B. mit GitHub Pages
(Repo → Settings → Pages → Branch auswählen). Danach die Seite öffnen und:
- **iPhone (Safari):** Teilen → „Zum Home-Bildschirm“
- **Android (Chrome):** Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“

Fotos, die einmal angezeigt wurden, sind danach auch offline verfügbar.

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.

## Bildquellen
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

## 🎨 Farb-Gedächtnis (Bonus-Spiel)
Eigenes Spiel, angelehnt an das Prinzip „Farbe merken und nachmischen“: Eine Farbe füllt kurz den Bildschirm
(Leicht 5 s, Mittel 3 s, Profi 1,5 s), dann wird sie mit Farbton, Sättigung und Helligkeit nachgemischt.
Punkte 0–10 pro Farbe nach dem Farbabstand CIEDE2000 (ab Abstand 50 gibt es 0), fünf Farben = bis zu 50 Punkte.
Bestwerte je Stufe, Tagesfarben (aus dem Datum berechnet, für alle gleich) und Challenge-Links mit denselben Farben.
Code in `farben.js`, Design in `stil.css`.

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
