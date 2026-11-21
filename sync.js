// ☁️ Spielstand-Sync mit Benutzerkonto (Name + PIN) über den eigenen Homeserver.
// Server: werkzeuge/homeserver/spielstand-server.js hinter Caddy unter ./api/ auf derselben Adresse wie die App.
// Gibt es dort keinen solchen Server (z. B. GitHub Pages), bleibt alles wie bisher: nur lokaler Speicher, kein ☁️-Knopf.
//
// Anmelden: Beim ersten Besuch fragt die App einmal „Anmelden oder neu registrieren?“ (oder „Ohne Konto spielen“).
// Danach merkt sich das Gerät die Anmeldung (Cookie, 1 Jahr). Über ☁️ kann man sich später an- und abmelden.
//
// Abgleich – vollautomatisch, ohne Rückfragen, Eintrag für Eintrag (jedes Spiel hat eigene „walquiz.“-Einträge):
//  • Nach dem Spielen (Prüfung alle 5 s) und beim Verlassen der App werden geänderte Einträge hochgeladen.
//  • Beim Öffnen und beim Zurückkehren in die App holt sich das Gerät den neuesten Stand; gab es Neues von einem
//    anderen Gerät, lädt die App einmal neu („Spielstand aktualisiert“).
//  • Was beim Öffnen schon anders ist (Kleinkram vom Programmstart, alter Stand eines lange nicht benutzten Geräts),
//    zählt als „alt“: Es setzt sich nur durch, wo kein anderes Gerät inzwischen etwas geändert hat.
//  • Haben zwei Geräte gleichzeitig denselben Eintrag geändert, gewinnt die zuletzt angekommene Änderung.
//    Zusätzlich legt der Server täglich eine Kopie an.
//
// Bestenliste: Bei jedem Abgleich geht eine kleine öffentliche Zusammenfassung mit (Level, XP, Titel, Avatar, Serie,
// Fähigkeitswerte) – nur wenn sie sich geändert hat. Im Dashboard zeigt „🌍 Bestenliste“ alle registrierten Spieler,
// Antippen vergleicht die Fähigkeiten im Radar.
const SY_META = 'spielekiste-sync';   // bewusst ohne „walquiz.“ – wird selbst nicht synchronisiert und nicht gesichert
const SY_SPAETER = 'spielekiste-konto-spaeter';
const SY_API = new URL('api/', location.href).href;
// gerätebezogen, nur Zwischenspeicher oder geheim (Spotify-Zugangsschlüssel bleiben auf dem Gerät)
const SY_NIE = ['walquiz.sicherung.v1', 'walquiz.installhinweis.v1', 'walquiz.photos.v4', 'walquiz.spotify.v1'];
const SY_TAKT = 5000;

let syZustand = 'aus';    // 'aus' (kein Server) | 'abgemeldet' | 'ok' | 'offline' (war angemeldet, Server gerade nicht erreichbar)
let syName = '';
let syAdmin = false;      // Betreiber: sieht „Server aktualisieren“
let syLaeuft = false;     // gerade ein Abgleich unterwegs
let syGestartet = false;  // Takt und Ereignisse schon eingerichtet
let syGeaendert = true;   // hat das Spiel seit dem letzten Abgleich etwas gespeichert? (spart das Durchrechnen alle 5 s)
try {
  const setzen = Storage.prototype.setItem, loeschen = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) { if (this === window.localStorage && String(k).startsWith('walquiz.')) syGeaendert = true; return setzen.call(this, k, v); };
  Storage.prototype.removeItem = function (k) { if (this === window.localStorage && String(k).startsWith('walquiz.')) syGeaendert = true; return loeschen.call(this, k); };
} catch (e) { /* dann wird eben immer gerechnet */ }

const syMeta = () => { try { return JSON.parse(localStorage.getItem(SY_META) || '{}'); } catch (e) { return {}; } };
const syMetaSetzen = (x) => { try { localStorage.setItem(SY_META, JSON.stringify(Object.assign(syMeta(), x))); } catch (e) { /* voll */ } };

function sySchluessel() {
  const l = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('walquiz.') && !SY_NIE.includes(k)) l.push(k); } } catch (e) { /* kein Speicher */ }
  return l.sort();
}
function syDaten() { const d = {}; sySchluessel().forEach((k) => { d[k] = localStorage.getItem(k); }); return d; }
const syHash = (t) => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36) + '.' + t.length; };
const syHashes = (daten) => { const h = {}; Object.entries(daten).forEach(([k, v]) => { h[k] = syHash(v); }); return h; };
// Was hat sich hier seit dem letzten Abgleich geändert? (v: null = gelöscht)
function syAenderungen(daten, alt) {
  const h = syMeta().h || {}, a = {};
  Object.entries(daten).forEach(([k, v]) => { if (h[k] !== syHash(v)) a[k] = alt ? { v, alt: true } : { v }; });
  Object.keys(h).forEach((k) => { if (!(k in daten)) a[k] = alt ? { v: null, alt: true } : { v: null }; });
  return a;
}
const syHierNeu = () => Object.keys(syAenderungen(syDaten(), false)).length > 0;
function syGeraet() {
  const u = navigator.userAgent;
  if (/iPhone/.test(u)) return 'iPhone'; if (/iPad/.test(u)) return 'iPad'; if (/Android/.test(u)) return 'Android';
  if (/Windows/.test(u)) return 'Windows-PC'; if (/Macintosh/.test(u)) return 'Mac'; return 'Gerät';
}
const syZeit = (t) => { try { return new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(t); } };
const syEsc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Server ----------
async function syApi(weg, methode = 'GET', koerper) {
  const r = await fetch(SY_API + weg, { method: methode, cache: 'no-store', credentials: 'same-origin', headers: koerper ? { 'Content-Type': 'application/json' } : {}, body: koerper ? JSON.stringify(koerper) : undefined });
  let json = null; try { json = await r.json(); } catch (e) { /* keine JSON-Antwort */ }
  return { status: r.status, json };
}
// Gibt es hier einen Spielstand-Server, und ist dieses Gerät angemeldet?
async function syPruefen() {
  try {
    const { status, json } = await syApi('ich');
    if (status === 200 && json && json.name) { syName = json.name; syAdmin = !!json.admin; return 'ok'; }
    if (status === 401 && json && json.server === 'spielekiste') return 'abgemeldet';
    if (status === 502 || status === 503 || status === 504) return 'offline';   // Caddy da, Konto-Server dahinter nicht (GitHub Pages sagt 404)
  } catch (e) { /* offline oder kein Server */ }
  return 'aus';
}

// ---------- Abgleich ----------
// alt: Änderungen gelten als „beim Öffnen bemerkt“ (siehe oben). ladenErlaubt: Neues vom Server übernehmen und neu laden.
async function syAbgleich({ alt = false, ladenErlaubt = false } = {}) {
  if (syZustand !== 'ok' || syLaeuft) return;
  syLaeuft = true;
  try {
    if (!syGeaendert && !ladenErlaubt) return;
    syGeaendert = false;
    const m = syMeta(), vorher = syDaten(), aend = syAenderungen(vorher, alt), basis = m.h ? (m.version || 0) : 0;   // ohne Eintrags-Merkliste (frisch angemeldet, alte Version): alles vom Server ist neuer
    if (!Object.keys(aend).length && !ladenErlaubt) return;
    syAnimation('laeuft');
    const oe = syOeffentlich(), oeHash = oe ? syHash(JSON.stringify(oe)) : null, oeNeu = oe && oeHash !== m.oh;
    const { status, json } = await syApi('abgleich', 'POST', Object.assign({ basis, geraet: syGeraet(), stand: typeof APP_STAND !== 'undefined' ? APP_STAND : '', aenderungen: aend }, oeNeu ? { oeffentlich: oe } : {}));
    if (status === 401) { syZustand = 'abgemeldet'; return; }
    if (status !== 200 || !json) throw new Error('Sync: HTTP ' + status);
    if (oeNeu) { syMetaSetzen({ oh: oeHash }); syBestenliste(true); }
    const jetzt = syDaten(), h = Object.assign({}, syMeta().h || {});
    // Das Hochgeladene gilt als abgeglichen (was der Server verworfen hat, steht unten in „neu“ und wird übernommen)
    Object.entries(aend).forEach(([k, x]) => { if (x.v === null) delete h[k]; else h[k] = syHash(x.v); });
    const neu = json.neu || {};
    // Was hat ein anderes Gerät geändert, das hier anders ist? (Einträge, die sich während der Anfrage hier geändert haben, bleiben)
    const unterschiede = Object.keys(neu).filter((k) => !SY_NIE.includes(k) && (neu[k] === null ? k in jetzt : neu[k] !== jetzt[k]) && jetzt[k] === vorher[k]);
    if (!unterschiede.length || ladenErlaubt) {
      const merk = syGeaendert;   // eigenes Übernehmen zählt nicht als „im Spiel gespeichert“
      unterschiede.forEach((k) => { if (neu[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, neu[k]); });
      syGeaendert = merk;
      Object.entries(neu).forEach(([k, v]) => { if (v === null) delete h[k]; else h[k] = syHash(v); });
      syMetaSetzen({ version: json.version, h, zuletzt: Date.now() });
      if (unterschiede.length) {
        sessionStorage.setItem('spielekiste-sync-neu', '1');   // nach dem Neuladen: ☁️ leuchtet kurz auf (kein Text)
        location.reload();
      }
      return;
    }
    // Neues von einem anderen Gerät, aber gerade nicht der Moment zum Neuladen (mitten im Spiel / App im Hintergrund):
    // Version nicht weiterzählen – der nächste Abgleich beim Öffnen/Zurückkehren holt den Rest.
    syMetaSetzen({ h, zuletzt: Date.now() });
  } catch (e) {
    syGeaendert = true;   // beim nächsten Mal nochmal versuchen
    console.warn(e);
  } finally {
    syLaeuft = false;
    syKnopf();
    syAnimation('fertig');
  }
}

// ---------- Bestenliste ----------
// Öffentliche Zusammenfassung des gerade aktiven Spielers (wie im Dashboard berechnet)
function syOeffentlich() {
  try {
    if (typeof skDaten !== 'function') return null;
    const D = skDaten(), xp = skXP(D.E, D.tagesSt, D.expSt, D.erfolgSt).gesamt, lv = skLevel(xp);
    const pr = typeof aktivesProfil === 'function' ? aktivesProfil() : null;
    const z = typeof zusammenfassung === 'function' && typeof datenVon === 'function' && pr ? zusammenfassung(datenVon(pr.id)) : {};
    return { xp, level: lv.level, titel: '', avatar: pr ? pr.avatar : '🙂', farbe: pr ? pr.farbe : '#64748b',
      skills: D.skills.map((x) => (x.wert == null ? -1 : x.wert)), serie: skTagesSerie(D.tagesSt).serie || 0,
      abzeichen: z.abzeichen || 0, gelernt: z.gelernt || 0, runden: D.E.length, spiele: syMeistgespielt(D.E) };
  } catch (e) { return null; }
}
// Die 5 meistgespielten Spiele (Runden insgesamt)
function syMeistgespielt(E) {
  const n = {}; E.forEach((e) => { if (e.s) n[e.s] = (n[e.s] || 0) + 1; });
  return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, k]) => ({ s, n: k }));
}
const sySpiel = (s) => (typeof VERLAUF_SPIELE !== 'undefined' && VERLAUF_SPIELE[s]) || { name: s, emoji: '🎮' };
// Fähigkeiten eines Eintrags, stärkste zuerst (nur die mit Wert)
function syFaehigkeiten(e) {
  if (typeof SK_FAEHIGKEITEN === 'undefined') return [];
  return SK_FAEHIGKEITEN.map((f, i) => ({ f, w: (e.skills || [])[i] })).filter((x) => typeof x.w === 'number' && x.w >= 0).sort((a, b) => b.w - a.w);
}
const syVorHer = (t) => { const m = Math.round((Date.now() - t) / 60e3); return m < 2 ? 'gerade eben' : m < 60 ? 'vor ' + m + ' Min.' : m < 1440 ? 'vor ' + Math.round(m / 60) + ' Std.' : 'vor ' + Math.round(m / 1440) + ' Tagen'; };
let syListe = [], syListeZeit = 0;
async function syBestenliste(sofort) {
  if (syZustand !== 'ok') { ['syBestenliste', 'syTop3'].forEach((id) => { const b = document.getElementById(id); if (b) b.remove(); }); return; }
  if (!sofort && Date.now() - syListeZeit < 60e3) return;   // höchstens einmal pro Minute nachfragen
  try {
    const { status, json } = await syApi('bestenliste');
    if (status === 200 && Array.isArray(json)) { syListe = json; syListeZeit = Date.now(); }
  } catch (e) { /* offline – alte Liste bleibt */ }
  syListeZeigen();
}
function syListeZeigen() {
  const spalte = document.querySelector('#screen-hub .spalte-b');
  if (!spalte || syZustand !== 'ok') return;
  let box = document.getElementById('syBestenliste');
  if (!box) {
    box = document.createElement('div'); box.id = 'syBestenliste'; box.className = 'sk-unten';
    const familie = document.getElementById('hubFamilie');
    if (familie) spalte.insertBefore(box, familie); else spalte.appendChild(box);
  }
  const medaille = ['🥇', '🥈', '🥉'];
  box.innerHTML = '<h2 class="hub-h"><span>🌍</span> Bestenliste <small>' + syListe.length + ' Spieler</small></h2>'
    + (syListe.length ? '<div class="sk-letzte">' + syListe.map((e, i) => {
      const top = syFaehigkeiten(e)[0], lieb = (e.spiele || [])[0];
      // kurz halten, damit es aufs Handy passt: „Lvl 4 · 🧠 Logik 72 · ❤️ 🕵️ · 🔥 3“
      const unten = ['Lvl ' + e.level]
        .concat(top ? [top.f.emoji + ' ' + top.f.kurz + ' ' + top.w] : [])
        .concat(lieb ? ['❤️ ' + sySpiel(lieb.s).emoji] : [])
        .concat(e.serie ? ['🔥 ' + e.serie] : []);
      return '<button type="button" class="sk-letzt" data-sp="' + i + '" title="' + syEsc(e.name + (lieb ? ' – spielt am liebsten ' + sySpiel(lieb.s).name : '')) + '" style="width:100%;border:0;text-align:left;color:inherit;font:inherit;cursor:pointer' + (e.ich ? ';box-shadow:inset 0 0 0 2px #f59e0b' : '') + '">'
        + '<span style="min-width:1.6em;text-align:center">' + (medaille[i] || '<small style="font-size:.85rem;color:#8b8bab">' + (i + 1) + '.</small>') + '</span>'
        + '<span>' + syEsc(e.avatar) + '</span>'
        + '<div><b>' + syEsc(e.name) + (e.ich ? ' (du)' : '') + '</b><small>' + syEsc(unten.join(' · ')) + '</small></div>'
        + '<i>' + (typeof fmt === 'function' ? fmt(e.xp) : e.xp) + ' XP</i></button>';
    }).join('') + '</div><p class="sk-fein" style="margin:2px 0 0;font-size:.75rem">Antippen für Details und Vergleich</p>'
      : '<p class="sk-fein">Noch niemand dabei.</p>');
  box.querySelectorAll('[data-sp]').forEach((b) => b.addEventListener('click', () => sySpielerZeigen(syListe[Number(b.dataset.sp)], Number(b.dataset.sp))));
  syTop3Zeigen();
}
// Ganz oben im Dashboard: Podest der Top 3 und eigener Platz
function syTop3Zeigen() {
  const hub = document.getElementById('screen-hub');
  let box = document.getElementById('syTop3');
  if (!hub || syZustand !== 'ok' || !syListe.length) { if (box) box.remove(); return; }
  if (!box) {
    box = document.createElement('div'); box.id = 'syTop3'; box.className = 'sy-top3';
    const seite = hub.querySelector('.spalte-b');   // Seitenleiste am PC; am Handy sortiert CSS (order) es nach oben
    if (seite) seite.insertBefore(box, seite.firstChild); else hub.insertBefore(box, hub.firstChild);
  }
  const ichI = syListe.findIndex((e) => e.ich), medaille = ['🥇', '🥈', '🥉'];
  box.innerHTML = '<div class="sy-top3-kopf"><b>🏆 Bestenliste</b><small>' + (ichI >= 0 ? 'Du: Platz ' + (ichI + 1) + ' von ' + syListe.length : syListe.length + ' Spieler') + '</small></div>'
    + '<div class="sy-podest">' + syListe.slice(0, 3).map((e, i) => '<button type="button" class="sy-platz' + (e.ich ? ' ich' : '') + '" data-top="' + i + '">'
      + '<span class="sy-med">' + medaille[i] + '</span><span class="sy-av">' + syEsc(e.avatar) + '</span><b>' + syEsc(e.name) + '</b><small>' + (typeof fmt === 'function' ? fmt(e.xp) : e.xp) + ' XP</small></button>').join('') + '</div>'
    + '<div class="sy-top3-fuss">'
    + '<button type="button" class="sy-chip" data-zu="syBestenliste">Ganze Liste ›</button>'
    + (syListe.length > 1 ? '' : '<span class="sy-chip" style="cursor:default">Lade Freunde ein – sie melden sich einfach auf der Seite an</span>')
    + '</div>';
  box.querySelectorAll('[data-top]').forEach((b) => b.addEventListener('click', () => sySpielerZeigen(syListe[Number(b.dataset.top)], Number(b.dataset.top))));
  box.querySelectorAll('[data-zu]').forEach((b) => b.addEventListener('click', () => { const z = document.getElementById(b.dataset.zu); if (z) z.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
}
// Detailkarte eines Spielers: Fähigkeiten als Balken, meistgespielte Spiele, Vergleich
function sySpielerZeigen(e, platz) {
  if (!e) return;
  const balken = (w, farbe) => '<span style="flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:' + w + '%;background:' + farbe + '"></i></span>';
  const zeile = (links, w, rechts, farbe) => '<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="min-width:8.5em">' + links + '</span>' + balken(w, farbe) + '<b style="min-width:2.6em;text-align:right;font-variant-numeric:tabular-nums">' + rechts + '</b></div>';
  const fae = syFaehigkeiten(e), spiele = e.spiele || [], maxN = Math.max(1, ...spiele.map((x) => x.n));
  const d = skDialog('<h3>' + syEsc(e.avatar) + ' ' + syEsc(e.name) + (e.ich ? ' (du)' : '') + '</h3>'
    + '<ul class="ft-check"><li><b>Platz</b><span>' + (platz + 1) + '. von ' + syListe.length + '</span></li>'
    + '<li><b>Level</b><span>' + e.level + '</span></li>'
    + '<li><b>Erfahrung</b><span>' + (typeof fmt === 'function' ? fmt(e.xp) : e.xp) + ' XP · ' + e.runden + ' Runden</span></li>'
    + (e.serie ? '<li><b>Serie</b><span>🔥 ' + e.serie + ' Tage</span></li>' : '')
    + (e.abzeichen ? '<li><b>Abzeichen</b><span>🏅 ' + e.abzeichen + '</span></li>' : '')
    + '<li><b>Zuletzt aktiv</b><span>' + (e.zeit ? syVorHer(e.zeit) : '–') + '</span></li></ul>'
    + '<h4 style="margin:14px 0 4px">Stärken</h4>'
    + (fae.length ? fae.map((x) => zeile(x.f.emoji + ' ' + x.f.kurz, x.w, x.w, '#f59e0b')).join('') : '<p class="ft-klein">Noch zu wenig gespielt.</p>')
    + '<h4 style="margin:14px 0 4px">Spielt am meisten</h4>'
    + (spiele.length ? spiele.map((x) => zeile(sySpiel(x.s).emoji + ' ' + syEsc(sySpiel(x.s).name), Math.round((x.n / maxN) * 100), x.n + '×', sySpiel(x.s).farbe || '#38bdf8')).join('') : '<p class="ft-klein">Noch nichts gespielt.</p>')
    + (e.ich ? '' : '<button type="button" class="btn secondary" id="syVgl">📊 Mit mir vergleichen</button>'));
  if (d.querySelector('#syVgl')) d.querySelector('#syVgl').addEventListener('click', () => {
    d.close();
    if (typeof skProfilZeigen !== 'function') return;
    skProfilZeigen();
    skVergleich = { name: e.name, avatar: e.avatar, level: e.level, werte: (e.skills || []).map((v) => (v < 0 ? null : v)) };
    skProfilZeichnen();
  });
}

// ---------- ☁️-Knopf ----------
// Animation statt Text: pulsiert während des Abgleichs, leuchtet grün auf, wenn Neues von einem anderen Gerät kam
(function () {
  const st = document.createElement('style');
  st.textContent = '@keyframes sy-puls{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.88);opacity:.55}}'
    + '@keyframes sy-neu{0%{transform:scale(1);box-shadow:0 0 0 0 rgba(34,197,94,.9)}25%{transform:scale(1.25)}45%{transform:scale(.95)}65%{transform:scale(1.08)}100%{transform:scale(1);box-shadow:0 0 0 18px rgba(34,197,94,0)}}'
    + '@keyframes sy-neu-ruhig{0%{box-shadow:0 0 0 0 rgba(34,197,94,.9)}100%{box-shadow:0 0 0 18px rgba(34,197,94,0)}}'
    + '#syncBtn.sy-laeuft{animation:sy-puls 1s ease-in-out infinite}'
    + '#syncBtn.sy-neu{animation:sy-neu 1.4s ease-out 2;background:rgba(34,197,94,.25)}'
    + '@media (prefers-reduced-motion:reduce){#syncBtn.sy-laeuft{animation:none;opacity:.6}#syncBtn.sy-neu{animation:sy-neu-ruhig 1.4s ease-out 2}}';
  document.head.appendChild(st);
})();
let syAnimSeit = 0;
function syAnimation(art) {
  const b = document.getElementById('syncBtn');
  if (!b) return;
  if (art === 'laeuft') { if (b.classList.contains('sy-neu')) return; syAnimSeit = Date.now(); b.classList.add('sy-laeuft'); return; }   // Aufleuchten nicht unterbrechen
  if (art === 'fertig') { const rest = Math.max(0, 900 - (Date.now() - syAnimSeit)); setTimeout(() => b.classList.remove('sy-laeuft'), rest); return; }   // mind. 0,9 s sichtbar
  if (art === 'neu') { b.classList.remove('sy-laeuft'); void b.offsetWidth; b.classList.add('sy-neu'); setTimeout(() => b.classList.remove('sy-neu'), 3000); }
}
function syKnopf() {
  if (typeof skGrossKacheln === 'function') try { skGrossKacheln(); } catch (e) { /* egal */ }
  let b = document.getElementById('syncBtn');
  if (syZustand === 'aus') { if (b) b.hidden = true; return; }
  if (!b) {
    const leiste = document.querySelector('.hub-knoepfe');
    if (!leiste) return;
    b = document.createElement('button'); b.type = 'button'; b.id = 'syncBtn'; b.className = 'vollbild-btn';
    b.addEventListener('click', () => (syZustand === 'ok' ? syKontoDialog() : syZustand === 'offline' ? syOfflineDialog() : syAnmeldeDialog()));
    leiste.insertBefore(b, leiste.firstChild);
  }
  b.hidden = false;
  b.textContent = syZustand === 'ok' ? '☁️' : syZustand === 'offline' ? '☁️⚠️' : '👤';
  b.style.opacity = syZustand === 'offline' ? '.7' : '';
  b.title = syZustand === 'ok' ? 'Angemeldet als ' + syName : syZustand === 'offline' ? 'Server gerade nicht erreichbar' : 'Anmelden – Spielstand auf allen Geräten';
  b.setAttribute('aria-label', b.title);
}

// Welche App-Version läuft auf diesem Gerät? (früher im 💾-Fenster)
const syVersionText = () => '<p class="ft-klein" style="text-align:center;opacity:.6;margin-top:12px">App ' + (typeof APP_STAND !== 'undefined' ? APP_STAND.replace('walquiz-', '') : '?') + '</p>';

// Server nicht erreichbar, obwohl dieses Gerät schon angemeldet war: zeigen statt verstecken, alle 30 s neu versuchen
function syOfflineDialog() {
  const d = skDialog('<h3>☁️⚠️ Server nicht erreichbar</h3>'
    + '<p>Dein Homeserver antwortet gerade nicht. Du kannst normal weiterspielen – dein Fortschritt wird abgeglichen, sobald er wieder erreichbar ist.</p>'
    + '<p class="ft-klein">Häufige Gründe: Laptop aus oder im Ruhezustand, kein Internet zu Hause, Konto-Server gestoppt (auf dem Laptop <code>einrichten.bat</code> ausführen).</p>'
    + '<button type="button" class="btn" id="syNochmal">🔄 Nochmal versuchen</button><p class="ft-klein" id="syMeldung" role="status"></p>'
    + syVersionText());
  d.querySelector('#syNochmal').addEventListener('click', async () => {
    d.querySelector('#syMeldung').textContent = 'Versuche …';
    if (await syErneutVerbinden()) d.close(); else d.querySelector('#syMeldung').textContent = 'Immer noch nicht erreichbar.';
  });
}
async function syErneutVerbinden() {
  const z = await syPruefen();
  if (z === 'aus' || z === 'offline') return false;
  syZustand = z; syKnopf();
  if (z === 'ok') { syAnimation('neu'); await syLaufen(); }
  return true;
}

// ---------- Anmelden / Registrieren ----------
function syAnmeldeDialog() {
  const feld = 'width:100%;padding:12px;font-size:17px;border-radius:10px;border:1px solid #888;box-sizing:border-box;margin:4px 0 10px';
  const d = skDialog('<h3>👤 Dein Spielstand auf allen Geräten</h3>'
    + '<p>Melde dich an – dann ist dein Fortschritt auf Handy, Laptop und überall gleich. Dieses Gerät merkt sich die Anmeldung.</p>'
    + '<form id="syForm" autocomplete="on">'
    + '<label class="ft-klein" for="syNameFeld">Name</label>'
    + '<input id="syNameFeld" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" style="' + feld + '">'
    + '<label class="ft-klein" for="syPinFeld">PIN (4–8 Ziffern)</label>'
    + '<input id="syPinFeld" name="password" type="password" inputmode="numeric" pattern="[0-9]*" autocomplete="current-password" maxlength="8" style="' + feld + '">'
    + '<p class="ft-klein" id="syMeldung" role="status" style="min-height:1.3em;color:#dc2626"></p>'
    + '<button type="submit" class="btn" id="syAnmelden">Anmelden</button>'
    + '<button type="button" class="btn secondary" id="syRegistrieren">Neu hier? Konto anlegen</button>'
    + '</form>'
    + '<button type="button" class="btn secondary" id="sySpaeter" style="opacity:.8">Ohne Konto spielen</button>');
  const m = d.querySelector('#syMeldung');
  const los = async (art) => {
    const name = d.querySelector('#syNameFeld').value.trim(), pin = d.querySelector('#syPinFeld').value.trim();
    if (!name || !pin) { m.textContent = 'Bitte Name und PIN eingeben.'; return; }
    m.style.color = ''; m.textContent = art === 'registrieren' ? 'Konto wird angelegt …' : 'Anmelden …';
    let r; try { r = await syApi(art, 'POST', { name, pin }); } catch (e) { m.style.color = '#dc2626'; m.textContent = 'Keine Verbindung zum Server.'; return; }
    if (r.status !== 200) { m.style.color = '#dc2626'; m.textContent = (r.json && r.json.fehler) || 'Hat nicht geklappt.'; return; }
    d.close();
    await syAngemeldet(r.json.name, !!r.json.neu);
  };
  d.querySelector('#syForm').addEventListener('submit', (e) => { e.preventDefault(); los('anmelden'); });
  d.querySelector('#syRegistrieren').addEventListener('click', () => los('registrieren'));
  d.querySelector('#sySpaeter').addEventListener('click', () => { localStorage.setItem(SY_SPAETER, '1'); d.close(); syHinweis('Anmelden geht jederzeit über 👤 oben'); });
  setTimeout(() => d.querySelector('#syNameFeld').focus(), 50);
}
async function syAngemeldet(name, neu) {
  // anderes Konto als zuletzt auf diesem Gerät → der hiesige Stand gehört (noch) zu keiner Server-Version
  if (syMeta().konto !== name.toLowerCase()) localStorage.setItem(SY_META, JSON.stringify({ konto: name.toLowerCase() }));   // erster Abgleich: alles „alt“
  localStorage.removeItem(SY_SPAETER);
  syName = name; syZustand = 'ok'; syKnopf();
  try { const r = await syApi('ich'); syAdmin = !!(r.json && r.json.admin); } catch (e) { /* egal */ }
  syHinweis(neu ? 'Willkommen, ' + name + '! Dein Spielstand ist jetzt gesichert' : 'Angemeldet als ' + name);
  await syLaufen();
}
function syKontoDialog() {
  const m = syMeta();
  const d = skDialog('<h3>☁️ ' + syEsc(syName) + '</h3>'
    + '<ul class="ft-check"><li><b>Spielstand</b><span>auf allen Geräten gleich ✓</span></li><li><b>Zuletzt abgeglichen</b><span>' + (m.zuletzt ? syZeit(m.zuletzt) : '–') + '</span></li></ul>'
    + '<p class="ft-klein">Auf einem anderen Gerät einfach die Seite öffnen und mit demselben Namen und derselben PIN anmelden.</p>'
    + (syAdmin ? '<a class="btn" id="syZentrale" href="server.html" style="display:block;text-align:center;text-decoration:none;margin-bottom:10px">🖥️ Server-Zentrale</a>' : '')
    + '<a class="btn secondary" id="syMcSeite" href="minecraft.html" style="display:none;text-align:center;text-decoration:none">⛏️ Minecraft-Server · Statistik &amp; Karte</a>'
    + '<a class="btn secondary" id="syLolSeite" href="lol.html" style="display:block;text-align:center;text-decoration:none">🎮 LoL-Zentrale · wer spielt wo am besten</a>'
    + '<button type="button" class="btn secondary" id="syJetzt">🔄 Jetzt abgleichen</button>'
    + '<button type="button" class="btn secondary" id="syAbmelden">Abmelden</button>'
    + '<button type="button" class="btn secondary" id="syLoeschen" style="opacity:.75">🗑️ Konto löschen</button>'
    + '<button type="button" class="btn" id="sySchliessen">Schließen</button>'
    + syVersionText());
  d.querySelector('#sySchliessen').addEventListener('click', () => d.close());
  syApi('minecraft/info').then((r) => { const l = d.querySelector('#syMcSeite'); if (l && r.status === 200 && r.json && r.json.installiert) l.style.display = 'block'; }).catch(() => {});
  d.querySelector('#syLoeschen').addEventListener('click', async () => {
    const pin = prompt('Konto „' + syName + '“ endgültig löschen?\n\nDein Spielstand und dein Eintrag in der Bestenliste werden vom Server gelöscht. Auf diesem Gerät bleibt dein Spielstand.\n\nZur Bestätigung deine PIN eingeben:');
    if (!pin) return;
    const r = await syApi('konto/loeschen', 'POST', { pin: pin.trim() }).catch(() => ({ status: 0 }));
    if (r.status !== 200) { alert((r.json && r.json.fehler) || 'Hat nicht geklappt.'); return; }
    localStorage.removeItem(SY_META); localStorage.setItem(SY_SPAETER, '1');
    syZustand = 'abgemeldet'; syName = ''; d.close(); syKnopf(); syBestenliste(); syHinweis('Konto gelöscht');
  });
  d.querySelector('#syJetzt').addEventListener('click', async () => { d.close(); await syAbgleich({ ladenErlaubt: true }); syHinweis('Abgeglichen ✓'); });
  d.querySelector('#syAbmelden').addEventListener('click', async () => {
    await syAbgleich();   // letzten Stand noch sichern
    try { await syApi('abmelden', 'POST', {}); } catch (e) { /* offline – Cookie bleibt dann eben */ }
    syZustand = 'abgemeldet'; syName = ''; localStorage.setItem(SY_SPAETER, '1'); d.close(); syKnopf(); syBestenliste(); syHinweis('Abgemeldet');
  });
}

function syHinweis(text) {
  const el = document.createElement('div');
  el.className = 'sync-hinweis';
  el.textContent = (/^\p{Extended_Pictographic}/u.test(text) ? '' : '☁️ ') + text;   // eigenes Symbol vorne? dann kein ☁️ davor
  el.style.cssText = 'position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;'
    + 'background:rgba(15,23,42,.92);color:#fff;padding:10px 16px;border-radius:999px;font:600 14px/1.3 system-ui,sans-serif;'
    + 'box-shadow:0 6px 24px rgba(0,0,0,.3);max-width:90vw;text-align:center;pointer-events:none;transition:opacity .4s';
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; }, 3500);
  setTimeout(() => el.remove(), 4000);
}

// ---------- Start ----------
async function syLaufen() {
  await syAbgleich({ alt: true, ladenErlaubt: true });
  syBestenliste(true);
  if (syGestartet) return;
  syGestartet = true;
  setInterval(() => { if (document.visibilityState === 'visible') { syAbgleich(); syBestenliste(false); } }, SY_TAKT);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') syAbgleich();
    else syAbgleich({ alt: true, ladenErlaubt: true });   // zurück in der App: Neues von anderen Geräten holen
  });
}
async function syStart() {
  syZustand = await syPruefen();
  if ((syZustand === 'aus' && syMeta().konto) || syZustand === 'offline') {   // Server nur gerade weg (oder dieses Gerät war schon angemeldet)
    syZustand = 'offline';
    const t = setInterval(async () => { if (document.visibilityState === 'visible' && await syErneutVerbinden()) clearInterval(t); }, 30e3);
  }
  syKnopf();
  const h = sessionStorage.getItem('spielekiste-sync-hinweis');
  if (h) { sessionStorage.removeItem('spielekiste-sync-hinweis'); syHinweis(h); }
  if (sessionStorage.getItem('spielekiste-sync-neu')) { sessionStorage.removeItem('spielekiste-sync-neu'); setTimeout(() => syAnimation('neu'), 300); }
  if (syZustand === 'ok') return syLaufen();
  if (syZustand === 'abgemeldet' && !localStorage.getItem(SY_SPAETER)) setTimeout(syAnmeldeDialog, 600);
}

if (typeof window !== 'undefined' && 'fetch' in window && location.protocol !== 'file:') syStart();
