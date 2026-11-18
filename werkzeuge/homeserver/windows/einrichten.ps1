# Spielekiste-Homeserver: Autostart und nächtliches Update einrichten (einmalig, als Administrator).
# Legt in der Aufgabenplanung unter „Spielekiste“ drei Aufgaben an:
#   Caddy         – Webserver, startet mit Windows, startet nach Absturz neu
#   Konto-Server  – spielstand-server.js, ebenso
#   Update        – holt die neueste Version von GitHub (aktualisieren.ps1): nach Bedarf über den Knopf
#                   „Server aktualisieren“ in der App (nur für das Admin-Konto) und zur Sicherheit jede Nacht um 04:17
#   DuckDNS       – meldet alle 5 Minuten die aktuelle IP an DuckDNS (nur wenn ein Token hinterlegt ist)
# Läuft als SYSTEM: keine offenen Fenster, auch ohne angemeldeten Benutzer.
param([string]$Basis = 'C:\homeserver')
$ErrorActionPreference = 'Stop'
$Basis = (Resolve-Path $Basis).Path.TrimEnd('\')
function Schritt($t) { Write-Host ''; Write-Host "== $t" -ForegroundColor Cyan }

Schritt 'Skripte auf den neuesten Stand bringen'
$neueSkripte = Join-Path $Basis 'spiel\werkzeuge\homeserver\windows'
if (Test-Path $neueSkripte) {
  foreach ($f in 'aktualisieren.ps1', 'aktualisieren.bat', 'duckdns.ps1', 'CLAUDE.md') { if (Test-Path "$neueSkripte\$f") { Copy-Item -Force "$neueSkripte\$f" $Basis } }
  Write-Host 'Update-Skripte und CLAUDE.md aus der aktuellen Spielversion übernommen.'
}

Schritt 'Dateien prüfen'
$caddy = @('caddy_windows_amd64.exe', 'caddy.exe') | ForEach-Object { Join-Path $Basis $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $caddy) { throw "Caddy nicht gefunden in $Basis" }
foreach ($f in 'Caddyfile', 'spielstand-server.js', 'spiel\index.html', 'aktualisieren.ps1') { if (-not (Test-Path (Join-Path $Basis $f))) { throw "$f fehlt in $Basis" } }
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node -and (Test-Path "$env:ProgramFiles\nodejs\node.exe")) { $node = "$env:ProgramFiles\nodejs\node.exe" }
if (-not $node) { throw 'Node.js nicht gefunden (winget install OpenJS.NodeJS.LTS)' }
Write-Host "Caddy: $caddy"; Write-Host "Node:  $node"

Schritt 'Admin-Konto (sieht in der App „Server aktualisieren“)'
$adminDatei = Join-Path $Basis 'admin.txt'
$admin = if (Test-Path $adminDatei) { (Get-Content $adminDatei -Raw).Trim() } else { '' }
if ($admin) { Write-Host "Admin: $admin (ändern: admin.txt löschen und einrichten.bat erneut ausführen)" }
else {
  $admin = (Read-Host 'Wie heißt dein Konto in der Spielekiste? (genau wie beim Anmelden)').Trim()
  if ($admin) { Set-Content -Path $adminDatei -Value $admin -Encoding UTF8 } else { Write-Host 'Kein Admin – der Knopf bleibt für alle verborgen.' }
}
if ($admin -match '["&|<>^%]') { throw 'Ungültiger Name' }

Schritt 'DuckDNS (hält die Adresse auf deiner wechselnden IP)'
$tokenDatei = Join-Path $Basis 'duckdns-token.txt'; $domainDatei = Join-Path $Basis 'duckdns-domain.txt'
if (Test-Path $tokenDatei) { Write-Host 'Token ist hinterlegt (neuer Token: duckdns-token.txt löschen und einrichten.bat erneut ausführen).' }
else {
  $token = (Read-Host 'DuckDNS-Token (steht oben auf duckdns.org; Enter = überspringen)').Trim()
  if ($token) {
    if ($token -notmatch '^[0-9a-fA-F-]{20,60}$') { throw 'Das sieht nicht wie ein DuckDNS-Token aus.' }
    Set-Content -Path $tokenDatei -Value $token -Encoding ASCII
  }
}
if ((Test-Path $tokenDatei) -and -not (Test-Path $domainDatei)) {
  $sub = (Read-Host 'DuckDNS-Subdomain (Enter = spielkiste)').Trim(); if (-not $sub) { $sub = 'spielkiste' }
  $sub = $sub -replace '\.duckdns\.org$', ''
  if ($sub -notmatch '^[a-z0-9-]{1,63}$') { throw 'Ungültige Subdomain' }
  Set-Content -Path $domainDatei -Value $sub -Encoding ASCII
}

Schritt 'Caddy-Zertifikate übernehmen'
$caddyDaten = Join-Path $Basis 'caddy-daten'
New-Item -ItemType Directory -Force -Path $caddyDaten | Out-Null
$alt = Join-Path $env:APPDATA 'Caddy'
if ((Test-Path $alt) -and -not (Test-Path (Join-Path $caddyDaten 'caddy\certificates'))) {
  New-Item -ItemType Directory -Force -Path (Join-Path $caddyDaten 'caddy') | Out-Null
  Copy-Item -Recurse -Force (Join-Path $alt '*') (Join-Path $caddyDaten 'caddy')
  Write-Host 'Vorhandenes Zertifikat übernommen.'
} else { Write-Host 'Nichts zu übernehmen (Caddy holt sich beim Start selbst eins).' }

Schritt 'Laufende Fenster beenden (Caddy / Konto-Server von Hand gestartet)'
Get-Process -Name caddy_windows_amd64, caddy -ErrorAction SilentlyContinue | Stop-Process -Force
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*spielstand-server*' } | ForEach-Object { Invoke-CimMethod -InputObject $_ -MethodName Terminate | Out-Null }
Start-Sleep 2

Schritt 'Aufgaben anlegen'
$wer = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$dauerhaft = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
$beimStart = New-ScheduledTaskTrigger -AtStartup

$caddyAktion = New-ScheduledTaskAction -Execute 'cmd.exe' -WorkingDirectory $Basis `
  -Argument "/c set `"XDG_DATA_HOME=$caddyDaten`" && `"$caddy`" run --config `"$Basis\Caddyfile`" >> `"$Basis\caddy.log`" 2>&1"
Register-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Caddy' -Action $caddyAktion -Trigger $beimStart -Principal $wer -Settings $dauerhaft -Force | Out-Null

$nodeAktion = New-ScheduledTaskAction -Execute 'cmd.exe' -WorkingDirectory $Basis `
  -Argument "/c `"`"$node`" `"$Basis\spielstand-server.js`" --daten `"$Basis\daten`" --basis `"$Basis`" --admin `"$admin`" >> `"$Basis\konto-server.log`" 2>&1`""
Register-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server' -Action $nodeAktion -Trigger $beimStart -Principal $wer -Settings $dauerhaft -Force | Out-Null

Stop-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Update' -ErrorAction SilentlyContinue   # falls noch die alte 5-Minuten-Variante läuft
Remove-Item -Force (Join-Path $Basis 'wachen.ps1') -ErrorAction SilentlyContinue
$updAktion = New-ScheduledTaskAction -Execute 'powershell.exe' -WorkingDirectory $Basis `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$Basis\aktualisieren.ps1`" -Basis `"$Basis`""
$nachts = New-ScheduledTaskTrigger -Daily -At '04:17'
$updEinst = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Update' -Action $updAktion -Trigger $nachts -Principal $wer -Settings $updEinst -Force | Out-Null
if ((Test-Path $tokenDatei) -and (Test-Path (Join-Path $Basis 'duckdns.ps1'))) {
  Stop-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'DuckDNS' -ErrorAction SilentlyContinue
  $ddAktion = New-ScheduledTaskAction -Execute 'powershell.exe' -WorkingDirectory $Basis `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Basis\duckdns.ps1`" -Basis `"$Basis`""
  Register-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'DuckDNS' -Action $ddAktion -Trigger $beimStart -Principal $wer -Settings $dauerhaft -Force | Out-Null
  Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'DuckDNS'
  Write-Host 'DuckDNS-Aufgabe angelegt.'
}
Write-Host 'Caddy, Konto-Server und Update angelegt.'

Schritt 'Starten und prüfen'
Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server'
Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Caddy'
Start-Sleep 8
$ok = $true
try { Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8090/api/ich' -TimeoutSec 5 | Out-Null } catch {
  if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) { Write-Host 'Konto-Server läuft ✓' -ForegroundColor Green }
  else { Write-Host "Konto-Server antwortet nicht – siehe $Basis\konto-server.log" -ForegroundColor Red; $ok = $false }
}
if (Get-Process -Name caddy_windows_amd64, caddy -ErrorAction SilentlyContinue) { Write-Host 'Caddy läuft ✓' -ForegroundColor Green }
else { Write-Host "Caddy läuft nicht – siehe $Basis\caddy.log" -ForegroundColor Red; $ok = $false }
if (Test-Path $tokenDatei) {
  Start-Sleep 5
  $dl = Join-Path $Basis 'duckdns.log'
  $letzte = if (Test-Path $dl) { (Get-Content $dl -Tail 1) } else { '' }
  if ($letzte -match 'gemeldet') { Write-Host 'DuckDNS aktuell ✓' -ForegroundColor Green } else { Write-Host "DuckDNS: $letzte" -ForegroundColor Yellow }
}
Write-Host ''
if ($ok) { Write-Host 'Fertig! Ab jetzt startet alles mit Windows, Updates holst du in der App über ☁️ → „Server aktualisieren“ (sonst nachts automatisch).' -ForegroundColor Green }
else { Write-Host 'Bitte einen Screenshot dieses Fensters schicken.' -ForegroundColor Yellow }
