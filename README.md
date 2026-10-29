# Wal-Quiz – Seepferdchen der Walkunde

Eine Web-App (PWA) zum Lernen von Walarten. Sie läuft auf iPhone und Android im Browser
und lässt sich wie eine App auf den Home-Bildschirm legen.

## Modi
- **Üben:** Ein Walfoto wird gezeigt, du wählst aus 6 Arten. Nach jeder Antwort gibt es einen kurzen Steckbrief.
- **Seepferdchen der Walkunde (Test):** 10 Fotos, den Namen selbst eintippen. Ab 8 richtigen Antworten
  gibt es das Seepferdchen. Kleine Tippfehler (ein Buchstabe) und gängige Zweitnamen (Orca, Beluga, Minkwal …) zählen als richtig.
- **Wal-Lexikon:** Alle Arten mit Foto und Steckbrief.

## Arten (10)
Blauwal, Buckelwal, Finnwal, Zwergwal, Grauwal, Grönlandwal, Pottwal, Schwertwal, Weißwal, Narwal.
Neue Arten kommen in das Array `WALE` in `index.html`.

## Auf dem Handy nutzen
Die Dateien müssen über HTTPS ausgeliefert werden, z. B. mit GitHub Pages
(Repo → Settings → Pages → Branch auswählen). Danach die Seite öffnen und:
- **iPhone (Safari):** Teilen → „Zum Home-Bildschirm“
- **Android (Chrome):** Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“

Fotos, die einmal angezeigt wurden, sind danach auch offline verfügbar.

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.

## Bildquellen
Die Fotos werden direkt von Wikimedia Commons geladen; jede Quelle ist in der App verlinkt.
Vor einer öffentlichen Veröffentlichung sollten Urheber und Lizenz je Bild ergänzt werden
(stehen auf der jeweiligen Commons-Seite).
