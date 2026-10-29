# Wal-Quiz – Seepferdchen der Walkunde

Mit Umschalter zwischen drei Welten: 🐋 Wale, 🦈 Haie und 🌊 Beide (gemischt). Jede Welt hat
eigene Abzeichen; Lernstand und Lexikon funktionieren überall.

Eine Web-App (PWA) zum Lernen von Walarten. Sie läuft auf iPhone und Android im Browser
und lässt sich wie eine App auf den Home-Bildschirm legen.

## Modi
- **Üben:** Pro Wal 3 Fotos zum Durchwischen, du wählst aus 6 Arten. Der Tipp-Knopf verrät nacheinander
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
Die App sucht die Fotos auf dem Gerät über die Wikipedia-Schnittstelle: das Hauptbild des
englischen Wikipedia-Artikels plus weitere Fotos aus dem Artikel (Karten, Skelette, Zeichnungen usw.
werden herausgefiltert). Die Treffer werden im Gerät gespeichert. Arten ohne brauchbares Foto werden
im Quiz übersprungen. Die Tonaufnahmen werden genauso auf Wikimedia Commons gesucht (für iPhones als MP3).

## Dateien
- `index.html` – Aufbau und Aussehen
- `app.js` – Quiz-Logik, Fotos, Töne, Karteikasten, Challenge
- `wale.js`, `haie.js` – Artenlisten mit Steckbriefen
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
