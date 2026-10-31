// Zugangsdaten für die Konten (Supabase → Project Settings → API).
// Leer = Konten aus, die App speichert dann nur auf dem Gerät.
// Der „anon public“-Schlüssel darf öffentlich sein: Die Datenbank-Regeln (supabase/schema.sql)
// erlauben jedem nur Zugriff auf die eigenen Daten. Den „service_role“-Schlüssel NIE hier eintragen!
const KONTO_CONFIG = {
  url: '',      // z. B. 'https://abcdefghijkl.supabase.co'
  anonKey: '',  // langer Schlüssel, beginnt mit 'eyJ'
};
