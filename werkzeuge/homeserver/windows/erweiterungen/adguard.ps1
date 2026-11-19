# Erweiterung „AdGuard Home“ (Werbe- und Tracking-Blocker fürs Heimnetz) – gestartet vom Konto-Server
# über ☁️ → Server → Erweiterungen (nur Admin). Läuft als SYSTEM. Passwort kommt über $env:SPIELEKISTE_PASSWORT.
#   1. AdGuard Home herunterladen und nach <Basis>\AdGuardHome entpacken (falls noch nicht da)
#   2. als Windows-Dienst einrichten und starten
#   3. einrichten über AdGuards eigene Einrichtungs-Schnittstelle (wie der Assistent im Browser):
#      Verwaltung auf Port 3000, DNS auf Port 53, Benutzer „admin“
#   4. Firewall: Port 53 und 3000 nur fürs eigene Heimnetz (localsubnet) – von außen ist nichts erreichbar
# Protokoll: <Basis>\erweiterungen.log
param([string]$Basis = 'C:\homeserver')
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Basis = (Resolve-Path $Basis).Path.TrimEnd('\')
$log = Join-Path $Basis 'erweiterungen.log'
function Log($t) { Add-Content -Path $log -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  AdGuard: ' + $t) -Encoding UTF8 }

try {
  $pw = $env:SPIELEKISTE_PASSWORT
  if (-not $pw -or $pw.Length -lt 8) { throw 'Kein gültiges Passwort übergeben.' }
  $ordner = Join-Path $Basis 'AdGuardHome'; $exe = Join-Path $ordner 'AdGuardHome.exe'
  Log 'Installation gestartet.'

  if (-not (Test-Path $exe)) {
    $tmp = Join-Path $env:TEMP ('adguard-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tmp | Out-Null
    Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/AdguardTeam/AdGuardHome/releases/latest/download/AdGuardHome_windows_amd64.zip' -OutFile "$tmp\a.zip"
    Expand-Archive -Path "$tmp\a.zip" -DestinationPath $tmp
    $neu = Get-ChildItem $tmp -Recurse -Filter 'AdGuardHome.exe' | Select-Object -First 1
    if (-not $neu) { throw 'Download unvollständig.' }
    Move-Item $neu.Directory.FullName $ordner
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    Log 'Heruntergeladen.'
  }

  if (-not (Get-Service -Name 'AdGuardHome' -ErrorAction SilentlyContinue)) {
    & $exe -s install 2>&1 | Out-Null
    Log 'Als Windows-Dienst eingerichtet.'
  }
  Start-Service -Name 'AdGuardHome' -ErrorAction SilentlyContinue

  if (-not (Test-Path (Join-Path $ordner 'AdGuardHome.yaml'))) {
    # Auf den Einrichtungs-Assistenten warten, dann einrichten
    $bereit = $false
    for ($i = 0; $i -lt 60 -and -not $bereit; $i++) {
      try { Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/control/install/get_addresses' -TimeoutSec 3 | Out-Null; $bereit = $true } catch { Start-Sleep 1 }
    }
    if (-not $bereit) { throw 'AdGuard startet nicht (Port 3000).' }
    $einst = @{ web = @{ ip = '0.0.0.0'; port = 3000 }; dns = @{ ip = '0.0.0.0'; port = 53 }; username = 'admin'; password = $pw } | ConvertTo-Json
    Invoke-RestMethod -UseBasicParsing -Method Post -Uri 'http://127.0.0.1:3000/control/install/configure' -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($einst)) | Out-Null
    Log 'Eingerichtet (Benutzer admin, Verwaltung Port 3000, DNS Port 53).'
  } else { Log 'War schon eingerichtet – Einstellungen und Passwort bleiben unverändert.' }

  foreach ($r in @(@('AdGuard DNS UDP', 'UDP', '53'), @('AdGuard DNS TCP', 'TCP', '53'), @('AdGuard Verwaltung', 'TCP', '3000'))) {
    netsh advfirewall firewall delete rule name="$($r[0])" | Out-Null
    netsh advfirewall firewall add rule name="$($r[0])" dir=in action=allow protocol=$($r[1]) localport=$($r[2]) remoteip=localsubnet | Out-Null
  }
  Log 'Firewall: nur Heimnetz.'

  Start-Sleep 3
  try { Resolve-DnsName -Name 'example.com' -Server 127.0.0.1 -DnsOnly -ErrorAction Stop | Out-Null; Log 'Fertig: AdGuard Home läuft.' }
  catch { Log 'Fertig, aber DNS antwortet noch nicht – in einer Minute nochmal prüfen.' }
} catch {
  Log "FEHLER: $($_.Exception.Message)"
  exit 1
}
