// 📋 Fitness – Trainingspläne (wie bei Hevy/Strong „Routinen“): Vorlagen, eigene Pläne, geführtes Training mit Zielen
// „Sätze × Wiederholungsbereich“, nächster Trainingstag, Teilen per Code (ohne Server).
// Speicher (in walquiz.fitness.v1): plaene: [{ id, name, info, tage: [{ name, uebungen: [{ u, saetze, min, max }] }] }],
//   planAktiv: { id, naechster } · laufende Einheit: aktiv.plan = { id, tag }
const FI_VORLAGEN = [
  { id: 'v-gk', name: 'Ganzkörper für Einsteiger', info: '2 Tage im Wechsel, 3× pro Woche · ideal zum Start', tage: [
    { name: 'Ganzkörper A', uebungen: [['knie', 3, 8, 12], ['bank', 3, 8, 12], ['rudern', 3, 8, 12], ['schulter', 2, 10, 12], ['crunch', 2, 12, 15]] },
    { name: 'Ganzkörper B', uebungen: [['kreuz', 3, 5, 8], ['schraeg', 3, 8, 12], ['latzug', 3, 8, 12], ['ausfall', 2, 10, 12], ['beinheben', 2, 12, 15]] }] },
  { id: 'v-ou', name: 'Oberkörper / Unterkörper', info: '4× pro Woche · mehr Volumen pro Muskel', tage: [
    { name: 'Oberkörper', uebungen: [['bank', 4, 6, 10], ['rudern', 4, 6, 10], ['schulter', 3, 8, 12], ['latzug', 3, 8, 12], ['bizeps', 2, 10, 15], ['trizeps', 2, 10, 15]] },
    { name: 'Unterkörper', uebungen: [['knie', 4, 6, 10], ['kreuz', 3, 5, 8], ['presse', 3, 10, 12], ['waden', 3, 12, 15], ['crunch', 3, 12, 15]] }] },
  { id: 'v-ppl', name: 'Push / Pull / Beine', info: '3 oder 6 Tage pro Woche · Klassiker für Fortgeschrittene', tage: [
    { name: 'Push', uebungen: [['bank', 4, 6, 10], ['schulter', 3, 8, 12], ['schraeg', 3, 8, 12], ['seit', 3, 12, 15], ['trizeps', 3, 10, 15]] },
    { name: 'Pull', uebungen: [['klimm', 4, 6, 10], ['rudern', 3, 8, 12], ['latzug', 3, 10, 12], ['bizeps', 3, 10, 15]] },
    { name: 'Beine', uebungen: [['knie', 4, 6, 10], ['presse', 3, 10, 12], ['ausfall', 3, 10, 12], ['waden', 4, 12, 15], ['beinheben', 3, 12, 15]] }] },
  { id: 'v-heim', name: 'Zuhause ohne Geräte', info: '3× pro Woche · nur Körpergewicht', tage: [
    { name: 'Zuhause', uebungen: [['liege', 3, 8, 20], ['ausfall', 3, 10, 15], ['dips', 3, 8, 15], ['waden', 3, 15, 25], ['crunch', 3, 15, 20], ['beinheben', 3, 10, 15]] }] },
].map((p) => ({ ...p, vorlage: true, tage: p.tage.map((t) => ({ name: t.name, uebungen: t.uebungen.map(([u, saetze, min, max]) => ({ u, saetze, min, max })) })) }));

const fiPlaene = (s = fiStore()) => FI_VORLAGEN.concat(Array.isArray(s.plaene) ? s.plaene : []);
const fiPlan = (id, s) => fiPlaene(s).find((p) => p.id === id) || null;
const fiZielText = (x) => x.saetze + '× ' + (x.min === x.max ? x.min : x.min + '–' + x.max);
// Plan-Ziel der Übung in der laufenden Einheit (falls nach Plan trainiert wird)
function fiPlanZiel(u, s) {
  const a = s.aktiv; if (!a || !a.plan) return null;
  const p = fiPlan(a.plan.id, s), t = p && p.tage[a.plan.tag]; if (!t) return null;
  return t.uebungen.find((x) => x.u === u.id) || null;
}

// ---------- Übersicht: Karte „Trainingsplan“ ----------
function fiPlanKarte(s) {
  const pa = s.planAktiv && fiPlan(s.planAktiv.id, s);
  if (!pa) return '<div class="fi-plan-karte"><div><b>📋 Trainingsplan</b><small>Mit Plan trainieren: Übungen, Sätze und Ziele stehen schon fest.</small></div><button type="button" class="btn secondary" id="fiPlanWahl">Plan wählen</button></div>';
  const tag = pa.tage[(s.planAktiv.naechster || 0) % pa.tage.length];
  return '<div class="fi-plan-karte an"><div><b>📋 ' + fiEsc(pa.name) + '</b><small>Nächstes Training: <b>' + fiEsc(tag.name) + '</b> · ' + tag.uebungen.length + ' Übungen</small></div>'
    + '<button type="button" class="btn fi-plan-los" id="fiPlanStart">▶ ' + fiEsc(tag.name) + '</button><button type="button" class="fi-plan-mehr" id="fiPlanWahl" aria-label="Plan wechseln">⋯</button></div>';
}
function fiPlanVerdrahten() {
  if ($('fiPlanWahl')) $('fiPlanWahl').addEventListener('click', fiPlanAuswahl);
  if ($('fiPlanStart')) $('fiPlanStart').addEventListener('click', () => {
    const s = fiStore(); if (s.aktiv) { fiTraining(); return; }
    const p = fiPlan(s.planAktiv.id, s), tag = (s.planAktiv.naechster || 0) % p.tage.length;
    s.aktiv = { id: 'e' + Date.now().toString(36), start: Date.now(), eintraege: [], plan: { id: p.id, tag } }; fiSpeichern(s);
    fiTraining();
  });
}
function fiPlanAuswahl() {
  const s = fiStore(), aktiv = s.planAktiv && s.planAktiv.id;
  const zeile = (p) => '<button type="button" class="fi-plan-zeile' + (p.id === aktiv ? ' an' : '') + '" data-plan="' + p.id + '"><b>' + fiEsc(p.name) + (p.id === aktiv ? ' ✓' : '') + '</b><small>' + fiEsc(p.info || p.tage.length + ' Trainingstage') + ' · ' + p.tage.map((t) => fiEsc(t.name)).join(' / ') + '</small></button>';
  const eigene = fiPlaene(s).filter((p) => !p.vorlage);
  const d = skDialog('<h3>📋 Trainingsplan wählen</h3><h4 class="fi-gruppe">Vorlagen</h4><div class="fi-liste">' + FI_VORLAGEN.map(zeile).join('') + '</div>'
    + (eigene.length ? '<h4 class="fi-gruppe">Eigene Pläne</h4><div class="fi-liste">' + eigene.map(zeile).join('') + '</div>' : '')
    + '<div class="fi-plan-knoepfe"><button type="button" class="btn secondary" id="fiPlanNeu">＋ Eigener Plan</button><button type="button" class="btn secondary" id="fiPlanCode">📥 Plan-Code einfügen</button>' + (aktiv ? '<button type="button" class="btn secondary" id="fiPlanAus">Ohne Plan trainieren</button>' : '') + '</div>');
  d.querySelectorAll('[data-plan]').forEach((b) => b.addEventListener('click', () => { d.close(); fiPlanZeigen(b.dataset.plan); }));
  d.querySelector('#fiPlanNeu').addEventListener('click', () => { d.close(); fiPlanBearbeiten(null); });
  d.querySelector('#fiPlanCode').addEventListener('click', () => { d.close(); fiPlanImport(); });
  if (d.querySelector('#fiPlanAus')) d.querySelector('#fiPlanAus').addEventListener('click', () => { const st = fiStore(); st.planAktiv = null; fiSpeichern(st); d.close(); fiStart(); });
}
function fiPlanZeigen(id) {
  const s = fiStore(), p = fiPlan(id, s); if (!p) return;
  const d = skDialog('<h3>📋 ' + fiEsc(p.name) + '</h3>' + (p.info ? '<p class="fi-letztes">' + fiEsc(p.info) + '</p>' : '')
    + p.tage.map((t, i) => '<div class="fi-plan-tag"><b>' + (i + 1) + '. ' + fiEsc(t.name) + '</b>' + t.uebungen.map((x) => { const u = fiUebung(x.u, s); return '<div class="fi-plan-ue">' + fiIcon(fiInfo(u)) + '<span>' + fiEsc(u.name) + '</span><em>' + fiZielText(x) + '</em></div>'; }).join('') + '</div>').join('')
    + '<div class="fi-plan-knoepfe"><button type="button" class="btn fi-plan-los" id="fiPlanAktiv">✓ Diesen Plan nutzen</button><button type="button" class="btn secondary" id="fiPlanTeilen">📤 Als Code teilen</button>'
    + '<button type="button" class="btn secondary" id="fiPlanEdit">✏️ ' + (p.vorlage ? 'Kopie bearbeiten' : 'Bearbeiten') + '</button>' + (p.vorlage ? '' : '<button type="button" class="btn secondary" id="fiPlanWeg">🗑 Löschen</button>') + '</div><p class="ft-klein" id="fiPlanMeldung"></p>');
  d.querySelector('#fiPlanAktiv').addEventListener('click', () => { const st = fiStore(); st.planAktiv = { id: p.id, naechster: 0 }; fiSpeichern(st); d.close(); fiStart(); });
  d.querySelector('#fiPlanTeilen').addEventListener('click', async () => {
    const code = fiPlanCode(p, s), text = 'Mein Trainingsplan „' + p.name + '“ für die Spielekiste – in Fitness › Plan wählen › „Plan-Code einfügen“:\n\n' + code;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(code); d.querySelector('#fiPlanMeldung').textContent = '✓ Code kopiert – einfach in eine Nachricht einfügen.'; } catch (e) { d.querySelector('#fiPlanMeldung').textContent = code; }
  });
  d.querySelector('#fiPlanEdit').addEventListener('click', () => { d.close(); fiPlanBearbeiten(p); });
  if (d.querySelector('#fiPlanWeg')) d.querySelector('#fiPlanWeg').addEventListener('click', () => {
    if (!confirm('Plan „' + p.name + '“ löschen?')) return;
    const st = fiStore(); st.plaene = (st.plaene || []).filter((x) => x.id !== p.id); if (st.planAktiv && st.planAktiv.id === p.id) st.planAktiv = null; fiSpeichern(st); d.close(); fiStart();
  });
}
// ---------- Teilen per Code (ohne Server): „SKPLAN1:“ + Base64 (URL-sicher) eines kompakten JSON ----------
function fiPlanCode(p, s) {
  const eigene = {};
  const kurz = { n: p.name, i: p.info || '', t: p.tage.map((t) => [t.name, t.uebungen.map((x) => { const u = fiUebung(x.u, s); if (!FI_STANDARD.some((y) => y.id === u.id)) eigene[u.id] = [u.name, u.art, u.kg0 ? 1 : 0, u.muskel || '']; return [x.u, x.saetze, x.min, x.max]; })]), e: eigene };
  return 'SKPLAN1:' + btoa(unescape(encodeURIComponent(JSON.stringify(kurz)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fiPlanAusCode(text) {
  const m = /SKPLAN1:([A-Za-z0-9_-]+)/.exec(String(text || '')); if (!m) return { fehler: 'Kein Plan-Code gefunden (er beginnt mit „SKPLAN1:“).' };
  let k; try { k = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return { fehler: 'Der Code ist unvollständig oder beschädigt.' }; }
  const zahl = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  if (!k || typeof k.n !== 'string' || !Array.isArray(k.t) || !k.t.length || k.t.length > 14) return { fehler: 'Der Code enthält keinen gültigen Plan.' };
  for (const [name, l] of k.t) if (typeof name !== 'string' || !Array.isArray(l) || l.length > 30 || !l.every((x) => Array.isArray(x) && typeof x[0] === 'string' && zahl(x[1], 1, 20) && zahl(x[2], 1, 100) && zahl(x[3], x[2], 100))) return { fehler: 'Der Code enthält ungültige Übungen.' };
  return { plan: k };
}
function fiPlanImport() {
  const d = skDialog('<h3>📥 Plan-Code einfügen</h3><p class="fi-letztes">Den Code (beginnt mit „SKPLAN1:“) aus der Nachricht kopieren und hier einfügen – oder die ganze Nachricht.</p><textarea id="fiPlanText" rows="4" class="fi-plan-text" placeholder="SKPLAN1:…"></textarea><button type="button" class="btn fi-plan-los" id="fiPlanOk">Plan übernehmen</button><p class="ft-klein" id="fiPlanFehler"></p>');
  d.querySelector('#fiPlanOk').addEventListener('click', () => {
    const r = fiPlanAusCode(d.querySelector('#fiPlanText').value); if (r.fehler) { d.querySelector('#fiPlanFehler').textContent = '⚠️ ' + r.fehler; return; }
    const s = fiStore(), k = r.plan, umbenannt = {};
    // unbekannte (eigene) Übungen des Absenders anlegen – gleiche Namen werden wiederverwendet
    Object.entries(k.e || {}).forEach(([id, [name, art, kg0, muskel]]) => {
      const da = fiUebungen(s).find((u) => u.name.toLowerCase() === String(name).toLowerCase());
      if (da) { umbenannt[id] = da.id; return; }
      const neu = 'x' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
      s.eigene.push({ id: neu, name: String(name).slice(0, 40), art: art === 'ausdauer' ? 'ausdauer' : 'kraft', gruppe: 'Eigene', kg0: !!kg0, muskel: typeof FI_MUSKELN !== 'undefined' && FI_MUSKELN[muskel] ? muskel : null }); umbenannt[id] = neu;
    });
    const gueltig = (id) => umbenannt[id] || (fiUebungen(s).some((u) => u.id === id) ? id : null);
    const plan = { id: 'p' + Date.now().toString(36), name: k.n.slice(0, 50), info: String(k.i || '').slice(0, 80), tage: k.t.map(([name, l]) => ({ name: String(name).slice(0, 30), uebungen: l.filter((x) => gueltig(x[0])).map((x) => ({ u: gueltig(x[0]), saetze: x[1], min: x[2], max: x[3] })) })) };
    s.plaene = (s.plaene || []).concat([plan]); fiSpeichern(s); d.close(); fiPlanZeigen(plan.id);
  });
}
// ---------- Eigener Plan: einfacher Editor (Tage, Übungen, Sätze, Wiederholungsbereich) ----------
function fiPlanBearbeiten(vorlage) {
  const s = fiStore();
  const p = vorlage && !vorlage.vorlage ? JSON.parse(JSON.stringify(vorlage)) : { id: 'p' + Date.now().toString(36), name: vorlage ? vorlage.name + ' (eigen)' : 'Mein Plan', info: '', tage: vorlage ? JSON.parse(JSON.stringify(vorlage.tage)) : [{ name: 'Tag A', uebungen: [] }] };
  const optionen = fiUebungen(s).map((u) => '<option value="' + u.id + '">' + fiEsc(u.name) + '</option>').join('');
  const zeichnen = () => {
    const d = skDialog('<h3>✏️ Plan bearbeiten</h3><input id="fiPlanName" class="fi-plan-text" maxlength="50" value="' + fiEsc(p.name) + '" aria-label="Name des Plans">'
      + p.tage.map((t, ti) => '<div class="fi-plan-tag"><div class="fi-plan-tagkopf"><input data-tagname="' + ti + '" value="' + fiEsc(t.name) + '" maxlength="30" aria-label="Name des Tages"><button type="button" data-tagweg="' + ti + '" aria-label="Tag löschen">🗑</button></div>'
        + t.uebungen.map((x, xi) => '<div class="fi-plan-ue edit">' + fiIcon(fiInfo(fiUebung(x.u, s))) + '<span>' + fiEsc(fiUebung(x.u, s).name) + '</span><input type="number" min="1" max="20" value="' + x.saetze + '" data-feld="saetze" data-t="' + ti + '" data-x="' + xi + '" aria-label="Sätze">×<input type="number" min="1" max="100" value="' + x.min + '" data-feld="min" data-t="' + ti + '" data-x="' + xi + '" aria-label="Wiederholungen von">–<input type="number" min="1" max="100" value="' + x.max + '" data-feld="max" data-t="' + ti + '" data-x="' + xi + '" aria-label="Wiederholungen bis"><button type="button" data-ueweg="' + ti + ':' + xi + '" aria-label="Übung entfernen">×</button></div>').join('')
        + '<div class="fi-plan-dazu"><select data-neu="' + ti + '">' + optionen + '</select><button type="button" data-dazu="' + ti + '">＋ Übung</button></div></div>').join('')
      + '<div class="fi-plan-knoepfe"><button type="button" class="btn secondary" id="fiTagDazu">＋ Trainingstag</button><button type="button" class="btn fi-plan-los" id="fiPlanSpeichern">💾 Plan speichern</button></div>');
    const merken = () => {
      p.name = d.querySelector('#fiPlanName').value.trim().slice(0, 50) || 'Mein Plan';
      d.querySelectorAll('[data-tagname]').forEach((el) => { p.tage[+el.dataset.tagname].name = el.value.trim().slice(0, 30) || 'Tag'; });
      d.querySelectorAll('[data-feld]').forEach((el) => { const x = p.tage[+el.dataset.t].uebungen[+el.dataset.x], v = Math.max(1, Math.min(el.dataset.feld === 'saetze' ? 20 : 100, Math.round(+el.value) || 1)); x[el.dataset.feld] = v; });
      p.tage.forEach((t) => t.uebungen.forEach((x) => { if (x.max < x.min) x.max = x.min; }));
    };
    d.querySelectorAll('[data-dazu]').forEach((b) => b.addEventListener('click', () => { merken(); const ti = +b.dataset.dazu; p.tage[ti].uebungen.push({ u: d.querySelector('[data-neu="' + ti + '"]').value, saetze: 3, min: 8, max: 12 }); zeichnen(); }));
    d.querySelectorAll('[data-ueweg]').forEach((b) => b.addEventListener('click', () => { merken(); const [ti, xi] = b.dataset.ueweg.split(':').map(Number); p.tage[ti].uebungen.splice(xi, 1); zeichnen(); }));
    d.querySelectorAll('[data-tagweg]').forEach((b) => b.addEventListener('click', () => { merken(); if (p.tage.length > 1) { p.tage.splice(+b.dataset.tagweg, 1); zeichnen(); } }));
    d.querySelector('#fiTagDazu').addEventListener('click', () => { merken(); p.tage.push({ name: 'Tag ' + String.fromCharCode(65 + p.tage.length), uebungen: [] }); zeichnen(); });
    d.querySelector('#fiPlanSpeichern').addEventListener('click', () => {
      merken(); p.tage = p.tage.filter((t) => t.uebungen.length); if (!p.tage.length) { alert('Bitte mindestens eine Übung eintragen.'); p.tage = [{ name: 'Tag A', uebungen: [] }]; return; }
      const st = fiStore(); st.plaene = (st.plaene || []).filter((x) => x.id !== p.id).concat([p]); fiSpeichern(st); d.close(); fiPlanZeigen(p.id);
    });
  };
  zeichnen();
}
// ---------- Geführtes Training: Fortschritt je Plan-Übung ----------
function fiPlanFortschritt(s) {
  const a = s.aktiv, p = a && a.plan && fiPlan(a.plan.id, s), t = p && p.tage[a.plan.tag]; if (!t) return null;
  return { plan: p, tag: t, liste: t.uebungen.map((x) => ({ ...x, fertig: a.eintraege.filter((e) => e.u === x.u).length })) };
}
function fiPlanLeiste(s) {
  const f = fiPlanFortschritt(s); if (!f) return '';
  const alle = f.liste.reduce((n, x) => n + x.saetze, 0), fertig = f.liste.reduce((n, x) => n + Math.min(x.fertig, x.saetze), 0);
  return '<div class="fi-plan-leiste"><div class="fi-plan-kopf"><b>📋 ' + fiEsc(f.tag.name) + '</b><span>' + fertig + '/' + alle + ' Sätze</span></div><div class="fi-plan-balken"><i style="width:' + Math.round(fertig / Math.max(1, alle) * 100) + '%"></i></div>'
    + '<div class="fi-chips">' + f.liste.map((x) => '<button type="button" data-wahl="' + x.u + '" class="fi-chip-icon' + (x.u === fi.uebung ? ' an' : '') + (x.fertig >= x.saetze ? ' fertig' : '') + '">' + fiIcon(fiInfo(fiUebung(x.u, s))) + fiEsc(fiUebung(x.u, s).name) + ' <small>' + Math.min(x.fertig, x.saetze) + '/' + x.saetze + '</small></button>').join('') + '</div></div>';
}
// nach einem Satz: Übung erledigt? → automatisch zur nächsten offenen Plan-Übung
function fiPlanWeiter(s) {
  const f = fiPlanFortschritt(s); if (!f) return null;
  const jetzt = f.liste.find((x) => x.u === fi.uebung); if (!jetzt || jetzt.fertig < jetzt.saetze) return null;
  const offen = f.liste.find((x) => x.fertig < x.saetze); if (!offen) return 'fertig';
  fi.uebung = offen.u; return fiUebung(offen.u, s).name;
}
