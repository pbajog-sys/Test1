# Konten einrichten (Supabase)

Ohne diese Schritte läuft die App wie bisher – alles bleibt nur auf dem Gerät, der Konto-Knopf ist ausgeblendet.

## 1. Projekt anlegen (kostenlos)
1. Auf https://supabase.com registrieren → **New project**.
2. Name z. B. `spiele-app`, Datenbank-Passwort generieren lassen (gut aufheben, braucht die App nicht).
3. **Region: Central EU (Frankfurt)** – wichtig für den Datenschutz.

## 2. Datenbank anlegen
**SQL Editor** → **New query** → den kompletten Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen → **Run**.

## 3. Anmelde-Mail auf Code umstellen
**Authentication → Emails → Templates → Magic Link** (bei neueren Versionen „Sign in with OTP“ / „Magic link or OTP“):

- Betreff: `Dein Code für die Spiele-App`
- Text:
  ```html
  <h2>Dein Anmelde-Code</h2>
  <p>Tippe diesen Code in der App ein:</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
  <p>Der Code gilt eine Stunde. Wenn du dich nicht anmelden wolltest, ignoriere diese Mail einfach.</p>
  ```

Falls es auch ein Template **Confirm signup** gibt, dort denselben Text eintragen (das bekommen neue Nutzer beim ersten Mal).

Unter **Authentication → Providers → Email** muss *Email* aktiviert sein. Die Länge des Codes (Email OTP Length) muss **6** sein.

## 4. Adresse der App eintragen
**Authentication → URL Configuration → Site URL**: `https://pbajog-sys.github.io/Test1/`

## 5. Schlüssel in die App
**Project Settings → API** (bzw. **Data API / API Keys**):
- **Project URL** (`https://….supabase.co`)
- **anon public** Key (beginnt mit `eyJ`, oder der neue `sb_publishable_…`)

Beides in [`konto-config.js`](konto-config.js) eintragen – oder Claude schicken. Der anon-Key darf öffentlich sein, die Regeln in der Datenbank schützen die Daten. **Den `service_role`-Key niemals eintragen oder weitergeben.**

## Hinweise
- Der kostenlose E-Mail-Versand von Supabase schafft nur wenige Mails pro Stunde. Für die Familie reicht das; für mehr kann man unter **Authentication → SMTP Settings** einen eigenen Mail-Anbieter eintragen.
- Kostenlose Projekte werden nach einer Woche ohne Nutzung pausiert und lassen sich im Dashboard mit einem Klick wieder starten.
- In [`datenschutz.html`](datenschutz.html) noch Name und Kontakt eintragen (gelb markiert).
