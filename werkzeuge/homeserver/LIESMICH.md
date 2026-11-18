# Spielekiste auf dem eigenen Homeserver (mit Konten und Spielstand-Sync)

Die App läuft wie gewohnt auch ohne Server (z. B. GitHub Pages) – dann bleibt der Spielstand auf dem Gerät.
Läuft daneben `spielstand-server.js`, fragt die App beim ersten Besuch einmal nach **Name + PIN**
(Anmelden oder neues Konto). Das Gerät merkt sich die Anmeldung, der Spielstand ist auf allen Geräten gleich.

## Ablauf
- Vollautomatisch, ohne Rückfragen: Nach dem Spielen (Prüfung alle 5 s, nur wenn das Spiel etwas gespeichert hat)
  und beim Verlassen der App gehen die geänderten Einträge zum Server. Beim Öffnen und Zurückkehren holt sich das
  Gerät nur, was andere Geräte seitdem geändert haben, und lädt dann einmal neu. Jede Person hat ihren eigenen Stand.
- Zusammengeführt wird Eintrag für Eintrag (jedes Spiel hat eigene Einträge): Spielst du auf dem Handy Farben und
  am Laptop Krimi, bleibt beides. Ändern zwei Geräte denselben Eintrag, gewinnt die zuletzt angekommene Änderung.
  Was ein lange nicht benutztes Gerät beim Öffnen noch an altem Stand hat, überschreibt nie Neueres.
- Täglich entsteht eine Kopie in `daten/archiv/`.
- Bestenliste: Jedes Konto schickt beim Abgleich eine kleine Zusammenfassung (Level, XP, Titel, Avatar, Serie,
  Fähigkeitswerte) mit – nur die ist für andere sichtbar, nie der Spielstand. Im Dashboard zeigt „🌍 Bestenliste“
  alle registrierten Spieler nach XP mit stärkster Fähigkeit und Lieblingsspiel; Antippen zeigt alle Stärken,
  die meistgespielten Spiele und vergleicht die Fähigkeiten im Radar. Nur für Angemeldete. Liegt in
  `daten/bestenliste.json`.
- Duelle: In der Bestenliste jemanden antippen → „⚔️ Zum Duell herausfordern“ → Spiel wählen (oder Zufall). Beide
  spielen genau dieselbe Runde (gleicher Seed, Stufe „mittel“), wann sie wollen; der Zweite sieht das Ziel. Ergebnis,
  Sieger und Duell-Bilanz pro Gegner im Dashboard unter „⚔️ Duelle“. Ablehnen möglich, offen nach 7 Tagen abgelaufen,
  nach 30 Tagen gelöscht. 9 Spiele: Farben, Töne, Augenmaß, Takt, Funktions-Detektiv, Karten-Gefühl, Punktwolke,
  Riffbau, Tiefgang.
- Konto löschen: ☁️ → „Konto löschen“ mit PIN – löscht Konto, Spielstand, Tageskopien, Bestenliste und Duelle.
  Tageskopien werden ohnehin nach 30 Tagen gelöscht.
- Angemeldet erinnert die App nicht mehr an die Datei-Sicherung (der Server sichert); 💾 bleibt für eigene Songs.
- Namen sind eindeutig (Groß-/Kleinschreibung egal), PIN 4–8 Ziffern, nur als Hash gespeichert.
  Nach 5 falschen PINs ist der Name 15 Minuten gesperrt (danach jeweils doppelt so lange).
  Höchstens 5 neue Konten pro Stunde und Anschluss, höchstens 50 Konten.
- PIN vergessen: Eintrag in `daten/konten.json` löschen (Server vorher beenden), dann neu registrieren –
  der Spielstand in `daten/staende/` bleibt und gehört danach wieder zum neuen Konto mit gleichem Namen.
- Nicht synchronisiert: eigene Songs (zu groß, liegen in IndexedDB), Foto-Zwischenspeicher, Sicherungs-Erinnerung.

## Einrichtung unter Windows
1. Node.js installieren: `winget install OpenJS.NodeJS.LTS`
2. `spielstand-server.js` nach `C:\homeserver\` kopieren und starten:
   `node C:\homeserver\spielstand-server.js --daten C:\homeserver\daten`
3. `Caddyfile.beispiel` als `C:\homeserver\Caddyfile` speichern, Adresse anpassen, Caddy starten.

## Autostart und Updates unter Windows (`windows/`)
- `einrichten.bat` (einmalig, fragt nach Administratorrechten): legt in der Aufgabenplanung unter „Spielekiste“ an:
  **Caddy** und **Konto-Server** (starten mit Windows als SYSTEM, ohne Fenster, nach Absturz neu) und **Update**
  (`wachen.ps1`: prüft alle 5 Minuten, ob es auf GitHub eine neue Version gibt). Übernimmt Caddys Zertifikat nach `caddy-daten\`. Protokolle: `caddy.log`, `konto-server.log`.
- `aktualisieren.bat` (Doppelklick): holt sofort die neueste Version. Alle 5 Minuten läuft dasselbe automatisch, aber nur
  wenn es auf GitHub etwas Neues gibt – eine Änderung auf dem Zweig ist also spätestens nach 5 Minuten live. Spielstände, Caddyfile und Zertifikate bleiben; startet der neue Konto-Server
  nicht, kommt die vorige Version zurück (`spiel-vorher\`). Protokoll: `update.log`.
- Zweig: `spielstand-sync`, änderbar über eine Datei `update-zweig.txt` mit dem Zweignamen.
- Die Caddyfile wird nie automatisch geändert.
