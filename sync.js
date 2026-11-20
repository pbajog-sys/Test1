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
//
// Duelle: Aus der Bestenliste jemanden herausfordern → beide spielen dieselbe Runde (gleicher Seed, gleiche Stufe),
// wann sie wollen. Das Ergebnis kommt über skNachSpiel (wie bei den Tagesaufgaben). Im Dashboard „⚔️ Duelle“.
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
// Ganz oben im Dashboard: Podest der Top 3, eigener Platz, wartende Duelle
function syTop3Zeigen() {
  const hub = document.getElementById('screen-hub');
  let box = document.getElementById('syTop3');
  if (!hub || syZustand !== 'ok' || !syListe.length) { if (box) box.remove(); return; }
  if (!box) {
    box = document.createElement('div'); box.id = 'syTop3'; box.className = 'sy-top3';
    const nach = document.getElementById('installKarte') || document.getElementById('hubBuehne');
    hub.insertBefore(box, nach ? nach.nextSibling : hub.firstChild);
  }
  const ichI = syListe.findIndex((e) => e.ich), medaille = ['🥇', '🥈', '🥉'];
  const offen = (typeof syDuelle !== 'undefined' ? syDuelle : []).filter((du) => syDuellZustand(du) === 'du').length;
  box.innerHTML = '<div class="sy-top3-kopf"><b>🏆 Bestenliste</b><small>' + (ichI >= 0 ? 'Du: Platz ' + (ichI + 1) + ' von ' + syListe.length : syListe.length + ' Spieler') + '</small></div>'
    + '<div class="sy-podest">' + syListe.slice(0, 3).map((e, i) => '<button type="button" class="sy-platz' + (e.ich ? ' ich' : '') + '" data-top="' + i + '">'
      + '<span class="sy-med">' + medaille[i] + '</span><span class="sy-av">' + syEsc(e.avatar) + '</span><b>' + syEsc(e.name) + '</b><small>' + (typeof fmt === 'function' ? fmt(e.xp) : e.xp) + ' XP</small></button>').join('') + '</div>'
    + '<div class="sy-top3-fuss">'
    + (offen ? '<button type="button" class="sy-chip wichtig" data-zu="syDuelle">⚔️ ' + offen + (offen === 1 ? ' Duell' : ' Duelle') + ' für dich</button>' : '')
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
    + (e.ich ? '' : syBilanzText(e.name) + '<button type="button" class="btn" id="syDuell">⚔️ Zum Duell herausfordern</button><button type="button" class="btn secondary" id="syVgl">📊 Mit mir vergleichen</button>'));
  if (d.querySelector('#syDuell')) d.querySelector('#syDuell').addEventListener('click', () => syDuellWahl(e.name));
  if (d.querySelector('#syVgl')) d.querySelector('#syVgl').addEventListener('click', () => {
    d.close();
    if (typeof skProfilZeigen !== 'function') return;
    skProfilZeigen();
    skVergleich = { name: e.name, avatar: e.avatar, level: e.level, werte: (e.skills || []).map((v) => (v < 0 ? null : v)) };
    skProfilZeichnen();
  });
}

// ---------- Duelle ----------
// Spiele, die dieselbe Runde für beide erzeugen können (gleicher Seed). Stufe/Modus fest, damit beide gleich spielen.
const SY_DUELL_SPIELE = {
  farben: { start: () => farbenStart, opts: { stufe: 'mittel', art: 'merken', werkzeug: 'rgb' }, stand: () => fs },
  toene: { start: () => toeneStart, opts: { stufe: 'mittel' }, stand: () => ts },
  augen: { start: () => augenStart, opts: { stufe: 'mittel', modus: 'ziehen' }, stand: () => ag },
  takt: { start: () => taktStart, opts: { stufe: 'mittel', modus: 'mix' }, stand: () => tk },
  funktion: { start: () => funktionStart, opts: { stufe: 'mittel', modus: 'mix' }, stand: () => fd },
  karte: { start: () => karteStart, opts: { stufe: 'mittel', modus: 'mix' }, stand: () => kt },
  punkte: { start: () => punkteStart, opts: { stufe: 'mittel', modus: 'mix' }, stand: () => pw },
  riff: { start: () => riffStart, opts: {}, stand: () => rf },
  tiefgang: { start: () => tiefgangStart, opts: { stufe: 'mittel' }, stand: () => tg },
};
const SY_DUELL_AKTIV = 'spielekiste-duell', SY_DUELL_GESEHEN = 'spielekiste-duelle-gesehen';
let syDuelle = [], syBilanz = {}, syDuelleZeit = 0;
const syDuellName = (spiel) => { const sp = typeof SK_SPIELE !== 'undefined' && SK_SPIELE[spiel]; return sp ? sp.emoji + ' ' + sp.name : spiel; };
function syBilanzText(name) {
  const b = syBilanz[name];
  if (!b) return '<p class="ft-klein">Noch kein Duell gegeneinander.</p>';
  return '<p class="ft-klein">⚔️ Duell-Bilanz: <b>' + b.s + ' : ' + b.n + '</b>' + (b.u ? ' (' + b.u + '× unentschieden)' : '') + '</p>';
}
// Spiel für ein neues Duell wählen
function syDuellWahl(gegner) {
  const d = skDialog('<h3>⚔️ Duell gegen ' + syEsc(gegner) + '</h3><p>Welches Spiel? Ihr bekommt beide <b>genau dieselbe Runde</b>. Du spielst gleich los, dann ist ' + syEsc(gegner) + ' dran.</p>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    + '<button type="button" class="btn" data-dspiel="" style="grid-column:1/-1">🎲 Zufall</button>'
    + Object.keys(SY_DUELL_SPIELE).map((sp) => '<button type="button" class="btn secondary" data-dspiel="' + sp + '" style="margin:0">' + syDuellName(sp) + '</button>').join('')
    + '</div><p class="ft-klein" id="syMeldung" role="status"></p>');
  d.querySelectorAll('[data-dspiel]').forEach((b) => b.addEventListener('click', async () => {
    const m = d.querySelector('#syMeldung'); m.textContent = 'Duell wird angelegt …';
    const r = await syApi('duell', 'POST', { gegen: gegner, spiel: b.dataset.dspiel || undefined }).catch(() => ({ status: 0 }));
    if (r.status !== 200) { m.textContent = '⚠️ ' + ((r.json && r.json.fehler) || 'Keine Verbindung zum Server.'); return; }
    d.close(); syDuelle.unshift(r.json); syDuellStarten(r.json);
  }));
}
// Runde eines Duells starten: Spiel öffnen, dann mit dem Seed des Duells starten
function syDuellStarten(du) {
  const cfg = SY_DUELL_SPIELE[du.spiel], sp = typeof SK_SPIELE !== 'undefined' && SK_SPIELE[du.spiel];
  if (!cfg || !sp) return;
  sessionStorage.setItem(SY_DUELL_AKTIV, JSON.stringify({ id: du.id, spiel: du.spiel, seed: du.seed, gegner: du.gegner }));
  if (sp.ton && typeof audio === 'function') audio();   // Ton muss im Klick entsperrt werden
  const dlg = document.getElementById('skDlg'); if (dlg && dlg.open) dlg.close();
  document.getElementById(sp.hub).click();
  const opts = Object.assign({}, cfg.opts, { seed: du.seed, taeglich: false });
  if (du.sein) opts.gegner = Object.assign({ name: du.gegner, punkte: du.sein.p, seed: du.seed }, cfg.opts);
  const bis = Date.now() + 5000;
  const warte = () => {
    const b = sp.tag && document.getElementById(sp.tag);
    let fn = null; try { fn = cfg.start(); } catch (e) { /* Spiel noch nicht geladen */ }
    if ((!b || !b.offsetParent || typeof fn !== 'function') && Date.now() < bis) { setTimeout(warte, 80); return; }
    if (typeof fn === 'function') fn(opts);
    syHinweis('⚔️ Duell gegen ' + du.gegner + (du.sein ? ' – Ziel: ' + du.sein.p + ' Punkte' : ' – dein Ergebnis zählt'));
  };
  setTimeout(warte, 120);
}
// Nach jeder Runde: gehört sie zum laufenden Duell? (gleiches Spiel und gleicher Seed)
async function syDuellErgebnis(spiel, punkte, max) {
  let a = null; try { a = JSON.parse(sessionStorage.getItem(SY_DUELL_AKTIV) || 'null'); } catch (e) { /* kaputt */ }
  if (!a || a.spiel !== spiel) return;
  let seed = null; try { seed = SY_DUELL_SPIELE[spiel].stand().seed; } catch (e) { /* egal */ }
  if (seed !== a.seed) return;
  sessionStorage.removeItem(SY_DUELL_AKTIV);
  const r = await syApi('duell/ergebnis', 'POST', { id: a.id, p: punkte, m: max }).catch(() => ({ status: 0 }));
  if (r.status !== 200) { syHinweis('⚠️ Duell-Ergebnis konnte nicht gespeichert werden'); return; }
  const du = r.json;
  syGesehenSetzen(du);
  setTimeout(() => syHinweis(du.ausgang ? syAusgangText(du) : 'Ergebnis gespeichert – jetzt ist ' + du.gegner + ' dran'), 1600);
  syDuelleLaden(true);
}
const syAusgangText = (du) => ({ sieg: '🏆 Gewonnen', niederlage: '😅 Verloren', unentschieden: '🤝 Unentschieden' }[du.ausgang]) + ' gegen ' + du.gegner + ' – ' + du.mein.p + ' : ' + du.sein.p;
try {
  if (typeof skNachSpiel === 'function') {
    const vorher = skNachSpiel;
    skNachSpiel = function (spiel, punkte, max) { try { syDuellErgebnis(spiel, punkte, max); } catch (e) { /* Duell darf das Spiel nie stören */ } return vorher.apply(this, arguments); };
  }
} catch (e) { /* ohne Duelle weiter */ }

const syDuellZustand = (du) => (du.abgelehnt ? 'abgelehnt' : du.ausgang ? 'fertig' : du.abgelaufen ? 'abgelaufen' : !du.mein ? 'du' : 'warte');
function syGesehenSetzen(du) { const g = syGesehen(); g[du.id] = syDuellZustand(du); try { localStorage.setItem(SY_DUELL_GESEHEN, JSON.stringify(g)); } catch (e) { /* voll */ } }
function syGesehen() { try { return JSON.parse(localStorage.getItem(SY_DUELL_GESEHEN) || '{}'); } catch (e) { return {}; } }
async function syDuelleLaden(sofort) {
  if (syZustand !== 'ok') { ['syDuelle', 'syTop3'].forEach((id) => { const b = document.getElementById(id); if (b) b.remove(); }); return; }
  if (!sofort && Date.now() - syDuelleZeit < 60e3) return;
  let r; try { r = await syApi('duelle'); } catch (e) { return; }
  if (r.status !== 200 || !r.json) return;
  syDuelle = r.json.duelle || []; syBilanz = r.json.bilanz || {}; syDuelleZeit = Date.now();
  // Neuigkeiten melden (beim allerersten Laden nur merken, nicht alles auf einmal melden)
  const erstmals = !localStorage.getItem(SY_DUELL_GESEHEN), g = syGesehen(), meldungen = [];
  syDuelle.forEach((du) => {
    const z = syDuellZustand(du);
    if (!erstmals && g[du.id] !== z) {
      if (z === 'du' && !du.vonMir) meldungen.push('⚔️ ' + du.gegner + ' fordert dich heraus: ' + syDuellName(du.spiel));
      if (z === 'fertig') meldungen.push(syAusgangText(du));
      if (z === 'abgelehnt' && du.vonMir) meldungen.push(du.gegner + ' hat dein Duell abgelehnt');
    }
    g[du.id] = z;
  });
  try { localStorage.setItem(SY_DUELL_GESEHEN, JSON.stringify(g)); } catch (e) { /* voll */ }
  meldungen.slice(0, 3).forEach((t, i) => setTimeout(() => syHinweis(t), 400 + i * 4200));
  syDuelleZeigen();
}
function syDuelleZeigen() {
  const spalte = document.querySelector('#screen-hub .spalte-b');
  if (!spalte || syZustand !== 'ok') return;
  syTop3Zeigen();
  let box = document.getElementById('syDuelle');
  if (!box) {
    box = document.createElement('div'); box.id = 'syDuelle'; box.className = 'sk-unten';
    const liste = document.getElementById('syBestenliste');
    spalte.insertBefore(box, liste || document.getElementById('hubFamilie') || null);
  }
  const offen = syDuelle.filter((du) => syDuellZustand(du) === 'du');
  const warte = syDuelle.filter((du) => syDuellZustand(du) === 'warte');
  const fertig = syDuelle.filter((du) => ['fertig', 'abgelehnt', 'abgelaufen'].includes(syDuellZustand(du))).slice(0, 5);
  if (!syDuelle.length) { box.innerHTML = '<h2 class="hub-h"><span>⚔️</span> Duelle</h2><p class="sk-fein">Tippe in der Bestenliste auf jemanden und fordere ihn heraus.</p>'; return; }
  const zeile = (du, rechts, knoepfe) => '<div class="sk-letzt"><span>' + syDuellName(du.spiel).split(' ')[0] + '</span><div><b>' + rechts.titel + '</b><small>' + rechts.unten + '</small></div>' + (knoepfe || '') + '</div>';
  box.innerHTML = '<h2 class="hub-h"><span>⚔️</span> Duelle' + (offen.length ? ' <small>' + offen.length + ' für dich</small>' : '') + '</h2><div class="sk-letzte">'
    + offen.map((du) => zeile(du, { titel: du.vonMir ? 'Duell gegen ' + syEsc(du.gegner) : syEsc(du.gegner) + ' fordert dich heraus', unten: syDuellName(du.spiel) + (du.sein ? ' · Ziel: ' + du.sein.p : '') },
      '<button type="button" class="btn" data-dlos="' + du.id + '" style="margin:0;padding:6px 12px;width:auto">Spielen</button>' + (du.vonMir ? '' : '<button type="button" data-dweg="' + du.id + '" aria-label="Ablehnen" title="Ablehnen">✕</button>'))).join('')
    + warte.map((du) => zeile(du, { titel: 'Warte auf ' + syEsc(du.gegner), unten: syDuellName(du.spiel) + ' · du: ' + du.mein.p })).join('')
    + fertig.map((du) => zeile(du, { titel: du.ausgang ? syEsc(syAusgangText(du)) : du.abgelehnt ? syEsc(du.gegner) + ' hat abgelehnt' : 'Abgelaufen – ' + syEsc(du.gegner), unten: syDuellName(du.spiel) })).join('')
    + '</div>';
  box.querySelectorAll('[data-dlos]').forEach((b) => b.addEventListener('click', () => syDuellStarten(syDuelle.find((x) => x.id === b.dataset.dlos))));
  box.querySelectorAll('[data-dweg]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Dieses Duell ablehnen?')) return;
    const r = await syApi('duell/ablehnen', 'POST', { id: b.dataset.dweg }).catch(() => null);
    if (r && r.status === 200) { syGesehenSetzen(r.json); syDuelleLaden(true); }
  }));
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
    + (syAdmin ? '<div style="margin:12px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.05)">'
      + '<b>🖥️ Server</b> <small style="color:#8b8bab">· nur für dich sichtbar</small>'
      + '<ul class="ft-check" style="margin:6px 0"><li><b>Version</b><span id="syServerVersion">…</span></li><li><b>Konten</b><span id="syServerKonten">…</span></li></ul>'
      + '<p class="ft-klein" id="syServerStand" style="min-height:1.2em;margin:4px 0"></p>'
      + '<p class="ft-klein" id="syServerAufgabe" style="margin:2px 0;opacity:.75"></p>'
      + '<div id="syServerNeu" class="ft-klein" style="margin:4px 0"></div>'
      + '<button type="button" class="btn secondary" id="syPruefen" style="margin:6px 0 0;width:100%">🔍 Updates prüfen</button>'
      + '<button type="button" class="btn" id="syServerUpdate" style="margin:6px 0 0;width:100%" hidden>⬆️ Aktualisieren</button>'
      + '<h4 style="margin:14px 0 4px">🧩 Erweiterungen</h4><div id="syErweiterungen" class="ft-klein">…</div>'
      + '<div id="syMinecraft" class="ft-klein" style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)">…</div>'
      + '<details id="sySteuerung" style="margin-top:14px"><summary style="cursor:pointer;font-weight:700">🎛️ Steuerung</summary><div id="sySteuerInhalt" class="ft-klein" style="margin-top:6px">Wird geladen …</div></details></div>' : '')
    + '<a class="btn secondary" id="syMcSeite" href="minecraft.html" style="display:none;text-align:center;text-decoration:none">⛏️ Minecraft-Server · Statistik &amp; Karte</a>'
    + '<button type="button" class="btn secondary" id="syJetzt">🔄 Jetzt abgleichen</button>'
    + '<button type="button" class="btn secondary" id="syAbmelden">Abmelden</button>'
    + '<button type="button" class="btn secondary" id="syLoeschen" style="opacity:.75">🗑️ Konto löschen</button>'
    + '<button type="button" class="btn" id="sySchliessen">Schließen</button>'
    + syVersionText());
  d.querySelector('#sySchliessen').addEventListener('click', () => d.close());
  syApi('minecraft/info').then((r) => { const l = d.querySelector('#syMcSeite'); if (l && r.status === 200 && r.json && r.json.installiert) l.style.display = 'block'; }).catch(() => {});
  d.querySelector('#syLoeschen').addEventListener('click', async () => {
    const pin = prompt('Konto „' + syName + '“ endgültig löschen?\n\nDein Spielstand, deine Einträge in Bestenliste und Duellen werden vom Server gelöscht. Auf diesem Gerät bleibt dein Spielstand.\n\nZur Bestätigung deine PIN eingeben:');
    if (!pin) return;
    const r = await syApi('konto/loeschen', 'POST', { pin: pin.trim() }).catch(() => ({ status: 0 }));
    if (r.status !== 200) { alert((r.json && r.json.fehler) || 'Hat nicht geklappt.'); return; }
    localStorage.removeItem(SY_META); localStorage.setItem(SY_SPAETER, '1');
    syZustand = 'abgemeldet'; syName = ''; d.close(); syKnopf(); syBestenliste(); syDuelleLaden(); syHinweis('Konto gelöscht');
  });
  if (syAdmin) {
    syServerStatus(d);
    d.querySelector('#syPruefen').addEventListener('click', () => syUpdatesPruefen(d));
    d.querySelector('#sySteuerung').addEventListener('toggle', (e) => { if (e.target.open) sySteuerungZeigen(d); });
    d.querySelector('#syServerUpdate').addEventListener('click', (e) => (e.currentTarget.dataset.neuLaden ? syAppNeuLaden() : syServerAktualisieren(d)));
  }
  d.querySelector('#syJetzt').addEventListener('click', async () => { d.close(); await syAbgleich({ ladenErlaubt: true }); syHinweis('Abgeglichen ✓'); });
  d.querySelector('#syAbmelden').addEventListener('click', async () => {
    await syAbgleich();   // letzten Stand noch sichern
    try { await syApi('abmelden', 'POST', {}); } catch (e) { /* offline – Cookie bleibt dann eben */ }
    syZustand = 'abgemeldet'; syName = ''; localStorage.setItem(SY_SPAETER, '1'); d.close(); syKnopf(); syBestenliste(); syDuelleLaden(); syHinweis('Abgemeldet');
  });
}

// ---------- Betreiber: Server-Menü (nur für das Admin-Konto; der Server prüft das bei jeder Anfrage selbst) ----------
// Updates auf GitHub prüfen: zeigt, was neu ist; „Aktualisieren“ erscheint nur, wenn es etwas Neues gibt
async function syUpdatesPruefen(d) {
  const knopf = d.querySelector('#syPruefen'), feld = d.querySelector('#syServerNeu'), los = d.querySelector('#syServerUpdate');
  knopf.disabled = true; knopf.textContent = '🔍 Prüfe …'; feld.textContent = '';
  const r = await syApi('admin/pruefen').catch(() => ({ status: 0 }));
  knopf.disabled = false; knopf.textContent = '🔍 Updates prüfen';
  if (r.status !== 200) { feld.textContent = '⚠️ ' + ((r.json && r.json.fehler) || 'GitHub gerade nicht erreichbar.'); return; }
  const j = r.json;
  if (!j.neuer) { feld.innerHTML = '✓ <b>Alles aktuell</b> (' + syEsc(j.neu) + ')'; los.hidden = true; return; }
  feld.innerHTML = '🆕 <b>Neue Version ' + syEsc(j.neu) + '</b>' + (j.anzahl ? ' – ' + j.anzahl + (j.anzahl === 1 ? ' Änderung' : ' Änderungen') : '') + ':'
    + (j.aenderungen && j.aenderungen.length ? '<ul style="margin:4px 0 0;padding-left:1.2em">' + j.aenderungen.map((t) => '<li>' + syEsc(t) + '</li>').join('') + '</ul>' : '');
  los.hidden = false; los.disabled = false; los.textContent = '⬆️ Aktualisieren'; delete los.dataset.neuLaden;
}
// ---------- Steuerung des Laptops (nur Admin; nur fest eingebaute Aktionen) ----------
const syGB = (b) => (b / 1073741824).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' GB';
const syDauer = (s) => (s < 3600 ? Math.round(s / 60) + ' Min.' : s < 172800 ? Math.round(s / 3600) + ' Std.' : Math.round(s / 86400) + ' Tagen');
async function sySteuerungZeigen(d) {
  const box = d.querySelector('#sySteuerInhalt'); if (!box) return;
  const r = await syApi('admin/system').catch(() => ({ status: 0 }));
  if (r.status !== 200) { box.textContent = '⚠️ Laptop gerade nicht erreichbar.'; return; }
  const j = r.json, gut = { Running: '✅', Ready: '✅' }, text = { Running: 'läuft', Ready: 'bereit', Disabled: 'aus', Stopped: 'gestoppt', fehlt: 'nicht eingerichtet' };
  const dienst = (n) => { const z = (j.dienste || {})[n]; if (!z) return ''; return '<span style="display:inline-block;margin:2px 8px 2px 0">' + (gut[z] || (z === 'fehlt' ? '➖' : '⚠️')) + ' ' + n + ' <span style="opacity:.7">(' + (text[z] || z) + ')</span></span>'; };
  box.innerHTML = '<p style="margin:4px 0">🖥️ <b>' + syEsc(j.name || 'Laptop') + '</b> · läuft seit ' + syDauer(j.laeuftSeit) + ' · CPU ' + j.cpu + ' %'
    + ' · RAM ' + syGB(j.ram.frei) + ' von ' + syGB(j.ram.gesamt) + ' frei'
    + (j.platte ? ' · Platte ' + syGB(j.platte.frei) + ' frei' : '')
    + (j.akku != null ? ' · Akku ' + j.akku + ' %' + (j.netz ? ' (am Netz)' : ' ⚠️ <b>nicht am Netz</b>') : '') + '</p>'
    + '<p style="margin:4px 0">' + ['Caddy', 'Konto-Server', 'DuckDNS', 'AdGuard', 'Minecraft', 'Wachhund', 'Update'].map(dienst).join('') + '</p>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0">'
    + '<button type="button" class="btn secondary" data-aktion="caddy-neustart" style="margin:0">🔁 Caddy</button>'
    + '<button type="button" class="btn secondary" data-aktion="duckdns-neustart" style="margin:0">🔁 DuckDNS</button>'
    + ((j.dienste || {}).AdGuard && j.dienste.AdGuard !== 'fehlt' ? '<button type="button" class="btn secondary" data-aktion="adguard-neustart" style="margin:0">🔁 AdGuard</button>' : '')
    + '<button type="button" class="btn secondary" data-aktion="laptop-neustart" style="margin:0;color:#f87171">⏻ Laptop neu starten</button></div>'
    + '<p id="syAktionMeldung" style="margin:4px 0;min-height:1.2em"></p>'
    + '<div style="display:flex;gap:6px;align-items:center;margin-top:6px"><span>📜 Protokoll:</span><select id="syProtokollWahl" style="flex:1;padding:6px;border-radius:8px;font-size:15px">'
    + [['update', 'Updates & Steuerung'], ['wachhund', 'Wachhund'], ['konto', 'Konto-Server'], ['caddy', 'Caddy'], ['duckdns', 'DuckDNS'], ['minecraft', 'Minecraft'], ['erweiterungen', 'Erweiterungen']].map(([k, n]) => '<option value="' + k + '">' + n + '</option>').join('')
    + '</select></div><pre id="syProtokoll" style="white-space:pre-wrap;font-size:.7rem;line-height:1.35;max-height:14em;overflow:auto;margin:6px 0 0;opacity:.85"></pre>';
  const protokoll = async () => {
    const pre = box.querySelector('#syProtokoll'); pre.textContent = '…';
    const x = await syApi('admin/protokoll?datei=' + box.querySelector('#syProtokollWahl').value).catch(() => ({ status: 0 }));
    pre.textContent = x.status === 200 ? (x.json.zeilen.join('\n') || '(leer)') : 'nicht verfügbar';
    pre.scrollTop = pre.scrollHeight;
  };
  box.querySelector('#syProtokollWahl').addEventListener('change', protokoll);
  protokoll();
  box.querySelectorAll('[data-aktion]').forEach((b) => b.addEventListener('click', async () => {
    const a = b.dataset.aktion, m = box.querySelector('#syAktionMeldung');
    if (a === 'laptop-neustart' && !confirm('Laptop wirklich neu starten?\n\nDie Seite ist dann 2–3 Minuten nicht erreichbar; danach startet alles von selbst wieder.')) return;
    const x = await syApi('admin/aktion', 'POST', { aktion: a }).catch(() => ({ status: 0 }));
    m.textContent = x.status === 200 ? '✓ ' + x.json.name + ' – gestartet' + (a === 'laptop-neustart' ? ' (in 30 Sekunden)' : '') : '⚠️ ' + ((x.json && x.json.fehler) || 'Hat nicht geklappt.');
    if (x.status === 200 && a !== 'laptop-neustart') setTimeout(() => sySteuerungZeigen(d), 6000);
  }));
}

// Zustand der Windows-Aufgabe „Update“ – hilft, wenn „Aktualisieren“ nichts tut
function syAufgabeZeigen(d, a) {
  const el = d.querySelector('#syServerAufgabe'); if (!el) return;
  if (!a) { el.textContent = ''; return; }
  if (a.fehlt) { el.textContent = '⚠️ Update-Aufgabe fehlt – auf dem Laptop einrichten.bat ausführen.'; return; }
  if (a.fehler) { el.textContent = 'Update-Aufgabe: nicht abfragbar (' + a.fehler + ')'; return; }
  const code = Number(a.ergebnis) >>> 0, hex = '0x' + code.toString(16).toUpperCase();
  const bedeutung = { 0: 'ok', 1: 'Fehler im Skript', 267009: 'läuft gerade', 267011: 'noch nie gelaufen', 2147942402: 'Datei nicht gefunden', 2147942405: 'Zugriff verweigert', 2147946720: 'Aufgabe abgebrochen' }[code] || 'Code ' + hex;
  el.textContent = 'Update-Aufgabe: ' + ({ Ready: 'bereit', Running: 'läuft', Disabled: 'deaktiviert', Queued: 'wartet' }[a.zustand] || a.zustand)
    + (a.letzterLauf ? ' · zuletzt ' + a.letzterLauf.replace('T', ' ').slice(0, 16) : '') + ' · Ergebnis: ' + bedeutung + (a.aktion ? ' · führt aus: ' + a.aktion : '');
}

// ---------- Minecraft (Java): installieren, Status, Spieler freischalten, Start/Stopp ----------
async function syMinecraftZeigen(d) {
  const box = d.querySelector('#syMinecraft'); if (!box || box.dataset.laeuft) return;
  const r = await syApi('admin/minecraft').catch(() => ({ status: 0 }));
  if (r.status !== 200) { box.textContent = ''; return; }
  const j = r.json, host = location.hostname;
  if (!j.installiert) {
    box.innerHTML = '<b>⛏️ Minecraft (Java)</b> – eigener Server für dich und deine Freunde (Paper, nur freigeschaltete Spieler).'
      + '<label style="display:flex;gap:8px;align-items:flex-start;margin:8px 0"><input type="checkbox" id="syMcEula" style="margin-top:3px"> <span>Ich akzeptiere die <a href="https://aka.ms/MinecraftEULA" target="_blank" rel="noopener">Minecraft-EULA</a>.</span></label>'
      + '<button type="button" class="btn secondary" id="syMcLos" style="margin:0;width:100%">⛏️ Minecraft installieren</button>';
    box.querySelector('#syMcLos').addEventListener('click', async () => {
      const knopf = box.querySelector('#syMcLos');
      if (!box.querySelector('#syMcEula').checked) { alert('Bitte zuerst die Minecraft-EULA akzeptieren.'); return; }
      knopf.disabled = true; knopf.textContent = '⏳ Wird gestartet …';
      const x = await syApi('admin/erweiterung', 'POST', { name: 'minecraft', eula: true }).catch(() => ({ status: 0 }));
      if (x.status !== 200) { knopf.disabled = false; knopf.textContent = '⛏️ Minecraft installieren'; alert((x.json && x.json.fehler) || 'Konnte nicht starten.'); return; }
      box.dataset.laeuft = '1'; knopf.textContent = '⏳ Installiert … (3–6 Minuten, erzeugt die Welt)';
      const bis = Date.now() + 8 * 60e3;
      while (Date.now() < bis && d.open) {
        await new Promise((ok) => setTimeout(ok, 6000));
        let st; try { const y = await syApi('admin/status'); if (y.status !== 200) continue; st = y.json; } catch (e) { continue; }
        const l = (st.erweiterungenLog || []).filter((z) => /Minecraft:/.test(z)).slice(-1)[0] || '';
        if (l) knopf.textContent = '⏳ ' + l.replace(/^\S+ \S+\s+Minecraft:\s*/, '');
        if (/Fertig|FEHLER/.test(l)) { delete box.dataset.laeuft; if (/FEHLER/.test(l)) alert(l.replace(/^\S+ \S+\s+/, '')); syMinecraftZeigen(d); return; }
      }
      delete box.dataset.laeuft; if (d.open) syMinecraftZeigen(d);
    });
    return;
  }
  const liste = (j.whitelist || []).map((n) => '<span style="display:inline-flex;align-items:center;gap:4px;margin:2px 6px 2px 0;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.08)">'
    + ((j.online || []).includes(n) ? '🟢 ' : '') + syEsc(n) + ' <button type="button" data-mcweg="' + syEsc(n) + '" aria-label="' + syEsc(n) + ' entfernen" style="border:0;background:none;color:inherit;cursor:pointer;padding:0 2px">✕</button></span>').join('');
  box.innerHTML = '<b>⛏️ Minecraft (Java)</b> ' + (j.laeuft ? '· läuft ✓' : j.gestoppt ? '· gestoppt' : '· startet gerade oder ist abgestürzt')
    + (j.version ? ' <span style="opacity:.7">(' + syEsc(j.version.replace(/\.jar$/, '')) + ')</span>' : '')
    + '<br>Adresse für Freunde: <b>' + syEsc(host) + '</b> (Port 25565 – im Speedport für TCP 25565 freigeben)'
    + (j.laeuft ? '<br>Online: ' + ((j.online || []).length ? (j.online || []).map(syEsc).join(', ') : 'niemand') : '')
    + '<p style="margin:8px 0 4px">Freigeschaltet: ' + (liste || '<span style="opacity:.7">noch niemand</span>') + '</p>'
    + '<div style="display:flex;gap:6px"><input id="syMcName" placeholder="Minecraft-Name" autocapitalize="none" spellcheck="false" maxlength="16" style="flex:1;min-width:0;padding:8px;font-size:16px;border-radius:10px;border:1px solid #888">'
    + '<button type="button" class="btn secondary" id="syMcPlus" style="margin:0;width:auto;padding:8px 12px">Freischalten</button></div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">'
    + (j.laeuft ? '<button type="button" class="btn secondary" data-mc="stopp" style="margin:0">⏹ Stopp</button><button type="button" class="btn secondary" data-mc="neustart" style="margin:0">🔁 Neustart</button>'
      : '<button type="button" class="btn secondary" data-mc="start" style="margin:0">▶️ Start</button>') + '</div>'
    + '<p id="syMcMeldung" style="margin:6px 0 0;min-height:1.2em"></p>';
  const melden = (t) => { box.querySelector('#syMcMeldung').textContent = t; };
  const tun = async (body, text) => {
    melden('⏳ ' + text + ' …');
    const x = await syApi('admin/minecraft', 'POST', body).catch(() => ({ status: 0 }));
    melden(x.status === 200 ? '✓ ' + text : '⚠️ ' + ((x.json && x.json.fehler) || 'Hat nicht geklappt.'));
    setTimeout(() => syMinecraftZeigen(d), body.aktion === 'start' || body.aktion === 'neustart' ? 20000 : 1200);
  };
  box.querySelector('#syMcPlus').addEventListener('click', () => { const n = box.querySelector('#syMcName').value.trim(); if (n) tun({ aktion: 'freischalten', spieler: n }, n + ' freigeschaltet'); });
  box.querySelectorAll('[data-mcweg]').forEach((b) => b.addEventListener('click', () => { if (confirm(b.dataset.mcweg + ' von der Whitelist entfernen?')) tun({ aktion: 'entfernen', spieler: b.dataset.mcweg }, b.dataset.mcweg + ' entfernt'); }));
  box.querySelectorAll('[data-mc]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.mc; if (a === 'stopp' && !confirm('Minecraft-Server stoppen? Die Welt wird vorher gespeichert.')) return;
    tun({ aktion: a }, { start: 'Server startet (ca. 1 Minute)', stopp: 'Server gestoppt', neustart: 'Neustart (ca. 1 Minute)' }[a]);
  }));
}

// Erweiterungen (zurzeit AdGuard Home): Status, Installieren per Knopf, danach Anleitung für zu Hause
function syErweiterungenZeigen(d, st) {
  const box = d.querySelector('#syErweiterungen'); if (!box || box.dataset.laeuft) return;
  const ag = (st.erweiterungen && st.erweiterungen.adguard) || {}, ip = st.lanIp || 'IP des Laptops';
  const letzte = (st.erweiterungenLog || []).slice(-1)[0] || '';
  if (ag.laeuft) {
    box.innerHTML = '<b>🛡️ AdGuard Home läuft ✓</b><br>Zu Hause am Handy: Einstellungen → WLAN → (i) beim Heim-WLAN → <b>DNS konfigurieren → Manuell</b> → alle Server löschen, <b>' + syEsc(ip) + '</b> hinzufügen.'
      + '<br>Verwaltung (nur im Heimnetz): <b>http://' + syEsc(ip) + ':3000</b> · Benutzer <b>admin</b>'
      + '<div style="margin-top:8px"><input type="password" id="syAgListenPw" autocomplete="current-password" placeholder="AdGuard-Passwort" style="width:100%;padding:10px;margin:0 0 6px;font-size:16px;border-radius:10px;border:1px solid #888;box-sizing:border-box">'
      + '<button type="button" class="btn secondary" id="syAgListen" style="margin:0;width:100%">🧹 Empfohlene Sperrlisten eintragen (HaGeZi Pro + Malware-Schutz)</button>'
      + '<div id="syAgListenInfo" style="margin-top:6px"></div></div>';
    box.querySelector('#syAgListen').addEventListener('click', async () => {
      const knopf = box.querySelector('#syAgListen'), info = box.querySelector('#syAgListenInfo'), pw = box.querySelector('#syAgListenPw').value;
      if (!pw) { box.querySelector('#syAgListenPw').focus(); return; }
      knopf.disabled = true; knopf.textContent = '⏳ AdGuard lädt die Listen … (bis zu 1 Minute)';
      const r = await syApi('admin/adguard-listen', 'POST', { passwort: pw }).catch(() => ({ status: 0 }));
      knopf.disabled = false; knopf.textContent = '🧹 Empfohlene Sperrlisten eintragen (HaGeZi Pro + Malware-Schutz)';
      if (r.status !== 200) { info.textContent = '⚠️ ' + ((r.json && r.json.fehler) || 'Hat nicht geklappt.'); return; }
      box.querySelector('#syAgListenPw').value = '';
      info.innerHTML = '✓ ' + (r.json.neu.length ? 'Hinzugefügt: ' + r.json.neu.map(syEsc).join(', ') : 'Die Listen waren schon aktiv.')
        + '<br>Aktive Listen: ' + r.json.listen.filter((l) => l.an).map((l) => syEsc(l.name) + ' <span style="opacity:.7">(' + l.regeln.toLocaleString('de-DE') + ')</span>').join(' · ');
    });
    return;
  }
  box.innerHTML = '<b>🛡️ AdGuard Home</b> – blockt Werbung und Tracker für alle Geräte im Heim-WLAN.'
    + (ag.installiert ? '<br>⚠️ Installiert, antwortet aber gerade nicht.' : '')
    + (letzte ? '<br><span style="opacity:.8">' + syEsc(letzte.replace(/^\S+ (\S+)\s+/, '$1 ')) + '</span>' : '')
    + '<input type="password" id="syAgPw" autocomplete="new-password" placeholder="Neues Passwort für die AdGuard-Verwaltung (mind. 8 Zeichen)" style="width:100%;padding:10px;margin:8px 0 6px;font-size:16px;border-radius:10px;border:1px solid #888;box-sizing:border-box">'
    + '<button type="button" class="btn secondary" id="syAgLos" style="margin:0;width:100%">🛡️ AdGuard installieren</button>';
  box.querySelector('#syAgLos').addEventListener('click', async () => {
    const pw = box.querySelector('#syAgPw').value, knopf = box.querySelector('#syAgLos');
    knopf.disabled = true; knopf.textContent = '⏳ Wird gestartet …';
    const r = await syApi('admin/erweiterung', 'POST', { name: 'adguard', passwort: pw }).catch(() => ({ status: 0 }));
    if (r.status !== 200) { knopf.disabled = false; knopf.textContent = '🛡️ AdGuard installieren'; alert((r.json && r.json.fehler) || 'Konnte nicht starten.'); return; }
    box.dataset.laeuft = '1'; knopf.textContent = '⏳ Installiert … (bis zu 2 Minuten)';
    const bis = Date.now() + 3 * 60e3;
    while (Date.now() < bis && d.open) {
      await new Promise((ok) => setTimeout(ok, 5000));
      let st2; try { const x = await syApi('admin/status'); if (x.status !== 200) continue; st2 = x.json; } catch (e) { continue; }
      const l = (st2.erweiterungenLog || []).slice(-1)[0] || '';
      if (st2.erweiterungen && st2.erweiterungen.adguard && st2.erweiterungen.adguard.laeuft || /FEHLER|Fertig/.test(l)) { delete box.dataset.laeuft; syErweiterungenZeigen(d, st2); if (/FEHLER/.test(l)) alert(l.replace(/^\S+ \S+\s+/, '')); return; }
    }
    delete box.dataset.laeuft; if (d.open) { knopf.disabled = false; knopf.textContent = '🛡️ Nochmal prüfen / installieren'; }
  });
}
// App auf diesem Gerät auf die neue Version bringen (Service Worker prüfen lassen, dann neu laden – Daten bleiben)
async function syAppNeuLaden() {
  try { const r = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (r) await r.update(); } catch (e) { /* offline – dann einfach neu laden */ }
  setTimeout(() => location.reload(), 800);
}
async function syServerStatus(d) {
  const el = d.querySelector('#syServerStand'); if (!el) return null;
  try {
    const r = await syApi('admin/status');
    if (r.status !== 200) throw new Error();
    d.querySelector('#syServerVersion').textContent = r.json.version || '?';
    d.querySelector('#syServerKonten').textContent = r.json.konten + ' · ' + r.json.duelle + ' Duelle';
    syErweiterungenZeigen(d, r.json);
    syMinecraftZeigen(d);
    syAufgabeZeigen(d, r.json.aufgabe);
    const letzte = (r.json.log || []).slice(-1)[0] || '';
    el.textContent = letzte ? 'Letztes Update: ' + letzte.replace(/^(\S+) (\S+)\s+/, '$1 $2 · ') : '';
    return r.json;
  } catch (e) { el.textContent = 'Server gerade nicht erreichbar (startet vielleicht neu) …'; return null; }
}
async function syServerAktualisieren(d) {
  const knopf = d.querySelector('#syServerUpdate'), el = d.querySelector('#syServerStand');
  const vorher = await syServerStatus(d), vorherLog = vorher ? (vorher.log || []).join('\n') : '';
  knopf.disabled = true; knopf.textContent = '⏳ Update läuft …';
  const r = await syApi('admin/aktualisieren', 'POST', {}).catch(() => ({ status: 0 }));
  if (r.status !== 200) { el.textContent = '⚠️ ' + ((r.json && r.json.fehler) || 'Update konnte nicht gestartet werden.'); knopf.disabled = false; knopf.textContent = '🖥️ Server aktualisieren'; return; }
  // Auf einen neuen Eintrag im Update-Protokoll warten (der Konto-Server startet dabei kurz neu)
  const bis = Date.now() + 4 * 60e3;
  while (Date.now() < bis && d.open) {
    await new Promise((ok) => setTimeout(ok, 4000));
    const st = await syServerStatus(d);
    if (!st) continue;
    const log = (st.log || []).join('\n');
    if (log === vorherLog) continue;
    const letzte = (st.log || []).slice(-1)[0] || '';
    if (/Fertig|Schon aktuell/.test(letzte)) {
      knopf.disabled = false;
      if (/Fertig/.test(letzte)) { knopf.textContent = '🔄 Fertig – App neu laden'; knopf.dataset.neuLaden = '1'; d.querySelector('#syServerNeu').textContent = '✓ Server ist auf dem neuesten Stand.'; }
      else { knopf.textContent = '✓ Schon aktuell'; knopf.hidden = true; }
      return;
    }
    if (/FEHLER|zurückgenommen/.test(letzte)) { knopf.disabled = false; knopf.textContent = '🖥️ Nochmal versuchen'; return; }
  }
  if (d.open) { knopf.disabled = false; knopf.textContent = '🖥️ Server aktualisieren'; el.textContent += ' (keine Rückmeldung – siehe update.log)'; }
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
  syBestenliste(true); syDuelleLaden(true);
  if (syGestartet) return;
  syGestartet = true;
  setInterval(() => { if (document.visibilityState === 'visible') { syAbgleich(); syBestenliste(false); syDuelleLaden(false); } }, SY_TAKT);
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
