# Spielekiste-Homeserver: Wachhund – prüft alle 2 Minuten, ob alles läuft, und repariert selbst.
#   • Konto-Server antwortet nicht      → Aufgabe „Konto-Server“ neu starten
#   • Caddy läuft nicht / Port 443 zu   → Aufgabe „Caddy“ neu starten
#   • DuckDNS-Aufgabe läuft nicht       → starten (nur wenn eingerichtet)
#   • AdGuard-Dienst gestoppt           → starten (nur wenn installiert)
#   • Minecraft-Aufgabe läuft nicht     → starten (nur wenn installiert und nicht absichtlich gestoppt: minecraft-aus.txt)
#   • Internet weg: nach 10 Min. WLAN/LAN-Adapter neu starten, nach 30 Min. Laptop neu starten (höchstens alle 6 Std.)
#   • Lebenszeichen an healthchecks.io (wenn healthchecks-url.txt existiert): bleibt es aus, kommt eine Nachricht.
# Läuft dauerhaft als Aufgabe „Spielekiste\Wachhund“ (von einrichten.ps1 angelegt). Protokoll nur bei Eingriffen: wachhund.log
param([string]$Basis = 'C:\homeserver', [int]$Minuten = 2)
$Basis = (Resolve-Path $Basis).Path.TrimEnd('\')
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$log = Join-Path $Basis 'wachhund.log'
function Log($t) { Add-Content -Path $log -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $t) -Encoding UTF8 }
function Aufgabe($n) { Get-ScheduledTask -TaskPath '\Spielekiste\' -TaskName $n -ErrorAction SilentlyContinue }
function NeuStarten($n, $prozess) {
  Stop-ScheduledTask -TaskPath '\Spielekiste\' -TaskName $n -ErrorAction SilentlyContinue
  if ($prozess) { & $prozess }
  Start-Sleep 2; Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName $n
}
function KontoOk { try { Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8090/api/ich' -TimeoutSec 8 | Out-Null; $true } catch { [bool]($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) } }
function PortOffen($p) { $c = New-Object Net.Sockets.TcpClient; try { $c.ConnectAsync('127.0.0.1', $p).Wait(3000) -and $c.Connected } catch { $false } finally { $c.Close() } }
function InternetOk { foreach ($h in 'https://www.google.com/generate_204', 'https://cloudflare.com/cdn-cgi/trace') { try { Invoke-WebRequest -UseBasicParsing -Uri $h -TimeoutSec 8 | Out-Null; return $true } catch { } }; $false }

$fehlerSeit = $null; $adapterNeu = $false; $kontoFehler = 0
Log 'Wachhund gestartet.'
while ($true) {
  $probleme = @()
  try {
    # Konto-Server (zweimal hintereinander fehlgeschlagen → neu starten; schützt vor Fehlalarm während eines Updates)
    if (KontoOk) { $kontoFehler = 0 } else {
      $kontoFehler++
      if ($kontoFehler -ge 2 -and (Aufgabe 'Konto-Server')) {
        Log 'Konto-Server antwortet nicht – starte neu.'
        NeuStarten 'Konto-Server' { Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*spielstand-server*' } | ForEach-Object { Invoke-CimMethod -InputObject $_ -MethodName Terminate | Out-Null } }
        $kontoFehler = 0
      }
      $probleme += 'Konto-Server'
    }
    # Caddy
    if (-not (PortOffen 443) -and (Aufgabe 'Caddy')) {
      Log 'Caddy (Port 443) antwortet nicht – starte neu.'
      NeuStarten 'Caddy' { Get-Process -Name caddy_windows_amd64, caddy -ErrorAction SilentlyContinue | Stop-Process -Force }
      $probleme += 'Caddy'
    }
    # DuckDNS
    $dd = Aufgabe 'DuckDNS'
    if ($dd -and $dd.State -ne 'Running') { Log 'DuckDNS lief nicht – starte.'; Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'DuckDNS' }
    # AdGuard
    $ag = Get-Service -Name 'AdGuardHome' -ErrorAction SilentlyContinue
    if ($ag -and $ag.Status -ne 'Running') { Log 'AdGuard war gestoppt – starte.'; Start-Service -Name 'AdGuardHome' -ErrorAction SilentlyContinue }
    # Minecraft (nicht, wenn in der App gestoppt)
    $mcA = Aufgabe 'Minecraft'
    if ($mcA -and $mcA.State -ne 'Running' -and -not (Test-Path (Join-Path $Basis 'minecraft-aus.txt'))) { Log 'Minecraft lief nicht – starte.'; Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Minecraft' }

    # Internet
    if (InternetOk) {
      if ($fehlerSeit) { Log ('Internet wieder da (weg seit ' + $fehlerSeit.ToString('HH:mm') + ').') }
      $fehlerSeit = $null; $adapterNeu = $false
    } else {
      if (-not $fehlerSeit) { $fehlerSeit = Get-Date; Log 'Kein Internet.' }
      $weg = ((Get-Date) - $fehlerSeit).TotalMinutes
      if ($weg -ge 10 -and -not $adapterNeu) {
        Log 'Seit 10 Min. kein Internet – starte Netzwerkadapter neu.'
        Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.Status -ne 'Disabled' } | Restart-NetAdapter -Confirm:$false -ErrorAction SilentlyContinue
        $adapterNeu = $true
      }
      if ($weg -ge 30) {
        $marke = Join-Path $Basis 'wachhund-neustart.txt'
        $zuletzt = if (Test-Path $marke) { [datetime](Get-Content $marke -Raw).Trim() } else { [datetime]::MinValue }
        if (((Get-Date) - $zuletzt).TotalHours -ge 6) {
          Set-Content -Path $marke -Value (Get-Date -Format 's')
          Log 'Seit 30 Min. kein Internet – starte den Laptop neu.'
          shutdown.exe /r /t 60 /c 'Wachhund: seit 30 Minuten kein Internet'
        }
      }
      $probleme += 'Internet'
    }

    # Lebenszeichen nach außen (healthchecks.io): bei Problemen /fail mit Beschreibung
    $hcDatei = Join-Path $Basis 'healthchecks-url.txt'
    if ((Test-Path $hcDatei) -and -not ($probleme -contains 'Internet')) {
      $hc = (Get-Content $hcDatei -Raw).Trim()
      $ziel = if ($probleme.Count) { "$hc/fail" } else { $hc }
      try { Invoke-WebRequest -UseBasicParsing -Uri $ziel -Method Post -Body ($probleme -join ', ') -TimeoutSec 10 | Out-Null } catch { }
    }
  } catch { Log "Fehler im Wachhund: $($_.Exception.Message)" }
  Start-Sleep -Seconds ($Minuten * 60)
}
