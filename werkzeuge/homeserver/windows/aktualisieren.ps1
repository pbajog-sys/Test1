# Spielekiste-Homeserver: neue Version von GitHub holen und einspielen.
#   ohne -Erzwingen: nur wenn es auf GitHub etwas Neues gibt (so läuft es jede Nacht)
#   -Erzwingen:      immer (Doppelklick auf aktualisieren.bat)
# Spielstände (daten\), Caddyfile und Zertifikate bleiben unangetastet. Startet der neue Konto-Server nicht,
# kommt automatisch die vorige Version zurück. Protokoll: update.log
param([string]$Basis = 'C:\homeserver', [switch]$Erzwingen)
$ErrorActionPreference = 'Stop'
$Basis = (Resolve-Path $Basis).Path.TrimEnd('\')
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$repo = 'pbajog-sys/Test1'
$zweigDatei = Join-Path $Basis 'update-zweig.txt'
$zweig = if (Test-Path $zweigDatei) { (Get-Content $zweigDatei -Raw).Trim() } else { 'spielstand-sync' }
$log = Join-Path $Basis 'update.log'
function Log($t) { $z = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $t; Add-Content -Path $log -Value $z -Encoding UTF8; Write-Host $t }
function KontoServerOk { try { Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8090/api/ich' -TimeoutSec 5 | Out-Null; return $true } catch { return ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) } }

try {
  $neu = (Invoke-RestMethod -UseBasicParsing -Uri "https://api.github.com/repos/$repo/commits/$zweig" -Headers @{ 'User-Agent' = 'spielekiste-update' }).sha
  $versionDatei = Join-Path $Basis 'version.txt'
  $jetzt = if (Test-Path $versionDatei) { (Get-Content $versionDatei -Raw).Trim() } else { '' }
  if ($neu -eq $jetzt -and -not $Erzwingen) { Log "Schon aktuell ($($neu.Substring(0,7)))."; exit 0 }
  Log "Neue Version $($neu.Substring(0,7)) wird eingespielt (vorher: $(if ($jetzt) { $jetzt.Substring(0,7) } else { 'unbekannt' }))."

  $tmp = Join-Path $env:TEMP ('spielekiste-update-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $tmp | Out-Null
  Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/$repo/archive/$neu.zip" -OutFile "$tmp\spiel.zip"
  Expand-Archive -Path "$tmp\spiel.zip" -DestinationPath "$tmp\x"
  $neuOrdner = Get-ChildItem "$tmp\x" -Directory | Select-Object -First 1
  if (-not (Test-Path "$($neuOrdner.FullName)\index.html") -or -not (Test-Path "$($neuOrdner.FullName)\werkzeuge\homeserver\spielstand-server.js")) { throw 'Download unvollständig' }

  # Konto-Server anhalten (falls als Aufgabe eingerichtet), dann Dateien tauschen – die alte Version bleibt als Rückfall
  $aufgabe = Get-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server' -ErrorAction SilentlyContinue
  if ($aufgabe) { Stop-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server' }
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*spielstand-server*' } | ForEach-Object { Invoke-CimMethod -InputObject $_ -MethodName Terminate | Out-Null }
  Start-Sleep 2
  $spiel = Join-Path $Basis 'spiel'; $altSpiel = Join-Path $Basis 'spiel-vorher'
  if (Test-Path $altSpiel) { Remove-Item -Recurse -Force $altSpiel }
  if (Test-Path $spiel) { Rename-Item $spiel 'spiel-vorher' }
  Move-Item $neuOrdner.FullName $spiel
  Copy-Item -Force (Join-Path $Basis 'spielstand-server.js') (Join-Path $Basis 'spielstand-server.vorher.js') -ErrorAction SilentlyContinue
  Copy-Item -Force "$spiel\werkzeuge\homeserver\spielstand-server.js" $Basis
  foreach ($f in 'aktualisieren.ps1', 'aktualisieren.bat', 'einrichten.ps1', 'einrichten.bat', 'CLAUDE.md') { Copy-Item -Force "$spiel\werkzeuge\homeserver\windows\$f" $Basis -ErrorAction SilentlyContinue }

  if ($aufgabe) {
    Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server'
    Start-Sleep 6
    if (-not (KontoServerOk)) {
      Log 'Neuer Konto-Server startet nicht – vorige Version wird wiederhergestellt.'
      Stop-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server'
      Remove-Item -Recurse -Force $spiel; Rename-Item $altSpiel 'spiel'
      Copy-Item -Force (Join-Path $Basis 'spielstand-server.vorher.js') (Join-Path $Basis 'spielstand-server.js')
      Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server'
      throw 'Update zurückgenommen'
    }
  } else { Log 'Hinweis: Autostart noch nicht eingerichtet – Konto-Server bitte von Hand neu starten (oder einrichten.bat ausführen).' }

  Set-Content -Path $versionDatei -Value $neu -Encoding ASCII
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  Log "Fertig: Version $($neu.Substring(0,7)) läuft."
} catch {
  Log "FEHLER: $($_.Exception.Message)"
  # Was auch passiert: der Konto-Server muss danach wieder laufen
  if ((Get-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server' -ErrorAction SilentlyContinue) -and -not (KontoServerOk)) {
    if (-not (Test-Path (Join-Path $Basis 'spiel')) -and (Test-Path (Join-Path $Basis 'spiel-vorher'))) { Rename-Item (Join-Path $Basis 'spiel-vorher') 'spiel' }
    Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Konto-Server'
  }
  exit 1
}
