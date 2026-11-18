// ☁️ Spielstand-Sync mit Benutzerkonto (Name + PIN) über den eigenen Homeserver.
// Server: werkzeuge/homeserver/spielstand-server.js hinter Caddy unter ./api/ auf derselben Adresse wie die App.
// Gibt es dort keinen solchen Server (z. B. GitHub Pages), bleibt alles wie bisher: nur lokaler Speicher, kein ☁️-Knopf.
//
// Anmelden: Beim ersten Besuch fragt die App einmal „Anmelden oder neu registrieren?“ (oder „Ohne Konto spielen“).
// Danach merkt sich das Gerät die Anmeldung (Cookie, 1 Jahr). Über ☁️ kann man sich später an- und abmelden.
//
// Abgleich: Der komplette Stand (alle „walquiz.“-Einträge außer gerätebezogenen) liegt pro Konto auf dem Server, mit
// fortlaufender Versionsnummer. Jedes Gerät merkt sich, auf welcher Version sein Stand beruht.
//  • Server neuer, hier nichts Neues gespielt → Server-Stand übernehmen und neu laden.
//  • Hier Neues gespielt, Server unverändert   → hochladen (der Server lehnt ab, wenn inzwischen ein anderes Gerät schneller war).
//  • Beides                                     → fragen, welcher Stand gilt. Der andere wird auf dem Server als Konflikt-Kopie
//                                                 aufgehoben, geht also nie verloren. Zusätzlich legt der Server täglich eine Kopie an.
const SY_META = 'spielekiste-sync';   // bewusst ohne „walquiz.“ – wird selbst nicht synchronisiert und nicht gesichert
const SY_SPAETER = 'spielekiste-konto-spaeter';
const SY_API = new URL('api/', location.href).href;
const SY_NIE = ['walquiz.sicherung.v1', 'walquiz.installhinweis.v1', 'walquiz.photos.v4'];   // gerätebezogen bzw. nur Zwischenspeicher
const SY_TAKT = 15000;

let syZustand = 'aus';    // 'aus' (kein Server) | 'abgemeldet' | 'ok'
let syName = '';
let syLaeuft = false;     // gerade ein Abgleich unterwegs
let syGestartet = false;  // Takt und Ereignisse schon eingerichtet

const syMeta = () => { try { return JSON.parse(localStorage.getItem(SY_META) || '{}'); } catch (e) { return {}; } };
const syMetaSetzen = (x) => { try { localStorage.setItem(SY_META, JSON.stringify(Object.assign(syMeta(), x))); } catch (e) { /* voll */ } };

function sySchluessel() {
  const l = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('walquiz.') && !SY_NIE.includes(k)) l.push(k); } } catch (e) { /* kein Speicher */ }
  return l.sort();
}
function syDaten() { const d = {}; sySchluessel().forEach((k) => { d[k] = localStorage.getItem(k); }); return d; }
function syAbdruck(daten) {
  let h = 5381;
  Object.keys(daten).sort().forEach((k) => { const t = k + '=' + daten[k] + '\n'; for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; });
  return h.toString(36) + '.' + Object.keys(daten).length;
}
// Hat dieses Gerät seit dem letzten Abgleich etwas Neues? Ohne früheren Abgleich zählt jeder echte Spielstand als neu.
function syHierNeu() {
  const m = syMeta(), d = syDaten();
  if (m.abdruck) return syAbdruck(d) !== m.abdruck;
  const egal = ['walquiz.profile.v1', 'walquiz.audio.v1', 'walquiz.zuletzt.v1', 'walquiz.gesehen.v1'];
  return Object.keys(d).some((k) => !egal.includes(k));
}
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
    if (status === 200 && json && json.name) { syName = json.name; return 'ok'; }
    if (status === 401 && json && json.server === 'spielekiste') return 'abgemeldet';
  } catch (e) { /* offline oder kein Server */ }
  return 'aus';
}
const syPaket = (daten) => ({ geraet: syGeraet(), stand: typeof APP_STAND !== 'undefined' ? APP_STAND : '', daten });

// ---------- Abgleich ----------
function syUebernehmen(obj) {
  const neu = obj.daten;
  sySchluessel().forEach((k) => { if (!(k in neu)) localStorage.removeItem(k); });
  Object.entries(neu).forEach(([k, v]) => { if (k.startsWith('walquiz.') && !SY_NIE.includes(k) && typeof v === 'string') localStorage.setItem(k, v); });
  syMetaSetzen({ version: obj.version, abdruck: syAbdruck(syDaten()), zuletzt: Date.now() });
}
// → true: hochgeladen, false: ein anderes Gerät war schneller (beim nächsten Abgleich wird das geklärt)
async function syHochladen(basis) {
  const daten = syDaten();
  const { status, json } = await syApi('stand', 'PUT', Object.assign({ basis }, syPaket(daten)));
  if (status === 409) return false;
  if (status !== 200) throw new Error('Sync: Hochladen fehlgeschlagen (HTTP ' + status + ')');
  syMetaSetzen({ version: json.version, abdruck: syAbdruck(daten), zuletzt: Date.now() });
  return true;
}
// Ein Abgleich. ladenErlaubt=false: nichts übernehmen, das einen Neuladen braucht (z. B. beim Verlassen der App).
async function syAbgleich({ ladenErlaubt = true } = {}) {
  if (syZustand !== 'ok' || syLaeuft) return;
  syLaeuft = true;
  try {
    const hierNeu = syHierNeu(), basis = syMeta().version || 0;
    const { status, json } = await syApi('stand');
    if (status === 401) { syZustand = 'abgemeldet'; return; }
    if (status === 404) { if (sySchluessel().length) await syHochladen(0); return; }
    if (status !== 200) throw new Error('Sync: HTTP ' + status);
    const server = json;
    if (server.version === basis) { if (hierNeu) await syHochladen(basis); return; }
    if (!hierNeu) {
      if (!ladenErlaubt) return;
      syUebernehmen(server);
      sessionStorage.setItem('spielekiste-sync-hinweis', 'Spielstand vom ' + server.geraet + ' (' + syZeit(server.zeit) + ') übernommen');
      location.reload();
      return;
    }
    // Konflikt: hier und anderswo wurde gespielt
    if (!ladenErlaubt) return;
    const serverNehmen = confirm('☁️ Spielstand von ' + syName + '\n\nAuf einem anderen Gerät (' + server.geraet + ', ' + syZeit(server.zeit) + ') wurde ebenfalls gespielt.\n\n'
      + 'OK = den Stand vom anderen Gerät übernehmen\nAbbrechen = den Stand von diesem Gerät behalten\n\n'
      + 'Der jeweils andere Stand wird auf dem Homeserver aufgehoben.');
    if (serverNehmen) {
      await syApi('konflikt', 'POST', Object.assign({ version: basis, zeit: new Date().toISOString() }, syPaket(syDaten())));
      syUebernehmen(server);
      sessionStorage.setItem('spielekiste-sync-hinweis', 'Stand vom ' + server.geraet + ' übernommen – der Stand dieses Geräts ist auf dem Server aufgehoben');
      location.reload();
    } else {
      await syApi('konflikt', 'POST', server);
      if (await syHochladen(server.version)) syHinweis('Stand dieses Geräts gilt jetzt überall');
    }
  } catch (e) {
    console.warn(e);
  } finally {
    syLaeuft = false;
    syKnopf();
  }
}

// ---------- ☁️-Knopf ----------
function syKnopf() {
  let b = document.getElementById('syncBtn');
  if (syZustand === 'aus') { if (b) b.hidden = true; return; }
  if (!b) {
    const ziel = document.getElementById('sicherungBtn');
    if (!ziel || !ziel.parentNode) return;
    b = document.createElement('button'); b.type = 'button'; b.id = 'syncBtn'; b.className = 'vollbild-btn';
    b.addEventListener('click', () => (syZustand === 'ok' ? syKontoDialog() : syAnmeldeDialog()));
    ziel.parentNode.insertBefore(b, ziel);
  }
  b.hidden = false;
  b.textContent = syZustand === 'ok' ? '☁️' : '👤';
  b.title = syZustand === 'ok' ? 'Angemeldet als ' + syName : 'Anmelden – Spielstand auf allen Geräten';
  b.setAttribute('aria-label', b.title);
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
  if (syMeta().konto !== name.toLowerCase()) localStorage.setItem(SY_META, JSON.stringify({ konto: name.toLowerCase() }));
  localStorage.removeItem(SY_SPAETER);
  syName = name; syZustand = 'ok'; syKnopf();
  syHinweis(neu ? 'Willkommen, ' + name + '! Dein Spielstand ist jetzt gesichert' : 'Angemeldet als ' + name);
  await syLaufen();
}
function syKontoDialog() {
  const m = syMeta();
  const d = skDialog('<h3>☁️ ' + syEsc(syName) + '</h3>'
    + '<ul class="ft-check"><li><b>Spielstand</b><span>auf allen Geräten gleich ✓</span></li><li><b>Zuletzt abgeglichen</b><span>' + (m.zuletzt ? syZeit(m.zuletzt) : '–') + '</span></li></ul>'
    + '<p class="ft-klein">Auf einem anderen Gerät einfach die Seite öffnen und mit demselben Namen und derselben PIN anmelden.</p>'
    + '<button type="button" class="btn secondary" id="syJetzt">🔄 Jetzt abgleichen</button>'
    + '<button type="button" class="btn secondary" id="syAbmelden">Abmelden</button>');
  d.querySelector('#syJetzt').addEventListener('click', async () => { d.close(); await syAbgleich(); syHinweis('Abgeglichen ✓'); });
  d.querySelector('#syAbmelden').addEventListener('click', async () => {
    await syAbgleich({ ladenErlaubt: false });   // letzten Stand noch sichern
    try { await syApi('abmelden', 'POST', {}); } catch (e) { /* offline – Cookie bleibt dann eben */ }
    syZustand = 'abgemeldet'; syName = ''; localStorage.setItem(SY_SPAETER, '1'); d.close(); syKnopf(); syHinweis('Abgemeldet');
  });
}

function syHinweis(text) {
  const el = document.createElement('div');
  el.className = 'sync-hinweis';
  el.textContent = '☁️ ' + text;
  el.style.cssText = 'position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;'
    + 'background:rgba(15,23,42,.92);color:#fff;padding:10px 16px;border-radius:999px;font:600 14px/1.3 system-ui,sans-serif;'
    + 'box-shadow:0 6px 24px rgba(0,0,0,.3);max-width:90vw;text-align:center;pointer-events:none;transition:opacity .4s';
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; }, 3500);
  setTimeout(() => el.remove(), 4000);
}

// ---------- Start ----------
async function syLaufen() {
  await syAbgleich();
  if (syGestartet) return;
  syGestartet = true;
  setInterval(() => { if (document.visibilityState === 'visible' && syHierNeu()) syAbgleich({ ladenErlaubt: false }); }, SY_TAKT);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') syAbgleich({ ladenErlaubt: false });
    else syAbgleich();   // zurück in der App: schauen, ob anderswo gespielt wurde
  });
}
async function syStart() {
  syZustand = await syPruefen();
  syKnopf();
  const h = sessionStorage.getItem('spielekiste-sync-hinweis');
  if (h) { sessionStorage.removeItem('spielekiste-sync-hinweis'); syHinweis(h); }
  if (syZustand === 'ok') return syLaufen();
  if (syZustand === 'abgemeldet' && !localStorage.getItem(SY_SPAETER)) setTimeout(syAnmeldeDialog, 600);
}

if (typeof window !== 'undefined' && 'fetch' in window && location.protocol !== 'file:') syStart();
