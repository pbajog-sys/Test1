#!/usr/bin/env node
// Spielstand-Server für den Homeserver: Benutzerkonten (Name + PIN) und ein Spielstand pro Konto.
// Läuft hinter Caddy (reverse_proxy /api/* localhost:8090), braucht nur Node.js – keine Zusatzpakete.
//
//   node spielstand-server.js [--daten C:\homeserver\daten] [--port 8090]
//
// Endpunkte (alle unter /api/, JSON):
//   GET  /api/ich             → { name } oder 401 { server: 'spielekiste' }
//   POST /api/registrieren    { name, pin } → neues Konto, angemeldet (Cookie)
//   POST /api/anmelden        { name, pin } → angemeldet (Cookie)
//   POST /api/abmelden
//   POST /api/abgleich        { basis, geraet, stand, aenderungen: { schlüssel: { v: text|null, alt?: true } } }
//                             → { version, neu? }  (neu = nur Einträge, die seit „basis“ ein anderes Gerät geändert hat;
//                                                   v: null = gelöscht – so geht nach einer Runde kaum etwas über die Leitung)
//                             optional oeffentlich: { xp, level, titel, avatar, farbe, skills[7], serie, abzeichen, gelernt, runden }
//                             → Eintrag in der gemeinsamen Bestenliste (nur diese Zusammenfassung ist für andere sichtbar)
//   GET  /api/bestenliste     → [{ name, ich?, xp, level, … }]  nach XP sortiert, nur für Angemeldete
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
// archiv/<name>-JJJJ-MM-TT.json (Tageskopie).
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const NAME_RE = /^[A-Za-z0-9ÄÖÜäöüß._-]{3,20}$/;
const PIN_RE = /^\d{4,8}$/;
const MAX_KONTEN = 50, MAX_BODY = 10 * 1024 * 1024, COOKIE = 'spielekiste_sitzung', SITZUNG_TAGE = 365;

function erstelleServer({ daten, jetzt = () => Date.now() } = {}) {
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
    };
  }
  const aenderungenPruefen = (a) => a && typeof a === 'object' && Object.entries(a).every(([k, x]) => k.startsWith('walquiz.') && k.length < 200 && x && (typeof x.v === 'string' || x.v === null));
  // Stand eines Kontos; ältere Dateien ({ version, daten }) werden beim Lesen umgewandelt
  function standLesen(datei) {
    const st = lesen(datei, null);
    if (!st) return { version: 0, eintraege: {} };
    if (st.eintraege) return st;
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
      return s ? senden(res, 200, { name: konten[s.schluessel].name }) : senden(res, 401, { server: 'spielekiste' });
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
        if (!fs.existsSync(path.join(daten, archiv))) schreiben(archiv, st);
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
  erstelleServer({ daten }).listen(port, '127.0.0.1', () => console.log('Spielstand-Server läuft auf http://127.0.0.1:' + port + ' – Daten in ' + daten));
}
