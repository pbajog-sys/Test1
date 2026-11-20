#!/usr/bin/env node
// Spielstand-Server für den Homeserver: Benutzerkonten (Name + PIN) und ein Spielstand pro Konto.
// Läuft hinter Caddy (reverse_proxy /api/* localhost:8090), braucht nur Node.js – keine Zusatzpakete.
//
//   node spielstand-server.js [--daten C:\homeserver\daten] [--port 8090] [--admin Name] [--basis C:\homeserver]
//   --admin: dieses Konto sieht in der App „Server aktualisieren“; --basis: Ordner mit version.txt und update.log
//
// Endpunkte (alle unter /api/, JSON):
//   GET  /api/ich             → { name } oder 401 { server: 'spielekiste' }
//   POST /api/registrieren    { name, pin } → neues Konto, angemeldet (Cookie)
//   POST /api/anmelden        { name, pin } → angemeldet (Cookie)
//   POST /api/abmelden
//   POST /api/admin/aktualisieren   (nur Admin) → startet die Windows-Aufgabe „Spielekiste\Update“ (neueste Version von GitHub)
//   GET  /api/admin/status          (nur Admin) → { version, log: [letzte Zeilen von update.log], konten }
//   GET  /api/minecraft/info        (angemeldet) → Status, Adresse, Statistik je Spieler (Tode, Spielzeit, Kills, km), Karte ja/nein
//   POST /api/minecraft/beitreten   (angemeldet) { name, code? } → eigenen Minecraft-Namen auf die Whitelist (Beitrittscode vom Admin)
//   POST /api/minecraft/austreten   (angemeldet) → eigenen Namen wieder von der Whitelist
//   GET  /api/minecraft/orte        (angemeldet) → markierte Orte (Häuser, Höhlen, Spawner …), erscheinen auch auf der Karte
//   POST /api/minecraft/orte        (angemeldet) { name, kat, welt, x, y, z, notiz? } oder { hier: true, … } (eigene Position im Spiel)
//   POST /api/minecraft/orte/loeschen { id } (eigene; Admin alle)   ·   im Spiel: Chat „!ort Name“ / „!haus“
//   GET  /api/minecraft/karte/…     (angemeldet) → Weltkarte (squaremap-Plugin, nur lokal erreichbar, hier durchgereicht)
//   GET  /api/admin/minecraft       (nur Admin) → { installiert, laeuft, version, online, whitelist, einstellungen }
//   POST /api/admin/minecraft       (nur Admin) { aktion: 'freischalten'|'entfernen'|'start'|'stopp'|'neustart'|'einstellungen'|'neue-welt'|'karte'
//                                    |'op'|'deop'|'kick'|'ban'|'pardon'|'befehl'|'plugin-suchen'|'plugin-installieren'|'plugin-entfernen', … }
//   GET  /api/admin/verlauf?tage=1|7|30 (nur Admin) → Messpunkte alle 5 Min. (Dienste, CPU, RAM, °C, Spieler) + Verfügbarkeit in %
//   GET  /api/admin/prozesse        (nur Admin) → Programme, die gerade am meisten CPU/RAM brauchen
//   GET/POST /api/admin/einstellungen (nur Admin) { autoUpdate?: bool, healthchecks?: 'https://hc-ping.com/…'|'' }
//   POST /api/admin/adguard-listen  (nur Admin) { passwort } → empfohlene Sperrlisten (HaGeZi Pro + Threat Intelligence) in AdGuard eintragen
//   POST /api/admin/erweiterung     (nur Admin) { name: 'adguard', passwort } bzw. { name: 'minecraft', eula: true } → startet ein fest eingebautes Installationsskript
//                                   (werkzeuge/homeserver/windows/erweiterungen/<name>.ps1 aus der installierten Version)
//   GET  /api/admin/system          (nur Admin) → Laufzeit, RAM, Festplatte, CPU, Akku, Zustand der Dienste
//   POST /api/admin/aktion          (nur Admin) { aktion } → fest eingebaute Aktion (Dienst neu starten, Laptop neu starten)
//   GET  /api/admin/protokoll?datei=update|konto|caddy|duckdns|erweiterungen → letzte 40 Zeilen
//   GET  /api/admin/pruefen         (nur Admin) → { aktuell, neu, neuer, anzahl, aenderungen: [Commit-Titel] } – fragt GitHub
//   POST /api/konto/loeschen  { pin } → Konto, Spielstand, Tageskopien, Bestenliste und Anmeldungen löschen
//   POST /api/abgleich        { basis, geraet, stand, aenderungen: { schlüssel: { v: text|null, alt?: true } } }
//                             → { version, neu? }  (neu = nur Einträge, die seit „basis“ ein anderes Gerät geändert hat;
//                                                   v: null = gelöscht – so geht nach einer Runde kaum etwas über die Leitung)
//                             optional oeffentlich: { xp, level, titel, avatar, farbe, skills[7], serie, abzeichen, gelernt, runden,
//                                                      spiele: [{ s, n }] (meistgespielt, höchstens 5) }
//                             → Eintrag in der gemeinsamen Bestenliste (nur diese Zusammenfassung ist für andere sichtbar)
//   GET  /api/bestenliste     → [{ name, ich?, xp, level, … }]  nach XP sortiert, nur für Angemeldete
//
//
// Abgleich Eintrag für Eintrag: Jeder Eintrag merkt sich die Server-Version, in der er zuletzt geändert wurde.
//  • Normale Änderungen (gerade gespielt) gelten immer – die zuletzt angekommene gewinnt.
//  • „alt“-Änderungen (beim Öffnen der App bemerkt, z. B. Kleinkram vom Programmstart) gelten nur, wenn den Eintrag
//    seit „basis“ kein anderes Gerät geändert hat. So überschreibt ein länger nicht benutztes Gerät nie neueren Fortschritt.
//  • v: null = Eintrag gelöscht.
//
// Schutz: PIN nur als scrypt-Hash; nach 5 Fehlversuchen wird der Name gesperrt (15 min, danach doppelt so lang);
// höchstens 30 Fehlversuche und 5 neue Konten pro Stunde und Anschluss; höchstens 50 Konten; Anfragen bis 10 MB.
// Anmeldung per Cookie (HttpOnly, 1 Jahr). Im Datenordner: konten.json, sitzungen.json, staende/<name>.json,
// archiv/<name>-JJJJ-MM-TT.json (Tageskopie, wird nach 30 Tagen gelöscht), bestenliste.json.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const NAME_RE = /^[A-Za-z0-9ÄÖÜäöüß._-]{3,20}$/;
const PIN_RE = /^\d{4,8}$/;
const DUELL_TAGE = 7, DUELL_OFFEN_MAX = 20;
const MAX_KONTEN = 50, MAX_BODY = 10 * 1024 * 1024, COOKIE = 'spielekiste_sitzung', SITZUNG_TAGE = 365;

const UPDATE_STARTEN = () => new Promise((ok, nein) => require('child_process').execFile('schtasks', ['/Run', '/TN', '\\Spielekiste\\Update'], { windowsHide: true }, (e) => (e ? nein(e) : ok())));
// Erweiterungen: nur diese Skripte dürfen gestartet werden (aus der installierten Spielversion, nie aus der Anfrage)
const ERWEITERUNGEN = { adguard: { skript: 'adguard.ps1', name: 'AdGuard Home', passwort: true }, minecraft: { skript: 'minecraft.ps1', name: 'Minecraft (Java)', eula: true } };

// ---------- Minecraft über RCON (nur 127.0.0.1, Passwort aus server.properties) ----------
// Paket: Länge (int32 LE), ID, Typ (3 = Anmelden, 2 = Befehl), Text, zwei Nullbytes
function rcon(befehl, { port = 25575, passwort, timeout = 5000 } = {}) {
  return new Promise((ok, nein) => {
    const net = require('net'), sock = net.connect(port, '127.0.0.1');
    const paket = (id, typ, text) => { const t = Buffer.from(text, 'utf8'), b = Buffer.alloc(14 + t.length); b.writeInt32LE(10 + t.length, 0); b.writeInt32LE(id, 4); b.writeInt32LE(typ, 8); t.copy(b, 12); return b; };
    let puffer = Buffer.alloc(0), angemeldet = false, antwort = '';
    const ende = (f, w) => { clearTimeout(uhr); sock.destroy(); f(w); };
    const uhr = setTimeout(() => ende(nein, new Error('RCON antwortet nicht')), timeout);
    sock.on('connect', () => sock.write(paket(1, 3, passwort || '')));
    sock.on('error', (e) => ende(nein, e));
    sock.on('data', (d) => {
      puffer = Buffer.concat([puffer, d]);
      while (puffer.length >= 4) {
        const laenge = puffer.readInt32LE(0); if (puffer.length < laenge + 4) break;
        const id = puffer.readInt32LE(4), text = puffer.slice(12, 4 + laenge - 2).toString('utf8');
        puffer = puffer.slice(4 + laenge);
        if (!angemeldet) { if (id === -1) return ende(nein, new Error('RCON-Passwort falsch')); angemeldet = true; sock.write(paket(2, 2, befehl)); if (befehl === 'stop') setTimeout(() => ende(ok, ''), 500); }
        else { antwort += text; setTimeout(() => ende(ok, antwort.replace(/§./g, '')), 150); }
      }
    });
  });
}
// PowerShell im Hintergrund starten – mit verstecktem Konsolenfenster (ganz ohne Konsole startet PowerShell unter
// Windows oft gar nicht) und vollem Pfad. Scheitert es, landen Exit-Code und Fehlermeldung im angegebenen Protokoll.
const POWERSHELL = () => path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
function psHintergrund(args, { env, protokoll, name } = {}) {
  const zeile = (t) => { if (protokoll) try { fs.appendFileSync(protokoll, new Date().toISOString().replace('T', ' ').slice(0, 19) + '  ' + name + ': ' + t + '\n'); } catch (e) { /* egal */ } };
  let kind;
  try { kind = require('child_process').spawn(POWERSHELL(), ['-NoProfile', '-ExecutionPolicy', 'Bypass'].concat(args), { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env, env || {}) }); }
  catch (e) { zeile('konnte nicht gestartet werden (' + e.message + ')'); throw e; }
  let fehler = '';
  kind.stderr.on('data', (d) => { fehler = (fehler + d).slice(-600); });
  kind.stdout.on('data', () => {});
  kind.on('error', (e) => zeile('konnte nicht gestartet werden (' + e.message + ')'));
  kind.on('exit', (code) => { if (code) zeile('beendet mit Code ' + code + (fehler.trim() ? ' – ' + fehler.trim().split(/\r?\n/).filter(Boolean).slice(-2).join(' / ') : '')); });
}
const ERWEITERUNG_STARTEN = (skript, basis, env) => psHintergrund(['-File', skript, '-Basis', basis], { env, protokoll: path.join(basis, 'erweiterungen.log'), name: 'Start' });
// Läuft auf diesem Rechner ein DNS-Server (AdGuard)? Fragt 127.0.0.1 nach example.com.
const DNS_PRUEFEN = () => new Promise((ok) => {
  const r = new (require('dns').promises.Resolver)({ timeout: 1500, tries: 1 });
  r.setServers(['127.0.0.1']);
  r.resolve4('example.com').then(() => ok(true), () => ok(false));
});
const LAN_IP = () => {
  const l = Object.values(require('os').networkInterfaces()).flat().filter((x) => x && x.family === 'IPv4' && !x.internal);
  const heim = l.find((x) => /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(x.address));
  return (heim || l[0] || {}).address || null;
};
// Zustand der Windows-Aufgabe „Spielekiste\Update“ (für die Fehlersuche im Server-Bereich der App); null, wenn nicht Windows
const AUFGABE_ABFRAGEN = () => new Promise((ok) => {
  if (process.platform !== 'win32') return ok(null);
  const befehl = "$t = Get-ScheduledTask -TaskPath '\\Spielekiste\\' -TaskName 'Update' -ErrorAction SilentlyContinue; if (-not $t) { '{\"fehlt\":true}'; exit }"
    + "; $i = $t | Get-ScheduledTaskInfo; @{ zustand = [string]$t.State; letzterLauf = $(if ($i.LastRunTime) { $i.LastRunTime.ToString('s') } else { '' }); ergebnis = [int64]$i.LastTaskResult"
    + "; aktion = (($t.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join '; ') } | ConvertTo-Json -Compress";
  // -EncodedCommand: kein Ärger mit Anführungszeichen in der Befehlszeile
  require('child_process').execFile('powershell.exe', ['-NoProfile', '-EncodedCommand', Buffer.from(befehl, 'utf16le').toString('base64')], { windowsHide: true, timeout: 8000 }, (e, out) => {
    if (e) return ok({ fehler: String(e.message).slice(0, 200) });
    try { ok(JSON.parse(String(out).trim())); } catch (x) { ok({ fehler: String(out).slice(0, 200) }); }
  });
});
// Laptop-Zustand für die Leistungsanzeige: RAM von Java, Temperatur (Thermalzone, falls Windows sie liefert), Akku,
// freier Speicher auf C:, Laufzeit, CPU-Takt in % (unter 100 % über längere Zeit = Laptop drosselt, z. B. wegen Hitze)
const SYSTEM_WERTE = "$j = (Get-Process java -ErrorAction SilentlyContinue | Measure-Object WorkingSet64 -Sum).Sum; $t = $null"
  + "; try { $z = Get-CimInstance -ClassName Win32_PerfFormattedData_Counters_ThermalZoneInformation -ErrorAction Stop | ForEach-Object { if ($_.HighPrecisionTemperature) { $_.HighPrecisionTemperature / 10 - 273.15 } else { $_.Temperature - 273.15 } } | Where-Object { $_ -gt 1 -and $_ -lt 120 }; if ($z) { $t = ($z | Measure-Object -Maximum).Maximum } } catch {}"
  + "; if ($t -eq $null) { try { $z = Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop | ForEach-Object { $_.CurrentTemperature / 10 - 273.15 } | Where-Object { $_ -gt 1 -and $_ -lt 120 }; if ($z) { $t = ($z | Measure-Object -Maximum).Maximum } } catch {} }"
  + "; $b = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1; $d = Get-PSDrive C"
  + "; $p = (Get-CimInstance Win32_PerfFormattedData_Counters_ProcessorInformation -Filter \"Name='_Total'\" -ErrorAction SilentlyContinue).PercentProcessorPerformance"
  + "; $u = (Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime"
  + "; @{ javaMB = [math]::Round($j / 1MB); tempC = $(if ($t -ne $null) { [math]::Round($t) } else { $null }); akku = $(if ($b) { [int]$b.EstimatedChargeRemaining } else { $null })"
  + "; netz = $(if ($b) { $b.BatteryStatus -ne 1 } else { $true }); diskFreiGB = [math]::Round($d.Free / 1GB, 1); laufzeitStd = [math]::Round($u.TotalHours, 1)"
  + "; takt = $(if ($p) { [int]$p } else { $null }) } | ConvertTo-Json -Compress";
const PROZESSE = "$k = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors"
  + "; Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -notin '_Total','Idle' }"
  + " | ForEach-Object { [pscustomobject]@{ n = ($_.Name -replace '#\\d+$',''); c = [double]$_.PercentProcessorTime / $k; r = [double]$_.WorkingSetPrivate / 1MB } }"
  + " | Group-Object n | ForEach-Object { @{ name = $_.Name; cpu = [math]::Round(($_.Group | Measure-Object c -Sum).Sum, 1); ramMB = [math]::Round(($_.Group | Measure-Object r -Sum).Sum); anzahl = $_.Count } }"
  + " | Sort-Object { -$_.cpu - $_.ramMB / 100000 } | Select-Object -First 40 | ConvertTo-Json -Compress";
// ---------- Steuerung (nur Windows): fest eingebaute Aktionen, nie Befehle aus der Anfrage ----------
const PS = (befehl, timeout = 10000) => new Promise((ok) => {
  if (process.platform !== 'win32') return ok(null);
  require('child_process').execFile('powershell.exe', ['-NoProfile', '-EncodedCommand', Buffer.from(befehl, 'utf16le').toString('base64')], { windowsHide: true, timeout }, (e, out) => {
    if (e) return ok(null);
    try { ok(JSON.parse(String(out).trim())); } catch (x) { ok(null); }
  });
});
const DIENSTE_ABFRAGEN = () => PS("$a = @{}; foreach ($n in 'Caddy','Konto-Server','DuckDNS','Wachhund','Minecraft','Update') { $t = Get-ScheduledTask -TaskPath '\\Spielekiste\\' -TaskName $n -ErrorAction SilentlyContinue; $a[$n] = $(if ($t) { [string]$t.State } else { 'fehlt' }) }"
  + "; $g = Get-Service -Name 'AdGuardHome' -ErrorAction SilentlyContinue; $a['AdGuard'] = $(if ($g) { [string]$g.Status } else { 'fehlt' })"
  + "; $b = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1"
  + "; @{ dienste = $a; akku = $(if ($b) { [int]$b.EstimatedChargeRemaining } else { $null }); netz = $(if ($b) { [int]$b.BatteryStatus -ne 1 } else { $true }) } | ConvertTo-Json -Compress");
const STOPP_START = (aufgabe, prozess) => "Stop-ScheduledTask -TaskPath '\\Spielekiste\\' -TaskName '" + aufgabe + "' -ErrorAction SilentlyContinue; " + prozess
  + "; Start-Sleep 2; Start-ScheduledTask -TaskPath '\\Spielekiste\\' -TaskName '" + aufgabe + "'";
const AKTIONEN = {
  'caddy-neustart': { name: 'Caddy neu starten', ps: STOPP_START('Caddy', "Get-Process -Name caddy_windows_amd64, caddy -ErrorAction SilentlyContinue | Stop-Process -Force") },
  'duckdns-neustart': { name: 'DuckDNS neu starten', ps: STOPP_START('DuckDNS', "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*duckdns.ps1*' } | ForEach-Object { Invoke-CimMethod -InputObject $_ -MethodName Terminate | Out-Null }") },
  'adguard-neustart': { name: 'AdGuard neu starten', ps: "Restart-Service -Name 'AdGuardHome' -Force" },
  'laptop-neustart': { name: 'Laptop neu starten', ps: "shutdown.exe /r /t 30 /c 'Neustart ueber die Spielekiste'" },
};
const AKTION_STARTEN = (ps, basis) => psHintergrund(['-EncodedCommand', Buffer.from(ps, 'utf16le').toString('base64')], { protokoll: basis && path.join(basis, 'update.log'), name: 'Steuerung' });
const PROTOKOLLE = { update: 'update.log', wachhund: 'wachhund.log', konto: 'konto-server.log', caddy: 'caddy.log', duckdns: 'duckdns.log', erweiterungen: 'erweiterungen.log', minecraft: 'minecraft/logs/latest.log' };
const GITHUB = (repo) => async (pfad) => {
  const r = await fetch('https://api.github.com/repos/' + repo + pfad, { headers: { 'User-Agent': 'spielekiste-homeserver', Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error('GitHub ' + r.status);
  return r.json();
};
function erstelleServer({ daten, jetzt = () => Date.now(), admin = [], basis = null, updateStarten = UPDATE_STARTEN, repo = 'pbajog-sys/Test1', github = GITHUB(repo),
  erweiterungStarten = ERWEITERUNG_STARTEN, dnsPruefen = DNS_PRUEFEN, mcBefehl = null, aufgabeAusfuehren = null, mcWarten = 4000,
  modrinth = (pfad) => fetch('https://api.modrinth.com/v2' + pfad, { headers: { 'User-Agent': 'spielekiste-homeserver' } }).then((r) => { if (!r.ok) throw new Error('Modrinth ' + r.status); return r.json(); }),
  herunterladen = async (quelle, ziel) => { const r = await fetch(quelle); if (!r.ok) throw new Error('Download ' + r.status); fs.writeFileSync(ziel, Buffer.from(await r.arrayBuffer())); },
  karteHost = '127.0.0.1', logTakt = 5000, messTakt = 300000, autoTakt = 600000,
  // AdGuard-Home-Schnittstelle (nur lokal), Anmeldung per Basic-Auth mit dem Passwort, das der Admin eintippt (wird nicht gespeichert)
  adguardApi = async (pfad, passwort, koerper) => {
    const r = await fetch('http://127.0.0.1:3000/control/' + pfad, { method: koerper ? 'POST' : 'GET', signal: AbortSignal.timeout(90000),
      headers: Object.assign({ Authorization: 'Basic ' + Buffer.from('admin:' + passwort).toString('base64') }, koerper ? { 'Content-Type': 'application/json' } : {}), body: koerper ? JSON.stringify(koerper) : undefined });
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch (e) { /* manche Antworten sind leer oder Text */ }
    return { status: r.status, json, text };
  },
  systemWerte = () => PS(SYSTEM_WERTE, 15000),
  mojangProfil = async (name) => {   // → { id, name } (richtige Schreibweise) oder null, wenn es den Namen nicht gibt
    const r = await fetch('https://api.mojang.com/users/profiles/minecraft/' + encodeURIComponent(name));
    if (r.status === 404 || r.status === 204) return null;
    if (!r.ok) throw new Error('Mojang ' + r.status);
    return r.json();
  },
  skinHolen = async (uuid) => {
    const r = await fetch('https://sessionserver.mojang.com/session/minecraft/profile/' + uuid.replace(/-/g, ''));
    if (!r.ok) throw new Error('Mojang ' + r.status);
    const t = JSON.parse(Buffer.from(((await r.json()).properties || []).find((x) => x.name === 'textures').value, 'base64').toString());
    const u = t.textures && t.textures.SKIN && t.textures.SKIN.url; if (!u || !/^https?:\/\/textures\.minecraft\.net\//.test(u)) throw new Error('kein Skin');
    const b = await fetch(u); if (!b.ok) throw new Error('Skin ' + b.status); return Buffer.from(await b.arrayBuffer());
  }, lanIp = LAN_IP, aufgabeAbfragen = AUFGABE_ABFRAGEN,
  diensteAbfragen = DIENSTE_ABFRAGEN, aktionStarten = AKTION_STARTEN, prozesseAbfragen = () => PS(PROZESSE, 20000) } = {}) {
  // PowerShell zu starten kostet auf schwachen Laptops jedes Mal spürbar CPU → Abfragen 30 s merken (auch bei mehreren offenen Seiten)
  const merken = (fn, ms = 30000) => { let zeit = 0, wert = null, laeuft = null;
    return () => { if (laeuft) return laeuft; if (wert && jetzt() - zeit < ms) return Promise.resolve(wert);
      laeuft = Promise.resolve().then(fn).then((w) => { wert = w; zeit = jetzt(); return w; }).finally(() => { laeuft = null; }); return laeuft; }; };
  diensteAbfragen = merken(diensteAbfragen); systemWerte = merken(systemWerte); aufgabeAbfragen = merken(aufgabeAbfragen);
  let letzteAktion = 0;
  const letzteErweiterung = {};   // pro Erweiterung: wann zuletzt gestartet
  let pruefCache = null, cpuSystemStand = null;
  let letztesUpdate = 0;
  const admins = new Set([].concat(admin).filter(Boolean).map((n) => String(n).normalize('NFC').toLowerCase()));
  if (!daten) throw new Error('Datenordner fehlt');
  for (const o of ['', 'staende', 'archiv']) fs.mkdirSync(path.join(daten, o), { recursive: true });

  // ---------- Dateien ----------
  const lesen = (datei, leer) => { try { return JSON.parse(fs.readFileSync(path.join(daten, datei), 'utf8')); } catch (e) { return leer; } };
  const schreiben = (datei, obj) => {   // erst in eine Hilfsdatei, dann umbenennen – nie halb geschriebene Dateien
    const ziel = path.join(daten, datei), tmp = ziel + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj)); fs.renameSync(tmp, ziel);
  };
  let konten = lesen('konten.json', {});        // schlüssel (klein) → { name, salz, hash, erstellt, fehl, sperreBis, sperreMin }
  let sitzungen = lesen('sitzungen.json', {});  // sha256(token) → { schluessel, erstellt }
  let bestenliste = lesen('bestenliste.json', {});
  try { fs.rmSync(path.join(daten, 'duelle.json'), { force: true }); } catch (e) { /* Duelle gibt es nicht mehr – alte Daten weg */ }   // schlüssel → öffentliche Zusammenfassung
  const schluessel = (name) => name.normalize('NFC').toLowerCase();
  const dateiname = (k) => encodeURIComponent(k).replace(/%/g, '_');

  // ---------- PIN ----------
  const hashen = (pin, salz) => crypto.scryptSync(pin, salz, 32).toString('hex');
  const pinOk = (konto, pin) => crypto.timingSafeEqual(Buffer.from(hashen(pin, konto.salz), 'hex'), Buffer.from(konto.hash, 'hex'));

  // ---------- Begrenzung pro Anschluss ----------
  const zaehler = new Map();   // art:ip → [zeitpunkte]
  const zuViel = (art, ip, max) => { const k = art + ':' + ip, l = (zaehler.get(k) || []).filter((t) => jetzt() - t < 3600e3); zaehler.set(k, l); return l.length >= max; };
  const zaehlen = (art, ip) => { const k = art + ':' + ip; zaehler.set(k, (zaehler.get(k) || []).concat(jetzt())); };

  // ---------- Sitzung ----------
  const tokenHash = (t) => crypto.createHash('sha256').update(t).digest('hex');
  function sitzungVon(req) {
    const m = new RegExp('(?:^|;\\s*)' + COOKIE + '=([A-Za-z0-9_-]+)').exec(req.headers.cookie || '');
    if (!m) return null;
    const s = sitzungen[tokenHash(m[1])];
    if (!s || !konten[s.schluessel] || jetzt() - s.erstellt > SITZUNG_TAGE * 864e5) return null;
    return { ...s, hash: tokenHash(m[1]) };
  }
  function anmeldenAls(res, k, sicher) {
    const token = crypto.randomBytes(32).toString('base64url');
    sitzungen[tokenHash(token)] = { schluessel: k, erstellt: jetzt() };
    schreiben('sitzungen.json', sitzungen);
    res.setHeader('Set-Cookie', COOKIE + '=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + SITZUNG_TAGE * 86400 + (sicher ? '; Secure' : ''));
  }

  // ---------- Antworten ----------
  const senden = (res, status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
  const koerper = (req) => new Promise((ok, nein) => {
    let n = 0; const teile = [];
    req.on('data', (c) => { n += c.length; if (n > MAX_BODY) { nein(Object.assign(new Error('zu groß'), { status: 413 })); req.destroy(); } else teile.push(c); });
    req.on('end', () => { try { ok(teile.length ? JSON.parse(Buffer.concat(teile).toString('utf8')) : {}); } catch (e) { nein(Object.assign(new Error('kein JSON'), { status: 400 })); } });
    req.on('error', nein);
  });
  // Öffentliche Zusammenfassung: nur bekannte Felder, Zahlen begrenzt, Texte gekürzt
  const zahl = (x, min, max) => { const n = Math.round(Number(x)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };
  function oeffentlichSaeubern(o) {
    if (!o || typeof o !== 'object') return null;
    return {
      xp: zahl(o.xp, 0, 1e8), level: zahl(o.level, 1, 1000), titel: String(o.titel || '').slice(0, 30),
      avatar: String(o.avatar || '🙂').slice(0, 8), farbe: /^#[0-9a-fA-F]{6}$/.test(o.farbe || '') ? o.farbe : '#64748b',
      skills: Array.isArray(o.skills) ? o.skills.slice(0, 7).map((v) => zahl(v, -1, 100)) : [],
      serie: zahl(o.serie, 0, 1e5), abzeichen: zahl(o.abzeichen, 0, 1e5), gelernt: zahl(o.gelernt, 0, 1e6), runden: zahl(o.runden, 0, 1e7),
      spiele: Array.isArray(o.spiele) ? o.spiele.filter((x) => x && /^[a-z0-9_-]{1,20}$/i.test(x.s)).slice(0, 5).map((x) => ({ s: x.s, n: zahl(x.n, 0, 1e7) })) : [],
    };
  }
  const aenderungenPruefen = (a) => a && typeof a === 'object' && Object.entries(a).every(([k, x]) => k.startsWith('walquiz.') && k.length < 200 && x && (typeof x.v === 'string' || x.v === null));
  // Stand eines Kontos; ältere Dateien ({ version, daten }) werden beim Lesen umgewandelt
  const NIE_SPEICHERN = ['walquiz.spotify.v1'];   // Zugangsschlüssel fremder Dienste bleiben auf dem Gerät
  function standLesen(datei) {
    const st = lesen(datei, null);
    if (!st) return { version: 0, eintraege: {} };
    if (st.eintraege) { NIE_SPEICHERN.forEach((k) => delete st.eintraege[k]); return st; }
    const eintraege = {}; Object.entries(st.daten || {}).forEach(([k, v]) => { eintraege[k] = { v, ver: st.version || 1 }; });
    return { version: st.version || 1, eintraege };
  }

  // ---------- Minecraft: gemeinsame Helfer ----------
  const mcBasis = () => basis || path.dirname(daten);
  const mcOrdner = () => path.join(mcBasis(), 'minecraft');
  const mcAusFlagge = () => path.join(mcBasis(), 'minecraft-aus.txt');
  const mcInstalliert = () => fs.existsSync(path.join(mcOrdner(), 'paper.jar'));
  function mcProps() {
    const d = {};
    try { fs.readFileSync(path.join(mcOrdner(), 'server.properties'), 'utf8').split(/\r?\n/).forEach((z) => { const i = z.indexOf('='); if (i > 0 && z[0] !== '#') d[z.slice(0, i).trim()] = z.slice(i + 1).trim(); }); } catch (e) { /* noch nicht da */ }
    return d;
  }
  function mcPropsSchreiben(werte) {
    const datei = path.join(mcOrdner(), 'server.properties');
    const zeilen = fs.existsSync(datei) ? fs.readFileSync(datei, 'utf8').split(/\r?\n/) : [], gesetzt = new Set();
    const neu = zeilen.map((z) => { const i = z.indexOf('='); if (i > 0 && z[0] !== '#') { const k = z.slice(0, i).trim(); if (k in werte) { gesetzt.add(k); return k + '=' + werte[k]; } } return z; });
    Object.keys(werte).forEach((k) => { if (!gesetzt.has(k)) neu.push(k + '=' + werte[k]); });
    fs.writeFileSync(datei, neu.filter((z, i, a) => z !== '' || i < a.length - 1).join('\r\n') + '\r\n');
  }
  const mcRcon = (c) => (mcBefehl ? mcBefehl(c) : rcon(c, { port: Number(mcProps()['rcon.port']) || 25575, passwort: mcProps()['rcon.password'] }));
  const mcAufgabe = (art) => (aufgabeAusfuehren ? aufgabeAusfuehren(art) : new Promise((ok) => require('child_process').execFile('schtasks', [art, '/TN', '\\Spielekiste\\Minecraft'], { windowsHide: true }, () => ok())));
  const mcProtokoll = (t) => { try { fs.appendFileSync(path.join(mcBasis(), 'update.log'), new Date(jetzt()).toISOString().replace('T', ' ').slice(0, 19) + '  Minecraft: ' + t + '\n'); } catch (e) { /* egal */ } };
  const schlafen = (ms) => new Promise((ok) => setTimeout(ok, ms));
  let mcBeschaeftigt = '';
  // Server sauber stoppen (Welt wird gespeichert), warten bis er wirklich aus ist, optional etwas erledigen, wieder starten
  async function mcNeustarten(zwischendurch) {
    try { fs.writeFileSync(mcAusFlagge(), 'kurz gestoppt (Neustart)'); } catch (e) { /* egal */ }
    try { await mcRcon('stop'); } catch (e) { /* lief nicht */ }
    for (let i = 0; i < 40; i++) { try { await mcRcon('list'); } catch (e) { break; } await schlafen(mcWarten / 3); }
    await schlafen(mcWarten);
    if (zwischendurch) await zwischendurch();
    try { fs.rmSync(mcAusFlagge(), { force: true }); } catch (e) { /* egal */ }
    await mcAufgabe('/Run');
  }
  async function mcImHintergrund(was, f) {
    if (mcBeschaeftigt) return false;
    mcBeschaeftigt = was;
    f().then(() => mcProtokoll(was + ': fertig'), (e) => mcProtokoll(was + ': FEHLER ' + e.message)).finally(() => { mcBeschaeftigt = ''; });
    return true;
  }
  const mcVersion = () => { try { return (/^paper-(.+)-\d+\.jar$/.exec(fs.readFileSync(path.join(mcOrdner(), 'paper-version.txt'), 'utf8').trim()) || [])[1] || ''; } catch (e) { return ''; } };
  const mcJson = (f, alt) => { try { return JSON.parse(fs.readFileSync(path.join(mcOrdner(), f), 'utf8')); } catch (e) { return alt; } };
  // Plugins: Ordner plugins\*.jar; was über die App kam, steht mit Modrinth-Projekt in plugins.json (für Anzeige und Entfernen)
  function mcPlugins() {
    const bekannt = mcJson('plugins.json', {}), nachDatei = {};
    Object.entries(bekannt).forEach(([slug, x]) => { nachDatei[x.datei] = Object.assign({ slug }, x); });
    let jars = []; try { jars = fs.readdirSync(path.join(mcOrdner(), 'plugins')).filter((f) => /\.jar$/i.test(f)); } catch (e) { /* keine */ }
    return jars.sort().map((f) => nachDatei[f] || { datei: f, titel: f.replace(/[-_]?(paper|bukkit|spigot)?[-_]?v?\d[\w.+-]*\.jar$/i, '').replace(/\.jar$/i, '') || f });
  }
  async function mcModrinthVersion(slug) {
    const v = mcVersion(); if (!v) throw Object.assign(new Error('Minecraft-Version unbekannt.'), { code: 400 });
    let versionen;
    try { versionen = await modrinth('/project/' + encodeURIComponent(slug) + '/version?loaders=' + encodeURIComponent('["paper"]') + '&game_versions=' + encodeURIComponent(JSON.stringify([v]))); }
    catch (e) { throw Object.assign(new Error('Modrinth gerade nicht erreichbar.'), { code: 502 }); }
    const x = (versionen || []).find((y) => y.version_type === 'release') || (versionen || [])[0];
    const datei = x && ((x.files || []).find((f) => f.primary) || (x.files || [])[0]);
    if (!datei || !/^[\w.+-]+\.jar$/.test(datei.filename) || !/^https:\/\/cdn\.modrinth\.com\//.test(datei.url))
      throw Object.assign(new Error('„' + slug + '“ gibt es (noch) nicht für Minecraft ' + v + ' (Paper).'), { code: 404 });
    return { version: x.version_number, datei };
  }
  const mcKarteDa = () => { try { return fs.readdirSync(path.join(mcOrdner(), 'plugins')).some((f) => /^squaremap.*\.jar$/i.test(f)); } catch (e) { return false; } };
  const mcKartePort = () => { try { const t = fs.readFileSync(path.join(mcOrdner(), 'plugins', 'squaremap', 'config.yml'), 'utf8'); const m = /internal-webserver:[\s\S]*?port:\s*(\d+)/.exec(t); return m ? Number(m[1]) : 8080; } catch (e) { return 8080; } };
  // Statistik je Spieler aus <welt>/stats/<uuid>.json, Namen aus usercache.json
  function mcStatistik() {
    const welt = path.join(mcOrdner(), mcProps()['level-name'] || 'world'), namen = {};
    try { JSON.parse(fs.readFileSync(path.join(mcOrdner(), 'usercache.json'), 'utf8')).forEach((e) => { namen[e.uuid] = e.name; }); } catch (e) { /* noch niemand */ }
    let dateien = []; try { dateien = fs.readdirSync(path.join(welt, 'stats')).filter((f) => f.endsWith('.json')); } catch (e) { /* noch keine */ }
    const WEGE = ['walk_one_cm', 'sprint_one_cm', 'crouch_one_cm', 'swim_one_cm', 'walk_on_water_one_cm', 'walk_under_water_one_cm', 'aviate_one_cm', 'boat_one_cm', 'horse_one_cm', 'minecart_one_cm', 'climb_one_cm', 'fly_one_cm'];
    return dateien.map((f) => {
      const datei = path.join(welt, 'stats', f), uuid = f.replace(/\.json$/, '');
      let j = {}; try { j = JSON.parse(fs.readFileSync(datei, 'utf8')); } catch (e) { /* kaputt */ }
      const c = (j.stats || {})['minecraft:custom'] || {}, g = (k) => Number(c['minecraft:' + k] || 0);
      let erfolge = 0;
      try { const a = JSON.parse(fs.readFileSync(path.join(welt, 'advancements', f), 'utf8')); erfolge = Object.entries(a).filter(([x, v]) => v && v.done === true && !/^minecraft:recipes\//.test(x)).length; } catch (e) { /* noch keine */ }
      return { name: namen[uuid] || uuid.slice(0, 8), uuid: /^[0-9a-f-]{32,36}$/i.test(uuid) ? uuid : '', erfolge, tode: g('deaths'), spielzeitMin: Math.round((g('play_time') || g('play_one_minute')) / 1200),
        mobKills: g('mob_kills'), spielerKills: g('player_kills'), km: Math.round(WEGE.reduce((a, k) => a + g(k), 0) / 10000) / 10, zuletzt: fs.statSync(datei).mtimeMs };
    }).sort((a, b) => b.spielzeitMin - a.spielzeitMin);
  }
  // Wer war an welchem Tag online? Aus den Server-Logs (logs/JJJJ-MM-TT-n.log.gz + latest.log); gepackte Logs ändern sich nie → zwischenspeichern
  const logCache = new Map();
  function mcAktivitaet(tage = 90) {
    const ordner = path.join(mcOrdner(), 'logs'), proTag = {};
    const namenIn = (text) => { const n = new Set(), re = /\]: ([A-Za-z0-9_]{3,16}) joined the game/g; let x; while ((x = re.exec(text))) n.add(x[1]); return n; };
    const dazu = (tag, namen) => { if (namen.size) namen.forEach((n) => (proTag[tag] = proTag[tag] || new Set()).add(n)); };
    let dateien = []; try { dateien = fs.readdirSync(ordner); } catch (e) { return []; }
    const grenze = new Date(jetzt() - tage * 864e5).toISOString().slice(0, 10);
    for (const f of dateien) {
      const m = /^(\d{4}-\d{2}-\d{2})-\d+\.log\.gz$/.exec(f);
      if (!m || m[1] < grenze) continue;
      if (!logCache.has(f)) { let t = ''; try { t = require('zlib').gunzipSync(fs.readFileSync(path.join(ordner, f))).toString('utf8'); } catch (e) { /* kaputt */ } logCache.set(f, namenIn(t)); }
      dazu(m[1], logCache.get(f));
    }
    try { const lf = path.join(ordner, 'latest.log'); dazu(new Date(fs.statSync(lf).mtimeMs).toISOString().slice(0, 10), namenIn(fs.readFileSync(lf, 'utf8'))); } catch (e) { /* noch keins */ }
    return Object.keys(proTag).filter((t) => t >= grenze).sort().map((t) => ({ tag: t, spieler: [...proTag[t]].sort() }));
  }
  // Skins einmal am Tag von Mojang holen (der Server fragt, nicht das Handy der Spieler) und auf der Platte merken
  const skinLaeuft = new Map();
  async function mcSkin(uuid) {
    const ordner = path.join(mcOrdner(), 'koepfe'), datei = path.join(ordner, uuid + '.png');
    let st = null; try { st = fs.statSync(datei); } catch (e) { /* noch nicht da */ }
    if (st && jetzt() - st.mtimeMs < 864e5) return st.size ? fs.readFileSync(datei) : null;
    if (!skinLaeuft.has(uuid)) skinLaeuft.set(uuid, skinHolen(uuid).then((b) => { fs.mkdirSync(ordner, { recursive: true }); fs.writeFileSync(datei, b); return b; },
      () => { if (st) { try { fs.utimesSync(datei, new Date(), new Date()); } catch (e) { /* egal */ } return st.size ? fs.readFileSync(datei) : null; } fs.mkdirSync(ordner, { recursive: true }); fs.writeFileSync(datei, ''); return null; }).finally(() => skinLaeuft.delete(uuid)));
    return skinLaeuft.get(uuid);
  }
  async function mcLaeuft() {
    try { const l = await mcRcon('list'); const nach = l.split(':').slice(1).join(':').trim(); return { laeuft: true, online: nach ? nach.split(/,\s*/).filter(Boolean) : [] }; }
    catch (e) { return { laeuft: false, online: [] }; }
  }
  // Erlaubte server.properties-Schlüssel (wie bei Hostern: alles Sinnvolle, aber nichts Sicherheitsrelevantes wie RCON/online-mode)
  const B = ['bool'], Z = (a, b) => ['zahl', a, b], W = (...l) => ['wahl', l];
  const EIGENSCHAFTEN = {
    motd: ['text', 59], 'max-players': Z(1, 50), difficulty: W('peaceful', 'easy', 'normal', 'hard'), gamemode: W('survival', 'creative', 'adventure', 'spectator'),
    'force-gamemode': B, hardcore: B, 'white-list': B, 'enforce-whitelist': B, 'allow-flight': B, 'player-idle-timeout': Z(0, 240),
    'spawn-protection': Z(0, 64), 'op-permission-level': Z(1, 4), 'enable-command-block': B, 'hide-online-players': B,
    'level-type': W('minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified'), 'generate-structures': B, 'max-world-size': Z(1000, 29999984),
    'view-distance': Z(4, 16), 'simulation-distance': Z(4, 12), 'entity-broadcast-range-percentage': Z(10, 500), 'pause-when-empty-seconds': Z(0, 3600),
  };
  // Spielregeln (seit 1.21.11 neue Namen; wirken sofort, gelten pro Welt)
  const SPIELREGELN = {
    pvp: B, keep_inventory: B, immediate_respawn: B, natural_health_regeneration: B, fall_damage: B, fire_damage: B, drowning_damage: B,
    show_death_messages: B, show_advancement_messages: B, players_sleeping_percentage: Z(0, 100), spawn_phantoms: B,
    advance_time: B, advance_weather: B, spawn_mobs: B, spawn_monsters: B, mob_griefing: B, spawn_patrols: B, spawn_wandering_traders: B, raids: B,
    mob_drops: B, block_drops: B, random_tick_speed: Z(0, 30), respawn_radius: Z(0, 32), allow_entering_nether_using_portals: B, send_command_feedback: B,
  };
  const gueltig = (t, v) => (t[0] === 'bool' ? ['true', 'false'].includes(v) : t[0] === 'zahl' ? /^\d+$/.test(v) && +v >= t[1] && +v <= t[2]
    : t[0] === 'wahl' ? t[1].includes(v) : v.length <= t[1] && !/[\r\n\\]/.test(v));
  async function mcRegeln() {
    const r = {};
    for (const n of Object.keys(SPIELREGELN)) {
      try { const a = await mcRcon('gamerule ' + n); const x = /(?:set to|ist)\s*:?\s*(\S+)\s*$/i.exec(a.replace(/§./g, '').trim()) || /:\s*(\S+)\s*$/.exec(a.trim()); if (x) r[n] = x[1].replace(/\.$/, ''); } catch (e) { return null; }
    }
    return r;
  }

  // ---------- Selbst eintragen: Beitrittscode ----------
  // minecraft-zugang.json: { modus: 'code'|'offen'|'aus', code, konten: { schlüssel: { mc, uuid, zeit } } }
  let zugang = lesen('minecraft-zugang.json', { modus: 'aus', code: '', konten: {} });
  const zugangSpeichern = () => schreiben('minecraft-zugang.json', zugang);
  const mitStrichen = (id) => String(id).replace(/-/g, '').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  // Whitelist ändern: bei laufendem Server per RCON, sonst direkt in whitelist.json (liest der Server beim Start)
  async function whitelistSetzen(name, uuid, rein) {
    try { await mcRcon('whitelist ' + (rein ? 'add ' : 'remove ') + name); if (!rein) { try { await mcRcon('kick ' + name + ' Nicht mehr freigeschaltet'); } catch (e) { /* egal */ } } return; }
    catch (e) { /* Server aus */ }
    const datei = path.join(mcOrdner(), 'whitelist.json');
    let l = []; try { l = JSON.parse(fs.readFileSync(datei, 'utf8')); } catch (e) { /* neu */ }
    l = l.filter((x) => String(x.name).toLowerCase() !== name.toLowerCase());
    if (rein) l.push({ uuid: mitStrichen(uuid), name });
    fs.writeFileSync(datei, JSON.stringify(l, null, 2));
  }
  const codeOk = (c) => { const x = Buffer.from(c.toLowerCase()), y = Buffer.from(String(zugang.code || '').toLowerCase()); return y.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y); };
  const neuerCode = () => { const w = ['creeper', 'diamant', 'enderman', 'redstone', 'smaragd', 'netherit', 'lava', 'obsidian', 'axolotl', 'golem', 'kaktus', 'kiste', 'fackel', 'portal'];
    return w[crypto.randomInt(w.length)] + '-' + w[crypto.randomInt(w.length)] + '-' + crypto.randomInt(10, 100); };

  // ---------- Leistung: TPS/MSPT (RCON), RAM von Java, CPU/RAM des Laptops ----------
  let cpuVorher = null, sysCache = { zeit: 0, w: null };
  function cpuProzent() {
    const c = require('os').cpus().map((x) => x.times), sum = (t) => t.user + t.nice + t.sys + t.irq + t.idle;
    const jetztT = { ges: c.reduce((a, t) => a + sum(t), 0), leer: c.reduce((a, t) => a + t.idle, 0) }, alt = cpuVorher; cpuVorher = jetztT;
    if (!alt || jetztT.ges <= alt.ges) return null;
    return Math.round(100 * (1 - (jetztT.leer - alt.leer) / (jetztT.ges - alt.ges)));
  }
  const mcRamEinstellung = () => { try { const x = /-Xmx(\d+)G/i.exec(fs.readFileSync(path.join(mcOrdner(), 'start.cmd'), 'utf8')); return x ? Number(x[1]) : null; } catch (e) { return null; } };
  async function mcLeistung(laeuft) {
    const os = require('os'), l = { cpu: cpuProzent(), laptopRamGB: Math.round(os.totalmem() / 1073741824 * 10) / 10, laptopFreiGB: Math.round(os.freemem() / 1073741824 * 10) / 10, ramMaxGB: mcRamEinstellung() };
    if (jetzt() - sysCache.zeit > 30000) sysCache = { zeit: jetzt(), w: await systemWerte().catch(() => null) };
    const w = sysCache.w || {};
    ['tempC', 'akku', 'netz', 'diskFreiGB', 'laufzeitStd', 'takt'].forEach((x) => { if (w[x] !== undefined && w[x] !== null) l[x] = w[x]; });
    if (laeuft && w.javaMB) l.ramGB = Math.round(w.javaMB / 102.4) / 10;
    if (!laeuft) return l;
    try { const t = (await mcRcon('tps')).replace(/§./g, ''); const x = /:\s*\*?([\d.]+),\s*\*?([\d.]+),\s*\*?([\d.]+)/.exec(t); if (x) { l.tps = Math.min(20, Number(x[1])); l.tps15 = Math.min(20, Number(x[3])); } } catch (e) { /* egal */ }
    try { const t = (await mcRcon('mspt')).replace(/§./g, ''); const x = /([\d.]+)\/([\d.]+)\/([\d.]+)/.exec(t); if (x) l.mspt = Number(x[1]); } catch (e) { /* egal */ }
    return l;
  }

  // ---------- Orte auf der Karte ----------
  // minecraft-orte.json: { stand, orte: [{ id, name, kat, welt, x, y, z, notiz, von (Konto), vonMc, zeit }] }
  const KATEGORIEN = { haus: '🏠', hoehle: '🕳️', spawner: '💀', mine: '⛏️', dorf: '🏘️', struktur: '🏰', portal: '🌀', farm: '🌾', fund: '💎', sonstiges: '⭐' };
  const KAT_WOERTER = [[/haus|home|base|basis|zuhause|hütte|burg/i, 'haus'], [/höhle|hoehle|cave|schlucht/i, 'hoehle'], [/spawner|dungeon/i, 'spawner'], [/mine|erz|diamant|eisen|gold|kohle/i, 'mine'],
    [/dorf|village|händler/i, 'dorf'], [/tempel|festung|stronghold|monument|anwesen|mansion|struktur|ruine|schiff|ancient|stadt/i, 'struktur'], [/portal|nether|end/i, 'portal'], [/farm|feld|weizen|tiere/i, 'farm']];
  let orte = lesen('minecraft-orte.json', { stand: 0, orte: [] });
  const orteSpeichern = () => { orte.stand = jetzt(); schreiben('minecraft-orte.json', orte); };
  const WELTEN = ['overworld', 'nether', 'end'];
  const weltVon = (dim) => (/nether/.test(dim) ? 'nether' : /end/.test(dim) ? 'end' : 'overworld');
  async function mcPosition(name) {   // → { x, y, z, welt } per RCON, null wenn nicht online
    try {
      const pos = /\[\s*(-?[\d.]+)d?,\s*(-?[\d.]+)d?,\s*(-?[\d.]+)d?\s*\]/.exec(await mcRcon('data get entity ' + name + ' Pos'));
      if (!pos) return null;
      let dim = ''; try { dim = String(await mcRcon('data get entity ' + name + ' Dimension')).split('data:').pop(); } catch (e) { /* Oberwelt */ }
      return { x: Math.floor(+pos[1]), y: Math.floor(+pos[2]), z: Math.floor(+pos[3]), welt: weltVon(dim) };
    } catch (e) { return null; }
  }
  function ortAnlegen(o) {
    if (orte.orte.length >= 1000) throw Object.assign(new Error('Zu viele Orte – bitte alte löschen.'), { code: 409 });
    if (orte.orte.filter((x) => (o.von && x.von === o.von) || (!o.von && x.vonMc === o.vonMc)).length >= 200) throw Object.assign(new Error('Du hast schon 200 Orte – bitte alte löschen.'), { code: 409 });
    const ort = Object.assign({ id: crypto.randomBytes(6).toString('hex'), zeit: jetzt() }, o);
    orte.orte.push(ort); orteSpeichern(); return ort;
  }
  const kontoVonMc = (mc) => (Object.entries(zugang.konten).find(([, v]) => v.mc.toLowerCase() === mc.toLowerCase()) || [null])[0];
  const mcSagen = (name, text, farbe = 'green') => mcRcon('tellraw ' + name + ' ' + JSON.stringify({ text, color: farbe })).catch(() => {});
  // Server-Log mitlesen: Chat-Befehle „!ort …“ und „!haus“
  let logStand = null;
  async function mcLogPruefen() {
    const datei = path.join(mcOrdner(), 'logs', 'latest.log');
    let groesse; try { groesse = fs.statSync(datei).size; } catch (e) { return; }
    if (logStand === null) { logStand = groesse; return; }
    if (groesse < logStand) logStand = 0;
    if (groesse === logStand) return;
    const fd = fs.openSync(datei, 'r'), buf = Buffer.alloc(Math.min(groesse - logStand, 256 * 1024));
    fs.readSync(fd, buf, 0, buf.length, logStand); fs.closeSync(fd);
    const text = buf.toString('utf8'), ende = text.lastIndexOf('\n'); if (ende < 0) return;
    logStand += Buffer.byteLength(text.slice(0, ende + 1));
    for (const zeile of text.slice(0, ende).split(/\r?\n/)) {
      const x = /^\[[\d:]+ INFO\]: (?:\[[^\]]*\] )?<([A-Za-z0-9_]{3,16})> !(ort|haus)\b\s*(.*)$/i.exec(zeile.replace(/§./g, ''));
      if (!x) continue;
      const wer = x[1], name = (x[2].toLowerCase() === 'haus' ? (x[3].trim() || 'Haus von ' + wer) : x[3].trim()).slice(0, 40);
      if (!name) { await mcSagen(wer, 'So geht\'s: !ort Höhle mit Diamanten  (oder !haus)', 'yellow'); continue; }
      const pos = await mcPosition(wer); if (!pos) continue;
      const kat = x[2].toLowerCase() === 'haus' ? 'haus' : (KAT_WOERTER.find(([re]) => re.test(name)) || [, 'sonstiges'])[1];
      try { ortAnlegen({ name, kat, welt: pos.welt, x: pos.x, y: pos.y, z: pos.z, notiz: '', von: kontoVonMc(wer), vonMc: wer });
        await mcSagen(wer, KATEGORIEN[kat] + ' „' + name + '“ ist jetzt auf der Karte (' + pos.x + ' / ' + pos.y + ' / ' + pos.z + ')');
        mcProtokoll(wer + ' hat „' + name + '“ markiert'); }
      catch (e) { await mcSagen(wer, e.message, 'red'); }
    }
  }
  // Symbol für die Karte (SVG, auch wenn squaremap „.png“ anfragt)
  const ortSymbol = (kat) => '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 39 C16 39 3 24 3 15 a13 13 0 0 1 26 0 C29 24 16 39 16 39Z" fill="#151a20" stroke="#7cd152" stroke-width="2.5"/>'
    + '<text x="16" y="21" font-size="15" text-anchor="middle" dominant-baseline="middle">' + (KATEGORIEN[kat] || '⭐') + '</text></svg>';
  // Unsere Orte als zusätzliche Ebene in squaremaps markers.json
  function orteEbene(weltName) {
    const welt = weltVon(weltName), esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return { id: 'spielekiste_orte', name: '📍 Orte', control: true, hide: false, order: 50, z_index: 50, timestamp: orte.stand,
      markers: orte.orte.filter((o) => o.welt === welt).map((o) => ({ type: 'icon', point: { x: o.x, z: o.z }, size: { x: 32, z: 40 }, anchor: { x: 16, z: 39 }, tooltip_anchor: { x: 0, z: -36 },
        icon: 'sk_' + o.kat, tooltip: esc((KATEGORIEN[o.kat] || '') + ' ' + o.name),
        popup: '<b>' + esc((KATEGORIEN[o.kat] || '') + ' ' + o.name) + '</b><br>' + o.x + ' / ' + o.y + ' / ' + o.z + (o.notiz ? '<br>' + esc(o.notiz) : '') + '<br><small>von ' + esc(o.vonMc || (konten[o.von] || {}).name || '?') + '</small>' })) };
  }

  const logUhr = logTakt > 0 ? setInterval(() => { mcLogPruefen().catch(() => {}); }, logTakt) : null;
  if (logUhr && logUhr.unref) logUhr.unref();

  // ---------- Server-Zentrale: Einstellungen, Auto-Update, Verlauf ----------
  const ordnerBasis = () => basis || path.dirname(daten);
  const liesB = (f) => { try { return fs.readFileSync(path.join(ordnerBasis(), f), 'utf8'); } catch (e) { return ''; } };
  let zentrale = Object.assign({ autoUpdate: true }, lesen('zentrale.json', {}));
  const zentraleSpeichern = () => schreiben('zentrale.json', zentrale);
  const protokollUpdate = (t) => { try { fs.appendFileSync(path.join(ordnerBasis(), 'update.log'), new Date(jetzt()).toISOString().replace('T', ' ').slice(0, 19) + '  ' + t + '\n'); } catch (e) { /* egal */ } };
  // Gibt es auf GitHub etwas Neues? (zwischengespeichert, damit Klicks GitHub nicht fluten)
  async function updatePruefen(frisch) {
    if (!frisch && pruefCache && jetzt() - pruefCache.zeit < 20e3) return pruefCache.antwort;
    const zweig = liesB('update-zweig.txt').trim() || 'spielstand-sync', aktuell = liesB('version.txt').trim();
    const kopf = await github('/commits/' + encodeURIComponent(zweig));
    const neu = String(kopf.sha || ''), antwort = { aktuell: aktuell.slice(0, 7), neu: neu.slice(0, 7), neuer: !!neu && neu !== aktuell, anzahl: 0, aenderungen: [] };
    if (antwort.neuer) {
      if (aktuell) {
        try {
          const v = await github('/compare/' + aktuell + '...' + neu);
          antwort.anzahl = v.ahead_by || 0;
          antwort.aenderungen = (v.commits || []).map((c) => String((c.commit && c.commit.message) || '').split('\n')[0].slice(0, 120)).reverse().slice(0, 8);
        } catch (e) { /* Vergleich ist nur Zugabe */ }
      } else antwort.aenderungen = [String((kopf.commit && kopf.commit.message) || '').split('\n')[0].slice(0, 120)];
    }
    antwort.sha = neu;
    pruefCache = { zeit: jetzt(), antwort };
    return antwort;
  }
  // Auto-Update: alle 10 Min. nachsehen; gibt es eine neue Version, das Update starten (dieselbe Version höchstens zweimal versuchen)
  const autoVersuche = {};
  async function autoUpdate() {
    if (!zentrale.autoUpdate || jetzt() - letztesUpdate < 10 * 60e3) return false;
    let a; try { a = await updatePruefen(true); } catch (e) { return false; }
    if (!a.neuer || (autoVersuche[a.sha] || 0) >= 2) return false;
    autoVersuche[a.sha] = (autoVersuche[a.sha] || 0) + 1;
    letztesUpdate = jetzt(); pruefCache = null;
    protokollUpdate('Auto-Update: neue Version ' + a.neu + ' gefunden – starte Update');
    try { await updateStarten(); return true; } catch (e) { protokollUpdate('Auto-Update: FEHLER beim Starten (' + e.message + ')'); return false; }
  }
  const autoUhr = autoTakt > 0 ? setInterval(() => { autoUpdate().catch(() => {}); }, autoTakt) : null;
  if (autoUhr && autoUhr.unref) autoUhr.unref();

  // Verlauf: alle 5 Min. ein Messpunkt [zeit, dienste, cpu %, RAM belegt %, °C, Minecraft-Spieler]
  // dienste: ein Zeichen je Dienst in DIENSTE: 1 = läuft, 0 = gestört, - = nicht eingerichtet/absichtlich aus
  const DIENSTE = ['Caddy', 'Konto-Server', 'DuckDNS', 'Wachhund', 'AdGuard', 'Minecraft'];
  let verlauf = lesen('verlauf.json', { p: [] });
  const cpuStand = { wert: null };
  function cpuMessen() {
    const c = require('os').cpus().map((x) => x.times), ges = c.reduce((a, t) => a + t.user + t.nice + t.sys + t.irq + t.idle, 0), leer = c.reduce((a, t) => a + t.idle, 0);
    const alt = cpuStand.wert; cpuStand.wert = { ges, leer };
    return alt && ges > alt.ges ? Math.round(100 * (1 - (leer - alt.leer) / (ges - alt.ges))) : null;
  }
  function dienstZeichen(name, zustand) {
    if (name === 'Minecraft' && fs.existsSync(path.join(ordnerBasis(), 'minecraft-aus.txt'))) return '-';
    if (!zustand || zustand === 'fehlt') return '-';
    return /^(Running|läuft)$/i.test(zustand) ? '1' : '0';
  }
  async function zentraleMessen() {
    const os = require('os'), cpu = cpuMessen();
    const w = (await diensteAbfragen().catch(() => null)) || {}, d = Object.assign({ 'Konto-Server': 'Running' }, w.dienste || {});
    let temp = null; try { const sw = await systemWerte(); if (sw && sw.tempC != null) temp = sw.tempC; } catch (e) { /* egal */ }
    let spieler = null; if (mcInstalliert()) { const st = await mcLaeuft(); if (st.laeuft) spieler = st.online.length; }
    verlauf.p.push([jetzt(), DIENSTE.map((n) => dienstZeichen(n, d[n])).join(''), cpu, Math.round(100 * (1 - os.freemem() / os.totalmem())), temp, spieler]);
    const grenze = jetzt() - 31 * 864e5; while (verlauf.p.length && verlauf.p[0][0] < grenze) verlauf.p.shift();
    schreiben('verlauf.json', verlauf);
  }
  const messUhr = messTakt > 0 ? setInterval(() => { zentraleMessen().catch(() => {}); }, messTakt) : null;
  if (messUhr && messUhr.unref) messUhr.unref();
  if (messTakt > 0) { cpuMessen(); setTimeout(() => zentraleMessen().catch(() => {}), 20000).unref(); }
  // Verfügbarkeit: Anteil der Messpunkte, an denen der Dienst lief. „Server erreichbar“ zählt auch fehlende Messpunkte (Laptop aus) als Ausfall.
  function verfuegbarkeit(tage) {
    const von = jetzt() - tage * 864e5, p = verlauf.p.filter((x) => x[0] >= von), r = {};
    if (!p.length) return null;
    const erwartet = Math.max(1, Math.round((jetzt() - Math.max(von, verlauf.p[0][0])) / messTakt));
    r.gesamt = Math.min(100, Math.round(1000 * p.length / erwartet) / 10);
    DIENSTE.forEach((n, i) => { const z = p.map((x) => x[1][i]).filter((c) => c === '1' || c === '0'); r[n] = z.length ? Math.round(1000 * z.filter((c) => c === '1').length / z.length) / 10 : null; });
    return r;
  }

  async function bearbeiten(req, res) {
    const url = new URL(req.url, 'http://x'), weg = url.pathname.replace(/^.*?\/api\//, '/');
    // hinter Caddy: der echte Anschluss steht im letzten X-Forwarded-For-Eintrag
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').pop().trim();
    const sicher = req.headers['x-forwarded-proto'] === 'https';
    const m = req.method;

    if (weg === '/ich' && m === 'GET') {
      const s = sitzungVon(req);
      return s ? senden(res, 200, Object.assign({ name: konten[s.schluessel].name }, admins.has(s.schluessel) ? { admin: true } : {})) : senden(res, 401, { server: 'spielekiste' });
    }

    if ((weg === '/registrieren' || weg === '/anmelden') && m === 'POST') {
      const b = await koerper(req), name = String(b.name || '').trim(), pin = String(b.pin || '');
      if (!NAME_RE.test(name)) return senden(res, 400, { fehler: 'Der Name braucht 3–20 Zeichen (Buchstaben, Ziffern, . _ -).' });
      if (!PIN_RE.test(pin)) return senden(res, 400, { fehler: 'Die PIN besteht aus 4 bis 8 Ziffern.' });
      const k = schluessel(name);
      if (weg === '/registrieren') {
        if (konten[k]) return senden(res, 409, { fehler: 'Den Namen „' + name + '“ gibt es schon. Bitte einen anderen wählen – oder anmelden, wenn es deiner ist.' });
        if (zuViel('neu', ip, 5)) return senden(res, 429, { fehler: 'Gerade wurden zu viele Konten angelegt. Bitte später nochmal.' });
        if (Object.keys(konten).length >= MAX_KONTEN) return senden(res, 403, { fehler: 'Auf diesem Server ist kein Platz für weitere Konten.' });
        const salz = crypto.randomBytes(16).toString('hex');
        konten[k] = { name, salz, hash: hashen(pin, salz), erstellt: jetzt(), fehl: 0 };
        schreiben('konten.json', konten); zaehlen('neu', ip);
        anmeldenAls(res, k, sicher);
        return senden(res, 200, { name, neu: true });
      }
      if (zuViel('fehl', ip, 30)) return senden(res, 429, { fehler: 'Zu viele Fehlversuche. Bitte in einer Stunde nochmal.' });
      const konto = konten[k];
      if (!konto) { zaehlen('fehl', ip); return senden(res, 401, { fehler: 'Name oder PIN stimmt nicht.' }); }
      if (konto.sperreBis && konto.sperreBis > jetzt()) return senden(res, 429, { fehler: 'Zu viele falsche PINs – „' + konto.name + '“ ist noch ' + Math.ceil((konto.sperreBis - jetzt()) / 60e3) + ' Minuten gesperrt.' });
      if (!pinOk(konto, pin)) {
        zaehlen('fehl', ip);
        konto.fehl = (konto.fehl || 0) + 1;
        if (konto.fehl >= 5) { konto.sperreMin = Math.min((konto.sperreMin || 7.5) * 2, 24 * 60); konto.sperreBis = jetzt() + konto.sperreMin * 60e3; konto.fehl = 0; }
        schreiben('konten.json', konten);
        return senden(res, 401, { fehler: 'Name oder PIN stimmt nicht.' });
      }
      konto.fehl = 0; konto.sperreBis = 0; konto.sperreMin = 0; schreiben('konten.json', konten);
      anmeldenAls(res, k, sicher);
      return senden(res, 200, { name: konto.name });
    }

    if (weg === '/abmelden' && m === 'POST') {
      const s = sitzungVon(req);
      if (s) { delete sitzungen[s.hash]; schreiben('sitzungen.json', sitzungen); }
      res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return senden(res, 200, {});
    }

    // ---------- ab hier nur angemeldet ----------
    const s = sitzungVon(req);
    if (!s) return senden(res, 401, { server: 'spielekiste' });
    const k = s.schluessel, standDatei = 'staende/' + dateiname(k) + '.json';

    // ---------- Minecraft-Seite (alle Angemeldeten) ----------
    if (weg === '/minecraft/info' && m === 'GET') {
      if (!mcInstalliert()) return senden(res, 200, { installiert: false, admin: admins.has(k) });
      const st = await mcLaeuft();
      let version = ''; try { version = fs.readFileSync(path.join(mcOrdner(), 'paper-version.txt'), 'utf8').trim(); } catch (e) { /* egal */ }
      return senden(res, 200, Object.assign({ installiert: true, admin: admins.has(k), adresse: String(req.headers.host || '').replace(/:\d+$/, ''), version, karte: mcKarteDa(),
        beschaeftigt: mcBeschaeftigt, spieler: mcStatistik(), aktivitaet: mcAktivitaet(),
        zugang: { modus: zugang.modus, mein: zugang.konten[k] ? zugang.konten[k].mc : '' }, leistung: await mcLeistung(st.laeuft), maxSpieler: Number(mcProps()['max-players']) || 20, seed: admins.has(k) ? mcProps()['level-seed'] || '' : undefined }, st));
    }
    if (weg === '/minecraft/beitreten' && m === 'POST') {
      if (!mcInstalliert() || (zugang.modus === 'aus' && !admins.has(k))) return senden(res, 403, { fehler: 'Selbst eintragen ist gerade ausgeschaltet – frag den Admin.' });
      const b = await koerper(req), name = String(b.name || '').trim(), code = String(b.code || '').trim();
      if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) return senden(res, 400, { fehler: 'Minecraft-Namen bestehen aus 3–16 Buchstaben, Ziffern oder _.' });
      if (zugang.modus === 'code' && !admins.has(k)) {
        if (zuViel('mccode', k, 5)) return senden(res, 429, { fehler: 'Zu viele falsche Codes – bitte in einer Stunde nochmal.' });
        if (!codeOk(code)) { zaehlen('mccode', k); return senden(res, 403, { fehler: 'Der Beitrittscode stimmt nicht.' }); }
      }
      let profil; try { profil = await mojangProfil(name); } catch (e) { return senden(res, 502, { fehler: 'Mojang ist gerade nicht erreichbar – bitte gleich nochmal.' }); }
      if (!profil || !profil.id) return senden(res, 404, { fehler: 'Den Minecraft-Namen „' + name + '“ gibt es nicht (Java Edition). Tippfehler?' });
      const anderer = Object.entries(zugang.konten).find(([x, v]) => x !== k && v.mc.toLowerCase() === profil.name.toLowerCase());
      if (anderer) return senden(res, 409, { fehler: profil.name + ' ist schon mit einem anderen Konto verknüpft.' });
      const alt = zugang.konten[k];
      if (alt && alt.mc.toLowerCase() !== profil.name.toLowerCase()) await whitelistSetzen(alt.mc, alt.uuid, false);
      await whitelistSetzen(profil.name, profil.id, true);
      zugang.konten[k] = { mc: profil.name, uuid: mitStrichen(profil.id), zeit: jetzt() }; zugangSpeichern();
      mcProtokoll(konten[k].name + ' hat sich als ' + profil.name + ' freigeschaltet');
      return senden(res, 200, { name: profil.name });
    }
    if (weg === '/minecraft/austreten' && m === 'POST') {
      const alt = zugang.konten[k];
      if (alt) { await whitelistSetzen(alt.mc, alt.uuid, false); delete zugang.konten[k]; zugangSpeichern(); mcProtokoll(konten[k].name + ' hat ' + alt.mc + ' entfernt'); }
      return senden(res, 200, {});
    }
    if (weg === '/minecraft/orte' && m === 'GET') {
      return senden(res, 200, { orte: orte.orte.map((o) => ({ id: o.id, name: o.name, kat: o.kat, welt: o.welt, x: o.x, y: o.y, z: o.z, notiz: o.notiz || '', zeit: o.zeit,
        von: o.vonMc || (konten[o.von] || {}).name || '?', eigen: o.von === k || admins.has(k) })), kategorien: KATEGORIEN, meinMc: zugang.konten[k] ? zugang.konten[k].mc : '' });
    }
    if (weg === '/minecraft/orte' && m === 'POST') {
      if (!mcInstalliert()) return senden(res, 400, { fehler: 'Minecraft ist nicht installiert.' });
      const b = await koerper(req), name = String(b.name || '').trim().slice(0, 40), kat = String(b.kat || 'sonstiges'), notiz = String(b.notiz || '').trim().slice(0, 200);
      if (!name) return senden(res, 400, { fehler: 'Bitte einen Namen eingeben.' });
      if (!KATEGORIEN[kat]) return senden(res, 400, { fehler: 'Unbekannte Kategorie.' });
      let pos;
      if (b.hier) {
        const mc = zugang.konten[k] && zugang.konten[k].mc;
        if (!mc) return senden(res, 400, { fehler: 'Trag zuerst oben bei „Mitspielen“ deinen Minecraft-Namen ein.' });
        pos = await mcPosition(mc);
        if (!pos) return senden(res, 409, { fehler: mc + ' ist gerade nicht im Spiel – oder der Server ist aus.' });
      } else {
        const zahl = (v, max) => { const n = Number(v); return Number.isInteger(n) && Math.abs(n) <= max ? n : null; };
        pos = { x: zahl(b.x, 30000000), y: b.y === '' || b.y == null ? 64 : zahl(b.y, 2048), z: zahl(b.z, 30000000), welt: String(b.welt || 'overworld') };
        if (pos.x == null || pos.y == null || pos.z == null) return senden(res, 400, { fehler: 'Koordinaten bitte als ganze Zahlen (X und Z, Y optional).' });
        if (!WELTEN.includes(pos.welt)) return senden(res, 400, { fehler: 'Unbekannte Welt.' });
      }
      try { const o = ortAnlegen(Object.assign({ name, kat, notiz, von: k, vonMc: zugang.konten[k] ? zugang.konten[k].mc : '' }, pos)); return senden(res, 200, { ort: o }); }
      catch (e) { return senden(res, e.code || 500, { fehler: e.message }); }
    }
    if (weg === '/minecraft/orte/loeschen' && m === 'POST') {
      const b = await koerper(req), o = orte.orte.find((x) => x.id === String(b.id || ''));
      if (!o) return senden(res, 404, { fehler: 'Ort nicht gefunden.' });
      if (o.von !== k && !admins.has(k)) return senden(res, 403, { fehler: 'Nur eigene Orte löschen.' });
      orte.orte = orte.orte.filter((x) => x !== o); orteSpeichern();
      return senden(res, 200, {});
    }
    if (weg.startsWith('/minecraft/karte/images/icon/registered/sk_') && m === 'GET') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=86400' });
      return res.end(ortSymbol(weg.replace(/^.*\/sk_|\.png$/g, '')));
    }
    if (weg.startsWith('/minecraft/kopf/') && m === 'GET') {
      const uuid = weg.slice('/minecraft/kopf/'.length);
      if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(uuid)) return senden(res, 400, { fehler: 'ungültig' });
      const b = await mcSkin(uuid.toLowerCase()).catch(() => null);
      if (!b) return senden(res, 404, { fehler: 'kein Skin' });
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=86400' }); return res.end(b);
    }
    if (weg === '/minecraft/karte' && m === 'GET') { res.writeHead(302, { Location: url.pathname + '/' }); return res.end(); }
    if (weg.startsWith('/minecraft/karte/') && m === 'GET') {
      if (!mcKarteDa()) return senden(res, 404, { fehler: 'Karte nicht installiert.' });
      const marker = /^\/minecraft\/karte\/tiles\/([^/]+)\/markers\.json$/.exec(weg);
      const p = http.request({ host: karteHost, port: mcKartePort(), path: weg.slice('/minecraft/karte'.length) + url.search, method: 'GET' }, (r) => {
        if (!marker) { res.writeHead(r.statusCode, { 'Content-Type': r.headers['content-type'] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); return r.pipe(res); }
        const teile = []; r.on('data', (c) => teile.push(c)); r.on('end', () => {
          let l = []; try { l = JSON.parse(Buffer.concat(teile).toString('utf8')); } catch (e) { /* squaremap hat (noch) keine Marker */ }
          if (!Array.isArray(l)) l = [];
          senden(res, 200, l.concat(orteEbene(decodeURIComponent(marker[1]))));
        });
      });
      p.on('error', () => { if (!res.headersSent) senden(res, 502, { fehler: 'Karte gerade nicht erreichbar – läuft der Minecraft-Server?' }); });
      return p.end();
    }

    if (weg === '/abgleich' && m === 'POST') {
      const b = await koerper(req), basis = Number(b.basis) || 0, aend = b.aenderungen || {};
      if (!aenderungenPruefen(aend)) return senden(res, 400, { fehler: 'Ungültige Änderungen' });
      const st = standLesen(standDatei), neueVersion = st.version + 1;
      let geaendert = false; const vonHier = new Set();
      for (const [schl, x] of Object.entries(aend)) {
        if (NIE_SPEICHERN.includes(schl)) continue;
        const e = st.eintraege[schl];
        if (x.alt && e && e.ver > basis) continue;                 // anderes Gerät war neuer – Kleinkram vom Öffnen verwirft sich
        vonHier.add(schl);
        if (e ? e.v === x.v : x.v === null) continue;              // nichts Neues
        st.eintraege[schl] = { v: x.v, ver: neueVersion }; geaendert = true;
      }
      if (geaendert) {
        st.version = neueVersion; st.zeit = new Date(jetzt()).toISOString();
        st.geraet = String(b.geraet || '').slice(0, 30); st.stand = String(b.stand || '').slice(0, 30);
        schreiben(standDatei, st);
        const archiv = 'archiv/' + dateiname(k) + '-' + new Date(jetzt()).toISOString().slice(0, 10) + '.json';
        if (!fs.existsSync(path.join(daten, archiv))) {
          schreiben(archiv, st);
          // Tageskopien älter als 30 Tage löschen
          const grenze = new Date(jetzt() - 30 * 864e5).toISOString().slice(0, 10), vor = dateiname(k) + '-';
          for (const f of fs.readdirSync(path.join(daten, 'archiv'))) if (f.startsWith(vor) && f.slice(vor.length, vor.length + 10) < grenze) fs.rmSync(path.join(daten, 'archiv', f), { force: true });
        }
      }
      const oe = oeffentlichSaeubern(b.oeffentlich);
      if (oe) { bestenliste[k] = Object.assign(oe, { zeit: jetzt() }); schreiben('bestenliste.json', bestenliste); }
      // Nur zurückschicken, was ein anderes Gerät seit „basis“ geändert hat (das eben Hochgeladene kennt das Gerät ja)
      const neu = {}; let n = 0;
      Object.entries(st.eintraege).forEach(([schl, e]) => { if (e.ver > basis && !vonHier.has(schl)) { neu[schl] = e.v; n++; } });
      return senden(res, 200, n ? { version: st.version, zeit: st.zeit, geraet: st.geraet, neu } : { version: st.version });
    }
    if (weg === '/bestenliste' && m === 'GET') {
      const liste = Object.entries(bestenliste).filter(([schl]) => konten[schl])
        .map(([schl, e]) => Object.assign({ name: konten[schl].name }, e, schl === k ? { ich: true } : {}))
        .sort((a, b) => b.xp - a.xp || b.level - a.level || a.name.localeCompare(b.name));
      return senden(res, 200, liste);
    }
    // ---------- Admin: Server nach Bedarf aktualisieren ----------
    if (weg.startsWith('/admin/')) {
      if (!admins.has(k)) return senden(res, 403, { fehler: 'Nur für den Betreiber.' });
      const lies = (f) => { try { return fs.readFileSync(path.join(basis || path.dirname(daten), f), 'utf8'); } catch (e) { return ''; } };
      if (weg === '/admin/status' && m === 'GET') {
        return senden(res, 200, { version: lies('version.txt').trim().slice(0, 7), log: lies('update.log').trim().split(/\r?\n/).filter(Boolean).slice(-6),
          konten: Object.keys(konten).length,
          erweiterungen: { adguard: { installiert: fs.existsSync(path.join(basis || path.dirname(daten), 'AdGuardHome', 'AdGuardHome.exe')), laeuft: await dnsPruefen() } },
          erweiterungenLog: lies('erweiterungen.log').trim().split(/\r?\n/).filter(Boolean).slice(-4), lanIp: lanIp(), aufgabe: await aufgabeAbfragen(),
          autoUpdate: zentrale.autoUpdate, aktualisiertAm: (() => { try { return fs.statSync(path.join(ordnerBasis(), 'version.txt')).mtimeMs; } catch (e) { return null; } })(),
          healthchecks: !!liesB('healthchecks-url.txt').trim(), minecraft: mcInstalliert(), minecraftGestoppt: fs.existsSync(path.join(ordnerBasis(), 'minecraft-aus.txt')) });
      }
      if (weg === '/admin/system' && m === 'GET') {
        const os = require('os'), ordner = basis || path.dirname(daten);
        // CPU-Last: zwei Messungen im Abstand von 400 ms
        const zeiten = () => os.cpus().reduce((a, c) => { const t = c.times; a.ruhe += t.idle; a.alle += t.user + t.nice + t.sys + t.idle + t.irq; return a; }, { ruhe: 0, alle: 0 });
        // Schnitt seit der letzten Abfrage (≥ 5 s, gemessen bevor PowerShell startet) – sonst kurz 1 s messen
        let z1 = cpuSystemStand && jetzt() - cpuSystemStand.zeit >= 5000 ? cpuSystemStand : null;
        if (!z1) { z1 = zeiten(); await new Promise((ok) => setTimeout(ok, 1000)); }
        const z2 = zeiten(); cpuSystemStand = Object.assign({ zeit: jetzt() }, z2);
        const cpu = Math.max(0, Math.min(100, Math.round(100 * (1 - (z2.ruhe - z1.ruhe) / Math.max(1, z2.alle - z1.alle)))));
        let platte = null; try { const st = fs.statfsSync(ordner); platte = { frei: st.bavail * st.bsize, gesamt: st.blocks * st.bsize }; } catch (e) { /* ältere Node-Version */ }
        const w = (await diensteAbfragen()) || {};
        return senden(res, 200, { laeuftSeit: Math.round(os.uptime()), ram: { frei: os.freemem(), gesamt: os.totalmem() }, cpu, platte, akku: w.akku ?? null, netz: w.netz ?? null,
          dienste: Object.assign({ 'Konto-Server': 'Running' }, w.dienste || {}), name: os.hostname(),
          werte: await systemWerte().catch(() => null) });
      }
      if (weg === '/admin/aktion' && m === 'POST') {
        const b = await koerper(req), a = AKTIONEN[String(b.aktion || '')];
        if (!a) return senden(res, 400, { fehler: 'Unbekannte Aktion.' });
        if (jetzt() - letzteAktion < 30e3) return senden(res, 429, { fehler: 'Bitte 30 Sekunden zwischen zwei Aktionen warten.' });
        letzteAktion = jetzt();
        try { aktionStarten(a.ps, basis || path.dirname(daten)); } catch (e) { return senden(res, 500, { fehler: 'Konnte nicht gestartet werden.' }); }
        fs.appendFileSync(path.join(basis || path.dirname(daten), 'update.log'), new Date(jetzt()).toISOString().replace('T', ' ').slice(0, 19) + '  Steuerung: ' + a.name + '\n');
        return senden(res, 200, { gestartet: true, name: a.name });
      }
      if (weg === '/admin/protokoll' && m === 'GET') {
        const datei = PROTOKOLLE[url.searchParams.get('datei') || ''];
        if (!datei) return senden(res, 400, { fehler: 'Unbekanntes Protokoll.' });
        return senden(res, 200, { zeilen: lies(datei).trim().split(/\r?\n/).filter(Boolean).slice(-40) });
      }
      // ---------- Minecraft (Admin) ----------
      if (weg === '/admin/minecraft') {
        if (m === 'GET') {
          if (!mcInstalliert()) return senden(res, 200, { installiert: false });
          const st = await mcLaeuft(); let whitelist = [];
          if (st.laeuft) { try { const w = await mcRcon('whitelist list'); const wn = w.split(':').slice(1).join(':').trim(); whitelist = wn ? wn.split(/,\s*(?:and\s+)?|\s+and\s+/).filter(Boolean) : []; } catch (e) { /* egal */ } }
          let version = ''; try { version = fs.readFileSync(path.join(mcOrdner(), 'paper-version.txt'), 'utf8').trim(); } catch (e) { /* egal */ }
          const p = mcProps(), einstellungen = {}; Object.keys(EIGENSCHAFTEN).concat(['level-seed']).forEach((x) => { if (x in p) einstellungen[x] = p[x]; });
          const regeln = st.laeuft ? await mcRegeln() : null;
          const ops = mcJson('ops.json', []).map((o) => o.name), gebannt = mcJson('banned-players.json', []).map((o) => ({ name: o.name, grund: o.reason || '' }));
          return senden(res, 200, Object.assign({ installiert: true, version, whitelist, einstellungen, gestoppt: fs.existsSync(mcAusFlagge()), beschaeftigt: mcBeschaeftigt, karte: mcKarteDa(),
            plugins: mcPlugins(), ops, gebannt, regeln,
            zugang: { modus: zugang.modus, code: zugang.code, konten: Object.entries(zugang.konten).map(([x, v]) => ({ konto: konten[x] ? konten[x].name : x, mc: v.mc, zeit: v.zeit })) } }, st));
        }
        if (m === 'POST') {
          const b = await koerper(req), aktion = String(b.aktion || ''), spieler = String(b.spieler || '').trim();
          if (!mcInstalliert()) return senden(res, 400, { fehler: 'Minecraft ist nicht installiert.' });
          if (aktion === 'freischalten' || aktion === 'entfernen') {
            if (!/^[A-Za-z0-9_]{3,16}$/.test(spieler)) return senden(res, 400, { fehler: 'Minecraft-Namen bestehen aus 3–16 Buchstaben, Ziffern oder _.' });
            try {
              const a = await mcRcon('whitelist ' + (aktion === 'freischalten' ? 'add ' : 'remove ') + spieler);
              if (aktion === 'entfernen') { try { await mcRcon('kick ' + spieler + ' Von der Whitelist entfernt'); } catch (e) { /* war nicht online */ } }
              mcProtokoll((aktion === 'freischalten' ? 'freigeschaltet: ' : 'entfernt: ') + spieler);
              return senden(res, 200, { antwort: a });
            } catch (e) { return senden(res, 409, { fehler: 'Der Server läuft gerade nicht – erst starten.' }); }
          }
          if (aktion === 'einstellungen') {
            const werte = b.werte || {}, sauber = {};
            for (const [x, v] of Object.entries(werte)) {
              if (!EIGENSCHAFTEN[x]) return senden(res, 400, { fehler: 'Unbekannte Einstellung: ' + x });
              if (!gueltig(EIGENSCHAFTEN[x], String(v))) return senden(res, 400, { fehler: 'Ungültiger Wert für ' + x });
              sauber[x] = String(v);
            }
            mcPropsSchreiben(sauber); mcProtokoll('Einstellungen geändert: ' + Object.keys(sauber).join(', '));
            return senden(res, 200, { ok: true, neustartNoetig: true });
          }
          if (aktion === 'ram') {
            const gb = Number(b.gb), max = Math.max(1, Math.floor(require('os').totalmem() / 1073741824) - 2);
            if (!Number.isInteger(gb) || gb < 1 || gb > max) return senden(res, 400, { fehler: 'Arbeitsspeicher: 1 bis ' + max + ' GB (der Laptop braucht selbst etwa 2 GB).' });
            const datei = path.join(mcOrdner(), 'start.cmd');
            let t; try { t = fs.readFileSync(datei, 'utf8'); } catch (e) { return senden(res, 404, { fehler: 'start.cmd fehlt – Minecraft neu installieren.' }); }
            if (!/-Xmx\d+G/i.test(t)) return senden(res, 400, { fehler: 'start.cmd hat ein unbekanntes Format.' });
            fs.writeFileSync(datei, t.replace(/-Xms\d+G/i, '-Xms' + Math.min(gb, 2) + 'G').replace(/-Xmx\d+G/i, '-Xmx' + gb + 'G'));
            try { fs.writeFileSync(path.join(mcBasis(), 'minecraft-ram.txt'), String(gb)); } catch (e) { /* egal */ }
            mcProtokoll('Arbeitsspeicher: ' + gb + ' GB');
            return senden(res, 200, { gb, neustartNoetig: true });
          }
          if (aktion === 'zugang') {
            const modus = String(b.modus || zugang.modus);
            if (!['code', 'offen', 'aus'].includes(modus)) return senden(res, 400, { fehler: 'Unbekannter Modus.' });
            let code = b.neuerCode ? neuerCode() : b.code !== undefined ? String(b.code).trim() : zugang.code;
            if (modus === 'code' && !code) code = neuerCode();
            if (code && !/^[A-Za-z0-9äöüÄÖÜß_-]{4,32}$/.test(code)) return senden(res, 400, { fehler: 'Code: 4–32 Zeichen, Buchstaben, Ziffern, - oder _.' });
            zugang.modus = modus; zugang.code = code; zugangSpeichern(); mcProtokoll('Selbst eintragen: ' + modus);
            return senden(res, 200, { modus, code });
          }
          if (['op', 'deop', 'kick', 'ban', 'pardon'].includes(aktion)) {
            if (!/^[A-Za-z0-9_]{3,16}$/.test(spieler)) return senden(res, 400, { fehler: 'Minecraft-Namen bestehen aus 3–16 Buchstaben, Ziffern oder _.' });
            const grund = String(b.grund || '').replace(/[\r\n]/g, ' ').slice(0, 80);
            try {
              const a = await mcRcon(aktion + ' ' + spieler + ((aktion === 'kick' || aktion === 'ban') && grund ? ' ' + grund : ''));
              mcProtokoll(aktion + ' ' + spieler); return senden(res, 200, { antwort: a });
            } catch (e) { return senden(res, 409, { fehler: 'Der Server läuft gerade nicht – erst starten.' }); }
          }
          if (aktion === 'regeln') {
            const werte = b.werte || {}, ok = [];
            for (const [x, v] of Object.entries(werte)) {
              if (!SPIELREGELN[x]) return senden(res, 400, { fehler: 'Unbekannte Spielregel: ' + x });
              if (!gueltig(SPIELREGELN[x], String(v))) return senden(res, 400, { fehler: 'Ungültiger Wert für ' + x });
            }
            try { for (const [x, v] of Object.entries(werte)) { await mcRcon('gamerule ' + x + ' ' + v); ok.push(x); } }
            catch (e) { return senden(res, 409, { fehler: 'Der Server läuft gerade nicht – Spielregeln gehen nur bei laufendem Server.' }); }
            mcProtokoll('Spielregeln: ' + ok.map((x) => x + '=' + werte[x]).join(', '));
            return senden(res, 200, { ok: true });
          }
          if (aktion === 'befehl') {
            const befehl = String(b.befehl || '').trim().replace(/^\//, '');
            if (!befehl || befehl.length > 200 || /[\r\n]/.test(befehl)) return senden(res, 400, { fehler: 'Ungültiger Befehl.' });
            if (/^(stop|restart)\b/i.test(befehl)) return senden(res, 400, { fehler: 'Bitte die Knöpfe Stopp/Neustart nehmen (sonst startet der Wachhund ihn ungefragt neu).' });
            try { const a = await mcRcon(befehl); mcProtokoll('Befehl: ' + befehl); return senden(res, 200, { antwort: a.replace(/§./g, '') }); }
            catch (e) { return senden(res, 409, { fehler: 'Der Server läuft gerade nicht – erst starten.' }); }
          }
          if (aktion === 'plugin-suchen') {
            const suche = String(b.suche || '').trim().slice(0, 60), v = mcVersion();
            const facets = JSON.stringify([['project_type:plugin'], ['categories:paper'], ['server_side:required', 'server_side:optional']].concat(v ? [['versions:' + v]] : []));
            let r;
            try { r = await modrinth('/search?limit=12&index=' + (suche ? 'relevance' : 'downloads') + '&query=' + encodeURIComponent(suche) + '&facets=' + encodeURIComponent(facets)); }
            catch (e) { return senden(res, 502, { fehler: 'Modrinth gerade nicht erreichbar.' }); }
            const da = new Set(mcPlugins().map((x) => x.slug).filter(Boolean));
            return senden(res, 200, { treffer: (r.hits || []).map((h) => ({ slug: h.slug, titel: h.title, text: h.description, downloads: h.downloads,
              bild: /^https:\/\/cdn\.modrinth\.com\//.test(h.icon_url || '') ? h.icon_url : '', installiert: da.has(h.slug) })) });
          }
          if (mcBeschaeftigt) return senden(res, 409, { fehler: 'Gerade läuft schon: ' + mcBeschaeftigt + ' – bitte kurz warten.' });
          if (aktion === 'stopp') {
            try { fs.writeFileSync(mcAusFlagge(), 'gestoppt über die App'); } catch (e) { /* egal */ }
            try { await mcRcon('stop'); } catch (e) { /* lief nicht */ }
            mcProtokoll('gestoppt (Welt gespeichert)'); return senden(res, 200, { ok: true });
          }
          if (aktion === 'start') { try { fs.rmSync(mcAusFlagge(), { force: true }); } catch (e) { /* egal */ } await mcAufgabe('/Run'); mcProtokoll('gestartet'); return senden(res, 200, { ok: true }); }
          if (aktion === 'neustart') { await mcImHintergrund('Neustart', () => mcNeustarten()); return senden(res, 200, { gestartet: true }); }
          if (aktion === 'neue-welt') {
            const seed = String(b.seed || '').trim();
            if (seed.length > 64 || /[\r\n]/.test(seed)) return senden(res, 400, { fehler: 'Seed: höchstens 64 Zeichen.' });
            await mcImHintergrund('Neue Welt', () => mcNeustarten(async () => {
              const name = mcProps()['level-name'] || 'world', stempel = new Date(jetzt()).toISOString().replace(/[:T]/g, '-').slice(0, 19);
              const archiv = path.join(mcOrdner(), 'welten-archiv', stempel); fs.mkdirSync(archiv, { recursive: true });
              for (const w of [name, name + '_nether', name + '_the_end']) {
                const quelle = path.join(mcOrdner(), w); if (!fs.existsSync(quelle)) continue;
                for (let i = 0; ; i++) { try { fs.renameSync(quelle, path.join(archiv, w)); break; } catch (e) { if (i >= 10) throw e; await schlafen(2000); } }
              }
              // nur die letzten 3 archivierten Welten behalten
              const alle = fs.readdirSync(path.join(mcOrdner(), 'welten-archiv')).sort();
              alle.slice(0, Math.max(0, alle.length - 3)).forEach((x) => fs.rmSync(path.join(mcOrdner(), 'welten-archiv', x), { recursive: true, force: true }));
              mcPropsSchreiben({ 'level-seed': seed });
              mcProtokoll('alte Welt archiviert (welten-archiv\\' + stempel + '), neuer Seed: ' + (seed || 'zufällig'));
            }));
            return senden(res, 200, { gestartet: true });
          }
          if (aktion === 'karte' || aktion === 'plugin-installieren') {
            const slug = aktion === 'karte' ? 'squaremap' : String(b.slug || '');
            if (!/^[a-z0-9_.-]{2,64}$/i.test(slug)) return senden(res, 400, { fehler: 'Ungültiges Plugin.' });
            let x; try { x = await mcModrinthVersion(slug); } catch (e) { return senden(res, e.code || 500, { fehler: e.message }); }
            const titel = String(b.titel || slug).slice(0, 60);
            await mcImHintergrund(titel + ' installieren', () => mcNeustarten(async () => {
              const plugins = path.join(mcOrdner(), 'plugins'); fs.mkdirSync(plugins, { recursive: true });
              const liste = mcJson('plugins.json', {}), alt = liste[slug] && liste[slug].datei;
              if (alt && alt !== x.datei.filename) fs.rmSync(path.join(plugins, alt), { force: true });
              if (slug === 'squaremap') fs.readdirSync(plugins).filter((f) => /^squaremap.*\.jar$/i.test(f) && f !== x.datei.filename).forEach((f) => fs.rmSync(path.join(plugins, f), { force: true }));
              await herunterladen(x.datei.url, path.join(plugins, x.datei.filename));
              liste[slug] = { titel, version: x.version, datei: x.datei.filename };
              fs.writeFileSync(path.join(mcOrdner(), 'plugins.json'), JSON.stringify(liste, null, 1));
              mcProtokoll('Plugin ' + titel + ' ' + x.version + ' installiert');
            }));
            return senden(res, 200, { gestartet: true, version: x.version });
          }
          if (aktion === 'plugin-entfernen') {
            const datei = String(b.datei || '');
            if (!mcPlugins().some((x) => x.datei === datei)) return senden(res, 404, { fehler: 'Plugin nicht gefunden.' });
            await mcImHintergrund('Plugin entfernen', () => mcNeustarten(async () => {
              fs.rmSync(path.join(mcOrdner(), 'plugins', datei), { force: true });
              const liste = mcJson('plugins.json', {}); Object.keys(liste).forEach((k) => { if (liste[k].datei === datei) delete liste[k]; });
              fs.writeFileSync(path.join(mcOrdner(), 'plugins.json'), JSON.stringify(liste, null, 1));
              mcProtokoll('Plugin entfernt: ' + datei);
            }));
            return senden(res, 200, { gestartet: true });
          }
          return senden(res, 400, { fehler: 'Unbekannte Aktion.' });
        }
      }
      if (weg === '/admin/prozesse' && m === 'GET') {
        const l = await prozesseAbfragen().catch(() => null);
        if (!l) return senden(res, 502, { fehler: 'Konnte die Programme gerade nicht abfragen.' });
        return senden(res, 200, { prozesse: [].concat(l).filter(Boolean) });
      }
      if (weg === '/admin/verlauf' && m === 'GET') {
        const tage = [1, 7, 30].includes(Number(url.searchParams.get('tage'))) ? Number(url.searchParams.get('tage')) : 1;
        let p = verlauf.p.filter((x) => x[0] >= jetzt() - tage * 864e5);
        if (tage > 1) {   // zusammenfassen: 7 Tage → 30 Min., 30 Tage → 2 Std. (Dienste: Anteil „läuft“ als Ziffer 0–9, sonst -)
          const fenster = (tage === 7 ? 30 : 120) * 60000, g = new Map();
          p.forEach((x) => { const k = Math.floor(x[0] / fenster) * fenster; if (!g.has(k)) g.set(k, []); g.get(k).push(x); });
          const mittel = (l, i) => { const v = l.map((x) => x[i]).filter((y) => y != null); return v.length ? Math.round(v.reduce((a, c) => a + c, 0) / v.length) : null; };
          p = [...g.entries()].map(([k, l]) => [k + fenster / 2,
            DIENSTE.map((n, i) => { const z = l.map((x) => x[1][i]).filter((c) => c === '1' || c === '0'); return z.length ? String(Math.round(9 * z.filter((c) => c === '1').length / z.length)) : '-'; }).join(''),
            mittel(l, 2), mittel(l, 3), mittel(l, 4), (() => { const v = l.map((x) => x[5]).filter((y) => y != null); return v.length ? Math.max(...v) : null; })()]);
        }
        return senden(res, 200, { dienste: DIENSTE, takt: tage === 1 ? messTakt : (tage === 7 ? 30 : 120) * 60000, punkte: p,
          verfuegbarkeit: { 1: verfuegbarkeit(1), 7: verfuegbarkeit(7), 30: verfuegbarkeit(30) } });
      }
      if (weg === '/admin/einstellungen') {
        if (m === 'POST') {
          const b = await koerper(req);
          if (b.autoUpdate !== undefined) { zentrale.autoUpdate = !!b.autoUpdate; zentraleSpeichern(); protokollUpdate('Auto-Update ' + (zentrale.autoUpdate ? 'eingeschaltet' : 'ausgeschaltet')); }
          if (b.healthchecks !== undefined) {
            const u = String(b.healthchecks).trim(), datei = path.join(ordnerBasis(), 'healthchecks-url.txt');
            if (u && !/^https:\/\/hc-ping\.com\/[A-Za-z0-9_-]{8,}(\/[A-Za-z0-9_-]+)?$/.test(u)) return senden(res, 400, { fehler: 'Bitte den Ping-Link von healthchecks.io einfügen (beginnt mit https://hc-ping.com/…).' });
            if (u) fs.writeFileSync(datei, u); else fs.rmSync(datei, { force: true });
            protokollUpdate('Ausfall-Benachrichtigung ' + (u ? 'eingerichtet' : 'entfernt'));
          }
        }
        return senden(res, 200, { autoUpdate: zentrale.autoUpdate, healthchecks: !!liesB('healthchecks-url.txt').trim() });
      }
      if (weg === '/admin/adguard-listen' && m === 'POST') {
        const b = await koerper(req), pw = String(b.passwort || '');
        if (zuViel('adguardpw', k, 5)) return senden(res, 429, { fehler: 'Zu viele Versuche – bitte in einer Stunde nochmal.' });
        if (!pw) return senden(res, 400, { fehler: 'Bitte das AdGuard-Passwort eingeben.' });
        const LISTEN = [
          { name: "HaGeZi's Multi PRO", url: 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/pro.txt' },
          { name: "HaGeZi's Threat Intelligence Feeds (medium)", url: 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/tif.medium.txt' },
        ];
        let st;
        try { st = await adguardApi('filtering/status', pw); } catch (e) { return senden(res, 502, { fehler: 'AdGuard antwortet gerade nicht – läuft er?' }); }
        if (st.status === 401 || st.status === 403) { zaehlen('adguardpw', k); return senden(res, 401, { fehler: 'Das AdGuard-Passwort stimmt nicht.' }); }
        if (st.status !== 200 || !st.json) return senden(res, 502, { fehler: 'AdGuard hat unerwartet geantwortet (' + st.status + ').' });
        const neu = [];
        for (const l of LISTEN) {
          const da = (st.json.filters || []).find((f) => f.url === l.url);
          let r;
          if (!da) r = await adguardApi('filtering/add_url', pw, { name: l.name, url: l.url, whitelist: false });
          else if (!da.enabled) r = await adguardApi('filtering/set_url', pw, { url: l.url, whitelist: false, data: { name: da.name || l.name, url: l.url, enabled: true } });
          else continue;
          if (r.status !== 200) return senden(res, 502, { fehler: 'AdGuard konnte „' + l.name + '“ nicht laden: ' + String(r.text || r.status).slice(0, 120) });
          neu.push(l.name);
        }
        if (st.json.enabled === false) await adguardApi('filtering/config', pw, { enabled: true, interval: st.json.interval || 24 });
        const nach = await adguardApi('filtering/status', pw);
        try { fs.appendFileSync(path.join(basis || path.dirname(daten), 'erweiterungen.log'), new Date(jetzt()).toISOString().replace('T', ' ').slice(0, 19) + '  AdGuard: Sperrlisten ' + (neu.length ? 'hinzugefügt: ' + neu.join(', ') : 'waren schon aktiv') + '\n'); } catch (e) { /* egal */ }
        return senden(res, 200, { neu, listen: ((nach.json && nach.json.filters) || []).map((f) => ({ name: f.name, an: !!f.enabled, regeln: f.rules_count || 0 })) });
      }
      if (weg === '/admin/erweiterung' && m === 'POST') {
        const b = await koerper(req), e = ERWEITERUNGEN[String(b.name || '')];
        if (!e) return senden(res, 400, { fehler: 'Unbekannte Erweiterung.' });
        const pw = String(b.passwort || ''), umgebung = {};
        if (e.passwort) {
          if (pw.length < 8 || pw.length > 64 || /["'`$\s]/.test(pw)) return senden(res, 400, { fehler: 'Passwort: 8–64 Zeichen, ohne Leerzeichen und ohne " \' ` $' });
          umgebung.SPIELEKISTE_PASSWORT = pw;
        }
        if (e.eula) { if (b.eula !== true) return senden(res, 400, { fehler: 'Bitte die Minecraft-EULA akzeptieren.' }); umgebung.SPIELEKISTE_EULA = 'ja'; }
        if (jetzt() - (letzteErweiterung[b.name] || 0) < 60e3) return senden(res, 429, { fehler: 'Gerade läuft schon eine Installation – bitte eine Minute warten.' });
        letzteErweiterung[b.name] = jetzt();
        const ordner = basis || path.dirname(daten), skript = path.join(ordner, 'spiel', 'werkzeuge', 'homeserver', 'windows', 'erweiterungen', e.skript);
        if (!fs.existsSync(skript)) return senden(res, 500, { fehler: 'Installationsskript fehlt – erst „Aktualisieren“.' });
        try { erweiterungStarten(skript, ordner, umgebung); } catch (x) { return senden(res, 500, { fehler: 'Konnte die Installation nicht starten.' }); }
        return senden(res, 200, { gestartet: true, name: e.name });
      }
      if (weg === '/admin/pruefen' && m === 'GET') {
        try { const a = await updatePruefen(); return senden(res, 200, Object.assign({}, a, { sha: undefined })); }
        catch (e) { return senden(res, 502, { fehler: 'GitHub gerade nicht erreichbar (' + e.message + ').' }); }
      }
      if (weg === '/admin/aktualisieren' && m === 'POST') {
        pruefCache = null;
        if (jetzt() - letztesUpdate < 60e3) return senden(res, 429, { fehler: 'Ein Update wurde gerade erst gestartet – bitte eine Minute warten.' });
        letztesUpdate = jetzt();
        try { await updateStarten(); } catch (e) { return senden(res, 500, { fehler: 'Update konnte nicht gestartet werden (Aufgabe „Spielekiste\\Update“ eingerichtet?).' }); }
        return senden(res, 200, { gestartet: true });
      }
    }
    if (weg === '/konto/loeschen' && m === 'POST') {
      const b = await koerper(req), konto = konten[k];
      if (!PIN_RE.test(String(b.pin || '')) || !pinOk(konto, String(b.pin))) return senden(res, 401, { fehler: 'Die PIN stimmt nicht.' });
      const vor = dateiname(k) + '-';
      fs.rmSync(path.join(daten, standDatei), { force: true });
      for (const f of fs.readdirSync(path.join(daten, 'archiv'))) if (f.startsWith(vor)) fs.rmSync(path.join(daten, 'archiv', f), { force: true });
      Object.keys(sitzungen).forEach((h) => { if (sitzungen[h].schluessel === k) delete sitzungen[h]; });
      if (zugang.konten[k]) { const z = zugang.konten[k]; delete zugang.konten[k]; zugangSpeichern(); try { await whitelistSetzen(z.mc, z.uuid, false); } catch (e) { /* egal */ } }
      delete bestenliste[k]; delete konten[k];
      schreiben('konten.json', konten); schreiben('sitzungen.json', sitzungen); schreiben('bestenliste.json', bestenliste);
      res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return senden(res, 200, {});
    }
    return senden(res, 404, { fehler: 'Unbekannt' });
  }

  const server = http.createServer((req, res) => {
    bearbeiten(req, res).catch((e) => { if (!res.headersSent) senden(res, e.status || 500, { fehler: e.status ? e.message : 'Serverfehler' }); if (!e.status) console.error(e); });
  });
  server.on('close', () => { [logUhr, autoUhr, messUhr].forEach((u) => u && clearInterval(u)); });
  server.zentraleMessen = zentraleMessen; server.autoUpdate = autoUpdate;
  server.mcLogPruefen = mcLogPruefen;
  return server;
}

module.exports = { erstelleServer };

if (require.main === module) {
  const arg = (n, std) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : std; };
  const daten = path.resolve(arg('daten', path.join(__dirname, 'daten'))), port = Number(arg('port', 8090));
  const admin = String(arg('admin', '')).split(',').map((x) => x.trim()).filter(Boolean), basis = arg('basis', null);
  erstelleServer({ daten, admin, basis: basis && path.resolve(basis) }).listen(port, '127.0.0.1', () => console.log('Spielstand-Server läuft auf http://127.0.0.1:' + port + ' – Daten in ' + daten));
}
