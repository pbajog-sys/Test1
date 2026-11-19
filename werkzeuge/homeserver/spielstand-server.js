#!/usr/bin/env node
// Spielstand-Server für den Homeserver: Benutzerkonten (Name + PIN) und ein Spielstand pro Konto.
// Läuft hinter Caddy (reverse_proxy /api/* localhost:8090), braucht nur Node.js – keine Zusatzpakete.
//
//   node spielstand-server.js [--daten C:\homeserver\daten] [--port 8090] [--admin Name] [--basis C:\homeserver]
//   --admin: dieses Konto sieht in der App „Server aktualisieren“; --basis: Ordner mit version.txt und update.log
//
// Endpunkte (alle unter /api/, JSON):
//   GET  /api/ich             → { name } oder 401 { server: 'spielekiste' }
//   POST /api/registrieren    { name, pin } → neues Konto, angemeldet (Cookie)
//   POST /api/anmelden        { name, pin } → angemeldet (Cookie)
//   POST /api/abmelden
//   POST /api/admin/aktualisieren   (nur Admin) → startet die Windows-Aufgabe „Spielekiste\Update“ (neueste Version von GitHub)
//   GET  /api/admin/status          (nur Admin) → { version, log: [letzte Zeilen von update.log], konten, duelle }
//   POST /api/admin/erweiterung     (nur Admin) { name: 'adguard', passwort } → startet ein fest eingebautes Installationsskript
//                                   (werkzeuge/homeserver/windows/erweiterungen/<name>.ps1 aus der installierten Version)
//   GET  /api/admin/pruefen         (nur Admin) → { aktuell, neu, neuer, anzahl, aenderungen: [Commit-Titel] } – fragt GitHub
//   POST /api/konto/loeschen  { pin } → Konto, Spielstand, Tageskopien, Bestenliste, Duelle und Anmeldungen löschen
//   POST /api/abgleich        { basis, geraet, stand, aenderungen: { schlüssel: { v: text|null, alt?: true } } }
//                             → { version, neu? }  (neu = nur Einträge, die seit „basis“ ein anderes Gerät geändert hat;
//                                                   v: null = gelöscht – so geht nach einer Runde kaum etwas über die Leitung)
//                             optional oeffentlich: { xp, level, titel, avatar, farbe, skills[7], serie, abzeichen, gelernt, runden,
//                                                      spiele: [{ s, n }] (meistgespielt, höchstens 5) }
//                             → Eintrag in der gemeinsamen Bestenliste (nur diese Zusammenfassung ist für andere sichtbar)
//   GET  /api/bestenliste     → [{ name, ich?, xp, level, … }]  nach XP sortiert, nur für Angemeldete
//
// Duelle (beide spielen dieselbe Runde – gleicher Seed, gleiche Stufe –, wann sie wollen):
//   POST /api/duell           { gegen, spiel? } → neues Duell (Spiel zufällig, wenn keins angegeben)
//   GET  /api/duelle          → { duelle: [...], bilanz: { gegnername: { s, n, u } } }  eigene Duelle der letzten 30 Tage
//   POST /api/duell/ergebnis  { id, p, m } → eigenes Ergebnis (nur einmal pro Duell)
//   POST /api/duell/ablehnen  { id }
//
// Abgleich Eintrag für Eintrag: Jeder Eintrag merkt sich die Server-Version, in der er zuletzt geändert wurde.
//  • Normale Änderungen (gerade gespielt) gelten immer – die zuletzt angekommene gewinnt.
//  • „alt“-Änderungen (beim Öffnen der App bemerkt, z. B. Kleinkram vom Programmstart) gelten nur, wenn den Eintrag
//    seit „basis“ kein anderes Gerät geändert hat. So überschreibt ein länger nicht benutztes Gerät nie neueren Fortschritt.
//  • v: null = Eintrag gelöscht.
//
// Schutz: PIN nur als scrypt-Hash; nach 5 Fehlversuchen wird der Name gesperrt (15 min, danach doppelt so lang);
// höchstens 30 Fehlversuche und 5 neue Konten pro Stunde und Anschluss; höchstens 50 Konten; Anfragen bis 10 MB.
// Anmeldung per Cookie (HttpOnly, 1 Jahr). Im Datenordner: konten.json, sitzungen.json, staende/<name>.json,
// archiv/<name>-JJJJ-MM-TT.json (Tageskopie, wird nach 30 Tagen gelöscht), bestenliste.json, duelle.json (30 Tage).
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const NAME_RE = /^[A-Za-z0-9ÄÖÜäöüß._-]{3,20}$/;
const PIN_RE = /^\d{4,8}$/;
const DUELL_SPIELE = ['farben', 'toene', 'augen', 'takt', 'funktion', 'karte', 'punkte', 'riff', 'tiefgang'];
const DUELL_TAGE = 7, DUELL_OFFEN_MAX = 20;
const MAX_KONTEN = 50, MAX_BODY = 10 * 1024 * 1024, COOKIE = 'spielekiste_sitzung', SITZUNG_TAGE = 365;

const UPDATE_STARTEN = () => new Promise((ok, nein) => require('child_process').execFile('schtasks', ['/Run', '/TN', '\\Spielekiste\\Update'], { windowsHide: true }, (e) => (e ? nein(e) : ok())));
// Erweiterungen: nur diese Skripte dürfen gestartet werden (aus der installierten Spielversion, nie aus der Anfrage)
const ERWEITERUNGEN = { adguard: { skript: 'adguard.ps1', name: 'AdGuard Home' } };
const ERWEITERUNG_STARTEN = (skript, basis, env) => {
  const kind = require('child_process').spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', skript, '-Basis', basis],
    { detached: true, stdio: 'ignore', windowsHide: true, env: Object.assign({}, process.env, env) });
  kind.unref();
};
// Läuft auf diesem Rechner ein DNS-Server (AdGuard)? Fragt 127.0.0.1 nach example.com.
const DNS_PRUEFEN = () => new Promise((ok) => {
  const r = new (require('dns').promises.Resolver)({ timeout: 1500, tries: 1 });
  r.setServers(['127.0.0.1']);
  r.resolve4('example.com').then(() => ok(true), () => ok(false));
});
const LAN_IP = () => {
  const l = Object.values(require('os').networkInterfaces()).flat().filter((x) => x && x.family === 'IPv4' && !x.internal);
  const heim = l.find((x) => /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(x.address));
  return (heim || l[0] || {}).address || null;
};
// Zustand der Windows-Aufgabe „Spielekiste\Update“ (für die Fehlersuche im Server-Bereich der App); null, wenn nicht Windows
const AUFGABE_ABFRAGEN = () => new Promise((ok) => {
  if (process.platform !== 'win32') return ok(null);
  const befehl = "$t = Get-ScheduledTask -TaskPath '\\Spielekiste\\' -TaskName 'Update' -ErrorAction SilentlyContinue; if (-not $t) { '{\"fehlt\":true}'; exit }"
    + "; $i = $t | Get-ScheduledTaskInfo; @{ zustand = [string]$t.State; letzterLauf = $(if ($i.LastRunTime) { $i.LastRunTime.ToString('s') } else { '' }); ergebnis = [int64]$i.LastTaskResult"
    + "; aktion = (($t.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join '; ') } | ConvertTo-Json -Compress";
  // -EncodedCommand: kein Ärger mit Anführungszeichen in der Befehlszeile
  require('child_process').execFile('powershell.exe', ['-NoProfile', '-EncodedCommand', Buffer.from(befehl, 'utf16le').toString('base64')], { windowsHide: true, timeout: 8000 }, (e, out) => {
    if (e) return ok({ fehler: String(e.message).slice(0, 200) });
    try { ok(JSON.parse(String(out).trim())); } catch (x) { ok({ fehler: String(out).slice(0, 200) }); }
  });
});
const GITHUB = (repo) => async (pfad) => {
  const r = await fetch('https://api.github.com/repos/' + repo + pfad, { headers: { 'User-Agent': 'spielekiste-homeserver', Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error('GitHub ' + r.status);
  return r.json();
};
function erstelleServer({ daten, jetzt = () => Date.now(), admin = [], basis = null, updateStarten = UPDATE_STARTEN, repo = 'pbajog-sys/Test1', github = GITHUB(repo),
  erweiterungStarten = ERWEITERUNG_STARTEN, dnsPruefen = DNS_PRUEFEN, lanIp = LAN_IP, aufgabeAbfragen = AUFGABE_ABFRAGEN } = {}) {
  let letzteErweiterung = 0;
  let pruefCache = null;
  let letztesUpdate = 0;
  const admins = new Set([].concat(admin).filter(Boolean).map((n) => String(n).normalize('NFC').toLowerCase()));
  if (!daten) throw new Error('Datenordner fehlt');
  for (const o of ['', 'staende', 'archiv']) fs.mkdirSync(path.join(daten, o), { recursive: true });

  // ---------- Dateien ----------
  const lesen = (datei, leer) => { try { return JSON.parse(fs.readFileSync(path.join(daten, datei), 'utf8')); } catch (e) { return leer; } };
  const schreiben = (datei, obj) => {   // erst in eine Hilfsdatei, dann umbenennen – nie halb geschriebene Dateien
    const ziel = path.join(daten, datei), tmp = ziel + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj)); fs.renameSync(tmp, ziel);
  };
  let konten = lesen('konten.json', {});        // schlüssel (klein) → { name, salz, hash, erstellt, fehl, sperreBis, sperreMin }
  let sitzungen = lesen('sitzungen.json', {});  // sha256(token) → { schluessel, erstellt }
  let bestenliste = lesen('bestenliste.json', {});   // schlüssel → öffentliche Zusammenfassung
  let duelle = lesen('duelle.json', {});             // id → { id, von, gegen, spiel, seed, erstellt, ergebnisse: { schlüssel: { p, m, z } }, abgelehnt? }
  const schluessel = (name) => name.normalize('NFC').toLowerCase();
  const dateiname = (k) => encodeURIComponent(k).replace(/%/g, '_');

  // ---------- PIN ----------
  const hashen = (pin, salz) => crypto.scryptSync(pin, salz, 32).toString('hex');
  const pinOk = (konto, pin) => crypto.timingSafeEqual(Buffer.from(hashen(pin, konto.salz), 'hex'), Buffer.from(konto.hash, 'hex'));

  // ---------- Begrenzung pro Anschluss ----------
  const zaehler = new Map();   // art:ip → [zeitpunkte]
  const zuViel = (art, ip, max) => { const k = art + ':' + ip, l = (zaehler.get(k) || []).filter((t) => jetzt() - t < 3600e3); zaehler.set(k, l); return l.length >= max; };
  const zaehlen = (art, ip) => { const k = art + ':' + ip; zaehler.set(k, (zaehler.get(k) || []).concat(jetzt())); };

  // ---------- Sitzung ----------
  const tokenHash = (t) => crypto.createHash('sha256').update(t).digest('hex');
  function sitzungVon(req) {
    const m = new RegExp('(?:^|;\\s*)' + COOKIE + '=([A-Za-z0-9_-]+)').exec(req.headers.cookie || '');
    if (!m) return null;
    const s = sitzungen[tokenHash(m[1])];
    if (!s || !konten[s.schluessel] || jetzt() - s.erstellt > SITZUNG_TAGE * 864e5) return null;
    return { ...s, hash: tokenHash(m[1]) };
  }
  function anmeldenAls(res, k, sicher) {
    const token = crypto.randomBytes(32).toString('base64url');
    sitzungen[tokenHash(token)] = { schluessel: k, erstellt: jetzt() };
    schreiben('sitzungen.json', sitzungen);
    res.setHeader('Set-Cookie', COOKIE + '=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + SITZUNG_TAGE * 86400 + (sicher ? '; Secure' : ''));
  }

  // ---------- Antworten ----------
  const senden = (res, status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
  const koerper = (req) => new Promise((ok, nein) => {
    let n = 0; const teile = [];
    req.on('data', (c) => { n += c.length; if (n > MAX_BODY) { nein(Object.assign(new Error('zu groß'), { status: 413 })); req.destroy(); } else teile.push(c); });
    req.on('end', () => { try { ok(teile.length ? JSON.parse(Buffer.concat(teile).toString('utf8')) : {}); } catch (e) { nein(Object.assign(new Error('kein JSON'), { status: 400 })); } });
    req.on('error', nein);
  });
  // Öffentliche Zusammenfassung: nur bekannte Felder, Zahlen begrenzt, Texte gekürzt
  const zahl = (x, min, max) => { const n = Math.round(Number(x)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };
  function oeffentlichSaeubern(o) {
    if (!o || typeof o !== 'object') return null;
    return {
      xp: zahl(o.xp, 0, 1e8), level: zahl(o.level, 1, 1000), titel: String(o.titel || '').slice(0, 30),
      avatar: String(o.avatar || '🙂').slice(0, 8), farbe: /^#[0-9a-fA-F]{6}$/.test(o.farbe || '') ? o.farbe : '#64748b',
      skills: Array.isArray(o.skills) ? o.skills.slice(0, 7).map((v) => zahl(v, -1, 100)) : [],
      serie: zahl(o.serie, 0, 1e5), abzeichen: zahl(o.abzeichen, 0, 1e5), gelernt: zahl(o.gelernt, 0, 1e6), runden: zahl(o.runden, 0, 1e7),
      spiele: Array.isArray(o.spiele) ? o.spiele.filter((x) => x && /^[a-z0-9_-]{1,20}$/i.test(x.s)).slice(0, 5).map((x) => ({ s: x.s, n: zahl(x.n, 0, 1e7) })) : [],
    };
  }
  const aenderungenPruefen = (a) => a && typeof a === 'object' && Object.entries(a).every(([k, x]) => k.startsWith('walquiz.') && k.length < 200 && x && (typeof x.v === 'string' || x.v === null));
  // Stand eines Kontos; ältere Dateien ({ version, daten }) werden beim Lesen umgewandelt
  const NIE_SPEICHERN = ['walquiz.spotify.v1'];   // Zugangsschlüssel fremder Dienste bleiben auf dem Gerät
  function standLesen(datei) {
    const st = lesen(datei, null);
    if (!st) return { version: 0, eintraege: {} };
    if (st.eintraege) { NIE_SPEICHERN.forEach((k) => delete st.eintraege[k]); return st; }
    const eintraege = {}; Object.entries(st.daten || {}).forEach(([k, v]) => { eintraege[k] = { v, ver: st.version || 1 }; });
    return { version: st.version || 1, eintraege };
  }

  async function bearbeiten(req, res) {
    const url = new URL(req.url, 'http://x'), weg = url.pathname.replace(/^.*?\/api\//, '/');
    // hinter Caddy: der echte Anschluss steht im letzten X-Forwarded-For-Eintrag
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').pop().trim();
    const sicher = req.headers['x-forwarded-proto'] === 'https';
    const m = req.method;

    if (weg === '/ich' && m === 'GET') {
      const s = sitzungVon(req);
      return s ? senden(res, 200, Object.assign({ name: konten[s.schluessel].name }, admins.has(s.schluessel) ? { admin: true } : {})) : senden(res, 401, { server: 'spielekiste' });
    }

    if ((weg === '/registrieren' || weg === '/anmelden') && m === 'POST') {
      const b = await koerper(req), name = String(b.name || '').trim(), pin = String(b.pin || '');
      if (!NAME_RE.test(name)) return senden(res, 400, { fehler: 'Der Name braucht 3–20 Zeichen (Buchstaben, Ziffern, . _ -).' });
      if (!PIN_RE.test(pin)) return senden(res, 400, { fehler: 'Die PIN besteht aus 4 bis 8 Ziffern.' });
      const k = schluessel(name);
      if (weg === '/registrieren') {
        if (konten[k]) return senden(res, 409, { fehler: 'Den Namen „' + name + '“ gibt es schon. Bitte einen anderen wählen – oder anmelden, wenn es deiner ist.' });
        if (zuViel('neu', ip, 5)) return senden(res, 429, { fehler: 'Gerade wurden zu viele Konten angelegt. Bitte später nochmal.' });
        if (Object.keys(konten).length >= MAX_KONTEN) return senden(res, 403, { fehler: 'Auf diesem Server ist kein Platz für weitere Konten.' });
        const salz = crypto.randomBytes(16).toString('hex');
        konten[k] = { name, salz, hash: hashen(pin, salz), erstellt: jetzt(), fehl: 0 };
        schreiben('konten.json', konten); zaehlen('neu', ip);
        anmeldenAls(res, k, sicher);
        return senden(res, 200, { name, neu: true });
      }
      if (zuViel('fehl', ip, 30)) return senden(res, 429, { fehler: 'Zu viele Fehlversuche. Bitte in einer Stunde nochmal.' });
      const konto = konten[k];
      if (!konto) { zaehlen('fehl', ip); return senden(res, 401, { fehler: 'Name oder PIN stimmt nicht.' }); }
      if (konto.sperreBis && konto.sperreBis > jetzt()) return senden(res, 429, { fehler: 'Zu viele falsche PINs – „' + konto.name + '“ ist noch ' + Math.ceil((konto.sperreBis - jetzt()) / 60e3) + ' Minuten gesperrt.' });
      if (!pinOk(konto, pin)) {
        zaehlen('fehl', ip);
        konto.fehl = (konto.fehl || 0) + 1;
        if (konto.fehl >= 5) { konto.sperreMin = Math.min((konto.sperreMin || 7.5) * 2, 24 * 60); konto.sperreBis = jetzt() + konto.sperreMin * 60e3; konto.fehl = 0; }
        schreiben('konten.json', konten);
        return senden(res, 401, { fehler: 'Name oder PIN stimmt nicht.' });
      }
      konto.fehl = 0; konto.sperreBis = 0; konto.sperreMin = 0; schreiben('konten.json', konten);
      anmeldenAls(res, k, sicher);
      return senden(res, 200, { name: konto.name });
    }

    if (weg === '/abmelden' && m === 'POST') {
      const s = sitzungVon(req);
      if (s) { delete sitzungen[s.hash]; schreiben('sitzungen.json', sitzungen); }
      res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return senden(res, 200, {});
    }

    // ---------- ab hier nur angemeldet ----------
    const s = sitzungVon(req);
    if (!s) return senden(res, 401, { server: 'spielekiste' });
    const k = s.schluessel, standDatei = 'staende/' + dateiname(k) + '.json';

    if (weg === '/abgleich' && m === 'POST') {
      const b = await koerper(req), basis = Number(b.basis) || 0, aend = b.aenderungen || {};
      if (!aenderungenPruefen(aend)) return senden(res, 400, { fehler: 'Ungültige Änderungen' });
      const st = standLesen(standDatei), neueVersion = st.version + 1;
      let geaendert = false; const vonHier = new Set();
      for (const [schl, x] of Object.entries(aend)) {
        if (NIE_SPEICHERN.includes(schl)) continue;
        const e = st.eintraege[schl];
        if (x.alt && e && e.ver > basis) continue;                 // anderes Gerät war neuer – Kleinkram vom Öffnen verwirft sich
        vonHier.add(schl);
        if (e ? e.v === x.v : x.v === null) continue;              // nichts Neues
        st.eintraege[schl] = { v: x.v, ver: neueVersion }; geaendert = true;
      }
      if (geaendert) {
        st.version = neueVersion; st.zeit = new Date(jetzt()).toISOString();
        st.geraet = String(b.geraet || '').slice(0, 30); st.stand = String(b.stand || '').slice(0, 30);
        schreiben(standDatei, st);
        const archiv = 'archiv/' + dateiname(k) + '-' + new Date(jetzt()).toISOString().slice(0, 10) + '.json';
        if (!fs.existsSync(path.join(daten, archiv))) {
          schreiben(archiv, st);
          // Tageskopien älter als 30 Tage löschen
          const grenze = new Date(jetzt() - 30 * 864e5).toISOString().slice(0, 10), vor = dateiname(k) + '-';
          for (const f of fs.readdirSync(path.join(daten, 'archiv'))) if (f.startsWith(vor) && f.slice(vor.length, vor.length + 10) < grenze) fs.rmSync(path.join(daten, 'archiv', f), { force: true });
        }
      }
      const oe = oeffentlichSaeubern(b.oeffentlich);
      if (oe) { bestenliste[k] = Object.assign(oe, { zeit: jetzt() }); schreiben('bestenliste.json', bestenliste); }
      // Nur zurückschicken, was ein anderes Gerät seit „basis“ geändert hat (das eben Hochgeladene kennt das Gerät ja)
      const neu = {}; let n = 0;
      Object.entries(st.eintraege).forEach(([schl, e]) => { if (e.ver > basis && !vonHier.has(schl)) { neu[schl] = e.v; n++; } });
      return senden(res, 200, n ? { version: st.version, zeit: st.zeit, geraet: st.geraet, neu } : { version: st.version });
    }
    if (weg === '/bestenliste' && m === 'GET') {
      const liste = Object.entries(bestenliste).filter(([schl]) => konten[schl])
        .map(([schl, e]) => Object.assign({ name: konten[schl].name }, e, schl === k ? { ich: true } : {}))
        .sort((a, b) => b.xp - a.xp || b.level - a.level || a.name.localeCompare(b.name));
      return senden(res, 200, liste);
    }
    // ---------- Admin: Server nach Bedarf aktualisieren ----------
    if (weg.startsWith('/admin/')) {
      if (!admins.has(k)) return senden(res, 403, { fehler: 'Nur für den Betreiber.' });
      const lies = (f) => { try { return fs.readFileSync(path.join(basis || path.dirname(daten), f), 'utf8'); } catch (e) { return ''; } };
      if (weg === '/admin/status' && m === 'GET') {
        return senden(res, 200, { version: lies('version.txt').trim().slice(0, 7), log: lies('update.log').trim().split(/\r?\n/).filter(Boolean).slice(-6),
          konten: Object.keys(konten).length, duelle: Object.keys(duelle).length,
          erweiterungen: { adguard: { installiert: fs.existsSync(path.join(basis || path.dirname(daten), 'AdGuardHome', 'AdGuardHome.exe')), laeuft: await dnsPruefen() } },
          erweiterungenLog: lies('erweiterungen.log').trim().split(/\r?\n/).filter(Boolean).slice(-4), lanIp: lanIp(), aufgabe: await aufgabeAbfragen() });
      }
      if (weg === '/admin/erweiterung' && m === 'POST') {
        const b = await koerper(req), e = ERWEITERUNGEN[String(b.name || '')];
        if (!e) return senden(res, 400, { fehler: 'Unbekannte Erweiterung.' });
        const pw = String(b.passwort || '');
        if (pw.length < 8 || pw.length > 64 || /["'`$\s]/.test(pw)) return senden(res, 400, { fehler: 'Passwort: 8–64 Zeichen, ohne Leerzeichen und ohne " \' ` $' });
        if (jetzt() - letzteErweiterung < 60e3) return senden(res, 429, { fehler: 'Gerade läuft schon eine Installation – bitte eine Minute warten.' });
        letzteErweiterung = jetzt();
        const ordner = basis || path.dirname(daten), skript = path.join(ordner, 'spiel', 'werkzeuge', 'homeserver', 'windows', 'erweiterungen', e.skript);
        if (!fs.existsSync(skript)) return senden(res, 500, { fehler: 'Installationsskript fehlt – erst „Aktualisieren“.' });
        try { erweiterungStarten(skript, ordner, { SPIELEKISTE_PASSWORT: pw }); } catch (x) { return senden(res, 500, { fehler: 'Konnte die Installation nicht starten.' }); }
        return senden(res, 200, { gestartet: true, name: e.name });
      }
      if (weg === '/admin/pruefen' && m === 'GET') {
        if (pruefCache && jetzt() - pruefCache.zeit < 20e3) return senden(res, 200, pruefCache.antwort);   // GitHub nicht mit Klicks fluten
        const zweig = lies('update-zweig.txt').trim() || 'spielstand-sync', aktuell = lies('version.txt').trim();
        let kopf;
        try { kopf = await github('/commits/' + encodeURIComponent(zweig)); } catch (e) { return senden(res, 502, { fehler: 'GitHub gerade nicht erreichbar (' + e.message + ').' }); }
        const neu = String(kopf.sha || ''), antwort = { aktuell: aktuell.slice(0, 7), neu: neu.slice(0, 7), neuer: !!neu && neu !== aktuell, anzahl: 0, aenderungen: [] };
        if (antwort.neuer) {
          if (aktuell) {
            try {
              const v = await github('/compare/' + aktuell + '...' + neu);
              antwort.anzahl = v.ahead_by || 0;
              antwort.aenderungen = (v.commits || []).map((c) => String((c.commit && c.commit.message) || '').split('\n')[0].slice(0, 120)).reverse().slice(0, 8);
            } catch (e) { /* Vergleich ist nur Zugabe */ }
          } else antwort.aenderungen = [String((kopf.commit && kopf.commit.message) || '').split('\n')[0].slice(0, 120)];
        }
        pruefCache = { zeit: jetzt(), antwort };
        return senden(res, 200, antwort);
      }
      if (weg === '/admin/aktualisieren' && m === 'POST') {
        pruefCache = null;
        if (jetzt() - letztesUpdate < 60e3) return senden(res, 429, { fehler: 'Ein Update wurde gerade erst gestartet – bitte eine Minute warten.' });
        letztesUpdate = jetzt();
        try { await updateStarten(); } catch (e) { return senden(res, 500, { fehler: 'Update konnte nicht gestartet werden (Aufgabe „Spielekiste\\Update“ eingerichtet?).' }); }
        return senden(res, 200, { gestartet: true });
      }
    }
    if (weg === '/konto/loeschen' && m === 'POST') {
      const b = await koerper(req), konto = konten[k];
      if (!PIN_RE.test(String(b.pin || '')) || !pinOk(konto, String(b.pin))) return senden(res, 401, { fehler: 'Die PIN stimmt nicht.' });
      const vor = dateiname(k) + '-';
      fs.rmSync(path.join(daten, standDatei), { force: true });
      for (const f of fs.readdirSync(path.join(daten, 'archiv'))) if (f.startsWith(vor)) fs.rmSync(path.join(daten, 'archiv', f), { force: true });
      Object.keys(sitzungen).forEach((h) => { if (sitzungen[h].schluessel === k) delete sitzungen[h]; });
      Object.values(duelle).forEach((d) => { if (d.von === k || d.gegen === k) delete duelle[d.id]; });
      delete bestenliste[k]; delete konten[k];
      schreiben('konten.json', konten); schreiben('sitzungen.json', sitzungen); schreiben('bestenliste.json', bestenliste); schreiben('duelle.json', duelle);
      res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return senden(res, 200, {});
    }
    // ---------- Duelle ----------
    const duellFuer = (d) => {   // Sicht eines Teilnehmers
      const gegner = d.von === k ? d.gegen : d.von, mein = d.ergebnisse[k] || null, sein = d.ergebnisse[gegner] || null;
      const abgelaufen = !d.abgelehnt && (!mein || !sein) && jetzt() - d.erstellt > DUELL_TAGE * 864e5;
      let ausgang = null;
      if (mein && sein) ausgang = mein.p > sein.p ? 'sieg' : mein.p < sein.p ? 'niederlage' : 'unentschieden';
      return { id: d.id, spiel: d.spiel, seed: d.seed, erstellt: d.erstellt, vonMir: d.von === k, gegner: konten[gegner] ? konten[gegner].name : '?',
        mein, sein, ausgang, abgelehnt: !!d.abgelehnt, abgelaufen };
    };
    const meineDuelle = () => Object.values(duelle).filter((d) => (d.von === k || d.gegen === k) && jetzt() - d.erstellt < 30 * 864e5);
    if (weg === '/duell' && m === 'POST') {
      const b = await koerper(req), gk = schluessel(String(b.gegen || '').trim());
      if (!konten[gk] || gk === k) return senden(res, 400, { fehler: 'Diesen Spieler gibt es nicht.' });
      const spiel = b.spiel ? String(b.spiel) : DUELL_SPIELE[crypto.randomInt(DUELL_SPIELE.length)];
      if (!DUELL_SPIELE.includes(spiel)) return senden(res, 400, { fehler: 'Dieses Spiel geht nicht als Duell.' });
      const offen = meineDuelle().filter((d) => d.von === k && !d.abgelehnt && Object.keys(d.ergebnisse).length < 2 && jetzt() - d.erstellt < DUELL_TAGE * 864e5);
      if (offen.length >= DUELL_OFFEN_MAX) return senden(res, 429, { fehler: 'Du hast schon ' + DUELL_OFFEN_MAX + ' offene Duelle.' });
      const d = { id: crypto.randomBytes(8).toString('hex'), von: k, gegen: gk, spiel, seed: 'duell-' + crypto.randomBytes(6).toString('hex'), erstellt: jetzt(), ergebnisse: {} };
      // aufräumen: Duelle älter als 30 Tage
      Object.values(duelle).forEach((x) => { if (jetzt() - x.erstellt > 30 * 864e5) delete duelle[x.id]; });
      duelle[d.id] = d; schreiben('duelle.json', duelle);
      return senden(res, 200, duellFuer(d));
    }
    if (weg === '/duelle' && m === 'GET') {
      const liste = meineDuelle().sort((a, b) => b.erstellt - a.erstellt).slice(0, 50).map(duellFuer);
      const bilanz = {};
      meineDuelle().map(duellFuer).forEach((d) => {
        if (!d.ausgang) return;
        const z = (bilanz[d.gegner] = bilanz[d.gegner] || { s: 0, n: 0, u: 0 });
        z[d.ausgang === 'sieg' ? 's' : d.ausgang === 'niederlage' ? 'n' : 'u']++;
      });
      return senden(res, 200, { duelle: liste, bilanz });
    }
    if ((weg === '/duell/ergebnis' || weg === '/duell/ablehnen') && m === 'POST') {
      const b = await koerper(req), d = duelle[String(b.id || '')];
      if (!d || (d.von !== k && d.gegen !== k)) return senden(res, 404, { fehler: 'Duell nicht gefunden.' });
      if (weg === '/duell/ablehnen') { if (d.gegen === k && !d.ergebnisse[k]) { d.abgelehnt = true; schreiben('duelle.json', duelle); } return senden(res, 200, duellFuer(d)); }
      if (d.abgelehnt) return senden(res, 409, { fehler: 'Dieses Duell wurde abgelehnt.' });
      if (d.ergebnisse[k]) return senden(res, 409, Object.assign({ fehler: 'Du hast dieses Duell schon gespielt.' }, duellFuer(d)));
      d.ergebnisse[k] = { p: zahl(b.p, 0, 1e7), m: zahl(b.m, 0, 1e7), z: jetzt() };
      schreiben('duelle.json', duelle);
      return senden(res, 200, duellFuer(d));
    }
    return senden(res, 404, { fehler: 'Unbekannt' });
  }

  return http.createServer((req, res) => {
    bearbeiten(req, res).catch((e) => { if (!res.headersSent) senden(res, e.status || 500, { fehler: e.status ? e.message : 'Serverfehler' }); if (!e.status) console.error(e); });
  });
}

module.exports = { erstelleServer };

if (require.main === module) {
  const arg = (n, std) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : std; };
  const daten = path.resolve(arg('daten', path.join(__dirname, 'daten'))), port = Number(arg('port', 8090));
  const admin = String(arg('admin', '')).split(',').map((x) => x.trim()).filter(Boolean), basis = arg('basis', null);
  erstelleServer({ daten, admin, basis: basis && path.resolve(basis) }).listen(port, '127.0.0.1', () => console.log('Spielstand-Server läuft auf http://127.0.0.1:' + port + ' – Daten in ' + daten));
}
