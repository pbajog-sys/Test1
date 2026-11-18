# Spielekiste auf dem eigenen Homeserver (mit Konten und Spielstand-Sync)

Die App läuft wie gewohnt auch ohne Server (z. B. GitHub Pages) – dann bleibt der Spielstand auf dem Gerät.
Läuft daneben `spielstand-server.js`, fragt die App beim ersten Besuch einmal nach **Name + PIN**
(Anmelden oder neues Konto). Das Gerät merkt sich die Anmeldung, der Spielstand ist auf allen Geräten gleich.

## Ablauf
- Beim Öffnen und beim Zurückkehren in die App wird der Stand geholt, nach dem Spielen (alle 15 s und beim
  Verlassen der App) hochgeladen. Jede Person hat ihren eigenen Spielstand.
- Wurde auf zwei Geräten gleichzeitig gespielt, fragt die App, welcher Stand gelten soll. Der andere bleibt in
  `daten/konflikte/`. Täglich entsteht eine Kopie in `daten/archiv/`.
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
