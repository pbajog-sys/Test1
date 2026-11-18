# Spielekiste-Homeserver: schaut alle 5 Minuten auf GitHub nach einer neuen Version und spielt sie ein.
# Läuft dauerhaft als Aufgabe „Spielekiste\Update“ (von einrichten.ps1 angelegt). Jede Prüfung startet
# aktualisieren.ps1 neu – so gilt nach einem Update sofort auch das neueste Update-Skript.
param([string]$Basis = 'C:\homeserver', [int]$Minuten = 5)
$Basis = (Resolve-Path $Basis).Path.TrimEnd('\')
while ($true) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Basis 'aktualisieren.ps1') -Basis $Basis -Leise
  Start-Sleep -Seconds ($Minuten * 60)
}
