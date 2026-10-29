@echo off
rem Baut dist\TagesCheckin.exe. Einmalig vorher: siehe README, Abschnitt "Die .exe bauen".
setlocal
if not exist .venv (
    py -3 -m venv .venv || goto :error
)
call .venv\Scripts\activate.bat || goto :error
python -m pip install --upgrade pip >nul
python -m pip install -r requirements-dev.txt || goto :error
python -m pytest -q || goto :error
pyinstaller --noconfirm --clean --onefile --windowed --name TagesCheckin run.py || goto :error
echo.
echo Fertig: dist\TagesCheckin.exe
goto :eof
:error
echo Build fehlgeschlagen.
exit /b 1
