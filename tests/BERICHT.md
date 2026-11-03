# Testbericht Spielekiste 2.0

Alle Tests laufen in Chromium (Playwright) gegen die ausgelieferte App (`python3 -m http.server 8765`).
Hier steht nur, was tatsächlich gelaufen ist.

## 1. Generatoren – `node tests/generatoren.test.js 1000`

Erster vollständiger Lauf (1000 Fälle je Generator):

| Generator | Fälle | Fehler | Fehlerrate | Ø Dauer | Max | Auffälligkeit |
|---|---:|---:|---:|---:|---:|---|
| Krimi · Tatort (eindeutig, ohne Raten lösbar, Opferraum) | 1000 | 0 | 0,00 % | 11,1 ms | 212 ms | – |
| Krimi · Wachen (Regeln, keine Berührung, eindeutig) | 1000 | 0 | 0,00 % | 15,7 ms | 142 ms | **110× Stufenziel verfehlt** |
| Krimi · Alibi-Raster (genau eine Zuordnung = hinterlegte Lösung) | 1000 | 0 | 0,00 % | 46,1 ms | 551 ms | – |
| Krimi · Verhör (Täter eindeutig) | 1000 | 0 | 0,00 % | 0,1 ms | 5 ms | – |
| Piranha · Level 1–25 (Simulation löst mit erlaubten Buchten) | 1000 | 0 | 0,00 % | 418,4 ms | 4128 ms | lange Spitzen bei schweren Leveln |
| Slowenisch · Lektionen (Typen, Inhalte, keine doppelten Optionen) | 1000 | 0 | 0,00 % | <0,1 ms | 1 ms | – |
| Tagesmodi · Reproduzierbarkeit (9 Generatoren × 1000 Tage) | 1000 | 0 | 0,00 % | 2,0 ms | 19 ms | – |
| Zufallsgenerator · Verteilung (Chi², 10 Klassen, 20 000 Würfe) | 1000 | 0 | 0,00 % | 0,3 ms | 4 ms | Chi² Ø 9,21 (erwartet 9) |

Seitenfehler: keine.

**Behobener Fehler:** Bei „Wachen der Villa“ wurde die Stufe „Schwer“ oft nicht erreicht. Eine Einzelmessung mit 300 Fällen je
Stufe ergab: Leicht 0, Mittel 0, **Schwer 90 von 300 (30 %) zu leicht**, weil der Generator schon nach 600 Versuchen den
besten Kandidaten nahm. Jetzt sucht er bei „Schwer“ bis zu 2900 Versuche.
- Nachmessung mit 300 Fällen: Schwer 4 von 300 (1,3 %), Ø 51,5 ms statt 36,1 ms.
- Zweiter 1000er-Lauf nach dem Fix: Wachen 0 Fehler, **2 von 1000** Stufenziel verfehlt, Ø 22,4 ms, max 301 ms.
  Die übrigen Generatoren dieses zweiten Laufs werden nachgetragen, sobald er fertig ist.

**Behobener Fehler (Zeitzone):** `heute()` nutzte die UTC-Zeit. Dadurch wechselten Tagesrätsel in Deutschland erst um 1 bzw.
2 Uhr nachts. Jetzt gilt Europe/Berlin; geprüft mit 2026-06-30T22:30Z → 1. Juli und 2026-12-31T22:59Z → 31. Dezember.

## 2. Plattform – `node tests/plattform.test.js`
26 von 26 Prüfungen bestanden:
- Dashboard und Kategorien
- XP aus einem alten Verlauf
- Anti-Farming: 30 gleiche Runden an einem Tag ergeben 85 XP statt 780
- Deckel für leichte Runden: 200 perfekte leichte Runden ergeben „Sehen“ 78
- Tagesaufgaben für 1000 Tage reproduzierbar
- Zeitzone
- Start aller drei Tagesaufgaben
- Erkennung eines Abschlusses; eine normale Runde zählt nicht
- Teilen-Text
- Ergebnis-Karte als PNG
- Profil mit Radar
- Erfolg aus einem alten Krimi-Stand
- Vergleich mit einem zweiten Profil
- Vergleichscode hin und zurück, ungültiger Code wird abgelehnt
- Erklärung einer Fähigkeit
- beide Experimente vollständig durchgespielt
- Archiv
- Experiment-XP
- alte Spielstände unverändert
- keine Seitenfehler

Zusätzlich einzeln geprüft: Alle vier Krimi-Tagesrätsel (Tatort, Wachen, Alibi, Verhör) starten aus der Tagesaufgabe im
Tagesmodus mit der richtigen Stufe.

## 3. Rauchtest – `node tests/spiele-oeffnen.test.js`
Alle 17 Spielkarten öffnen ihr Spiel, auf Handy (iPhone-13-Profil) und Desktop (1366×850); keine Seitenfehler
(36/36 bestanden).

## Nicht automatisiert getestet
- Echte Touch-Bedienung auf iOS/Android: nur in Chromium mit iPhone-Profil emuliert.
- Teilen-Menü (`navigator.share`) mit Dateien: nur der Ersatzweg (Download) ist in Chromium prüfbar.
- Ton (AudioContext) beim Start von Ton- und Takt-Tagesaufgaben auf iOS.
- Die Spiele selbst wurden nicht alle bis zum Ende automatisch durchgespielt. Für Piranha, Slowenisch und Tierleben gibt es
  eigene Durchspiel-Skripte, die bei früheren Änderungen gelaufen sind; für die übrigen meldet der Rauchtest nur, dass sie
  starten.
