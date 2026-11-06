// 🟢 Spotify im Song-Rätsel: „Titel erkennen“ / „Jahr schätzen“ mit Zufallssongs nach Kategorie oder aus deiner Bibliothek.
// Abgespielt wird über Spotify Connect auf deinem Gerät (Spotify-App am Handy/Computer muss offen sein) – dafür
// braucht Spotify Premium. Anmeldung: Authorization Code mit PKCE, ohne Server und ohne Geheimschlüssel.
// Was mit Spotify NICHT geht: Rückwärts abspielen und Töne erkennen – die App bekommt den Ton nie zu sehen
// (er läuft in der Spotify-App), und die Tonanalyse-Schnittstelle gibt Spotify neuen Apps nicht mehr frei.
const SP_KEY = 'walquiz.spotify.v1';
const SP_SCOPES = 'user-library-read user-top-read user-read-playback-state user-modify-playback-state';
const spRedirect = () => location.origin + location.pathname;
const spStore = () => loadJson(SP_KEY);
const spSave = (s) => saveJson(SP_KEY, s);
const spB64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function spAnmelden() {
  const st = spStore();
  if (!st.clientId) return;
  const zuf = crypto.getRandomValues(new Uint8Array(48)), verifier = spB64(zuf), state = spB64(crypto.getRandomValues(new Uint8Array(12)));
  const challenge = spB64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  st.pkce = { verifier, state, z: Date.now() }; spSave(st);
  const q = new URLSearchParams({ client_id: st.clientId, response_type: 'code', redirect_uri: spRedirect(), code_challenge_method: 'S256', code_challenge: challenge, scope: SP_SCOPES, state });
  location.href = 'https://accounts.spotify.com/authorize?' + q;
}
async function spToken(body) {
  const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error_description || j.error || 'Anmeldung fehlgeschlagen (' + r.status + ')');
  const st = spStore();
  st.token = j.access_token; st.ablauf = Date.now() + (j.expires_in || 3600) * 1000 - 60000;
  if (j.refresh_token) st.refresh = j.refresh_token;
  delete st.pkce; spSave(st);
  return st.token;
}
// Rückkehr von Spotify: ?code=…&state=…
async function spRueckkehr() {
  const q = new URLSearchParams(location.search);
  if (!q.has('state') || !(q.has('code') || q.has('error'))) return false;
  const st = spStore(), sauber = () => history.replaceState(null, '', location.pathname + location.hash);
  if (q.get('error')) { sauber(); st.fehler = 'Spotify-Anmeldung abgebrochen (' + q.get('error') + ').'; spSave(st); return true; }
  if (!st.pkce || st.pkce.state !== q.get('state')) {
    sauber(); st.fehler = 'Die Anmeldung kam in einem anderen Fenster an. Am iPhone: einmal direkt in Safari anmelden (nicht über das Home-Bildschirm-Symbol) – oder nochmal versuchen.'; spSave(st); return true;
  }
  try { await spToken({ grant_type: 'authorization_code', code: q.get('code'), redirect_uri: spRedirect(), client_id: st.clientId, code_verifier: st.pkce.verifier }); }
  catch (e) { const s = spStore(); s.fehler = e.message; spSave(s); }
  sauber();
  return true;
}
async function spGueltig() {
  const st = spStore();
  if (st.token && st.ablauf > Date.now()) return st.token;
  if (st.refresh && st.clientId) return spToken({ grant_type: 'refresh_token', refresh_token: st.refresh, client_id: st.clientId });
  return null;
}
async function spApi(pfad, opt = {}) {
  const t = await spGueltig();
  if (!t) throw new Error('nicht angemeldet');
  const r = await fetch('https://api.spotify.com/v1' + pfad, { ...opt, headers: { Authorization: 'Bearer ' + t, ...(opt.body ? { 'Content-Type': 'application/json' } : {}) } });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((j && j.error && j.error.message) || 'Spotify-Fehler ' + r.status); e.status = r.status; e.grund = j && j.error && j.error.reason; throw e; }
  return j;
}
const spAngemeldet = () => { const st = spStore(); return !!(st.clientId && (st.refresh || (st.token && st.ablauf > Date.now()))); };
function spAbmelden() { const st = spStore(); delete st.token; delete st.refresh; delete st.ablauf; delete st.titel; spSave(st); }

// Spotify-Track → schlankes Objekt (Titel ohne „Remastered 2011“ & Co., Jahr aus dem Album)
function spSauber(name) {
  return String(name || '').replace(/\s+-\s+[^-]*(remaster|version|edit|mix|live|mono|stereo|bonus|single|demo|anniversary|deluxe)[^-]*$/i, '')
    .replace(/\s*[\(\[][^\)\]]*(remaster|version|edit|live|mono|stereo|bonus|single|deluxe|anniversary)[^\)\]]*[\)\]]/ig, '').trim() || String(name || '');
}
function spTrack(t) {
  if (!t || !t.uri || t.type !== 'track' || t.is_local || t.is_playable === false) return null;
  const jahr = t.album && t.album.release_date ? parseInt(t.album.release_date, 10) : null;
  return { uri: t.uri, isrc: (t.external_ids || {}).isrc || null, name: spSauber(t.name), kuenstler: (t.artists || []).map((a) => a.name).join(', '), erster: ((t.artists || [])[0] || {}).name || '', dauer: t.duration_ms, jahr: jahr > 1900 ? jahr : null, bild: t.album && t.album.images && t.album.images.length ? t.album.images[t.album.images.length - 1].url : '' };
}
// doppelte Songs (gleicher Titel + Künstler) raus, höchstens 2 Songs je Künstler
function spEntdoppeln(liste) {
  const gesehen = new Set(), proK = {}, out = [];
  for (const t of liste) {
    if (!t) continue;
    const k = t.name.toLowerCase() + '|' + t.erster.toLowerCase();
    if (gesehen.has(k) || (proK[t.erster] || 0) >= 2) continue;
    gesehen.add(k); proK[t.erster] = (proK[t.erster] || 0) + 1; out.push(t);
  }
  return out;
}
// Titel aus „Lieblingssongs“ und „Meistgehört“ (max. 300, für eine Stunde zwischengespeichert)
async function spTitel(neu) {
  const st = spStore();
  if (!neu && st.titel && st.titel.z > Date.now() - 3600000 && st.titel.liste.length >= 4 && st.titel.v === 3) return st.titel.liste;
  const roh = [];
  for (const zeit of ['short_term', 'medium_term']) { try { const j = await spApi('/me/top/tracks?limit=50&time_range=' + zeit); (j.items || []).forEach((t) => roh.push(spTrack(t))); } catch (e) { if (e.status === 401) throw e; } }
  for (let off = 0; off < 200; off += 50) { const j = await spApi('/me/tracks?limit=50&offset=' + off); (j.items || []).forEach((x) => roh.push(spTrack(x.track))); if (!j.next) break; }
  const s = spStore(); s.titel = { v: 3, z: Date.now(), liste: spEntdoppeln(roh).slice(0, 300) }; spSave(s);
  return s.titel.liste;
}
// Kategorien: Spotify-Suche mit Genre/Jahr-Filter (Spotifys eigene Empfehlungen gibt es für neue Apps nicht mehr)
const SP_JETZT = new Date().getFullYear();
const SP_KATEGORIEN = [
  { id: 'mix', name: 'Querbeet', emoji: '🎲', q: 'year:1960-' + SP_JETZT, von: 1960 },
  { id: '70er', name: '70er Disco & Funk', emoji: '🕺', q: 'genre:disco year:1970-1981', von: 1970, bis: 1981 },
  { id: '80er', name: '80er Pop', emoji: '📼', q: 'genre:pop year:1980-1989', von: 1980, bis: 1989 },
  { id: '90er', name: '90er Pop', emoji: '💿', q: 'genre:pop year:1990-1999', von: 1990, bis: 1999 },
  { id: '00er', name: '2000er Pop', emoji: '📀', q: 'genre:pop year:2000-2009', von: 2000, bis: 2009 },
  { id: '10er', name: '2010er Pop', emoji: '📱', q: 'genre:pop year:2010-2019', von: 2010, bis: 2019 },
  { id: 'neu', name: 'Aktuelle Hits', emoji: '🔥', q: 'year:' + (SP_JETZT - 2) + '-' + SP_JETZT, von: SP_JETZT - 2 },
  { id: 'rock', name: 'Rock-Klassiker', emoji: '🎸', q: 'genre:rock year:1965-1995', von: 1965, bis: 1995 },
  { id: 'hiphop', name: 'Hip-Hop', emoji: '🎤', q: 'genre:hip-hop year:1990-' + SP_JETZT, von: 1990 },
  { id: 'deutsch', name: 'Deutschpop', emoji: '🇩🇪', q: 'genre:"german pop"' },
  { id: 'schlager', name: 'Schlager', emoji: '🎺', q: 'genre:schlager' },
  { id: 'film', name: 'Filmmusik', emoji: '🎬', q: 'genre:soundtrack' },
  { id: 'fav', name: 'Wie meine Favoriten', emoji: '✨', text: 'Songs deiner meistgehörten Künstler' },
  { id: 'bib', name: 'Meine Musik', emoji: '💚', text: 'Lieblingssongs & Meistgehörtes' },
];
const spKat = (id) => SP_KATEGORIEN.find((k) => k.id === id) || SP_KATEGORIEN[2];
async function spSuche(q, offset) {
  const j = await spApi('/search?type=track&market=from_token&limit=10&offset=' + offset + '&q=' + encodeURIComponent(q));
  return ((j && j.tracks && j.tracks.items) || []).map(spTrack);
}
// Bekanntheit: Spotify sortiert Suchtreffer grob nach Beliebtheit – vorne stehen die Hits
async function spPool(katId, hits) {
  const K = spKat(katId), r = Math.random;
  if (K.id === 'bib') return spTitel();
  let roh = [];
  if (K.id === 'fav') {
    const j = await spApi('/me/top/artists?limit=20&time_range=medium_term').catch((e) => { if (e.status === 401) throw e; return null; });
    const kuenstler = ((j && j.items) || []).map((a) => a.name).sort(() => r() - 0.5).slice(0, 8);
    if (kuenstler.length < 2) return spTitel();
    const teile = await Promise.all(kuenstler.map((n) => spSuche('artist:"' + n.replace(/"/g, '') + '"', hits ? 0 : 10 * Math.floor(r() * 3)).catch(() => [])));
    roh = teile.flat();
  } else {
    const max = hits ? 90 : 600, offs = new Set();
    while (offs.size < 6) offs.add(10 * Math.floor(r() * (max / 10 + 1)));
    const teile = await Promise.all([...offs].map((o) => spSuche(K.q, o).catch((e) => { if (e.status === 401) throw e; return []; })));
    roh = teile.flat();
    if (roh.filter(Boolean).length < 12) roh = roh.concat(...(await Promise.all([0, 10, 20].map((o) => spSuche(K.q, o).catch(() => [])))));
  }
  return spEntdoppeln(roh.sort(() => r() - 0.5));
}
async function spGeraet() {
  const j = await spApi('/me/player/devices'), d = (j && j.devices || []).filter((x) => !x.is_restricted);
  return d.find((x) => x.is_active) || d[0] || null;
}
// Abspielen ab position_ms für „dauer“ ms – gemessen an Spotifys eigenem Fortschritt, damit Netz-Verzögerung nicht mitzählt
let spLauf = 0;
async function spAusschnitt(geraet, uri, pos, dauer, wennStart) {
  const meins = ++spLauf;
  await spApi('/me/player/play?device_id=' + encodeURIComponent(geraet.id), { method: 'PUT', body: JSON.stringify({ uris: [uri], position_ms: Math.max(0, Math.round(pos)) }) });
  const t0 = Date.now();
  let start = null;
  while (Date.now() - t0 < 6000 && meins === spLauf) {
    const s = await spApi('/me/player').catch(() => null);
    if (s && s.is_playing && s.item && s.item.uri === uri && s.progress_ms >= pos - 200) { start = Date.now() - Math.max(0, s.progress_ms - pos); break; }
    await new Promise((r) => setTimeout(r, 150));
  }
  if (meins !== spLauf) return;
  if (wennStart) wennStart();
  const rest = (start || t0) + dauer - Date.now();
  await new Promise((r) => setTimeout(r, Math.max(0, rest)));
  if (meins === spLauf) await spPause();
}
async function spPause() {
  spLauf++;
  if (typeof dzStopp === 'function') dzStopp();
  if (sp && sp.abspielen === 'browser') return;
  if (!spAngemeldet()) return;
  try { await spApi('/me/player/pause', { method: 'PUT' }); } catch (e) { /* schon pausiert */ }
}

// ---------- Partie: „Titel erkennen“ oder „Jahr schätzen“ ----------
const SP_STUFEN = {
  leicht: { dauer: 4000, intro: true, opt: 4, hoeren: 3, text: '4 Sekunden vom Anfang · 4 Antworten · 3× hören' },
  mittel: { dauer: 2000, intro: false, opt: 4, hoeren: 2, text: '2 Sekunden irgendwo im Song · 4 Antworten · 2× hören' },
  profi: { dauer: 1000, intro: false, opt: 6, hoeren: 1, text: '1 Sekunde irgendwo im Song · 6 Antworten · 1× hören' },
};
const SP_JAHR_STUFEN = { leicht: { dauer: 8000, intro: true, hoeren: 3, je: 0.7, text: '8 Sekunden · pro Jahr daneben −0,7 Punkte' }, mittel: { dauer: 5000, intro: false, hoeren: 2, je: 1, text: '5 Sekunden · pro Jahr daneben −1 Punkt' }, profi: { dauer: 3000, intro: false, hoeren: 1, je: 1.5, text: '3 Sekunden · pro Jahr daneben −1,5 Punkte' } };
const SP_MODI = { titel: { name: 'Titel erkennen', emoji: '🎵', text: 'Welcher Song ist das?' }, jahr: { name: 'Jahr schätzen', emoji: '📅', text: 'Aus welchem Jahr?' } };
const spWahl = () => ({ modus: 'titel', kat: '80er', hits: true, netz: 'deezer', wo: 'browser', ...(spStore().wahl || {}) });
// Ton im Browser? Deezer immer; Spotify-Songs dann über die Deezer-Hörprobe (gleicher Song per ISRC)
const spImBrowser = () => { const W = spWahl(); return W.netz !== 'spotify' || W.wo !== 'app'; };
const spDz = () => spWahl().netz !== 'spotify';
const spNetzName = (n) => (n === 'spotify' ? '🟢 Spotify' : '🎧 Deezer');
let sp = null;
async function spStart(stufe) {
  const box = $('ton-song'), W = spWahl(), dz = W.netz !== 'spotify', K = spKat(dz && (W.kat === 'fav' || W.kat === 'bib') ? '80er' : W.kat), jahr = W.modus === 'jahr';
  const S = jahr ? SP_JAHR_STUFEN[stufe] : SP_STUFEN[stufe];
  srZeigen(); if (typeof srAufStart !== 'undefined') srAufStart = false;
  box.innerHTML = '<div class="ton-merk">' + K.emoji + ' Suche Songs: ' + K.name + ' …</div><div class="sr-platte sp dreht" aria-hidden="true"><i></i></div>';
  try {
    const browser = dz || W.wo !== 'app';
    const geraet = browser ? null : await spGeraet();
    if (!browser && !geraet) { spHinweis('📱 Kein Spotify-Gerät gefunden. Öffne die Spotify-App (Handy oder Computer), spiel kurz irgendeinen Song an und tippe dann nochmal – oder nimm Deezer, das spielt direkt im Browser.'); return; }
    let pool = (dz ? await dzPool(K.id, W.hits) : await spPool(K.id, W.hits)).slice().sort(() => Math.random() - 0.5);
    if (jahr) pool = dz ? await dzJahre(pool, SR_RUNDEN + 3) : pool.filter((t) => t.jahr);
    if (!dz && browser) {
      box.innerHTML = '<div class="ton-merk">' + K.emoji + ' Suche die Hörproben …</div><div class="sr-platte sp dreht" aria-hidden="true"><i></i></div>';
      pool = await spHoerprobenSuchen(pool, SR_RUNDEN);
    }
    if (pool.length < (jahr ? SR_RUNDEN : 6) || (browser && pool.filter((t) => t.preview).length < SR_RUNDEN)) throw new Error(K.id === 'bib' ? 'Zu wenige Songs: Speichere in Spotify mindestens 6 Lieblingssongs (♥).' : (dz ? 'Deezer' : 'Spotify') + ' hat für „' + K.name + '“ zu wenige Songs geliefert. Probier eine andere Kategorie.');
    const r = Math.random, runden = [];
    for (let i = 0; i < SR_RUNDEN; i++) {
      const T = pool[i];
      const pos = S.intro ? 0 : browser ? r() * Math.max(0, 28000 - S.dauer) : (T.dauer || 180000) * (0.25 + r() * 0.45);
      const andere = pool.filter((x) => x !== T && x.name.toLowerCase() !== T.name.toLowerCase()).sort(() => r() - 0.5).slice(0, (S.opt || 1) - 1);
      runden.push({ T, pos, optionen: jahr ? [] : [T, ...andere].sort(() => r() - 0.5), gehoert: 0, antwort: null });
    }
    const jahre = pool.map((t) => t.jahr).filter(Boolean);
    const von = Math.max(1950, Math.min(K.von || 1960, ...jahre) - 3), bis = Math.min(SP_JETZT, Math.max(K.bis || SP_JETZT, ...jahre) + 3);
    sp = { stufe, modus: W.modus, kat: K, geraet, netz: dz ? 'deezer' : 'spotify', abspielen: browser ? 'browser' : 'app', runden, i: 0, punkte: [], von, bis };
    spRunde();
  } catch (e) { spHinweis(spFehlerText(e)); }
}
// Ausschnitt abspielen – je nach Quelle im Browser (Deezer) oder über die Spotify-App
// Spotify-Songs → passende Deezer-Hörprobe (per ISRC, sonst Suche nach Künstler + Titel); Songs mit Hörprobe nach vorn
async function spHoerprobenSuchen(pool, anzahl) {
  const mit = [];
  for (let i = 0; i < pool.length && mit.length < anzahl + 2; i += 4) {
    await Promise.all(pool.slice(i, i + 4).map(async (T) => {
      let d = null;
      if (T.isrc) d = await dzApi('/track/isrc:' + encodeURIComponent(T.isrc)).catch(() => null);
      if (!d || !d.preview) {
        const j = await dzApi('/search?limit=3&q=' + encodeURIComponent('artist:"' + T.erster.replace(/"/g, '') + '" track:"' + T.name.replace(/"/g, '') + '"')).catch(() => null);
        d = ((j && j.data) || []).find((x) => x.preview) || null;
      }
      if (d && d.preview && d.readable !== false) { T.preview = d.preview; mit.push(T); }
    }));
  }
  return [...mit, ...pool.filter((T) => !mit.includes(T))];
}
function spSpielen(R, dauer, wennStart) { return sp.abspielen === 'browser' ? dzAusschnitt(R.T, R.pos, dauer, wennStart) : spAusschnitt(sp.geraet, R.T.uri, R.pos, dauer, wennStart); }
function spFehlerText(e) {
  if (sp && sp.netz === 'deezer' || !e.status && spDz()) return '⚠️ ' + e.message;
  if (e.status === 401 || /nicht angemeldet/.test(e.message)) { spAbmelden(); return '🔑 Die Spotify-Anmeldung ist abgelaufen. Bitte neu verbinden.'; }
  if (e.status === 403 && e.grund === 'PREMIUM_REQUIRED') return '💳 Spotify erlaubt das Steuern der Wiedergabe nur mit Premium.';
  if (e.status === 403) return '⛔ Spotify verweigert den Zugriff. Steht deine Spotify-E-Mail in deinem Entwickler-Dashboard unter „User Management“?';
  if (e.status === 404) return '📱 Spotify-Gerät nicht erreichbar. Spotify-App öffnen, kurz etwas abspielen, dann nochmal.';
  if (e.status === 429) return '⏳ Spotify bremst gerade (zu viele Anfragen). Warte eine Minute und versuch es nochmal.';
  return '⚠️ ' + e.message;
}
function spHinweis(text) {
  $('ton-song').innerHTML = '<div class="ton-merk">' + spNetzName(spWahl().netz) + '</div><div class="gb-text">' + text + '</div><button type="button" class="btn ton-gross" id="spNochmal">Nochmal versuchen</button><button type="button" class="btn secondary" id="spMenue">← Zum Song-Rätsel</button>';
  $('spNochmal').addEventListener('click', () => (spImBrowser() && dzEntsperren(), spStart((sp && sp.stufe) || (sr && sr.stufe) || 'leicht')));
  $('spMenue').addEventListener('click', () => srMenue());
}
const spEsc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const spTitelText = (T) => '<b>' + spEsc(T.name) + '</b><small>' + spEsc(T.kuenstler) + '</small>';
function spRunde() {
  const R = sp.runden[sp.i], jahr = sp.modus === 'jahr', S = jahr ? SP_JAHR_STUFEN[sp.stufe] : SP_STUFEN[sp.stufe], M = SP_MODI[sp.modus];
  const start = Math.round((sp.von + sp.bis) / 2);
  $('ton-song').innerHTML = '<div class="gb-kopf"><span>' + M.emoji + ' ' + M.name + ' · ' + sp.kat.emoji + ' ' + sp.kat.name + '</span><span>' + (sp.i + 1) + ' / ' + sp.runden.length + ' · ' + fmt(Math.round(sp.punkte.reduce((a, b) => a + b, 0) * 10) / 10) + ' P.</span></div>'
    + '<div class="gb-balken"><i style="width:' + Math.round((sp.i / sp.runden.length) * 100) + '%"></i></div>'
    + '<div class="ton-merk">' + (jahr ? 'Aus welchem Jahr ist der Song?' : 'Welcher Song ist das?') + '</div><div class="sr-platte sp" id="srPlatte" aria-hidden="true"><i></i></div>'
    + '<button type="button" class="gb-hoeren" id="spHoeren">▶︎ ' + S.dauer / 1000 + ' Sek. anspielen</button><p class="gb-fein" id="spRest"></p>'
    + (jahr ? '<div class="sp-jahr"><button type="button" class="sp-pm" data-d="-1" aria-label="ein Jahr früher">−</button><output id="spJahrZahl">' + start + '</output><button type="button" class="sp-pm" data-d="1" aria-label="ein Jahr später">+</button></div>'
      + '<input class="ton-regler" type="range" id="spJahr" min="' + sp.von + '" max="' + sp.bis + '" step="1" value="' + start + '" aria-label="Jahr"><div class="ton-skala"><span>' + sp.von + '</span><span>' + sp.bis + '</span></div>'
      + '<button type="button" class="btn ton-gross" id="spJahrOk">✓ ' + start + '</button>'
      : '<div class="gb-optionen sr-optionen sp-optionen">' + R.optionen.map((T, i) => '<button type="button" class="gb-opt" data-o="' + i + '">' + spTitelText(T) + '</button>').join('') + '</div>')
    + '<div class="gb-urteil" id="srUrteil"></div>';
  const rest = () => { $('spRest').textContent = R.gehoert >= S.hoeren ? 'Nicht mehr anhörbar – jetzt raten!' : 'Noch ' + (S.hoeren - R.gehoert) + '× anhören · ' + (sp.abspielen === 'browser' ? 'Hörprobe von Deezer, im Browser' : 'läuft über „' + sp.geraet.name + '“'); $('spHoeren').disabled = R.gehoert >= S.hoeren; };
  const spiel = async () => {
    if (R.gehoert >= S.hoeren || R.antwort !== null) return;
    R.gehoert++; rest(); $('spHoeren').disabled = true;
    try { await spSpielen(R, S.dauer, () => { const p = $('srPlatte'); if (p) p.classList.add('dreht'); }); }
    catch (e) {
      if (e.blockiert) { R.gehoert--; rest(); $('spRest').textContent = '👆 Tippe auf „Anspielen“ – der Browser startet Ton nur nach einem Tipp.'; return; }
      spHinweis(spFehlerText(e)); return;
    }
    const p = $('srPlatte'); if (p) p.classList.remove('dreht');
    if ($('spHoeren')) rest();
  };
  $('spHoeren').addEventListener('click', spiel);
  if (jahr) {
    const reg = $('spJahr'), setz = (v) => { reg.value = Math.max(sp.von, Math.min(sp.bis, v)); $('spJahrZahl').textContent = reg.value; $('spJahrOk').textContent = '✓ ' + reg.value; };
    reg.addEventListener('input', () => setz(Number(reg.value)));
    $('ton-song').querySelectorAll('.sp-pm').forEach((b) => b.addEventListener('click', () => setz(Number(reg.value) + Number(b.dataset.d))));
    $('spJahrOk').addEventListener('click', () => spJahrAntwort(R, Number(reg.value)));
  } else $('ton-song').querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => spAntwort(R, R.optionen[Number(b.dataset.o)], b)));
  rest(); spiel();
}
function spAuswerten(R, p, text) {
  sp.punkte.push(p);
  $('spHoeren').hidden = true; $('spRest').hidden = true;
  if (navigator.vibrate) navigator.vibrate(p >= 7 ? 15 : [40, 40, 40]);
  $('srUrteil').innerHTML = '<div class="gb-text sp-aufloesung">' + (R.T.bild ? '<img src="' + spEsc(R.T.bild) + '" alt="" width="56" height="56">' : '') + '<div>' + text + '</div></div>'
    + '<div class="gb-knoepfe"><button type="button" class="btn secondary" id="spWeiterhoeren">🔊 15 Sek. weiterhören</button></div>'
    + '<button type="button" class="btn ton-gross" id="srWeiter">' + (sp.i + 1 < sp.runden.length ? 'Weiter →' : 'Auswertung') + '</button>';
  $('spWeiterhoeren').addEventListener('click', () => spSpielen(R, 15000).catch((e) => { if (!e.blockiert) spHinweis(spFehlerText(e)); }));
  $('srWeiter').addEventListener('click', () => { spPause(); sp.i++; if (sp.i < sp.runden.length) spRunde(); else spEnde(); });
}
function spAntwort(R, wahl, knopf) {
  if (R.antwort !== null) return;
  R.antwort = wahl; spPause();
  const ok = wahl === R.T, p = ok ? Math.max(4, 13 - 3 * Math.max(1, R.gehoert)) : 0;
  $('ton-song').querySelectorAll('[data-o]').forEach((b) => { b.disabled = true; if (R.optionen[Number(b.dataset.o)] === R.T) b.classList.add('richtig'); });
  if (!ok) knopf.classList.add('falsch');
  spAuswerten(R, p, (ok ? '✅ Erkannt' + (R.gehoert <= 1 ? ' – nach einmal Hören!' : ' – nach ' + R.gehoert + '× Hören.') : '❌ Das war') + '<br><b>' + spEsc(R.T.name) + '</b> · ' + spEsc(R.T.kuenstler) + (R.T.jahr ? ' · ' + R.T.jahr : ''));
}
function spJahrAntwort(R, jahr) {
  if (R.antwort !== null) return;
  R.antwort = jahr; spPause();
  const d = Math.abs(jahr - R.T.jahr), S = SP_JAHR_STUFEN[sp.stufe], p = Math.max(0, Math.round((10 - d * S.je) * 10) / 10);
  $('spJahr').disabled = true; $('spJahrOk').hidden = true; $('ton-song').querySelectorAll('.sp-pm').forEach((b) => { b.disabled = true; });
  spAuswerten(R, p, (d === 0 ? '🎯 Genau getroffen!' : d <= 2 ? '👍 Fast – ' + d + ' Jahr' + (d === 1 ? '' : 'e') + ' daneben.' : d <= 6 ? '🟡 ' + d + ' Jahre daneben.' : '❌ ' + d + ' Jahre daneben.') + ' Erschienen: <b>' + R.T.jahr + '</b><br><b>' + spEsc(R.T.name) + '</b> · ' + spEsc(R.T.kuenstler) + '<br><small>+' + fmt(p) + ' Punkte · Jahr laut Spotify-Album (bei Best-of-Alben manchmal später)</small>');
}
function spEnde() {
  const max = sp.runden.length * 10, summe = Math.round((sp.punkte.reduce((a, b) => a + b, 0) / max) * 50 * 10) / 10;
  const k = spBestKey(sp.netz, sp.modus, sp.stufe);
  const st = tonStore(); st.song = st.song || {}; const alt = st.song[k] != null ? st.song[k] : null; st.song[k] = Math.max(alt || 0, summe); saveJson(TON_KEY, st);
  const stufeName = { leicht: 'Leicht', mittel: 'Mittel', profi: 'Profi' }[sp.stufe], M = SP_MODI[sp.modus];
  if (typeof merkeVerlauf === 'function') merkeVerlauf('songs', summe, 50, (sp.netz === 'deezer' ? 'Deezer' : 'Spotify') + ' · ' + M.name + ' · ' + sp.kat.name + ' · ' + stufeName, { stufe: sp.stufe === 'profi' ? 'schwer' : sp.stufe, modus: sp.netz + '-' + sp.modus, kat: sp.kat.id, rekord: alt != null && summe > alt });
  $('ton-song').innerHTML = '<div class="ton-merk">' + M.emoji + ' ' + M.name + ' · ' + sp.kat.emoji + ' ' + sp.kat.name + '</div><div class="farb-summe">' + fmt(summe) + ' / 50</div>'
    + '<p class="gb-info">' + (summe >= 45 ? 'Du kennst deine Musik!' : summe >= 30 ? 'Gut gehört.' : 'Gar nicht so leicht, oder?') + (alt != null && summe > alt ? ' 🏆 Neuer Bestwert!' : alt != null ? ' Bestwert: ' + fmt(alt) : '') + '</p>'
    + '<ul class="sp-rueckblick">' + sp.runden.map((R, i) => '<li>' + (R.T.bild ? '<img src="' + spEsc(R.T.bild) + '" alt="" width="40" height="40">' : '<span>🎵</span>') + '<span><b>' + spEsc(R.T.name) + '</b><small>' + spEsc(R.T.kuenstler) + (R.T.jahr ? ' · ' + R.T.jahr : '') + '</small></span><em>' + fmt(sp.punkte[i] || 0) + '</em></li>').join('') + '</ul>'
    + '<div class="gb-knoepfe"><button type="button" class="btn ton-gross" id="spNochmalSpiel">Nochmal</button><button type="button" class="btn secondary" id="srZurMenue">Zum Song-Rätsel</button></div>';
  $('spNochmalSpiel').addEventListener('click', () => { if (sp.abspielen === 'browser') dzEntsperren(); spStart(sp.stufe); });
  $('srZurMenue').addEventListener('click', () => srMenue());
}

// ---------- Einrichtung / Verbindung (im Song-Rätsel-Menü) ----------
const spBestKey = (netz, modus, stufe) => (netz === 'deezer' ? 'deezer-' + modus + '-' + stufe : modus === 'jahr' ? 'spotify-jahr-' + stufe : 'spotify-' + stufe);
function spMenueHtml() {
  const st = spStore(), W = spWahl(), dz = W.netz !== 'spotify', fehler = st.fehler;
  if (fehler) { delete st.fehler; spSave(st); }
  return '<div class="sr-eigen sp-box' + (dz ? ' dz' : '') + '"><h3>🎧 Echte Songs</h3>'
    + '<div class="sr-quelle sp-netz"><button type="button" data-netz="deezer" class="' + (dz ? 'on' : '') + '">🌐 Deezer<small>im Browser · ohne Anmeldung</small></button><button type="button" data-netz="spotify" class="' + (dz ? '' : 'on') + '">🟢 Spotify<small>über die Spotify-App</small></button></div>'
    + (fehler ? '<div class="gb-text sp-fehler">' + fehler.replace(/</g, '&lt;') + '</div>' : '')
    + (dz ? spSpielwahlHtml('deezer') + '<p class="gb-fein">Spielt 30-Sekunden-Hörproben von Deezer direkt hier – keine App, kein Konto. Nur für die private Nutzung im Familienkreis (Deezer-Bedingungen).</p>'
      : '<div class="gb-text sp-warnung">⚠️ <b>Spotify erlaubt keine Quiz-Spiele.</b> In Spotifys Entwickler-Regeln steht: „Do not create a game, including trivia quizzes“ – ein „Name that tune“-Quiz wird dort ausdrücklich als Beispiel genannt. Im schlimmsten Fall sperrt Spotify deine Entwickler-App (nicht dein Musik-Konto). Nutzung auf eigenes Risiko.</div>'
      + (spAngemeldet() ? spSpielwahlHtml('spotify')
        : '<details class="sr-warum sp-anleitung"' + (st.clientId ? '' : ' open') + '><summary>Spotify einrichten (kostenlos, ca. 3 Minuten)</summary><ol>'
        + '<li>Am Computer oder Handy <b>developer.spotify.com/dashboard</b> öffnen und mit deinem Spotify-Konto anmelden.</li>'
        + '<li><b>Create app</b>: Name z. B. „Spielekiste“, Beschreibung egal, bei „Which API/SDKs“ <b>Web API</b> ankreuzen.</li>'
        + '<li>Als <b>Redirect URI</b> genau diese Adresse eintragen:<br><code id="spUri">' + spRedirect().replace(/</g, '&lt;') + '</code> <button type="button" class="sp-kopier" id="spKopier">Kopieren</button></li>'
        + '<li>Speichern, dann die <b>Client ID</b> kopieren und hier einfügen.</li></ol>'
        + (/^https:/.test(location.protocol) ? '' : '<p class="gb-fein">⚠️ Spotify verlangt eine HTTPS-Adresse. Über diese Adresse hier klappt die Anmeldung nicht.</p>') + '</details>'
        + '<input class="sp-id" id="spId" type="text" inputmode="latin" autocomplete="off" spellcheck="false" placeholder="Client ID (32 Zeichen)" value="' + (st.clientId || '') + '">'
        + '<button type="button" class="btn ton-gross" id="spVerbinden">🟢 Mit Spotify verbinden</button>'))
    + '</div>';
}
function spSpielwahlHtml(netz) {
  const W = spWahl(), best = tonStore().song || {}, stufe = (sr && sr.stufe) || 'leicht', dz = netz === 'deezer';
  const kats = SP_KATEGORIEN.filter((k) => !dz || (k.id !== 'fav' && k.id !== 'bib'));
  const K = kats.find((k) => k.id === W.kat) || spKat('80er');
  const b = best[spBestKey(netz, W.modus, stufe)];
  const S = (W.modus === 'jahr' ? SP_JAHR_STUFEN : SP_STUFEN)[stufe];
  return '<div class="gb-modi sr-modi">' + Object.entries(SP_MODI).map(([k, m]) => '<button type="button" class="gb-modus' + (k === W.modus ? ' on' : '') + '" data-spm="' + k + '"><span>' + m.emoji + '</span><b>' + m.name + '</b><small>' + m.text + '</small></button>').join('') + '</div>'
    + '<div class="sp-kats">' + kats.map((k) => '<button type="button" data-kat="' + k.id + '" class="' + (k.id === K.id ? 'on' : '') + '"><span>' + k.emoji + '</span>' + k.name + '</button>').join('') + '</div>'
    + (K.id === 'bib' ? '<p class="gb-fein">' + K.text + '</p>' : '<div class="sr-quelle sp-hits"><button type="button" data-hits="1" class="' + (W.hits ? 'on' : '') + '">⭐ Große Hits<small>bekannte Songs</small></button><button type="button" data-hits="0" class="' + (W.hits ? '' : 'on') + '">🔍 Auch Unbekanntes<small>tiefer in den Katalog</small></button></div>')
    + '<p class="gb-fein">' + SR_STUFE_NAMEN[stufe] + ': ' + (dz || W.wo !== 'app' ? S.text.replace('vom Anfang', 'vom Anfang der Hörprobe').replace('irgendwo im Song', 'irgendwo in der Hörprobe') : S.text) + (b != null ? ' · Bestwert ' + fmt(b) + ' / 50' : '') + '</p>'
    + '<button type="button" class="btn ton-gross" id="spLos">▶︎ ' + K.emoji + ' ' + K.name + ' – los!</button>'
    + (dz ? '' : '<div class="sr-quelle sp-wo"><button type="button" data-wo="browser" class="' + (W.wo !== 'app' ? 'on' : '') + '">🌐 Im Browser<small>Hörprobe · ohne Spotify-App</small></button><button type="button" data-wo="app" class="' + (W.wo === 'app' ? 'on' : '') + '">📱 Spotify-App<small>ganze Songs · App muss laufen</small></button></div>'
      + '<p class="gb-fein">' + (W.wo === 'app' ? 'Läuft über deine Spotify-App – vorher einmal öffnen.' : 'Spotify sucht die Songs aus, abgespielt wird derselbe Song als 30-Sekunden-Hörprobe von Deezer – direkt hier.') + ' <button type="button" class="sp-kopier" id="spAb">Spotify trennen</button></p>');
}
function spWahlSetzen(x) { const st = spStore(); st.wahl = { ...spWahl(), ...x }; spSave(st); srMenue(); }
function spMenueVerdrahten() {
  if ($('spLos')) $('spLos').addEventListener('click', () => { if (spImBrowser()) dzEntsperren(); spStart(sr.stufe || 'leicht'); });
  document.querySelectorAll('[data-wo]').forEach((b) => b.addEventListener('click', () => spWahlSetzen({ wo: b.dataset.wo })));
  document.querySelectorAll('[data-netz]').forEach((b) => b.addEventListener('click', () => spWahlSetzen({ netz: b.dataset.netz })));
  document.querySelectorAll('[data-spm]').forEach((b) => b.addEventListener('click', () => spWahlSetzen({ modus: b.dataset.spm })));
  document.querySelectorAll('[data-kat]').forEach((b) => b.addEventListener('click', () => spWahlSetzen({ kat: b.dataset.kat })));
  document.querySelectorAll('[data-hits]').forEach((b) => b.addEventListener('click', () => spWahlSetzen({ hits: b.dataset.hits === '1' })));
  if ($('spAb')) $('spAb').addEventListener('click', () => { spAbmelden(); srMenue(); });
  if ($('spKopier')) $('spKopier').addEventListener('click', () => { try { navigator.clipboard.writeText(spRedirect()); $('spKopier').textContent = 'Kopiert ✓'; } catch (e) { /* manuell */ } });
  if ($('spVerbinden')) $('spVerbinden').addEventListener('click', () => {
    const id = $('spId').value.trim();
    if (!/^[0-9a-f]{32}$/i.test(id)) { $('spId').classList.add('falsch'); $('spId').focus(); return; }
    const st = spStore(); st.clientId = id; spSave(st); spAnmelden();
  });
}
// Rückkehr nach der Anmeldung → direkt ins Song-Rätsel
spRueckkehr().then((war) => {
  if (!war) return;
  const los = () => { try { sr = null; srMenue(); setTimeout(() => { const b = document.querySelector('.sp-box'); if (b) b.scrollIntoView({ block: 'center' }); }, 200); } catch (e) { /* App noch nicht bereit */ } };
  if (document.readyState === 'complete') setTimeout(los, 300); else window.addEventListener('load', () => setTimeout(los, 300));
});
