// LoL-Zentrale · Spieler-Profil (wie auf op.gg/u.gg, aber für eine Person mit allen ihren Accounts zusammen)
// Wird von lol.js für GET /api/lol/person?id=…&filter=… aufgerufen. Rechnet nur aus schon gespeicherten Spielen –
// keine zusätzlichen Riot-Anfragen (Mastery und Rang-Verlauf holt lol.js beim normalen Abruf mit).
'use strict';

const WOCHENTAG = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short' });
const STUNDE = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: 'numeric', hour12: false });
const TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// eigene Spiel-Bewertung (0–10) für alle 10 Spieler: Kill-Beteiligung, Schaden, Gold, Sicht, KDA
function bewerten(m) {
  const team = { 100: { k: 0, s: 0, g: 0, vs: 0 }, 200: { k: 0, s: 0, g: 0, vs: 0 } };
  m.p.forEach((x) => { const t = team[x.tm]; if (t) { t.k += x.k; t.s += x.s || 0; t.g += x.g || 0; t.vs += x.vs || 0; } });
  const roh = m.p.map((x) => {
    const t = team[x.tm] || { k: 1, s: 1, g: 1, vs: 1 };
    const kp = t.k ? (x.k + x.a) / t.k : 0, sa = t.s ? (x.s || 0) / t.s : 0, ga = t.g ? (x.g || 0) / t.g : 0, va = t.vs ? (x.vs || 0) / t.vs : 0;
    const kda = (x.k + x.a) / Math.max(1, x.de);
    return kp * 3 + sa * 4 + ga * 2 + va * 1.5 + Math.min(kda, 12) * 0.25 - x.de * 0.06 + (x.w ? 0.3 : 0);
  });
  const max = Math.max(...roh), min = Math.min(...roh);
  const note = roh.map((s) => Math.round(((s - min) / Math.max(0.01, max - min)) * 70 + 30) / 10);   // 3,0 … 10,0
  const platz = roh.map((s) => 1 + roh.filter((o) => o > s).length);
  return { note, platz };
}

// kurzes Etikett für das eigene Spiel (höchstens eins, wichtigstes zuerst)
function etikett(m, i, b) {
  const x = m.p[i], gleich = m.p.filter((y) => y.tm === x.tm), min = m.d / 60;
  if (x.de === 0 && x.k + x.a >= 8) return 'Unaufhaltsam';
  if (!x.w && b.platz[i] <= 2) return 'Unschuldig';
  if ((x.s || 0) === Math.max(...m.p.map((y) => y.s || 0))) return 'Schadenskönig';
  if ((x.vs || 0) === Math.max(...m.p.map((y) => y.vs || 0)) && x.r === 'UTILITY') return 'Sehendes Auge';
  if (min > 0 && x.cs / min >= 8.5) return 'Farmmaschine';
  if (x.k >= 10 && x.k >= Math.max(...gleich.map((y) => y.k))) return 'Carry';
  if (x.de >= 10) return 'Achterbahn';
  return '';
}

function tagUndStunde(t) {
  const tag = TAGE.indexOf(WOCHENTAG.format(t).replace('.', '').slice(0, 2));
  return [tag < 0 ? 0 : tag, (parseInt(STUNDE.format(t), 10) || 0) % 24];
}

// person: { id, name, puuids, accounts }, liste: alle Spiele (kompakt), queues: erlaubte Queues
function profil({ person, liste, queues, queueName, personVonPuuid, mastery, lpVerlauf, champTags }) {
  const meine = new Set(person.puuids);
  const spiele = liste.filter((m) => queues.includes(m.q) && m.d >= 300 && m.p.some((x) => meine.has(x.u))).sort((a, b) => b.t - a.t);
  const champs = {}, rollen = {}, klassen = {}, mit = {}, woche = TAGE.map(() => [0, 0]), stunden = Array.from({ length: 24 }, () => [0, 0]);
  let g = 0, w = 0, k = 0, de = 0, a = 0, kpSumme = 0, dauer = 0;
  const zeilen = [];
  spiele.forEach((m, idx) => {
    const i = m.p.findIndex((x) => meine.has(x.u)), x = m.p[i];
    const teamK = m.p.filter((y) => y.tm === x.tm).reduce((s, y) => s + y.k, 0), kp = teamK ? (x.k + x.a) / teamK : 0;
    g++; if (x.w) w++; k += x.k; de += x.de; a += x.a; kpSumme += kp; dauer += m.d;
    const c = (champs[x.c] = champs[x.c] || { c: x.c, g: 0, w: 0, k: 0, de: 0, a: 0, cs: 0, min: 0 });
    c.g++; if (x.w) c.w++; c.k += x.k; c.de += x.de; c.a += x.a; c.cs += x.cs; c.min += m.d / 60;
    if (x.r) rollen[x.r] = (rollen[x.r] || 0) + 1;
    const kl = (champTags[x.c] || [])[0]; if (kl) klassen[kl] = (klassen[kl] || 0) + 1;
    const [tag, std] = tagUndStunde(m.t); woche[tag][0]++; if (x.w) woche[tag][1]++; stunden[std][0]++; if (x.w) stunden[std][1]++;
    m.p.forEach((y) => {
      if (y.tm !== x.tm || meine.has(y.u)) return;
      const e = (mit[y.u] = mit[y.u] || { u: y.u, n: y.n, g: 0, w: 0, t: 0 }); e.g++; if (x.w) e.w++;
      if (m.t > e.t) { e.t = m.t; e.n = y.n; }
    });
    if (idx < 40) {
      const b = bewerten(m), gewinner = m.p.map((y, j) => j).filter((j) => m.p[j].w), verlierer = m.p.map((y, j) => j).filter((j) => !m.p[j].w);
      const bester = (l) => l.sort((p, q) => b.platz[p] - b.platz[q])[0];
      const mvp = bester(gewinner.slice()), ace = bester(verlierer.slice());
      zeilen.push({ id: m.id, t: m.t, d: m.d, q: queueName(m.q), w: x.w, ich: i, kp: Math.round(kp * 100), platz: b.platz[i], note: b.note[i],
        orden: i === mvp ? 'MVP' : i === ace ? 'ACE' : '', etikett: etikett(m, i, b),
        p: m.p.map((y, j) => ({ n: y.n, person: personVonPuuid[y.u] || null, c: y.c, r: y.r, tm: y.tm, w: y.w, k: y.k, de: y.de, a: y.a, cs: y.cs, g: y.g, s: y.s, vs: y.vs, it: y.it || [], sp: y.sp || [], ru: y.ru || [], cl: y.cl || 0, note: b.note[j] })) });
    }
  });
  const leistung = (l) => {
    if (!l.length) return null;
    let gg = 0, ww = 0, kk = 0, dd = 0, aa = 0, kps = 0, du = 0;
    l.forEach((m) => { const x = m.p.find((y) => meine.has(y.u)), teamK = m.p.filter((y) => y.tm === x.tm).reduce((s, y) => s + y.k, 0); gg++; if (x.w) ww++; kk += x.k; dd += x.de; aa += x.a; kps += teamK ? (x.k + x.a) / teamK : 0; du += m.d; });
    return { g: gg, wr: Math.round((ww / gg) * 100), kda: Math.round(((kk + aa) / Math.max(1, dd)) * 100) / 100, kp: Math.round((kps / gg) * 100), dauer: Math.round(du / gg) };
  };
  return {
    id: person.id, name: person.name, accounts: person.accounts, filterSpiele: g, w,
    kda: { k: g ? k / g : 0, de: g ? de / g : 0, a: g ? a / g : 0 },
    champs: Object.values(champs).sort((p, q) => q.g - p.g || q.w - p.w).slice(0, 20).map((c) => ({ c: c.c, g: c.g, w: c.w, k: c.k / c.g, de: c.de / c.g, a: c.a / c.g, csMin: c.min ? Math.round((c.cs / c.min) * 10) / 10 : 0, cs: Math.round(c.cs / c.g) })),
    rollen, klassen, woche, stunden,
    mitgespielt: Object.values(mit).filter((e) => e.g >= 2).sort((p, q) => q.g - p.g || q.w - p.w).slice(0, 12).map((e) => ({ n: e.n, person: personVonPuuid[e.u] || null, g: e.g, w: e.w })),
    leistung: { neu: leistung(spiele.slice(0, 20)), alle: leistung(spiele) },
    mastery, lpVerlauf, spiele: zeilen,
  };
}

module.exports = { profil, bewerten };
