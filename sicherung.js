// 💾 Sicherung – alle Spielstände, Profile, Fitness, Studio-Projekte … (und auf Wunsch die eigenen Songs) als eine Datei.
// Hintergrund: iOS löscht beim Entfernen der Home-Bildschirm-App alle ihre Daten. Die Datei legt man über „Teilen →
// In Dateien sichern“ in iCloud Drive ab und spielt sie nach dem Neuinstallieren wieder ein. Kein Server, kein Konto.
// Format: { app: 'spielekiste', format: 1, erstellt, stand, daten: { schlüssel: text }, songs: [{ id, name, groesse, b64 }] }
const SB_KEY = 'walquiz.sicherung.v1';            // { zuletzt, spaeter } – letzte Sicherung, „später erinnern“
const SB_VORHER = 'spielekiste-vor-einspielen';   // Stand vor dem letzten Einspielen (zum Rückgängigmachen; bewusst ohne „walquiz.“)
const SB_TAGE = 7;

function sbSchluessel() {
  const l = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('walquiz.')) l.push(k); } } catch (e) { /* kein Speicher */ }
  return l.sort();
}
const sbInfo = () => { try { return JSON.parse(localStorage.getItem(SB_KEY) || '{}'); } catch (e) { return {}; } };
const sbInfoSetzen = (x) => { try { localStorage.setItem(SB_KEY, JSON.stringify(Object.assign(sbInfo(), x))); } catch (e) { /* voll */ } };
// Gibt es überhaupt etwas, das sich zu sichern lohnt? (mehr als Profil/Einstellungen)
function sbHatDaten() {
  const egal = ['walquiz.profile.v1', 'walquiz.installhinweis.v1', 'walquiz.audio.v1', SB_KEY, 'walquiz.zuletzt.v1', 'walquiz.gesehen.v1'];
  return sbSchluessel().some((k) => !egal.includes(k));
}
function sbB64(buf) { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
function sbAusB64(t) { const s = atob(t), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b.buffer; }
async function sbSongsLesen() {
  if (typeof srDbTun !== 'function') return [];
  try { return (await srDbTun('readonly', (s) => s.getAll())) || []; } catch (e) { return []; }
}
async function sbErstellen(mitSongs) {
  const daten = {}; sbSchluessel().forEach((k) => { daten[k] = localStorage.getItem(k); });
  const songs = mitSongs ? (await sbSongsLesen()).map((x) => ({ id: x.id, name: x.name, groesse: x.groesse, b64: sbB64(x.daten) })) : [];
  return { app: 'spielekiste', format: 1, erstellt: new Date().toISOString(), stand: typeof APP_STAND !== 'undefined' ? APP_STAND : '', daten, songs };
}
const sbDateiname = () => 'Spielekiste-Sicherung-' + new Date().toISOString().slice(0, 10) + '.json';
async function sbSichern(mitSongs) {
  const obj = await sbErstellen(mitSongs), text = JSON.stringify(obj), datei = new File([text], sbDateiname(), { type: 'application/json' });
  // iPhone: Teilen-Menü („In Dateien sichern“ → iCloud Drive); sonst normaler Download
  if (navigator.canShare && navigator.share && navigator.canShare({ files: [datei] })) {
    try { await navigator.share({ files: [datei], title: 'Spielekiste-Sicherung' }); }
    catch (e) { if (e && e.name === 'AbortError') return { ok: false, abgebrochen: true }; return sbHerunterladen(datei, obj); }
    sbInfoSetzen({ zuletzt: Date.now(), groesse: text.length }); return { ok: true, weg: 'teilen', obj };
  }
  return sbHerunterladen(datei, obj);
}
function sbHerunterladen(datei, obj) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(datei); a.download = datei.name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  sbInfoSetzen({ zuletzt: Date.now(), groesse: datei.size }); return { ok: true, weg: 'download', obj };
}
// Datei prüfen → { obj } oder { fehler }
function sbPruefen(text) {
  let obj; try { obj = JSON.parse(text); } catch (e) { return { fehler: 'Das ist keine gültige Sicherungsdatei.' }; }
  if (!obj || obj.app !== 'spielekiste' || typeof obj.daten !== 'object' || !obj.daten) return { fehler: 'Diese Datei ist keine Spielekiste-Sicherung.' };
  if (obj.format > 1) return { fehler: 'Diese Sicherung stammt aus einer neueren App-Version – bitte erst die App aktualisieren.' };
  const fremd = Object.keys(obj.daten).filter((k) => !k.startsWith('walquiz.') || typeof obj.daten[k] !== 'string');
  if (fremd.length) return { fehler: 'Die Sicherung enthält unerwartete Einträge und wird nicht eingespielt.' };
  return { obj };
}
async function sbEinspielen(obj) {
  // aktuellen Stand merken (zum Rückgängigmachen), dann ersetzen
  const vorher = {}; sbSchluessel().forEach((k) => { vorher[k] = localStorage.getItem(k); });
  try { localStorage.setItem(SB_VORHER, JSON.stringify({ zeit: Date.now(), daten: vorher })); } catch (e) { /* zu groß – dann ohne Rückgängig */ }
  sbSchluessel().forEach((k) => localStorage.removeItem(k));
  Object.entries(obj.daten).forEach(([k, v]) => localStorage.setItem(k, v));
  sbInfoSetzen({ zuletzt: Date.parse(obj.erstellt) || Date.now(), eingespielt: Date.now() });
  let songs = 0;
  if (Array.isArray(obj.songs) && obj.songs.length && typeof srDbTun === 'function') {
    for (const x of obj.songs) { try { await srDbTun('readwrite', (s) => s.put({ id: x.id, name: x.name, groesse: x.groesse, daten: sbAusB64(x.b64) })); songs++; } catch (e) { /* einzelner Song kaputt */ } }
  }
  return { eintraege: Object.keys(obj.daten).length, songs };
}
function sbRueckgaengig() {
  let v; try { v = JSON.parse(localStorage.getItem(SB_VORHER) || 'null'); } catch (e) { v = null; }
  if (!v || !v.daten) return false;
  sbSchluessel().forEach((k) => localStorage.removeItem(k));
  Object.entries(v.daten).forEach(([k, x]) => localStorage.setItem(k, x));
  localStorage.removeItem(SB_VORHER);
  return true;
}
const sbVorHer = (t) => { if (!t) return 'noch nie'; const d = Math.floor((Date.now() - t) / 864e5); return d <= 0 ? 'heute' : d === 1 ? 'gestern' : 'vor ' + d + ' Tagen'; };
const sbMB = (n) => (n / 1048576).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' MB';

// ---------- Oberfläche ----------
async function sbDialog() {
  const info = sbInfo(), songs = await sbSongsLesen(), songGroesse = songs.reduce((s, x) => s + (x.groesse || (x.daten && x.daten.byteLength) || 0), 0);
  let dauerhaft = null; try { if (navigator.storage && navigator.storage.persisted) dauerhaft = await navigator.storage.persisted(); } catch (e) { /* egal */ }
  let rueck = null; try { rueck = JSON.parse(localStorage.getItem(SB_VORHER) || 'null'); } catch (e) { /* egal */ }
  const html = '<h3>💾 Sicherung</h3>'
    + '<p class="sb-warn">Löschst du die App vom Home-Bildschirm, löscht das iPhone alle ihre Daten mit. Mit einer Sicherung in <b>iCloud Drive</b> holst du alles zurück.</p>'
    + '<ul class="ft-check"><li><b>Letzte Sicherung</b><span id="sbZuletzt">' + sbVorHer(info.zuletzt) + '</span></li><li><b>Daten</b><span>' + sbSchluessel().length + ' Einträge' + (songs.length ? ' · ' + songs.length + (songs.length === 1 ? ' eigener Song' : ' eigene Songs') : '') + '</span></li>'
    + '<li><b>Dauerhaft gespeichert</b><span>' + (dauerhaft === true ? 'ja ✓' : dauerhaft === false ? 'nein – Sicherung umso wichtiger' : 'unbekannt') + '</span></li></ul>'
    + (songs.length ? '<label class="sb-songs"><input type="checkbox" id="sbMitSongs"' + (songGroesse < 40 * 1048576 ? ' checked' : '') + '> eigene Songs mitsichern (' + sbMB(songGroesse) + ')</label>' : '')
    + '<button type="button" class="btn sb-los" id="sbJetzt">💾 Jetzt sichern</button>'
    + '<p class="ft-klein sb-schritte">Auf dem iPhone: im Teilen-Menü <b>„In Dateien sichern“</b> → <b>iCloud Drive</b> wählen. So liegt die Sicherung sicher in der Cloud.</p>'
    + '<label class="btn secondary sb-einspielen">📂 Sicherung einspielen<input type="file" id="sbDatei" accept=".json,application/json" hidden></label>'
    + (rueck ? '<button type="button" class="btn secondary" id="sbRueck">↺ Letztes Einspielen rückgängig (' + new Date(rueck.zeit).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) + ')</button>' : '')
    + '<p class="ft-klein" id="sbMeldung" role="status"></p>';
  const d = skDialog(html);
  d.querySelector('#sbJetzt').addEventListener('click', async () => {
    const m = d.querySelector('#sbMeldung'); m.textContent = 'Sicherung wird erstellt …';
    const r = await sbSichern(!!(d.querySelector('#sbMitSongs') && d.querySelector('#sbMitSongs').checked));
    m.textContent = r.ok ? '✓ Gesichert' + (r.weg === 'download' ? ' – die Datei liegt in deinen Downloads.' : '.') : 'Abgebrochen – nichts gesichert.';
    if (r.ok) { d.querySelector('#sbZuletzt').textContent = 'heute'; sbHinweis(); }
  });
  d.querySelector('#sbDatei').addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0], m = d.querySelector('#sbMeldung'); if (!f) return;
    e.target.value = '';   // dieselbe Datei soll sich erneut auswählen lassen
    const p = sbPruefen(await f.text());
    if (p.fehler) { m.textContent = '⚠️ ' + p.fehler; return; }
    const datum = new Date(p.obj.erstellt).toLocaleString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (!confirm('Sicherung vom ' + datum + ' einspielen?\n\n' + Object.keys(p.obj.daten).length + ' Einträge' + (p.obj.songs && p.obj.songs.length ? ', ' + p.obj.songs.length + ' Songs' : '') + '.\nDie aktuellen Daten auf diesem Gerät werden ersetzt (lässt sich rückgängig machen).')) return;
    const r = await sbEinspielen(p.obj);
    m.textContent = '✓ ' + r.eintraege + ' Einträge' + (r.songs ? ' und ' + r.songs + ' Songs' : '') + ' eingespielt – die App startet neu …';
    setTimeout(() => location.reload(), 900);
  });
  if (d.querySelector('#sbRueck')) d.querySelector('#sbRueck').addEventListener('click', () => { if (confirm('Den Stand von vor dem Einspielen wiederherstellen?') && sbRueckgaengig()) location.reload(); });
}
// Erinnerung im Hub, wenn es Daten gibt und die letzte Sicherung fehlt oder älter als 7 Tage ist
function sbHinweis() {
  const hub = $('screen-hub'); if (!hub) return;
  let box = $('sbHinweis');
  const info = sbInfo(), faellig = sbHatDaten() && (!info.zuletzt || Date.now() - info.zuletzt > SB_TAGE * 864e5) && !(info.spaeter > Date.now());
  if (!faellig) { if (box) box.remove(); return; }
  if (!box) {
    box = document.createElement('div'); box.id = 'sbHinweis'; box.className = 'sb-hinweis'; box.setAttribute('role', 'status');
    const ziel = hub.querySelector('.spalte-a'); if (!ziel) return;
    ziel.insertBefore(box, ziel.firstChild);
  }
  box.innerHTML = '<span class="sb-hi-icon">💾</span><div><b>Daten sichern</b><small>Letzte Sicherung: ' + sbVorHer(info.zuletzt) + '. Beim Löschen der App wären sonst alle Spielstände weg.</small></div><button type="button" class="sb-hi-los">Sichern</button><button type="button" class="sb-hi-zu" aria-label="Später erinnern">×</button>';
  box.querySelector('.sb-hi-los').addEventListener('click', sbDialog);
  box.querySelector('.sb-hi-zu').addEventListener('click', () => { sbInfoSetzen({ spaeter: Date.now() + 3 * 864e5 }); box.remove(); });
}
// Browser bitten, die Daten nicht von selbst aufzuräumen (gegen Löschen der App hilft das nicht)
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* egal */ }
if ($('sicherungBtn')) $('sicherungBtn').addEventListener('click', sbDialog);
// Nach dem Neuinstallieren kommt zuerst „Wer spielt?“ – dort direkt einspielen können
if ($('pwSicherung')) $('pwSicherung').addEventListener('click', sbDialog);
if ($('pwSicherungNeu')) $('pwSicherungNeu').addEventListener('click', sbDialog);
setTimeout(sbHinweis, 0);
