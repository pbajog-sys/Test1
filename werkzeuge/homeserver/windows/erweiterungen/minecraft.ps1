# Erweiterung „Minecraft (Java)“ – gestartet vom Konto-Server über ☁️ → Server → Erweiterungen (nur Admin). Läuft als SYSTEM.
#   1. neueste STABILE Paper-Version von PaperMC (fill.papermc.io), Download mit SHA-256 geprüft
#   2. passende Java-Version (laut PaperMC) als portables Temurin-JRE von Adoptium – keine Installation, nichts im System
#   3. sichere Grundeinstellungen: nur echte Minecraft-Konten (online-mode), Whitelist an, RCON nur für den Konto-Server
#   4. Aufgabe „Spielekiste\Minecraft“ (startet mit Windows, Neustart nach Absturz), Firewall: TCP 25565
# Welt und Einstellungen bleiben bei einem erneuten Lauf erhalten (nur Paper/Java werden aktualisiert).
# Die Minecraft-EULA (https://aka.ms/MinecraftEULA) wurde in der App ausdrücklich akzeptiert ($env:SPIELEKISTE_EULA = 'ja').
param([string]$Basis = 'C:\homeserver')
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Basis = (Resolve-Path $Basis).Path.TrimEnd('\')
$log = Join-Path $Basis 'erweiterungen.log'
function Log($t) { Add-Content -Path $log -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  Minecraft: ' + $t) -Encoding UTF8 }
$kopf = @{ 'User-Agent' = 'spielekiste-homeserver (github.com/pbajog-sys/Test1)' }

try {
  Log 'Installation gestartet.'
  if ($env:SPIELEKISTE_EULA -ne 'ja') { throw 'Minecraft-EULA wurde nicht akzeptiert.' }
  $mc = Join-Path $Basis 'minecraft'; New-Item -ItemType Directory -Force -Path $mc | Out-Null

  # ---------- Paper: neueste stabile Version ----------
  $projekt = Invoke-RestMethod -UseBasicParsing -Headers $kopf -Uri 'https://fill.papermc.io/v3/projects/paper'
  $gewaehlt = $null
  foreach ($gruppe in $projekt.versions.PSObject.Properties) {
    foreach ($v in $gruppe.Value) {
      if ($v -notmatch '^\d+(\.\d+)*$') { continue }   # keine rc/pre
      try { $b = Invoke-RestMethod -UseBasicParsing -Headers $kopf -Uri "https://fill.papermc.io/v3/projects/paper/versions/$v/builds/latest" } catch { continue }
      if ($b.channel -eq 'STABLE') { $gewaehlt = @{ version = $v; build = $b }; break }
    }
    if ($gewaehlt) { break }
  }
  if (-not $gewaehlt) { throw 'Keine stabile Paper-Version gefunden.' }
  $info = Invoke-RestMethod -UseBasicParsing -Headers $kopf -Uri "https://fill.papermc.io/v3/projects/paper/versions/$($gewaehlt.version)"
  $javaMin = [int]$info.version.java.version.minimum; if ($javaMin -lt 21) { $javaMin = 21 }
  $dl = $gewaehlt.build.downloads.'server:default'
  $jar = Join-Path $mc 'paper.jar'
  $versionDatei = Join-Path $mc 'paper-version.txt'
  $bisher = if (Test-Path $versionDatei) { (Get-Content $versionDatei -Raw).Trim() } else { '' }
  if ($bisher -ne $dl.name -or -not (Test-Path $jar)) {
    Invoke-WebRequest -UseBasicParsing -Headers $kopf -Uri $dl.url -OutFile "$jar.neu"
    if ((Get-FileHash "$jar.neu" -Algorithm SHA256).Hash.ToLower() -ne $dl.checksums.sha256.ToLower()) { Remove-Item "$jar.neu"; throw 'Paper-Download beschädigt (Prüfsumme falsch).' }
    Move-Item -Force "$jar.neu" $jar
    Set-Content -Path $versionDatei -Value $dl.name -Encoding ASCII
    Log "Paper $($gewaehlt.version) (Build $($gewaehlt.build.id)) geladen."
  }

  # ---------- Java (portabel) ----------
  $javaOrdner = Join-Path $mc "java-$javaMin"
  $java = Get-ChildItem $javaOrdner -Recurse -Filter java.exe -ErrorAction SilentlyContinue | Where-Object { $_.Directory.Name -eq 'bin' } | Select-Object -First 1
  if (-not $java) {
    $tmp = Join-Path $env:TEMP ('java-' + [guid]::NewGuid().ToString('N')); New-Item -ItemType Directory -Path $tmp | Out-Null
    $geladen = $false
    foreach ($art in 'jre', 'jdk') {
      try { Invoke-WebRequest -UseBasicParsing -Headers $kopf -Uri "https://api.adoptium.net/v3/binary/latest/$javaMin/ga/windows/x64/$art/hotspot/normal/eclipse" -OutFile "$tmp\java.zip"; $geladen = $true; break } catch { }
    }
    if (-not $geladen) { throw "Java $javaMin konnte nicht geladen werden." }
    Expand-Archive -Path "$tmp\java.zip" -DestinationPath $javaOrdner -Force
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    $java = Get-ChildItem $javaOrdner -Recurse -Filter java.exe | Where-Object { $_.Directory.Name -eq 'bin' } | Select-Object -First 1
    if (-not $java) { throw 'java.exe nach dem Entpacken nicht gefunden.' }
    Log "Java $javaMin (portabel) eingerichtet."
  }

  # ---------- Grundeinstellungen (nur beim ersten Mal) ----------
  Set-Content -Path (Join-Path $mc 'eula.txt') -Value "# akzeptiert in der Spielekiste-App (https://aka.ms/MinecraftEULA)`neula=true" -Encoding ASCII
  $props = Join-Path $mc 'server.properties'
  if (-not (Test-Path $props)) {
    $rcon = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
    @(
      'motd=Spielekiste', 'server-port=25565', 'online-mode=true', 'white-list=true', 'enforce-whitelist=true',
      'max-players=10', 'view-distance=8', 'simulation-distance=6', 'difficulty=normal', 'spawn-protection=0',
      'enable-rcon=true', 'rcon.port=25575', "rcon.password=$rcon", 'broadcast-rcon-to-ops=false'
    ) | Set-Content -Path $props -Encoding ASCII
    Log 'Grundeinstellungen angelegt (nur echte Konten, Whitelist an).'
  }

  # ---------- Firewall: nur der Spiel-Port; RCON (25575) bleibt von außen zu ----------
  netsh advfirewall firewall delete rule name="Minecraft Java" | Out-Null
  netsh advfirewall firewall add rule name="Minecraft Java" dir=in action=allow protocol=TCP localport=25565 | Out-Null

  # ---------- Aufgabe ----------
  $flags = ($info.version.java.flags.recommended -join ' ')
  $start = Join-Path $mc 'start.cmd'
  Set-Content -Path $start -Encoding ASCII -Value @"
@echo off
cd /d "$mc"
if exist "$Basis\minecraft-aus.txt" exit /b 0
"$($java.FullName)" -Xms1G -Xmx2G $flags -jar paper.jar --nogui
"@
  Stop-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Minecraft' -ErrorAction SilentlyContinue
  $wer = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
  $einst = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
  $aktion = New-ScheduledTaskAction -Execute 'cmd.exe' -WorkingDirectory $mc -Argument "/c `"$start`""
  Register-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Minecraft' -Action $aktion -Trigger (New-ScheduledTaskTrigger -AtStartup) -Principal $wer -Settings $einst -Force | Out-Null
  Remove-Item -Force (Join-Path $Basis 'minecraft-aus.txt') -ErrorAction SilentlyContinue
  Start-ScheduledTask -TaskPath '\Spielekiste\' -TaskName 'Minecraft'
  Log 'Startet – beim ersten Mal wird die Welt erzeugt (1–3 Minuten).'

  # Warten, bis RCON antwortet (= Server ist fertig gestartet)
  $bereit = $false
  for ($i = 0; $i -lt 90 -and -not $bereit; $i++) {
    Start-Sleep 3
    $c = New-Object Net.Sockets.TcpClient
    try { $bereit = $c.ConnectAsync('127.0.0.1', 25575).Wait(1000) -and $c.Connected } catch { } finally { $c.Close() }
  }
  if ($bereit) { Log 'Fertig: Minecraft-Server läuft.' } else { Log 'Fertig, aber der Server meldet sich noch nicht – Protokoll „Minecraft“ ansehen.' }
} catch {
  Log "FEHLER: $($_.Exception.Message)"
  exit 1
}
