@echo off
rem Einmalig: Autostart + naechtliches Update einrichten. Fragt nach Administratorrechten.
net session >nul 2>&1 || (powershell -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0'" & exit /b)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0einrichten.ps1" -Basis "%~dp0."
echo.
pause
