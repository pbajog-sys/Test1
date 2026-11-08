// 💪 Fitness – Krafttraining und Ausdauer schnell während des Trainings eintragen, Fortschritt und Bestwerte sehen.
// Alles bleibt auf dem Gerät (je Profil). Bestwert-Schätzung für Kraft: geschätztes Maximalgewicht (1RM) nach Epley,
// kg × (1 + Wdh/30). Ausdauer: Tempo in min/km.
// Speicher: walquiz.fitness.v1 = { version: 1, einheiten: [{ id, start, ende, eintraege: [{ u, kg, wdh, km, sek, t }] }],
//   aktiv: Einheit|null, eigene: [{ id, name, art, gruppe, kg0 }], pause: Sekunden }
const FI_KEY = 'walquiz.fitness.v1';
const FI_STANDARD = [
  ['bank', 'Bankdrücken', 'kraft', 'Brust'], ['schraeg', 'Schrägbankdrücken', 'kraft', 'Brust'], ['liege', 'Liegestütze', 'kraft', 'Brust', 1],
  ['klimm', 'Klimmzüge', 'kraft', 'Rücken', 1], ['rudern', 'Langhantelrudern', 'kraft', 'Rücken'], ['latzug', 'Latzug', 'kraft', 'Rücken'], ['kreuz', 'Kreuzheben', 'kraft', 'Rücken'],
  ['knie', 'Kniebeugen', 'kraft', 'Beine'], ['presse', 'Beinpresse', 'kraft', 'Beine'], ['ausfall', 'Ausfallschritte', 'kraft', 'Beine'], ['waden', 'Wadenheben', 'kraft', 'Beine'],
  ['schulter', 'Schulterdrücken', 'kraft', 'Schultern'], ['seit', 'Seitheben', 'kraft', 'Schultern'],
  ['bizeps', 'Bizepscurls', 'kraft', 'Arme'], ['trizeps', 'Trizepsdrücken', 'kraft', 'Arme'], ['dips', 'Dips', 'kraft', 'Arme', 1],
  ['crunch', 'Crunches', 'kraft', 'Bauch', 1], ['beinheben', 'Beinheben', 'kraft', 'Bauch', 1],
  ['lauf', 'Laufen', 'ausdauer', 'Ausdauer'], ['rad', 'Radfahren', 'ausdauer', 'Ausdauer'], ['schwimm', 'Schwimmen', 'ausdauer', 'Ausdauer'],
  ['rudergeraet', 'Rudergerät', 'ausdauer', 'Ausdauer'], ['gehen', 'Gehen / Wandern', 'ausdauer', 'Ausdauer'], ['stepper', 'Crosstrainer', 'ausdauer', 'Ausdauer'],
].map(([id, name, art, gruppe, kg0]) => ({ id, name, art, gruppe, kg0: !!kg0 }));
let fi = null, fiTimer = null, fiWach = null;

// ---------- Speicher ----------
function fiStore() {
  const s = loadJson(FI_KEY);
  s.version = 1; s.einheiten = Array.isArray(s.einheiten) ? s.einheiten : []; s.eigene = Array.isArray(s.eigene) ? s.eigene : [];
  if (!(s.pause >= 15 && s.pause <= 600)) s.pause = 90;
  if (s.aktiv && !Array.isArray(s.aktiv.eintraege)) s.aktiv = null;
  return s;
}
const fiSpeichern = (s) => saveJson(FI_KEY, s);
const fiUebungen = (s = fiStore()) => FI_STANDARD.concat(s.eigene);
const fiUebung = (id, s) => fiUebungen(s).find((u) => u.id === id) || { id, name: id, art: 'kraft', gruppe: '', kg0: false };
const fiInfo = (u) => (typeof FI_INFO !== 'undefined' && FI_INFO[u.id]) || (u.muskel && typeof FI_MUSKELN !== 'undefined' && FI_MUSKELN[u.muskel] ? { p: [u.muskel], s: [], ausdauer: u.art === 'ausdauer', tipps: [] } : null);
const fiMuskelText = (info) => (info && info.p ? info.p.map((m) => FI_MUSKELN[m].name).join(', ') + (info.s && info.s.length ? ' · mit ' + info.s.map((m) => FI_MUSKELN[m].name).join(', ') : '') : '');
// Trainingsmenge je Muskel in einem Zeitraum: Hauptmuskel 1 pro Satz, mitarbeitender ½; Ausdauer zählt wie 2 Sätze
function fiMuskelMenge(s, ab) {
  const m = {};
  s.einheiten.concat(s.aktiv ? [s.aktiv] : []).filter((e) => e.start >= ab).forEach((e) => e.eintraege.forEach((x) => {
    const info = fiInfo(fiUebung(x.u, s)); if (!info) return;
    const k = x.km != null ? 2 : 1;
    info.p.forEach((q) => { m[q] = (m[q] || 0) + k; }); (info.s || []).forEach((q) => { m[q] = (m[q] || 0) + k / 2; });
  }));
  return m;
}
const fiTippDesTages = () => FI_TIPPS_ALLG[Math.floor(Date.now() / 864e5) % FI_TIPPS_ALLG.length];
const fiZahl = (n, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('de-DE');
const fiEsc = (t) => String(t).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
const fi1RM = (kg, wdh) => (wdh <= 1 ? kg : kg * (1 + wdh / 30));
const fiTempo = (sek, km) => (km > 0 ? sek / km : 0);   // Sekunden pro km
const fiZeit = (sek) => { sek = Math.round(sek); const h = Math.floor(sek / 3600), m = Math.floor((sek % 3600) / 60), s = sek % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
const fiDauer = (ms) => { const m = Math.round(ms / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ' h'; };
const fiDatum = (t, mitTag) => new Date(t).toLocaleDateString('de-DE', mitTag ? { weekday: 'short', day: 'numeric', month: 'numeric' } : { day: 'numeric', month: 'numeric', year: '2-digit' });
// Montag 0:00 der Woche von t
function fiWoche(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }

// Alle Einträge einer Übung über abgeschlossene Einheiten (+ optional die laufende), je Einheit zusammengefasst
function fiVerlauf(uid, s = fiStore(), mitAktiv = false) {
  const alle = s.einheiten.concat(mitAktiv && s.aktiv ? [s.aktiv] : []);
  return alle.map((e) => ({ t: e.start, l: e.eintraege.filter((x) => x.u === uid) })).filter((x) => x.l.length).sort((a, b) => a.t - b.t);
}
// Bestwerte einer Übung (ohne die angegebene Einheit)
function fiBest(uid, s = fiStore(), ohne = null) {
  const b = { kg: 0, kgWdh: 0, rm: 0, wdh: 0, km: 0, tempo: 0, sek: 0 };
  s.einheiten.concat(s.aktiv ? [s.aktiv] : []).forEach((e) => e.eintraege.forEach((x) => {
    if (x.u !== uid || x === ohne) return;
    if (x.wdh != null) { if (x.kg > b.kg || (x.kg === b.kg && x.wdh > b.kgWdh)) { b.kg = x.kg; b.kgWdh = x.wdh; } b.rm = Math.max(b.rm, fi1RM(x.kg, x.wdh)); b.wdh = Math.max(b.wdh, x.wdh); }
    if (x.km != null) { b.km = Math.max(b.km, x.km); b.sek = Math.max(b.sek, x.sek); if (x.km >= 1) { const p = fiTempo(x.sek, x.km); if (p > 0 && (!b.tempo || p < b.tempo)) b.tempo = p; } }
  }));
  return b;
}
// Was ist an diesem Eintrag ein neuer Bestwert?
function fiNeueBestwerte(x, s) {
  const b = fiBest(x.u, s, x), u = fiUebung(x.u, s), neu = [];
  const vorher = s.einheiten.some((e) => e.eintraege.some((y) => y.u === x.u)) || (s.aktiv && s.aktiv.eintraege.some((y) => y.u === x.u && y !== x));
  if (!vorher) return neu;   // erstes Mal zählt nicht als Rekord
  if (x.wdh != null) {
    if (x.kg > 0 && x.kg > b.kg) neu.push('Schwerstes Gewicht: ' + fiZahl(x.kg) + ' kg');
    else if (x.kg > 0 && fi1RM(x.kg, x.wdh) > b.rm + 0.01) neu.push('Neuer Kraft-Bestwert (≈ ' + fiZahl(fi1RM(x.kg, x.wdh)) + ' kg 1RM)');
    if (u.kg0 && !x.kg && x.wdh > b.wdh) neu.push('Meiste Wiederholungen: ' + x.wdh);
  } else {
    if (x.km > b.km) neu.push('Längste Strecke: ' + fiZahl(x.km, 2) + ' km');
    const p = fiTempo(x.sek, x.km); if (x.km >= 1 && b.tempo && p < b.tempo) neu.push('Schnellstes Tempo: ' + fiZeit(p) + ' min/km');
  }
  return neu;
}

// ---------- Übersicht ----------
function fiOeffnen() { show('fitness', '💪 Fitness'); fiStart(); }
function fiStart() {
  fiTimerAus(); fiWachAus(); fi = null;
  const s = fiStore(), jetzt = Date.now(), w0 = fiWoche(jetzt);
  $('fiTitel').textContent = '💪 Fitness';
  const dieseWoche = s.einheiten.filter((e) => e.start >= w0).length;
  // Wochen-Serie: Wochen in Folge mit mindestens einem Training (diese Woche zählt, sobald trainiert)
  let serie = 0; for (let w = w0 - (dieseWoche ? 0 : 7 * 864e5); ; w -= 7 * 864e5) { if (s.einheiten.some((e) => e.start >= w && e.start < w + 7 * 864e5)) serie++; else break; if (serie > 520) break; }
  const genutzt = [...new Set(s.einheiten.flatMap((e) => e.eintraege.map((x) => x.u)))];
  const letzte = s.einheiten.slice().sort((a, b) => b.start - a.start).slice(0, 6);
  $('fiInhalt').innerHTML = '<div class="fi-start">'
    + '<button type="button" class="fi-los" id="fiLos">' + (s.aktiv ? '▶ Weiter mit dem laufenden Training<small>seit ' + new Date(s.aktiv.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' · ' + s.aktiv.eintraege.length + ' Einträge</small>' : (s.planAktiv ? '▶ Freies Training' : '▶ Training starten')) + '</button>'
    + (typeof fiPlanKarte === 'function' && !s.aktiv ? fiPlanKarte(s) : '')
    + '<div class="fi-kacheln"><div><b>' + dieseWoche + '</b><span>diese Woche</span></div><div><b>' + serie + '</b><span>' + (serie === 1 ? 'Woche' : 'Wochen') + ' in Folge</span></div><div><b>' + s.einheiten.length + '</b><span>Trainings gesamt</span></div></div>'
    + fiWochenKarte(s, w0)
    + '<p class="fi-tipp">💡 ' + fiTippDesTages() + '</p>'
    + (genutzt.length ? '<h3 class="fi-h">📈 Fortschritt</h3><div class="fi-liste">' + genutzt.map((id) => fiZeile(id, s)).join('') + '</div>' : '<p class="fi-leer">Noch keine Trainings. Starte dein erstes – die Werte vom letzten Mal stehen beim nächsten Training schon drin.</p>')
    + (letzte.length ? '<h3 class="fi-h">🗓️ Letzte Trainings</h3><div class="fi-liste">' + letzte.map((e) => '<button type="button" class="fi-zeile" data-einheit="' + e.id + '"><span class="fi-ze">🏋️</span><span class="fi-zt"><b>' + fiDatum(e.start, true) + ' · ' + fiDauer(e.ende - e.start) + '</b><small>' + fiEinheitText(e, s) + '</small></span></button>').join('') + '</div>' : '')
    + '<div class="fi-unten"><button type="button" class="btn secondary" id="fiSichern">💾 Sichern (iCloud)</button><button type="button" class="btn secondary" id="fiExport">⬇ Daten als CSV</button></div>'
    + '<p class="ft-klein">Deine Trainingsdaten liegen nur auf diesem Gerät. Wichtig: Beim Löschen der App vom Home-Bildschirm sind sie weg – darum regelmäßig über „💾 Sichern“ in iCloud Drive ablegen.</p></div>';
  $('fiLos').addEventListener('click', fiTraining);
  if (typeof fiPlanVerdrahten === 'function') fiPlanVerdrahten();
  $('fiInhalt').querySelectorAll('[data-uebung]').forEach((b) => b.addEventListener('click', () => fiDetail(b.dataset.uebung)));
  $('fiInhalt').querySelectorAll('[data-einheit]').forEach((b) => b.addEventListener('click', () => fiEinheitZeigen(b.dataset.einheit)));
  $('fiExport').addEventListener('click', fiExport);
  $('fiSichern').addEventListener('click', () => { if (typeof sbDialog === 'function') sbDialog(); });
}
function fiWochenKarte(s, w0) {
  const m = fiMuskelMenge(s, w0), werte = {};
  Object.entries(m).forEach(([k, v]) => { werte[k] = Math.min(1, v / 10); });   // ~10 Sätze pro Woche = volle Farbe
  const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => FI_MUSKELN[k].name + ' ' + fiZahl(v, 1));
  const offen = FI_GRUPPEN.filter((g) => g[1] && !g[1].some((k) => m[k])).map((g) => g[0]);
  return '<div class="fi-woche"><div class="fi-woche-bild">' + fiKoerper(werte, 'vh', 'fi-gross') + '</div><div class="fi-woche-text"><h3 class="fi-h">🔥 Diese Woche</h3>'
    + (top.length ? '<p>' + top.join(' · ') + ' <small>Sätze</small></p>' : '<p>Noch nichts trainiert – die Figur füllt sich mit jedem Satz.</p>')
    + (offen.length && top.length ? '<p class="fi-offen">Noch nicht dran: ' + offen.join(', ') + '</p>' : '') + '</div></div>';
}
function fiEinheitText(e, s) {
  const proU = {}; e.eintraege.forEach((x) => { (proU[x.u] = proU[x.u] || []).push(x); });
  return Object.entries(proU).map(([u, l]) => fiEsc(fiUebung(u, s).name) + ' ' + (l[0].wdh != null ? l.length + '×' : fiZahl(l.reduce((a, x) => a + x.km, 0), 1) + ' km')).join(' · ') || 'leer';
}
function fiZeile(id, s) {
  const u = fiUebung(id, s), v = fiVerlauf(id, s), b = fiBest(id, s);
  const werte = v.map((x) => fiKennzahl(u, x.l)).filter((w) => w > 0);
  const bestText = u.art === 'ausdauer' ? (b.tempo ? fiZeit(b.tempo) + ' min/km' : fiZahl(b.km, 1) + ' km') : u.kg0 && !b.kg ? b.wdh + ' Wdh' : fiZahl(b.kg) + ' kg × ' + b.kgWdh;
  return '<button type="button" class="fi-zeile" data-uebung="' + id + '"><span class="fi-ze">' + fiIcon(fiInfo(u)) + '</span><span class="fi-zt"><b>' + fiEsc(u.name) + '</b><small>Bestwert ' + bestText + ' · ' + v.length + '× trainiert</small></span>' + fiMiniKurve(werte, u.art === 'ausdauer') + '</button>';
}
// Kennzahl je Einheit: Kraft = bestes geschätztes 1RM (oder meiste Wdh. ohne Gewicht), Ausdauer = Tempo (s/km, kleiner ist besser)
function fiKennzahl(u, l) {
  if (u.art === 'ausdauer') { const km = l.reduce((a, x) => a + x.km, 0), sek = l.reduce((a, x) => a + x.sek, 0); return fiTempo(sek, km); }
  if (l.every((x) => !x.kg)) return Math.max(...l.map((x) => x.wdh));
  return Math.max(...l.map((x) => fi1RM(x.kg, x.wdh)));
}
function fiMiniKurve(w, umgekehrt) {
  if (w.length < 2) return '<span class="fi-mini"></span>';
  const l = w.slice(-12), mi = Math.min(...l), ma = Math.max(...l), y = (v) => (ma === mi ? 12 : umgekehrt ? 3 + (v - mi) / (ma - mi) * 18 : 21 - (v - mi) / (ma - mi) * 18);
  const besser = umgekehrt ? l[l.length - 1] <= l[0] : l[l.length - 1] >= l[0];
  return '<svg class="fi-mini" viewBox="0 0 60 24" aria-hidden="true"><polyline fill="none" stroke="' + (besser ? '#4ade80' : '#fb923c') + '" stroke-width="2" stroke-linejoin="round" points="' + l.map((v, i) => (i / (l.length - 1) * 56 + 2).toFixed(1) + ',' + y(v).toFixed(1)).join(' ') + '"/></svg>';
}

// ---------- Training (live) ----------
function fiTraining() {
  const s = fiStore();
  if (!s.aktiv) { s.aktiv = { id: 'e' + Date.now().toString(36), start: Date.now(), eintraege: [] }; fiSpeichern(s); }
  const zuletzt = s.aktiv.eintraege.length ? s.aktiv.eintraege[s.aktiv.eintraege.length - 1].u : null;
  fi = { uebung: zuletzt, pauseEnde: 0 };
  if (!zuletzt && s.aktiv.plan && typeof fiPlanFortschritt === 'function') { const f = fiPlanFortschritt(s); if (f && f.liste.length) fi.uebung = (f.liste.find((x) => x.fertig < x.saetze) || f.liste[0]).u; }
  fiWachAn();
  fiTrainingZeichnen();
}
function fiTrainingZeichnen() {
  const s = fiStore(), a = s.aktiv; if (!a) { fiStart(); return; }
  $('fiTitel').textContent = '💪 Training läuft';
  const benutzt = [...new Set(a.eintraege.map((x) => x.u).concat(s.einheiten.slice().sort((x, y) => y.start - x.start).flatMap((e) => e.eintraege.map((x) => x.u))))].slice(0, 10);
  const u = fi.uebung ? fiUebung(fi.uebung, s) : null;
  $('fiInhalt').innerHTML = '<div class="fi-training">'
    + '<div class="fi-kopf"><span id="fiDauer"></span><span>' + a.eintraege.length + ' Einträge</span></div>'
    + (typeof fiPlanLeiste === 'function' ? fiPlanLeiste(s) : '')
    + '<div class="fi-chips' + (s.aktiv.plan ? ' fi-chips-klein' : '') + '">' + benutzt.filter((id) => !(s.aktiv.plan && fiPlanZiel(fiUebung(id, s), s))).map((id) => '<button type="button" data-wahl="' + id + '" class="fi-chip-icon' + (id === fi.uebung ? ' an' : '') + '">' + fiIcon(fiInfo(fiUebung(id, s))) + fiEsc(fiUebung(id, s).name) + '</button>').join('') + '<button type="button" class="fi-plus" id="fiNeueUebung">＋ Übung</button></div>'
    + (u ? fiEingabe(u, s) : '<p class="fi-leer">Wähle oben eine Übung oder tippe auf „＋ Übung“.</p>')
    + '<div class="fi-pause" id="fiPause" hidden></div>'
    + '<button type="button" class="btn secondary fi-ende" id="fiEnde">🏁 Training beenden</button></div>';
  $('fiInhalt').querySelectorAll('[data-wahl]').forEach((b) => b.addEventListener('click', () => { fi.uebung = b.dataset.wahl; fiTrainingZeichnen(); }));
  $('fiNeueUebung').addEventListener('click', fiUebungWaehlen);
  $('fiEnde').addEventListener('click', fiBeenden);
  if (u) fiEingabeVerdrahten(u);
  fiTimerAn();
}
// Vorschlag: letzter Satz dieser Übung (heute, sonst vom letzten Mal)
function fiVorschlag(u, s) {
  const heute = s.aktiv.eintraege.filter((x) => x.u === u.id);
  if (heute.length) return heute[heute.length - 1];
  const v = fiVerlauf(u.id, s); if (v.length) { const l = v[v.length - 1].l; return l[0]; }
  return u.art === 'ausdauer' ? { km: 5, sek: 30 * 60 } : { kg: u.kg0 ? 0 : 20, wdh: 10 };
}
// Doppelte Progression: Letztes Mal alle (≥ 2) Sätze mit dem schwersten Gewicht und gleicher Wdh.-Zahl (≥ 8) geschafft → mehr Gewicht
function fiSteigerung(u, s) {
  const info = fiInfo(u); if (u.art !== 'kraft' || !info || !info.schritt || s.aktiv.eintraege.some((x) => x.u === u.id)) return null;
  const v = fiVerlauf(u.id, s); if (!v.length) return null;
  const l = v[v.length - 1].l, top = Math.max(...l.map((x) => x.kg || 0)); if (!top) return null;
  const oben = l.filter((x) => x.kg === top), pz = typeof fiPlanZiel === 'function' ? fiPlanZiel(u, s) : null;
  if (pz) {   // Plan: alle Sätze am oberen Ende des Bereichs → mehr Gewicht, wieder unten im Bereich anfangen
    if (oben.length < Math.min(2, pz.saetze) || oben.some((x) => x.wdh < pz.max)) return null;
    return { kg: top + info.schritt, wdh: pz.min, alt: top, saetze: oben.length, ziel: pz.max };
  }
  const ziel = oben[0].wdh;
  if (oben.length < 2 || ziel < 8 || oben.some((x) => x.wdh < ziel)) return null;
  return { kg: top + info.schritt, wdh: ziel, alt: top, saetze: oben.length, ziel };
}
function fiEingabe(u, s) {
  const pz0 = typeof fiPlanZiel === 'function' ? fiPlanZiel(u, s) : null, st = fiSteigerung(u, s), v0 = st ? { kg: st.kg, wdh: st.wdh } : fiVorschlag(u, s), v = pz0 && !st && !s.aktiv.eintraege.some((x) => x.u === u.id) && v0.wdh != null && (v0.wdh < pz0.min || v0.wdh > pz0.max) ? { ...v0, wdh: pz0.min } : v0, heute = s.aktiv.eintraege.filter((x) => x.u === u.id), hist = fiVerlauf(u.id, s), vorher = hist.length ? hist[hist.length - 1] : null;
  const letztes = vorher ? 'Letztes Mal (' + fiDatum(vorher.t) + '): ' + (u.art === 'ausdauer' ? vorher.l.map((x) => fiZahl(x.km, 2) + ' km in ' + fiZeit(x.sek)).join(', ') : vorher.l.map((x) => (x.kg ? fiZahl(x.kg) + '×' : '') + x.wdh).join(' · ')) : 'Zum ersten Mal – viel Erfolg!';
  const stepper = (id, wert, label, schritt) => '<div class="fi-stepper"><span>' + label + '</span><div><button type="button" data-schritt="' + id + '" data-d="-' + schritt + '" aria-label="' + label + ' weniger">−</button><input id="' + id + '" inputmode="decimal" value="' + wert + '" aria-label="' + label + '"><button type="button" data-schritt="' + id + '" data-d="' + schritt + '" aria-label="' + label + ' mehr">+</button></div></div>';
  const felder = u.art === 'ausdauer'
    ? stepper('fiKm', fiZahl(v.km, 2), 'Strecke (km)', 0.5) + stepper('fiMin', fiZeit(v.sek), 'Dauer (min:s)', 60) + '<p class="fi-tempo" id="fiTempo"></p>'
    : stepper('fiKg', fiZahl(v.kg || 0, 2), u.kg0 ? 'Zusatzgewicht (kg)' : 'Gewicht (kg)', 2.5) + stepper('fiWdh', v.wdh || 10, 'Wiederholungen', 1);
  const info = fiInfo(u);
  return '<div class="fi-eingabe"><div class="fi-ue-kopf">' + fiIcon(info) + '<div><h3>' + fiEsc(u.name) + '</h3><small>' + fiMuskelText(info) + '</small>' + (typeof fiPlanZiel === 'function' && fiPlanZiel(u, s) ? '<em class="fi-ziel">🎯 Ziel ' + fiZielText(fiPlanZiel(u, s)) + ' Wdh. · Satz ' + Math.min(heute.length + 1, fiPlanZiel(u, s).saetze) + '/' + fiPlanZiel(u, s).saetze + '</em>' : '') + '</div></div><p class="fi-letztes">' + letztes + '</p>'
    + (st ? '<p class="fi-steigern" id="fiSteigern">📈 Letztes Mal ' + st.saetze + '× ' + st.ziel + ' mit ' + fiZahl(st.alt) + ' kg geschafft – heute <b>' + fiZahl(st.kg) + ' kg</b>? <button type="button" id="fiWieLetztes">lieber ' + fiZahl(st.alt) + ' kg</button></p>' : '')
    + felder
    + '<button type="button" class="fi-satz" id="fiSatz">✓ ' + (u.art === 'ausdauer' ? 'Speichern' : 'Satz ' + (heute.length + 1) + ' speichern') + '</button>'
    + (info && info.tipps && info.tipps.length ? '<details class="fi-tipps"><summary>💡 Technik-Tipps</summary><ul>' + info.tipps.map((t) => '<li>' + t + '</li>').join('') + '</ul></details>' : '')
    + (heute.length ? '<div class="fi-heute">' + heute.map((x, i) => '<span>' + (u.art === 'ausdauer' ? fiZahl(x.km, 2) + ' km · ' + fiZeit(x.sek) : (i + 1) + '. ' + (x.kg ? fiZahl(x.kg) + ' kg × ' : '') + x.wdh) + (x.pr ? ' 🏆' : '') + '<button type="button" data-weg="' + a(x, s) + '" aria-label="Eintrag löschen">×</button></span>').join('') + '</div>' : '')
    + '</div>';
  function a(x, st) { return st.aktiv.eintraege.indexOf(x); }
}
// Zahl aus Eingabe (Komma oder Punkt), Zeit „mm:ss“ oder „h:mm:ss“
function fiLies(id) {
  const t = String($(id).value).trim().replace(',', '.');
  if (id === 'fiMin') { const p = t.split(':').map(Number); if (p.some((x) => !Number.isFinite(x))) return NaN; return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : p[0] * 60; }
  return Number(t);
}
function fiEingabeVerdrahten(u) {
  const tempo = () => { if (!$('fiTempo')) return; const km = fiLies('fiKm'), sek = fiLies('fiMin'); $('fiTempo').textContent = km > 0 && sek > 0 ? '⏱ ' + fiZeit(sek / km) + ' min/km · ' + fiZahl(km / (sek / 3600), 1) + ' km/h' : ''; };
  $('fiInhalt').querySelectorAll('[data-schritt]').forEach((b) => {
    let wdh = null;
    const schritt = () => {
      const id = b.dataset.schritt, d = Number(b.dataset.d);
      if (id === 'fiMin') { const s = Math.max(0, (fiLies(id) || 0) + d); $(id).value = fiZeit(s); }
      else { const min = 0, w = Math.max(min, Math.round(((fiLies(id) || 0) + d) * 100) / 100); $(id).value = id === 'fiWdh' ? Math.max(1, Math.round(w)) : fiZahl(w, 2); }
      tempo();
    };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); schritt(); wdh = setTimeout(function lauf() { schritt(); wdh = setTimeout(lauf, 90); }, 450); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => { clearTimeout(wdh); wdh = null; }));
  });
  ['fiKm', 'fiMin'].forEach((id) => { if ($(id)) $(id).addEventListener('input', tempo); });
  tempo();
  $('fiSatz').addEventListener('click', () => fiSatzSpeichern(u));
  if ($('fiWieLetztes')) $('fiWieLetztes').addEventListener('click', () => { const st = fiSteigerung(u, fiStore()); if (st) $('fiKg').value = fiZahl(st.alt, 2); $('fiSteigern').remove(); });
  $('fiInhalt').querySelectorAll('[data-weg]').forEach((b) => b.addEventListener('click', () => {
    const s = fiStore(); s.aktiv.eintraege.splice(+b.dataset.weg, 1); fiSpeichern(s); fiTrainingZeichnen();
  }));
}
function fiSatzSpeichern(u) {
  const s = fiStore(); if (!s.aktiv) return;
  let x;
  if (u.art === 'ausdauer') {
    const km = fiLies('fiKm'), sek = fiLies('fiMin');
    if (!(km > 0 && km < 1000 && sek > 0 && sek < 86400)) { fiHinweis('Bitte Strecke und Dauer prüfen.'); return; }
    x = { u: u.id, km: Math.round(km * 100) / 100, sek: Math.round(sek), t: Date.now() };
  } else {
    const kg = fiLies('fiKg'), wdh = Math.round(fiLies('fiWdh'));
    if (!(kg >= 0 && kg < 1000 && wdh >= 1 && wdh < 1000)) { fiHinweis('Bitte Gewicht und Wiederholungen prüfen.'); return; }
    x = { u: u.id, kg: Math.round(kg * 100) / 100, wdh, t: Date.now() };
  }
  s.aktiv.eintraege.push(x);
  const neu = fiNeueBestwerte(x, s); if (neu.length) x.pr = true;
  fiSpeichern(s);
  if (u.art === 'kraft') fi.pauseEnde = Date.now() + s.pause * 1000;
  const weiter = typeof fiPlanWeiter === 'function' ? fiPlanWeiter(s) : null;
  fiTrainingZeichnen();
  if (weiter === 'fertig' && !neu.length) fiHinweis('✅ Alle Plan-Übungen geschafft – „Training beenden“ nicht vergessen!', true);
  else if (weiter && !neu.length) fiHinweis('➡️ Weiter mit ' + weiter);
  if (neu.length) { fiHinweis('🏆 ' + neu.join(' · '), true); if (typeof konfetti === 'function') konfetti(25, ['🏆', '💪', '✨']); }
}
function fiHinweis(text, gut) {
  const d = document.createElement('div'); d.className = 'fi-toast' + (gut ? ' gut' : ''); d.textContent = text; d.setAttribute('role', 'status');
  document.body.appendChild(d); setTimeout(() => d.remove(), 3200);
}
// Pausen-Timer und Trainingsdauer – rechnet mit Zeitstempeln, läuft also auch nach Sperrbildschirm richtig weiter
function fiTimerAn() {
  clearInterval(fiTimer);
  const tick = () => {
    const s = fiStore(); if (!s.aktiv || !$('fiDauer')) { clearInterval(fiTimer); return; }
    $('fiDauer').textContent = '⏱ ' + fiZeit((Date.now() - s.aktiv.start) / 1000);
    const p = $('fiPause'), rest = Math.ceil(((fi && fi.pauseEnde) - Date.now()) / 1000);
    if (fi && fi.pauseEnde && rest > -3) {
      p.hidden = false;
      p.innerHTML = rest > 0 ? '<b>Pause ' + fiZeit(rest) + '</b><span><button type="button" data-pause="-15">−15 s</button><button type="button" data-pause="15">+15 s</button><button type="button" data-pause="x">Überspringen</button></span>' : '<b class="fi-weiter">Weiter geht’s! 💪</b>';
      p.style.setProperty('--fort', Math.max(0, Math.min(1, rest / s.pause)));
      p.querySelectorAll('[data-pause]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.pause === 'x') fi.pauseEnde = 0; else fi.pauseEnde += Number(b.dataset.pause) * 1000; tick(); }));
      if (rest <= 0 && !fi.gepiept) { fi.gepiept = true; fiPiep(); }
      if (rest > 0) fi.gepiept = false;
    } else { p.hidden = true; if (fi) fi.pauseEnde = 0; }
  };
  tick(); fiTimer = setInterval(tick, 500);
}
function fiTimerAus() { clearInterval(fiTimer); fiTimer = null; }
function fiPiep() {
  try { const A = ftAudio(); if (!A || A.stumm) return; const t = A.c.currentTime + 0.02; [0, 0.18].forEach((d) => { const o = A.c.createOscillator(), g = A.c.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.3, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.15); o.connect(g).connect(A.master); o.start(t + d); o.stop(t + d + 0.16); }); } catch (e) { /* ohne Ton */ }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}
// Bildschirm während des Trainings anlassen (wo der Browser es kann)
async function fiWachAn() { try { if ('wakeLock' in navigator && !fiWach) { fiWach = await navigator.wakeLock.request('screen'); fiWach.addEventListener('release', () => { fiWach = null; }); } } catch (e) { fiWach = null; } }
function fiWachAus() { try { if (fiWach) fiWach.release(); } catch (e) { /* egal */ } fiWach = null; }
document.addEventListener('visibilitychange', () => { if (!document.hidden && fi && $('screen-fitness').classList.contains('active') && fiStore().aktiv) fiWachAn(); });

function fiUebungWaehlen() {
  const s = fiStore(), alle = fiUebungen(s);
  const passt = (u, g) => { if (!g) return true; const grp = FI_GRUPPEN.find((x) => x[0] === g); const info = fiInfo(u); if (!grp[1]) return u.art === 'ausdauer'; return u.art === 'kraft' && info && grp[1].includes(info.p[0]); };
  const karten = (g) => alle.filter((u) => passt(u, g)).map((u) => '<button type="button" class="fi-ue-karte" data-neu="' + u.id + '">' + fiIcon(fiInfo(u)) + '<b>' + fiEsc(u.name) + '</b><small>' + (fiInfo(u) ? FI_MUSKELN[fiInfo(u).p[0]].name : u.art === 'ausdauer' ? 'Ausdauer' : 'Eigene') + '</small></button>').join('');
  const gruppeIcon = (g) => { const grp = FI_GRUPPEN.find((x) => x[0] === g); const w = {}; (grp[1] || ['quad', 'waden']).forEach((m) => { w[m] = 'p'; }); return '<span class="fi-icon">' + fiKoerper(w, grp[1] && grp[1].every((m) => FI_MUSKELN[m].seite === 'h') || g === 'Rücken' ? 'h' : 'v') + '</span>'; };
  const html = '<h3>Übung wählen</h3><div class="fi-filter"><button type="button" class="an" data-filter="">Alle</button>' + FI_GRUPPEN.map(([g]) => '<button type="button" data-filter="' + g + '">' + gruppeIcon(g) + g + '</button>').join('') + '</div>'
    + '<div class="fi-ue-raster" id="fiRaster">' + karten('') + '</div>'
    + '<h4 class="fi-gruppe">Eigene Übung anlegen</h4><div class="fi-eigen"><input id="fiEigenName" placeholder="Name, z. B. Hip Thrust" maxlength="40"><select id="fiEigenArt"><option value="kraft">Kraft</option><option value="kg0">Kraft ohne Gewicht</option><option value="ausdauer">Ausdauer</option></select>'
    + '<select id="fiEigenMuskel" aria-label="Hauptmuskel"><option value="">Hauptmuskel (optional)</option>' + Object.entries(FI_MUSKELN).map(([k, m]) => '<option value="' + k + '">' + m.name + '</option>').join('') + '</select><button type="button" class="btn" id="fiEigenOk">Anlegen</button></div>';
  const d = skDialog(html);
  const verdrahten = () => d.querySelectorAll('[data-neu]').forEach((b) => b.addEventListener('click', () => { d.close(); fi.uebung = b.dataset.neu; fiTrainingZeichnen(); }));
  d.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { d.querySelectorAll('[data-filter]').forEach((x) => x.classList.toggle('an', x === b)); d.querySelector('#fiRaster').innerHTML = karten(b.dataset.filter); verdrahten(); }));
  verdrahten();
  d.querySelector('#fiEigenOk').addEventListener('click', () => {
    const name = d.querySelector('#fiEigenName').value.trim().slice(0, 40); if (!name) return;
    const art = d.querySelector('#fiEigenArt').value, st = fiStore(), id = 'x' + Date.now().toString(36);
    const muskel = d.querySelector('#fiEigenMuskel').value;
    st.eigene.push({ id, name, art: art === 'ausdauer' ? 'ausdauer' : 'kraft', gruppe: 'Eigene', kg0: art === 'kg0', muskel: FI_MUSKELN[muskel] ? muskel : null }); fiSpeichern(st);
    d.close(); fi.uebung = id; fiTrainingZeichnen();
  });
}
function fiBeenden() {
  const s = fiStore(), a = s.aktiv; if (!a) return;
  if (!a.eintraege.length) { if (confirm('Noch nichts eingetragen – Training verwerfen?')) { s.aktiv = null; fiSpeichern(s); fiStart(); } return; }
  a.ende = Date.now(); s.einheiten.push(a); s.aktiv = null;
  if (a.plan && s.planAktiv && s.planAktiv.id === a.plan.id && typeof fiPlan === 'function') { const p = fiPlan(a.plan.id, s); if (p) s.planAktiv.naechster = (a.plan.tag + 1) % p.tage.length; }
  fiSpeichern(s);
  fiTimerAus(); fiWachAus();
  const saetze = a.eintraege.filter((x) => x.wdh != null), volumen = saetze.reduce((v, x) => v + x.kg * x.wdh, 0), km = a.eintraege.reduce((v, x) => v + (x.km || 0), 0), prs = a.eintraege.filter((x) => x.pr).length;
  const info = (saetze.length ? saetze.length + ' Sätze' : '') + (km ? (saetze.length ? ' · ' : '') + fiZahl(km, 1) + ' km' : '');
  if (typeof merkeVerlauf === 'function') merkeVerlauf('fitness', 0, 0, info + (prs ? ' · ' + prs + ' Bestwert' + (prs > 1 ? 'e' : '') : ''), { saetze: saetze.length, volumen: Math.round(volumen), km: Math.round(km * 100) / 100, minuten: Math.round((a.ende - a.start) / 60000) });
  const d = document.createElement('div'); d.className = 'ft-ergebnis';
  d.innerHTML = '<div class="ft-karte fi-karte"><div class="fi-logo">💪</div><h3>Training geschafft!</h3>'
    + '<div class="fi-kacheln"><div><b>' + fiDauer(a.ende - a.start).replace(/ (min|h)$/, '') + '</b><span>' + ((a.ende - a.start) >= 3600e3 ? 'Stunden' : 'Minuten') + '</span></div>'
    + (saetze.length ? '<div><b>' + saetze.length + '</b><span>Sätze</span></div><div><b>' + fiZahl(volumen / 1000, 1) + ' t</b><span>bewegt</span></div>' : '')
    + (km ? '<div><b>' + fiZahl(km, 1) + '</b><span>km</span></div>' : '') + '</div>'
    + (prs ? '<p class="ft-gross">🏆 <b>' + prs + '</b> neue' + (prs > 1 ? '' : 'r') + ' Bestwert' + (prs > 1 ? 'e' : '') + '</p>' : '')
    + '<p class="fi-zusammen">' + fiEinheitText(a, s) + '</p>'
    + '<div class="ft-karte-knoepfe">' + (typeof sbDialog === 'function' ? '<button type="button" class="btn ft-los fi-los-btn" id="fiSichernJetzt">💾 Training gleich sichern</button>' : '') + '<button type="button" class="btn ' + (typeof sbDialog === 'function' ? 'secondary' : 'ft-los fi-los-btn') + '" id="fiFertig">Zur Übersicht</button></div></div>';
  $('fiInhalt').appendChild(d);
  if (prs && typeof konfetti === 'function') konfetti(30, ['💪', '🏆', '✨']);
  $('fiFertig').addEventListener('click', () => { d.remove(); fiStart(); });
  if ($('fiSichernJetzt')) $('fiSichernJetzt').addEventListener('click', () => { d.remove(); fiStart(); sbDialog(); });
}

// ---------- Fortschritt einer Übung ----------
function fiDetail(id) {
  fiTimerAus();
  const s = fiStore(), u = fiUebung(id, s), v = fiVerlauf(id, s), b = fiBest(id, s);
  $('fiTitel').textContent = (u.art === 'ausdauer' ? '🏃 ' : '🏋️ ') + u.name;
  const ohneGewicht = u.art === 'kraft' && v.every((x) => x.l.every((y) => !y.kg));
  const was = u.art === 'ausdauer' ? 'Tempo (min/km) – tiefer ist schneller' : ohneGewicht ? 'Meiste Wiederholungen je Training' : 'Geschätztes Maximalgewicht (1RM) je Training';
  const info = fiInfo(u), fw = {}; if (info) { info.p.forEach((m) => { fw[m] = 'p'; }); (info.s || []).forEach((m) => { if (!fw[m]) fw[m] = 's'; }); }
  $('fiInhalt').innerHTML = '<div class="fi-detail">'
    + (info ? '<div class="fi-detail-kopf">' + fiKoerper(fw, 'vh', 'fi-gross') + '<div><p class="fi-muskeln"><b>' + info.p.map((m) => FI_MUSKELN[m].name).join(', ') + '</b>' + (info.s && info.s.length ? '<br><small>mit ' + info.s.map((m) => FI_MUSKELN[m].name).join(', ') + '</small>' : '') + '</p>'
      + (info.tipps && info.tipps.length ? '<ul class="fi-tipps-liste">' + info.tipps.map((t) => '<li>' + t + '</li>').join('') + '</ul>' : '') + '</div></div>' : '')
    + '<div class="fi-kacheln">'
    + (u.art === 'ausdauer' ? '<div><b>' + (b.tempo ? fiZeit(b.tempo) : '–') + '</b><span>bestes Tempo</span></div><div><b>' + fiZahl(b.km, 1) + '</b><span>km am Stück</span></div>'
      : ohneGewicht ? '<div><b>' + b.wdh + '</b><span>Wdh. Bestwert</span></div>' : '<div><b>' + fiZahl(b.kg) + ' kg</b><span>schwerstes × ' + b.kgWdh + '</span></div><div><b>' + fiZahl(b.rm) + ' kg</b><span>geschätztes 1RM</span></div>')
    + '<div><b>' + v.length + '</b><span>Trainings</span></div></div>'
    + '<p class="fi-was">' + was + '</p><canvas id="fiKurve" class="fi-kurve"></canvas>'
    + '<div class="fi-tabelle">' + v.slice().reverse().map((x) => '<div><b>' + fiDatum(x.t) + '</b><span>' + (u.art === 'ausdauer' ? x.l.map((y) => fiZahl(y.km, 2) + ' km · ' + fiZeit(y.sek) + ' · ' + fiZeit(fiTempo(y.sek, y.km)) + '/km').join('<br>') : x.l.map((y) => (y.kg ? fiZahl(y.kg) + '×' : '') + y.wdh + (y.pr ? '🏆' : '')).join(' · ')) + '</span></div>').join('') + '</div>'
    + '<button type="button" class="btn secondary" id="fiZurUebersicht">← Übersicht</button></div>';
  $('fiZurUebersicht').addEventListener('click', fiStart);
  fiKurveZeichnen(v.map((x) => ({ t: x.t, w: fiKennzahl(u, x.l) })), u.art === 'ausdauer');
}
function fiKurveZeichnen(punkte, umgekehrt) {
  const cv = $('fiKurve'), dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 340, H = 200;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const p = punkte.filter((x) => x.w > 0);
  if (p.length < 2) { c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '600 13px system-ui'; c.textAlign = 'center'; c.fillText(p.length ? 'Ab dem zweiten Training entsteht hier die Kurve.' : 'Noch keine Werte.', W / 2, H / 2); return; }
  const L = 46, R = 10, O = 12, U = 26, t0 = p[0].t, t1 = p[p.length - 1].t, mi = Math.min(...p.map((x) => x.w)), ma = Math.max(...p.map((x) => x.w)), span = (ma - mi) || ma * 0.1 || 1;
  const X = (t) => L + (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0)) * (W - L - R), Y = (w) => { const k = (w - (mi - span * 0.1)) / (span * 1.2); return umgekehrt ? O + k * (H - O - U) : H - U - k * (H - O - U); };
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.fillStyle = 'rgba(199,208,245,.6)'; c.font = '600 10px system-ui'; c.textAlign = 'right';
  for (let i = 0; i <= 3; i++) { const w = mi - span * 0.1 + span * 1.2 * i / 3, y = Y(w); c.beginPath(); c.moveTo(L, y); c.lineTo(W - R, y); c.stroke(); c.fillText(umgekehrt ? fiZeit(w) : fiZahl(w, w < 20 ? 1 : 0), L - 6, y + 3); }
  c.textAlign = 'center'; [p[0], p[p.length - 1]].forEach((x) => c.fillText(fiDatum(x.t), Math.min(W - 24, Math.max(L + 20, X(x.t))), H - 8));
  const g = c.createLinearGradient(0, O, 0, H - U); g.addColorStop(0, 'rgba(74,222,128,.28)'); g.addColorStop(1, 'rgba(74,222,128,0)');
  c.beginPath(); p.forEach((x, i) => (i ? c.lineTo(X(x.t), Y(x.w)) : c.moveTo(X(x.t), Y(x.w)))); c.lineTo(X(t1), H - U); c.lineTo(X(t0), H - U); c.closePath(); c.fillStyle = g; c.fill();
  c.strokeStyle = '#4ade80'; c.lineWidth = 2.5; c.lineJoin = 'round'; c.beginPath(); p.forEach((x, i) => (i ? c.lineTo(X(x.t), Y(x.w)) : c.moveTo(X(x.t), Y(x.w)))); c.stroke();
  const best = umgekehrt ? Math.min(...p.map((x) => x.w)) : Math.max(...p.map((x) => x.w));
  p.forEach((x) => { c.fillStyle = x.w === best ? '#fde047' : '#4ade80'; c.beginPath(); c.arc(X(x.t), Y(x.w), x.w === best ? 5 : 3.5, 0, 7); c.fill(); });
}
function fiEinheitZeigen(id) {
  const s = fiStore(), e = s.einheiten.find((x) => x.id === id); if (!e) return;
  const proU = {}; e.eintraege.forEach((x) => { (proU[x.u] = proU[x.u] || []).push(x); });
  const d = skDialog('<h3>🏋️ ' + new Date(e.start).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) + '</h3><p class="fi-letztes">' + new Date(e.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' · ' + Math.round((e.ende - e.start) / 60000) + ' min</p>'
    + Object.entries(proU).map(([u, l]) => '<p><b>' + fiEsc(fiUebung(u, s).name) + '</b><br>' + l.map((x) => (x.wdh != null ? (x.kg ? fiZahl(x.kg) + ' kg × ' : '') + x.wdh : fiZahl(x.km, 2) + ' km · ' + fiZeit(x.sek)) + (x.pr ? ' 🏆' : '')).join(' · ') + '</p>').join('')
    + '<div class="sk-knopfreihe"><button type="button" class="btn secondary" id="fiEinheitWeg">🗑 Training löschen</button></div>');
  d.querySelector('#fiEinheitWeg').addEventListener('click', () => {
    if (!confirm('Dieses Training wirklich löschen?')) return;
    const st = fiStore(); st.einheiten = st.einheiten.filter((x) => x.id !== id); fiSpeichern(st); d.close(); fiStart();
  });
}
function fiExport() {
  const s = fiStore(), z = [['Datum', 'Uhrzeit', 'Übung', 'Art', 'Gewicht (kg)', 'Wiederholungen', 'Strecke (km)', 'Dauer (min:s)'].join(';')];
  s.einheiten.slice().sort((a, b) => a.start - b.start).forEach((e) => e.eintraege.forEach((x) => {
    const u = fiUebung(x.u, s), d = new Date(x.t || e.start);
    z.push([d.toLocaleDateString('de-DE'), d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }), '"' + u.name.replace(/"/g, '""') + '"', u.art, x.kg != null ? String(x.kg).replace('.', ',') : '', x.wdh != null ? x.wdh : '', x.km != null ? String(x.km).replace('.', ',') : '', x.sek != null ? fiZeit(x.sek) : ''].join(';'));
  }));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + z.join('\n')], { type: 'text/csv' })); a.download = 'fitness-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function fiHubText() {
  const el = $('hubFitnessBest'); if (!el) return;
  const s = fiStore(), w = s.einheiten.filter((e) => e.start >= fiWoche(Date.now())).length;
  el.textContent = s.aktiv ? '▶ Training läuft – weitermachen' : s.einheiten.length ? w + (w === 1 ? ' Training' : ' Trainings') + ' diese Woche · ' + s.einheiten.length + ' gesamt' : 'Kraft & Ausdauer tracken';
}
fiHubText();
$('hubFitness').addEventListener('click', () => { merkeZuletzt('fitness'); zoomZu($('hubFitness'), fiOeffnen); });
$('fiZurueck').addEventListener('click', () => {
  const imTraining = !!$('fiInhalt').querySelector('.fi-training'), offen = $('fiInhalt').querySelector('.fi-detail');
  if (offen) { fiStart(); return; }
  fiTimerAus(); fiWachAus(); fi = null; zeigeHub(); fiHubText();
  if (imTraining) { /* das Training bleibt gespeichert und läuft weiter */ }
});
