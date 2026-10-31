-- Datenbank für die Spiele-App (Supabase). Einmal im Supabase-Dashboard unter „SQL Editor“ ausführen.
-- Sicherheit über Row Level Security: Jeder liest und schreibt nur seine eigenen Daten.
-- Von anderen sieht man nur Name und Punkte-Zusammenfassung – und nur innerhalb der eigenen Familie.

-- Profil: Anzeigename, Familien-Code und eine kleine Zusammenfassung für die Familien-Bestenliste
create table if not exists public.profil (
  id               uuid primary key references auth.users on delete cascade,
  name             text check (char_length(name) between 1 and 30),
  familie          text check (familie ~ '^[A-Z0-9]{6}$'),
  zusammenfassung  jsonb not null default '{}'::jsonb,
  aktualisiert     timestamptz not null default now()
);

-- Fortschritt: Abzeichen, Lernstand, Rekorde – als ein JSON-Dokument pro Nutzer
create table if not exists public.fortschritt (
  id            uuid primary key references auth.users on delete cascade,
  daten         jsonb not null default '{}'::jsonb check (pg_column_size(daten) < 500000),
  aktualisiert  timestamptz not null default now()
);

alter table public.profil enable row level security;
alter table public.fortschritt enable row level security;

-- Nicht angemeldete Besucher bekommen gar keinen Zugriff
revoke all on public.profil, public.fortschritt from anon;
grant select, insert, update, delete on public.profil, public.fortschritt to authenticated;

-- Hilfsfunktion: Familien-Code des angemeldeten Nutzers (security definer, damit die Regel unten
-- nicht sich selbst aufruft)
create or replace function public.meine_familie() returns text
language sql stable security definer set search_path = public as $$
  select familie from public.profil where id = auth.uid()
$$;
revoke all on function public.meine_familie() from public;
grant execute on function public.meine_familie() to authenticated;

-- Profil: eigenes lesen/schreiben, Familienmitglieder nur lesen
drop policy if exists "profil lesen" on public.profil;
create policy "profil lesen" on public.profil for select to authenticated
  using (id = auth.uid() or (familie is not null and familie = public.meine_familie()));
drop policy if exists "profil anlegen" on public.profil;
create policy "profil anlegen" on public.profil for insert to authenticated with check (id = auth.uid());
drop policy if exists "profil ändern" on public.profil;
create policy "profil ändern" on public.profil for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profil löschen" on public.profil;
create policy "profil löschen" on public.profil for delete to authenticated using (id = auth.uid());

-- Fortschritt: nur der eigene
drop policy if exists "fortschritt eigener" on public.fortschritt;
create policy "fortschritt eigener" on public.fortschritt for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Konto komplett löschen (Knopf „Konto löschen“ in der App): entfernt den Login,
-- Profil und Fortschritt verschwinden über „on delete cascade“ mit.
create or replace function public.konto_loeschen() returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid()
$$;
revoke all on function public.konto_loeschen() from public;
grant execute on function public.konto_loeschen() to authenticated;
