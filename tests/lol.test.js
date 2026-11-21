// LoL-Zentrale: echter Konto-Server mit nachgebauter Riot-API (keine echten Anfragen ins Netz).
// Ohne Key: Beispieldaten, Accounts eintragen (warten auf Key), Prüfungen (Format, doppelt, fremd).
// Admin trägt Key ein → Accounts werden aufgelöst, Rang + Spiele geholt, Smurfs zusammengeführt, Duos gezählt.
// Der Key landet nie im Browser; Konto löschen entfernt die LoL-Einträge; Seite lädt auf PC und Handy ohne Fehler.
// Aufruf: node tests/lol.test.js   (startet alles selbst auf Port 8796/8797)
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { erstelleServer } = require('../werkzeuge/homeserver/spielstand-server.js');
const WURZEL = path.join(__dirname, '..');
const DATEN = fs.mkdtempSync(path.join(os.tmpdir(), 'spielekiste-lol-'));
const KEY = 'RGAPI-12345678-abcd-4ef0-9abc-1234567890ab';

// ---------- nachgebaute Riot-API ----------
const ACCS = { 'anna main#euw': 'P-ANNA', 'anna smurf#euw': 'P-ANNA2', 'ben#1234': 'P-BEN' };
const riotAufrufe = [];
const SPIELE = {};
for (let n = 0; n < 6; n++) {
  const sieg = n % 3 !== 0, wer = n < 4 ? 'P-ANNA' : 'P-ANNA2';
  SPIELE['EUW1_' + n] = { metadata: { matchId: 'EUW1_' + n }, info: { gameStartTimestamp: Date.now() - n * 36e5, gameDuration: 1800, queueId: 420, gameVersion: '15.10.1',
    participants: ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'].flatMap((r, i) => [100, 200].map((tm) => {
      const u = tm === 100 && i === 0 ? wer : tm === 100 && i === 1 ? 'P-BEN' : 'X-' + n + tm + i;
      return { puuid: u, riotIdGameName: u, riotIdTagline: 'X', championName: i === 0 ? 'Ahri' : 'Garen', teamPosition: r, teamId: tm, win: tm === 100 ? sieg : !sieg,
        kills: 5, deaths: 3, assists: 4, totalMinionsKilled: 180, neutralMinionsKilled: 10, goldEarned: 11000, totalDamageDealtToChampions: 20000, visionScore: 20, item0: 3031 };
    })) } };
}
const riotEcht = async (url, k) => {
  riotAufrufe.push(url);
  if (k !== KEY) return { status: 401, json: null };
  const u = new URL(url), p = decodeURIComponent(u.pathname);
  if (p === '/lol/status/v4/platform-data') return { status: 200, json: { id: 'EUW1' } };
  let m = /^\/riot\/account\/v1\/accounts\/by-riot-id\/(.+)\/(.+)$/.exec(p);
  if (m) { const id = ACCS[(m[1] + '#' + m[2]).toLowerCase()]; return id ? { status: 200, json: { puuid: id, gameName: m[1], tagLine: m[2] } } : { status: 404, json: null }; }
  if ((m = /summoners\/by-puuid\/(.+)$/.exec(p))) return { status: 200, json: { profileIconId: 29, summonerLevel: 321 } };
  if ((m = /entries\/by-puuid\/(.+)$/.exec(p))) return { status: 200, json: m[1] === 'P-ANNA2' ? [{ queueType: 'RANKED_SOLO_5x5', tier: 'PLATINUM', rank: 'II', leaguePoints: 40, wins: 20, losses: 15 }] : [] };
  if ((m = /matches\/by-puuid\/(.+)\/ids$/.exec(p))) return { status: 200, json: Object.values(SPIELE).filter((s) => s.info.participants.some((x) => x.puuid === m[1])).map((s) => s.metadata.matchId) };
  if ((m = /matches\/(EUW1_\d+)$/.exec(p))) return { status: 200, json: SPIELE[m[1]] };
  return { status: 404, json: null };
};
let riotHolenAktuell = riotEcht;
const riotHolen = (url, k) => riotHolenAktuell(url, k);
let bildAufrufe = 0;
const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');
const bildHolen = async (url) => { bildAufrufe++; return url.endsWith('versions.json') ? Buffer.from('["15.10.1"]') : PNG; };

const api = erstelleServer({ daten: DATEN, basis: DATEN, admin: ['Anna'], autoTakt: 0, messTakt: 0, logTakt: 0, lolOptionen: { takt: 0, riotHolen, bildHolen, warten: async () => {} } });
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png' };
const caddy = http.createServer((q, s) => {
  if (q.url.startsWith('/api/')) { const p = http.request({ port: 8797, path: q.url, method: q.method, headers: q.headers }, (r) => { s.writeHead(r.statusCode, r.headers); r.pipe(s); }); q.pipe(p); return; }
  const f = path.join(WURZEL, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(WURZEL)) { s.writeHead(403); s.end(); return; }
  fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream' }); s.end(b); });
});

let fehler = 0;
const ck = (name, ok, info = '') => { console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  → ' + info)); if (!ok) fehler++; };
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
async function anfrage(weg, methode = 'GET', koerper, cookie) {
  const r = await fetch('http://127.0.0.1:8796/api/' + weg, { method: methode, headers: Object.assign(koerper ? { 'Content-Type': 'application/json' } : {}, cookie ? { Cookie: cookie } : {}), body: koerper ? JSON.stringify(koerper) : undefined });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch (e) { /* kein JSON */ }
  return { status: r.status, json, text, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
}
async function bisFertig(cookie) { for (let i = 0; i < 100; i++) { const d = await anfrage('admin/lol', 'GET', null, cookie); if (!d.json.laeuft && d.json.letzterLauf) return d.json; await warte(50); } return null; }

(async () => {
  await new Promise((ok) => api.listen(8797, '127.0.0.1', ok));
  await new Promise((ok) => caddy.listen(8796, ok));
  try {
    console.log('Ohne Anmeldung / ohne Key');
    ck('ohne Anmeldung nichts', (await anfrage('lol/daten')).status === 401);
    const anna = (await anfrage('registrieren', 'POST', { name: 'Anna', pin: '1234' })).cookie;
    const ben = (await anfrage('registrieren', 'POST', { name: 'Ben', pin: '1234' })).cookie;
    const cara = (await anfrage('registrieren', 'POST', { name: 'Cara', pin: '1234' })).cookie;
    let d = await anfrage('lol/daten', 'GET', null, ben);
    ck('ohne Key: Beispieldaten mit Personen, Duos, Spielen', d.status === 200 && d.json.quelle === 'demo' && d.json.key === 'fehlt' && d.json.personen.length === 5 && d.json.duos.length > 3 && d.json.feed.length > 10, JSON.stringify(d.json).slice(0, 200));
    const smurf = d.json.personen.find((p) => p.name === 'Philip');
    ck('Beispiel: Smurf-Accounts zu einer Person zusammengeführt', smurf && smurf.accounts.length === 2);
    const wrs = d.json.personen.map((p) => p.w / p.g);
    ck('Beispiel: realistische Winraten (40–60 %)', wrs.every((x) => x > 0.4 && x < 0.6), wrs.join(','));
    ck('Beispiel: Kill-Beteiligung nie über 100 %, keine negativen Werte', d.json.feed.every((s) => s.wir.every((x) => x.kp <= 100 && x.k >= 0 && x.a >= 0)));
    const aram = await anfrage('lol/daten?filter=aram', 'GET', null, ben);
    ck('Filter ARAM: nur ARAM-Spiele', aram.json.feed.length > 0 && aram.json.feed.every((s) => s.q === 'ARAM') && aram.json.spiele < d.json.spiele);
    ck('Riot-ID falsch geschrieben → 400', (await anfrage('lol/account', 'POST', { riotId: 'ohneTag', region: 'euw1' }, ben)).status === 400);
    ck('unbekannte Region → 400', (await anfrage('lol/account', 'POST', { riotId: 'Ben#1234', region: 'mond' }, ben)).status === 400);
    let a = await anfrage('lol/account', 'POST', { riotId: 'Ben # 1234', region: 'euw1' }, ben);
    ck('Account eintragen ohne Key: gemerkt, wartet', a.status === 200 && a.json.account === 'Ben#1234' && a.json.wartet === true, a.text);
    ck('derselbe Account bei jemand anderem → 409', (await anfrage('lol/account', 'POST', { riotId: 'ben#1234', region: 'euw1' }, cara)).status === 409);
    ck('doppelt bei sich selbst → 409', (await anfrage('lol/account', 'POST', { riotId: 'Ben#1234', region: 'euw1' }, ben)).status === 409);
    await anfrage('lol/account', 'POST', { riotId: 'Anna Main#EUW', region: 'euw1' }, anna);
    await anfrage('lol/account', 'POST', { riotId: 'Anna Smurf#EUW', region: 'euw1' }, anna);
    d = await anfrage('lol/daten', 'GET', null, ben);
    ck('„Meine Accounts“ zeigt nur die eigenen', d.json.meine.length === 1 && d.json.meine[0].riotId === 'Ben#1234' && d.json.meine[0].wartet);
    ck('Aktualisieren ohne Key → 409 mit Erklärung', (await anfrage('lol/aktualisieren', 'POST', {}, ben)).status === 409);
    ck('ohne Key keine Anfrage an Riot', riotAufrufe.length === 0, riotAufrufe.join(' '));

    console.log('Accounts für Mitspieler');
    let x = await anfrage('lol/account', 'POST', { riotId: 'Dennis#EUW', region: 'euw1', neuName: 'Dennis' }, cara);
    d = await anfrage('lol/daten', 'GET', null, cara);
    ck('Cara trägt Account für „Dennis“ (ohne Konto) ein', x.status === 200 && x.json.person === 'Dennis' && d.json.wahl.some((p) => p.name === 'Dennis' && p.gast) && d.json.alle.some((p) => p.name === 'Dennis' && p.gast && p.accounts[0].darf), x.text);
    ck('Personen-Auswahl: andere Konten + Gäste, nicht man selbst', d.json.wahl.some((p) => p.name === 'Anna') && !d.json.wahl.some((p) => p.name === 'Cara') && d.json.ichId === 'cara');
    x = await anfrage('lol/account', 'POST', { riotId: 'Cara Zwei#EUW', region: 'euw1', fuer: 'cara' }, ben);
    ck('Ben trägt einen Account für Caras Konto ein', x.status === 200 && x.json.person === 'Cara');
    ck('unbekannte Person → 404', (await anfrage('lol/account', 'POST', { riotId: 'Egal#EUW', region: 'euw1', fuer: 'niemand' }, ben)).status === 404);
    ck('doppelt (bei anderer Person) → 409 mit Namen', /Dennis/.test((await anfrage('lol/account', 'POST', { riotId: 'dennis#euw', region: 'euw1' }, ben)).json.fehler));
    ck('Cara darf Bens eigenen Account nicht entfernen/umhängen', (await anfrage('lol/account/entfernen', 'POST', { riotId: 'Ben#1234', person: 'ben' }, cara)).status === 403
      && (await anfrage('lol/account/zuordnen', 'POST', { riotId: 'Ben#1234', person: 'ben', nach: 'cara' }, cara)).status === 403);
    x = await anfrage('lol/account/zuordnen', 'POST', { riotId: 'Dennis#EUW', person: 'gast:dennis', nach: 'cara' }, ben);
    d = await anfrage('lol/daten', 'GET', null, cara);
    ck('Dennis-Account Cara zugeordnet, leerer Gast verschwindet', x.status === 200 && d.json.meine.length === 2 && !d.json.wahl.some((p) => p.name === 'Dennis'), x.text);
    ck('Ben (hat ihn eingetragen) darf „Cara Zwei“ entfernen', (await anfrage('lol/account/entfernen', 'POST', { riotId: 'Cara Zwei#EUW', person: 'cara' }, ben)).status === 200);
    ck('Cara entfernt ihren eigenen', (await anfrage('lol/account/entfernen', 'POST', { riotId: 'Dennis#EUW' }, cara)).status === 200);
    ck('neue Person mit Namen eines Kontos → landet beim Konto', (await anfrage('lol/account', 'POST', { riotId: 'Bens Smurf#EUW', region: 'euw1', neuName: 'ben' }, cara)).json.person === 'Ben'
      && (await anfrage('lol/account/entfernen', 'POST', { riotId: 'Bens Smurf#EUW', person: 'ben' }, cara)).status === 200);

    console.log('Riot-Key (nur Admin)');
    ck('Ben darf den Key nicht sehen/setzen', (await anfrage('admin/lol', 'GET', null, ben)).status === 403 && (await anfrage('admin/lol', 'POST', { key: KEY }, ben)).status === 403);
    ck('Key im falschen Format → 400', (await anfrage('admin/lol', 'POST', { key: 'abc' }, anna)).status === 400);
    const falsch = await anfrage('admin/lol', 'POST', { key: 'RGAPI-00000000-0000-4000-8000-000000000000' }, anna);
    ck('abgelaufener Key → 400 „Riot lehnt ab“, wird nicht gespeichert', falsch.status === 400 && /lehnt/.test(falsch.json.fehler) && !fs.existsSync(path.join(DATEN, 'riot-key.txt')) && (await anfrage('admin/lol', 'GET', null, anna)).json.key === 'fehlt', falsch.text);
    const gut = await anfrage('admin/lol', 'POST', { key: KEY }, anna);
    ck('gültiger Key gespeichert', gut.status === 200 && gut.json.key === 'ok' && fs.readFileSync(path.join(DATEN, 'riot-key.txt'), 'utf8').trim() === KEY, gut.text);
    const st = await bisFertig(anna);
    ck('danach alle wartenden Accounts geholt (3 Accounts, 6 Spiele)', st && st.accounts === 3 && st.spiele === 6 && st.key === 'ok', JSON.stringify(st));

    console.log('Echte Auswertung');
    d = await anfrage('lol/daten', 'GET', null, ben);
    const p = d.json.personen, pa = p.find((x) => x.name === 'Anna'), pb = p.find((x) => x.name === 'Ben');
    ck('Quelle jetzt Riot, Anna + Ben als Personen', d.json.quelle === 'riot' && p.length === 2 && pa && pb, JSON.stringify(p.map((x) => x.name)));
    ck('Annas Main + Smurf zusammengeführt (6 Spiele, 4 Siege)', pa.g === 6 && pa.w === 4 && pa.accounts.length === 2, pa.g + '/' + pa.w);
    ck('Rang und Profil vom Smurf übernommen', pa.accounts.some((x) => x.rang && x.rang.solo && x.rang.solo.tier === 'PLATINUM' && x.level === 321));
    ck('Rollen: Anna Top, Ben Jungle', pa.rollen.TOP.g === 6 && pb.rollen.JUNGLE.g === 6);
    const duo = d.json.duos[0];
    ck('Duo Anna + Ben: 6 Spiele, 4 Siege, beste Rollen Top+Jungle', d.json.duos.length === 1 && duo.g === 6 && duo.w === 4 && Object.keys(duo.rollen).length === 1, JSON.stringify(duo));
    ck('Spiele-Verlauf: zusammen gespielt, mit KP', d.json.feed.length === 6 && d.json.feed[0].wir.length === 2 && d.json.feed[0].wir[0].kp > 0);
    ck('Key steht in keiner Antwort an den Browser', !d.text.includes(KEY) && !(await anfrage('admin/lol', 'GET', null, anna)).text.includes(KEY));
    const vorher = riotAufrufe.length;
    ck('Aktualisieren: erst 200, gleich danach 429', (await anfrage('lol/aktualisieren', 'POST', {}, anna)).status === 200 && (await anfrage('lol/aktualisieren', 'POST', {}, anna)).status === 429);
    await bisFertig(anna); await warte(100);
    const neu = riotAufrufe.slice(vorher);
    ck('beim Aktualisieren keine schon bekannten Spiele neu geholt', neu.length > 0 && !neu.some((u) => /matches\/EUW1_/.test(u)), neu.join(' '));
    ck('Account unbekannt bei Riot → 404', (await anfrage('lol/account', 'POST', { riotId: 'Gibtsnicht#EUW', region: 'euw1' }, cara)).status === 404);

    console.log('Key-Wechsel (Riot verschlüsselt PUUIDs pro Key)');
    const KEY2 = 'RGAPI-99999999-abcd-4ef0-9abc-1234567890ab';
    const altHolen = riotHolenAktuell; riotHolenAktuell = async (url, k) => (k === KEY2 ? altHolen(url, KEY) : { status: 401, json: null });
    ck('neuer Key gespeichert', (await anfrage('admin/lol', 'POST', { key: KEY2 }, anna)).json.key === 'ok');
    const st2 = await bisFertig(anna);
    d = await anfrage('lol/daten', 'GET', null, ben);
    ck('nach Key-Wechsel alles neu zugeordnet (3 Accounts, 6 Spiele, Duo da)', st2 && st2.accounts === 3 && st2.spiele === 6 && d.json.duos.length === 1 && d.json.personen.find((x) => x.name === 'Anna').g === 6, JSON.stringify(st2));

    console.log('Bilder');
    let b = await fetch('http://127.0.0.1:8796/api/lol/bild/champion/Ahri.png', { headers: { Cookie: ben } });
    const n1 = bildAufrufe;
    await fetch('http://127.0.0.1:8796/api/lol/bild/champion/Ahri.png', { headers: { Cookie: ben } });
    ck('Champion-Bild über den Server, danach aus dem Zwischenspeicher', b.status === 200 && b.headers.get('content-type') === 'image/png' && bildAufrufe === n1);
    b = await fetch('http://127.0.0.1:8796/api/lol/bild/champion/..%2F..%2Fkonten.png', { headers: { Cookie: ben } });
    ck('Bildpfad mit ../ abgelehnt', b.status !== 200);

    console.log('Konto löschen');
    ck('Admin löscht Ben', (await anfrage('admin/konto/loeschen', 'POST', { name: 'Ben' }, anna)).status === 200);
    d = await anfrage('lol/daten', 'GET', null, anna);
    ck('Bens LoL-Accounts sind weg', !d.json.personen.some((x) => x.name === 'Ben' || x.id === 'ben') && !JSON.stringify(JSON.parse(fs.readFileSync(path.join(DATEN, 'lol', 'zustand.json'), 'utf8')).personen).includes('Ben#1234'));

    console.log('Seite im Browser');
    fs.rmSync(path.join(DATEN, 'riot-key.txt'));   // zurück zu Beispieldaten
    const browser = await chromium.launch();
    for (const [name, opt] of [['PC', { viewport: { width: 1500, height: 950 } }], ['iPhone', devices['iPhone 13']]]) {
      const ctx = await browser.newContext(opt), seite = await ctx.newPage(), js = [];
      seite.on('pageerror', (e) => js.push(e.message));
      await seite.goto('http://localhost:8796/lol.html');
      await seite.waitForSelector('#hinweis a');
      ck(name + ': ohne Anmeldung Hinweis zur Spielekiste', /anmelden/.test(await seite.textContent('#hinweis')));
      await ctx.addCookies([{ name: cara.split('=')[0], value: cara.split('=').slice(1).join('='), url: 'http://localhost:8796' }]);
      await seite.reload(); await seite.waitForSelector('.person');
      ck(name + ': Beispiel-Banner + 5 Spieler-Karten', !(await seite.isHidden('#banner')) && (await seite.$$('.person')).length === 5);
      for (const t of ['duos', 'rollen', 'aufstellung', 'spiele']) { await seite.click('[data-tab="' + t + '"]'); await warte(80); }
      ck(name + ': Aufstellung verteilt 5 Rollen', (await seite.$$('.platz')).length === 5 && /Siegchance/.test(await seite.textContent('#aufTipp')));
      await seite.click('[data-tab="gruppe"]'); await seite.click('.person >> nth=1'); await warte(150);
      ck(name + ': Spieler-Profil mit Champions und Spielen', (await seite.$$('[data-panel="person"] tbody tr')).length > 3 && (await seite.$$('#personFeed .spiel')).length > 3);
      await seite.fill('#riotId', 'Cara#EUW'); await seite.click('#hinzu'); await warte(400);
      ck(name + ': eigenen Account eingetragen, „wartet auf Riot-Key“', /Cara#EUW/.test(await seite.textContent('#meineListe')) && /wartet auf Riot-Key/.test(await seite.textContent('#meineListe')));
      await seite.click('[data-tab="spiele"]'); await warte(80);
      const breit = await seite.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ck(name + ': nichts ragt seitlich heraus', breit <= 1, breit + 'px');
      ck(name + ': keine JS-Fehler', js.length === 0, js.join(' | '));
      await anfrage('lol/account/entfernen', 'POST', { riotId: 'Cara#EUW' }, cara);
      await ctx.close();
    }
    await browser.close();
  } catch (e) { console.log('Abbruch:', e); fehler++; }
  api.close(); caddy.close();
  fs.rmSync(DATEN, { recursive: true, force: true });
  console.log(fehler ? '\n✗ ' + fehler + ' Fehler' : '\n✓ alles ok');
  process.exit(fehler ? 1 : 0);
})();
