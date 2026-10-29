# Tages-Check-in als iPhone-Widget (Scriptable)

Ein einziges Skript für die kostenlose App **Scriptable** (App Store, ohne Konto).
Es liefert:

- **Widget** auf dem Home-Bildschirm: Kalenderwoche, „heute ✓ / heute offen“,
  Ampel und Minuten je Ziel (Lauf, Fokusziel 1, Fokusziel 2) und das Gewichtsmittel
  mit Trend. Ein Tipp aufs Widget startet direkt das Check-in.
- **Check-in in drei kurzen Schritten**: Gewicht → Bewegung (eine Taste) →
  Minuten und Notiz → Speichern. Danach erscheint die Wochenansicht.
- **Erinnerung als echte iPhone-Mitteilung** zur eingestellten Uhrzeit. Ist der Tag
  schon erfasst, entfällt sie. Ein Tipp auf die Mitteilung öffnet das Check-in.
- **Wochenansicht** der aktuellen und der drei vorigen Wochen.
- **Export als .xlsx** im Format der PC-App („In Dateien sichern“).

Die Daten liegen nur lokal in Scriptable (`tagescheckin.json` im lokalen
Scriptable-Ordner), nicht in iCloud. Keine Cloud, keine Telemetrie.

## Einrichten (ca. 3 Minuten)

1. **Scriptable** aus dem App Store installieren.
2. Die Datei `Check-in.js` aufs iPhone bringen, z. B. per AirDrop oder in der
   Dateien-App sichern. Dann öffnen → Teilen → **Scriptable** wählen.
   (Alternativ: in Scriptable mit „+“ ein neues Skript anlegen, den Inhalt von
   `Check-in.js` hineinkopieren und das Skript **Check-in** nennen.)
3. Das Skript in Scriptable einmal antippen → **Einstellungen & Erinnerung**:
   Fokusziele, Wochenziele und die Uhrzeit setzen. Die Mitteilungen erlauben, wenn iOS fragt.
4. **Widget hinzufügen**: Home-Bildschirm lange drücken → „Bearbeiten“ →
   „Widget hinzufügen“ → **Scriptable** → klein oder mittel → hinzufügen.
   Dann das Widget lange drücken → „Widget bearbeiten“:
   - **Script**: Check-in
   - **When Interacting**: Run Script
5. Fertig. Ab jetzt: Widget antippen → drei Schritte → fertig.

## Hinweise

- Das Widget aktualisiert iOS selbst, meist innerhalb von Minuten, nicht sekundengenau.
- Die Erinnerungen werden jeweils für die nächsten 7 Tage geplant und bei jedem Start
  oder jeder Widget-Aktualisierung neu gesetzt.
- Datensicherung: ab und zu „Als Excel-Datei exportieren“. Wenn du Scriptable löschst,
  sind die Daten weg.
- Diese Version und die Web-App (`../iphone/`) haben jeweils eigene Daten. Nutze eine
  von beiden.
