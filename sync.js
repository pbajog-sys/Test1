// ☁️ Spielstand-Sync über den eigenen Homeserver (WebDAV unter ./sync/ auf derselben Adresse wie die App).
// Gibt es dort keinen Sync (z. B. GitHub Pages), bleibt alles wie bisher: nur lokaler Speicher.
//
// Prinzip: Der komplette Stand (alle „walquiz.“-Einträge außer gerätebezogenen) liegt als eine Datei sync/stand.json
// mit fortlaufender Versionsnummer auf dem Server. Jedes Gerät merkt sich, auf welcher Version sein Stand beruht.
//  • Server neuer, hier nichts Neues gespielt → Server-Stand übernehmen und neu laden.
//  • Hier Neues gespielt, Server unverändert   → hochladen (Version + 1).
//  • Beides                                     → fragen, welcher Stand gilt. Der andere wird als
//                                                 sync/konflikt-….json auf dem Server aufgehoben, geht also nie verloren.
// Zusätzlich legt der Sync einmal am Tag eine Kopie sync/archiv-JJJJ-MM-TT.json an.
// Schutz: Der Server lässt /sync/ nur mit dem richtigen Sync-Code (Kopfzeile X-Sync-Code) zu. Den Code gibt man
// pro Gerät einmal ein; er bleibt nur auf diesem Gerät (nicht im Sync, nicht in der Sicherung).
// Antwortet der Server ohne gültigen Code mit 401 und „X-Spielekiste-Sync: code“, fragt die App danach.
const SY_META = 'spielekiste-sync';   // bewusst ohne „walquiz.“ – wird selbst nicht synchronisiert und nicht gesichert
const SY_BASIS = new URL('sync/', location.href).href;
const SY_NIE = ['walquiz.sicherung.v1', 'walquiz.installhinweis.v1', 'walquiz.photos.v4'];   // gerätebezogen bzw. nur Zwischenspeicher
const SY_TAKT = 15000;
const SY_CODE = 'spielekiste-sync-code';   // ebenfalls ohne „walquiz.“

let syAktiv = false;      // Server mit Sync gefunden
let syLaeuft = false;     // gerade ein Abgleich unterwegs

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

const syKopf = (extra) => Object.assign({ 'X-Sync-Code': localStorage.getItem(SY_CODE) || '' }, extra || {});
async function syHolen() {
  const r = await fetch(SY_BASIS + 'stand.json', { cache: 'no-store', headers: syKopf() });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('Sync: HTTP ' + r.status);
  const obj = await r.json();
  if (!obj || obj.app !== 'spielekiste' || typeof obj.daten !== 'object' || typeof obj.version !== 'number') throw new Error('Sync: unbekannte Datei');
  return obj;
}
async function syAblegen(name, obj) {
  const r = await fetch(SY_BASIS + name, { method: 'PUT', headers: syKopf({ 'Content-Type': 'application/json' }), body: JSON.stringify(obj) });
  if (!r.ok) throw new Error('Sync: Speichern fehlgeschlagen (HTTP ' + r.status + ')');
}
const syPaket = (version, daten) => ({ app: 'spielekiste', format: 1, version, zeit: new Date().toISOString(), geraet: syGeraet(), stand: typeof APP_STAND !== 'undefined' ? APP_STAND : '', daten });

// Gibt es auf dieser Adresse überhaupt einen Sync-Server? (WebDAV antwortet auf OPTIONS mit „DAV“)
// → 'ok' | 'code' (Server da, Code fehlt/falsch) | 'aus'
async function syPruefen() {
  try {
    const r = await fetch(SY_BASIS, { method: 'OPTIONS', cache: 'no-store', headers: syKopf() });
    if (r.ok && r.headers.get('DAV')) return 'ok';
    if (r.status === 401 && r.headers.get('X-Spielekiste-Sync') === 'code') return 'code';
    return 'aus';
  } catch (e) { return 'aus'; }
}
async function syErkennen() {
  let z = await syPruefen();
  // höchstens zweimal pro Sitzung nach dem Code fragen; „Abbrechen“ = in dieser Sitzung nicht mehr fragen
  for (let versuch = 0; z === 'code' && versuch < 2 && !sessionStorage.getItem('spielekiste-sync-nicht-fragen'); versuch++) {
    const c = prompt((versuch ? 'Der Sync-Code stimmt nicht. ' : '') + '☁️ Spielstand-Sync\n\nBitte den Sync-Code deines Homeservers eingeben (nur einmal pro Gerät nötig):');
    if (!c || !c.trim()) { sessionStorage.setItem('spielekiste-sync-nicht-fragen', '1'); break; }
    localStorage.setItem(SY_CODE, c.trim());
    z = await syPruefen();
  }
  return z === 'ok';
}

function syUebernehmen(obj) {
  const neu = obj.daten;
  sySchluessel().forEach((k) => { if (!(k in neu)) localStorage.removeItem(k); });
  Object.entries(neu).forEach(([k, v]) => { if (k.startsWith('walquiz.') && !SY_NIE.includes(k) && typeof v === 'string') localStorage.setItem(k, v); });
  syMetaSetzen({ version: obj.version, abdruck: syAbdruck(syDaten()), zuletzt: Date.now() });
}

async function syHochladen(version) {
  const daten = syDaten();
  await syAblegen('stand.json', syPaket(version, daten));
  const heute = new Date().toISOString().slice(0, 10), m = syMeta();
  syMetaSetzen({ version, abdruck: syAbdruck(daten), zuletzt: Date.now() });
  if (m.archiv !== heute) {
    try { await syAblegen('archiv-' + heute + '.json', syPaket(version, daten)); syMetaSetzen({ archiv: heute }); } catch (e) { /* Archiv ist nur Zugabe */ }
  }
}

// Ein Abgleich. ladenErlaubt=false: nichts übernehmen, das einen Neuladen braucht (z. B. mitten im Spiel).
async function syAbgleich({ ladenErlaubt = true } = {}) {
  if (!syAktiv || syLaeuft) return;
  syLaeuft = true;
  try {
    const hierNeu = syHierNeu();
    const server = await syHolen(), basis = syMeta().version || 0;
    if (!server) { if (hierNeu || sySchluessel().length) await syHochladen(1); return; }
    const serverNeu = server.version !== basis;
    if (!serverNeu) { if (hierNeu) await syHochladen(server.version + 1); return; }
    if (!hierNeu) {
      if (!ladenErlaubt) return;
      syUebernehmen(server);
      sessionStorage.setItem('spielekiste-sync-hinweis', 'Spielstand vom ' + server.geraet + ' (' + syZeit(server.zeit) + ') übernommen');
      location.reload();
      return;
    }
    // Konflikt: hier und anderswo wurde gespielt
    if (!ladenErlaubt) return;
    const serverNehmen = confirm('☁️ Spielstand-Sync\n\nAuf einem anderen Gerät (' + server.geraet + ', ' + syZeit(server.zeit) + ') wurde ebenfalls gespielt.\n\n'
      + 'OK = den Stand vom anderen Gerät übernehmen\nAbbrechen = den Stand von diesem Gerät behalten\n\n'
      + 'Der jeweils andere Stand wird auf dem Homeserver aufgehoben.');
    const stempel = new Date().toISOString().replace(/[:.]/g, '-');
    if (serverNehmen) {
      await syAblegen('konflikt-' + stempel + '-' + syGeraet() + '.json', syPaket(basis, syDaten()));
      syUebernehmen(server);
      sessionStorage.setItem('spielekiste-sync-hinweis', 'Stand vom ' + server.geraet + ' übernommen – der Stand dieses Geräts liegt als Konflikt-Datei auf dem Server');
      location.reload();
    } else {
      await syAblegen('konflikt-' + stempel + '-' + server.geraet + '.json', server);
      await syHochladen(server.version + 1);
      syHinweis('Stand dieses Geräts gilt jetzt überall');
    }
  } catch (e) {
    console.warn(e);
  } finally {
    syLaeuft = false;
  }
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

async function syStart() {
  syAktiv = await syErkennen();
  if (!syAktiv) return;
  const h = sessionStorage.getItem('spielekiste-sync-hinweis');
  if (h) { sessionStorage.removeItem('spielekiste-sync-hinweis'); syHinweis(h); }
  await syAbgleich();
  setInterval(() => { if (document.visibilityState === 'visible' && syHierNeu()) syAbgleich({ ladenErlaubt: false }); }, SY_TAKT);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') syAbgleich({ ladenErlaubt: false });
    else syAbgleich();   // zurück in der App: schauen, ob anderswo gespielt wurde
  });
}

if (typeof window !== 'undefined' && 'fetch' in window && location.protocol !== 'file:') syStart();
