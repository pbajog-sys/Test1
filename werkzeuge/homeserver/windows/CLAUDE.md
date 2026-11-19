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
- `Update`: `aktualisieren.ps1` – holt die neueste Version, wenn es auf GitHub etwas Neues gibt. Läuft nach Bedarf
  (im ☁️-Fenster der App: „🔍 Updates prüfen“ / „⬆️ Aktualisieren“, nur für das Konto in `admin.txt`;
  der Konto-Server startet dafür die Aufgabe) und zur Sicherheit täglich 04:17. Protokoll `update.log`.
- `DuckDNS`: läuft dauerhaft (`duckdns.ps1`), meldet alle 5 Minuten die IP an DuckDNS, wenn sie sich geändert hat.
  Token/Subdomain nur lokal in `duckdns-token.txt` / `duckdns-domain.txt` (geheim, nie ins Repo). Protokoll `duckdns.log`.
- Einrichten/neu anlegen: `einrichten.bat` (als Administrator).
- `AdGuardHome` (Windows-Dienst, optional): Werbeblocker fürs Heimnetz, installiert über ☁️ → Server → Erweiterungen
  (`spiel\werkzeuge\homeserver\windows\erweiterungen\adguard.ps1`). Verwaltung http://<Laptop-IP>:3000 (nur Heimnetz),
  DNS Port 53. Protokoll `erweiterungen.log`.

## Steuerung aus der App
☁️ → Server → 🎛️ Steuerung (nur Admin): Zustand, Dienste neu starten, Laptop neu starten, Protokolle ansehen.
Fernzugriff auf den Bildschirm: Chrome Remote Desktop (falls eingerichtet).

## Typische Aufgaben
- Sofort aktualisieren: `aktualisieren.bat` (oder `powershell -ExecutionPolicy Bypass -File aktualisieren.ps1 -Erzwingen`).
- Läuft alles? Konto-Server: `http://127.0.0.1:8090/api/ich` muss mit 401 antworten. Caddy: Prozess `caddy_windows_amd64`.
- Caddyfile ändern: vorher sichern, danach `caddy_windows_amd64.exe validate --config Caddyfile`, dann Aufgabe `Caddy` neu starten.

## Regeln
- `daten\` nie löschen oder überschreiben; vor Eingriffen eine Kopie anlegen (z. B. `daten-sicherung-JJJJ-MM-TT\`).
- Die PINs stehen nur als Hash in `konten.json` – nie versuchen, sie auszulesen.
- Am Spiel selbst wird im GitHub-Repo gearbeitet, nicht in `spiel\` (wird beim nächsten Update überschrieben).
- Keine weiteren Ports öffnen; der Konto-Server bleibt auf 127.0.0.1.
