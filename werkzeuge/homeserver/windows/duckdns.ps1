# Spielekiste-Homeserver: hält die DuckDNS-Adresse auf der aktuellen IP des Anschlusses (Telekom vergibt sie dynamisch).
# Läuft dauerhaft als Aufgabe „Spielekiste\DuckDNS“ (von einrichten.ps1 angelegt), prüft alle 5 Minuten.
# Token und Subdomain liegen nur auf diesem Laptop: duckdns-token.txt, duckdns-domain.txt (nie auf GitHub).
# Protokoll (nur bei Änderung oder Fehler): duckdns.log
param([string]$Basis = 'C:\homeserver', [int]$Minuten = 5)
$Basis = (Resolve-Path $Basis).Path.TrimEnd('\')
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$log = Join-Path $Basis 'duckdns.log'
function Log($t) { Add-Content -Path $log -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $t) -Encoding UTF8 }
$letzteIp = ''
while ($true) {
  try {
    $token = (Get-Content (Join-Path $Basis 'duckdns-token.txt') -Raw).Trim()
    $domain = (Get-Content (Join-Path $Basis 'duckdns-domain.txt') -Raw).Trim()
    $ip = (Invoke-RestMethod -UseBasicParsing -Uri 'https://api.ipify.org' -TimeoutSec 15).ToString().Trim()
    if ($ip -and $ip -ne $letzteIp) {
      $antwort = (Invoke-RestMethod -UseBasicParsing -Uri "https://www.duckdns.org/update?domains=$domain&token=$token&ip=$ip" -TimeoutSec 15).ToString().Trim()
      if ($antwort -eq 'OK') { Log "IP $ip an DuckDNS ($domain.duckdns.org) gemeldet."; $letzteIp = $ip }
      else { Log "DuckDNS hat abgelehnt ($antwort) – Token oder Subdomain prüfen." }
    }
  } catch { Log "Fehler: $($_.Exception.Message)" }
  Start-Sleep -Seconds ($Minuten * 60)
}
