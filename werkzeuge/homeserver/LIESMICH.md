# Spielekiste auf dem eigenen Homeserver (mit Spielstand-Sync)

Die App läuft wie gewohnt auch ohne Server (z. B. GitHub Pages) – dann bleibt der Spielstand auf dem Gerät.
Liegt sie auf dem Homeserver mit WebDAV unter `/sync/`, gleicht `sync.js` den Spielstand zwischen allen Geräten ab.

## Ablauf
- Beim Öffnen und beim Zurückkehren in die App wird der Stand vom Server geholt, nach dem Spielen (alle 15 s und
  beim Verlassen der App) wird er hochgeladen.
- Wurde auf zwei Geräten gleichzeitig gespielt, fragt die App, welcher Stand gelten soll. Der andere bleibt als
  `konflikt-….json` im Datenordner liegen.
- Einmal am Tag entsteht `archiv-JJJJ-MM-TT.json` – zum Zurückholen einfach den Inhalt als `stand.json` ablegen
  (dabei `version` höher setzen als in der aktuellen `stand.json`).
- Pro Gerät fragt die App einmal nach dem **Sync-Code**. Er bleibt nur auf dem Gerät.
- Nicht synchronisiert: eigene Songs (zu groß, liegen in IndexedDB), Foto-Zwischenspeicher, Sicherungs-Erinnerung.

## Einrichtung unter Windows
1. Caddy mit WebDAV-Modul laden:
   `https://caddyserver.com/api/download?os=windows&arch=amd64&p=github.com%2Fmholt%2Fcaddy-webdav`
2. Ordner `C:\homeserver\daten` anlegen.
3. `Caddyfile.beispiel` als `C:\homeserver\Caddyfile` speichern, Adresse und `DEIN-SYNC-CODE` anpassen.
4. `caddy validate --config Caddyfile`, dann `caddy run`.
