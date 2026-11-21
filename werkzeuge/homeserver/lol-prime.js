// LoL-Zentrale · Prime League: Teams beobachten und ihre Drafts auswerten (wird von lol.js geladen)
//
// • Teams legt man per Hand an: Name + Spielerliste (einfach den Kader von primeleague.gg kopieren und einfügen – die
//   Riot-IDs werden herausgesucht). primeleague.gg selbst wird NICHT abgefragt (Bot-Schutz, kein offizieller Zugang).
// • Die Spiele kommen von Riot: Prime-League-Spiele laufen über Turniercodes → match-v5 „type=tourney“ je Spieler.
//   Dazu je Spieler die Top-Champions nach Mastery (champion-mastery-v4) – zeigt den Champion-Pool auch außerhalb der Liga.
// • Auswertung: je Team Bilanz, Seiten, Champions (gewinnt mit …), Spieler-Pools, Bans (von / gegen), letzte Drafts;
//   über alle Spiele: Meta (Pick/Ban/Winrate), Lane-Matchups je Rolle, Champion gegen Champion, Synergien.
//   Den Draft-Helfer rechnet die Seite selbst aus diesen Zahlen.
//
// Schnittstellen (nur Angemeldete):
//   GET  /api/lol/prime                       → { quelle, teams, meta, champs, … }
//   POST /api/lol/prime/team                  { name, kurz?, text }  → Team anlegen (Riot-IDs aus dem Text)
//   POST /api/lol/prime/team/aendern          { id, name?, kurz?, text? }
//   POST /api/lol/prime/team/entfernen        { id }
'use strict';

const RIOT_ID_IM_TEXT = /([^\t\n\r#|·,;]{3,40})#([A-Za-z0-9]{2,5})(?![A-Za-z0-9])/gu;

// Riot-IDs aus eingefügtem Text (z. B. Kader von primeleague.gg): je Fundstelle die letzten Wörter vor dem # (max. 16 Zeichen)
function riotIdsAusText(text) {
  const roh = [];
  for (const zeile of String(text || '').split(/\r?\n/)) {
    for (const m of zeile.matchAll(RIOT_ID_IM_TEXT)) {
      const alle = m[1].trim().split(/\s+/), w = [];   // so viele Wörter vom Ende, wie in 16 Zeichen passen
      while (alle.length && (alle[alle.length - 1] + (w.length ? ' ' + w.join(' ') : '')).length <= 16) w.unshift(alle.pop());
      while (w.length > 1 && /[:：]$/.test(w[0])) w.shift();   // „Top: Name#Tag“ → Bezeichnung weg
      if (w.join(' ').length >= 3) roh.push({ w, tag: m[2] });
    }
  }
  // Steht bei den meisten dasselbe Wort (Team-Kürzel wie „InP“) – dann alles davor abschneiden (Anzeigenamen der Seite)
  const z = {}; roh.forEach((x) => new Set(x.w).forEach((wort) => { z[wort] = (z[wort] || 0) + 1; }));
  const kuerzel = Object.entries(z).filter(([, n]) => n >= 2 && n >= roh.length / 2).sort((a, b) => b[1] - a[1])[0];
  const ids = [], gesehen = new Set();
  for (const x of roh) {
    const i = kuerzel ? x.w.indexOf(kuerzel[0]) : -1, name = (i > 0 ? x.w.slice(i) : x.w).join(' ');
    if (name.length < 3) continue;
    const id = name + '#' + x.tag;
    if (!gesehen.has(id.toLowerCase())) { gesehen.add(id.toLowerCase()); ids.push(id); }
  }
  return ids.slice(0, 12);
}

function erstellePrime({ zustand, spiele, riot, regional, plattform, kompakt, speichern, sofortSpeichern, senden, koerper, jetzt, protokoll, champNamen, demoPool, rnd, holen = () => {} }) {
  let namen = {};   // Champion-Nummer → Name (für Bans aus echten Spielen)
  const cn = (c) => (typeof c === 'number' ? namen[c] || String(c) : c);
  zustand.pl = zustand.pl || { teams: {}, ids: [], mastery: {} };
  const pl = zustand.pl;
  pl.teams = pl.teams || {}; pl.ids = pl.ids || []; pl.mastery = pl.mastery || {};

  // ---------- Holen ----------
  async function teamHolen(team) {
    const namen = await champNamen();
    for (const s of team.spieler) {
      if (s.geholt && jetzt() - s.geholt < 6 * 3600e3) continue;   // Liga-Spiele sind wöchentlich: höchstens alle 6 Std. nachsehen
      try {
        if (!s.puuid) {
          const [name, tag] = s.riotId.split('#');
          const r = await riot(regional('euw1') + '/riot/account/v1/accounts/by-riot-id/' + encodeURIComponent(name) + '/' + encodeURIComponent(tag));
          if (r.status === 404) { s.fehler = 'gibt es nicht'; continue; }
          if (r.status !== 200) continue;
          s.puuid = r.json.puuid; s.riotId = r.json.gameName + '#' + r.json.tagLine; delete s.fehler;
        }
        const ms = s.mastery && jetzt() - s.mastery < 864e5 ? null : await riot(plattform('euw1') + '/lol/champion-mastery/v4/champion-masteries/by-puuid/' + s.puuid + '/top?count=10');
        if (ms && ms.status === 200) s.mastery = jetzt();
        if (ms && ms.status === 200) pl.mastery[s.puuid] = (ms.json || []).map((x) => ({ c: namen[x.championId] || String(x.championId), p: x.championPoints, l: x.championLevel }));
        const ids = await riot(regional('euw1') + '/lol/match/v5/matches/by-puuid/' + s.puuid + '/ids?type=tourney&start=0&count=' + (s.geholt ? 20 : 60));
        if (ids.status !== 200) continue;
        for (const id of ids.json || []) {
          if (!pl.ids.includes(id)) pl.ids.push(id);
          if (spiele[id]) continue;
          const m = await riot(regional('euw1') + '/lol/match/v5/matches/' + id);
          if (m.status === 200 && m.json && m.json.info) spiele[id] = kompakt(m.json);
        }
        s.geholt = jetzt();
      } catch (e) { if (e.status === 401 || e.status === 403) throw e; s.fehler = e.message; }
    }
    team.geholt = jetzt(); speichern();
  }
  async function allesHolen(nurTeam) {
    for (const t of Object.values(pl.teams)) if (!nurTeam || t.id === nurTeam) await teamHolen(t);
  }

  // ---------- Auswertung ----------
  function auswerten(teams, liste, mastery) {
    const champ = {}, matchup = {}, gegen = {}, synergie = {}, n = liste.length;
    const zaehl = (o, k, w) => { const e = (o[k] = o[k] || [0, 0]); e[0]++; if (w) e[1]++; };
    const T = {};
    teams.forEach((t) => { T[t.id] = { id: t.id, name: t.name, kurz: t.kurz || '', spieler: t.spieler.map((s) => ({ riotId: s.riotId, fehler: s.fehler || null, u: s.puuid, champs: {}, rollen: {}, g: 0, w: 0 })),
      g: 0, w: 0, blau: [0, 0], rot: [0, 0], champs: {}, bans: {}, gebannt: {}, drafts: [], dauer: 0 }; });
    const seiteVon = (m, t) => { const u = new Set(t.spieler.map((s) => s.puuid).filter(Boolean)); for (const tm of [100, 200]) if (m.p.filter((x) => x.tm === tm && u.has(x.u)).length >= 3) return tm; return 0; };
    for (const m of liste.slice().sort((a, b) => b.t - a.t)) {
      const seiten = { 100: m.p.filter((x) => x.tm === 100), 200: m.p.filter((x) => x.tm === 200) }, rb = m.b || {}, bans = { 100: (rb[100] || []).map(cn), 200: (rb[200] || []).map(cn) };
      // Meta
      for (const tm of [100, 200]) {
        for (const x of seiten[tm]) {
          const c = (champ[x.c] = champ[x.c] || { c: x.c, pick: 0, w: 0, ban: 0, rollen: {} }); c.pick++; if (x.w) c.w++; c.rollen[x.r] = (c.rollen[x.r] || 0) + 1;
          const gg = seiten[tm === 100 ? 200 : 100];
          for (const y of gg) { zaehl(gegen, x.c + '|' + y.c, x.w); if (y.r && y.r === x.r) zaehl(matchup, x.r + '|' + x.c + '|' + y.c, x.w); }
          for (const y of seiten[tm]) if (x.c < y.c) zaehl(synergie, x.c + '|' + y.c, x.w);
        }
        for (const c of bans[tm] || []) { const e = (champ[c] = champ[c] || { c, pick: 0, w: 0, ban: 0, rollen: {} }); e.ban++; }
      }
      // Teams
      const dabei = {};
      for (const t of teams) { const s = seiteVon(m, t); if (s) dabei[s] = t; }
      for (const [s, t] of Object.entries(dabei)) {
        const tm = Number(s), x = T[t.id], wir = seiten[tm], die = seiten[tm === 100 ? 200 : 100], w = !!(wir[0] && wir[0].w);
        x.g++; if (w) x.w++; x.dauer += m.d; const sd = tm === 100 ? x.blau : x.rot; sd[0]++; if (w) sd[1]++;
        for (const p of wir) {
          zaehl(x.champs, p.c, w);
          const sp = x.spieler.find((y) => y.u === p.u);
          if (sp) { sp.g++; if (w) sp.w++; zaehl(sp.champs, p.c, w); sp.rollen[p.r] = (sp.rollen[p.r] || 0) + 1; }
        }
        (bans[tm] || []).forEach((c) => { x.bans[c] = (x.bans[c] || 0) + 1; });
        (bans[tm === 100 ? 200 : 100] || []).forEach((c) => { x.gebannt[c] = (x.gebannt[c] || 0) + 1; });
        const gegner = dabei[tm === 100 ? 200 : 100];
        if (x.drafts.length < 25) x.drafts.push({ id: m.id, t: m.t, d: m.d, seite: tm === 100 ? 'blau' : 'rot', w, gegner: gegner ? gegner.name : null,
          gegnerSpieler: gegner ? null : die.slice(0, 2).map((y) => y.n),
          wir: wir.map((y) => ({ c: y.c, r: y.r, n: y.n })), die: die.map((y) => ({ c: y.c, r: y.r })), bansWir: bans[tm] || [], bansDie: bans[tm === 100 ? 200 : 100] || [] });
      }
    }
    const sortiert = (o) => Object.entries(o).map(([c, [g, w]]) => ({ c, g, w })).sort((a, b) => b.g - a.g || b.w - a.w);
    const zahl = (o) => Object.entries(o).map(([c, g]) => ({ c, g })).sort((a, b) => b.g - a.g);
    const teamsAus = Object.values(T).map((x) => ({ id: x.id, name: x.name, kurz: x.kurz, g: x.g, w: x.w, blau: x.blau, rot: x.rot, dauer: x.g ? Math.round(x.dauer / x.g) : 0,
      champs: sortiert(x.champs), bans: zahl(x.bans).slice(0, 12), gebannt: zahl(x.gebannt).slice(0, 12), drafts: x.drafts,
      spieler: x.spieler.map((s) => ({ riotId: s.riotId, fehler: s.fehler, g: s.g, w: s.w, rolle: (Object.entries(s.rollen).sort((a, b) => b[1] - a[1])[0] || [''])[0],
        champs: sortiert(s.champs).slice(0, 8), mastery: (mastery[s.u] || []).slice(0, 8) })) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const kompaktPaare = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) r[k] = v; return r; };
    return { spiele: n, teams: teamsAus, meta: Object.values(champ).sort((a, b) => b.pick + b.ban - (a.pick + a.ban)), matchup: kompaktPaare(matchup), gegen: kompaktPaare(gegen), synergie: kompaktPaare(synergie) };
  }

  // ---------- Beispieldaten: 6 Teams, 60 Spiele (fest, reproduzierbar) ----------
  let demoCache = null;
  function demo() {
    if (demoCache) return demoCache;
    const r = rnd(424242), wahl = (l) => l[Math.floor(r() * l.length)];
    const ROLLEN = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
    const NAMEN = [['Eintracht Esports', 'EIN'], ['Rheinwerk Gaming', 'RWG'], ['Nordlicht', 'NRD'], ['Alpenfuchs', 'APF'], ['Kölner Kraken', 'KÖK'], ['Bavarian Byte', 'BVB']];
    const teams = NAMEN.map(([name, kurz], ti) => ({ id: 'demo-' + kurz.toLowerCase(), name, kurz, staerke: [0.08, 0.04, 0.02, -0.01, -0.04, -0.07][ti],
      spieler: ROLLEN.map((rolle, ri) => ({ riotId: kurz + ' ' + ['Top', 'Jgl', 'Mid', 'Adc', 'Sup'][ri] + '#PL' + (ti + 1), puuid: 'demo-pl-' + ti + '-' + ri, rolle,
        pool: demoPool[rolle].slice().sort(() => r() - 0.5).slice(0, 4) })) }));
    const mastery = {};
    teams.forEach((t) => t.spieler.forEach((s) => { mastery[s.puuid] = s.pool.concat(wahl(Object.values(demoPool).flat())).map((c, i) => ({ c, p: Math.round(420000 / (i + 1) + r() * 40000), l: 10 })); }));
    // kleine „Wahrheit“ für Matchups, damit Konter sichtbar werden
    const KONTER = { 'Darius|Garen': 0.12, 'Fiora|Sett': 0.1, 'Viego|Amumu': 0.08, 'Ahri|Lux': 0.1, 'Sylas|Orianna': 0.09, 'Jinx|Ezreal': 0.08, 'Leona|Lulu': 0.1, 'Nautilus|Nami': 0.08 };
    const BANBAR = Object.values(demoPool).flat();
    const liste = [], start = jetzt() - 70 * 864e5;
    for (let n = 0; n < 60; n++) {
      const a = teams[n % 6], b = teams[(n % 6 + 1 + (Math.floor(n / 6) % 5)) % 6];
      const blau = r() < 0.5 ? a : b, rot = blau === a ? b : a, genommen = new Set(), bans = { 100: [], 200: [] };
      for (const tm of [100, 200]) for (let i = 0; i < 5; i++) { let c; do c = wahl(BANBAR); while (genommen.has(c)); genommen.add(c); bans[tm].push(c); }
      const picks = { 100: [], 200: [] };
      for (const [tm, t] of [[100, blau], [200, rot]]) for (const s of t.spieler) {
        let c; for (let v = 0; v < 30; v++) { c = r() < 0.75 ? wahl(s.pool) : wahl(demoPool[s.rolle]); if (!genommen.has(c)) break; }
        genommen.add(c); picks[tm].push({ s, c });
      }
      let chance = 0.5 + (blau.staerke - rot.staerke) * 1.6 + 0.03;
      for (let i = 0; i < 5; i++) { const x = picks[100][i].c, y = picks[200][i].c; chance += (KONTER[x + '|' + y] || 0) - (KONTER[y + '|' + x] || 0); }
      const blauSieg = r() < Math.max(0.1, Math.min(0.9, chance)), dauer = 1500 + Math.floor(r() * 900);
      const p = [];
      for (const tm of [100, 200]) picks[tm].forEach(({ s, c }) => { const w = tm === 100 ? blauSieg : !blauSieg; p.push({ u: s.puuid, n: s.riotId, c, r: s.rolle, tm, w, k: Math.floor(r() * (w ? 9 : 5)), de: Math.floor(r() * (w ? 4 : 7)), a: Math.floor(r() * 12), cs: 200, g: 11000, s: 18000, vs: 30, it: [] }); });
      liste.push({ id: 'PLDEMO_' + n, t: start + n * (70 * 864e5 / 60), d: dauer, q: 0, v: '15.10', p, b: bans });
    }
    demoCache = { teams: teams.map((t) => ({ id: t.id, name: t.name, kurz: t.kurz, spieler: t.spieler.map((s) => ({ riotId: s.riotId, puuid: s.puuid })) })), liste, mastery };
    return demoCache;
  }

  // ---------- Anfragen ----------
  async function anfrage(weg, m, req, res, k, hatKey) {
    if (weg === '/lol/prime' && m === 'GET') {
      namen = await champNamen();
      const echt = Object.values(pl.teams), echteSpiele = pl.ids.map((id) => spiele[id]).filter(Boolean);
      const nutzeEcht = hatKey && echt.length > 0 && echteSpiele.length > 0;
      const q = nutzeEcht ? { teams: echt, liste: echteSpiele, mastery: pl.mastery } : demo();
      const a = auswerten(q.teams, q.liste, q.mastery);
      return senden(res, 200, Object.assign(a, { quelle: nutzeEcht ? 'riot' : 'demo', eigeneTeams: echt.map((t) => ({ id: t.id, name: t.name, kurz: t.kurz || '', spieler: t.spieler.map((s) => ({ riotId: s.riotId, fehler: s.fehler || null, ok: !!s.puuid })), geholt: t.geholt || null })) }));
    }
    if (weg === '/lol/prime/team' && m === 'POST') {
      const b = await koerper(req), name = String(b.name || '').trim().replace(/\s+/g, ' ').slice(0, 40), kurz = String(b.kurz || '').trim().slice(0, 6), ids = riotIdsAusText(b.text);
      if (name.length < 2 || /[<>]/.test(name + kurz)) return senden(res, 400, { fehler: 'Bitte einen Teamnamen eingeben.' });
      if (ids.length < 3) return senden(res, 400, { fehler: 'Im Text stehen zu wenige Riot-IDs (Name#Tag) – mindestens 3 Spieler.' });
      if (Object.keys(pl.teams).length >= 40) return senden(res, 400, { fehler: 'Höchstens 40 Teams.' });
      if (Object.values(pl.teams).some((t) => t.name.toLowerCase() === name.toLowerCase())) return senden(res, 409, { fehler: 'Dieses Team gibt es schon.' });
      const id = 't' + jetzt().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
      pl.teams[id] = { id, name, kurz, spieler: ids.map((riotId) => ({ riotId, puuid: null })), von: k, hinzu: jetzt() };
      sofortSpeichern(); protokoll('LoL: Prime-League-Team ' + name + ' angelegt (' + ids.length + ' Spieler)');
      if (hatKey) holen(id);
      return senden(res, 200, { id, spieler: ids, holen: hatKey });
    }
    if (weg === '/lol/prime/team/aendern' && m === 'POST') {
      const b = await koerper(req), t = pl.teams[String(b.id || '')];
      if (!t) return senden(res, 404, { fehler: 'Team nicht gefunden.' });
      if (b.name) { const n = String(b.name).trim().replace(/\s+/g, ' ').slice(0, 40); if (n.length >= 2 && !/[<>]/.test(n)) t.name = n; }
      if (b.kurz !== undefined && !/[<>]/.test(String(b.kurz))) t.kurz = String(b.kurz).trim().slice(0, 6);
      if (b.text !== undefined) {
        const ids = riotIdsAusText(b.text);
        if (ids.length < 3) return senden(res, 400, { fehler: 'Im Text stehen zu wenige Riot-IDs (Name#Tag) – mindestens 3 Spieler.' });
        const alt = new Map(t.spieler.map((s) => [s.riotId.toLowerCase(), s]));
        t.spieler = ids.map((riotId) => alt.get(riotId.toLowerCase()) || { riotId, puuid: null });
        if (hatKey) holen(t.id);
      }
      sofortSpeichern(); return senden(res, 200, { id: t.id });
    }
    if (weg === '/lol/prime/team/entfernen' && m === 'POST') {
      const b = await koerper(req), t = pl.teams[String(b.id || '')];
      if (!t) return senden(res, 404, { fehler: 'Team nicht gefunden.' });
      delete pl.teams[t.id];
      // Spiele, an denen kein beobachtetes Team mehr beteiligt ist, aus der Prime-League-Liste nehmen
      const u = new Set(Object.values(pl.teams).flatMap((x) => x.spieler.map((s) => s.puuid)).filter(Boolean));
      pl.ids = pl.ids.filter((id) => spiele[id] && spiele[id].p.some((x) => u.has(x.u)));
      t.spieler.forEach((s) => { if (s.puuid && !u.has(s.puuid)) delete pl.mastery[s.puuid]; });
      sofortSpeichern(); protokoll('LoL: Prime-League-Team ' + t.name + ' entfernt');
      return senden(res, 200, {});
    }
    return false;
  }
  // nach einem Key-Wechsel: PUUIDs neu auflösen
  function zuruecksetzen() { Object.values(pl.teams).forEach((t) => t.spieler.forEach((s) => { s.puuid = null; delete s.fehler; delete s.geholt; delete s.mastery; })); pl.ids = []; pl.mastery = {}; }
  return { anfrage, allesHolen, zuruecksetzen, _demo: demo, _auswerten: auswerten };
}

module.exports = { erstellePrime, riotIdsAusText };
