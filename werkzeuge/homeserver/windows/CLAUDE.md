# Homeserver „Spielekiste“ (dieser Ordner: C:\homeserver)

Privater Homeserver auf einem Windows-Laptop (Huawei MateBook D, i3-10110U, 8 GB). Er liefert das Browserspiel
„Spielekiste“ aus (Repo github.com/pbajog-sys/Test1, Zweig `spielstand-sync`) und betreibt Konten, Spielstand-Sync,
Bestenliste und Duelle. Erreichbar unter https://spielkiste.duckdns.org (Telekom VDSL, Speedport Smart 4,
Portweiterleitung TCP 80/443 auf diesen Laptop, feste lokale IP).

## Aufbau
| Was | Wo |
|---|---|
| Webserver Caddy | `caddy_windows_amd64.exe` (normales Caddy reicht), Konfiguration `Caddyfile` |
| Caddy-Zertifikate (Let’s Encrypt) | `caddy-daten\` (über XDG_DATA_HOME) |
| Spiel (statische Dateien) | `spiel\` – wird bei jedem Update komplett ersetzt, vorige Version in `spiel-vorher\` |
| Konto-Server (Node.js, ohne Pakete) | `spielstand-server.js`, lauscht nur auf 127.0.0.1:8090, Caddy leitet `/api/*` dorthin |
| **Daten – niemals löschen** | `daten\` (konten.json, sitzungen.json, staende\, archiv\, bestenliste.json, duelle.json) |
| Protokolle | `caddy.log`, `konto-server.log`, `update.log` |
| Version | `version.txt` (Commit auf GitHub) |

## Dienste (Aufgabenplanung, Ordner „Spielekiste“, laufen als SYSTEM)
- `Caddy` und `Konto-Server`: starten mit Windows, Neustart nach Absturz.
  Neu starten: `Stop-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server'` und dann `Start-ScheduledTask …`
  (als Administrator). Caddy übernimmt eine geänderte Caddyfile erst nach Neustart der Aufgabe `Caddy`.
- `Update`: täglich 04:17, `aktualisieren.ps1` – nur wenn es auf GitHub etwas Neues gibt.
- Einrichten/neu anlegen: `einrichten.bat` (als Administrator).

## Typische Aufgaben
- Sofort aktualisieren: `aktualisieren.bat` (oder `powershell -ExecutionPolicy Bypass -File aktualisieren.ps1 -Erzwingen`).
- Läuft alles? Konto-Server: `http://127.0.0.1:8090/api/ich` muss mit 401 antworten. Caddy: Prozess `caddy_windows_amd64`.
- Caddyfile ändern: vorher sichern, danach `caddy_windows_amd64.exe validate --config Caddyfile`, dann Aufgabe `Caddy` neu starten.

## Regeln
- `daten\` nie löschen oder überschreiben; vor Eingriffen eine Kopie anlegen (z. B. `daten-sicherung-JJJJ-MM-TT\`).
- Die PINs stehen nur als Hash in `konten.json` – nie versuchen, sie auszulesen.
- Am Spiel selbst wird im GitHub-Repo gearbeitet, nicht in `spiel\` (wird beim nächsten Update überschrieben).
- Keine weiteren Ports öffnen; der Konto-Server bleibt auf 127.0.0.1.
