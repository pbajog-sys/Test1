// LoL-Zentrale: League-of-Legends-Statistik für den Freundeskreis (Teil des Konto-Servers, wird von spielstand-server.js geladen)
//
// • Jeder Angemeldete trägt seine Riot-Accounts selbst ein (auch mehrere – Smurfs werden zu einer Person zusammengeführt).
// • Mit Riot-API-Key (vom Admin in der Server-Zentrale eingetragen, liegt nur in daten/riot-key.txt) holt der Server im
//   Hintergrund neue Spiele, Ränge und Profilbilder – gedrosselt auf Riots Grenzen (20/s, 100 je 2 Min.) – und speichert alles
//   dauerhaft (daten/lol/). Ohne Key oder solange noch keine Spiele da sind: Beispieldaten, damit man alles sehen kann.
// • Auswertung: Personen (Winrate, KDA, Rollen, Champions, Form), Duos (wer mit wem, nach Rollen), Gegeneinander,
//   Rollen-Matrix und Spiele-Feed. Die „beste Aufstellung“ rechnet die Seite selbst aus diesen Zahlen.
//
// Schnittstellen (alle nur für Angemeldete; /admin/… nur für den Admin):
//   GET  /api/lol/daten?filter=alle|solo|flex|normal|aram|mayhem  → { quelle: 'demo'|'riot', key, personen, duos, gegner, feed, … }
//   POST /api/lol/account            { riotId: 'Name#Tag', region: 'euw1', fuer?: Person, neuName?: 'Name' } → Account eintragen (für sich oder Mitspieler)
//   POST /api/lol/account/entfernen  { riotId, person? }
//   POST /api/lol/account/zuordnen   { riotId, person, nach | neuName }   → Account einer anderen Person geben
//   POST /api/lol/auto/aufnehmen|ausblenden { u } · /api/lol/auto/einblenden → automatisch erkannte Mitspieler
//   GET  /api/lol/person?id=…&filter=… → Spieler-Profil (Spielverlauf mit allen 10, Mastery, Rang-Verlauf, Aktivität … siehe lol-profil.js)
//   /api/lol/prime…                  → Prime League (siehe lol-prime.js)
//   GET  /api/lol/aktualisieren      → Status des eigenen manuellen Imports
//   POST /api/lol/aktualisieren      → eigene Accounts sofort neu holen (höchstens alle 2 Min.)
//   GET  /api/lol/bild/champion/<Name>.png, /api/lol/bild/profil/<id>.png → Bilder von Riots Data Dragon (zwischengespeichert)
//   GET/POST /api/admin/lol          { key: 'RGAPI-…' | '' } → Key setzen/entfernen, Zustand
'use strict';
const fs = require('fs'), path = require('path');

const REGIONEN = {
  euw1: ['EUW', 'europe'], eun1: ['EUNE', 'europe'], tr1: ['TR', 'europe'], ru: ['RU', 'europe'],
  na1: ['NA', 'americas'], br1: ['BR', 'americas'], la1: ['LAN', 'americas'], la2: ['LAS', 'americas'],
  kr: ['KR', 'asia'], jp1: ['JP', 'asia'], oc1: ['OCE', 'sea'], sg2: ['SG', 'sea'], tw2: ['TW', 'sea'], vn2: ['VN', 'sea'],
};
// CommunityDragon: queues.json und Map12 (KIWI / KIWI_JADE, Bilgewater / Bloom).
// Die aktuelle Kartenrotation teilt ID 12. ID 14 ist Riots historische Butcher's Bridge.
const MAYHEM_PVP_QUEUES = [2400, 2401, 2403, 2405, 2410, 2450];
const MAYHEM_QUEUES = MAYHEM_PVP_QUEUES.concat(3240, 3270, 3280);
const ARAM_QUEUES = [450, 100, 62, 63, 64, 65, 860, 861, 930, 931, 3200, 3210, 3220, 3230, 3250];
const ARAM_KARTEN = [12, 14];
const FILTER = { alle: [400, 420, 430, 440, 490], solo: [420], flex: [440], normal: [400, 430, 490], aram: ARAM_QUEUES, mayhem: MAYHEM_QUEUES, jeder: [] };
const QUEUE_NAME = { 420: 'Ranked Solo', 440: 'Ranked Flex', 400: 'Normal Draft', 430: 'Normal Blind', 490: 'Quickplay', 720: 'ARAM Clash', 1700: 'Arena', 1900: 'URF', 900: 'ARURF' };

function aramArt(m) {
  if (m.q === 0 || m.q === 720 || QUEUE_NAME[m.q]) return '';
  if (MAYHEM_QUEUES.includes(m.q)) return 'mayhem';
  if (ARAM_QUEUES.includes(m.q)) return 'aram';
  if (/KIWI|MAYHEM/i.test(m.gm || '')) return 'mayhem';
  if (/ARAM/i.test(m.gm || '') || ARAM_KARTEN.includes(m.mp)) return 'aram';
  return '';
}
function passtFilter(filter, m) {
  if (filter === 'jeder') return m.q !== 0;
  if (filter === 'aram' || filter === 'mayhem') return aramArt(m) === filter;
  return (FILTER[filter] || FILTER.alle).includes(m.q);
}
function queueText(m) {
  const art = aramArt(m);
  if (art) return art === 'mayhem' ? 'ARAM: Mayhem' : 'ARAM';
  return QUEUE_NAME[m.q] || 'Spiel [' + m.q + ' · ' + (m.gm || 'Modus noch unbekannt') + ']';
}
const ROLLEN = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
const RIOT_ID = /^(.{3,16})#([A-Za-z0-9]{2,5})$/u;
const { erstellePrime } = require('./lol-prime.js');
const { profil } = require('./lol-profil.js');
// fester Zufall für Beispieldaten
const rnd = (start) => { let s = start; return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; };
const POOL = { TOP: ['Aatrox', 'Darius', 'Garen', 'Fiora', 'Sett', 'Riven', 'Irelia', 'Yone'], JUNGLE: ['LeeSin', 'Viego', 'Graves', 'Hecarim', 'Kayn', 'Vi', 'Amumu', 'Diana'],
  MIDDLE: ['Ahri', 'Sylas', 'Yasuo', 'Orianna', 'Lux', 'Akali', 'Zed', 'Ekko'], BOTTOM: ['Jinx', 'Kaisa', 'Ezreal', 'Caitlyn', 'Jhin', 'Vayne', 'MissFortune', 'Ashe'],
  UTILITY: ['Thresh', 'Lulu', 'Nami', 'Leona', 'Nautilus', 'Karma', 'Morgana', 'Pyke'] };

function erstelleLol({ daten, jetzt = () => Date.now(), senden, koerper, kontoName, konten = () => [], istAdmin = () => false, protokoll = () => {}, takt = 10 * 60e3,
  riotHolen = null, bildHolen = null, warten = (ms) => new Promise((ok) => setTimeout(ok, ms)) }) {
  const ordner = path.join(daten, 'lol');
  fs.mkdirSync(path.join(ordner, 'bilder'), { recursive: true });
  const lies = (f, leer) => { try { return JSON.parse(fs.readFileSync(path.join(ordner, f), 'utf8')); } catch (e) { return leer; } };
  const schreib = (f, o) => { const z = path.join(ordner, f), tmp = z + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(o)); fs.renameSync(tmp, z); };
  const keyDatei = path.join(daten, 'riot-key.txt');
  const key = () => { try { return fs.readFileSync(keyDatei, 'utf8').trim(); } catch (e) { return ''; } };

  // zustand: { personen: { konto: [{ riotId, region, puuid, fehler, hinzu }] }, accounts: { puuid: { riotId, region, icon, level, rang, ids: [], geholt } } }
  let zustand = Object.assign({ personen: {}, accounts: {}, gaeste: {} }, lies('zustand.json', {}));
  zustand.gaeste = zustand.gaeste || {};

  // Personen: Spielekiste-Konten (Schlüssel wie im Konto-Server) oder Mitspieler ohne Konto („gast:<name>“, nur ein Name)
  const istGast = (id) => String(id).startsWith('gast:');
  const personName = (id) => (istGast(id) ? zustand.gaeste[id] || id.slice(5) : kontoName(id) || id);
  const gibtPerson = (id) => (istGast(id) ? !!zustand.gaeste[id] : konten().some((x) => x.id === id));
  // Wer darf einen Account entfernen/umhängen: die Person selbst, wer ihn eingetragen hat, der Admin – Gäste verwaltet die ganze Gruppe
  const darf = (k, person, acc) => person === k || istGast(person) || (acc && acc.von === k) || istAdmin(k);
  function gastAnlegen(name) {
    const n = String(name || '').trim().replace(/\s+/g, ' ');
    if (n.length < 2 || n.length > 24 || /[<>]/.test(n)) return null;
    const id = 'gast:' + n.toLowerCase();
    if (konten().some((x) => x.name.toLowerCase() === n.toLowerCase())) return konten().find((x) => x.name.toLowerCase() === n.toLowerCase()).id;   // gibt's schon als Konto
    zustand.gaeste[id] = zustand.gaeste[id] || n;
    return id;
  }
  function aufraeumen() {   // leere Personen weg, Gäste ohne Accounts auch
    Object.keys(zustand.personen).forEach((id) => { if (!zustand.personen[id].length) delete zustand.personen[id]; });
    Object.keys(zustand.gaeste).forEach((id) => { if (!zustand.personen[id]) delete zustand.gaeste[id]; });
  }
  const spiele = lies('spiele.json', {});   // matchId → kompaktes Spiel
  let keyStatus = key() ? 'unbekannt' : 'fehlt', letzterLauf = 0, laeuft = false, version = 1;
  let speichernUhr = null;
  const speichern = () => { version++; clearTimeout(speichernUhr); speichernUhr = setTimeout(() => { schreib('zustand.json', zustand); schreib('spiele.json', spiele); }, 300); };
  const sofortSpeichern = () => { clearTimeout(speichernUhr); schreib('zustand.json', zustand); schreib('spiele.json', spiele); };

  // ---------- Riot-API mit Drosselung (Dev-/Personal-Key: 20 je Sekunde, 100 je 2 Minuten) ----------
  const zeiten = [];
  async function drosseln() {
    for (;;) {
      const t = jetzt();
      while (zeiten.length && t - zeiten[0] > 120e3) zeiten.shift();
      const proSek = zeiten.filter((x) => t - x < 1000).length;
      if (zeiten.length < 95 && proSek < 18) { zeiten.push(t); return; }
      await warten(zeiten.length >= 95 ? Math.max(200, 120e3 - (t - zeiten[0]) + 50) : 250);
    }
  }
  const STANDARD_HOLEN = async (url, k) => {
    const r = await fetch(url, { headers: { 'X-Riot-Token': k, 'User-Agent': 'spielekiste-lol' }, signal: AbortSignal.timeout(15000) });
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch (e) { /* leer */ }
    return { status: r.status, json, warten: Number(r.headers.get('retry-after') || 0) };
  };
  const holen = riotHolen || STANDARD_HOLEN;
  async function riot(url, privateAntwortMoeglich = false) {
    const k = key(); if (!k) throw Object.assign(new Error('kein Key'), { status: 0 });
    for (let versuch = 0; versuch < 3; versuch++) {
      await drosseln();
      const r = await holen(url, k);
      if (r.status === 429) { await warten((r.warten || 10) * 1000); continue; }
      if (r.status === 403 && privateAntwortMoeglich) return r;
      if (r.status === 401 || r.status === 403) { keyStatus = 'ungueltig'; throw Object.assign(new Error('Key ungültig oder abgelaufen'), { status: r.status }); }
      if (r.status >= 500) { await warten(2000); continue; }
      if (r.status === 200) keyStatus = 'ok';
      return r;
    }
    throw Object.assign(new Error('Riot antwortet gerade nicht'), { status: 503 });
  }
  const plattform = (region) => 'https://' + region + '.api.riotgames.com';
  const regional = (region) => 'https://' + (REGIONEN[region] || REGIONEN.euw1)[1] + '.api.riotgames.com';

  // kompaktes Spiel: nur was die Auswertung braucht (alle 10 Teilnehmer, damit Mit- und Gegenspieler bekannt sind)
  function kompakt(m) {
    const i = m.info || {}, bans = {};
    (i.teams || []).forEach((t) => { bans[t.teamId] = (t.bans || []).map((x) => x.championId).filter((x) => x > 0); });
    return { x: 3, gm: i.gameMode || '', mp: i.mapId || 0, b: bans, id: m.metadata.matchId, t: i.gameStartTimestamp || i.gameCreation, d: i.gameDuration, q: i.queueId, v: String(i.gameVersion || '').split('.').slice(0, 2).join('.'),
      p: (i.participants || []).map((x) => ({ u: x.puuid, n: (x.riotIdGameName || x.summonerName || '?') + (x.riotIdTagline ? '#' + x.riotIdTagline : ''), c: x.championName,
        r: x.teamPosition || '', tm: x.teamId, w: !!x.win, k: x.kills, de: x.deaths, a: x.assists, cs: (x.totalMinionsKilled || 0) + (x.neutralMinionsKilled || 0),
        g: x.goldEarned, s: x.totalDamageDealtToChampions, vs: x.visionScore, it: [x.item0, x.item1, x.item2, x.item3, x.item4, x.item5, x.item6].map((v) => v || 0),
        sp: [x.summoner1Id || 0, x.summoner2Id || 0], cl: x.champLevel || 0,
        ru: (() => { const st = (x.perks && x.perks.styles) || []; return [st[0] && st[0].selections && st[0].selections[0] ? st[0].selections[0].perk : 0, st[1] ? st[1].style : 0]; })() })) };
  }

  // Private Matches können in einer ID-Liste stehen, obwohl Riot ihre Details sperrt.
  // Nur auf diesen Match-Endpunkten ist 403 kein Befund über die Gültigkeit des Keys.
  const privateSpiele = new Map();
  async function spielHolen(region, id) {
    const r = await riot(regional(region) + '/lol/match/v5/matches/' + id, true);
    if (r.status === 200 && r.json && r.json.info) spiele[id] = kompakt(r.json);
    if (r.status === 403) privateSpiele.set(id, jetzt() + 864e5);
    return r.status;
  }

  // Einen Account aktualisieren: PUUID, Profil, Rang, neue Spiele (beim ersten Mal bis zu 100)
  async function accountHolen(acc, masteryErneuern = false) {
    const [name, tag] = acc.riotId.split('#');
    if (!acc.puuid) {
      const r = await riot(regional(acc.region) + '/riot/account/v1/accounts/by-riot-id/' + encodeURIComponent(name) + '/' + encodeURIComponent(tag));
      if (r.status === 404) { acc.fehler = 'Diesen Riot-Account gibt es nicht (Name#Tag und Region prüfen).'; return; }
      acc.puuid = r.json.puuid; acc.riotId = r.json.gameName + '#' + r.json.tagLine; delete acc.fehler;
    }
    const a = (zustand.accounts[acc.puuid] = zustand.accounts[acc.puuid] || { ids: [] });
    a.riotId = acc.riotId; a.region = acc.region;
    const s = await riot(plattform(acc.region) + '/lol/summoner/v4/summoners/by-puuid/' + acc.puuid);
    if (s.status === 200) { a.icon = s.json.profileIconId; a.level = s.json.summonerLevel; }
    const l = await riot(plattform(acc.region) + '/lol/league/v4/entries/by-puuid/' + acc.puuid);
    if (l.status === 200) {
      a.rang = {};
      (l.json || []).forEach((e) => { const art = e.queueType === 'RANKED_SOLO_5x5' ? 'solo' : e.queueType === 'RANKED_FLEX_SR' ? 'flex' : null; if (art) a.rang[art] = { tier: e.tier, div: e.rank, lp: e.leaguePoints, w: e.wins, l: e.losses }; });
      // LP-Verlauf selbst mitschreiben (Riot liefert nur den aktuellen Stand)
      a.lp = a.lp || [];
      for (const q of ['solo', 'flex']) {
        const r = a.rang[q]; if (!r) continue;
        const alt = a.lp.filter((x) => x.q === q).pop();
        if (!alt || alt.tier !== r.tier || alt.div !== r.div || alt.lp !== r.lp) a.lp.push({ t: jetzt(), q, tier: r.tier, div: r.div, lp: r.lp });
      }
      if (a.lp.length > 300) a.lp = a.lp.slice(-300);
    }
    let masteryFehler = '';
    if (masteryErneuern || !a.masteryZeit || jetzt() - a.masteryZeit > 864e5) {
      const ms = await riot(plattform(acc.region) + '/lol/champion-mastery/v4/champion-masteries/by-puuid/' + acc.puuid + '/top?count=10', true)
        .catch((e) => { if (e.status === 401) throw e; return { status: e.status || 0 }; });
      if (ms.status === 200 && Array.isArray(ms.json)) {
        a.mastery = ms.json.map((x) => ({ id: x.championId, p: x.championPoints, l: x.championLevel }));
        a.masteryZeit = jetzt();
      } else if (masteryErneuern) {
        masteryFehler = 'Champion-Meisterschaft: ' + (ms.status ? 'Riot HTTP ' + ms.status + '.' : 'Riot war nicht erreichbar.');
      }
    }
    const idsPfad = regional(acc.region) + '/lol/match/v5/matches/by-puuid/' + acc.puuid + '/ids';
    const merkeIds = (ids) => { a.ids = [...new Set(a.ids.concat(ids))]; };
    const nachgeholt = (a.aramQueuesGeholt = a.aramQueuesGeholt || []);
    // Ohne queue/type liefert Match-V5 alle Modi, auch neue Queues.
    const anzahl = a.ids.length && nachgeholt.includes('alle') ? 20 : 100;
    const ids = await riot(idsPfad + '?start=0&count=' + anzahl);
    if (ids.status !== 200) throw new Error('Spieleliste: Riot HTTP ' + ids.status + '.');
    merkeIds(ids.json || []);
    if (!nachgeholt.includes('alle')) nachgeholt.push('alle');

    // Pro Queue merken, damit ältere Installationen erneut nachholen und Fehler wiederholt werden.
    for (const q of [420, 440, 450, ...MAYHEM_PVP_QUEUES]) {
      if (nachgeholt.includes(q)) continue;
      const mayhem = MAYHEM_PVP_QUEUES.includes(q);
      const r = await riot(idsPfad + '?queue=' + q + '&start=0&count=50', mayhem);
      if (r.status === 200) merkeIds(r.json || []);
      else if (!(mayhem && r.status === 403)) continue;
      // Diese gezielte Abfrage ist optional. Neu freigegebene Spiele kommen auch über die normale ID-Liste.
      nachgeholt.push(q);
    }
    speichern();
    // Auch ältere IDs ohne gespeichertes Spiel erneut versuchen.
    const fehlend = [...new Set((ids.json || []).concat(a.ids))].filter((id) => !spiele[id] && !privateSpiele.has(id));
    for (const id of fehlend.slice(0, 100)) {
      if (await spielHolen(acc.region, id) === 404) a.ids = a.ids.filter((x) => x !== id);
    }
    // Ältere Spiele schrittweise um Modus, Karte, Runen und Zauber ergänzen.
    for (const id of a.ids.filter((x) => spiele[x] && (spiele[x].x || 0) < 3 && !privateSpiele.has(x)).slice(0, 25)) {
      await spielHolen(acc.region, id);
    }
    if (masteryFehler) acc.fehler = masteryFehler;
    else delete acc.fehler;
    a.geholt = jetzt(); speichern();
  }
  async function allesHolen(nurKonto, masteryErneuern = false) {
    if (laeuft || !key() || keyStatus === 'ungueltig') return false;
    laeuft = true;
    for (const [id, bis] of privateSpiele) if (bis <= jetzt()) privateSpiele.delete(id);
    try {
      const nurTeam = nurKonto && String(nurKonto).startsWith('prime:') ? String(nurKonto).slice(6) : null;
      for (const [konto, liste] of Object.entries(zustand.personen)) {
        if (nurTeam || (nurKonto && konto !== nurKonto)) continue;
        for (const acc of liste) { try { await accountHolen(acc, masteryErneuern); } catch (e) { if (e.status === 401 || e.status === 403) throw e; acc.fehler = e.status ? 'Riot vorübergehend nicht erreichbar (HTTP ' + e.status + ').' : (e.message.startsWith('Spieleliste:') ? e.message : 'Riot war beim Import nicht erreichbar.'); } }
      }
      if (!nurKonto || nurTeam) await prime.allesHolen(nurTeam);
      letzterLauf = jetzt();
      return true;
    } catch (e) { protokoll('LoL: ' + e.message); return false; }
    finally { laeuft = false; speichern(); }
  }
  const uhr = takt > 0 ? setInterval(() => { allesHolen().catch(() => {}); }, takt) : null;
  if (uhr && uhr.unref) uhr.unref();

  // ---------- Auswertung ----------
  const glatt = (w, g) => (w + 2.5) / (g + 5);   // Winrate, zur Mitte gezogen, damit 2 von 2 nicht 100 % „schlägt“
  // Automatisch erkannte Mitspieler: wer mindestens 3-mal mit jemandem aus der Gruppe im selben Team war (Premades),
  // aber nicht eingetragen ist. Zählt nur die gemeinsamen Spiele – kostet keine zusätzlichen Riot-Anfragen.
  const AUTO_MIN = 3, AUTO_MAX = 10;
  function autoMitspieler(personenListe, spielListe) {
    const bekannt = new Set(personenListe.flatMap((p) => p.puuids)), aus = zustand.ausgeblendet || {}, z = {};
    for (const m of spielListe) {
      if (!FILTER.alle.includes(m.q) && !aramArt(m) && m.q !== 720) continue;
      const teams = {}; m.p.forEach((x) => { if (bekannt.has(x.u)) teams[x.tm] = true; });
      m.p.forEach((x) => {
        if (!teams[x.tm] || bekannt.has(x.u) || aus[x.u] || !x.n || x.n === '?') return;
        const e = (z[x.u] = z[x.u] || { g: 0, t: 0 }); e.g++;
        if (m.t > e.t) { e.t = m.t; e.n = x.n; e.region = String(m.id).split('_')[0].toLowerCase(); }
      });
    }
    return Object.entries(z).filter(([, e]) => e.g >= AUTO_MIN).sort((a, b) => b[1].g - a[1].g).slice(0, AUTO_MAX).map(([u, e]) => {
      const region = REGIONEN[e.region] ? e.region : 'euw1';
      return { id: 'auto:' + u, u, name: e.n.split('#')[0], ich: false, auto: true, puuids: [u], accounts: [{ riotId: e.n, region, regionName: REGIONEN[region][0], auto: true }] };
    });
  }

  function auswerten(personenListe, spielListe, filter, vollstaendigeTeams = false) {
    const aram = filter === 'aram' || filter === 'mayhem';
    const vonPuuid = {}; personenListe.forEach((p) => p.puuids.forEach((u) => { vonPuuid[u] = p.id; }));
    const eingetragen = vollstaendigeTeams ? new Set(personenListe.filter((p) => !p.auto).map((p) => p.id)) : null;
    const P = {}; personenListe.forEach((p) => { P[p.id] = { id: p.id, name: p.name, ich: p.ich, auto: p.auto, accounts: p.accounts, g: 0, w: 0, k: 0, de: 0, a: 0, cs: 0, min: 0, s: 0, vs: 0, rollen: {}, champs: {}, verlauf: [] }; });
    const duos = {}, gegner = {}, feed = [];
    const liste = spielListe.filter((m) => passtFilter(filter, m) && m.d >= 300).sort((a, b) => b.t - a.t);
    let spieleGezaehlt = 0;
    for (const m of liste) {
      let wir = m.p.filter((x) => vonPuuid[x.u]);
      if (eingetragen) {
        const teams = new Map();
        for (const x of wir) {
          const person = vonPuuid[x.u];
          if (!eingetragen.has(person)) continue;
          if (!teams.has(x.tm)) teams.set(x.tm, new Set());
          teams.get(x.tm).add(person);
        }
        wir = wir.filter((x) => teams.get(x.tm)?.size === 5);
        if (!wir.length) continue;
      }
      spieleGezaehlt++;
      if (!wir.length) continue;
      const teamKills = { 100: 0, 200: 0 }; m.p.forEach((x) => { teamKills[x.tm] = (teamKills[x.tm] || 0) + x.k; });
      if (feed.length < 60) feed.push({ id: m.id, t: m.t, d: m.d, q: queueText(m), wir: wir.map((x) => ({ person: vonPuuid[x.u], c: x.c, r: aram ? '' : x.r, w: x.w, k: x.k, de: x.de, a: x.a, cs: x.cs, n: x.n,
        kp: teamKills[x.tm] ? Math.round(((x.k + x.a) / teamKills[x.tm]) * 100) : 0, it: x.it || [], s: x.s || 0 })) });
      for (const x of wir) {
        const p = P[vonPuuid[x.u]], r = aram ? 'ARAM' : x.r || '?';
        p.g++; if (x.w) p.w++; p.k += x.k; p.de += x.de; p.a += x.a; p.cs += x.cs; p.min += m.d / 60; p.s += x.s || 0; p.vs += x.vs || 0;
        if (p.verlauf.length < 20) p.verlauf.push(x.w ? 1 : 0);
        const ro = (p.rollen[r] = p.rollen[r] || { g: 0, w: 0, k: 0, de: 0, a: 0 }); ro.g++; if (x.w) ro.w++; ro.k += x.k; ro.de += x.de; ro.a += x.a;
        const ch = (p.champs[x.c] = p.champs[x.c] || { g: 0, w: 0, k: 0, de: 0, a: 0, rollen: {} }); ch.g++; if (x.w) ch.w++; ch.k += x.k; ch.de += x.de; ch.a += x.a; ch.rollen[r] = (ch.rollen[r] || 0) + 1;
      }
      for (let i = 0; i < wir.length; i++) for (let j = i + 1; j < wir.length; j++) {
        const a = wir[i], b = wir[j], pa = vonPuuid[a.u], pb = vonPuuid[b.u];
        if (pa === pb) continue;
        const [x1, x2] = pa < pb ? [a, b] : [b, a], schl = [vonPuuid[x1.u], vonPuuid[x2.u]].join('|');
        if (a.tm === b.tm) {
          const du = (duos[schl] = duos[schl] || { a: vonPuuid[x1.u], b: vonPuuid[x2.u], g: 0, w: 0, rollen: {} }); du.g++; if (a.w) du.w++;
          if (!aram) { const rk = (x1.r || '?') + '+' + (x2.r || '?'), rr = (du.rollen[rk] = du.rollen[rk] || { g: 0, w: 0 }); rr.g++; if (a.w) rr.w++; }
        } else {
          const ge = (gegner[schl] = gegner[schl] || { a: vonPuuid[x1.u], b: vonPuuid[x2.u], g: 0, aSiege: 0 }); ge.g++; if (x1.w) ge.aSiege++;
        }
      }
    }
    const personen = Object.values(P).map((p) => {
      const champs = Object.entries(p.champs).map(([c, v]) => ({ c, ...v, haupt: Object.entries(v.rollen).sort((x, y) => y[1] - x[1])[0][0] })).sort((x, y) => y.g - x.g);
      const form = p.verlauf.slice(0, 10), alt = p.verlauf.slice(10, 20);
      return { id: p.id, name: p.name, ich: p.ich, auto: !!p.auto, accounts: p.accounts, g: p.g, w: p.w, k: p.k, de: p.de, a: p.a, csMin: p.min ? Math.round((p.cs / p.min) * 10) / 10 : 0,
        schadenMin: p.min ? Math.round(p.s / p.min) : 0, sichtMin: p.min ? Math.round((p.vs / p.min) * 100) / 100 : 0, rollen: p.rollen, champs: champs.slice(0, 15),
        form: p.verlauf.slice(0, 10), trend: form.length >= 5 && alt.length >= 5 ? Math.round((form.reduce((a, b) => a + b, 0) / form.length - alt.reduce((a, b) => a + b, 0) / alt.length) * 100) : null };
    }).sort((a, b) => b.g - a.g);
    return { personen, duos: Object.values(duos).sort((a, b) => b.g - a.g), gegner: Object.values(gegner).sort((a, b) => b.g - a.g), feed, spiele: spieleGezaehlt };
  }

  // ---------- Beispieldaten (fest, reproduzierbar) ----------
  const DEMO_RUNEN = { TOP: [8010, 8437, 8230], JUNGLE: [8010, 8112, 8128, 8021], MIDDLE: [8112, 8229, 8214, 8005], BOTTOM: [8008, 8005, 8021, 9923], UTILITY: [8214, 8465, 8439, 8351] };
  const DEMO_ITEMS = { TOP: [3071, 3047, 6630, 3053, 3742, 3026, 3065, 6333], JUNGLE: [6692, 3158, 3142, 6694, 3814, 3071, 3156, 3036], MIDDLE: [3089, 3020, 6655, 3157, 3135, 4645, 3165, 3102],
    BOTTOM: [3031, 3006, 6672, 3036, 3072, 3094, 3085, 3139], UTILITY: [3190, 3109, 2065, 3222, 3107, 3504, 3158, 3117] };
  const DEMO_TAGS = { Aatrox: ['Fighter'], Darius: ['Fighter'], Garen: ['Fighter'], Fiora: ['Fighter'], Sett: ['Fighter'], Riven: ['Fighter'], Irelia: ['Fighter'], Yone: ['Assassin'],
    LeeSin: ['Fighter'], Viego: ['Assassin'], Graves: ['Marksman'], Hecarim: ['Fighter'], Kayn: ['Fighter'], Vi: ['Fighter'], Amumu: ['Tank'], Diana: ['Fighter'],
    Ahri: ['Mage'], Sylas: ['Mage'], Yasuo: ['Fighter'], Orianna: ['Mage'], Lux: ['Mage'], Akali: ['Assassin'], Zed: ['Assassin'], Ekko: ['Assassin'],
    Jinx: ['Marksman'], Kaisa: ['Marksman'], Ezreal: ['Marksman'], Caitlyn: ['Marksman'], Jhin: ['Marksman'], Vayne: ['Marksman'], MissFortune: ['Marksman'], Ashe: ['Marksman'],
    Thresh: ['Support'], Lulu: ['Support'], Nami: ['Support'], Leona: ['Tank'], Nautilus: ['Tank'], Karma: ['Mage'], Morgana: ['Mage'], Pyke: ['Support'] };
  function demoProfilExtras(person, liste) {
    const meine = new Set(person.puuids), z = {};
    liste.forEach((m) => m.p.forEach((x) => { if (meine.has(x.u)) z[x.c] = (z[x.c] || 0) + 1; }));
    const r2 = rnd(person.name.length * 104729);
    const mastery = Object.entries(z).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, n]) => { const p = Math.round(n * 9000 + 30000 + r2() * 40000); return { c, p, l: Math.max(5, Math.floor(p / 11000)) }; });
    const lpVerlauf = [];
    (person.accounts || []).forEach((a) => { const r = a.rang && a.rang.solo; if (!r) return; let lp = r.lp - 40;
      for (let i = 0; i < 12; i++) { lp = Math.max(0, Math.min(99, lp + Math.round((r2() - 0.42) * 30))); lpVerlauf.push({ acc: a.riotId, t: jetzt() - (12 - i) * 2.5 * 864e5, q: 'solo', tier: r.tier, div: r.div, lp: i === 11 ? r.lp : lp }); } });
    return { mastery, lpVerlauf };
  }
  let demoCache = null;
  function demo() {
    if (demoCache) return demoCache;
    const r = rnd(20260515);
    const wahl = (l) => l[Math.floor(r() * l.length)];
    const LEUTE = [
      { id: 'demo-philip', name: 'Philip', accounts: [['flip yo#meep', 'euw1', 'demo-p1', { tier: 'GOLD', div: 'II', lp: 47, w: 61, l: 55 }], ['meep smurf#EUW', 'euw1', 'demo-p2', { tier: 'PLATINUM', div: 'IV', lp: 12, w: 30, l: 22 }]],
        rollen: { JUNGLE: 0.07, MIDDLE: 0.02, TOP: -0.03, BOTTOM: -0.06, UTILITY: -0.02 }, lieblinge: ['Viego', 'LeeSin', 'Sylas', 'Ahri'] },
      { id: 'demo-max', name: 'Max', accounts: [['MaxPower#EUW', 'euw1', 'demo-m1', { tier: 'SILVER', div: 'I', lp: 88, w: 40, l: 38 }]], rollen: { TOP: 0.06, JUNGLE: -0.02, MIDDLE: -0.04, BOTTOM: 0, UTILITY: -0.05 }, lieblinge: ['Darius', 'Sett', 'Garen'] },
      { id: 'demo-lena', name: 'Lena', accounts: [['Lenchen#1337', 'euw1', 'demo-l1', { tier: 'GOLD', div: 'IV', lp: 20, w: 52, l: 47 }]], rollen: { MIDDLE: 0.08, UTILITY: 0.03, BOTTOM: -0.02, TOP: -0.06, JUNGLE: -0.05 }, lieblinge: ['Ahri', 'Lux', 'Orianna', 'Lulu'] },
      { id: 'demo-tom', name: 'Tom', accounts: [['Tomahawk#EUW', 'euw1', 'demo-t1', { tier: 'SILVER', div: 'III', lp: 33, w: 25, l: 31 }]], rollen: { BOTTOM: 0.05, MIDDLE: -0.02, TOP: -0.01, JUNGLE: -0.06, UTILITY: 0 }, lieblinge: ['Jinx', 'Kaisa', 'Ezreal'] },
      { id: 'demo-sarah', name: 'Sarah', accounts: [['Sarahstrasza#EUW', 'euw1', 'demo-s1', { tier: 'GOLD', div: 'III', lp: 65, w: 44, l: 36 }]], rollen: { UTILITY: 0.09, BOTTOM: 0.01, MIDDLE: -0.03, TOP: -0.07, JUNGLE: -0.04 }, lieblinge: ['Thresh', 'Nami', 'Leona'] },
    ];
    const SYNERGIE = { 'demo-lena|demo-philip': 0.09, 'demo-sarah|demo-tom': 0.08, 'demo-max|demo-tom': -0.08, 'demo-max|demo-philip': 0.03 };
    const FREMDE = ['Shadowfang', 'xXSlayerXx', 'Bäckerjunge', 'KekW', 'Tiltproof', 'NoFlash4U', 'Gankster', 'Wardo', 'Botlaner99', 'Rotbart', 'Nebelkatze', 'Blitzkrieg', 'CS Andy', 'OneTrick'];
    const spl = [], start = jetzt() - 60 * 864e5;
    for (let n = 0; n < 420; n++) {
      const gruppe = LEUTE.slice().sort(() => r() - 0.5).slice(0, r() < 0.35 ? 1 : r() < 0.6 ? 2 : r() < 0.85 ? 3 : 4);
      const q = wahl([420, 420, 440, 440, 400, 400, 490, 450]), aram = q === 450;
      const freieRollen = ROLLEN.slice(); const belegt = {};
      gruppe.slice().sort((a, b) => Math.max(...Object.values(b.rollen)) - Math.max(...Object.values(a.rollen))).forEach((p) => {
        const sortiert = freieRollen.slice().sort((a, b) => p.rollen[b] - p.rollen[a]);
        const rolle = r() < 0.62 ? sortiert[0] : r() < 0.6 && sortiert[1] ? sortiert[1] : wahl(sortiert);
        belegt[p.id] = rolle; freieRollen.splice(freieRollen.indexOf(rolle), 1);
      });
      let chance = 0.49; gruppe.forEach((p) => { chance += aram ? 0 : p.rollen[belegt[p.id]] * 0.8; });
      for (let i = 0; i < gruppe.length; i++) for (let j = i + 1; j < gruppe.length; j++) chance += (SYNERGIE[[gruppe[i].id, gruppe[j].id].sort().join('|')] || 0) * 0.7;
      const sieg = r() < Math.max(0.15, Math.min(0.85, chance)), dauer = 1200 + Math.floor(r() * 1200), p = [];
      const genommen = new Set();
      const champ = (rolle, lieblinge) => { let c; for (let v = 0; v < 20; v++) { c = lieblinge && r() < 0.55 ? wahl(lieblinge.filter((x) => aram || POOL[rolle].includes(x)).concat(POOL[rolle].slice(0, 2))) : wahl(aram ? Object.values(POOL).flat() : POOL[rolle]); if (!genommen.has(c)) break; } genommen.add(c); return c; };
      ROLLEN.forEach((rolle, idx) => {
        for (const tm of [100, 200]) {
          const ich = tm === 100 && gruppe.find((x) => belegt[x.id] === rolle);
          const w = tm === 100 ? sieg : !sieg, k = Math.floor(r() * (w ? 11 : 7)), de = Math.floor(r() * (w ? 6 : 9)), a = Math.floor(r() * 14);
          const acc = ich ? ich.accounts[Math.floor(r() * ich.accounts.length)] : null;
          p.push({ u: acc ? acc[2] : 'fremd-' + n + '-' + tm + idx, n: acc ? acc[0] : wahl(FREMDE) + '#' + (1000 + Math.floor(r() * 9000)), c: champ(rolle, ich && ich.lieblinge), r: aram ? '' : rolle, tm, w,
            k: ich ? Math.max(0, k + Math.round(ich.rollen[rolle] * 40)) : k, de, a, cs: rolle === 'UTILITY' ? 20 + Math.floor(r() * 30) : Math.floor((dauer / 60) * (5 + r() * 3)), g: 8000 + Math.floor(r() * 7000), s: 9000 + Math.floor(r() * 25000), vs: Math.floor(r() * 60), it: [3031, 3006, 6672, 3036, 3072, 3094, 3340].map((v, i) => (i < 6 && r() < 0.2 ? 0 : v)).map((v, i) => (rolle === 'UTILITY' && i < 3 ? [3853, 3158, 3190][i] : v)) });
        }
      });
      for (const tm of [100, 200]) { const kills = p.filter((x) => x.tm === tm).reduce((x, y) => x + y.k, 0); p.forEach((x) => { if (x.tm === tm) x.a = Math.min(x.a, Math.max(0, kills - x.k)); }); }
      { const r2 = rnd(7919 * (n + 1)), w2 = (l) => l[Math.floor(r2() * l.length)];
        p.forEach((x) => {
          const rolle = x.r || ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'][Math.floor(r2() * 5)];
          x.sp = [4, { TOP: w2([12, 14]), JUNGLE: 11, MIDDLE: w2([14, 12, 21]), BOTTOM: w2([7, 21]), UTILITY: w2([14, 3]) }[rolle]];
          x.ru = [w2(DEMO_RUNEN[rolle]), w2([8000, 8100, 8200, 8300, 8400])];
          x.cl = Math.min(18, Math.round(dauer / 120) + Math.floor(r2() * 4) - (rolle === 'UTILITY' ? 2 : 0));
          const pool = DEMO_ITEMS[rolle].slice().sort(() => r2() - 0.5), anzahl = Math.min(6, Math.round(dauer / 420) + Math.floor(r2() * 2));
          x.it = [0, 1, 2, 3, 4, 5].map((i) => (i < anzahl ? pool[i] : 0)).concat(rolle === 'UTILITY' ? 3364 : 3340);
          x.vs = rolle === 'UTILITY' ? 40 + Math.floor(r2() * 50) : 10 + Math.floor(r2() * 25);
        }); }
      // Kevin ist kein Eintrag, spielt aber oft mit (für „automatisch erkannte Mitspieler“) – ersetzt einen fremden Mitspieler
      if (n % 5 === 0) { const f = p.find((x) => x.tm === 100 && String(x.u).startsWith('fremd-')); if (f) { f.u = 'demo-k1'; f.n = 'KevKev#EUW'; } }
      spl.push({ id: 'DEMO_' + n, t: start + n * (60 * 864e5 / 420) + Math.floor(r() * 3e6), d: dauer, q, v: '15.10', p });
    }
    const personen = LEUTE.map((p) => ({ id: p.id, name: p.name, ich: false, puuids: p.accounts.map((a) => a[2]),
      accounts: p.accounts.map(([riotId, region, u, rang]) => ({ riotId, region, regionName: REGIONEN[region][0], icon: 4000 + Math.floor(r() * 900), level: 100 + Math.floor(r() * 300), rang: { solo: rang } })) }));
    demoCache = { personen, spiele: spl };
    return demoCache;
  }

  // echte Personen aus den Einträgen
  function echtePersonen(k) {
    return Object.entries(zustand.personen).filter(([, l]) => l.length).map(([konto, l]) => ({
      id: konto, name: personName(konto), ich: konto === k, gast: istGast(konto),
      puuids: l.map((x) => x.puuid).filter(Boolean),
      accounts: l.map((x) => { const a = (x.puuid && zustand.accounts[x.puuid]) || {}; return { darf: darf(k, konto, x), riotId: x.riotId, region: x.region, regionName: (REGIONEN[x.region] || [x.region])[0], icon: a.icon || null, level: a.level || null, rang: a.rang || null, geholt: a.geholt || null, fehler: x.fehler || null, wartet: !x.puuid && !x.fehler }; }),
    }));
  }

  // ---------- Bilder (Data Dragon, zwischengespeichert) ----------
  let ddVersion = null, ddZeit = 0;
  const STANDARD_BILD = async (url) => { const r = await fetch(url, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(String(r.status)); return Buffer.from(await r.arrayBuffer()); };
  const bild = bildHolen || STANDARD_BILD;
  async function ddragon() {
    if (ddVersion && jetzt() - ddZeit < 864e5) return ddVersion;
    try { ddVersion = JSON.parse((await bild('https://ddragon.leagueoflegends.com/api/versions.json')).toString())[0]; ddZeit = jetzt(); } catch (e) { ddVersion = ddVersion || '15.10.1'; }
    return ddVersion;
  }

  let champMap = lies('champs.json', null);
  async function champNamen() {
    if (champMap && champMap._v === ddVersion && jetzt() - (champMap._t || 0) < 7 * 864e5) return champMap;
    try {
      const v = await ddragon(), j = JSON.parse((await bild('https://ddragon.leagueoflegends.com/cdn/' + v + '/data/en_US/champion.json')).toString());
      const m = { _v: v, _t: jetzt(), _tags: {} }; Object.values(j.data || {}).forEach((c) => { m[c.key] = c.id; m._tags[c.id] = c.tags || []; });
      champMap = m; schreib('champs.json', m);
    } catch (e) { champMap = champMap || {}; }
    return champMap;
  }

  let ddKarten = lies('dd-karten.json', null);   // Zauber-Nummer → Bilddatei, Runen-Nummer → Bildpfad
  async function karten() {
    if (ddKarten && ddKarten._v === ddVersion && jetzt() - (ddKarten._t || 0) < 7 * 864e5) return ddKarten;
    try {
      const v = await ddragon(), k = { _v: v, _t: jetzt(), spell: {}, rune: {} };
      const sp = JSON.parse((await bild('https://ddragon.leagueoflegends.com/cdn/' + v + '/data/en_US/summoner.json')).toString());
      Object.values(sp.data || {}).forEach((x) => { k.spell[x.key] = x.image && x.image.full; });
      const ru = JSON.parse((await bild('https://ddragon.leagueoflegends.com/cdn/' + v + '/data/en_US/runesReforged.json')).toString());
      (ru || []).forEach((st) => { k.rune[st.id] = st.icon; (st.slots || []).forEach((sl) => (sl.runes || []).forEach((r) => { k.rune[r.id] = r.icon; })); });
      ddKarten = k; schreib('dd-karten.json', k);
    } catch (e) { ddKarten = ddKarten || { spell: {}, rune: {} }; }
    return ddKarten;
  }

  // ---------- Prime League ----------
  const prime = erstellePrime({ zustand, spiele, riot, regional, plattform, kompakt, speichern, sofortSpeichern, senden, koerper, jetzt, protokoll, champNamen, demoPool: POOL, rnd, holen: (id) => allesHolen('prime:' + id).catch(() => {}) });

  // ---------- Anfragen ----------
  const letzteAktualisierung = {};
  const manuelleLaeufe = new Map();
  async function anfrage(weg, m, req, res, url, k) {
    if (weg === '/lol/daten' && m === 'GET') {
      const filter = FILTER[url.searchParams.get('filter')] ? url.searchParams.get('filter') : 'alle';
      const echt = echtePersonen(k), echteSpiele = Object.values(spiele);
      const nutzeEcht = !!key() && echteSpiele.length > 0;
      const quelle = nutzeEcht ? { personen: echt, spiele: echteSpiele } : demo();
      const vollstaendigeTeams = filter === 'flex' && url.searchParams.get('gruppe') === '5';
      const a = auswerten(quelle.personen.concat(autoMitspieler(quelle.personen, quelle.spiele)), quelle.spiele, filter, vollstaendigeTeams);
      return senden(res, 200, Object.assign(a, { quelle: nutzeEcht ? 'riot' : 'demo', key: key() ? keyStatus : 'fehlt', filter,
        mayhemVerfuegbar: nutzeEcht && echteSpiele.some((m) => m.d >= 300 && aramArt(m) === 'mayhem'), laeuft, letzterLauf: letzterLauf || null,
        ichId: k, ausgeblendet: Object.keys(zustand.ausgeblendet || {}).length, meine: (echt.find((p) => p.ich) || { accounts: [] }).accounts, alle: echt.map((p) => ({ id: p.id, name: p.name, ich: p.ich, gast: p.gast, accounts: p.accounts })),
        wahl: konten().filter((x) => x.id !== k).map((x) => ({ id: x.id, name: x.name })).concat(Object.entries(zustand.gaeste).map(([id, name]) => ({ id, name, gast: true }))).sort((x, y) => x.name.localeCompare(y.name, 'de')), regionen: Object.fromEntries(Object.entries(REGIONEN).map(([x, v]) => [x, v[0]])), ddragon: await ddragon(), version }));
    }
    if (weg === '/lol/person' && m === 'GET') {
      const filter = FILTER[url.searchParams.get('filter')] ? url.searchParams.get('filter') : 'alle', id = String(url.searchParams.get('id') || '');
      const echt = echtePersonen(k), echteSpiele = Object.values(spiele);
      // Rang und Meisterschaft sind unabhängig vom Spielverlauf verfügbar.
      const nutzeEcht = !!key() && (echteSpiele.length > 0 || echt.some((p) => p.id === id && p.puuids.length));
      const quelle = nutzeEcht ? { personen: echt, spiele: echteSpiele } : demo();
      const alle = quelle.personen.concat(autoMitspieler(quelle.personen, quelle.spiele)), person = alle.find((p) => p.id === id);
      if (!person) return senden(res, 404, { fehler: 'Diese Person gibt es nicht.' });
      const vonPuuid = {}; alle.forEach((p) => p.puuids.forEach((u) => { vonPuuid[u] = { id: p.id, name: p.name }; }));
      const namen = await champNamen();
      let mastery = [], lpVerlauf = [];
      if (nutzeEcht) {
        const summe = {};
        person.puuids.forEach((u) => ((zustand.accounts[u] || {}).mastery || []).forEach((x) => { const n = namen[x.id] || String(x.id), e = (summe[n] = summe[n] || { c: n, p: 0, l: 0 }); e.p += x.p; e.l = Math.max(e.l, x.l); }));
        mastery = Object.values(summe).sort((a, b) => b.p - a.p).slice(0, 8);
        person.puuids.forEach((u) => { const a = zustand.accounts[u] || {}; (a.lp || []).forEach((x) => lpVerlauf.push(Object.assign({ acc: a.riotId }, x))); });
      } else ({ mastery, lpVerlauf } = demoProfilExtras(person, quelle.spiele));
      const ergebnis = profil({ person, liste: quelle.spiele, passt: (m) => passtFilter(filter, m), queueName: queueText, personVonPuuid: vonPuuid, mastery, lpVerlauf, champTags: Object.assign({}, DEMO_TAGS, namen._tags || {}) });
      return senden(res, 200, Object.assign(ergebnis, { quelle: nutzeEcht ? 'riot' : 'demo', auto: !!person.auto }));
    }
    if (weg === '/lol/account' && m === 'POST') {
      const b = await koerper(req), riotId = String(b.riotId || '').trim().replace(/\s*#\s*/, '#'), region = String(b.region || 'euw1');
      if (!RIOT_ID.test(riotId)) return senden(res, 400, { fehler: 'Bitte die Riot-ID als Name#Tag eintragen (z. B. flip yo#meep).' });
      if (!REGIONEN[region]) return senden(res, 400, { fehler: 'Unbekannte Region.' });
      let fuer = k;
      if (b.neuName) { fuer = gastAnlegen(b.neuName); if (!fuer) return senden(res, 400, { fehler: 'Bitte einen Namen mit 2–24 Zeichen eingeben.' }); }
      else if (b.fuer && b.fuer !== k) { if (!gibtPerson(String(b.fuer))) return senden(res, 404, { fehler: 'Diese Person gibt es nicht.' }); fuer = String(b.fuer); }
      const liste = zustand.personen[fuer] || [];
      if (liste.length >= 8) return senden(res, 400, { fehler: 'Höchstens 8 Accounts pro Person.' });
      const gleich = (x) => x.riotId.toLowerCase() === riotId.toLowerCase() && x.region === region;
      const schonBei = Object.entries(zustand.personen).find(([, l]) => l.some(gleich));
      if (schonBei) { aufraeumen(); return senden(res, 409, { fehler: schonBei[0] === fuer ? 'Ist schon eingetragen.' : 'Diesen Account hat schon ' + personName(schonBei[0]) + ' – bei Bedarf unter „Alle Accounts“ umhängen.' }); }
      const acc = { riotId, region, puuid: null, hinzu: jetzt(), von: k };
      if (key() && keyStatus !== 'ungueltig') {
        try {
          const [name, tag] = riotId.split('#');
          const r = await riot(regional(region) + '/riot/account/v1/accounts/by-riot-id/' + encodeURIComponent(name) + '/' + encodeURIComponent(tag));
          if (r.status === 404) { aufraeumen(); return senden(res, 404, { fehler: 'Diesen Riot-Account gibt es nicht – Schreibweise, Tag und Region prüfen.' }); }
          if (r.status === 200) { acc.puuid = r.json.puuid; acc.riotId = r.json.gameName + '#' + r.json.tagLine; }
          if (acc.puuid && Object.values(zustand.personen).some((l) => l.some((x) => x.puuid === acc.puuid))) { aufraeumen(); return senden(res, 409, { fehler: 'Diesen Account hat schon jemand eingetragen.' }); }
        } catch (e) { /* Key-Problem: trotzdem merken, wird später geprüft */ }
      }
      liste.push(acc); zustand.personen[fuer] = liste; sofortSpeichern();
      protokoll('LoL: ' + (kontoName(k) || k) + ' hat ' + acc.riotId + ' eingetragen' + (fuer !== k ? ' (für ' + personName(fuer) + ')' : ''));
      if (acc.puuid) allesHolen(fuer).catch(() => {});
      return senden(res, 200, { account: acc.riotId, wartet: !acc.puuid, person: personName(fuer) });
    }
    if (weg === '/lol/account/entfernen' && m === 'POST') {
      const b = await koerper(req), riotId = String(b.riotId || '').toLowerCase(), person = b.person ? String(b.person) : k, liste = zustand.personen[person] || [];
      const acc = liste.find((x) => x.riotId.toLowerCase() === riotId);
      if (!acc) return senden(res, 404, { fehler: 'Account nicht gefunden.' });
      if (!darf(k, person, acc)) return senden(res, 403, { fehler: 'Das darf nur ' + personName(person) + ' selbst (oder wer ihn eingetragen hat).' });
      zustand.personen[person] = liste.filter((x) => x !== acc); aufraeumen();
      sofortSpeichern(); return senden(res, 200, {});
    }
    if (weg === '/lol/account/zuordnen' && m === 'POST') {
      const b = await koerper(req), riotId = String(b.riotId || '').toLowerCase(), von = String(b.person || k), liste = zustand.personen[von] || [];
      const acc = liste.find((x) => x.riotId.toLowerCase() === riotId);
      if (!acc) return senden(res, 404, { fehler: 'Account nicht gefunden.' });
      if (!darf(k, von, acc)) return senden(res, 403, { fehler: 'Das darf nur ' + personName(von) + ' selbst (oder wer ihn eingetragen hat).' });
      let nach = String(b.nach || '');
      if (b.neuName) { nach = gastAnlegen(b.neuName); if (!nach) return senden(res, 400, { fehler: 'Bitte einen Namen mit 2–24 Zeichen eingeben.' }); }
      else if (!gibtPerson(nach)) return senden(res, 404, { fehler: 'Diese Person gibt es nicht.' });
      if (nach === von) return senden(res, 200, {});
      const ziel = zustand.personen[nach] || [];
      if (ziel.length >= 8) { aufraeumen(); return senden(res, 400, { fehler: 'Höchstens 8 Accounts pro Person.' }); }
      zustand.personen[von] = liste.filter((x) => x !== acc); ziel.push(acc); zustand.personen[nach] = ziel; aufraeumen();
      sofortSpeichern(); protokoll('LoL: ' + acc.riotId + ' → ' + personName(nach));
      return senden(res, 200, { person: personName(nach) });
    }
    if (weg.startsWith('/lol/prime')) {
      if (weg === '/lol/prime' && m === 'GET') await champNamen();
      return prime.anfrage(weg, m, req, res, k, !!key() && keyStatus !== 'ungueltig');
    }
    if (weg === '/lol/auto/aufnehmen' && m === 'POST') {
      // erkannten Mitspieler fest aufnehmen: wird Person (ohne Konto), ab dann werden alle seine Spiele geholt
      const b = await koerper(req), u = String(b.u || '');
      let n = null, region = 'euw1', t = 0;
      for (const sp of Object.values(spiele)) { const x = sp.p.find((y) => y.u === u); if (x && sp.t > t) { t = sp.t; n = x.n; region = String(sp.id).split('_')[0].toLowerCase(); } }
      if (!n) return senden(res, 404, { fehler: 'Diesen Mitspieler gibt es (noch) nicht in euren echten Spielen.' });
      if (Object.values(zustand.personen).some((l) => l.some((x) => x.puuid === u))) return senden(res, 409, { fehler: 'Ist schon eingetragen.' });
      const fuer = gastAnlegen(String(b.name || n.split('#')[0]).slice(0, 24)) || gastAnlegen('Mitspieler ' + n.slice(0, 8));
      const liste = zustand.personen[fuer] || [];
      if (liste.length >= 8) { aufraeumen(); return senden(res, 400, { fehler: 'Höchstens 8 Accounts pro Person.' }); }
      liste.push({ riotId: n, region: REGIONEN[region] ? region : 'euw1', puuid: u, hinzu: jetzt(), von: k }); zustand.personen[fuer] = liste; sofortSpeichern();
      protokoll('LoL: Mitspieler ' + n + ' aufgenommen'); allesHolen(fuer).catch(() => {});
      return senden(res, 200, { person: personName(fuer) });
    }
    if (weg === '/lol/auto/ausblenden' && m === 'POST') {
      const b = await koerper(req), u = String(b.u || '');
      if (!u) return senden(res, 400, { fehler: 'Wen?' });
      (zustand.ausgeblendet = zustand.ausgeblendet || {})[u] = true; sofortSpeichern();
      return senden(res, 200, {});
    }
    if (weg === '/lol/auto/einblenden' && m === 'POST') { zustand.ausgeblendet = {}; sofortSpeichern(); return senden(res, 200, {}); }
    if (weg === '/lol/aktualisieren' && m === 'GET') {
      return senden(res, 200, manuelleLaeufe.get(k) || { stand: 'unbekannt' });
    }
    if (weg === '/lol/aktualisieren' && m === 'POST') {
      if (!key()) return senden(res, 409, { fehler: 'Es ist noch kein Riot-API-Key eingetragen – bis dahin gibt es Beispieldaten.' });
      if (jetzt() - (letzteAktualisierung[k] || 0) < 120e3) return senden(res, 429, { fehler: 'Gerade erst aktualisiert – versuche es in zwei Minuten erneut.' });
      if (keyStatus === 'ungueltig') return senden(res, 409, { fehler: 'Der Riot-Key muss auf der Server-Seite erneuert werden.' });
      if (!(zustand.personen[k] || []).length) return senden(res, 409, { fehler: 'Verknüpfe zuerst deinen Riot-Account auf der LoL-Seite.' });
      if (laeuft) return senden(res, 409, { fehler: 'Ein Riot-Import läuft bereits. Versuche es gleich noch einmal.' });
      letzteAktualisierung[k] = jetzt();
      manuelleLaeufe.set(k, { stand: 'laeuft' });
      allesHolen(k, true).then((ok) => {
        const konten = zustand.personen[k] || [];
        const fehler = [...new Set(konten.map((acc) => acc.fehler).filter(Boolean))];
        if (ok && konten.length && konten.every((acc) => acc.puuid && !acc.fehler)) {
          manuelleLaeufe.set(k, { stand: 'fertig' });
        } else {
          const meldung = fehler.join(' ') || (keyStatus === 'ungueltig' ? 'Riot hat den API-Key abgelehnt.' : '');
          manuelleLaeufe.set(k, { stand: 'fehler', meldung });
        }
      }, () => manuelleLaeufe.set(k, { stand: 'fehler' }));
      return senden(res, 200, { gestartet: true });
    }
    const bm = /^\/lol\/bild\/(champion|profil|item|spell|rune)\/([A-Za-z0-9]{1,40})\.png$/.exec(weg);
    if (bm && m === 'GET') {
      const datei = path.join(ordner, 'bilder', bm[1] + '-' + bm[2] + '.png');
      let b = null;
      try { b = fs.readFileSync(datei); } catch (e) {
        try {
          const v = await ddragon();
          let url = 'https://ddragon.leagueoflegends.com/cdn/' + v + '/img/' + ({ champion: 'champion/', profil: 'profileicon/', item: 'item/' }[bm[1]]) + bm[2] + '.png';
          if (bm[1] === 'spell' || bm[1] === 'rune') {
            const kt = await karten(), f = kt[bm[1]][bm[2]];
            if (!f || !/^[A-Za-z0-9_\/.-]+\.png$/.test(f)) throw new Error('unbekannt');
            url = bm[1] === 'spell' ? 'https://ddragon.leagueoflegends.com/cdn/' + v + '/img/spell/' + f : 'https://ddragon.leagueoflegends.com/cdn/img/' + f;
          }
          b = await bild(url); fs.writeFileSync(datei, b);
        } catch (x) { b = null; }
      }
      if (!b) return senden(res, 404, { fehler: 'kein Bild' });
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=604800' }); return res.end(b);
    }
    return false;
  }
  async function admin(m, req, res) {
    if (m === 'POST') {
      const b = await koerper(req), neu = String(b.key || '').trim();
      if (neu && !/^RGAPI-[0-9a-f-]{36}$/i.test(neu)) return senden(res, 400, { fehler: 'Das sieht nicht wie ein Riot-Key aus (RGAPI-…).' });
      if (!neu) { fs.rmSync(keyDatei, { force: true }); keyStatus = 'fehlt'; protokoll('LoL: Riot-Key entfernt'); return senden(res, 200, { key: 'fehlt' }); }
      const alt = key(), altStatus = keyStatus;
      fs.writeFileSync(keyDatei, neu); keyStatus = 'unbekannt';
      try {
        const r = await riot(plattform('euw1') + '/lol/status/v4/platform-data');
        if (r.status !== 200) throw new Error(String(r.status));
      } catch (e) {
        if (keyStatus === 'ungueltig') {   // abgelehnt: alten Key (falls es einen gab) behalten
          if (alt) fs.writeFileSync(keyDatei, alt); else fs.rmSync(keyDatei, { force: true });
          keyStatus = alt ? altStatus : 'fehlt';
          return senden(res, 400, { fehler: 'Riot lehnt den Key ab – abgelaufen oder vertippt?' });
        }
      }
      if (alt && alt !== neu) {
        // Riot verschlüsselt PUUIDs pro Key: mit neuem Key alles neu zuordnen (Accounts neu auflösen, Spiele neu holen)
        Object.values(zustand.personen).forEach((l) => l.forEach((x) => { x.puuid = null; delete x.fehler; }));
        zustand.accounts = {}; privateSpiele.clear(); for (const id of Object.keys(spiele)) delete spiele[id]; prime.zuruecksetzen(); sofortSpeichern();
      }
      protokoll('LoL: Riot-Key eingetragen'); allesHolen().catch(() => {});
      return senden(res, 200, { key: keyStatus });
    }
    const acc = Object.values(zustand.personen).reduce((a, l) => a + l.length, 0);
    const gruppen = new Map();
    for (const { q, gm, mp } of Object.values(spiele)) {
      const queueId = q ?? null, gameMode = gm || null, mapId = mp || null;
      const gruppe = JSON.stringify([queueId, gameMode, mapId]);
      if (!gruppen.has(gruppe)) gruppen.set(gruppe, { queueId, gameMode, mapId, anzahl: 0 });
      gruppen.get(gruppe).anzahl++;
    }
    const spielModi = [...gruppen.values()].sort((a, b) => b.anzahl - a.anzahl || a.queueId - b.queueId);
    return senden(res, 200, { key: key() ? keyStatus : 'fehlt', accounts: acc, spiele: Object.keys(spiele).length, spielModi, letzterLauf: letzterLauf || null, laeuft });
  }
  function kontoEntfernen(k) { if (zustand.personen[k]) { delete zustand.personen[k]; sofortSpeichern(); } }
  function schliessen() { if (uhr) clearInterval(uhr); clearTimeout(speichernUhr); }
  return { anfrage, admin, kontoEntfernen, schliessen, allesHolen, _demo: demo, _auswerten: auswerten };
}
module.exports = { erstelleLol, REGIONEN, ROLLEN };
