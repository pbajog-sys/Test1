// 🟢 Spotify im Song-Rätsel: „Song erkennen“ mit Songs aus deiner Spotify-Bibliothek.
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

// Titel aus „Lieblingssongs“ und „Meistgehört“ (max. 300, für eine Stunde zwischengespeichert)
async function spTitel(neu) {
  const st = spStore();
  if (!neu && st.titel && st.titel.z > Date.now() - 3600000 && st.titel.liste.length >= 4) return st.titel.liste;
  const liste = [], gesehen = new Set();
  const dazu = (t) => { if (t && t.uri && !gesehen.has(t.uri) && t.type === 'track' && !t.is_local) { gesehen.add(t.uri); liste.push({ uri: t.uri, name: t.name, kuenstler: (t.artists || []).map((a) => a.name).join(', '), dauer: t.duration_ms, bild: t.album && t.album.images && t.album.images.length ? t.album.images[t.album.images.length - 1].url : '' }); } };
  for (const zeit of ['short_term', 'medium_term']) { try { const j = await spApi('/me/top/tracks?limit=50&time_range=' + zeit); (j.items || []).forEach(dazu); } catch (e) { if (e.status === 401) throw e; } }
  for (let off = 0; off < 200; off += 50) { const j = await spApi('/me/tracks?limit=50&offset=' + off); (j.items || []).forEach((x) => dazu(x.track)); if (!j.next) break; }
  const s = spStore(); s.titel = { z: Date.now(), liste: liste.slice(0, 300) }; spSave(s);
  return s.titel.liste;
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
async function spPause() { spLauf++; try { await spApi('/me/player/pause', { method: 'PUT' }); } catch (e) { /* schon pausiert */ } }

// ---------- Partie „Song erkennen“ ----------
const SP_STUFEN = { leicht: { dauer: 4000, intro: true, opt: 4, hoeren: 3, text: '4 Sekunden vom Anfang · 4 Antworten' }, mittel: { dauer: 2000, intro: false, opt: 4, hoeren: 2, text: '2 Sekunden irgendwo im Song · 4 Antworten' }, profi: { dauer: 1000, intro: false, opt: 6, hoeren: 1, text: '1 Sekunde irgendwo im Song · 6 Antworten' } };
let sp = null;
async function spStart(stufe) {
  const box = $('ton-song'), S = SP_STUFEN[stufe];
  zeigeTonTeil('song');
  box.innerHTML = '<div class="ton-merk">🟢 Spotify wird vorbereitet …</div>';
  try {
    const titel = await spTitel(), geraet = await spGeraet();
    if (titel.length < 4) throw new Error('Zu wenige Songs: Speichere in Spotify mindestens 4 Lieblingssongs (♥).');
    if (!geraet) { spHinweis('📱 Kein Spotify-Gerät gefunden. Öffne die Spotify-App (Handy oder Computer), spiel kurz irgendeinen Song an und tippe dann nochmal auf „Los“.'); return; }
    const r = Math.random, pool = titel.slice().sort(() => r() - 0.5), runden = [];
    for (let i = 0; i < SR_RUNDEN && i < pool.length; i++) {
      const T = pool[i], andere = titel.filter((x) => x !== T && x.name !== T.name).sort(() => r() - 0.5).slice(0, S.opt - 1);
      const pos = S.intro ? 0 : (T.dauer || 180000) * (0.25 + r() * 0.45);
      runden.push({ T, pos, optionen: [T, ...andere].sort(() => r() - 0.5), gehoert: 0, antwort: null });
    }
    sp = { stufe, geraet, runden, i: 0, punkte: [] };
    spRunde();
  } catch (e) { spHinweis(spFehlerText(e)); }
}
function spFehlerText(e) {
  if (e.status === 401 || /nicht angemeldet/.test(e.message)) { spAbmelden(); return '🔑 Die Spotify-Anmeldung ist abgelaufen. Bitte neu verbinden.'; }
  if (e.status === 403 && e.grund === 'PREMIUM_REQUIRED') return '💳 Spotify erlaubt das Steuern der Wiedergabe nur mit Premium.';
  if (e.status === 403) return '⛔ Spotify verweigert den Zugriff. Steht deine Spotify-E-Mail in deinem Entwickler-Dashboard unter „User Management“?';
  if (e.status === 404) return '📱 Spotify-Gerät nicht erreichbar. Spotify-App öffnen, kurz etwas abspielen, dann nochmal.';
  return '⚠️ ' + e.message;
}
function spHinweis(text) {
  $('ton-song').innerHTML = '<div class="ton-merk">🟢 Spotify</div><div class="gb-text">' + text + '</div><button type="button" class="btn ton-gross" id="spNochmal">Nochmal versuchen</button><button type="button" class="btn secondary" id="spMenue">← Zum Song-Rätsel</button>';
  $('spNochmal').addEventListener('click', () => spStart((sp && sp.stufe) || (sr && sr.stufe) || 'leicht'));
  $('spMenue').addEventListener('click', () => srMenue());
}
const spTitelText = (T) => '<b>' + T.name.replace(/</g, '&lt;') + '</b><small>' + T.kuenstler.replace(/</g, '&lt;') + '</small>';
function spRunde() {
  const R = sp.runden[sp.i], S = SP_STUFEN[sp.stufe];
  $('ton-song').innerHTML = '<div class="gb-kopf"><span>🟢 Song erkennen · ' + { leicht: 'Leicht', mittel: 'Mittel', profi: 'Profi' }[sp.stufe] + '</span><span>' + (sp.i + 1) + ' / ' + sp.runden.length + ' · ' + fmt(sp.punkte.reduce((a, b) => a + b, 0)) + ' P.</span></div>'
    + '<div class="gb-balken"><i style="width:' + Math.round((sp.i / sp.runden.length) * 100) + '%"></i></div>'
    + '<div class="ton-merk">Welcher Song ist das?</div><div class="sr-platte sp" id="srPlatte" aria-hidden="true"><i></i></div>'
    + '<button type="button" class="gb-hoeren" id="spHoeren">▶︎ ' + S.dauer / 1000 + ' Sek. anspielen</button><p class="gb-fein" id="spRest">Läuft über „' + sp.geraet.name.replace(/</g, '&lt;') + '“</p>'
    + '<div class="gb-optionen sr-optionen sp-optionen">' + R.optionen.map((T, i) => '<button type="button" class="gb-opt" data-o="' + i + '">' + spTitelText(T) + '</button>').join('') + '</div><div class="gb-urteil" id="srUrteil"></div>';
  const rest = () => { $('spRest').textContent = R.gehoert >= S.hoeren ? 'Nicht mehr anhörbar – jetzt raten!' : 'Noch ' + (S.hoeren - R.gehoert) + '× anhören · läuft über „' + sp.geraet.name + '“'; $('spHoeren').disabled = R.gehoert >= S.hoeren; };
  const spiel = async () => {
    if (R.gehoert >= S.hoeren || R.antwort !== null) return;
    R.gehoert++; rest(); $('spHoeren').disabled = true;
    try { await spAusschnitt(sp.geraet, R.T.uri, R.pos, S.dauer, () => { const p = $('srPlatte'); if (p) p.classList.add('dreht'); }); }
    catch (e) { spHinweis(spFehlerText(e)); return; }
    const p = $('srPlatte'); if (p) p.classList.remove('dreht');
    if ($('spHoeren')) rest();
  };
  $('spHoeren').addEventListener('click', spiel);
  $('ton-song').querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => spAntwort(R, R.optionen[Number(b.dataset.o)], b)));
  rest(); spiel();
}
function spAntwort(R, wahl, knopf) {
  if (R.antwort !== null) return;
  R.antwort = wahl; spPause();
  const ok = wahl === R.T, p = ok ? Math.max(4, 13 - 3 * Math.max(1, R.gehoert)) : 0;
  sp.punkte.push(p);
  $('ton-song').querySelectorAll('[data-o]').forEach((b) => { b.disabled = true; if (R.optionen[Number(b.dataset.o)] === R.T) b.classList.add('richtig'); });
  if (!ok) knopf.classList.add('falsch');
  $('spHoeren').hidden = true; $('spRest').hidden = true;
  if (navigator.vibrate) navigator.vibrate(ok ? 15 : [40, 40, 40]);
  $('srUrteil').innerHTML = '<div class="gb-text">' + (ok ? '✅ Erkannt' + (R.gehoert <= 1 ? ' – nach einmal Hören!' : ' – nach ' + R.gehoert + '× Hören.') : '❌ Das war <b>' + R.T.name.replace(/</g, '&lt;') + '</b> von ' + R.T.kuenstler.replace(/</g, '&lt;') + '.') + '</div>'
    + '<div class="gb-knoepfe"><button type="button" class="btn secondary" id="spWeiterhoeren">🔊 15 Sek. weiterhören</button></div>'
    + '<button type="button" class="btn ton-gross" id="srWeiter">' + (sp.i + 1 < sp.runden.length ? 'Weiter →' : 'Auswertung') + '</button>';
  $('spWeiterhoeren').addEventListener('click', () => spAusschnitt(sp.geraet, R.T.uri, R.pos, 15000).catch((e) => spHinweis(spFehlerText(e))));
  $('srWeiter').addEventListener('click', () => { spPause(); sp.i++; if (sp.i < sp.runden.length) spRunde(); else spEnde(); });
}
function spEnde() {
  const max = sp.runden.length * 10, summe = Math.round((sp.punkte.reduce((a, b) => a + b, 0) / max) * 50 * 10) / 10, k = 'spotify-' + sp.stufe;
  const st = tonStore(); st.song = st.song || {}; const alt = st.song[k] != null ? st.song[k] : null; st.song[k] = Math.max(alt || 0, summe); saveJson(TON_KEY, st);
  const stufeName = { leicht: 'Leicht', mittel: 'Mittel', profi: 'Profi' }[sp.stufe];
  if (typeof merkeVerlauf === 'function') merkeVerlauf('toene', summe, 50, 'Song-Rätsel: Spotify · ' + stufeName, { stufe: sp.stufe === 'profi' ? 'schwer' : sp.stufe, modus: 'song-spotify', rekord: alt != null && summe > alt });
  $('ton-song').innerHTML = '<div class="ton-merk">🟢 Song erkennen · ' + stufeName + '</div><div class="farb-summe">' + fmt(summe) + ' / 50</div>'
    + '<p class="gb-info">' + (summe >= 45 ? 'Du kennst deine Musik!' : summe >= 30 ? 'Gut erkannt.' : 'Gar nicht so leicht, oder?') + (alt != null && summe > alt ? ' 🏆 Neuer Bestwert!' : alt != null ? ' Bestwert: ' + fmt(alt) : '') + '</p>'
    + '<div class="gb-knoepfe"><button type="button" class="btn ton-gross" id="spNochmalSpiel">Nochmal</button><button type="button" class="btn secondary" id="srZurMenue">Zum Song-Rätsel</button></div>';
  $('spNochmalSpiel').addEventListener('click', () => spStart(sp.stufe));
  $('srZurMenue').addEventListener('click', () => srMenue());
}

// ---------- Einrichtung / Verbindung (im Song-Rätsel-Menü) ----------
function spMenueHtml() {
  const st = spStore(), an = spAngemeldet(), fehler = st.fehler;
  if (fehler) { delete st.fehler; spSave(st); }
  return '<div class="sr-eigen sp-box"><h3>🟢 Spotify</h3>'
    + (fehler ? '<div class="gb-text sp-fehler">' + fehler.replace(/</g, '&lt;') + '</div>' : '')
    + (an ? '<p class="gb-fein">✅ Verbunden. Modus „Song erkennen“: kurze Ausschnitte aus deinen Lieblingssongs und Meistgehörten – welcher ist es? Läuft über deine Spotify-App (vorher einmal öffnen).</p><div class="gb-knoepfe"><button type="button" class="btn ton-gross" id="spLos">▶︎ Song erkennen</button><button type="button" class="btn secondary" id="spAb">Trennen</button></div>'
      : '<p class="gb-fein">Spielt Ausschnitte aus <b>deiner</b> Bibliothek über deine Spotify-App (Premium nötig). Rückwärts und Tonerkennung gehen mit Spotify nicht – dafür eigene Dateien nehmen.</p>'
      + '<details class="sr-warum sp-anleitung"' + (st.clientId ? '' : ' open') + '><summary>Einmalig einrichten (kostenlos, ca. 3 Minuten)</summary><ol>'
      + '<li>Am Computer oder Handy <b>developer.spotify.com/dashboard</b> öffnen und mit deinem Spotify-Konto anmelden.</li>'
      + '<li><b>Create app</b>: Name z. B. „Spielekiste“, Beschreibung egal, bei „Which API/SDKs“ <b>Web API</b> ankreuzen.</li>'
      + '<li>Als <b>Redirect URI</b> genau diese Adresse eintragen:<br><code id="spUri">' + spRedirect().replace(/</g, '&lt;') + '</code> <button type="button" class="sp-kopier" id="spKopier">Kopieren</button></li>'
      + '<li>Speichern, dann die <b>Client ID</b> kopieren und hier einfügen.</li></ol>'
      + (/^https:/.test(location.protocol) ? '' : '<p class="gb-fein">⚠️ Spotify verlangt eine HTTPS-Adresse. Über diese Adresse hier klappt die Anmeldung nicht.</p>') + '</details>'
      + '<input class="sp-id" id="spId" type="text" inputmode="latin" autocomplete="off" spellcheck="false" placeholder="Client ID (32 Zeichen)" value="' + (st.clientId || '') + '">'
      + '<button type="button" class="btn ton-gross" id="spVerbinden">🟢 Mit Spotify verbinden</button>')
    + '</div>';
}
function spMenueVerdrahten() {
  if ($('spLos')) $('spLos').addEventListener('click', () => spStart(sr.stufe || 'leicht'));
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
  const los = () => { try { show('toene', '🎧 Ton-Gedächtnis'); sr = null; srMenue(); setTimeout(() => { const b = document.querySelector('.sp-box'); if (b) b.scrollIntoView({ block: 'center' }); }, 200); } catch (e) { /* App noch nicht bereit */ } };
  if (document.readyState === 'complete') setTimeout(los, 300); else window.addEventListener('load', () => setTimeout(los, 300));
});
