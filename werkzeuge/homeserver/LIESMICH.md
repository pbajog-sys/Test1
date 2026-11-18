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
