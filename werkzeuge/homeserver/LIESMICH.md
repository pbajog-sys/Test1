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
- Konto löschen: ☁️ → „Konto löschen“ mit PIN – löscht Konto, Spielstand, Tageskopien und Bestenliste.
  Tageskopien werden ohnehin nach 30 Tagen gelöscht.
- Die Datei-Sicherung (💾) ist entfernt – mit Konto sichert der Server. Eigene Songs werden nicht gesichert.
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
  (nach Bedarf über das Server-Menü der App, zur Sicherheit täglich 04:17). Fragt einmal nach dem Admin-Konto (`admin.txt`). Übernimmt Caddys Zertifikat nach `caddy-daten\`. Protokolle: `caddy.log`, `konto-server.log`.
- `aktualisieren.bat` (Doppelklick): holt sofort die neueste Version. Dasselbe startet im **☁️-Fenster** der Bereich **🖥️ Server** (nur für
  das Admin-Konto sichtbar: „🔍 Updates prüfen“ zeigt, was auf GitHub neu ist, „⬆️ Aktualisieren“ spielt es ein; der Server prüft das bei jeder Anfrage, höchstens 1 Update pro Minute) und nachts 04:17 –
  jeweils nur, wenn es auf GitHub etwas Neues gibt. Spielstände, Caddyfile und Zertifikate bleiben; startet der neue Konto-Server
  nicht, kommt die vorige Version zurück (`spiel-vorher\`). Protokoll: `update.log`.
- Zweig: `spielstand-sync`, änderbar über eine Datei `update-zweig.txt` mit dem Zweignamen.
- Die Caddyfile wird nie automatisch geändert.
- DuckDNS: `einrichten.bat` fragt einmal nach Token und Subdomain (nur lokal gespeichert in `duckdns-token.txt` /
  `duckdns-domain.txt`) und legt die Aufgabe **DuckDNS** an: alle 5 Minuten wird die aktuelle IP (die Telekom vergibt
  sie dynamisch) an DuckDNS gemeldet, wenn sie sich geändert hat. Protokoll `duckdns.log`.

## Erweiterungen (☁️ → Server → 🧩 Erweiterungen, nur Admin)
Der Konto-Server darf nur fest eingebaute Skripte aus `windows/erweiterungen/` der installierten Version starten
(`POST /api/admin/erweiterung`, höchstens eine pro Minute); das Passwort geht nur über eine Umgebungsvariable.
- **AdGuard Home** (`adguard.ps1`): lädt AdGuard Home nach `AdGuardHome\`, richtet es als Windows-Dienst ein und
  konfiguriert es über AdGuards eigene Einrichtungs-Schnittstelle (Verwaltung Port 3000, DNS Port 53, Benutzer
  `admin`). Firewall nur fürs Heimnetz (`remoteip=localsubnet`), kein Port nach außen. Protokoll `erweiterungen.log`.
  Nutzen: am Gerät im Heim-WLAN den DNS manuell auf die IP des Laptops stellen (die App zeigt sie an).

## Steuerung (☁️ → Server → 🎛️ Steuerung, nur Admin)
Zustand des Laptops (Laufzeit, CPU, RAM, Festplatte, Akku/Netzteil) und der Dienste (Caddy, Konto-Server, DuckDNS,
AdGuard, Update). Knöpfe für fest eingebaute Aktionen: Caddy / DuckDNS / AdGuard neu starten, Laptop neu starten
(nach 30 s). Höchstens eine Aktion pro 30 Sekunden; jede Aktion steht in `update.log`. Protokolle: Updates & Steuerung,
Konto-Server, Caddy, DuckDNS, Erweiterungen (letzte 40 Zeilen). Für den kompletten Bildschirm: Chrome Remote Desktop.

## Wachhund und Ausfall-Benachrichtigung (`windows/wachhund.ps1`)
Aufgabe **Wachhund** (läuft dauerhaft, prüft alle 2 Minuten): Konto-Server antwortet nicht (2× hintereinander) →
neu starten; Caddy-Port 443 zu → neu starten; DuckDNS-Aufgabe / AdGuard-Dienst gestoppt → starten. Internet weg:
nach 10 Min. Netzwerkadapter neu starten, nach 30 Min. Laptop neu starten (höchstens alle 6 Std.). Protokoll nur bei
Eingriffen: `wachhund.log`. Lebenszeichen an **healthchecks.io** (Adresse in `healthchecks-url.txt`, fragt
`einrichten.bat`): bleibt es aus (Laptop aus, schläft, kein Internet), schickt healthchecks.io eine Nachricht.

## Erweiterung Minecraft (Java) (`windows/erweiterungen/minecraft.ps1`)
Per Knopf (☁️ → Server → Erweiterungen, EULA-Häkchen nötig): neueste **stabile Paper**-Version von fill.papermc.io
(SHA-256 geprüft), passendes **Java als portables Temurin-JRE** (Version laut PaperMC), Ordner `minecraft\`.
Sicher voreingestellt: `online-mode=true`, Whitelist an, RCON nur lokal (Port 25575 nicht in der Firewall).
Aufgabe **Minecraft** (startet mit Windows, Neustart nach Absturz; `-Xmx2G` + empfohlene Paper-Flags). Firewall TCP 25565.
**Im Speedport TCP 25565 auf den Laptop freigeben.** In der App: Status, wer online ist, Spieler freischalten/entfernen
(RCON `whitelist add/remove`), Start/Stopp (speichert die Welt; „absichtlich aus“ = `minecraft-aus.txt`, dann startet
weder Windows noch der Wachhund den Server)/Neustart. Protokoll „Minecraft“ = `minecraft\logs\latest.log`.
Erneutes Installieren aktualisiert Paper/Java, Welt und Einstellungen bleiben.

**LoL-Zentrale** (`lol.html`, große Kachel oben im Hub + ☁️-Fenster, für alle Angemeldeten): Riot-Accounts werden selbst
eingetragen (mehrere = Smurfs, werden zu einer Person zusammengeführt) – auch für Mitspieler, mit oder ohne
Spielekiste-Konto („Gast“ = nur Name). Unter „Alle Accounts verwalten“ lassen sie sich umhängen/entfernen (die Person
selbst, wer sie eingetragen hat, der Admin; Gäste darf jeder verwalten). Auswertung: Winrate/KDA/Rang je Person, Champions,
Rollen-Matrix (wer spielt wo am besten), Duos (Winrate zusammen + beste Rollen-Kombi), Gegeneinander, „Beste
Aufstellung“ (verteilt 2–5 Leute auf Rollen) und Spiele-Verlauf; Filter Solo/Flex/Normal/ARAM. Code: `lol.js`
(wird vom Konto-Server aus `spiel\werkzeuge\homeserver\` geladen, kommt also mit jedem Update mit).
Riot-API-Key: Admin trägt ihn in der Server-Zentrale → Erweiterungen ein (gespeichert in `daten\riot-key.txt`, geht
nie an den Browser). Ohne Key zeigt die Seite Beispieldaten. Dev-Key (developer.riotgames.com) läuft nach 24 h ab →
besser einen „Personal API Key“ beantragen (läuft nicht ab). Der Server holt alle 10 Min. neue Spiele (beim ersten
Mal die letzten 100 je Account), gedrosselt auf Riots Limits; Daten in `daten\lol\` (Bilder-Cache `daten\lol\bilder\`).
Mitspieler, die mindestens 3-mal im selben Team waren, erscheinen automatisch („erkannt“, nur gemeinsame Spiele) – fest
aufnehmen oder ausblenden. Reiter **Prime League** (`lol-prime.js`): Teams per Hand eintragen (Kader von primeleague.gg
kopieren/einfügen – die Seite selbst wird nicht abgefragt, Bot-Schutz), der Server holt deren Turnierspiele
(match-v5 `type=tourney`, alle 6 Std.) und Mastery (1× am Tag). Auswertung: Team-Bilanz, Pools, Bans, Drafts, Meta,
Matchups, Synergien und ein Draft-Helfer.

**Minecraft-Seite** (`minecraft.html`, verlinkt im ☁️-Fenster, für alle Angemeldeten): Spielerköpfe (Skins holt der
Server einmal täglich von Mojang, Cache `minecraft\koepfe\`), Rangliste (Tode, Spielzeit, Erfolge, Mobs, PvP, km – aus
`<welt>\stats\` und `<welt>\advancements\`), „Online pro Tag“ (aus `minecraft\logs\*.log.gz`), Weltkarte.
Nur Admin: Einstellungen (`server.properties`, nur erlaubte Schlüssel, danach Neustart), Whitelist, **Neue Welt** mit
optionalem Seed (alte Welt → `minecraft\welten-archiv\<Datum>`, die letzten 3 bleiben), **Karte installieren**
(squaremap-Plugin von Modrinth passend zur Version; läuft nur lokal auf Port 8080, der Konto-Server reicht sie unter
`/api/minecraft/karte/` an Angemeldete durch – Port 8080 also NICHT freigeben).

**Verwaltung** (Knopf „⚙️ Verwaltung“ auf der Minecraft-Seite, nur Admin, Overlay mit Reitern):
- Server & Konsole: Start/Stopp/Neustart, `latest.log` live, Befehle per RCON (ohne `stop`), Schnellknöpfe (Tag, Wetter, speichern, Nachricht).
- Spieler & Admins: Whitelist, OP geben/nehmen, rauswerfen, bannen/entbannen (`ops.json`, `banned-players.json`).
- Plugins: Suche auf Modrinth (nur Paper-Plugins für die laufende Version), installieren/entfernen mit kurzem Neustart;
  was über die App kam, steht in `minecraft\plugins.json`. Plugins statt Mods: Mitspieler brauchen nichts zu installieren.
- Einstellungen wie bei Hostern: Kategorien mit Erklärung, Suche. `server.properties` (Neustart) und Spielregeln
  (`/gamerule`, wirken sofort, gelten pro Welt; seit 1.21.11 snake_case, PvP ist seit 1.21.9 eine Spielregel).
  RCON, online-mode, Ports usw. sind absichtlich nicht änderbar.
- Welt: neue Welt mit Seed, Kartenstatus.
- Spieler → **Selbst eintragen**: Modus „mit Beitrittscode“ (Code an Freunde geben), „offen für alle Spielekiste-Konten“ oder „aus“.
  Freunde tragen auf der Minecraft-Seite Namen (+ Code) ein → Name wird bei Mojang geprüft → Whitelist. Ein Name pro Konto;
  Konto löschen/austreten nimmt ihn wieder raus. Bei gestopptem Server direkt in `whitelist.json`. Daten: `daten\minecraft-zugang.json`.
- **Leistung** (Kopfleiste der Minecraft-Seite + Verwaltung → Server): TPS/MSPT per RCON, RAM von Java, CPU, Temperatur (Windows-Thermalzone,
  falls der Laptop sie liefert), Akku, freier Platz, Laufzeit, CPU-Takt (Drosselung). Arbeitsspeicher einstellbar → `start.cmd` (-Xmx) und `minecraft-ram.txt`.
- **Orte auf der Karte**: Jeder Angemeldete markiert Häuser, Höhlen, Spawner … (Seite: „📍 Ort markieren“, mit Koordinaten oder
  eigener Position im Spiel; im Spiel per Chat `!ort Name` / `!haus` – der Konto-Server liest `latest.log` mit und fragt die Position per RCON ab).
  Die Orte erscheinen als eigene Ebene „📍 Orte“ in squaremap (der Konto-Server ergänzt `markers.json` beim Durchreichen). Daten: `daten\minecraft-orte.json`.
- **AdGuard-Sperrlisten per Knopf** (☁️ → Erweiterungen, AdGuard-Passwort eintippen, wird nicht gespeichert): trägt HaGeZi Multi PRO und
  HaGeZi Threat Intelligence (medium) über die AdGuard-Schnittstelle (127.0.0.1:3000, Basic-Auth) ein – ohne Neustart, nichts doppelt.

## Server-Zentrale (`server.html`, nur Admin)
Erreichbar über ☁️ → „🖥️ Server-Zentrale“ (oder direkt `/server.html`). Ersetzt das frühere Server-Menü im ☁️-Fenster.
- **Dienste** mit Ampel, Verfügbarkeit in % und Zeitstrahl (24 h / 7 / 30 Tage). Der Konto-Server misst alle 5 Min.
  (`daten\verlauf.json`, 31 Tage); fehlende Messpunkte = Laptop/Server war nicht erreichbar.
- **System** (CPU, RAM, °C, Platte, Akku, Laufzeit, Konten) mit Verlaufskurve; Laptop neu starten; Dienste einzeln neu starten.
- **Updates**: Version, „Jetzt prüfen/aktualisieren“ und **Auto-Update** (Standard: an, `daten\zentrale.json`): alle 10 Min. GitHub
  prüfen, neue Version per Aufgabe „Update“ einspielen (frühestens 10 Min. nach dem letzten Update, dieselbe Version höchstens 2×).
  `aktualisieren.ps1` nimmt eine Version zurück, wenn der neue Konto-Server nicht startet.
- **Erweiterungen**: AdGuard (installieren, Sperrlisten), Minecraft (installieren, Start/Stopp, Link zur Minecraft-Seite).
- **Bei Ausfall benachrichtigen**: healthchecks.io-Ping-Link eintragen → `healthchecks-url.txt` (liest der Wachhund).
- **Protokolle** (Updates, Wachhund, Konto-Server, Caddy, DuckDNS, Erweiterungen, Minecraft).
