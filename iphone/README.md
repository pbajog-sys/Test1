# Tages-Check-in fürs iPhone

Web-App mit denselben Feldern, Wochenzielen und Ampel-Regeln wie die PC-App.
Läuft nach dem ersten Öffnen auch offline. Alle Einträge bleiben im Speicher
dieser Web-App auf dem iPhone – keine Cloud, kein Konto, keine Telemetrie.

## Dateien

`index.html` (die ganze App), `sw.js` (Offline-Cache), `manifest.webmanifest`,
`icon-180.png`, `icon-512.png`. Keine externen Bibliotheken, keine Netzwerkaufrufe.

## Aufs iPhone bringen

Die Dateien müssen einmal über **https** erreichbar sein (direkt aus der
Dateien-App geöffnet speichert Safari nichts). Einfachster Weg: GitHub Pages.

1. Auf GitHub ein **öffentliches** Repository anlegen (z. B. `tagescheckin`) und die fünf
   Dateien aus diesem Ordner hochladen. Öffentlich ist nur der Programmcode – deine Daten
   liegen nie dort. (Pages für private Repos gibt es nur mit kostenpflichtigem GitHub-Plan.)
2. Im Repository: **Settings → Pages → Branch: `main`, Ordner `/ (root)` → Save**.
3. Nach ca. einer Minute ist die App unter `https://<dein-name>.github.io/tagescheckin/` erreichbar.
4. Auf dem iPhone in **Safari** öffnen → Teilen-Symbol → **Zum Home-Bildschirm**.
5. Ab jetzt immer über das Symbol „Check-in“ starten (nicht über Safari) – nur dann
   bleibt der Speicher dauerhaft erhalten.

## Erinnerung

Web-Apps können sich nicht selbst zu einer Uhrzeit melden. Lösung: in der
Erinnerungen-App eine tägliche Erinnerung (z. B. 20:30, „Wiederholen: Täglich“) anlegen.

## Daten sichern und mit dem PC austauschen

- **Einstellungen → Als Excel-Datei exportieren** erzeugt eine `.xlsx` mit Blatt `Daten`
  im Format der PC-App (Teilen-Menü: in Dateien sichern, AirDrop, …).
- **Excel-Datei importieren** liest so eine Datei ein – auch die `checkin.xlsx` der PC-App.
  Tage, die in der Datei stehen, ersetzen die gleichen Tage auf dem iPhone.
- Bitte regelmäßig exportieren: Wird die Web-App vom Home-Bildschirm gelöscht, sind
  ihre Daten weg.
- Import braucht iOS 16.4 oder neuer.
