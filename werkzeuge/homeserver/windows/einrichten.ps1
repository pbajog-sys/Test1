# Spielekiste-Homeserver: Autostart und nächtliches Update einrichten (einmalig, als Administrator).
# Legt in der Aufgabenplanung unter „Spielekiste“ drei Aufgaben an:
#   Caddy         – Webserver, startet mit Windows, startet nach Absturz neu
#   Konto-Server  – spielstand-server.js, ebenso
#   Update        – schaut alle 5 Minuten nach einer neuen Version auf GitHub (wachen.ps1 → aktualisieren.ps1)
# Läuft als SYSTEM: keine offenen Fenster, auch ohne angemeldeten Benutzer.
param([string]$Basis = 'C:\homeserver')
$ErrorActionPreference = 'Stop'
$Basis = (Resolve-Path $Basis).Path.TrimEnd('\')
function Schritt($t) { Write-Host ''; Write-Host "== $t" -ForegroundColor Cyan }

Schritt 'Skripte auf den neuesten Stand bringen'
$neueSkripte = Join-Path $Basis 'spiel\werkzeuge\homeserver\windows'
if (Test-Path $neueSkripte) {
  foreach ($f in 'aktualisieren.ps1', 'aktualisieren.bat', 'wachen.ps1', 'CLAUDE.md') { if (Test-Path "$neueSkripte\$f") { Copy-Item -Force "$neueSkripte\$f" $Basis } }
  Write-Host 'Update-Skripte und CLAUDE.md aus der aktuellen Spielversion übernommen.'
}

Schritt 'Dateien prüfen'
$caddy = @('caddy_windows_amd64.exe', 'caddy.exe') | ForEach-Object { Join-Path $Basis $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $caddy) { throw "Caddy nicht gefunden in $Basis" }
foreach ($f in 'Caddyfile', 'spielstand-server.js', 'spiel\index.html', 'aktualisieren.ps1', 'wachen.ps1') { if (-not (Test-Path (Join-Path $Basis $f))) { throw "$f fehlt in $Basis" } }
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node -and (Test-Path "$env:ProgramFiles\nodejs\node.exe")) { $node = "$env:ProgramFiles\nodejs\node.exe" }
if (-not $node) { throw 'Node.js nicht gefunden (winget install OpenJS.NodeJS.LTS)' }
Write-Host "Caddy: $caddy"; Write-Host "Node:  $node"

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
  -Argument "/c `"`"$node`" `"$Basis\spielstand-server.js`" --daten `"$Basis\daten`" >> `"$Basis\konto-server.log`" 2>&1`""
Register-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server' -Action $nodeAktion -Trigger $beimStart -Principal $wer -Settings $dauerhaft -Force | Out-Null

$updAktion = New-ScheduledTaskAction -Execute 'powershell.exe' -WorkingDirectory $Basis `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$Basis\wachen.ps1`" -Basis `"$Basis`""
Register-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Update' -Action $updAktion -Trigger $beimStart -Principal $wer -Settings $dauerhaft -Force | Out-Null
Write-Host 'Caddy, Konto-Server und Update angelegt.'

Schritt 'Starten und prüfen'
Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server'
Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Caddy'
Stop-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Update' -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Update'
Start-Sleep 8
$ok = $true
try { Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8090/api/ich' -TimeoutSec 5 | Out-Null } catch {
  if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) { Write-Host 'Konto-Server läuft ✓' -ForegroundColor Green }
  else { Write-Host "Konto-Server antwortet nicht – siehe $Basis\konto-server.log" -ForegroundColor Red; $ok = $false }
}
if (Get-Process -Name caddy_windows_amd64, caddy -ErrorAction SilentlyContinue) { Write-Host 'Caddy läuft ✓' -ForegroundColor Green }
else { Write-Host "Caddy läuft nicht – siehe $Basis\caddy.log" -ForegroundColor Red; $ok = $false }
Write-Host ''
if ($ok) { Write-Host 'Fertig! Ab jetzt startet alles mit Windows, und alle 5 Minuten wird nach Updates geschaut.' -ForegroundColor Green }
else { Write-Host 'Bitte einen Screenshot dieses Fensters schicken.' -ForegroundColor Yellow }
