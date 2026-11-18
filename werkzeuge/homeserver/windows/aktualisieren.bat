@echo off
rem Doppelklick: neueste Version holen und einspielen. Fragt nach Administratorrechten.
net session >nul 2>&1 || (powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0'" & exit /b)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0aktualisieren.ps1" -Basis "%~dp0." -Erzwingen
echo.
pause
