# Tages-Check-in

Kleine, lokale Windows-App im Infobereich (Tray) für ein tägliches Check-in
in unter 30 Sekunden. Python + PySide6, Daten in einer `.xlsx`-Datei.
Keine Cloud, kein Konto, keine Telemetrie – die App öffnet keine einzige
Netzwerkverbindung.

## Was die App kann

**Check-in** (Klick aufs Tray-Symbol, oder abends per Benachrichtigung):

| Feld | |
|---|---|
| Gewicht | optional, kg (Komma oder Punkt) |
| Bewegung | keine / Spaziergang / Lauf (+ Minuten) / Krafttraining |
| Lernzeit | Minuten je Fokusziel, max. 2 frei benennbare Ziele |
| Notiz | optional, eine Zeile |

Standardmäßig ist der heutige Tag gewählt; über das Datumsfeld lässt sich ein
vergessener Vortag nachtragen. Gibt es für den Tag schon einen Eintrag, wird
er geladen und beim Speichern überschrieben.

**Wochenansicht** (Mo–So, mit ◀ ▶ blättern):

- Gewicht: Mittelwert aller Werte der Woche und Differenz zum Mittel der Vorwoche (↑ ↓ →).
- Je Ziel (Lauf, Fokusziel 1, Fokusziel 2): Ist-Minuten gegen das Wochenziel mit Ampel.
- Darunter die sieben Tage als kleine Tabelle zum Nachprüfen.

**Ampel-Regel:** Verglichen wird mit dem *Soll bis heute* = Wochenziel × (gezählte Tage / 7).
Der heutige Tag zählt erst, sobald er erfasst ist; abgeschlossene Wochen zählen alle 7 Tage.

- grün: Ist ≥ Soll
- gelb: Ist ≥ 70 % des Solls
- rot: darunter
- grau: kein Wochenziel (0) oder noch kein Tag gezählt

**Erinnerung:** Ab der eingestellten Uhrzeit einmal pro Tag eine
Windows-Benachrichtigung – nur, wenn für heute noch nichts erfasst ist.
Klick auf die Benachrichtigung öffnet das Check-in. Läuft die App zur
Uhrzeit nicht (PC aus), kommt die Erinnerung beim nächsten Start am selben Abend.
Hinweis: Der Windows-„Benachrichtigungsassistent“/„Nicht stören“ kann sie unterdrücken.

**Tray-Menü (Rechtsklick):** Check-in jetzt · Wochenansicht · Excel-Datei öffnen · Einstellungen · Beenden.

## Daten

- Excel-Datei: standardmäßig `Dokumente\TagesCheckin\checkin.xlsx`, in den Einstellungen änderbar.
  **Achtung:** Ist dein Dokumente-Ordner per OneDrive synchronisiert, landet die Datei
  doch in der Cloud – dann in den Einstellungen einen nicht synchronisierten Ordner wählen.
- Blatt `Daten`, eine Zeile pro Tag:

  `Datum | Gewicht (kg) | Bewegung | Lauf (min) | Fokusziel 1 | Fokus 1 (min) | Fokusziel 2 | Fokus 2 (min) | Lernzeit gesamt (min) | Notiz | Erfasst am`

  Datum und Zahlen sind echte Excel-Werte (keine Texte), also direkt filter-, sortier- und auswertbar.
  Der Name des Fokusziels wird in jeder Zeile mitgeschrieben, damit Umbenennungen nachvollziehbar bleiben.
  Die Wochenauswertung summiert nach Spalte (Ziel 1 / Ziel 2), nicht nach Name.
- Du darfst die Datei in Excel bearbeiten (Werte korrigieren, Zeilen löschen, eigene Spalten
  rechts anfügen, weitere Blätter anlegen). Die App findet ihre Spalten über die Überschrift.
- **Während die Datei in Excel geöffnet ist, kann die App nicht speichern** – sie sagt dann
  Bescheid, die Eingaben bleiben im Fenster stehen. Excel schließen, nochmal „Speichern“.
- Vor jedem Speichern wird die vorige Version als `checkin.xlsx.bak` daneben abgelegt.
- Einschränkung: Die App schreibt mit `openpyxl`. Diagramme, Pivot-Tabellen und bedingte
  Formatierung *in derselben Datei* können dabei verloren gehen. Eigene Auswertungen deshalb
  am besten in einer separaten Arbeitsmappe, die per Power Query oder Verknüpfung auf
  `checkin.xlsx` zugreift.
- Einstellungen liegen in `%APPDATA%\TagesCheckin\settings.json`.

## Autostart

In den Einstellungen „Beim Windows-Start automatisch starten“ anhaken. Das setzt
einen Eintrag unter `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
(nur dein Benutzer, keine Adminrechte). Abhaken entfernt ihn wieder.
Wenn du die .exe später verschiebst: Haken einmal raus und wieder rein.

## Die .exe bauen

Voraussetzung: Windows 10/11 mit Python 3.10 oder neuer ([python.org](https://www.python.org/downloads/),
bei der Installation „Add python.exe to PATH“ bzw. den Launcher `py` mitinstallieren).

**Variante A – Skript:** Im Projektordner doppelklicken auf `build.bat` (oder in der
Eingabeaufforderung `build.bat` ausführen). Ergebnis: `dist\TagesCheckin.exe`.

**Variante B – von Hand** (Eingabeaufforderung im Projektordner):

```bat
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
pytest -q
pyinstaller --noconfirm --clean --onefile --windowed --name TagesCheckin run.py
```

Dann `dist\TagesCheckin.exe` an einen festen Ort kopieren (z. B. `%LOCALAPPDATA%\Programs\TagesCheckin\`),
starten, in den Einstellungen Fokusziele, Wochenziele und Uhrzeit setzen, ggf. Autostart anhaken.

Hinweise:
- `--onefile` ergibt eine einzelne Datei (grob 50–100 MB, weil Qt mit drin ist), startet aber 1–3 s langsamer, weil sie sich
  beim Start entpackt. Wer schnelleren Start will: `--onedir` statt `--onefile` und den ganzen
  Ordner `dist\TagesCheckin\` kopieren.
- Windows SmartScreen bzw. Virenscanner warnen manchmal bei selbst gebauten, unsignierten
  PyInstaller-Programmen. Das ist bei eigenen Builds normal („Weitere Informationen → Trotzdem ausführen“).
- Zum Ausprobieren ohne Build: `python run.py` (bzw. `pythonw run.py` ohne Konsolenfenster).

## Projektaufbau

```
run.py                   Einstiegspunkt (auch für PyInstaller)
checkin_app/app.py       Tray-Symbol, Menü, Erinnerung, Einzelinstanz
checkin_app/dialogs.py   Fenster: Check-in, Wochenansicht, Einstellungen
checkin_app/storage.py   Lesen/Schreiben der .xlsx
checkin_app/stats.py     Wochenmittel, Trend, Ampel
checkin_app/config.py    Einstellungen (JSON)
checkin_app/autostart.py Autostart-Eintrag in der Registry
tests/                   pytest für Speicherung und Auswertung
```

Bewusst nicht enthalten: Gamification, Streaks, mehr als zwei Fokusziele, Synchronisation.
